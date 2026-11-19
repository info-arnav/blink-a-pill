const db = require('#lib/db');

const listForPatient = (patientId) =>
  db.many(
    `SELECT c.id, c.name, c.code, c.condition_key, c.certainty, c.written_as, c.source, c.noted_on, c.created_at,
            c.prescription_id, pr.name AS prescriber_name
     FROM conditions c LEFT JOIN prescribers pr ON pr.id = c.prescriber_id
     WHERE c.patient_id = $1
     ORDER BY COALESCE(c.noted_on, c.created_at::date), c.created_at`,
    [patientId],
  );

const insert = (tx, row) =>
  tx.one(
    `INSERT INTO conditions (patient_id, name, code, condition_key, certainty, written_as, source, prescription_id, prescriber_id, noted_on)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [
      row.patient_id,
      row.name,
      row.code ?? null,
      row.condition_key ?? null,
      row.certainty ?? 'confirmed',
      row.written_as ?? null,
      row.source,
      row.prescription_id ?? null,
      row.prescriber_id ?? null,
      row.noted_on ?? null,
    ],
  );

const remove = (patientId, id) => db.query(`DELETE FROM conditions WHERE patient_id = $1 AND id = $2 AND source = 'typed'`, [patientId, id]);

module.exports = { listForPatient, insert, remove };
