import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/constants/options";

export const saleItemSchema = z.object({
  product_id: z.string().uuid("Produto invalido"),
  quantity: z.number().int().positive("Quantidade deve ser maior que zero"),
  unit_price: z.number().positive("Preco unitario deve ser maior que zero"),
});

export const saleSchema = z
  .object({
    sold_at: z.string().min(1, "Data da venda e obrigatoria"),
    payment_method: z.enum(PAYMENT_METHODS),
    payment_timing: z.enum(["na_hora", "em_aberto"]),
    customer_name: z.string().max(120).nullable().optional(),
    due_date: z.string().nullable().optional(),
    initial_payment_amount: z.number().min(0),
    discount_amount: z.number().min(0),
    notes: z.string().max(500).nullable().optional(),
    items: z.array(saleItemSchema).min(1, "Adicione ao menos um item"),
  })
  .superRefine((value, ctx) => {
    const subtotal = value.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
      0,
    );
    const total = Math.max(0, subtotal - Number(value.discount_amount || 0));

    if (value.initial_payment_amount > total) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["initial_payment_amount"],
        message: "Pagamento inicial nao pode ser maior que o total da venda",
      });
    }

    if (value.payment_timing === "em_aberto") {
      if (!value.customer_name?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customer_name"],
          message: "Informe o nome do cliente para venda em aberto",
        });
      }

      if (!value.due_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["due_date"],
          message: "Informe a data de vencimento",
        });
      }
    }
  });

export type SaleFormValues = z.infer<typeof saleSchema>;
