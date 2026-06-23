import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { AnalyticsEventRow } from "@/lib/supabase/types";

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function isAuthorized(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  return Boolean(adminSecret && request.headers.get("x-admin-secret") === adminSecret);
}

function emptySummary() {
  return {
    visitors: 0,
    sessions: 0,
    pageViews: 0,
    pollVotes: 0,
    communityPosts: 0,
    rewardViews: 0,
    rewardClaims: 0,
    sponsorClicks: 0,
    topModules: [] as Array<{ module: string; count: number }>,
    recentEvents: [] as AnalyticsEventRow[],
  };
}

function isMissingAnalyticsTable(error: { code?: string; message?: string; details?: string }) {
  const text = [error.code, error.message, error.details].filter(Boolean).join(" ").toLowerCase();
  return text.includes("analytics_events") && (text.includes("schema cache") || text.includes("does not exist") || text.includes("not find") || text.includes("pgrst205"));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return jsonResponse({ error: "Nicht autorisiert." }, 401);
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return jsonResponse({ error: "Supabase Admin Client ist nicht konfiguriert." }, 500);
  }

  const bubbleId = request.nextUrl.searchParams.get("bubbleId");
  if (!bubbleId) return jsonResponse({ summary: emptySummary() });

  const { data, error } = await supabase
    .from("analytics_events")
    .select("*")
    .eq("bubble_id", bubbleId)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    if (isMissingAnalyticsTable(error)) {
      return jsonResponse({
        summary: emptySummary(),
        message: "Analytics sind vorbereitet. Tracking-Tabelle ist lokal noch nicht aktiviert.",
      });
    }

    return jsonResponse({ error: error.message, details: error.details, hint: error.hint, code: error.code }, 500);
  }

  const events = (data ?? []) as AnalyticsEventRow[];
  const moduleCounts = new Map<string, number>();
  for (const event of events) {
    if (event.event_type !== "module_click") continue;
    const metadata = event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata) ? event.metadata : {};
    const moduleName = typeof metadata.module === "string" ? metadata.module : "unknown";
    moduleCounts.set(moduleName, (moduleCounts.get(moduleName) ?? 0) + 1);
  }

  const summary = {
    visitors: new Set(events.map((event) => event.visitor_id).filter(Boolean)).size,
    sessions: new Set(events.map((event) => event.session_id).filter(Boolean)).size,
    pageViews: events.filter((event) => event.event_type === "page_view").length,
    pollVotes: events.filter((event) => event.event_type === "poll_vote").length,
    communityPosts: events.filter((event) => event.event_type === "community_post").length,
    rewardViews: events.filter((event) => event.event_type === "reward_view").length,
    rewardClaims: events.filter((event) => event.event_type === "reward_claim").length,
    sponsorClicks: events.filter((event) => event.event_type === "sponsor_click").length,
    topModules: Array.from(moduleCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([module, count]) => ({ module, count })),
    recentEvents: events.slice(0, 20),
  };

  return jsonResponse({ summary });
}
