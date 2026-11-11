// 2.4 Eat this nearby — Google Places through the `places-nearby` Edge Function (the key stays on the server).
import { supabase } from '../lib/supabase';
import { roundCoord } from './location';

export type Money = { units: number; currency: string };
export type NearbyPlace = {
  id: string; name: string; address: string | null; kind: string | null; lat?: number | null; lon?: number | null;
  distance: number | null; walkMin: number | null; openNow: boolean | null; closesAt: string | null;
  rating: number | null; ratings: number; priceLevel: number | null; priceFrom: Money | null; priceTo: Money | null;
  summary: string | null; mapsUri: string | null; photo: string | null; photoAttribution: string | null;
};

export type PlacesQuery = { query: string; lat: number; lon: number; openNow?: boolean; radius?: number; maxPrice?: 1 | 2 | 3 | 4; language?: string };

export class PlacesError extends Error {
  constructor(public code: 'not_deployed' | 'missing_key' | 'failed') { super(code); }
}

/** Set when the exact dish found nothing and the list shows places for similar food (a family id, or "words"). */
export type NearbyResult = { places: NearbyPlace[]; similar: string | null };

export async function searchNearbyPlaces(q: PlacesQuery): Promise<NearbyResult> {
  const { data, error } = await supabase.functions.invoke('places-nearby', { body: { ...q, lat: roundCoord(q.lat, 3), lon: roundCoord(q.lon, 3) } });
  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status;
    let body: { error?: string } | null = null;
    try { body = await (error as { context?: Response }).context?.json(); } catch { body = null; }
    if (status === 404) throw new PlacesError('not_deployed');
    if (body?.error === 'missing_key') throw new PlacesError('missing_key');
    throw new PlacesError('failed');
  }
  const d = data as { places?: NearbyPlace[]; similar?: string } | null;
  return { places: d?.places ?? [], similar: d?.similar ?? null };
}

/** "₩9,000" / "₩8,000–12,000" from Google's price range. */
export function formatPrice(p: NearbyPlace, lang: string) {
  if (!p.priceFrom) return null;
  const f = (m: Money) => new Intl.NumberFormat(lang, { style: 'currency', currency: m.currency, maximumFractionDigits: 0 }).format(m.units);
  return p.priceTo && p.priceTo.units !== p.priceFrom.units ? `${f(p.priceFrom)}–${f(p.priceTo).replace(/^[^\d]+/, '')}` : f(p.priceFrom);
}

export function formatDistance(m: number | null) {
  if (m == null) return null;
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}
