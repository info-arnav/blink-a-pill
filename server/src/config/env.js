const { z } = require('zod');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  PUBLIC_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  LINK_TTL_HOURS: z.coerce.number().int().positive().default(72),
  GOOGLE_CLOUD_PROJECT: z.string().min(1),
  GOOGLE_CLOUD_LOCATION: z.string().default('global'),
  GEMINI_MODEL: z.string().default('gemini-3.5-flash'),
  WHATSAPP_TOKEN: z.string().min(1),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1),
  WHATSAPP_GRAPH_VERSION: z.string().default('v23.0'),
  WHATSAPP_ALLOWED_RECIPIENTS: z.string().default(''),
  DRUG_DATA_URL: z
    .url()
    .default(
      'https://raw.githubusercontent.com/junioralive/Indian-Medicine-Dataset/main/DATA/updated_indian_medicine_data.csv',
    ),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const fields = parsed.error.issues.map((issue) => issue.path.join('.'));
  console.error(JSON.stringify({ level: 'fatal', msg: 'env.invalid', fields }));
  process.exit(1);
}

const env = parsed.data;

env.allowedRecipients = env.WHATSAPP_ALLOWED_RECIPIENTS.split(',')
  .map((value) => value.trim())
  .filter(Boolean);

module.exports = env;
