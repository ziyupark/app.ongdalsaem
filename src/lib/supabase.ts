import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import { secureAuthStorage } from "./secureAuthStorage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
// trim(): a key pasted into EAS with a trailing newline made iOS drop the apikey header → 401 "No API key found".
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set. " +
      "Copy .env.example to .env and fill in your Supabase project's values — " +
      "queries against `supabase` will fail until then."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      // Keychain / Keystore, not plain AsyncStorage (moved over once on update — see secureAuthStorage).
      storage: secureAuthStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      // OAuth (Google) returns a ?code= to ongdalsaem:// that we exchange in services/auth.ts.
      flowType: "pkce",
    },
  }
);

// Supabase's official React Native guidance: pause/resume token auto-refresh
// based on foreground state, so it doesn't run while the app is backgrounded.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

/**
 * My user id from the stored session (no network) — `auth.getUser()` asks the auth server every time.
 * Only for "who am I" in queries; row access is still checked by RLS on the server.
 */
export async function myUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/**
 * My own profiles row (only these columns). Others can read just the public card columns of `profiles`
 * (supabase/migrations/20261120000000_security_hardening.sql), so the owner's settings come through my_profile().
 * Falls back to the table while that migration isn't applied yet (PGRST202 = no such function).
 */
export async function fetchMyProfileRow(columns: string): Promise<Record<string, any> | null> {
  const uid = await myUserId();
  if (!uid) return null;
  const viaRpc = await supabase.rpc('my_profile').select(columns).maybeSingle();
  if (!viaRpc.error) return (viaRpc.data as Record<string, any> | null) ?? null;
  if (viaRpc.error.code !== 'PGRST202') throw viaRpc.error;
  const { data, error } = await supabase.from('profiles').select(columns).eq('id', uid).maybeSingle();
  if (error) throw error;
  return (data as Record<string, any> | null) ?? null;
}
