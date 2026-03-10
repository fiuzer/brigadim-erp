import { endOfDay, format, startOfMonth, subDays } from "date-fns";
import { requirePermission } from "@/features/auth/server";
import { PAYMENT_METHODS } from "@/lib/constants/options";
import { calcAverageTicket, calcGrossProfit, calcNetProfit } from "@/lib/utils/financial";
import { getProfileNameMap } from "@/lib/services/profile-names";
import type { DashboardAnalytics, DashboardFilterState } from "@/lib/types/dashboard";
import type { DashboardWidgetLayout } from "@/lib/types/app";

const ALL_VALUE = "todos";

function parseSavedFilters(input: unknown): DashboardFilterState | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;

  return {
    startDate: typeof value.startDate === "string" ? value.startDate : "",
    endDate: typeof value.endDate === "string" ? value.endDate : "",
    paymentMethod: typeof value.paymentMethod === "string" ? value.paymentMethod : ALL_VALUE,
    productId: typeof value.productId === "string" ? value.productId : ALL_VALUE,
    categoryName: typeof value.categoryName === "string" ? value.categoryName : ALL_VALUE,
    operatorId: typeof value.operatorId === "string" ? value.operatorId : ALL_VALUE,
  };
}

function resolveFilters(input: Partial<DashboardFilterState>, saved: DashboardFilterState | null) {
  const defaultStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const defaultEnd = format(endOfDay(new Date()), "yyyy-MM-dd");

  return {
    startDate: input.startDate || saved?.startDate || defaultStart,
    endDate: input.endDate || saved?.endDate || defaultEnd,
    paymentMethod: input.paymentMethod || saved?.paymentMethod || ALL_VALUE,
    productId: input.productId || saved?.productId || ALL_VALUE,
    categoryName: input.categoryName || saved?.categoryName || ALL_VALUE,
    operatorId: input.operatorId || saved?.operatorId || ALL_VALUE,
  };
}

