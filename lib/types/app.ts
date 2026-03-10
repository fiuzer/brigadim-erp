import type { Database } from "@/lib/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  category?: Database["public"]["Tables"]["product_categories"]["Row"] | null;
};
export type InventoryMovement = Database["public"]["Tables"]["inventory_movements"]["Row"] & {
  product?: { name: string } | null;
  profile?: { full_name: string | null } | null;
};
export type Sale = Database["public"]["Tables"]["sales"]["Row"] & {
  profile?: { full_name: string | null } | null;
  sale_items?: SaleItemWithProduct[];
};
export type SaleItem = Database["public"]["Tables"]["sale_items"]["Row"];
export type SaleItemWithProduct = SaleItem & { product?: { name: string } | null };
export type Expense = Database["public"]["Tables"]["expenses"]["Row"] & {
  category?: { name: string } | null;
  profile?: { full_name: string | null } | null;
};

export type DateRange = {
  startDate: string;
  endDate: string;
};

export type DashboardWidgetType =
  | "kpi-receita-hoje"
  | "kpi-receita-mes"
  | "kpi-lucro-liquido"
  | "kpi-ticket-medio"
  | "chart-pagamentos"
  | "chart-produtos-vendidos"
  | "chart-despesas-categoria"
  | "table-estoque-critico"
  | "table-produtos-lucrativos";

export type DashboardWidgetLayout = {
  id: string;
  type: DashboardWidgetType;
  title: string;
  colSpan: 1 | 2 | 3 | 4;
  rowSpan: 1 | 2;
  settings?: {
    limit?: number;
  };
};
