"use client";

import { useEffect } from "react";
import { getCurrentContext, touchVisitor } from "@/lib/bubble-service";

export function PresenceHeartbeat() {
  useEffect(() => {
    let active = true;
    let visitorId = "";

    async function refresh() {
      try {
        const context = await getCurrentContext();
        if (!active) return;
        visitorId = context.visitor?.id ?? "";
        if (visitorId) await touchVisitor(visitorId);
      } catch {
        // Presence must never block the MVP flow.
      }
    }

    void refresh();
    const interval = window.setInterval(() => {
      if (visitorId) void touchVisitor(visitorId);
      else void refresh();
    }, 45_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
