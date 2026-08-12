import { HTTP_STATUS } from './http';

/**
 * PostgreSQL error code to HTTP status and message mapping.
 * Data-driven registry: add new codes here without modifying handler functions.
 */
export const DATABASE_ERROR_REGISTRY = {
  // Integrity constraints (23xxx)
  '23505': {
    statusCode: HTTP_STATUS.CONFLICT,
    message: 'Duplicate resource',
  },
  '23503': {
    statusCode: HTTP_STATUS.CONFLICT,
    message: 'Invalid reference: related resource does not exist',
  },
  '23502': {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    message: 'Missing required database field',
  },
  '23514': {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    message: 'Value violates a database rule',
  },
  // Data type errors (22xxx)
  '22P02': {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    message: 'Invalid input format',
  },
  '22001': {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    message: 'Value is too long for the target field',
  },
  // Schema errors (42xxx)
  '42703': {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    message: 'Invalid database column',
  },
} as const;

/**
 * Error code prefix to default handling when exact code not found.
 * Used as fallback when error code is not in DATABASE_ERROR_REGISTRY.
 */
export const DATABASE_ERROR_CODE_PREFIX = {
  INTEGRITY_CONSTRAINT: '23',
  DATA_TYPE: '22',
  SCHEMA: '42',
} as const;

/**
 * Fallback messages by error code prefix.
 * Used when specific error code is not registered.
 */
export const DATABASE_ERROR_FALLBACK = {
  '23': {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    message: 'Database constraint violation',
  },
  '22': {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    message: 'Invalid data provided',
  },
  '42': {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'Database schema error',
  },
} as const;
