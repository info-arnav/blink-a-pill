const db = require('#lib/db');

const search = (term, limit) =>
  db.many(
    `SELECT id, name, composition, manufacturer, form, discontinued, score FROM (
       SELECT DISTINCT ON (lower(p.name)) p.id, p.name, p.composition, p.manufacturer, p.form, p.discontinued,
              word_similarity($1, p.search_name)
                + CASE WHEN p.search_name = $1 THEN 1 ELSE 0 END
                + CASE WHEN p.search_name LIKE $1 || '%' THEN 0.3 ELSE 0 END
                - length(p.search_name) / 1000.0 AS score
       FROM products p
       WHERE $1 <% p.search_name OR p.search_name LIKE $1 || '%'
       ORDER BY lower(p.name), p.discontinued, p.id
     ) ranked
     ORDER BY discontinued, score DESC
     LIMIT $2`,
    [term, limit],
  );

const ingredientsFor = (productIds) =>
  db.many(
    `SELECT pi.product_id, i.name AS key, i.display, pi.strength_value AS value, pi.strength_unit AS unit, pi.strength_text
     FROM product_ingredients pi JOIN ingredients i ON i.id = pi.ingredient_id
     WHERE pi.product_id = ANY($1::int[])`,
    [productIds],
  );

const findProduct = (id) => db.one('SELECT id, name, composition, manufacturer, form, discontinued FROM products WHERE id = $1', [id]);

const findIngredientsByName = (keys) =>
  db.many('SELECT id, name AS key, display FROM ingredients WHERE name = ANY($1::text[])', [keys]);

const interactionsAmong = (keys) =>
  db.many(
    `SELECT a.name AS a, b.name AS b, x.severity
     FROM ingredient_interactions x
     JOIN ingredients a ON a.id = x.a_id
     JOIN ingredients b ON b.id = x.b_id
     WHERE a.name = ANY($1::text[]) AND b.name = ANY($1::text[])`,
    [keys],
  );

module.exports = { search, ingredientsFor, findProduct, findIngredientsByName, interactionsAmong };
