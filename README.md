# Teacher Suite

A set of single-file teaching tools that share one unit format, so a unit flows
from design → scheduling → content generation → tracking without being retyped.

```
Unit Builder ──► PLANNER ──► Content Studio
(lessons)       (schedule)     (slides, worksheets, tests)
                    │
                    └──────► Tracker (who actually did it)
```

Everything is plain HTML + JavaScript with no build step. Each tool is one
`index.html` that stores its data in the browser's `localStorage`.

## Tools

| Tool | Path | Job | AI? |
|---|---|---|---|
| Planner | `index.html` | Rotation-day calendar, unit pacing, quizzes/tests, announcements, profiles, backup/restore, print and HTML export | no |
| Tracker | `tracker/` | Multi-part assignment + roster progress tracking | no |
| Unit Builder | `unit-builder/` | Generates full lesson content from a unit's topics | yes |
| Content Studio | `content-studio/` | Notes ↔ slides, assessments, worksheets, answer keys | yes |

The Planner's **Teacher Tools** menu opens the other three.

Two more tools — Grow a Project (guided PBL design) and an Assessment Analyzer —
are planned and appear in `shared/schema.md`, but are not in this repo yet.

## Running it

Open `index.html` directly, or serve the folder:

```bash
npm start
```

then visit `http://localhost:4173`. The Planner and Tracker work as-is on GitHub
Pages or any static host.

### The AI tools need a key

Unit Builder and Content Studio call the Anthropic API straight from the
browser. They work two ways:

1. **Inside a Claude artifact**, where the sandbox supplies credentials.
2. **Anywhere else**, after you click ⚙ and paste your own Anthropic API key.
   The key is kept in memory for that tab only; it is never stored or sent
   anywhere except `api.anthropic.com`.

Each AI tool isolates its network call in a single `callClaude()` function, so
moving to a backend proxy later is a one-function change per tool.

## Data & privacy

- All data stays in the browser. Nothing is uploaded except the text you send to
  the AI tools.
- The **Tracker** holds student names and grades and is intentionally
  **local-only**. If a backend is ever built, the Tracker stays out of it.
- Because data lives in `localStorage`, clearing site data deletes it. The
  Planner auto-backs up every 5 minutes and can sync to a backup file; use
  **Save / Restore / Print** to export a copy.

## The shared unit format

`shared/schema.md` defines the JSON unit object the tools pass between each
other. The Planner owns it: it is the only tool that assigns real dates.

## Development

```bash
npm install
```

```bash
npm test
```

`npm test` runs `smoke-test.js`, which loads all four tools in headless Chromium
(via Playwright) and fails on any uncaught page error or dead Teacher Tools link.

## Roadmap

- [x] Consolidate tools into one repo
- [x] Port Tracker off artifact-only storage
- [x] Define shared unit schema (v1)
- [x] Planner: export / import unit JSON
- [x] Unit Builder: import skeleton, export lessons
- [ ] Content Studio: accept a pasted unit
- [ ] Tracker: seed a section from a unit
- [ ] Add Grow a Project and the Assessment Analyzer
- [ ] **Gate:** teach one real unit through the full chain before building any backend
- [ ] Decide: personal suite vs. product
