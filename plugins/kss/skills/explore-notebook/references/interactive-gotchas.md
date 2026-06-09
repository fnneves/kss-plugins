# Interactive mode — gotchas learned the hard way

Read this if you're debugging weirdness in the interactive server / widget. Each section here corresponds to a real bug burned into the codebase as a comment or a test, in case future agents start unwinding the fix without knowing why it's there.

## Browser caching of injected assets

**Symptom**: You edit `feedback-widget.css` (or any other `/__exh/` asset), the file on disk has the new content, but the page in the user's browser keeps rendering the old version even after a reload.

**Cause**: Browsers aggressively cache subresources even when the response has `Cache-Control: no-store`. A plain reload often reuses the memory-cached copy from earlier in the same tab's lifetime.

**Fix**: `serve.py` appends `?v=<mtime>` to every injected asset URL. When you edit a file its mtime changes, its URL changes, so the browser is forced to refetch. **Don't remove this.** If you do, the user's tab will start serving stale CSS/JS and you'll waste an hour debugging "fixes" that are correct on disk but never reach the page.

If a user reports "your fix doesn't work" and the data in DevTools says it should — first thought: is their tab actually running the new bundle? Have them empty-cache hard-reload (Ctrl+Shift+R or DevTools Network → Disable cache → reload).

## Unicode glyphs vs OS fonts

**Symptom**: A glyph like `★` or `✓` renders correctly on some systems and as a giant color emoji (28-30px) on others, particularly Linux Chrome. The character ignores your `font-size: 10px`.

**Cause**: Many monospace fonts don't ship glyphs for the Misc Symbols Unicode block (where `★` lives). The browser falls back to whatever covers that codepoint — often a color emoji font like Noto Color Emoji, which renders at its own native size and ignores font-size on the element.

**Fix in this codebase**: Pin glyphs are **inline SVG paths**, not Unicode characters. See `paintPin()` in `feedback-widget.js` and the `PIN_ICONS` object next to it. SVGs render identically across OS / browser / font configuration.

**Lesson**: For UI glyphs that must be a known size — use SVG. Reserve Unicode characters for prose where font-fallback variance is acceptable.

## Live-reload watcher needs to know about injected assets

**Symptom**: You edit `messages-panel.js`, the server's stdout doesn't fire any `reload` event, the page doesn't auto-refresh.

**Cause**: The watcher reads the entry HTML file from disk and watches files it references. The injected `/__exh/` assets aren't in the on-disk HTML — they're only in the post-injection bytes served to the client. So the watcher doesn't know about them.

**Fix in this codebase**: `watch_loop()` in `serve.py` watches BOTH (a) files referenced in the on-disk HTML, AND (b) every path in `INJECTED_FILES`. Editing any injected asset triggers a reload.

## SSE event coverage

**Symptom**: User Alt-clicks an element, leaves a comment, but it doesn't appear in the transcript panel until they reload the page. The feedback IS getting persisted; it just isn't pushed live.

**Cause**: The server originally only broadcasted SSE events for `reply` and `article` — the agent-generated ones — and forgot to broadcast for `feedback` and `message` (the user-generated ones). The panel did its own backfill on page mount via `/transcript.json` but had no live channel for new user input.

