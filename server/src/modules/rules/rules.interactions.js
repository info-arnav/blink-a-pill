const { classesOf } = require('#constants/drug-classes');
const { names, joinNames, flag, prescriberNote } = require('./rules.helpers');

const hasClass = (med, cls) => med.ingredients.some((p) => classesOf(p.key).includes(cls));

const PAIRS = [
  {
    rule: 'dual_raas',
    a: 'arb',
    b: 'acei',
    severity: 1,
    title: 'Two blood pressure medicines that act on the same system',
    patient: 'Taking an ARB and an ACE inhibitor together can raise potassium and strain the kidneys. It is rarely intended.',
    clinician: 'Dual RAAS blockade (ARB with ACE inhibitor): risk of hyperkalaemia, hypotension and AKI.',
    sources: ['telmisartan_label', 'kdigo_2024'],
  },
  {
    rule: 'raas_potassium',
    a: ['arb', 'acei'],
    b: 'k_sparing',
    severity: 2,
    title: 'Potassium could build up',
    patient: 'These medicines together can raise the potassium level in your blood. Doctors often check a blood test when they are used together.',
    clinician: 'RAAS blocker with potassium-sparing agent or potassium supplement: hyperkalaemia risk, check potassium and renal function.',
    sources: ['telmisartan_label'],
  },
  {
    rule: 'nsaid_anticoagulant',
    a: 'nsaid',
    b: 'anticoagulant',
    severity: 1,
    title: 'Painkiller with a blood thinner',
    patient: 'This painkiller and your blood thinner together raise the chance of bleeding, including stomach bleeding.',
    clinician: 'NSAID with anticoagulant: increased bleeding risk, including GI bleeding.',
    sources: ['warfarin_label', 'nsaid_label'],
  },
  {
    rule: 'antiplatelet_anticoagulant',
    a: 'antiplatelet',
    b: 'anticoagulant',
    severity: 2,
    title: 'Two medicines that thin the blood',
    patient: 'These two medicines both reduce clotting. Sometimes this is planned, for example after a heart procedure, but it raises the chance of bleeding.',
    clinician: 'Antiplatelet with anticoagulant: confirm indication and planned duration.',
    sources: ['warfarin_label'],
  },
  {
    rule: 'clopidogrel_ppi',
    a: 'cyp_ppi',
    ingredientB: 'clopidogrel',
    severity: 2,
    title: 'Acid medicine may weaken a heart medicine',
    patient: 'Omeprazole-type acid medicines can make clopidogrel work less well. Another acid medicine is often used instead.',
    clinician: 'Clopidogrel with omeprazole or esomeprazole: reduced active metabolite via CYP2C19 inhibition.',
    sources: ['clopidogrel_label'],
  },
  {
    rule: 'statin_cyp3a4',
    a: 'myopathy_statin',
    b: 'strong_cyp3a4_inhibitor',
    severity: 1,
    title: 'Cholesterol medicine with a medicine that raises its level',
    patient: 'This combination can raise the level of your cholesterol medicine and cause muscle damage.',
    clinician: 'Simvastatin or atorvastatin with a strong CYP3A4 inhibitor: myopathy and rhabdomyolysis risk.',
    sources: ['simvastatin_label'],
  },
  {
    rule: 'sulfonylurea_fluoroquinolone',
    a: 'sulfonylurea',
    b: 'fluoroquinolone',
    severity: 2,
    title: 'Antibiotic that can upset blood sugar',
    patient: 'This antibiotic can make blood sugar go very low or very high, especially with your diabetes medicine.',
    clinician: 'Sulfonylurea with fluoroquinolone: dysglycaemia, including severe hypoglycaemia.',
    sources: ['fq_label'],
  },
  {
    rule: 'nitrate_pde5',
    a: 'nitrate',
    b: 'pde5',
    severity: 1,
    title: 'Heart medicine with sildenafil-type medicine',
    patient: 'These two together can drop blood pressure dangerously.',
    clinician: 'Nitrate with PDE5 inhibitor: contraindicated, severe hypotension.',
    sources: ['sildenafil_label'],
  },
  {
    rule: 'ssri_tramadol',
    a: 'ssri',
    b: 'serotonergic_opioid',
    severity: 2,
    title: 'Two medicines that both raise serotonin',
    patient: 'Together these can rarely cause a reaction with confusion, shaking or high temperature.',
    clinician: 'SSRI with tramadol or tapentadol: serotonin syndrome and seizure risk.',
    sources: ['tramadol_label'],
  },
  {
    rule: 'beta_blocker_rate_ccb',
    a: 'beta_blocker',
    b: 'rate_ccb',
    severity: 2,
    title: 'Two medicines that slow the heart',
    patient: 'Both of these slow the heartbeat. Together they can make it too slow.',
    clinician: 'Beta blocker with verapamil or diltiazem: bradycardia and AV block risk.',
    sources: ['verapamil_label'],
  },
];

