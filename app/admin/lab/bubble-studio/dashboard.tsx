"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Building2, CopyPlus, ExternalLink, FileText, Lock, Pencil, Plus, QrCode, ShieldCheck, Users } from "lucide-react";
import { APP_BASE_URL, buildTrackingLinks, deriveFunnel, deriveTotals, formatDate, formatNumber } from "@/lib/bubble-studio/derive";
import { MOCK_MEMBERS, ORGANIZATIONS, STUDIO_ROLES, getOrganization, getRole } from "@/lib/bubble-studio/organizations";
import type { BubbleStudioExistingItem, BubbleStudioItem, StudioMember, StudioOrganization, StudioRoleId } from "@/lib/bubble-studio/types";
import { CopyButton, SectionCard, StatusBadge } from "./ui";

export function StudioDashboard({
  items,
  existingBubbles,
  existingBubblesLoading,
  existingBubblesMessage,
  onCreate,
  onEdit,
  onDuplicate,
}: {
  items: BubbleStudioItem[];
  existingBubbles: BubbleStudioExistingItem[];
  existingBubblesLoading: boolean;
  existingBubblesMessage: string;
  onCreate: () => void;
  onEdit: (item: BubbleStudioItem) => void;
  onDuplicate: (item: BubbleStudioItem) => void;
}) {
  const totals = deriveTotals(items);
  const funnel = deriveFunnel(totals);
  const maxFunnel = Math.max(...funnel.map((f) => f.value), 1);

  const kpiCards = [
    { label: "Aktive Bubbles", value: totals.activeBubbles, sub: `${totals.plannedBubbles} geplant` },
    { label: "Gesamt-Scans", value: totals.scans, sub: "über alle Events" },
    { label: "Teilnahmen", value: totals.participations, sub: `${Math.round((totals.participations / Math.max(totals.scans, 1)) * 100)}% der Scans` },
    { label: "Leads", value: totals.leads, sub: "freiwillige Kontakte" },
    { label: "Redemptions", value: totals.redemptions, sub: `${formatNumber(totals.rewardClaims)} Claims` },
    { label: "Sponsor Clicks", value: totals.sponsorClicks, sub: "messbarer Sponsor-ROI" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Hero / Willkommen */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-32 h-56 w-56 rounded-full bg-indigo-400/10 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-300">Operator-Modus</p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Willkommen zurück, Kai</h1>
        <p className="mt-1.5 max-w-xl text-sm text-white/70">
          Dein Real-World Activation Layer: Bubbles erstellen, live schalten und Sponsoren mit echten Zahlen überzeugen.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-blue-50"
        >
          <Plus className="h-4 w-4" /> Neue Bubble erstellen
        </button>
      </div>

      {/* KPI-Karten */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="rounded-3xl bg-white p-4 shadow-[0_10px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{kpi.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatNumber(kpi.value)}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <SectionCard title="Event-Funnel" subtitle="Vom Scan bis zur Einlösung — aggregiert über alle Bubbles.">
        <div className="space-y-2">
          {funnel.map((step) => (
            <div key={step.key} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs font-semibold text-slate-500 sm:w-32">{step.label}</span>
              <div className="h-8 min-w-0 flex-1 overflow-hidden rounded-xl bg-slate-100">
                <div
                  className="flex h-full items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-3"
                  style={{ width: `${Math.max((step.value / maxFunnel) * 100, step.value > 0 ? 8 : 0)}%` }}
                >
                  <span className="text-xs font-bold text-white">{formatNumber(step.value)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <ExistingBubblesSection items={existingBubbles} loading={existingBubblesLoading} message={existingBubblesMessage} />

      {/* Bubble-Liste */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Demo-Daten</h2>
            <p className="text-xs text-slate-400">Mock-Bubbles aus dem Lab, getrennt von echten Supabase-Daten.</p>
          </div>
          <span className="text-xs text-slate-400">{items.length} Demo-Bubbles</span>
        </div>
        <div className="space-y-3">
          {items.length === 0 ? (
            <SectionCard>
              <div className="py-8 text-center">
                <p className="text-sm font-bold text-slate-900">Noch keine Bubbles</p>
                <p className="mt-1 text-sm text-slate-500">Erstelle deine erste Bubble — in unter 30 Minuten live.</p>
              </div>
            </SectionCard>
          ) : (
            items.map((item) => <BubbleCard key={item.id} item={item} onEdit={() => onEdit(item)} onDuplicate={() => onDuplicate(item)} />)
          )}
        </div>
      </div>

      {/* Organisationen & Zugänge (interaktiver Mock) */}
      <AccessSection items={items} />
    </div>
  );
}

function ExistingBubblesSection({ items, loading, message }: { items: BubbleStudioExistingItem[]; loading: boolean; message: string }) {
  return (
    <SectionCard title="Echte Bubbles" subtitle="Read-only aus der bestehenden Admin-API geladen. Bearbeiten und Aktivieren bleibt im bestehenden Admin.">
      {message ? <p className="mb-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-100">{message}</p> : null}
      {loading ? <p className="text-sm font-semibold text-slate-500">Echte Bubbles werden geladen ...</p> : null}
      {!loading && items.length === 0 ? (
        <p className="text-sm text-slate-500">Keine echten Bubbles geladen.</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  item.isActive ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-slate-200 text-slate-600"
                }`}
              >
                {item.isActive ? "Aktiv" : "Inaktiv"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-900">{item.name}</p>
                <p className="truncate text-xs text-slate-500">
                  /{item.slug} · {item.eventType} · {item.partnerName}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <a
                  href={`${APP_BASE_URL}/${item.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:ring-slate-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Link
                </a>
                <Link
                  href="/admin/bubbles"
                  className="inline-flex items-center rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-700"
                >
                  Im Admin prüfen
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

/* ---------- Organisationen & Zugänge (Mock, Client-State) ---------- */

function AccessSection({ items }: { items: BubbleStudioItem[] }) {
  const [organizations, setOrganizations] = useState<StudioOrganization[]>(ORGANIZATIONS);
  const [members, setMembers] = useState<StudioMember[]>(MOCK_MEMBERS);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgKind, setNewOrgKind] = useState("Kunde");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<StudioRoleId>("partner_admin");
  const [newMemberOrg, setNewMemberOrg] = useState("org-intern");

  const ORG_COLORS = ["#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#f43f5e"];

  function addOrganization() {
    if (!newOrgName.trim()) return;
    setOrganizations((prev) => [
      ...prev,
      { id: `org-${Date.now()}`, name: newOrgName.trim(), kind: newOrgKind, color: ORG_COLORS[prev.length % ORG_COLORS.length] },
    ]);
    setNewOrgName("");
  }

  function addMember() {
    if (!newMemberEmail.trim()) return;
    setMembers((prev) => [
      ...prev,
      { id: `m-${Date.now()}`, name: newMemberName.trim() || newMemberEmail.split("@")[0], email: newMemberEmail.trim(), roleId: newMemberRole, organizationId: newMemberOrg },
    ]);
    setNewMemberEmail("");
    setNewMemberName("");
  }

  function bubbleCount(orgId: string) {
    return items.filter((i) => i.organizationId === orgId).length;
  }

  return (
    <SectionCard
      title="Organisationen & Zugänge"
      subtitle="Noch nicht aktiv — vorbereitet für spätere Kunden-Zugänge. Kunden sehen dann nur die Bubbles ihrer eigenen Organisation, du als Superadmin siehst alles."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Organisationen */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <Building2 className="h-3.5 w-3.5" /> Organisationen
          </p>
          <div className="space-y-1.5">
            {organizations.map((org) => (
              <div key={org.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-2.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: org.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-slate-800">{org.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {org.kind} · {bubbleCount(org.id)} {bubbleCount(org.id) === 1 ? "Bubble" : "Bubbles"}
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-slate-300">
                  {members.filter((m) => m.organizationId === org.id).length} Zugänge
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] outline-none transition focus:border-slate-400 focus:bg-white"
              value={newOrgName}
              placeholder="Neue Organisation, z.B. Stadtwerke Nord"
              onChange={(e) => setNewOrgName(e.target.value)}
            />
            <select
              className="rounded-2xl border border-slate-200 bg-slate-50 px-2.5 py-2.5 text-[12px] outline-none"
              value={newOrgKind}
              onChange={(e) => setNewOrgKind(e.target.value)}
            >
              <option>Kunde</option>
              <option>Sportverein</option>
              <option>Kommune</option>
              <option>Handel</option>
              <option>Agentur</option>
            </select>
            <button
              type="button"
              onClick={addOrganization}
              className="inline-flex shrink-0 items-center gap-1 rounded-2xl bg-slate-900 px-3.5 text-xs font-bold text-white transition hover:bg-slate-700"
            >
              <Plus className="h-3.5 w-3.5" /> Anlegen
            </button>
          </div>
        </div>

        {/* Zugänge */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <Users className="h-3.5 w-3.5" /> Zugänge
          </p>
          <div className="space-y-1.5">
            {members.map((member) => {
              const role = getRole(member.roleId);
              const org = organizations.find((o) => o.id === member.organizationId);
              return (
                <div key={member.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-extrabold text-slate-600">
                    {member.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-slate-800">{member.name}</p>
                    <p className="truncate text-[11px] text-slate-400">{member.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] font-bold text-slate-600">{role?.name ?? member.roleId}</p>
                    <p className="text-[10px] text-slate-400">{org?.name ?? "—"}</p>
                  </div>
                  {member.roleId === "super_admin" ? (
                    <span className="shrink-0 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">Du</span>
                  ) : (
                    <Lock className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <input
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] outline-none transition focus:border-slate-400 focus:bg-white"
              value={newMemberName}
              placeholder="Name"
              onChange={(e) => setNewMemberName(e.target.value)}
            />
            <input
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] outline-none transition focus:border-slate-400 focus:bg-white"
              value={newMemberEmail}
              placeholder="E-Mail-Adresse"
              onChange={(e) => setNewMemberEmail(e.target.value)}
            />
            <select
              className="rounded-2xl border border-slate-200 bg-slate-50 px-2.5 py-2.5 text-[12px] outline-none"
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value as StudioRoleId)}
            >
              {STUDIO_ROLES.filter((r) => r.id !== "super_admin").map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <select
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-2.5 py-2.5 text-[12px] outline-none"
                value={newMemberOrg}
                onChange={(e) => setNewMemberOrg(e.target.value)}
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addMember}
                className="inline-flex shrink-0 items-center gap-1 rounded-2xl bg-slate-900 px-3.5 text-xs font-bold text-white transition hover:bg-slate-700"
              >
                <Plus className="h-3.5 w-3.5" /> Anlegen
              </button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Mock-Modus: Es wird keine echte Einladung gesendet. Rollen im Überblick: Superadmin sieht alles, Operator bearbeitet alle Bubbles,
            Kunden-Admin sieht nur die eigene Organisation, Event Manager pflegt Live-Inhalte, Sponsor Viewer sieht nur Reports.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

function BubbleCard({ item, onEdit, onDuplicate }: { item: BubbleStudioItem; onEdit: () => void; onDuplicate: () => void }) {
  const [panel, setPanel] = useState<"qr" | "report" | null>(null);
  const organization = getOrganization(item.organizationId);
  const links = buildTrackingLinks(item.slug, ["entrance", "bar", "screen"]);
  const funnel = deriveFunnel(item.kpis);
  const maxFunnel = Math.max(...funnel.map((f) => f.value), 1);

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-100">
      <div className="flex flex-wrap items-start gap-3">
        <span className="h-11 w-11 shrink-0 rounded-2xl" style={{ background: `linear-gradient(140deg, ${item.primaryColor}, ${item.accentColor})` }} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-extrabold text-slate-900">{item.name}</h3>
            <StatusBadge status={item.status} />
            {item.isProtectedPilot ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-blue-100">
                <ShieldCheck className="h-3 w-3" /> Geschützter Pilot
              </span>
            ) : null}
            {item.isTemplate ? <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-100">Template</span> : null}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {item.partnerName} · {item.eventType} · {formatDate(item.eventDate)}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="font-mono text-[11px] text-slate-400">/{item.slug}</p>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Building2 className="h-3 w-3" />
              {organization ? organization.name : "The Bubble Intern"}
            </span>
          </div>
        </div>

        {/* Mini-KPIs */}
        {item.kpis.scans > 0 ? (
          <div className="flex gap-4 text-right">
            <MiniKpi label="Scans" value={item.kpis.scans} />
            <MiniKpi label="Teilnahmen" value={item.kpis.participations} />
            <MiniKpi label="Redemptions" value={item.kpis.redemptions} />
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton icon={<Pencil className="h-3.5 w-3.5" />} label="Bearbeiten" onClick={onEdit} />
        <a
          href={`${APP_BASE_URL}/${item.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Preview
        </a>
        <ActionButton icon={<QrCode className="h-3.5 w-3.5" />} label="QR Links" active={panel === "qr"} onClick={() => setPanel(panel === "qr" ? null : "qr")} />
        <ActionButton
          icon={<BarChart3 className="h-3.5 w-3.5" />}
          label="Report"
          active={panel === "report"}
          onClick={() => setPanel(panel === "report" ? null : "report")}
        />
        <ActionButton icon={<CopyPlus className="h-3.5 w-3.5" />} label="Duplizieren" onClick={onDuplicate} />
      </div>

      {panel === "qr" ? (
        <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-3.5">
          {links.map((link) => (
            <div key={link.key} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-700">{link.label}</p>
                <p className="truncate font-mono text-[11px] text-slate-400">{link.url}</p>
              </div>
              <CopyButton value={link.url} />
            </div>
          ))}
        </div>
      ) : null}

      {panel === "report" ? (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          {item.kpis.scans === 0 ? (
            <p className="text-xs text-slate-500">Noch keine Daten — der Sponsor-Report entsteht automatisch, sobald die Bubble live ist.</p>
          ) : (
            <>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <FileText className="h-3.5 w-3.5" /> Sponsor-Funnel (Kurzfassung)
              </p>
              <div className="space-y-1.5">
                {funnel.map((step) => (
                  <div key={step.key} className="flex items-center gap-2">
                    <span className="w-28 shrink-0 text-[11px] font-medium text-slate-500">{step.label}</span>
                    <div className="h-4 min-w-0 flex-1 overflow-hidden rounded-md bg-slate-200/70">
                      <div className="h-full rounded-md" style={{ width: `${(step.value / maxFunnel) * 100}%`, backgroundColor: item.primaryColor }} />
                    </div>
                    <span className="w-14 shrink-0 text-right text-[11px] font-bold text-slate-700">{formatNumber(step.value)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-slate-400">Vollständiger Recap-Report inkl. Source Attribution und Executive Summary folgt als eigenes Modul.</p>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function MiniKpi({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-sm font-extrabold text-slate-900">{formatNumber(value)}</p>
      <p className="text-[10px] font-medium text-slate-400">{label}</p>
    </div>
  );
}

function ActionButton({ icon, label, onClick, active = false }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
        active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
