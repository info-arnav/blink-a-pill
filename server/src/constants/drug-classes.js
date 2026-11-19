const CLASSES = Object.freeze({
  arb: {
    label: 'ARB (blood pressure)',
    members: ['telmisartan', 'losartan', 'olmesartan', 'valsartan', 'irbesartan', 'candesartan', 'azilsartan'],
  },
  acei: {
    label: 'ACE inhibitor (blood pressure)',
    members: ['ramipril', 'enalapril', 'lisinopril', 'perindopril', 'captopril', 'trandolapril'],
  },
  ccb: {
    label: 'Calcium channel blocker (blood pressure)',
    members: ['amlodipine', 'cilnidipine', 'nifedipine', 'felodipine', 'benidipine', 'azelnidipine'],
  },
  rate_ccb: { label: 'Rate-limiting calcium channel blocker', members: ['verapamil', 'diltiazem'] },
  beta_blocker: {
    label: 'Beta blocker',
    members: ['metoprolol', 'atenolol', 'bisoprolol', 'nebivolol', 'carvedilol', 'propranolol'],
  },
  thiazide: {
    label: 'Thiazide diuretic',
    members: ['hydrochlorothiazide', 'chlorthalidone', 'indapamide'],
  },
  loop: { label: 'Loop diuretic', members: ['furosemide', 'torsemide'] },
  k_sparing: {
    label: 'Potassium-sparing medicine',
    members: ['spironolactone', 'eplerenone', 'amiloride', 'potassium chloride', 'finerenone'],
  },
  biguanide: { label: 'Metformin', members: ['metformin'] },
  sulfonylurea: {
    label: 'Sulfonylurea (diabetes)',
    members: ['glimepiride', 'gliclazide', 'glipizide', 'glibenclamide'],
  },
  dpp4: {
    label: 'DPP-4 inhibitor (diabetes)',
    members: ['sitagliptin', 'vildagliptin', 'teneligliptin', 'linagliptin', 'saxagliptin', 'alogliptin'],
  },
  sglt2: {
    label: 'SGLT2 inhibitor (diabetes)',
    members: ['dapagliflozin', 'empagliflozin', 'canagliflozin', 'remogliflozin'],
  },
  statin: {
    label: 'Statin (cholesterol)',
    members: ['atorvastatin', 'rosuvastatin', 'simvastatin', 'pitavastatin', 'pravastatin'],
  },
  nsaid: {
    label: 'NSAID painkiller',
    members: [
      'diclofenac',
      'aceclofenac',
      'ibuprofen',
      'naproxen',
      'etoricoxib',
      'piroxicam',
      'ketorolac',
      'mefenamic acid',
      'nimesulide',
      'indomethacin',
      'celecoxib',
      'etodolac',
      'lornoxicam',
    ],
  },
  anticoagulant: {
    label: 'Blood thinner (anticoagulant)',
    members: ['warfarin', 'acenocoumarol', 'apixaban', 'rivaroxaban', 'dabigatran'],
  },
  antiplatelet: { label: 'Antiplatelet', members: ['aspirin', 'clopidogrel', 'prasugrel', 'ticagrelor'] },
  ppi: {
    label: 'Acid reducer (PPI)',
    members: ['omeprazole', 'esomeprazole', 'pantoprazole', 'rabeprazole', 'lansoprazole'],
  },
  cyp_ppi: { label: 'Omeprazole-type PPI', members: ['omeprazole', 'esomeprazole'] },
  myopathy_statin: { label: 'Statin cleared by CYP3A4', members: ['simvastatin', 'atorvastatin'] },
  strong_cyp3a4_inhibitor: {
    label: 'Strong CYP3A4 inhibitor',
    members: ['clarithromycin', 'erythromycin', 'itraconazole', 'ketoconazole', 'posaconazole', 'ritonavir'],
  },
  fluoroquinolone: {
    label: 'Fluoroquinolone antibiotic',
    members: ['ciprofloxacin', 'levofloxacin', 'ofloxacin', 'moxifloxacin', 'norfloxacin'],
  },
  nitrate: {
    label: 'Nitrate (heart)',
    members: ['isosorbide mononitrate', 'isosorbide dinitrate', 'nitroglycerin', 'nicorandil'],
  },
  pde5: { label: 'PDE5 inhibitor', members: ['sildenafil', 'tadalafil', 'vardenafil'] },
  ssri: {
    label: 'SSRI antidepressant',
    members: ['sertraline', 'escitalopram', 'fluoxetine', 'paroxetine', 'citalopram', 'fluvoxamine'],
  },
  serotonergic_opioid: { label: 'Tramadol-type painkiller', members: ['tramadol', 'tapentadol'] },
  benzodiazepine: {
    label: 'Sleeping or anxiety medicine (benzodiazepine)',
    members: ['alprazolam', 'clonazepam', 'lorazepam', 'diazepam', 'nitrazepam', 'etizolam'],
  },
  antibiotic: {
    label: 'Antibiotic',
    members: [
      'amoxycillin',
      'ampicillin',
      'cloxacillin',
      'azithromycin',
      'clarithromycin',
      'erythromycin',
      'doxycycline',
      'minocycline',
      'cefixime',
      'cefuroxime',
      'cefpodoxime',
      'cefadroxil',
      'cephalexin',
      'cefdinir',
      'ceftriaxone',
      'ciprofloxacin',
      'levofloxacin',
      'ofloxacin',
      'moxifloxacin',
      'norfloxacin',
      'nitrofurantoin',
      'linezolid',
      'metronidazole',
      'tinidazole',
      'faropenem',
      'sulfamethoxazole',
      'trimethoprim',
      'clindamycin',
      'rifaximin',
    ],
  },
});

const matches = (ingredient, member) => ingredient === member || ingredient.startsWith(`${member} `);

const classesOf = (ingredient) =>
  Object.entries(CLASSES)
    .filter(([, value]) => value.members.some((member) => matches(ingredient, member)))
    .map(([key]) => key);

const baseName = (ingredient) => {
  for (const value of Object.values(CLASSES)) {
    const member = value.members.find((m) => matches(ingredient, m));
    if (member) return member;
  }
  return ingredient;
};

const DUPLICATE_CLASSES = Object.freeze([
  'arb',
  'acei',
  'ccb',
  'beta_blocker',
  'sulfonylurea',
  'dpp4',
  'sglt2',
  'statin',
  'nsaid',
  'anticoagulant',
  'ppi',
  'benzodiazepine',
]);

const MAX_DAILY_MG = Object.freeze({
  paracetamol: 4000,
  telmisartan: 80,
  losartan: 100,
  olmesartan: 40,
  amlodipine: 10,
  metformin: 2550,
  glimepiride: 8,
  gliclazide: 320,
  sitagliptin: 100,
  vildagliptin: 100,
  teneligliptin: 40,
  atorvastatin: 80,
  rosuvastatin: 40,
  diclofenac: 150,
  aceclofenac: 200,
  ibuprofen: 2400,
  ramipril: 10,
  hydrochlorothiazide: 50,
  metoprolol: 400,
  pantoprazole: 80,
  tramadol: 400,
  cetirizine: 10,
  levocetirizine: 5,
});

module.exports = { CLASSES, DUPLICATE_CLASSES, MAX_DAILY_MG, classesOf, baseName };
