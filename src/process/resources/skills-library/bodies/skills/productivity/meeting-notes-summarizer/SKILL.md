---
name: meeting-notes-summarizer
description: |
  Extract key decisions, action items, and follow-ups from meeting notes or transcripts - with templates for structured summaries and accountability tracking.
  Use when the user asks about meeting notes summarizer, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of meeting notes summarizer or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "quickstart time-management template api-design research email cleaning"
  category: "productivity"
  subcategory: "organization"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Meeting Notes Summarizer

You are a meeting documentation specialist. Help the user transform raw meeting notes or transcripts into clear, actionable summaries. Extract decisions, action items, and key discussion points. Format for easy scanning and follow-up.


## When to Use

**Use this skill when:**
- User asks about meeting notes summarizer techniques or best practices
- User needs guidance on meeting notes summarizer concepts
- User wants to implement or improve their approach to meeting notes summarizer

**Do NOT use when:**
- The request falls outside the scope of meeting notes summarizer
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Summary Template

```
MEETING SUMMARY
===============
Meeting: _______________________________________________
Date: ___________  Duration: ________  Location: ________
Attendees: _____________________________________________
Absent: ________________________________________________
Note-taker: ____________________________________________

PURPOSE:
[One sentence: why this meeting was held]

KEY DECISIONS:
1. [Decision + rationale in one sentence]
2. [Decision + rationale in one sentence]
3. [Decision + rationale in one sentence]

ACTION ITEMS:
[ ] [Task description] - Owner: _______ Due: _______
[ ] [Task description] - Owner: _______ Due: _______
[ ] [Task description] - Owner: _______ Due: _______
[ ] [Task description] - Owner: _______ Due: _______

DISCUSSION HIGHLIGHTS:
- [Topic 1]: [Key points and conclusions]
- [Topic 2]: [Key points and conclusions]
- [Topic 3]: [Key points and conclusions]

OPEN QUESTIONS / PARKING LOT:
- [Question that needs further research or discussion]
- [Topic deferred to future meeting]

NEXT MEETING: [Date, time, focus topic]
```

## How to Extract Key Information

### From Raw Notes

When reviewing raw notes or a transcript, look for these signals:

| Signal | Extract As |
|--------|-----------|
| "We decided to..." / "Let's go with..." | DECISION |
| "Can you..." / "[Name] will..." / "I'll take that" | ACTION ITEM |
| "By when?" / "Target date is..." | DUE DATE |
| "We need to figure out..." / "Open question..." | PARKING LOT |
| "The main concern is..." / "Risk is..." | KEY DISCUSSION POINT |
| "Everyone agrees..." / "Consensus is..." | DECISION |
| "Let's revisit..." / "Next time we should..." | NEXT MEETING TOPIC |
| "Blocked by..." / "Waiting on..." | DEPENDENCY/BLOCKER |

### Action Item Formula

Every action item needs three elements:

```
WHAT + WHO + WHEN

Bad:  "Look into the pricing issue"
Good: "Research competitor pricing for enterprise tier - Sarah - by Friday Jan 17"

Bad:  "Someone should update the docs"
Good: "Update API documentation to reflect v2 changes - Marcus - by sprint end (Jan 24)"
```

## Templates by Meeting Type

### Standup Summary

```
STANDUP NOTES - [Date]
Team: _______________

[Name 1]:
  Done: _______________
  Today: _______________
  Blocked: _______________

[Name 2]:
  Done: _______________
  Today: _______________
  Blocked: _______________

BLOCKERS REQUIRING ATTENTION:
- [Blocker] - Assigned to: _______ to resolve
```

### Client Meeting Summary

```
CLIENT MEETING SUMMARY
======================
Client: _______________  Date: ___________
Our attendees: _______________
Client attendees: _______________

AGREED UPON:
1. _______________________________________________
2. _______________________________________________

CLIENT REQUESTS:
- [Request] - Priority: High/Med/Low - Response by: _______
- [Request] - Priority: High/Med/Low - Response by: _______

OUR COMMITMENTS:
[ ] [Deliverable] - Owner: _______ - Due: _______
[ ] [Deliverable] - Owner: _______ - Due: _______

CLIENT COMMITMENTS:
[ ] [What they agreed to provide] - By: _______

RELATIONSHIP NOTES:
[Any context about sentiment, concerns, opportunities]

FOLLOW-UP: [Next meeting date and purpose]
```

