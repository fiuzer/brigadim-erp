"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABELS, type UserRole } from "@/lib/constants/roles";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type UserMenuProps = {
  name: string | null;
  email: string | null;
  role: UserRole;
};

const initialsFromName = (name: string | null, email: string | null) => {
  if (name) {
    const names = name.trim().split(" ");
    return `${names[0]?.[0] ?? ""}${names[1]?.[0] ?? ""}`.toUpperCase();
  }

  return (email?.slice(0, 2) || "US").toUpperCase();
};

export function UserMenu({ name, email, role }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setOpen(false);
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível sair da conta.");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id="app-user-menu-trigger"
        render={
          <Button
            variant="ghost"
            className="h-auto items-center gap-3 rounded-full border border-[#d8c8bb] bg-[rgba(255,250,248,0.95)] px-2 py-1.5 hover:bg-[#f6eee8]"
          >
            <Avatar className="h-8 w-8 border border-[#d8c8bb]">
              <AvatarFallback className="bg-[#2B1E17] text-xs text-[#fffaf8]">
                {initialsFromName(name, email)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-left md:block">
              <span className="block text-xs text-[#907761]">{ROLE_LABELS[role]}</span>
              <span className="block text-sm font-medium text-[#2B1E17]">{name ?? "Usuário"}</span>
            </span>
          </Button>
        }
      />

      <PopoverContent align="end" className="w-64 gap-0 rounded-xl p-2">
        <div className="space-y-1 px-2 py-1.5">
          <p className="text-sm font-medium leading-none">{name ?? "Usuário"}</p>
          <p className="text-xs font-normal text-[#907761]">{email ?? "Sem e-mail"}</p>
        </div>

        <div className="my-1 h-px bg-border" />

        <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground">
          <UserCircle2 className="h-4 w-4" />
          Perfil de acesso: {ROLE_LABELS[role]}
        </div>

        <div className="my-1 h-px bg-border" />

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </PopoverContent>
    </Popover>
  );
}
