"use client";

import { CommunityBoard } from "@/components/community-board";
import { MobilePage } from "@/components/mobile-page";
import { useBubbleConfig } from "@/lib/bubble-config";
import { getCurrentBubbleSlug } from "@/lib/bubble-routing";

export default function CommunityPage() {
  const bubbleSlug = getCurrentBubbleSlug();
  const config = useBubbleConfig(bubbleSlug);

  return (
    <MobilePage title={config.communityTitle} subtitle={config.communitySubtitle}>
      <CommunityBoard />
    </MobilePage>
  );
}
