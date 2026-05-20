---
name: digital-wellbeing-plan
description: |
  Creates a personalized digital wellbeing plan with screen time boundaries, notification management rules, social media usage protocols, and device-free zone designations. Gathers the user's current digital habits and pain points, then produces a structured plan with specific rules, schedules, and a 2-week implementation timeline.
  Use when the user asks about reducing screen time, digital detox, managing phone addiction, setting technology boundaries, or improving their relationship with digital devices.
  Do NOT use for treating internet addiction disorder, gaming addiction, or compulsive social media use that requires clinical intervention.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mental-wellness self-care digital-wellness habits"
  category: "health-wellness"
  subcategory: "mental-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Digital Wellbeing Plan

> **Disclaimer:** This skill provides general wellness information for educational and self-improvement purposes only. It does NOT constitute medical advice, diagnosis, or treatment for any condition including internet use disorder, gaming disorder, or any behavioral addiction. The strategies here are self-directed behavioral change tools, not clinical interventions. If you are experiencing compulsive technology use that significantly impairs your functioning despite genuine attempts to stop, please consult a licensed mental health professional or your primary care physician. If you are in crisis, contact emergency services or a crisis helpline immediately.

---

## When to Use

**Use this skill when the user:**
- Reports a specific, quantifiable concern about their screen time (e.g., "I'm on my phone 7 hours a day and I hate it," "I can't stop checking Instagram," "My phone use is affecting my sleep")
- Asks explicitly about building a digital detox plan, technology sabbath, screen time budget, or device-free routine
- Describes notification overload -- feeling constantly interrupted, unable to focus for more than a few minutes, or experiencing anxiety when they haven't checked their phone recently
- Wants to establish healthy device boundaries around specific contexts: sleep, meals, parenting time, focused work, or intimate relationships
- Has tried informal self-regulation before (deleting apps, setting timers) and wants a structured, systematic approach
- Expresses dissatisfaction with how much of their day is consumed by passive consumption -- scrolling, watching, refreshing -- versus intentional use
- Wants to improve sleep quality and suspects screen use is a contributing factor (a reasonable hypothesis given the research consensus on blue light and sleep-onset disruption)
- Is preparing for a life transition (new job, new baby, returning to school) and wants to recalibrate their digital habits proactively

**Do NOT use this skill when:**
- The user describes being unable to stop using a device or specific app despite genuine attempts, significant distress about the behavior, and real functional impairment (job loss, relationship breakdown, sleep deprivation measured in weeks) -- this pattern may warrant clinical assessment; recommend a licensed mental health professional specializing in behavioral concerns
- The user is seeking parental controls, child-specific screen time management, or family media agreements -- these involve developmental psychology, parental authority dynamics, and platform-specific tools that require dedicated guidance
- The user's primary concern is digital productivity optimization (focus techniques, deep work systems, task management) -- use a productivity-focused skill instead
- The user wants to reduce screen time specifically because they are experiencing symptoms of depression, anxiety, or burnout -- digital wellbeing may be a downstream benefit but is not the primary intervention; direct them toward appropriate mental health support
- The user is asking about social media strategy, content creation schedules, or building an online audience -- this is a business/marketing context, not a wellness context
- The user is asking on behalf of an employee or team and wants to implement workplace digital wellness policies -- this is an organizational design and HR matter requiring different frameworks
- The user wants to manage gambling, pornography, or substance-related digital behaviors -- these have clinical treatment protocols that exceed self-directed behavioral change tools

---

## Process

### Step 1: Conduct a Structured Digital Habits Assessment

Before generating any plan, gather the following data. Ask the user directly for each item -- estimates are acceptable, but specifics are more useful. A user who has never checked their phone's built-in screen time report should be encouraged to do so now (it takes under 30 seconds).

- **Total daily screen time:** Ask the user to check Settings > Screen Time (iOS) or Digital Wellbeing (Android). The national average in 2024 is approximately 4.5 hours of daily smartphone use for adults; above 6 hours is a frequent self-reported pain threshold.
- **Top 3-5 apps by time:** These reveal the mechanism of overuse. Social media (Instagram, TikTok, YouTube Shorts) indicates passive consumption. Email and messaging indicate anxiety-driven checking. Games indicate boredom or escapism.
- **Pickup count:** Most phones report this as "pickups per day." Over 80 pickups/day typically indicates habitual, unconscious checking rather than intentional use. Over 150 is common in high-distress cases.
- **First and last phone use:** Note the exact times. "Before I get out of bed" and "while lying in bed trying to sleep" are the two most consequential patterns for sleep and mood.
- **Context-specific triggers:** When does the phone come out? Waiting in line, during meals, in meetings, during conversations, during exercise, in the bathroom? Each context represents a different habit loop.
- **Specific pain points:** What does the user most want to change? Prioritize the user's own stated concerns -- do not impose an external standard. Some users are fine with 5 hours if none of it is bedtime scrolling.
- **Previous attempts:** What has been tried and why did it fail? Common failures: app limits that the user overrides immediately with "just 15 more minutes," deleting apps that were reinstalled within a week, or "phone-free weekends" that collapsed before noon.
- **Motivation:** Why now? Understanding the driving motivation (sleep problems, partner friction, feeling like time is being wasted, preparing for a new role) helps calibrate which plan elements will have the most personal resonance.

