# TOPIC drafting spec

Read this before writing or reformatting any topic.

## The shape

A topic is a self-contained essay about one thing Hunter looked into and found worth a longer look. Not encyclopedic. Not exhaustive. Pointed.

Target length: 350–800 words of body. Five paragraphs is enough; ten is too many unless the topic earns it.

Structure:

1. **Lede** — one to three sentences, no heading. Lead with the hook. The thing that surprised you. The reason you remember this.
2. **Two to four `## sections`**, each with a noun-phrase title that previews what the section actually does. Avoid empty section labels like "Background", "Overview", "Conclusion".
3. **Optional closer** — a section called `## What stayed with me` or `## What surprised me` works well when you have a clean takeaway. Skip it when you don't.

## Voice

- First person is allowed when it earns its place. "I" is for things you actually saw, did, or noticed.
- Concrete > abstract. Cite a year, a number, a place, a person.
- Cut filler. "Notably", "interestingly", "essentially", "fundamentally" — almost always remove.
- One idea per paragraph.
- No tables. (Global rule.)

## Hooks that tend to work

- A defied expectation ("turns out the slow version is faster on the clock").
- A scarcity story ("there's one woman alive who knows how to do this").
- A regulatory or political angle disguised as a craft story.
- A surprising material fact (the iron content of the clay, the parasite, the smoke).

## What to do with `geo`

If the topic is anchored in a place, set `geo.lat`, `geo.lng`, `geo.place`, and an honest `precision`. The atlas globe shows it as a pin in the family color. If the topic is genuinely placeless (a concept, a math idea), leave geo off — it will simply not appear on the atlas.

## What to do with images

Hero image is required for `status: complete`. Use a Wikimedia Commons or Unsplash image with clear licensing, or your own photograph (`source: original`). Always fill `credit`, `license`, and `url` for externals. If you don't have an image yet, leave the frontmatter declaring the slot — the build will emit a generated placeholder so the page still works, and you can swap in the real photo later.

In-body figures use the same `images:` array with a `role` other than `hero`. Each gets a credit chip caption.

## When to mark `featured: true`

Sparingly. Featured topics get larger tiles in the mosaic and bubble up. Five seed topics with three featured is fine. Twenty topics with eighteen featured defeats the point.

## When `status` is what

- `draft` — work in progress, not surfaced anywhere we wouldn't expect drafts.
- `complete` — fully authored, hero image either on disk or properly attributed external URL, summary present.
- `stub` — a placeholder that needs a real drafting pass. Useful when you crosslink to a topic that doesn't exist yet.
