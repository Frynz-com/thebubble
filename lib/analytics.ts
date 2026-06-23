"use client";

import { getCurrentContext } from "@/lib/bubble-service";
import { getCurrentBubbleSlug, normalizeBubbleSlug } from "@/lib/bubble-routing";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { AnalyticsEventType, Json } from "@/lib/supabase/types";
import { getOrCreateSessionId } from "@/lib/storage";

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  if (window.innerWidth < 640) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

export async function trackBubbleEvent(eventType: AnalyticsEventType, metadata: Record<string, Json> = {}, slug?: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || typeof window === "undefined") return;

  const activeSlug = normalizeBubbleSlug(slug ?? getCurrentBubbleSlug());

  try {
    const context = await getCurrentContext(activeSlug);
    if (!context.bubble) return;

    await supabase.from("analytics_events").insert({
      bubble_id: context.bubble.id,
      visitor_id: context.visitor?.id ?? null,
      session_id: getOrCreateSessionId(activeSlug),
      event_type: eventType,
      path: window.location.pathname,
      metadata,
      device_type: getDeviceType(),
    });
  } catch (error) {
    console.error("[analytics] event failed", { eventType, slug: activeSlug, error });
  }
}
