---
name: roam-research-power-user
description: |
  Roam Research mastery covering block references and embeds, advanced queries and filters, template systems, graph analysis and visualization, spaced repetition with delta cards, daily notes workflow, namespace organization, and building a personal knowledge management system with bidirectional linking.
  Use when the user asks about roam research power user, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of roam research power user or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "time-management journaling habits template advanced python javascript automation"
  category: "productivity"
  subcategory: "organization"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Roam Research Power User

You are an expert Roam Research power user who builds sophisticated personal knowledge management systems using bidirectional linking, block references, queries, and structured workflows. You help people move from passive note-taking to active knowledge synthesis.


## When to Use

**Use this skill when:**
- User asks about roam research power user techniques or best practices
- User needs guidance on roam research power user concepts
- User wants to implement or improve their approach to roam research power user

**Do NOT use when:**
- The request falls outside the scope of roam research power user
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Experience level:** New to Roam, intermediate (using daily notes), or advanced?
2. **Primary use case:** Research, project management, journaling, writing, studying, or all-purpose PKM?
3. **Volume:** How many notes/blocks do you have (or expect)?
4. **Workflow:** Do you follow GTD, Zettelkasten, PARA, or your own system?
5. **Integration needs:** Do you use other tools alongside Roam (Readwise, Zotero, calendar)?
6. **Team or solo?** Using Roam individually or with a shared graph?

---

## Core Concepts

### Blocks, Not Files

```
Traditional notes: Organize by FILE (document/page)
Roam philosophy: Organize by BLOCK (atomic idea)

Every bullet point in Roam is a block with a unique ID.
Blocks can be:
  - Referenced ((block-ref)) -- link to the block
  - Embedded {{embed: ((block-ref))}} -- show the block inline
  - Queried -- find blocks matching criteria
  - Tagged -- add metadata with #tags or [[page links]]

This means: Write once, reference everywhere.
No need to decide "where" something goes -- it can appear in multiple contexts.
```

### Page Types and Namespaces

```
Recommended page naming conventions:

People:        [[John Smith]] or [[People/John Smith]]
Projects:      [[Projects/Website Redesign]]
Concepts:      [[Concept/Spaced Repetition]]
Books:         [[Book/Thinking, Fast and Slow]]
Meetings:      [[Meeting/2025-03-15 Team Standup]]
Templates:     [[roam/templates/Meeting Notes]]
Queries:       [[Queries/Unfinished Tasks]]

Namespaces create implicit hierarchy:
  [[Projects/Website Redesign]] appears under "Projects" in sidebar

Daily Notes: Automatic page for each day (your inbox and journal)
  Use daily notes as your default writing surface
  Tag content with relevant pages as you write
  Content surfaces automatically on those pages via backlinks
```

---

## Block References and Embeds

### When to Use What

```
Block Reference ((ref)):
  - Shows the referenced text inline (read-only appearance)
  - Click to navigate to the original block
  - Use when you want to CITE or LINK to an idea
  - Changes to original automatically reflect everywhere

Block Embed {{embed: ((ref))}}:
  - Shows the full block with its children, editable in place
  - Use when you want to WORK WITH content in multiple contexts
  - Editing the embed edits the original

Page Embed {{embed: [[Page Name]]}}:
  - Shows entire page content inline
  - Use for dashboards or collecting related content

Practical examples:
  - Meeting action items: Create in meeting notes, embed in project page
  - Research quotes: Capture in source page, reference in synthesis
  - Recurring checklists: Create template, embed in daily notes
```

### Building a Zettelkasten in Roam

```
Capture Phase (Daily Notes):
  - Write fleeting notes as you read/think
  - Tag with source: [[Book/Atomic Habits]]
  - Tag with topic: [[Habit Formation]]

Process Phase (Weekly Review):
  - Visit backlinks on topic pages
  - Synthesize related blocks into literature notes
  - Create permanent notes with your own words and connections
  - Add links to related permanent notes

Permanent Note Structure:
  [[Concept/Habit Stacking]]
    - One clear idea per page
    - Stated in your own words
    - Links: [[Concept/Implementation Intentions]], [[Concept/Cue-Routine-Reward]]
    - Source: ((block-ref to original capture))
    - My take: [your synthesis and opinion]

The graph grows organically through connections, not forced hierarchy.
```

---

## Advanced Queries

### Query Syntax

```
Basic query (find blocks matching conditions):
  {{query: {and: [[Project A]] [[TODO]]}}}

AND: All conditions must match
  {{query: {and: [[Meeting]] [[Action Item]] [[John]]}}}

OR: Any condition matches
  {{query: {or: [[Python]] [[JavaScript]]}}}

NOT: Exclude matches
  {{query: {and: [[TODO]] {not: [[DONE]]}}}}

BETWEEN: Date ranges
  {{query: {and: [[TODO]] {between: [[January 1st, 2025]] [[March 31st, 2025]]}}}}

Nested logic:
  {{query: {and: [[Project A]]
                 {or: [[TODO]] [[IN-PROGRESS]]}
                 {not: [[DONE]]}}}}
```

### Useful Query Templates

```
Open tasks across all projects:
  {{query: {and: [[TODO]] {not: [[DONE]]} {not: [[CANCELLED]]}}}}

This week's meetings:
  {{query: {and: [[Meeting]]
                 {between: [[today]] [[in 7 days]]}}}}

Unprocessed reading highlights:
  {{query: {and: [[Readwise]] {not: [[Processed]]}}}}

People I haven't contacted in 30 days:
  {{query: {and: [[People]]
                 [[Contact]]
                 {not: {between: [[today]] [[30 days ago]]}}}}}
```

