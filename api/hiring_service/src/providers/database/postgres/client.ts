import { Pool } from 'pg';
import { env } from '../../../config/env';
import { logger } from '../../../middlewares/logger';

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

db.on('error', (err) => {
  logger.error({ err }, 'PostgreSQL pool error');
});
