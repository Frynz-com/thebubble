"use client";

import { BenefitsList } from "@/components/benefits-list";
import { MobilePage } from "@/components/mobile-page";
import { useBubbleConfig } from "@/lib/bubble-config";
import { getBubbleSlugFromPathname } from "@/lib/bubble-routing";
import { usePathname } from "next/navigation";

export default function BenefitsPage() {
  const bubbleSlug = getBubbleSlugFromPathname(usePathname());
  const config = useBubbleConfig(bubbleSlug);
  const isHuberArena = bubbleSlug === "huber-arena";
  const isQuickborn = bubbleSlug === "public-viewing-quickborn";

  return (
    <MobilePage
      title={isHuberArena || isQuickborn ? "Das kannst du gewinnen" : "Vorteile"}
      subtitle={isHuberArena ? "Tippe das Spiel richtig und sichere dir die Chance auf diese Gewinne." : isQuickborn ? "" : config.rewardDescription || "Aktuelle Vorteile für diese Bubble."}
    >
      <BenefitsList />
    </MobilePage>
  );
}
