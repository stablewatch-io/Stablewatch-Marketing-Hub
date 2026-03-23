"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@heroui/react";
import { useNews, useLatestJob } from "@/hooks/use-news";
import { NewsItemCard } from "@/components/news/news-item-card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const TIME_RANGES = ["6h", "16h", "24h", "48h"] as const;

export function NewsFeedView() {
  const [range, setRange] = useState<string>("24h");
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [fetching, setFetching] = useState(false);
  const { articles, isLoading, mutate } = useNews("pending", range);
  const { job } = useLatestJob();
  const autoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      if (!res.ok) throw new Error();
      toast.success("Aggregation triggered — articles will appear shortly");
      // Wait a bit then refresh
      setTimeout(() => mutate(), 5000);
    } catch {
      toast.error("Failed to trigger aggregation");
    } finally {
      setFetching(false);
    }
  }, [mutate]);

  // Auto-fetch mode
  useEffect(() => {
    if (mode === "auto") {
      // Fetch immediately when entering auto mode
      handleFetchNow();
      // Then fetch every 10 minutes
      autoIntervalRef.current = setInterval(handleFetchNow, 10 * 60 * 1000);
    }
    return () => {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
    };
  }, [mode, handleFetchNow]);

  const isJobRunning = job?.status === "running";

  return (
    <div className="flex-1 flex justify-center overflow-hidden">
      <section className="w-full max-w-5xl flex flex-col gap-6 px-8 py-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className=" text-2xl font-bold text-[var(--sw-text)] leading-tight">
              Incoming News Feed
            </h2>
            <p className="text-[var(--sw-text-secondary)] text-sm mt-1">
              Review and curate raw news from your connected sources.
            </p>
          </div>
          {/* Time range selector */}
          <div className="flex items-center gap-3 bg-[var(--sw-bg-card)] p-1 rounded-xl">
            {TIME_RANGES.map((r) => (
              <Button
                key={r}
                size="sm"
                variant={range === r ? "secondary" : "ghost"}
                onPress={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  range === r
                    ? "bg-white shadow-sm text-[var(--sw-primary)]"
                    : "hover:bg-white/60 text-[var(--sw-text-muted)]"
                }`}
              >
                {r}
              </Button>
            ))}
          </div>
        </div>

        {/* Source/Mode bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/50 rounded-xl border border-[var(--sw-border)]/10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--sw-text-muted)]">SOURCE:</span>
              <span className="px-2 py-0.5 rounded bg-[#e2e2e2] text-[10px] font-bold">
                ALL RSS
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--sw-text-muted)]">MODE:</span>
              <Button
                size="sm"
                variant={mode === "manual" ? "primary" : "ghost"}
                onPress={() => setMode("manual")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  mode === "manual"
                    ? "bg-[var(--sw-primary)] text-white"
                    : "bg-[#e2e2e2] text-[var(--sw-text-muted)] hover:bg-[#d0d0d0]"
                }`}
              >
                MANUAL
              </Button>
              <Button
                size="sm"
                variant={mode === "auto" ? "primary" : "ghost"}
                onPress={() => setMode("auto")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  mode === "auto"
                    ? "bg-[var(--sw-primary)] text-white"
                    : "bg-[#e2e2e2] text-[var(--sw-text-muted)] hover:bg-[#d0d0d0]"
                }`}
              >
                AUTO-FETCH
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onPress={handleFetchNow}
            isDisabled={fetching || isJobRunning}
            className="flex items-center gap-2 text-[var(--sw-primary)] hover:opacity-80 transition-opacity"
          >
            <span className={`material-symbols-outlined text-sm ${(fetching || isJobRunning) ? "animate-spin" : ""}`}>
              refresh
            </span>
            <span className="text-xs font-bold">
              {isJobRunning ? "FETCHING..." : fetching ? "TRIGGERING..." : "FETCH NOW"}
            </span>
          </Button>
        </div>

        {/* Job status banner */}
        {isJobRunning && (
          <div className="px-4 py-2 bg-[var(--sw-primary-light)]/30 rounded-lg text-xs text-[var(--sw-primary)] font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
            Aggregation job running — new articles will appear automatically...
          </div>
        )}

        {/* Article list */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))
          ) : articles.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-sm text-[var(--sw-text-muted)]">
              No articles found. Try fetching news or adjusting the time range.
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
      </section>
    </div>
  );
}
