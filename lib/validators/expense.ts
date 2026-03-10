import { z } from "zod";

export const expenseSchema = z.object({
  id: z.string().uuid().optional(),
  expense_date: z.string().min(1, "Data é obrigatória"),
  category_id: z.string().uuid("Categoria inválida").nullable().optional(),
  description: z.string().min(3, "Descrição é obrigatória").max(200),
  amount: z.number().positive("Valor deve ser maior que zero"),
  notes: z.string().max(500).nullable().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