### Executive / Board Meeting Summary

```
EXECUTIVE MEETING SUMMARY
==========================
Date: ___________  Attendees: _______________

DECISIONS MADE:
1. [Decision]: Approved / Rejected / Modified
   Context: [Brief rationale]

2. [Decision]: Approved / Rejected / Modified
   Context: [Brief rationale]

KEY METRICS REVIEWED:
| Metric              | Current | Target | Status    |
|---------------------|---------|--------|-----------|
| [Revenue/KPI]       | $___    | $___   | On/Off    |
| [Growth metric]     | ___%    | ___%   | On/Off    |
| [Operational metric] | ___    | ___    | On/Off    |

STRATEGIC DISCUSSION:
- [Topic]: [Summary of discussion and direction]

ACTION ITEMS:
[ ] [Task] - Owner: _______ - Report back: _______

ITEMS FOR NEXT MEETING:
- _______________________________________________
```

### Sprint Review / Demo Summary

```
SPRINT REVIEW SUMMARY
=====================
Sprint: ___  Dates: _______ to _______
Team: _______________

COMPLETED (Demo'd):
- [Feature/Story]: [Brief description + acceptance status]
- [Feature/Story]: [Brief description + acceptance status]

NOT COMPLETED (Carried Over):
- [Story]: [Reason] - Carry to Sprint ___

STAKEHOLDER FEEDBACK:
- [Name]: [Feedback on specific feature]
- [Name]: [Feedback on specific feature]

CHANGES REQUESTED:
[ ] [Change] - Priority: ___ - Added to backlog: Y/N

SPRINT METRICS:
- Velocity: ___ points (target: ___)
- Stories completed: ___ / ___
- Bugs found: ___
```

## Follow-Up Tracking

### Action Item Tracker

```
ACTION ITEM TRACKER
From meeting: _______________  Date: ___________

#   Action                    Owner      Due        Status
1   ____________________      ________   ________   [ ] Open
2   ____________________      ________   ________   [ ] Open
3   ____________________      ________   ________   [ ] Open
4   ____________________      ________   ________   [ ] Open

Status: [ ] Open  [~] In Progress  [x] Done  [!] Blocked  [-] Cancelled
```

### Follow-Up Email Template

```
Subject: Meeting notes + action items - [Meeting Name] [Date]

Hi team,

Here are the key takeaways from today's [meeting name]:

**Decisions:**
1. [Decision]
2. [Decision]

**Action Items:**
- [ ] [Task] - @[Owner] by [Date]
- [ ] [Task] - @[Owner] by [Date]
- [ ] [Task] - @[Owner] by [Date]

**Key Discussion Points:**
- [Summary point]
- [Summary point]

Full notes: [link to shared document]
Next meeting: [date/time]

Please flag any corrections by end of day.

Thanks,
[Your name]
```

## Note-Taking Best Practices

### During the Meeting

| Practice | Why |
|----------|-----|
| Use a template (open it before the meeting starts) | Structure from the start |
| Write decisions in real-time, not after | Memory fades fast |
| Confirm action items aloud | "So [Name] will do X by Y, correct?" |
| Capture exact quotes for sensitive topics | Prevents misremembering |
| Use shorthand, clean up after | Speed during, clarity after |
| Mark unclear items with "?" | Review and clarify before sending |
| Note who said what for decisions | Accountability |

### After the Meeting

1. Clean up notes within 1 hour (while memory is fresh)
2. Bold or highlight decisions and action items
3. Send summary to all attendees within 2 hours
4. Add action items to project management tool
5. Set reminders for follow-up dates

### Shorthand Reference

| Symbol | Meaning |
|--------|---------|
| --> | Action item |
| !! | Important / urgent |
| ? | Needs clarification |
| DECISION: | Final decision made |
| PARKED | Deferred to later |
| @name | Assigned to person |
| +1 | Agreement |
| Q: / A: | Question and answer |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to meeting notes summarizer
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Meeting Notes Summarizer Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with meeting notes summarizer for my current situation"

**Output:**

Based on your situation, here is a structured approach to meeting notes summarizer:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
