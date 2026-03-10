import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { getSupabaseServiceEnv } from "@/lib/supabase/env";

export function createAdminClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseServiceEnv();

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
