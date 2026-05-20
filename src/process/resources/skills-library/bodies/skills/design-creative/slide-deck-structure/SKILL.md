---
name: slide-deck-structure
description: |
  Produces a complete slide-by-slide outline with slide purpose, content type,
  and talking points for each slide, applying presentation narrative structure.
  Use when the user asks to structure a presentation, plan a slide deck,
  outline slides for a talk, or organize presentation content.
  Do NOT use for pitch deck specifically (use pitch-deck-structure), data
  visualization in slides (use data-in-slides), or writing speaker notes
  (use speaker-notes-writing).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "presentation planning template"
  category: "design-creative"
  subcategory: "presentation-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Slide Deck Structure

## When to Use

Use this skill when the user needs help organizing and structuring a presentation into a slide-by-slide plan. Specific triggers include:

- The user asks to structure, plan, or outline a presentation deck for a conference talk, internal meeting, workshop, webinar, training session, or team briefing
- The user has a topic, audience, and time slot but does not yet know how to sequence the content into slides
- The user wants to apply a proven narrative framework (SCR, SCQA, What-So What-Now What, or similar) to organize their ideas
- The user has scattered content -- notes, bullet points, research -- and needs a coherent slide-by-slide flow
- The user says "I have 30 minutes to present X to Y audience" and needs a deck architecture
- The user wants a presentation outline that specifies content type per slide, not just a topic list
- The user is preparing for a recurring presentation format (quarterly business review, sprint demo, onboarding session) and wants a reusable structure

**Do NOT use this skill when:**

- The user needs a startup or investor pitch deck -- use `pitch-deck-structure`, which applies a different narrative logic (problem, solution, market, traction, ask) and investor-specific conventions
- The user needs to choose the right chart type for a slide or design a specific data visualization -- use `data-in-slides` for those decisions
- The user wants detailed, polished speaker notes written out in full sentences -- use `speaker-notes-writing` after the structure is established with this skill
- The user is asking how to visually design a slide (layout, color, typography, imagery choices) -- that is a visual design task, not a structure task
- The user wants to write the actual slide content (headlines, bullet text, chart copy) in full -- structure first, then content authoring

---

## Process

### Step 1: Gather the Five Required Inputs Before Producing Anything

Do not generate a structure without these. Ask for any that are missing.

- **Topic and purpose:** Identify the single purpose of the presentation. Every presentation has one of five purposes: inform (share new information), persuade (change a belief or behavior), report (update on status), teach (build a skill or knowledge base), or inspire (shift mindset or motivate action). Mixed-purpose presentations exist but must have one dominant purpose that governs structure choices.
- **Audience:** Establish who is in the room, their level of familiarity with the topic, their decision-making authority, and what they care about most. A director-level audience wants conclusions first and evidence second. A technical audience wants methodology and evidence. A mixed audience requires a layered approach (see Edge Cases).
- **Time slot:** This is the hard constraint that determines everything else. A 10-minute talk has a fundamentally different architecture than a 45-minute talk. If the user does not have a fixed time, ask them to estimate. If they genuinely cannot, default to 20 minutes as the working assumption and flag this.
- **Format and setting:** Keynote on a stage, team meeting in a conference room, recorded webinar, or live video call each impose different constraints. Stage keynotes use high-impact visuals and minimal text. Conference room meetings can tolerate denser slides because the presenter is closer to the audience. Recorded webinars need more self-contained slides.
- **Key message:** The single sentence a member of the audience could recite to a colleague immediately after walking out. If the user cannot state this in one sentence, do not proceed -- help them find it first. The key message is not the topic (not "Q3 results") but the insight (not "revenue was up" but "Q3 revenue grew 18% despite market headwinds, proving our retention strategy is working").

### Step 2: Select and Name the Narrative Structure

Choose the structure that fits the purpose. Apply these heuristics:

