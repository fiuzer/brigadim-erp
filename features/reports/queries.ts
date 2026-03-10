import { requirePermission } from "@/features/auth/server";

type ProductCategory = {
  id: string;
  name: string;
};

type ExpenseCategory = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  category_id: string | null;
};

type Sale = {
  id: string;
  sold_at: string;
  payment_method: string;
  total_amount: number;
  status: "Ativa" | "Cancelada";
  user_id: string | null;
};

type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  production_cost: number;
  total_amount: number;
};

type Expense = {
  id: string;
  expense_date: string;
  description: string;
  amount: number;
  user_id: string | null;
  category_id: string | null;
};

type ProfileOption = {
  id: string;
  full_name: string | null;
};

type EnrichedSale = {
  id: string;
  sold_at: string;
  payment_method: string;
  total_amount: number;
  status: "Ativa" | "Cancelada";
  user_id: string | null;
  profile: { full_name: string | null } | null;
  sale_items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    production_cost: number;
    total_amount: number;
    product: { id: string; name: string; category: ProductCategory | null } | null;
  }>;
};

type EnrichedExpense = {
  id: string;
  expense_date: string;
  description: string;
  amount: number;
  user_id: string | null;
  profile: { full_name: string | null } | null;
  category: ExpenseCategory | null;
};

export type ReportFilters = {
  startDate: string;
  endDate: string;
  productId?: string;
  categoryId?: string;
  expenseCategoryId?: string;
  paymentMethod?: string;
  userId?: string;
};

function normalizeFilter(value?: string | null) {
  if (!value || value === "todos") return undefined;
  return value;
}

