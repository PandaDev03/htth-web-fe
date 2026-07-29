export const PATH = {
  HOME: "/",
  AUTH: "/auth",
  ACCOUNT: "/user-account",
  DOWNLOAD: "/download",
  RANKING: "/leader-board",
  COIN_EXCHANGE: "/coin-exchange",
  WALLET_DEPOSIT: "/deposit",
  ARTICLE_DETAIL: "/articles/:id",
  ADMIN_ROOT: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_ARTICLES: "/admin/articles",
};

export const getArticlePath = (id: number | string) => `/articles/${id}`;
