---
description: Generate or refresh `.kss/codebase/{STACK,STRUCTURE,CONVENTIONS,VOCABULARY}.md` — a 4-file codebase snapshot. Use when the user asks to map, document, survey, or summarize the codebase, wants a stack/structure overview, or says the codebase has changed significantly.
---

# map-codebase

Produces a compact codebase snapshot under `.kss/codebase/`. Four files: what it's built with, how it's laid out, what conventions matter, and the domain vocabulary you actually use. Run after scaffold and again whenever the codebase shape shifts meaningfully.

## Pre-flight

1. **Refuse if `.kss/` is missing.**
   - Tell the user: "`.kss/` not found. Run `scaffold-project` first."

2. **Warn (don't refuse) if STACK/STRUCTURE/CONVENTIONS already exist.**
   - "Existing STACK / STRUCTURE / CONVENTIONS files will be overwritten. VOCABULARY will be merged (existing terms preserved). Continue?"

## Process

1. **Scan the project.**
   - Read top-level package files: `package.json`, `requirements.txt`, `pyproject.toml`, `Cargo.toml`, `go.mod`, etc.
   - Read top-level config: `.python-version`, `.nvmrc`, `tsconfig.json`, build configs.
   - List top-level directories with `ls`.
   - Sample a few representative source files per top-level dir to understand patterns.
   - Read existing `README.md`, `BOOTSTRAP.md`, `CLAUDE.md` if present.

2. **Write STACK / STRUCTURE / CONVENTIONS** using the templates below. These files overwrite freely on every run.

3. **Scan for vocabulary seeds.** Look for domain terms — names of concepts the team uses, not implementation details:
   - README glossary section if present.
   - Top-level domain entities — names of central models, types, status enums, state machines.
   - Comments that *define* terms (e.g., `// Materialization: when a draft section becomes published`).
   - `CLAUDE.md` / `BOOTSTRAP.md` glossaries.

   Skip implementation names like `publishLessonAsync`. Capture the noun-level concept the user would naturally say.

4. **Write or merge VOCABULARY.md** using the template below. **Merge semantics — never overwrite:**
   - If the file doesn't exist → create it with the auto-detected terms, each marked `**Source:** auto-scan (verify)`.
   - If the file exists → preserve every existing term verbatim. Only add terms that are not already present (case-insensitive match on the term header).
   - If auto-scan finds nothing new and the file already exists → leave it untouched, just bump `last_updated`.
   - Never edit, reword, or remove existing entries. The user owns curated terms.

5. **Tell the user.**
   - "Codebase map written to `.kss/codebase/`. STACK / STRUCTURE / CONVENTIONS overwritten. VOCABULARY: {N} new terms added, {M} existing preserved."

6. **Do not commit.**

## Template: `.kss/codebase/STACK.md`

Languages, frameworks, package managers, the deps that actually matter (not every transitive). Aim for ~30-60 lines.

```markdown
---
last_updated: {YYYY-MM-DD}
---

# Stack

## Languages

- {language} {version} — {where used}

## Frameworks

- {framework} {version} — {role}

## Package managers

- {pm} — {scope}

## Key dependencies

| Package | Version | Role |
|---|---|---|
| {pkg} | {ver} | {what it does for this project} |

## Build / run

- Dev: `{command}`
- Test: `{command}`
- Deploy: `{command}` (or "manual" / "not applicable")

## Notable absences

- {what isn't here that you might expect — e.g. "no CI", "no Docker"}

---
*Refreshed by map-codebase on {YYYY-MM-DD}*
```

## Template: `.kss/codebase/STRUCTURE.md`

One-liner per top-level dir. Aim for ~40-80 lines. Don't recurse into every leaf — surface the shape, not the contents.

```markdown
---
last_updated: {YYYY-MM-DD}
---

# Structure

## Top level

| Path | Role |
|---|---|
| `{dir}/` | {one-line description} |

## Key paths to know

- `{path}` — {why it matters}

## Where state lives

| File | Purpose |
|---|---|
| `{file}` | {what it tracks} |

---
*Refreshed by map-codebase on {YYYY-MM-DD}*
```

## Template: `.kss/codebase/CONVENTIONS.md`

Patterns observed in the code, gotchas, anti-patterns. Aim for ~30-60 lines. Skip generic advice; capture project-specific things.

```markdown
---
last_updated: {YYYY-MM-DD}
---

# Conventions

## Code patterns

- {pattern observed in this codebase}

## Naming

- {convention}

## Testing

- {test framework, where tests live, how they run}

## Gotchas

- {non-obvious things future-you would re-discover the hard way}

## Anti-patterns to avoid

- {things that look reasonable but break something here}

---
*Refreshed by map-codebase on {YYYY-MM-DD}*
```

## Template: `.kss/codebase/VOCABULARY.md`

Domain terms — the compressed names you use when describing this work. Append-only; existing entries are preserved across `map-codebase` runs.

```markdown
---
last_updated: {YYYY-MM-DD}
---

# Vocabulary

Project-specific domain terms. The compressed names for concepts you use repeatedly when describing this work. Append-only — new terms are added; existing ones are refined manually, not auto-edited.

### {term}

**Means:** {one-sentence definition in domain language}
{optional} **Not:** {what it is *not* — clears up adjacent confusable terms}
{optional} **Source:** {auto-scan (verify) / README glossary / milestone X conversation / etc.}
```

If auto-scan finds no terms on first run, write the file with frontmatter + the introductory paragraph + a placeholder line: `_No domain terms detected yet — add as they crystallize._`

## Output

Four files written under `.kss/codebase/`. Each with frontmatter `last_updated` so staleness is visible at a glance.

## Conventions

- Keep it terse. The point is "fresh context in one read", not exhaustive documentation.
- If the codebase has a `CLAUDE.md` or `BOOTSTRAP.md`, lean on those rather than duplicating.
- Prefer concrete over abstract: "tests use pytest with `asyncio_mode = auto` (config at `stratkit/pytest.ini`)" beats "tests are async".
- **VOCABULARY.md is the only file in this folder that lives across runs.** Treat it as a shared document, not a generated one. Auto-scan only seeds and adds — it never edits or removes entries the user has touched.
- VOCABULARY captures *domain* terms, not *implementation* names. "Materialization cascade" yes; `publishLessonAsync()` no.
