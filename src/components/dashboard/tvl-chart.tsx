"use client";

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@heroui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { MarketData } from "@/hooks/use-market-data";

interface TvlChartProps {
  data?: MarketData;
  isLoading?: boolean;
}

export function TvlChart({ data, isLoading }: TvlChartProps) {
  const history = data?.tvlHistory ?? [];
  const weekData = history.slice(-7);

  if (isLoading || !data) {
    return (
      <Card className="lg:col-span-2">
        <CardContent className="p-6">
          <Skeleton className="w-48 h-6 rounded mb-6" />
          <Skeleton className="w-full h-56 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="px-6 pt-5 pb-0">
        <div className="flex justify-between items-center w-full">
          <CardTitle className="text-lg font-semibold">
            TVL Trend (Last 7 Days)
          </CardTitle>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--sw-text-muted)]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--sw-primary)]" /> TVL
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-5">
        <div className="h-[220px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData} barSize={28}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--sw-border)"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--sw-text-muted)" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--sw-text-muted)" }}
                tickFormatter={(v) =>
                  v >= 1_000_000_000
                    ? `${(v / 1_000_000_000).toFixed(0)}B`
                    : `${(v / 1_000_000).toFixed(0)}M`
                }
              />
              <Tooltip
                formatter={(value) =>
                  `$${(Number(value) / 1_000_000_000).toFixed(2)}B`
                }
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--sw-border)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              />
              <Bar
                dataKey="tvl"
                fill="var(--sw-primary)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
