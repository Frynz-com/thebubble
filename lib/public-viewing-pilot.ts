import type { MatchOutcome, MatchOutcomeLabels } from "@/lib/match-prediction";

export type PublicViewingPilotConfig = {
  slug: string;
  customerTitle: string;
  subtitle: string;
  matchTitle: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  logoUrl: string;
  coverUrl: string;
  matchEventLogoUrl: string;
  entryAlt: string;
  source: string;
  resetCode: string;
  resetPlaceholder: string;
  contactOwner: string;
  prizeTitle: string;
  prizeMain: string;
  prizeChips: string[];
  prizeHint: string;
  prizePoolAdminText: string;
  mainText: string;
  benefitsIntro: string;
  benefitsHint: string;
  detailedPrizes: string[];
  requiresExactScore: boolean;
  requiresContact: boolean;
  privacyConsentText: string;
  privacyNoticeText: string;
  termsText: string;
  theme: {
    primary: string;
    accent: string;
  };
};

const defaultPilotConfig: PublicViewingPilotConfig = {
  slug: "huber-arena",
  customerTitle: "Huber Arena",
  subtitle: "Public Viewing",
  matchTitle: "Deutschland vs. Ecuador",
  homeTeam: "Deutschland",
  awayTeam: "Ecuador",
  homeFlag: "🇩🇪",
  awayFlag: "🇪🇨",
  logoUrl: "/images/huber-arena-logo.webp",
  coverUrl: "/images/huber-arena-cover.webp",
  matchEventLogoUrl: "",
  entryAlt: "Public Viewing in der Huber Arena",
  source: "huber_entry",
  resetCode: "RESET HUBER",
  resetPlaceholder: "RESET HUBER",
  contactOwner: "die Huber Arena",
  prizeTitle: "Das kannst du gewinnen",
  prizeMain: "10x 15 € Huber Arena Verzehrkarte",
  prizeChips: ["1x 20 % adidas Rabatt", "1x 15 % JD Sports Rabatt", "1x 15 % ABOUT YOU Rabatt"],
  prizeHint: "Unter allen richtigen Tipps werden die Gewinne nach dem Spiel verlost.",
  prizePoolAdminText: "Gewinnpool: 10x 15 € Huber Arena Verzehrkarte, 1x 20 % adidas, 1x 15 % JD Sports, 1x 15 % ABOUT YOU.",
  mainText: "Gib deinen Tipp ab und sichere dir die Chance auf Gewinne.",
  benefitsIntro: "Unter allen richtigen Tipps werden die Gewinne nach dem Spiel verlost.",
  benefitsHint: "Gewinner werden nach dem Spiel über die angegebene Telefonnummer oder E-Mail benachrichtigt.",
  detailedPrizes: [
    "10x 15 € Huber Arena Verzehrkarte",
    "1x 20 % adidas Rabattgutschein",
    "1x 15 % JD Sports Rabattcode",
    "1x 15 % ABOUT YOU Rabattgutschein",
  ],
  requiresExactScore: false,
  requiresContact: false,
  privacyConsentText: "",
  privacyNoticeText: "",
  termsText: "",
  theme: {
    primary: "#0058be",
    accent: "#b61722",
  },
};

