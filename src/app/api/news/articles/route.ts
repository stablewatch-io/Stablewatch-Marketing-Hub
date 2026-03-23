import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isServiceRoleRequest, createServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const range = request.nextUrl.searchParams.get("range");

  let query = supabase
    .from("news_articles")
    .select(
      `
      id, title, summary, url, published_at,
      news_sources(name),
      news_reviews(id, ai_relevant, ai_score, ai_reasoning, ai_summary, human_status)
    `
    )
    .order("published_at", { ascending: false })
    .limit(50);

  // Time range filter
  if (range && range !== "Custom") {
    const hours = parseInt(range);
    if (!isNaN(hours)) {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      query = query.gte("published_at", since);
    }
  }

  // Filter by review status if provided
  if (status && status !== "all") {
    query = query.eq("news_reviews.human_status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform the joined data
  const articles = (data ?? []).map((article) => {
    const source = article.news_sources as unknown as { name: string } | null;
    const reviews = article.news_reviews as unknown as Array<{
      id: string;
      ai_relevant: boolean;
      ai_score: number | null;
      ai_reasoning: string | null;
      ai_summary: string | null;
      human_status: string;
    }>;

    // Filter out articles that don't match the status filter (for joined filtering)
    const review = reviews?.[0] ?? null;
    if (status && status !== "all" && review?.human_status !== status) {
      return null;
    }

    return {
      id: article.id,
      title: article.title,
      summary: article.summary,
      url: article.url,
      published_at: article.published_at,
      source_name: source?.name ?? "Unknown",
      review: review ?? undefined,
    };
  }).filter(Boolean);

  return NextResponse.json(articles);
}

export async function POST(request: NextRequest) {
  // Allow both authenticated users and service-role calls (from n8n)
  const isServiceRole = isServiceRoleRequest(request);
  const supabase = isServiceRole ? createServiceRoleClient() : await createClient();

  if (!isServiceRole) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { articles } = (await request.json()) as {
    articles: {
      source_id: string;
      external_id: string;
      title: string;
      summary?: string;
      url: string;
      published_at?: string;
      raw_content?: string;
    }[];
  };

  if (!articles || !Array.isArray(articles) || articles.length === 0) {
    return NextResponse.json(
      { error: "articles array is required" },
      { status: 400 }
    );
  }

  // Bulk insert, skipping duplicates on external_id
  const { data, error } = await supabase
    .from("news_articles")
    .upsert(
      articles.map((a) => ({
        source_id: a.source_id,
        external_id: a.external_id,
        title: a.title,
        summary: a.summary ?? null,
        url: a.url,
        published_at: a.published_at ?? null,
        raw_content: a.raw_content ?? null,
      })),
      { onConflict: "external_id", ignoreDuplicates: true }
    )
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    inserted: data?.length ?? 0,
    message: "Articles ingested. Use POST /api/news/filter to run AI filtering.",
  }, { status: 201 });
}
