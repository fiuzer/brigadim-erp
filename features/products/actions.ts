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
    throw new Error(`Nao foi possivel criar o produto: ${error.message}`);
  }

  revalidatePath("/produtos");
  revalidatePath("/dashboard");
  revalidatePath("/estoque");
}

export async function updateProductAction(input: ProductFormValues) {
  if (!input.id) {
    throw new Error("ID do produto e obrigatorio.");
  }

  const { supabase } = await requirePermission("products:write");

  const { error } = await supabase
    .from("products")
    .update(normalizePayload(input))
    .eq("id", input.id);

  if (error) {
    throw new Error(`Nao foi possivel atualizar o produto: ${error.message}`);
  }

  revalidatePath("/produtos");
  revalidatePath("/dashboard");
  revalidatePath("/estoque");
}

export async function deleteProductAction(productId: string) {
  const { supabase } = await requirePermission("products:write");

  const [movementCountResult, saleItemCountResult] = await Promise.all([
    supabase
      .from("inventory_movements")
      .select("id", { head: true, count: "exact" })
      .eq("product_id", productId),
    supabase
      .from("sale_items")
      .select("id", { head: true, count: "exact" })
      .eq("product_id", productId),
  ]);

  if (movementCountResult.error) {
    throw new Error(
      `Nao foi possivel validar historico de estoque: ${movementCountResult.error.message}`,
    );
  }

  if (saleItemCountResult.error) {
    throw new Error(
      `Nao foi possivel validar historico de vendas: ${saleItemCountResult.error.message}`,
    );
  }

  const hasHistory =
    (movementCountResult.count ?? 0) > 0 || (saleItemCountResult.count ?? 0) > 0;

  if (hasHistory) {
    const { error: updateError } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", productId);

    if (updateError) {
      throw new Error(`Nao foi possivel desativar o produto: ${updateError.message}`);
    }

    revalidatePath("/produtos");
    revalidatePath("/dashboard");
    revalidatePath("/estoque");
    return { mode: "deactivated" as const };
  }

  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    const message = error.message.toLowerCase();
    const isForeignKeyError = message.includes("foreign key") || message.includes("violates");

    if (isForeignKeyError) {
      const { error: updateError } = await supabase
        .from("products")
        .update({ is_active: false })
        .eq("id", productId);

      if (updateError) {
        throw new Error(`Nao foi possivel desativar o produto: ${updateError.message}`);
      }

      revalidatePath("/produtos");
      revalidatePath("/dashboard");
      revalidatePath("/estoque");
      return { mode: "deactivated" as const };
    }

    throw new Error(`Nao foi possivel excluir o produto: ${error.message}`);
  }

  revalidatePath("/produtos");
  revalidatePath("/dashboard");
  revalidatePath("/estoque");
  return { mode: "deleted" as const };
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
    throw new Error(`Nao foi possivel alterar o status do produto: ${error.message}`);
  }

  revalidatePath("/produtos");
}
