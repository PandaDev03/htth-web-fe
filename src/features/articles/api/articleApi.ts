import axios from "axios";

import { httpClient } from "@/shared/api/httpClient";
import type { RewardIconItem } from "@/shared/types/reward";

export type ArticleProgressRewardItem = RewardIconItem & {
  quantity: number;
};

export type ArticleProgress = {
  key: string | null;
  title: string | null;
  currentLabel: string | null;
  unit: string | null;
  statusLabel: string | null;
  eventId: number;
  scoreIndex: number;
  current: number;
  target: number;
  participants: number;
  nextMilestone: number | null;
  milestones: {
    id: number | null;
    target: number;
    sort: number;
    reached: boolean;
    rewards: ArticleProgressRewardItem[];
  }[];
};

export type ArticleRewardTuple = [number, number, number];

export type ArticleProgressMilestonePayload =
  | [number, number, number, ArticleRewardTuple[]]
  | {
      id?: number;
      target: number;
      sort?: number;
      rewards?: ArticleRewardTuple[];
    };

export type Article = {
  id: number;
  title: string;
  slug: string | null;
  description: string | null;
  category: string;
  content: string;
  thumbnailUrl: string;
  published: boolean;
  progress: ArticleProgress | null;
  authorId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateArticlePayload = {
  title: string;
  description?: string;
  category: string;
  content: string;
  thumbnailUrl: string;
  progress?: {
    key?: string;
    title?: string;
    currentLabel?: string;
    unit?: string;
    statusLabel?: string;
    eventId: number;
    scoreIndex: number;
    milestones: ArticleProgressMilestonePayload[];
  };
};

export type ArticlePaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ArticleListPage = {
  data: Article[];
  meta: ArticlePaginationMeta;
};

type ApiEnvelope<T> = {
  message?: string;
  data: T;
  meta?: ArticlePaginationMeta;
};
type ApiErrorBody = { message?: string | string[] };

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(" ");
    if (message) return message;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

export type GetArticlesPageParams = {
  page?: number;
  limit?: number;
  category?: string;
};

export async function getArticlesPage(params: GetArticlesPageParams = {}) {
  try {
    const { data } = await httpClient.get<ApiEnvelope<Article[]>>("/articles", {
      params,
    });
    return {
      data: data.data,
      meta: data.meta ?? {
        page: params.page ?? 1,
        limit: params.limit ?? data.data.length,
        total: data.data.length,
        totalPages: data.data.length ? 1 : 0,
      },
    } satisfies ArticleListPage;
  } catch (error) {
    throw new Error(errorMessage(error, "Không thể tải danh sách bài viết."));
  }
}

export async function getArticles(limit = 6) {
  const result = await getArticlesPage({ limit });
  return result.data;
}

export async function getArticle(idOrSlug: number | string) {
  try {
    const { data } = await httpClient.get<ApiEnvelope<Article>>(
      `/articles/${idOrSlug}`,
    );
    return data.data;
  } catch (error) {
    throw new Error(errorMessage(error, "Không thể tải bài viết."));
  }
}

export async function getAdminArticles() {
  try {
    const { data } =
      await httpClient.get<ApiEnvelope<Article[]>>("/admin/articles");
    return data.data;
  } catch (error) {
    throw new Error(errorMessage(error, "Không thể tải danh sách bài viết."));
  }
}

export async function createAdminArticle(payload: CreateArticlePayload) {
  try {
    const { data } = await httpClient.post<ApiEnvelope<Article>>(
      "/admin/articles",
      payload,
    );
    return data;
  } catch (error) {
    throw new Error(errorMessage(error, "Không thể đăng bài viết."));
  }
}

export async function updateAdminArticle(
  id: number,
  payload: CreateArticlePayload,
) {
  try {
    const { data } = await httpClient.patch<ApiEnvelope<Article>>(
      `/admin/articles/${id}`,
      payload,
    );
    return data;
  } catch (error) {
    throw new Error(errorMessage(error, "Không thể cập nhật bài viết."));
  }
}

export async function uploadArticleThumbnail(file: File) {
  const formData = new FormData();
  formData.append("thumbnail", file);
  try {
    const { data } = await httpClient.post<
      ApiEnvelope<{ url: string; publicId: string }>
    >("/admin/articles/thumbnail", formData);
    return data.data;
  } catch (error) {
    throw new Error(errorMessage(error, "Không thể upload thumbnail."));
  }
}

export async function deleteAdminArticle(id: number) {
  try {
    const { data } = await httpClient.delete<{ message: string }>(
      `/admin/articles/${id}`,
    );
    return data;
  } catch (error) {
    throw new Error(errorMessage(error, "Không thể xóa bài viết."));
  }
}
