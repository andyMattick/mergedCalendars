# Shared Unit Schema (v1)

The **spine** of the Teacher Suite. Every tool reads and/or writes this shape so a
unit can move through the whole chain without being retyped.

```
Grow a Project ─┐
                ├──► PLANNER ──► Content Studio ──► Assessment Analyzer
Unit Builder ───┘   (owns dates)   (artifacts)        (validates)
```

**The Planner owns this schema.** It is the only tool that knows real calendar
dates, rotation letters, and how snow days shift things. Other tools produce or
consume units; the Planner is the source of truth for scheduling.

---

## The object

```json
{
  "schemaVersion": 1,
  "unitId": "u_abc123",
  "unitTitle": "Ratios & Proportions",
  "subject": "Math 7",
  "gradeLevel": "7",
  "periodNum": 3,
  "source": "unit-builder",
  "exportedAt": "2026-09-01T14:20:00.000Z",

  "description": "",
  "objectives": "",
  "materials": "",

  "days": [
    {
      "dayNum": 1,
      "date": "2026-09-08",
      "topic": "Ratio language",
      "lessonPlan": "",
      "isQuiz": false,
      "isTest": false,
      "checkpoint": null,
      "lesson": null
    }
  ],

  "rubric": null
}
```

### Field notes

| Field | Owner | Notes |
|---|---|---|
| `unitId` | producer | stable id; used to match on re-import |
| `unitTitle` | any | |
| `periodNum` | Planner | which class period this belongs to |
| `date` | **Planner only** | other tools leave `null`; Planner fills from rotation |
| `dayNum` | producer | 1-based, always present |
| `topic` | producer | short label shown on the calendar |
| `lessonPlan` | any | rich text/HTML; what shows in Planner day view |
| `lesson` | Unit Builder | full structured lesson (see below) |
| `checkpoint` | Grow a Project | `{ label, rubricCategory }` or `null` |
| `rubric` | Grow a Project | `{ categories: [{ name, levels: [...] }] }` |

### `lesson` sub-object (Unit Builder output)

```json
{
  "objective": "",
  "review": "",
  "bellRinger": "",
  "explanation": "",
  "example": "",
  "vocabulary": [],
  "practice": { "easy": [], "medium": [], "hard": [] }
}
```

`lessonPlan` is the flattened, human-readable version of `lesson`. Tools that
only need text (Planner display, printing, Content Studio) read `lessonPlan`.
Tools that need structure read `lesson`.

---

## Who produces / consumes what

| Tool | Reads | Writes |
|---|---|---|
| **Planner** | full unit | full unit (+ real `date` values) |
| **Unit Builder** | `unitTitle`, `days[].topic`, `subject`, `gradeLevel` | `days[].lesson`, `days[].lessonPlan` |
| **Grow a Project** | — | `days[]`, `rubric`, `days[].checkpoint` |
| **Content Studio** | `days[].lessonPlan` (or flattened `lesson`) | — (produces artifacts, not units) |
| **Assessment Analyzer** | `unitTitle`, `days[].topic` (context) | — |
| **Tracker** | `unitTitle`, `days[].topic` (to seed a section) | — |

---

## Rules

1. **Never invent dates outside the Planner.** Producers set `date: null`.
   The Planner assigns real dates using the rotation schedule.
2. **Additive changes only within a version.** Adding an optional field is fine;
   renaming or removing one requires bumping `schemaVersion`.
3. **Unknown fields are preserved, not dropped.** A tool that doesn't understand
   a field should round-trip it untouched so no data is lost passing through.
4. **`schemaVersion` is required on every export.** Importers check it and warn
   on mismatch rather than failing silently.

---

## Current status

- [x] Schema defined
- [x] Planner export / import
- [x] Unit Builder import skeleton / export lessons
- [ ] Grow a Project export day plan
- [ ] Content Studio accept pasted unit
- [ ] Tracker seed section from unit