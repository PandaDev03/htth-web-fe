export type UserRole = "admin" | "moderator" | "user";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};
