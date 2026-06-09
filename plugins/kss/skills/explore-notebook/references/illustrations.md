# Illustrations — figures for prose contexts

**Use when**: the user is writing a blog post, README, design doc, or editorial article and wants **per-section header figures** — small hand-rolled SVG illustrations that ship inline with the prose. Not technical diagrams (those go to the `explore-html` skill's `references/diagrams.md`), not interactive explorers (those are the rest of this skill). Just figures the reader scans on their way through the text.

**Defining trait**: each SVG is a standalone export-ready asset. The explore-notebook page is a *figure sheet* — multiple figures laid out together so the author can iterate on the set, then peel off individual SVGs and drop them into the prose.

## How this differs from the sibling skills

| If the user wants… | Use |
|---|---|
| One technical diagram in isolation (architecture, sequence, state machine, ER, flowchart, timeline, etc.) | **`explore-html` skill** — its `references/diagrams.md` is the diagram playbook |
| A flowchart with interactive expand-on-click steps embedded in an explainer | This skill, with SVG lifted from `explore-html`'s `references/diagrams.md` |
| 3–8 small figures to illustrate a blog post / docs section / README | **This reference** — figure sheet pattern |
| A single hero illustration for a marketing page | This reference — same pattern, n=1 |
| A photographic mockup or pixel-perfect UI screenshot | Out of scope; use Figma or a screenshot |

The rule: **technical content → `explore-html`'s `references/diagrams.md`; editorial illustration → here.** When in doubt, ask. If the figure has nodes-and-arrows-meaning-something-precise, it's a diagram. If the figure is a visual *atmosphere* around a concept, it's an illustration.

## Worked example shape

A blog post on background jobs, three section headers:

1. **"How jobs are picked up"** — a queue of jobs flowing into a worker pool. Five rectangles in a vertical stack, one peeling off to a worker box. 720×320, flat fills, 1.5–2px strokes.
2. **"Retry with backoff"** — a horizontal timeline with four retry markers, gaps doubling (+1s, +2s, +4s, +8s). Same canvas size, same palette.
3. **"Batch and parallel work"** — a parent job fanning out to N shards, then merging. Boxes and arrows, fan-out / fan-in shape.

Each one is a self-contained `<svg>` block in its own card. Below each: a "Download SVG" button that copies the SVG source to the clipboard, or a download link if the user prefers a file. A palette legend appears once at the bottom of the page so the author can verify all three illustrations are in-system.

## Layout primitives

- **Figure sheet grid**: `.grid-1` for full-width hero figures, `.grid-2` for paired diagrams the reader compares side-by-side. Each figure in its own `.card` with a clear h3 caption above and a 1-sentence intent line below ("For 'How jobs are picked up' — intro page header.").
- **Consistent canvas dimensions** across the whole sheet. Most editorial contexts want a single header size (Thariq's example uses 720×320; substack uses ~1456×816 for the header image, ~720×360 inline). Pick one and stick to it across the sheet — varying sizes look like the figures came from different artists.
- **Palette legend** at the bottom: the swatches used, with hex codes and the design-system tokens they map to. The author copies the SVG out and *will* edit it; the legend keeps their edits in-system.
- **"Download SVG" affordance** per figure: a small clay-bordered button under each `<svg>` that either (a) copies the SVG source to clipboard, or (b) triggers a `<a download>` of a Blob. Both work; clipboard is friendlier for "paste into the markdown editor."
- **Annotation labels inside the SVG** in the design-system mono font, small size (10–11px). Avoid label crowding — illustrations with ten labels are diagrams in disguise.

## SVG authoring conventions

These are the rules that keep illustrations *feeling like illustrations*, not diagrams:

- **Flat fills, no gradients.** A flat olive rectangle is an illustration; a gradient-filled rectangle is a UI screenshot. Stay flat.
- **1.5–2px strokes, never thinner.** Lines below 1.5px disappear at typical reading-zoom. Lines above 2px feel cartoonish.
- **Rounded corners on rect/path joins.** Set `stroke-linejoin="round"` and `stroke-linecap="round"` on the `<svg>` root. Sharp corners read as "technical figure."
- **Limit to ~6 shapes per figure.** Header illustrations are decorative, not informative. If you're at 12 shapes, you're drawing a diagram — split it out or simplify ruthlessly.
- **One accent color per figure.** Clay (`#D97757`) on most strokes; the rest is ivory / paper / oat / olive / slate from the design-system tokens. Avoid using multiple saturated colors in one illustration — it fights the editorial restraint.
- **Hand-rolled, not generative.** Resist the urge to script the SVG with for-loops. Hand-positioned shapes have personality; programmatically-spaced ones look like Visio.
- **`viewBox` not `width`/`height` attributes.** Lets the figure scale into whatever container the author drops it into. Set `viewBox="0 0 720 320"` and let CSS control display size.
- **Inline `<text>` in the design-system font stack.** `font-family="ui-serif, Georgia, serif"` for emphatic labels; `font-family="ui-monospace, monospace"` for technical labels (time markers, IDs, code-shaped strings). Never web fonts in an SVG you're handing off — they won't render outside this skill's context.

## The export-button discipline

The figure sheet is throwaway; the SVGs are the deliverable. Treat the export like the export in `custom-editor.md`:

- **One button per figure**, labeled "Download SVG" or "Copy SVG." Sticky-positioned under the figure card, not in a global header — the user wants to grab one at a time.
- **Strip the surrounding HTML.** The export should be the `<svg>...</svg>` block alone, no card wrapper, no caption, no design-system CSS. The author pastes it into their CMS / markdown / Notion and it should render standalone.
- **No script tags in the export.** If a figure has hover affordances on the page, the export strips them — the SVG must work in a context that disallows JS.
- **Flash confirmation.** Same as custom-editor: 1.2s olive "Copied" state on the button.

## Common pitfalls

- **Diagram drift.** You start with "three flat header illustrations" and end with three multi-label flowcharts. Re-read the rules above. If a figure has more than 6 shapes, it's a diagram — use `explore-html`'s `references/diagrams.md`.
- **Generic stock-illustration vibe.** Three figures of "people pointing at laptops" is not editorial illustration; it's clip-art. The figures should have *opinion* — a specific shape that earns its place next to the prose.
- **Different palettes across the set.** Each figure pulls one accent color from its own corner of the rainbow. The reader sees the post as visually noisy. Lock the palette to the design-system tokens and pick *one* accent across the sheet.
- **Untested at small sizes.** The author will sometimes drop a figure inline at 200px wide. If your strokes vanish at that size, the figure is broken in the wild. Test by setting the figure's CSS `width: 200px` and verifying it still reads.
- **Hand-off without the palette legend.** The author edits one illustration, gets the color wrong, ships it. The legend at the bottom of the sheet is the one piece of metadata that prevents this.
- **Decorative TLAs.** Labels like "GHA" and "K8s" inside header illustrations look technical but tell the reader nothing they don't already know from the prose. Strip them — or move the figure to a proper diagram (see `explore-html`'s `references/diagrams.md`).

## Data needs

Often none. The illustrations exist to decorate concepts the prose already explains. Don't hunt for "real data" to put inside a header illustration — that's a sign the figure should be a chart or diagram instead.

The one exception: if the figure is a hero for a section whose data the reader will see later (e.g., a small inline chart showing the *shape* of the data, before the full chart appears below), then pull the real shape and abstract it down to ~6 shapes. Even then, the figure is decorative; the full chart is the analytical piece.

## Reference primitives from `assets/template.html` and `components.css`

- `.card` per figure, with the h3 caption styled as an editorial figure caption
- `.eyebrow` above each card for the section name the figure illustrates
- `.scoreline` (or a tight inline row) for the figure's intent line ("For 'How jobs are picked up' — intro page header")
- A custom small button under each figure for export — style as `.btn` with clay border, white background, 11px mono label
- Inline SVG, no external symbol libraries — every shape hand-rolled in the figure
- The palette legend at the bottom: 6–8 `.swatch` boxes in a row, each labeled with hex and token name

## Quality bar specific to this category

Beyond the standard explore-notebook quality bar:

- **Each SVG, copy-pasted alone into a blank HTML file, renders correctly.** This is the canonical test. If the figure depends on the design system's CSS to look right, the export will break in the wild.
- **The palette across all figures uses ≤6 distinct colors.** Count them. More than 6 means visual noise across the set.
- **No figure exceeds 6 shapes** (where shape = one `<path>`, `<rect>`, `<circle>`, or `<polygon>`; `<g>` groups don't count, `<text>` doesn't count). If you exceed, simplify or split.
- **Every figure has a caption explaining what it illustrates.** "Queue" is not enough; "For 'How jobs are picked up' — intro page header" is. The author should be able to read the sheet and know which figure goes where.
- **All figures use the same canvas size.** Mixing 720×320 and 800×450 is sloppy; consistency is the value the sheet adds over generating figures one at a time.
