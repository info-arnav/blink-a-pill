const db = require('#lib/db');
const { AppError } = require('#lib/app-error');
const record = require('#modules/patient/record.service');
const flagRepo = require('#modules/flag/flag.repository');
const card = require('./card.service');

const view = async (token, pin, ip) => {
  const patientId = await card.checkPin(token, pin);
  await card.logView(patientId, 'clinician', null, ip);
  const rec = await record.build(patientId, { includeEvents: true });
  return { ...rec, card_url: card.cardUrl(token) };
};

const verifyList = async (token, input, ip) => {
  const patientId = await card.checkPin(token, input.pin);
  const label = `Verified by ${input.name} (Reg. ${input.registration_number}${input.registration_council ? `, ${input.registration_council}` : ''}) on ${new Date().toISOString().slice(0, 10)}`;
  const updated = await db.many(
    `UPDATE medications SET confirmed_by = $3, updated_at = now()
     WHERE patient_id = $1 AND status = 'active' AND id = ANY($2::uuid[]) RETURNING id, display_name`,
    [patientId, input.medication_ids, label],
  );
  if (!updated.length) throw new AppError('NOTHING_VERIFIED', 'Select at least one medicine on the current list', 422);
  const openFlags = await db.many(
    `SELECT id FROM flags WHERE patient_id = $1 AND status IN ('open', 'asked', 'with_prescriber') AND medication_ids && $2::uuid[]`,
    [patientId, input.medication_ids],
  );
  for (const f of openFlags) {
    await flagRepo.addEvent(f.id, {
      actor_type: 'prescriber',
      actor_name: input.name,
      actor_ref: `Reg. ${input.registration_number}`,
      action: 'reviewed the list from the patient card',
      note: 'This does not close the concern. Use the decision link to answer it.',
    });
  }
  await card.logView(patientId, `verified by ${input.name}`, null, ip);
  return { verified: updated.map((m) => m.display_name), label };
};

module.exports = { view, verifyList };