### Step 2: Identify the Digital Habit Architecture

Every problematic digital habit follows the same three-component loop described in behavioral psychology: **cue → routine → reward**. Before designing interventions, map the user's top two or three problematic habits explicitly. This is not armchair psychology -- it is the foundation of every effective behavior change strategy, including the ones built into phone OS settings.

- **Cue types and interventions:** External cues (notification sounds, badge counts) are addressed by notification management. Internal cues (boredom, anxiety, transition moments) require replacement activities. Environmental cues (phone on nightstand, on the dining table) require spatial design.
- **Routine types and interventions:** Passive consumption routines (mindless scrolling, autoplay) require friction increases and session limits. Active checking routines (refreshing email, checking likes) require scheduled batch-checking windows. Reactive routines (responding to every ping immediately) require notification triage.
- **Reward types and interventions:** Social validation rewards (likes, messages, comments) require substitution with offline social connection. Novelty rewards (new content, news, feeds) require identifying alternative novelty sources. Escape rewards (using phone to avoid discomfort) require coping strategy development -- this is the highest-complexity case.

Classify the user's primary issues into one of six common pattern types, which each map to a different set of interventions:
1. **Morning reactivity pattern:** Phone checked before leaving bed; the day begins in response mode
2. **Notification-fragmented attention:** Unable to sustain focus for more than 5-10 minutes; attention constantly shattered by pings
3. **Bedtime displacement:** Sleep delayed by 30-90 minutes due to scrolling; often combined with difficulty feeling tired
4. **Social media rumination:** Mood negatively affected by social media; time spent longer than intended
5. **Unconscious pickup habit:** Phone picked up without intention 80-200+ times per day; filler behavior during micro-transitions
6. **Work-personal digital bleed:** Work messages invading personal time through personal devices; inability to disconnect from work

### Step 3: Design the Boundary Architecture

A digital wellbeing plan has three types of boundaries, and all three are needed for the plan to hold:

**Time Boundaries -- when devices are and are not used:**
- The most evidence-supported time boundaries are: the first 30-60 minutes after waking (protecting morning agency), 90-120 minutes before bed (protecting sleep onset), and mealtimes (protecting relational presence).
- Express all time boundaries as specific clock times, not relative durations. "No phone before 7:30 AM" is enforceable. "No phone for an hour in the morning" is not -- the start time is ambiguous and the rule collapses.
- For each time boundary, specify what happens to the device during that window: put in a specific drawer, left on a charger in a specific room, or placed face-down. Ambiguity about the device's location during off-time is a common failure point.

**Space Boundaries -- where devices are and are not present:**
- The bedroom is the highest-leverage space boundary for most users because it directly affects sleep quality and the morning pickup habit simultaneously.
- Removing the phone from the bedroom requires purchasing a replacement alarm clock. Without this, the boundary collapses immediately. Recommend this as a concrete first action.
- Other high-value space boundaries: the dining table, the bathroom, the car (phone in glove compartment while parked), and specific "focus rooms" like a home office or reading chair.

**Interaction Boundaries -- how and under what conditions devices are used:**
- Batch checking: Instead of continuous availability, email and non-urgent messages are checked at 2-3 scheduled windows per day (e.g., 9 AM, 1 PM, 5 PM). This technique reduces checking anxiety over time, not immediately -- inform the user it typically takes 7-10 days to feel comfortable.
- App session limits: iOS Screen Time and Android Digital Wellbeing both support per-app daily limits. These create a soft stop that requires a conscious override, which introduces the pause that habit loops need to be interrupted.
- Grayscale mode: Switching a phone display to grayscale (available in Accessibility settings on both iOS and Android) reduces the visual reward signal of colorful app icons and feeds. It is a low-effort friction technique that many users report effective for reducing unconscious pickups. It takes 30 seconds to enable.
- Notification batching: iOS 15+ supports "Scheduled Summary" which delivers non-urgent notifications at specific times rather than in real time. Android has a similar "notification snooze" function. These are the most structurally powerful notification management tools available.
- Home screen redesign: The home screen should contain only tools (maps, weather, phone, camera) -- not portals (social media, email, news). Moving portal apps off the home screen adds 3-5 seconds of friction to each launch, which is sufficient to interrupt unconscious access.

### Step 4: Build the Notification Management Tier System

Notification management is not about which app is important -- it is about what kind of response is required and when. Use a three-tier system:

**Tier 1 -- Immediate (interrupting):** Only notifications where a 15-minute delay causes genuine harm. Criteria: direct phone calls from close contacts, text messages from family members (optionally configure Favorites in iOS or starred contacts in Android), calendar alarms for appointments, and genuine safety alerts. Most users have 2-5 apps in this category.

