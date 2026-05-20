---
name: accountability-system-design
description: |
  Designs personalized accountability systems for habit and goal maintenance, including accountability partner structures, check-in formats, commitment contracts, and progress reporting templates. Gathers the user's goals and social context, then produces a complete accountability framework with partner selection criteria, meeting agendas, and escalation protocols.
  Use when the user asks about accountability partners, staying accountable to goals, creating check-in systems, commitment devices, or building social support for habit change.
  Do NOT use for clinical supervision structures, addiction recovery sponsorship, or group therapy facilitation.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "goal-setting habits self-care planning"
  category: "health-wellness"
  subcategory: "preventive-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Accountability System Design

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, starting a new fitness program, or changing your diet. If you are experiencing a medical emergency, contact emergency services immediately.

## When to Use

**Use this skill when:**
- User wants to build a structured partner or group accountability system for a specific habit, goal, or behavior change (exercise, writing, studying, sleep hygiene, nutrition changes, creative practice)
- User asks how to stay accountable to goals they have repeatedly abandoned on their own -- the problem is external commitment structure, not willpower
- User has a specific person or group in mind and wants to know how to formalize the relationship and prevent it from drifting into social chat
- User wants to create a commitment contract with consequences -- they need binding structure, not just intention
- User wants to design check-in formats, reporting templates, or meeting agendas for tracking progress with another person
- User is building social support infrastructure for a significant behavior change that has failed in the past with self-monitoring alone
- User wants to invite someone into a structured accountability relationship and needs language and framing to make the ask
- User wants to understand what kind of accountability structure fits their personality, social context, or goal type

**Do NOT use when:**
- User needs clinical accountability structures for treatment compliance, medication adherence, or medically supervised programs -- refer to `clinical-care-planning` or recommend speaking with their treatment team
- User is navigating addiction recovery and needs sponsor-style accountability with relapse protocols -- this requires licensed or trained support, not a habit-partnership framework
- User wants to hold another person accountable (a direct report, a child, a partner) -- this is a management or relationship skill, not a personal accountability system
- User wants a pure self-tracking system with no social or interpersonal component -- use `habit-tracking-system` instead
- User needs group therapy facilitation, peer support group structure, or community mental health programming
- User's goal involves a medical condition requiring professional supervision (e.g., eating disorder recovery, severe depression management, post-surgical rehabilitation)
- User describes compulsive avoidance, persistent inability to keep any commitments despite multiple attempts, or significant psychological distress around goal-setting -- suggest speaking with a licensed mental health professional first

---

## Process

### Step 1: Diagnose the Accountability Gap Before Designing the System

Understanding WHY previous accountability attempts failed is more important than picking a structure. Ask these specific diagnostic questions before designing anything:

- "Have you tried to be accountable to this goal before? What happened -- did you stop checking in, did the partner drift, did the system feel punitive?"
- "When you imagine missing your goal for a week, what happens in your body -- do you feel shame, do you get defensive, do you go quiet?" This reveals whether the system needs warmth-first or structure-first design.
- "Do you have more motivation to start things or to sustain them?" Starters need commitment-front loading (public declaration, contracts). Sustainers need progress-tracking and momentum design.
- "Is your goal outcome-based (lose 15 pounds, finish the draft) or behavior-based (exercise 4x/week, write 500 words daily)?" Outcome goals need different check-in structures than behavior goals.
- "Do you want your accountability partner to challenge you, encourage you, or just witness?" These are three genuinely different roles requiring different scripts and response protocols.
- Look for "accountability handcuff" patterns: users who design extremely punitive systems as a form of self-punishment rather than genuine support -- these systems fail within 3 weeks and leave people feeling worse about themselves than before they started.

### Step 2: Select the Accountability Architecture

Match the structure to the user's social context, goal type, and failure history. Four architectures exist -- choose one primary and optionally one secondary:

**Architecture 1: Dyadic Accountability Partnership (one-on-one)**
- The highest-reliability structure when the right partner is available
- Requires: mutual goals (not identical, but both people are working toward something), compatible availability, and explicit role clarity
- Optimal check-in frequency for habit goals: daily text + weekly 15-minute call
- Optimal check-in frequency for project goals: 2x/week check-in, 20 minutes
- Power dynamic disqualifier: partners cannot be in a supervisory, parental, or therapeutic relationship -- honest reporting requires safety from judgment with consequences
- Decay pattern: dyadic partnerships last an average of 6-8 weeks without a structured agenda, then collapse into social chats or polite silence. The agenda is the maintenance mechanism.

