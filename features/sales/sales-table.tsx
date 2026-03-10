"use client";

import { useMemo, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, HandCoins, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cancelSaleAction, registerSalePaymentAction } from "@/features/sales/actions";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/constants/options";
import { getDateTimeInputValueInTimeZone } from "@/lib/utils/timezone";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyBRL, formatDateTimeBR } from "@/lib/utils/format";

type SaleItemRow = {
  id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  product: { name: string } | null;
};

type SalePaymentRow = {
  id: string;
  paid_at: string;
  amount: number;
  payment_method: string;
  notes: string | null;
};

export type SaleRow = {
  id: string;
  sold_at: string;
  payment_method: string;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  payment_status: "Em aberto" | "Parcial" | "Pago" | "Cancelada";
  customer_name: string | null;
  due_date: string | null;
  status: "Ativa" | "Cancelada";
  notes: string | null;
  profile: { full_name: string | null } | null;
  sale_items: SaleItemRow[];
  sale_payments: SalePaymentRow[];
};

type SalesTableProps = {
  sales: SaleRow[];
  canWrite: boolean;
};

function getOpenAmount(sale: Pick<SaleRow, "total_amount" | "amount_paid" | "payment_status" | "status">) {
  if (sale.status === "Cancelada" || sale.payment_status === "Cancelada") return 0;
  return Math.max(Number(sale.total_amount || 0) - Number(sale.amount_paid || 0), 0);
}

function statusBadgeClass(status: SaleRow["status"]) {
  if (status === "Ativa") return "bg-emerald-100 text-emerald-700";
  return "bg-slate-200 text-slate-700";
}

function paymentStatusBadgeClass(status: SaleRow["payment_status"]) {
  if (status === "Pago") return "bg-emerald-100 text-emerald-700";
  if (status === "Parcial") return "bg-fuchsia-100 text-fuchsia-700";
  if (status === "Em aberto") return "bg-rose-100 text-rose-700";
  return "bg-slate-200 text-slate-700";
}