**Tier 2 -- Batched (scheduled):** Notifications where a response within a few hours is sufficient. Criteria: email, work chat (Slack, Teams), non-urgent messaging. Configure these as silent with no banner -- badge count only, visible at scheduled checking times. If the platform supports scheduled delivery, use it.

**Tier 3 -- Disabled (off entirely):** Notifications that exist to return the user to the app, not to inform them of anything time-sensitive. Criteria: social media likes, comments, and follower notifications; news breaking alerts; promotional and marketing messages; game notifications; streaks and gamification reminders from apps. The default for every new app install should be to place it in Tier 3 until proven otherwise.

**Platform-specific implementation notes:**
- iOS: Settings > Notifications > select each app > adjust delivery style. Focus modes (Do Not Disturb, Sleep, Personal, Work) allow different notification tiers at different times of day automatically.
- Android: Settings > Notifications > App notifications. Notification channels within apps allow granular control (e.g., keeping direct messages on for an app while turning off likes and promotional alerts).
- The actual work of auditing notifications takes 15-20 minutes for most users but has a lasting daily benefit. Walk the user through the process conceptually so they know exactly what to do.

### Step 5: Develop Replacement Activities

Every boundary that removes phone use must be paired with a specific, readily available alternative. The replacement must match the functional role the phone was serving. Using the cue-routine-reward framework from Step 2:

- **Phone used for boredom/stimulation:** Replace with tactile novelty -- a puzzle, sketchpad, physical book placed in the same location as the phone was, or a specific podcast/audiobook to listen to on a separate device (old iPod, small speaker, smart speaker).
- **Phone used for anxiety regulation:** Replace with brief physiological intervention. Box breathing (4 seconds in, 4 seconds hold, 4 seconds out, 4 seconds hold) activates the parasympathetic nervous system in 60-90 seconds. The 5-4-3-2-1 grounding technique (name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste) interrupts anxious spiraling effectively. These are not placeholders -- they are the same techniques used in evidence-based anxiety treatment.
- **Phone used for social connection:** Replace with a scheduled brief call or text to someone specific. "I will call one person I care about for 5 minutes" is more effective than a vague plan to "connect more."
- **Phone used for transition/escape:** Replace with a brief physical movement -- a 2-minute walk, 10 jumping jacks, or standing and looking out a window for 60 seconds. Movement during transitions is as effective as phone use for releasing transition-state cognitive restlessness.
- **Bedtime scrolling specifically:** The replacement must be calming, not stimulating. Options: physical book (works for most people), progressive muscle relaxation (tense and release each muscle group from feet to face, takes 10 minutes), a sleep-specific meditation via a device that is not a smartphone (dedicated meditation app on a tablet used only for this, or a smart speaker), or a low-stimulation podcast with a sleep timer.

### Step 6: Sequence the Implementation Timeline

Behavioral change research consistently shows that attempting more than 2-3 changes simultaneously decreases success rates for all changes. Sequence the plan's changes from lowest friction to highest friction across two weeks. This is not about being gentle -- it is about accumulating wins that build the self-efficacy needed to sustain harder changes.

**Sequencing logic:**
- **Lowest friction first:** Notification changes (turning off badges and sounds requires no behavioral change throughout the day) and home screen redesign (5 minutes, immediate effect)
- **Spatial changes second:** Removing the phone from one room requires purchasing one item (alarm clock) and changing one nightly routine
- **Schedule changes third:** Morning and bedtime routines require overriding established biological habits -- these need the foundation of the earlier changes to succeed
- **Active limit-setting last:** App time limits and batch-checking windows require sustained daily behavioral decisions and feel most uncomfortable; the preceding wins make them easier

A 14-day timeline is the appropriate window for a first plan because it is long enough to see measurable change in screen time data but short enough that it feels finite. After 14 days, the user reviews data and either maintains the plan, adjusts it, or escalates specific goals.

### Step 7: Define the Recovery Protocol and Success Metrics

Most behavioral change plans fail because they have no recovery protocol -- a single violation feels like total failure, which triggers abandonment (the "what-the-hell effect" documented in self-regulation research). Build the recovery protocol into the plan explicitly.

**Success metrics to define upfront:**
- Target average daily screen time (set at 20-35% reduction from baseline for Week 1, 35-50% for Week 2 -- reductions larger than this are typically not sustained)
- Pickup frequency target (a realistic goal is 50% reduction from baseline over two weeks)
- Specific behavioral markers: "Phone charged outside bedroom for at least 10 of 14 nights" -- binary, trackable, not dependent on subjective assessment
- Sleep outcome (if sleep was a stated concern): Track sleep onset time and wake time for two weeks using a journal or non-smartphone sleep tracker

**Recovery protocol language to include:**
- Any rule can be broken once without consequence -- the only failure is abandoning the plan entirely
- After breaking a rule, write one sentence about why it happened (context, not self-criticism), then resume the rule the next day
- If the same rule is broken three days in a row, the rule needs to be modified, not abandoned -- bring it back to the plan and make it less demanding

