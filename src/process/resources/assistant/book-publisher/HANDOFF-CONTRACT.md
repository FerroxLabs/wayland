# Publishing House Hand-off Contract

The single source of truth for how the book-publishing roles coordinate. Every role reads and writes named artifacts in one shared `book/` workspace so the next role always has a defined input. Each role's persona and SKILL point here. Do not invent a different layout.

## Workspace

All artifacts live under a single `book/` directory inside the chat's working directory (the project workspace when the book is run inside a Project, otherwise the agent's working directory). The Publisher fixes this path once, at brief time, and records it in `book/STATUS.md`. Every role uses the same `book/` path for the life of the project. If a role cannot find `book/STATUS.md`, the project has not been set up yet: hand back to the Publisher rather than starting fresh somewhere else.

## Artifacts

| Path | Written by | Read by | Required sections |
| --- | --- | --- | --- |
| `book/STATUS.md` | Every role (read first, write last) | Every role | Current phase; chapter table (number, title, state); open decisions; next action |
| `book/brief.md` | Publisher | All | Genre (fiction/non-fiction); subject/genre + audience; target length + format; working title; positioning + comps; one-paragraph back-cover promise |
| `book/outline.md` | Architect (story or non-fiction) | All | Fiction: logline + beat sheet + chapter list (per-chapter goal/conflict/turn). Non-fiction: thesis + argument map + chapter list (per-chapter claim/evidence/takeaway) |
| `book/bible.md` | Architect / (Phase B) research + lore | Drafting, editors | Fiction: characters, world rules, timeline. Non-fiction: facts + sources register (each source has an id used in inline `[source: id]` markers) |
| `book/manuscript/NN-chapter.md` | Drafting (architect via `book-chapter-draft`) | Editors, production | The chapter prose; inline `[FLAG: ...]` markers for editor attention |
| `book/edits/NN-notes.md` | Developmental Editor, Copy Editor | Reviser (architect), production | Per-note: id, type (structure/line/copy), severity, the note, and a `status` field (`open`/`resolved`) |
| `book/edits/style-sheet.md` | Copy Editor | Drafting, all editors | Spelling/hyphenation choices, names, numbers/dates style, capitalization, tense/POV, recurring usage decisions |
| `book/out/` | Production | User | Formatted manuscript (DOCX), `metadata.md`, `blurb.md`, front/back matter, non-fiction `index.md`, platform prep checklist |

## STATUS.md manifest (the durable spine)

Books take weeks or months across many sessions. `book/STATUS.md` is the only thing that lets any role resume without re-reading everything. It is mandatory.

```
# STATUS: <working title>
Phase: <brief | outline | drafting | dev-edit | revise | copy-edit | production | done>
Workspace: <absolute path to book/>
Genre: <fiction | non-fiction>

## Chapters
| # | Title | State |
|---|-------|-------|
| 01 | ... | outlined | drafted | dev-noted | revised | copy-clean | final |

## Open decisions
- ...

## Next action
- <which role does what next>
```

Hard rule for every role: **read `STATUS.md` first, write it last.** Production reads the chapter table for order and final-state, never a directory glob.

## Chapter state machine

`outlined -> drafted -> dev-noted -> revised -> copy-clean -> final`

A chapter only advances when its current step is genuinely complete. Production may only assemble chapters in state `final`. If any chapter is not `final`, production stops and reports which chapters block the gate.

## Revision loop (first-class, not a dead end)

A book is three to five edit-and-revise cycles, not one pass.

1. Editor writes `book/edits/NN-notes.md`, each note with `status: open`.
2. The reviser (the architect) EDITS `book/manuscript/NN-chapter.md` IN PLACE. Never re-draft a chapter from scratch to address notes.
3. As each note is addressed, the reviser sets that note's `status: resolved`.
4. The chapter advances state only when every note on it is `resolved`.
5. Gate to production = all notes on all chapters resolved AND every chapter `final`.

## Phase gates (each role self-enforces in its own SKILL)

A role invoked standalone cannot rely on the Publisher to gate it. Each role checks its own preconditions first:

- Architect drafting: `outline.md` and `bible.md` exist and are non-empty, else produce them first or refuse to draft.
- Developmental Editor: the chapters it reviews are at least `drafted`.
- Copy Editor: the chapters it touches are `revised` (dev notes resolved), and a `style-sheet.md` exists or gets created first.
- Production: every chapter is `final`.

## Team coordination (real MCP tool names)

When the roles run as a Wayland team, the Publisher coordinates with these tools. Names are exact.

- **Write / dispatch:** `team_task_create` (assign a task to a teammate), `team_task_update` (change status), `team_send_message` (message a teammate), `team_spawn_agent` (bring a role online).
- **Read / inspect:** `team_task_list` (see assignments and status), `team_members` (see who is on the team), `team_describe_assistant` (look up a teammate's role).

The Publisher assigns work with `team_task_create` and `team_send_message`, brings roles online with `team_spawn_agent`, and tracks progress with `team_task_list`. It never uses a read tool to try to assign work.

When the roles run solo (no team), the same hand-off still works through the `book/` artifacts and `STATUS.md`: the user moves between assistants, and each picks up from the manifest.

## Scope honesty

"Publish-ready" here means: a clean, edited, formatted manuscript with front/back matter, metadata, blurb, and a platform prep checklist. It does NOT include ISBN purchase, cover design (hand off to an image tool), professional sensitivity reads, or beta-reader rounds. Say so plainly rather than overclaiming.
