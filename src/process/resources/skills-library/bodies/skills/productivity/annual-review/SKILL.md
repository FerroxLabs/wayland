---
name: annual-review
description: |
  Runs a structured annual review including achievement audit, theme
  identification, lesson extraction, and 12-month forward projection. Use
  when the user wants to reflect on the past year, identify patterns in their
  accomplishments and failures, extract lessons learned, or plan the year
  ahead. Do NOT use for business annual reviews or performance evaluations
  (use business HR skills), quarterly planning (use `quarterly-planning`),
  or single-goal assessment (use `smart-goal-builder` instead).
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

# Annual Review

## When to Use

- User wants to reflect on and review their past year
- User is planning for the upcoming year and wants to build on last year's lessons
- User asks for a structured year-end review process
- User wants to identify themes, patterns, or lessons from the past 12 months
- User wants to do a personal end-of-year retrospective
- Do NOT use when the user needs a business performance review or employee evaluation (use business HR skills instead)
- Do NOT use when the user wants to plan just one quarter (use `quarterly-planning` instead)
- Do NOT use when the user wants to set a single goal (use `smart-goal-builder` instead)
- Do NOT use when the user wants to track or set OKRs (use `okr-builder` instead)

## Process

1. **Conduct the achievement audit.** Ask the user to catalog what happened in the past year across life areas:
   - **Career/work:** Promotions, projects completed, skills learned, milestones reached
   - **Health/fitness:** Physical changes, habits built, health improvements
   - **Relationships:** New connections, deepened relationships, social milestones
   - **Learning:** Courses, books, certifications, skills acquired
   - **Financial:** Savings, debts paid, income changes, financial milestones
   - **Personal projects:** Creative work, side projects, hobbies pursued
   - **Travel/experiences:** Trips, events, memorable experiences
   - For each item, note: what happened, when, and how it made the user feel

2. **Catalog the unfinished and abandoned.** Equally important as achievements:
   - What goals were set but not completed?
   - What projects were started but abandoned?
   - What was planned but never begun?
   - For each: why did it stall? (lost interest, ran out of time, deprioritized, blocked by external factors)
   - No judgment -- this data informs the forward plan

3. **Extract the year's themes.** Look across all achievements and unfinished items for patterns:
   - **Energy theme:** What types of activities energized the user vs. drained them?
   - **Growth theme:** What was the dominant growth direction? (career, health, relationships, skills)
   - **Challenge theme:** What recurring obstacles appeared? (time scarcity, motivation, external dependencies)
   - **Surprise theme:** What unexpected events or outcomes shaped the year?
   - Name each theme with a short phrase (e.g., "The year of career reinvention" or "Health became a priority")

4. **Extract lessons learned.** For each significant achievement and each significant failure or abandonment:
   - What worked that should be repeated?
   - What did not work that should be avoided?
   - What would the user do differently with the benefit of hindsight?
   - Compile into a numbered list of personal lessons, each stated as an actionable principle

5. **Rate the year.** Create a structured assessment:
   - Overall satisfaction (1-10 scale with specific descriptors for each level)
   - Per-area rating (career, health, relationships, learning, financial, personal -- each 1-10)
   - Highlight the best single moment and the hardest single moment
   - Identify the single biggest accomplishment and the single biggest regret

6. **Build the 12-month forward projection.** Using the review data:
   - **Continue:** What from this year should carry forward? (habits, projects, relationships)
   - **Start:** What new goals or areas should the user pursue based on themes and lessons?
   - **Stop:** What should the user deliberately stop doing? (draining activities, unproductive habits, goals that no longer align)
   - **Quarterly allocation:** Rough assignment of goals to quarters (not detailed plans -- that is what `quarterly-planning` is for)
   - **Annual success criteria:** What would make next year a 9/10 or 10/10?

7. **Compile the annual review document.** Assemble all components into the output format for the user to keep as a reference.

## Output Format

