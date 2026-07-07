---
description: Scope and plan a milestone within the active topic. Adaptive — discusses scope first if fuzzy, plans directly if not. Use when the user wants to plan, scope, break down, or kick off a chunk of work, or says "next milestone" / "what should I tackle".
---

# plan-milestone

Creates a milestone folder + `PLAN.md` inside the active topic. Adaptive: if scope is already clear, jumps straight to writing the plan; if it's fuzzy, walks through scope/success criteria first.

## Pre-flight

1. **Refuse if `.kss/` is missing.** Suggest `scaffold-project`.

2. **Refuse if no active topic** (`active_topic` is null in `.kss/PROJECT.md` frontmatter) — unless `--topic <slug>` is given (which targets a specific topic directly).
   - "No active topic. Run `new-topic` or `start-session --switch-topic <slug>` first."

3. **If an active milestone is already set, offer (SUGGEST-AND-CONFIRM) — don't refuse.**
   - Skip this entirely if `--topic <slug>` was given (planning targets a non-active topic; the active milestone is irrelevant — go to Process).
   - **Offer:** `{topic} has {version}-{slug} in flight — [c]lose it / [s]witch topic / plan a different topic anyway?`
   - **[c]lose it:** hand into `complete-milestone` for the in-flight milestone, then resume planning the new one in the same topic.
   - **[s]witch topic:** ask which topic, treat the rest of this run as if `--topic <that-slug>` were passed (write only that topic's files, never the active pointer — see Conventions).
   - **plan a different topic anyway:** ask for the target slug and proceed as `--topic <slug>` (the active topic + its in-flight milestone are left untouched).
   - Default to no action until the user picks one of the three.

## Inputs

- **Version** (e.g. `v0.1`, `m1`) — optional, asked if not given. User's choice of scheme; consistency matters per topic.
- **Slug** (kebab-case) — optional, generated from goal if not given.
- **`--topic <slug>`** (optional) — plan a milestone in a NON-active topic (e.g. a parallel/future track) without disturbing the current one. Writes **only** that topic's `STATE.md` + the milestone `PLAN.md`; **never touches the active pointer** (`active_topic` in `.kss/PROJECT.md` frontmatter). Skips the active-milestone pre-flight (step 3).
- **`--from-spike <path>`** (optional) — pre-fills goal + scope from a spike's findings.

## Process

1. **Determine the target topic.**
   - Default = the active topic (`active_topic` in `.kss/PROJECT.md` frontmatter).
   - If `--topic <slug>` was given (or chosen via the step-3 switch/anyway branches), the target is that slug. Verify it exists under `.kss/topics/`; refuse if not. **Remember: in `--topic` mode, do NOT change the active pointer (`active_topic` in PROJECT.md) at any step.**
   - Below, `{target-topic}` means the active topic in the normal case, or the `--topic` slug otherwise.

2. **Read context.**
   - `.kss/topics/{target-topic}/TOPIC.md` (Goal, Success Bar, Out of Scope).
   - `.kss/topics/{target-topic}/MILESTONES.md` (what's shipped).
   - If `--from-spike`, the spike's `README.md`.

3. **Adaptive scoping.**
   - Ask: "Is this milestone already scoped, or do you want to think through it first?"
   - **If scoped:** ask directly for goal (one sentence), success criteria (bullet list), and task breakdown.
   - **If not:** walk through:
     - "What's the *one thing* this milestone proves or ships?"
     - "What must be true to call it done?" (3-6 bullets max)
     - "What's explicitly out of scope?"
     - "Rough task breakdown — what are the moves?"
     - Capture as you go.

4. **Determine version + slug.**
   - If user didn't provide version: suggest the next sequential one based on the target topic's MILESTONES.md, or ask.
   - If user didn't provide slug: derive from goal (kebab-case, ≤4 words).
   - Confirm both before writing.

5. **Refuse if a milestone with the same `<version>-<slug>` already exists** under `.kss/topics/{target-topic}/milestones/`.

6. **Create the milestone folder.**

   ```bash
   mkdir -p .kss/topics/{target-topic}/milestones/{version}-{slug}
   ```

7. **Write `PLAN.md`** using the template below.

8. **Update topic `STATE.md`** (the `{target-topic}`'s STATE.md).
   - `status: planned` (changes to `executing` on first wrap-up after this).
   - `active_milestone: {version}-{slug}`.
   - Body: "Active milestone: **{version}-{slug}** — {goal}. See `milestones/{version}-{slug}/PLAN.md`."

9. **Tell the user.**
    - Normal: "Milestone `{version}-{slug}` planned. Next: run `start-session` when you're ready to work."
    - `--topic` mode: "Milestone `{version}-{slug}` planned in topic `{target-topic}` (not active). `{active-topic}` is still your active track — run `start-session --switch-topic {target-topic}` when you want to work on it."
    - If `--from-spike`: also remind to update the spike's verdict to `yes — promoted to milestone`.

10. **Do not commit.**

## Template: `milestones/{version}-{slug}/PLAN.md`

```markdown
---
milestone: {version}-{slug}
topic: {topic-slug}
created: {YYYY-MM-DD}
last_updated: {YYYY-MM-DD}
status: planned
{if --from-spike: spike: {spike-path}}
---

# Milestone Plan: {version} — {short-title}

## Goal (one sentence)

{goal}

## Success Criteria

What must be true to call this shipped:

- [ ] {criterion 1}
- [ ] {criterion 2}
- [ ] {criterion 3}

## Out of Scope

Explicit boundaries (prevents scope creep mid-milestone):

- {boundary 1}
- {boundary 2}

## Task Breakdown

| # | Task | Status |
|---|------|--------|
| 1 | {task} | ○ |
| 2 | {task} | ○ |
| 3 | {task} | ○ |

Status legend: ○ pending · ◆ in-progress · ✓ done

## Open Questions

(resolve as you go; promote stable answers to TOPIC.md "Key Decisions" at milestone close)

- {question}

## Notes

(deep-dive session writeups go to sibling `note-YYYYMMDD-*.md` files, not here)

---
*Planned via plan-milestone on {YYYY-MM-DD}*
```

## Output

Milestone folder created with `PLAN.md`. The target topic's STATE.md updated (`active_milestone` set there — the single source of truth). The active pointer (`active_topic` in `.kss/PROJECT.md` frontmatter) is **never** touched by this skill — `--topic` mode does not move it either.

## Conventions

- **One milestone in flight per topic is the default, not a wall.** When a topic already has an active milestone, plan-milestone *offers* (close / switch / plan-elsewhere) rather than refusing. No hand-editing the active pointer (`active_topic` in `.kss/PROJECT.md`) to register or plan a parallel/future track.
- **`--topic <slug>` never moves the active pointer** (`active_topic` in `.kss/PROJECT.md` frontmatter). It writes only the target topic's STATE.md + the milestone PLAN.md. Switching which topic is active stays a deliberate, separate act (`start-session --switch-topic`).
- Keep success criteria short and binary (true/false at close). Vague criteria become arguments at completion time.
- Task breakdown is a guide, not a contract. Add/remove tasks freely during execution; just keep the goal and success criteria stable.
- For a PoC milestone, mark it explicitly in the goal: "Demonstrate that X works (PoC, not production)." Borrows GSD's PoC-vs-prod framing — different success bars.
