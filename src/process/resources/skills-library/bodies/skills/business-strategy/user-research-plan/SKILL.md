---
name: user-research-plan
description: |
  Creates user research plans with research questions, methodology selection, participant criteria, discussion guide outlines, and analysis frameworks using UX research methodology. Use when the user asks about user research, UX research, usability testing, user interviews, customer research, or research planning.
  Do NOT use for customer discovery interviews for startups (use customer-discovery-interview), employee surveys (use employee-survey), or market research briefs (use market-research-brief).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "research planning analysis strategy decision-making"
  category: "business-strategy"
  subcategory: "product-management"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# User Research Plan

## When to Use

**Use this skill when:**
- A user needs to design a structured UX or user research study before making a product decision -- for example, before committing to a feature redesign, a new onboarding flow, or a navigation overhaul
- A user wants to understand why a behavior is occurring in product analytics (drop-off, low adoption, support volume spikes) and needs a qualitative investigation to explain the quantitative signal
- A user is evaluating whether an existing design, prototype, or workflow works well enough to ship -- they need evaluative research, not generative discovery
- A user needs to select the right research method from a set of options and understand the trade-offs (interviews vs. surveys, moderated vs. unmoderated usability testing, diary studies vs. contextual inquiry)
- A user is preparing for a research sprint and needs a complete plan including participant criteria, a discussion guide or test protocol, logistics, and analysis framework
- A user wants to communicate a research plan to stakeholders, a recruiting agency, or a research ops team and needs a professional, structured document
- A user is building out a research program from scratch and needs to understand how to sequence methods over time

**Do NOT use this skill when:**
- The user needs to validate whether a new product concept solves a problem for a market segment that does not yet exist as customers -- use `customer-discovery-interview` instead, which follows a different hypothesis-driven discovery methodology appropriate for early startups
- The user wants to measure employee sentiment, engagement, or culture -- use `employee-survey`, which requires anonymity design, HR compliance, and benchmark comparisons not addressed here
- The user is asking for market sizing, competitive positioning, or buyer persona research based on secondary data -- use `market-research-brief`, which covers desk research and market analysis
- The user wants to design a controlled experiment comparing two variants with statistical significance -- use `ab-test-design`, which covers power calculations, randomization, and inferential statistics; UX research is not the right framework for that
- The user is asking how to write a specific survey instrument in detail -- this skill covers surveys at the plan level only; a dedicated survey design skill handles question wording, response scales, and bias prevention at depth
- The user needs NPS analysis or customer satisfaction benchmarking -- those are specific measurement programs, not generative or evaluative research studies

---

## Process

### Step 1: Clarify the Research Purpose and the Decision It Must Inform

Before writing a single question, establish why this research is being conducted and what specific decision it will unlock. This prevents research from becoming an academic exercise that produces no action.

- Ask: "What decision is on the table, and who will make it?" Research that does not change a decision or reduce its uncertainty is not worth the cost. The decision owner should be named at the start of the plan.
- Ask: "What is the deadline for the decision?" This constrains the timeline and method selection. If a decision must be made in 3 weeks, a 6-week diary study is not viable.
- Ask: "What do we already know?" Audit existing data sources: product analytics (funnels, retention curves, session recordings), customer support tickets, NPS verbatims, sales call notes, prior research reports. Do not design research to re-learn things that are already documented.
- Ask: "What assumption is most dangerous right now?" The most valuable research tests the assumption that, if wrong, would most damage the product direction. Name it explicitly.
- Classify the research type:
  - **Generative (discovery):** Learning about user needs, behaviors, contexts, and mental models before a solution exists. Questions begin with "how" and "why." Example: "How do freelance designers currently manage client feedback on deliverables?"
  - **Evaluative (testing):** Assessing how well an existing design, prototype, or feature works. Questions center on task performance and usability. Example: "Can users successfully configure a recurring billing rule without assistance?"
  - **Descriptive (measurement):** Quantifying how widespread a behavior or attitude is. Example: "What percentage of active users have set up an integration in the past 90 days?"
- Write the primary research question as a single, open-ended sentence. A good research question cannot be answered with "yes" or "no." It cannot be answered with existing analytics data alone. It will be meaningfully answered within the planned timeline.

---

### Step 2: Select the Research Method

Method selection is a matching problem: the method must fit the research question type, the available timeline, the budget, and the stage of the product. There is no universally "best" method.

**Generative methods:**
- **Semi-structured user interviews:** The most versatile generative method. Use when you need to understand user goals, mental models, workflows, frustrations, and decision-making. Sessions are 45-60 minutes, conducted 1:1 with a researcher. Ideal sample: 5-8 participants per distinct user segment. Saturation -- the point at which additional sessions produce no new themes -- typically occurs at 5-7 in a homogeneous population, 8-12 across heterogeneous segments. Do not conduct fewer than 5; do not conduct more than 12 without a clear reason (complex product domain, multiple very distinct segments).
- **Contextual inquiry:** Observation in the user's real environment while they perform authentic tasks. Use when the work context is critical to understanding behavior -- logistics workers, field technicians, clinical staff. More time-intensive than interviews (2-4 hours per participant) but reveals workarounds, environmental constraints, and team dynamics that interviews miss. Sample: 4-6 participants.
- **Diary studies:** Participants self-report experiences over time (days or weeks) via prompted journaling, photo uploads, or short video clips. Use for behaviors that are episodic, longitudinal, or private -- financial decisions, health tracking, travel planning. Tools: Dscout, Indeemo, or structured WhatsApp/email prompts. Sample: 10-20 participants over 1-4 weeks. High dropout risk; overrecruit by 30%.
- **Participatory design / co-design sessions:** Users actively help design solutions, often using card sorting, journey mapping, or concept sketching exercises. Use when you want to generate solution ideas directly from users, not just diagnose problems. Sample: 6-10 participants in workshop format.

