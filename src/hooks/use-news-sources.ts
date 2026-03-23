"use client";

import useSWR from "swr";
import { useCallback } from "react";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export interface NewsSource {
  id: string;
  name: string;
  type: "rss" | "api";
  url: string;
  is_active: boolean;
  created_at: string;
}

export function useNewsSources() {
  const { data, error, isLoading, mutate } = useSWR<NewsSource[]>(
    "/api/news/sources",
    fetcher
  );

  const addSource = useCallback(
    async (name: string, type: "rss" | "api", url: string) => {
      const res = await fetch("/api/news/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, url }),
      });
      if (!res.ok) throw new Error("Failed to add source");
      mutate();
    },
    [mutate]
  );

  const updateSource = useCallback(
    async (
      id: string,
      updates: Partial<Pick<NewsSource, "name" | "type" | "url" | "is_active">>
    ) => {
      const res = await fetch("/api/news/sources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) throw new Error("Failed to update source");
      mutate();
    },
    [mutate]
  );

  const removeSource = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/news/sources?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete source");
      mutate();
    },
    [mutate]
  );

  return {
    sources: data ?? [],
    error,
    isLoading,
    mutate,
    addSource,
    updateSource,
    removeSource,
  };
}
