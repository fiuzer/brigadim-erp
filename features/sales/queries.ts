import { requirePermission } from "@/features/auth/server";
import { getProfileNameMap, profileFromMap } from "@/lib/services/profile-names";

export type SalePaymentRow = {
  id: string;
  paid_at: string;
  amount: number;
  payment_method: string;
  notes: string | null;
  user_id: string | null;
  created_at: string;
};

export type SalesQueryRow = {
  id: string;
  sold_at: string;
  payment_method: string;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  payment_status: "Em aberto" | "Parcial" | "Pago" | "Cancelada";
  customer_name: string | null;
  due_date: string | null;
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
  sale_payments: SalePaymentRow[];
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
      .select(
        "id,sold_at,payment_method,subtotal_amount,discount_amount,total_amount,amount_paid,payment_status,customer_name,due_date,status,notes,user_id,sale_items(id,product_id,quantity,unit_price,total_amount,production_cost,product:products(name)),sale_payments(id,paid_at,amount,payment_method,notes,user_id,created_at)",
      )
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

  const salesRows = (salesResult.data ?? []) as unknown as Array<
    Omit<SalesQueryRow, "profile"> & { sale_payments?: SalePaymentRow[] }
  >;

  const profileMap = await getProfileNameMap(
    supabase,
    salesRows.map((sale) => sale.user_id),
  );

  const sales = salesRows.map((sale) => ({
    ...sale,
    sale_payments: (sale.sale_payments ?? []).sort(
      (a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime(),
    ),
    profile: profileFromMap(profileMap, sale.user_id),
  }));

  return {
    sales: sales as SalesQueryRow[],
    products: (productsResult.data ?? []) as unknown as SaleProductOption[],
  };
}
