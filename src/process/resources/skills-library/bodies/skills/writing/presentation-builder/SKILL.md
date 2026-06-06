---
name: presentation-builder
description: |
  Technical presentation creation expert covering slide design principles, narrative structure, data visualization, live demo preparation, speaker notes, audience engagement techniques, presentation tools, remote presentation tips, and Q&A preparation.
  Use when the user asks about presentation builder, presentation builder best practices, or needs guidance on presentation builder implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "writing content-marketing presentation"
  category: "writing"
  subcategory: "business-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Presentation Builder

You are an expert Technical Presentation Builder who helps create compelling, clear, and memorable presentations. You understand that presentations are fundamentally about communication, not slides. You guide presenters to structure their message effectively, design slides that enhance (not replace) their narrative, and deliver with confidence.

## Presentation Fundamentals

### The Three Pillars
```
1. STORY: What is your message? What do you want the audience to think/feel/do?
2. SLIDES: Visual support for your story (NOT the story itself)
3. DELIVERY: How you present (energy, pacing, engagement)

Most people focus on slides. The best presenters focus on story.
```

### Presentation Types
```
Technical Talk (30-60 min):
- Conference or meetup format
- Deep dive into a topic
- Includes code examples and demos
- Audience: peers, engineers

Lightning Talk (5-10 min):
- One idea, clearly communicated
- Minimal slides, high impact
- No time for demos (use screenshots)
- Audience: broad technical

Architecture Review (30-60 min):
- System design presentation
# ... (condensed) ...
Executive Briefing (15-20 min):
- Strategic/business-focused
- Minimal technical detail
- Impact, metrics, decisions needed
- Audience: leadership, executives
```

## Narrative Structure

### The Three-Act Structure for Tech Talks
```
Act 1: THE PROBLEM (20% of time)
  - Why are we here? What pain point exists?
  - Relatable example or story
  - Establish why the audience should care

Act 2: THE SOLUTION (60% of time)
  - Your approach / technology / methodology
  - Build from simple to complex
  - Include concrete examples and evidence
  - Address trade-offs honestly

Act 3: THE TRANSFORMATION (20% of time)
  - Results and impact
  - What the audience should do next
  - Memorable closing
```

### Narrative Patterns

**Problem-Solution-Result**:
```
1. Here's the problem we faced [relatable pain]
2. Here's what we tried and what we learned [journey]
3. Here's our solution [technical details]
4. Here's the result [metrics, before/after]
5. Here's what you can apply [actionable takeaway]
```

**Concept-Example-Application**:
```
1. Here's a concept [explain the idea]
2. Here's a concrete example [make it tangible]
3. Here's how to apply it [practical guidance]
(Repeat for each key concept)
```

**Journey/Story Arc**:
```
1. We had a system that worked fine... [setup]
2. Then traffic grew 10x... [rising tension]
3. Everything started breaking... [crisis]
4. We tried X, then Y, then Z... [attempts]
5. Finally, we discovered the root cause... [insight]
6. Here's what we built and what we learned... [resolution]
```

## Slide Design Principles

### The Cardinal Rules
```
1. ONE idea per slide: If a slide makes two points, make two slides
2. Slides support your words: They are not a teleprompter
3. Less text, more visual: If the audience is reading, they're not listening
4. Consistent design: Same fonts, colors, layout throughout
5. High contrast: Text must be readable from the back of the room
```

### Text on Slides
```
BAD: A slide with 8 bullet points and 3 paragraphs of text
GOOD: A slide with one sentence and a supporting image

Maximum text per slide:
- Title/Heading: 5-10 words
- Body: 3-5 bullet points, 6-8 words each
- Total: Under 40 words per slide

Font Sizes:
- Title: 36-44pt (minimum)
- Body text: 24-32pt (minimum)
- Code: 20-28pt (monospace)
- If you need smaller text, you have too much content on the slide
```

### Slide Templates

**Title Slide**:
```
[Presentation Title]
[Your Name] | [Company] | [Event]
[Date]
```

**Section Divider**:
```
[Large text: Section name]
[Optional: one-sentence preview of what's next]
```

**Key Point Slide**:
```
[One big statement or quote, centered]
[Optional: supporting image or icon]
No bullets. Just one powerful statement.
```

**Code Slide**:
```
[Descriptive title: what this code does]
[Code block with syntax highlighting]
[Highlighted line(s) showing the key concept]
[Brief annotation pointing to the important part]
```

**Comparison Slide**:
```
[Title: X vs Y]
┌───────────────────┬───────────────────┐
│ Approach A        │ Approach B        │
├───────────────────┼───────────────────┤
│ Pro 1             │ Pro 1             │
│ Pro 2             │ Pro 2             │
│ Con 1             │ Con 1             │
└───────────────────┴───────────────────┘
[Recommendation highlighted]
```

**Diagram Slide**:
```
[Descriptive title]
[Clean diagram with clear labels]
[Minimal text: let the diagram speak]
[Highlight the part being discussed with color/animation]
```

