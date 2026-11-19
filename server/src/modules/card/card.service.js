const QRCode = require('qrcode');
const env = require('#config/env');
const db = require('#lib/db');
const redis = require('#lib/redis');
const box = require('#lib/crypto-box');
const { AppError, notFound } = require('#lib/app-error');
const { randomToken, randomDigits } = require('#lib/tokens');

const PIN_LOCK_ATTEMPTS = 5;

const issue = async (tx, patientId) => {
  const token = randomToken(12);
  const pin = randomDigits(6);
  await tx.query(
    `INSERT INTO cards (patient_id, token, pin_hash, rotated_at) VALUES ($1, $2, $3, now())
     ON CONFLICT (patient_id) DO UPDATE SET token = EXCLUDED.token, pin_hash = EXCLUDED.pin_hash, rotated_at = now()`,
    [patientId, token, box.seal(pin)],
  );
  return { token, pin };
};

const cardUrl = (token) => `${env.PUBLIC_URL}/c/${token}`;

const getForPatient = async (patientId) => {
  const card = await db.one('SELECT token, pin_hash, rotated_at FROM cards WHERE patient_id = $1', [patientId]);
  if (!card) throw notFound('Card');
  const url = cardUrl(card.token);
  return {
    token: card.token,
    pin: box.open(card.pin_hash),
    url,
    qr_svg: await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }),
    rotated_at: card.rotated_at,
  };
};

const regenerate = async (patientId) => {
  await db.transaction((tx) => issue(tx, patientId));
  await db.query('UPDATE pharmacy_access SET revoked_at = now() WHERE patient_id = $1 AND revoked_at IS NULL', [patientId]);
  return getForPatient(patientId);
};

const findByToken = async (token) => {
  const card = await db.one('SELECT patient_id, pin_hash FROM cards WHERE token = $1', [token]);
  if (!card) throw notFound('Card');
  return card;
};

const checkPin = async (token, pin) => {
  const card = await findByToken(token);
  const key = `card-pin::${token}`;
  const attempts = Number((await redis.get(key)) ?? 0);
  if (attempts >= PIN_LOCK_ATTEMPTS) {
    throw new AppError('PIN_LOCKED', 'Too many wrong PINs. Ask the patient to try again in 15 minutes.', 429);
  }
  if (box.open(card.pin_hash) !== pin) {
    await redis.multi().incr(key).expire(key, 900).exec();
    throw new AppError('PIN_INVALID', 'That PIN is not right', 400);
  }
  await redis.del(key);
  return card.patient_id;
};

const logView = (patientId, viewer, pharmacyId, ip) =>
  db.query('INSERT INTO card_views (patient_id, viewer, pharmacy_id, ip) VALUES ($1, $2, $3, $4)', [
    patientId,
    viewer,
    pharmacyId,
    ip,
  ]);

const approvedPharmacies = (patientId) =>
  db.many(
    `SELECT ph.id, ph.name, ph.licence_number, a.granted_at FROM pharmacy_access a JOIN pharmacies ph ON ph.id = a.pharmacy_id
     WHERE a.patient_id = $1 AND a.revoked_at IS NULL ORDER BY a.granted_at DESC`,
    [patientId],
  );

const revokePharmacy = (patientId, pharmacyId) =>
  db.query('UPDATE pharmacy_access SET revoked_at = now() WHERE patient_id = $1 AND pharmacy_id = $2', [patientId, pharmacyId]);

const recentViews = (patientId) =>
  db.many(
    `SELECT CASE WHEN v.pharmacy_id IS NOT NULL THEN ph.name || ' (pharmacy)' WHEN v.viewer = 'clinician' THEN 'A clinician with your PIN' ELSE v.viewer END AS viewer,
            v.viewed_at
     FROM card_views v LEFT JOIN pharmacies ph ON ph.id = v.pharmacy_id
     WHERE v.patient_id = $1 ORDER BY v.viewed_at DESC LIMIT 20`,
    [patientId],
  );

module.exports = { issue, getForPatient, regenerate, findByToken, checkPin, logView, cardUrl, approvedPharmacies, revokePharmacy, recentViews };