---

## Output Format

```
## Digital Wellbeing Plan

**Assessment Date:** [date]
**Current Daily Screen Time:** ~[X] hours ([Y] pickups/day)
**Primary Pattern Types:** [1-3 from the six patterns identified in Step 2]
**Core Motivation:** [user's own stated reason for wanting to change]
**Target Screen Time (Week 1):** ~[X] hours/day ([Y]% reduction)
**Target Screen Time (Week 2):** ~[X] hours/day ([Z]% reduction)

---

### Habit Map

| Pattern | Cue | Routine | Reward | Intervention Type |
|---------|-----|---------|--------|-------------------|
| [pattern name] | [what triggers it] | [what the behavior is] | [what it provides] | [time/space/interaction boundary] |
| [pattern name] | [what triggers it] | [what the behavior is] | [what it provides] | [time/space/interaction boundary] |

---

### Time Boundaries

| Boundary | Specific Rule | Device Location During Off-Time | Replacement Activity |
|----------|--------------|--------------------------------|---------------------|
| Morning window | No phone [start time] to [end time] | Charging in [specific room] | [specific activity] |
| Mealtime | No phone during [meal(s)] | Face-down in [location] or in [room] | [specific activity] |
| Bedtime window | Phone off by [specific time], [X] min before sleep target | Charging in [specific room] | [specific activity] |
| [additional boundary] | [specific rule] | [specific location] | [specific activity] |

---

### Space Boundaries

| Zone | Rule | Setup Required |
|------|------|----------------|
| Bedroom | [specific rule] | [what to buy or move] |
| [other zone] | [specific rule] | [what to buy or move] |
| [other zone] | [specific rule] | [what to buy or move] |

---

### Notification Tier System

| Tier | Delivery Mode | Apps / Sources |
|------|--------------|----------------|
| Tier 1 -- Immediate | Sound + banner | [specific apps/contacts] |
| Tier 2 -- Batched | Silent, badge only; checked at [times] | [specific apps] |
| Tier 3 -- Off | No notification | [specific apps] |

**Setup instructions:**
- iOS: [specific steps]
- Android: [specific steps]

---

### App-Specific Rules

| App | Current Daily Use | New Rule | Friction Technique |
|-----|------------------|----------|--------------------|
| [app] | [X] hrs/day | [specific rule with limit or schedule] | [home screen move / grayscale / app limit] |
| [app] | [X] hrs/day | [specific rule] | [technique] |
| [app] | [X] hrs/day | [specific rule] | [technique] |

---

### Replacement Activities Menu

Match the replacement to the function the phone was serving:

**For boredom / need for stimulation:**
1. [activity] -- [duration] -- [where to keep the materials]
2. [activity] -- [duration] -- [where to keep the materials]

**For anxiety / need for regulation:**
1. Box breathing: 4 seconds in / 4 seconds hold / 4 seconds out / 4 seconds hold. Repeat 4 times. Duration: ~90 seconds.
2. [additional technique matched to user's specific triggers]

**For bedtime specifically:**
1. [activity] -- [duration] -- [what to prepare in advance]
2. [activity] -- [duration] -- [what to prepare in advance]

---

### 14-Day Implementation Plan

| Phase | Days | Specific Actions | Success Indicator |
|-------|------|-----------------|-------------------|
| Foundation | 1-3 | [notification audit, home screen redesign -- no behavioral change required] | [measurable marker] |
| Spatial | 4-7 | [bedroom boundary, one additional space boundary -- requires one purchase] | [measurable marker] |
| Scheduling | 8-11 | [morning and/or bedtime routine change] | [measurable marker] |
| Active Limits | 12-14 | [app time limits, batch-checking windows] | [measurable marker] |

---

### Recovery Protocol

If you break a rule:
1. Name the context: "I broke [rule] because [specific reason]."
2. Set a resumption point: "I will resume this rule [tomorrow / after this trip / starting Monday]."
3. Modify if needed: If the same rule breaks three days in a row, adjust it -- make it less demanding rather than abandoning it.

Breaking one rule one time is not failure. Abandoning the plan after one slip is the only failure mode.

---

### 2-Week Progress Review

Check your phone's screen time report and answer:
1. What is my current average daily screen time versus my starting point of [X] hours?
2. Which boundary was easiest to maintain consistently? What made it work?
3. Which boundary was hardest? What specifically got in the way?
4. Has my [stated primary goal: sleep / focus / relationship quality] improved, stayed the same, or worsened?
5. Which 1-2 rules do I want to make permanent? Which 1-2 need to be adjusted?
6. Is there a behavior that was not in the original plan that I now want to address?
```

---

## Rules

1. **Never use addiction language.** Do not say "addicted to your phone," "phone addiction," or any clinical framing unless the user uses it first. Use descriptive, non-pathologizing language: "your current usage is significantly above your stated goal," "you're picking up your phone more often than feels intentional," or "this pattern is affecting your sleep in a way you want to change." Clinical assessment is not this skill's function.

