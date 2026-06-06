---
name: retrospective-facilitation
description: |
  Creates agile retrospective agendas and facilitation guides with question sets, activity structures, action item formats, and follow-up tracking for team improvement. Use when the user asks about retrospectives, sprint retrospectives, team retros, post-mortems, or agile improvement ceremonies.
  Do NOT use for incident post-mortems (different format), project status updates (use status-update), or meeting agendas unrelated to team improvement (use meeting-agenda).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "agile planning project-management template strategy"
  category: "business-strategy"
  subcategory: "product-management"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Retrospective Facilitation

## When to Use

**Use this skill when:**
- A user needs to plan, structure, or facilitate a sprint retrospective, iteration review, or quarterly team retrospective -- including selecting a format, generating prompts, and building an agenda
- A user wants to diagnose and improve a stale retro process -- the team is going through the motions, energy is low, action items never get completed, or the same issues keep surfacing
- A user needs to facilitate a retrospective for a team in a specific challenging context: new team, distributed team, team in conflict, recently reorganized team, or team that just experienced a major failure
- A user asks about retrospective formats, facilitation techniques, psychological safety practices, or how to generate meaningful action items instead of generic platitudes
- A user needs a complete facilitation guide including opening activities, reflection prompts, discussion facilitation moves, voting mechanisms, and action item capture
- A user wants to run a non-sprint retrospective: a project retrospective after a multi-month initiative, a quarterly team health retrospective, or an annual practice review
- A user needs to adapt retrospective practice for a specific context: mob programming team, design team, cross-functional product team, or a team where not all members are engineers

**Do NOT use this skill when:**
- The user needs an **incident post-mortem** -- post-mortems have a distinct structure (timeline reconstruction, contributing factors, remediation items) and a different goal (restore reliability, not improve team process); use the `incident-postmortem` skill instead
- The user needs a **project status report** or sprint review -- sprint reviews are about demonstrating value to stakeholders, not internal team reflection; use `status-update`
- The user wants a **meeting agenda** for a planning session, design review, or any ceremony that is not specifically about team process improvement; use `meeting-agenda`
- The user needs a **team performance review** or feedback framework for individuals; that is a management conversation, not a team process conversation; use `performance-review`
- The user is asking about **incident response playbooks** or runbooks -- these are operational documents, not improvement ceremonies
- The user needs a **facilitation framework for a workshop** that is not retrospective-focused (user research synthesis, design sprint, strategy offsite); those have fundamentally different goals and structures

---

## Process

### Step 1: Gather Context Before Recommending Anything

Before selecting a format or writing a single prompt, understand the situation fully. The wrong format for the context will produce a worse retro than no format at all.

- **Team size:** Under 5 people is intimate -- everyone will share; over 10 people requires structural breaks into small groups or the loudest voices dominate. 12+ people should always use breakout groups.
- **Sprint/period being reviewed:** What actually happened? Did the team hit their goal? Was there a significant incident, a major delivery, a team member departure, a tech debt push? The format must be appropriate for what happened -- a timeline format makes no sense if the sprint was uneventful; it is essential if specific events need processing.
- **Remote, hybrid, or in-person:** Remote requires a digital collaboration board (Miro, FigJam, EasyRetro, Parabol, Retrium) with anonymous submission capability. Hybrid is the hardest format -- in-room participants have an unfair advantage in discussion; require everyone to use the digital board regardless of physical location.
- **Team maturity with retros:** Has this team never done a retro (start simple, spend time on ground rules), done retros but lost faith in them (focus on action item completion, not format novelty), or are they experienced practitioners who are bored (introduce a more sophisticated format)?
- **Previous action items:** Were last sprint's action items completed? Partially? Not at all? If a team's action items are consistently incomplete, the format is less the problem than the follow-through mechanism. Address that explicitly.
- **Time available:** The minimum viable retro is 45 minutes for a team of 5 or fewer. A standard sprint retro needs 60-75 minutes. Longer sprints (3-4 weeks), larger teams, or more complex situations need 90 minutes. Do not compress below 45 minutes -- you will cut the action item phase, which is the only part that produces change.
- **Specific context flags:** Ask whether there is anything the facilitator should know -- a team member leaving, a recent conflict, a major miss, management pressure, or a win worth celebrating. These shape tone and format selection dramatically.

---

### Step 2: Select the Retrospective Format

Format selection is not aesthetic -- it is diagnostic. Match the format to what the team needs to surface.

**For general sprint reflection (most common scenario):**
- **Start / Stop / Continue** -- The simplest and most durable format. Three columns. Everyone knows what to do. Use for new teams, time-constrained retros (under 60 min), or teams coming back from retro fatigue. Weakness: it tends to produce vague items.
- **What Went Well / What Needs Improvement / Action Items (WWW)** -- The classic format from XP teams. Nearly identical to Start/Stop/Continue in practice but less prescriptive. Good default.
- **4 Ls: Liked, Learned, Lacked, Longed For** -- Adds texture. "Lacked" and "Longed For" surface structural gaps that "What Needs Improvement" misses. "Learned" captures knowledge growth, which is a team health signal. Use when a team has done Start/Stop/Continue for 3+ retros in a row.