const pilotConfigs: Record<string, PublicViewingPilotConfig> = {
  "huber-arena": defaultPilotConfig,
  "public-viewing-quickborn": {
    slug: "public-viewing-quickborn",
    customerTitle: "Public Viewing Quickborn",
    subtitle: "Public Viewing",
    matchTitle: "Deutschland vs. Paraguay",
    homeTeam: "Deutschland",
    awayTeam: "Paraguay",
    homeFlag: "🇩🇪",
    awayFlag: "🇵🇾",
    logoUrl: "/public-viewing-quickborn/logo.jpg",
    coverUrl: "/public-viewing-quickborn/cover.png",
    matchEventLogoUrl: "/public-viewing-quickborn/match-event-logo.png",
    entryAlt: "Public Viewing Quickborn",
    source: "quickborn_entry",
    resetCode: "RESET QUICKBORN",
    resetPlaceholder: "RESET QUICKBORN",
    contactOwner: "Public Viewing Quickborn",
    prizeTitle: "Das kannst du gewinnen",
    prizeMain: "2× 20 € Gutschein zum direkten Einlösen auf der Veranstaltung.",
    prizeChips: ["2× Gästelistenplatz Match Open Air", "20 % Adidas", "15 % JD Sports", "15 % ABOUT YOU"],
    prizeHint: "Unter allen gültigen Tipps werden die Gewinne nach dem Spiel vergeben. Exakte Treffer haben Vorrang bei der Auswertung.",
    prizePoolAdminText: "Gewinnpool: 2× 20 € Gutschein zum direkten Einlösen auf der Veranstaltung, 2× Gästelistenplatz für das Match Open Air, 1× 20 % Adidas, 1× 15 % JD Sports, 1× 15 % ABOUT YOU.",
    mainText: "Gib deinen genauen Ergebnistipp für Deutschland gegen Paraguay ab und nimm automatisch am Gewinnspiel teil. Exakte Treffer werden nach dem Spiel ausgewertet.",
    benefitsIntro: "Unter allen gültigen Tipps werden die Gewinne nach dem Spiel vergeben. Exakte Treffer haben Vorrang bei der Auswertung.",
    benefitsHint: "Die Gewinner werden über die angegebene Telefonnummer oder E-Mail benachrichtigt.",
    detailedPrizes: [
      "2× Gästelistenplatz für das Match Open Air",
      "1× 20 % Adidas Gutschein",
      "1× 15 % JD Sports Gutschein",
      "1× 15 % ABOUT YOU Gutschein",
    ],
    requiresExactScore: true,
    requiresContact: true,
    privacyConsentText: "Ich bin damit einverstanden, dass meine Angaben und mein Tipp zur Durchführung des Gewinnspiels gespeichert, ausgewertet und zur Gewinnerbenachrichtigung durch The Bubble GmbH und Match Langenhorn / Public Viewing Quickborn verwendet werden. Ich kann meine Einwilligung jederzeit per E-Mail an kai@yourbubble.app widerrufen.",
    privacyNoticeText: "Verantwortlich für die technische Durchführung ist The Bubble GmbH, Königstraße 40, 70173 Stuttgart. Veranstalterseitiger Ansprechpartner ist Match Langenhorn / Patricia Kahl, Tangstedter Landstraße 182, 22415 Hamburg. Die angegebenen Daten werden ausschließlich zur Durchführung des Gewinnspiels, zur Auswertung der Tipps und zur Benachrichtigung der Gewinner verwendet. Eine Weitergabe an Dritte zu Werbezwecken erfolgt nicht. Die Einwilligung kann jederzeit mit Wirkung für die Zukunft per E-Mail an kai@yourbubble.app widerrufen werden.",
    termsText: "Teilnahmeberechtigt sind Besucherinnen und Besucher des Public Viewing Quickborn. Pro Person ist nur eine Teilnahme vorgesehen. Für die Teilnahme ist ein gültiger Ergebnistipp sowie eine Kontaktmöglichkeit erforderlich. Die Gewinner werden nach dem Spiel anhand der Tipps ausgewertet und über die angegebenen Kontaktdaten benachrichtigt. Der Rechtsweg ist ausgeschlossen.",
    theme: {
      primary: "#dd0000",
      accent: "#f7c800",
    },
  },
};

export const publicViewingPilotSlugs = Object.keys(pilotConfigs);

export function isPublicViewingPilotSlug(slug: string) {
  return slug in pilotConfigs;
}

export function getPublicViewingPilotConfig(slug: string): PublicViewingPilotConfig {
  return pilotConfigs[slug] ?? defaultPilotConfig;
}

export function getPilotOutcomeLabels(slugOrConfig: string | PublicViewingPilotConfig): MatchOutcomeLabels {
  const config = typeof slugOrConfig === "string" ? getPublicViewingPilotConfig(slugOrConfig) : slugOrConfig;
  return {
    deutschland: config.homeTeam,
    unentschieden: "Unentschieden",
    ecuador: config.awayTeam,
  };
}

export function outcomeOptionsForPilot(slug: string): Array<{ value: MatchOutcome; label: string }> {
  const labels = getPilotOutcomeLabels(slug);
  return [
    { value: "deutschland", label: labels.deutschland || "Deutschland" },
    { value: "unentschieden", label: labels.unentschieden || "Unentschieden" },
    { value: "ecuador", label: labels.ecuador || "Ecuador" },
  ];
}
