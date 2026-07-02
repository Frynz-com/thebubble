import { getTemplate, getTrackingSource } from "./template-presets";
import type {
  BubbleDraft,
  BubbleInsertPayload,
  BubbleKpis,
  BubbleLaunchChecklist,
  BubbleStatus,
  BubbleStudioItem,
  BubbleTemplateId,
  CustomTrackingSource,
  FunnelStep,
  TrackingLink,
  TrackingSourceKey,
} from "./types";

export const APP_BASE_URL = "https://app.yourbubble.app";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Erstellt einen frischen Draft aus einem Template-Seed (Deep Copy). */
export function createDraftFromTemplate(templateId: BubbleTemplateId | null): BubbleDraft {
  const template = getTemplate(templateId);
  const seed = template.seed;

  return {
    templateId,
    status: "draft",
    basics: {
      name: "",
      bubbleLink: "",
      partnerName: "",
      eventDate: "",
      location: "",
      expectedVisitors: seed.basics.expectedVisitors,
    },
    branding: { ...seed.branding },
    cover: { ...seed.cover },
    home: { ...seed.home, featuredModules: [...seed.home.featuredModules] },
    liveAction: { ...seed.liveAction, options: [...seed.liveAction.options] },
    modules: { ...seed.modules },
    sponsors: seed.sponsors.map((s) => ({ ...s, placements: [...s.placements] })),
    rewards: seed.rewards.map((r) => ({ ...r, placements: [...r.placements] })),
    tracking: { sources: [...seed.tracking.sources], customSources: seed.tracking.customSources.map((c) => ({ ...c })) },
    legal: { ...seed.legal },
  };
}

export function deriveTotals(items: BubbleStudioItem[]): BubbleKpis & { activeBubbles: number; plannedBubbles: number } {
  const totals = items.reduce<BubbleKpis>(
    (acc, item) => {
      (Object.keys(acc) as (keyof BubbleKpis)[]).forEach((key) => {
        acc[key] += item.kpis[key];
      });
      return acc;
    },
    { scans: 0, landingViews: 0, liveViews: 0, participations: 0, leads: 0, rewardClaims: 0, redemptions: 0, sponsorClicks: 0 },
  );

  return {
    ...totals,
    activeBubbles: items.filter((i) => i.status === "live").length,
    plannedBubbles: items.filter((i) => i.status === "draft" || i.status === "preview").length,
  };
}

export function deriveFunnel(kpis: BubbleKpis): FunnelStep[] {
  return [
    { key: "scans", label: "Scans", value: kpis.scans },
    { key: "landingViews", label: "Landing Views", value: kpis.landingViews },
    { key: "liveViews", label: "Live Views", value: kpis.liveViews },
    { key: "participations", label: "Teilnahmen", value: kpis.participations },
    { key: "leads", label: "Leads", value: kpis.leads },
    { key: "rewardClaims", label: "Reward Claims", value: kpis.rewardClaims },
    { key: "redemptions", label: "Einlösungen", value: kpis.redemptions },
  ];
}

export function buildTrackingLinks(
  slug: string,
  sources: TrackingSourceKey[],
  customSources: CustomTrackingSource[] = [],
): TrackingLink[] {
  const safeSlug = slug || "deine-bubble";
  const base = `${APP_BASE_URL}/${safeSlug}`;
  const links: TrackingLink[] = [
    { key: "public", label: "Öffentlicher Link", purpose: "Haupteinstieg — das Titelblatt der Bubble ohne Standort-Zuordnung.", url: base },
    { key: "live", label: "Live-Link", purpose: "Direkt in die Live-Ansicht — für Screens und Moderation.", url: `${base}/live` },
  ];

  sources.forEach((key) => {
    const source = getTrackingSource(key);
    links.push({ key, label: `QR: ${source.label}`, purpose: source.purpose, url: `${base}?src=${key}` });
  });

  customSources.forEach((source) => {
    links.push({ key: source.key, label: `QR: ${source.label}`, purpose: source.purpose || "Eigener Standort.", url: `${base}?src=${source.key}` });
  });

  return links;
}