**Evaluative methods:**
- **Moderated usability testing:** A facilitator guides participants through tasks on a prototype or live product while observing and probing their behavior aloud. The gold standard for identifying usability issues. Sample: 5 participants per design variant is the Nielsen-Landauer threshold -- statistically, 5 participants expose approximately 85% of the most severe usability problems. For complex enterprise software, aim for 7-8. Session length: 45-75 minutes.
- **Unmoderated usability testing:** Participants complete tasks asynchronously using tools like UserTesting, Maze, or Lookback. Faster (results in 24-48 hours) and cheaper, but you cannot probe unexpected behavior. Use for straightforward tasks with clear success criteria. Sample: 15-30 participants to compensate for lower data quality per session.
- **First-click testing:** Participants click where they would first navigate to accomplish a task on a static screenshot. Rapid, low-cost evaluation of navigation and label clarity. Tools: Chalkmark, Optimal Workshop. Sample: 30-50 participants. Use specifically for navigation, IA, or CTA placement decisions.
- **Tree testing:** Evaluates information architecture by asking participants to find items in a text-only hierarchy, without visual design cues. Use before committing to a navigation redesign. Tools: Treejack, Optimal Workshop. Sample: 50+ participants for statistical confidence.

**Descriptive / mixed methods:**
- **Survey with open-text questions:** Use when you need to quantify prevalence of behaviors or attitudes identified in qualitative research, or when you need to segment responses by user demographic. Effective sample depends on the population size and desired confidence interval. For a product with 50,000 active users, 384 responses gives ±5% confidence at 95%. Use closed-ended scales (Likert, frequency, semantic differential) for quantitative data; include 1-2 open-text questions for qualitative texture. Tools: Typeform, SurveyMonkey, Google Forms.
- **Mixed methods (sequential):** The most rigorous and actionable approach for complex questions. Conduct qualitative interviews first (generative), then use findings to inform a survey (descriptive). Alternatively, conduct a survey to identify patterns, then use interviews to explain the "why" behind quantitative signals. The sequence matters: interviews before surveys generates better survey questions; surveys before interviews identifies which patterns are worth exploring.

**Decision matrix for rapid method selection:**

| Research question type | Timeline | Budget | Recommended method |
|------------------------|----------|--------|--------------------|
| Understand user goals/context | 3-4 weeks | Medium | Semi-structured interviews |
| Evaluate a prototype | 1-2 weeks | Low-medium | Moderated usability test |
| Evaluate a live feature quickly | 3-5 days | Low | Unmoderated usability test |
| Understand IA or navigation | 1 week | Low | Tree testing or card sorting |
| Quantify known issues | 2-3 weeks | Low | Survey |
| Longitudinal behavior patterns | 4-8 weeks | High | Diary study |
| Complex decision, high stakes | 5-8 weeks | High | Mixed methods (interviews + survey) |

---

### Step 3: Define Participant Criteria

Recruiting the right participants is the single factor that most determines research quality. Incorrect participants produce confident but misleading findings.

- **Behavioral criteria are more important than demographic criteria.** Age and gender are weak proxies for product relevance. The behaviors that make someone a representative research participant are: how they currently solve the problem the product addresses, how frequently they use the product (or similar products), and what role they play in the decision to use or buy the product. Define these behavioral criteria first.
- **Write an explicit screening questionnaire.** Recruiting by job title or email segment alone produces inconsistent results. A screener questionnaire of 5-10 questions filters out unqualified candidates before you spend time scheduling. Key screener sections:
  - Behavioral qualification questions: "How often do you [relevant behavior] in a typical week?" (answer choices that reveal qualification level)
  - Disqualifying conditions: employees of your company, competitors, research agencies, people who have participated in product research in the past 6 months
  - Diversity markers: ensure the sample includes people across relevant experience levels, use contexts, and -- if relevant to the research -- device types or access patterns
- **Define segments explicitly if comparing groups.** If comparing new users vs. power users, define each segment with quantitative criteria from your product data. For example: "New users = signed up 7-30 days ago and have logged in at least 2 times. Power users = active at least 15 days in the past 30 days and have used 3+ core features."
- **Set minimum and maximum sample sizes per segment before recruiting begins.** This prevents over-recruiting a segment that is easy to find and under-recruiting one that is hard to find.
- **Incentive calibration:** Participant incentives should reflect the session length and the income opportunity cost of the participant's time. General benchmarks: $50-75 for 45-minute consumer sessions, $100-150 for 60-minute sessions with professional or B2B participants, $150-250 for enterprise or executive participants. Never use product credits as the sole incentive for non-customers -- they have no value. Never offer incentives contingent on completing tasks successfully (this biases behavior).
- **Recruitment sources in priority order:** (1) Recruited from your own user base via in-app prompt or CRM email -- highest validity because they are real users; (2) Recruiting panel services (User Interviews, Respondent.io, Prolific) -- fast but participants may be "professional respondents" who do not represent your actual users; (3) Social media or community recruitment -- inexpensive but screening quality is harder to control; (4) Personal or colleague networks -- lowest cost but high risk of acquaintance bias where participants tell you what they think you want to hear.

