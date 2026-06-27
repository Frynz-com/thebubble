"use client";

import Link from "next/link";
import { Check, Gift, MessageCircle, Ticket, X } from "lucide-react";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { MobilePage } from "@/components/mobile-page";
import { ensureBubbleVisitor } from "@/lib/bubble-service";
import { bubblePath } from "@/lib/bubble-routing";
import { useBubbleConfig } from "@/lib/bubble-config";
import { outcomeLabel, parseExactScoreText, type MatchOutcome } from "@/lib/match-prediction";
import { getPilotOutcomeLabels, getPublicViewingPilotConfig, outcomeOptionsForPilot } from "@/lib/public-viewing-pilot";
import { getOrCreateSessionId } from "@/lib/storage";
import type { BubbleMatchStateRow, MatchPredictionRow, VisitorRow } from "@/lib/supabase/types";

type PredictionResponse = {
  visitor?: VisitorRow;
  matchState?: BubbleMatchStateRow;
  prediction?: MatchPredictionRow | null;
  error?: string;
};

function scoreLabel(matchState: BubbleMatchStateRow | null, fallbackAwayTeam: string) {
  if (!matchState) return "Spielstand folgt";
  if (matchState.current_germany_score === null || matchState.current_ecuador_score === null) return "Spielstand folgt";
  return `Live: ${matchState.team_home || "Deutschland"} ${matchState.current_germany_score} : ${matchState.current_ecuador_score} ${matchState.team_away || fallbackAwayTeam}`;
}

async function predictionRequest(method: "GET" | "POST", payload: Record<string, unknown>) {
  const query =
    method === "GET"
      ? `?bubbleSlug=${encodeURIComponent(String(payload.bubbleSlug ?? ""))}&visitorId=${encodeURIComponent(String(payload.visitorId ?? ""))}&sessionId=${encodeURIComponent(String(payload.sessionId ?? ""))}`
      : "";
  const response = await fetch(`/api/match-predictions${query}`, {
    method,
    headers: method === "POST" ? { "content-type": "application/json" } : undefined,
    body: method === "POST" ? JSON.stringify(payload) : undefined,
  });
  const json = (await response.json()) as PredictionResponse;
  if (!response.ok) throw new Error(json.error || "Tippdaten konnten nicht geladen werden.");
  return json;
}

