const db = require('#lib/db');

const COLUMNS = 'p.id, p.full_name, p.birth_year, p.gender, p.phone, p.abha_address, p.weight_kg, p.created_at';

const listForUser = (userId) =>
  db.many(
    `SELECT ${COLUMNS}, m.role, m.relation FROM patients p
     JOIN patient_members m ON m.patient_id = p.id
     WHERE m.user_id = $1 ORDER BY m.role DESC, p.created_at`,
    [userId],
  );

const findById = (id) => db.one(`SELECT ${COLUMNS} FROM patients p WHERE p.id = $1`, [id]);

const create = (tx, data) =>
  tx.one(
    `INSERT INTO patients (full_name, birth_year, gender, phone, created_by) VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [data.full_name, data.birth_year, data.gender, data.phone, data.created_by],
  );

const addMember = (tx, patientId, userId, role, relation) =>
  tx.query(
    `INSERT INTO patient_members (patient_id, user_id, role, relation) VALUES ($1, $2, $3, $4)
     ON CONFLICT (patient_id, user_id) DO NOTHING`,
    [patientId, userId, role, relation ?? null],
  );

const update = (id, fields) => {
  const keys = Object.keys(fields);
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  return db.one(`UPDATE patients SET ${sets} WHERE id = $1 RETURNING id`, [id, ...keys.map((k) => fields[k])]);
};

const members = (patientId) =>
  db.many(
    `SELECT u.id, u.name, u.phone, m.role, m.relation, m.created_at FROM patient_members m
     JOIN users u ON u.id = m.user_id WHERE m.patient_id = $1 ORDER BY m.created_at`,
    [patientId],
  );

const removeCaregiver = (patientId, userId) =>
  db.query(`DELETE FROM patient_members WHERE patient_id = $1 AND user_id = $2 AND role = 'caregiver'`, [
    patientId,
    userId,
  ]);

const createInvite = (code, patientId, userId, relation) =>
  db.one(
    `INSERT INTO caregiver_invites (code, patient_id, created_by, relation, expires_at)
     VALUES ($1, $2, $3, $4, now() + interval '48 hours') RETURNING code, expires_at`,
    [code, patientId, userId, relation ?? null],
  );

const findInvite = (code) =>
  db.one('SELECT * FROM caregiver_invites WHERE code = $1 AND accepted_at IS NULL AND expires_at > now()', [code]);

const acceptInvite = (tx, code, userId) =>
  tx.query('UPDATE caregiver_invites SET accepted_by = $2, accepted_at = now() WHERE code = $1', [code, userId]);


module.exports = {
  listForUser,
  findById,
  create,
  addMember,
  update,
  members,
  removeCaregiver,
  createInvite,
  findInvite,
  acceptInvite,
};
