"use client";

import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createSaleAction } from "@/features/sales/actions";
import { PAYMENT_METHODS } from "@/lib/constants/options";
import { saleSchema, type SaleFormValues } from "@/lib/validators/sale";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { getDateInputValueInTimeZone, getDateTimeInputValueInTimeZone } from "@/lib/utils/timezone";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ProductOption = {
  id: string;
  name: string;
  sale_price: number;
  stock_quantity: number;
};

type SaleFormDialogProps = {
  products: ProductOption[];
  disabled?: boolean;
};

const nowInputValue = () => getDateTimeInputValueInTimeZone();
const parseDecimal = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const raw = value.trim();
  if (!raw) return 0;
  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");
  let normalized = raw;
  if (hasComma && hasDot) {
    normalized = raw.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    normalized = raw.replace(",", ".");
  }
  normalized = normalized.replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
const parsePositiveInteger = (value: unknown) => {
  const parsed = Math.trunc(parseDecimal(value));
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return parsed;
};

const defaultValues: SaleFormValues = {
  sold_at: nowInputValue(),
  payment_method: "Pix",
  payment_timing: "na_hora",
  customer_name: "",
  due_date: "",
  initial_payment_amount: 0,
  discount_amount: 0,
  notes: "",
  items: [{ product_id: "", quantity: 1, unit_price: 0 }],
};

