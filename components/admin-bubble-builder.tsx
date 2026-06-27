"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { BarChart3, Check, Copy, ExternalLink, Gift, Handshake, ImageIcon, Lock, MessageCircle, Plus, Radio, Save, Trophy, Upload, UsersRound, Vote } from "lucide-react";
import { formatBubbleType, heroMediaStyle, heroOverlayBackground, logoFrameClasses, logoImageClasses, logoImageStyle } from "@/lib/bubble-config";
import type { HeroFit, HeroOverlay, HeroPositionX, HeroPositionY, HeroZoom, LogoBackground, LogoFit, LogoShape, LogoSize } from "@/lib/bubble-config";
import { bubblePath, isReservedBubbleSlug } from "@/lib/bubble-routing";
import { isPublicViewingPilotSlug } from "@/lib/public-viewing-pilot";
import { HuberPilotAdmin } from "@/components/huber-pilot-admin";

const featureKeys = ["live", "community", "polls", "rewards", "peopleHere", "fanBattle", "sponsorCard"] as const;
const sections = ["overview", "basics", "branding", "modules", "liveAction", "community", "rewards", "sponsor", "analytics"] as const;

type FeatureKey = (typeof featureKeys)[number];
type ConfigTextKey =
  | "headline"
  | "subheadline"
  | "eventTitle"
  | "eventSubtitle"
  | "backgroundStyle"
  | "score_mode"
  | "score_provider"
  | "external_match_id"
  | "actionBadge"
  | "actionButtonText"
  | "actionHint"
  | "homeTeamName"
  | "awayTeamName"
  | "homeScore"
  | "awayScore"
  | "scoreText"
  | "pollQuestion"
  | "pollOptions"
  | "pollHint"
  | "communityTitle"
  | "communitySubtitle"
  | "communityPlaceholder"
  | "communityRules"
  | "challengeTitle"
  | "challengeDescription"
  | "voteTitle"
  | "rewardCta"
  | "rewardCode"
  | "sponsorName"
  | "sponsorBannerUrl"
  | "sponsorText"
  | "sponsorCtaText"
  | "sponsorCtaLink"
  | "logoShape"
  | "logoFit"
  | "logoBackground"
  | "logoSize"
  | "logoCropX"
  | "logoCropY"
  | "logoZoom"
  | "heroFit"
  | "heroZoom"
  | "heroCropX"
  | "heroCropY"
  | "heroPosition"
  | "heroPositionX"
  | "heroPositionY"
  | "heroHeight"
  | "heroOverlay";
type Section = (typeof sections)[number];

type BuilderReward = {
  active: boolean;
  title: string;
  description: string;
  code: string;
  buttonText: string;
  hint: string;
};

type BuilderConfig = Record<ConfigTextKey, string> & {
  rewardLinked: boolean;
  rewards: BuilderReward[];
};

type BuilderBubble = {
  id?: string;
  name: string;
  slug: string;
  type: string;
  partner_name: string;
  description: string;
  logo_url: string;
  hero_image_url: string;
  primary_color: string;
  accent_color: string;
  reward_title: string;
  reward_description: string;
  reward_terms: string;
  features: Record<FeatureKey, boolean>;
  config: BuilderConfig;
  is_active: boolean;
};

type ApiBubble = Omit<BuilderBubble, "features" | "config"> & {
  features?: Partial<Record<FeatureKey, boolean>>;
  config?: Partial<Record<ConfigTextKey, string> & { rewardLinked: boolean; rewards: BuilderReward[] }>;
  event_name?: string;
  created_at?: string;
  updated_at?: string | null;
};

type AnalyticsSummary = {
  visitors: number;
  sessions: number;
  pageViews: number;
  pollVotes: number;
  communityPosts: number;
  rewardViews: number;
  rewardClaims: number;
  sponsorClicks: number;
  topModules: Array<{ module: string; count: number }>;
  recentEvents: Array<{ id: string; event_type: string; path: string | null; device_type: string; created_at: string }>;
};

type AssetKind = "logo" | "cover";
type LogoPreviewConfig = {
  logoShape: LogoShape;
  logoFit: LogoFit;
  logoBackground: LogoBackground;
  logoSize: LogoSize;
  logoCropX: number;
  logoCropY: number;
  logoZoom: number;
};
type HeroPreviewConfig = {
  heroFit: HeroFit;
  heroZoom: HeroZoom;
  heroCropX: number;
  heroCropY: number;
  heroPositionX: HeroPositionX;
  heroPositionY: HeroPositionY;
  heroOverlay: HeroOverlay;
};

const rewardSlots = [0, 1, 2] as const;

const defaultRewards: BuilderReward[] = rewardSlots.map((index) => ({
  active: index === 0,
  title: "",
  description: "",
  code: "",
  buttonText: "Vorteil sichern",
  hint: "",
}));

const emptyBubble: BuilderBubble = {
  name: "",
  slug: "",
  type: "public_viewing",
  partner_name: "",
  description: "",
  logo_url: "",
  hero_image_url: "",
  primary_color: "#0037d8",
  accent_color: "#16a34a",
  reward_title: "",
  reward_description: "",
  reward_terms: "",
  features: {
    live: true,
    community: true,
    polls: true,
    rewards: true,
    peopleHere: true,
    fanBattle: false,
    sponsorCard: false,
  },
  config: {
    headline: "Willkommen in deiner Bubble",
    subheadline: "Scannen, beitreten, live dabei sein.",
    eventTitle: "Live-Aktion",
    eventSubtitle: "Mach mit und sichere dir Vorteile vor Ort.",
    backgroundStyle: "",
    score_mode: "manual",
    score_provider: "",
    external_match_id: "",
    actionBadge: "Live-Aktion",
    actionButtonText: "Jetzt mitmachen",
    actionHint: "",
    homeTeamName: "Deutschland",
    awayTeamName: "Gegner",
    homeScore: "0",
    awayScore: "0",
    scoreText: "Live",
    pollQuestion: "Wie geht das Spiel aus?",
    pollOptions: "Deutschland gewinnt\nUnentschieden\nDeutschland verliert",
    pollHint: "Teilnehmer mit richtigem Tipp können vor Ort einen Vorteil erhalten.",
    rewardLinked: false,
    communityTitle: "Community",
    communitySubtitle: "Schreib kurz etwas in die Bubble.",
    communityPlaceholder: "Dein Kommentar zum Spiel, zur Stimmung oder zum Abend ...",
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
    rewards: defaultRewards,
  },
  is_active: true,
};

const sectionLabels: Record<Section, string> = {
  overview: "Übersicht",
  basics: "Basics",
  branding: "Branding",
  modules: "Module",
  liveAction: "Live-Aktion",
  community: "Community",
  rewards: "Vorteile",
  sponsor: "Sponsor",
  analytics: "Analytics",
};

const featureLabels: Record<FeatureKey, string> = {
  live: "Live-Aktion",
  community: "Community",
  polls: "Abstimmung",
  rewards: "Vorteile",
  peopleHere: "Personen vor Ort",
  fanBattle: "Fan Battle",
  sponsorCard: "Sponsor",
};

const featureCards: Record<FeatureKey, { title: string; body: string; icon: LucideIcon }> = {
  live: {
    title: "Live-Aktion",
    body: "Challenge, Tipp oder Aktion prominent anzeigen.",
    icon: Radio,
  },
  community: {
    title: "Community",
    body: "Besucher können kurze Beiträge posten.",
    icon: MessageCircle,
  },
  rewards: {
    title: "Vorteile",
    body: "Rabatte, Codes oder Gewinne anzeigen.",
    icon: Gift,
  },
  sponsorCard: {
    title: "Sponsor",
    body: "Sponsor-Kachel in der Bubble anzeigen.",
    icon: Handshake,
  },
  polls: {
    title: "Abstimmung",
    body: "Einfache Frage mit Antwortoptionen.",
    icon: Vote,
  },
  peopleHere: {
    title: "Personen vor Ort",
    body: "Zeigt Aktivität und Besucher vor Ort.",
    icon: UsersRound,
  },
  fanBattle: {
    title: "Fan Battle",
    body: "Optionales Team-/Fan-Duell.",
    icon: Trophy,
  },
};

const bubbleQuickLinks = [
  { label: "Öffnen", path: "" },
  { label: "Live", path: "/live" },
  { label: "Community", path: "/community" },
  { label: "Vorteile", path: "/benefits" },
] as const;

const localPublicBaseUrl = "http://127.0.0.1:3001";
const productionPublicBaseUrl = "https://app.yourbubble.app";
const huberArenaBranding = {
  logo: "/images/huber-arena-logo.webp",
  cover: "/images/huber-arena-cover.webp",
};

function configuredPublicBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/g, "");
}

