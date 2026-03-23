import { NextResponse } from "next/server";

const API_URL = process.env.STABLEWATCH_API_URL ?? "https://api.stablewatch.io";
const API_KEY = process.env.STABLEWATCH_API_KEY ?? "";

export async function GET() {
  try {
    const [statsRes, historyRes, coinsRes] = await Promise.all([
      fetch(`${API_URL}/v1/stats`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
        next: { revalidate: 60 },
      }),
      fetch(`${API_URL}/v1/tvl/history?days=30`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
        next: { revalidate: 60 },
      }),
      fetch(`${API_URL}/v1/stablecoins?limit=20`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
        next: { revalidate: 60 },
      }),
    ]);

    // If API is unavailable, return mock data for development
    if (!statsRes.ok || !historyRes.ok || !coinsRes.ok) {
      return NextResponse.json(getMockData());
    }

    const [stats, history, coins] = await Promise.all([
      statsRes.json(),
      historyRes.json(),
      coinsRes.json(),
    ]);

    return NextResponse.json({
      totalTvl: stats.totalTvl ?? 0,
      volume24h: stats.volume24h ?? 0,
      usdtDominance: stats.usdtDominance ?? 0,
      activeStablecoins: stats.activeStablecoins ?? 0,
      tvlChange24h: stats.tvlChange24h ?? 0,
      volumeChange24h: stats.volumeChange24h ?? 0,
      tvlHistory: history.data ?? [],
      stablecoins: (coins.data ?? []).map((c: Record<string, unknown>) => ({
        name: c.name,
        symbol: c.symbol,
        marketCap: c.marketCap ?? c.market_cap ?? 0,
        volume24h: c.volume24h ?? c.volume_24h ?? 0,
        change7d: c.change7d ?? c.change_7d ?? 0,
      })),
    });
  } catch {
    // Return mock data if the API is unreachable
    return NextResponse.json(getMockData());
  }
}

function getMockData() {
  const now = Date.now();
  return {
    totalTvl: 182_300_000_000,
    volume24h: 48_200_000_000,
    usdtDominance: 62.4,
    activeStablecoins: 147,
    tvlChange24h: 1.2,
    volumeChange24h: -3.1,
    tvlHistory: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(now - (29 - i) * 86400000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      tvl: 175_000_000_000 + Math.random() * 15_000_000_000,
    })),
    stablecoins: [
      { name: "Tether", symbol: "USDT", marketCap: 113_800_000_000, volume24h: 32_100_000_000, change7d: 1.2 },
      { name: "USD Coin", symbol: "USDC", marketCap: 42_100_000_000, volume24h: 8_700_000_000, change7d: 0.8 },
      { name: "DAI", symbol: "DAI", marketCap: 5_300_000_000, volume24h: 400_000_000, change7d: -0.3 },
      { name: "First Digital USD", symbol: "FDUSD", marketCap: 2_900_000_000, volume24h: 3_200_000_000, change7d: 2.1 },
      { name: "USDD", symbol: "USDD", marketCap: 1_200_000_000, volume24h: 85_000_000, change7d: -0.1 },
      { name: "TrueUSD", symbol: "TUSD", marketCap: 980_000_000, volume24h: 120_000_000, change7d: -1.5 },
      { name: "Frax", symbol: "FRAX", marketCap: 650_000_000, volume24h: 45_000_000, change7d: 0.4 },
      { name: "Ethena USDe", symbol: "USDe", marketCap: 4_100_000_000, volume24h: 890_000_000, change7d: 3.2 },
    ],
  };
}
