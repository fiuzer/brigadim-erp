import { AlertTriangle, CircleDollarSign, PackageSearch, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { DashboardBuilder } from "@/components/dashboard/dashboard-builder";
import { getDashboardData } from "@/features/dashboard-builder/queries";
import { DEFAULT_DASHBOARD_LAYOUT } from "@/features/dashboard-builder/default-layout";
import type { DashboardWidgetLayout } from "@/lib/types/app";
import { formatCurrencyBRL } from "@/lib/utils/format";

type DashboardPageProps = {
  searchParams: Promise<{
    inicio?: string;
    fim?: string;
    pagamento?: string;
    produto?: string;
    categoria?: string;
    operador?: string;
  }>;
};

function parseLayout(input: unknown): DashboardWidgetLayout[] {
  if (!Array.isArray(input)) return DEFAULT_DASHBOARD_LAYOUT;

  const parsed = input.filter(
    (item): item is DashboardWidgetLayout =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "type" in item &&
      "title" in item &&
      "colSpan" in item &&
      "rowSpan" in item,
  );

  return parsed.length ? parsed : DEFAULT_DASHBOARD_LAYOUT;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;

  const analytics = await getDashboardData({
    startDate: params.inicio,
    endDate: params.fim,
    paymentMethod: params.pagamento,
    productId: params.produto,
    categoryName: params.categoria,
    operatorId: params.operador,
  });

  const persistedLayout = parseLayout(analytics.savedLayout);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visao estrategica da operacao com widgets editaveis e drilldowns."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Faturamento do Periodo"
          value={formatCurrencyBRL(analytics.metrics.revenuePeriod)}
          subtitle={`${analytics.metrics.salesCount} vendas ativas`}
          icon={CircleDollarSign}
          tone="positive"
        />
        <KpiCard
          title="Lucro Liquido"
          value={formatCurrencyBRL(analytics.metrics.netProfit)}
          subtitle="Receita - custos - despesas"
          icon={ShoppingBag}
          tone={analytics.metrics.netProfit > 0 ? "positive" : "warning"}
        />
        <KpiCard
          title="Estoque Critico"
          value={String(analytics.metrics.lowStockCount)}
          subtitle="Produtos abaixo do minimo"
          icon={AlertTriangle}
          tone={analytics.metrics.lowStockCount > 0 ? "warning" : "default"}
        />
        <KpiCard
          title="Produtos sem Giro"
          value={String(analytics.metrics.productsWithoutMovement)}
          subtitle="Sem venda recente"
          icon={PackageSearch}
        />
      </section>

      <DashboardBuilder
        userId={analytics.userId}
        initialLayout={persistedLayout}
        analytics={analytics}
        initialFilters={analytics.appliedFilters}
      />
    </div>
  );
}
