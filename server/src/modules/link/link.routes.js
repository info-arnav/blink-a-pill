const router = require('express').Router();
const { validate } = require('#lib/validate');
const { z, token, name, uuid } = require('#lib/schemas');
const service = require('./link.service');

const meta = (req) => ({ ip: req.ip, userAgent: req.headers['user-agent'] });
const tokenSchema = z.object({ params: z.object({ token }) });
const receptionSchema = z.object({
  params: z.object({ token }),
  body: z.object({ result: z.enum(['matches', 'does_not_match']), staff_name: name, note: z.string().trim().max(500).optional() }).strict(),
});
const decisionSchema = z.object({
  params: z.object({ token }),
  body: z
    .object({
      decision: z.enum(['intended', 'not_intended']),
      patient_message: z.enum(['hold_until_contact', 'review_next_visit']).optional(),
      hold_medication_id: uuid.optional(),
      note: z.string().trim().max(1000).optional(),
      name: name.optional(),
      registration_number: z.string().trim().regex(/^[A-Za-z0-9/-]{3,30}$/, 'Enter a valid registration number').optional(),
      registration_council: z.string().trim().max(80).optional(),
    })
    .strict()
    .refine((b) => b.decision === 'intended' || b.patient_message, { message: 'Choose what the patient should be told', path: ['patient_message'] }),
});

router.get('/reception/:token', validate(tokenSchema), async (req, res) => res.success(await service.receptionView(req.input.params.token, meta(req))));
router.post('/reception/:token', validate(receptionSchema), async (req, res) =>
  res.success(await service.receptionSubmit(req.input.params.token, req.input.body, meta(req))),
);
router.get('/prescriber/:token', validate(tokenSchema), async (req, res) => res.success(await service.prescriberView(req.input.params.token, meta(req))));
router.post('/prescriber/:token', validate(decisionSchema), async (req, res) =>
  res.success(await service.prescriberDecide(req.input.params.token, req.input.body, meta(req))),
);
router.get('/answer/:token', validate(tokenSchema), async (req, res) => res.success(await service.patientAnswer(req.input.params.token, meta(req))));

module.exports = router;
