import { NextFunction, Request, Response } from 'express';
import { getAuthContextFromBearerToken } from '../utils/auth';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    req.auth = getAuthContextFromBearerToken(req.header('authorization'));
    next();
  } catch (error) {
    next(error);
  }
}
