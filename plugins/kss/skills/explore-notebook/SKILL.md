---
description: Build a served, interactive HTML notebook — a live control room for a project where the user points at the page and talks to the agent directly, rather than a throwaway static explorer. This variant runs a bundled local server (live-reload over SSE plus a real HTTP URL reachable from a phone or another device on the LAN) and wraps the page in a two-way conversation surface — Alt-click any element to pin feedback, type into an always-on chat panel, and the agent replies with rendered markdown and click-to-open articles directly on the page, all interleaved in a persistent transcript. Trigger when the user wants a persistent dashboard or control room they will iterate on over multiple rounds while reading it in the browser, asks to "serve it", wants live-reload, wants to give feedback by clicking elements, wants to interact with the agent from the page itself, or will open the page from another device. Also trigger for ordinary "explore" / "compare side-by-side" / "understand visually" / "play with the variables" / "an explorer" requests when the work is iteration-heavy or feedback-driven. For a quick one-shot static page with no server, no live-reload, and no feedback loop, prefer explore-html instead.
---

# explore-notebook

When the user wants to *understand* something — a problem space, an API surface, three implementation options, a data shape — a single self-contained `.html` file is often a better deliverable than a markdown wall.

The premise (after Thariq's *Unreasonable Effectiveness of HTML*): the artifact you'd rather read is the artifact that gets read. Spatial information, comparison, and "what changes when I change this" are exactly what HTML/CSS/JS does and markdown does not.

This skill triggers when there's a topic to explore. It produces one HTML file the user opens in a browser, plays with, and either keeps or throws away.

## When to use this skill

**Reach for it when:**

- The user wants to compare 2+ options, fixtures, designs, approaches, or data points side-by-side
- The information is structural or spatial (API surface, module map, decision matrix, before/after diff)
- The user wants to *interact* — toggle variants, slide a parameter, type input and see output
- You'd otherwise produce a long markdown document with multiple sections the user has to mentally cross-reference
- The user said "explore", "play with", "see", "compare", "what if", "show me side-by-side", "I want to understand visually"

**Do NOT reach for it when:**

- The user asked a simple factual question
- The deliverable is code that ships into a real codebase (use the existing edit/write workflow)
- The user explicitly asked for prose, a summary, or a plan document
- The work is already in a structured planning artifact (PLAN.md, SUMMARY.md — e.g. a kss milestone) and the user wants to *read* it, not explore it
- A static screenshot or table would communicate the same thing in 10 seconds

When in doubt, ask. One short clarifying question beats a 60KB HTML file the user didn't want.

## The eight categories you'll most often build for

This skill is scoped to eight work types. Each implies a different artifact shape. Pick deliberately — the shape is half the value.

| Category | Use when | Pattern lives in |
|---|---|---|
| **Exploration & Planning** | User has a question with multiple viable answers; wants to see them next to each other | `references/exploration.md` |
| **Research & Learning** | Topic has structure to teach (API surface, problem mechanism, decision tree); user wants to *understand*, not act | `references/research.md` |
| **Reports** | Snapshot of state at a point in time (status, audit, comparison of "what we use vs. what's available") | `references/reports.md` |
| **Code Review & Understanding** | Surface a code-shape, diff, or call-graph the user has to reason about spatially | `references/code-review.md` |
| **PR writeup (author-side)** | User has a PR and needs to explain it to reviewers — motivation, before/after, file-by-file *why*, where to focus | `references/pr-writeup.md` |
| **Implementation plan (visual companion)** | PLAN.md exists or will exist; the implementer needs to *see* the milestones, data-flow, and risks on one page | `references/implementation-plan.md` |
| **Custom editor** | User has a decision hard to express in chat — drag/sort, form-with-diff, live-preview — that exports markdown/JSON back to the agent | `references/custom-editor.md` |
| **Illustrations** | User is writing prose (blog post, README, docs) and needs per-section header SVG figures, not technical diagrams | `references/illustrations.md` |

If the request fits none of these (deck, prototype, animation sandbox), default to the closest neighbour and lean on judgment. The eight references are starting points, not cages.

## Embedded diagrams — lift from `explore-html`, don't freestyle

When an explorer or explainer *contains* an SVG diagram (a flow, a state machine, an architecture map), do not draft the SVG from memory. Freestyling a non-trivial diagram is the single most common cause of "fix this diagram" feedback rounds — labels that overlap nodes, edges that cross through other nodes, arrows without markers.

The sibling **`explore-html`** skill (same plugin) ships `references/diagrams.md` — a hand-SVG playbook: the `<defs>` marker pattern, the `rect` + `text` + `.sub` label primitive, palette-matched diagram CSS, and the "why hand-SVG over Mermaid" rationale. It's the diagram reference for this whole `explore-*` skill family.

**STOP before writing any SVG with >3 nodes or any backward / return edges.** Do this first, in order:

1. **Read** the sibling `explore-html` skill's `references/diagrams.md` (`../explore-html/references/diagrams.md` relative to this skill).
2. **Lift** the primitives wholesale: the `<defs>` marker block, the `rect` + `text` + `.sub` node pattern, and the diagram CSS that binds fills/strokes to the page's CSS custom properties. Put every edge label on its own filled background so it never overlaps an edge or node.
3. **Then** write the SVG, adapting the lifted primitives to your nodes/edges. The palette already matches the editorial template (`#FAF9F5` / `#141413` / `#D97757`), so no recolor is needed.

For diagrams that meet *all* of (≤3 nodes, no backward edges, no curved paths, ≤5 labels), you can freestyle — but it's almost never the right call, since adding even one back-edge takes you over the threshold.

**Pitfall — the freestyle trap:** I have seen agents draft an inline `<svg>` from memory with hand-tuned coordinates, then ship it, then hit "labels overlap the nodes / arrows cross through other nodes / no legend" feedback. The fix every time is *exactly the same*: open `diagrams.md`, copy the primitive structure, redraw. Don't pay the round-trip cost — do the lift on the first pass.

## How to run the skill

### 1. Capture the topic

Before writing one byte of HTML, surface what's actually being explored. Often this is implicit in the conversation. If not:

- What's the question or topic?
- What are the inputs (data, options, fixtures)? Are they real or made-up?
- What does the user need to *see* or *toggle* to learn what they want to learn?
- What's the success criterion — what understanding should the user walk away with?

If real data is available (API responses, file contents, codebase facts), **fetch or read it first** before drafting. A page built on real data is dramatically more useful than one built on plausible-looking placeholders. See `references/real-data.md` for capture patterns.

### 2. Pick the category and read its pattern reference

One of the eight. If unsure, ask. Each reference file has:
- A worked example you can lift from
- The standard layout primitives for that category
- Common pitfalls

### 3. Choose where the file goes — and how it'll be opened

- **For exploration during a conversation**: `/tmp/explorer-{topic}.html`. Throwaway by design. Mention to the user it's at `/tmp` so they don't expect it to persist.
- **For a deliverable they want to keep**: ask them where. Common: `.kss/topics/<topic>/explorers/`, `docs/`, repo root.
- **Real-data sidecar**: if the page reads from a JSON snapshot, write the snapshot next to the HTML and load via `<script src="...">` (works under `file://`; `fetch()` does not).

**How will it be opened?** This determines whether you serve or just write the file:

- **Laptop file browser, single use, no live edits expected** → `file://<absolute-path>` is fine.
- **Anything else** — phone / other device on the LAN, a clickable URL in a chat UI, remote machine, expected iteration during the session, page reads sibling JSON via `fetch()`, page is a phone-companion app (UAT checklist, mobile sketch, etc.) — **serve it.** `file://` cannot be reached from another device, cannot be reliably clicked from many chat UIs, blocks `fetch()`, and does not auto-reload when you edit. The default for any persistent `.kss/` or `docs/` deliverable should be to **serve via the bundled `serve.py`** (see "Interactive mode" below) even if the feedback widget is not needed — live-reload alone justifies it.

Quick decision: if you're about to give the user a `file://` link, ask yourself "can they open this from their phone?" If no, serve it instead.

### 4. Draft the HTML

One file. No build step. CDN policy is tiered by destination: `/tmp/` throwaways may pull from CDN freely (richer output, used now and closed); anything saved to a persistent location (`.kss/topics/<topic>/explorers/`, `docs/`, the repo) must be offline-safe so it still opens on a plane in six months — either pure vanilla, or vendor the library inline. See "Rich libraries" below for what to reach for when vanilla isn't enough.

**Design system: Editorial HTML Design System.** The skill ships with two CSS files:

- `assets/colors_and_type.css` — token source of truth (palette, type stacks, spacing scale, radii, motion). **Lift these; do not redefine.**
- `assets/components.css` — composition primitives (cards, pills, sec-head, tables, nav.toc, buttons, finding, verdict, scoreline, compare-row, stat-strip, dir-badge, footer, etc.). Strictly built from the tokens above.

`assets/template.html` is the canonical skeleton. Two patterns for using the CSS:

- **Linked** (`.kss/`, `docs/` deliverables): copy both `.css` files next to the HTML and `<link>` them. Smaller HTML; consistent across pages; survives offline because the files are co-located.
- **Inlined** (`/tmp/` throwaways): paste the contents of both files into a single `<style>` block inside the HTML. One file, no co-located assets.

Either way, **start from `assets/template.html`** — do not re-derive the layout primitives.

**Non-negotiables** (from the editorial design system, do not violate):

- Three fonts only (serif / sans / mono); every type role maps to exactly one.
- `--ivory #FAF9F5` is the page background, never pure white. `--paper #FFFFFF` is reserved for card surfaces so cards lift off the page without needing shadows.
- `--clay #D97757` is the only saturated color — use sparingly: italic H1 emphasis, numbered indices, link underlines, the occasional pill border.
- **No dark-theme dashboard styling.** If the user explicitly asks for dark mode, ask first — the default is paper.
- **No emoji.** Status uses pills (`pill-pass` / `pill-fail` / `pill-warn` / `pill-used` / `pill-unused` / `pill-critical` / `pill-info`), not 🟢🔴.
- **No gradients** (except small inline figure fills), **no backdrop-blur**, **no drop-shadows as a primary affordance.**
- Sentence case for headings; UPPERCASE mono only for eyebrows and indices.
- Hover lifts cards 3px; press never shrinks (paper doesn't squish).
- Iconography is hand-rolled inline SVG with the classed palette (`.cl`, `.ol`, `.oa`, `.wh`, `.fl`, `.sl`, `.ln`, `.lc`, `.da`) — never an icon font.

**Canonical status taxonomy** (matches `FieldTable.jsx` in the bundled UI kit):

- `used` — we already consume this (olive)
- `unused` — available but ignored (neutral gray)
- `critical` — relevant to the decision at hand (clay)
- `info` — neutral status / additional context (sky)

Plus the verdict-style aliases: `pass` (olive), `fail` (clay), `warn` (sky).

Quality bar (don't ship below this):
- Opens cleanly via the serving method you chose in step 3 (served URL or `file://`)
- Reads on a 1280px laptop screen without horizontal scroll
- If a phone companion: reads on a 375px viewport without horizontal scroll either
- One clear thing the user should look at first, above the fold
- Interactive elements actually work (toggles, inputs, selectors all wire to live recompute)
- No console errors
- Fonts/colors are deliberate, not random
- **For any embedded SVG diagram**: you read `explore-html`'s `references/diagrams.md` and lifted its primitives *before* writing the SVG. Edge labels sit on filled background pills. Marker definitions are in `<defs>`. There is a legend if any edge convention is non-obvious (e.g. dashed vs solid). No label overlaps any node or other label.

### 5. Verify before reporting done

Open the file mentally — walk through it top to bottom and ask: "If I'd never seen this conversation, would I understand the topic?" If no, you're missing context the user already has but the page assumes. Add it.

For pages with data: re-check the data hasn't been silently truncated or scrambled by JS-string escaping. A 5-second sanity check (`grep` a key value in the saved file) saves a 30-second round trip.

**For pages with SVG diagrams**: open the page in Chrome DevTools MCP (if available) and run a label/node overlap check before claiming done. Don't ship a diagram because "it looks fine in code" — run the actual check. Pattern that works:

```js
// In chrome-devtools-mcp evaluate_script, scoped to your diagram's container
() => {
  const bbs = (sel) => [...document.querySelectorAll('YOUR_DIAGRAM_SELECTOR ' + sel)]
    .map(el => el.getBoundingClientRect());
  const labels = bbs('.edge-label-bg');   // or whatever class your label pills use
  const nodes  = bbs('.node-rect');       // or your node class
  const overlap = (a, b) => !(a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top);
  const issues = [];
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) if (overlap(labels[i], labels[j])) issues.push(['label-label', i, j]);
    for (let n = 0; n < nodes.length; n++)      if (overlap(labels[i], nodes[n]))  issues.push(['label-node', i, n]);
  }
  return { labelCount: labels.length, nodeCount: nodes.length, issues };
}
```

If `issues` is non-empty, fix the routing of those specific edges (curve around the colliding node, or move the label along the path) before shipping. If Chrome DevTools MCP is not available, screenshot via whatever browser-screenshot tool you have and inspect; manual check is still better than no check.

### 6. Hand off

Tell the user:
- **Open URL** — the served `http://127.0.0.1:<port>/` if you served it, otherwise `file://<absolute-path>`. **Never give just a bare path** ("the file is at …") when the user has to open it: that puts the "how do I view this?" step on them and they will hit `file://` problems you should have already solved.
- One sentence on what the page is for
- 2-3 specific things to try in it (which preset to start on, which toggle reveals the surprise, which tab shows the comparison)
- Whether you want feedback on the page itself or whether the page is supposed to enable a downstream decision

Do not write a long summary of the page's contents — the page is the summary.

## Interactive mode (live-reload + inline feedback)

For iteration-heavy work — when the user wants to point at the page and say "change *this*" rather than describe it in chat — the skill ships a small local server that wraps any explore-notebook page with a full two-way conversation surface.

The interactive mode is **bidirectional**:
- **User → agent**: Alt-click any element to leave feedback, type in the chat input, click pinned elements to navigate
- **Agent → page**: reply with markdown-rendered editorial content, attach click-to-open articles to specific elements
- Both sides interleave in a left-side transcript panel that survives reload

### The full surface

1. **Live reload via SSE.** Edits to the served HTML or any injected asset auto-reload the page. Cache-busted per-asset via `?v=<mtime>` so browsers always pick up the latest bundle.

2. **Alt-click feedback (user → element pin).** Hold Alt (Option on macOS) and click any element → popover with `keep` / `remove` / `change to…` quick buttons + free-form textarea. Submit → POST to `/feedback` → a small clay-bordered circle pin appears on the element (★ comment / ✓ keep / ✗ remove / ~ change, rendered as inline SVG for OS-independence). **Click the pin** to jump the transcript panel to the matching comment. Pins persist across page reloads via `localStorage`, and across article-overlay close/reopen via an `exh:repaint-pins` event.

3. **Inline chat input (user → agent, no selector).** The bottom row of the transcript panel is an always-visible textarea + send button. Enter submits, Shift+Enter for newline. POST to `/message`. Use for general comments not tied to a specific element. (Replaced the earlier floating FAB.)

4. **Markdown replies (agent → transcript).** `reply.py` accepts markdown, renders it server-side via vendored markdown-it into design-system HTML, POSTs to `/reply`, and the SSE channel pushes the fragment to every open tab. The transcript panel appends it with a clay "ASSISTANT" eyebrow. **Default to replying on the page**, not in the agent's chat-only context — the user reads the page, not the terminal. See `references/replies-and-articles.md`.

5. **Click-to-open articles (agent → focused overlay).** `article.py --target '<selector>' --title '<title>'` attaches a long-form article to any element on the page. The element gets a clay `↗` indicator on hover; click it → centered modal overlay opens, page blurs 6px + dims 40% behind. **Reach for this when a reply is too short for the topic but inline content would derail page flow.** See `references/replies-and-articles.md`.

6. **Resizable transcript panel.** Drag the right edge to resize (280–720px). Width persists per-browser via localStorage. Use the `‹` / `›` toggle on the panel edge to collapse/expand.

### Data layout

Three JSONL files live next to the served HTML:

```json
// feedback.jsonl — user's Alt-click element pins
{"ts":"2026-05-11T08:14:25...","page":"/","selector":".exh-overlay-body div.finding:nth-of-type(1)",
 "snippet":"…","action":"comment","body":"focus more on this topic"}

// messages.jsonl — user's chat-input sends
{"ts":"2026-05-11T08:19:33...","page":"/","body":"make section 04 the headline"}

// replies.jsonl — agent's markdown-rendered editorial replies
{"id":"r1778487265-3","ts":"2026-05-11T08:14:25...","html":"<h3>…</h3><div class=\"finding\">…</div>",
 "md":"### …\n\n:::finding\n…","in_reply_to":null,"page":"/"}

// articles.jsonl — agent's click-to-open articles, keyed by target_selector
{"id":"a1778488072-1","ts":"…","target_selector":"#findings > div.finding:nth-of-type(2)",
 "title":"The Polymarket double-naming structure","html":"…","md":"…"}
```

### When to use interactive mode

The bundled server has two value-adds: (1) **live-reload + a real HTTP URL** — useful on essentially every persistent page, (2) **feedback widget + transcript panel + agent replies** — useful only when iterating with feedback. Don't conflate them: you can serve a page without using the feedback surface.

**Serve the page** (the live-reload + URL part) when:
- The user will open it from a different device than the agent is running on (phone via LAN, tablet, second laptop) — `file://` is unreachable from another host
- The page is a phone companion (UAT checklist, mobile mockup, anything PWA-shaped) — those *must* be served because the laptop's `file://` doesn't reach the phone
- The page uses `fetch()` to load a sibling JSON snapshot — `file://` blocks `fetch` cross-origin
- You expect to edit the HTML during the session — live-reload turns each edit into instant feedback
- The user clicks links from a chat UI that doesn't follow `file://` — many do not

**Also use the feedback widget** when:
- The user has explicitly asked to give feedback on the page itself
- The page will go through multiple revisions and chat-based descriptions of "the third row from the top of section 02" are getting awkward
- You expect to send substantive editorial replies (finding + verdict + recommendation), not just yes/no
- The user is reading the page in real time while you're editing it

**Skip the server entirely** only when:
- The page is a `/tmp/` throwaway you expect to live for one minute *and* the user will open it on the same laptop
- The user is on a remote machine that cannot reach `localhost:7777` and won't tunnel

### Launching it

Always launch via `Monitor`, not `Bash` with `run_in_background`. Monitor streams stdout to the conversation in real time, so feedback/message lines surface as chat notifications. Bash only emits when the task ends.

**Pick a port before launching.** Default is `7777`, but other concurrent sessions may already hold it. Check first and increment to the next free port if so — running two servers on the same port silently fails or fights the other session:

```bash
# pick first free port in 7777..7790
for p in $(seq 7777 7790); do
  ss -tln 2>/dev/null | grep -q ":$p " || { echo $p; break; }
done
```

Then launch:

```python
Monitor(
    description="feedback + messages from <page>",
    persistent=True,
    timeout_ms=3600000,
    command=(
        "python3 -u $CLAUDE_PLUGIN_ROOT/skills/explore-notebook/server/serve.py "
        "/path/to/page.html --port <chosen_port> 2>&1 | "
        "grep --line-buffered -E "
        "'^\\[feedback\\]|^\\[message\\]|error:|Traceback|Address already in use|Serving|Bound'"
    ),
)
```

(The grep filter includes `Serving|Bound` so the startup line surfaces as a notification — you know the server is up without polling.)

Tell the user: open `http://127.0.0.1:<chosen_port>/`. **Do not open via `file://` — the widget and live-reload both need the server to POST to.** If the user is opening from a phone or another device on the LAN, give the LAN IP of the agent's host instead of `127.0.0.1` (e.g. `http://10.100.0.3:<port>/`). `localStorage` is keyed per host:port, so state saved on `localhost` is a different store than state saved on the LAN IP — pick one URL per session.

**Sidecar / port discovery.** On launch, `serve.py` writes a `.exh-server.json` next to the served HTML containing the pid, port, host, and absolute html path. `reply.py` and `article.py` use this sidecar to find the right server when you pass `--html <path>` — no need to remember the port number, and **no cross-contamination across concurrent sessions** (a wrong port would silently land replies on someone else's page; the sidecar verifies the served file matches before sending). The sidecar is deleted on clean shutdown.

### Reading what the user sends

Every POST is echoed to stdout as one line plus persisted to its JSONL file:

- `[feedback] <action> on <selector> — "<body>"` (Alt-click pin)
- `[message] <body>` (chat input)

The Monitor filter delivers both as notifications. Apply changes to the HTML directly — the page auto-reloads, pins persist client-side.

For backfill: `tail -n 20 /tmp/feedback.jsonl /tmp/messages.jsonl /tmp/replies.jsonl`. The server also serves `/transcript.json` (interleaved, ts-sorted) for the panel's mount-time backfill.

### Replying — page first, chat second

When a notification arrives, default to replying **on the page** via `reply.py`, not in the agent's chat-only response. The user is reading the page in their browser; chat-only replies vanish into the terminal log. See `references/replies-and-articles.md` for the full pattern, primitives, and authoring conventions.

**Always pass `--html <served-file-path>`**, not `--port`. The sidecar resolves the correct port and refuses to send if the served file doesn't match. Using `--port` (or the old default of 7777) is how replies have ended up on the wrong page in concurrent sessions; the script will now error out if neither is given. Canonical invocation:

```bash
python3 $CLAUDE_PLUGIN_ROOT/skills/explore-notebook/server/reply.py \
  --html /path/to/page.html \
  --page / \
  <<'EOF'
**Your markdown reply here.**
EOF
```

`article.py` takes the same `--html` flag — same rules.

### Stopping the server

`TaskStop` the Monitor task, or the user kills it. The server has no persistent state beyond the JSONL files, which the user can keep or delete.

## Rich libraries (for `/tmp/` throwaways)

Vanilla JS + the template primitives cover most explorers. When the topic genuinely needs more — real charts, 3D, math, diagrams, components, in-browser compute — reach for one of these. All are single `<script>` or ESM imports; no build step. Use only in `/tmp/` artifacts (CDN-dependent) unless you're prepared to vendor the file.

| Need | Reach for | One-liner |
|---|---|---|
| Real charts (scatter, line, faceted) | Observable Plot | `<script src="https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6"></script>` |
| Lower-level data viz, custom shapes | D3 | `<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>` |
| 3D / WebGL | Three.js | `<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js"}}</script>` |
| Math typesetting | KaTeX | `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css"><script src="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.js"></script>` |
| Diagrams (flow, sequence, ER, architecture, etc.) | **`explore-html` skill** (sibling) | Not a library — lift inline SVG primitives from `explore-html`'s `references/diagrams.md`. Palette already matches the editorial design system. Avoid Mermaid: its generic dashboard look fights the paper aesthetic. |
| Audio / synthesis | Tone.js | `<script src="https://cdn.jsdelivr.net/npm/tone@14"></script>` |
| Run Python in the browser | Pyodide | `<script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"></script>` |
| Components without a build step (default) | **htm + Preact** via esm.sh | `<script type="module">import { html, render } from 'https://esm.sh/htm/preact'; import { useState } from 'https://esm.sh/preact/hooks';</script>` |
| Literal JSX (only if htm syntax is awkward) | React + Babel standalone | `<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script><script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script><script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>` then `<script type="text/babel">…</script>` |

**Picking between htm+Preact and Babel-standalone:** prefer htm+Preact. Babel-standalone ships ~3MB of compiler to the browser and re-parses on every reload — fine for a 50-line demo, painful past that. Only use it when the explorer is genuinely tiny *and* the user wants to read literal JSX.

**When NOT to reach for these:** if the page is a static comparison or matrix, vanilla + the template primitives is faster to write, smaller, and offline. Don't pull D3 to render a 6-row table.

**If the deliverable needs to persist** (`.kss/`, `docs/`, repo): either drop back to vanilla, or download the library file (`curl -o lib.js https://...`) and `<script src="lib.js">` it as a sidecar so the bundle survives a CDN going dark.

## Iteration pattern

The user will often want changes after seeing the first draft. Expect this; the first draft is a probe, not a finished artifact. Common iteration shapes:

- "Add fixture X" → extend the dataset, rerun
- "What if we toggled Y" → add a new control, wire to recompute
- "Highlight where Z fails" → add visual emphasis (color, badge, dedicated panel)
- "Make it shorter / longer" → re-balance density vs. completeness
- "Save it to <path>" → move file, update any internal anchors

Edit the existing file rather than rewriting from scratch unless the structure has fundamentally shifted.

## What this skill does NOT do

- It does not ship code into the production codebase
- It does not produce design system docs that need to live in the repo (use the design-system pattern only for throwaway exploration)
- It does not solve the underlying problem; it surfaces the problem space so the user can think about it
- It does not write PLAN.md. It *may* produce a visual companion to one — milestone strip, data-flow diagram, risk table on a single page — when the implementer needs to *see* the plan, not just read it. PLAN.md remains the source of truth; your planning workflow owns it (in kss, `plan-milestone`). See `references/implementation-plan.md` for the boundary.

## File layout

```
explore-notebook/
├── SKILL.md                       ← this file
├── references/
│   ├── exploration.md             ← side-by-side option compare, decision matrices, fan-out
│   ├── research.md                ← teaching artifacts: API surface, problem mechanism, walkthroughs
│   ├── reports.md                 ← state snapshots, audit views, "what we use vs available"
│   ├── code-review.md             ← annotated diff, module map, call-graph spatial views (reviewer side)
│   ├── pr-writeup.md              ← PR explanation for reviewers (author side): motivation, before/after, where to focus
│   ├── implementation-plan.md     ← visual companion to PLAN.md: milestone strip, data-flow, risk table
│   ├── custom-editor.md           ← agent builds a tiny tool → user decides in it → exports markdown/JSON back
│   ├── illustrations.md           ← editorial header figures for prose (blog/README/docs) — figure-sheet pattern
│   ├── real-data.md               ← capturing real API/file data into a snapshot the page reads
│   ├── replies-and-articles.md    ← (interactive) agent→page replies + click-to-open articles
│   └── interactive-gotchas.md     ← (interactive) cross-OS pitfalls and how to avoid them
├── assets/
│   ├── colors_and_type.css        ← token source of truth (palette / type / spacing / radii / motion)
│   ├── components.css             ← composition primitives built from the tokens
│   ├── template.html              ← starting skeleton; <link>s both CSS files
│   ├── live-reload.js             ← (interactive) SSE client; auto-reloads on disk change
│   ├── feedback-widget.js         ← (interactive) Alt-click pinning + popover + SVG pin markers
│   ├── feedback-widget.css        ← (interactive) styling for the feedback widget
│   ├── messages-panel.js          ← (interactive) left-side transcript panel + chat input
│   ├── messages-panel.css         ← (interactive) panel styling, resize handle, drag logic
│   ├── article-overlay.js         ← (interactive) click-to-open article modal + SSE listener
│   └── article-overlay.css        ← (interactive) overlay with blurred-backdrop focus
└── server/
    ├── serve.py                   ← (interactive) stdlib HTTP server, SSE, JSONL persistence
    ├── render-reply.js            ← (interactive) Node script: markdown → editorial HTML
    ├── reply.py                   ← (interactive) CLI: send a reply to the panel
    ├── article.py                 ← (interactive) CLI: attach an article to a target selector
    └── vendor/                    ← vendored markdown-it dependencies (~2MB, offline-safe)
```

Read the relevant references file when you've picked a category. Don't read all eight — they're independent.

**Working with the assets**: for a `/tmp/` throwaway, inline both CSS files into a single `<style>` block. For a persistent (`.kss/` / `docs/`) deliverable, copy both `.css` files next to the HTML and use the `<link>` pattern in `template.html`. Either way, do not redefine the tokens or the primitives.
