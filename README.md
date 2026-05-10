# misbah · exploration

A personal visual atlas of topics worth a longer look — tea, anthropology, travel, history, craft, science, food. Static site, Markdown content, Node build pipeline. Image-first homepage. Interactive globe of every geo-tagged topic.

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
│   └── collections/    # curated reading paths (members[] frontmatter)
├── templates/
│   ├── _layout.html    # head / nav / footer shell
│   └── _drafting/      # authoring spec for new topics
├── build/
│   ├── build.mjs       # main build
│   ├── validate.mjs    # schema + image-attribution + geo bounds
│   ├── check.mjs       # post-build invariants
│   ├── draft.mjs       # scaffold a draft
│   ├── watch.mjs       # dev server
│   └── lib/            # render, atlas, util, placeholder
├── scripts/
│   ├── enhance.js      # theme toggle + reveal-on-scroll
│   └── atlas.js        # globe.gl + 2D fallback
├── tests/              # Playwright (home, topic, atlas, a11y)
├── style.css
├── index.html          # GENERATED — homepage mosaic
├── pages/              # GENERATED — topic + atlas pages
├── data/               # GENERATED — topics.json, geo.json
├── assets/images/      # original photos / generated placeholders
└── local/              # gitignored — drafts, plans, notes
```

## Adding a topic

```bash
npm run draft <slug>
# edit local/drafts/topics/<slug>.md
mv local/drafts/topics/<slug>.md content/topics/
# drop hero.jpg into assets/images/topics/<slug>/ (optional — placeholder used otherwise)
npm run verify
```

## Image attribution — non-negotiable

Every image must declare `source: original` or `source: external`. External images need a `credit` and ideally `license` and `url`. The validator fails the build if either is missing.

When the photo file is not on disk yet, the build emits a topic-appropriate generated SVG placeholder so the page still feels intentional.

## Globe

`pages/atlas.html` shows every geo-tagged topic as a pin on a draggable globe (globe.gl, three.js under the hood). When WebGL is unavailable, it falls back to a soft equirectangular SVG map. Hover a list row, or click a pin, to open the preview card.

## Why this is different from siblings

- **hd-recipes** — warm cream, brick red, EB Garamond, reading-first. Recipe-shaped content.
- **jiaoluo-shuwu** — Chinese-language reference, lookup-shaped.
- **misbah-exploration** — cool cream + midnight ink + brass, Fraunces, gallery-first. Exploration-shaped.

The build pipeline is similar in spirit to its siblings (Markdown → Node → static HTML, validators, draft scaffolder, watch+serve). The visual identity, content model, and atlas/globe are unique.
