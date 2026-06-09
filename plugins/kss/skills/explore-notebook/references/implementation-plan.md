# Implementation plan — visual companion

**Use when**: a PLAN.md exists (or will exist) but the implementer needs to *see* the plan before they commit to it — milestones on a timeline, the data-flow that connects the new pieces, the inline mockup of the UI affordance, the risk table on one page. The HTML is the **companion** to the plan; the plan is still the source of truth.

**Defining trait**: this page does not replace PLAN.md. It compresses it onto one screen so the implementer can hold the whole shape in their head before opening the IDE. If your team writes a PLAN.md (in kss, via `plan-milestone`), that's the contract; this is the briefing.

## The boundary with PLAN.md

SKILL.md (top level) reserves PLAN-writing for your planning workflow (in kss, `plan-milestone`). This reference does not change that. Specifically:

- **PLAN.md owns**: task breakdown with dependencies, deviation handling rules, success criteria, the file-by-file commit plan, the executable contract.
- **This page owns**: the *picture* of the plan — milestone strip, data-flow diagram, mockup, risk table — so the implementer can grok it in 30 seconds.

If the user asks "write me a plan" and there's no PLAN.md, write the plan first (in kss, run `plan-milestone`). This reference applies when a plan exists (or will) and the user wants the visual companion alongside it.

If the user genuinely wants a one-off implementation plan and is *not* using a planning workflow — they're working in a repo without one and need a single artifact — this page can stand alone. The shape is still "visual companion;" it's just that the prose plan lives in your head or in the user's chat, not in PLAN.md.

## Worked example shape

A 2-week threaded-comments feature plan:

1. **Header strip**: name of the change, effort estimate, surface count, "feature flag · `feature_xyz_v1`" pill. Sets scope at a glance.
2. **Milestone strip** (the dominant visual): 4–6 horizontal cards in a timeline. Each card has the date range, one-sentence description, and the package/file scope. The implementer should be able to point at any milestone and say "I'm on this one."
3. **Data-flow diagram**: inline SVG, ~6–10 boxes, arrows showing how the new feature data moves through the system. Lift the primitives from `explore-html`'s `references/diagrams.md`.
4. **Inline mockup**: a hand-rolled HTML preview of the user-visible affordance — not a Figma export, just enough HTML/CSS to show the UI shape. Renders inline so the implementer doesn't context-switch to a design tool.
5. **The risky code**: 1–3 short `<pre>` blocks of the *new code that is most likely to be wrong*. Not the whole feature — the parts where the author wants the implementer's attention before they write it. Often the migration, the lock-ordering, or the state machine transition.
6. **Risk table**: rows of (risk · likelihood · mitigation · owner). Compact. The point is to surface risks the implementer should already be thinking about, not to be exhaustive.
7. **Test plan**: short list of what needs to be tested at each layer (unit, integration, e2e). One sentence each. The risky-code section tells the implementer where to look; the test plan tells them what to assert.

## Layout primitives

- **Stat strip header**: `.summary-stat` boxes for "effort · ~2 weeks", "surfaces · 3 packages", "new tables · 2". 3–4 numbers max — the implementer's first scan.
- **Milestone cards in `.grid-4`** (or `.grid-3` for shorter plans). Each card gets a date-range eyebrow, an h3, a one-sentence body, and a row of package pills at the bottom. Equal-weight; sibling structure; identical typography across all milestones.
- **Inline SVG diagram for the data flow.** Use the `explore-html` sibling skill's `references/diagrams.md` primitives — the hand-SVG box+arrow skeleton works for both layered systems and request paths. Inline the SVG in a `<section>` of the explorer; do not split into a separate file. Reconcile colors only if needed (the diagrams.md palette already matches explore-notebook).
- **Mockup in a `.card` with a `.mockup` content wrapper.** Just enough HTML to show the affordance. Annotate inline with `.finding` callouts if there's something non-obvious about the design.
- **Risky-code blocks in `<pre class="diff">`** (matching `code-review.md` conventions) — even if the code isn't a diff, the typography is right for "code-the-reader-should-read-carefully."
- **Risk table** as `table.fields` with columns: risk, likelihood, mitigation, owner. Likelihood as a pill (`pill-warn` med / `pill-fail` high / `pill-info` low).

