"use client";

import useSWR from "swr";
import { useCallback } from "react";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export interface Instruction {
  id: string;
  channel: string;
  slug: string;
  name: string;
  content: string;
  version: number;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useInstructions(channel: string, slug?: string) {
  const params = new URLSearchParams({ channel });
  if (slug) params.set("slug", slug);

  const { data, error, isLoading, mutate } = useSWR<Instruction[]>(
    `/api/instructions?${params}`,
    fetcher
  );

  const activeInstruction = data?.find((i) => i.is_active) ?? null;

  const createVersion = useCallback(
    async (content: string, notes?: string) => {
      const res = await fetch("/api/instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          slug,
          name: activeInstruction?.name ?? slug,
          content,
          notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to create version");
      const newInstruction = await res.json();
      mutate();
      return newInstruction;
    },
    [channel, slug, activeInstruction?.name, mutate]
  );

  const setActive = useCallback(
    async (instructionId: string) => {
      const res = await fetch("/api/instructions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructionId, channel, slug }),
      });
      if (!res.ok) throw new Error("Failed to set active version");
      mutate();
    },
    [channel, slug, mutate]
  );

  const deleteInstruction = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/instructions?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete instruction");
      mutate();
    },
    [mutate]
  );

  return {
    instructions: data ?? [],
    activeInstruction,
    error,
    isLoading,
    mutate,
    createVersion,
    setActive,
    deleteInstruction,
  };
}
