---
name: caregiver-coordination
description: |
  Produces care team coordination systems including task assignment templates,
  communication logs, care team meeting agendas, shared calendar structures,
  and emergency contact trees for managing elder care across multiple
  caregivers. Generates role-based responsibility matrices and handoff
  protocols to prevent gaps in care coverage.
  Use when the user asks about coordinating care among family members,
  organizing caregiver responsibilities, or setting up a care team system.
  Do NOT use for medical care planning (consult the physician care team),
  evaluating care facilities (use care-facility-evaluation), or managing
  caregiver stress (use caregiver-burnout-prevention).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "elder-care planning template"
  category: "family-relationships"
  subcategory: "caregiving"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Caregiver Coordination System

## When to Use

**Use this skill when:**
- User asks about coordinating care responsibilities among family members
- User wants to organize a care team for an aging parent or relative
- User needs templates for tracking caregiver tasks and communication
- User asks about setting up care team meetings or handoff protocols
- User wants to distribute caregiving responsibilities more fairly or clearly

**Do NOT use this skill when:**
- User needs medical care planning or treatment coordination (physician care team manages this)
- User wants to evaluate care facilities (use `care-facility-evaluation`)
- User asks about caregiver stress or burnout (use `caregiver-burnout-prevention`)
- User needs medication management systems (use `caregiver-medication-management`)
- User asks about legal or financial planning for elder care (use `elder-care-legal-triggers`)

## Process

1. **Identify all care team members.** Map everyone involved in providing or supporting care:

   | Role | Person | Availability | Primary Responsibilities | Contact Method |
   |------|--------|-------------|------------------------|----------------|
   | Primary caregiver | [Name] | [Days/hours available] | [Core duties] | [Phone, text, email] |
   | Secondary caregiver | [Name] | [Days/hours available] | [Backup duties] | [Phone, text, email] |
   | Remote family member | [Name] | [Availability for calls/visits] | [Research, finances, emotional support] | [Phone, video call] |
   | Hired aide | [Name/Agency] | [Scheduled hours] | [Specific tasks contracted] | [Phone, agency number] |
   | Medical contacts | [Physician, specialists] | [Office hours] | [Medical oversight] | [Office phone, portal] |
   | Emergency contacts | [Names] | [24/7] | [Emergency response] | [Cell phones] |

2. **Build the responsibility matrix (RACI for caregiving).** Assign each recurring task:

   **Legend:** R = Responsible (does the task), A = Accountable (ensures it gets done), C = Consulted, I = Informed

   | Task Category | Task | Frequency | R | A | C | I |
   |--------------|------|-----------|---|---|---|---|
   | Daily Care | Morning routine assistance | Daily | [Name] | [Name] | | |
   | Daily Care | Meal preparation | Daily | [Name] | [Name] | | |
   | Daily Care | Medication administration | Daily | [Name] | [Name] | [Pharmacy] | |
   | Daily Care | Evening check-in | Daily | [Name] | [Name] | | [Remote family] |
   | Medical | Doctor appointments (transport) | As scheduled | [Name] | [Name] | | [All] |
   | Medical | Prescription refills | Monthly | [Name] | [Name] | [Pharmacy] | |
   | Medical | Insurance claims and paperwork | As needed | [Name] | [Name] | | |
   | Household | Grocery shopping | Weekly | [Name] | [Name] | | |
   | Household | Laundry and housekeeping | Weekly | [Name] | [Name] | | |
   | Household | Home maintenance coordination | As needed | [Name] | [Name] | | |
   | Financial | Bill payment | Monthly | [Name] | [Name] | | [All] |
   | Financial | Insurance management | Quarterly | [Name] | [Name] | | |
   | Social | Companionship visits | Weekly | [Name] | [Name] | | |
   | Social | Transportation to social activities | Weekly | [Name] | [Name] | | |

