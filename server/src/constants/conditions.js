const CONDITIONS = Object.freeze([
  { key: 'type2_diabetes', label: 'Type 2 diabetes', icd: 'E11', aliases: ['t2dm', 'dm2', 'dm type 2', 'type 2 dm', 'niddm', 'diabetes mellitus', 'diabetes', 'dm'] },
  { key: 'type1_diabetes', label: 'Type 1 diabetes', icd: 'E10', aliases: ['t1dm', 'iddm', 'type 1 dm'] },
  { key: 'hypertension', label: 'Hypertension', icd: 'I10', aliases: ['htn', 'high blood pressure', 'essential hypertension', 'high bp'] },
  { key: 'ckd', label: 'Chronic kidney disease', icd: 'N18', aliases: ['ckd', 'chronic kidney disease', 'chronic renal failure', 'crf'] },
  { key: 'ckd3', label: 'Chronic kidney disease, stage 3', icd: 'N18.3', aliases: ['ckd 3', 'ckd stage 3', 'ckd iii'], group: 'ckd' },
  { key: 'ckd4', label: 'Chronic kidney disease, stage 4', icd: 'N18.4', aliases: ['ckd 4', 'ckd stage 4', 'ckd iv'], group: 'ckd' },
  { key: 'ckd5', label: 'Chronic kidney disease, stage 5', icd: 'N18.5', aliases: ['ckd 5', 'ckd stage 5', 'ckd v'], group: 'ckd' },
  { key: 'esrd', label: 'End stage kidney disease', icd: 'N18.6', aliases: ['esrd', 'end stage renal disease', 'on dialysis'], group: 'ckd' },
  { key: 'heart_failure', label: 'Heart failure', icd: 'I50', aliases: ['heart failure', 'chf', 'ccf', 'lvf', 'hfref', 'hfpef', 'cardiac failure'] },
  { key: 'cirrhosis', label: 'Cirrhosis of liver', icd: 'K74.6', aliases: ['cirrhosis', 'liver cirrhosis', 'cld', 'chronic liver disease'], group: 'liver' },
  { key: 'liver_disease', label: 'Liver disease', icd: 'K76.9', aliases: ['liver disease', 'hepatic impairment', 'fatty liver', 'nafld'], group: 'liver' },
  { key: 'asthma', label: 'Asthma', icd: 'J45', aliases: ['asthma', 'bronchial asthma', 'ba'] },
  { key: 'copd', label: 'COPD', icd: 'J44', aliases: ['copd', 'chronic obstructive pulmonary disease'] },
  { key: 'hypothyroidism', label: 'Hypothyroidism', icd: 'E03.9', aliases: ['hypothyroid', 'hypothyroidism'] },
  { key: 'hyperthyroidism', label: 'Hyperthyroidism', icd: 'E05', aliases: ['hyperthyroid', 'hyperthyroidism', 'thyrotoxicosis'] },
  { key: 'ischaemic_heart_disease', label: 'Coronary artery disease', icd: 'I25', aliases: ['cad', 'ihd', 'coronary artery disease', 'ischemic heart disease', 'ischaemic heart disease'] },
  { key: 'atrial_fibrillation', label: 'Atrial fibrillation', icd: 'I48', aliases: ['af', 'afib', 'atrial fibrillation'] },
  { key: 'epilepsy', label: 'Epilepsy', icd: 'G40', aliases: ['epilepsy', 'seizure disorder', 'seizures'] },
  { key: 'pregnancy', label: 'Pregnancy', icd: 'Z33.1', aliases: ['pregnant', 'pregnancy', 'primigravida', 'g1p0', 'g2p1'] },
  { key: 'dyslipidaemia', label: 'High cholesterol', icd: 'E78.5', aliases: ['dyslipidemia', 'dyslipidaemia', 'hyperlipidemia', 'high cholesterol'] },
  { key: 'urti', label: 'Upper respiratory infection', icd: 'J06.9', aliases: ['urti', 'uri', 'upper respiratory tract infection', 'common cold', 'pharyngitis'] },
  { key: 'uti', label: 'Urinary tract infection', icd: 'N39.0', aliases: ['uti', 'urinary tract infection'] },
  { key: 'allergic_rhinitis', label: 'Allergic rhinitis', icd: 'J30.9', aliases: ['allergic rhinitis', 'ar', 'rhinitis'] },
  { key: 'gerd', label: 'Acid reflux', icd: 'K21.9', aliases: ['gerd', 'gord', 'acid reflux', 'acidity', 'apd', 'gastritis'] },
  { key: 'osteoarthritis', label: 'Osteoarthritis', icd: 'M19.9', aliases: ['oa', 'osteoarthritis', 'oa knee'] },
  { key: 'anaemia', label: 'Anaemia', icd: 'D64.9', aliases: ['anemia', 'anaemia'] },
  { key: 'obesity', label: 'Obesity', icd: 'E66', aliases: ['obesity', 'obese'] },
  { key: 'stroke', label: 'Stroke', icd: 'I63', aliases: ['stroke', 'cva', 'cerebral infarction'] },
  { key: 'depression', label: 'Depression', icd: 'F32', aliases: ['depression', 'mdd', 'depressive episode'] },
]);

const clean = (text) =>
  String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const byKey = new Map(CONDITIONS.map((c) => [c.key, c]));

const match = (written, name) => {
  const candidates = [clean(name), clean(written)].filter(Boolean);
  for (const text of candidates) {
    const exact = CONDITIONS.find((c) => clean(c.label) === text || c.aliases.includes(text));
    if (exact) return exact;
  }
  return null;
};

const groupOf = (key) => byKey.get(key)?.group ?? key;

module.exports = { CONDITIONS, match, groupOf, conditionByKey: (key) => byKey.get(key) ?? null };
