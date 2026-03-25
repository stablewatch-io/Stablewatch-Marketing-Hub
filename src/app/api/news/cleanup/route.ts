import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function POST() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const supabase = createServiceRoleClient();
  const results: string[] = [];

  // Remove rejected reviews > 7 days
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();
  const { count: rejectedCount } = await supabase
    .from("news_reviews")
    .delete({ count: "exact" })
    .eq("human_status", "rejected")
    .lt("created_at", sevenDaysAgo);
  results.push(`Deleted ${rejectedCount ?? 0} rejected reviews > 7 days`);

  // Remove pending reviews > 14 days
  const fourteenDaysAgo = new Date(
    Date.now() - 14 * 24 * 60 * 60 * 1000
  ).toISOString();
  const { count: pendingCount } = await supabase
    .from("news_reviews")
    .delete({ count: "exact" })
    .eq("human_status", "pending")
    .lt("created_at", fourteenDaysAgo);
  results.push(`Deleted ${pendingCount ?? 0} pending reviews > 14 days`);

  // Keep max 200 editorial_feedback
  const { data: feedbackIds } = await supabase
    .from("editorial_feedback")
    .select("id")
    .order("decided_at", { ascending: false })
    .range(200, 100000);
  if (feedbackIds && feedbackIds.length > 0) {
    const ids = feedbackIds.map((f) => f.id);
    await supabase.from("editorial_feedback").delete().in("id", ids);
    results.push(`Trimmed ${ids.length} old editorial_feedback entries`);
  } else {
    results.push("Editorial feedback within limit");
  }

  // Keep max 100 aggregation_jobs
  const { data: jobIds } = await supabase
    .from("aggregation_jobs")
    .select("id")
    .order("started_at", { ascending: false })
    .range(100, 100000);
  if (jobIds && jobIds.length > 0) {
    const ids = jobIds.map((j) => j.id);
    await supabase.from("aggregation_jobs").delete().in("id", ids);
    results.push(`Trimmed ${ids.length} old aggregation_jobs`);
  } else {
    results.push("Aggregation jobs within limit");
  }

  return NextResponse.json({ results });
}
