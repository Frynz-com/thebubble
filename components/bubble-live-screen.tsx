import Link from "next/link";
import { Gift, MessageCircle } from "lucide-react";
import { BenefitCard } from "@/components/cards";
import { FanBattle } from "@/components/fan-battle";
import { LiveChip } from "@/components/live-chip";
import { LiveVisitorCount } from "@/components/live-visitor-count";
import { LiveVote } from "@/components/live-vote";
import { MobilePage } from "@/components/mobile-page";
import { bubblePath } from "@/lib/bubble-routing";
import { partnerConfig } from "@/lib/partner-config";

export function BubbleLiveScreen({ bubbleSlug }: { bubbleSlug: string }) {
  return (
    <MobilePage title={partnerConfig.eventName} subtitle={`${partnerConfig.homeTeam} gegen ${partnerConfig.awayTeam}`}>
      <div className="mb-5 rounded-[1.5rem] bg-white p-4 shadow-ambient">
        <div className="flex items-center justify-between gap-3">
          <LiveChip />
          <LiveVisitorCount />
        </div>
      </div>

      <div className="space-y-5">
        <FanBattle />
        <LiveVote />

        <Link href={bubblePath(bubbleSlug, "/community")} className="flex items-center gap-3 rounded-[1.5rem] bg-surface-container-low p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary shadow-ambient">
            <MessageCircle size={21} />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">Community</p>
            <p className="text-sm text-on-surface-variant">Schreib kurz etwas in die Bubble.</p>
          </div>
        </Link>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Gift size={19} className="text-primary" />
            <h2 className="text-lg font-bold text-on-surface">Aktuelle Vorteile</h2>
          </div>
          <div className="space-y-4">
            {partnerConfig.benefits.slice(0, 2).map((benefit) => (
              <BenefitCard key={benefit.id} benefit={benefit} compact bubbleSlug={bubbleSlug} />
            ))}
          </div>
        </section>
      </div>
    </MobilePage>
  );
}
