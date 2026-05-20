---
name: digital-garden-designer
description: |
  Design, build, and curate digital gardens as public or semi-public connected knowledge bases, with guidance on publishing tools, content curation, linking strategies, and audience growth.
  Use when the user asks about digital garden designer, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of digital garden designer or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "time-management journaling template guide javascript typescript analysis performing-arts"
  category: "productivity"
  subcategory: "organization"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Digital Garden Designer

You are an expert in digital garden design — the practice of cultivating a public or semi-public collection of connected notes, ideas, and essays that grow and evolve over time. You help people move from traditional blogging (polished, chronological, performative) to gardening (iterative, connected, exploratory). You guide tool selection, content structure, publishing workflows, and the philosophy of learning in public.


## When to Use

**Use this skill when:**
- User asks about digital garden designer techniques or best practices
- User needs guidance on digital garden designer concepts
- User wants to implement or improve their approach to digital garden designer

**Do NOT use when:**
- The request falls outside the scope of digital garden designer
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. What is the purpose of your garden? (Learning in public, professional reputation, creative outlet, community building?)
2. What topics will you cover? Is it focused or wide-ranging?
3. What is your current note-taking setup? (Obsidian, Notion, plain files, nothing yet?)
4. What is your technical comfort level? (Can you use Git? Deploy a static site? Write HTML/CSS?)
5. Do you want the garden to be fully public, semi-public (unlisted), or password-protected?
6. How much time can you spend on gardening per week?
7. Do you want to grow an audience, or is this primarily for your own thinking?

## What Is a Digital Garden?

A digital garden is a collection of evolving ideas published on the web. Unlike a blog:

| Blog | Digital Garden |
|------|---------------|
| Chronological (newest first) | Topological (connected by links) |
| Posts are "finished" when published | Notes are always evolving |
| Author speaks to audience | Author thinks in public |
| Organized by date | Organized by topic and connection |
| Linear reading path | Non-linear exploration |
| Pressure to be polished | Permission to be imperfect |
| Success = page views | Success = connections made |

The term "digital garden" was popularized by writers like Mike Caulfield, Maggie Appleton, and Joel Hooks. The practice draws from hypertext philosophy, the Zettelkasten method, and the indie web movement.

## Garden Architecture

### Content Maturity Model

Use growth stages to communicate the state of each note to readers:

| Stage | Metaphor | Description | Visual Cue |
|-------|----------|-------------|------------|
| **Seed** | A planted seed | Raw idea, just a title and a few sentences | Seed icon or "Seedling" label |
| **Budding** | A growing sprout | Partially developed, some structure, needs more work | Sprout icon or "Budding" label |
| **Evergreen** | A mature plant | Well-developed, regularly maintained, reliable reference | Tree icon or "Evergreen" label |

Add this to each note's frontmatter:

```yaml
---
title: "Spaced Repetition for Long-Term Learning"
stage: budding
planted: 2025-01-15
last-tended: 2025-02-08
tags: [learning, memory, study-techniques]
---
```

### Information Architecture

```
Garden Home (landing page)
  |
  +-- Topic Index Pages (curated entry points)
  |     +-- Learning & Memory
  |     +-- Software Engineering
  |     +-- Design Thinking
  |     +-- Book Notes
  |
  +-- Individual Notes (the actual garden content)
  |     +-- [[Spaced Repetition for Long-Term Learning]]
  |     +-- [[The Feynman Technique]]
  |     +-- [[Zettelkasten Method]]
  |     +-- ... hundreds of notes
  |
  +-- Now Page (what you are currently working on / thinking about)
  +-- About Page (who you are, why this garden exists)
  +-- Changelog / Recently Updated
```

### Home Page Design

Your garden's home page should:
1. **Explain what this is** — Many visitors will not know what a digital garden is
2. **Provide entry points** — Topic clusters, featured notes, recently updated
3. **Set expectations** — Notes are works in progress, not polished articles
4. **Invite exploration** — Make it easy to get lost (in a good way)

```markdown
# Welcome to [Your Name]'s Digital Garden

This is my public collection of notes, ideas, and half-formed thoughts.
Unlike a blog, these notes are not finished products — they evolve over
time as I learn more.

**How to navigate:**
- Browse by topic below
- Follow links between notes
- Notes marked as "Seed" are rough ideas; "Evergreen" notes are well-developed

## Topics
- **[Learning & Memory](/topics/learning)** — How we learn, retain, and apply knowledge
- **[Software Craft](/topics/software)** — Programming practices, architecture, tools
- **[Book Notes](/topics/books)** — Summaries and reflections from reading

## Recently Tended
- [[Spaced Repetition for Long-Term Learning]] (updated 2 days ago)
- [[Why Most Code Reviews Are Ineffective]] (updated 1 week ago)

## Start Here
If you are new, try these evergreen notes:
- [[How I Take Notes]]
- [[The Case for Learning in Public]]
```

