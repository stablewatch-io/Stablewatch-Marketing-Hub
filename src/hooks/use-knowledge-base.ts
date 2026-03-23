"use client";

import useSWR from "swr";
import { useCallback } from "react";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export interface KnowledgeBaseFile {
  id: string;
  channel: string;
  filename: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export function useKnowledgeBase(channel: string) {
  const { data, error, isLoading, mutate } = useSWR<KnowledgeBaseFile[]>(
    `/api/knowledge-base?channel=${channel}`,
    fetcher
  );

  const upload = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("channel", channel);

      const res = await fetch("/api/knowledge-base", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload file");
      mutate();
    },
    [channel, mutate]
  );

  const remove = useCallback(
    async (fileId: string) => {
      const res = await fetch(`/api/knowledge-base?id=${fileId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete file");
      mutate();
    },
    [mutate]
  );

  return {
    files: data ?? [],
    error,
    isLoading,
    mutate,
    upload,
    remove,
  };
}
