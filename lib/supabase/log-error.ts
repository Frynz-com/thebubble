type SupabaseLikeError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function logSupabaseError(context: string, error: unknown) {
  const supabaseError = error as SupabaseLikeError;

  console.error(`[Supabase:${context}]`, {
    message: supabaseError?.message ?? String(error),
    code: supabaseError?.code ?? null,
    details: supabaseError?.details ?? null,
    hint: supabaseError?.hint ?? null,
  });
}