export function SaleFormDialog({ products, disabled = false }: SaleFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const items = form.watch("items");
  const paymentTiming = form.watch("payment_timing");
  const paymentTimingLabel = paymentTiming === "em_aberto" ? "Conta em aberto" : "Pagar agora";
  const discountAmount = parseDecimal(form.watch("discount_amount"));
  const initialPaymentAmount = parseDecimal(form.watch("initial_payment_amount"));
  const subtotal = items.reduce(
    (sum, item) =>
      sum + parsePositiveInteger(item.quantity) * parseDecimal(item.unit_price),
    0,
  );
  const total = Math.max(0, subtotal - discountAmount);

  useEffect(() => {
    if (paymentTiming === "na_hora") {
      form.setValue("initial_payment_amount", total, { shouldValidate: true });
      form.setValue("customer_name", "");
      form.setValue("due_date", "");
      return;
    }

    const current = Number(form.getValues("initial_payment_amount") || 0);
    if (current > total) {
      form.setValue("initial_payment_amount", total, { shouldValidate: true });
    }
  }, [paymentTiming, total, form]);

  const onSubmit = (values: SaleFormValues) => {
    startTransition(async () => {
      try {
        const normalizedItems = values.items.map((item) => ({
          ...item,
          quantity: parsePositiveInteger(item.quantity),
          unit_price: parseDecimal(item.unit_price),
        }));
        const normalizedDiscount = parseDecimal(values.discount_amount);
        const subtotalAmount = normalizedItems.reduce(
          (sum, item) => sum + item.quantity * item.unit_price,
          0,
        );
        const totalAmount = Math.max(0, subtotalAmount - normalizedDiscount);

        const payload: SaleFormValues = {
          ...values,
          items: normalizedItems,
          discount_amount: normalizedDiscount,
          initial_payment_amount:
            values.payment_timing === "na_hora"
              ? totalAmount
              : parseDecimal(values.initial_payment_amount),
          customer_name:
            values.payment_timing === "em_aberto" ? (values.customer_name?.trim() || null) : null,
          due_date: values.payment_timing === "em_aberto" ? values.due_date || null : null,
        };

        await createSaleAction(payload);
        toast.success("Venda registrada com sucesso.");
        setOpen(false);
        form.reset({ ...defaultValues, sold_at: nowInputValue() });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao registrar venda.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button disabled={disabled}>
            <Plus className="h-4 w-4" />
            Registrar Venda
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Registrar Venda</DialogTitle>
        </DialogHeader>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sold_at">Data e hora</Label>
              <Input id="sold_at" type="datetime-local" {...form.register("sold_at")} />
            </div>
            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select
                value={form.watch("payment_method")}
                onValueChange={(value) =>
                  form.setValue("payment_method", value as SaleFormValues["payment_method"], {
                    shouldValidate: true,
                  })
                }
              >
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
              <Label>Recebimento</Label>
              <Select
                value={paymentTiming}
                onValueChange={(value) =>
                  form.setValue("payment_timing", value as SaleFormValues["payment_timing"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue>{paymentTimingLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="na_hora">Pagar agora</SelectItem>
                  <SelectItem value="em_aberto">Conta em aberto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {paymentTiming === "em_aberto" ? (
            <div className="grid gap-4 rounded-xl border border-border bg-muted/30 p-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Cliente</Label>
                <Input id="customer_name" placeholder="Nome do cliente" {...form.register("customer_name")} />
                {form.formState.errors.customer_name?.message ? (
                  <p className="text-xs text-rose-600">{form.formState.errors.customer_name.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Vencimento</Label>
                <Input
                  id="due_date"
                  type="date"
                  min={getDateInputValueInTimeZone()}
                  {...form.register("due_date")}
                />
                {form.formState.errors.due_date?.message ? (
                  <p className="text-xs text-rose-600">{form.formState.errors.due_date.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="initial_payment_amount">Pagamento inicial (R$)</Label>
                <Input
                  id="initial_payment_amount"
                  type="text"
                  inputMode="decimal"
                  {...form.register("initial_payment_amount", {
                    setValueAs: parseDecimal,
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Saldo em aberto: {formatCurrencyBRL(Math.max(0, total - initialPaymentAmount))}
                </p>
                {form.formState.errors.initial_payment_amount?.message ? (
                  <p className="text-xs text-rose-600">{form.formState.errors.initial_payment_amount.message}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Pagamento integral sera registrado automaticamente no valor total da venda.
            </div>
          )}

          <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Itens da venda</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ product_id: "", quantity: 1, unit_price: 0 })}
              >
                <Plus className="h-4 w-4" />
                Adicionar item
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const selectedProductId = form.watch(`items.${index}.product_id`);
                const selectedProductLabel =
                  products.find((item) => item.id === selectedProductId)?.name ?? "";

                return (
                  <div
                    key={field.id}
                    className="grid gap-2 rounded-lg border border-border bg-card p-3 md:grid-cols-12"
                  >
                    <div className="space-y-1 md:col-span-6">
                      <Label>Produto</Label>
                      <Select
                        value={selectedProductId || "selecionar"}
                        onValueChange={(value) => {
                          if (!value || value === "selecionar") return;
                          form.setValue(`items.${index}.product_id`, value, { shouldValidate: true });
                          const product = products.find((item) => item.id === value);
                          if (product) {
                            form.setValue(`items.${index}.unit_price`, Number(product.sale_price), {
                              shouldValidate: true,
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto">
                            {selectedProductLabel}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="selecionar">Selecione...</SelectItem>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.stock_quantity} un.)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label>Qtd.</Label>
                      <Input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        {...form.register(`items.${index}.quantity`, {
                          setValueAs: parsePositiveInteger,
                        })}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-3">
                      <Label>Preco (R$)</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        {...form.register(`items.${index}.unit_price`, {
                          setValueAs: parseDecimal,
                        })}
                      />
                    </div>
                    <div className="flex items-end md:col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="discount_amount">Desconto (R$)</Label>
              <Input
                id="discount_amount"
                type="text"
                inputMode="decimal"
                {...form.register("discount_amount", {
                  setValueAs: parseDecimal,
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observacao</Label>
              <Textarea id="notes" rows={2} {...form.register("notes")} />
            </div>
          </div>

          <div className="grid gap-2 rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <strong>{formatCurrencyBRL(subtotal)}</strong>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">Total</span>
              <strong className="text-lg text-foreground">{formatCurrencyBRL(total)}</strong>
            </p>
            {paymentTiming === "em_aberto" ? (
              <p className="flex items-center justify-between">
                <span className="text-muted-foreground">Saldo em aberto</span>
                <strong className="text-[#B96A75]">
                  {formatCurrencyBRL(Math.max(0, total - initialPaymentAmount))}
                </strong>
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Registrar venda"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
