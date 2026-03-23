import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * Check if the request is authenticated via service-role key (for n8n / external services).
 * Expects: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 */
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
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    SERVICE_ROLE_KEY,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}
