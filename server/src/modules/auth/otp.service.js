const redis = require('#lib/redis');
const { AppError } = require('#lib/app-error');
const { randomDigits, sha256 } = require('#lib/tokens');
const notify = require('#modules/notify/notify.service');

const OTP_TTL = 300;
const MAX_ATTEMPTS = 5;
const MAX_SENDS = 4;

const requestOtp = async (phone, audience) => {
  const sendsKey = `otp-sends::${phone}`;
  const sends = await redis.incr(sendsKey);
  if (sends === 1) await redis.expire(sendsKey, 900);
  if (sends > MAX_SENDS) {
    throw new AppError('OTP_RATE_LIMITED', 'Too many codes requested. Try again in 15 minutes.', 429);
  }
  const code = randomDigits(6);
  await redis.set(
    `otp::${audience}::${phone}`,
    JSON.stringify({ hash: sha256(code), attempts: 0 }),
    'EX',
    OTP_TTL,
  );
  await notify.sendOrThrow(
    phone,
    'otp',
    `${code} is your link-a-pill code. It expires in 5 minutes. Do not share it with anyone.`,
  );
};

const verifyOtp = async (phone, audience, code) => {
  const key = `otp::${audience}::${phone}`;
  const raw = await redis.get(key);
  if (!raw) throw new AppError('OTP_EXPIRED', 'This code has expired. Ask for a new one.', 400);
  const state = JSON.parse(raw);
  if (state.attempts >= MAX_ATTEMPTS) {
    await redis.del(key);
    throw new AppError('OTP_BLOCKED', 'Too many wrong tries. Ask for a new code.', 400);
  }
  if (state.hash !== sha256(code)) {
    state.attempts += 1;
    await redis.set(key, JSON.stringify(state), 'KEEPTTL');
    throw new AppError('OTP_INVALID', 'That code is not right. Check and try again.', 400);
  }
  await redis.del(key);
};

module.exports = { requestOtp, verifyOtp };
