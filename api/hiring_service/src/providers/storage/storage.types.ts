export type StoredUpload = {
  key: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
};

export type UploadInput = {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  /** Logical folder, e.g. job-descriptions */
  folder: string;
};
