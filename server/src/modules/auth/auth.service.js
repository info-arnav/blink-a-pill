const db = require('#lib/db');
const otp = require('./otp.service');
const session = require('./session.service');
const patient = require('#modules/patient/patient.service');

const request = (phone) => otp.requestOtp(phone, 'user');

const verify = async (input) => {
  await otp.verifyOtp(input.phone, 'user', input.code);
  const user = await db.one(
    `INSERT INTO users (phone, name, whatsapp_consent_at, sharing_consent_at)
     VALUES ($1, $2, CASE WHEN $3 THEN now() END, CASE WHEN $4 THEN now() END)
     ON CONFLICT (phone) DO UPDATE SET
       name = COALESCE(users.name, EXCLUDED.name),
       whatsapp_consent_at = COALESCE(users.whatsapp_consent_at, EXCLUDED.whatsapp_consent_at),
       sharing_consent_at = COALESCE(users.sharing_consent_at, EXCLUDED.sharing_consent_at)
     RETURNING id, phone, name, whatsapp_consent_at, sharing_consent_at`,
    [input.phone, input.name ?? null, input.consent_whatsapp === true, input.consent_sharing === true],
  );
  return { token: await session.createSession('user', user.id), user, patients: await patient.list(user.id) };
};

const me = async (user) => ({
  user: await db.one('SELECT id, phone, name, whatsapp_consent_at, sharing_consent_at FROM users WHERE id = $1', [user.id]),
  patients: await patient.list(user.id),
});

const updateMe = async (user, name) => {
  await db.query('UPDATE users SET name = $2 WHERE id = $1', [user.id, name]);
  return me(user);
};

const logout = (user) => session.revokeSession(user.sessionId);

module.exports = { request, verify, me, updateMe, logout };
