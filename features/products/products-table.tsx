"use client";

import { useMemo, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Ban, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProductAction, toggleProductStatusAction } from "@/features/products/actions";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductFormDialog } from "@/components/forms/product-form-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyBRL } from "@/lib/utils/format";

type ProductCategory = {
  id: string;
  name: string;
};

export type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  production_cost: number;
  sale_price: number;
  stock_quantity: number;
  min_stock: number;
  is_active: boolean;
  category: ProductCategory | null;
};

type ProductsTableProps = {
  products: ProductRow[];
  categories: ProductCategory[];
  canWrite: boolean;
};

export function ProductsTable({ products, categories, canWrite }: ProductsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const selectedCategoryLabel =
    categories.find((category) => category.id === categoryFilter)?.name ?? "";

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        categoryFilter === "todos" || product.category?.id === categoryFilter;
      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "ativos" ? product.is_active : !product.is_active);
      return matchesCategory && matchesStatus;
    });
  }, [products, categoryFilter, statusFilter]);

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteProductAction(id);
        toast.success("Produto excluído.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao excluir produto.");
      }
    });
  };

  const handleToggle = (id: string, isActive: boolean) => {
    startTransition(async () => {
      try {
        await toggleProductStatusAction(id, isActive);
        toast.success(`Produto ${isActive ? "desativado" : "ativado"} com sucesso.`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao alterar status.");
      }
    });
  };

  const columns: ColumnDef<ProductRow>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="px-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Produto
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-900">{row.original.name}</p>
          <p className="text-xs text-slate-500">{row.original.sku || "Sem código"}</p>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Categoria",
      cell: ({ row }) => row.original.category?.name || "Sem categoria",
    },
    {
      accessorKey: "sale_price",
      header: "Preço de venda",
      cell: ({ row }) => formatCurrencyBRL(row.original.sale_price),
    },
    {
      accessorKey: "production_cost",
      header: "Custo",
      cell: ({ row }) => formatCurrencyBRL(row.original.production_cost),
    },
    {
      id: "margin",
      header: "Margem estimada",
      cell: ({ row }) => {
        const margin = row.original.sale_price - row.original.production_cost;
        const percent =
          row.original.sale_price > 0 ? (margin / row.original.sale_price) * 100 : 0;
        return (
          <div>
            <p className="font-medium text-slate-900">{formatCurrencyBRL(margin)}</p>
            <p className="text-xs text-slate-500">{percent.toFixed(1)}%</p>
          </div>
        );
      },
    },
    {
      accessorKey: "stock_quantity",
      header: "Estoque",
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{row.original.stock_quantity} un.</p>
          {row.original.stock_quantity <= row.original.min_stock ? (
            <Badge variant="destructive" className="text-[10px]">
              Estoque baixo
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              Normal
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className={
            row.original.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
          }
        >
          {row.original.is_active ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) =>
        canWrite ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" disabled={isPending}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1">
                <ProductFormDialog
                  triggerLabel="Editar"
                  categories={categories}
                  product={{
                    id: row.original.id,
                    name: row.original.name,
                    category_id: row.original.category?.id ?? null,
                    description: row.original.description,
                    sku: row.original.sku,
                    production_cost: row.original.production_cost,
                    sale_price: row.original.sale_price,
                    stock_quantity: row.original.stock_quantity,
                    min_stock: row.original.min_stock,
                    is_active: row.original.is_active,
                  }}
                />
              </div>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => handleToggle(row.original.id, row.original.is_active)}
              >
                <Ban className="h-4 w-4" />
                {row.original.is_active ? "Desativar" : "Ativar"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-red-600 focus:text-red-700"
                onClick={() => handleDelete(row.original.id)}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" size="sm" className="gap-2" disabled>
            <Pencil className="h-4 w-4" />
            Sem permissão
          </Button>
        ),
    },
  ];

  return (
    <DataTable
      data={filteredProducts}
      columns={columns}
      searchPlaceholder="Buscar por nome, categoria ou SKU..."
      searchAccessor={(row) => `${row.name} ${row.sku ?? ""} ${row.category?.name ?? ""}`}
      rightAction={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value ?? "todos")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Categoria">{selectedCategoryLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "todos")}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativos">Ativos</SelectItem>
              <SelectItem value="inativos">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
      mobileCard={(row) => {
        const margin = row.sale_price - row.production_cost;
        return (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.category?.name ?? "Sem categoria"}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <p className="text-slate-600">Preço: {formatCurrencyBRL(row.sale_price)}</p>
              <p className="text-slate-600">Custo: {formatCurrencyBRL(row.production_cost)}</p>
              <p className="text-slate-600">Margem: {formatCurrencyBRL(margin)}</p>
              <p className="text-slate-600">Estoque: {row.stock_quantity} un.</p>
            </div>
          </div>
        );
      }}
    />
  );
}
