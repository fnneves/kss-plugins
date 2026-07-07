---
description: Create a new topic under `.kss/topics/` and set it active — topics isolate unrelated work tracks. Use when the user wants to start a separate work track, spin up a new project area, switch focus to something unrelated, or says "new topic".
---

# new-topic

Topics are the namespace boundary for unrelated work tracks (e.g. `polymarket-bot`, `kalshi-dashboard-v2`). Each gets its own files so unrelated stuff never bleeds into one master plan. This skill scaffolds a topic and offers to set it active (or register it as a parallel/future track without switching).

## Pre-flight

1. **Refuse if `.kss/` is missing.** Suggest `scaffold-project`.

2. **Refuse (or offer to un-archive) if a topic with the same slug already exists.**
   - Check `.kss/topics/{slug}/` — this **includes archived topics** (archiving is now a `status: archived` flag, so the directory stays put). Also check legacy `.kss/archive/{slug}/` for safety.
   - If the colliding topic is **active**: "Topic `{slug}` already exists. Pick a different slug or run `start-session --switch-topic {slug}`."
   - If the colliding topic is **archived** (`status: archived` in its `TOPIC.md`, or it sits under legacy `.kss/archive/`): "Topic `{slug}` exists but is archived. Un-archive it instead of creating a new one? [un-archive / pick a different slug]" — on un-archive, flip its `TOPIC.md` `status: active`, move its PROJECT.md row from `## Archived Topics` back to `## Topics`, then fall through to the activation offer (step 4). **Never silently overwrite an existing topic directory.**

3. **Validate slug:** kebab-case only (`^[a-z][a-z0-9-]*[a-z0-9]$`). Reject otherwise.

## Inputs

- **Slug** (kebab-case, required) — e.g. `polymarket-bot`.
- **One-line description** (required).
- **`--from-spike <path>`** (optional) — path to a spike's `README.md`. Pre-fills Goal and Out-of-Scope from the spike's findings + verdict.

## Process

1. **Gather inputs.**
   - Slug, description.
   - If `--from-spike` is set, read the spike's `README.md` and extract: Question (→ Goal hint), Findings (→ Key Decisions seed), Verdict (→ confirms scope).
   - **Check for inherited carryover.** Read `.kss/PROJECT.md` `## Carryover (cross-topic handoffs)` if present. **SUGGEST-AND-CONFIRM** offer to claim any row whose `Target topic` matches the new slug or is `TBD`:
     - **Offer:** `These items were handed off to a future topic — claim any into {slug}? [list, choose by # / none]`
     - For each claimed item, route it by its nature: a scope/boundary or decision → `TOPIC.md` (Out of Scope / Key Decisions); a forward-looking parked item → the new topic's `SEEDS.md` (**preserve its trigger** — it already has one; demand one if somehow missing, same rule as `capture`).
     - When an item is claimed, **remove or strike its Carryover row** in PROJECT.md, leaving a breadcrumb of where it went, e.g. strike the line and append `→ claimed into {slug} ({TOPIC.md|SEEDS.md}) {YYYY-MM-DD}`.
     - Default = claim nothing; leave the Carryover rows intact.

2. **Create the topic directory tree.**

   ```bash
   mkdir -p .kss/topics/{slug}/milestones
   ```

3. **Write the five topic files** using the templates below: `TOPIC.md`, `STATE.md`, `LOG.md`, `SEEDS.md`, `MILESTONES.md`.

4. **Offer activation (SUGGEST-AND-CONFIRM) — don't force it.**
   - If there is no current active topic, activation is the only sensible default: just activate (proceed as `[activate]` below) and note it.
   - Otherwise **offer:** `Set {slug} active now, or register it and stay on {current-topic}? [activate / keep current]`
   - Default = **keep current** (registering without switching is the safe, non-destructive choice).

5. **Update `.kss/PROJECT.md`.**
   - Under `## Topics`, add a row: `- **{slug}** — {description}{ (active) only if activating}`.
   - Always add the topic here, whether or not it becomes active.
   - **[activate] only:** set `active_topic: {slug}` in the frontmatter. (The new topic's own `STATE.md` carries `active_milestone: null` — the single source of truth for its milestone.)
   - **[keep current]:** leave the frontmatter `active_topic` unchanged — it stays on `{current-topic}`. The new topic is registered (PROJECT.md row + its own files) but not active.
   - Bump `last_updated` in frontmatter.

6. **Tell the user — and offer the next step (SUGGEST-AND-CONFIRM).**
   - **[activate]:** "Topic `{slug}` created and set as active. Plan the first milestone now? [y/N]" — on yes, hand into `plan-milestone`; on no (default), done.
   - **[keep current]:** "Topic `{slug}` created and registered (still on `{current-topic}`). Switch with `start-session --switch-topic {slug}`, or plan into it directly with `plan-milestone --topic {slug}`."

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

## Scratch (transient — re-verify next session, safe to wipe)

(none)

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

Topic created at `.kss/topics/{slug}/` with five files + empty `milestones/` folder. PROJECT.md always updated (new `## Topics` row; possibly Carryover rows claimed). PROJECT.md frontmatter `active_topic` is set to `{slug}` **only if the topic is activated**.

## Conventions

- One topic at a time is "active". **new-topic no longer forces the switch** — it *offers* activation (default: keep the current topic). Registering a parallel/future track without leaving the current one is the safe path; switch later via `start-session --switch-topic` (or plan into it with `plan-milestone --topic <slug>`).
- **Carryover is claimed, not auto-inherited.** Inherited cross-topic items from PROJECT.md `## Carryover` land in the new topic only on explicit confirm, and each keeps its mandatory trigger when it becomes a seed.
- Topics can outlive multiple milestones. The milestone is the unit of finite work; the topic is the long-lived track.
