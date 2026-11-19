const ALIASES = {
  amoxicillin: 'amoxycillin',
  acetaminophen: 'paracetamol',
  'clavulanate potassium': 'clavulanic acid',
  clavulanate: 'clavulanic acid',
  'potassium clavulanate': 'clavulanic acid',
  'metformin hydrochloride': 'metformin',
  'metformin hcl': 'metformin',
  'atorvastatin calcium': 'atorvastatin',
  'rosuvastatin calcium': 'rosuvastatin',
  'amlodipine besylate': 'amlodipine',
  'losartan potassium': 'losartan',
  hctz: 'hydrochlorothiazide',
  'sitagliptin phosphate': 'sitagliptin',
  'clopidogrel bisulphate': 'clopidogrel',
  'diclofenac sodium': 'diclofenac',
  'diclofenac potassium': 'diclofenac',
  'acetylsalicylic acid': 'aspirin',
};

const normalizeIngredient = (raw) => {
  if (!raw) return null;
  const key = String(raw)
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!key) return null;
  return ALIASES[key] ?? key;
};

const parseStrength = (text) => {
  if (!text) return { value: null, unit: null, strengthText: null };
  const clean = text.replace(/\s+/g, '');
  const match = clean.match(/^([\d.]+)(mg|mcg|g|iu|ml|%)$/i);
  if (!match) return { value: null, unit: null, strengthText: text.trim() };
  let value = Number(match[1]);
  let unit = match[2].toLowerCase();
  if (unit === 'g') {
    value *= 1000;
    unit = 'mg';
  }
  if (unit === 'mcg') {
    value /= 1000;
    unit = 'mg';
  }
  return { value: Number.isFinite(value) ? value : null, unit, strengthText: text.trim() };
};

const parseComposition = (composition) =>
  (composition ?? '')
    .split('+')
    .map((piece) => piece.trim())
    .filter(Boolean)
    .map((piece) => {
      const strength = piece.match(/\(([^)]*)\)\s*$/);
      const name = piece.replace(/\(([^)]*)\)\s*$/, '').trim();
      const key = normalizeIngredient(name);
      return key ? { key, display: name.replace(/\s+/g, ' '), ...parseStrength(strength?.[1]) } : null;
    })
    .filter(Boolean);

const searchName = (name) =>
  String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

module.exports = { normalizeIngredient, parseComposition, parseStrength, searchName };
