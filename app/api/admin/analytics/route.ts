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
    funnel: {
      landingViews: 0,
      bubbleJoins: 0,
      liveViews: 0,
      scoreStarted: 0,
      scoreSaved: 0,
      contactModalOpened: 0,
      contactSaved: 0,
    },
    engagement: {
      benefitsViews: 0,
      benefitsClicks: 0,
      communityViews: 0,
      communityPosts: 0,
      tabLiveClicks: 0,
      tabCommunityClicks: 0,
      tabBenefitsClicks: 0,
    },
    conversionRates: {
      landingToJoin: 0,
      liveToScoreSaved: 0,
      scoreSavedToContact: 0,
      liveToContact: 0,
    },
    topEvents: [] as Array<{ event: string; count: number }>,
    learnings: [] as string[],
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
  const eventCounts = new Map<string, number>();
  for (const event of events) {
    eventCounts.set(event.event_type, (eventCounts.get(event.event_type) ?? 0) + 1);
    if (event.event_type !== "module_click") continue;
    const metadata = event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata) ? event.metadata : {};
    const moduleName = typeof metadata.module === "string" ? metadata.module : "unknown";
    moduleCounts.set(moduleName, (moduleCounts.get(moduleName) ?? 0) + 1);
  }

  const count = (eventType: string) => eventCounts.get(eventType) ?? 0;
  const rate = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 1000) / 10 : 0);
  const landingViews = count("landing_view");
  const bubbleJoins = count("landing_cta_click") || count("enter_bubble");
  const liveViews = count("live_view");
  const scoreStarted = count("score_input_start");
  const scoreSaved = count("score_submit_success");
  const contactModalOpened = count("contact_modal_open");
  const contactSaved = count("contact_submit_success");
  const benefitsViews = count("benefits_view") || count("reward_view");
  const benefitsClicks = count("benefits_click") + count("cta_benefits_click");
  const communityViews = count("community_view");
  const communityPosts = count("community_post_success") || count("community_post");
  const tabLiveClicks = count("tab_live_click");
  const tabCommunityClicks = count("tab_community_click");
  const tabBenefitsClicks = count("tab_benefits_click");
  const learnings = [
    communityViews <= Math.max(1, Math.round(liveViews * 0.1)) && communityPosts === 0 ? "Chat-Nutzung niedrig" : "",
    benefitsClicks >= Math.max(3, Math.round(liveViews * 0.2)) ? "Gewinne werden geklickt" : "",
    contactModalOpened >= 5 && contactSaved / Math.max(contactModalOpened, 1) < 0.55 ? "Kontakt-Abbruch" : "",
  ].filter(Boolean);

  const summary = {
    visitors: new Set(events.map((event) => event.anonymous_session_id ?? event.session_id).filter(Boolean)).size,
    sessions: new Set(events.map((event) => event.anonymous_session_id ?? event.session_id).filter(Boolean)).size,
    pageViews: events.filter((event) => event.event_type === "page_view").length,
    pollVotes: events.filter((event) => event.event_type === "poll_vote").length,
    communityPosts,
    rewardViews: benefitsViews,
    rewardClaims: events.filter((event) => event.event_type === "reward_claim").length,
    sponsorClicks: events.filter((event) => event.event_type === "sponsor_click").length,
    funnel: {
      landingViews,
      bubbleJoins,
      liveViews,
      scoreStarted,
      scoreSaved,
      contactModalOpened,
      contactSaved,
    },
    engagement: {
      benefitsViews,
      benefitsClicks,
      communityViews,
      communityPosts,
      tabLiveClicks,
      tabCommunityClicks,
      tabBenefitsClicks,
    },
    conversionRates: {
      landingToJoin: rate(bubbleJoins, landingViews),
      liveToScoreSaved: rate(scoreSaved, liveViews),
      scoreSavedToContact: rate(contactSaved, scoreSaved),
      liveToContact: rate(contactSaved, liveViews),
    },
    topEvents: Array.from(eventCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([event, count]) => ({ event, count })),
    learnings,
    topModules: Array.from(moduleCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([module, count]) => ({ module, count })),
    recentEvents: events.slice(0, 20),
  };

  return jsonResponse({ summary });
}
