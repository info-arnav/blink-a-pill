class AppError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

const notFound = (what) => new AppError('NOT_FOUND', `${what} not found`, 404);
const forbidden = () =>
  new AppError('FORBIDDEN', 'You do not have access to this', 403);
const unauthorized = () =>
  new AppError('UNAUTHORIZED', 'Please sign in again', 401);

module.exports = { AppError, notFound, forbidden, unauthorized };
