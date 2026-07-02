import type { StudioMember, StudioOrganization, StudioRole } from "./types";

/**
 * Multi-Admin-/Kundenstruktur — Konzept-Vorbereitung, KEINE echte Auth.
 *
 * Später: Supabase Auth + Tabellen `organizations`, `organization_members`
 * (user_id, organization_id, role) und `bubbles.organization_id`.
 * RLS: Partner-Admins sehen nur Bubbles ihrer Organisation,
 * Super Admin / Operator sehen alles.
 */
export const STUDIO_ROLES: StudioRole[] = [
  { id: "super_admin", name: "Super Admin", description: "Sieht und verwaltet alles — das bist du." },
  { id: "operator", name: "Operator", description: "Erstellt und betreibt Bubbles für alle Kunden." },
  { id: "partner_admin", name: "Kunde / Partner Admin", description: "Verwaltet nur die Bubbles der eigenen Organisation." },
  { id: "event_manager", name: "Event Manager", description: "Pflegt Inhalte und Live-Aktionen einzelner Bubbles." },
  { id: "viewer", name: "Viewer / Sponsor", description: "Nur Lesezugriff auf Analytics und Reports." },
];

export const ORGANIZATIONS: StudioOrganization[] = [
  { id: "org-intern", name: "The Bubble Intern", kind: "Betreiber", color: "#0f172a" },
  { id: "org-edeka", name: "EDEKA Bauer", kind: "Handel", color: "#facc15" },
  { id: "org-huber", name: "Huber Arena", kind: "Sportverein", color: "#0058be" },
  { id: "org-quickborn", name: "Stadt Quickborn", kind: "Kommune", color: "#dd0000" },
  { id: "org-club", name: "Club Beispiel", kind: "Verein", color: "#059669" },
];

export function getOrganization(id: string | null): StudioOrganization | undefined {
  return ORGANIZATIONS.find((o) => o.id === id);
}

/** Mock-Zugänge — später Tabelle `organization_members`. Keine echten Einladungen. */
export const MOCK_MEMBERS: StudioMember[] = [
  { id: "m-1", name: "Kai Noebel", email: "noebel59@gmail.com", roleId: "super_admin", organizationId: "org-intern" },
  { id: "m-2", name: "Max Bauer", email: "max@edeka-bauer.example", roleId: "partner_admin", organizationId: "org-edeka" },
  { id: "m-3", name: "Lena Huber", email: "lena@huber-arena.example", roleId: "event_manager", organizationId: "org-huber" },
  { id: "m-4", name: "Sponsoring Team", email: "report@sparkasse.example", roleId: "viewer", organizationId: "org-quickborn" },
];

export function getRole(id: string): StudioRole | undefined {
  return STUDIO_ROLES.find((r) => r.id === id);
}
