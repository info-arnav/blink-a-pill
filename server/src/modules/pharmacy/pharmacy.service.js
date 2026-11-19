const db = require('#lib/db');
const { AppError } = require('#lib/app-error');
const { classesOf } = require('#constants/drug-classes');
const { createSession } = require('#modules/auth/session.service');
const otp = require('#modules/auth/otp.service');
const card = require('#modules/card/card.service');
const drug = require('#modules/drug/drug.service');
const flag = require('#modules/flag/flag.service');
const flagRepo = require('#modules/flag/flag.repository');
const link = require('#modules/link/link.service');
const record = require('#modules/patient/record.service');

const SAY = {
  1: 'Your doctor has not yet confirmed one of your medicine combinations. Please contact them before your next dose of the medicines shown.',
  2: 'There is something about your medicines to check with your doctor at your next visit.',
  3: 'One of your medicines could not be checked automatically. Mention it to your doctor.',
};

const requestCode = (phone) => otp.requestOtp(phone, 'pharmacy');

const verify = async (input) => {
  let pharmacy = await db.one('SELECT id, name, licence_number, phone FROM pharmacies WHERE phone = $1', [input.phone]);
  if (!pharmacy && (!input.name || !input.licence_number)) {
    throw new AppError('REGISTRATION_REQUIRED', 'Enter the shop name and drug licence number to register', 422);
  }
  await otp.verifyOtp(input.phone, 'pharmacy', input.code);
  if (!pharmacy) {
    const taken = await db.one('SELECT id FROM pharmacies WHERE licence_number = $1', [input.licence_number]);
    if (taken) throw new AppError('LICENCE_IN_USE', 'This licence number is already registered to another phone', 409);
    pharmacy = await db.one(
      'INSERT INTO pharmacies (name, licence_number, phone, address) VALUES ($1, $2, $3, $4) RETURNING id, name, licence_number, phone',
      [input.name, input.licence_number, input.phone, input.address ?? null],
    );
  }
  return { token: await createSession('pharmacy', pharmacy.id), pharmacy };
};

const hasAccess = async (patientId, pharmacyId) =>
  Boolean(await db.one('SELECT 1 FROM pharmacy_access WHERE patient_id = $1 AND pharmacy_id = $2 AND revoked_at IS NULL', [patientId, pharmacyId]));

const unlock = async (token, pin, pharmacy) => {
  const patientId = await card.checkPin(token, pin);
  await db.query(
    `INSERT INTO pharmacy_access (patient_id, pharmacy_id) VALUES ($1, $2)
     ON CONFLICT (patient_id, pharmacy_id) DO UPDATE SET granted_at = now(), revoked_at = NULL`,
    [patientId, pharmacy.id],
  );
  return checkpoint(token, pharmacy);
};

const checkpoint = async (token, pharmacy, ip) => {
  const { patient_id: patientId } = await card.findByToken(token);
  if (!(await hasAccess(patientId, pharmacy.id))) return { needs_pin: true };
  await card.logView(patientId, 'pharmacy', pharmacy.id, ip);
  const rec = await record.build(patientId, { openFlagsOnly: false });
  const open = rec.flags.filter((f) => f.is_open);
  const answered = rec.flags.filter((f) => f.decision && f.decision.at && Date.now() - new Date(f.decision.at) < 30 * 86400000);
  const medName = (id) => rec.medications.find((m) => m.id === id)?.name ?? 'a medicine no longer on the list';
  return {
    needs_pin: false,
    patient: { full_name: rec.patient.full_name, age: rec.patient.age, gender: rec.patient.gender },
    nothing_open: open.length === 0,
    open: open.map((f) => ({
      id: f.id,
      severity: f.severity,
      title: f.title,
      medicines: f.medication_ids.map(medName),
      status_label: f.status_label,
      say: SAY[f.severity],
    })),
    answered: answered.map((f) => ({
      id: f.id,
      title: f.title,
      medicines: f.medication_ids.map(medName),
      answer: f.decision.text,
      by: f.decision.by,
      registration: f.decision.registration,
      at: f.decision.at,
    })),
    medication_count: rec.medications.length,
    note: 'This is a limited check of the list the patient keeps. It is not an all-clear. Use your own professional judgement.',
  };
};

const ensureAccess = async (token, pharmacy) => {
  const { patient_id: patientId } = await card.findByToken(token);
  if (!(await hasAccess(patientId, pharmacy.id))) throw new AppError('PIN_REQUIRED', 'Enter the patient PIN first', 403);
  return patientId;
};

const recordCheck = async (token, pharmacy, input) => {
  const patientId = await ensureAccess(token, pharmacy);
  let flagRow = null;
  if (input.flag_id) {
    flagRow = await flag.get(patientId, input.flag_id);
  }
  await db.query('INSERT INTO pharmacy_checks (pharmacy_id, patient_id, flag_id, action, note) VALUES ($1, $2, $3, $4, $5)', [
    pharmacy.id,
    patientId,
    flagRow?.id ?? null,
    input.action,
    input.note ?? null,
  ]);
  const who = { actor_type: 'pharmacy', actor_name: pharmacy.name, actor_ref: `DL ${pharmacy.licence_number}` };
  let sent = null;
  if (flagRow) {
    await flagRepo.addEvent(flagRow.id, { ...who, action: input.action === 'told_patient' ? 'told the patient' : 'asked to message the doctor', note: input.note });
    if (input.action === 'message_doctor' && flag.LIVE.includes(flagRow.status)) {
      const meds = await db.many(
        `SELECT pr.id, pr.name, pr.phone, m.clinic_id FROM medications m JOIN prescribers pr ON pr.id = m.prescriber_id
         WHERE m.id = ANY($1::uuid[]) AND pr.phone IS NOT NULL ORDER BY m.created_at DESC`,
        [flagRow.medication_ids],
      );
      if (!meds.length) {
        sent = { ok: false, reason: 'no_prescriber_phone' };
      } else {
        await link.sendToPrescriber(flagRow, meds[0], meds[0].clinic_id, who);
        sent = { ok: true, doctor: meds[0].name };
      }
    }
  }
  return { recorded: true, at: new Date().toISOString(), sent };
};

const checkMedicine = async (token, pharmacy, productId) => {
  const patientId = await ensureAccess(token, pharmacy);
  const product = await drug.getProduct(productId);
  const candidate = {
    id: '00000000-0000-0000-0000-000000000000',
    display_name: product.name,
    ingredients: product.ingredients,
    dose_amount: 1,
    times: ['as needed'],
    duration_days: null,
    is_antibiotic: product.ingredients.some((p) => classesOf(p.key).includes('antibiotic')),
    prescriber_name: null,
  };
  const found = await flag.evaluateFor(patientId, [candidate]);
  const overlaps = found.filter((f) => f.medication_ids.includes(candidate.id) && f.rule !== 'antibiotic_no_duration');
  await db.query(`INSERT INTO pharmacy_checks (pharmacy_id, patient_id, action, note) VALUES ($1, $2, 'checked_medicine', $3)`, [
    pharmacy.id,
    patientId,
    product.name,
  ]);
  return {
    medicine: { name: product.name, composition: product.composition },
    overlaps: overlaps.map((f) => ({ severity: f.severity, title: f.title, detail: f.clinician_text })),
    note: overlaps.length
      ? 'Possible overlap with the patient list. Use your professional judgement and consider asking the prescriber.'
      : 'No overlap found with the patient list. This is a limited check, not an all-clear.',
  };
};

module.exports = { requestCode, verify, checkpoint, unlock, recordCheck, checkMedicine };
