"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, Button, Skeleton } from "@heroui/react";
import { DashboardStats } from "@/hooks/use-dashboard-stats";

interface ChannelDistributionProps {
  stats?: DashboardStats;
  isLoading?: boolean;
}

export function ChannelDistribution({ stats, isLoading }: ChannelDistributionProps) {
  const router = useRouter();

  const channels = [
    {
      name: "Twitter / X",
      sub: "Primary Hub",
      icon: "campaign",
      pct: stats?.channels.twitter ?? 0,
    },
    {
      name: "Telegram",
      sub: "Communities",
      icon: "send",
      pct: stats?.channels.telegram ?? 0,
    },
    {
      name: "Other",
      sub: "Editorial",
      icon: "language",
      pct: stats?.channels.other ?? 0,
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="w-36 h-6 rounded" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-full h-12 rounded" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-6 pt-5 pb-0">
        <CardTitle className="text-lg font-semibold">Top Channels</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-5">
        {/* Content stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mt-3 mb-5 py-3 border-b border-[var(--sw-border)]">
            <div>
              <p className="text-xl font-bold text-[var(--sw-text)]">
                {stats.totalDrafts}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sw-text-muted)] font-medium">
                Drafts
              </p>
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--sw-text)]">
                {stats.totalPublished}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sw-text-muted)] font-medium">
                Published
              </p>
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--sw-text)]">
                {stats.pendingNews}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sw-text-muted)] font-medium">
                Pending News
              </p>
            </div>
          </div>
        )}

        {/* Channel bars */}
        <div className="space-y-4">
          {channels.map((ch) => (
            <div
              key={ch.name}
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--sw-bg-card)] flex items-center justify-center text-[var(--sw-primary)] group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">{ch.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--sw-text)]">
                    {ch.name}
                  </p>
                  <p className="text-[10px] text-[var(--sw-text-muted)] uppercase font-medium">
                    {ch.sub}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[var(--sw-text)]">
                  {ch.pct}%
                </p>
                <div className="w-16 h-1 bg-[var(--sw-border)] rounded-full mt-1">
                  <div
                    className="h-full bg-[var(--sw-primary)] rounded-full"
                    style={{ width: `${ch.pct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full mt-5"
          size="sm"
          onPress={() => router.push("/news")}
        >
          View All Channels
        </Button>
      </CardContent>
    </Card>
  );
}
