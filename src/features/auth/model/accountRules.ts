export const GAME_ACCOUNT_MIN_LENGTH = 6;
export const GAME_ACCOUNT_MAX_LENGTH = 30;
export const GAME_ACCOUNT_USERNAME_PATTERN = /^[a-z0-9@.]+$/;
export const GAME_ACCOUNT_PASSWORD_PATTERN = /^[a-z0-9]+$/;

export function normalizeGameAccountUsername(value: string) {
  return value.trim();
}

export const GAME_ACCOUNT_USERNAME_HINT =
  "6-30 ký tự, chỉ dùng chữ thường, số, @ hoặc dấu chấm.";

export const GAME_ACCOUNT_PASSWORD_HINT =
  "6-30 ký tự, chỉ dùng chữ thường và số.";
