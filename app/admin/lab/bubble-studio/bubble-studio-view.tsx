"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { createDraftFromTemplate, slugify } from "@/lib/bubble-studio/derive";
import { MOCK_BUBBLES } from "@/lib/bubble-studio/mock-data";
import { getTemplate } from "@/lib/bubble-studio/template-presets";
import type { BubbleDraft, BubbleStudioItem } from "@/lib/bubble-studio/types";
import { StudioDashboard } from "./dashboard";
import { BubbleWizard } from "./wizard";

/**
 * Bubble Studio — isolierter Lab-Prototyp für das zukünftige Admin-Dashboard.
 * Kompletter State lebt im Client. Keine Supabase-Zugriffe, keine Persistenz.
 */
export function BubbleStudioView() {
  const [items, setItems] = useState<BubbleStudioItem[]>(MOCK_BUBBLES);
  const [mode, setMode] = useState<"dashboard" | "wizard">("dashboard");
  const [wizardDraft, setWizardDraft] = useState<BubbleDraft | undefined>(undefined);

  function openWizard(draft?: BubbleDraft) {
    setWizardDraft(draft);
    setMode("wizard");
  }

  function handleEdit(item: BubbleStudioItem) {
    const draft = createDraftFromTemplate(item.templateId);
    openWizard({
      ...draft,
      basics: {
        ...draft.basics,
        name: item.name,
        bubbleLink: item.slug,
        partnerName: item.partnerName === "—" ? "" : item.partnerName,
        eventDate: item.eventDate,
        location: item.location,
      },
      branding: { ...draft.branding, primaryColor: item.primaryColor, accentColor: item.accentColor },
      status: item.status,
    });
  }

  function handleDuplicate(item: BubbleStudioItem) {
    const copy: BubbleStudioItem = {
      ...item,
      id: `${item.id}-copy-${Date.now()}`,
      name: `${item.name} (Kopie)`,
      slug: `${item.slug}-kopie`,
      status: "draft",
      isProtectedPilot: false,
      isTemplate: false,
      kpis: { scans: 0, landingViews: 0, liveViews: 0, participations: 0, leads: 0, rewardClaims: 0, redemptions: 0, sponsorClicks: 0 },
    };
    setItems((prev) => [copy, ...prev]);
  }

  function handleFinish(draft: BubbleDraft) {
    const template = getTemplate(draft.templateId);
    const newItem: BubbleStudioItem = {
      id: `studio-${Date.now()}`,
      name: draft.basics.name || "Unbenannte Bubble",
      slug: draft.basics.bubbleLink || slugify(draft.basics.name) || "unbenannte-bubble",
      partnerName: draft.basics.partnerName || "—",
      eventType: template.name,
      eventDate: draft.basics.eventDate,
      location: draft.basics.location,
      status: draft.status,
      templateId: draft.templateId ?? "custom",
      primaryColor: draft.branding.primaryColor,
      accentColor: draft.branding.accentColor,
      kpis: { scans: 0, landingViews: 0, liveViews: 0, participations: 0, leads: 0, rewardClaims: 0, redemptions: 0, sponsorClicks: 0 },
      organizationId: null,
      isProtectedPilot: false,
      isTemplate: false,
    };
    setItems((prev) => {
      const existing = prev.findIndex((i) => i.slug === newItem.slug && !i.isProtectedPilot);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...newItem, id: prev[existing].id, kpis: prev[existing].kpis };
        return next;
      }
      return [newItem, ...prev];
    });
    setMode("dashboard");
    setWizardDraft(undefined);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white font-sans text-slate-900">
      {/* Top-Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-sm font-extrabold text-white">B</span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold leading-tight">Bubble Studio</p>
            <p className="text-[11px] text-slate-400">The Bubble · Operator-Dashboard</p>
          </div>
          <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200">
            <FlaskConical className="h-3 w-3" /> Lab-Prototyp
          </span>
          <Link href="/admin/bubbles" className="ml-auto shrink-0 text-xs font-semibold text-slate-500 transition hover:text-slate-900">
            Zum bestehenden Admin →
          </Link>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 sm:py-8">
        {mode === "dashboard" ? (
          <StudioDashboard items={items} onCreate={() => openWizard(undefined)} onEdit={handleEdit} onDuplicate={handleDuplicate} />
        ) : (
          <BubbleWizard
            initialDraft={wizardDraft}
            onFinish={handleFinish}
            onCancel={() => {
              setMode("dashboard");
              setWizardDraft(undefined);
            }}
          />
        )}
      </main>

      <footer className="pb-8 text-center text-[11px] text-slate-300">
        Isolierter Prototyp — speichert nichts, verändert keine bestehenden Bubbles.
      </footer>
    </div>
  );
}