- **Setup-Conflict-Resolution (SCR):** Use for persuasive presentations where the audience needs to agree something is wrong before they will accept a solution. Three-act form: establish the current state the audience recognizes, introduce the tension or problem that threatens it, present the resolution. Ideal for proposals, strategy presentations, change management, and budget requests. The "conflict" is the pivot -- it must feel real and significant to the specific audience.
- **Situation-Complication-Question-Answer (SCQA):** Use for analytical presentations where the audience needs to trust the rigor of the reasoning. Derived from Barbara Minto's Pyramid Principle. Start with a situation everyone agrees on (shared ground), introduce a complication that disrupts that situation, articulate the precise question the complication raises, then answer it with evidence organized in a logical grouping. Ideal for board reports, consulting presentations, research readouts, and executive briefings.
- **What-So What-Now What (WSWN):** Use for informational and status presentations. Present the facts clearly (What), explain why those facts matter to this audience (So What), then provide clear direction on what should happen next (Now What). Ideal for weekly status updates, project reviews, and data readouts. Fast to produce and easy for the audience to follow.
- **Problem-Cause-Solution-Benefit (PCSB):** Use for teaching and training presentations. Name the problem the learner faces, explain the root causes so the learner understands why the problem exists, present the solution or technique, then show the benefit of applying it. Ideal for workshops, tutorials, onboarding sessions, and instructional talks.
- **Chronological/Narrative:** Use for case studies, project retrospectives, and storytelling presentations. Walk through events in sequence, building toward a resolution or insight. Most effective when the journey itself is informative -- when what happened matters as much as the outcome. Risk: audiences can lose the thread if milestones are not clearly marked.
- **The 5-Slide Pattern (emergencies only):** For presentations under 8 minutes or when time was just cut and restructuring is needed fast: Context (1 slide), Problem/Opportunity (1 slide), Solution/Approach (1 slide), Evidence/Impact (1 slide), Ask/Next Steps (1 slide). No hook, no transitions, no appendix. Brutal but functional.

### Step 3: Determine Slide Count and Deck Architecture

Apply these calibrations before designing individual slides:

- **Slide count rule:** For spoken presentations, budget 1.5 minutes per slide as a default. A 20-minute talk yields approximately 12-14 slides presented (not counting title slide and appendix). A 45-minute talk with Q&A yields approximately 20-25 slides. Presentations with complex data visualizations or diagrams take more time per slide (budget 2-3 minutes). Transition slides and quote slides take less time (30-45 seconds).
- **Structural zones:** Every deck has three zones regardless of narrative structure -- Opening (15-20% of slide count), Body (60-70%), Closing (15-20%). A 15-slide deck has roughly 3 opening slides, 9 body slides, and 3 closing slides.
- **The opening sequence:** Slide 1 is always the title slide (on screen before the presentation begins -- not "presented"). Slide 2 is the hook. Slides 3-N of the opening zone establish context the audience needs to enter the body. The hook must create a knowledge gap (the audience realizes they do not know something they should know) or an emotional response (surprise, concern, curiosity, recognition).
- **Transition slides:** Include one transition slide at every major section break. Transition slides contain one phrase, one question, or one image -- nothing else. They signal to the audience that a new section has begun and give them a moment to mentally close the previous section before opening the next one. Do not skip transition slides to save time -- they pay for themselves by keeping the audience oriented.
- **Summary and closing slides:** The second-to-last slide is the summary -- 3 to 5 bullet points maximum, each one sentence. The last slide is the close -- a single statement, question, or call to action. Never "Thank You" or "Questions?" as the final slide. The closing slide is the most memorable screen state. It should be on screen during Q&A. It should restate the key message or invite action.

### Step 4: Assign One Content Type to Every Slide

Every slide must have exactly one content type. Mixed content types produce cluttered slides. Apply these definitions strictly:

- **Headline only:** One declarative sentence in large type, no bullets, no images beyond optional background. Use for hooks, transition slides, emotional beats, and closing slides. The headline IS the slide -- it must be complete and self-explanatory. Maximum: 12 words.
- **Headline + single data visualization:** One chart, graph, table, diagram, or map, with a headline that states the analytical conclusion ("Revenue grew 18% YoY") not the descriptive title ("Revenue Chart Q3"). The visualization supports the headline. The headline tells the audience what to think about the visualization. These slides take 2-3 minutes to present properly.
- **Headline + bullets (3 max):** Three bullets at absolute maximum. If you have 4 points, split into two slides or cut one. Each bullet is one phrase or sentence, not a paragraph. The headline states the unifying idea; the bullets provide the parallel evidence, examples, or components.
- **Full-bleed visual:** An image, illustration, or screenshot fills the entire slide. Minimal text (usually headline or caption only, in a contrasting overlay). Use for emotional impact, case study evidence (showing the actual product or situation), and visual metaphors. Forces the audience to look, not read.
- **Quote:** Large-format quotation text, attributed to a specific person with name and title. Use for customer voice, expert authority, or provocative framing. The quote must say something the presenter cannot say as effectively in their own words. Paraphrases should not be formatted as quotes.
- **Comparison:** Two or three columns with a shared header row. Use for before/after, option evaluation, competitor analysis, and taxonomy. Limit to 3 comparators and 5 rows of criteria. More than that belongs in the appendix.
- **Process/flow:** Numbered steps, swim lanes, or a flow diagram. Use when sequence matters -- when step 3 cannot happen before step 2. Do not use process format for things that are a list, not a sequence.
- **Activity slide (workshops only):** Instruction format with clear task, timing, and group/individual designation. Used in interactive sessions. Counts as 5-10 minutes of pacing time, not 1-2 minutes.

