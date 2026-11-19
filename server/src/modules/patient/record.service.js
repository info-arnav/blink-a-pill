const medication = require('#modules/medication/medication.service');
const flag = require('#modules/flag/flag.service');
const flagRepo = require('#modules/flag/flag.repository');
const labRepo = require('#modules/lab/lab.repository');
const patient = require('./patient.service');

const LAB_LABELS = {
  egfr: 'eGFR (kidney function)',
  creatinine: 'Creatinine',
  child_pugh: 'Child-Pugh class (liver)',
  potassium: 'Potassium',
  hba1c: 'HbA1c (3-month sugar)',
  fasting_glucose: 'Fasting sugar',
  bp_systolic: 'Blood pressure (top number)',
  bp_diastolic: 'Blood pressure (bottom number)',
  alt: 'ALT (liver enzyme)',
  bilirubin: 'Bilirubin',
  albumin: 'Albumin',
  inr: 'INR',
};

const latestLabs = async (patientId) => {
  const all = await labRepo.list(patientId);
  const seen = new Set();
  return all
    .filter((l) => (seen.has(l.kind) ? false : seen.add(l.kind)))
    .map((l) => ({ ...l, label: LAB_LABELS[l.kind] ?? l.kind }));
};

const build = async (patientId, { includeEvents = false, openFlagsOnly = false } = {}) => {
  const [profile, meds, conditions, labs, flags] = await Promise.all([
    patient.get(patientId),
    medication.list(patientId, false),
    patient.conditions(patientId),
    latestLabs(patientId),
    flag.list(patientId, { openOnly: openFlagsOnly }),
  ]);
  const visibleFlags = flags.filter((f) => f.status !== 'no_longer_applies');
  let events = [];
  if (includeEvents && visibleFlags.length) events = await flagRepo.events(visibleFlags.map((f) => f.id));
  return {
    patient: {
      full_name: profile.full_name,
      age: profile.age,
      gender: profile.gender,
      abha_address: profile.abha_address,
      weight_kg: profile.weight_kg,
    },
    medications: meds,
    conditions,
    labs,
    flags: visibleFlags.map((f) => ({ ...f, events: events.filter((e) => e.flag_id === f.id) })),
  };
};

module.exports = { build, latestLabs, LAB_LABELS };
