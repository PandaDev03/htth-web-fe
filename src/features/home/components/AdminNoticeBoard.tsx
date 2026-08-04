import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  Newspaper,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getArticles } from "@/features/articles/api/articleApi";
import { getArticlePath, PATH } from "@/shared/config/path";

function stripHtml(value: string) {
  const element = document.createElement("div");
  element.innerHTML = value;
  return element.textContent || element.innerText || "";
}
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const AdminNoticeBoard = () => {
  const articlesQuery = useQuery({
    queryKey: ["articles", "home"],
    queryFn: () => getArticles(6),
    staleTime: 60_000,
  });

  return (
    <section
      className="bg-slate-50 py-16 sm:py-20"
      aria-labelledby="latest-articles-heading"
    >
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
              <Newspaper size={16} /> Tin tức từ Grand Line
            </div>
            <h2
              id="latest-articles-heading"
              className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl"
            >
              Thông báo & cập nhật
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Sự kiện, lịch bảo trì và những thay đổi mới nhất từ đội ngũ Hải
              tặc vui vẻ.
            </p>
          </div>
          <Link
            to={PATH.ARTICLES}
            className="group inline-flex items-center gap-2 self-start rounded-lg border border-amber-200 bg-white px-4 py-2.5 text-xs font-bold text-amber-700 transition hover:border-amber-300 hover:bg-amber-50 active:translate-y-px sm:self-auto"
          >
            Xem tất cả bài viết
            <ArrowRight
              size={14}
              className="transition group-hover:translate-x-0.5"
            />
          </Link>
        </div>
        <div className="mb-8 h-px w-full bg-gradient-to-r from-amber-400 via-amber-200 to-transparent" />

        {articlesQuery.isLoading && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="aspect-[16/9] animate-pulse bg-slate-200" />
                <div className="p-5">
                  <div className="mb-4 h-4 w-24 animate-pulse rounded bg-slate-100" />
                  <div className="mb-3 h-6 w-4/5 animate-pulse rounded bg-slate-100" />
                  <div className="mb-2 h-3 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {articlesQuery.isError && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-12 text-center">
            <Newspaper size={28} className="mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              Chưa thể tải tin tức lúc này.
            </p>
            <button
              type="button"
              onClick={() => void articlesQuery.refetch()}
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-amber-700"
            >
              <RefreshCw size={13} /> Thử lại
            </button>
          </div>
        )}

        {articlesQuery.data?.length ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {articlesQuery.data.map((article) => (
              <Link
                key={article.id}
                to={getArticlePath(article.id)}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_16px_36px_rgba(146,64,14,0.10)]"
              >
                <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                  <img
                    src={article.thumbnailUrl}
                    alt={article.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
                  />
                </div>
                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                      {article.category}
                    </span>
                    <time className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                      <CalendarDays size={12} />{" "}
                      {dateFormatter.format(new Date(article.createdAt))}
                    </time>
                  </div>
                  <h3 className="text-lg font-extrabold leading-7 text-slate-900 transition group-hover:text-amber-700">
                    {article.title}
                  </h3>
                  <p
                    className="mt-2 overflow-hidden text-sm leading-6 text-slate-500"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {stripHtml(article.content)}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700">
                    Đọc bài viết{" "}
                    <ArrowUpRight
                      size={14}
                      className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {articlesQuery.data && !articlesQuery.data.length && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Newspaper size={25} className="text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-700">
              Chưa có bài viết nào
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
              Các thông báo và cập nhật mới từ Admin sẽ xuất hiện tại đây.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminNoticeBoard;