**For teams processing specific events or emotions:**
- **Mad / Sad / Glad** -- Emotion-first format. Lowers defenses because the team is categorizing feelings, not making arguments. Highly effective when a sprint involved visible stress, a team conflict, or a morale dip. Weakness: can feel soft to engineering-heavy teams; introduce it explicitly as a way to surface signal that process-only formats miss.
- **Energy Levels (the "Speedometer" check-in)** -- Not a full format, but a powerful signal: ask each person to rate their sprint energy 1-10 and explain why. Use this as a check-in activity in any retro, but especially in teams showing signs of burnout.
- **Timeline** -- Draw a horizontal line representing the sprint. Each team member marks high-energy moments and low-energy moments with sticky notes, then walk through them chronologically. Produces exceptional discussion of specific events rather than vague impressions. Use after a sprint with notable incidents, releases, or conflicts. Takes longer (plan 90 min minimum for 6+ people).

**For teams that are stuck or pessimistic:**
- **Sailboat (a.k.a. Speed Boat)** -- Draws a sailboat metaphor: wind (what propels the team), anchors (what slows the team down), rocks ahead (risks), and the island (the goal). The visual metaphor makes it easier for people to surface systemic problems because they are critiquing "the boat," not each other. Use when a team is in a rut, cynical, or struggling to see a path forward.
- **KALM: Keep, Add, Less, More** -- A refined version of Start/Stop/Continue. "Less" and "More" allow for nuance that "Stop" does not -- some things are not worth stopping entirely, just reducing. Use with experienced teams that find Start/Stop/Continue too binary.
- **Futurespective / Pre-Mortem variant** -- Instead of reviewing what happened, ask "What could go wrong in the next sprint?" and "What does a perfect next sprint look like?" Use when a team is stuck in retrospective fatigue -- looking backward has stopped producing insight, so look forward.

**For teams that have recently succeeded or are celebrating:**
- **Journey Lines** -- Each team member draws their personal emotional journey through the sprint as a line graph (high/low). More personal than the Timeline format. Use after major releases or end-of-project retrospectives to honor individual experiences. Takes 75-90 minutes.
- **Star / Wish** -- Simple two-column format: "Stars" (things worth celebrating and preserving) and "Wishes" (things to change). Use after a strong sprint when you want to reinforce what is working while still improving.

**Rotation rule:** Rotate the format every 3-5 retros. Using the same format beyond 5 retros in a row produces diminishing returns as the team stops genuinely reflecting and starts pattern-matching to what they wrote last time.

---

### Step 3: Design the Session Structure

A retro is not just a meeting with sticky notes. It has a specific flow that has been validated by decades of practice. Do not skip phases -- each one serves a distinct function.

**Phase 1: Set the Stage (5-10 minutes)**
- Open with a check-in activity, not a status report. The check-in serves two functions: it ensures every person speaks at least once in the first 5 minutes (dramatically increases participation throughout the rest of the session), and it calibrates the group's emotional starting point.
- Good check-in prompts: "One word to describe this sprint" / "Weather report for your current mood" / "On a scale of 1-10, how do you feel about this sprint?" / "What is one thing you want to get out of this retro?"
- Avoid check-ins that require more than 30 seconds per person -- they eat into the core session.
- State the **Retrospective Prime Directive**: "Regardless of what we discover, we understand and truly believe that everyone did the best job they could, given what they knew at the time, their skills and abilities, the resources available, and the situation at hand." -- Norman Kerth. This is not optional. It sets the psychological safety contract for the entire session.
- Review ground rules (or co-create them with a new team): focus on process not people, one conversation at a time, Vegas rule (what happens in retro stays in retro), all data is useful even if it is uncomfortable.

**Phase 2: Gather Data (10-15 minutes)**
- **Silent, individual writing comes first. Every time. No exceptions.** Before anyone speaks, everyone writes. Use sticky notes (physical or digital). This is the single most impactful facilitation practice in retrospectives because it eliminates anchoring bias -- the first person who speaks does not set the direction of everyone else's thinking.
- Allow 8-10 minutes of genuine silence. Facilitators often rush this phase -- resist that impulse.
- In remote sessions, digital boards (Miro, EasyRetro) with anonymous mode enabled allow people to write without social observation pressure. Turn on anonymous mode and turn it off only when sharing begins, if the team is comfortable.
- For a Timeline format, data gathering is collaborative rather than silent -- team members add events to a shared timeline. Add 5 minutes for this variant.

**Phase 3: Generate Insights (20-30 minutes)**
- After silent writing, share items on the board. In remote sessions, each person reads their own stickies aloud -- do not skip this, as vocalizing the item creates accountability and often sparks discussion.
- **Affinity mapping / clustering:** Group similar items together. The facilitator does the initial grouping and invites the team to correct it. Naming the clusters is itself a discussion -- "What do we call this group of items about missed handoffs and unclear ownership?"
- **Dot voting:** Each participant gets 3-5 votes (dots) to allocate across the board. They can place all votes on one item or spread them. Dot voting takes 2-3 minutes and surfaces the collective priority without a prolonged negotiation. For remote sessions, use digital voting tools built into Miro, FigJam, or EasyRetro.
- **Discuss the top 2-4 clusters only.** Do not attempt to discuss everything. Items that did not receive votes are noted in the record but not discussed live. Time-box each cluster discussion to 7-10 minutes maximum. Use a visible timer.
- **Apply Five Whys** to clusters that represent recurring problems: "Deployments are slow" → Why? "Tests take 45 minutes" → Why? "We run tests sequentially, not in parallel" → Why? "The pipeline was set up 3 years ago and nobody has prioritized refactoring it" → Now you have a root cause. First-order descriptions of symptoms almost never produce useful action items. Root causes do.
- **Distinguish between team-level solvable problems and escalation-needed problems.** Some issues (e.g., headcount decisions, budget constraints, cross-team dependencies) cannot be solved by the team in the next sprint. Create a separate "escalation needed" list and assign someone to bring it to leadership. Do not put escalation-needed items in the action item list -- they will never be completed and will erode trust in the retro process.

