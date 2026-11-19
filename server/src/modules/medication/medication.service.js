const { AppError, notFound } = require('#lib/app-error');
const { todayIst, addDays, daysBetween } = require('#lib/dates');
const { FREQUENCIES } = require('#constants/schedule');
const { classesOf } = require('#constants/drug-classes');
const drug = require('#modules/drug/drug.service');
const flags = require('#modules/flag/flag.service');
const repo = require('./medication.repository');

const shape = (m) => {
  const today = todayIst();
  return {
    id: m.id,
    product_id: m.product_id,
    name: m.display_name,
    ingredients: m.ingredients,
    dose_amount: m.dose_amount,
    dose_unit: m.dose_unit,
    frequency: m.frequency,
    frequency_label: FREQUENCIES[m.frequency]?.label ?? (m.frequency === 'SOS' ? 'Only when needed' : m.frequency),
    times: m.times,
    meal: m.meal,
    start_date: m.start_date,
    duration_days: m.duration_days,
    end_date: m.end_date,
    days_left: m.end_date ? Math.max(0, daysBetween(today, m.end_date) + 1) : null,
    is_antibiotic: m.is_antibiotic,
    prescriber: m.prescriber_id
      ? { id: m.prescriber_id, name: m.prescriber_name, phone: m.prescriber_phone, speciality: m.prescriber_speciality, registered: Boolean(m.prescriber_registration) }
      : null,
    clinic: m.clinic_id ? { id: m.clinic_id, name: m.clinic_name, reception_phone: m.clinic_phone } : null,
    prescribed_on: m.prescribed_on,
    source: m.source,
    status: m.status,
    status_reason: m.status_reason,
    course_outcome: m.course_outcome,
    confirmed_by: m.confirmed_by,
    created_at: m.created_at,
  };
};

const list = async (patientId, includeAll) =>
  (await repo.listForPatient(patientId, includeAll ? ['active', 'stopped', 'completed'] : ['active'])).map(shape);

const resolveIngredients = async (input) => {
  if (input.product_id) {
    const product = await drug.getProduct(input.product_id);
    return { name: input.name ?? product.name, ingredients: product.ingredients, productId: product.id };
  }
  const matches = await drug.searchProducts(input.name, 1);
  const exact = matches.find((m) => m.name.toLowerCase() === input.name.trim().toLowerCase());
  if (exact) return { name: exact.name, ingredients: exact.ingredients, productId: exact.id };
  return { name: input.name.trim(), ingredients: [], productId: null };
};

const resolvePrescriber = async (input) => {
  let prescriberId = null;
  let clinicId = null;
  if (input.prescriber?.name) prescriberId = (await repo.upsertPrescriber(input.prescriber)).id;
  if (input.clinic?.name) clinicId = (await repo.createClinic(input.clinic)).id;
  return { prescriberId, clinicId };
};

const add = async (patientId, user, input) => {
  const { name, ingredients, productId } = await resolveIngredients(input);
  const { prescriberId, clinicId } = await resolvePrescriber(input);
  const start = input.start_date ?? todayIst();
  const times = input.frequency === 'SOS' ? [] : input.times?.length ? input.times : FREQUENCIES[input.frequency]?.times ?? [];
  if (input.frequency !== 'SOS' && !times.length) throw new AppError('TIMES_REQUIRED', 'Choose at least one time of day', 422);
  const isAntibiotic = ingredients.some((p) => classesOf(p.key).includes('antibiotic'));
  const created = await repo.insert({
    patient_id: patientId,
    product_id: productId,
    display_name: name,
    ingredients,
    dose_amount: input.dose_amount ?? 1,
    dose_unit: input.dose_unit ?? 'tablet',
    frequency: input.frequency,
    times: [...times].sort(),
    meal: input.meal ?? 'any',
    start_date: start,
    duration_days: input.duration_days ?? null,
    end_date: input.duration_days ? addDays(start, input.duration_days - 1) : null,
    is_antibiotic: isAntibiotic,
    prescriber_id: prescriberId,
    clinic_id: clinicId,
    prescribed_on: input.prescribed_on ?? null,
    source: input.source,
    added_by: user.id,
    confirmed_by: user.role === 'caregiver' ? 'caregiver' : 'patient',
  });
  const raised = await flags.recompute(patientId, { actor: user });
  return {
    medication: shape(await repo.findById(patientId, created.id)),
    new_flags: raised.filter((f) => f.medication_ids.includes(created.id)),
  };
};

const updateSchedule = async (patientId, id, input) => {
  const current = await repo.findById(patientId, id);
  if (!current) throw notFound('Medicine');
  const times = input.frequency === 'SOS' ? [] : input.times?.length ? input.times : FREQUENCIES[input.frequency]?.times ?? current.times;
  const duration = input.duration_days === undefined ? current.duration_days : input.duration_days;
  await repo.updateSchedule(id, {
    dose_amount: input.dose_amount ?? current.dose_amount,
    frequency: input.frequency ?? current.frequency,
    times: [...times].sort(),
    meal: input.meal ?? current.meal,
    duration_days: duration,
    end_date: duration ? addDays(current.start_date, duration - 1) : null,
  });
  await flags.recompute(patientId, { actor: input.actor });
  return shape(await repo.findById(patientId, id));
};

const setPrescriber = async (patientId, id, input) => {
  const current = await repo.findById(patientId, id);
  if (!current) throw notFound('Medicine');
  const { prescriberId, clinicId } = await resolvePrescriber(input);
  await repo.setPrescriberAndClinic(id, prescriberId, clinicId);
  await flags.recompute(patientId, {});
  return shape(await repo.findById(patientId, id));
};

const REASONS = {
  doctor_stopped: 'A doctor stopped it',
  course_finished: 'Course finished',
  not_taking: 'Not taking it any more',
  added_by_mistake: 'Added by mistake',
};

const markNotTaking = async (patientId, id, reason, actor) => {
  const current = await repo.findById(patientId, id);
  if (!current) throw notFound('Medicine');
  await repo.setStatus(id, reason === 'course_finished' ? 'completed' : 'stopped', REASONS[reason]);
  await flags.recompute(patientId, { actor, reason: `${current.display_name}: ${REASONS[reason]}` });
  return shape(await repo.findById(patientId, id));
};

const recordCourse = async (patientId, id, outcome, actor) => {
  const current = await repo.findById(patientId, id);
  if (!current) throw notFound('Medicine');
  if (!current.is_antibiotic) throw new AppError('NOT_A_COURSE', 'This medicine is not a short course', 400);
  if (outcome === 'continuing') return shape(current);
  await repo.setStatus(id, 'completed', outcome === 'finished' ? 'Course finished' : 'Course stopped early', outcome);
  await flags.recompute(patientId, { actor, reason: `${current.display_name}: course ${outcome.replace('_', ' ')}` });
  return shape(await repo.findById(patientId, id));
};

const coursesDue = async (patientId) => (await repo.coursesDue(patientId, todayIst())).map(shape);

module.exports = { list, add, updateSchedule, setPrescriber, markNotTaking, recordCourse, coursesDue, shape, REASONS };