function onlinePublicBaseUrl() {
  return configuredPublicBaseUrl() || productionPublicBaseUrl;
}

function publicUrl(slug: string, path = "", baseUrl = configuredPublicBaseUrl() || localPublicBaseUrl) {
  return `${baseUrl}${bubblePath(slug, path)}`;
}

function normalizeApiBubble(bubble: ApiBubble): BuilderBubble {
  const rewards = normalizeRewards(bubble.config?.rewards, bubble);
  const isHuberArena = bubble.slug === "huber-arena";
  const huberDefaults = isHuberArena
    ? {
        heroFit: "cover",
        heroPositionX: "center",
        heroPositionY: "top",
        logoFit: "contain",
        logoBackground: "transparent",
        logoSize: "large",
      }
    : {};

  return {
    ...emptyBubble,
    ...bubble,
    logo_url: isHuberArena ? huberArenaBranding.logo : bubble.logo_url || emptyBubble.logo_url,
    hero_image_url: isHuberArena ? huberArenaBranding.cover : bubble.hero_image_url || emptyBubble.hero_image_url,
    type: bubble.type || bubble.event_name || emptyBubble.type,
    features: {
      ...emptyBubble.features,
      ...bubble.features,
    },
    config: {
      ...emptyBubble.config,
      ...huberDefaults,
      ...bubble.config,
      rewardLinked: Boolean(bubble.config?.rewardLinked),
      rewards,
    },
  };
}

function createEmptyBubble(): BuilderBubble {
  return {
    ...emptyBubble,
    features: { ...emptyBubble.features },
    config: { ...emptyBubble.config, rewards: defaultRewards.map((reward) => ({ ...reward })) },
  };
}

function normalizeReward(value: unknown, index: number): BuilderReward {
  const source = value && typeof value === "object" && !Array.isArray(value) ? (value as Partial<BuilderReward>) : {};
  const fallback = defaultRewards[index] ?? defaultRewards[0];

  return {
    active: typeof source.active === "boolean" ? source.active : fallback.active,
    title: typeof source.title === "string" ? source.title : "",
    description: typeof source.description === "string" ? source.description : "",
    code: typeof source.code === "string" ? source.code : "",
    buttonText: typeof source.buttonText === "string" && source.buttonText.trim() ? source.buttonText : fallback.buttonText,
    hint: typeof source.hint === "string" ? source.hint : "",
  };
}

function normalizeRewards(
  value: unknown,
  bubble?: {
    reward_title?: string | null;
    reward_description?: string | null;
    reward_terms?: string | null;
    config?: Partial<Record<ConfigTextKey, string>>;
  },
): BuilderReward[] {
  const source = Array.isArray(value) ? value : [];
  const legacyReward =
    bubble?.reward_title || bubble?.reward_description || bubble?.reward_terms || bubble?.config?.rewardCode || bubble?.config?.rewardCta
      ? {
          active: true,
          title: bubble.reward_title ?? "",
          description: bubble.reward_description ?? "",
          code: bubble.config?.rewardCode ?? "",
          buttonText: bubble.config?.rewardCta || "Einlösen",
          hint: bubble.reward_terms ?? "",
        }
      : null;
  const merged = source.length > 0 ? source : legacyReward ? [legacyReward] : [];

  return rewardSlots.map((index) => normalizeReward(merged[index], index));
}

function normalizeSlugText(value: string, trimEdges: boolean) {
  const slug = value
    .trimStart()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 64);

  return trimEdges ? slug.replace(/^-+|-+$/g, "") : slug.replace(/^-+/g, "");
}

function toSlug(value: string) {
  return normalizeSlugText(value, true);
}

