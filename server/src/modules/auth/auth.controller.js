const service = require('./auth.service');

exports.request = async (req, res) => {
  await service.request(req.input.body.phone);
  res.success({ sent: true });
};

exports.verify = async (req, res) => res.success(await service.verify(req.input.body));

exports.me = async (req, res) => res.success(await service.me(req.user));

exports.updateMe = async (req, res) => res.success(await service.updateMe(req.user, req.input.body.name));

exports.logout = async (req, res) => {
  await service.logout(req.user);
  res.success({ signed_out: true });
};
