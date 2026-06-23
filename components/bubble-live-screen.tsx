"use client";

import Link from "next/link";
import { LiveChip } from "@/components/live-chip";
import { LiveVisitorCount } from "@/components/live-visitor-count";
import { LiveVote } from "@/components/live-vote";
import { MobilePage } from "@/components/mobile-page";
import { useBubbleConfig } from "@/lib/bubble-config";
import { bubblePath } from "@/lib/bubble-routing";
import { trackBubbleEvent } from "@/lib/analytics";

export function BubbleLiveScreen({ bubbleSlug }: { bubbleSlug: string }) {
  const config = useBubbleConfig(bubbleSlug);
  const showScoreboard = Boolean(config.homeTeamName || config.awayTeamName || config.homeScore !== "0" || config.awayScore !== "0" || config.scoreText !== "Live");

  if (!config.features.live) {
    return (
      <MobilePage title={config.eventTitle} subtitle={config.eventSubtitle}>
        <p className="rounded-[1.5rem] bg-white p-5 text-sm font-semibold text-on-surface-variant shadow-ambient">Live ist für diese Bubble nicht aktiv.</p>
      </MobilePage>
    );
  }

  return (
    <MobilePage title={config.eventTitle} subtitle={config.eventSubtitle}>
      {showScoreboard ? (
        <div className="mb-5 overflow-hidden rounded-[1.5rem] bg-primary p-4 text-on-primary shadow-active">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 text-center">
              <p className="truncate text-xs font-black uppercase tracking-[0.12em] opacity-85">{config.homeTeamName || "Heim"}</p>
              <p className="mt-2 text-4xl font-black leading-none">{config.homeScore}</p>
            </div>
            <div className="text-center">
              <p className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{config.scoreText || "Live"}</p>
              <p className="mt-2 text-sm font-black">-</p>
            </div>
            <div className="min-w-0 text-center">
              <p className="truncate text-xs font-black uppercase tracking-[0.12em] opacity-85">{config.awayTeamName || "Auswärts"}</p>
              <p className="mt-2 text-4xl font-black leading-none">{config.awayScore}</p>
            </div>
          </div>
          {config.features.peopleHere ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-[1.25rem] bg-white/12 px-3 py-2 text-on-primary">
              <LiveChip dark />
              <LiveVisitorCount inverted />
            </div>
          ) : null}
        </div>
      ) : config.features.peopleHere ? (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-[1.5rem] bg-white p-4 shadow-ambient">
          <LiveChip />
          <LiveVisitorCount />
        </div>
      ) : null}

      <div className="space-y-5">
        {config.features.polls ? (
          <LiveVote />
        ) : (
          <section className="rounded-[1.5rem] bg-white p-5 shadow-ambient">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-secondary">{config.actionBadge || "Live-Aktion"}</p>
            <h2 className="text-xl font-bold text-on-surface">{config.challengeTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{config.challengeDescription}</p>
            {config.actionHint ? <p className="mt-3 rounded-[1rem] bg-surface-container-low p-3 text-sm font-bold text-on-surface">{config.actionHint}</p> : null}
            <Link
              href={bubblePath(bubbleSlug, "/challenge/success")}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-bold text-on-primary transition active:scale-95"
              onClick={() => void trackBubbleEvent("module_click", { module: "live_action", source: "live_card" }, bubbleSlug)}
            >
              {config.actionButtonText || "Jetzt mitmachen"}
            </Link>
          </section>
        )}
      </div>
    </MobilePage>
  );
}
