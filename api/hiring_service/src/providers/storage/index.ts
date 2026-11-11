import path from 'path';
import { env } from '../../config/env';
import { LocalStorageProvider } from './local.storage';
import type { StorageProvider } from './storage-provider.interface';

export type { StorageProvider } from './storage-provider.interface';
export type { StoredUpload, UploadInput } from './storage.types';

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);

/**
 * Local disk today. Replace with S3StorageProvider when AWS is ready
 * (same StorageProvider interface).
 */
export const storageProvider: StorageProvider = new LocalStorageProvider(
  uploadRoot,
  `http://localhost:${env.PORT}`
);

export const getUploadRootDir = (): string => uploadRoot;
