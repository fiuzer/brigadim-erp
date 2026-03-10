/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/features/auth/server";
import type { DashboardWidgetLayout } from "@/lib/types/app";
import type { DashboardFilterState } from "@/lib/types/dashboard";
import type { Json } from "@/lib/types/database";

export async function saveDashboardLayoutAction(
  userId: string,
  layout: DashboardWidgetLayout[],
  filters: DashboardFilterState,
) {
  const { supabase, user } = await requirePermission("dashboard:edit");

  if (user.id !== userId) {
    throw new Error("Você só pode editar seu próprio dashboard.");
  }

  const { error } = await (supabase as any).from("dashboard_layouts").upsert({
    user_id: user.id,
    layout: layout as unknown as Json,
    default_filters: filters as unknown as Json,
  });

  if (error) {
    throw new Error(`Não foi possível salvar o layout: ${error.message}`);
  }

  revalidatePath("/dashboard");
}
