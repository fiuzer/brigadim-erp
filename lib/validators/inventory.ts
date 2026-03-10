import { z } from "zod";

export const inventoryMovementSchema = z.object({
  product_id: z.string().uuid("Produto inválido"),
  movement_type: z.enum(["Entrada", "Saída", "Ajuste", "Venda", "Cancelamento"]),
  quantity: z.number().int().positive("Quantidade deve ser maior que zero"),
  reason: z.string().max(120).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export type InventoryMovementValues = z.infer<typeof inventoryMovementSchema>;
