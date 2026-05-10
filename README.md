# misbah · exploration

A personal visual atlas of topics worth a longer look — anthropology, tea, cartography, travel, history, craft. Static site, Markdown content, Node build pipeline. Image-first homepage. Interactive globe. Pillar hubs. Cmd-K search. Timeline. Tag index.

Live: **https://hunterdellere.github.io/misbah-exploration/**

```
npm install
npm run watch        # dev server on :8080, rebuild on save
npm run verify       # validate + build + check
npm run test         # verify + Playwright (chromium only)
npm run draft <slug> # scaffold a new topic in local/drafts/
```

## What lives where

```
misbah-exploration/
├── content/
│   ├── topics/         # one .md per topic — source of truth
│   └── pillars/        # pillar hubs (anthropology, tea, cartography)
├── templates/
│   ├── _layout.html    # head / nav / footer / search / scripts
│   └── _drafting/      # authoring spec
├── build/
│   ├── build.mjs       # main build
│   ├── validate.mjs    # schema + image-attribution + geo bounds
│   ├── check.mjs       # post-build invariants
│   ├── draft.mjs       # scaffold a draft
│   ├── watch.mjs       # dev server
│   └── lib/
│       ├── render.mjs      # topic, pillar, mosaic, breadcrumbs, TOC
│       ├── atlas.mjs       # globe page
│       ├── indexes.mjs     # tag index, timeline, search index
│       ├── placeholder.mjs # generated SVG hero placeholders
│       └── util.mjs
├── scripts/
│   ├── enhance.js      # theme toggle, reveal, drop-cap, ext-link affordance
│   ├── atlas.js        # globe.gl + 2D fallback
│   ├── search.js       # Cmd-K palette
│   ├── toc.js          # scroll-spy + reading progress
│   └── sw-register.js  # service-worker registration
├── tests/              # Playwright (home, topic, atlas, ia, a11y)
├── style.css
├── sw.js               # service worker (cache-first assets, network-first HTML)
├── feed.xml            # GENERATED — RSS
├── sitemap.xml         # GENERATED
├── robots.txt          # GENERATED
├── 404.html            # GENERATED
├── index.html          # GENERATED — homepage mosaic + pillar strip
├── pages/              # GENERATED
├── data/               # GENERATED — topics.json, geo.json, search.json
├── assets/images/      # original photos / generated placeholders
└── local/              # gitignored — drafts, plans, notes
```

## Content model

Two top-level types:

- **topics** — `content/topics/<slug>.md`. The atom. Self-contained essay. Required fields: `title`, `summary`, `body`, at least one image with `source` + `credit`.
- **pillars** — `content/pillars/<slug>.md`. Curated reading paths. `order:` array names children in suggested reading order.

A topic's `pillar` field links it to its parent pillar. Pillar children render as numbered cards on the hub page; on the topic page, the pillar nav shows prev/next/up.

## IA

- **Home** — pillar strip (hubs) + asymmetric mosaic (all topics)
- **Pillar hub** — intro essay + ordered child list + cross-pillar nav
- **Topic** — full-bleed hero with attribution; reading column with right-rail TOC and scroll-spy on essays >3 sections; pillar prev/next; constellation of related topics
- **Atlas** — interactive globe (globe.gl + 2D SVG fallback); side panel with tag filters and full pinned list; hover/click to peek
- **Tags** — sticky tag cloud with weighted sizes + grouped sections per tag
- **Timeline** — horizontal scrolling era axis with positioned topic bars
- **Search** — Cmd-K palette over all topics + pillars; fuzzy match on title, summary, tags, place

## Adding a topic

```bash
npm run draft <slug>
# edit local/drafts/topics/<slug>.md
mv local/drafts/topics/<slug>.md content/topics/
# (optional) drop hero.jpg into assets/images/topics/<slug>/
npm run verify
```

## Image attribution — non-negotiable

Every image must declare `source: original` or `source: external`. External images need a `credit` and ideally `license` and `url`. The validator fails the build if either is missing. When the photo file is not on disk, the build emits a topic-appropriate generated SVG placeholder.

## Deploy

Push to `main`. The `.github/workflows/pages.yml` workflow runs `npm ci`, `npm run verify`, stages the static output, and deploys to GitHub Pages.

## Why this is different from siblings

- **hd-recipes** — warm cream + brick red, EB Garamond, reading-first.
- **jiaoluo-shuwu** — Chinese-language reference, lookup-first.
- **misbah-exploration** — cool cream + midnight ink + brass, Fraunces, gallery-first, atlas-and-pillar IA.

Same architectural backbone (Markdown → Node → static HTML, validators, draft scaffolder, watch+serve). Different visual identity, content model, navigation, and feature set.
