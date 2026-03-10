"use client";

import { useMemo, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteExpenseAction } from "@/features/expenses/actions";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { ExpenseFormDialog } from "@/components/forms/expense-form-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyBRL, formatDateBR } from "@/lib/utils/format";

type CategoryOption = {
  id: string;
  name: string;
};

type ExpenseRow = {
  id: string;
  expense_date: string;
  description: string;
  amount: number;
  notes: string | null;
  category: CategoryOption | null;
  profile: { full_name: string | null } | null;
};

type ExpensesTableProps = {
  expenses: ExpenseRow[];
  categories: CategoryOption[];
  canWrite: boolean;
};

export function ExpensesTable({ expenses, categories, canWrite }: ExpensesTableProps) {
  const [isPending, startTransition] = useTransition();
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const selectedCategoryLabel =
    categories.find((category) => category.id === categoryFilter)?.name ?? "";

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesCategory =
        categoryFilter === "todos" || expense.category?.id === categoryFilter;
      const matchesStart = !startDate || expense.expense_date >= startDate;
      const matchesEnd = !endDate || expense.expense_date <= endDate;
      return matchesCategory && matchesStart && matchesEnd;
    });
  }, [expenses, categoryFilter, startDate, endDate]);

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteExpenseAction(id);
        toast.success("Despesa excluída.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao excluir despesa.");
      }
    });
  };

  const columns: ColumnDef<ExpenseRow>[] = [
    {
      accessorKey: "expense_date",
      header: "Data",
      cell: ({ row }) => formatDateBR(row.original.expense_date),
    },
    {
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.description}</p>
          <p className="text-xs text-slate-500">{row.original.notes || "-"}</p>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Categoria",
      cell: ({ row }) => row.original.category?.name ?? "Sem categoria",
    },
    {
      accessorKey: "amount",
      header: "Valor",
      cell: ({ row }) => formatCurrencyBRL(row.original.amount),
    },
    {
      accessorKey: "profile",
      header: "Usuário",
      cell: ({ row }) => row.original.profile?.full_name ?? "-",
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) =>
        canWrite ? (
          <div className="flex gap-2">
            <ExpenseFormDialog
              categories={categories}
              expense={{
                id: row.original.id,
                expense_date: row.original.expense_date,
                category_id: row.original.category?.id ?? null,
                description: row.original.description,
                amount: row.original.amount,
                notes: row.original.notes,
              }}
              triggerLabel="Editar"
            />
            <Button
              variant="ghost"
              size="icon"
              disabled={isPending}
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" disabled>
            <Pencil className="h-4 w-4" />
            Somente leitura
          </Button>
        ),
    },
  ];

  return (
    <DataTable
      data={filteredExpenses}
      columns={columns}
      searchAccessor={(row) =>
        `${row.description} ${row.category?.name ?? ""} ${row.profile?.full_name ?? ""}`
      }
      searchPlaceholder="Buscar despesas..."
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
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value ?? "todos")}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Categoria">{selectedCategoryLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
      mobileCard={(row) => (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">{row.description}</p>
          <p className="text-xs text-slate-500">{formatDateBR(row.expense_date)}</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <p>Categoria: {row.category?.name ?? "Sem categoria"}</p>
            <p>Valor: {formatCurrencyBRL(row.amount)}</p>
          </div>
        </div>
      )}
    />
  );
}
