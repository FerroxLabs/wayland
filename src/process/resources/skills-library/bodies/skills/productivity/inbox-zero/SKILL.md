---
name: inbox-zero
description: |
  Builds a complete email processing system with batch processing schedule, decision tree for each message type, folder structure, unsubscribe protocol, and response templates. Produces a deployable system, not tips for managing email.
  Use when the user asks about inbox zero, email management, reducing email overload, or building an email processing workflow.
  Do NOT use for writing individual emails (use writing skills), building email templates for marketing (use business skills), or general task capture (use task-capture-system).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "time-management automation template"
  category: "productivity"
  subcategory: "task-management"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Inbox Zero

## When to Use

**Use this skill when:**
- The user describes inbox overwhelm -- hundreds or thousands of unread messages, constant checking, or anxiety about email
- The user asks explicitly for "inbox zero," a batch processing system, or a structured email workflow
- The user says email is consuming disproportionate time (more than 90 minutes per day for a non-customer-facing role is a red flag)
- The user has a specific inbox count they want to eliminate (e.g., "I have 2,400 unread emails and need to start over")
- The user wants to set up filters, labels, folder hierarchies, or autoresponders as part of a coherent system
- The user is switching email clients (Gmail to Outlook, corporate migration) and wants to rebuild their organization system from scratch
- The user has returned from extended leave and faces a massive backlog they do not know how to process

**Do NOT use when:**
- The user wants to write or improve a single specific email -- use a writing skill instead
- The user wants email marketing sequences, drip campaigns, or newsletter templates -- use a business marketing skill
- The user needs a broader task capture and project management system beyond email -- use `task-capture-system`
- The user is asking about reducing context switching across all tools (Slack, meetings, email combined) -- use `context-switching-reduction`
- The user wants a complete GTD (Getting Things Done) system implementation -- use `gtd-workflow`, though inbox zero is one component of GTD
- The user is asking about email security, phishing filtering, or IT policy -- this is an IT/security domain skill

---

## Process

### Step 1: Gather the User's Email Profile

Before designing any system, collect the five variables that determine system shape. Ask all of these upfront -- do not guess.

