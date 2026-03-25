import { NextRequest, NextResponse } from "next/server";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  //const auth = await requireApproved();
  //if (auth instanceof NextResponse) return auth;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? "pending";
  const relevantOnly = searchParams.get("relevant_only") !== "false";

  const supabase = await createClient();

  let query = supabase
    .from("news_articles")
    .select(
      `
      *,
      news_reviews!inner (
        id, ai_relevant, ai_score, ai_reasoning, ai_summary, ai_category,
        human_status, is_cleared, reviewed_by, reviewed_at,
        reviewer:profiles!reviewed_by (display_name)
      )
    `
    )
    .order("published_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("news_reviews.human_status", status);
  }

  if (relevantOnly) {
    query = query.eq("news_reviews.ai_relevant", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
