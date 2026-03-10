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
  const categoriaDespesa = searchParams.get("categoriaDespesa");
  const usuario = searchParams.get("usuario");

  let query = supabase
    .from("expenses")
    .select("id,expense_date,description,amount,user_id,category_id")
    .order("expense_date", { ascending: false });

  if (inicio) query = query.gte("expense_date", inicio);
  if (fim) query = query.lte("expense_date", fim);
  if (categoriaDespesa && categoriaDespesa !== "todos") query = query.eq("category_id", categoriaDespesa);
  if (usuario && usuario !== "todos") query = query.eq("user_id", usuario);

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
    category_id: string | null;
  }>;

  const categoryIds = Array.from(
    new Set(
      expenses
        .map((expense) => expense.category_id)
        .filter((categoryId): categoryId is string => Boolean(categoryId)),
    ),
  );

  const categoryMap = new Map<string, string>();
  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from("expense_categories")
      .select("id,name")
      .in("id", categoryIds);

    for (const category of categories ?? []) {
      categoryMap.set(category.id, category.name);
    }
  }

  const profileMap = await getProfileNameMap(
    supabase,
    expenses.map((expense) => expense.user_id),
  );

  const headers = ["ID", "Data", "Descricao", "Categoria", "Valor", "Usuario"];
  const rows = expenses.map((expense) => [
    asCsvValue(expense.id),
    asCsvValue(expense.expense_date),
    asCsvValue(expense.description),
    asCsvValue(expense.category_id ? categoryMap.get(expense.category_id) ?? "" : ""),
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
