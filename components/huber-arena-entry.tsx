"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ensureBubbleVisitor } from "@/lib/bubble-service";
import { bubblePath, normalizeBubbleSlug } from "@/lib/bubble-routing";
import { bubbleThemeStyle, heroMediaStyle, useBubbleConfig } from "@/lib/bubble-config";
import { trackBubbleEvent } from "@/lib/analytics";
import { getPublicViewingPilotConfig } from "@/lib/public-viewing-pilot";

export function HuberArenaEntry({ bubbleSlug }: { bubbleSlug: string }) {
  const normalizedSlug = normalizeBubbleSlug(bubbleSlug);
  const config = useBubbleConfig(normalizedSlug);
  const pilotConfig = getPublicViewingPilotConfig(normalizedSlug);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [heroFailed, setHeroFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [matchLogoFailed, setMatchLogoFailed] = useState(false);
  const isQuickborn = normalizedSlug === "public-viewing-quickborn";

  async function enterBubble() {
    setBusy(true);
    setMessage("");
    try {
      await ensureBubbleVisitor(normalizedSlug);
      void trackBubbleEvent("enter_bubble", { source: pilotConfig.source }, normalizedSlug);
      router.push(bubblePath(normalizedSlug, "/live"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bubble konnte nicht betreten werden.");
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-on-surface" style={bubbleThemeStyle(config)}>
      {config.heroImageUrl && !heroFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={config.heroImageUrl}
          alt={pilotConfig.entryAlt}
          className="absolute inset-0 h-full w-full object-cover object-top"
          width={941}
          height={1672}
          decoding="async"
          fetchPriority="high"
          onError={() => setHeroFailed(true)}
          style={heroMediaStyle({ ...config, heroPositionY: "top" })}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 30% 18%, ${config.accentColor} 0%, transparent 24%), linear-gradient(145deg, ${config.primaryColor} 0%, #10131c 55%, #05070d 100%)`,
          }}
        />
      )}
      <div className="absolute inset-0" style={{ background: isQuickborn ? "linear-gradient(to top, rgba(4,6,12,.82) 0%, rgba(4,6,12,.45) 42%, rgba(4,6,12,.08) 100%)" : "linear-gradient(to top, rgba(7,11,20,.54) 0%, rgba(7,11,20,.18) 46%, rgba(7,11,20,.08) 100%)" }} />

      <div className="phone-shell relative z-10 flex min-h-svh flex-col px-5 pb-[calc(2.25rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))]">
        {isQuickborn ? (
          <section className="animate-pop-in">
            <div className="flex items-start justify-between gap-3">
              {pilotConfig.logoUrl && !logoFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pilotConfig.logoUrl}
                  alt="Public Viewing Quickborn"
                  className="max-h-28 w-auto max-w-[46vw] rounded-[1.1rem] bg-white/94 px-3 py-2 shadow-[0_18px_48px_rgba(0,0,0,.24)]"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <div className="rounded-[1.1rem] bg-white/94 px-4 py-3 text-left shadow-[0_18px_48px_rgba(0,0,0,.24)]">
                  <p className="text-sm font-black leading-4 text-on-surface">Public Viewing</p>
                  <p className="text-lg font-black leading-5 text-primary">Quickborn</p>
                </div>
              )}
              {pilotConfig.matchEventLogoUrl && !matchLogoFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pilotConfig.matchEventLogoUrl}
                  alt="Match Events"
                  className="max-h-12 w-auto max-w-[38vw] rounded-[.9rem] bg-white/94 px-3 py-2 shadow-[0_14px_34px_rgba(0,0,0,.2)]"
                  onError={() => setMatchLogoFailed(true)}
                />
              ) : null}
            </div>
          </section>
        ) : null}
        <section className="mt-auto animate-pop-in text-center">
          {isQuickborn ? (
            <div className="mb-5 text-left text-white">
              <h1 className="text-[34px] font-black leading-[38px] tracking-normal drop-shadow-[0_8px_24px_rgba(0,0,0,.36)]">Deutschland vs. Paraguay</h1>
              <p className="mt-2 text-lg font-black text-white/90">Public Viewing Quickborn</p>
              <p className="mt-3 max-w-sm text-sm font-semibold leading-5 text-white/78">{pilotConfig.mainText}</p>
            </div>
          ) : null}
          <button
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-base font-black text-primary shadow-[0_18px_44px_rgba(0,0,0,.28)] ring-1 ring-white/55 transition active:scale-[0.98] disabled:opacity-70"
            type="button"
            disabled={busy}
            onClick={() => void enterBubble()}
          >
            {busy ? <Loader2 className="animate-spin" size={20} /> : null}
            {isQuickborn ? "Jetzt Bubble beitreten" : "Jetzt Bubble betreten"}
            {!busy ? <ArrowRight size={20} /> : null}
          </button>
          {isQuickborn ? <p className="mt-3 px-2 text-xs font-semibold leading-5 text-white/78">Mit dem Beitritt akzeptierst du die Teilnahmebedingungen und die Datenschutzhinweise.</p> : null}
          {message ? <p className="mt-3 rounded-[1rem] bg-white/90 px-3 py-2 text-sm font-bold text-on-surface">{message}</p> : null}
        </section>
      </div>
    </main>
  );
}
