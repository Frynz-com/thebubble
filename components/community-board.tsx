"use client";

import { Send, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
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
import { getCurrentBubbleSlug } from "@/lib/bubble-routing";
import { trackBubbleEvent } from "@/lib/analytics";
import { removeBubbleRealtime, subscribeToBubbleRealtime } from "@/lib/realtime";
import type { BubbleRow, VisitorRow } from "@/lib/supabase/types";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { BubblePost, getStoredPosts, getStoredProfile, setStoredPosts } from "@/lib/storage";
import { PostCard } from "./cards";

export function CommunityBoard() {
  const bubbleSlug = getCurrentBubbleSlug();
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
    setLocalPosts(getStoredPosts(bubbleSlug));
    let mounted = true;
    let channel: RealtimeChannel | null = null;

    async function load() {
      try {
        const context = await getCurrentContext(bubbleSlug);
        if (!mounted) return;
        if (context.message) setMessage(context.message);
        if (!context.bubble) return;

        setBubble(context.bubble);
        setVisitor(context.visitor ?? null);
        const [visitors, posts] = await Promise.all([fetchActiveVisitors(context.bubble.id), fetchPosts(context.bubble.id)]);
        if (!mounted) return;
        setActiveVisitors(visitors);
        setRemotePosts(posts.map(mapPost));
        if (!channel) {
          channel = subscribeToBubbleRealtime({
            bubbleId: context.bubble.id,
            channelName: `bubble-community-${context.bubble.id}`,
            onChange: () => void load(),
          });
        }
      } catch {
        if (mounted) setMessage("Verbindung fehlgeschlagen. Lokale Demo-Beiträge bleiben sichtbar.");
      }
    }

    load();
    const interval = window.setInterval(() => void load(), 45_000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      removeBubbleRealtime(channel);
    };
  }, [bubbleSlug]);

  const people: BubblePerson[] =
    activeVisitors.length > 0
      ? activeVisitors.slice(0, 8).map((item) => ({
          id: item.id,
          name: item.nickname,
          avatar: item.is_guest ? "" : (item.avatar_url ?? ""),
          active: true,
        }))
      : bubbleSlug === "demo"
        ? partnerConfig.people
        : [];

  const headlineCount = activeVisitors.length;

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanText = text.trim();
    if (!cleanText) return;

    if (bubble && visitor) {
      try {
        await createPost(bubble.id, visitor.id, cleanText.slice(0, 180));
        void trackBubbleEvent("community_post", { length: cleanText.length }, bubbleSlug);
        setText("");
        const posts = await fetchPosts(bubble.id);
        setRemotePosts(posts.map(mapPost));
        return;
      } catch {
        setMessage("Beitrag konnte nicht gespeichert werden.");
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
    setText("");
  }

  const demoPosts: Post[] = bubbleSlug === "demo" ? partnerConfig.posts : [];
  const visiblePosts = remotePosts.length > 0 ? remotePosts : [...localPosts, ...demoPosts];

  if (!config.features.community) {
    return <p className="rounded-[1.5rem] bg-white p-5 text-sm font-semibold text-on-surface-variant shadow-ambient">Community ist für diese Bubble nicht aktiv.</p>;
  }

  return (
    <div className="space-y-5">
      {message ? <p className="rounded-[1.25rem] bg-white p-4 text-sm font-semibold text-on-surface-variant shadow-ambient">{message}</p> : null}
      {config.features.peopleHere ? (
        <section className="rounded-[1.5rem] bg-white p-5 shadow-ambient">
          <h2 className="text-xl font-bold text-on-surface">{headlineCount} Personen sind gerade in dieser Bubble</h2>
          {people.length > 0 ? (
            <div className="mt-5 grid grid-cols-5 gap-3">
              {people.map((person) => (
                <button key={person.id} className="min-w-0 text-center" type="button" onClick={() => setSelectedPerson(person)}>
                  <AvatarCircle src={person.avatar} name={person.name} size="md" fallback="initial" className="mx-auto" />
                  <span className="mt-2 block truncate text-xs font-bold text-on-surface">{person.name}</span>
                  {person.active ? <span className="block text-[10px] font-bold text-secondary">gerade aktiv</span> : null}
                </button>
              ))}
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
