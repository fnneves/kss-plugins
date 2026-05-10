---
description: Extract durable insights from LOG.md and milestone notes into CANONICAL-KB.md, and surface vocabulary candidates for `.kss/codebase/VOCABULARY.md` — the rot-prevention pass. Use when the user wants to clean up notes, summarize recent learnings, pull out patterns, ask "what have I learned", or do periodic knowledge consolidation.
---

# distill

The rot-prevention mechanism. Reads recent session work and pulls out what's *durable* — surprises, patterns, gotchas, broadly applicable decisions — into `.kss/CANONICAL-KB.md`. Optionally archives or deletes the source notes after.

## Pre-flight

1. **Refuse if `.kss/` is missing.**

2. **Refuse if `.kss/CANONICAL-KB.md` is missing.** (Should always exist post-scaffold.)

3. **Soft-fail if no active topic** — ask which topic to distill, or distill across all active topics.

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

3. **Identify durable insights.** Pull out things that match these categories. **Skip** routine implementation details.

   - **Surprises:** "X turned out to behave differently than expected" — gotchas worth remembering.
   - **Patterns:** repeatable approaches, gotchas, anti-patterns observed in this codebase.
   - **Cross-topic decisions:** decisions whose rationale applies beyond the current milestone.
   - **API / library quirks:** vendor behavior worth recording (Kalshi WS quirks, Polymarket auth nuances, etc.).
   - **Postmortem learnings:** what broke + why + how it was fixed.
   - **Vocabulary candidates:** terms that got defined or clarified in scope (e.g., "we started calling X 'materialization cascade' in note-20260507", "decided 'topic' means kss-topic, not the React component"). These don't go to CANONICAL-KB — they go to `.kss/codebase/VOCABULARY.md`.

   What to **skip**:
   - "Wired up endpoint X" → routine work.
   - "Fixed typo in component Y" → no learning.
   - "Implemented task per plan" → not insight.
   - Anything already in `TOPIC.md` Key Decisions or CANONICAL-KB.
   - Terms already in `.kss/codebase/VOCABULARY.md` (case-insensitive match).

4. **Show the candidate insights to the user.** Order: prose categories first (Surprises / Patterns / Cross-topic / API quirks / Postmortems), Vocabulary candidates last as a "while we're here" pass.
   - "I found {N} candidate insights and {V} vocabulary candidates. Walk through each? (yes / show all / cherry-pick)"
   - For each candidate: confirm or edit before writing.

5. **Write the kept prose insights to `.kss/CANONICAL-KB.md`** in the appropriate section.

   - **Insights** → things that are surprises or learnings.
   - **Patterns** → repeatable approaches.
   - **Gotchas** → things that bit you, will bite again.

   Use the entry template below. **Newest-on-top within each section.**

5b. **Write the kept vocabulary candidates to `.kss/codebase/VOCABULARY.md`.**
   - If the file doesn't exist, create it lazily with frontmatter + the standard intro paragraph from the `map-codebase` template.
   - **Append-only.** Never edit or remove existing entries — even if a new candidate refines an old term, keep both and let the user reconcile manually.
   - Use the same `### {term}` template as `map-codebase`. Mark `**Source:**` as `distill: {topic}/{milestone-slug or session-date}`.

6. **Bump `last_updated`** in CANONICAL-KB.md and (if vocab was written) VOCABULARY.md frontmatter.

7. **Optionally prune.**
   - If `--prune` flag was set, or if user opts in:
     - For each note file whose content was distilled, ask: "Delete `{path}`? (its insights live in CANONICAL-KB now)"
     - On yes: delete the file.
     - For LOG entries: don't delete (LOG is append-only history); the LOG entry stays as a breadcrumb pointing at the (now-deleted) note.

8. **Tell the user.**
   - "{N} insights distilled to CANONICAL-KB. {V} vocabulary terms added to `.kss/codebase/VOCABULARY.md`. {M} notes pruned."

9. **Do not commit.**

## Template: CANONICAL-KB.md entry

Insert under the appropriate section (Insights / Patterns / Gotchas), at the **top** of that section.

```markdown
### {YYYY-MM-DD} — {one-line title}

**Source:** {topic-slug} / {milestone-slug or session-date}
**What:** {1-2 sentences — the durable insight}
**Why it matters:** {when this is relevant for future-you}
{optional} **Reference:** `{path-to-source-note-if-still-exists}`
```

## Conventions

- **Skip the routine.** If an insight reads like a sentence from a tutorial, it's not durable — drop it. Insights should be specific to *this codebase* or *this domain*.
- **Two destinations, never crossed.** Prose insights go to `CANONICAL-KB.md`. Domain terms go to `.kss/codebase/VOCABULARY.md`. Never mix — a vocabulary term in CANONICAL-KB rots; a paragraph of prose in VOCABULARY clutters the glossary.
- **VOCABULARY is append-only from this skill.** Even if a new candidate clarifies an existing term, append rather than edit. The user reconciles manually.
- **Newest-on-top per section.** So when you skim CANONICAL-KB.md to remember stuff, recent learnings are first.
- **Don't auto-prune without confirming.** Asking per-file is the right friction — it forces a "do I really not need this anymore" check.
- **Distillation is *additive*.** Never edit existing CANONICAL-KB entries during distill — only add. If an old entry is stale or wrong, fix it in a separate manual pass.
- **Run `distill` at natural boundaries.** Before `complete-milestone` is the best time. Also: when LOG.md is feeling crowded, before `--archive-topic`, or any time the notes folder of a milestone has accumulated > 3 files.
