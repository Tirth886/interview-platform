import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { UnauthorizedError } from './errors';

export function requireInternalToken(req: Request, _res: Response, next: NextFunction): void {
  const token = req.header('x-internal-token');
  if (!token || token !== env.INTERNAL_SERVICE_TOKEN) {
    next(new UnauthorizedError('Invalid internal service token'));
    return;
  }
  next();
}
