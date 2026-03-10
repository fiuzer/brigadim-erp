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
    .from("sales")
    .select("id,sold_at,payment_method,total_amount,status,user_id")
    .order("sold_at", { ascending: false });

  if (inicio) query = query.gte("sold_at", `${inicio}T00:00:00`);
  if (fim) query = query.lte("sold_at", `${fim}T23:59:59`);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Falha ao exportar vendas." }, { status: 500 });
  }

  const sales = (data ?? []) as unknown as Array<{
    id: string;
    sold_at: string;
    payment_method: string;
    total_amount: number;
    status: string;
    user_id: string | null;
  }>;

  const profileMap = await getProfileNameMap(
    supabase,
    sales.map((sale) => sale.user_id),
  );

  const headers = ["ID", "Data", "Pagamento", "Valor Total", "Status", "Usuario"];
  const rows = sales.map((sale) => [
    asCsvValue(sale.id),
    asCsvValue(sale.sold_at),
    asCsvValue(sale.payment_method),
    asCsvValue(sale.total_amount),
    asCsvValue(sale.status),
    asCsvValue(profileFromMap(profileMap, sale.user_id)?.full_name ?? ""),
  ]);

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-vendas.csv"`,
    },
  });
}
