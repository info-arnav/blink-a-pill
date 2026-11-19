const service = require('./drug.service');

exports.search = async (req, res) => {
  res.success(await service.searchProducts(req.input.query.q));
};
