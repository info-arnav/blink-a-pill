const db = require('#lib/db');

const create = (row) =>
  db.one(
    `INSERT INTO links (token_hash, purpose, flag_id, phone, prescriber_id, clinic_id, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, now() + make_interval(hours => $7)) RETURNING id, expires_at`,
    [row.token_hash, row.purpose, row.flag_id, row.phone, row.prescriber_id ?? null, row.clinic_id ?? null, row.ttl_hours],
  );

const findByHash = (hash) =>
  db.one(
    `SELECT l.*, f.patient_id, pr.name AS prescriber_name, pr.phone AS prescriber_phone, pr.registration_number,
            pr.registration_council, pr.speciality AS prescriber_speciality, c.name AS clinic_name, c.reception_phone
     FROM links l
     JOIN flags f ON f.id = l.flag_id
     LEFT JOIN prescribers pr ON pr.id = l.prescriber_id
     LEFT JOIN clinics c ON c.id = l.clinic_id
     WHERE l.token_hash = $1`,
    [hash],
  );

const logOpen = (linkId, ip, userAgent) =>
  db.query('INSERT INTO link_opens (link_id, ip, user_agent) VALUES ($1, $2, $3)', [linkId, ip ?? null, (userAgent ?? '').slice(0, 300)]);

const markUsed = (id) => db.query('UPDATE links SET used_at = now() WHERE id = $1', [id]);

const expireOthers = (flagId, purpose) =>
  db.query(`UPDATE links SET expires_at = now() WHERE flag_id = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > now()`, [
    flagId,
    purpose,
  ]);

const registerPrescriber = (id, fields) =>
  db.query(
    `UPDATE prescribers SET registration_number = $2, registration_council = $3, name = COALESCE($4, name), registered_at = now()
     WHERE id = $1`,
    [id, fields.registration_number, fields.registration_council, fields.name ?? null],
  );

const upsertPrescriberByPhone = (p) =>
  db.one(
    `INSERT INTO prescribers (name, phone, speciality) VALUES ($1, $2, $3)
     ON CONFLICT (phone) DO UPDATE SET speciality = COALESCE(EXCLUDED.speciality, prescribers.speciality)
     RETURNING id, name, phone, registration_number`,
    [p.name, p.phone, p.speciality ?? null],
  );

const createClinic = (c) =>
  db.one('INSERT INTO clinics (name, reception_phone) VALUES ($1, $2) RETURNING id, name, reception_phone', [c.name, c.reception_phone ?? null]);

const attachToMedications = (ids, prescriberId, clinicId) =>
  db.query(
    `UPDATE medications SET prescriber_id = COALESCE(prescriber_id, $2), clinic_id = COALESCE(clinic_id, $3) WHERE id = ANY($1::uuid[])`,
    [ids, prescriberId, clinicId],
  );

module.exports = {
  create,
  findByHash,
  logOpen,
  markUsed,
  expireOthers,
  registerPrescriber,
  upsertPrescriberByPhone,
  createClinic,
  attachToMedications,
};
