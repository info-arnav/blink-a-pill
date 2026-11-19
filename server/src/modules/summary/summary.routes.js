const router = require('express').Router({ mergeParams: true });
const service = require('./summary.service');

router.get('/answers', async (req, res) => res.success(await service.answers(req.params.patientId)));
router.get('/notifications', async (req, res) => res.success(await service.notifications(req.params.patientId)));
router.post('/notifications/read', async (req, res) => {
  await service.markRead(req.params.patientId);
  res.success({ read: true });
});

module.exports = router;
