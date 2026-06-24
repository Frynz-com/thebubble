"use client";

import { UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchActiveVisitorCount, getActiveBubble } from "@/lib/bubble-service";
import { getCurrentBubbleSlug } from "@/lib/bubble-routing";

export function LiveVisitorCount({ inverted = false }: { inverted?: boolean }) {
  const [count, setCount] = useState<number | null>(null);
  const displayCount = count ?? 0;
  const label = displayCount === 1 ? "Person" : "Personen";

  useEffect(() => {
    let mounted = true;
    const bubbleSlug = getCurrentBubbleSlug();

    async function load() {
      try {
        const bubble = await getActiveBubble(bubbleSlug);
        if (!mounted || !bubble) return;
        const nextCount = await fetchActiveVisitorCount(bubble.id);
        if (!mounted) return;
        setCount(nextCount);
      } catch {
        if (mounted) setCount(null);
      }
    }

    void load();
    const interval = window.setInterval(() => void load(), 30_000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className={["flex items-center gap-2 text-sm font-bold", inverted ? "text-white" : "text-on-surface"].join(" ")}>
      <UsersRound size={18} className={inverted ? "text-white" : "text-primary"} />
      {displayCount} {label}
    </div>
  );
}
