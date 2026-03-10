"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/features/auth/server";
import type { InventoryMovementValues } from "@/lib/validators/inventory";

function movementToStockDelta(type: InventoryMovementValues["movement_type"], quantity: number) {
  if (type === "Entrada" || type === "Cancelamento") return quantity;
  if (type === "Saída" || type === "Venda") return -quantity;
  return 0;
}

export async function registerInventoryMovementAction(input: InventoryMovementValues) {
  const { supabase, user } = await requirePermission("inventory:write");

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, stock_quantity")
    .eq("id", input.product_id)
    .single();

  if (productError || !product) {
    throw new Error("Produto não encontrado.");
  }

  const delta = movementToStockDelta(input.movement_type, input.quantity);
  const nextStock =
    input.movement_type === "Ajuste"
      ? input.quantity
      : Number(product.stock_quantity) + delta;

  if (nextStock < 0) {
    throw new Error("Estoque insuficiente para essa movimentação.");
  }

  const { error: movementError } = await supabase.from("inventory_movements").insert({
    ...input,
    reason: input.reason || null,
    notes: input.notes || null,
    user_id: user.id,
  });

  if (movementError) {
    throw new Error(`Erro ao registrar movimentação: ${movementError.message}`);
  }

  const { error: stockError } = await supabase
    .from("products")
    .update({ stock_quantity: nextStock })
    .eq("id", input.product_id);

  if (stockError) {
    throw new Error(`Erro ao atualizar estoque: ${stockError.message}`);
  }

  revalidatePath("/estoque");
  revalidatePath("/dashboard");
  revalidatePath("/produtos");
}
