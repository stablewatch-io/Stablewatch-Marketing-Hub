"use client";

import { Button } from "@heroui/react";
import { useKnowledgeBase } from "@/hooks/use-knowledge-base";

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: "picture_as_pdf",
  csv: "table_chart",
  md: "description",
  docx: "article",
};

interface KnowledgeBasePanelProps {
  channel: string;
}

export function KnowledgeBasePanel({ channel }: KnowledgeBasePanelProps) {
  const { files, isLoading, upload, remove } = useKnowledgeBase(channel);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await upload(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-4">
      <label className="text-xs font-bold text-[var(--sw-text-muted)] uppercase tracking-widest px-1">
        Knowledge Base Documents
      </label>

      {/* File list */}
      <div className="grid grid-cols-2 gap-4">
        {isLoading && (
          <div className="col-span-2 text-xs text-[var(--sw-text-muted)] p-4">
            Loading...
          </div>
        )}
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-white border border-[var(--sw-border)]/10 p-4 rounded-xl flex items-center gap-3 group"
          >
            <span className="material-symbols-outlined text-[var(--sw-primary)]">
              {FILE_TYPE_ICONS[file.file_type ?? ""] ?? "draft"}
            </span>
            <div className="truncate flex-1">
              <p className="text-xs font-bold truncate">{file.filename}</p>
              <p className="text-[10px] text-[var(--sw-text-muted)]">
                {file.file_size
                  ? `${(file.file_size / 1024).toFixed(1)} KB`
                  : ""}
              </p>
            </div>
            <Button
              onPress={() => remove(file.id)}
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 text-[var(--sw-text-muted)] hover:text-red-600 transition-all min-w-0 p-1"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </Button>
          </div>
        ))}
      </div>

      {/* Upload zone */}
      <label className="bg-white/50 border-2 border-dashed border-[var(--sw-border)]/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 group hover:border-[var(--sw-primary)]/40 hover:bg-[var(--sw-primary)]/[0.02] transition-all cursor-pointer">
        <input
          type="file"
          accept=".pdf,.csv,.md,.docx"
          onChange={handleUpload}
          className="hidden"
        />
        <div className="w-10 h-10 rounded-full bg-[#eeeeee] flex items-center justify-center text-[var(--sw-text-muted)] group-hover:text-[var(--sw-primary)] group-hover:scale-110 transition-all">
          <span className="material-symbols-outlined text-xl">
            upload_file
          </span>
        </div>
        <div className="text-center">
          <span className="text-sm font-bold text-[var(--sw-primary)] block uppercase tracking-wider">
            Add Knowledge Base File
          </span>
          <span className="text-[10px] text-[var(--sw-text-muted)] mt-0.5 block">
            PDF, MD, CSV, or DOCX (Max 50MB)
          </span>
        </div>
      </label>
    </div>
  );
}
