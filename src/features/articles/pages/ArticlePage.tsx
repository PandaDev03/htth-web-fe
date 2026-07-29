import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Skeleton } from "antd";
import { ArrowLeft, CalendarDays, Newspaper } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { getArticle } from "@/features/articles/api/articleApi";
import { Footer } from "@/shared/components/site/Footer";
import { Header } from "@/shared/components/site/Header";
import { PATH } from "@/shared/config/path";
import { scrollToTop } from "@/shared/utils/utils";
import { useEffect } from "react";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

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

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1 px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            to={PATH.HOME}
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-amber-600"
          >
            <ArrowLeft size={16} /> Về trang chủ
          </Link>
          {articleQuery.isLoading && (
            <>
              <Skeleton active className="mb-6" />
              <Skeleton.Image active className="!h-72 !w-full" />
              <Skeleton active className="mt-8" />
            </>
          )}
          {articleQuery.isError && (
            <Alert
              type="error"
              showIcon
              message="Không thể tải bài viết"
              description={
                articleQuery.error instanceof Error
                  ? articleQuery.error.message
                  : "Bài viết không tồn tại hoặc đã được gỡ."
              }
              action={
                <Button onClick={() => void articleQuery.refetch()}>
                  Thử lại
                </Button>
              }
            />
          )}
          {articleQuery.data && (
            <article>
              <header className="mb-8">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-700">
                    <Newspaper size={13} /> {articleQuery.data.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <CalendarDays size={14} />{" "}
                    {dateFormatter.format(
                      new Date(articleQuery.data.createdAt),
                    )}
                  </span>
                </div>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                  {articleQuery.data.title}
                </h1>
              </header>
              <div className="overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
                <img
                  src={articleQuery.data.thumbnailUrl}
                  alt={articleQuery.data.title}
                  className="aspect-[16/8] w-full object-cover"
                />
              </div>
              <div className="prose prose-slate mt-10 max-w-none whitespace-pre-wrap text-base leading-8 text-slate-600">
                {articleQuery.data.content}
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
