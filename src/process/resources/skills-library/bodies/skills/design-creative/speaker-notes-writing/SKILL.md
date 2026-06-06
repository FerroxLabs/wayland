---
name: speaker-notes-writing
description: |
  Writes speaker notes for a slide deck including transition language between
  slides, elaboration on each visual, audience-facing questions, time estimates
  per slide, and contingency notes for section skips. Use when the user asks
  to write presentation notes, prepare talking points for slides, or create
  a presenter guide for a slide deck.
  Do NOT use for slide deck structure and content planning (use
  slide-deck-structure), voiceover narration scripts (use voiceover-script),
  or podcast interview preparation (use podcast-interview-guide).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "presentation template planning"
  category: "design-creative"
  subcategory: "presentation-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Speaker Notes Writing

## When to Use

Use this skill when the user explicitly needs content that lives in the presenter's notes pane -- the verbal layer that complements slides but is never displayed to the audience.

**Trigger scenarios:**
- User has a completed or near-completed slide deck and needs the talking-track written for each slide
- User has slide titles and bullet content and needs elaboration, transitions, and timing layered on top
- User needs to prepare a second presenter or subject-matter expert to deliver someone else's deck convincingly
- User wants a presenter guide that includes contingency logic (what to do if running long, if slides fail, if the audience derails the agenda)
- User needs audience-engagement moments scripted into the presentation flow -- questions, polls, pauses, interaction beats
- User is preparing a recurring presentation (quarterly business review, all-hands, board update) and needs a version-controlled notes template with variable fields that update each cycle
- User is presenting in a second language or coaching a non-native speaker and needs simplified, phonetically accessible notes

**Do NOT use when:**
- The user has no slides yet and needs to plan the deck structure first -- use `slide-deck-structure` to build the slide architecture, then return to this skill
- The user needs a word-for-word narration script for a recorded video with no live presenter -- use `voiceover-script`, which handles pacing for recorded delivery, breath marks, and dubbing requirements
- The user is preparing interview-style dialogue or podcast talking points -- use `podcast-interview-guide`
- The user wants the slides redesigned, content restructured, or a new storyline built -- this skill assumes the slide content is set; structural changes belong in `slide-deck-structure`
- The user needs a teleprompter script -- teleprompter scripts require different pacing, line-break logic, and scrolling-speed annotations; do not attempt to repurpose speaker notes for this purpose

---

## Process

### Step 1: Gather All Required Inputs Before Writing Anything

Do not begin writing notes without collecting these parameters. Missing even one will produce notes that do not fit the delivery context.

- **Slide content:** Ask for slide titles, bullet points, chart descriptions, or image descriptions. If the user pastes raw slide content, parse it to identify: (a) data slides, (b) visual-only slides, (c) title/transition slides, (d) call-to-action slides. Each type requires a different elaboration strategy.
- **Total presentation time:** Get the hard stop, not the target. If the user says "about 20 minutes," ask whether Q&A is included in that 20 minutes or separate. The answer changes the math.
- **Notes style:** Establish one of three modes -- scripted (full sentences the speaker will read nearly verbatim), semi-scripted (verbatim transitions and key phrases, bullet elaboration), or bullet-point prompts (3-5 memory-trigger phrases, no sentences). Do NOT mix styles within a deck without user instruction.
- **Audience profile:** Capture (a) domain expertise level (expert, informed, general), (b) decision-making authority (will they approve, fund, or act on this?), (c) emotional posture (supportive, neutral, skeptical, hostile), and (d) cultural or language context. Each variable shapes sentence complexity, credibility anchors, and engagement technique.
- **Delivery format:** Live in-person, live virtual (video conference), hybrid (some in-room, some remote), or live-recorded (an audience in the room but also captured for later viewing). Each format requires specific notes annotations.
- **Speaker experience level:** A first-time presenter needs more scripted language and explicit stage directions. An experienced presenter giving a familiar topic needs only triggers and transitions. Ask if the speaker wrote the slides themselves (high familiarity) or is presenting someone else's content (low familiarity -- needs more elaboration).

---

### Step 2: Perform the Time Budget Calculation

Time budgeting is a precise arithmetic task, not an approximation. Perform it explicitly and show the allocation.

- **Step 2a:** Subtract buffers from total time. Standard buffers: Q&A (10-15% of total time, minimum 3 minutes for any deck longer than 10 minutes), audience settling/introductions (1-2 minutes for live in-person, 30 seconds for virtual), and a 30-second closing buffer for the final slide.
- **Step 2b:** Categorize every slide into one of four types and assign a default time range:
  - **Title/transition slides** (agenda, section dividers, thank-you): 15-30 seconds each. These are bridges, not content.
  - **Narrative slides** (text-heavy, story-based, context-setting): 1:30-2:30 each. Speaker carries most of the content.
  - **Data slides** (charts, tables, dashboards): 2:00-3:30 each. Audience needs time to read, the speaker needs time to interpret.
  - **Action/decision slides** (recommendations, next steps, call to action): 1:00-2:00 each. Clear and crisp -- do not over-explain the close.
