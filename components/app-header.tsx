"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { getBubbleSlugFromPathname } from "@/lib/bubble-routing";
import { useBubbleConfig } from "@/lib/bubble-config";
import { getPublicViewingPilotConfig } from "@/lib/public-viewing-pilot";
import { BrandMark } from "./brand-mark";
import { ProfileSheet } from "./profile-sheet";

export function AppHeader() {
  const pathname = usePathname();
  const bubbleSlug = getBubbleSlugFromPathname(pathname);
  const config = useBubbleConfig(bubbleSlug);
  const [matchLogoFailed, setMatchLogoFailed] = useState(false);
  const isQuickborn = bubbleSlug === "public-viewing-quickborn";
  const pilotConfig = getPublicViewingPilotConfig(bubbleSlug);

  if (isQuickborn) {
    return (
      <header className="fixed left-0 top-0 z-40 w-full bg-white/92 shadow-[0_10px_28px_rgba(20,27,43,.08)] backdrop-blur-xl">
        <div className="phone-shell relative flex h-24 items-center justify-center px-4">
          <div className="flex min-w-0 max-w-[calc(100%-3.75rem)] items-center gap-3">
            {pilotConfig.matchEventLogoUrl && !matchLogoFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pilotConfig.matchEventLogoUrl}
                alt="Match Events"
                className="h-auto max-h-9 w-auto max-w-[132px] shrink-0 object-contain"
                onError={() => setMatchLogoFailed(true)}
              />
            ) : (
              <div className="shrink-0 rounded-[.8rem] bg-on-surface px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-white">Match Events</div>
            )}
            <div className="min-w-0 border-l border-outline-variant/45 pl-3">
              <p className="truncate text-sm font-black leading-5 text-on-surface">Public Viewing Quickborn</p>
              <p className="truncate text-xs font-black leading-4 text-primary">Deutschland 🇩🇪 vs Paraguay 🇵🇾</p>
            </div>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <ProfileSheet />
          </div>
        </div>
      </header>
    );
  }

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
