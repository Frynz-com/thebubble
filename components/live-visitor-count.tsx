"use client";

import { UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchActiveVisitorCount, getCurrentContext } from "@/lib/bubble-service";
import { removeBubbleRealtime, subscribeToBubbleRealtime } from "@/lib/realtime";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function LiveVisitorCount({ inverted = false }: { inverted?: boolean }) {
  const [count, setCount] = useState<number | null>(null);
  const displayCount = count ?? 0;
  const label = displayCount === 1 ? "Person" : "Personen";

  useEffect(() => {
    let mounted = true;
    let channel: RealtimeChannel | null = null;

    async function load() {
      try {
        const context = await getCurrentContext();
        if (!mounted || !context.bubble) return;
        const nextCount = await fetchActiveVisitorCount(context.bubble.id);
        if (!mounted) return;
        setCount(nextCount);
        if (!channel) {
          channel = subscribeToBubbleRealtime({
            bubbleId: context.bubble.id,
            channelName: `bubble-live-count-${context.bubble.id}`,
            onChange: () => void load(),
          });
        }
      } catch {
        if (mounted) setCount(null);
      }
    }

    void load();
    const interval = window.setInterval(() => void load(), 60_000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      removeBubbleRealtime(channel);
    };
  }, []);

  return (
    <div className={["flex items-center gap-2 text-sm font-bold", inverted ? "text-white" : "text-on-surface"].join(" ")}>
      <UsersRound size={18} className={inverted ? "text-white" : "text-primary"} />
      {displayCount} {label}
    </div>
  );
}