- **Step 2c:** Sum the default time ranges and compare to the available time. If the total exceeds available time, identify skippable slides immediately (before writing notes) so contingency planning is built in from the start.
- **Step 2d:** Record every slide's time allocation in the format MM:SS. Time estimates in speaker notes must use minutes and seconds, not just minutes, so the speaker has a usable pacing reference mid-delivery.
- **Step 2e:** Flag any slide where the default time allocation feels mismatched to its importance. A chart showing the central claim of the presentation should get more time than average for a data slide. A chart showing supporting evidence can be compressed.

---

### Step 3: Write the Transition Chain First

Before writing elaboration for any individual slide, write all transitions as a connected chain. This forces the narrative logic of the whole deck to be coherent before individual slides are fleshed out.

- **The transition chain** is a list of (transition-out sentence) for each slide, which becomes the (transition-in sentence) for the next. They must be linguistically matched -- the closing phrase of slide N must echo or directly invoke the opening phrase of slide N+1.
- **Opening line (slide 1 only):** This is the single most important sentence in the deck. It must achieve two things simultaneously: orient the audience to the topic and establish the speaker's authority or relevance. Do not start with "Today I am going to talk about..." Write an anchor statement, a data point, or a scenario instead.
- **Transition techniques to rotate through the deck** (do not use the same type consecutively):
  - **Pivot transition:** "That problem has one primary cause. Here it is." (moves from problem to cause)
  - **Bridge transition:** "Now that you understand the context, let us look at what we are proposing." (moves from background to solution)
  - **Contrast transition:** "That is what the data shows. Here is what it means for how we operate." (moves from data to interpretation)
  - **Callback transition:** "Earlier I mentioned [X]. Here is where it becomes critical." (connects non-adjacent slides)
  - **Question-plant transition:** "You might be wondering how we got there. This slide tells that story." (creates anticipation before a reveal)
- **Closing statement (final content slide):** Must be a thesis restatement -- one sentence that captures the entire argument of the presentation. The audience should be able to write it down as the key takeaway.

---

### Step 4: Write Slide-Level Notes in Full

With the transition chain set, write the notes body for each slide. Follow this internal structure for every slide regardless of notes style:

- **Elaboration (the core content):** This is what the speaker says that the slide does NOT show. The fundamental rule: if the words exist on the slide, do not repeat them in the notes. Notes add the "why," the "so what," the anecdote, the qualifier, the comparison. For data slides specifically, the elaboration must include: (a) what direction the number is moving, (b) whether the movement is good or bad and why, (c) the action implication, and (d) what question this number raises for the audience.
- **Key message (one sentence):** Distill the slide to a single sentence the speaker can fall back on if they lose their place. This sentence must be complete without the slide -- it should work if the projector goes dark. Write it after the elaboration, not before, because the best distillation emerges from drafting the full content first.
- **Engagement beat (optional but recommended every 5-7 minutes):** For every 5-7 minutes of content, plan one explicit audience engagement moment. Types include: rhetorical question (speaker continues without waiting for answer), response-expected question (pause and collect 1-2 answers), show-of-hands prompt, chat message prompt (virtual), or "take a moment to look at this chart" silent reading beat (for data-dense slides).
- **Stage directions (for in-person and hybrid):** Include physical cues in brackets: [PAUSE 3 seconds after showing this number], [MOVE TOWARD AUDIENCE here], [CLICK to reveal second bar], [LOOK UP from notes at this point]. For virtual: [ENABLE CAMERA if using slides-only view], [SWITCH TO SCREEN SHARE], [CHECK CHAT].
- **Notes style application:**
  - **Scripted:** Write at 130-150 words per minute of allocated time. At 2 minutes, that is 260-300 words per slide. Use paragraph form. Every sentence is deliver-ready.
  - **Semi-scripted:** Write verbatim for transitions and key message. Write 4-7 bullet phrases for elaboration. Speaker expands naturally.
  - **Bullet-point prompts:** 3-6 single-line triggers per slide. No verbs required. Keyword-level. Example: "Q3 trend direction" not "explain that Q3 trend is improving."

---

### Step 5: Write Contingency Notes

Contingency notes are a professional insurance policy. Every live presentation deviates from plan. Write contingencies as explicit decision rules, not vague guidance.

- **Running long (compression plan):** Identify 3-5 slides that can each be collapsed to a single sentence. These should be supporting evidence slides, not the core argument slides. Write the exact compression sentence for each. Mark them with a visible icon or label (e.g., [COMPRESS]) so the presenter can spot them under pressure.
- **Running short (expansion library):** Identify 2-3 slides with expansion content pre-written. Expansion content should be: a specific anecdote that reinforces the slide's point, an additional data comparison, or a structured audience question with 60-90 seconds of discussion time. Never leave expansion content vague ("tell a story") -- write the story.
- **Mid-section interruption (return phrase):** Write one return phrase per major section (not per slide). It should be specific to the section content: "That is a great question about [topic]. Let me answer it and then bring us back to [current section focus]." Generic return phrases ("Great question, let me continue...") sound dismissive.
- **Technology failure backup:** Write 3-5 sentences that verbally convey the deck's core argument without any visuals. This is not a summary of every slide -- it is the minimum viable communication if everything else fails. Instruct the speaker: "You are not recapping the deck. You are delivering the conclusion the deck was building toward."
- **Early termination (time cut by organizer):** Identify the single slide that, if it is the last thing the audience sees, still delivers the core message. Label it [ANCHOR SLIDE]. If the organizer says "wrap it up in two minutes," the speaker goes directly to this slide.

