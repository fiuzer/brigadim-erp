"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/features/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLES } from "@/lib/constants/roles";
import { createUserSchema } from "@/lib/validators/user";

const updateUserSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(ROLES),
  is_active: z.boolean(),
});

export async function updateUserAccessAction(input: z.infer<typeof updateUserSchema>) {
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Dados de usuario invalidos.");
  }

  const { supabase } = await requirePermission("users:write");
  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role, is_active: parsed.data.is_active })
    .eq("id", parsed.data.id);

  if (error) {
    throw new Error(`Erro ao atualizar usuario: ${error.message}`);
  }

  revalidatePath("/usuarios");
}

export async function createUserAccessAction(input: z.infer<typeof createUserSchema>) {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados de usuario invalidos.");
  }

  const { supabase } = await requirePermission("users:write");
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.full_name,
    },
  });

  if (error || !data.user) {
    const errorMessage = (error?.message ?? "").toLowerCase();

    if (errorMessage.includes("already")) {
      throw new Error("Ja existe um usuario com este e-mail.");
    }

    if (errorMessage.includes("invalid api key") || errorMessage.includes("user not allowed")) {
      throw new Error(
        "Configuracao invalida do Supabase: verifique SUPABASE_SERVICE_ROLE_KEY (deve ser service_role).",
      );
    }

    throw new Error(`Erro ao criar usuario: ${error?.message ?? "Falha desconhecida."}`);
  }

  let profileConfigured = false;
  let profileErrorMessage = "Perfil nao encontrado apos criar o usuario.";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: updatedRows, error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: parsed.data.full_name,
        role: parsed.data.role,
        is_active: parsed.data.is_active,
      })
      .eq("id", data.user.id)
      .select("id")
      .limit(1);

    if (!profileError && updatedRows && updatedRows.length > 0) {
      profileConfigured = true;
      break;
    }

    profileErrorMessage = profileError?.message ?? profileErrorMessage;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  if (!profileConfigured) {
    await adminClient.auth.admin.deleteUser(data.user.id);
    throw new Error(`Erro ao configurar perfil do usuario: ${profileErrorMessage}`);
  }

  revalidatePath("/usuarios");
}