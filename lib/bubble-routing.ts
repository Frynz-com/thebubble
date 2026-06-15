export const defaultBubbleSlug = "demo";

export function normalizeBubbleSlug(slug?: string) {
  if (!slug) return defaultBubbleSlug;
  return slug.split("/")[0]?.trim() || defaultBubbleSlug;
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
