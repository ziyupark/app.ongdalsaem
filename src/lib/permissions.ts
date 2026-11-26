import { Alert, Linking } from 'react-native';
import i18n from '../i18n';

/**
 * A permission the user turned off earlier (iOS asks only once): explain why it's needed and offer Settings.
 * `message` = the already-translated reason. Buttons: Cancel · Open Settings.
 */
export function alertOpenSettings(message: string) {
  Alert.alert(message, undefined, [
    { text: i18n.t('common.cancel'), style: 'cancel' },
    { text: i18n.t('share.openSettings'), onPress: () => Linking.openSettings().catch(() => undefined) },
  ]);
}

/**
 * Location can't be asked for right now: turned off for the app earlier (iOS shows its prompt only once) or
 * Location Services off for the phone. Then "Allow location" explains and offers Settings instead of doing nothing.
 */
export async function locationBlocked(): Promise<boolean> {
  try {
    const Location = await import('expo-location');
    if (!(await Location.hasServicesEnabledAsync())) return true;
    const p = await Location.getForegroundPermissionsAsync();
    return p.status === Location.PermissionStatus.DENIED && !p.canAskAgain;
  } catch {
    return false;
  }
}
