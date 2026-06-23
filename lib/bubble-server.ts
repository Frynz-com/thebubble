import { normalizeBubbleSlug } from "@/lib/bubble-routing";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { BubbleRow } from "@/lib/supabase/types";

export async function getActiveServerBubble(slug: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const normalizedSlug = normalizeBubbleSlug(slug);
  const { data, error } = await supabase
    .from("bubbles")
    .select("*")
    .eq("slug", normalizedSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[bubble-server] active bubble lookup failed", {
      slug: normalizedSlug,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }

  return (data as BubbleRow | null) ?? null;
}
