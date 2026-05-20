---
name: retrospective-facilitator
description: |
  Produces a project retrospective session plan with a timed agenda, structured prompts for what went well and what to improve, and an action item template with owners and due dates. Delivers the complete facilitation guide for a personal or small-team retrospective.
  Use when the user asks about running a retrospective, reviewing a completed project, facilitating a lessons-learned session, or reflecting on what worked and what did not.
  Do NOT use for weekly reviews of ongoing work (use weekly-review), project status updates (use project-status-report), or enterprise team retrospectives at organizational scale (use business project-management skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "project-management planning checklist"
  category: "productivity"
  subcategory: "project-management"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Retrospective Facilitator

## When to Use

**Use this skill when:**
- The user has completed a discrete project (a side project, client deliverable, product launch, creative work, or learning sprint) and wants to extract lessons before moving on
- The user asks about running a retrospective, post-mortem, after-action review, or lessons-learned session for a project with 1-8 participants
- The user wants a structured facilitation guide with timed agenda, specific discussion prompts, and a documented action item output
- The user is preparing to facilitate a retrospective for a small team and needs a complete session plan they can walk into the room with
- The user wants to close out a project properly -- capturing institutional knowledge before the team disperses or context fades
- The user's project ended with a significant deviation from plan (late, over budget, descoped, or cancelled) and they want structured reflection on why
- The user wants to build a personal or team practice of continuous improvement across projects and needs a repeatable retrospective process

**Do NOT use when:**
- The user wants a recurring weekly review of ongoing work -- use `weekly-review`, which is optimized for cadence rather than project closure
- The user wants a project status report or progress update for a project still in flight -- use `project-status-report`
- The user wants to plan a new project rather than reflect on a completed one -- use `project-kickoff`
- The user is conducting a premortem before a project starts, imagining future failure modes -- use `premortem-analysis`
- The user needs an enterprise-scale Agile ceremony (50+ person org, multiple scrum teams, SAFe or LeSS framework retrospectives with organizational change management) -- use business project-management skills
- The user wants a technical incident post-mortem with root cause analysis for a production system failure -- the blameless post-mortem format for engineering incidents is a distinct skill with different structure
- The user wants a financial review or budget reconciliation for a project -- use financial reporting skills

---

## Process

### Step 1: Gather Retrospective Context

Before producing anything, collect the information needed to tailor the session. Ask directly if not provided:

- **Project name and deliverable:** What was built, created, or completed? One sentence.
- **Project duration:** Start date and end date (planned vs. actual). If exact dates are unknown, get approximate weeks or months.
- **Participants:** How many people are involved in the retrospective? Who are they (roles, not necessarily names)? Is this a solo self-retrospective or a group session?
- **Outcome vs. plan:** Did the project meet its original goal? Was it on time, late, or early? Was it in scope or did it expand/contract?
- **Available session time:** How long does the user have? Calibrate: 20-30 minutes for solo or micro-projects, 45-60 minutes for small-team projects under 3 months, 75-90 minutes for complex or multi-month projects.
- **Any known pain points:** Did anything go significantly wrong or right? Are there specific areas the user wants to dig into?
- **Retrospective experience:** Has the user (or team) done retrospectives before? First-timers need more structure and guidance in the prompts.

If the user has already provided most of this context in their request, proceed directly to Step 2 rather than asking for information already given.

### Step 2: Select the Retrospective Format

Match the format to the project's nature, team experience level, and available time. Choose one primary format -- do not blend formats, which produces confusion.

**Start / Stop / Continue (SSC)**
- Best for: General improvement, first-time retrospectives, teams under time pressure, projects with clear process patterns
- Structure: Three buckets -- what to start doing, what to stop doing, what to continue doing
- Time requirement: Works in 30-60 minutes
- Weakness: Can feel mechanical; experienced teams may find it superficial after repeated use
- Default choice for users who have not specified a format preference

**4Ls: Liked, Learned, Lacked, Longed For**
- Best for: Creative projects, learning-oriented work, projects where emotional experience matters alongside process
- Structure: Liked = positive experiences; Learned = new knowledge or skills gained; Lacked = what was missing that hurt progress; Longed For = what you wished existed
- Time requirement: 45-75 minutes
- Strength: Surfaces learning and growth alongside process critique; less adversarial framing than "what went wrong"
- Best fit when the user mentions learning, skill development, or creative work

**DAKI: Drop, Add, Keep, Improve**
- Best for: Process-heavy projects, teams that use explicit workflows or tools, repeat projects where processes are codified
- Structure: Drop = eliminate entirely; Add = introduce new practices; Keep = preserve what works; Improve = refine what exists but is imperfect
- Time requirement: 45-60 minutes
- Strength: Distinguishes between "stop doing" (Drop) and "do it better" (Improve) -- a distinction SSC collapses
- Best fit for software teams, operations projects, or any project with documented processes

**Timeline / Emotional Curve**
- Best for: Projects longer than 3 months, complex projects with many phases, situations where the user lacks specific observations and needs structure to surface memories
- Structure: Draw the project timeline; mark key events, milestones, and emotional highs/lows chronologically; analyze patterns across the timeline
- Time requirement: 60-90 minutes minimum; not suitable for 30-minute sessions
- Strength: Surfaces chronological causality (early decisions that caused late problems); excellent for complex projects
- Use when the user says things like "I don't even know where to start" or "a lot happened"

**Sailboat / Speedboat**
- Best for: Teams that are continuing to work together after the project; forward-looking emphasis
- Structure: Wind = forces helping the project; Anchors = forces slowing it down; Rocks = risks ahead; Sun = the goal
- Time requirement: 45-60 minutes
- Strength: Visually intuitive; maintains momentum framing; works well when the team will do another project together immediately
- Not suitable for project closure when the team disbands or when the project was a complete failure

### Step 3: Build the Session Agenda with Time Allocations

Apply the five-phase retrospective structure from Esther Derby and Diana Larsen's framework, calibrated to available time:

**Phase 1 -- Set the Stage (always 5-10% of total time)**
- Minimum 3 minutes, maximum 10 minutes
- Activity: Read the project summary aloud. Establish one ground rule: observations, not accusations. For group sessions, use a check-in question to get everyone speaking before the real work begins ("In one word, how are you feeling about this project being over?").
- Output: Shared context and psychological safety for honest discussion

**Phase 2 -- Gather Data (always 35-40% of total time)**
- This is the longest phase -- do not compress it
- Activity: Use the selected format's prompts. For solo: write responses to prompts before analyzing them (writing surfaces more than thinking). For groups: silent individual writing for 5-7 minutes FIRST, then share -- this prevents anchoring where the loudest voice shapes everyone's responses.
- Output: An unfiltered list of observations, good and bad, from all participants

**Phase 3 -- Generate Insights (always 25-30% of total time)**
- Activity: Cluster observations into themes. Apply the "5 Whys" technique to the most significant negative observations to find root causes rather than symptoms. For group sessions: dot voting (each participant gets votes equal to 20-25% of the total observation count) to prioritize which insights deserve action item attention.
- Critical rule: Distinguish between one-time events (bad luck, unique circumstances) and systemic patterns (recurring problems that will reappear on the next project). Only patterns should become action items.
- Output: Prioritized list of insights with identified root causes

**Phase 4 -- Decide What to Do (always 20-25% of total time)**
- Activity: Convert each high-priority insight into a specific action item. Apply the SMART filter: the action must be Specific (says exactly what to do), Measurable (has a success condition), Achievable (within the owner's control), Relevant (addresses the root cause, not the symptom), and Time-bound (has a trigger or deadline).
- Quantity cap: Maximum 5 action items from any retrospective. More than 5 means none will be done. If you have more candidate actions, rank them and take only the top 5.
- Output: Action item table with owner, trigger, and success measure

**Phase 5 -- Close (always 5-10% of total time)**
- Activity: Read back the action items. Ask for one-word reactions ("How do you feel about these action items?"). For groups: appreciation round where each participant names one thing a colleague did well during the project. For solo: write a one-sentence summary for future self.
- Output: Documented retrospective, clear next steps

### Step 4: Write Specific Facilitation Prompts

Generic prompts produce generic answers. Every prompt in the output must be specific to the project type, duration, and format. Apply these principles:

**Make prompts concrete and anchored:**
- Weak: "What went well?"
- Strong: "What was the single decision during this project that saved the most time or prevented the most problems?"

**Use timeframe anchors for longer projects:**
- "Think back to the first two weeks -- what felt uncertain or unclear that later caused problems?"
- "At what point did you feel the project shift from feeling under control to feeling risky?"

**Include often-overlooked categories explicitly:**
- Communication: "Where did a miscommunication or assumed understanding cause rework or delay?"
- Estimation: "Which tasks took 2x or more longer than your original estimate? Why was the estimate wrong?"
- Tooling: "Did any tool, software, or platform slow you down more than it helped?"
- Scope: "What did you add to the project that was not in the original plan? Was it worth it?"
- Energy and motivation: "Was there a period when motivation dropped significantly? What caused it?"

**Balance prompts 60/40 in favor of learning:**
- 60% of prompts should address what to change or improve (where the actionable learning lives)
- 40% should address what worked (to preserve strengths and provide psychological balance)
- This ratio prevents retrospectives from becoming complaint sessions while still driving change

**Write exactly as many prompts as will fit in the data-gathering phase:**
- At 30-second average per prompt response, a 12-minute phase supports roughly 20-24 prompts total
- For solo sessions, reduce to 12-15 prompts (writing takes longer than speaking)

### Step 5: Design the Action Item Structure

Each action item must clear all five bars:

**Specific:** Names an exact behavior or process change. "Communicate better" fails. "Send a written project summary to all stakeholders before kickoff meeting" passes.

**Triggered:** Either a calendar date ("before starting next project") or a situational trigger ("whenever a project exceeds 4 weeks in duration"). Triggers are often more reliable than dates for project-to-project learning.

**Owned:** One named person (or "Self" for solo). Never assign an action to "the team" -- it means no one owns it.

**Measurable:** A binary or observable success condition. "Feels better" fails. "The content draft is completed and approved before any design work begins" passes.

**Minimum actionable:** The action must be small enough to actually happen. "Implement a full project management system" fails because it requires too many decisions. "Use a single shared checklist document for task tracking from day one" passes.

### Step 6: Apply Root Cause Analysis to Key Insights

For the 2-3 most impactful negative observations, apply structured root cause analysis before generating action items. Use one of two techniques depending on available time:

**5 Whys (preferred for focused problems):**
- Ask "why did this happen?" and answer it. Then ask "why did that happen?" and answer again. Repeat 3-5 times until the answer is either a controllable process failure or an external constraint beyond control.
- Stop when you reach a root cause that is within the team's power to change.
- Example: "The project ran 2 weeks late" → Why? "Content writing took much longer than planned" → Why? "We hadn't written content drafts before starting design" → Why? "We had no checklist that required content before design" → Root cause: Missing pre-design content checkpoint. Action: Add content completion gate to project kickoff checklist.

**Fishbone / Ishikawa (for complex problems with multiple causes):**
- Draw a fishbone with the problem as the "head." Identify causes across 4-6 categories: Process, People, Tools, Communication, Planning, External Factors.
- Use when a single Why chain doesn't capture the full picture -- typically for project failures or major scope issues.
- Appropriate for sessions of 60+ minutes only.

### Step 7: Calibrate for Group Dynamics (Multi-Participant Sessions)

For sessions with 2-8 participants, add facilitation mechanics that prevent common failure modes:

**Silent brainstorm before sharing:** Individual sticky note writing for 5-7 minutes before anyone speaks. This prevents the "anchor bias" where the first person to speak shapes everyone else's list.

**Dot voting for prioritization:** After observations are listed and grouped, give each participant votes equal to 20-25% of total observations (rounded up). Example: 16 observations means 4 votes per person. Participants can stack votes on a single item if they feel strongly. Top vote-getters become the focus of Phase 3.

**One voice at a time rule:** During insight generation, the facilitator calls on speakers. This prevents the loudest participant from dominating.

**Separate the observation from the interpretation:** If someone says "we failed because of poor planning," the facilitator separates these: the observation is "planning artifacts were not created before work started" and the interpretation is "this caused delays." Others may have a different interpretation -- surface the observation before debating the cause.

**Timekeeper role:** In groups of 4+, assign one participant as timekeeper with explicit permission to interrupt when a phase runs over.

---

## Output Format

```
## Project Retrospective: [Project Name]

### Session Setup
- **Project:** [Project Name] -- [one-sentence description of what was delivered]
- **Project duration:** [Start] to [End] | Planned: [X weeks/months] | Actual: [Y weeks/months]
- **Variance:** [On time | X days/weeks early | X days/weeks late | [%] schedule overrun]
- **Participants:** [Names/roles -- or "Self-retrospective"]
- **Session duration:** [total minutes]
- **Retrospective format:** [Start/Stop/Continue | 4Ls | DAKI | Timeline | Sailboat]
- **Facilitated by:** [name or "self"]
- **Retrospective date:** [date]

---

### Project Summary (Read Before Starting)

| Field | Planned | Actual |
|-------|---------|--------|
| Goal | [what the project set out to achieve] | [what was actually delivered] |
| Timeline | [planned duration] | [actual duration] |
| Scope | [original scope in 1-2 sentences] | [actual scope -- note additions or cuts] |
| Success criteria | [how success was originally defined] | [whether criteria were met] |
| Key milestones | [planned milestone dates] | [actual milestone dates] |

**Goal met?** [Yes / Partially / No] -- [one sentence explanation]
**Overall assessment in one sentence:** [honest, unfiltered summary of how the project went]

---

### Session Agenda

| # | Phase | Activity | Duration | Output |
|---|-------|----------|----------|--------|
| 1 | Set the Stage | Review project summary; establish ground rules; check-in question | [X] min | Shared context |
| 2 | Gather Data | [Format-specific activity: silent write + share] | [X] min | Observation list |
| 3 | Generate Insights | Cluster observations; 5 Whys on top issues; dot vote to prioritize | [X] min | Prioritized insights with root causes |
| 4 | Decide What to Do | Convert top insights to SMART action items; assign owners | [X] min | Action item table |
| 5 | Close | Read back action items; appreciation round; one-sentence summary | [X] min | Documented retrospective |
| | | **Total** | **[X] min** | |

**Ground rules (read aloud at start):**
- We discuss processes and systems, not personal blame
- Every observation is valid -- we are collecting data, not debating it yet
- What is said in this room stays in this room (for group sessions)
- We will produce at least [2] and at most [5] action items before we leave

---

### Phase 1: Set the Stage

**Check-in question (groups only -- go around once, one word or phrase each):**
"In one word, how do you feel now that this project is finished?"

**Facilitator reads aloud:**
[Read the Project Summary table above. Confirm everyone is working from the same understanding of what was planned vs. what happened. Note any disagreements on the summary -- these are data points, not blockers. Resolve significant factual disagreements before continuing.]

---

### Phase 2: Gather Data -- Facilitation Prompts

> **Instruction:** Work through these prompts in writing first (5-7 minutes of silent writing for groups, full writing time for solo). Then share observations one by one. The facilitator records every observation without editing or judgment. Do not discuss or debate in this phase.

---

#### [FORMAT-SPECIFIC SECTION -- ONE OF THE FOLLOWING]

---

**[If Start / Stop / Continue:]**

**CONTINUE -- What worked well (keep doing this)**
- What was the single best decision made during this project? What made it the right call?
- What process, habit, or practice saved the most time or prevented the most problems?
- What communication pattern worked well -- what kept everyone aligned and informed?
- What tool, template, or resource made a measurable difference to quality or speed?
- What would you replicate without changing anything on the next project?
- At what moment did you feel the project was going well? What was in place that caused that?

**STOP -- What did not work (eliminate this)**
- Which task or phase took 2x or more longer than estimated? What was the actual reason?
- Where did a miscommunication, unclear ownership, or assumed understanding cause rework?
- What meeting, process, or artifact consumed time without producing value?
- What did you avoid, procrastinate on, or delay making a decision about? What made it hard?
- Where did perfectionism or scope creep add time without proportional value?
- If you could go back and remove one thing from this project entirely, what would it be?

**START -- What was missing (begin doing this)**
- What tool, skill, or resource would have meaningfully shortened this project?
- What did you wish you had planned for at the start but didn't?
- What would have helped you make better decisions earlier in the project?
- What information did you lack at a critical moment? How could you have had it sooner?
- What did another project, team, or person do that you wish you had done here?

---

**[If 4Ls: Liked, Learned, Lacked, Longed For:]**

**LIKED -- Positive experiences (emotional and practical)**
- What moment during this project felt the best? What was happening?
- What aspect of the work itself did you genuinely enjoy?
- What collaboration or interaction was particularly effective?
- What outcome exceeded your expectations?

**LEARNED -- New knowledge, skills, or understanding gained**
- What did you learn about the subject matter that you didn't know before?
- What did you learn about how you work -- your personal strengths, weaknesses, or patterns?
- What did you learn about the tools, processes, or domain of this project?
- What mistake taught you something important?

**LACKED -- What was missing that hurt the project**
- What skill, knowledge, or resource would have materially improved the outcome?
- What process or structure was absent that would have prevented a significant problem?
- What information did you need but couldn't get, or got too late?
- What support -- from people, tools, or the environment -- was missing?

**LONGED FOR -- What you wished existed**
- What tool, template, or resource do you wish had existed for this project?
- What organizational support, clarity, or authority would have made this easier?
- If you had one extra resource (time, money, person, tool) what would it have been?
- What cultural or environmental condition would have made this project go more smoothly?

---

**[If DAKI: Drop, Add, Keep, Improve:]**

**DROP -- Eliminate entirely from future projects**
- What activity, meeting, artifact, or tool produced no value you would miss?
- What process step created friction without proportional benefit?
- What habit or default behavior made things harder without making them better?

**ADD -- Introduce to future projects**
- What process, tool, or practice is missing from your current workflow?
- What checkpoint, review, or gate should exist that didn't?
- What communication practice should be added from day one?

**KEEP -- Preserve as-is**
- What worked so well it should be protected from change?
- What standard practice proved its value on this project?
- What tool, format, or convention should become a permanent default?

**IMPROVE -- Refine without eliminating**
- What process exists but needs adjustment to work better?
- What tool is used but configured, scoped, or applied incorrectly?
- What communication pattern is directionally right but needs refinement?
- What planning artifact exists but was too detailed, too vague, or applied too late?

---

### Phase 3: Generate Insights

**Step 1 -- Cluster observations into themes**
Group related observations together. Common clusters: Planning & Estimation, Communication, Technical/Tooling, Scope Management, Process & Workflow, Team Dynamics, External Dependencies.

**Step 2 -- Classify each observation**
| # | Observation | Category | One-time event or recurring pattern? | Within our control? |
|---|-------------|----------|--------------------------------------|---------------------|
| 1 | [observation from Phase 2] | [category] | [One-time / Recurring] | [Yes / No / Partial] |
| 2 | [observation] | [category] | [One-time / Recurring] | [Yes / No / Partial] |
| 3 | [observation] | [category] | [One-time / Recurring] | [Yes / No / Partial] |

> Only recurring patterns that are within the team's control should produce action items. One-time external events are noted but not actioned.

**Step 3 -- 5 Whys on top 2-3 insights**

| Why Chain | [Observation 1 text] |
|-----------|----------------------|
| Why 1 | [Why did this happen?] |
| Why 2 | [Why did that happen?] |
| Why 3 | [Why did that happen?] |
| Why 4 | [Why did that happen?] -- stop here if root cause is found |
| Root cause | [The controllable process failure at the root] |
| Proposed action | [What process change addresses this root cause] |

**Step 4 -- Prioritize (groups: dot voting; solo: rank by impact)**
| # | Insight | Root cause | Priority (H/M/L) | Action item candidate? |
|---|---------|------------|------------------|------------------------|
| 1 | [insight] | [root cause] | [H/M/L] | [Yes/No] |
| 2 | [insight] | [root cause] | [H/M/L] | [Yes/No] |

---

### Phase 4: Action Items

> Maximum 5 action items. Each must be specific, owned, triggered, and measurable.

| # | Action (specific behavior change) | Owner | Trigger / When it applies | Success measure |
|---|----------------------------------|-------|--------------------------|-----------------|
| 1 | [Exact action -- starts with a verb] | [Name/Role] | [Before next project starts / When project exceeds 4 weeks / etc.] | [Binary or observable condition confirming the action worked] |
| 2 | [Exact action] | [Name/Role] | [Trigger] | [Success measure] |
| 3 | [Exact action] | [Name/Role] | [Trigger] | [Success measure] |
| 4 | [Exact action] | [Name/Role] | [Trigger] | [Success measure -- optional 4th and 5th] |

**Action item review (facilitator reads each aloud and confirms):**
- [ ] Is this specific enough to act on immediately?
- [ ] Does one named person own it?
- [ ] Is the trigger or deadline clear?
- [ ] Will we know whether it worked?

---

### Phase 5: Retrospective Summary

**Key metrics**
- **Total observations collected:** [n]
- **Observations classified as recurring patterns:** [n]
- **Observations within team control:** [n]
- **Action items generated:** [n]
- **Action items assigned to owners:** [n]

**Top 3 insights (one sentence each):**
1. [Most important insight]
2. [Second most important insight]
3. [Third most important insight]

**Acknowledgments (group sessions -- go around once):**
"Name one thing a colleague did during this project that you want to recognize."

**Overall project rating (each participant independently, 1-10):**
[Group average: __ / 10 | Solo: __ / 10]

**One sentence for your future self:**
"[The single most important lesson from this project is ___.]"

**Next retrospective:** [Date or trigger for the next project review]
```

---

## Rules

1. **Never skip root cause analysis on the top 2-3 negative observations.** Identifying symptoms ("the project ran late") without their root cause ("estimation never accounted for content creation time") produces action items that address the wrong problem. Apply the 5 Whys before writing any action item for a negative observation.

2. **Cap action items at 5 regardless of how many insights are generated.** Research on retrospective effectiveness consistently shows that teams who generate more than 5 action items implement zero of them. If there are more than 5 candidate actions, rank by impact and controllability and discard the rest.

3. **Enforce silent individual brainstorm before group sharing.** In multi-participant sessions, if group discussion happens before individual writing, the first speaker anchors everyone else's list. The silent phase is not optional -- it is the most important process guarantee for honest data collection.

4. **Distinguish one-time events from recurring patterns before assigning action items.** A vendor going out of business mid-project is a one-time event. Missing estimates on writing tasks is a pattern. Only patterns should produce action items. Documenting one-time events is useful for organizational memory but does not require a process change.

5. **Balance positive and corrective prompts at approximately 40/60 ratio.** A retrospective that only discusses what went wrong produces defensive participants and misses strengths worth preserving. A retrospective that only discusses what went well produces no change. The slight emphasis on improvement is intentional -- but positive observations must have real weight, not be a perfunctory opener.

6. **Never allow an action item to be assigned to "the team" or "everyone."** Collective ownership means no ownership. Every action item must have exactly one named person responsible for carrying it forward, even if the behavior change involves multiple people.

7. **Keep the session proportional to the project.** A 2-week project warrants 20-30 minutes of retrospective. An 8-month project warrants 75-90 minutes. Over-investing retrospective time on micro-projects discourages the practice; under-investing on complex projects produces shallow learning.

8. **The project summary section is mandatory and must be verified before data gathering begins.** Participants who have different recollections of what the project's goals were, or what was actually delivered, will produce observations based on incompatible frames of reference. Verify shared facts -- planned duration, actual duration, goal met or not -- before any discussion begins.

9. **Action item success measures must be observable, not felt.** "Communicate better" has no success measure. "All stakeholders receive a written kickoff summary before the first work session begins" is observable. Retrospective action items that are not measurable get quietly dropped and are never reviewed.

10. **Store and review retrospective action items at the start of the next project.** The retrospective document has no value if it is filed and never reopened. The facilitation guide must conclude with a specific reminder: when the next project kicks off, the action items from this retrospective must be pulled up and incorporated into the project kickoff checklist. Without this step, the retrospective produces catharsis but no learning.

11. **Use the format that fits the project context, not the format the user is most familiar with.** Start/Stop/Continue is the correct default for first-timers and time-constrained sessions. 4Ls is correct for creative or learning-oriented work. DAKI is correct for process-heavy or repeat-project contexts. Timeline is correct when the user lacks specific observations. Override the user's format preference only if their preference clearly does not fit the context -- and explain why.

12. **Never editorialize during the data-gathering phase.** If facilitating a group session, the facilitator's job in Phase 2 is to capture every observation as stated, not to evaluate, correct, or challenge it. Observations are treated as valid data. Debate about whether an observation reflects reality happens in Phase 3, not Phase 2.

---

## Edge Cases

### Self-Retrospective (Solo User)
The default retrospective format assumes some degree of externalization -- writing observations on a board, reading them back, voting. For solo retrospectives, adapt:
- Replace all group activities with structured writing. The user should write responses to prompts before reading them back to themselves -- this deliberate delay between writing and reviewing creates useful distance.
- Reduce session time to 20-35 minutes. Solo retrospectives move faster because there is no coordination or discussion overhead.
- Replace the appreciation round with a brief written acknowledgment: "What did I handle well during this project that I want to remember?"
- The one-sentence future self summary is even more important for solo -- there is no other person to remember what was decided. The sentence should be written somewhere the user will actually see it (a project template, a notes system they use regularly, a journal entry).
- Dot voting is replaced by simple ranking: number the observations 1 through n by perceived impact.

### Failed or Cancelled Project
When the project significantly missed its goals, was cancelled, or produced a genuinely bad outcome, the facilitation approach must change:
- Increase Phase 2 time by 10-15 minutes to give enough space for complete data gathering -- failed projects have more to unpack.
- Add specific failure-mode prompts: "At what specific point did you know the project was in trouble? What was the first warning sign?" and "What decision, made in hindsight, most changed the trajectory?" and "What would have needed to be true at week [X] for the project to succeed?"
- Do not rush to solutions. In failed projects, there is often pressure to "move on" that compresses Phase 3 too much. Spend real time on root cause analysis -- the pattern that caused failure is the most valuable learning the team has.
- Consider a "what would we do differently from day one" exercise: starting from the original project brief, walk through each phase and name the specific decision that would change.
- Be explicit in the action items about early warning signs: what observable condition, if seen on a future project, should trigger an intervention?
- Emotional acknowledgment is required before technical analysis. If the team is demoralized, the check-in in Phase 1 matters more than usual. Allow space for people to name how they feel before diving into the data.

### Mid-Project Check-In (Not a Project Closure)
If the user wants to run a retrospective while the project is still ongoing -- typically at a significant milestone, at the halfway point, or when the project is clearly in distress:
- Rename the session a "mid-project check-in" or "course correction session" to set the right expectation. This is not a closure retrospective; it is a steering intervention.
- Eliminate the project summary section's "goal met?" field. Replace with "current trajectory: on track / at risk / off track."
- Phase 4 action items become immediate changes to make now, not lessons for future projects. The trigger column changes from "next project" to a specific date within the current project.
- Focus 70% of Phase 2 on "what needs to change now" and 30% on "what is working that we should protect."
- Add a "decisions to make today" section to Phase 4: any decision that has been deferred but is blocking progress should be surfaced, decided, and documented in the session.
- Recommend scheduling a closure retrospective at project end even if this mid-point session happens.

### Team With Conflicting Perspectives on What Happened
In multi-participant retrospectives, it is common for team members to have fundamentally different memories or interpretations of the same events. This is data, not a problem:
- Use dot voting after Phase 2 to let prioritization happen through voting rather than debate. If one person's observation gets zero votes from colleagues, that is useful signal.
- If two participants have directly contradictory accounts of an event, record both observations separately. "Designer: the brief was clear from day one. Developer: the brief changed three times." Both are valid experiences. Do not force consensus on facts.
- When conflict is significant, use the "ELMO rule" (Enough, Let's Move On): the facilitator names when a debate is consuming disproportionate time and redirects to the next observation.
- If two or more participants are in visible interpersonal conflict, this retrospective is not the appropriate venue for that conflict. Surface the issue in Phase 1, acknowledge it explicitly, and agree to address it separately. Running a retrospective on top of unresolved conflict produces a performative session, not genuine learning.

### Very Short Project (Under 2 Weeks)
For projects lasting 1-2 weeks, a full 60-minute retrospective is disproportionate:
- Use a condensed 20-minute format: 3 minutes set the stage, 10 minutes gather data (3-4 prompts per category maximum), 5 minutes generate 1-2 insights, 5 minutes produce 1-3 action items.
- Use only Start/Stop/Continue -- other formats require more context than short projects generate.
- The output document should be one page maximum. The action item table dominates; the rest is compressed.
- Still write the one-sentence future self summary -- this is the highest-value output per minute invested.

### User Has Never Run a Retrospective Before
First-time retrospective facilitators need more scaffolding in the facilitation guide:
- Add explicit facilitator notes in italics throughout the guide: what to say, what to watch for, how to handle common derailments.
- Simplify the format to Start/Stop/Continue only.
- Reduce the number of prompts to 3-4 per section rather than 6-8.
- Add a "what to do if this happens" sidebar covering the most common first-timer problems: people give vague answers, one person dominates, discussion gets personal.
- Recommend recording or taking notes on the session itself, not just the output -- first-time facilitators learn as much from how the session went as from what it produced.

### Recurring Project (Same Project Type Runs Repeatedly)
For users who run the same type of project repeatedly -- quarterly campaigns, client onboarding projects, event productions -- the retrospective has an additional layer:
- Compare action items from the previous retrospective of this project type: were they implemented? Did they work?
- Add a "trend" column to the insight table: is this the same problem that appeared in the last retrospective of this type? If so, the root cause analysis was probably incorrect or the action item was insufficient.
- The one-sentence future self summary should be added to a project template or standard operating procedure document so it carries forward automatically, not just into the user's memory.
- Recommend a "retrospective of retrospectives" every 4-6 cycles of recurring projects: review which action items from past retros were actually implemented and which were repeatedly deferred.

---

## Example

**Input:** "We just finished a 4-month brand identity project for a client. My team was a designer (me), a copywriter, and a project manager. The client approved everything but we went 3 weeks over the original timeline and over budget by about 15%. The client is happy but we're frustrated. We have an hour for the retrospective tomorrow."

**Output:**

---

## Project Retrospective: Client Brand Identity Project

### Session Setup
- **Project:** Client Brand Identity -- complete brand identity system delivered (logo, color palette, typography, brand guidelines document, and social media templates)
- **Project duration:** Planned: 4 months | Actual: 4 months 3 weeks
- **Variance:** 3 weeks late (19% schedule overrun) | ~15% budget overrun
- **Participants:** Designer (facilitator), Copywriter, Project Manager
- **Session duration:** 60 minutes
- **Retrospective format:** DAKI (Drop, Add, Keep, Improve) -- chosen because this is a repeat project type with defined processes that can be adjusted
- **Retrospective date:** [tomorrow's date]

---

### Project Summary (Read Before Starting)

| Field | Planned | Actual |
|-------|---------|--------|
| Goal | Deliver complete brand identity system in 4 months | Complete brand identity system delivered |
| Timeline | 16 weeks | 19 weeks |
| Scope | Logo, palette, typography, brand guidelines | Logo, palette, typography, brand guidelines, social media templates (added mid-project) |
| Success criteria | Client approval, on time, on budget | Client approved -- timeline and budget overrun |
| Key milestones | Discovery: wk 2, Concepts: wk 5, Refinement: wk 10, Final delivery: wk 16 | Discovery: wk 3, Concepts: wk 7, Refinement: wk 14, Final delivery: wk 19 |

**Goal met?** Partially -- delivered approved work but 3 weeks late and 15% over budget.
**Overall assessment in one sentence:** We produced excellent work that the client loves, but our process ran loose from mid-project onward and the scope grew without corresponding timeline or budget adjustment.

---

### Session Agenda

| # | Phase | Activity | Duration | Output |
|---|-------|----------|----------|--------|
| 1 | Set the Stage | Read project summary; ground rules; check-in question | 5 min | Shared context |
| 2 | Gather Data | Silent write (7 min) + share observations round-robin | 22 min | DAKI observation list |
| 3 | Generate Insights | Cluster; 5 Whys on top 2 issues; dot voting (4 votes each) | 18 min | 4-6 prioritized insights with root causes |
| 4 | Decide What to Do | Convert top insights to SMART action items | 12 min | 3-5 action items |
| 5 | Close | Read back actions; appreciation round; one-sentence summary | 3 min | Documented retrospective |
| | | **Total** | **60 min** | |

**Ground rules (facilitator reads aloud):**
- We discuss process and systems, not individual mistakes or personal blame
- Every observation is recorded as stated -- we debate meaning in Phase 3, not Phase 2
- What is said here stays here -- this is a candid internal review
- We leave with 3-5 action items that go directly into our next brand project brief

**Check-in question:** "In one word, how are you feeling about this project being finished?"

---

### Phase 2: Gather Data -- DAKI Prompts

> **Instruction for tomorrow:** Set a 7-minute timer. Everyone writes independently on their own paper or device before sharing. No discussion during the writing phase. After 7 minutes, go around the table and share one observation at a time -- the PM records all observations on a shared board or document without editing.

---

**DROP -- What should we eliminate from our process entirely?**
- What meeting, check-in, artifact, or step consumed time during this project that produced no output you'd miss?
- What communication channel or tool created noise without clarity? (Think: Slack threads that became confusing, email chains that should have been decisions, status updates no one used)
- What approval step or review loop was redundant or unnecessary given how the client actually engaged?
- What planning artifact did we create that went stale and was never updated -- meaning we put time into it and then ignored it?

**ADD -- What should we introduce to our process for future brand projects?**
- What checkpoint, gate, or review should exist that didn't on this project?
- What client communication practice -- a weekly update format, a decision log, a formal scope review -- should we add from day one?
- What contract or agreement language would have protected us when scope expanded?
- What tool or template is missing from our current workflow that would have saved meaningful time?
- What should our kickoff checklist include that it currently doesn't?

**KEEP -- What worked well enough to protect from any change?**
- What creative process step produced the best work and should be repeated exactly?
- What client communication practice kept them informed and aligned?
- What team coordination habit prevented problems or kept us moving?
- What decision made early in the project turned out to be clearly correct?
- What tool, file format, or naming convention should become a permanent studio standard?

**IMPROVE -- What exists in our process but needs refinement?**
- What did we do directionally right but execute imperfectly? (Think: we had status updates, but they were too infrequent; we had a timeline, but it wasn't tracked against reality weekly)
- How should the discovery phase be different in scope, duration, or deliverables?
- How should the concept presentation be structured differently?
- Where did our revision tracking break down -- and what would better revision tracking look like?
- How should scope change requests be handled differently when a client asks for something new mid-project?

---

### Phase 3: Generate Insights

**Step 1 -- Cluster observations**
As observations are shared, group them under these expected categories (adjust if actual observations don't fit):
- Scope management
- Client communication and approval process
- Internal workflow and handoffs between designer, copywriter, and PM
- Estimation and timeline tracking
- Tooling and file management

**Step 2 -- Classify each observation**
| # | Observation | Category | Recurring or One-Time? | Within Our Control? |
|---|-------------|----------|------------------------|---------------------|
| 1 | Social media templates were added to scope in week 10 with no timeline or fee adjustment | Scope management | Recurring -- happened on previous brand project too | Yes |
| 2 | Client feedback in rounds 2 and 3 contradicted round 1 approvals | Client communication | Recurring | Partial |
| 3 | Copywriter delivered messaging framework 2 weeks after the agreed date, blocking visual concepts | Internal workflow | One-time | Yes |
| 4 | Timeline was not reviewed against actual progress after week 6 | Estimation/tracking | Recurring | Yes |
| 5 | Discovery brief was not signed off by client before concept work began | Process gate | Recurring | Yes |

**Step 3 -- 5 Whys on top 2 insights**

| Why Chain | Observation 1: Social media templates added in week 10 with no adjustment |
|-----------|---------------------------------------------------------------------------|
| Why 1 | The client asked for social templates and we said yes without discussing scope impact |
| Why 2 | We didn't have a documented scope change process to refer to in the moment |
| Why 3 | Our project agreement didn't include explicit language about what happens when new deliverables are requested |
| Why 4 | We've always handled scope changes informally because client relationships feel awkward to formalize |
| **Root cause** | No scope change protocol exists; informal client relationships make boundary-setting feel risky |
| **Proposed action** | Add a scope change clause to the project agreement template and a one-page "how we handle change requests" document to give to clients at kickoff |

| Why Chain | Observation 2: Timeline not reviewed after week 6 |
|-----------|---------------------------------------------------|
| Why 1 | The PM stopped updating the timeline document when the project fell behind |
| Why 2 | When the timeline became inaccurate, updating it felt like admitting a problem rather than managing one |
| Why 3 | There was no standing weekly timeline review on the calendar -- it happened informally and then stopped |
| **Root cause** | Weekly timeline review was not a scheduled ritual; it was ad hoc and the first thing to disappear under pressure |
| **Proposed action** | Add a 15-minute weekly timeline review to every brand project calendar from day one -- mandatory, not optional |

**Step 4 -- Dot voting**
Each participant gets 4 votes (20% of ~20 expected observations). Stack votes allowed. Top vote-getters proceed to action items.

*[Expected top vote-getters based on session context:]*
- Scope change protocol (likely high votes from all three participants)
- Discovery brief sign-off gate (likely high votes from PM and designer)
- Weekly timeline review ritual (likely high votes from PM)

---

### Phase 4: Action Items

| # | Action | Owner | Trigger / When | Success Measure |
|---|--------|-------|----------------|-----------------|
| 1 | Add a scope change clause to the standard project agreement. When a client requests a new deliverable, the PM sends a one-paragraph written scope change memo within 24 hours that names the deliverable, the additional fee, and the revised delivery date. Work on the new deliverable does not begin until the memo is signed. | Project Manager | Effective immediately -- update template before next proposal goes out | Zero scope additions happen on future projects without a signed scope change memo |
| 2 | Add a discovery brief sign-off requirement to the project kickoff checklist. Concept work does not begin until the client has signed the discovery brief in writing (email confirmation is sufficient). This is a hard gate, not a soft recommendation. | Project Manager | Every new brand project kickoff | Concept work never begins before discovery brief is confirmed in writing |
| 3 | Schedule a 15-minute weekly timeline review as a standing calendar event from project day one. The PM updates the actual timeline against planned progress each Monday morning and shares a one-line status ("On track / 1 week behind / 2+ weeks behind -- here's why") with the full team and client. | Project Manager | First calendar event created during project kickoff | Timeline document reflects actual progress every week of the project without exception |
| 4 | Create a social media deliverables decision in the project proposal: either include social templates as a base deliverable (with fee built in) or explicitly exclude them in writing so clients know they are an add-on. End the ambiguity that invites scope creep. | Designer | Before next brand proposal is sent | Social media templates are either included with a line item or explicitly excluded in every proposal |
| 5 | Before next brand project launches, conduct a 30-minute internal kickoff where the team reviews these 4 action items and confirms how each one applies to the new project. | All three -- Designer leads | Within first week of any new brand project | The action item review is documented in the project notes |

**Action item review check:**
- [x] All 5 actions start with a specific verb and name an exact behavior
- [x] Each action has a single named owner
- [x] Each action has a clear trigger
- [x] Each action has an observable success condition

---

### Phase 5: Retrospective Summary

**Key metrics**
- **Total observations collected:** ~20 (estimated based on 3 participants, 4 DAKI categories)
- **Recurring patterns:** 4 of 5 highlighted observations are recurring patterns
- **Within team control:** 4 of 5 are fully controllable; 1 is partially controlled
- **Action items generated:** 5
- **Action items assigned to owners:** 5

**Top 3 insights:**
1. Scope grew by at least one major deliverable without any formal process to capture the impact on timeline or budget -- this has happened before and will happen again without a signed scope change protocol.
2. The project's timeline became fiction by week 8 because reviewing it stopped being a scheduled ritual, meaning problems grew silently instead of being surfaced and managed.
3. The discovery brief was treated as a working document rather than a formal agreement, allowing misalignments between what we thought was approved and what the client remembered approving to persist into the concept phase.

**Appreciation round (facilitator prompts):**
"Go around once. Name one specific thing a teammate did during this project that made a difference."

**Overall project rating:** [Each participant rates independently 1-10 before sharing -- avoids anchoring]

**One sentence for your future self:**
"A client who loves the final work and a team that overruns the budget and timeline by 15-20% are not signs of a successful process -- protect the scope and the timeline the same way you protect the creative work."

**Next brand project action item review:** [PM sets a calendar reminder to pull this document at the start of next brand project kickoff]

---
