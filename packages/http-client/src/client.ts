import axios, { type AxiosInstance } from "axios";

export type HttpClientOptions = {
  baseURL: string;
  timeoutMs?: number;
};

export const createHttpClient = (options: HttpClientOptions): AxiosInstance => {
  return axios.create({
    baseURL: options.baseURL,
    timeout: options.timeoutMs ?? 15000,
    headers: {
      "Content-Type": "application/json"
    }
  });
};