### Step 5: Write the Talking Point for Every Slide

This step is often skipped and it is the most important structural element:

- The talking point is a single sentence (or two short sentences at maximum) capturing what the presenter says while this specific slide is displayed. It is not the slide content. It is the verbal layer that accompanies the visual layer.
- If the talking point and the slide content say the same thing, the slide is redundant. Either the slide needs to contain less text, or the talking point needs to add something the slide does not show. Both channels (visual and verbal) must carry independent information.
- Effective talking points take one of three forms: (1) the interpretive frame ("What you're seeing here is not just a number -- it's the result of 18 months of a team working differently"), (2) the transition bridge ("That problem is exactly why the next three slides matter"), or (3) the context layer ("This figure comes from a 6-week pilot with the conditions closest to our production environment").
- For the title slide, the talking point is "not presented -- on screen as audience enters." This is not a placeholder -- it is a deliberate note that the presenter's opening words are spoken before advancing past the title slide.
- For transition slides, the talking point is the transition statement the presenter says aloud -- the question or framing that introduces the next section verbally before the next slide appears.

### Step 6: Build the Pacing Guide

Pacing is not time management advice -- it is a structural tool that makes the deck resilient:

- Calculate average time per slide by dividing total presentation minutes by presented slide count (excluding title slide and appendix). Record this number.
- Identify 2-3 **expandable slides**: slides where the presenter can spend significantly more time if ahead of schedule or if the audience asks good questions. These are typically evidence slides, case study slides, or comparison slides that have depth available.
- Identify 2-3 **skippable slides**: slides the presenter can skip entirely if behind schedule, and the key message still holds. These are typically elaboration slides, secondary examples, or context slides that add richness but are not load-bearing.
- Divide slides into sections and assign section time budgets. These should reflect the narrative structure -- the conflict zone of SCR deserves more time than the setup. The answer zone of SCQA deserves more time than the situation.
- For presentations over 30 minutes, build in one planned "breathing moment" -- a question to the audience, a show of hands, or a brief discussion prompt. Mark this in the pacing guide as a "+2-3 min variable" to account for audience response time.

### Step 7: Validate the Full Structure Against Five Checks

Before delivering the output, verify:

- **One-idea test:** Can every slide be described in one sentence? If it takes two sentences to describe a slide's content, the slide has two ideas and must be split.
- **Thread test:** Does each slide have a logical connection to the slide before it and the slide after it? The audience should never wonder "why are we here now?" Read through the talking points in sequence -- they should tell a coherent story without the slides.
- **Proof test:** Every persuasive claim must be either illustrated by a data visualization slide or supported by a quote or comparison slide somewhere in the deck. A claim without visible support undermines credibility.
- **Pacing test:** Does the slide count land within 10% of the target (time ÷ 1.5 minutes per slide)? If significantly over, identify candidates for the appendix. If significantly under, check whether key supporting evidence has been omitted.
- **Closing test:** Does the final slide restate the key message and does it work as the background image during Q&A? The best closing slides work as a provocative question, a key number, or a direct call to action. None of those are "Thank You."

---

## Output Format