---

### Step 6: Write Q&A Preparation Notes

The Q&A section is where presentations are won or lost in high-stakes contexts. Speaker notes must include anticipation, not just answers.

- **Anticipate 6-10 questions per 30-minute presentation.** For executive audiences, anticipate questions in three categories: (a) methodology/credibility ("How did you get this number?"), (b) risk/downside ("What happens if this does not work?"), (c) alternatives ("Have you considered a different approach?").
- **Write answer frameworks, not scripts.** Unlike the slide content, Q&A answers should not be scripted verbatim -- that sounds rehearsed and defensive. Instead, use answer structures: PREP (Point, Reason, Example, Point), or Bridge (acknowledge, redirect, state position), or Data First (state the data, then the implication, then the recommendation).
- **Bridge phrases for hostile or leading questions:** "That is one way to look at it. Here is what the data shows." / "I want to make sure I understand your question -- are you asking about [X] or [Y]?" / "I am glad you raised that. We looked at that specific concern."
- **Out-of-scope redirect:** Write a specific redirect phrase that does not dismiss the question: "That question deserves more time than we have today. Let me set up a follow-up with you specifically." Never say "that is out of scope" -- it sounds bureaucratic.
- **Post-Q&A closing statement (mandatory):** The last audience question should never be the last impression. Write a closing statement that (a) thanks the audience for their questions, (b) restates the one-sentence takeaway from the deck, and (c) states the next step explicitly. This statement is delivered after the final Q&A response regardless of what that response covered.

---

### Step 7: Quality Check the Complete Notes Package

Before delivering the notes to the user, perform this internal audit:

- **Transition continuity check:** Verify that every transition-out sentence linguistically connects to the transition-in of the next slide. Read them as a chain without the elaboration. It should sound like a coherent narrative.
- **Time arithmetic check:** Add all slide times (including transition slides at 20-30 seconds each). Confirm they sum within 10-15 seconds of the total allocated time minus buffers.
- **Elaboration audit:** Flag any slide note that contains wording already visible on the slide. Remove it. Notes that read slides aloud train speakers to look at the screen instead of the audience.
- **Engagement frequency check:** Confirm there is at least one engagement beat every 5-7 minutes of content. For a 20-minute deck, that is 3-4 engagement moments minimum.
- **Key message test:** Read only the key messages for each slide in sequence. They should form a coherent summary of the entire presentation argument.
- **Contingency completeness:** Confirm that compression candidates, expansion candidates, and the anchor slide are all labeled and the content is written -- not just identified.

---

## Output Format

```
## Speaker Notes: [Presentation Title]

**Presenter:** [Name or "TBD"]
**Total Time:** [X minutes (including/excluding Q&A)]
**Q&A Buffer:** [X minutes]
**Slide Count:** [N slides]
**Style:** [Scripted | Semi-scripted | Bullet-point prompts]
**Audience:** [Role/expertise level/posture]
**Delivery Format:** [In-person | Virtual | Hybrid | Live-recorded]
**Speaker Familiarity:** [Author of deck | Presenting someone else's content]

---

### TIME BUDGET

| Slide | Title | Type | Time |
|-------|-------|------|------|
| 1 | [Title] | [Title/Transition/Narrative/Data/Action] | 0:30 |
| 2 | [Title] | [Type] | 2:00 |
| ... | ... | ... | ... |
| N | [Title] | [Type] | 1:30 |
| -- | Q&A | -- | 3:00 |
| **TOTAL** | | | **[X:00]** |

---

### SLIDE NOTES

---

#### Slide [N]: [Slide Title]
**Time:** [M:SS]
**Transition in:** "[Exact phrase that opens this slide -- mirrors previous slide's transition out]"

[ELABORATION -- full paragraphs for scripted / bullets for semi-scripted / trigger phrases for bullet-point prompts]

[STAGE DIRECTION: e.g., PAUSE 3 seconds | MOVE TOWARD SCREEN | CHECK CHAT | CLICK to next build]

**Key message:** [One complete sentence that works without the slide visible]
**Engagement beat:** [Type and exact language, if applicable] ([rhetorical | expects response | silent reading | chat prompt])
**Transition out:** "[Exact phrase that opens the next slide]"

---

[Repeat structure for every slide]

---

### CONTINGENCY NOTES

#### If Running Long -- Compress These Slides
| Slide | Title | Compression sentence |
|-------|-------|----------------------|
| [N] | [Title] | "[Single sentence to replace full slide presentation]" |
| [N] | [Title] | "[Single sentence]" |
| [N] | [Title] | "[Single sentence]" |

#### If Running Short -- Expand These Slides
- **Slide [N] -- [Title]:** [Pre-written anecdote, additional data point, or structured audience question with 60-90 seconds of discussion time]
- **Slide [N] -- [Title]:** [Expansion content]

#### Interruption Return Phrases (by section)
- **[Section name]:** "Great question about [specific topic]. Let me address that and bring us back to [specific focus of current section]."
- **[Section name]:** "[Return phrase]"

#### Early Termination -- Anchor Slide
**[ANCHOR SLIDE: Slide N -- Title]**
If cut short, go directly to this slide. It delivers the minimum viable message of the entire presentation.

#### Technology Failure Backup (no slides)
"[3-5 sentences the speaker can deliver verbally if all technology fails. This is the core argument, not a recap of slides.]"

---

### Q&A PREPARATION

| # | Anticipated Question | Category | Answer Framework |
|---|----------------------|----------|-----------------|
| 1 | [Question] | [Methodology/Risk/Alternative/Strategic] | [Answer structure using PREP or Bridge or Data First] |
| 2 | [Question] | [Category] | [Answer framework] |
| 3 | [Question] | [Category] | [Answer framework] |
| 4 | [Question] | [Category] | [Answer framework] |
| 5 | [Question] | [Category] | [Answer framework] |
| 6 | [Question] | [Category] | [Answer framework] |

**Hostile question bridge:** "[Specific phrase to defuse and redirect a challenging question]"
**Out-of-scope redirect:** "[Specific phrase that declines the question without dismissing it]"

**Post-Q&A closing statement:**
"[3-4 sentence closing: thank audience for questions, restate core takeaway, state next step explicitly. Delivered after the final answer regardless of what the final question was.]"
```

