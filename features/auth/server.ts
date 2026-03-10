/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/types/app";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { can } from "@/features/auth/permissions";
import type { Permission } from "@/lib/constants/roles";

export async function getSessionOrRedirect() {
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function getProfileOrRedirect() {
  const { supabase, user } = await getSessionOrRedirect();

  // 1) Caminho principal: consulta com sessao do usuario (respeitando RLS).
  const { data: ownProfileRow, error: ownProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  let data = ownProfileRow as Profile | null;
  let adminFallbackError: string | null = null;

  // 2) Fallback: consulta administrativa (evita bloqueio por configuracao de RLS).
  if (!data) {
    try {
      const admin = createAdminClient() as any;
      await admin.from("profiles").insert(
        {
          id: user.id,
          full_name:
            (user.user_metadata?.full_name as string | undefined) ??
            user.email?.split("@")[0] ??
            "Usuario",
          role: "visualizador",
          is_active: true,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );

      const { data: adminProfileRow, error: adminProfileError } = await admin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (adminProfileError) {
        throw adminProfileError;
      }
      data = (adminProfileRow as Profile | null) ?? null;
    } catch (error) {
      adminFallbackError =
        error instanceof Error ? error.message : "Falha desconhecida no fallback administrativo.";
    }
  }

  // 3) Sem perfil, falha explicita para nao mascarar problema de permissao/chave.
  if (!data) {
    const ownErrorPart = ownProfileError?.message
      ? `Erro ao ler perfil do usuario: ${ownProfileError.message}.`
      : "Perfil do usuario nao encontrado.";
    const adminErrorPart = adminFallbackError
      ? ` Fallback admin falhou: ${adminFallbackError}.`
      : "";

    throw new Error(
      `${ownErrorPart}${adminErrorPart} Verifique grants/policies da tabela public.profiles e a SUPABASE_SERVICE_ROLE_KEY.`,
    );
  }

  if (!data.is_active) {
    redirect("/login");
  }

  return { supabase, user, profile: data as Profile };
}

export async function requirePermission(permission: Permission) {
  const { supabase, user, profile } = await getProfileOrRedirect();
  if (!can(profile.role, permission)) {
    redirect("/dashboard?erro=permissao");
  }

  return { supabase, user, profile };
}
