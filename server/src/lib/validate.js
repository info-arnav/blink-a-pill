const { AppError } = require('#lib/app-error');

const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body ?? {},
    params: req.params ?? {},
    query: req.query ?? {},
  });
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue.path.slice(1).join('.') || issue.path.join('.');
    return next(new AppError('VALIDATION_FAILED', `${where}: ${issue.message}`, 422));
  }
  req.input = result.data;
  next();
};

module.exports = { validate };
