"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Clock3, Gift, Mail, RefreshCw, ScanLine, Ticket, UsersRound } from "lucide-react";
import type { DemoEventName, Json } from "@/lib/supabase/types";

type DemoRange = "today" | "7d" | "30d";
type DemoMode = "visitor" | "dashboard" | null;

type DemoFunnelRow = {
  label: string;
  event: DemoEventName;
  count: number;
};

type DemoAnalyticsSummary = {
  range: DemoRange;
  since: string;
  generatedAt: string;
  message?: string;
  totalEvents: number;
  counts: Record<DemoEventName, number>;
  overview: {
    demoViews: number;
    visitorChoices: number;
    dashboardChoices: number;
    tipsSaved: number;
    couponsOpened: number;
    walletSaves: number;
    contactClicks: number;
  };
  visitorFunnel: DemoFunnelRow[];
  dashboardFunnel: DemoFunnelRow[];
  recentEvents: Array<{
    id: string;
    event_name: DemoEventName;
    mode: DemoMode;
    metadata: Json;
    created_at: string;
  }>;
};

const ranges: Array<{ key: DemoRange; label: string }> = [
  { key: "today", label: "Heute" },
  { key: "7d", label: "7 Tage" },
  { key: "30d", label: "30 Tage" },
];

const eventLabels: Record<DemoEventName, string> = {
  demo_view: "Demo geöffnet",
  demo_choose_visitor: "Besucher gewählt",
  demo_choose_dashboard: "Dashboard gewählt",
  visitor_home_view: "Visitor Home",
  visitor_action_view: "Visitor Aktion",
  visitor_tip_submit: "Tipp gespeichert",
  visitor_reward_view: "Reward gesehen",
  reward_coupon_click: "Coupon geöffnet",
  reward_wallet_save: "Wallet gespeichert",
  dashboard_home_view: "Dashboard Home",
  dashboard_create_view: "Erstellen geöffnet",
  dashboard_setup_view: "Setup geöffnet",
  dashboard_contact_click: "Dashboard Kontakt",
  demo_showcase_view: "Showcase gesehen",
  demo_contact_click: "Demo Kontakt",
};

