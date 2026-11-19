const { validate } = require('#lib/validate');
const { z } = require('#lib/schemas');
const { requireUser, requirePatientAccess } = require('#middleware/auth');
const controller = require('./capture.controller');

const router = require('express').Router();

const photoSchema = z.object({
  body: z
    .object({
      data: z.base64().max(11_000_000),
      mime_type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']),
    })
    .strict(),
});

router.post('/:patientId/capture', requireUser, requirePatientAccess, validate(photoSchema), controller.read);

module.exports = router;
