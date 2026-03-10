import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getProfileOrRedirect } from "@/features/auth/server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await getProfileOrRedirect();

  return (
    <AppShell
      email={user.email ?? null}
      profile={{ full_name: profile.full_name, role: profile.role }}
    >
      {children}
    </AppShell>
  );
}
