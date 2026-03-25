import { useSWRConfig } from "swr";
import { toast } from "sonner";

export function useReviewArticle() {
  const { mutate } = useSWRConfig();

  const review = async (
    articleId: string,
    status: "approved" | "rejected",
    notes?: string
  ) => {
    const res = await fetch("/api/news/review", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ article_id: articleId, status, notes }),
    });

    if (!res.ok) {
      toast.error("Failed to update review");
      return null;
    }

    toast.success(`Article ${status}`);
    mutate(
      (key: unknown) =>
        typeof key === "string" && key.startsWith("/api/news/")
    );
    return res.json();
  };

  return { review };
}
