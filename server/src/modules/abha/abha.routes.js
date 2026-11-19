const router = require('express').Router({ mergeParams: true });
const { validate } = require('#lib/validate');
const { z, uuid } = require('#lib/schemas');
const service = require('./abha.service');

const requestSchema = z.object({ body: z.object({ abha_address: z.string().trim().toLowerCase().regex(/^[a-z0-9._]{3,40}@[a-z]{2,10}$/, 'Enter an ABHA address like name@sbx') }).strict() });
const consentSchema = z.object({ params: z.object({ patientId: uuid, requestId: z.string().regex(/^[A-Za-z0-9_-]{8,40}$/) }) });

router.post('/consents', validate(requestSchema), async (req, res) => res.success(await service.requestConsent(req.params.patientId, req.input.body.abha_address), 201));
router.post('/consents/:requestId/approve', validate(consentSchema), async (req, res) =>
  res.success(await service.approve(req.params.patientId, req.actor, req.input.params.requestId)),
);
router.post('/consents/:requestId/deny', validate(consentSchema), async (req, res) => {
  await service.deny(req.params.patientId, req.input.params.requestId);
  res.success({ denied: true });
});

module.exports = router;
