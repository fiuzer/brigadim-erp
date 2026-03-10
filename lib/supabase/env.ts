function sanitize(value?: string) {
  if (!value) return "";
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function readJwtRole(token: string): string | null {
  if (!token.startsWith("eyJ")) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      role?: unknown;
    };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export function getSupabaseEnv() {
  const supabaseUrl = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Variaveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY sao obrigatorias.",
    );
  }

  if (!supabaseUrl.startsWith("https://")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL invalida. Use a URL HTTPS do projeto no Supabase.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function getSupabaseServiceEnv() {
  const { supabaseUrl } = getSupabaseEnv();

  // Suporta dois nomes para facilitar ambientes diferentes (ex.: Vercel).
  const supabaseServiceRoleKey = sanitize(
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE,
  );

  if (!supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY e obrigatoria para operacoes administrativas (criacao de usuarios).",
    );
  }

  const looksLikePublishable =
    supabaseServiceRoleKey.startsWith("sb_publishable_") ||
    supabaseServiceRoleKey.startsWith("sb_anon_");

  const looksLikeServiceRoleFormat =
    supabaseServiceRoleKey.startsWith("sb_secret_") ||
    supabaseServiceRoleKey.startsWith("eyJ");

  if (looksLikePublishable || !looksLikeServiceRoleFormat) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY invalida. Use a chave secreta service_role do Supabase, nunca a publishable/anon.",
    );
  }

  const jwtRole = readJwtRole(supabaseServiceRoleKey);
  if (jwtRole && jwtRole !== "service_role") {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY invalida: JWT com role '${jwtRole}'. Use a chave com role 'service_role'.`,
    );
  }

  return { supabaseUrl, supabaseServiceRoleKey };
}