"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { registerInventoryMovementAction } from "@/features/inventory/actions";
import { inventoryMovementSchema, type InventoryMovementValues } from "@/lib/validators/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ProductOption = {
  id: string;
  name: string;
};

type InventoryMovementFormProps = {
  products: ProductOption[];
  disabled?: boolean;
};

const defaultValues: InventoryMovementValues = {
  product_id: "",
  movement_type: "Entrada",
  quantity: 1,
  reason: "",
  notes: "",
};

export function InventoryMovementForm({ products, disabled }: InventoryMovementFormProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<InventoryMovementValues>({
    resolver: zodResolver(inventoryMovementSchema),
    defaultValues,
  });
  const selectedProductId = form.watch("product_id");
  const selectedProductLabel =
    products.find((product) => product.id === selectedProductId)?.name ?? "";

  const onSubmit = (values: InventoryMovementValues) => {
    startTransition(async () => {
      try {
        await registerInventoryMovementAction(values);
        toast.success("Movimentação registrada com sucesso.");
        form.reset(defaultValues);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao registrar movimentação.");
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>Produto</Label>
          <Select
            value={selectedProductId}
            onValueChange={(value) => form.setValue("product_id", value ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um produto">{selectedProductLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-red-500">{form.formState.errors.product_id?.message}</p>
        </div>

        <div className="space-y-2">
          <Label>Tipo de movimentação</Label>
          <Select
            value={form.watch("movement_type")}
            onValueChange={(value) =>
              form.setValue(
                "movement_type",
                value as InventoryMovementValues["movement_type"],
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Entrada">Entrada</SelectItem>
              <SelectItem value="Saída">Saída</SelectItem>
              <SelectItem value="Ajuste">Ajuste</SelectItem>
              <SelectItem value="Cancelamento">Cancelamento/Estorno</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">
            {form.watch("movement_type") === "Ajuste"
              ? "Novo estoque (unidades)"
              : "Quantidade"}
          </Label>
          <Input
            id="quantity"
            type="number"
            {...form.register("quantity", { valueAsNumber: true })}
          />
          <p className="text-xs text-red-500">{form.formState.errors.quantity?.message}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Motivo</Label>
          <Input id="reason" {...form.register("reason")} placeholder="Ex.: reposição semanal" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Observação</Label>
          <Textarea id="notes" rows={2} {...form.register("notes")} />
        </div>
      </div>

      <Button type="submit" disabled={isPending || disabled}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Registrando...
          </>
        ) : (
          "Registrar movimentação"
        )}
      </Button>
    </form>
  );
}
