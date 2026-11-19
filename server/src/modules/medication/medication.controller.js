const service = require('./medication.service');

exports.list = async (req, res) => res.success(await service.list(req.params.patientId, req.input.query.all === '1'));
exports.add = async (req, res) => res.success(await service.add(req.params.patientId, req.actor, req.input.body), 201);
exports.update = async (req, res) =>
  res.success(await service.updateSchedule(req.params.patientId, req.input.params.medicationId, { ...req.input.body, actor: req.actor }));
exports.setPrescriber = async (req, res) =>
  res.success(await service.setPrescriber(req.params.patientId, req.input.params.medicationId, req.input.body));
exports.notTaking = async (req, res) =>
  res.success(await service.markNotTaking(req.params.patientId, req.input.params.medicationId, req.input.body.reason, req.actor));
exports.course = async (req, res) =>
  res.success(await service.recordCourse(req.params.patientId, req.input.params.medicationId, req.input.body.outcome, req.actor));
exports.coursesDue = async (req, res) => res.success(await service.coursesDue(req.params.patientId));
