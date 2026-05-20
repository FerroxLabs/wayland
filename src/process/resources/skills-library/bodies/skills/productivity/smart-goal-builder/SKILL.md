---
name: smart-goal-builder
description: |
  Transforms vague aspirations into SMART goals with Specific criteria,
  Measurable metrics, Attainability assessment, Relevance check, and
  Time-bound deadlines with interim milestones. Use when the user has a
  goal idea but it lacks clarity, wants to turn a wish into an actionable
  plan, or needs to define measurable success criteria for a personal
  objective. Do NOT use for organizational goal setting (use business strategy
  skills), habit formation or behavior change coaching (use health-wellness
  skills), or OKR creation (use `okr-builder` instead).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "goal-setting planning template"
  category: "productivity"
  subcategory: "goal-setting"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Smart Goal Builder

## When to Use

Use this skill when the user presents a personal objective that lacks the precision required for reliable execution. Specific trigger scenarios:

- The user states a desire using vague language: "I want to get better at...", "I should probably start...", "My goal this year is to...", "I've been meaning to...", "I really need to work on..."
- The user knows their destination but cannot describe what arrival looks like -- they have a direction but no finish line
- The user has a goal but no metric to track progress, making it impossible to know if they are on course or falling behind
- The user sets a deadline ("by the end of the year") without working backward to identify what pace that requires or whether that pace is achievable
- The user's stated goal has previously stalled or been abandoned and they want to restart with more structure
- The user asks "how do I make my goal more concrete?" or "how do I actually stick to a goal?"
- The user wants to commit to a personal development objective -- learning a skill, completing a project, improving a health marker, building a creative body of work -- and wants accountability scaffolding built in

**Do NOT use when:**
- The user wants to set goals for a team, department, or organization -- use a business strategy or team planning skill instead
- The user wants to build a repeating behavior or daily habit (flossing, exercise, meditation) -- this skill targets achievement goals, not process goals; use a habit-formation skill for the latter
- The user wants to create Objectives and Key Results with a 0-to-1.0 scoring system and grading rubrics -- use `okr-builder` instead, which handles multi-key-result structures and quarterly grading
- The user wants to plan an entire quarter or year with 5-10 prioritized goals -- use `quarterly-planning` instead, which manages goal portfolios and resource allocation across multiple objectives
- The user wants to set a group norm or social commitment with shared accountability -- the SMART framework is designed for individual agency, not collective ownership
- The user is in active crisis or facing a mental health challenge where goal-setting would be premature -- refer to supportive listening first

---

## Process

### Step 1: Extract and Preserve the Raw Aspiration

Before applying any filter, capture exactly what the user said and understand the emotional and motivational context behind it.

- Record the user's exact words verbatim -- this becomes the "before" in the Before & After comparison and serves as proof of transformation
- Identify the aspiration type: achievement goal (complete something), performance goal (reach a level), learning goal (acquire knowledge or skill), or avoidance goal (stop doing something harmful) -- the type affects how you measure success
- Note the urgency signals in their language: "I've been putting this off for years" signals a history of inaction; "my boss mentioned..." signals external pressure; "I've always wanted to..." signals intrinsic motivation -- these inform the Relevant and Attainable assessments
- If the user provides context about why this goal matters now, capture that -- it becomes the core of the Relevance justification
- Do not correct, reframe, or judge the aspiration at this stage -- just receive it and reflect it back to confirm you understood it correctly
- If the aspiration is ambiguous between two very different goals ("I want to get fit" could mean weight loss, endurance, strength, or flexibility), ask one clarifying question before proceeding

### Step 2: Apply the Specific Filter

Transform the aspiration from a fuzzy direction into a concrete, bounded statement of intended outcome.

