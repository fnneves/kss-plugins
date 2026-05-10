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
