const db = require('#lib/db');
const { AppError, notFound, forbidden } = require('#lib/app-error');
const { randomCode } = require('#lib/tokens');
const { ageFrom } = require('#lib/dates');
const card = require('#modules/card/card.service');
const repo = require('./patient.repository');
const conditionService = require('#modules/condition/condition.service');

const shape = (p) => ({
  id: p.id,
  full_name: p.full_name,
  age: ageFrom(p.birth_year),
  birth_year: p.birth_year,
  gender: p.gender,
  phone: p.phone,
  abha_address: p.abha_address,
  weight_kg: p.weight_kg,
  role: p.role,
  relation: p.relation,
});

const list = async (userId) => (await repo.listForUser(userId)).map(shape);

const get = async (patientId) => {
  const patient = await repo.findById(patientId);
  if (!patient) throw notFound('Patient');
  return shape(patient);
};

const create = async (userId, userPhone, input) => {
  const role = input.for_self ? 'self' : 'caregiver';
  if (role === 'self') {
    const existing = (await repo.listForUser(userId)).find((p) => p.role === 'self');
    if (existing) throw new AppError('ALREADY_HAS_SELF', 'You already have your own profile', 409);
  }
  const birthYear = new Date().getFullYear() - input.age;
  const id = await db.transaction(async (tx) => {
    const created = await repo.create(tx, {
      full_name: input.full_name,
      birth_year: birthYear,
      gender: input.gender,
      phone: input.phone ?? userPhone,
      created_by: userId,
    });
    await repo.addMember(tx, created.id, userId, role, input.relation);
    await card.issue(tx, created.id);
    return created.id;
  });
  if (input.abha_address) await repo.update(id, { abha_address: input.abha_address });
  return get(id);
};

const update = async (patientId, input) => {
  const fields = {};
  if (input.full_name) fields.full_name = input.full_name;
  if (input.age) fields.birth_year = new Date().getFullYear() - input.age;
  if (input.gender) fields.gender = input.gender;
  if (input.weight_kg !== undefined) fields.weight_kg = input.weight_kg;
  if (Object.keys(fields).length) await repo.update(patientId, fields);
  return get(patientId);
};

const members = (patientId) => repo.members(patientId);

const invite = async (patientId, userId, relation) => {
  return repo.createInvite(randomCode(6), patientId, userId, relation);
};

const acceptInvite = async (userId, code) => {
  const found = await repo.findInvite(code.toUpperCase());
  if (!found) throw new AppError('INVITE_INVALID', 'This code is not valid or has expired', 400);
  await db.transaction(async (tx) => {
    await repo.addMember(tx, found.patient_id, userId, 'caregiver', found.relation);
    await repo.acceptInvite(tx, found.code, userId);
  });
  return get(found.patient_id);
};

const removeCaregiver = async (patientId, actorRole, caregiverId) => {
  if (actorRole !== 'self') throw forbidden();
  await repo.removeCaregiver(patientId, caregiverId);
};

const conditions = (patientId) => conditionService.summary(patientId);

const addCondition = async (patientId, name) => {
  await conditionService.addTyped(patientId, name);
  return conditionService.summary(patientId);
};

module.exports = { list, get, create, update, members, invite, acceptInvite, removeCaregiver, conditions, addCondition };
