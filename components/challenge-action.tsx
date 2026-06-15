"use client";

import { useRouter } from "next/navigation";
import { bubblePath, getCurrentBubbleSlug } from "@/lib/bubble-routing";

export function ChallengeAction() {
  const router = useRouter();

  return (
    <button
      className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-primary-container px-6 text-sm font-bold text-on-primary-container shadow-cta transition active:scale-95"
      type="button"
      onClick={() => router.push(bubblePath(getCurrentBubbleSlug(), "/challenge/success"))}
    >
      An Challenge teilnehmen
    </button>
  );
}
