import { defaultModuleState, moduleState } from "./modules";
import type {
  BubbleDesignPresetId,
  BubbleTemplate,
  BubbleTrackingSource,
  StudioReward,
  StudioSponsor,
  TrackingSourceKey,
} from "./types";

export const TRACKING_SOURCES: BubbleTrackingSource[] = [
  { key: "entrance", label: "Eingang", purpose: "QR am Einlass — misst, wie viele Gäste direkt beim Ankommen scannen." },
  { key: "bar", label: "Bar / Theke", purpose: "Aufsteller an Bar und Theken — der stärkste Ort für Reward- und Deal-Scans." },
  { key: "screen", label: "Screen / Leinwand", purpose: "QR auf Videowand oder Leinwand — ideal in Pausen und vor Anpfiff." },
  { key: "stage", label: "Bühne / Moderation", purpose: "QR bei Bühnen-Ansage — misst den Effekt von Moderations-Callouts." },
  { key: "sponsor_table", label: "Sponsor-Fläche", purpose: "QR direkt am Sponsor-Stand — harter Beweis für Sponsor-Sichtbarkeit." },
  { key: "instagram_story", label: "Instagram Story", purpose: "Link in der Story des Veranstalters — misst Online-zu-Event-Reichweite." },
];

export function getTrackingSource(key: TrackingSourceKey): BubbleTrackingSource {
  return TRACKING_SOURCES.find((s) => s.key === key) ?? TRACKING_SOURCES[0];
}

/* ---------- Seed-Bausteine ---------- */

function sponsor(id: string, partial: Partial<StudioSponsor>): StudioSponsor {
  return {
    id,
    name: "",
    offer: "",
    ctaText: "Mehr erfahren",
    ctaLink: "",
    logoUrl: "",
    placements: ["home", "benefits"],
    ...partial,
  };
}

function reward(id: string, partial: Partial<StudioReward>): StudioReward {
  return {
    id,
    title: "",
    description: "",
    sponsorId: null,
    redemptionHint: "",
    availableFrom: "",
    code: "BUBBLE",
    placements: ["home", "benefits"],
    ...partial,
  };
}

type Seed = BubbleTemplate["seed"];

function baseSeed(overrides: {
  primary: string;
  accent: string;
  preset: BubbleDesignPresetId;
  modules: string[];
  cover: Seed["cover"];
  home: Seed["home"];
  liveAction: Seed["liveAction"];
  sponsors: StudioSponsor[];
  rewards: StudioReward[];
  sources: TrackingSourceKey[];
  legal?: Partial<Seed["legal"]>;
  expectedVisitors?: string;
}): Seed {
  return {
    basics: { expectedVisitors: overrides.expectedVisitors ?? "" },
    branding: { logoUrl: "", heroImageUrl: "", primaryColor: overrides.primary, accentColor: overrides.accent, presetId: overrides.preset },
    cover: overrides.cover,
    home: overrides.home,
    liveAction: overrides.liveAction,
    modules: overrides.modules.length > 0 ? moduleState(overrides.modules) : defaultModuleState(),
    sponsors: overrides.sponsors,
    rewards: overrides.rewards,
    tracking: { sources: overrides.sources, customSources: [] },
    legal: {
      privacyUrl: "",
      imprintUrl: "",
      termsUrl: "",
      communityEnabled: overrides.modules.includes("community"),
      communityNote: "Beiträge werden moderiert. Bleib freundlich und poste nur, was in diese Bubble passt.",
      leadCaptureEnabled: overrides.modules.includes("leadCapture"),
      termsChecked: false,
      ...overrides.legal,
    },
  };
}

/* ---------- Die 7 Templates ---------- */

