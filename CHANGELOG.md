# Changelog

All notable changes to plugins in this marketplace.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Each plugin tracks its own version (in `plugins/<plugin>/.claude-plugin/plugin.json`).

## [Unreleased]

## kss

### [0.1.0] - 2026-05-10

Initial release.

**Skills:**
- `scaffold-project` — bootstrap `.kss/` shell.
- `map-codebase` — generate STACK / STRUCTURE / CONVENTIONS / VOCABULARY snapshot. VOCABULARY is append-only across runs.
- `new-topic` — create and activate a topic.
- `plan-milestone` — scope and plan a milestone in the active topic.
- `complete-milestone` — close a milestone (or archive a topic with `--archive-topic`).
- `start-session` — load context for active topic + milestone.
- `wrap-up` — append LOG entry, refresh STATE, optionally write a notes file.
- `capture` — drop a seed (with mandatory trigger), idea, or scratch note.
- `distill` — extract durable insights to CANONICAL-KB and surface vocabulary candidates.
- `spike` — throwaway exploration with verdict-driven outcome.
- `skill-autopsy` — postmortem any skill, propose SKILL.md improvements. Reports live at `~/kss-skill-reports/`. `~/.kss-source` is optional (controls whether consolidate-mode applies diffs to a writable source folder).
