const SANDBOX_SUFFIX = '@sbx';

const bundleFor = (abhaAddress, today) => {
  const daysAgo = (n) => {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString().slice(0, 10);
  };
  return {
    resourceType: 'Bundle',
    type: 'collection',
    meta: { tag: [{ display: 'ABDM sandbox test record' }] },
    entry: [
      { resource: { resourceType: 'Patient', identifier: [{ system: 'https://healthid.abdm.gov.in', value: abhaAddress }] } },
      { resource: { resourceType: 'Condition', code: { text: 'Type 2 diabetes mellitus', coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: 'E11' }] } } },
      { resource: { resourceType: 'Condition', code: { text: 'Essential hypertension', coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: 'I10' }] } } },
      {
        resource: {
          resourceType: 'Observation',
          code: { coding: [{ system: 'http://loinc.org', code: '2160-0', display: 'Creatinine' }], text: 'Creatinine' },
          valueQuantity: { value: 1.2, unit: 'mg/dL' },
          effectiveDateTime: daysAgo(40),
        },
      },
      {
        resource: {
          resourceType: 'Observation',
          code: { coding: [{ system: 'http://loinc.org', code: '4548-4', display: 'HbA1c' }], text: 'HbA1c' },
          valueQuantity: { value: 7.9, unit: '%' },
          effectiveDateTime: daysAgo(40),
        },
      },
      {
        resource: {
          resourceType: 'MedicationRequest',
          status: 'active',
          medicationCodeableConcept: { text: 'Telma 40 Tablet' },
          authoredOn: daysAgo(60),
          requester: { display: 'Dr. A. Mehta (Cardiology)' },
          dosageInstruction: [{ text: '1 tablet once daily in the morning', timing: { repeat: { frequency: 1, period: 1, periodUnit: 'd' } } }],
        },
      },
      {
        resource: {
          resourceType: 'MedicationRequest',
          status: 'active',
          medicationCodeableConcept: { text: 'Glycomet GP 1 Tablet' },
          authoredOn: daysAgo(45),
          requester: { display: 'Dr. R. Rao (Endocrinology)' },
          dosageInstruction: [{ text: '1 tablet twice daily after food', timing: { repeat: { frequency: 2, period: 1, periodUnit: 'd' } } }],
        },
      },
    ],
  };
};

module.exports = { SANDBOX_SUFFIX, bundleFor };
