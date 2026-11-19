const service = require('./patient.service');

exports.list = async (req, res) => res.success(await service.list(req.user.id));
exports.create = async (req, res) => res.success(await service.create(req.user.id, req.user.phone, req.input.body), 201);
exports.get = async (req, res) => res.success({ ...(await service.get(req.params.patientId)), role: req.member.role });
exports.update = async (req, res) => res.success(await service.update(req.params.patientId, req.input.body));
exports.members = async (req, res) => res.success(await service.members(req.params.patientId));
exports.invite = async (req, res) => res.success(await service.invite(req.params.patientId, req.user.id, req.input.body.relation), 201);
exports.accept = async (req, res) => res.success(await service.acceptInvite(req.user.id, req.input.body.code));
exports.removeMember = async (req, res) => {
  await service.removeCaregiver(req.params.patientId, req.member.role, req.input.params.userId);
  res.success({ removed: true });
};
exports.conditions = async (req, res) => res.success(await service.conditions(req.params.patientId));
exports.addCondition = async (req, res) => res.success(await service.addCondition(req.params.patientId, req.input.body.name), 201);
