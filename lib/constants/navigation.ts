import {
  BarChart3,
  Boxes,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  Package,
  Settings,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import type { Permission } from "@/lib/constants/roles";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  requiredPermission?: Permission;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    requiredPermission: "dashboard:read",
  },
  {
    href: "/produtos",
    label: "Produtos",
    icon: Package,
    requiredPermission: "products:read",
  },
  {
    href: "/estoque",
    label: "Estoque",
    icon: Boxes,
    requiredPermission: "inventory:read",
  },
  {
    href: "/vendas",
    label: "Vendas",
    icon: DollarSign,
    requiredPermission: "sales:read",
  },
  {
    href: "/despesas",
    label: "Despesas",
    icon: ClipboardList,
    requiredPermission: "expenses:read",
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: BarChart3,
    requiredPermission: "reports:read",
  },
  {
    href: "/usuarios",
    label: "Usuários",
    icon: Users,
    requiredPermission: "users:read",
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    icon: Settings,
    requiredPermission: "settings:read",
  },
];
