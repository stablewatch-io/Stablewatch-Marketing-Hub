"use client";

import { useState } from "react";
import { Button, Card, TextArea, Chip } from "@heroui/react";
import { toast } from "sonner";

export interface TwitterDraft {
  id: string;
  body: string;
  post_label: string | null;
  status: string;
  created_at: string;
}

interface DraftCardProps {
  draft: TwitterDraft;
  onApprove: () => void;
  onDelete: () => void;
  onEdit: (id: string, body: string) => Promise<void>;
}

export function DraftCard({ draft, onApprove, onDelete, onEdit }: DraftCardProps) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(draft.body);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onEdit(draft.id, editBody);
      setEditing(false);
      toast.success("Draft updated");
    } catch {
      toast.error("Failed to update draft");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-8 flex flex-col gap-6 transition-all hover:shadow-xl hover:shadow-[var(--sw-primary)]/5">
      <div className="flex justify-between items-start">
        {draft.post_label && (
          <Chip
            size="sm"
            variant="soft"
            className="bg-[var(--sw-primary-light)] text-[var(--sw-text-secondary)] text-[10px] font-bold uppercase tracking-wider"
          >
            {draft.post_label}
          </Chip>
        )}
        <span className="text-[10px] text-[var(--sw-text-muted)] font-mono">
          {draft.id.slice(0, 8)}
        </span>
      </div>

      {editing ? (
        <div className="space-y-3">
          <TextArea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={4}
            className="bg-[var(--sw-bg-card)] border border-[var(--sw-border)]/20 rounded-xl text-lg text-[var(--sw-text)] leading-relaxed font-medium"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--sw-text-muted)]">{editBody.length}/280</span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onPress={() => { setEditing(false); setEditBody(draft.body); }}
                className="text-xs font-bold text-[var(--sw-text-muted)]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onPress={handleSave}
                isDisabled={saving}
                className="text-xs font-bold bg-[var(--sw-primary)] text-white rounded-lg"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-lg text-[var(--sw-text)] leading-relaxed font-medium whitespace-pre-wrap">
          {draft.body}
        </p>
      )}

      <div className="flex gap-3 pt-2 border-t border-[var(--sw-border)]/10 pt-6">
        <Button
          variant="primary"
          onPress={onApprove}
          className="flex-1 bg-[var(--sw-primary)] text-white text-sm font-bold py-3.5 rounded-xl"
        >
          <span className="material-symbols-outlined text-lg">
            check_circle
          </span>
          Approve &amp; Schedule
        </Button>
        <Button
          variant="ghost"
          onPress={() => { setEditing(true); setEditBody(draft.body); }}
          className="px-5 py-3.5 rounded-xl bg-[var(--sw-bg-card)] text-[var(--sw-text-secondary)] hover:bg-[#e8e8e8]"
        >
          <span className="material-symbols-outlined">edit</span>
        </Button>
        <Button
          variant="danger-soft"
          onPress={onDelete}
          className="px-5 py-3.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
        >
          <span className="material-symbols-outlined">delete</span>
        </Button>
      </div>
    </Card>
  );
}
