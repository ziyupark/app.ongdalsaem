import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { deletePushToken, upsertPushToken } from "@/services/pushTokens";

/**
 * docs/04-screens/09-settings.md (9.4 Notifications) — registers this device for push and
 * stores the Expo push token, called from Settings → Notifications when the
 * toggle turns on. Actually *sending* the daily recommendation is a
 * separate, server-side piece (supabase/functions/send-daily-recommendation)
 * that this client-side half feeds; this function only gets the device
 * ready to receive one.
 *
 * Needs an EAS project id (`app.json`'s `extra.eas.projectId`, set by
 * `eas init`) to call getExpoPushTokenAsync — this repo doesn't have one
 * configured yet, so registration no-ops with a console warning until that
 * exists, the same pattern weather.ts uses for its own missing API key.
 */
export async function registerForPushNotifications(userId: string): Promise<boolean> {
  if (!Device.isDevice) {
    // Push tokens aren't meaningful on a simulator/emulator.
    return false;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) {
    console.warn(
      "[pushNotifications] No EAS project id configured (app.json's extra.eas.projectId). Run `eas init` first — push notifications can't register a token until then."
    );
    return false;
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await upsertPushToken(userId, token);
  return true;
}

/** Called when the user turns notifications off — clears the stored token so the daily send has nothing stale to reach. */
export async function unregisterPushNotifications(userId: string): Promise<void> {
  await deletePushToken(userId);
}
