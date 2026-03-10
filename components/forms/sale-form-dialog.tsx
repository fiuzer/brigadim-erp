"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createSaleAction } from "@/features/sales/actions";
import { saleSchema, type SaleFormValues } from "@/lib/validators/sale";
import { formatCurrencyBRL } from "@/lib/utils/format";
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

const nowInputValue = () => new Date().toISOString().slice(0, 16);

const defaultValues: SaleFormValues = {
  sold_at: nowInputValue(),
  payment_method: "Pix",
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
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0),
    [items],
  );
  const total = Math.max(0, subtotal - Number(form.watch("discount_amount") || 0));

  const onSubmit = (values: SaleFormValues) => {
    startTransition(async () => {
      try {
        await createSaleAction(values);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Registrar Venda</DialogTitle>
        </DialogHeader>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sold_at">Data e hora</Label>
              <Input id="sold_at" type="datetime-local" {...form.register("sold_at")} />
            </div>
            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select
                value={form.watch("payment_method")}
                onValueChange={(value) =>
                  form.setValue(
                    "payment_method",
                    value as SaleFormValues["payment_method"],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pix">Pix</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Itens da venda</h3>
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
                  className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-12"
                >
                  <div className="space-y-1 md:col-span-6">
                    <Label>Produto</Label>
                    <Select
                      value={selectedProductId || "selecionar"}
                      onValueChange={(value) => {
                        if (!value) return;
                        if (value === "selecionar") return;
                        form.setValue(`items.${index}.product_id`, value);
                        const product = products.find((item) => item.id === value);
                        if (product) {
                          form.setValue(`items.${index}.unit_price`, Number(product.sale_price));
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
                      {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-3">
                    <Label>Preço (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register(`items.${index}.unit_price`, { valueAsNumber: true })}
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
                      <Trash2 className="h-4 w-4 text-red-600" />
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
                type="number"
                step="0.01"
                {...form.register("discount_amount", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observação</Label>
              <Textarea id="notes" rows={2} {...form.register("notes")} />
            </div>
          </div>

          <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="flex items-center justify-between">
              <span className="text-slate-600">Subtotal</span>
              <strong>{formatCurrencyBRL(subtotal)}</strong>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-slate-600">Total</span>
              <strong className="text-lg text-slate-900">{formatCurrencyBRL(total)}</strong>
            </p>
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