export const TEMPLATES: BubbleTemplate[] = [
  {
    id: "public_viewing",
    name: "Public Viewing Bubble",
    tagline: "Stadion-Feeling für die Fanzone",
    description: "Tipp-Spiel, Live-Voting und Sponsor-Deals für große Übertragungen.",
    audience: "Städte, Veranstalter, Fanzonen, Rudelgucken",
    typicalModules: ["scorePrediction", "liveVoting", "giveaway", "benefits", "sponsorCards"],
    typicalSponsors: "Brauereien, Sparkassen, Stadtwerke, lokale Gastro",
    expectedOutcome: "Hohe Teilnahme + messbare Sponsor-Sichtbarkeit am Eventtag",
    exampleFunnel: { scans: 2000, participations: 1100, redemptions: 400 },
    difficulty: "einfach",
    setupTime: "ca. 20 Min",
    recommended: true,
    colors: { primary: "#0058be", accent: "#f7c800" },
    seed: baseSeed({
      preset: "premium_dark",
      primary: "#0058be",
      accent: "#f7c800",
      modules: ["scorePrediction", "liveVoting", "giveaway", "benefits", "sponsorCards"],
      expectedVisitors: "500-2000",
      cover: {
        title: "Public Viewing — sei live dabei",
        description: "Tippe den Endstand, stimme ab und sichere dir Vorteile direkt vor Ort.",
        buttonText: "Jetzt mitmachen",
        partnerNote: "Präsentiert von unseren lokalen Partnern",
      },
      home: {
        greeting: "Schön, dass du da bist!",
        explainer: "Hier kannst du vor Anpfiff tippen, während des Spiels abstimmen und danach deinen Gewinn abholen.",
        buttonText: "Los geht's",
        featuredModules: ["scorePrediction", "liveVoting", "benefits"],
      },
      liveAction: {
        type: "prediction",
        question: "Wie geht das Spiel heute aus?",
        options: [],
        hint: "Tipp abgeben bis Anpfiff — danach zählt nur noch Daumendrücken.",
        buttonText: "Tipp abgeben",
        successMessage: "Tipp gespeichert! Die Gewinner werden nach Abpfiff gezogen.",
      },
      sponsors: [
        sponsor("sp-1", {
          name: "Brauerei Musterbräu",
          offer: "Freigetränk für jeden abgegebenen Tipp",
          ctaText: "Zum Angebot",
          placements: ["cover", "home", "live", "benefits"],
        }),
      ],
      rewards: [
        reward("rw-1", {
          title: "1x Freigetränk",
          description: "Für deinen abgegebenen Tipp",
          sponsorId: "sp-1",
          redemptionHint: "Zeige diesen Screen an der Bar.",
          availableFrom: "Ab Anpfiff",
          code: "ANSTOSS",
          placements: ["home", "benefits"],
        }),
      ],
      sources: ["entrance", "bar", "screen", "stage"],
    }),
  },
  {
    id: "club_matchday",
    name: "Club Matchday Bubble",
    tagline: "Heimspiel-Aktivierung für Vereine",
    description: "Spieltags-Bubble mit Tipp-Spiel, Fan-Voting und den Sponsoren des Vereins.",
    audience: "Handball-, Basketball- und Fußballvereine",
    typicalModules: ["scorePrediction", "liveVoting", "community", "benefits", "sponsorCards"],
    typicalSponsors: "Autohäuser, Volksbanken, regionale Marken, Fanshop",
    expectedOutcome: "Wiederkehrende Fans + Sponsor-Beweis für jede Saison",
    exampleFunnel: { scans: 600, participations: 380, redemptions: 150 },
    difficulty: "einfach",
    setupTime: "ca. 15 Min",
    recommended: true,
    colors: { primary: "#b61722", accent: "#141b2b" },
    seed: baseSeed({
      preset: "club_matchday",
      primary: "#b61722",
      accent: "#141b2b",
      modules: ["scorePrediction", "liveVoting", "community", "benefits", "sponsorCards"],
      expectedVisitors: "100-500",
      cover: {
        title: "Matchday — dein Verein, deine Bubble",
        description: "Tippe das Ergebnis, feuere dein Team an und sichere dir den Spieltags-Deal.",
        buttonText: "Zum Spieltag",
        partnerNote: "Unterstützt von den Sponsoren eures Vereins",
      },
      home: {
        greeting: "Willkommen in der Halle!",
        explainer: "Vor dem Spiel tippen, in der Pause abstimmen, nach dem Spiel Gewinner feiern.",
        buttonText: "Mitmachen",
        featuredModules: ["scorePrediction", "community", "benefits"],
      },
      liveAction: {
        type: "prediction",
        question: "Wie endet das Heimspiel heute?",
        options: [],
        hint: "Tipp bis Anpfiff abgeben. Der beste Tipp gewinnt den Spieltags-Preis.",
        buttonText: "Tipp abgeben",
        successMessage: "Stark! Dein Tipp ist drin — Gewinner werden in der Halle ausgerufen.",
      },
      sponsors: [
        sponsor("sp-1", {
          name: "Autohaus Beispiel",
          offer: "Spieltags-Preis: Wochenende mit dem Neuwagen",
          ctaText: "Sponsor entdecken",
          placements: ["home", "live", "benefits"],
        }),
      ],
      rewards: [
        reward("rw-1", {
          title: "10% im Fanshop",
          description: "Für alle, die heute mitgetippt haben",
          sponsorId: null,
          redemptionHint: "Code am Fanshop-Stand zeigen.",
          availableFrom: "Ab Halbzeit",
          code: "MATCHDAY",
          placements: ["home", "benefits"],
        }),
      ],
      sources: ["entrance", "bar", "screen", "sponsor_table"],
    }),
  },
  {
    id: "festival_sponsor",
    name: "Festival Sponsor Bubble",
    tagline: "Sponsor-Aktivierung auf dem Gelände",
    description: "Gewinnspiel, Rewards und Sponsor-Funnel für Festivals und Stadtfeste.",
    audience: "Festivals, Stadtfeste, Open Airs",
    typicalModules: ["liveVoting", "giveaway", "benefits", "sponsorCards", "leadCapture", "rewardRedemption"],
    typicalSponsors: "Getränkemarken, Energieversorger, Mobilfunk, Banken",
    expectedOutcome: "Leads + Einlösungen als harter Sponsor-ROI-Beweis",
    exampleFunnel: { scans: 5000, participations: 2400, redemptions: 900 },
    difficulty: "mittel",
    setupTime: "ca. 30 Min",
    recommended: false,
    colors: { primary: "#5b21b6", accent: "#f59e0b" },
    seed: baseSeed({
      preset: "festival_glow",
      primary: "#5b21b6",
      accent: "#f59e0b",
      modules: ["liveVoting", "giveaway", "benefits", "sponsorCards", "leadCapture", "rewardRedemption"],
      expectedVisitors: ">10000",
      cover: {
        title: "Dein Festival. Deine Bubble.",
        description: "Abstimmen, gewinnen und Festival-Rewards direkt auf dem Gelände einlösen.",
        buttonText: "Bubble öffnen",
        partnerNote: "Mit Unterstützung des offiziellen Festival-Partners",
      },
      home: {
        greeting: "Hey, schön dich zu sehen!",
        explainer: "Stimm über den Song des Abends ab, gewinn beim Festival-Gewinnspiel und hol dir deinen Reward am Stand.",
        buttonText: "Jetzt starten",
        featuredModules: ["liveVoting", "giveaway", "benefits"],
      },
      liveAction: {
        type: "voting",
        question: "Welcher Act war heute dein Highlight?",
        options: ["Main Stage Headliner", "Newcomer Stage", "DJ-Set am See"],
        hint: "Abstimmen bis Mitternacht — das Ergebnis siehst du live.",
        buttonText: "Abstimmen",
        successMessage: "Danke für deine Stimme! Schau später vorbei, wer vorne liegt.",
      },
      sponsors: [
        sponsor("sp-1", {
          name: "Energie Musterstadt",
          offer: "Lade-Lounge + Gewinnspiel am Sponsor-Stand",
          ctaText: "Zur Lade-Lounge",
          placements: ["cover", "home", "benefits"],
        }),
        sponsor("sp-2", {
          name: "Getränke Nordlicht",
          offer: "1x Softdrink für jede Teilnahme",
          ctaText: "Angebot ansehen",
          placements: ["home", "benefits"],
        }),
      ],
      rewards: [
        reward("rw-1", {
          title: "Festival-Softdrink",
          description: "1x gratis am Sponsor-Stand",
          sponsorId: "sp-2",
          redemptionHint: "Am Getränke-Stand zeigen — solange Vorrat reicht.",
          availableFrom: "Ab Einlass",
          code: "FESTIVAL",
          placements: ["home", "benefits"],
        }),
        reward("rw-2", {
          title: "VIP-Upgrade Verlosung",
          description: "Hauptpreis am Sonntag",
          sponsorId: "sp-1",
          redemptionHint: "Gewinner werden per Bubble benachrichtigt.",
          availableFrom: "Ziehung Sonntag 18 Uhr",
          code: "VIP",
          placements: ["benefits"],
        }),
      ],
      sources: ["entrance", "bar", "stage", "sponsor_table", "instagram_story"],
    }),
  },
  {
    id: "bar_night",
    name: "Bar Night Bubble",
    tagline: "Gastro-Aktivierung am Abend",
    description: "Voting, Community und Deals für Bars, Clubs und Restaurants.",
    audience: "Bars, Clubs, Gastro-Abende, Quiz Nights",
    typicalModules: ["liveVoting", "community", "benefits", "giveaway"],
    typicalSponsors: "Spirituosenmarken, Brauereien, Lieferdienste",
    expectedOutcome: "Längere Verweildauer + direkte Umsatz-Deals",
    exampleFunnel: { scans: 250, participations: 140, redemptions: 80 },
    difficulty: "einfach",
    setupTime: "ca. 10 Min",
    recommended: false,
    colors: { primary: "#0f172a", accent: "#e11d48" },
    seed: baseSeed({
      preset: "premium_dark",
      primary: "#0f172a",
      accent: "#e11d48",
      modules: ["liveVoting", "community", "benefits", "giveaway"],
      expectedVisitors: "100-500",
      cover: {
        title: "Der Abend läuft — sei Teil davon",
        description: "Vote für den nächsten Track, schnapp dir den Abend-Deal und schreib der Bar.",
        buttonText: "Dabei sein",
        partnerNote: "Heute Abend mit unserer Hausmarke",
      },
      home: {
        greeting: "Willkommen!",
        explainer: "Stimm über die Musik ab, sichere dir den Deal des Abends und hinterlass einen Gruß an der Pinnwand.",
        buttonText: "Loslegen",
        featuredModules: ["liveVoting", "benefits", "community"],
      },
      liveAction: {
        type: "voting",
        question: "Was läuft als Nächstes?",
        options: ["90s Hip-Hop", "House Classics", "Indie Hits"],
        hint: "Das Voting entscheidet die nächste halbe Stunde.",
        buttonText: "Abstimmen",
        successMessage: "Stimme gezählt! Gleich hörst du das Ergebnis.",
      },
      sponsors: [
        sponsor("sp-1", {
          name: "Hausmarke Gin",
          offer: "2für1 auf den Drink des Abends",
          ctaText: "Deal ansehen",
          placements: ["home", "benefits"],
        }),
      ],
      rewards: [
        reward("rw-1", {
          title: "Happy-Hour-Deal",
          description: "2für1 auf den Drink des Abends",
          sponsorId: "sp-1",
          redemptionHint: "Screen an der Bar zeigen.",
          availableFrom: "Bis 23 Uhr",
          code: "BARNIGHT",
          placements: ["home", "benefits"],
        }),
      ],
      sources: ["entrance", "bar", "instagram_story"],
    }),
  },
  {
    id: "expo_lead",
    name: "Messe Lead Bubble",
    tagline: "Leads statt Visitenkarten",
    description: "Gewinnspiel, Kontakt-Abfrage und Follow-up-Funnel für Messestände.",
    audience: "Messen, B2B-Events, Konferenzen",
    typicalModules: ["giveaway", "benefits", "sponsorCards", "leadCapture"],
    typicalSponsors: "Der Aussteller selbst + Co-Partner am Stand",
    expectedOutcome: "Qualifizierte Leads mit Einwilligung statt Kartenstapel",
    exampleFunnel: { scans: 800, participations: 450, redemptions: 200 },
    difficulty: "mittel",
    setupTime: "ca. 25 Min",
    recommended: false,
    colors: { primary: "#065f46", accent: "#0ea5e9" },
    seed: baseSeed({
      preset: "retail_clean",
      primary: "#065f46",
      accent: "#0ea5e9",
      modules: ["giveaway", "benefits", "sponsorCards", "leadCapture"],
      expectedVisitors: "500-2000",
      cover: {
        title: "30 Sekunden — eine Chance zu gewinnen",
        description: "Nimm am Stand-Gewinnspiel teil und bleib mit uns im Gespräch.",
        buttonText: "Teilnehmen",
        partnerNote: "Der Aussteller hinter dieser Bubble",
      },
      home: {
        greeting: "Schön, dass du am Stand warst!",
        explainer: "Gewinnspiel ausfüllen, Goodie abholen — und wenn du willst, bleiben wir in Kontakt.",
        buttonText: "Zum Gewinnspiel",
        featuredModules: ["giveaway", "benefits"],
      },
      liveAction: {
        type: "giveaway",
        question: "Tägliche Verlosung am Stand — bist du dabei?",
        options: [],
        hint: "Ziehung täglich um 16 Uhr direkt am Stand.",
        buttonText: "Jetzt teilnehmen",
        successMessage: "Du bist dabei! Viel Glück bei der Ziehung um 16 Uhr.",
      },
      sponsors: [
        sponsor("sp-1", {
          name: "Muster Solutions GmbH",
          offer: "Live-Demo + Messe-Rabatt am Stand B42",
          ctaText: "Demo buchen",
          placements: ["cover", "home", "benefits"],
        }),
      ],
      rewards: [
        reward("rw-1", {
          title: "Messe-Goodie",
          description: "Kleines Dankeschön für deine Teilnahme",
          sponsorId: "sp-1",
          redemptionHint: "Bestätigung am Stand B42 zeigen.",
          availableFrom: "Sofort",
          code: "EXPO",
          placements: ["benefits"],
        }),
      ],
      sources: ["entrance", "sponsor_table", "screen"],
      legal: { leadCaptureEnabled: true },
    }),
  },
  {
    id: "sponsor_activation",
    name: "Sponsor Activation Bubble",
    tagline: "Eine Bubble ganz im Zeichen eines Sponsors",
    description: "Maximale Sponsor-Sichtbarkeit mit Reward, Einlösung und ROI-Report.",
    audience: "Marken, Agenturen, Sponsoren mit eigener Eventfläche",
    typicalModules: ["giveaway", "benefits", "sponsorCards", "leadCapture", "rewardRedemption"],
    typicalSponsors: "Sparkassen, Stadtwerke, Automarken, Brauereien",
    expectedOutcome: "Der komplette Beweis: Scans → Teilnahmen → Leads → Einlösungen",
    exampleFunnel: { scans: 1500, participations: 800, redemptions: 350 },
    difficulty: "mittel",
    setupTime: "ca. 25 Min",
    recommended: false,
    colors: { primary: "#9a3412", accent: "#0f766e" },
    seed: baseSeed({
      preset: "sponsor_luxe",
      primary: "#9a3412",
      accent: "#0f766e",
      modules: ["giveaway", "benefits", "sponsorCards", "leadCapture", "rewardRedemption"],
      expectedVisitors: "2000-10000",
      cover: {
        title: "Die Aktion deines Sponsors — live vor Ort",
        description: "Mitmachen, Reward sichern und direkt an der Sponsor-Fläche einlösen.",
        buttonText: "Aktion starten",
        partnerNote: "Eine Aktion von deinem Sponsor",
      },
      home: {
        greeting: "Willkommen bei der Aktion!",
        explainer: "Teilnehmen dauert 30 Sekunden — dein Reward wartet an der Sponsor-Fläche.",
        buttonText: "Mitmachen",
        featuredModules: ["giveaway", "benefits", "sponsorCards"],
      },
      liveAction: {
        type: "challenge",
        question: "Besuche die Sponsor-Fläche und sichere dir deinen Reward",
        options: [],
        hint: "Einfach vorbeikommen, Screen zeigen, Reward abholen.",
        buttonText: "Challenge starten",
        successMessage: "Geschafft! Zeig diesen Screen an der Sponsor-Fläche.",
      },
      sponsors: [
        sponsor("sp-1", {
          name: "Sparkasse Musterstadt",
          offer: "Glücksrad + Sofort-Gewinne an der Aktionsfläche",
          ctaText: "Zur Aktion",
          placements: ["cover", "home", "live", "benefits"],
        }),
      ],
      rewards: [
        reward("rw-1", {
          title: "Sofort-Gewinn",
          description: "Kleiner Preis für jede Teilnahme",
          sponsorId: "sp-1",
          redemptionHint: "An der Aktionsfläche einlösen.",
          availableFrom: "Sofort",
          code: "AKTION",
          placements: ["home", "benefits"],
        }),
      ],
      sources: ["entrance", "sponsor_table", "screen", "stage"],
    }),
  },
  {
    id: "custom",
    name: "Custom Bubble",
    tagline: "Leere Bubble, volle Freiheit",
    description: "Starte ohne Vorgaben und konfiguriere jede Seite selbst.",
    audience: "Alles, was in keine Schublade passt",
    typicalModules: ["liveVoting", "community"],
    typicalSponsors: "Frei wählbar",
    expectedOutcome: "Individuelles Setup für Sonderformate",
    exampleFunnel: { scans: 500, participations: 250, redemptions: 100 },
    difficulty: "individuell",
    setupTime: "ab 30 Min",
    recommended: false,
    colors: { primary: "#0058be", accent: "#b61722" },
    seed: baseSeed({
      preset: "retail_clean",
      primary: "#0058be",
      accent: "#b61722",
      modules: [],
      cover: {
        title: "Willkommen in deiner Bubble",
        description: "Scannen, beitreten, live dabei sein.",
        buttonText: "Jetzt mitmachen",
        partnerNote: "",
      },
      home: {
        greeting: "Schön, dass du da bist!",
        explainer: "Hier findest du alles, was heute in dieser Bubble passiert.",
        buttonText: "Los geht's",
        featuredModules: ["liveVoting"],
      },
      liveAction: {
        type: "voting",
        question: "Was denkst du?",
        options: ["Option A", "Option B"],
        hint: "",
        buttonText: "Abstimmen",
        successMessage: "Danke für deine Stimme!",
      },
      sponsors: [],
      rewards: [],
      sources: ["entrance", "bar", "screen"],
    }),
  },
];

export function getTemplate(id: string | null | undefined): BubbleTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[TEMPLATES.length - 1];
}
