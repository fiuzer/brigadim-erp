import { z } from "zod";

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  category_id: z.string().uuid().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  sku: z.string().max(80).nullable().optional(),
  production_cost: z.number().min(0),
  sale_price: z.number().positive("Preço de venda deve ser maior que zero"),
  stock_quantity: z.number().int().min(0),
  min_stock: z.number().int().min(0),
  is_active: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
