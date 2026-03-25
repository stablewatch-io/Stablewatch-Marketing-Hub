import Anthropic from "@anthropic-ai/sdk";
import Parser from "rss-parser";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const parser = new Parser();
const anthropic = new Anthropic();

/** Max time window to look back for articles, even if no previous job exists */
const MAX_LOOKBACK_HOURS = 48;

const AI_SYSTEM_PROMPT = `You are a news filter for a stablecoin/RWA/DeFi lending research channel.
Audience: finance professionals and institutional DeFi builders — not retail traders or speculators.

## TASK
For each article in the batch, return a JSON array:
[{
  "relevant": true/false,
  "category": "Stablecoins" | "RWA" | "Tokenization" | "Lending" | "Legal/Regulatory" | "Hacks/Security" | "Other" | null,
  "score": 0.0-1.0,
  "reasoning": "one sentence",
  "title": "<original title>",
  "source_url": "<original url>"
}]
Set category to null when relevant is false.

## RELEVANT = TRUE
- Stablecoin news: launches, peg events, issuer moves, reserves, adoption
- RWA tokenization: bonds, treasuries, real estate, credit, commodities on-chain
- Tokenization broadly: tokenized stocks/equities, platforms, new standards
- DeFi lending/yield: protocol updates, rate changes, major liquidations
- Regulation directly affecting stablecoins, DeFi, or tokenized assets
- Hacks/exploits hitting DeFi or stablecoin protocols
- Institutional crypto infrastructure: on-chain settlement, custody, payment rails

## RELEVANT = FALSE
- Pure price action or market sentiment
- Meme coins, NFTs, gaming tokens, airdrops
- Generic "country adopts Bitcoin" or crypto education
- Celebrity/influencer crypto stories
- Crime/fraud only tangentially involving crypto
- AI + crypto UNLESS directly touching stablecoin payments or DeFi
- Promotional content: product announcements, TVL milestones, "deposits open", cap increases
- "Yield opportunity" content pushing specific APY without independent framing

## PROMOTIONAL CONTENT TEST
Is this informing or recruiting? Recruiting → false.

Return ONLY valid JSON array, no other text.`;

// --- Types ---

interface RawArticle {
  source_id: string;
  title: string;
  url: string;
  summary: string;
  published_at: string;
  image_url: string | null;
  raw_content: string;
  external_id: string;
}

interface AIFilterResult {
  relevant: boolean;
  category: string | null;
  score: number;
  reasoning: string;
  title: string;
  source_url: string;
}

// --- Levenshtein helpers ---

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]);
    }
  }
  return dp[m][n];
}