3. **Set up the communication system.** Establish structured communication among all caregivers:

   **Daily Communication Log:**
   - Date and time of each care interaction
   - Tasks completed (checklist format)
   - Changes observed (mood, appetite, mobility, pain, confusion)
   - Medications given with times
   - Meals consumed (approximate amounts)
   - Any incidents or concerns
   - Questions for the next caregiver or the medical team

   **Communication channels:**
   - Shared digital log (notes app, shared document, or caregiving-specific app) for daily updates
   - Group text thread for urgent or time-sensitive messages
   - Weekly email summary to all family members (including remote members)
   - Scheduled video calls for remote family participation

   **Information that must be accessible to all caregivers at all times:**
   - Complete medication list with dosages and schedules
   - Allergy list
   - Medical condition summary
   - Physician contact information and upcoming appointments
   - Insurance information and policy numbers
   - Emergency contact priority order
   - Advance directive location and key contacts (attorney, healthcare proxy)

4. **Design the care team meeting structure.** Regular meetings prevent communication breakdowns:

   **Weekly Check-In (15-30 minutes):**
   - Schedule: Same day and time each week, with remote dial-in option
   - Agenda:
     1. Status update: How is the care recipient doing this week? (2 minutes)
     2. Task review: Did all assigned tasks get completed? Any gaps? (5 minutes)
     3. Medical updates: Any physician visits, test results, medication changes? (5 minutes)
     4. Schedule changes: Upcoming conflicts, vacation, or availability changes (5 minutes)
     5. Concerns: Anything anyone is worried about or struggling with (5 minutes)
     6. Action items: Who does what before next meeting (3 minutes)

   **Monthly Deep Review (45-60 minutes):**
   - All of the above, plus:
     1. Care plan assessment: Are current arrangements meeting the care recipient's needs? (10 minutes)
     2. Financial review: Insurance claims status, out-of-pocket expenses, budget check (10 minutes)
     3. Caregiver wellness check: Is anyone showing signs of burnout? Does the schedule need rebalancing? (10 minutes)
     4. Long-term planning: Any upcoming transitions, facility evaluations, legal deadlines? (10 minutes)

5. **Create the weekly schedule template:**

   | Time Block | Monday | Tuesday | Wednesday | Thursday | Friday | Saturday | Sunday |
   |-----------|--------|---------|-----------|----------|--------|----------|--------|
   | Morning (7-12) | [Name] | [Name] | [Name] | [Name] | [Name] | [Name] | [Name] |
   | Afternoon (12-5) | [Name] | [Name] | [Name] | [Name] | [Name] | [Name] | [Name] |
   | Evening (5-9) | [Name] | [Name] | [Name] | [Name] | [Name] | [Name] | [Name] |
   | Overnight | [Name/Device] | [Name/Device] | [Name/Device] | [Name/Device] | [Name/Device] | [Name/Device] | [Name/Device] |

   Notes:
   - Every time block must have an assigned person or monitoring system
   - Overlap periods (15-30 minutes) at each handoff for transition communication
   - Backup caregiver identified for each shift in case of illness or emergency

6. **Build the handoff protocol.** At every caregiver transition:

   **Outgoing caregiver completes:**
   - [ ] Update daily log with all activities, observations, and concerns
   - [ ] Note any medications given and next scheduled dose
   - [ ] Report any changes in condition (appetite, mood, mobility, pain level)
   - [ ] Confirm next caregiver is aware of the transition time
   - [ ] Flag any pending tasks not completed during their shift

   **Incoming caregiver reviews:**
   - [ ] Read daily log entry from previous shift
   - [ ] Confirm medication schedule for their shift
   - [ ] Check for any flagged concerns or pending tasks
   - [ ] Confirm they have access to all needed supplies and contact information

