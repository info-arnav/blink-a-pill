const env = require('#config/env');
const { AppError, notFound } = require('#lib/app-error');
const { randomToken, sha256 } = require('#lib/tokens');
const notify = require('#modules/notify/notify.service');
const flag = require('#modules/flag/flag.service');
const flagRepo = require('#modules/flag/flag.repository');
const patient = require('#modules/patient/patient.service');
const record = require('#modules/patient/record.service');
const repo = require('./link.repository');

const initials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => `${p[0].toUpperCase()}.`)
    .join(' ');

const issue = async (flagId, purpose, phone, extra = {}) => {
  const token = randomToken(24);
  await repo.expireOthers(flagId, purpose);
  await repo.create({ token_hash: sha256(token), purpose, flag_id: flagId, phone, ttl_hours: env.LINK_TTL_HOURS, ...extra });
  const path = { reception: 'r', prescriber: 'd', patient_answer: 'a' }[purpose];
  return `${env.PUBLIC_URL}/${path}/${token}`;
};

const sendToPrescriber = async (flagRow, prescriber, clinicId, actor) => {
  const url = await issue(flagRow.id, 'prescriber', prescriber.phone, { prescriber_id: prescriber.id, clinic_id: clinicId });
  await notify.sendOrThrow(prescriber.phone, 'prescriber_request', `link-a-pill: 1 patient needs your decision on their medicines. It takes under a minute: ${url}`);
  await flagRepo.setStatus(flagRow.id, 'with_prescriber');
  await flagRepo.addEvent(flagRow.id, { ...actor, action: 'sent to prescriber', note: `Sent to ${prescriber.name} on WhatsApp` });
};

const ask = async (patientId, flagId, actor, input) => {
  const flagRow = await flag.get(patientId, flagId);
  if (!['open', 'asked', 'with_prescriber'].includes(flagRow.status)) {
    throw new AppError('FLAG_CLOSED', 'This concern has already been answered', 409);
  }
  const person = await patient.get(patientId);
  const prescriber = await repo.upsertPrescriberByPhone(input.prescriber);
  const clinic = input.clinic?.name ? await repo.createClinic(input.clinic) : null;
  await repo.attachToMedications(flagRow.medication_ids, prescriber.id, clinic?.id ?? null);
  const who = { actor_type: actor.role === 'caregiver' ? 'caregiver' : 'patient', actor_name: actor.name ?? person.full_name };
  await flagRepo.addEvent(flagRow.id, { ...who, action: 'asked the doctor', note: `Chose ${prescriber.name}${clinic ? ` at ${clinic.name}` : ''}` });

  if (clinic?.reception_phone) {
    const url = await issue(flagRow.id, 'reception', clinic.reception_phone, { prescriber_id: prescriber.id, clinic_id: clinic.id });
    await notify.sendOrThrow(
      clinic.reception_phone,
      'reception_request',
      `link-a-pill: ${initials(person.full_name)}, a patient of ${prescriber.name}, asked for a quick check of their medicine list against your records. Please open: ${url}`,
    );
    await flagRepo.setStatus(flagRow.id, 'asked');
    await flagRepo.addEvent(flagRow.id, { ...who, action: 'sent to reception', note: `Sent to ${clinic.name} reception on WhatsApp` });
    return { routed_to: 'reception', clinic: clinic.name, doctor: prescriber.name };
  }

  await sendToPrescriber(flagRow, prescriber, clinic?.id ?? null, who);
  return { routed_to: 'prescriber', doctor: prescriber.name };
};

const open = async (token, purpose, { ip, userAgent }) => {
  const link = await repo.findByHash(sha256(token));
  if (!link || link.purpose !== purpose) throw notFound('Link');
  await repo.logOpen(link.id, ip, userAgent);
  if (new Date(link.expires_at) < new Date() && !link.used_at) {
    throw new AppError('LINK_EXPIRED', 'This link has expired. The patient can send a new one from the app.', 410);
  }
  return link;
};

const receptionView = async (token, meta) => {
  const link = await open(token, 'reception', meta);
  const rec = await record.build(link.patient_id);
  const flagRow = await flag.get(null, link.flag_id);
  return {
    clinic: link.clinic_name,
    doctor: link.prescriber_name,
    answered: Boolean(link.used_at),
    result: flagRow.reception_result,
    patient: rec.patient,
    medications: rec.medications.map((m) => ({
      name: m.name,
      dose: `${m.dose_amount} ${m.dose_unit}`,
      how_often: m.frequency_label,
      prescriber: m.prescriber?.name ?? null,
      flagged: flagRow.medication_ids.includes(m.id),
    })),
  };
};

