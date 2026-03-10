"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { Filter, Loader2, Plus, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import type { DashboardWidgetLayout, DashboardWidgetType } from "@/lib/types/app";
import type {
  DashboardAnalytics,
  DashboardDrilldownContext,
  DashboardFilterState,
} from "@/lib/types/dashboard";
import { DEFAULT_DASHBOARD_LAYOUT } from "@/features/dashboard-builder/default-layout";
import { DASHBOARD_WIDGET_CATALOG } from "@/features/dashboard-builder/widget-registry";
import { saveDashboardLayoutAction } from "@/features/dashboard-builder/actions";
import { WidgetRenderer } from "@/components/dashboard/widget-renderer";
import { SortableWidgetCard } from "@/components/dashboard/sortable-widget-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyBRL, formatDateBR } from "@/lib/utils/format";

type DashboardBuilderProps = {
  userId: string;
  initialLayout: DashboardWidgetLayout[];
  analytics: DashboardAnalytics;
  initialFilters: DashboardFilterState;
};

const ALL_VALUE = "todos";

export function DashboardBuilder({
  userId,
  initialLayout,
  analytics,
  initialFilters,
}: DashboardBuilderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [layout, setLayout] = useState<DashboardWidgetLayout[]>(
    initialLayout.length ? initialLayout : DEFAULT_DASHBOARD_LAYOUT,
  );
  const [filters, setFilters] = useState<DashboardFilterState>(initialFilters);
  const [isPending, startTransition] = useTransition();
  const [drilldownContext, setDrilldownContext] = useState<DashboardDrilldownContext | null>(null);
  const [editingWidget, setEditingWidget] = useState<DashboardWidgetLayout | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingLimit, setEditingLimit] = useState(6);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const availableWidgets = useMemo(() => {
    const usedWidgetTypes = new Set(layout.map((item) => item.type));
    return Object.values(DASHBOARD_WIDGET_CATALOG).filter(
      (widget) => !usedWidgetTypes.has(widget.type),
    );
  }, [layout]);
  const selectedProductLabel =
    filters.productId === ALL_VALUE
      ? "Todos produtos"
      : (analytics.filterOptions.products.find((product) => product.id === filters.productId)?.name ?? "");
  const selectedOperatorLabel =
    filters.operatorId === ALL_VALUE
      ? "Todos operadores"
      : (analytics.filterOptions.operators.find((operator) => operator.id === filters.operatorId)?.name ?? "");

  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    const activeId = String(event.active.id);
    const overId = String(event.over.id);
    const oldIndex = layout.findIndex((item) => item.id === activeId);
    const newIndex = layout.findIndex((item) => item.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;
    setLayout((current) => arrayMove(current, oldIndex, newIndex));
  };

  const addWidget = (type: DashboardWidgetType) => {
    const base = DASHBOARD_WIDGET_CATALOG[type];
    setLayout((current) => [
      ...current,
      {
        ...base,
        id: `w-${type}-${crypto.randomUUID().slice(0, 8)}`,
      },
    ]);
  };

  const removeWidget = (id: string) => {
    setLayout((current) => current.filter((item) => item.id !== id));
  };

  const resizeWidget = (id: string) => {
    setLayout((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              colSpan: item.colSpan === 1 ? 2 : 1,
            }
          : item,
      ),
    );
  };

  const openEditor = (widget: DashboardWidgetLayout) => {
    setEditingWidget(widget);
    setEditingTitle(widget.title);
    setEditingLimit(widget.settings?.limit ?? 6);
  };

  const saveWidgetSettings = () => {
    if (!editingWidget) return;
    setLayout((current) =>
      current.map((item) =>
        item.id === editingWidget.id
          ? {
              ...item,
              title: editingTitle.trim() || item.title,
              settings: {
                ...item.settings,
                limit: Math.min(20, Math.max(3, Number(editingLimit || 6))),
              },
            }
          : item,
      ),
    );
    setEditingWidget(null);
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    params.set("inicio", filters.startDate);
    params.set("fim", filters.endDate);
    if (filters.paymentMethod !== ALL_VALUE) params.set("pagamento", filters.paymentMethod);
    if (filters.productId !== ALL_VALUE) params.set("produto", filters.productId);
    if (filters.categoryName !== ALL_VALUE) params.set("categoria", filters.categoryName);
    if (filters.operatorId !== ALL_VALUE) params.set("operador", filters.operatorId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const resetFilters = () => {
    const resetValue: DashboardFilterState = {
      ...initialFilters,
      paymentMethod: ALL_VALUE,
      productId: ALL_VALUE,
      categoryName: ALL_VALUE,
      operatorId: ALL_VALUE,
    };
    setFilters(resetValue);
  };

  const saveLayout = () => {
    startTransition(async () => {
      try {
        await saveDashboardLayoutAction(userId, layout, filters);
        toast.success("Preferencias do dashboard salvas com sucesso.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao salvar dashboard.");
      }
    });
  };

  const gridClassBySpan: Record<number, string> = {
    1: "xl:col-span-1",
    2: "xl:col-span-2",
    3: "xl:col-span-3",
    4: "xl:col-span-4",
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Input
            type="date"
            value={filters.startDate}
            onChange={(event) => setFilters((old) => ({ ...old, startDate: event.target.value }))}
          />
          <Input
            type="date"
            value={filters.endDate}
            onChange={(event) => setFilters((old) => ({ ...old, endDate: event.target.value }))}
          />

          <Select
            value={filters.paymentMethod}
            onValueChange={(value) =>
              setFilters((old) => ({ ...old, paymentMethod: value ?? ALL_VALUE }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos pagamentos</SelectItem>
              {analytics.filterOptions.paymentMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.productId}
            onValueChange={(value) =>
              setFilters((old) => ({ ...old, productId: value ?? ALL_VALUE }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Produto">{selectedProductLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos produtos</SelectItem>
              {analytics.filterOptions.products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.categoryName}
            onValueChange={(value) =>
              setFilters((old) => ({ ...old, categoryName: value ?? ALL_VALUE }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todas categorias</SelectItem>
              {analytics.filterOptions.categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.operatorId}
            onValueChange={(value) =>
              setFilters((old) => ({ ...old, operatorId: value ?? ALL_VALUE }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Operador">{selectedOperatorLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos operadores</SelectItem>
              {analytics.filterOptions.operators.map((operator) => (
                <SelectItem key={operator.id} value={operator.id}>
                  {operator.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={applyFilters}>
            <Filter className="h-4 w-4" />
            Aplicar filtros
          </Button>
          <Button variant="ghost" className="gap-2" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4" />
            Limpar filtros
          </Button>
          <Dialog>
            <DialogTrigger
              render={
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar widget
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar widget ao dashboard</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2">
                {availableWidgets.length ? (
                  availableWidgets.map((widget) => (
                    <Button
                      key={widget.type}
                      variant="outline"
                      className="justify-start"
                      onClick={() => addWidget(widget.type)}
                    >
                      {widget.title}
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-slate-600">
                    Todos os widgets disponiveis ja foram adicionados.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button className="gap-2" disabled={isPending} onClick={saveLayout}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar preferencias
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={layout.map((item) => item.id)} strategy={rectSortingStrategy}>
          <div className="grid gap-4 xl:grid-cols-4">
            {layout.map((widget) => (
              <div key={widget.id} className={gridClassBySpan[widget.colSpan]}>
                <SortableWidgetCard
                  widget={widget}
                  onRemove={removeWidget}
                  onResize={resizeWidget}
                  onDrilldown={(selectedWidget) =>
                    setDrilldownContext({ widgetType: selectedWidget.type })
                  }
                  onEdit={openEditor}
                >
                  <WidgetRenderer
                    widget={widget}
                    data={analytics}
                    onDrilldown={setDrilldownContext}
                  />
                </SortableWidgetCard>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog open={Boolean(editingWidget)} onOpenChange={() => setEditingWidget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preferencias do widget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Titulo</label>
              <Input value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Limite de itens (3 a 20)</label>
              <Input
                type="number"
                min={3}
                max={20}
                value={editingLimit}
                onChange={(event) => setEditingLimit(Number(event.target.value))}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={saveWidgetSettings}>Salvar widget</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(drilldownContext)} onOpenChange={() => setDrilldownContext(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Drilldown analitico</DialogTitle>
          </DialogHeader>
          <DashboardDrilldown context={drilldownContext} analytics={analytics} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DashboardDrilldown({
  context,
  analytics,
}: {
  context: DashboardDrilldownContext | null;
  analytics: DashboardAnalytics;
}) {
  if (!context) return null;

  if (context.widgetType === "chart-pagamentos") {
    const salesRows = context.label
      ? analytics.salesDetailed.filter((sale) => sale.payment_method === context.label)
      : analytics.salesDetailed;

    return (
      <div className="space-y-2">
        <p className="text-sm text-slate-600">
          {context.label
            ? `Vendas filtradas por pagamento: ${context.label}`
            : "Vendas por forma de pagamento"}
        </p>
        {salesRows.map((sale) => (
          <div
            key={sale.id}
            className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"
          >
            <div>
              <p className="font-medium text-slate-900">{sale.payment_method}</p>
              <p className="text-xs text-slate-500">
                {formatDateBR(sale.sold_at)} - {sale.user_name ?? "Sem operador"}
              </p>
            </div>
            <strong>{formatCurrencyBRL(sale.total_amount)}</strong>
          </div>
        ))}
      </div>
    );
  }

  if (context.widgetType === "chart-despesas-categoria") {
    const rows = context.label
      ? analytics.expensesDetailed.filter((expense) => expense.category_name === context.label)
      : analytics.expensesDetailed;

    return (
      <div className="space-y-2">
        <p className="text-sm text-slate-600">
          {context.label
            ? `Despesas da categoria: ${context.label}`
            : "Composicao de despesas no periodo"}
        </p>
        {rows.map((expense) => (
          <div
            key={expense.id}
            className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"
          >
            <div>
              <p className="font-medium text-slate-900">{expense.description}</p>
              <p className="text-xs text-slate-500">
                {expense.category_name ?? "Sem categoria"} - {formatDateBR(expense.expense_date)}
              </p>
            </div>
            <strong>{formatCurrencyBRL(expense.amount)}</strong>
          </div>
        ))}
      </div>
    );
  }

  if (context.widgetType === "table-estoque-critico") {
    const rows = context.label
      ? analytics.lowStockProducts.filter((item) => item.product_name === context.label)
      : analytics.lowStockProducts;

    return (
      <div className="space-y-2">
        {rows.map((item) => (
          <div
            key={item.product_id}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"
          >
            <span>{item.product_name}</span>
            <span>{item.stock_quantity} un.</span>
            <strong>Min {item.min_stock}</strong>
          </div>
        ))}
      </div>
    );
  }

  if (
    context.widgetType === "chart-produtos-vendidos" ||
    context.widgetType === "table-produtos-lucrativos"
  ) {
    const rows = analytics.mostProfitableProducts.filter((item) =>
      context.label ? item.name === context.label : true,
    );

    return (
      <div className="space-y-2">
        <p className="text-sm text-slate-600">
          {context.label
            ? `Detalhes do produto: ${context.label}`
            : "Produtos com maior retorno no periodo"}
        </p>
        {rows.map((item) => (
          <div
            key={item.name}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"
          >
            <span>{item.name}</span>
            <span>{item.margin.toFixed(1)}%</span>
            <strong>{formatCurrencyBRL(item.grossProfit)}</strong>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      <p className="font-medium text-slate-900">Resumo detalhado do periodo atual</p>
      <p>Faturamento: {formatCurrencyBRL(analytics.metrics.revenuePeriod)}</p>
      <p>Lucro bruto: {formatCurrencyBRL(analytics.metrics.grossProfit)}</p>
      <p>Lucro liquido: {formatCurrencyBRL(analytics.metrics.netProfit)}</p>
      <p>Ticket medio: {formatCurrencyBRL(analytics.metrics.averageTicket)}</p>
      <p>Vendas ativas: {analytics.metrics.salesCount}</p>
    </div>
  );
}
