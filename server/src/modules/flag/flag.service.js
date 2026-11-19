const { notFound } = require('#lib/app-error');
const { RULES_VERSION } = require('#constants/clinical-sources');
const { evaluate } = require('#modules/rules/rules.engine');
const drug = require('#modules/drug/drug.service');
const medicationRepo = require('#modules/medication/medication.repository');
const labRepo = require('#modules/lab/lab.repository');
const repo = require('./flag.repository');

const LIVE = ['open', 'asked', 'with_prescriber'];

const STATUS_LABEL = {
  open: 'Not yet sent to a doctor',
  asked: 'Waiting for the clinic',
  with_prescriber: 'Waiting for the doctor',
  intended: 'Doctor confirmed it is intended',
  not_intended: 'Doctor said it is not intended',
  no_longer_applies: 'No longer applies',
};

const DECISION_TEXT = {
  intended: (doctor) => `${doctor} confirmed this combination is intended. Continue as prescribed.`,
  hold_until_contact: (doctor, medicine) =>
    `${doctor} says this was not intended. Do not take ${medicine ?? 'the medicine in question'} until you hear from the clinic. Keep taking your other medicines.`,
  review_next_visit: (doctor) => `${doctor} says this needs a review. Keep taking your medicines as they are and bring this up at your next visit.`,
};

const decisionText = (flag) => {
  if (!flag.decided_at) return null;
  const doctor = flag.decided_by_name ?? 'Your doctor';
  if (flag.status === 'intended') return DECISION_TEXT.intended(doctor);
  return DECISION_TEXT[flag.decision_message]?.(doctor, flag.hold_medication_name) ?? null;
};

const shape = (f) => ({
  id: f.id,
  rule: f.rule,
  severity: f.severity,
  severity_label: ['', 'Ask soon', 'Check at your next visit', 'For information'][f.severity],
  title: f.title,
  patient_text: f.patient_text,
  clinician_text: f.clinician_text,
  reasoning: f.reasoning,
  sources: f.sources,
  medication_ids: f.medication_ids,
  rules_version: f.rules_version,
  status: f.status,
  status_label: STATUS_LABEL[f.status],
  is_open: LIVE.includes(f.status),
  reception_result: f.reception_result,
  decision: f.decided_at
    ? {
        status: f.status,
        message: f.decision_message,
        text: decisionText(f),
        by: f.decided_by_name,
        registration: f.decided_by_registration,
        council: f.decided_by_council,
        at: f.decided_at,
        note: f.decision_note,
        hold_medication_id: f.hold_medication_id,
      }
    : null,
  created_at: f.created_at,
  updated_at: f.updated_at,
});

const rulesInput = (m) => ({
  id: m.id,
  display_name: m.display_name,
  ingredients: m.ingredients,
  dose_amount: m.dose_amount,
  times: m.times.length ? m.times : ['as needed'],
  duration_days: m.duration_days,
  is_antibiotic: m.is_antibiotic,
  prescriber_name: m.prescriber_name,
});

const context = async (patientId, meds) => {
  const [egfr, childPugh] = await Promise.all([labRepo.latest(patientId, 'egfr'), labRepo.latest(patientId, 'child_pugh')]);
  const keys = meds.flatMap((m) => m.ingredients.map((i) => i.key));
  return {
    egfr: egfr?.value ?? null,
    childPugh: childPugh?.value_text ?? null,
    knownPairs: await drug.knownPairsFor(keys),
  };
};

const evaluateFor = async (patientId, extraMeds = []) => {
  const meds = [...(await medicationRepo.listForPatient(patientId)).map(rulesInput), ...extraMeds];
  return evaluate(meds, await context(patientId, meds));
};

const actorOf = (actor) =>
  actor?.id
    ? { actor_type: actor.role === 'caregiver' ? 'caregiver' : 'patient', actor_name: actor.name ?? 'Patient' }
    : { actor_type: 'system', actor_name: 'blink-a-pill rules' };

const recompute = async (patientId, { actor, reason } = {}) => {
  const found = await evaluateFor(patientId);
  const existing = new Map((await repo.allForRecompute(patientId)).map((f) => [f.fingerprint, f]));
  const raised = [];

  for (const f of found) {
    const prior = existing.get(f.fingerprint);
    if (!prior) {
      const created = await repo.insert(patientId, f, RULES_VERSION);
      await repo.addEvent(created.id, { actor_type: 'system', actor_name: 'blink-a-pill rules', action: 'raised', note: `Rules version ${RULES_VERSION}` });
      if (f.severity < 3) await repo.notify(patientId, 'flag', f.title, 'Tap to see why, and ask your doctor.', created.id);
      raised.push({ ...f, id: created.id });
      continue;
    }
    if (prior.status === 'no_longer_applies') {
      await repo.refresh(prior.id, f, 'open');
      await repo.addEvent(prior.id, { actor_type: 'system', actor_name: 'blink-a-pill rules', action: 'raised again' });
      raised.push({ ...f, id: prior.id });
    } else if (LIVE.includes(prior.status)) {
      await repo.refresh(prior.id, f, null);
    }
  }

  const current = new Set(found.map((f) => f.fingerprint));
  for (const [fingerprint, prior] of existing) {
    if (current.has(fingerprint) || !LIVE.includes(prior.status)) continue;
    await repo.setStatus(prior.id, 'no_longer_applies');
    await repo.addEvent(prior.id, { ...actorOf(actor), action: 'no longer applies', note: reason ?? 'The medicines involved changed' });
  }
  return raised;
};

const list = async (patientId, { openOnly } = {}) =>
  (await repo.listForPatient(patientId, openOnly ? LIVE : null)).map(shape);

const get = async (patientId, flagId) => {
  const flag = await repo.findById(flagId);
  if (!flag || (patientId && flag.patient_id !== patientId)) throw notFound('Flag');
  return flag;
};

const withHistory = async (patientId, flagId) => {
  const flag = await get(patientId, flagId);
  const events = await repo.events([flag.id]);
  const meds = (await medicationRepo.findManyByIds(flag.medication_ids)).map((m) => ({ id: m.id, name: m.display_name, status: m.status }));
  return { ...shape(flag), medications: meds, events };
};

module.exports = { recompute, list, get, withHistory, evaluateFor, rulesInput, shape, decisionText, LIVE };
