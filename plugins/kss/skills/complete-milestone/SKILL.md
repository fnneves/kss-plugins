---
description: Close the active milestone — write SUMMARY.md, append to MILESTONES.md, reset state. Use `--archive-topic` to retire the whole topic. Use when the user says they shipped, finished, or are done with the current milestone, or wants to wrap up / close out / archive a topic.
---

# complete-milestone

Closes the active milestone. Writes a SUMMARY.md (the "shipped" marker), appends a one-paragraph entry to the topic's MILESTONES.md, and resets state. After closing, offers to archive the whole topic if it's fully done — `--archive-topic` is an explicit shortcut that skips straight to that offer.

## Pre-flight

1. **Refuse if `.kss/` is missing.**

2. **Refuse if no active topic.**

3. **Refuse if no active milestone.**
   - "No active milestone. Nothing to complete."

4. **Warn if any task in PLAN.md is still `◆ in-progress`.**
   - "Tasks still in progress: {list}. Continue closing anyway, or pause to finish them?"
   - If continue: log them as deferred in SUMMARY.md.

## Inputs

- `--archive-topic` (optional flag) — explicit shortcut. Skips straight to the archive offer after closing the milestone, for when you already know the topic's success bar has been met. Not required: a normal close always *offers* archive (step 8), so the flag is no longer something you must remember.

## Process

1. **Read context.**
   - The active milestone's `PLAN.md` (goal, success criteria, tasks).
   - Topic's `TOPIC.md`, `STATE.md`, `MILESTONES.md`.

2. **Walk success criteria with the user.**
   - For each `[ ]` in PLAN.md's Success Criteria, ask: "Did this pass? (yes / no / partial — note)"
   - If all yes → status `shipped`.
   - If any no → status `shipped-with-gaps` (still close, but document the gap explicitly).
   - If most no → consider whether to close at all. Suggest pausing instead.

3. **Capture decisions made during the milestone.**
   - "Any decisions worth pulling up to the topic's Key Decisions table? (rationale + outcome)"
   - For each one, append to `TOPIC.md` Key Decisions table.

4. **Capture deferred items.**
   - "Anything you discovered that's deferred to later? (will be logged as seeds)"
   - For each, write a SEEDS.md entry. **Demand a trigger condition** — same rule as `capture`.
   - **If a deferred item is handed off to ANOTHER or a FUTURE topic** (not this one), ALSO append a row to `.kss/PROJECT.md` under `## Carryover (cross-topic handoffs)` (lazy-create the section if missing — see template below). **Demand a trigger condition** here too — same rule as SEEDS, no exceptions. This is **AUTO-DO** (append-only), but **show the exact line written.**
     - `Source` = `{topic}/{milestone}` (the topic + milestone being closed).
     - `Target topic` = a known topic slug if the user names one, else `TBD`.
     - Confirm: "Carried over to PROJECT.md: `{the row}`."

5. **Write `SUMMARY.md`** in the milestone folder, using the template below.

6. **Append to topic's `MILESTONES.md`** at the **top** (newest-first):

   ```markdown
   ## {version} — {short-title} (shipped {YYYY-MM-DD})

   {1-2 line summary of what shipped}

   Archive: `milestones/{version}-{slug}/`
   ```

7. **Update topic's `STATE.md`.**
   - `status: between-milestones`.
   - `active_milestone: null` — this is the **single source of truth** for the active milestone; there is no project-level milestone pointer to clear.
   - Body: "Last shipped: {version}-{slug} on {date}. Run `plan-milestone` to scope the next."

8. **Offer to archive the topic (SUGGEST-AND-CONFIRM).**
   - **Offer (default = keep):** `Is {topic} fully done now — archive the whole topic, or keep going? [archive / keep]`
   - If `--archive-topic` was passed, skip straight to this offer's confirm (the flag means "I already know" — still show the archive-confirm below, never archive silently).
   - **On keep (default):** do nothing here; the topic stays active and between-milestones.
   - **On archive:**
     - First, ask: "Any deferred items handed off to a FUTURE topic? (will be logged to PROJECT.md `## Carryover`)" — for each, append a Carryover row exactly as in step 4 (Source = `{topic}/{milestone}`, **demand a trigger**, **show the line written**). This is **AUTO-DO** (append-only).
     - Confirm: "Archive the whole topic `{slug}`? This marks the topic archived (a `status: archived` flag) — the files stay in place at `.kss/topics/{slug}/`."
     - On yes (the archive is a **status flag, not a folder move** — see §4.8):
       - (a) Set `status: archived` in `.kss/topics/{slug}/TOPIC.md` frontmatter.
       - (b) In `PROJECT.md`, move the topic's row from `## Topics` to `## Archived Topics`, leaving a one-line breadcrumb, e.g. `- **{slug}** — {description} (archived {YYYY-MM-DD}; files at \`.kss/topics/{slug}/\`)`.
       - (c) Clear the project pointer: set `active_topic: null` in `PROJECT.md` frontmatter.
       - Do **not** move the directory — `.kss/topics/{slug}/` stays exactly where it is.