```
## Slide Deck Structure: [Presentation Title]

**Purpose:** [inform | persuade | report | teach | inspire]
**Audience:** [role, familiarity level, decision authority, primary concern]
**Duration:** [X minutes]  
**Slide Count:** [X slides presented] (+ [X] appendix slides)
**Narrative Structure:** [SCR | SCQA | WSWN | PCSB | Chronological | 5-Slide]
**Key Message:** [one complete sentence -- the thing the audience will remember]
**Format/Setting:** [keynote stage | conference room | webinar | hybrid]

---

### Slide Sequence

| # | Slide Title / Headline | Content Type | Content Description | Talking Point |
|---|----------------------|-------------|--------------------|--------------| 
| 1 | [Presentation Title] | Title slide | [Title, key message as subtitle, presenter name and role, date, event name if applicable] | Not presented -- on screen as audience enters |
| 2 | [Hook headline] | Headline only | [Surprising statistic, bold claim, or provocative question in large type] | [First words the presenter speaks -- must create a knowledge gap or emotional response] |
| 3 | [Context slide title] | [Content type] | [Description of setup or background content] | [Talking point] |
| 4 | [Section transition] | Headline only | [Single phrase or question signaling section change] | [Verbal transition bridge to next section] |
| 5 | [Core slide title] | [Content type] | [Description of main evidence or argument] | [Talking point adding context the visual does not provide] |
| ... | ... | ... | ... | ... |
| [N-1] | [Summary] | Headline + bullets | [3-5 single-sentence takeaways] | [Synthesizing statement connecting all three takeaways] |
| [N] | [Closing -- key message restated or call to action] | Headline only | [Final statement on screen -- stays up during Q&A] | [Closing words -- the ask or the enduring thought] |

---

### Appendix Slides (prepared for Q&A, not presented)

| # | Slide Title | Content Type | Q&A Scenario It Supports |
|---|------------|-------------|--------------------------|
| A1 | [Title] | [Type] | [The question this slide answers] |
| A2 | [Title] | [Type] | [The question this slide answers] |

---

### Pacing Guide

- **Total slides presented:** [count] (not counting title slide or appendix)
- **Average time per slide:** [X.X minutes]
- **Expandable slides:** #[X] ([why it has depth to explore]), #[X] ([why])
- **Skippable slides:** #[X] ([why it can be cut without losing the key message]), #[X] ([why])
- **Breathing moment:** [Slide # and format -- question to audience, show of hands, etc. -- if applicable]

**Section time breakdown:**
| Section | Slides | Budget |
|---------|--------|--------|
| Opening | [#–#] | [X min] |
| [Section name from narrative structure] | [#–#] | [X min] |
| [Section name] | [#–#] | [X min] |
| Closing | [#–#] | [X min] |
| **Total** | | **[X min]** |

---

### Structural Notes

[Any decisions that need explanation -- why a particular narrative structure was chosen,
any content that should be cut or moved to appendix, flags for content the user will need 
to create (data that needs to be gathered, a chart that needs to be built, a quote that needs 
to be sourced), and any format-specific cautions (e.g., slide will be dense for a large-room 
keynote, consider full-bleed visual instead).]
```

---

## Rules

1. **One idea per slide, enforced absolutely.** If a slide contains two claims, two datasets, or two distinct concepts, split it into two slides. "Two ideas" means: if you could write two different headlines for this slide, it needs to be two slides. Overloaded slides train audiences to stop reading because they learn they cannot absorb slides in the time they are shown.

2. **Assign exactly one content type to every slide.** A slide cannot be "Headline + bullets + data visualization." If supporting data exists for a bullet-point slide, put the data on the next slide as a dedicated data visualization slide, with the insight from the bullets restated as its headline.

3. **Maximum three bullets on any bullet slide.** Four bullets means one of two things: either one bullet can be cut, or the content should be reorganized into a process/flow or comparison type. If the user insists on four points, the fourth point becomes the first slide in a new set and the third bullet on the first slide becomes the transition.

4. **The closing slide must carry the key message forward, not serve as a social courtesy.** "Thank You," "Questions?", or "Q&A" as the closing slide is a structural failure. It wastes the most psychologically salient moment in the presentation -- the final state the audience sees. Use the key message restated as a declaration, a call to action, or a single provocative number or question.

5. **Data visualization headlines state conclusions, not descriptions.** "Q3 Revenue" is a description. "Q3 Revenue Grew 18% Despite Sector-Wide Decline" is a conclusion. The headline tells the audience what to think about the data. If an audience member could look at the chart headline alone and know whether the news is good or bad, the headline is doing its job.

6. **Talking points must add information that the slide does not contain.** The visual and verbal channels carry different content. If the talking point is identical to the slide text, the audience reads ahead of the presenter and stops listening. The presenter's words must do work the slide cannot do alone -- adding context, backstory, emotional weight, or interpretive frame.

