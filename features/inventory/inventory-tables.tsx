"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyBRL, formatDateTimeBR } from "@/lib/utils/format";

type ProductStockRow = {
  id: string;
  name: string;
  stock_quantity: number;
  min_stock: number;
  production_cost: number;
  category: { name: string } | null;
};

type MovementRow = {
  id: string;
  movement_type: "Entrada" | "Saída" | "Ajuste" | "Venda" | "Cancelamento";
  quantity: number;
  reason: string | null;
  notes: string | null;
  created_at: string;
  product: { name: string } | null;
  profile: { full_name: string | null } | null;
};

const movementTone: Record<string, string> = {
  Entrada: "bg-emerald-100 text-emerald-700",
  "Saída": "bg-rose-100 text-rose-700",
  Saida: "bg-rose-100 text-rose-700",
  Ajuste: "bg-slate-200 text-slate-700",
  Venda: "bg-cyan-100 text-cyan-700",
  Cancelamento: "bg-rose-100 text-rose-700",
};

export function StockOverviewTable({ data }: { data: ProductStockRow[] }) {
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [stockFilter, setStockFilter] = useState("todos");

  const categories = useMemo(
    () => Array.from(new Set(data.map((item) => item.category?.name).filter(Boolean))) as string[],
    [data],
  );

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesCategory =
        categoryFilter === "todos" || (item.category?.name ?? "Sem categoria") === categoryFilter;
      const matchesStock =
        stockFilter === "todos" ||
        (stockFilter === "critico" ? item.stock_quantity <= item.min_stock : item.stock_quantity > item.min_stock);
      return matchesCategory && matchesStock;
    });
  }, [data, categoryFilter, stockFilter]);

  const columns: ColumnDef<ProductStockRow>[] = [
    {
      accessorKey: "name",
      header: "Produto",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-900">{row.original.name}</p>
          <p className="text-xs text-slate-500">{row.original.category?.name ?? "Sem categoria"}</p>
        </div>
      ),
    },
    {
      accessorKey: "stock_quantity",
      header: "Estoque Atual",
      cell: ({ row }) => row.original.stock_quantity,
    },
    {
      accessorKey: "min_stock",
      header: "Estoque Mínimo",
      cell: ({ row }) => row.original.min_stock,
    },
    {
      id: "stock_status",
      header: "Status",
      cell: ({ row }) =>
        row.original.stock_quantity <= row.original.min_stock ? (
          <Badge variant="destructive">Estoque Baixo</Badge>
        ) : (
          <Badge variant="secondary">Normal</Badge>
        ),
    },
    {
      id: "stock_value",
      header: "Valor em Estoque",
      cell: ({ row }) => formatCurrencyBRL(row.original.production_cost * row.original.stock_quantity),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={filteredData}
      searchAccessor={(row) => `${row.name} ${row.category?.name ?? ""}`}
      searchPlaceholder="Buscar produto no estoque..."
      rightAction={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value ?? "todos")}>
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={(value) => setStockFilter(value ?? "todos")}>
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue placeholder="Status do estoque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="critico">Estoque crítico</SelectItem>
              <SelectItem value="normal">Estoque normal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
      mobileCard={(row) => (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">{row.category?.name ?? "Sem categoria"}</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <p>Atual: {row.stock_quantity} un.</p>
            <p>Mínimo: {row.min_stock} un.</p>
            <p className="col-span-2">Valor: {formatCurrencyBRL(row.production_cost * row.stock_quantity)}</p>
          </div>
        </div>
      )}
    />
  );
}

export function MovementHistoryTable({ data }: { data: MovementRow[] }) {
  const [movementTypeFilter, setMovementTypeFilter] = useState("todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredData = useMemo(() => {
    return data.filter((movement) => {
      const movementDate = movement.created_at.slice(0, 10);
      const matchesType = movementTypeFilter === "todos" || movement.movement_type === movementTypeFilter;
      const matchesStart = !startDate || movementDate >= startDate;
      const matchesEnd = !endDate || movementDate <= endDate;
      return matchesType && matchesStart && matchesEnd;
    });
  }, [data, movementTypeFilter, startDate, endDate]);

  const columns: ColumnDef<MovementRow>[] = [
    {
      accessorKey: "created_at",
      header: "Data",
      cell: ({ row }) => formatDateTimeBR(row.original.created_at),
    },
    {
      accessorKey: "product",
      header: "Produto",
      cell: ({ row }) => row.original.product?.name ?? "-",
    },
    {
      accessorKey: "movement_type",
      header: "Tipo",
      cell: ({ row }) => <Badge className={movementTone[row.original.movement_type]}>{row.original.movement_type}</Badge>,
    },
    {
      accessorKey: "quantity",
      header: "Quantidade",
      cell: ({ row }) => row.original.quantity,
    },
    {
      accessorKey: "reason",
      header: "Motivo",
      cell: ({ row }) => row.original.reason || "-",
    },
    {
      accessorKey: "profile",
      header: "Usuário",
      cell: ({ row }) => row.original.profile?.full_name ?? "Sistema",
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={filteredData}
      searchAccessor={(row) => `${row.product?.name ?? ""} ${row.reason ?? ""} ${row.profile?.full_name ?? ""}`}
      searchPlaceholder="Filtrar histórico..."
      rightAction={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full sm:w-[150px]"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full sm:w-[150px]"
          />
          <Select value={movementTypeFilter} onValueChange={(value) => setMovementTypeFilter(value ?? "todos")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tipo de movimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="Entrada">Entrada</SelectItem>
              <SelectItem value="Saída">Saída</SelectItem>
              <SelectItem value="Ajuste">Ajuste</SelectItem>
              <SelectItem value="Venda">Venda</SelectItem>
              <SelectItem value="Cancelamento">Cancelamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
      mobileCard={(row) => (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">{row.product?.name ?? "-"}</p>
          <p className="text-xs text-slate-500">{formatDateTimeBR(row.created_at)}</p>
          <div className="flex items-center justify-between">
            <Badge className={movementTone[row.movement_type]}>{row.movement_type}</Badge>
            <span className="text-sm font-medium text-slate-900">{row.quantity} un.</span>
          </div>
          <p className="text-xs text-slate-600">{row.reason || "Sem motivo informado"}</p>
        </div>
      )}
    />
  );
}
