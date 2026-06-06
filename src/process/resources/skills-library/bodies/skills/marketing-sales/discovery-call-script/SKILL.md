---
name: discovery-call-script
description: |
  Produces a structured discovery call script with opening, SPIN-based
  questions, qualification checks, and closing next steps. Use when the
  user asks to create a discovery call script, prepare questions for a
  sales discovery meeting, build a first-call framework, write qualifying
  questions for prospects, or structure a consultative sales conversation.
  Do NOT use for cold outreach emails (use cold-outreach-sequence),
  objection handling scripts (use objection-handling), or customer
  research interviews (use customer-discovery-interview).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "sales planning template strategy"
  category: "marketing-sales"
  subcategory: "sales"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Discovery Call Script

## When to Use

- User asks to create a discovery call script or first-call framework
- User wants to prepare questions for a sales discovery meeting
- User needs a structured approach to qualifying prospects on a first call
- User asks to build SPIN-based questions for a consultative sales conversation
- User wants to improve discovery calls to uncover real buyer pain and urgency
- Do NOT use when: user needs cold outreach emails (use `cold-outreach-sequence`), objection handling during a deal (use `objection-handling`), or customer research interviews for product development (use `customer-discovery-interview`)

## Process

1. **Collect discovery context.** Before producing the script, gather:
   - Product or service being sold
   - Target buyer profile (title, industry, company size)
   - Typical deal size and sales cycle length
   - Top 3 problems the product solves
   - Common triggers that cause a prospect to take a discovery call
   - What a qualified prospect looks like (budget, authority, need, timeline)
   - Desired call outcome (schedule demo, send proposal, start trial)

2. **Structure the call framework.** Map the call into timed sections:
   - **Opening (2-3 minutes):** Set the agenda, build rapport, confirm time
   - **Situation questions (3-5 minutes):** Understand current state
   - **Problem questions (5-7 minutes):** Uncover pain points and gaps
   - **Implication questions (5-7 minutes):** Quantify the cost of the problem
   - **Need-payoff questions (3-5 minutes):** Guide buyer to articulate the value of solving
   - **Qualification check (2-3 minutes):** Confirm budget, authority, timeline
   - **Close and next steps (2-3 minutes):** Propose specific next action

3. **Write the opening script.** Create the first 2-3 minutes:
   - Thank them for their time and confirm the meeting duration
   - Set the agenda: "I would like to learn about your situation, share how we help teams like yours, and if it makes sense, discuss next steps."
   - Ask permission: "Does that work for you? Is there anything specific you want to make sure we cover?"
   - Transition to discovery: use an open-ended question tied to the trigger that booked the call

4. **Write SPIN questions for each section.** For each question type:
   - **Situation questions:** Factual questions about their current state (team size, tools, process, metrics). Use 3-4 questions maximum -- too many feels like interrogation.
   - **Problem questions:** Probe for gaps, frustrations, and limitations in their current approach. 4-6 questions targeting specific pain points the product solves.
   - **Implication questions:** Help the buyer quantify the cost of the problem -- time, money, risk, opportunity cost. 3-5 questions that make the status quo feel expensive.
   - **Need-payoff questions:** Guide the buyer to describe what a solution would look like for them. 2-4 questions that let the buyer sell themselves on solving the problem.

5. **Add qualification checkpoints.** Build in checks for:
   - **Budget:** "Do you have budget allocated for solving this, or would this need to be a new request?"
   - **Authority:** "Who else would need to be involved in evaluating a solution like this?"
   - **Need:** "On a scale of 1-10, how urgent is solving this for your team right now?"
   - **Timeline:** "If you found the right solution, when would you ideally want to have it in place?"

6. **Write the closing script.** Create the last 2-3 minutes:
   - Summarize what you heard (reflect their pain in their words)
   - Propose a specific next step with a date and time
   - Confirm who should be in the next meeting
   - Send a follow-up email within 1 hour summarizing the conversation

## Output Format

