import { NextRequest, NextResponse } from "next/server";
import { displayPredictionName, outcomeFromScores, outcomeLabel, shortVisitorId } from "@/lib/match-prediction";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { BubbleMatchStateRow, MatchOutcome, MatchPredictionRow } from "@/lib/supabase/types";

type PredictionWithStatus = MatchPredictionRow & {
  display_label: string;
  short_visitor_id: string;
  has_contact: boolean;
  exact_correct: boolean;
  tendency_correct: boolean;
  correct_without_contact: boolean;
};

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function isAuthorized(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  return Boolean(adminSecret && request.headers.get("x-admin-secret") === adminSecret);
}

function cleanText(value: unknown, maxLength = 160) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function nullableScore(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 99 ? parsed : null;
}

function predictionWithStatus(prediction: MatchPredictionRow, finalOutcome: MatchOutcome | null, finalGermanyScore: number | null, finalEcuadorScore: number | null): PredictionWithStatus {
  const exactCorrect =
    finalGermanyScore !== null &&
    finalEcuadorScore !== null &&
    prediction.germany_score === finalGermanyScore &&
    prediction.ecuador_score === finalEcuadorScore;
  const tendencyCorrect = finalOutcome !== null && (prediction.outcome_pick === finalOutcome || prediction.parsed_outcome === finalOutcome);

  return {
    ...prediction,
    display_label: displayPredictionName(prediction.display_name, prediction.visitor_id),
    short_visitor_id: shortVisitorId(prediction.visitor_id),
    has_contact: Boolean(prediction.contact_value?.trim()),
    exact_correct: exactCorrect,
    tendency_correct: tendencyCorrect,
    correct_without_contact: (exactCorrect || tendencyCorrect) && !prediction.contact_value?.trim(),
  };
}