async function fetchDemoAnalytics(adminSecret: string, range: DemoRange) {
  const response = await fetch(`/api/admin/demo-analytics?range=${range}`, {
    headers: {
      "x-admin-secret": adminSecret,
    },
  });
  const json = (await response.json()) as { summary?: DemoAnalyticsSummary; message?: string; error?: string };
  if (!response.ok || !json.summary) throw new Error(json.error || "Demo Analytics konnten nicht geladen werden.");
  return { summary: json.summary, message: json.message ?? json.summary.message ?? "" };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMetadata(metadata: Json) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "-";

  const pairs = Object.entries(metadata)
    .filter(([, value]) => typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    .slice(0, 4);

  if (!pairs.length) return "-";
  return pairs.map(([key, value]) => `${key}: ${String(value)}`).join(" · ");
}

function modeLabel(mode: DemoMode) {
  if (mode === "visitor") return "Visitor";
  if (mode === "dashboard") return "Dashboard";
  return "Hub";
}

export function DemoAnalytics({ adminSecret }: { adminSecret: string }) {
  const [range, setRange] = useState<DemoRange>("30d");
  const [summary, setSummary] = useState<DemoAnalyticsSummary | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAnalytics() {
      setLoading(true);
      setMessage("");
      try {
        const result = await fetchDemoAnalytics(adminSecret, range);
        if (!active) return;
        setSummary(result.summary);
        setMessage(result.message);
      } catch (error) {
        if (!active) return;
        setSummary(null);
        setMessage(error instanceof Error ? error.message : "Demo Analytics konnten nicht geladen werden.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadAnalytics();

    return () => {
      active = false;
    };
  }, [adminSecret, range]);

  const overviewCards = useMemo(
    () => [
      { label: "Demo-Aufrufe gesamt", value: summary?.overview.demoViews ?? 0, icon: ScanLine },
      { label: "Besucher-Modus gewählt", value: summary?.overview.visitorChoices ?? 0, icon: UsersRound },
      { label: "Dashboard-Modus gewählt", value: summary?.overview.dashboardChoices ?? 0, icon: BarChart3 },
      { label: "Tipps gespeichert", value: summary?.overview.tipsSaved ?? 0, icon: Ticket },
      { label: "Coupons geöffnet", value: summary?.overview.couponsOpened ?? 0, icon: Gift },
      { label: "Wallet-Saves", value: summary?.overview.walletSaves ?? 0, icon: Ticket },
      { label: "Kontakt-Klicks", value: summary?.overview.contactClicks ?? 0, icon: Mail },
    ],
    [summary],
  );

  return (
    <div className="space-y-5 rounded-[1.5rem] bg-white p-5 shadow-ambient">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-primary">The Bubble Demo</p>
          <h2 className="text-2xl font-black text-on-surface">Demo Analytics</h2>
          <p className="mt-1 text-sm font-semibold text-on-surface-variant">QR-Scan, Aktion, Reward und Dashboard-Nutzung im Überblick.</p>
        </div>
        <div className="flex rounded-full bg-surface p-1">
          {ranges.map((item) => (
            <button
              className={[
                "min-h-10 rounded-full px-4 text-sm font-black transition",
                range === item.key ? "bg-primary text-on-primary shadow-active" : "text-on-surface-variant hover:bg-white",
              ].join(" ")}
              key={item.key}
              type="button"
              onClick={() => setRange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {message ? <p className="rounded-[1rem] bg-surface p-3 text-sm font-semibold text-on-surface-variant">{message}</p> : null}
      {loading ? (
        <p className="flex items-center gap-2 rounded-[1rem] bg-surface p-3 text-sm font-bold text-on-surface-variant">
          <RefreshCw className="animate-spin" size={16} />
          Demo Analytics werden geladen ...
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="rounded-[1.25rem] bg-surface p-4" key={card.label}>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary shadow-ambient">
                <Icon size={17} strokeWidth={2.4} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-outline">{card.label}</p>
              <p className="mt-2 text-2xl font-black text-on-surface">{card.value}</p>
            </div>
          );
        })}
      </div>

      {summary && summary.totalEvents === 0 ? (
        <section className="rounded-[1.25rem] border border-outline-variant/35 p-5 text-center">
          <p className="font-black text-on-surface">Noch keine Demo-Daten vorhanden.</p>
          <p className="mt-1 text-sm font-semibold text-on-surface-variant">Sobald die Demo genutzt wird, erscheinen hier Funnel und letzte Events.</p>
        </section>
      ) : null}

      {summary && summary.totalEvents > 0 ? (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <DemoFunnel title="Visitor Funnel" rows={summary.visitorFunnel} />
            <DemoFunnel title="Dashboard Funnel" rows={summary.dashboardFunnel} />
          </div>

          <section className="rounded-[1.25rem] border border-outline-variant/35 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 font-bold text-on-surface">
                <Clock3 size={18} />
                Letzte Events
              </h3>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-outline">Letzte 25</p>
            </div>
            <div className="overflow-hidden rounded-[1rem] border border-outline-variant/30">
              <div className="hidden grid-cols-[150px_1fr_110px_1.5fr] bg-surface px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-outline md:grid">
                <span>Zeitpunkt</span>
                <span>Event</span>
                <span>Mode</span>
                <span>Metadata</span>
              </div>
              <div className="divide-y divide-outline-variant/25">
                {summary.recentEvents.map((event) => (
                  <div className="grid gap-1 px-3 py-3 text-sm md:grid-cols-[150px_1fr_110px_1.5fr] md:items-center" key={event.id}>
                    <span className="font-semibold text-on-surface-variant">{formatDate(event.created_at)}</span>
                    <span className="font-bold text-on-surface">{eventLabels[event.event_name] ?? event.event_name}</span>
                    <span className="font-semibold text-primary">{modeLabel(event.mode)}</span>
                    <code className="break-words rounded-[.8rem] bg-surface px-2 py-1 text-xs text-on-surface-variant">{formatMetadata(event.metadata)}</code>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function DemoFunnel({ title, rows }: { title: string; rows: DemoFunnelRow[] }) {
  const baseline = Math.max(rows[0]?.count ?? 0, 1);

  return (
    <section className="rounded-[1.25rem] border border-outline-variant/35 p-4">
      <h3 className="mb-3 font-bold text-on-surface">{title}</h3>
      <div className="space-y-3">
        {rows.map((row) => {
          const width = Math.max(4, Math.min(100, Math.round((row.count / baseline) * 100)));
          return (
            <div key={row.event}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-on-surface-variant">{row.label}</span>
                <strong className="text-on-surface">{row.count}</strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
