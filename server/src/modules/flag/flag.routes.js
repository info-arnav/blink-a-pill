const router = require('express').Router({ mergeParams: true });
const { validate } = require('#lib/validate');
const { z, uuid, phone, name } = require('#lib/schemas');
const service = require('./flag.service');
const link = require('#modules/link/link.service');

const listSchema = z.object({ query: z.object({ open: z.enum(['0', '1']).optional() }).strict() });
const oneSchema = z.object({ params: z.object({ patientId: uuid, flagId: uuid }) });
const askSchema = z.object({
  params: z.object({ patientId: uuid, flagId: uuid }),
  body: z
    .object({
      prescriber: z.object({ name, phone, speciality: z.string().trim().max(60).optional() }).strict(),
      clinic: z.object({ name, reception_phone: phone.optional() }).strict().optional(),
    })
    .strict(),
});

router.get('/', validate(listSchema), async (req, res) => res.success(await service.list(req.params.patientId, { openOnly: req.input.query.open === '1' })));
router.get('/:flagId', validate(oneSchema), async (req, res) => res.success(await service.withHistory(req.params.patientId, req.input.params.flagId)));
router.post('/:flagId/ask', validate(askSchema), async (req, res) =>
  res.success(await link.ask(req.params.patientId, req.input.params.flagId, req.actor, req.input.body)),
);

module.exports = router;
