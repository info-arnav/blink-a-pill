const db = require('#lib/db');

const latest = (patientId, kind) =>
  db.one(
    `SELECT id, kind, value, value_text, unit, measured_on, source FROM lab_values
     WHERE patient_id = $1 AND kind = $2 ORDER BY measured_on DESC, created_at DESC LIMIT 1`,
    [patientId, kind],
  );

const list = (patientId) =>
  db.many(
    `SELECT id, kind, value, value_text, unit, measured_on, source, created_at FROM lab_values
     WHERE patient_id = $1 ORDER BY measured_on DESC, created_at DESC`,
    [patientId],
  );

const insert = (row) =>
  db.one(
    `INSERT INTO lab_values (patient_id, kind, value, value_text, unit, measured_on, source, entered_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, kind, value, value_text, unit, measured_on, source`,
    [row.patient_id, row.kind, row.value ?? null, row.value_text ?? null, row.unit ?? null, row.measured_on, row.source, row.entered_by ?? null],
  );

const remove = (patientId, id) => db.query(`DELETE FROM lab_values WHERE patient_id = $1 AND id = $2 AND source = 'typed'`, [patientId, id]);

module.exports = { latest, list, insert, remove };
