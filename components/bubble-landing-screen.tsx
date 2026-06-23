"use client";

import { ArrowRight, Bolt } from "lucide-react";
import { useEffect } from "react";
import { BrandMark } from "@/components/brand-mark";
import { BubbleSessionBootstrap } from "@/components/bubble-session-bootstrap";
import { LiveChip } from "@/components/live-chip";
import { PrimaryButton } from "@/components/primary-button";
import { bubblePath, normalizeBubbleSlug } from "@/lib/bubble-routing";
import { bubbleThemeStyle, heroHeightClass, heroMediaStyle, heroOverlayBackground, useBubbleConfig } from "@/lib/bubble-config";
import { trackBubbleEvent } from "@/lib/analytics";

export function BubbleLandingScreen({ bubbleSlug }: { bubbleSlug: string }) {
  const normalizedSlug = normalizeBubbleSlug(bubbleSlug);
  const config = useBubbleConfig(normalizedSlug);
  const headline = config.headline === "Willkommen in deiner Bubble" ? `Willkommen bei ${config.partnerName}` : config.headline;

  useEffect(() => {
    void trackBubbleEvent("page_view", { page: `/${normalizedSlug}` }, normalizedSlug);
  }, [normalizedSlug]);

  return (
    <main className={["landing-screen relative w-full overflow-hidden bg-on-surface", heroHeightClass(config)].join(" ")} style={bubbleThemeStyle(config)}>
      <BubbleSessionBootstrap bubbleSlug={normalizedSlug} />
      {config.heroImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={config.heroImageUrl} alt="" className="absolute inset-0 h-full w-full will-change-transform" style={heroMediaStyle(config)} />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,var(--bubble-primary)_0%,#172033_42%,#070b14_100%)]" />
      )}
      <div className="absolute inset-0 z-10" style={{ background: heroOverlayBackground(config) }} />

      <div className="phone-shell relative z-20 flex min-h-[inherit] flex-col px-5 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
        <header className="flex items-start justify-between">
          <BrandMark
            inverted
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
          <LiveChip dark />
        </header>

        <section className="mt-auto animate-pop-in">
          <h1 className="mb-5 text-[28px] font-bold leading-[34px] tracking-normal text-white drop-shadow-xl">
            {headline}
          </h1>
          <p className="mb-7 max-w-xs text-base font-semibold leading-6 text-white/75">{config.subheadline || "Scannen, beitreten, live dabei sein."}</p>

          <div className="space-y-5 text-center">
            <PrimaryButton href={bubblePath(normalizedSlug, "/join")} icon={<ArrowRight size={20} />}>
              Jetzt Bubble betreten
            </PrimaryButton>
            <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-white/55">
              <Bolt size={18} />
              Ohne E-Mail, ohne Passwort.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
