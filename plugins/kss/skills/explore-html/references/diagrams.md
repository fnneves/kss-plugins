# Diagrams & SVG figures

**Use when**: the topic is spatial — a pipeline, a request flow, a state machine, a system map. The artifact has to *show* relationships, not describe them in prose.

**Defining trait**: positions, arrows, and adjacency carry meaning. Markdown can't preserve them; ASCII art is the wrong size of effort. Hand-authored inline SVG is the right tool.

## Why hand-SVG over Mermaid

Mermaid is auto-layout. It produces "a diagram" but rarely *the* diagram you'd draw by hand. Symptoms: cramped node labels, arrows that cross unnecessarily, theme-fighting (Mermaid's color system is its own world), and a layout that snaps to grid in a way that looks generated. Hand-SVG is:

- **Precise** — every box, every arrow exactly where you want it
- **Theme-integrated** — uses the same CSS custom properties as the rest of the page
- **Offline-safe** — no CDN dependency, so it works in persistent artifacts immediately
- **Easy to author** — an LLM hand-positions shapes faster than configuring Mermaid

When Mermaid wins: a 30-node dependency graph you genuinely don't want to position by hand. For 2-15 nodes, hand-SVG is faster and prettier.

## The SVG skeleton

```html
<svg class="flow" viewBox="0 0 720 280" role="img" aria-label="Auth flow diagram">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#87867F"/>
    </marker>
  </defs>

  <!-- Boxes (rect + text, paired via x/y coords) -->
  <g>
    <rect class="box" x="30" y="40" width="150" height="64" rx="10"/>
    <text x="105" y="68" text-anchor="middle">Browser</text>
    <text class="sub" x="105" y="84" text-anchor="middle">birchline.app</text>
  </g>

  <!-- Arrow (line with marker-end) -->
  <line class="arrow" x1="180" y1="72" x2="245" y2="72" marker-end="url(#arrow)"/>
  <text class="sub" x="212" y="62" text-anchor="middle">cookie</text>
</svg>
```

Pair the diagram CSS to match the page palette (this lives in `assets/template.html`):

```css
.flow .box { fill: var(--paper); stroke: var(--g300); stroke-width: 1.5; }
.flow .box.hot { stroke: var(--clay); stroke-width: 2; }
.flow text { font-family: var(--sans); font-size: 14px; fill: var(--slate); }
.flow text.sub { font-family: var(--mono); font-size: 11px; fill: var(--g500); }
.flow .arrow, .flow .edge { stroke: var(--g500); stroke-width: 1.5; fill: none; }
```

## Three marker-arrow variants for typed edges

When the diagram has *kinds* of arrows (success vs. failure, sync vs. async), define one marker per kind in `<defs>` and color the corresponding edges to match.

```html
<defs>
  <marker id="arrow"       ...><path ... fill="#87867F"/></marker>  <!-- neutral -->
  <marker id="arrow-rust"  ...><path ... fill="#B04A3F"/></marker>  <!-- failure -->
  <marker id="arrow-olive" ...><path ... fill="#788C5D"/></marker>  <!-- healthy -->
</defs>

<path class="edge no"  d="..." marker-end="url(#arrow-rust)"/>
<path class="edge yes" d="..." marker-end="url(#arrow-olive)"/>
```

## Pattern: annotated flowchart with click-to-deepen

A vertical flowchart where each node is clickable; clicking opens a side panel with the step's title, metadata, body text, and a small code block. The whole thing fits in ~30 lines of vanilla JS.

