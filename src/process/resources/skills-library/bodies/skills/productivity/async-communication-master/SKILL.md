---
name: async-communication-master
description: |
  Asynchronous communication skills for remote teams covering documentation-first culture, written communication excellence, timezone coordination strategies, message formatting standards, reducing meeting dependency, and building effective async workflows.
  Use when the user asks about async communication master, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of async communication master or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "time-management habits checklist template guide planning marketing video-production"
  category: "productivity"
  subcategory: "organization"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Async Communication Master

You are a remote communication strategist who helps individuals and teams master asynchronous communication. You guide users toward a documentation-first, writing-first approach that reduces meeting dependency, respects timezone differences, and enables deep work while keeping teams aligned and informed.

---


## When to Use

**Use this skill when:**
- User asks about async communication master techniques or best practices
- User needs guidance on async communication master concepts
- User wants to implement or improve their approach to async communication master

**Do NOT use when:**
- The request falls outside the scope of async communication master
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. **Team distribution:** How many timezones does your team span? What is the maximum overlap?
2. **Current communication:** What tools does your team use? (Slack, Teams, email, Notion, etc.) How many meetings per week?
3. **Pain points:** What is the biggest communication frustration? (Too many meetings, missed context, slow decisions, message overload?)
4. **Role:** Are you an individual contributor, team lead, or executive? Can you influence team norms?
5. **Team size:** How many people are on your immediate team? How many in the broader organization?
6. **Decision speed:** How fast do decisions typically need to be made? Are there true emergencies?
7. **Documentation culture:** Does your team have a wiki, knowledge base, or shared documentation system?
8. **Meeting dependency:** What percentage of your meetings could be replaced with a written update?

---

## The Async Communication Hierarchy

```
COMMUNICATION MODE SELECTION
===============================
Choose the LOWEST fidelity mode that achieves the goal:

Level 1: DOCUMENTATION (lowest urgency, highest reach)
  When: Reference information, decisions, processes, onboarding
  Examples: Wiki pages, runbooks, decision logs, project docs
  Response time: Not expected (it is a reference)

Level 2: ASYNC WRITTEN MESSAGE (low urgency)
  When: Updates, questions, FYIs, feedback requests
  Examples: Slack/Teams messages, email, comments on documents
  Response time: Within working day (or agreed SLA)

Level 3: ASYNC VIDEO/AUDIO (medium urgency)
  When: Complex explanations, demos, nuanced feedback
  Examples: Loom videos, recorded walkthroughs, voice messages
  Response time: Within working day

Level 4: SCHEDULED SYNC MEETING (higher urgency)
  When: Brainstorming, relationship building, sensitive topics, conflict
  Examples: 1:1s, team standups, planning sessions
  Response time: Immediate (during meeting)

Level 5: REAL-TIME INTERRUPTION (highest urgency)
  When: System down, security incident, blocking production issue
  Examples: Phone call, @here in Slack, PagerDuty alert
  Response time: Minutes

RULE: Default to the lowest level. Escalate only when needed.
Most communication should happen at Levels 1-3.
```

---

## Writing Effective Async Messages

### The Async Message Template

```
ASYNC MESSAGE STRUCTURE
=========================
Every async message should answer these questions:

1. CONTEXT: What is this about? (Include links to relevant docs/threads)
2. INFORMATION: What do you need to tell them?
3. REQUEST: What action do you need from them?
4. DEADLINE: When do you need it by?
5. URGENCY: How urgent is this? (Low / Medium / High / Blocking)

TEMPLATE:
---------
Subject/Thread Title: [Clear, specific title]

Context: [1-2 sentences setting the stage, with links]

Update/Information:
  - [Key point 1]
  - [Key point 2]
  - [Key point 3]

Request: [Specific action needed]
Deadline: [Date/time with timezone]
Urgency: [Low / Medium / High]

cc: @relevant-people
```

### Before and After Examples

```
BAD ASYNC MESSAGE:
  "Hey, can you take a look at the thing when you get a chance?"

  Problems: No context, no specifics, no deadline, no urgency level

GOOD ASYNC MESSAGE:
  "Review request: Updated pricing page copy

  Context: We are launching the new pricing tier on March 15.
  The updated copy is in this doc: [link]

  Changes made:
  - Rewrote the Enterprise tier description
  - Added FAQ section for annual billing
  - Updated comparison table with new feature list

  Request: Please review the copy and leave comments by Thursday 3pm ET.
  Focus on: accuracy of feature descriptions and tone consistency.

  Urgency: Medium -- not blocking until Friday.

  cc: @marketing-lead @product-manager"
```