- Replace vague verbs with outcome verbs: "get better at" becomes "produce," "deliver," "complete," or "achieve"; "lose weight" becomes "reduce body weight to X pounds"; "learn Python" becomes "build a functioning web scraper in Python"
- Define the scope using the four boundary questions: What exactly? (the deliverable or outcome), Who is involved? (self-only or others), Where does this happen? (context that constrains or enables), Which conditions or constraints apply? (budget, format, medium, audience)
- Eliminate hedge words: "try to," "hopefully," "sort of," "kind of," "more or less" -- a specific goal has no hedges
- Write the specific goal as a single sentence beginning with an action verb: "Complete...", "Deliver...", "Reach...", "Produce...", "Reduce...", "Earn..."
- Check for compound goals -- if the sentence has "and" connecting two different outcomes, split them into two separate goals and build each one independently
- Confirm the specificity with the precision test: if two different people read your goal statement, they should independently agree on whether it was achieved or not -- if they might disagree, it is not yet specific enough

### Step 3: Apply the Measurable Filter

Every goal needs a single primary metric, a baseline, a target, and a method for counting.

- Select the primary metric type that best matches the goal:
  - **Count:** Number of things produced, delivered, or completed (e.g., 12 blog posts, 6 presentations, 3 certifications)
  - **Quantity with unit:** Physical measurement with a specific unit (e.g., body weight in pounds, savings balance in dollars, running distance in miles)
  - **Percentage or ratio:** A rate, proportion, or score (e.g., 80% on an exam, 4.2/5.0 average rating, 95% task completion rate)
  - **Binary completion:** A defined deliverable that either exists or does not (e.g., "portfolio website is live," "book manuscript is complete")
  - **Frequency:** How often something happens over a period (e.g., 3 times per week consistently for 12 weeks)
- Establish the baseline: where is the user right now on this metric? Zero is a valid baseline but must be stated explicitly. If the baseline is unknown, define how the user will establish it in the first 48 hours
- Set the target value: the specific number, level, or state that constitutes goal completion
- Calculate the gap: target minus baseline -- this is the total quantity of work the goal requires
- Define the tracking method: how will the metric be measured and recorded? Self-report is valid but requires a defined recording habit. Third-party measurement (test scores, app data, financial statements) is more reliable when available
- Identify secondary metrics (2 maximum) that give early warning signals if the primary metric is off track -- these are leading indicators, not success criteria
- Apply the measurement sanity check: if the user cannot realistically collect this measurement without excessive overhead, choose a simpler proxy metric

### Step 4: Apply the Attainable Filter

This is the filter most often skipped, and its absence is the primary reason goals fail. Conduct a genuine resource audit.

- Inventory what the user already has: time available per week dedicated to this goal, existing knowledge or skill level (beginner / intermediate / advanced), tools and materials already owned or accessible, support network (coaches, mentors, accountability partners, communities)
- Inventory what is missing: skills that must be acquired before meaningful progress can begin, financial cost of the goal and whether it is budgeted, time commitments that will compete with this goal
- Apply the stretch level classification:
  - **Easy (avoid):** Requires no change in behavior or minimal effort -- achievable in half the allotted time. Raise the target.
  - **Moderate (ideal):** Requires consistent effort and some behavior change but is achievable by someone with similar resources given adequate focus. This is the target zone.
  - **Aggressive (acceptable with caveats):** Requires near-perfect execution, no major disruptions, and significant sacrifice. Flag the conditions under which this becomes unrealistic and identify the fallback threshold.
  - **Unrealistic (reframe):** Depends on outcomes the user cannot influence, requires resources they cannot obtain, or exceeds what any comparable person has achieved in the same timeframe without extraordinary circumstances. Reframe toward controllable inputs.
- List every external dependency -- people who must cooperate, institutional decisions that must go a certain way, resources that must remain available. Each dependency is a risk; name it here and address it in the Risk Factors section
- Check for precedent: has the user done something comparably difficult before? Have others in similar circumstances achieved this? Precedent is the strongest evidence of attainability
- If the goal is a repeat attempt after a previous failure, explicitly ask what stopped progress last time and build that failure point into the Attainable assessment and the milestone plan's risk mitigation

### Step 5: Apply the Relevant Filter

