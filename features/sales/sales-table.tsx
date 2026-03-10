"use client";

import { useMemo, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cancelSaleAction } from "@/features/sales/actions";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyBRL, formatDateTimeBR } from "@/lib/utils/format";

type SaleItemRow = {
  id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  product: { name: string } | null;
};

export type SaleRow = {
  id: string;
  sold_at: string;
  payment_method: string;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  status: "Ativa" | "Cancelada";
  notes: string | null;
  profile: { full_name: string | null } | null;
  sale_items: SaleItemRow[];
};

type SalesTableProps = {
  sales: SaleRow[];
  canWrite: boolean;
};

export function SalesTable({ sales, canWrite }: SalesTableProps) {
  const [selectedSale, setSelectedSale] = useState<SaleRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [paymentFilter, setPaymentFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = sale.sold_at.slice(0, 10);
      const matchesPayment =
        paymentFilter === "todos" || sale.payment_method === paymentFilter;
      const matchesStatus = statusFilter === "todos" || sale.status === statusFilter;
      const matchesStart = !startDate || saleDate >= startDate;
      const matchesEnd = !endDate || saleDate <= endDate;
      return matchesPayment && matchesStatus && matchesStart && matchesEnd;
    });
  }, [sales, paymentFilter, statusFilter, startDate, endDate]);

  const handleCancel = (saleId: string) => {
    startTransition(async () => {
      try {
        await cancelSaleAction(saleId);
        toast.success("Venda cancelada e estoque estornado.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao cancelar venda.");
      }
    });
  };

  const columns: ColumnDef<SaleRow>[] = [
    {
      accessorKey: "sold_at",
      header: "Data",
      cell: ({ row }) => formatDateTimeBR(row.original.sold_at),
    },
    {
      accessorKey: "id",
      header: "Código",
      cell: ({ row }) => row.original.id.slice(0, 8),
    },
    {
      accessorKey: "payment_method",
      header: "Forma de Pagamento",
      cell: ({ row }) => row.original.payment_method,
    },
    {
      accessorKey: "total_amount",
      header: "Total",
      cell: ({ row }) => formatCurrencyBRL(row.original.total_amount),
    },
    {
      accessorKey: "profile",
      header: "Usuário",
      cell: ({ row }) => row.original.profile?.full_name ?? "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className={
            row.original.status === "Ativa"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedSale(row.original)}>
            <Eye className="h-4 w-4" />
            Detalhes
          </Button>
          {canWrite ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={row.original.status === "Cancelada" || isPending}
              onClick={() => handleCancel(row.original.id)}
            >
              <RotateCcw className="h-4 w-4 text-rose-600" />
              Cancelar
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredSales}
        searchAccessor={(row) =>
          `${row.id} ${row.payment_method} ${row.profile?.full_name ?? ""} ${row.status}`
        }
        searchPlaceholder="Filtrar por ID, pagamento, usuário..."
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
            <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter(value ?? "todos")}>
              <SelectTrigger className="w-full sm:w-[170px]">
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos pagamentos</SelectItem>
                <SelectItem value="Pix">Pix</SelectItem>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                <SelectItem value="Transferência">Transferência</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "todos")}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                <SelectItem value="Ativa">Ativas</SelectItem>
                <SelectItem value="Cancelada">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        mobileCard={(row) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{row.id.slice(0, 8)}</p>
              <Badge
                className={
                  row.status === "Ativa"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }
              >
                {row.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">{formatDateTimeBR(row.sold_at)}</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <p>Pagamento: {row.payment_method}</p>
              <p>Total: {formatCurrencyBRL(row.total_amount)}</p>
            </div>
          </div>
        )}
      />

      <Dialog open={Boolean(selectedSale)} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          {selectedSale ? (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-2">
                <p>
                  <span className="text-slate-500">Código:</span> {selectedSale.id}
                </p>
                <p>
                  <span className="text-slate-500">Data:</span> {formatDateTimeBR(selectedSale.sold_at)}
                </p>
                <p>
                  <span className="text-slate-500">Pagamento:</span> {selectedSale.payment_method}
                </p>
                <p>
                  <span className="text-slate-500">Usuário:</span>{" "}
                  {selectedSale.profile?.full_name ?? "Sem identificação"}
                </p>
                <p>
                  <span className="text-slate-500">Status:</span> {selectedSale.status}
                </p>
                <p>
                  <span className="text-slate-500">Desconto:</span>{" "}
                  {formatCurrencyBRL(selectedSale.discount_amount)}
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Produto</th>
                      <th className="px-3 py-2 font-medium">Qtd.</th>
                      <th className="px-3 py-2 font-medium">Preço</th>
                      <th className="px-3 py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.sale_items.map((item) => (
                      <tr key={item.id} className="border-t border-slate-200">
                        <td className="px-3 py-2">{item.product?.name ?? "-"}</td>
                        <td className="px-3 py-2">{item.quantity}</td>
                        <td className="px-3 py-2">{formatCurrencyBRL(item.unit_price)}</td>
                        <td className="px-3 py-2">{formatCurrencyBRL(item.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedSale.notes ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <span className="font-medium">Observação:</span> {selectedSale.notes}
                </p>
              ) : null}

              <p className="text-right text-lg font-semibold text-slate-900">
                Total: {formatCurrencyBRL(selectedSale.total_amount)}
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

