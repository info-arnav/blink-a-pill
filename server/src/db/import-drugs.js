const { Readable } = require('node:stream');
const { parse } = require('csv-parse');
const env = require('#config/env');
const db = require('#lib/db');
const logger = require('#lib/logger');
const { normalizeIngredient, parseComposition, searchName } = require('#modules/drug/drug.normalize');

const SEVERITY = { 'LIFE-THREATENING': 'life_threatening', SERIOUS: 'serious', MODERATE: 'moderate', MINOR: 'minor' };
const RANK = { minor: 1, moderate: 2, serious: 3, life_threatening: 4 };
const BATCH = 2000;

const formOf = (name) => {
  const words = name.trim().split(/\s+/);
  return words[words.length - 1].toLowerCase();
};

const ingredientIds = new Map();

const ensureIngredients = async (names) => {
  const missing = [...new Set(names)].filter((n) => !ingredientIds.has(n.key));
  if (!missing.length) return;
  const keys = [...new Set(missing.map((n) => n.key))];
  const displays = keys.map((key) => missing.find((n) => n.key === key).display);
  const rows = await db.many(
    `INSERT INTO ingredients (name, display)
     SELECT * FROM unnest($1::text[], $2::text[])
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name`,
    [keys, displays],
  );
  for (const row of rows) ingredientIds.set(row.name, row.id);
};

const flushProducts = async (batch) => {
  if (!batch.length) return;
  await ensureIngredients(batch.flatMap((p) => p.parts.map((part) => ({ key: part.key, display: part.display }))));
  await db.query(
    `INSERT INTO products (id, name, manufacturer, pack, form, discontinued, composition, search_name)
     SELECT * FROM unnest($1::int[], $2::text[], $3::text[], $4::text[], $5::text[], $6::bool[], $7::text[], $8::text[])
     ON CONFLICT (id) DO NOTHING`,
    [
      batch.map((p) => p.id),
      batch.map((p) => p.name),
      batch.map((p) => p.manufacturer),
      batch.map((p) => p.pack),
      batch.map((p) => p.form),
      batch.map((p) => p.discontinued),
      batch.map((p) => p.composition),
      batch.map((p) => p.search),
    ],
  );
  const links = batch.flatMap((p) => {
    const seen = new Set();
    return p.parts
      .filter((part) => {
        const id = ingredientIds.get(part.key);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((part) => ({ productId: p.id, ingredientId: ingredientIds.get(part.key), ...part }));
  });
  if (!links.length) return;
  await db.query(
    `INSERT INTO product_ingredients (product_id, ingredient_id, strength_value, strength_unit, strength_text)
     SELECT * FROM unnest($1::int[], $2::int[], $3::numeric[], $4::text[], $5::text[])
     ON CONFLICT DO NOTHING`,
    [
      links.map((l) => l.productId),
      links.map((l) => l.ingredientId),
      links.map((l) => l.value),
      links.map((l) => l.unit),
      links.map((l) => l.strengthText),
    ],
  );
};

const importDrugs = async () => {
  const done = await db.one(`SELECT rows FROM data_imports WHERE name = 'drugs'`);
  if (done) {
    logger.info('drugs.import.skipped', { products: done.rows });
    return;
  }
  await db.query('TRUNCATE ingredient_interactions, product_ingredients, products, ingredients RESTART IDENTITY CASCADE');

  logger.info('drugs.import.download', { url: env.DRUG_DATA_URL });
  const response = await fetch(env.DRUG_DATA_URL);
  if (!response.ok) throw new Error(`download failed with ${response.status}`);

  const parser = Readable.fromWeb(response.body).pipe(
    parse({ columns: true, relax_quotes: true, relax_column_count: true, skip_empty_lines: true }),
  );

  const pairs = new Map();
  let batch = [];
  let count = 0;

  for await (const row of parser) {
    if ((row.type ?? '').trim().toLowerCase() !== 'allopathy') continue;
    const composition = [row.short_composition1, row.short_composition2]
      .map((c) => (c ?? '').trim())
      .filter(Boolean)
      .join(' + ');
    const parts = parseComposition(composition);
    if (!parts.length) continue;

    batch.push({
      id: Number(row.id),
      name: row.name.trim(),
      manufacturer: (row.manufacturer_name ?? '').trim() || null,
      pack: (row.pack_size_label ?? '').trim() || null,
      form: formOf(row.name),
      discontinued: String(row.Is_discontinued).toUpperCase() === 'TRUE',
      composition,
      search: searchName(row.name),
      parts,
    });

    if (parts.length === 1 && row.drug_interactions) {
      try {
        const info = JSON.parse(row.drug_interactions);
        (info.drug ?? []).forEach((other, index) => {
          const severity = SEVERITY[info.effect?.[index]];
          const otherKey = normalizeIngredient(other);
          if (!severity || !otherKey || otherKey === parts[0].key) return;
          const key = [parts[0].key, otherKey].sort().join('|');
          const current = pairs.get(key);
          if (!current || RANK[severity] > RANK[current.severity]) {
            pairs.set(key, { a: parts[0], b: { key: otherKey, display: other.trim() }, severity });
          }
        });
      } catch {
        logger.warn('drugs.import.bad_interaction_json', { id: row.id });
      }
    }

    if (batch.length >= BATCH) {
      await flushProducts(batch);
      count += batch.length;
      batch = [];
      if (count % 20000 === 0) logger.info('drugs.import.progress', { count });
    }
  }
  await flushProducts(batch);
  count += batch.length;

  const pairList = [...pairs.values()];
  await ensureIngredients(pairList.flatMap((p) => [p.a, p.b]));
  const rows = pairList
    .map((p) => {
      const a = ingredientIds.get(p.a.key);
      const b = ingredientIds.get(p.b.key);
      return a < b ? [a, b, p.severity] : [b, a, p.severity];
    })
    .filter(([a, b]) => a !== b);
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    await db.query(
      `INSERT INTO ingredient_interactions (a_id, b_id, severity)
       SELECT * FROM unnest($1::int[], $2::int[], $3::text[])
       ON CONFLICT (a_id, b_id) DO NOTHING`,
      [chunk.map((r) => r[0]), chunk.map((r) => r[1]), chunk.map((r) => r[2])],
    );
  }

  await db.query(`INSERT INTO data_imports (name, rows) VALUES ('drugs', $1)`, [count]);
  logger.info('drugs.import.done', { products: count, ingredients: ingredientIds.size, interactions: rows.length });
};

if (require.main === module) {
  importDrugs()
    .then(() => db.pool.end())
    .catch((err) => {
      logger.error('drugs.import.failed', { err: err.message });
      process.exit(1);
    });
}

module.exports = { importDrugs };
