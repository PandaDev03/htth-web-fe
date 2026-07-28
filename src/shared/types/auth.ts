export type UserRole = "admin" | "moderator" | "user";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  coin?: number;
  tongnap?: number;
  avatar?: string | null;
};
