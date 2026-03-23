"use client";

import useSWR from "swr";
import { useState, useCallback, useEffect } from "react";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return { tone_of_voice: "", icp: "" };
  const data = await res.json();
  return data && typeof data === "object" && !Array.isArray(data)
    ? data
    : { tone_of_voice: "", icp: "" };
};

interface AiSettings {
  tone_of_voice: string;
  icp: string;
}

export function useGlobalAiSettings(channel: string) {
  const { data, error, isLoading, mutate } = useSWR<AiSettings>(
    `/api/settings?channel=${channel}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const [settings, setSettings] = useState<AiSettings>({
    tone_of_voice: "",
    icp: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const updateSettings = useCallback(
    async (toneOfVoice: string, icp: string) => {
      setSettings({ tone_of_voice: toneOfVoice, icp });
      setIsSaving(true);
      try {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel,
            tone_of_voice: toneOfVoice,
            icp,
          }),
        });
        if (!res.ok) throw new Error("Failed to save settings");
        mutate();
      } finally {
        setIsSaving(false);
      }
    },
    [channel, mutate]
  );

  return {
    settings,
    updateSettings,
    error,
    isLoading,
    isSaving,
  };
}
