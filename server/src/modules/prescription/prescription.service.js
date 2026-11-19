const db = require('#lib/db');
const medication = require('#modules/medication/medication.service');
const conditions = require('#modules/condition/condition.service');
const flags = require('#modules/flag/flag.service');

const insert = (row) =>
  db.one(
    `INSERT INTO prescriptions (patient_id, prescriber_id, clinic_id, prescribed_on, reason, source, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [row.patient_id, row.prescriber_id, row.clinic_id, row.prescribed_on ?? null, row.reason ?? null, row.source, row.created_by ?? null],
  );

const create = async (patientId, actor, input, source = 'photo') => {
  const { prescriberId, clinicId } = await medication.resolvePrescriber(input);
  const prescription = await insert({
    patient_id: patientId,
    prescriber_id: prescriberId,
    clinic_id: clinicId,
    prescribed_on: input.prescribed_on,
    reason: input.reason,
    source,
    created_by: actor.id,
  });

  await db.transaction(async (tx) => {
    for (const d of input.diagnoses ?? []) {
      const resolved = conditions.resolve(d.written_as, d.name);
      await conditions.insert(tx, {
        patient_id: patientId,
        ...resolved,
        certainty: d.certainty,
        written_as: d.written_as,
        source,
        prescription_id: prescription.id,
        prescriber_id: prescriberId,
        noted_on: input.prescribed_on ?? new Date().toISOString().slice(0, 10),
      });
    }
  });

  const added = [];
  for (const m of input.medications ?? []) {
    added.push(
      (
        await medication.add(
          patientId,
          actor,
          { ...m, prescribed_on: input.prescribed_on, source },
          { prescriptionId: prescription.id, prescriberId, clinicId, skipRecompute: true },
        )
      ).medication,
    );
  }

  const raised = await flags.recompute(patientId, { actor });
  return { prescription_id: prescription.id, medications: added, new_flags: raised };
};

const list = async (patientId) => {
  const rows = await db.many(
    `SELECT p.id, p.prescribed_on, p.reason, p.source, p.created_at, pr.name AS prescriber_name, pr.speciality, c.name AS clinic_name
     FROM prescriptions p LEFT JOIN prescribers pr ON pr.id = p.prescriber_id LEFT JOIN clinics c ON c.id = p.clinic_id
     WHERE p.patient_id = $1 ORDER BY COALESCE(p.prescribed_on, p.created_at::date) DESC, p.created_at DESC`,
    [patientId],
  );
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [meds, notes] = await Promise.all([
    db.many('SELECT id, prescription_id, display_name, status FROM medications WHERE prescription_id = ANY($1::uuid[]) ORDER BY created_at', [ids]),
    db.many('SELECT id, prescription_id, name, code, certainty, written_as FROM conditions WHERE prescription_id = ANY($1::uuid[]) ORDER BY created_at', [ids]),
  ]);
  return rows.map((r) => ({
    id: r.id,
    prescribed_on: r.prescribed_on,
    added_on: r.created_at,
    reason: r.reason,
    source: r.source,
    doctor: r.prescriber_name,
    speciality: r.speciality,
    clinic: r.clinic_name,
    diagnoses: notes.filter((n) => n.prescription_id === r.id).map((n) => ({ id: n.id, name: n.name, code: n.code, certainty: n.certainty, written_as: n.written_as })),
    medications: meds.filter((m) => m.prescription_id === r.id).map((m) => ({ id: m.id, name: m.display_name, status: m.status })),
  }));
};

module.exports = { create, list };