## Common pitfalls

- **Trying to be PLAN.md.** Resist the urge to include task-level granularity (commit list, dependencies, test commands). That's the plan's job. This page is the briefing.
- **Mockup that pretends to be the design.** The inline mockup is a *placeholder* for what the UI will look like — enough fidelity for "you'll see a comment thread below the task card." Don't ship a pixel-perfect Figma copy in HTML; it'll go stale and mislead.
- **Too many milestones.** Six milestones for a one-week feature means each one is half a day, which is task-level granularity, not milestones. Aim for 3–5 across the whole plan; if you have more, you're conflating tasks and milestones.
- **Risk table as ceremony.** If every row says "likelihood: low, mitigation: tests," delete the table. Only list risks the implementer should actually be thinking about. An empty risk table is honest; a padded one is noise.
- **Stale dates.** If the timeline says "Week 1 · Mon–Tue" but the page was generated three weeks ago, the implementer can't tell whether to trust it. Always include a generation timestamp in the footer; consider re-rendering when dates shift.
- **No flag.** Almost every plan worth visualizing is behind a feature flag. If yours isn't, name *why* explicitly — otherwise readers assume you forgot.

## The "where this page exists" question

This page is almost always a persistent deliverable, not a `/tmp/` throwaway. Default location: `.planning/<phase-id>/PLAN-companion.html` (next to PLAN.md). Linked from PLAN.md's frontmatter or top section. Served via the bundled `serve.py` so the team can open it from a phone during planning meetings — live-reload also makes iteration cheap if scope shifts.

If you're in a repo without a planning workflow: `docs/plans/<feature>.html` is the conventional spot.

## Data capture

Often this page is **derived from** an existing PLAN.md or planning conversation. If PLAN.md exists, read it and structure the milestones from its task list:

```bash
# Pull the plan's task headings to seed milestones
grep -E '^## [Mm]ilestone|^### [Tt]ask' .planning/<phase>/PLAN.md

# Pull the file list to scope the surfaces-touched stat
grep -hoE '`[^`]+`' .planning/<phase>/PLAN.md | sort -u
```

If no PLAN.md yet, the agent and user should sketch the milestones in chat first, then the agent generates the page. Resist drafting the visual before the substance is agreed — the milestone cards' equal-weight visual implies "these are agreed," and shipping it as a probe muddles the artifact's purpose.

## Reference primitives from `assets/template.html` and `components.css`

- `.summary-stat` boxes for the header stat strip
- `.grid-4` / `.grid-3` for the milestone row (define `.grid-4` locally if needed: `grid-template-columns: repeat(4, minmax(0, 1fr))`)
- `.eyebrow` for the date-range labels above each milestone card
- `.pill-info` / `.pill-warn` / `.pill-fail` for likelihood; `.pill-oat` for package-scope tags
- `table.fields` for the risk table
- `.finding` for callouts inside the mockup
- `<pre class="diff">` for the risky-code blocks
- Inline SVG lifted from `explore-html`'s `references/diagrams.md` for the data-flow diagram

## Quality bar specific to this category

Beyond the standard explore-notebook quality bar:

- **The milestone strip fits above the fold on a 1280px screen.** The whole point is the implementer sees the shape in one glance. If they have to scroll, the page failed.
- **Every risk listed has a non-trivial mitigation.** "We will test it" is not a mitigation.
- **The data-flow diagram has <10 boxes.** More than 10 means the feature is genuinely complex enough to need its own architecture doc; split it out.
- **Timestamps everywhere.** Footer shows generation time. Date-range eyebrows on milestones show absolute weeks (not "Week 1") so the page doesn't go stale silently.
- **Flag name is visible above the fold.** Implementers should know what to branch behind from the moment they open the page.
