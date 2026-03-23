import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { filterNewsArticles } from "@/lib/claude";
import { getKnowledgeBaseContents } from "@/lib/knowledge-base";
import { isServiceRoleRequest, createServiceRoleClient } from "@/lib/supabase/service-role";

export async function POST(req: NextRequest) {
  // Allow service-role calls from n8n webhook
  const isServiceRole = isServiceRoleRequest(req);
  const supabase = isServiceRole ? createServiceRoleClient() : await createClient();

  if (!isServiceRole) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Get active news filter instruction
  const { data: instruction } = await supabase
    .from("modular_instructions")
    .select("content")
    .eq("channel", "news")
    .eq("slug", "news_filter")
    .eq("is_active", true)
    .single();

  // Get knowledge base contents
  const kbContents = await getKnowledgeBaseContents(supabase, ["news", "global"]);
  const kbSection =
    kbContents.length > 0
      ? `\n\nKNOWLEDGE BASE CONTEXT:\n${kbContents.join("\n\n")}`
      : "";

  const filterRules =
    (instruction?.content ??
      "Filter articles for relevance to stablecoins, DeFi, and market movements.") +
    kbSection;

  // Get articles that don't have reviews yet
  const { data: articles, error: articlesError } = await supabase
    .from("news_articles")
    .select("id, title, summary")
    .not(
      "id",
      "in",
      `(${(
        await supabase.from("news_reviews").select("article_id")
      ).data
        ?.map((r) => r.article_id)
        .join(",") || "00000000-0000-0000-0000-000000000000"})`
    )
    .order("fetched_at", { ascending: false })
    .limit(50);

  if (articlesError) {
    return NextResponse.json(
      { error: articlesError.message },
      { status: 500 }
    );
  }

  if (!articles || articles.length === 0) {
    return NextResponse.json({ message: "No unreviewed articles to filter", processed: 0 });
  }

  try {
    const results = await filterNewsArticles({
      articles: articles.map((a) => ({
        id: a.id,
        title: a.title,
        summary: a.summary ?? "",
      })),
      filterRules,
    });

    // Upsert results into news_reviews
    const reviews = results.map((r) => ({
      article_id: r.id,
      ai_relevant: r.relevant,
      ai_score: r.score,
      ai_reasoning: r.reasoning,
      ai_summary: r.summary,
      human_status: "pending" as const,
    }));

    const { error: upsertError } = await supabase
      .from("news_reviews")
      .upsert(reviews, { onConflict: "article_id" });

    if (upsertError) {
      return NextResponse.json(
        { error: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      processed: results.length,
      relevant: results.filter((r) => r.relevant).length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
