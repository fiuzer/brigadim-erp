import type { DashboardWidgetLayout, DashboardWidgetType } from "@/lib/types/app";

export const DASHBOARD_WIDGET_CATALOG: Record<
  DashboardWidgetType,
  Omit<DashboardWidgetLayout, "id">
> = {
  "kpi-receita-hoje": {
    type: "kpi-receita-hoje",
    title: "Faturamento de Hoje",
    colSpan: 1,
    rowSpan: 1,
    settings: { limit: 6 },
  },
  "kpi-receita-mes": {
    type: "kpi-receita-mes",
    title: "Faturamento do Mes",
    colSpan: 1,
    rowSpan: 1,
    settings: { limit: 6 },
  },
  "kpi-lucro-liquido": {
    type: "kpi-lucro-liquido",
    title: "Lucro Liquido",
    colSpan: 1,
    rowSpan: 1,
    settings: { limit: 6 },
  },
  "kpi-ticket-medio": {
    type: "kpi-ticket-medio",
    title: "Ticket Medio",
    colSpan: 1,
    rowSpan: 1,
    settings: { limit: 6 },
  },
  "chart-pagamentos": {
    type: "chart-pagamentos",
    title: "Vendas por Forma de Pagamento",
    colSpan: 2,
    rowSpan: 1,
    settings: { limit: 8 },
  },
  "chart-produtos-vendidos": {
    type: "chart-produtos-vendidos",
    title: "Produtos Mais Vendidos",
    colSpan: 2,
    rowSpan: 1,
    settings: { limit: 8 },
  },
  "chart-despesas-categoria": {
    type: "chart-despesas-categoria",
    title: "Despesas por Categoria",
    colSpan: 2,
    rowSpan: 1,
    settings: { limit: 8 },
  },
  "table-estoque-critico": {
    type: "table-estoque-critico",
    title: "Estoque Critico",
    colSpan: 1,
    rowSpan: 1,
    settings: { limit: 6 },
  },
  "table-produtos-lucrativos": {
    type: "table-produtos-lucrativos",
    title: "Produtos Mais Lucrativos",
    colSpan: 1,
    rowSpan: 1,
    settings: { limit: 6 },
  },
};
