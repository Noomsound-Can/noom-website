// Second lock on /api/admin/*. Cloudflare Access already sits in front of that path
// on www.noomsound.studio, but not in front of other hostnames that reach this
// Worker (workers.dev, preview URLs). So the Worker verifies the Access JWT itself.
// Values from noom-booking/SETUP-VALUES.md, not secret.

const TEAM = "https://sparkling-tree-06b0.cloudflareaccess.com";
const AUD = "7df073d17b68468ffdfadaaef438b7c4a72b5499c1f70076d7baa759aa4f3d9f";
const CERTS_TTL_MS = 60 * 60 * 1000;

let cachedCerts = null; // { keys: Map(kid -> CryptoKey), expiresAt }

// Returns the verified email, or null.
export async function accessEmail(request) {
  const jwt = request.headers.get("cf-access-jwt-assertion");
  if (!jwt) return null;
  try {
    const [h, p, s] = jwt.split(".");
    const header = JSON.parse(b64urlDecodeText(h));
    const claims = JSON.parse(b64urlDecodeText(p));
    const key = await certKey(header.kid);
    if (!key) return null;
    const ok = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      b64urlDecode(s),
      new TextEncoder().encode(`${h}.${p}`),
    );
    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    const now = Date.now() / 1000;
    if (!ok || !aud.includes(AUD) || claims.iss !== TEAM || !(claims.exp > now)) return null;
    return claims.email || null;
  } catch (err) {
    console.log(`access: JWT rejected: ${err.message}`);
    return null;
  }
}

async function certKey(kid) {
  if (!cachedCerts || cachedCerts.expiresAt < Date.now() || !cachedCerts.keys.has(kid)) {
    const res = await fetch(`${TEAM}/cdn-cgi/access/certs`);
    const { keys } = await res.json();
    const map = new Map();
    for (const jwk of keys) {
      map.set(
        jwk.kid,
        await crypto.subtle.importKey(
          "jwk",
          jwk,
          { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
          false,
          ["verify"],
        ),
      );
    }
    cachedCerts = { keys: map, expiresAt: Date.now() + CERTS_TTL_MS };
  }
  return cachedCerts.keys.get(kid) || null;
}

function b64urlDecode(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function b64urlDecodeText(s) {
  return new TextDecoder().decode(b64urlDecode(s));
}