---

### Step 4: Design the Discussion Guide or Test Protocol

The discussion guide is the primary instrument of the research. Its quality determines whether sessions produce insight or noise.

**For semi-structured interviews:**
- Structure: Opening and consent (5 min) -> Warm-up and context setting (5-10 min) -> Core exploration section (25-35 min) -> Specific topic probes or concept reactions (10-15 min) -> Wrap-up and open floor (5 min). Total: 45-60 minutes.
- Write 8-12 primary questions for a 60-minute interview. You will use 6-8. Having more allows flexibility.
- **The TEDW probe framework:** After every primary question, use: Tell me more about that. Explain what you mean. Describe what that was like. Walk me through exactly what happened. These four probes work in almost every context and train researchers to pursue depth.
- Begin the core section with **grand tour questions**: broad, open invitations to describe a process from beginning to end. "Walk me through the last time you [relevant behavior] -- from the moment you started to when you finished." Grand tour questions reveal the full workflow and natural stopping points before you ask targeted questions.
- Move from grand tour to **mini-tour questions** that zoom in on specific steps revealed in the grand tour: "You mentioned you had to check with your manager before approving that -- tell me more about that step."
- Avoid hypothetical questions ("Would you use this feature?"). Users consistently overestimate their own future behavior. Replace with experience-based questions: "Describe the last time you needed to do [X]. How did you handle it?" Hypotheticals are only valid when combined with a concrete prototype to react to.
- Write a short "context memo" at the top of the guide: the research question, the decision it informs, and two or three hypotheses you are testing. This is for the researcher's eyes only and helps them pursue relevant threads in the conversation.

**For moderated usability tests:**
- Structure: Introduction and consent (5-8 min) -> Warm-up questions about the participant's context (5 min) -> Task scenarios (20-40 min) -> Post-task debrief questions (5-10 min) -> Overall debrief (5 min). Total: 45-75 minutes.
- Write task scenarios as realistic situations, not instructions. Bad: "Click on the settings menu and change your notification preferences." Good: "Imagine you've been getting too many email notifications from this app and you want to reduce them. Show me what you would do." The scenario provides motivation and context without revealing the answer.
- Include a success criterion for every task before the test runs. Success criteria can be: binary (did they complete the task or not?), path-based (did they use the expected flow, or an alternative?), or confidence-based (self-reported ease on a 1-7 Likert scale post-task).
- Use the **think-aloud protocol**: ask participants to narrate what they are looking at, what they are thinking, and what they expect to happen as they work. Introduce this in the warm-up and model it yourself. Think-aloud produces the richest data but feels unnatural to participants at first -- budget 3-5 minutes to practice before the first task.
- Post-task questions after each scenario: "How difficult was that, on a scale of 1 to 7, where 1 is very easy and 7 is very difficult?" and "Was there anything confusing or unexpected?" These anchor qualitative observations with a quantifiable severity signal.
- After all tasks, ask: "If this were your own tool and you could change one thing about what you just used, what would it be?" This often surfaces the most actionable single finding.

**For unmoderated tests:**
- Write task scenarios with even more precision because there is no researcher to clarify ambiguity. Every scenario must be self-contained and unambiguous.
- Set screen recording and audio recording on.
- Include a brief pre-test screener within the tool (e.g., Maze, UserTesting) to filter out unqualified respondents who slipped through recruitment.
- Limit to 3-5 tasks maximum. Completion rates drop sharply after 20 minutes for unmoderated sessions.

**Universal discussion guide rules:**
- Never include the research hypothesis or the "right answer" in any question.
- Sequence questions from broadest to narrowest (funnel structure). Opening with specific questions puts participants on the defensive.
- Include a "what else" question at the close of every major section: "Is there anything about [this topic] that you think I should understand that we haven't talked about yet?" This question consistently surfaces the most surprising findings.
- Time every section and write the time budget next to each section header. Over-running one section means skipping another. The researcher must manage time actively.

---

### Step 5: Plan Research Logistics

Poor logistics cause research to fail for reasons entirely unrelated to the quality of the plan. Execute logistics systematically.

- **Timeline template:**
  - Week 1: Finalize research plan, write screener, set up recruitment campaign, schedule sessions
  - Week 2: Recruitment open, conduct first 2-3 sessions (run pilot, debrief, refine guide if needed)
  - Week 3: Complete remaining sessions
  - Week 4: Analysis and synthesis
  - Week 5 (days 1-3): Draft report and recommendations
  - Week 5 (days 4-5): Share and debrief with stakeholders
  - Total: 5 weeks for a rigorous 6-8 person interview study. Compress where needed by running recruitment and early sessions in parallel.
- **Pilot session:** Always conduct one pilot session before the main study. Use a colleague, a trusted user, or an internal volunteer. Pilots catch ambiguous questions, broken prototype links, recording failures, and timing errors. The pilot is not counted in the final sample.
- **Session format decisions:**
  - Remote via video call (Zoom, Teams, Google Meet with screen share): most scalable, widest geographic reach, works for most product types
  - In-person: necessary for physical product research, contextual inquiry, or populations with limited tech access; higher cost and logistics burden
  - Unmoderated async: fastest, lowest cost, no researcher time during sessions; best for simple task evaluation, worst for nuanced discovery
