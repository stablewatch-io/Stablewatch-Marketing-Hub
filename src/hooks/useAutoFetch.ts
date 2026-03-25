import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url, { method: "POST" }).then((r) => r.json());

export function useAutoFetch() {
  const { data, error, isLoading } = useSWR("/api/news/auto-fetch", fetcher, {
    dedupingInterval: 5 * 60 * 1000,
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return { data, error, isLoading };
}
