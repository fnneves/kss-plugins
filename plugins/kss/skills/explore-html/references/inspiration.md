# Inspiration — Thariq's example pages

When you're not sure which named pattern fits a request, or when the user asks "what else could this look like", browse Thariq's index:

**https://thariqs.github.io/html-effectiveness/**

It hosts 20 example pages, each demonstrating a distinct page type. The local references in this skill (`exploration.md`, `research.md`, `reports.md`, `code-review.md`, `diagrams.md`, `decks.md`) are the **durable instruction set** — they encode the recipes we actually use and they don't go stale. Use Thariq's index for **discovery and alternatives**: "show me other shapes this could take", "is there a closer match than what we're considering", "what's an example of this pattern in the wild".

## The 20 pages, indexed by pattern

### Exploration & Planning
- **01 — Three code approaches** (`01-exploration-code-approaches.html`) — three side-by-side implementation directions with pros/cons
- **02 — Visual design directions** (`02-exploration-visual-designs.html`) — three UI design directions, equal-weight cards
- **16 — Implementation plan** (`16-implementation-plan.html`) — milestones on a timeline, data-flow diagram, mockups, risk table

### Code Review
- **03 — Annotated pull request** (`03-code-review-pr.html`) — file-by-file diff with margin notes
- **04 — Module map** (`04-code-understanding.html`) — request-path SVG flow + numbered callstack walkthrough with collapsible source + sticky gotchas aside
- **17 — PR writeup for reviewers** (`17-pr-writeup.html`) — the prose-and-evidence version for asynchronous review

### Design
- **05 — Living design system** (`05-design-system.html`) — tokens, components, usage patterns in one document
- **06 — Component variants** (`06-component-variants.html`) — every variant of one component, on one page

### Prototyping
- **07 — Animation sandbox** (`07-prototype-animation.html`) — tweak motion params, watch the result
- **08 — Clickable flow** (`08-prototype-interaction.html`) — wired-up screens, click through the journey

### Diagrams & Illustrations
- **10 — SVG figure sheet** (`10-svg-illustrations.html`) — captioned illustrations with download-SVG buttons; the page is a reusable asset library
- **13 — Annotated flowchart** (`13-flowchart-diagram.html`) — vertical pipeline with click-to-deepen detail panel

### Decks
- **09 — Arrow-key slide deck** (`09-slide-deck.html`) — scroll-snap slides, ←/→ nav, counter

### Research
- **14 — How a feature works** (`14-research-feature-explainer.html`) — narrative walkthrough of a feature's mechanics
- **15 — Concept explainer** (`15-research-concept-explainer.html`) — abstract concept with interactive sliders driving a live SVG (consistent hashing)

### Reports
- **11 — Weekly status** (`11-status-report.html`) — headline, shipped table, hand-drawn SVG bar chart with peak highlighted, carryover items
- **12 — Incident timeline** (`12-incident-report.html`) — postmortem with time-anchored events

### Custom Editors
- **18 — Ticket triage board** (`18-editor-triage-board.html`) — drag-style sorting UI for prioritization
- **19 — Feature flag editor** (`19-editor-feature-flags.html`) — toggle flags, see resulting config; export JSON back
- **20 — Prompt tuner** (`20-editor-prompt-tuner.html`) — edit a prompt with structured controls

## How to use this index

When the user says "I want a report / diagram / page about X" and you're unsure which named pattern is the best fit:

1. **Skim this file** to find the 1-2 patterns that match.
2. **Use the local reference** (e.g. `reports.md`) as the recipe — it's the durable source of truth.
3. **If you want to see a live example in detail**, you can `WebFetch` the specific URL above and read its structure.

When the user asks for alternatives ("what else could this look like?"), surface 2-3 patterns from this index and ask which direction.

The pages on the Thariq site are durable as long as GitHub Pages stays up. If a link goes stale, fall back to the local reference files — they encode the recipes independently of the upstream pages.
