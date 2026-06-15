import { ArrowLeft, Share2, Trophy } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { PrimaryButton } from "@/components/primary-button";
import { bubblePath } from "@/lib/bubble-routing";
import { partnerConfig } from "@/lib/partner-config";

export function BubbleSuccessScreen({ bubbleSlug }: { bubbleSlug: string }) {
  return (
    <main className="min-h-svh overflow-hidden bg-surface">
      <AppHeader />
      <div className="phone-shell relative z-10 flex min-h-svh flex-col items-center justify-center px-5 pb-12 pt-24 text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-square w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/60 blur-3xl animate-float-soft" />

        <div className="relative mb-8 flex justify-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-cta">
            <Trophy size={64} strokeWidth={2.6} />
          </div>
          <div className="absolute -right-2 -top-4 h-8 w-8 rounded-full bg-secondary/20 animate-float-soft" />
          <div className="absolute -left-6 bottom-2 h-12 w-12 rounded-full bg-blue-200/50 animate-float-soft" />
        </div>

        <h1 className="text-[32px] font-bold leading-10 tracking-normal text-on-surface">{partnerConfig.success.title}</h1>
        <p className="mt-3 max-w-xs text-lg leading-7 text-on-surface-variant">{partnerConfig.success.body}</p>

        <div className="mt-10 w-full space-y-4">
          <PrimaryButton href={bubblePath(bubbleSlug, "/live")} icon={<ArrowLeft size={20} />}>
            Zurück zur Bubble
          </PrimaryButton>
          <PrimaryButton href={bubblePath(bubbleSlug, "/community")} variant="outline" icon={<Share2 size={20} />}>
            Mit Community teilen
          </PrimaryButton>
        </div>

        <Link href={bubblePath(bubbleSlug, "/benefits")} className="mt-10 flex w-full items-center gap-4 rounded-[1.5rem] border border-outline-variant/20 bg-white p-4 text-left shadow-ambient">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-tertiary-fixed text-on-tertiary-fixed">
            <Trophy size={22} />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">{partnerConfig.success.prize}</p>
            <p className="text-xs font-semibold text-on-surface-variant">Die Ziehung erfolgt am 01. Juli</p>
          </div>
        </Link>
      </div>
    </main>
  );
}
