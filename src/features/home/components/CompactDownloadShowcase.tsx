import {
  Apple,
  Download,
  FileArchive,
  Monitor,
  Smartphone,
} from "lucide-react";
import { Link } from "react-router-dom";

const CompactDownloadShowcase = () => {
  const platforms = [
    { id: "testflight", icon: <Apple size={22} />, label: "TestFlight" },
    { id: "apk", icon: <Smartphone size={22} />, label: "APK" },
    { id: "windows", icon: <Monitor size={22} />, label: "Windows" },
    { id: "jar", icon: <FileArchive size={22} />, label: "JAR" },
  ];

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
            Phiên bản ổn định mới nhất - 25/07/2026
          </p>
        </div>
        <div className="mx-auto mb-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className="flex flex-col items-center gap-3 rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm transition-all hover:border-amber-200 hover:shadow-md cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                {platform.icon}
              </div>
              <div>
                <p className="text-sm font-600 text-gray-800">
                  {platform.label}
                </p>
                <p className="font-mono text-xs text-gray-400">v1.4.2</p>
              </div>
              <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-600 text-teal-700">
                Sẵn sàng
              </span>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link
            to="/download-screen"
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
