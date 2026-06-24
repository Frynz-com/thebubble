"use client";

import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchActivePoll,
  fetchPollVotes,
  getCurrentContext,
  submitPollVote,
} from "@/lib/bubble-service";
import { useBubbleConfig } from "@/lib/bubble-config";
import { getCurrentBubbleSlug } from "@/lib/bubble-routing";
import { removeBubbleRealtime, subscribeToBubbleRealtime } from "@/lib/realtime";
import type { PollRow, PollVoteRow, VisitorRow } from "@/lib/supabase/types";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getVoteKey } from "@/lib/storage";
import { trackBubbleEvent } from "@/lib/analytics";

export function LiveVote() {
  const bubbleSlug = getCurrentBubbleSlug();
  const config = useBubbleConfig(bubbleSlug);
  const [selected, setSelected] = useState("");
  const [poll, setPoll] = useState<PollRow | null>(null);
  const [visitor, setVisitor] = useState<VisitorRow | null>(null);
  const [votes, setVotes] = useState<PollVoteRow[]>([]);
  const [message, setMessage] = useState("");

  const activeOptions = config.pollOptions.map((label, index) => ({ key: `option-${index}`, label }));
  const percentages = useMemo(() => {
    const total = Math.max(1, votes.length);
    return Object.fromEntries(activeOptions.map((option) => [option.key, Math.round((votes.filter((vote) => vote.option_key === option.key).length / total) * 100)]));
  }, [activeOptions, votes]);

  useEffect(() => {
    const voteKey = getVoteKey(bubbleSlug);
    setSelected(window.localStorage.getItem(voteKey) ?? "");
    let mounted = true;
    let channel: RealtimeChannel | null = null;

    async function load() {
      try {
        const context = await getCurrentContext(bubbleSlug);
        if (!mounted || !context.bubble) {
          if (context.message) setMessage(context.message);
          return;
        }
        if (context.message) setMessage(context.message);
        setVisitor(context.visitor ?? null);
        const activePoll = await fetchActivePoll(context.bubble.id);
        if (!mounted) return;
        setPoll(activePoll ?? null);
        if (activePoll && !channel) {
          channel = subscribeToBubbleRealtime({
            bubbleId: context.bubble.id,
            pollId: activePoll.id,
            channelName: `bubble-poll-${context.bubble.id}-${activePoll.id}`,
            onChange: () => void load(),
          });
        }
        if (!activePoll) return;
        const pollVotes = await fetchPollVotes(activePoll.id);
        if (!mounted) return;
        setVotes(pollVotes);
        const ownVote = context.visitor ? pollVotes.find((vote) => vote.visitor_id === context.visitor?.id) : null;
        if (ownVote) setSelected(ownVote.option_key);
      } catch {
        if (mounted) setMessage("Abstimmung konnte nicht geladen werden.");
      }
    }

    load();

    return () => {
      mounted = false;
      removeBubbleRealtime(channel);
    };
  }, [bubbleSlug]);

  async function choose(id: string) {
    if (selected) return;
    let storedOption = id;
    if (poll && visitor) {
      try {
        const vote = await submitPollVote(poll.id, visitor.id, id);
        if (vote && typeof vote === "object" && "option_key" in vote) storedOption = vote.option_key;
      } catch {
        setMessage("Stimme wurde bereits abgegeben.");
      }
    }
    setSelected(storedOption);
    window.localStorage.setItem(getVoteKey(bubbleSlug), storedOption);
    void trackBubbleEvent("poll_vote", { option: storedOption, label: activeOptions.find((option) => option.key === storedOption)?.label ?? storedOption }, bubbleSlug);
  }

  return (
    <section className="rounded-[1.75rem] bg-white p-5 shadow-ambient">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-secondary">{config.actionBadge || "Live-Aktion"}</p>
      <h2 className="text-2xl font-bold leading-8 text-on-surface">{config.pollQuestion || config.voteTitle}</h2>
      {config.pollHint ? <p className="mt-2 text-sm leading-6 text-on-surface-variant">{config.pollHint}</p> : null}
      {message ? <p className="mt-2 rounded-[1rem] bg-surface-container-low p-3 text-sm font-semibold text-on-surface-variant">{message}</p> : null}
      <div className="mt-5 space-y-3">
        {activeOptions.map((option) => {
          const active = selected === option.key;
          const percent = votes.length > 0 ? (percentages[option.key] ?? 0) : 0;
          return (
            <button
              key={option.key}
              className={[
                "w-full rounded-[1.35rem] border-2 p-4 text-left transition active:scale-[0.99]",
                active ? "border-primary bg-primary/5" : "border-outline-variant/35 bg-white",
              ].join(" ")}
              type="button"
              onClick={() => choose(option.key)}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-bold text-on-surface">{option.label}</span>
                {active ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-primary">
                    <Check size={15} />
                    Deine Stimme zählt
                  </span>
                ) : null}
              </div>
              {selected ? (
                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-outline">{percent}%</p>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
      {selected ? (
        <div className="mt-5 rounded-[1.25rem] bg-primary/10 p-4 text-center">
          <p className="text-base font-black text-primary">Du bist dabei!</p>
          <p className="mt-1 text-sm font-semibold text-on-surface-variant">Deine Stimme zählt.</p>
        </div>
      ) : null}
    </section>
  );
}
