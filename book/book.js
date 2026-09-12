// /book/ page. Repo-only, never authored in Claude Design. Plain JS, no build step.
// Spec: noom-booking/BOOKING-SPEC.md sections 6.1, 6.2 and 9. The server re-checks
// everything; this file only helps the guest choose.
(() => {
  const $ = (id) => document.getElementById(id);
  const WA = "905468419181";
  const MONTHS_AHEAD = 4; // current month plus four
  const WEEKS_AHEAD = 22; // weekly sessions to fetch, covers MONTHS_AHEAD from any day
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];
  const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Card copy lives here, prices come from the database.
  const CARDS = {
    "terrace-weekly": {
      title: "Sound Journey, Noom Terrace",
      blurb: "Our weekly open session. Handpan, gong, crystal and Tibetan bowls, played live by two of us. Eight mats.",
      meta: "Wednesday and Sunday · 17:30 · 75 min",
      when: "Choose a Wednesday or Sunday",
      short: "Sound Journey",
    },
    "mulajoy-monthly": {
      title: "Sound Therapy at Mulajoy",
      blurb: "A shorter session, held once a month at Mulajoy in Lamai.",
      meta: "First Thursday of the month · 17:00 · 60 min",
      when: "Choose a first Thursday",
      short: "Sound Therapy at Mulajoy",
    },
    "sound-journey-terrace": {
      title: "Private Sound Journey at Noom Terrace",
      blurb: "Our covered terrace in Lamai, for your group alone. Mats and tea included.",
      meta: "75 min · 2 to 8 guests",
    },
    "sound-journey-villa": {
      title: "Private Sound Journey at your villa",
      blurb: "We bring the instruments and mats to your villa, hotel or retreat, anywhere on Koh Samui.",
      meta: "75 min · 2 to 10 guests",
    },
    "handpan-demo": {
      title: "Handpan Demo Lesson",
      blurb: "Meet the instrument and play your first notes. No experience needed.",
      meta: "1 to 3 students",
    },
    "handpan-journey": {
      title: "3-Day Handpan Journey",
      blurb: "Our signature course. Three sessions on three days within one week, a handpan to practise on during your stay, and a certificate.",
      meta: "1 person · three days",
    },
  };

  const state = {
    services: [],
    svc: null,
    month: null, // 'YYYY-MM'
    avail: {}, // session number -> date -> ['HH:MM'] (sessions can differ in length)
    loaded: new Set(), // 'session|YYYY-MM' fetched for the current service
    loading: false,
    failed: false,
    date: null,
    picks: [], // [{date, time}], chosen in date order: pick n is session n
    occ: {}, // weekly service only: date -> [occurrences from /api/occurrences], by time
    partner: null, // { slug, name, service } on a partner link (?partner=<slug>, step 8)
  };
  const PARTNER_SLUG = new URLSearchParams(location.search).get("partner");

  // ---------- dates, all in Koh Samui time ----------
  const pad = (n) => String(n).padStart(2, "0");
  const today = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  const utc = (date) => new Date(`${date}T00:00:00Z`);
  const addDays = (date, n) => new Date(utc(date).getTime() + n * 864e5).toISOString().slice(0, 10);
  const daySpan = (a, b) => Math.round((utc(b) - utc(a)) / 864e5);
  const monthOf = (date) => date.slice(0, 7);
  const addMonths = (month, n) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
  };
  const daysIn = (month) => {
    const [y, m] = month.split("-").map(Number);
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
  };
  const longDate = (date) => {
    const d = utc(date);
    return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  };
  const shortDate = (date) => {
    const d = utc(date);
    return `${WEEKDAYS[d.getUTCDay()].slice(0, 3)} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`;
  };

  const thb = (n) => `${n.toLocaleString("en-US")} THB`;
  const priceFor = (s, n) =>
    s.price_thb == null ? null : s.price_thb + Math.max(0, n - (s.price_base_guests || 1)) * (s.price_extra_thb || 0);
  const multi = () => state.svc && state.svc.sessions > 1;
  const weekly = () => state.svc?.kind === "group";
  const unit = (n) => {
    const word = weekly() ? "mat" : state.svc.id.startsWith("handpan") ? "student" : "guest";
    return `${n} ${word}${n === 1 ? "" : "s"}`;
  };
  const complete = () => state.svc && state.picks.length === state.svc.sessions;
  // The session a day belongs to: its own if already picked, else the next one. Clamped
  // to the last session, the same way loadMonth() picks the one to fetch: a service with
  // one session has only avail[1], so without the clamp every other day looked timeless
  // (and so unclickable) the moment a time was picked.
  const sessionFor = (date) => {
    const i = state.picks.findIndex((p) => p.date === date);
    return i >= 0 ? i + 1 : Math.min(state.picks.length + 1, state.svc?.sessions || 1);
  };
  const timesFor = (date) => (state.avail[sessionFor(date)] || {})[date] || [];
  // Weekly sessions on a day (a full Sunday can add an extra 16:00 before the 17:30).
  const occsOn = (date) => (weekly() && state.occ[date]) || [];
  const occAt = (date, time) => occsOn(date).find((o) => o.time === time);
  const pickedOcc = () => occAt(state.picks[0].date, state.picks[0].time);
  // The extra 16:00 runs once min_to_run mats are booked; until then guests join a list.
  const waitingFor = (o) => !!o && !!o.min_to_run && o.taken < o.min_to_run;

  // The name shown for what is being booked: the card title, or on a partner link the
  // session name the partner typed.
  const svcTitle = () =>
    state.partner
      ? $("stepDetails").elements.namedItem("service_label").value.trim() || "Partner session"
      : CARDS[state.svc.id].title;

  // ---------- services ----------
  async function loadServices() {
    if (PARTNER_SLUG) return loadPartner();
    try {
      const res = await fetch("/api/services");
      if (!res.ok) throw new Error(res.status);
      state.services = (await res.json()).filter((s) => (s.kind === "private" || s.kind === "group") && CARDS[s.id]);
    } catch {
      $("cards").innerHTML =
        `<p class="bk-quiet">Booking cannot load right now. Please <a href="https://wa.me/${WA}" target="_blank" rel="noopener">message us on WhatsApp</a>.</p>`;
      return;
    }
    renderCards();
    noteCards();
    const wanted = new URLSearchParams(location.search).get("service");
    if (wanted && state.services.some((s) => s.id === wanted)) chooseService(wanted, false);
  }

  // ---------- extra sessions (the Sunday 16:00 when 17:30 is full) ----------
  // One /api/occurrences request shared by the card note and the calendar. Dropped
  // after a failure, and by reloadAvailability when times have to be read again.
  let occFetch = null;
  function fetchOccurrences() {
    if (!occFetch) {
      occFetch = fetch(`/api/occurrences?weeks=${WEEKS_AHEAD}`).then((res) => {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      });
      occFetch.catch(() => { occFetch = null; });
    }
    return occFetch;
  }

  // Bookable extra sessions whose main session that day is full: [{ o, main }].
  function fullDayExtras(list, serviceId) {
    return list
      .filter((o) => o.extra && o.bookable && o.service_id === serviceId)
      .map((o) => ({ o, main: list.find((m) => !m.extra && m.date === o.date && m.service_id === serviceId) }))
      .filter(({ main }) => main && main.status === "open" && main.spots_left === 0);
  }

  const dayWord = (date) => {
    const n = daySpan(today(), date);
    return n === 0 ? "Today" : n < 7 ? `This ${WEEKDAYS[utc(date).getUTCDay()]}` : longDate(date);
  };

  // A line on the service card, so the 16:00 is seen before anything is chosen.
  async function noteCards() {
    let list;
    try {
      list = await fetchOccurrences();
    } catch {
      return;
    }
    for (const b of $("cards").children) {
      const x = fullDayExtras(list, b.dataset.id)[0];
      if (!x || b.querySelector(".bk-cnote")) continue;
      const note = document.createElement("span");
      note.className = "bk-cnote";
      note.textContent = waitingFor(x.o)
        ? `${dayWord(x.o.date)} ${x.main.time} is full. Join the list for an extra session at ${x.o.time}.`
        : `${dayWord(x.o.date)} ${x.main.time} is full. Extra session at ${x.o.time}.`;
      b.querySelector(".bk-cprice").before(note);
    }
  }

  // The framed note above the calendar, with a button straight to the 16:00.
  function renderExtraNote() {
    const box = $("extraNote");
    const extras = weekly() && !state.loading ? fullDayExtras(Object.values(state.occ).flat(), state.svc.id) : [];
    box.hidden = !extras.length;
    box.innerHTML = "";
    for (const { o, main } of extras) {
      const wait = waitingFor(o);
      const div = document.createElement("div");
      div.className = "bk-extra";
      div.innerHTML = `<p class="bk-extra-head"></p><p class="bk-extra-text"></p><button type="button" class="bk-extra-btn"></button>`;
      div.querySelector(".bk-extra-head").textContent = `${dayWord(o.date)}, ${main.time} is full`;
      div.querySelector(".bk-extra-text").textContent = wait
        ? `We open an extra session at ${o.time}, until ${o.end_time}, once ${o.min_to_run} mats are booked. ` +
          `Join the list and we will confirm on WhatsApp.${o.taken ? ` ${o.taken} of ${o.min_to_run} so far.` : ""}`
        : `Join us at ${o.time} instead, until ${o.end_time}, on the same terrace. ` +
          `${o.spots_left} mat${o.spots_left === 1 ? "" : "s"} left.`;
      const btn = div.querySelector("button");
      btn.textContent = wait ? `Join the ${o.time} list` : `Book ${o.time}`;
      btn.addEventListener("click", () => {
        state.month = monthOf(o.date);
        selectDate(o.date);
        pickTime(o.time);
      });
      box.appendChild(div);
    }
  }

  // Partner link: no cards, one 60 minute service, confirmed at once, no price.
  async function loadPartner() {
    const off = () => {
      $("cards").innerHTML =
        `<p class="bk-quiet">This booking link is not active. Please <a href="https://wa.me/${WA}" target="_blank" rel="noopener">message us on WhatsApp</a>.</p>`;
    };
    try {
      const res = await fetch(`/api/partner?slug=${encodeURIComponent(PARTNER_SLUG)}`);
      if (!res.ok) return off();
      state.partner = await res.json();
    } catch {
      return off();
    }
    const p = state.partner;
    state.services = [p.service];
    document.querySelector(".ph-lede").textContent = "Book a session for your guests. Nothing to pay here.";
    $("hService").textContent = "1  ·  Partner booking";
    const box = $("cards");
    box.removeAttribute("role");
    box.innerHTML = `<div class="bk-partner"><h2>Booking for <em></em></h2><p></p></div>`;
    box.querySelector("em").textContent = p.name;
    box.querySelector("p").textContent =
      `Sessions are ${p.service.duration_min} minutes. Pick a free time and name the session. ` +
      `It is confirmed as soon as you book and invoiced to ${p.name} per our agreement.`;
    chooseService(p.service.id, false);
  }

  function renderCards() {
    const box = $("cards");
    box.innerHTML = "";
    for (const s of state.services) {
      const c = CARDS[s.id];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "bk-card";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(state.svc?.id === s.id));
      b.dataset.id = s.id;
      b.innerHTML = `<h3></h3><span class="bk-blurb"></span><span class="bk-meta"></span><span class="bk-cprice"></span>`;
      b.querySelector("h3").textContent = c.title;
      b.querySelector(".bk-blurb").textContent = c.blurb;
      b.querySelector(".bk-meta").textContent = c.meta;
      b.querySelector(".bk-cprice").textContent = s.price_note || "";
      b.addEventListener("click", () => chooseService(s.id, true));
      box.appendChild(b);
    }
  }

  function chooseService(id, scroll) {
    if (state.svc?.id === id) return;
    state.svc = state.services.find((s) => s.id === id);
    state.avail = {};
    state.loaded = new Set();
    state.date = null;
    state.picks = [];
    state.occ = {};
    state.month = monthOf(today());
    for (const b of $("cards").children) b.setAttribute("aria-checked", String(b.dataset.id === id));

    $("whenLabel").textContent = weekly()
      ? CARDS[id].when
      : multi()
        ? `Choose ${state.svc.sessions} days in order, all within ${state.svc.session_window_days} days`
        : "Choose a day and time";
    setupDetails();
    $("stepWhen").hidden = false;
    $("stepDetails").hidden = true;
    $("timesWrap").hidden = true;
    renderPicks();
    renderExtraNote();
    loadMonth();
    if (scroll) $("stepWhen").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------- availability ----------
  // Group sessions (terrace, Mulajoy): one request covers every month the calendar can
  // show. Only the chosen service's dates count; bookable ones become the day's times
  // (usually one, two on a Sunday with the extra 16:00), so the rest of the flow is shared.
  async function loadSessions() {
    renderCalendar();
    if (state.loaded.has("occ")) return;
    state.loading = true;
    state.failed = false;
    renderCalendar();
    try {
      const list = await fetchOccurrences();
      state.occ = {};
      state.avail = { 1: {} };
      for (const o of list) { // sorted by start time
        if (o.service_id !== state.svc.id) continue;
        (state.occ[o.date] ||= []).push(o);
        if (o.bookable) (state.avail[1][o.date] ||= []).push(o.time);
      }
      state.loaded.add("occ");
      // Monthly sessions: open on the first month that has a bookable date.
      const firstOpen = Object.keys(state.avail[1]).sort()[0];
      if (firstOpen && monthOf(firstOpen) > state.month) state.month = monthOf(firstOpen);
    } catch {
      state.failed = true;
    } finally {
      state.loading = false;
      renderCalendar();
      renderExtraNote();
    }
  }

  // A day whose weekly session is full and nothing else that day can be booked: it stays
  // clickable to show the waiting-list note.
  const fullSession = (date) => {
    const occs = occsOn(date);
    return date >= today() && occs.some((o) => o.status === "open" && o.spots_left === 0) &&
      !occs.some((o) => o.bookable);
  };

  // Loads the shown month for the session being chosen next.
  async function loadMonth() {
    if (weekly()) return loadSessions();
    const month = state.month;
    const session = Math.min(state.picks.length + 1, state.svc.sessions);
    const key = `${session}|${month}`;
    renderCalendar();
    if (complete() || state.loaded.has(key)) return;
    const t = today();
    const from = monthOf(t) === month ? t : `${month}-01`;
    const days = daySpan(from, `${month}-${pad(daysIn(month))}`) + 1;
    state.loading = true;
    state.failed = false;
    renderCalendar();
    try {
      const res = await fetch(
        `/api/availability?service=${encodeURIComponent(state.svc.id)}&from=${from}&days=${days}&session=${session}`,
      );
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      state.avail[session] = Object.assign(state.avail[session] || {}, data);
      state.loaded.add(key);
    } catch {
      state.failed = true;
    } finally {
      state.loading = false;
      renderCalendar();
    }
  }

  function reloadAvailability() {
    occFetch = null;
    state.avail = {};
    state.loaded = new Set();
    loadMonth();
  }

  // A day can be chosen if it has times. For the 3-Day Journey the days are chosen in
  // order: a new day comes after the last one and inside the window from the first.
  // Already chosen days stay open so their time can be changed.
  function dayAllowed(date) {
    if (state.picks.some((p) => p.date === date)) return timesFor(date).length > 0;
    if (complete() && multi()) return false;
    if (!timesFor(date).length) return false;
    if (!multi() || !state.picks.length) return true;
    return date > state.picks.at(-1).date &&
      daySpan(state.picks[0].date, date) <= state.svc.session_window_days - 1;
  }

  function renderCalendar() {
    const month = state.month;
    const [y, m] = month.split("-").map(Number);
    $("monthLabel").textContent = `${MONTHS[m - 1]} ${y}`;
    const current = monthOf(today());
    $("prevMonth").disabled = month <= current;
    $("nextMonth").disabled = month >= addMonths(current, MONTHS_AHEAD);

    const box = $("days");
    box.innerHTML = "";
    const lead = (utc(`${month}-01`).getUTCDay() + 6) % 7; // Monday first
    for (let i = 0; i < lead; i++) box.appendChild(document.createElement("span"));
    const t = today();
    let open = 0; // days that can still be added
    for (let d = 1; d <= daysIn(month); d++) {
      const date = `${month}-${pad(d)}`;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "bk-day";
      b.textContent = d;
      const ok = !state.loading && dayAllowed(date);
      const full = !state.loading && fullSession(date);
      if (ok) {
        if (!state.picks.some((p) => p.date === date)) open++;
        b.classList.add("open");
        b.setAttribute("aria-label", `${longDate(date)}, free times`);
        b.addEventListener("click", () => selectDate(date));
      } else if (full) {
        b.classList.add("full");
        b.setAttribute("aria-label", `${longDate(date)}, full`);
        b.addEventListener("click", () => selectDate(date));
      } else {
        b.disabled = true;
      }
      // Weekly sessions show the live count right in the calendar: all the mats free that
      // day, across both sessions when the extra 16:00 is open. Which session they sit in
      // is on the time buttons. A day where only the extra is left shows its time instead.
      const occs = !state.loading && date >= t ? occsOn(date) : [];
      if (occs.length) {
        const open = occs.filter((o) => o.bookable);
        const onlyExtra = open.length > 0 && open.every((o) => o.extra);
        const small = document.createElement("small");
        small.textContent = occs.every((o) => o.status !== "open") ? "Closed"
          : full ? "Full"
          : !ok ? ""
          : onlyExtra ? open[0].time
          : `${open.reduce((n, o) => n + o.spots_left, 0)} left`;
        if (small.textContent) b.appendChild(small);
        if (ok && onlyExtra) b.classList.add("extra");
      }
      if (state.picks.some((p) => p.date === date)) b.classList.add("picked");
      if (date === state.date) b.classList.add("sel");
      if (date === t) b.classList.add("today");
      box.appendChild(b);
    }

    let status = "";
    if (state.loading) status = "Finding free times…";
    else if (state.failed) status = "Times cannot load right now. Please try again in a minute, or message us on WhatsApp.";
    else if (complete()) status = "";
    else if (!open && multi() && state.picks.length) {
      status = `No free day for day ${state.picks.length + 1} this month. Try the next month, or remove the last day.`;
    } else if (!open && weekly()) status = "No sessions with free mats left this month. Try the next one.";
    else if (!open) status = "No free times left this month. Try the next one.";
    else if (multi()) status = `Day ${state.picks.length + 1} of ${state.svc.sessions}.`;
    $("calStatus").textContent = status;
  }

  function selectDate(date) {
    state.date = date;
    renderCalendar();
    renderTimes();
    $("timesWrap").hidden = false;
    $("timesWrap").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function renderTimes() {
    const date = state.date;
    $("dateLabel").textContent = longDate(date);
    const box = $("times");
    box.innerHTML = "";
    const picked = state.picks.find((p) => p.date === date);
    for (const time of timesFor(date)) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "bk-time";
      b.textContent = time;
      // Weekly sessions carry their own count on the button, so a day with both the
      // 16:00 and the 17:30 shows where its free mats actually are.
      const o = weekly() ? occAt(date, time) : null;
      if (o) {
        const small = document.createElement("small");
        small.textContent = `${o.spots_left} left`;
        b.appendChild(small);
        b.setAttribute("aria-label", `${time}, ${o.spots_left} mat${o.spots_left === 1 ? "" : "s"} left`);
      }
      b.setAttribute("aria-pressed", String(picked?.time === time));
      b.addEventListener("click", () => pickTime(time));
      box.appendChild(b);
    }
    const info = $("timesInfo");
    const occs = occsOn(date);
    const open = occs.filter((x) => x.bookable);
    info.hidden = !occs.length;
    if (!occs.length) return;
    if (!open.length) {
      info.innerHTML =
        `This session is full. <a href="https://wa.me/${WA}?text=${encodeURIComponent(`Hi Can, is there a waiting list for the ${CARDS[state.svc.id].short} on ${longDate(date)}?`)}" target="_blank" rel="noopener">Message us on WhatsApp</a> and we will tell you if a mat opens up.`;
      return;
    }
    const o = (picked && occAt(date, picked.time)) || open[0];
    const main = o.extra && occs.find((x) => !x.extra && x.status === "open" && x.spots_left === 0);
    const line = `${o.venue} · ${o.time} to ${o.end_time} · ${o.taken} of ${o.capacity} mats taken, ${o.spots_left} left`;
    info.textContent = !main ? line
      : waitingFor(o)
        ? `${main.time} is full. The extra ${o.time} runs once ${o.min_to_run} mats are booked: join the list and we will confirm on WhatsApp. ${line}`
        : `${main.time} is full, so we opened an extra session at ${o.time}. ${line}`;
  }

  function pickTime(time) {
    const date = state.date;
    const existing = state.picks.find((p) => p.date === date);
    if (existing) existing.time = time; // changing the time of a chosen day
    else if (multi()) state.picks.push({ date, time }); // always after the last one
    else state.picks = [{ date, time }];
    if (weekly()) setParty(1, Math.min(state.svc.max_guests, occAt(date, time).spots_left), 1);
    renderTimes();
    renderPicks();
    loadMonth(); // fetches the next session's times if it differs in length
    updateDetails();
  }

  function renderPicks() {
    const box = $("picks");
    box.hidden = !multi() || !state.picks.length;
    box.innerHTML = "";
    state.picks.forEach((p, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<span></span>`;
      li.querySelector("span").textContent = `${shortDate(p.date)}, ${p.time}`;
      // Only the last day can be removed, so the days stay in order.
      if (i === state.picks.length - 1) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = "Remove";
        b.addEventListener("click", () => {
          state.picks.pop();
          if (state.date === p.date) {
            state.date = null;
            $("timesWrap").hidden = true;
          }
          renderPicks();
          loadMonth();
          if (state.date) renderTimes();
          updateDetails();
        });
        li.appendChild(b);
      }
      box.appendChild(li);
    });
  }

  // ---------- details and summary ----------
  function setParty(min, max, preferred) {
    const sel = $("party");
    const keep = Number(sel.value);
    sel.innerHTML = "";
    for (let n = min; n <= max; n++) sel.add(new Option(String(n), String(n)));
    const want = keep >= min && keep <= max && sel.dataset.touched ? keep : preferred;
    sel.value = String(Math.max(min, Math.min(max, want)));
    sel.closest(".bk-field").hidden = min === max && !weekly();
  }

  function setupDetails() {
    const s = state.svc;
    delete $("party").dataset.touched;
    setParty(s.min_guests, s.max_guests, s.price_base_guests || s.min_guests);
    $("partyLabel").textContent = weekly() ? "Mats" : s.id.startsWith("handpan") ? "Students" : "Guests";
    const loc = $("locationField");
    loc.hidden = s.id !== "sound-journey-villa" && !state.partner;
    loc.querySelector("input").required = s.id === "sound-journey-villa";
    $("sumRequest").textContent = weekly()
      ? "Your mats are confirmed as soon as you book."
      : "This is a request. We will message you on WhatsApp to confirm.";
    $("submitBtn").textContent = weekly() ? "Book" : "Send request";
    if (state.partner) {
      // The partner books for a guest: the guest's name, a number for the day, the room.
      $("labelField").hidden = false;
      $("labelField").querySelector("input").required = true;
      $("nameLabel").textContent = "Guest name";
      $("waLabel").textContent = "WhatsApp, guest or your team";
      $("waHint").textContent = "With the country code. We contact this number on the day.";
      $("locationLabel").innerHTML = "Villa, room or area <i>(optional)</i>";
      $("emailField").hidden = true; // the confirmation goes to the partner's email
      $("sumPay").hidden = true;
      $("sumRequest").textContent = `Confirmed as soon as you book. Invoiced to ${state.partner.name} per our agreement.`;
      $("submitBtn").textContent = "Book";
    }
    clearErrors();
  }

  function updateDetails() {
    const s = state.svc;
    const wasHidden = $("stepDetails").hidden;
    $("stepDetails").hidden = !complete();
    if (!complete()) return;
    const n = Number($("party").value);
    const p = priceFor(s, n);
    $("sumService").textContent = svcTitle();
    $("sumPrice").textContent = p == null ? "" : thb(p);
    $("sumWhen").textContent =
      state.picks.map((x) => `${longDate(x.date)}, ${x.time}`).join("\n") +
      (weekly() ? `\n${pickedOcc().venue}` : "") +
      (s.min_guests === s.max_guests && !weekly() ? "" : `\n${unit(n)}`);
    if (weekly()) {
      const o = pickedOcc();
      $("sumRequest").textContent = waitingFor(o)
        ? `You join the list. The ${o.time} runs once ${o.min_to_run} mats are booked, and we confirm on WhatsApp.`
        : "Your mats are confirmed as soon as you book.";
      $("submitBtn").textContent = waitingFor(o) ? "Join the list" : "Book";
    }
    if (wasHidden) $("stepDetails").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearErrors() {
    for (const e of document.querySelectorAll(".bk-err")) e.textContent = "";
    for (const i of $("stepDetails").querySelectorAll("[aria-invalid]")) i.removeAttribute("aria-invalid");
  }

  function showFieldErrors(fields) {
    let first = null;
    for (const [name, msg] of Object.entries(fields)) {
      if (name === "slots") {
        $("formError").textContent = msg;
        continue;
      }
      const slot = document.querySelector(`.bk-err[data-for="${name}"]`);
      if (slot) slot.textContent = msg;
      const input = $("stepDetails").elements[name];
      if (input) {
        input.setAttribute("aria-invalid", "true");
        first = first || input;
      }
    }
    if (first) first.focus();
  }

  async function submit(e) {
    e.preventDefault();
    clearErrors();
    const f = $("stepDetails").elements;
    const body = {
      service: state.svc.id,
      slots: state.picks,
      name: f.name.value,
      whatsapp: f.whatsapp.value,
      email: f.email.value,
      party_size: Number(f.party_size.value),
      location: f.location.value,
      notes: f.notes.value,
      website: f.website.value,
    };
    if (weekly()) body.occurrence = pickedOcc().id;
    if (state.partner) {
      body.partner = state.partner.slug;
      body.service_label = f.service_label.value;
    }
    const btn = $("submitBtn");
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Sending…";
    let res, data;
    try {
      res = await fetch(weekly() ? "/api/signup" : "/api/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      data = await res.json();
    } catch {
      res = { status: 0 };
    }
    btn.disabled = false;
    btn.textContent = label;

    if (res.status === 200) return done(body, data);
    if (res.status === 400 && data?.fields) return showFieldErrors(data.fields);
    if (res.status === 409 && weekly() && data?.error === "not_enough") {
      // Someone took mats meanwhile, but some are left: offer what remains.
      const o = pickedOcc();
      o.spots_left = data.spots_left;
      o.taken = o.capacity - data.spots_left;
      setParty(1, Math.min(state.svc.max_guests, data.spots_left), data.spots_left);
      renderTimes();
      updateDetails();
      $("formError").textContent = `Only ${data.spots_left} mat${data.spots_left === 1 ? "" : "s"} left now. Please choose again.`;
      return;
    }
    if (res.status === 409) {
      const msg = weekly()
        ? "Sorry, this session just filled up or closed. Please choose another day."
        : "Sorry, that time was just taken. Please choose another.";
      $("formError").textContent = msg;
      state.picks = [];
      state.date = null;
      $("timesWrap").hidden = true;
      renderPicks();
      reloadAvailability();
      setTimeout(() => {
        $("stepDetails").hidden = true;
        $("stepWhen").scrollIntoView({ behavior: "smooth", block: "start" });
        $("calStatus").textContent = msg;
      }, 1800);
      return;
    }
    $("formError").textContent =
      data?.error === "too_many_open"
        ? "You already have requests waiting. Please message us on WhatsApp."
        : "Something went wrong on our side. Please try again in a minute, or message us on WhatsApp.";
  }

  function done(body, data) {
    $("stepService").hidden = true;
    $("stepWhen").hidden = true;
    $("stepDetails").hidden = true;
    $("doneName").textContent = body.name.trim().split(/\s+/)[0];
    $("doneRef").textContent = data.ref;
    const n = body.party_size;
    $("doneWhen").textContent =
      `${svcTitle()}\n${data.slots.join("\n")}` +
      (weekly() ? `\n${pickedOcc().venue}` : "") +
      (state.svc.min_guests === state.svc.max_guests && !weekly() ? "" : `\n${unit(n)}`) +
      (data.price_thb == null ? "" : `\n${thb(data.price_thb)}, paid on the day`);
    $("doneLabel").textContent = data.waiting ? "On the list" : weekly() || state.partner ? "Booked" : "Request sent";
    $("doneRequest").textContent = state.partner
      ? `Confirmed and invoiced to ${state.partner.name}. A confirmation email is on its way to you.`
      : data.waiting
        ? `This extra session runs once ${pickedOcc().min_to_run} mats are booked. We will message you on WhatsApp to confirm.`
        : weekly()
          ? "Your mats are booked. Please arrive ten minutes early."
          : "This is a request. We will message you on WhatsApp to confirm.";
    $("doneWa").href = data.whatsapp_url;
    $("stepDone").hidden = false;
    $("book").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------- wiring ----------
  $("prevMonth").addEventListener("click", () => {
    state.month = addMonths(state.month, -1);
    loadMonth();
  });
  $("nextMonth").addEventListener("click", () => {
    state.month = addMonths(state.month, 1);
    loadMonth();
  });
  $("party").addEventListener("change", () => {
    $("party").dataset.touched = "1";
    updateDetails();
  });
  $("stepDetails").addEventListener("submit", submit);
  $("stepDetails").elements.namedItem("service_label").addEventListener("input", () => {
    if (complete()) $("sumService").textContent = svcTitle();
  });

  // Guests abroad: say plainly that times are island time.
  if (new Date().getTimezoneOffset() !== -420) {
    $("tzNote").textContent = "Times are Koh Samui time (GMT+7), not the time on your phone.";
  }

  loadServices();
})();
