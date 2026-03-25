import { NextResponse } from "next/server";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireApproved();
  if (auth instanceof NextResponse) return auth;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("news_reviews")
    .select(
      `
      *,
      article:news_articles (*),
      reviewer:profiles!reviewed_by (display_name)
    `
    )
    .eq("human_status", "approved")
    .eq("is_cleared", false)
    .order("reviewed_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
