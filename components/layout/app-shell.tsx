"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Menu, Search } from "lucide-react";
import type { UserRole } from "@/lib/constants/roles";
import { UserMenu } from "@/components/layout/user-menu";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  children: ReactNode;
  profile: {
    full_name: string | null;
    role: UserRole;
  };
  email: string | null;
};

export function AppShell({ children, profile, email }: AppShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(185,106,117,0.2)_0%,_rgba(144,119,97,0.14)_35%,_#f7f2ee_100%)]">
      <div className="mx-auto grid min-h-screen max-w-[1700px] lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-[rgba(43,30,23,0.14)] lg:block">
          <AppSidebar role={profile.role} />
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 border-b border-[rgba(43,30,23,0.14)] bg-[rgba(255,250,248,0.86)] backdrop-blur">
            <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
              <div className="flex items-center gap-2">
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger
                    id="app-mobile-menu-trigger"
                    className="lg:hidden"
                    render={
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <Menu className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <SheetContent side="left" className="w-[290px] border-r-0 p-0">
                    <AppSidebar role={profile.role} onNavigate={() => setOpen(false)} />
                  </SheetContent>
                </Sheet>
                <div className="relative hidden sm:block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#907761]" />
                  <Input
                    id="app-global-search"
                    placeholder="Buscar no sistema..."
                    className="w-[240px] rounded-full border-[#d8c8bb] bg-[rgba(255,250,248,0.95)] pl-9"
                  />
                </div>
              </div>

              <UserMenu name={profile.full_name} email={email} role={profile.role} />
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
