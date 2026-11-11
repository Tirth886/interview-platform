import { env } from './env';

/** Adjust via env — keeps resume upload rules configurable without code changes. */
export const resumeUploadLimits = {
  maxFiles: env.RESUME_UPLOAD_MAX_FILES,
  maxFileSizeBytes: env.RESUME_UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024,
  maxFileSizeMb: env.RESUME_UPLOAD_MAX_FILE_SIZE_MB,
  allowedExtensions: env.RESUME_UPLOAD_ALLOWED_EXTENSIONS.split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .map((ext) => (ext.startsWith('.') ? ext : `.${ext}`)),
  allowedMimeTypes: new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
};
