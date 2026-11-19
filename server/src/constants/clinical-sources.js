const SOURCES = Object.freeze({
  cdsco_fdc: {
    label: 'CDSCO: fixed dose combinations',
    url: 'https://cdsco.gov.in/opencms/opencms/en/Drugs/FDC/',
  },
  kdigo_2024: {
    label: 'KDIGO 2024 CKD guideline (medicines and kidney function)',
    url: 'https://kdigo.org/guidelines/ckd-evaluation-and-management/',
  },
  ada_kdigo_2022: {
    label: 'ADA and KDIGO 2022 consensus: diabetes in CKD',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9870667',
  },
  januvia_label: {
    label: 'Sitagliptin prescribing information, renal dosing',
    url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/021995Orig1s053lbl.pdf',
  },
  micardis_smpc: {
    label: 'Telmisartan SmPC, hepatic impairment',
    url: 'https://www.medicines.org.uk/emc/product/3164/smpc',
  },
  augmentin_label: {
    label: 'Amoxicillin and clavulanate prescribing information',
    url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/050564Orig1s059,050575Orig1s048,050597Orig1s051,050720Orig1s033,050725Orig1s035,050726Orig1s026lbl.pdf',
  },
  nsaid_label: {
    label: 'NSAID class labelling: kidney, bleeding and blood pressure warnings',
    url: 'https://www.fda.gov/drugs/postmarket-drug-safety-information-patients-and-providers/nonsteroidal-anti-inflammatory-drugs-nsaids',
  },
  icmr_amr_2019: {
    label: 'ICMR treatment guidelines for antimicrobial use, 2019',
    url: 'https://www.icmr.gov.in/icmrobject/custom_data/pdf/resource-guidelines/Treatment_Guidelines_2019_Final.pdf',
  },
  who_aware: {
    label: 'WHO AWaRe antibiotic book, 2022',
    url: 'https://www.who.int/publications/i/item/9789240062382',
  },
  clopidogrel_label: {
    label: 'Clopidogrel prescribing information: CYP2C19 inhibitors',
    url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/020839s075lbl.pdf',
  },
  fq_label: {
    label: 'FDA safety communication: fluoroquinolones and blood sugar',
    url: 'https://www.fda.gov/drugs/drug-safety-and-availability/fda-reinforces-safety-information-about-serious-low-blood-sugar-levels-and-mental-health-side-effects',
  },
  simvastatin_label: {
    label: 'FDA safety communication: statin interactions',
    url: 'https://www.fda.gov/drugs/drug-safety-and-availability/fda-drug-safety-communication-important-safety-label-changes-cholesterol-lowering-statin-drugs',
  },
  paracetamol_liver: {
    label: 'Paracetamol in chronic liver disease (2 g a day ceiling)',
    url: 'https://www.medschool.umaryland.edu/em/cme/umem-educational-pearls/?id=3791',
  },
  dataset: {
    label: 'Interaction listed in the open Indian Medicine Dataset (needs professional confirmation)',
    url: 'https://github.com/junioralive/Indian-Medicine-Dataset',
  },
  general: {
    label: 'General clinical pharmacology; rule awaiting review by a named clinician',
    url: null,
  },
});

const RULES_VERSION = '0.1 (not yet reviewed by a named clinician)';

module.exports = { SOURCES, RULES_VERSION };