```
## Discovery Call Script: [Product/Service]

**Target Buyer:** [Title at company type]
**Call Duration:** [X minutes]
**Desired Outcome:** [Demo / Proposal / Trial]
**Date:** [Date]

### Call Flow Overview

| Section | Duration | Objective | Key Questions |
|---------|----------|-----------|---------------|
| Opening | 2-3 min | Set agenda, build rapport | 1 agenda question |
| Situation | 3-5 min | Understand current state | 3-4 fact-finding questions |
| Problem | 5-7 min | Uncover pain | 4-6 problem-probing questions |
| Implication | 5-7 min | Quantify the cost | 3-5 implication questions |
| Need-Payoff | 3-5 min | Buyer articulates value | 2-4 need-payoff questions |
| Qualification | 2-3 min | Confirm fit | Budget, authority, timeline |
| Close | 2-3 min | Propose next step | 1 specific ask |

---

### Opening (2-3 minutes)

**Script:**

"Thank you for taking the time today, [Name]. I have us down for [X] minutes -- does that still work? Great. Here is what I was thinking: I would love to learn about how your team handles [problem area] today, share a few things we have seen work for teams like yours, and if it makes sense, talk about a logical next step. Does that work? Is there anything you want to make sure we cover?"

**Transition Question:** "[Name], what prompted you to take this call today?"

---

### Situation Questions (3-5 minutes)

**Purpose:** Understand the buyer's current state without interrogating.

1. "[Situation question 1 -- current process/tools]"
2. "[Situation question 2 -- team size/structure]"
3. "[Situation question 3 -- current metrics/results]"
4. "[Situation question 4 -- recent changes or triggers]"

**Listening for:** [What signals indicate a qualified prospect]

---

### Problem Questions (5-7 minutes)

**Purpose:** Uncover specific pain points and frustrations.

1. "[Problem question 1 -- biggest challenge with current approach]"
2. "[Problem question 2 -- what is not working as well as it should]"
3. "[Problem question 3 -- specific gap the product addresses]"
4. "[Problem question 4 -- impact on the team]"
5. "[Problem question 5 -- what they have tried before]"
6. "[Problem question 6 -- what would need to change]"

**Listening for:** [Pain signals that map to the product's value]

---

### Implication Questions (5-7 minutes)

**Purpose:** Help the buyer quantify the cost of not solving the problem.

1. "[Implication question 1 -- time cost]"
2. "[Implication question 2 -- financial cost]"
3. "[Implication question 3 -- risk or downside]"
4. "[Implication question 4 -- opportunity cost]"
5. "[Implication question 5 -- team morale or retention impact]"

**Listening for:** [Quantifiable pain -- hours, dollars, percentage, frequency]

---

### Need-Payoff Questions (3-5 minutes)

**Purpose:** Guide the buyer to describe their ideal outcome.

1. "[Need-payoff question 1 -- what would solving this mean for you]"
2. "[Need-payoff question 2 -- if you could wave a magic wand, what would change]"
3. "[Need-payoff question 3 -- how would your team benefit]"
4. "[Need-payoff question 4 -- what would success look like in 6 months]"

**Listening for:** [Buyer describing the value in their own words]

---

### Qualification Check (2-3 minutes)

| Factor | Question | Qualified Signal | Disqualified Signal |
|--------|----------|-----------------|-------------------|
| Budget | "Do you have budget allocated for this?" | Yes or "we can find it" | "No budget this year" |
| Authority | "Who else would evaluate this?" | "I can decide" or names 1-2 people | Vague or "lots of people" |
| Need | "On a scale of 1-10, how urgent is this?" | 7+ | Below 5 |
| Timeline | "When would you want this in place?" | Within [X] months | "No rush" |

---

### Closing (2-3 minutes)

**Summary Script:**

"[Name], here is what I am hearing: [reflect their pain in their words]. You are currently [situation], and the main challenge is [problem], which is costing you [implication]. If you could [need-payoff], that would [their stated benefit]. Did I capture that correctly?"

**Next Step Script:**

"Based on what you have shared, I think the best next step would be [specific action -- demo, proposal, technical review]. I can have [deliverable] ready by [date]. Would [specific day and time] work to [next meeting purpose]? And would it make sense to include [stakeholder they mentioned]?"

**Follow-Up Commitment:** "I will send you a recap email within the hour with [summary + next step + any materials promised]."

---

### Post-Call Checklist

- [ ] Send follow-up email within 1 hour
- [ ] Update your CRM with call notes and next steps
- [ ] Log qualification status (budget, authority, need, timeline)
- [ ] Share relevant materials mentioned during the call
- [ ] Schedule the next meeting with calendar invite
- [ ] Brief any colleagues joining the next meeting
```

## Rules

1. NEVER produce a discovery script without first collecting product, buyer profile, and key problems solved
2. ALWAYS structure questions using the SPIN framework: Situation, Problem, Implication, Need-payoff -- in that order
3. Situation questions must be limited to 3-4 maximum -- too many feels like an interrogation and wastes time
4. Problem questions must target specific pain points the product addresses, not generic business challenges
5. Implication questions must help the buyer quantify the cost in time, money, risk, or opportunity cost
6. Need-payoff questions must let the buyer articulate the value -- the rep does not pitch during this section
7. The opening must set an agenda and ask permission before diving into questions
8. The close must propose a specific next step with a date and time, not "I will follow up"
9. Include a qualification check for budget, authority, need, and timeline -- do not skip any factor
10. Every question must be written as a complete, word-for-word script the rep can read, not a topic label

## Edge Cases

