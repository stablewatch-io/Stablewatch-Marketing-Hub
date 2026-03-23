import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [contentRes, pendingNewsRes, historyRes] = await Promise.all([
    supabase
      .from("generated_content")
      .select("type, status"),
    supabase
      .from("news_reviews")
      .select("id")
      .eq("human_status", "pending"),
    supabase
      .from("formatting_history")
      .select("id")
      .gte(
        "created_at",
        new Date(Date.now() - 7 * 86400000).toISOString()
      ),
  ]);

  const content = contentRes.data ?? [];
  const tweetCount = content.filter((c) => c.type === "tweet").length;
  const telegramCount = content.filter((c) => c.type === "telegram").length;
  const publishedCount = content.filter((c) => c.status === "published").length;
  const draftCount = content.filter((c) => c.status === "draft").length;

  const totalContent = tweetCount + telegramCount;
  const twitterPct = totalContent > 0 ? Math.round((tweetCount / totalContent) * 100) : 50;
  const telegramPct = totalContent > 0 ? Math.round((telegramCount / totalContent) * 100) : 30;
  const otherPct = Math.max(0, 100 - twitterPct - telegramPct);

  return NextResponse.json({
    totalDrafts: draftCount,
    totalPublished: publishedCount,
    totalContent,
    pendingNews: pendingNewsRes.data?.length ?? 0,
    recentFormats: historyRes.data?.length ?? 0,
    channels: {
      twitter: twitterPct,
      telegram: telegramPct,
      other: otherPct,
    },
  });
}
