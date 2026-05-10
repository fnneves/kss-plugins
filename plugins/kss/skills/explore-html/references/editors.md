# Editors (manipulable boards, exports, scratchpads)

**Use when**: the user wants to *manipulate* state in the page and *export the result* somewhere else. The page is a temporary scratchpad UI, not the final artifact. The artifact is what gets copied out — markdown, JSON, config, prompt.

**Defining trait**: the page has live state, controls to mutate it, and an export-back affordance. Unlike a Report (snapshot for someone to read), an editor is a *tool you use* — drag, click, type, then take the output elsewhere.

This pattern doesn't fit cleanly into the four scoping categories (Exploration / Research / Reports / Code Review) — editors live alongside them. Reach for this reference when none of the four feels right and the user wants to *do something to* the data, not just *see* it.

## When this fits a kss workflow

The triage board is a perfect tool for the moments between kss skills:

- **Backlog grooming** — drag captured backlog items into Now/Next/Later, copy the markdown, paste into the topic's `BACKLOG.md` or `MILESTONES.md`.
- **Milestone scoping** — list candidate scope items, place them across upcoming milestones, export to the milestone's `PLAN.md`.
- **Spike priority** — when there are 4 candidate spikes, drag them across Will-do / Maybe / Skip and export to `.kss/spikes/triage.md`.

The page is throwaway; the markdown it produces is durable.

## Worked example: kanban triage board

A 4-column board for triaging tickets into Now / Next / Later / Cut. The user drags cards between columns, filters by tag, and copies the result as markdown to paste into a real planning doc.

