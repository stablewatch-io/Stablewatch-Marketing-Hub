import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!BOT_TOKEN || !CHAT_ID) {
    return NextResponse.json(
      { error: "Telegram bot not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID." },
      { status: 500 }
    );
  }

  const { text } = await req.json();

  if (!text?.trim()) {
    return NextResponse.json({ error: "Message text is required" }, { status: 400 });
  }

  const telegramRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "MarkdownV2",
      }),
    }
  );

  const telegramData = await telegramRes.json();

  if (!telegramData.ok) {
    // Retry without parse_mode in case of formatting issues
    const retryRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
        }),
      }
    );

    const retryData = await retryRes.json();
    if (!retryData.ok) {
      return NextResponse.json(
        { error: `Telegram API error: ${retryData.description}` },
        { status: 502 }
      );
    }

    // Save to generated_content
    await supabase.from("generated_content").insert({
      type: "telegram",
      body: text,
      status: "published",
      published_at: new Date().toISOString(),
      published_to: "telegram",
      external_post_id: String(retryData.result.message_id),
      created_by: user.id,
    });

    return NextResponse.json({
      success: true,
      message_id: retryData.result.message_id,
    });
  }

  // Save to generated_content
  await supabase.from("generated_content").insert({
    type: "telegram",
    body: text,
    status: "published",
    published_at: new Date().toISOString(),
    published_to: "telegram",
    external_post_id: String(telegramData.result.message_id),
    created_by: user.id,
  });

  return NextResponse.json({
    success: true,
    message_id: telegramData.result.message_id,
  });
}
