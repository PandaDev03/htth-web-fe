import { ZaloLogoArc } from "@/assets/images";
import { Image } from "antd";
import { Bell, Send, Shield } from "lucide-react";

const ZaloCommunityBanner = () => {
  const pills = [
    { icon: <Bell size={12} />, label: "Thông báo sự kiện" },
    { icon: <Shield size={12} />, label: "Hỗ trợ 24/7" },
  ];

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="relative z-10 flex flex-col items-center gap-8 px-6 py-10 sm:px-10 lg:flex-row">
            <div className="flex flex-1 flex-col items-center gap-5 sm:flex-row sm:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500">
                <Image src={ZaloLogoArc} alt="Zalo Logo" preview={false} />
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-xl font-700 text-gray-800">
                    Tham Gia Cộng Đồng Zalo
                  </h3>
                  <span className="rounded-full border border-teal-200 bg-teal-100 px-2 py-0.5 text-xs font-600 text-teal-700">
                    Mới
                  </span>
                </div>
                <p className="max-w-lg text-sm leading-relaxed text-gray-500">
                  Nhận thông báo cập nhật game sớm nhất, trao đổi kinh nghiệm,
                  tham gia sự kiện độc quyền và nhận hỗ trợ từ đội ngũ quản trị.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {pills.map((pill) => (
                    <span
                      key={pill.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-500 text-gray-600"
                    >
                      {pill.icon}
                      {pill.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-3">
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://zalo.me/g/cclw6mvkgskdtmkfj9ik"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-7 py-3.5 text-base font-700 text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-600 hover:text-white"
              >
                <Send size={18} />
                Tham Gia Ngay
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ZaloCommunityBanner;
