import { NextFunction, Request, Response } from 'express';
import { logger } from './logger';

/**
 * Request logging middleware
 * Logs incoming requests with method and URL
 */
export function requestLoggingMiddleware(req: Request, _res: Response, next: NextFunction): void {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
}
