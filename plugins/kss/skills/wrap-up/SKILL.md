---
description: Append a LOG entry, refresh STATE, optionally write a notes file — run at session end. Use when the user signals they're stopping, says "done for the day", "log this", "wrap up", "let's call it", or wants to record what just happened before ending the session.
---

# wrap-up

Persists the work done in this session. Appends a terse entry to topic LOG.md, refreshes the topic STATE.md and the `.kss/PROJECT.md` frontmatter stamps, and *optionally* writes a deep-dive note if the session warranted one. Most sessions don't.

## Pre-flight

1. **Refuse if `.kss/` is missing.**

2. **Refuse if no active topic** — read `active_topic` from `.kss/PROJECT.md` frontmatter.

3. **Warn (don't refuse) if no active milestone.**
   - "No active milestone — this session's work will log against the topic generally. Continue?"
   - If yes, LOG entry's `Milestone` field becomes `—`.

## Process

1. **Ask the user three quick questions.**
   - **What got done?** (1-3 lines, terse — this becomes the LOG entry "Did" field.)
   - **Any decisions worth recording?** (Append to `TOPIC.md` Key Decisions if yes. Skip if no.)
   - **Any seeds to capture?** (If yes, route to `capture` for each.)

2. **Update PLAN.md task statuses.**
   - Read active milestone's PLAN.md.
   - Show the task table.
   - Ask: "Which tasks moved this session? (e.g. `1 done, 2 in-progress`)"
   - Apply changes: ○ → ◆ or ✓.
   - Bump `last_updated` frontmatter.

3. **Detect "milestone looks done" → offer to close (SUGGEST-AND-CONFIRM).**
   - **Trigger:** after step 2, if *all* PLAN tasks are now `✓` — OR the step 1 "what got done?" answer indicates the milestone shipped/finished.
   - **Offer (default No):** `All tasks on {version}-{slug} are done — close the milestone now? [y/N]`
   - **On no (default):** continue wrap-up normally. Do not re-ask.
   - **On explicit yes:** hand into `complete-milestone`.
   - **Tasks-done is only the TRIGGER, not the gate.** `complete-milestone` still runs its own success-criteria interview (the real "did this ship?" gate) and writes `SUMMARY.md`. wrap-up does **not** skip, shortcut, or duplicate that walk — it only surfaces the offer at the natural moment. The remaining wrap-up steps (LOG entry, STATE refresh) still run regardless, recording this session.

4. **Decide on a notes file.**
   - Ask: "Was this session meaty enough to warrant a deep-dive note? (debugging session, architecture decision, weird interaction)"
   - Default = no.
   - **If yes:**
     - Ask for a slug (kebab-case, ≤4 words).
     - Write `.kss/topics/{topic}/milestones/{active-milestone}/note-{YYYYMMDD}-{slug}.md` with the user's content.
     - Reference the file in the LOG entry's `Notes` field.

5. **Append a LOG entry at the *top* of `.kss/topics/{topic}/LOG.md`.**
   - Use the template below. Newest-first, so insert above the most recent existing entry.

6. **Update topic `STATE.md`.**
   - `last_session: {YYYY-MM-DD}`.
   - `last_updated: {YYYY-MM-DD}`.
   - Body: rewrite "Current Position" to reflect end-of-session state. Update "Next Action" if it changed.
   - **Route each fact to the right section (AUTO-DO — segregation, not judgment, no confirm):**
     - **Durable position** → "Current Position". **Durable obstacles** → "Blockers".
     - **Time-sensitive environmental claims** → the `## Scratch (transient — re-verify next session, safe to wipe)` section. These rot overnight and are NOT durable position.
     - **Scan heuristic — phrases that signal transient, route to Scratch, never Blockers:** "is down" / "is up" / "is running" / "still failing" / "last write at {time}" / "recorders down" / "server on :{port}" / bare PIDs, ports, job-ids, or wall-clock timestamps tied to a process. If a "blocker" is really a momentary process/env state, it belongs under Scratch, not Blockers.
     - If the Scratch section is absent, create it under "Blockers" using the exact heading above. If there are no transient facts this session, leave/clear it.
   - If status was `planned` and any task moved to ◆ or ✓, bump status to `executing`.

7. **Update `.kss/PROJECT.md` frontmatter.**
   - `last_session: {YYYY-MM-DD}`.
   - `last_updated: {YYYY-MM-DD}`.

8. **Sanity check.**
   - If LOG.md is now > ~40 entries, suggest: "LOG.md has grown — consider running `distill` to extract durable insights to CANONICAL-KB.md."

9. **Do NOT commit.**
   - Tell the user: "Files updated. Commit when you're ready."

## Template: LOG entry (insert at top)

```markdown
## {YYYY-MM-DD} — {one-line topic of the session}

**Milestone:** {version}-{slug or "—"}
**Did:** {1-3 lines, terse}
**Tasks moved:** {e.g. "1 ✓, 2 ◆" or "—"}
**Notes:** {`note-YYYYMMDD-slug.md` if written, else "—"}
```

## Template: notes file (only when warranted)

```markdown
---
session: {YYYY-MM-DD}
milestone: {version}-{slug}
topic: {topic-slug}
slug: {slug}
---

# {one-line title}

## Context

{why this note exists — what made it worth writing up}

## Details

{the meat — debugging trace, decision rationale, architectural sketch, weird API behavior, etc.}

## Outcome

{what we ended up with}

## Followups

(if any — capture as seeds rather than leaving them here)
```

## Output

- New top-of-file LOG entry in topic's `LOG.md`.
- Topic `STATE.md` refreshed and `.kss/PROJECT.md` frontmatter refreshed (`last_session`, `last_updated`).
- Optional: a `note-*.md` file in the active milestone folder.
- Optional: a Key Decisions row added to `TOPIC.md`.
- Optional: seeds captured to `SEEDS.md`.

## Conventions

- **Default = no notes file.** This is the rot-prevention default — most sessions don't need a writeup. The LOG entry is the canonical record.
- **Notes are scoped to the active milestone.** When the milestone closes, the notes go with it (they live in the milestone folder).
- **Newest LOG entry on top.** Always. So `start-session` reads the recent stuff first.
- **Be terse in LOG.** Under 5 lines per entry. The detail goes in notes/ (when needed) or gets distilled to CANONICAL-KB later. Long LOG entries are an anti-pattern.
- **Detect-and-offer, never auto-close.** When all tasks land ✓, wrap-up *offers* to close (step 3) — it never fires `complete-milestone` on its own. The success-criteria interview stays human-authored; tasks-done is just the trigger that surfaces the offer.
- **Durable vs. transient STATE is segregation, not meaning.** Durable position/obstacles stay in "Current Position"/"Blockers"; environmental facts that rot (process up/down, ports, PIDs, last-write timestamps) go under `## Scratch (transient — re-verify next session, safe to wipe)`. This routing is AUTO-DO — no confirm — because it relabels location, not truth. The LOG entry still records that the transient fact happened.
- **Never auto-commit.** Carry-over from the original wrap-up rule. The user owns commit timing.
