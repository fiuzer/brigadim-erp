"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/features/auth/server";
import type { ProductFormValues } from "@/lib/validators/product";

function normalizePayload(input: ProductFormValues) {
  return {
    name: input.name,
    category_id: input.category_id || null,
    description: input.description || null,
    sku: input.sku || null,
    production_cost: input.production_cost,
    sale_price: input.sale_price,
    stock_quantity: input.stock_quantity,
    min_stock: input.min_stock,
    is_active: input.is_active,
  };
}

export async function createProductAction(input: ProductFormValues) {
  const { supabase, user } = await requirePermission("products:write");

  const { error } = await supabase.from("products").insert({
    ...normalizePayload(input),
    created_by: user.id,
  });

  if (error) {
    throw new Error(`Não foi possível criar o produto: ${error.message}`);
  }

  revalidatePath("/produtos");
  revalidatePath("/dashboard");
  revalidatePath("/estoque");
}

export async function updateProductAction(input: ProductFormValues) {
  if (!input.id) {
    throw new Error("ID do produto é obrigatório.");
  }

  const { supabase } = await requirePermission("products:write");

  const { error } = await supabase
    .from("products")
    .update(normalizePayload(input))
    .eq("id", input.id);

  if (error) {
    throw new Error(`Não foi possível atualizar o produto: ${error.message}`);
  }

  revalidatePath("/produtos");
  revalidatePath("/dashboard");
  revalidatePath("/estoque");
}

export async function deleteProductAction(productId: string) {
  const { supabase } = await requirePermission("products:write");

  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    throw new Error(`Não foi possível excluir o produto: ${error.message}`);
  }

  revalidatePath("/produtos");
}

export async function toggleProductStatusAction(productId: string, isActive: boolean) {
  const { supabase } = await requirePermission("products:write");

  const { error } = await supabase
    .from("products")
    .update({
      is_active: !isActive,
    })
    .eq("id", productId);

  if (error) {
    throw new Error(`Não foi possível alterar o status do produto: ${error.message}`);
  }

  revalidatePath("/produtos");
}
