"use client";

import { useState } from "react";
import { Button, TextArea, Chip } from "@heroui/react";
import { useTelegramFormatter } from "@/hooks/use-telegram-formatter";
import { ActivityLog } from "@/components/telegram/activity-log";
import { toast } from "sonner";

export function FormatterView() {
  const [inputText, setInputText] = useState("");
  const [sourceType, setSourceType] = useState<
    "twitter_link" | "article_url" | "raw_text"
  >("raw_text");
  const [sending, setSending] = useState(false);
  const { output, setOutput, isFormatting, format, history } = useTelegramFormatter();

  async function handleFormat() {
    if (!inputText.trim()) return;
    try {
      await format(inputText, sourceType);
    } catch {
      toast.error("Failed to format text");
    }
  }

  function handleCopy() {
    if (output) {
      navigator.clipboard.writeText(output.formatted);
      toast.success("Copied to clipboard");
    }
  }

  async function handleSendToTelegram() {
    if (!output) return;
    setSending(true);
    try {
      const res = await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: output.formatted }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }
      toast.success("Message sent to Telegram channel!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send to Telegram");
    } finally {
      setSending(false);
    }
  }

  function handleRestore(outputText: string) {
    setOutput({ formatted: outputText, charCount: outputText.length });
    toast.success("Output restored from history");
  }

  return (
    <div className="flex flex-col">
      {/* Editor Split View */}
      <section className="px-8 py-8 max-w-7xl mx-auto w-full">
        <div className="flex gap-6 h-[640px]">
          {/* Left: Input */}
          <div className="flex-1 flex flex-col bg-[var(--sw-bg-card)] rounded-2xl overflow-hidden border border-[var(--sw-border)]/10 shadow-sm">
            <div className="px-6 py-4 flex items-center justify-between bg-[var(--sw-bg-card)]/50">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--sw-text-secondary)]">
                Source Material
              </span>
              <div className="flex gap-2">
                {(
                  [
                    ["raw_text", "Raw Text"],
                    ["twitter_link", "Twitter Link"],
                    ["article_url", "Article URL"],
                  ] as const
                ).map(([type, label]) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={sourceType === type ? "primary" : "ghost"}
                    onPress={() => setSourceType(type)}
                    className="text-[10px] font-bold rounded-full"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <TextArea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 w-full bg-transparent border-none focus:ring-0 p-8 text-[var(--sw-text)] leading-relaxed resize-none text-sm"
              placeholder="Paste your raw content or news links here..."
            />
            <div className="p-6 bg-[var(--sw-bg-card)]/50 flex justify-end">
              <Button
                onPress={handleFormat}
                isDisabled={isFormatting || !inputText.trim()}
                variant="primary"
                size="lg"
                className="bg-gradient-to-br from-[var(--sw-primary)] to-[var(--sw-primary-hover)] text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-[var(--sw-primary)]/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span>
                  {isFormatting ? "Formatting..." : "Format for Telegram"}
                </span>
                <span className="material-symbols-outlined text-sm">
                  magic_button
                </span>
              </Button>
            </div>
          </div>

          {/* Right: Output */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden border border-[var(--sw-border)]/10">
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--sw-primary)]">
                Formatted Result
              </span>
              <Chip size="sm" className="bg-[var(--sw-primary-light)] text-[#476b69] text-[10px] font-medium">
                Markdown v2
              </Chip>
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
              {output ? (
                <div className="prose prose-sm max-w-none text-[var(--sw-text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {output.formatted}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-[var(--sw-text-muted)]">
                  Formatted output will appear here...
                </div>
              )}
            </div>
            <div className="p-6 flex justify-between items-center border-t border-[var(--sw-border)]/5">
              <div className="flex items-center gap-4 text-[10px] text-[var(--sw-text-secondary)]">
                <span>Chars: {output?.charCount ?? 0}</span>
                <span>
                  Estimated Reading:{" "}
                  {output ? Math.ceil(output.charCount / 20) : 0}s
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onPress={handleSendToTelegram}
                  isDisabled={!output || sending}
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-2 px-6 py-2 rounded-full font-bold text-xs"
                >
                  <span className="material-symbols-outlined text-sm">
                    send
                  </span>
                  <span>{sending ? "Sending..." : "Send to Telegram"}</span>
                </Button>
                <Button
                  onPress={handleCopy}
                  isDisabled={!output}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 px-6 py-2 rounded-full font-bold text-xs"
                >
                  <span className="material-symbols-outlined text-sm">
                    content_copy
                  </span>
                  <span>Copy Text</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Activity Log */}
      <ActivityLog history={history} onRestore={handleRestore} />
    </div>
  );
}
