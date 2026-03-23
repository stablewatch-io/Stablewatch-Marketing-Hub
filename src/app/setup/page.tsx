"use client";

import { useState } from "react";

const MIGRATION_SQL = `-- ================================================
-- STABLEWATCH AI — COMPLETE DATABASE SETUP
-- Run this ENTIRE script in Supabase Dashboard > SQL Editor
-- Creates ALL tables from scratch + seeds data
-- ================================================

-- =============================================
-- PART 1: BASE SCHEMA (profiles, news, content)
-- =============================================

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can do everything on profiles"
    ON public.profiles FOR ALL USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. News Sources
CREATE TABLE IF NOT EXISTS public.news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('rss', 'api')),
  url text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can do everything on news_sources"
    ON public.news_sources FOR ALL USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. News Articles
CREATE TABLE IF NOT EXISTS public.news_articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.news_sources(id),
  external_id text unique,
  title text not null,
  summary text,
  url text not null,
  published_at timestamptz,
  raw_content text,
  fetched_at timestamptz default now()
);

ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can do everything on news_articles"
    ON public.news_articles FOR ALL USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. News Reviews
CREATE TABLE IF NOT EXISTS public.news_reviews (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.news_articles(id) unique,
  ai_relevant boolean not null,
  ai_score real,
  ai_reasoning text,
  ai_summary text,
  human_status text default 'pending' check (human_status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

ALTER TABLE public.news_reviews ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can do everything on news_reviews"
    ON public.news_reviews FOR ALL USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Generated Content
CREATE TABLE IF NOT EXISTS public.generated_content (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('tweet', 'telegram')),
  body text not null,
  source_context jsonb,
  prompt_used text,
  status text default 'draft' check (status in ('draft', 'approved', 'published', 'archived')),
  published_at timestamptz,
  published_to text,
  external_post_id text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can do everything on generated_content"
    ON public.generated_content FOR ALL USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. System Prompts
CREATE TABLE IF NOT EXISTS public.system_prompts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('news_filter', 'tweet_gen', 'telegram_gen')),
  content text not null,
  is_active boolean default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can do everything on system_prompts"
    ON public.system_prompts FOR ALL USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. Aggregation Jobs
CREATE TABLE IF NOT EXISTS public.aggregation_jobs (
  id uuid primary key default gen_random_uuid(),
  status text default 'running' check (status in ('running', 'completed', 'failed')),
  articles_fetched int default 0,
  articles_relevant int default 0,
  triggered_by uuid references public.profiles(id),
  started_at timestamptz default now(),
  completed_at timestamptz,
  error_message text
);

ALTER TABLE public.aggregation_jobs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can do everything on aggregation_jobs"
    ON public.aggregation_jobs FOR ALL USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS generated_content_updated_at ON public.generated_content;
CREATE TRIGGER generated_content_updated_at
  BEFORE UPDATE ON public.generated_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS system_prompts_updated_at ON public.system_prompts;
CREATE TRIGGER system_prompts_updated_at
  BEFORE UPDATE ON public.system_prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- PART 2: STITCH FEATURES (new tables)
-- =============================================

-- 1. Modular Instructions
CREATE TABLE IF NOT EXISTS public.modular_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL CHECK (channel IN ('news', 'twitter', 'telegram')),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.modular_instructions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can do everything on modular_instructions" ON public.modular_instructions;
CREATE POLICY "Authenticated users can do everything on modular_instructions"
  ON public.modular_instructions FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS idx_active_instruction
  ON public.modular_instructions(channel, slug) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_instructions_channel_slug
  ON public.modular_instructions(channel, slug);

-- 2. Knowledge Base Files
CREATE TABLE IF NOT EXISTS public.knowledge_base_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL CHECK (channel IN ('news', 'twitter', 'telegram', 'global')),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT CHECK (file_type IN ('pdf', 'csv', 'md', 'docx')),
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.knowledge_base_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can do everything on knowledge_base_files" ON public.knowledge_base_files;
CREATE POLICY "Authenticated users can do everything on knowledge_base_files"
  ON public.knowledge_base_files FOR ALL
  USING (auth.uid() IS NOT NULL);

-- 3. Editorial Notes
CREATE TABLE IF NOT EXISTS public.editorial_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  is_draft BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.editorial_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can do everything on editorial_notes" ON public.editorial_notes;
CREATE POLICY "Authenticated users can do everything on editorial_notes"
  ON public.editorial_notes FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_editorial_notes_article
  ON public.editorial_notes(article_id);

-- 4. Formatting History
CREATE TABLE IF NOT EXISTS public.formatting_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_text TEXT NOT NULL,
  input_source_type TEXT CHECK (input_source_type IN ('twitter_link', 'article_url', 'raw_text')),
  output_text TEXT NOT NULL,
  instruction_id UUID REFERENCES public.modular_instructions(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.formatting_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can do everything on formatting_history" ON public.formatting_history;
CREATE POLICY "Authenticated users can do everything on formatting_history"
  ON public.formatting_history FOR ALL
  USING (auth.uid() IS NOT NULL);

-- 5. Global AI Settings
CREATE TABLE IF NOT EXISTS public.global_ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL UNIQUE CHECK (channel IN ('twitter', 'telegram', 'news')),
  tone_of_voice TEXT,
  icp TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.global_ai_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can do everything on global_ai_settings" ON public.global_ai_settings;
CREATE POLICY "Authenticated users can do everything on global_ai_settings"
  ON public.global_ai_settings FOR ALL
  USING (auth.uid() IS NOT NULL);

-- 6. Extend generated_content
ALTER TABLE public.generated_content
  ADD COLUMN IF NOT EXISTS instruction_id UUID REFERENCES public.modular_instructions(id),
  ADD COLUMN IF NOT EXISTS post_label TEXT,
  ADD COLUMN IF NOT EXISTS generation_batch_id UUID,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_generated_content_batch
  ON public.generated_content(generation_batch_id) WHERE generation_batch_id IS NOT NULL;

-- 7. Storage bucket
INSERT INTO storage.buckets (id, name, public)
  VALUES ('knowledge-base', 'knowledge-base', false)
  ON CONFLICT (id) DO NOTHING;

-- ================================================
-- SEED DATA
-- ================================================

-- Seed modular instructions
INSERT INTO public.modular_instructions (channel, slug, name, content, version, is_active) VALUES
('news', 'news_filter', 'Global Filter Rules', '# Editorial Standards v4.2

- **Focus:** AI, FinTech, and Spatial Computing.
- **Exclusion:** Opinion pieces without primary data, social media drama, price-only crypto updates.
- **Prioritization:** Quantitative data, regulatory filings, and primary interviews.
- **Validation:** Identify and flag potentially hallucinated news by cross-referencing known sources.', 1, true),
('twitter', 'thread_logic', 'Thread Logic', '# Thread Logic v4

## Framework
Framework for multi-post storytelling, hook-body-conclusion structure.

## Rules
- Start with a numbered hook (1/) that creates curiosity
- Each subsequent tweet builds on the previous
- End with a clear CTA or takeaway
- Maximum 5 tweets per thread
- Each tweet under 280 characters', 4, true),
('twitter', 'hook_optimizer', 'Hook Optimization', '# Hook Optimization

## Strategy
Strategies for maximizing scroll-stop rate using curiosity loops.

## Rules
- Lead with a contrarian or surprising statement
- Use specific numbers over vague claims
- Create an information gap
- Avoid clickbait', 1, true),
('twitter', 'case_study', 'Case Study Frame', '# Case Study Frame v2

## Structure
1. Problem statement
2. Solution applied
3. Results with specific metrics
4. Key takeaway', 2, true),
('twitter', 'listicle_style', 'Listicle Style', '# Listicle Style v3

## Rules
- Use Top 5 or Top 7 format
- Each item gets a clear emoji bullet
- Include a brief explanation
- End with engagement hook', 3, true),
('telegram', 'telegram_format', 'Telegram Formatting Rules', '# Telegram Formatting Rules v2.0

## Structural Headers
- Always prepend news with 🚀 BREAKING NEWS or 📰 UPDATE
- Use bold for main headlines

## Content Rules
- Limit summary to 3 key bullet points
- Use — as a divider before the source link
- Add exactly 3 hashtags based on content category

## Character Limits
- Hard limit: 4096 characters (Telegram API)
- Soft limit: 1200 characters for optimal engagement', 2, true)
ON CONFLICT DO NOTHING;

-- Seed global AI settings
INSERT INTO public.global_ai_settings (channel, tone_of_voice, icp) VALUES
('twitter', 'Authoritative yet accessible, professional, data-driven, and slightly provocative. Avoid corporate jargon. Use active verbs.', 'Marketing Directors at B2B SaaS companies, Growth Leads, and Tech-savvy Founders interested in AI automation.'),
('telegram', 'Informative, concise, and professional. Focus on delivering value quickly.', 'Crypto-native community members, DeFi users, and blockchain enthusiasts.'),
('news', 'Objective, analytical, and data-focused. Prioritize facts over opinions.', 'Internal editorial team reviewing incoming news for content creation pipeline.')
ON CONFLICT (channel) DO NOTHING;
`;

