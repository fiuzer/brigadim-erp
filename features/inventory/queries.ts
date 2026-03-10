import { requirePermission } from "@/features/auth/server";
import { getProfileNameMap, profileFromMap } from "@/lib/services/profile-names";

export type InventoryProductRow = {
  id: string;
  name: string;
  stock_quantity: number;
  min_stock: number;
  production_cost: number;
  category: { name: string } | null;
};

export type InventoryMovementRow = {
  id: string;
  movement_type: "Entrada" | "Saída" | "Ajuste" | "Venda" | "Cancelamento";
  quantity: number;
  reason: string | null;
  notes: string | null;
  created_at: string;
  product: { name: string } | null;
  profile: { full_name: string | null } | null;
};

export async function getInventoryPageData() {
  const { supabase } = await requirePermission("inventory:read");

  const [productsResult, movementsResult] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,stock_quantity,min_stock,production_cost,category:product_categories(name)")
      .order("name", { ascending: true }),
    supabase
      .from("inventory_movements")
      .select("id,movement_type,quantity,reason,notes,created_at,user_id,product:products(name)")
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  if (productsResult.error) {
    throw new Error(`Erro ao carregar estoque: ${productsResult.error.message}`);
  }

  if (movementsResult.error) {
    throw new Error(`Erro ao carregar movimentacoes: ${movementsResult.error.message}`);
  }

  const movementRows = (movementsResult.data ?? []) as unknown as Array<{
    id: string;
    movement_type: "Entrada" | "Saída" | "Ajuste" | "Venda" | "Cancelamento";
    quantity: number;
    reason: string | null;
    notes: string | null;
    created_at: string;
    product: { name: string } | null;
    user_id: string | null;
  }>;

  const profileMap = await getProfileNameMap(
    supabase,
    movementRows.map((movement) => movement.user_id),
  );

  const movements = movementRows.map((movement) => ({
    ...movement,
    profile: profileFromMap(profileMap, movement.user_id),
  }));

  return {
    products: (productsResult.data ?? []) as unknown as InventoryProductRow[],
    movements: movements as unknown as InventoryMovementRow[],
  };
}
