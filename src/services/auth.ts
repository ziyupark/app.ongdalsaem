import { clearPush } from '../lib/push';
// Sign in with Apple · Google through Supabase Auth (docs/04-screens/01-sign-in-setup.md 1.2).
// Apple on iOS = native sheet → identity token → signInWithIdToken (nonce-checked).
// Google (and Apple on Android) = Supabase OAuth in an auth session → PKCE code exchange.
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type SignInResult =
  | { status: 'signed-in'; userId: string; suggestedName: string }
  | { status: 'cancelled' };

/** Path registered in app/auth-callback.tsx — add `ongdalsaem://auth-callback` to Supabase Auth › Redirect URLs. */
const redirectTo = Linking.createURL('auth-callback');

function nameFromMetadata(meta: Record<string, unknown> | undefined): string {
  const pick = (k: string) => (typeof meta?.[k] === 'string' ? (meta[k] as string).trim() : '');
  return pick('full_name') || pick('name') || [pick('given_name'), pick('family_name')].filter(Boolean).join(' ');
}

async function signInWithOAuth(provider: 'google' | 'apple'): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
  if (error || !data.url) throw error ?? new Error('No OAuth URL');
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return { status: 'cancelled' };
  const { queryParams } = Linking.parse(result.url);
  const code = typeof queryParams?.code === 'string' ? queryParams.code : undefined;
  if (!code) throw new Error(typeof queryParams?.error_description === 'string' ? queryParams.error_description : 'No auth code');
  const { data: session, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError || !session.user) throw exchangeError ?? new Error('No user');
  return { status: 'signed-in', userId: session.user.id, suggestedName: nameFromMetadata(session.user.user_metadata) };
}

export function signInWithGoogle() {
  return signInWithOAuth('google');
}

export async function signInWithApple(): Promise<SignInResult> {
  if (Platform.OS !== 'ios') return signInWithOAuth('apple');

  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: hashedNonce,
    });
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return { status: 'cancelled' };
    throw e;
  }
  if (!credential.identityToken) throw new Error('No Apple identity token');

  const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken, nonce: rawNonce });
  if (error || !data.user) throw error ?? new Error('No user');

  // Apple sends the name only on the very first authorisation (and only if the user shares it) — keep it.
  const appleName = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ').trim();
  if (appleName) await supabase.auth.updateUser({ data: { full_name: appleName } });
  return { status: 'signed-in', userId: data.user.id, suggestedName: appleName || nameFromMetadata(data.user.user_metadata) };
}

/**
 * DEV ONLY — email/password test account so the onboarding flow can be tested without Sign in with Apple
 * (which needs a paid Apple Developer team, even on the simulator). Not part of the v1 design: the button that
 * calls this is rendered only when `__DEV__`, and the credentials are read only inside the `__DEV__` branch so a
 * release bundle never contains them. Set EXPO_PUBLIC_DEV_TEST_EMAIL / _PASSWORD in .env (local only).
 */
export async function signInWithDevTestAccount(): Promise<SignInResult> {
  if (!__DEV__) throw new Error('Test sign-in is dev only');
  const email = process.env.EXPO_PUBLIC_DEV_TEST_EMAIL;
  const password = process.env.EXPO_PUBLIC_DEV_TEST_PASSWORD;
  if (!email || !password) throw new Error('Set EXPO_PUBLIC_DEV_TEST_EMAIL and EXPO_PUBLIC_DEV_TEST_PASSWORD in .env, then restart Metro.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw error ?? new Error('No user');
  return { status: 'signed-in', userId: data.user.id, suggestedName: nameFromMetadata(data.user.user_metadata) };
}

/** DEV ONLY — clears the display name so the next launch runs 1.3 → 1.4 again for the same account. */
export async function resetOnboardingForDev() {
  if (!__DEV__) return;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from('profiles').update({ display_name: null, username: null, handle_auto_generated: false }).eq('id', data.user.id);
}

export async function signOut() {
  await clearPush();
  await supabase.auth.signOut();
}
