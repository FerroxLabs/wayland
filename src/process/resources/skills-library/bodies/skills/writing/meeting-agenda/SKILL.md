---
name: meeting-agenda
description: |
  Creates structured meeting agendas with timed topics, objectives per item,
  pre-read materials, and expected outcomes to ensure productive meetings. Use
  when the user needs to prepare for a meeting, organize discussion topics, or
  set a meeting structure. Do NOT use for meeting notes after a meeting (use
  `meeting-notes`), status updates (use `status-update`), or project planning
  documents (use `project-proposal`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "writing business-writing planning"
  category: "writing"
  subcategory: "business-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Meeting Agenda

## When to Use

Use this skill when any of the following are true:

- The user is preparing for an upcoming meeting and wants a structured agenda -- whether it is a 15-minute standup, a 90-minute executive review, or a full-day offsite
- The user has a list of topics to cover and needs help sequencing, time-boxing, and assigning ownership to each one
- The user wants to circulate pre-meeting materials and needs a document that packages purpose, preparation, and structure together
- The user is planning a recurring meeting and wants to establish or refresh a standing agenda template
- The user needs to facilitate a group decision and wants the agenda to enforce productive deliberation rather than open-ended wandering
- The user is organizing a workshop, sprint planning session, retrospective, or stakeholder review that requires a facilitated structure with clear objectives per segment
- The user says things like "I have a meeting Thursday and I don't know how to structure it," "Can you help me plan out this discussion," or "I need an agenda for..."

**Do NOT use this skill when:**

- The meeting has already happened and the user wants to capture what was discussed -- use `meeting-notes` instead
- The user wants a weekly status report sent to stakeholders -- use `status-update` instead
- The user is defining the scope, deliverables, and timeline for a new project -- use `project-proposal` instead
- The user wants a detailed facilitation guide with exercises, breakout instructions, and facilitator scripts for a workshop -- this is a facilitation guide, not an agenda; the agenda is an input to that process
- The user wants to write a communication to announce a meeting -- that is a calendar invite or meeting brief, not an agenda
- The user wants to document a decision that was made -- use a decision log or `meeting-notes`
- The user needs a training session outline -- that is a lesson plan, which has a different structure


## Process

### Step 1: Gather Meeting Context Before Writing Anything

Do not generate an agenda without understanding what the meeting is actually for. Ask the user directly if any of these are missing:

- **Meeting title and stated purpose:** What is this meeting trying to accomplish? One sentence.
- **Date, time, timezone, and total duration:** Duration is the single most important constraint -- it determines how many topics are realistic.
- **Attendees and their roles:** Not just names, but why each person is in the room. This determines what decisions can be made, who owns what, and whether the right people are present.
- **Topics the user wants to cover:** Even a rough, unordered brain dump is enough to start.
- **Decisions that must be made by end of meeting:** Decisions drive the meeting type and sequencing logic.
- **Decisions or discussions that can wait:** Knowing what to exclude is as important as knowing what to include.
- **Pre-read materials already identified:** Documents, data, or context attendees should review before arriving.
- **Any hard constraints:** A participant who must leave at a specific time, an action that depends on this meeting's output, or a prior decision that frames the discussion.

If the user provides only a vague request (e.g., "team meeting Wednesday"), ask: "What is the one thing that must be decided or accomplished before everyone leaves this meeting?" The answer to that question determines the entire agenda structure.

### Step 2: Classify the Meeting Type

Every meeting belongs to one of five functional types. The type determines the structure, pacing, and facilitation approach. Misidentifying the type is the most common cause of unproductive meetings.

- **Decision meeting:** The primary output is a written decision. Requires context-setting, structured deliberation, and explicit closure. Attendees must include everyone whose input is required AND everyone who will be accountable for executing the outcome. The decision owner must be in the room or on the call.
- **Information-sharing meeting:** One or more people deliver updates to the rest. The risk is passive listening without retention. Use a strict time box per presenter. Always end with Q&A and explicit "what does this change for you?" prompts. If no action follows from the information, consider whether email or async video would serve better.
- **Problem-solving / working session:** The group actively generates or evaluates solutions to a defined problem. Requires a divergent phase (generating options without judgment) followed by a convergent phase (evaluating and selecting). Without this structure, groups anchor on the first idea mentioned.
- **Alignment meeting:** No new decisions, but the group needs to reach shared understanding -- for example, after a strategy change, before a launch, or when teams are working from inconsistent assumptions. The objective is agreement, not debate.
- **Recurring sync (standup / weekly / monthly):** Standing format, fixed attendees, predictable structure. Time boxes are short and strict. The risk is that these become status theater. Every recurring item should pass the "would we email this instead?" test. Items that pass fail to belong on the recurring agenda.

A single meeting can blend types -- for example, 20 minutes of information sharing followed by 30 minutes of decision-making -- but one type must be primary, and it dictates the ordering logic.

### Step 3: Audit and Curate the Topic List

Users almost always bring more topics than time allows. Before allocating any minutes, run each proposed topic through this filter:

- **Can this be resolved asynchronously?** If yes, remove it and flag it to the user. A Slack message, a shared doc comment, or a short Loom video resolves most status updates without a meeting.
- **Does this topic require real-time group interaction?** If it is purely informational and requires no reaction, it belongs in a pre-read or follow-up email.
- **Is there a decision or action attached?** Topics without a desired outcome waste group time. Every agenda item must have a verb: decide, review, approve, generate, prioritize, or align on.
- **Does this topic depend on another topic being resolved first?** Identify dependencies to sequence topics correctly.
- **Who is required for this topic?** If a topic only involves two of the seven attendees, consider whether it should be a separate meeting or a sidebar, not a block on the main agenda.

After filtering, rank remaining topics by: (1) decision criticality, (2) dependency order, and (3) energy required. High-stakes decisions requiring full cognitive load go early. Updates and approvals go in the middle. Open-ended brainstorming goes last.

### Step 4: Allocate Time Realistically

Time allocation is where most agendas fail. Apply these heuristics:

- **Opening and framing:** Always 5 minutes, never skipped. This is where the facilitator states the objective, confirms who is in the room, and surfaces any last-minute conflicts (e.g., someone has hard stop at 45 minutes).
- **Closing and action items:** Always 5 minutes at the end. If the meeting runs long, protect this slot by cutting content -- never cut the close.
- **Buffer:** Never schedule more than 80% of available time with content. A 60-minute meeting has 50 minutes of content capacity after opening and close. A 90-minute meeting has 72 minutes of usable content time. Discussion always expands; calendars do not.
- **Decision items:** Double your first estimate. A decision that feels like a 10-minute item typically takes 20 minutes when you account for context questions, dissent, and verbal confirmation of what was decided.
- **Information items:** These compress well. A 10-minute presentation is genuinely 10 minutes if the presenter stays on track. Protect by naming a timekeeper.
- **Brainstorming items:** These need a minimum viable floor. Fewer than 15 minutes produces nothing useful because the first 5 minutes is warm-up, the next 5 is surface-level ideas, and the real insights emerge in minutes 10--15.
- **Group size multiplier:** Add 2 minutes of discussion time per additional attendee above 4. A topic that takes 10 minutes with 4 people takes 14 minutes with 6 people and 18 minutes with 8 people.

### Step 5: Sequence Topics for Maximum Group Effectiveness

Meeting science is clear on sequencing: decisions degrade as cognitive load increases, energy peaks in the first 30 minutes of a meeting, and groups become risk-averse as meetings approach their end time.

Apply this sequencing logic:

1. **First slot (minutes 0--5):** Opening -- align on objective and confirm any constraints (hard stops, missing attendees, changed context).
2. **Second slot:** The highest-stakes decision or the item that is a dependency for everything else. This is when the group has the most energy and the most time remaining for unexpected debate.
3. **Middle slots:** Secondary decisions, approvals, and information items in order of dependency. Place items that require the full group before items where some attendees are optional.
4. **Late-middle slot:** Brainstorming or open discussion. This benefits from the context established earlier and tolerates slightly lower energy.
5. **Final content slot:** Items that can be resolved quickly -- simple approvals, brief updates, scheduling follow-ups.
6. **Last slot (final 5 minutes):** Action items, owners, due dates, and next steps. This is mandatory, not optional.

Never put the most important item last. Studies of meeting behavior show that groups under time pressure rush decisions, accept vague language, and leave without confirmed owners.

### Step 6: Write Objective-Level Clarity for Each Agenda Item

Each agenda item must have four elements defined before the agenda is distributed:

- **Objective type:** One of four -- Decide (a specific choice will be made), Inform (knowledge will be transferred), Discuss (structured exchange of perspectives, leading to a future decision), or Align (confirm shared understanding of an existing decision or direction). Do not use "Discuss" as a catch-all -- if discussion is on the agenda, name what it is building toward.
- **Item owner:** The person who leads that section. This is not necessarily the most senior person -- it is the person who prepared the material and can answer questions. The owner is responsible for keeping the item within its time box.
- **Decision framing (if applicable):** If the item type is Decide, write out the exact decision question in advance. "Should we delay the Q3 launch by 4 weeks given the engineering capacity report?" is a good decision question. "Discuss launch timing" is not.
- **Pre-read or preparation:** Specify exactly what attendees should review, and give them the page numbers or sections if the document is long. "Read the Q2 report" fails. "Review pages 4--7 of the Q2 report: retention and churn sections" succeeds.

### Step 7: Format and Distribute

The final agenda should be formatted for both readability and function:

- **Use a table for the time-block view.** Visual scanning lets attendees see the full meeting at a glance, including where transitions happen.
- **Use a narrative section for each topic.** The table row gives time and type; the narrative section gives context, decision question, and pre-read details.
- **State the meeting objective at the top in one sentence.** This sentence answers: "What will be different after this meeting ends?"
- **Include a parking lot section.** Every facilitated meeting generates off-topic items. The parking lot captures them without derailing the agenda, and signals to attendees that their input is valued even if it does not fit this meeting.
- **Distribute at least 24 hours in advance for routine meetings; 48--72 hours for executive or cross-functional meetings.** Anything distributed less than 2 hours before the meeting is not a pre-read -- it is a surprise.
- **For recurring meetings,** include a "changes from last meeting" note at the top if the agenda has been modified from the standing template.


## Output Format

```
## Meeting Agenda: [Meeting Title]

**Date:** [Day, Month DD, YYYY -- Time -- Timezone]
**Duration:** [Total minutes]
**Location / Link:** [Room name or video conference URL]
**Organizer:** [Name and role]
**Distribution:** [Date and time the agenda was sent]

---

**Meeting objective:** [One sentence: what specific outcome will exist when this meeting ends that does not exist now]

**Meeting type:** [Decision / Information-sharing / Working session / Alignment / Recurring sync]

---

### Attendees

| Name | Role | Attendance |
|------|------|------------|
| [Name] | [Title -- reason they are needed] | Required |
| [Name] | [Title -- reason they are needed] | Required |
| [Name] | [Title -- reason they are needed] | Optional |

---

### Pre-Read Materials

| Document | Owner | Where to Find It | What to Focus On |
|----------|-------|-----------------|------------------|
| [Document name] | [Who prepared it] | [Link or attachment] | [Specific sections or questions to answer] |
| [Document name] | [Who prepared it] | [Link or attachment] | [Specific sections or questions to answer] |

*Preparation time estimate: approximately [X] minutes*

---

### Agenda

| Start Time | Topic | Owner | Type | Duration |
|------------|-------|-------|------|----------|
| [HH:MM] | Opening: objectives and constraints | [Facilitator] | Align | 5 min |
| [HH:MM] | [Topic 1 -- decision or high-stakes item] | [Owner] | Decide | [X] min |
| [HH:MM] | [Topic 2] | [Owner] | [Decide/Inform/Discuss/Align] | [X] min |
| [HH:MM] | [Topic 3] | [Owner] | [Decide/Inform/Discuss/Align] | [X] min |
| [HH:MM] | [Topic 4 -- if applicable] | [Owner] | [Decide/Inform/Discuss/Align] | [X] min |
| [HH:MM] | Action items, owners, and next steps | [Facilitator] | Align | 5 min |

**Scheduled content:** [X] min | **Buffer:** [Y] min | **Total:** [Z] min

---

### Topic Details

**[Topic 1]: [Full descriptive title]**
- **Objective type:** [Decide / Inform / Discuss / Align]
- **Context:** [2--4 sentences of background that someone not deeply embedded in this issue needs to participate productively]
- **Decision question (if Decide):** [The exact yes/no or choice question the group will answer]
- **Options under consideration (if applicable):**
  - Option 1: [Description] -- [known trade-offs]
  - Option 2: [Description] -- [known trade-offs]
- **Decision owner:** [The person who makes the final call if consensus is not reached]
- **Pre-read:** [Specific document, section, and page numbers]
- **If this runs over:** [What gets cut or deferred]

**[Topic 2]: [Full descriptive title]**
- **Objective type:** [Decide / Inform / Discuss / Align]
- **Context:** [2--4 sentences of background]
- **Decision question (if Decide):** [The exact question]
- **Decision owner:** [Name]
- **Pre-read:** [Document or "None required"]
- **If this runs over:** [What gets cut or deferred]

[Repeat for each topic]

---

### Decisions to Be Made

| Decision | Options | Decision Owner | Deadline |
|----------|---------|----------------|----------|
| [Decision 1] | [Option A vs. Option B] | [Name] | End of meeting |
| [Decision 2] | [Approve / Defer / Reject] | [Name] | End of meeting |

---

### Expected Outputs

By the end of this meeting, we will have:
1. [Specific output 1 -- e.g., "Approved list of Q3 initiatives ranked by priority"]
2. [Specific output 2 -- e.g., "Go/no-go decision on the Acme Corp SSO fast-track"]
3. [Specific output 3 -- e.g., "Named owners and due dates for all action items"]

---

### Parking Lot

*Topics raised during the meeting that are out of scope for today. These will be addressed via [follow-up meeting / async channel / owner name].*

| Topic | Raised By | Follow-Up Action | Owner |
|-------|-----------|-----------------|-------|
| | | | |

---

### After This Meeting

- **Meeting notes owner:** [Name]
- **Notes to be distributed by:** [Time and date]
- **Follow-up meeting (if needed):** [Date / TBD]
- **Decisions will be logged in:** [Location -- e.g., decision log, project wiki]
```


## Rules

1. **Never write an agenda without a single-sentence meeting objective.** If you cannot write "By the end of this meeting, we will have [specific output]," the meeting purpose is not clear enough to run. Surface this to the user and help them define it before proceeding.

2. **Never let total scheduled content exceed 80% of available meeting time.** For a 60-minute meeting, that means 48 minutes maximum of scheduled content after opening and close. For a 90-minute meeting, 72 minutes. Without this buffer, a single overrun topic cancels the action-items close, which is where accountability is created.

3. **Never use "Discuss" as a standalone agenda item type without naming what the discussion produces.** "Discuss pricing strategy" is not an agenda item. "Discuss pricing strategy -- identify top 3 trade-offs for VP decision next week" is. Every discussion must have a stated output even if the output is a follow-up question.

4. **Never place a high-stakes decision in the last 20% of the meeting.** Groups under time pressure anchor on the last option presented, accept vague language to avoid extension, and skip dissent. If a critical decision cannot fit early, either shorten other items or schedule a separate meeting.

5. **Never omit the decision owner from any Decide item.** The decision owner is the person who makes the final call if the group cannot reach consensus. Without a named decision owner, "we discussed it" becomes the outcome.

6. **Never create an agenda item without a named item owner.** The item owner is accountable for preparing content, keeping time on their section, and capturing any outputs from that segment. "Team" is not an owner.

7. **Always specify pre-read materials with enough precision that attendees know exactly what to read.** "Review the report" fails. "Review the retention analysis on pages 4--6 of the Q2 Metrics Report -- specifically the cohort chart on page 5" is sufficient. Vague pre-reads are not read.

8. **Always include the "if this runs over" contingency for each topic.** Knowing in advance what gets cut prevents the facilitator from making that decision under pressure with the full group watching. Document it in the agenda so the facilitator can execute the cut without debate.

9. **Always end with an action-items close, even if it must be shortened.** A 2-minute close is better than no close. The minimum viable close captures: what was decided, who owns each follow-up, and when it is due. Meetings without a close produce follow-up chaos.

10. **Never include more topics than the time budget can support.** If the user brings 6 topics for a 45-minute meeting, help them prioritize to 3--4 and explicitly note what was deferred and where those deferred topics will go. Overloaded agendas produce incomplete meetings and abandoned action items.

11. **For meetings with more than 6 attendees, always note which attendees are required versus optional for each topic.** In large meetings, not every person needs to be in the room for every topic. Flagging optional attendance respects time and reduces the noise of large groups on items that only concern a subset.

12. **For recurring meetings, audit the standing agenda at least once per quarter.** Recurring agendas accumulate dead items -- topics that were once live but have been resolved. A quarterly audit removes standing items that no longer require group time and prevents the meeting from becoming a ritual without purpose.


## Edge Cases

### The meeting has no clear decision and no required collaboration
The user says "we just need to sync" or "I want everyone to be on the same page." Before building an agenda, ask: "What will be different for each attendee after this meeting that is not true today?" If the answer is only informational, challenge whether the meeting needs to happen at all. A well-written email with a clear summary, sent 24 hours in advance with a 48-hour reply window, replaces most "sync" meetings. If the meeting must happen, classify it as an alignment or information-sharing meeting, time-box each presenter tightly (5 minutes per person for updates), and add an explicit Q&A segment so the synchronous time earns its place.

### The user provides more topics than the meeting can hold
This is the most common scenario. When topics exceed time, do not silently trim the agenda. Instead: (1) present the user with the full list and its estimated time cost, showing that the total exceeds the available window, (2) ask which topics are mandatory for this specific meeting versus which can be deferred, (3) explicitly label deferred topics and suggest where they go -- a follow-up meeting, an async Slack thread, or a document for comment. The final agenda should include a "deferred topics" note so attendees understand why certain items did not appear. This prevents the "why wasn't X on the agenda?" complaint after the meeting.

### The meeting involves a contentious decision where attendees hold strong opposing positions
Flag this in the Topic Details section. Contentious decisions need a structured deliberation format, not an open floor. Recommend one of two approaches in the agenda itself: (1) the **pre-mortem format** -- ask each side to argue the opposing position for 3 minutes before the discussion, which surfaces assumptions without personal stakes attached; or (2) the **written input format** -- ask each attendee to submit a 3-bullet position statement before the meeting so the facilitator can identify points of genuine agreement and genuine conflict in advance. Never rely on unstructured group discussion for contentious decisions -- the loudest voice wins.

### Key decision-maker is attending remotely or may have connectivity issues
Note this in the attendee table and build a contingency into the agenda. Options: (1) move their required topic to the first substantive slot so connectivity issues later in the meeting do not block the decision; (2) designate a proxy decision-maker who can commit conditionally subject to async confirmation; (3) record the decision discussion so the remote attendee can ratify or object within 24 hours. Document whichever contingency applies directly in the agenda so the facilitator does not have to improvise.

### The meeting involves a large cross-functional group (10+ people)
Large meetings have three structural problems: discussion expands geometrically with headcount, the cognitive load on the facilitator is high, and optional attendees are often passive. Address all three in the agenda: (1) for each topic, flag whether full-group discussion is needed or whether it is a presentation with Q&A -- keep full-group discussion to 2--3 critical items maximum; (2) use a "round-robin check" format for alignment items rather than open discussion -- each person states their position in 60 seconds, which surfaces disagreement efficiently; (3) note which attendees are required versus optional for each segment and explicitly give optional attendees permission to drop off when their topics are concluded. Consider breaking the large meeting into a plenary (full group, information sharing) followed by subgroup working sessions for decisions.

### The user is facilitating an executive or board-level meeting
Executives have three tolerances that differ from working-level meetings: (1) they will not read long pre-reads -- limit pre-read materials to 2 pages maximum per topic and front-load the recommendation or decision question on page 1, not page 2; (2) they expect the facilitator to come with a recommended option, not just a menu of choices -- the agenda should state "Recommended decision: X, for ratification or modification," not "Options A/B/C for discussion"; (3) they frequently run short on time -- every topic must have a 50% version that can be compressed if needed, and the facilitator should know in advance which details to drop. Design the agenda so it works at both full length and at 70% of scheduled time.

### The user wants a recurring meeting template, not a one-time agenda
Recurring meetings need two structural layers that one-time meetings do not: (1) **Standing items** -- topics that appear every meeting because they require regular group attention (e.g., blockers, metrics review, open decisions). These should be time-boxed tightly and have a standing owner; (2) **Rotating items** -- topics that vary by meeting and are selected in advance by the meeting organizer. Provide a template with both layers clearly labeled. Also add a "last meeting carryover" slot at the top for action items from the previous meeting whose owners report completion or revised timelines. Without this slot, recurring meetings generate action items that are never revisited.

### The user needs an agenda for a meeting they did not call and do not control
Sometimes a user needs an agenda for a meeting organized by someone else -- they are preparing their section, or they have been asked to help structure the agenda on behalf of the organizer. In this case: (1) scope the output to only the section they own, with full Topic Detail for their item; (2) note any structural concerns they should raise with the actual organizer (e.g., their topic is scheduled last but is the most critical decision); (3) provide a "suggested full agenda" as an optional appendix they can share with the organizer if appropriate. Be explicit that the suggested full agenda is a recommendation, not the final structure.


## Example

**Input:** "I need a 75-minute agenda for a meeting with our CTO, Head of Engineering, Head of Product, and CFO. We need to decide whether to build or buy a data pipeline tool. We've been evaluating two vendors for 6 weeks and our internal team has submitted a build proposal. We also need to review the security audit findings that came back last week, and I want to make sure we end with clear owners for whatever we decide."

---

## Meeting Agenda: Data Pipeline Decision -- Build vs. Buy

**Date:** Wednesday, October 15, 2025 -- 10:00 AM -- 11:15 AM EST
**Duration:** 75 minutes
**Location / Link:** Executive Conference Room B / Zoom (link in calendar invite)
**Organizer:** Head of Product
**Distribution:** Monday, October 13, 2025 by 5:00 PM EST

---

**Meeting objective:** Reach a final build-vs.-buy decision on the data pipeline tool, assign implementation ownership, and determine the security audit response priority so both workstreams begin the week of October 20.

**Meeting type:** Decision meeting (primary) with one information-sharing segment

---

### Attendees

| Name | Role | Attendance |
|------|------|------------|
| Priya Nair | CTO -- Final decision authority on build vs. buy | Required |
| Marcus Webb | Head of Engineering -- Authored the build proposal; owns technical feasibility | Required |
| Jess Okonkwo | Head of Product | Required -- Organizer and facilitator |
| Diana Chu | CFO -- Budget approval authority; owns vendor contract sign-off | Required |

---

### Pre-Read Materials

| Document | Owner | Where to Find It | What to Focus On |
|----------|-------|-----------------|------------------|
| Build Proposal Summary | Marcus Webb | Shared drive: /pipeline/build-proposal-summary.pdf | Pages 1--3: resource requirements, timeline, and risk assumptions |
| Vendor Comparison Matrix | Jess Okonkwo | Shared drive: /pipeline/vendor-comparison-v3.pdf | Final scoring on integration complexity, cost, and support SLA |
| Security Audit Findings Brief | Head of Security (Alex Reyes) | Email attachment sent Oct 10 | Critical findings only (highlighted in yellow) -- 4 items |

*Preparation time estimate: approximately 25 minutes*

---

### Agenda

| Start Time | Topic | Owner | Type | Duration |
|------------|-------|-------|------|----------|
| 10:00 AM | Opening: objectives, constraints, and decision criteria | Jess | Align | 5 min |
| 10:05 AM | Build vs. buy decision | Priya (facilitator: Jess) | Decide | 35 min |
| 10:40 AM | Security audit findings: priority and ownership | Marcus | Decide | 20 min |
| 11:00 AM | Implementation kickoff: owners, timelines, dependencies | Jess | Align | 10 min |
| 11:10 AM | Action items, owners, and next steps | Jess | Align | 5 min |

**Scheduled content:** 70 min | **Buffer:** 5 min | **Total:** 75 min

---

### Topic Details

**Build vs. Buy Decision: Data Pipeline Tool**
- **Objective type:** Decide
- **Context:** Over the past 6 weeks, we evaluated two vendors (Fivetran and Airbyte) against an internal build proposal from the engineering team. The build proposal estimates 14 weeks of 2-engineer time. Both vendors were evaluated on integration complexity, total cost of ownership over 3 years, support SLA, and security posture. The vendor comparison matrix reflects final scoring from both teams.
- **Decision question:** Will we build the data pipeline using internal engineering resources, adopt Fivetran, or adopt Airbyte -- and what is the start date for whichever path is chosen?
- **Options under consideration:**
  - Build: 14-week timeline, $0 license cost, 2 engineers at ~$180K loaded cost, full customization, highest maintenance burden
  - Fivetran: $42K/year, 3-week implementation, 200+ native connectors, limited customization on transformation layer
  - Airbyte: $28K/year, 5-week implementation, open-source core with enterprise support tier, moderate customization
- **Decision owner:** Priya Nair (CTO). If consensus is not reached, Priya makes the call.
- **Pre-read:** Build Proposal Summary (pages 1--3) and Vendor Comparison Matrix (full document, 6 pages)
- **If this runs over:** Cut the "implementation dependencies" detail from the subsequent topic -- those can be finalized async after the meeting

**Security Audit Findings: Priority and Ownership**
- **Objective type:** Decide
- **Context:** The external security audit returned 11 findings last week. 4 are marked critical (highlighted in the brief). The remaining 7 are medium or low severity. This segment focuses exclusively on the 4 critical findings. Decisions on medium/low items will be handled async by the engineering team.
- **Decision question:** For each of the 4 critical findings: is the remediation owner engineering or product, what is the target remediation date, and does any finding require blocking the pipeline implementation until resolved?
- **Options under consideration:** (1) Remediate all 4 before pipeline implementation begins -- safest, adds 3--4 weeks; (2) Remediate 2 highest-severity findings before launch, schedule remaining 2 within 30 days -- balanced; (3) Proceed with implementation and remediate all 4 in parallel -- fastest, highest risk
- **Decision owner:** Priya Nair with Diana Chu confirming any budget implications of delayed launch
- **Pre-read:** Security Audit Findings Brief (critical items only -- approximately 10 minutes to read)
- **If this runs over:** Skip the medium/low findings entirely and handle async

**Implementation Kickoff: Owners, Timelines, and Dependencies**
- **Objective type:** Align
- **Context:** Once the build vs. buy decision is made, we need named owners for the implementation workstream so it can begin the week of October 20 without a lag. This segment confirms who owns what, not how they will do it.
- **Decision question:** None -- alignment only. Output is a confirmed owner list.
- **Pre-read:** None required
- **If this runs over:** Reduce to 5 minutes by capturing only the primary owner name and start date; detailed RACI can be built async

---

### Decisions to Be Made

| Decision | Options | Decision Owner | Deadline |
|----------|---------|----------------|----------|
| Build vs. buy for data pipeline | Build (internal) / Fivetran / Airbyte | Priya Nair (CTO) | End of meeting |
| Security audit remediation sequencing | Pre-implementation / parallel / phased | Priya Nair + Diana Chu | End of meeting |
| Implementation start date | Week of Oct 20 / delayed based on audit | Priya Nair | End of meeting |

---

### Expected Outputs

By the end of this meeting, we will have:
1. A single selected approach for the data pipeline (build, Fivetran, or Airbyte) with a documented rationale
2. A security audit remediation plan with a named owner and target dates for each of the 4 critical findings
3. A named implementation owner and confirmed start date for whichever pipeline path is chosen
4. Action items with owners and due dates distributed within 24 hours via meeting notes

---

### Parking Lot

*Topics raised during the meeting that are out of scope for today. These will be addressed via follow-up email or the engineering team's weekly sync.*

| Topic | Raised By | Follow-Up Action | Owner |
|-------|-----------|-----------------|-------|
| | | | |

---

### After This Meeting

- **Meeting notes owner:** Jess Okonkwo
- **Notes to be distributed by:** Wednesday, October 15 by 3:00 PM EST
- **Follow-up meeting (if needed):** Implementation review -- week of November 3
- **Decisions will be logged in:** Engineering Decision Log (Confluence: /eng/decisions)
