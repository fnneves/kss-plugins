# Changelog

All notable changes to plugins in this marketplace.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Each plugin tracks its own version (in `plugins/<plugin>/.claude-plugin/plugin.json`).

## [Unreleased]

## kss

### [0.3.0] - 2026-06-09

**Skills added:**
- `explore-notebook` — a *served*, interactive HTML notebook (Utilities layer); the iterate-over-many-rounds sibling of `explore-html`. Ships a bundled stdlib `serve.py` providing live-reload over SSE, a real LAN-reachable HTTP URL, and a two-way feedback surface: Alt-click element pins, an always-on chat panel, agent markdown replies (`reply.py`), and click-to-open articles (`article.py`). Markdown is rendered server-side via a vendored `markdown-it` tree (~2MB) so the skill works offline with no build step. Eight category references (exploration, research, reports, code-review, pr-writeup, implementation-plan, custom-editor, illustrations) plus interactive references (replies-and-articles, interactive-gotchas). Use `explore-html` for one-shot static pages; reach for `explore-notebook` when the work is iteration- or feedback-driven, or the page must be opened from another device.

**Adapted for plugin distribution:**
- Server-launch commands in `SKILL.md` and `references/replies-and-articles.md` now resolve via `$CLAUDE_PLUGIN_ROOT/skills/explore-notebook/server/…` instead of a hardcoded `~/.claude/skills/…` path, so the skill works when installed from the marketplace.
- Diagram guidance now points at the sibling `explore-html` skill's `references/diagrams.md` (the diagram playbook for the `explore-*` family) rather than an external `diagram-design` skill that isn't part of this plugin.
- Planning-workflow framing (was "GSD owns PLAN.md") reworded to kss terms (`plan-milestone`), kept graceful for non-kss repos.

**Layers:** Setup (2) · Lifecycle (3) · Session (3) · Knowledge (2) · Meta (1) · Utilities (2). Total 13 skills.

**Removed:**
- The gitignored in-repo `.claude/skills/` dogfood copy of `explore-html` — a stale duplicate of the plugin source and a drift hazard. Dogfood by installing this repo as a local marketplace instead. The `.gitignore` guard line is retained.

**Known gaps:**
- The HTML explainers under `plugins/kss/explainers/` still depict 12 skills / "Utilities (1)" and do not yet include `explore-notebook`. Regeneration of `01-kss-in-6-slides.html`, `03-skills-interaction.html`, and `index.html` is pending. The root README's explainer descriptions track that pending state.

### [0.2.0] - 2026-05-11

**Skills added:**
- `explore-html` — single-file interactive HTML artifact builder (Utilities layer). Patterns: side-by-side comparison cards, code comparison (vertical stack), concept explainers with live SVG, status reports with hand-drawn bar charts, incident timelines, code walkthroughs with collapsible source, annotated PRs/diffs, scroll-snap slide decks, annotated flowcharts with detail panel, SVG figure sheets, kanban-style triage editors with copy-as-markdown export. Triggers on phrases like "a report", "a diagram", "diagrams", "slides", "a deck", "kanban", "triage board", "code approaches", "implementation options", or explicit HTML requests. Always confirms format and destination path before drafting. Bundled with `references/inspiration.md` — a curated index of Thariq's example pages, used for discovery and alternatives.

**Skills reclassified:**
- `spike` moved from Exploration layer to Session layer. Exploration layer removed (was a 1-skill layer). Spike fires mid-session when an idea needs testing before commitment, which is the same lifecycle moment as start-session / wrap-up.

**Layers:** Setup (2) · Lifecycle (3) · Session (3) · Knowledge (2) · Meta (1) · Utilities (1). Total 12 skills.

**Documentation:**
- Added 4 interactive HTML explainers under `plugins/kss/explainers/`, served via GitHub Pages:
  - `01-kss-in-6-slides.html` — pitch deck with scroll-snap slides and ←/→ navigation.
  - `02-self-improvement-loop.html` — interactive concept explainer for `skill-autopsy`. Click-to-set timeline, `~/.kss-source` toggle that swaps the outcome path, 4-stage circuit diagram.
  - `03-skills-interaction.html` — data ownership graph for the 12 skills. Click a card to see what it writes/reads, downstream consumers, upstream feeders, and the failure mode it prevents.
  - `04-kss-filesystem.html` — surface tour of `.kss/` with status pills (identity / pointer / overwrite / append / marker / moved) and hover tooltips, plus reference cards for external paths and conventions.
- Added `plugins/kss/explainers/index.html` as the folder landing page.
- Added "Documentation" section to the marketplace README with live Pages URLs.

**Other:**
- Fixed `.gitignore` typo (`./claude/skills` → `.claude/skills/`) so the personal in-repo skill dogfood folder is properly excluded.

### [0.1.0] - 2026-05-10

Initial release.

**Skills:**
- `scaffold-project` — bootstrap `.kss/` shell.
- `map-codebase` — generate STACK / STRUCTURE / CONVENTIONS / VOCABULARY snapshot. VOCABULARY is append-only across runs.
- `new-topic` — create and activate a topic.
- `plan-milestone` — scope and plan a milestone in the active topic.
- `complete-milestone` — close a milestone (or archive a topic with `--archive-topic`).
- `start-session` — load context for active topic + milestone.
- `wrap-up` — append LOG entry, refresh STATE, optionally write a notes file.
- `capture` — drop a seed (with mandatory trigger), idea, or scratch note.
- `distill` — extract durable insights to CANONICAL-KB and surface vocabulary candidates.
- `spike` — throwaway exploration with verdict-driven outcome.
- `skill-autopsy` — postmortem any skill, propose SKILL.md improvements. Reports live at `~/kss-skill-reports/`. `~/.kss-source` is optional (controls whether consolidate-mode applies diffs to a writable source folder).
