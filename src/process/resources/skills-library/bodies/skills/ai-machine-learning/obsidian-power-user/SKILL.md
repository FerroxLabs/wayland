---
name: obsidian-power-user
description: |
  Advanced Obsidian knowledge management covering Zettelkasten methodology, linking strategy, graph navigation, essential community plugins, templates, daily notes workflow, publishing options, and personal knowledge management principles.
  Use when the user asks about obsidian power user, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of obsidian power user or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml template advanced automation research networking energy-efficiency time-management"
  category: "ai-machine-learning"
  subcategory: "llm-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Obsidian Power User


## When to Use

**Use this skill when:**
- User asks about obsidian power user techniques or best practices
- User needs guidance on obsidian power user concepts
- User wants to implement or improve their approach to obsidian power user

**Do NOT use when:**
- The request falls outside the scope of obsidian power user
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. What is your primary purpose for Obsidian? (Note-taking, research, writing, project management, PKM)
2. What does your current note-taking system look like? What's working and what isn't?
3. Are you familiar with Markdown?
4. How much content will you be working with? (Dozens, thousands, tens of thousands of notes)
5. Do you need to sync across devices?
6. Will you publish any of your notes?
7. Are you comfortable installing community plugins?
8. What other tools do you need to integrate with? (Zotero, Readwise, Todoist)
9. Do you prefer structured organization (folders) or emergent organization (links and tags)?
10. How much setup time are you willing to invest?

## Zettelkasten Method in Obsidian

### Core Principles

1. **Atomic notes**: Each note contains one idea, fully developed
2. **Linking**: Notes connect to other notes, creating a web of knowledge
3. **Your own words**: Never just copy -- restate ideas in your own understanding
4. **Emergence**: Structure emerges from connections, not pre-defined categories

### Note Types

| Type | Location | Purpose | Lifespan |
|------|----------|---------|----------|
| Fleeting notes | Daily Notes / Inbox | Quick captures, raw thoughts | Temporary (process in 24-48 hrs) |
| Literature notes | Sources/ folder | Key ideas from books/articles in YOUR words | Permanent |
| Permanent notes | Notes/ folder | Your original thinking, one idea per note (100-300 words) | Permanent |
| Structure notes (MOCs) | MOC/ folder | Curated links organizing clusters of related notes | Evolving |
| Project notes | Projects/ folder | Active project management, tasks, drafts | Project lifespan |

### The Zettelkasten Workflow

```
1. CAPTURE: Encounter idea -> write fleeting note immediately
2. PROCESS (within 24-48 hrs): Write permanent note in own words,
   give clear title, add links, tag for discovery
3. CONNECT: Ask "What does this relate to?" Link to 2-5 existing notes.
   Update existing notes with backlinks. Add to relevant MOCs.
4. DEVELOP: Review clusters periodically, find patterns/contradictions,
   write synthesis notes
5. CREATE: Use note network as raw material for articles, essays, decisions
```

## Linking Strategy

### Types of Links

- **Direct** `[[Note Name]]`: Connecting directly related ideas
- **Aliased** `[[Note Name|Display Text]]`: When note name doesn't fit naturally in prose
- **Block** `[[Note Name#^block-id]]`: Referencing a specific paragraph
- **Embedded** `![[Note Name]]`: Including another note's content inline (use sparingly)

### Best Practices

1. **Link generously but meaningfully** -- every link should represent a genuine connection
2. **Use descriptive titles** -- "The Paradox of Choice in Decision Making" not "Note 47"
3. **Bidirectional awareness** -- when linking A to B, consider if B should also link to A
4. **Context in links** -- add a sentence explaining WHY you're linking
5. **Avoid orphan notes** -- every permanent note should have at least 2 links (in or out)
6. **Link to concepts, not containers** -- `[[Compound Interest]]` not `[[Finance Folder]]`

## Graph Navigation

### Graph View Settings

```
Filters: Show tags Off, Show attachments Off, Show orphans On
Groups (color code): MOCs: Blue, Literature: Green, Projects: Orange
Display: Center/Repel force Medium, Link force Low, Link distance Medium
```

### Using the Graph

- **Finding clusters**: Dense groups indicate deep knowledge areas
- **Finding gaps**: Sparse areas suggest unexplored connections
- **Finding orphans**: Isolated nodes need more links or may be low-value
- **Local graph**: More useful for daily work -- shows only immediate connections

## Essential Community Plugins

### Must-Have

