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
      <div className="phone-shell relative flex h-20 items-center justify-center px-4">
        <div className="flex min-w-0 max-w-[calc(100%-3.75rem)] justify-center">
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
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <ProfileSheet />
        </div>
      </div>
    </header>
  );
}
