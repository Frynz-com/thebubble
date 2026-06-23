"use client";

import { BenefitsList } from "@/components/benefits-list";
import { MobilePage } from "@/components/mobile-page";
import { useBubbleConfig } from "@/lib/bubble-config";
import { getCurrentBubbleSlug } from "@/lib/bubble-routing";

export default function BenefitsPage() {
  const bubbleSlug = getCurrentBubbleSlug();
  const config = useBubbleConfig(bubbleSlug);

  return (
    <MobilePage title="Vorteile" subtitle={config.rewardDescription || "Aktuelle Vorteile für diese Bubble."}>
      <BenefitsList />
    </MobilePage>
  );
}
