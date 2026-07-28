import axios from "axios";

import { httpClient } from "@/shared/api/httpClient";
import type { AuthUser } from "@/shared/types/auth";

type ApiErrorBody = {
  message?: string | string[];
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  success: boolean;
  message: string;
};

export type UpdateAvatarResponse = {
  success: boolean;
  avatar: string;
  user: AuthUser;
  cloudinary: {
    publicId: string;
  };
};

function getRequestError(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(" ");
    }

    if (message) {
      return message;
    }
  }

  return error instanceof Error && error.message ? error.message : fallback;
}

export async function changeAccountPassword(payload: ChangePasswordRequest) {
  try {
    const { data } = await httpClient.post<ChangePasswordResponse>(
      "/auth/change-password",
      payload,
    );

    return data;
  } catch (error) {
    throw new Error(
      getRequestError(error, "Không thể đổi mật khẩu, vui lòng thử lại."),
    );
  }
}
export async function updateAccountAvatar(file: File) {
  const formData = new FormData();
  formData.append("avatar", file);

  try {
    const { data } = await httpClient.put<UpdateAvatarResponse>(
      "/account/avatar",
      formData,
    );

    return data;
  } catch (error) {
    throw new Error(
      getRequestError(error, "Không thể cập nhật ảnh đại diện, vui lòng thử lại."),
    );
  }
}