export function deriveLaunchChecklist(draft: BubbleDraft): BubbleLaunchChecklist {
  const anyCta = Boolean(draft.cover.buttonText.trim() || draft.home.buttonText.trim() || draft.liveAction.buttonText.trim());

  const items = [
    {
      key: "basics" as const,
      label: "Grunddaten vollständig",
      hint: "Name, Bubble-Link und Eventdatum sind gesetzt.",
      done: Boolean(draft.basics.name.trim() && draft.basics.bubbleLink.trim() && draft.basics.eventDate),
    },
    {
      key: "cover" as const,
      label: "Titelblatt fertig",
      hint: "Titel und Beschreibung für die erste Seite sind gesetzt.",
      done: Boolean(draft.cover.title.trim() && draft.cover.description.trim()),
    },
    {
      key: "liveAction" as const,
      label: "Live-Aktion eingerichtet",
      hint: "Frage/Aufgabe und Teilnahme-Button sind gesetzt.",
      done: Boolean(draft.liveAction.question.trim() && draft.liveAction.buttonText.trim()),
    },
    {
      key: "cta" as const,
      label: "Mindestens ein Button gesetzt",
      hint: "Besucher haben immer eine klare nächste Aktion.",
      done: anyCta,
    },
    {
      key: "tracking" as const,
      label: "Tracking-Links vorbereitet",
      hint: "Mindestens ein QR-Standort ist ausgewählt.",
      done: draft.tracking.sources.length + draft.tracking.customSources.length > 0,
    },
    {
      key: "legal" as const,
      label: "Datenschutz & Impressum geprüft",
      hint: "Links sind gesetzt und Teilnahmebedingungen sind bestätigt.",
      done: Boolean(draft.legal.privacyUrl.trim() && draft.legal.imprintUrl.trim() && draft.legal.termsChecked),
    },
    {
      key: "communitySafety" as const,
      label: "Community Safety geprüft",
      hint: "Moderations-Hinweis ist gesetzt (oder Community ist aus).",
      done: !draft.legal.communityEnabled || Boolean(draft.legal.communityNote.trim()),
    },
    {
      key: "sponsorReward" as const,
      label: "Sponsor & Reward geprüft",
      hint: "Alle Sponsoren haben Name + Button, alle Rewards einen Namen.",
      done:
        draft.sponsors.every((s) => s.name.trim() && s.ctaText.trim()) &&
        draft.rewards.every((r) => r.title.trim()),
    },
  ];

  return { items, readyToLaunch: items.every((i) => i.done) };
}

export const STATUS_LABELS: Record<BubbleStatus, string> = {
  draft: "Entwurf",
  preview: "Vorschau",
  live: "Live",
  ended: "Beendet",
};

/**
 * Mappt einen BubbleDraft auf eine echte `bubbles`-Insert-Payload.
 *
 * `features` nutzt exakt die Keys, die `buildRuntimeBubbleConfig`
 * (lib/bubble-config.ts) heute liest. `config` nutzt die bestehenden
 * Runtime-Keys; alles, was die Runtime noch nicht generisch rendert
 * (Seiten-Struktur, Multi-Sponsoren, Multi-Rewards, Placements,
 * Tracking, Rechtliches), liegt sauber unter `config.studio`.
 *
 * WICHTIG: Diese Funktion sendet nichts an Supabase. Sie ist die
 * spätere Andock-Stelle für POST /api/admin/bubbles.
 */
export function buildBubbleConfigFromDraft(draft: BubbleDraft): BubbleInsertPayload {
  const template = getTemplate(draft.templateId);
  const firstSponsor = draft.sponsors[0];
  const firstReward = draft.rewards[0];
  const isVoting = draft.liveAction.type === "voting";

  return {
    slug: draft.basics.bubbleLink || slugify(draft.basics.name),
    name: draft.basics.name,
    event_name: draft.basics.name,
    type: template.id,
    partner_name: draft.basics.partnerName,
    description: draft.cover.description,
    logo_url: draft.branding.logoUrl || null,
    hero_image_url: draft.branding.heroImageUrl || null,
    primary_color: draft.branding.primaryColor,
    accent_color: draft.branding.accentColor,
    reward_title: firstReward?.title || null,
    reward_description: firstReward?.description || null,
    reward_terms: firstReward?.redemptionHint || null,
    is_active: draft.status === "live",
    features: {
      live: Boolean(draft.modules.liveVoting || draft.modules.scorePrediction || draft.modules.giveaway),
      community: Boolean(draft.modules.community && draft.legal.communityEnabled),
      polls: Boolean(draft.modules.liveVoting),
      fanBattle: false,
      rewards: Boolean(draft.modules.benefits || draft.modules.rewardRedemption),
      peopleHere: true,
      sponsorCard: Boolean(draft.modules.sponsorCards && firstSponsor),
    },
    config: {
      headline: draft.cover.title,
      subheadline: draft.cover.description,
      actionButtonText: draft.cover.buttonText,
      challengeTitle: "Live-Aktion",
      challengeDescription: draft.liveAction.question,
      actionHint: draft.liveAction.hint,
      pollQuestion: isVoting ? draft.liveAction.question : "",
      pollOptions: isVoting ? draft.liveAction.options : [],
      voteTitle: isVoting ? draft.liveAction.question : "",
      communityRules: draft.legal.communityNote,
      rewardCta: "Vorteil sichern",
      rewardCode: firstReward?.code ?? "BUBBLE",
      rewards: draft.rewards.slice(0, 3).map((r, index) => ({
        active: index === 0,
        title: r.title,
        description: r.description,
        code: r.code,
        buttonText: "Vorteil sichern",
        hint: r.redemptionHint,
      })),
      sponsorName: firstSponsor?.name ?? "",
      sponsorText: firstSponsor?.offer ?? "",
      sponsorCtaText: firstSponsor?.ctaText ?? "",
      sponsorCtaLink: firstSponsor?.ctaLink ?? "",
      // Namespace für alles, was die Runtime noch nicht generisch rendert:
      studio: {
        templateId: draft.templateId,
        designPreset: draft.branding.presetId,
        basics: draft.basics,
        cover: draft.cover,
        home: draft.home,
        liveAction: draft.liveAction,
        modules: draft.modules,
        sponsors: draft.sponsors,
        rewards: draft.rewards,
        tracking: draft.tracking,
        legal: draft.legal,
      },
    },
  };
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-DE").format(value);
}

export function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
