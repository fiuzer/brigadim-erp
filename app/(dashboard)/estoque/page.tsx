import { AlertTriangle, Boxes, ClipboardList, PackageCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { InventoryMovementForm } from "@/components/forms/inventory-movement-form";
import { MovementHistoryTable, StockOverviewTable } from "@/features/inventory/inventory-tables";
import { getInventoryPageData } from "@/features/inventory/queries";
import { getProfileOrRedirect } from "@/features/auth/server";
import { hasPermission } from "@/lib/constants/roles";
import { formatCurrencyBRL } from "@/lib/utils/format";

export default async function EstoquePage() {
  const [{ products, movements }, { profile }] = await Promise.all([
    getInventoryPageData(),
    getProfileOrRedirect(),
  ]);

  const canWrite = hasPermission(profile.role, "inventory:write");
  const lowStockCount = products.filter((product) => product.stock_quantity <= product.min_stock).length;
  const totalStockValue = products.reduce(
    (acc, item) => acc + Number(item.production_cost || 0) * Number(item.stock_quantity || 0),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque"
        description="Controle entradas, saídas e ajustes com rastreabilidade por usuário."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Itens em Estoque" value={String(products.length)} subtitle="Produtos monitorados" icon={Boxes} />
        <KpiCard
          title="Estoque Crítico"
          value={String(lowStockCount)}
          subtitle="Abaixo do mínimo definido"
          icon={AlertTriangle}
          tone={lowStockCount > 0 ? "warning" : "default"}
        />
        <KpiCard
          title="Valor Total em Estoque"
          value={formatCurrencyBRL(totalStockValue)}
          subtitle="Soma por custo de produção"
          icon={PackageCheck}
        />
        <KpiCard
          title="Movimentações Recentes"
          value={String(movements.length)}
          subtitle="Últimos lançamentos"
          icon={ClipboardList}
        />
      </section>

      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base">Nova Movimentação</CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryMovementForm
            products={products.map((product) => ({ id: product.id, name: product.name }))}
            disabled={!canWrite}
          />
          {!canWrite ? (
            <p className="mt-3 text-xs text-rose-700">
              Seu perfil possui permissão de leitura. Somente usuários com acesso de estoque podem registrar movimentações.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Visão Atual do Estoque</h2>
        <StockOverviewTable data={products} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Histórico de Movimentações</h2>
        <MovementHistoryTable data={movements} />
      </section>
    </div>
  );
}

