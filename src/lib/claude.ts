import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const MODEL_SONNET = "claude-sonnet-4-20250514";
const MODEL_HAIKU = "claude-haiku-4-5-20251001";

/**
 * Batch-generate Twitter posts using modular instructions.
 * Adapted from WebOld/src/lib/claude.ts → generatePosts()
 */
export async function generateTwitterPosts({
  instruction,
  toneOfVoice,
  icp,
  knowledgeBase,
  marketData,
  count,
}: {
  instruction: string;
  toneOfVoice: string;
  icp: string;
  knowledgeBase: string[];
  marketData: Record<string, unknown>;
  count: number;
}): Promise<{ title: string; content: string; label: string }[]> {
  const systemPrompt = `You are a social media content creator for a marketing editorial team.

TONE OF VOICE: ${toneOfVoice}

TARGET AUDIENCE (ICP): ${icp}

WRITING INSTRUCTIONS:
${instruction}

${knowledgeBase.length > 0 ? `KNOWLEDGE BASE CONTEXT:\n${knowledgeBase.join("\n\n")}` : ""}`;

  const message = await anthropic.messages.create({
    model: MODEL_SONNET,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Based on the following data, generate ${count} social media post drafts. Each post should be ready to publish on Twitter (max 280 characters per individual tweet).

Vary the post types — include a mix of educational threads, engagement hooks, case studies, and listicle-style posts.

MARKET DATA:
${JSON.stringify(marketData, null, 2)}

Respond with a JSON array of objects, each with:
- "title": a short internal title for the draft
- "content": the full post text
- "label": one of "Educational Thread", "Engagement Hook", "Social Proof", "Case Study", "Listicle"

Only output the JSON array, nothing else.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response as JSON array");
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Format raw text for Telegram using formatting rules.
 */
export async function formatForTelegram({
  input,
  sourceType,
  formattingRules,
}: {
  input: string;
  sourceType: "twitter_link" | "article_url" | "raw_text";
  formattingRules: string;
}): Promise<{ formatted: string; charCount: number }> {
  const systemPrompt = `You are a Telegram post formatter. Your job is to take raw input and transform it into a properly formatted Telegram message following these rules:

${formattingRules}

Output ONLY the formatted message text. No JSON, no explanation.`;

  const sourceLabel =
    sourceType === "twitter_link"
      ? "Twitter post"
      : sourceType === "article_url"
        ? "news article"
        : "raw text";

  const message = await anthropic.messages.create({
    model: MODEL_HAIKU,
    max_tokens: 512,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Format the following ${sourceLabel} for Telegram:\n\n${input}`,
      },
    ],
  });

  const formatted =
    message.content[0].type === "text" ? message.content[0].text : "";

  return {
    formatted,
    charCount: formatted.length,
  };
}

/**
 * Filter news articles for relevance using AI.
 */
export async function filterNewsArticles({
  articles,
  filterRules,
}: {
  articles: { id: string; title: string; summary: string }[];
  filterRules: string;
}): Promise<
  {
    id: string;
    relevant: boolean;
    score: number;
    reasoning: string;
    summary: string;
  }[]
> {
  const systemPrompt = `You are a news relevance filter for a marketing editorial team. Evaluate each article based on these rules:

${filterRules}

For each article, return a JSON object with:
- "id": the article's id (pass through unchanged)
- "relevant": boolean — true if the article meets the criteria
- "score": number 0-1 — confidence level of relevance
- "reasoning": string — brief explanation of your verdict
- "summary": string — 1-2 sentence summary of the article`;

  const message = await anthropic.messages.create({
    model: MODEL_HAIKU,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Evaluate these ${articles.length} articles:\n\n${JSON.stringify(articles, null, 2)}\n\nRespond with a JSON array only.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response as JSON array");
  }

  return JSON.parse(jsonMatch[0]);
}
