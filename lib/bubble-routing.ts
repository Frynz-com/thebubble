export const defaultBubbleSlug = "demo";

const reservedBubbleSlugValues = new Set([
  "admin",
  "api",
  "demo",
  "favicon.ico",
  "faviconico",
  "robots.txt",
  "robotstxt",
  "sitemap.xml",
  "sitemapxml",
  "_next",
  "next",
]);

export function normalizeBubbleSlug(slug?: string) {
  if (!slug) return defaultBubbleSlug;
  const normalized = slug
    .split("/")[0]
    ?.trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || defaultBubbleSlug;
}

export function isReservedBubbleSlug(slug?: string) {
  if (!slug?.trim()) return false;
  const raw = slug.trim().toLowerCase();
  const normalized = normalizeBubbleSlug(slug);
  return reservedBubbleSlugValues.has(raw) || reservedBubbleSlugValues.has(normalized);
}

export function getCurrentBubbleSlug() {
  if (typeof window === "undefined") return defaultBubbleSlug;
  return getBubbleSlugFromPathname(window.location.pathname);
}

export function getBubbleSlugFromPathname(pathname: string) {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return normalizeBubbleSlug(firstSegment);
}

export function bubblePath(slug: string, path = "") {
  const normalizedSlug = normalizeBubbleSlug(slug);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `/${normalizedSlug}${normalizedPath === "/" ? "" : normalizedPath}`;
}
