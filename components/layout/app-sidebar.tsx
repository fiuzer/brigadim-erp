"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Candy } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/constants/roles";
import { hasPermission } from "@/lib/constants/roles";

type AppSidebarProps = {
  role: UserRole;
  onNavigate?: () => void;
};

export function AppSidebar({ role, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-[#2B1E17] text-[#f7efe9]">
      <div className="flex items-center gap-2 border-b border-[#4b382d] px-5 py-5">
        <div className="rounded-lg bg-gradient-to-br from-[#907761] to-[#B96A75] p-2 text-[#fffaf8]">
          <Candy className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#fffaf8]">Brigadim</p>
          <p className="text-xs text-[#cfbfb1]">Gestão da Doçaria</p>
        </div>
      </div>

      <nav className="space-y-1 px-3 py-4">
        {NAV_ITEMS.filter((item) =>
          item.requiredPermission ? hasPermission(role, item.requiredPermission) : true,
        ).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-[#B96A75] text-[#fffaf8]"
                  : "text-[#e7d9cf] hover:bg-[#3a2b22] hover:text-[#fffaf8]",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
