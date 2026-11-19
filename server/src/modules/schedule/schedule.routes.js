const router = require('express').Router({ mergeParams: true });
const { validate } = require('#lib/validate');
const { z, uuid, date, time } = require('#lib/schemas');
const service = require('./schedule.service');

const daySchema = z.object({ query: z.object({ date: date.optional() }).strict() });
const logSchema = z.object({
  body: z.object({ medication_id: uuid, time, date: date.optional(), status: z.enum(['taken', 'missed']) }).strict(),
});

router.get('/', validate(daySchema), async (req, res) => res.success(await service.day(req.params.patientId, req.input.query.date)));
router.post('/doses', validate(logSchema), async (req, res) => res.success(await service.log(req.params.patientId, req.actor, req.input.body)));
router.get('/adherence', async (req, res) => res.success(await service.adherence(req.params.patientId)));

module.exports = router;
