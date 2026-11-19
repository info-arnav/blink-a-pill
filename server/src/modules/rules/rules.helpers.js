const { SOURCES } = require('#constants/clinical-sources');

const DONT_STOP = 'Do not stop or change any medicine on your own.';

const dailyMg = (med, ingredientKey) => {
  const part = med.ingredients.find((i) => i.key === ingredientKey);
  if (!part || part.value == null || part.unit !== 'mg') return null;
  return Number(part.value) * Number(med.dose_amount) * med.times.length;
};

const names = (meds) => meds.map((m) => m.display_name);

const joinNames = (list) => {
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
};

const flag = ({ rule, key = '', meds, severity, title, patient, clinician, reasoning = [], sources = [] }) => {
  const ids = [...new Set(meds.map((m) => m.id))].sort();
  return {
    rule,
    fingerprint: `${rule}:${key}:${ids.join(',')}`,
    severity,
    title,
    patient_text: `${patient} ${DONT_STOP}`,
    clinician_text: clinician,
    reasoning,
    sources: sources.map((s) => SOURCES[s]).filter(Boolean),
    medication_ids: ids,
  };
};

const prescriberNote = (meds) => {
  const who = [...new Set(meds.map((m) => m.prescriber_name).filter(Boolean))];
  if (who.length > 1) return `Prescribed by ${joinNames(who)}.`;
  if (who.length === 1) return `Prescribed by ${who[0]}.`;
  return 'Prescriber not recorded for every entry.';
};

module.exports = { dailyMg, names, joinNames, flag, prescriberNote };
