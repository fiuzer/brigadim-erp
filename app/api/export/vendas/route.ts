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
  const produto = searchParams.get("produto");
  const categoria = searchParams.get("categoria");
  const pagamento = searchParams.get("pagamento");
  const usuario = searchParams.get("usuario");

  let query = supabase
    .from("sales")
    .select("id,sold_at,payment_method,total_amount,amount_paid,payment_status,customer_name,due_date,status,user_id")
    .order("sold_at", { ascending: false });

  if (inicio) query = query.gte("sold_at", `${inicio}T00:00:00`);
  if (fim) query = query.lte("sold_at", `${fim}T23:59:59`);
  if (pagamento && pagamento !== "todos") query = query.eq("payment_method", pagamento);
  if (usuario && usuario !== "todos") query = query.eq("user_id", usuario);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Falha ao exportar vendas." }, { status: 500 });
  }

  const sales = (data ?? []) as unknown as Array<{
    id: string;
    sold_at: string;
    payment_method: string;
    total_amount: number;
    amount_paid: number;
    payment_status: "Em aberto" | "Parcial" | "Pago" | "Cancelada";
    customer_name: string | null;
    due_date: string | null;
    status: string;
    user_id: string | null;
  }>;

  let filteredSales = sales;

  if ((produto && produto !== "todos") || (categoria && categoria !== "todos")) {
    const saleIds = sales.map((sale) => sale.id);

    if (saleIds.length > 0) {
      const { data: saleItems, error: saleItemsError } = await supabase
        .from("sale_items")
        .select("sale_id,product_id")
        .in("sale_id", saleIds);

      if (saleItemsError) {
        return NextResponse.json({ error: "Falha ao aplicar filtro de itens." }, { status: 500 });
      }

      const saleItemsRows = (saleItems ?? []) as Array<{ sale_id: string; product_id: string }>;
      let allowedProductIds: Set<string> | null = null;

      if (categoria && categoria !== "todos") {
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select("id,category_id");

        if (productsError) {
          return NextResponse.json(
            { error: "Falha ao aplicar filtro de categoria." },
            { status: 500 },
          );
        }

        const productsRows = (products ?? []) as Array<{ id: string; category_id: string | null }>;
        allowedProductIds = new Set(
          productsRows
            .filter((product) => product.category_id === categoria)
            .map((product) => product.id),
        );
      }

      const filteredSaleIds = new Set(
        saleItemsRows
          .filter((item) => {
            const matchesProduct = !produto || produto === "todos" || item.product_id === produto;
            const matchesCategory =
              !allowedProductIds || allowedProductIds.has(item.product_id);
            return matchesProduct && matchesCategory;
          })
          .map((item) => item.sale_id),
      );

      filteredSales = sales.filter((sale) => filteredSaleIds.has(sale.id));
    } else {
      filteredSales = [];
    }
  }

  const profileMap = await getProfileNameMap(
    supabase,
    filteredSales.map((sale) => sale.user_id),
  );

  const headers = [
    "ID",
    "Data",
    "Pagamento",
    "Valor Total",
    "Valor Recebido",
    "Em Aberto",
    "Status Pagamento",
    "Cliente",
    "Vencimento",
    "Status",
    "Usuario",
  ];
  const rows = filteredSales.map((sale) => [
    asCsvValue(sale.id),
    asCsvValue(sale.sold_at),
    asCsvValue(sale.payment_method),
    asCsvValue(sale.total_amount),
    asCsvValue(sale.amount_paid),
    asCsvValue(Math.max(Number(sale.total_amount || 0) - Number(sale.amount_paid || 0), 0)),
    asCsvValue(sale.payment_status),
    asCsvValue(sale.customer_name ?? ""),
    asCsvValue(sale.due_date ?? ""),
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
