import { partnerConfig } from "./partner-config";
import { defaultBubbleSlug, getCurrentBubbleSlug, normalizeBubbleSlug } from "./bubble-routing";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "./supabase/browser";
import { logSupabaseError } from "./supabase/log-error";
import type { BubbleRow, FanBattleRow, PollRow, PollVoteRow, PostRow, VisitorRow } from "./supabase/types";
import { BubbleProfile, createGuestProfile, getOrCreateSessionId, getStoredVisitorId, setStoredProfile, setStoredVisitorId } from "./storage";

export const demoBubbleSlug = defaultBubbleSlug;

export type BubbleStatus = "offline" | "ready" | "error";

export type BubbleContext = {
  status: BubbleStatus;
  message?: string;
  bubble?: BubbleRow;
  visitor?: VisitorRow | null;
};

export type PostView = {
  id: string;
  author: string;
  avatar: string;
  text: string;
  time: string;
};

export function supabaseIsReady() {
  return isSupabaseConfigured();
}

function resolveBubbleSlug(slug?: string) {
  return normalizeBubbleSlug(slug ?? getCurrentBubbleSlug());
}

export async function getActiveBubble(slug?: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const activeSlug = resolveBubbleSlug(slug);
  const { data, error } = await supabase.from("bubbles").select("*").eq("slug", activeSlug).eq("is_active", true).single();
  if (error) {
    logSupabaseError("getActiveBubble", error);
    throw error;
  }
  return data as BubbleRow;
}

export async function ensureGuestVisitor(slug?: string) {
  const activeSlug = resolveBubbleSlug(slug);
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const profile = createGuestProfile();
    setStoredProfile(profile);
    return { status: "offline", message: "Supabase ist noch nicht konfiguriert. Die App läuft lokal im Demo-Modus.", visitor: null } satisfies BubbleContext;
  }

  const bubble = await getActiveBubble(activeSlug);
  if (!bubble) return { status: "error", message: "Die Demo-Bubble ist nicht aktiv." } satisfies BubbleContext;

  const sessionId = getOrCreateSessionId();
  const guestProfile = createGuestProfile();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("visitors")
    .upsert(
      {
        bubble_id: bubble.id,
        session_id: sessionId,
        nickname: guestProfile.name,
        avatar_url: guestProfile.avatar,
        is_guest: true,
        is_active: true,
        left_at: null,
        last_seen_at: now,
      },
      { onConflict: "bubble_id,session_id" },
    )
    .select("*")
    .single();

  if (error) {
    logSupabaseError("ensureGuestVisitor.upsertVisitor", error);
    throw error;
  }
  const visitor = data as VisitorRow;
  setStoredVisitorId(visitor.id, activeSlug);
  setStoredProfile({
    name: visitor.nickname,
    avatar: visitor.avatar_url ?? partnerConfig.images.user,
    isAnonymous: visitor.is_guest,
  });

  return { status: "ready", bubble, visitor } satisfies BubbleContext;
}

export async function ensureProfileVisitor(profile: BubbleProfile, slug?: string) {
  const activeSlug = resolveBubbleSlug(slug);
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    setStoredProfile(profile);
    return { status: "offline", message: "Supabase ist noch nicht konfiguriert. Dein Profil wurde lokal gespeichert.", visitor: null } satisfies BubbleContext;
  }

  const bubble = await getActiveBubble(activeSlug);
  if (!bubble) return { status: "error", message: "Die Demo-Bubble ist nicht aktiv." } satisfies BubbleContext;

  const sessionId = getOrCreateSessionId();
  const storedVisitorId = getStoredVisitorId(activeSlug);
  const now = new Date().toISOString();
  const payload = {
    bubble_id: bubble.id,
    session_id: sessionId,
    nickname: profile.name,
    avatar_url: profile.avatar,
    is_guest: profile.isAnonymous,
    is_active: true,
    left_at: null,
    last_seen_at: now,
  };

  const request = storedVisitorId
    ? supabase.from("visitors").update(payload).eq("id", storedVisitorId).eq("bubble_id", bubble.id).eq("session_id", sessionId).select("*").single()
    : supabase.from("visitors").upsert(payload, { onConflict: "bubble_id,session_id" }).select("*").single();
  const { data, error } = await request;

  if (error) {
    logSupabaseError("ensureProfileVisitor.saveVisitor", error);
    throw error;
  }
  const visitor = data as VisitorRow;
  setStoredVisitorId(visitor.id, activeSlug);
  setStoredProfile({
    name: visitor.nickname,
    avatar: visitor.avatar_url ?? partnerConfig.images.user,
    isAnonymous: visitor.is_guest,
  });
  return { status: "ready", bubble, visitor } satisfies BubbleContext;
}

export async function getCurrentContext(slug?: string): Promise<BubbleContext> {
  const activeSlug = resolveBubbleSlug(slug);
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { status: "offline", message: "Supabase ist noch nicht konfiguriert. Lokale Demo-Daten bleiben sichtbar." };

  const bubble = await getActiveBubble(activeSlug);
  if (!bubble) return { status: "error", message: "Die Demo-Bubble ist nicht aktiv." };

  const visitorId = getStoredVisitorId(activeSlug);
  if (!visitorId) return { status: "ready", bubble };

  const { data, error } = await supabase.from("visitors").select("*").eq("id", visitorId).eq("bubble_id", bubble.id).maybeSingle();
  if (error) {
    logSupabaseError("getCurrentContext.findVisitor", error);
    throw error;
  }
  return { status: "ready", bubble, visitor: (data as VisitorRow | null) ?? undefined };
}