**Phase 4: Decide What to Do (10 minutes)**
- Generate action items ONLY from the top voted clusters. Do not create actions for unvoted items.
- Each action item must pass the SMART-O test before it is accepted:
  - **Specific:** "Add a 15-minute timeboxed sync to Tuesdays for cross-team dependency review" not "improve communication"
  - **Measurable:** How will the team know it is done? "Done when the calendar invite exists and the first meeting has occurred" is measurable.
  - **Achievable:** Can this team complete this in the next sprint? If it requires approval from outside, it is an escalation item.
  - **Relevant:** Does this action address the root cause identified, or does it address the symptom?
  - **Time-bound:** Due before the next retro. Vague timelines produce incomplete actions.
  - **Owned:** One named person is the owner. "The team" is not an owner. The owner is responsible for driving completion -- not necessarily doing all the work, but ensuring it gets done.
- **Hard cap: 3 action items maximum.** Research and extensive practitioner evidence consistently shows that teams completing 2 focused actions improve more than teams attempting 7 and abandoning most. If the team insists on more, use dot voting on the action candidates themselves and enforce the cap.

**Phase 5: Close the Retrospective (5 minutes)**
- Run a **retro on the retro** (ROTI -- Return on Time Invested): ask each person to rate the session 1-5 and give one word of feedback. This takes 2 minutes and provides invaluable signal about the health of the retro process itself.
- Summarize the 3 action items aloud, confirm owners and deadlines.
- Share notes within 24 hours. The faster notes are distributed, the more the team believes the retro matters.

---

### Step 4: Write the Reflection Prompts

Generic prompts produce generic reflections. Write prompts that are specific to the sprint context.

- **Anchor prompts to real events.** Instead of "What went well?" use "What process or practice helped us when [specific sprint event] happened?" Instead of "What needs improvement?" use "What made [the missed deadline / the deployment issue / the unclear requirements] harder to handle than it needed to be?"
- **Use at least one retrospective question from each of these dimensions:**
  - Process efficiency (did our working practices support us?)
  - Team collaboration (did we work well together? were there communication gaps?)
  - Technical health (did technical debt, tooling, or infrastructure affect the sprint?)
  - Product clarity (did we have the information we needed to build the right things?)
  - Individual energy (how did people feel?)
- **Write 1-2 prompts per column, not more.** More prompts produce analysis paralysis during the silent writing phase. One strong, specific prompt per column is enough.
- **For teams that say "everything is fine":** Use provocative prompts -- "What is the single most frustrating thing about working on this team right now?" or "If you were the engineering manager for a day, what is the first thing you would change?" These bypass social desirability bias.

---

### Step 5: Prepare Facilitator Moves for Difficult Moments

Every retro will encounter at least one challenging dynamic. Prepare responses in advance.

- **Silence after a question:** Wait a full 8 seconds before speaking. Silence feels longer to the facilitator than to the group. Filling silence prematurely prevents genuine reflection.
- **One person dominating:** "That's a useful perspective -- let's hear from someone who hasn't spoken yet." Redirect to a quieter participant by name: "[Name], what's your take on this cluster?"
- **Blame emerging:** Interrupt immediately and redirect: "Let's hold the who and focus on the what -- what about the process created conditions for this to happen?" Do not wait to see if it resolves itself.
- **Side conversations going remote:** Use the parking lot. Write the topic on a visible parking lot section of the board. "Great point -- I'm going to park that over here so we don't lose it and keep our time on the current cluster."
- **Team not generating any negatives (everything is fine):** This is almost always a psychological safety problem. Lower the stakes: switch to anonymous mode if remote. Use the Sailboat format's "anchors" or the 4Ls "Lacked" column because these feel less accusatory than "What went wrong?" Consider ending early and doing a 1:1 async survey instead -- a synchronous retro with low psychological safety is worse than no retro.
- **Decision not being reached on action items:** Use dot voting on the action candidates. If two items are tied, ask: "Which of these two will have a bigger impact on the sprint two weeks from now?" Force a concrete comparison rather than an abstract debate.

---

### Step 6: Handle Action Item Follow-Through

The retro produces no value if action items are not completed. The follow-through system matters as much as the session itself.

- **Add action items to the team's official task tracker** (Jira, Linear, Notion, GitHub Issues) immediately after the retro, not the next morning. Use the same tool the team uses for sprint work -- retro actions that live in a separate document are invisible and forgotten.
- **Create a dedicated "retro actions" label or tag** so the team can filter for them. This makes the review step at the next retro trivial -- filter by label, review status.
- **Assign story points or time estimates** to action items if the team uses estimation. Actions that have no capacity allocation in the sprint will not get done because sprint work will always take priority. Book the time.
- **At the start of the next retro, before doing anything else, review the previous action items.** Go through each one: Done / In Progress / Not Started. For "Not Started" items, ask exactly one question: "What got in the way?" The answer tells you whether the action was the wrong scope, the wrong owner, or the team lacked the time. This is retro improvement data.
- **If the same action item appears in 3 consecutive retros without completion**, it is either the wrong solution to the problem or a systemic issue beyond the team's control. Either escalate it or close it and accept the constraint.
- **Celebrate completed actions explicitly.** When a retro action is complete, call it out at the start of the next retro. This is the single most effective way to build team faith in the retrospective process. Teams that see their actions being completed take retros seriously. Teams that never see completion stop trying.

