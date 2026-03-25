"use client";


import { useState, useCallback, useEffect } from "react";
import { Button, Tabs, Tab, TabList, TabListContainer, Badge } from "@heroui/react";
import { useNews, useLatestJob } from "@/hooks/use-news";
import { NewsItemCard } from "@/components/news/news-item-card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function NewsFeedView() {

  const [activeTab, setActiveTab] = useState<string>("feed");
  const [fetching, setFetching] = useState(false);
  const { articles, isLoading, mutate } = useNews("pending");
  const { articles: approvedArticles, mutate: mutateApproved } = useNews("approved");
  const { job } = useLatestJob();

  const handleReview = useCallback(
    async (
      articleId: string,
      status: "approved" | "rejected",
      editorialNote?: string
    ) => {
      try {
        const res = await fetch("/api/news/review", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            article_id: articleId,
            status,
            editorial_note: editorialNote,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success(`Article ${status}`);
        mutate();
      } catch {
        toast.error("Failed to update review");
      }
    },
    [mutate]
  );

  const handleFetchNow = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/news/aggregate", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Aggregation failed");
      }
      const result = await res.json();
      const { fetched = 0, relevant = 0 } = result;
      toast.success(
        `Fetched ${fetched} article${fetched !== 1 ? "s" : ""}, ${relevant} relevant`
      );
      mutate();
      mutateApproved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to trigger aggregation");
    } finally {
      setFetching(false);
    }
  }, [mutate, mutateApproved]);

  // Fetch once on mount
  useEffect(() => {
    handleFetchNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isJobRunning = job?.status === "running";

  // Ready to publish view
  const readyArticles = (approvedArticles ?? []).filter(
    (a) => Array.isArray(a.news_reviews) && a.news_reviews.length > 0 && a.news_reviews[0]?.is_cleared === false
  );

  const handleClear = async (articleId: string) => {
    await fetch("/api/news/clear", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ article_ids: [articleId] }),
    });
    mutateApproved();
  };

  const handleClearAll = async () => {
    await fetch("/api/news/clear", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clear_all: true }),
    });
    mutateApproved();
  };

  return (
    <div className="flex-1 flex justify-center overflow-hidden">
      <section className="w-full max-w-5xl flex flex-col gap-6 px-8 py-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className=" text-2xl font-bold text-(--sw-text) leading-tight">
              News
            </h2>
            <p className="text-(--sw-text-secondary) text-sm mt-1">
              Review and curate raw news from your connected sources.
            </p>
          </div>
        </div>

        {/* Filter Logic Button removed as requested */}
        <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(String(key))}>
          <TabListContainer>
            <TabList>
              <Tab id="feed">News Feed</Tab>
              <Tab id="ready">
                Ready to publish
                {readyArticles.length > 0 && (
                  <Badge className="ml-2" color="accent">
                    {readyArticles.length}
                  </Badge>
                )}
              </Tab>
            </TabList>
          </TabListContainer>
        </Tabs>

        {activeTab === "feed" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onPress={handleFetchNow}
              isDisabled={fetching || isJobRunning}
              className="flex items-center gap-2 text-(--sw-primary) hover:opacity-80 transition-opacity"
            >
              {(fetching || isJobRunning) ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-sm">refresh</span>
              )}
              <span className="text-xs font-bold">
                {fetching ? "FETCHING..." : isJobRunning ? "PROCESSING..." : "FETCH NOW"}
              </span>
            </Button>

            {(fetching || isJobRunning) && (
              <div className="px-4 py-3 bg-(--sw-primary-light)/30 rounded-lg text-xs text-(--sw-primary) font-medium flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {fetching
                  ? "Fetching and filtering articles — this may take a moment..."
                  : "Aggregation job running — new articles will appear automatically..."}
              </div>
            )}

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))
              ) : articles.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-sm text-(--sw-text-muted)">
                  No articles found.
                </div>
              ) : (
                articles.map((article) => (
                  <NewsItemCard
                    key={article.id}
                    article={article}
                    onApprove={(id, note) => handleReview(id, "approved", note)}
                    onDiscard={(id, note) => handleReview(id, "rejected", note)}
                  />
                ))
              )}
            </div>
          </>
        )}

        {activeTab === "ready" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-(--sw-primary)">Ready to publish</h3>
              {readyArticles.length > 0 && (
                <Button variant="outline" size="sm" onPress={handleClearAll}>
                  Clear all
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {readyArticles.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-sm text-(--sw-text-muted)">
                  No articles ready to publish.
                </div>
              ) : (
                readyArticles.map((article) => (
                  <div key={article.id} className="relative">
                    <NewsItemCard
                      article={article}
                      onApprove={() => {}}
                      onDiscard={() => {}}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      className="absolute top-4 right-4"
                      onPress={() => handleClear(article.id)}
                    >
                      Done
                    </Button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Filter Logic tab removed as per new design */}
      </section>
    </div>
  );
}
