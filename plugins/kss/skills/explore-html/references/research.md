# Research & Learning explorers

**Use when**: the topic has structure to teach. The user wants to *understand* a system, an API, a problem mechanism, or a decision tree before deciding what to do about it.

**Defining trait**: the page exists to build a mental model. Interaction is in service of comprehension, not action.

## Worked example shape

The metadata-explorer pattern: the user wants to know what's in an API response and which fields we use vs. ignore. The page:

1. Front-loads 2-3 surprises in a callout. *"You think markets[] is empty; it isn't, the parser strips it."*
2. Tabs across data sources / surfaces (Kalshi /events, Kalshi /markets, Polymarket /events, etc.)
3. Each tab is a field-by-field table with status pills (used / unused / critical) and a "relevance" note column.
4. A side-by-side tab at the end: "what we use today" vs. "what's actually available", framed against named design directions.

The user reads it once, top to bottom, and walks away knowing the surface area better than they did. They don't need to come back to it.

## Layout primitives

- **Front callout** for the 2-3 most important findings. Don't bury the lede in a tab.
- **Tabbed surface tour**. One tab per data source / aspect of the system. Tabs scale better than scrolling for "explore each piece independently."
- **Field tables** with: name, status pill, sample value, note. Sortable optional; usually not needed if the source order means something.
- **Status pills**: `used` (we already consume this), `unused` (available but ignored), `critical` (relevant to the decision at hand). Keep the palette to 3-4 statuses max.
- **Side-by-side comparison** as the closing tab. Two columns: today vs. could-be. Each row is one dimension (date, name, disambiguation, etc.).
- **Design direction cards** at the very end: 2-4 concrete forward paths the user might take, framed against the data the page just walked through.

## Common pitfalls

- **Too much data, not enough emphasis.** A 49-field table where every row looks the same is a wall of text in HTML form. Use status pills, callouts, sort order, and color to direct the eye.
- **Inventing data.** If the API response is real, embed real data. If it's hypothetical, label it clearly. Don't blur the line.
- **Missing the "so what".** Every Research page should end with "given what you just saw, here are the choices." Without that, the user is left holding a fact-list with no decision attached.
- **Over-interactive.** Research pages don't always need toggles. Sometimes a static well-organized table beats a sliders-and-knobs UI. Match interactivity to whether the user actually has a parameter to vary.

## Pattern: concept explainer with live SVG

When the topic is an algorithm or mechanism the user has to *internalize*, the best artifact is an interactive SVG the user can poke at. Slider input → recompute geometry → repaint. The repaint loop is ~20 lines of vanilla JS; no React.

```html
<div class="controls">
  <label>Nodes: <span id="nVal">5</span>
    <input id="nSlider" type="range" min="2" max="12" value="5"/>
  </label>
  <label>Keys: <span id="kVal">16</span>
    <input id="kSlider" type="range" min="4" max="64" value="16"/>
  </label>
</div>
<svg id="ring" viewBox="0 0 260 260"><!-- repainted by render() --></svg>
<div id="readout"></div>

<script>
// Deterministic hash so the demo is STABLE — same N produces the same nodes every time
function h(s) {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = (x * 16777619) >>> 0; }
  return x / 4294967296;
}

function render() {
  const n = +document.getElementById('nSlider').value;
  const k = +document.getElementById('kSlider').value;
  // ...compute node/key positions on the ring using h(`node-${i}`)...
  document.getElementById('ring').innerHTML = /* generated SVG */ '';
}

document.getElementById('nSlider').addEventListener('input', render);
document.getElementById('kSlider').addEventListener('input', render);
render();
</script>
```

The **deterministic hash trick** matters: don't use `Math.random()` for placement, because the user will move the slider and watch the whole picture shuffle in ways unrelated to their input. A stable hash means the visible change is *only* the change they made.

When to reach for this pattern: algorithms (consistent hashing, rate limiting, retry backoff), data structures (B-trees, skip lists), or any concept with a *small number of named parameters* the user can vary.

## Data capture

Almost always wants real data. See `real-data.md`.

## Reference primitives from `assets/template.html`

- `.tab-bar` + `.tab` + `.tab-panel` for the tabbed surface tour
- `.card-finding` for the front callout
- `table.fields` for the field-by-field tables (with `tr.is-used`, `tr.is-unused`, `tr.is-critical` row classes)
- `.compare-row` (grid-2 with `.lhs` and `.rhs` halves) for the side-by-side
- `.summary-stat` chips for "X used / Y unused / Z critical" headlines per tab
