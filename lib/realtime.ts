"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./supabase/browser";

type BubbleRealtimeOptions = {
  bubbleId: string;
  channelName: string;
  pollId?: string;
  fanBattleId?: string;
  onChange: () => void;
};

export function subscribeToBubbleRealtime({ bubbleId, channelName, pollId, fanBattleId, onChange }: BubbleRealtimeOptions): RealtimeChannel | null {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !bubbleId) return null;

  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "visitors", filter: `bubble_id=eq.${bubbleId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "posts", filter: `bubble_id=eq.${bubbleId}` }, onChange);

  if (pollId) {
    channel.on("postgres_changes", { event: "*", schema: "public", table: "poll_votes", filter: `poll_id=eq.${pollId}` }, onChange);
  }

  if (fanBattleId) {
    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "fan_battles", filter: `bubble_id=eq.${bubbleId}` }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "fan_battle_entries", filter: `fan_battle_id=eq.${fanBattleId}` }, onChange);
  }

  channel.subscribe();
  return channel;
}

export function removeBubbleRealtime(channel: RealtimeChannel | null) {
  const supabase = getSupabaseBrowserClient();
  if (supabase && channel) void supabase.removeChannel(channel);
}