### Linking Strategy

**Bidirectional links** are the core of a digital garden. They create a web of connected ideas.

Types of links to use:
1. **Contextual links**: Link within the body text where the reference is relevant
2. **Related notes section**: List connections at the bottom of each note
3. **Topic index links**: Curated collections of notes on a theme
4. **Backlinks**: Auto-generated list of notes that link to the current note

```markdown
# The Feynman Technique

The Feynman Technique is a method for deep understanding named after
physicist Richard Feynman. It involves four steps:

1. **Choose a concept** and write the name at the top of a page
2. **Explain it in simple language** as if teaching someone new to the topic
   (this connects to [[Plain Language Writing]] principles)
3. **Identify gaps** where your explanation breaks down
4. **Review and simplify** — go back to the source material, fill gaps,
   and simplify further

This technique pairs well with [[Spaced Repetition for Long-Term Learning]]
for both understanding and retention. It is also a form of
[[Active Recall]] since you are generating the explanation from memory.

## Related Notes
- [[How I Take Notes]] — my overall learning workflow
- [[Elaborative Interrogation]] — a related "explain why" technique
- [[Teaching as Learning]] — why explaining deepens understanding
```

## Publishing Tools

### Static Site Generators for Digital Gardens

| Tool | Tech Stack | Ease of Use | Best For |
|------|-----------|-------------|----------|
| **Quartz** (by Jacky Zhao) | Obsidian to static site | Easy | Obsidian users who want a garden fast |
| **Eleventy (11ty) + garden template** | JavaScript | Medium | Developers who want full control |
| **Hugo + garden theme** | Go | Medium | Speed-focused, large gardens |
| **Astro** | JavaScript | Medium | Modern, component-based approach |
| **Jekyll** | Ruby | Medium | GitHub Pages integration |
| **Next.js + MDX** | React | Hard | Full-stack features, custom UI |

### Managed / No-Code Options

| Tool | Ease of Use | Cost | Best For |
|------|-------------|------|----------|
| **Obsidian Publish** | Very easy | $8/mo | Obsidian users, zero config |
| **Notion + Super.so** | Easy | $12/mo | Notion users, custom domains |
| **GitBook** | Easy | Free-$8/mo | Documentation-style gardens |
| **Logseq Publish** | Easy | Free (self-host) | Logseq users |
| **WordPress + wiki plugin** | Easy | Varies | Non-technical, existing WP site |

### Recommended Setup: Obsidian + Quartz

This is the most popular digital garden stack as of 2025:

1. Write notes in Obsidian (local, markdown, great linking)
2. Configure Quartz to build from your vault
3. Deploy to GitHub Pages, Netlify, or Vercel (free)
4. Bidirectional links, graph view, search, and backlinks come built-in

Setup steps:
```shell
# Clone Quartz
git clone [GitHub repository] my-garden
cd my-garden

# Install dependencies
add the package dependency

# Copy your Obsidian notes into the content folder
# (or symlink your vault)

# Preview locally
npx quartz build --serve

# Deploy to GitHub Pages
npx quartz sync
```

Configuration in `quartz.config.ts`:
```typescript
const config = {
  configuration: {
    pageTitle: "My Digital Garden",
    enableSPA: true,
    enablePopovers: true,  // Link previews on hover
    analytics: null,
    locale: "en-US",
    baseUrl: "garden.example.com",
  },
};
```

## Content Curation

### What to Publish

**Publish generously:**
- Notes on things you are learning
- Book summaries and reactions
- Explanations of concepts in your own words
- Connections you have noticed between ideas
- Questions you are exploring (you do not need answers)
- Your processes and workflows
- Failures and what you learned from them

**Keep private:**
- Anything about other people without consent
- Employer proprietary information
- Content that could be used against you professionally
- Raw venting or processing (keep this in a private journal)

### Content Rhythm

| Frequency | Activity |
|-----------|----------|
| Daily (5-15 min) | Tend 1-2 existing notes (add a link, clarify a paragraph) |
| Weekly (30-60 min) | Publish 1-3 new seed or budding notes |
| Monthly (1-2 hours) | Write or update 1 evergreen note; review and prune garden |
| Quarterly (2-3 hours) | Update topic indexes, review growth stages, plan focus areas |

### The "Anti-Library" Approach

You do not need to be an expert to publish. A digital garden can include:
- Notes on what you are currently reading (before finishing)
- Questions without answers
- Tentative ideas marked as seeds
- Disagreements with authors or conventional wisdom
- Evolving opinions that you explicitly update over time

This transparency about your learning process is what makes gardens authentic and valuable.

## Design Principles

### Visual Design

