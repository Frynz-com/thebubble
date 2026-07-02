"use client";

import { Gift, Handshake, ImageIcon, Plus, Trash2 } from "lucide-react";
import type { BubbleDraft, StudioReward, StudioSponsor } from "@/lib/bubble-studio/types";
import { FieldLabel, PlacementPicker, SectionCard, StepIntro, inputClass } from "./ui";

/* ---------- Schritt: Benefits & Rewards (mehrfach anlegbar) ---------- */

export function StepRewards({ draft, patch }: { draft: BubbleDraft; patch: (p: Partial<BubbleDraft>) => void }) {
  function updateReward(id: string, partial: Partial<StudioReward>) {
    patch({ rewards: draft.rewards.map((r) => (r.id === id ? { ...r, ...partial } : r)) });
  }

  function addReward() {
    const reward: StudioReward = {
      id: `rw-${Date.now()}`,
      title: "",
      description: "",
      sponsorId: null,
      redemptionHint: "",
      availableFrom: "",
      code: "BUBBLE",
      placements: ["home", "benefits"],
    };
    patch({ rewards: [...draft.rewards, reward] });
  }

  function removeReward(id: string) {
    patch({ rewards: draft.rewards.filter((r) => r.id !== id) });
  }

  return (
    <SectionCard title="Benefits & Rewards">
      <StepIntro text="Hier legst du Vorteile, Gutscheine oder Gewinne an. Jeder Reward kann einem Sponsor gehören und auf mehreren Seiten der Bubble sichtbar sein." />

      <div className="space-y-4">
        {draft.rewards.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
            <Gift className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-500">Noch keine Rewards</p>
            <p className="text-xs text-slate-400">Ein guter Reward ist der stärkste Grund, den QR-Code zu scannen.</p>
          </div>
        ) : (
          draft.rewards.map((reward, index) => (
            <div key={reward.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <Gift className="h-4 w-4 text-slate-400" /> Reward {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeReward(reward.id)}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Entfernen
                </button>
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <FieldLabel label="Reward Name">
                  <input className={inputClass} value={reward.title} placeholder="z.B. 1x Freigetränk" onChange={(e) => updateReward(reward.id, { title: e.target.value })} />
                </FieldLabel>
                <FieldLabel label="Sponsor / Partner">
                  <select
                    className={inputClass}
                    value={reward.sponsorId ?? ""}
                    onChange={(e) => updateReward(reward.id, { sponsorId: e.target.value || null })}
                  >
                    <option value="">Veranstalter (kein Sponsor)</option>
                    {draft.sponsors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || "Unbenannter Sponsor"}
                      </option>
                    ))}
                  </select>
                </FieldLabel>
                <FieldLabel label="Beschreibung">
                  <input className={inputClass} value={reward.description} onChange={(e) => updateReward(reward.id, { description: e.target.value })} />
                </FieldLabel>
                <FieldLabel label="Einlöse-Hinweis" hint="Wo und wie wird der Reward vor Ort eingelöst?">
                  <input
                    className={inputClass}
                    value={reward.redemptionHint}
                    placeholder="z.B. Screen an der Bar zeigen"
                    onChange={(e) => updateReward(reward.id, { redemptionHint: e.target.value })}
                  />
                </FieldLabel>
                <FieldLabel label="Verfügbar ab (optional)">
                  <input
                    className={inputClass}
                    value={reward.availableFrom}
                    placeholder="z.B. Ab Halbzeit"
                    onChange={(e) => updateReward(reward.id, { availableFrom: e.target.value })}
                  />
                </FieldLabel>
                <FieldLabel label="Einlöse-Code">
                  <input className={inputClass} value={reward.code} onChange={(e) => updateReward(reward.id, { code: e.target.value.toUpperCase() })} />
                </FieldLabel>
              </div>
              <div className="mt-3.5">
                <PlacementPicker value={reward.placements} onChange={(placements) => updateReward(reward.id, { placements })} />
              </div>

              {/* Reward Card Preview */}
              {reward.title.trim() ? (
                <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                  <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${draft.branding.primaryColor}, ${draft.branding.accentColor})` }} />
                  <div className="p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-extrabold text-slate-900">{reward.title}</p>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">Verfügbar</span>
                    </div>
                    {reward.description.trim() ? <p className="mt-0.5 text-[11px] text-slate-500">{reward.description}</p> : null}
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}

        <button
          type="button"
          onClick={addReward}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-3.5 text-sm font-bold text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
        >
          <Plus className="h-4 w-4" /> Reward hinzufügen
        </button>
      </div>
    </SectionCard>
  );
}

/* ---------- Schritt: Sponsoren (mehrfach anlegbar) ---------- */

export function StepSponsors({ draft, patch }: { draft: BubbleDraft; patch: (p: Partial<BubbleDraft>) => void }) {
  function updateSponsor(id: string, partial: Partial<StudioSponsor>) {
    patch({ sponsors: draft.sponsors.map((s) => (s.id === id ? { ...s, ...partial } : s)) });
  }

  function addSponsor() {
    const sponsor: StudioSponsor = {
      id: `sp-${Date.now()}`,
      name: "",
      offer: "",
      ctaText: "Mehr erfahren",
      ctaLink: "",
      logoUrl: "",
      placements: ["home", "benefits"],
    };
    patch({ sponsors: [...draft.sponsors, sponsor] });
  }

  function removeSponsor(id: string) {
    patch({
      sponsors: draft.sponsors.filter((s) => s.id !== id),
      rewards: draft.rewards.map((r) => (r.sponsorId === id ? { ...r, sponsorId: null } : r)),
    });
  }

  return (
    <SectionCard title="Sponsoren">
      <StepIntro text="Hier wird der Sponsor nicht nur sichtbar, sondern messbar aktivierbar: Jeder Button-Klick zählt später in den Sponsor-Report." />

      <div className="space-y-4">
        {draft.sponsors.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
            <Handshake className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-500">Noch kein Sponsor</p>
            <p className="text-xs text-slate-400">Sponsoren finanzieren Events — The Bubble beweist ihnen, dass es sich lohnt.</p>
          </div>
        ) : (
          draft.sponsors.map((sponsor, index) => {
            const sponsorRewards = draft.rewards.filter((r) => r.sponsorId === sponsor.id && r.title.trim());
            return (
              <div key={sponsor.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                    <Handshake className="h-4 w-4 text-slate-400" /> Sponsor {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeSponsor(sponsor.id)}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Entfernen
                  </button>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <FieldLabel label="Sponsor Name">
                    <input className={inputClass} value={sponsor.name} placeholder="z.B. Brauerei Musterbräu" onChange={(e) => updateSponsor(sponsor.id, { name: e.target.value })} />
                  </FieldLabel>
                  <div>
                    <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Logo</span>
                    <div className="flex h-[50px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-slate-400">
                      <ImageIcon className="h-4 w-4" />
                      <span className="text-xs font-medium">Upload folgt später</span>
                    </div>
                  </div>
                  <FieldLabel label="Angebot / Aktion" hint="Was bietet der Sponsor den Gästen?">
                    <input
                      className={inputClass}
                      value={sponsor.offer}
                      placeholder="z.B. Freigetränk für jeden Tipp"
                      onChange={(e) => updateSponsor(sponsor.id, { offer: e.target.value })}
                    />
                  </FieldLabel>
                  <FieldLabel label="Button-Text">
                    <input className={inputClass} value={sponsor.ctaText} onChange={(e) => updateSponsor(sponsor.id, { ctaText: e.target.value })} />
                  </FieldLabel>
                  <FieldLabel label="Ziel-Link (optional)" hint="Wohin führt der Button? Klicks werden gemessen.">
                    <input className={inputClass} value={sponsor.ctaLink} placeholder="https://…" onChange={(e) => updateSponsor(sponsor.id, { ctaLink: e.target.value })} />
                  </FieldLabel>
                  <div>
                    <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Zugehörige Rewards</span>
                    <div className="flex min-h-[50px] flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                      {sponsorRewards.length === 0 ? (
                        <span className="text-xs text-slate-400">Im Schritt „Benefits & Rewards“ zuordnen</span>
                      ) : (
                        sponsorRewards.map((r) => (
                          <span key={r.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                            {r.title}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3.5">
                  <PlacementPicker value={sponsor.placements} onChange={(placements) => updateSponsor(sponsor.id, { placements })} />
                </div>

                {/* Sponsor Card Preview */}
                {sponsor.name.trim() ? (
                  <div className="mt-4 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold text-white"
                        style={{ backgroundColor: draft.branding.primaryColor }}
                      >
                        {sponsor.name
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((p) => p[0]?.toUpperCase())
                          .join("")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-extrabold text-slate-900">{sponsor.name}</p>
                        {sponsor.offer.trim() ? <p className="truncate text-[11px] text-slate-500">{sponsor.offer}</p> : null}
                      </div>
                      <span className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-white" style={{ backgroundColor: draft.branding.primaryColor }}>
                        {sponsor.ctaText || "Mehr erfahren"}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}

        <button
          type="button"
          onClick={addSponsor}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-3.5 text-sm font-bold text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
        >
          <Plus className="h-4 w-4" /> Sponsor hinzufügen
        </button>
      </div>
    </SectionCard>
  );
}
