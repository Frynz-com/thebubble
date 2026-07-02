"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CircleCheck, CircleDashed, ImageIcon, Link2, Plus, Radio, Rocket, Save, Trash2, X } from "lucide-react";
import { DESIGN_PRESETS } from "@/lib/bubble-studio/design-presets";
import {
  buildBubbleConfigFromDraft,
  buildTrackingLinks,
  createDraftFromTemplate,
  deriveLaunchChecklist,
  slugify,
} from "@/lib/bubble-studio/derive";
import { MODULE_REGISTRY, getModule } from "@/lib/bubble-studio/modules";
import { TRACKING_SOURCES } from "@/lib/bubble-studio/template-presets";
import type { BubbleDraft, BubbleStatus, BubbleTemplateId, LiveActionType, TrackingSourceKey } from "@/lib/bubble-studio/types";
import { MobilePreview, type PreviewScreen } from "./mobile-preview";
import { StepModules } from "./step-modules";
import { StepRewards, StepSponsors } from "./step-sponsors-rewards";
import { StepTemplates } from "./step-templates";
import { Checkbox, CopyButton, FieldLabel, SectionCard, StepIntro, Toggle, inputClass } from "./ui";

const STEPS = [
  "Vorlage",
  "Grunddaten",
  "Titelblatt",
  "Startseite",
  "Live-Aktion",
  "Rewards",
  "Sponsoren",
  "Module",
  "QR & Tracking",
  "Rechtliches",
  "Launch",
];

