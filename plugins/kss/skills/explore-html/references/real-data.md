# Capturing real data into a snapshot the page reads

Pages built on real data are dramatically more useful than pages built on plausible-looking placeholders. The user can see what's actually there, not what you guessed would be there. And the surprises that real data exposes are usually the most valuable thing the page surfaces.

This file describes the patterns for capturing data once and embedding it in a way the page reads cleanly.

## Decide: inline vs. sidecar

**Inline (embedded as a JS const inside the HTML):**
- For datasets under ~30KB
- When the page should be a single self-contained file (most common)
- Simpler — just one file to ship and open

**Sidecar (separate `.js` file alongside the `.html`):**
- For datasets ~30KB and up
- When you might want to refresh the data without rewriting the page
- When the data is reusable across multiple explorer pages
- Costs: two files to colocate; user has to remember both

If unsure: inline. Refactor to sidecar if the inline version makes the HTML hard to scroll through.

## Inline pattern

```html
<script>
  const SNAPSHOT = /* json */ {
    "events": [...],
    "meta": { "fetched_at": "2026-05-10T..." }
  };
</script>
```

When the data is JSON you've captured to a file:

```bash
# Capture to disk first
python -c "...your fetch..." > /tmp/data.json

# Then inline. Use Read to load it into context, paste into a <script>
# wrapping with `const SNAPSHOT = ` and a trailing `;`.
```

## Sidecar pattern

This is what the metadata-explorer uses. The HTML loads a JS file via `<script src>`:

```html
<script src="api-snapshots.js"></script>
<script>
  // window.SNAPSHOT is now defined
  const evt = window.SNAPSHOT.polymarket_event;
  // ...render
</script>
```

The sidecar file:
```js
window.SNAPSHOT = {
  "polymarket_event": { ... },
  "kalshi_event": { ... }
};
```

To produce it from raw JSON:
```bash
printf 'window.SNAPSHOT = ' > /tmp/snapshot.js
cat /tmp/raw.json >> /tmp/snapshot.js
printf ';\n' >> /tmp/snapshot.js
```

**Important:** `<script src>` works under `file://`. `fetch()` does NOT — browsers block it as a CORS violation. Always use `<script src>` for sidecar loading; never `fetch('./data.json')`.

## Capture scripts — patterns by source

### From a Python module / API client

```python
# Save the script to /tmp/capture.py so the user can re-run it
import json
from predkit.kalshi.search import search_events

out = { "events_search": search_events(query='Rublev', series='KXATPMATCH', limit=5) }
with open('/tmp/snapshot.json', 'w') as f:
    json.dump(out, f, indent=2, default=str)
```

Always trim before embedding:
- Strip very long string fields (URLs, full clobTokenIds) to first 100-200 chars + `...`
- Drop image/icon URL fields if you're not displaying images
- Limit arrays to first 2-5 items if the field is a long list

### From the codebase (file contents, not a live fetch)

Just `Read` the file and embed the relevant slice. Don't paraphrase the source — embed it verbatim and let the page render it.

### From git

```bash
git log --oneline -20 > /tmp/recent-commits.txt
git diff base..head -- <file> > /tmp/diff.patch
gh pr view <num> --json title,body,commits > /tmp/pr.json
```

Always capture once; don't have the page try to run git itself.

## Pin the timestamp

Every snapshot should embed when it was captured:

```js
window.SNAPSHOT = {
  "captured_at": "2026-05-10T14:48:00Z",
  "source": "polymarket-gamma-api",
  ...
};
```

The page should display this somewhere visible (header subtitle, footer). A snapshot without a timestamp becomes a lie the moment the underlying data changes — and the user has no way to tell the page is stale.

## Common pitfalls

- **Silent truncation.** The dataset embeds fine but a few key strings got cut off mid-character because of an indent / quote / encoding issue. Always grep the saved file for a few values you know should be there before opening the page.
- **Hand-typing JSON.** Don't. Always capture with a script, even if the script is 5 lines. Hand-typing creates synthetic-looking data with no provenance.
- **Embedding huge clobTokenIds / wallet addresses / etc. unchanged.** They blow up the file with no display value. Trim to first 80 chars + `...` for any opaque-token field over 100 chars.
- **CORS-blocked `fetch()`.** Use `<script src>` for sidecar. The 5 minutes you spend debugging "why doesn't the data load" you could have spent on the page itself.
- **No re-run script saved.** When the user wants fresh data, they shouldn't have to reverse-engineer how you captured it. Save the capture script alongside the snapshot (`/tmp/capture.py` or `/tmp/capture.sh`).

## Verify before opening the page

Five-second sanity check after capturing:

```bash
# JSON shape valid?
python -c "import json; print(len(json.load(open('/tmp/snapshot.json'))))"

# Key values present?
grep -c "expected_marker_string" /tmp/snapshot.json

# Reasonable size?
wc -c /tmp/snapshot.json
```

If any of these surprise you, fix before building the page on top.
