import { createHttpClient } from "@shared/http-client";

export const companyHttpClient = createHttpClient({
  baseURL: import.meta.env.VITE_COMPANY_API_BASE_URL ?? "http://localhost:4000"
});
