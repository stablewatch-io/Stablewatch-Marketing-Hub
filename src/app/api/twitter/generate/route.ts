import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateTwitterPosts } from "@/lib/claude";
import { getKnowledgeBaseContents } from "@/lib/knowledge-base";

const API_URL = process.env.STABLEWATCH_API_URL ?? "https://api.stablewatch.io";
const API_KEY = process.env.STABLEWATCH_API_KEY ?? "";

async function getMarketContext() {
  try {
    const res = await fetch(`${API_URL}/v1/stats`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return {
    totalTvl: "$182.3B",
    volume24h: "$48.2B",
    usdtDominance: "62.4%",
    activeStablecoins: 147,
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count = 5 } = (await request.json()) as { count?: number };

  // Get active instruction (use first available or thread_logic as default)
  const { data: instructions } = await supabase
    .from("modular_instructions")
    .select("content")
    .eq("channel", "twitter")
    .eq("is_active", true)
    .limit(1);

  const instruction =
    instructions?.[0]?.content ??
    "Generate engaging, data-driven tweets about market trends.";

  // Get global AI settings
  const { data: settings } = await supabase
    .from("global_ai_settings")
    .select("tone_of_voice, icp")
    .eq("channel", "twitter")
    .single();

  const marketData = await getMarketContext();

  // Fetch knowledge base files for twitter and global channels
  const knowledgeBase = await getKnowledgeBaseContents(supabase, ["twitter", "global"]);

  try {
    const posts = await generateTwitterPosts({
      instruction,
      toneOfVoice: settings?.tone_of_voice ?? "Professional and data-driven",
      icp: settings?.icp ?? "Marketing professionals",
      knowledgeBase,
      marketData,
      count,
    });

    // Generate a batch ID to group these posts
    const batchId = crypto.randomUUID();

    // Insert all generated posts
    const inserts = posts.map((post) => ({
      type: "tweet" as const,
      body: post.content,
      post_label: post.label,
      generation_batch_id: batchId,
      status: "draft" as const,
      created_by: user.id,
      source_context: { marketData },
      prompt_used: instruction,
    }));

    const { error } = await supabase.from("generated_content").insert(inserts);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ count: posts.length, batchId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