7. **Slide count must be calibrated to the time slot.** Default to 1.5 minutes per slide. Never exceed 2 minutes per slide average (the audience disengages from static visuals). Never go below 45 seconds per slide average (information cannot be processed). If the content requires more slides than the time slot allows, move supporting slides to the appendix -- do not compress the time-per-slide ratio.

8. **The appendix is a structural element, not a dumping ground.** Every appendix slide must be assigned to a specific anticipated Q&A question. If you cannot articulate what question the slide answers, it should not be in the appendix. Appendix slides are prepared content for specific anticipated challenges, not overflow from the main deck that did not fit.

9. **Transition slides are mandatory at every major section change and must remain minimal.** A single phrase, a single question, or a compelling image with no bullets. Any text beyond 8 words on a transition slide defeats its purpose. Its function is to give the audience a mental break and orient them to what is coming -- not to introduce new content.

10. **Flag content dependencies explicitly in structural notes.** If a core slide requires data the user has not yet gathered, a chart that needs to be built, or a quote that needs to be sourced, mark it explicitly in the Structural Notes section. The user needs to know what production work the structure requires. A beautiful structure built on unconfirmed data is a liability.

11. **Never use a quote slide if the quote can be paraphrased.** A quote slide carries authority and authenticity. If the presenter plans to paraphrase or approximate the quote, do not recommend a quote content type -- use a headline-only or headline-plus-bullets slide instead. Approximate quotes attributed to real people undermine credibility.

12. **The hook slide must create a knowledge gap or emotional response within 10 seconds.** A hook that requires setup to land is not a hook -- it is a second context slide. The effective hook formats are: a counter-intuitive statistic ("68% of code review comments are about formatting, not bugs"), a direct challenge to an assumption the audience holds, a brief story that puts a face on the problem, or a question the audience cannot answer confidently. Avoid "welcome and here is the agenda" as the second slide -- that is setup, not a hook.

---

## Edge Cases

### Presentation with No Fixed Time Slot

When the user does not have a set time limit (e.g., "I might have 10 minutes or 30 minutes depending on how the meeting goes"), build a tiered structure. Design the core deck for the shorter estimate. Identify a set of "expansion modules" -- 2-4 grouped slides each -- that can be inserted at specific points in the deck if time permits. Label each module with a trigger: "Insert Module 2 if the audience asks about implementation." The short version must be fully self-contained; the long version must not depend on all modules being included. Do not build two complete separate decks -- build one deck with modular inserts.

### Technical Presentation to a Mixed Audience

When the audience contains both technical and non-technical stakeholders (common in engineering-to-executive presentations), apply a layered slide architecture. Each core content slide carries information at two levels: the headline carries the executive-level insight, and the visual or diagram carries the technical evidence. Detailed technical specifications, methodology, and architecture diagrams go into the appendix, not the main deck. Include a single "how it works" process slide with a simplified diagram -- not a full technical architecture, but enough for non-technical stakeholders to feel oriented. Explicitly note in the structural comments which slides have corresponding appendix slides with technical depth.

### Workshop or Interactive Session (Not a Passive Audience)

Replace the standard pacing model with an activity-based model. Every 10-12 minutes of instruction should be followed by an activity slide. Activity slides use the format: "ACTIVITY: [task name] -- [individual/pairs/groups] -- [duration]." The activity slide itself takes 5-10 minutes in the pacing guide. Add a debrief slide immediately after each activity with the format "Debrief: What did you notice?" or a specific synthesis question. For workshops, the appendix is replaced by a facilitator notes section -- slides that are visible to the presenter only and contain facilitation guidance. Workshop sessions should plan for 40% of the session time to be participant activity time, meaning instructional slide count is approximately 60% of a comparable lecture-format deck.

### Presentation That Will Be Read, Not Presented (Document Deck)

When the deck will be emailed, posted, or reviewed asynchronously without a presenter, the structural rules change fundamentally. Talking points are replaced by extended slide notes (2-4 sentences each) that provide the context a presenter would normally speak. Bullet counts can increase to 5 per slide (still not more). Headline-only slides are insufficient in a document deck because there is no verbal layer to carry the meaning -- add a supporting sentence in a smaller font below the headline. Remove all transition slides (they serve no purpose without a live presenter). The deck should include a cover note (slide 0 or a pre-slide text block) explaining the deck's purpose, the intended reader, and how to navigate it. Flag the deck as a "document deck" at the top of the output.

