import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { runNewsPipeline } from "@/lib/news-pipeline";

export async function GET() {
  const supabase = createServiceRoleClient();

  const { data: job } = await supabase
    .from("aggregation_jobs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json(job);
}

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Debounce: skip if last completed job < 5 min ago
  const serviceClient = createServiceRoleClient();
  const { data: lastJob } = await serviceClient
    .from("aggregation_jobs")
    .select("completed_at")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  if (lastJob?.completed_at) {
    const elapsed = Date.now() - new Date(lastJob.completed_at).getTime();
    if (elapsed < 5 * 60 * 1000) {
      return NextResponse.json({
        skipped: true,
        reason: "Last fetch was less than 5 minutes ago",
      });
    }
  }

  try {
    const result = await runNewsPipeline(user.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pipeline failed" },
      { status: 500 }
    );
  }
}