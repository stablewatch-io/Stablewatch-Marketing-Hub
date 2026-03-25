import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type AuthResult = {
  user: { id: string; email: string };
  profile: {
    id: string;
    display_name: string;
    role: string;
    is_approved: boolean;
  };
};

export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role, is_approved")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 401 });
  }

  return { user: { id: user.id, email: user.email! }, profile };
}

export async function requireApproved(): Promise<AuthResult | NextResponse> {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  if (!result.profile.is_approved) {
    return NextResponse.json(
      { error: "Account not approved" },
      { status: 403 }
    );
  }

  return result;
}

export async function requireAdmin(): Promise<AuthResult | NextResponse> {
  const result = await requireApproved();
  if (result instanceof NextResponse) return result;

  if (result.profile.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  return result;
}
