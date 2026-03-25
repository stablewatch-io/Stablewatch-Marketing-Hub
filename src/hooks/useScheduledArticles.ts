import useSWR from "swr";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ScheduledReview {
  id: string;
  article_id: string;
  human_status: string;
  is_cleared: boolean;
  reviewed_at: string;
  article: {
    id: string;
    title: string;
    summary: string;
    url: string;
    image_url: string | null;
    published_at: string;
  };
  reviewer: { display_name: string } | null;
}

export function useScheduledArticles() {
  const { data, error, isLoading, mutate } = useSWR<ScheduledReview[]>(
    "/api/news/scheduled",
    fetcher,
    { refreshInterval: 120_000, revalidateOnFocus: false }
  );

  const clearArticles = async (articleIds: string[]) => {
    const res = await fetch("/api/news/clear", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ article_ids: articleIds }),
    });
    if (!res.ok) {
      toast.error("Failed to clear articles");
      return;
    }
    toast.success(`Cleared ${articleIds.length} article(s)`);
    mutate();
  };

  const clearAll = async () => {
    const res = await fetch("/api/news/clear", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clear_all: true }),
    });
    if (!res.ok) {
      toast.error("Failed to clear articles");
      return;
    }
    toast.success("All approved articles cleared");
    mutate();
  };

  return {
    articles: data ?? [],
    error,
    isLoading,
    mutate,
    clearArticles,
    clearAll,
  };
}