---

## Rules

1. **Never write notes that repeat slide text verbatim.** If the slide says "Revenue grew 22% YoY," the notes must not say "Revenue grew 22% YoY." The notes say what that number means, what caused it, and what it implies. Slide-reading notes train presenters to look at the screen instead of the audience, destroying eye contact and credibility.

2. **Every transition out of slide N must be linguistically matched to the transition into slide N+1.** They are the same moment, heard by the audience as one continuous phrase. If slide 3 ends with "Here is what we found," slide 4 must open with that finding -- not with a new topic that creates a non-sequitur.

3. **Time allocations must be in MM:SS format and must sum arithmetically to the total available time minus all buffers.** Do not round to whole minutes. A 20-minute presentation with 3 minutes of Q&A and 12 slides leaves 17 minutes -- that is 1:25 per slide on average, not 1:30. The 5-second difference compounds across a full deck.

4. **The key message for every slide must be a complete, standalone sentence that works without any visual context.** Test: if the projector dies and the speaker says only the key message sentence, does the audience understand what that slide communicated? If not, rewrite the key message.

5. **Engagement beats must appear at least every 5-7 minutes of presentation time -- not just "somewhere in the deck."** Calculate the timestamps and place engagement beats by time position, not by topic preference. A 25-minute deck needs 4-5 engagement moments. Do not cluster them in the first half and leave the second half uninterrupted.

6. **Contingency compression candidates must be supporting-evidence slides, never the core argument slides.** The slides that prove the thesis cannot be compressed to one sentence without undermining the presentation's credibility. Compressible candidates are: background context slides, methodology slides, appendix-style detail slides, and secondary case studies.

7. **Q&A anticipated questions must include at least one adversarial question** -- one that challenges the presenter's assumptions, methodology, or recommendation. Preparing only easy questions is optimistic planning. The adversarial question prep ensures the presenter is not caught off-guard by the most likely challenge.

8. **The post-Q&A closing statement is non-negotiable.** The last audience question is almost always off-topic, tangential, or pessimistic. The closing statement allows the presenter to re-take the narrative and end on their own terms. It must explicitly state the next step -- not just summarize the content.

9. **Notes style must be uniform across the entire deck.** Do not write scripted prose for the first five slides and then switch to bullet points for the back half because the elaboration feels harder to draft. Style inconsistency forces the speaker to context-switch mid-delivery, which disrupts fluency. If the user's content is uneven, flag it and ask for guidance rather than changing style silently.

10. **Stage directions must use consistent notation throughout the document.** Choose a bracket format -- [PAUSE], [CLICK], [SWITCH TO DEMO] -- and use it everywhere. If the user's delivery format is virtual, include screen-share transition notes at every point where the view changes. Omitting these creates dead air when the presenter fumbles with technology while trying to deliver content simultaneously.

---

## Edge Cases

### Co-Presented Deck (Two or More Speakers)

Label every slide with the active speaker name in bold at the top of the notes block. Write explicit handoff phrases -- these are the most fragile moments in any co-presented deck and must be scripted precisely. Example: "[SPEAKER A hands off to SPEAKER B]: I want to bring in [Name] here, who built this model and can speak to the methodology directly." The handoff phrase should include: a short compliment to the incoming speaker's expertise, a bridge to the topic they are covering, and a physical cue (turning toward them, stepping back).

For Q&A, write a "who answers what" map: a table that assigns each anticipated question to one of the two speakers by topic domain. Include a graceful redirect phrase for when the wrong speaker gets asked a question: "That one is actually [Partner's] territory -- [Name], do you want to take that?" Without this map, co-presenters frequently talk over each other or both stay silent during Q&A.

