# Replies & articles — agent → page communication

Once the interactive server is running, you have two ways to respond on the page (in addition to whatever you say in chat):

| Surface | Tool | Use when |
|---|---|---|
| **Reply** in the transcript panel | `reply.py` | Short editorial answer — one or two paragraphs, maybe a callout |
| **Article** in a click-to-open overlay | `article.py` | Long-form deep dive — multi-section, with structure |

Both render the **same markdown extensions** through the same renderer (`render-reply.js`). The difference is just where the rendered fragment lands on the page.

## Page first, chat second

When the user submits a comment via Alt-click or the chat input, you'll see it as a Monitor notification. **Default to replying on the page**, not just in your chat-only response. The user is reading the browser, not the terminal log; chat-only replies disappear into your conversation history but never reach them visually.

A good rule of thumb: every Monitor notification you act on should result in *either* a `reply.py` call (short answer), an `article.py` call (long-form), or a direct edit to the served HTML. If you find yourself responding in chat without one of those, the user can't see your response.

This is the most consistent friction point. The transcript panel is *the* conversation surface.

## Authoring with markdown

You write CommonMark markdown plus a small set of editorial primitives. The renderer is `server/render-reply.js`; it parses input on stdin and emits sanitized HTML on stdout.

### Standard markdown (works everywhere)

