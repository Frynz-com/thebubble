"use client";

import { useState } from "react";
import {
  BatteryFull,
  Calendar,
  ChevronRight,
  Gift,
  Handshake,
  Home,
  MapPin,
  MessageCircle,
  Radio,
  Signal,
  Sparkles,
  Ticket,
  Trophy,
  Vote,
  Wifi,
} from "lucide-react";
import { getDesignPreset } from "@/lib/bubble-studio/design-presets";
import { formatDate } from "@/lib/bubble-studio/derive";
import { MODULE_REGISTRY, getModule } from "@/lib/bubble-studio/modules";
import type { BubbleDraft, Placement, StudioReward, StudioSponsor } from "@/lib/bubble-studio/types";

/**
 * Die Bubble hat genau 3 Hauptbereiche: Start, Live, Benefits.
 * Das Titelblatt ist die Entry-Seite VOR der Bubble (kein Tab).
 * Sponsoren erscheinen innerhalb der Bereiche — nie als eigener Tab.
 */
export type PreviewScreen = "cover" | "home" | "live" | "benefits";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TB";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function placedSponsors(draft: BubbleDraft, placement: Placement): StudioSponsor[] {
  return draft.sponsors.filter((s) => s.name.trim() && s.placements.includes(placement) && draft.modules.sponsorCards !== false);
}

function placedRewards(draft: BubbleDraft, placement: Placement): StudioReward[] {
  return draft.rewards.filter((r) => r.title.trim() && r.placements.includes(placement));
}

export function MobilePreview({
  draft,
  screen: controlledScreen,
  onScreenChange,
}: {
  draft: BubbleDraft;
  /** Optional vom Wizard gesteuert — Preview springt zum passenden Bereich */
  screen?: PreviewScreen;
  onScreenChange?: (screen: PreviewScreen) => void;
}) {
  const [internalScreen, setInternalScreen] = useState<PreviewScreen>("cover");
  const screen = controlledScreen ?? internalScreen;
  const setScreen = (next: PreviewScreen) => {
    setInternalScreen(next);
    onScreenChange?.(next);
  };

  const preset = getDesignPreset(draft.branding.presetId);
  const primary = draft.branding.primaryColor || preset.defaultPrimary;
  const accent = draft.branding.accentColor || preset.defaultAccent;

  const t = {
    text: preset.appDark ? "text-white" : "text-slate-900",
    subtext: preset.appDark ? "text-white/60" : "text-slate-500",
    faint: preset.appDark ? "text-white/40" : "text-slate-400",
    card: preset.appDark ? "bg-white/[0.07] ring-1 ring-white/10" : "bg-white shadow-sm ring-1 ring-slate-100",
    chip: preset.appDark ? "bg-white/10 text-white/80" : "bg-slate-100 text-slate-500",
  };

  return (
    <div className="mx-auto w-[300px] select-none">
      {/* Vorschau-Auswahl: Titelblatt getrennt von den 3 Bubble-Bereichen */}
      <div className="mb-3 flex items-center justify-center gap-1">
        <PreviewTab label="Titelblatt" active={screen === "cover"} onClick={() => setScreen("cover")} />
        <span className="mx-0.5 h-4 w-px bg-slate-200" />
        <PreviewTab label="Start" active={screen === "home"} onClick={() => setScreen("home")} />
        <PreviewTab label="Live" active={screen === "live"} onClick={() => setScreen("live")} />
        <PreviewTab label="Benefits" active={screen === "benefits"} onClick={() => setScreen("benefits")} />
      </div>

      {/* Phone Frame */}
      <div className="rounded-[3rem] border-[10px] border-slate-900 bg-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
        <div className="relative h-[600px] overflow-hidden rounded-[2.4rem]" style={{ backgroundColor: screen === "cover" ? "#0b1220" : preset.appBg }}>
          <StatusBar dark={screen === "cover" || preset.appDark || screen === "live"} />

          <div className="h-full overflow-y-auto pb-16">
            {screen === "cover" ? <CoverScreen draft={draft} preset={preset} primary={primary} accent={accent} onStart={() => setScreen("home")} /> : null}
            {screen === "home" ? <HomeScreen draft={draft} preset={preset} t={t} primary={primary} accent={accent} onLive={() => setScreen("live")} onBenefits={() => setScreen("benefits")} /> : null}
            {screen === "live" ? <LiveScreen draft={draft} preset={preset} t={t} primary={primary} accent={accent} /> : null}
            {screen === "benefits" ? <BenefitsScreen draft={draft} preset={preset} t={t} primary={primary} accent={accent} /> : null}
          </div>

          {/* Bubble-Navigation: NUR Start / Live / Benefits */}
          {screen !== "cover" ? (
            <div
              className={`absolute inset-x-0 bottom-0 z-10 flex items-center justify-around border-t px-2 py-2.5 backdrop-blur ${
                preset.appDark ? "border-white/10 bg-black/40" : "border-slate-100 bg-white/95"
              }`}
            >
              <NavItem icon={<Home className="h-4 w-4" />} label="Start" active={screen === "home"} color={preset.appDark ? accent : primary} dark={preset.appDark} onClick={() => setScreen("home")} />
              <NavItem icon={<Radio className="h-4 w-4" />} label="Live" active={screen === "live"} color={preset.appDark ? accent : primary} dark={preset.appDark} onClick={() => setScreen("live")} />
              <NavItem icon={<Gift className="h-4 w-4" />} label="Benefits" active={screen === "benefits"} color={preset.appDark ? accent : primary} dark={preset.appDark} onClick={() => setScreen("benefits")} />
            </div>
          ) : null}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">
        {screen === "cover" ? "Titelblatt — die erste Seite nach dem Scan" : "Die Bubble hat genau 3 Bereiche: Start · Live · Benefits"}
      </p>
    </div>
  );
}