```
## Annual Review: [Year]

### Achievement Audit

#### Career & Work
| Achievement | When | Impact |
|-------------|------|--------|
| [item] | [month] | [what it meant] |

#### Health & Fitness
| Achievement | When | Impact |
|-------------|------|--------|
| [item] | [month] | [what it meant] |

#### Relationships & Social
| Achievement | When | Impact |
|-------------|------|--------|
| [item] | [month] | [what it meant] |

#### Learning & Growth
| Achievement | When | Impact |
|-------------|------|--------|
| [item] | [month] | [what it meant] |

#### Financial
| Achievement | When | Impact |
|-------------|------|--------|
| [item] | [month] | [what it meant] |

#### Personal Projects & Experiences
| Achievement | When | Impact |
|-------------|------|--------|
| [item] | [month] | [what it meant] |

---

### Unfinished & Abandoned

| Item | Status | Reason |
|------|--------|--------|
| [goal/project] | Unfinished / Abandoned / Never started | [why it stalled] |

---

### Year Themes

| Theme | Pattern | Evidence |
|-------|---------|----------|
| [theme name] | [what pattern was observed] | [specific examples from the year] |

---

### Lessons Learned

1. [Lesson stated as an actionable principle]
2. [Lesson stated as an actionable principle]
3. [Lesson stated as an actionable principle]
4. [Lesson stated as an actionable principle]
5. [Lesson stated as an actionable principle]

---

### Year Rating

**Overall satisfaction:** [X]/10

| Area | Rating | Notes |
|------|--------|-------|
| Career | [X]/10 | [brief note] |
| Health | [X]/10 | [brief note] |
| Relationships | [X]/10 | [brief note] |
| Learning | [X]/10 | [brief note] |
| Financial | [X]/10 | [brief note] |
| Personal | [X]/10 | [brief note] |

**Best moment:** [description]
**Hardest moment:** [description]
**Biggest accomplishment:** [description]
**Biggest regret:** [description]

---

### 12-Month Forward Projection: [Next Year]

#### Continue (keep doing)
- [activity/habit/project to maintain]

#### Start (new for next year)
- [new goal or area to pursue]

#### Stop (deliberately eliminate)
- [activity or pattern to drop]

#### Quarterly Rough Allocation

| Quarter | Focus Areas | Key Goals |
|---------|------------|-----------|
| Q1 | [areas] | [1-2 goals] |
| Q2 | [areas] | [1-2 goals] |
| Q3 | [areas] | [1-2 goals] |
| Q4 | [areas] | [1-2 goals] |

#### Annual Success Criteria

Next year is a 9/10 or 10/10 if:
1. [measurable criterion]
2. [measurable criterion]
3. [measurable criterion]
```

## Rules

1. Never skip the unfinished and abandoned section -- incomplete goals contain as much learning as completed ones
2. Every lesson learned must be stated as an actionable principle ("Schedule creative work before email, not after") not a vague observation ("Time management is important")
3. The achievement audit must cover at least 4 different life areas to prevent a career-only review
4. Year themes must be supported by at least 2 specific examples from the achievement or unfinished lists
5. Ratings must use a 1-10 scale with specific descriptors -- never leave the rating as a pure number without context
6. The forward projection must include at least one "Stop" item -- every year has activities worth eliminating
7. Annual success criteria must be measurable. "Have a great year" is not a criterion. "Complete 3 major projects, read 20 books, and exercise 200 days" is a criterion
8. Do not provide motivational commentary or cheerleading. Present the data, extract the patterns, state the lessons. The user's emotions about the year are their own
9. Quarterly rough allocation must remain high-level -- detailed quarterly plans use the `quarterly-planning` skill
10. Both best moment and hardest moment must be identified -- a review that only celebrates successes misses the learning in difficulty

## Edge Cases

- **User had a very difficult year (job loss, health crisis, major setback):** Adjust the framing. The achievement audit may be sparse -- that is acceptable. Focus the themes section on resilience patterns and coping strategies that worked. Reframe the forward projection around recovery and rebuilding. Reduce the expected goal count for next year.

- **User cannot remember what happened during the year:** Provide memory prompts by quarter. Ask about January-March events, then April-June, and so on. Suggest checking: calendar entries, photo library (sorted by month), email sent folder, social media posts, bank statements (purchases trigger memories), and completed task lists.

- **User is doing their first annual review ever:** Add context-setting: explain that the first review is always the hardest because there is no comparison point. The forward projection is the most valuable output because it creates the baseline for next year's review. Suggest a simpler format for the first attempt: just achievements, lessons, and forward plan.

- **User had an extraordinarily successful year:** Guard against complacency in the forward projection. The lessons section should still identify what almost went wrong, what luck contributed to success, and what cannot be relied upon again. The forward plan should include at least one stretch goal that pushes beyond this year's ceiling.

- **User wants to review only one life area (e.g., career only):** Accommodate the narrower scope but note what is missing. A career-only review is valid, but flag that career decisions affect health, relationships, and finances. Suggest considering at least one adjacent area in the forward projection.

## Example

**Input:** "I want to do my year-end review for 2025. It was a mixed year -- I changed jobs, started running, read a bunch, but also dropped my side project and gained weight in the second half. I want to figure out what to focus on next year."

**Output:**

## Annual Review: 2025

### Achievement Audit

#### Career & Work
| Achievement | When | Impact |
|-------------|------|--------|
| Left previous job and accepted new role | May | Major career shift, 20% salary increase, new industry |
| Completed onboarding and passed probation | August | Established at new company, positive first review |
| Led first project at new company | November | Built credibility with new team |

