import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  Newspaper,
  RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { getArticles } from "@/features/articles/api/articleApi";
import { ArticleCard } from "@/features/articles/components/ArticleCard";
import {
  articleDateFormatter,
  getArticleSummary,
} from "@/features/articles/utils/articlePresentation";
import { Footer } from "@/shared/components/site/Footer";
import { Header } from "@/shared/components/site/Header";
import { getArticlePath } from "@/shared/config/path";
import { scrollToTop } from "@/shared/utils/utils";

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
  const articlesQuery = useQuery({
    queryKey: ["articles", "public"],
    queryFn: () => getArticles(24),
    staleTime: 60_000,
  });

  useEffect(() => {
    scrollToTop({});
  }, []);

  const filteredArticles = useMemo(() => {
    const articles = articlesQuery.data ?? [];
    if (activeCategory === "Tất cả") return articles;
    return articles.filter((article) => article.category === activeCategory);
  }, [activeCategory, articlesQuery.data]);

  const [featuredArticle, ...remainingArticles] = filteredArticles;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      <Header />
      <main className="flex-1 pb-20 pt-24">
        <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
              <Newspaper size={16} /> Tin tức từ Grand Line
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Bài viết
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Theo dõi sự kiện, thông báo bảo trì và những cập nhật mới nhất từ
              đội ngũ Hải tặc vui vẻ.
            </p>
          </div>

          <div className="mt-8 overflow-x-auto pb-2">
            <div
              className="inline-flex min-w-max gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1"
              aria-label="Lọc bài viết theo danh mục"
            >
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={
                    "rounded-lg px-3.5 py-2 text-xs font-bold transition active:translate-y-px " +
                    (activeCategory === category
                      ? "bg-white text-amber-700 shadow-sm ring-1 ring-slate-200"
                      : "text-slate-500 hover:bg-white hover:text-slate-800")
                  }
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-10">
          {articlesQuery.isLoading && (
            <div className="space-y-8">
              <div className="grid overflow-hidden rounded-2xl border border-slate-200 lg:grid-cols-2">
                <div className="aspect-[16/10] animate-pulse bg-slate-200 lg:aspect-auto lg:min-h-[26rem]" />
                <div className="space-y-4 p-6 sm:p-9">
                  <div className="h-5 w-28 animate-pulse rounded bg-slate-100" />
                  <div className="h-10 w-5/6 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
                  />
                ))}
              </div>
            </div>
          )}

          {articlesQuery.isError && (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <Newspaper size={32} className="text-slate-300" />
              <h2 className="mt-4 text-lg font-extrabold text-slate-700">
                Chưa thể tải danh sách bài viết
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Vui lòng thử lại sau ít phút.
              </p>
              <button
                type="button"
                onClick={() => void articlesQuery.refetch()}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400 active:translate-y-px"
              >
                <RefreshCw size={15} /> Thử lại
              </button>
            </div>
          )}

          {featuredArticle && (
            <>
              <Link
                to={getArticlePath(featuredArticle.slug ?? featuredArticle.id)}
                className="group grid overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-[0_10px_36px_rgba(15,23,42,0.06)] transition hover:border-amber-200 lg:grid-cols-[1.25fr_1fr]"
              >
                <div className="aspect-[16/10] overflow-hidden bg-slate-100 lg:aspect-auto lg:min-h-[28rem]">
                  {featuredArticle.thumbnailUrl ? (
                    <img
                      src={featuredArticle.thumbnailUrl}
                      alt={featuredArticle.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <Newspaper size={52} strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-10">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="rounded-full bg-amber-100 px-3 py-1.5 font-bold uppercase tracking-wide text-amber-800">
                      {featuredArticle.category}
                    </span>
                    <time className="inline-flex items-center gap-1.5 text-slate-400">
                      <CalendarDays size={13} />
                      {articleDateFormatter.format(
                        new Date(featuredArticle.createdAt),
                      )}
                    </time>
                  </div>
                  <h2 className="mt-5 line-clamp-3 text-2xl font-extrabold leading-tight tracking-tight text-slate-900 transition group-hover:text-amber-700 sm:text-4xl">
                    {featuredArticle.title}
                  </h2>
                  <p className="mt-4 line-clamp-4 text-sm leading-7 text-slate-500 sm:text-base">
                    {getArticleSummary(featuredArticle)}
                  </p>
                  <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-amber-700">
                    Đọc bài viết
                    <ArrowRight
                      size={16}
                      className="transition group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>

              {remainingArticles.length > 0 && (
                <div className="mt-12">
                  <h2 className="mb-6 text-xl font-extrabold text-slate-900 sm:text-2xl">
                    Bài viết mới nhất
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2">
                    {remainingArticles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {articlesQuery.data && !filteredArticles.length && (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <Newspaper size={32} className="text-slate-300" />
              <h2 className="mt-4 text-lg font-extrabold text-slate-700">
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

export default ArticlesPage;