The shape (from Thariq's `18-editor-triage-board.html`):

1. **Header** — eyebrow + h1 + rationale paragraph + a live summary chip (`12 now · 8 next · 4 later · 4 cut`).
2. **Top bar** — filter badge (click a tag to filter; click again to clear) and action buttons: `Copy as markdown` and `Reset`.
3. **4-column grid** of `<section class="col">` elements, each with a head (label + count), body (cards), and foot (point estimate).
4. **Cards** as `<article class="ticket" draggable="true">` with ID, tag pill, estimate, title, and owner avatar.

The user opens the page, drags 10 minutes' worth of cards into the right columns, clicks Copy, pastes into the planning doc. Done.

## The state model

Keep state in a single in-memory array. Don't try to persist to localStorage unless the user asks — the export-back step is the persistence.

```js
var COLUMNS = [
  { key: 'now',   label: 'Now',   rationale: 'Blocking the release or losing data.' },
  { key: 'next',  label: 'Next',  rationale: 'High-leverage, well-scoped.' },
  { key: 'later', label: 'Later', rationale: 'Real, but can wait a cycle.' },
  { key: 'cut',   label: 'Cut',   rationale: 'Not this quarter.' }
];

var INITIAL = [
  { id: 'BIR-241', title: 'Fix sync conflict toast', tag: 'bug', est: 'M', owner: 'AK', col: 'now' },
  // ...one entry per card
];

var tickets = INITIAL.map(t => Object.assign({}, t));   // live state
var activeFilter = null;                                 // tag or null
var dragId = null;                                       // currently dragged card
```

## HTML5 drag-and-drop

Native API is enough; no library needed. Three event handlers do all the work:

```js
// On each card: make it draggable + emit dragstart/dragend
card.draggable = true;
card.addEventListener('dragstart', e => {
  dragId = t.id;
  card.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', t.id);
});
card.addEventListener('dragend', () => {
  dragId = null;
  card.classList.remove('dragging');
});

// On each column: accept drops, highlight on hover
col.addEventListener('dragover', e => {
  e.preventDefault();                       // REQUIRED — otherwise drop won't fire
  e.dataTransfer.dropEffect = 'move';
  col.classList.add('dragover');
});
col.addEventListener('dragleave', e => {
  if (!col.contains(e.relatedTarget)) col.classList.remove('dragover');
});
col.addEventListener('drop', e => {
  e.preventDefault();
  col.classList.remove('dragover');
  var t = tickets.find(x => x.id === dragId);
  if (t && t.col !== c.key) { t.col = c.key; render(); }
});
```

The `e.preventDefault()` on `dragover` is **load-bearing** — drop events silently don't fire without it. The most-common bug in HTML5 drag-and-drop.

CSS for drag affordances:

```css
.ticket { cursor: grab; user-select: none; }
.ticket.dragging { opacity: 0.4; cursor: grabbing; }
.col.dragover { background: var(--g100); border-color: var(--clay); }
```

## Render loop

Wipe-and-rebuild is simpler than diffing. With ~30-100 cards the perf is fine.

```js
function render() {
  COLUMNS.forEach(c => { colBodies[c.key].innerHTML = ''; });

  var counts = {}, pts = {};
  COLUMNS.forEach(c => { counts[c.key] = 0; pts[c.key] = 0; });

  tickets.forEach(t => {
    colBodies[t.col].appendChild(makeCard(t));
    counts[t.col] += 1;
    pts[t.col] += EST_PTS[t.est] || 0;
  });

  COLUMNS.forEach(c => {
    colCounts[c.key].textContent = counts[c.key];
    colFoots[c.key].innerHTML = 'estimate <b>' + pts[c.key] + ' pts</b>';
  });
}
```

If the dataset grows past ~500 cards, switch to diffing. Until then, don't preempt-optimize.

## Click-tag-to-filter

Tags on each card double as filter toggles. Click a `bug` tag → all non-`bug` cards dim. Click again → clear filter.

```js
tag.addEventListener('click', e => {
  e.stopPropagation();                                  // don't trigger card drag
  activeFilter = (activeFilter === t.tag) ? null : t.tag;
  render();
});

// In makeCard:
if (activeFilter && t.tag !== activeFilter) card.classList.add('dim');
```

The `.dim` utility is in `assets/template.html`. Filter state lives in the model, not the DOM — `render()` reapplies it on every paint.

## Export-as-markdown (the load-bearing part)

The whole point of the editor is the export. Build a structured markdown doc from current state; copy to clipboard with the modern API plus a fallback for older browsers / `file://`.

```js
function buildMarkdown() {
  var lines = ['# Cycle 14 triage', ''];
  COLUMNS.forEach(c => {
    var rows = tickets.filter(t => t.col === c.key);
    var pts = rows.reduce((s, t) => s + (EST_PTS[t.est] || 0), 0);
    lines.push('## ' + c.label + ' (' + rows.length + ' · ' + pts + ' pts)', '');
    lines.push('_' + c.rationale + '_', '');
    rows.forEach(t => {
      lines.push('- **' + t.id + '** ' + t.title + ' — ' + t.tag + ', ' + t.est + ', ' + t.owner);
    });
    lines.push('');
  });
  return lines.join('\n');
}

copyBtn.addEventListener('click', () => {
  var md = buildMarkdown();
  function flash() {
    copyBtn.textContent = 'Copied ✓';
    setTimeout(() => { copyBtn.textContent = 'Copy as markdown'; }, 1200);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(md).then(flash, flash);
  } else {
    // Fallback: temporary textarea + execCommand. Works under file:// in older browsers.
    var ta = document.createElement('textarea');
    ta.value = md;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    flash();
  }
});
```

**Always include both clipboard paths.** `navigator.clipboard` is blocked under `file://` in some browsers; the `execCommand` fallback works there.

## Reset (always include)

The user *will* drag cards into wrong columns and want to start over. Reset re-applies `INITIAL` and re-renders.

```js
resetBtn.addEventListener('click', () => {
  tickets = INITIAL.map(t => Object.assign({}, t));
  activeFilter = null;
  render();
});
```

## Common pitfalls

- **Forgetting `e.preventDefault()` on `dragover`.** Drop events silently won't fire. Most-common bug in HTML5 drag-and-drop.
- **Persisting state to localStorage by default.** Don't — the user came to make decisions and export them. State in the page tab is correct; Reset relies on it being ephemeral. Add localStorage only if the user explicitly asks.
- **Diffing the render too early.** A wipe-and-rebuild for ~100 cards runs in <2ms. Switch to diffing when the user reports lag — not before.
- **No reset button.** Drag-and-drop is fiddly; users misplace cards. Reset is cheap and saves the page.
- **Only `navigator.clipboard`, no fallback.** Breaks under `file://` in some browsers. Include `execCommand`.
- **Hand-entered state.** `INITIAL` should come from real data — captured from the user's tracker, repo, or backlog. See `real-data.md`. Hand-typed example tickets look synthetic.

## Other editor variants

The triage board is the entry-point editor. Other patterns from Thariq's set worth lifting when the user needs them:

- **Feature-flag editor** (Thariq `19-editor-feature-flags.html`) — toggle a set of flags, see the resulting JSON config rendered live, download or copy. Different controls (switches instead of drag), same export-back loop.
- **Prompt tuner** (Thariq `20-editor-prompt-tuner.html`) — structured editing of a prompt (system / user-template / examples), live preview, copy the assembled string. Forms + textareas + live string concat.

When the user asks for one of those, browse the Thariq page as visual reference and adapt the patterns above (state model, render loop, export, reset).

## Reference primitives from `assets/template.html`

- `.card` for ticket cards (with the drag-shadow added when `.dragging` is applied)
- `.dim` utility for filtered-out items
- `.pill-clay` / `.pill-olive` etc. for tag pills
- `button` styling for the copy / reset / filter affordances
- `.muted` for rationale paragraphs and counts
- The `--clay-d` / `--olive` / `--sky` palette for owner avatars (consistent across the page)
