---
description: Capture a short report on how a kss skill misbehaved or could have done better, or analyze accumulated reports for a skill to propose concrete SKILL.md improvements. Use when the user says "that skill X didn't do what I wanted", "log a complaint about skill X", "review skill X reports", "look at how skill X has been performing", or asks to autopsy / improve / critique a specific skill.
---

# skill-autopsy

A user-triggered postmortem for kss skills. Two jobs: (1) record a short report when a skill underperformed, and (2) when reports accumulate, look for patterns and propose concrete edits to that skill's `SKILL.md`. Conversational, never automatic — the only entry point that touches `skill-reports/`.

## How locations work

- **Reports** always live at `<reports-dir>/<skill-name>.md`. The default `<reports-dir>` is `~/kss-skill-reports/`. Reports are personal — never written into the plugin source.
- **Source path** (`~/.kss-source`) is **optional**. It only controls whether consolidate mode can *apply* a proposed diff to a writable kss source folder (forker / contributor flow). Without it, autopsy still captures reports and analyzes patterns — it just prints proposed diffs instead of applying them.

## Pre-flight

1. **Refuse if no target skill is named.** Ask: "Which skill? (e.g., `start-session`, `distill`, ...)"

2. **Resolve the reports directory.**
   - Default: `~/kss-skill-reports/`.
   - If the directory does not exist, ask the user:
     > "I'll create `~/kss-skill-reports/` to store skill reports. This is a personal location — never committed to the plugin source. Confirm? (yes / specify a different absolute path)"
   - On confirmation, create the directory.
   - Refuse to proceed if the user declines and gives no alternative.

3. **Resolve source path (optional).**
   - Read `~/.kss-source` if present. Its single line is the absolute path to a writable kss plugin source folder (typically a clone of the kss-plugins repo).
   - If missing, that's fine. Note it: "No `~/.kss-source` configured — consolidate mode will print diffs for manual handling rather than applying them."
   - If present but the named skill doesn't exist at `<source-path>/skills/<skill-name>/SKILL.md`, warn but continue. (User may have a partial clone or different layout.)

4. **Determine mode.**
   - `--consolidate` flag → consolidate mode.
   - Otherwise → write mode (default). User can flip to consolidate from the post-write threshold prompt.

## Inputs

- **`<skill-name>`** (required, positional) — the skill being autopsied.
- **`--consolidate`** (optional flag) — skip the report-writing flow and go straight to pattern analysis.

## Write mode

1. **Locate the report file** at `<reports-dir>/<skill-name>.md`. Create it lazily with frontmatter (see template below) if missing.

2. **Interview the user briefly.** Conversational, not a form. Cover:
   - What did you ask the skill to do?
   - What did the skill actually do?
   - Why was that off — was the description vague, the preflight missing a check, an edge case unhandled, an instruction that misled?
   - Optional: a hypothesis for what would have prevented it.

   If the user has already explained all of this in their preceding message, skip the interview and use what they said.

3. **Compose the report block** using the entry template below. Newest-on-top.

4. **Show the drafted block** and confirm before writing.

5. **Append the block at the top** of the file's body (below the frontmatter). Bump `updated` in frontmatter.

6. **Count reports** (number of `## ` entries) after the append. Threshold checks:
   - count ≤ 3 → say nothing.
   - count == 4 or 5 → tell the user, verbatim:
     > "we already have {N} reports in the folder, would you like me to explore the reports already created and identify possible skill improvements?"
     If yes → switch to consolidate mode now. If no → leave it.
   - count ≥ 6 → escalate:
     > "we have {N} reports for `{skill-name}` — past 5, patterns start getting tangled and harder to consolidate cleanly. Strongly suggest we review now. Want to?"
     If yes → consolidate mode. If no → leave it (but don't pretend the warning didn't happen).

## Consolidate mode

The point of this mode is to play coach: read how the user has actually been using the skill, find the *underlying* friction, and propose a SKILL.md edit only when there's something real to say.

1. **Read** `<reports-dir>/<skill-name>.md` in full. Also read the live SKILL.md from whichever location is available:
   - If `~/.kss-source` is set → `<source-path>/skills/<skill-name>/SKILL.md`.
   - Else → the installed cache copy (from the plugin install location). Note: cache copies are read-only in practice — they get overwritten on `/plugin update`.

