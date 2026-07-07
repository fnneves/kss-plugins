---
description: Extract durable insights from LOG.md and milestone notes and route each to its home (CANONICAL-KB.md or the `.kss/codebase/` map files) — the rot-prevention pass. Use when the user wants to clean up notes, summarize recent learnings, pull out patterns, ask "what have I learned", or do periodic knowledge consolidation.
---

# distill

The rot-prevention mechanism. Reads recent session work and pulls out what's *durable* — surprises, patterns, gotchas, broadly applicable decisions, structure facts, domain terms — and routes each to its correct home (`.kss/CANONICAL-KB.md`, `.kss/codebase/CONVENTIONS.md`, `.kss/codebase/STRUCTURE.md`, or `.kss/codebase/VOCABULARY.md`). Optionally archives or deletes the source notes after.

## Pre-flight

1. **Refuse if `.kss/` is missing.**

2. **Lazy-create `.kss/CANONICAL-KB.md` if missing** (should exist post-scaffold, but don't refuse over it) — use the `scaffold-project` template: frontmatter + Insights / Patterns / Gotchas sections. Same lazy-create discipline as the VOCABULARY and `## Learned` destinations.

3. **Soft-fail if no active topic** — read `active_topic` from `.kss/PROJECT.md` frontmatter. If it's `null`, ask which topic to distill, or distill across all active topics. When enumerating "all active topics", read the `## Topics` list in `.kss/PROJECT.md` and **exclude any topic whose `TOPIC.md` frontmatter has `status: archived`** (archived topics also live under `## Archived Topics`).

## Inputs

- **Scope** (optional, asked if not given):
  - `--milestone` (default if active) — distill the active or just-closed milestone's notes + LOG entries since milestone start.
  - `--last-N-sessions <N>` — distill the last N LOG entries.
  - `--whole-topic` — distill everything in topic LOG.md + all milestone notes.
- **`--prune`** (optional flag) — after distillation, ask whether to delete or move source notes that have been distilled.

## Process

1. **Determine scope.**
   - Default: active milestone's notes + LOG entries written during that milestone.
   - If user requests broader, expand accordingly.

2. **Read the source material.**
   - Topic `LOG.md` entries in scope.
   - All `note-*.md` files in scope's milestone folder(s).
   - Topic `TOPIC.md` "Key Decisions" (for cross-checking — don't double-record).

3. **Identify durable insights — and tag each with its destination.** Pull out things that match these categories. **Skip** routine implementation details. Every candidate belongs to exactly one of four destinations (see the matrix in step 4); recognize the destination as you pull it.

   Bound for **`CANONICAL-KB.md`** (prose — surprises, postmortems, vendor gotchas, cross-topic learnings):
   - **Surprises:** "X turned out to behave differently than expected" — learnings worth remembering. → Insights.
   - **Cross-topic decisions:** decisions whose rationale applies beyond the current milestone. → Insights.
   - **Postmortem learnings:** what broke + why + how it was fixed. → Insights.
   - **API / library / vendor gotchas:** vendor behavior worth recording (Kalshi WS quirks, Polymarket auth nuances, etc.). → Gotchas.

   Bound for **`.kss/codebase/CONVENTIONS.md`** (repeatable code/analysis patterns specific to *this* codebase):
   - **Patterns:** a repeatable code or analysis approach you'll reach for again ("always paginate Kalshi fills with `cursor`, never `offset`").
   - **Anti-patterns:** an approach that looks reasonable but breaks something here, worth a standing warning.

   Bound for **`.kss/codebase/STRUCTURE.md`** (schema / layout / "where X lives" facts):
   - **Structure facts:** durable facts about where things live or how data is shaped ("ingest writes to `raw_fills`, then a cron materializes `daily_pnl`"; "auth tokens are cached under `~/.cache/stratkit/`").

   Bound for **`.kss/codebase/VOCABULARY.md`** (domain terms):
   - **Vocabulary candidates:** terms that got defined or clarified in scope (e.g., "we started calling X 'materialization cascade' in note-20260507", "decided 'topic' means kss-topic, not the React component").

   What to **skip**:
   - "Wired up endpoint X" → routine work.
   - "Fixed typo in component Y" → no learning.
   - "Implemented task per plan" → not insight.
   - Anything already in `TOPIC.md` Key Decisions or CANONICAL-KB.
   - Terms already in `.kss/codebase/VOCABULARY.md` (case-insensitive match).
   - Patterns/structure-facts already present in `.kss/codebase/CONVENTIONS.md` / `STRUCTURE.md` (check both the auto-generated body and the `## Learned` section).

4. **Show the candidate insights to the user — destination per candidate.** This stays a human walk: you propose, the user decides keep/drop *and* confirms the destination. Order: CANONICAL-KB prose first (Surprises / Cross-topic / Postmortems / vendor Gotchas), then CONVENTIONS patterns, then STRUCTURE facts, then VOCABULARY terms last as a "while we're here" pass.
   - "I found {N} candidates: {a} for CANONICAL-KB, {b} for CONVENTIONS, {c} for STRUCTURE, {v} vocabulary terms. Walk through each? (yes / show all / cherry-pick)"
   - For each candidate, show its proposed **destination** alongside the text, e.g. `→ codebase/STRUCTURE.md (Learned)`. Confirm, re-route, or edit before writing. A candidate the user re-routes goes to the destination *they* pick.

   The four-way destination matrix (each insight lands in exactly one — never split, never crossed):

   | Insight type | Destination | Section |
   |---|---|---|
   | Surprises / postmortems / cross-topic learnings | `.kss/CANONICAL-KB.md` | Insights |
   | Library / vendor gotchas | `.kss/CANONICAL-KB.md` | Gotchas |
   | Repeatable code/analysis patterns, anti-patterns | `.kss/codebase/CONVENTIONS.md` | `## Learned (append-only — preserved across map-codebase runs)` |
   | Schema / structure / "where X lives" facts | `.kss/codebase/STRUCTURE.md` | `## Learned (append-only — preserved across map-codebase runs)` |
   | Domain terms | `.kss/codebase/VOCABULARY.md` | (glossary body) |

5. **Write the kept CANONICAL-KB candidates to `.kss/CANONICAL-KB.md`** in the appropriate section.

   - **Insights** → surprises, postmortems, cross-topic learnings.
   - **Gotchas** → library/vendor behavior that bit you, will bite again.

   Use the entry template below. **Newest-on-top within each section.** (Repeatable code/analysis patterns no longer land here — they route to `CONVENTIONS.md` in step 5c. CANONICAL-KB's pre-existing Patterns section, if present, is left untouched.)

5b. **Write the kept vocabulary candidates to `.kss/codebase/VOCABULARY.md`.**
   - If the file doesn't exist, create it lazily with frontmatter + the standard intro paragraph from the `map-codebase` template.
   - **Append-only.** Never edit or remove existing entries — even if a new candidate refines an old term, keep both and let the user reconcile manually.
   - Use the same `### {term}` template as `map-codebase`. Mark `**Source:**` as `distill: {topic}/{milestone-slug or session-date}`.

5c. **Write the kept pattern + structure candidates to `.kss/codebase/CONVENTIONS.md` and `.kss/codebase/STRUCTURE.md`.** Both follow the *same* append-only model as VOCABULARY:
   - Write each candidate into the **`## Learned (append-only — preserved across map-codebase runs)`** section of its destination file — patterns/anti-patterns → `CONVENTIONS.md`, structure/"where X lives" facts → `STRUCTURE.md`.
   - **Lazy-create the section.** If the file has no `## Learned (append-only — preserved across map-codebase runs)` heading, append the heading at the bottom of the file (above the `*Refreshed by map-codebase*` footer line if one exists), then add the entry under it. If the file itself is missing, create it lazily with frontmatter from the `map-codebase` template plus the `## Learned` section.
   - **Append-only.** Never edit or remove existing entries in the `## Learned` section (or anywhere else in the file). Newest-on-top within the section.
   - Use the `## Learned`-section entry template below. Mark `**Source:**` as `distill: {topic}/{milestone-slug or session-date}` — identical format to VOCABULARY.
   - ⚠ The `## Learned` heading string must match **verbatim** what `map-codebase` looks for, or your entries get wiped on the next remap.

6. **Bump `last_updated`** in CANONICAL-KB.md and, for each codebase file written (VOCABULARY / CONVENTIONS / STRUCTURE), its frontmatter.

7. **Optionally prune.**
   - If `--prune` flag was set, or if user opts in:
     - For each note file whose content was distilled, ask: "Delete `{path}`? (its insights are now routed to CANONICAL-KB / codebase files)"
     - On yes: delete the file.
     - For LOG entries: don't delete (LOG is append-only history); the LOG entry stays as a breadcrumb pointing at the (now-deleted) note.

8. **Tell the user.**
   - "{a} insights to CANONICAL-KB, {b} patterns to CONVENTIONS, {c} structure facts to STRUCTURE, {v} vocabulary terms to VOCABULARY. {M} notes pruned."

9. **Do not commit.**

## Template: CANONICAL-KB.md entry

Insert under the appropriate section (Insights / Gotchas), at the **top** of that section.

```markdown
### {YYYY-MM-DD} — {one-line title}

**Source:** {topic-slug} / {milestone-slug or session-date}
**What:** {1-2 sentences — the durable insight}
**Why it matters:** {when this is relevant for future-you}
{optional} **Reference:** `{path-to-source-note-if-still-exists}`
```

## Template: `## Learned` section + entry (CONVENTIONS.md / STRUCTURE.md)

The section heading is **fixed** and must be byte-identical in both files (and to what `map-codebase` preserves):

```markdown
## Learned (append-only — preserved across map-codebase runs)

### {YYYY-MM-DD} — {one-line title}

**Source:** distill: {topic}/{milestone-slug or session-date}
**What:** {1-2 sentences — the pattern, anti-pattern, or structure fact}
{optional} **Reference:** `{path-to-source-note-if-still-exists}`
```

Lazy-create the `## Learned (append-only — preserved across map-codebase runs)` heading once if absent; thereafter append entries newest-on-top *under* the existing heading.

## Conventions

- **Skip the routine.** If an insight reads like a sentence from a tutorial, it's not durable — drop it. Insights should be specific to *this codebase* or *this domain*.
- **Four destinations, never crossed.** Each insight has exactly one home: prose surprises/postmortems/cross-topic learnings and vendor gotchas → `CANONICAL-KB.md`; repeatable code/analysis patterns and anti-patterns → `codebase/CONVENTIONS.md`; schema / layout / "where X lives" facts → `codebase/STRUCTURE.md`; domain terms → `codebase/VOCABULARY.md`. Never mix — a vocabulary term in CANONICAL-KB rots; a paragraph of prose in VOCABULARY clutters the glossary; a surprise filed as a convention loses its "why"; a structure fact in CANONICAL-KB drifts the moment the layout changes. When unsure, ask the user which home (step 4); don't dump into CANONICAL-KB as a catch-all.
- **Codebase files: append into the `## Learned` fence only.** Distilled patterns/structure facts go *exclusively* under `## Learned (append-only — preserved across map-codebase runs)` in CONVENTIONS.md / STRUCTURE.md — never into the auto-generated body, which `map-codebase` overwrites. The fence is the only part `map-codebase` carries across runs.
- **VOCABULARY / CONVENTIONS / STRUCTURE are append-only from this skill.** Even if a new candidate clarifies an existing entry, append rather than edit. The user reconciles manually.
- **Newest-on-top per section.** So when you skim CANONICAL-KB.md (or a `## Learned` fence) to remember stuff, recent learnings are first.
- **Don't auto-prune without confirming.** Asking per-file is the right friction — it forces a "do I really not need this anymore" check.
- **Distillation is *additive*.** Never edit existing entries in any destination during distill — only add. If an old entry is stale or wrong, fix it in a separate manual pass.
- **Run `distill` at natural boundaries.** Before `complete-milestone` is the best time. Also: when LOG.md is feeling crowded, before `--archive-topic`, or any time the notes folder of a milestone has accumulated > 3 files.
