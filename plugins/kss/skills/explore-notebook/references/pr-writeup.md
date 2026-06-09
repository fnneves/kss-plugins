# PR writeup — author's side

**Use when**: the user has a PR that touches code the reviewer hasn't seen in a while, or whose motivation isn't obvious from the diff alone. They want to write the PR description their reviewers will actually read — not just dump a commit list. The audience is the human who has to approve the merge.

**Defining trait**: this is the *author* explaining *their* change to the reviewer. The structure is narrative, not spatial. Contrast with `code-review.md`, which is the *reviewer* navigating a diff after the fact — same code, different audience, different emphasis.

If those two artifacts read the same, one of them is wrong.

## Worked example shape

A PR titled "Move notification delivery onto a queue":

1. **Headline strip**: PR number, title, file count, +/− line count, branch, author. One line of metadata above everything else.
2. **TL;DR card**: 2–3 sentences naming the problem, the change, and the user-visible effect. The reviewer can stop reading after this and still know enough to /lgtm a low-risk PR.
3. **Why-with-numbers**: motivation tied to concrete impact ("p99 on `comments.create` was 1.4s, this brings it to 180ms in staging"). Skip vague justifications. If you don't have numbers, say "no measurable impact, just hygiene" rather than inventing.
4. **Before / after compare-row**: two parallel cards — "what happens today" and "what happens after this PR." The diff doesn't show this; only the author can.
5. **File-by-file tour ordered for reading**: not alphabetical. Start with the file that explains the change conceptually (usually the new module or the core handler), then the files that follow from it, then test/config last. For each: filename, change-type pill, 1–2 sentence note on *why this file changes* (not what — the diff says what).
6. **Where to focus the review**: explicit pointers. "I want eyes on the lock-ordering in `worker.ts:42–67` — I think it's correct but it's the only place we hold two pg-boss locks at once." This is what reviewers reverse-engineer when you leave it out.
7. **Risk map**: which files are safe, which are worth a look, which need attention. A small visual (3-tier pill list, or a tiny SVG grid coloring files by risk). Optional but high-value when the PR is big.
8. **Test evidence**: which tests were added or modified, what they assert, what manual verification was done. A reviewer who skims tests deserves to find them quickly.

## Layout primitives

- **Headline strip in monospace** — PR #, branch, file count, +/− counts. Looks like a terminal status line. Sets the tone (this is engineering, not marketing).
- **TL;DR as a `.card-emph`** above the fold. The reviewer's eye lands here first.
- **Numbers in `.scoreline`** — "p99 latency · before 1.4s · after 180ms" as a labeled row, not buried in prose.
- **`.compare-row` (lhs / rhs)** for before/after. Clay border on the "before," olive on the "after" — already in the design system.
- **File cards** with `.pill-pass` (added) / `.pill-info` (modified) / `.pill-fail` (deleted) / `.pill-warn` (renamed). Each file gets one card with a 1–2 sentence margin note. Optional: include the relevant hunk in a `<pre>`, but only if it's the kind of code that needs annotation — for routine renames or test additions, the note alone is enough.
- **"Where to focus" as `.finding` blocks** — clay left border, prominent. These are the things the reviewer must not miss.
- **Risk map** as an inline SVG grid (files as cells, color by risk tier) or as a 3-row pill list. Either works; the SVG version reads faster on a big PR.

## Common pitfalls

- **Recreating the diff.** The reviewer can read the diff. The HTML page should add the *why*, the narrative ordering, and the "where to focus" — not the line-by-line.
- **No numbers in the "why."** "This improves performance" is not a motivation. "p99 dropped from 1.4s to 180ms" is. If you don't have numbers, name the qualitative bar you cleared ("eliminates the silent-drop failure mode" is fine; "makes things better" is not).
- **Alphabetical file order.** Forces the reviewer to mentally re-sort into the order that makes sense. Author's job is to do that sorting once, so every reviewer doesn't redo it.
- **Hiding the risk.** If part of the change is risky, say so explicitly. Reviewers trust authors who name their own risks; they don't trust authors who hide them and force the reviewer to find them.
- **Stale before/after.** If you describe "before" behavior based on a memory of how things worked six months ago, your reviewer will catch the inaccuracy and lose trust in the rest. Re-verify against current `main` before writing.
- **Missing the "no-op review path."** For a PR that's mostly refactor, the reviewer needs to see that *nothing user-visible changed*. Say that explicitly. Otherwise they hunt for changes that aren't there.
- **The author's writeup duplicating `code-review.md`'s annotated-diff layout.** They're sibling artifacts, not the same thing. If you find yourself building a diff-with-margin-notes, you're in `code-review.md` territory — switch references.

## Data capture

```bash
# The diff itself (for stats, not embedding)
gh pr view <num> --json files,additions,deletions,headRefName,baseRefName,title,author

# The full diff if you need to inline specific hunks
gh pr diff <num> > /tmp/pr-<num>.patch

# Author's own commits and their messages
gh pr view <num> --json commits --jq '.commits[] | "\(.oid[:7]) \(.messageHeadline)"'

# If there's a linked issue / RFC with motivation context
gh issue view <linked-issue> --json title,body
```

Pull the actual numbers (latency, error rate, etc.) from the user. The agent should not invent metrics — if the user can't supply them, write the qualitative version of the motivation instead.

## Reference primitives from `assets/template.html` and `components.css`

- `.card-emph` for the TL;DR
- `.compare-row` with `.lhs` / `.rhs` for before/after
- `.scoreline` (and `.scoreline.total`) for the numbers row
- `.card` per file with `.pill-pass` / `.pill-info` / `.pill-fail` / `.pill-warn`
- `.finding` for "where to focus the review" callouts
- `<pre>` with `+`/`-` line styling (already documented in `code-review.md`) — use sparingly, only for the hunks that need annotation
- A simple inline SVG for the risk map: rect per file, fill by tier color, label above. ~20 lines of SVG, no library.

## When to ship the HTML page vs. just write it as the PR description

Ask before assuming. Some teams want the PR description in GitHub markdown so it's searchable and shows in `gh pr view`. The HTML companion is then a sidecar (`docs/prs/<num>-writeup.html`) the author links to from the description. Others want the HTML to *be* the description (paste rendered text into the body) — works fine for the prose parts but lossy for the risk map.

Default: write a tight markdown PR description that links to the HTML companion. Keeps the GitHub UI working; the HTML adds the visual layer for reviewers who want it.
