---
description: Load context for the active topic and milestone — shows recent log, next steps, blockers. Use at the start of a coding session, or when the user asks "what was I working on", "where did we leave off", "catch me up", wants to resume, or starts work in a kss-managed project.
---

# start-session

Loads the minimum context needed to resume work: which topic, which milestone, what's been happening, what's next. No auto-routing — just shows context and lets you decide.

## Pre-flight

1. **Refuse if `.kss/` is missing.**
   - "`.kss/` not found at `<absolute-path>`. Has this project been scaffolded? Run `scaffold-project`."

2. **Migrate legacy `.kss/STATE.md` (one-time, idempotent).**
   - If a legacy `.kss/STATE.md` file exists (older projects had a project-level STATE file — it is now eliminated):
     - If `.kss/PROJECT.md` frontmatter has **no** `active_topic` yet (missing or absent), copy `active_topic` from the legacy `.kss/STATE.md` into PROJECT.md frontmatter. If PROJECT.md already has an `active_topic`, keep PROJECT.md's value and discard the legacy one.
     - **Delete `.kss/STATE.md`.**
     - Tell the user: "Migrated legacy `.kss/STATE.md` → `active_topic` now lives in `.kss/PROJECT.md` frontmatter; removed the old file."
   - If no legacy `.kss/STATE.md` exists, skip this step silently. This is the only place in the whole workflow that touches `.kss/STATE.md`.

3. **Handle `--switch-topic <slug>`** (optional flag).
   - If given: validate the topic exists at `.kss/topics/{slug}/`.
   - If the target topic is `status: archived` in its `TOPIC.md`, note it ("`{slug}` is archived") and offer to un-archive (flip `TOPIC.md` `status: active`) — optional; you can still switch to it as-is.
   - Write `active_topic: {slug}` to `.kss/PROJECT.md` frontmatter. Do **not** write any project-level `active_milestone` — it is derived from the topic's own STATE.md (see Process step 1).

4. **Handle no active topic.**
   - If `.kss/PROJECT.md` frontmatter `active_topic` is null:
     - List existing topics under `.kss/topics/`, **excluding any with `status: archived` in their `TOPIC.md`** from the main list (you may show archived topics separately, clearly labeled).
     - Ask: "Which topic? (or `new-topic` to start one)"
     - On selection, set as active (write `active_topic` to PROJECT.md frontmatter).
     - If none exist (no active topics): route to `new-topic`.

## Process

1. **Read project pointer, then derive the active milestone.**
   - `.kss/PROJECT.md` frontmatter → `active_topic`.
   - Then read `.kss/topics/{active-topic}/STATE.md` frontmatter → `active_milestone` (this is the single source of truth — there is no project-level milestone pointer).

2. **Read topic state.**
   - `.kss/topics/{active-topic}/STATE.md` → current focus, blockers, next action (same file as step 1; you already have its frontmatter).
   - `.kss/topics/{active-topic}/TOPIC.md` → frontmatter only (status), unless this is the first session of a topic (then read the whole thing).

3. **Read active milestone plan (if any).**
   - `.kss/topics/{active-topic}/milestones/{active-milestone}/PLAN.md` → goal, success criteria, open tasks.

4. **Read recent log entries.**
   - `.kss/topics/{active-topic}/LOG.md` → last 5 entries (newest are at top, so first 5 sections).

5. **Surface triggered seeds (optional).**
   - Read `SEEDS.md`. Call out any seeds whose trigger condition has plausibly been met. Don't block — just mention.

6. **Display the session brief.**

   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    SESSION START — {project-name}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   **Topic:** {active-topic} — {topic description}
   **Milestone:** {active-milestone or "none — between milestones"}
   **Last session:** {date from PROJECT.md frontmatter last_session}

   ## Current Focus
   {topic STATE.md "Current Position" content}

   ## Open Tasks (from PLAN.md, if active milestone)
   - ◆ / ○ {task}

   ## Recent Sessions
   {3-5 LOG entries, top-of-file}

   ## Blockers
   {topic STATE.md "Blockers" — present as current truth}

   ## Last Session Noted — Still True?
   {only if topic STATE.md has a `## Scratch (transient — re-verify next session, safe to wipe)` section with content. List each item prefixed "last session noted:" and phrased as a question, NOT re-asserted as current. Omit the whole block if Scratch is empty/absent.}

   ## Triggered Seeds
   {only if any seeds' triggers are plausibly met; otherwise omit}

   ## Possible Next Steps
   - {only if there's a clear obvious next action — keep this minimal, no auto-routing}
   ```

7. **Re-verify transient Scratch facts (if any).**
   - The `## Last Session Noted — Still True?` block presents each Scratch item from topic STATE.md as a question — never re-asserted as live. e.g. `last session noted: "recorders down (last write 14:02)" — still true?`
   - On the user's answer:
     - **Still true** → keep it, but refresh its timestamp/detail to *this* session's check (fresh stamp).
     - **No longer / unknown / skipped** → clear that item from the Scratch section.
   - If Scratch is empty or absent, skip this step silently. Don't block the session on it.
   - This is read-side cleanup of transient state; durable "Blockers" are never touched here.

8. **Ask for session focus (optional).**
   - "What's the focus for this session? (or skip — leave blank)"
   - If provided, write it to topic `STATE.md` under "Current Focus" (or update it). Wrap-up will check against this.

9. **Update `.kss/PROJECT.md` frontmatter.**
   - `last_session: {YYYY-MM-DD}`.
   - `last_updated: {YYYY-MM-DD}`.

## Output

Just context displayed to the user. The minimal write is bumping `last_session` in `.kss/PROJECT.md` frontmatter (and topic STATE.md if a session focus was provided, or if transient Scratch facts were refreshed/cleared in step 7).

## Conventions

- **No auto-routing.** This skill shows you where you are; you decide what to do next. (GSD's `/gsd-progress` does the routing thing — we deliberately don't.)
- **Transient facts are re-verified, never parroted.** "Blockers" is current truth and shown as-is. Anything under topic STATE.md's `## Scratch (transient — re-verify next session, safe to wipe)` section (process up/down, ports, last-write times) is presented as "last session noted — still true?" and refreshed-with-a-fresh-stamp or cleared on your answer. Never re-assert yesterday's env state as today's.
- **Keep the brief short.** ~30 lines is the target. If a topic's state is rich enough that the brief explodes past that, the topic STATE.md probably needs trimming.
- **Don't read everything.** No reading whole TOPIC.md, no reading old milestones' SUMMARY.md, no reading CANONICAL-KB.md unless explicitly asked. Recency wins.
- **`last_session` is just a date stamp** — what work was actually done is captured by `wrap-up`, not here.
