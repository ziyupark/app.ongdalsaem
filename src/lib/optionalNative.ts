// Native modules added after the last dev build would crash the whole screen at import time
// ("Cannot find native module …"). Load them lazily, only when the feature is used, and
// return null when the current build doesn't include them yet — the caller shows a message instead.
/* eslint-disable @typescript-eslint/no-require-imports */

export function loadClipboard(): typeof import('expo-clipboard') | null {
  try { return require('expo-clipboard'); } catch { return null; }
}
export function loadSharing(): typeof import('expo-sharing') | null {
  try { return require('expo-sharing'); } catch { return null; }
}
export function loadViewShot(): typeof import('react-native-view-shot') | null {
  try { return require('react-native-view-shot'); } catch { return null; }
}
export function loadMaps(): typeof import('react-native-maps') | null {
  try { return require('react-native-maps'); } catch { return null; }
}

/** 8.1a Edit photo — draws with Skia (native, added after earlier dev builds). */
export function loadPhotoEditor(): typeof import('../components/share/PhotoEditor') | null {
  try {
    require('@shopify/react-native-skia');
    return require('../components/share/PhotoEditor');
  } catch {
    return null;
  }
}
