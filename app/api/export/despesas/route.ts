import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/services/api-auth";
import { getProfileNameMap, profileFromMap } from "@/lib/services/profile-names";

function asCsvValue(input: string | number | null | undefined) {
  const value = String(input ?? "");
  return `"${value.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const auth = await requireApiPermission("reports:read");
  if ("error" in auth) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");

  let query = supabase
    .from("expenses")
    .select("id,expense_date,description,amount,user_id,category:expense_categories(name)")
    .order("expense_date", { ascending: false });

  if (inicio) query = query.gte("expense_date", inicio);
  if (fim) query = query.lte("expense_date", fim);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Falha ao exportar despesas." }, { status: 500 });
  }

  const expenses = (data ?? []) as unknown as Array<{
    id: string;
    expense_date: string;
    description: string;
    amount: number;
    user_id: string | null;
    category: { name: string } | null;
  }>;

  const profileMap = await getProfileNameMap(
    supabase,
    expenses.map((expense) => expense.user_id),
  );

  const headers = ["ID", "Data", "Descricao", "Categoria", "Valor", "Usuario"];
  const rows = expenses.map((expense) => [
    asCsvValue(expense.id),
    asCsvValue(expense.expense_date),
    asCsvValue(expense.description),
    asCsvValue(expense.category?.name ?? ""),
    asCsvValue(expense.amount),
    asCsvValue(profileFromMap(profileMap, expense.user_id)?.full_name ?? ""),
  ]);

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-despesas.csv"`,
    },
  });
}
