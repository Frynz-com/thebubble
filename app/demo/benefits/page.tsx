"use client";

import { BenefitsList } from "@/components/benefits-list";
import { MobilePage } from "@/components/mobile-page";
import { useBubbleConfig } from "@/lib/bubble-config";
import { getCurrentBubbleSlug } from "@/lib/bubble-routing";

export default function BenefitsPage() {
  const bubbleSlug = getCurrentBubbleSlug();
  const config = useBubbleConfig(bubbleSlug);
  const isHuberArena = bubbleSlug === "huber-arena";

  return (
    <MobilePage
      title={isHuberArena ? "Das kannst du gewinnen" : "Vorteile"}
      subtitle={isHuberArena ? "Tippe das Spiel richtig und sichere dir die Chance auf diese Gewinne." : config.rewardDescription || "Aktuelle Vorteile für diese Bubble."}
    >
      <BenefitsList />
    </MobilePage>
  );
}
