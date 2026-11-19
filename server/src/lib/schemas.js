const { z } = require('zod');
const { toE164India } = require('#lib/phone');

const phone = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const normalized = toE164India(value);
    if (!normalized) {
      ctx.addIssue({ code: 'custom', message: 'Enter a 10 digit Indian mobile number' });
      return z.NEVER;
    }
    return normalized;
  });

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM');
const name = z.string().trim().min(1).max(120);
const uuid = z.uuid();
const token = z.string().regex(/^[A-Za-z0-9_-]{10,64}$/);
const pin = z.string().regex(/^\d{6}$/, 'PIN is 6 digits');
const params = (shape) => z.object(shape);
const empty = z.object({}).strict();

module.exports = { z, phone, date, time, name, uuid, token, pin, params, empty };
