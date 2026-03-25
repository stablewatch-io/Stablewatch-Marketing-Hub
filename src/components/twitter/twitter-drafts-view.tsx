"use client";

import { useState, useCallback } from "react";
import { Button } from "@heroui/react";
import { DraftCard } from "@/components/twitter/draft-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTwitterDrafts } from "@/hooks/use-twitter-drafts";
import { toast } from "sonner";

const POST_COUNTS = [5, 10, 15] as const;

export function TwitterDraftsView() {
  const [count, setCount] = useState<number>(5);
  const { drafts, isLoading, generate, approve, remove, update, isGenerating } =
    useTwitterDrafts();

  const handleGenerate = useCallback(async () => {
    try {
      await generate(count);
      toast.success(`${count} drafts generated`);
    } catch {
      toast.error("Failed to generate drafts");
    }
  }, [count, generate]);

  return (
    <div className="flex-1 flex justify-center overflow-hidden bg-(--sw-bg)">
      <section className="w-full max-w-4xl flex flex-col px-8 py-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h3 className=" text-2xl font-bold text-(--sw-text) leading-tight">
              Draft Proposals
            </h3>
            <p className="text-(--sw-text-secondary) text-sm mt-1">
              Review and approve AI-generated social content variations.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] text-(--sw-text-muted) font-bold uppercase tracking-widest mr-1">
              {drafts.length} Variations Ready
            </span>
            <div className="flex items-center gap-3 bg-(--sw-bg-card) p-1 rounded-xl border border-(--sw-border)/10">
              <label className="text-[10px] font-bold text-(--sw-text-muted) uppercase tracking-widest pl-3">
                Posts to Generate:
              </label>
              <div className="flex bg-white rounded-lg p-0.5 shadow-sm border border-(--sw-border)/10">
                {POST_COUNTS.map((c) => (
                  <Button
                    key={c}
                    size="sm"
                    variant={count === c ? "primary" : "ghost"}
                    onPress={() => setCount(c)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md ${
                      count === c
                        ? "bg-(--sw-primary) text-white"
                        : "text-(--sw-text-muted) hover:text-(--sw-primary)"
                    }`}
                  >
                    {c}
                  </Button>
                ))}
              </div>
              <Button
                variant="primary"
                size="sm"
                onPress={handleGenerate}
                isDisabled={isGenerating}
                className="ml-2 px-6 py-2 bg-[#2d9b99] text-white text-xs font-bold rounded-lg shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">
                  magic_button
                </span>
                {isGenerating ? "Generating..." : "Re-create"}
              </Button>
            </div>
          </div>
        </div>

        {/* Draft feed */}
        <div className="flex-1 overflow-y-auto pr-4 space-y-6 pb-20">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))
          ) : drafts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-sm text-(--sw-text-muted)">
              No drafts yet. Click &ldquo;Re-create&rdquo; to generate your
              first batch.
            </div>
          ) : (
            drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onApprove={() => approve(draft.id)}
                onDelete={() => remove(draft.id)}
                onEdit={(id, body) => update(id, body)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
