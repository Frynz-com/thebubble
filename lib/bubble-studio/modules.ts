import type { BubbleModuleDefinition } from "./types";

/**
 * Funktions-Registry des Bubble Studios.
 *
 * Neue Funktion registrieren = neuen Eintrag hinzufügen.
 * Wizard, Startseiten-Auswahl und Preview lesen ausschließlich aus dieser
 * Liste — es gibt keine hartcodierten Funktions-Keys im UI.
 *
 * Später über Codex/Fable als individuelle Funktionen baubar:
 * Matching, Quiz, Glücksrad, Lead Game, Foto-Voting,
 * Check-in Challenge, Sponsor Code Hunt.
 */
export const MODULE_REGISTRY: BubbleModuleDefinition[] = [
  {
    moduleId: "liveVoting",
    name: "Live Voting",
    description: "Besucher stimmen über eine Frage ab — das Ergebnis ist live für alle sichtbar.",
    visitorSees: "Eine Frage mit Antwort-Buttons und Live-Balken, die sich vor den Augen der Besucher bewegen.",
    category: "Engagement",
    defaultEnabled: true,
    placements: ["home", "live"],
    requiresConfig: true,
    complexity: "einfach",
    businessValue: "Schnellste Aktivierung: jeder kann in 5 Sekunden teilnehmen — perfekt für Momentum im Event.",
    status: "ready",
  },
  {
    moduleId: "scorePrediction",
    name: "Tipp-Spiel",
    description: "Besucher tippen das Ergebnis vor Anpfiff — wie beim Huber-Arena-Pilot.",
    visitorSees: "Ein Scoreboard, in dem sie ihren Endstand-Tipp eingeben und speichern.",
    category: "Engagement",
    defaultEnabled: false,
    placements: ["home", "live"],
    requiresConfig: true,
    complexity: "einfach",
    businessValue: "Hohe Teilnahme bei Sportevents — kombiniert mit einem Sponsor-Preis der stärkste Scan-Grund.",
    status: "ready",
  },
  {
    moduleId: "giveaway",
    name: "Gewinnspiel",
    description: "Besucher nehmen an einer Verlosung teil, Gewinner werden nach dem Event gezogen.",
    visitorSees: "Eine Teilnahme-Karte mit einem Button und einer Bestätigung nach der Teilnahme.",
    category: "Engagement",
    defaultEnabled: false,
    placements: ["home", "live", "benefits"],
    requiresConfig: true,
    complexity: "mittel",
    businessValue: "Der stärkste Grund zu scannen — und die Basis für Leads. Braucht Teilnahmebedingungen.",
    status: "ready",
  },
  {
    moduleId: "benefits",
    name: "Benefits & Deals",
    description: "Vorteile, Gutscheine und Deals von Veranstalter und Partnern.",
    visitorSees: "Schöne Vorteils-Karten mit Status (verfügbar/einlösbar) und Einlöse-Hinweis.",
    category: "Sponsoring",
    defaultEnabled: true,
    placements: ["home", "benefits"],
    requiresConfig: true,
    complexity: "einfach",
    businessValue: "Der direkte Mehrwert für Gäste — bringt Besucher mehrfach zurück in die Bubble.",
    status: "ready",
  },
  {
    moduleId: "sponsorCards",
    name: "Sponsor Cards",
    description: "Gebrandete Partner-Karten mit Button — jeder Klick wird gezählt.",
    visitorSees: "Hochwertige Partner-Karten in Start, Live und Benefits — nicht wie Werbung, wie Teil des Events.",
    category: "Sponsoring",
    defaultEnabled: true,
    placements: ["home", "live", "benefits"],
    requiresConfig: true,
    complexity: "einfach",
    businessValue: "Macht Sponsoring messbar — die Grundlage für den Sponsor-Report nach dem Event.",
    status: "ready",
  },
  {
    moduleId: "leadCapture",
    name: "Kontakt-Abfrage",
    description: "Besucher können freiwillig ihre Kontaktdaten für Sponsor-Angebote hinterlassen.",
    visitorSees: "Ein kurzes, freiwilliges Formular nach der Teilnahme — mit klarer Einwilligung.",
    category: "Daten",
    defaultEnabled: false,
    placements: ["live", "benefits"],
    requiresConfig: true,
    complexity: "mittel",
    businessValue: "First-Party-Leads mit Einwilligung — das wertvollste Ergebnis für Sponsoren.",
    status: "roadmap",
  },
  {
    moduleId: "rewardRedemption",
    name: "Reward & Einlösung",
    description: "Rewards claimen und vor Ort einlösen — später Wallet-first.",
    visitorSees: "Einen Reward-Screen zum Vorzeigen an Bar, Stand oder Kasse.",
    category: "Sponsoring",
    defaultEnabled: false,
    placements: ["benefits"],
    requiresConfig: true,
    complexity: "mittel",
    businessValue: "Schließt den Kreis: vom Scan bis zur bewiesenen Einlösung — der härteste ROI-Beweis.",
    status: "roadmap",
  },
  {
    moduleId: "community",
    name: "Community Light",
    description: "Eine moderierte Live-Pinnwand mit Grüßen und Beiträgen der Gäste.",
    visitorSees: "Kurze Beiträge anderer Gäste und ein Eingabefeld für den eigenen Gruß — direkt auf der Startseite.",
    category: "Community",
    defaultEnabled: false,
    placements: ["home"],
    requiresConfig: false,
    complexity: "einfach",
    businessValue: "Macht das Event fühlbar lebendig — braucht einen Moderations-Hinweis.",
    status: "ready",
  },
  {
    moduleId: "customModule",
    name: "Individuelle Funktion",
    description: "Quiz, Glücksrad, Matching, Foto-Voting, Check-in Challenge, Sponsor Code Hunt …",
    visitorSees: "Eine maßgeschneiderte Aktion, die es so nur bei diesem Event gibt.",
    category: "Custom",
    defaultEnabled: false,
    placements: ["home", "live"],
    requiresConfig: true,
    complexity: "individuell",
    businessValue: "Individuelle Funktionen können später über Codex/Fable gebaut und hier registriert werden.",
    status: "custom",
  },
];

export function getModule(moduleId: string): BubbleModuleDefinition | undefined {
  return MODULE_REGISTRY.find((m) => m.moduleId === moduleId);
}

export function defaultModuleState(): Record<string, boolean> {
  return Object.fromEntries(MODULE_REGISTRY.map((m) => [m.moduleId, m.defaultEnabled]));
}

export function moduleState(enabled: string[]): Record<string, boolean> {
  return Object.fromEntries(MODULE_REGISTRY.map((m) => [m.moduleId, enabled.includes(m.moduleId)]));
}
