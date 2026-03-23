"use client";

import { useState } from "react";
import { Button, TextArea, Chip } from "@heroui/react";

interface MdEditorProps {
  filename: string;
  content: string;
  version?: number;
  isLive?: boolean;
  lastSynced?: string;
  onSave: (content: string, notes?: string) => Promise<void>;
  onReplace?: () => void;
  readOnly?: boolean;
}

export function MdEditor({
  filename,
  content: initialContent,
  version,
  isLive,
  lastSynced,
  onSave,
  onReplace,
  readOnly = false,
}: MdEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const hasChanges = content !== initialContent;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(content);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[var(--sw-border)]/20 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--sw-border)]/10 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[var(--sw-primary)]">
            article
          </span>
          <span className="text-sm font-bold text-[var(--sw-text)]">{filename}</span>
          {isLive && (
            <Chip size="sm" className="bg-green-100 text-green-800 text-[10px] font-bold uppercase">
              Live
            </Chip>
          )}
          {version && (
            <span className="text-[10px] font-mono text-[var(--sw-text-muted)]">
              v{version}
            </span>
          )}
        </div>
        {lastSynced && (
          <span className="text-[10px] text-[var(--sw-text-muted)] uppercase tracking-widest font-medium">
            Last synced: {lastSynced}
          </span>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          readOnly={readOnly}
          spellCheck={false}
          className="w-full min-h-[400px] p-8 font-mono text-sm text-[var(--sw-text)] bg-transparent border-none focus:ring-0 resize-none"
          placeholder="Enter markdown content..."
        />
      </div>

      {/* Footer */}
      <div className="p-4 bg-[var(--sw-bg-card)]/30 border-t border-[var(--sw-border)]/10 flex gap-4">
        <Button
          onPress={handleSave}
          isDisabled={!hasChanges || saving || readOnly}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-lg"
        >
          <span className="material-symbols-outlined text-sm">edit_note</span>
          <span>{saving ? "Saving..." : "Save Changes"}</span>
        </Button>
        {onReplace && (
          <Button
            onPress={onReplace}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-lg"
          >
            <span className="material-symbols-outlined text-sm">
              swap_horiz
            </span>
            <span>Replace Version</span>
          </Button>
        )}
      </div>
    </div>
  );
}
