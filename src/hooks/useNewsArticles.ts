import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  image_url: string | null;
  published_at: string;
  source_id: string;
  news_reviews: Array<{
    id: string;
    ai_relevant: boolean;
    ai_score: number;
    ai_reasoning: string;
    ai_summary: string;
    ai_category: string | null;
    human_status: string;
    is_cleared: boolean;
    reviewed_by: string | null;
    reviewed_at: string | null;
    reviewer: { display_name: string } | null;
  }>;
}

interface UseNewsArticlesParams {
  status?: string;
  relevantOnly?: boolean;
}

export function useNewsArticles(params: UseNewsArticlesParams = {}) {
  const { status = "pending", relevantOnly = true } = params;
  const query = new URLSearchParams({
    status,
    relevant_only: String(relevantOnly),
  });

  const { data, error, isLoading, mutate } = useSWR<NewsArticle[]>(
    `/api/news/articles?${query}`,
    fetcher,
    { refreshInterval: 120_000, revalidateOnFocus: false }
  );

  return {
    articles: data ?? [],
    error,
    isLoading,
    mutate,
  };
}
