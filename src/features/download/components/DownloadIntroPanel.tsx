import { env } from "@/shared/config/env";
import { Clock, Download, Shield, Zap } from "lucide-react";

const DownloadIntroPanel = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50 py-20">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#d97706 1px, transparent 1px), linear-gradient(90deg, #d97706 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(ellipse, rgba(251,191,36,0.3) 0%, transparent 70%)",
          }}
        />
      </div>
      <div className="relative z-10 mx-auto max-w-screen-2xl px-4 text-center sm:px-6 lg:px-8 xl:px-10">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-sm font-600 text-amber-700">
          <Download size={14} />
          Phiên bản mới nhất - {env?.downloads?.windows?.version}
        </div>
        <h1 className="text-hero-md mb-4 text-gray-800 capitalize">
          Tải <span className="text-amber-600">Hải tặc vui vẻ</span>
        </h1>
        <div className="mx-auto mb-5 h-0.5 w-24 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />
        <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-gray-500">
          Chọn nền tảng phù hợp và bắt đầu hành trình hải tặc ngay hôm nay
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {[
            { icon: <Shield size={15} />, label: "Không virus - đã quét" },
            {
              icon: <Zap size={15} />,
              label: `Cập nhật ${env?.downloads?.windows?.updatedAt}`,
            },
            { icon: <Clock size={15} />, label: "Tải trong vài giây" },
          ].map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 text-sm text-gray-500"
            >
              <span className="text-teal-600">{badge.icon}</span>
              {badge.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DownloadIntroPanel;
