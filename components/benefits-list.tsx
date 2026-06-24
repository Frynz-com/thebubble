"use client";

import { X } from "lucide-react";
import { Gift } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { Benefit } from "@/lib/partner-config";
import { getBubbleSlugFromPathname } from "@/lib/bubble-routing";
import { useBubbleConfig } from "@/lib/bubble-config";
import { trackBubbleEvent } from "@/lib/analytics";
import { BenefitCard } from "./cards";

const huberSecondaryPrizes = [
  "1x 20 % adidas Rabattgutschein",
  "1x 15 % JD Sports Rabattcode",
  "1x 15 % ABOUT YOU Rabattgutschein",
];

export function BenefitsList() {
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const bubbleSlug = getBubbleSlugFromPathname(usePathname());
  const config = useBubbleConfig(bubbleSlug);
  const benefits: Benefit[] = useMemo(
    () =>
      config.features.rewards
        ? config.rewards.map((reward) => ({
            id: reward.id,
            title: reward.title,
            description: reward.description || "Mach mit und sichere dir Vorteile vor Ort.",
            meta: reward.hint || reward.code || config.type,
            action: reward.buttonText || "Einlösen",
            tag: "Vorteil",
            code: reward.code,
            hint: reward.hint,
            icon: Gift,
          }))
        : [],
    [config.features.rewards, config.rewards, config.type],
  );

  useEffect(() => {
    if (benefits.length > 0) void trackBubbleEvent("reward_view", { rewards: benefits.map((benefit) => benefit.title) }, bubbleSlug);
  }, [benefits, bubbleSlug]);

  if (bubbleSlug === "huber-arena") {
    return (
      <section className="rounded-[1.4rem] bg-white p-5 shadow-ambient">
        <div className="rounded-[1.2rem] bg-on-surface p-5 text-white">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/12 text-white">
              <Gift size={20} />
            </div>
            <div>
              <p className="text-3xl font-black leading-none">10x 15 €</p>
              <h2 className="mt-2 text-lg font-black leading-6">Verzehrkarte</h2>
              <p className="mt-1 text-sm font-semibold text-white/75">für die Huber Arena</p>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {huberSecondaryPrizes.map((prize) => (
            <div key={prize} className="flex items-center gap-3 rounded-[1rem] bg-surface px-3 py-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
              <p className="text-sm font-black leading-5 text-on-surface">{prize}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 rounded-[1rem] bg-surface-container-low p-3 text-sm font-semibold leading-5 text-on-surface-variant">Gewinner werden nach dem Spiel über die angegebene Telefonnummer oder E-Mail benachrichtigt.</p>
      </section>
    );
  }

  if (!config.features.rewards) {
    return <p className="rounded-[1.5rem] bg-white p-5 text-sm font-semibold text-on-surface-variant shadow-ambient">Vorteile sind für diese Bubble nicht aktiv.</p>;
  }

  if (benefits.length === 0) {
    return <p className="rounded-[1.5rem] bg-white p-5 text-sm font-semibold text-on-surface-variant shadow-ambient">Für diese Bubble ist aktuell kein Vorteil hinterlegt.</p>;
  }

  return (
    <>
      <div className="space-y-5">
        {benefits.map((benefit) => (
          <BenefitCard
            key={benefit.id}
            benefit={benefit}
            onRedeem={(selected) => {
              setSelectedBenefit(selected);
              void trackBubbleEvent("reward_claim", { reward: selected.title, code: selected.code ?? config.rewardCode }, bubbleSlug);
            }}
            bubbleSlug={bubbleSlug}
          />
        ))}
      </div>

      {selectedBenefit ? (
        <div className="fixed inset-0 z-[75] flex items-end bg-on-surface/30 px-3 pb-3 backdrop-blur-sm" role="dialog" aria-modal="true">
          <button className="absolute inset-0 h-full w-full cursor-default" type="button" aria-label="Einlösen schließen" onClick={() => setSelectedBenefit(null)} />
          <section className="phone-shell relative w-full rounded-[2rem] bg-white p-5 shadow-active animate-pop-in">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">Vorteil einlösen</p>
                <h2 className="text-2xl font-bold leading-8 text-on-surface">{selectedBenefit.title}</h2>
              </div>
              <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface" type="button" aria-label="Schließen" onClick={() => setSelectedBenefit(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="rounded-[1.5rem] bg-surface-container-low p-5 text-center">
              <p className="text-sm font-semibold text-on-surface-variant">Zeige diesen Bildschirm dem Personal</p>
              <p className="mt-4 text-4xl font-extrabold tracking-[0.08em] text-primary">{selectedBenefit.code || config.rewardCode}</p>
            </div>
            <button className="mt-5 min-h-14 w-full rounded-full bg-primary text-sm font-bold text-on-primary shadow-active" type="button" onClick={() => setSelectedBenefit(null)}>
              Schließen
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}
