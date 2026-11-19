const router = require('express').Router();
const { validate } = require('#lib/validate');
const { requireUser, requirePatientAccess } = require('#middleware/auth');
const controller = require('./patient.controller');
const s = require('./patient.schema');

const scoped = [requireUser, requirePatientAccess];

router.get('/', requireUser, controller.list);
router.post('/', requireUser, validate(s.createSchema), controller.create);
router.post('/invites/accept', requireUser, validate(s.acceptSchema), controller.accept);
router.get('/:patientId', scoped, controller.get);
router.patch('/:patientId', scoped, validate(s.updateSchema), controller.update);
router.get('/:patientId/members', scoped, controller.members);
router.post('/:patientId/invites', scoped, validate(s.inviteSchema), controller.invite);
router.delete('/:patientId/members/:userId', scoped, validate(s.memberSchema), controller.removeMember);
router.get('/:patientId/conditions', scoped, controller.conditions);
router.post('/:patientId/conditions', scoped, validate(s.conditionSchema), controller.addCondition);

module.exports = router;