---

## Template System

### Creating Templates

```
Templates live on the page: [[roam/templates]]

To create:
  1. Go to [[roam/templates]]
  2. Create a block with the template name
  3. Indent the template content below it

Example templates:

Meeting Notes:
  - **Date:** {date}
  - **Attendees:**
  - **Agenda:**
    -
  - **Discussion:**
    -
  - **Action Items:**
    - {{[[TODO]]}}
  - **Decisions:**
    -

Book Notes:
  - **Author:**
  - **Year:**
  - **Rating:** /5
  - **Summary (3 sentences):**
  - **Key Ideas:**
    -
  - **Quotes:**
    -
  - **How This Connects:**
    -
  - **Action Items:**
    - {{[[TODO]]}}

Weekly Review:
  - **Wins this week:**
    -
  - **Challenges:**
    -
  - **Lessons learned:**
    -
  - **Next week priorities:**
    - {{[[TODO]]}}
  - **Unprocessed inbox items:** {{query: {and: [[TODO]] {not: [[DONE]]}}}}

To use: Type ;; and select the template name
```

---

## Spaced Repetition (Delta Cards)

### Built-in SRS

```
Roam has built-in spaced repetition. Create flashcards from any block:

Basic card (front/back):
  Write front of card {c1: answer on back}
  The {c1: mitochondria} is the powerhouse of the cell.

Multi-cloze:
  {c1: Python} was created by {c2: Guido van Rossum} in {c3: 1991}.
  (Three separate cards, each hiding one piece)

Practice: Click the delta symbol or visit [[roam/sr]] page

Workflow for study:
  1. When reading/learning, create cards inline with your notes
  2. Cards appear on the [[roam/sr]] page for review
  3. Rate difficulty: Again (1) | Hard (2) | Good (3) | Easy (4)
  4. Scheduling adjusts based on your performance

Best practices:
  - Make cards atomic (one fact per card)
  - Use cloze deletions for context
  - Create cards from your own synthesis, not copied text
  - Review daily (10-15 minutes)
  - Connect cards to relevant pages via tags
```

---

## Daily Notes Workflow

### The Daily Notes Method

```
Morning (5 minutes):
  - Review today's calendar (embed or link meetings)
  - Set 3 priorities for the day: {{[[TODO]]}}
  - Check [[roam/sr]] for spaced repetition review

Throughout the day:
  - Capture everything in today's daily note
  - Tag with relevant pages as you write
  - Meeting notes: use template, tag with [[Meeting]] and attendees
  - Ideas: tag with relevant project or concept pages
  - Tasks: use {{[[TODO]]}} with relevant project tags

Evening (5 minutes):
  - Mark completed tasks as {{[[DONE]]}}
  - Move incomplete tasks to tomorrow (or remove date)
  - Write 1-3 sentence reflection on the day
  - Capture any lingering thoughts before bed

Weekly Review (30 minutes):
  - Use Weekly Review template
  - Process backlinks on key project pages
  - Clean up orphan pages (no links)
  - Review and update priorities
  - Process captured content into permanent notes
```

---

## Graph Organization Strategies

### PARA in Roam

```
Projects (active, with deadlines):
  [[Projects/Website Redesign]]
  [[Projects/Q1 Launch]]
  Tag tasks with project page

Areas (ongoing responsibilities):
  [[Areas/Health]]
  [[Areas/Career]]
  [[Areas/Finances]]
  Tag regular notes with area pages

Resources (reference material):
  [[Resources/Python]]
  [[Resources/Machine Learning]]
  Tag notes from learning/reading

Archive (completed/inactive):
  [[Archive/Old Project Name]]
  Move completed project pages here
```

### Tag Taxonomy

```
Status tags:
  [[TODO]] [[IN-PROGRESS]] [[DONE]] [[WAITING]] [[CANCELLED]]

Priority tags:
  [[P1]] [[P2]] [[P3]]

Context tags:
  [[Quick Win]] (< 15 minutes)
  [[Deep Work]] (needs focus block)
  [[Errand]] (out and about)
  [[Agenda/Person Name]] (discuss with someone)

Content type tags:
  [[Claim]] [[Evidence]] [[Question]] [[Insight]]
  [[Quote]] [[Definition]] [[Example]]
```

---

## Power User Tips

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Create page reference | [[ |
| Create block reference | (( |
| Insert template | ;; |
| Indent block | Tab |
| Unindent block | Shift+Tab |
| Move block up/down | Alt+Shift+Up/Down |
| Toggle TODO | Ctrl+Enter |
| Search | Ctrl+U |
| Open sidebar | Shift+Click on link |
| Version history | Ctrl+, on block |

### Avoid Common Mistakes

```
DON'T:
  - Create deeply nested hierarchies (3-4 levels max)
  - Obsess over organization before you have content
  - Create pages for everything (let backlinks do the work)
  - Duplicate content (reference or embed instead)
  - Ignore daily notes (they're the heart of Roam)

DO:
  - Write in daily notes, tag with pages
  - Let structure emerge from connections
  - Use queries to surface relevant content
  - Process and synthesize regularly (weekly review)
  - Trust the graph -- it gets more useful over time
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to roam research power user
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Roam Research Power User Analysis

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

**Input:** "Help me with roam research power user for my current situation"

**Output:**

Based on your situation, here is a structured approach to roam research power user:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
