const INSTRUCTION = `You read photos of Indian medical prescriptions, medicine strips and medicine boxes for a medication safety app.
Extract only what is visibly written. Never guess a medicine that is not written. If a field is not visible, use null.
For each medicine line return:
- written_name: the brand or generic name exactly as written, without the "Tab", "Cap", "Syp" or "Inj" prefix.
- strength: strength as written, for example "40 mg" or "500/125", or null.
- dose_amount: how many units per dose (for example 1 or 0.5), or null.
- dose_unit: tablet, capsule, ml, puff, drop or unit.
- frequency_code: OD (once daily), BD (twice), TID (three times), QID (four times), HS (at bedtime), SOS (only when needed) or OTHER. Read Indian shorthand: 1-0-1 is BD (morning and night), 1-1-1 is TID, 1-0-0 or 0-0-1 is OD, 0-0-1 at night is HS.
- times_pattern: the morning-afternoon-night pattern if written, such as "1-0-1", else null.
- meal: before, after, with or any (AC is before food, PC is after food).
- duration_days: number of days if written (for example "x 5 days" is 5, "1 week" is 7, "continue" or none is null).
- confidence: 0 to 1, how sure you are that you read this line correctly.
Also return the doctor's name, the clinic or hospital name, any phone numbers printed for the doctor or clinic (digits only), and the prescription date as YYYY-MM-DD if visible.
kind is "prescription" for a doctor's prescription, "medicine_pack" for a strip, bottle or box, or "other" if this is not about medicines.`;

const SCHEMA = {
  type: 'object',
  properties: {
    kind: { type: 'string', enum: ['prescription', 'medicine_pack', 'other'] },
    doctor_name: { type: ['string', 'null'] },
    doctor_phone: { type: ['string', 'null'] },
    clinic_name: { type: ['string', 'null'] },
    clinic_phone: { type: ['string', 'null'] },
    prescribed_on: { type: ['string', 'null'] },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          written_name: { type: 'string' },
          strength: { type: ['string', 'null'] },
          dose_amount: { type: ['number', 'null'] },
          dose_unit: { type: ['string', 'null'] },
          frequency_code: { type: 'string', enum: ['OD', 'BD', 'TID', 'QID', 'HS', 'SOS', 'OTHER'] },
          times_pattern: { type: ['string', 'null'] },
          meal: { type: 'string', enum: ['before', 'after', 'with', 'any'] },
          duration_days: { type: ['integer', 'null'] },
          confidence: { type: 'number' },
        },
        required: ['written_name', 'frequency_code', 'meal', 'confidence'],
      },
    },
  },
  required: ['kind', 'items'],
};

module.exports = { INSTRUCTION, SCHEMA };