2. **Every time boundary must state a specific clock time, not a relative duration.** "No phone before 7:30 AM" is a rule. "No phone for 30 minutes after waking" is not -- the start point is undefined and the rule collapses every morning. Ask the user what time they typically wake up and anchor all morning rules to a specific time.

3. **Every space boundary must specify the device's physical location during the boundary.** "No phone in the bedroom" fails without a specified charging location outside the bedroom. "No phone at the dining table" fails without a specified resting place for the device during meals. Location specificity is the difference between a rule and a wish.

4. **Every removed behavior must have a replacement behavior specified.** Behavioral science is unambiguous on this: removing a habit without replacing it with a different response to the same cue results in the old habit returning within 2-3 weeks. The replacement must match the function the phone was serving (stimulation, anxiety regulation, social connection, boredom relief, escape).

5. **Limit the total plan to 6-8 rules maximum.** A plan with 15 rules is not a plan -- it is a list of aspirations that produces shame when violated. Six well-chosen, specific rules enforced consistently outperform 15 vague rules every time. Prioritize the user's highest-impact, highest-motivation changes.

6. **Set screen time reduction targets at 20-35% for Week 1 and 35-50% for Week 2.** A user who reports 6 hours of screen time should target 4-5 hours in Week 1 and 3-4 hours in Week 2, not an immediate jump to 2 hours. Aggressive targets produce rebound effects. Sustainable targets produce lasting change.

7. **The bedroom boundary is the single highest-leverage intervention for users whose sleep is affected.** It addresses the bedtime scrolling pattern, the morning pickup pattern, and the unconscious overnight checking habit simultaneously. If sleep quality or morning phone-grabbing is mentioned at all, include the bedroom boundary -- even if the user does not explicitly ask for it.

8. **Never moralize about screen time.** Do not say "screens are harmful," "social media is toxic," or imply that the user's current habits are a moral failing. Frame every change in terms of the user's own stated goals: "You said you want better sleep -- here's how this boundary serves that." External judgment destroys engagement with self-directed behavior change.

9. **Always include the recovery protocol.** The "what-the-hell effect" -- abandoning an entire plan after a single violation -- is the primary failure mode for behavior change efforts. The recovery protocol (acknowledge, name the context, resume the next day, modify if repeatedly broken) prevents this collapse. It is not optional.

10. **Screen time reports from phone OS settings are the ground truth.** If the user is estimating and the estimate seems low, gently suggest they check their actual screen time data before finalizing targets. Users systematically underestimate their phone use by 30-50% (a well-documented bias in self-report research). A plan built on an underestimate will have targets that are too easy and won't feel meaningful.

11. **If the user reports trying and failing multiple times before, reduce scope aggressively.** A user who has failed 3 times at eliminating bedtime scrolling needs a plan that begins with one small change (notifications off for social media) not another comprehensive overhaul. Ask what the smallest possible version of success looks like, then build from there.

12. **If the user mentions that digital devices are their primary coping mechanism for anxiety, stress, or loneliness, name this explicitly and adjust the plan.** A phone used primarily for emotional regulation cannot simply be removed -- the emotion will still need regulation. Pair every restriction with an explicit alternative coping tool calibrated to the specific emotional function. If the emotion regulation need is significant and persistent, recommend consulting a therapist in addition to building the digital wellbeing plan.

---

## Edge Cases

**User works in a digital-first profession (software developer, video editor, data analyst, journalist, graphic designer):**
Do not conflate work screen time with problematic screen time. A developer's 5 hours of work screen time is occupational, not a wellness issue. Assess personal-time screen time only. The plan should focus exclusively on boundaries between work time and personal time, and on personal-device use outside work hours. Add two work-specific interventions: (1) the 20-20-20 rule for eye strain (every 20 minutes, look at something 20 feet away for 20 seconds) and (2) a hard end-of-work digital cutoff (a specific time each day when work applications are closed and work notifications are silenced). Do not set a personal screen time target that competes with professional requirements.

**User is a content creator, influencer, or has a business that requires social media use:**
Distinguish sharply between productive social media use (posting content, responding to client DMs, engaging in relevant communities, reviewing analytics) and passive consumption (scrolling feeds, watching unrelated content, reading comment sections on other creators' posts). Build the plan around consumption limits, not creation limits. Recommend using a dedicated device profile or browser profile for business social media that is separate from personal social media -- the contextual separation signals to the brain that these are different activities with different rules. Do not set app time limits on apps the user needs for work -- instead, set context-specific rules (only use Instagram for business between 9 AM and 6 PM, and any use outside those hours counts as personal use toward the consumption limit).

**User has tried 3 or more digital wellbeing plans that collapsed within a week:**
Repeated failure at behavior change is informative, not shameful -- it tells you that previous plans were either too aggressive, too comprehensive, or didn't address the underlying function of the behavior. Do not build another comprehensive plan. Instead: (1) identify the single rule from previous plans that was maintained the longest, (2) build the entire first phase of the plan around that one rule, and (3) add exactly one new rule every 7 days. A plan that builds sequentially from proven success has a higher success rate than a plan that launches with maximum ambition. If the user reports that they override their app limits immediately every time they hit them, the problem is self-commitment -- explore whether an accountability partner, a public commitment, or a prepaid consequence (putting $5 in a jar every time the limit is overridden and donating it to a cause they don't like) would help.