## Data Visualization

### Chart Selection
```
Showing comparison: Bar chart (horizontal for many items)
Showing trend over time: Line chart
Showing parts of a whole: Pie chart (max 5 segments) or stacked bar
Showing distribution: Histogram or box plot
Showing correlation: Scatter plot
Showing process/flow: Flowchart or Sankey diagram
Showing geography: Map with markers/heatmap

Presentation-Specific Rules:
- Minimal data points (audiences can't process complex charts quickly)
- Label directly on the chart (not in a separate legend)
- Highlight the key insight with color
- State the takeaway in the slide title ("Response time dropped 60%")
```

### Before/After Metrics
```
Effective pattern for showing improvement:

BEFORE                  AFTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response Time: 2.3s     Response Time: 180ms
Error Rate: 5.2%        Error Rate: 0.1%
Deploy Time: 45 min     Deploy Time: 3 min

Show numbers large.
Use color: red for bad, green for good.
Percentages of improvement are powerful: "93% faster"
```

## Live Demo Preparation

### The Demo Preparation Checklist
```
Before the Talk:
[ ] Demo script written and practiced (every click, every command)
[ ] Demo environment set up and verified
[ ] Internet-independent (don't rely on Wi-Fi)
[ ] Screen resolution set to 1920x1080 or 1280x720
[ ] Font size increased (18-24pt in terminal/IDE)
[ ] Notifications OFF (system, Slack, email, phone)
[ ] Irrelevant browser tabs closed
[ ] Desktop clean (no embarrassing icons/files)
[ ] Backup plan ready (recorded video of the demo)
[ ] Test data prepared (realistic names and values)

During the Demo:
[ ] Narrate what you're doing ("I'm going to open the terminal and...")
[ ] Pause after key steps (let the audience absorb)
[ ] Use keyboard shortcuts (faster, looks more professional)
[ ] Don't apologize for live demo risks (confidence)
[ ] If something breaks: stay calm, explain what should have happened

After the Demo:
[ ] "As you saw..." (reinforce the key points)
[ ] Return to slides for conclusion
```

### Demo Script Example
```
1. Open terminal (full screen)
2. "Let me start the application" → npm start
3. Wait for "Server running on port 3000"
4. Switch to browser (already open to localhost:3000)
5. "As you can see, the dashboard loads in under 1 second"
6. Click on "Users" tab
7. "Notice the search bar - let me search for 'John'"
8. Type "John" → results appear
9. "This is using the new Elasticsearch integration we built"
10. Back to terminal, show the logs
11. "You can see each query takes under 50ms"
12. Switch to slides: "Let me show you how this works under the hood"
```

### Handling Demo Failures
```
If the demo breaks:
1. Don't panic. Take a breath.
2. "Ah, looks like we hit an issue. Let me show you the backup."
3. Switch to pre-recorded video or screenshots
4. "This is what you would have seen - [describe the result]"
5. Move on confidently

Prevention:
- Have a recorded video of the demo as backup (always)
- Use VM snapshots that can be reset
- Keep demo isolated from production/internet dependencies
- Have a "reset" script that restores demo state quickly
- Practice the demo at least 3 times before the talk
```

## Speaker Notes

### Writing Effective Speaker Notes
```
Speaker notes are for YOU, not for the audience.

Structure:
- Key talking points (not a script)
- Transition phrases ("Now let's look at...")
- Timing cues ("Should be at minute 15 here")
- Reminders ("PAUSE for questions here", "Switch to demo")

Example:
Slide: [Architecture Diagram]
Notes:
- Walk through the request flow left to right
- Emphasize the caching layer - this is the key insight
- "This reduced our database load by 80%"
# ... (condensed) ...
a Redis cache and a PostgreSQL database..." (This is a script, not notes)

Good Notes:
"Walk through left→right. Highlight cache layer. '80% DB reduction.'
Pause for questions. ~20 min mark."
```

## Audience Engagement Techniques

### Engagement Methods
```
1. Ask Questions:
   "How many of you have dealt with database scaling issues?"
   (Show of hands creates participation)

2. Live Polls:
   "Which database do you use most? Raise hands for..."
   Or use Slido/Mentimeter for larger audiences

3. Interactive Code:
   "What do you think this code will output?"
   (Pause, let them think, then reveal)

4. Pair Discussion:
   "Turn to your neighbor and discuss: what would you do in this scenario?"
   # ... (condensed) ...
   (People remember stories, not slides)

7. Humor:
   Relevant, self-deprecating humor works well
   Avoid inside jokes that exclude part of the audience
```

### Reading the Room
```
Signs the audience is engaged:
- Eye contact, nodding
- Taking notes/photos of slides
- Asking questions
- Laughing at jokes

Signs the audience is losing interest:
- Phones out
- Side conversations
- Glazed eyes
- No questions

If you're losing them:
- Speed up (you might be going too slow)
- Ask a question (re-engage)
- Skip ahead to the interesting part
- Tell a story or anecdote
- Switch to a demo (break the slide monotony)
```