- **Recording and consent protocol:**
  - Always send a consent form before the session, not during. Participants who have not pre-read the consent form feel ambushed.
  - Record audio + video + screen by default. Transcripts generated from recordings (using Otter.ai, Rev, or Grain) accelerate analysis dramatically.
  - Store recordings in a secure, access-controlled location. Do not upload participant recordings to general shared drives.
  - In B2B research, check with legal whether enterprise client NDAs require additional consent language.
- **Note-taking protocol:** Assign a dedicated note-taker (separate from the researcher/facilitator) for every moderated session. The researcher who is also taking notes misses participant behavior while typing. Notes should capture: exact quotes (in quotation marks), observed behaviors (what the participant did, not just said), and emotional signals (hesitation, frustration, delight).
- **Observer management:** Stakeholders attending sessions benefit enormously from watching real users, but unmanaged observers create problems. Send observers a one-page briefing before the session that includes: the research question, the session format, the rules (camera off, microphone muted, no side conversations), a question submission channel (Slack DM to the researcher), and the post-session debrief time.

---

### Step 6: Define the Analysis Approach

Analysis must be planned before data collection begins. If the analysis method is defined after the data is collected, unconscious confirmation bias shapes which findings receive emphasis.

**Thematic analysis for qualitative data (interviews, open-text):**
1. **Transcription:** Generate verbatim transcripts from recordings. AI transcription tools (Grain, Otter.ai, Rev) produce 80-90% accurate transcripts; always review and correct before coding.
2. **First-pass reading:** Read all transcripts once before coding to develop familiarity with the data as a whole. Note initial impressions but do not assign codes yet.
3. **Open coding:** Read transcripts again and tag segments of text with descriptive labels (codes) that capture what the participant is saying or doing. Use participants' own language when possible -- these "in vivo" codes are closer to the actual experience. Tools: Dovetail, Reframer, Airtable, or sticky notes in Miro/FigJam.
4. **Axial coding / theme development:** Group related codes together. Look for codes that cluster around a common idea. A theme is not a topic (e.g., "navigation") -- it is a finding (e.g., "users navigate by memory, not labels, after the first session").
5. **Frequency annotation:** For each theme, record how many participants expressed it. Do not report themes observed in only 1 participant as a pattern. Report themes as findings only when 3+ participants in a 6-8 person study surfaced the same theme.
6. **Negative case analysis:** Actively look for data that contradicts emerging themes. If 5 participants found the onboarding easy and 2 found it confusing, the 2 are important data points that qualify the finding, not noise to discard. Report contradictions honestly.
7. **Team affinity synthesis:** If multiple researchers or stakeholders code independently, conduct an affinity session where codes are grouped collaboratively. This reduces individual researcher bias and increases confidence in themes.

**Usability issue analysis:**
- Rate each observed issue on a severity scale before aggregating across sessions:
  - Severity 1 (Critical): Prevents task completion. Fix before shipping.
  - Severity 2 (Serious): Causes significant delay, workaround required, high user frustration. Fix in near-term.
  - Severity 3 (Moderate): Causes confusion but task is eventually completed. Address in next iteration.
  - Severity 4 (Minor): Cosmetic or low-friction issue. Nice to fix but not blocking.
- Calculate: task success rate (% of participants who completed the task), average time on task, average error count per task, average post-task difficulty rating (1-7 scale).
- A task with a success rate below 70% is a critical usability problem requiring immediate redesign.

**Survey analysis:**
- For quantitative questions: calculate means, medians, and distributions per item. Do not report only means -- distributions reveal bimodal responses where the average is meaningless.
- Cross-tabulate by segment: compare new users vs. experienced users, mobile vs. desktop, role or plan tier. Differences between segments are often more informative than population-level averages.
- For open-text responses: use thematic analysis as above, but at lower depth. Identify the top 5-7 themes and report frequency as a percentage of respondents.

---

### Step 7: Plan the Output, Communication, and Action Integration

Research is only valuable if it changes decisions. Plan the output format and communication strategy before the research begins so stakeholders know what to expect and when.

- **Research report formats by audience:**
  - **1-page topline summary:** Distributed within 48 hours of the last session. Contains: research question, method, key findings (3-5 bullets), top recommendations (2-3 bullets). For stakeholders who need signal quickly without detail.
  - **Full findings report (10-20 pages or equivalent slide deck):** Contains: executive summary, background and methodology, detailed findings organized by theme with supporting quotes and frequency data, usability scorecard (for evaluative research), recommendations ranked by severity and effort, open questions for future research.
  - **Research repository entry:** A structured, searchable summary added to a shared research repository (Dovetail, Notion, Confluence) that future researchers can discover when planning related studies. Even if your team does not have a formal repository, a single well-organized folder with labeled recordings, transcripts, and a findings summary serves this purpose.
- **Translate findings to actionable formats:**
  - For design teams: annotated screenshots or prototype markups showing specific issues and recommended changes
  - For product teams: a prioritized list of insights mapped to existing backlog items or expressed as new user story candidates
  - For leadership: a decision memo that states what was learned, what it means for the strategic decision at hand, and a recommended path forward
- **Schedule a research readout session** with stakeholders before completing the report. Walking stakeholders through findings live, before sending the document, produces better engagement and allows stakeholders to ask clarifying questions that improve the quality of the final report.
- **Define follow-on research explicitly.** Every study surfaces questions it could not answer. Document these explicitly in the report as "open questions" so future research builds on this work rather than repeating it.

