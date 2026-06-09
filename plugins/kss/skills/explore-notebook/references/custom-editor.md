# Custom editors

**Use when**: the user has a decision to make that's hard to express in chat ("which 30 tickets are Now vs. Cut?", "which feature flags do I toggle for this rollout?", "does this prompt template read well across three sample inputs?"). The agent builds a tiny single-purpose tool the user manipulates directly, then exports the result back to chat as markdown or JSON for the agent to act on.

**Defining trait**: bidirectional handoff via the clipboard. The page is not a viewing surface and not a feedback surface — it's a **decision surface**, and the export button at the end is the deliverable.

This is distinct from the other four categories: exploration *compares* options, research *teaches*, reports *summarize state*, code-review *visualizes shape*. None of them write back. Custom editors do — the user manipulates state in the page, then the page emits text the agent reads.

## Worked example shapes

Three canonical sub-patterns, each from Thariq's repo. Pick the closest one and adapt.

### A · Drag-to-sort / drag-to-bucket (e.g. ticket triage board)

The agent fetches 24 open tickets, pre-sorts them into Now / Next / Later / Cut as a best guess, and renders them as draggable cards across four columns. The user drags until the layout feels right, then clicks "Copy as markdown" — clipboard now holds:

```markdown
## Now
- ENG-412 · Comment threads on task cards
- ENG-418 · Realtime fan-out for sync

## Next
- ENG-419 · Notification email digest fallback
...
```

The agent reads the markdown from the next chat message and acts on it (update Linear, update the planning doc, etc.).

**Use when**: ordering / bucketing N items where the right answer is gestalt, not formula. Anything where the user's reaction is *"I'll know it when I see it"*.

### B · Form editor with diff output (e.g. feature-flag config)

The agent loads `flags.production.json`, renders one row per flag with a toggle + dependency hints. As the user toggles, a "Pending changes" panel shows the diff vs. the original. Two export buttons: "Copy diff" (only the lines that changed) and "Copy full JSON" (the whole edited file).

**Use when**: structured config the user knows how to edit conceptually but doesn't want to hand-edit JSON. Especially valuable when there are validation rules (dependency: flag X requires flag Y) that are easier to surface as warnings in the UI than to enforce in their head.

### C · Live-preview with template slots (e.g. prompt tuner)

The agent puts an editable system-prompt on the left and three sample inputs on the right. As the user types in the prompt textarea, all three samples re-render their filled template live. Slot syntax (`{{double_brace}}`) gets highlighted; unknown slots show as warnings. One export button: "Copy prompt."

**Use when**: tuning a single piece of text that has to read well across several scenarios. Prompt engineering is the obvious case; commit-message templates, PR-description templates, alert-message templates all fit.

## Layout primitives

- **One header card naming the decision.** The header is the brief — exactly what the user is being asked to decide and what gets exported when they're done. Never make this implicit; if the user has to scroll to figure out what the tool is for, you wrote it wrong.
- **The editing surface dominates the viewport.** Triage board: the four columns are the page. Form editor: the form is the page. Live preview: the editor + preview pair is the page. Chrome (header, footer, instructions) collapses to <20% of the screen.
- **Persistent export bar.** A sticky footer or top-right button block with "Copy as markdown" / "Copy diff" / "Reset." Always visible — the user is going to look for it.
- **Live validation as inline hints, not modals.** "1 flag is enabled without its prerequisite" appears as a thin clay banner above the form. Never block the user with a confirm dialog.
- **State persistence is optional but cheap.** `localStorage` keyed on the page path. Useful when the user might close the tab mid-decision; harmful if they want to start fresh (always pair with a Reset button).

## The export-button discipline

The clipboard payload is the actual deliverable. Treat it with the same care you'd treat code:

- **Format for the destination.** If the agent reads it back as markdown, emit markdown. If a tool consumes it as JSON, emit JSON. Don't emit "human-readable" hybrid prose the agent has to parse.
- **Stable ordering.** Sort within buckets deterministically (by ID, by user-set position) so re-exporting the same state produces the same string. Useful for diffing across iterations.
- **No agent-confusing decoration.** Skip emoji, skip "🎉 done!" headers, skip the timestamp inside the payload. The agent's next move depends on this text being clean.
- **Flash confirmation.** When the user clicks "Copy," briefly turn the button olive with "Copied ✓" for 1.2s. They need to know the click registered before they tab away.

