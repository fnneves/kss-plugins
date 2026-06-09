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
