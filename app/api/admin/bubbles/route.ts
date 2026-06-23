import { NextRequest, NextResponse } from "next/server";
import { isReservedBubbleSlug } from "@/lib/bubble-routing";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const featureKeys = ["live", "community", "polls", "fanBattle", "rewards", "peopleHere", "sponsorCard"] as const;
const configTextKeys = [
  "headline",
  "subheadline",
  "eventTitle",
  "eventSubtitle",
  "backgroundStyle",
  "score_mode",
  "score_provider",
  "external_match_id",
  "actionBadge",
  "actionButtonText",
  "actionHint",
  "homeTeamName",
  "awayTeamName",
  "homeScore",
  "awayScore",
  "scoreText",
  "pollQuestion",
  "pollOptions",
  "pollHint",
  "communityTitle",
  "communitySubtitle",
  "communityPlaceholder",
  "communityRules",
  "challengeTitle",
  "challengeDescription",
  "voteTitle",
  "rewardCta",
  "rewardCode",
  "sponsorName",
  "sponsorBannerUrl",
  "sponsorText",
  "sponsorCtaText",
  "sponsorCtaLink",
  "logoShape",
  "logoFit",
  "logoBackground",
  "logoSize",
  "logoCropX",
  "logoCropY",
  "logoZoom",
  "heroFit",
  "heroZoom",
  "heroCropX",
  "heroCropY",
  "heroPosition",
  "heroPositionX",
  "heroPositionY",
  "heroHeight",
  "heroOverlay",
] as const;

type FeatureKey = (typeof featureKeys)[number];
type ConfigTextKey = (typeof configTextKeys)[number];

type RewardPayload = {
  active?: boolean;
  title?: string;
  description?: string;
  code?: string;
  buttonText?: string;
  hint?: string;
};

type BubblePayload = {
  id?: string;
  name?: string;
  slug?: string;
  type?: string;
  partner_name?: string;
  description?: string;
  logo_url?: string;
  hero_image_url?: string;
  primary_color?: string;
  accent_color?: string;
  reward_title?: string;
  reward_description?: string;
  reward_terms?: string;
  features?: Partial<Record<FeatureKey, boolean>>;
  config?: Partial<Record<ConfigTextKey, string> & { rewardLinked: boolean; rewards: RewardPayload[] }>;
  is_active?: boolean;
};

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function getSubmittedSecret(request: NextRequest) {
  return request.headers.get("x-admin-secret") ?? "";
}