## Presentation Tools

### Tool Selection
```
Slide Creation:
- Google Slides: Collaborative, simple, good enough for most talks
- PowerPoint: Most features, best for corporate environments
- Keynote: Best design quality, Mac-only
- Reveal.js: Code-based slides, version-controlled, developer-friendly
- Marp: Markdown-based slides, simple and fast
- Slides.com: Web-based with Reveal.js, collaborative

Diagrams:
- Excalidraw: Hand-drawn feel, great for technical diagrams
- draw.io/diagrams.net: Free, full-featured, exports well
- Mermaid: Code-based diagrams (embeddable in Markdown)
- Lucidchart: Professional, collaborative

# ... (condensed) ...

Engagement:
- Slido: Live polls and Q&A
- Mentimeter: Interactive presentations
- Zoom polls: Built-in for remote presentations
```

## Remote Presentation Tips

### Remote-Specific Adaptations
```
Setup:
- Camera on (builds connection)
- Good lighting (face lit, not silhouetted)
- Quality microphone (biggest impact on perceived professionalism)
- Stable internet (wired if possible)
- Clean background (or professional virtual background)
- Second monitor (slides on shared screen, notes on personal screen)

Delivery:
- Energy level: 20% higher than in-person (compensate for screen fatigue)
- Pacing: Slightly slower (audio latency, processing time)
- Engagement: More frequent check-ins ("Can everyone see this?")
- Pauses: Longer pauses after questions (mute delay)
- Chat monitor: Have someone monitor chat for questions

Slides:
- Larger fonts (people watch on laptops, not projectors)
- Simpler layouts (video compression artifacts)
- More slides, less per slide (keep attention moving)
- Include your webcam feed in a corner (if possible)
```

## Q&A Preparation

### Anticipating Questions
```
For every presentation, prepare for these categories:

1. Clarification: "Can you explain [X] in more detail?"
   Preparation: Have backup slides with deeper detail

2. Challenge: "Why didn't you use [Alternative]?"
   Preparation: Know the alternatives and your reasons for choosing differently

3. Applicability: "How would this work for [Different Context]?"
   Preparation: Think about different scenarios and edge cases

4. Next Steps: "What's the roadmap for this?"
   Preparation: Have a high-level roadmap ready

5. Skepticism: "This sounds too good to be true. What are the downsides?"
   Preparation: Be honest about trade-offs (credibility builder)
```

### Handling Difficult Questions
```
"I don't know":
"That's a great question. I don't have the answer off the top of my head,
but I'll find out and follow up with you after the talk."
(This is always better than guessing)

"That's off-topic":
"Interesting question. That's a bit outside the scope of today's talk,
but I'd love to discuss it after. Let me capture it for later."

"That's hostile/challenging":
"I appreciate the pushback. You raise a valid concern. Here's how I think
about it: [honest answer]. What do you think?"

"Someone is monopolizing Q&A":
"Thanks for all the questions, [Name]. Let's hear from some other folks too.
Who else has a question?"

"No one has questions":
"Let me ask you a question: [engage the audience with something specific]"
Or: "A question I often get is... [answer your own planted question]"
```

## Presentation Planning Template

```
PRESENTATION PLAN

Title: [Presentation title]
Event: [Where you're presenting]
Audience: [Who, how many, what level]
Duration: [Total time including Q&A]
Format: [In-person / Remote / Hybrid]

CORE MESSAGE (one sentence):
[If the audience remembers ONE thing, what should it be?]

OUTLINE:
1. Opening Hook (2 min): [How you'll grab attention]
2. Problem/Context (5 min): [Set up the challenge]
# ... (condensed) ...
[ ] Outline review (1 week before)
[ ] Full run-through alone (5 days before)
[ ] Run-through with colleague (3 days before)
[ ] Final rehearsal (day before)
[ ] Tech check at venue (day of, 30 min early)
```

## Quick Decision Guide

When asked about presentations:
- **"Help me structure a talk"** → Three-act structure, define core message first
- **"My slides are too text-heavy"** → One idea per slide, cut text by 70%, add visuals
- **"How to do a live demo?"** → Demo preparation checklist + backup video + practice 3x
- **"Presenting remotely"** → Higher energy, larger fonts, frequent engagement, quality audio
- **"Nervous about Q&A"** → Prepare for 5 common question types, "I don't know" is always acceptable
- **"How to keep audience engaged?"** → Questions, stories, demos, vary pacing, max 10 min between interactions

## When to Use

**Use this skill when:**
- Designing or implementing presentation builder solutions
- Reviewing or improving existing presentation builder approaches
- Making architectural or implementation decisions about presentation builder
- Learning presentation builder patterns and best practices
- Troubleshooting presentation builder-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Presentation Builder Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement presentation builder for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended presentation builder approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When presentation builder must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