function titleSimilarity(a: string, b: string): number {
  const la = a.toLowerCase().trim();
  const lb = b.toLowerCase().trim();
  const maxLen = Math.max(la.length, lb.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(la, lb) / maxLen;
}

function deduplicateByTitle<T extends { title: string }>(
  articles: T[],
  threshold: number
): T[] {
  const result: T[] = [];
  for (const article of articles) {
    const isDuplicate = result.some(
      (existing) => titleSimilarity(existing.title, article.title) >= threshold
    );
    if (!isDuplicate) result.push(article);
  }
  return result;
}

// --- AI filter ---

async function filterBatch(
  articles: RawArticle[],
  rlhfContext: string
): Promise<AIFilterResult[]> {
  const userContent = articles
    .map(
      (a, i) =>
        `[${i + 1}] Title: ${a.title}\nURL: ${a.url}\nSummary: ${a.summary}`
    )
    .join("\n\n");

  const systemPrompt = rlhfContext
    ? `${AI_SYSTEM_PROMPT}\n\n## RECENT EDITORIAL DECISIONS (for calibration)\n${rlhfContext}`
    : AI_SYSTEM_PROMPT;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  try {
    // Strip markdown code fences if present (```json ... ```)
    const cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  } catch {
    console.error("AI filter returned invalid JSON:", text);
    return [];
  }
}

async function filterWithAI(
  articles: RawArticle[],
  feedback: Array<{ decision: string; reason: string }>
): Promise<AIFilterResult[]> {
  const rlhfContext =
    feedback.length > 0
      ? feedback
          .map((f) => `- ${f.decision}: ${f.reason || "no reason"}`)
          .join("\n")
      : "";

  const results: AIFilterResult[] = [];
  for (let i = 0; i < articles.length; i += 10) {
    const batch = articles.slice(i, i + 10);
    const batchResults = await filterBatch(batch, rlhfContext);
    results.push(...batchResults);
  }
  return results;
}

// --- Main pipeline ---

export async function runNewsPipeline(triggeredBy: string) {
  const supabase = createServiceRoleClient();

  // Create job
  const { data: job, error: jobError } = await supabase
    .from("aggregation_jobs")
    .insert({
      status: "running",
      triggered_by: triggeredBy,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (jobError || !job) throw new Error("Failed to create aggregation job");

  try {
    // 1. Get active RSS sources
    const { data: sources } = await supabase
      .from("news_sources")
      .select("*")
      .eq("is_active", true)
      .eq("type", "rss");

    // 2. Fetch all RSS feeds
    const allItems: RawArticle[] = [];
    for (const source of sources ?? []) {
      try {
        const feed = await parser.parseURL(source.url);
        for (const item of feed.items) {
          if (!item.link) continue;
          allItems.push({
            source_id: source.id,
            title: item.title ?? "",
            url: item.link,
            summary: item.contentSnippet ?? item.content ?? "",
            published_at: item.pubDate
              ? new Date(item.pubDate).toISOString()
              : new Date().toISOString(),
            image_url: item.enclosure?.url ?? null,
            raw_content: item.content ?? "",
            external_id: item.guid ?? item.link,
          });
        }
      } catch (e) {
        console.error(`RSS fetch failed for ${source.url}:`, e);
      }
    }

    // 3. Dedup by URL
    const seenUrls = new Set<string>();
    let articles = allItems.filter((a) => {
      if (seenUrls.has(a.url)) return false;
      seenUrls.add(a.url);
      return true;
    });

    // 4. Dedup by title similarity (Levenshtein >= 0.8)
    articles = deduplicateByTitle(articles, 0.8);

    // 5. Time filter: only AFTER last successful job's completed_at (or 16h)
    const { data: lastJob } = await supabase
      .from("aggregation_jobs")
      .select("completed_at")
      .eq("status", "completed")
      .neq("id", job.id)
      .order("completed_at", { ascending: false })
      .limit(1)
      .single();

    const cutoff = lastJob?.completed_at
      ? new Date(
          Math.max(
            new Date(lastJob.completed_at).getTime(),
            Date.now() - MAX_LOOKBACK_HOURS * 60 * 60 * 1000
          )
        )
      : new Date(Date.now() - MAX_LOOKBACK_HOURS * 60 * 60 * 1000);

    articles = articles.filter((a) => new Date(a.published_at) > cutoff);

    // 6. Check existing URLs in DB
    if (articles.length > 0) {
      const urls = articles.map((a) => a.url);
      const { data: existing } = await supabase
        .from("news_articles")
        .select("url")
        .in("url", urls);
      const existingUrls = new Set((existing ?? []).map((e) => e.url));
      articles = articles.filter((a) => !existingUrls.has(a.url));
    }

    // 7. Limit 100
    articles = articles.slice(0, 100);

    if (articles.length === 0) {
      await supabase
        .from("aggregation_jobs")
        .update({
          status: "completed",
          articles_fetched: 0,
          articles_relevant: 0,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      return { fetched: 0, relevant: 0, jobId: job.id };
    }

    // 8. Get RLHF feedback (last 20)
    const { data: feedback } = await supabase
      .from("editorial_feedback")
      .select("decision, reason")
      .order("decided_at", { ascending: false })
      .limit(20);

    // 9. AI filter in batches of 10
    const aiResults = await filterWithAI(articles, feedback ?? []);

    // 10. Limit to 20 best relevant articles by score
    const bestRelevant = aiResults
      .map((r) => ({
        ...r,
        article: articles.find((a) => a.url === r.source_url),
      }))
      .filter((r) => r.relevant && r.article)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 20);

    let relevantCount = 0;
    for (const r of bestRelevant) {
      const article = r.article;
      const aiResult = r;
      if (!article) continue;
      const { data: inserted } = await supabase
        .from("news_articles")
        .upsert(
          {
            source_id: article.source_id,
            external_id: article.external_id,
            title: article.title,
            summary: article.summary,
            url: article.url,
            image_url: article.image_url,
            published_at: article.published_at,
            raw_content: article.raw_content,
            fetched_at: new Date().toISOString(),
          },
          { onConflict: "url" }
        )
        .select("id")
        .single();

      if (inserted && aiResult) {
        relevantCount++;
        await supabase.from("news_reviews").upsert(
          {
            article_id: inserted.id,
            ai_relevant: aiResult.relevant,
            ai_score: aiResult.score,
            ai_reasoning: aiResult.reasoning,
            ai_summary: aiResult.title,
            ai_category: aiResult.category,
            human_status: "pending",
          },
          { onConflict: "article_id" }
        );
      }
    }

    // Update job as completed
    await supabase
      .from("aggregation_jobs")
      .update({
        status: "completed",
        articles_fetched: bestRelevant.length,
        articles_relevant: relevantCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return { fetched: bestRelevant.length, relevant: relevantCount, jobId: job.id };
  } catch (error) {
    await supabase
      .from("aggregation_jobs")
      .update({
        status: "failed",
        error_message:
          error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    throw error;
  }
}
