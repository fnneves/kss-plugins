# kss — Keep Shit Simple

**Solo dev framework with reduced ceremony and high customization.**

Skills to keep solo dev workflows organized and always ready to pick back up where you left them. Some lifecycle ideas (topic isolation, codebase map, trigger-conditioned seeds) are inspired by [GSD](https://github.com/gsd-build/get-shit-done); the multi-agent ceremony is not.

Mechanics: topics isolate unrelated work tracks; milestones scope finite work inside a topic; spikes test ideas before committing; canonical-KB captures durable cross-topic insights. An optional self-improvement loop (`skill-autopsy`) sharpens skills based on how you actually use them.

All state lives under `.kss/` at the project root.

## Commands

| Command | Layer | What it does |
|---|---|---|
| `/kss:scaffold-project` | Setup | Bootstrap the `.kss/` shell. Run once per project. |
| `/kss:map-codebase` | Setup | Generate or refresh the 4-file codebase snapshot under `.kss/codebase/`. |
| `/kss:new-topic` | Lifecycle | Create a topic; offers activation and claiming inherited `## Carryover` handoffs. |
| `/kss:plan-milestone` | Lifecycle | Scope + plan a milestone. `--topic <slug>` targets a non-active track. |
| `/kss:complete-milestone` | Lifecycle | Close the active milestone (writes SUMMARY.md); offers to archive the topic (`--archive-topic` skips ahead). |
| `/kss:start-session` | Session | Load context for the active topic + milestone; nudges triggered seeds and stale spikes. Run at session start. |
| `/kss:spike` | Session | Throwaway exploration ending in a verdict (promote / kill / pivot). |
| `/kss:wrap-up` | Session | Append a LOG entry, refresh STATE, optionally write a note; offers to close the milestone when all tasks are done. Run at session end. |
| `/kss:capture` | Knowledge | Drop a seed (mandatory trigger), idea, or jotted note without leaving flow. |
| `/kss:distill` | Knowledge | Route durable insights from LOG + notes to their four homes. The rot-prevention pass. |
| `/kss:skill-autopsy` | Meta | Log a report when a skill underperformed; `--consolidate` proposes SKILL.md improvements from accumulated reports. |
| `/kss:explore-html` | Utilities | Build a single-file interactive HTML page — reports, diagrams, decks, comparisons, editors. |
| `/kss:explore-notebook` | Utilities | Build a *served* interactive HTML notebook — live-reload, LAN URL, on-page feedback and agent replies. The iterate-over-rounds sibling of `explore-html`. |

## Daily flow

For the visual decision flow and the skill-interaction graph, see the [explainers](https://fnneves.github.io/kss-plugins/plugins/kss/explainers/).

```
once per project:    /kss:scaffold-project → /kss:map-codebase
once per topic:      /kss:new-topic
per milestone:       /kss:plan-milestone → (sessions...) → /kss:complete-milestone
per session:         /kss:start-session → (work) → /kss:wrap-up
                                                     ↑
                              /kss:capture (anytime), /kss:distill (periodically)
                              /kss:spike (when exploring)
                              /kss:explore-html (when an HTML artifact would beat markdown)
                              /kss:explore-notebook (when you'll iterate on a served page over rounds)
                              /kss:skill-autopsy <skill> (after a frustration)
```

## Skill self-improvement loop

`skill-autopsy` is the only entry point that touches skill reports. Reports live at `~/kss-skill-reports/<skill-name>.md` (personal, never committed to the plugin source) and are read only when you invoke the autopsy.

Flow:
1. A skill misbehaves → run `/kss:skill-autopsy <skill-name>`. It interviews you and appends a short report.
2. Once 4+ reports accumulate, autopsy offers to consolidate. Past 5, the warning escalates.
3. Consolidate mode reads all reports for that skill, looks for recurring root causes, and proposes a concrete diff to its `SKILL.md`. If reports are vague or share no pattern, it says so honestly instead of inventing improvements.
4. **If you've cloned the repo and set `~/.kss-source` to your clone path**: the diff is applied to your clone and reports are cleared. You commit and push (or open a PR) on your own time.
5. **If you haven't**: the diff is *printed* for you to handle manually — fork later to apply, open a GitHub issue to send upstream, or just adapt your usage. Reports can be cleared either way.

`~/.kss-source` is optional and only relevant for forkers/contributors. Plain installs work fully; only the "apply diff to source" step is gated.

## `.kss/` layout

```
.kss/
├── PROJECT.md             # durable identity + topics index + ## Carryover; frontmatter holds active_topic (the single project pointer) + last_session
├── CANONICAL-KB.md        # cross-topic distilled knowledge
├── codebase/
│   ├── STACK.md           # overwrites on map-codebase rerun
│   ├── STRUCTURE.md       # body overwrites on rerun; ## Learned fence preserved
│   ├── CONVENTIONS.md     # body overwrites on rerun; ## Learned fence preserved
│   └── VOCABULARY.md      # append-only — auto-seeded by map-codebase, grown by distill
├── topics/
│   └── <topic-slug>/
│       ├── TOPIC.md       # identity, success bar, key decisions; status: active|archived
│       ├── STATE.md       # current focus, blockers, + ## Scratch fence; frontmatter active_milestone (source of truth)
│       ├── LOG.md         # session-by-session, terse, newest-on-top
│       ├── SEEDS.md       # parked items, each with a trigger condition
│       ├── MILESTONES.md  # shipped milestone summaries, newest-on-top
│       └── milestones/
│           ├── <version>-<slug>/        # active (no SUMMARY.md yet)
│           │   ├── PLAN.md
│           │   └── note-YYYYMMDD-*.md
│           └── <version>-<slug>/        # shipped (has SUMMARY.md)
│               ├── PLAN.md
│               ├── SUMMARY.md
│               └── note-YYYYMMDD-*.md
└── spikes/
    └── YYYYMMDD-<slug>/
        └── README.md      # question, approach, findings, verdict

# Archiving a topic sets `status: archived` in its TOPIC.md and moves its PROJECT.md
# row to ## Archived Topics — the directory stays in topics/.
```

## Key conventions

- **YAML frontmatter on every state file** — easy to grep/parse.
- **Newest-on-top** in LOG.md and MILESTONES.md.
- **Slugs are kebab-case.**
- **Dates: ISO `YYYY-MM-DD`** in frontmatter; `YYYYMMDD` as folder/file prefixes.
- **Active vs shipped milestone:** presence of `SUMMARY.md` is the marker.
- **Active vs archived topic:** `status: archived` in `TOPIC.md` is the marker. Archiving is a status flag, not a folder move — the directory stays in `topics/`; skills exclude archived topics from active listings (`grep 'status: archived'` is the trail).
- **Seeds require a trigger condition.** No exceptions. Items without triggers rot — `capture` will refuse them.
- **Detect-and-offer, never silently mutate.** Skills may detect a condition and *offer* the next action (close milestone, archive topic, claim a handoff) behind a one-keystroke confirm; they never auto-fire a state change. A confirm-prompt is not auto-routing.
- **Durable vs transient STATE.** Topic STATE.md keeps durable position in "Current Position"/"Blockers"; rot-prone env facts (process up/down, ports, timestamps) go under a `## Scratch (transient — re-verify next session, safe to wipe)` fence. `start-session` re-verifies Scratch rather than re-asserting it.
- **Cross-topic handoffs live in PROJECT.md `## Carryover`.** `complete-milestone` logs deferred-to-future-topic items there (trigger-gated); `new-topic` offers to claim them.
- **`distill` has four destinations.** Learnings/gotchas → CANONICAL-KB; structure & pattern facts → codebase STRUCTURE/CONVENTIONS `## Learned` fences (preserved across `map-codebase` reruns); terms → VOCABULARY.
- **Never auto-commit.** Skills modify files; user runs `git` themselves.
- **Single project pointer.** `active_topic` lives in `.kss/PROJECT.md` frontmatter (there is no `.kss/STATE.md`). The active milestone is *derived*: read `active_topic`, then read that topic's `STATE.md` `active_milestone` — its single source of truth. `start-session` migrates any legacy `.kss/STATE.md` on first run.

## Installation

This plugin is distributed via the `kss-plugins` marketplace. Inside Claude Code:

```
/plugin marketplace add fnneves/kss-plugins
/plugin install kss@kss-plugins
```

Commands are then invokable as `/kss:<skill-name>` in any project. The `kss` namespace comes from the `name` field in `plugin.json`.

To pull updates: `/plugin marketplace update kss-plugins` followed by `/plugin update kss@kss-plugins`. If the version field hasn't been bumped, run `/reload-plugins` to re-read the synced cache.

### Want to customize the skills?

If you want to tweak SKILL.md files locally (and optionally contribute improvements upstream):

1. Fork the marketplace repo on GitHub.
2. Clone your fork: `git clone https://github.com/<your-username>/kss-plugins ~/code/kss-plugins`.
3. Tell `skill-autopsy` where your clone lives: `echo "$HOME/code/kss-plugins/plugins/kss" > ~/.kss-source`.
4. Continue installing kss from the marketplace as above for runtime; your clone is the writable workbench.

For background on plugin marketplaces, version pinning, and source types, see the official Claude Code docs: <https://code.claude.com/docs/en/plugin-marketplaces>.