7. **Establish the emergency protocol:**

   **Emergency Contact Tree:**
   1. Call 911 if life-threatening situation
   2. Call primary caregiver: [Name] -- [Number]
   3. If no answer within 5 minutes, call secondary: [Name] -- [Number]
   4. If no answer, call backup: [Name] -- [Number]
   5. Notify all team members within 1 hour via group text

   **Emergency Information Packet (keep copies at care recipient's home and with each caregiver):**
   - Medical conditions and diagnosis list
   - Current medications with dosages
   - Allergies (medications, food, environmental)
   - Insurance cards (front and back copies)
   - Advance directive summary (location of full document and key contacts)
   - Physician and specialist contact list
   - Pharmacy name and phone number

## Output Format

```
## Care Team Coordination Plan

### Team Roster

| Role | Name | Availability | Primary Tasks | Contact |
|------|------|-------------|---------------|---------|
| [Role] | [Name] | [Schedule] | [Tasks] | [Phone/Email] |

### Responsibility Matrix

| Task | Frequency | Responsible | Accountable | Consulted | Informed |
|------|-----------|-------------|-------------|-----------|----------|
| [Task] | [Freq] | [Name] | [Name] | [Name] | [Names] |

### Weekly Schedule

| Time Block | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|-----------|-----|-----|-----|-----|-----|-----|-----|
| Morning | [Name] | [Name] | [Name] | [Name] | [Name] | [Name] | [Name] |
| Afternoon | [Name] | [Name] | [Name] | [Name] | [Name] | [Name] | [Name] |
| Evening | [Name] | [Name] | [Name] | [Name] | [Name] | [Name] | [Name] |

### Communication Protocol
- Daily log: [location/method]
- Urgent messages: [group text number]
- Weekly check-in: [Day] at [Time], [dial-in method]
- Monthly review: [First/Last] [Day] of month at [Time]

### Handoff Protocol
[Outgoing and incoming checklists]

### Emergency Protocol
[Contact tree and emergency packet location]
```

## Rules

1. NEVER assign medical care decisions to family caregivers -- medical decisions require physician involvement
2. ALWAYS ensure every time block on the weekly schedule has an assigned person or monitoring system -- no gaps in coverage
3. ALWAYS include a handoff protocol -- most caregiving errors happen during transitions between caregivers
4. Include both the Responsible person (does the work) and the Accountable person (ensures it is done) for every task -- single points of failure cause care gaps
5. ALWAYS include remote family members in the communication system -- exclusion breeds resentment and reduces the support network
6. The emergency contact tree must have at least 3 levels of escalation
7. Weekly check-in meetings are mandatory in the coordination plan -- informal communication alone leads to information gaps
8. Every caregiver must have access to the medication list, allergy information, and emergency contacts at all times
9. Include a backup caregiver assignment for each regular schedule slot -- illness and emergencies happen
10. Present schedules and responsibilities in table format, never in prose paragraphs

## Edge Cases

- **Long-distance caregiving (one or more family members are remote):** Remote caregivers can handle: researching services and resources, managing finances and insurance paperwork, coordinating appointments by phone, providing emotional support via regular video calls, and hiring local services. Assign specific remote tasks in the RACI matrix. Schedule weekly video check-ins so remote members stay connected. Identify a local backup (neighbor, faith community member, hired aide) for situations that require physical presence.

- **Solo primary caregiver with no family support:** When one person handles nearly all caregiving, the coordination system shifts to: task tracking for the caregiver's own organization, communication templates for updating extended family or friends who offer help, a structured way to delegate specific tasks when help is offered ("Can you do the grocery run on Thursday?" is better than "Let me know if you can help"), and mandatory respite scheduling. Refer to `caregiver-burnout-prevention` for support.

- **Disagreements among family caregivers:** When family members disagree about care decisions, the coordination system provides structure, not mediation. Include: clear decision-making authority for each domain (one person makes medical appointment decisions, another handles finances), documentation of all decisions and rationale, and a monthly review where concerns are raised in a structured format. For persistent conflicts, recommend a professional geriatric care manager as a neutral coordinator.

- **Hired care aide integration:** When professional aides are part of the team, include: clear task boundaries (what the aide is contracted to do vs. family responsibilities), agency contact for scheduling changes, backup aide arrangements, and how the aide participates in the communication log and handoff protocol. The aide should have the same access to emergency information as family caregivers.

- **Care recipient who resists coordination:** When the person receiving care objects to schedules, logs, or multiple caregivers, involve them in the planning process to the extent possible. Ask their preferences for which tasks they want help with and which they want to maintain independently. Frame the system as supporting their independence rather than controlling their life. If cognitive impairment limits their participation, the healthcare proxy or primary decision-maker should be clearly identified.

## Example

**Input:** "My siblings and I need to coordinate care for our mom who had a hip replacement. She's home from rehab but needs daily help. I'm local, my brother is 30 minutes away, and my sister lives in another state. How do we organize this?"

**Output:**

## Care Team Coordination Plan for Mom's Post-Hip-Replacement Recovery

### Team Roster

| Role | Name | Availability | Primary Tasks | Contact |
|------|------|-------------|---------------|---------|
| Primary caregiver | [User] | Mon-Fri mornings, weekday evenings | Daily care, meal prep, medication, appointments | [Phone] |
| Secondary caregiver | [Brother] | Weekends, Wed evenings | Weekend coverage, grocery runs, home maintenance | [Phone] |
| Remote support | [Sister] | Flexible for calls/research | Insurance, research, emotional support, finances | [Phone/Video] |
| Physical therapist | [PT name] | Per rehab schedule | Post-surgical rehabilitation exercises | [Office phone] |
| Physician | [Surgeon/PCP] | Office hours | Medical oversight, follow-up appointments | [Office phone] |

### Responsibility Matrix

| Task | Frequency | R | A | C | I |
|------|-----------|---|---|---|---|
| Morning routine assistance | Daily | [User] M-F / [Brother] Sat-Sun | [User] | | [Sister] |
| Medication administration | Daily | [User] M-F / [Brother] Sat-Sun | [User] | Pharmacy | [All] |
| PT exercise assistance | Per PT schedule | [User] M-F / [Brother] Sat-Sun | [User] | PT | [All] |
| Meal preparation | Daily | [User] M-F / [Brother] Sat-Sun | [User] | | |
| Doctor appointments | As scheduled | [User] | [User] | [Sister: research] | [All] |
| Prescription refills | As needed | [Sister] (phone/online) | [Sister] | Pharmacy | [User] |
| Insurance paperwork | As needed | [Sister] | [Sister] | | [User, Brother] |
| Grocery shopping | 2x/week | [Brother] Wed + Sat | [Brother] | Mom (list) | |
| Evening check-in call | Daily | Rotating | [User] | | [All] |
| Housekeeping | Weekly | [User] Mon / [Brother] Sat | [User] | | |

### Weekly Schedule

| Time Block | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|-----------|-----|-----|-----|-----|-----|-----|-----|
| Morning (8-12) | [User] | [User] | [User] | [User] | [User] | [Brother] | [Brother] |
| Afternoon (12-5) | Mom independent + alert button | Mom independent + alert button | [Brother] 3-5pm | Mom independent + alert button | Mom independent + alert button | [Brother] | [Brother] |
| Evening (5-8) | [User] | [User] | [Brother] | [User] | [User] | [Brother] | [User] |
| Overnight | Alert button + [User] on-call | Alert button + [User] on-call | Alert button + [User] on-call | Alert button + [User] on-call | Alert button + [User] on-call | Alert button + [Brother] on-call | Alert button + [User] on-call |

### Communication Protocol
- **Daily log:** Shared document updated after each visit (tasks done, observations, next steps)
- **Urgent messages:** Family group text (all 3 siblings)
- **Weekly check-in:** Sunday 7:00 PM video call (all 3 siblings, 20 minutes)
- **Monthly review:** First Sunday of month at 6:00 PM video call (45 minutes, includes financial review and care plan assessment)
- **Sister's weekly role:** Calls Mom every Tue/Thu for companionship; researches any questions raised in weekly meeting; handles all insurance and pharmacy coordination by phone

### Handoff Protocol (Weekend Transition)

**Friday evening ([User] to [Brother]):**
- [User] updates daily log with full week summary
- Confirms weekend medication pre-sorted in pill organizer
- Notes any PT exercises scheduled for weekend
- Flags any concerns from the week

**Sunday evening ([Brother] to [User]):**
- [Brother] updates log with weekend summary
- Reports any changes in mobility, pain level, or mood
- Confirms Monday morning medication status
- Flags anything for the weekly video call

### Recovery Milestone Tracking
- Week 1-2 post-rehab: Full daily assistance needed, focus on PT compliance
- Week 3-4: Increasing independence with daily activities, reduce morning visit to check-in
- Week 6: Physician follow-up -- reassess care level needed
- Week 8-12: Transition to weekly check-ins if recovery is on track
- Reassess the full coordination plan at the 6-week physician visit
