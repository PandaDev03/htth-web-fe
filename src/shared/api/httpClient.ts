import axios from "axios";

import { env } from "@/shared/config/env";

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("htth_access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