- **First call from an inbound lead (they requested the meeting):** Shorten situation questions -- they already know their problem. Open with "What prompted you to reach out?" and spend more time on implication and need-payoff questions. The discovery is about depth, not breadth.
- **Prospect is a champion (not the decision maker):** Add questions about the decision process, key stakeholders, and what success looks like for the economic buyer. The qualification section should focus on mapping the buying committee rather than confirming budget authority.
- **Very short call (15 minutes):** Compress to 3 sections: opening (1 minute), 5-6 combined problem and implication questions (10 minutes), and close (4 minutes). Skip situation questions entirely -- do pre-call research instead. Every question must do double duty.
- **Enterprise deal with multiple stakeholders:** Include role-specific question variants for different personas (CFO, CTO, end user). The same problem sounds different depending on who you ask. Prepare 2-3 question tracks and choose based on who shows up.
- **Prospect is evaluating competitors:** Add competitive differentiation questions: "What criteria are most important in your evaluation?" and "What has stood out so far in your research?" Do not disparage competitors -- focus on understanding their decision criteria so you can position against it.

## Example

**Input:** "Create a discovery call script for our HR software. We sell to HR Directors at companies with 100-500 employees. The software automates onboarding, PTO tracking, and performance reviews. Main problems we solve: manual onboarding takes too long, PTO tracking is error-prone, and performance reviews happen inconsistently. Average deal is $20K/year."

**Output:**

## Discovery Call Script: [Product] HR Platform

**Target Buyer:** HR Director at companies with 100-500 employees
**Call Duration:** 30 minutes
**Desired Outcome:** Schedule a personalized demo
**Date:** [Current date]

---

### Opening (2-3 minutes)

**Script:**

"Thank you for taking the time today, [Name]. I have us down for 30 minutes -- does that still work? Great. Here is what I was thinking: I would love to learn about how your HR team manages onboarding, time off, and reviews today, share a few things we have seen work for HR teams your size, and if it makes sense, talk about a logical next step. Does that work? Is there anything you want to make sure we cover?"

**Transition Question:** "[Name], what prompted you to take this call today? Was there something specific that made you start looking at HR platforms?"

---

### Situation Questions (3-5 minutes)

1. "How many employees do you have right now, and how many new hires do you bring on in a typical quarter?"
2. "Walk me through your current onboarding process -- what tools or systems do you use today?"
3. "How does your team currently track PTO requests and balances?"
4. "How often do performance reviews happen, and what is the process for running them?"

**Listening for:** Manual processes, spreadsheets, inconsistency, growing pains

---

### Problem Questions (5-7 minutes)

1. "What is the most time-consuming part of onboarding a new hire today?"
2. "When PTO tracking goes wrong -- wrong balances, missed requests, policy violations -- how often does that happen?"
3. "How consistently do performance reviews actually happen on schedule across your managers?"
4. "What do new hires tell you about their onboarding experience? Are there common complaints?"
5. "If you had to point to the one HR process that takes the most of your team's time relative to its value, which would it be?"

**Listening for:** Time wasted on manual tasks, errors in PTO, inconsistent reviews, new hire frustration

---

### Implication Questions (5-7 minutes)

1. "When onboarding takes [X weeks] instead of [ideal], what impact does that have on time-to-productivity for new hires?"
2. "How much time does your team spend each month manually reconciling PTO balances or fixing errors?"
3. "When performance reviews slip or happen inconsistently, what effect does that have on employee retention or engagement?"
4. "If you add up the hours your team spends on onboarding paperwork, PTO administration, and review coordination -- what does that look like per month?"
5. "Have you ever had a compliance issue related to PTO tracking or documentation gaps? What did that cost?"

**Listening for:** Hours per month on manual work, compliance risk, retention impact, new hire ramp time

---

### Need-Payoff Questions (3-5 minutes)

1. "If onboarding were fully automated and a new hire could complete everything before day one, what would that free your team up to focus on?"
2. "If PTO tracking were error-free and self-service, how would that change your team's workload?"
3. "What would it mean for your organization if every manager ran consistent, on-time performance reviews without HR having to chase them?"

**Listening for:** Strategic HR work they want to do but cannot because of administrative burden

---

### Qualification Check (2-3 minutes)

| Factor | Question | Qualified Signal |
|--------|----------|-----------------|
| Budget | "Do you have budget set aside for an HR platform, or would this be a new request?" | Budget exists or "we could make a case for it" |
| Authority | "If you found the right solution, who else would need to be involved in the decision?" | HR Director decides or names 1-2 specific people |
| Need | "On a scale of 1-10, how urgent is solving the onboarding and PTO problem for your team right now?" | 7+ |
| Timeline | "If you found the right platform, when would you ideally want it live?" | Within 3 months |

---

### Closing (2-3 minutes)

**Summary Script:**

"[Name], here is what I am hearing: your team is growing and onboarding [X] new hires per quarter, but the process is mostly manual and takes [X] of your team's time. PTO tracking has had accuracy issues, and performance reviews are not happening as consistently as you would like. If you could automate those three workflows, your team could focus on [what they said during need-payoff]. Did I capture that correctly?"

**Next Step Script:**

"Based on what you have shared, I think the best next step would be a 30-minute personalized demo where I can show you exactly how [Product] handles onboarding automation, PTO self-service, and review workflows for teams your size. Would [specific day] at [specific time] work? And would it make sense to include [stakeholder they mentioned]?"