export async function getDashboardData(
  inputFilters: Partial<DashboardFilterState>,
): Promise<DashboardAnalytics> {
  const { supabase, user } = await requirePermission("dashboard:read");

  const { data: rawLayout, error: layoutError } = await supabase
    .from("dashboard_layouts")
    .select("layout,default_filters")
    .eq("user_id", user.id)
    .maybeSingle();

  if (layoutError) {
    throw new Error(`Erro ao carregar layout do dashboard: ${layoutError.message}`);
  }

  const savedLayoutRow = (rawLayout ?? null) as unknown as {
    layout: unknown;
    default_filters: unknown;
  } | null;

  const savedFilters = parseSavedFilters(savedLayoutRow?.default_filters ?? null);
  const appliedFilters = resolveFilters(inputFilters, savedFilters);

  const [
    salesResult,
    saleItemsResult,
    expensesResult,
    lowStockResult,
    productsResult,
    categoriesResult,
    usersResult,
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("id,sold_at,payment_method,total_amount,status,user_id")
      .gte("sold_at", `${appliedFilters.startDate}T00:00:00`)
      .lte("sold_at", `${appliedFilters.endDate}T23:59:59`)
      .order("sold_at", { ascending: false }),
    supabase
      .from("sale_items")
      .select(
        "sale_id,product_id,quantity,unit_price,production_cost,total_amount,created_at,product:products(id,name,category:product_categories(name))",
      )
      .gte("created_at", `${appliedFilters.startDate}T00:00:00`)
      .lte("created_at", `${appliedFilters.endDate}T23:59:59`),
    supabase
      .from("expenses")
      .select("id,expense_date,description,amount,category:expense_categories(name)")
      .gte("expense_date", appliedFilters.startDate)
      .lte("expense_date", appliedFilters.endDate),
    supabase.from("v_low_stock_products").select("*").limit(20),
    supabase.from("products").select("id,name,stock_quantity,production_cost").order("name"),
    supabase.from("product_categories").select("name").order("name"),
    supabase.from("profiles").select("id,full_name,is_active").eq("is_active", true),
  ]);

  if (salesResult.error) throw new Error(`Erro ao carregar vendas do dashboard: ${salesResult.error.message}`);
  if (saleItemsResult.error) throw new Error(`Erro ao carregar itens do dashboard: ${saleItemsResult.error.message}`);
  if (expensesResult.error) throw new Error(`Erro ao carregar despesas do dashboard: ${expensesResult.error.message}`);
  if (lowStockResult.error) throw new Error(`Erro ao carregar estoque critico: ${lowStockResult.error.message}`);
  if (productsResult.error) throw new Error(`Erro ao carregar produtos: ${productsResult.error.message}`);
  if (categoriesResult.error) throw new Error(`Erro ao carregar categorias: ${categoriesResult.error.message}`);
  if (usersResult.error) throw new Error(`Erro ao carregar operadores: ${usersResult.error.message}`);

  const sales = (salesResult.data ?? []) as unknown as Array<{
    id: string;
    sold_at: string;
    payment_method: string;
    total_amount: number;
    status: "Ativa" | "Cancelada";
    user_id: string | null;
  }>;

  const saleItems = (saleItemsResult.data ?? []) as unknown as Array<{
    sale_id: string;
    product_id: string;
    quantity: number;
    production_cost: number;
    total_amount: number;
    created_at: string;
    product: { id: string; name: string; category: { name: string } | null } | null;
  }>;

  const expensesRows = (expensesResult.data ?? []) as unknown as Array<{
    id: string;
    expense_date: string;
    description: string;
    amount: number;
    category: { name: string } | null;
  }>;

  const lowStock = (lowStockResult.data ?? []) as unknown as Array<{
    product_id: string;
    product_name: string;
    stock_quantity: number;
    min_stock: number;
    category_name: string | null;
  }>;

  const products = (productsResult.data ?? []) as unknown as Array<{
    id: string;
    name: string;
    stock_quantity: number;
    production_cost: number;
  }>;

  const categoriesRows = (categoriesResult.data ?? []) as Array<{ name: string }>;
  const usersRows = (usersResult.data ?? []) as Array<{
    id: string;
    full_name: string | null;
    is_active: boolean;
  }>;

  const categoryNames = categoriesRows
    .map((item) => item.name)
    .filter(Boolean) as string[];

  const operators = usersRows
    .map((item) => ({ id: item.id, name: item.full_name ?? "Sem nome" }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const profileMap = await getProfileNameMap(
    supabase,
    sales.map((sale) => sale.user_id),
  );

  const saleById = new Map(sales.map((sale) => [sale.id, sale]));
  const activeSales = sales.filter((sale) => sale.status === "Ativa");
  const useItemScopedRevenue =
    appliedFilters.productId !== ALL_VALUE || appliedFilters.categoryName !== ALL_VALUE;

  const saleItemsByCatalogFilters = saleItems.filter((item) => {
    const matchesProduct =
      appliedFilters.productId === ALL_VALUE || item.product_id === appliedFilters.productId;
    const matchesCategory =
      appliedFilters.categoryName === ALL_VALUE ||
      (item.product?.category?.name ?? "Sem categoria") === appliedFilters.categoryName;
    return matchesProduct && matchesCategory;
  });

  const saleIdsByCatalogFilter = new Set(saleItemsByCatalogFilters.map((item) => item.sale_id));

  const filteredSales = activeSales.filter((sale) => {
    const matchesPayment =
      appliedFilters.paymentMethod === ALL_VALUE ||
      sale.payment_method === appliedFilters.paymentMethod;
    const matchesOperator =
      appliedFilters.operatorId === ALL_VALUE || sale.user_id === appliedFilters.operatorId;
    const matchesCatalog = useItemScopedRevenue ? saleIdsByCatalogFilter.has(sale.id) : true;

    return matchesPayment && matchesOperator && matchesCatalog;
  });

  const allowedSaleIds = new Set(filteredSales.map((sale) => sale.id));

  const saleItemsForMetrics = (useItemScopedRevenue ? saleItemsByCatalogFilters : saleItems).filter((item) =>
    allowedSaleIds.has(item.sale_id),
  );

  const revenue = useItemScopedRevenue
    ? saleItemsForMetrics.reduce((acc, item) => acc + Number(item.total_amount || 0), 0)
    : filteredSales.reduce((acc, sale) => acc + Number(sale.total_amount || 0), 0);

  const cogs = saleItemsForMetrics.reduce(
    (acc, item) => acc + Number(item.production_cost || 0) * Number(item.quantity || 0),
    0,
  );
  const expenses = expensesRows.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const grossProfit = calcGrossProfit(revenue, cogs);
  const netProfit = calcNetProfit(grossProfit, expenses);
  const averageTicket = calcAverageTicket({
    revenue,
    salesCount: filteredSales.length,
  });

  const todayString = new Date().toISOString().slice(0, 10);
  const todayRevenue = useItemScopedRevenue
    ? saleItemsForMetrics.reduce((acc, item) => {
        const parentSale = saleById.get(item.sale_id);
        if (!parentSale || !parentSale.sold_at.startsWith(todayString)) return acc;
        return acc + Number(item.total_amount || 0);
      }, 0)
    : filteredSales
        .filter((sale) => sale.sold_at.startsWith(todayString))
        .reduce((acc, sale) => acc + Number(sale.total_amount || 0), 0);

  const paymentBreakdownMap = saleItemsForMetrics.reduce<Record<string, number>>((acc, item) => {
    const parentSale = saleById.get(item.sale_id);
    if (!parentSale) return acc;
    acc[parentSale.payment_method] = (acc[parentSale.payment_method] || 0) + Number(item.total_amount || 0);
    return acc;
  }, {});

  const paymentBreakdown = Object.entries(paymentBreakdownMap).map(([name, value]) => ({
    name,
    value,
  }));

  const productSalesMap = saleItemsForMetrics.reduce<
    Record<string, { name: string; quantity: number; revenue: number; cogs: number }>
  >((acc, item) => {
    const key = item.product_id;
    const entry = acc[key] || {
      name: item.product?.name ?? "Produto",
      quantity: 0,
      revenue: 0,
      cogs: 0,
    };
    entry.quantity += Number(item.quantity || 0);
    entry.revenue += Number(item.total_amount || 0);
    entry.cogs += Number(item.production_cost || 0) * Number(item.quantity || 0);
    acc[key] = entry;
    return acc;
  }, {});

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 12)
    .map((item) => ({
      name: item.name,
      value: item.quantity,
    }));

  const mostProfitableProducts = Object.values(productSalesMap)
    .map((item) => ({
      name: item.name,
      grossProfit: item.revenue - item.cogs,
      margin: item.revenue > 0 ? ((item.revenue - item.cogs) / item.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.grossProfit - a.grossProfit)
    .slice(0, 12);

  const expensesByCategoryMap = expensesRows.reduce<Record<string, number>>((acc, item) => {
    const key = item.category?.name ?? "Sem categoria";
    acc[key] = (acc[key] || 0) + Number(item.amount || 0);
    return acc;
  }, {});
  const expensesByCategory = Object.entries(expensesByCategoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  const stockValue = products.reduce(
    (acc, product) => acc + Number(product.stock_quantity || 0) * Number(product.production_cost || 0),
    0,
  );

  const thirtyDaysAgo = subDays(new Date(), 30).toISOString().slice(0, 10);
  const productIdsWithMovement = new Set(
    saleItems
      .filter((item) => (item.created_at ? item.created_at >= `${thirtyDaysAgo}T00:00:00` : true))
      .map((item) => item.product_id),
  );
  const productsWithoutMovement = products.filter(
    (product) => !productIdsWithMovement.has(product.id),
  ).length;

  return {
    userId: user.id,
    savedLayout:
      (savedLayoutRow?.layout as unknown as DashboardWidgetLayout[] | null) ?? null,
    savedFilters,
    appliedFilters,
    filterOptions: {
      paymentMethods: PAYMENT_METHODS.map((method) => method.toString()),
      products: products.map((product) => ({ id: product.id, name: product.name })),
      categories: categoryNames,
      operators,
    },
    metrics: {
      revenueToday: todayRevenue,
      revenuePeriod: revenue,
      grossProfit,
      netProfit,
      averageTicket,
      salesCount: filteredSales.length,
      stockValue,
      lowStockCount: lowStock.length,
      productsWithoutMovement,
    },
    paymentBreakdown,
    topProducts,
    mostProfitableProducts,
    expensesByCategory,
    lowStockProducts: lowStock,
    salesDetailed: filteredSales.map((sale) => ({
      id: sale.id,
      sold_at: sale.sold_at,
      payment_method: sale.payment_method,
      total_amount: sale.total_amount,
      user_name: sale.user_id ? (profileMap.get(sale.user_id) ?? null) : null,
    })),
    expensesDetailed: expensesRows.map((expense) => ({
      id: expense.id,
      expense_date: expense.expense_date,
      description: expense.description,
      amount: expense.amount,
      category_name: expense.category?.name ?? null,
    })),
  };
}