### Presentation Rebuilding After a Time Cut

When a user says "I had 45 minutes and they cut me to 20" or "I built this for an hour and now I have 15 minutes," do not try to compress the full deck. Diagnose the structural core: What is the key message? What are the 3 most essential pieces of evidence? Apply the 5-Slide Pattern as the new skeleton: Context (1 slide) -- Problem/Opportunity (1 slide) -- Solution/Approach (1 slide) -- Evidence (1 slide) -- Ask/Next Steps (1 slide). Then add back only slides that are directly load-bearing for the key message. Move everything else to the appendix. The goal is not a compressed version of the old deck -- it is a rebuilt deck for a different time constraint.

### Recurring Presentation Format (QBR, Sprint Demo, Weekly Status)

When the user presents the same type of information on a recurring schedule, build a structural template rather than a one-time deck. Identify which slides are static (always the same structure, different content -- e.g., KPI dashboard, goals slide), which are dynamic (rebuilt from scratch each time -- e.g., this week's blockers, this quarter's initiative results), and which are triggered (only included when a specific condition is met -- e.g., a "milestone reached" slide that only appears when a milestone is hit). Output the structure with each slide tagged [STATIC], [DYNAMIC], or [CONDITIONAL: trigger]. Include a pre-presentation checklist specifying which slides must be updated before every presentation. This prevents the common failure mode of a recurring deck accumulating outdated slides that were never updated.

### High-Stakes Presentation With a Known Skeptic in the Room

When the user identifies that one or more audience members is likely to be resistant, challenge the data, or actively oppose the recommendation, build an adversarial appendix. Before designing the main deck, ask the user to identify the 3-5 most likely objections or challenges from that person. Build an appendix slide for each one. Each adversarial appendix slide has the objection as its headline (stated fairly, not dismissively) and a direct response with supporting evidence. In the main deck structure, place the "Risk Mitigation" or "Addressing Concerns" slide immediately before the ask -- not in the appendix. Audiences with known skeptics need to see that their concerns are acknowledged, not just answered in the Q&A. The structural note should flag this explicitly.

---

## Example

**Input:** "Help me structure a 30-minute presentation on implementing a four-day work week pilot at our company. I'm presenting to the executive leadership team -- CEO, CFO, and COO. They haven't made up their minds about this. I want them to approve a 90-day pilot with two volunteer teams."

---

## Slide Deck Structure: The Four-Day Work Week -- A 90-Day Pilot Proposal

**Purpose:** persuade
**Audience:** Executive leadership team (CEO, CFO, COO) -- informed but not committed, high skepticism about productivity impact, primary concern is business continuity and financial risk
**Duration:** 30 minutes
**Slide Count:** 19 slides presented (+ 4 appendix slides)
**Narrative Structure:** Setup-Conflict-Resolution (SCR)
**Key Message:** A 90-day four-day work week pilot with two volunteer teams will cost us nothing to test and could permanently improve retention, recruitment, and output quality -- and we have the data to design it responsibly.
**Format/Setting:** Executive conference room, small audience of 3, high-stakes decision meeting

---

### Slide Sequence