| Plugin | Purpose |
|--------|---------|
| Templater | Advanced templates with dynamic content, dates, prompts |
| Dataview | Database queries across your vault (tables, lists from metadata) |
| Calendar | Calendar widget for daily notes navigation |
| Periodic Notes | Daily, weekly, monthly, yearly note templates |
| Quick Add | Fast note capture with templates |
| Tasks | Task management -- query and aggregate tasks from anywhere |
| Obsidian Git | Automatic version control and backup |

### Recommended

| Plugin | Purpose |
|--------|---------|
| Excalidraw | Drawing and diagramming |
| Kanban | Project management boards |
| Tag Wrangler | Rename, merge, organize tags |
| Readwise Official | Import highlights |
| Zotero Integration | Academic citation management |
| Linter | Consistent formatting |
| Homepage | Custom start page |

### Dataview Essentials

Add metadata via YAML frontmatter, then query it:

```dataview
TABLE source, status, created
FROM "Sources"
WHERE type = "literature"
SORT created DESC LIMIT 10
```

Other useful queries: `LIST FROM #productivity SORT file.mtime DESC`, `TASK FROM "Projects" WHERE !completed`, notes modified this week using `file.mtime >= date(today) - dur(7 days)`.

## Templates

### Daily Note Template

```markdown
---
type: daily
date: {{date:YYYY-MM-DD}}
---
# {{date:dddd, MMMM Do, YYYY}}

## Morning Intentions
- ONE most important thing:
- Energy level (1-10):

## Tasks
### Must Do
- [ ]
### Should Do
- [ ]

## Notes and Ideas

## End of Day Review
- What went well?
- What could be improved?

---
<< [[{{date-1d:YYYY-MM-DD}}]] | [[{{date+1d:YYYY-MM-DD}}]] >>
```

### Permanent Note Template

```markdown
---
type: permanent
topics: []
status: seed
created: {{date:YYYY-MM-DD}}
---
# {{title}}

[One clear statement of the main idea]

## Explanation
[100-300 words in your own words]

## Connections
- Related to [[]]
- Supports/contradicts [[]]

## Source
[Where this idea came from]
```

## Daily Notes Workflow

**Morning (5-10 min):** Open today's daily note, review yesterday for unfinished items, set top 3 tasks, check calendar.

**Throughout the day:** Capture fleeting notes in daily note, use `[[double brackets]]` freely, add tasks as they arise.

**Evening (10-15 min):** Process fleeting notes (create permanent notes, literature notes, or delete), check off tasks, write reflection, set tomorrow's priorities.

### Making Daily Notes Discoverable

- Tag with topics: `#meeting/project`, `#idea`, `#learning`
- Use Dataview to aggregate across daily notes
- Link to relevant project and topic notes
- Monthly review: skim last 30 daily notes for missed insights

## Publishing

| Method | Complexity | Cost | Best For |
|--------|-----------|------|----------|
| Obsidian Publish | Very Low | $8/mo | Official, integrated |
| Quartz | Medium | Free (hosting) | Developers, custom digital garden |
| MkDocs | Medium | Free (hosting) | Technical documentation |
| Hugo | Medium-High | Free (hosting) | Full blogs |

**Publish:** Well-developed permanent notes, MOCs, how-to guides, original frameworks.
**Keep private:** Fleeting notes, journals, incomplete thinking, sensitive info, daily notes.

## PKM Principles

### Vault Structure (Zettelkasten + PARA Hybrid)

```
/Inbox          Fleeting notes waiting to be processed
/Notes          Permanent notes (Zettelkasten)
/Sources        Literature notes
/MOCs           Maps of Content
/Projects       Active projects
/Areas          Ongoing areas of responsibility
/Templates      Note templates
/Archive        Completed and inactive material
```

### Core Principles

1. **Capture everything** -- the cost of not capturing is higher than capturing too much
2. **Process regularly** -- unprocessed captures are worthless
3. **Connect actively** -- every note links to at least 2 other notes
4. **Write in your own words** -- copying without thinking is not learning
5. **Use it for output** -- a system only has value if you create from it
6. **Trust the system** -- search and link, don't try to remember locations
7. **Simple beats complex** -- the best system is one you actually use

### Maintenance Schedule

```
Daily: Process inbox, update daily note
Weekly: Weekly review, process fleeting notes
Monthly: Review orphan notes, update MOCs, archive completed projects
Quarterly: Audit plugins, review vault structure, prune unused tags
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to obsidian power user
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Obsidian Power User Analysis

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

**Input:** "Help me with obsidian power user for my current situation"

**Output:**

Based on your situation, here is a structured approach to obsidian power user:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
