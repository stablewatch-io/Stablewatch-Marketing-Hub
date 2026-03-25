import { NextResponse } from "next/server";
import { requireApproved } from "@/lib/auth";
import { runNewsPipeline } from "@/lib/news-pipeline";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function POST() {
  const auth = await requireApproved();
  if (auth instanceof NextResponse) return auth;

  // 5-min debounce: check last job
  const supabase = createServiceRoleClient();
  const { data: lastJob } = await supabase
    .from("aggregation_jobs")
    .select("started_at")
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (lastJob) {
    const elapsed = Date.now() - new Date(lastJob.started_at).getTime();
    if (elapsed < 5 * 60 * 1000) {
      return NextResponse.json(
        { error: "Pipeline ran recently. Wait 5 minutes between runs." },
        { status: 429 }
      );
    }
  }

  try {
    const result = await runNewsPipeline(auth.user.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pipeline failed" },
      { status: 500 }
    );
  }
}
