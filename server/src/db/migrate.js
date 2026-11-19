const fs = require('node:fs');
const path = require('node:path');
const db = require('#lib/db');
const logger = require('#lib/logger');

const DIR = path.join(__dirname, 'migrations');

const migrate = async () => {
  await db.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, ran_at TIMESTAMPTZ NOT NULL DEFAULT now())',
  );
  const done = new Set((await db.many('SELECT name FROM schema_migrations')).map((r) => r.name));
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = fs.readFileSync(path.join(DIR, file), 'utf8');
    await db.transaction(async (tx) => {
      await tx.query(sql);
      await tx.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
    });
    logger.info('migration.applied', { file });
  }
};

if (require.main === module) {
  migrate()
    .then(() => db.pool.end())
    .catch((err) => {
      logger.error('migration.failed', { err: err.message });
      process.exit(1);
    });
}

module.exports = { migrate };
