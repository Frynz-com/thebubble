"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchActiveFanBattle,
  getCurrentContext,
  submitFanBattleEntry,
} from "@/lib/bubble-service";
import { useBubbleConfig } from "@/lib/bubble-config";
import { getCurrentBubbleSlug } from "@/lib/bubble-routing";
import { removeBubbleRealtime, subscribeToBubbleRealtime } from "@/lib/realtime";
import type { FanBattleRow, VisitorRow } from "@/lib/supabase/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Team = "home" | "away";
type Phase = "choose" | "tap" | "result";

export function FanBattle() {
  const bubbleSlug = getCurrentBubbleSlug();
  const config = useBubbleConfig(bubbleSlug);
  const [phase, setPhase] = useState<Phase>("choose");
  const [team, setTeam] = useState<Team | null>(null);
  const [count, setCount] = useState(0);
  const [seconds, setSeconds] = useState(10);
  const [pressed, setPressed] = useState(false);
  const [battle, setBattle] = useState<FanBattleRow | null>(null);
  const [visitor, setVisitor] = useState<VisitorRow | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  const result = useMemo(() => {
    const baseHome = battle?.home_taps ?? 124;
    const baseAway = battle?.away_taps ?? 96;
    const home = phase === "result" && !submitted && team === "home" ? baseHome + count : baseHome;
    const away = phase === "result" && !submitted && team === "away" ? baseAway + count : baseAway;
    const total = home + away;
    return {
      home,
      away,
      homePercent: Math.round((home / total) * 100),
      awayPercent: Math.round((away / total) * 100),
      leader: home >= away ? (battle?.home_team ?? "Option A") : (battle?.away_team ?? "Option B"),
    };
  }, [battle?.away_taps, battle?.away_team, battle?.home_taps, battle?.home_team, count, phase, submitted, team]);

  useEffect(() => {
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
        const activeBattle = await fetchActiveFanBattle(context.bubble.id);
        if (!mounted) return;
        if (!activeBattle) {
          setMessage("Diese Live-Aktion ist nicht aktiv.");
          return;
        }
        setBattle(activeBattle);
        if (!channel) {
          channel = subscribeToBubbleRealtime({
            bubbleId: context.bubble.id,
            fanBattleId: activeBattle.id,
            channelName: `bubble-fan-battle-${context.bubble.id}-${activeBattle.id}`,
            onChange: () => void load(),
          });
        }
      } catch {
        if (mounted) setMessage("Live-Aktion konnte nicht geladen werden.");
      }
    }

    load();

    return () => {
      mounted = false;
      removeBubbleRealtime(channel);
    };
  }, [bubbleSlug]);

  useEffect(() => {
    if (phase !== "tap") return;
    if (seconds <= 0) {
      setPhase("result");
      return;
    }

    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, seconds]);

  useEffect(() => {
    if (phase !== "result" || submitted || !team || count <= 0) return;
    setSubmitted(true);
    const selectedTeam = team;

    async function saveEntry() {
      if (!battle || !visitor) return;
      try {
        const nextBattle = await submitFanBattleEntry(battle.id, visitor.id, selectedTeam, count);
        if (nextBattle) setBattle(nextBattle);
      } catch {
        setMessage("Diese Fan-Battle-Runde wurde schon gespeichert.");
      }
    }

    void saveEntry();
  }, [battle, count, phase, submitted, team, visitor]);

  function selectTeam(nextTeam: Team) {
    setTeam(nextTeam);
    setCount(0);
    setSeconds(10);
    setSubmitted(false);
    setPhase("tap");
  }

  function registerTap() {
    if (phase !== "tap") return;
    setCount((value) => value + 1);
    setPressed(true);
    window.setTimeout(() => setPressed(false), 90);
    window.navigator.vibrate?.(12);
  }

  function reset() {
    setTeam(null);
    setCount(0);
    setSeconds(10);
    setSubmitted(false);
    setPhase("choose");
  }

  return (
    <section className="overflow-hidden rounded-[2rem] bg-white shadow-ambient animate-pop-in">
      <div className="p-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-secondary">Hauptaktion</p>
        <h2 className="text-2xl font-bold leading-8 text-on-surface">{config.challengeTitle}</h2>
        <p className="mt-2 text-base leading-6 text-on-surface-variant">{config.challengeDescription}</p>
        {message ? <p className="mt-3 rounded-[1rem] bg-surface-container-low p-3 text-sm font-semibold text-on-surface-variant">{message}</p> : null}
      </div>

      {phase === "choose" ? (
        <div className="grid gap-3 px-5 pb-5">
          <button className="min-h-14 rounded-full bg-primary text-sm font-bold text-on-primary shadow-active transition active:scale-95" type="button" onClick={() => selectTeam("home")}>
            {battle?.home_team ?? "Option A"}
          </button>
          <button className="min-h-14 rounded-full border-2 border-outline-variant text-sm font-bold text-primary transition active:scale-95" type="button" onClick={() => selectTeam("away")}>
            {battle?.away_team ?? "Option B"}
          </button>
        </div>
      ) : null}

      {phase === "tap" ? (
        <div className="px-5 pb-5">
          <button
            className={[
              "flex h-64 w-full flex-col items-center justify-center rounded-[2rem] bg-primary-container text-on-primary-container shadow-cta transition",
              pressed ? "scale-[0.98] bg-primary" : "",
            ].join(" ")}
            type="button"
            onClick={registerTap}
          >
            <span className="text-6xl font-extrabold leading-none">{count}</span>
            <span className="mt-3 text-sm font-bold uppercase tracking-[0.14em]">Tippen</span>
            <span className="mt-6 rounded-full bg-white/20 px-4 py-2 text-sm font-bold">{seconds}s</span>
          </button>
        </div>
      ) : null}

      {phase === "result" ? (
        <div className="space-y-5 px-5 pb-5">
          <div className="rounded-[1.5rem] bg-surface-container-low p-4 text-center">
            <p className="text-3xl font-extrabold text-on-surface">Du hast {count}-mal getippt</p>
            <p className="mt-2 text-sm font-semibold text-on-surface-variant">{result.leader} führt gerade.</p>
          </div>

          <div className="space-y-3">
            <BattleBar label={battle?.home_team ?? "Option A"} value={result.home} percent={result.homePercent} />
            <BattleBar label={battle?.away_team ?? "Option B"} value={result.away} percent={result.awayPercent} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-outline-variant text-sm font-bold text-primary" type="button" onClick={reset}>
              <RotateCcw size={17} />
              Nochmal
            </button>
            <button className="min-h-12 rounded-full bg-primary text-sm font-bold text-on-primary" type="button" onClick={reset}>
              Zurück zu Live
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function BattleBar({ label, value, percent }: { label: string; value: number; percent: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-bold text-on-surface">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
