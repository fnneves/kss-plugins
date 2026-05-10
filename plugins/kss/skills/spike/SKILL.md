---
description: Throwaway exploration with a verdict — lives in `.kss/spikes/`. Use when the user wants to test, prototype, investigate, or explore an idea cheaply before committing — says "let's try", "quick experiment", "see if it works", "prove out", or "spike on".
---

# spike

A spike is a time-boxed exploration to answer one specific question. The point is to find out cheap whether something works *before* committing to a milestone or topic. Verdict-driven: every spike ends with a clear "yes / no / pivot" so the work isn't wasted regardless of outcome.

## Pre-flight

1. **Refuse if `.kss/` is missing.**

## Inputs

- **Question to investigate** (required, asked if not given). Should be specific and binary-ish: "can we resolve a Kalshi tennis event to its Polymarket counterpart with a name+date scorer?" — not "let's explore tennis matching."
- **Slug** (kebab-case, ≤4 words) — derived from question if not given.
- **Time-box** (optional) — e.g. "1 session", "2 hours". Free-form; just goes in the README.

## Process

### Phase 1 — Create the spike

1. **Generate slug** if not provided.

2. **Refuse if `.kss/spikes/{YYYYMMDD}-{slug}/` already exists.**
   - Suggest: pick a different slug or append a suffix.

3. **Create the spike folder.**

   ```bash
   mkdir -p .kss/spikes/{YYYYMMDD}-{slug}
   ```

4. **Write `README.md`** using the template below. Fill in Question, Approach (placeholder OK), Time-box.

5. **Tell the user.**
   - "Spike `{YYYYMMDD}-{slug}` created at `.kss/spikes/{YYYYMMDD}-{slug}/`. Verdict starts as `pending`. Explore freely; come back here to update findings and set the verdict when done."

6. **Do not commit.**

### Phase 2 — Update during exploration

The user iterates on the spike, possibly creating supporting files (sketch code, notes, output dumps) inside the spike folder. They re-invoke this skill (or just edit the README directly) to update Findings as they go.

If re-invoked while a spike folder exists with `verdict: pending`:
- Ask: "Update findings, set verdict, or both?"
- Apply changes to the README.

### Phase 3 — Set the verdict

When the user is ready to call it:

1. **Read the spike's README.**

2. **Walk the verdict options.**

   | Verdict | When |
   |---|---|
   | `yes — promote to milestone` | The pattern works; build the real thing inside an existing topic |
   | `yes — promote to topic` | Big enough that it deserves its own track |
   | `no — kill, here's what we learned` | The approach is wrong; document the learning, don't build |
   | `pivot — try {alternative}` | The original question was wrong; suggest a follow-up spike |

3. **Update README.md:**
   - Frontmatter: `status: decided`, `verdict: <chosen>`.
   - Body: fill in the Verdict section with rationale + next action.

4. **If verdict is `yes — promote`:**
   - Suggest the next command:
     - Milestone: `plan-milestone --from-spike .kss/spikes/{YYYYMMDD}-{slug}/README.md`
     - Topic: `new-topic --from-spike .kss/spikes/{YYYYMMDD}-{slug}/README.md`
   - The spike folder stays in place as a historical record (do not move or delete).

5. **If verdict is `no` or `pivot`:**
   - Suggest running `distill` to pull any durable learnings from the spike into CANONICAL-KB.
   - The spike folder stays in place — it's the record of "we tried this; here's why we didn't continue."

6. **Tell the user.**
   - "Spike verdict set: `{verdict}`. {next-action-suggestion}"

7. **Do not commit.**

## Template: `.kss/spikes/{YYYYMMDD}-{slug}/README.md`

```markdown
---
spike: {slug}
created: {YYYY-MM-DD}
last_updated: {YYYY-MM-DD}
status: in-progress
verdict: pending
time_box: {free-form}
---

# Spike: {one-line title}

## Question

{the specific thing to answer — should be answerable yes/no/pivot}

## Approach

{how we plan to investigate. Placeholder is fine; refine as you go.}

## Time-box

{e.g. "1 session", "2 hours", "until I've talked to both APIs"}

## Findings

(populate as exploration happens — code experiments, API responses, observations)

## Verdict

**Status:** pending

When decided, replace with one of:

- **yes — promote to milestone** — {rationale + which topic gets it}
- **yes — promote to topic** — {rationale + topic name}
- **no — kill** — {what we learned that makes this not worth building}
- **pivot — try {alternative}** — {the better question to ask next}

---
*Created via spike on {YYYY-MM-DD}*
```

## Output

A folder under `.kss/spikes/` with a `README.md` and any supporting files the user generated during exploration. The folder stays forever as a record — even after promotion or kill.

## Conventions

- **Spikes are throwaway by default.** The artifact is the *answer to the question*, not the code. If the answer is yes, you build the real thing; the spike code is a sketch, not production.
- **Always set a verdict.** A spike that ends `pending` indefinitely is a bug — either kill it, decide, or revisit. `start-session` will surface old `pending` spikes as a nudge.
- **Spike folders stay forever.** They're cheap (one README typically + maybe some scratch files) and they're the institutional memory for "we tried this and decided yes/no/pivot."
- **Promotion is one-way.** Once promoted to milestone/topic, the spike is referenced by the new artifact (`spike: {path}` in frontmatter) but the spike itself doesn't change role.
- **Don't put spikes inside topics.** They live at root level because they often inform *which* topic to start (or whether one is even worth starting).
