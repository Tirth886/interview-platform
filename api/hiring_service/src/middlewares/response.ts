import { Response } from 'express';
import { ZodError } from 'zod';
import { DATABASE_ERROR_REGISTRY, DATABASE_ERROR_FALLBACK } from '../constants/database';
import { HTTP_STATUS } from '../constants/http';
import { AppError } from './errors';

export type ApiStatus = 'success' | 'error';

export interface ApiResponse<T = unknown> {
  status: ApiStatus;
  message: string;
  data: T | null;
}

type DatabaseErrorLike = Error & {
  code?: string;
  detail?: string;
  constraint?: string;
  table?: string;
};

export function sendSuccess<T>(
  res: Response,
  message: string,
  data: T,
  statusCode: number = HTTP_STATUS.OK
): void {
  res.status(statusCode).json({
    status: 'success',
    message,
    data,
  } satisfies ApiResponse<T>);
}

function isDatabaseError(error: unknown): error is DatabaseErrorLike {
  if (!(error instanceof Error)) return false;

  const candidate = error as DatabaseErrorLike;
  return (
    typeof candidate.code === 'string' ||
    typeof candidate.detail === 'string' ||
    typeof candidate.constraint === 'string' ||
    typeof candidate.table === 'string'
  );
}

/**
 * Resolve database error to HTTP status and message via dynamic registry.
 * Looks up exact error code first, then falls back to prefix-based handling.
 * Add new error codes to DATABASE_ERROR_REGISTRY without modifying this function.
 */
function resolveDatabaseResponse(error: DatabaseErrorLike): {
  statusCode: number;
  message: string;
} {
  if (!error.code) {
    return {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Database operation failed',
    };
  }

  // Check exact code match in registry
  const registryEntry = DATABASE_ERROR_REGISTRY[error.code as keyof typeof DATABASE_ERROR_REGISTRY];
  if (registryEntry) {
    return registryEntry;
  }

  // Fall back to prefix-based handling
  const prefix = error.code.substring(0, 2);
  const fallbackEntry = DATABASE_ERROR_FALLBACK[prefix as keyof typeof DATABASE_ERROR_FALLBACK];
  if (fallbackEntry) {
    return fallbackEntry;
  }

  // Ultimate fallback
  return {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'Database operation failed',
  };
}

function resolveErrorStatusCode(statusCode: number | undefined, error: unknown): number {
  if (statusCode !== undefined) return statusCode;
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof ZodError) return HTTP_STATUS.BAD_REQUEST;
  if (isDatabaseError(error)) return resolveDatabaseResponse(error).statusCode;
  return HTTP_STATUS.INTERNAL_SERVER_ERROR;
}

function resolveErrorMessage(message: string | undefined, error: unknown): string {
  if (message) return message;
  if (error instanceof ZodError) return error.errors[0]?.message ?? 'Validation failed';
  if (error instanceof AppError) return error.message;
  if (isDatabaseError(error)) return resolveDatabaseResponse(error).message;
  return 'Internal server error';
}

export function sendError(
  res: Response,
  message?: string,
  statusCode?: number,
  error?: unknown
): void {
  const resolvedStatusCode = resolveErrorStatusCode(statusCode, error);
  const resolvedMessage = resolveErrorMessage(message, error);

  res.status(resolvedStatusCode).json({
    status: 'error',
    message: resolvedMessage,
    data: null,
  } satisfies ApiResponse<null>);
}
