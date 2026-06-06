---
name: gtd-workflow
description: |
  Implements the complete Getting Things Done (GTD) workflow: capture, clarify, organize, reflect, engage. Produces a deployable system specification with tools for each phase, collection triggers, and a weekly review checklist.
  Use when the user asks about GTD, Getting Things Done, building a personal productivity system, or implementing David Allen's methodology.
  Do NOT use for simple task capture only (use task-capture-system), daily planning (use daily-planning), or team project management (use business project-management skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "time-management planning automation"
  category: "productivity"
  subcategory: "task-management"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# GTD Workflow

## When to Use

**Use this skill when:**
- The user explicitly asks about GTD, Getting Things Done, or David Allen's methodology and wants to implement or overhaul a complete personal productivity system
- The user describes feeling overwhelmed by open loops -- commitments, ideas, tasks, and obligations that live in their head rather than in a trusted external system
- The user wants a complete workflow covering all five phases: capture, clarify, organize, reflect, and engage -- not just one piece of the system
- The user wants to build inboxes, next-action lists, project lists, waiting-for lists, someday/maybe lists, and a weekly review cadence as an integrated system
- The user asks about contexts, areas of focus, the two-minute rule, mind sweeps, or weekly reviews by name -- signaling familiarity with GTD vocabulary
- The user is returning to GTD after abandoning a previous attempt and wants to rebuild the system correctly this time
- The user wants to integrate GTD across both work and personal life into a single coherent system

**Do NOT use when:**
- The user only needs a single task or idea captured right now -- use `task-capture-system` instead
- The user only needs a plan for today's tasks and priorities -- use `daily-planning` instead
- The user wants to sort a backlog of tasks by urgency and importance -- use `eisenhower-matrix` instead
- The user needs to manage a team, assign tasks to others, or run a project with dependencies, milestones, and gantt charts -- use business project-management skills instead
- The user wants to design a habit loop, track streaks, or build behavioral routines -- use `habit-tracker-design` instead
- The user wants to set long-term goals with OKRs or SMART criteria -- use `smart-goal-builder` instead
- The user is a student wanting to manage coursework and deadlines only -- a simplified version of this system is appropriate, but consider whether `academic-planner` is a better fit

---

## Process

### Step 1: Diagnose the User's Current System State

Before building anything, gather specific diagnostic information. A GTD system must fit the user's real life -- not a hypothetical life.

- Ask explicitly: what tools do they currently use for tasks, notes, and reminders? Distinguish between digital tools (apps, email clients, cloud notes) and physical tools (notebooks, whiteboards, sticky notes, file folders). Both categories may need to be incorporated.
- Ask about every input channel that generates work: email accounts (how many?), chat platforms (Slack, Teams, iMessage, WhatsApp), verbal requests from colleagues or family, ideas that arrive during commutes or showers, physical mail, meeting notes, voicemail, and reading material that generates action.
- Ask how many active projects they estimate they have -- where a "project" is any desired outcome that requires more than one action step. Most professionals carry 30-100 open projects. If they say "maybe 5 or 6," they are almost certainly under-counting; help them recognize that renewing a passport, planning a vacation, and onboarding a new hire are all projects.
- Ask what their biggest system failure has been: forgetting commitments, not knowing where things are, having no time to work on what matters, feeling guilty about things they haven't started, or re-reading the same items repeatedly without acting on them. This diagnosis determines which phases to emphasize.
- Ask when and where they do their weekly planning, or whether they do one at all. The weekly review is the keystone habit; if they have no protected time for it, address that before designing the rest of the system.
- Ask whether they manage personal and professional commitments in separate systems or one combined system. Separate systems reliably cause one to collapse.

---

### Step 2: Design the Capture Phase

The capture phase eliminates the mental overhead of trying to remember open loops. Its goal is 100% externalization of every commitment, idea, and to-do into trusted collection points.

- Establish a single primary inbox -- the one place every captured item lands first before being processed. This must be universally accessible (phone, desktop, and paper if needed). Common choices: a dedicated database in Notion, the inbox view of Todoist or Things 3, a physical in-tray plus a digital inbox for mobile capture, or an Obsidian vault with a templated inbox note.
- Map every input source identified in Step 1 to a specific capture method. Do not leave any source unmapped. Unmapped sources create "shadow inboxes" -- places where items accumulate invisibly and undermine the system.
- Enforce the 60-second capture rule: any open loop recognized -- whether a commitment just made verbally, an idea in the shower, or a worry during a meeting -- must be captured within 60 seconds. This is not about being fast; it is about building the reflex to externalize immediately rather than trusting memory.
- Apply the two-minute rule at capture time if possible: if the action is identifiable and will take less than 2 minutes, do it immediately instead of capturing it. The threshold of 2 minutes is specific to GTD -- it represents the approximate time cost of capturing, processing, organizing, reviewing, and eventually acting on an item. For items below this threshold, the overhead of system management exceeds the cost of just doing them.
- Set a maximum of 3-5 capture points. Every additional collection bucket beyond this number increases the cognitive load of processing and reduces trust in the system. If the user has 12 places where things land, consolidate aggressively.
- If this is the user's first GTD implementation, mandate a "mind sweep" before anything else: a 30-60 minute session where they write down every open loop they can think of -- every incomplete task, unfulfilled commitment, nagging worry, half-baked idea, project they meant to start, errand they've been postponing. Use David Allen's trigger list categories: professional (projects started, projects to start, commitments to others, communications to make, meetings to schedule, reports to write); personal (home maintenance, health, finances, family, social, hobbies, errands, things to buy). This sweep populates the inbox with the initial contents to process.

---

### Step 3: Design the Clarify Phase

Clarify is the most cognitively demanding phase and the one most people skip or do partially. It converts raw captured items into categorized, actionable decisions.

- Apply the clarify decision tree to each item in the inbox. Items are never allowed to be "put back" into the inbox without a decision being made. This is the fundamental processing discipline.
- **Is it actionable?** If NO, there are exactly three destinations: (1) Trash -- delete it, it will never be acted on; (2) Reference -- useful information to retrieve later, filed immediately in the reference system; (3) Someday/Maybe -- something that might be worth doing but is not committed to now. If YES, continue.
- **What is the desired outcome?** This question forces the user to define what "done" looks like before defining what to do next. "Fix the car problem" is not a desired outcome. "Car is running reliably and oil is changed" is a desired outcome.
- **What is the next physical action?** This must be a specific, visible, external action -- something that could be observed by another person. "Think about the proposal" is not a next action. "Open Google Docs and write three bullet points outlining the proposal structure" is a next action. The test: could you hand this action to a stranger and have them execute it without asking clarifying questions?
- **Does it take less than 2 minutes?** If yes, do it now during processing. Do not capture it anywhere.
- **Does completing the outcome require more than one action step?** If yes, it is a project. Create a project entry with the desired outcome written as a completed state ("Website redesign launched," not "Website redesign"). The project must immediately have at least one next action assigned to it. A project with no next action is a stalled project.
- **Should someone else do it?** If yes, delegate it and record it in the Waiting For list with three pieces of data: the item/deliverable, the person responsible, and the date you delegated or requested it. Set a follow-up date -- typically 5-7 business days for internal colleagues, 10-14 days for external parties.
- **Does it belong on a specific date?** If yes, put it on the calendar only if it is a hard-landscape item -- meaning it can only happen on that date (appointment, deadline, event). Do not use the calendar to park things you intend to do on a given day but could do on another day. That habit destroys calendar integrity.
- **Otherwise:** Add to the Next Actions list with the appropriate context tag.

---

### Step 4: Design the Organize Phase

The organize phase builds the six foundational lists and the reference system. Each list has a strict definition -- mixing definitions is the most common cause of GTD system failure.

- **Next Actions list:** The master list of physical actions waiting to be done. Organized by context tags that reflect the user's actual environments and resource conditions. The default contexts in classic GTD are @computer, @phone, @errands, @office, @home, and @agenda (for things to raise with specific people). However, for knowledge workers who are always at a computer, the more useful context system is energy-based: @deep-work (requires 90+ minutes of uninterrupted focus and high cognitive energy), @shallow-work (can be done in 15-30 minute windows at medium energy), @quick-hits (5-10 minute actions at low energy), and @waiting (sitting with someone). Calibrate context tags to the user's real life -- never impose defaults.
- **Projects list:** Every open commitment requiring more than one action step, regardless of size. A project does not need to be big. "Schedule dentist appointment" is a project if the next step is to find the dentist's number, then call, then confirm. Every project on the list must have a defined desired outcome written in a single sentence and at least one current next action that appears on the Next Actions list. Run this check every week. Orphaned projects -- projects with no next action -- are a leading indicator of a failing system.
- **Waiting For list:** Every item delegated to another person or waiting on an external trigger, with the person, the item, the date sent, and a follow-up date. This list is checked weekly at minimum and acted on when items are overdue. Common mistake: not recording Waiting For items at the moment of delegation. That conversation with a colleague that ends with "I'll get you that report by Friday" -- it goes in Waiting For immediately, not in memory.
- **Calendar:** Exclusively for hard-landscape commitments -- things that must happen on a specific date and time. Appointments, external deadlines, events, travel. Never add tasks to the calendar that could slide to another day; this practice inflates the calendar and causes people to stop trusting it.
- **Someday/Maybe list:** The incubation list for ideas, aspirations, and possibilities that are not committed to now but might be revisited. This list must be reviewed weekly. Any item that has sat on Someday/Maybe for more than 90 days without being promoted to a project should either be deleted or deliberately recommitted to Someday/Maybe with a note about why it stays.
- **Reference system:** Non-actionable information that may be needed later. The key design requirement: it must be fast to file and fast to retrieve. A reference system that takes more than 30 seconds to file something in will be abandoned. Common architectures: a single alphabetical folder system (physical or digital), a tag-based system in Notion or Obsidian, or a search-centric approach where items are dumped into one large folder and retrieved by search. The best system is the one the user will actually use.
- **Areas of Focus:** Not an official GTD list but an essential organizational layer. Areas of Focus are the domains of life that require ongoing attention -- typical examples include Career, Health, Finances, Relationships, Home, Personal Development, Community. Projects live within Areas of Focus. During the weekly review, scan each Area of Focus to ensure it has active projects and next actions proportional to its importance in the user's life.

---

### Step 5: Design the Reflect Phase

The weekly review is the keystone of the entire GTD system. Without it, the system decays in 1-2 weeks. With it, the system compounds in value over months and years. Design it as a protected, non-negotiable appointment.

- Identify a specific day, time, and location for the weekly review. The most effective window is Friday afternoon (before the weekend) or Sunday evening (before the week begins). Avoid Monday morning -- the week's urgencies will crowd it out. Duration: 60-90 minutes for a full system with 20+ projects. Do not compress below 45 minutes.
- The weekly review has three macro-stages: GET CLEAR (empty all inboxes, close open loops from the week), GET CURRENT (update all lists to reflect current reality), and GET CREATIVE (look at the horizon and ensure your projects are still pointed at the right destinations).
- GET CLEAR steps: (1) Collect all loose papers, sticky notes, receipts, and physical items into the inbox. (2) Process notes from all meetings and conversations since the last review. (3) Process email inbox to zero -- this means making a decision on every item, not reading it and leaving it. (4) Process all other digital inboxes (Slack threads, voice memos, camera roll screenshots, browser bookmarks). (5) Process the primary GTD inbox.
- GET CURRENT steps: (6) Review the Next Actions list -- check off completed items, delete items that are no longer relevant, and notice if any contexts have grown too large (more than 20 items in a single context suggests the context is too broad). (7) Review the past 2 weeks of the calendar for open loops -- completed meetings that generated commitments, calls that created follow-ups, events that created next actions. (8) Review the next 4 weeks of the calendar for preparation needed -- presentations to prepare, materials to send in advance, travel logistics to arrange. (9) Review the Waiting For list -- follow up on any item that has passed its follow-up date. (10) Review the Projects list -- does every project have a current next action? Does any project need its desired outcome revised? Are any projects actually complete? (11) Review Someday/Maybe -- are any items ready to be promoted to projects? Are any items stale and can be deleted?
- GET CREATIVE steps: (12) Review Areas of Focus -- is each area of life getting adequate attention through its projects? (13) Review goals and objectives (annual, quarterly) -- are current projects aligned with stated priorities? (14) Identify any new projects triggered during the review. (15) Process any new items generated during the review. (16) Choose the top 3 priorities for the coming week and write them down prominently.
- Build the review into the calendar as a recurring blocked appointment. If the user has a pattern of skipping it, offer the Minimum Viable Review: steps 5, 8, 9, 10 -- approximately 25-30 minutes. Once the habit is established, expand to the full 16-step review.

---

### Step 6: Design the Engage Phase

The engage phase is where the system pays off -- it is the framework for choosing, with confidence and without guilt, what to work on right now.

- Apply the four criteria in order. Context narrows the field first because it reflects hard constraints. Priority comes last because it is only meaningful among options that are contextually available and time-feasible.
- **Criterion 1 -- Context:** What can I physically do right now given where I am and what tools I have? If you are in a waiting room with a phone, only @phone and @quick-hit items are eligible. This narrows a list of 80 next actions to perhaps 15.
- **Criterion 2 -- Time available:** How many minutes until the next hard commitment (meeting, pickup, departure)? If you have 20 minutes, do not start a @deep-work item that requires 90 minutes. Matching task size to available time is one of the most underused productivity levers. GTD explicitly treats time availability as a filter, not just a schedule.
- **Criterion 3 -- Energy level:** What is your current cognitive energy? High energy is appropriate for creative work, complex writing, difficult decisions, and strategic thinking. Medium energy is appropriate for email, routine meetings, phone calls, and collaborative work. Low energy (end of day, post-lunch dip, illness) is appropriate for filing, admin, errands, and organizational tasks. Energy awareness prevents the common failure of spending high-energy hours on low-value tasks because they feel more manageable.
- **Criterion 4 -- Priority:** Of the remaining eligible options after applying the first three filters, which item delivers the most value relative to your current commitments and goals? This is not about urgency alone -- it includes importance, strategic alignment, and consequences of delay.
- Introduce the concept of Horizons of Focus as a priority calibration tool. GTD defines six horizons: Ground (current actions), Horizon 1 (current projects), Horizon 2 (areas of responsibility), Horizon 3 (goals, 1-2 year), Horizon 4 (vision, 3-5 year), Horizon 5 (purpose and principles). When priority is unclear at the ground level, look up one horizon. A next action that advances a goal (Horizon 3) outranks one that maintains routine (Horizon 2) unless a routine area is critically neglected.
- Explicitly address the "reactive vs. planned" balance. GTD does not assume all work is pre-planned -- it recognizes that work emerges unexpectedly. The system's job is to make the cost of reactive work visible. When you spend 3 hours responding to urgent requests, the system shows you what planned work you did not do. That visibility is not guilt -- it is data for re-prioritization.

---

### Step 7: Assemble the Complete GTD System Specification

Compile all five phases into the full system specification document following the Output Format below. Include tool-specific implementation notes where the user has named their tools. Cross-reference the phases so the user can see how items flow from capture through to engagement.

- Confirm that every input source from Step 1 has a capture method.
- Confirm that the Organize phase lists match the user's contexts (not defaults).
- Confirm the weekly review is scheduled at a specific day and time.
- Confirm that the two-minute rule, context filtering, and energy filtering are all explicitly stated.
- Include a "system health checklist" -- five indicators that tell the user whether their GTD system is working or beginning to fail.

---

### Step 8: Establish Maintenance and Troubleshooting Guidance

A GTD system is a living system. Provide guidance on maintaining it and recognizing decay.

- The five signs of GTD system decay: (1) The inbox has items that have been there for more than a week without a decision. (2) Projects on the project list have no current next action. (3) The weekly review was skipped two or more weeks in a row. (4) Items are being re-read during processing rather than decided on. (5) Calendar items are being used as to-do items (tasks with specific dates that could slide).
- The system reboot protocol: if the system has decayed, do not try to process backlog items individually. Instead, do a "system reset" -- archive everything in the inbox into a "backlog" folder, do a fresh mind sweep, process the new sweep, then process backlog items in 15-minute daily sessions over 1-2 weeks.
- Annual review: once a year, in addition to weekly reviews, do a deeper review at each Horizon of Focus -- are your areas of responsibility still the right ones? Are your goals from last year still the right goals? Prune projects that have been on the someday/maybe list for over a year without promotion.

---

## Output Format

```markdown
## GTD System Specification

**Date built:** [date]
**Primary tool:** [tool name(s)]
**Areas of Focus:** [list of the user's life/work domains]

---

### Phase 1: Capture
**Primary inbox:** [tool name and specific location within tool]
**Physical backup:** [notebook model, in-tray location, or "none"]
**Capture rule:** Any open loop captured within 60 seconds of recognition
**Two-minute rule:** Active -- items taking less than 2 minutes are done immediately during capture or processing, not added to the system

**Input Source Map:**

| Input Source | Capture Method | Processing Frequency | Notes |
|-------------|---------------|---------------------|-------|
| [source] | [method] | [daily / 2x daily / weekly] | [any routing notes] |
| [source] | [method] | [frequency] | [notes] |

**Mind sweep status:** [Complete / Pending / Not applicable -- returning user]

---

### Phase 2: Clarify (Processing Decision Tree)

```
INBOX ITEM
    |
    v
Is it actionable?
    |           |
   NO          YES
    |           |
    v           v
[Trash /    What is the desired outcome?
Reference / What is the next physical action?
Someday/      |
Maybe]        v
          Takes < 2 minutes?
              |         |
             YES        NO
              |         |
              v         v
          Do it now  Who does it?
                         |            |
                        ME          SOMEONE ELSE
                         |            |
                         v            v
                  More than 1 step?  Waiting For list
                     |          |    (person + date +
                    YES         NO    follow-up date)
                     |          |
                     v          v
               Create Project  Specific date/time?
               (outcome +         |           |
               next action)      YES          NO
                                  |           |
                                  v           v
                               Calendar    Next Actions
                               (hard-      (context tag)
                               landscape
                               only)
```

**Processing rules:**
- Never re-read and return an item to the inbox without a decision
- Every project created during processing must have a next action assigned before moving to the next inbox item
- Delegation without recording in Waiting For does not count as processing

---

### Phase 3: Organize (List Architecture)

**NEXT ACTIONS**
Organized by context -- choose context system that matches actual work environments:

*Option A -- Location/tool-based contexts (for users with distinct work environments):*
- @computer: [items]
- @phone: [items]
- @errands: [items]
- @office: [items]
- @home: [items]
- @agenda-[person name]: [items to discuss with specific people]

*Option B -- Energy/focus-based contexts (for knowledge workers, remote workers, or those always at a computer):*
- @deep-work: [items requiring 90+ min of focused effort, high cognitive energy]
- @shallow-work: [items manageable in 15-30 min windows, medium energy]
- @quick-hits: [items taking under 10 min, low energy acceptable]
- @calls-and-messages: [phone calls, video calls, messages to send]
- @agenda-[person name]: [items to raise in scheduled meetings]

**Context system chosen:** [A or B -- specify which and why]

---

**PROJECTS LIST**

| # | Area of Focus | Project Name | Desired Outcome (done = ...) | Current Next Action | Next Action Context |
|---|--------------|-------------|------------------------------|--------------------|--------------------|
| 1 | [area] | [name] | [outcome in completed-state language] | [specific physical action] | [@context] |
| 2 | [area] | [name] | [outcome] | [action] | [@context] |

**Project count:** [n] active projects
**Target:** Every project has exactly one current next action visible on the Next Actions list

---

**WAITING FOR LIST**

| # | Deliverable/Item | Waiting On (person/org) | Delegated/Requested Date | Follow-Up Date | Channel |
|---|-----------------|------------------------|--------------------------|---------------|---------|
| 1 | [item] | [person] | [date] | [date] | [email / Slack / verbal] |

---

**CALENDAR**
**Tool:** [Calendar app]
**Policy:** Hard-landscape only -- appointments, external deadlines, events, travel. No tasks that could slide to another day.
**Visible horizon:** [2 weeks / 4 weeks -- as set in the weekly review]

---

**SOMEDAY/MAYBE LIST**
**Tool:** [location in system]
**Review frequency:** Weekly (during weekly review, Step 11)
**Expiry policy:** Items untouched for 90+ days are deleted or deliberately re-committed

| # | Item | Date Added | Last Reviewed | Notes |
|---|------|-----------|--------------|-------|
| 1 | [idea or possibility] | [date] | [date] | [any notes] |

---

**REFERENCE SYSTEM**
**Tool:** [Notion / Obsidian / file folders / Google Drive / etc.]
**Organization method:** [alphabetical / by Area of Focus / tag-based / search-centric]
**Filing time target:** Under 30 seconds per item
**Test:** Can you retrieve any reference item within 60 seconds without searching your memory?

---

### Phase 4: Reflect (Weekly Review)

**Scheduled:** [Day of week], [time], [location]
**Duration:** [60-90 minutes]
**Blocked in calendar as:** Non-negotiable recurring appointment

**GET CLEAR (empty all collection points):**

| Step | Action | Target Duration |
|------|--------|----------------|
| 1 | Collect all loose papers, sticky notes, receipts, and physical items -- place in inbox | 3-5 min |
| 2 | Process notes from all meetings and conversations since last review | 5-10 min |
| 3 | Process email inbox to zero (decide on each item -- do not re-read without deciding) | 10-15 min |
| 4 | Process all secondary digital inboxes (Slack, voice memos, browser bookmarks, screenshots) | 5-10 min |
| 5 | Process primary GTD inbox to zero | 5-10 min |

**GET CURRENT (update all lists):**

| Step | Action | Target Duration |
|------|--------|----------------|
| 6 | Review Next Actions list -- check off completed, delete irrelevant, note bloated contexts | 5 min |
| 7 | Review past 2 weeks of calendar for open loops and uncaptured commitments | 5 min |
| 8 | Review next 4 weeks of calendar for preparation needed | 5 min |
| 9 | Review Waiting For list -- send follow-ups on overdue items | 5 min |
| 10 | Review Projects list -- does every project have a next action? Any projects complete? | 10-15 min |
| 11 | Review Someday/Maybe -- promote any items to projects, delete stale items (90+ days) | 5 min |

**GET CREATIVE (look at the bigger picture):**

| Step | Action | Target Duration |
|------|--------|----------------|
| 12 | Review Areas of Focus -- is each area getting proportional attention? | 5 min |
| 13 | Review goals and objectives -- are current projects aligned with priorities? | 5 min |
| 14 | Identify new projects triggered during the review | 3 min |
| 15 | Process new items generated during the review | 5 min |
| 16 | Write the top 3 priorities for the coming week | 3 min |

**Total:** 75-120 minutes for a full system

**Minimum Viable Review (if time is scarce -- 25 min):**
Steps 5, 6, 9, 10 only. This preserves system integrity at a reduced level.

---

### Phase 5: Engage (Choosing What to Do Right Now)

**Apply the four filters in order:**

| Filter | Question | Effect |
|--------|----------|--------|
| 1. Context | What can I do here with the tools I have? | Eliminates physically unavailable actions |
| 2. Time available | How many minutes until my next hard commitment? | Eliminates actions that exceed available window |
| 3. Energy level | Am I at high, medium, or low cognitive energy? | Matches task complexity to current capacity |
| 4. Priority | Of remaining options, which delivers the most value toward my goals? | Final selection |

**Energy-to-task matching guide:**

| Energy Level | Appropriate Task Types | Avoid |
|-------------|----------------------|-------|
| High (morning, post-exercise, fresh start) | Deep writing, strategy, creative work, complex decisions, difficult conversations | Admin, filing, email triaging |
| Medium (post-lunch, mid-afternoon) | Email, meetings, collaborative work, routine decisions, phone calls | Deeply creative or analytical work |
| Low (end of day, tired, sick) | Filing, organizing, errands, data entry, reading low-complexity material | Any task requiring judgment or creativity |

**Horizons reference (for priority disputes):**

| Horizon | Scope | Example |
|---------|-------|---------|
| Horizon 5 | Purpose and principles | Why do I do what I do? |
| Horizon 4 | Vision (3-5 years) | What does my life look like in 5 years? |
| Horizon 3 | Goals (1-2 years) | What do I want to achieve this year? |
| Horizon 2 | Areas of responsibility | Career, Health, Finances, Relationships |
| Horizon 1 | Projects (current) | All active project outcomes |
| Ground | Next actions | The specific physical tasks |

When two actions seem equally important, look up one horizon to decide which advances a higher-priority outcome.

---

### System Health Checklist

Review monthly. If 3+ indicators are red, do a system reboot.

| Indicator | Healthy | Warning | Critical |
|-----------|---------|---------|---------|
| Inbox age | All items < 48 hours old | Items 2-7 days old | Items > 1 week old |
| Project coverage | Every project has a next action | 1-3 projects missing next actions | 4+ projects have no next action |
| Weekly review streak | 0-1 missed in last 8 weeks | 2-3 missed | 4+ missed |
| Calendar integrity | Only hard-landscape items | Occasional soft items | Calendar used as to-do list |
| Next actions count | 30-80 actions across all contexts | <15 (under-captured) or 80-150 | >150 actions (not processing) |
```

---

## Rules

1. **Every inbox item must receive a decision during processing -- never return it unprocessed.** Re-reading without deciding is not processing. It is the most common reason people feel overwhelmed despite having a system. If a decision is too difficult to make in a single session, capture "Decide about [item]" as a next action and file the item in reference.

2. **Next actions must be specific, physical, and visible.** The test: could a stranger with relevant skills execute this action without asking what it means? "Work on proposal" fails. "Open Google Docs, create new doc titled 'Q4 Proposal Draft,' and write three bullet points for the executive summary" passes. Vague next actions are the primary reason GTD users experience friction when engaging with their lists.

3. **Every project on the projects list must have exactly one current next action that appears on the next actions list.** Not zero (the project stalls). Not three (creates ambiguity about what to do first). Exactly one visible next action. Check this during every weekly review.

4. **The calendar is a sacred space for hard-landscape items only.** Never add to the calendar a task that could be done on a different day. Doing so inflates the calendar, breaks its integrity, and causes the system to lose trust. If a user pushes back on this, explain: a calendar that contains "maybe do this on Tuesday" items is one you stop trusting by February.

5. **Context tags must reflect the user's real environments, not GTD textbook defaults.** A remote knowledge worker who is always at a computer has no use for @computer as a differentiator. Forcing users into ill-fitting contexts is one of the leading reasons GTD gets abandoned. Always ask about actual work environments and calibrate accordingly.

6. **The two-minute rule applies only to items where the next action is already clear.** Do not spend 10 minutes figuring out what to do about something and then execute a 90-second task and call it a two-minute rule application. The rule is not "act on things quickly" -- it is "execute immediately when the action is obvious and brief."

7. **Someday/Maybe is not a graveyard.** It is an incubation list. It must be reviewed weekly. Items that have sat for 90+ days without promotion must be explicitly recommitted to or deleted. A Someday/Maybe list that is never reviewed is a guilt pile, not a productivity tool.

8. **Do not recommend specific productivity apps unless the user asks.** The GTD methodology is tool-agnostic. Recommending a specific app before understanding the user's constraints (technical comfort, platform, cost, integration needs) risks derailing the implementation with a tool choice debate. Describe the system requirements (fast capture, multiple list views, context filtering, calendar integration) and let the user match them to their own tool preferences.

9. **Separate work and personal life into areas of focus within one system, not into two separate systems.** Users who maintain a work GTD system and a personal GTD system reliably abandon one within 60 days. The human mind does not separate work and personal stress -- the system should mirror this by being one unified trusted system with area-of-focus labels as organizational layers.

10. **Flag immediately if the user has no time allocated for a weekly review.** A GTD system without a weekly review is not GTD -- it is a list-making hobby. Before designing any other phase of the system, establish when and where the weekly review will happen. If the user claims they cannot find 60-90 minutes per week, work with them to identify time that is currently wasted (unfocused meeting attendance, social media, low-ROI commitments). The review time is the most high-leverage 90 minutes of the week.

11. **The mind sweep is mandatory for first-time GTD implementations.** Building a GTD system on top of an uncaptured backlog of open loops means the inbox will be perpetually incomplete and the user will still feel mental overhead from uncaptured items. The mind sweep before system build is not optional -- it is the foundation.

12. **Do not allow the Projects list and the Next Actions list to become the same list.** This is the most common structural collapse in DIY GTD implementations. Projects are outcomes. Next actions are specific tasks. Conflating them creates a list that is neither useful for planning nor useful for execution. Keep them strictly separated.

---

## Edge Cases

### The User Has 50+ Active Projects
This is not a problem to solve -- it is normal for experienced professionals and parents with complex lives. Do not encourage them to eliminate projects arbitrarily. Instead: (1) Group projects into Areas of Focus (Career, Health, Finances, Home, Relationships, Community, etc.) with typically 5-15 projects per area. (2) During the weekly review, review projects by area rather than as a monolithic list -- this makes the review tractable. (3) Distinguish between "active" projects (you are moving these forward this week) and "on-hold" projects (temporarily paused waiting for an external condition). On-hold projects do not need a current next action -- they need a trigger condition ("restart when budget is approved"). (4) If project count exceeds 100, this signals that the user is not distinguishing between projects and areas of responsibility. Help them recognize that "maintain physical health" is an area of focus, not a project -- projects within it include "Complete 5K training program by April" and "Schedule annual physical."

### The User Has No Physical Separation Between Environments (Full Remote Worker)
Classic GTD context tags (@office, @home, @computer, @phone, @errands) were designed for a pre-smartphone era when people moved between distinct locations with distinct tool sets. A remote worker who is always home, always at a computer, with a phone always in their pocket renders most location-based contexts meaningless. Implement energy-based contexts instead: @deep-work (high energy, long blocks, no interruptions), @shallow-work (medium energy, interruptible, 15-30 min tasks), @quick-hits (low energy, under 10 min), @calls-and-messages (any energy, synchronous or asynchronous communication). Supplement with @waiting-on (instead of Waiting For as a separate list, if the tool supports inline context tagging). This context system accurately reflects the real constraints of remote knowledge work.

### The User Has Previously Tried GTD and Abandoned It
This is extremely common -- GTD has a high abandonment rate among self-implementers because the initial setup burden is significant. Before rebuilding, diagnose which phase failed: (1) If they stopped capturing -- the capture friction was too high. Reduce to one capture point. (2) If the inbox became a backlog -- they stopped processing. Implement a daily processing habit (15 minutes each morning) rather than relying on weekly processing. (3) If the next actions list felt useless -- contexts did not match their reality. Redesign contexts from scratch. (4) If projects proliferated without progress -- next actions were missing or vague. (5) If the weekly review collapsed -- the time slot was not protected or the review felt too long. Implement the Minimum Viable Review and expand later. Do not rebuild the same system. Diagnose and fix the specific failure point.

### The User Is in an Interruption-Heavy Role (Manager, Parent, Customer-Facing)
For users whose workday is primarily reactive -- back-to-back meetings, constant questions from reports, family emergencies -- the standard GTD model of long next-action lists may feel aspirational but disconnected. Adapt the system: (1) Accept that 60-70% of their work is unplanned and design the system to capture reactive outcomes rather than prevent them. Every reactive task completed should be logged (not planned) for later reflection. (2) Maintain a shorter, higher-leverage next-actions list of 15-20 items maximum -- the things they will push for in the margins. (3) Treat meeting agendas as context-specific next-action lists: before each meeting, review the @agenda-[person] context and bring all relevant items into the meeting as a prepared list. (4) The weekly review becomes even more critical in interruption-heavy roles -- without it, the week's reactive work goes completely unreviewed and patterns of reactive overload never get addressed.

### The User Wants to Use GTD Across a Team
This is outside the scope of GTD as David Allen defined it -- GTD is explicitly a personal productivity system. Do not try to impose GTD on a team. If the user wants a shared project management system, cross-reference to business project management skills. However: one person on a team can use GTD for their own work within any team structure. Their GTD Waiting For list will contain items delegated to teammates. Their calendar will reflect team meetings. Their projects list will include their personal contributions to team projects. The system is theirs; the deliverables they produce may serve a team.

### The User Cannot Achieve Inbox Zero in Processing Sessions
If a user has a chronically overwhelming email inbox (1,000+ unprocessed emails), do not attempt to process from oldest to newest. Implement a two-phase rescue: (1) Archive everything currently in the inbox into a folder called "Before [today's date]" and declare the archive off-limits except for intentional retrieval. Start fresh with a clean inbox today. (2) Process the "Before" archive in 15-minute daily sessions, oldest first. This approach, sometimes called the "email bankruptcy" approach, is used by productivity coaches and avoids the paralysis of an insurmountable backlog. The goal is to restore trust in the inbox as a processing queue, not to achieve heroic processing speed.

### The User Is Building GTD for the First Time and Feeling Overwhelmed by the System Complexity
GTD's full specification is cognitively demanding to implement all at once. Offer a staged implementation: **Week 1** -- establish the inbox only and practice the capture habit. Every open loop gets written down within 60 seconds. No organizing yet. **Week 2** -- add the clarify step. Process the inbox every morning for 15 minutes. Create the Next Actions list and Projects list. **Week 3** -- add context tags and the Waiting For list. Build the Reference system. **Week 4** -- conduct the first weekly review. After the first weekly review, the system is live. Staging reduces the activation energy of starting and builds each habit on a stable foundation. The system does not need to be complete to begin delivering value -- even the capture habit alone reduces cognitive load significantly.

---

## Example

**Input:** "I want to set up a GTD system. I'm a product manager at a software company. I use Notion for notes, Gmail for email, and Google Calendar. My inputs are Gmail (I get about 80-100 emails per day), Slack from my engineering and design teams, a paper notebook I carry to meetings, and ideas I have throughout the day. I think I have maybe 15-20 active projects -- a mix of product roadmap work, hiring, cross-functional stuff, and some personal things like home renovation and planning a family trip. My biggest pain point is that I drop things -- I'll say I'll do something in a meeting and then completely forget. I could realistically protect Friday at 4 PM for a weekly review. I prefer not to use too many apps."

---

**Output:**

```markdown
## GTD System Specification

**Date built:** [current date]
**Primary tool:** Notion (notes, lists, reference) + Gmail (email) + Google Calendar (scheduling)
**Tool philosophy:** Three-tool system -- Notion as the GTD hub, Gmail as a managed input channel, Google Calendar as the hard-landscape layer only
**Areas of Focus:** Product Management, Engineering Leadership, Design Collaboration, Hiring, Personal Development, Home, Family

---

### Phase 1: Capture

**Primary inbox:** Notion -- "GTD Inbox" database, pinned to sidebar on desktop and added as a widget on phone home screen
**Physical backup:** Paper notebook (meeting capture) -- processed into Notion within 24 hours of each meeting
**Capture rule:** Any open loop captured within 60 seconds of recognition
**Two-minute rule:** Active -- if an action is obvious and takes less than 2 minutes, do it immediately

**Critical note on your biggest pain point (dropping meeting commitments):** Add this trigger to every meeting: at the end of each meeting, before closing your notebook, spend 60 seconds scanning your notes for any commitments you made or others made to you. Capture your commitments to Notion GTD Inbox immediately. Capture others' commitments to your Waiting For list. This single habit will eliminate the "dropped meeting commitment" problem within 2 weeks.

**Input Source Map:**

| Input Source | Capture Method | Processing Frequency | Notes |
|-------------|---------------|---------------------|-------|
| Gmail (80-100/day) | Process to Notion GTD Inbox via copy-paste or Gmail label "→ GTD" | 2x daily: 10 AM and 3 PM | Do not process email continuously; batched processing prevents reactive mode |
| Slack (engineering team) | Copy message URL + summary to Notion GTD Inbox; do not leave Slack as an inbox | Within 2 hours of reading | Use Slack's "save for later" as a temporary staging area only, emptied twice daily |
| Slack (design team) | Same as above | Within 2 hours | Consider muting non-critical channels and checking on schedule |
| Paper meeting notebook | Process all notes and commitments into Notion GTD Inbox | Within 24 hours of meeting -- same-day preferred | Use a symbol system: circle = commitment I made, square = waiting for someone else |
| Ideas throughout the day | Notion quick-add on phone (iOS/Android widget) | Immediately | Voice-to-text for hands-free capture while walking or commuting |
| Google Calendar invites | Review invite for any prep actions needed; capture prep tasks in GTD Inbox | At time of accepting | Add note to calendar event: "Prep: [what to prepare]" |

**Mind sweep status:** Required before system goes live -- schedule 45-60 minutes to dump every open loop before the first processing session. Use the following categories as prompts: Current product roadmap items not yet formalized; hiring pipeline commitments; cross-functional asks from stakeholders; personal promises made to family or friends; home renovation tasks; trip planning items; professional development commitments; feedback you owe; decisions pending. Target: 50-150 items captured. This is normal.

---

### Phase 2: Clarify (Processing Decision Tree)

```
INBOX ITEM
    |
    v
Is it actionable?
    |                     |
   NO                    YES
    |                     |
[Trash: irrelevant]      What is the DESIRED OUTCOME?
[Reference: file in      What is the NEXT PHYSICAL ACTION?
 Notion Reference DB]         |
[Someday/Maybe: add           v
 to incubation list]     Takes < 2 minutes AND action is obvious?
                              |                    |
                             YES                   NO
                              |                    |
                          Do it now           Who owns it?
                                               |            |
                                              ME         SOMEONE ELSE
                                               |            |
                                               v            v
                                       More than 1 step?  Waiting For
                                          |          |    (person + date
                                         YES         NO    + follow-up date)
                                          |          |
                                          v          v
                                    Create Project  Specific date/time?
                                    in Notion        |           |
                                    (outcome +       YES         NO
                                    next action)      |           |
                                                      v           v
                                                   Google     Next Actions
                                                   Calendar   (context tag)
                                                   (hard-
                                                   landscape
                                                   only)
```

**Processing discipline for Gmail specifically:** Given 80-100 emails per day, the clarify step is critical. In each 30-40 minute Gmail processing session: (1) Start from the top. (2) For each email, make one decision -- do not read and leave unread. (3) FYI emails with no action: archive immediately. (4) Emails requiring a response under 2 minutes: reply now, then archive. (5) Emails requiring a longer response: copy subject + key context to Notion GTD Inbox, archive the email, then process the Notion item in your next processing session. (6) Target: Gmail inbox at zero after each session.

---

### Phase 3: Organize (List Architecture)

**CONTEXT SYSTEM CHOSEN: Energy-based (with meeting agenda overlay)**

Rationale: As a product manager, you are always at a computer with your phone nearby. Location-based contexts (@computer, @office) are not differentiating. Your real constraint is energy level and available time between meetings.

**Context definitions:**
- **@deep-work:** Tasks requiring 60+ minutes of uninterrupted focus and high cognitive energy. Strategic writing, roadmap decisions, complex analysis, difficult feedback to compose. Examples: "Draft Q1 roadmap narrative," "Write design brief for checkout flow."
- **@shallow-work:** Tasks manageable in 15-30 minute windows at medium energy. Slack responses drafted, documentation updates, ticket grooming, email responses requiring more than 2 minutes. Examples: "Update JIRA with spec changes from today's sync," "Reply to Sarah's roadmap question in Slack."
- **@quick-hits:** Tasks under 10 minutes at any energy level. Brief administrative tasks, short confirmations, simple decisions. Examples: "Approve PTO request from Marcus," "Add competitor feature to research backlog."
- **@calls-meetings:** Phone calls, video calls, and in-person conversations to initiate. Examples: "Call recruiting agency about senior PM role," "Schedule 1:1 with new hire for onboarding."
- **@agenda-[name]:** Items to raise in your next scheduled meeting with a specific person. Reviewed before each meeting. Examples: @agenda-CTO: "Discuss API deprecation timeline," "Get decision on authentication approach." @agenda-Design-Lead: "Align on mobile-first direction for Q3."

---

**PROJECTS LIST (initial -- expand after mind sweep)**

| # | Area of Focus | Project Name | Desired Outcome | Current Next Action | Context |
|---|--------------|-------------|-----------------|--------------------|---------| 
| 1 | Product | Q3 Roadmap Finalized | Roadmap approved by VP and shared with engineering by Aug 1 | Draft prioritization rationale for top 5 features | @deep-work |
| 2 | Product | Checkout Flow Redesign | New checkout live in staging by Sept 15, passing all A/B criteria | Write design brief with success metrics | @deep-work |
| 3 | Hiring | Senior PM Hire | Offer accepted, start date confirmed | Review 3 candidate profiles from recruiter and shortlist 2 | @shallow-work |
| 4 | Hiring | Engineering Manager Hire | EM hired and first 30-day plan in place | Schedule debrief with hiring panel re: last round | @calls-meetings |
| 5 | Cross-functional | Q3 OKR Alignment | All 3 cross-functional teams aligned on shared OKR metrics | Draft shared OKR doc and send to ops, marketing, data for review | @deep-work |
| 6 | Home | Kitchen Renovation | New cabinets and countertops installed and signed off by contractor | Research and contact 3 local cabinet makers for quotes | @quick-hits |
| 7 | Family | Summer Trip Planning | Flights, accommodation, and key activities booked for July 15-25 | Decide between Greece and Portugal (discuss with partner tonight) | @agenda-partner |
| 8 | Personal Development | PM Leadership Course | Course completed and certificate earned | Purchase course and block study time on calendar | @quick-hits |

**Note:** After completing your mind sweep, expect this list to grow to 25-40 projects. That is normal and healthy.

---

**WAITING FOR LIST (initial examples)**

| # | Deliverable | Waiting On | Requested Date | Follow-Up Date | Channel |
|---|-------------|-----------|---------------|---------------|---------|
| 1 | Design mockups for mobile nav | Priya (Design Lead) | [today] | [+7 days] | Slack DM |
| 2 | Legal review of vendor contract | Legal team | [today -3 days] | [today +2 days] | Email thread |
| 3 | Interview feedback forms from panel | Marcus, Jess, Tomás | [today -1 day] | [today +2 days] | Email |
| 4 | Budget approval for PM tooling | VP Product | [today -5 days] | [today] | Slack -- OVERDUE: follow up today
