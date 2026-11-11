import { Linking, Platform } from 'react-native';

/** Opens the phone's Maps app searching near the user (Apple Maps on iOS, the default maps app on Android). */
export function openMapsSearch(query: string) {
  const q = encodeURIComponent(query);
  const url = Platform.OS === 'ios' ? `maps://?q=${q}` : `geo:0,0?q=${q}`;
  return Linking.openURL(url).catch(() => Linking.openURL(`https://maps.google.com/?q=${q}`).catch(() => undefined));
}
