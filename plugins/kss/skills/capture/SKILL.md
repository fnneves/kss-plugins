---
description: Drop a seed (with mandatory trigger), backlog idea, or scratch note without leaving flow. Use when the user wants to park, save, jot down, remember later, or set aside an idea, todo, or thought — phrases like "remind me to", "for later", "don't forget", "park this".
---

# capture

Lightweight idea-drop. Use any time during a session. Three modes — seed, idea, scratch — chosen by content, not by flag.

## Pre-flight

1. **Refuse if `.kss/` is missing.**

2. **Soft-fail if no active topic** in `.kss/STATE.md`.
   - Ask: "No active topic. Which topic should this go to? (list available, or `--project-level` to capture into PROJECT.md scratch)"

## Inputs

- **The thing to capture** (free text, required).
- **Type** (inferred from the user's wording, or asked):
  - **`seed`** — parked idea for the future. **Requires a trigger condition.**
  - **`idea`** — broader thought worth noting but not immediately actionable.
  - **`scratch`** — quick mid-session note, ephemeral.

## Process

1. **Determine type.**
   - If user said "remind me to...", "later we should...", "park...", "consider..." → seed.
   - If user said "interesting that...", "this could lead to...", "tangent..." → idea.
   - If user said "quick note...", "scratch...", "just noting..." → scratch.
   - If unclear, ask.

2. **For seeds:**
   - **Demand a trigger condition.** No exceptions.
   - Ask: "When would you actually pick this up? Example triggers: `on next live trading session`, `when X breaks`, `after v0.3 ships`, `if we ever touch the auth layer`."
   - **Refuse if user can't articulate one.** Tell them: "Items without triggers rot. Either give it a trigger, or drop it."
   - Generate ID: `SEED-{N+1}` based on existing IDs in `SEEDS.md`.
   - Append to topic's `SEEDS.md` table:
     ```markdown
     | SEED-{N} | {item} | {trigger} | {YYYY-MM-DD} |
     ```
   - Confirm: "Captured as `SEED-{N}` in topic `{slug}`. Trigger: `{trigger}`."

3. **For ideas:**
   - Append to topic's `LOG.md` under a current-day entry's "Ideas" sub-bullet, or to a standalone "Ideas" section if no current-day entry exists.
   - Or, if substantive (>2 lines), suggest writing it as a note via `wrap-up`'s notes flow instead.

4. **For scratch:**
   - Append to a `## Scratch` section at the bottom of topic `LOG.md`. Keep it lightweight — overflow is fine; `distill` will sweep it later.
   - Or, if the user prefers, hold it in conversation and let them drop it themselves.

5. **Tell the user what happened.**
   - "{type} captured. Continue your session."

6. **Do not commit.**

## Conventions

- **Trigger conditions are mandatory for seeds.** This is the single most important rule of the skill. The whole point is to prevent backlog rot — a seed without a trigger is worse than no seed at all.
- **Triggers should be observable.** Good: "on next live session", "when polymarket switches to v3 API", "if we hit the FK race again". Bad: "someday", "when we have time", "eventually".
- **Don't write seed bodies as essays.** One line per seed in the table. If the idea needs context, the trigger should reference it: `if we revisit auth refactor (see {note-path})`.
- **Project-level capture is rare.** Most things belong to a topic. Resist capturing to PROJECT.md unless it's genuinely cross-topic.
