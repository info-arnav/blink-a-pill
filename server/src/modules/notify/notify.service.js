const env = require('#config/env');
const db = require('#lib/db');
const logger = require('#lib/logger');
const { AppError } = require('#lib/app-error');
const whatsapp = require('#clients/whatsapp.client');

const WINDOW_CLOSED = 131047;

const send = async (phone, kind, body) => {
  if (env.allowedRecipients.length && !env.allowedRecipients.includes(phone)) {
    await db.query(
      'INSERT INTO outbound_messages (phone, kind, status, error) VALUES ($1, $2, $3, $4)',
      [phone, kind, 'blocked', 'recipient not on WHATSAPP_ALLOWED_RECIPIENTS'],
    );
    logger.warn('notify.blocked', { kind });
    return { ok: false, reason: 'not_allowed' };
  }
  const result = await whatsapp.sendText(phone, body);
  await db.query(
    'INSERT INTO outbound_messages (phone, kind, status, provider_id, error) VALUES ($1, $2, $3, $4, $5)',
    [phone, kind, result.ok ? 'sent' : 'failed', result.id ?? null, result.ok ? null : `${result.code}: ${result.message}`],
  );
  if (!result.ok) {
    logger.warn('notify.failed', { kind, code: result.code });
    return { ok: false, reason: result.code === WINDOW_CLOSED ? 'window_closed' : 'failed' };
  }
  return { ok: true };
};

const sendOrThrow = async (phone, kind, body) => {
  const result = await send(phone, kind, body);
  if (result.ok) return result;
  if (result.reason === 'not_allowed') {
    throw new AppError('RECIPIENT_NOT_ALLOWED', 'WhatsApp is limited to approved test numbers right now', 403);
  }
  if (result.reason === 'window_closed') {
    throw new AppError(
      'WHATSAPP_WINDOW_CLOSED',
      'We could not reach this number on WhatsApp. Send any message to our WhatsApp number first, then try again.',
      409,
    );
  }
  throw new AppError('WHATSAPP_FAILED', 'We could not send the WhatsApp message. Please try again.', 502);
};

module.exports = { send, sendOrThrow };
