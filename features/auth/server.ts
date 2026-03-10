/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/types/app";
import { createClient } from "@/lib/supabase/server";
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
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data || !data.is_active) {
    await supabase.auth.signOut();
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