**User's partner, roommate, or family members do not share their digital boundaries and resist them:**
The plan is for one person. It cannot mandate others' behavior. However, shared-space boundaries (no devices at the dinner table) require at minimum passive cooperation from others in the space. Recommend the user frame their boundaries as personal commitments, not household rules: "I'm keeping my phone in the kitchen overnight -- I'm not asking you to do the same." For shared spaces, the user can set their own behavior only: placing their phone face-down, putting it in their pocket, or leaving it in another room regardless of what others do. If the user's partner frequently sends work-related or urgent messages late at night and expects immediate responses, this is a relationship communication issue, not a digital wellbeing issue, and may require a separate conversation.

**User reports that their sleep is severely disrupted (2+ hours of bedtime scrolling, inability to fall asleep before 2 AM) and attributes it primarily to phone use:**
The bedroom boundary is the first intervention. However, also note that severe sleep-onset difficulty is a symptom that can have multiple causes beyond screen use, including anxiety, depression, circadian rhythm disruption, and sleep disorders. The plan should include the phone removal and a wind-down routine, but also recommend the user speak with a healthcare provider if sleep quality doesn't improve within the 2-week plan window, since screen removal alone may not resolve clinically significant insomnia.

**User wants a plan but has an anxiety disorder and reports that NOT having access to their phone creates significant anxiety:**
This is the highest-complexity case within the self-help scope. Phone removal as an anxiety trigger is real and the plan must respect it. Do not recommend removing the phone from the bedroom or setting extended phone-free windows as early steps. Instead: (1) start only with notification management changes that don't restrict access (the phone is still present, but incoming alerts are reduced), (2) use brief, bounded phone-free windows of 10-15 minutes before gradually extending them, (3) explicitly pair every restriction with an anxiety-management technique (box breathing, grounding) immediately available, and (4) flag clearly that if anxiety around phone restriction is intense or impairing, a mental health professional can provide evidence-based tools (particularly exposure-based techniques from CBT) that are more appropriate than self-directed plans.

