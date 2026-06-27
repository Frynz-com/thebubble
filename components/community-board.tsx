"use client";

import { Send, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { BubblePerson, Post } from "@/lib/partner-config";
import { partnerConfig } from "@/lib/partner-config";
import { AvatarCircle } from "@/components/avatar-circle";
import {
  createPost,
  fetchActiveVisitors,
  fetchPosts,
  getCurrentContext,
  mapPost,
} from "@/lib/bubble-service";
import { useBubbleConfig } from "@/lib/bubble-config";
import { getBubbleSlugFromPathname } from "@/lib/bubble-routing";
import { trackBubbleEvent } from "@/lib/analytics";
import type { BubbleRow, VisitorRow } from "@/lib/supabase/types";
import { BubblePost, getStoredPosts, getStoredProfile, setStoredPosts } from "@/lib/storage";
import { PostCard } from "./cards";

export function CommunityBoard() {
  const bubbleSlug = getBubbleSlugFromPathname(usePathname());
  const isDemoBubble = bubbleSlug === "demo";
  const config = useBubbleConfig(bubbleSlug);
  const [text, setText] = useState("");
  const [localPosts, setLocalPosts] = useState<BubblePost[]>([]);
  const [remotePosts, setRemotePosts] = useState<Post[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<VisitorRow[]>([]);
  const [bubble, setBubble] = useState<BubbleRow | null>(null);
  const [visitor, setVisitor] = useState<VisitorRow | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<BubblePerson | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (bubbleSlug === "public-viewing-quickborn") void trackBubbleEvent("community_view", { source: "community_page" }, bubbleSlug);
  }, [bubbleSlug]);

  useEffect(() => {
    setLocalPosts(isDemoBubble ? getStoredPosts(bubbleSlug) : []);
    let mounted = true;
    let currentBubbleId = "";

    async function refreshData(bubbleId: string) {
      const [visitors, posts] = await Promise.all([fetchActiveVisitors(bubbleId), fetchPosts(bubbleId)]);
      if (!mounted) return;
      setActiveVisitors(visitors);
      setRemotePosts(posts.map(mapPost));
      setMessage("");
    }

    async function loadInitial() {
      try {
        const context = await getCurrentContext(bubbleSlug);
        if (!mounted) return;
        if (context.message && isDemoBubble) setMessage(context.message);
        if (!context.bubble) return;

        setBubble(context.bubble);
        setVisitor(context.visitor ?? null);
        currentBubbleId = context.bubble.id;
        await refreshData(context.bubble.id);
      } catch {
        if (mounted) setMessage(isDemoBubble ? "Demo-Verbindung unterbrochen. Lokale Demo-Beiträge bleiben sichtbar." : "Verbindung kurz unterbrochen. Beiträge werden erneut geladen.");
      }
    }

    async function poll() {
      try {
        if (currentBubbleId) await refreshData(currentBubbleId);
        else await loadInitial();
      } catch {
        if (mounted) setMessage(isDemoBubble ? "Demo-Verbindung unterbrochen. Lokale Demo-Beiträge bleiben sichtbar." : "Verbindung kurz unterbrochen. Beiträge werden erneut geladen.");
      }
    }

    void loadInitial();
    const interval = window.setInterval(() => void poll(), 15_000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [bubbleSlug, isDemoBubble]);

  const peopleAll: BubblePerson[] =
    activeVisitors.length > 0
      ? activeVisitors.map((item) => ({
          id: item.id,
          name: item.nickname,
          avatar: item.is_guest ? "" : (item.avatar_url ?? ""),
          active: true,
        }))
      : isDemoBubble
        ? partnerConfig.people
        : [];

  const visiblePeople = peopleAll.slice(0, 6);
  const additionalPeople = Math.max(0, peopleAll.length - visiblePeople.length);
  const headlineCount = peopleAll.length;
  const headlineLabel = headlineCount === 1 ? "Person ist" : "Personen sind";

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanText = text.trim();
    if (!cleanText) return;
    if (bubbleSlug === "public-viewing-quickborn") void trackBubbleEvent("community_post_attempt", { has_text: true }, bubbleSlug);

    if (!bubble || !visitor) {
      if (!isDemoBubble) {
        setMessage("Verbindung wird hergestellt. Bitte gleich erneut posten.");
        return;
      }
    }

    if (bubble && visitor) {
      try {
        await createPost(bubble.id, visitor.id, cleanText.slice(0, 180));
        void trackBubbleEvent("community_post", { length: cleanText.length }, bubbleSlug);
        if (bubbleSlug === "public-viewing-quickborn") void trackBubbleEvent("community_post_success", { length_bucket: cleanText.length > 80 ? "long" : "short" }, bubbleSlug);
        setText("");
        const posts = await fetchPosts(bubble.id);
        setRemotePosts(posts.map(mapPost));
        setMessage("");
        return;
      } catch {
        setMessage("Beitrag konnte nicht gespeichert werden. Bitte gleich erneut versuchen.");
        return;
      }
    }

    const profile = getStoredProfile(bubbleSlug);
    const nextPost: BubblePost = {
      id: `${Date.now()}`,
      author: profile?.name ?? "Bubble Gast",
      avatar: profile?.avatar ?? "",
      text: cleanText.slice(0, 180),
      time: "gerade eben",
    };

    const nextPosts = [nextPost, ...localPosts].slice(0, 12);
    setLocalPosts(nextPosts);
    setStoredPosts(nextPosts, bubbleSlug);
    void trackBubbleEvent("community_post", { length: cleanText.length, local: true }, bubbleSlug);
    if (bubbleSlug === "public-viewing-quickborn") void trackBubbleEvent("community_post_success", { local: true, length_bucket: cleanText.length > 80 ? "long" : "short" }, bubbleSlug);
    setText("");
  }

  const demoPosts: Post[] = isDemoBubble ? partnerConfig.posts : [];
  const visiblePosts = remotePosts.length > 0 ? remotePosts : isDemoBubble ? [...localPosts, ...demoPosts] : [];

  if (!config.features.community) {
    return <p className="rounded-[1.5rem] bg-white p-5 text-sm font-semibold text-on-surface-variant shadow-ambient">Community ist für diese Bubble nicht aktiv.</p>;
  }

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-[1.25rem] bg-white p-4 text-sm font-semibold text-on-surface-variant shadow-ambient">
          <p>{message}</p>
          <button className="mt-3 min-h-10 rounded-full bg-surface px-4 text-xs font-black text-primary" type="button" onClick={() => window.location.reload()}>
            Erneut laden
          </button>
        </div>
      ) : null}
      {config.features.peopleHere ? (
        <section className="rounded-[1.5rem] bg-white p-5 shadow-ambient">
          <h2 className="text-xl font-bold text-on-surface">
            {headlineCount} {headlineLabel} gerade in dieser Bubble
          </h2>
          {visiblePeople.length > 0 ? (
            <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-6">
              {visiblePeople.map((person) => (
                <button key={person.id} className="min-w-0 text-center" type="button" onClick={() => setSelectedPerson(person)}>
                  <AvatarCircle src={person.avatar} name={person.name} size="md" fallback="initial" className="mx-auto" />
                  <span className="mt-2 block truncate text-xs font-bold text-on-surface">{person.name}</span>
                  {person.active ? <span className="block text-[10px] font-bold text-secondary">gerade aktiv</span> : null}
                </button>
              ))}
              {additionalPeople > 0 ? (
                <div className="flex min-w-0 flex-col items-center justify-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-xs font-black text-primary">+{additionalPeople}</div>
                  <span className="mt-2 block text-xs font-bold text-on-surface-variant">weitere</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-[1.5rem] bg-white p-4 shadow-ambient">
        <form className="space-y-3" onSubmit={submitPost}>
          {config.communityRules ? <p className="rounded-[1rem] bg-surface-container-low p-3 text-sm font-semibold leading-5 text-on-surface-variant">{config.communityRules}</p> : null}
          <label className="block">
            <span className="sr-only">Beitrag</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={config.communityPlaceholder}
              className="min-h-24 w-full resize-none rounded-[1.25rem] border-2 border-outline-variant/35 bg-surface p-4 text-base leading-6 text-on-surface outline-none placeholder:text-outline focus:border-primary"
              maxLength={180}
            />
          </label>
          <button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-on-primary transition active:scale-95" type="submit">
            <Send size={18} />
            Posten
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-on-surface">Community-Beiträge</h2>
        {visiblePosts.length > 0 ? visiblePosts.map((post) => <PostCard key={post.id} post={post} />) : <p className="rounded-[1.5rem] bg-white p-5 text-sm font-semibold text-on-surface-variant shadow-ambient">Noch keine Beiträge in dieser Bubble.</p>}
      </section>

      {selectedPerson ? (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-on-surface/25 p-5 backdrop-blur-sm" role="dialog" aria-modal="true">
          <button className="absolute inset-0 h-full w-full cursor-default" type="button" aria-label="Profilkarte schließen" onClick={() => setSelectedPerson(null)} />
          <section className="relative w-full max-w-sm rounded-[2rem] bg-white p-5 text-center shadow-active animate-pop-in">
            <button className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low text-on-surface" type="button" aria-label="Schließen" onClick={() => setSelectedPerson(null)}>
              <X size={18} />
            </button>
            <AvatarCircle src={selectedPerson.avatar} name={selectedPerson.name} size="xl" fallback="initial" className="mx-auto h-24 w-24" />
            <h3 className="mt-4 text-2xl font-bold text-on-surface">{selectedPerson.name}</h3>
            <p className="mt-1 text-sm font-bold text-secondary">Gerade hier</p>
          </section>
        </div>
      ) : null}
    </div>
  );
}
