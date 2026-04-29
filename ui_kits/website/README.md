# Noom Sound Studio — Website UI Kit

The public marketing site. A single long-scroll homepage built from these components, with one hero, an intro, a calendar list (in-flow, not nav-hidden), session cards, audio previews, an about section, and a quiet footer.

## Files

- `index.html` — composes all components into the homepage
- `Nav.jsx` — sticky wordmark + 4 links; cream wash + blur after scroll
- `Hero.jsx` — full-bleed photo, type sits to the right
- `Intro.jsx` — single off-center paragraph
- `Calendar.jsx` — list of upcoming gatherings, in the scroll
- `Sessions.jsx` — two-card grid (lessons / therapy)
- `Audio.jsx` — recording previews with pill play button
- `About.jsx` — image + body, asymmetric
- `Footer.jsx` — wordmark, address, three links

## Conventions

- All components consume CSS vars from `colors_and_type.css`
- No icon library; arrows are unicode `→`
- Reveal-on-scroll animation is a single `IntersectionObserver` that adds `.in` to anything with `.reveal`