- `### Heading` → `<h3>` (h1, h2, h3, h4 all work; reply uses h3 by convention since the panel is narrow)
- `*italic*` renders in clay (the design system's signature emphasis treatment)
- `` `code` `` → inline monospace with subtle grey background
- Bullet lists, numbered lists, paragraphs, blockquotes, fenced `` ``` `` code blocks (auto-wrap inside the panel — no horizontal scroll)
- Links — but external links should be rare; the explorer is the artifact

### Editorial primitives — `:::name` fenced divs

Four `:::name` blocks map to the design-system primitives. Each opens with `:::name` and closes with `:::`. Body is markdown.

```
:::finding
#### Heading
Body paragraph. The most important point goes here — left-clay-border
emphasis tells the reader "look at this."
:::
```

| Primitive | When to reach for it | Visual |
|---|---|---|
| `:::finding` | The most important point in the response | Left clay border + soft ivory fill |
| `:::verdict pass` | A yes/no answer with rationale | Olive border, "pass" tone |
| `:::verdict fail` | A no answer | Clay border, "fail" tone |
| `:::verdict warn` | A caveat or "yes but…" | Sky border, "info" tone |
| `:::card` | One option in a multi-option response | Neutral border, clean fill |
| `:::card-rec` | The *recommended* option among several | Clay border + "RECOMMENDED" badge above-left |

The `:::verdict` block takes a variant (`pass` / `fail` / `warn`) right after the name on the same line. The others take no variant.

### Inline pills — `[tone:label]`

Single-word tags inside prose. Tones match the design system: `clay`, `olive`, `sky`, `oat`, `slate`, `used`, `unused`, `critical`, `info`, `pass`, `fail`, `warn`.

```
The [clay:critical] field for resolution is `outcomes` —
the rest are [info:display strings].
```

Bracket pairs that look like markdown links (followed by `(`) are left alone — the inline pill rule only fires on `[tone:label]` not followed by `(`.

## Replies — short editorial answers

```bash
echo '### Going with option B

*Promoting section 04 to a topic exploration.*

:::finding
#### Why
The field catalog frames it as data; the [clay:critical] double-name
belongs in its own section.
:::

:::verdict pass
#### Verdict
Approved.
:::
' | python3 $CLAUDE_PLUGIN_ROOT/skills/explore-notebook/server/reply.py
```

Flags:
- `--md "..."` — inline markdown instead of stdin
- `--in-reply-to <id>` — link to a specific user comment (cosmetic for now)
- `--dry-run` — render only; print HTML to stdout, don't POST

The reply appears at the bottom of the transcript panel with an "ASSISTANT" clay eyebrow. If the panel is collapsed, it auto-expands. New replies flash for ~1.5s.

**Size cap: 2KB rendered HTML.** If the answer is longer, send multiple replies, or — better — write an article.

## Articles — long-form deep dives

When the user asks "explain X" or "unpack this topic", and a 2KB reply won't do the job, attach a click-to-open article instead.

```bash
echo '### The shape of Polymarket'\''s data

*The same two player names appear in three different fields, in three different shapes.*

:::finding
#### What you literally get
Every per-market entry in `polymarket_event.markets[]` contains:

- `outcomes: ["Rublev", "Fokina"]` — array, two names
- `groupItemTitle: "Rublev"` — string, just one
- `polymarket_event.title: "Rublev vs Davidovich Fokina"` — display string
:::

### Why this matters

The compound-surname bug came from parsing `title`. Using `outcomes`
sidesteps the parse entirely.

:::card-rec
#### Recommendation
Consume `markets[].outcomes` directly. No `last_word` heuristic, no
abbreviation prefix predicate, no fragile string handling.
:::
' | python3 $CLAUDE_PLUGIN_ROOT/skills/explore-notebook/server/article.py \
    --target '#findings > div.finding:nth-of-type(2)' \
    --title 'The Polymarket double-naming structure'
```

When you attach an article:

1. The target element gets a small clay `↗` indicator (visible on hover)
2. Plain click on the element → centered modal overlay opens
3. Page behind the overlay **blurs 6px and dims to 40%** — the article is the only thing in focus
4. Escape or click-outside closes
5. The Alt-click feedback and chat input both still work on top of the overlay (their z-index sits above the overlay)

**Size cap: 16KB rendered HTML.** Much more generous than replies — articles are meant to be substantive.

### When to article vs. reply

- **Reply** for: yes/no answers, choosing between options, addressing a specific pin, status updates, "I'll do X"
- **Article** for: explaining a concept, walking through a problem mechanism, defining jargon, deep dives on a topic the user keeps returning to

If the user has pinned the *same element* multiple times, that's a signal — they want a bigger answer than the inline space allows. Promote to an article.

### Target selectors

`--target` is a CSS selector that uniquely identifies the element on the page. The `selectorFor()` helper in `feedback-widget.js` produces these automatically for Alt-clicks, but for articles you usually know what you want to target.

Selector rules learned the hard way:

- **Anchor at a stable container**, not at `body`. For overlay content use `.exh-overlay-body`. For main page content use `body` is fine if the structure is static, or anchor at a section id like `#findings`.
- **Strip ephemeral classes** like `is-open`, `is-active`, `is-new`, `is-collapsed`. These come and go during interaction.
- **Prefer `#id` over path-based selectors** when an id exists. They're robust to layout changes.
- **`:nth-of-type(N)` is fine for static structure**, dangerous for dynamic content.

## The blur-to-focus UX principle

This was the key UX insight from the session that birthed this pattern:

> When the user wants to deep-dive a topic, *remove distraction*. Don't inline the long form — overlay it, blur the source. The article is the only thing visible at full clarity. Escape returns them to where they were.

This is why the article pattern works better than promoting the topic to its own section on the main page:

- Inline section growth pushes other content around, loses scroll position, breaks spatial memory
- Article overlay preserves the page's layout and the reader's scroll position
- The blurred backdrop is a strong "you are reading this thing now" signal — much stronger than a section anchor

When you reach for this pattern, also reach for the language: "Click to read the deep dive" / "[clay:↗] expands the topic" / "Open the article to see the full breakdown." It's a click-to-focus affordance.

## Common patterns

### Answering a recurring pin

If the user has pinned the same element 3+ times, that's the signal to write a real article, not yet another short reply.

```bash
python3 $CLAUDE_PLUGIN_ROOT/skills/explore-notebook/server/article.py \
  --target '<the selector from the recurring pin>' \
  --title '<the topic, stated plainly>' \
  < /dev/stdin
```

### Multi-stage explanation

Open with a `:::finding` summary of what's about to be unpacked, then use normal markdown paragraphs for the explanation, then close with a `:::card-rec` for the actionable conclusion. The shape: hook → unpack → recommend.

### Side-by-side comparison

`:::card` blocks render in normal block flow. Two of them stacked still reads as compare/contrast; if you want true side-by-side, fall back to writing a markdown table.

### Quoting code or JSON

Triple-backtick fenced blocks wrap correctly inside the article and panel. Indent JSON for readability — the auto-wrap keeps long lines visible without horizontal scroll.

## Pitfalls

- **Don't write replies as HTML.** The renderer takes markdown; passing raw HTML loses the editorial primitives and the renderer's escaping. Use `--md` or stdin.
- **Don't mix replies and articles for the same topic.** Once you've written an article, future related responses are *additions to the article* or *short replies linking to the article*, not new full-form replies.
- **Don't auto-create articles.** Articles take real estate (a modal overlay) and shouldn't appear without intent. Attach them when the user signals they want a topic unpacked, not preemptively.
- **Don't forget the page is the conversation.** When the user submits via Alt-click, they're asking a question on the page. Answer on the page.
