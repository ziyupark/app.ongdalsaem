// Device location for weather — city level only (moved from _reference/services/location.ts).
import * as Location from 'expo-location';
import i18n from '../i18n';

export type Coordinates = { latitude: number; longitude: number };

/**
 * Privacy: coordinates leave the device only rounded. 2 decimals ≈ 1.1 km (weather, ward name — BigDataCloud,
 * OpenWeather); 3 decimals ≈ 110 m (nearby places, where walking distance needs it). Exact GPS is never sent or stored.
 */
export const roundCoord = (v: number, decimals: 2 | 3 = 2) => {
  const k = 10 ** decimals;
  return Math.round(v * k) / k;
};
export type Place = { city: string; country?: string; countryCode?: string; district?: string };

export async function hasLocationPermission() {
  try {
    return (await Location.getForegroundPermissionsAsync()).status === Location.PermissionStatus.GRANTED;
  } catch {
    return false;
  }
}

/** Asks for permission (system prompt) and returns coarse coordinates, or null when denied / unavailable. */
export async function requestDeviceLocation(): Promise<Coordinates | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) return null;
    if (!(await Location.hasServicesEnabledAsync())) return null;
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return null;
  }
}

/**
 * Ward-level names (one step under the city): 구/군 · 区/區 · -ku · District/Borough/Ward · Bezirk · Arrondissement ·
 * Distrito/Delegación/Alcaldía · Quận/Huyện · เขต/อำเภอ · Kecamatan/Kec. · Distretto/Municipio.
 */
const WARD = /((구|군|区|區)$|-gu$|-gun$|-ku$|\bdistrict\b|\bborough\b|\bward\b|bezirk|arrondissement|^distrito\b|delegaci[oó]n|alcald[ií]a|municipio|^qu[aậ]n\b|^huy[eệ]n\b|^เขต|^อำเภอ|^kecamatan\b|^kec\.|distretto)/i;

/**
 * Coordinates → city + ward ("Jung-gu, Seoul"), in the app language. Coordinates are never stored or sent to our server.
 * 1) BigDataCloud client reverse geocoding (free, no key; allowed only for the device's current location, called from
 *    the app) — it lists every administrative level, so the ward is found in any country.
 * 2) Fallback: the OS geocoder (Apple/Google), which often leaves the ward out (Korea: dong only).
 */
export async function reverseGeocodeCity(coordinates: Coordinates): Promise<Place | null> {
  return (await adminLevels(coordinates)) ?? (await osGeocode(coordinates));
}

type Admin = { name: string; adminLevel?: number; order?: number };
const BDC = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
/** OSM admin levels: 2 country · 4 state/특별시 · 5–6 city/county/구 · 7–8 ward/구/区 · 9–10 dong/neighbourhood. */
async function adminLevels({ latitude, longitude }: Coordinates): Promise<Place | null> {
  const lang = i18n.language.split('-')[0];
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 4000);
  try {
    const res = await fetch(`${BDC}?latitude=${roundCoord(latitude)}&longitude=${roundCoord(longitude)}&localityLanguage=${lang}`, { signal: ctl.signal });
    if (!res.ok) return null;
    const j = (await res.json()) as { city?: string; principalSubdivision?: string; countryName?: string; countryCode?: string; localityInfo?: { administrative?: Admin[] } };
    const admin = (j.localityInfo?.administrative ?? []).filter((a) => a.name && a.adminLevel != null).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    let city = j.city || j.principalSubdivision || '';
    if (!city) return null;
    const at = admin.findIndex((a) => a.name === city);
    const cityLevel = at >= 0 ? admin[at].adminLevel! : 6;
    // The ward = the next level under the city that is still above neighbourhoods (≤ 8).
    let ward = admin.slice(at + 1).find((a) => a.adminLevel! > cityLevel && a.adminLevel! <= 8 && a.name !== city)?.name;
    // Tokyo-style: the "city" is itself a ward (渋谷区, level 7) → show it under the prefecture / metropolis.
    if (!ward && cityLevel >= 7) {
      const parent = [...admin.slice(0, Math.max(0, at))].reverse().find((a) => a.adminLevel! >= 4 && a.adminLevel! <= 6);
      if (parent) { ward = city; city = parent.name; }
    }
    return { city, country: j.countryName || undefined, countryCode: j.countryCode || undefined, district: ward };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function osGeocode(coordinates: Coordinates): Promise<Place | null> {
  try {
    const [place] = await Location.reverseGeocodeAsync(coordinates);
    let city = place?.city ?? place?.subregion ?? place?.region;
    if (!city) return null;
    // The area shown everywhere is the ward level under the city (Figma 3.1 "Mapo-gu"), never the neighbourhood.
    // iOS spreads it across fields by country, so take whichever field names a ward.
    let ward = [place?.district, place?.subregion, place?.city, place?.name].find((v) => !!v && WARD.test(v.trim()))?.trim();
    // Japan / China: the ward can be the locality (渋谷区) with the real city one level up (東京都).
    if (ward && ward === city && place?.region && place.region !== city) city = place.region;
    if (ward === city) ward = undefined;
    return { city, country: place?.country ?? undefined, countryCode: place?.isoCountryCode ?? undefined, district: ward };
  } catch {
    return null;
  }
}
