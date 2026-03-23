import useSWR from "swr";

export interface NewsArticle {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  published_at: string | null;
  source_name: string;
  review?: {
    id: string;
    ai_relevant: boolean;
    ai_score: number | null;
    ai_reasoning: string | null;
    ai_summary: string | null;
    human_status: "pending" | "approved" | "rejected";
  };
}

export interface AggregationJob {
  id: string;
  status: "running" | "completed" | "failed";
  articles_fetched: number;
  articles_relevant: number;
  started_at: string;
  completed_at: string | null;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export function useNews(status?: string, range?: string) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (range) params.set("range", range);
  const qs = params.toString() ? `?${params}` : "";

  const { data, error, isLoading, mutate } = useSWR<NewsArticle[]>(
    `/api/news/articles${qs}`,
    fetcher,
    { refreshInterval: 120_000, revalidateOnFocus: false }
  );

  return { articles: data ?? [], error, isLoading, mutate };
}

const objectFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

export function useLatestJob() {
  const { data, error, isLoading, mutate } = useSWR<AggregationJob | null>(
    "/api/news/aggregate",
    objectFetcher,
    { refreshInterval: 30_000, revalidateOnFocus: false }
  );

  return { job: data ?? null, error, isLoading, mutate };
}
