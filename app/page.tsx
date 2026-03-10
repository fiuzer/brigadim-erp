import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission, type UserRole } from "@/lib/constants/roles";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileRow as { role: UserRole; is_active: boolean } | null;

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  const role = profile.role;
  redirect(hasPermission(role, "sales:read") ? "/vendas" : "/dashboard");
}
