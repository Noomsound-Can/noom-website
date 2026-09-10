// Google Calendar client, service account auth (BOOKING-SPEC section 10).
// Never OAuth: a Testing-mode OAuth refresh token dies after 7 days.
//
// Secrets: GCAL_SA_EMAIL, GCAL_SA_PRIVATE_KEY, GCAL_BOOKINGS_ID, GCAL_CAN_ID,
// GCAL_MELIE_ID (optional until Melie shares her calendar).

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/calendar/v3";
const SCOPE = "https://www.googleapis.com/auth/calendar";
const TOKEN_TTL_MS = 50 * 60 * 1000;

// Per-isolate cache. An isolate that is recycled simply fetches a fresh token.
let cachedToken = null; // { value, expiresAt }
let cachedKey = null; // { pem, key }

// Calendars read for busy times. Melie's is skipped until her ID is set.
export function busyCalendars(env) {
  const list = [
    { label: "can", id: env.GCAL_CAN_ID },
    { label: "melie", id: env.GCAL_MELIE_ID },
    { label: "bookings", id: env.GCAL_BOOKINGS_ID },
  ];
  for (const c of list) {
    if (!c.id) console.log(`gcal: ${c.label} calendar ID not set, skipped`);
  }
  return list.filter((c) => c.id);
}

// Returns { [calendarId]: { busy: [{start, end}], error } }. A calendar that is
// missing or not shared comes back with an error and no busy blocks, it never
// fails the whole call.
export async function freeBusy(env, calendarIds, fromIso, toIso) {
  const res = await gcalFetch(env, "/freeBusy", {
    method: "POST",
    body: JSON.stringify({
      timeMin: fromIso,
      timeMax: toIso,
      timeZone: "UTC",
      items: calendarIds.map((id) => ({ id })),
    }),
  });
  const data = await res.json();
  const out = {};
  for (const id of calendarIds) {
    const cal = data.calendars?.[id];
    const error = cal?.errors?.map((e) => e.reason).join(",") || (cal ? null : "missing");
    if (error) console.log(`gcal: freeBusy error for ${id}: ${error}`);
    out[id] = { busy: cal?.busy ?? [], error };
  }
  return out;
}

export async function createEvent(env, calendarId, event) {
  const res = await gcalFetch(env, `/calendars/${enc(calendarId)}/events?sendUpdates=none`, {
    method: "POST",
    body: JSON.stringify(event),
  });
  return res.json();
}

export async function patchEvent(env, calendarId, eventId, patch) {
  const res = await gcalFetch(
    env,
    `/calendars/${enc(calendarId)}/events/${enc(eventId)}?sendUpdates=none`,
    { method: "PATCH", body: JSON.stringify(patch) },
  );
  return res.json();
}

// An event that is already gone counts as deleted.
export async function deleteEvent(env, calendarId, eventId) {
  await gcalFetch(
    env,
    `/calendars/${enc(calendarId)}/events/${enc(eventId)}?sendUpdates=none`,
    { method: "DELETE" },
    [404, 410],
  );
}

async function gcalFetch(env, path, init, okStatuses = []) {
  const token = await accessToken(env);
  const res = await fetch(API + path, {
    ...init,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
  });
  if (!res.ok && !okStatuses.includes(res.status)) {
    const body = await res.text();
    throw new Error(`gcal ${init.method} ${path.split("?")[0]} ${res.status}: ${body.slice(0, 300)}`);
  }
  return res;
}

async function accessToken(env) {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const now = Math.floor(Date.now() / 1000);
  const header = b64urlJson({ alg: "RS256", typ: "JWT" });
  const claims = b64urlJson({
    iss: env.GCAL_SA_EMAIL,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  });
  const unsigned = `${header}.${claims}`;
  const key = await signingKey(env.GCAL_SA_PRIVATE_KEY);
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const assertion = `${unsigned}.${b64url(new Uint8Array(sig))}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`gcal token ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const { access_token } = await res.json();
  cachedToken = { value: access_token, expiresAt: Date.now() + TOKEN_TTL_MS };
  return access_token;
}

// The secret is the private_key value pasted from the JSON key file, so it holds
// literal "\n" sequences. Also tolerates stray quotes or the whole JSON file.
async function signingKey(secret) {
  if (cachedKey && cachedKey.pem === secret) return cachedKey.key;
  let pem = (secret || "").trim();
  if (pem.startsWith("{")) pem = JSON.parse(pem).private_key;
  pem = pem.replace(/^"|"$/g, "").replace(/\\n/g, "\n");
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  cachedKey = { pem: secret, key };
  return key;
}

function enc(s) {
  return encodeURIComponent(s);
}

function b64urlJson(obj) {
  return b64url(new TextEncoder().encode(JSON.stringify(obj)));
}

function b64url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