export function HuberArenaPilot({ bubbleSlug }: { bubbleSlug: string }) {
  const runtimeConfig = useBubbleConfig(bubbleSlug);
  const pilotConfig = getPublicViewingPilotConfig(bubbleSlug);
  const [visitor, setVisitor] = useState<VisitorRow | null>(null);
  const [matchState, setMatchState] = useState<BubbleMatchStateRow | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [outcomePick, setOutcomePick] = useState<MatchOutcome | "">("");
  const [exactScoreText, setExactScoreText] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const activeHomeTeam = matchState?.team_home || runtimeConfig.homeTeamName || pilotConfig.homeTeam;
  const activeAwayTeam = matchState?.team_away || runtimeConfig.awayTeamName || pilotConfig.awayTeam;
  const requiresExactScore = pilotConfig.requiresExactScore;
  const requiresContact = pilotConfig.requiresContact;
  const outcomeLabels = useMemo(
    () => ({
      ...getPilotOutcomeLabels(pilotConfig),
      deutschland: activeHomeTeam,
      ecuador: activeAwayTeam,
    }),
    [activeAwayTeam, activeHomeTeam, pilotConfig],
  );
  const outcomeOptions = useMemo(
    () =>
      outcomeOptionsForPilot(bubbleSlug).map((option) => ({
        ...option,
        label: outcomeLabels[option.value] || option.label,
      })),
    [bubbleSlug, outcomeLabels],
  );

  useEffect(() => {
    let active = true;

    async function load() {
      setMessage("");
      try {
        const context = await ensureBubbleVisitor(bubbleSlug);
        if (!active) return;
        if (context.message) setMessage(context.message);
        if (!context.visitor) return;
        setVisitor(context.visitor);
        const data = await predictionRequest("GET", {
          bubbleSlug,
          visitorId: context.visitor.id,
          sessionId: getOrCreateSessionId(bubbleSlug),
        });
        if (!active) return;
        setMatchState(data.matchState ?? null);
        if (data.prediction) {
          setDisplayName(data.prediction.display_name ?? "");
          setContactValue(data.prediction.contact_value ?? "");
          setOutcomePick(data.prediction.outcome_pick);
          setExactScoreText(data.prediction.exact_score_text ?? "");
          setSaved(true);
        }
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Tippbereich konnte nicht geladen werden.");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [bubbleSlug]);

  function openContactStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!visitor) {
      setMessage("Besucher wird noch vorbereitet. Bitte kurz erneut versuchen.");
      return;
    }
    if (!outcomePick) {
      setMessage("Bitte wähle, wer heute gewinnt.");
      return;
    }
    if (requiresExactScore && parseExactScoreText(exactScoreText).parseStatus !== "parsed") {
      setMessage("Bitte gib zuerst deinen genauen Ergebnistipp ab, um am Gewinnspiel teilzunehmen.");
      return;
    }
    setMessage("");
    setPrivacyAccepted(false);
    setContactModalOpen(true);
  }

  async function savePrediction(saveContact: boolean) {
    if (!visitor || !outcomePick) return;
    if (requiresExactScore && parseExactScoreText(exactScoreText).parseStatus !== "parsed") {
      setMessage("Bitte gib zuerst deinen genauen Ergebnistipp ab, um am Gewinnspiel teilzunehmen.");
      setContactModalOpen(false);
      return;
    }
    if (requiresContact && !contactValue.trim()) {
      setMessage("Bitte gib eine Telefonnummer oder E-Mail an, damit wir dich im Gewinnfall benachrichtigen können.");
      return;
    }
    if (requiresContact && !privacyAccepted) {
      setMessage("Bitte bestätige die Datenschutz- und Gewinnspiel-Einwilligung, um teilzunehmen.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const data = await predictionRequest("POST", {
        bubbleSlug,
        visitorId: visitor.id,
        sessionId: getOrCreateSessionId(bubbleSlug),
        displayName,
        contactValue: saveContact ? contactValue : "",
        outcomePick,
        exactScoreText,
        privacyConsentAccepted: privacyAccepted,
      });
      if (data.prediction) {
        setDisplayName(data.prediction.display_name ?? "");
        setContactValue(data.prediction.contact_value ?? "");
        setOutcomePick(data.prediction.outcome_pick);
        setExactScoreText(data.prediction.exact_score_text ?? "");
      }
      setSaved(true);
      setContactModalOpen(false);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tipp konnte nicht gespeichert werden.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobilePage title={runtimeConfig.partnerName || pilotConfig.customerTitle} subtitle={runtimeConfig.type || pilotConfig.subtitle}>
      <div className="space-y-4">
        <section className="overflow-hidden rounded-[1.35rem] bg-on-surface shadow-ambient ring-1 ring-white/40">
          <div className="px-4 py-5 text-white">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <TeamBlock flag={pilotConfig.homeFlag} team={activeHomeTeam} align="left" />
              <div className="rounded-full bg-white/10 px-3 py-1 text-sm font-black text-white/80 ring-1 ring-white/10">vs.</div>
              <TeamBlock flag={pilotConfig.awayFlag} team={activeAwayTeam} align="right" />
            </div>
            <div className="mt-4 rounded-[1rem] bg-white/10 px-4 py-3 text-center text-sm font-black leading-5 text-white ring-1 ring-white/10">{scoreLabel(matchState, activeAwayTeam)}</div>
          </div>
        </section>

        {saved ? (
          <SuccessCard
            bubbleSlug={bubbleSlug}
            outcomePick={outcomePick}
            exactScoreText={exactScoreText}
            hasContact={Boolean(contactValue.trim())}
            outcomeLabels={outcomeLabels}
          />
        ) : (
          <section className="rounded-[1.35rem] bg-white p-4 shadow-ambient">
            {requiresExactScore ? (
              <p className="mb-4 rounded-[1rem] bg-surface px-3 py-3 text-sm font-bold leading-5 text-on-surface-variant">{pilotConfig.mainText}</p>
            ) : null}
            <form className="space-y-5" onSubmit={openContactStep}>
              <div>
                <p className="mb-3 text-base font-black text-on-surface">Wer gewinnt heute?</p>
                <div className="grid gap-2">
                  {outcomeOptions.map((option) => {
                    const active = outcomePick === option.value;
                    return (
                      <button
                        key={option.value}
                        className={[
                          "flex min-h-14 items-center justify-between rounded-[1.15rem] border-2 px-4 text-left text-base font-black transition active:scale-[0.99]",
                          active ? "border-primary bg-primary/10 text-primary" : "border-outline-variant/40 bg-white text-on-surface",
                        ].join(" ")}
                        type="button"
                        onClick={() => setOutcomePick(option.value)}
                      >
                        {option.label}
                        {active ? <Check size={20} /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-on-surface">Dein genauer Ergebnistipp</span>
                <input
                  value={exactScoreText}
                  onChange={(event) => setExactScoreText(event.target.value)}
                  placeholder={`z. B. 2:1 ${activeHomeTeam}`}
                  className="h-14 w-full rounded-[1.15rem] border-2 border-outline-variant/40 bg-surface px-4 text-base font-semibold text-on-surface outline-none placeholder:text-outline focus:border-primary"
                  maxLength={120}
                />
                <span className="mt-2 block text-xs font-semibold leading-5 text-on-surface-variant">Schreib dein Ergebnis einfach rein, z. B. 2:1 oder 1:1.</span>
              </label>

              <button className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-black text-on-primary shadow-active transition active:scale-[0.98] disabled:opacity-60" type="submit" disabled={busy}>
                <Ticket size={19} />
                Tipp einreichen
              </button>
            </form>
            {message ? <p className="mt-4 rounded-[1rem] bg-surface p-3 text-sm font-bold text-on-surface-variant">{message}</p> : null}
          </section>
        )}

        <section className="grid gap-3">
          <PrizeTeaser href={bubblePath(bubbleSlug, "/benefits")} pilotConfig={pilotConfig} />
          <TeaserCard
            icon={<MessageCircle size={18} />}
            title="Was sagen die anderen Fans?"
            text="Schreib deinen Tipp oder deine Meinung in die Bubble."
            href={bubblePath(bubbleSlug, "/community")}
            button="Zum Community-Chat"
          />
        </section>
      </div>

      {contactModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-end bg-on-surface/30 p-4 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true">
          <section className="w-full max-w-md rounded-[1.45rem] bg-white p-5 shadow-active animate-pop-in">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black leading-7 text-on-surface">Wie erreichen wir dich im Gewinnfall?</h2>
                <p className="mt-2 text-sm font-semibold leading-5 text-on-surface-variant">Wenn dein Tipp richtig ist, benachrichtigt dich {pilotConfig.contactOwner} per Telefon oder E-Mail. Keine Registrierung nötig.</p>
              </div>
              <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-on-surface transition active:scale-[0.96]" type="button" aria-label="Schließen" onClick={() => setContactModalOpen(false)} disabled={busy}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-on-surface-variant">Fanname optional</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Dein Name oder Fanname"
                  className="h-14 w-full rounded-[1.05rem] border border-outline-variant/45 bg-white px-4 text-base font-semibold text-on-surface shadow-[inset_0_1px_0_rgba(255,255,255,.9)] outline-none transition placeholder:text-outline focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  maxLength={48}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-on-surface-variant">Telefonnummer oder E-Mail</span>
                <input
                  value={contactValue}
                  onChange={(event) => setContactValue(event.target.value)}
                  placeholder="Telefonnummer oder E-Mail"
                  className="h-14 w-full rounded-[1.05rem] border border-outline-variant/45 bg-white px-4 text-base font-semibold text-on-surface shadow-[inset_0_1px_0_rgba(255,255,255,.9)] outline-none transition placeholder:text-outline focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  maxLength={120}
                />
              </label>
              {requiresContact ? (
                <>
                  <label className="flex items-start gap-3 rounded-[1rem] bg-surface/80 p-3">
                    <input
                      className="mt-1 h-5 w-5 shrink-0 accent-[var(--bubble-primary)]"
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={(event) => setPrivacyAccepted(event.target.checked)}
                    />
                    <span className="text-xs font-semibold leading-5 text-on-surface-variant">{pilotConfig.privacyConsentText}</span>
                  </label>
                  <div className="grid gap-2">
                    <DisclosureButton title="Datenschutzhinweise" open={privacyOpen} onClick={() => setPrivacyOpen((value) => !value)} />
                    {privacyOpen ? <p className="rounded-[1rem] bg-surface px-3 py-3 text-xs font-semibold leading-5 text-on-surface-variant">{pilotConfig.privacyNoticeText}</p> : null}
                    <DisclosureButton title="Teilnahmebedingungen" open={termsOpen} onClick={() => setTermsOpen((value) => !value)} />
                    {termsOpen ? <p className="rounded-[1rem] bg-surface px-3 py-3 text-xs font-semibold leading-5 text-on-surface-variant">{pilotConfig.termsText}</p> : null}
                  </div>
                </>
              ) : null}
              {message ? <p className="rounded-[1rem] bg-surface p-3 text-sm font-bold text-on-surface-variant">{message}</p> : null}
              <button className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-black text-on-primary shadow-active transition active:scale-[0.98] disabled:opacity-60" type="button" disabled={busy} onClick={() => void savePrediction(true)}>
                <Ticket size={18} />
                {busy ? "Speichere ..." : "Mit Kontakt teilnehmen"}
              </button>
              {!requiresContact ? (
                <>
                  <button className="min-h-14 w-full rounded-full border border-outline-variant/70 bg-white px-4 text-sm font-black text-primary transition active:scale-[0.98] disabled:opacity-60" type="button" disabled={busy} onClick={() => void savePrediction(false)}>
                    Ohne Kontakt teilnehmen
                  </button>
                  <p className="rounded-[1rem] bg-surface/70 px-3 py-2 text-xs font-semibold leading-5 text-on-surface-variant">Ohne Kontakt kannst du teilnehmen, aber wir können dich im Gewinnfall nicht benachrichtigen.</p>
                </>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </MobilePage>
  );
}

function SuccessCard({
  bubbleSlug,
  outcomePick,
  exactScoreText,
  hasContact,
  outcomeLabels,
}: {
  bubbleSlug: string;
  outcomePick: MatchOutcome | "";
  exactScoreText: string;
  hasContact: boolean;
  outcomeLabels: Partial<Record<MatchOutcome, string>>;
}) {
  return (
    <section className="rounded-[1.35rem] bg-white p-4 shadow-ambient">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-700">
          <Check size={22} />
        </div>
        <div>
          <h2 className="text-xl font-black text-on-surface">Dein Tipp ist gespeichert.</h2>
          <p className="mt-1 text-sm font-bold text-on-surface-variant">Komm zum Ende des Spiels nochmal rein.</p>
        </div>
      </div>
      <dl className="grid gap-2 rounded-[1rem] bg-surface p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="font-bold text-on-surface-variant">Gewinner-Tipp</dt>
          <dd className="font-black text-on-surface">{outcomeLabel(outcomePick || null, outcomeLabels)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="font-bold text-on-surface-variant">Ergebnistipp</dt>
          <dd className="font-black text-on-surface">{exactScoreText || "-"}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="font-bold text-on-surface-variant">Kontaktstatus</dt>
          <dd>
            <span className={["rounded-full px-2.5 py-1 text-xs font-black", hasContact ? "bg-green-100 text-green-700" : "bg-surface-container-high text-on-surface-variant"].join(" ")}>
              {hasContact ? "Kontakt hinterlegt" : "Kontakt fehlt"}
            </span>
          </dd>
        </div>
      </dl>
      <div className="mt-4 grid gap-2">
        <Link className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-black text-on-primary" href={bubblePath(bubbleSlug, "/community")}>
          <MessageCircle size={17} />
          Zum Community-Chat
        </Link>
        <Link className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-surface px-4 text-sm font-black text-primary" href={bubblePath(bubbleSlug, "/benefits")}>
          <Gift size={17} />
          Gewinne ansehen
        </Link>
      </div>
    </section>
  );
}

function TeamBlock({ flag, team, align }: { flag: string; team: string; align: "left" | "right" }) {
  return (
    <div className={["min-w-0", align === "right" ? "text-right" : "text-left"].join(" ")}>
      <p className="text-[30px] leading-none">{flag}</p>
      <p className="mt-2 truncate text-[15px] font-black leading-5">{team}</p>
    </div>
  );
}

function PrizeTeaser({ href, pilotConfig }: { href: string; pilotConfig: ReturnType<typeof getPublicViewingPilotConfig> }) {
  return (
    <section className="rounded-[1.25rem] bg-white p-4 shadow-ambient">
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
          <Gift size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-on-surface">{pilotConfig.prizeTitle}</h2>
          <div className="mt-3 rounded-[1rem] bg-surface px-3 py-2.5">
            <p className="text-base font-black leading-6 text-on-surface">{pilotConfig.prizeMain}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {pilotConfig.prizeChips.map((chip) => (
                <span key={chip} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black leading-4 text-primary shadow-ambient">
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold leading-5 text-on-surface-variant">{pilotConfig.prizeHint}</p>
          <Link className="mt-3 inline-flex min-h-10 items-center rounded-full bg-primary px-4 text-sm font-black text-on-primary" href={href}>
            Gewinne ansehen
          </Link>
        </div>
      </div>
    </section>
  );
}

function DisclosureButton({ title, open, onClick }: { title: string; open: boolean; onClick: () => void }) {
  return (
    <button className="flex min-h-11 items-center justify-between rounded-[1rem] bg-surface px-3 text-left text-xs font-black text-primary" type="button" onClick={onClick}>
      {title}
      <span className="text-base leading-none">{open ? "−" : "+"}</span>
    </button>
  );
}

function TeaserCard({ icon, title, text, href, button }: { icon: ReactNode; title: string; text: string; href: string; button: string }) {
  return (
    <section className="rounded-[1.25rem] bg-white p-4 shadow-ambient">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-on-surface">{title}</h2>
          <p className="mt-1 text-sm font-semibold leading-5 text-on-surface-variant">{text}</p>
          <Link className="mt-3 inline-flex min-h-10 items-center rounded-full bg-surface px-4 text-sm font-black text-primary" href={href}>
            {button}
          </Link>
        </div>
      </div>
    </section>
  );
}