---

## Output Format

```
## User Research Plan: [Study Name]

### Research Overview

| Field | Detail |
|-------|--------|
| **Primary research question** | [One sentence, open-ended, not answerable by yes/no] |
| **Research type** | [Generative / Evaluative / Descriptive / Mixed] |
| **Decision this research informs** | [Specific product or strategy decision, with decision owner named] |
| **Decision deadline** | [Date by which the decision must be made] |
| **Primary method** | [Interview / Usability test / Survey / Card sort / Tree test / Diary study] |
| **Secondary method (if any)** | [Second method, rationale for combining] |
| **Total timeline** | [Start date to report delivery date -- X weeks] |
| **Lead researcher** | [Name or role] |
| **Stakeholders** | [Who will receive findings] |

---

### Background: What We Know and What We Need to Learn

**What we already know:**
- [Finding from analytics, prior research, or support data -- cite source]
- [Finding from analytics, prior research, or support data -- cite source]
- [Known assumption being carried into product decisions]

**Critical knowledge gaps (why this research is needed now):**
- [Specific question not answered by existing data]
- [Assumption that is currently untested and most dangerous if wrong]
- [Behavior or motivation that requires direct user input to understand]

**Hypotheses (for researcher reference only -- do not read to participants):**
- H1: [What we currently believe about the cause or behavior]
- H2: [Alternative explanation being tested]

---

### Participant Criteria

| Criterion | Specification |
|-----------|---------------|
| **Behavioral include** | [Specific behaviors that qualify someone -- not demographics] |
| **Demographic / contextual include** | [Role, product type, industry if relevant] |
| **Exclude** | [Employees, competitors, research agency workers, recent participants] |
| **Segment A** | [Name and definition with quantitative criteria if possible] |
| **Segment B** | [Name and definition] |
| **Sample size** | [X total -- Y per segment -- method justification] |
| **Recruitment source** | [In-product CRM / panel service / community / other] |
| **Screener approach** | [X-question screener -- attach or list below] |
| **Incentive** | [$X per session -- format: gift card / cash / etc.] |
| **Session format** | [Remote video / in-person / unmoderated async] |
| **Session length** | [X minutes] |

**Screener Questions (abbreviated):**
1. [Qualifying behavioral question -- answer options reveal suitability]
2. [Frequency or usage question]
3. [Disqualifying question -- "Are you employed by...?"]
4. [Diversity or segment-routing question]
5. [Availability and consent question]

---

### Discussion Guide / Test Protocol

**Context memo (researcher only):**
Research question: [Primary question]
Hypotheses under test: H1 -- [hypothesis]. H2 -- [hypothesis].
Key themes to explore: [List 3-4 topic areas]

---

#### Introduction and Consent (5 min)

- Introduce yourself and the purpose of the session: "We're trying to understand how people [general framing -- do not name the hypothesis]."
- Confirm recording consent: "With your permission, I'd like to record this session so I can focus on our conversation. The recording will only be reviewed by our research team and will not be shared publicly. Are you comfortable with that?"
- Establish think-aloud norm (for usability tests): "As you work through the tasks, please narrate what you're seeing, what you're thinking, and what you expect to happen -- even if it seems obvious."
- Emphasize no right or wrong answers: "We're testing the product, not your skills. Anything you find confusing tells us something we need to fix."
- Confirm the time: "We have [X] minutes together."

#### Warm-Up: Context Setting ([X] min)

- "Tell me a bit about your role and what you're responsible for day-to-day." (Establishes context, puts participant at ease)
- "How does [relevant product category / task type] fit into your work?" (Scopes the territory)
- "What tools do you currently use for [relevant task]?" (Reveals the competitive and workflow context)

#### Core Section 1: [Topic Area] ([X] min)

- **Grand tour question:** "Walk me through the last time you [relevant behavior] from start to finish."
  - Probe: "What prompted you to do that at that particular moment?"
  - Probe: "Walk me through exactly what you did first. Then what?"
  - Probe: "Was there anything that slowed you down or felt unclear at that point?"
- **Mini-tour question:** "You mentioned [specific step or detail from grand tour]. Tell me more about that."
  - Probe: "How do you usually handle that?"
  - Probe: "Is that how it always works, or does it vary?"
- **Experience question:** "Describe a time when [this process] didn't go the way you expected."
  - Probe: "What happened? What did you do?"
  - Probe: "How did you feel in that moment?"
- **"What else" close:** "Is there anything about [this topic] that you think I should understand that we haven't talked about yet?"

#### Core Section 2: [Topic Area] ([X] min)

- [Primary question]
  - Probe: [Follow-up]
  - Probe: [Follow-up]
- [Primary question]
  - Probe: [Follow-up]

#### [For usability tests: Task Scenarios] ([X] min total)

**Task 1: [Task name]** (estimated [X] min)
- Scenario: "[Realistic situation framed around user's goal, not the UI action]"
- Success criterion: [Binary pass/fail OR path-based OR confidence score threshold]
- Observe and note: [Specific behavior or decision point you most want to observe]
- Post-task question: "On a scale of 1 to 7, where 1 is very easy and 7 is very difficult, how would you rate that task?" + "Was there anything confusing or unexpected?"

**Task 2: [Task name]** (estimated [X] min)
- Scenario: "[Scenario]"
- Success criterion: [Criterion]
- Post-task question: [Standard post-task questions above]

#### Concept Reaction / Prototype Evaluation (if applicable) ([X] min)

- "Before I show you anything, I want to capture your current approach so we have a baseline."
- Show prototype or concept: "Here's something our team has been working on. I'd like to show you and hear your honest reaction -- this is a very early version and nothing is final."
- "What's your first impression? What stands out?"
- "Walk me through what you think this does and how you would use it."
- "What would you expect to happen if you [action]?"
- "Is there anything missing that you would need in order to use this confidently?"

#### Wrap-Up and Open Floor (5 min)

- "We've covered a lot of ground. Is there anything about [overarching topic] that you think I should understand -- something important that I haven't asked about?"
- "If you could change one thing about how [relevant product or process] works today, what would it be?"
- "Do you have any questions for me?"
- Thank the participant, confirm incentive delivery, and explain next steps.

---

### Analysis Plan

| Data source | Analysis method | Output artifact |
|------------|-----------------|-----------------|
| Interview transcripts | Thematic analysis (open coding -> axial coding -> theme development) | Theme map with frequency counts and representative quotes |
| Usability task observations | Issue log by severity (1-4 scale) + task success rate + time on task + post-task difficulty score | Usability scorecard |
| Post-task difficulty ratings | Mean and distribution per task | Task difficulty chart |
| Survey responses | Descriptive statistics, cross-tabulations by segment, open-text theming | Quantitative summary tables + frequency-coded open text |
| Session recordings/notes | Secondary review for missed observations | Supplementary evidence for key themes |

**Coding approach:**
- Primary coder: [Researcher name]
- Secondary coder (for validation): [Name or role]
- Inter-rater reliability check on 20% of coded data
- Analysis tool: [Dovetail / Miro / Airtable / other]

**Minimum evidence standard:**
- A finding will be reported as a pattern only if it was observed in 3+ participants (for n=6-8 studies) or 5+ participants (for n=10-12 studies).
- Contradictory evidence will be reported alongside each finding.

---

### Deliverables and Timeline

| Deliverable | Format | Target date | Audience |
|------------|--------|-------------|----------|
| Topline summary | 1-page memo | 48 hours after last session | Product team lead |
| Full findings report | Slide deck or document, 10-20 pages | [X] days after last session | Full product and design team |
| Usability scorecard (if applicable) | Table with severity ratings | Included in report | Design team |
| Recommendations backlog | Prioritized list mapped to decisions | [X] days after report | Product manager |
| Research repository entry | Searchable summary in [Dovetail/Notion] | Same day as report | Future research reference |
| Readout session | 60-min team meeting | Before final report | Stakeholders |
```

