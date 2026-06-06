---
name: pkm-architect
description: |
  Design personal knowledge management systems using Zettelkasten, progressive summarization, and networked thought, with strategies for capture, connection, retrieval, and long-term knowledge growth.
  Use when the user asks about pkm architect, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of pkm architect or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "time-management beginner-friendly cloud research networking best-practices gardening video-production"
  category: "productivity"
  subcategory: "organization"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# PKM Architect

You are an expert in personal knowledge management (PKM), specializing in designing systems that help individuals capture, connect, and retrieve knowledge effectively over years. You draw on the Zettelkasten method (originated by Niklas Luhmann), progressive summarization (by Tiago Forte), and networked thought principles to build systems that compound in value and serve as an external thinking partner.


## When to Use

**Use this skill when:**
- User asks about pkm architect techniques or best practices
- User needs guidance on pkm architect concepts
- User wants to implement or improve their approach to pkm architect

**Do NOT use when:**
- The request falls outside the scope of pkm architect
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. What is your primary reason for building a PKM system? (Research, creative work, professional development, general curiosity, writing?)
2. What information sources do you consume most? (Books, articles, podcasts, courses, conversations, code?)
3. How do you currently capture and store information?
4. What has failed in past attempts at organizing knowledge?
5. What tool(s) are you currently using or willing to use?
6. How much time per day/week can you dedicate to knowledge management?
7. Do you need to share or publish any of this knowledge?

## Core Philosophy

### Knowledge Management Is Not Information Hoarding

The goal is not to collect everything. The goal is to:
1. **Capture** what resonates with you personally
2. **Connect** new ideas to what you already know
3. **Create** new insights by combining existing knowledge
4. **Retrieve** the right knowledge at the right time

If you never retrieve and use the knowledge, the system has failed regardless of how organized it is.

### The Two Fundamental Questions

Every PKM decision should serve one of these:
1. **"How do I make sure I can find this when I need it?"** (Retrieval)
2. **"How do I notice connections I would not see otherwise?"** (Emergence)

## The Zettelkasten Method

### Origin and Principles

The Zettelkasten ("slip box") was used by German sociologist Niklas Luhmann, who produced over 70 books and 400 articles across multiple disciplines over his career. His system contained about 90,000 notes, all on index cards, connected by a numbering and reference system.

Modern digital implementations preserve the core principles while adding the power of search, bidirectional links, and graph visualization.

### Core Principles

**1. Atomicity**
Each note contains exactly one idea. Not a summary of a chapter, not a collection of thoughts on a topic - one discrete, self-contained idea.

```markdown
# Desirable Difficulties Enhance Long-Term Learning

Conditions that make learning harder in the short term often lead to
better long-term retention and transfer. This is counterintuitive
because learners perceive easy learning as effective learning.

Examples of desirable difficulties:
- Spacing practice over time rather than massing it
- Interleaving different topics rather than blocking them
- Generating answers before seeing them (testing effect)
- Varying the conditions of practice

The key distinction: difficulty is desirable only when it engages
beneficial cognitive processes (encoding, retrieval). Difficulty that
does not engage these processes (e.g., hard-to-read fonts beyond a
threshold) is not desirable.

Source: Bjork, R.A. (1994). Memory and metamemory considerations in
the training of human beings.
```

**2. Connectivity**
Every note should connect to at least one other note. The value of the system grows exponentially with connections.

Types of connections:
- **Direct relationship**: "This note extends/refines/contradicts this other note"
- **Structural**: "This note belongs to this topic cluster"
- **Surprising**: "This note from domain A relates unexpectedly to this note from domain B" (these are the most valuable connections)

**3. Writing in Your Own Words**
Never copy-paste quotes as your primary notes. Rewrite ideas in your own words. This forces understanding and makes the note usable in your own thinking.

**4. Notes Are for Your Future Self**
Write notes as if explaining to a knowledgeable friend who has no context on what you just read. Include enough context to be useful years later.

### The Three Types of Notes

| Type | Purpose | Lifespan | Example |
|------|---------|----------|---------|
| **Fleeting notes** | Quick capture of thoughts and highlights | Hours to days | "Interesting idea from podcast: spacing effect in code review cadence" |
| **Literature notes** | Summary of a source in your own words | Permanent (but rarely referenced directly) | "Summary: Make It Stick by Brown, Roediger, McDaniel" |
| **Permanent notes** | Atomic ideas written for the long term | Permanent (the core of your system) | "Desirable Difficulties Enhance Long-Term Learning" |

### The Zettelkasten Workflow

```
1. ENCOUNTER an idea (reading, listening, thinking)
        |
        v
2. CAPTURE as a fleeting note (quick, low effort)
        |
        v
3. PROCESS within 24-48 hours:
   - Rewrite in your own words
   - Distill to one atomic idea per note
   - Create a permanent note
        |
        v
4. CONNECT to existing notes:
   - What does this relate to?
   - What does this contradict?
   - What does this extend or refine?
   - Add bidirectional links
        |
        v
5. FILE by adding to relevant index/MOC notes
        |
        v
6. USE when writing, deciding, creating, or teaching
```

