import Image from "next/image";
import Link from "next/link";
import { Calendar, Ticket, UsersRound } from "lucide-react";
import type { Benefit, Challenge, Post } from "@/lib/partner-config";
import { fallbackBenefitIcon } from "@/lib/partner-config";
import { bubblePath, defaultBubbleSlug } from "@/lib/bubble-routing";
import { AvatarCircle } from "./avatar-circle";
import { ChallengeAction } from "./challenge-action";
import { LiveChip } from "./live-chip";

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  return (
    <article className="overflow-hidden rounded-[2rem] bg-white shadow-ambient animate-pop-in">
      <div className="relative h-52">
        <Image src={challenge.image} alt="" fill sizes="430px" className="object-cover" />
        <div className="absolute left-4 top-4">
          <LiveChip />
        </div>
      </div>
      <div className="p-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-secondary">{challenge.kicker}</p>
        <h2 className="text-2xl font-bold leading-8 text-on-surface">{challenge.title}</h2>
        <p className="mt-3 text-base leading-6 text-on-surface-variant">{challenge.body}</p>
        <div className="my-5 flex items-center gap-3 rounded-3xl bg-surface-container-low p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary shadow-ambient">
            <Ticket size={22} />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">{challenge.prize}</p>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-outline">
              <UsersRound size={14} />
              {challenge.participants} Personen sind gerade dabei
            </p>
          </div>
        </div>
        <ChallengeAction />
      </div>
    </article>
  );
}

export function BenefitCard({ benefit, compact = false, onRedeem, bubbleSlug = defaultBubbleSlug }: { benefit: Benefit; compact?: boolean; onRedeem?: (benefit: Benefit) => void; bubbleSlug?: string }) {
  const Icon = benefit.icon ?? fallbackBenefitIcon;
  const tagClass =
    benefit.variant === "secondary"
      ? "bg-secondary text-on-secondary"
      : benefit.variant === "tertiary"
        ? "bg-tertiary-container text-white"
        : "bg-primary text-on-primary";

  return (
    <article className="overflow-hidden rounded-[1.5rem] bg-white shadow-ambient transition active:scale-[0.98]">
      {benefit.image && !compact ? (
        <div className="relative h-48 overflow-hidden">
          <Image src={benefit.image} alt="" fill sizes="430px" className="object-cover" />
          <div className={`absolute left-4 top-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${tagClass}`}>
            <Icon size={15} />
            {benefit.tag}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between border-b border-surface-container-high bg-surface-container-low p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-ambient">
              <Icon size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">{benefit.sponsor ?? benefit.tag}</p>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-outline">{benefit.meta}</p>
            </div>
          </div>
        </div>
      )}
      <div className={compact ? "p-4" : "p-5"}>
        {(!benefit.image || compact) ? (
          <div className="mb-3 flex items-center gap-2 text-secondary">
            <Icon size={18} />
            <span className="text-xs font-bold uppercase tracking-[0.12em]">{benefit.tag}</span>
          </div>
        ) : null}
        <h2 className={compact ? "text-base font-bold leading-6 text-on-surface" : "text-xl font-semibold leading-7 text-on-surface"}>{benefit.title}</h2>
        {!compact ? <p className="mt-3 text-base leading-6 text-on-surface-variant">{benefit.description}</p> : null}
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="flex items-center gap-1 text-xs font-bold text-outline">
            <Calendar size={15} />
            {benefit.meta}
          </span>
          {onRedeem ? (
            <button className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition active:scale-95" type="button" onClick={() => onRedeem(benefit)}>
              {benefit.action}
            </button>
          ) : (
            <Link href={bubblePath(bubbleSlug, "/benefits")} className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition active:scale-95">
              Ansehen
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="space-y-3 rounded-[1.5rem] bg-white p-4 shadow-ambient">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AvatarCircle src={post.avatar} name={post.author} size="sm" fallback="initial" />
          <div>
            <p className="text-sm font-bold text-on-surface">{post.author}</p>
            <p className="text-xs font-semibold text-on-surface-variant">{post.time}</p>
          </div>
        </div>
      </div>
      <p className="text-base leading-6 text-on-surface-variant">{post.text}</p>
    </article>
  );
}
