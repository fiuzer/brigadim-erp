import { requirePermission } from "@/features/auth/server";
import { getProfileNameMap, profileFromMap } from "@/lib/services/profile-names";

export type SalesQueryRow = {
  id: string;
  sold_at: string;
  payment_method: string;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  status: "Ativa" | "Cancelada";
  notes: string | null;
  user_id: string | null;
  profile: { full_name: string | null } | null;
  sale_items: {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    production_cost: number;
    product: { name: string } | null;
  }[];
};

export type SaleProductOption = {
  id: string;
  name: string;
  sale_price: number;
  stock_quantity: number;
  is_active: boolean;
};

export async function getSalesPageData() {
  const { supabase } = await requirePermission("sales:read");

  const [salesResult, productsResult] = await Promise.all([
    supabase
      .from("sales")
      .select("*, sale_items(*, product:products(name))")
      .order("sold_at", { ascending: false })
      .limit(300),
    supabase
      .from("products")
      .select("id,name,sale_price,stock_quantity,is_active")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  if (salesResult.error) {
    throw new Error(`Erro ao carregar vendas: ${salesResult.error.message}`);
  }

  if (productsResult.error) {
    throw new Error(`Erro ao carregar produtos: ${productsResult.error.message}`);
  }

  const salesRows = (salesResult.data ?? []) as unknown as Array<{
    id: string;
    sold_at: string;
    payment_method: string;
    subtotal_amount: number;
    discount_amount: number;
    total_amount: number;
    status: "Ativa" | "Cancelada";
    notes: string | null;
    user_id: string | null;
    sale_items: SalesQueryRow["sale_items"];
  }>;

  const profileMap = await getProfileNameMap(
    supabase,
    salesRows.map((sale) => sale.user_id),
  );

  const sales = salesRows.map((sale) => ({
    ...sale,
    profile: profileFromMap(profileMap, sale.user_id),
  }));

  return {
    sales: sales as SalesQueryRow[],
    products: (productsResult.data ?? []) as unknown as SaleProductOption[],
  };
}