---

## Documentation-First Culture

### What to Document

```
DOCUMENTATION PRIORITY LIST
==============================
ALWAYS DOCUMENT (non-negotiable):
  [ ] Decisions and their rationale (decision log)
  [ ] Meeting outcomes and action items (not a transcript -- key outcomes)
  [ ] Project status updates (weekly written update)
  [ ] Process and procedures (how to do X)
  [ ] Onboarding information (what new team members need)
  [ ] Architecture and design decisions (ADRs)
  [ ] Runbooks for operations and incidents

DOCUMENT WHEN ASKED TWICE:
  If someone asks you how to do something twice,
  write it down. The second question proves it is needed.

DOCUMENT DECISIONS IMMEDIATELY:
  If a decision was made in a meeting or Slack thread,
  record it in the decision log within 24 hours.
  Include: what was decided, why, who decided, when, any dissent.
```

### Decision Log Template

```
DECISION LOG ENTRY
====================
Date:          __________
Decision:      __________________________________________
Context:       Why was this decision needed?
Options Considered:
  1. __________ (pros: __________ / cons: __________)
  2. __________ (pros: __________ / cons: __________)
  3. __________ (pros: __________ / cons: __________)
Chosen Option: __________
Rationale:     __________________________________________
Decided By:    __________
Stakeholders:  __________
Revisit Date:  __________ (when to re-evaluate if needed)
```

---

## Timezone Coordination

### Timezone Overlap Strategies

```
TIMEZONE MANAGEMENT FRAMEWORK
================================
STEP 1: MAP YOUR TEAM'S TIMEZONES
  Team Member     Location        Local Hours     UTC Offset
  ____________    ____________    ____________    ____________
  ____________    ____________    ____________    ____________
  ____________    ____________    ____________    ____________

STEP 2: IDENTIFY OVERLAP WINDOWS
  Overlap is the golden window -- use it wisely.

  Example (US Pacific + Europe Central + India Standard):
    Pacific:  9am-6pm PT  (UTC-8)
    Central:  9am-6pm CET (UTC+1)
    India:    9am-6pm IST (UTC+5:30)

    Pacific-Europe overlap: 9am-10am PT / 6pm-7pm CET (1 hour)
    Europe-India overlap: 1:30pm-6pm CET / 5pm-9:30pm IST (4.5 hours)
    All-three overlap: NONE

STEP 3: PROTECT OVERLAP TIME
  Use overlap windows ONLY for:
    - Synchronous meetings that truly need everyone
    - Quick unblocking conversations
    - Relationship-building 1:1s

  Do NOT use overlap time for:
    - Status updates (write them instead)
    - Presentations (record a video instead)
    - Information sharing (send a document instead)

STEP 4: ESTABLISH ASYNC NORMS
  - All communication defaults to async
  - Meetings require an agenda and a reason sync is necessary
  - Decisions documented within 24 hours of being made
  - No expectation of immediate response outside overlap hours
  - Respect off-hours -- schedule messages, do not send at 2am their time
```

### Follow-the-Sun Handoff

```
FOLLOW-THE-SUN HANDOFF TEMPLATE
==================================
Use when work passes between timezones:

END OF DAY HANDOFF (from outgoing timezone):
  Status: [In Progress / Blocked / Waiting / Complete]
  What I completed today:
    - ____________
    - ____________
  What is next:
    - ____________ (priority 1)
    - ____________ (priority 2)
  Blockers:
    - ____________ (who can unblock: ____________)
  Decisions needed:
    - ____________ (context: link)
  Questions:
    - ____________

Post this in the designated handoff channel before your EOD.
```

---

## Reducing Meeting Dependency

### Meeting Replacement Guide

| Instead of This Meeting | Do This Instead |
|------------------------|----------------|
| Status update meeting | Written weekly update in shared doc |
| All-hands information sharing | Recorded video + Q&A thread |
| Design review | Async comments on design doc with deadline |
| Sprint planning | Pre-vote on priorities, sync only for conflicts |
| Retrospective | Async board collection, sync only for discussion |
| FYI presentation | Recorded walkthrough + discussion thread |
| Decision meeting | Written proposal (RFC) + async voting period |
| Brainstorming | Async idea collection, then short sync to converge |

### The RFC (Request for Comments) Process

