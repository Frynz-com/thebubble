import { getCurrentBubbleSlug, normalizeBubbleSlug } from "./bubble-routing";

export type BubbleProfile = {
  name: string;
  avatar: string;
  isAnonymous: boolean;
};

export type BubblePost = {
  id: string;
  author: string;
  avatar: string;
  text: string;
  time: string;
};

export type BubbleVisitorSession = {
  visitor_id: string;
  visitor_name?: string;
  avatar_url?: string | null;
  created_at?: string;
  last_seen?: string;
};

export const profileKey = "the-bubble:profile";
export const postsKey = "the-bubble:posts";
export const voteKey = "the-bubble:vote";
export const sessionKey = "the-bubble:session-id";
export const visitorKey = "the-bubble:visitor-id";

function scopedKey(base: string, slug = getCurrentBubbleSlug()) {
  return `${base}:${normalizeBubbleSlug(slug)}`;
}

export function getStoredProfile(slug?: string): BubbleProfile | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(scopedKey(profileKey, slug)) ?? window.localStorage.getItem(profileKey);
  if (!value) return null;

  try {
    return JSON.parse(value) as BubbleProfile;
  } catch {
    return null;
  }
}

export function setStoredProfile(profile: BubbleProfile, slug?: string) {
  window.localStorage.setItem(scopedKey(profileKey, slug), JSON.stringify(profile));
  window.localStorage.removeItem(profileKey);
}

export function clearStoredProfile(slug?: string) {
  const activeSlug = normalizeBubbleSlug(slug ?? getCurrentBubbleSlug());
  window.localStorage.removeItem(scopedKey(profileKey, activeSlug));
  window.localStorage.removeItem(profileKey);
  window.localStorage.removeItem(getVoteKey(activeSlug));
  window.localStorage.removeItem(voteKey);
  window.localStorage.removeItem(getPostsKey(activeSlug));
  window.localStorage.removeItem(postsKey);
}

export function createGuestProfile(): BubbleProfile {
  const number = Math.floor(1000 + Math.random() * 9000);

  return {
    name: `Gast ${number}`,
    avatar: "",
    isAnonymous: true,
  };
}

export function getStoredPosts(slug?: string): BubblePost[] {
  if (typeof window === "undefined") return [];
  const value = window.localStorage.getItem(getPostsKey(slug)) ?? window.localStorage.getItem(postsKey);
  if (!value) return [];

  try {
    return JSON.parse(value) as BubblePost[];
  } catch {
    return [];
  }
}

export function setStoredPosts(posts: BubblePost[], slug?: string) {
  window.localStorage.setItem(getPostsKey(slug), JSON.stringify(posts));
  window.localStorage.removeItem(postsKey);
}

export function getOrCreateSessionId(slug?: string) {
  if (typeof window === "undefined") return "";
  const activeSlug = normalizeBubbleSlug(slug ?? getCurrentBubbleSlug());
  const existing = window.localStorage.getItem(getSessionKey(activeSlug)) ?? getLegacySessionId(activeSlug);
  if (existing) return existing;

  const generated =
    window.crypto?.randomUUID?.() ??
    `session-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  setStoredSessionId(generated, activeSlug);
  return generated;
}

function getVisitorKey(slug = getCurrentBubbleSlug()) {
  return `thebubble:visitor:${normalizeBubbleSlug(slug)}`;
}

function getLegacyVisitorKey(slug = getCurrentBubbleSlug()) {
  return `thebubble_visitor_${normalizeBubbleSlug(slug)}`;
}

function getSessionKey(slug = getCurrentBubbleSlug()) {
  return `thebubble:session:${normalizeBubbleSlug(slug)}`;
}

function getPostsKey(slug = getCurrentBubbleSlug()) {
  return `thebubble:posts:${normalizeBubbleSlug(slug)}`;
}

export function getVoteKey(slug = getCurrentBubbleSlug()) {
  return `thebubble:vote:${normalizeBubbleSlug(slug)}`;
}

function getLegacySessionId(slug = getCurrentBubbleSlug()) {
  const activeSlug = normalizeBubbleSlug(slug);
  const legacyScoped = window.localStorage.getItem(`${sessionKey}:${activeSlug}`);
  if (legacyScoped) {
    setStoredSessionId(legacyScoped, activeSlug);
    window.localStorage.removeItem(`${sessionKey}:${activeSlug}`);
    return legacyScoped;
  }

  if (activeSlug === "demo") {
    const legacyGlobal = window.localStorage.getItem(sessionKey);
    if (legacyGlobal) {
      setStoredSessionId(legacyGlobal, activeSlug);
      window.localStorage.removeItem(sessionKey);
      return legacyGlobal;
    }
  }

  return "";
}

function setStoredSessionId(value: string, slug?: string) {
  window.localStorage.setItem(getSessionKey(slug), value);
}

export function getStoredVisitorId(slug?: string) {
  return getStoredVisitorSession(slug)?.visitor_id ?? "";
}

export function getStoredVisitorSession(slug?: string): BubbleVisitorSession | null {
  if (typeof window === "undefined") return null;
  const activeSlug = normalizeBubbleSlug(slug ?? getCurrentBubbleSlug());
  const stored =
    window.localStorage.getItem(getVisitorKey(activeSlug)) ??
    window.localStorage.getItem(getLegacyVisitorKey(activeSlug)) ??
    (activeSlug === "demo" ? window.localStorage.getItem(visitorKey) : "") ??
    "";

  const session = parseStoredVisitorSession(stored);
  if (session) setStoredVisitorSession(session, activeSlug);
  return session;
}

export function setStoredVisitorId(value: string, slug?: string) {
  setStoredVisitorSession({ visitor_id: value, last_seen: new Date().toISOString() }, slug);
}

export function setStoredVisitorSession(session: BubbleVisitorSession, slug?: string) {
  window.localStorage.setItem(getVisitorKey(slug), JSON.stringify(session));
  window.localStorage.removeItem(getLegacyVisitorKey(slug));
  window.localStorage.removeItem(visitorKey);
}

function parseStoredVisitorSession(value: string | null): BubbleVisitorSession | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<BubbleVisitorSession> | null;
    if (parsed && typeof parsed === "object" && typeof parsed.visitor_id === "string" && parsed.visitor_id.trim()) {
      return {
        visitor_id: parsed.visitor_id,
        visitor_name: typeof parsed.visitor_name === "string" ? parsed.visitor_name : undefined,
        avatar_url: typeof parsed.avatar_url === "string" ? parsed.avatar_url : null,
        created_at: typeof parsed.created_at === "string" ? parsed.created_at : undefined,
        last_seen: typeof parsed.last_seen === "string" ? parsed.last_seen : undefined,
      };
    }
  } catch {
    if (value.trim()) return { visitor_id: value.trim() };
  }

  return value.trim() ? { visitor_id: value.trim() } : null;
}
