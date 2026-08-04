import axios from "axios";

import { httpClient } from "@/shared/api/httpClient";

export type ArticleEventProgress = {
  current: number;
  target: number;
  participants: number;
  nextMilestone: number;
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
  eventKey: "fireworks" | null;
  eventProgress: ArticleEventProgress | null;
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
  eventKey?: "fireworks";
  eventProgress?: ArticleEventProgress;
};

type ApiEnvelope<T> = { message?: string; data: T };
type ApiErrorBody = { message?: string | string[] };

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(" ");
    if (message) return message;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function getArticles(limit = 6) {
  try {
    const { data } = await httpClient.get<ApiEnvelope<Article[]>>("/articles", {
      params: { limit },
    });
    return data.data;
  } catch (error) {
    throw new Error(errorMessage(error, "Không thể tải danh sách bài viết."));
  }
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
