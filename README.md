# Noom Sound Studio — Design System

**Noom Sound Studio** is a small handpan & sound-healing practice based on the cliffs and beaches of **Koh Samui, Thailand**. The studio offers handpan music lessons, rhythm classes, and one-on-one sound therapy sessions, plus weekly **free sound & movement gatherings** open to anyone passing through the island.

The brand sits at the intersection of *contemplative* and *grounded* — spiritual without being woo-woo, slow without being precious. The visual world is photo-led: warm sunsets, water, simple bodies in white linen, the silver belly of a handpan. Type carries calm.

---

## Sources used

- **Inspiration**: [sound-ceremony.com](https://sound-ceremony.com) — editorial photo-led layout, contemplative serif typography, calendar-in-flow.
- **Brand photography**: `uploads/WhatsApp Image 2026-04-11 at 9.56.png` — sunset handpan player at infinity-edge water, agave plant. Copied to `assets/photo-noom-sunset-handpan.png`. This single image defines the palette and mood.
- No codebase or Figma was provided; the system is built from the inspiration brief and photo.

---

## Index

```
README.md                ← you are here
SKILL.md                 ← agent skill manifest
colors_and_type.css      ← CSS variables: color, type, spacing, motion
fonts/                   ← (Google Fonts loaded via CDN — see “Type” below)
assets/                  ← photography, logo, iconography
preview/                 ← design-system tab cards (one HTML file each)
ui_kits/
  website/               ← the public marketing site (handpan lessons, sessions, calendar)
    index.html
    *.jsx                ← reusable section + component recreations
slides/                  ← (none — no deck template was provided)
```

---

## Content fundamentals

The voice is **first-person plural & second-person warm** — *we host, you arrive*. Sentences are short and breathing. There is space around words on the page and around words in a sentence; commas and dashes are used like rests in a phrase.

- **Casing**: sentence case for everything. Headlines, buttons, navigation. Title Case feels too corporate.
- **Person**: *we* (Noom + collaborators), *you* (the visitor). Avoid *our community*, *our family*. Avoid *journey*, *transformation*, *transformative*, *unlock*, *vibes*, *holistic*.
- **Tone words**: *gather, listen, sit, return, rest, attune, slow*. Avoid *experience*, *immersive*, *premium*, *curated*.
- **Length**: a hero line is one clause. A paragraph is three or four sentences. A session description fits in a postcard.
- **Punctuation**: em-dashes are welcome — they breathe. Ellipses are not (too sentimental). Periods, not exclamation points.
- **No emoji.** Ever. Not in copy, not in buttons, not in calendar listings.
- **Numbers**: spell out one through nine in prose; numerals for dates, times, prices. Times are local (`6:30 pm`). Dates are written long: *Friday, the eleventh of April*.
- **Calendar entries** read like an invitation, not a product:
  > *Sunset handpan circle — Friday, 6:30 pm at Lamai cliffs. Free. Bring a cushion.*

**Examples**

- Hero: *Sound, slowly. Handpan lessons and listening sessions on Koh Samui.*
- Section eyebrow: `WEEKLY · OPEN TO ALL`
- CTA button: `Reserve a seat` · `See the calendar` · `Write to Noom`
- Footer line: *Made on the island. Held lightly.*

---

## Visual foundations

### Palette
A single warm cream base (`--cream` `#F4ECDF`) carries every page. Text is a warm near-black ink (`--ink` `#2A2622`) — never pure black. Accents are restrained to three: terracotta (`--clay`), agave (`--sage`), and a deep warm sand (`--sand`) — all pulled from the brand photography. **At most two accents are visible at once.** Use them sparingly: a single link underline, a hairline divider tint, a small mark.

### Typography
- **Display & body**: **Cormorant Garamond** — a contemplative book-weight serif. Used for everything readable: headlines, paragraphs, lead-ins. Italics are used freely for leads, captions, and quiet emphasis.
- **Utility**: **Inter** — a quiet sans, used only for *labels, eyebrows, meta, calendar dates, and form inputs*. Always tracked wide (`letter-spacing: 0.22em`) and uppercased when used as an eyebrow.
- *Substitution flag*: Cormorant Garamond is the closest open-source match to the editorial serifs Sound Ceremony uses. If you have a specific licensed face (Tiempos, GT Sectra, Söhne Mono), drop the files into `fonts/` and update `colors_and_type.css`.

### Spacing & rhythm
Generous. Vertical rhythm runs in multiples of 8px, but section breaks are large — `--s-8` (72px) between subsections, `--s-9` (112px) between sections, and `--s-10` (160px) above hero blocks on desktop. Prose is held at `--measure` (64ch).

### Layout
- **Asymmetric grids over centered ones.** Lead with a full-bleed photo on the left, type on the right; or full-width image, then a single off-center paragraph beneath.
- **The calendar lives in the scroll**, not a nav. Each entry is a row: date · title · location · meta. No cards, no chips.
- **Sticky nav is minimal**: one wordmark, three links, no shadow. It sits on the page, not above it.

### Imagery
- **Always editorial photography**, full-bleed or near full-bleed. Warm golden hour, water, white linen, candles, plant matter.
- *Color treatment*: warm cast (slight peach tint), gentle film grain optional, never desaturated, never cool.
- Crop **portrait** for mobile-first hero, **wide landscape** for inline pieces. Subject usually off-center, lots of sky or water.
- No stock illustrations, no icons-as-imagery, no abstract gradients.

### Motion
Slow. *Everything* eases over 500–900ms with a long-tail cubic (`cubic-bezier(0.22, 0.61, 0.36, 1)`). Scroll-triggered fades only — content rises 12–24px and opacity goes 0 → 1. **No bounces. No spring. No parallax.**

### States
- **Hover (link)**: 1px underline shifts from `--ink-faint` → `--clay`, color of the text picks up `--clay`.
- **Hover (button, primary)**: background darkens from `--ink` → `#000`, no scale, no shadow change.
- **Press**: opacity 0.9. No transform.
- **Focus**: 2px outline `--clay` offset 3px, never removed.

### Borders, rules, dividers
- 1px hairline `--rule` (`#A89A85`) is the only divider. No double rules, no shadows-as-rules.
- Section breaks use a single hairline with `var(--s-7)` margin top/bottom.

### Shadows
Very rarely used. When used (a sticky reservation card, a modal), it's a long warm shadow: `0 24px 60px -28px rgba(42,38,34,0.25)`. Never dark, never blue.

### Corner radius
- **Square by default.** `--r-0`.
- Pill (`--r-pill`) only for one element: the small *play / pause* control on audio previews.
- Cards (where used) are square with a 1px `--rule` border, no shadow.

### Cards
A "card" in this system is barely a card. It's a bordered rectangle: `1px solid var(--rule)`, `--cream` background, square corners, padding `var(--s-6)`. No shadow. Hover deepens the border to `--ink`.

### Transparency & blur
Used once: the sticky nav, after 80px of scroll, gets `backdrop-filter: blur(12px)` over a `rgba(244,236,223,0.78)` cream wash. Nowhere else.

### Forms
Underline-only inputs. No box, no fill. `border-bottom: 1px solid var(--rule)`, focus deepens to `--ink`. Label sits above the input, in `.eyebrow` style.

---

## Iconography

**Noom uses almost no iconography.** This is a photo-led, type-led brand. The interface is meant to feel like a printed retreat brochure, not an app.

- **No icon font, no icon library.** Do not import Lucide, Heroicons, Feather, etc.
- **Allowed glyphs** — drawn inline as small SVGs at 1.25px stroke, current-color, where genuinely needed:
  - Right arrow `→` for navigation between calendar entries (or use the literal Unicode `→` character in Inter).
  - A simple play triangle for audio previews.
  - A small spiral / circle motif used as a section marker (decorative, hand-drawn feel).
- **No emoji.** Not in copy, not in UI.
- **Unicode glyphs are preferred over SVGs** for arrows and simple marks: `→ ← · ⸺ ◯ ◦`. They render in Inter at the meta size.
- **Logo / wordmark**: *Noom Sound Studio* set in Cormorant Garamond italic at 22px, letter-spacing `0.04em`. No symbol mark. See `assets/wordmark.svg`.

If a future surface genuinely needs more iconography (e.g. a booking flow with status states), substitute **Lucide** at 1.5px stroke, `currentColor`, and flag it in the surface's README.

---

## Quick reference

```css
/* Bring this to any new file */
@import url("../colors_and_type.css");
```

```html
<header>
  <p class="eyebrow">Weekly · open to all</p>
  <h1 class="display">Sound, slowly.</h1>
  <p class="lead">Handpan lessons and listening sessions on the cliffs of Koh Samui.</p>
</header>
```

---

## Caveats

- The brand has **one** confirmed photograph. The website mockup uses placeholder warm-toned imagery that should be replaced with real shoots from Noom (sunset gatherings, handpan close-ups, the studio space).
- **Wordmark is provisional** — set in Cormorant Garamond italic. If a custom hand-lettered or logotype mark exists, drop it into `assets/`.
- Fonts are loaded via Google Fonts CDN. If a licensed editorial serif (e.g. *Tiempos Headline*, *GT Sectra*) is preferred, swap in `colors_and_type.css`.