export async function getStoredVisitor(slug?: string) {
  const supabase = getSupabaseBrowserClient();
  const activeSlug = resolveBubbleSlug(slug);
  const visitorId = getStoredVisitorId(activeSlug);
  if (!supabase || !visitorId) return null;

  const sessionId = getOrCreateSessionId();
  const bubble = await getActiveBubble(activeSlug);
  if (!bubble) return null;
  const { data, error } = await supabase.from("visitors").select("*").eq("id", visitorId).eq("bubble_id", bubble.id).eq("session_id", sessionId).maybeSingle();
  if (error) {
    logSupabaseError("getStoredVisitor", error);
    throw error;
  }

  return data as VisitorRow | null;
}

export async function touchVisitor(visitorId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !visitorId) return;
  const sessionId = getOrCreateSessionId();
  const { error } = await supabase
    .from("visitors")
    .update({
      is_active: true,
      left_at: null,
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", visitorId)
    .eq("session_id", sessionId);
  if (error) logSupabaseError("touchVisitor", error);
}

export async function leaveVisitor(visitorId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !visitorId) return;

  const sessionId = getOrCreateSessionId();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("visitors")
    .update({
      is_active: false,
      left_at: now,
      last_seen_at: now,
    })
    .eq("id", visitorId)
    .eq("session_id", sessionId);
  if (error) logSupabaseError("leaveVisitor", error);
}

export async function fetchActiveVisitors(bubbleId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("visitors")
    .select("*")
    .eq("bubble_id", bubbleId)
    .eq("is_active", true)
    .gte("last_seen_at", fiveMinutesAgo)
    .order("last_seen_at", { ascending: false });
  if (error) {
    logSupabaseError("fetchActiveVisitors", error);
    throw error;
  }
  return (data ?? []) as VisitorRow[];
}

export async function fetchActiveVisitorCount(bubbleId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return 0;

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("visitors")
    .select("id", { count: "exact", head: true })
    .eq("bubble_id", bubbleId)
    .eq("is_active", true)
    .gte("last_seen_at", fiveMinutesAgo);
  if (error) {
    logSupabaseError("fetchActiveVisitorCount", error);
    throw error;
  }
  return count ?? 0;
}

export async function fetchPosts(bubbleId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("posts")
    .select("id,bubble_id,visitor_id,content,created_at,visitors(nickname,avatar_url)")
    .eq("bubble_id", bubbleId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) {
    logSupabaseError("fetchPosts", error);
    throw error;
  }
  return ((data ?? []) as Array<Omit<PostRow, "visitors"> & { visitors?: Array<Pick<VisitorRow, "nickname" | "avatar_url">> | Pick<VisitorRow, "nickname" | "avatar_url"> | null }>).map((row) => ({
    ...row,
    visitors: Array.isArray(row.visitors) ? (row.visitors[0] ?? null) : (row.visitors ?? null),
  }));
}

export async function createPost(bubbleId: string, visitorId: string, content: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { error } = await supabase.from("posts").insert({
    bubble_id: bubbleId,
    visitor_id: visitorId,
    content,
  });
  if (error) {
    logSupabaseError("createPost", error);
    throw error;
  }
  return true;
}

export function mapPost(row: PostRow): PostView {
  return {
    id: row.id,
    author: row.visitors?.nickname ?? "Bubble Gast",
    avatar: row.visitors?.avatar_url ?? partnerConfig.images.user,
    text: row.content,
    time: formatTime(row.created_at),
  };
}

export async function fetchActivePoll(bubbleId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("polls").select("*").eq("bubble_id", bubbleId).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data as PollRow | null;
}

export async function fetchPollVotes(pollId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("poll_votes").select("*").eq("poll_id", pollId);
  if (error) throw error;
  return (data ?? []) as PollVoteRow[];
}

export async function submitPollVote(pollId: string, visitorId: string, optionKey: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { error } = await supabase.from("poll_votes").insert({ poll_id: pollId, visitor_id: visitorId, option_key: optionKey });
  if (error) throw error;
  return true;
}

export async function fetchActiveFanBattle(bubbleId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("fan_battles").select("*").eq("bubble_id", bubbleId).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data as FanBattleRow | null;
}

export async function submitFanBattleEntry(fanBattleId: string, visitorId: string, selectedTeam: "home" | "away", taps: number) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("submit_fan_battle_entry", {
    p_fan_battle_id: fanBattleId,
    p_visitor_id: visitorId,
    p_selected_team: selectedTeam,
    p_taps: taps,
  });
  if (error) throw error;
  return data as FanBattleRow;
}

export function formatTime(value: string) {
  const delta = Date.now() - new Date(value).getTime();
  if (delta < 60_000) return "gerade eben";
  if (delta < 3_600_000) return `vor ${Math.max(1, Math.round(delta / 60_000))} Min.`;
  return `vor ${Math.max(1, Math.round(delta / 3_600_000))} Std.`;
}

export function getSupabaseChannel() {
  return getSupabaseBrowserClient()?.channel;
}
