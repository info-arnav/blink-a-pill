const db = require('#lib/db');
const { match, groupOf, conditionByKey } = require('#constants/conditions');
const repo = require('./condition.repository');

const SOURCE_LABEL = { typed: 'typed by the patient', abha: 'ABHA record', photo: 'prescription' };

const resolve = (written, name) => {
  const known = match(written, name);
  return known ? { name: known.label, code: known.icd, condition_key: known.key } : { name: (name || written).trim(), code: null, condition_key: null };
};

const describe = (row) => {
  const by = row.prescriber_name ? ` by ${row.prescriber_name}` : '';
  if (row.source === 'photo') return `noted${by} on a prescription`;
  return SOURCE_LABEL[row.source];
};

const summary = async (patientId) => {
  const rows = await repo.listForPatient(patientId);
  const groups = new Map();
  for (const row of rows) {
    const id = row.condition_key ?? row.name.toLowerCase();
    const entry = groups.get(id) ?? { key: row.condition_key, name: row.name, code: row.code, certainty: row.certainty, notes: [] };
    if (row.certainty === 'confirmed' || (row.certainty === 'history' && entry.certainty === 'provisional')) entry.certainty = row.certainty;
    entry.notes.push({ id: row.id, source: row.source, by: row.prescriber_name, on: row.noted_on, written_as: row.written_as, label: describe(row) });
    groups.set(id, entry);
  }
  return [...groups.values()].map((g) => ({ ...g, first: g.notes[0], id: g.notes[0].id }));
};

const forRules = async (patientId) =>
  (await repo.listForPatient(patientId))
    .filter((row) => row.condition_key && row.certainty !== 'provisional')
    .map((row) => ({ key: row.condition_key, group: groupOf(row.condition_key), label: conditionByKey(row.condition_key)?.label ?? row.name, source_label: describe(row) }));

const addTyped = async (patientId, name) => {
  const resolved = resolve(name, name);
  return db.transaction((tx) => repo.insert(tx, { patient_id: patientId, ...resolved, written_as: name, source: 'typed' }));
};

const remove = (patientId, id) => repo.remove(patientId, id);

module.exports = { resolve, summary, forRules, addTyped, remove, insert: repo.insert };
