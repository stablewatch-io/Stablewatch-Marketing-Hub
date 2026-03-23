"use client";

import useSWR from "swr";

export interface DashboardStats {
  totalDrafts: number;
  totalPublished: number;
  totalContent: number;
  pendingNews: number;
  recentFormats: number;
  channels: {
    twitter: number;
    telegram: number;
    other: number;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useDashboardStats() {
  const { data, error, isLoading } = useSWR<DashboardStats>(
    "/api/dashboard/stats",
    fetcher,
    { refreshInterval: 120_000, revalidateOnFocus: false }
  );

  return { data, error, isLoading };
}
