"use client";

import useSWR from "swr";
import { useState, useCallback } from "react";
import type { FormattingHistoryItem } from "@/components/telegram/activity-log";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

interface FormatOutput {
  formatted: string;
  charCount: number;
}

export function useTelegramFormatter() {
  const [output, setOutput] = useState<FormatOutput | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);

  const { data: history, mutate: mutateHistory } = useSWR<
    FormattingHistoryItem[]
  >("/api/telegram/history", fetcher);

  const format = useCallback(
    async (
      input: string,
      sourceType: "twitter_link" | "article_url" | "raw_text"
    ) => {
      setIsFormatting(true);
      try {
        const res = await fetch("/api/telegram/format", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input, sourceType }),
        });
        if (!res.ok) throw new Error("Failed to format");
        const data = await res.json();
        setOutput(data);
        mutateHistory();
        return data;
      } finally {
        setIsFormatting(false);
      }
    },
    [mutateHistory]
  );

  return {
    output,
    setOutput,
    isFormatting,
    format,
    history: history ?? [],
  };
}
