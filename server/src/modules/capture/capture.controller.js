const { AppError } = require('#lib/app-error');
const service = require('./capture.service');

exports.read = async (req, res) => {
  if (!req.file) throw new AppError('PHOTO_REQUIRED', 'Attach a photo', 422);
  res.success(await service.readPhoto(req.file));
};
