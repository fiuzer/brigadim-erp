import {
  hasPermission,
  ROLE_LABELS,
  type Permission,
  type UserRole,
} from "@/lib/constants/roles";

export function can(role: UserRole, permission: Permission) {
  return hasPermission(role, permission);
}

export function roleLabel(role: UserRole) {
  return ROLE_LABELS[role];
}
