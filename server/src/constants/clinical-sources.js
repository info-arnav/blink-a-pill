const label = (name, setId, section) => ({
  label: `${name} prescribing information (${section})`,
  url: `https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=${setId}`,
});

const SOURCES = Object.freeze({
  cdsco_fdc: { label: 'CDSCO: fixed dose combinations', url: 'https://cdsco.gov.in/opencms/opencms/en/Drugs/FDC/' },
  kdigo_2024: { label: 'KDIGO 2024 CKD guideline (medicines and kidney function)', url: 'https://kdigo.org/guidelines/ckd-evaluation-and-management/' },
  ada_kdigo_2022: { label: 'ADA and KDIGO 2022 consensus: diabetes in CKD', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9870667' },
  januvia_label: label('Sitagliptin', '194c3718-5eb5-4cf5-85d0-2bb1ed8293b8', 'dosage, renal impairment'),
  micardis_smpc: { label: 'Telmisartan SmPC (hepatic impairment)', url: 'https://www.medicines.org.uk/emc/product/3164/smpc' },
  augmentin_label: {
    label: 'Amoxicillin and clavulanate prescribing information',
    url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/050564Orig1s059,050575Orig1s048,050597Orig1s051,050720Orig1s033,050725Orig1s035,050726Orig1s026lbl.pdf',
  },
  nsaid_label: label('Diclofenac sodium', '03c4f06f-6a49-4404-bf3b-0aafa33c81ef', 'heart failure, renal toxicity, other NSAIDs'),
  telmisartan_label: label('Telmisartan', '09d31eee-cd22-4918-a889-3eb4d2969525', '5.3 hyperkalemia, 5.6 dual RAS blockade, fetal toxicity'),
  metformin_label: label('Metformin hydrochloride', '011de1a5-1ac0-4831-9e8d-26ec79ba2205', 'maximum dose, hepatic impairment'),
  propranolol_label: label('Propranolol', '013a485a-4227-46ae-b19f-c550302fcb96', 'contraindications: bronchial asthma'),
  carvedilol_label: label('Carvedilol', '010290af-81f4-0037-e063-6394a90a4638', 'contraindications: bronchial asthma'),
  pioglitazone_label: label('Pioglitazone', '0331400c-b163-4856-bfb0-965470247cb3', 'boxed warning: heart failure'),
  sildenafil_label: label('Sildenafil', '00ee09dd-2de0-4dc4-85f6-b51ed6eabd5b', 'contraindications: nitrates'),
  tramadol_label: label('Tramadol', '004de5a4-80f8-4040-a6ea-be5e99352a36', 'serotonin syndrome'),
  verapamil_label: label('Verapamil', '006cf920-04ae-0b53-cb91-85481972abc2', 'beta-adrenergic blockers'),
  atorvastatin_label: label('Atorvastatin', '00afce9b-48c9-487a-a738-e359c005c707', 'contraindications: decompensated cirrhosis'),
  nitrofurantoin_label: label('Nitrofurantoin', '04af8b73-7e15-7da8-e063-6294a90af284', 'contraindications: renal impairment'),
  warfarin_label: label('Warfarin', '0cbce382-9c88-4f58-ae0f-532a841e8f95', 'drug interactions: antiplatelets, NSAIDs, anticoagulants'),
  acetaminophen_label: label('Acetaminophen', '0005aafa-08f8-4990-a54d-cc097195708f', 'liver warning: 4,000 mg in 24 hours'),
  amlodipine_label: label('Amlodipine', '003dd1ec-16f8-4f96-b6a8-c4689d35892a', 'maximum dose'),
  clopidogrel_label: { label: 'Clopidogrel prescribing information: CYP2C19 inhibitors', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/020839s075lbl.pdf' },
  fq_label: {
    label: 'FDA safety communication: fluoroquinolones and blood sugar',
    url: 'https://www.fda.gov/drugs/drug-safety-and-availability/fda-reinforces-safety-information-about-serious-low-blood-sugar-levels-and-mental-health-side-effects',
  },
  simvastatin_label: {
    label: 'FDA safety communication: statin interactions',
    url: 'https://www.fda.gov/drugs/drug-safety-and-availability/fda-drug-safety-communication-important-safety-label-changes-cholesterol-lowering-statin-drugs',
  },
  paracetamol_liver: { label: 'Paracetamol in chronic liver disease (2 g a day ceiling)', url: 'https://www.medschool.umaryland.edu/em/cme/umem-educational-pearls/?id=3791' },
  icmr_amr_2019: { label: 'ICMR treatment guidelines for antimicrobial use, 2019', url: 'https://www.icmr.gov.in/icmrobject/custom_data/pdf/resource-guidelines/Treatment_Guidelines_2019_Final.pdf' },
  who_aware: { label: 'WHO AWaRe antibiotic book, 2022', url: 'https://www.who.int/publications/i/item/9789240062382' },
  dataset: { label: 'Interaction listed in the open Indian Medicine Dataset (needs professional confirmation)', url: 'https://github.com/junioralive/Indian-Medicine-Dataset' },
});

const RULES_VERSION = '0.2 (cited sources, not yet reviewed by a named clinician)';

module.exports = { SOURCES, RULES_VERSION };