**Architecture 2: Commitment Contract (self-directed with binding structure)**
- Used when no partner is available, or as a supplement to any of the other architectures
- Based on behavioral economics research on pre-commitment devices -- the act of writing specific commitments and consequences changes decision-making at the time of temptation, not just the time of signing
- Requires: specific written commitments, a review mechanism, and at least one witness (even an informal one -- a friend who receives a copy, a posted document)
- Most effective consequence structure: a small commitment to a cause the user actively dislikes (anti-charity commitment), not something neutral. Commitment to donate $20 to a political position the user opposes is a stronger deterrent than a $50 donation to a neutral cause.
- Include a "revision clause" -- the contract must specify how and when it can be revised, or the user will simply abandon it rather than renegotiate

**Architecture 3: Small Group Accountability (3-5 people)**
- Optimal group size is 3-4 people. At 5, participation inequality begins to develop (1-2 people carry the check-ins). At 6+, groups fracture into sub-conversations.
- Requires: a rotating facilitator role, a shared platform, and an explicit "no advice without permission" norm
- Best check-in format: asynchronous written reports submitted by a fixed deadline (Sunday 8pm), followed by a synchronous 20-minute weekly call for clarification and connection
- Groups work best when goal types are DIFFERENT from each other -- mismatched goals reduce comparison, competition, and unsolicited advice
- Groups need a "quorum rule": the check-in happens even if only 2 of 4 people show up. Never cancel accountability for attendance reasons.

