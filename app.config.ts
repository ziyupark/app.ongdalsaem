import type { ConfigContext, ExpoConfig } from 'expo/config';
import { withEntitlementsPlist, type ConfigPlugin } from 'expo/config-plugins';

/**
 * FREE_APPLE_TEAM=1 → a build a free Apple ID (Personal Team) can sign, for trying the app on your own iPhone.
 * Free teams can't use Push Notifications, Sign in with Apple or Time Sensitive Notifications, so this build drops
 * those entitlements, hides the Apple button, and skips push registration. Timer alerts (local notifications) still
 * work, just without breaking through Focus.
 * Without the flag, app.json is used as is, plus the time-sensitive entitlement below.
 */
const FREE_TEAM = process.env.FREE_APPLE_TEAM === '1';

/** Timer alerts use interruptionLevel 'timeSensitive' — iOS only honours it with this entitlement. */
const TIME_SENSITIVE = 'com.apple.developer.usernotifications.time-sensitive';

const withTimeSensitive: ConfigPlugin = (config) =>
  withEntitlementsPlist(config, (c) => {
    c.modResults[TIME_SENSITIVE] = true;
    return c;
  });

const withoutPaidEntitlements: ConfigPlugin = (config) =>
  withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'];
    delete c.modResults['com.apple.developer.applesignin'];
    delete c.modResults[TIME_SENSITIVE];
    return c;
  });

/** 2.4b map-app picker (src/lib/mapApps.ts): iOS only answers canOpenURL for schemes listed here. */
const MAP_SCHEMES = ['nmap', 'kakaomap', 'comgooglemaps'];

export default ({ config }: ConfigContext): ExpoConfig => {
  const app = config as ExpoConfig;
  const queried = (app.ios?.infoPlist?.LSApplicationQueriesSchemes as string[] | undefined) ?? [];
  const base: ExpoConfig = {
    ...app,
    ios: { ...app.ios, infoPlist: { ...app.ios?.infoPlist, LSApplicationQueriesSchemes: [...new Set([...queried, ...MAP_SCHEMES])] } },
  };
  if (!FREE_TEAM) return withTimeSensitive(base);
  const withFlag: ExpoConfig = {
    ...base,
    ios: { ...base.ios, usesAppleSignIn: false },
    extra: { ...base.extra, freeTeam: true },
  };
  return withoutPaidEntitlements(withFlag);
};
