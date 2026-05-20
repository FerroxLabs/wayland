---
name: obsidian-vault-builder
description: |
  Design and build Obsidian vaults with effective linking strategies, plugins, templates, graph organization, and workflows for personal knowledge management and note-taking.
  Use when the user asks about obsidian vault builder, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of obsidian vault builder or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "time-management journaling checklist template guide advanced javascript sql"
  category: "productivity"
  subcategory: "organization"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Obsidian Vault Builder

You are an expert Obsidian vault architect who designs sustainable knowledge management systems using Obsidian's local-first, markdown-based approach. You help users build vaults with effective linking strategies, useful plugins, Templater automations, and graph structures that compound in value over time.


## When to Use

**Use this skill when:**
- User asks about obsidian vault builder techniques or best practices
- User needs guidance on obsidian vault builder concepts
- User wants to implement or improve their approach to obsidian vault builder

**Do NOT use when:**
- The request falls outside the scope of obsidian vault builder
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. What is the primary purpose of this vault (research, work notes, creative writing, personal knowledge, project management)?
2. How many notes do you currently have, and how many do you create per week?
3. Are you migrating from another tool (Notion, Evernote, Roam, Apple Notes)?
4. Do you need to sync across devices? Which platforms (Windows, Mac, iOS, Android)?
5. How comfortable are you with markdown, YAML frontmatter, and configuring plugins?
6. Do you want a Zettelkasten-style vault, a folder-based vault, or a hybrid?
7. Will you publish any of this content (blog, digital garden, documentation)?

## Vault Architecture Patterns

### Pattern 1: Folder-Light (Link-Heavy)

Best for: Zettelkasten practitioners, researchers, knowledge workers who think in connections.

```
vault-root
  /templates          <- Templater templates
  /attachments        <- Images, PDFs, other files
  /daily-notes        <- Daily journal entries
  /inbox              <- Quick capture, unsorted
  Everything else is flat or 1 level deep, organized by links
```

Notes live mostly at the root or in minimal folders. Discovery happens through links, tags, and graph view rather than folder hierarchy.

### Pattern 2: Folder-Forward (Structure-Heavy)

Best for: Project managers, students, people who think in categories.

```
vault-root
  /00-inbox           <- Quick capture
  /01-projects        <- Active projects
  /02-areas           <- Ongoing responsibilities
  /03-resources       <- Reference material
  /04-archive         <- Completed/inactive
  /templates          <- Templater templates
  /attachments        <- Media files
  /daily-notes        <- Daily notes
```

This follows the PARA method (Projects, Areas, Resources, Archive) by Tiago Forte. Notes are organized by actionability.

### Pattern 3: Hybrid (Recommended Starting Point)

```
vault-root
  /daily              <- Daily notes
  /templates          <- Templates
  /attachments        <- Media
  /projects           <- Active projects (1 folder per project)
  /maps               <- Maps of Content (index notes)
  (all other notes at root or loosely organized)
```

Use Maps of Content (MOCs) as index notes that link to related notes, providing structure without rigid hierarchy.

## Linking Strategies

### Atomic Notes

Each note should contain one idea, concept, or piece of knowledge. This makes linking precise and reusable.

```markdown
# Survivorship Bias

Survivorship bias is the logical error of concentrating on entities that
passed a selection process while overlooking those that did not. This can
lead to incorrect conclusions because failures are invisible.

## Examples
- Studying successful companies ignores the ones that failed using the same strategies
- WWII bomber armor: engineers studied returning planes' damage patterns,
  but the holes showed where planes could survive hits, not where they were vulnerable

## Related
- [[Cognitive Biases MOC]]
- [[Selection Bias]]
- [[Abraham Wald]] — statistician who identified the bomber armor problem
- [[How to Think Clearly]]

---
tags: #cognitive-bias #decision-making
source: "Thinking, Fast and Slow" by Daniel Kahneman
created: 2025-01-15
```

### Maps of Content (MOCs)

MOCs are index notes that curate links to related notes. They replace rigid folder structures with flexible, overlapping organization.

```markdown
# Cognitive Biases MOC

A map of cognitive biases I've encountered and documented.

## Decision-Making Biases
- [[Survivorship Bias]]
- [[Confirmation Bias]]
- [[Anchoring Effect]]
- [[Sunk Cost Fallacy]]

## Social Biases
- [[Fundamental Attribution Error]]
- [[Halo Effect]]
- [[Bandwagon Effect]]

## Memory Biases
- [[Hindsight Bias]]
- [[Availability Heuristic]]
- [[Peak-End Rule]]

## Meta
- [[Debiasing Strategies]]
- [[Mental Models MOC]] — overlapping topic

---
tags: #moc #psychology
```

### Link Types

Use different linking patterns for different relationships:

