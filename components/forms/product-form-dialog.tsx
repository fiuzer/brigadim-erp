"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { ProductFormValues } from "@/lib/validators/product";
import { productSchema } from "@/lib/validators/product";
import { createProductAction, updateProductAction } from "@/features/products/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type ProductCategory = {
  id: string;
  name: string;
};

type ProductRecord = ProductFormValues;

type ProductFormDialogProps = {
  categories: ProductCategory[];
  product?: ProductRecord;
  triggerLabel?: string;
};

const defaultValues: ProductFormValues = {
  name: "",
  category_id: null,
  description: "",
  sku: "",
  production_cost: 0,
  sale_price: 0,
  stock_quantity: 0,
  min_stock: 0,
  is_active: true,
};

export function ProductFormDialog({
  categories,
  product,
  triggerLabel = "Cadastrar Produto",
}: ProductFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const values = useMemo(() => ({ ...defaultValues, ...product }), [product]);
  const isEdit = Boolean(product?.id);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: values,
    values,
  });
  const selectedCategoryId = form.watch("category_id");
  const selectedCategoryLabel = selectedCategoryId
    ? (categories.find((category) => category.id === selectedCategoryId)?.name ?? "")
    : "Sem categoria";

  const onSubmit = (data: ProductFormValues) => {
    startTransition(async () => {
      try {
        if (isEdit) {
          await updateProductAction({ ...data, id: product?.id });
          toast.success("Produto atualizado com sucesso.");
        } else {
          await createProductAction(data);
          toast.success("Produto cadastrado com sucesso.");
        }
        setOpen(false);
        form.reset(defaultValues);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao salvar produto.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            {!isEdit ? <Plus className="h-4 w-4" /> : null}
            {triggerLabel}
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Produto" : "Cadastrar Produto"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...form.register("name")} />
              <p className="text-xs text-red-500">{form.formState.errors.name?.message}</p>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={selectedCategoryId ?? "sem-categoria"}
                onValueChange={(value) =>
                  form.setValue("category_id", value === "sem-categoria" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione">{selectedCategoryLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem-categoria">Sem categoria</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU/Código interno</Label>
              <Input id="sku" {...form.register("sku")} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" rows={3} {...form.register("description")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="production_cost">Custo de produção (R$)</Label>
              <Input
                id="production_cost"
                type="number"
                step="0.01"
                {...form.register("production_cost", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_price">Preço de venda (R$)</Label>
              <Input
                id="sale_price"
                type="number"
                step="0.01"
                {...form.register("sale_price", { valueAsNumber: true })}
              />
              <p className="text-xs text-red-500">{form.formState.errors.sale_price?.message}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Quantidade em estoque</Label>
              <Input
                id="stock_quantity"
                type="number"
                {...form.register("stock_quantity", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_stock">Estoque mínimo</Label>
              <Input id="min_stock" type="number" {...form.register("min_stock", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-slate-800">Produto ativo</p>
              <p className="text-xs text-slate-600">Produto visível para vendas e relatórios.</p>
            </div>
            <Switch checked={form.watch("is_active")} onCheckedChange={(checked) => form.setValue("is_active", checked)} />
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
              ) : isEdit ? (
                "Salvar alterações"
              ) : (
                "Cadastrar Produto"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