9. **Tell the user.**
    - If kept (not archived): "Milestone {version}-{slug} closed. Run `plan-milestone` for the next, or re-run `complete-milestone --archive-topic` if you decide this topic is fully done."
    - If archived: "Topic `{slug}` marked `status: archived` (files stay at `.kss/topics/{slug}/`). Run `new-topic` to start the next, or `start-session --switch-topic <other>` if you have another active topic."

10. **Suggest `distill`** if LOG.md or notes/ have grown meaningfully — "Consider running `distill` before moving on."

11. **Do not commit.**

## Template: `milestones/{version}-{slug}/SUMMARY.md`

```markdown
---
milestone: {version}-{slug}
topic: {topic-slug}
shipped: {YYYY-MM-DD}
status: shipped | shipped-with-gaps
---

# Milestone Summary: {version} — {short-title}

## What Shipped

{1-3 sentences. The honest version, not the marketing version.}

## Success Criteria

- [{x or partial-mark}] {criterion 1} — {note: passed cleanly | passed with caveat | gap: see below}
- [{x or partial-mark}] {criterion 2} — {note}

{If status is shipped-with-gaps, list the gaps explicitly under a "## Gaps" heading.}

## Decisions Worth Remembering

| Decision | Rationale | Outcome |
|---|---|---|
|  |  |  |

(also promoted to TOPIC.md Key Decisions if broadly applicable)

## Deferred

Captured as seeds:

- SEED-{N} — {brief, with trigger}

## Files Touched

(optional, for traceability)

- `{path}` — {what changed}

## Sessions

{N} sessions logged in topic LOG.md between {first-date} and {last-date}.

---
*Closed via complete-milestone on {YYYY-MM-DD}*
```

## Template: `.kss/PROJECT.md` — `## Carryover (cross-topic handoffs)`

Lazy-create this section in `PROJECT.md` if it doesn't exist. Append one row per cross-topic / future-topic handoff. **Every row REQUIRES a trigger** — same mandatory-trigger rule as SEEDS/`capture`.

```markdown
## Carryover (cross-topic handoffs)

| Item | Trigger | Source | Target topic | Captured |
|---|---|---|---|---|
| {one-line item} | {observable trigger} | {topic}/{milestone} | {target-slug or TBD} | {YYYY-MM-DD} |
```

- `Source` = `{topic}/{milestone}` being closed.
- `Target topic` = a known slug, or `TBD` if not yet decided. `new-topic` later claims rows whose Target matches its slug or is `TBD`.

## Output

- New `SUMMARY.md` in the milestone folder (this is what marks it as "shipped").
- Topic `MILESTONES.md` has a new top entry.
- Topic `STATE.md` reset (`status: between-milestones`, `active_milestone: null`). There is no project-level STATE.md to reset.
- Optionally: cross-topic/future handoffs appended to `PROJECT.md` `## Carryover (cross-topic handoffs)`.
- Optionally: topic marked `status: archived` (the flag in `TOPIC.md`; PROJECT.md row moved to `## Archived Topics`; `active_topic: null`). Files stay in place at `.kss/topics/{slug}/` — no folder move.

## Conventions

- **`SUMMARY.md` is the shipped marker.** Don't move folders into a separate archive subfolder; the file's existence is the signal. **Archiving a topic follows the same philosophy** — it's a `status: archived` flag, not a folder move (see next bullet), so this convention is now internally consistent.
- **Archive is a status flag, offered, never forced or silent.** A normal close ends with the `[archive / keep]` offer (default keep); `--archive-topic` is only a shortcut to that offer, not a way to skip the confirm. Archiving sets `status: archived` in the topic's `TOPIC.md`, moves the PROJECT.md row to `## Archived Topics` with a one-line breadcrumb, and sets `active_topic: null` — the topic directory **stays at `.kss/topics/{slug}/`** (no `git mv` to `.kss/archive/`, which is legacy). Skills enumerating topics exclude `status: archived`. The trail is `grep 'status: archived'`.
- **Cross-topic handoffs are trigger-gated.** A deferred item bound for another/future topic goes to `PROJECT.md` `## Carryover` with a mandatory trigger — same discipline as SEEDS. Appending is AUTO-DO, but always show the row written.
- **Be honest about gaps.** A `shipped-with-gaps` milestone is more useful than a fictional `shipped` one. Future-you will appreciate the truth.
- **Don't auto-promote decisions to TOPIC.md.** Ask the user which ones are worth pulling up. Most decisions are milestone-local.
