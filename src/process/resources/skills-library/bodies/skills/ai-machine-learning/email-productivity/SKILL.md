---
name: email-productivity
description: |
  Email management mastery covering Inbox Zero methodology, filter and label systems, template libraries, batch processing workflows, unsubscribe strategies, email scheduling, follow-up tracking, and tool recommendations for reclaiming time from email.
  Use when the user asks about email productivity, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of email productivity or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml budgeting template testing automation best-practices time-management cleaning"
  category: "ai-machine-learning"
  subcategory: "llm-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Email Productivity


## When to Use

**Use this skill when:**
- User asks about email productivity techniques or best practices
- User needs guidance on email productivity concepts
- User wants to implement or improve their approach to email productivity

**Do NOT use when:**
- The request falls outside the scope of email productivity
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

Before overhauling your email workflow, assess the situation:

1. How many emails do you receive per day on average?
2. How much time do you currently spend on email daily?
3. What percentage of your email is actionable vs informational vs noise?
4. Do you use one email account or multiple? (Work, personal, business)
5. What email client do you use? (Gmail, Outlook, Apple Mail, other)
6. Do you currently use any email organization system? (Labels, folders, rules)
7. What is your biggest email pain point? (Volume, finding things, response time, anxiety)
8. How quickly are you expected to respond to emails? (Minutes, hours, next day)
9. Do you process email on mobile, desktop, or both?
10. Are you willing to change habits, or do you need the system to work around current behavior?

## Inbox Zero Methodology

### What Inbox Zero Actually Means

Inbox Zero is NOT about having zero emails in your inbox at all times. It's about having zero emails that haven't been decided upon. Every email has been triaged -- acted on, deferred, delegated, or deleted.

```
For every email in your inbox, choose ONE action:

DELETE:     Not relevant, not needed -> Delete or archive
DELEGATE:   Someone else should handle this -> Forward and track
RESPOND:    Can be answered in 2 minutes -> Reply immediately
DEFER:      Requires more than 2 minutes -> Move to action list
DO:         Quick task attached -> Do it now (under 2 minutes)
```

### The Inbox Zero Workflow

**Step 1: The Initial Purge (One-Time)**
```
1. Select ALL emails older than 14 days
2. Archive them all (don't delete -- archive)
   - If anything was truly important, it will resurface
3. Process remaining emails (last 14 days) from oldest to newest
4. Apply the DELETE/DELEGATE/RESPOND/DEFER/DO framework
```

**Step 2: Ongoing Maintenance**
```
Process email in batches, not continuously:

Morning batch (15-20 min):
  Process every email using the 5-action framework

Afternoon batch (15-20 min):
  Same process

Optional evening batch (10 min):
  Quick scan for urgent items only

CRITICAL: Close email between batches.
  Turn off notifications. Check on YOUR schedule.
```

## Filter and Label Systems

### Label Architecture

```
TOP-LEVEL LABELS (color-coded):
  @ACTION       (Red)     - Needs a response or task from me
  @WAITING      (Orange)  - Waiting for someone else's response
  @REFERENCE    (Blue)    - Information I might need later
  @READ         (Green)   - Articles, newsletters to read later

PROJECT LABELS (nested):
  Projects/
    Project-Alpha
    Client-Smith

PEOPLE LABELS (optional, for VIPs):
  People/
    Boss
    Key-Clients
```

### Essential Email Filters/Rules

**Auto-archive newsletters:**
```
From: contains "newsletter@" OR "noreply@"
Action: Skip inbox, apply label "@Read"
```

**Flag emails from VIPs:**
```
From: boss@company.com, client@important.com
Action: Star, apply label "VIP", never send to spam
```

**Remove noise:**
```
Subject: contains "Out of Office" OR "Automatic reply"
Action: Skip inbox, mark as read, archive
```

### Filter Strategy Principles

1. **Automate what's predictable**: Newsletters, notifications, and automated messages always follow patterns
2. **Never filter away actionable email**: Only auto-archive informational/noise
3. **Review filters quarterly**: Remove filters for cancelled subscriptions, old projects
4. **Start conservative**: It's better to see unnecessary email than to miss important email