function toSlugDraft(value: string) {
  return normalizeSlugText(value, false);
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

function normalizeHexDraft(value: string) {
  const clean = value.trim().replace(/[^0-9a-fA-F#]/g, "");
  if (!clean) return "";
  return clean.startsWith("#") ? clean.slice(0, 7) : `#${clean.slice(0, 6)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function numberConfig(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
}

async function apiRequest(method: "GET" | "POST", adminSecret: string, body?: BuilderBubble) {
  const response = await fetch("/api/admin/bubbles", {
    method,
    headers: {
      "content-type": "application/json",
      "x-admin-secret": adminSecret,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await response.json()) as { bubbles?: ApiBubble[]; bubble?: ApiBubble; error?: string; details?: string; hint?: string };
  if (!response.ok) {
    throw new Error([json.error, json.details, json.hint].filter(Boolean).join(" | ") || "Admin-Anfrage fehlgeschlagen.");
  }
  return json;
}

async function analyticsRequest(adminSecret: string, bubbleId?: string) {
  if (!bubbleId) return { summary: null, message: "" };
  const response = await fetch(`/api/admin/analytics?bubbleId=${encodeURIComponent(bubbleId)}`, {
    headers: {
      "x-admin-secret": adminSecret,
    },
  });
  const json = (await response.json()) as { summary?: AnalyticsSummary; message?: string; error?: string };
  if (!response.ok) throw new Error(json.error || "Analytics konnten nicht geladen werden.");
  return { summary: json.summary ?? null, message: json.message ?? "" };
}

async function uploadAssetRequest(adminSecret: string, slug: string, kind: AssetKind, file: File) {
  const data = new FormData();
  data.set("slug", slug);
  data.set("kind", kind);
  data.set("file", file);

  const response = await fetch("/api/admin/bubbles/assets", {
    method: "POST",
    headers: {
      "x-admin-secret": adminSecret,
    },
    body: data,
  });
  const json = (await response.json()) as { publicUrl?: string; path?: string; error?: string; details?: string; hint?: string };
  if (!response.ok || !json.publicUrl) {
    throw new Error([json.error, json.details, json.hint].filter(Boolean).join(" | ") || "Bild konnte nicht hochgeladen werden.");
  }
  return json;
}

export function AdminBubbleBuilder() {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [bubbles, setBubbles] = useState<BuilderBubble[]>([]);
  const [form, setForm] = useState<BuilderBubble>(() => createEmptyBubble());
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<AssetKind | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [analyticsMessage, setAnalyticsMessage] = useState("");

  const sortedBubbles = useMemo(() => [...bubbles].sort((a, b) => a.name.localeCompare(b.name)), [bubbles]);
  const activeModules = featureKeys.filter((key) => form.features[key]);
  const normalizedFormSlug = toSlug(form.slug || form.name);
  const duplicateSlugBubble = useMemo(
    () => sortedBubbles.find((bubble) => bubble.slug === normalizedFormSlug && bubble.id !== form.id),
    [form.id, normalizedFormSlug, sortedBubbles],
  );
  const reservedSlugBlocked = Boolean(normalizedFormSlug && isReservedBubbleSlug(normalizedFormSlug) && !sortedBubbles.some((bubble) => bubble.slug === normalizedFormSlug && bubble.id === form.id));
  const colorsAreValid = (!form.primary_color || isHexColor(form.primary_color)) && (!form.accent_color || isHexColor(form.accent_color));
  const canSave = Boolean(form.name.trim() && normalizedFormSlug && form.type.trim() && !duplicateSlugBubble && !reservedSlugBlocked && colorsAreValid);

  useEffect(() => {
    const storedSecret = window.sessionStorage.getItem("thebubble_admin_secret") ?? "";
    if (!storedSecret) return;
    setSecret(storedSecret);

    async function restoreSession() {
      setBusy(true);
      try {
        const json = await apiRequest("GET", storedSecret);
        setBubbles((json.bubbles ?? []).map(normalizeApiBubble));
        setUnlocked(true);
      } catch {
        setUnlocked(false);
        window.sessionStorage.removeItem("thebubble_admin_secret");
      } finally {
        setBusy(false);
      }
    }

    void restoreSession();
  }, []);

  useEffect(() => {
    if (!unlocked || activeSection !== "analytics") return;
    let active = true;

    async function loadAnalytics() {
      setAnalyticsMessage("");
      try {
        const result = await analyticsRequest(secret, form.id);
        if (active) {
          setAnalytics(result.summary);
          setAnalyticsMessage(result.message);
        }
      } catch (error) {
        if (active) setAnalyticsMessage(error instanceof Error ? error.message : "Analytics konnten nicht geladen werden.");
      }
    }

    void loadAnalytics();

    return () => {
      active = false;
    };
  }, [activeSection, form.id, secret, unlocked]);

  async function loadBubbles(adminSecret = secret, silent = false) {
    setBusy(true);
    if (!silent) setMessage("");
    try {
      const json = await apiRequest("GET", adminSecret);
      setBubbles((json.bubbles ?? []).map(normalizeApiBubble));
      setUnlocked(true);
      window.sessionStorage.setItem("thebubble_admin_secret", adminSecret);
      if (!silent) setMessage("Admin entsperrt.");
    } catch (error) {
      setUnlocked(false);
      if (!silent) setMessage(error instanceof Error ? error.message : "Admin konnte nicht entsperrt werden.");
    } finally {
      setBusy(false);
    }
  }

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadBubbles(secret);
  }

  function updateField(key: keyof Omit<BuilderBubble, "features" | "config">, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateName(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: current.id || slugEdited ? current.slug : toSlugDraft(value),
    }));
  }

  function updateSlug(value: string) {
    setSlugEdited(true);
    updateField("slug", toSlugDraft(value));
  }

  function updateColor(key: "primary_color" | "accent_color", value: string) {
    updateField(key, normalizeHexDraft(value));
  }

  function updateFeature(key: FeatureKey, value: boolean) {
    setForm((current) => ({ ...current, features: { ...current.features, [key]: value } }));
  }

  function updateConfig(key: ConfigTextKey, value: string) {
    setForm((current) => ({ ...current, config: { ...current.config, [key]: value } }));
  }

  function updateRewardLinked(value: boolean) {
    setForm((current) => ({ ...current, config: { ...current.config, rewardLinked: value } }));
  }

  function updateReward(index: number, key: keyof BuilderReward, value: string | boolean) {
    setForm((current) => {
      const rewards = normalizeRewards(current.config.rewards).map((reward, rewardIndex) => (rewardIndex === index ? { ...reward, [key]: value } : reward));
      return { ...current, config: { ...current.config, rewards } };
    });
  }

  function selectBubble(bubble: BuilderBubble, section: Section = "basics") {
    setForm(normalizeApiBubble(bubble));
    setSlugEdited(true);
    setActiveSection(section);
    setMessage(`${bubble.name} geladen.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(createEmptyBubble());
    setSlugEdited(false);
    setAnalytics(null);
    setActiveSection("basics");
    setMessage("Neue Bubble vorbereitet.");
  }

  async function saveBubble(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const slug = normalizedFormSlug;
      if (!form.name.trim()) throw new Error("Name ist erforderlich.");
      if (!slug) throw new Error("Slug ist erforderlich.");
      if (!form.type.trim()) throw new Error("Typ ist erforderlich.");
      if (duplicateSlugBubble) throw new Error(`Der Slug "${slug}" wird bereits von "${duplicateSlugBubble.name}" verwendet.`);
      if (reservedSlugBlocked) throw new Error(`Der Slug "${slug}" ist für Plattform-Routen reserviert.`);
      if (!colorsAreValid) throw new Error("Bitte nutze gültige Hex-Farben, z. B. #0057ff.");

      const wasNew = !form.id;
      const payload = { ...form, slug };
      const json = await apiRequest("POST", secret, payload);
      const saved = json.bubble ? normalizeApiBubble(json.bubble) : payload;
      setForm(saved);
      setSlugEdited(true);
      setBubbles((current) => {
        const others = current.filter((bubble) => bubble.id !== saved.id && bubble.slug !== saved.slug);
        return [saved, ...others];
      });
      if (wasNew) setActiveSection("basics");
      setMessage(`${saved.name} wurde gespeichert.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bubble konnte nicht gespeichert werden.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadBubbleAsset(kind: AssetKind, file: File) {
    setMessage("");
    const slug = normalizedFormSlug;
    if (!form.id) {
      setMessage("Bitte speichere die Bubble zuerst, bevor du Bilder hochlädst.");
      return;
    }
    if (!slug) {
      setMessage("Bitte setze zuerst einen gültigen Slug.");
      return;
    }

    setUploadingAsset(kind);
    try {
      const result = await uploadAssetRequest(secret, slug, kind, file);
      const nextUrl = result.publicUrl ?? "";
      setForm((current) => ({
        ...current,
        logo_url: kind === "logo" ? nextUrl : current.logo_url,
        hero_image_url: kind === "cover" ? nextUrl : current.hero_image_url,
      }));
      setMessage(`${kind === "logo" ? "Logo" : "Cover"} wurde hochgeladen. Bitte Bubble speichern, damit die URL dauerhaft gesetzt ist.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bild konnte nicht hochgeladen werden.");
    } finally {
      setUploadingAsset(null);
    }
  }

  if (!unlocked) {
    return (
      <main className="min-h-svh bg-surface px-4 py-8">
        <section className="mx-auto max-w-md rounded-[1.5rem] bg-white p-5 shadow-ambient">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-on-primary">
              <Lock size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-on-surface">Bubble Control Center</h1>
              <p className="text-sm font-semibold text-on-surface-variant">Interner Zugriff</p>
            </div>
          </div>
          <form className="space-y-4" onSubmit={unlock}>
            <TextField label="Admin-Code" value={secret} onChange={setSecret} type="password" placeholder="Admin-Code" />
            <button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-on-primary disabled:opacity-60" type="submit" disabled={busy}>
              <Check size={18} />
              {busy ? "Prüfe ..." : "Entsperren"}
            </button>
          </form>
          {message ? <p className="mt-4 rounded-[1rem] bg-surface-container-low p-3 text-sm font-semibold text-on-surface-variant">{message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-surface px-4 py-5">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-primary">The Bubble</p>
            <h1 className="text-3xl font-black tracking-normal text-on-surface">Bubble Control Center</h1>
            <p className="mt-1 text-sm font-semibold text-on-surface-variant">Pilot-Bubbles in wenigen Minuten konfigurieren.</p>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-outline-variant px-4 text-sm font-bold text-primary" type="button" onClick={resetForm}>
              <Plus size={17} />
              Neue Bubble
            </button>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-on-primary shadow-active disabled:opacity-60" type="button" onClick={() => void saveBubble()} disabled={busy || activeSection === "overview" || activeSection === "analytics" || !canSave}>
              <Save size={17} />
              {busy ? "Speichere ..." : "Speichern"}
            </button>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
          <aside className="rounded-[1.5rem] bg-white p-3 shadow-ambient lg:sticky lg:top-5 lg:self-start">
            <nav className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
              {sections.map((section) => (
                <button
                  key={section}
                  className={[
                    "min-h-11 shrink-0 rounded-full px-4 text-sm font-bold transition lg:flex lg:w-full lg:items-center lg:rounded-[1rem]",
                    activeSection === section ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface",
                  ].join(" ")}
                  type="button"
                  onClick={() => setActiveSection(section)}
                >
                  {sectionLabels[section]}
                </button>
              ))}
            </nav>
          </aside>

          <section className="min-w-0">
            {message ? <p className="mb-4 rounded-[1rem] bg-white p-3 text-sm font-semibold text-on-surface-variant shadow-ambient">{message}</p> : null}
            {activeSection === "overview" ? (
              <Overview bubbles={sortedBubbles} onEdit={selectBubble} onNew={resetForm} />
            ) : activeSection === "analytics" ? (
              <AnalyticsPanel summary={analytics} message={analyticsMessage} bubble={form} adminSecret={secret} />
            ) : (
              <form className="rounded-[1.5rem] bg-white p-5 shadow-ambient" onSubmit={saveBubble}>
                <SectionHeading title={sectionLabels[activeSection]} subtitle={form.name ? `${form.name} · /${normalizedFormSlug || "slug-fehlt"}` : "Neue Bubble"} />
                {duplicateSlugBubble ? <p className="mb-4 rounded-[1rem] bg-red-50 p-3 text-sm font-bold text-red-700">Slug ist bereits vergeben: {duplicateSlugBubble.name}</p> : null}
                {reservedSlugBlocked ? <p className="mb-4 rounded-[1rem] bg-red-50 p-3 text-sm font-bold text-red-700">Dieser Slug ist für Plattform-Routen reserviert.</p> : null}
                {activeSection === "basics" ? (
                  <BasicsFields form={form} normalizedSlug={normalizedFormSlug} updateField={updateField} updateName={updateName} updateSlug={updateSlug} />
                ) : activeSection === "branding" ? (
                  <BrandingFields
                    form={form}
                    canUpload={Boolean(form.id && normalizedFormSlug)}
                    uploadingAsset={uploadingAsset}
                    updateField={updateField}
                    updateColor={updateColor}
                    updateConfig={updateConfig}
                    onUploadAsset={uploadBubbleAsset}
                  />
                ) : activeSection === "modules" ? (
                  <ModuleFields form={form} updateFeature={updateFeature} activeModules={activeModules} />
                ) : activeSection === "liveAction" ? (
                  <LiveFields form={form} updateConfig={updateConfig} updateFeature={updateFeature} updateRewardLinked={updateRewardLinked} />
                ) : activeSection === "community" ? (
                  <CommunityFields form={form} updateConfig={updateConfig} updateFeature={updateFeature} />
                ) : activeSection === "rewards" ? (
                  <RewardFields form={form} updateReward={updateReward} updateFeature={updateFeature} />
                ) : activeSection === "sponsor" ? (
                  <SponsorFields form={form} updateConfig={updateConfig} updateFeature={updateFeature} />
                ) : null}
                <button className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-on-primary shadow-active disabled:opacity-60" type="submit" disabled={busy || !canSave}>
                  <Save size={18} />
                  {busy ? "Speichere ..." : "Bubble speichern"}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Overview({ bubbles, onEdit, onNew }: { bubbles: BuilderBubble[]; onEdit: (bubble: BuilderBubble, section?: Section) => void; onNew: () => void }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-5 shadow-ambient">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SectionHeading title="Übersicht" subtitle={`${bubbles.length} Bubbles angelegt`} />
        <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-on-primary" type="button" onClick={onNew}>
          <Plus size={17} />
          Neue Bubble
        </button>
      </div>
      <div className="space-y-3">
        {bubbles.map((bubble) => (
          <article key={bubble.id ?? bubble.slug} className="rounded-[1.25rem] border border-outline-variant/35 p-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex min-w-0 gap-4">
                <div
                  className="h-14 w-14 shrink-0 rounded-[1rem] border border-outline-variant/35 bg-surface bg-cover bg-center"
                  style={{
                    backgroundColor: bubble.primary_color || undefined,
                    backgroundImage: bubble.logo_url ? `url("${bubble.logo_url.replace(/"/g, "%22")}")` : undefined,
                  }}
                />
                <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-on-surface">{bubble.name || "Unbenannte Bubble"}</h2>
                  <Badge tone={bubble.is_active ? "good" : "muted"}>{bubble.is_active ? "aktiv" : "inaktiv"}</Badge>
                </div>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-[0.12em] text-outline">Slug</dt>
                    <dd className="mt-1 font-semibold text-on-surface">/{bubble.slug}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-[0.12em] text-outline">Typ</dt>
                    <dd className="mt-1 font-semibold text-on-surface">{formatBubbleType(bubble.type || "custom")}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-[0.12em] text-outline">Module</dt>
                    <dd className="mt-1 font-semibold text-on-surface">{featureKeys.filter((key) => bubble.features[key]).length} aktiv</dd>
                  </div>
                </dl>
                <p className="mt-3 truncate rounded-full bg-surface px-3 py-2 text-xs font-bold text-on-surface-variant">
                  Online: {publicUrl(bubble.slug, "", onlinePublicBaseUrl())}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {bubble.primary_color ? <Badge>{bubble.primary_color}</Badge> : null}
                  {bubble.accent_color ? <Badge>{bubble.accent_color}</Badge> : null}
                  {featureKeys.filter((key) => bubble.features[key]).map((key) => (
                    <Badge key={key}>{featureLabels[key]}</Badge>
                  ))}
                  {featureKeys.every((key) => !bubble.features[key]) ? <Badge tone="muted">keine Module</Badge> : null}
                </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 xl:items-end">
                <div className="flex flex-wrap gap-2">
                  <button className="min-h-10 rounded-full bg-primary px-4 text-sm font-bold text-on-primary" type="button" onClick={() => onEdit(bubble)}>
                    Bearbeiten
                  </button>
                  <Link className="inline-flex min-h-10 items-center gap-1 rounded-full border-2 border-outline-variant px-4 text-sm font-bold text-primary" href={bubblePath(bubble.slug)} target="_blank">
                    Öffnen
                    <ExternalLink size={14} />
                  </Link>
                </div>
                <div className="flex flex-wrap gap-1.5 xl:justify-end">
                  {bubbleQuickLinks.map((link) => (
                    <Link
                      key={link.label}
                      className="inline-flex min-h-8 items-center gap-1 rounded-full bg-surface px-3 text-xs font-bold text-on-surface-variant"
                      href={bubblePath(bubble.slug, link.path)}
                      target="_blank"
                    >
                      {link.label}
                      <ExternalLink size={12} />
                    </Link>
                  ))}
                  <Link className="inline-flex min-h-8 items-center gap-1 rounded-full bg-surface px-3 text-xs font-bold text-outline" href={`/b/${bubble.slug}`} target="_blank">
                    Legacy /b
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
        {bubbles.length === 0 ? <p className="rounded-[1rem] bg-surface p-4 text-sm font-semibold text-on-surface-variant">Noch keine Bubbles geladen.</p> : null}
      </div>
    </div>
  );
}

function BasicsFields({
  form,
  normalizedSlug,
  updateField,
  updateName,
  updateSlug,
}: {
  form: BuilderBubble;
  normalizedSlug: string;
  updateField: (key: keyof Omit<BuilderBubble, "features" | "config">, value: string | boolean) => void;
  updateName: (value: string) => void;
  updateSlug: (value: string) => void;
}) {
  const slug = normalizedSlug || toSlug(form.name) || "slug";
  const onlineBaseUrl = onlinePublicBaseUrl();
  const localLink = publicUrl(slug, "", localPublicBaseUrl);
  const onlineLink = publicUrl(slug, "", onlineBaseUrl);
  const liveLink = publicUrl(slug, "/live", onlineBaseUrl);
  const communityLink = publicUrl(slug, "/community", onlineBaseUrl);
  const benefitsLink = publicUrl(slug, "/benefits", onlineBaseUrl);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField label="Name" value={form.name} onChange={updateName} required />
      <TextField label="Slug" value={form.slug} onChange={updateSlug} required placeholder="huber-arena" />
      <SelectField label="Event-/Bubble-Typ" value={form.type} onChange={(value) => updateField("type", value)} required options={["public_viewing", "sport_club", "bar", "festival", "auto_event", "custom"]} />
      <TextField label="Partner Name" value={form.partner_name} onChange={(value) => updateField("partner_name", value)} />
      <TextArea className="md:col-span-2" label="Beschreibung" value={form.description} onChange={(value) => updateField("description", value)} />
      <CheckboxField label="Status aktiv" checked={form.is_active} onChange={(value) => updateField("is_active", value)} />
      <section className="rounded-[1.5rem] bg-surface p-4 md:col-span-2">
        <p className="text-sm font-black text-on-surface">Öffentlicher Link</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <LinkBox label="Lokal" value={localLink} href={bubblePath(slug)} />
          <LinkBox label="Online" value={onlineLink} href={onlineLink} external />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <CopyLinkButton label="Online-Link kopieren" value={onlineLink} />
          <CopyLinkButton label="Live-Link kopieren" value={liveLink} />
          <CopyLinkButton label="Community-Link kopieren" value={communityLink} />
          <CopyLinkButton label="Vorteile-Link kopieren" value={benefitsLink} />
        </div>
        <p className="mt-3 text-xs font-semibold text-outline">Canonical: /{slug} · Legacy bleibt unter /b/{slug} erreichbar.</p>
      </section>
    </div>
  );
}

function BrandingFields({
  form,
  canUpload,
  uploadingAsset,
  updateField,
  updateColor,
  updateConfig,
  onUploadAsset,
}: {
  form: BuilderBubble;
  canUpload: boolean;
  uploadingAsset: AssetKind | null;
  updateField: (key: keyof Omit<BuilderBubble, "features" | "config">, value: string | boolean) => void;
  updateColor: (key: "primary_color" | "accent_color", value: string) => void;
  updateConfig: (key: ConfigTextKey, value: string) => void;
  onUploadAsset: (kind: AssetKind, file: File) => Promise<void>;
}) {
  const [showLogoEditor, setShowLogoEditor] = useState(false);
  const [showHeroEditor, setShowHeroEditor] = useState(false);
  const primaryValid = !form.primary_color || isHexColor(form.primary_color);
  const accentValid = !form.accent_color || isHexColor(form.accent_color);
  const previewPrimary = primaryValid && form.primary_color ? form.primary_color : "#0037d8";
  const previewAccent = accentValid && form.accent_color ? form.accent_color : "#16a34a";
  const logoShape: LogoShape = form.config.logoShape === "rounded" ? "rounded" : "round";
  const logoFit: LogoFit = form.config.logoFit === "cover" ? "cover" : "contain";
  const logoBackground: LogoBackground = form.config.logoBackground === "white" || form.config.logoBackground === "dark" ? form.config.logoBackground : "transparent";
  const logoSize: LogoSize = form.config.logoSize === "small" || form.config.logoSize === "large" ? form.config.logoSize : "medium";
  const heroFit: HeroFit = form.config.heroFit === "contain" ? "contain" : "cover";
  const heroZoom: HeroZoom = numberConfig(form.config.heroZoom, 100, 100, 180);
  const heroPositionX: HeroPositionX = form.config.heroPositionX === "left" || form.config.heroPositionX === "right" ? form.config.heroPositionX : "center";
  const heroPositionY: HeroPositionY = form.config.heroPositionY === "top" || form.config.heroPositionY === "bottom" ? form.config.heroPositionY : "center";
  const heroOverlay: HeroOverlay = form.config.heroOverlay === "light" || form.config.heroOverlay === "strong" ? form.config.heroOverlay : "medium";
  const logoCropX = numberConfig(form.config.logoCropX, 0, -50, 50);
  const logoCropY = numberConfig(form.config.logoCropY, 0, -50, 50);
  const logoZoom = numberConfig(form.config.logoZoom, 100, 80, 220);
  const heroCropX = numberConfig(form.config.heroCropX, 0, -50, 50);
  const heroCropY = numberConfig(form.config.heroCropY, 0, -50, 50);
  const logoPreviewConfig = {
    logoShape,
    logoFit,
    logoBackground,
    logoSize,
    logoCropX,
    logoCropY,
    logoZoom,
  };
  const heroPreviewConfig = {
    heroFit,
    heroZoom,
    heroCropX,
    heroCropY,
    heroPositionX,
    heroPositionY,
    heroOverlay,
  };
  const heroPreviewHeight = "aspect-[9/16] min-h-0";

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
      <div className="space-y-5">
        <section className="rounded-[1.5rem] bg-surface p-4">
          <SectionHeading title="Farben" subtitle="Buttons, Highlights und aktive Navigation." />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ColorField label="Primärfarbe" value={form.primary_color} valid={primaryValid} onChange={(value) => updateColor("primary_color", value)} />
            <ColorField label="Akzentfarbe" value={form.accent_color} valid={accentValid} onChange={(value) => updateColor("accent_color", value)} />
          </div>
        </section>

        <section className="rounded-[1.5rem] bg-surface p-4">
          <SectionHeading title="Logo" subtitle="Schnell hochladen und im Header ausrichten." />
          <div className="mt-4 grid gap-4 lg:grid-cols-[170px_1fr]">
            <LogoPreviewBox imageUrl={form.logo_url} config={logoPreviewConfig} />
            <div className="space-y-4">
              <AssetField
                label="Logo"
                value={form.logo_url}
                canUpload={canUpload}
                uploading={uploadingAsset === "logo"}
                kind="logo"
                compact
                onUrlChange={(value) => updateField("logo_url", value)}
                onUploadAsset={onUploadAsset}
              />
              <ChoiceGroup
                label="Logo anzeigen"
                value={logoFit}
                options={[
                  ["contain", "vollständig anzeigen"],
                  ["cover", "füllend anzeigen"],
                ]}
                onChange={(value) => updateConfig("logoFit", value)}
              />
              <ChoiceGroup
                label="Hintergrund"
                value={logoBackground}
                options={[
                  ["transparent", "transparent"],
                  ["white", "hell"],
                  ["dark", "dunkel"],
                ]}
                onChange={(value) => updateConfig("logoBackground", value)}
              />
              <button className="min-h-11 rounded-full border-2 border-outline-variant px-4 text-sm font-bold text-primary disabled:opacity-50" type="button" disabled={!form.logo_url} onClick={() => setShowLogoEditor((value) => !value)}>
                {showLogoEditor ? "Logo-Anpassung schließen" : "Logo anpassen"}
              </button>
            </div>
          </div>
          {showLogoEditor ? (
            <LogoCropEditor
              imageUrl={form.logo_url}
              config={logoPreviewConfig}
              updateConfig={updateConfig}
              onApply={() => setShowLogoEditor(false)}
            />
          ) : null}
        </section>

        <section className="rounded-[1.5rem] bg-surface p-4">
          <SectionHeading title="Cover/Titelbild" subtitle="Ausschnitt per Drag verschieben und Zoom einstellen." />
          <p className="mt-3 rounded-[1rem] bg-white px-3 py-2 text-xs font-bold leading-5 text-on-surface-variant">
            Für Handy optimiert - Hochformat empfohlen. Ideal: 1080x1920. Wichtige Inhalte mittig platzieren.
          </p>
          <div className="mt-4 space-y-4">
            <HeroPreviewFrame imageUrl={form.hero_image_url} config={heroPreviewConfig} heightClass="mx-auto aspect-[9/16] min-h-0 w-full max-w-[320px]" fallbackFrom={previewPrimary} fallbackTo={previewAccent} />
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <AssetField
                label="Cover/Banner"
                value={form.hero_image_url}
                canUpload={canUpload}
                uploading={uploadingAsset === "cover"}
                kind="cover"
                compact
                onUrlChange={(value) => updateField("hero_image_url", value)}
                onUploadAsset={onUploadAsset}
              />
              <button className="min-h-11 rounded-full border-2 border-outline-variant px-4 text-sm font-bold text-primary disabled:opacity-50" type="button" disabled={!form.hero_image_url} onClick={() => setShowHeroEditor((value) => !value)}>
                {showHeroEditor ? "Titelbild-Anpassung schließen" : "Titelbild anpassen"}
              </button>
            </div>
            <ChoiceGroup
              label="Hero-Höhe"
              value={form.config.heroHeight === "large" ? "large" : "normal"}
              options={[
                ["normal", "normal"],
                ["large", "groß"],
              ]}
              onChange={(value) => updateConfig("heroHeight", value)}
            />
            {showHeroEditor ? (
              <HeroCropEditor
                imageUrl={form.hero_image_url}
                config={heroPreviewConfig}
                fallbackFrom={previewPrimary}
                fallbackTo={previewAccent}
                updateConfig={updateConfig}
                onApply={() => setShowHeroEditor(false)}
              />
            ) : null}
          </div>
        </section>

        <details className="rounded-[1.5rem] bg-surface p-4">
          <summary className="cursor-pointer text-sm font-black text-on-surface">Erweiterte Einstellungen</summary>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SelectField label="Logo-Darstellung" value={logoShape} onChange={(value) => updateConfig("logoShape", value)} options={["round", "rounded"]} />
            <SelectField label="Logo-Größe" value={logoSize} onChange={(value) => updateConfig("logoSize", value)} options={["small", "medium", "large"]} />
            <SelectField label="Cover-Fit" value={heroFit} onChange={(value) => updateConfig("heroFit", value)} options={["cover", "contain"]} />
            <SelectField label="Overlay-Stärke" value={heroOverlay} onChange={(value) => updateConfig("heroOverlay", value)} options={["light", "medium", "strong"]} />
            <TextField className="md:col-span-2" label="Background Style / Gradient" value={form.config.backgroundStyle} onChange={(value) => updateConfig("backgroundStyle", value)} placeholder="optional" />
          </div>
        </details>
      </div>
      <div className="rounded-[2rem] bg-surface p-4 xl:sticky xl:top-5 xl:self-start">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-outline">Mobile Branding Preview</p>
        <div className="mx-auto max-w-[390px] overflow-hidden rounded-[2.4rem] border-[10px] border-on-surface bg-white shadow-active">
          <p className="bg-surface px-5 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-outline">In-Bubble Header</p>
          <div className="relative flex h-20 items-center justify-center px-5">
            {form.logo_url ? (
              <div className="flex min-w-0 max-w-[calc(100%-3.75rem)] justify-center rounded-[1.1rem] bg-white/95 px-2.5 py-1.5 shadow-[0_8px_22px_rgba(20,27,43,.08)] ring-1 ring-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.logo_url} alt={form.partner_name || form.name || "Bubble Logo"} className="block h-auto max-h-[48px] w-auto max-w-[min(72vw,286px)] object-contain" style={logoImageStyle({ ...logoPreviewConfig, logoZoom: Math.max(80, logoZoom) })} />
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-3">
                <div className={logoFrameClasses(logoPreviewConfig, false)}>
                  <ImageIcon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="max-w-[170px] truncate text-sm font-black text-on-surface">{form.partner_name || form.name || "Deine Bubble"}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">{form.type}</p>
                </div>
              </div>
            )}
            <div className="absolute right-5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-surface-container-high" />
          </div>
          <p className="bg-surface px-5 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-outline">Entry/Landing vor dem Betreten</p>
          <div className={["relative overflow-hidden text-white", heroPreviewHeight].join(" ")}>
            {form.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.hero_image_url} alt="" className="absolute inset-0 h-full w-full will-change-transform" style={heroMediaStyle(heroPreviewConfig)} />
            ) : (
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${previewPrimary}, ${previewAccent})` }} />
            )}
            <div className="absolute inset-0" style={{ background: heroOverlayBackground(heroPreviewConfig) }} />
            <div className="relative flex h-full flex-col justify-end p-5">
              <button className="mt-5 min-h-12 rounded-full px-5 text-sm font-black text-white shadow-cta" style={{ backgroundColor: previewPrimary }} type="button">
                Jetzt Bubble betreten
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 bg-white p-4">
            <div className="rounded-[1rem] bg-surface p-3">
              <p className="text-xs font-bold text-on-surface-variant">Primär</p>
              <p className="mt-1 text-sm font-black text-on-surface">{previewPrimary}</p>
            </div>
            <div className="rounded-[1rem] p-3 text-white" style={{ backgroundColor: previewAccent }}>
              <p className="text-xs font-bold opacity-80">Akzent</p>
              <p className="mt-1 text-sm font-black">Badge</p>
            </div>
          </div>
        </div>
        {!canUpload ? <p className="mt-3 rounded-[1rem] bg-white p-3 text-xs font-bold text-on-surface-variant">Speichere eine neue Bubble zuerst, dann sind Uploads aktiv.</p> : null}
      </div>
    </div>
  );
}

function ChoiceGroup({ label, value, options, onChange }: { label: string; value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-on-surface">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(([optionValue, optionLabel]) => (
          <button
            key={optionValue}
            className={[
              "min-h-10 rounded-full px-4 text-sm font-bold transition",
              value === optionValue ? "bg-primary text-on-primary" : "bg-white text-on-surface-variant",
            ].join(" ")}
            type="button"
            onClick={() => onChange(optionValue)}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

function LogoPreviewBox({ imageUrl, config }: { imageUrl: string; config: LogoPreviewConfig }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-[1.25rem] bg-white p-5">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="block h-auto max-h-24 w-auto max-w-full object-contain" style={logoImageStyle({ ...config, logoZoom: Math.max(80, config.logoZoom) })} />
      ) : (
        <div className={logoFrameClasses({ ...config, logoSize: "large" }, false)}>
          <ImageIcon size={24} />
        </div>
      )}
    </div>
  );
}

function HeroPreviewFrame({
  imageUrl,
  config,
  heightClass,
  fallbackFrom,
  fallbackTo,
  draggable = false,
  onCropChange,
}: {
  imageUrl: string;
  config: HeroPreviewConfig;
  heightClass: string;
  fallbackFrom: string;
  fallbackTo: string;
  draggable?: boolean;
  onCropChange?: (x: number, y: number) => void;
}) {
  return (
    <DraggableFrame className={["relative overflow-hidden rounded-[1.5rem] bg-on-surface text-white", heightClass].join(" ")} disabled={!draggable || !imageUrl} cropX={config.heroCropX} cropY={config.heroCropY} onCropChange={onCropChange}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full select-none will-change-transform" draggable={false} style={heroMediaStyle(config)} />
      ) : (
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${fallbackFrom}, ${fallbackTo})` }} />
      )}
      <div className="absolute inset-0" style={{ background: heroOverlayBackground(config) }} />
      {draggable ? <p className="absolute left-4 top-4 z-10 rounded-full bg-white/15 px-3 py-1 text-xs font-black backdrop-blur-md">Ziehen zum Verschieben</p> : null}
    </DraggableFrame>
  );
}

function LogoCropEditor({
  imageUrl,
  config,
  updateConfig,
  onApply,
}: {
  imageUrl: string;
  config: LogoPreviewConfig;
  updateConfig: (key: ConfigTextKey, value: string) => void;
  onApply: () => void;
}) {
  return (
    <div className="mt-5 rounded-[1.5rem] bg-white p-4">
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <DraggableFrame
          className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[1.5rem] bg-surface-container-low"
          disabled={!imageUrl}
          cropX={config.logoCropX}
          cropY={config.logoCropY}
          onCropChange={(x, y) => {
            updateConfig("logoCropX", String(Math.round(x)));
            updateConfig("logoCropY", String(Math.round(y)));
          }}
        >
          <div className={logoFrameClasses({ ...config, logoSize: "large" }, false)}>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className={logoImageClasses(config)} style={logoImageStyle(config)} draggable={false} />
            ) : (
              <ImageIcon size={22} />
            )}
          </div>
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/80 px-3 py-1 text-xs font-black text-on-surface">Ziehen</p>
        </DraggableFrame>
        <div className="space-y-4">
          <ChoiceGroup
            label="Logo anzeigen"
            value={config.logoFit}
            options={[
              ["contain", "vollständig anzeigen"],
              ["cover", "füllend anzeigen"],
            ]}
            onChange={(value) => updateConfig("logoFit", value)}
          />
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-on-surface">Logo-Zoom: {config.logoZoom}%</span>
            <input className="w-full accent-primary" type="range" min="80" max="220" step="5" value={config.logoZoom} onChange={(event) => updateConfig("logoZoom", event.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button className="min-h-10 rounded-full bg-surface px-4 text-sm font-bold text-on-surface" type="button" onClick={() => {
              updateConfig("logoCropX", "0");
              updateConfig("logoCropY", "0");
              updateConfig("logoZoom", "100");
              updateConfig("logoFit", "contain");
            }}>
              Zurücksetzen
            </button>
            <button className="min-h-10 rounded-full bg-primary px-4 text-sm font-bold text-on-primary" type="button" onClick={onApply}>
              Übernehmen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroCropEditor({
  imageUrl,
  config,
  fallbackFrom,
  fallbackTo,
  updateConfig,
  onApply,
}: {
  imageUrl: string;
  config: HeroPreviewConfig;
  fallbackFrom: string;
  fallbackTo: string;
  updateConfig: (key: ConfigTextKey, value: string) => void;
  onApply: () => void;
}) {
  return (
    <div className="rounded-[1.5rem] bg-white p-4">
      <HeroPreviewFrame
        imageUrl={imageUrl}
        config={config}
        heightClass="mx-auto aspect-[9/16] min-h-0 w-full max-w-[340px]"
        fallbackFrom={fallbackFrom}
        fallbackTo={fallbackTo}
        draggable
        onCropChange={(x, y) => {
          updateConfig("heroCropX", String(Math.round(x)));
          updateConfig("heroCropY", String(Math.round(y)));
        }}
      />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-on-surface">Cover-Zoom: {config.heroZoom}%</span>
          <input className="w-full accent-primary" type="range" min="100" max="180" step="5" value={config.heroZoom} onChange={(event) => updateConfig("heroZoom", event.target.value)} />
        </label>
        <ChoiceGroup
          label="Lesbarkeit"
          value={config.heroOverlay}
          options={[
            ["light", "leicht"],
            ["medium", "mittel"],
            ["strong", "stark"],
          ]}
          onChange={(value) => updateConfig("heroOverlay", value)}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="min-h-10 rounded-full bg-surface px-4 text-sm font-bold text-on-surface" type="button" onClick={() => {
          updateConfig("heroCropX", "0");
          updateConfig("heroCropY", "0");
          updateConfig("heroZoom", "100");
          updateConfig("heroFit", "cover");
        }}>
          Zurücksetzen
        </button>
        <button className="min-h-10 rounded-full bg-primary px-4 text-sm font-bold text-on-primary" type="button" onClick={onApply}>
          Übernehmen
        </button>
      </div>
    </div>
  );
}

function DraggableFrame({
  className,
  disabled,
  cropX,
  cropY,
  onCropChange,
  children,
}: {
  className: string;
  disabled: boolean;
  cropX: number;
  cropY: number;
  onCropChange?: (x: number, y: number) => void;
  children: React.ReactNode;
}) {
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; cropX: number; cropY: number } | null>(null);

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      cropX,
      cropY,
    };
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !onCropChange) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const nextX = clamp(drag.cropX + ((event.clientX - drag.startX) / rect.width) * 100, -50, 50);
    const nextY = clamp(drag.cropY + ((event.clientY - drag.startY) / rect.height) * 100, -50, 50);
    onCropChange(nextX, nextY);
  }

  function stopDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  }

  return (
    <div
      className={[className, disabled ? "" : "touch-none cursor-grab active:cursor-grabbing"].join(" ")}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
    >
      {children}
    </div>
  );
}

function ModuleFields({ form, updateFeature, activeModules }: { form: BuilderBubble; updateFeature: (key: FeatureKey, value: boolean) => void; activeModules: FeatureKey[] }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {featureKeys.map((key) => {
          const moduleCard = featureCards[key];
          return <ModuleToggleCard key={key} title={moduleCard.title} body={moduleCard.body} icon={moduleCard.icon} checked={form.features[key]} onChange={(value) => updateFeature(key, value)} />;
        })}
      </div>
      <div className="rounded-[1.25rem] bg-surface p-4">
        <p className="text-sm font-bold text-on-surface">Aktive Module</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {activeModules.map((featureKey) => (
            <Badge key={featureKey} tone="good">{featureLabels[featureKey]}</Badge>
          ))}
          {activeModules.length === 0 ? <Badge tone="muted">keine Module aktiv</Badge> : null}
        </div>
      </div>
    </div>
  );
}

