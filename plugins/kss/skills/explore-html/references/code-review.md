# Code Review & Understanding

**Use when**: the user has to reason about code spatially — a diff, a call-graph, a module map, a function-level walk-through. Markdown flattens these; HTML preserves them.

**Defining trait**: the artifact mirrors a *shape* the reader has to hold in their head. The shape is the deliverable.

## Worked example shape

A pull request walkthrough:

1. **Headline**: PR title, author, one-line "what changes."
2. **File-by-file diff cards**, each with: filename, change-type pill (added / modified / deleted), the relevant hunk inline, and a margin note on *why* this hunk matters.
3. **Call-graph or module map** if the change crosses files in a non-obvious way. Inline SVG works well for this; D3 is overkill.
4. **Test evidence**: which tests were added or modified, what they assert, where they live.
5. **Reviewer questions** as a closing card: "Things I want eyes on" — explicit, not implicit.

The reader can navigate the change without opening the IDE.

## Layout primitives

- **Diff hunks in `<pre>`** with line-prefix coloring (`+` green, `-` red). Don't try to recreate GitHub's UI — a clean monospace block beats a half-built imitation.
- **Margin notes** to the right of each hunk. Use a 2-column grid: code (60%) / note (40%). The note explains *why*, not *what* (the code says what).
- **File status pills**: added / modified / deleted / renamed. Color-coded but not loud.
- **Call-graph SVG** if relevant. Boxes for functions, arrows for calls. Click a box to highlight its incoming/outgoing edges. Keep it under 20 nodes; if you need more, the page is doing too much.
- **Module map** as a tree or nested boxes. Show the dependency edges your change touches. Don't try to show the whole codebase.
- **Quote-and-respond pattern** for reviewer concerns: "Concern: X. Response: Y." in cards.

## Pattern: code walkthrough with collapsible source + sticky aside

For "trace this through the codebase" requests, the strongest layout is:

- **Main column** — numbered step cards. Each step names the file:line, gives a paragraph of context, and has a `<details>` block to "show source".
- **Right aside** (`position: sticky`) — gotchas / invariants / things-to-remember that stay visible as the user scrolls through steps.
- **One small inline script** — make `<details>` mutually exclusive so opening step 3 closes step 1 (keeps the walkthrough scannable).

```html
<div class="page-with-aside">
  <main>
    <h2>Callstack walkthrough</h2>

    <div class="step">
      <div class="badge">3</div>
      <div class="step-body">
        <div class="step-loc">src/middleware/auth.ts<span class="range"> :14-31</span></div>
        <p>This is the trust boundary. <code>verifyToken</code> reads the cookie,
           resolves the session, and populates <code>req.ctx.session</code>.</p>
        <details class="snippet">
          <summary>show source</summary>
          <pre class="code"><span class="dim">// src/middleware/auth.ts</span>
<span class="kw">export async function</span> verifyToken(req, res, next) {
  <span class="kw">const</span> raw = req.signedCookies[<span class="str">'fw_sid'</span>];
  <span class="kw">if</span> (!raw) <span class="kw">return</span> res.status(401).end();
  // ...
}</pre>
        </details>
      </div>
    </div>
    <!-- more steps... -->
  </main>

  <aside class="sticky gotchas">
    <h3>Gotchas</h3>
    <ul>
      <li>The LRU in <code>SessionStore</code> is per-process — revoking only clears one worker.</li>
      <li><code>expiresAt</code> is <code>timestamptz</code>; don't refactor to raw string.</li>
    </ul>
  </aside>
</div>

<script>
  // Only one snippet open at a time
  const snippets = document.querySelectorAll('details.snippet');
  snippets.forEach(d => {
    d.addEventListener('toggle', () => {
      if (!d.open) return;
      snippets.forEach(o => { if (o !== d) o.open = false; });
    });
  });
</script>
```

The `.page-with-aside`, `.step`, `.badge`, `details.snippet`, and `pre.code` styles all live in `assets/template.html` — lift them, don't redefine.

## Pattern: manual syntax highlighting

Skip Prism/highlight.js. Wrap keywords, strings, and comments in three classes:

```html
<pre class="code"><span class="dim">// comment</span>
<span class="kw">export async function</span> verifyToken(req, res, next) {
  <span class="kw">const</span> raw = req.signedCookies[<span class="str">'fw_sid'</span>];
}</pre>
```

You can highlight *semantically* this way ("this identifier matters") rather than tokenwise ("every keyword in the file"). Cheaper and clearer than a library — and works in offline-safe persistent artifacts.

A fourth class — `.fn` — is available in `assets/template.html` for function-call sites and identifier emphasis (rendered in `--sky`). Use it when the code's structure is *about* which functions are called (most code walkthroughs); skip it when keyword/string/comment is enough.

## Common pitfalls

- **Recreating GitHub.** The user already has GitHub. The HTML page should add what GitHub doesn't — the spatial shape, the why, the cross-file logic.
- **Unhighlighted code.** A hunk with no annotation is just code in a fancier wrapper. Add the margin note that explains the choice.
- **Over-graphing.** A call-graph with 50 nodes is the same as no call-graph — too much to read. Trim ruthlessly to the nodes that matter for the change.
- **Missing the failure mode.** If the PR fixes a bug, show the bug. The before/after is the point. A diff alone makes the reviewer reverse-engineer the bug from the fix.

## Data capture

Real diffs only. Capture via:

```bash
git diff <base>..<head> -- <files> > /tmp/diff.patch
# or for a specific PR:
gh pr diff <num> > /tmp/diff.patch
```

Then parse and embed. Don't paraphrase.

## Reference primitives from `assets/template.html`

- `<pre class="diff">` with `+`/`-` line styling
- `.grid-2` for code-on-left, note-on-right hunks
- `.card` per file
- Inline SVG for call-graphs / module maps. No external libraries — hand-roll it.
- `.pill-pass` / `.pill-fail` / `.pill-warn` for change-type indicators
