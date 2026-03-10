import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export type ProfileName = { full_name: string | null } | null;

export async function getProfileNameMap(
  supabase: SupabaseClient<Database>,
  userIds: Array<string | null | undefined>,
) {
  const uniqueIds = Array.from(
    new Set(userIds.filter((id): id is string => Boolean(id))),
  );

  if (uniqueIds.length === 0) {
    return new Map<string, string | null>();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name")
    .in("id", uniqueIds);

  if (error || !data) {
    return new Map<string, string | null>();
  }

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    full_name: string | null;
  }>;

  return new Map<string, string | null>(
    rows.map((profile) => [profile.id, profile.full_name]),
  );
}

export function profileFromMap(
  profileMap: Map<string, string | null>,
  userId: string | null | undefined,
): ProfileName {
  if (!userId) return null;
  if (!profileMap.has(userId)) return null;
  return { full_name: profileMap.get(userId) ?? null };
}