function LiveFields({
  form,
  updateConfig,
  updateFeature,
  updateRewardLinked,
}: {
  form: BuilderBubble;
  updateConfig: (key: ConfigTextKey, value: string) => void;
  updateFeature: (key: FeatureKey, value: boolean) => void;
  updateRewardLinked: (value: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-[1.5rem] bg-surface p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SectionHeading title="Aktion" subtitle="Das ist der prominente Live-Block in der Bubble." />
          <TogglePill checked={form.features.live} onChange={(value) => updateFeature("live", value)} label={form.features.live ? "aktiv" : "inaktiv"} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Live-Seitentitel" value={form.config.eventTitle} onChange={(value) => updateConfig("eventTitle", value)} placeholder="Deutschland-Spiel" />
          <TextField label="Live-Unterzeile" value={form.config.eventSubtitle} onChange={(value) => updateConfig("eventSubtitle", value)} placeholder="Public Viewing in deiner Bubble" />
          <TextField label="Badge" value={form.config.actionBadge} onChange={(value) => updateConfig("actionBadge", value)} placeholder="Live-Aktion" />
          <TextField label="Button-Text" value={form.config.actionButtonText} onChange={(value) => updateConfig("actionButtonText", value)} placeholder="Jetzt mitmachen" />
          <TextField className="md:col-span-2" label="Aktionstitel" value={form.config.challengeTitle} onChange={(value) => updateConfig("challengeTitle", value)} placeholder="Tipp das Deutschland-Spiel" />
          <TextArea className="md:col-span-2" label="Beschreibung" value={form.config.challengeDescription} onChange={(value) => updateConfig("challengeDescription", value)} />
          <TextArea className="md:col-span-2" label="Hinweis / Gewinntext" value={form.config.actionHint} onChange={(value) => updateConfig("actionHint", value)} />
        </div>
      </section>

      <details className="rounded-[1.5rem] bg-surface p-4">
        <summary className="cursor-pointer text-sm font-black text-on-surface">Optionaler Spielstand</summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField label="Heimteam" value={form.config.homeTeamName} onChange={(value) => updateConfig("homeTeamName", value)} />
          <TextField label="Auswärtsteam" value={form.config.awayTeamName} onChange={(value) => updateConfig("awayTeamName", value)} />
          <TextField label="Heim Tore" value={form.config.homeScore} onChange={(value) => updateConfig("homeScore", value)} />
          <TextField label="Auswärts Tore" value={form.config.awayScore} onChange={(value) => updateConfig("awayScore", value)} />
          <TextField label="Spielminute / Text" value={form.config.scoreText} onChange={(value) => updateConfig("scoreText", value)} placeholder="77. Minute" />
          <SelectField label="Score-Modus" value={form.config.score_mode} onChange={(value) => updateConfig("score_mode", value)} options={["manual", "api"]} />
          <details className="md:col-span-2 rounded-[1rem] bg-white p-3">
            <summary className="cursor-pointer text-sm font-black text-on-surface">Erweiterte Score-Anbindung</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextField label="Score Provider" value={form.config.score_provider} onChange={(value) => updateConfig("score_provider", value)} placeholder="optional" />
              <TextField label="External Match ID" value={form.config.external_match_id} onChange={(value) => updateConfig("external_match_id", value)} placeholder="optional" />
            </div>
          </details>
        </div>
      </details>

      <section className="rounded-[1.5rem] bg-surface p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SectionHeading title="Abstimmung" subtitle="Eine einfache Frage mit Antwortoptionen, jeweils eine pro Zeile." />
          <TogglePill checked={form.features.polls} onChange={(value) => updateFeature("polls", value)} label={form.features.polls ? "aktiv" : "inaktiv"} />
        </div>
        <div className="grid gap-4">
          <TextField label="Frage" value={form.config.pollQuestion} onChange={(value) => updateConfig("pollQuestion", value)} placeholder="Wer gewinnt heute?" />
          <TextArea label="Antwortoptionen" value={form.config.pollOptions} onChange={(value) => updateConfig("pollOptions", value)} />
          <TextArea label="Hinweistext" value={form.config.pollHint} onChange={(value) => updateConfig("pollHint", value)} />
          <CheckboxField label="Mit Gewinn/Vorteil verknüpfen" checked={form.config.rewardLinked} onChange={updateRewardLinked} />
        </div>
      </section>
    </div>
  );
}

function CommunityFields({ form, updateConfig, updateFeature }: { form: BuilderBubble; updateConfig: (key: ConfigTextKey, value: string) => void; updateFeature: (key: FeatureKey, value: boolean) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] bg-surface p-4">
        <SectionHeading title="Community" subtitle="Texte für den Beitragsbereich der Besucher." />
        <TogglePill checked={form.features.community} onChange={(value) => updateFeature("community", value)} label={form.features.community ? "aktiv" : "inaktiv"} />
      </div>
      <div className="grid gap-4">
        <TextField label="Titel" value={form.config.communityTitle} onChange={(value) => updateConfig("communityTitle", value)} />
        <TextField label="Unterzeile" value={form.config.communitySubtitle} onChange={(value) => updateConfig("communitySubtitle", value)} />
        <TextArea label="Placeholder im Eingabefeld" value={form.config.communityPlaceholder} onChange={(value) => updateConfig("communityPlaceholder", value)} />
        <TextArea label="Regel-/Hinweistext" value={form.config.communityRules} onChange={(value) => updateConfig("communityRules", value)} />
      </div>
    </div>
  );
}