A goal that is achievable but misaligned with the user's real priorities will be abandoned as soon as life gets busy. This filter tests alignment and trade-off awareness.

- Ask the "so that" question: complete the sentence "I want this goal so that..." -- the answer should connect to a value, identity, or life priority that the user genuinely holds. If they cannot complete the sentence, the goal may be externally imposed rather than intrinsically motivated
- Identify the priority category the goal serves: career advancement, financial security, health and longevity, relationships and community, creative fulfillment, knowledge and learning, or personal autonomy -- naming the category helps the user see the goal in context
- State the opportunity cost explicitly: pursuing this goal at the required pace will take X hours per week away from something else. Name what that something else is, even if it is rest or leisure -- making the trade-off visible prevents the cognitive dissonance that causes abandonment
- Apply the "right now" test: even if this goal is abstractly good, is this the right moment to pursue it? If the user is in the middle of a move, a major work crunch, or a family transition, flag the timing and either adjust the timeline or recommend deferring
- Identify the "so what" of achievement: what will be materially or meaningfully different in the user's life when this goal is complete? A goal whose completion changes nothing is a candidate for elimination
- Check for external pressure: if the goal is entirely driven by what someone else thinks the user should do, note this. Externally imposed goals without internal buy-in have dramatically lower completion rates

### Step 6: Apply the Time-bound Filter

Deadlines do two things: they create urgency, and they allow backward calculation of required pace. Both are essential.

- Set the final deadline using one of three methods:
  - **Natural deadline:** An external date that creates a real consequence (exam date, conference presentation, product launch, fiscal year end)
  - **Committed deadline:** A date the user publicly commits to and ties to a consequence (telling someone else, scheduling a review meeting, making a deposit)
  - **Calculated deadline:** Work backward from the gap and realistic pace -- if the gap is 20 training sessions and the user can realistically fit 3 per week, the minimum timeline is 7 weeks; add a 15-20% buffer for disruptions
- Calculate the required pace: gap divided by available weeks. State this as a rate: "X units per week" or "X sessions per month." If this rate requires more than 80% of the user's stated available time for this goal, the timeline is too aggressive or the target too high
- Build four milestone checkpoints at 25%, 50%, 75%, and 100% of the timeline. Each milestone must be a measurable state of the world, not an activity reminder:
  - Bad: "Check in on progress on March 1"
  - Good: "8 of 20 training sessions completed and logged by March 1"
- Identify the "point of no return" milestone -- the checkpoint at which missing it signals the final deadline is no longer achievable and a recalibration is needed. This is typically the 50% checkpoint
- Set a first action within 48 hours that requires no prerequisites, costs the user nothing but 15-30 minutes of time, and creates visible evidence of commitment (a registration, a booking, a message sent, a first entry in a tracking log)
- Build in review dates -- these are separate from milestones and are about process: "Is the tracking system working? Is the pace realistic? Does anything need to change?" Schedule one review at the 25% mark and one at the 50% mark

### Step 7: Compile the SMART Goal Document

Assemble all components into the structured output format.

- Write the SMART goal statement as a single sentence that embeds all five components: it should be possible to parse Specific, Measurable, Attainable, Relevant, and Time-bound from the statement itself without needing to consult the breakdown table
- Complete the SMART breakdown table with full detail in each cell -- no component should contain a single word; each should contain a substantive analysis
- Build the milestone table with all five rows (first action, 25%, 50%, 75%, complete) and populate every column including the check-in action
- Complete the tracking setup section with tool-specific guidance -- if the user has indicated what tools they use, align the tracking method to those tools
- Complete the risk table with at minimum one internal risk (motivational, time, competing priority) and one external risk (dependency, resource, circumstance)
- Write the First 48-Hour Action as a single, atomic, named task -- not a category of action but a specific action: not "sign up for a course" but "open Coursera, search for 'Python for Beginners', and enroll in the top-rated free course before 8pm tonight"
- Review the assembled document and check: does anything in the milestone plan depend on the user doing something outside their control? If so, flag it in the risk table

