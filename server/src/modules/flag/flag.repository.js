const db = require('#lib/db');

const COLUMNS = `f.id, f.patient_id, f.rule, f.fingerprint, f.severity, f.title, f.patient_text, f.clinician_text, f.reasoning,
  f.sources, f.medication_ids, f.rules_version, f.status, f.reception_result, f.decision_message, f.decided_at, f.decision_note, f.hold_medication_id, hm.display_name AS hold_medication_name, f.trigger_medication_id,
  f.created_at, f.updated_at, pr.name AS decided_by_name, pr.registration_number AS decided_by_registration,
  pr.registration_council AS decided_by_council`;

const FROM = 'FROM flags f LEFT JOIN prescribers pr ON pr.id = f.decided_by LEFT JOIN medications hm ON hm.id = f.hold_medication_id';

const listForPatient = (patientId, statuses) =>
  db.many(
    `SELECT ${COLUMNS} ${FROM} WHERE f.patient_id = $1 ${statuses ? 'AND f.status = ANY($2::text[])' : ''}
     ORDER BY CASE WHEN f.status IN ('open', 'asked', 'with_prescriber') THEN 0 ELSE 1 END, f.severity, f.created_at DESC`,
    statuses ? [patientId, statuses] : [patientId],
  );

const findById = (id) => db.one(`SELECT ${COLUMNS} ${FROM} WHERE f.id = $1`, [id]);

const allForRecompute = (patientId) => db.many('SELECT id, fingerprint, status FROM flags WHERE patient_id = $1', [patientId]);

const insert = (patientId, f, version, triggerId) =>
  db.one(
    `INSERT INTO flags (patient_id, rule, fingerprint, severity, title, patient_text, clinician_text, reasoning, sources, medication_ids, rules_version, trigger_medication_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
    [patientId, f.rule, f.fingerprint, f.severity, f.title, f.patient_text, f.clinician_text, JSON.stringify(f.reasoning), JSON.stringify(f.sources), f.medication_ids, version, triggerId],
  );

const refresh = (id, f, status) =>
  db.query(
    `UPDATE flags SET severity = $2, title = $3, patient_text = $4, clinician_text = $5, reasoning = $6, sources = $7,
       status = COALESCE($8, status), updated_at = now() WHERE id = $1`,
    [id, f.severity, f.title, f.patient_text, f.clinician_text, JSON.stringify(f.reasoning), JSON.stringify(f.sources), status],
  );

const setStatus = (id, status) => db.query('UPDATE flags SET status = $2, updated_at = now() WHERE id = $1', [id, status]);

const setReception = (id, result) =>
  db.query('UPDATE flags SET reception_result = $2, updated_at = now() WHERE id = $1', [id, result]);

const decide = (id, d) =>
  db.query(
    `UPDATE flags SET status = $2, decision_message = $3, decided_by = $4, decided_at = now(), decision_note = $5,
       hold_medication_id = $6, updated_at = now()
     WHERE id = $1`,
    [id, d.status, d.message ?? null, d.prescriber_id, d.note ?? null, d.hold_medication_id ?? null],
  );

const addEvent = (flagId, e) =>
  db.query('INSERT INTO flag_events (flag_id, actor_type, actor_name, actor_ref, action, note) VALUES ($1, $2, $3, $4, $5, $6)', [
    flagId,
    e.actor_type,
    e.actor_name,
    e.actor_ref ?? null,
    e.action,
    e.note ?? null,
  ]);

const events = (flagIds) =>
  db.many(
    'SELECT id, flag_id, actor_type, actor_name, actor_ref, action, note, created_at FROM flag_events WHERE flag_id = ANY($1::uuid[]) ORDER BY created_at',
    [flagIds],
  );

const notify = (patientId, kind, title, body, flagId) =>
  db.query('INSERT INTO notifications (patient_id, kind, title, body, flag_id) VALUES ($1, $2, $3, $4, $5)', [
    patientId,
    kind,
    title,
    body,
    flagId ?? null,
  ]);

module.exports = { listForPatient, findById, allForRecompute, insert, refresh, setStatus, setReception, decide, addEvent, events, notify };
