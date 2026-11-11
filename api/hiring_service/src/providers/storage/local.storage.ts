import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import type { StorageProvider } from './storage-provider.interface';
import type { StoredUpload, UploadInput } from './storage.types';

const sanitizeFileName = (name: string): string =>
  name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);

export class LocalStorageProvider implements StorageProvider {
  constructor(
    private readonly rootDir: string,
    private readonly publicBaseUrl: string
  ) {}

  async upload(input: UploadInput): Promise<StoredUpload> {
    const folderDir = path.join(this.rootDir, input.folder);
    await fs.mkdir(folderDir, { recursive: true });

    const safeName = sanitizeFileName(input.originalName || 'file');
    const storedName = `${randomUUID()}-${safeName}`;
    const absolutePath = path.join(folderDir, storedName);

    await fs.writeFile(absolutePath, input.buffer);

    const key = `${input.folder}/${storedName}`;
    const url = `${this.publicBaseUrl.replace(/\/$/, '')}/uploads/${key}`;

    return {
      key,
      url,
      fileName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
    };
  }
}
