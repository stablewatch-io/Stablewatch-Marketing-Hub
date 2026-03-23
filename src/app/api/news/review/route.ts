import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { article_id, status, editorial_note } = body as {
    article_id: string;
    status: "approved" | "rejected";
    editorial_note?: string;
  };

  if (!article_id || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("news_reviews")
    .update({
      human_status: status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("article_id", article_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Save editorial note if provided (for RLHF feedback)
  if (editorial_note?.trim()) {
    await supabase.from("editorial_notes").insert({
      article_id,
      note: editorial_note,
      created_by: user.id,
    });
  }

  return NextResponse.json(data);
}
