// Sign in with Apple server calls: exchange the app's authorization code for a refresh token, and revoke it.
// Needs these secrets (supabase secrets set …): APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (the .p8 file's text,
// a key with "Sign in with Apple" enabled). APPLE_CLIENT_ID is optional (default: the bundle id app.ongdalsaem).
const TEAM = Deno.env.get("APPLE_TEAM_ID");
const KEY_ID = Deno.env.get("APPLE_KEY_ID");
const PRIVATE_KEY = Deno.env.get("APPLE_PRIVATE_KEY");
const CLIENT_ID = Deno.env.get("APPLE_CLIENT_ID") ?? "app.ongdalsaem";

export const appleConfigured = () => !!(TEAM && KEY_ID && PRIVATE_KEY);

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const encode = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)));

/** ES256 client secret (valid 5 minutes), as Apple's token / revoke endpoints expect. */
async function clientSecret() {
  const pem = PRIVATE_KEY!.replace(/\\n/g, "\n").replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${encode({ alg: "ES256", kid: KEY_ID })}.${encode({ iss: TEAM, iat: now, exp: now + 300, aud: "https://appleid.apple.com", sub: CLIENT_ID })}`;
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(unsigned)));
  return `${unsigned}.${b64url(sig)}`;
}

async function post(path: string, fields: Record<string, string>) {
  return fetch(`https://appleid.apple.com${path}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: await clientSecret(), ...fields }),
  });
}

/** Authorization code (valid 5 minutes, single use) → refresh token, or null. */
export async function exchangeCode(code: string): Promise<string | null> {
  const r = await post("/auth/token", { code, grant_type: "authorization_code" });
  if (!r.ok) {
    console.error("[apple] token", r.status);
    return null;
  }
  const j = (await r.json()) as { refresh_token?: string };
  return j.refresh_token ?? null;
}

export async function revoke(refreshToken: string): Promise<boolean> {
  const r = await post("/auth/revoke", { token: refreshToken, token_type_hint: "refresh_token" });
  if (!r.ok) console.error("[apple] revoke", r.status);
  return r.ok;
}
