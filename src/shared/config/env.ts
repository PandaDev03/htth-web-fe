const readEnv = (value: string | undefined, fallback = "") => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
};

export const env = {
  apiBaseUrl: readEnv(import.meta.env.VITE_API_BASE_URL, "http://localhost:3000/api/v1"),
  downloads: {
    testflight: {
      version: readEnv(import.meta.env.VITE_DOWNLOAD_TESTFLIGHT_VERSION, "v1.4.2"),
      updatedAt: readEnv(import.meta.env.VITE_DOWNLOAD_TESTFLIGHT_UPDATED_AT, "25/07/2026"),
      url: readEnv(import.meta.env.VITE_DOWNLOAD_TESTFLIGHT_URL),
    },
    apk: {
      version: readEnv(import.meta.env.VITE_DOWNLOAD_APK_VERSION, "v1.4.2"),
      updatedAt: readEnv(import.meta.env.VITE_DOWNLOAD_APK_UPDATED_AT, "25/07/2026"),
      url: readEnv(import.meta.env.VITE_DOWNLOAD_APK_URL),
    },
    windows: {
      version: readEnv(import.meta.env.VITE_DOWNLOAD_WINDOWS_VERSION, "v1.4.2"),
      updatedAt: readEnv(import.meta.env.VITE_DOWNLOAD_WINDOWS_UPDATED_AT, "25/07/2026"),
      url: readEnv(import.meta.env.VITE_DOWNLOAD_WINDOWS_URL),
    },
    jar: {
      version: readEnv(import.meta.env.VITE_DOWNLOAD_JAR_VERSION, "v1.4.2"),
      updatedAt: readEnv(import.meta.env.VITE_DOWNLOAD_JAR_UPDATED_AT, "25/07/2026"),
      url: readEnv(import.meta.env.VITE_DOWNLOAD_JAR_URL),
    },
  },
} as const;
