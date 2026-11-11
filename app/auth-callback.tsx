import { Redirect } from 'expo-router';

/**
 * OAuth return URL (ongdalsaem://auth-callback). The auth session in services/auth.ts reads the code itself;
 * if the OS also opens this link, just go back through the splash routing.
 */
export default function AuthCallback() {
  return <Redirect href="/" />;
}
