import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const channel = req.nextUrl.searchParams.get("channel");

  if (!channel) {
    return NextResponse.json(
      { error: "channel parameter required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("global_ai_settings")
    .select("tone_of_voice, icp")
    .eq("channel", channel)
    .single();

  if (error) {
    // Return defaults if no record exists
    return NextResponse.json({ tone_of_voice: "", icp: "" });
  }

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { channel, tone_of_voice, icp } = await req.json();

  const { data, error } = await supabase
    .from("global_ai_settings")
    .upsert(
      {
        channel,
        tone_of_voice,
        icp,
        updated_by: user.id,
      },
      { onConflict: "channel" }
    )
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
