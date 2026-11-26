import Constants from 'expo-constants';

/**
 * TEMPORARY — Supabase diagnostics on/off (see ./supabaseDiagnostics).
 * On when either source says so:
 *  - `extra.supabaseDiag` — set by app.config.ts when the EAS build profile is `diagnostic` (doesn't depend on
 *    EXPO_PUBLIC_* inlining);
 *  - EXPO_PUBLIC_SUPABASE_DIAG=1 inlined into the bundle (the diagnostic profile's env in eas.json).
 * app.config.ts refuses to build the `production` profile with the flag, so store builds always have it off.
 */
export const SUPABASE_DIAG_SOURCES = {
  extra: Constants.expoConfig?.extra?.supabaseDiag === true,
  env: process.env.EXPO_PUBLIC_SUPABASE_DIAG === '1',
};

export const SUPABASE_DIAG = SUPABASE_DIAG_SOURCES.extra || SUPABASE_DIAG_SOURCES.env;
