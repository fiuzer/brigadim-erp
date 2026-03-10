import { z } from "zod";
import { ROLES } from "@/lib/constants/roles";

export const createUserSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres.")
    .max(120, "Nome deve ter no maximo 120 caracteres."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("E-mail invalido."),
  password: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres.")
    .max(128, "Senha muito longa."),
  role: z.enum(ROLES),
  is_active: z.boolean(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
