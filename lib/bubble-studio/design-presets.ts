import type { BubbleDesignPresetId } from "./types";

/**
 * Design-Stile für die Bubble — verändern Layout, Stimmung und Hierarchie,
 * nicht nur Farben. Keine externen Assets: alles über Gradients und Shapes.
 * Die Preview (mobile-preview.tsx) liest ausschließlich aus diesen Tokens.
 */
export type BubbleDesignPreset = {
  id: BubbleDesignPresetId;
  name: string;
  tagline: string;
  suitedFor: string;
  defaultPrimary: string;
  defaultAccent: string;
  /** Innere Bubble-Flächen dunkel? */
  appDark: boolean;
  /** Hintergrundfarbe der Bubble-Bereiche (Start/Live/Benefits) */
  appBg: string;
  /** Titelblatt-Hintergrund */
  coverBg: (primary: string, accent: string) => string;
  /** Begrüßungs-Panel (Start) und Live-Header */
  panelBg: (primary: string, accent: string) => string;
  /** Zusätzliche Textur über dem Titelblatt (CSS background-image) */
  coverTexture?: string;
  /** Button-Form */
  buttonClass: string;
  /** Uppercase-Labels für Luxe-Feeling */
  luxeLabels: boolean;
};

export const DESIGN_PRESETS: BubbleDesignPreset[] = [
  {
    id: "premium_dark",
    name: "Premium Dark",
    tagline: "Dunkel, kontrastreich, kraftvoll",
    suitedFor: "Sport, Sponsoren, hochwertige Abend-Events",
    defaultPrimary: "#0058be",
    defaultAccent: "#f7c800",
    appDark: true,
    appBg: "#0b1220",
    coverBg: (primary) => `radial-gradient(130% 100% at 85% -10%, ${primary} 0%, #0b1220 62%)`,
    panelBg: (primary) => `linear-gradient(150deg, ${primary}26 0%, #101a30 70%)`,
    buttonClass: "rounded-2xl",
    luxeLabels: false,
  },
  {
    id: "festival_glow",
    name: "Festival Glow",
    tagline: "Warm, emotional, sommerlich",
    suitedFor: "Festivals, Bars, Sommer-Events, Stadtfeste",
    defaultPrimary: "#7c2d92",
    defaultAccent: "#fb923c",
    appDark: false,
    appBg: "#fff7ed",
    coverBg: (primary, accent) =>
      `radial-gradient(120% 90% at 20% 0%, ${accent}cc 0%, transparent 55%), radial-gradient(130% 110% at 90% 20%, ${primary} 0%, #2a0a3a 90%)`,
    panelBg: (primary, accent) => `linear-gradient(140deg, ${primary} 0%, ${accent} 170%)`,
    coverTexture: "radial-gradient(circle at 30% 80%, rgba(255,255,255,0.12) 0 2px, transparent 3px)",
    buttonClass: "rounded-full",
    luxeLabels: false,
  },
  {
    id: "club_matchday",
    name: "Club Matchday",
    tagline: "Sportlich, dynamisch, laut",
    suitedFor: "Handball, Basketball, Fußball — jeder Spieltag",
    defaultPrimary: "#b61722",
    defaultAccent: "#141b2b",
    appDark: false,
    appBg: "#f1f5f9",
    coverBg: (primary, accent) => `linear-gradient(115deg, ${primary} 0%, ${primary} 48%, ${accent} 48.2%, #0b1220 100%)`,
    panelBg: (primary) => `linear-gradient(115deg, ${primary} 0%, #0b1220 130%)`,
    coverTexture:
      "repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 14px)",
    buttonClass: "rounded-xl",
    luxeLabels: false,
  },
  {
    id: "retail_clean",
    name: "Retail Clean",
    tagline: "Hell, vertrauenswürdig, ruhig",
    suitedFor: "EDEKA, Gastronomie, POS, lokale Händler",
    defaultPrimary: "#166534",
    defaultAccent: "#f59e0b",
    appDark: false,
    appBg: "#f8fafc",
    coverBg: (primary) => `linear-gradient(180deg, #ffffff 0%, ${primary}14 100%)`,
    panelBg: (primary) => `linear-gradient(140deg, ${primary} 0%, ${primary}d9 130%)`,
    buttonClass: "rounded-2xl",
    luxeLabels: false,
  },
  {
    id: "sponsor_luxe",
    name: "Sponsor Luxe",
    tagline: "Reduziert, edel, sehr premium",
    suitedFor: "Banken, Stadtwerke, Autohäuser, Marken-Sponsoren",
    defaultPrimary: "#171717",
    defaultAccent: "#c9a227",
    appDark: true,
    appBg: "#111113",
    coverBg: () => `linear-gradient(170deg, #1c1c1f 0%, #0a0a0b 100%)`,
    panelBg: (_primary, accent) => `linear-gradient(150deg, #1c1c1f 0%, ${accent}22 160%)`,
    coverTexture: "linear-gradient(90deg, transparent 49.6%, rgba(201,162,39,0.25) 49.8%, transparent 50%)",
    buttonClass: "rounded-full",
    luxeLabels: true,
  },
];

export function getDesignPreset(id: BubbleDesignPresetId | string | null | undefined): BubbleDesignPreset {
  return DESIGN_PRESETS.find((p) => p.id === id) ?? DESIGN_PRESETS[0];
}
