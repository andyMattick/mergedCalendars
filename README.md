# mergedCalendars# Teacher Suite

A set of teaching tools that share one unit format, so a unit flows from design
→ scheduling → content generation → validation → tracking without being retyped.

```
Grow a Project ─┐
                ├──► PLANNER ──► Content Studio ──► Assessment Analyzer
Unit Builder ───┘   (schedule)     (artifacts)         (validate)
                          │
                          └──────► Tracker (who actually did it)
```

## Tools

| Tool | Job | Runs in browser? | AI? |
|---|---|---|---|
| `planner/` | Rotation-day calendar, unit pacing, announcements | ✅ yes | no |
| `tracker/` | Multi-part assignment + roster progress tracking | ✅ yes | no |
| `unit-builder/` | Generates full lesson content from topics | ⚠️ Claude only | yes |
| `content-studio/` | Notes ↔ slides, assessments, worksheets, keys | ⚠️ Claude only | yes |
| `grow-a-project/` | Guided PBL design w/ AI-proofing + rubric | ⚠️ Claude only | yes |
| `analyzer/` | Predicts test difficulty, calibrates on real results | ⚠️ Claude only | yes |

### The distribution constraint

The four AI tools call `api.anthropic.com` **without an API key**. That only
works inside Claude's artifact sandbox, which injects auth. Hosting those files
on GitHub Pages will not make them work — they'd fail on missing credentials and
CORS.

Making them distributable requires a backend that holds the API key and proxies
requests. That is a deliberate later decision, not an oversight. See
`shared/UNIT_SCHEMA.md` for what's being built in the meantime.

To keep that future switch cheap, **every AI tool isolates its network call in a
single `callClaude()` function.** Swapping to a proxy should be a one-function
change per tool.

## The shared team

The owner's projects that make learning content share one team of agents, one set of checks and one lessons log (the
`theATeam` repo). Unedited copies of its briefs, cue code and lessons are in `.team/`; `.team/ADAPTER.md` says how
this suite fits and what it can't use yet. `npm run check` fails if a copy was edited here.

The short version: the AI tools here write the questions, the answer key and any review in **one call**, which is
the one thing the team never allows ("the maker never checks its own work"). They can't run the team from a browser
page, so until there is a backend the team's rules can only reach them as prompt wording.

## Deployed

- `planner/` — live on GitHub Pages
- `tracker/` — ready to deploy (storage adapter falls back to `localStorage`)

## Data & privacy

- The **Tracker** holds student names and grades. It is intentionally
  **local-only** — that data should never sync to a server. If a backend is ever
  built, the Tracker stays out of it.
- The **Analyzer** stores class-level results (averages, times), not individual
  student records.

## Roadmap

- [x] Consolidate tools into one repo
- [x] Port Tracker off artifact-only storage
- [x] Define shared unit schema (v1)
- [ ] Planner: export / import unit JSON
- [ ] Unit Builder: import skeleton, export lessons
- [ ] Remaining tools: bridges
- [ ] **Gate:** teach one real unit through the full chain before building any backend
- [ ] Decide: personal suite vs. product