export function SalesTable({ sales, canWrite }: SalesTableProps) {
  const [selectedSale, setSelectedSale] = useState<SaleRow | null>(null);
  const [paymentSale, setPaymentSale] = useState<SaleRow | null>(null);
  const [paymentFilter, setPaymentFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentDate, setPaymentDate] = useState(getDateTimeInputValueInTimeZone());
  const [paymentMethod, setPaymentMethod] = useState<string>("Pix");
  const [paymentAmount, setPaymentAmount] = useState<string>("0");
  const [paymentNotes, setPaymentNotes] = useState("");

  const [isCancelPending, startCancelTransition] = useTransition();
  const [isPaymentPending, startPaymentTransition] = useTransition();

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = sale.sold_at.slice(0, 10);
      const matchesPayment = paymentFilter === "todos" || sale.payment_method === paymentFilter;
      const matchesStatus = statusFilter === "todos" || sale.status === statusFilter;
      const matchesPaymentStatus =
        paymentStatusFilter === "todos" || sale.payment_status === paymentStatusFilter;
      const matchesStart = !startDate || saleDate >= startDate;
      const matchesEnd = !endDate || saleDate <= endDate;
      return matchesPayment && matchesStatus && matchesPaymentStatus && matchesStart && matchesEnd;
    });
  }, [sales, paymentFilter, statusFilter, paymentStatusFilter, startDate, endDate]);

  const handleCancel = (saleId: string) => {
    startCancelTransition(async () => {
      try {
        await cancelSaleAction(saleId);
        toast.success("Venda cancelada e estoque estornado.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao cancelar venda.");
      }
    });
  };

  const openPaymentDialog = (sale: SaleRow) => {
    const remaining = getOpenAmount(sale);
    setPaymentSale(sale);
    setPaymentMethod(sale.payment_method || "Pix");
    setPaymentAmount(remaining.toFixed(2));
    setPaymentDate(getDateTimeInputValueInTimeZone());
    setPaymentNotes("");
  };

  const submitPayment = () => {
    if (!paymentSale) return;

    const amount = Number(paymentAmount);
    startPaymentTransition(async () => {
      try {
        await registerSalePaymentAction({
          sale_id: paymentSale.id,
          paid_at: paymentDate,
          amount,
          payment_method: paymentMethod as (typeof PAYMENT_METHODS)[number],
          notes: paymentNotes || null,
        });
        toast.success("Pagamento registrado com sucesso.");
        setPaymentSale(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao registrar pagamento.");
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
      header: "Codigo",
      cell: ({ row }) => row.original.id.slice(0, 8),
    },
    {
      accessorKey: "payment_method",
      header: "Pagamento",
      cell: ({ row }) => row.original.payment_method,
    },
    {
      accessorKey: "total_amount",
      header: "Total",
      cell: ({ row }) => formatCurrencyBRL(row.original.total_amount),
    },
    {
      id: "amount_paid",
      header: "Recebido",
      cell: ({ row }) => formatCurrencyBRL(Number(row.original.amount_paid || 0)),
    },
    {
      id: "open_amount",
      header: "Em aberto",
      cell: ({ row }) => formatCurrencyBRL(getOpenAmount(row.original)),
    },
    {
      accessorKey: "profile",
      header: "Usuario",
      cell: ({ row }) => row.original.profile?.full_name ?? "-",
    },
    {
      accessorKey: "status",
      header: "Status venda",
      cell: ({ row }) => <Badge className={statusBadgeClass(row.original.status)}>{row.original.status}</Badge>,
    },
    {
      accessorKey: "payment_status",
      header: "Status pagamento",
      cell: ({ row }) => (
        <Badge className={paymentStatusBadgeClass(row.original.payment_status)}>
          {row.original.payment_status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Acoes",
      cell: ({ row }) => {
        const openAmount = getOpenAmount(row.original);
        const canReceive = canWrite && row.original.status === "Ativa" && openAmount > 0;

        return (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedSale(row.original)}>
              <Eye className="h-4 w-4" />
              Detalhes
            </Button>
            {canReceive ? (
              <Button variant="outline" size="sm" onClick={() => openPaymentDialog(row.original)}>
                <HandCoins className="h-4 w-4" />
                Registrar pagamento
              </Button>
            ) : null}
            {canWrite ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={row.original.status === "Cancelada" || isCancelPending}
                onClick={() => handleCancel(row.original.id)}
              >
                <RotateCcw className="h-4 w-4 text-rose-600" />
                Cancelar
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredSales}
        searchAccessor={(row) =>
          `${row.id} ${row.payment_method} ${row.profile?.full_name ?? ""} ${row.status} ${row.payment_status} ${row.customer_name ?? ""}`
        }
        searchPlaceholder="Filtrar por ID, pagamento, usuario..."
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
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "todos")}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status venda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                <SelectItem value="Ativa">Ativas</SelectItem>
                <SelectItem value="Cancelada">Canceladas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentStatusFilter} onValueChange={(value) => setPaymentStatusFilter(value ?? "todos")}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos pagamentos</SelectItem>
                {PAYMENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        mobileCard={(row) => {
          const openAmount = getOpenAmount(row);

          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{row.id.slice(0, 8)}</p>
                <Badge className={statusBadgeClass(row.status)}>{row.status}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={paymentStatusBadgeClass(row.payment_status)}>{row.payment_status}</Badge>
                <p className="text-xs text-muted-foreground">{formatDateTimeBR(row.sold_at)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <p>Pagamento: {row.payment_method}</p>
                <p>Total: {formatCurrencyBRL(row.total_amount)}</p>
                <p>Recebido: {formatCurrencyBRL(Number(row.amount_paid || 0))}</p>
                <p>Em aberto: {formatCurrencyBRL(openAmount)}</p>
              </div>
            </div>
          );
        }}
      />

      <Dialog open={Boolean(selectedSale)} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          {selectedSale ? (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm md:grid-cols-2">
                <p>
                  <span className="text-muted-foreground">Codigo:</span> {selectedSale.id}
                </p>
                <p>
                  <span className="text-muted-foreground">Data:</span> {formatDateTimeBR(selectedSale.sold_at)}
                </p>
                <p>
                  <span className="text-muted-foreground">Pagamento:</span> {selectedSale.payment_method}
                </p>
                <p>
                  <span className="text-muted-foreground">Usuario:</span> {selectedSale.profile?.full_name ?? "Sem identificacao"}
                </p>
                <p>
                  <span className="text-muted-foreground">Status venda:</span> {selectedSale.status}
                </p>
                <p>
                  <span className="text-muted-foreground">Status pagamento:</span> {selectedSale.payment_status}
                </p>
                <p>
                  <span className="text-muted-foreground">Desconto:</span> {formatCurrencyBRL(selectedSale.discount_amount)}
                </p>
                <p>
                  <span className="text-muted-foreground">Recebido:</span> {formatCurrencyBRL(Number(selectedSale.amount_paid || 0))}
                </p>
                <p>
                  <span className="text-muted-foreground">Em aberto:</span> {formatCurrencyBRL(getOpenAmount(selectedSale))}
                </p>
                <p>
                  <span className="text-muted-foreground">Cliente:</span> {selectedSale.customer_name ?? "-"}
                </p>
                <p>
                  <span className="text-muted-foreground">Vencimento:</span>{" "}
                  {selectedSale.due_date ? selectedSale.due_date : "-"}
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Produto</th>
                      <th className="px-3 py-2 font-medium">Qtd.</th>
                      <th className="px-3 py-2 font-medium">Preco</th>
                      <th className="px-3 py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.sale_items.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="px-3 py-2">{item.product?.name ?? "-"}</td>
                        <td className="px-3 py-2">{item.quantity}</td>
                        <td className="px-3 py-2">{formatCurrencyBRL(item.unit_price)}</td>
                        <td className="px-3 py-2">{formatCurrencyBRL(item.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <div className="border-b border-border bg-muted/50 px-3 py-2 text-sm font-medium">
                  Historico de pagamentos
                </div>
                <table className="min-w-full text-sm">
                  <thead className="text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Data</th>
                      <th className="px-3 py-2 font-medium">Metodo</th>
                      <th className="px-3 py-2 font-medium">Valor</th>
                      <th className="px-3 py-2 font-medium">Observacao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.sale_payments.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-muted-foreground" colSpan={4}>
                          Nenhum pagamento registrado.
                        </td>
                      </tr>
                    ) : (
                      selectedSale.sale_payments.map((payment) => (
                        <tr key={payment.id} className="border-t border-border">
                          <td className="px-3 py-2">{formatDateTimeBR(payment.paid_at)}</td>
                          <td className="px-3 py-2">{payment.payment_method}</td>
                          <td className="px-3 py-2">{formatCurrencyBRL(payment.amount)}</td>
                          <td className="px-3 py-2">{payment.notes ?? "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {selectedSale.notes ? (
                <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground">
                  <span className="font-medium">Observacao:</span> {selectedSale.notes}
                </p>
              ) : null}

              <p className="text-right text-lg font-semibold text-foreground">
                Total: {formatCurrencyBRL(selectedSale.total_amount)}
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(paymentSale)} onOpenChange={() => setPaymentSale(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          {paymentSale ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Venda:</span> {paymentSale.id.slice(0, 8)}
                </p>
                <p>
                  <span className="text-muted-foreground">Cliente:</span> {paymentSale.customer_name ?? "Nao informado"}
                </p>
                <p>
                  <span className="text-muted-foreground">Saldo atual:</span> {formatCurrencyBRL(getOpenAmount(paymentSale))}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-date">Data e hora do pagamento</Label>
                <Input
                  id="payment-date"
                  type="datetime-local"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Forma de pagamento</Label>
                <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value ?? "Pix")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-amount">Valor (R$)</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  min={0.01}
                  max={getOpenAmount(paymentSale)}
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-notes">Observacao</Label>
                <Input
                  id="payment-notes"
                  value={paymentNotes}
                  onChange={(event) => setPaymentNotes(event.target.value)}
                  placeholder="Ex.: pagamento parcial da semana"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPaymentSale(null)}>
                  Cancelar
                </Button>
                <Button onClick={submitPayment} disabled={isPaymentPending}>
                  {isPaymentPending ? "Salvando..." : "Confirmar pagamento"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
