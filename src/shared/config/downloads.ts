import { env } from "@/shared/config/env";

export type DownloadPlatformId = "testflight" | "apk" | "windows" | "jar";

export type DownloadPlatformConfig = {
  id: DownloadPlatformId;
  label: string;
  type: string;
  version: string;
  date: string;
  url: string;
  available: boolean;
  description: string;
};

function getGoogleDriveFileId(url: string) {
  const patterns = [
    /drive\.google\.com\/file\/d\/([^/]+)/i,
    /[?&]id=([^&]+)/i,
    /drive\.google\.com\/open\?id=([^&]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function normalizeDownloadUrl(url: string) {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return "";
  }

  if (!/docs\.google\.com|drive\.google\.com/i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  if (
    /^https?:\/\/drive\.google\.com\/uc\?export=download&id=/i.test(trimmedUrl)
  ) {
    return trimmedUrl;
  }

  const fileId = getGoogleDriveFileId(trimmedUrl);
  return fileId
    ? "https://drive.google.com/uc?export=download&id=" +
        encodeURIComponent(fileId)
    : trimmedUrl;
}

const downloadDescriptions: Record<DownloadPlatformId, string> = {
  testflight: "Dành cho iPhone và iPad, phù hợp để trải nghiệm bản iOS.",
  apk: "Dành cho điện thoại và máy tính bảng Android.",
  windows: "Gói cài đặt đầy đủ cho Windows 10/11, 64-bit.",
  jar: "Chạy trên PC bằng file Java/JAR, phù hợp máy hỗ trợ Java.",
};

const platformLabels: Record<DownloadPlatformId, string> = {
  testflight: "Testflight",
  apk: "APK",
  windows: "Windows",
  jar: "Jar",
};

export const downloadPlatforms: DownloadPlatformConfig[] = (
  ["testflight", "apk", "windows", "jar"] satisfies DownloadPlatformId[]
).map((id) => {
  const configured = env.downloads[id];
  const url = normalizeDownloadUrl(configured.url);

  return {
    id,
    label: platformLabels[id],
    type: platformLabels[id],
    version: configured.version,
    date: configured.updatedAt,
    url,
    available: Boolean(url),
    description: downloadDescriptions[id],
  };
});
