"use client";

import { getCurrentBubbleSlug, normalizeBubbleSlug } from "@/lib/bubble-routing";
import type { AnalyticsEventType, Json } from "@/lib/supabase/types";
import { getOrCreateSessionId } from "@/lib/storage";

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  if (window.innerWidth < 640) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

export async function trackBubbleEvent(eventType: AnalyticsEventType, metadata: Record<string, Json> = {}, slug?: string) {
  if (typeof window === "undefined") return;

  const activeSlug = normalizeBubbleSlug(slug ?? getCurrentBubbleSlug());

  try {
    const payload = {
      bubbleSlug: activeSlug,
      anonymousSessionId: getOrCreateSessionId(activeSlug),
      eventName: eventType,
      path: window.location.pathname,
      metadata,
      device_type: getDeviceType(),
    };

    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (error) {
    console.error("[analytics] event failed", { eventType, slug: activeSlug, error });
  }
}
