"use client";

import { Card, CardContent, Skeleton } from "@heroui/react";
import { MarketData } from "@/hooks/use-market-data";

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

function formatChange(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

interface StatCardsProps {
  data?: MarketData;
  isLoading?: boolean;
}

export function StatCards({ data, isLoading }: StatCardsProps) {
  const kpis = data
    ? [
        {
          icon: "account_balance",
          label: "Total TVL",
          value: formatNumber(data.totalTvl),
          change: formatChange(data.tvlChange24h),
        },
        {
          icon: "trending_up",
          label: "24h Volume",
          value: formatNumber(data.volume24h),
          change: formatChange(data.volumeChange24h),
        },
        {
          icon: "pie_chart",
          label: "USDT Dominance",
          value: `${data.usdtDominance.toFixed(1)}%`,
          change: "",
        },
        {
          icon: "token",
          label: "Active Stablecoins",
          value: String(data.activeStablecoins),
          change: "",
        },
      ]
    : [];

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="w-14 h-5 rounded-full" />
              </div>
              <Skeleton className="w-24 h-3 rounded mb-2" />
              <Skeleton className="w-20 h-7 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--sw-primary)]/20 flex items-center justify-center text-[var(--sw-primary)]">
                <span className="material-symbols-outlined">{kpi.icon}</span>
              </div>
              {kpi.change && (
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    kpi.change.startsWith("+")
                      ? "text-emerald-600 bg-emerald-50"
                      : "text-red-500 bg-red-50"
                  }`}
                >
                  {kpi.change}
                </span>
              )}
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sw-text-muted)] mb-1">
              {kpi.label}
            </p>
            <h3 className="text-2xl font-bold text-[var(--sw-text)]">
              {kpi.value}
            </h3>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
