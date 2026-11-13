# Instructions for AI coding assistants

Teacher Suite: single-file browser tools for a teacher (planner, tracker, unit builder, content studio). `README.md`
says what each tool does and which ones call Claude.

## Content work uses the shared team (owner, Nov 13, 2026)

Any learning content made or changed in this repo by an assistant (sample units, questions, answer keys, worksheets,
the wording of the prompts the tools send) follows the shared team's process: `.team/ADAPTER.md` says where this suite
stands against its nine stages, and the briefs are in `.team/agents/`. In short: plan before writing, the maker never
checks its own work, every script check runs, one round of fresh readers (a blind solve with no key at the least), one
fix round that changes wrong choices and never keys, and the owner agrees before students see it.

The tools themselves can't run the team: each one writes its content, and its own answer key, in one call from the
page. Until that changes, the team's rules reach them only as prompt wording (`.team/ADAPTER.md`, "What it can take").
When you change a prompt, keep to those rules and say in the pull request which ones the prompt now carries.

A lesson learned here that isn't about this suite's own code also goes to the team repo's `LESSONS.md`, so the
owner's other projects get it at the weekly sync. Never edit a file in `.team/`: change it in the team repo.

## Rules
- The Tracker holds student names and grades and stays local. Nothing from it goes to a server, a log or the team.
- Every AI tool keeps its network call in one `callClaude()` function.
- `npm run check` before every commit.
