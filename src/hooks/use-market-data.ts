import useSWR from "swr";

export interface Stablecoin {
  name: string;
  symbol: string;
  marketCap: number;
  volume24h: number;
  change7d: number;
}

export interface MarketData {
  totalTvl: number;
  volume24h: number;
  usdtDominance: number;
  activeStablecoins: number;
  tvlChange24h: number;
  volumeChange24h: number;
  tvlHistory: { date: string; tvl: number }[];
  stablecoins: Stablecoin[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useMarketData() {
  const { data, error, isLoading, mutate } = useSWR<MarketData>(
    "/api/market-data",
    fetcher,
    { refreshInterval: 120_000, revalidateOnFocus: false }
  );

  return { data, error, isLoading, mutate };
}
