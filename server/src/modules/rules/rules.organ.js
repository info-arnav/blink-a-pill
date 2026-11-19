const { classesOf } = require('#constants/drug-classes');
const { dailyMg, flag } = require('./rules.helpers');

const withIngredient = (meds, key) => meds.filter((m) => m.ingredients.some((p) => p.key === key || p.key.startsWith(`${key} `)));
const withClass = (meds, cls) => meds.filter((m) => m.ingredients.some((p) => classesOf(p.key).includes(cls)));
const totalMg = (meds, key) => meds.reduce((sum, m) => sum + (dailyMg(m, m.ingredients.find((p) => p.key === key || p.key.startsWith(`${key} `))?.key) ?? 0), 0);

const kidney = (meds, egfr) => {
  if (egfr == null) return [];
  const out = [];
  const labelGfr = `Latest eGFR ${egfr} mL/min/1.73m².`;

  const metformin = withIngredient(meds, 'metformin');
  if (metformin.length) {
    const mg = totalMg(metformin, 'metformin');
    if (egfr < 30) {
      out.push(flag({ rule: 'kidney_metformin', meds: metformin, severity: 1, title: 'Metformin and low kidney function',
        patient: 'Your latest kidney test is low. At this level metformin is usually not used. Please ask your doctor soon.',
        clinician: `Metformin with eGFR ${egfr} (< 30): contraindicated per ADA/KDIGO 2022.`,
        reasoning: [labelGfr, `Metformin ${mg} mg a day as entered.`], sources: ['ada_kdigo_2022'] }));
    } else if (egfr < 45 && mg > 1000) {
      out.push(flag({ rule: 'kidney_metformin', meds: metformin, severity: 2, title: 'Metformin dose and kidney function',
        patient: 'Your kidney test suggests a lower metformin dose may be needed. Please ask your doctor.',
        clinician: `Metformin ${mg} mg/day with eGFR ${egfr} (30 to 44): ADA/KDIGO 2022 suggests maximum 1000 mg/day.`,
        reasoning: [labelGfr, `Metformin ${mg} mg a day as entered.`], sources: ['ada_kdigo_2022'] }));
    }
  }

  const sita = withIngredient(meds, 'sitagliptin');
  if (sita.length) {
    const mg = totalMg(sita, 'sitagliptin');
    const limit = egfr < 30 ? 25 : egfr < 45 ? 50 : 100;
    if (mg > limit) {
      out.push(flag({ rule: 'kidney_sitagliptin', meds: sita, severity: 2, title: 'Sitagliptin dose and kidney function',
        patient: 'Your kidney test suggests a lower sitagliptin dose may be needed. Please ask your doctor.',
        clinician: `Sitagliptin ${mg} mg/day with eGFR ${egfr}: label maximum ${limit} mg/day at this level.`,
        reasoning: [labelGfr, `Sitagliptin ${mg} mg a day as entered.`], sources: ['januvia_label'] }));
    }
  }

  const nsaids = withClass(meds, 'nsaid');
  if (nsaids.length && egfr < 30) {
    out.push(flag({ rule: 'kidney_nsaid', meds: nsaids, severity: 1, title: 'Painkiller and low kidney function',
      patient: 'This kind of painkiller can harm kidneys that are already weak. Please ask your doctor before taking more.',
      clinician: `NSAID with eGFR ${egfr} (< 30): avoid in advanced renal disease.`, reasoning: [labelGfr], sources: ['nsaid_label', 'kdigo_2024'] }));
  }
  const raas = [...withClass(meds, 'arb'), ...withClass(meds, 'acei')];
  if (nsaids.length && raas.length && egfr < 60 && egfr >= 30) {
    out.push(flag({ rule: 'kidney_nsaid_raas', meds: [nsaids[0], raas[0]], severity: 1, title: 'Painkiller with blood pressure medicine and reduced kidney function',
      patient: 'With your kidney function, this painkiller together with your blood pressure medicine can lower kidney function further.',
      clinician: `NSAID with ARB/ACE inhibitor at eGFR ${egfr}: risk of AKI.`, reasoning: [labelGfr], sources: ['nsaid_label', 'kdigo_2024'] }));
  }

  const ksparing = withClass(meds, 'k_sparing');
  if (ksparing.length && egfr < 30) {
    out.push(flag({ rule: 'kidney_potassium', meds: ksparing, severity: 1, title: 'Potassium-raising medicine and low kidney function',
      patient: 'With low kidney function this medicine can raise potassium to unsafe levels. Please ask your doctor.',
      clinician: `Potassium-sparing agent with eGFR ${egfr} (< 30): hyperkalaemia risk.`, reasoning: [labelGfr], sources: ['kdigo_2024'] }));
  }

  const nitro = withIngredient(meds, 'nitrofurantoin');
  if (nitro.length && egfr < 45) {
    out.push(flag({ rule: 'kidney_nitrofurantoin', meds: nitro, severity: 2, title: 'Urine infection antibiotic and kidney function',
      patient: 'This antibiotic works less well and can cause side effects when kidney function is low. Please ask your doctor.',
      clinician: `Nitrofurantoin with eGFR ${egfr} (< 45): reduced efficacy and toxicity risk.`, reasoning: [labelGfr], sources: ['general'] }));
  }

  const coamox = meds.filter((m) => m.ingredients.some((p) => p.key === 'amoxycillin') && m.ingredients.some((p) => p.key === 'clavulanic acid'));
  if (coamox.length && egfr < 30 && coamox.some((m) => m.times.length > 2)) {
    out.push(flag({ rule: 'kidney_coamoxiclav', meds: coamox, severity: 2, title: 'Antibiotic dose timing and kidney function',
      patient: 'With your kidney function this antibiotic is usually given twice a day, not more often. Please check with your doctor.',
      clinician: `Amoxicillin-clavulanate more than every 12 h with eGFR ${egfr} (< 30): label suggests every 12 h dosing.`, reasoning: [labelGfr], sources: ['augmentin_label'] }));
  }
  return out;
};

