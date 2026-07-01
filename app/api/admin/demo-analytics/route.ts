import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { DemoEventName, DemoEventRow } from "@/lib/supabase/types";

const demoEventNames = [
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
] as const satisfies readonly DemoEventName[];

const rangeKeys = ["today", "7d", "30d"] as const;
type RangeKey = (typeof rangeKeys)[number];

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function isAuthorized(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  return Boolean(adminSecret && request.headers.get("x-admin-secret") === adminSecret);
}

function normalizeRange(value: string | null): RangeKey {
  return rangeKeys.includes(value as RangeKey) ? (value as RangeKey) : "30d";
}

function getSinceDate(range: RangeKey) {
  const now = new Date();
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  const days = range === "7d" ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function emptyCounts(): Record<DemoEventName, number> {
  return Object.fromEntries(demoEventNames.map((eventName) => [eventName, 0])) as Record<DemoEventName, number>;
}

function isMissingDemoEventsTable(error: { code?: string; message?: string; details?: string }) {
  const text = [error.code, error.message, error.details].filter(Boolean).join(" ").toLowerCase();
  return text.includes("demo_events") && (text.includes("schema cache") || text.includes("does not exist") || text.includes("not find") || text.includes("pgrst205"));
}

function buildSummary(range: RangeKey, since: string, counts: Record<DemoEventName, number>, recentEvents: DemoEventRow[], message = "") {
  const contactClicks = counts.demo_contact_click + counts.dashboard_contact_click;

  return {
    range,
    since,
    generatedAt: new Date().toISOString(),
    message,
    totalEvents: demoEventNames.reduce((total, eventName) => total + counts[eventName], 0),
    counts,
    overview: {
      demoViews: counts.demo_view,
      visitorChoices: counts.demo_choose_visitor,
      dashboardChoices: counts.demo_choose_dashboard,
      tipsSaved: counts.visitor_tip_submit,
      couponsOpened: counts.reward_coupon_click,
      walletSaves: counts.reward_wallet_save,
      contactClicks,
    },
    visitorFunnel: [
      { label: "Demo geöffnet", event: "demo_view", count: counts.demo_view },
      { label: "Besucher gewählt", event: "demo_choose_visitor", count: counts.demo_choose_visitor },
      { label: "Tipp gespeichert", event: "visitor_tip_submit", count: counts.visitor_tip_submit },
      { label: "Reward gesehen", event: "visitor_reward_view", count: counts.visitor_reward_view },
      { label: "Coupon geöffnet", event: "reward_coupon_click", count: counts.reward_coupon_click },
      { label: "Wallet gespeichert", event: "reward_wallet_save", count: counts.reward_wallet_save },
    ],
    dashboardFunnel: [
      { label: "Demo geöffnet", event: "demo_view", count: counts.demo_view },
      { label: "Dashboard gewählt", event: "demo_choose_dashboard", count: counts.demo_choose_dashboard },
      { label: "Erstellen geöffnet", event: "dashboard_create_view", count: counts.dashboard_create_view },
      { label: "Setup geöffnet", event: "dashboard_setup_view", count: counts.dashboard_setup_view },
      { label: "Kontakt geklickt", event: "dashboard_contact_click", count: counts.dashboard_contact_click },
    ],
    recentEvents,
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

  const range = normalizeRange(request.nextUrl.searchParams.get("range"));
  const since = getSinceDate(range).toISOString();

  try {
    const countEntries = await Promise.all(
      demoEventNames.map(async (eventName) => {
        const { count, error } = await supabase
          .from("demo_events")
          .select("id", { count: "exact", head: true })
          .eq("event_name", eventName)
          .gte("created_at", since);

        if (error) throw error;
        return [eventName, count ?? 0] as const;
      }),
    );

    const counts = { ...emptyCounts(), ...Object.fromEntries(countEntries) };
    const { data, error } = await supabase
      .from("demo_events")
      .select("id,event_name,mode,metadata,created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) throw error;

    return jsonResponse({
      summary: buildSummary(range, since, counts, (data ?? []) as DemoEventRow[]),
    });
  } catch (error) {
    if (isMissingDemoEventsTable(error as { code?: string; message?: string; details?: string })) {
      const message = "Demo Analytics sind vorbereitet. Die demo_events Migration ist noch nicht aktiviert.";
      return jsonResponse({
        summary: buildSummary(range, since, emptyCounts(), [], message),
        message,
      });
    }

    const details = error as { code?: string; message?: string; details?: string; hint?: string };
    return jsonResponse({ error: details.message ?? "Demo Analytics konnten nicht geladen werden.", details: details.details, hint: details.hint, code: details.code }, 500);
  }
}
