const router = require('express').Router();
const { validate } = require('#lib/validate');
const { requireUser } = require('#middleware/auth');
const controller = require('./auth.controller');
const { requestSchema, verifySchema, updateMeSchema } = require('./auth.schema');

router.post('/otp', validate(requestSchema), controller.request);
router.post('/verify', validate(verifySchema), controller.verify);
router.get('/me', requireUser, controller.me);
router.patch('/me', requireUser, validate(updateMeSchema), controller.updateMe);
router.post('/logout', requireUser, controller.logout);

module.exports = router;
