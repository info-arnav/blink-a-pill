import 'server-only';
import { readSealed, setSealed, clearCookie } from './seal';

const PHARMACY = 'bap_pharmacy';
const CARD = 'bap_card';

export type PharmacySession = { token: string; name: string; licence: string };

export async function pharmacySession(): Promise<PharmacySession | null> {
  const value = await readSealed(PHARMACY);
  if (!value?.token) return null;
  return { token: value.token, name: value.name, licence: value.licence };
}

export async function startPharmacySession(session: PharmacySession) {
  await setSealed(PHARMACY, session, 60 * 60 * 24 * 30);
}

export async function endPharmacySession() {
  await clearCookie(PHARMACY);
}

export async function cardAccess(token: string): Promise<string | null> {
  const value = await readSealed(CARD);
  return value?.token === token ? value.pin : null;
}

export async function grantCardAccess(token: string, pin: string) {
  await setSealed(CARD, { token, pin }, 60 * 30);
}

export async function endCardAccess() {
  await clearCookie(CARD);
}
