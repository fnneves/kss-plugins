# Exploration & Planning explorers

**Use when**: the user has a question with multiple viable answers and wants to see the candidates next to each other before picking. Or the user is at "I'm not sure what I want yet" and needs to fan out across directions.

**Defining trait**: the page exists to make a choice possible. Each option gets equal visual weight, and the trade-offs are visible in the same frame.

## Worked example shape

The Phase 1.3 predicate-fix exploration: the user had to choose between three approaches (narrow predicate fix / pull richer Kalshi metadata / use Polymarket per-market data). The page:

1. Names the three (or N) directions up front, in equal-weight cards.
2. For each direction: pro / con / cost / "what changes" laid out the same way so they're scannable as a table-of-cards.
3. A side-by-side data view that grounds the directions in the actual problem (the cell-match table, the bijection trace).
4. Toggles that let the user simulate each direction's effect on a real fixture.

The user picks one (or asks for a fourth). The decision is the deliverable.

## Pattern: code comparison (vertical stack)

The canonical instance of "three approaches" when the directions are **code** (an algorithm, a hook, a component design, an API shape). Each approach needs the full page width for its code block to stay legible — so this pattern stacks vertically instead of tiling columns. The shape (from Thariq's `01-exploration-code-approaches.html`):

1. **Header** with the question ("How should we debounce the task filter?") and a one-sentence framing.
2. **Three `<article class="approach">` blocks**, stacked. Each one contains:
   - **Numbered title** (`<span class="num">01</span> Inline useEffect + setTimeout`) + one-line description
   - **`<pre>` code block** with manual syntax highlighting — `<span class="kw|fn|str|cm">` for keyword/function/string/comment
   - **Symmetrical 2-column pro/con grid** — `.tradeoffs > .row > .cell.pro` / `.cell.con`
   - **Chips row** — 3-4 measurable axes (`Bundle impact: +0.2kb`, `Testability: high`, `Reuse: high`, `SSR safe: yes`)
3. **`<aside class="reco">`** at the bottom — explicit recommendation: "go with 02, here's why, and revisit 03 only if X".

The recipe is **zero-JS**. Static HTML + CSS only. Opens cleanly under `file://`, no quirks.

```html
<article class="approach">
  <header class="approach-head">
    <h2><span class="num">02</span>Custom useDebounce hook</h2>
    <p>Extract the timer into a shared hook under <code>src/hooks/</code>.</p>
  </header>

  <div class="code"><pre><span class="cm">// src/hooks/useDebounce.ts</span>
<span class="kw">export function</span> <span class="fn">useDebounce</span>&lt;T&gt;(value: T, ms = <span class="str">300</span>): T {
  <span class="kw">const</span> [debounced, setDebounced] = <span class="fn">useState</span>(value);
  <span class="fn">useEffect</span>(() <span class="kw">=&gt;</span> {
    <span class="kw">const</span> id = <span class="fn">setTimeout</span>(() <span class="kw">=&gt;</span> setDebounced(value), ms);
    <span class="kw">return</span> () <span class="kw">=&gt;</span> <span class="fn">clearTimeout</span>(id);
  }, [value, ms]);
  <span class="kw">return</span> debounced;
}</pre></div>

  <div class="tradeoffs">
    <div class="row head"><div class="cell">Pro</div><div class="cell">Con</div></div>
    <div class="row">
      <div class="cell pro">Reused across filter, command bar, board search</div>
      <div class="cell con">One more file to maintain and document</div>
    </div>
    <div class="row">
      <div class="cell pro">Trivial to unit test with fake timers</div>
      <div class="cell con">Generic <code>T</code> hides intent slightly</div>
    </div>
  </div>

  <div class="chips">
    <span class="chip">Bundle impact: <strong>+0.2 kb</strong></span>
    <span class="chip">Testability: <strong>high</strong></span>
    <span class="chip">Reuse: <strong>high</strong></span>
    <span class="chip">SSR safe: <strong>yes</strong></span>
  </div>
</article>
```

CSS for the approach block primitives:

```css
.approach { border: 1.5px solid var(--g300); border-radius: 14px;
            padding: 28px 32px; margin: 24px 0; background: var(--paper); }
.approach-head h2 { display: flex; align-items: baseline; gap: 16px; }
.approach-head h2 .num {
  font-family: var(--mono); font-size: 14px; color: var(--clay);
  font-weight: 600;
}
.approach .code pre {
  font-family: var(--mono); font-size: 12.5px; line-height: 1.6;
  background: var(--g100); padding: 16px 18px; border-radius: 8px;
  overflow-x: auto;
}
.tradeoffs { display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
             background: var(--g300); border-radius: 8px; overflow: hidden;
             margin: 16px 0; }
.tradeoffs .row { display: contents; }
.tradeoffs .cell { background: var(--paper); padding: 10px 14px; font-size: 13.5px; }
.tradeoffs .row.head .cell { background: var(--g100); font-family: var(--mono);
                              font-size: 11px; text-transform: uppercase;
                              color: var(--g500); }
.tradeoffs .cell.pro { color: var(--g700); }
.tradeoffs .cell.con { color: var(--g700); }
.tradeoffs .cell.pro::before { content: "✓ "; color: var(--olive); font-weight: 700; }
.tradeoffs .cell.con::before { content: "✗ "; color: var(--clay-d); font-weight: 700; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { font-family: var(--mono); font-size: 11px; color: var(--g500);
        background: var(--g100); padding: 4px 10px; border-radius: 999px; }
.chip strong { color: var(--slate); font-weight: 600; }
aside.reco { margin-top: 32px; border-left: 3px solid var(--clay);
             padding: 16px 0 16px 24px; }
aside.reco h2 { font-family: var(--serif); font-weight: 500; }
```

**The recommendation aside is the load-bearing part.** Don't skip it: a three-up of code without a recommendation is the "recommending in disguise" pitfall (see below) in its most expensive form. Either name the winning approach explicitly *and* explain when to revisit the others, or genuinely strain to make each option look balanced. The aside is how you do (a) cleanly.

When this pattern fits: any "compare these N implementations / hook designs / API shapes / refactor directions" request. For non-code comparisons (visual designs, organizational structures), use the standard column-tiled comparison cards instead — vertical stack is only worth the extra height when code is involved.

## Layout primitives

- **Direction cards in equal columns** (grid-2 or grid-3). Each card same internal structure. Same typeface size for headlines. Symmetry signals "these are siblings."
- **A trade-off table** if the dimensions are formal (cost, scope, risk, time, reversibility). Rows = directions, columns = dimensions, cells = compact verdicts.
- **An interactive probe** if the directions are about behavior, not just description. Toggle which approach is "active" and watch the rest of the page recompute.
- **A "name your fourth" affordance**. Plain text: "If none of these fit, what's the constraint they all miss?" Reminds the user the page is not a closed set.

## Common pitfalls

- **Recommending in disguise.** If you secretly think direction B is right, you'll write direction A and C as straw-men. Either: (a) name your recommendation explicitly at the top so the user can argue with it, or (b) genuinely strain to make each direction look good. Half-hearted three-up cards waste the format.
- **Asymmetric depth.** Three directions, each described in a different shape ("here's the code" / "here are the trade-offs" / "here's a vibe"). Pick one shape and write all directions in it.
- **No grounding.** Three abstract approaches with no fixture / no data / no concrete example are just markdown bullet points in HTML form. Anchor each direction in something real.
- **Decision dressed up as exploration.** If the choice is already made, don't pretend it's open. Write a recommendation and ship.

## Data needs

Often this page works with synthetic or schematic data — the value is in the comparison, not the realism. But if the user has real candidates from a real situation, use those. See `real-data.md` for capture patterns.

## Reference primitives from `assets/template.html`

- `.grid-2` / `.grid-3` for equal-weight option cards
- `.card` with consistent internal structure (`<h3>` title, `<p>` body, optional `.muted` footnote)
- `table.fields` repurposed as a trade-off matrix
- `.toggle-btn` / `.is-on` for "which direction is active right now" controls
- `.compare-row` for direction-vs-direction binary comparisons
