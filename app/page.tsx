import { redirect } from "next/navigation";
import { getProfileOrRedirect } from "@/features/auth/server";
import { hasPermission, type UserRole } from "@/lib/constants/roles";

export default async function Home() {
  const { profile } = await getProfileOrRedirect();
  const profileData = profile as { role: UserRole; is_active: boolean };
  redirect(hasPermission(profileData.role, "sales:read") ? "/vendas" : "/dashboard");
}
