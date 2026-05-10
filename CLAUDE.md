# misbah-exploration — Project Instructions

## What this is
A personal visual atlas of topics worth a longer look — tea, anthropology, travel, history, craft, science, food. Static site, Node build pipeline, content in Markdown. Sibling to `hd-recipes` and `jiaoluo-shuwu`; the architecture rhymes, the visual identity does not.

```
npm run watch        # dev server on :8080
npm run verify       # validate + build + check
npm run test         # verify + Playwright (chromium)
npm run draft <slug> # scaffold a draft topic
```

Source of truth: `content/topics/<slug>.md`. Never hand-edit `pages/` or `data/` — generated.

---

## Folder layout

```
content/topics/         # source — one .md per topic
templates/_layout.html  # head/nav/footer shell
templates/_drafting/    # authoring spec
build/                  # build pipeline (build, validate, check, draft, watch)
scripts/                # client-side JS (theme, reveal, atlas/globe)
tests/                  # Playwright specs
assets/images/topics/<slug>/   # photos (or generated placeholder)
pages/                  # GENERATED
data/                   # GENERATED
local/                  # gitignored — drafts, plans, prompts
```

---

## Voice & tone (non-negotiable)

This is Hunter's atlas. Topics are things he found absorbing enough to look into. The tone is **editorial, first-person where useful, opinionated, generous with images, careful with attribution**. Not encyclopedic. Not breathless. Not Bon Appétit cheerful.

Every topic should:
- Lead with the hook — the part that surprised the writer.
- Contain at least one concrete, anchoring detail (a date, a measurement, a place name).
- Avoid summary paragraphs that exist only to introduce the real content. Get into it.
- Use second- and third-level headings (`##`, `###`) to break the body into 3–6 short sections.

Things to avoid:
- Tables in markdown output (Hunter's global preference).
- Hyperbole and flair words ("incredible", "amazing", "fascinating").
- Throat-clearing intros ("In this article we will explore...").

---

## Schema

Frontmatter shape:

```yaml
title: Gongfu Cha
slug: gongfu-cha          # optional — derived from filename
summary: One sentence on why it's worth a longer look.
status: complete          # draft | complete | stub
featured: true            # optional — bumps it to the front of the mosaic
updated: 2026-05-10
tags: [tea, china, ritual]   # first family-tag (tea, history, travel,
                             # anthropology, science, craft, experience, food)
                             # determines the topic family color
geo:
  lat: 24.88
  lng: 118.58
  place: Fujian, China
  precision: exact | city | region | country | broad
era:
  start: 1700
  end: present              # numeric or 'present'
images:
  - src: hero.jpg           # under assets/images/topics/<slug>/
    role: hero              # 'hero' = full-bleed top image; otherwise inline
    source: original | external   # REQUIRED
    credit: "Wikimedia — User:Foo"
    license: "CC BY-SA 4.0"
    url: https://commons.wikimedia.org/...
    alt: ""
    caption: ""
related: [other-slug]       # explicit related list; build also infers by tag overlap
sources:
  - { title: "Book or article", url: "https://..." }
```

Validator fails the build on:
- Missing title or summary
- `status: complete` with empty body
- Image without `source` or external image without `credit`
- `geo.lat` / `geo.lng` out of range
- `status` not in `draft|complete|stub`

---

## Image rules

**Every image declares its provenance.** Originals (`source: original`) are credited "Hunter Dellere"; externals (`source: external`) carry visible credit + license + link. Hero images get the attribution baked into a corner caption; in-body images get a chip-tagged caption.

When a photo file isn't on disk yet, the build generates a topic-appropriate SVG placeholder (gradient + concentric arcs + grid + title) so draft topics still look intentional. As soon as you drop a real `hero.jpg` into `assets/images/topics/<slug>/`, the build prefers it.

When in doubt, prefer **Wikimedia Commons** or **Unsplash** sources — durable URLs, clear licensing. Never include images without confirming the license.

---

## Topic families

The first family tag in `tags:` colors the topic. Families: `tea`, `history`, `travel`, `anthropology`, `science`, `craft`, `experience`, `food`. Anything else falls back to default.

This drives:
- Pin color on the globe
- The eyebrow label in the homepage tile and constellation cards
- The accent wash on hero/section blocks (subtle)

---

## Atlas & globe

Any topic with `geo.lat` and `geo.lng` automatically appears on the atlas. The build emits `data/geo.json`; `scripts/atlas.js` mounts globe.gl when WebGL is available, an SVG equirectangular map otherwise. Hover a list row → preview card opens. Click a pin → preview + camera flies in.

When adding a topic with a place, fill `geo.precision` honestly — `exact` only when the lat/lng is a real coordinate (a building, a cave, a single shop), `city` for "this happened in this city," `region` / `country` / `broad` for fuzzier anchoring.

---

## Tests (Playwright, chromium only)

- `tests/home.spec.mjs` — mosaic count, no console errors, theme toggle.
- `tests/topic.spec.mjs` — hero, attribution, body density, constellation.
- `tests/atlas.spec.mjs` — list count, tag chip filter, globe canvas/svg present, hover preview.
- `tests/a11y.spec.mjs` — axe-core scan on home, a topic, atlas (color-contrast disabled — tuned manually).

Run `npm run test` before any commit.

---

## Git Commit Format
```
feat: add topic <slug>
feat: atlas — <change>
fix: …
refactor: …
docs: …
```

---

## Do not
- Hand-edit `pages/`, `data/`, `sitemap.xml`. Always rebuild.
- Use tables in markdown bodies.
- Skip image `source` / `credit`.
- Use hyperbolic language.
- Create new top-level files unless asked. Drafts go to `local/`.
