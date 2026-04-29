---
name: noom-sound-studio-design
description: Use this skill to generate well-branded interfaces and assets for Noom Sound Studio — a small handpan & sound-healing practice on Koh Samui, Thailand. Editorial, photo-led, contemplative serif typography, warm cream backgrounds. For production, prototypes, slides, or any visual artifact in the Noom brand.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files (`colors_and_type.css`, `assets/`, `preview/`, `ui_kits/website/`).

Key constraints:
- Cream backgrounds (`#F4ECDF`), warm ink (`#2A2622`), no pure black, no pure white.
- Cormorant Garamond for everything readable, Inter only for eyebrows / meta / labels.
- Photography-led layouts. Asymmetric grids. Generous vertical rhythm (72–160px between sections).
- No emoji. No icon library. No gradients. No bouncy animation. Slow eases (500–900ms).
- Calendar lives in the scroll, not nav. Underline-only form inputs. Square corners.

If creating visual artifacts (slides, mocks, throwaway prototypes), copy `assets/photo-noom-sunset-handpan.png`, `assets/wordmark.svg` and `colors_and_type.css` out, and create static HTML files for the user to view. If working on production code, copy assets and use `colors_and_type.css` as the foundation.

If the user invokes this skill without other guidance, ask what they want to build (web page, poster, social tile, slide deck), confirm tone, and act as an expert editorial designer who outputs HTML artifacts or production code.
