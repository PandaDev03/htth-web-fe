import { ArrowUpRight, CalendarDays, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";

import type { Article } from "@/features/articles/api/articleApi";
import {
  articleDateFormatter,
  getArticleSummary,
} from "@/features/articles/utils/articlePresentation";
import { getArticlePath } from "@/shared/config/path";

type ArticleCardProps = {
  article: Article;
};

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      to={getArticlePath(article.slug ?? article.id)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_16px_36px_rgba(146,64,14,0.10)] active:translate-y-0"
    >
      <div className="aspect-[16/9] overflow-hidden bg-slate-100">
        {article.thumbnailUrl ? (
          <img
            src={article.thumbnailUrl}
            alt={article.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Newspaper size={36} strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
            {article.category}
          </span>
          <time className="inline-flex shrink-0 items-center gap-1.5 text-[11px] text-slate-400">
            <CalendarDays size={12} />
            {articleDateFormatter.format(new Date(article.createdAt))}
          </time>
        </div>
        <h3 className="line-clamp-2 text-lg font-extrabold leading-7 text-slate-900 transition group-hover:text-amber-700">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
          {getArticleSummary(article)}
        </p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-bold text-amber-700">
          Đọc bài viết
          <ArrowUpRight
            size={14}
            className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
