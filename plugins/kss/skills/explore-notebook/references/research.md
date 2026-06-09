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

## Data capture

Almost always wants real data. See `real-data.md`.

## Reference primitives from `assets/template.html`

- `.tab-bar` + `.tab` + `.tab-panel` for the tabbed surface tour
- `.card-finding` for the front callout
- `table.fields` for the field-by-field tables (with `tr.is-used`, `tr.is-unused`, `tr.is-critical` row classes)
- `.compare-row` (grid-2 with `.lhs` and `.rhs` halves) for the side-by-side
- `.summary-stat` chips for "X used / Y unused / Z critical" headlines per tab