export async function getReportsData(filters: ReportFilters) {
  const { supabase } = await requirePermission("reports:read");
  const paymentMethod = normalizeFilter(filters.paymentMethod);
  const productId = normalizeFilter(filters.productId);
  const categoryId = normalizeFilter(filters.categoryId);
  const expenseCategoryId = normalizeFilter(filters.expenseCategoryId);
  const userId = normalizeFilter(filters.userId);

  let salesQuery = supabase
    .from("sales")
    .select("id,sold_at,payment_method,total_amount,status,user_id")
    .gte("sold_at", `${filters.startDate}T00:00:00`)
    .lte("sold_at", `${filters.endDate}T23:59:59`)
    .order("sold_at", { ascending: false });

  if (paymentMethod) salesQuery = salesQuery.eq("payment_method", paymentMethod);
  if (userId) salesQuery = salesQuery.eq("user_id", userId);

  let expensesQuery = supabase
    .from("expenses")
    .select("id,expense_date,description,amount,user_id,category_id")
    .gte("expense_date", filters.startDate)
    .lte("expense_date", filters.endDate)
    .order("expense_date", { ascending: false });

  if (userId) expensesQuery = expensesQuery.eq("user_id", userId);
  if (expenseCategoryId) expensesQuery = expensesQuery.eq("category_id", expenseCategoryId);

  const [
    salesResult,
    expensesResult,
    productsResult,
    productCategoriesResult,
    expenseCategoriesResult,
    usersResult,
  ] = await Promise.all([
    salesQuery,
    expensesQuery,
    supabase.from("products").select("id,name,category_id").order("name", { ascending: true }),
    supabase.from("product_categories").select("id,name").order("name", { ascending: true }),
    supabase.from("expense_categories").select("id,name").order("name", { ascending: true }),
    supabase.from("profiles").select("id,full_name").order("full_name", { ascending: true }),
  ]);

  if (salesResult.error) {
    throw new Error(`Erro ao carregar relatorio de vendas: ${salesResult.error.message}`);
  }
  if (expensesResult.error) {
    throw new Error(`Erro ao carregar relatorio de despesas: ${expensesResult.error.message}`);
  }
  if (productsResult.error) {
    throw new Error(`Erro ao carregar produtos para filtro: ${productsResult.error.message}`);
  }
  if (productCategoriesResult.error) {
    throw new Error(
      `Erro ao carregar categorias de produtos para filtro: ${productCategoriesResult.error.message}`,
    );
  }
  if (expenseCategoriesResult.error) {
    throw new Error(
      `Erro ao carregar categorias de despesas para filtro: ${expenseCategoriesResult.error.message}`,
    );
  }
  if (usersResult.error) {
    throw new Error(`Erro ao carregar usuarios para filtro: ${usersResult.error.message}`);
  }

  const salesRows = (salesResult.data ?? []) as unknown as Sale[];
  const expenseRows = (expensesResult.data ?? []) as unknown as Expense[];
  const productsRows = (productsResult.data ?? []) as unknown as Product[];
  const productCategoriesRows = (productCategoriesResult.data ?? []) as unknown as ProductCategory[];
  const expenseCategoriesRows = (expenseCategoriesResult.data ?? []) as unknown as ExpenseCategory[];
  const usersRows = (usersResult.data ?? []) as unknown as ProfileOption[];

  const saleIds = salesRows.map((sale) => sale.id);
  let saleItemsRows: SaleItem[] = [];

  if (saleIds.length > 0) {
    const saleItemsResult = await supabase
      .from("sale_items")
      .select("id,sale_id,product_id,quantity,production_cost,total_amount")
      .in("sale_id", saleIds);

    if (saleItemsResult.error) {
      throw new Error(`Erro ao carregar itens das vendas: ${saleItemsResult.error.message}`);
    }

    saleItemsRows = (saleItemsResult.data ?? []) as unknown as SaleItem[];
  }

  const productCategoryById = new Map(productCategoriesRows.map((category) => [category.id, category]));
  const expenseCategoryById = new Map(expenseCategoriesRows.map((category) => [category.id, category]));
  const productById = new Map(productsRows.map((product) => [product.id, product]));
  const userById = new Map(usersRows.map((profile) => [profile.id, profile.full_name]));

  const saleItemsBySaleId = new Map<EnrichedSale["id"], EnrichedSale["sale_items"]>();
  for (const item of saleItemsRows) {
    const product = productById.get(item.product_id);
    const category = product?.category_id ? productCategoryById.get(product.category_id) ?? null : null;
    const target = saleItemsBySaleId.get(item.sale_id) ?? [];
    target.push({
      id: item.id,
      product_id: item.product_id,
      quantity: Number(item.quantity || 0),
      production_cost: Number(item.production_cost || 0),
      total_amount: Number(item.total_amount || 0),
      product: product
        ? {
            id: product.id,
            name: product.name,
            category,
          }
        : null,
    });
    saleItemsBySaleId.set(item.sale_id, target);
  }

  const enrichedSales: EnrichedSale[] = salesRows.map((sale) => ({
    id: sale.id,
    sold_at: sale.sold_at,
    payment_method: sale.payment_method,
    total_amount: Number(sale.total_amount || 0),
    status: sale.status,
    user_id: sale.user_id,
    profile: sale.user_id ? { full_name: userById.get(sale.user_id) ?? null } : null,
    sale_items: saleItemsBySaleId.get(sale.id) ?? [],
  }));

  const enrichedExpenses: EnrichedExpense[] = expenseRows.map((expense) => ({
    id: expense.id,
    expense_date: expense.expense_date,
    description: expense.description,
    amount: Number(expense.amount || 0),
    user_id: expense.user_id,
    profile: expense.user_id ? { full_name: userById.get(expense.user_id) ?? null } : null,
    category: expense.category_id ? expenseCategoryById.get(expense.category_id) ?? null : null,
  }));

  const filteredSales = enrichedSales.filter((sale) => {
    if (sale.status !== "Ativa") return false;
    if (paymentMethod && sale.payment_method !== paymentMethod) return false;
    if (userId && sale.user_id !== userId) return false;
    if (productId && !sale.sale_items.some((item) => item.product_id === productId)) return false;
    if (
      categoryId &&
      !sale.sale_items.some((item) => item.product?.category?.id === categoryId)
    ) {
      return false;
    }
    return true;
  });

  const filteredExpenses = enrichedExpenses.filter((expense) => {
    if (userId && expense.user_id !== userId) return false;
    if (expenseCategoryId && expense.category?.id !== expenseCategoryId) return false;
    return true;
  });

  const revenue = filteredSales.reduce((acc, sale) => acc + sale.total_amount, 0);
  const cogs = filteredSales.reduce(
    (acc, sale) =>
      acc +
      sale.sale_items.reduce((sum, item) => {
        return sum + item.production_cost * item.quantity;
      }, 0),
    0,
  );
  const expenses = filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0);
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - expenses;
  const averageTicket = filteredSales.length > 0 ? revenue / filteredSales.length : 0;

  const salesByPayment = filteredSales.reduce<Record<string, number>>((acc, sale) => {
    acc[sale.payment_method] = (acc[sale.payment_method] ?? 0) + sale.total_amount;
    return acc;
  }, {});

  const salesByProduct = filteredSales
    .flatMap((sale) => sale.sale_items)
    .reduce<Record<string, { name: string; qty: number; revenue: number; grossProfit: number }>>(
      (acc, item) => {
        const key = item.product_id;
        const target = acc[key] ?? {
          name: item.product?.name ?? "Produto removido",
          qty: 0,
          revenue: 0,
          grossProfit: 0,
        };
        target.qty += item.quantity;
        target.revenue += item.total_amount;
        target.grossProfit += item.total_amount - item.production_cost * item.quantity;
        acc[key] = target;
        return acc;
      },
      {},
    );

  const expensesByCategory = filteredExpenses.reduce<Record<string, number>>((acc, expense) => {
    const name = expense.category?.name ?? "Sem categoria";
    acc[name] = (acc[name] ?? 0) + expense.amount;
    return acc;
  }, {});

  return {
    filtersData: {
      products: productsRows.map((product) => ({ id: product.id, name: product.name })),
      categories: productCategoriesRows.map((category) => ({ id: category.id, name: category.name })),
      expenseCategories: expenseCategoriesRows.map((category) => ({
        id: category.id,
        name: category.name,
      })),
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
        .map(([id, value]) => ({ id, ...value }))
        .sort((a, b) => b.revenue - a.revenue),
      expensesByCategory: Object.entries(expensesByCategory).map(([name, value]) => ({
        name,
        value: Number(value),
      })),
    },
  };
}