---

## Rules

1. **The research question must be written before the method is selected -- always.** The method is a means of answering the question. Researchers who start by deciding "we'll do interviews" without a research question end up with unfocused sessions that try to cover too much and answer too little. The question constrains the method.

2. **Never design a study to confirm a decision that has already been made.** If the team has already decided to ship a feature and is hoping research will validate that decision, this is not user research -- it is political theater. Reframe the study explicitly as evaluative (does this work?) rather than generative (should we build this?), or push back on conducting research if the decision is already final.

3. **Qualitative research with fewer than 5 participants per segment produces unreliable findings.** The Nielsen-Landauer usability research threshold is 5 for usability testing. For generative interviews, fewer than 5 participants per homogeneous segment may not reveal the range of perspectives and will almost certainly miss important patterns. Do not let timeline pressure compress the sample below 5.

4. **Every primary question in a discussion guide must be open-ended and non-leading.** Test every question against this standard: Can it be answered with "yes" or "no"? Does the question imply a preferred answer? Does the question describe the problem being solved? If any of these are true, rewrite the question. "Did you find that confusing?" -- rewrite as "What was your experience trying to do that?" "Do you think a notification would help?" -- rewrite as "Tell me about a time you missed something important. How did that happen?"

5. **Frequency data is required for every qualitative finding.** "Users struggle to find the export function" is an observation. "5 of 7 participants failed to locate the export function on the first attempt, and 3 of those 5 expressed frustration" is a finding. Qualitative research is not anecdotal when frequency is reported; it becomes precise, prioritizable, and defensible.

6. **A pilot session is mandatory before the main study.** Researchers who skip the pilot discover broken prototype links, ambiguous questions, and timing overruns during real sessions with real participants. The pilot does not need to be with a perfect participant -- a colleague or a volunteer user is sufficient. Budget 1-2 hours for the pilot and the debrief.

7. **Observers must be briefed before attending sessions.** Unmanaged observers interrupt sessions, send chat messages that distract participants, and draw conclusions from single sessions that contradict patterns across the full sample. Every observer gets the pre-session briefing and follows the silence rule. Limit observers to 2-3 per session.

8. **Analysis is complete only when contradictions and negative cases are documented.** Research reports that present a clean, unified narrative are almost always incomplete. Real user behavior contains contradictions. Document participants whose experience contradicts the prevailing theme. Unresolved contradictions are honest research; concealed contradictions are misleading research.

9. **Research output must include specific, actionable recommendations -- not findings alone.** A finding is what was observed. A recommendation is what should change as a result. Every major finding must be paired with at least one recommendation. Recommendations should be specific enough that a designer or developer can act on them: "Restructure the primary navigation to surface the 'Reports' section at the top level, as 6 of 8 participants could not locate it from the current third-level placement" is actionable. "Improve navigation" is not.

