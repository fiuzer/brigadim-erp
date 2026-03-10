"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardWidgetLayout } from "@/lib/types/app";
import type { DashboardAnalytics, DashboardDrilldownContext } from "@/lib/types/dashboard";
import { formatCurrencyBRL } from "@/lib/utils/format";

const PIE_COLORS = ["#B96A75", "#D08B95", "#907761", "#C57B85", "#A37981", "#2B1E17"];

type WidgetRendererProps = {
  widget: DashboardWidgetLayout;
  data: DashboardAnalytics;
  onDrilldown: (context: DashboardDrilldownContext) => void;
};

export function WidgetRenderer({ widget, data, onDrilldown }: WidgetRendererProps) {
  const limit = widget.settings?.limit ?? 6;

  switch (widget.type) {
    case "kpi-receita-hoje":
      return (
        <KpiValue
          value={formatCurrencyBRL(data.metrics.revenueToday)}
          subtitle="Comparado ao desempenho diario"
          onClick={() => onDrilldown({ widgetType: widget.type })}
        />
      );
    case "kpi-receita-mes":
      return (
        <KpiValue
          value={formatCurrencyBRL(data.metrics.revenuePeriod)}
          subtitle="Faturamento do periodo filtrado"
          onClick={() => onDrilldown({ widgetType: widget.type })}
        />
      );
    case "kpi-lucro-liquido":
      return (
        <KpiValue
          value={formatCurrencyBRL(data.metrics.netProfit)}
          subtitle="Receita - custo - despesas"
          onClick={() => onDrilldown({ widgetType: widget.type })}
        />
      );
    case "kpi-ticket-medio":
      return (
        <KpiValue
          value={formatCurrencyBRL(data.metrics.averageTicket)}
          subtitle="Media por venda concluida"
          onClick={() => onDrilldown({ widgetType: widget.type })}
        />
      );
    case "chart-pagamentos":
      return (
        <SimplePieChart
          data={data.paymentBreakdown}
          valueFormatter={(value) => formatCurrencyBRL(value)}
          onItemClick={(label) => onDrilldown({ widgetType: widget.type, label })}
        />
      );
    case "chart-produtos-vendidos":
      return (
        <SimpleBarChart
          data={data.topProducts.slice(0, limit)}
          valueKey="value"
          valueFormatter={(value) => `${value} un.`}
          onItemClick={(label) => onDrilldown({ widgetType: widget.type, label })}
        />
      );
    case "chart-despesas-categoria":
      return (
        <SimpleBarChart
          data={data.expensesByCategory.slice(0, limit)}
          valueKey="value"
          valueFormatter={(value) => formatCurrencyBRL(value)}
          onItemClick={(label) => onDrilldown({ widgetType: widget.type, label })}
        />
      );
    case "table-estoque-critico":
      return (
        <div className="space-y-2">
          {data.lowStockProducts.slice(0, limit).map((product) => (
            <button
              key={product.product_id}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-left transition-colors hover:bg-slate-100"
              onClick={() => onDrilldown({ widgetType: widget.type, label: product.product_name })}
            >
              <p className="text-sm font-medium text-slate-900">{product.product_name}</p>
              <p className="text-xs text-slate-600">
                Estoque {product.stock_quantity} / minimo {product.min_stock}
              </p>
            </button>
          ))}
          {!data.lowStockProducts.length ? (
            <p className="text-sm text-slate-500">Sem alertas de estoque critico no momento.</p>
          ) : null}
        </div>
      );
    case "table-produtos-lucrativos":
      return (
        <div className="space-y-2">
          {data.mostProfitableProducts.slice(0, limit).map((product) => (
            <button
              key={product.name}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-left transition-colors hover:bg-slate-100"
              onClick={() => onDrilldown({ widgetType: widget.type, label: product.name })}
            >
              <p className="text-sm font-medium text-slate-900">{product.name}</p>
              <p className="text-xs text-slate-600">
                Lucro {formatCurrencyBRL(product.grossProfit)} ({product.margin.toFixed(1)}%)
              </p>
            </button>
          ))}
          {!data.mostProfitableProducts.length ? (
            <p className="text-sm text-slate-500">Sem dados suficientes para calcular lucratividade.</p>
          ) : null}
        </div>
      );
    default:
      return <p className="text-sm text-slate-500">Widget nao encontrado.</p>;
  }
}

function KpiValue({
  value,
  subtitle,
  onClick,
}: {
  value: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button className="w-full space-y-2 text-left" onClick={onClick}>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-600">{subtitle}</p>
    </button>
  );
}

function SimplePieChart({
  data,
  valueFormatter,
  onItemClick,
}: {
  data: { name: string; value: number }[];
  valueFormatter: (value: number) => string;
  onItemClick: (label: string) => void;
}) {
  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={45}
            outerRadius={80}
            onClick={(item) => {
              const label = (item as { name?: string } | undefined)?.name;
              if (label) onItemClick(label);
            }}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => valueFormatter(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function SimpleBarChart({
  data,
  valueKey,
  valueFormatter,
  onItemClick,
}: {
  data: { name: string; value: number }[];
  valueKey: "value";
  valueFormatter: (value: number) => string;
  onItemClick: (label: string) => void;
}) {
  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => valueFormatter(Number(value))} />
          <Bar
            dataKey={valueKey}
            fill="#B96A75"
            radius={[6, 6, 0, 0]}
            onClick={(item) => {
              const label = (item as { name?: string } | undefined)?.name;
              if (label) onItemClick(label);
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


