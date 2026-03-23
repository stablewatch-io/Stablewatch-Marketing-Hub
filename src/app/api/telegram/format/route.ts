import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatForTelegram } from "@/lib/claude";
import { getKnowledgeBaseContents } from "@/lib/knowledge-base";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { input, sourceType } = (await request.json()) as {
    input: string;
    sourceType: "twitter_link" | "article_url" | "raw_text";
  };

  // Get active telegram formatting rules
  const { data: instruction } = await supabase
    .from("modular_instructions")
    .select("id, content")
    .eq("channel", "telegram")
    .eq("slug", "telegram_format")
    .eq("is_active", true)
    .single();

  const kbContents = await getKnowledgeBaseContents(supabase, ["telegram", "global"]);
  const kbSection = kbContents.length > 0
    ? `\n\nKNOWLEDGE BASE CONTEXT:\n${kbContents.join("\n\n")}`
    : "";

  const formattingRules =
    (instruction?.content ?? "Format the text for Telegram with clear structure.") + kbSection;

  try {
    const result = await formatForTelegram({
      input,
      sourceType,
      formattingRules,
    });

    // Save to history
    await supabase.from("formatting_history").insert({
      input_text: input,
      input_source_type: sourceType,
      output_text: result.formatted,
      instruction_id: instruction?.id ?? null,
      created_by: user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