### Recurring Presentation (Quarterly Reviews, Monthly All-Hands)

Write notes with variable placeholders in the format [UPDATE: description of what to insert]. Example: "[UPDATE: current quarter churn rate]" and "[UPDATE: name of this month's featured customer]." Every variable placeholder must also appear in a pre-delivery checklist at the top of the notes document. The checklist format: a checkbox followed by the variable and its source. Example: "[ ] Update Q3 churn rate -- source: BI dashboard, Metrics tab."

Include a "what changed since last time" annotation field on slides that carry forward from prior sessions. Speakers delivering recurring content frequently forget which numbers updated and which stayed the same. This field prevents presenting stale data confidently.

### Virtual-Only Delivery (Video Conference)

Every 5-6 minutes of virtual content requires an explicit engagement checkpoint written into the notes. For video conference specifically, the notes must include: (a) a chat-check prompt ("Take a quick look at the chat -- I want to make sure I have not lost anyone"), (b) a verbal engagement question at minimum, and (c) a poll if the platform supports it for any section longer than 15 minutes.

Screen-share transitions must be notated exactly: [STOP SHARING SLIDES -- SWITCH TO BROWSER for demo], [RETURN TO SLIDES -- resume at slide 7]. The timing of these transitions must be factored into slide time estimates -- a screen-share switch typically costs 20-45 seconds including the verbal bridge.

Instruct the speaker to use the presenter's name explicitly more often than in-person -- virtual audiences multitask, and name-use snaps attention back. Write notes with more frequent audience callbacks: "As [Name] mentioned in the chat..." or "I see [X] people joined us since we started -- welcome."

### Hostile or Skeptical Audience

Front-load credibility evidence in the notes for slides 1-3. This means: citing methodology sources before making claims ("Based on 847 exit survey responses..."), acknowledging the audience's prior position before presenting contradicting data ("I know many of you have seen different numbers..."), and naming the process used to reach conclusions before stating the conclusions.

Write preemptive objection handling into the elaboration of the most-challenged claim: "I know what some of you are thinking right now -- [specific objection]. Let me address that directly before moving on." This is not defensive posture; it demonstrates that the presenter anticipated and thought through the challenge.

For post-Q&A hostile question responses, write a de-escalation phrase that does not concede the argument: "That is a strong perspective. I understand why you see it that way. Here is what changed my thinking: [specific data point or evidence]." Avoid "I hear you" (sounds patronizing) and "you make a good point" (concedes ground).

### Presenter Who Did Not Build the Slides

When the speaker is presenting content written by someone else -- a common scenario for executives presenting analyst work, or salespeople presenting product team decks -- the notes must include additional context that the original author considered obvious.

For each data slide, include a "source note" in the elaboration: where the data came from, when it was collected, and what the denominator is. Example: "This 23% figure is the percentage of enterprise accounts -- not total accounts -- that reported this issue. Total account percentage is 8%." The speaker needs to know these distinctions to answer methodology questions accurately.

Include a 3-5 bullet "deck briefing" block at the top of the notes document that explains the deck's argument, its intended conclusion, and any known weak points the original author was aware of. This briefing allows the speaker to understand the deck's intent before they begin memorizing the content.

### Non-Native Speaker Delivery

Simplify sentence structure in scripted and semi-scripted notes. Use subject-verb-object construction consistently. Avoid phrasal verbs (say "reduce" not "cut down on"), idioms ("the elephant in the room" becomes "the concern no one has mentioned yet"), and complex subordinate clauses. Each scripted sentence should be 20 words or fewer.

For key technical terms that appear in the notes, add a phonetic pronunciation guide in parentheses the first time the term appears: "EBITDA (ee-BIT-dah)," "churn (rhymes with earn)." This is not about the speaker not knowing English -- it is about preventing the split-second hesitation that breaks the delivery rhythm.

Increase the time buffer by 15-20% for the entire deck. A speaker delivering in a second language typically speaks at 110-120 words per minute rather than the native-speaker average of 130-150 words per minute. A deck timed for a native speaker at 20 minutes will run 23-25 minutes when delivered by a non-native speaker. Build this into the time budget rather than forcing the speaker to rush.

### Presentation Immediately Following Negative News

Presentations that follow a significant negative event -- a product failure, a financial miss, a team restructuring -- require a specific notes adjustment: the opening slide notes must address the context before moving to the planned content. Write an acknowledgment block: 3-5 sentences that recognize the audience's emotional context, state what the presentation will and will not address, and establish why the content matters despite the difficult moment.

Do not pretend the external context does not exist. Audiences who have just received bad news will be mentally distracted until the speaker acknowledges the environment. The acknowledgment block does not need to dwell on the negative event -- it simply names it and pivots: "I know we are all carrying the news about [X]. We are not here to solve that today. What we are here to do is look at [specific topic] -- because the decisions we make on this will matter regardless of how the other situation resolves."

---

## Example

