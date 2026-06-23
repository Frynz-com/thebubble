"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { getActiveBubble } from "@/lib/bubble-service";
import { getBubbleSlugFromPathname, normalizeBubbleSlug } from "@/lib/bubble-routing";
import { getBubbleBranding } from "@/lib/partner-config";
import type { BubbleRow, Json } from "@/lib/supabase/types";

export type BubbleFeatures = {
  live: boolean;
  community: boolean;
  polls: boolean;
  fanBattle: boolean;
  rewards: boolean;
  peopleHere: boolean;
  sponsorCard: boolean;
};

export type LogoShape = "round" | "rounded";
export type LogoFit = "cover" | "contain";
export type LogoBackground = "transparent" | "white" | "dark";
export type LogoSize = "small" | "medium" | "large";
export type HeroFit = "cover" | "contain";
export type HeroZoom = number;
export type HeroPosition = "center" | "top" | "bottom" | "left" | "right";
export type HeroPositionX = "left" | "center" | "right";
export type HeroPositionY = "top" | "center" | "bottom";
export type HeroHeight = "compact" | "normal" | "large";
export type HeroOverlay = "light" | "medium" | "strong";

export type RuntimeReward = {
  id: string;
  active: boolean;
  title: string;
  description: string;
  code: string;
  buttonText: string;
  hint: string;
};

export type RuntimeBubbleConfig = {
  slug: string;
  name: string;
  partnerName: string;
  type: string;
  description: string;
  logoUrl: string;
  heroImageUrl: string;
  primaryColor: string;
  accentColor: string;
  rewardTitle: string;
  rewardDescription: string;
  rewardTerms: string;
  backgroundStyle: string;
  headline: string;
  subheadline: string;
  eventTitle: string;
  eventSubtitle: string;
  scoreMode: "manual" | "api";
  scoreProvider: string;
  externalMatchId: string;
  actionBadge: string;
  actionButtonText: string;
  actionHint: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: string;
  awayScore: string;
  scoreText: string;
  pollQuestion: string;
  pollOptions: string[];
  pollHint: string;
  rewardLinked: boolean;
  communityTitle: string;
  communitySubtitle: string;
  communityPlaceholder: string;
  communityRules: string;
  challengeTitle: string;
  challengeDescription: string;
  voteTitle: string;
  rewardCta: string;
  rewardCode: string;
  rewards: RuntimeReward[];
  sponsorName: string;
  sponsorBannerUrl: string;
  sponsorText: string;
  sponsorCtaText: string;
  sponsorCtaLink: string;
  logoShape: LogoShape;
  logoFit: LogoFit;
  logoBackground: LogoBackground;
  logoSize: LogoSize;
  logoCropX: number;
  logoCropY: number;
  logoZoom: number;
  heroFit: HeroFit;
  heroZoom: HeroZoom;
  heroCropX: number;
  heroCropY: number;
  heroPosition: HeroPosition;
  heroPositionX: HeroPositionX;
  heroPositionY: HeroPositionY;
  heroHeight: HeroHeight;
  heroOverlay: HeroOverlay;
  features: BubbleFeatures;
  bubble: BubbleRow | null;
};

const neutralFeatures: BubbleFeatures = {
  live: true,
  community: true,
  polls: true,
  fanBattle: false,
  rewards: true,
  peopleHere: true,
  sponsorCard: false,
};