async function getBubble(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>, bubbleId: string | null, bubbleSlug: string | null) {
  let query = supabase.from("bubbles").select("id,slug,name").limit(1);
  if (bubbleId) query = query.eq("id", bubbleId);
  else if (bubbleSlug) query = query.eq("slug", bubbleSlug);
  else query = query.eq("slug", "huber-arena");

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

async function ensureMatchState(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>, bubbleId: string) {
  const { data, error } = await supabase.from("bubble_match_state").select("*").eq("bubble_id", bubbleId).maybeSingle();
  if (error) throw error;
  if (data) return data as BubbleMatchStateRow;

  const { data: inserted, error: insertError } = await supabase
    .from("bubble_match_state")
    .insert({ bubble_id: bubbleId, match_title: "Deutschland vs. Ecuador", team_home: "Deutschland", team_away: "Ecuador" })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return inserted as BubbleMatchStateRow;
}

function buildCopyList(predictions: PredictionWithStatus[]) {
  return predictions
    .map((prediction, index) =>
      [
        `${index + 1}. ${prediction.display_label}`,
        prediction.contact_value ? `Kontakt: ${prediction.contact_value}` : "Kontakt fehlt",
        `Tipp: ${outcomeLabel(prediction.outcome_pick)} / ${prediction.exact_score_text || "-"}`,
        `Gast-ID: ${prediction.short_visitor_id}`,
      ].join(" | "),
    )
    .join("\n");
}

function buildCsv(predictions: PredictionWithStatus[]) {
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = [
    ["Fanname", "Kontakt", "Kontaktstatus", "Gewinner-Tipp", "Genauer Ergebnistipp Originaltext", "Automatisch erkanntes Ergebnis", "Parse-Status", "Zeitpunkt", "Gast-ID", "Exakt richtig", "Tendenz richtig"].map(escape).join(","),
    ...predictions.map((prediction) =>
      [
        prediction.display_label,
        prediction.contact_value ?? "",
        prediction.has_contact ? "Kontakt vorhanden" : "Kontakt fehlt",
        outcomeLabel(prediction.outcome_pick),
        prediction.exact_score_text,
        prediction.parse_status === "parsed" ? `${prediction.germany_score}:${prediction.ecuador_score}` : "nicht automatisch auswertbar",
        prediction.parse_status,
        prediction.updated_at,
        prediction.short_visitor_id,
        prediction.exact_correct ? "ja" : "nein",
        prediction.tendency_correct ? "ja" : "nein",
      ].map(escape).join(","),
    ),
  ];
  return rows.join("\n");
}

function countDistinctVisitorSessions(rows: Array<{ id: string; session_id?: string | null }>) {
  return new Set(rows.map((row) => row.session_id || row.id)).size;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return jsonResponse({ error: "Nicht autorisiert." }, 401);

  const supabase = getSupabaseAdminClient();
  if (!supabase) return jsonResponse({ error: "Supabase Admin Client ist nicht konfiguriert." }, 500);

  const bubbleId = request.nextUrl.searchParams.get("bubbleId");
  const bubbleSlug = request.nextUrl.searchParams.get("bubbleSlug");

  try {
    const bubble = await getBubble(supabase, bubbleId, bubbleSlug);
    if (!bubble) return jsonResponse({ error: "Bubble wurde nicht gefunden." }, 404);

    const activeSince = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const [
      matchState,
      predictionsResult,
      visitorsResult,
      activeVisitorsResult,
      postsResult,
      analyticsResult,
    ] = await Promise.all([
      ensureMatchState(supabase, bubble.id),
      supabase.from("match_predictions").select("*").eq("bubble_id", bubble.id).order("updated_at", { ascending: false }),
      supabase.from("visitors").select("id,session_id,last_seen_at,created_at").eq("bubble_id", bubble.id).order("last_seen_at", { ascending: false }).limit(2000),
      supabase.from("visitors").select("id,session_id,last_seen_at").eq("bubble_id", bubble.id).eq("is_active", true).gte("last_seen_at", activeSince).order("last_seen_at", { ascending: false }).limit(2000),
      supabase.from("posts").select("id,created_at", { count: "exact" }).eq("bubble_id", bubble.id).order("created_at", { ascending: false }).limit(1),
      supabase.from("analytics_events").select("id,created_at", { count: "exact" }).eq("bubble_id", bubble.id).order("created_at", { ascending: false }).limit(1),
    ]);

    if (predictionsResult.error) throw predictionsResult.error;
    if (visitorsResult.error) throw visitorsResult.error;
    if (activeVisitorsResult.error) throw activeVisitorsResult.error;
    if (postsResult.error) throw postsResult.error;

    const predictions = (predictionsResult.data ?? []) as MatchPredictionRow[];
    const finalGermanyScore = matchState.final_germany_score;
    const finalEcuadorScore = matchState.final_ecuador_score;
    const finalIsSet = finalGermanyScore !== null && finalEcuadorScore !== null;
    const finalOutcome = finalIsSet ? outcomeFromScores(finalGermanyScore, finalEcuadorScore) : null;
    const decorated = predictions.map((prediction) => predictionWithStatus(prediction, finalOutcome, finalGermanyScore, finalEcuadorScore));
    const exactMatches = decorated.filter((prediction) => prediction.exact_correct);
    const tendencyMatches = decorated.filter((prediction) => prediction.tendency_correct);
    const unparsed = decorated.filter((prediction) => prediction.parse_status !== "parsed");
    const contactMissingCorrect = decorated.filter((prediction) => prediction.correct_without_contact);
    const contactCount = decorated.filter((prediction) => prediction.has_contact).length;
    const totalVisitors = countDistinctVisitorSessions((visitorsResult.data ?? []) as Array<{ id: string; session_id?: string | null }>);
    const savedTips = decorated.length;
    const outcomeCounts = {
      deutschland: decorated.filter((prediction) => prediction.outcome_pick === "deutschland").length,
      unentschieden: decorated.filter((prediction) => prediction.outcome_pick === "unentschieden").length,
      ecuador: decorated.filter((prediction) => prediction.outcome_pick === "ecuador").length,
    };
    const latestActivity = [
      decorated[0]?.updated_at,
      visitorsResult.data?.[0]?.last_seen_at,
      postsResult.data?.[0]?.created_at,
      analyticsResult.data?.[0]?.created_at,
    ]
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;

    return jsonResponse({
      bubble,
      matchState,
      summary: {
        totalVisitors,
        activeVisitors15m: countDistinctVisitorSessions((activeVisitorsResult.data ?? []) as Array<{ id: string; session_id?: string | null }>),
        savedTips,
        contactsProvided: contactCount,
        tipsWithoutContact: savedTips - contactCount,
        conversionVisitorToTip: totalVisitors > 0 ? Math.round((savedTips / totalVisitors) * 1000) / 10 : 0,
        communityPosts: postsResult.count ?? 0,
        lastActivity: latestActivity,
        outcomeCounts,
        outcomePercentages: {
          deutschland: savedTips > 0 ? Math.round((outcomeCounts.deutschland / savedTips) * 1000) / 10 : 0,
          unentschieden: savedTips > 0 ? Math.round((outcomeCounts.unentschieden / savedTips) * 1000) / 10 : 0,
          ecuador: savedTips > 0 ? Math.round((outcomeCounts.ecuador / savedTips) * 1000) / 10 : 0,
        },
      },
      predictions: decorated,
      results: {
        finalIsSet,
        finalOutcome,
        exactMatches,
        tendencyMatches,
        unparsed,
        contactMissingCorrect,
        copyText: buildCopyList(exactMatches.length ? exactMatches : tendencyMatches),
        csv: buildCsv(decorated),
      },
    });
  } catch (error) {
    const typedError = error as { code?: string; message?: string; details?: string; hint?: string };
    return jsonResponse({ error: typedError.message ?? "Huber Pilot konnte nicht geladen werden.", details: typedError.details, hint: typedError.hint, code: typedError.code }, 500);
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return jsonResponse({ error: "Nicht autorisiert." }, 401);

  const supabase = getSupabaseAdminClient();
  if (!supabase) return jsonResponse({ error: "Supabase Admin Client ist nicht konfiguriert." }, 500);

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "Ungültige JSON-Daten." }, 400);
  }

  const action = cleanText(payload.action, 60);
  const bubbleId = cleanText(payload.bubbleId, 80) || null;
  const bubbleSlug = cleanText(payload.bubbleSlug, 80) || "huber-arena";

  try {
    const bubble = await getBubble(supabase, bubbleId, bubbleSlug);
    if (!bubble) return jsonResponse({ error: "Bubble wurde nicht gefunden." }, 404);

    if (action === "update-current" || action === "save-final") {
      const update =
        action === "update-current"
          ? {
              match_title: cleanText(payload.matchTitle, 120) || "Deutschland vs. Ecuador",
              team_home: cleanText(payload.teamHome, 60) || "Deutschland",
              team_away: cleanText(payload.teamAway, 60) || "Ecuador",
              current_germany_score: nullableScore(payload.currentGermanyScore),
              current_ecuador_score: nullableScore(payload.currentEcuadorScore),
              match_status: "live",
              updated_at: new Date().toISOString(),
            }
          : {
              match_title: cleanText(payload.matchTitle, 120) || "Deutschland vs. Ecuador",
              team_home: cleanText(payload.teamHome, 60) || "Deutschland",
              team_away: cleanText(payload.teamAway, 60) || "Ecuador",
              final_germany_score: nullableScore(payload.finalGermanyScore),
              final_ecuador_score: nullableScore(payload.finalEcuadorScore),
              match_status: "final",
              updated_at: new Date().toISOString(),
            };

      const { error } = await supabase
        .from("bubble_match_state")
        .upsert({ bubble_id: bubble.id, ...update }, { onConflict: "bubble_id" });
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    if (action === "reset") {
      if (cleanText(payload.confirm, 40) !== "RESET HUBER") return jsonResponse({ error: "Bitte RESET HUBER exakt eingeben." }, 400);

      const { data: polls, error: pollError } = await supabase.from("polls").select("id").eq("bubble_id", bubble.id);
      if (pollError) throw pollError;
      const pollIds = (polls ?? []).map((poll) => poll.id);

      if (pollIds.length > 0) {
        const { error } = await supabase.from("poll_votes").delete().in("poll_id", pollIds);
        if (error) throw error;
      }

      const deletes = await Promise.all([
        supabase.from("posts").delete().eq("bubble_id", bubble.id),
        supabase.from("match_predictions").delete().eq("bubble_id", bubble.id),
        supabase.from("analytics_events").delete().eq("bubble_id", bubble.id),
        supabase.from("visitors").delete().eq("bubble_id", bubble.id),
      ]);

      const failed = deletes.find((result) => result.error);
      if (failed?.error) throw failed.error;

      const { error: resetStateError } = await supabase
        .from("bubble_match_state")
        .upsert({
          bubble_id: bubble.id,
          match_title: "Deutschland vs. Ecuador",
          team_home: "Deutschland",
          team_away: "Ecuador",
          current_germany_score: null,
          current_ecuador_score: null,
          final_germany_score: null,
          final_ecuador_score: null,
          match_status: "scheduled",
          updated_at: new Date().toISOString(),
        }, { onConflict: "bubble_id" });
      if (resetStateError) throw resetStateError;

      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "Unbekannte Aktion." }, 400);
  } catch (error) {
    const typedError = error as { code?: string; message?: string; details?: string; hint?: string };
    return jsonResponse({ error: typedError.message ?? "Huber Pilot Aktion fehlgeschlagen.", details: typedError.details, hint: typedError.hint, code: typedError.code }, 500);
  }
}
