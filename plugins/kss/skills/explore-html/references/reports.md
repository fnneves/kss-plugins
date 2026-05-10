# Reports

**Use when**: the user wants a snapshot of state at a point in time — status of a phase, what we used vs. what's available, an audit, a weekly. The page is a deliverable they (or someone else) reads, not a thinking tool.

**Defining trait**: the page communicates *what is true right now*. Interactivity is optional and serves the reader, not the explorer.

## Worked example shape

A weekly status / audit / "where are we" page:

1. **Headline at the top**: 1-2 sentences naming the verdict (shipped / blocked / partial). No suspense.
2. **Stat strip** with 3-5 numbers — phases complete, tests passing, days since last incident, etc. Big numbers, short labels.
3. **Body sections** organized by audience question: *What got done? What's blocked? What's next?*
4. **Evidence table** if claims need backing — phase X commits, test pass counts, links to artifacts.
5. **Decision callouts** for anything the reader has to act on. Red border. Distinct from informational sections.

The reader can absorb the headline + stat strip in 10 seconds and decide whether to keep reading.

## Layout primitives

- **Headline card** with verdict pill (shipped / blocked / in-progress) and one-line summary. Above the fold.
- **`.summary-stat` chips** in a row for the key numbers. Big number, small label. Color the number by status.
- **Section cards** with consistent depth. Don't go three levels deep on one section and one level on another; readers calibrate from the first section.
- **Evidence tables** that compress: commit / what / when. Don't transcribe full diffs; link or excerpt.
- **Decision callouts** with `.card-finding` (red border) for anything the reader has to do something about.
- **Time stamps everywhere.** A report without "as of YYYY-MM-DD HH:MM" is a fact about now that becomes a lie tomorrow.

## Pattern: status report with hand-drawn bar chart

The killer move for a weekly/sprint status is to embed a tiny hand-drawn SVG bar chart instead of a real chart library. It costs ~50 lines of SVG, has zero dependencies, and looks intentional rather than auto-generated.

```html
<svg viewBox="0 0 640 180" role="img" aria-label="PRs merged per day">
  <!-- gridlines -->
  <line x1="48" y1="20"  x2="620" y2="20"  stroke="#F0EEE6" stroke-width="1"/>
  <line x1="48" y1="60"  x2="620" y2="60"  stroke="#F0EEE6" stroke-width="1"/>
  <line x1="48" y1="100" x2="620" y2="100" stroke="#F0EEE6" stroke-width="1"/>
  <line x1="48" y1="140" x2="620" y2="140" stroke="#D1CFC5" stroke-width="1.5"/>

  <!-- y-axis labels -->
  <text x="40" y="144" text-anchor="end" font-size="11" fill="#87867F">0</text>
  <text x="40" y="104" text-anchor="end" font-size="11" fill="#87867F">1</text>

  <!-- bars: explicit rects, peak in clay, rest in oat -->
  <rect x="64"  y="60" width="56" height="80"  rx="6" fill="#E3DACC"/>
  <rect x="304" y="0"  width="56" height="140" rx="6" fill="#D97757"/>  <!-- peak -->

  <!-- value labels above each bar; weight the peak's number -->
  <text x="332" y="14" text-anchor="middle" font-size="11" fill="#3D3D3A" font-weight="600">4</text>

  <!-- x-axis labels -->
  <text x="92" y="158" text-anchor="middle" font-size="11" fill="#87867F">Mon</text>
</svg>
```

Two design moves make this work:

1. **Peak bar gets the accent color** (clay), everything else gets the muted oat. The eye lands on the spike instantly.
2. **Pair the chart with a one-sentence caption** that names what the spike represents. The reader gets the visual AND the explanation in 5 seconds.

## Pattern: tagged carryover items

For the "what's still in flight" section, use tagged items with owner attribution rather than a status table:

```html
<div class="carryover">
  <div class="carry-item">
    <span class="carry-tag">In review</span>
    <div class="carry-body">
      Workspace export to CSV — waiting on pagination review.
      <span class="who">· Sam Reyes</span>
    </div>
  </div>
  <div class="carry-item">
    <span class="carry-tag">Blocked</span>
    <div class="carry-body">
      SSO group mapping — blocked on staging IdP credentials from IT.
      <span class="who">· Priya Anand</span>
    </div>
  </div>
</div>
```

Three tags is the right number: `In review` / `Blocked` / `Slipped`. More tags = readers stop reading.

## Common pitfalls

- **Dashboard creep.** Reports are not dashboards. Don't add charts that try to be live. A snapshot from real-data is more honest than a chart that looks live but is frozen.
- **No headline.** Burying the verdict in section 4 wastes everyone's time. The first sentence should be the most important sentence.
- **Even-handedness as a tic.** If something's broken, say "broken." If something's blocked, say "blocked." A status report that tries to be balanced about its own bad news is harder to act on.
- **Hidden recency.** If the data was captured a week ago, label it. The reader cannot tell from looking.

## Data capture

Almost always real data. See `real-data.md`. Pin the timestamp into the snapshot file and surface it in the page footer.

## Reference primitives from `assets/template.html`

- `.card` with `.card-finding` variant (red border) for decision callouts
- `.summary-stat` for the stat strip
- `table.fields` for evidence tables
- `.pill-pass` / `.pill-fail` / `.pill-warn` for status indication
- The header line — keep the H1 tight, the subtitle informative, and the timestamp visible
