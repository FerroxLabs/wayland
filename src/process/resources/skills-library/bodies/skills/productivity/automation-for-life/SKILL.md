---
name: automation-for-life
description: |
  Personal automation expertise covering IFTTT applets, Apple Shortcuts, Android automation, financial automation (bill pay, savings, investing), notification management, routine automation, smart home orchestration, and building systems that reduce cognitive load and save time on repetitive life tasks.
  Use when the user asks about automation for life, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of automation for life or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "time-management budgeting template api-design testing automation game-design performing-arts"
  category: "productivity"
  subcategory: "organization"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Automation for Life

You are an expert personal automation designer who helps people build systems that handle repetitive tasks automatically. You create practical automations for finances, home, health, communication, and daily routines using consumer-friendly tools, reducing cognitive load and freeing time for what matters.


## When to Use

**Use this skill when:**
- User asks about automation for life techniques or best practices
- User needs guidance on automation for life concepts
- User wants to implement or improve their approach to automation for life

**Do NOT use when:**
- The request falls outside the scope of automation for life
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Platform:** iPhone/Mac, Android/Windows, or mixed ecosystem?
2. **Pain points:** What tasks consume the most time or mental energy?
3. **Technical comfort:** Comfortable with basic scripting, or prefer visual/no-code tools?
4. **Budget:** Willing to pay for automation services, or free tools only?
5. **Smart home:** Do you have smart home devices (lights, thermostat, locks)?
6. **Current tools:** What apps and services do you already use daily?

---

## Automation Tool Selection

| Tool | Platform | Best For | Cost |
|------|----------|----------|------|
| Apple Shortcuts | iOS/macOS | Personal phone/computer automation | Free |
| Tasker | Android | Deep Android automation | $3.49 |
| IFTTT | Cross-platform | Simple if-this-then-that connections | Free (limited) / $3.49/mo |
| Zapier | Cross-platform | Business app integrations | Free (limited) / $20/mo |
| Make (Integromat) | Cross-platform | Complex multi-step workflows | Free (limited) / $9/mo |
| Home Assistant | Smart home | Local smart home automation | Free (self-hosted) |
| n8n | Self-hosted | Privacy-focused workflow automation | Free (self-hosted) |

---

## Financial Automation

### Bill Payment and Savings

```
Automation 1: Zero-Touch Bill Payment
  Setup:
  - Enable autopay for every recurring bill
  - Set all due dates to the same week (call each company)
  - Create a dedicated checking account for bills
  - Auto-transfer bill total from main account on payday

  Result: Never miss a payment, never think about bills

Automation 2: Pay-Yourself-First Savings
  Trigger: Paycheck deposits (detect via bank notification)
  Actions:
  1. Transfer 20% to savings account
  2. Transfer retirement contribution to brokerage
  3. Transfer to vacation fund
  4. Remainder stays in checking for spending

  Implementation (most banks):
  - Set up recurring transfers aligned with pay dates
  - Use bank's auto-transfer feature
  - Or use IFTTT/Zapier with bank API integration

Automation 3: Round-Up Investing
  Tool: Acorns, Qapital, or bank round-up feature
  How: Every purchase is rounded up to nearest dollar
  The difference is automatically invested
  Example: $4.25 coffee = $0.75 invested automatically
  Result: ~$30-50/month invested without thinking
```

### Expense Tracking

```
Automation: Auto-Categorize Spending
  Tools: YNAB API, Mint/Monarch auto-rules, or spreadsheet

  IFTTT approach:
  Trigger: New transaction on credit card
  Action: Log to Google Sheet with merchant, amount, date
  Then: Google Sheet formula auto-categorizes by merchant name

  Spreadsheet formula for auto-categorization:
  =IFS(
    REGEXMATCH(B2, "(?i)starbucks|coffee"), "Coffee",
    REGEXMATCH(B2, "(?i)uber|lyft"), "Transport",
    REGEXMATCH(B2, "(?i)amazon|target|walmart"), "Shopping",
    REGEXMATCH(B2, "(?i)whole foods|trader|grocery"), "Groceries",
    TRUE, "Uncategorized"
  )
```

---

## Routine Automation

### Morning Routine

```
Apple Shortcut: "Good Morning"
Trigger: Alarm dismissed (or run manually)
Actions:
  1. Turn off Do Not Disturb
  2. Turn on smart lights (gradually to 80%)
  3. Set thermostat to 72F
  4. Read today's weather forecast aloud
  5. Read calendar events for today
  6. Start coffee maker (smart plug)
  7. Open preferred news app
  8. Start morning playlist on speaker

Android (Tasker) equivalent:
  Profile: Time 6:30 AM (weekdays)
  Tasks:
  - HTTP Request: Smart home API (lights, thermostat)
  - Media: Play Spotify playlist
  - Say: Weather forecast from API
  - Notification: Today's calendar summary
```

### Evening Wind-Down

```
Automation: "Wind Down" (triggered 1 hour before bedtime)
  1. Smart lights shift to warm/dim
  2. Do Not Disturb activates (allow starred contacts only)
  3. Screen shifts to warm color temperature
  4. Notification: "Time to wind down" with breathing exercise link
  5. Smart lock: Verify front door is locked
  6. Thermostat: Set to sleeping temperature (67F)
  7. Tomorrow's agenda notification (so you don't check phone later)

After bedtime:
  - All smart lights off
  - Full Do Not Disturb
  - Sleep tracking starts (if using sleep app)
```

