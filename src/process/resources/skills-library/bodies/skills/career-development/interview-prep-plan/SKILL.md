---
name: interview-prep-plan
description: |
  Builds a day-by-day preparation plan for an upcoming interview, covering
  company research, answer preparation, logistics, and mental readiness.
  Produces a dated checklist the user can follow from 1 to 14 days before the
  interview. Use when the user has an interview scheduled and wants a structured
  preparation plan, needs to organize their prep time, or asks how to prepare
  for an upcoming interview. Do NOT use for writing specific interview answers
  (use behavioral-interview-prep or technical-interview-prep), predicting
  questions (use interview-question-anticipator), or company research
  (use company-research-guide).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "interview-prep career planning checklist"
  category: "career-development"
  subcategory: "interview-preparation"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Interview Prep Plan

## When to Use

**Use this skill when:**
- The user has a confirmed interview date and wants a structured, day-by-day preparation schedule with specific tasks and time allocations
- The user says something like "I have an interview in X days -- how should I prepare?" or "help me organize my interview prep"
- The user is feeling overwhelmed by the scope of preparation and needs a sequenced plan that breaks work into manageable daily blocks
- The user has multiple interviews in the same week or consecutive weeks and needs to coordinate preparation across companies without burning out
- The user has completed some preparation (research, resume review) and wants help filling gaps and scheduling remaining work before the interview date
- The user is returning to the job market after a long absence (2+ years) and needs a more structured scaffolding because they are unfamiliar with current interview norms

**Do NOT use this skill when:**
- The user wants to write and refine specific behavioral interview answers using the STAR/SOAR framework -- use `behavioral-interview-prep` instead
- The user needs technical interview coaching including coding problem strategies, system design frameworks, or algorithm practice -- use `technical-interview-prep` instead
- The user wants help predicting what specific questions will be asked -- use `interview-question-anticipator` instead
- The user wants a deep company research guide covering financials, competitors, culture signals, and leadership -- use `company-research-guide` instead
- The user wants to build a list of thoughtful questions to ask their interviewer -- use `interview-questions-to-ask` instead
- The user has not yet scheduled an interview and is asking how to job search -- this skill requires a concrete date to build a plan around

---

## Process

### Step 1: Gather the Five Planning Variables

Before generating a single day of the plan, collect specific information. Do not build a generic plan -- the quality of the output depends entirely on the precision of the input.

- **Interview date and time:** Exact date is required. If the user says "next Thursday," confirm which Thursday and note the time so morning-of logistics are accurate.
- **Format:** Phone screen, one-way video (recorded, asynchronous), live video, in-person single interviewer, panel (2-4 interviewers simultaneously), sequential in-person rounds (full-day on-site), or hybrid. Each format has distinct preparation requirements. One-way video requires practice with speaking to a camera alone with no feedback; panels require practice maintaining eye contact across multiple people.
- **Interview type:** Behavioral only (tell me about a time...), technical only (coding, system design, take-home assignment), case study (consulting/strategy), product sense (PM roles), portfolio review (design, creative, engineering), or mixed. Mixed is most common at mid-career levels. Ask the user to describe what they know about the interview structure.
- **Role level and function:** Entry level (IC1-2), mid-level (IC3-4), senior (IC5-6), staff/principal, manager, director, VP, or executive. Level changes the depth of expected answers -- an entry-level candidate is expected to demonstrate potential; a senior candidate is expected to demonstrate measurable impact at scale.
- **Daily time available:** Ask for realistic hours per day, not aspirational. If the user says "2-3 hours," plan around 1.5 hours to account for real-world interruptions. Overloaded plans cause abandonment.

### Step 2: Determine the Preparation Window and Tier

Map the available days to one of three preparation tiers. Each tier has different architecture -- not just fewer tasks, but a different sequencing logic.

**Tier 1 -- Emergency (1-2 days):**
Total prep time is likely 3-6 hours. Every minute must create maximum signal. Prioritize in strict order: (1) company and role context, (2) 3 STAR stories covering leadership/impact/problem-solving, (3) 3-5 questions to ask, (4) logistics and tech check. Skip anything that would take more than 45 minutes to build from scratch. Quality over quantity -- two excellent STAR stories beat six mediocre ones.

**Tier 2 -- Standard (3-7 days):**
The most common scenario. Enough time for full preparation across all five pillars with two rounds of practice. Research occupies the first third of available days, answer preparation the middle third, and practice plus refinement the final third. The day before is always reserved for logistics review and rest -- never new learning.

**Tier 3 -- Thorough (8-14 days):**
Rare in practice; more common for highly competitive roles (FAANG, McKinsey, elite MBA programs) or career-change situations. Use additional time for: second-round research (reading company SEC filings or earnings calls, analyzing competitor positioning), extended mock interview sessions with feedback, technical preparation depth, and mental performance practices (consistent sleep schedule, visualization). Front-loading is even more important here -- use extra time for refinement, not more first-draft work.