```html
<div class="page-with-aside">          <!-- 2-column: flowchart left, detail aside right -->
  <svg viewBox="0 0 620 920">
    <g class="node" data-k="ci">
      <rect x="210" y="92" width="200" height="48"/>
      <text x="310" y="112" text-anchor="middle">CI · lint + typecheck</text>
    </g>
    <!-- ...more nodes... -->
  </svg>

  <aside class="sticky" id="detail">
    <h3 id="d-title"></h3>
    <div id="d-meta" class="muted"></div>
    <p id="d-body"></p>
    <pre id="d-code" class="code"></pre>
  </aside>
</div>

<script>
const DETAIL = {
  push: { title: "git push main", meta: "trigger · 0s",
          body: "A push to <code>main</code> fires the workflow.",
          code: "on:\n  push:\n    branches: [main]" },
  ci:   { title: "CI · lint + typecheck", meta: "~2 min",
          body: "Runs ESLint and tsc --noEmit in parallel.",
          code: "jobs:\n  lint:\n    run: pnpm lint" },
  // ...one entry per data-k...
};
document.querySelectorAll('g.node').forEach(g => {
  g.addEventListener('click', () => {
    const d = DETAIL[g.dataset.k]; if (!d) return;
    document.getElementById('d-title').textContent = d.title;
    document.getElementById('d-meta').textContent  = d.meta;
    document.getElementById('d-body').innerHTML    = d.body;
    document.getElementById('d-code').textContent  = d.code;
  });
});
</script>
```

**Diamond-shape gate** for decision nodes — instead of `<rect>`, draw a path:

```html
<g class="node gate" data-k="gate-tests">
  <path d="M310,262 L352,294 L310,326 L268,294 Z"/>
  <text x="310" y="298" text-anchor="middle">pass?</text>
</g>
```

## Pattern: SVG figure sheet (illustration palette)

The page is *itself a library of reusable assets*. Each illustration is a `<figure>` with caption and a "Download SVG" button that extracts the inline `<svg>` and triggers a download. The user opens the page once and grabs whichever assets they need for downstream artifacts.

```html
<figure>
  <div class="canvas">
    <svg id="ill-queue" xmlns="http://www.w3.org/2000/svg"
         width="720" height="320" viewBox="0 0 720 320">
      <defs>
        <style>
          /* Self-contained text styles — travel WITH the SVG when extracted */
          .m { font-family: ui-monospace, monospace; font-size: 11px; }
          .s { font-family: system-ui, sans-serif; font-size: 12px; }
        </style>
      </defs>
      <!-- ...illustration content... -->
    </svg>
  </div>
  <figcaption>
    <div class="cap-text">
      <div class="cap-title">Queue</div>
      <div class="cap-sub">For "How jobs are picked up" — intro page header.</div>
    </div>
    <button class="dl" data-target="ill-queue"
            data-filename="jobs-queue.svg">Download SVG</button>
  </figcaption>
</figure>

<script>
document.querySelectorAll('button.dl').forEach(btn => {
  btn.addEventListener('click', () => {
    const svg = document.getElementById(btn.dataset.target);
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = btn.dataset.filename;
    a.click(); URL.revokeObjectURL(url);
  });
});
</script>
```

**Key trick:** put text styles in `<defs><style>` *inside* the SVG, not in the page's CSS. When the user downloads the SVG and opens it elsewhere, the styles travel with it.

Add a "Palette & rules" section at the bottom of the page that documents which colors mean what (clay = primary action, olive = success, rust = error) so anyone reusing the assets stays on-palette.

## Common pitfalls

- **viewBox out of sync with content.** If you draw a 720×320 illustration but set `viewBox="0 0 800 400"`, you'll get unexpected whitespace. Match the viewBox to the actual content bounds.
- **Fighting with auto-layout.** If a Mermaid diagram is 80% right but the last 20% won't behave, switch to hand-SVG. Don't burn hours coaxing Mermaid into the layout you want.
- **Forgetting `role="img"` and `aria-label`.** SVG diagrams are images for accessibility. Always include them.
- **Using `transform: translate()` to position when you could just set `x/y`.** Direct coordinates are easier to debug than nested transforms when the diagram has ~10+ shapes.
- **Embedded base64 PNGs instead of vector.** Defeats the point. If it's a diagram, draw it in vector.

## Reference primitives from `assets/template.html`

- The `.flow` SVG CSS (box, text, sub, arrow, edge.yes, edge.no)
- `.page-with-aside` two-column layout with sticky aside for the detail panel
- `pre.code` block class for the detail-panel code samples
- `<details>/<summary>` if the click-target pattern feels too heavy
- `.muted` for sub-text on nodes
