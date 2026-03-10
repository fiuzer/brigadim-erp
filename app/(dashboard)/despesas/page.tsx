import { CircleDollarSign, Landmark, Tag, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { ExpenseFormDialog } from "@/components/forms/expense-form-dialog";
import { getExpensesPageData } from "@/features/expenses/queries";
import { ExpensesByCategoryChart } from "@/features/expenses/expenses-chart";
import { ExpensesTable } from "@/features/expenses/expenses-table";
import { getProfileOrRedirect } from "@/features/auth/server";
import { hasPermission } from "@/lib/constants/roles";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { getYearMonthValueInTimeZone } from "@/lib/utils/timezone";

export default async function DespesasPage() {
  const [{ expenses, categories }, { profile }] = await Promise.all([
    getExpensesPageData(),
    getProfileOrRedirect(),
  ]);

  const canWrite = hasPermission(profile.role, "expenses:write");
  const total = expenses.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const avg = expenses.length > 0 ? total / expenses.length : 0;
  const currentMonth = getYearMonthValueInTimeZone();
  const monthly = expenses
    .filter((item) => item.expense_date.startsWith(currentMonth))
    .reduce((acc, item) => acc + Number(item.amount || 0), 0);

  const byCategoryMap = expenses.reduce<Record<string, number>>((acc, item) => {
    const categoryName = item.category?.name ?? "Sem categoria";
    acc[categoryName] = (acc[categoryName] || 0) + Number(item.amount || 0);
    return acc;
  }, {});

  const byCategory = Object.entries(byCategoryMap).map(([category, amount]) => ({
    category,
    total: amount,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Despesas"
        description="Gerencie gastos operacionais e acompanhe impacto financeiro por categoria."
        action={canWrite ? <ExpenseFormDialog categories={categories} /> : null}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total de Despesas" value={formatCurrencyBRL(total)} subtitle="Período carregado" icon={CircleDollarSign} tone="warning" />
        <KpiCard title="Despesas no Mês" value={formatCurrencyBRL(monthly)} subtitle="Competência atual" icon={Landmark} tone="warning" />
        <KpiCard title="Despesa Média" value={formatCurrencyBRL(avg)} subtitle="Média por lançamento" icon={TrendingDown} />
        <KpiCard title="Categorias Ativas" value={String(byCategory.length)} subtitle="Com movimentação" icon={Tag} />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
        <ExpensesByCategoryChart data={byCategory} />
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Lançamentos</h2>
          <ExpensesTable expenses={expenses} categories={categories} canWrite={canWrite} />
        </div>
      </div>
    </div>
  );
}
