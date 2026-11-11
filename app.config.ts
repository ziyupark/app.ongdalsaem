import type { ConfigContext, ExpoConfig } from 'expo/config';
import { withEntitlementsPlist, type ConfigPlugin } from 'expo/config-plugins';

/**
 * FREE_APPLE_TEAM=1 → a build a free Apple ID (Personal Team) can sign, for trying the app on your own iPhone.
 * Free teams can't use Push Notifications or Sign in with Apple, so this build drops both entitlements,
 * hides the Apple button, and skips push registration. Timer alerts (local notifications) still work.
 * Without the flag, app.json is used as is.
 */
const FREE_TEAM = process.env.FREE_APPLE_TEAM === '1';

const withoutPaidEntitlements: ConfigPlugin = (config) =>
  withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'];
    delete c.modResults['com.apple.developer.applesignin'];
    return c;
  });

export default ({ config }: ConfigContext): ExpoConfig => {
  const base = config as ExpoConfig;
  if (!FREE_TEAM) return base;
  const withFlag: ExpoConfig = {
    ...base,
    ios: { ...base.ios, usesAppleSignIn: false },
    extra: { ...base.extra, freeTeam: true },
  };
  return withoutPaidEntitlements(withFlag);
};
