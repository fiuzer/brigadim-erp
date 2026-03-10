import { z } from "zod";

export const saleItemSchema = z.object({
  product_id: z.string().uuid("Produto inválido"),
  quantity: z.number().int().positive("Quantidade deve ser maior que zero"),
  unit_price: z.number().positive("Preço unitário deve ser maior que zero"),
});

export const saleSchema = z.object({
  sold_at: z.string().min(1, "Data da venda é obrigatória"),
  payment_method: z.enum([
    "Pix",
    "Dinheiro",
    "Cartão de Crédito",
    "Cartão de Débito",
    "Transferência",
    "Outro",
  ]),
  discount_amount: z.number().min(0),
  notes: z.string().max(500).nullable().optional(),
  items: z.array(saleItemSchema).min(1, "Adicione ao menos um item"),
});

export type SaleFormValues = z.infer<typeof saleSchema>;