| Pattern | Syntax | Use For |
|---------|--------|---------|
| Direct link | `[[Note Name]]` | Strong, specific connection |
| Aliased link | `[[Note Name|display text]]` | Cleaner reading experience |
| Embedded link | `![[Note Name]]` | Include content inline |
| Header link | `[[Note Name#Section]]` | Link to specific section |
| Block link | `[[Note Name^block-id]]` | Link to specific paragraph |
| Tag | `#topic` | Broad categorization |
| Nested tag | `#topic/subtopic` | Hierarchical categorization |

### When to Link vs Tag

- **Link** when two specific notes are directly related (Note A references Note B)
- **Tag** when a note belongs to a broad category (#project-management)
- **Both** when the note is related to a specific note AND belongs to a category
- **MOC** when you need to curate and organize a collection of related notes

## Essential Plugins

### Community Plugins (Recommended Setup)

| Plugin | Purpose | Priority |
|--------|---------|----------|
| **Templater** | Advanced templates with JavaScript, date math, prompts | Essential |
| **Dataview** | Query notes like a database using frontmatter | Essential |
| **Calendar** | Visual calendar for daily notes navigation | High |
| **Periodic Notes** | Weekly/monthly/quarterly note templates | High |
| **QuickAdd** | Fast capture with templates and macros | High |
| **Kanban** | Kanban boards from markdown | Medium |
| **Excalidraw** | Visual thinking and diagrams | Medium |
| **Git** (Obsidian Git) | Version control and backup | Medium |
| **Linter** | Auto-format frontmatter and markdown | Medium |
| **Tasks** | Query and manage tasks across notes | Medium |
| **Strange New Worlds** | See how many notes link to current note | Low |
| **Graph Analysis** | Advanced graph metrics and clustering | Low |

### Templater Configuration

Settings to configure:
- Template folder: `templates`
- Trigger on new file creation: Enable
- Folder templates: Map folders to templates (e.g., `daily` folder uses Daily Note template)

### Dataview Basics

Dataview lets you query your notes using a SQL-like language or inline JavaScript.

```markdown
## All notes tagged #project-management created this month

```dataview
TABLE file.ctime as "Created", tags
FROM #project-management
WHERE file.ctime >= date(today) - dur(30 days)
SORT file.ctime DESC
```

## Tasks due this week

```dataview
TASK
WHERE due >= date(today) AND due <= date(today) + dur(7 days)
AND !completed
SORT due ASC
```

## Notes linking to this note

```dataview
LIST
FROM [[]]
SORT file.name ASC
```

## Project status dashboard

```dataview
TABLE status, due, assignee
FROM #project
WHERE status != "Complete"
SORT due ASC
```
```

## Templates

### Daily Note Template (Templater)

```markdown
---
date: <% tp.date.now("YYYY-MM-DD") %>
tags: daily
---

# <% tp.date.now("dddd, MMMM D, YYYY") %>

## Morning Intention
- What is the one thing that would make today successful?
  -

## Tasks
- [ ]
- [ ]
- [ ]

## Notes
-

## End of Day Review
- What went well?
  -
- What could improve?
  -
- Key insight:
  -

---
**Yesterday**: [[<% tp.date.now("YYYY-MM-DD", -1) %>]]
**Tomorrow**: [[<% tp.date.now("YYYY-MM-DD", 1) %>]]
```

### Weekly Review Template

```markdown
---
date: <% tp.date.now("YYYY-MM-DD") %>
week: <% tp.date.now("YYYY-[W]ww") %>
tags: weekly-review
---

# Weekly Review: <% tp.date.now("YYYY-[W]ww") %>

## Review Last Week

### Wins
1.
2.
3.

### Incomplete Tasks
```dataview
TASK
FROM "daily"
WHERE file.day >= date(<% tp.date.now("YYYY-MM-DD", -7) %>) AND file.day <= date(<% tp.date.now("YYYY-MM-DD") %>)
AND !completed
```

### Key Metrics
- Notes created this week:
- Connections made:
- Projects advanced:

## Plan Next Week

### Top 3 Priorities
1.
2.
3.

### Scheduled Commitments
- Monday:
- Tuesday:
- Wednesday:
- Thursday:
- Friday:

### Someday/Maybe Items to Consider
-
```

### Meeting Note Template

```markdown
---
date: <% tp.date.now("YYYY-MM-DD") %>
type: meeting
attendees:
project:
tags: meeting
---

# <% await tp.system.prompt("Meeting title") %>

## Context
- **Date**: <% tp.date.now("YYYY-MM-DD HH:mm") %>
- **Attendees**:
- **Purpose**:

## Agenda
1.
2.
3.

## Notes


## Decisions
-

## Action Items
- [ ] @person: task — due YYYY-MM-DD
```

### New Note Template (Zettelkasten-Style)

```markdown
---
date: <% tp.date.now("YYYY-MM-DD") %>
tags:
source:
---

# <% tp.file.title %>

[Write the core idea in your own words. One idea per note.]

## Why This Matters


## Related
- [[]]

## References
-
```

## Workflow Patterns

### Quick Capture Workflow

1. **Inbox folder** receives all quick captures
2. **QuickAdd** plugin provides hotkey (Ctrl+Q) to create inbox notes
3. **Daily processing**: Review inbox, extract atomic notes, link to existing notes, move or delete inbox items

### Literature Note Workflow

1. Read source material, highlight key ideas
2. Create a **literature note** summarizing the source in your own words
3. Extract **permanent notes** (atomic ideas) from the literature note
4. Link permanent notes to existing knowledge
5. Add the source to a **reading log** database

```markdown
# Literature Note: Thinking, Fast and Slow

**Author**: Daniel Kahneman
**Year**: 2011
**Rating**: 5/5

## Key Ideas
1. [[System 1 and System 2 Thinking]] — dual process theory of cognition
2. [[Anchoring Effect]] — initial exposure biases subsequent judgments
3. [[Loss Aversion]] — losses feel roughly twice as painful as equivalent gains
4. [[Peak-End Rule]] — experiences judged by peak intensity and ending

## My Takeaways
- Most decision-making is System 1 (fast, intuitive, error-prone)
- Awareness of biases does not eliminate them, but structured processes can mitigate them

## Quotes
> "A reliable way to make people believe in falsehoods is frequent repetition,
> because familiarity is not easily distinguished from truth."
```

### Project Management Workflow

Use a combination of a project note, linked task notes, and Dataview queries:

```markdown
# Project: Website Redesign

**Status**: In Progress
**Target**: 2025-03-01
**Lead**: @Sean

## Overview
Redesign the company website to improve conversion and accessibility.

## Tasks
```dataview
TASK
FROM [[]]
WHERE !completed
SORT due ASC
```

## Meeting Notes
```dataview
LIST
FROM #meeting AND [[]]
SORT file.ctime DESC
```

## Key Decisions
1. [[Decision - CMS Selection]] — chose Astro over Next.js
2. [[Decision - Design System]] — adopted Radix UI primitives
```

## Graph View Optimization

### Making the Graph Useful

The graph view is powerful but can become noise. Optimize it:

1. **Color by tag** — Assign colors to key tags (#moc, #project, #person, #concept)
2. **Filter by tag** — Focus on specific topic clusters
3. **Use local graph** — View connections for the current note only
4. **Create hub notes** — MOCs and index notes create visible clusters
5. **Orphan detection** — Notes with zero links need attention (link them or delete them)

### Graph Hygiene

- Run a weekly check for orphan notes (Dataview query):
  ```
  LIST FROM "" WHERE length(file.inlinks) = 0 AND length(file.outlinks) = 0
  ```
- Merge duplicate notes when discovered
- Rename notes for clarity (Obsidian auto-updates all links)
- Archive old project notes by adding an `#archive` tag (filter out of graph)

## Sync and Backup

### Sync Options

| Method | Platforms | Cost | Conflict Handling |
|--------|-----------|------|-------------------|
| Obsidian Sync | All | $4-8/mo | Built-in resolution |
| iCloud | Mac, iOS | Free | Can cause issues with large vaults |
| Git (Obsidian Git plugin) | Desktop | Free | Manual merge |
| Syncthing | All (with setup) | Free | File-level sync |
| Google Drive / OneDrive | Desktop | Free/included | Occasional conflicts |

### Backup Strategy

- **Primary**: Obsidian Sync or cloud sync for real-time
- **Secondary**: Obsidian Git plugin commits daily to a private repo
- **Vault export**: Periodic full vault export (it is all just markdown files)

## Migration Guide

**From Notion:** Export as Markdown/CSV, fix internal links (Notion uses page IDs), convert databases to Dataview frontmatter. **From Roam:** Export as Markdown; `[[wikilinks]]` mostly transfer directly. **From Evernote:** Use the Importer core plugin, then review formatting and add links.

## Vault Health Checklist

- [ ] Every note has at least one inbound or outbound link
- [ ] MOCs exist for major topic areas
- [ ] Daily note template is configured and used consistently
- [ ] Inbox is processed within 48 hours
- [ ] Backup runs daily (Git or cloud sync)
- [ ] Orphan notes are reviewed weekly
- [ ] Tags are consistent (no duplicates like #project and #projects)
- [ ] Attachments are in a dedicated folder
- [ ] Templates exist for recurring note types
- [ ] Plugin list is reviewed quarterly (remove unused plugins)


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to obsidian vault builder
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Obsidian Vault Builder Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with obsidian vault builder for my current situation"

**Output:**

Based on your situation, here is a structured approach to obsidian vault builder:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
