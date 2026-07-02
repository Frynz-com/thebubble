"use client";

import { Eye, Puzzle, TrendingUp } from "lucide-react";
import { MODULE_REGISTRY } from "@/lib/bubble-studio/modules";
import { PLACEMENTS, type BubbleDraft, type BubbleModuleDefinition } from "@/lib/bubble-studio/types";
import { SectionCard, StepIntro, Toggle } from "./ui";

const STATUS_BADGES: Record<BubbleModuleDefinition["status"], { label: string; className: string }> = {
  ready: { label: "Sofort nutzbar", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  roadmap: { label: "Vorbereitet", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  custom: { label: "Individuell baubar", className: "bg-violet-50 text-violet-700 ring-violet-200" },
};

function placementLabels(module: BubbleModuleDefinition): string {
  return module.placements.map((p) => PLACEMENTS.find((pl) => pl.key === p)?.label ?? p).join(" · ");
}

/**
 * Funktionen als Produktkarten — der Admin wählt Funktionen aus,
 * keine technischen Module. Liest ausschließlich aus MODULE_REGISTRY.
 */
export function StepModules({ draft, patch }: { draft: BubbleDraft; patch: (p: Partial<BubbleDraft>) => void }) {
  function toggleModule(moduleId: string, next: boolean) {
    const partial: Partial<BubbleDraft> = { modules: { ...draft.modules, [moduleId]: next } };
    // Community-Funktion und Rechtliches-Schalter bleiben synchron
    if (moduleId === "community") {
      partial.legal = { ...draft.legal, communityEnabled: next };
    }
    if (moduleId === "leadCapture") {
      partial.legal = { ...(partial.legal ?? draft.legal), leadCaptureEnabled: next };
    }
    patch(partial);
  }

  return (
    <SectionCard title="Funktionen">
      <StepIntro text="Wähle, welche Funktionen diese Bubble bekommt. Jede Karte zeigt dir, was Besucher sehen und warum es für Event und Sponsor wertvoll ist." />

      <div className="grid gap-3 sm:grid-cols-2">
        {MODULE_REGISTRY.map((module) => {
          const enabled = Boolean(draft.modules[module.moduleId]);
          const badge = STATUS_BADGES[module.status];
          const isCustom = module.status === "custom";
          return (
            <div
              key={module.moduleId}
              className={`flex flex-col rounded-2xl border p-4 transition ${
                isCustom
                  ? "border-dashed border-violet-300 bg-violet-50/40"
                  : enabled
                    ? "border-slate-900/15 bg-white shadow-md"
                    : "border-slate-200 bg-white opacity-75"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isCustom ? <Puzzle className="h-4 w-4 text-violet-500" /> : null}
                  <p className="text-sm font-extrabold text-slate-900">{module.name}</p>
                </div>
                <Toggle checked={enabled} onChange={(next) => toggleModule(module.moduleId, next)} />
              </div>

              <p className="mt-1 text-xs leading-snug text-slate-500">{module.description}</p>

              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-1.5">
                  <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                  <p className="text-[11px] leading-snug text-slate-500">
                    <span className="font-bold text-slate-600">Was Besucher sehen: </span>
                    {module.visitorSees}
                  </p>
                </div>
                <div className="flex items-start gap-1.5">
                  <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                  <p className="text-[11px] leading-snug text-slate-500">
                    <span className="font-bold text-slate-600">Warum es wertvoll ist: </span>
                    {module.businessValue}
                  </p>
                </div>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${badge.className}`}>{badge.label}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{module.complexity}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Erscheint auf: {placementLabels(module)}</span>
              </div>

              {isCustom ? (
                <p className="mt-2.5 rounded-xl bg-violet-100/60 px-3 py-2 text-[11px] leading-snug text-violet-700">
                  Individuelle Funktionen wie Matching, Quiz, Glücksrad, Foto-Voting, Sponsor-Code-Hunt oder Check-in-Challenges können später über Codex/Fable gebaut und hier registriert werden.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
