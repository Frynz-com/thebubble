"use client";

import { usePathname } from "next/navigation";
import { getBubbleSlugFromPathname } from "@/lib/bubble-routing";
import { getBubbleBranding } from "@/lib/partner-config";
import { BrandMark } from "./brand-mark";
import { ProfileSheet } from "./profile-sheet";

export function AppHeader() {
  const pathname = usePathname();
  const branding = getBubbleBranding(getBubbleSlugFromPathname(pathname));

  return (
    <header className="fixed left-0 top-0 z-40 w-full bg-surface/80 backdrop-blur-xl">
      <div className="phone-shell flex h-16 items-center justify-between px-4">
        <BrandMark partnerName={branding.partnerName} subtitle={branding.eventName} />
        <ProfileSheet />
      </div>
    </header>
  );
}
