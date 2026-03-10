import { CircleDollarSign, CreditCard, Receipt, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { SaleFormDialog } from "@/components/forms/sale-form-dialog";
import { SalesTable } from "@/features/sales/sales-table";
import { getSalesPageData } from "@/features/sales/queries";
import { getProfileOrRedirect } from "@/features/auth/server";
import { hasPermission } from "@/lib/constants/roles";
import { formatCurrencyBRL } from "@/lib/utils/format";

export default async function VendasPage() {
  const [{ sales, products }, { profile }] = await Promise.all([
    getSalesPageData(),
    getProfileOrRedirect(),
  ]);

  const canWrite = hasPermission(profile.role, "sales:write");
  const activeSales = sales.filter((sale) => sale.status === "Ativa");
  const revenue = activeSales.reduce((acc, sale) => acc + Number(sale.total_amount || 0), 0);
  const averageTicket = activeSales.length > 0 ? revenue / activeSales.length : 0;
  const pixCount = activeSales.filter((sale) => sale.payment_method === "Pix").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendas"
        description="Registre vendas com múltiplos itens, controle de pagamento e baixa automática de estoque."
        action={<SaleFormDialog products={products} disabled={!canWrite} />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Vendas Ativas" value={String(activeSales.length)} subtitle="Registros não cancelados" icon={ShoppingBag} />
        <KpiCard title="Faturamento" value={formatCurrencyBRL(revenue)} subtitle="Período carregado" icon={CircleDollarSign} tone="positive" />
        <KpiCard title="Ticket Médio" value={formatCurrencyBRL(averageTicket)} subtitle="Faturamento / vendas" icon={Receipt} />
        <KpiCard title="Pagamentos via Pix" value={String(pixCount)} subtitle="Volume por forma de pagamento" icon={CreditCard} />
      </section>

      <SalesTable sales={sales} canWrite={canWrite} />
    </div>
  );
}
