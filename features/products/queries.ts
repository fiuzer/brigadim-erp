import { requirePermission } from "@/features/auth/server";

export type ProductQueryRow = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  production_cost: number;
  sale_price: number;
  stock_quantity: number;
  min_stock: number;
  is_active: boolean;
  category: { id: string; name: string } | null;
};

export async function getProductsPageData() {
  const { supabase } = await requirePermission("products:read");

  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from("products")
      .select("*, category:product_categories(id,name)")
      .order("created_at", { ascending: false }),
    supabase.from("product_categories").select("*").order("name", { ascending: true }),
  ]);

  if (productsResult.error) {
    throw new Error(`Erro ao carregar produtos: ${productsResult.error.message}`);
  }

  if (categoriesResult.error) {
    throw new Error(`Erro ao carregar categorias: ${categoriesResult.error.message}`);
  }

  return {
    products: (productsResult.data ?? []) as unknown as ProductQueryRow[],
    categories: categoriesResult.data ?? [],
  };
}
