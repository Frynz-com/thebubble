import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type JsonValue = string | number | boolean | null;

const allowedEvents = new Set([
  "demo_view",
  "demo_choose_visitor",
  "demo_choose_dashboard",
  "visitor_home_view",
  "visitor_action_view",
  "visitor_tip_submit",
  "visitor_reward_view",
  "reward_coupon_click",
  "reward_wallet_save",
  "dashboard_home_view",
  "dashboard_create_view",
  "dashboard_setup_view",
  "dashboard_contact_click",
  "demo_showcase_view",
  "demo_contact_click",
]);

const allowedModes = new Set(["visitor", "dashboard"]);
const blockedMetadataKeys = new Set(["contact", "contactvalue", "email", "mail", "phone", "tel", "telefon", "name", "displayname", "nickname"]);

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function cleanText(value: unknown, maxLength = 160) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function sanitizeMetadata(value: unknown): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const next: Record<string, JsonValue> = {};

  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = rawKey.trim().slice(0, 48);
    if (!key || blockedMetadataKeys.has(key.toLowerCase())) continue;
    if (typeof rawValue === "string") next[key] = rawValue.slice(0, 140);
    else if (typeof rawValue === "number" && Number.isFinite(rawValue)) next[key] = rawValue;
    else if (typeof rawValue === "boolean" || rawValue === null) next[key] = rawValue;
  }

  return next;
}

function isMissingDemoEventsTable(error: { code?: string; message?: string; details?: string }) {
  const text = [error.code, error.message, error.details].filter(Boolean).join(" ").toLowerCase();
  return text.includes("demo_events") && (text.includes("schema cache") || text.includes("does not exist") || text.includes("not find") || text.includes("pgrst205"));
}

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false }, 200);
  }

  const eventName = cleanText(payload.event_name ?? payload.eventName, 80);
  const rawMode = cleanText(payload.mode, 32);
  const mode = allowedModes.has(rawMode) ? rawMode : null;

  if (!allowedEvents.has(eventName)) return jsonResponse({ ok: false }, 200);

  const supabase = getSupabaseAdminClient();
  if (!supabase) return jsonResponse({ ok: false }, 200);

  try {
    const { error } = await supabase.from("demo_events").insert({
      event_name: eventName,
      mode,
      metadata: sanitizeMetadata(payload.metadata),
    });

    if (error && !isMissingDemoEventsTable(error)) console.error("[demo analytics] insert failed", error);
  } catch (error) {
    console.error("[demo analytics] track failed", error);
  }

  return jsonResponse({ ok: true });
}
