export function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias.",
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function getSupabaseServiceEnv() {
  const { supabaseUrl } = getSupabaseEnv();
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceRoleKey) {
    throw new Error("Variavel SUPABASE_SERVICE_ROLE_KEY e obrigatoria para operacoes administrativas.");
  }

  return { supabaseUrl, supabaseServiceRoleKey };
}