export function BubbleWizard({
  initialDraft,
  onFinish,
  onCancel,
}: {
  initialDraft?: BubbleDraft;
  onFinish: (draft: BubbleDraft) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<BubbleDraft>(initialDraft ?? createDraftFromTemplate(null));
  const [linkTouched, setLinkTouched] = useState(Boolean(initialDraft?.basics.bubbleLink));

  // Die Vorschau springt automatisch zu dem Bubble-Bereich, den man gerade bearbeitet.
  const [previewScreen, setPreviewScreen] = useState<PreviewScreen>("cover");
  useEffect(() => {
    const stepToScreen: PreviewScreen[] = ["cover", "cover", "cover", "home", "live", "benefits", "benefits", "home", "cover", "home", "cover"];
    setPreviewScreen(stepToScreen[step] ?? "cover");
  }, [step]);

  const checklist = useMemo(() => deriveLaunchChecklist(draft), [draft]);

  function patch(partial: Partial<BubbleDraft>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function selectTemplate(id: BubbleTemplateId) {
    setDraft((prev) => {
      const fresh = createDraftFromTemplate(id);
      return { ...fresh, basics: { ...fresh.basics, ...prev.basics, expectedVisitors: prev.basics.expectedVisitors || fresh.basics.expectedVisitors } };
    });
  }

  function finishWith(status: BubbleStatus) {
    onFinish({
      ...draft,
      status,
      basics: { ...draft.basics, bubbleLink: draft.basics.bubbleLink || slugify(draft.basics.name) },
    });
  }

  const canContinue = step === 0 ? draft.templateId !== null : step === 1 ? draft.basics.name.trim().length > 0 : true;

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Kopf */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Neue Bubble erstellen</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Schritt {step + 1} von {STEPS.length}: {STEPS[step]} — du baust deine Bubble Seite für Seite.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:text-slate-900"
          aria-label="Wizard schließen"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Stepper */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => index < step && setStep(index)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              index === step
                ? "bg-slate-900 text-white"
                : index < step
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-white text-slate-400 ring-1 ring-slate-200"
            }`}
          >
            {index < step ? <Check className="h-3 w-3" /> : <span>{index + 1}</span>}
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-5">
          {step === 0 ? <StepTemplates selected={draft.templateId} onSelect={selectTemplate} /> : null}
          {step === 1 ? <StepBasics draft={draft} patch={patch} linkTouched={linkTouched} setLinkTouched={setLinkTouched} /> : null}
          {step === 2 ? <StepCover draft={draft} patch={patch} /> : null}
          {step === 3 ? <StepHome draft={draft} patch={patch} /> : null}
          {step === 4 ? <StepLiveAction draft={draft} patch={patch} /> : null}
          {step === 5 ? <StepRewards draft={draft} patch={patch} /> : null}
          {step === 6 ? <StepSponsors draft={draft} patch={patch} /> : null}
          {step === 7 ? <StepModules draft={draft} patch={patch} /> : null}
          {step === 8 ? <StepTracking draft={draft} patch={patch} /> : null}
          {step === 9 ? <StepLegal draft={draft} patch={patch} /> : null}
          {step === 10 ? (
            <StepLaunch
              draft={draft}
              checklist={checklist}
              onSaveDraft={() => finishWith("draft")}
              onPreview={() => finishWith("preview")}
              onLaunch={() => finishWith("live")}
            />
          ) : null}

          {/* Navigation */}
          {step < STEPS.length - 1 ? (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => (step === 0 ? onCancel() : setStep(step - 1))}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" /> Zurück
              </button>
              <button
                type="button"
                disabled={!canContinue}
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-700 disabled:opacity-40"
              >
                Weiter <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>

        {/* Sticky Live-Preview auf Desktop — folgt dem aktuellen Schritt */}
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <MobilePreview draft={draft} screen={previewScreen} onScreenChange={setPreviewScreen} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Schritt 2: Grunddaten ---------- */

function StepBasics({
  draft,
  patch,
  linkTouched,
  setLinkTouched,
}: {
  draft: BubbleDraft;
  patch: (p: Partial<BubbleDraft>) => void;
  linkTouched: boolean;
  setLinkTouched: (v: boolean) => void;
}) {
  const basics = draft.basics;
  const previewLink = basics.bubbleLink || slugify(basics.name) || "deine-bubble";

  return (
    <SectionCard title="Grunddaten">
      <StepIntro text="Die Eckdaten deines Events. Aus dem Namen entsteht automatisch der Link zur Bubble — er wird später als QR-Code verwendet." />
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldLabel label="Bubble Name">
          <input
            className={inputClass}
            value={basics.name}
            placeholder="z.B. Sommerfest Musterstadt 2026"
            onChange={(e) => {
              const name = e.target.value;
              patch({ basics: { ...basics, name, bubbleLink: linkTouched ? basics.bubbleLink : slugify(name) } });
            }}
          />
        </FieldLabel>
        <FieldLabel label="Kunde / Partner">
          <input className={inputClass} value={basics.partnerName} placeholder="z.B. Stadtwerke Musterstadt" onChange={(e) => patch({ basics: { ...basics, partnerName: e.target.value } })} />
        </FieldLabel>
        <FieldLabel label="Eventdatum">
          <input type="date" className={inputClass} value={basics.eventDate} onChange={(e) => patch({ basics: { ...basics, eventDate: e.target.value } })} />
        </FieldLabel>
        <FieldLabel label="Ort">
          <input className={inputClass} value={basics.location} placeholder="z.B. Marktplatz Musterstadt" onChange={(e) => patch({ basics: { ...basics, location: e.target.value } })} />
        </FieldLabel>
        <FieldLabel label="Besucher-Schätzung">
          <select className={inputClass} value={basics.expectedVisitors} onChange={(e) => patch({ basics: { ...basics, expectedVisitors: e.target.value } })}>
            <option value="">Bitte wählen</option>
            <option value="<100">Unter 100</option>
            <option value="100-500">100 bis 500</option>
            <option value="500-2000">500 bis 2.000</option>
            <option value="2000-10000">2.000 bis 10.000</option>
            <option value=">10000">Über 10.000</option>
          </select>
        </FieldLabel>
        <FieldLabel label="Link zur Bubble" hint="Der Link wird später als QR-Code verwendet.">
          <input
            className={inputClass}
            value={basics.bubbleLink}
            placeholder="sommerfest-musterstadt"
            onChange={(e) => {
              setLinkTouched(true);
              patch({ basics: { ...basics, bubbleLink: slugify(e.target.value) } });
            }}
          />
        </FieldLabel>
      </div>
      <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-slate-900 px-4 py-3 text-white">
        <Link2 className="h-4 w-4 shrink-0 text-blue-300" />
        <p className="min-w-0 truncate text-[13px]">
          <span className="text-white/60">Dein Bubble-Link wird: </span>
          <span className="font-bold">app.yourbubble.app/{previewLink}</span>
        </p>
      </div>
    </SectionCard>
  );
}

/* ---------- Schritt 3: Titelblatt ---------- */

function StepCover({ draft, patch }: { draft: BubbleDraft; patch: (p: Partial<BubbleDraft>) => void }) {
  const cover = draft.cover;
  const set = (key: keyof BubbleDraft["cover"], value: string) => patch({ cover: { ...cover, [key]: value } });

  return (
    <SectionCard title="Titelblatt & Design-Stil">
      <StepIntro text="Das ist die erste Seite, die Besucher nach dem Scan sehen — noch vor der Bubble. Ein starkes Titelblatt entscheidet, ob jemand weitermacht." />

      {/* Design-Stil */}
      <div className="mb-5">
        <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Design-Stil</span>
        <span className="mb-2.5 block text-xs text-slate-400">Verändert Stimmung, Layout und Hierarchie der ganzen Bubble — die Vorschau reagiert sofort.</span>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {DESIGN_PRESETS.map((preset) => {
            const active = draft.branding.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  patch({
                    branding: { ...draft.branding, presetId: preset.id, primaryColor: preset.defaultPrimary, accentColor: preset.defaultAccent },
                  })
                }
                className={`overflow-hidden rounded-2xl border text-left transition ${
                  active ? "border-slate-900 shadow-lg ring-2 ring-slate-900" : "border-slate-200 bg-white hover:border-slate-400"
                }`}
              >
                <div className="h-12" style={{ background: preset.coverBg(preset.defaultPrimary, preset.defaultAccent) }} />
                <div className="p-2.5">
                  <p className="text-[12px] font-extrabold text-slate-900">{preset.name}</p>
                  <p className="text-[10px] leading-snug text-slate-400">Geeignet für: {preset.suitedFor}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <UploadPlaceholder label="Titelbild / Standortbild" hint="Querformat, min. 1600px — Upload folgt beim Andocken" />
        <UploadPlaceholder label="Logo" hint="Quadratisch, PNG/SVG — Upload folgt beim Andocken" />
        <ColorField label="Hauptfarbe" value={draft.branding.primaryColor} onChange={(v) => patch({ branding: { ...draft.branding, primaryColor: v } })} />
        <ColorField label="Akzentfarbe (Buttons)" value={draft.branding.accentColor} onChange={(v) => patch({ branding: { ...draft.branding, accentColor: v } })} />
      </div>
      <div className="mt-4 space-y-4">
        <FieldLabel label="Titel" hint="Die große Überschrift auf dem Titelblatt.">
          <input className={inputClass} value={cover.title} onChange={(e) => set("title", e.target.value)} />
        </FieldLabel>
        <FieldLabel label="Kurzer Beschreibungstext" hint="Ein bis zwei Sätze: Was können Besucher hier machen?">
          <textarea className={`${inputClass} min-h-[70px]`} value={cover.description} onChange={(e) => set("description", e.target.value)} />
        </FieldLabel>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldLabel label="Hauptbutton" hint="Der wichtigste Button der ganzen Bubble.">
            <input className={inputClass} value={cover.buttonText} onChange={(e) => set("buttonText", e.target.value)} />
          </FieldLabel>
          <FieldLabel label="Partnerhinweis" hint="Kleine Zeile unten, z.B. „Präsentiert von …“">
            <input className={inputClass} value={cover.partnerNote} onChange={(e) => set("partnerNote", e.target.value)} />
          </FieldLabel>
        </div>
      </div>
    </SectionCard>
  );
}

function UploadPlaceholder({ label, hint }: { label: string; hint: string }) {
  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">{label}</span>
      <div className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
        <ImageIcon className="h-6 w-6" />
        <span className="text-xs font-medium">Upload im Prototyp deaktiviert</span>
      </div>
      <span className="mt-1 block text-xs text-slate-400">{hint}</span>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <FieldLabel label={label}>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-14 cursor-pointer rounded-xl border border-slate-200 bg-white p-1" />
        <input className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </FieldLabel>
  );
}

/* ---------- Schritt 4: Startseite ---------- */

function StepHome({ draft, patch }: { draft: BubbleDraft; patch: (p: Partial<BubbleDraft>) => void }) {
  const home = draft.home;
  const set = (key: "greeting" | "explainer" | "buttonText", value: string) => patch({ home: { ...home, [key]: value } });
  const enabledModules = MODULE_REGISTRY.filter((m) => draft.modules[m.moduleId] && m.status !== "custom");

  function toggleFeatured(moduleId: string) {
    const active = home.featuredModules.includes(moduleId);
    patch({ home: { ...home, featuredModules: active ? home.featuredModules.filter((id) => id !== moduleId) : [...home.featuredModules, moduleId] } });
  }

  return (
    <SectionCard title="Startseite">
      <StepIntro text="Hier verstehen Besucher sofort, was sie in der Bubble machen können. Kurz begrüßen, kurz erklären, dann direkt zur Aktion." />
      <div className="space-y-4">
        <FieldLabel label="Begrüßung">
          <input className={inputClass} value={home.greeting} onChange={(e) => set("greeting", e.target.value)} />
        </FieldLabel>
        <FieldLabel label="Kurze Erklärung" hint="Was passiert heute in dieser Bubble?">
          <textarea className={`${inputClass} min-h-[70px]`} value={home.explainer} onChange={(e) => set("explainer", e.target.value)} />
        </FieldLabel>
        <FieldLabel label="Start-Button">
          <input className={inputClass} value={home.buttonText} onChange={(e) => set("buttonText", e.target.value)} />
        </FieldLabel>
        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Prominent auf der Startseite</span>
          <span className="mb-2 block text-xs text-slate-400">Diese Module erscheinen als Karten direkt auf der Startseite.</span>
          {enabledModules.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-400">Aktiviere zuerst Module im Schritt „Module“.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {enabledModules.map((module) => {
                const active = home.featuredModules.includes(module.moduleId);
                return (
                  <button
                    key={module.moduleId}
                    type="button"
                    onClick={() => toggleFeatured(module.moduleId)}
                    className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                      active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {module.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

/* ---------- Schritt 5: Live-Aktion ---------- */

const ACTION_TYPES: { key: LiveActionType; label: string; description: string; examples: string[]; sponsorValue: string }[] = [
  {
    key: "voting",
    label: "Voting",
    description: "Besucher stimmen über eine Frage ab. Gut für Fan-Votings, Meinungen und schnelle Interaktion.",
    examples: ["Wer wird Player of the Match?", "Welcher Song soll als nächstes laufen?", "Welches Produkt sollen wir verlosen?"],
    sponsorValue: "Der Sponsor kann das Voting präsentieren — jede Stimme ist ein messbarer Kontaktmoment.",
  },
  {
    key: "prediction",
    label: "Tipp-Spiel",
    description: "Besucher tippen ein Ergebnis. Gut für Sportevents und Public Viewing.",
    examples: ["Wie endet das Spiel?", "Wer schießt das nächste Tor?", "Wie viele Punkte macht das Heimteam?"],
    sponsorValue: "Der Sponsor stiftet den Preis für den besten Tipp — maximale Sichtbarkeit bei jeder Teilnahme.",
  },
  {
    key: "challenge",
    label: "Challenge",
    description: "Besucher erfüllen eine Aufgabe vor Ort. Gut für Sponsorstände, Festivalaktionen und Check-ins.",
    examples: ["Mach ein Foto am Sponsor-Stand.", "Zeige diesen Screen an der Bar.", "Finde den Code am Eingang."],
    sponsorValue: "Bringt Besucher physisch zur Sponsor-Fläche — der direkteste Weg zu echten Kontakten.",
  },
  {
    key: "giveaway",
    label: "Gewinnspiel",
    description: "Besucher nehmen an einer Verlosung teil. Gut für Lead Capture und Sponsor-Aktivierung.",
    examples: ["Gewinne ein Trikot.", "Gewinne einen Getränkegutschein.", "Gewinne VIP-Tickets."],
    sponsorValue: "Der stärkste Scan-Grund — und die sauberste Quelle für freiwillige Sponsor-Leads.",
  },
];

function StepLiveAction({ draft, patch }: { draft: BubbleDraft; patch: (p: Partial<BubbleDraft>) => void }) {
  const action = draft.liveAction;
  const set = (partial: Partial<BubbleDraft["liveAction"]>) => patch({ liveAction: { ...action, ...partial } });
  const activeType = ACTION_TYPES.find((t) => t.key === action.type) ?? ACTION_TYPES[0];

  function selectType(key: LiveActionType) {
    const nextOptions = key === "voting" && action.options.filter((o) => o.trim()).length === 0 ? ["Option A", "Option B"] : action.options;
    set({ type: key, options: nextOptions });
  }

  return (
    <SectionCard title="Live-Aktion">
      <StepIntro text="Das ist die wichtigste Interaktion deiner Bubble. Wähle zuerst die Art der Aktion — die Vorschau rechts zeigt sofort, was Besucher im Live-Bereich sehen." />

      {/* Aktionsart wählen */}
      <div className="mb-5 grid gap-2.5 sm:grid-cols-2">
        {ACTION_TYPES.map((type) => {
          const active = action.type === type.key;
          return (
            <button
              key={type.key}
              type="button"
              onClick={() => selectType(type.key)}
              className={`rounded-2xl border p-4 text-left transition ${active ? "border-slate-900 bg-slate-900 text-white shadow-lg" : "border-slate-200 bg-white hover:border-slate-400"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm font-extrabold ${active ? "text-white" : "text-slate-900"}`}>{type.label}</p>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${active ? "bg-white/15 text-white/80" : "bg-slate-100 text-slate-400"}`}>
                  <Radio className="h-3 w-3" /> Live-Bereich
                </span>
              </div>
              <p className={`mt-1 text-xs leading-snug ${active ? "text-white/75" : "text-slate-500"}`}>{type.description}</p>
              <p className={`mt-2 text-[11px] italic ${active ? "text-white/60" : "text-slate-400"}`}>z.B. „{type.examples[0]}“</p>
            </button>
          );
        })}
      </div>

      {/* Sponsor-Wert der gewählten Aktionsart */}
      <div className="mb-5 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
        <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">Warum das für Sponsoren wertvoll ist</p>
        <p className="mt-0.5 text-[13px] text-emerald-900">{activeType.sponsorValue}</p>
      </div>

      <div className="space-y-4">
        <FieldLabel label="Frage / Aufgabe" hint={`Beispiele: ${activeType.examples.join(" · ")}`}>
          <input className={inputClass} value={action.question} placeholder={activeType.examples[0]} onChange={(e) => set({ question: e.target.value })} />
        </FieldLabel>
        {action.type === "voting" ? (
          <FieldLabel label="Antwortoptionen" hint="Eine Option pro Zeile, maximal 6 — die Vorschau zeigt sie sofort mit Live-Balken.">
            <textarea
              className={`${inputClass} min-h-[90px]`}
              value={action.options.join("\n")}
              onChange={(e) => set({ options: e.target.value.split("\n").slice(0, 6) })}
            />
          </FieldLabel>
        ) : (
          <FieldLabel label={action.type === "prediction" ? "Tipp-Hinweis" : "Teilnahme-Hinweis"} hint="Kurzer Hinweis, wie oder bis wann teilgenommen wird.">
            <input className={inputClass} value={action.hint} onChange={(e) => set({ hint: e.target.value })} />
          </FieldLabel>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldLabel label="Teilnahme-Button">
            <input className={inputClass} value={action.buttonText} onChange={(e) => set({ buttonText: e.target.value })} />
          </FieldLabel>
          <FieldLabel label="Erfolgsmeldung" hint="Was sehen Teilnehmer direkt nach der Teilnahme?">
            <input className={inputClass} value={action.successMessage} onChange={(e) => set({ successMessage: e.target.value })} />
          </FieldLabel>
        </div>
      </div>
    </SectionCard>
  );
}

