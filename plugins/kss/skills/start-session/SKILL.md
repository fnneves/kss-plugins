---
description: Load context for the active topic and milestone — shows recent log, next steps, blockers. Use at the start of a coding session, or when the user asks "what was I working on", "where did we leave off", "catch me up", wants to resume, or starts work in a kss-managed project.
---

# start-session

Loads the minimum context needed to resume work: which topic, which milestone, what's been happening, what's next. No auto-routing — just shows context and lets you decide.

## Pre-flight

1. **Refuse if `.kss/` is missing.**
   - "`.kss/` not found at `<absolute-path>`. Has this project been scaffolded? Run `scaffold-project`."

2. **Handle `--switch-topic <slug>`** (optional flag).
   - If given: validate the topic exists at `.kss/topics/{slug}/`.
   - Update `.kss/STATE.md`: `active_topic: {slug}`, `active_milestone: <topic's STATE.md active_milestone>`.

3. **Handle no active topic.**
   - If `.kss/STATE.md` `active_topic` is null:
     - List existing topics under `.kss/topics/`.
     - Ask: "Which topic? (or `new-topic` to start one)"
     - On selection, set as active.
     - If none exist: route to `new-topic`.

## Process

1. **Read project pointer.**
   - `.kss/STATE.md` → `active_topic`, `active_milestone`.

2. **Read topic state.**
   - `.kss/topics/{active-topic}/STATE.md` → current focus, blockers, next action.
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
   **Last session:** {date from STATE.md last_session}

   ## Current Focus
   {topic STATE.md "Current Position" content}

   ## Open Tasks (from PLAN.md, if active milestone)
   - ◆ / ○ {task}

   ## Recent Sessions
   {3-5 LOG entries, top-of-file}

   ## Blockers
   {topic STATE.md "Blockers"}

   ## Triggered Seeds
   {only if any seeds' triggers are plausibly met; otherwise omit}

   ## Possible Next Steps
   - {only if there's a clear obvious next action — keep this minimal, no auto-routing}
   ```

7. **Ask for session focus (optional).**
   - "What's the focus for this session? (or skip — leave blank)"
   - If provided, write it to topic `STATE.md` under "Current Focus" (or update it). Wrap-up will check against this.

8. **Update `.kss/STATE.md`.**
   - `last_session: {YYYY-MM-DD}`.
   - `last_updated: {YYYY-MM-DD}`.

## Output

Just context displayed to the user. The minimal write is bumping `last_session` in `.kss/STATE.md` (and topic STATE.md if a session focus was provided).

## Conventions

- **No auto-routing.** This skill shows you where you are; you decide what to do next. (GSD's `/gsd-progress` does the routing thing — we deliberately don't.)
- **Keep the brief short.** ~30 lines is the target. If a topic's state is rich enough that the brief explodes past that, the topic STATE.md probably needs trimming.
- **Don't read everything.** No reading whole TOPIC.md, no reading old milestones' SUMMARY.md, no reading CANONICAL-KB.md unless explicitly asked. Recency wins.
- **`last_session` is just a date stamp** — what work was actually done is captured by `wrap-up`, not here.
