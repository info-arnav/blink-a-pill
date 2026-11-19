const db = require('#lib/db');

const SELECT = `
  SELECT m.*, pr.name AS prescriber_name, pr.phone AS prescriber_phone, pr.speciality AS prescriber_speciality,
         pr.registration_number AS prescriber_registration, c.name AS clinic_name, c.reception_phone AS clinic_phone
  FROM medications m
  LEFT JOIN prescribers pr ON pr.id = m.prescriber_id
  LEFT JOIN clinics c ON c.id = m.clinic_id`;

const listForPatient = (patientId, statuses = ['active']) =>
  db.many(`${SELECT} WHERE m.patient_id = $1 AND m.status = ANY($2::text[]) ORDER BY m.created_at`, [patientId, statuses]);

const findById = (patientId, id) => db.one(`${SELECT} WHERE m.patient_id = $1 AND m.id = $2`, [patientId, id]);

const findManyByIds = (ids) => db.many(`${SELECT} WHERE m.id = ANY($1::uuid[])`, [ids]);

const upsertPrescriber = async (prescriber) => {
  if (prescriber.phone) {
    return db.one(
      `INSERT INTO prescribers (name, phone, speciality) VALUES ($1, $2, $3)
       ON CONFLICT (phone) DO UPDATE SET speciality = COALESCE(EXCLUDED.speciality, prescribers.speciality)
       RETURNING id, name, phone, registration_number`,
      [prescriber.name, prescriber.phone, prescriber.speciality ?? null],
    );
  }
  return db.one('INSERT INTO prescribers (name, speciality) VALUES ($1, $2) RETURNING id, name, phone, registration_number', [
    prescriber.name,
    prescriber.speciality ?? null,
  ]);
};

const setPrescriberPhone = (id, phone) =>
  db.query('UPDATE prescribers SET phone = $2 WHERE id = $1 AND phone IS NULL', [id, phone]);

const createClinic = (clinic) =>
  db.one('INSERT INTO clinics (name, reception_phone) VALUES ($1, $2) RETURNING id, name, reception_phone', [
    clinic.name,
    clinic.reception_phone ?? null,
  ]);

const insert = (m) =>
  db.one(
    `INSERT INTO medications (patient_id, product_id, display_name, ingredients, dose_amount, dose_unit, frequency, times, meal,
       start_date, duration_days, end_date, is_antibiotic, prescriber_id, clinic_id, prescribed_on, source, added_by, confirmed_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
     RETURNING id`,
    [
      m.patient_id,
      m.product_id,
      m.display_name,
      JSON.stringify(m.ingredients),
      m.dose_amount,
      m.dose_unit,
      m.frequency,
      m.times,
      m.meal,
      m.start_date,
      m.duration_days,
      m.end_date,
      m.is_antibiotic,
      m.prescriber_id,
      m.clinic_id,
      m.prescribed_on,
      m.source,
      m.added_by,
      m.confirmed_by,
    ],
  );

const updateSchedule = (id, f) =>
  db.query(
    `UPDATE medications SET dose_amount = $2, frequency = $3, times = $4, meal = $5, duration_days = $6, end_date = $7, updated_at = now()
     WHERE id = $1`,
    [id, f.dose_amount, f.frequency, f.times, f.meal, f.duration_days, f.end_date],
  );

const setStatus = (id, status, reason, courseOutcome = null) =>
  db.query(
    `UPDATE medications SET status = $2, status_reason = $3, course_outcome = COALESCE($4, course_outcome), updated_at = now()
     WHERE id = $1`,
    [id, status, reason, courseOutcome],
  );

const setPrescriberAndClinic = (id, prescriberId, clinicId) =>
  db.query('UPDATE medications SET prescriber_id = COALESCE($2, prescriber_id), clinic_id = COALESCE($3, clinic_id) WHERE id = $1', [
    id,
    prescriberId,
    clinicId,
  ]);

const coursesDue = (patientId, today) =>
  db.many(
    `${SELECT} WHERE m.patient_id = $1 AND m.is_antibiotic AND m.status = 'active' AND m.end_date IS NOT NULL AND m.end_date <= $2`,
    [patientId, today],
  );

module.exports = {
  listForPatient,
  findById,
  findManyByIds,
  upsertPrescriber,
  setPrescriberPhone,
  createClinic,
  insert,
  updateSchedule,
  setStatus,
  setPrescriberAndClinic,
  coursesDue,
};
