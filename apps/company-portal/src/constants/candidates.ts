/**
 * Resume batch upload limits — adjust here (or mirror server env).
 * Server source of truth: RESUME_UPLOAD_* in hiring_service env.
 */
export const resumeUploadConfig = {
  maxFiles: Number(import.meta.env.VITE_RESUME_UPLOAD_MAX_FILES ?? 20),
  maxFileSizeMb: Number(import.meta.env.VITE_RESUME_UPLOAD_MAX_FILE_SIZE_MB ?? 10),
  allowedExtensions: String(import.meta.env.VITE_RESUME_UPLOAD_ALLOWED_EXTENSIONS ?? "pdf,doc,docx")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .map((ext) => (ext.startsWith(".") ? ext : `.${ext}`)),
} as const;

export const resumeAcceptAttribute = resumeUploadConfig.allowedExtensions.join(",");

export const resumeUploadConfigLabel = `${resumeUploadConfig.allowedExtensions
  .map((ext) => ext.replace(".", "").toUpperCase())
  .join(", ")} · max ${resumeUploadConfig.maxFiles} files · ${resumeUploadConfig.maxFileSizeMb} MB each`;
