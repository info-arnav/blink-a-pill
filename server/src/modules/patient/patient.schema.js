const { z, phone, name, uuid } = require('#lib/schemas');

exports.createSchema = z.object({
  body: z
    .object({
      for_self: z.boolean(),
      full_name: name,
      age: z.number().int().min(0).max(120),
      gender: z.enum(['female', 'male', 'other']),
      phone: phone.optional(),
      relation: z.string().trim().max(40).optional(),
      abha_address: z.string().trim().max(80).optional(),
    })
    .strict(),
});

exports.updateSchema = z.object({
  body: z
    .object({
      full_name: name.optional(),
      age: z.number().int().min(0).max(120).optional(),
      gender: z.enum(['female', 'male', 'other']).optional(),
      weight_kg: z.number().min(1).max(400).nullable().optional(),
    })
    .strict(),
});

exports.inviteSchema = z.object({ body: z.object({ relation: z.string().trim().max(40).optional() }).strict() });

exports.acceptSchema = z.object({ body: z.object({ code: z.string().trim().regex(/^[A-Za-z0-9]{6}$/) }).strict() });

exports.memberSchema = z.object({ params: z.object({ patientId: uuid, userId: uuid }) });

exports.conditionSchema = z.object({ body: z.object({ name }).strict() });
