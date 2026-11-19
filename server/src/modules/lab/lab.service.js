const { AppError } = require('#lib/app-error');
const { todayIst } = require('#lib/dates');
const patient = require('#modules/patient/patient.service');
const flags = require('#modules/flag/flag.service');
const { latestLabs } = require('#modules/patient/record.service');
const repo = require('./lab.repository');

const ckdEpi2021 = (creatinineMgDl, age, gender) => {
  const female = gender === 'female';
  const kappa = female ? 0.7 : 0.9;
  const alpha = female ? -0.241 : -0.302;
  const ratio = creatinineMgDl / kappa;
  const value = 142 * Math.min(ratio, 1) ** alpha * Math.max(ratio, 1) ** -1.2 * 0.9938 ** age * (female ? 1.012 : 1);
  return Math.round(value);
};

const childPughClass = ({ bilirubin, albumin, inr, ascites, encephalopathy }) => {
  const points =
    (bilirubin < 2 ? 1 : bilirubin <= 3 ? 2 : 3) +
    (albumin > 3.5 ? 1 : albumin >= 2.8 ? 2 : 3) +
    (inr < 1.7 ? 1 : inr <= 2.3 ? 2 : 3) +
    { none: 1, mild: 2, moderate_severe: 3 }[ascites] +
    { none: 1, grade_1_2: 2, grade_3_4: 3 }[encephalopathy];
  return { points, class: points <= 6 ? 'A' : points <= 9 ? 'B' : 'C' };
};

const UNITS = {
  creatinine: 'mg/dL',
  egfr: 'mL/min/1.73m²',
  potassium: 'mmol/L',
  hba1c: '%',
  fasting_glucose: 'mg/dL',
  bp_systolic: 'mmHg',
  bp_diastolic: 'mmHg',
  alt: 'U/L',
  bilirubin: 'mg/dL',
  albumin: 'g/dL',
  inr: '',
};

const add = async (patientId, actor, input) => {
  const measuredOn = input.measured_on ?? todayIst();
  const saved = [];

  if (input.kind === 'child_pugh') {
    let cls = input.value_text;
    let note = null;
    if (!cls) {
      if (!input.child_pugh) throw new AppError('CHILD_PUGH_REQUIRED', 'Enter the class from the report, or the five values', 422);
      const computed = childPughClass(input.child_pugh);
      cls = computed.class;
      note = `${computed.points} points`;
    }
    saved.push(await repo.insert({ patient_id: patientId, kind: 'child_pugh', value_text: cls, unit: note, measured_on: measuredOn, source: input.child_pugh ? 'computed' : 'typed', entered_by: actor.id }));
  } else {
    saved.push(await repo.insert({ patient_id: patientId, kind: input.kind, value: input.value, unit: UNITS[input.kind] ?? null, measured_on: measuredOn, source: 'typed', entered_by: actor.id }));
    if (input.kind === 'creatinine') {
      const person = await patient.get(patientId);
      const egfr = ckdEpi2021(input.value, person.age, person.gender);
      saved.push(await repo.insert({ patient_id: patientId, kind: 'egfr', value: egfr, unit: UNITS.egfr, measured_on: measuredOn, source: 'computed', entered_by: actor.id }));
    }
  }

  const raised = await flags.recompute(patientId, { actor, reason: 'Lab values changed' });
  return { saved, new_flags: raised };
};

const list = async (patientId) => ({ latest: await latestLabs(patientId), history: await repo.list(patientId) });

const remove = async (patientId, id, actor) => {
  await repo.remove(patientId, id);
  await flags.recompute(patientId, { actor, reason: 'Lab value removed' });
};

module.exports = { add, list, remove, ckdEpi2021, childPughClass };