---

## Output Format

```
## SMART Goal

### Before & After

**Original aspiration:** "[User's exact words, preserved verbatim]"
**Aspiration type:** [Achievement / Performance / Learning / Avoidance]
**SMART goal:** "[Single sentence: Action verb + specific outcome + measurable target + timeframe]"

---

### SMART Breakdown

| Component | Assessment |
|-----------|-----------|
| **Specific** | [What exactly will be accomplished. Outcome verb. Scope defined. Compound goals separated. No hedges.] |
| **Measurable** | Primary metric: [metric name and unit]. Baseline: [current value or "0 -- not started"]. Target: [goal value]. Gap: [target minus baseline]. Tracking method: [tool and recording habit]. Secondary indicators: [1-2 leading indicators] |
| **Attainable** | Resources available: [time per week, existing skills, tools, support]. Resources needed: [gaps to fill and how]. Stretch level: [Easy / Moderate / Aggressive -- with justification]. Precedent: [comparable achievement by self or others]. Dependencies: [external factors, or "none"]. |
| **Relevant** | Priority category: [Career / Financial / Health / Creative / Learning / Other]. So that: [completed "so that" statement]. Opportunity cost: [hours per week + what is traded off]. Right-now test: [timing assessment]. Impact of achievement: [what changes when done]. |
| **Time-bound** | Deadline: [specific date]. Duration: [X weeks from today]. Required pace: [gap ÷ weeks = X units per week or per month]. Pace feasibility: [% of available time this represents -- flag if > 80%]. Point-of-no-return milestone: [the 50% checkpoint date and what must be true]. |

---

### Milestone Plan

| Milestone | Target Date | Success Criteria | Check-in Action |
|-----------|------------|-----------------|-----------------|
| **First action** | Within 48 hours | [Specific, atomic task completed -- names the deliverable] | -- |
| **25% checkpoint** | [Date] | [Metric value at 25% of gap, e.g., "5 of 20 sessions complete"] | Review pace. If behind, identify the bottleneck and adjust schedule for next period |
| **50% checkpoint** | [Date] | [Metric value at 50% of gap] | Point-of-no-return assessment: is the final deadline still achievable? Adjust deadline or target if not |
| **75% checkpoint** | [Date] | [Metric value at 75% of gap] | Final push plan: what needs to happen in the last quarter to close the gap? |
| **Goal complete** | [Deadline date] | [Full success criteria: primary metric at target, secondary indicators checked] | Document what worked, what did not, and what the next goal will be |

---

### Tracking Setup

- **Primary metric:** [Metric name] measured in [unit]
- **Baseline:** [Value on start date]
- **Tracking frequency:** [After each event / Daily / Weekly -- choose the most granular that is sustainable]
- **Tracking tool:** [Specific tool recommendation aligned to user's context: spreadsheet with named columns, app name, journal format, calendar event]
- **Log format:** [Describe exactly what gets recorded at each tracking instance, e.g., "Date | Sessions this week | Cumulative total | Notes on quality"]
- **Review cadence:** [Weekly self-review + formal milestone check-ins on the dates above]

---

### Risk Register

| Risk | Type | Likelihood | Mitigation |
|------|------|-----------|------------|
| [Internal risk: motivation, time conflict, competing priority] | Internal | [Low / Medium / High] | [Specific contingency, not generic advice] |
| [External risk: dependency, resource, circumstance] | External | [Low / Medium / High] | [Specific contingency] |
| [Execution risk: tracking failure, preparation gap, knowledge barrier] | Execution | [Low / Medium / High] | [Specific contingency] |

---

### First 48-Hour Action

**This is your activation step -- do it before [specific day and time, e.g., "by 8pm Thursday"]:**

[Single, named, atomic action. Begins with a verb. Specifies exactly what to open, search, message, schedule, or create. Takes no more than 30 minutes. Produces visible evidence of commitment.]

**Why this matters:** [One sentence explaining how this action sets the chain in motion]
```

