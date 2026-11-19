import 'server-only';
import { EncryptJWT, jwtDecrypt } from 'jose';
import { cookies } from 'next/headers';

const secret = () => {
  const raw = process.env.SESSION_SECRET;
  if (!raw || raw.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  return new Uint8Array(Buffer.from(raw).subarray(0, 32));
};

const secure = process.env.NODE_ENV === 'production';

export async function setSealed(name: string, payload: Record<string, string>, maxAgeSeconds: number, path = '/') {
  const sealed = await new EncryptJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .encrypt(secret());
  (await cookies()).set(name, sealed, { httpOnly: true, secure, sameSite: 'lax', path, maxAge: maxAgeSeconds });
}

export async function readSealed(name: string): Promise<Record<string, string> | null> {
  const raw = (await cookies()).get(name)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtDecrypt(raw, secret());
    return payload as Record<string, string>;
  } catch {
    return null;
  }
}

export async function clearCookie(name: string, path = '/') {
  (await cookies()).set(name, '', { httpOnly: true, secure, sameSite: 'lax', path, maxAge: 0 });
}
