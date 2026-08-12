import { createHttpClient } from "@shared/http-client";

export const interviewHttpClient = createHttpClient({
  baseURL: import.meta.env.VITE_INTERVIEW_API_BASE_URL ?? "http://localhost:5000"
});
