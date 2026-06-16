"use client";

import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchActivePoll,
  fetchPollVotes,
  getCurrentContext,
  submitPollVote,
} from "@/lib/bubble-service";
import { partnerConfig } from "@/lib/partner-config";
import { removeBubbleRealtime, subscribeToBubbleRealtime } from "@/lib/realtime";
import type { PollRow, PollVoteRow, VisitorRow } from "@/lib/supabase/types";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getVoteKey } from "@/lib/storage";

const options = [
  { id: "home", label: partnerConfig.homeTeam, percent: 48 },
  { id: "draw", label: "Unentschieden", percent: 18 },
  { id: "away", label: partnerConfig.awayTeam, percent: 34 },
];

export function LiveVote() {
  const [selected, setSelected] = useState("");
  const [poll, setPoll] = useState<PollRow | null>(null);
  const [visitor, setVisitor] = useState<VisitorRow | null>(null);
  const [votes, setVotes] = useState<PollVoteRow[]>([]);
  const [message, setMessage] = useState("");

  const activeOptions = poll?.options?.length ? poll.options : options.map(({ id, label }) => ({ key: id, label }));
  const percentages = useMemo(() => {
    const total = Math.max(1, votes.length);
    return Object.fromEntries(activeOptions.map((option) => [option.key, Math.round((votes.filter((vote) => vote.option_key === option.key).length / total) * 100)]));
  }, [activeOptions, votes]);

  useEffect(() => {
    const voteKey = getVoteKey();
    setSelected(window.localStorage.getItem(voteKey) ?? "");
    let mounted = true;
    let channel: RealtimeChannel | null = null;

    async function load() {
      try {
        const context = await getCurrentContext();
        if (!mounted || !context.bubble) {
          if (context.message) setMessage(context.message);
          return;
        }
        if (context.message) setMessage(context.message);
        setVisitor(context.visitor ?? null);
        const activePoll = await fetchActivePoll(context.bubble.id);
        if (!mounted || !activePoll) return;
        setPoll(activePoll);
        if (!channel) {
          channel = subscribeToBubbleRealtime({
            bubbleId: context.bubble.id,
            pollId: activePoll.id,
            channelName: `bubble-poll-${context.bubble.id}-${activePoll.id}`,
            onChange: () => void load(),
          });
        }
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
  }, []);

  async function choose(id: string) {
    if (poll && visitor) {
      try {
        await submitPollVote(poll.id, visitor.id, id);
      } catch {
        setMessage("Stimme wurde bereits abgegeben.");
      }
    }
    setSelected(id);
    window.localStorage.setItem(getVoteKey(), id);
  }

  return (
    <section className="rounded-[1.5rem] bg-white p-5 shadow-ambient">
      <h2 className="text-xl font-bold text-on-surface">Wer gewinnt heute?</h2>
      {message ? <p className="mt-2 rounded-[1rem] bg-surface-container-low p-3 text-sm font-semibold text-on-surface-variant">{message}</p> : null}
      <div className="mt-4 space-y-3">
        {activeOptions.map((option) => {
          const active = selected === option.key;
          const fallbackPercent = options.find((item) => item.id === option.key)?.percent ?? 0;
          const percent = votes.length > 0 ? (percentages[option.key] ?? 0) : fallbackPercent;
          return (
            <button
              key={option.key}
              className={[
                "w-full rounded-[1.25rem] border-2 p-3 text-left transition active:scale-[0.99]",
                active ? "border-primary bg-surface-container-low" : "border-outline-variant/35 bg-white",
              ].join(" ")}
              type="button"
              onClick={() => choose(option.key)}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-on-surface">{option.label}</span>
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
    </section>
  );
}
