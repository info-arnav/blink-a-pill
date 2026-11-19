const router = require('express').Router();
const { validate } = require('#lib/validate');
const { requirePharmacy } = require('#middleware/auth');
const { z, phone, token, pin, name, uuid } = require('#lib/schemas');
const drug = require('#modules/drug/drug.service');
const service = require('./pharmacy.service');

const otpSchema = z.object({ body: z.object({ phone }).strict() });
const verifySchema = z.object({
  body: z
    .object({
      phone,
      code: z.string().regex(/^\d{6}$/),
      name: name.optional(),
      licence_number: z.string().trim().min(4).max(60).optional(),
      address: z.string().trim().max(200).optional(),
    })
    .strict(),
});
const cardSchema = z.object({ params: z.object({ token }) });
const unlockSchema = z.object({ params: z.object({ token }), body: z.object({ pin }).strict() });
const checkSchema = z.object({
  params: z.object({ token }),
  body: z.object({ flag_id: uuid.optional(), action: z.enum(['told_patient', 'message_doctor']), note: z.string().trim().max(500).optional() }).strict(),
});
const medicineSchema = z.object({ params: z.object({ token }), body: z.object({ product_id: z.number().int().positive() }).strict() });
const searchSchema = z.object({ query: z.object({ q: z.string().trim().min(2).max(80) }).strict() });

router.post('/auth/otp', validate(otpSchema), async (req, res) => {
  await service.requestCode(req.input.body.phone);
  res.success({ sent: true });
});
router.post('/auth/verify', validate(verifySchema), async (req, res) => res.success(await service.verify(req.input.body)));
router.get('/me', requirePharmacy, async (req, res) => res.success({ pharmacy: req.pharmacy }));
router.get('/drugs/search', requirePharmacy, validate(searchSchema), async (req, res) => res.success(await drug.searchProducts(req.input.query.q)));
router.get('/cards/:token', requirePharmacy, validate(cardSchema), async (req, res) => res.success(await service.checkpoint(req.input.params.token, req.pharmacy, req.ip)));
router.post('/cards/:token/unlock', requirePharmacy, validate(unlockSchema), async (req, res) =>
  res.success(await service.unlock(req.input.params.token, req.input.body.pin, req.pharmacy)),
);
router.post('/cards/:token/checks', requirePharmacy, validate(checkSchema), async (req, res) =>
  res.success(await service.recordCheck(req.input.params.token, req.pharmacy, req.input.body)),
);
router.post('/cards/:token/medicine', requirePharmacy, validate(medicineSchema), async (req, res) =>
  res.success(await service.checkMedicine(req.input.params.token, req.pharmacy, req.input.body.product_id)),
);

module.exports = router;
