import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#2B1E17] px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(185,106,117,0.45),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(144,119,97,0.4),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(185,106,117,0.25),transparent_35%)]" />
      {children}
    </div>
  );
}
