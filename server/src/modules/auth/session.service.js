const { SignJWT, jwtVerify } = require('jose');
const env = require('#config/env');
const db = require('#lib/db');
const redis = require('#lib/redis');

const secret = new TextEncoder().encode(env.JWT_SECRET);
const TTL_DAYS = 30;

const createSession = async (subjectType, subjectId) => {
  const session = await db.one(
    'INSERT INTO sessions (subject_type, subject_id) VALUES ($1, $2) RETURNING id',
    [subjectType, subjectId],
  );
  return new SignJWT({ typ: subjectType, sid: session.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(subjectId)
    .setIssuedAt()
    .setExpirationTime(`${TTL_DAYS}d`)
    .sign(secret);
};

const verifySession = async (token, expectedType) => {
  let payload;
  try {
    ({ payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] }));
  } catch {
    return null;
  }
  if (payload.typ !== expectedType) return null;
  const cacheKey = `session::${payload.sid}`;
  const cached = await redis.get(cacheKey);
  if (cached === 'revoked') return null;
  if (!cached) {
    const row = await db.one('SELECT revoked_at FROM sessions WHERE id = $1', [payload.sid]);
    const state = !row || row.revoked_at ? 'revoked' : 'live';
    await redis.set(cacheKey, state, 'EX', 300);
    if (state === 'revoked') return null;
  }
  return { id: payload.sub, sessionId: payload.sid };
};

const revokeSession = async (sessionId) => {
  await db.query('UPDATE sessions SET revoked_at = now() WHERE id = $1', [sessionId]);
  await redis.set(`session::${sessionId}`, 'revoked', 'EX', 300);
};

module.exports = { createSession, verifySession, revokeSession };
