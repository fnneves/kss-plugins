---
description: Create a new topic under `.kss/topics/` and set it active — topics isolate unrelated work tracks. Use when the user wants to start a separate work track, spin up a new project area, switch focus to something unrelated, or says "new topic".
---

# new-topic

Topics are the namespace boundary for unrelated work tracks (e.g. `polymarket-bot`, `kalshi-dashboard-v2`). Each gets its own files so unrelated stuff never bleeds into one master plan. This skill scaffolds a topic and sets it as active.

## Pre-flight

1. **Refuse if `.kss/` is missing.** Suggest `scaffold-project`.

2. **Refuse if a topic with the same slug already exists** under `.kss/topics/` or `.kss/archive/`.
   - "Topic `{slug}` already exists. Pick a different slug or run `start-session --switch-topic {slug}`."

3. **Validate slug:** kebab-case only (`^[a-z][a-z0-9-]*[a-z0-9]$`). Reject otherwise.

## Inputs

- **Slug** (kebab-case, required) — e.g. `polymarket-bot`.
- **One-line description** (required).
- **`--from-spike <path>`** (optional) — path to a spike's `README.md`. Pre-fills Goal and Out-of-Scope from the spike's findings + verdict.

## Process

1. **Gather inputs.**
   - Slug, description.
   - If `--from-spike` is set, read the spike's `README.md` and extract: Question (→ Goal hint), Findings (→ Key Decisions seed), Verdict (→ confirms scope).

2. **Create the topic directory tree.**

   ```bash
   mkdir -p .kss/topics/{slug}/milestones
   ```

3. **Write the five topic files** using the templates below: `TOPIC.md`, `STATE.md`, `LOG.md`, `SEEDS.md`, `MILESTONES.md`.

4. **Update `.kss/PROJECT.md`.**
   - Under `## Topics`, add a row: `- **{slug}** — {description} (active)`.
   - Bump `last_updated` in frontmatter.

5. **Update `.kss/STATE.md`.**
   - Set `active_topic: {slug}`.
   - Set `active_milestone: null` (no milestone scoped yet).
   - Bump `last_updated`.
   - Replace body with: `Active topic: **{slug}**. No active milestone — run \`plan-milestone\` to scope one.`

6. **Tell the user.**
   - "Topic `{slug}` created and set as active. Next: run `plan-milestone` to scope your first milestone."

7. **Do not commit.**

## Template: `.kss/topics/{slug}/TOPIC.md`

```markdown
---
slug: {slug}
created: {YYYY-MM-DD}
last_updated: {YYYY-MM-DD}
status: active
---

# Topic: {slug}

## What This Is

{user description}

## Goal

{long-term goal of this topic — refine in plan-milestone if fuzzy}

## Success Bar

What does "this topic is done" look like? (Can be vague at start; sharpen at first milestone close.)

## Key Decisions

| Date | Decision | Rationale |
|---|---|---|
|  |  |  |

## Out of Scope

Explicit boundaries to prevent re-adding:

- {boundary, if known}

---
*Created via new-topic on {YYYY-MM-DD}*
{if --from-spike: *Seeded from spike: `{spike-path}`*}
```

## Template: `.kss/topics/{slug}/STATE.md`

```markdown
---
topic: {slug}
status: between-milestones
active_milestone: null
last_session: null
last_updated: {YYYY-MM-DD}
---

# Topic State: {slug}

## Current Position

No active milestone. Run `plan-milestone` to scope one.

## Recent Decisions

(empty)

## Blockers

None.

## Next Action

`plan-milestone`
```

## Template: `.kss/topics/{slug}/LOG.md`

```markdown
---
topic: {slug}
created: {YYYY-MM-DD}
---

# Session Log: {slug}

Newest sessions at top. One entry per session, terse.

(no sessions yet)
```

## Template: `.kss/topics/{slug}/SEEDS.md`

```markdown
---
topic: {slug}
created: {YYYY-MM-DD}
---

# Seeds: {slug}

Parked items. **Every seed must have a trigger condition.** Items without triggers rot — capture demands one.

| ID | Item | Trigger | Captured |
|---|---|---|---|
|  |  |  |  |
```

## Template: `.kss/topics/{slug}/MILESTONES.md`

```markdown
---
topic: {slug}
created: {YYYY-MM-DD}
---

# Milestone Log: {slug}

Newest at top. Append-only summary of shipped milestones.

(no milestones shipped yet)
```

## Output

Topic created at `.kss/topics/{slug}/` with five files + empty `milestones/` folder. Project STATE.md and PROJECT.md updated.

## Conventions

- One topic at a time is "active". Switching is done via `start-session --switch-topic` or by manually editing `.kss/STATE.md`.
- Topics can outlive multiple milestones. The milestone is the unit of finite work; the topic is the long-lived track.
