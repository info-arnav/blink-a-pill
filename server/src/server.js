const env = require('#config/env');
const app = require('./app');
const db = require('#lib/db');
const redis = require('#lib/redis');
const logger = require('#lib/logger');
const { migrate } = require('#db/migrate');
const { importDrugs } = require('#db/import-drugs');

const startServer = async () => {
  await db.query('SELECT 1');
  await migrate();
  await importDrugs();
  const server = app.listen(env.PORT, () => logger.info('server.listening', { port: env.PORT }));
  const shutdown = (signal) => {
    logger.info('server.shutdown', { signal });
    server.close(async () => {
      await db.pool.end();
      redis.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer().catch((err) => {
  logger.error('server.start.failed', { err: err.message });
  process.exit(1);
});
