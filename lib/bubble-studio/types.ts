/**
 * Bubble Studio — isolierte Typen für das Admin-Lab unter /admin/lab/bubble-studio.
 *
 * WICHTIG: Diese Typen sind bewusst NICHT an Supabase angebunden.
 * Sie sind aber so geschnitten, dass ein BubbleDraft später verlustfrei
 * auf `bubbles` (BubbleRow) + `bubbles.config` gemappt werden kann und
 * dass Sponsoren/Rewards/Placements später eigene Tabellen bekommen können
 * (`sponsors`, `rewards`, `redemptions`, `sponsor_placements`).
 * Siehe `buildBubbleConfigFromDraft` in ./derive.ts.
 */

export type BubbleStatus = "draft" | "preview" | "live" | "ended";

export type BubbleTemplateId =
  | "public_viewing"
  | "club_matchday"
  | "festival_sponsor"
  | "bar_night"
  | "expo_lead"
  | "sponsor_activation"
  | "custom";

/**
 * Wo etwas in der Bubble sichtbar ist.
 * Die Bubble hat genau 3 Hauptbereiche (Start, Live, Benefits) plus das
 * Titelblatt als Entry-Seite VOR der Bubble. Es gibt bewusst KEINEN
 * eigenen Sponsor-Tab — Sponsoren erscheinen innerhalb dieser Bereiche.
 */
export type Placement = "cover" | "home" | "live" | "benefits";

export const PLACEMENTS: { key: Placement; label: string }[] = [
  { key: "cover", label: "Titelblatt" },
  { key: "home", label: "Start" },
  { key: "live", label: "Live" },
  { key: "benefits", label: "Benefits" },
];

/** Design-Stile der Bubble — Details in ./design-presets.ts */
export type BubbleDesignPresetId = "premium_dark" | "festival_glow" | "club_matchday" | "retail_clean" | "sponsor_luxe";

/* ---------- Modul-System (Registry-fähig) ---------- */

export type ModuleCategory = "Engagement" | "Sponsoring" | "Daten" | "Community" | "Custom";
export type ModuleComplexity = "einfach" | "mittel" | "individuell";
export type ModuleStatus = "ready" | "roadmap" | "custom";

/**
 * Definition einer Funktion (Modul) in der Registry.
 * Neue Funktionen (Quiz, Glücksrad, Foto-Voting, …) werden später einfach
 * als weiterer Eintrag in MODULE_REGISTRY (./modules.ts) registriert —
 * das UI rendert sie automatisch.
 */
export type BubbleModuleDefinition = {
  moduleId: string;
  name: string;
  description: string;
  /** Was Besucher konkret sehen */
  visitorSees: string;
  category: ModuleCategory;
  defaultEnabled: boolean;
  placements: Placement[];
  requiresConfig: boolean;
  complexity: ModuleComplexity;
  /** Warum es für Event/Sponsor wertvoll ist */
  businessValue: string;
  status: ModuleStatus;
};

/** Aktivierungs-Zustand pro Bubble: moduleId → an/aus */
export type BubbleModuleState = Record<string, boolean>;

/* ---------- Sponsoren & Rewards (mehrfach, später eigene Tabellen) ---------- */

export type StudioSponsor = {
  id: string;
  name: string;
  /** Angebot / Aktion, z.B. „Freigetränk für jeden Tipp“ */
  offer: string;
  ctaText: string;
  ctaLink: string;
  /** Placeholder — später Storage-Upload */
  logoUrl: string;
  placements: Placement[];
};

export type StudioReward = {
  id: string;
  title: string;
  description: string;
  /** Zuordnung zum Sponsor (StudioSponsor.id) oder null = Veranstalter */
  sponsorId: string | null;
  redemptionHint: string;
  /** Freitext, z.B. „ab Halbzeit“ oder Datum */
  availableFrom: string;
  code: string;
  placements: Placement[];
};

/* ---------- Tracking ---------- */

export type TrackingSourceKey =
  | "entrance"
  | "bar"
  | "screen"
  | "stage"
  | "sponsor_table"
  | "instagram_story";

export type BubbleTrackingSource = {
  key: TrackingSourceKey;
  label: string;
  purpose: string;
};

export type CustomTrackingSource = {
  key: string;
  label: string;
  purpose: string;
};

export type TrackingLink = {
  key: string;
  label: string;
  purpose: string;
  url: string;
};

/* ---------- Der Draft: seitenweise gedacht ---------- */

export type LiveActionType = "voting" | "prediction" | "challenge" | "giveaway";

export type BubbleBranding = {
  logoUrl: string;
  heroImageUrl: string;
  primaryColor: string;
  accentColor: string;
  presetId: BubbleDesignPresetId;
};

