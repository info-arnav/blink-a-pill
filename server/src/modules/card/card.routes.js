const router = require('express').Router({ mergeParams: true });
const { validate } = require('#lib/validate');
const { z, uuid } = require('#lib/schemas');
const service = require('./card.service');

const revokeSchema = z.object({ params: z.object({ patientId: uuid, pharmacyId: uuid }) });

router.get('/', async (req, res) => res.success(await service.getForPatient(req.params.patientId)));
router.post('/regenerate', async (req, res) => res.success(await service.regenerate(req.params.patientId)));
router.get('/pharmacies', async (req, res) => res.success(await service.approvedPharmacies(req.params.patientId)));
router.delete('/pharmacies/:pharmacyId', validate(revokeSchema), async (req, res) => {
  await service.revokePharmacy(req.params.patientId, req.input.params.pharmacyId);
  res.success({ revoked: true });
});
router.get('/views', async (req, res) => res.success(await service.recentViews(req.params.patientId)));

module.exports = router;