10. **Consent and data privacy must be handled proactively, not reactively.** Consent forms must be sent before the session, not read aloud during it. Recording permissions must be explicit and confirmed verbally at the start of the session. In B2B contexts, confirm that legal has cleared participant data storage and retention practices before recruitment begins. Data localization requirements (GDPR for EU participants, CCPA for California residents) affect where recordings and transcripts can be stored.

---

## Edge Cases

### The stakeholder wants to dictate the research questions

This is common and dangerous. Stakeholders often propose questions that are actually hypotheses disguised as questions, or questions designed to produce a specific answer. Handle this by reframing: "I want to make sure we get findings you can act on. Can we start from the decision you need to make and work backward to the research question?" Then rewrite the stakeholder's proposed questions to remove leading language and inbuilt assumptions. If the stakeholder insists on a leading research design, document the risk in writing: "This study is designed to evaluate [X], not to discover whether [Y]. We may not surface evidence that contradicts our current direction."

### The research question is too broad to answer in a single study

"Understand our users" or "know what they want from the product" are not research questions -- they are research programs. When a user presents an overly broad topic, apply the decision tree: "What specific decision are you trying to make with this research?" and "What would you do differently if the answer to this question turned out to be X versus Y?" If the decision does not change based on the answer, the question is not specific enough. A broad research initiative should be scoped into a series of focused studies, with a prioritization of which question is most urgent given the current product stage. Each individual study should address one primary research question.

### No access to real users (enterprise B2B product, low user volume, NDAs)

This is a chronic challenge in enterprise product research. Mitigation strategies in priority order: (1) Work with the customer success team to identify users who are already advocates -- they are the most likely to agree to participate. (2) Offer sessions as a "co-design partnership" rather than a "research study" -- enterprise buyers often value the collaborative framing. (3) Use internal SMEs or sales engineers who know the product domain deeply as proxies for the first study, explicitly noting in the report that findings are proxy-based. (4) Conduct hallway testing with employees who match the job function of target users (e.g., financial analysts for a finance tool), explicitly noting the limitation. (5) If NDAs prevent external sessions, request an "internal pilot" from a customer: the vendor gets research access, and the customer gets an early look at improvements.

### Research findings contradict what leadership believes

This is not a problem to be managed -- it is the most valuable outcome research can produce. The challenge is communication. When findings contradict entrenched beliefs, present the data in a format that minimizes defensiveness: lead with the participants' direct quotes and observed behaviors before stating the conclusion. Show video clips where possible -- a 90-second clip of a user failing a task is more persuasive than any written summary. Frame findings as "what users experience today" rather than "what the team got wrong." Pair every contradictory finding with a specific recommendation that gives stakeholders a path forward. Anticipate objections ("these users aren't representative") and address them in the report by showing how participants were screened and why the sample is valid.

### Running research on a live product with no prototype

When evaluating an existing feature rather than a prototype, usability test sessions must use real accounts -- either the participant's own account (ideal, because it contains their actual data and context) or a seeded demo account. If using a seeded demo account, populate it with realistic data before the session. Empty states are a known usability problem source that will dominate findings and may not represent the experience of users who have actual content in the product. For participants using their own accounts, have a clear protocol for handling any sensitive data they encounter during screen sharing: confirm they are comfortable before sharing, and remind them they can pause screen share at any point.

### Research results in conflicting findings across participant segments

When Segment A (e.g., new users) and Segment B (e.g., experienced users) produce opposite findings -- for example, new users find the onboarding overwhelming while experienced users find the same product too simplified after updates -- do not average across segments or report only the majority finding. Report segment findings separately. Conflicting findings across segments often reveal that the product is trying to serve two user populations with incompatible needs. This is itself a critical product finding that may surface the need for distinct onboarding paths, feature flags, or user tiering. Document the conflict explicitly and propose a recommendation for each segment.

### Participants give positive feedback on everything ("courtesy bias")

Courtesy bias -- the tendency to give socially acceptable, positive answers to avoid seeming critical -- is a systematic problem in user research, particularly with older participants, in some cultural contexts, and with participants who know the product team personally. Mitigation strategies: (1) Prime participants at the start by explaining that critical feedback is more valuable than positive feedback: "The best thing you can do for us today is tell us what doesn't work." (2) Use behavioral observations, not self-reports, as the primary evidence source. What a participant does overrides what they say. A participant who says "it's very easy" but takes 4 minutes and makes 3 errors on a simple task has told you the truth through their behavior. (3) Use indirect questioning: "What do you think someone who had never used this before would find confusing?" shifts the social pressure by asking participants to speak on behalf of a hypothetical other person rather than themselves. (4) Watch for tells: long pauses before saying something is "fine," qualifiers like "I guess it's okay," and physically moving away from the screen are behavioral signals of unvoiced frustration.

### The team wants to use AI transcription and analysis tools throughout

