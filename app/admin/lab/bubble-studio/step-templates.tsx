"use client";

import { CircleCheck, Clock, Gauge, TrendingUp, Users } from "lucide-react";
import { formatNumber } from "@/lib/bubble-studio/derive";
import { getModule } from "@/lib/bubble-studio/modules";
import { TEMPLATES } from "@/lib/bubble-studio/template-presets";
import type { BubbleTemplateId } from "@/lib/bubble-studio/types";
import { SectionCard, StepIntro } from "./ui";

/** Schritt 1 — Vorlage wählen. Premium Template Cards mit Funnel-Beispiel. */
export function StepTemplates({ selected, onSelect }: { selected: BubbleTemplateId | null; onSelect: (id: BubbleTemplateId) => void }) {
  return (
    <SectionCard title="Vorlage wählen">
      <StepIntro text="Starte mit einer bewährten Bubble-Struktur für deinen Event-Typ. Jede Vorlage bringt passende Texte, Module, Sponsor-Beispiele und Rewards mit — alles bleibt danach änderbar." />
      <div className="grid gap-3.5 sm:grid-cols-2">
        {TEMPLATES.map((template) => {
          const isSelected = selected === template.id;
          const funnel = template.exampleFunnel;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={`group relative overflow-hidden rounded-2xl border text-left transition ${
                isSelected ? "border-slate-900 shadow-xl ring-2 ring-slate-900" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
              }`}
            >
              {/* Farbiger Kopf */}
              <div
                className="relative flex h-20 items-end p-3.5 text-white"
                style={{ background: `linear-gradient(135deg, ${template.colors.primary}, ${template.colors.accent} 160%)` }}
              >
                {template.recommended ? (
                  <span className="absolute right-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-extrabold text-slate-900">
                    Empfohlen
                  </span>
                ) : null}
                {isSelected ? <CircleCheck className="absolute left-2.5 top-2.5 h-5 w-5 text-white" /> : null}
                <div>
                  <p className="text-[15px] font-extrabold leading-tight">{template.name}</p>
                  <p className="text-[11px] text-white/75">{template.tagline}</p>
                </div>
              </div>

              <div className="space-y-2.5 bg-white p-3.5">
                <p className="text-xs leading-snug text-slate-600">{template.description}</p>

                <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
                  <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                  <span>{template.audience}</span>
                </div>

                {/* Typische Module */}
                <div className="flex flex-wrap gap-1">
                  {template.typicalModules.slice(0, 4).map((moduleId) => {
                    const moduleDef = getModule(moduleId);
                    return moduleDef ? (
                      <span key={moduleId} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        {moduleDef.name}
                      </span>
                    ) : null;
                  })}
                  {template.typicalModules.length > 4 ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                      +{template.typicalModules.length - 4}
                    </span>
                  ) : null}
                </div>

                {/* Beispiel-Funnel */}
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    <TrendingUp className="h-3 w-3" /> Beispiel-Funnel
                  </p>
                  <p className="text-[11px] font-semibold text-slate-600">
                    {formatNumber(funnel.scans)} Scans → {formatNumber(funnel.participations)} Teilnahmen → {formatNumber(funnel.redemptions)} Einlösungen
                  </p>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3" /> {template.difficulty}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {template.setupTime}
                  </span>
                  <span className="truncate pl-1 text-right">{template.typicalSponsors.split(",")[0]}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}
