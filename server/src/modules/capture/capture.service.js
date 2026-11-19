const gemini = require('#clients/gemini.client');
const logger = require('#lib/logger');
const { AppError } = require('#lib/app-error');
const { FREQUENCIES, timesFromPattern } = require('#constants/schedule');
const drug = require('#modules/drug/drug.service');
const { INSTRUCTION, SCHEMA } = require('./capture.prompt');

const strengthNumbers = (text) => (text ?? '').match(/\d+(\.\d+)?/g) ?? [];

const FORM_WORDS = new Set(['tablet', 'capsule', 'syrup', 'suspension', 'injection', 'tab', 'cap', 'drop', 'drops']);

const words = (text) => (text ?? '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !FORM_WORDS.has(w));

const rankByStrength = (candidates, writtenName, strength) => {
  const wanted = strengthNumbers(strength);
  const written = new Set(words(`${writtenName} ${strength ?? ''}`));
  const score = (c) => {
    const have = c.ingredients.map((i) => String(i.value ?? ''));
    const strengthHits = wanted.filter((w) => have.includes(w)).length;
    const nameWords = words(c.name);
    const extra = nameWords.filter((w) => !written.has(w) && !have.includes(w)).length;
    return strengthHits * 2 - extra * 0.5;
  };
  return [...candidates].sort((a, b) => score(b) - score(a));
};

const digits = (value) => {
  const d = (value ?? '').replace(/\D/g, '');
  if (d.length === 10) return d;
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  return null;
};

const readPhoto = async (file) => {
  let read;
  try {
    read = await gemini.generateJson({
      instruction: INSTRUCTION,
      image: { mimeType: file.mimetype, data: file.buffer },
      schema: SCHEMA,
    });
  } catch (err) {
    logger.error('capture.gemini.failed', { err: err.message });
    throw new AppError('READ_FAILED', 'We could not read this photo. Try again in good light, or type the medicine instead.', 502);
  }

  if (read.kind === 'other' || !read.items?.length) {
    return { kind: read.kind, doctor: null, clinic: null, prescribed_on: null, items: [] };
  }

  const items = await Promise.all(
    read.items.slice(0, 12).map(async (item) => {
      const query = `${item.written_name} ${strengthNumbers(item.strength)[0] ?? ''}`.trim();
      let candidates = await drug.searchProducts(query, 6);
      if (!candidates.length) candidates = await drug.searchProducts(item.written_name, 6);
      const code = FREQUENCIES[item.frequency_code] ? item.frequency_code : 'CUSTOM';
      const patternTimes = timesFromPattern(item.times_pattern);
      return {
        written_name: item.written_name,
        strength: item.strength ?? null,
        dose_amount: item.dose_amount ?? 1,
        dose_unit: item.dose_unit ?? 'tablet',
        frequency: item.frequency_code === 'SOS' ? 'SOS' : code,
        times: patternTimes ?? FREQUENCIES[code]?.times ?? [],
        meal: item.meal ?? 'any',
        duration_days: item.duration_days ?? null,
        confidence: item.confidence,
        candidates: rankByStrength(candidates, item.written_name, item.strength).slice(0, 3),
      };
    }),
  );

  return {
    kind: read.kind,
    doctor: read.doctor_name ? { name: read.doctor_name, phone: digits(read.doctor_phone) ?? digits(read.clinic_phone) } : null,
    clinic: read.clinic_name ? { name: read.clinic_name, phone: digits(read.clinic_phone) } : null,
    prescribed_on: /^\d{4}-\d{2}-\d{2}$/.test(read.prescribed_on ?? '') ? read.prescribed_on : null,
    items,
  };
};

module.exports = { readPhoto };
