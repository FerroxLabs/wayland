---
name: okr-builder
description: |
  Builds personal OKR sets with one objective and 2-4 measurable key results,
  a 0.0-1.0 scoring rubric, tracking cadence, and grading template. Use when
  the user wants to define personal objectives with quantifiable results,
  create a scoring system for their goals, or structure ambitions using the
  OKR framework. Do NOT use for organizational or team OKRs (use business
  strategy skills), simple single-metric goals (use `smart-goal-builder`),
  or full quarterly plans with multiple goals (use `quarterly-planning`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "goal-setting planning template"
  category: "productivity"
  subcategory: "goal-setting"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Personal OKR Builder

## When to Use

- User wants to create objectives with measurable key results for personal goals
- User asks for help using the OKR framework for individual goal setting
- User wants to build a scoring system for tracking goal progress
- User needs to define clear, quantifiable outcomes for an ambitious objective
- User mentions OKRs, objectives and key results, or wants a structured goal framework with scoring
- Do NOT use when the user needs organizational, team, or company OKRs (use business strategy skills instead)
- Do NOT use when the user wants a single measurable goal without key results (use `smart-goal-builder` instead)
- Do NOT use when the user wants a multi-goal quarterly plan (use `quarterly-planning` instead)
- Do NOT use when the user wants habit tracking (use `habit-tracker-design` instead)

## Process

1. **Clarify the objective.** Ask the user what they want to achieve. Then refine it:
   - An objective must be qualitative and inspirational -- it describes the destination, not the metric
   - It must be achievable within the time period (default: one quarter, 13 weeks)
   - It must be within the user's influence (not dependent on factors they cannot control)
   - Rewrite the user's input as a clear, motivating objective statement
   - Test: can someone read this objective and understand what success looks like without seeing the key results? If yes, it is too specific (belongs as a key result). If no, it is the right level of abstraction

2. **Define 2-4 key results.** For each key result:
   - Start with a verb (increase, reduce, complete, achieve, deliver, launch)
   - Include a specific metric with a starting value and target value
   - The key result must be objectively verifiable -- no judgment calls needed to determine if it was met
   - Each key result should measure a different dimension of the objective (not the same metric stated differently)
   - At least one key result should be a leading indicator (measures activity/input) and at least one should be a lagging indicator (measures outcome)
   - Key results should be ambitious: the target for a score of 1.0 should feel like a stretch

3. **Build the 0.0-1.0 scoring rubric.** For each key result, define the grading scale:
   - **0.0:** No progress or negligible effort
   - **0.3:** Meaningful attempt but fell significantly short of target
   - **0.5:** Achieved roughly half the target -- respectable progress
   - **0.7:** Achieved most of the target -- strong performance (this is the expected landing zone for well-set OKRs)
   - **1.0:** Target fully met or exceeded -- exceptional result
   - Map specific metric values to each score level
   - Note: if a key result consistently scores 1.0, it was set too conservatively. If consistently 0.3, it was unrealistic

4. **Set the tracking cadence.** Define how and when progress is measured:
   - **Check-in frequency:** Weekly is standard for personal OKRs
   - **Tracking method:** Where the user records progress (spreadsheet, journal, app)
   - **Scoring frequency:** Monthly interim scoring to catch off-track key results early
   - **Final grading:** End of the OKR period (default: end of quarter)

5. **Define the OKR health indicators.** Set up early warning signals:
   - For each key result, define the "on track" threshold at the 1/3 mark and 2/3 mark of the time period
   - If a key result falls below the on-track threshold, the user should take action: increase effort, change approach, or revise the key result (with a note explaining why)
   - Define what "at risk" looks like for each key result

6. **Create the grading template.** Pre-build the end-of-period evaluation:
   - Individual key result scores
   - Weighted objective score (average of key result scores)
   - Interpretation guide: what the overall score means
   - Reflection questions for each key result
   - Decision: continue, modify, or retire the objective for the next period

## Output Format

```
## Personal OKR: [Quarter/Period]

### Objective

**[Objective statement -- qualitative, inspirational, achievable within the period]**

**Time period:** [Start date] - [End date] ([X] weeks)
**Check-in cadence:** [Weekly/Biweekly]
**Scoring cadence:** [Monthly interim, final at end of period]

---

### Key Results

#### KR1: [Key Result statement with metric and target]

**Type:** [Leading indicator / Lagging indicator]
**Baseline:** [Current value]
**Target:** [Goal value]

| Score | Metric Value | Description |
|-------|-------------|-------------|
| 0.0 | [value] | [what this means] |
| 0.3 | [value] | [what this means] |
| 0.5 | [value] | [what this means] |
| 0.7 | [value] | [what this means] |
| 1.0 | [value] | [what this means] |

**On-track checkpoints:**
- By week [X]: [threshold value] or higher
- By week [Y]: [threshold value] or higher

---

#### KR2: [Key Result statement with metric and target]

[Same structure as KR1]

---

#### KR3: [Key Result statement with metric and target]

[Same structure as KR1]

---

### Weekly Tracking Sheet

| Week | KR1 Value | KR2 Value | KR3 Value | Notes |
|------|-----------|-----------|-----------|-------|
| 1 | | | | |
| 2 | | | | |
| ... | | | | |
| 13 | | | | |

---

### Grading Template (Complete at End of Period)

**Period:** [dates]
**Grading date:** [date]

| Key Result | Final Value | Score (0.0-1.0) | Notes |
|------------|------------|-----------------|-------|
| KR1: [name] | [value] | [score] | [context] |
| KR2: [name] | [value] | [score] | [context] |
| KR3: [name] | [value] | [score] | [context] |

**Overall Objective Score:** [average of KR scores]

**Score interpretation:**
- 0.0-0.3: Objective not achieved. Major recalibration needed.
- 0.4-0.6: Partial progress. Decide: continue with adjusted KRs or pivot objective.
- 0.7-0.8: Strong performance. This is the healthy target zone. Continue or level up.
- 0.9-1.0: Fully achieved. Were the KRs ambitious enough? Set harder targets next period.

**Reflection:**
1. Which key result am I most proud of? Why?
2. Which key result fell shortest? What blocked it?
3. Would I set the same objective again? What would I change?
4. **Next period decision:** [ ] Continue this OKR with updated KRs [ ] Modify the objective [ ] Retire and set a new objective
```

## Rules

1. Never allow more than 4 key results per objective -- focus is the point of OKRs; more than 4 dilutes attention
2. Every key result must have a numeric target that can be scored without subjective judgment
3. The 0.0-1.0 scoring rubric must have specific metric values at each level, not vague descriptions
4. At least one key result must be a leading indicator (measures effort/activity) and at least one must be a lagging indicator (measures outcome/result)
5. Key results that consistently score 1.0 indicate the target was too easy -- note this in the output as a calibration warning
6. The objective must be qualitative and inspirational. If it contains a number, it is a key result, not an objective
7. On-track checkpoints must be defined for the 1/3 and 2/3 marks of the time period
8. Never combine two metrics in one key result ("increase X and decrease Y" is two key results, not one)
9. The grading template must be pre-built at OKR creation time, not created retroactively
10. Include a "next period decision" prompt in the grading template -- OKRs should inform the next cycle, not just evaluate the current one

## Edge Cases

- **User's goal does not fit the OKR format (too small or too vague):** If the goal is a single task (e.g., "finish this report"), it does not need OKRs -- redirect to `smart-goal-builder`. If the goal is too vague to define key results (e.g., "be happier"), help the user decompose it into observable, measurable dimensions first.

- **User wants personal OKRs but works in a company that also uses OKRs:** Clarify scope. Personal OKRs track individual life goals, not work performance. If the user wants alignment between personal and work OKRs, note the connection but build the personal OKR independently. Work OKRs should use business strategy skills.

- **All key results are lagging indicators:** Push back. At least one must be a leading indicator (effort metric) because lagging indicators only tell you whether you succeeded after the fact. Leading indicators let you adjust mid-period. Example: "Revenue" is lagging; "sales calls made per week" is leading.

- **User wants more than one objective:** Build separate OKR sets for each objective. Recommend a maximum of 3 simultaneous objectives per quarter for individuals. If more than 3, help the user prioritize and defer some to the next period.

- **User is new to OKRs and sets conservative targets:** Encourage stretching. OKRs are designed so that scoring 0.7 is a success. If the user sets targets they are certain to hit, the OKR is not ambitious enough. Guide them to set the 1.0 target at a level that feels uncomfortable but not impossible.

## Example

**Input:** "I want to become a strong technical writer. I write documentation at work but it is not great. I want to build this skill over the next quarter."

**Output:**

## Personal OKR: Q2 2026 (April 1 - June 30)

### Objective

**Become a confident, skilled technical writer who produces clear documentation that colleagues actively reference and recommend.**

**Time period:** April 1 - June 30 (13 weeks)
**Check-in cadence:** Weekly (Sunday evening)
**Scoring cadence:** Monthly interim (May 1, June 1), final grading June 30

---

### Key Results

#### KR1: Complete 8 technical writing exercises from a structured curriculum (leading indicator)

**Type:** Leading indicator (measures effort/skill-building activity)
**Baseline:** 0 exercises completed
**Target:** 8 exercises completed

| Score | Metric Value | Description |
|-------|-------------|-------------|
| 0.0 | 0 exercises | Did not engage with skill-building at all |
| 0.3 | 2 exercises | Started but did not sustain the practice |
| 0.5 | 4 exercises | Completed half -- meaningful engagement |
| 0.7 | 6 exercises | Strong commitment, most exercises done |
| 1.0 | 8 exercises | Full curriculum completed as planned |

**On-track checkpoints:**
- By week 4: 2 exercises completed or higher
- By week 9: 5 exercises completed or higher

---

#### KR2: Rewrite 5 existing work documents and receive feedback rating of 4/5 or higher on clarity (lagging indicator)

**Type:** Lagging indicator (measures quality improvement in real work)
**Baseline:** Current documentation clarity is unrated; informal feedback suggests "hard to follow"
**Target:** 5 documents rewritten with average clarity rating of 4.0/5.0 from reviewers

| Score | Metric Value | Description |
|-------|-------------|-------------|
| 0.0 | 0 documents rewritten | Did not apply skills to real work |
| 0.3 | 1-2 documents, rating below 3.5 | Some effort but quality not yet improved |
| 0.5 | 3 documents, average rating 3.5/5 | Meaningful improvement, halfway to target |
| 0.7 | 4 documents, average rating 3.8/5 | Strong output, nearing quality target |
| 1.0 | 5 documents, average rating 4.0/5+ | Full target met -- clear, reference-quality docs |

**On-track checkpoints:**
- By week 4: 1 document rewritten and reviewed
- By week 9: 3 documents rewritten, average rating 3.5+ from reviewers

---

#### KR3: Reduce average "time to first draft" for new documentation from 4 hours to 2 hours (lagging indicator)

**Type:** Lagging indicator (measures efficiency improvement)
**Baseline:** Average 4 hours to produce first draft of a new technical document
**Target:** Average 2 hours per first draft (measured over last 3 documents of the quarter)

| Score | Metric Value | Description |
|-------|-------------|-------------|
| 0.0 | 4+ hours average | No improvement in speed |
| 0.3 | 3.5 hours average | Marginal speed improvement |
| 0.5 | 3 hours average | 25% faster -- meaningful gain |
| 0.7 | 2.5 hours average | 37% faster -- strong improvement |
| 1.0 | 2 hours average | 50% faster -- target achieved |

**On-track checkpoints:**
- By week 4: Next document drafted in under 3.5 hours
- By week 9: Average of last 2 documents under 3 hours

---

### Weekly Tracking Sheet

| Week | KR1: Exercises Done (cumulative) | KR2: Docs Rewritten (cumulative) | KR3: Last Draft Time (hours) | Notes |
|------|----------------------------------|----------------------------------|------------------------------|-------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | Checkpoint: week 4 review |
| 5 | | | | |
| 6 | | | | |
| 7 | | | | |
| 8 | | | | |
| 9 | | | | Checkpoint: week 9 review |
| 10 | | | | |
| 11 | | | | |
| 12 | | | | |
| 13 | | | | Final grading |

---

### Grading Template (Complete June 30)

**Period:** Q2 2026 (April 1 - June 30)
**Grading date:** _______________

| Key Result | Final Value | Score (0.0-1.0) | Notes |
|------------|------------|-----------------|-------|
| KR1: Writing exercises | ___/8 | ___ | |
| KR2: Docs rewritten (avg rating) | ___/5 (___/5.0) | ___ | |
| KR3: Avg draft time | ___ hours | ___ | |

**Overall Objective Score:** ___ (average of 3 KR scores)

**Score interpretation:**
- 0.0-0.3: Technical writing skill did not materially improve. Major recalibration needed.
- 0.4-0.6: Some improvement visible. Continue with adjusted key results next quarter.
- 0.7-0.8: Strong skill development. Writing is noticeably clearer and faster. Level up next quarter.
- 0.9-1.0: Exceptional quarter. Were the targets ambitious enough? Set harder KRs.

**Reflection:**
1. Which key result am I most proud of? Why?
2. Which key result fell shortest? What blocked it?
3. Would I set the same objective again? What would I change?
4. **Next period decision:** [ ] Continue this OKR with updated KRs [ ] Modify the objective [ ] Retire and set a new objective
