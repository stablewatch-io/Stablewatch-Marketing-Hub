import { NextRequest, NextResponse } from "next/server";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const auth = await requireApproved();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const supabase = await createClient();

  if (body.clear_all) {
    const { error } = await supabase
      .from("news_reviews")
      .update({ is_cleared: true })
      .eq("human_status", "approved")
      .eq("is_cleared", false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ cleared: "all" });
  }

  if (Array.isArray(body.article_ids) && body.article_ids.length > 0) {
    const { error } = await supabase
      .from("news_reviews")
      .update({ is_cleared: true })
      .in("article_id", body.article_ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ cleared: body.article_ids.length });
  }

  return NextResponse.json(
    { error: "Provide article_ids or clear_all" },
    { status: 400 }
  );
}
