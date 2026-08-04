import { ChevronLeft, ChevronRight } from "lucide-react";

type ArticlePaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
};

function getVisiblePages(page: number, totalPages: number) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);

  return Array.from(pages)
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((current, next) => current - next);
}

export function ArticlePagination({
  page,
  totalPages,
  onChange,
  className,
}: ArticlePaginationProps) {
  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <nav
      className={[
        "flex flex-wrap items-center justify-center gap-2",
        className ?? "",
      ].join(" ")}
      aria-label="Phân trang bài viết"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-amber-300 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-45"
        aria-label="Trang trước"
      >
        <ChevronLeft size={18} />
      </button>

      {visiblePages.map((item, index) => (
        <span key={item} className="inline-flex items-center gap-2">
          {index > 0 && item - visiblePages[index - 1] > 1 && (
            <span className="px-1 text-sm font-bold text-slate-300">...</span>
          )}
          <button
            type="button"
            onClick={() => onChange(item)}
            className={
              "h-10 min-w-10 rounded-lg border px-3 text-sm font-bold transition active:translate-y-px " +
              (item === page
                ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:text-amber-700")
            }
            aria-current={item === page ? "page" : undefined}
          >
            {item}
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-amber-300 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-45"
        aria-label="Trang tiếp theo"
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