## Common pitfalls

- **Building an app, not a tool.** Custom editors are throwaway. No login, no settings page, no preferences. If the user has to configure the tool before using it, the tool has already failed.
- **Letting state live only in the DOM.** When the user clicks "Copy," you serialise the current DOM. That's fine, but it means changing the DOM structure changes the export shape. Keep a single source-of-truth JS state object and have the DOM derive from it; export from the state object.
- **No reset.** The user will mis-drag and want to start over. Without Reset they reload the page, which (if state persists) won't help. Reset clears state + re-renders.
- **Pretending it's interactive when it's read-only.** If the page is "look at these 30 tickets," that's a *report* — use `reports.md`. Custom editors must actually take input and emit output.
- **Two competing export formats.** "Copy as markdown" and "Copy as Linear-import-CSV" sounds nice but doubles the test surface and confuses the user about which to click. Pick the one the agent will consume.
- **Drag/drop without keyboard fallback.** Touch and accessibility users can't drag. At minimum, support clicking a card and pressing 1/2/3/4 to assign it to a column, or `<` / `>` to move between adjacent columns.

## Data needs

Always real data. A triage board with fake tickets is theatre. Capture patterns:

```bash
# Linear: open tickets in a cycle
gh api graphql -F query='...' > /tmp/cycle-14-tickets.json

# A feature-flag file from a repo
cat config/flags.production.json > /tmp/flags-snapshot.json

# Prompts and sample inputs from a config dir
cat prompts/support-reply.md > /tmp/prompt.md
cat fixtures/tickets/*.json > /tmp/samples.json
```

Embed as inline JSON (`<script>const DATA = {...}</script>`) for small sets, or as a sidecar (`<script src="data.json"></script>` via `window.SNAPSHOT`) for large ones. See `real-data.md`.

## Required JS surface

This is the one category where vanilla JS gets non-trivial — drag/drop, form binding, live re-render. Stay within these primitives unless the editor is genuinely complex:

- **Drag-between-columns**: HTML5 native `draggable="true"`, `dragstart` / `dragover` / `drop` handlers. ~40 lines.
- **Form binding**: one `change` listener at the form root, derive new state, re-render the affected section. No framework needed.
- **Live preview**: `input` listener on the textarea/contenteditable, debounce 50ms, re-render the preview pane. `contenteditable` is fine for prompt-tuner-style highlighting; keep the caret position with `getCaretOffset` / `setCaretOffset` if you re-render the editor itself.
- **Clipboard**: `navigator.clipboard.writeText(payload)`; fall back to a hidden `<textarea>` + `document.execCommand('copy')` if the call rejects (Firefox file:// quirks).

For drag/drop reorder *within* a list (not just between buckets), and for anything multi-touch, consider htm+Preact via esm.sh — but only in `/tmp/` throwaways. Persistent deliverables stay vanilla.

## Reference primitives from `assets/template.html` and `components.css`

- `.card` for individual draggable items / form rows (toggle `is-dragging` class while in flight)
- `.grid-2` / `.grid-3` / `.grid-4` (define inline if 4-col needed) for the column layout
- `.pill-pass` / `.pill-warn` for inline validation hints
- `.eyebrow` for column labels (NOW / NEXT / LATER / CUT)
- `.scoreline` for "X items in this bucket" counters
- A custom sticky footer with two `.btn-primary` (export) + one `.btn-secondary` (reset)

## Quality bar specific to this category

Beyond the standard explore-notebook quality bar:

- **The exported payload round-trips.** Manually copy → paste into a markdown viewer or `jq` → confirm the output is what you'd expect the agent to read.
- **Reset actually resets.** Including clearing `localStorage` if you use it.
- **The page does one thing.** If you're tempted to add a second editor pane "while you're in here," split it into a second page. One decision per editor.
- **Mobile works** if the user might pull the page up on a phone for triage on the go — drag/drop especially needs touch support (`touchstart`/`touchmove`/`touchend`, not just mouse events).
