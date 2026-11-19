const router = require('express').Router();
const { validate } = require('#lib/validate');
const { z, token, pin, name, uuid } = require('#lib/schemas');
const service = require('./card.public');

const viewSchema = z.object({ params: z.object({ token }), body: z.object({ pin }).strict() });
const verifySchema = z.object({
  params: z.object({ token }),
  body: z
    .object({
      pin,
      name,
      registration_number: z.string().trim().regex(/^[A-Za-z0-9/-]{3,30}$/),
      registration_council: z.string().trim().max(80).optional(),
      medication_ids: z.array(uuid).min(1).max(50),
    })
    .strict(),
});

router.post('/:token/view', validate(viewSchema), async (req, res) => res.success(await service.view(req.input.params.token, req.input.body.pin, req.ip)));
router.post('/:token/verify', validate(verifySchema), async (req, res) => res.success(await service.verifyList(req.input.params.token, req.input.body, req.ip)));

module.exports = router;