export type BubbleDraft = {
  templateId: BubbleTemplateId | null;
  status: BubbleStatus;

  basics: {
    name: string;
    /** „Link zur Bubble“ — technisch der Slug, im UI nie so genannt */
    bubbleLink: string;
    partnerName: string;
    eventDate: string;
    location: string;
    expectedVisitors: string;
  };

  branding: BubbleBranding;

  /** Titelblatt — die erste Seite nach dem Scan */
  cover: {
    title: string;
    description: string;
    buttonText: string;
    partnerNote: string;
  };

  /** Startseite — hier verstehen Besucher, was sie machen können */
  home: {
    greeting: string;
    explainer: string;
    buttonText: string;
    /** moduleIds, die auf der Startseite prominent erscheinen */
    featuredModules: string[];
  };

  /** Die wichtigste Interaktion der Bubble */
  liveAction: {
    type: LiveActionType;
    question: string;
    options: string[];
    hint: string;
    buttonText: string;
    successMessage: string;
  };

  modules: BubbleModuleState;
  sponsors: StudioSponsor[];
  rewards: StudioReward[];

  tracking: {
    sources: TrackingSourceKey[];
    customSources: CustomTrackingSource[];
  };

  legal: {
    privacyUrl: string;
    imprintUrl: string;
    termsUrl: string;
    communityEnabled: boolean;
    communityNote: string;
    leadCaptureEnabled: boolean;
    termsChecked: boolean;
  };
};

/* ---------- Templates ---------- */

export type BubbleTemplate = {
  id: BubbleTemplateId;
  name: string;
  tagline: string;
  description: string;
  /** Für wen geeignet */
  audience: string;
  typicalModules: string[];
  typicalSponsors: string;
  expectedOutcome: string;
  exampleFunnel: { scans: number; participations: number; redemptions: number };
  difficulty: ModuleComplexity;
  setupTime: string;
  recommended: boolean;
  colors: { primary: string; accent: string };
  /** Befüllt den Draft beim Auswählen sinnvoll vor */
  seed: Omit<BubbleDraft, "templateId" | "status" | "basics"> & {
    basics: Pick<BubbleDraft["basics"], "expectedVisitors">;
  };
};

/* ---------- Multi-Admin / Organisationen (Konzept, keine Auth) ---------- */

export type StudioRoleId = "super_admin" | "operator" | "partner_admin" | "event_manager" | "viewer";

export type StudioRole = {
  id: StudioRoleId;
  name: string;
  description: string;
};

export type StudioOrganization = {
  id: string;
  name: string;
  kind: string;
  color: string;
};

/**
 * Mitglied/Zugang — Mock für die spätere Tabelle `organization_members`
 * (user_id, organization_id, role). Keine echte Auth.
 */
export type StudioMember = {
  id: string;
  name: string;
  email: string;
  roleId: StudioRoleId;
  organizationId: string;
};

/* ---------- Dashboard / KPIs ---------- */

export type BubbleKpis = {
  scans: number;
  landingViews: number;
  liveViews: number;
  participations: number;
  leads: number;
  rewardClaims: number;
  redemptions: number;
  sponsorClicks: number;
};

export type BubbleStudioItem = {
  id: string;
  name: string;
  slug: string;
  partnerName: string;
  eventType: string;
  eventDate: string;
  location: string;
  status: BubbleStatus;
  templateId: BubbleTemplateId;
  primaryColor: string;
  accentColor: string;
  kpis: BubbleKpis;
  /** Gehört später einer Organisation (Kunde/Partner) */
  organizationId: string | null;
  isProtectedPilot: boolean;
  isTemplate: boolean;
};

export type BubbleStudioExistingItem = {
  id: string;
  name: string;
  slug: string;
  partnerName: string;
  eventType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type ChecklistItemKey =
  | "basics"
  | "cover"
  | "liveAction"
  | "cta"
  | "tracking"
  | "legal"
  | "communitySafety"
  | "sponsorReward";

export type BubbleLaunchChecklistItem = {
  key: ChecklistItemKey;
  label: string;
  hint: string;
  done: boolean;
};

export type BubbleLaunchChecklist = {
  items: BubbleLaunchChecklistItem[];
  readyToLaunch: boolean;
};

export type FunnelStep = {
  key: keyof BubbleKpis;
  label: string;
  value: number;
};

/**
 * Zielformat für die spätere Andockung:
 * entspricht Database["public"]["Tables"]["bubbles"]["Insert"].
 * `features` und `config` nutzen exakt die Keys, die
 * `buildRuntimeBubbleConfig` in lib/bubble-config.ts heute liest.
 */
export type BubbleInsertPayload = {
  slug: string;
  name: string;
  event_name: string;
  type: string;
  partner_name: string;
  description: string;
  logo_url: string | null;
  hero_image_url: string | null;
  primary_color: string;
  accent_color: string;
  reward_title: string | null;
  reward_description: string | null;
  reward_terms: string | null;
  is_active: boolean;
  features: {
    live: boolean;
    community: boolean;
    polls: boolean;
    fanBattle: boolean;
    rewards: boolean;
    peopleHere: boolean;
    sponsorCard: boolean;
  };
  config: Record<string, unknown>;
};
