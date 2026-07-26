import type { ReactNode } from "react";

import type { UserRole } from "@/shared/types/auth";

export type AppRoute = {
  path?: string;
  index?: boolean;
  title?: string;
  icon?: ReactNode;
  element: ReactNode;
  children?: AppRoute[];
  allowedRoles?: UserRole[];
  isPublic?: boolean;
  showInMenu?: boolean;
};
