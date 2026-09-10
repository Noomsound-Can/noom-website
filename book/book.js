// /book/ page. Repo-only, never authored in Claude Design. Plain JS, no build step.
// Spec: noom-booking/BOOKING-SPEC.md sections 6.2 and 9. The server re-checks
// everything; this file only helps the guest choose.
(() => {
  const $ = (id) => document.getElementById(id);
  const WA = "905468419181";
  const MONTHS_AHEAD = 2; // current month plus two
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];
  const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Card copy lives here, prices come from the database.
  const CARDS = {
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
  };

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
  const complete = () => state.svc && state.picks.length === state.svc.sessions;
  // The session a day belongs to: its own if already picked, else the next one.
  const sessionFor = (date) => {
    const i = state.picks.findIndex((p) => p.date === date);
    return i >= 0 ? i + 1 : state.picks.length + 1;
  };
  const timesFor = (date) => (state.avail[sessionFor(date)] || {})[date] || [];

  // ---------- services ----------
  async function loadServices() {
    try {
      const res = await fetch("/api/services");
      if (!res.ok) throw new Error(res.status);
      state.services = (await res.json()).filter((s) => s.kind === "private" && CARDS[s.id]);
    } catch {
      $("cards").innerHTML =
        `<p class="bk-quiet">Booking cannot load right now. Please <a href="https://wa.me/${WA}" target="_blank" rel="noopener">message us on WhatsApp</a>.</p>`;
      return;
    }
    renderCards();
    const wanted = new URLSearchParams(location.search).get("service");
    if (wanted && state.services.some((s) => s.id === wanted)) chooseService(wanted, false);
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
    state.month = monthOf(today());
    for (const b of $("cards").children) b.setAttribute("aria-checked", String(b.dataset.id === id));

    $("whenLabel").textContent = multi()
      ? `Choose ${state.svc.sessions} days in order, all within ${state.svc.session_window_days} days`
      : "Choose a day and time";
    setupDetails();
    $("stepWhen").hidden = false;
    $("stepDetails").hidden = true;
    $("timesWrap").hidden = true;
    renderPicks();
    loadMonth();
    if (scroll) $("stepWhen").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------- availability ----------
  // Loads the shown month for the session being chosen next.
  async function loadMonth() {
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
      if (ok) {
        if (!state.picks.some((p) => p.date === date)) open++;
        b.classList.add("open");
        b.setAttribute("aria-label", `${longDate(date)}, free times`);
        b.addEventListener("click", () => selectDate(date));
      } else {
        b.disabled = true;
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
    } else if (!open) status = "No free times left this month. Try the next one.";
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
      b.setAttribute("aria-pressed", String(picked?.time === time));
      b.addEventListener("click", () => pickTime(time));
      box.appendChild(b);
    }
  }

  function pickTime(time) {
    const date = state.date;
    const existing = state.picks.find((p) => p.date === date);
    if (existing) existing.time = time; // changing the time of a chosen day
    else if (multi()) state.picks.push({ date, time }); // always after the last one
    else state.picks = [{ date, time }];
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
  function setupDetails() {
    const s = state.svc;
    const sel = $("party");
    sel.innerHTML = "";
    for (let n = s.min_guests; n <= s.max_guests; n++) sel.add(new Option(String(n), String(n)));
    sel.value = String(Math.max(s.min_guests, Math.min(s.max_guests, s.price_base_guests || s.min_guests)));
    sel.closest(".bk-field").hidden = s.min_guests === s.max_guests;
    $("partyLabel").textContent = s.id.startsWith("handpan") ? "Students" : "Guests";
    const loc = $("locationField");
    loc.hidden = s.id !== "sound-journey-villa";
    loc.querySelector("input").required = !loc.hidden;
    clearErrors();
  }

  function updateDetails() {
    const s = state.svc;
    const wasHidden = $("stepDetails").hidden;
    $("stepDetails").hidden = !complete();
    if (!complete()) return;
    const n = Number($("party").value);
    const p = priceFor(s, n);
    $("sumService").textContent = CARDS[s.id].title;
    $("sumPrice").textContent = p == null ? "" : thb(p);
    $("sumWhen").textContent =
      state.picks.map((x) => `${longDate(x.date)}, ${x.time}`).join("\n") +
      (s.min_guests === s.max_guests ? "" : `\n${n} ${n === 1 ? (s.id.startsWith("handpan") ? "student" : "guest") : (s.id.startsWith("handpan") ? "students" : "guests")}`);
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
    const btn = $("submitBtn");
    btn.disabled = true;
    btn.textContent = "Sending…";
    let res, data;
    try {
      res = await fetch("/api/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      data = await res.json();
    } catch {
      res = { status: 0 };
    }
    btn.disabled = false;
    btn.textContent = "Send request";

    if (res.status === 200) return done(body, data);
    if (res.status === 400 && data?.fields) return showFieldErrors(data.fields);
    if (res.status === 409) {
      $("formError").textContent = "Sorry, that time was just taken. Please choose another.";
      state.picks = [];
      state.date = null;
      $("timesWrap").hidden = true;
      renderPicks();
      reloadAvailability();
      setTimeout(() => {
        $("stepDetails").hidden = true;
        $("stepWhen").scrollIntoView({ behavior: "smooth", block: "start" });
        $("calStatus").textContent = "That time was just taken. Please choose another.";
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
      `${CARDS[state.svc.id].title}\n${data.slots.join("\n")}` +
      (state.svc.min_guests === state.svc.max_guests ? "" : `\n${n} ${n === 1 ? "person" : "people"}`) +
      (data.price_thb == null ? "" : `\n${thb(data.price_thb)}, paid on the day`);
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
  $("party").addEventListener("change", updateDetails);
  $("stepDetails").addEventListener("submit", submit);

  // Guests abroad: say plainly that times are island time.
  if (new Date().getTimezoneOffset() !== -420) {
    $("tzNote").textContent = "Times are Koh Samui time (GMT+7), not the time on your phone.";
  }

  loadServices();
})();
