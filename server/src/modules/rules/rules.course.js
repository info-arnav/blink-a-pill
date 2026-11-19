const { flag } = require('./rules.helpers');

const antibioticWithoutEnd = (meds) =>
  meds
    .filter((m) => m.is_antibiotic && !m.duration_days)
    .map((m) =>
      flag({
        rule: 'antibiotic_no_duration',
        meds: [m],
        severity: 2,
        title: 'Antibiotic without an end date',
        patient: `${m.display_name} is an antibiotic, but no number of days was recorded. Antibiotics are meant for a set number of days. Please ask your doctor how long to take it.`,
        clinician: `Antibiotic ${m.display_name} recorded without a duration. ICMR 2019 advises a planned, recorded stop date.`,
        reasoning: ['No duration recorded for an antibiotic.'],
        sources: ['icmr_amr_2019', 'who_aware'],
      }),
    );

const unknownMedicines = (meds) =>
  meds
    .filter((m) => !m.ingredients.length)
    .map((m) =>
      flag({
        rule: 'could_not_screen',
        meds: [m],
        severity: 3,
        title: `We could not check ${m.display_name}`,
        patient: `We could not find what ${m.display_name} contains, so we could not check it against your other medicines. Show it to your doctor or pharmacist.`,
        clinician: `Entry "${m.display_name}" did not match a known product; not screened. No result here is not an all-clear.`,
        reasoning: ['The name did not match any product in the medicine list.'],
        sources: [],
      }),
    );

module.exports = { antibioticWithoutEnd, unknownMedicines };
