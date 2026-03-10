/* eslint-disable @typescript-eslint/no-explicit-any */
import { requirePermission } from "@/features/auth/server";
import { getProfileNameMap, profileFromMap } from "@/lib/services/profile-names";

export type ReportFilters = {
  startDate: string;
  endDate: string;
  productId?: string;
  categoryId?: string;
  paymentMethod?: string;
  userId?: string;
};

export async function getReportsData(filters: ReportFilters) {
  const { supabase } = await requirePermission("reports:read");

  const [salesResult, expensesResult, productsResult, categoriesResult, usersResult] =
    await Promise.all([
      supabase
        .from("sales")
        .select(
          "id,sold_at,payment_method,total_amount,status,user_id,sale_items(*, product:products(id,name,category:product_categories(id,name)))",
        )
        .gte("sold_at", `${filters.startDate}T00:00:00`)
        .lte("sold_at", `${filters.endDate}T23:59:59`)
        .order("sold_at", { ascending: false }),
      supabase
        .from("expenses")
        .select("id,expense_date,description,amount,user_id,category:expense_categories(id,name)")
        .gte("expense_date", filters.startDate)
        .lte("expense_date", filters.endDate),
      supabase.from("products").select("id,name").order("name", { ascending: true }),
      supabase
        .from("product_categories")
        .select("id,name")
        .order("name", { ascending: true }),
      supabase.from("profiles").select("id,full_name").order("full_name", { ascending: true }),
    ]);

  if (salesResult.error) throw new Error(`Erro ao carregar relatorio de vendas: ${salesResult.error.message}`);
  if (expensesResult.error) throw new Error(`Erro ao carregar relatorio de despesas: ${expensesResult.error.message}`);
  if (productsResult.error) throw new Error(`Erro ao carregar produtos para filtro: ${productsResult.error.message}`);
  if (categoriesResult.error) throw new Error(`Erro ao carregar categorias para filtro: ${categoriesResult.error.message}`);
  if (usersResult.error) throw new Error(`Erro ao carregar usuarios para filtro: ${usersResult.error.message}`);

  const salesBase = (salesResult.data ?? []) as any[];
  const expenseBase = (expensesResult.data ?? []) as any[];
  const productsRows = (productsResult.data ?? []) as any[];
  const categoriesRows = (categoriesResult.data ?? []) as any[];
  const usersRows = (usersResult.data ?? []) as any[];

  const profileMap = await getProfileNameMap(
    supabase,
    [...salesBase.map((sale) => sale.user_id), ...expenseBase.map((expense) => expense.user_id)],
  );

  const salesRows = salesBase.map((sale) => ({
    ...sale,
    profile: profileFromMap(profileMap, sale.user_id),
  }));
  const expenseRows = expenseBase.map((expense) => ({
    ...expense,
    profile: profileFromMap(profileMap, expense.user_id),
  }));

  const activeSales = salesRows.filter((sale) => sale.status === "Ativa");

  const filteredSales = activeSales.filter((sale: any) => {
    if (filters.paymentMethod && sale.payment_method !== filters.paymentMethod) return false;
    if (filters.userId && sale.user_id !== filters.userId) return false;
    if (filters.productId) {
      const hasProduct = sale.sale_items.some((item: any) => item.product_id === filters.productId);
      if (!hasProduct) return false;
    }
    if (filters.categoryId) {
      const hasCategory = sale.sale_items.some(
        (item: any) => item.product?.category?.id === filters.categoryId,
      );
      if (!hasCategory) return false;
    }
    return true;
  });

  const filteredExpenses = expenseRows.filter((expense: any) => {
    if (filters.userId && expense.user_id !== filters.userId) return false;
    return true;
  });

  const revenue = filteredSales.reduce((acc, sale) => acc + Number(sale.total_amount || 0), 0);
  const cogs = filteredSales.reduce(
    (acc, sale) =>
      acc +
      sale.sale_items.reduce(
        (sum: number, item: any) => sum + Number(item.production_cost || 0) * Number(item.quantity || 0),
        0,
      ),
    0,
  );
  const expenses = filteredExpenses.reduce((acc, expense) => acc + Number(expense.amount || 0), 0);
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - expenses;
  const averageTicket = filteredSales.length > 0 ? revenue / filteredSales.length : 0;

  const salesByPayment = filteredSales.reduce<Record<string, number>>((acc, sale: any) => {
    acc[sale.payment_method] = (acc[sale.payment_method] || 0) + Number(sale.total_amount || 0);
    return acc;
  }, {});

  const salesByProduct = filteredSales
    .flatMap((sale) => sale.sale_items)
    .reduce<Record<string, { name: string; qty: number; revenue: number; grossProfit: number }>>(
      (acc, item: any) => {
        const key = item.product_id;
        const target = acc[key] || {
          name: item.product?.name ?? "Produto",
          qty: 0,
          revenue: 0,
          grossProfit: 0,
        };
        target.qty += Number(item.quantity || 0);
        target.revenue += Number(item.total_amount || 0);
        target.grossProfit +=
          Number(item.total_amount || 0) - Number(item.production_cost || 0) * Number(item.quantity || 0);
        acc[key] = target;
        return acc;
      },
      {},
    );

  const expensesByCategory = filteredExpenses.reduce<Record<string, number>>((acc, expense: any) => {
    const category = expense.category?.name ?? "Sem categoria";
    acc[category] = (acc[category] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});

  return {
    filtersData: {
      products: productsRows,
      categories: categoriesRows,
      users: usersRows,
    },
    report: {
      sales: filteredSales,
      expenses: filteredExpenses,
      kpis: {
        revenue,
        expenses,
        grossProfit,
        netProfit,
        averageTicket,
        salesCount: filteredSales.length,
      },
      salesByPayment: Object.entries(salesByPayment).map(([name, value]) => ({
        name,
        value: Number(value),
      })),
      salesByProduct: Object.entries(salesByProduct)
        .map(([id, value]) => ({
          id,
          ...value,
        }))
        .sort((a, b) => b.revenue - a.revenue),
      expensesByCategory: Object.entries(expensesByCategory).map(([name, value]) => ({
        name,
        value: Number(value),
      })),
    },
  };
}
