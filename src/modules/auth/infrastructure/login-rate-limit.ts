import { createHmac } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/infrastructure/supabase/database.types";

const VERCEL_CLIENT_IP_HEADER = "x-vercel-forwarded-for";

type ServerSupabaseClient = SupabaseClient<Database>;

export function getLoginClientKey(headers: Headers, secret: string): string {
  const clientAddress = headers.get(VERCEL_CLIENT_IP_HEADER)?.split(",")[0]?.trim() || "unknown";

  return createHmac("sha256", secret).update(clientAddress).digest("hex");
}

export async function reserveLoginAttempt(
  supabase: ServerSupabaseClient,
  clientKey: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("reserve_login_attempt", {
    p_client_key: clientKey,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function clearLoginAttempts(
  supabase: ServerSupabaseClient,
  clientKey: string,
): Promise<void> {
  const { error } = await supabase.rpc("clear_login_attempts", {
    p_client_key: clientKey,
  });

  if (error) {
    throw error;
  }
}