## Email Templates

### When to Use Templates

Use templates when you send similar messages more than 3 times per week, need consistent messaging, want to ensure key information is included, or need to respond to common inquiries quickly.

### Template Library

**Meeting Request:**
```
Subject: Meeting Request: [Topic] - [Duration]

Hi [Name],

I'd like to schedule a [duration] meeting to discuss [specific topic].

My availability this week:
- [Day], [Time range]
- [Day], [Time range]

Feel free to grab a slot on my calendar: [Calendly/Cal.com link]

Best, [Name]
```

**Follow-Up (No Response):**
```
Subject: Re: [Original Subject]

Hi [Name],

Following up on my email from [date] about [topic].
[One-sentence summary of what you need from them]

Would [specific date] work for a quick response?

Thanks, [Name]
```

**Declining a Request:**
```
Subject: Re: [Original Subject]

Hi [Name],

Thank you for thinking of me for [opportunity/request].
Unfortunately, I'm not able to take this on due to
[brief, honest reason].

[Optional: suggestion of alternative person or future timing]

Best, [Name]
```

### Template Tools

| Tool | Platform | Features |
|------|----------|----------|
| Gmail Templates | Gmail | Built-in, basic text templates |
| Text Blaze | Chrome extension | Variables, dynamic content, team sharing |
| Superhuman | Gmail | Snippets with variables and hotkeys |
| Espanso | System-wide | Open-source text expansion |

## Batch Processing

### The Batch Processing Framework

```
EMAIL BATCH SCHEDULE:

8:00-8:30 AM: Morning batch
  - Process all overnight emails, respond to urgent items
  - Defer non-urgent items to task manager

12:00-12:15 PM: Midday check
  - Quick scan for urgent items only

4:00-4:30 PM: Afternoon batch
  - Process all emails from the day, clear inbox

BETWEEN BATCHES: Email client CLOSED, notifications OFF
```

### Email Processing Speed Tips

1. **Touch each email once**: Make a decision immediately, don't re-read later
2. **Two-minute rule**: If it takes less than 2 minutes, do it immediately
3. **Batch similar responses**: Reply to all emails from one project at once
4. **Use keyboard shortcuts**: Saves 30+ minutes per week
5. **Write shorter emails**: Most emails should be 5 sentences or fewer
6. **Default to "reply" not "reply all"**: Reduces email volume for everyone

### Key Keyboard Shortcuts

```
Gmail:                          Outlook:
e      Archive                  Ctrl+R        Reply
#      Delete                   Ctrl+Shift+R  Reply all
r      Reply                    Ctrl+F        Forward
a      Reply all                Ctrl+N        New email
f      Forward                  Ctrl+Enter    Send
c      Compose new              Delete        Delete
/      Search                   Ctrl+Shift+V  Move to folder
l      Label                    Ctrl+Q        Mark as read
```

## Unsubscribe Strategy

### The Email Audit Process

```
Step 1: Over 7 days, label every newsletter/marketing email as "AUDIT"

Step 2: For each sender, ask:
  - Did I open this email? (If no 3+ times in a row: unsubscribe)
  - Did I find value in it? (If no: unsubscribe)
  - Does this email make me feel good or anxious? (If anxious: unsubscribe)

Step 3: Unsubscribe from everything that failed the test

Step 4: For keepers, set up filters to auto-label
```

### Maintaining a Clean Inbox

- **One-in-one-out rule**: For every new newsletter, unsubscribe from one
- **Monthly audit**: Spend 15 minutes unsubscribing from anything you skip regularly
- **Use a separate email** for signups, trials, and downloads
- **RSS instead of email**: Subscribe to blogs via RSS, not email newsletter

## Email Scheduling

### When to Use Scheduled Send

- **Time zone differences**: Schedule for their morning, not yours
- **After-hours writing**: Draft now, send during business hours
- **Strategic timing**: Tuesday-Thursday mornings get highest open rates
- **Batch writing**: Write all follow-ups at once, schedule across the week

