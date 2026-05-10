---
name: explore-html
description: Build a single-file interactive HTML page to explore a topic, compare options, surface data visually, or manipulate state and export the result. Trigger whenever the user asks to "explore", "understand visually", "compare side-by-side", "play with the variables", "see the trade-offs", "visualize", asks for "a report", "a diagram", "diagrams", "a kanban board", "a triage board", "slides", "a deck", or wants to compare "code approaches", "implementation options", "code suggestions", or "candidate solutions". Also trigger when the user explicitly asks for an HTML page, an interactive page, "an explorer", or an editor (kanban, flag editor, prompt tuner) that exports back to markdown/JSON. Use this skill PROACTIVELY when the topic at hand is spatial, comparative, parameterised, or has more than one viable answer that benefits from being seen next to the others — even if the user did not explicitly request HTML. Always confirm format (HTML vs markdown) and destination path before drafting — see §2.
---

# explore-html

When the user wants to *understand* something — a problem space, an API surface, three implementation options, a data shape — a single self-contained `.html` file is often a better deliverable than a markdown wall.

The premise (after Thariq's *Unreasonable Effectiveness of HTML*): the artifact you'd rather read is the artifact that gets read. Spatial information, comparison, and "what changes when I change this" are exactly what HTML/CSS/JS does and markdown does not.

This skill triggers when there's a topic to explore. It produces one HTML file the user opens in a browser, plays with, and either keeps or throws away.

## When to use this skill

**Reach for it when:**

- The user wants to compare 2+ options, fixtures, designs, approaches, or data points side-by-side
- The information is structural or spatial (API surface, module map, decision matrix, before/after diff)
- The user wants to *interact* — toggle variants, slide a parameter, type input and see output
- You'd otherwise produce a long markdown document with multiple sections the user has to mentally cross-reference
- The user said "explore", "play with", "see", "compare", "what if", "show me side-by-side", "I want to understand visually"

**Do NOT reach for it when:**

- The user asked a simple factual question
- The deliverable is code that ships into a real codebase (use the existing edit/write workflow)
- The user explicitly asked for prose, a summary, or a plan document
- The work is already in a structured kss artifact (PLAN.md, SUMMARY.md, CANONICAL-KB.md) and the user wants to *read* it, not explore it
- A static screenshot or table would communicate the same thing in 10 seconds

When in doubt, ask. One short clarifying question beats a 60KB HTML file the user didn't want.

## The four categories you'll most often build for

This skill is scoped to four work types. Each implies a different artifact shape. Pick deliberately — the shape is half the value.

| Category | Use when | Pattern lives in |
|---|---|---|
| **Exploration & Planning** | User has a question with multiple viable answers; wants to see them next to each other | `references/exploration.md` |
| **Research & Learning** | Topic has structure to teach (API surface, problem mechanism, decision tree); user wants to *understand*, not act | `references/research.md` |
| **Reports** | Snapshot of state at a point in time (status, audit, comparison of "what we use vs. what's available") | `references/reports.md` |
| **Code Review & Understanding** | Surface a code-shape, diff, or call-graph the user has to reason about spatially | `references/code-review.md` |

The four categories are scoping buckets — they answer "what kind of work is this?" The named patterns below answer "what does the artifact look like?" Most requests pair one category with one pattern.

## Named page patterns

Within each category, a handful of recurring page shapes show up over and over. When the user's request matches one, you don't need to invent the layout — these have battle-tested recipes.

| Pattern | When the request matches | Recipe in |
|---|---|---|
| **Comparison cards** | "compare 2-3 approaches", "side-by-side", "what are my options" — equal-weight column tiles, best for non-code comparisons | `references/exploration.md` |
| **Code comparison (vertical stack)** | "compare these code approaches", "show me 3 implementation options", "side-by-side code with pro/con" — full-width stacked articles with syntax-highlighted code, pro/con grid, chips, and explicit recommendation aside | `references/exploration.md` |
| **Concept explainer** | "teach me how X works", "explain the algorithm" — interactive sliders + live SVG | `references/research.md` |
| **API / surface tour** | "what's in this response", "what fields are we using", "show me the surface area" | `references/research.md` |
| **Status report** | "weekly", "status update", "where are we", "what shipped this sprint" — headline + stat strip + sections | `references/reports.md` |
| **Incident / post-mortem** | "what went wrong", "timeline of the outage", "what we learned" | `references/reports.md` |
| **Code walkthrough** | "trace this through the codebase", "how does auth flow", "show me the call path" — numbered steps + collapsible source + sticky gotchas aside | `references/code-review.md` |
| **Annotated PR / diff** | "review this PR", "what does this change actually do" — diff hunks + margin notes | `references/code-review.md` |
| **Slide deck** | "make me slides", "I have to present this", "demo deck" — scroll-snap slides + arrow-key nav | `references/decks.md` |
| **Annotated flowchart** | "draw the pipeline", "what happens when X", "the deploy flow" — vertical SVG flowchart with click-to-deepen detail panel | `references/diagrams.md` |
| **SVG figure sheet** | "I need a diagram I can reuse", "draw a couple of illustrations" — captioned figures with download-SVG buttons; the page is a palette | `references/diagrams.md` |
| **Triage / kanban board (editor)** | "kanban for these tickets", "drag-to-prioritize", "let me sort these into now/next/later", "scope this milestone" — 4-column drag-and-drop board with copy-as-markdown export. Page is a scratchpad; the markdown is the artifact. Great for backlog grooming, milestone scoping, spike priority. | `references/editors.md` |

**Unsure which pattern fits, or the user wants alternatives?** Browse `references/inspiration.md` — it indexes Thariq's 20+ example pages by pattern. Surface 2-3 candidates and ask which direction. Use the local references above as the recipe; use Thariq's pages as visual reference and discovery.

## How to run the skill

### 1. Capture the topic

Before writing one byte of HTML, surface what's actually being explored. Often this is implicit in the conversation. If not:

- What's the question or topic?
- What are the inputs (data, options, fixtures)? Are they real or made-up?
- What does the user need to *see* or *toggle* to learn what they want to learn?
- What's the success criterion — what understanding should the user walk away with?

If real data is available (API responses, file contents, codebase facts), **fetch or read it first** before drafting. A page built on real data is dramatically more useful than one built on plausible-looking placeholders. See `references/real-data.md` for capture patterns.

### 2. Confirm format and destination

Unless the user already named both in their message, ask before drafting:

- **"Do you want this as an HTML page, or as markdown / prose?"** — if they want prose, fall through to a normal text response. Don't quietly produce a 60KB file when a paragraph would have done.
- **"Where should I save it?"** — if they don't care, default to `/tmp/explorer-<slug>.html` (throwaway by design — tell them it's at `/tmp` so they don't expect it to persist). Common persistent locations: `.kss/topics/<topic>/explorers/`, `docs/`, repo root.

Skip the format ask if the user explicitly asked for an HTML page, an explorer, a diagram, an interactive page, etc. — they've already answered. Skip the path ask only if the user named a path explicitly; otherwise always ask (and accept "wherever" / "don't care" → `/tmp/`).

The destination matters for what libraries you can load: `/tmp/` artifacts may pull from CDN freely; persistent artifacts must be offline-safe (vanilla JS or vendored libraries). Full policy in §4.

If the page will read real data from a JSON snapshot, write the snapshot next to the HTML and load via `<script src="...">` (works under `file://`; `fetch()` does not).

### 3. Pick the category and read its pattern reference

One of the four. If unsure, ask. Each reference file has:
- A worked example you can lift from
- The standard layout primitives for that category
- Common pitfalls

### 4. Draft the HTML

One file. Inline `<style>` and `<script>`. No build step. CDN policy is tiered by destination: `/tmp/` throwaways may pull from CDN freely (richer output, used now and closed); anything saved to `.planning/`, `docs/`, or the repo must be offline-safe so it still opens on a plane in six months — either pure vanilla, or vendor the library inline. See `assets/template.html` for the starting skeleton: editorial-paper design language (see below), the layout primitives (grid, card, pill, table.fields), and the dataset bootstrap pattern. See "Rich libraries" below for what to reach for when vanilla isn't enough.

**Default design language: editorial-paper.** Pages built with this skill use a warm light palette (ivory `#FAF9F5` background, slate `#141413` text, clay `#D97757` accent), a three-font system (serif headings, sans body, mono for metadata/code), and editorial conventions (numbered section indices in the accent color, pill-shaped navigation, generous whitespace, hairline borders rather than heavy boxes). This matches the source-of-inspiration pages the skill is modelled on and produces artifacts that read as documents rather than dashboards. **Do not default to dark-theme dashboard styling.** That visual language signals "control panel" and undersells the page. If the user explicitly asks for dark mode, fine; otherwise, use the editorial-paper system.

The full palette and font-stack live in `assets/template.html` as CSS custom properties (`--ivory`, `--clay`, `--slate`, `--g100..g700`, `--serif`, `--sans`, `--mono`). Lift them; do not invent your own palette.

Quality bar (don't ship below this):
- Opens cleanly in a browser via `file://`
- Reads on a 1280px laptop screen without horizontal scroll
- One clear thing the user should look at first, above the fold
- Interactive elements actually work (toggles, inputs, selectors all wire to live recompute)
- No console errors
- Fonts/colors are deliberate, not random

### 5. Verify before reporting done

Open the file mentally — walk through it top to bottom and ask: "If I'd never seen this conversation, would I understand the topic?" If no, you're missing context the user already has but the page assumes. Add it.

For pages with data: re-check the data hasn't been silently truncated or scrambled by JS-string escaping. A 5-second sanity check (`grep` a key value in the saved file) saves a 30-second round trip.

### 6. Hand off

Tell the user:
- Path to the file
- One sentence on what the page is for
- 2-3 specific things to try in it (which preset to start on, which toggle reveals the surprise, which tab shows the comparison)
- Whether you want feedback on the page itself or whether the page is supposed to enable a downstream decision

Do not write a long summary of the page's contents — the page is the summary.

## Techniques before libraries

The pages on Thariq's site that inspired this skill use **zero CDN libraries**. The visuals come from a small set of hand-authored primitives, all covered in the references:

- **Hand-positioned inline SVG** for diagrams, flowcharts, illustrations, and small charts — see `references/diagrams.md`. Three colored marker-arrowheads in `<defs>` carry "kinds of edges" (neutral / fail / healthy).
- **`<details>/<summary>`** for collapsible source blocks and progressive disclosure — see `references/code-review.md`. Native HTML, custom rotating chevron, mutually-exclusive open state via 8 lines of vanilla JS.
- **Sticky-aside two-column layout** for "notes that stay visible while you scroll the main column" — see `references/code-review.md` and `references/diagrams.md`. One CSS grid + `position: sticky`.
- **Manual syntax highlighting** via `<span class="kw|str|dim">` — see `references/code-review.md`. Three classes; semantic highlighting beats tokenwise.
- **Scroll-snap slide decks** with arrow-key nav + IntersectionObserver counter — see `references/decks.md`. ~30 lines of vanilla JS; no Reveal.js.
- **Step + numbered badge** walkthroughs — see `references/code-review.md`. CSS grid, one circle, one number.
- **Hand-drawn SVG bar charts** for status reports — see `references/reports.md`. Explicit `<rect>` per bar, peak in clay, the rest in oat.

Reach for these primitives first. The library matrix below is for the cases vanilla genuinely can't reach: real charts (faceted scatter, large data), math typesetting, 3D, in-browser compute.

## Rich libraries (for `/tmp/` throwaways)

Vanilla JS + the template primitives cover most explorers. When the topic genuinely needs more — real charts, 3D, math, components, in-browser compute — reach for one of these. All are single `<script>` or ESM imports; no build step. Use only in `/tmp/` artifacts (CDN-dependent) unless you're prepared to vendor the file.

| Need | Reach for | One-liner |
|---|---|---|
| Real charts (scatter, line, faceted) | Observable Plot | `<script src="https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6"></script>` |
| Lower-level data viz, custom shapes | D3 | `<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>` |
| 3D / WebGL | Three.js | `<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js"}}</script>` |
| Math typesetting | KaTeX | `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css"><script src="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.js"></script>` |
| Auto-laid-out graphs (ER, sequence, 20+ nodes) | Mermaid | `<script type="module">import m from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs'; m.initialize({startOnLoad:true,theme:'neutral'});</script>` |
| Audio / synthesis | Tone.js | `<script src="https://cdn.jsdelivr.net/npm/tone@14"></script>` |
| Run Python in the browser | Pyodide | `<script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"></script>` |
| Components without a build step (default) | **htm + Preact** via esm.sh | `<script type="module">import { html, render } from 'https://esm.sh/htm/preact'; import { useState } from 'https://esm.sh/preact/hooks';</script>` |
| Literal JSX (only if htm syntax is awkward) | React + Babel standalone | `<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script><script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script><script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>` then `<script type="text/babel">…</script>` |

**Picking between htm+Preact and Babel-standalone:** prefer htm+Preact. Babel-standalone ships ~3MB of compiler to the browser and re-parses on every reload — fine for a 50-line demo, painful past that. Only use it when the explorer is genuinely tiny *and* the user wants to read literal JSX.

**Mermaid is the auto-layout escape hatch, not the default for diagrams.** For editorial-style hand-positioned diagrams (≤15 nodes), prefer inline SVG — see `references/diagrams.md`. Mermaid is reserved for auto-layout cases where you'd rather not place nodes by hand (ER schemas, large sequence diagrams).

**When NOT to reach for these:** if the page is a static comparison or matrix, vanilla + the template primitives is faster to write, smaller, and offline. Don't pull D3 to render a 6-row table.

**If the deliverable needs to persist** (`.planning/`, `docs/`, repo): either drop back to vanilla, or download the library file (`curl -o lib.js https://...`) and `<script src="lib.js">` it as a sidecar so the bundle survives a CDN going dark.

## Iteration pattern

The user will often want changes after seeing the first draft. Expect this; the first draft is a probe, not a finished artifact. Common iteration shapes:

- "Add fixture X" → extend the dataset, rerun
- "What if we toggled Y" → add a new control, wire to recompute
- "Highlight where Z fails" → add visual emphasis (color, badge, dedicated panel)
- "Make it shorter / longer" → re-balance density vs. completeness
- "Save it to <path>" → move file, update any internal anchors

Edit the existing file rather than rewriting from scratch unless the structure has fundamentally shifted.

## What this skill does NOT do

- It does not ship code into the production codebase
- It does not produce design system docs that need to live in the repo (use the design-system pattern only for throwaway exploration)
- It does not solve the underlying problem; it surfaces the problem space so the user can think about it
- It does not write a plan document. If the user wants a PLAN.md after exploring, that's the kss planning workflow (`plan-milestone`), not this skill

## File layout

```
explore-html/
├── SKILL.md              ← this file
├── references/
│   ├── exploration.md    ← side-by-side option compare, decision matrices, fan-out
│   ├── research.md       ← teaching artifacts: API surface, problem mechanism, concept explainers
│   ├── reports.md        ← status reports, incident timelines, hand-drawn bar charts
│   ├── code-review.md    ← annotated diff, code walkthrough, module map, call-graph spatial views
│   ├── diagrams.md       ← inline SVG fundamentals, annotated flowchart w/ detail panel, SVG figure sheet
│   ├── decks.md          ← scroll-snap slide deck w/ arrow-key nav + slide counter
│   ├── editors.md        ← manipulable boards (kanban triage, etc.) — drag + filter + copy-as-markdown export
│   ├── inspiration.md    ← curated index of Thariq's 20+ example pages — browse when unsure or for alternatives
│   └── real-data.md      ← capturing real API/file data into a snapshot the page reads
└── assets/
    └── template.html     ← the starting skeleton — editorial-paper design language, layout primitives, JS bootstrap
```

Read the relevant references when you've picked a category and a pattern. Don't read all of them — they're independent. Start with the named-pattern reference; fall back to the category reference for shape guidance, and to `inspiration.md` when the user wants alternatives.
