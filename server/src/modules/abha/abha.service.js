const db = require('#lib/db');
const { AppError, notFound } = require('#lib/app-error');
const { randomToken } = require('#lib/tokens');
const { todayIst } = require('#lib/dates');
const patientRepo = require('#modules/patient/patient.repository');
const patient = require('#modules/patient/patient.service');
const medication = require('#modules/medication/medication.service');
const drug = require('#modules/drug/drug.service');
const labRepo = require('#modules/lab/lab.repository');
const { ckdEpi2021 } = require('#modules/lab/lab.service');
const flags = require('#modules/flag/flag.service');
const { SANDBOX_SUFFIX, bundleFor } = require('./abha.sandbox');

const LOINC = { '2160-0': 'creatinine', '4548-4': 'hba1c', '62238-1': 'egfr', '2823-3': 'potassium' };
const PER_DAY = { 1: 'OD', 2: 'BD', 3: 'TID', 4: 'QID' };

const requestConsent = async (patientId, abhaAddress) => {
  if (!abhaAddress.endsWith(SANDBOX_SUFFIX)) {
    throw new AppError(
      'ABHA_SANDBOX_ONLY',
      'This prototype is connected to the ABDM sandbox only. Use a sandbox ABHA address ending in @sbx.',
      400,
    );
  }
  await patientRepo.update(patientId, { abha_address: abhaAddress });
  const requestId = randomToken(12);
  await db.query('INSERT INTO abha_consents (patient_id, abha_address, status, request_id) VALUES ($1, $2, $3, $4)', [
    patientId,
    abhaAddress,
    'requested',
    requestId,
  ]);
  return {
    request_id: requestId,
    abha_address: abhaAddress,
    purpose: 'Care management',
    hi_types: ['Prescription', 'Diagnostic report', 'Health problems'],
    date_range: 'Last 12 months',
    expires_in_days: 30,
    sandbox: true,
  };
};

const importBundle = async (patientId, actor, bundle) => {
  const resources = bundle.entry.map((e) => e.resource);
  const person = await patient.get(patientId);
  const summary = { conditions: 0, labs: 0, medications: 0 };
  const known = {
    conditions: new Set((await db.many('SELECT lower(name) AS n FROM conditions WHERE patient_id = $1', [patientId])).map((r) => r.n)),
    labs: new Set((await db.many('SELECT kind || measured_on AS k FROM lab_values WHERE patient_id = $1', [patientId])).map((r) => r.k)),
    products: new Set((await db.many(`SELECT product_id FROM medications WHERE patient_id = $1 AND status = 'active'`, [patientId])).map((r) => r.product_id)),
  };

  for (const c of resources.filter((r) => r.resourceType === 'Condition')) {
    if (known.conditions.has(c.code.text.toLowerCase())) continue;
    await patientRepo.addCondition(patientId, c.code.text, 'abha', c.code.coding?.[0]?.code ?? null);
    summary.conditions += 1;
  }

  for (const o of resources.filter((r) => r.resourceType === 'Observation')) {
    const kind = LOINC[o.code.coding?.[0]?.code];
    if (!kind || o.valueQuantity?.value == null) continue;
    const measuredOn = o.effectiveDateTime.slice(0, 10);
    if (known.labs.has(`${kind}${measuredOn}`)) continue;
    await labRepo.insert({ patient_id: patientId, kind, value: o.valueQuantity.value, unit: o.valueQuantity.unit, measured_on: measuredOn, source: 'abha' });
    summary.labs += 1;
    if (kind === 'creatinine') {
      await labRepo.insert({ patient_id: patientId, kind: 'egfr', value: ckdEpi2021(o.valueQuantity.value, person.age, person.gender), unit: 'mL/min/1.73m²', measured_on: measuredOn, source: 'computed' });
    }
  }

  for (const m of resources.filter((r) => r.resourceType === 'MedicationRequest' && r.status === 'active')) {
    const [match] = await drug.searchProducts(m.medicationCodeableConcept.text, 1);
    if (match && known.products.has(match.id)) continue;
    const requester = m.requester?.display ?? null;
    const speciality = requester?.match(/\(([^)]+)\)/)?.[1] ?? null;
    const perDay = m.dosageInstruction?.[0]?.timing?.repeat?.frequency ?? 1;
    const text = m.dosageInstruction?.[0]?.text ?? '';
    await medication.add(patientId, actor, {
      product_id: match?.id,
      name: match ? undefined : m.medicationCodeableConcept.text,
      frequency: PER_DAY[perDay] ?? 'OD',
      meal: /after food/i.test(text) ? 'after' : /before/i.test(text) ? 'before' : 'any',
      start_date: m.authoredOn,
      prescribed_on: m.authoredOn,
      prescriber: requester ? { name: requester.replace(/\s*\(.*\)$/, ''), speciality } : undefined,
      source: 'abha',
    });
    summary.medications += 1;
  }

  await db.query(`UPDATE medications SET confirmed_by = 'ABHA record (sandbox)' WHERE patient_id = $1 AND source = 'abha'`, [patientId]);
  await flags.recompute(patientId, { actor, reason: 'ABHA records imported' });
  return summary;
};

const approve = async (patientId, actor, requestId) => {
  const consent = await db.one('SELECT * FROM abha_consents WHERE patient_id = $1 AND request_id = $2', [patientId, requestId]);
  if (!consent) throw notFound('Consent request');
  if (consent.status === 'imported') throw new AppError('ALREADY_IMPORTED', 'These records are already in your list', 409);
  await db.query(`UPDATE abha_consents SET status = 'granted', updated_at = now() WHERE id = $1`, [consent.id]);
  const summary = await importBundle(patientId, actor, bundleFor(consent.abha_address, todayIst()));
  await db.query(`UPDATE abha_consents SET status = 'imported', updated_at = now() WHERE id = $1`, [consent.id]);
  return { ...summary, sandbox: true };
};

const deny = async (patientId, requestId) => {
  await db.query(`UPDATE abha_consents SET status = 'denied', updated_at = now() WHERE patient_id = $1 AND request_id = $2`, [patientId, requestId]);
};

module.exports = { requestConsent, approve, deny };