function isAuthorized(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  return Boolean(adminSecret && getSubmittedSecret(request) === adminSecret);
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: unknown) {
  const text = cleanText(value);
  return text || null;
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function nullableColor(value: unknown) {
  const text = cleanText(value);
  if (!text) return null;
  return isHexColor(text) ? text : "";
}

function normalizeSlug(value: unknown) {
  return cleanText(value)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function isValidSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function normalizeFeatures(features: BubblePayload["features"]) {
  return Object.fromEntries(featureKeys.map((key) => [key, Boolean(features?.[key])]));
}

function normalizeReward(value: unknown) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? (value as RewardPayload) : {};
  return {
    active: typeof source.active === "boolean" ? source.active : false,
    title: cleanText(source.title),
    description: cleanText(source.description),
    code: cleanText(source.code),
    buttonText: cleanText(source.buttonText) || "Vorteil sichern",
    hint: cleanText(source.hint),
  };
}

function normalizeRewards(config: BubblePayload["config"]) {
  const rewards = Array.isArray(config?.rewards) ? config.rewards : [];
  return rewards.slice(0, 3).map(normalizeReward);
}

function normalizeConfig(config: BubblePayload["config"]) {
  const textConfig = Object.fromEntries(configTextKeys.map((key) => [key, cleanText(config?.[key])]));
  const pollOptions = cleanText(config?.pollOptions)
    .split(/\r?\n|,/)
    .map((option) => option.trim())
    .filter(Boolean)
    .slice(0, 6);

  return {
    ...textConfig,
    rewardLinked: Boolean(config?.rewardLinked),
    rewards: normalizeRewards(config),
    poll: {
      question: cleanText(config?.pollQuestion),
      options: pollOptions,
      hint: cleanText(config?.pollHint),
    },
  };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return jsonResponse({ error: "Nicht autorisiert." }, 401);
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return jsonResponse({ error: "Supabase Admin Client ist nicht konfiguriert." }, 500);
  }

  const { data, error } = await supabase
    .from("bubbles")
    .select(
      "id,slug,name,event_name,type,partner_name,description,logo_url,hero_image_url,primary_color,accent_color,reward_title,reward_description,reward_terms,features,config,is_active,created_at,updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return jsonResponse({ error: error.message, details: error.details, hint: error.hint, code: error.code }, 500);
  }

  return jsonResponse({ bubbles: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return jsonResponse({ error: "Nicht autorisiert." }, 401);
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return jsonResponse({ error: "Supabase Admin Client ist nicht konfiguriert." }, 500);
  }

  let payload: BubblePayload;
  try {
    payload = (await request.json()) as BubblePayload;
  } catch {
    return jsonResponse({ error: "Ungültige JSON-Daten." }, 400);
  }

  const slug = normalizeSlug(payload.slug);
  const name = cleanText(payload.name);
  const type = cleanText(payload.type);
  const id = cleanText(payload.id);

  if (!name) return jsonResponse({ error: "Name ist erforderlich." }, 400);
  if (!slug) return jsonResponse({ error: "Slug ist erforderlich." }, 400);
  if (!isValidSlug(slug)) return jsonResponse({ error: "Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten." }, 400);
  if (!type) return jsonResponse({ error: "Typ ist erforderlich." }, 400);

  const primaryColor = nullableColor(payload.primary_color);
  const accentColor = nullableColor(payload.accent_color);
  if (primaryColor === "" || accentColor === "") return jsonResponse({ error: "Farben müssen gültige Hex-Werte sein, z. B. #0057ff." }, 400);

  const { data: existingBubble, error: duplicateError } = await supabase
    .from("bubbles")
    .select("id,slug,name")
    .eq("slug", slug)
    .maybeSingle();

  if (duplicateError) {
    return jsonResponse({ error: duplicateError.message, details: duplicateError.details, hint: duplicateError.hint, code: duplicateError.code }, 500);
  }

  if (existingBubble && existingBubble.id !== id) {
    return jsonResponse({ error: `Der Slug "${slug}" wird bereits von "${existingBubble.name}" verwendet.` }, 409);
  }

  if (isReservedBubbleSlug(slug) && existingBubble?.id !== id) {
    return jsonResponse({ error: `Der Slug "${slug}" ist für Plattform-Routen reserviert.` }, 409);
  }

  const normalizedConfig = normalizeConfig(payload.config);
  const primaryReward =
    normalizedConfig.rewards.find((reward) => reward.active && reward.title) ?? normalizedConfig.rewards.find((reward) => reward.title);

  const bubble = {
    slug,
    name,
    event_name: type,
    type,
    partner_name: nullableText(payload.partner_name),
    description: nullableText(payload.description),
    logo_url: nullableText(payload.logo_url),
    hero_image_url: nullableText(payload.hero_image_url),
    primary_color: primaryColor,
    accent_color: accentColor,
    reward_title: nullableText(primaryReward?.title ?? payload.reward_title),
    reward_description: nullableText(primaryReward?.description ?? payload.reward_description),
    reward_terms: nullableText(primaryReward?.hint ?? payload.reward_terms),
    features: normalizeFeatures(payload.features),
    config: normalizedConfig,
    is_active: payload.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  const saveRequest = id
    ? supabase.from("bubbles").update(bubble).eq("id", id).select("*").single()
    : supabase.from("bubbles").insert(bubble).select("*").single();
  const { data, error } = await saveRequest;

  if (error) {
    return jsonResponse({ error: error.message, details: error.details, hint: error.hint, code: error.code }, 500);
  }

  return jsonResponse({ bubble: data });
}