const neutralConfig = {
  headline: "Willkommen in deiner Bubble",
  subheadline: "Scannen, beitreten, live dabei sein.",
  backgroundStyle: "",
  eventTitle: "Live-Aktion",
  eventSubtitle: "Mach mit und sichere dir Vorteile vor Ort.",
  score_mode: "manual",
  score_provider: "",
  external_match_id: "",
  actionBadge: "Live-Aktion",
  actionButtonText: "Jetzt mitmachen",
  actionHint: "",
  homeTeamName: "",
  awayTeamName: "",
  homeScore: "0",
  awayScore: "0",
  scoreText: "Live",
  pollQuestion: "Was denkst du?",
  pollOptions: "Option A\nOption B",
  pollHint: "",
  communityTitle: "Community",
  communitySubtitle: "Schreib kurz etwas in die Bubble.",
  communityPlaceholder: "Dein Kommentar zum Moment ...",
  communityRules: "Bleib freundlich und poste nur, was in diese Bubble passt.",
  challengeTitle: "Live-Aktion",
  challengeDescription: "Mach mit und sichere dir Vorteile vor Ort.",
  voteTitle: "Was denkst du?",
  rewardCta: "Vorteil sichern",
  rewardCode: "BUBBLE",
  sponsorName: "",
  sponsorBannerUrl: "",
  sponsorText: "",
  sponsorCtaText: "",
  sponsorCtaLink: "",
  logoShape: "round",
  logoFit: "contain",
  logoBackground: "transparent",
  logoSize: "medium",
  logoCropX: "0",
  logoCropY: "0",
  logoZoom: "100",
  heroFit: "cover",
  heroZoom: "100",
  heroCropX: "0",
  heroCropY: "0",
  heroPosition: "center",
  heroPositionX: "center",
  heroPositionY: "center",
  heroHeight: "normal",
  heroOverlay: "medium",
};

function jsonObject(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function textFromJson(config: Json, key: keyof typeof neutralConfig) {
  const value = jsonObject(config)[key];
  return typeof value === "string" && value.trim() ? value.trim() : neutralConfig[key];
}

function optionalText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function colorText(value: unknown, fallback: string) {
  const text = optionalText(value);
  return /^#[0-9a-fA-F]{6}$/.test(text) ? text : fallback;
}

function booleanFromJson(config: Json, key: string, fallback = false) {
  const value = jsonObject(config)[key];
  return typeof value === "boolean" ? value : fallback;
}

function oneOfFromJson<T extends string>(config: Json, key: string, fallback: T, allowed: readonly T[]) {
  const value = jsonObject(config)[key];
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function numberFromJson(config: Json, key: string, fallback: number, min: number, max: number) {
  const value = jsonObject(config)[key];
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function heroPositionXFromLegacy(position: HeroPosition): HeroPositionX {
  if (position === "left" || position === "right") return position;
  return "center";
}

function heroPositionYFromLegacy(position: HeroPosition): HeroPositionY {
  if (position === "top" || position === "bottom") return position;
  return "center";
}

function pollOptionsFromJson(config: Json) {
  const value = jsonObject(config).pollOptions;
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean).slice(0, 6);
  }

  const text = typeof value === "string" ? value : neutralConfig.pollOptions;
  const options = text
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);

  return options.length > 0 ? options : ["Option A", "Option B"];
}

function rewardFromJson(value: Json | undefined, index: number): RuntimeReward {
  const source = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, Json | undefined>) : {};
  const title = optionalText(source.title);
  return {
    id: `reward-${index + 1}`,
    active: typeof source.active === "boolean" ? source.active : index === 0,
    title,
    description: optionalText(source.description),
    code: optionalText(source.code),
    buttonText: optionalText(source.buttonText) || "Vorteil sichern",
    hint: optionalText(source.hint),
  };
}

function rewardsFromJson(config: Json, bubble: BubbleRow | null): RuntimeReward[] {
  const value = jsonObject(config).rewards;
  const rewards = Array.isArray(value) ? value.slice(0, 3).map((item, index) => rewardFromJson(item, index)) : [];
  const activeRewards = rewards.filter((reward) => reward.active && reward.title);

  if (activeRewards.length > 0) return activeRewards;

  const legacyTitle = optionalText(bubble?.reward_title);
  if (!legacyTitle) return [];

  return [
    {
      id: "reward-1",
      active: true,
      title: legacyTitle,
      description: optionalText(bubble?.reward_description),
      code: textFromJson(config, "rewardCode"),
      buttonText: textFromJson(config, "rewardCta"),
      hint: optionalText(bubble?.reward_terms),
    },
  ];
}

