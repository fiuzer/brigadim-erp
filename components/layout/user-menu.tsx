"use client";

import { useRouter } from "next/navigation";
import { LogOut, UserCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABELS, type UserRole } from "@/lib/constants/roles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
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
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="space-y-1">
          <p className="text-sm font-medium leading-none">{name ?? "Usuário"}</p>
          <p className="text-xs font-normal text-[#907761]">{email ?? "Sem e-mail"}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2">
          <UserCircle2 className="h-4 w-4" />
          Perfil de acesso: {ROLE_LABELS[role]}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="gap-2 text-red-600 focus:text-red-700">
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
