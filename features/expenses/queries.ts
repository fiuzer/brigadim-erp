import { requirePermission } from "@/features/auth/server";
import { getProfileNameMap, profileFromMap } from "@/lib/services/profile-names";

type ExpenseCategory = {
  id: string;
  name: string;
};

type ExpenseProfile = {
  full_name: string | null;
};

export type ExpenseQueryRow = {
  id: string;
  expense_date: string;
  description: string;
  amount: number;
  notes: string | null;
  user_id: string | null;
  category: ExpenseCategory | null;
  profile: ExpenseProfile | null;
};

export async function getExpensesPageData() {
  const { supabase } = await requirePermission("expenses:read");

  const [expensesResult, categoriesResult] = await Promise.all([
    supabase
      .from("expenses")
      .select("*, category:expense_categories(id,name)")
      .order("expense_date", { ascending: false }),
    supabase.from("expense_categories").select("*").order("name", { ascending: true }),
  ]);

  if (expensesResult.error) {
    throw new Error(`Erro ao carregar despesas: ${expensesResult.error.message}`);
  }

  if (categoriesResult.error) {
    throw new Error(`Erro ao carregar categorias: ${categoriesResult.error.message}`);
  }

  const expenseRows = (expensesResult.data ?? []) as unknown as Array<{
    id: string;
    expense_date: string;
    description: string;
    amount: number;
    notes: string | null;
    user_id: string | null;
    category: ExpenseCategory | null;
  }>;

  const profileMap = await getProfileNameMap(
    supabase,
    expenseRows.map((expense) => expense.user_id),
  );

  const expenses = expenseRows.map((expense) => ({
    ...expense,
    profile: profileFromMap(profileMap, expense.user_id),
  }));

  return {
    expenses: expenses as ExpenseQueryRow[],
    categories: categoriesResult.data ?? [],
  };
}
