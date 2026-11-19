const { z, phone, name } = require('#lib/schemas');

exports.requestSchema = z.object({ body: z.object({ phone }).strict() });

exports.verifySchema = z.object({
  body: z
    .object({
      phone,
      code: z.string().regex(/^\d{6}$/),
      name: name.optional(),
      consent_whatsapp: z.boolean().optional(),
      consent_sharing: z.boolean().optional(),
    })
    .strict(),
});

exports.updateMeSchema = z.object({ body: z.object({ name }).strict() });