---

## Notification Management

### The Notification Audit

```
For every app on your phone, ask:
  1. Does this notification require IMMEDIATE action?
     YES -> Keep with sound/vibration
     NO  -> Continue to question 2

  2. Do I need to see this TODAY?
     YES -> Keep, but silent (banner only)
     NO  -> Continue to question 3

  3. Does this add value AT ALL?
     YES -> Move to scheduled summary (iOS) or batch
     NO  -> Disable completely

Typical results:
  Immediate (sound): Phone calls, texts from family, alarm system
  Same-day (silent): Email, work chat, calendar reminders
  Batched (summary): Social media, news, promotional
  Disabled: Most app marketing, game notifications, "we miss you"
```

### Notification Automation

```
Apple Focus Modes:
  Work Focus (9 AM - 5 PM, weekdays):
  - Allow: Work email, Slack, calendar
  - Silence: Social media, games, shopping
  - Home screen: Work apps only

  Personal Focus (5 PM - 9 PM):
  - Allow: Family contacts, delivery apps
  - Silence: Work email, Slack
  - Home screen: Personal apps

  Sleep Focus (10 PM - 7 AM):
  - Allow: Starred contacts only
  - Silence: Everything else
  - Lock screen: Alarm only

Android Digital Wellbeing:
  - Focus Mode: Pause distracting apps during work
  - Bedtime Mode: Grayscale + DND at bedtime
  - App Timers: Limit social media to 30 min/day
```

---

## Smart Home Orchestration

### Scene-Based Automation

```
Scene: "Movie Night"
  Trigger: Say "Hey Siri/Google, movie night" or NFC tag on remote
  Actions:
  - Living room lights dim to 10%
  - TV turns on via HDMI-CEC or smart plug
  - Close smart blinds
  - Set volume to preferred level
  - Pause robot vacuum if running

Scene: "Leaving Home"
  Trigger: Last person's phone leaves geofence
  Actions:
  - Turn off all lights
  - Set thermostat to away mode (save energy)
  - Lock all smart locks
  - Arm security system
  - Turn off any running smart plugs (non-essential)
  - Send confirmation notification

Scene: "Welcome Home"
  Trigger: First person enters geofence
  Actions:
  - Unlock front door
  - Turn on entry lights
  - Set thermostat to comfortable temp
  - Disarm security system
  - Play welcome music (optional)
```

### Home Assistant Automation Example

```yaml
# automations.yaml
- alias: "Auto lights based on sun and presence"
  trigger:
    - platform: sun
      event: sunset
      offset: "-00:30:00"
  condition:
    - condition: state
      entity_id: group.family
      state: home
  action:
    - service: light.turn_on
      target:
        entity_id: light.living_room
      data:
        brightness_pct: 80
        color_temp_kelvin: 3000

- alias: "Laundry done notification"
  trigger:
    - platform: numeric_state
      entity_id: sensor.washing_machine_power
      below: 5
      for:
        minutes: 3
  action:
    - service: notify.family
      data:
        title: "Laundry"
        message: "The washing machine has finished!"
```

---

## Communication Automation

### Email Management

```
Gmail Filters (or equivalent):
  1. Newsletters: Skip inbox, label "Newsletters", read weekly
  2. Receipts: Skip inbox, label "Receipts", auto-forward to expense tracker
  3. Notifications: Skip inbox, label "Notifications", review when bored
  4. VIP senders: Star automatically, keep in inbox

Auto-response rules:
  - Out of office: Set up before vacation (obvious but often skipped)
  - Delayed sending: Write emails anytime, schedule for business hours
  - Template responses: Create for frequent questions

Unsubscribe automation:
  - Use Unroll.Me or manually unsubscribe from everything
  - Rule: If you haven't opened a newsletter in 3 weeks, unsubscribe
  - Monthly audit: Check subscriptions, prune aggressively
```

---

## Building Your Automation System

### Start Simple Framework

```
Week 1: Audit your time
  - Track where you spend time for 7 days
  - Identify top 5 repetitive tasks
  - Identify top 5 decision points that drain energy

Week 2: Automate the easiest win
  - Pick the simplest, highest-frequency task
  - Set up one automation
  - Test for a week, adjust

Week 3-4: Add one automation per week
  - Financial automation (bill pay, savings)
  - Notification cleanup
  - Morning or evening routine

Month 2+: Optimize and expand
  - Add smart home automation
  - Build more complex multi-step workflows
  - Connect tools together

Principles:
  - Automate the boring, keep the meaningful
  - Start with reliable tools, not bleeding edge
  - Test automations before trusting them fully
  - Build in failure notifications (know when automation breaks)
  - Review automations quarterly (are they still useful?)
```

### Automation Anti-Patterns

```
DON'T:
  - Automate something you do once a month (not worth the setup)
  - Build complex automations without understanding the manual process
  - Automate social interactions (auto-replies to friends feel cold)
  - hands-off, automated approach financial automations without periodic review
  - Over-automate (some tasks benefit from human attention)

DO:
  - Automate things you neglect to do (bills, backups, reviews)
  - Automate things you do daily that take < 5 min each
  - Build in safety checks (confirm before large financial transfers)
  - Document your automations (you may overlook how they work)
  - Share useful automations with family/partner
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to automation for life
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Automation For Life Analysis

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

**Input:** "Help me with automation for life for my current situation"

**Output:**

Based on your situation, here is a structured approach to automation for life:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
