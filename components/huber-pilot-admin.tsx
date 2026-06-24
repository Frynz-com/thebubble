"use client";

import { Copy, Download, RefreshCcw, Save, Shuffle, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { outcomeLabel, type MatchOutcome } from "@/lib/match-prediction";
import type { BubbleMatchStateRow, MatchPredictionRow } from "@/lib/supabase/types";

type HuberPrediction = MatchPredictionRow & {
  display_label: string;
  short_visitor_id: string;
  has_contact: boolean;
  exact_correct: boolean;
  tendency_correct: boolean;
  correct_without_contact: boolean;
};

type HuberPilotData = {
  matchState: BubbleMatchStateRow;
  summary: {
    totalVisitors: number;
    activeVisitors15m: number;
    savedTips: number;
    contactsProvided: number;
    tipsWithoutContact: number;
    conversionVisitorToTip: number;
    communityPosts: number;
    lastActivity: string | null;
    outcomeCounts: Record<MatchOutcome, number>;
    outcomePercentages: Record<MatchOutcome, number>;
  };
  predictions: HuberPrediction[];
  results: {
    finalIsSet: boolean;
    finalOutcome: MatchOutcome | null;
    exactMatches: HuberPrediction[];
    tendencyMatches: HuberPrediction[];
    unparsed: HuberPrediction[];
    contactMissingCorrect: HuberPrediction[];
    copyText: string;
    csv: string;
  };
  error?: string;
};

type AdminBubble = {
  id?: string;
  slug: string;
  name: string;
};

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString("de-DE") : "-";
}

function parsedScore(prediction: HuberPrediction) {
  return prediction.parse_status === "parsed" ? `${prediction.germany_score}:${prediction.ecuador_score}` : "nicht automatisch auswertbar";
}

function parseStatusLabel(prediction: HuberPrediction) {
  return prediction.parse_status === "parsed" ? "automatisch erkannt" : "nicht automatisch auswertbar";
}

async function huberPilotRequest(adminSecret: string, bubbleId: string, method: "GET" | "POST", body?: Record<string, unknown>) {
  const url = method === "GET" ? `/api/admin/huber-pilot?bubbleId=${encodeURIComponent(bubbleId)}` : "/api/admin/huber-pilot";
  const response = await fetch(url, {
    method,
    headers: {
      "content-type": "application/json",
      "x-admin-secret": adminSecret,
    },
    body: body ? JSON.stringify({ bubbleId, ...body }) : undefined,
  });
  const json = (await response.json()) as HuberPilotData;
  if (!response.ok) throw new Error(json.error || "Huber Pilot konnte nicht geladen werden.");
  return json;
}