**Architecture 4: Public Accountability**
- Appropriate for users who are highly motivated by social visibility and reputation
- Lower intimacy than dyadic partnership but higher initial commitment activation
- Formats: weekly progress posts to a relevant community (subreddit, Discord, social media), public dashboards, "building in public" practice
- Risk: public accountability can shift motivation from intrinsic (I want this) to purely extrinsic (I want to look like I'm doing this). Design it as a SUPPLEMENT to private accountability, not a replacement.
- Include a "what I actually did" format (not just wins) -- honest public reporting builds more trust and sustainable motivation than highlight-reel reporting

### Step 3: Design the Check-In Format with Surgical Precision

The check-in format is the core technical component of the system. Most accountability systems fail because check-ins are undefined, run too long, become advice-giving sessions, or drift into social conversation. Apply these design principles:

**The Four Questions That Every Check-In Must Answer:**
1. What did you commit to doing since the last check-in?
2. What did you actually do?
3. What got in the way (obstacle identification, not excuse-making)?
4. What is your specific commitment before the next check-in?

These four questions, answered in under 3 minutes per person, constitute a complete and functional check-in. Everything else is optional.

**Check-in timing rules:**
- Daily text check-ins: should take under 90 seconds to complete. If the template requires more, it will not sustain past week 2.
- Weekly calls: 15 minutes for dyadic (two people), 20 minutes for triads, 25 minutes for groups of 4. Never schedule 30+ minute accountability calls -- scheduling resistance kills compliance.
- Set a hard-stop timer. The timer is not rude; it is the mechanism that makes the meeting sustainable over months.

**Response protocols (frequently omitted, critically important):**
- The partner's job is to ask the fourth question ("What is your specific commitment until next time?") and confirm they heard it. NOT to diagnose, advise, or evaluate.
- Pre-agree on these response categories: Witness (I hear you), Question (Is your plan for next week realistic?), Challenge (only if explicitly requested), Cheer (only if genuinely warranted, not reflexively)
- Write the response protocol into the system explicitly. Without it, partners default to advice-giving, which creates resentment and reporting distortion.

**Reporting formats by goal type:**
- Behavior goals: report completion rate as a fraction (did 3 of 4 planned workouts)
- Project goals: report milestone status and next milestone (finished outline, drafting section 2 this week)
- Learning goals: report inputs (read 45 minutes/day, 5 of 7 days) not outputs (feel smarter)
- Relationship/soft goals: report behavioral actions taken (had one difficult conversation, reached out to three people) not feelings

### Step 4: Design the Commitment Contract Architecture

A commitment contract is most effective when it contains six specific elements. Generic contracts ("I will exercise more") fail within 10 days. Specific contracts with the following components sustain for 60-90 days:

**Element 1 -- The Specific Commitment**
Must include: the exact behavior, the frequency, the minimum threshold, and the context. "I will exercise 4 times per week, with a minimum of 20 minutes per session, in the morning before 9am" is a contract. "I will exercise more" is a wish.

**Element 2 -- The Measurement Mechanism**
How will completion be logged? A shared Google Sheet, a habit app screenshot, a text message with a photo, a paper tracker photographed and sent -- any mechanism that creates an external record, not just memory.

**Element 3 -- The Review Schedule**
When will the contract be formally reviewed? Monthly reviews are optimal. Include a specific process: "On the last Sunday of each month, I will review my completion rate and decide whether to continue, adjust, or end this contract."

**Element 4 -- The Stakes (if applicable)**
Stakes are optional but powerful. If the user wants them:
- Anti-charity stakes (commit to donating to a cause you dislike) outperform pro-charity stakes in compliance studies
- Small, immediate stakes outperform large, distant stakes
- The stake should be annoying, not devastating -- $20-50 is the effective range for most people. Large financial stakes create anxiety that undermines performance.
- Social stakes (public declaration of failure) are more powerful than financial for reputation-sensitive individuals

**Element 5 -- The Revision Clause**
"This contract can be revised on any scheduled review date with [X] days notice to my accountability partner. Mid-contract changes require notifying my partner and documenting the reason." Without this, users abandon contracts rather than renegotiate.

**Element 6 -- The Graduation or End Condition**
What does "done" look like? When does this contract end? Contracts without end conditions become oppressive. "After 90 days of 80% or higher compliance, I can choose to internalize this habit and end the contract structure" is a graduation condition.

### Step 5: Build the Escalation and Recovery Protocols

Most accountability systems lack escalation protocols, so when the first miss happens, the entire system collapses from ambiguity. Build explicit tiered responses:

**Tier 1 -- Single miss (1 missed check-in or 1 missed goal)**
Response: No action required. One miss is not a pattern. The system continues unchanged. The partner does NOT send "what happened?" messages after a single miss -- this creates surveillance anxiety.

**Tier 2 -- Pattern emergence (2 consecutive misses, or 3 non-consecutive misses in 30 days)**
Response: Flag it at the next weekly check-in. Ask: "I noticed a pattern -- is your goal still realistic? Is something in your life making this harder?" The goal is to understand the obstacle, not to apply pressure.

**Tier 3 -- System breakdown (3+ consecutive misses OR partner goes silent)**
Response: Initiate a "pause and recalibrate" conversation. This is NOT about failure -- it is about whether the goal or the system needs adjustment. Use the script: "I notice we've had a few weeks where the system hasn't been clicking. Can we take 10 minutes to ask whether the goal still makes sense, or whether the format needs to change?"

**Tier 4 -- Withdrawal (partner stops responding entirely)**
Response: One single follow-up message using a low-pressure welfare check: "Hey, I haven't heard from you in a few weeks. No pressure at all -- just wanted to check in and make sure you're okay. The accountability structure can pause or end whenever you need." Then wait. Do not send repeated messages. Accountability partnerships that end through ghosting are painful but common -- the system should make the exit easy enough that ghosting isn't the path of least resistance.

**Goal adjustment protocol:**
When a user misses their goal consistently, the problem is almost never willpower -- it is goal calibration. Apply the "minimum effective dose" diagnostic: what is the smallest version of this goal that would still provide meaningful progress? That is the adjusted target. A 50% reduction in goal size is not failure -- it is precision.

### Step 6: Design the Partner Selection and Outreach Framework

Partner selection is where most accountability systems are set up for failure before they begin. Provide explicit criteria and vetting questions:

**Positive selection criteria (must have at least 3 of 4):**
- Has their own active goal they are working toward (mutual accountability is 40-60% more durable than one-way accountability in practice)
- Has a history of keeping small commitments (shows up on time, follows through on plans)
- Communicates in a medium and at a cadence compatible with yours
- Is NOT in a position of authority, evaluation, or care over you in any other domain

**Negative selection criteria (disqualifiers):**
- Someone who has historically given unsolicited advice about this specific domain
- Someone whose opinion of you is directly affected by whether you succeed at this goal (this creates reporting distortion -- you will under-report failures)
- Someone who is going through a high-stress life period and cannot reliably show up
- Someone you would be embarrassed to "fail in front of" -- shame is the enemy of honest accountability

**The Ask Script framework:**
The request to become accountability partners should include four elements: the specific goal, the specific structure being proposed, the time commitment (explicit and bounded), and a trial period. Without a trial period, the ask feels like a permanent commitment and creates hesitation.

Template structure:
- Name the goal (specific, not vague)
- Describe the exact structure (daily text + weekly 15-minute call)
- State the time commitment honestly ("about 5 minutes a day plus 15 minutes on Sundays")
- Propose a trial ("Can we try it for 30 days and then decide if it's working for both of us?")

### Step 7: Design the Monthly System Review

The monthly review is the maintenance mechanism that keeps the accountability system itself from decaying. Most systems never include this, which is why they collapse around week 6-8. The review asks two distinct questions: "Is the goal still right?" and "Is the system still working?"

**Monthly review agenda (15 minutes max):**
1. Completion rate: What percentage of commitments did I actually complete this month? (Calculate it. Not "pretty good" -- an actual number.)
2. Obstacle analysis: Which obstacles appeared 2 or more times? A recurring obstacle is a design problem, not a discipline problem.
3. System audit: Is the check-in format still useful? Has it become rote? Does it need a new question or a changed format?
4. Goal calibration: Is the goal still the right goal? Has anything changed in life context that makes it more or less relevant?
5. Partner calibration: Is the partnership serving both people? Is the dynamic healthy and honest?
6. Next month commitment: What specifically is the adjusted or continued commitment for next month?

---

## Output Format

```
## Accountability System: [Goal/Habit Name]

**Goal:** [Specific behavior, frequency, threshold, and context]
**Structure:** [Dyadic / Self-Contract / Small Group / Public / Hybrid]
**Check-In Frequency:** [Daily text + Weekly call / 2x weekly / Weekly only]
**Communication Method:** [Text / Voice call / Video / Shared doc / App]
**System Start Date:** [Date]
**First Review Date:** [30 days from start]

---

### Why This Structure Fits Your Situation
[2-3 sentences explaining why this specific architecture was selected over alternatives, 
referencing the user's context, failure history, and goal type]

---

### Partner Selection Criteria

**Required (must have 3 of 4):**
- [ ] Has their own active goal they are working toward
- [ ] History of keeping small commitments reliably
- [ ] Communicates in a compatible medium and cadence
- [ ] Not in a position of authority, evaluation, or care over you in this domain

**Disqualifiers:**
- [ ] Confirm: Not someone who has historically advised you about this goal domain
- [ ] Confirm: Not someone whose relationship with you depends on your success here
- [ ] Confirm: Not currently in a high-stress life period that would impair reliability

---

### The Ask Script

"[Name], I'm working on [specific goal] and I'm looking for an accountability partner -- 
not a coach, just someone who checks in with me. I know you've been working on [their goal 
if known, or 'your own goals']. Here's what I'm thinking: [specific structure -- 
e.g., a quick daily text and a 15-minute Sunday call]. It would be about [time per day/week] 
of your time. Would you want to try it for 30 days and see if it helps both of us?"

---

### Daily Check-In Template (complete in under 90 seconds)

Send by [agreed time] each day. Copy, fill in, send:

```
[Day, Date]
Commitment today: [what you planned]
Completed: Yes / Partial / No
What I did: [one line description]
Tomorrow's plan: [specific plan]
```

Partner response: Send your own check-in. That IS the response. 
Do not evaluate, advise, or comment on their report unless they explicitly ask.

---

### Weekly Check-In Agenda ([X] minutes -- set a timer)

**Schedule:** Every [day] at [time]

**Format -- Person A (3 minutes):**
1. What did I commit to this week? What did I actually do? (Completion fraction: X of Y)
2. What was the primary obstacle?
3. What is my specific commitment for next week? (Day, action, threshold)

**Person B response (90 seconds):**
- "Is your plan for next week realistic given that obstacle?"
- [If asked for more]: One specific suggestion. Otherwise, acknowledge and switch.

**Format -- Person B (3 minutes):**
Same three questions.

**Person A response (90 seconds):**
Same format.

**Both -- System check (2 minutes):**
- "Are these check-ins still useful?"
- "Anything to adjust in the format?"
- Confirm next check-in time.

**Timer rings. Hard stop.**

---

### Commitment Contract

I, _________________, commit to the following specific behaviors:

| Commitment | Frequency | Minimum Threshold | Context/When |
|------------|-----------|-------------------|--------------|
| [Behavior 1] | [X times/week] | [Minimum version] | [When/where] |
| [Behavior 2 if applicable] | [X times/week] | [Minimum version] | [When/where] |

**Measurement mechanism:** [How will completion be logged and shared?]

**Stakes (if elected):**
- If I complete fewer than [X]% of commitments in any 30-day period, I will [consequence].
- Stakes amount/type: [Specific and bounded -- $20-50 anti-charity OR social declaration]

**Revision clause:** This contract can be revised on any scheduled review date. 
Mid-contract changes require notifying my accountability partner and documenting the reason.

**Graduation condition:** After [X] days of [Y]% or higher completion rate, 
I can choose to internalize this habit and end the contract structure.

**Review dates:** 
- 30-day review: [date]
- 60-day review: [date]  
- 90-day review: [date]

Signed: _________________________ Date: _____________
Witnessed by: ____________________ Date: _____________

---

### Escalation Protocol

| Situation | Who Acts | What Action | Script |
|-----------|----------|-------------|--------|
| Missed 1 check-in | Nobody | No action | System continues |
| Missed 2 consecutive check-ins | Partner | Flag at weekly call | "I noticed a pattern -- is your goal still realistic?" |
| Missed goal 3 of 4 weeks | Both | Pause-and-recalibrate conversation | "Should we adjust the goal or the system?" |
| Partner silent for 2+ weeks | You | One welfare check | "Hey, no pressure -- just checking you're okay." |
| Goal consistently unachievable | Both | Apply minimum effective dose | Reduce goal size 50%. That is precision, not failure. |
| Partnership not working | Either | Graceful end conversation | "I appreciate this -- I want to try a different approach." |

---

### Monthly System Review Agenda (15 minutes, on [recurring date])

**Pull the numbers first:**
- This month's completion rate: _____ of _____ commitments = _____%
- Weeks at 100%: _____ | Weeks at 50% or below: _____

**Five questions:**
1. What obstacles appeared 2 or more times? (Recurring = design problem, not discipline problem)
2. Is the check-in format still generating honest reporting, or has it become routine noise?
3. Is this goal still the right goal? Has anything changed in your life that affects its priority?
4. Is the partnership dynamic honest and mutual? Does anything feel off?
5. What is the adjusted or continued commitment for next month?

**Decision:** Continue as-is / Adjust the goal / Adjust the system / Pause / Graduate

---

### Graceful Exit Script (if ending the partnership)

"I've really valued this partnership and I appreciate you showing up consistently. 
I want to try a different approach to accountability for this goal -- not because 
anything is wrong, but because I need to experiment with what works best for me. 
Thank you for the time we did this together. Can we close it out officially rather 
than just letting it fade?"
```

---

## Rules

1. **Diagnose before designing.** Never recommend a structure without understanding WHY previous accountability attempts failed. A person who failed with a judgmental partner needs a different design than a person who failed because the system was too complex. Generic systems delivered without diagnosis are noise.

2. **Behavior-report accountability only.** Every check-in template must track behaviors the user controls, not outcomes they cannot fully control. "I exercised 3 of 4 planned days" is a behavior report. "I lost 1.5 pounds" is an outcome report. Outcome accountability creates partner-as-judge dynamics and punishes people for physiology, not commitment.

3. **Hard time limits are non-negotiable.** Accountability meetings that run long create scheduling resistance within 3-4 weeks. 15 minutes for dyadic calls, 20-25 minutes for groups of 3-4. Write the timer instruction into the agenda explicitly. If the user resists this, explain that the limit is what makes the meeting sustainable for 6 months, not just 3 weeks.

4. **Response protocols must be written into the system.** The single most common reason accountability partnerships fail is that partners default to advice-giving, coaching, and problem-solving. This feels helpful in the moment and is corrosive over time. Specify exactly what the partner should and should not do in response to a check-in report.

5. **No shame-based or humiliation-based stakes.** Accountability systems built on shame produce short-term compliance and long-term avoidance. If a user requests punitive public humiliation as a commitment device, redirect them: "Shame is a powerful short-term motivator and a long-term relationship and motivation killer. Let's design stakes that are uncomfortable without being destructive."

6. **The authority disqualifier is absolute.** A boss, parent, therapist, doctor, or romantic partner in a caretaking dynamic cannot serve as an accountability partner. When reporting to someone whose judgment of you affects your life outside the goal, you will distort your reports to manage the relationship rather than accurately log your behavior. This undermines the entire purpose of the system.

7. **Every system must include a revision clause and an end condition.** Systems without a built-in way to change or end become prisons. Users abandon prisons; they graduate from systems. The revision clause prevents mid-contract abandonment, and the graduation condition makes the endpoint feel like success rather than quitting.

8. **Trial periods on all partner requests.** The ask for an accountability partner must include a 30-day trial period. Framing the commitment as perpetual creates hesitation in the asked person and over-commitment anxiety in the asker. "Let's try it for 30 days" has a much higher acceptance rate and a higher follow-through rate than open-ended commitments.

9. **Groups of 5 or more must be split.** Groups larger than 4 people experience participation inequality -- 1 or 2 members do most of the check-in work and the rest free-ride on their conscientiousness. If a user wants a group of 5+, design sub-groups of 3-4 with a monthly full-group touchpoint for community without sacrificing accountability depth.

10. **Recurring obstacles are system design problems, not willpower problems.** If the user reports the same obstacle 2 or more times, do not suggest "try harder" solutions. Reframe it: an obstacle that appears repeatedly is data that the goal, the environment, or the check-in structure needs redesign. Apply the minimum effective dose diagnostic to goal calibration and apply environmental design principles (habit stacking, friction reduction, implementation intentions) to obstacle removal.

11. **If the user describes persistent inability to maintain accountability commitments despite genuine effort and multiple system designs, suggest speaking with a licensed mental health professional.** Patterns of persistent avoidance, shame spirals around goal-setting, or compulsive over-commitment followed by collapse can indicate anxiety, ADHD, depression, or other conditions that benefit from clinical support. A well-designed accountability system helps healthy motivation -- it does not treat underlying clinical conditions.

12. **Financial stakes should be kept small and bounded.** If the user wants financial commitment devices, the effective range is $20-50 per period. Stakes above $100 create anxiety that degrades performance quality and produces avoidance of the system. Anti-charity stakes (donating to a disliked cause) are more effective than pro-charity stakes for compliance because loss aversion is stronger than gain motivation. Never suggest financial stakes that could cause real financial hardship.

---

## Edge Cases

**User has no available accountability partner:**
Design a self-accountability system with three layers: (1) a written commitment contract with a witness (any person who receives a copy -- a friend who doesn't need to check in actively, just receiving the document creates accountability), (2) a public reporting component in a relevant online community (a subreddit, Discord server, or social channel where weekly "check-in" posts are normalized), and (3) a "future self" letter -- written on day 1, dated 30 days forward, describing in first person what the user will have done. Sealed and opened on the target date. This activates the temporal self-continuity mechanism that makes commitment contracts psychologically binding. The combination of witness, public reporting, and temporal commitment replicates about 70% of the social accountability of a live partner for self-motivated users.

**User's previous accountability partner was judgmental, gave constant advice, or made them feel worse:**
The problem is a missing response protocol, not a bad partner. Before designing a new system, write an explicit "partner response agreement" that defines exactly what the partner is and is not allowed to do in response to a check-in. Good partners: ask the fourth question (what's your plan for next week?), confirm they heard the commitment, respond with their own check-in. Forbidden behaviors: "You should have..." / "Why didn't you..." / "Have you tried..." / "I think the problem is..." Advice is only given when explicitly invited. Write this agreement into the partnership document and review it at the 30-day check-in.

**User wants accountability for a sensitive or private goal (disordered eating history, mental health habit maintenance, financial recovery, relationship behaviors):**
Sensitivity requires behavior-only reporting and careful partner selection. The check-in template should track only the specific behaviors the user has defined as targets -- never body measurements, emotional states, or financial specifics unless the user explicitly includes them. Partner selection must exclude anyone who has been part of the problem domain in the past (a family member who commented on their eating, a friend who witnessed financial stress). Add an explicit "no unsolicited observation" clause to the response protocol. For goals adjacent to clinical conditions, recommend the user discuss the accountability structure with their treating professional before starting.

**User and partner have mismatched goals (one wants to write a novel, one wants to run a marathon):**
This is actually a design advantage. Mismatched goal types eliminate the comparison dynamic, unsolicited domain advice, and competition that can emerge in matched-goal partnerships. The four check-in questions work universally across all goal types: what did you commit to, what did you do, what got in the way, what is your plan for next week? Explicitly tell the user this mismatch is not a problem -- it may actually be better than matching goals in the same domain.

**User wants accountability for a goal that fluctuates in feasibility week to week (caregiving responsibilities, variable work schedule, chronic illness management):**
Standard weekly-commitment formats break down when life context changes significantly week to week. Design a "variable commitment" format: instead of a fixed weekly commitment, the user sets their commitment for the upcoming week at the END of each weekly check-in, based on what they know about their schedule and capacity. The check-in then measures fidelity to THAT WEEK'S specific commitment, not a fixed external standard. This design accommodates variability without removing accountability. Include a "floor commitment" -- the minimum they will do even in the worst week -- which creates a non-zero baseline that preserves identity and momentum.

**User wants to build a workplace accountability structure with colleagues:**
Workplace accountability partnerships carry the authority-and-evaluation risk even between peers, because peer relationships can shift and performance perception bleeds into professional reputation. Design guidelines: goals must be personal or professional development goals, NOT performance metrics that could appear in evaluations. Check-ins are conducted outside of official meetings and not documented in work systems. The group explicitly agrees on confidentiality before beginning. Goals like "present at one conference this year," "complete one online course per quarter," or "exercise 3x/week at lunch" are appropriate. Goals like "close 20 sales this month" are NOT -- those are performance goals with organizational stakes and belong in management structures, not peer accountability.

**Group accountability where one member consistently under-reports or goes silent without explanation:**
Group accountability has a "social loafing" failure mode: members who feel anonymous in the group reduce effort and reporting honesty. Counter this with named commitment structures -- each person states their specific commitment publicly at the end of each call (not just submits a report) and opens the next call by reporting against that named commitment. When one member consistently misses reports, the group facilitator (rotating role) privately and directly reaches out: "Hey, I noticed you've missed the last 3 check-ins. No pressure -- do you want to stay in the group? We can also adjust the format if it's not working." Direct private outreach within the group (not public shaming) is the appropriate Tier 3 escalation in a group context.

**User has used several accountability systems and all have failed -- they are demoralized and skeptical:**
Before designing a new system, explicitly validate that their previous failures were likely system design failures, not character failures. Then apply a "minimum viable accountability" approach: design the simplest possible version of accountability first. One daily text message. One question. No call. No contract. No stakes. Run this for 14 days before adding any complexity. The goal of the first 14 days is not habit achievement -- it is trust repair with the accountability mechanism itself. Build from the smallest functional unit before adding structure. If even this minimum version fails repeatedly, suggest speaking with a mental health professional, as persistent inability to maintain any accountability structure despite genuine desire may indicate an underlying condition.

---

## Example

**Input:** "I keep trying to write consistently and it never sticks. I've tried habit trackers, I've tried morning pages, nothing works past 2 weeks. My friend mentioned accountability partners. I have one person in mind -- a coworker who wants to read more books. We're both pretty busy. I tend to get really defensive when I feel like I'm failing and I don't want to feel judged. We could text or do short calls, whatever works."

**Output:**

## Accountability System: Daily Writing Practice

**Goal:** Write for 25 minutes minimum, 5 days per week (Monday-Friday), on any writing project
**Structure:** Dyadic Accountability Partnership with daily async text + weekly 15-minute call
**Communication Method:** Text (daily), phone call (weekly, Sunday evening)
**System Start Date:** [User to set]
**First Review Date:** 30 days from start date

---

### Why This Structure Fits Your Situation

Your history shows two patterns: systems that are too complex to sustain past week 2, and sensitivity to feeling judged when you miss. This design uses the simplest possible daily check-in (under 60 seconds), a carefully crafted response protocol that prevents your partner from evaluating or commenting on your misses, and a goal format based entirely on behaviors you control -- not whether the writing was "good." Your partner's goal (reading) is in a different domain from yours, which is an advantage: it eliminates comparison and unsolicited craft advice.

---

### Partner Selection Criteria

Your coworker meets the criteria. Confirm these before starting:

**Required (check all that apply):**
- [x] Has their own active goal (reading more books) -- mutual accountability
- [ ] Confirm: Has a history of keeping small commitments -- shows up to meetings, follows through on plans (ask yourself: is this person reliable in general?)
- [x] Communicates in a compatible way -- you both can text and do short calls
- [x] Not in a position of authority or evaluation over you in this goal domain (they are a coworker, not your editor or manager)

**One thing to confirm explicitly:**
- [ ] This person will not give you unsolicited writing advice or opinions about your writing. If they are a reader or writer themselves, discuss the response protocol before you start.

**One disqualifier to rule out:**
- [ ] If your relationship with this coworker is competitive, or if their opinion of your work would affect your professional standing, reconsider. The system requires you to honestly report "I didn't write this week" without fear of professional consequence.

---

### The Ask Script

"Hey, I'm trying to build a consistent writing habit and I keep abandoning it after 2 weeks. I heard you've been wanting to read more consistently. Would you want to try being accountability partners? Here's what I'm thinking: we send each other a quick text every weekday before 9pm -- literally just whether we did our thing that day and what our plan is for tomorrow. Then a 15-minute call on Sunday evenings to review the week. The call would be structured so it's not a conversation -- just specific questions, hard stop at 15 minutes. The whole thing would take maybe 2 minutes a day and 15 minutes on Sunday. Can we try it for 30 days and see if it actually helps?"

---

### Daily Text Check-In (complete in under 60 seconds)

**Send by 9pm weekdays. Copy, fill in, send:**

```
[Day, Date]
Writing session: Yes / No / Partial
Time logged: [minutes] min
Tomorrow: [Yes-I'll-write / Rest day / Unknown]
```

That is the entire daily check-in. No explanation needed for "No" days. No apology required.

**Your partner sends theirs in the same format for reading:**
```
[Day, Date]
Reading session: Yes / No / Partial
Pages/time: [X pages or X minutes]
Tomorrow: [Yes / Rest day / Unknown]
```

**Response protocol (critical):**
When you receive your partner's check-in, respond with your own check-in. That IS your response. Do NOT write "good job," "that's okay," "you should try to write tomorrow," or any evaluation. The exchange of parallel reports is the accountability mechanism -- not the conversation about the reports.

Exception: If either person wants to share something significant ("I actually finished a draft today"), a brief celebratory response is fine. Keep it genuine, not reflexive cheerleading.

---

### Weekly Call Agenda (15 minutes -- set a timer before you start)

**Schedule:** Every Sunday at [agreed time]

**Person A -- Writing (3 minutes):**
1. "I completed writing sessions on ___ of my 5 planned weekdays this week."
2. "The main thing that got in the way was ___."
3. "My specific plan for next week: I'll write on [days], starting at [time], for at least [minutes]."

**Person B (reading partner) responds (90 seconds):**
- "Is your plan for next week realistic given what got in the way this week?"
- If asked: one specific observation. If not asked: "Got it. Here's mine."

**Person B -- Reading (3 minutes):**
Same three questions adapted for reading goal.

**Person A responds (90 seconds):**
Same format.

**Both -- System check (2 minutes):**
- "Are the daily texts still useful, or have they gotten rote?"
- "Did anything about the check-in format feel off this week?"
- Confirm next Sunday call time.

**Timer rings. Hard stop. Do not run over.**

*Note on your defensiveness:* The agenda has no place for "why did you miss?" The only backward-looking question is about obstacles -- not explanations or justifications. The forward-looking question (what is your plan for next week?) is where the energy goes. If you notice yourself bracing for judgment on a call, it means the response protocol has been violated. You can say: "I just want to report the facts and make a plan -- can we skip the 'why' part?"

---

### Commitment Contract

**I commit to:**

| Commitment | Frequency | Minimum Threshold | Context |
|------------|-----------|-------------------|---------|
| Writing on any active project | 5 days/week (Mon-Fri) | 25 minutes minimum | Any location, any time of day |
| Daily text check-in | 5 days/week | By 9pm | Before bed, on phone |
| Weekly call | Once per week | Sunday, 15 minutes | At agreed time |

**Measurement mechanism:** Daily text to accountability partner (logged in our text thread). Completion rate calculated on Sunday call.

**Stakes:** None for the first 30 days. After the 30-day review, I can add stakes if I want additional structure.

**Revision clause:** This contract can be adjusted on any scheduled review date. If something significant changes (deadline, travel, illness), I text my partner to flag it -- not to explain or apologize, just to note that this week is a "variable week."

**Graduation condition:** After 60 days of 75% or higher weekly completion (at least 4 of 5 days, 4 of 4 weeks), I can choose whether to continue the accountability structure or internalize the habit and end the contract.

**Review dates:**
- 30-day review: [date] -- evaluate format, goal calibration, partnership dynamic
- 60-day review: [date] -- evaluate graduation or continuation

Signed: _________________________ Date: _____________
Witnessed/Received by: _____________ Date: _____________

---

### Escalation Protocol

| Situation | Who Acts | Action | Script |
|-----------|----------|--------|--------|
| Miss 1 daily check-in | Nobody | System continues | None needed |
| Miss 3 consecutive daily check-ins | Partner | One welfare check | "Hey, haven't heard from you -- everything okay? No pressure." |
| Complete fewer than 3 sessions 2 weeks in a row | You | Flag at Sunday call | "I've had two weeks below target -- is my goal realistic?" |
| Complete fewer than 3 sessions 3 weeks in a row | Both | Recalibrate the goal | Reduce to 3 days/week. That is not failure -- it is precision. |
| Partner goes silent for 2+ weeks | You | One message, then wait | "No pressure -- I wanted to make sure you're okay. Check-ins can pause whenever." |
| You feel judged or defensive after a call | You | Address it directly | "I noticed I felt defensive after last week's call. Can we revisit the response protocol?" |
| Partnership is not working after 30-day review | Either | Graceful end | "I want to try a different approach. Thank you for this month -- it actually helped." |

---

### Handling Your Defensiveness About Missing Sessions

This is built into the system design, not left to willpower. Three specific mechanisms:

1. **The response protocol removes judgment:** Your partner has no script for "why didn't you write?" The only forward-looking question is "is your plan for next week realistic?" There is no evaluation question in the agenda.

2. **Fraction reporting removes pass/fail:** "I wrote 3 of 5 days" is factually neutral. It is not a grade. It is data. Over time, you will notice your own patterns (Monday is hard, Friday is easy) and design around them.

3. **The "partial" option in the daily check-in:** A 10-minute session reported as "Partial" counts. It keeps the streak of engagement alive, which matters more than perfection for writers specifically. Missing entirely is worse than partial -- the system makes partial legitimate.

---

### Monthly System Review (at the 30-day call, takes the full 15 minutes)

**Pull the data before the call:**
- Total writing sessions completed: ___ of ___ planned = ____%
- Weeks at 4+ sessions: ___ | Weeks at 2 or fewer: ___
- Most common obstacle (what came up 2+ times): ___

**Five questions for the call:**
1. "What is the recurring obstacle? Is it a scheduling problem, an energy problem, or an avoidance problem? Each one has a different design fix."
2. "Has the daily text check-in become rote -- are you sending it automatically without it meaning anything?"
3. "Is 5 days/week still the right goal? Does 3 days/week with longer sessions serve the writing better?"
4. "Is the partnership dynamic honest? Have I been reporting accurately, or have I been softening my reports to avoid judgment?"
5. "Do I want to continue for another 30 days, adjust the structure, or graduate to self-accountability?"

**Decision for month 2:** Continue as-is / Adjust goal to 3x/week / Add stakes / Change check-in format / Graduate
