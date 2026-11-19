const { CLASSES, DUPLICATE_CLASSES, MAX_DAILY_MG, classesOf } = require('#constants/drug-classes');
const { dailyMg, names, joinNames, flag, prescriberNote } = require('./rules.helpers');

const duplicateIngredients = (meds) => {
  const byIngredient = new Map();
  for (const med of meds) {
    for (const part of med.ingredients) {
      if (!byIngredient.has(part.key)) byIngredient.set(part.key, { display: part.display, meds: [] });
      byIngredient.get(part.key).meds.push(med);
    }
  }
  const out = [];
  for (const [key, entry] of byIngredient) {
    if (entry.meds.length < 2) continue;
    const doses = entry.meds.map((m) => dailyMg(m, key));
    const known = doses.every((d) => d != null);
    const total = known ? doses.reduce((a, b) => a + b, 0) : null;
    const max = MAX_DAILY_MG[key];
    const over = total != null && max != null && total > max;
    const reasoning = [
      `${entry.display} is an ingredient of ${joinNames(names(entry.meds).map((n) => `"${n}"`))}.`,
      ...entry.meds.map((m, i) =>
        doses[i] != null ? `${m.display_name}: ${doses[i]} mg of ${entry.display} a day.` : `${m.display_name}: daily amount unknown.`,
      ),
      total != null ? `Combined: ${total} mg a day${max ? ` (usual adult maximum ${max} mg)` : ''}.` : 'Combined amount could not be worked out.',
      prescriberNote(entry.meds),
    ];
    out.push(
      flag({
        rule: 'duplicate_ingredient',
        key,
        meds: entry.meds,
        severity: 1,
        title: `Same medicine twice: ${entry.display}`,
        patient: `${joinNames(names(entry.meds))} both contain ${entry.display}. Taking both could mean a double dose${over ? ', and together they go above the usual daily limit' : ''}. This may be intended, or it may be a mix-up between prescriptions. Please ask your doctor.`,
        clinician: `Duplicate active ingredient (${entry.display}) across ${entry.meds.length} entries${total != null ? `, combined ${total} mg/day` : ''}${over ? `, above usual maximum ${max} mg/day` : ''}. Please confirm whether this combination is intended.`,
        reasoning,
        sources: ['cdsco_fdc', 'general'],
      }),
    );
  }
  return out;
};

const duplicateClasses = (meds) => {
  const out = [];
  for (const cls of DUPLICATE_CLASSES) {
    const members = meds.filter((m) => m.ingredients.some((p) => classesOf(p.key).includes(cls)));
    if (members.length < 2) continue;
    const ingredientSets = members.map(
      (m) => new Set(m.ingredients.filter((p) => classesOf(p.key).includes(cls)).map((p) => p.key)),
    );
    const allSame = ingredientSets.every((s) => [...s].every((k) => ingredientSets[0].has(k)) && s.size === ingredientSets[0].size);
    if (allSame) continue;
    const label = CLASSES[cls].label;
    out.push(
      flag({
        rule: 'duplicate_class',
        key: cls,
        meds: members,
        severity: cls === 'nsaid' || cls === 'anticoagulant' ? 1 : 2,
        title: `Two medicines of the same type: ${label}`,
        patient: `${joinNames(names(members))} are both a ${label.toLowerCase()}. Doctors sometimes combine them on purpose, but often one is meant to replace the other. Please ask your doctor.`,
        clinician: `Therapeutic duplication: ${members.length} active ${label} entries. Confirm whether both are intended or one replaces the other.`,
        reasoning: [
          ...members.map((m) => `${m.display_name}: ${m.ingredients.map((p) => p.display).join(' + ')}.`),
          prescriberNote(members),
        ],
        sources: cls === 'nsaid' ? ['nsaid_label'] : ['general'],
      }),
    );
  }
  return out;
};

const overDailyMax = (meds) => {
  const totals = new Map();
  for (const med of meds) {
    for (const part of med.ingredients) {
      const mg = dailyMg(med, part.key);
      if (mg == null) continue;
      const entry = totals.get(part.key) ?? { display: part.display, mg: 0, meds: [] };
      entry.mg += mg;
      entry.meds.push(med);
      totals.set(part.key, entry);
    }
  }
  const out = [];
  for (const [key, entry] of totals) {
    const max = MAX_DAILY_MG[key];
    if (!max || entry.mg <= max || entry.meds.length > 1) continue;
    out.push(
      flag({
        rule: 'over_daily_max',
        key,
        meds: entry.meds,
        severity: 1,
        title: `More ${entry.display} than the usual daily limit`,
        patient: `As entered, ${entry.meds[0].display_name} adds up to ${entry.mg} mg of ${entry.display} a day. The usual adult limit is ${max} mg. Please check the dose with your doctor or pharmacist.`,
        clinician: `${entry.display} ${entry.mg} mg/day as entered, above usual adult maximum ${max} mg/day. Check the dose and frequency.`,
        reasoning: [`${entry.meds[0].display_name}: ${entry.mg} mg a day as entered.`, `Usual adult maximum: ${max} mg a day.`],
        sources: key === 'paracetamol' ? ['paracetamol_liver', 'general'] : ['general'],
      }),
    );
  }
  return out;
};

module.exports = { duplicateIngredients, duplicateClasses, overDailyMax };
