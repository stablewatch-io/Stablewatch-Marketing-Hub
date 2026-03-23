"use client";

import { Button } from "@heroui/react";

interface SourceCardProps {
  id: string;
  name: string;
  url: string;
  type: "rss" | "api";
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SourceCard({ id, name, url, type, onEdit, onDelete }: SourceCardProps) {
  return (
    <div className="bg-white border border-[var(--sw-border)]/10 p-4 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow group">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            type === "rss"
              ? "bg-orange-50 text-orange-600"
              : "bg-slate-50 text-slate-900"
          }`}
        >
          {type === "rss" ? (
            <span className="material-symbols-outlined">rss_feed</span>
          ) : (
            <span className="text-lg font-black">𝕏</span>
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--sw-text)]">{name}</p>
          <p className="text-[11px] font-mono text-[var(--sw-text-muted)]">{url}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onPress={() => onEdit(id)}
          className="p-2 rounded-lg hover:bg-[#eeeeee] text-[var(--sw-text-muted)] hover:text-[var(--sw-primary)] transition-all"
        >
          <span className="material-symbols-outlined text-xl">edit</span>
        </Button>
        <Button
          variant="danger-soft"
          size="sm"
          onPress={() => onDelete(id)}
          className="p-2 rounded-lg hover:bg-red-50 text-[var(--sw-text-muted)] hover:text-red-600 transition-all"
        >
          <span className="material-symbols-outlined text-xl">delete</span>
        </Button>
      </div>
    </div>
  );
}