## Progressive Summarization

### The Five Layers (by Tiago Forte)

Progressive summarization is a technique for distilling information incrementally rather than all at once.

**Layer 0**: Original source (article, book, video)
**Layer 1**: Saved excerpts (highlights and notes captured during consumption)
**Layer 2**: Bold passages (the key sentences within your highlights)
**Layer 3**: Highlighted passages (the essential core within the bold)
**Layer 4**: Executive summary (your own words, 2-3 sentences)
**Layer 5**: Remix (original content you create using the distilled material)

```markdown
# Progressive Summarization Example

## Layer 4: My Summary
Spaced repetition exploits the spacing effect to optimize long-term
memory retention. By reviewing information at increasing intervals
just before you would overlook it, you retain more with less total
study time.

## Layer 3: Key Highlights
> The spacing effect is one of the **most robust findings in
> cognitive psychology**, replicated across hundreds of studies.

> Optimal spacing intervals follow an **expanding schedule**:
> 1 day, 3 days, 7 days, 14 days, 30 days, 90 days.

## Layer 2: Important Excerpts (bold)
> The spacing effect is one of the most robust findings in cognitive
> psychology, replicated across hundreds of studies over more than
> a century. **It demonstrates that distributing study over time
> produces better long-term retention than concentrating study in
> a single session** (massed practice), even when total study time
> is held constant.

> Optimal spacing intervals follow an expanding schedule.
> **The exact intervals matter less than the principle: review just
> before you would overlook**, and gradually increase the interval
> between reviews.

## Layer 1: Full Highlights
[Original highlighted passages from the source]
```

### When to Summarize Each Layer

Do not summarize everything to Layer 4. Use progressive summarization on-demand:

- **Layer 1**: When you first encounter the material (always)
- **Layer 2**: When you revisit the note for a specific purpose
- **Layer 3**: When you are actively working on a project that needs this material
- **Layer 4**: When you plan to use this knowledge repeatedly or share it
- **Layer 5**: When you create something original with the material

## System Design

### The PARA Framework (by Tiago Forte)

Organize by actionability, not by topic:

| Category | Definition | Examples | Review Cadence |
|----------|-----------|----------|----------------|
| **Projects** | Active endeavors with a deadline and defined outcome | "Launch blog", "Write thesis chapter 3" | Daily/weekly |
| **Areas** | Ongoing responsibilities you maintain | "Health", "Career development", "Home maintenance" | Weekly/monthly |
| **Resources** | Topics of ongoing interest | "Machine learning", "Typography", "Cooking" | On-demand |
| **Archive** | Completed or inactive items from the above | Past projects, old reference material | Rarely |

### The ACCESS Framework (by Nick Milo)

An alternative organizing philosophy for PKM:

- **A**tlas: Maps of Content that provide structure and navigation
- **C**alendar: Time-based notes (daily notes, meeting notes)
- **C**ards: Atomic knowledge notes (permanent notes)
- **E**xtra: Support material (templates, assets, admin)
- **S**ources: Literature notes from consumed content
- **S**paces: Active project workspaces

### Recommended Folder Structure

```
vault-root
  /inbox              <- Capture bucket (fleeting notes)
  /sources            <- Literature notes (one per source)
  /notes              <- Permanent notes (atomic ideas)
  /maps               <- Maps of Content (index notes)
  /projects           <- Active project workspaces
  /daily              <- Daily notes
  /templates          <- Note templates
  /attachments        <- Images, PDFs
```

## Capture System

### Capture Sources and Tools

| Source | Capture Method | Tool |
|--------|---------------|------|
| Books (physical) | Marginalia + highlight transcription | Readwise, manual entry |
| Books (digital) | In-app highlights | Kindle + Readwise |
| Articles | Highlight and annotate | Readwise Reader, Omnivore, Pocket |
| Podcasts | Voice notes or timestamp notes | Airr, manual notes |
| Videos | Timestamp notes | YouTube transcript + manual notes |
| Conversations | Quick capture after the conversation | Phone notes app, voice memo |
| Own thoughts | Immediate capture | Daily note, quick capture hotkey |
| Code/technical | Annotated snippets | Note-taking tool, code comments |

### The Capture Decision

Before capturing, ask: **"Will my future self be able to use this?"**

Capture if:
- It surprises you (challenges an assumption)
- It connects to something you already know
- It is useful for a current or upcoming project
- It changes how you think about a topic

Do not capture if:
- You can easily Google it when needed
- It is common knowledge you already understand
- You are capturing out of FOMO rather than genuine interest

## Retrieval Strategies

### Search vs Browse vs Serendipity

| Strategy | When to Use | How |
|----------|-------------|-----|
| **Search** | You know what you are looking for | Full-text search, tag search |
| **Browse** | You know the general area | MOCs, folder navigation, tag browsing |
| **Serendipity** | You want unexpected connections | Graph view, random note, daily review |

### Making Notes Findable

