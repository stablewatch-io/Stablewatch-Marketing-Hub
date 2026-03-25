import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function isServiceRoleRequest(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  if (!auth || !SERVICE_ROLE_KEY) return false;
  const token = auth.replace(/^Bearer\s+/i, "");
  return token === SERVICE_ROLE_KEY;
}

/**
 * Create a Supabase client with service-role privileges (bypasses RLS).
 */
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    SERVICE_ROLE_KEY
  );
}
