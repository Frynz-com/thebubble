"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ensureBubbleVisitor } from "@/lib/bubble-service";
import { bubblePath, normalizeBubbleSlug } from "@/lib/bubble-routing";
import { bubbleThemeStyle, heroMediaStyle, useBubbleConfig } from "@/lib/bubble-config";
import { trackBubbleEvent } from "@/lib/analytics";

export function HuberArenaEntry({ bubbleSlug }: { bubbleSlug: string }) {
  const normalizedSlug = normalizeBubbleSlug(bubbleSlug);
  const config = useBubbleConfig(normalizedSlug);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function enterBubble() {
    setBusy(true);
    setMessage("");
    try {
      await ensureBubbleVisitor(normalizedSlug);
      void trackBubbleEvent("enter_bubble", { source: "huber_entry" }, normalizedSlug);
      router.push(bubblePath(normalizedSlug, "/live"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bubble konnte nicht betreten werden.");
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-on-surface" style={bubbleThemeStyle(config)}>
      {config.heroImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={config.heroImageUrl} alt="Public Viewing in der Huber Arena" className="absolute inset-0 h-full w-full object-cover object-top" style={heroMediaStyle({ ...config, heroPositionY: "top" })} />
      ) : (
        <div className="absolute inset-0 bg-on-surface" />
      )}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,11,20,.54) 0%, rgba(7,11,20,.18) 46%, rgba(7,11,20,.08) 100%)" }} />

      <div className="phone-shell relative z-10 flex min-h-svh flex-col px-5 pb-[calc(2.25rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))]">
        <section className="mt-auto animate-pop-in text-center">
          <button
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-base font-black text-primary shadow-[0_18px_44px_rgba(0,0,0,.28)] ring-1 ring-white/55 transition active:scale-[0.98] disabled:opacity-70"
            type="button"
            disabled={busy}
            onClick={() => void enterBubble()}
          >
            {busy ? <Loader2 className="animate-spin" size={20} /> : null}
            Jetzt Bubble betreten
            {!busy ? <ArrowRight size={20} /> : null}
          </button>
          {message ? <p className="mt-3 rounded-[1rem] bg-white/90 px-3 py-2 text-sm font-bold text-on-surface">{message}</p> : null}
        </section>
      </div>
    </main>
  );
}
