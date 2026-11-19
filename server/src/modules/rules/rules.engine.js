const { duplicateIngredients, duplicateClasses, overDailyMax } = require('./rules.duplicates');
const { curatedPairs, tripleWhammy, datasetPairs } = require('./rules.interactions');
const { kidney, liver } = require('./rules.organ');
const { antibioticWithoutEnd, unknownMedicines } = require('./rules.course');
const { conditionRules } = require('./rules.conditions');

const evaluate = (meds, { egfr = null, childPugh = null, knownPairs = new Map(), conditions = [] } = {}) => {
  const curated = [
    ...duplicateIngredients(meds),
    ...duplicateClasses(meds),
    ...overDailyMax(meds),
    ...tripleWhammy(meds),
    ...curatedPairs(meds),
  ];
  const flaggedPairs = new Set(
    curated.filter((f) => f.medication_ids.length === 2).map((f) => f.medication_ids.join(',')),
  );
  const all = [
    ...curated,
    ...datasetPairs(meds, knownPairs, flaggedPairs),
    ...kidney(meds, egfr),
    ...liver(meds, childPugh),
    ...conditionRules(meds, conditions, { egfr }),
    ...antibioticWithoutEnd(meds),
    ...unknownMedicines(meds),
  ];
  const unique = new Map();
  for (const f of all) if (!unique.has(f.fingerprint)) unique.set(f.fingerprint, f);
  return [...unique.values()].sort((a, b) => a.severity - b.severity);
};

module.exports = { evaluate };
