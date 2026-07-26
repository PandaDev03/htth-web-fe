import { GitCommit, Star, Wrench } from "lucide-react";

const ReleaseHistory = () => {
  const releases = [
    {
      version: "v1.4.2",
      date: "22/07/2026",
      badge: "Mới nhất",
      entries: [
        "Thêm bản đồ đảo Quỷ Mặt Nạ với 3 dungeon mới",
        "Hệ thống Guild Wars mùa 3 · đăng ký từ 25/07",
        "Sửa lỗi đóng băng khi vào vùng biển bão",
        "Tối ưu hiệu năng trên thiết bị RAM 2GB",
      ],
    },
    {
      version: "v1.4.1",
      date: "08/07/2026",
      badge: "Trước đó",
      entries: [
        "Vá lỗ hổng bảo mật tài khoản",
        "Sửa lỗi mất vật phẩm khi thoát đột ngột",
        "Thêm skin thuyền Rồng Đỏ giới hạn",
      ],
    },
    {
      version: "v1.4.0",
      date: "15/06/2026",
      badge: "Major",
      entries: [
        "Hệ thống Hôn Nhân & Đồng Hành ra mắt",
        "Nâng cấp đồ họa 2D · sprite độ phân giải 2x",
        "Giảm 40% dung lượng tải game",
      ],
    },
  ];

  return (
    <section className="border-t border-gray-100 bg-white py-16">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="mb-8 flex items-center gap-3">
          <GitCommit size={18} className="text-amber-500" />
          <div>
            <span className="mb-0.5 block text-xs font-600 uppercase tracking-widest text-amber-600">
              Lịch Sử
            </span>
            <h2 className="text-xl font-700 text-gray-800">Nhật Ký Cập Nhật</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {releases.map((release) => (
            <article
              key={release.version}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <span className="font-mono text-lg font-700 text-gray-800">
                    {release.version}
                  </span>
                  <p className="mt-0.5 text-xs text-gray-400">{release.date}</p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-600 ${release.badge === "M�>i nhất" ? "border-teal-200 bg-teal-50 text-teal-700" : release.badge === "Major" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-gray-200 bg-gray-100 text-gray-600"}`}
                >
                  {release.badge}
                </span>
              </div>
              <div className="mb-4 h-px bg-gradient-to-r from-amber-200 to-transparent" />
              <ul className="flex flex-col gap-2.5">
                {release.entries.map((entry, index) => (
                  <li key={entry} className="flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 shrink-0 ${index % 2 ? "text-amber-500" : "text-teal-600"}`}
                    >
                      {index % 2 ? <Wrench size={13} /> : <Star size={13} />}
                    </span>
                    <span className="text-sm leading-relaxed text-gray-500">
                      {entry}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReleaseHistory;