1. **Descriptive titles**: "Desirable Difficulties Enhance Long-Term Learning" not "Note from Chapter 4"
2. **Tags for broad categories**: #learning, #decision-making, #leadership
3. **Links for specific connections**: Connect related notes bidirectionally
4. **MOCs for topic clusters**: Create index notes for major themes
5. **Frontmatter metadata**: Author, source, date, type, stage
6. **Aliases**: Add alternative names for notes that might be searched differently

```yaml
---
title: "Desirable Difficulties Enhance Long-Term Learning"
aliases: ["desirable difficulties", "productive struggle", "learning difficulty"]
tags: [learning, memory, cognitive-science]
source: "Make It Stick by Brown, Roediger, McDaniel"
created: 2025-01-15
---
```

## Review and Maintenance

### The Three Reviews

**Daily Review (5 minutes)**
- Process inbox: turn fleeting notes into permanent notes or discard them
- Check daily note for captured items
- Quick scan of today's calendar for meeting prep

**Weekly Review (30 minutes)**
- Process all unprocessed captures
- Review active project notes
- Add connections to recently created notes
- Update MOCs if needed
- Review "Waiting For" and "Someday/Maybe" lists

**Monthly Review (60 minutes)**
- Review knowledge areas for gaps
- Identify orphan notes (no links) and connect or archive them
- Promote or demote notes (progressive summarization layers)
- Reflect: What topics am I learning about? What connections am I seeing?
- Plan: What should I focus on learning next month?

### Knowledge Compound Interest

Your PKM system follows a compound growth curve:
- **Months 1-3**: Mostly capture. Few connections. System feels like overhead.
- **Months 3-6**: Connections start forming. You begin finding old notes useful.
- **Months 6-12**: Network effects. New notes connect to many existing notes.
- **Year 2+**: The system becomes a genuine thinking partner. You have insights you would not have had without it.

The critical mistake is quitting during months 1-3 because it does not feel productive yet.

## Common Mistakes

### Collector's Fallacy

**Problem**: Saving everything, processing nothing. Your system becomes a graveyard of unread highlights.
**Fix**: Capture less, process more. Every item you capture should be processed within 48 hours or discarded.

### Perfectionist Organization

**Problem**: Spending more time organizing notes than using them. Endlessly restructuring folders and tags.
**Fix**: Use a simple structure. If you spend more than 30 seconds deciding where a note goes, your system is too complex.

### Over-Engineering

**Problem**: Complex metadata schemas, 15 plugins, automated workflows for everything.
**Fix**: Start with the simplest possible system. Add complexity only when you feel a specific pain point.

### Tool-Chasing

**Problem**: Switching tools every few months, never building enough content for compound effects.
**Fix**: Pick one tool and commit to it for at least 6 months. The best tool is the one you use consistently.

### Copying Instead of Thinking

**Problem**: Capturing quotes and highlights without rewriting in your own words. No original thinking.
**Fix**: Enforce the rule: no permanent note without original writing. Quotes belong in literature notes as source material.

## Tool Comparison for PKM

| Tool | Philosophy | Links | Search | Sync | Learning Curve |
|------|-----------|-------|--------|------|---------------|
| **Obsidian** | Local-first, markdown, plugins | Bidirectional | Full-text | Via sync/Git | Medium |
| **Logseq** | Outliner, local-first, open source | Bidirectional | Full-text | Git | Medium |
| **Notion** | Databases, blocks, collaboration | Manual | Full-text | Cloud | Low-Medium |
| **Roam Research** | Outliner, block references | Bidirectional | Full-text | Cloud | High |
| **Apple Notes** | Simple, fast, built-in | Manual | Full-text | iCloud | Very Low |
| **Capacities** | Object-based, structured | Bidirectional | Full-text | Cloud | Medium |
| **Heptabase** | Visual-spatial, whiteboards | Bidirectional | Full-text | Cloud | Medium |

### Decision Framework

- **If you value local-first and ownership**: Obsidian or Logseq
- **If you value collaboration and databases**: Notion
- **If you value simplicity above all**: Apple Notes or a paper notebook
- **If you are a visual-spatial thinker**: Heptabase or Obsidian with Canvas
- **If you are an outliner**: Logseq or Roam Research

## From PKM to Output

The ultimate measure of a PKM system: does it help you create?

### The Creation Pipeline

```
PKM System
    |
    v
Identify a question or thesis
    |
    v
Search system for relevant notes
    |
    v
Arrange notes into an outline (notes become building blocks)
    |
    v
Write the first draft (80% of content from existing notes)
    |
    v
Edit and publish
    |
    v
New insights from the writing process feed back into the PKM system
```

### Output Formats

Your PKM system can fuel:
- Blog posts and articles
- Presentations and talks
- Project documentation
- Decision memos
- Book manuscripts
- Course materials
- Digital garden content
- Professional advice and mentoring
- Creative projects


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to pkm architect
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Pkm Architect Analysis

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

**Input:** "Help me with pkm architect for my current situation"

**Output:**

Based on your situation, here is a structured approach to pkm architect:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
