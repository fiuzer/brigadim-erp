import { requirePermission } from "@/features/auth/server";

export async function getSettingsData() {
  const { supabase } = await requirePermission("settings:read");
  const { data, error } = await supabase.from("app_settings").select("*").eq("id", 1).maybeSingle();

  if (error) {
    throw new Error(`Erro ao carregar configurações: ${error.message}`);
  }

  return (
    data ?? {
      company_name: "Brigadim",
      company_logo_url: null,
      default_currency: "BRL",
      timezone: "America/Sao_Paulo",
    }
  );
}