**User wants to track their progress but doesn't want to use their phone to do so:**
This is a fair position -- using a phone app to track phone use has a self-defeating quality that some users rightly identify. Recommend a paper-based tracking approach: a small notebook kept near the phone's charging location. Each morning, the user writes the previous day's screen time (from the phone's weekly report, checked once) and marks which boundaries they maintained the previous day with a checkmark. This takes 90 seconds and creates a physical record that doesn't require opening the phone. Alternatively, a $5-10 paper habit tracker from any stationery store provides the same function.

---

## Example

**Input from user:** "I'm on my phone constantly. I checked and my screen time is 7.5 hours a day and I pick it up 180 times. Most of it is Instagram and TikTok, probably 3 hours combined. I also can't stop checking my work email even at night -- I work in marketing and I feel like I always have to be available. I haven't been sleeping well for months. My partner has mentioned that I'm 'not really present' at dinner. I've tried deleting apps before but I just reinstall them. I want to actually fix this."

**Identified patterns:** Bedtime scrolling (sleep impact), unconscious pickup habit (180/day), work-personal digital bleed (marketing job, evening email), social media passive consumption (3 hours/day Instagram/TikTok)

**Habit map constructed from assessment:**

- Instagram/TikTok: Cue = boredom / any unoccupied moment; Routine = open app, scroll passively; Reward = novelty, stimulation, intermittent social validation
- Work email at night: Cue = anxiety about missing something / being seen as responsive; Routine = check email on personal phone at all hours; Reward = temporary relief from "what if I missed something" anxiety
- Bedtime scrolling: Cue = getting into bed, transitional discomfort before sleep; Routine = scroll until eyes close; Reward = avoiding the discomfort of lying awake, stimulation
- Unconscious pickups (180/day): Cue = any micro-transition (sitting down, waiting, between tasks); Routine = pick up phone, open whatever is prominent on screen; Reward = stimulation relief, brief escape from present moment

---

## Digital Wellbeing Plan

**Assessment Date:** [today's date]
**Current Daily Screen Time:** ~7.5 hours/day (~180 pickups/day)
**Primary Pattern Types:** Work-personal digital bleed, bedtime scrolling, unconscious pickup habit, social media passive consumption
**Core Motivation:** Better sleep, being present with partner at dinner, breaking the reinstallation cycle
**Target Screen Time (Week 1):** ~5.5 hours/day (~27% reduction)
**Target Screen Time (Week 2):** ~4 hours/day (~47% reduction)

---

### Habit Map

| Pattern | Cue | Routine | Reward | Intervention Type |
|---------|-----|---------|--------|-------------------|
| Bedtime scrolling | Getting into bed / transition discomfort | Scroll Instagram or TikTok until sleep | Stimulation, avoidance of quiet | Space boundary (phone out of bedroom) + time boundary + replacement |
| Work email at night | Anxiety about missing something; phone is always accessible | Check work email on personal phone after 7 PM | Temporary anxiety relief | Time boundary (hard work cutoff) + notification tier change |
| Unconscious pickups | Any micro-transition, phone visible or in hand | Open app from home screen | Stimulation, brief escape | Friction increase (home screen redesign, grayscale) |
| Social media passive consumption | Boredom, phone in hand | Open Instagram or TikTok, scroll for 30-60 min blocks | Novelty, social comparison, time fill | App session limit + Tier 3 notifications + home screen removal |

---

### Time Boundaries

| Boundary | Specific Rule | Device Location During Off-Time | Replacement Activity |
|----------|--------------|--------------------------------|---------------------|
| Morning | No phone before 7:30 AM (adjust to your wake time + 30 min) | Charging in kitchen overnight | Make coffee, eat breakfast, look out the window for 5 minutes. Keep a book on the kitchen table if you want something to read. |
| Dinner | No phone from 6:30 PM to 7:30 PM during the dinner hour | In your bag, jacket pocket, or on the kitchen counter -- not the table | Full attention to dinner and conversation. If you want background, put music on a speaker instead. |
| Work email cutoff | No work email after 7:30 PM on weekdays. No work email before 8:30 AM. Weekends: check once at 10 AM only, then close. | Work email app notifications off entirely after 7:30 PM | If you feel the "what if I missed something" anxiety, write the concern in a notebook -- this externalizes the anxiety without feeding it with checking. |
| Bedtime | Phone on charger in kitchen by 9:30 PM (90 minutes before 11 PM sleep target) | Kitchen counter, charging | Physical book on nightstand. Alternatively, 10 minutes of progressive muscle relaxation. If you need audio to fall asleep, use a smart speaker with a sleep timer, not your phone. |

---

### Space Boundaries

| Zone | Rule | Setup Required |
|------|------|----------------|
| Bedroom | Phone does not enter the bedroom. Charges in the kitchen overnight, every night. | Buy one alarm clock ($10-15, a basic one works fine). Move phone charger to kitchen counter tonight. |
| Dining table | No device on the dining table during meals -- yours or a guest's. Stack phones face-down on the kitchen counter before sitting down. | No purchase required. A small habit: put the phone down before you plate the food. |
| Bathroom | No phone in the bathroom. | No purchase required. This recovers 10-15 minutes of daily unconscious screen time immediately. Leave the phone on a table before going in. |

---

### Notification Tier System

| Tier | Delivery Mode | Apps / Sources |
|------|--------------|----------------|
| Tier 1 -- Immediate | Sound + banner, all day | Phone calls (everyone), text messages from your Favorites list (partner, close family), calendar alarms |
| Tier 2 -- Batched | Silent, badge only; check at 9 AM, 1 PM, and 5 PM | Personal email, non-urgent messaging apps (WhatsApp groups, Signal), Slack/Teams for personal projects |
| Tier 3 -- Off entirely | No sound, no badge, no banner | Instagram (all notifications), TikTok (all notifications), work email (after 7:30 PM -- configure using iOS Focus or Android Do Not Disturb scheduled mode), news apps, all promotional notifications, LinkedIn activity notifications |

**Setup instructions (do this in one 20-minute session on Day 1):**
- iOS: Settings > Notifications > go through every app and move to appropriate tier. Then: Settings > Focus > create a "Sleep" Focus mode active from 9:30 PM to 7:30 AM that allows only Tier 1 notifications. Create a "Personal" Focus mode active from 7:30 PM to 9:30 PM that silences work email.
- Android: Settings > Digital Wellbeing & Parental Controls > set app timers for Instagram and TikTok. Settings > Notifications > for each app, disable notification categories for social engagement (likes, comments, follows) while keeping direct messages if needed.

---

### App-Specific Rules

| App | Current Daily Use | New Rule | Friction Technique |
|-----|------------------|----------|--------------------|
| Instagram | ~1.5 hrs/day | 30 minutes maximum per day, all in one sitting if possible (not scattered across 20 sessions) | Move to folder on page 3 (not home screen). Set 30-min daily limit in Screen Time/Digital Wellbeing. All notifications off. |
| TikTok | ~1.5 hrs/day | 20 minutes maximum per day. Consider whether TikTok is serving any specific purpose or is purely reactive consumption -- if the latter, deleting it is an option to revisit in Week 2. | Move to same folder as Instagram, page 3. Set 20-min daily limit. Autoplay is the highest-risk feature; close the app proactively rather than waiting for it to stop. |
| Work email | ~45 min/day personal time | Only during work hours and the one scheduled weekend check. After 7:30 PM: zero access. | Remove the work email app from your personal phone's home screen. Better: configure it to require a passcode to open after 7:30 PM (this is achievable on iOS using Guided Access, or by logging out each night -- cumbersome by design). |
| News apps | ~30 min/day | Once per day, at lunch. | Delete news app widget from home screen. Keep app but open it intentionally rather than reactively. |

---

### Replacement Activities Menu

**For boredom / need for stimulation (unconscious pickups):**
1. Pick up the physical book you've placed on the dining table or nightstand -- read one page. Duration: 2-3 minutes.
2. Stand up and do 10 slow shoulder rolls, 5 neck circles each direction. Duration: 90 seconds.
3. Make or refill a drink -- water, coffee, tea. Duration: 3 minutes. The walk to the kitchen and back resets the micro-transition that triggered the pickup.

**For anxiety / "what if I missed something" (work email at night):**
1. Box breathing: Breathe in for 4 counts, hold for 4 counts, breathe out for 4 counts, hold for 4 counts. Repeat 4 times. Duration: ~90 seconds. This activates the parasympathetic nervous system and reduces acute anxiety more quickly than scrolling does.
2. Write the worry in a notebook: "I'm worried about [X] work thing." Then add: "I will address this tomorrow at [time]." This externalizes the anxious thought without feeding the checking loop.

**For bedtime (replacing scrolling before sleep):**
1. Physical book on the nightstand -- any genre, physical not digital. Reading engages attention without blue light or intermittent social reward. Even 10 minutes shifts the brain out of stimulation-seeking mode.
2. Progressive muscle relaxation: Starting from your feet, tense each muscle group for 5 seconds and release. Move from feet to calves, thighs, abdomen, hands, arms, shoulders, face. Takes 8-10 minutes, produces measurable drowsiness.
3. Smart speaker (Alexa, Google Home, HomePod mini) with a sleep timer playing a calm podcast, white noise, or ambient sound. This preserves the audio-companion function of phone use at bedtime without the screen.

---

### 14-Day Implementation Plan

| Phase | Days | Specific Actions | Success Indicator |
|-------|------|-----------------|-------------------|
| Foundation | 1-3 | Spend 20 minutes auditing all notifications (Tier 1/2/3). Redesign home screen -- social media and email to page 3 folder, Tier 1 tools only on home screen. Enable grayscale mode (Accessibility > Display > Color Filters > Grayscale). Set up iOS Focus/Android DND for 9:30 PM -- 7:30 AM. | Notification volume noticeably reduced. Social apps require deliberate navigation to reach. No behavioral change required yet. |
| Spatial | 4-7 | Buy alarm clock. On Night 4, charge phone in kitchen for the first time. Begin bathroom rule (phone stays on table before entering). Keep dinner phone rule starting Day 5. | Phone charged outside bedroom for at least 4 of 4 nights. Partner notices phone is not on the dining table. |
| Scheduling | 8-11 | Begin morning rule: no phone before 7:30 AM. Begin work email cutoff: phone silent for work at 7:30 PM. Check how this affects sleep -- note in a brief nightly journal (one sentence). | Woke up without checking phone for at least 3 of 4 mornings. Checked work email fewer than 3 times after 7:30 PM across the four days. |
| Active Limits | 12-14 | Set 30-minute Instagram and 20-minute TikTok daily limits in phone settings. Begin batch-checking personal email at 9 AM, 1 PM, 5 PM only. Review Week 1 and Week 2 screen time reports and compare to the 7.5-hour baseline. | Average daily screen time below 4.5 hours. Instagram and TikTok combined under 50 minutes/day. Pickup count below 100/day. |

---

### Recovery Protocol

If you break a rule:
1. Name the context without judgment: "I broke the bedtime rule Tuesday because I was stressed about the campaign launch and needed to check one thing, which turned into 45 minutes."
2. Set a resumption point: "Bedtime rule resumes tomorrow night."
3. Do not modify the plan after one failure -- patterns need at least three consecutive failures before the rule is worth reconsidering.
4. If the same rule breaks three consecutive days: make it less demanding. If "phone in kitchen by 9:30 PM" breaks every night, shift the target to 10:00 PM. It is better to maintain a slightly later boundary than to abandon the boundary entirely.

Breaking a rule once is information. Abandoning the plan is the only failure.

---

### 2-Week Progress Review

Check your phone's Screen Time or Digital Wellbeing report on Day 15 and answer:
1. What is your average daily screen time now compared to the 7.5-hour baseline? (Check the "Last 7 days" average.)
2. What is your daily pickup count now compared to 180?
3. Which boundary was easiest to maintain? What specifically made it work -- time, location, replacement activity, or the friction you introduced?
4. Has your sleep onset improved? Are you falling asleep faster or feeling more rested? (If not, consult a healthcare provider -- phone removal alone may not resolve clinically significant insomnia.)
5. Has your partner noticed a difference at dinner? (This is worth asking directly -- external feedback is powerful data.)
6. Which rules do you want to keep permanently? Which need adjustment? Which was not worth the effort?
7. Is there one behavior you did not address in this plan that you now want to tackle -- or one that you thought was a problem but turned out not to matter as much as you expected?
