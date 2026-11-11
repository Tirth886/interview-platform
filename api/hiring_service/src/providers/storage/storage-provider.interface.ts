import type { StoredUpload, UploadInput } from './storage.types';

/**
 * Swap LocalStorageProvider for S3StorageProvider later without changing callers.
 */
export interface StorageProvider {
  upload(input: UploadInput): Promise<StoredUpload>;
}