---

## Rules

1. **Never skip the Before & After.** The verbatim original aspiration and the transformed SMART goal must both appear. The contrast demonstrates the value of the process and gives the user a clear reference point for how their vague idea became an actionable commitment.

2. **One primary metric per goal, exactly.** If the user's goal seems to require two metrics to define success, you have two options: identify which metric is the true definition of done and relegate the other to a secondary indicator, or split the goal into two separate SMART goals. Never build a goal with two co-equal primary metrics -- it makes success ambiguous.

3. **Milestones must be measurable states, not scheduled activities.** "Review progress on April 1" is a reminder, not a milestone. A milestone answers the question: what must be observably true about the world by this date? Express every milestone as a noun phrase: "8 of 20 sessions complete," "$2,400 saved," "draft chapters 1 through 3 finished."

4. **The Attainable assessment must be honest, not encouraging.** If a goal has a dependency the user cannot control, name it explicitly as an external dependency and frame the goal around the controllable inputs only. Do not reframe an unrealistic goal as "aggressive but doable" simply to avoid discouraging the user.

5. **Calculate pace before confirming the deadline.** Never accept a user-stated deadline without dividing the gap by the available time and checking whether the resulting pace is feasible. If the pace requires more than 80% of the user's stated available time for this goal, flag it and either extend the deadline, reduce the target, or increase the available time.

6. **The first action must be a zero-prerequisite task.** It must require no purchases, approvals, or prior completions. It must take 15-30 minutes maximum. It must produce a tangible artifact: a sent message, a completed registration, a created document, a logged first entry. "Think about your approach" is never a valid first action.

7. **Risk factors must be specific, not generic.** "Life gets busy" is not a risk. "User has two work travel weeks in March that will eliminate 6 of the 8 sessions required in that milestone period" is a risk. Tailor every risk to what is actually true about this user's situation.

8. **Never conflate achievement goals and habit goals.** An achievement goal has a finish line: "complete 10 chapters." A habit goal has a maintenance standard: "write 500 words every day." This skill handles achievement goals. If the user's aspiration is genuinely about building a sustained behavior rather than reaching a finish line, route them to a habit-formation skill and explain why.

9. **The Relevant filter must name what the user is trading away.** Every goal has an opportunity cost measured in hours per week. Identify what the user will do less of to make time for this goal. State it directly: "Pursuing this goal at 4 hours per week means 4 fewer hours of [TV, leisure, other projects] each week." Invisible trade-offs become unconscious resentments that kill goal adherence.

10. **If the user's goal has failed before, address the prior failure point explicitly in the plan.** Do not rebuild the same structure over a known fault line. Ask what specifically stopped progress last time. If they ran out of motivation at week 3, the 25% milestone check-in must include a specific motivation maintenance strategy. If they ran out of time, the schedule must be more conservative. Repeating the same plan after a failure and expecting a different result is a failure of the process.

11. **Do not combine multiple aspirations into one SMART goal.** If the user says "I want to get fit, start a side business, and read more books," these are three separate goal-setting exercises. Build them individually. If they want all three, apply the Multiple Competing Goals edge case protocol to help them prioritize before building.

12. **The SMART goal sentence must be self-contained.** A reader with no context should be able to read the single SMART goal sentence and understand what success looks like, when it occurs, and approximately how it will be measured. Test it: read the sentence aloud and ask whether it passes the "two strangers agree on whether it happened" test.

---

## Edge Cases

**The aspiration is already partly specific.** Some users arrive with a goal that is already clear on two or three SMART dimensions but missing others. When this happens, do not force artificial elaboration on the dimensions that are already solid -- acknowledge what is already clear, then focus analytical energy on the missing pieces. Typically, an already-specific goal is missing Measurable (no metric defined), Time-bound (no deadline), or Attainable (no resource audit). Produce the full output format regardless, but make the existing strong dimensions brief and the weak dimensions thorough.