**Input:** "Write semi-scripted speaker notes for a 5-slide product roadmap presentation. I have 12 minutes total, including 3 minutes for Q&A. Audience is potential enterprise clients (not current customers). They are informed about the product space but skeptical -- they have heard roadmap promises before and not seen delivery. Slides are: Slide 1: 'Our 2024 Product Vision' (headline + 3 strategic pillars text), Slide 2: 'What We Shipped in H1 2024' (timeline graphic with 6 milestones), Slide 3: 'H2 2024 Roadmap' (3-column table: Feature | Status | Ship Date), Slide 4: 'Early Access Program' (3 bullets), Slide 5: 'Next Steps' (2 bullets). Delivery is in-person at a sales meeting."

---

## Speaker Notes: 2024 Product Roadmap -- Enterprise Client Presentation

**Presenter:** TBD
**Total Time:** 12 minutes (including Q&A)
**Q&A Buffer:** 3 minutes
**Available Content Time:** 9 minutes
**Slide Count:** 5 slides
**Style:** Semi-scripted
**Audience:** Prospective enterprise clients -- informed, skeptical of roadmap promises, not current customers
**Delivery Format:** In-person, sales meeting
**Speaker Familiarity:** [Confirm with user: author of deck or presenting sales/product on behalf of engineering?]

---

### TIME BUDGET

| Slide | Title | Type | Time |
|-------|-------|------|------|
| 1 | Our 2024 Product Vision | Narrative | 1:30 |
| 2 | What We Shipped in H1 2024 | Data (timeline) | 2:30 |
| 3 | H2 2024 Roadmap | Data (table) | 2:30 |
| 4 | Early Access Program | Action | 1:30 |
| 5 | Next Steps | Action | 0:45 |
| -- | Q&A | -- | 3:00 |
| -- | Closing buffer | -- | 0:15 |
| **TOTAL** | | | **12:00** |

---

### SLIDE NOTES

---

#### Slide 1: Our 2024 Product Vision
**Time:** 1:30
**Transition in:** "I want to start with a direct statement, not a slide: we know that every vendor in this space has shown you a roadmap. We know you have heard promises before. So I am going to do something different today -- I am going to show you what we already shipped before I ask you to believe anything we are promising."

