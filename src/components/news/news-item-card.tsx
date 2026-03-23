"use client";

import { useState } from "react";
import { Button, TextArea, Chip } from "@heroui/react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface NewsArticle {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  published_at: string | null;
  source_name: string;
}

interface NewsItemCardProps {
  article: NewsArticle;
  onApprove: (id: string, note?: string) => void;
  onDiscard: (id: string, note?: string) => void;
}

export function NewsItemCard({
  article,
  onApprove,
  onDiscard,
}: NewsItemCardProps) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const timeAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : "recently";

  async function handleSaveNote() {
    if (!note.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/news/editorial-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article_id: article.id, note, is_draft: true }),
      });
      if (!res.ok) throw new Error();
      toast.success("Note saved");
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 transition-all hover:shadow-xl hover:shadow-[var(--sw-primary)]/5 group border-transparent border-l-4 hover:border-[var(--sw-primary)]">
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <Chip
            size="sm"
            className="text-[10px] font-bold text-[#416463] uppercase tracking-tighter bg-[var(--sw-primary-light)] px-2 py-0.5 rounded-full"
          >
            {article.source_name} &bull; {timeAgo}
          </Chip>
        </div>
        <h3 className=" text-xl font-bold text-[var(--sw-text)] mb-2">
          {article.title}
        </h3>
        {article.summary && (
          <p className="text-[var(--sw-text-secondary)] text-base leading-relaxed mb-6">
            {article.summary}
          </p>
        )}
        <div className="grid grid-cols-2 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[var(--sw-text-muted)] uppercase tracking-widest ml-1">
              Editorial Note / AI Feedback
            </label>
            <TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-sm bg-[var(--sw-bg-card)] border-none rounded-lg p-3 focus:ring-1 focus:ring-[var(--sw-primary)]/20 min-h-[80px] resize-none"
              placeholder="Add internal context or correction notes here..."
            />
            {note && (
              <div className="flex justify-end mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={handleSaveNote}
                  isDisabled={saving}
                  className="text-[10px] font-bold text-[var(--sw-primary)] hover:underline flex items-center gap-1 uppercase"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    save
                  </span>
                  {saving ? "Saving..." : "Save Draft Note"}
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              size="md"
              onPress={() => onDiscard(article.id, note || undefined)}
              className="px-6 py-2.5 text-xs font-bold bg-[#e2e2e2] text-[var(--sw-text)] rounded-lg hover:bg-[var(--sw-border)]/30 transition-colors uppercase"
            >
              Discard Item
            </Button>
            <Button
              variant="primary"
              size="md"
              onPress={() => onApprove(article.id, note || undefined)}
              className="px-8 py-2.5 text-xs font-bold bg-gradient-to-br from-[var(--sw-primary)] to-[var(--sw-primary-hover)] text-white rounded-lg shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all uppercase"
            >
              Approve &amp; Publish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
