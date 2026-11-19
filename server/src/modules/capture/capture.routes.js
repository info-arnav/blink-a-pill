const router = require('express').Router();
const multer = require('multer');
const { AppError } = require('#lib/app-error');
const { requireUser, requirePatientAccess } = require('#middleware/auth');
const controller = require('./capture.controller');

const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) =>
    TYPES.has(file.mimetype) ? done(null, true) : done(new AppError('BAD_PHOTO', 'Use a JPEG, PNG, WebP or HEIC photo', 415)),
});

router.post('/:patientId/capture', requireUser, requirePatientAccess, upload.single('photo'), controller.read);

module.exports = router;