**Goal depends substantially on external factors.** "Get promoted," "win the pitch," "get accepted to the program," "have my manager approve the project" -- these goals have outcomes the user does not control. The correct response is not to reject the goal but to reframe it around the controllable inputs that maximize the probability of the desired outcome. Decompose the external outcome into the internal actions that drive it: "Get promoted" becomes "Complete the Python certification, lead three cross-functional projects, and have a documented performance conversation with my manager every 6 weeks between now and the Q4 review cycle." Note the dependency in the Attainable section, state explicitly that the final outcome is not within the user's unilateral control, and frame the goal around the inputs they own.

**The goal timeline is extremely long (2+ years).** Long-horizon goals suffer from the planning fallacy -- the future is unknowable enough that a 2-year milestone plan is largely fiction. Handle these by breaking the long-horizon goal into annual chapters. Build a complete SMART framework only for Year 1. Sketch Year 2 and beyond as directional intent with explicit triggers that will prompt replanning ("After completing Year 1, reassess the 5-year goal in light of what changed"). This prevents the false security of a detailed long-term plan and builds in appropriate recalibration points.

**The user is attempting a goal they have failed at previously.** This is a high-stakes case -- rebuilding the same structure over a known failure point virtually guarantees a third failure. Before building the SMART framework, conduct a brief post-mortem: "What specifically happened? At what point did progress stop? What was the reason -- external event, motivation drop, time crunch, missing skill, unclear path?" Once the failure point is identified, build the mitigation directly into the milestone plan at the point where failure previously occurred. If they always quit at week 4, the 25% milestone must include a specific anti-quit mechanism: an accountability partner check-in, a pre-committed reward, or a scheduled reflection on why the goal matters.

**The user presents 3 or more goals simultaneously.** Multiple concurrent goals compete for the same finite resource -- the user's time and attention. Research on goal pursuit consistently shows that pursuing more than 2 demanding goals simultaneously reduces achievement rates for all of them due to attention and willpower fragmentation. When the user presents a portfolio of goals, apply the priority triage: score each goal on impact (how much will achieving this change my life?) and urgency (what is the cost of waiting 3-6 months?). Recommend a maximum of 2 active SMART goals at once. Build full SMART frameworks for the top 2 and place the rest in an explicit "next in queue" holding list with target start dates tied to completion of the first goals.

**The goal involves acquiring a skill where the user cannot yet measure quality.** A beginner cannot accurately self-assess whether their writing, code, or design is improving, because they lack the reference frame to evaluate it. In these cases, use a proxy metric that does not require quality judgment: count outputs (not "write well" but "complete 20 essays"), use structured external feedback (workshop scores, peer review ratings, automated tools), or define a quality gate using a third-party standard (pass a graded assessment, get accepted to a juried show, receive a professional review). The proxy metric substitutes for a quality judgment the user cannot yet reliably make.

**The user's goal is an avoidance goal ("stop doing X").** Goals framed around stopping a behavior are harder to measure and track than approach goals because absence is hard to count. Reframe avoidance goals as approach goals wherever possible: "Stop procrastinating" becomes "Complete the three most important tasks on my list before noon each workday"; "Stop overspending" becomes "Spend no more than $X in category Y per week, tracked weekly." If an avoidance goal cannot be reframed, use a frequency metric with a downward trajectory: "Reduce unplanned social media sessions from 12 per day to 3 per day over 8 weeks" -- baseline and target are both measurable, and the gap is tracked as a decreasing count.

---

## Example

**User input:** "I want to finally write a book. I've had this idea for years but never actually started."

---

## SMART Goal

### Before & After

**Original aspiration:** "I want to finally write a book. I've had this idea for years but never actually started."
**Aspiration type:** Achievement goal (binary completion + milestone-based output)
**SMART goal:** "Complete a 60,000-word first draft of my non-fiction book on personal finance for recent graduates, writing at least 500 words per weekday, by October 31."

---

### SMART Breakdown

