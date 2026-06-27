import { NextRequest, NextResponse } from "next/server";
import { normalizeBubbleSlug } from "@/lib/bubble-routing";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { AnalyticsEventType, Json } from "@/lib/supabase/types";

const allowedEvents = new Set<AnalyticsEventType>([
  "page_view",
  "enter_bubble",
  "anonymous_continue",
  "profile_create",
  "poll_vote",
  "community_post",
  "reward_view",
  "reward_claim",
  "sponsor_click",
  "module_click",
  "landing_view",
  "landing_cta_click",
  "privacy_open",
  "terms_open",
  "live_view",
  "score_input_start",
  "score_submit_attempt",
  "score_submit_success",
  "contact_modal_open",
  "contact_submit_attempt",
  "contact_submit_success",
  "benefits_view",
  "benefits_click",
  "community_view",
  "community_post_attempt",
  "community_post_success",
  "tab_live_click",
  "tab_community_click",
  "tab_benefits_click",
  "cta_community_click",
  "cta_benefits_click",
]);

const blockedMetadataKeys = new Set(["contact", "contactvalue", "email", "mail", "phone", "tel", "telefon", "name", "displayname", "nickname"]);

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function cleanText(value: unknown, maxLength = 180) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanDeviceType(value: unknown): "mobile" | "tablet" | "desktop" {
  return value === "mobile" || value === "tablet" || value === "desktop" ? value : "desktop";
}

function sanitizeMetadata(value: unknown): Record<string, Json> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const next: Record<string, Json> = {};

  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = rawKey.trim().slice(0, 48);
    if (!key || blockedMetadataKeys.has(key.toLowerCase())) continue;
    if (typeof rawValue === "string") next[key] = rawValue.slice(0, 120);
    else if (typeof rawValue === "number" && Number.isFinite(rawValue)) next[key] = rawValue;
    else if (typeof rawValue === "boolean" || rawValue === null) next[key] = rawValue;
  }

  return next;
}

function isMissingAnalyticsTable(error: { code?: string; message?: string; details?: string }) {
  const text = [error.code, error.message, error.details].filter(Boolean).join(" ").toLowerCase();
  return text.includes("analytics_events") && (text.includes("schema cache") || text.includes("does not exist") || text.includes("not find") || text.includes("pgrst205"));
}

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false }, 200);
  }

  const bubbleSlug = normalizeBubbleSlug(cleanText(payload.bubbleSlug, 80));
  const eventName = cleanText(payload.eventName ?? payload.event_type, 80) as AnalyticsEventType;
  const anonymousSessionId = cleanText(payload.anonymousSessionId ?? payload.anonymous_session_id, 160);
  if (!bubbleSlug || !anonymousSessionId || !allowedEvents.has(eventName)) return jsonResponse({ ok: false }, 200);

  const supabase = getSupabaseAdminClient();
  if (!supabase) return jsonResponse({ ok: false }, 200);

  try {
    const { data: bubble, error: bubbleError } = await supabase
      .from("bubbles")
      .select("id,slug,is_active")
      .eq("slug", bubbleSlug)
      .eq("is_active", true)
      .maybeSingle();

    if (bubbleError || !bubble) return jsonResponse({ ok: false }, 200);

    const { error } = await supabase.from("analytics_events").insert({
      bubble_id: bubble.id,
      visitor_id: null,
      session_id: anonymousSessionId,
      anonymous_session_id: anonymousSessionId,
      event_type: eventName,
      path: cleanText(payload.path, 240),
      metadata: sanitizeMetadata(payload.metadata),
      device_type: cleanDeviceType(payload.deviceType ?? payload.device_type),
    });

    if (error && !isMissingAnalyticsTable(error)) console.error("[analytics] insert failed", error);
  } catch (error) {
    console.error("[analytics] track failed", error);
  }

  return jsonResponse({ ok: true });
}
