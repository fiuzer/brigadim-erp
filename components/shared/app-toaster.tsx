"use client";

import { Toaster } from "@/components/ui/sonner";

export function AppToaster() {
  return (
    <Toaster
      richColors
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "border border-slate-200 shadow-lg",
        },
      }}
    />
  );
}