const receptionSubmit = async (token, input, meta) => {
  const link = await open(token, 'reception', meta);
  if (link.used_at) throw new AppError('ALREADY_ANSWERED', 'This check has already been answered', 409);
  const flagRow = await flag.get(null, link.flag_id);
  await repo.markUsed(link.id);
  await flagRepo.setReception(flagRow.id, input.result);
  const who = { actor_type: 'reception', actor_name: `${input.staff_name} (${link.clinic_name} reception)` };
  await flagRepo.addEvent(flagRow.id, { ...who, action: input.result === 'matches' ? 'confirmed list matches records' : 'said list does not match records', note: input.note });
  if (input.result === 'does_not_match') {
    await flagRepo.notify(link.patient_id, 'reception', 'The clinic checked your list', `${link.clinic_name} says your list does not match their records. Please show your prescription at your next visit. Nothing has been changed.`, flagRow.id);
    return { next: 'patient_told' };
  }
  await sendToPrescriber(flagRow, { id: link.prescriber_id, name: link.prescriber_name, phone: link.prescriber_phone }, link.clinic_id, who);
  return { next: 'sent_to_prescriber' };
};

const prescriberView = async (token, meta) => {
  const link = await open(token, 'prescriber', meta);
  const rec = await record.build(link.patient_id, { includeEvents: true });
  const flagRow = await flag.withHistory(null, link.flag_id);
  return {
    doctor: { id: link.prescriber_id, name: link.prescriber_name, speciality: link.prescriber_speciality, needs_registration: !link.registration_number },
    answered: Boolean(link.used_at),
    concern: flagRow,
    record: { ...rec, flags: rec.flags.filter((f) => f.id !== flagRow.id) },
  };
};

const prescriberDecide = async (token, input, meta) => {
  const link = await open(token, 'prescriber', meta);
  if (link.used_at) throw new AppError('ALREADY_ANSWERED', 'You have already answered this', 409);
  if (!link.registration_number && !input.registration_number) {
    throw new AppError('REGISTRATION_REQUIRED', 'Enter your medical registration number', 422);
  }
  if (input.registration_number) await repo.registerPrescriber(link.prescriber_id, input);
  const registration = input.registration_number ?? link.registration_number;
  const doctorName = input.name ?? link.prescriber_name;
  const flagRow = await flag.get(null, link.flag_id);
  if (!flag.LIVE.includes(flagRow.status)) throw new AppError('FLAG_CLOSED', 'This concern is already closed', 409);

  const status = input.decision === 'intended' ? 'intended' : 'not_intended';
  const hold = status === 'not_intended' && input.patient_message === 'hold_until_contact' ? input.hold_medication_id : null;
  if (status === 'not_intended' && input.patient_message === 'hold_until_contact' && !flagRow.medication_ids.includes(hold)) {
    throw new AppError('HOLD_MEDICINE_REQUIRED', 'Choose which medicine the patient should not take for now', 422);
  }
  await flagRepo.decide(flagRow.id, {
    status,
    message: status === 'intended' ? null : input.patient_message,
    prescriber_id: link.prescriber_id,
    note: input.note,
    hold_medication_id: hold,
  });
  await repo.markUsed(link.id);
  await flagRepo.addEvent(flagRow.id, {
    actor_type: 'prescriber',
    actor_name: doctorName,
    actor_ref: `Reg. ${registration}${input.registration_council ?? link.registration_council ? `, ${input.registration_council ?? link.registration_council}` : ''}`,
    action: status === 'intended' ? 'confirmed intended' : 'marked not intended',
    note: input.note,
  });

  const decided = await flag.get(null, flagRow.id);
  const text = flag.decisionText(decided);
  await flagRepo.notify(link.patient_id, 'decision', `${doctorName} answered`, text, flagRow.id);
  const person = await patient.get(link.patient_id);
  const answerUrl = await issue(flagRow.id, 'patient_answer', person.phone);
  const sent = await notify.send(person.phone, 'patient_answer', `link-a-pill: ${doctorName} has answered your question about your medicines. Open: ${answerUrl}`);
  await flagRepo.addEvent(flagRow.id, {
    actor_type: 'system',
    actor_name: 'link-a-pill',
    action: sent.ok ? 'patient told on WhatsApp' : 'patient told in app',
  });
  return { status, patient_message: text };
};

const patientAnswer = async (token, meta) => {
  const link = await open(token, 'patient_answer', meta);
  const decided = await flag.withHistory(null, link.flag_id);
  return {
    title: decided.title,
    answer: decided.decision?.text,
    doctor: decided.decision?.by,
    registration: decided.decision?.registration,
    at: decided.decision?.at,
    medications: decided.medications.map((m) => m.name),
  };
};

module.exports = { ask, sendToPrescriber, receptionView, receptionSubmit, prescriberView, prescriberDecide, patientAnswer, issue };
