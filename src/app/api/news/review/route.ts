import { NextRequest, NextResponse } from "next/server";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const auth = await requireApproved();
  if (auth instanceof NextResponse) return auth;

  const { article_id, status, notes } = await request.json();

  if (!article_id || !["approved", "rejected"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid article_id or status" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: review, error: reviewError } = await supabase
    .from("news_reviews")
    .update({
      human_status: status,
      reviewed_by: auth.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("article_id", article_id)
    .select()
    .single();

  if (reviewError) {
    return NextResponse.json({ error: reviewError.message }, { status: 500 });
  }

  await supabase.from("editorial_feedback").insert({
    article_id,
    decision: status,
    reason: notes ?? null,
    decided_by: auth.user.id,
    decided_at: new Date().toISOString(),
  });

  return NextResponse.json(review);
}