/* ---------- Schritt 9: QR & Tracking ---------- */

function StepTracking({ draft, patch }: { draft: BubbleDraft; patch: (p: Partial<BubbleDraft>) => void }) {
  const tracking = draft.tracking;
  const links = buildTrackingLinks(draft.basics.bubbleLink || slugify(draft.basics.name), tracking.sources, tracking.customSources);

  function toggleSource(key: TrackingSourceKey) {
    const active = tracking.sources.includes(key);
    patch({ tracking: { ...tracking, sources: active ? tracking.sources.filter((s) => s !== key) : [...tracking.sources, key] } });
  }

  function addCustomSource() {
    patch({ tracking: { ...tracking, customSources: [...tracking.customSources, { key: `standort-${tracking.customSources.length + 1}`, label: "", purpose: "" }] } });
  }

  function updateCustomSource(index: number, label: string) {
    const next = tracking.customSources.map((c, i) => (i === index ? { ...c, label, key: slugify(label) || `standort-${i + 1}` } : c));
    patch({ tracking: { ...tracking, customSources: next } });
  }

  function removeCustomSource(index: number) {
    patch({ tracking: { ...tracking, customSources: tracking.customSources.filter((_, i) => i !== index) } });
  }

  return (
    <div className="space-y-5">
      <SectionCard title="QR-Standorte wählen">
        <StepIntro text="Jeder QR-Code kann später zeigen, welcher Standort funktioniert: Eingang, Bar, Screen … So weißt du nach dem Event genau, wo gescannt wurde." />
        <div className="grid gap-2.5 sm:grid-cols-2">
          {TRACKING_SOURCES.map((source) => {
            const active = tracking.sources.includes(source.key);
            return (
              <button
                key={source.key}
                type="button"
                onClick={() => toggleSource(source.key)}
                className={`rounded-2xl border p-3.5 text-left transition ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-400"}`}
              >
                <p className={`text-sm font-bold ${active ? "text-white" : "text-slate-900"}`}>{source.label}</p>
                <p className={`mt-1 text-xs leading-snug ${active ? "text-white/70" : "text-slate-500"}`}>{source.purpose}</p>
              </button>
            );
          })}
        </div>

        {/* Custom Sources */}
        <div className="mt-4 space-y-2">
          {tracking.customSources.map((source, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                className={inputClass}
                value={source.label}
                placeholder="Eigener Standort, z.B. VIP-Bereich"
                onChange={(e) => updateCustomSource(index, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeCustomSource(index)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-slate-400 ring-1 ring-slate-200 transition hover:bg-red-50 hover:text-red-600"
                aria-label="Standort entfernen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addCustomSource}
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
          >
            <Plus className="h-3.5 w-3.5" /> Eigenen Standort hinzufügen
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Deine Tracking-Links" subtitle="Kopieren, als QR-Code drucken, am Standort platzieren — die Zuordnung läuft automatisch.">
        <div className="space-y-2.5">
          {links.map((link) => (
            <div key={link.key} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-slate-900">{link.label}</p>
                <p className="text-xs text-slate-500">{link.purpose}</p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">{link.url}</p>
              </div>
              <CopyButton value={link.url} label="Link kopieren" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* ---------- Schritt 10: Rechtliches & Sicherheit ---------- */

function StepLegal({ draft, patch }: { draft: BubbleDraft; patch: (p: Partial<BubbleDraft>) => void }) {
  const legal = draft.legal;
  const set = (partial: Partial<BubbleDraft["legal"]>) => patch({ legal: { ...legal, ...partial } });

  return (
    <SectionCard title="Rechtliches & Sicherheit">
      <StepIntro text="Damit Gewinnspiele und Kontaktabfragen sauber vorbereitet sind. Die Links erscheinen im Footer jeder Bubble-Seite." />
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldLabel label="Datenschutz-Link">
            <input className={inputClass} value={legal.privacyUrl} placeholder="https://…/datenschutz" onChange={(e) => set({ privacyUrl: e.target.value })} />
          </FieldLabel>
          <FieldLabel label="Impressum-Link">
            <input className={inputClass} value={legal.imprintUrl} placeholder="https://…/impressum" onChange={(e) => set({ imprintUrl: e.target.value })} />
          </FieldLabel>
        </div>
        <FieldLabel label="Teilnahmebedingungen-Link" hint="Nötig, sobald ein Gewinnspiel läuft.">
          <input className={inputClass} value={legal.termsUrl} placeholder="https://…/teilnahmebedingungen" onChange={(e) => set({ termsUrl: e.target.value })} />
        </FieldLabel>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Community aktiv</p>
              <p className="text-xs text-slate-500">Gäste können Beiträge an die Live-Pinnwand schreiben — gekoppelt an die Funktion „Community Light“.</p>
            </div>
            <Toggle
              checked={legal.communityEnabled}
              onChange={(next) => patch({ legal: { ...legal, communityEnabled: next }, modules: { ...draft.modules, community: next } })}
            />
          </div>
          {legal.communityEnabled ? (
            <FieldLabel label="Community Safety Hinweis" hint="Wird über der Pinnwand angezeigt.">
              <textarea className={`${inputClass} min-h-[60px]`} value={legal.communityNote} onChange={(e) => set({ communityNote: e.target.value })} />
            </FieldLabel>
          ) : null}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Kontaktabfrage aktiv</p>
              <p className="text-xs text-slate-500">Gäste können freiwillig ihre Kontaktdaten für Sponsor-Angebote hinterlassen.</p>
            </div>
            <Toggle checked={legal.leadCaptureEnabled} onChange={(next) => set({ leadCaptureEnabled: next })} />
          </div>
        </div>

        <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
          <Checkbox checked={legal.termsChecked} onChange={(next) => set({ termsChecked: next })} label="Teilnahmebedingungen geprüft — ich habe die rechtlichen Texte für dieses Event kontrolliert." />
        </div>
      </div>
    </SectionCard>
  );
}

/* ---------- Schritt 11: Preview & Launch ---------- */

function StepLaunch({
  draft,
  checklist,
  onSaveDraft,
  onPreview,
  onLaunch,
}: {
  draft: BubbleDraft;
  checklist: ReturnType<typeof deriveLaunchChecklist>;
  onSaveDraft: () => void;
  onPreview: () => void;
  onLaunch: () => void;
}) {
  const payload = useMemo(() => buildBubbleConfigFromDraft(draft), [draft]);
  const featuredNames = draft.home.featuredModules.map((id) => getModule(id)?.name).filter(Boolean);

  return (
    <div className="space-y-5">
      {/* Mobile Preview auf kleinen Screens (Desktop hat die Sticky-Spalte) */}
      <div className="lg:hidden">
        <MobilePreview draft={draft} />
      </div>

      {/* Zusammenfassung */}
      <SectionCard title="Zusammenfassung">
        <div className="grid gap-3 text-[13px] sm:grid-cols-2">
          <SummaryRow label="Bubble" value={draft.basics.name || "—"} />
          <SummaryRow label="Link" value={`app.yourbubble.app/${draft.basics.bubbleLink || slugify(draft.basics.name) || "…"}`} />
          <SummaryRow label="Live-Aktion" value={ACTION_TYPES.find((t) => t.key === draft.liveAction.type)?.label ?? "—"} />
          <SummaryRow label="Startseiten-Module" value={featuredNames.join(", ") || "—"} />
          <SummaryRow label="Sponsoren" value={draft.sponsors.filter((s) => s.name.trim()).map((s) => s.name).join(", ") || "Keine"} />
          <SummaryRow label="Rewards" value={draft.rewards.filter((r) => r.title.trim()).map((r) => r.title).join(", ") || "Keine"} />
        </div>
      </SectionCard>

      <SectionCard title="Launch Checklist" subtitle="Alles Grün? Dann kann die Bubble live gehen.">
        <div className="space-y-2">
          {checklist.items.map((item) => (
            <div key={item.key} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
              {item.done ? <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> : <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />}
              <div>
                <p className={`text-sm font-bold ${item.done ? "text-slate-900" : "text-slate-500"}`}>{item.label}</p>
                <p className="text-xs text-slate-400">{item.hint}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={onSaveDraft}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:ring-slate-400"
          >
            <Save className="h-4 w-4" /> Als Entwurf speichern
          </button>
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-slate-200"
          >
            Vorschau öffnen
          </button>
          <button
            type="button"
            disabled={!checklist.readyToLaunch}
            onClick={onLaunch}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-500 disabled:opacity-40"
          >
            <Rocket className="h-4 w-4" /> Live schalten
          </button>
        </div>
        {!checklist.readyToLaunch ? <p className="mt-2 text-center text-xs text-slate-400">„Live schalten“ wird aktiv, sobald die Checklist vollständig ist.</p> : null}
        <p className="mt-3 text-center text-[11px] text-slate-300">Prototyp-Modus: Es wird nichts dauerhaft gespeichert.</p>
      </SectionCard>

      <details className="rounded-3xl bg-slate-900 p-5 text-white">
        <summary className="cursor-pointer text-sm font-bold">Technische Vorschau für spätere Integration</summary>
        <p className="mt-2 text-xs text-white/60">
          Diese Struktur geht später an die bestehende Admin-API — sie nutzt exakt die Felder, die die Bubble-Runtime heute liest. Normale Admins brauchen diesen Bereich nicht.
        </p>
        <pre className="mt-3 max-h-80 overflow-auto rounded-2xl bg-black/40 p-4 text-[11px] leading-relaxed text-emerald-300">{JSON.stringify(payload, null, 2)}</pre>
      </details>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-0.5 truncate font-semibold text-slate-800">{value}</p>
    </div>
  );
}
