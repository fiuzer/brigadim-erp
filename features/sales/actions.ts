"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/features/auth/server";
import { PAYMENT_METHODS } from "@/lib/constants/options";
import { saleSchema, type SaleFormValues } from "@/lib/validators/sale";

type PaymentStatus = "Em aberto" | "Parcial" | "Pago" | "Cancelada";

const registerSalePaymentSchema = z.object({
  sale_id: z.string().uuid(),
  paid_at: z.string().min(1, "Data e hora do pagamento e obrigatoria"),
  amount: z.number().positive("Valor deve ser maior que zero"),
  payment_method: z.enum(PAYMENT_METHODS),
  notes: z.string().max(500).nullable().optional(),
});

function resolvePaymentStatus(total: number, paid: number, isCancelled: boolean): PaymentStatus {
  if (isCancelled) return "Cancelada";
  if (paid <= 0) return "Em aberto";
  if (paid < total) return "Parcial";
  return "Pago";
}

export async function createSaleAction(input: SaleFormValues) {
  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados da venda invalidos.");
  }

  const values = parsed.data;
  const { supabase, user } = await requirePermission("sales:write");

  const productIds = Array.from(new Set(values.items.map((item) => item.product_id)));
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,name,stock_quantity,production_cost,is_active")
    .in("id", productIds);

  if (productsError || !products) {
    throw new Error("Nao foi possivel validar os produtos da venda.");
  }

  const productsById = new Map(
    (products as Array<{ id: string; name: string; stock_quantity: number; production_cost: number; is_active: boolean }>).map(
      (product) => [product.id, product],
    ),
  );

  for (const item of values.items) {
    const product = productsById.get(item.product_id);
    if (!product || !product.is_active) {
      throw new Error("Um dos produtos selecionados esta inativo.");
    }
    if (Number(product.stock_quantity) < item.quantity) {
      throw new Error(`Estoque insuficiente para ${product.name}.`);
    }
  }

  const subtotal = values.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const total = Math.max(0, subtotal - values.discount_amount);

  const initialPayment =
    values.payment_timing === "na_hora"
      ? total
      : Math.min(Number(values.initial_payment_amount || 0), total);

  const paymentStatus = resolvePaymentStatus(total, initialPayment, false);

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      sold_at: values.sold_at,
      payment_method: values.payment_method,
      discount_amount: values.discount_amount,
      subtotal_amount: subtotal,
      total_amount: total,
      amount_paid: initialPayment,
      payment_status: paymentStatus,
      customer_name:
        values.payment_timing === "em_aberto" ? (values.customer_name?.trim() || null) : null,
      due_date: values.payment_timing === "em_aberto" ? values.due_date || null : null,
      notes: values.notes || null,
      user_id: user.id,
    })
    .select("id")
    .single();

  if (saleError || !sale) {
    throw new Error(`Erro ao criar venda: ${saleError?.message ?? "desconhecido"}`);
  }

  const saleItemsPayload = values.items.map((item) => {
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

  if (initialPayment > 0) {
    const { error: paymentError } = await supabase.from("sale_payments").insert({
      sale_id: sale.id,
      paid_at: values.sold_at,
      amount: initialPayment,
      payment_method: values.payment_method,
      notes: values.payment_timing === "na_hora" ? "Pagamento integral na venda" : "Pagamento inicial",
      user_id: user.id,
    });

    if (paymentError) {
      await supabase.from("sales").delete().eq("id", sale.id);
      throw new Error(`Erro ao registrar pagamento inicial: ${paymentError.message}`);
    }
  }

  for (const item of insertedItems as Array<{ id: string; product_id: string; quantity: number }>) {
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

export async function registerSalePaymentAction(input: z.infer<typeof registerSalePaymentSchema>) {
  const parsed = registerSalePaymentSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados de pagamento invalidos.");
  }

  const { supabase, user } = await requirePermission("sales:write");

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .select("id,total_amount,amount_paid,status,payment_status")
    .eq("id", parsed.data.sale_id)
    .single();

  if (saleError || !sale) {
    throw new Error("Venda nao encontrada.");
  }

  if (sale.status === "Cancelada" || sale.payment_status === "Cancelada") {
    throw new Error("Nao e possivel receber pagamento de venda cancelada.");
  }

  const total = Number(sale.total_amount || 0);
  const paid = Number(sale.amount_paid || 0);
  const remaining = Math.max(total - paid, 0);

  if (remaining <= 0) {
    throw new Error("Esta venda ja esta quitada.");
  }

  if (parsed.data.amount > remaining) {
    throw new Error(`Valor excede o saldo em aberto (${remaining.toFixed(2)}).`);
  }

  const { error: paymentError } = await supabase.from("sale_payments").insert({
    sale_id: parsed.data.sale_id,
    paid_at: parsed.data.paid_at,
    amount: parsed.data.amount,
    payment_method: parsed.data.payment_method,
    notes: parsed.data.notes || null,
    user_id: user.id,
  });

  if (paymentError) {
    throw new Error(`Erro ao registrar pagamento: ${paymentError.message}`);
  }

  const nextPaid = paid + parsed.data.amount;
  const nextStatus = resolvePaymentStatus(total, nextPaid, false);

  const { error: updateError } = await supabase
    .from("sales")
    .update({ amount_paid: nextPaid, payment_status: nextStatus })
    .eq("id", parsed.data.sale_id);

  if (updateError) {
    throw new Error(`Erro ao atualizar saldo da venda: ${updateError.message}`);
  }

  revalidatePath("/vendas");
  revalidatePath("/dashboard");
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
    throw new Error("Venda nao encontrada.");
  }

  if (sale.status === "Cancelada") {
    return;
  }

  const { data: items, error: itemsError } = await supabase
    .from("sale_items")
    .select("id,product_id,quantity")
    .eq("sale_id", saleId);

  if (itemsError || !items) {
    throw new Error("Nao foi possivel recuperar os itens da venda.");
  }

  for (const item of items as Array<{ id: string; product_id: string; quantity: number }>) {
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

  await supabase.from("sale_payments").delete().eq("sale_id", saleId);

  const { error: updateError } = await supabase
    .from("sales")
    .update({ status: "Cancelada", payment_status: "Cancelada", amount_paid: 0 })
    .eq("id", saleId);

  if (updateError) {
    throw new Error(`Erro ao cancelar venda: ${updateError.message}`);
  }

  revalidatePath("/vendas");
  revalidatePath("/dashboard");
  revalidatePath("/estoque");
  revalidatePath("/relatorios");
}
