"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/features/auth/server";
import type { ExpenseFormValues } from "@/lib/validators/expense";

function normalize(input: ExpenseFormValues) {
  return {
    expense_date: input.expense_date,
    category_id: input.category_id || null,
    description: input.description,
    amount: input.amount,
    notes: input.notes || null,
  };
}

export async function createExpenseAction(input: ExpenseFormValues) {
  const { supabase, user } = await requirePermission("expenses:write");
  const { error } = await supabase.from("expenses").insert({
    ...normalize(input),
    user_id: user.id,
  });

  if (error) {
    throw new Error(`Erro ao cadastrar despesa: ${error.message}`);
  }

  revalidatePath("/despesas");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");
}

export async function updateExpenseAction(input: ExpenseFormValues) {
  if (!input.id) {
    throw new Error("ID da despesa é obrigatório.");
  }

  const { supabase } = await requirePermission("expenses:write");
  const { error } = await supabase.from("expenses").update(normalize(input)).eq("id", input.id);

  if (error) {
    throw new Error(`Erro ao atualizar despesa: ${error.message}`);
  }

  revalidatePath("/despesas");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");
}

export async function deleteExpenseAction(id: string) {
  const { supabase } = await requirePermission("expenses:write");
  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) {
    throw new Error(`Erro ao excluir despesa: ${error.message}`);
  }

  revalidatePath("/despesas");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");
}
