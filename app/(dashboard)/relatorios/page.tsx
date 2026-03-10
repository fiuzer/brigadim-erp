import { FileSpreadsheet, FileText, LineChart, Wallet } from "lucide-react";
import Link from "next/link";
import { endOfDay, format, startOfMonth } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { buttonVariants } from "@/components/ui/button";
import { ReportFilters } from "@/features/reports/report-filters";
import { ReportsOverview } from "@/features/reports/reports-overview";
import { getReportsData } from "@/features/reports/queries";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

type ReportsPageProps = {
  searchParams: Promise<{
    inicio?: string;
    fim?: string;
    produto?: string;
    categoria?: string;
    pagamento?: string;
    usuario?: string;
  }>;
};

export default async function RelatoriosPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const startDate = params.inicio ?? format(startOfMonth(new Date()), "yyyy-MM-dd");
  const endDate = params.fim ?? format(endOfDay(new Date()), "yyyy-MM-dd");

  const { filtersData, report } = await getReportsData({
    startDate,
    endDate,
    productId: params.produto,
    categoryId: params.categoria,
    paymentMethod: params.pagamento,
    userId: params.usuario,
  });

  const query = new URLSearchParams({
    inicio: startDate,
    fim: endDate,
    ...(params.produto ? { produto: params.produto } : {}),
    ...(params.categoria ? { categoria: params.categoria } : {}),
    ...(params.pagamento ? { pagamento: params.pagamento } : {}),
    ...(params.usuario ? { usuario: params.usuario } : {}),
  }).toString();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatorios"
        description="Analise consolidada de vendas, despesas e lucratividade com filtros interativos."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/api/export/vendas?${query}`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <FileText className="h-4 w-4" />
              Exportar CSV (Vendas)
            </Link>
            <Link href={`/api/export/despesas?${query}`} className={cn(buttonVariants())}>
              <FileSpreadsheet className="h-4 w-4" />
              Exportar CSV (Despesas)
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Faturamento"
          value={formatCurrencyBRL(report.kpis.revenue)}
          subtitle={`${report.kpis.salesCount} vendas`}
          icon={LineChart}
          tone="positive"
        />
        <KpiCard
          title="Despesas"
          value={formatCurrencyBRL(report.kpis.expenses)}
          subtitle="No periodo filtrado"
          icon={Wallet}
          tone="warning"
        />
        <KpiCard
          title="Lucro Bruto"
          value={formatCurrencyBRL(report.kpis.grossProfit)}
          subtitle="Receita - custo dos produtos"
          icon={LineChart}
        />
        <KpiCard
          title="Lucro Liquido"
          value={formatCurrencyBRL(report.kpis.netProfit)}
          subtitle="Apos despesas operacionais"
          icon={Wallet}
        />
      </section>

      <ReportFilters
        startDate={startDate}
        endDate={endDate}
        productId={params.produto}
        categoryId={params.categoria}
        paymentMethod={params.pagamento}
        userId={params.usuario}
        products={filtersData.products}
        categories={filtersData.categories}
        users={filtersData.users}
      />

      <ReportsOverview report={report} />
    </div>
  );
}