**Fix in this codebase**: `_handle_post()` broadcasts `event: feedback` and `event: message` alongside the stdout print. `messages-panel.js` subscribes to all three event kinds via a shared `liveAppender(kind, autoExpand)` helper. Only `reply` auto-expands the panel; the user's own entries don't (avoids surprise pops while they're typing).

## Pin ID drift between client and server

**Symptom**: User clicks a pin on the page expecting it to scroll the transcript to that comment, but the lookup fails / lands on the wrong entry.

**Cause**: The pin had a client-side-generated `ts` (from `new Date().toISOString()` at submit time). The panel entry had the **server's** ts from `record["ts"] = datetime.now(timezone.utc).isoformat()`. These differ by 10-100ms, so they don't match.

**Fix in this codebase**: The server's POST `/feedback` response includes the canonical `record`. The widget reads `j.record.ts` from the response and uses THAT as the pin's `data-exh-entry-id`. Pin id and panel entry id now match exactly.

**General lesson**: When the server is the source of truth for an id, the client must wait for the response to know the id. Don't pre-generate IDs client-side and hope they match.

## Selector stability for dynamic content

**Symptom**: User pins an element inside the article overlay, closes the overlay, reopens it — the pin doesn't reappear.

**Cause**: `selectorFor()` originally anchored at `body` and walked up generating `:nth-of-type(N)` segments. For elements inside `.exh-overlay`, this produced selectors like `div.exh-overlay.is-open:nth-of-type(2) > article.exh-overlay-card > …`. The overlay is destroyed on close and re-mounted on reopen — at which point `:nth-of-type(N)` no longer points at the same div, and the ephemeral class `.is-open` may or may not be present at the moment the selector is evaluated.

**Fix in this codebase**: Two changes in `selectorFor()`:

1. **Anchor at `.exh-overlay-body`** (not `body`) for any element inside an article overlay. The overlay-body subtree is stable across reopens because the overlay structure is generated the same way each time.
2. **Strip ephemeral classes** from the path before building the selector. `EPHEMERAL_CLASSES` covers `is-open`, `is-active`, `is-new`, `is-collapsed`, `is-out`, `is-on`, `is-dragging`, `exh-pin-active`, `exh-alt-down`, `exh-panel-collapsed`, `exh-has-article`.

## Ghost pins inside articles (overlay-relative selectors aren't article-identifying)

**Symptom**: User opens a freshly-attached article they've never pinned anything inside — and pins they don't recognise are already there. The pins are real (in localStorage), just on the wrong article.

**Cause**: The fix above ("anchor at `.exh-overlay-body`") makes selectors *stable across reopens* but **not article-scoped**. Every article overlay uses the same `.exh-overlay-body` class. A pin stored on Article A with selector `.exh-overlay-body div.finding:nth-of-type(1)` will happily match Article B's first `.finding` div when B opens. `repaintAll()` finds it via `document.querySelector` and paints it.

**Fix in this codebase**: Two changes that together scope pins to their article:

1. **`article-overlay.js`** publishes `window.__exhOpenArticleTarget = rec.target_selector` on `openArticle()` and clears it on `closeArticle()`. So at any moment, the rest of the world can ask "which article is open right now".
2. **`feedback-widget.js submit()`** stamps the pin with `articleTarget: window.__exhOpenArticleTarget` when the pinned element is inside `.exh-overlay-body`. Page-level pins get `articleTarget: null`.
3. **`feedback-widget.js repaintAll()`** filters: article-scoped pins (have `articleTarget`) only paint when that exact article is currently open. Defensive: any pin whose selector starts with `.exh-overlay-body` but has *no* `articleTarget` is treated as orphan and skipped.
4. **One-time migration** at module load drops legacy pins that anchor at `.exh-overlay-body` without an `articleTarget` — they pre-date the fix and have no recoverable article identity. Logs the count via `console.info`.

**Lesson**: An "overlay-body-relative" selector reads like article scoping but isn't — the overlay is reused, the article record isn't part of the selector. Whenever a selector is computed against a DOM that gets re-instantiated with the *same shape* but different content, you need a second key (the article id, in this case) to distinguish instances.

## Why pins moved to server-as-source-of-truth

**The version of the fix above (client-side `articleTarget` + LS migration) had a fatal property**: it cleaned the migration-runner's browser, but every *other* browser that already had orphan pins in its own `localStorage` kept showing ghost pins until the user hard-reloaded. The user reasonably pointed out: "a code-side fix can't reach into a user's localStorage that's been sitting stale for hours."

**The lesson**: any time you have *two sources of truth* for the same data — server JSONL + client `localStorage` here — schema migrations leak: the server can be corrected, but every client cache continues to serve the old shape. The next bug in stored pin shape will hit you the same way.

**Fix**: feedback pins are now **server-authoritative**. The client fetches `/feedback.json` on `load` and on every SSE `feedback` broadcast. `localStorage` is no longer used for pins. Cleanup is a one-shot server-side rewrite of `feedback.jsonl` at startup (`_cleanup_orphan_feedback()` in `serve.py`) that drops records with `.exh-overlay-body` selectors lacking `articleTarget`. Backup written as `feedback.jsonl.pre-orphan-cleanup` for recovery.

**Cost**: one extra HTTP request per page load (~5ms to localhost). The SPA feel is unaffected — every subsequent paint still rides the SSE stream, no extra fetches during interaction.

**Don't undo this**: if you find yourself adding `localStorage` writes back to pin state, you're recreating the dual-source-of-truth bug. The only client-side LS keys that should remain are UI-preference scratch (panel width, hint-dismissed, collapsed state) — never authoritative content.

## Repaint timing for re-mounted DOM

**Symptom**: Pin selectors are correct, but pins still don't appear on the overlay when it reopens.

**Cause**: `repaintAll()` originally ran only on `window.load` — once per page lifetime. When the article overlay opens later, its DOM is freshly mounted and has no pins; repaint never re-runs to paint them.

**Fix in this codebase**: `article-overlay.js` dispatches a `CustomEvent('exh:repaint-pins')` right after the overlay is mounted. `feedback-widget.js` listens for it and re-runs `repaintAll()`, painting pins onto the newly-mounted content.

**General pattern**: Any module that mounts DOM dynamically (overlays, modals, accordions) needs to either (a) call `repaintAll()` itself, or (b) dispatch a known event that other modules listen for. Don't rely on `window.load`.

## scrollIntoView walks up to the wrong scroll container

**Symptom**: Clicking a pin scrolls the transcript panel — but to the wrong position. The target entry isn't centered, or the panel scrolls past it.

**Cause**: `Element.scrollIntoView({ behavior: 'smooth', block: 'center' })` walks up the DOM looking for the nearest scrollable ancestor and scrolls *that*. In a layout with multiple nested overflow regions, this can pick the wrong one entirely.

**Fix in this codebase**: Manually compute the target scrollTop against `.exh-msg-body`'s known geometry:

```javascript
const containerRect = body.getBoundingClientRect();
const entryRect = entry.getBoundingClientRect();
const entryTopInBody = (entryRect.top - containerRect.top) + body.scrollTop;
const targetScrollTop = entryTopInBody - (body.clientHeight / 2) + (entryRect.height / 2);
body.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
```

Explicit math, explicit target. No ambiguity about which container is scrolling.

## Z-index layering for overlay + always-on widgets

**Symptom**: When an article overlay is open, the chat input / transcript panel / FAB / popover gets blurred behind the backdrop and becomes unclickable. The overlay's backdrop intercepts clicks meant for the widgets.

**Cause**: The overlay sits at z-index 2147483100. Without explicit z-index, the widgets render at their natural stacking order — which is below the overlay's backdrop element. The backdrop's `backdrop-filter: blur(6px)` paints across everything behind it, blurring the widgets visually too.

**Fix in this codebase**: Widgets that must remain interactive while an overlay is open sit on a tier above 3100:

```
3100  article overlay (backdrop + card)        — page content blurs
3198  transcript panel
3199  panel toggle
3200  chat FAB / chat input controls
3201  chat panel / feedback popover
3202  hint chip
3210  toast
```

Click-outside-to-close uses `.exh-overlay-backdrop.onclick`, NOT a document-level handler. So clicks on widgets (which sit above the backdrop) reach the widget element first; the backdrop never receives them; the overlay stays open.

## Pin glyph centering

**Symptom**: The ★/✓/✗ glyph isn't visually centered in its 16px circle — sits a couple px off.

**Diagnosis**: Don't trust your eyeball — measure with canvas. Paint the glyph onto an off-screen canvas, scan the alpha channel for min/max Y of nonzero pixels, compare the visual midpoint to the circle's bounding-box center.

**Fix in this codebase**: Pin markers are inline-flex with `align-items: center` and `justify-content: center`, with the inner glyph in a span at `line-height: 1`. No transform nudge — adding one introduces error. The SVG icons are sized for a 12×12 viewBox rendered at width:10 height:10, which puts the visible content within the central 10×10 of the 16×16 circle with no padding fiddling needed.

**Lesson**: Optical centering is harder than mathematical centering and easy to overthink. Verify with pixel-level canvas measurement before declaring it broken or fixed.

## File watcher fires on unrelated `/tmp/` writes

**Symptom**: Page reloads constantly when nothing visible has changed. UI state (panel scroll, devtools snapshots, dragged width) keeps resetting.

**Cause**: The watcher used to watch every `.html`/`.css`/`.js`/`.json` file in the served directory. Claude Code itself writes `claude-ctx-*.json` files to `/tmp` constantly; the watcher saw those as "the served directory changed" and broadcast `reload`.

**Fix in this codebase**: The watcher only watches files actually referenced by the entry HTML (via `<link href>` and `<script src>` parsing) plus all `INJECTED_FILES`. Unrelated files in the directory don't trigger reloads.

## Inline chat input vs floating FAB

**Symptom**: User asks for a chat input. You're tempted to add a floating action button + popup composer because that's what most apps do.

**Lesson from this session**: The floating FAB + popup composer was two surfaces for one job. Always-visible textarea at the bottom of the transcript panel is one surface, fewer clicks to compose, no corner clutter. The user explicitly asked us to consolidate. **Default to inline over floating.**

## Reply on the page, not in chat

**Symptom**: User Alt-clicks a finding and asks "what do you mean by X?" You respond in chat. They ask the *same question again* a few minutes later.

**Cause**: The user is reading the browser, not the agent's chat-only response. If your answer doesn't appear in the transcript panel (or as an article overlay), they never see it.

**Lesson**: When a Monitor notification arrives, default to `reply.py` or `article.py`. Use chat only for build status / "I'll do X" coordination, not for answering the user's substantive questions about the page.

## Storage layout

JSONL files live next to the served HTML and are append-only:

- `feedback.jsonl` — user's Alt-click pins
- `messages.jsonl` — user's chat-input sends
- `replies.jsonl` — agent's markdown replies
- `articles.jsonl` — agent's attached articles (last-write-wins per `target_selector`)

The server's `/transcript.json` endpoint interleaves the first three for the panel's mount-time backfill. The fourth is queried separately by `article-overlay.js` for the selector→article map.

LocalStorage on the client is **UI-preference scratch only** — never authoritative content. Keys in use:

- `exh:hint-dismissed` — has the user dismissed the corner hint
- `exh:panel:collapsed` — is the transcript panel collapsed
- `exh:panel:width` — user's preferred panel width

Pin state lives on the server (in `feedback.jsonl`) and is fetched fresh via `/feedback.json` on load + every SSE `feedback` event. See the "Why pins moved to server-as-source-of-truth" gotcha above.

## Article-open handler eats native controls

The article-overlay click handler runs in **capture phase** and walks up from the target looking for `data-exh-has-article`. If it finds one it calls `preventDefault()` + `stopPropagation()` and opens the article — which kills the default behavior of whatever the user actually clicked. Symptom: clicking a `<details><summary>` (or any native control) inside an article-attached container opens the article instead of toggling the disclosure.

Fix: bail at the top of the handler when the click originated on a native interactive element:

```js
if (e.target.closest("summary, a[href], button, input, select, textarea, label")) return;
```

Same pattern as the `.exh-pin` bail. Native semantics win over the synthetic article-open gesture. If you add new interactive primitives that should keep their own click behavior (custom toggles, sliders), extend the bail list.
