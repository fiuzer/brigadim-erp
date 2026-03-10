import { AlertTriangle, Box, CircleDollarSign, PackagePlus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { ProductFormDialog } from "@/components/forms/product-form-dialog";
import { ProductsTable } from "@/features/products/products-table";
import { getProductsPageData } from "@/features/products/queries";
import { getProfileOrRedirect } from "@/features/auth/server";
import { hasPermission } from "@/lib/constants/roles";
import { formatCurrencyBRL } from "@/lib/utils/format";

export default async function ProdutosPage() {
  const [{ products, categories }, { profile }] = await Promise.all([
    getProductsPageData(),
    getProfileOrRedirect(),
  ]);

  const canWrite = hasPermission(profile.role, "products:write");
  const totalStockValue = products.reduce(
    (acc, product) => acc + Number(product.production_cost || 0) * Number(product.stock_quantity || 0),
    0,
  );
  const lowStockItems = products.filter((product) => product.stock_quantity <= product.min_stock).length;
  const avgMargin =
    products.length > 0
      ? products.reduce((acc, item) => {
          const margin =
            item.sale_price > 0
              ? ((item.sale_price - item.production_cost) / item.sale_price) * 100
              : 0;
          return acc + margin;
        }, 0) / products.length
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        description="Cadastre, edite e acompanhe margens e nível de estoque dos produtos."
        action={canWrite ? <ProductFormDialog categories={categories} /> : null}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total de Produtos" value={String(products.length)} subtitle="Itens cadastrados" icon={Box} />
        <KpiCard
          title="Valor em Estoque"
          value={formatCurrencyBRL(totalStockValue)}
          subtitle="Baseado no custo de produção"
          icon={CircleDollarSign}
        />
        <KpiCard
          title="Estoque Baixo"
          value={String(lowStockItems)}
          subtitle="Produtos abaixo do mínimo"
          icon={AlertTriangle}
          tone={lowStockItems > 0 ? "warning" : "default"}
        />
        <KpiCard
          title="Margem Média"
          value={`${avgMargin.toFixed(1)}%`}
          subtitle="Estimativa sobre preço de venda"
          icon={PackagePlus}
          tone="positive"
        />
      </section>

      <ProductsTable products={products} categories={categories} canWrite={canWrite} />
    </div>
  );
}
