---
name: task-capture-system
description: |
  Builds a complete task capture system with inbox location, capture criteria, two-minute rule, and processing cadence. Produces a deployable system specification the user can immediately adopt.
  Use when the user asks about capturing tasks, organizing incoming work, setting up a task inbox, or building a system to track everything they need to do.
  Do NOT use for prioritizing existing tasks (use task-prioritization), scheduling tasks into time blocks (use time-blocking), or enterprise project intake processes (use business project-management skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "time-management planning automation"
  category: "productivity"
  subcategory: "task-management"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Task Capture System

## When to Use

**Use this skill when:**
- User says they keep forgetting tasks, losing track of commitments, or feeling like things are falling through the cracks
- User describes scattered capture behavior -- sticky notes on a monitor, multiple apps, a mental to-do list, or random text messages to themselves
- User wants to build a dedicated inbox or collection system for incoming work, ideas, and obligations
- User feels cognitive overload from trying to hold open loops in working memory instead of an external system
- User asks how to implement Getting Things Done (GTD) capture specifically, without asking for the full GTD workflow
- User mentions a specific tool (Todoist, Notion, a paper notebook) and wants to configure it as a proper capture system
- User is returning to productivity after a period of system collapse and needs to rebuild from scratch
- User describes a specific failure mode: "I write things down but never look at them," "I have three apps and none of them is complete," or "I forget things people asked me to do"

**Do NOT use when:**
- User already has a functioning capture system and wants to prioritize the items inside it -- use `task-prioritization` instead
- User wants to schedule captured tasks into specific time slots on a calendar -- use `time-blocking`
- User asks for a full GTD implementation including contexts, projects, weekly review, and someday/maybe -- use `gtd-workflow`
- User is setting up a team-level intake process with assignees, SLAs, and workflow states -- use business project-management skills
- User wants to track deliverables across a project with milestones and dependencies -- use `milestone-planning`
- User's primary problem is deciding which tasks to work on next, not capturing them -- use `task-prioritization`
- User needs a structured meeting action-item workflow for a team -- use `meeting-action-items`

---

## Process

### Step 1: Diagnose the User's Current Capture Failure Mode

Before designing anything, identify the specific breakdown. Different failures require different solutions.

- Ask the user where tasks currently come from. Enumerate every source explicitly: email, chat (Slack, Teams, iMessage), meetings, phone calls, their own thoughts, requests from family, web browsing, reading, voicemail, paper mail, social media DMs.
- Ask how many items per day typically need capturing. Under 10 is a low-volume system; 10-30 is medium; 30+ is high-volume and requires pre-filtering.
- Ask whether tasks are being lost (never written down), ignored (written down but never processed), or buried (captured but in a tool that never gets opened).
- Identify the gap: a capture problem (things are not getting recorded) is different from a processing problem (things are recorded but never acted upon). This skill addresses the capture layer; acknowledge if the user also needs processing design.
- Ask what tools the user already has access to and actually opens daily. A tool they already open is always preferable to an ideal tool they must form a new habit to open.
- Ask whether the user works in one physical location or moves between contexts (desk, commute, client sites, home). Physical mobility dictates which capture tool can be "always available."

### Step 2: Select and Configure the Single Inbox

The most important structural decision in any capture system is radical consolidation: one inbox, not several.

- The inbox must satisfy three criteria simultaneously: (1) always physically accessible within 5 seconds, (2) zero friction to add an item (no login, no navigation, no formatting required), and (3) actually opened at least twice per day by the user.
- Recommend the following based on user context:
  - **Primarily digital, desk-based worker:** A dedicated inbox list in an app already on their phone and computer. Strong candidates are Todoist Inbox (native concept), Things 3 Inbox, OmniFocus Inbox, TickTick Inbox, or even a single Apple/Google Reminders list explicitly named "Inbox." The app must have a widget or keyboard shortcut for instant capture.
  - **Mobile or physical worker:** A pocket notebook (Field Notes, Leuchtturm1917 pocket, 3x5 index card stack with binder clip) used as the sole capture point, with a daily digital transfer step.
  - **Voice-first user:** A voice memo app or voice-to-task integration (e.g., Siri adding to Reminders, Google Assistant adding to Tasks, or Amazon Alexa adding to a to-do list). Voice capture is the fastest possible method at under 3 seconds.
  - **Heavy email user:** A dedicated label or folder called "Action Required" in Gmail or Outlook that functions as the inbox, combined with a phone app for non-email captures. These must be processed in the same session.
- Name the inbox explicitly. "My Reminders" is not an inbox. "Inbox" is an inbox. The name matters because it signals the item's status: unprocessed, not yet committed.
- Disable any "smart" categorization or automatic sorting in the inbox. All items must land flat in a single undifferentiated list until processed. No folders, no tags, no priority flags applied at capture time.
- Configure the fastest possible capture path: add the app widget to the phone's home screen lock screen (iOS 16+/Android), create a keyboard shortcut or quick-add hotkey on the desktop, and if using voice, set up the trigger phrase.

### Step 3: Map Every Task Source to a Consolidation Rule

Every source of tasks must have an explicit, documented consolidation method. Undocumented sources become system leaks.

- List every source identified in Step 1 and assign each one a capture method and a consolidation window.
- **Email:** For actionable emails, use the "forward-to-self" method (forward to a personal email address that converts to tasks, such as Todoist's email-to-task address, or simply forward to yourself and process in the email inbox processing session). Alternatively, use the email client's native task feature (Gmail Tasks sidebar, Outlook Flag for Follow-Up) as a secondary inbox that is processed in the same session.
- **Slack/Teams/chat:** Copy the message text and add it to the inbox immediately, or use the built-in "Remind me about this" feature (Slack lets you set a reminder on any message). Never treat an unread Slack message as a task -- it will be buried in 30 minutes.
- **Meetings:** Capture action items in real time into the inbox, not into a meeting notes doc. A meeting notes doc is reference; the inbox is for next actions. Items written in notes docs have a 70%+ decay rate -- they are never processed. Write "Call Marcus re: budget approval" into the inbox during the meeting.
- **Browser tabs / web research:** Use a single "read later" approach: save the URL to the inbox with a note about what action to take (not just the link), or use a read-later service and treat that service's inbox as a secondary source to process weekly.
- **Random thoughts:** This is the most frequently lost source. The solution is immediate capture via voice, widget, or a single physical notepad. Teach the user the "mind sweep" concept: when a thought arises that needs future action, the physical sensation of "I should remember this" is the trigger to capture. Delaying capture even 2 minutes results in significant loss.
- **Physical mail / documents:** A physical inbox tray on the desk serves as the capture point. Items in the tray are processed during the next scheduled processing session, at which point action items are transferred to the digital inbox.
- Set maximum consolidation windows: email within the same processing session, chat within 15 minutes of reading, meeting items within 5 minutes of meeting end, random thoughts within 30 seconds.

### Step 4: Define Capture Criteria with Explicit Inclusions and Exclusions

A bloated inbox collapses under its own weight. Precise criteria keep signal high and noise low.

- **Always capture:**
  - Any commitment made to another person ("I'll send you that by Thursday") -- these carry the highest cost if dropped
  - Any task that will take more than 2 minutes to complete
  - Any follow-up triggered by an email, meeting, Slack message, or phone call
  - Any deadline-bound obligation, even if the deadline is months away
  - Any multi-step activity (anything requiring 2+ actions is a project seed, not just a task -- capture it anyway, classify it during processing)
  - Waiting-for items: anything you have delegated or are expecting from someone else ("Waiting for Maya's design mockup") -- these must be captured or they disappear from the system
- **Never capture (handle at source instead):**
  - Reference information (article links, documentation, contacts, specs): file directly to a reference system (Notion, Apple Notes, Obsidian, a file folder) -- do not let reference items colonize the inbox
  - Items that take under 2 minutes and can be done immediately: do them now at point of capture, do not record them
  - Pure calendar events with no action component (a dentist appointment you already scheduled): put them on the calendar, not in the inbox
  - Someday/maybe items (ideas for projects you might want to do in the future): route to a dedicated someday/maybe list, not the inbox -- these items have no next action yet
  - Recurring tasks already built into a system (weekly team meeting, daily standup): keep them in a recurring task manager, not re-captured each time
- The key cognitive shift: the inbox is not a permanent list. It is a transit zone. Every item in the inbox is unclassified and awaiting a decision. Items that stay in the inbox for more than 48 hours indicate a processing failure, not a capture failure.

### Step 5: Implement the Two-Minute Rule as a Hard Filter

The two-minute rule, popularized by David Allen's GTD methodology, prevents the inbox from filling with trivial items.

- The rule: if the task you have just identified would take 2 minutes or less to complete, do it immediately rather than capturing it.
- The rationale: capturing, processing, and revisiting a 90-second task takes longer than 90 seconds. The overhead of managing the item exceeds the cost of doing it.
- Apply the rule at point of capture, not during processing. If a thought arises -- "I should reply to that quick email from Dan" -- and replying takes under 2 minutes, do it immediately. If you are in a context where you cannot act (driving, in a meeting), capture it anyway and apply the rule during processing.
- Common calibration errors: tasks that feel like 2 minutes often take 5-10 minutes (replying to a complex email, finding a file, making a phone call). Teach the user to be conservative -- if there is any doubt, capture it.
- Track two-minute completions for the first week to calibrate the user's personal threshold. Some users find their threshold is actually 5 minutes; others find it should be 1 minute. The number is individual.
- The rule has a critical boundary: do not let the two-minute rule become a procrastination trigger that empties the inbox through execution instead of processing. If more than 30% of inbox items are being resolved as two-minute tasks during processing, the capture criteria may be too loose.

### Step 6: Design the Processing Cadence

A capture system without a processing schedule is just organized clutter. Processing transforms captured items into committed next actions.

- Processing is distinct from doing. During processing, the user is making decisions about items, not executing them. The output of processing is an organized action list, not a completed task list.
- Processing cadence based on daily volume:
  - **Under 10 items per day:** One daily processing session, ideally at the end of the workday (5:00-5:30 PM) or start of the next morning (8:00-8:30 AM). Choose the time when the user has 15-20 uninterrupted minutes.
  - **10-30 items per day:** Two daily sessions -- morning (8:00-8:30 AM, clearing overnight accumulation) and afternoon (1:00-1:30 PM, clearing morning accumulation). Each session should clear to inbox zero.
  - **30+ items per day:** Three sessions -- morning, midday, and end of day. Consider adding a pre-filter rule (see Edge Cases). Each session should take no more than 20 minutes; if it takes longer, the capture criteria are too broad.
- Each processing session follows a strict sequence for every inbox item:
  1. Read the item fully and understand what it represents
  2. Is it still relevant? If no, delete it
  3. Is it actionable? If no, either delete it, file it as reference, or move it to the someday/maybe list
  4. If actionable: identify the single next physical action (not "work on report" but "open Word, load Q3 report file, write introduction paragraph")
  5. Does this next action take under 2 minutes? If yes, do it now during processing
  6. Does this action belong to a larger project? If yes, link it to the project or create the project
  7. Is there a specific due date? If yes, assign it
  8. Is it something someone else needs to do? If yes, move to a "Waiting For" list with the person's name and expected completion date
  9. Move the item out of the inbox into the appropriate list (next actions, project list, waiting for, calendar)
- Inbox zero is non-negotiable as a standard. Items remaining in the inbox at the end of a processing session indicate a decision deferred -- which is itself a decision. If the user cannot process an item, they must at minimum decide: "I will process this on [date/time]" and schedule that.
- Set a hard time limit for processing sessions: 20 minutes for medium volume, 30 minutes maximum for high volume. This prevents processing from becoming a second job.

### Step 7: Establish Weekly Maintenance to Prevent System Decay

Capture systems have a predictable decay curve. Without maintenance, most systems become dysfunctional within 3-6 weeks.

- Schedule a weekly review of the capture system itself (separate from reviewing tasks). This takes 10-15 minutes maximum.
- Review checklist items:
  - Are all sources still consolidating to the inbox? Check for new sources that have appeared (a new Slack channel, a new email account, a new person making requests).
  - Count total items captured this week. Establish a baseline in week 1. If week 3 shows 40% fewer items than baseline, the system is likely suffering from "anticipatory filtering" -- the user is mentally pre-screening items before writing them down, which defeats the purpose of externalizing memory.
  - Is the inbox reaching zero after each session? If not, identify which types of items are getting stuck. Stuck items usually signal unclear next actions, items that belong to projects that haven't been defined, or items the user is avoiding.
  - Review the someday/maybe list for items that have become actionable.
  - Confirm that the processing schedule times are still achievable. Life changes -- a new meeting cadence may have eaten the morning processing slot.
- Identify and decommission system leaks: any place the user writes tasks that is not the designated inbox is a leak. Common leaks: browser tab hoarding (using open tabs as a to-do list), starred emails, physical notes not transferred to the inbox, and text messages to self.

---

## Output Format

```
## Task Capture System Specification
**Generated for:** [User name or role]
**Date:** [Date of setup]
**Daily task volume:** [estimated items per day]
**System type:** [Digital / Physical / Hybrid]

---

### 1. The Single Inbox

| Field | Value |
|-------|-------|
| **Tool** | [Specific app or physical tool name] |
| **Location** | [Where it lives: phone widget, desktop shortcut, desk tray] |
| **Access path** | [Exact steps: "Lock screen widget" / "Cmd+Space, type Todoist" / "Pocket notebook"] |
| **Target access time** | [Under X seconds from any context] |
| **Inbox name** | ["Inbox" -- not "Tasks," not "To Do"] |

**Quick-capture configuration:**
- Phone: [Widget / Lock screen / Siri shortcut / Voice command configured as: ______]
- Desktop: [Keyboard shortcut / Browser extension / Menu bar app configured as: ______]
- Physical backup: [Pocket notebook brand/size if applicable]

---

### 2. Source Consolidation Rules

| Source | Volume/Day | Capture Method | Max Consolidation Window |
|--------|-----------|----------------|--------------------------|
| [Source 1 e.g., Email] | [~X items] | [Forward / Flag / Copy-paste to inbox] | [Within X minutes] |
| [Source 2 e.g., Slack] | [~X items] | [Remind me / Copy text to inbox] | [Within 15 min of reading] |
| [Source 3 e.g., Meetings] | [~X items] | [Live capture during meeting] | [Within 5 min of meeting end] |
| [Source 4 e.g., Own thoughts] | [~X items] | [Voice / Widget / Notebook] | [Within 30 seconds] |
| [Source 5 e.g., Physical mail] | [~X items] | [Physical inbox tray --> transfer] | [Within same-day session] |

**System leaks to close:**
- [ ] [Specific leak e.g., "Starred emails not being processed"] -- Resolution: [specific action]
- [ ] [Specific leak e.g., "Browser tabs used as task list"] -- Resolution: [specific action]

---

### 3. Capture Criteria

**CAPTURE THESE (route to inbox):**
- [ ] Commitments made to other people (name + what you promised + implied deadline)
- [ ] Tasks taking longer than 2 minutes to complete
- [ ] Follow-up items from emails, meetings, conversations, calls
- [ ] Waiting-for items: anything delegated or expected from someone else
- [ ] Ideas requiring a future action (not just ideas -- only ideas that require doing something)
- [ ] Date-bound obligations, even far-future ones

**DO NOT CAPTURE (route elsewhere):**

| Item Type | Instead, Do This | Where It Goes |
|-----------|-----------------|---------------|
| Reference information (articles, docs, contacts) | File immediately | [Reference tool: Notion / Notes / File folder] |
| Tasks under 2 minutes (right now) | Do it immediately | Nowhere -- complete it |
| Calendar events with no action | Add to calendar | Calendar app |
| Someday/maybe ideas | Route to separate list | [Someday/Maybe list location] |
| Recurring tasks already in system | Leave in recurring system | [Recurring task tool] |

---

### 4. Two-Minute Rule Configuration

- **Threshold:** [2 minutes / user-calibrated threshold after week 1]
- **Apply at:** Point of capture AND during processing sessions
- **Exceptions:** If you cannot act right now (driving, in a meeting) -- capture anyway, apply rule during processing
- **Calibration target:** No more than 30% of inbox items should resolve as two-minute tasks during processing
- **Week 1 tracking:** Log each two-minute completion in a tally to calibrate personal threshold

---

### 5. Processing Schedule

| Session | Time | Days | Duration | Expected Volume |
|---------|------|------|----------|-----------------|
| [Morning] | [HH:MM] | [Mon-Fri / Daily] | [15-20 min] | [X-Y items] |
| [Afternoon] | [HH:MM] | [Mon-Fri / Daily] | [15-20 min] | [X-Y items] |
| [End of day] | [HH:MM] | [Mon-Fri] | [10-15 min] | [X-Y items] |

**Target:** Inbox reaches zero after every session.

**Processing sequence (apply to each item):**
1. Read fully -- do I understand what this is?
2. Is it still relevant? If no --> DELETE
3. Is it actionable? If no --> DELETE / file as REFERENCE / move to SOMEDAY
4. What is the single next PHYSICAL action? (not "work on X" -- write the first physical step)
5. Does it take under 2 minutes? --> DO IT NOW
6. Does it belong to a project? --> Link to or create the project: [project list location]
7. Is there a due date? --> Assign it
8. Is someone else doing it? --> Move to WAITING FOR list with: [person] + [expected date]
9. REMOVE from inbox

---

### 6. Supporting Lists

| List Name | Purpose | Location |
|-----------|---------|----------|
| Inbox | Unprocessed captures | [Tool] |
| Next Actions | Processed, actionable, no specific date | [Tool] |
| Waiting For | Delegated items tracking | [Tool] |
| Someday/Maybe | Ideas without a committed next action | [Tool] |
| Reference | Non-actionable information | [Tool] |
| [Project list] | Multi-step outcomes | [Tool] |

---

### 7. Weekly Maintenance Checklist (10-15 min)

**Run every [day of week] at [time]:**
- [ ] All sources still consolidating to inbox? Check for new sources.
- [ ] Total items captured this week: ______ (Baseline: ______)
- [ ] Inbox reaching zero after each session? If not, identify stuck item type: ______
- [ ] Review Someday/Maybe list -- any items now actionable?
- [ ] Any system leaks reappeared? (Starred emails, open tabs, sticky notes?)
- [ ] Processing session times still working? Adjust if needed.
- [ ] Any new capture sources not yet mapped to consolidation rule?

---

### 8. System Health Indicators

| Metric | Healthy | Warning | Action Required |
|--------|---------|---------|-----------------|
| Inbox zero frequency | Every session | Once daily | Less than daily |
| Items captured/week | Stable baseline ±20% | Drop >30% from baseline | Drop >50% (system abandoned) |
| Two-minute items as % of inbox | Under 30% | 30-50% | Over 50% (criteria too loose) |
| Items older than 48hr in inbox | 0 | 1-3 | More than 3 |
| Processing session duration | Under 20 min | 20-30 min | Over 30 min (volume too high) |
```

---

## Rules

1. **Always produce the complete system specification document** -- never output abstract advice about capture habits without the concrete specification. The deliverable is a deployable document, not a list of tips.

2. **Identify the single inbox tool before any other decision** -- every other part of the system depends on which tool the user will actually open. A theoretically superior app the user never opens is worse than a suboptimal app they already use daily.

3. **Map every identified task source to an explicit consolidation rule** -- sources without consolidation rules are system leaks. An unmapped source is guaranteed to produce dropped tasks.

4. **Enforce inbox as a transit zone, not a storage system** -- items must leave the inbox during every processing session. If the user describes keeping items in the inbox as an "active reminder," this is a processing problem to solve, not a behavior to accommodate.

5. **Never recommend a processing cadence that isn't tied to specific clock times** -- "process regularly" or "check when you can" are not cadences. Every processing session must have a time, a day scope (daily vs. weekdays), and a hard duration limit.

6. **Separate capture from processing from doing** -- these are three distinct activities and must be treated as such. Conflating them (trying to act on items while capturing them) breaks the capture habit because it makes capture feel expensive.

7. **Never allow reference information into the inbox** -- reference items colonize task inboxes and make them unusable within weeks. If the user's inbox contains articles, notes, links, and files mixed with tasks, the system has already failed. The capture criteria must explicitly exclude reference material.

8. **Apply the two-minute rule at the correct stage** -- it applies at point of capture (when the thought arises and you can act immediately) AND during processing (when reviewing inbox items). It does not apply as a reason to skip capturing items when acting immediately is impossible.

9. **Validate that the recommended tool supports the user's mobility pattern** -- a phone app is useless for a user who cannot use a phone at work; a desktop app is useless for a construction worker. Physical context determines tool viability before any feature consideration.

10. **Include the weekly maintenance schedule and system health indicators** -- a capture system without a maintenance protocol degrades within 3-6 weeks. The most common cause of system abandonment is not capture failure but processing session drift: sessions get skipped, inboxes fill, the system becomes overwhelming, and the user reverts to mental task-holding. The maintenance checklist and health indicators are insurance against this failure mode.

11. **Treat waiting-for items as first-class captures** -- most capture systems focus on tasks the user will do. Delegated items and expected deliverables from others are equally important to capture. A missing waiting-for capture causes the same dropped-ball problem as a missing task capture.

12. **Do not recommend more than two inboxes under any circumstances** -- if a user insists on separate personal and professional systems, the maximum is two inboxes with synchronized processing sessions. Three or more inboxes guarantee that at least one is neglected.

---

## Edge Cases

### User has no consistent digital access (field worker, manufacturing, construction)

Design a physical-first capture system with a digital processing step. The primary capture tool is a pocket notebook (Field Notes 3.5" x 5.5" format or equivalent) kept in a chest pocket or tool belt. Items are captured with a single line of handwriting -- no need for detail at capture time. At the end of the shift (or during a dedicated break), the user transfers all notebook items to their digital inbox. This "digital transfer" step is itself a processing prompt: items that don't make it to digital within 24 hours are treated as high-priority and moved to the front of the next transfer session. The pocket notebook is torn out or marked when transferred -- no item should sit in the notebook and the digital inbox simultaneously.

### User receives more than 50 task-generating inputs per day

At this volume, the standard inbox model breaks down -- processing sessions would exceed 30 minutes each and the inbox would never reach zero. Add a pre-capture triage layer before items enter the inbox:
- **Delegate immediately** if the item can be reassigned to someone else at point of contact (reply to the email with a delegation, forward to the team member in Slack)
- **Decline or defer** items that are outside the user's scope and require no response
- **Batch similar items** -- if 15 items from the same source require the same type of action (15 invoices to approve), capture as one batched item ("Approve Q3 invoices batch -- 15 items")
After triage, only items that pass these filters enter the inbox. Increase processing sessions to three per day and cap each at 20 minutes. If inbox still doesn't clear, the input volume exceeds what a single-person capture system can handle -- the user likely needs delegation infrastructure, not a better capture system.

### User has multiple pre-existing systems and wants to consolidate

Do not attempt to migrate all systems simultaneously. Use a phased consolidation approach:
- Week 1: Designate the new single inbox and begin all new captures there. Do not migrate old items yet. Map all sources to the new consolidation rules. Identify which old systems are still actively generating new tasks.
- Week 2: Extract active, unfinished items from each old system one at a time and import them into the new inbox for processing. Process them using the standard processing sequence -- do not bulk-move them into action lists, because many will be outdated.
- Week 3: Put old systems into read-only mode. Remove them from view (archive the list, close the app, put the notebook in a drawer). Do not delete yet.
- Day 60: Delete or archive the old systems permanently after confirming no active items remain.
The most common mistake is trying to run the old and new systems in parallel "just in case" -- this always results in the old system winning because it has more accumulated items and feels more "real."

### User works across personal and professional contexts with incompatible tools

The ideal is one inbox for both contexts. The practical constraint is that many workplaces mandate specific tools (Jira, Asana, ServiceNow) that cannot be used for personal tasks. In this case:
- Use exactly two inboxes: the work-mandated tool and a personal tool
- Process both inboxes in the same physical session at the same time -- open both on screen simultaneously
- Never let one inbox accumulate while processing the other
- Personal tasks that arise during work hours are captured to the personal tool (a phone widget, for example), not the work tool
- Work tasks that arise during personal time are captured to the work tool -- or, if that's not accessible, captured to the personal inbox with a tag or flag indicating "transfer to work system"
- The two-inbox exception is granted only for tool incompatibility, not for preference. Users who "just prefer to separate work and life" should be guided toward a single system with context labels (Work / Personal) rather than two inboxes.

### User has tried and abandoned multiple capture systems before

This is a motivation and habit problem as much as a system design problem. Acknowledge it directly.
- The failure pattern is almost always one of three things: (1) the capture tool was too high-friction (required too many taps or steps to add an item), (2) the processing cadence was too ambitious (aiming for three daily sessions when one is sustainable), or (3) the inbox became a guilt pile (too many items, never reaching zero, avoided because it felt overwhelming).
- For this user, design a deliberately minimal starting system: one inbox, one processing session per day, no more than 5 minutes of capture configuration. The goal for the first two weeks is habit formation, not perfect system design. A perfect system that is abandoned is worse than an imperfect system that is used.
- Explicitly lower the bar: inbox zero is the goal, but if the user processes 80% of the inbox each session, that is success in week 1. Progress, not perfection, builds the habit.
- Schedule a check-in at the 2-week mark to refine the system once the basic habit is established.

### User wants to use the capture system for personal and household tasks shared with a partner or family member

Define clear ownership rules before configuring the system:
- The user's personal inbox captures only items the user personally owns. Shared household tasks (grocery runs, appointment scheduling, home repairs) belong in a shared system (a shared Reminders list, Todoist shared project, or a physical household whiteboard).
- When a shared-ownership task arises, the user captures it in their inbox, then during processing, routes it to the shared system with an assignee designation.
- Items the user is "waiting for" a partner to complete should be tracked in the waiting-for list with the partner's name and a reminder date.
- Never let the household/family shared system become a second personal inbox that competes with the primary inbox for processing attention.

### User's primary source of task generation is real-time verbal communication (customer-facing role, manager with many direct reports)

When tasks are generated faster than they can be written down -- in rapid-fire meetings, customer calls, or walk-up requests -- the capture tool must be optimized for speed over organization:
- Use a running capture note (a single open text file or note titled "Today's Inbox") that functions as a scratch pad during the day. Write anything that comes up in any format -- fragments, abbreviations, shorthand.
- At the end of the interaction or at scheduled processing breaks, transfer the scratch pad items to the formal inbox with enough detail to process them.
- The scratch pad is not the inbox -- it is a buffer. It should be cleared at every processing session.
- For voice-heavy contexts, a dedicated voice recorder app or a transcription service (such as phone dictation) feeding into the inbox can dramatically reduce capture friction during calls and meetings.

---

## Example

**Input:** "I'm a freelance designer. I get work requests through email, Instagram DMs, client text messages, and voice mails. I also have random ideas for my own projects that I keep losing. I use my phone for everything. I probably have 20-30 things come up in a day. Right now I just keep everything in my head or in a bunch of different notes apps and I forget stuff constantly. Can you help me build a proper system?"

**Output:**

---

## Task Capture System Specification
**Generated for:** Freelance designer
**Date:** [Today's date]
**Daily task volume:** 20-30 items per day
**System type:** Digital, phone-primary

---

### 1. The Single Inbox

| Field | Value |
|-------|-------|
| **Tool** | Todoist (free tier sufficient) -- Inbox list |
| **Location** | Phone home screen widget (4-tile quick-add widget) + web app bookmark in browser toolbar |
| **Access path** | iPhone: Tap Todoist widget on home screen, type task, tap return. No navigation required. Total time: 4 seconds. |
| **Target access time** | Under 5 seconds from any context |
| **Inbox name** | "Inbox" (Todoist's default inbox -- do not rename) |

**Quick-capture configuration:**
- Phone: Todoist home screen widget configured. Siri shortcut enabled: "Hey Siri, add [task] to Todoist" routes directly to Inbox.
- Desktop: Todoist browser extension installed (adds task from any webpage). Keyboard shortcut: Cmd+Shift+A opens quick-add from anywhere.
- Physical backup: One pocket Field Notes notebook (3.5" x 5.5") in bag at all times -- used when phone is not accessible. Transfer to Todoist at next processing session.

---

### 2. Source Consolidation Rules

| Source | Volume/Day | Capture Method | Max Consolidation Window |
|--------|-----------|----------------|--------------------------|
| Email (client requests, project briefs) | ~8 items | Forward actionable emails to your Todoist email address (Settings > Integrations > Email); task auto-creates in Inbox | Within same-day processing session |
| Instagram DMs | ~5 items | Copy message text, paste into Todoist quick-add with note "[IG] from @username" | Within 15 min of reading DM |
| Client text messages (SMS/iMessage) | ~5 items | Tap and hold message, share to Todoist via Share Sheet extension; adds to Inbox with message text | Within 15 min of reading text |
| Voicemail | ~3 items | Listen to voicemail, add task to Todoist Inbox describing the requested action (not a transcription) | Within 30 min of listening |
| Own project ideas / creative thoughts | ~8 items | Voice: "Hey Siri, add [idea + action] to Todoist" while hands are busy. Widget tap when at rest. | Within 30 seconds of thought |
| Physical / paper requests (contracts, briefs) | ~2 items | Write on Field Notes page, transfer at next processing session | Within same-day session |

**System leaks to close:**
- [ ] "Starred emails not being processed" -- Resolution: Configure Todoist email integration; stop using stars as a to-do system by end of week 1
- [ ] "Other notes apps (Notes, Keep, etc.) containing tasks" -- Resolution: Audit all notes apps in week 1, transfer active items to Todoist Inbox, then use those apps for reference only
- [ ] "Instagram DM 'mark as unread' as a reminder system" -- Resolution: Process DMs at each session using the consolidation rule above; unread DMs are not a task system

---

### 3. Capture Criteria

**CAPTURE THESE (route to Inbox):**
- [ ] Client requests and project deliverables promised in any channel
- [ ] Follow-up calls, replies, or documents triggered by any communication
- [ ] Payment-related actions (send invoice, follow up on unpaid invoice, confirm payment received)
- [ ] Your own project ideas that have a concrete next action (not just "that would be cool" -- only if you'll actually do something)
- [ ] Administrative tasks: file taxes, renew software subscription, update portfolio
- [ ] Waiting-for items: "Waiting for client to approve logo revision -- Jamie -- expected by Friday"

**DO NOT CAPTURE (route elsewhere):**

| Item Type | Instead, Do This | Where It Goes |
|-----------|-----------------|---------------|
| Inspiration images, swipe file, design references | Save to dedicated reference | Adobe Behance collections / Pinterest board / Apple Photos album "Reference" |
| Completed project files | Archive | Cloud storage (Google Drive / Dropbox) project folder |
| "Someday" business ideas with no committed action | Route to Someday list | Todoist project named "Someday/Maybe" |
| Calendar appointments already scheduled | Put on calendar, not in Inbox | Google Calendar |
| Recurring invoicing (monthly retainer clients) | Set as recurring task | Todoist recurring task, not re-captured each time |

---

### 4. Two-Minute Rule Configuration

- **Threshold:** 2 minutes (calibrate after week 1 -- freelancers often find 3 minutes is more realistic)
- **Apply at:** Point of capture (when the communication arrives and you can act immediately) AND during processing sessions
- **Examples of genuine two-minute tasks for a designer:** Replying "Yes, confirmed for Tuesday," sending a one-line invoice update, adding a name to a client contact, approving a meeting time
- **Examples that feel like 2 minutes but are not:** Replying to a detailed creative brief, resending a file you need to locate, any task involving opening design software
- **Exception:** If you are in the middle of design work (deep focus), do not break flow to complete two-minute tasks. Capture them. Apply the rule at your next processing session instead.
- **Week 1 tracking:** Add a tally mark in Field Notes each time you execute a two-minute task. Count at end of each week.

---

### 5. Processing Schedule

| Session | Time | Days | Duration | Expected Volume |
|---------|------|------|----------|-----------------|
| Morning | 9:00 AM | Mon-Fri + Sat | 20 min | 8-12 items (overnight DMs, emails, morning thoughts) |
| Afternoon | 2:00 PM | Mon-Fri | 15 min | 10-15 items (morning client communication, in-progress work tasks) |

**Target:** Inbox reaches zero after every session. If a session ends with items remaining, they must have a scheduled next-processing time assigned.

**Processing sequence (apply to each item in Todoist Inbox):**
1. Read fully -- do I understand what this item means? If unclear, add a clarifying note before deciding.
2. Is it still relevant? If no -- DELETE (tap left to swipe-delete in Todoist).
3. Is it actionable? If no -- DELETE / move to Notes as REFERENCE / move to Todoist "Someday/Maybe" project.
4. What is the single next PHYSICAL action? Rewrite the task if needed ("Email Jamie revised logo" not just "Logo").
5. Does it take under 2 minutes right now? --> DO IT NOW, then delete from Inbox.
6. Does it belong to a client project? --> Move to that client's Todoist project (create if new client).
7. Is there a due date or client-expected date? --> Assign it (tap calendar icon in Todoist).
8. Is someone else doing it? --> Move to "Waiting For" Todoist project, add label with person's name.
9. REMOVE from Inbox (by moving to the appropriate project or completing it).

---

### 6. Supporting Lists

| List Name | Purpose | Location |
|-----------|---------|----------|
| Inbox | All unprocessed captures | Todoist Inbox (default) |
| Next Actions -- Client Work | Processed client tasks with no specific date | Todoist project per client |
| Next Actions -- Admin | Billing, contracts, tools, business admin | Todoist project "Admin" |
| Waiting For | Delegated/expected items tracked by person | Todoist project "Waiting For" |
| Someday/Maybe | Business ideas, future services, dream projects | Todoist project "Someday/Maybe" |
| Reference | Non-actionable information | Apple Notes (business) + Google Drive (files) |

---

### 7. Weekly Maintenance Checklist (10-15 min)

**Run every Sunday at 11:00 AM:**
- [ ] Are email, IG DMs, texts, and voicemails still consolidating to Inbox? Any new communication channel added this week?
- [ ] Total items captured this week: ______ (Week 1 baseline: ______; target: within ±20%)
- [ ] Inbox reaching zero after both sessions? If not, which types of items are getting stuck?
- [ ] Review "Someday/Maybe" project -- any ideas now ready to become active projects?
- [ ] Review "Waiting For" list -- any overdue expected items to follow up on?
- [ ] Any system leaks re-emerged? (Starred emails? Unread DMs as reminders? Open browser tabs?)
- [ ] Are both processing session times (9 AM, 2 PM) still achievable with current project load?

---

### 8. System Health Indicators

| Metric | Healthy | Warning | Action Required |
|--------|---------|---------|-----------------|
| Inbox zero frequency | After every session | Once daily | Less than once daily |
| Items captured/week | Stable within ±20% of baseline | Drop of 30% from baseline | Drop of 50%+ (system abandoned -- restart week 1 protocol) |
| Two-minute items as % of inbox | Under 30% | 30-50% | Over 50% (criteria too broad -- re-review capture criteria) |
| Items older than 48 hours in Inbox | 0 | 1-3 | More than 3 (processing sessions being skipped) |
| Processing session duration | Under 20 min | 20-30 min | Over 30 min (add afternoon pre-filter or increase to 3 sessions) |
| Waiting For items overdue | 0 | 1-2 | More than 2 (follow-up discipline breaking down) |