### Step 3: Assign the Five Preparation Pillars to Specific Days

Every complete preparation plan covers five pillars. The schedule must assign each pillar to a specific day or set of days, not leave them as floating tasks. Pillars do not have equal time weight -- research and answer preparation together consume roughly 60% of total prep time.

**Pillar 1 -- Research (20-25% of total prep time):**
Output of this pillar is a single one-page company brief the candidate can review on interview morning. The brief covers: what the company does and how it makes money (business model), the specific team or product area for the role, 2-3 recent company developments (funding, product launch, executive hire, regulatory issue), the company's stated mission and values (verbatim, for value-alignment questions), and the interviewer's name, title, and LinkedIn background if discoverable. Research day is always Day 1 of preparation because it feeds answer tailoring in subsequent days.

**Pillar 2 -- Answer Preparation (35-40% of total prep time):**
The number of STAR stories to prepare scales with role level and interview type:
- Entry level behavioral: 4-5 stories minimum
- Mid-level behavioral: 5-7 stories covering leadership, conflict, failure, data use, cross-functional collaboration
- Senior/manager behavioral: 7-10 stories including organizational influence, stakeholder management, and hire/fire decisions
- For technical interviews: 3-5 solved LeetCode-style problems at the appropriate difficulty tier, plus 2-3 practiced system design narratives
- For case interviews: 3-5 full cases practiced aloud using MECE frameworks (Issue Trees, 3C/4P/Porter's Five Forces)

Each story should be rehearsed aloud to a 90-second target. Stories that run 3+ minutes without being asked for detail are too long.

**Pillar 3 -- Questions to Ask (10% of total prep time):**
Prepare 6-8 questions. Never fewer than 5, because 1-2 will be answered during the interview itself. Organize questions into three tiers: role-specific questions (about the day-to-day work, success metrics, team dynamics), strategic questions (where this team is headed, biggest challenges), and culture/fit questions (what makes high performers succeed here). For senior and executive roles, include at least one strategic question that demonstrates business understanding.

**Pillar 4 -- Logistics (5-10% of total prep time):**
Logistics failures are silent killers of otherwise strong interviews. Assign a dedicated logistics task to two days: Day 1 (confirm date, time, format, location or link, dress code, what to bring) and the day before (re-confirm everything, test all technology, lay out materials, set multiple alarms with buffer time). For in-person interviews: map the route, identify parking, build in 30 minutes of buffer beyond travel time, and identify a nearby coffee shop or lobby to wait in if early. For virtual interviews: test camera, microphone, speaker, and internet connection. Have a backup -- phone data hotspot, phone dial-in number from the calendar invite.

**Pillar 5 -- Mental Readiness (10-15% of total prep time):**
This is the most commonly skipped pillar and the most commonly underestimated factor in performance. Schedule these specific practices:
- At least one full mock interview aloud (recording yourself is more effective than a live audience for most people -- you notice your own verbal tics and filler words)
- Box breathing practice: 4 seconds inhale, 4 seconds hold, 4 seconds exhale, 4 seconds hold. Practice twice daily in the 48 hours before the interview. Two minutes pre-interview reduces cortisol measurably.
- A "wins journal" entry: 10 minutes writing down 5 specific professional accomplishments in detail. This is evidence-based for increasing performance self-efficacy immediately before high-stakes evaluations.
- Sleep target: the two nights before the interview are more important than the night before. One poor night of sleep has limited cognitive impact; two consecutive poor nights significantly impairs working memory and verbal fluency.

### Step 4: Build the Day-by-Day Plan with Concrete Tasks

Generate a task list for each day. Each day has a primary focus (single theme), 3-6 specific tasks, realistic time estimates, and a completion checkpoint. Checkpoints must be behavioral and observable, not aspirational -- "feel confident" is not a checkpoint; "can deliver each STAR story in under 90 seconds with a quantified result when prompted" is.

**Task specificity rules:**
- Every task starts with a verb: Read, Write, Record, Practice, Confirm, Map, Prepare, Time, Research
- Every task has a time estimate in the 15-60 minute range. Tasks longer than 60 minutes must be broken into sub-tasks.
- Every task produces a tangible output (a written summary, a recorded answer, a confirmed calendar item, a printed resume)
- Never assign a research task and an answer-drafting task to the same day for a 1-hour-per-day prep window -- cognitive load is too high

**Day sequencing rules:**
- Day 1 is always research -- do not begin answer preparation before understanding the company context
- The day before the interview is always logistics and light review only -- 30 minutes maximum of new content
- Practice sessions belong in the latter half of the plan, after answer drafts exist
- For 5+ day plans, include one "catch-up" day with no primary new tasks -- a buffer for real-life disruption

### Step 5: Write the Interview Morning Protocol

Every plan ends with a precise morning-of sequence. Candidates who "wing" interview morning underperform candidates who follow a pre-performance protocol, regardless of preparation depth. The protocol includes:

- **Wake up time:** At least 2 hours before interview start for in-person; at least 1 hour for virtual
- **Physical routine:** Light movement (10-minute walk minimum), a meal with protein (not just coffee), no alcohol the night before
- **Review window:** Maximum 20 minutes of review. Review the company one-pager and the top 3 strongest STAR stories only. Do not open new material.
- **Pre-interview window:** Log in or arrive 10-15 minutes early. Use the waiting time for a 2-minute box breathing session and a 60-second power posture (standing upright, shoulders back) -- both have demonstrated pre-performance benefit in research contexts.
- **Mindset reframe:** Remind the user that an interview is a two-way evaluation. The candidate is also evaluating whether this company and role are right for them. This reframe measurably reduces performance anxiety by shifting perceived power dynamics.

### Step 6: Build the Preparation Tracker and Crash Plan

**Preparation tracker:** A 5-row table showing each pillar, a completion checkbox, and the key deliverable that marks completion. This serves as a progress dashboard the user can update daily.

**Crash plan:** Always include a minimum viable preparation block for worst-case scenarios (unexpected scheduling compression, illness, work emergency). The crash plan is a 2-hour intensive covering the five highest-leverage activities in strict priority order:
1. 30-minute company overview (website About page + one recent news item)
2. 30-minute STAR story preparation (2 stories: one achievement, one problem-solving)
3. 20-minute product/role question preparation (what does this role actually do day-to-day)
4. 15-minute questions-to-ask preparation (3 questions minimum)
5. 15-minute logistics and tech check (confirm link, test camera, set alarm)
6. 10-minute mental prep (wins journal entry + box breathing practice)

The crash plan is not a fallback to mention in passing -- it is a named section in every output, because candidates who do not know about it abandon preparation entirely when plans break down.

### Step 7: Adapt for Interview Type, Format, and Role Level

Apply these type-specific modifications before finalizing the plan:

**For technical interviews (software engineering, data science, ML):**
- Add daily coding practice tasks using a structured progression: warm-up problems (easy, 20 min), target problems at the expected difficulty level (medium/hard, 40 min), and verbal walkthrough practice (10 min narrating solution out loud)
- Include a system design practice session for senior+ roles: whiteboard a system design problem from scratch and narrate every design decision
- Note that technical interview preparation requires sustained daily practice -- skipping days causes regression in fluency

**For case/consulting interviews:**
- Each day of case prep must include at least one full case practiced aloud from start to finish -- not just reading frameworks. Cases take 30-45 minutes each.
- Add a "quantitative warm-up" task: 10 minutes of mental math practice daily (market sizing estimates, percentage calculations, back-of-envelope analysis)
- Prepare a "frameworks inventory": a personal reference of 5-7 frameworks (Profitability = Revenue - Costs, 3C, Porter's Five Forces, Value Chain, Growth = Market Share x Market Size) with one-sentence explanations of when each applies

**For senior/executive interviews:**
- Answer preparation shifts from "what did I do" to "what did I lead, influence, and build at scale" -- every STAR story must include organizational impact and lessons taught to others
- Add a "narrative thread" task: write a 3-4 sentence leadership philosophy statement that can anchor answers across behavioral questions
- Include a "strategic alignment" prep task: research the company's strategic priorities and prepare to connect your experience to those priorities explicitly

**For panel interviews:**
- Add a specific practice for addressing a group: practice delivering answers that shift eye contact naturally between 3 different spots in the room at conversation-appropriate intervals (roughly 5-7 seconds per person)
- Prepare one piece of follow-up for each panelist type you expect (HR, technical, hiring manager, peer) -- show you recognize each person's perspective

---

## Output Format

```
## Interview Preparation Plan

**Interview:** [Job Title] at [Company Name]
**Interview Date:** [Day, Date, Time, Timezone]
**Format:** [Phone / Live Video / In-Person / Panel / Full-Day On-Site]
**Type:** [Behavioral / Technical / Case / Product / Mixed -- specify components]
**Role Level:** [Entry / Mid / Senior / Manager / Director / Executive]
**Prep Window:** [X] days (today is [Day, Date])
**Daily Time Available:** [X] hours/day
**Prep Tier:** [Emergency / Standard / Thorough]

---

### Day-by-Day Preparation Plan

**[Day 1] -- [Day of Week, Date] -- PRIMARY FOCUS: [Pillar Name]**

Goal: [One sentence describing what success looks like by end of day]

- [ ] [Verb + specific action + output produced] ([time estimate])
- [ ] [Verb + specific action + output produced] ([time estimate])
- [ ] [Verb + specific action + output produced] ([time estimate])
- [ ] [Verb + specific action + output produced] ([time estimate])

**Checkpoint:** [Behavioral, observable test of completion -- what can the user do or produce that proves this day's prep is done?]

---

**[Day 2] -- [Day of Week, Date] -- PRIMARY FOCUS: [Pillar Name]**

Goal: [One sentence]

- [ ] [Task] ([time])
- [ ] [Task] ([time])
- [ ] [Task] ([time])
- [ ] [Task] ([time])

**Checkpoint:** [Observable completion test]

---

[Repeat for each day...]

---

**[Final Prep Day] -- [Day of Week, Date] -- PRIMARY FOCUS: Logistics + Light Review**

Goal: Everything is confirmed, packed, and tested. You will do no new learning tonight.

- [ ] Re-confirm interview time, link or address, and interviewer name (5 min)
- [ ] Test video setup OR map the route with a buffer (15 min)
- [ ] Lay out outfit, printed resume copies, notepad, water (10 min)
- [ ] Review company one-pager once (10 min)
- [ ] Review your 3 strongest STAR stories once each -- no editing (15 min)
- [ ] Set two alarms. Go to bed by [target time]. (5 min)

**Checkpoint:** Nothing is uncertain. You can describe your plan for tomorrow morning without checking your phone.

---

**INTERVIEW DAY -- [Day of Week, Date, Time]**

Morning Protocol:
- [ ] Wake up by [time -- 2 hours before interview for in-person, 1 hour for virtual]
- [ ] Light physical movement: 10-minute walk (10 min)
- [ ] Protein-based meal. No alcohol from the night before. (20 min)
- [ ] Review company one-pager and top 3 STAR story headlines only (15 min)
- [ ] Arrive / log in [10-15 minutes] early
- [ ] 2-minute box breathing: 4-count in, 4-count hold, 4-count out, 4-count hold (2 min)
- [ ] 60-second power posture: stand upright, shoulders back (1 min)

**Bring / Have Ready:**
- [ ] [Item 1 -- e.g., 3 printed copies of resume (in-person) / interview confirmation link (virtual)]
- [ ] [Item 2 -- e.g., notepad and pen / backup dial-in number]
- [ ] [Item 3 -- e.g., list of 6 prepared questions to ask]
- [ ] [Item 4 -- e.g., water bottle]

**Mindset check:** You are evaluating them as much as they are evaluating you. Curiosity, not performance.

---

### Preparation Tracker

| Pillar | Status | Key Deliverable | Target Day |
|---|---|---|---|
| Research | [ ] Not started | Company one-pager written (1 page max) | Day 1 |
| Answer Prep -- Behavioral | [ ] Not started | [X] STAR stories drafted and timed | Day [X] |
| Answer Prep -- [Type-Specific] | [ ] Not started | [specific deliverable] | Day [X] |
| Questions to Ask | [ ] Not started | 6-8 questions written and categorized | Day [X] |
| Logistics | [ ] Not started | Tech tested / route confirmed, outfit ready | Day [X] |
| Mental Readiness | [ ] Not started | Mock interview completed, protocol practiced | Day [X] |

---

### Crash Plan (2-Hour Emergency Prep)

Use this if your schedule collapses and you have only one session before the interview.

**Priority 1 -- Company Context (30 min)**
- Read the company About and Product pages. Write 3 sentences: what they do, who they serve, how they make money.
- Read one recent news item (funding, launch, leadership change).

**Priority 2 -- STAR Stories (30 min)**
- Write 2 STAR stories: one demonstrating impact/achievement, one demonstrating problem-solving.
- Practice each aloud once. Target: under 90 seconds each.

**Priority 3 -- Role Questions (20 min)**
- Review the job description and prepare to answer: "Tell me about yourself" (60 seconds, tailored to this role) and "Why this company?" (30 seconds, using the research above).

**Priority 4 -- Questions to Ask (15 min)**
- Write 3 questions: one about the role's success metrics, one about team dynamics, one about company direction.

**Priority 5 -- Logistics (15 min)**
- Confirm interview time and link or location. Test your camera and microphone. Set your alarm with a 30-minute buffer.

**Priority 6 -- Mental Reset (10 min)**
- Write down 3 specific professional accomplishments. Practice 1 round of box breathing.
```

---

## Rules

1. **Always produce a dated, day-by-day plan -- never a list of topics to cover.** "Prepare your STAR stories" is not a task. "Write and time 4 STAR stories covering leadership, conflict, data-driven decision, and failure/recovery -- targeting 90 seconds each" is a task. Every task must be specific enough that a stranger could execute it without clarification.

2. **Respect the stated daily time budget strictly.** If the user says 1 hour per day, assign a maximum of 60 minutes of tasks per day. Do not sneak in extra tasks with optimistic time estimates. Overloaded plans cause abandonment -- an abandoned plan is worse than a modest plan completed.

3. **Research always precedes answer preparation.** Never schedule STAR story drafting before the research day is complete. STAR stories that are tailored to a specific company's values, product challenges, and stated strategic priorities are meaningfully stronger than generic STAR stories. The sequencing enforces quality.

4. **The day before the interview is rest and confirmation only.** Maximum 30-40 minutes of activity, all review of existing material -- no new preparation. Candidates who cram the night before consistently underperform due to heightened anxiety and fatigue. State this rule explicitly in the plan with the reasoning.

5. **Every plan must include at least one session of oral practice.** Reading answers silently does not develop interview fluency. Answering questions aloud -- ideally recorded -- reveals verbal tics, filler word frequency, answer length, and clarity. Even one 30-minute recorded practice session produces measurable improvement in delivery.

6. **The number of STAR stories must match role level.** Entry level: 4-5 stories. Mid-level: 6-7 stories. Senior/manager: 8-10 stories. Executive: 10-12 stories, with emphasis on organizational-scale impact. Providing too few stories for a senior candidate is a preparation gap; providing 10 stories to an entry-level candidate is cognitive overload.

7. **Include a type-specific technical supplement for any non-purely-behavioral interview.** Product interviews need a product critique task. Technical interviews need coding practice tasks. Case interviews need full practiced cases aloud. Mixed interviews need both behavioral and domain-specific preparation scheduled on separate days to prevent cognitive spillover.

8. **Always include a crash plan.** Every plan output, regardless of prep window length, includes a crash plan section. Even users with 14 days of prep can face unexpected schedule compression. The crash plan also functions as a priority signal -- it tells the user which activities matter most.

9. **Logistics tasks must appear twice:** once on Day 1 (confirm details, add to calendar) and once the day before (re-confirm everything, test everything, lay out everything). Single-point logistics confirmation is insufficient -- details change, links expire, calendars get corrupted.

10. **Never include motivational filler.** Phrases like "You've got this!", "Believe in yourself!", and "Trust your preparation!" have no instructional value and dilute the plan's authority. Mental readiness is addressed through specific, evidence-backed tasks (wins journal, box breathing, power posture, visualization) -- not generic encouragement.

11. **Scale STAR story coverage to cover likely question categories, not to cover every possible question.** For a 5-day prep window, 6-7 stories covering: leadership/influence, conflict or difficult conversation, data-driven decision, failure/learning, cross-functional collaboration, and highest achievement, covers approximately 85% of behavioral question space. Attempting 15+ stories in limited time reduces quality across all stories.

12. **Flag incomplete input and ask before generating.** If the user does not provide interview type, format, or role level, ask before generating. A behavioral plan given to a case interview candidate wastes their preparation time. One clarifying question produces a dramatically more useful output than a generic plan.

---

## Edge Cases

**The user has 24 hours or less before the interview:**
Activate the crash plan as the primary plan. Do not generate a multi-day schedule that begins in the past. Acknowledge the time constraint directly and reframe: two to three hours of focused, high-leverage preparation consistently outperforms scattered all-day cramming. Sequence strictly by impact: company context first, then 2 STAR stories, then tech/logistics check, then 3 questions to ask. Explicitly tell the user NOT to attempt new material after 9 PM -- rest is now more valuable than information.

**The user has multiple interviews at different companies in the same week:**
Build a two-layer plan: a shared preparation base layer and company-specific modules for each interview. The base layer (built on Days 1-2) covers: core STAR stories that work across roles, "tell me about yourself" narrative, and logistical defaults. Company-specific modules (each 60-90 minutes) cover: company research one-pager, tailored STAR story angles, and questions to ask. Schedule company-specific modules 1-2 days before each respective interview, not all at once. Explicitly warn the user against over-preparation -- 3+ hours per company per day across a week causes performance degradation from exhaustion.

**The user is making a significant career change (different industry or function):**
Extend the research pillar substantially. Add a "vocabulary acquisition" task: identify 15-20 domain-specific terms in the target field and practice using them in natural sentences. Add a "transferable skills mapping" task: for each job requirement, write a specific prior example that demonstrates the same underlying skill in a different context. Frame STAR stories explicitly around transferable competencies (analytical thinking, stakeholder management, team leadership) rather than industry-specific expertise. This framing is more persuasive to interviewers evaluating a career changer than claiming equivalent experience.

**The user has a full-day on-site with 5+ interview rounds:**
This requires energy management preparation, not just content preparation. Include: a "round-by-round strategy" section identifying what each interviewer likely cares about (HR = culture fit and compensation, hiring manager = impact and alignment, technical peers = competence and collaboration, skip-level = strategic thinking and ambition, recruiting coordinator = logistics and professionalism). Include an "energy management" task: plan the lunch break as a recovery window, not a networking opportunity. Bring a pocket reference card (index card) with 3 talking points, 2 questions per interviewer type, and the company one-pager headline -- review it between rounds. Have a physical reset routine: 3 deep breaths and a shoulder roll before each new room or call.

**The user has significant interview anxiety that is affecting preparation:**
Address this as a preparation problem, not a character problem. Add these specific tasks: (1) a 5-day box breathing practice schedule starting immediately -- the physiological calming effect of slow breathing requires practice to activate reliably under stress; (2) a visualization session: 10 minutes imagining the interview going well in specific detail (not generic success -- specifically imagine answering a question smoothly, the interviewer nodding, yourself feeling clear and calm); (3) a "what's the worst realistic outcome" task -- write it down and then write the path back from it. Most candidates catastrophize; naming the realistic worst case (do not get the job, continue the search) reduces its unconscious power. Do not schedule high-intensity preparation on the night before -- this is especially important for anxious candidates.

**The user is preparing for a highly structured process (e.g., McKinsey, Google FAANG loop, investment banking superday):**
These processes have known formats with well-documented expectations. Name the specific preparation required explicitly: for McKinsey -- personal experience interviews (PEI) require 3 flagship stories (leadership, personal impact, entrepreneurial drive) practiced to extreme polish, plus 4+ full case practices daily; for FAANG technical -- LeetCode preparation at medium/hard difficulty with daily consistency over weeks, plus 2-3 full system design practices per week; for IB superday -- technical finance questions (DCF, LBO, merger model mechanics), market awareness (current deal flow, rate environment), and 3 "why banking, why this bank, why this group" narratives aligned to each interviewer. Generic prep plans are insufficient for these processes -- flag this to the user and recommend supplemental resources.

**The user completes the plan but reports feeling unprepared the night before:**
Do not encourage additional cramming. Ask what specifically feels unready. If it is a content gap (a missing STAR story, uncertainty about a technical topic) -- address the single most important gap only (30 minutes maximum). If it is anxiety rather than an actual content gap -- redirect to the mental readiness protocol. A candidate who has completed a full preparation plan and feels unprepared the night before is almost always experiencing performance anxiety, not an actual preparation deficit. The correct response is box breathing, wins journal, and sleep -- not more preparation.

---

## Example

**Input:**
"I just got a Product Manager interview at a mid-size B2B SaaS company -- they build project management software for professional services firms. The interview is next Wednesday at 2 PM EST, so I have 6 days. It's a virtual interview with the hiring manager. They told me it will be a mix of behavioral questions and product questions -- specifically product sense and prioritization. The role is a senior PM. I can do about 1.5 hours per day, maybe 2 on the weekend."

---

**Output:**

## Interview Preparation Plan

**Interview:** Senior Product Manager at [B2B SaaS Company -- Project Management Software]
**Interview Date:** Wednesday, [Date], 2:00 PM EST
**Format:** Live Video -- Hiring Manager
**Type:** Mixed (Behavioral + Product Sense + Prioritization)
**Role Level:** Senior (expect answers that demonstrate organizational impact and PM leadership, not just execution)
**Prep Window:** 6 days (today is Thursday)
**Daily Time Available:** 1.5 hours weekdays / 2 hours weekend days
**Prep Tier:** Standard

---

### Day-by-Day Preparation Plan

---

**Day 1 -- Thursday -- PRIMARY FOCUS: Research**

Goal: By end of day, you can explain this company's business, product, and strategic position in 90 seconds without notes.

- [ ] Read the company website: homepage, product pages, About, Customers/Case Studies, and Careers page. Note: who is the target customer (professional services firms -- law firms? consulting firms? agencies?), what specific pain does the product solve, and how it is priced/sold. (35 min)
- [ ] Search for recent company news: funding rounds, product announcements, executive hires, awards, or press coverage from the last 12 months. Write 2 bullet points on the most interesting findings. (15 min)
- [ ] Research the hiring manager on LinkedIn: note their career background, how long they have been at the company, what they post about, and any shared connections or interests. Write 2 sentences. (10 min)
- [ ] Write a company one-pager (1 page, bullet format): (1) what they do and who they serve, (2) how they make money, (3) their product's core value proposition vs. competitors (Asana, Monday.com, ClickUp, Notion -- how is this product different for professional services specifically?), (4) recent notable development, (5) stated mission or values from the website. (25 min)

**Checkpoint:** Read your one-pager aloud. Can you answer "What does this company do?" in 60 seconds and "Why do you want to work here?" in 45 seconds using only this material?

---

**Day 2 -- Friday -- PRIMARY FOCUS: Behavioral Answer Preparation**

Goal: Seven STAR stories drafted, each with a quantified result, covering the behavioral question categories most likely for a Senior PM role.

- [ ] Draft STAR stories for the following 4 topics -- write each in bullet outline, not full sentences. Target length when spoken: 75-90 seconds. (60 min total, ~15 min each):
  - Story 1: A product decision you made using data that led to measurable improvement (ties to "tell me about a time you used data to influence direction")
  - Story 2: A time you influenced without authority -- cross-functional stakeholder alignment (engineering, design, sales, or customers)
  - Story 3: A product failure or significant setback -- what happened, what you owned, what you changed (Senior PMs are expected to own failures, not deflect them)
  - Story 4: A time you made a prioritization decision under competing demands or limited resources
- [ ] For each story, identify the quantified result -- the metric that proves the outcome. If you do not have a hard number, use a directional proxy: "reduced time-to-value by approximately 30%", "increased NPS from 32 to 47". Write it as the final sentence of each story. (15 min)
- [ ] Practice Story 1 aloud once, timing yourself. Note: is it under 90 seconds? Is the result clear at the end? (10 min)

**Checkpoint:** You have 4 STAR stories with quantified results in bullet outline form. Story 1 has been spoken aloud at least once.

---

**Day 3 -- Saturday -- PRIMARY FOCUS: Product Answer Preparation**

Goal: You can answer the three most common Senior PM product questions for this specific company using structured frameworks.

- [ ] Prepare your answer to "How do you prioritize a roadmap?" -- use a framework you can articulate clearly (RICE: Reach x Impact x Confidence / Effort; ICE: Impact x Confidence x Effort; or a value/effort 2x2). Write your framework, then apply it to a real example from your experience. (25 min)
- [ ] Prepare a product critique of this company's product. Use their actual product -- if you can sign up for a trial, do so. Identify: (a) what is working well and why, (b) one specific user pain point or friction in the product, (c) your prioritized recommendation and the reasoning. Frame this as "I had a chance to look at your product, and here is what I noticed..." -- this demonstrates initiative and product instinct simultaneously. (35 min)
- [ ] Prepare your answer to "Walk me through a product you launched from 0 to 1" or "Tell me about a product initiative you led." This is different from a STAR story -- it should include: the problem, your discovery process (how you validated the problem), the solution you chose and why, how you worked with engineering and design, how you measured success, and what you learned. Practice this at a 3-4 minute depth since it is commonly an extended question. (20 min)
- [ ] Draft 3 additional STAR stories (for a total of 7): (5) a cross-functional collaboration success, (6) your highest-impact PM achievement, (7) a time you changed your mind based on customer or user feedback. Bullet outline only -- you do not need to practice these aloud today. (20 min)

**Checkpoint:** You have a framework answer for prioritization with a real example, a product critique of the company's product, and 7 STAR stories total in outline form.

---

**Day 4 -- Sunday -- PRIMARY FOCUS: Questions to Ask + Practice Session**

Goal: Your 7 questions to ask are written and categorized, and you have completed one full mock interview aloud.

- [ ] Write 7-8 questions to ask the hiring manager, organized into three tiers: (25 min)
  - Role-specific (2-3): "How is success measured for this PM in the first 90 days?" / "What does the roadmap planning process look like -- who has input and how are tradeoffs resolved?" / "What is the biggest product challenge this team is working through right now?"
  - Strategic (2-3): "Where is this product headed over the next 12-18 months?" / "How does the product team work with the sales and customer success teams given the B2B model?"
  - Culture/hiring manager (2): "What do the PMs who have been most successful here have in common?" / "What made you join this company, and what has kept you here?"
- [ ] Set a 45-minute timer and do a complete mock interview aloud -- record yourself on your phone. Answer these questions as if in the real interview: (1) Tell me about yourself, (2) Why this company?, (3) Walk me through your prioritization framework, (4) Tell me about a time you made a data-driven product decision, (5) Tell me about a product failure and what you learned. (45 min)
- [ ] Watch 5-10 minutes of the recording. Note: one thing to improve (too long? too many "um"s? result not clear?) and one thing that is strong. Do not watch the whole thing -- targeted review is sufficient and less demoralizing. (10 min)

**Checkpoint:** 7-8 questions written. One full mock interview on record. You have identified one specific improvement to address in the next practice.

---

**Day 5 -- Monday -- PRIMARY FOCUS: Refinement + Catch-Up**

Goal: Fix the one thing you identified in the mock review. Fill any remaining prep gaps. No new categories of work.

- [ ] Address the improvement identified from Sunday's mock recording. If you spoke too long, re-practice those answers with a 90-second hard stop. If results were not clear, revise those STAR story outlines to put the result sentence last. (20 min)
- [ ] Practice answering 3 questions from the hiring manager's likely perspective -- what would a B2B SaaS hiring manager at a professional services-focused company care most about? (customer retention, enterprise sales cycles, complex stakeholder environments, technical integrations). Practice 2-3 answers that connect your experience specifically to these themes. (30 min)
- [ ] Review your 7 STAR stories. Read each outline. Circle any that still have weak or vague results. Fix those results now -- before the next practice. (20 min)
- [ ] Prepare your "tell me about yourself" answer. This is a 60-second career narrative structured as: current role and context (10 sec), most relevant prior experience (20 sec), specific accomplishment most relevant to this role (15 sec), and why this role/company now (15 sec). Write it out and practice it twice. (20 min)

**Checkpoint:** Your one improvement is addressed. "Tell me about yourself" is polished and under 60 seconds. No open preparation gaps -- everything has at least a bullet outline.

---

**Day 6 -- Tuesday -- PRIMARY FOCUS: Logistics + Light Review Only**

Goal: Everything is confirmed and ready. You will not learn anything new tonight. Rest is the priority.

- [ ] Re-confirm interview: check the calendar invite for the correct date, time (2:00 PM EST), meeting link, and interviewer's name. If you have not received a link, email or message the recruiter now. (5 min)
- [ ] Test your full tech setup: launch the video platform (Zoom/Teams/Meet), test camera framing (eye level, not looking up or down), test microphone clarity, check background (clean or virtual), check internet connection stability. Have your phone with the dial-in number as a backup. (15 min)
- [ ] Set up your physical environment: identify your chair and desk, place a glass of water, have a notepad and two pens, have your printed questions-to-ask list face-up on the desk. (10 min)
- [ ] Read your company one-pager once. Do not edit it -- just read. (10 min)
- [ ] Read the headlines of your 7 STAR stories once -- just the topic and the result. Do not drill them. (10 min)
- [ ] Set two alarms for tomorrow morning: primary and backup, both 30 minutes earlier than you think you need. (5 min)
- [ ] Evening free. Target sleep by 10:30 PM. No new prep.

**Checkpoint:** Tech works. Everything physical is ready. You have not opened any new preparation material. You feel prepared, not perfect.

---

**INTERVIEW DAY -- Wednesday, [Date], 2:00 PM EST**

Morning Protocol:
- [ ] Wake by 11:30 AM (2.5 hours before interview) (0 min)
- [ ] 10-minute walk outside or light movement (10 min)
- [ ] Protein-based meal by 12:00 PM -- no caffeine overload, no heavy meal (20 min)
- [ ] Read company one-pager and the 3 STAR story headlines you are most confident in -- nothing else (15 min)
- [ ] Log in to the video platform by 1:45 PM (10 min early) (5 min)
- [ ] 1:50-1:58 PM: 2 rounds of box breathing (4-count in, hold, out, hold) + 60-second power posture (8 min)
- [ ] Join the call at 1:58-2:00 PM

**Have Ready on Your Desk:**
- [ ] Notepad and 2 pens
- [ ] Printed questions-to-ask list (7-8 questions)
- [ ] Water
- [ ] Phone with meeting dial-in as backup
- [ ] Nothing else on screen except the video call

**Mindset:** You have researched this company, built real answers, and practiced aloud. This is a conversation to determine mutual fit -- you are evaluating them as much as they are evaluating you. Curiosity, not audition.

---

### Preparation Tracker

| Pillar | Status | Key Deliverable | Target Day |
|---|---|---|---|
| Research | [ ] Not started | Company one-pager (one page, written) | Day 1 -- Thursday |
| Answer Prep -- Behavioral | [ ] Not started | 7 STAR stories with quantified results | Days 2 + 3 |
| Answer Prep -- Product | [ ] Not started | Prioritization framework + product critique + launch narrative | Day 3 |
| Questions to Ask | [ ] Not started | 7-8 questions in three tiers | Day 4 |
| Practice | [ ] Not started | Mock interview recorded, one improvement applied | Days 4 + 5 |
| Logistics | [ ] Not started | Tech tested, environment set, alarms set | Day 6 |
| Mental Readiness | [ ] Not started | Morning protocol followed, box breathing practiced | Day 5 + Day 6 evening |

---

### Crash Plan (2-Hour Emergency Prep)

Use this if a work emergency or illness collapses your preparation window.

**Priority 1 -- Company Context (30 min)**
Read the company website About and product pages. Write 3 sentences: what they build, who buys it (professional services firms), and why the product is differentiated. Find one recent news item.

**Priority 2 -- STAR Stories (30 min)**
Write 2 stories in bullet outline: (1) your highest-impact product achievement with a quantified result, (2) a prioritization decision you made under competing demands. Practice each aloud once.

**Priority 3 -- Product Questions (20 min)**
Prepare to answer: "How do you prioritize a roadmap?" (state your framework in one sentence, then apply it to a real example). Prepare one observation about the company's product that demonstrates you have looked at it.

**Priority 4 -- Questions to Ask (15 min)**
Write 3 questions: "How is success measured for this PM in the first 90 days?" / "What is the biggest product challenge you are working through right now?" / "What do the most effective PMs at this company have in common?"

**Priority 5 -- Logistics (15 min)**
Confirm interview time, link, and interviewer name. Test camera, microphone, and background. Set alarm with 30-minute buffer.

**Priority 6 -- Mental Reset (10 min)**
Write down 3 specific product accomplishments you are proud of. Complete 2 rounds of box breathing. Then stop preparing and rest.
