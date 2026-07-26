import { Lock, Newspaper, Plus } from "lucide-react";

const AdminNoticeBoard = () => {
  const notices: string[] = [];

  return (
    <section className="bg-gray-50 py-16">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Newspaper size={18} className="text-amber-500" />
              <span className="text-xs font-600 uppercase tracking-widest text-amber-600">
                Tin Tức
              </span>
            </div>
            <h2 className="text-2xl font-700 text-gray-800">
              Thông Báo & Cập Nhật
            </h2>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500">
            <Lock size={12} />
            Chỉ Admin đăng bài
          </div>
        </div>
        <div className="mb-8 h-0.5 w-full bg-gradient-to-r from-amber-300 via-amber-200 to-transparent" />
        {notices?.length ? (
          <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {notices?.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" />
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                </div>
                <div className="mb-2 h-5 w-full animate-pulse rounded bg-gray-100" />
                <div className="mb-4 h-5 w-3/4 animate-pulse rounded bg-gray-100" />
                <div className="mb-2 h-3 w-full animate-pulse rounded bg-gray-100" />
                <div className="mb-2 h-3 w-5/6 animate-pulse rounded bg-gray-100" />
                <div className="mb-4 h-3 w-4/6 animate-pulse rounded bg-gray-100" />
                <div className="flex justify-between">
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white px-8 py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <Newspaper size={28} className="text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-600 text-gray-700">
              Chưa có bài đăng nào
            </h3>
            <p className="mb-5 max-w-sm text-center text-sm text-gray-400">
              Khu vực này dành cho thông báo và tin tức từ đội ngũ quản trị
              Hải tặc vui vẻ. H?y theo d?i ?? nh?n th?ng tin m?i nh?t.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Plus size={14} />
              Bài đăng sẽ xuất hiện tại đây khi Admin đăng
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminNoticeBoard;
