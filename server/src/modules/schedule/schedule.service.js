const db = require('#lib/db');
const { AppError, notFound } = require('#lib/app-error');
const { todayIst, nowTimeIst, addDays } = require('#lib/dates');
const medicationRepo = require('#modules/medication/medication.repository');

const MEAL = { before: 'before food', after: 'after food', with: 'with food', any: '' };

const activeOn = (m, date) => m.start_date <= date && (!m.end_date || m.end_date >= date);

const logsFor = (patientId, from, to) =>
  db.many(
    'SELECT medication_id, dose_date, dose_time, status, logged_at FROM dose_logs WHERE patient_id = $1 AND dose_date BETWEEN $2 AND $3',
    [patientId, from, to],
  );

const holdsFor = async (patientId) => {
  const rows = await db.many(
    `SELECT f.hold_medication_id, pr.name AS doctor FROM flags f JOIN prescribers pr ON pr.id = f.decided_by
     WHERE f.patient_id = $1 AND f.status = 'not_intended' AND f.decision_message = 'hold_until_contact' AND f.hold_medication_id IS NOT NULL`,
    [patientId],
  );
  return new Map(rows.map((r) => [r.hold_medication_id, r.doctor]));
};

const day = async (patientId, date = todayIst()) => {
  const meds = (await medicationRepo.listForPatient(patientId)).filter((m) => activeOn(m, date));
  const logs = await logsFor(patientId, date, date);
  const holds = await holdsFor(patientId);
  const now = date === todayIst() ? nowTimeIst() : date < todayIst() ? '23:59' : '00:00';
  const doses = meds
    .flatMap((m) =>
      m.times.map((time) => {
        const log = logs.find((l) => l.medication_id === m.id && l.dose_time === time);
        return {
          medication_id: m.id,
          name: m.display_name,
          time,
          amount: `${m.dose_amount} ${m.dose_unit}${m.dose_amount > 1 ? 's' : ''}`,
          meal: MEAL[m.meal],
          is_antibiotic: m.is_antibiotic,
          status: holds.has(m.id) ? 'on_hold' : log?.status ?? (time < now ? 'due' : 'upcoming'),
          hold_note: holds.has(m.id) ? `${holds.get(m.id)} asked you not to take this until you hear from the clinic.` : null,
          logged_at: log?.logged_at ?? null,
        };
      }),
    )
    .sort((a, b) => a.time.localeCompare(b.time) || a.name.localeCompare(b.name));
  const asNeeded = meds.filter((m) => m.frequency === 'SOS').map((m) => ({ medication_id: m.id, name: m.display_name }));
  const next = doses.find((d) => d.status === 'upcoming') ?? doses.find((d) => d.status === 'due') ?? null;
  return { date, now, next, doses, as_needed: asNeeded };
};

const log = async (patientId, actor, input) => {
  const med = await medicationRepo.findById(patientId, input.medication_id);
  if (!med) throw notFound('Medicine');
  if (!med.times.includes(input.time)) throw new AppError('NOT_A_DOSE_TIME', 'That is not one of the dose times for this medicine', 422);
  await db.query(
    `INSERT INTO dose_logs (medication_id, patient_id, dose_date, dose_time, status, logged_by) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (medication_id, dose_date, dose_time) DO UPDATE SET status = EXCLUDED.status, logged_by = EXCLUDED.logged_by, logged_at = now()`,
    [med.id, patientId, input.date ?? todayIst(), input.time, input.status, actor.id],
  );
  return day(patientId, input.date ?? todayIst());
};

const adherence = async (patientId, days = 7) => {
  const to = todayIst();
  const from = addDays(to, -(days - 1));
  const meds = await medicationRepo.listForPatient(patientId, ['active', 'stopped', 'completed']);
  const logs = await logsFor(patientId, from, to);
  const out = [];
  for (let i = 0; i < days; i += 1) {
    const date = addDays(from, i);
    const scheduled = meds.filter((m) => activeOn(m, date) && (m.status === 'active' || m.updated_at.toISOString().slice(0, 10) > date));
    const expected = scheduled.reduce((n, m) => n + m.times.length, 0);
    const dayLogs = logs.filter((l) => l.dose_date === date);
    out.push({
      date,
      expected,
      taken: dayLogs.filter((l) => l.status === 'taken').length,
      missed: dayLogs.filter((l) => l.status === 'missed').length,
    });
  }
  return out;
};

module.exports = { day, log, adherence };
