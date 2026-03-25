import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { user_id, action } = await request.json();

  if (!user_id || !action?.type) {
    return NextResponse.json(
      { error: "Missing user_id or action" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  switch (action.type) {
    case "approve": {
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: true })
        .eq("id", user_id);
      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "reject": {
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: false })
        .eq("id", user_id);
      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "set_role": {
      if (!["admin", "user"].includes(action.role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      const { error } = await supabase
        .from("profiles")
        .update({ role: action.role })
        .eq("id", user_id);
      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "delete": {
      const serviceClient = createServiceRoleClient();
      const { error } = await serviceClient.auth.admin.deleteUser(user_id);
      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      await supabase.from("profiles").delete().eq("id", user_id);
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json(
        { error: "Unknown action type" },
        { status: 400 }
      );
  }
}
