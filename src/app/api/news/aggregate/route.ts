import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL ?? "";

export async function GET() {
  const supabase = await createClient();

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

  // Create a new aggregation job
  const { data: job, error } = await supabase
    .from("aggregation_jobs")
    .insert({
      status: "running",
      triggered_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire n8n webhook (non-blocking)
  if (N8N_WEBHOOK_URL) {
    fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: job.id }),
    }).catch(() => {
      // n8n webhook failure is non-fatal
    });
  }

  return NextResponse.json(job);
}
