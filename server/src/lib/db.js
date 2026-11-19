const { Pool, types } = require('pg');
const env = require('#config/env');

types.setTypeParser(1082, (value) => value);
types.setTypeParser(1700, (value) => (value == null ? null : Number(value)));

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

const query = (text, params) => pool.query(text, params);

const one = async (text, params) => (await pool.query(text, params)).rows[0] ?? null;

const many = async (text, params) => (await pool.query(text, params)).rows;

const transaction = async (work) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work({
      query: (text, params) => client.query(text, params),
      one: async (text, params) => (await client.query(text, params)).rows[0] ?? null,
      many: async (text, params) => (await client.query(text, params)).rows,
    });
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, one, many, transaction };
