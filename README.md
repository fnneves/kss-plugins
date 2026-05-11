# kss-plugins

**Keep Shit Simple — solo dev framework with reduced ceremony and high customization.**

I tested dozens of plugins, skills, and frameworks. I liked [GSD](https://github.com/gsd-build/get-shit-done) but wanted to make shit simpler — so I built this set of skills to keep my solo dev workflows organized and always ready to pick back up where I left them.

This marketplace currently hosts a single plugin (`kss`). Designed to grow if more focused plugins land later.

## Plugins in this marketplace

| Plugin | What it does |
|---|---|
| [`kss`](plugins/kss/) | Keep Shit Simple — session-driven workflow with topics, milestones, spikes, and a canonical KB. Includes a self-improvement loop (`skill-autopsy`) and domain vocabulary capture. |

## Documentation

Interactive HTML explainers covering kss from different angles. Single-file artifacts, no build step, hosted via GitHub Pages.

| | Explainer | What it covers |
|---|---|---|
| 01 | [kss in 6 slides](https://fnneves.github.io/kss-plugins/plugins/kss/explainers/01-kss-in-6-slides.html) | The pitch deck — problem, core idea, 12 skills by layer, self-improvement loop, install. Scroll-snap slides with ←/→ navigation. |
| 02 | [The self-improvement loop](https://fnneves.github.io/kss-plugins/plugins/kss/explainers/02-self-improvement-loop.html) | Interactive concept explainer for `skill-autopsy`. Click the timeline, flip `~/.kss-source` to see how outcomes differ for forkers vs. plain installs. |
| 03 | [How the 12 skills interact](https://fnneves.github.io/kss-plugins/plugins/kss/explainers/03-skills-interaction.html) | Data ownership graph. Click any skill to see what it writes, reads, downstream consumers, upstream feeders, and the failure mode it prevents. |
| 04 | [The `.kss/` file system](https://fnneves.github.io/kss-plugins/plugins/kss/explainers/04-kss-filesystem.html) | Surface tour of every file under `.kss/`. Tabs across root / codebase / topics / spikes & archive, with behavior pills and authorship for each path. |

Browse all explainers at <https://fnneves.github.io/kss-plugins/plugins/kss/explainers/>.

For the plugin command reference and lifecycle diagram, see [`plugins/kss/README.md`](plugins/kss/README.md).

## Install

Inside Claude Code, add this marketplace, then install whichever plugins you want individually:

```
/plugin marketplace add fnneves/kss-plugins
/plugin install kss@kss-plugins
```

## Update

```
/plugin marketplace update kss-plugins
/plugin update <plugin-name>@kss-plugins
```

If a plugin's `version` field hasn't been bumped, `/plugin update` is a no-op — run `/reload-plugins` instead to re-read the synced cache.

## Customize / contribute

Each plugin's skills are plain markdown (`SKILL.md`) — readable, reviewable, no compiled code. To customize:

1. Fork this repo on GitHub.
2. Clone your fork locally.
3. Edit `plugins/<plugin>/skills/<skill-name>/SKILL.md` and re-install from your fork's marketplace.

For background on how plugin marketplaces work — schema, version pinning, source types — see the official Claude Code docs: <https://code.claude.com/docs/en/plugin-marketplaces>.

## Structure

```
kss-plugins/
├── README.md
├── CHANGELOG.md
├── LICENSE
├── .gitignore
├── .claude-plugin/
│   └── marketplace.json     # marketplace catalog (lists plugins below)
└── plugins/
    └── kss/
        ├── .claude-plugin/
        │   └── plugin.json
        ├── README.md
        └── skills/
            └── <skill-name>/SKILL.md
```

Each plugin folder is fully self-contained — it can be referenced from this marketplace, copied into a different one, or installed directly via a local-path marketplace pointing at it.

## Versioning

Each plugin pins its own `version` in `plugin.json`. Releases are tagged on the repo (e.g. `kss-v0.1.0`). Bump the relevant plugin's version field, tag the commit, push. Users only receive updates when the version changes — keeping `/plugin update` predictable.

See `CHANGELOG.md` for release notes.
