export type MatchOutcome = "deutschland" | "unentschieden" | "ecuador";
export type MatchParseStatus = "parsed" | "unparsed";

export type ParsedScore = {
  germanyScore: number | null;
  ecuadorScore: number | null;
  parsedOutcome: MatchOutcome | null;
  parseStatus: MatchParseStatus;
};

export const matchOutcomes: MatchOutcome[] = ["deutschland", "unentschieden", "ecuador"];

export function outcomeFromScores(germanyScore: number, ecuadorScore: number): MatchOutcome {
  if (germanyScore > ecuadorScore) return "deutschland";
  if (germanyScore < ecuadorScore) return "ecuador";
  return "unentschieden";
}

export function outcomeLabel(outcome: MatchOutcome | null | undefined) {
  if (outcome === "deutschland") return "Deutschland";
  if (outcome === "ecuador") return "Ecuador";
  if (outcome === "unentschieden") return "Unentschieden";
  return "-";
}

export function normalizeOutcome(value: unknown): MatchOutcome | null {
  return typeof value === "string" && (matchOutcomes as string[]).includes(value) ? (value as MatchOutcome) : null;
}

export function parseExactScoreText(value: unknown): ParsedScore {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    return {
      germanyScore: null,
      ecuadorScore: null,
      parsedOutcome: null,
      parseStatus: "unparsed",
    };
  }

  const match = text.match(/(^|[^\d])(\d{1,2})\s*[:\-]\s*(\d{1,2})(?!\d)/);
  if (!match) {
    return {
      germanyScore: null,
      ecuadorScore: null,
      parsedOutcome: null,
      parseStatus: "unparsed",
    };
  }

  const germanyScore = Number(match[2]);
  const ecuadorScore = Number(match[3]);
  if (!Number.isInteger(germanyScore) || !Number.isInteger(ecuadorScore) || germanyScore < 0 || ecuadorScore < 0) {
    return {
      germanyScore: null,
      ecuadorScore: null,
      parsedOutcome: null,
      parseStatus: "unparsed",
    };
  }

  return {
    germanyScore,
    ecuadorScore,
    parsedOutcome: outcomeFromScores(germanyScore, ecuadorScore),
    parseStatus: "parsed",
  };
}

export function shortVisitorId(value: string | null | undefined) {
  return value ? value.slice(0, 8) : "-";
}

export function anonymousFanName(visitorId: string | null | undefined) {
  const source = (visitorId ?? "").replace(/[^a-fA-F0-9]/g, "");
  const numeric = source ? parseInt(source.slice(-4), 16) : Math.floor(1000 + Math.random() * 9000);
  return `Anonymer Fan #${String((numeric % 9000) + 1000).padStart(4, "0")}`;
}

export function displayPredictionName(displayName: string | null | undefined, visitorId: string | null | undefined) {
  const clean = typeof displayName === "string" ? displayName.trim() : "";
  return clean || anonymousFanName(visitorId);
}