### Optimal Email Timing

| Purpose | Best Time to Send | Why |
|---------|------------------|-----|
| Business communication | Tue-Thu, 9-11 AM recipient's time | Highest open rates |
| Follow-ups | Tuesday or Thursday, 10 AM | Mid-week, mid-morning |
| Cold outreach | Tuesday 8 AM or Thursday 2 PM | Before inbox fills / afternoon lull |
| Urgent requests | Within recipient's working hours | Respect boundaries |

## Follow-Up Tracking

### The Follow-Up System

Most important emails that don't get a response are simply skipped by the recipient. A systematic follow-up approach dramatically improves response rates.

```
Send email -> Add to "Waiting For" list with expected response date
  |
  No response by expected date?
  |-> Follow-Up #1 (3-5 business days): Reply to original thread, brief and specific
  |-> Follow-Up #2 (5-7 business days later): Different angle or added urgency
  |-> Follow-Up #3 / Breakup email (7 days later): "Closing the loop on this"
  |-> Archive. Set reminder for future follow-up if needed.
```

### Follow-Up Tracking Methods

**Method 1: Email Client Native** -- Star/label emails when waiting, review the @Waiting label daily, remove when response received.

**Method 2: Automation Tools** -- Use Boomerang, Mailbutler, or Streak to auto-return emails to inbox if no reply in X days. Track open/read status optionally.

## Tool Recommendations

### Email Client Comparison

| Client | Best For | Key Feature | Cost |
|--------|---------|-------------|------|
| Gmail (web) | Most users | Search, labels, filters | Free |
| Outlook | Enterprise/Microsoft | Calendar integration | Included with M365 |
| Superhuman | Power users | AI triage, split inbox, snippets | $30/mo |
| Spark | Team email | AI compose, team features | Free-$8/mo |
| Hey | Opinionated workflow | Screening, Feed, Paper Trail | $99/yr |
| Fastmail | Privacy-focused | No ads, custom domains | $5-9/mo |

### Email Productivity Stack

```
ESSENTIAL:
  1. Email client with good shortcuts and search
  2. Template/snippet tool for repetitive messages
  3. Calendar tool with scheduling links (Calendly, Cal.com)

RECOMMENDED:
  4. Follow-up automation (Boomerang, Mailbutler)
  5. Unsubscribe tool (annual cleanups)
```

## Writing Better Emails

### The 5-Sentence Email Rule

Most emails should be 5 sentences or fewer:
1. Context (why you're writing)
2. Key information or request
3. Supporting detail (if necessary)
4. Clear call to action
5. Closing

### Email Writing Framework

```
SUBJECT LINE:
  [Action Required] or [FYI] or [Decision Needed] + [specific topic]
  Bad: "Quick question"
  Good: "[Decision Needed] Marketing budget for Q2 campaign"

OPENING LINE:
  Get to the point immediately.
  Bad: "I hope this email finds you well..."
  Good: "I need your approval on the Q2 marketing budget by Friday."

BODY:
  Use bullet points, bold key info, one idea per paragraph.

CALL TO ACTION:
  Bad: "Let me know your thoughts."
  Good: "Please reply with your approval or questions by Thursday EOD."
```

## Common Mistakes

1. **Checking email first thing**: Start your day with proactive work, not reactive email
2. **Leaving email open all day**: Constant checking fragments attention and increases anxiety
3. **Using inbox as a to-do list**: Move tasks to a real task manager
4. **Reply All by default**: Ask if everyone truly needs to see your response
5. **Long emails**: If it's more than a screen of text, it should be a meeting or document
6. **Not using templates**: Rewriting the same message 10 times a week is wasted effort
7. **Treating all emails equally**: A message from your top client and a vendor newsletter should not compete for the same attention


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to email productivity
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Email Productivity Analysis

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

**Input:** "Help me with email productivity for my current situation"

**Output:**

Based on your situation, here is a structured approach to email productivity:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
