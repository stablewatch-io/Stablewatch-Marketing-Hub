import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { filterNewsArticles } from "@/lib/claude";
import { getKnowledgeBaseContents } from "@/lib/knowledge-base";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";

// n8n calls this webhook to ingest articles, update metrics/status, or publish to Telegram
export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createServiceRoleClient();

  const { action } = body;

  // ──────────────────────────────────────────────
  // Ingest articles from n8n pipeline
  // ──────────────────────────────────────────────
  if (action === "ingest_articles") {
    const { job_id, articles } = body as {
      job_id?: string;
      articles: {
        external_id: string;
        title: string;
        summary?: string;
        url: string;
        published_at?: string;
        source_name?: string;
      }[];
    };

    if (!articles?.length) {
      return NextResponse.json({ error: "articles array is required" }, { status: 400 });
    }

    // Resolve source_name → source_id (cache lookups)
    const sourceCache = new Map<string, string>();
    const resolveSourceId = async (sourceName: string | undefined): Promise<string | null> => {
      if (!sourceName) return null;
      if (sourceCache.has(sourceName)) return sourceCache.get(sourceName)!;

      // Look up existing source
      const { data: existing } = await supabase
        .from("news_sources")
        .select("id")
        .eq("name", sourceName)
        .limit(1)
        .single();

      if (existing) {
        sourceCache.set(sourceName, existing.id);
        return existing.id;
      }

      // Auto-create source
      const { data: created } = await supabase
        .from("news_sources")
        .insert({ name: sourceName, type: "rss", url: "" })
        .select("id")
        .single();

      if (created) {
        sourceCache.set(sourceName, created.id);
        return created.id;
      }

      return null;
    };

    // Build rows with resolved source_ids
    const rows = await Promise.all(
      articles.map(async (a) => ({
        source_id: await resolveSourceId(a.source_name),
        external_id: a.external_id,
        title: a.title,
        summary: a.summary ?? null,
        url: a.url,
        published_at: a.published_at ?? null,
      }))
    );

    // Bulk upsert, skip duplicates on external_id
    const { data: inserted, error: upsertError } = await supabase
      .from("news_articles")
      .upsert(rows, { onConflict: "external_id", ignoreDuplicates: true })
      .select("id, title, summary");

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    const articleCount = inserted?.length ?? 0;

    // Update aggregation job if provided
    if (job_id) {
      await supabase
        .from("aggregation_jobs")
        .update({ articles_fetched: articleCount })
        .eq("id", job_id);
    }

    // Auto-trigger AI filtering on new articles
    let filtered = 0;
    let relevant = 0;
    if (inserted && inserted.length > 0) {
      try {
        // Get active filter instruction
        const { data: instruction } = await supabase
          .from("modular_instructions")
          .select("content")
          .eq("channel", "news")
          .eq("slug", "news_filter")
          .eq("is_active", true)
          .single();

        const kbContents = await getKnowledgeBaseContents(supabase, ["news", "global"]);
        const kbSection =
          kbContents.length > 0
            ? `\n\nKNOWLEDGE BASE CONTEXT:\n${kbContents.join("\n\n")}`
            : "";

        const filterRules =
          (instruction?.content ??
            "Filter articles for relevance to stablecoins, DeFi, and market movements.") +
          kbSection;

        const results = await filterNewsArticles({
          articles: inserted.map((a) => ({
            id: a.id,
            title: a.title,
            summary: a.summary ?? "",
          })),
          filterRules,
        });

        const reviews = results.map((r) => ({
          article_id: r.id,
          ai_relevant: r.relevant,
          ai_score: r.score,
          ai_reasoning: r.reasoning,
          ai_summary: r.summary,
          human_status: "pending" as const,
        }));

        await supabase.from("news_reviews").upsert(reviews, { onConflict: "article_id" });

        filtered = results.length;
        relevant = results.filter((r) => r.relevant).length;
      } catch {
        // AI filtering failure is non-fatal — articles are still stored
      }
    }

    // Update aggregation job with completion
    if (job_id) {
      await supabase
        .from("aggregation_jobs")
        .update({
          status: "completed",
          articles_fetched: articleCount,
          articles_relevant: relevant,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job_id);
    }

    return NextResponse.json({
      success: true,
      inserted: articleCount,
      filtered,
      relevant,
    }, { status: 201 });
  }

  // ──────────────────────────────────────────────
  // Publish message to Telegram channel
  // ──────────────────────────────────────────────
  if (action === "publish_telegram") {
    const { text, article_id } = body as {
      text: string;
      article_id?: string;
    };

    if (!text?.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json(
        { error: "Telegram bot not configured" },
        { status: 500 }
      );
    }

    // Send to Telegram with MarkdownV2, fallback to plain text
    let messageId: number | null = null;

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

    if (telegramData.ok) {
      messageId = telegramData.result.message_id;
    } else {
      // Retry without parse_mode
      const retryRes = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: CHAT_ID, text }),
        }
      );

      const retryData = await retryRes.json();
      if (!retryData.ok) {
        return NextResponse.json(
          { error: `Telegram API error: ${retryData.description}` },
          { status: 502 }
        );
      }
      messageId = retryData.result.message_id;
    }

    // Save to generated_content for activity log tracking
    await supabase.from("generated_content").insert({
      type: "telegram",
      body: text,
      status: "published",
      published_at: new Date().toISOString(),
      published_to: "telegram",
      external_post_id: String(messageId),
      source_context: article_id ? { article_id } : null,
    });

    return NextResponse.json({ success: true, message_id: messageId });
  }

  // ──────────────────────────────────────────────
  // Update post engagement metrics
  // ──────────────────────────────────────────────
  if (action === "update_metrics") {
    const { postId, views, reactions, forwards } = body;

    const score =
      (views || 0) * 1 + (reactions || 0) * 5 + (forwards || 0) * 10;

    const { error } = await supabase
      .from("generated_content")
      .update({
        source_context: {
          metrics: { views, reactions, forwards, score },
        },
      })
      .eq("id", postId);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ──────────────────────────────────────────────
  // Update content status
  // ──────────────────────────────────────────────
  if (action === "update_status") {
    const { postId, status } = body;

    const update: Record<string, unknown> = { status };
    if (status === "published") update.published_at = new Date().toISOString();

    const { error } = await supabase
      .from("generated_content")
      .update(update)
      .eq("id", postId);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ──────────────────────────────────────────────
  // Complete aggregation job
  // ──────────────────────────────────────────────
  if (action === "aggregation_complete") {
    const { jobId, articlesFetched, articlesRelevant } = body;

    const { error } = await supabase
      .from("aggregation_jobs")
      .update({
        status: "completed",
        articles_fetched: articlesFetched,
        articles_relevant: articlesRelevant,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
