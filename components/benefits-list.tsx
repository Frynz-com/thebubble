"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import type { Benefit } from "@/lib/partner-config";
import { partnerConfig } from "@/lib/partner-config";
import { getBubbleSlugFromPathname } from "@/lib/bubble-routing";
import { BenefitCard } from "./cards";

export function BenefitsList() {
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const bubbleSlug = getBubbleSlugFromPathname(usePathname());

  return (
    <>
      <div className="space-y-5">
        {partnerConfig.benefits.map((benefit) => (
          <BenefitCard key={benefit.id} benefit={benefit} onRedeem={setSelectedBenefit} bubbleSlug={bubbleSlug} />
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
              <p className="mt-4 text-4xl font-extrabold tracking-[0.08em] text-primary">BUBBLE-24</p>
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