| # | Slide Title / Headline | Content Type | Content Description | Talking Point |
|---|----------------------|-------------|--------------------|--------------| 
| 1 | The Four-Day Work Week: A 90-Day Pilot Proposal | Title slide | Title, subtitle: "A structured, reversible test with two volunteer teams," presenter name and title, date | Not presented -- on screen as audience enters |
| 2 | We lost 14% of our workforce last year. The industry average was 11%. | Headline only | Single statistic in large type -- company attrition figure vs. benchmark | "That 3-point gap is not random. Exit interviews from Q4 point to the same themes: workload, flexibility, and feeling like their time is not respected. That is the context for what I am about to propose." |
| 3 | What our people told us they need | Headline + data viz | Horizontal bar chart showing top 5 exit interview themes, sorted by frequency; "schedule flexibility" highlighted as #2 | "This is not a survey of what people say they want -- this is what people who actually left said was driving their decision. Schedule flexibility is the number two reason." |
| 4 | The talent market has permanently repriced | Headline + bullets | 3 bullets: (1) Remote-first companies now compete for the same local talent, (2) Flexible schedule is a top-3 offer criterion for candidates under 40, (3) Our last 3 senior offers were rejected -- 2 cited flexibility | "We are not competing with the company down the street anymore. We are competing with remote-first employers who can offer schedule autonomy we currently cannot match." |
| 5 | Retention is an expensive problem | Headline + data viz | Stacked bar chart: fully-loaded cost to replace one employee by role level (junior, mid, senior); total annual replacement cost estimate bottom-right | "Replacing a single mid-level employee costs us roughly 1.2x their annual salary when you account for recruiting, onboarding, and the productivity gap while a seat is empty. We spent approximately $X on replacement costs last year." |
| 6 | What if the five-day week is causing the problem -- not solving it? | Headline only | Single provocative question in large type -- transition into conflict zone | "Here is a question I want to sit with before we get into the proposal. What if the five-day structure itself is one of the drivers of the cost I just showed you?" |
| 7 | The evidence from 61 companies that tried it | Headline + data viz | Scatter plot or bubble chart: 61 companies from the 2022 UK four-day week trial, x-axis = revenue change, y-axis = staff retention change, majority in positive quadrant | "This is the largest controlled trial ever conducted on the four-day work week -- 61 companies, 2900 employees, six months. The result was not a mixed picture. 92% of companies continued the policy after the trial ended." |
| 8 | What actually happened to productivity | Comparison | Two columns: "What executives feared" (revenue decline, customer complaints, project delays, team coordination failure) vs. "What the data showed" (0.7% average revenue increase, customer satisfaction unchanged, 22% reduction in sick days) | "I am showing you this because I know what you are thinking. Every concern in the left column is legitimate. The right column is not spin -- it is published outcome data from a peer-reviewed study." |
| 9 | Not every model works | Headline + bullets | 3 bullets: (1) Compressed schedules (4x10-hour days) underperform the 32-hour model, (2) Client-facing teams need specific scheduling protocols to maintain coverage, (3) Success correlates strongly with manager buy-in and clear output metrics | "The research is clear on one thing: the four-day week is not a uniform policy that you switch on. The implementations that succeeded all shared three design characteristics -- and those are the three things our pilot design is built around." |
| 10 | Our pilot design is built to answer the right questions | Headline only | Transition slide: single phrase setting up the solution section | "So let me show you exactly how we would run this, what we would measure, and how we would know within 90 days whether to expand or stop." |
| 11 | Pilot Structure: What We Are Testing | Process/flow | 4-step flow: (1) Select 2 volunteer teams with output-measurable work, (2) Define pre-pilot baseline metrics (output, satisfaction, client ratings), (3) Run 90-day pilot -- 32 hours per week, not compressed schedule, (4) Compare against baseline and matched control teams | "The design is important. We are not just letting two teams try working less. We are running a structured experiment with defined success criteria, control groups, and a hard decision point at 90 days." |
| 12 | How we selected pilot teams | Comparison | Three columns: "Team Alpha -- Product Engineering" and "Team Beta -- Content & Brand" vs. criteria checklist (output measurable, no hard real-time client dependency, manager buy-in confirmed, current attrition higher than average) | "These two teams were not picked at random. They meet all four criteria for a clean experiment. Both managers have already been briefed and have committed to the pilot." |
| 13 | What success looks like -- and what stops the pilot | Comparison | Two columns: "Expansion triggers" (output maintained or improved, no client complaints, team satisfaction up) vs. "Pause triggers" (output drops >10% for 2+ consecutive weeks, client escalation, team conflict attributable to scheduling) | "We are not running this on faith. If output drops more than 10% for two consecutive weeks, we pause immediately. The stop criteria are defined up front, not after the fact." |
| 14 | The financial case | Headline + data viz | Simple waterfall chart: pilot cost (near zero -- no new hires, no software, manager time modest) vs. projected savings (even one retained employee per quarter exceeds cost) | "What does this pilot actually cost? Manager attention. That is it. If the pilot retains even one employee in 90 days who would otherwise have left, it pays for itself 10 times over based on the replacement cost figures I showed earlier." |
| 15 | What we are NOT proposing | Headline + bullets | 3 bullets: (1) Not a company-wide policy change, (2) Not a change to compensation or benefits, (3) Not a precedent -- pilot outcomes determine next steps | "I want to name the concerns directly. This is not a permanent policy announcement. It is not a change to compensation. It is a 90-day experiment with an off-ramp built in." |
| 16 | The ask | Headline + bullets | 3 bullets: (1) Approve 90-day pilot for Team Alpha and Team Beta starting [date], (2) Designate pilot oversight lead (I recommend COO), (3) Set 90-day decision review meeting now | "I am asking for one thing: approval to run the experiment. Not to implement the policy. To run the experiment so that in 90 days we are deciding based on our own data, not on someone else's." |
| 17 | If we do not test this, we are still making a choice | Headline only | Single statement -- restates the stakes of inaction | "The alternative to running the pilot is not 'wait and see.' It is continuing to lose people at 14% per year while our competitors offer something we have not tested." |
| 18 | Three things to remember | Headline + bullets | 3 bullets: (1) Our attrition cost last year was $X -- retention improvement is worth testing, (2) 92% of the 61-company trial chose to make the policy permanent, (3) This pilot costs essentially nothing to run | "Before we go to questions, I want to leave three numbers on the table." |
| 19 | 90 days from now, we will know. Let us find out. | Headline only | Final statement -- stays on screen during Q&A; restates confidence and forward motion | "I am ready for your questions. And I am ready to start planning the pilot as soon as we have alignment today." |