2. **Look for signal, not noise.** Specifically:
   - **Recurring root causes** — multiple reports pointing at the same gap (e.g., three reports all complain that the skill skips a check the user expected).
   - **Description mismatches** — reports where the skill ran when it shouldn't have, or didn't run when it should have. That points at the frontmatter `description`, not the body.
   - **Missing preflight** — reports where the skill proceeded on bad assumptions (no active topic, missing file, etc.).
   - **Instruction ambiguity** — reports where two reasonable readings of the skill produced different behavior.
   - **Edge cases the skill never handled** — recurring "what about when X" scenarios.

3. **Be honest about thin signal.** If reports are vague, contradictory, or simply describe one-off frustrations with no shared root, say so:
   > "I've read the {N} reports for `{skill-name}` and don't see a clear pattern worth changing the SKILL.md over. Reports {a, b} are about {topic}, but {c} is unrelated, and {d} is too vague to act on. Suggest leaving this for now and revisiting after more usage."

   **Do not invent improvements.** Fabricated edits make the skill worse and erode trust in the autopsy loop. "Nothing to change yet" is a valid, often correct, outcome.

4. **When there is signal, propose a concrete diff.** Show:
   - Which reports support the change (cite by date).
   - The exact text being added/changed/removed in `SKILL.md`.
   - One sentence on why this addresses the recurring failure.

   Prefer minimal edits — tightening the `description`, adding a preflight bullet, calling out an edge case — over rewrites.

5. **Get approval.** User can accept, reject, or edit the proposed diff.

6. **On approval — branch by source availability:**

   **A. Source path is set (`~/.kss-source` exists):**
   - Apply the diff to `<source-path>/skills/<skill-name>/SKILL.md`.
   - Clear the reports body in `<reports-dir>/<skill-name>.md` (keep the frontmatter, bump `updated`).
   - Print the commit hint (see "Commit hint" template below).

   **B. Source path is NOT set:**
   - **Print** the diff verbatim with a header explaining how to use it:
     > "No `~/.kss-source` configured — printing the proposed diff for manual handling. Options:
     > - Fork the kss-plugins repo, apply this diff to your fork, point `~/.kss-source` at it, and re-run consolidate to apply automatically.
     > - Open a GitHub issue with this diff to send the improvement upstream.
     > - Keep it as a personal note and adapt your usage of the skill."
   - Ask: "Clear the reports anyway? (you've seen the analysis)"
     - On yes → clear reports body, bump `updated`.
     - On no → leave the report file as-is.

7. **On rejection:** leave both files alone. Don't argue.

## Template: `<reports-dir>/<skill-name>.md` initial file

```markdown
---
skill: <skill-name>
updated: YYYY-MM-DD
---

# skill-reports — <skill-name>

User-triggered postmortems. Read only when running `skill-autopsy`. Newest-on-top. Personal — never committed to the plugin source.
```

## Template: commit hint

Used only in branch A (source path set). After applying the diff, print the commands the user can run from any directory. **Never execute them.**

```
# Review the change first:
git -C <source-path> diff

# Then commit when ready:
git -C <source-path> add skills/<skill-name>/SKILL.md
git -C <source-path> commit -m "skill-autopsy(<skill-name>): <one-line summary>"
```

Reports are not committed (they live outside the source folder by design).

## Template: report block

Insert at the top of the body (below the frontmatter, above any existing reports).

```markdown
## YYYY-MM-DD — {one-line situation summary}

**Asked:** {what the user wanted}
**Skill did:** {what actually happened}
**Why off:** {root cause as the user sees it — vague description, missing preflight, ambiguous instruction, etc.}
{optional} **Hypothesis:** {what change to SKILL.md the user thinks would have prevented it}
```

## Conventions

- **Explicit-only.** No other skill reads `<reports-dir>/`. It exists solely for this autopsy loop.
- **Lazy creation.** The reports file is created on first write, not by `scaffold-project`.
- **Newest-on-top** in the body, like LOG.md.
- **One skill at a time.** Cross-skill pattern analysis is out of scope.
- **No fabrication.** If reports don't support a change, don't propose one.
- **Caps are warnings, not refusals.** The user can keep adding reports past 5 — but the warning escalates so the skill graveyard problem doesn't sneak up.
- **Reports are personal.** They live at `~/kss-skill-reports/` (or user-chosen path), never inside the plugin source. Forkers don't accidentally commit their frustrations upstream.
- **Source-path is optional.** Without `~/.kss-source`, autopsy still works as a journal + pattern-analysis + feedback channel. With it, consolidate mode can apply diffs to a writable source.
- **Never auto-commit.** When a diff is applied, print the exact `git -C <source-path>` commands and let the user run them. Committing is always a gated, human-reviewed decision.
