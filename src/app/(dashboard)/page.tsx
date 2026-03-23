"use client";

import { TopAppBar } from "@/components/layout/top-app-bar";
import { StatCards } from "@/components/dashboard/stat-cards";
import { TvlChart } from "@/components/dashboard/tvl-chart";
import { ChannelDistribution } from "@/components/dashboard/channel-distribution";
import { useMarketData } from "@/hooks/use-market-data";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

export default function DashboardPage() {
  const { data: marketData, isLoading: marketLoading } = useMarketData();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  return (
    <div className="flex flex-col min-h-screen">
      <TopAppBar title="Stablewatch AI" />
      <div className="flex-1 p-6 space-y-6">
        <section>
          <h2 className="text-3xl font-bold text-[var(--sw-text)] tracking-tight">
            Market Overview
          </h2>
          <p className="text-[var(--sw-text-muted)] mt-1">
            Live stablecoin market data and content analytics.
          </p>
        </section>

        <StatCards data={marketData} isLoading={marketLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TvlChart data={marketData} isLoading={marketLoading} />
          <ChannelDistribution stats={stats} isLoading={statsLoading} />
        </div>
      </div>
    </div>
  );
}