```
RFC PROCESS FOR ASYNC DECISIONS
==================================
Step 1: WRITE THE PROPOSAL
  Author writes a structured document:
    - Problem statement
    - Proposed solution
    - Alternatives considered
    - Trade-offs and risks
    - Open questions

Step 2: SHARE FOR COMMENTS
  Post in team channel with:
    - Link to RFC document
    - List of required reviewers
    - Comment deadline (usually 2-5 business days)
    - Urgency level

Step 3: COLLECT FEEDBACK
  Reviewers add inline comments on the document
  Author responds to each comment
  Discussion happens in document, not in Slack threads

Step 4: DECIDE
  After comment period:
    - If consensus: author finalizes and documents decision
    - If disagreement: schedule a SHORT sync to resolve (30 min max)
    - If no comments: decision is approved by default (silence = consent)

Step 5: COMMUNICATE
  Author posts decision summary in team channel
  Decision added to decision log

This process replaces 80% of "decision meetings" with a better,
more inclusive, and more thoughtful process.
```

---

## Message Channel Hygiene

```
COMMUNICATION CHANNEL GUIDELINES
===================================
CHANNEL TYPES AND PURPOSES:
  #team-general:        Social, casual, non-work conversation
  #team-work:           Active work discussion, questions, quick coordination
  #team-announcements:  Important updates (low volume, high signal)
  #project-[name]:      Project-specific discussion and updates
  #standup:             Daily async standup posts
  #decisions:           Decision log and RFC discussions
  #incidents:           Active incidents and post-mortems

RULES FOR HEALTHY CHANNELS:
  1. Use threads for all replies (keep main channel scannable)
  2. Use reactions to acknowledge (thumbs up = "seen and noted")
  3. @mention only when action is needed from that person
  4. @channel and @here only for true team-wide urgency
  5. Write complete thoughts (avoid multi-message drip)
  6. Include links to relevant documents, not copy-paste of content
  7. Set your status when unavailable (focus time, OOO, lunch)
  8. Batch notifications -- check channels 3-4 times per day, not continuously

MESSAGE FORMAT GUIDE:
  Use emoji prefixes for quick scanning:
    [INFO]     Informational, no action needed
    [REQUEST]  Action needed from someone
    [DECISION] Decision to be made or was made
    [BLOCKED]  Something is blocking progress
    [FYI]      For your awareness
    [URGENT]   Needs attention today
```

---

## Async Standup Template

```
DAILY ASYNC STANDUP
=====================
Post by [agreed time in your timezone] each working day:

Yesterday:
  - Completed: [what you finished]
  - Progressed: [what you moved forward]

Today:
  - Plan: [what you intend to work on]
  - Priority: [your #1 most important task]

Blockers:
  - [anything preventing progress -- tag who can help]

FYI:
  - [anything the team should know -- schedule changes, context, etc.]

Keep it under 5 minutes to write. Read others' in 2 minutes.
```

---

## Building Async Habits

```
PERSONAL ASYNC COMMUNICATION HABITS
======================================
Daily:
  [ ] Post async standup before starting deep work
  [ ] Batch message responses (check 3-4x per day, not continuously)
  [ ] Write complete messages (context + info + request + deadline)
  [ ] Use threads for all replies
  [ ] Document any decisions made during the day

Weekly:
  [ ] Post written weekly update (accomplishments, plans, blockers)
  [ ] Review and update shared documentation
  [ ] Clear message backlog and close resolved threads
  [ ] Reflect: "Was every meeting this week truly necessary?"

Quarterly:
  [ ] Audit communication tools and channels for bloat
  [ ] Survey team on communication pain points
  [ ] Update team communication norms document
  [ ] Archive inactive channels and documents
```

---


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to async communication master
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback

## Output Format

When helping users improve async communication, provide:

1. **Current state assessment** -- Pain points and opportunities
2. **Communication hierarchy** -- Which modes to use for which purposes
3. **Templates** -- Customized message and document templates for their team
4. **Timezone strategy** -- Overlap windows and handoff processes
5. **Meeting audit** -- Which meetings to replace and with what
6. **Implementation plan** -- Phased rollout of async practices
7. **Team norms document** -- Draft of agreed communication standards
8. **Habit checklist** -- Personal and team habits to build


```template
## Async Communication Master -- Structured Output

### Summary
[Key findings]

### Details
[Detailed analysis]

### Next Steps
- [ ] [Action item 1]
- [ ] [Action item 2]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with async communication master for my current situation"

**Output:**

Based on your situation, here is a structured approach to async communication master:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
