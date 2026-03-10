import { requirePermission } from "@/features/auth/server";

export type UserQueryRow = {
  id: string;
  full_name: string | null;
  role: "administrador" | "financeiro" | "vendas" | "estoque" | "visualizador";
  is_active: boolean;
  created_at: string;
};

export async function getUsersPageData() {
  const { supabase } = await requirePermission("users:read");
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,role,is_active,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao carregar usuários: ${error.message}`);
  }

  return (data ?? []) as unknown as UserQueryRow[];
}
