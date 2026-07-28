import { scrollToTop } from "@/shared/utils/utils";
import {
  Apple,
  CheckCircle2,
  Clock,
  Download,
  FileArchive,
  Loader2,
  Monitor,
  Smartphone,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  downloadPlatforms,
  type DownloadPlatformConfig,
  type DownloadPlatformId,
} from "@/shared/config/downloads";

interface DownloadPlatform extends DownloadPlatformConfig {
  icon: ReactNode;
}

const platformIcons: Record<DownloadPlatformId, ReactNode> = {
  testflight: <Apple size={28} />,
  apk: <Smartphone size={28} />,
  windows: <Monitor size={28} />,
  jar: <FileArchive size={28} />,
};

const DOWNLOAD_PLATFORMS: DownloadPlatform[] = downloadPlatforms.map(
  (platform) => ({
    ...platform,
    icon: platformIcons[platform.id],
  }),
);

const PlatformDownloadGrid = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    scrollToTop({});
  }, []);

  function download(platform: DownloadPlatform) {
    if (!platform.available) {
      toast.info(
        "Phiên bản này đang chờ cập nhật. Hiện tại bạn vui lòng tải bản phù hợp trong danh sách nhé.",
      );
      return;
    }

    setDownloading(platform.id);
    toast.success("Đang mở link tải " + platform.type + " " + platform.version);
    window.setTimeout(() => setDownloading(null), 1200);
  }

  return (
    <section className="bg-gray-50 py-16">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {DOWNLOAD_PLATFORMS.map((platform) => (
            <article
              key={platform.id}
              className={
                "rounded-xl border bg-white shadow-sm transition-all " +
                (platform.available
                  ? "border-gray-100 hover:border-amber-200 hover:shadow-md"
                  : "border-gray-100 opacity-80")
              }
            >
              <div className="flex h-full flex-col gap-5 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    {platform.icon}
                  </div>
                  <span
                    className={
                      "rounded-full border px-2.5 py-0.5 text-xs font-600 " +
                      (platform.available
                        ? "border-teal-200 bg-teal-50 text-teal-700"
                        : "border-amber-200 bg-amber-50 text-amber-600")
                    }
                  >
                    {platform.available ? "Sẵn sàng" : "Đợi cập nhật"}
                  </span>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="text-lg font-700 text-gray-800">
                      {platform.label}
                    </h3>
                    <span className="rounded bg-gray-50 px-2 py-0.5 font-mono text-xs font-600 text-gray-500">
                      {platform.type}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-500">
                    {platform.description}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {[
                    ["Phiên bản", platform.version],
                    ["Cập nhật", platform.date],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-xs text-gray-400">{label}</span>
                      <span className="font-mono text-xs font-600 text-gray-700">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-auto">
                  {platform.url ? (
                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => download(platform)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white transition-all hover:bg-amber-600 hover:text-white"
                    >
                      {downloading === platform.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <Download size={16} />
                          Tải {platform.type}
                        </>
                      )}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => download(platform)}
                      className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 py-2.5 text-sm text-gray-400"
                    >
                      <Clock size={15} />
                      Đợi cập nhật
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <CheckCircle2 size={13} className="text-teal-500" />
          Tất cả file đã được kiểm tra tính toàn vẹn MD5 - an toàn để tải
        </div>
      </div>
    </section>
  );
};

export default PlatformDownloadGrid;
