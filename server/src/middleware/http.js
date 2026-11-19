const crypto = require('node:crypto');
const { AppError } = require('#lib/app-error');
const logger = require('#lib/logger');

const requestContext = (req, res, next) => {
  req.rid = crypto.randomUUID();
  res.setHeader('x-request-id', req.rid);
  res.success = (data, status = 200) => res.status(status).json({ data });
  const started = Date.now();
  res.on('finish', () => {
    logger.info('http.request', {
      rid: req.rid,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - started,
    });
  });
  next();
};

const notFoundRoute = (req, _res, next) =>
  next(new AppError('ROUTE_NOT_FOUND', `No route for ${req.method} ${req.path}`, 404));

const errorHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    return res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message, rid: req.rid } });
  }
  if (err?.type === 'entity.too.large' || err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: { code: 'TOO_LARGE', message: 'That file is too large', rid: req.rid },
    });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'BAD_JSON', message: 'The request body is not valid JSON', rid: req.rid },
    });
  }
  logger.error('http.unhandled', { rid: req.rid, err: err?.message, stack: err?.stack });
  res.status(500).json({
    error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.', rid: req.rid },
  });
};

module.exports = { requestContext, notFoundRoute, errorHandler };