const liver = (meds, childPugh) => {
  if (!childPugh || childPugh === 'A') return [];
  const out = [];
  const label = `Child-Pugh class ${childPugh}.`;
  const para = withIngredient(meds, 'paracetamol');
  if (para.length) {
    const mg = totalMg(para, 'paracetamol');
    if (mg > 2000) {
      out.push(flag({ rule: 'liver_paracetamol', meds: para, severity: 1, title: 'Paracetamol amount and liver disease',
        patient: `Your paracetamol adds up to ${mg} mg a day. With liver disease the usual limit is lower, about 2000 mg. Please ask your doctor.`,
        clinician: `Paracetamol ${mg} mg/day with Child-Pugh ${childPugh}: limit to 2 g/day in cirrhosis.`, reasoning: [label], sources: ['paracetamol_liver'] }));
    }
  }
  const telmi = withIngredient(meds, 'telmisartan');
  if (telmi.length) {
    const mg = totalMg(telmi, 'telmisartan');
    if (childPugh === 'C' || mg > 40) {
      out.push(flag({ rule: 'liver_telmisartan', meds: telmi, severity: childPugh === 'C' ? 1 : 2, title: 'Telmisartan and liver disease',
        patient: 'With your liver condition, telmisartan may need a lower dose or a different medicine. Please ask your doctor.',
        clinician: `Telmisartan ${mg} mg/day with Child-Pugh ${childPugh}: SmPC max 40 mg in mild to moderate impairment, avoid in severe.`, reasoning: [label], sources: ['micardis_smpc'] }));
    }
  }
  const statins = withClass(meds, 'statin');
  if (statins.length && childPugh === 'C') {
    out.push(flag({ rule: 'liver_statin', meds: statins, severity: 1, title: 'Cholesterol medicine and severe liver disease',
      patient: 'Cholesterol medicines are usually avoided with severe liver disease. Please ask your doctor.',
      clinician: `Statin with Child-Pugh C: contraindicated in decompensated liver disease.`, reasoning: [label], sources: ['general'] }));
  }
  const coamox = meds.filter((m) => m.ingredients.some((p) => p.key === 'clavulanic acid'));
  if (coamox.length) {
    out.push(flag({ rule: 'liver_coamoxiclav', meds: coamox, severity: 2, title: 'Antibiotic and liver disease',
      patient: 'This antibiotic has rarely caused liver problems. With your liver condition, your doctor may want to keep an eye on it.',
      clinician: `Amoxicillin-clavulanate with Child-Pugh ${childPugh}: hepatic dysfunction warning, monitor.`, reasoning: [label], sources: ['augmentin_label'] }));
  }
  const nsaids = withClass(meds, 'nsaid');
  if (nsaids.length && childPugh === 'C') {
    out.push(flag({ rule: 'liver_nsaid', meds: nsaids, severity: 1, title: 'Painkiller and severe liver disease',
      patient: 'This kind of painkiller can cause bleeding and kidney problems with severe liver disease. Please ask your doctor.',
      clinician: 'NSAID with Child-Pugh C: avoid (bleeding, renal failure, fluid retention).', reasoning: [label], sources: ['nsaid_label'] }));
  }
  return out;
};

module.exports = { kidney, liver };