- **Email client and platform:** Gmail (personal or Workspace), Outlook (Microsoft 365, Exchange, or desktop), Apple Mail, Fastmail, Proton Mail, or another. The available automation primitives (filters, rules, labels vs. folders) differ significantly across platforms.
- **Current inbox size:** Exact or approximate unread count, plus total inbox count. A user with 200 unread and 500 total has a different problem than a user with 8,000 unread and 8,000 total.
- **Daily incoming volume:** How many emails arrive per day? Under 30 is manageable with one or two windows. 30-80 requires a structured three-window system. Over 80 requires aggressive filtering before human processing begins.
- **Role and responsiveness expectations:** Is the user in a role where people expect a reply within the hour (executive assistant, customer-facing support, account manager)? Or is same-day or 24-hour response time acceptable? This determines batch window frequency and whether an autoresponder is needed.
- **Biggest pain point:** Volume (too many emails arriving), retrieval (can't find emails when needed), response time (falling behind on things that need replies), or anxiety (avoids the inbox entirely). The system must address the stated pain point first or the user will not adopt it.
- **Existing tools in their workflow:** Do they use a task manager (Todoist, Things 3, Notion, Asana, Jira)? A calendar system? Knowing this allows you to design the handoff from email to tasks correctly.

### Step 2: Design the Minimum Viable Folder Structure

The most common inbox zero failure is over-engineering the folder structure. Users create 30 folders organized by project, client, and year, then spend more time filing than processing. The rule is: **four processing folders plus archive**, nothing more.

- **Inbox:** The only place new mail lands. The goal is always zero. Inbox is not a storage location -- it is a processing queue.
- **Action Required (or @Action):** Emails that require a response or generate a task that will take more than 2 minutes. Hard limit: 20 emails maximum at any time. If this folder exceeds 20, it is a task management failure, not an email failure.
- **Waiting For (or @Waiting):** Emails where you have responded or delegated but are awaiting a reply or deliverable. Review weekly, not daily. Anything in here for more than 7 days needs a follow-up.
- **Reference:** Information you may need to retrieve -- contracts, account details, project specs, travel confirmations. Not actionable, but not safe to delete. Use sparingly; search engines are faster than folders for most retrieval.
- **Archive:** The destination for everything processed. One flat archive is better than dozens of sub-folders. In Gmail, Archive is built-in. In Outlook, create a single "Archive" folder. Rely on search -- it is faster than any folder hierarchy.

**Platform-specific implementation notes:**
- In Gmail: use Labels (not folders). Action Required, Waiting For, and Reference are labels applied with keyboard shortcuts (e, l, or the label menu). Gmail's built-in Archive button sends mail to All Mail. Enable keyboard shortcuts in settings.
- In Outlook: use Folders. The Quick Steps feature allows one-click move-to-folder actions. Set up Quick Steps for each processing destination immediately.
- In Apple Mail: use Mailboxes (equivalent to folders). Rules can auto-apply mailbox tagging for notifications and newsletters.

### Step 3: Build the Four-Layer Filter System Before Human Processing

Human time is the bottleneck. The goal is to ensure that the majority of email is handled automatically before a person ever reads it. Set these up as filters/rules in the email client:

- **Layer 1 -- Auto-archive notifications:** Emails from automated systems (GitHub, Jira, Confluence, Google Docs comment notifications, Slack digests, LinkedIn notifications, calendar invites without attendee action needed) should skip the inbox entirely and land in Archive. Create sender-domain or subject-pattern filters for these.
- **Layer 2 -- Newsletter routing:** Emails containing "unsubscribe" in the body (a reliable proxy for newsletters and marketing mail) that are not from VIP senders should auto-archive or land in a "Newsletters" label/folder that is reviewed at most once per week, not during normal processing windows.
- **Layer 3 -- VIP priority surfacing:** Create a filter for email FROM specific senders (your manager, direct reports, key clients, partner) that applies a "VIP" label or star and ensures these always appear at the top. In Gmail this is done with a "starred" filter and the Priority Inbox view. In Outlook, use the Focused Inbox or a dedicated VIP rule.
- **Layer 4 -- Auto-delete candidates:** Receipts for transactions you never dispute (small subscriptions, routine purchases), shipping notifications after delivery has occurred, and social media activity digests are candidates for auto-delete rules. These have zero retrieval value. Set a 30-day delayed delete if you want a safety buffer.

After filters are set up, estimate the percentage of daily email volume that flows automatically. A well-configured filter system should handle 40-60% of daily volume without human touch.

### Step 4: Define the Processing Decision Tree

Every email that survives the filter layers and lands in the inbox must be processed using a consistent decision tree. Processing means the email leaves the inbox -- it does not mean "read and leave unread for later." Unread is not a task management system.

The decision sequence for every email:

1. **Is this email addressed to me specifically, or am I CC'd?** CC'd emails very rarely require action. If CC'd and no action is implied, Archive immediately.
2. **Is this email relevant to my current responsibilities?** If not (misdirected, irrelevant, truly spam that passed filters), Delete or unsubscribe. Do not archive spam.
3. **Does this require any action from me?** If no action is required -- it is informational, an FYI, a confirmation of something already handled -- Archive immediately. Do not re-read it. Archive is not the trash; it is recoverable.
4. **Can I complete the required action in under 2 minutes?** The 2-minute rule (from David Allen's GTD methodology) is calibrated to the break-even point between the cost of context-switching back to an email later vs. completing it now. If yes, do it immediately, then Archive.
5. **Should someone else handle this?** If this email belongs to a colleague, direct report, or vendor, forward it with a clear request, apply Waiting For, and Archive the original. Do not keep delegated emails in Action Required.
6. **Does this require a response or task that will take more than 2 minutes?** Move to Action Required. Create a task in your external task manager (Todoist, Things 3, Asana, etc.) with a due date and enough context to act without reopening the email. Archive the email only after the task is created.

Do not deviate from this tree. "I'll come back to it" is the source of 90% of inbox failures.

### Step 5: Set the Batch Processing Schedule With Precision

Batch processing is the behavioral core of inbox zero. It replaces the always-on email monitoring posture that fragments attention throughout the day.

- **Default recommendation -- three windows:**
  - Morning window: 9:00-9:30 AM. Not first thing at 7 or 8 AM -- protect the first 60-90 minutes of the day for deep work. Process overnight and early-morning email at 9 AM.
  - Midday window: 12:30-1:00 PM. Process morning accumulation. This window often runs shorter than 30 minutes once the system is established.
  - Late afternoon window: 4:30-5:00 PM. Clear remaining email, handle end-of-day items, review Waiting For weekly (on Fridays specifically), prep Action Required for tomorrow.

- **Enforcement mechanisms -- these are non-negotiable for the system to work:**
  - Close the email tab or application between windows. Minimize is not enough. Closed means closed.
  - Turn off all email push notifications on desktop and mobile. On iPhone: Settings > Notifications > Mail > turn off. On Android: equivalent in notification settings. In Outlook desktop: File > Options > Mail > uncheck "Display a Desktop Alert." In Gmail with browser: Notifications setting in Gmail settings to "Off."
  - Set an autoresponder that sets expectations: "I process email at 9 AM, 12:30 PM, and 4:30 PM. I will respond within the same business day. For urgent matters, contact me via [phone/Slack/Teams]." This one change eliminates most of the social pressure that drives constant checking.

- **Timer discipline:** Set a hard timer for each processing window. When the timer ends, stop processing even if the inbox is not at zero. Incomplete processing is acceptable during the ramp-up period (weeks 1-2). The discipline of stopping trains the system.

- **Processing speed benchmarks:** Experienced inbox zero practitioners process at 3-5 emails per minute (delete/archive decisions are under 10 seconds; 2-minute rule responses take up to 2 minutes; delegations take 30-60 seconds). At 60 emails per day split across three windows, expect 20 emails per window, requiring 10-20 minutes per window at cruising speed.

### Step 6: Execute the Initial Backlog Cleanup

Users with existing backlogs cannot start the new system without clearing the old one first. The backlog is psychologically and practically a separate problem from ongoing maintenance.

**The Yesterbox method for backlogs under 200 emails:**
Process all emails from yesterday and earlier using the decision tree, but set a hard rule: today's emails are not touched until the backlog is cleared. Work backwards from yesterday. Any email older than 30 days that has not already generated a crisis: Archive immediately without reading. The definition of "not urgent enough to follow up on" is the absence of a follow-up from the sender.

**The nuclear archive method for backlogs over 200 emails:**
- In Gmail: Select all emails in inbox, filter by date (older than 30 days), select all, Archive. This is recoverable. Nothing is deleted.
- In Outlook: Sort by Date, select all older than 30 days, move to Archive folder.
- For the remaining emails (< 30 days): Sort by sender and subject. Identify obvious newsletter/notification clusters and archive in bulk. Apply the decision tree to the remaining messages individually.
- Estimated time: 60-90 minutes for a backlog of 500-2,000 emails using the nuclear archive method.

**After the backlog is cleared:** The inbox is at zero for the first time. Protect it. Do not declare victory and revert to checking constantly.

### Step 7: Build the Response Template Library

Template responses handle the 5-8 most frequent email patterns with 80-90% less composition time. The goal is not to send canned-sounding emails -- it is to pre-load the thinking so that a response takes 45 seconds instead of 4 minutes.

For each template, identify:
- The trigger: what type of email this responds to
- The subject line pattern
- The body with explicit fill-in variables marked in [brackets]
- The tone calibration (formal, conversational, assertive)

Common templates across most professional roles:
- **Meeting acceptance/decline/counter**
- **Status update response** (buying time or providing current status)
- **Delegation/redirect** (passing to the right person)
- **Request acknowledgment** (received, will respond by [date])
- **Information request fulfillment** (here is what you asked for)
- **Follow-up on a Waiting For item**

Store templates in a location accessible during email processing: Gmail's canned responses/templates feature (enabled in Settings > Advanced), Outlook's Quick Parts, a text expander tool (TextExpander, Espanso, or the operating system's built-in text replacement), or a plain text file open alongside email.

### Step 8: Establish the Weekly Maintenance Review

Inbox zero is not a one-time event -- it is a weekly maintenance practice. Build a 10-minute weekly review into the system, ideally on Friday afternoon during the last processing window of the week.

- Review the Waiting For folder: anything older than 7 days without a response needs a follow-up email sent today
- Review the Action Required folder: anything that has been there for 5+ days without movement is either procrastinated (add a hard due date) or should be delegated or deleted
- Run a 5-minute unsubscribe audit: any email that arrived this week that was read but generated no value -- unsubscribe before closing
- Verify the batch schedule held during the week: if any window was skipped or ran long, identify why and adjust

---

## Output Format

Produce the following complete system specification. Do not abbreviate any section.

```
## Inbox Zero System — [User Name or Role]

### Email Profile
- **Email Client:** [Gmail / Outlook / Apple Mail / other]
- **Platform:** [Personal / Google Workspace / Microsoft 365 / Exchange]
- **Current Inbox Size:** [unread count] unread / [total count] total
- **Daily Incoming Volume:** [number] emails/day
- **Role Responsiveness Requirement:** [same-hour / same-day / 24-hour]
- **External Task Manager:** [Todoist / Things 3 / Asana / Notion / none]
- **Primary Pain Point:** [volume / retrieval / response time / anxiety]

---

### Folder / Label Structure

| Folder/Label     | Purpose                                      | Max Size  | Review Frequency        |
|------------------|----------------------------------------------|-----------|-------------------------|
| Inbox            | Unprocessed queue only -- target always zero  | 0         | Every processing window |
| Action Required  | Needs my reply or has a task in progress     | < 20      | Every processing window |
| Waiting For      | Delegated or replied, awaiting response      | < 15      | Weekly (Friday)         |
| Reference        | Retrievable info, no action needed           | Unlimited | As needed (search)      |
| Archive          | Processed, done -- flat, unsorted            | Unlimited | Never                   |

**Platform setup instructions:**
[Gmail: Labels created in Settings > Labels. Keyboard shortcut E = Archive, L = Label. Enable keyboard shortcuts in Settings > General.]
[Outlook: Folders created in left panel. Quick Steps configured in Home tab > Quick Steps for one-click filing.]
[Apple Mail: Mailboxes created in Mailbox menu > New Mailbox.]

---

### Automated Filter Layer

**Layer 1 -- Auto-archive notifications (skip inbox)**
Filter criteria: FROM: [notification-sending domains] OR SUBJECT CONTAINS: [notification subject patterns]
Action: Skip inbox, apply label "Notifications," auto-archive after 7 days

**Layer 2 -- Newsletter routing**
Filter criteria: BODY CONTAINS: "unsubscribe" AND NOT FROM: [VIP sender list]
Action: Skip inbox, apply label "Newsletters," mark as read

**Layer 3 -- VIP priority**
Filter criteria: FROM: [list of key sender email addresses]
Action: Apply label/star "VIP," always deliver to inbox

**Layer 4 -- Auto-delete**
Filter criteria: FROM: [receipt/shipping/social notification senders]
Action: Skip inbox, delete after 30 days

Estimated % of daily volume handled automatically: [X]%
Estimated emails reaching inbox for human processing: [Y]/day

---

### Processing Decision Tree

```
New email in Inbox
  |
  ├─ Am I CC'd only (not direct recipient)?
  |     YES ──> Archive immediately ──> DONE
  |
  ├─ Is this relevant to my responsibilities?
  |     NO ──> Delete (spam) or Unsubscribe (marketing) ──> DONE
  |
  ├─ Does this require any action from me?
  |     NO ──> Archive immediately ──> DONE
  |
  ├─ Can I complete the action in under 2 minutes?
  |     YES ──> Do it now ──> Archive ──> DONE
  |
  ├─ Should someone else handle this?
  |     YES ──> Forward with clear ask ──> Label Waiting For ──> DONE
  |
  └─ Requires my action, takes > 2 minutes?
        YES ──> Label Action Required
             ──> Create task in [task manager] with due date + context
             ──> DONE (email stays in Action Required until task complete)
```

**Processing speed target:** 3-5 emails/minute for archive/delete decisions. Up to 2 minutes for 2-minute-rule responses. Do not exceed 2 minutes on any single email during processing.

---

### Batch Processing Schedule

| Window          | Time       | Duration   | Focus                                          |
|-----------------|------------|------------|------------------------------------------------|
| Morning         | [9:00 AM]  | [25 min]   | Process overnight and early-morning email      |
| Midday          | [12:30 PM] | [20 min]   | Process morning accumulation                   |
| Late Afternoon  | [4:30 PM]  | [20 min]   | Clear remaining; Friday: Waiting For review    |

**Between windows:**
- Email application: CLOSED (not minimized)
- Mobile email notifications: OFF
- Desktop email alerts: OFF
- Urgent contact route: [phone / Slack / Teams / text message]

**Autoresponder message:**
"Thank you for your email. I process email at [9:00 AM, 12:30 PM, and 4:30 PM] and will respond within the same business day. For time-sensitive matters, please reach me at [phone/Slack handle]."

---

### Response Templates

**Template 1: [Email type]**
Trigger: [description of email pattern this responds to]
Subject: Re: [subject pattern]
Body:
"[Opening acknowledgment].

[Core response with fill-in variables].

[Closing / next step].

[Name]"

**Template 2: [Email type]**
Trigger: [description]
Subject: Re: [subject pattern]
Body:
"[Template body with [fill-in variables] marked]"

**Template 3: [Email type]**
[Continue for each template]

Storage location: [Gmail Templates (Canned Responses) / Outlook Quick Parts / text expander / plain text file at path]

---

### Unsubscribe Protocol

**Week 1 sprint (15 minutes, one time):**
- [ ] Search inbox for "unsubscribe" -- bulk archive all results
- [ ] Identify top 10 newsletter senders by volume -- unsubscribe from each
- [ ] Identify all tool notification emails (GitHub, Jira, Slack digest, etc.) -- disable in source app settings, not in email
- [ ] Set up Layer 2 newsletter filter (see Automated Filter Layer above)

**Ongoing (5 minutes, every Friday):**
- [ ] Any email read this week that provided zero value -- unsubscribe before closing
- [ ] Any new automated notification appearing in inbox -- add to Layer 1 filter

**Unsubscribe vs. filter decision:**
- Use UNSUBSCRIBE when: the sender is a legitimate business you want off your list permanently
- Use FILTER to auto-archive when: the sender is a system or tool you cannot unsubscribe from (internal automated reports, CRM notifications)
- Use FILTER to DELETE when: the email has zero retrieval value (shipping confirmations after delivery, social digests)

---

### Initial Backlog Cleanup Plan

**Method:** [Yesterbox (< 200 unread) / Nuclear Archive (> 200 unread)]

**Procedure:**
1. [Step 1: Archive all email older than 30 days without reading -- estimated count: X]
2. [Step 2: Sort remaining by sender -- archive newsletter/notification clusters in bulk]
3. [Step 3: Process individual remaining emails using the decision tree]
4. [Step 4: Declare inbox zero]

**Estimated time to inbox zero:** [X hours/minutes]
**Target completion date:** [Today / end of week / specific date]

---

### Weekly Maintenance Review (Fridays, 10 minutes)

- [ ] Waiting For: anything > 7 days old without response -- send follow-up now
- [ ] Action Required: anything > 5 days old -- reassign due date or delegate
- [ ] Unsubscribe audit: remove 2-3 subscriptions that provided no value this week
- [ ] Processing window compliance: did all three windows hold this week? If not, why?
- [ ] Filter updates: any new automated email bypassing Layer 1? Add to filter.
```

---

## Rules

1. **Never produce only tips or advice -- always produce the complete system specification.** The output is a deployable system the user can implement immediately, not a list of suggestions. Every section of the Output Format must be populated.

2. **The folder structure must never exceed five items.** Users who create per-project, per-client, or per-year folders abandon the system within two weeks. Search is faster than browsing. If the user insists on more folders, explain the research: cognitive overhead of filing decisions compounds to more time lost than the time "saved" by organization.

3. **Every email must leave the inbox during a processing window -- "read and leave" is not processing.** An email that has been read but remains in the inbox is a broken decision. It will be re-read an average of 2-4 times before action is taken (per email productivity research), multiplying the time cost by 3-5x.

4. **The 2-minute rule is not approximate -- it is a hard threshold.** Responses that take under 2 minutes are done immediately during the processing window. Responses estimated at 2 minutes 30 seconds go to Action Required. The threshold exists because the context-switching cost of returning to an email later (finding it, re-reading for context, re-composing mental state) averages 3-5 minutes, making any response under 2 minutes a net time savings to do immediately.

5. **Processing windows must have specific clock times.** "A few times a day" is not a system -- it is the current broken pattern with an alias. The morning window must not start before 9:00 AM unless the user's role explicitly requires earlier. Protect the first 60-90 minutes of the day for deep cognitive work.

6. **Email notifications must be turned off completely between processing windows.** Partial measures (turning off sound but leaving the badge count) do not eliminate the attention pull. Badge counts trigger the same cortisol response as full notifications. Off means off: no sound, no badge, no banner, no preview.

7. **The automated filter layer must be set up before the user starts processing the backlog.** If filters are not in place, the inbox will refill at the same rate it was cleared, and the cleanup effort is wasted. Filters are a prerequisite, not a nice-to-have.

8. **Action Required is a transition state, not a storage folder.** Every email in Action Required must have a corresponding task in an external task manager. If the user has no task manager, the Action Required folder itself is the task list, and it must be reviewed at every processing window. An email with no corresponding task will be forgotten.

9. **The autoresponder is required for any user whose responsiveness expectation is not explicitly "same-hour."** Without an autoresponder, the user faces social pressure to check email outside windows because senders do not know their schedule. The autoresponder eliminates this pressure by setting shared expectations.

10. **Unsubscribe at the source, not at the filter layer, for marketing email.** Filtering newsletters to auto-archive reduces inbox noise but allows the sender to continue tracking email opens, confirming the address is active, and increasing send volume. Unsubscribe removes the user from the list permanently and reduces total email load.

11. **For users with email anxiety, never start with three windows.** A user who avoids their inbox entirely will not adopt a three-window system immediately. Start with one 15-minute window per day at a fixed time. Add the second window after two consecutive weeks of compliance. Add the third window in week 5. Progress over perfection.

12. **The weekly review is not optional.** Without the weekly review, the Waiting For folder accumulates stale items, the Action Required folder becomes a graveyard, and the unsubscribe protocol degrades. The system requires 10 minutes of weekly maintenance to stay functional.

---

## Edge Cases

**User's role requires near-real-time email responsiveness (customer support, executive assistant, sales):**
The batch processing model does not fit roles where SLA requires responses within 60 minutes. Instead: implement triage-mode processing, where the decision tree is applied within 60 seconds of each email arriving, but the goal is still inbox zero by end of each hour. Use mobile push notifications selectively -- VIP-only notifications rather than all-email notifications. Batch only newsletter and notification categories. Accept that inbox zero happens hourly rather than at end-of-window. The folder structure and decision tree remain identical; only the timing model changes.

**User has 3 or more email accounts (work, personal, side project, board role):**
Process all accounts in the same time windows -- do not create separate processing schedules per account. Use a unified email client if possible (Outlook and Apple Mail support multiple accounts in one view; Gmail requires switching accounts or using a third-party client like Mimestream or Spark). Apply the same folder structure to each account. Set a hard rule: the personal account gets at most one processing window per day (the evening one), not all three. Role-mixing (processing personal email during work windows) is a productivity leak and a focus violation.

**User receives more than 100 emails per day:**
At this volume, three windows of 25 minutes each is insufficient. First action: aggressively audit and reduce volume. Most users receiving 100+ emails per day have at least 40-50% newsletter/notification volume that can be eliminated via unsubscribe and filter. After volume reduction, add a fourth window (7:30-8:00 AM, earlier than usual, to process pre-day volume) if necessary. Also consider a VIP-only inbox filter -- in Gmail, use Priority Inbox with the "Important and Unread" section at top. Only VIP emails are processed in real time; all others wait for batch windows.

**User has email anxiety and avoids the inbox entirely:**
The problem is not a system problem -- it is a behavioral and emotional problem that a better system enables but does not solve on its own. Customize the onboarding: start with the nuclear archive method immediately so the user begins with a clean inbox (zero anxiety from backlog). Implement a single 15-minute window daily, preferably at the same time each day, with a hard timer. The timer gives permission to stop. Frame the system as "you only have to face email for 15 minutes, and then you are done for the day." Do not introduce the full three-window system until week 3. Consider the autoresponder as a psychological tool: it tells the user that their contacts know not to expect immediate responses, reducing the urgency feeling that drives avoidance.

**User's email client is a corporate system with restricted filter/rule capabilities (legacy Exchange, Lotus Notes, corporate Outlook with IT policy restrictions):**
When automated filter setup is blocked by IT policy, the automated layer must be approximated manually. Implement a "nuclear pre-sort" during each processing window: sort the inbox by sender before processing, which clusters newsletter and notification emails visually and allows bulk-archiving before decision-tree processing begins. Use the email client's existing "sweep" or "clean up" features if available. Accept that the filter layer will be less effective and increase the time budget per processing window by 5-10 minutes.

**User has used their inbox as a task manager for years and is afraid of losing tasks:**
This is the most common objection to the nuclear archive method. Address it directly: before archiving anything, spend 30 minutes reviewing the inbox and manually extracting any email-based tasks to the external task manager. Search the inbox for the user's own name in the To field and the words "please," "can you," and "by [date]" to surface action items quickly. After extraction, archive confidently -- the tasks exist in the task manager, and the email is recoverable via search if the task context is needed.

**User switches email clients mid-system (e.g., company migrates from Gmail to Outlook):**
The system architecture (four folders, decision tree, batch windows, filters) is client-agnostic. The implementation is not. When migrating: rebuild filters first (this is the most time-consuming step). Re-map labels to folders. Recreate canned responses as Quick Parts. The migration is a good moment to audit and delete Reference folder items older than 2 years. Do not import legacy folder structures from the old client -- take the opportunity to rebuild the flat archive from scratch.

---

## Example

**Input:** "I have 847 unread emails in Gmail Workspace (my company account). I get about 60 emails a day -- mix of project emails from colleagues, Jira notifications, GitHub PR reviews, Slack email digests, and the occasional newsletter I have not unsubscribed from. I check email constantly, probably 30+ times a day. It eats up my whole morning and I'm always stressed about missing something important. I use Todoist for tasks and our team uses Slack for urgent communication. I'm a software engineer, so same-day response is usually fine -- nothing is truly urgent via email."

**Output:**

---

## Inbox Zero System -- Software Engineer / Gmail Workspace

### Email Profile
- **Email Client:** Gmail (Google Workspace)
- **Current Inbox Size:** 847 unread (total unknown, assumed large)
- **Daily Incoming Volume:** ~60 emails/day
- **Role Responsiveness Requirement:** Same-day (no same-hour expectation)
- **External Task Manager:** Todoist
- **Urgent Contact Route:** Slack (team-confirmed)
- **Primary Pain Point:** Constant checking creating morning anxiety and fragmented attention

---

### Folder / Label Structure

| Label              | Purpose                                              | Max Size  | Review Frequency           |
|--------------------|------------------------------------------------------|-----------|----------------------------|
| Inbox              | Unprocessed queue -- target always zero               | 0         | 3x daily (processing only) |
| @Action Required   | Needs my reply or active Todoist task                | < 20      | Every processing window    |
| @Waiting For       | Delegated or replied, awaiting response from others  | < 15      | Fridays during window 3    |
| Reference          | Specs, credentials, contracts, retrievable info      | Unlimited | Search as needed           |
| Archive            | All processed email -- flat, searchable              | Unlimited | Never                      |

**Gmail setup:**
1. Open Gmail > Settings > See all settings > Labels > Create new label for each of the above
2. Settings > General > Keyboard shortcuts: ON (saves 30+ seconds per processing window)
3. Key shortcuts: E = Archive, L = Label (opens label menu), R = Reply, F = Forward, # = Delete
4. Enable Templates: Settings > Advanced > Templates > Enable

---

### Automated Filter Layer

**Layer 1 -- Auto-archive Jira and GitHub notifications (highest volume reduction)**

Filter 1:
- Criteria: FROM: (notifications@github.com OR noreply@github.com)
- Action: Skip inbox, apply label "Notifications," mark as read
- Estimated volume reduction: ~15 emails/day

Filter 2:
- Criteria: FROM: (jira@[company].atlassian.net) OR SUBJECT CONTAINS: ([JIRA])
- Action: Skip inbox, apply label "Notifications," mark as read
- Estimated volume reduction: ~10 emails/day
- Note: Check GitHub and Jira in-app notification centers directly; email duplication is unnecessary

**Layer 2 -- Slack digest routing**

Filter 3:
- Criteria: FROM: (no-reply@slack.com OR feedback@slack.com)
- Action: Skip inbox, Delete immediately (Slack is already the primary channel -- these digests are redundant)
- Estimated volume reduction: ~5 emails/day

**Layer 3 -- Newsletter routing**

Filter 4:
- Criteria: BODY CONTAINS: "unsubscribe" AND NOT FROM: (@[company].com)
- Action: Skip inbox, apply label "Newsletters," mark as read
- Estimated volume reduction: ~8 emails/day

**Layer 4 -- VIP surfacing**

Filter 5:
- Criteria: FROM: ([manager's email], [skip-level email], [key client emails])
- Action: Apply star (yellow star = VIP), never send to spam, always mark important
- Result: VIP emails appear first in Priority Inbox view

**Summary after filters:**
- Estimated volume removed from inbox automatically: ~38 emails/day (63%)
- Estimated emails reaching inbox for human processing: ~22 emails/day
- This is fully manageable in three 20-minute windows

---

### Processing Decision Tree

```
New email in Inbox
  |
  ├─ Am I CC'd only (not direct To: recipient)?
  |     YES ──> Am I expected to act anyway?
  |               NO ──> Archive (press E) ──> DONE
  |               YES ──> Continue tree below
  |
  ├─ Is this relevant to my current work?
  |     NO ──> If marketing: Unsubscribe link + Archive
  |            If spam: Delete (press #) ──> DONE
  |
  ├─ Is this informational only (FYI, confirmation, announcement)?
  |     YES ──> Archive (press E) immediately -- do not re-read ──> DONE
  |
  ├─ Can I reply or complete this in under 2 minutes?
  |     YES ──> Reply now (press R) ──> Archive ──> DONE
  |             (2-min examples: "Confirmed," "Looks good," "Here's the link: X")
  |
  ├─ Should a colleague or team handle this instead of me?
  |     YES ──> Forward (press F) with 1-sentence context + clear ask
  |          ──> Label @Waiting For ──> DONE
  |
  └─ Requires my work, will take > 2 minutes?
        YES ──> Label @Action Required (press L, select label)
             ──> Open Todoist, create task: "Email: [subject] -- [specific action]"
             ──> Set due date in Todoist
             ──> Email stays in @Action Required until Todoist task is complete, then Archive
             ──> DONE
```

**Processing speed target for this volume:** 22 emails across 3 windows = ~7 emails per window. At cruising speed, each window takes 8-15 minutes, leaving buffer for 2-minute-rule responses.

---

### Batch Processing Schedule

| Window         | Time       | Duration | Focus                                                   |
|----------------|------------|----------|---------------------------------------------------------|
| Morning        | 9:00 AM    | 20 min   | Overnight and early-AM email; start day clear           |
| Midday         | 12:30 PM   | 15 min   | Morning accumulation; often under 10 minutes            |
| Late Afternoon | 4:30 PM    | 20 min   | Clear remaining; Fridays: review @Waiting For           |

**Between windows (the critical discipline):**
- Gmail tab: CLOSED in browser (bookmark it; reopen only at processing times)
- Gmail mobile app notifications: OFF -- Settings > [Account] > Notifications > None
- Desktop notifications: Gmail Settings > General > Desktop Notifications > Mail notifications off
- Urgent route confirmed: If something is truly urgent, colleagues use Slack. This has been established by team norms. Email is not an emergency channel.

**Autoresponder (set in Gmail > Settings > Vacation responder, configure as permanent):**
Subject: [Auto-reply] Re: [original subject]
Body: "Thanks for your email. I check and process email at 9:00 AM, 12:30 PM, and 4:30 PM daily and will respond by end of business day. For urgent matters, please ping me on Slack (@[handle]) -- I monitor Slack throughout the day."

---

### Response Templates

**Gmail setup:** Settings > Advanced > Templates > Enable. Compose a new message, write the template, then More options (three dots) > Templates > Save draft as template.

---

**Template 1: Code review request acknowledgment**
Trigger: Colleague asks for PR review outside of GitHub notification system
Subject: Re: [PR title or topic]
Body:
"Got it -- I will review [PR/document name] by [specific day/time, e.g., tomorrow EOD].

If it's urgent, please flag in #[team-slack-channel] and I will prioritize.

[Name]"

---

**Template 2: Meeting request response**
Trigger: Request to meet, schedule a call, or sync
Subject: Re: [meeting topic]
Body:
"Happy to connect. My available slots this week:
- [Day] at [time]
- [Day] at [time]
- [Day] at [time]

Feel free to grab any of those or send a calendar invite. If none work, here is my scheduling link: [link if applicable].

[Name]"

---

**Template 3: Status update / project question**
Trigger: Someone asking for current status on a project or task
Subject: Re: [project name] status
Body:
"Current status on [project/task]:

[1-2 sentence summary of where things stand]

Next step: [what is happening next and by when]

Let me know if you need more detail or want to jump on a quick call.

[Name]"

---

**Template 4: Delegation / redirect to correct person**
Trigger: Email sent to you but should go to someone else
Subject: Re: [topic]
Body:
"Thanks for reaching out -- [Colleague Name] is actually the right person for this. Looping them in here.

[Colleague Name]: [1 sentence explaining the request and what you need from them]. Thanks!

[Name]"

---

**Template 5: Request received, will respond later**
Trigger: Complex request that genuinely needs > 2 minutes and is going to Action Required
Subject: Re: [topic]
Body:
"Received -- this needs some thought. I will get back to you with a full response by [specific date, not "soon"].

[Name]"

**Template storage:** Save all five in Gmail Templates. Access during processing with Compose > More options > Templates > Insert template.

---

### Unsubscribe Protocol

**Week 1 sprint (do this before starting backlog cleanup, ~15 minutes):**
- [ ] Gmail search: `unsubscribe in:inbox` -- select all results -- Archive all
- [ ] Identify top newsletter senders from the Newsletters label -- unsubscribe from each directly (not via filter; use the unsubscribe link in the email or List-Unsubscribe header)
- [ ] Open Jira settings > Profile > Notifications -- audit and disable all email notifications; use Jira's in-app notification center instead
- [ ] Open GitHub > Settings > Notifications -- switch from email to web-only for PR comments, CI results, and issue updates; keep email only for direct @mentions
- [ ] Open Slack > Preferences > Notifications > Email Notifications -- disable all Slack email digests entirely (Slack is already open; these emails are pure duplication)

**Ongoing (5 minutes every Friday, during the 4:30 PM window):**
- [ ] Any email this week read but provided zero value -- unsubscribe before marking done
- [ ] Any new automated email appearing in inbox -- add sender to Layer 1 or Layer 2 filter immediately
- [ ] Review Newsletters label -- anything not worth reading this week -- unsubscribe

**Expected outcome by end of week 2:** Daily incoming volume drops from 60 to approximately 25-35 emails/day through a combination of unsubscribes and filters. Human-processed inbox volume: approximately 10-15 emails/day.

---

### Initial Backlog Cleanup (847 unread -- use Nuclear Archive method)

**Estimated time to inbox zero: 60-90 minutes today**

1. **Archive all email older than 30 days:**
   - Gmail search: `in:inbox older_than:30d`
   - Click "Select all conversations that match this search"
   - Click Archive
   - Estimated cleared: ~600 emails
   - Rationale: If these were urgent, a follow-up has already arrived. They are safely archived and fully searchable.

2. **Archive remaining newsletter/notification clusters:**
   - Gmail search: `in:inbox unsubscribe`
   - Select all, Archive
   - Gmail search: `in:inbox from:notifications@github.com OR from:jira@`
   - Select all, Archive
   - Estimated cleared: ~150 more emails

3. **Process remaining ~97 emails individually using the decision tree:**
   - Sort by sender to cluster similar emails
   - Apply decision tree to each
   - Estimated time: 30-45 minutes at 3-4 emails/minute
   - Expected outcome: @Action Required gets 5-10 items maximum; everything else is archived

4. **Todoist audit:** After processing, open Todoist and confirm every item in @Action Required has a corresponding task with a due date. Add any missing tasks now.

5. **Declare inbox zero.** Screenshot it. This is the baseline.

**Target:** Inbox at zero by end of today.

---

### Weekly Maintenance Review (Fridays, 4:30 PM window, 10 minutes)

- [ ] @Waiting For: any email older than 7 days without response -- send follow-up using Template 5 variant
- [ ] @Action Required: any email older than 5 days -- either set hard due date in Todoist or delegate
- [ ] Unsubscribe audit: remove 2-3 this week (build the habit, even if inbox is clean)
- [ ] Window compliance check: did all three windows hold this week? Log any that slipped. Investigate pattern after 2 weeks.
- [ ] Filter check: any automated email that bypassed Layer 1 this week? Add sender to filter now, before next week.