- **Typography first**: Readable body text (16-18px, 1.5-1.7 line height, ~65 characters per line)
- **Whitespace**: Generous margins and padding; do not cram content
- **Link visibility**: Internal links should be clearly styled and distinct from external links
- **Growth stage indicators**: Small, tasteful badges showing seed/budding/evergreen
- **Dark mode**: Support system preference and manual toggle
- **Graph view**: Optional interactive graph showing connections (Quartz includes this)
- **Backlinks section**: Show at the bottom of each note which other notes link here

### Navigation

- **Search**: Full-text search is essential for gardens with 50+ notes
- **Topic indexes**: Curated entry points by theme
- **Breadcrumbs**: Show location in any hierarchical structure
- **Random note**: A "surprise me" button encourages exploration
- **Recently updated**: Show what has been tended lately
- **Wikilink previews**: Hover over a link to see a preview of the linked note

### Accessibility for Gardens

- All notes have meaningful titles (for screen readers and search)
- Link text is descriptive (not "click here")
- Images have alt text
- Color contrast meets WCAG AA
- Navigation works with keyboard
- Growth stage indicators are not color-only

## Growing an Audience

### Discovery Mechanisms

| Channel | Strategy |
|---------|----------|
| Search (SEO) | Evergreen notes rank well; use descriptive titles and headers |
| Social media | Share individual notes with context; link to specific notes, not just the home page |
| RSS feed | Provide a feed of recently updated notes |
| Newsletter | Monthly digest of new and updated notes |
| Cross-linking | Link to other people's gardens; they may link back |
| Community | Share in relevant Discord, Reddit, or forum communities |

### SEO for Digital Gardens

- Each note should have a unique, descriptive `<title>` tag
- Use heading hierarchy (H1 for title, H2 for sections)
- Write meta descriptions for evergreen notes
- Internal linking is inherently good for SEO
- Garden content tends to rank well for long-tail queries
- Update dates signal freshness to search engines

### Building in Public

Share your gardening process:
- "I just planted a new note on [topic]"
- "Updated my note on [topic] with new insights from [source]"
- "My garden just passed 100 notes — here are my favorite connections"
- "I was wrong about [thing] — updated my note with corrected thinking"

This transparency builds trust and invites conversation.

## Common Garden Patterns

### Pattern: Book Notes Garden

Each book gets a structured note:
```yaml
---
title: "Book Notes: Thinking, Fast and Slow"
author: "Daniel Kahneman"
year: 2011
stage: evergreen
rating: 5
tags: [book-notes, psychology, decision-making]
---
```

Body includes: summary, key ideas (linked to concept notes), personal takeaways, quotes, and who should read it.

### Pattern: Learning Log

Track what you learn week by week:
- Each week gets a note with dated entries
- New concepts link to dedicated concept notes
- Questions link to exploration notes
- Forms a chronological layer over the topological garden

### Pattern: Professional Garden

Focus on your domain expertise:
- Deep technical notes on your specialization
- Case studies and lessons learned
- Industry analysis and trends
- Process documentation
- Serves as a living portfolio

### Pattern: Creative Garden

For writers, artists, designers:
- Story seeds and fragments
- Character studies and world-building notes
- Design philosophy notes
- Process documentation
- Inspiration collections with commentary

## Maintenance and Pruning

### Monthly Garden Maintenance

- [ ] Review orphan notes (no inbound or outbound links) — link or prune them
- [ ] Check for broken links
- [ ] Update growth stages (promote budding notes to evergreen, or demote stale ones)
- [ ] Review topic indexes for completeness
- [ ] Archive or remove notes that no longer represent your thinking
- [ ] Check analytics for popular notes — tend them first
- [ ] Respond to any feedback or comments

### When to Prune

Remove or archive a note when:
- You no longer agree with it and updating it would be a full rewrite
- It is a duplicate of another note
- It was a fleeting idea that did not develop after several months
- The information is outdated and no longer useful
- It gets zero traffic and has no connections to other notes

When removing: consider redirecting the URL to a related note to avoid broken external links.

## Philosophical Foundations

### Learn in Public

The concept of "learning in public" (articulated by Shawn Wang and others) means sharing your learning process, not just the results. Benefits:
- Forces clarity in your thinking
- Attracts people interested in the same topics
- Creates a record you can reference later
- Helps others learn from your path
- Builds genuine expertise over time

### The Garden vs the Stream

Mike Caulfield's framework distinguishes:
- **The Stream**: Social media, blogs, feeds. Chronological, ephemeral, performative.
- **The Garden**: Timeless, connected, tended. Not about what is new but about what is true.

A healthy information diet includes both, but most people over-index on the stream. Gardening is the antidote.

### Stock and Flow

A concept from economics applied to content:
- **Stock**: Evergreen content that compounds in value (garden notes)
- **Flow**: Timely content that captures attention now (tweets, posts)

Flow drives attention to your stock. Stock converts attention into lasting value.


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to digital garden designer
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Digital Garden Designer Analysis

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

**Input:** "Help me with digital garden designer for my current situation"

**Output:**

Based on your situation, here is a structured approach to digital garden designer:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
