import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Newspaper,
  RefreshCw,
} from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

import { getArticle } from "@/features/articles/api/articleApi";
import {
  FireworksEventPanel,
  type FireworksEventProgress,
} from "@/features/articles/components/FireworksEventPanel";
import { isFireworksArticle } from "@/features/articles/utils/articlePresentation";
import { Footer } from "@/shared/components/site/Footer";
import { Header } from "@/shared/components/site/Header";
import { PATH } from "@/shared/config/path";
import { scrollToTop } from "@/shared/utils/utils";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// Dữ liệu mẫu chỉ phục vụ duyệt UI. BE sẽ trở thành source of truth ở lượt sau.
const FIREWORKS_EVENT_PREVIEW: FireworksEventProgress = {
  current: 68_420,
  target: 100_000,
  participants: 1_284,
  nextMilestone: 75_000,
};

function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const articleQuery = useQuery({
    queryKey: ["article", id],
    queryFn: () => getArticle(id ?? ""),
    enabled: Boolean(id),
  });

  useEffect(() => {
    scrollToTop({});
  }, [id]);

  const article = articleQuery.data;
  const showFireworksEvent = article
    ? isFireworksArticle(article.category, article.title)
    : false;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      <Header />
      <main className="flex-1 px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            to={PATH.ARTICLES}
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-amber-700"
          >
            <ArrowLeft size={16} /> Về trang Bài viết
          </Link>

          {articleQuery.isLoading && (
            <div aria-label="Đang tải bài viết">
              <div className="mx-auto max-w-4xl">
                <div className="h-5 w-36 animate-pulse rounded bg-slate-100" />
                <div className="mt-5 h-12 w-5/6 animate-pulse rounded bg-slate-100" />
                <div className="mt-3 h-12 w-3/5 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="mt-8 aspect-[16/8] animate-pulse rounded-2xl bg-slate-200" />
              <div className="mx-auto mt-10 max-w-3xl space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-4 animate-pulse rounded bg-slate-100"
                  />
                ))}
              </div>
            </div>
          )}

          {articleQuery.isError && (
            <div className="flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center">
              <AlertCircle size={34} className="text-red-400" />
              <h1 className="mt-4 text-xl font-extrabold text-slate-800">
                Không thể tải bài viết
              </h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {articleQuery.error instanceof Error
                  ? articleQuery.error.message
                  : "Bài viết không tồn tại hoặc đã được gỡ."}
              </p>
              <button
                type="button"
                onClick={() => void articleQuery.refetch()}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 active:translate-y-px"
              >
                <RefreshCw size={15} /> Thử lại
              </button>
            </div>
          )}

          {article && (
            <article>
              <header className="mx-auto mb-8 max-w-4xl">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-700">
                    <Newspaper size={13} /> {article.category}
                  </span>
                  <time className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <CalendarDays size={14} />
                    {dateFormatter.format(new Date(article.createdAt))}
                  </time>
                </div>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                  {article.title}
                </h1>
              </header>

              {article.thumbnailUrl && (
                <div className="overflow-hidden rounded-2xl bg-slate-100 shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
                  <img
                    src={article.thumbnailUrl}
                    alt={article.title}
                    className="aspect-[16/8] w-full object-cover"
                  />
                </div>
              )}

              {showFireworksEvent && (
                <FireworksEventPanel progress={FIREWORKS_EVENT_PREVIEW} />
              )}

              <div
                className="prose prose-slate mx-auto mt-10 max-w-3xl text-base leading-8 text-slate-600 prose-headings:font-extrabold prose-headings:text-slate-900 prose-a:text-amber-700 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              <div className="mx-auto mt-12 max-w-3xl border-t border-slate-200 pt-6">
                <Link
                  to={PATH.ARTICLES}
                  className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 transition hover:text-amber-800"
                >
                  <ArrowLeft size={15} /> Xem tất cả bài viết
                </Link>
              </div>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ArticlePage;
