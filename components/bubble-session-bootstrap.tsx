"use client";

import { useEffect } from "react";
import { ensureBubbleVisitor } from "@/lib/bubble-service";
import { getCurrentBubbleSlug } from "@/lib/bubble-routing";

export function BubbleSessionBootstrap({ bubbleSlug }: { bubbleSlug?: string }) {
  useEffect(() => {
    let cancelled = false;

    async function bootVisitor() {
      try {
        const slug = bubbleSlug ?? getCurrentBubbleSlug();
        const context = await ensureBubbleVisitor(slug);
        if (!cancelled && context.visitor) {
          console.info("[visitor] ready", {
            slug,
            bubbleId: context.bubble?.id ?? null,
            visitorId: context.visitor.id,
            isAnonymous: context.visitor.is_guest,
          });
        }
      } catch (error) {
        console.error("[visitor] bootstrap failed", error);
      }
    }

    void bootVisitor();

    return () => {
      cancelled = true;
    };
  }, [bubbleSlug]);

  return null;
}