#### Health & Fitness
| Achievement | When | Impact |
|-------------|------|--------|
| Started running program (Couch to 5K) | February | Completed 5K in April, best cardio fitness in years |
| Ran first 10K | June | Proved commitment to running beyond the initial program |

#### Learning & Growth
| Achievement | When | Impact |
|-------------|------|--------|
| Read 18 books (12 non-fiction, 6 fiction) | Year-round | Deepened knowledge in leadership and systems thinking |
| Completed online UX design course | March | Added design thinking skills to toolkit |

#### Financial
| Achievement | When | Impact |
|-------------|------|--------|
| Negotiated 20% salary increase with job change | May | Significant income improvement |
| Maxed out retirement contributions | December | On track for long-term financial goals |

---

### Unfinished & Abandoned

| Item | Status | Reason |
|------|--------|--------|
| Side project (newsletter) | Abandoned in July | Job transition consumed all creative energy; deprioritized after missing 4 weeks |
| Running routine | Declined Sept-Dec | Shorter daylight hours + job stress led to skipping runs; gained back 8 lbs |
| Spanish learning goal | Never started | Planned for Q3 but job ramp-up took priority |

---

### Year Themes

| Theme | Pattern | Evidence |
|-------|---------|----------|
| Career reinvention | The job change dominated the year, redirecting energy from personal projects to professional establishment | Job search (Jan-Apr), onboarding (May-Aug), proving ground (Sep-Dec) |
| Second-half energy crash | Strong starts in H1 faded in H2 as the new job consumed bandwidth | Running, side project, and reading all declined after August |
| Learning compounds | Knowledge from books and UX course directly improved work performance at new role | Leadership books informed management approach; UX course helped in product discussions |

---

### Lessons Learned

1. Major life transitions (job changes) have a 6-month energy tax -- plan for reduced personal capacity during transitions, not normal capacity
2. Running routine survived only when it was a morning habit before work; evening runs were the first casualty of busy days
3. Side projects need protected time on the calendar, not leftover time -- leftover time is always zero during transitions
4. Reading habit persisted because it was attached to a daily ritual (30 min before bed) -- the habit anchor is what kept it alive
5. Negotiating salary at job change was the highest-ROI activity of the year -- 2 hours of preparation yielded a permanent 20% increase

---

### Year Rating

**Overall satisfaction:** 7/10

| Area | Rating | Notes |
|------|--------|-------|
| Career | 9/10 | Successful transition, strong start at new role |
| Health | 5/10 | Great H1, significant regression in H2 |
| Relationships | 6/10 | Maintained but did not deepen; transition consumed social energy |
| Learning | 8/10 | Strong reading year, useful course completion |
| Financial | 8/10 | Salary jump + maxed retirement = solid year |
| Personal | 4/10 | Side project abandoned, Spanish never started |

**Best moment:** Finishing the first 10K race in June, feeling genuinely fit for the first time in years
**Hardest moment:** Realizing in October that the side project was dead and accepting the need to let it go
**Biggest accomplishment:** Successful career transition with 20% salary increase
**Biggest regret:** Letting the running routine collapse instead of adapting it to the new schedule

---

### 12-Month Forward Projection: 2026

#### Continue (keep doing)
- Reading habit (30 min before bed) -- target 20 books
- Retirement contributions at maximum level
- Active learning through courses (1 per quarter)

#### Start (new for next year)
- Morning exercise routine (not dependent on daylight or evening energy)
- Side project with calendar-protected time (Saturday 9-11 AM, non-negotiable)
- Spanish learning (attach to existing habit: 15 min during lunch)

#### Stop (deliberately eliminate)
- Evening exercise plans (proven failure mode -- mornings only)
- Saying yes to optional social obligations during high-stress work periods
- Planning goals that require "leftover time" -- if it does not have a calendar slot, it does not happen

#### Quarterly Rough Allocation

| Quarter | Focus Areas | Key Goals |
|---------|------------|-----------|
| Q1 | Health + Learning | Re-establish morning running (3x/week), start Spanish |
| Q2 | Career + Side project | Lead major initiative at work, launch side project MVP |
| Q3 | Health + Financial | Train for half marathon, mid-year financial review |
| Q4 | Career + Personal | Push for year-end promotion conversation, complete side project v1 |

#### Annual Success Criteria

Next year is a 9/10 or 10/10 if:
1. Exercise at least 150 days out of 365 (41% adherence, realistic given 2025's H2 drop)
2. Ship a working version of the side project (any scope, but live and usable)
3. Read 20 books
4. Reach Spanish A1 conversational level (can order food, give directions, introduce myself)
5. Receive positive annual review at work with promotion discussion initiated
