export const articleDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function getArticleExcerpt(content: string) {
  const document = new DOMParser().parseFromString(content, "text/html");
  return document.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

export function getArticleSummary(article: {
  description?: string | null;
  content: string;
}) {
  return article.description?.trim() || getArticleExcerpt(article.content);
}

function normalizeVietnamese(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function isFireworksArticle(category: string, title: string) {
  return (
    normalizeVietnamese(category) === "su kien" &&
    normalizeVietnamese(title).includes("phao hoa")
  );
}
