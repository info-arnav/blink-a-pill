const repo = require('./drug.repository');
const { searchName, normalizeIngredient } = require('./drug.normalize');
const { classesOf } = require('#constants/drug-classes');
const { notFound } = require('#lib/app-error');

const shape = (product, parts) => ({
  id: product.id,
  name: product.name,
  composition: product.composition,
  manufacturer: product.manufacturer,
  form: product.form,
  discontinued: product.discontinued,
  ingredients: parts.map((p) => ({
    key: p.key,
    display: p.display.trim(),
    value: p.value == null ? null : Number(p.value),
    unit: p.unit,
    strength: p.strength_text,
  })),
  is_antibiotic: parts.some((p) => classesOf(p.key).includes('antibiotic')),
});

const withIngredients = async (products) => {
  if (!products.length) return [];
  const parts = await repo.ingredientsFor(products.map((p) => p.id));
  return products.map((p) => shape(p, parts.filter((x) => x.product_id === p.id)));
};

const searchProducts = async (q, limit = 8) => {
  const term = searchName(q);
  if (term.length < 2) return [];
  return withIngredients(await repo.search(term, limit));
};

const getProduct = async (id) => {
  const product = await repo.findProduct(id);
  if (!product) throw notFound('Medicine');
  return (await withIngredients([product]))[0];
};

const knownPairsFor = async (keys) => {
  const rows = await repo.interactionsAmong([...new Set(keys)]);
  return new Map(rows.map((r) => [[r.a, r.b].sort().join('|'), r.severity]));
};

const ingredientsFromNames = async (names) => {
  const keys = names.map(normalizeIngredient).filter(Boolean);
  const rows = await repo.findIngredientsByName(keys);
  return rows.map((r) => ({ key: r.key, display: r.display, value: null, unit: null, strength: null }));
};

module.exports = { searchProducts, getProduct, knownPairsFor, ingredientsFromNames };
