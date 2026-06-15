import Image from "next/image";
import { ArrowRight, Bolt } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { BubbleSessionBootstrap } from "@/components/bubble-session-bootstrap";
import { LiveChip } from "@/components/live-chip";
import { PrimaryButton } from "@/components/primary-button";
import { bubblePath } from "@/lib/bubble-routing";
import { partnerConfig } from "@/lib/partner-config";

export function BubbleLandingScreen({ bubbleSlug }: { bubbleSlug: string }) {
  return (
    <main className="relative h-svh w-full overflow-hidden bg-on-surface">
      <BubbleSessionBootstrap bubbleSlug={bubbleSlug} />
      <Image src={partnerConfig.images.hero} alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="hero-overlay absolute inset-0 z-10" />
      <div className="pointer-events-none absolute -right-24 top-1/4 z-10 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" />
      <div className="pointer-events-none absolute -left-24 bottom-1/4 z-10 h-80 w-80 rounded-full bg-secondary/10 blur-[100px]" />

      <div className="phone-shell relative z-20 flex h-full flex-col px-5 pb-12 pt-8">
        <header className="flex items-start justify-between">
          <BrandMark inverted partnerName={partnerConfig.partnerName} subtitle={partnerConfig.eventName} />
          <LiveChip dark />
        </header>

        <section className="mt-auto animate-pop-in">
          <h1 className="mb-5 text-[28px] font-bold leading-[34px] tracking-normal text-white drop-shadow-xl">Willkommen in deiner Matchday Bubble</h1>

          <div className="mb-7 inline-flex items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
            <div className="-space-x-2">
              {partnerConfig.images.avatars.map((avatar) => (
                <span key={avatar} className="relative inline-block h-8 w-8 overflow-hidden rounded-full border-2 border-white/40">
                  <Image src={avatar} alt="" fill sizes="32px" className="object-cover" />
                </span>
              ))}
            </div>
            <span className="text-sm font-bold text-white/90">42 Personen sind gerade dabei</span>
          </div>

          <div className="space-y-5 text-center">
            <PrimaryButton href={bubblePath(bubbleSlug, "/join")} icon={<ArrowRight size={20} />}>
              Jetzt Bubble betreten
            </PrimaryButton>
            <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-white/55">
              <Bolt size={18} />
              Kein Download. Dauert 5 Sekunden.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
