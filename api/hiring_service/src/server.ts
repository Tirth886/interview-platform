import { env } from './config/env';
import app from './app';
import { logger } from './middlewares/logger';

app.listen(env.PORT, () => {
  logger.info(`Hiring service running on port ${env.PORT} [${env.NODE_ENV}]`);
});