export default function SetupPage() {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<string[]>([]);

  async function handleCopy() {
    await navigator.clipboard.writeText(MIGRATION_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCheck() {
    setChecking(true);
    try {
      const res = await fetch("/api/setup", { method: "POST" });
      const data = await res.json();
      setStatus(data.results);
    } catch {
      setStatus(["Error checking database"]);
    }
    setChecking(false);
  }

  return (
    <div className="min-h-screen bg-[var(--sw-bg)] p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--sw-primary)] mb-2">
          Stablewatch AI — Database Setup
        </h1>
        <p className="text-[var(--sw-text-secondary)] mb-8">
          The app needs database tables that don&apos;t exist yet. Follow these
          steps:
        </p>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="bg-white rounded-xl p-6 border border-[var(--sw-border)]/20">
            <h2 className="font-bold text-lg mb-2">
              Step 1: Copy the SQL below
            </h2>
            <button
              onClick={handleCopy}
              className="mb-4 px-4 py-2 bg-[var(--sw-primary)] text-white rounded-lg font-bold text-sm"
            >
              {copied ? "Copied!" : "Copy SQL to Clipboard"}
            </button>
            <pre className="bg-[var(--sw-text)] text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-96">
              {MIGRATION_SQL}
            </pre>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-xl p-6 border border-[var(--sw-border)]/20">
            <h2 className="font-bold text-lg mb-2">
              Step 2: Paste into Supabase
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--sw-text-secondary)]">
              <li>
                Go to{" "}
                <a
                  href="https://supabase.com/dashboard/project/jlpfhoqvixxpbdlrsgmn/sql/new"
                  target="_blank"
                  className="text-[var(--sw-primary)] underline font-bold"
                >
                  Supabase SQL Editor
                </a>
              </li>
              <li>Paste the copied SQL</li>
              <li>Click &ldquo;Run&rdquo;</li>
              <li>Come back here and click &ldquo;Verify&rdquo;</li>
            </ol>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-xl p-6 border border-[var(--sw-border)]/20">
            <h2 className="font-bold text-lg mb-2">
              Step 3: Verify & Seed Data
            </h2>
            <button
              onClick={handleCheck}
              disabled={checking}
              className="px-4 py-2 bg-[var(--sw-primary)] text-white rounded-lg font-bold text-sm disabled:opacity-50"
            >
              {checking ? "Checking..." : "Verify Database"}
            </button>
            {status.length > 0 && (
              <ul className="mt-4 space-y-1">
                {status.map((s, i) => (
                  <li
                    key={i}
                    className={`text-sm ${s.includes("ERROR") ? "text-red-600" : "text-green-700"}`}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Done */}
          <div className="bg-[var(--sw-primary)]/5 rounded-xl p-6 border border-[var(--sw-primary)]/10">
            <p className="text-sm text-[var(--sw-primary)] font-bold">
              Once verified, go to{" "}
              <a href="/" className="underline">
                the dashboard
              </a>{" "}
              and everything should work!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
