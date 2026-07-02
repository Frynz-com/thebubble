"use client";

import { useState } from "react";
import { Check, Copy, Lightbulb } from "lucide-react";
import { STATUS_LABELS } from "@/lib/bubble-studio/derive";
import { PLACEMENTS, type BubbleStatus, type Placement } from "@/lib/bubble-studio/types";

const STATUS_STYLES: Record<BubbleStatus, string> = {
  draft: "bg-slate-100 text-slate-600 ring-slate-200",
  preview: "bg-amber-50 text-amber-700 ring-amber-200",
  live: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ended: "bg-sky-50 text-sky-700 ring-sky-200",
};

export function StatusBadge({ status }: { status: BubbleStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${STATUS_STYLES[status]}`}>
      {status === "live" ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> : null}
      {STATUS_LABELS[status]}
    </span>
  );
}

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard nicht verfügbar (z.B. http) — bewusst still
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        copied ? "bg-emerald-100 text-emerald-700" : "bg-slate-900 text-white hover:bg-slate-700"
      }`}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Kopiert" : (label ?? "Kopieren")}
    </button>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 sm:p-6 ${className}`}>
      {title ? (
        <header className="mb-4">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function FieldLabel({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:bg-white";

export function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (next: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-emerald-500" : "bg-slate-300"} ${disabled ? "opacity-40" : ""}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-6" : "left-1"}`} />
    </button>
  );
}

/** Erklärungs-Banner am Anfang jedes Wizard-Schritts — Admin-Sprache statt Technik. */
export function StepIntro({ text }: { text: string }) {
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-blue-50/70 p-3.5 ring-1 ring-blue-100">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
      <p className="text-[13px] leading-snug text-blue-900">{text}</p>
    </div>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-start gap-2.5 text-left">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition ${
          checked ? "bg-emerald-500 text-white" : "bg-white ring-1 ring-slate-300"
        }`}
      >
        {checked ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
      <span className="text-[13px] font-medium text-slate-700">{label}</span>
    </button>
  );
}

/** Sichtbarkeit: auf welchen Seiten der Bubble etwas erscheint. */
export function PlacementPicker({ value, onChange }: { value: Placement[]; onChange: (next: Placement[]) => void }) {
  function toggle(key: Placement) {
    onChange(value.includes(key) ? value.filter((p) => p !== key) : [...value, key]);
  }

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Sichtbarkeit</span>
      <div className="flex flex-wrap gap-1.5">
        {PLACEMENTS.map((placement) => {
          const active = value.includes(placement.key);
          return (
            <button
              key={placement.key}
              type="button"
              onClick={() => toggle(placement.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {placement.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
