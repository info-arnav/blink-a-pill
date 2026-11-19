const env = require('#config/env');

const sendText = async (to, body) => {
  const response = await fetch(
    `https://graph.facebook.com/${env.WHATSAPP_GRAPH_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: true, body },
      }),
    },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = payload?.error ?? {};
    return { ok: false, code: error.code ?? response.status, message: error.message ?? 'send failed' };
  }
  return { ok: true, id: payload?.messages?.[0]?.id ?? null };
};

module.exports = { sendText };
