const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/** Standard geohash. 5 chars ≈ 5 km cell — what the questions RPCs expect (docs 3.7: never the exact point). */
export function geohash(lat: number, lon: number, precision = 5) {
  let latR = [-90, 90];
  let lonR = [-180, 180];
  let out = '';
  let bit = 0;
  let ch = 0;
  let even = true;
  while (out.length < precision) {
    const r = even ? lonR : latR;
    const v = even ? lon : lat;
    const mid = (r[0] + r[1]) / 2;
    if (v >= mid) { ch = (ch << 1) | 1; r[0] = mid; } else { ch <<= 1; r[1] = mid; }
    even = !even;
    if (++bit === 5) { out += BASE32[ch]; bit = 0; ch = 0; }
  }
  return out;
}

/** The cell of (lat, lon) and its 8 neighbours — "within about 1 km" at precision 6. */
export function cellsAround(lat: number, lon: number, precision = 6) {
  // Cell size: precision 6 = 5×6 bits → lat 180/2^15, lon 360/2^15.
  const latBits = Math.floor((precision * 5) / 2);
  const lonBits = Math.ceil((precision * 5) / 2);
  const dLat = 180 / 2 ** latBits;
  const dLon = 360 / 2 ** lonBits;
  const out = new Set<string>();
  for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) out.add(geohash(Math.max(-90, Math.min(90, lat + a * dLat)), ((lon + b * dLon + 540) % 360) - 180, precision));
  return [...out];
}