function exportCsv(csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `huber-arena-tipps-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function chooseWinner(predictions: HuberPrediction[]) {
  const withContact = predictions.filter((prediction) => prediction.has_contact);
  const pool = withContact.length > 0 ? withContact : predictions;
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

const prizePoolAdminText = "Gewinnpool: 10x 15 € Huber Arena Verzehrkarte, 1x 20 % adidas, 1x 15 % JD Sports, 1x 15 % ABOUT YOU.";

export function HuberPilotAdmin({ adminSecret, bubble }: { adminSecret: string; bubble: AdminBubble }) {
  const [data, setData] = useState<HuberPilotData | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [matchTitle, setMatchTitle] = useState("Deutschland vs. Ecuador");
  const [teamHome, setTeamHome] = useState("Deutschland");
  const [teamAway, setTeamAway] = useState("Ecuador");
  const [currentGermanyScore, setCurrentGermanyScore] = useState("");
  const [currentEcuadorScore, setCurrentEcuadorScore] = useState("");
  const [finalGermanyScore, setFinalGermanyScore] = useState("");
  const [finalEcuadorScore, setFinalEcuadorScore] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [drawnWinner, setDrawnWinner] = useState<HuberPrediction | null>(null);

  const bubbleId = bubble.id ?? "";
  const exactPoolLabel = data?.results.exactMatches.length ? "exakten Treffern" : "Tendenz-Treffern";
  const drawPool = useMemo(() => (data?.results.exactMatches.length ? data.results.exactMatches : (data?.results.tendencyMatches ?? [])), [data]);

  async function load() {
    if (!bubbleId) return;
    setBusy(true);
    setMessage("");
    try {
      const nextData = await huberPilotRequest(adminSecret, bubbleId, "GET");
      setData(nextData);
      setMatchTitle(nextData.matchState.match_title);
      setTeamHome(nextData.matchState.team_home);
      setTeamAway(nextData.matchState.team_away);
      setCurrentGermanyScore(nextData.matchState.current_germany_score === null ? "" : String(nextData.matchState.current_germany_score));
      setCurrentEcuadorScore(nextData.matchState.current_ecuador_score === null ? "" : String(nextData.matchState.current_ecuador_score));
      setFinalGermanyScore(nextData.matchState.final_germany_score === null ? "" : String(nextData.matchState.final_germany_score));
      setFinalEcuadorScore(nextData.matchState.final_ecuador_score === null ? "" : String(nextData.matchState.final_ecuador_score));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Huber Pilot konnte nicht geladen werden.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminSecret, bubbleId]);

  async function saveAction(action: "update-current" | "save-final" | "reset") {
    if (!bubbleId) return;
    setBusy(true);
    setMessage("");
    try {
      await huberPilotRequest(adminSecret, bubbleId, "POST", {
        action,
        matchTitle,
        teamHome,
        teamAway,
        currentGermanyScore,
        currentEcuadorScore,
        finalGermanyScore,
        finalEcuadorScore,
        confirm: resetConfirm,
      });
      setMessage(action === "reset" ? "Testdaten dieser Bubble wurden gelöscht." : "Spielsteuerung wurde gespeichert.");
      setDrawnWinner(null);
      if (action === "reset") setResetConfirm("");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Aktion fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  async function copyWinnerList() {
    const text = data?.results.copyText ?? "";
    if (!text) {
      setMessage("Keine Gewinnerliste vorhanden.");
      return;
    }
    await navigator.clipboard.writeText(text);
    setMessage("Gewinnerliste kopiert.");
  }

  function drawWinner() {
    const winner = chooseWinner(drawPool);
    setDrawnWinner(winner);
    setMessage(winner ? `Gewinner aus ${exactPoolLabel} gezogen.` : "Keine passenden Treffer zum Ziehen vorhanden.");
  }

  if (!bubbleId) {
    return <p className="rounded-[1rem] bg-surface p-3 text-sm font-semibold text-on-surface-variant">Bitte zuerst die Huber Arena Bubble speichern.</p>;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[1.5rem] border border-outline-variant/35 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-on-surface">Huber Arena Match Prediction Pilot</h3>
            <p className="mt-1 text-sm font-semibold text-on-surface-variant">/{bubble.slug} · manuelle Spielsteuerung und Gewinnerauswertung</p>
          </div>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-full bg-surface px-4 text-sm font-bold text-primary disabled:opacity-60" type="button" onClick={() => void load()} disabled={busy}>
            <RefreshCcw size={16} />
            Aktualisieren
          </button>
        </div>
        {message ? <p className="mb-4 rounded-[1rem] bg-surface p-3 text-sm font-bold text-on-surface-variant">{message}</p> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Spieltitel" value={matchTitle} onChange={setMatchTitle} className="md:col-span-2" />
          <Field label="Team 1" value={teamHome} onChange={setTeamHome} />
          <Field label="Team 2" value={teamAway} onChange={setTeamAway} />
          <ScoreEditor
            title="Aktueller Spielstand"
            leftLabel="Deutschland 🇩🇪"
            rightLabel="Ecuador 🇪🇨"
            leftValue={currentGermanyScore}
            rightValue={currentEcuadorScore}
            onLeftChange={setCurrentGermanyScore}
            onRightChange={setCurrentEcuadorScore}
            buttonLabel="Spielstand aktualisieren"
            disabled={busy}
            onSave={() => void saveAction("update-current")}
          />
          <ScoreEditor
            title="Finales Ergebnis"
            leftLabel="Deutschland 🇩🇪"
            rightLabel="Ecuador 🇪🇨"
            leftValue={finalGermanyScore}
            rightValue={finalEcuadorScore}
            onLeftChange={setFinalGermanyScore}
            onRightChange={setFinalEcuadorScore}
            buttonLabel="Finales Ergebnis speichern & Tipps auswerten"
            disabled={busy}
            onSave={() => void saveAction("save-final")}
            icon={<Save size={16} />}
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Gesamt Besucher" value={data?.summary.totalVisitors ?? 0} />
        <Metric label="Aktiv letzte 15 Min." value={data?.summary.activeVisitors15m ?? 0} />
        <Metric label="Gespeicherte Tipps" value={data?.summary.savedTips ?? 0} />
        <Metric label="Kontakte hinterlegt" value={data?.summary.contactsProvided ?? 0} />
        <Metric label="Tipps ohne Kontakt" value={data?.summary.tipsWithoutContact ?? 0} />
        <Metric label="Conversion Besucher zu Tipp" value={`${data?.summary.conversionVisitorToTip ?? 0}%`} />
        <Metric label="Community Posts" value={data?.summary.communityPosts ?? 0} />
        <Metric label="Letzte Aktivität" value={formatDate(data?.summary.lastActivity)} compact />
      </section>

      <section className="rounded-[1.5rem] border border-outline-variant/35 p-4">
        <h3 className="mb-3 text-lg font-black text-on-surface">Tipp-Auswertung</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {(["deutschland", "unentschieden", "ecuador"] as MatchOutcome[]).map((outcome) => (
            <div key={outcome} className="rounded-[1rem] bg-surface p-4">
              <p className="text-sm font-black text-on-surface">{outcomeLabel(outcome)}</p>
              <p className="mt-2 text-2xl font-black text-primary">{data?.summary.outcomeCounts[outcome] ?? 0}</p>
              <p className="text-xs font-bold text-outline">{data?.summary.outcomePercentages[outcome] ?? 0}%</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-outline-variant/35 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-black text-on-surface">Gewinnerauswertung</h3>
            <p className="mt-1 text-sm font-bold text-on-surface-variant">{prizePoolAdminText}</p>
            {!data?.results.finalIsSet ? <p className="mt-1 text-sm font-bold text-amber-700">Finales Ergebnis noch nicht gesetzt.</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton icon={<Copy size={15} />} label="Gewinnerliste kopieren" onClick={() => void copyWinnerList()} />
            <ActionButton icon={<Download size={15} />} label="CSV exportieren" onClick={() => exportCsv(data?.results.csv ?? "")} />
            <ActionButton icon={<Shuffle size={15} />} label={data?.results.exactMatches.length ? "Zufälligen Gewinner aus exakten Treffern ziehen" : "Zufälligen Gewinner aus Tendenz-Treffern ziehen"} onClick={drawWinner} />
          </div>
        </div>
        {drawnWinner ? (
          <p className="mb-4 rounded-[1rem] bg-green-50 p-3 text-sm font-black text-green-800">
            Gezogener Gewinner: {drawnWinner.display_label} · {drawnWinner.contact_value || "Kontakt fehlt"} · Gast-ID {drawnWinner.short_visitor_id}
          </p>
        ) : null}
        {data?.results.finalIsSet ? (
          <>
            <ResultList title="Exaktes Ergebnis richtig" predictions={data.results.exactMatches} />
            <ResultList title="Tendenz richtig" predictions={data.results.tendencyMatches} />
            <ResultList title="Nicht automatisch auswertbar" predictions={data.results.unparsed} />
            <ResultList title="Kontakt fehlt trotz richtigem Tipp" predictions={data.results.contactMissingCorrect} highlightMissingContact />
          </>
        ) : (
          <p className="rounded-[1rem] bg-surface p-3 text-sm font-semibold text-on-surface-variant">Sobald du das finale Ergebnis speicherst, werden exakte Treffer, Tendenz-Treffer und nicht automatisch auswertbare Tipps berechnet.</p>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-red-200 bg-red-50 p-4">
        <h3 className="text-lg font-black text-red-800">Testdaten dieser Bubble löschen</h3>
        <p className="mt-1 text-sm font-semibold text-red-700">Löscht Posts, Tipps, alte Poll Votes, Analytics und Besucher/Sessions dieser Bubble. Bubble, Config, Branding und Assets bleiben erhalten.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <Field label="Sicherheitsabfrage" value={resetConfirm} onChange={setResetConfirm} placeholder="RESET HUBER" />
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-red-700 px-4 text-sm font-bold text-white disabled:opacity-50" type="button" disabled={busy || resetConfirm !== "RESET HUBER"} onClick={() => void saveAction("reset")}>
            <Trash2 size={16} />
            Testdaten dieser Bubble löschen
          </button>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-outline-variant/35 p-4">
        <h3 className="mb-3 text-lg font-black text-on-surface">Alle Tipps</h3>
        <PredictionTable predictions={data?.predictions ?? []} />
      </section>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, className = "" }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-on-surface">{label}</span>
      <input className="h-12 w-full rounded-[1rem] border-2 border-outline-variant/40 bg-white px-3 text-sm font-semibold text-on-surface outline-none focus:border-primary" type={type} min={type === "number" ? 0 : undefined} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function ScoreEditor({
  title,
  leftLabel,
  rightLabel,
  leftValue,
  rightValue,
  onLeftChange,
  onRightChange,
  buttonLabel,
  disabled,
  onSave,
  icon,
}: {
  title: string;
  leftLabel: string;
  rightLabel: string;
  leftValue: string;
  rightValue: string;
  onLeftChange: (value: string) => void;
  onRightChange: (value: string) => void;
  buttonLabel: string;
  disabled: boolean;
  onSave: () => void;
  icon?: ReactNode;
}) {
  return (
    <section className="rounded-[1.25rem] bg-surface p-4">
      <h4 className="mb-3 text-sm font-black text-on-surface">{title}</h4>
      <div className="grid grid-cols-[1fr_64px_auto_64px_1fr] items-center gap-2">
        <span className="text-right text-sm font-black text-on-surface">{leftLabel}</span>
        <ScoreInput value={leftValue} onChange={onLeftChange} />
        <span className="text-xl font-black text-outline">:</span>
        <ScoreInput value={rightValue} onChange={onRightChange} />
        <span className="text-sm font-black text-on-surface">{rightLabel}</span>
      </div>
      <button className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-on-primary disabled:opacity-60" type="button" disabled={disabled} onClick={onSave}>
        {icon}
        {buttonLabel}
      </button>
    </section>
  );
}

function ScoreInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <input
      className="h-12 w-16 rounded-[.9rem] border-2 border-outline-variant/40 bg-white text-center text-lg font-black text-on-surface outline-none focus:border-primary"
      type="number"
      min={0}
      max={99}
      inputMode="numeric"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function Metric({ label, value, compact = false }: { label: string; value: ReactNode; compact?: boolean }) {
  return (
    <div className="rounded-[1.25rem] bg-surface p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-outline">{label}</p>
      <p className={compact ? "mt-2 text-sm font-black text-on-surface" : "mt-2 text-2xl font-black text-on-surface"}>{value}</p>
    </div>
  );
}

function ActionButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-surface px-3 text-xs font-black text-primary" type="button" onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function ResultList({ title, predictions, highlightMissingContact = false }: { title: string; predictions: HuberPrediction[]; highlightMissingContact?: boolean }) {
  return (
    <div className="mb-4 rounded-[1rem] bg-surface p-3">
      <h4 className="mb-2 text-sm font-black text-on-surface">{title} ({predictions.length})</h4>
      {predictions.length ? (
        <div className="space-y-2">
          {predictions.slice(0, 50).map((prediction) => (
            <div key={`${title}-${prediction.id}`} className={["rounded-[.85rem] bg-white p-3 text-xs font-semibold text-on-surface-variant", highlightMissingContact ? "border border-amber-200" : ""].join(" ")}>
              <p className="font-black text-on-surface">
                {prediction.display_label} · {prediction.short_visitor_id} · {prediction.contact_value || "Kontakt fehlt"}
              </p>
              <p className="mt-1">{outcomeLabel(prediction.outcome_pick)} · {prediction.exact_score_text || "-"} · {parsedScore(prediction)} · {formatDate(prediction.updated_at)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm font-semibold text-on-surface-variant">Noch keine Einträge.</p>
      )}
    </div>
  );
}

function PredictionTable({ predictions }: { predictions: HuberPrediction[] }) {
  if (!predictions.length) return <p className="rounded-[1rem] bg-surface p-3 text-sm font-semibold text-on-surface-variant">Noch keine Tipps gespeichert.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1050px] w-full border-separate border-spacing-y-2 text-left text-xs">
        <thead>
          <tr className="text-outline">
            <th className="px-3 py-2">Fanname oder Anonymer Fan</th>
            <th className="px-3 py-2">Kontakt</th>
            <th className="px-3 py-2">Kontaktstatus</th>
            <th className="px-3 py-2">Gewinner-Tipp</th>
            <th className="px-3 py-2">Genauer Ergebnistipp Originaltext</th>
            <th className="px-3 py-2">Automatisch erkanntes Ergebnis</th>
            <th className="px-3 py-2">Parse-Status</th>
            <th className="px-3 py-2">Zeitpunkt</th>
            <th className="px-3 py-2">Gast-ID</th>
          </tr>
        </thead>
        <tbody>
          {predictions.map((prediction) => (
            <tr key={prediction.id} className={[prediction.exact_correct ? "bg-green-50 text-on-surface" : "bg-surface text-on-surface"].join(" ")}>
              <td className="rounded-l-[.9rem] px-3 py-3 font-black">
                {prediction.display_label}
                {prediction.exact_correct ? <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black text-green-700">Exakt</span> : null}
                {!prediction.exact_correct && prediction.tendency_correct ? <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">Tendenz</span> : null}
              </td>
              <td className="px-3 py-3 font-semibold">{prediction.contact_value || "-"}</td>
              <td className={["px-3 py-3 font-black", prediction.has_contact ? "text-green-700" : "text-amber-700"].join(" ")}>
                {prediction.has_contact ? "Kontakt vorhanden" : "Kontakt fehlt"}
              </td>
              <td className="px-3 py-3 font-semibold">{outcomeLabel(prediction.outcome_pick)}</td>
              <td className="px-3 py-3 font-semibold">{prediction.exact_score_text || "-"}</td>
              <td className="px-3 py-3 font-semibold">{parsedScore(prediction)}</td>
              <td className="px-3 py-3 font-semibold">{parseStatusLabel(prediction)}</td>
              <td className="px-3 py-3 font-semibold">{formatDate(prediction.updated_at)}</td>
              <td className="rounded-r-[.9rem] px-3 py-3 font-semibold">{prediction.short_visitor_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
