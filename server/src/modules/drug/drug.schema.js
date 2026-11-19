const { z } = require('zod');

exports.searchSchema = z.object({
  query: z.object({ q: z.string().trim().min(2).max(80) }).strict(),
});
