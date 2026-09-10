// /admin/ page. Repo-only, never authored in Claude Design. Plain JS, no build step.
// Spec: noom-booking/BOOKING-SPEC.md section 7. Cloudflare Access sits in front of
// this page and /api/admin/*, and the Worker checks the Access login again.
(() => {
  const $ = (id) => document.getElementById(id);
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];
  const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const SOURCES = ["GetYourGuide", "WhatsApp", "Walk-in", "Other"];
  const TERRACE = "Noom Terrace, Lamai";
  const REFRESH_AFTER_MS = 60 * 1000;

  const state = { data: null, loadedAt: 0, busy: false, showAll: false, openForm: null };
  try {
    state.showAll = localStorage.getItem("noomAdminShowAll") === "1";
  } catch {}
  $("showAll").checked = state.showAll;

  // ---------- small helpers ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const thb = (n) => `${n.toLocaleString("en-US")} THB`;
  const wa = (digits, text) => `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
  const first = (name) => String(name).trim().split(/\s+/)[0];
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const utc = (date) => new Date(`${date}T00:00:00Z`);
  const addDays = (date, n) => new Date(utc(date).getTime() + n * 864e5).toISOString().slice(0, 10);
  const longDate = (date) => {
    const d = utc(date);
    return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  };
  // '2026-09-10T07:02:00Z' -> '10 Sep 14:02' in Koh Samui time
  const stamp = (iso) => {
    const d = new Date(Date.parse(iso) + 7 * 3600e3);
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)} ` +
      `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  };
  const who = (email) => (email === "system" ? "the system" : String(email).split("@")[0]);
  const unitWord = (b) => (b.service_id?.startsWith("handpan") ? "student" : "guest");
  const whenOf = (b) => b.slots.map((s) => s.label).join(" / ");

  const ACTION_WORDS = {
    confirm: "Confirmed", decline: "Declined", cancel: "Cancelled", manual: "Added",
    close: "Closed", reopen: "Reopened", expire: "Expired, no answer in 24 h,",
  };
  const lastLine = (l) =>
    l ? `<p class="nm-last">${esc(ACTION_WORDS[l.action] || l.action)} by ${esc(who(l.email))}, ${esc(stamp(l.at))}</p>` : "";

  // Pre-filled WhatsApp texts. Can or Melie can edit them before sending.
  const MSG = {
    confirm: (b) => `Hi ${first(b.name)}, this is Noom Sound Studio. Your ${b.service} on ${whenOf(b)} is confirmed. Your reference is ${b.ref}. See you then.`,
    decline: (b) => `Hi ${first(b.name)}, this is Noom Sound Studio. Thank you for your request (${b.ref}). We are sorry, we cannot make ${whenOf(b)} work. Would another time suit you?`,
    cancel: (name, ref, when) => `Hi ${first(name)}, this is Noom Sound Studio, about your booking ${ref} on ${when}.`,
    closed: (name, o) => `Hi ${first(name)}, this is Noom Sound Studio. We are sorry, the ${o.name} on ${o.label} is cancelled. Would you like to join on another day instead?`,
  };

  // ---------- API ----------
  class AuthError extends Error {}

  async function api(path, body) {
    const init = { credentials: "same-origin", redirect: "manual", cache: "no-store" };
    if (body) {
      init.method = "POST";
      init.headers = { "content-type": "application/json" };
      init.body = JSON.stringify(body);
    }
    let res;
    try {
      res = await fetch(path, init);
    } catch {
      throw new Error("offline");
    }
    // Access answers an expired login with a redirect to its sign-in page.
    if (res.type === "opaqueredirect" || res.status === 401 || res.status === 403) throw new AuthError();
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`HTTP ${res.status}`);
    }
    if (!res.ok) {
      const err = new Error(data.error || `HTTP ${res.status}`);
      err.data = data;
      throw err;
    }
    return data;
  }

  async function load() {
    $("refresh").disabled = true;
    try {
      state.data = await api("/api/admin/bookings?days=30");
      state.loadedAt = Date.now();
      render();
    } catch (err) {
      if (err instanceof AuthError) return loginNotice();
      if (!state.data) $("days").innerHTML = `<p class="nm-quiet">Could not load the bookings (${esc(err.message)}). Tap Refresh.</p>`;
      else notice({ text: `Could not refresh (${err.message}). Showing the last list.`, warn: true });
    } finally {
      $("refresh").disabled = false;
    }
  }

  // ---------- rendering ----------
  function render() {
    const d = state.data;
    $("me").textContent = `Signed in as ${d.me}`;
    const hide = (s) => !state.showAll && (s === "declined" || s === "cancelled");

    const waiting = d.bookings.filter((b) => b.status === "pending" || b.status === "expired");
    $("waitingSec").hidden = !waiting.length;
    $("waiting").innerHTML = waiting.map((b) => bookingCard(b, null)).join("");

    const byDay = new Map();
    const add = (date, sortKey, html) => {
      if (!byDay.has(date)) byDay.set(date, []);
      byDay.get(date).push({ sortKey, html });
    };
    for (const o of d.sessions) add(o.date, o.time, sessionCard(o, hide));
    for (const b of d.bookings) {
      if (hide(b.status)) continue;
      for (const s of b.slots) if (s.in_range) add(s.date, s.time, bookingCard(b, s));
    }
    const dates = [...byDay.keys()].sort();
    $("hDays").textContent = `Next ${d.days} days`;
    $("days").innerHTML = dates.length
      ? dates.map((date) => {
        const rel = date === d.today ? "Today, " : date === addDays(d.today, 1) ? "Tomorrow, " : "";
        const items = byDay.get(date).sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1));
        return `<section class="nm-day"><h3 class="nm-dayname"><b>${rel}</b>${esc(longDate(date))}</h3>${items.map((i) => i.html).join("")}</section>`;
      }).join("")
      : `<p class="nm-quiet">Nothing booked in the next ${d.days} days.</p>`;

    if (state.openForm) {
      const input = document.querySelector(`form.nm-form[data-occ="${state.openForm}"] input[name="name"]`);
      if (input && document.activeElement?.tagName !== "INPUT") input.focus();
    }
  }

  function bookingCard(b, slot) {
    const parts = b.slots.length;
    const open = b.status === "pending" || b.status === "expired";
    const where = b.service_id === "sound-journey-terrace" ? TERRACE : b.location;
    const time = slot
      ? `${slot.time}&ndash;${slot.end_time}`
      : b.slots.map((s) => esc(s.label)).join("<br>");
    let badge;
    if (b.status === "pending") {
      const h = Math.max(0, Math.round((Date.parse(b.hold_expires_at) - Date.now()) / 3600e3));
      badge = `<span class="nm-badge pending">Pending &middot; ${h} h left</span>`;
    } else if (b.status === "expired") badge = `<span class="nm-badge expired">Hold expired</span>`;
    else badge = `<span class="nm-badge ${esc(b.status)}">${esc(b.status)}</span>`;
    if (b.source === "partner") badge = `<span class="nm-badge partner">Partner</span> ${badge}`;

    const meta = [
      b.price_thb == null ? (b.partner ? `Invoiced to ${esc(b.partner)}` : null) : thb(b.price_thb),
      b.source,
      `<span class="nm-ref">${esc(b.ref)}</span>`,
      b.whatsapp ? `+${esc(b.whatsapp)}` : null,
      b.email ? esc(b.email) : null,
    ].filter(Boolean).join(" &middot; ");

    const actions = [];
    if (b.whatsapp) actions.push(`<a class="nm-btn wa" href="${esc(wa(b.whatsapp))}" target="_blank" rel="noopener">WhatsApp</a>`);
    if (open) {
      actions.push(`<button type="button" class="nm-btn ink" data-act="confirm" data-ref="${esc(b.ref)}">Confirm</button>`);
      actions.push(`<button type="button" class="nm-btn danger" data-act="decline" data-ref="${esc(b.ref)}">Decline</button>`);
    } else if (b.status === "confirmed") {
      actions.push(`<button type="button" class="nm-btn danger small" data-act="cancel" data-ref="${esc(b.ref)}">Cancel booking</button>`);
    }

    return `<article class="nm-item" data-status="${esc(b.status)}" data-source="${esc(b.source)}">
      <div class="nm-row"><span class="nm-time">${time}</span><span>${badge}</span></div>
      <p class="nm-title">${esc(b.service)}${parts > 1 && slot ? `<small>day ${b.slots.indexOf(slot) + 1} of ${parts}</small>` : ""}${parts > 1 && !slot ? `<small>${parts} days</small>` : ""}</p>
      <p class="nm-who">${esc(b.name)} &middot; ${plural(b.party_size, unitWord(b))}</p>
      ${where ? `<p class="nm-line">${esc(where)}</p>` : ""}
      ${b.notes ? `<p class="nm-line nm-note">&ldquo;${esc(b.notes)}&rdquo;</p>` : ""}
      <p class="nm-meta">${meta}</p>
      ${lastLine(b.last_action)}
      ${actions.length ? `<div class="nm-actions">${actions.join("")}</div>` : ""}
    </article>`;
  }

  function sessionCard(o, hide) {
    const closed = o.status === "cancelled";
    const live = o.guests.filter((g) => g.status === "confirmed");
    const shown = o.guests.filter((g) => !hide(g.status));
    const over = Math.max(0, o.taken - o.capacity);

    const cells = [];
    for (let i = 0; i < o.capacity; i++) cells.push(`<i class="${i < o.taken ? "on" : ""}"></i>`);
    if (over) cells.push(`<i class="gap"></i>`, ...Array.from({ length: over }, () => `<i class="over"></i>`));

    const guests = shown.length
      ? shown.map((g) => {
        const off = g.status !== "confirmed";
        const from = g.source === "manual"
          ? (g.notes || "Added by hand")
          : `Website${g.price_thb != null ? `, ${thb(g.price_thb)}` : ""}`;
        const text = closed ? MSG.closed(g.name, o) : null;
        return `<li class="${off ? "off" : ""}">
          <span class="n">${g.party_size}</span>
          <span class="g">${esc(g.name)}<small>${esc(from)} &middot; ${esc(g.ref)}${off ? ` &middot; ${esc(g.status)}` : ""}</small></span>
          ${g.whatsapp ? `<a class="nm-wa-mini" href="${esc(wa(g.whatsapp, text))}" target="_blank" rel="noopener">${closed ? "Tell" : "Chat"}</a>` : ""}
          ${off ? "" : `<button type="button" class="nm-x" data-act="cancel" data-ref="${esc(g.ref)}" aria-label="Cancel ${esc(g.name)}">&times;</button>`}
        </li>`;
      }).join("")
      : `<li><span class="none">No guests yet.</span></li>`;

    const actions = closed
      ? `<button type="button" class="nm-btn" data-act="reopen" data-occ="${esc(o.id)}">Reopen session</button>`
      : `<button type="button" class="nm-btn ink" data-act="add" data-occ="${esc(o.id)}"${state.openForm === o.id ? " hidden" : ""}>Add guest</button>
         <button type="button" class="nm-btn danger small" data-act="close" data-occ="${esc(o.id)}">Close session</button>`;

    return `<article class="nm-item nm-session" data-status="${esc(o.status)}">
      <div class="nm-row"><span class="nm-time">${o.time}&ndash;${o.end_time}</span>
        ${closed ? `<span class="nm-badge closed">Closed</span>` : `<span class="nm-count">${o.taken}/${o.capacity}<small>mats</small></span>`}</div>
      <p class="nm-title">${esc(o.title)}</p>
      ${closed ? `<p class="nm-line nm-note">${live.length ? "Guests below are not told automatically. Tap Tell to message them." : "Not shown on the website."}</p>` : `<div class="nm-mats" aria-hidden="true">${cells.join("")}</div>`}
      ${over && !closed ? `<p class="nm-meta">${over} over the ${o.capacity} mats on the website</p>` : ""}
      <ul class="nm-guests">${guests}</ul>
      ${lastLine(o.last_action)}
      <div class="nm-actions">${actions}</div>
      ${state.openForm === o.id && !closed ? manualForm(o) : ""}
    </article>`;
  }

  function manualForm(o) {
    const room = o.manual_max - o.taken;
    const options = room > 0
      ? Array.from({ length: room }, (_, i) => i + 1).map((n) =>
        `<option value="${n}">${plural(n, "mat")}${o.taken + n > o.capacity ? ` (over ${o.capacity})` : ""}</option>`).join("")
      : `<option value="0">No mats left</option>`;
    return `<form class="nm-form" data-occ="${esc(o.id)}" novalidate>
      <label class="nm-field"><span>Name</span><input name="name" maxlength="80" autocomplete="off" required /></label>
      <label class="nm-field"><span>Mats</span><select name="party_size">${options}</select></label>
      <div class="nm-field"><span>From</span><div class="nm-chips">
        ${SOURCES.map((s, i) => `<label><input type="radio" name="from" value="${s}"${i === 0 ? " checked" : ""} /><span>${s}</span></label>`).join("")}
      </div></div>
      <label class="nm-field"><span>WhatsApp <i>(optional)</i></span><input name="whatsapp" type="tel" inputmode="tel" maxlength="40" placeholder="+66 81 234 5678" autocomplete="off" /></label>
      <em class="nm-err" role="alert"></em>
      <div class="nm-actions">
        <button type="submit" class="nm-btn ink"${room > 0 ? "" : " disabled"}>Add to session</button>
        <button type="button" class="nm-btn" data-act="closeform">Cancel</button>
      </div>
    </form>`;
  }

  // ---------- notice ----------
  function notice({ text, sub, warn, links = [], buttons = [] }) {
    const n = $("notice");
    n.className = `nm-notice${warn ? " warn" : ""}`;
    n.innerHTML =
      `<button type="button" class="nm-x nm-close" data-act="dismiss" aria-label="Close">&times;</button>` +
      `<p>${esc(text)}</p>${sub ? `<p>${esc(sub)}</p>` : ""}` +
      (links.length || buttons.length
        ? `<div class="nm-actions">${links.map((l) =>
          `<a class="nm-btn wa" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}${buttons.join("")}</div>`
        : "");
    n.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const calendarNote = (c) =>
    c === false ? "The calendar could not be updated. Please fix Noom Bookings by hand."
      : c === "off" ? "Calendar skipped (local test)."
        : "Calendar updated.";

  function loginNotice() {
    notice({
      text: "Your login has run out.",
      sub: "Reload the page to sign in again with the email code.",
      warn: true,
      buttons: [`<button type="button" class="nm-btn" data-act="reload">Reload</button>`],
    });
  }

  function errorNotice(err, fallback) {
    if (err instanceof AuthError) return loginNotice();
    const e = err.data?.error;
    const text = {
      slot_taken: "Someone else has this time now. Message the guest about another time, then decline.",
      wrong_status: `This is already ${err.data?.status}. The list is refreshed.`,
      closed: "This session is closed. Reopen it first.",
      full: "Not enough mats left.",
      offline: "No connection. Try again.",
    }[e || err.message] || `${fallback} (${e || err.message})`;
    notice({ text, warn: true });
  }

  // ---------- actions ----------
  function findRef(ref) {
    const b = state.data.bookings.find((x) => x.ref === ref);
    if (b) return { name: b.name, when: whenOf(b), booking: b };
    for (const o of state.data.sessions) {
      const g = o.guests.find((x) => x.ref === ref);
      if (g) return { name: g.name, when: o.label, guest: g, session: o };
    }
    return null;
  }

  async function bookingAction(ref, act, btn) {
    const f = findRef(ref);
    if (!f) return;
    const q = {
      confirm: `Confirm ${ref} for ${f.name}?${f.booking?.email ? " They also get a confirmation email." : ""}`,
      decline: `Decline ${ref} for ${f.name}? The time becomes free again.`,
      cancel: f.session
        ? `Cancel ${f.name} (${plural(f.guest.party_size, "mat")}) on ${f.when}? The mats become free again.`
        : `Cancel ${ref} for ${f.name}? The time becomes free again.`,
    }[act];
    if (!window.confirm(q)) return;
    await run(btn, async () => {
      const r = await api(`/api/admin/booking/${encodeURIComponent(ref)}`, { action: act });
      const phone = f.booking?.whatsapp || f.guest?.whatsapp;
      const text = act === "cancel" ? MSG.cancel(f.name, ref, f.when) : MSG[act](f.booking);
      notice({
        text: `${ACTION_WORDS[act]} ${ref} for ${f.name}.`,
        sub: calendarNote(r.calendar),
        warn: r.calendar === false,
        links: phone ? [{ label: `Tell ${first(f.name)} on WhatsApp`, href: wa(phone, text) }] : [],
      });
    }, "Could not save");
  }

  async function occurrenceAction(id, act, btn) {
    const o = state.data.sessions.find((x) => x.id === id);
    if (!o) return;
    const live = o.guests.filter((g) => g.status === "confirmed");
    const q = act === "close"
      ? `Close the ${o.name} on ${o.label}?` +
        (live.length ? ` ${plural(live.length, "booking")} (${plural(o.taken, "mat")}) stay on the list but nobody is told automatically.` : "")
      : `Reopen the ${o.name} on ${o.label}? The website takes signups again.`;
    if (!window.confirm(q)) return;
    await run(btn, async () => {
      const r = await api(`/api/admin/occurrence/${encodeURIComponent(id)}`, { action: act });
      if (act === "close") {
        const noPhone = live.filter((g) => !g.whatsapp).map((g) => g.name);
        notice({
          text: `Closed ${o.label}.${o.service_id === "terrace-weekly" ? " Remember to block this date on GetYourGuide too." : ""}`,
          sub: [calendarNote(r.calendar), noPhone.length ? `No WhatsApp for: ${noPhone.join(", ")}.` : ""].filter(Boolean).join(" "),
          warn: r.calendar === false,
          links: live.filter((g) => g.whatsapp).map((g) => ({ label: `Tell ${first(g.name)}`, href: wa(g.whatsapp, MSG.closed(g.name, o)) })),
        });
      } else {
        notice({ text: `Reopened ${o.label}.`, sub: calendarNote(r.calendar), warn: r.calendar === false });
      }
    }, "Could not save");
  }

  async function manualSubmit(form) {
    const id = form.dataset.occ;
    const o = state.data.sessions.find((x) => x.id === id);
    const err = form.querySelector(".nm-err");
    const f = form.elements;
    const body = {
      occurrence: id,
      name: f.namedItem("name").value,
      party_size: Number(f.namedItem("party_size").value),
      whatsapp: f.namedItem("whatsapp").value,
      notes: f.namedItem("from").value,
    };
    err.textContent = "";
    if (!body.name.trim()) {
      err.textContent = "Enter a name.";
      f.namedItem("name").focus();
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    await run(btn, async () => {
      try {
        const r = await api("/api/admin/manual", body);
        state.openForm = null;
        notice({
          text: `Added ${body.name.trim()}, ${plural(body.party_size, "mat")}, to ${o.label}. Now ${r.taken}/${r.capacity}.`,
          sub: calendarNote(r.calendar),
          warn: r.calendar === false,
        });
      } catch (e) {
        if (e.data?.fields) {
          err.textContent = Object.values(e.data.fields).join(" ");
          throw Object.assign(new Error("shown"), { shown: true });
        }
        throw e;
      }
    }, "Could not add the guest");
  }

  // Disable the button, do the thing, then reload the list. A field error shown in
  // the add-guest form skips the reload so the typed values stay.
  async function run(btn, fn, fallback) {
    if (state.busy) return;
    state.busy = true;
    if (btn) btn.disabled = true;
    let keepForm = false;
    try {
      await fn();
    } catch (err) {
      keepForm = !!err.shown;
      if (!keepForm) errorNotice(err, fallback);
    }
    state.busy = false;
    if (btn) btn.disabled = false;
    if (!keepForm) await load();
  }

  // ---------- events ----------
  $("main").addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const act = el.dataset.act;
    if (act === "confirm" || act === "decline" || act === "cancel") bookingAction(el.dataset.ref, act, el);
    else if (act === "close" || act === "reopen") occurrenceAction(el.dataset.occ, act, el);
    else if (act === "add") {
      state.openForm = el.dataset.occ;
      render();
    } else if (act === "closeform") {
      state.openForm = null;
      render();
    } else if (act === "dismiss") $("notice").hidden = true;
    else if (act === "reload") location.reload();
  });

  $("main").addEventListener("submit", (e) => {
    const form = e.target.closest("form.nm-form");
    if (!form) return;
    e.preventDefault();
    manualSubmit(form);
  });

  $("refresh").addEventListener("click", load);

  $("showAll").addEventListener("change", (e) => {
    state.showAll = e.target.checked;
    try {
      localStorage.setItem("noomAdminShowAll", state.showAll ? "1" : "0");
    } catch {}
    if (state.data) render();
  });

  // Back on the phone after a while: fetch again, unless a form is being filled in.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !state.openForm && !state.busy &&
        Date.now() - state.loadedAt > REFRESH_AFTER_MS) load();
  });

  load();
})();