const matchSide = (med, side, ingredient) => {
  if (ingredient) return med.ingredients.some((p) => p.key === ingredient || p.key.startsWith(`${ingredient} `));
  const list = Array.isArray(side) ? side : [side];
  return list.some((cls) => hasClass(med, cls));
};

const curatedPairs = (meds) => {
  const out = [];
  for (const pair of PAIRS) {
    const left = meds.filter((m) => matchSide(m, pair.a));
    const right = meds.filter((m) => matchSide(m, pair.b, pair.ingredientB));
    for (const a of left) {
      for (const b of right) {
        if (a.id === b.id) continue;
        out.push(
          flag({
            rule: pair.rule,
            meds: [a, b],
            severity: pair.severity,
            title: pair.title,
            patient: `${joinNames(names([a, b]))}: ${pair.patient} Please ask your doctor whether this is intended.`,
            clinician: `${pair.clinician} Entries: ${a.display_name}; ${b.display_name}.`,
            reasoning: [`${a.display_name}: ${a.ingredients.map((p) => p.display).join(' + ')}.`, `${b.display_name}: ${b.ingredients.map((p) => p.display).join(' + ')}.`, prescriberNote([a, b])],
            sources: pair.sources,
          }),
        );
      }
    }
  }
  return out;
};

const tripleWhammy = (meds) => {
  const nsaids = meds.filter((m) => hasClass(m, 'nsaid'));
  const raas = meds.filter((m) => hasClass(m, 'arb') || hasClass(m, 'acei'));
  const diuretics = meds.filter((m) => hasClass(m, 'thiazide') || hasClass(m, 'loop') || hasClass(m, 'k_sparing'));
  if (!nsaids.length || !raas.length || !diuretics.length) return [];
  const involved = [...new Set([nsaids[0], raas[0], diuretics[0]])];
  return [
    flag({
      rule: 'triple_whammy',
      meds: involved,
      severity: 1,
      title: 'Painkiller with two blood pressure medicines that affect the kidneys',
      patient: `${joinNames(names(involved))} together can suddenly reduce kidney function, especially if you get dehydrated. Please ask your doctor whether the painkiller is needed.`,
      clinician: 'NSAID with RAAS blocker and diuretic ("triple whammy"): acute kidney injury risk.',
      reasoning: involved.map((m) => `${m.display_name}: ${m.ingredients.map((p) => p.display).join(' + ')}.`),
      sources: ['nsaid_label', 'kdigo_2024'],
    }),
  ];
};

const SEVERITY = { life_threatening: 1, serious: 2, moderate: 3 };

const datasetPairs = (meds, knownPairs, alreadyFlaggedPairs) => {
  const out = [];
  for (let i = 0; i < meds.length; i += 1) {
    for (let j = i + 1; j < meds.length; j += 1) {
      const a = meds[i];
      const b = meds[j];
      const pairKey = [a.id, b.id].sort().join(',');
      if (alreadyFlaggedPairs.has(pairKey)) continue;
      for (const pa of a.ingredients) {
        for (const pb of b.ingredients) {
          const hit = knownPairs.get([pa.key, pb.key].sort().join('|'));
          if (!hit || !SEVERITY[hit]) continue;
          out.push(
            flag({
              rule: 'listed_interaction',
              key: [pa.key, pb.key].sort().join('+'),
              meds: [a, b],
              severity: SEVERITY[hit],
              title: `Possible interaction: ${pa.display} and ${pb.display}`,
              patient: `${pa.display} (in ${a.display_name}) and ${pb.display} (in ${b.display_name}) are listed as interacting. Please ask your doctor whether this is intended.`,
              clinician: `${pa.display} with ${pb.display}: listed as ${hit.replace('_', '-')} in the open dataset. Needs professional confirmation.`,
              reasoning: [`Listed severity: ${hit.replace('_', ' ')}.`, prescriberNote([a, b])],
              sources: ['dataset'],
            }),
          );
        }
      }
    }
  }
  return out;
};

module.exports = { curatedPairs, tripleWhammy, datasetPairs };
