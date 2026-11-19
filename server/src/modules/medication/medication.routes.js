const router = require('express').Router({ mergeParams: true });
const { validate } = require('#lib/validate');
const controller = require('./medication.controller');
const s = require('./medication.schema');

router.get('/', validate(s.listSchema), controller.list);
router.post('/', validate(s.addSchema), controller.add);
router.get('/courses-due', controller.coursesDue);
router.patch('/:medicationId', validate(s.updateSchema), controller.update);
router.post('/:medicationId/prescriber', validate(s.prescriberSchema), controller.setPrescriber);
router.post('/:medicationId/not-taking', validate(s.notTakingSchema), controller.notTaking);
router.post('/:medicationId/course', validate(s.courseSchema), controller.course);

module.exports = router;
