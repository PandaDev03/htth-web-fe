import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Newspaper, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { Article } from "@/features/articles/api/articleApi";
import { getArticlesPage } from "@/features/articles/api/articleApi";
import { ArticlePagination } from "@/features/articles/components/ArticlePagination";
import {
  articleDateFormatter,
  getArticleSummary,
} from "@/features/articles/utils/articlePresentation";
import { Footer } from "@/shared/components/site/Footer";
import { Header } from "@/shared/components/site/Header";
import { getArticlePath } from "@/shared/config/path";
import { scrollToTop } from "@/shared/utils/utils";

const ARTICLES_PER_PAGE = 10;

const categories = [
  "Tất cả",
  "Sự kiện",
  "Thông báo",
  "Cập nhật",
  "Bảo trì",
] as const;

type Category = (typeof categories)[number];

function ArticlesPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("Tất cả");
  const [page, setPage] = useState(1);
  const categoryParam = activeCategory === "Tất cả" ? undefined : activeCategory;
  const articlesQuery = useQuery({
    queryKey: ["articles", "public", page, categoryParam],
    queryFn: () =>
      getArticlesPage({
        page,
        limit: ARTICLES_PER_PAGE,
        category: categoryParam,
      }),
    staleTime: 60_000,
  });

  useEffect(() => {
    scrollToTop({});
  }, []);

  const articles = articlesQuery.data?.data ?? [];
  const meta = articlesQuery.data?.meta;
  const articleGridClass = useMemo(() => {
    if (articles.length === 1) return "lg:mx-auto lg:max-w-sm lg:grid-cols-1";
    if (articles.length === 2) return "lg:mx-auto lg:max-w-3xl lg:grid-cols-2";
    if (articles.length === 3) return "lg:mx-auto lg:max-w-5xl lg:grid-cols-3";
    return "lg:grid-cols-4";
  }, [articles.length]);

  const changeCategory = (category: Category) => {
    setActiveCategory(category);
    setPage(1);
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    scrollToTop({ behavior: "smooth" });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      <Header />
      <main className="flex-1 bg-slate-50 pb-20 pt-16">
        <section className="relative overflow-hidden border-b border-amber-100 bg-gradient-to-b from-amber-50 via-white to-slate-50 py-12 sm:py-16">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(180,83,9,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(180,83,9,0.045)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="relative mx-auto max-w-screen-2xl px-4 text-center sm:px-6 lg:px-8 xl:px-10">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-700 shadow-sm">
              <Newspaper size={15} /> Tin tức Hải Tặc Vui Vẻ
            </div>
            <h1 className="text-3xl font-extrabold uppercase leading-tight tracking-normal text-slate-900 sm:text-5xl lg:text-6xl">
              Các sự kiện đang diễn ra
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
              Cập nhật nhanh sự kiện, thông báo bảo trì và các mốc thưởng mới
              nhất từ đội ngũ quản trị.
            </p>

            <div className="mt-8 flex justify-center overflow-x-auto pb-2">
              <div
                className="inline-flex min-w-max gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
                aria-label="Lọc bài viết theo danh mục"
              >
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => changeCategory(category)}
                    className={
                      "rounded-lg px-4 py-2 text-xs font-bold transition active:translate-y-px " +
                      (activeCategory === category
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-slate-500 hover:bg-amber-50 hover:text-amber-700")
                    }
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-10">
          {articlesQuery.isLoading && <ArticlesLoading />}

          {articlesQuery.isError && (
            <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
              <Newspaper size={34} className="text-slate-300" />
              <h2 className="mt-4 text-lg font-extrabold text-slate-800">
                Chưa thể tải danh sách bài viết
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Vui lòng thử lại sau ít phút.
              </p>
              <button
                type="button"
                onClick={() => void articlesQuery.refetch()}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 active:translate-y-px"
              >
                <RefreshCw size={15} /> Thử lại
              </button>
            </div>
          )}

          {articlesQuery.data && articles.length > 0 && (
            <>
              <div className={"grid grid-cols-1 gap-6 md:grid-cols-2 " + articleGridClass}>
                {articles.map((article) => (
                  <EventArticleCard key={article.id} article={article} />
                ))}
              </div>
              <ArticlePagination
                className="mt-8"
                page={meta?.page ?? page}
                totalPages={meta?.totalPages ?? 0}
                onChange={changePage}
              />
            </>
          )}

          {articlesQuery.data && !articles.length && (
            <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
              <Newspaper size={34} className="text-slate-300" />
              <h2 className="mt-4 text-lg font-extrabold text-slate-800">
                Chưa có bài viết trong danh mục này
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Bài viết mới từ Admin sẽ xuất hiện tại đây.
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function EventArticleCard({ article }: { article: Article }) {
  return (
    <Link
      to={getArticlePath(article.slug ?? article.id)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_18px_40px_rgba(146,64,14,0.12)] active:translate-y-0"
    >
      <div className="aspect-[16/9] overflow-hidden bg-slate-100 sm:aspect-square">
        {article.thumbnailUrl ? (
          <img
            src={article.thumbnailUrl}
            alt={article.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Newspaper size={42} strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col px-5 py-5 text-left sm:text-center">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-amber-700 sm:justify-center">
          <span>{article.category}</span>
          <span className="h-1 w-1 rounded-full bg-amber-300" />
          <time className="inline-flex items-center gap-1 text-slate-400">
            <CalendarDays size={12} />
            {articleDateFormatter.format(new Date(article.createdAt))}
          </time>
        </div>
        <h2 className="line-clamp-2 text-lg font-extrabold uppercase leading-snug tracking-normal text-slate-900 transition group-hover:text-amber-700">
          {article.title}
        </h2>
        <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-500 sm:mx-auto sm:max-w-[30ch]">
          {getArticleSummary(article)}
        </p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-bold uppercase tracking-wide text-amber-700 sm:justify-center">
          Đọc bài viết
          <ArrowRight size={14} className="transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function ArticlesLoading() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: ARTICLES_PER_PAGE }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="aspect-[16/9] animate-pulse bg-slate-100 sm:aspect-square" />
          <div className="space-y-3 px-5 py-5">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-100 sm:mx-auto" />
            <div className="h-5 w-4/5 animate-pulse rounded bg-slate-100 sm:mx-auto" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-slate-100 sm:mx-auto" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100 sm:mx-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ArticlesPage;