/* ---------- Bausteine ---------- */

function PreviewTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
        active ? "bg-slate-900 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );
}

function StatusBar({ dark }: { dark: boolean }) {
  return (
    <div className={`absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 pt-2.5 text-[10px] font-semibold ${dark ? "text-white/90" : "text-slate-700"}`}>
      <span>20:34</span>
      <span className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-900" />
      <span className="flex items-center gap-1">
        <Signal className="h-3 w-3" />
        <Wifi className="h-3 w-3" />
        <BatteryFull className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}

function NavItem({ icon, label, active, color, dark, onClick }: { icon: React.ReactNode; label: string; active: boolean; color: string; dark: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-0.5" style={active ? { color } : { color: dark ? "#8b93a3" : "#94a3b8" }}>
      {icon}
      <span className="text-[9px] font-semibold">{label}</span>
    </button>
  );
}

type Tokens = { text: string; subtext: string; faint: string; card: string; chip: string };
type Preset = ReturnType<typeof getDesignPreset>;

/* ---------- Titelblatt (Entry — kein Tab) ---------- */

function CoverScreen({ draft, preset, primary, accent, onStart }: { draft: BubbleDraft; preset: Preset; primary: string; accent: string; onStart: () => void }) {
  const name = draft.basics.name.trim() || "Deine Bubble";
  const coverSponsors = placedSponsors(draft, "cover");
  const coverDark = preset.id !== "retail_clean";
  const tx = coverDark ? "text-white" : "text-slate-900";
  const sub = coverDark ? "text-white/75" : "text-slate-600";
  const luxe = preset.luxeLabels;

  return (
    <div className="relative flex min-h-full flex-col justify-end p-5 pb-10 pt-16" style={{ background: preset.coverBg(primary, accent) }}>
      {preset.coverTexture ? <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: preset.coverTexture }} /> : null}

      {/* Logo + Eventname */}
      <div className="relative mb-auto flex items-center gap-2.5">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-extrabold backdrop-blur ${
            coverDark ? "bg-white/15 text-white ring-1 ring-white/30" : "text-white"
          }`}
          style={coverDark ? undefined : { backgroundColor: primary }}
        >
          {initials(name)}
        </div>
        <div>
          <p className={`text-sm font-bold leading-tight ${tx}`}>{name}</p>
          {draft.basics.partnerName.trim() ? <p className={`text-[11px] ${coverDark ? "text-white/60" : "text-slate-500"}`}>{draft.basics.partnerName}</p> : null}
        </div>
      </div>

      {/* Ort + Datum */}
      <div className="relative mb-3 mt-8 flex flex-wrap gap-2">
        {draft.basics.location.trim() ? (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${coverDark ? "bg-white/12 text-white ring-1 ring-white/20" : "bg-white text-slate-700 shadow-sm"}`}>
            <MapPin className="h-3 w-3" /> {draft.basics.location}
          </span>
        ) : null}
        {draft.basics.eventDate ? (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${coverDark ? "bg-white/12 text-white ring-1 ring-white/20" : "bg-white text-slate-700 shadow-sm"}`}>
            <Calendar className="h-3 w-3" /> {formatDate(draft.basics.eventDate)}
          </span>
        ) : null}
      </div>

      <h3 className={`relative text-[26px] font-extrabold leading-[1.15] ${luxe ? "tracking-wide" : "tracking-tight"} ${tx}`}>
        {draft.cover.title.trim() || "Willkommen in deiner Bubble"}
      </h3>
      <p className={`relative mt-2 text-[13px] leading-relaxed ${sub}`}>{draft.cover.description.trim() || "Scannen, beitreten, live dabei sein."}</p>

      <button
        type="button"
        onClick={onStart}
        className={`relative mt-5 w-full py-3.5 text-[15px] font-bold text-white shadow-xl ${preset.buttonClass} ${luxe ? "uppercase tracking-widest" : ""}`}
        style={{ backgroundColor: accent }}
      >
        {draft.cover.buttonText.trim() || "Bubble öffnen"}
      </button>

      {/* Partner subtil — kein eigener Bereich */}
      {draft.cover.partnerNote.trim() || coverSponsors.length > 0 ? (
        <div className={`relative mt-4 border-t pt-3 text-center ${coverDark ? "border-white/10" : "border-slate-200"}`}>
          <p className={`text-[10px] uppercase tracking-widest ${coverDark ? "text-white/40" : "text-slate-400"}`}>
            {draft.cover.partnerNote.trim() || "Präsentiert von"}
          </p>
          {coverSponsors.length > 0 ? (
            <p className={`mt-1 text-[12px] font-semibold ${coverDark ? "text-white/70" : "text-slate-600"}`}>{coverSponsors.map((s) => s.name).join(" · ")}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Start ---------- */

const MODULE_ICONS: Record<string, React.ReactNode> = {
  liveVoting: <Vote className="h-4 w-4" />,
  scorePrediction: <Trophy className="h-4 w-4" />,
  giveaway: <Ticket className="h-4 w-4" />,
  community: <MessageCircle className="h-4 w-4" />,
  benefits: <Gift className="h-4 w-4" />,
  sponsorCards: <Handshake className="h-4 w-4" />,
};

function HomeScreen({
  draft,
  preset,
  t,
  primary,
  accent,
  onLive,
  onBenefits,
}: {
  draft: BubbleDraft;
  preset: Preset;
  t: Tokens;
  primary: string;
  accent: string;
  onLive: () => void;
  onBenefits: () => void;
}) {
  const name = draft.basics.name.trim() || "Deine Bubble";

  // Sichtbare Funktionen auf Start: featured zuerst — Fallback: alle aktiven mit Start-Sichtbarkeit
  const featuredIds = draft.home.featuredModules.filter((id) => draft.modules[id]);
  const fallbackIds = MODULE_REGISTRY.filter((m) => draft.modules[m.moduleId] && m.placements.includes("home") && m.status !== "custom").map((m) => m.moduleId);
  const visibleIds = (featuredIds.length > 0 ? featuredIds : fallbackIds).slice(0, 4);
  const homeSponsors = placedSponsors(draft, "home");
  const homeRewards = placedRewards(draft, "home");

  return (
    <div className="pt-10">
      {/* Kopf */}
      <div className="px-4 pb-3 pt-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-extrabold text-white" style={{ backgroundColor: primary }}>
            {initials(name)}
          </div>
          <div className="min-w-0">
            <p className={`truncate text-sm font-extrabold ${t.text}`}>{name}</p>
            <p className="flex items-center gap-1 text-[11px] text-emerald-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live · 127 Leute hier
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4">
        {/* Begrüßung */}
        <div className="rounded-2xl p-4 text-white" style={{ background: preset.panelBg(primary, accent) }}>
          <p className={`text-base font-extrabold ${preset.luxeLabels ? "tracking-wide" : ""}`}>{draft.home.greeting.trim() || "Schön, dass du da bist!"}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-white/75">{draft.home.explainer.trim() || "Hier findest du alles, was heute passiert."}</p>
          <button type="button" onClick={onLive} className={`mt-3 w-full py-2.5 text-[13px] font-bold text-white ${preset.buttonClass}`} style={{ backgroundColor: accent }}>
            {draft.home.buttonText.trim() || "Jetzt teilnehmen"}
          </button>
        </div>

        {/* Aktive Funktionen als Cards */}
        {visibleIds.map((moduleId) => {
          const moduleDef = getModule(moduleId);
          if (!moduleDef) return null;
          const goesTo = moduleDef.placements.includes("benefits") && !moduleDef.placements.includes("live") ? onBenefits : onLive;
          return (
            <button key={moduleId} type="button" onClick={goesTo} className={`flex w-full items-center gap-3 rounded-2xl p-3.5 text-left ${t.card}`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: primary }}>
                {MODULE_ICONS[moduleId] ?? <Sparkles className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[13px] font-bold ${t.text}`}>{moduleDef.name}</span>
                <span className={`block truncate text-[11px] ${t.faint}`}>{moduleDef.visitorSees}</span>
              </span>
              <ChevronRight className={`h-4 w-4 shrink-0 ${t.faint}`} />
            </button>
          );
        })}

        {/* Reward-Hinweis */}
        {homeRewards[0] ? (
          <button type="button" onClick={onBenefits} className="flex w-full items-center gap-3 rounded-2xl p-3.5 text-left text-white" style={{ background: `linear-gradient(140deg, ${accent}, #0b1220 190%)` }}>
            <Gift className="h-5 w-5 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-extrabold">{homeRewards[0].title}</span>
              <span className="block truncate text-[11px] text-white/70">{homeRewards[0].description || "Wartet unter Benefits auf dich"}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/60" />
          </button>
        ) : null}

        {/* Sponsor-Hinweis (Teil der Startseite, kein Tab) */}
        {homeSponsors[0] ? (
          <div className={`rounded-2xl p-3.5 ${t.card}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-widest ${t.faint}`}>Mit Unterstützung von</p>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <p className={`text-[13px] font-bold ${t.text}`}>{homeSponsors[0].name}</p>
              <span className={`px-3 py-1 text-[11px] font-bold text-white ${preset.buttonClass}`} style={{ backgroundColor: primary }}>
                {homeSponsors[0].ctaText || "Mehr"}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- Live ---------- */

function LiveScreen({ draft, preset, t, primary, accent }: { draft: BubbleDraft; preset: Preset; t: Tokens; primary: string; accent: string }) {
  const action = draft.liveAction;
  const liveSponsors = placedSponsors(draft, "live");
  const options = action.options.map((o) => o.trim()).filter(Boolean);
  const typeLabel = action.type === "prediction" ? "Tipp-Spiel" : action.type === "voting" ? "Live Voting" : action.type === "giveaway" ? "Gewinnspiel" : "Challenge";
  const typeIcon =
    action.type === "prediction" ? <Trophy className="h-4 w-4" /> : action.type === "voting" ? <Vote className="h-4 w-4" /> : action.type === "giveaway" ? <Ticket className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />;

  return (
    <div>
      {/* Live-Header */}
      <div className="px-4 pb-8 pt-14 text-white" style={{ background: preset.panelBg(primary, accent) }}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-bold ring-1 ring-white/20">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> LIVE
        </span>
        <p className={`mt-2 text-lg font-extrabold leading-snug ${preset.luxeLabels ? "tracking-wide" : ""}`}>{draft.basics.name.trim() || "Deine Bubble"}</p>
        <p className="text-[11px] text-white/60">843 Teilnahmen bisher</p>
      </div>

      <div className="-mt-4 space-y-3 px-4">
        {/* Live-Aktion */}
        <div className={`rounded-2xl p-4 ${preset.appDark ? "bg-[#141c2f] ring-1 ring-white/10" : "bg-white shadow-[0_10px_30px_rgba(15,23,42,0.10)] ring-1 ring-slate-100"}`}>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: primary }}>
            {typeIcon}
            {typeLabel}
          </span>
          <p className={`mt-2.5 text-[15px] font-extrabold leading-snug ${t.text}`}>{action.question.trim() || "Deine Live-Aktion erscheint hier"}</p>

          {action.type === "voting" && options.length > 0 ? (
            <div className="mt-3 space-y-1.5">
              {options.map((option, index) => {
                const pct = [46, 33, 21, 12, 8, 5][index] ?? 5;
                return (
                  <div key={`${index}-${option}`} className={`relative overflow-hidden rounded-xl border px-3 py-2.5 ${preset.appDark ? "border-white/10" : "border-slate-200"}`}>
                    <div className="absolute inset-y-0 left-0 opacity-20" style={{ width: `${pct}%`, backgroundColor: accent }} />
                    <div className="relative flex items-center justify-between">
                      <span className={`text-[13px] font-semibold ${t.text}`}>{option}</span>
                      <span className={`text-[11px] font-bold ${t.faint}`}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {action.type === "prediction" ? (
            <div className="mt-3 flex items-center justify-center gap-3">
              <div className={`flex-1 rounded-xl py-3 text-center ${preset.appDark ? "bg-white/10" : "bg-slate-100"}`}>
                <p className={`text-lg font-extrabold ${t.text}`}>2</p>
                <p className={`text-[10px] font-semibold ${t.faint}`}>HEIM</p>
              </div>
              <span className={`text-lg font-extrabold ${t.faint}`}>:</span>
              <div className={`flex-1 rounded-xl py-3 text-center ${preset.appDark ? "bg-white/10" : "bg-slate-100"}`}>
                <p className={`text-lg font-extrabold ${t.text}`}>1</p>
                <p className={`text-[10px] font-semibold ${t.faint}`}>GAST</p>
              </div>
            </div>
          ) : null}

          {(action.type === "challenge" || action.type === "giveaway") && action.hint.trim() ? (
            <p className={`mt-2.5 rounded-xl px-3 py-2 text-[12px] ${preset.appDark ? "bg-white/5 text-white/70" : "bg-slate-50 text-slate-500"}`}>{action.hint}</p>
          ) : null}
          {action.type !== "challenge" && action.type !== "giveaway" && action.hint.trim() ? <p className={`mt-2.5 text-[11px] ${t.faint}`}>{action.hint}</p> : null}

          <button type="button" className={`mt-3 w-full py-3 text-[14px] font-bold text-white shadow ${preset.buttonClass} ${preset.luxeLabels ? "uppercase tracking-widest" : ""}`} style={{ backgroundColor: accent }}>
            {action.buttonText.trim() || "Teilnehmen"}
          </button>
        </div>

        {/* Erfolgs-Vorschau */}
        {action.successMessage.trim() ? (
          <div className={`rounded-2xl p-3.5 ${preset.appDark ? "bg-emerald-500/10 ring-1 ring-emerald-400/20" : "bg-emerald-50 ring-1 ring-emerald-100"}`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-500">Nach der Teilnahme</p>
            <p className={`mt-0.5 text-[13px] font-semibold ${preset.appDark ? "text-emerald-200" : "text-emerald-900"}`}>{action.successMessage}</p>
          </div>
        ) : null}

        {/* Sponsor im Live-Kontext — kein Tab */}
        {liveSponsors[0] ? (
          <div className={`flex items-center gap-2.5 rounded-2xl p-3 ${t.card}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold text-white" style={{ backgroundColor: primary }}>
              {initials(liveSponsors[0].name)}
            </span>
            <p className={`min-w-0 flex-1 truncate text-[11px] ${t.subtext}`}>
              {typeLabel} präsentiert von <span className={`font-bold ${t.text}`}>{liveSponsors[0].name}</span>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- Benefits (inkl. Partner-Karten) ---------- */

const REWARD_STATUS = [
  { label: "Verfügbar", className: "bg-emerald-500/15 text-emerald-500 ring-emerald-500/30" },
  { label: "Einlösbar", className: "bg-blue-500/15 text-blue-400 ring-blue-500/30" },
  { label: "Geholt", className: "bg-slate-500/15 text-slate-400 ring-slate-500/30" },
];

function BenefitsScreen({ draft, preset, t, primary, accent }: { draft: BubbleDraft; preset: Preset; t: Tokens; primary: string; accent: string }) {
  const rewards = placedRewards(draft, "benefits");
  const benefitSponsors = placedSponsors(draft, "benefits");

  return (
    <div className="px-4 pt-14">
      <h4 className={`text-lg font-extrabold ${preset.luxeLabels ? "tracking-wide" : ""} ${t.text}`}>Deine Benefits</h4>
      <p className={`text-[12px] ${t.faint}`}>Vorteile sichern und direkt vor Ort einlösen</p>

      <div className="mt-3 space-y-3">
        {rewards.length === 0 ? (
          <div className={`rounded-2xl border-2 border-dashed p-6 text-center ${preset.appDark ? "border-white/10" : "border-slate-200"}`}>
            <Gift className={`mx-auto h-6 w-6 ${t.faint}`} />
            <p className={`mt-1.5 text-[13px] font-semibold ${t.faint}`}>Noch keine Rewards angelegt</p>
          </div>
        ) : (
          rewards.map((rewardItem, index) => {
            const status = REWARD_STATUS[index % REWARD_STATUS.length];
            const sponsorName = draft.sponsors.find((s) => s.id === rewardItem.sponsorId)?.name;
            return (
              <div key={rewardItem.id} className={`overflow-hidden rounded-2xl ${t.card}`}>
                <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${primary}, ${accent})` }} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-[14px] font-extrabold ${t.text}`}>{rewardItem.title}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${status.className}`}>{status.label}</span>
                  </div>
                  {rewardItem.description.trim() ? <p className={`mt-0.5 text-[12px] ${t.subtext}`}>{rewardItem.description}</p> : null}
                  <div className={`mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] ${t.faint}`}>
                    {sponsorName ? <span className={`font-semibold ${t.subtext}`}>von {sponsorName}</span> : null}
                    {rewardItem.availableFrom.trim() ? <span>{rewardItem.availableFrom}</span> : null}
                  </div>
                  {rewardItem.redemptionHint.trim() ? (
                    <p className={`mt-2 rounded-xl px-3 py-2 text-[11px] ${preset.appDark ? "bg-white/5 text-white/60" : "bg-slate-50 text-slate-500"}`}>{rewardItem.redemptionHint}</p>
                  ) : null}
                </div>
              </div>
            );
          })
        )}

        {/* Partner-Karten — Teil der Benefits, KEIN eigener Tab */}
        {benefitSponsors.length > 0 ? (
          <>
            <p className={`pt-2 text-[10px] font-bold uppercase tracking-widest ${t.faint}`}>Unsere Partner</p>
            {benefitSponsors.map((sponsorItem) => {
              const sponsorRewards = draft.rewards.filter((r) => r.sponsorId === sponsorItem.id && r.title.trim());
              return (
                <div key={sponsorItem.id} className={`overflow-hidden rounded-2xl ${t.card}`}>
                  <div className="flex items-center gap-3 p-4 pb-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-extrabold text-white" style={{ backgroundColor: primary }}>
                      {initials(sponsorItem.name)}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[13px] font-extrabold ${t.text}`}>{sponsorItem.name}</p>
                      <p className={`text-[11px] ${t.faint}`}>Offizieller Partner</p>
                    </div>
                  </div>
                  {sponsorItem.offer.trim() ? <p className={`px-4 text-[12px] leading-relaxed ${t.subtext}`}>{sponsorItem.offer}</p> : null}
                  {sponsorRewards.length > 0 ? (
                    <div className="mt-2 space-y-1.5 px-4">
                      {sponsorRewards.map((r) => (
                        <div key={r.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${preset.appDark ? "bg-white/5" : "bg-slate-50"}`}>
                          <Gift className={`h-3.5 w-3.5 shrink-0 ${t.faint}`} />
                          <span className={`text-[12px] font-semibold ${t.subtext}`}>{r.title}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="p-4 pt-2.5">
                    <button type="button" className={`w-full py-2.5 text-[13px] font-bold text-white ${preset.buttonClass} ${preset.luxeLabels ? "uppercase tracking-widest" : ""}`} style={{ backgroundColor: primary }}>
                      {sponsorItem.ctaText || "Mehr erfahren"}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        ) : null}
      </div>
    </div>
  );
}