| Component | Assessment |
|-----------|-----------|
| **Specific** | Write a complete first draft of a non-fiction book -- defined as a beginning-to-end manuscript covering all planned chapters in sequence, not a collection of notes or fragments. Format: prose chapters, not outlines. Medium: personal finance guidance for an audience of recent college graduates. A "first draft" means every chapter has been written through once; it does not need to be polished or edited. |
| **Measurable** | Primary metric: Total word count of draft manuscript. Baseline: 0 words written (confirmed -- not started). Target: 60,000 words (standard non-fiction book length -- typical range is 50,000-80,000 words for this genre). Gap: 60,000 words. Tracking method: Daily word count logged in a writing app (Scrivener or a Google Doc with a running total). Secondary indicators: (1) Chapters outlined and locked (leading indicator of draft readiness -- target: full chapter outline complete by end of Week 1); (2) Consecutive writing days without a break longer than 4 days (adherence indicator). |
| **Attainable** | Resources available: 45-60 minutes on weekday mornings before work (confirmed available); laptop and Google Docs (accessible); subject matter expertise in personal finance (user's stated background); no dependent requiring morning coverage. Resources needed: Chapter outline before writing begins (1-2 hours, completable this week); a distraction-blocking tool for writing sessions (free tools: Cold Turkey, Freedom); familiarity with book structure norms (recommend reading one book on non-fiction craft, e.g., "Bird by Bird" or "On Writing Well"). Required pace: 500 words per weekday x ~5 days per week = 2,500 words per week x 24 weeks = 60,000 words. At an average writing session of 45 minutes, 500 words requires approximately 20-25 minutes for an experienced writer at first-draft pace -- well within the stated time window. Stretch level: Moderate. The pace is sustainable; the primary risk is consistency over 24 weeks, not physical output on any single day. Precedent: 60,000 words in 24 weeks is a standard NaNoWriMo-type pace (NaNoWriMo targets 50,000 in 30 days -- this is more generous). Many first-time authors complete drafts at this pace or slower. Dependencies: No external approvals required for a first draft. The user controls all inputs. |
| **Relevant** | Priority category: Creative fulfillment + career/expertise positioning. So that: "...I can establish myself as a credible voice in personal finance, contribute something useful to people who didn't have financial guidance when they graduated, and prove to myself that I can complete a long creative project." Opportunity cost: 45 minutes per weekday x 5 days = 3.75 hours per week redirected from morning leisure, news browsing, or extra sleep. The user should decide consciously whether this trade is worth it -- 3.75 hours per week over 24 weeks is 90 hours total. Right-now test: The user has had this idea for "years" -- delay has not resolved itself. No stated competing life event in the next 6 months. Timing is appropriate. Impact of achievement: A complete first draft that can be edited, submitted to agents or publishers, or self-published -- none of which are possible without a completed draft. |
| **Time-bound** | Deadline: October 31 (24 weeks from today, assuming a May start). Duration: 24 weeks. Required pace: 2,500 words per week (500 words x 5 weekdays). Pace feasibility: At 45 minutes per session, producing 500 words requires approximately 20-25 minutes for a first draft, leaving buffer within the writing window. The pace represents less than 50% of the user's stated available daily time, making it feasible even with minor disruptions. Point-of-no-return milestone: 30,000 words by July 31 (the 50% checkpoint). If fewer than 25,000 words are written by July 31, the October 31 deadline requires renegotiation. |

---

### Milestone Plan

| Milestone | Target Date | Success Criteria | Check-in Action |
|-----------|------------|-----------------|-----------------|
| **First action** | Within 48 hours | Chapter outline written: all planned chapters listed with a 2-3 sentence description of what each chapter covers | -- |
| **25% checkpoint** | June 28 (Week 6) | 15,000 words written and logged; at least 3 full chapters drafted through; no chapter gap longer than 4 consecutive missed days | Review word count log. If behind by more than 2,000 words, add one weekend writing session per week for the next 4 weeks to recover |
| **50% checkpoint -- point of no return** | July 31 (Week 12) | 30,000 words written; first half of chapters drafted; writing habit established with fewer than 5 missed weekdays in the period | Assess whether October 31 is still achievable. If word count is below 25,000, extend deadline to December 15 and adjust pace. Do not keep an unreachable deadline. |
| **75% checkpoint** | September 13 (Week 18) | 45,000 words written; all chapters started; no chapter remaining entirely blank | Identify any chapters that are significantly shorter or weaker than expected and schedule targeted sessions to close gaps before the final push |
| **Goal complete** | October 31 | 60,000-word first draft complete: all planned chapters written through once, beginning to end, with no chapter placeholders or blank sections | Print the word count total. Celebrate. Then schedule a 2-week rest period before beginning revision planning. Document: which writing habits worked, which days/times were most productive, what the next phase requires. |

---

### Tracking Setup

- **Primary metric:** Cumulative word count of manuscript
- **Baseline:** 0 words on start date
- **Tracking frequency:** Daily -- log word count at the end of each writing session
- **Tracking tool:** Google Sheets with the following columns: Date | Day of Week | Session Word Count | Cumulative Total | Chapter Written | Notes. Set up a running chart in the same sheet showing cumulative words vs. target trajectory (a straight line from 0 on Day 1 to 60,000 on October 31) -- visual gap between actual and target is the most powerful early warning signal
- **Log format:** One row per writing day. Example entry: "May 7 | Tuesday | 612 words | 1,204 total | Chapter 2 -- Budgeting | Wrote slowly, good flow after first 10 minutes"
- **Review cadence:** 5-minute self-review every Sunday evening: Did I hit this week's 2,500-word target? Am I above or below the trajectory line? What is my plan for next week? Formal milestone check-ins on the four dates above.

---

### Risk Register

| Risk | Type | Likelihood | Mitigation |
|------|------|-----------|------------|
| Motivation drops after the initial excitement fades (typically weeks 3-6, a well-documented pattern in long creative projects) | Internal | High | At the Week 6 milestone, schedule a deliberate "why this matters" reflection before reviewing word count. Keep a sticky note at the writing station with the completed "so that" statement. If motivation drops, lower the session target to 250 words rather than skipping -- partial sessions beat zero sessions. |
| A chapter topic proves harder to write than anticipated, creating a multi-day block | Execution | Medium | Never skip a chapter to write ahead -- this creates a growing debt of blank sections. If a chapter is blocked, use the "ugly first draft" technique: write a deliberately terrible version of the chapter in one sitting, minimum 300 words, no editing. The ugly draft gives the next session something to fix rather than nothing to start. |
| Major life disruption (travel, illness, family event) breaks the writing streak for 5+ days | External | Medium | Identify in advance the 3 most likely disruption periods in the next 24 weeks (holidays, known travel, etc.) and pre-schedule "make-up weekends" immediately following each. A 5-day gap requires 2,500 missed words to be recovered at a rate of 500 extra words over the following 5 days -- entirely manageable if caught immediately. |
| The chapter outline proves inadequate mid-draft, stalling writing | Execution | Medium | Treat the outline as a living document, not a contract. Allocate 10 minutes at the end of each week to update it for upcoming chapters based on what has been learned in the draft so far. A revised outline is not failure; it is the normal evolution of a book. |

---

### First 48-Hour Action

**Do this before [tonight or tomorrow evening at 9pm]:**

Open a new Google Doc titled "Book Outline -- [Your Book Title]." Write the working title at the top. Below it, list every chapter you plan to write -- even roughly -- with a 2-3 sentence description of what each chapter covers and what the reader will understand by the end of it. Do not worry about perfect order or completeness. This outline does not need to be final. It needs to exist.

**Why this matters:** Every writing session you will ever have on this book begins with the question "what do I write next?" A chapter outline answers that question before the session starts, eliminating the blank-page paralysis that has stalled this project for years. This single document transforms the project from an idea to a plan with named parts.