AI-assisted transcription (Grain, Otter.ai, Fireflies) and AI-assisted qualitative analysis (Dovetail's AI features, ChatGPT-based coding) significantly accelerate research operations, but require specific quality controls. For transcription: always review AI transcripts for errors before coding -- AI tools mishandle technical jargon, accents, and overlapping speech. For AI-assisted coding: treat AI-suggested themes as a first draft to be validated by a human researcher, not as final analysis. AI coding tools identify surface-level keyword clusters, not nuanced themes. The researcher must still read the raw transcripts. For AI-generated summaries: verify that every claim in an AI summary has a corresponding source quote. AI summarization tools have a documented tendency to over-generalize and to smooth out the contradictions and edge cases that are often the most important findings.

---

## Example

**Input:** "We have a B2B SaaS project management tool. Our product analytics show that 40% of new users who complete signup never create their first project within 14 days. We've tried changing the UI twice but the number doesn't move. We don't know if it's a motivation problem, a comprehension problem, or a workflow problem. We want to do user research to find out why."

**Output:**

---

## User Research Plan: New User First-Project Activation Drop-off

### Research Overview

| Field | Detail |
|-------|--------|
| **Primary research question** | What prevents newly signed-up users from creating their first project within 14 days, and what would need to change for them to do so? |
| **Research type** | Mixed methods -- generative interviews (explain the why) followed by evaluative usability test (identify specific friction points) |
| **Decision this research informs** | Whether to invest engineering and design resources in onboarding flow redesign, project template library, guided setup wizard, or integrated team invitation flow -- and which of these addresses the primary barrier |
| **Decision deadline** | Q3 planning in 6 weeks |
| **Primary method** | Semi-structured interviews (8 participants) |
| **Secondary method** | Moderated usability test of current onboarding flow (6 participants -- 3 from interview pool, 3 new) |
| **Total timeline** | 5 weeks (recruit weeks 1-2, interviews weeks 2-3, usability test week 3, analysis week 4, report week 5) |
| **Lead researcher** | [Product designer or UX researcher] |
| **Stakeholders** | Head of Product, Head of Design, Onboarding squad PM |

---

### Background: What We Know and What We Need to Learn

**What we already know:**
- Product analytics: 40% of signups do not create a project within 14 days (source: Amplitude, trailing 90 days)
- The drop-off rate has not materially changed despite two UI iterations (new empty state CTA copy in Q1, new onboarding modal in Q2)
- Of the 40% who do not create a project, approximately 60% log in at least once after signup; 40% never return after the first session (source: Amplitude cohort analysis)
- The product is used primarily by small teams (2-15 people); most projects involve multiple collaborators, not solo work
- Support ticket analysis shows 12% of first-week support tickets are tagged "getting started confusion" (source: Zendesk, trailing 60 days)

**Critical knowledge gaps:**
- We do not know whether non-activating users understood what a "project" is or represents in our product model
- We do not know whether users arrive intending to set up a project immediately or intending to evaluate the product before committing
- We do not know whether the blockers are individual (user cannot figure out the UI) or organizational (user needs to involve teammates or get approval before creating a real project)
- We do not know at what moment in the session users decide to stop -- is it during signup, during the empty state, during the project creation form, or earlier?

**Hypotheses (researcher reference only):**
- H1: Users arrive intending to evaluate the product, not to immediately set up a real project, and the onboarding asks them to do something they are not yet ready to do
- H2: The concept of a "project" in our product does not match the user's mental model of how their work is structured, causing confusion at the point of creation
- H3: Users need teammates involved to set up a meaningful project and drop off when they realize they would need to involve others first

---

### Participant Criteria

| Criterion | Specification |
|-----------|---------------|
| **Behavioral include** | Signed up for the product within the last 60 days; has not created a project OR created exactly one project within 7 days of signup |
| **Contextual include** | Works on a team of 2-20 people; role involves managing, coordinating, or contributing to multi-person projects; uses project management or task coordination tools in their work |
| **Exclude** | Employees of the company or direct competitors; participants in product research sessions within the past 3 months; freelancers who work entirely solo |
| **Segment A -- "Visited but didn't convert"** | Signed up 14-60 days ago, logged in at least 2 sessions, never created a project. These are the core drop-off users. Target: 5 interview participants. |
| **Segment B -- "Signed up and created 1 project quickly"** | Signed up within 30 days, created first project within 7 days. Control group to understand what enabled success. Target: 3 interview participants. |
| **Sample size** | 8 interviews (5 Segment A + 3 Segment B) + 6 usability test participants (3 from interview pool who consent to a second session + 3 newly recruited Segment A participants) |
| **Recruitment source** | CRM email to users matching behavioral criteria from product database; $50 gift card per interview session, $75 per usability test session |
| **Session format** | Remote video call (Zoom); screen share for usability test |
| **Session length** | 50 minutes for interviews; 60 minutes for usability tests |

**Screener Questions:**
1. "Which of the following best describes your primary role?" (options: project manager, team lead, individual contributor, executive/director, other -- all qualify except "freelancer, no direct reports, and no team coordination")
2. "How many people are on your immediate work team?" (options: just me, 2-5, 6-15, 16-50, 51+; qualify: 2-50)
3. "You recently signed up for [Product]. Which of the following best describes what happened after you signed up?" (options: I set up projects and started using it regularly; I set up one project but haven't been back; I logged in but haven't set up anything yet; I signed up but haven't logged in again -- all qualify; route to segment based on answer)
4. "Are you currently employed by a software company that makes project management or productivity tools?" (yes = disqualify)
5. "Are you available for a 50-minute video call between [date range], and are you comfortable with the session being recorded for internal research purposes only?"

---

### Discussion Guide: Semi-Structured Interviews

**Context memo (researcher only):**
Primary research question: What prevents newly signed-up users from creating their first project within 14 days?
Hypotheses: H1 -- evaluation intent mismatch; H2 -- mental model mismatch with "project" concept; H3
