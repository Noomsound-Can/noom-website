// Booking helpers, pure functions. BOOKING-SPEC sections 6 and 11, Addendum A.

import { addDays, dayStartMs, isDate } from "./availability.js";

export const CAN_WHATSAPP = "905468419181";
export const HOLD_MS = 24 * 60 * 60 * 1000;

const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
const MIN_MS = 60 * 1000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Minutes per session, in date order. session_durations '180,180,240' overrides
// duration_min (migration 0002); a missing or short list falls back to duration_min.
export function sessionDurations(service) {
  const list = String(service.session_durations || "").split(",").map(Number).filter((n) => n > 0);
  return Array.from({ length: service.sessions || 1 }, (_, i) => list[i] || service.duration_min);
}

// Party of n: price_thb + max(0, n - price_base_guests) * price_extra_thb. NULL = hidden.
export function priceFor(service, n) {
  if (service.price_thb == null) return null;
  return service.price_thb + Math.max(0, n - (service.price_base_guests || 1)) * (service.price_extra_thb || 0);
}

// 'NM-7K3QD'. Short enough to read out on the phone.
export function makeRef(random = crypto.getRandomValues(new Uint8Array(5))) {
  let s = "";
  for (const b of random) s += REF_ALPHABET[b % REF_ALPHABET.length];
  return `NM-${s}`;
}

export function thb(n) {
  return `${n.toLocaleString("en-US")} THB`;
}

// 'Sat 12 Sep, 10:00' in Bangkok time.
export function slotLabel(ms) {
  const d = new Date(ms + 7 * 60 * MIN_MS);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${hh}:${mm}`;
}

export function whatsappLink(digits, text) {
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Name, WhatsApp, email, party size and notes, shared by bookings and signups.
function validateGuest(body, minGuests, maxGuests, errors) {
  const name = str(body.name, 80);
  if (name.length < 2) errors.name = "Please enter your name.";

  // International format only, so wa.me links work: '+66 81 234 5678' or '0066...'.
  const whatsapp = str(body.whatsapp, 40).replace(/[^\d]/g, "").replace(/^00/, "");
  if (whatsapp.length < 8 || whatsapp.length > 15 || whatsapp.startsWith("0")) {
    errors.whatsapp = "Please enter your WhatsApp number with the country code, for example +66.";
  }

  const email = str(body.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please check the email address.";

  const party = Number(body.party_size);
  if (!Number.isInteger(party) || party < minGuests || party > maxGuests) {
    errors.party_size = minGuests === maxGuests ? `Only ${maxGuests} left.` : `Choose between ${minGuests} and ${maxGuests}.`;
  }
  return { name, whatsapp, email: email || null, party_size: party, notes: str(body.notes, 1000) || null };
}

// POST /api/signup body, for a weekly session with `spotsLeft` mats free.
export function validateSignup(body, service, spotsLeft) {
  const errors = {};
  const max = Math.max(1, Math.min(service.max_guests, spotsLeft));
  const guest = validateGuest(body, service.min_guests, max, errors);
  if (Object.keys(errors).length) return { errors };
  return { data: guest };
}

// POST /api/admin/manual body: a GetYourGuide, WhatsApp or walk-in guest added by Can
// or Melie. WhatsApp is optional (GetYourGuide often gives none); `maxMats` is how many
// mats the admin may still hand out, which can go past the public capacity.
export function validateManual(body, maxMats) {
  const errors = {};
  const name = str(body.name, 80);
  if (!name) errors.name = "Enter a name.";

  let whatsapp = str(body.whatsapp, 40).replace(/[^\d]/g, "").replace(/^00/, "");
  if (whatsapp && (whatsapp.length < 8 || whatsapp.length > 15 || whatsapp.startsWith("0"))) {
    errors.whatsapp = "Use the country code, for example +66, or leave it empty.";
  }

  const party = Number(body.party_size);
  if (maxMats < 1) errors.party_size = "No mats left, even over capacity.";
  else if (!Number.isInteger(party) || party < 1 || party > maxMats) {
    errors.party_size = `Choose between 1 and ${maxMats}.`;
  }

  if (Object.keys(errors).length) return { errors };
  return { data: { name, whatsapp: whatsapp || null, party_size: party, notes: str(body.notes, 300) || null } };
}

// Validates a POST /api/book body against its service. Returns { errors } or { data }.
// Checks shape only: whether the slots are actually free is checked by the caller.
export function validateBooking(body, service) {
  const errors = {};
  const { name, whatsapp, email, party_size: party, notes } =
    validateGuest(body, service.min_guests, service.max_guests, errors);

  const location = str(body.location, 160);
  if (service.id === "sound-journey-villa" && location.length < 2) {
    errors.location = "Please tell us the villa, hotel or area.";
  }

  const slots = Array.isArray(body.slots) ? body.slots : [];
  const clean = [];
  for (const s of slots) {
    if (!s || !isDate(s.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time || "")) {
      errors.slots = "Please choose a time.";
      break;
    }
    const [h, m] = s.time.split(":").map(Number);
    clean.push({ date: s.date, time: s.time, startMs: dayStartMs(s.date) + (h * 60 + m) * MIN_MS });
  }
  clean.sort((a, b) => a.startMs - b.startMs);
  const durations = sessionDurations(service);
  clean.forEach((s, i) => {
    s.durationMin = durations[i] || service.duration_min;
    s.endMs = s.startMs + s.durationMin * MIN_MS;
  });
  if (!errors.slots) {
    const dates = new Set(clean.map((s) => s.date));
    if (clean.length !== service.sessions) {
      errors.slots = service.sessions > 1
        ? `Please choose ${service.sessions} sessions.`
        : "Please choose a time.";
    } else if (dates.size !== clean.length) {
      errors.slots = "Please choose each session on a different day.";
    } else if (service.session_window_days && clean.length > 1) {
      // All sessions inside one window of N days, counted from the first.
      const lastAllowed = addDays(clean[0].date, service.session_window_days - 1);
      if (clean.at(-1).date > lastAllowed) {
        errors.slots = `Please choose all ${clean.length} days within ${service.session_window_days} days.`;
      }
    }
  }

  if (Object.keys(errors).length) return { errors };
  return {
    data: { name, whatsapp, email, party_size: party, location: location || null, notes, slots: clean },
  };
}
