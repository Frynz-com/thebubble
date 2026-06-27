import { NextRequest, NextResponse } from "next/server";
import { parseExactScoreText, normalizeOutcome } from "@/lib/match-prediction";
import { normalizeBubbleSlug } from "@/lib/bubble-routing";
import { getPublicViewingPilotConfig } from "@/lib/public-viewing-pilot";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { BubbleMatchStateRow, MatchPredictionRow, VisitorRow } from "@/lib/supabase/types";

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function cleanText(value: unknown, maxLength = 180) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isMissingTable(error: { code?: string; message?: string; details?: string }) {
  const text = [error.code, error.message, error.details].filter(Boolean).join(" ").toLowerCase();
  return text.includes("schema cache") || text.includes("does not exist") || text.includes("not find") || text.includes("pgrst205");
}

async function getExistingPrediction(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>, bubbleId: string, visitorId: string) {
  const { data, error } = await supabase
    .from("match_predictions")
    .select("*")
    .eq("bubble_id", bubbleId)
    .eq("visitor_id", visitorId)
    .order("created_at", { ascending: true })
    .limit(1);
  if (error) throw error;
  return (data?.[0] as MatchPredictionRow | undefined) ?? null;
}

async function getBubbleAndVisitor(bubbleSlug: string, visitorId: string, sessionId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase Admin Client ist nicht konfiguriert.");

  const { data: bubble, error: bubbleError } = await supabase
    .from("bubbles")
    .select("id,slug,name,is_active")
    .eq("slug", bubbleSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (bubbleError) throw bubbleError;
  if (!bubble) return { supabase, bubble: null, visitor: null };

  const { data: visitor, error: visitorError } = await supabase
    .from("visitors")
    .select("*")
    .eq("id", visitorId)
    .eq("bubble_id", bubble.id)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (visitorError) throw visitorError;
  return { supabase, bubble, visitor: visitor as VisitorRow | null };
}

async function ensureMatchState(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>, bubbleId: string, bubbleSlug: string) {
  const { data, error } = await supabase.from("bubble_match_state").select("*").eq("bubble_id", bubbleId).maybeSingle();
  if (error) throw error;
  if (data) return data as BubbleMatchStateRow;

  const pilotConfig = getPublicViewingPilotConfig(bubbleSlug);
  const { data: inserted, error: insertError } = await supabase
    .from("bubble_match_state")
    .insert({
      bubble_id: bubbleId,
      match_title: pilotConfig.matchTitle,
      team_home: pilotConfig.homeTeam,
      team_away: pilotConfig.awayTeam,
    })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return inserted as BubbleMatchStateRow;
}

export async function GET(request: NextRequest) {
  const bubbleSlug = normalizeBubbleSlug(request.nextUrl.searchParams.get("bubbleSlug") ?? "");
  const visitorId = cleanText(request.nextUrl.searchParams.get("visitorId"), 80);
  const sessionId = cleanText(request.nextUrl.searchParams.get("sessionId"), 160);

  if (!bubbleSlug || !visitorId || !sessionId) return jsonResponse({ error: "Bubble, Besucher und Session sind erforderlich." }, 400);

  try {
    const { supabase, bubble, visitor } = await getBubbleAndVisitor(bubbleSlug, visitorId, sessionId);
    if (!bubble || !visitor) return jsonResponse({ error: "Besucher wurde nicht gefunden." }, 404);

    const [matchStateResult, predictionResult] = await Promise.all([
      ensureMatchState(supabase, bubble.id, bubbleSlug),
      supabase.from("match_predictions").select("*").eq("bubble_id", bubble.id).eq("visitor_id", visitor.id).order("created_at", { ascending: true }).limit(1),
    ]);

    if (predictionResult.error) throw predictionResult.error;

    return jsonResponse({
      bubble,
      visitor,
      matchState: matchStateResult,
      prediction: ((predictionResult.data?.[0] as MatchPredictionRow | undefined) ?? null),
    });
  } catch (error) {
    const typedError = error as { code?: string; message?: string; details?: string; hint?: string };
    if (isMissingTable(typedError)) return jsonResponse({ error: "Match-Prediction Migration fehlt noch." }, 503);
    return jsonResponse({ error: typedError.message ?? "Tippdaten konnten nicht geladen werden.", details: typedError.details, hint: typedError.hint }, 500);
  }
}

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "Ungültige JSON-Daten." }, 400);
  }

  const bubbleSlug = normalizeBubbleSlug(cleanText(payload.bubbleSlug, 80));
  const visitorId = cleanText(payload.visitorId, 80);
  const sessionId = cleanText(payload.sessionId, 160);
  const displayName = cleanText(payload.displayName, 48);
  const contactValue = cleanText(payload.contactValue, 120);
  const exactScoreText = cleanText(payload.exactScoreText, 120);
  const outcomePick = normalizeOutcome(payload.outcomePick);
  const privacyConsentAccepted = payload.privacyConsentAccepted === true;

  if (!bubbleSlug || !visitorId || !sessionId) return jsonResponse({ error: "Bubble, Besucher und Session sind erforderlich." }, 400);
  if (!outcomePick) {
    const pilotConfig = getPublicViewingPilotConfig(bubbleSlug);
    return jsonResponse({ error: `Bitte wähle ${pilotConfig.homeTeam}, Unentschieden oder ${pilotConfig.awayTeam}.` }, 400);
  }

  try {
    const { supabase, bubble, visitor } = await getBubbleAndVisitor(bubbleSlug, visitorId, sessionId);
    if (!bubble || !visitor) return jsonResponse({ error: "Besucher wurde nicht gefunden." }, 404);
    const pilotConfig = getPublicViewingPilotConfig(bubbleSlug);
    const parsed = parseExactScoreText(exactScoreText);
    if (pilotConfig.requiresExactScore && parsed.parseStatus !== "parsed") {
      return jsonResponse({ error: "Bitte gib zuerst deinen genauen Ergebnistipp ab, um am Gewinnspiel teilzunehmen." }, 400);
    }
    if (pilotConfig.requiresContact && !contactValue) {
      return jsonResponse({ error: "Bitte gib eine Telefonnummer oder E-Mail an, damit wir dich im Gewinnfall benachrichtigen können." }, 400);
    }
    if (pilotConfig.requiresContact && !privacyConsentAccepted) {
      return jsonResponse({ error: "Bitte bestätige die Datenschutz- und Gewinnspiel-Einwilligung, um teilzunehmen." }, 400);
    }

    const existingPrediction = await getExistingPrediction(supabase, bubble.id, visitor.id);
    if (existingPrediction) return jsonResponse({ prediction: existingPrediction, locked: true });

    const now = new Date().toISOString();
    const predictionPayload = {
      bubble_id: bubble.id,
      visitor_id: visitor.id,
      display_name: displayName || null,
      contact_value: contactValue || null,
      outcome_pick: outcomePick,
      exact_score_text: exactScoreText,
      germany_score: parsed.germanyScore,
      ecuador_score: parsed.ecuadorScore,
      parsed_outcome: parsed.parsedOutcome,
      parse_status: parsed.parseStatus,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("match_predictions")
      .insert(predictionPayload)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505" || error.message.toLowerCase().includes("duplicate")) {
        const prediction = await getExistingPrediction(supabase, bubble.id, visitor.id);
        if (prediction) return jsonResponse({ prediction, locked: true });
      }
      throw error;
    }

    if (displayName && displayName !== visitor.nickname) {
      await supabase
        .from("visitors")
        .update({ nickname: displayName, is_guest: false, last_seen_at: now, is_active: true, left_at: null })
        .eq("id", visitor.id)
        .eq("bubble_id", bubble.id)
        .eq("session_id", sessionId);
    }

    return jsonResponse({ prediction: data as MatchPredictionRow });
  } catch (error) {
    const typedError = error as { code?: string; message?: string; details?: string; hint?: string };
    if (isMissingTable(typedError)) return jsonResponse({ error: "Match-Prediction Migration fehlt noch." }, 503);
    return jsonResponse({ error: typedError.message ?? "Tipp konnte nicht gespeichert werden.", details: typedError.details, hint: typedError.hint }, 500);
  }
}