---

### Appendix Slides (prepared for Q&A, not presented)

| # | Slide Title | Content Type | Q&A Scenario It Supports |
|---|------------|-------------|--------------------------|
| A1 | Detailed Replacement Cost Calculation | Headline + data viz | If CFO challenges the attrition cost estimate or methodology |
| A2 | Full UK Trial Methodology and Peer Review Status | Headline + bullets | If CEO or COO questions the quality or applicability of the external research |
| A3 | Client Communication Protocol for Pilot Teams | Process/flow | If COO raises concerns about client-facing coverage during the pilot |
| A4 | Expanded Pilot Criteria -- Why These Two Teams | Comparison | If leadership wants to understand why other teams were not selected or wants to add a third team |

---

### Pacing Guide

- **Total slides presented:** 19 (not counting title slide or appendix)
- **Average time per slide:** 1.6 minutes
- **Expandable slides:** #7 (external trial data -- high skeptic engagement likely, additional data points available), #13 (success and stop criteria -- executives may want to negotiate specific thresholds)
- **Skippable slides:** #9 (nuance on what models work -- can cover verbally in 20 seconds without the slide), #15 (what we are not proposing -- can fold into slide #16 verbally if time is tight)
- **Breathing moment:** After slide #8, ask: "Before I walk through how we would run this -- what questions do you have about the data so far?" (Budget +2-3 minutes variable)

**Section time breakdown:**
| Section | Slides | Budget |
|---------|--------|--------|
| Opening / Setup | #1--#5 | 7 min |
| Conflict: Why the status quo is costly | #6--#9 | 7 min |
| Resolution: Pilot design and ask | #10--#16 | 11 min |
| Closing | #17--#19 | 3 min |
| Breathing moment buffer | -- | 2 min |
| **Total** | | **30 min** |

---

### Structural Notes

- **CFO is the highest-risk skeptic.** Slides #5 and #14 are the two slides most likely to face direct challenge. Appendix A1 provides the detailed cost methodology. Recommend the presenter be prepared to walk through the waterfall chart numbers in detail if asked.
- **Slide #7 requires an actual chart built from the UK trial data.** The data is publicly available from the published 2022 trial. This is a real content dependency -- the presenter must locate and build this visualization before the presentation.
- **Slides #12 requires confirmation from Team Alpha and Team Beta managers** before the presentation. If either manager's buy-in is not confirmed, slide #12 becomes a structural liability rather than a strength.
- **The breathing moment after slide #8 is intentional but risky.** Inviting questions mid-presentation in a skeptical executive room can derail the narrative. The presenter should use this moment only if the audience is visibly engaged. If the room is cold or defensive, skip it and continue to slide #10.
- **This deck is calibrated for a high-trust room** (the presenter has credibility with this leadership team). If the presenter is presenting to these executives for the first time, add one credibility slide after the title slide that briefly establishes the presenter's connection to the problem (e.g., they led the exit interview analysis, they managed one of the pilot-candidate teams). Without established credibility, slide #2's hook may land as alarm rather than authority.
