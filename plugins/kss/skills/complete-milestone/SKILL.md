---
description: Close the active milestone — write SUMMARY.md, append to MILESTONES.md, reset state. Use `--archive-topic` to retire the whole topic. Use when the user says they shipped, finished, or are done with the current milestone, or wants to wrap up / close out / archive a topic.
---

# complete-milestone

Closes the active milestone. Writes a SUMMARY.md (the "shipped" marker), appends a one-paragraph entry to the topic's MILESTONES.md, and resets state. With `--archive-topic`, archives the entire topic to `.kss/archive/`.

## Pre-flight

1. **Refuse if `.kss/` is missing.**

2. **Refuse if no active topic.**

3. **Refuse if no active milestone.**
   - "No active milestone. Nothing to complete."

4. **Warn if any task in PLAN.md is still `◆ in-progress`.**
   - "Tasks still in progress: {list}. Continue closing anyway, or pause to finish them?"
   - If continue: log them as deferred in SUMMARY.md.

## Inputs

- `--archive-topic` (optional flag) — also archives the whole topic after closing the milestone. Use when the topic's success bar has been met.

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

5. **Write `SUMMARY.md`** in the milestone folder, using the template below.

6. **Append to topic's `MILESTONES.md`** at the **top** (newest-first):

   ```markdown
   ## {version} — {short-title} (shipped {YYYY-MM-DD})

   {1-2 line summary of what shipped}

   Archive: `milestones/{version}-{slug}/`
   ```

7. **Update topic's `STATE.md`.**
   - `status: between-milestones`.
   - `active_milestone: null`.
   - Body: "Last shipped: {version}-{slug} on {date}. Run `plan-milestone` to scope the next."

8. **Update project's `.kss/STATE.md`.**
   - `active_milestone: null`.

9. **If `--archive-topic`:**
   - Confirm with user: "Archive the whole topic `{slug}`? This moves `.kss/topics/{slug}/` to `.kss/archive/{slug}/`."
   - On yes: move the directory. Update `PROJECT.md` (move topic from Topics to Archived Topics with a one-line breadcrumb pointing at the archive). Update `.kss/STATE.md` `active_topic: null`.

10. **Tell the user.**
    - Without `--archive-topic`: "Milestone {version}-{slug} closed. Run `plan-milestone` for the next, or `complete-milestone --archive-topic` if this topic is fully done."
    - With `--archive-topic`: "Topic `{slug}` archived. Run `new-topic` to start the next, or `start-session --switch-topic <other>` if you have another active topic."

11. **Suggest `distill`** if LOG.md or notes/ have grown meaningfully — "Consider running `distill` before moving on."

12. **Do not commit.**

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

## Output

- New `SUMMARY.md` in the milestone folder (this is what marks it as "shipped").
- Topic `MILESTONES.md` has a new top entry.
- Both STATE.md files reset.
- Optionally: whole topic moved to `.kss/archive/`.

## Conventions

- **`SUMMARY.md` is the shipped marker.** Don't move folders into a separate archive subfolder; the file's existence is the signal.
- **Be honest about gaps.** A `shipped-with-gaps` milestone is more useful than a fictional `shipped` one. Future-you will appreciate the truth.
- **Don't auto-promote decisions to TOPIC.md.** Ask the user which ones are worth pulling up. Most decisions are milestone-local.
