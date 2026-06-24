"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";
import { PresenceHeartbeat } from "./presence-heartbeat";
import { bubbleThemeStyle, useBubbleConfig } from "@/lib/bubble-config";
import { getBubbleSlugFromPathname } from "@/lib/bubble-routing";
import { trackBubbleEvent } from "@/lib/analytics";

type MobilePageProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function MobilePage({ title, subtitle, children }: MobilePageProps) {
  const pathname = usePathname();
  const bubbleSlug = getBubbleSlugFromPathname(pathname);
  const config = useBubbleConfig(bubbleSlug);

  useEffect(() => {
    void trackBubbleEvent("page_view", { page: pathname }, bubbleSlug);
  }, [bubbleSlug, pathname]);

  return (
    <div className="min-h-svh bg-surface" style={bubbleThemeStyle(config)}>
      <PresenceHeartbeat />
      <AppHeader />
      <main className="phone-shell safe-bottom px-4 pt-24">
        <div className="mb-5 animate-pop-in">
          <h1 className="text-[24px] font-bold leading-[30px] tracking-normal text-on-surface">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm font-semibold leading-5 text-on-surface-variant">{subtitle}</p> : null}
        </div>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
