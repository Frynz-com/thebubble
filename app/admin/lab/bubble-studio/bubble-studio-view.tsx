"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FlaskConical, LockKeyhole } from "lucide-react";
import { buildBubbleConfigFromDraft, createDraftFromTemplate, slugify } from "@/lib/bubble-studio/derive";
import { MOCK_BUBBLES } from "@/lib/bubble-studio/mock-data";
import { getTemplate } from "@/lib/bubble-studio/template-presets";
import type { BubbleDraft, BubbleInsertPayload, BubbleStudioExistingItem, BubbleStudioItem } from "@/lib/bubble-studio/types";
import { StudioDashboard } from "./dashboard";
import { BubbleWizard } from "./wizard";

const ADMIN_SESSION_KEY = "thebubble_admin_secret";

type AdminBubbleApiItem = {
  id: string;
  slug: string;
  name: string;
  event_name?: string | null;
  type?: string | null;
  partner_name?: string | null;
  is_active?: boolean | null;
  created_at?: string;
  updated_at?: string | null;
};

type AdminBubblesResponse = {
  bubbles?: AdminBubbleApiItem[];
  bubble?: AdminBubbleApiItem;
  error?: string;
  details?: string;
  hint?: string;
  code?: string;
};

type DraftSaveResult = {
  name: string;
  slug: string;
};

type AdminApiError = Error & {
  status?: number;
};

async function adminBubblesRequest(method: "GET" | "POST", adminSecret: string, body?: BubbleInsertPayload): Promise<AdminBubblesResponse> {
  const response = await fetch("/api/admin/bubbles", {
    method,
    headers: {
      "content-type": "application/json",
      "x-admin-secret": adminSecret,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await response.json().catch(() => ({}))) as AdminBubblesResponse;

  if (!response.ok) {
    const message = [json.error, json.details, json.hint].filter(Boolean).join(" | ") || "Admin-Anfrage fehlgeschlagen.";
    const error = new Error(message) as AdminApiError;
    error.status = response.status;
    throw error;
  }

  return json;
}

function toExistingBubbleItem(bubble: AdminBubbleApiItem): BubbleStudioExistingItem {
  return {
    id: bubble.id,
    name: bubble.name || "Unbenannte Bubble",
    slug: bubble.slug,
    partnerName: bubble.partner_name || "—",
    eventType: bubble.type || bubble.event_name || "Bubble",
    isActive: Boolean(bubble.is_active),
    createdAt: bubble.created_at || "",
    updatedAt: bubble.updated_at ?? null,
  };
}

function toFriendlySaveError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.startsWith("Der Slug ")) return message;
  if (message.startsWith("Name ist") || message.startsWith("Slug ist") || message.startsWith("Typ ist")) return message;
  if (message.includes("Farben müssen")) return message;
  if ((error as AdminApiError | undefined)?.status === 401) return "Dein Admin-Kontext ist abgelaufen. Bitte entsperre den bestehenden Admin erneut.";
  return "Entwurf konnte nicht gespeichert werden. Bitte prüfe Name, Link und Admin-Kontext.";
}

function buildDraftSavePayload(draft: BubbleDraft): BubbleInsertPayload {
  const payload = buildBubbleConfigFromDraft({ ...draft, status: "draft" });
  return {
    ...payload,
    slug: payload.slug || slugify(draft.basics.name),
    is_active: false,
  };
}

/**
 * Bubble Studio — isolierter Lab-Prototyp für das zukünftige Admin-Dashboard.
 * Kompletter State lebt im Client. Keine Supabase-Zugriffe, keine Persistenz.
 */
export function BubbleStudioView() {
  const [hasAdminSession, setHasAdminSession] = useState<boolean | null>(null);
  const [adminSecret, setAdminSecret] = useState("");
  const [existingBubbles, setExistingBubbles] = useState<BubbleStudioExistingItem[]>([]);
  const [existingBubblesLoading, setExistingBubblesLoading] = useState(false);
  const [existingBubblesMessage, setExistingBubblesMessage] = useState("");
  const [items, setItems] = useState<BubbleStudioItem[]>(MOCK_BUBBLES);
  const [mode, setMode] = useState<"dashboard" | "wizard">("dashboard");
  const [wizardDraft, setWizardDraft] = useState<BubbleDraft | undefined>(undefined);

  const loadExistingBubbles = useCallback(async (secret: string) => {
    if (!secret) return;
    setExistingBubblesLoading(true);
    setExistingBubblesMessage("");
    try {
      const json = await adminBubblesRequest("GET", secret);
      setExistingBubbles((json.bubbles ?? []).map(toExistingBubbleItem));
    } catch (error) {
      console.error("[bubble-studio] existing bubbles load failed", error);
      if ((error as AdminApiError | undefined)?.status === 401) {
        window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
        setHasAdminSession(false);
        setAdminSecret("");
        setExistingBubblesMessage("Admin-Kontext abgelaufen. Bitte entsperre den bestehenden Admin erneut.");
      } else {
        setExistingBubblesMessage("Echte Bubbles konnten gerade nicht geladen werden.");
      }
    } finally {
      setExistingBubblesLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedSecret = window.sessionStorage.getItem(ADMIN_SESSION_KEY) ?? "";
    setHasAdminSession(Boolean(storedSecret));
    setAdminSecret(storedSecret);
    if (storedSecret) void loadExistingBubbles(storedSecret);
  }, [loadExistingBubbles]);

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

  async function saveDraft(draft: BubbleDraft): Promise<DraftSaveResult> {
    if (!adminSecret) {
      throw new Error("Dein Admin-Kontext ist abgelaufen. Bitte entsperre den bestehenden Admin erneut.");
    }

    const payload = buildDraftSavePayload(draft);
    try {
      const json = await adminBubblesRequest("POST", adminSecret, payload);
      const saved = json.bubble;
      await loadExistingBubbles(adminSecret);
      return {
        name: saved?.name || payload.name,
        slug: saved?.slug || payload.slug,
      };
    } catch (error) {
      console.error("[bubble-studio] draft save failed", error);
      throw new Error(toFriendlySaveError(error));
    }
  }

  if (hasAdminSession === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-sm font-semibold text-slate-500">
        Admin-Kontext wird geprüft ...
      </div>
    );
  }

  if (!hasAdminSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-900">
        <section className="w-full max-w-md rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold">Bubble Studio Lab</h1>
              <p className="text-sm font-semibold text-slate-500">Interner Admin-Kontext erforderlich</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Diese Lab-Seite ist nur nach dem bestehenden Admin-Login sichtbar. Bitte entsperre zuerst den Admin-Bereich und öffne das Lab danach erneut.
          </p>
          <Link
            href="/admin/bubbles"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-700"
          >
            Zum bestehenden Admin
          </Link>
        </section>
      </main>
    );
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
          <StudioDashboard
            items={items}
            existingBubbles={existingBubbles}
            existingBubblesLoading={existingBubblesLoading}
            existingBubblesMessage={existingBubblesMessage}
            onCreate={() => openWizard(undefined)}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
          />
        ) : (
          <BubbleWizard
            initialDraft={wizardDraft}
            onFinish={handleFinish}
            onSaveDraft={saveDraft}
            onCancel={() => {
              setMode("dashboard");
              setWizardDraft(undefined);
            }}
          />
        )}
      </main>

      <footer className="pb-8 text-center text-[11px] text-slate-300">
        Isolierter Prototyp — speichert neue Entwürfe inaktiv und verändert keine bestehenden Bubbles.
      </footer>
    </div>
  );
}