function RewardFields({ form, updateReward, updateFeature }: { form: BuilderBubble; updateReward: (index: number, key: keyof BuilderReward, value: string | boolean) => void; updateFeature: (key: FeatureKey, value: boolean) => void }) {
  const rewards = normalizeRewards(form.config.rewards, form);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] bg-surface p-4">
        <SectionHeading title="Vorteile" subtitle="Bis zu drei Rabatt-, Code- oder Gewinnkarten." />
        <TogglePill checked={form.features.rewards} onChange={(value) => updateFeature("rewards", value)} label={form.features.rewards ? "aktiv" : "inaktiv"} />
      </div>
      <div className="grid gap-4">
        {rewards.map((reward, index) => (
          <section key={index} className="rounded-[1.5rem] bg-surface p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-on-surface">Vorteil {index + 1}</h3>
                <p className="text-sm font-semibold text-on-surface-variant">{reward.title || "Noch nicht benannt"}</p>
              </div>
              <TogglePill checked={reward.active} onChange={(value) => updateReward(index, "active", value)} label={reward.active ? "aktiv" : "inaktiv"} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Titel" value={reward.title} onChange={(value) => updateReward(index, "title", value)} placeholder="10% Rabatt an der Bar" />
              <TextField label="Code / Label" value={reward.code} onChange={(value) => updateReward(index, "code", value)} placeholder="BUBBLE10" />
              <TextArea className="md:col-span-2" label="Beschreibung" value={reward.description} onChange={(value) => updateReward(index, "description", value)} />
              <TextField label="Button-Text" value={reward.buttonText} onChange={(value) => updateReward(index, "buttonText", value)} placeholder="Einlösen" />
              <TextField label="Hinweis" value={reward.hint} onChange={(value) => updateReward(index, "hint", value)} placeholder="Heute bis 22:00" />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function SponsorFields({ form, updateConfig, updateFeature }: { form: BuilderBubble; updateConfig: (key: ConfigTextKey, value: string) => void; updateFeature: (key: FeatureKey, value: boolean) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] bg-surface p-4">
        <SectionHeading title="Sponsor" subtitle="Optionale Partner-Kachel in der Besucher-Bubble." />
        <TogglePill checked={form.features.sponsorCard} onChange={(value) => updateFeature("sponsorCard", value)} label={form.features.sponsorCard ? "aktiv" : "inaktiv"} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Sponsor Name" value={form.config.sponsorName} onChange={(value) => updateConfig("sponsorName", value)} />
        <TextField label="Banner / Logo URL" value={form.config.sponsorBannerUrl} onChange={(value) => updateConfig("sponsorBannerUrl", value)} />
        <TextArea className="md:col-span-2" label="Sponsor Text" value={form.config.sponsorText} onChange={(value) => updateConfig("sponsorText", value)} />
        <TextField label="CTA Text" value={form.config.sponsorCtaText} onChange={(value) => updateConfig("sponsorCtaText", value)} placeholder="Mehr erfahren" />
        <TextField label="CTA Link" value={form.config.sponsorCtaLink} onChange={(value) => updateConfig("sponsorCtaLink", value)} placeholder="https://..." />
      </div>
    </div>
  );
}

function ModuleToggleCard({
  title,
  body,
  icon: Icon,
  checked,
  onChange,
}: {
  title: string;
  body: string;
  icon: LucideIcon;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      className={[
        "min-h-36 rounded-[1.5rem] border-2 p-4 text-left transition active:scale-[0.99]",
        checked ? "border-primary bg-primary/5" : "border-outline-variant/40 bg-white hover:bg-surface",
      ].join(" ")}
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={["flex h-11 w-11 items-center justify-center rounded-[1rem]", checked ? "bg-primary text-on-primary" : "bg-surface text-primary"].join(" ")}>
          <Icon size={21} />
        </div>
        <span className={["rounded-full px-3 py-1 text-xs font-black", checked ? "bg-green-100 text-green-700" : "bg-surface-container-high text-outline"].join(" ")}>
          {checked ? "aktiv" : "inaktiv"}
        </span>
      </div>
      <h3 className="mt-4 text-base font-black text-on-surface">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-5 text-on-surface-variant">{body}</p>
    </button>
  );
}

function TogglePill({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      className={["inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-black transition", checked ? "bg-primary text-on-primary" : "bg-surface-container-high text-outline"].join(" ")}
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    >
      <span className={["h-2.5 w-2.5 rounded-full", checked ? "bg-white" : "bg-outline"].join(" ")} />
      {label}
    </button>
  );
}

function AnalyticsPanel({ summary, message, bubble, adminSecret }: { summary: AnalyticsSummary | null; message: string; bubble: BuilderBubble; adminSecret: string }) {
  const metrics = [
    ["Besucher", summary?.visitors ?? 0],
    ["Sessions", summary?.sessions ?? 0],
    ["Page Views", summary?.pageViews ?? 0],
    ["Poll Votes", summary?.pollVotes ?? 0],
    ["Community Posts", summary?.communityPosts ?? 0],
    ["Reward Views", summary?.rewardViews ?? 0],
    ["Reward Claims", summary?.rewardClaims ?? 0],
    ["Sponsor Clicks", summary?.sponsorClicks ?? 0],
  ];

  return (
    <div className="space-y-5 rounded-[1.5rem] bg-white p-5 shadow-ambient">
      <SectionHeading title="Analytics" subtitle={bubble.id ? `${bubble.name} · letzte 1000 Events` : "Bitte zuerst eine Bubble speichern oder auswählen."} />
      {message ? <p className="rounded-[1rem] bg-surface p-3 text-sm font-semibold text-on-surface-variant">{message}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-[1.25rem] bg-surface p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-outline">{label}</p>
            <p className="mt-2 text-2xl font-black text-on-surface">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.25rem] border border-outline-variant/35 p-4">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-on-surface"><BarChart3 size={18} /> Top Module Klicks</h3>
          {summary?.topModules.length ? summary.topModules.map((item) => <p key={item.module} className="flex justify-between border-t border-outline-variant/25 py-2 text-sm"><span>{item.module}</span><strong>{item.count}</strong></p>) : <p className="text-sm text-on-surface-variant">Noch keine Modul-Klicks.</p>}
        </section>
        <section className="rounded-[1.25rem] border border-outline-variant/35 p-4">
          <h3 className="mb-3 font-bold text-on-surface">Letzte Events</h3>
          <div className="space-y-2">
            {summary?.recentEvents.length ? summary.recentEvents.slice(0, 8).map((event) => (
              <div key={event.id} className="rounded-[.9rem] bg-surface p-3 text-xs">
                <p className="font-bold text-on-surface">{event.event_type} · {event.device_type}</p>
                <p className="mt-1 text-on-surface-variant">{event.path ?? "-"} · {new Date(event.created_at).toLocaleString("de-DE")}</p>
              </div>
            )) : <p className="text-sm text-on-surface-variant">Noch keine Events.</p>}
          </div>
        </section>
      </div>
      {isPublicViewingPilotSlug(bubble.slug) ? <HuberPilotAdmin adminSecret={adminSecret} bubble={bubble} /> : null}
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-2xl font-black text-on-surface">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-on-surface-variant">{subtitle}</p>
    </div>
  );
}

function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "good" | "muted" }) {
  const className = tone === "good" ? "bg-green-100 text-green-700" : tone === "muted" ? "bg-surface-container-high text-outline" : "bg-surface text-primary";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${className}`}>{children}</span>;
}

function CopyLinkButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white px-3 text-xs font-black text-primary shadow-ambient transition active:scale-[0.98]" type="button" onClick={copyLink}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Kopiert" : label}
    </button>
  );
}

function LinkBox({ label, value, href, external = false }: { label: string; value: string; href: string; external?: boolean }) {
  return (
    <a
      className="block min-w-0 rounded-[1.25rem] bg-white p-3 text-left shadow-ambient transition active:scale-[0.99]"
      href={href}
      target={external ? "_blank" : "_blank"}
      rel="noreferrer"
    >
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-outline">{label}</span>
      <span className="mt-1 block truncate text-sm font-black text-primary">{value}</span>
    </a>
  );
}

function ColorField({ label, value, valid, onChange }: { label: string; value: string; valid: boolean; onChange: (value: string) => void }) {
  const pickerValue = valid && value ? value : "#0037d8";

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-on-surface">{label}</span>
      <div className="flex min-h-12 overflow-hidden rounded-[1rem] border-2 border-outline-variant/40 bg-surface focus-within:border-primary">
        <input
          aria-label={`${label} auswählen`}
          className="h-12 w-14 shrink-0 cursor-pointer border-0 bg-transparent p-1"
          type="color"
          value={pickerValue}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#0057ff"
          className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold text-on-surface outline-none"
        />
      </div>
      {!valid ? <span className="mt-2 block text-xs font-bold text-red-700">Bitte Hex-Farbe wie #0057ff nutzen.</span> : null}
    </label>
  );
}

function AssetField({
  label,
  value,
  kind,
  canUpload,
  uploading,
  compact = false,
  onUrlChange,
  onUploadAsset,
}: {
  label: string;
  value: string;
  kind: AssetKind;
  canUpload: boolean;
  uploading: boolean;
  compact?: boolean;
  onUrlChange: (value: string) => void;
  onUploadAsset: (kind: AssetKind, file: File) => Promise<void>;
}) {
  const inputId = `bubble-asset-${kind}`;

  return (
    <div className={compact ? "" : "md:col-span-2"}>
      <span className="mb-2 block text-sm font-bold text-on-surface">{label}</span>
      <div className={["grid gap-3 rounded-[1.25rem] border border-outline-variant/35 bg-white p-3", compact ? "" : "sm:grid-cols-[160px_1fr]"].join(" ")}>
        <div
          className={[
            "flex items-center justify-center rounded-[1rem] border border-outline-variant/35 bg-surface bg-cover bg-center text-primary",
            kind === "logo" ? "aspect-square min-h-28" : "aspect-[16/9] min-h-36",
            compact ? "hidden" : "",
          ].join(" ")}
          style={{ backgroundImage: value ? `url("${value.replace(/"/g, "%22")}")` : undefined }}
        >
          {!value ? <ImageIcon size={26} /> : null}
        </div>
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label
              className={[
                "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-bold",
                canUpload && !uploading ? "bg-primary text-on-primary" : "cursor-not-allowed bg-surface-container-high text-outline",
              ].join(" ")}
              htmlFor={inputId}
            >
              <Upload size={16} />
              {uploading ? "Lädt hoch ..." : `${label} hochladen`}
            </label>
            <input
              id={inputId}
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              disabled={!canUpload || uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void onUploadAsset(kind, file);
              }}
            />
            <p className="text-xs font-semibold text-on-surface-variant">JPG, PNG, WebP oder SVG. Upload bleibt im Admin-Flow.</p>
          </div>
          {value ? <p className="truncate rounded-full bg-surface px-3 py-2 text-xs font-semibold text-on-surface-variant">{value}</p> : null}
          <details>
            <summary className="cursor-pointer text-xs font-bold text-primary">URL manuell bearbeiten</summary>
            <div className="mt-3">
              <TextField label={`${label} URL`} value={value} onChange={onUrlChange} placeholder="https://..." />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required = false,
  placeholder,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-on-surface">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        type={type}
        className="h-12 w-full rounded-[1rem] border-2 border-outline-variant/40 bg-surface px-3 text-sm font-semibold text-on-surface outline-none focus:border-primary"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options, required = false }: { label: string; value: string; onChange: (value: string) => void; options: string[]; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-on-surface">{label}</span>
      <select value={value} required={required} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-[1rem] border-2 border-outline-variant/40 bg-surface px-3 text-sm font-semibold text-on-surface outline-none focus:border-primary">
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (value: string) => void; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-on-surface">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 w-full resize-y rounded-[1rem] border-2 border-outline-variant/40 bg-surface p-3 text-sm font-semibold text-on-surface outline-none focus:border-primary"
      />
    </label>
  );
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-[1rem] bg-surface px-3 text-sm font-bold text-on-surface">
      <input className="h-4 w-4 accent-primary" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
