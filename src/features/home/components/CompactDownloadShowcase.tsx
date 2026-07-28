import {
  Apple,
  Download,
  FileArchive,
  Monitor,
  Smartphone,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import {
  downloadPlatforms,
  type DownloadPlatformId,
} from "@/shared/config/downloads";
import { PATH } from "@/shared/config/path";

const platformIcons: Record<DownloadPlatformId, ReactNode> = {
  testflight: <Apple size={22} />,
  apk: <Smartphone size={22} />,
  windows: <Monitor size={22} />,
  jar: <FileArchive size={22} />,
};

const CompactDownloadShowcase = () => {
  return (
    <section className="bg-white py-16 pb-24">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="mb-10 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Download size={18} className="text-amber-500" />
            <span className="text-xs font-600 uppercase tracking-widest text-amber-600">
              Tải Ngay
            </span>
          </div>
          <h2 className="mb-3 text-2xl font-700 text-gray-800">
            Chọn Nền Tảng Của Bạn
          </h2>
          <p className="text-sm text-gray-500">
            Phiên bản mới nhất được đồng bộ từ cấu hình tải game
          </p>
        </div>
        <div className="mx-auto mb-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {downloadPlatforms.map((platform) => {
            const content = (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  {platformIcons[platform.id]}
                </div>
                <div>
                  <p className="text-sm font-600 text-gray-800">
                    {platform.label}
                  </p>
                  <p className="font-mono text-xs text-gray-400">
                    {platform.version}
                  </p>
                </div>
                <span
                  className={
                    "rounded-full border px-2.5 py-0.5 text-xs font-600 " +
                    (platform.available
                      ? "border-teal-200 bg-teal-50 text-teal-700"
                      : "border-amber-200 bg-amber-50 text-amber-600")
                  }
                >
                  {platform.available ? "Sẵn sàng" : "Chờ cập nhật"}
                </span>
              </>
            );
            const className =
              "flex flex-col items-center gap-3 rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm transition-all hover:border-amber-200 hover:shadow-md";

            return platform.url ? (
              <a
                key={platform.id}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {content}
              </a>
            ) : (
              <div
                key={platform.id}
                className={className + " cursor-not-allowed opacity-80"}
              >
                {content}
              </div>
            );
          })}
        </div>
        <div className="text-center">
          <Link
            to={PATH.DOWNLOAD}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-10 py-3.5 text-base font-bold text-white shadow-lg shadow-amber-200 transition-all hover:-translate-y-0.5 hover:bg-amber-600"
          >
            <Download size={18} />
            Xem Tất Cả Phiên Bản
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CompactDownloadShowcase;
