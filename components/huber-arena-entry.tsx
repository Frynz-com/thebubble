"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ensureBubbleVisitor } from "@/lib/bubble-service";
import { bubblePath, normalizeBubbleSlug } from "@/lib/bubble-routing";
import { bubbleThemeStyle, heroMediaStyle, useBubbleConfig } from "@/lib/bubble-config";
import { trackBubbleEvent } from "@/lib/analytics";
import { getPublicViewingPilotConfig } from "@/lib/public-viewing-pilot";
import { LegalBottomSheet } from "@/components/legal-bottom-sheet";

export function HuberArenaEntry({ bubbleSlug }: { bubbleSlug: string }) {
  const normalizedSlug = normalizeBubbleSlug(bubbleSlug);
  const config = useBubbleConfig(normalizedSlug);
  const pilotConfig = getPublicViewingPilotConfig(normalizedSlug);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [heroFailed, setHeroFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [legalSheet, setLegalSheet] = useState<"privacy" | "terms" | null>(null);
  const isQuickborn = normalizedSlug === "public-viewing-quickborn";

  useEffect(() => {
    if (!isQuickborn) return;
    void trackBubbleEvent("landing_view", { source: pilotConfig.source }, normalizedSlug);
  }, [isQuickborn, normalizedSlug, pilotConfig.source]);

  async function enterBubble() {
    setBusy(true);
    setMessage("");
    try {
      if (isQuickborn) {
        window.localStorage.setItem("quickborn_terms_accepted_at", new Date().toISOString());
        void trackBubbleEvent("landing_cta_click", { source: pilotConfig.source }, normalizedSlug);
      }
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
          <section className="animate-pop-in pt-[calc(.75rem+env(safe-area-inset-top))]">
            <div className="flex justify-center">
              {pilotConfig.logoUrl && !logoFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pilotConfig.logoUrl}
                  alt="Public Viewing Quickborn"
                  className="max-h-[168px] w-auto max-w-[78vw] rounded-[1.25rem] bg-white/96 px-4 py-3 shadow-[0_18px_48px_rgba(0,0,0,.24)]"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <div className="rounded-[1.25rem] bg-white/96 px-5 py-4 text-center shadow-[0_18px_48px_rgba(0,0,0,.24)]">
                  <p className="text-base font-black leading-5 text-on-surface">Public Viewing</p>
                  <p className="text-2xl font-black leading-7 text-primary">Quickborn</p>
                </div>
              )}
            </div>
          </section>
        ) : null}
        <section className="mt-auto animate-pop-in text-center">
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
          {isQuickborn ? (
            <p className="mt-3 px-2 text-xs font-semibold leading-5 text-white drop-shadow-[0_3px_10px_rgba(0,0,0,.55)]">
              Mit dem Beitritt akzeptierst du die{" "}
              <button
                className="underline decoration-white/80 underline-offset-2"
                type="button"
                onClick={() => {
                  setLegalSheet("terms");
                  void trackBubbleEvent("terms_open", { source: "landing" }, normalizedSlug);
                }}
              >
                Teilnahmebedingungen
              </button>{" "}
              und{" "}
              <button
                className="underline decoration-white/80 underline-offset-2"
                type="button"
                onClick={() => {
                  setLegalSheet("privacy");
                  void trackBubbleEvent("privacy_open", { source: "landing" }, normalizedSlug);
                }}
              >
                Datenschutzhinweise
              </button>
              .
            </p>
          ) : null}
          {message ? <p className="mt-3 rounded-[1rem] bg-white/90 px-3 py-2 text-sm font-bold text-on-surface">{message}</p> : null}
        </section>
      </div>
      {isQuickborn && legalSheet ? (
        <LegalBottomSheet
          title={legalSheet === "privacy" ? "Datenschutzhinweise" : "Teilnahmebedingungen"}
          body={legalSheet === "privacy" ? pilotConfig.privacyNoticeText : pilotConfig.termsText}
          onClose={() => setLegalSheet(null)}
        />
      ) : null}
    </main>
  );
}
