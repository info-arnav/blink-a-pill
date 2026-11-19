const router = require('express').Router({ mergeParams: true });
const { validate } = require('#lib/validate');
const { z, phone, name, date, time } = require('#lib/schemas');
const service = require('./prescription.service');

const medicine = z
  .object({
    product_id: z.number().int().positive().optional(),
    name: name.optional(),
    dose_amount: z.number().positive().max(20).optional(),
    dose_unit: z.enum(['tablet', 'capsule', 'ml', 'puff', 'drop', 'unit', 'sachet']).optional(),
    frequency: z.enum(['OD', 'BD', 'TID', 'QID', 'HS', 'CUSTOM', 'SOS']),
    times: z.array(time).max(8).optional(),
    meal: z.enum(['before', 'after', 'with', 'any']).optional(),
    duration_days: z.number().int().positive().max(3650).nullable().optional(),
  })
  .strict()
  .refine((m) => m.product_id || m.name, { message: 'Choose a medicine or type its name' });

const diagnosis = z
  .object({
    name: z.string().trim().min(1).max(120),
    written_as: z.string().trim().max(120).optional(),
    certainty: z.enum(['confirmed', 'provisional', 'history']),
  })
  .strict();

const createSchema = z.object({
  body: z
    .object({
      prescriber: z.object({ name, phone: phone.optional(), speciality: z.string().trim().max(60).optional() }).strict().optional(),
      clinic: z.object({ name, reception_phone: phone.optional() }).strict().optional(),
      prescribed_on: date.optional(),
      reason: z.string().trim().max(300).optional(),
      diagnoses: z.array(diagnosis).max(10).default([]),
      medications: z.array(medicine).max(15).default([]),
    })
    .strict()
    .refine((b) => b.diagnoses.length || b.medications.length, { message: 'Nothing to save' }),
});

router.get('/', async (req, res) => res.success(await service.list(req.params.patientId)));
router.post('/', validate(createSchema), async (req, res) => res.success(await service.create(req.params.patientId, req.actor, req.input.body), 201));

module.exports = router;