---

### Step 7: Build Long-Term Retrospective Health

A single well-run retro is useful. A consistently healthy retro practice is transformational. Guide users who want to build this.

- **Track themes across multiple retros.** Keep a running "recurring themes" log. If "unclear requirements" appears in 4 of the last 6 retros, that is a product-team collaboration problem, not a sprint problem.
- **Rotate the facilitator** every 3-5 retros. The team manager should rarely facilitate (their presence changes what people say). A rotating facilitator builds team ownership and develops facilitation skills across the team.
- **Vary the format** on a structured rotation rather than randomly. If the team knows the format is changing, they engage more thoughtfully. Announce the format one sprint in advance.
- **Run a quarterly retrospective on the retrospective process** (a meta-retro): Is the cadence right? Is the duration right? Is the format varied enough? Are action items being completed? Are the right people in the room?
- **Team health metrics:** Consider running structured health check surveys (based on Spotify's Squad Health Check model or similar) every 6-8 weeks. Compare health scores over time alongside retro themes. When health scores in a dimension (e.g., "delivering value," "easy to release") correlate with retro themes, you have validated improvement opportunities.

---

## Output Format

```
## Retrospective: [Team Name] -- [Sprint Number / Period / Date Range]

### Session Details
| Field         | Value                                                         |
|---------------|---------------------------------------------------------------|
| Date          | [Date]                                                        |
| Duration      | [X minutes]                                                   |
| Format        | [Format name -- e.g., 4Ls / Sailboat / Start-Stop-Continue]  |
| Facilitator   | [Name -- not the manager if possible]                         |
| Participants  | [Names or count, role breakdown if cross-functional]          |
| Tool          | [Miro / FigJam / EasyRetro / Parabol / physical board]        |
| Sprint Goal   | [What the team committed to this sprint]                      |
| Sprint Result | [Did they hit the goal? Key metrics or outcomes]              |

---

### Ground Rules
1. Prime Directive: "Everyone did the best job they could, given what they knew at the time."
2. Focus on process and systems, not individuals.
3. Vegas rule -- retro discussions stay within the team.
4. One conversation at a time; respect the time-box.
5. All perspectives are valid; quieter voices are actively invited.
6. The goal is actionable improvement, not venting or blame.

---

### Previous Action Items Review

| Action                         | Owner  | Due Date | Status           | Outcome / Blocker             |
|--------------------------------|--------|----------|------------------|-------------------------------|
| [Action from last retro]       | [Name] | [Date]   | Done / In Progress / Not Started | [What happened]  |
| [Action from last retro]       | [Name] | [Date]   | Done / In Progress / Not Started | [What happened]  |

**Completion rate this sprint:** [X of Y actions completed]
**Pattern note:** [Any theme in what got completed vs. what didn't]

---

### Agenda

| Time         | Phase              | Activity                                                              | Duration |
|--------------|--------------------|-----------------------------------------------------------------------|----------|
| 0:00         | Set the Stage      | Check-in: [specific prompt]                                           | 5 min    |
| 0:05         | Set the Stage      | Prime Directive + Ground Rules                                        | 3 min    |
| 0:08         | Set the Stage      | Previous action item review                                           | 5 min    |
| 0:13         | Gather Data        | Silent individual writing: [format-specific prompts]                  | 10 min   |
| 0:23         | Generate Insights  | Share items, facilitator clusters, dot voting (3 votes each)          | 10 min   |
| 0:33         | Generate Insights  | Discuss top [2-3] clusters -- Five Whys for root causes, time-boxed   | 20 min   |
| 0:53         | Decide What to Do  | Generate action items (max 3), assign owners, set due dates           | 7 min    |
| 1:00         | Close              | ROTI check, summarize actions, confirm notes will be shared today     | 3 min    |

---

### Reflection Prompts ([Format Name])

**[Column/Category 1 -- e.g., "Liked"]:**
> [Specific prompt tied to the sprint context, not a generic question]

**[Column/Category 2 -- e.g., "Learned"]:**
> [Specific prompt tied to the sprint context]

**[Column/Category 3 -- e.g., "Lacked"]:**
> [Specific prompt tied to the sprint context -- push toward root causes]

**[Column/Category 4 -- if applicable, e.g., "Longed For"]:**
> [Specific prompt tied to the sprint context]

**Optional deeper dive prompt (use if discussion stalls):**
> [Provocative follow-up question if the team is not generating insight]

---

### Facilitator Discussion Guide

**Opening each cluster discussion:**
- "Who wrote this item? Can you give us a specific example from this sprint?"
- "Does anyone have a different experience of this situation?"

**Driving toward root cause (Five Whys sequence):**
1. "[Cluster theme] -- why did this happen?"
2. "And why was that the case?"
3. "What underlying condition made that possible?"
4. "If we changed [root cause], would this problem go away, or would it resurface through a different symptom?"

**Generating action items:**
- "Given this root cause, what is the smallest change we could make in the next sprint that would meaningfully address it?"
- "Who is the right person to own this -- meaning they have the context, influence, and capacity to drive it?"
- "How will we know this action is complete? What would we see or be able to measure?"

**Redirecting blame or personal criticism:**
- "Let's hold the who and focus on the what -- what in our process or environment created conditions for this?"
- "What would we change so that even a new team member wouldn't run into this problem?"

---

### Action Items

| # | Action                         | Root Cause Addressed        | Owner  | Due Date        | Definition of Done                          |
|---|--------------------------------|-----------------------------|--------|-----------------|---------------------------------------------|
| 1 | [Specific, concrete action]    | [Which cluster it addresses] | [Name] | [Sprint end / specific date] | [Observable, verifiable outcome] |
| 2 | [Specific, concrete action]    | [Which cluster it addresses] | [Name] | [Sprint end / specific date] | [Observable, verifiable outcome] |
| 3 | [Specific, concrete action -- optional] | [Cluster] | [Name] | [Date] | [Observable outcome]             |

**Escalation items (require action outside the team):**
| Item                           | Who Needs to Act       | Owner of Escalation | Target Date |
|--------------------------------|------------------------|---------------------|-------------|
| [Issue requiring mgmt/cross-team action] | [Stakeholder] | [Name] | [Date]      |

---

### Facilitator Notes (Internal -- Not Shared With Team)

**Energy / psychological safety observations:**
[What was the energy level in the room? Who participated actively? Who was quiet? Any tension?]

**Themes to watch in future retros:**
[Any item that appeared but did not get voted up -- worth watching to see if it recurs]

**Format recommendation for next retro:**
[Why, given how this retro went]

**ROTI scores:**
[Scores from the end-of-session check -- use to track retro health over time]
```

---

## Rules

1. **Never skip the silent writing phase.** Group discussion without individual silent writing first produces anchoring bias -- the first 2 people to speak set the direction for all subsequent contributions. Silent writing is not optional even under time pressure. If you have only 45 minutes, cut the check-in to 2 minutes, not the writing phase.

2. **The Prime Directive is mandatory, not optional.** Every session opens with it. Teams that skip it trend toward blame within 10 minutes of unstructured discussion. If the team has heard it many times and treats it as rote, ask them to apply it to a specific moment from the sprint: "Using the Prime Directive, how do we think about [the missed deadline]?"

3. **Hard cap of 3 action items.** This is not a suggestion -- it is the single most evidence-supported rule in retrospective practice. Teams that consistently complete 2-3 actions per sprint produce compounding improvement. Teams that generate 6-8 actions complete 1-2 of them and lose faith in the process. If a user pushes back on the cap, explain that choosing fewer actions is itself a prioritization exercise that produces better alignment.

4. **Every action item must have a single named owner.** "The team," "everyone," or "TBD" are not acceptable owners. The owner does not have to do all the work -- they are accountable for ensuring it happens. If no one is willing to own an action, that is important signal: either the team does not believe in the action, or no one has capacity, or the problem requires escalation.

5. **Separate escalation items from action items.** When an identified problem requires resources, decisions, or authority the team does not have, it must be explicitly labeled as an escalation item with a named escalation owner, not buried in the action item list where it will never get done.

6. **Do not facilitate the retro yourself if you are the engineering manager or direct manager of the participants.** This is not about capability -- it is about dynamics. Team members self-censor with their manager in the room as facilitator. Recommend a rotating facilitator, a peer facilitator from a different team, or an Agile coach. The manager should participate as a full team member.

7. **Review previous action items at the start of every retro, before any new reflection.** Skipping this step sends the message that the retro is a one-way process -- people give feedback but nothing changes. Even if 0 of 3 actions were completed, that is important data to discuss, not to hide.

8. **Time-box every discussion cluster.** Without a visible timer and enforced time-boxes, teams spend 60% of available time on the first item they discuss. Set a timer (7-10 minutes per cluster), announce it to the team, and enforce it. Use a parking lot for overflow discussion.

9. **If the same theme appears in 3+ consecutive retros as a high-vote item, stop treating it as a retro action and escalate or accept it.** Recurring unresolved themes indicate either systemic organizational problems beyond the team's control, actions that were too vague to complete, or a mismatch between identified root cause and chosen action. Addressing recurring themes directly -- "We have raised this four times and not resolved it -- what is actually blocking us?" -- is more valuable than generating a fifth action item.

10. **Match the format to the team's emotional state, not just their process state.** A team that just had a brutal sprint needs space to express frustration before they can engage in process analysis. Mad/Sad/Glad or a feelings-first check-in is not soft -- it is the functionally correct choice for emotional processing. Teams that try to skip emotional reality and jump straight to "what do we fix?" produce shallow actions that do not address why people were actually struggling.

11. **ROTI (Return on Time Invested) scoring at the end of every session is non-negotiable for facilitators tracking retro health.** Ask each person to rate the session 1-5 and give one word of feedback. Track ROTI scores over time. A declining ROTI trend (e.g., 4.2 → 3.8 → 3.1 over three retros) is an early warning system for retro fatigue -- change the format, the facilitator, or the structure before the team checks out entirely.

12. **Distribute retro notes within 24 hours, not "later this week."** The speed of distribution signals the importance of the session. Notes that arrive 3 days later, after the team has started the next sprint and mentally moved on, are treated as noise. Add action items to the task tracker the same day as the retro.

---

## Edge Cases

### Remote or Distributed Teams

Remote retros require more structural scaffolding than in-person retros because the natural social cues that regulate participation (eye contact, body language, physical presence) are absent.

- Use a digital collaboration board with real-time sticky note functionality. Miro and FigJam are the most capable tools; EasyRetro and Parabol are purpose-built for retros and have built-in voting and timer features that reduce facilitation overhead.
- Enable anonymous submission mode during the writing phase. Anonymous mode significantly increases psychological safety for distributed teams where cultural or power dynamics vary across time zones and locations. Turn anonymous mode off when discussion begins -- people need to be able to ask clarifying questions to the author.
- Do not put remote participants on a single screen in a hybrid scenario where some people are in a meeting room. Every participant -- including in-room participants -- must use the digital board on their own device. Otherwise the in-room subgroup will have side conversations that exclude remote participants.
- Use breakout rooms for teams of 8+ in the Generate Insights phase. Groups of 3-4 have richer discussions than groups of 10-12 in video calls. Each breakout group shares their top 2 items with the full group when reconvening.
- Build in 2-3 extra minutes of buffer for technical issues (screen sharing problems, audio lag, late joiners). Announce the format and board URL in the meeting invite so participants can access it before the session starts.
- For teams spanning 3+ time zones, consider async-first retros: the digital board stays open for 48 hours for silent writing, then the team meets for a 45-minute sync session covering only the Discussion and Action Item phases. This reduces time zone pressure and produces more thoughtful contributions than forcing everyone into a 60-minute window at an inconvenient hour.

---

### Brand New Team (First Retrospective)

The first retro for a new team is not primarily about generating action items -- it is about building the habit and establishing psychological safety.

- Use Start / Stop / Continue exclusively. Do not introduce a more complex format for a first retro regardless of how engaging it might seem. New teams need to understand the structure of retrospective thinking first.
- Spend 10 minutes (not 3 minutes) on the Prime Directive, ground rules, and what a retrospective is for. Many team members have never been to a well-run retro -- they associate the word with unproductive complaint sessions or blame events. Reframe it explicitly: "This is a meeting that is entirely about making our work better. Nothing said here leaves this room, and nothing is about any individual."
- Keep the session to 45 minutes. The goal is a positive first experience -- a tight, focused retro that produces 1-2 concrete actions is more valuable than a sprawling 90-minute session that feels exhausting.
- Generate only 1-2 action items. Set that expectation up front. "We will leave with 1 or 2 specific things to try before the next sprint -- not a long list."
- Close with explicit positive framing: "You just ran your first retro. That is already more reflection than most teams do."

---

### Team in Visible Conflict or with Low Psychological Safety

A retro with low psychological safety is not just ineffective -- it can actively worsen team dynamics if conflict is surfaced without structure.

- Do not run a synchronous retro if the team has active interpersonal conflict between specific individuals that has not been addressed in 1:1 settings. A retro is for team process improvement, not conflict resolution. Address the interpersonal issue separately (with HR or management involvement if needed) before running the retro.
- For teams with low-but-not-explosive psychological safety, use structural techniques: anonymous digital submissions, the Sailboat format (which externalizes problems onto "the boat" rather than onto people), or a pre-retro 1:1 check-in by the facilitator with each participant to understand concerns before the group session.
- Bring in an external facilitator -- someone outside the team (an Agile coach, a neutral peer lead, or even a senior engineer from a different team). An external facilitator cannot be blamed for the outcome and signals to the team that the process is taken seriously.
- Use the "lean coffee" format if the team is reluctant to engage: team members propose topics, vote on them, and discuss in 5-minute timeboxed blocks. This gives the team control over the agenda and reduces facilitator authority as a perceived threat.
- At the end, explicitly name that the session required courage: "I want to acknowledge that this was not an easy conversation. Thank you for engaging honestly."

---

### Team Whose Action Items Are Consistently Not Completed

If a team reviews previous actions and finds completion rates below 50% for 3+ consecutive retros, the problem is not the retro format -- it is the action item system.

- Run a dedicated mini-retro on the retro actions themselves: "What gets in the way of our actions being completed?" Common root causes: actions are too vague, actions require capacity that is never budgeted into the sprint, no one adds actions to the sprint board, the owner forgets because there is no reminder mechanism.
- Shift to a "one action per retro" rule for 3 sprints. This sounds reductive but it forces genuine prioritization and builds the completion habit. One reliably completed action per sprint outperforms five abandoned ones by every measure.
- Add retro actions to the sprint backlog as first-class sprint work items, with estimates, acceptance criteria, and sprint capacity allocated. Actions that are tracked in a separate document are invisible to the sprint process and will always lose to sprint work. Actions on the sprint board compete for attention and get done.
- Reduce action scope aggressively. "Write a proposal for a new deployment pipeline" is too big. "Spend 2 hours researching CI/CD options and bring a recommendation to the next retro" is completable in a sprint.

---

### Large Team (12+ People)

Retrospectives with more than 10-12 participants produce group dynamics that break the core facilitation model -- too many items, too little airtime per person, dominant voices drown quieter ones.

- Break into functional subgroups of 4-5 people for the Gather Data and Generate Insights phases. Subgroups can be cross-functional (mixing roles) or functional (engineers together, designers together) depending on the sprint goals. Cross-functional groups tend to surface more systemic issues; functional groups tend to surface more role-specific issues.
- Each subgroup selects their top 2 themes (by dot voting within the subgroup) and shares them with the full team. The full team then dot-votes across all shared themes to identify the 3-4 to discuss together.
- Full-team discussion should be limited to themes that genuinely require cross-functional awareness. Role-specific actions can be owned and tracked by the relevant subgroup.
- Increase time allocation: a 12-person retro needs 90 minutes minimum. A 20-person retro needs 2 hours or should be split into functional team retros with a separate cross-team synthesis session.
- Consider a "fishbowl" discussion format for the Generate Insights phase: 4-5 people discuss in the center while others observe, then rotate. This structures turn-taking without requiring the facilitator to manage 12+ simultaneous voices.

---

### Post-Project or Release Retrospective (Not Sprint-Cadence)

A retrospective run after a multi-month initiative, a major release, or a program increment has different dynamics than a sprint retro. The time horizon is longer, the scope of discussion is broader, and the emotional stakes are higher.

- Use the **Journey Lines** or **Timeline** format -- both are designed for longer time horizons and produce richer discussion of the arc of a project than a simple Start/Stop/Continue.
- Increase the data gathering time to 20-25 minutes and allow participants to write multiple items per category. A 3-month project has 10x more data points than a 2-week sprint.
- Structure the discussion around phases of the project (kickoff, mid-project, delivery) rather than categories (what went well / what didn't). This produces more specific and actionable insights.
- Post-project retros should produce strategic recommendations -- "next time we do a project of this scope, what would we change about our planning, staffing, tooling, or process?" These are higher-stakes than sprint actions and should be documented formally and reviewed when the next similar project is scoped.
- Invite stakeholders (product managers, key business stakeholders) into part of the session -- specifically the "what could we have done better together" phase. Having stakeholders in the room for this phase dramatically improves cross-functional learning. Do not include them in the team-internal phases.
- Allow 90-120 minutes for a project retro covering 1-3 months of work. Under 90 minutes for a major project is insufficient to honor what the team went through.

---

### Team with Retro Fatigue (Retros Feel Pointless)

Retro fatigue is one of the most common and dangerous patterns in agile teams. It manifests as low energy, minimal participation, sarcastic or cynical comments, and the persistent sense that "nothing ever changes."

- Run a direct diagnosis session: "We're going to spend 5 minutes talking about our retrospective process itself. What would make this time more valuable?" This interrupts the cycle of going through the motions by naming it.
- Check the action item completion rate -- this is the most common root cause. Teams that see change believe in the process. Teams that have had 6 consecutive retros with no completed actions have rational reasons for disengagement.
- Introduce a fundamentally different format -- not just a variation of Start/Stop/Continue, but something structurally different like a **pre-mortem / futurespective**: "Imagine it's 3 months from now and this team is the highest-performing team in the organization. What did we change to get there?" Orienting toward the future bypasses the exhaustion of reviewing the same past problems.
- Temporarily reduce retro frequency if the team is in a high-intensity delivery phase. Running a 60-minute retro every week when the team is under extreme deadline pressure produces resentment, not improvement. Switch to bi-weekly retros and spend 10 minutes of each sprint planning on reviewing the one retro action in progress.
- Consider a "skip and replace" move: skip one retro and use the time for a team social or informal coffee chat. Sometimes the best retro is an informal conversation over lunch that rebuilds team connection. Come back to the formal retro the following sprint with explicit reframing of why it matters.

---

## Example

**Input:**
"I need to run a retro for my 7-person cross-functional product team (3 engineers, 2 designers, 1 product manager, 1 data analyst) after a 2-week sprint. We shipped a major feature on time but the process was chaotic -- last-minute design changes happened 3 days before launch, engineers and designers were in conflict about the timing, and the data analyst wasn't looped in until the final day, which caused a last-minute instrumentation scramble. The team is remote. We've done retros before but they tend to lose energy about halfway through. Previous action items were: (1) Add a design review checkpoint at day 5 of each sprint -- not done; (2) Include analytics requirements in the ticket acceptance criteria -- partially done (3 of 8 tickets had it). We have 75 minutes."

---

**Output:**

## Retrospective: Product Team -- Sprint 22

### Session Details
| Field         | Value |
|---------------|-------|
| Date          | [Date of retro] |
| Duration      | 75 minutes |
| Format        | 4Ls -- Liked, Learned, Lacked, Longed For |
| Facilitator   | [Rotate -- suggest the data analyst or a designer this sprint, not the PM] |
| Participants  | 7 (3 engineers, 2 designers, 1 PM, 1 data analyst) |
| Tool          | Miro -- 4-column board with anonymous sticky notes enabled during writing |
| Sprint Goal   | Ship [Feature Name] to production |
| Sprint Result | Shipped on time -- but late design changes, engineering/design conflict, and analytics scramble in final days |

---

### Ground Rules
1. Prime Directive: "Everyone did the best job they could, given what they knew at the time, their skills and abilities, the resources available, and the situation at hand."
2. We focus on process and systems -- not individuals. We are not naming who was responsible; we are asking what process gaps allowed this to happen.
3. Vegas rule -- this conversation stays in this team.
4. One conversation at a time; use the raise hand feature if you want to add to a thread.
5. All perspectives are valid; the facilitator will actively invite quieter voices.

---

### Previous Action Items Review

| Action | Owner | Due Date | Status | Outcome / Blocker |
|--------|-------|----------|--------|--------------------|
| Add design review checkpoint at sprint day 5 | [Designer Lead] | Sprint 22 end | Not done | Calendar invite was not created; sprint work took priority |
| Include analytics requirements in ticket acceptance criteria | [PM] | Sprint 22 | Partially done | Done for 3 of 8 tickets -- applied to new tickets created after the first week but not retroactively to existing ones |

**Completion rate: 0 of 2 fully completed (1 partially).** This is worth naming directly at the start: "We have two actions from last retro. One was not started -- let's briefly discuss why before we move into reflection. The other was partially done, which is progress." Do not skip this. It is directly related to the pain felt during Sprint 22.

---

### Agenda

| Time | Phase | Activity | Duration |
|------|-------|----------|----------|
| 0:00 | Set the Stage | Check-in: "One word for how Sprint 22 felt" -- everyone answers, no discussion | 5 min |
| 0:05 | Set the Stage | Prime Directive + Ground Rules + brief note on why format matters today | 3 min |
| 0:08 | Set the Stage | Previous action item review -- name completion rate, ask "what got in the way of the day-5 checkpoint?" | 7 min |
| 0:15 | Gather Data | Silent individual writing on 4L Miro board (anonymous mode on) | 12 min |
| 0:27 | Generate Insights | Facilitator clusters items live; team confirms groupings (2 min); dot voting (3 votes each) | 8 min |
| 0:35 | Generate Insights | Discuss top 3 clusters -- Five Whys for each, 10 min per cluster | 30 min |
| 1:05 | Decide What to Do | Generate 2-3 action items -- SMART-O test each one, assign owners | 7 min |
| 1:12 | Close | ROTI check (1-5 score + one word), summarize actions, confirm notes shared today | 3 min |

---

### Reflection Prompts (4Ls)

**Liked:**
> "What about how we worked together -- or a specific practice, tool, or interaction -- made this sprint more effective? What would you not want to lose even as we make changes?"

**Learned:**
> "What did this sprint teach us -- about our process, our craft, our cross-functional collaboration, or our users -- that we did not know at the start of Sprint 22?"

**Lacked:**
> "What information, alignment, structure, or resource was missing that would have made the last-minute scramble avoidable? Be specific -- name the point in the sprint where the absence first became a problem."

**Longed For:**
> "If one thing about how we work together could be permanently different by Sprint 24, what would it be?"

**Deeper dive prompt (use if discussion stalls or generates only surface items):**
> "Imagine it's Sprint Day 12 at 4pm -- three days before launch -- and there are no surprises, no conflicts, no scrambles. What is different about how we worked in Sprints 1-9 of that imagined sprint compared to what actually happened in Sprint 22?"

---

### Facilitator Discussion Guide

**Expected clusters based on the sprint context (pre-loaded knowledge -- do not share with team, use to recognize themes):**

The following clusters are likely to emerge based on the sprint description. The facilitator should be prepared to apply Five Whys to each:

1. **Design-engineering handoff timing** -- Late design changes on day 9 of a 10-day sprint suggests the design review process is not integrated into the sprint calendar. The uncompleted day-5 checkpoint action from last retro is directly related. Five Whys: Why did design changes happen on day 9? → Because the design was not locked until then. → Why was it not locked earlier? → Because the design review checkpoint was not scheduled. → Why was it not scheduled? → Because no one owned the calendar invite. → Root cause: Actions are being created without a clear owner and without being tracked in the sprint board as actual work items.

2. **Analytics inclusion timing** -- Data analyst looped in on the final day, causing instrumentation scramble. Partially completed action (analytics requirements in acceptance criteria) correlates with this. Five Whys: Why was the analyst looped in on the last day? → Because the ticket acceptance criteria did not include analytics requirements for most tickets. → Why not? → Because the PM only added them to new tickets, not existing ones. → Why only new tickets? → Because updating existing tickets felt like extra work mid-sprint. → Root cause: Analytics requirements are treated as optional add-ons, not as part of the definition of done.

3. **Cross-functional conflict around crunch** -- Engineering and design conflict about timing is a psychological safety signal. This should be addressed as a process issue: "What process change would have meant the design changes were visible earlier, removing the time pressure that created conflict?"

**Opening each cluster discussion:**
- "Who wrote the items in this cluster? Can you walk us through what you were thinking about -- specifically what happened, not in general?"
- "Does anyone have a different experience of this situation, or something to add?"

**Driving toward root cause:**
1. "Why did [cluster theme] happen in Sprint 22?"
2. "What condition made that inevitable given how we work?"
3. "If we removed or changed [that condition], would this cluster disappear or just reappear in a different form?"

**Redirecting blame:**
If someone says: "The design changes were too late and it caused the engineers to have to redo work" -- redirect: "What in our process would have made the design stable earlier? What would a sprint look like where this couldn't happen?"

**Connecting to previous actions:**
At some point, someone will likely notice the connection to the uncompleted day-5 checkpoint action. If they do not: "I want to connect this to something -- we had a day-5 checkpoint as an action from last retro that wasn't created. Does this cluster tell us whether that was the right action, the wrong action, or a right action that failed to launch because of how we tracked it?"

---

### Action Items

Based on the likely root causes, well-formed action items for this retro:

| # | Action | Root Cause Addressed | Owner | Due Date | Definition of Done |
|---|--------|---------------------|-------|----------|--------------------|
| 1 | Create a recurring calendar event for Sprint Day 5 design review (60 min, required attendees: all designers, PM, lead engineer) -- today, before this retro notes go
