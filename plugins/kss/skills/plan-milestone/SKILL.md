---
description: Scope and plan a milestone within the active topic. Adaptive — discusses scope first if fuzzy, plans directly if not. Use when the user wants to plan, scope, break down, or kick off a chunk of work, or says "next milestone" / "what should I tackle".
---

# plan-milestone

Creates a milestone folder + `PLAN.md` inside the active topic. Adaptive: if scope is already clear, jumps straight to writing the plan; if it's fuzzy, walks through scope/success criteria first.

## Pre-flight

1. **Refuse if `.kss/` is missing.** Suggest `scaffold-project`.

2. **Refuse if no active topic** in `.kss/STATE.md`.
   - "No active topic. Run `new-topic` or `start-session --switch-topic <slug>` first."

3. **Refuse if active milestone is already set.**
   - "Active milestone `{version}-{slug}` is in progress. Run `complete-milestone` to close it before starting a new one."

## Inputs

- **Version** (e.g. `v0.1`, `m1`) — optional, asked if not given. User's choice of scheme; consistency matters per topic.
- **Slug** (kebab-case) — optional, generated from goal if not given.
- **`--from-spike <path>`** (optional) — pre-fills goal + scope from a spike's findings.

## Process

1. **Read context.**
   - `.kss/topics/{active-topic}/TOPIC.md` (Goal, Success Bar, Out of Scope).
   - `.kss/topics/{active-topic}/MILESTONES.md` (what's shipped).
   - If `--from-spike`, the spike's `README.md`.

2. **Adaptive scoping.**
   - Ask: "Is this milestone already scoped, or do you want to think through it first?"
   - **If scoped:** ask directly for goal (one sentence), success criteria (bullet list), and task breakdown.
   - **If not:** walk through:
     - "What's the *one thing* this milestone proves or ships?"
     - "What must be true to call it done?" (3-6 bullets max)
     - "What's explicitly out of scope?"
     - "Rough task breakdown — what are the moves?"
     - Capture as you go.

3. **Determine version + slug.**
   - If user didn't provide version: suggest the next sequential one based on topic's MILESTONES.md, or ask.
   - If user didn't provide slug: derive from goal (kebab-case, ≤4 words).
   - Confirm both before writing.

4. **Refuse if a milestone with the same `<version>-<slug>` already exists** under `.kss/topics/{active-topic}/milestones/`.

5. **Create the milestone folder.**

   ```bash
   mkdir -p .kss/topics/{active-topic}/milestones/{version}-{slug}
   ```

6. **Write `PLAN.md`** using the template below.

7. **Update topic `STATE.md`.**
   - `status: planned` (changes to `executing` on first wrap-up after this).
   - `active_milestone: {version}-{slug}`.
   - Body: "Active milestone: **{version}-{slug}** — {goal}. See `milestones/{version}-{slug}/PLAN.md`."

8. **Update project `.kss/STATE.md`.**
   - `active_milestone: {version}-{slug}`.

9. **Tell the user.**
   - "Milestone `{version}-{slug}` planned. Next: run `start-session` when you're ready to work."
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

Milestone folder created with `PLAN.md`. Both STATE.md files updated.

## Conventions

- Keep success criteria short and binary (true/false at close). Vague criteria become arguments at completion time.
- Task breakdown is a guide, not a contract. Add/remove tasks freely during execution; just keep the goal and success criteria stable.
- For a PoC milestone, mark it explicitly in the goal: "Demonstrate that X works (PoC, not production)." Borrows GSD's PoC-vs-prod framing — different success bars.
