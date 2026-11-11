import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './config/env';
import { HTTP_STATUS } from './constants/http';
import { logger } from './middlewares/logger';
import { requestLoggingMiddleware } from './middlewares/request-logger';
import { sendError } from './middlewares/response';
import { getUploadRootDir } from './providers/storage';
import routes from './routes';

const app = express();

// Security & parsing middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Local uploaded files (replace with S3 URLs when STORAGE_DRIVER=s3)
app.use('/uploads', express.static(getUploadRootDir()));

// Request logging
app.use(requestLoggingMiddleware);

// Swagger / OpenAPI
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hiring Service API',
      version: '1.0.0',
      description: 'REST API for the hiring platform',
    },
    servers: [{ url: `http://localhost:${env.PORT}` }],
  },
  apis: ['./src/modules/**/*.controller.ts'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).json({ status: 'ok' });
});

// Routes
app.use('/api/v1', routes);

// 404 handler
app.use((_req: Request, res: Response) => {
  sendError(res, 'Route not found', HTTP_STATUS.NOT_FOUND);
});

// Global error handler
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  void next;
  logger.error({ err }, 'Unhandled error');
  sendError(res, undefined, undefined, err);
});

export default app;
