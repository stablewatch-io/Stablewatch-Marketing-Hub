"use client";

import useSWR from "swr";
import { useState, useCallback } from "react";
import type { TwitterDraft } from "@/components/twitter/draft-card";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export function useTwitterDrafts(status?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);

  const { data, error, isLoading, mutate } = useSWR<TwitterDraft[]>(
    `/api/twitter/drafts?${params}`,
    fetcher
  );

  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(
    async (count: number) => {
      setIsGenerating(true);
      try {
        const res = await fetch("/api/twitter/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ count }),
        });
        if (!res.ok) throw new Error("Failed to generate");
        mutate();
      } finally {
        setIsGenerating(false);
      }
    },
    [mutate]
  );

  const approve = useCallback(
    async (draftId: string) => {
      const res = await fetch(`/api/twitter/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      mutate();
    },
    [mutate]
  );

  const remove = useCallback(
    async (draftId: string) => {
      const res = await fetch(`/api/twitter/drafts/${draftId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      mutate();
    },
    [mutate]
  );

  const update = useCallback(
    async (draftId: string, body: string) => {
      const res = await fetch(`/api/twitter/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error("Failed to update");
      mutate();
    },
    [mutate]
  );

  return {
    drafts: data ?? [],
    error,
    isLoading,
    mutate,
    generate,
    approve,
    remove,
    update,
    isGenerating,
  };
}