function featuresFromJson(features: Json): BubbleFeatures {
  const source = jsonObject(features);
  return {
    live: typeof source.live === "boolean" ? source.live : neutralFeatures.live,
    community: typeof source.community === "boolean" ? source.community : neutralFeatures.community,
    polls: typeof source.polls === "boolean" ? source.polls : neutralFeatures.polls,
    fanBattle: typeof source.fanBattle === "boolean" ? source.fanBattle : neutralFeatures.fanBattle,
    rewards: typeof source.rewards === "boolean" ? source.rewards : neutralFeatures.rewards,
    peopleHere: typeof source.peopleHere === "boolean" ? source.peopleHere : neutralFeatures.peopleHere,
    sponsorCard: typeof source.sponsorCard === "boolean" ? source.sponsorCard : neutralFeatures.sponsorCard,
  };
}

export function formatBubbleType(value: string) {
  const raw = value.trim();
  const normalized = raw.toLowerCase();
  const labels: Record<string, string> = {
    public_viewing: "Public Viewing",
    sport_club: "Sportverein",
    auto_event: "Auto-Event",
    bar: "Bar",
    festival: "Festival",
    custom: "Bubble",
    live: "Live",
  };

  if (labels[normalized]) return labels[normalized];
  return raw
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function buildRuntimeBubbleConfig(slug: string, bubble: BubbleRow | null): RuntimeBubbleConfig {
  const normalizedSlug = normalizeBubbleSlug(slug);
  const fallbackBranding = getBubbleBranding(normalizedSlug);
  const name = optionalText(bubble?.name) || fallbackBranding.partnerName;
  const type = formatBubbleType(optionalText(bubble?.type) || optionalText(bubble?.event_name) || fallbackBranding.eventName);
  const legacyHeroPosition = oneOfFromJson(bubble?.config ?? null, "heroPosition", "center", ["center", "top", "bottom", "left", "right"] as const);
  const rewards = rewardsFromJson(bubble?.config ?? null, bubble);
  const primaryReward = rewards[0];

  return {
    slug: normalizedSlug,
    name,
    partnerName: optionalText(bubble?.partner_name) || name,
    type,
    description: optionalText(bubble?.description),
    logoUrl: optionalText(bubble?.logo_url),
    heroImageUrl: optionalText(bubble?.hero_image_url) || fallbackBranding.heroImage,
    primaryColor: colorText(bubble?.primary_color, "#0058be"),
    accentColor: colorText(bubble?.accent_color, "#b61722"),
    rewardTitle: primaryReward?.title ?? optionalText(bubble?.reward_title),
    rewardDescription: primaryReward?.description ?? optionalText(bubble?.reward_description),
    rewardTerms: primaryReward?.hint ?? optionalText(bubble?.reward_terms),
    backgroundStyle: textFromJson(bubble?.config ?? null, "backgroundStyle"),
    headline: textFromJson(bubble?.config ?? null, "headline"),
    subheadline: textFromJson(bubble?.config ?? null, "subheadline"),
    eventTitle: textFromJson(bubble?.config ?? null, "eventTitle"),
    eventSubtitle: textFromJson(bubble?.config ?? null, "eventSubtitle"),
    scoreMode: textFromJson(bubble?.config ?? null, "score_mode") === "api" ? "api" : "manual",
    scoreProvider: textFromJson(bubble?.config ?? null, "score_provider"),
    externalMatchId: textFromJson(bubble?.config ?? null, "external_match_id"),
    actionBadge: textFromJson(bubble?.config ?? null, "actionBadge"),
    actionButtonText: textFromJson(bubble?.config ?? null, "actionButtonText"),
    actionHint: textFromJson(bubble?.config ?? null, "actionHint"),
    homeTeamName: textFromJson(bubble?.config ?? null, "homeTeamName"),
    awayTeamName: textFromJson(bubble?.config ?? null, "awayTeamName"),
    homeScore: textFromJson(bubble?.config ?? null, "homeScore"),
    awayScore: textFromJson(bubble?.config ?? null, "awayScore"),
    scoreText: textFromJson(bubble?.config ?? null, "scoreText"),
    pollQuestion: textFromJson(bubble?.config ?? null, "pollQuestion"),
    pollOptions: pollOptionsFromJson(bubble?.config ?? null),
    pollHint: textFromJson(bubble?.config ?? null, "pollHint"),
    rewardLinked: booleanFromJson(bubble?.config ?? null, "rewardLinked", false),
    communityTitle: textFromJson(bubble?.config ?? null, "communityTitle"),
    communitySubtitle: textFromJson(bubble?.config ?? null, "communitySubtitle"),
    communityPlaceholder: textFromJson(bubble?.config ?? null, "communityPlaceholder"),
    communityRules: textFromJson(bubble?.config ?? null, "communityRules"),
    challengeTitle: textFromJson(bubble?.config ?? null, "challengeTitle"),
    challengeDescription: textFromJson(bubble?.config ?? null, "challengeDescription"),
    voteTitle: textFromJson(bubble?.config ?? null, "voteTitle"),
    rewardCta: primaryReward?.buttonText ?? textFromJson(bubble?.config ?? null, "rewardCta"),
    rewardCode: primaryReward?.code ?? textFromJson(bubble?.config ?? null, "rewardCode"),
    rewards,
    sponsorName: textFromJson(bubble?.config ?? null, "sponsorName"),
    sponsorBannerUrl: textFromJson(bubble?.config ?? null, "sponsorBannerUrl"),
    sponsorText: textFromJson(bubble?.config ?? null, "sponsorText"),
    sponsorCtaText: textFromJson(bubble?.config ?? null, "sponsorCtaText"),
    sponsorCtaLink: textFromJson(bubble?.config ?? null, "sponsorCtaLink"),
    logoShape: oneOfFromJson(bubble?.config ?? null, "logoShape", "round", ["round", "rounded"] as const),
    logoFit: oneOfFromJson(bubble?.config ?? null, "logoFit", "contain", ["cover", "contain"] as const),
    logoBackground: oneOfFromJson(bubble?.config ?? null, "logoBackground", "transparent", ["transparent", "white", "dark"] as const),
    logoSize: oneOfFromJson(bubble?.config ?? null, "logoSize", "medium", ["small", "medium", "large"] as const),
    logoCropX: numberFromJson(bubble?.config ?? null, "logoCropX", 0, -50, 50),
    logoCropY: numberFromJson(bubble?.config ?? null, "logoCropY", 0, -50, 50),
    logoZoom: numberFromJson(bubble?.config ?? null, "logoZoom", 100, 80, 220),
    heroFit: oneOfFromJson(bubble?.config ?? null, "heroFit", "cover", ["cover", "contain"] as const),
    heroZoom: numberFromJson(bubble?.config ?? null, "heroZoom", 100, 100, 180),
    heroCropX: numberFromJson(bubble?.config ?? null, "heroCropX", 0, -50, 50),
    heroCropY: numberFromJson(bubble?.config ?? null, "heroCropY", 0, -50, 50),
    heroPosition: legacyHeroPosition,
    heroPositionX: oneOfFromJson(bubble?.config ?? null, "heroPositionX", heroPositionXFromLegacy(legacyHeroPosition), ["left", "center", "right"] as const),
    heroPositionY: oneOfFromJson(bubble?.config ?? null, "heroPositionY", heroPositionYFromLegacy(legacyHeroPosition), ["top", "center", "bottom"] as const),
    heroHeight: oneOfFromJson(bubble?.config ?? null, "heroHeight", "normal", ["compact", "normal", "large"] as const),
    heroOverlay: oneOfFromJson(bubble?.config ?? null, "heroOverlay", "medium", ["light", "medium", "strong"] as const),
    features: bubble ? featuresFromJson(bubble.features) : neutralFeatures,
    bubble,
  };
}

export function useBubbleConfig(slug?: string) {
  const [bubble, setBubble] = useState<BubbleRow | null>(null);
  const activeSlug = normalizeBubbleSlug(slug ?? (typeof window === "undefined" ? undefined : getBubbleSlugFromPathname(window.location.pathname)));

  useEffect(() => {
    let active = true;

    async function loadBubble() {
      try {
        const nextBubble = await getActiveBubble(activeSlug);
        if (active) setBubble(nextBubble);
      } catch (error) {
        console.error("[bubble-config] bubble load failed", error);
        if (active) setBubble(null);
      }
    }

    void loadBubble();

    return () => {
      active = false;
    };
  }, [activeSlug]);

  return useMemo(() => buildRuntimeBubbleConfig(activeSlug, bubble), [activeSlug, bubble]);
}

export function bubbleThemeStyle(config: Pick<RuntimeBubbleConfig, "primaryColor" | "accentColor">) {
  return {
    "--bubble-primary": config.primaryColor,
    "--bubble-primary-container": config.primaryColor,
    "--bubble-secondary": config.accentColor,
    "--bubble-tertiary": config.accentColor,
  } as CSSProperties;
}

export function logoFrameClasses(config: Pick<RuntimeBubbleConfig, "logoShape" | "logoBackground" | "logoSize">, inverted = false) {
  const size = config.logoSize === "large" ? "h-11 w-11" : config.logoSize === "small" ? "h-8 w-8" : "h-9 w-9";
  const shape = config.logoShape === "rounded" ? "rounded-xl" : "rounded-full";
  const background =
    config.logoBackground === "white"
      ? "border-white/80 bg-white text-primary"
      : config.logoBackground === "dark"
        ? "border-on-surface/40 bg-on-surface text-white"
        : inverted
          ? "border-white/30 bg-white/20 text-white backdrop-blur-md"
          : "border-primary/10 bg-transparent text-primary";

  return ["relative flex shrink-0 items-center justify-center overflow-hidden border", size, shape, background].join(" ");
}

export function logoImageClasses(config: Pick<RuntimeBubbleConfig, "logoFit">) {
  return ["h-full w-full object-center will-change-transform", config.logoFit === "cover" ? "object-cover" : "object-contain p-1.5"].join(" ");
}

export function logoImageStyle(config: Pick<RuntimeBubbleConfig, "logoCropX" | "logoCropY" | "logoZoom">) {
  return {
    transform: `translate(${config.logoCropX}%, ${config.logoCropY}%) scale(${config.logoZoom / 100})`,
  } as CSSProperties;
}

export function heroObjectPosition(config: Pick<RuntimeBubbleConfig, "heroPositionX" | "heroPositionY">) {
  return `${config.heroPositionX} ${config.heroPositionY}`;
}

export function heroOverlayBackground(config: Pick<RuntimeBubbleConfig, "heroOverlay">) {
  if (config.heroOverlay === "strong") return "linear-gradient(to top, rgba(20,27,43,.98) 0%, rgba(20,27,43,.68) 52%, rgba(20,27,43,.42) 100%)";
  if (config.heroOverlay === "light") return "linear-gradient(to top, rgba(20,27,43,.78) 0%, rgba(20,27,43,.32) 52%, rgba(20,27,43,.14) 100%)";
  return "linear-gradient(to top, rgba(20,27,43,.94) 0%, rgba(20,27,43,.48) 52%, rgba(20,27,43,.22) 100%)";
}

export function heroHeightClass(config: Pick<RuntimeBubbleConfig, "heroHeight">) {
  if (config.heroHeight === "large") return "min-h-[100svh]";
  if (config.heroHeight === "compact") return "min-h-[82svh]";
  return "min-h-[92svh]";
}

export function heroMediaStyle(
  config: Pick<RuntimeBubbleConfig, "heroFit" | "heroZoom" | "heroPositionX" | "heroPositionY" | "heroCropX" | "heroCropY">,
) {
  return {
    objectFit: config.heroFit,
    objectPosition: heroObjectPosition(config),
    transform: `translate(${config.heroCropX}%, ${config.heroCropY}%) scale(${config.heroZoom / 100})`,
  } as CSSProperties;
}
