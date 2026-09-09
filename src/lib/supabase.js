let supabaseClient = null;
let initPromise = null;

export async function initSupabase() {
  if (supabaseClient) return supabaseClient;
  if (initPromise) return initPromise;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  initPromise = (async () => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      supabaseClient = createClient(url, key);
      return supabaseClient;
    } catch {
      initPromise = null;
      return null;
    }
  })();

  return initPromise;
}

export function getSupabase() {
  return supabaseClient;
}

export function isSupabaseConfigured() {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export function isSupabaseReady() {
  return !!supabaseClient;
}
