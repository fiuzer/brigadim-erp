"use server";

import { revalidatePath } from "next/cache";
import type { SettingsFormValues } from "@/lib/validators/settings";
import { requirePermission } from "@/features/auth/server";

export async function updateSettingsAction(input: SettingsFormValues) {
  const { supabase, user } = await requirePermission("settings:write");

  const { error } = await supabase.from("app_settings").upsert({
    id: 1,
    company_name: input.company_name,
    company_logo_url: input.company_logo_url || null,
    default_currency: input.default_currency,
    timezone: input.timezone,
    updated_by: user.id,
  });

  if (error) {
    throw new Error(`Erro ao atualizar configurações: ${error.message}`);
  }

  revalidatePath("/configuracoes");
}
