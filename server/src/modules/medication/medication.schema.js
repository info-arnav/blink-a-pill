const { z, phone, name, uuid, date, time } = require('#lib/schemas');

const FREQ = z.enum(['OD', 'BD', 'TID', 'QID', 'HS', 'CUSTOM', 'SOS']);
const prescriber = z.object({ name, phone: phone.optional(), speciality: z.string().trim().max(60).optional() }).strict();
const clinic = z.object({ name, reception_phone: phone.optional() }).strict();
const medId = z.object({ patientId: uuid, medicationId: uuid });

exports.listSchema = z.object({ query: z.object({ all: z.enum(['0', '1']).optional() }).strict() });

exports.addSchema = z.object({
  body: z
    .object({
      product_id: z.number().int().positive().optional(),
      name: name.optional(),
      dose_amount: z.number().positive().max(20).optional(),
      dose_unit: z.enum(['tablet', 'capsule', 'ml', 'puff', 'drop', 'unit', 'sachet']).optional(),
      frequency: FREQ,
      times: z.array(time).max(8).optional(),
      meal: z.enum(['before', 'after', 'with', 'any']).optional(),
      start_date: date.optional(),
      duration_days: z.number().int().positive().max(3650).nullable().optional(),
      prescribed_on: date.optional(),
      prescriber: prescriber.optional(),
      clinic: clinic.optional(),
      source: z.enum(['photo', 'manual']),
    })
    .strict()
    .refine((b) => b.product_id || b.name, { message: 'Choose a medicine or type its name', path: ['name'] }),
});

exports.updateSchema = z.object({
  params: medId,
  body: z
    .object({
      dose_amount: z.number().positive().max(20).optional(),
      frequency: FREQ.optional(),
      times: z.array(time).max(8).optional(),
      meal: z.enum(['before', 'after', 'with', 'any']).optional(),
      duration_days: z.number().int().positive().max(3650).nullable().optional(),
    })
    .strict(),
});

exports.prescriberSchema = z.object({
  params: medId,
  body: z.object({ prescriber: prescriber.optional(), clinic: clinic.optional() }).strict(),
});

exports.notTakingSchema = z.object({
  params: medId,
  body: z.object({ reason: z.enum(['doctor_stopped', 'course_finished', 'not_taking', 'added_by_mistake']) }).strict(),
});

exports.courseSchema = z.object({
  params: medId,
  body: z.object({ outcome: z.enum(['finished', 'stopped_early', 'continuing']) }).strict(),
});
