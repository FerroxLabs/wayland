---
name: workshop-design
description: |
  Designs educational workshops for K-12 or higher education settings with agendas, facilitator guides, learning activities, timing, and outcome measures. Produces a complete workshop package for educators -- distinct from professional development workshops for workplace audiences.
  Use when an educator asks to design a workshop for students, a faculty development session, or a training session within an academic context.
  Do NOT use for corporate or professional development workshops (use `professional-workshop-design`), for full course design (use `online-course-design`), or for single lesson plans (use `lesson-plan-design`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "teaching curriculum lesson-plan step-by-step"
  category: "education"
  subcategory: "teaching"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Workshop Design

## When to Use

Use this skill when the request involves designing a structured learning experience for an educational audience -- students (K-12 or higher education), teachers, faculty, or academic staff -- within a bounded time frame (1 hour to 3 days) that is distinct from a regular class session.

**Trigger scenarios:**
- An instructor asks to design a workshop on a specific topic for their students (e.g., "I need a 90-minute workshop on academic integrity for first-year college students")
- A curriculum coordinator requests a faculty professional development session on a pedagogical technique (e.g., "Design a half-day PD on differentiated instruction for middle school teachers")
- A department chair wants a structured new-faculty orientation workshop covering syllabus design, classroom management, and campus resources
- A school librarian needs a workshop on research skills, source evaluation, or information literacy for a class visiting the library
- An instructional designer is building a standalone module for a student success program (first-gen students, transfer students, academic probation cohorts)
- A faculty learning community wants a structured session to build shared practice around a teaching challenge
- A graduate teaching assistant (TA) training coordinator needs a workshop on active learning techniques for new TAs

**Do NOT use when:**
- The audience is corporate employees, managers, or non-academic professionals -- use `professional-workshop-design` instead
- The request involves designing a full course, semester-long sequence, or multi-unit curriculum -- use `online-course-design` or `curriculum-mapping`
- The user wants a single classroom lesson for a regular course meeting -- use `lesson-plan-design`
- The user is asking about assessment design for an existing course -- use `assessment-design`
- The request is for a conference presentation or keynote with minimal audience participation -- use a presentation-design skill
- The user wants a structured mentoring or coaching program -- those are longitudinal, not workshop-based

---

## Process

### Step 1: Gather Workshop Context and Constraints

Before designing anything, collect precise information. Missing any of these creates design errors that cannot be fixed in revision.

- **Audience specifics:** Who exactly will attend? K-12 students (grade level matters -- a 9th grade workshop and a 12th grade workshop are structurally different), college students (year, major, academic standing), pre-service teachers, in-service teachers (novice vs. veteran), faculty (tenure-track vs. adjunct), mixed. Ask the facilitator to describe their audience's prior knowledge of the topic, not just their job title.
- **Duration and schedule:** Total clock time including breaks. Is this during a school day (constrained by bells), an after-school session (fatigue is a factor), an evening session (even higher fatigue), or a dedicated PD day? Confirm whether the 2-hour block is 120 minutes of instruction or 120 minutes with breaks.
- **Group size and room:** 8-15 (seminar-style), 16-30 (classroom with tables), 31-60 (large room, table groups), 60+ (conference-style, requires modified facilitation). Room arrangement is NOT negotiable in workshop design -- a theater-style room kills collaboration. Confirm whether flexible seating is possible.
- **Technology and materials availability:** Internet access, projector, BYOD vs. shared devices, printing access, whiteboard/chart paper. Assume less than the facilitator thinks is available.
- **Facilitator profile:** Solo facilitator or co-facilitation team? What is their content expertise level? A content expert facilitating their own domain needs different guidance than a generalist facilitator running a content workshop.
- **Outcomes vs. topics:** Ask for outcomes, not just topics. "We want to cover formative assessment" is a topic. "Teachers will leave with a formative assessment strategy they can use in their next lesson" is an outcome. Reframe topic-based requests into outcome-based ones.
- **Non-negotiables and constraints:** Required content that must be included (accreditation requirements, district mandates), content that must be avoided, prior bad experiences the audience has had with this topic.

### Step 2: Define Learning Outcomes Using a Tiered Framework

Learning outcomes drive every design decision. Write them before designing any activity.

- Apply Bloom's Revised Taxonomy to level the outcomes. Use the two-dimensional version: the cognitive process dimension (remember, understand, apply, analyze, evaluate, create) and the knowledge dimension (factual, conceptual, procedural, metacognitive). A 90-minute workshop realistically achieves 2-3 outcomes at the understand-through-apply range. Do not promise outcomes at the evaluate or create level in a single session unless the audience has strong prior knowledge.
- Write outcomes using this formula: "By the end of this workshop, participants will be able to [measurable verb] [specific content] [in what context]." Example: "By the end of this workshop, participants will be able to design one exit ticket aligned to a lesson objective from their current unit."
- Limit to 3-4 outcomes for workshops under 4 hours. More than 4 outcomes for a half-day session is a design failure -- it means the workshop is overloaded and will be rushed.
- Distinguish between knowledge outcomes (understand, identify, explain), skill outcomes (design, construct, apply, use), and dispositional outcomes (value, commit to, adopt a stance toward). Dispositional outcomes are legitimate but require different activities -- they cannot be measured on a knowledge check.
- Map every activity to at least one outcome before finalizing the design. If an activity cannot be mapped, cut it.

### Step 3: Design the Workshop Arc Using the 5E+R Framework

The 5E Instructional Model (Engage-Explore-Explain-Elaborate-Evaluate) was developed by Rodger Bybee for science education but applies broadly to workshop design. Add a Reflect phase to make it 5E+R for professional and adult learning contexts.

**Time allocations for a 2-hour (120-minute) workshop:**

| Phase | Purpose | Ideal Time Allocation |
|---|---|---|
| Engage | Activate prior knowledge, establish relevance, create productive disequilibrium | 8-12% (10-15 min) |
| Explore | Participants investigate, discover, or grapple with the content before formal instruction | 18-22% (20-25 min) |
| Explain | Facilitator consolidates learning, introduces vocabulary, bridges exploration to theory | 15-20% (18-24 min) |
| Elaborate | Participants apply and extend learning to a new context or their own practice | 25-30% (30-36 min) |
| Evaluate | Assessment of whether outcomes were met (can be embedded throughout) | 8-10% (10-12 min) |
| Reflect | Metacognitive processing, action planning, commitment to transfer | 8-10% (10-12 min) |

- The Explore phase must come BEFORE the Explain phase. This is not optional. Beginning with instruction and then practicing is the traditional model and produces weaker retention. Leading with a structured discovery task primes the brain for the explanatory content. The cognitive science term is "desirable difficulty" -- letting participants struggle productively before receiving the explanation significantly improves retention (Kapur's productive failure research).
- The Elaborate phase is not re-teaching. It requires participants to apply learning to a context they have NOT yet seen in the workshop -- their own classroom, a novel scenario, or a transfer task.
- Never design the Explain phase to exceed 20 minutes of uninterrupted facilitator talk. At the 10-minute mark of any direct instruction segment, insert a processing pause: Think-Pair-Share, a quick write, a polling question, or a turn-and-talk. This is not optional -- it is neurologically required for working memory consolidation.
- For half-day workshops (3-4 hours), include a second Elaborate phase after the break that increases cognitive demand. The second application task should require more independence and more complex transfer than the first.
- For full-day workshops (6-7 hours), design each half of the day as its own mini-arc with its own Engage. Do not expect the morning Engage to carry participants through the afternoon. Energy drops sharply at 90 minutes post-lunch; schedule the most active, kinesthetic activity for this slot.

### Step 4: Design Individual Activities with the IDAG Framework

Each workshop activity needs four components: Instructions, Deliverable, Activity structure, and Grouping.

- **Instructions:** Write the participant-facing instructions exactly as the facilitator will say them or display them. Vague instructions ("discuss this with your group") produce vague outputs. Specific instructions ("with your group, read the student work sample and write down two things the student understands and one specific gap") produce usable outcomes. Test your instructions by asking: could a participant follow these without asking a clarifying question?
- **Deliverable:** Every activity must produce something tangible -- a list, a diagram, a written plan, a sticky-note post, a shared document entry, a verbal response to a structured prompt. The deliverable serves two functions: it keeps participants accountable and it gives the facilitator something to observe and use in the debrief.
- **Activity structure:** Choose the structure intentionally. Key activity types and their appropriate uses:
  - *Think-Pair-Share*: best for processing new information quickly; 3-6 minutes total
  - *Jigsaw*: best for distributing responsibility when there is more content than time allows; requires 4-6 pre-prepared "expert" resource packets; each participant becomes the expert on one piece and teaches peers
  - *Carousel/Gallery Walk*: best for exploring multiple examples or strategies simultaneously; requires 5+ stations with 3-5 minutes each; produces breadth over depth
  - *Case Analysis*: best for applying concepts to realistic scenarios; requires carefully designed cases that are ambiguous enough to generate discussion
  - *Structured Academic Controversy*: best for dispositional outcomes where you want participants to confront competing values; participants argue a position, then argue the opposite, then synthesize
  - *Protocols (Tuning Protocol, Consultancy Protocol, Final Word)*: best for faculty PD involving participant-generated work; requires a facilitator who knows the protocol
  - *Design Studio/Workshop-Within-a-Workshop*: participants create something (a lesson plan, an assignment, a rubric) with structured feedback cycles; high time cost but produces direct transfer artifacts
- **Grouping:** Group size is a design decision, not an afterthought. Pairs (2) maximize individual accountability. Triads (3) are ideal for feedback activities -- two give feedback, one receives. Groups of 4 are optimal for most discussion tasks. Groups of 5-6 work for carousel stations and jigsaw. Groups larger than 6 allow social loafing -- one or two people dominate and others disengage. For a 20-person workshop, 4 groups of 5 is the standard configuration. For a 30-person workshop, 6 groups of 5 or 5 groups of 6.

### Step 5: Build the Facilitator Guide with Full Fidelity

The facilitator guide is not an agenda with bullets. It is a production script that allows a different facilitator to run the workshop and achieve the same outcomes.

- **Talking points, not a verbatim script:** Write 3-6 bullet points of key ideas for each segment, with the opening sentence scripted verbatim. Facilitators should not read a script, but they must have the key messages written down to avoid drift.
- **Time markers as both start times AND durations:** Write "0:35 -- 15 min" not just "0:35." The duration is the facilitator's alarm clock; the start time orients them within the whole arc.
- **Transition language:** Write the exact sentence the facilitator will use to move from one segment to the next. Transitions are often where workshops lose energy and time. "Now we're going to..." is not a transition -- it is an announcement. A real transition connects what just happened to what comes next: "You just identified what does NOT work about assessment. Let's look at five strategies that solve exactly those problems."
- **Facilitation moves for common breakdowns:** For each activity, include a contingency note:
  - If groups finish early: an extension question or a stretch task
  - If groups are stuck: a scaffold prompt or a think-aloud example
  - If discussion goes off-topic: a redirect question
  - If time runs short: which components can be compressed or cut without losing the outcome
- **Observation protocol for facilitators:** During each participant activity, specify what the facilitator should listen for (key ideas to amplify in the debrief) and what the facilitator should watch for (participation imbalances, misconceptions, confusion signals). This transforms passive monitoring into active formative assessment of the room.

### Step 6: Design the Evaluation Strategy

Evaluation in educational workshops has three distinct purposes that require three distinct instruments.

- **Outcome assessment (did learning happen?):** Use a brief pre/post format for knowledge outcomes -- 5-8 questions, identical before and after, measuring specific declarative or procedural knowledge. For skill outcomes, use a product assessment: evaluate the artifact participants created during the Elaborate phase against a simple rubric (3 criteria, 3 levels). Do not use a Likert-scale satisfaction survey to measure learning -- it measures perceived learning, which correlates poorly with actual learning.
- **Participant satisfaction (was the experience positive?):** Use 4-6 items measuring relevance, facilitator effectiveness, activity quality, and pacing. Include one open-ended item: "What is one specific change you would recommend?" Collect this on paper, not digitally, for in-person workshops -- digital forms have a 40-50% completion rate; paper cards collected at the door have 85-95%.
- **Transfer planning (will participants use this?):** The highest-value evaluation instrument is an action plan. Use the format: "I will [specific action] in [specific class/context] by [specific date]. The barrier I anticipate is [barrier]. The support I need is [support]." Follow-up in 2-4 weeks by email with a single question: "Did you try it? What happened?" This closes the feedback loop and signals that the facilitator is invested in transfer, not just delivery.
- **For student workshops (K-12 or college):** Replace action planning with a metacognitive reflection. Use a structured format: "Before this workshop, I thought... Now I think... One question I still have..." This Claim-Evidence-Reasoning structure adapted for reflection (the "Before-After-Question" frame) is developmentally appropriate and assessable.

### Step 7: Finalize Materials, Logistics, and Pre/Post Communication

A workshop that is pedagogically perfect can fail because of logistics. Build this into the design.

- **Materials list:** List every item with quantity, who sources it, and when it needs to be prepared. Distinguish between consumables (handouts, sticky notes -- must be replenished for each workshop) and durables (laminated cards, posters -- can be reused). Include a "5-minute setup checklist" the facilitator runs through immediately before participants arrive.
- **Room setup specification:** Specify the exact table arrangement with a diagram. Name the arrangement: clusters (islands of 4-5 for discussion-heavy workshops), horseshoe (20-25 participants, discussion-heavy, everyone sees each other), fishbowl (inner circle works, outer circle observes -- best for modeling conversations or protocols), stations (for carousel activities), café style (small round tables, maximizes intimacy). For K-12 settings, specify whether students bring their own materials or everything is provided.
- **Pre-workshop communication to participants:** Design a 1-paragraph pre-workshop message. State: what the workshop is about, what to bring (specific, not vague), what problem it solves for them (this is the motivation anchor), and the specific start time and location. Send it 3-5 days before, not 2 weeks before (too early to act) and not the day before (too late to prepare).
- **Facilitator preparation checklist:** Include a day-before checklist (print materials, test technology, confirm room) and a 1-hour-before checklist (arrange tables, post station materials, test slides, write agenda on board). Experienced facilitators skip these checklists and make avoidable errors.

---

## Output Format

```
## Workshop: [Title]

**Topic:** [Specific topic with scope -- not just "formative assessment" but
           "low-stakes formative assessment strategies for secondary classrooms"]
**Audience:** [Role + relevant specifics: e.g., "High school teachers, mixed subjects,
              10 novice (0-3 years) and 10 veteran (10+ years), Title I school context"]
**Duration:** [Total clock time] ([instructional time] + [break time])
**Participants:** [Number and group configuration: e.g., "24 participants,
                 6 groups of 4"]
**Location/Setup:** [Room type + specific arrangement + technology available]
**Facilitator:** [Solo or co-facilitation; facilitator's expertise level]

---

### Learning Outcomes
By the end of this workshop, participants will be able to:
1. [Outcome -- measurable verb + specific content + context, Bloom's level: Apply]
2. [Outcome -- measurable verb + specific content + context, Bloom's level: Analyze]
3. [Outcome -- measurable verb + specific content + context, Bloom's level: Understand]

**Outcome-Activity Alignment:**
| Outcome | Activities That Address It | How It Is Assessed |
|---------|---------------------------|-------------------|
| Outcome 1 | [Activity names] | [Product/check] |
| Outcome 2 | [Activity names] | [Product/check] |
| Outcome 3 | [Activity names] | [Product/check] |

---

### Pre-Workshop Preparation

**Facilitator (5+ days before):**
- [ ] [Specific prep task with deadline]
- [ ] [Specific prep task with deadline]

**Facilitator (Day before):**
- [ ] Print [specific materials] -- [quantity]
- [ ] Test [technology] and confirm backup plan
- [ ] Confirm room setup is possible

**Facilitator (1 hour before -- setup checklist):**
- [ ] Tables arranged in [configuration]
- [ ] [Specific item] placed at each table/station
- [ ] Slides open to title slide
- [ ] Timer display set up (visible to facilitator and participants)
- [ ] Agenda written on whiteboard

**Participants (pre-workshop message, send [X] days before):**
[Exact text of the pre-workshop communication]

---

### Workshop Agenda

| Clock Time | Phase (5E+R) | Segment Title | Format | Duration |
|------------|--------------|---------------|--------|----------|
| [0:00] | Engage | [Name] | [Individual/Pairs/Groups/Whole] | [min] |
| [0:XX] | Explore | [Name] | [Format] | [min] |
| [0:XX] | Explain | [Name] | [Format] | [min] |
| [0:XX] | -- | BREAK | -- | [min] |
| [0:XX] | Elaborate | [Name] | [Format] | [min] |
| [0:XX] | Evaluate | [Name] | [Format] | [min] |
| [0:XX] | Reflect | [Name] | [Format] | [min] |
| **Total** | | | | **[min]** |

---

### Detailed Facilitator Guide

#### Phase 1: ENGAGE -- [Segment Title] ([Clock time], [Duration])

**Purpose:** [What this segment accomplishes cognitively/motivationally]
**Bloom's level activated:** [Level]
**Outcome(s) addressed:** [Outcome number(s)]

**Facilitator opening (scripted):**
"[Exact opening words]"

**Facilitator talking points:**
- [Key message 1]
- [Key message 2]
- [Key message 3]

**Participant activity:**
*Instructions displayed/stated:* "[Exact participant-facing instructions]"
*Grouping:* [Solo / Pairs / Groups of X / Whole group]
*Deliverable:* [What participants produce]
*Duration:* [X min individual work] + [X min sharing]

**Facilitator observation notes:**
- Listen for: [Specific ideas or responses to amplify]
- Watch for: [Participation patterns, confusion signals]

**Debrief questions:**
1. [Question that surfaces key ideas from the activity]
2. [Question that bridges to the next phase]

**Transition to Explore:**
"[Exact transition sentence connecting Engage to Explore]"

**Contingency:**
- If groups finish early: [Extension task]
- If groups are stuck: [Scaffold or prompt]
- If time is short (cut to [X] minutes): [What to compress or skip]

---

#### Phase 2: EXPLORE -- [Segment Title] ([Clock time], [Duration])

[Same structure as above]

---

#### Phase 3: EXPLAIN -- [Segment Title] ([Clock time], [Duration])

[Same structure + slide-by-slide summary of key content points]

**Content summary (bullet points, not script):**
- Key concept 1: [Explanation]
- Key concept 2: [Explanation]
- Key concept 3: [Explanation]

**10-minute processing pause (if Explain exceeds 10 min):**
"[Exact instruction for the processing pause activity]"

---

#### Phase 4: ELABORATE -- [Segment Title] ([Clock time], [Duration])

[Same structure + planning template if participants create an artifact]

**Artifact description:** [What participants will produce]
**Template/scaffold provided:** [Yes/No -- attach template after the guide]
**Peer feedback protocol:** [Instructions for feedback exchange]

---

#### Phase 5: EVALUATE -- [Segment Title] ([Clock time], [Duration])

[Same structure]
**Assessment type:** [Product rubric / pre-post quiz / observation checklist]

---

#### Phase 6: REFLECT -- [Segment Title] ([Clock time], [Duration])

[Same structure]
**Reflection format:** [Action plan / Before-After-Question / Exit ticket]
**Transfer commitment prompt:** "[Exact prompt text]"
**Facilitator closing (scripted):** "[Exact closing words]"

---

### Complete Materials List

| Item | Quantity | Who Prepares | Consumable? | Notes |
|------|----------|--------------|-------------|-------|
| [Item] | [#] | Facilitator | Yes/No | [Specific note] |

---

### Room Setup Diagram

[Text description of table arrangement, station locations, projector placement,
and materials placement]

---

### Evaluation Package

#### Part 1: Participant Satisfaction Survey (collect at door as participants exit)
1. The workshop content was relevant to my work. (1-5)
2. The activities helped me engage with the content. (1-5)
3. The facilitator was clear and helpful. (1-5)
4. The pacing felt appropriate. (1-5)
5. What is one specific change you would recommend?

#### Part 2: Transfer Action Plan
I will [specific action] in [specific context] by [specific date].
The barrier I anticipate: [barrier]
The support I need: [support]
My accountability partner for this commitment: [name]

#### Part 3: Pre/Post Knowledge Check (if applicable)
[5-8 questions in the same format as the outcome assessment]

---

### Facilitator Reflection Notes (complete within 24 hours)
- What went as planned?
- What would I change next time?
- Which participants may need follow-up support?
- What evidence of learning did I observe?
```

---

## Rules

1. **The Explore phase must precede the Explain phase every time.** Reversing this order (explain first, then practice) is the default teaching habit and produces weaker retention. Productive failure and desirable difficulty research consistently shows that attempting a task before receiving instruction improves long-term retention by 20-30% compared to instruction-first sequences. There are no exceptions for "time constraints" -- even a 10-minute Explore is better than none.

2. **No single facilitator-talk segment can exceed 20 minutes.** At minute 10-12 of any direct instruction, insert a mandatory processing pause (Think-Pair-Share, quick write, or a polling question). The human working memory can hold 4-7 chunks of information; without processing time, new input displaces earlier content. A 20-minute uninterrupted lecture in a workshop context is a design failure regardless of content quality.

3. **Every workshop 90 minutes or longer requires a formal break of at least 10 minutes.** "Bio break" does not count as a structured break unless participants are also given time to move, refill water, and transition mentally. For workshops 3 hours or longer, include two breaks. Schedule breaks at natural phase transitions, never mid-activity.

4. **Every activity must have a named deliverable before you design the activity itself.** "Groups discuss the reading" is not an activity -- it is an instruction. The deliverable forces design rigor: if you cannot name what participants produce, you have not finished designing the activity. Common deliverables include: sticky notes posted on a chart, a completed planning template, a written feedback comment, a shared document entry, an annotated text, a verbal report to the whole group, or a ranked list.

5. **Group size must be specified and rationalized.** Do not default to "groups of 3-4." Make a specific choice. Groups of 2 maximize accountability but limit perspective diversity. Groups of 3 are ideal for feedback triads. Groups of 4-5 are optimal for discussion and produce the best balance of participation and perspective. Groups of 6+ almost always produce unequal participation. For any group larger than 5, assign explicit roles (facilitator, timekeeper, recorder, reporter) to prevent social loafing.

6. **Outcomes must be written before activities.** If the facilitator starts with "here are five fun activities I want to run," pause and redirect: name the outcomes first, then select or design activities that produce those outcomes. Activities that do not connect to a stated outcome must be removed regardless of how engaging they are.

7. **The evaluation component must distinguish between satisfaction and learning.** Likert-scale ratings of the workshop (Was it useful? Was the facilitator helpful?) measure perceived value, not actual learning. These have low correlation with actual skill or knowledge gain. Include at least one learning-evidence instrument: a product rubric, a pre/post quiz, or an artifact review. Both satisfaction and learning data are valuable -- they just answer different questions.

8. **K-12 student workshops and teacher professional development workshops require structurally different Engage phases.** For K-12 students, the Engage must create personal relevance and emotional stakes within the first 3-5 minutes -- adolescents make "is this worth my time" judgments within 2 minutes and are very difficult to re-engage once checked out. For teacher PD, the Engage must address the "But I already know this / I've tried this before and it didn't work" skepticism -- use a problem that surfaces a gap or contradiction in their current practice rather than simply activating prior knowledge.

9. **Materials must be listed with exact quantities and preparation details.** "Handouts" is not a materials list item. "Planning template handout (24 copies, double-sided, stapled)" is. Every item on the list must include: item name, quantity based on participant count (include 10% overage), who sources/prints/prepares it, and whether it is placed at tables in advance or distributed during the session.

10. **Half-day and full-day workshops must include an energizer after each break.** An energizer is not a party trick -- it is a physiological reset. After 60-90 minutes of seated cognitive work plus a break, participants re-enter the room at lower energy than when they left. A 3-5 minute energizer that involves physical movement, laughter, or a surprising prompt resets attention. This is supported by research on ultradian rhythms: the brain cycles through 90-minute attention peaks and 20-minute recovery troughs. Ignoring this in a full-day workshop produces a visible energy crash around 2:30 PM regardless of content quality.

11. **The facilitator guide must include contingency plans for every major activity.** Three contingencies are required: what to do if participants finish early, what to do if participants are stuck or confused, and what to compress if time runs short. Specifying the "minimum viable version" of each activity (the version that preserves the outcome even if time collapses) is not pessimism -- it is professional facilitation practice.

12. **For workshops involving student artifacts or teacher work samples, build in a protocol structure.** Unstructured sharing of student work or lesson plans almost always defaults to one of three dysfunctional patterns: the "yes-and" pattern (everyone agrees politely), the "fix-it" pattern (peers immediately tell each other what to change), or the "mine is worse" pattern (participants compete to show whose work is most flawed). Named protocols -- Tuning Protocol, Consultancy Protocol, ATLAS, Final Word -- impose turn-taking and question-over-judgment norms that produce genuine peer learning. Include the protocol steps in the facilitator guide verbatim.

---

## Edge Cases

### Virtual or Hybrid Delivery

Virtual workshops are not shorter in-person workshops put on Zoom -- they require a fundamentally different engagement density. Attention management is harder, and the feedback loop between facilitator and participants (reading the room, noticing confusion) is severely degraded.

- Add a 5-minute technology check at the start: have all participants confirm audio, video, and access to the shared collaboration platform (Jamboard, Miro, MURAL, Google Slides comment mode, Padlet, or equivalent).
- Increase engagement interaction frequency: at minimum one interaction every 7 minutes. In-person workshops can sustain 12-15 minutes between interactions; virtual cannot.
- All activities that use physical materials (sticky notes, chart paper, handouts) must have a digital equivalent designed in advance, not improvised. Breakout rooms replace table groups; shared documents replace planning templates; annotation tools replace sticky notes.
- Add 15% to all activity time estimates. Breakout room transitions, digital tool navigation, and screen-share handoffs consume 2-3 minutes each.
- For hybrid workshops (some participants in-room, some remote): do not try to facilitate both simultaneously with a single facilitator. Hybrid requires a room facilitator and a virtual producer. Without both roles, one audience always feels like a second-class participant.

### Mandatory Attendance / Reluctant Participants

Teacher PD mandated by administrators, school-wide "all-staff" workshops, or student workshops that are required course components all share the same design challenge: the audience arrives pre-skeptical.

- Acknowledge the mandate explicitly but briefly in the opening: "I know some of you chose to be here and some of you were told to be here. By the end of this workshop, I hope to earn your time either way." This is more effective than pretending everyone chose to attend.
- Design the Engage phase around a problem they already recognize as real and unsolved -- not a problem you believe they should have. Survey participants 1 week before using a single question: "What is the most frustrating thing about [topic] in your daily work?" Use their exact language in your opening slide.
- Maximize agency in the Elaborate phase: give participants choice of which scenario to apply the learning to, which of two tools to use, or which aspect of their own practice to focus on. Even small choices significantly reduce resistance.
- Avoid any framing that implies participants are deficient ("today we're going to fix how you do X"). Frame as investigation and co-creation: "We're going to look at what the research says, compare it to what you already do, and figure out together what's worth trying."

### Very Large Groups (50+ Participants)

Workshops for 50 or more participants require a structural redesign, not just scaled-up versions of small-group techniques.

- All activities must function at the table level without whole-group reporting after each activity. Whole-group share-outs with 50+ participants become performances for the few and passive observation for the many. Use "gallery post" instead of verbal reporting: groups write their output on a chart and post it; participants circulate during a 5-minute viewing period.
- Recruit and brief table facilitators in advance (1 per table of 6-8). Table facilitators do not need content expertise -- they need to know how to keep conversation moving, ensure everyone speaks, and redirect off-topic discussion. Brief them in writing the day before.
- Use real-time polling (Poll Everywhere, Mentimeter, or equivalent) for the Engage phase and for 10-minute processing pauses during Explain. With 50+ participants, polling replaces Think-Pair-Share as the primary engagement mechanism during facilitated segments.
- Arrival and transition time multiplies with group size: add 5 minutes to every transition for groups over 40. Build this into the agenda, not as a buffer but as explicit time.

### Multi-Day Workshops (2-3 Days)

Multi-day workshops are not multiple independent workshops stacked together -- they require an overarching arc that builds coherence and increasing complexity across days.

- Day 1 follows the full 5E+R arc and ends with a "bridge assignment": a brief task (15-20 minutes, completable before the next morning) that asks participants to observe, try, or document something from their practice that connects to Day 1 content. This is not homework -- it is the Explore phase for Day 2.
- Begin Day 2 and Day 3 with a 15-minute structured debrief of the bridge assignment, not a recap lecture. Use a paired share followed by 3-4 whole-group shares focused on: "What surprised you? What confirmed what you learned yesterday?"
- Cognitive load increases across days -- participants are processing new content on top of accumulated content from previous days. Schedule the most conceptually demanding activities for late morning of Day 1 and late morning of Day 2. Avoid complex new content in the afternoon of the final day; use that time for integration and action planning.
- Relationships build across days: use the same table groups for the first half of the workshop, then reshuffle on Day 2 afternoon. The first half builds psychological safety for honest discussion; the reshuffle introduces new perspectives at the point when participants have enough shared vocabulary to learn from different colleagues.

### Mixed Experience Levels (Novice and Veteran Participants)

Workshops that mix first-year teachers with 20-year veterans, or grade 6 students with grade 12 students in a concurrent program, require differentiated structures rather than one-size activities.

- Design tiered activities for the Elaborate phase: provide a single-step planning template (scaffold) and a blank planning template (open-ended), and let participants choose. This is self-differentiating -- novices tend to choose the scaffold and veterans tend to choose the open version, which is exactly what you want, and neither group feels labeled.
- Use a "pair across experience" grouping strategy for at least one activity: intentionally pair a novice with a veteran. Frame the pairing as mutual learning, not mentoring: "The veteran knows what has worked over time. The novice knows what they learned in pre-service preparation that is recent and current. Both are assets."
- Anticipate the veteran "checked out" problem: experienced participants who have heard the topic before disengage early. Combat this by designing one activity that explicitly asks for their practice-based knowledge -- something they know and newer participants do not. This repositions veterans as contributors rather than recipients.

### Workshops Addressing Sensitive or Contested Topics

Some educational workshops address topics that generate discomfort, disagreement, or strong emotional reactions: equity and inclusion, discipline policy reform, trauma-informed practice, grading philosophy changes. Standard facilitation norms are insufficient for these contexts.

- Establish explicit community agreements in the first 10 minutes using co-construction, not a pre-written list. Ask: "What do you need from this group to engage with a challenging topic honestly?" Record their responses. This takes 8-10 minutes and is worth every minute -- it shifts ownership of the agreements from facilitator-imposed to participant-generated.
- Design activities that use data and evidence before opinion: start with student outcome data, research findings, or anonymized case examples. This grounds discussion in shared evidence before participants share personal positions.
- Build in "process pauses": at two or three points during the workshop, pause the content and ask "How is this discussion going for you?" Use a simple 1-5 hand signal or a brief written check-in. This normalizes the discomfort without resolving it prematurely.
- Know the distinction between "productive struggle" (discomfort that generates learning) and "traumatic re-exposure" (asking participants to publicly process personal experiences with racism, loss, or abuse in a 2-hour workshop). The latter requires therapeutic skill, not facilitation skill. Design activities that engage ideas and scenarios, not personal confessions.

---

## Example

**Input:** "Design a 3-hour workshop for 8th grade students on evaluating online sources and recognizing misinformation. There are 28 students, it's during the school day, in the school library. The librarian is facilitating."

---

## Workshop: Who Told You That? -- Evaluating Online Sources and Recognizing Misinformation

**Topic:** Lateral reading, source evaluation, and misinformation recognition for online research contexts
**Audience:** 8th grade students (ages 13-14), mixed academic levels, likely daily social media users with no prior instruction in source evaluation
**Duration:** 3 hours (170 minutes instruction + 10 minutes break)
**Participants:** 28 students in 7 groups of 4
**Location/Setup:** School library -- 7 round or rectangular tables of 4, pushed to allow movement; projector/display screen at front; 7 laptop or tablet stations (one per group or BYOD); access to a shared class digital folder
**Facilitator:** School librarian (solo; high content expertise in source evaluation, familiar with this student cohort)

---

### Learning Outcomes

By the end of this workshop, students will be able to:
1. Apply the SIFT method (Stop, Investigate the source, Find better coverage, Trace claims) to evaluate a new online source they have not seen before (Bloom's level: Apply -- Procedural)
2. Distinguish between lateral reading and vertical reading strategies and explain why lateral reading is more reliable for source verification (Bloom's level: Understand -- Conceptual)
3. Identify at least three characteristics of misinformation design that are used to manipulate reader emotion and trust (Bloom's level: Analyze -- Factual/Conceptual)
4. Complete a structured source evaluation for a source relevant to a current research topic of their choice (Bloom's level: Apply -- Procedural)

**Outcome-Activity Alignment:**

| Outcome | Activities That Address It | How It Is Assessed |
|---------|---------------------------|-------------------|
| 1: Apply SIFT | SIFT Practice Rounds (Elaborate), Source Evaluation (Elaborate 2) | Completed SIFT worksheet |
| 2: Lateral vs. vertical reading | Vertical vs. Lateral Race (Explore), Explain phase | Exit ticket question |
| 3: Misinformation characteristics | Headline Autopsy (Engage), Misinformation Gallery Walk (Explore) | Gallery walk annotation |
| 4: Source evaluation artifact | Personal Source Evaluation (Elaborate 2) | Evaluated source document |

---

### Pre-Workshop Preparation

**Librarian (5+ days before):**
- [ ] Select 6 authentic websites for the SIFT Practice Rounds: choose 2 reliable sources, 2 low-quality or biased sources, and 2 "looks credible but isn't" sources. Use real sites, not made-up ones -- the goal is to practice on the actual information landscape students will encounter
- [ ] Select 8 real headlines from the past 6 months for the Headline Autopsy -- 4 misleading, 4 accurate, all on topics 8th graders would plausibly encounter
- [ ] Prepare SIFT Practice Round worksheets (28 copies) with fields: URL, Stop (initial reaction), Investigate (what did you find about the source?), Find Better Coverage (what did other sources say about this claim?), Trace Claims (where did this information originate?), and Your Verdict
- [ ] Prepare Personal Source Evaluation template (28 copies)
- [ ] Create Misinformation Gallery Walk: 6 printed poster-size examples (misleading headline, fake expert credential, emotional manipulation image, satire presented as fact, fabricated statistic, manipulated photo) -- each labeled A-F with a blank annotation space
- [ ] Pre-load 6 website URLs into a shared document students can access on group devices (prevents time loss typing URLs)
- [ ] Prepare a 1-slide "SIFT Cheat Sheet" for display during the Elaborate phase

**Librarian (day before):**
- [ ] Print all handouts (28 copies of each: SIFT worksheet x3 for three practice rounds, personal source evaluation template)
- [ ] Print and post 6 Gallery Walk posters around the library perimeter
- [ ] Set up devices or confirm BYOD access -- test all 6 URLs load correctly
- [ ] Write agenda on whiteboard: "1. Headline Autopsy 2. Vertical vs. Lateral Race 3. What is SIFT? 4. BREAK 5. SIFT Practice 6. Your Own Source 7. Wrap-Up"

**Librarian (1 hour before):**
- [ ] Tables arranged in 7 groups of 4
- [ ] SIFT worksheets (set of 3 per student) in a stack at each table, face down
- [ ] Markers and sticky notes at each table
- [ ] Gallery Walk posters posted in 6 locations with 30cm clear space around each for students to stand
- [ ] Shared document URL on screen at title slide
- [ ] Timer app open on facilitator's device, connected to display

**Pre-workshop message to classroom teacher (send 2 days before):**
"Hi [Teacher name], I wanted to give you a heads-up about the library workshop on [date]. Students don't need to bring anything special -- just themselves and, if your class is BYOD, their devices. To help with the Elaborate section, if you have a current research assignment or upcoming project they are working on, it would be great if they arrive with that topic in mind. The workshop runs 3 hours and ends at [time]. I'll send you a one-page summary of what we covered so you can reinforce it in class. Thanks!"

---

### Workshop Agenda

| Clock Time | Phase (5E+R) | Segment Title | Format | Duration |
|------------|--------------|---------------|--------|----------|
| 0:00 | Engage | Headline Autopsy | Groups of 4 | 18 min |
| 0:18 | Explore | Vertical vs. Lateral Race | Pairs | 20 min |
| 0:38 | Explore | Misinformation Gallery Walk | Individual + Group | 22 min |
| 1:00 | Explain | What is SIFT? | Whole group + processing pause | 20 min |
| 1:20 | -- | BREAK | -- | 10 min |
| 1:30 | Engage (reset) | Two Truths and a Source | Whole group | 5 min |
| 1:35 | Elaborate | SIFT Practice Rounds | Groups of 4 | 35 min |
| 2:10 | Elaborate | Personal Source Evaluation | Individual + Pairs | 30 min |
| 2:40 | Evaluate | SIFT Speed Round | Whole group | 10 min |
| 2:50 | Reflect | Before-After-Question Exit Ticket | Individual | 10 min |
| **Total** | | | | **180 min** |

---

### Detailed Facilitator Guide

---

#### Phase 1: ENGAGE -- Headline Autopsy (0:00 -- 18 min)

**Purpose:** Activate prior knowledge about how media can mislead; create cognitive disequilibrium by surfacing the gap between first impressions and verified reality; establish personal relevance
**Bloom's level activated:** Remember/Analyze
**Outcome(s) addressed:** Outcome 3

**Facilitator opening (scripted):**
"Before we say anything about online sources or research, I want you to do exactly one thing: look at this headline and tell your table whether you believe it, whether you are suspicious of it, or whether you have no idea. Don't look it up. Just react."

[Display Headline 1 on screen -- choose a specific, real recent misleading headline about a topic 8th graders know, such as a viral claim about a popular game, a celebrity, or a school policy]

**Facilitator talking points:**
- Give groups 90 seconds to react, no more
- Reveal whether the headline was accurate or misleading using a trusted fact-check source result (pre-prepared)
- Show all 8 headlines sequentially -- 60-90 seconds each
- Do NOT explain why headlines are misleading yet -- let students be wrong and feel the gap
- After the 8 headlines: "How many did your table get right?" Show of hands by number (0, 1-3, 4-6, all). Note: most tables will get 3-5 right, which sets up the problem

**Participant activity:**
*Instructions displayed:* "Look at each headline. Thumbs up (believe it), thumbs sideways (not sure), thumbs down (suspicious). Discuss at your table -- 90 seconds. Vote as a group."
*Grouping:* Groups of 4 (assigned -- do not allow friend-group self-selection, it reduces engagement range)
*Deliverable:* Verbal group vote for each headline; tally on whiteboard by facilitator
*Duration:* 8 minutes for headlines, 5 minutes for pattern debrief, 5 minutes for facilitator framing

**Facilitator observation notes:**
- Listen for: students expressing surprise at being wrong; students confidently wrong (important to note -- these are your highest-risk over-confident readers); students who already use verification strategies
- Watch for: any student who is clearly checking their phone to look up headlines -- redirect without shame: "We'll look things up in a moment, right now I want your first instinct"

**Debrief questions:**
1. "What made you believe some headlines and doubt others? What clues were you using?"
2. "Notice that some of the misleading headlines looked more professional than the accurate ones. What does that tell us about using 'looks legit' as a strategy?"

**Transition to Explore:**
"Your instincts got you about halfway there -- and that's roughly the same success rate researchers find with college students and even some adults. The problem is: our brains are not built to detect manipulation. They are built to confirm what we already believe. Today we're going to build a set of skills that work better than instinct. Let's start by trying two completely different strategies for evaluating a source -- and you're going to race to see which one works faster."

**Contingency:**
- If groups finish the headline votes very quickly: ask "What would you need to know to be sure about this headline?" (This previews SIFT without naming it)
- If students are disengaged or reluctant: use a headline about something in their immediate world (a local school policy, a game or app they use) rather than a national news topic
- If time is short (compress to 12 minutes): use 5 headlines instead of 8; cut the pattern debrief question

---

#### Phase 2: EXPLORE -- Vertical vs. Lateral Reading Race (0:18 -- 20 min)

**Purpose:** Allow students to discover, through direct experience, that staying within a single website (vertical reading) produces less reliable evaluation than moving to other sources (lateral reading). The goal is productive failure on the vertical reading strategy before the Explain phase names and validates lateral reading.
**Bloom's level activated:** Understand (through experience)
**Outcome(s) addressed:** Outcome 2

**Facilitator opening:**
"I'm going to give each pair one website. Half the pairs will use Strategy A: spend 3 minutes reading only that website -- go deep into it, explore its About page, its content, its design. The other half will use Strategy B: spend 3 minutes doing ONE thing -- open a new tab and search the organization's name plus 'credibility' or 'bias.' Don't go back to the original site. See what other people say about it."

[Assign Strategy A to tables 1, 2, 3; Strategy B to tables 4, 5, 6, 7. Each pair gets the same 3 websites to evaluate -- assign the same URL to one Strategy A pair and one Strategy B pair so results can be compared]

**Participant activity:**
*Instructions displayed:* "Strategy A: Explore only the website itself for 3 minutes. Strategy B: Search [organization name] + 'bias' or 'review' for 3 minutes. Do NOT look at the original site. Write: (1) Is this source reliable? (2) How confident are you? (3) What evidence did you use?"
*Grouping:* Pairs within their table group (28 students = 14 pairs)
*Deliverable:* Written answers to 3 questions on a half-sheet; verbal comparison with a Strategy B pair afterward
*Duration:* 3 minutes individual strategy work, 5 minutes compare with opposite-strategy pair, 7 minutes whole-group discussion of findings, 5 minutes facilitator bridge

**Facilitator observation notes:**
- Listen for: Strategy A students describing the website's design, professionalism, or self-described mission as evidence of reliability -- this is vertical reading and exactly the gap to highlight
- Listen for: Strategy B students finding credibility assessments from Media Bias Fact Check, Wikipedia article histories, news reporting about the organization -- this is lateral reading working
- Watch for: Strategy A students who intuitively go to other sources -- they are already lateral readers; recruit them to share in the debrief

**Debrief questions:**
1. "Strategy A pairs: what evidence did you use to judge the site? Strategy B pairs: what evidence did you use? [Facilitate a comparison -- which produced more useful information?]"
2. "Why would staying inside a suspicious website be a bad strategy? What does the website have an interest in telling you?"

**Transition to Gallery Walk:**
"What Strategy B pairs did is called lateral reading -- you immediately stepped outside the source to see what others say about it. It is the technique professional fact-checkers use, and it works in about 30 seconds. Before I show you the full system, I want you to look at six examples of how misinformation actually works -- what techniques it uses to get past your defenses. Walk around the library."

**Contingency:**
- If internet access fails: pre-print the "lateral reading result" for each website as a second sheet students can flip over after the vertical reading attempt
- If pairs finish early: ask them to try the opposite strategy on a second URL
- If time is short (compress to 15 min): skip the whole-group debr
