const router = require('express').Router({ mergeParams: true });
const { validate } = require('#lib/validate');
const { z, uuid, date } = require('#lib/schemas');
const service = require('./lab.service');

const KINDS = ['creatinine', 'egfr', 'child_pugh', 'potassium', 'hba1c', 'fasting_glucose', 'bp_systolic', 'bp_diastolic', 'alt', 'bilirubin', 'albumin', 'inr'];

const addSchema = z.object({
  body: z
    .object({
      kind: z.enum(KINDS),
      value: z.number().positive().max(10000).optional(),
      value_text: z.enum(['A', 'B', 'C']).optional(),
      child_pugh: z
        .object({
          bilirubin: z.number().positive().max(50),
          albumin: z.number().positive().max(10),
          inr: z.number().positive().max(15),
          ascites: z.enum(['none', 'mild', 'moderate_severe']),
          encephalopathy: z.enum(['none', 'grade_1_2', 'grade_3_4']),
        })
        .strict()
        .optional(),
      measured_on: date.optional(),
    })
    .strict()
    .refine((b) => b.kind === 'child_pugh' || b.value != null, { message: 'Enter the value', path: ['value'] }),
});
const removeSchema = z.object({ params: z.object({ patientId: uuid, labId: uuid }) });

router.get('/', async (req, res) => res.success(await service.list(req.params.patientId)));
router.post('/', validate(addSchema), async (req, res) => res.success(await service.add(req.params.patientId, req.actor, req.input.body), 201));
router.delete('/:labId', validate(removeSchema), async (req, res) => {
  await service.remove(req.params.patientId, req.input.params.labId, req.actor);
  res.success({ removed: true });
});

module.exports = router;
