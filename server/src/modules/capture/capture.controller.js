const service = require('./capture.service');

exports.read = async (req, res) => {
  const { data, mime_type: mimeType } = req.input.body;
  res.success(await service.readPhoto({ mimetype: mimeType, buffer: Buffer.from(data, 'base64') }));
};
