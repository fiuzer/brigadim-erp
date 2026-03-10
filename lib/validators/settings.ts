import { z } from "zod";

export const settingsSchema = z.object({
  company_name: z.string().min(2, "Informe o nome da empresa"),
  company_logo_url: z.string().url("URL inválida").nullable().optional().or(z.literal("")),
  default_currency: z.string(),
  timezone: z.string(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
