import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// One-time setup endpoint: creates tables and seeds data
// Uses service role to bypass RLS
export async function POST() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const results: string[] = [];

  // 1. Create modular_instructions table
  try {
    // Check if table exists by trying to query it
    const { error: checkError } = await supabase
      .from("modular_instructions")
      .select("id")
      .limit(1);

    if (checkError?.message?.includes("not find the table")) {
      results.push(
        "ERROR: modular_instructions table does not exist. You must run the SQL migration manually."
      );
      results.push(
        "Go to Supabase Dashboard > SQL Editor and paste the contents of supabase/migrations/003_stitch_features.sql"
      );
      results.push(
        "Then paste supabase/migrations/004_seed_instructions.sql"
      );
      return NextResponse.json({ results, needsManualMigration: true });
    }

    results.push("modular_instructions table exists");
  } catch {
    results.push("Error checking table");
  }

  // 2. Check if seed data exists, if not insert it
  const { data: existing } = await supabase
    .from("modular_instructions")
    .select("id")
    .limit(1);

  if (!existing || existing.length === 0) {
    results.push("Seeding modular_instructions...");

    const instructions = [
      {
        channel: "news",
        slug: "news_filter",
        name: "Global Filter Rules",
        content:
          '# Editorial Standards v4.2\n\n- **Focus:** AI, FinTech, and Spatial Computing.\n- **Exclusion:** Opinion pieces without primary data, social media drama, price-only crypto updates.\n- **Prioritization:** Quantitative data, regulatory filings, and primary interviews.\n- **Validation:** Identify and flag potentially "hallucinated" news by cross-referencing known sources.',
        version: 1,
        is_active: true,
      },
      {
        channel: "twitter",
        slug: "thread_logic",
        name: "Thread Logic",
        content:
          "# Thread Logic v4\n\n## Framework\nFramework for multi-post storytelling, hook-body-conclusion structure.\n\n## Rules\n- Start with a numbered hook (1/) that creates curiosity\n- Each subsequent tweet builds on the previous\n- End with a clear CTA or takeaway\n- Use data points to support claims\n- Maximum 5 tweets per thread\n- Each tweet under 280 characters",
        version: 4,
        is_active: true,
      },
      {
        channel: "twitter",
        slug: "hook_optimizer",
        name: "Hook Optimization",
        content:
          "# Hook Optimization\n\n## Strategy\nStrategies for maximizing scroll-stop rate using curiosity loops.\n\n## Rules\n- Lead with a contrarian or surprising statement\n- Use specific numbers over vague claims\n- Create an information gap the reader wants to close\n- Avoid clickbait — deliver on the promise",
        version: 1,
        is_active: true,
      },
      {
        channel: "twitter",
        slug: "case_study",
        name: "Case Study Frame",
        content:
          "# Case Study Frame v2\n\n## Framework\nStandardized format for presenting client wins and ROI metrics.\n\n## Structure\n1. Problem statement\n2. Solution applied\n3. Results with specific metrics\n4. Key takeaway",
        version: 2,
        is_active: true,
      },
      {
        channel: "twitter",
        slug: "listicle_style",
        name: "Listicle Style",
        content:
          '# Listicle Style v3\n\n## Framework\nOptimized formatting for "Top X" posts with high shareability.\n\n## Rules\n- Use "Top 5" or "Top 7" format\n- Each item gets a clear emoji bullet\n- Include a brief explanation\n- End with engagement hook',
        version: 3,
        is_active: true,
      },
      {
        channel: "telegram",
        slug: "telegram_format",
        name: "Telegram Formatting Rules",
        content:
          "# Telegram Formatting Rules v2.0\n\n## Structural Headers\n- Always prepend news with 🚀 BREAKING NEWS or 📰 UPDATE\n- Use bold (v2) for main headlines\n\n## Content Rules\n- Limit summary to 3 key bullet points\n- Use — as a divider before the source link\n- Add exactly 3 hashtags based on content category\n\n## Source Attribution\n- Logic: Link must be the last element\n- Formatting: 🔗 [Anchor Text](URL)\n\n## Character Limits\n- Hard limit: 4096 characters (Telegram API)\n- Soft limit: 1200 characters for optimal engagement",
        version: 2,
        is_active: true,
      },
    ];

    const { error: insertError } = await supabase
      .from("modular_instructions")
      .insert(instructions);

    if (insertError) {
      results.push(`Error seeding instructions: ${insertError.message}`);
    } else {
      results.push("Seeded 6 modular instructions");
    }
  } else {
    results.push("modular_instructions already has data");
  }

  // 3. Seed global_ai_settings
  const { data: existingSettings } = await supabase
    .from("global_ai_settings")
    .select("id")
    .limit(1);

  if (!existingSettings || existingSettings.length === 0) {
    const settings = [
      {
        channel: "twitter",
        tone_of_voice:
          "Authoritative yet accessible, professional, data-driven, and slightly provocative. Avoid corporate jargon. Use active verbs.",
        icp: "Marketing Directors at B2B SaaS companies, Growth Leads, and Tech-savvy Founders interested in AI automation.",
      },
      {
        channel: "telegram",
        tone_of_voice:
          "Informative, concise, and professional. Focus on delivering value quickly.",
        icp: "Crypto-native community members, DeFi users, and blockchain enthusiasts.",
      },
      {
        channel: "news",
        tone_of_voice:
          "Objective, analytical, and data-focused. Prioritize facts over opinions.",
        icp: "Internal editorial team reviewing incoming news for content creation pipeline.",
      },
    ];

    const { error } = await supabase
      .from("global_ai_settings")
      .insert(settings);

    if (error) {
      results.push(`Error seeding settings: ${error.message}`);
    } else {
      results.push("Seeded 3 global AI settings");
    }
  } else {
    results.push("global_ai_settings already has data");
  }

  return NextResponse.json({ results, success: true });
}
