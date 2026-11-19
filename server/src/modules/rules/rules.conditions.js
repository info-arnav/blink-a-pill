const { classesOf } = require('#constants/drug-classes');
const { flag } = require('./rules.helpers');

const has = (med, test) => med.ingredients.some((p) => test(p.key));
const inClass = (cls) => (key) => classesOf(key).includes(cls);
const isIngredient = (...names) => (key) => names.some((n) => key === n || key.startsWith(`${n} `));

const RULES = [
  {
    rule: 'condition_nsaid_heart_failure',
    when: (c) => c.has('heart_failure'),
    drug: inClass('nsaid'),
    severity: 1,
    title: 'Painkiller with heart failure',
    patient: 'This painkiller can make heart failure worse by holding water in the body.',
    clinician: 'NSAID with heart failure on record: label advises avoiding use in severe heart failure unless benefit outweighs the risk of worsening.',
    sources: ['nsaid_label'],
  },
  {
    rule: 'condition_nsaid_ckd',
    when: (c, ctx) => c.has('ckd') && ctx.egfr == null,
    drug: inClass('nsaid'),
    severity: 2,
    title: 'Painkiller with kidney disease',
    patient: 'This painkiller can make kidney disease worse. Your doctor may want a kidney test.',
    clinician: 'NSAID with chronic kidney disease on record and no recent eGFR: label advises against use in advanced renal disease.',
    sources: ['nsaid_label', 'kdigo_2024'],
  },
  {
    rule: 'condition_metformin_liver',
    when: (c) => c.has('liver'),
    drug: isIngredient('metformin'),
    severity: 2,
    title: 'Metformin with liver disease',
    patient: 'With liver disease, metformin can rarely cause a serious build-up of acid in the blood.',
    clinician: 'Metformin with liver disease on record: label advises avoiding use in hepatic impairment (lactic acidosis).',
    sources: ['metformin_label'],
  },
  {
    rule: 'condition_beta_blocker_asthma',
    when: (c) => c.has('asthma'),
    drug: isIngredient('propranolol', 'carvedilol'),
    severity: 1,
    title: 'Heart medicine that can tighten airways',
    patient: 'This medicine can bring on breathing trouble in people with asthma.',
    clinician: 'Non-selective beta blocker with asthma on record: propranolol and carvedilol labels list bronchial asthma as a contraindication.',
    sources: ['propranolol_label', 'carvedilol_label'],
  },
  {
    rule: 'condition_pioglitazone_heart_failure',
    when: (c) => c.has('heart_failure'),
    drug: isIngredient('pioglitazone'),
    severity: 1,
    title: 'Diabetes medicine with heart failure',
    patient: 'This diabetes medicine can make heart failure worse.',
    clinician: 'Pioglitazone with heart failure on record: boxed warning, contraindicated to start in NYHA class III or IV.',
    sources: ['pioglitazone_label'],
  },
  {
    rule: 'condition_raas_pregnancy',
    when: (c) => c.has('pregnancy'),
    drug: (key) => inClass('arb')(key) || inClass('acei')(key),
    severity: 1,
    title: 'Blood pressure medicine in pregnancy',
    patient: 'This blood pressure medicine can harm an unborn baby. Please contact your doctor soon.',
    clinician: 'ARB or ACE inhibitor with pregnancy on record: boxed warning for fetal toxicity.',
    sources: ['telmisartan_label'],
  },
];

const conditionRules = (meds, conditions, ctx) => {
  const out = [];
  for (const r of RULES) {
    const notes = conditions.filter((c) => r.when({ has: (group) => c.group === group }, ctx));
    if (!notes.length) continue;
    for (const med of meds.filter((m) => has(m, r.drug))) {
      const note = notes[0];
      out.push(
        flag({
          rule: r.rule,
          key: note.group,
          meds: [med],
          severity: r.severity,
          title: r.title,
          patient: `${med.display_name}: ${r.patient} Please ask your doctor.`,
          clinician: `${r.clinician} Entry: ${med.display_name}.`,
          reasoning: [`${note.label} is on the record (${note.source_label}).`, `${med.display_name}: ${med.ingredients.map((p) => p.display).join(' + ')}.`],
          sources: r.sources,
        }),
      );
    }
  }
  return out;
};

module.exports = { conditionRules };
