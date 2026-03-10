"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  createExpenseAction,
  updateExpenseAction,
} from "@/features/expenses/actions";
import { expenseSchema, type ExpenseFormValues } from "@/lib/validators/expense";
import { getDateInputValueInTimeZone } from "@/lib/utils/timezone";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type CategoryOption = {
  id: string;
  name: string;
};

type ExpenseFormDialogProps = {
  categories: CategoryOption[];
  expense?: ExpenseFormValues;
  triggerLabel?: string;
};

const defaultValues: ExpenseFormValues = {
  expense_date: getDateInputValueInTimeZone(),
  category_id: null,
  description: "",
  amount: 0,
  notes: "",
};

export function ExpenseFormDialog({
  categories,
  expense,
  triggerLabel = "Registrar Despesa",
}: ExpenseFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isEdit = Boolean(expense?.id);
  const values = useMemo(() => ({ ...defaultValues, ...expense }), [expense]);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: values,
    values,
  });
  const selectedCategoryId = form.watch("category_id");
  const selectedCategoryLabel = selectedCategoryId
    ? (categories.find((category) => category.id === selectedCategoryId)?.name ?? "")
    : "Sem categoria";

  const onSubmit = (input: ExpenseFormValues) => {
    startTransition(async () => {
      try {
        if (isEdit) {
          await updateExpenseAction({ ...input, id: expense?.id });
          toast.success("Despesa atualizada.");
        } else {
          await createExpenseAction(input);
          toast.success("Despesa cadastrada.");
        }
        setOpen(false);
        form.reset(defaultValues);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao salvar despesa.");
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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Despesa" : "Registrar Despesa"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense_date">Data</Label>
            <Input id="expense_date" type="date" {...form.register("expense_date")} />
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
                <SelectValue placeholder="Selecione a categoria">{selectedCategoryLabel}</SelectValue>
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
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" {...form.register("description")} />
            <p className="text-xs text-red-500">{form.formState.errors.description?.message}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...form.register("amount", { valueAsNumber: true })}
            />
            <p className="text-xs text-red-500">{form.formState.errors.amount?.message}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observação</Label>
            <Textarea id="notes" rows={3} {...form.register("notes")} />
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
                "Registrar despesa"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
