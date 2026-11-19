const router = require('express').Router();
const { validate } = require('#lib/validate');
const { requireUser } = require('#middleware/auth');
const controller = require('./drug.controller');
const { searchSchema } = require('./drug.schema');

router.get('/search', requireUser, validate(searchSchema), controller.search);

module.exports = router;