[This opening credits the audience's skepticism before the first slide content appears. It positions the speaker as credible and self-aware.]

**Elaboration bullets:**
- The three pillars (name them from the slide) are not aspirational themes -- each connects to a shipped feature or a scheduled ship date we will cover in the next two slides
- Pillar framing: do not explain each pillar abstractly. Say: "Pillar one maps to [Feature X], which shipped in May. Pillar two maps to [Feature Y], which is on the H2 table. Pillar three maps to [Feature Z], which is in our Early Access Program."
- This pre-maps the deck's logic for a skeptical audience: vision is not floating above evidence -- it is grounded in it

[STAGE DIRECTION: Do not click to build animations here if any exist. Show the full slide and let the audience read it before speaking. 3-second pause after the slide appears.]

**Key message:** Our product vision is not aspirational -- every pillar connects to a feature that is either shipped or has a public ship date in this deck.
**Transition out:** "Let me prove that, starting with what we have already delivered."

---

#### Slide 2: What We Shipped in H1 2024
**Time:** 2:30
**Transition in:** "This is the H1 timeline. Six milestones. All of them shipped."

[STAGE DIRECTION: PAUSE 3 seconds after the first sentence. Let the timeline land. Skeptical audiences need a moment to absorb delivered evidence before the speaker talks over it.]

**Elaboration bullets:**
- Walk the timeline left to right. Name each milestone and the date it shipped. Do not read the graphic -- add the "so what" for each: "This milestone matters to enterprise clients specifically because [reason]."
- Highlight the two milestones most relevant to this specific client's industry or use case. [CUSTOMIZE: check pre-call notes and prioritize their pain points here]
- Shipping cadence context: "Six milestones in six months is not our fastest cadence -- but it reflects a deliberate decision to prioritize stability over speed, which enterprise deployment environments require."
- Acknowledge slip-ups proactively if any milestone shipped late: "This one [point to it] shipped two weeks after our original target. Here is why: [brief, honest explanation]. We updated our planning methodology after that -- which is why the remaining milestones landed on schedule."
- Do not over-explain each milestone. The goal of this slide is to establish delivery credibility, not to demo each feature.

[STAGE DIRECTION: MOVE slightly toward the screen when gesturing to specific points on the timeline. Return to standing position before the transition.]

**Engagement beat:** "Which of these six -- if I had to pick the one that matters most to your team's situation -- which would it be?" (expects 1-2 responses from the room; 30-second pause for answer). [This is not a rhetorical question. Wait for and acknowledge the answer. It gives you live intelligence about their priorities before you get to the roadmap slide.]

**Key message:** We shipped six milestones in H1 2024 -- on time and in production -- and we can point to exactly which clients are using each one.
**Transition out:** "Here is what that delivery history means for what comes next."

---

#### Slide 3: H2 2024 Roadmap
**Time:** 2:30
**Transition in:** "This is the H2 roadmap. Three columns: feature name, current status, and a specific ship date -- not a quarter, a month."

[STAGE DIRECTION: Let the audience read the table for 4-5 seconds before speaking. For skeptical audiences, reading the ship dates themselves is more credible than hearing them read aloud. Let the specificity land.]

**Elaboration bullets:**
- Read the status column language carefully: distinguish between "In Development" (code exists, in testing), "In Design" (architecture set, engineering not started), and "Planned" (committed to roadmap, not yet scoped). Do not let these distinctions blur -- a skeptical audience will catch it.
- For each feature with a ship date in the next 60 days, add: "This one is in [current status]. We have [X engineers] assigned. I can give you the milestone breakdown if you want it after the meeting." Specificity of resource assignment is a credibility signal.
- For features further out, connect them to the H1 evidence: "We have said features like this before. The H1 timeline you just saw is our track record. Judge this date by that record."
- Do NOT make any verbal commitments that are not in the table. A skeptical audience will remember verbal promises that differ from the written document.
- If there are features in the table that the audience's competitors are also waiting on, note: "This feature is in high demand across our enterprise segment. Early Access Program participants get it first -- I will cover that in a moment."

**Engagement beat:** "I want to stop here before moving on. If you are looking at this table and there is something on your must-have list that you do not see -- tell me now. I would rather address gaps here than have you leave with a wrong assumption." (expects response; allow 45 seconds for discussion)

[STAGE DIRECTION: This pause is deliberate. Do not fill the silence. A skeptical audience that sees something missing will respect the invitation to surface it. This objection handled now is better than one surfaced after the meeting.]

**Key message:** Every H2 feature has a specific month-level ship date and a current development status -- not a quarterly estimate.
**Transition out:** "For the features at the top of your list, there is a way to get access before general availability."

---

#### Slide 4: Early Access Program
**Time:** 1:30
**Transition in:** "The Early Access Program gives your team access to H2 features in pre-release -- 6-8 weeks before general availability."

**Elaboration bullets:**
- Bullet 1 (what it is): "Access to production-ready pre-release builds. Not beta in the traditional sense -- we do not put enterprise clients in unstable builds. You get the same build our internal teams have been running for 30 days."
- Bullet 2 (what we ask for): "Two things: feedback sessions every two weeks with our product team, and permission to cite your participation publicly -- with your approval on any language we use."
- Bullet 3 (what you get): "Dedicated implementation support, priority response on any issues that surface during your early access period, and direct input on the feature configuration before it goes to the full market."
- Do not over-sell this. Skeptical audiences react poorly to high-pressure framing. Present it factually and let the value speak: "We have [X] enterprise clients in the current Early Access cohort. I can share their names if it helps your evaluation."

**Key message:** Early Access gives your team production-ready pre-release access with implementation support and a direct line to the product team.
**Audience question:** "Does early access fit how your team typically evaluates new tools -- or do you prefer to wait for GA?" (rhetorical framing -- but invite a brief response if the room has energy)
**Transition out:** "Whether you join Early Access or wait for GA, here is what we are proposing as a concrete next step."

---

#### Slide 5: Next Steps
**Time:** 0:45
**Transition in:** "Two specific steps."

**Elaboration bullets:**
- Read the two bullets verbatim and then add one sentence of context each. Do not over-elaborate. This slide is the close -- not another content section.
- Next step 1: "[Whatever the first bullet says -- likely a technical deep-dive, POC, or follow-up meeting]. That meeting takes [X] hours and gives your technical team direct access to our engineering lead."
- Next step 2: "[Whatever the second bullet says -- likely a commercial conversation or contract review]. We can have that conversation as soon as your technical team is satisfied."
- Sequence matters: if both steps are listed, be explicit about which comes first. "Step 1 before Step 2."
- Do not list more than two next steps. More than two next steps in a sales meeting communicate indecision about what the priority action is.

[STAGE DIRECTION: Do not click away from this slide. Keep it visible during Q&A so the audience is looking at the next steps as they ask their final questions. It anchors the Q&A toward forward action.]

**Key message:** Two concrete next steps with a clear sequence -- technical validation first, then commercial discussion.
**Transition out:** [No transition out -- this is the final content slide. Move directly to: "Before I open for questions, let me take 20 seconds to recap the three things I want to make sure you leave with."]

[STAGE DIRECTION: The 20-second recap before Q&A is a deliberate technique for skeptical audiences. It frames what they heard before they begin challenging it. This is not defensive -- it is disciplined.]

**Pre-Q&A recap (scripted -- deliver verbatim):** "First: we have a delivery track record -- six milestones shipped in H1. Second: we have a specific, dated H2 roadmap with development status attached to every item. Third: there is a clear path to getting your team access before GA if that is the right fit for how you evaluate. Questions?"

---

### CONTINGENCY NOTES

#### If Running Long -- Compress These Slides
| Slide | Title | Compression sentence |
|-------|-------|----------------------|
| 1 | Our 2024 Product Vision | "Our three strategic pillars are reliability, integrations, and enterprise-grade reporting -- and each maps to features on the roadmap we are about to review." |
| 4 | Early Access Program | "We have an Early Access Program for clients who want pre-release access with implementation support -- ask me about it after the meeting." |
| 5 | Next Steps | "Two next steps: a technical deep-dive with our engineering lead, followed by a commercial conversation. I will follow up with calendar invites." |

#### If Running Short -- Expand These Slides
- **Slide 2 -- What We Shipped in H1 2024:** Ask the audience to pick one H1 milestone they want to understand more deeply, then do a 60-second verbal walkthrough of how that feature works in an enterprise deployment context. "Tell me which of these six matters most to your team, and I will walk you through exactly how [customer X] is using it."
- **Slide 3 -- H2 Roadmap:** Expand with a competitive context note: "One thing worth flagging: two of the features in this table are responses to gaps that clients who evaluated [competitor space, not specific brand name] brought to us. If your team ran that evaluation recently, you may recognize the specific requests." This is only appropriate if the speaker has confirmed the client evaluated competitors -- check pre-meeting notes.

#### Interruption Return Phrases (by section)
- **During Vision section (Slide 1):** "That is an important question about our direction. Let me put a pin in it and come back to it -- it connects directly to the roadmap table, which I want to make sure we get to. [Continue to Slide 2]."
- **During Delivery Evidence section (Slide 2):** "Good point about [topic]. Let me answer that directly: [brief answer]. Now -- I want to make sure we get to the H2 commitments before we run out of time, because that is where the question you just raised gets answered in the data."
- **During Roadmap section (Slide 3):** "I want to make sure we have time for next steps, so let me park that question and come back to it in Q&A -- it deserves more time than I can give it mid-slide."

#### Early Termination -- Anchor Slide
**[ANCHOR SLIDE: Slide 3 -- H2 2024 Roadmap]**
If the organizer cuts time short and you must end in two minutes, go directly to Slide 3. Say: "I want to make sure you leave with the most important document from today. This is our H2 roadmap with specific ship dates. Everything else I was going to say is in here. I will follow up with the full deck." Hand out or email printed or digital copies immediately.

#### Technology Failure Backup (no slides, no projector)
"Here is what I came here to tell you: we shipped six features in the first half of this year, all on schedule. Our H2 roadmap has three additional features with specific month-level ship dates -- not quarterly estimates. And we have an early access option for clients who want in before general availability. The evidence for everything I just said is in the document I am going to send you this afternoon."

---

### Q&A PREPARATION

| # | Anticipated Question | Category | Answer Framework |
|---|----------------------|----------|-----------------|
| 1 | How do we know the H2 dates are realistic given the past? | Methodology/Credibility | Data First: "H1 shipped on time -- six out of six milestones. The one that slipped by two weeks we acknowledged on this slide. The H2 dates are built from the same planning model with one adjustment: [specific methodology change]. Judge the dates by the track record." |
| 2 | What happens if an H2 feature slips? | Risk | Bridge: "Slips happen. Here is our policy: we notify clients 30 days before a committed ship date if we anticipate a miss, with a revised date and explanation. You will never be surprised by a slip without advance notice. We can put that in writing." |
| 3 | Are you adding features we did not ask for while delaying things we need? | Risk/Adversarial | PREP: "Our H2 roadmap is weighted toward requests from our current enterprise segment -- I can share the request source data behind each feature. If there is something on your must-have list that is not in the table, tell me now. I would rather know today than have you discover a gap after you sign." |
| 4 | Who else is in the Early Access Program currently? | Methodology | "I can share client names with your NDA in place. The current cohort is [X] enterprise clients. I can also share one of their contacts for a direct reference call if that would help your evaluation." |
| 5 | How do you handle enterprise-specific customization requests? | Strategic | Bridge: "Customization requests go through our product advisory process -- that is a formal channel, not a one-off conversation. Early Access participants get priority access to that process. The roadmap table we looked at includes two features that originated as customization requests from the current advisory group." |
| 6 | What is the pricing model for the features on the H2 roadmap? | Strategic | "H2 features are included in the enterprise tier pricing that applies to your contract. There are no a-la-carte charges for roadmap features. I will confirm that in writing as part of our follow-up." |
| 7 | Can you guarantee any of these ship dates contractually? | Risk/Adversarial | PREP: "Contractual ship-date guarantees are non-standard in our industry because they create perverse incentives -- vendors ship incomplete features to hit a date rather than delaying for quality. What we offer instead is: advance notification of any date change, credit toward services if a feature misses by more than 60 days, and a history of hitting our targets -- which you just saw in the H1 timeline." |

**Hostile question bridge:** "I appreciate the directness -- that is exactly the kind of question we should surface here rather than after you make a decision. Let me give you the most direct answer I can: [answer]. If that is not sufficient, let us schedule a technical deep-dive and let your team interrogate the data directly."
**Out-of-scope redirect:** "That question involves [topic] that is outside what we can cover in this meeting -- but it is a legitimate question that deserves a complete answer. Let me set up a dedicated 30-minute call with our [relevant expert] who can go deeper than I can right now."

**Post-Q&A closing statement:**
"I want to make sure we end on something concrete. You came here with healthy skepticism about roadmap commitments -- I respect that. What I hope you are leaving with is a reason to evaluate that skepticism against the evidence: six milestones shipped in H1, a dated H2 roadmap with status indicators, and a clear next step that does not require you to take anything on faith. My ask is straightforward: let us schedule the technical deep-dive. After that conversation, you will have everything you need to make a fully informed decision. I will send the calendar invite and the full deck within the hour."
