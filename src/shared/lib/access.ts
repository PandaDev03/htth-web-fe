import type { UserRole } from "@/shared/types/auth";

export function hasAllowedRole(role?: UserRole, allowedRoles?: UserRole[]) {
  if (!allowedRoles?.length) {
    return true;
  }

  return role ? allowedRoles.includes(role) : false;
}
