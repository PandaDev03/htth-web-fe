import { ZaloLogoArc } from "@/assets/images";
import { env } from "@/shared/config/env";
import { Image } from "antd";
import { Bell, Send, Shield, Trophy } from "lucide-react";

const ZaloCommunityBanner = () => {
  const communities = [
    {
      title: "Cộng Đồng Zalo Hải Tặc Vui Vẻ",
      badge: "Cộng đồng chung",
      description:
        "Nhận thông báo cập nhật game, trao đổi kinh nghiệm và nhận hỗ trợ từ đội ngũ quản trị.",
      href: env.community.zaloGroupLink,
      pills: [
        { icon: <Bell size={12} />, label: "Thông báo sự kiện" },
        { icon: <Shield size={12} />, label: "Hỗ trợ 24/7" },
      ],
      tone: "blue",
    },
    {
      title: "Cộng Đồng Zalo Tân Binh",
      badge: "Server Tân binh",
      description:
        "Kết nối người chơi mới, cập nhật lịch đua Top và nhận hỗ trợ trong mùa Tân binh.",
      href: env.community.zaloTanBinhGroupLink,
      pills: [
        { icon: <Trophy size={12} />, label: "Đua Top Tân binh" },
        { icon: <Shield size={12} />, label: "Hỗ trợ tân thủ" },
      ],
      tone: "amber",
    },
  ];

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid gap-4 lg:grid-cols-2">
          {communities.map((community) => {
            const isTanBinh = community.tone === "amber";

            return (
              <article
                key={community.title}
                className={`relative overflow-hidden rounded-2xl border ${
                  isTanBinh
                    ? "border-amber-200 bg-gradient-to-br from-amber-50 to-blue-50"
                    : "border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50"
                }`}
              >
                <div className="flex h-full flex-col gap-7 px-6 py-8 sm:px-8">
                  <div className="flex flex-1 flex-col items-center gap-5 sm:flex-row sm:items-start">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500">
                      <Image
                        src={ZaloLogoArc}
                        alt="Logo Zalo"
                        preview={false}
                      />
                    </div>
                    <div className="text-center sm:text-left">
                      <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <h3 className="text-xl font-700 text-gray-800">
                          {community.title}
                        </h3>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-600 ${
                            isTanBinh
                              ? "border-amber-200 bg-amber-100 text-amber-700"
                              : "border-blue-200 bg-white text-blue-700"
                          }`}
                        >
                          {community.badge}
                        </span>
                      </div>
                      <p className="max-w-lg text-sm leading-relaxed text-gray-500">
                        {community.description}
                      </p>
                      <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                        {community.pills.map((pill) => (
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
                  <div className="flex justify-center sm:justify-end">
                    {community.href ? (
                      <a
                        target="_blank"
                        href={community.href}
                        rel="noopener noreferrer"
                        aria-label={`Tham gia ${community.title}`}
                        className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-blue-500 px-6 py-3 text-sm font-700 text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-600 hover:text-white active:translate-y-px"
                      >
                        <Send size={17} />
                        Tham Gia Ngay
                      </a>
                    ) : (
                      <span className="inline-flex cursor-not-allowed items-center gap-2 whitespace-nowrap rounded-xl bg-gray-200 px-6 py-3 text-sm font-700 text-gray-500">
                        <Send size={17} />
                        Đang Cập Nhật
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ZaloCommunityBanner;
