export const PATH = {
  HOME: "/",
  AUTH: "/auth",
  ACCOUNT: "/user-account",
  DOWNLOAD: "/download",
  RANKING: "/leader-board",
  COIN_EXCHANGE: "/coin-exchange",
  WALLET_DEPOSIT: "/donate",
  ARTICLES: "/articles",
  ARTICLE_DETAIL: "/articles/:id",
  NIKA_WHEEL: "/event/vong-quay-nika",
  ADMIN_ROOT: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_ARTICLES: "/admin/articles",
  ADMIN_FASHION_COMPOSER: "/admin/fashion-composer",
};

export const getArticlePath = (idOrSlug: number | string) =>
  `/articles/${idOrSlug}`;
