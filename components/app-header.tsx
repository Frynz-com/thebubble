"use client";

import { usePathname } from "next/navigation";
import { getBubbleSlugFromPathname } from "@/lib/bubble-routing";
import { useBubbleConfig } from "@/lib/bubble-config";
import { BrandMark } from "./brand-mark";
import { ProfileSheet } from "./profile-sheet";

export function AppHeader() {
  const pathname = usePathname();
  const bubbleSlug = getBubbleSlugFromPathname(pathname);
  const config = useBubbleConfig(bubbleSlug);

  return (
    <header className="fixed left-0 top-0 z-40 w-full bg-surface/80 backdrop-blur-xl">
      <div className="phone-shell flex h-16 items-center justify-between px-4">
        <BrandMark
          partnerName={config.partnerName}
          subtitle={config.type}
          logoUrl={config.logoUrl}
          logoShape={config.logoShape}
          logoFit={config.logoFit}
          logoBackground={config.logoBackground}
          logoSize={config.logoSize}
          logoCropX={config.logoCropX}
          logoCropY={config.logoCropY}
          logoZoom={config.logoZoom}
        />
        <ProfileSheet />
      </div>
    </header>
  );
}
