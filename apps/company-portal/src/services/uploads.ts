import { companyHttpClient } from "./http";

type ApiEnvelope<T> = {
  status: "success" | "error";
  message: string;
  data: T;
};

export type JobDescriptionUploadResult = {
  key: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
};

const UPLOADS_BASE_PATH = "/api/v1/uploads";

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];
const MAX_BYTES = 10 * 1024 * 1024;

export const validateJobDescriptionFile = (file: File | null): string | null => {
  if (!file) {
    return "Job description file is required.";
  }
  if (file.size <= 0) {
    return "Job description file is empty.";
  }
  if (file.size > MAX_BYTES) {
    return "Job description must be 10 MB or smaller.";
  }
  const lower = file.name.toLowerCase();
  const ok = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  if (!ok) {
    return "Only PDF, DOC, DOCX, or TXT files are allowed.";
  }
  return null;
};

export const uploadJobDescription = async (
  file: File,
  token: string
): Promise<JobDescriptionUploadResult> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await companyHttpClient.post<ApiEnvelope<JobDescriptionUploadResult>>(
      `${UPLOADS_BASE_PATH}/job-description`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // Let the browser set multipart boundary (default JSON content-type breaks FormData)
          "Content-Type": undefined as unknown as string,
        },
      }
    );

    return response.data.data;
  } catch (error: unknown) {
    const httpError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
      message?: string;
    };

    throw new Error(
      httpError.response?.data?.message ??
        httpError.message ??
        "Failed to upload job description."
    );
  }
};

export type ResumeUploadItem = JobDescriptionUploadResult;

export const uploadResumes = async (
  files: File[],
  token: string
): Promise<ResumeUploadItem[]> => {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  try {
    const response = await companyHttpClient.post<ApiEnvelope<{ items: ResumeUploadItem[] }>>(
      `${UPLOADS_BASE_PATH}/resumes`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": undefined as unknown as string,
        },
      }
    );

    return response.data.data.items;
  } catch (error: unknown) {
    const httpError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
      message?: string;
    };

    throw new Error(
      httpError.response?.data?.message ?? httpError.message ?? "Failed to upload resumes."
    );
  }
};
