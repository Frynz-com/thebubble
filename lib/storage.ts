import { partnerConfig } from "./partner-config";
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

export const profileKey = "the-bubble:profile";
export const postsKey = "the-bubble:posts";
export const voteKey = "the-bubble:vote";
export const sessionKey = "the-bubble:session-id";
export const visitorKey = "the-bubble:visitor-id";

export function getStoredProfile(): BubbleProfile | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(profileKey);
  if (!value) return null;

  try {
    return JSON.parse(value) as BubbleProfile;
  } catch {
    return null;
  }
}

export function setStoredProfile(profile: BubbleProfile) {
  window.localStorage.setItem(profileKey, JSON.stringify(profile));
}

export function clearStoredProfile() {
  window.localStorage.removeItem(profileKey);
  window.localStorage.removeItem(voteKey);
  window.localStorage.removeItem(getVisitorKey());
}

export function createGuestProfile(): BubbleProfile {
  const number = Math.floor(10 + Math.random() * 90);
  const avatars = partnerConfig.people.map((person) => person.avatar);
  const avatar = avatars[Math.floor(Math.random() * avatars.length)] ?? partnerConfig.images.user;

  return {
    name: `Bubble Gast ${number}`,
    avatar,
    isAnonymous: true,
  };
}

export function getStoredPosts(): BubblePost[] {
  if (typeof window === "undefined") return [];
  const value = window.localStorage.getItem(postsKey);
  if (!value) return [];

  try {
    return JSON.parse(value) as BubblePost[];
  } catch {
    return [];
  }
}

export function setStoredPosts(posts: BubblePost[]) {
  window.localStorage.setItem(postsKey, JSON.stringify(posts));
}

export function getOrCreateSessionId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(sessionKey);
  if (existing) return existing;

  const generated =
    window.crypto?.randomUUID?.() ??
    `session-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(sessionKey, generated);
  return generated;
}

function getVisitorKey(slug = getCurrentBubbleSlug()) {
  return `${visitorKey}:${normalizeBubbleSlug(slug)}`;
}

export function getStoredVisitorId(slug?: string) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(getVisitorKey(slug)) ?? window.localStorage.getItem(visitorKey) ?? "";
}

export function setStoredVisitorId(value: string, slug?: string) {
  window.localStorage.setItem(getVisitorKey(slug), value);
  window.localStorage.removeItem(visitorKey);
}
