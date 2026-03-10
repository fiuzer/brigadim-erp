/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/features/auth/server";
import type { SaleFormValues } from "@/lib/validators/sale";

export async function createSaleAction(input: SaleFormValues) {
  const { supabase, user } = await requirePermission("sales:write");

  const productIds = Array.from(new Set(input.items.map((item) => item.product_id)));
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,name,stock_quantity,production_cost,is_active")
    .in("id", productIds);

  if (productsError || !products) {
    throw new Error("Não foi possível validar os produtos da venda.");
  }

  const productsById = new Map((products as any[]).map((product: any) => [product.id, product]));

  for (const item of input.items) {
    const product = productsById.get(item.product_id);
    if (!product || !product.is_active) {
      throw new Error("Um dos produtos selecionados está inativo.");
    }
    if (Number(product.stock_quantity) < item.quantity) {
      throw new Error(`Estoque insuficiente para ${product.name}.`);
    }
  }

  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const total = Math.max(0, subtotal - input.discount_amount);

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      sold_at: input.sold_at,
      payment_method: input.payment_method,
      discount_amount: input.discount_amount,
      subtotal_amount: subtotal,
      total_amount: total,
      notes: input.notes || null,
      user_id: user.id,
    })
    .select("id")
    .single();

  if (saleError || !sale) {
    throw new Error(`Erro ao criar venda: ${saleError?.message ?? "desconhecido"}`);
  }

  const saleItemsPayload = input.items.map((item) => {
    const product = productsById.get(item.product_id)!;
    return {
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      production_cost: Number(product.production_cost || 0),
      total_amount: item.quantity * item.unit_price,
      discount_amount: 0,
    };
  });

  const { data: insertedItems, error: itemsError } = await supabase
    .from("sale_items")
    .insert(saleItemsPayload)
    .select("id,product_id,quantity");

  if (itemsError || !insertedItems) {
    await supabase.from("sales").delete().eq("id", sale.id);
    throw new Error(`Erro ao salvar itens da venda: ${itemsError?.message ?? "desconhecido"}`);
  }

  for (const item of insertedItems as any[]) {
    const product = productsById.get(item.product_id)!;
    const nextStock = Number(product.stock_quantity) - item.quantity;
    product.stock_quantity = nextStock;

    const { error: stockError } = await supabase
      .from("products")
      .update({ stock_quantity: nextStock })
      .eq("id", item.product_id);

    if (stockError) {
      throw new Error(`Erro ao atualizar estoque: ${stockError.message}`);
    }

    await supabase.from("inventory_movements").insert({
      product_id: item.product_id,
      movement_type: "Venda",
      quantity: item.quantity,
      reason: "Venda registrada",
      notes: `Venda ${sale.id}`,
      user_id: user.id,
      sale_item_id: item.id,
    });
  }

  revalidatePath("/vendas");
  revalidatePath("/dashboard");
  revalidatePath("/estoque");
  revalidatePath("/relatorios");
}

export async function cancelSaleAction(saleId: string) {
  const { supabase, user } = await requirePermission("sales:write");

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .select("id,status")
    .eq("id", saleId)
    .single();

  if (saleError || !sale) {
    throw new Error("Venda não encontrada.");
  }

  if (sale.status === "Cancelada") {
    return;
  }

  const { data: items, error: itemsError } = await supabase
    .from("sale_items")
    .select("id,product_id,quantity")
    .eq("sale_id", saleId);

  if (itemsError || !items) {
    throw new Error("Não foi possível recuperar os itens da venda.");
  }

  for (const item of items as any[]) {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", item.product_id)
      .single();

    if (productError || !product) continue;

    const nextStock = Number(product.stock_quantity) + Number(item.quantity);
    await supabase.from("products").update({ stock_quantity: nextStock }).eq("id", item.product_id);
    await supabase.from("inventory_movements").insert({
      product_id: item.product_id,
      movement_type: "Cancelamento",
      quantity: item.quantity,
      reason: "Estorno de venda",
      notes: `Venda ${saleId}`,
      user_id: user.id,
      sale_item_id: item.id,
    });
  }

  const { error: updateError } = await supabase
    .from("sales")
    .update({ status: "Cancelada" })
    .eq("id", saleId);

  if (updateError) {
    throw new Error(`Erro ao cancelar venda: ${updateError.message}`);
  }

  revalidatePath("/vendas");
  revalidatePath("/dashboard");
  revalidatePath("/estoque");
  revalidatePath("/relatorios");
}
