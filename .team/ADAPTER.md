# How Teacher Suite uses the shared team

`.team/` holds unedited copies of the shared team's files (briefs, Wilco's cue code, the lessons log). The team repo
is `theATeam`; its `PROCESS.md`, `IMPROVEMENT.md` and `STREAMLINE.md` are the full method.

## Keeping the copies fresh
- Take the team's newest files (run from the team repo): `node scripts/sync-check.mjs --project <this repo> --write`.
- Is anything behind or edited: `node scripts/sync-check.mjs --project <this repo>`. The weekly run does this.
- `npm run check` runs `scripts/check-team.mjs`: a copy that no longer has the hash in `.team/manifest.json` fails.
  Never edit a copy: make the change in the team repo.

## Where this suite stands (Nov 13, 2026)
The AI tools (`content-studio/`, `unit-builder/`) call Claude from the page. Each feature is one call that writes the
content and, where there is one, its own answer key. There is no second reader and no script that checks what came
back.

| Team stage | Here today |
|---|---|
| 1. Rule first | Rules live only in the prompts |
| 2. Measure the source | `validateSetupForm` in `unit-builder/` warns on a missing title, very short topics, or far more lessons than topics |
| 3. Blueprint | Unit Builder: topics spread across lessons; 8 easy, 6 medium, 4 hard, rising in difficulty; a mix of item kinds. Content Studio: question kinds and counts set by the teacher |
| 4. Write | `callClaude()` in each tool |
| 5. Scripts | none on content (`tryRepairJson` mends broken JSON only) |
| 6. Readers | none |
| 7. One fix round | "Replace" regenerates one question |
| 8. A person agrees | The teacher reads the result on the page |
| 9. Learn | none |

## What it can take, in order
1. **Free, in the prompts:** the team's blueprint rules from `PROCESS.md` stage 3: each question tied to one idea in
   the notes and no idea asked twice; wrong choices that are real student mistakes in the same form as the key; the
   key the longest choice about 1 time in 4; a harder question is harder in the skill, not in the size of the numbers.
2. **In the page's own code, no AI:** the structure checks (one key, no two choices the same) and the team's cue code
   on the choices that came back, shown to the teacher as a short quality note.
3. **Needs a backend or an export:** a second call that solves the questions with no key and compares (the blind
   solver), a fact check against the notes, and a cost log. The shared unit format (`shared/schema.md`) already
   travels, so an assessment could instead be exported to a project that runs the whole team.

The Tracker holds student names and grades and stays local. Nothing from it goes to the team or its logs.

## Not here
The README lists an Analyzer and Grow a Project. Their folders are not in this repo, so the team has nothing of theirs.
