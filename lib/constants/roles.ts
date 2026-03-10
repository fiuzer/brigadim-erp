export const ROLES = [
  "administrador",
  "financeiro",
  "vendas",
  "estoque",
  "visualizador",
] as const;

export type UserRole = (typeof ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  administrador: "Administrador",
  financeiro: "Financeiro",
  vendas: "Vendas",
  estoque: "Estoque",
  visualizador: "Visualizador",
};

export type Permission =
  | "dashboard:read"
  | "dashboard:edit"
  | "products:read"
  | "products:write"
  | "inventory:read"
  | "inventory:write"
  | "sales:read"
  | "sales:write"
  | "expenses:read"
  | "expenses:write"
  | "reports:read"
  | "users:read"
  | "users:write"
  | "settings:read"
  | "settings:write";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  administrador: [
    "dashboard:read",
    "dashboard:edit",
    "products:read",
    "products:write",
    "inventory:read",
    "inventory:write",
    "sales:read",
    "sales:write",
    "expenses:read",
    "expenses:write",
    "reports:read",
    "users:read",
    "users:write",
    "settings:read",
    "settings:write",
  ],
  financeiro: [
    "dashboard:read",
    "dashboard:edit",
    "products:read",
    "inventory:read",
    "sales:read",
    "expenses:read",
    "expenses:write",
    "reports:read",
    "settings:read",
  ],
  vendas: [
    "dashboard:read",
    "dashboard:edit",
    "products:read",
    "inventory:read",
    "sales:read",
    "sales:write",
    "reports:read",
  ],
  estoque: [
    "dashboard:read",
    "dashboard:edit",
    "products:read",
    "products:write",
    "inventory:read",
    "inventory:write",
    "reports:read",
  ],
  visualizador: [
    "dashboard:read",
    "dashboard:edit",
    "reports:read",
    "sales:read",
    "expenses:read",
  ],
};

export function hasPermission(role: UserRole, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}
