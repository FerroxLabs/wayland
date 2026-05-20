---
name: performance-review
description: |
  Creates performance review documents with rating dimensions, evidence-based evaluation, development goals, and constructive feedback using structured performance management methodology. Use when the user asks about performance reviews, employee evaluations, annual reviews, performance assessments, or writing feedback for direct reports.
  Do NOT use for performance improvement plans (use performance-improvement-plan), interview evaluation (use interview-guide), or self-assessment preparation.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "template planning strategy guide checklist"
  category: "business-strategy"
  subcategory: "human-resources"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Performance Review

## When to Use

**Use this skill when:**
- A manager needs to write an annual, mid-year, or quarterly performance review for a direct report and wants a structured, evidence-based document
- A user needs to evaluate an employee across multiple behavioral and output dimensions and is unsure how to weight or present the assessment
- A manager has informal notes, project outcomes, and impressions and needs to convert them into a coherent, defensible written review
- A user is preparing review narratives ahead of an HR calibration session and needs documentation that will hold up to cross-team scrutiny
- A manager wants to use the review as a genuine career development conversation, not just a compliance exercise, and needs goals and feedback structured to enable that
- An HR business partner or people operations lead is building a review template or training managers on performance documentation
- A user needs to document performance that supports a compensation decision (merit increase, bonus, promotion) and needs the evidence trail to be airtight

**Do NOT use this skill when:**
- The employee is already on a formal performance improvement plan -- use the `performance-improvement-plan` skill, which handles structured remediation timelines, required documentation, and legal risk framing
- The user wants to evaluate a candidate during or after an interview process -- use the `interview-guide` skill, which covers structured scoring against job requirements rather than period-over-period performance
- The user is writing their own self-assessment or preparing to advocate for their own promotion -- this skill is written from the evaluating manager's perspective
- The user needs to collect 360-degree feedback from peers, stakeholders, and direct reports -- this skill covers the manager-authored review document, not multi-rater input collection
- The user is managing a contractor or vendor relationship -- performance reviews for contingent workers carry different legal and HR implications and require a different framework
- The situation involves a final termination decision -- by that point the documentation required is legal in nature and falls outside this skill's scope

---

## Process

### Step 1: Establish the Review Parameters Before Writing Anything

Gather the following inputs before producing any assessment language. Without these, the review will be generic and unhelpful.

- **Employee name, title, and level** -- the expectations for a Software Engineer II are materially different from a Senior Software Engineer, even if they do similar work day-to-day; level must anchor every rating decision
- **Review period start and end dates** -- do not assume "annual" means January to December; many organizations run fiscal-year reviews (e.g., April to March) or hire-date anniversary reviews
- **Review type** -- annual reviews require full dimension coverage; mid-year reviews typically cover goal progress and one key development area; probation reviews (30/60/90 day) focus on ramp velocity and cultural fit, not full output assessment
- **Goals or OKRs set at the beginning of the period** -- if the user does not have them written down, ask what was communicated verbally; undocumented goals are still goals and should be reconstructed as accurately as possible
- **Rating scale** -- organizations use 3-point, 4-point, 5-point, and 6-point scales with different labels; the most common are: 5-point (Does Not Meet / Partially Meets / Meets / Exceeds / Exceptional), 4-point (Below / Meets / Above / Outstanding), and narrative-only (no numbers, just text assessments); if the user does not know their scale, default to the 5-point scale described below
- **Whether calibration has already happened or is pending** -- if calibration is pending, the written review should reflect the manager's honest assessment, not a pre-negotiated outcome; if calibration has already occurred and ratings were adjusted, the written narrative must match the calibrated rating, not the manager's original instinct
- **Whether the review drives compensation** -- if merit increases or bonuses are tied to this review, the rating language must be precise and defensible, not aspirational; overrating creates compensation expectations that cannot be sustained

### Step 2: Select and Weight the Evaluation Dimensions

Choose 4-7 dimensions that match the role. More than 7 dimensions dilutes the assessment and makes calibration difficult. Fewer than 4 misses important facets of performance.

**Universal dimensions** (use for almost every role):
- **Delivery / Goal Achievement** -- did the employee accomplish what they committed to? This includes output quality, timeliness, and completeness against stated goals
- **Quality of Work** -- accuracy, craftsmanship, thoroughness, fitness-for-purpose; a lawyer's "quality" is different from an engineer's, but the concept applies universally
- **Communication and Collaboration** -- clarity of communication, responsiveness, cross-functional effectiveness, constructive participation in team dynamics
- **Initiative and Problem Solving** -- does the employee identify issues and propose solutions, or do they wait to be directed? Does their scope of ownership expand or stay static?
- **Growth and Learning** -- how effectively does the employee incorporate feedback, develop new skills, and increase their contribution over time?

**Add for people managers:**
- **People Development** -- coaching effectiveness, career development of direct reports, performance management execution
- **Strategic Thinking** -- ability to translate organizational objectives into team priorities; contribution to planning beyond immediate deliverables
- **Organizational Effectiveness** -- cross-team influence, managing up, representing the team and its work credibly in broader forums

**Add for client-facing or revenue roles:**
- **Client Relationship Management** -- quality of relationships, retention signals, escalation handling
- **Revenue Impact** -- quantified contribution to pipeline, closed revenue, or account growth

**Weight dimensions explicitly if the role warrants it.** A sales representative's Delivery dimension should carry more weight than their Communication dimension. A communications manager's Communication dimension should carry roughly equal weight to Delivery. Document the weighting if ratings are aggregated into an overall score.

### Step 3: Compile Evidence Using the SBI Framework and Avoid Common Evidence Failures

Evidence collection is the highest-stakes step. Weak evidence produces ratings that cannot survive a calibration challenge or, worse, a legal challenge.

**The SBI Framework (Situation-Behavior-Impact):**
- **Situation:** When and where did this occur? Be specific -- "During the Q2 product launch in April" is better than "earlier this year"
- **Behavior:** What exactly did the person do or say? Behavior is observable and factual -- "Alex delivered the final integration layer two weeks before the deadline" is behavior; "Alex is passionate about quality" is an interpretation
- **Impact:** What resulted from the behavior? Quantify when possible -- "which reduced post-launch defects by 60% compared to the prior release" is stronger than "which the team appreciated"

**Evidence quality checklist for each dimension:**
- At least one example per dimension; two is better for high-stakes ratings (exceptional or does not meet)
- Examples must span the full review period -- document the date range of examples before writing; if all examples are from the last 60 days, recency bias is distorting the assessment
- Both strengths and development areas should have evidence, not just the areas where you have concerns
- Evidence must be observable, not inferred -- "Jordan missed three stand-ups without notice in October and November" is observable; "Jordan doesn't care about the team" is inferred; write only the former
- For development areas in particular: evidence must describe the specific behavior and its specific impact, not the manager's emotional reaction to the behavior

**Common evidence failures to avoid:**
- **Recency bias:** The last 4-6 weeks dominate the assessment because they are freshest. Counter this by reviewing commit histories, Jira/project tickets, email threads, or prior check-in notes from earlier in the period before writing anything.
- **Halo effect:** One very visible success (a high-profile project delivery) inflates all other dimension ratings. Rate each dimension independently, using dimension-specific evidence.
- **Horn effect:** One visible failure (a missed deadline, a difficult meeting) deflates all other ratings. Same solution -- dimension-specific evidence.
- **Attribution errors:** Crediting an individual for team outcomes, or blaming them for team failures, without establishing their specific contribution. If 5 engineers shipped a feature, the review must specify what this individual's contribution was.
- **Similarity bias:** Rating employees who communicate, think, or work the way the manager does more favorably. Counter this by asking: "Is this a performance difference or a style difference?"

### Step 4: Assign Ratings Accurately and Defensibly

**Standard 5-point scale:**
- **5 -- Exceptional:** Performance that would be recognized as outstanding even in a higher-level role. Rare by definition -- fewer than 10% of employees in a healthy organization should receive this rating. Requires documented impact beyond the immediate role.
- **4 -- Exceeds Expectations:** Consistently delivers above the stated bar for the role and level. This is the "strong performer" rating. In most organizations, 20-30% of employees receive this rating at any given cycle.
- **3 -- Meets Expectations:** Fully competent and reliable delivery at the expected level. "Meets" is not a negative rating -- it describes someone doing their job well. 40-50% of employees in a healthy team should cluster here.
- **2 -- Partially Meets:** Inconsistent delivery; some goals missed; specific deficiencies that must be addressed. 10-20% of employees may receive this; it is a signal that a coaching conversation and clear expectations reset are needed.
- **1 -- Does Not Meet:** Significant performance gaps. This rating should not appear without prior documentation of the issues -- if this is the first time the employee is hearing about these gaps in writing, the review process has already failed. Fewer than 5% of employees should be at this level; if a team has many 1s, the manager may be failing at ongoing feedback.

**Rating calibration principles:**
- A "3 -- Meets Expectations" at Google means something different than a "3 -- Meets Expectations" at a startup with no defined level expectations. Always anchor ratings to the written role expectations or level guide if one exists.
- Never rate up to soften the conversation. A 3 that should be a 2 is not kindness -- it deprives the employee of accurate information they need to improve and creates an undocumentable decision if termination becomes necessary later.
- Forced distribution (e.g., "no more than 10% can receive a 5") is imposed at the calibration level, not the writing level. Write the honest assessment; let the calibration process adjust if needed.

### Step 5: Write the Narrative Assessment

Narrative quality separates reviews that are actually useful from reviews that are legally compliant but developmentally useless. Apply these standards:

**Structure for each dimension:**
1. **Opening sentence:** State the overall assessment for this dimension directly -- "Communication is Alex's primary development area this cycle" or "Jordan delivered exceptional results on the infrastructure reliability initiative"
2. **Strength evidence:** One or two SBI examples showing what the employee did well in this dimension
3. **Development evidence (if applicable):** One or two SBI examples showing where gaps appeared; include the specific impact of the gap
4. **Forward bridge:** For development areas, end with a specific and constructive path -- what the employee should do differently, not just a description of the problem

**Language standards:**
- Use the employee's preferred name and pronouns consistently throughout the document
- Use active voice: "Morgan led the migration" not "the migration was led by Morgan"
- Avoid coded language that has documented bias patterns: "aggressive" for assertive behavior in some employees but not others; "articulate" as a compliment that implies surprise; "cultural fit" as a reason for lower ratings without specificity
- Avoid minimizing language: "not bad," "pretty good," "could be better" -- these signal uncertainty in the manager's assessment
- Avoid superlatives that are not supported by evidence: "Alex is the best engineer I've ever managed" either requires evidence or should be removed
- Match the intensity of language to the rating -- a 2/5 narrative that reads like a 4/5 because the manager softened it will create confusion in calibration and misaligned expectations for the employee

**The specificity test:** Read each paragraph and ask: "Could this paragraph be copied almost unchanged into a review for a different employee?" If the answer is yes, it is too generic. Specificity is the measure of useful narrative.

### Step 6: Write Development Goals That Are Actionable

Development goals in a performance review are not aspirations -- they are commitments. Each goal must answer four questions: what, how, measured by what, and by when.

**Goal construction framework:**
- **What:** Name the specific skill, behavior, or capability to develop -- "Improve executive communication" is too vague; "Develop the ability to present technical architecture decisions to non-technical stakeholders in 10 minutes or less" is specific
- **How:** Name the mechanism -- options include: stretch assignment (lead this type of project), formal training (complete this course or certification), mentoring/coaching (meet biweekly with a named person), peer feedback (solicit structured input after specific events), deliberate practice (apply this technique in the next 5 client meetings)
- **Measured by:** Name the observable indicator of success -- not "improve" but "demonstrate by" -- "receives unsolicited positive feedback from at least two cross-functional partners," "presents to VP-level audience with no follow-up clarification requests," "achieves AWS Solutions Architect certification"
- **By when:** Name a specific date or milestone -- "By Q2 review" or "By end of H1" or "Before promotion discussion in October"

**Manager commitment section:** Every development plan must include what the manager commits to doing. If the manager owns no action items, the development goal is the employee's problem alone, which typically produces no change. Manager actions include: creating the opportunity (assigning the stretch project), providing the feedback (scheduling post-event debrief), removing barriers (getting budget for training), or making introductions (connecting the employee with a mentor).

**Number of development goals:** 2-3 goals is the right range for most reviews. Fewer than 2 signals no investment in the employee's growth. More than 3 is typically not actionable -- employees cannot pursue 5 major development goals simultaneously while doing their regular job.

### Step 7: Prepare the Manager for the Delivery Conversation

The written document is only useful if the conversation it anchors is conducted well. Provide guidance on the conversation structure:

- **Pre-read distribution:** Share the written review 24-48 hours before the meeting. This respects the employee's need to process feedback before responding to it. A manager who delivers feedback verbally while the employee reads it for the first time simultaneously is not giving the employee a real opportunity to respond thoughtfully.
- **Meeting length:** 45-60 minutes for an annual review. 30 minutes for mid-year. 20 minutes for a quarterly check-in. Do not schedule a performance review at the end of a full calendar day or immediately before another meeting -- it signals low priority.
- **Conversation sequence:** (1) Check in -- how is the employee feeling about the period? (2) Overall assessment -- share the headline rating and your one-sentence summary; (3) Dimension discussion -- walk through each dimension, asking the employee to share their perspective before you share yours; (4) Goals for next period -- discuss and co-create where possible; (5) Employee questions and comments; (6) Close with 2-3 clear next steps and who owns each.
- **Handling disagreement:** If the employee disagrees with a rating or assessment, listen fully before responding. Do not capitulate under social pressure, but do update ratings if the employee provides evidence you were missing. The signature line acknowledges the discussion occurred, not agreement -- document any significant disagreement in the employee comments section.
- **After the conversation:** The employee should have 5-7 business days to add comments to the document before it is finalized. After finalization, both parties sign and the document enters the personnel file.

---

## Output Format

```
## Performance Review: [Employee Full Name]

### Review Information

| Field            | Detail                                      |
|------------------|---------------------------------------------|
| **Employee**     | [Full Name]                                 |
| **Role / Level** | [Job Title] -- [Level, e.g., L4 / Senior]   |
| **Department**   | [Team or Business Unit]                     |
| **Manager**      | [Manager Name]                              |
| **Review Period**| [Start Date] to [End Date]                  |
| **Review Type**  | [Annual / Mid-Year / Quarterly / Probation] |
| **Prepared by**  | [Manager Name]                              |
| **Prepared on**  | [Date]                                      |

---

### Overall Assessment

**Rating: [X/5] -- [Label]**

[3-4 sentence summary. Sentence 1: the headline -- what was the defining characteristic of this employee's performance this period? Sentence 2: the most significant achievement, with specific outcome. Sentence 3: the most important development area and why it matters. Sentence 4: the forward-looking signal -- what does continued performance at this level enable, or what must change for career progression?]

---

### Dimension Ratings Summary

| Dimension                  | Rating | Summary                              |
|----------------------------|--------|--------------------------------------|
| Delivery / Goal Achievement| [X/5]  | [One specific sentence]              |
| Quality of Work            | [X/5]  | [One specific sentence]              |
| Communication              | [X/5]  | [One specific sentence]              |
| Collaboration              | [X/5]  | [One specific sentence]              |
| Initiative                 | [X/5]  | [One specific sentence]              |
| Growth and Learning        | [X/5]  | [One specific sentence]              |
| [Role-specific dimension]  | [X/5]  | [One specific sentence]              |

**Overall Rating: [Weighted or average score, or narrative label only if no numeric scale]**

---

### Goal Review: [Review Period]

| Goal                          | Target            | Actual Result      | Status            |
|-------------------------------|-------------------|--------------------|-------------------|
| [Specific goal as stated]     | [Metric or output]| [What happened]    | Exceeded/Met/Missed|
| [Specific goal as stated]     | [Metric or output]| [What happened]    | Exceeded/Met/Missed|
| [Specific goal as stated]     | [Metric or output]| [What happened]    | Exceeded/Met/Missed|

*Note any goals that were added or removed after the period began, and why.*

---

### Detailed Dimension Assessment

#### [Dimension Name]: [Rating/5]

**Assessment:** [Opening sentence -- direct statement of the overall rating for this dimension]

**Strengths:**
In [specific situation, with date or timeframe], [employee name] [specific behavior], which resulted in [specific, quantified impact where possible]. [Optional second example using same SBI structure.]

**Development area:**
During [specific situation], [specific behavior that fell short], which resulted in [specific impact of the gap]. Going forward, [specific, actionable recommendation for what to do differently].

*(Repeat this block for each dimension)*

---

### Development Goals: [Next Period]

#### Goal 1: [Specific skill or behavior]

**What:** [Precise description of the capability to develop]
**How:** [Specific mechanism -- training name, project type, mentoring structure]
**Success measure:** [Observable, verifiable indicator that the goal has been achieved]
**Timeline:** [Specific date or milestone]
**Manager commitment:** [What the manager will do to enable this goal]

#### Goal 2: [Specific skill or behavior]

**What:** [Precise description]
**How:** [Specific mechanism]
**Success measure:** [Observable indicator]
**Timeline:** [Specific date]
**Manager commitment:** [Manager action]

#### Goal 3 (if applicable): [Specific skill or behavior]

**What:** [Precise description]
**How:** [Specific mechanism]
**Success measure:** [Observable indicator]
**Timeline:** [Specific date]
**Manager commitment:** [Manager action]

---

### Compensation and Career Progression Recommendation

*(Complete this section only if the review drives a compensation or promotion decision)*

**Compensation recommendation:** [Merit increase %] / [Bonus recommendation] / [No change] -- [One-sentence rationale]
**Promotion eligible:** [Yes / No / Not yet -- target date]
**Promotion rationale / barriers:** [What needs to be true for promotion, and is it?]

---

### Employee Comments

*[Employee name] is invited to add comments after reviewing this document. Comments should be added before [specific date] and will be included in the finalized review.*

[Space for employee response]

---

### Acknowledgment

*Employee signature acknowledges that the performance review discussion occurred and that this document has been reviewed. It does not indicate agreement with all assessments.*

Manager: ___________________________ Date: ___________
Employee: __________________________ Date: ___________
HR Representative (if required): ____ Date: ___________
```

---

## Rules

1. **Never write a rating without evidence.** A dimension rating of any value -- including a 3 -- must be supported by at least one specific SBI example in the narrative. A rating without evidence is an opinion delivered as a fact, which cannot survive a calibration challenge or a legal challenge if the employee disputes it.

2. **Never rate against the wrong benchmark.** Every rating must be anchored to the expectations for the employee's current role and level, not to (a) the manager's personal work style, (b) the best person they have ever managed, or (c) the employee's own prior performance in isolation. If no written level guide exists, ask the user to describe what "fully meeting expectations at this level" looks like before assigning ratings.

3. **Never skip development goals for high performers.** The instinct to skip development goals for employees rated 4 or 5 is understandable but wrong. High performers who receive no development goals interpret this as "I have nothing left to learn here," which accelerates attrition. Exceptional performers should have the most ambitious development goals -- they are the ones capable of acting on them.

4. **Never let the rating and the narrative contradict each other.** A 4/5 rating accompanied by a narrative that describes primarily development concerns is contradictory and will confuse the employee. Before finalizing, read each dimension narrative and ask: "If someone received only this narrative and not the number, what rating would they guess?" The answer should match the assigned rating within one point.

5. **Always check for recency bias before writing.** Explicitly review the date range of your evidence examples before drafting. If all examples fall within the last 8 weeks of a 12-month review period, the assessment is incomplete. Ask the user: "What are two or three things this employee did in the first half of the review period that stand out?" and incorporate those.

6. **Never use language that codes for protected characteristics.** Certain language patterns have documented associations with gender, race, age, or neurodiversity bias in performance reviews. Red-flag terms: "articulate" as a compliment (implies surprise), "emotional" or "abrasive" applied asymmetrically across employees, "aggressive" for the same behavior called "driven" elsewhere, "not a culture fit" without behavioral specifics. If any of these appear, replace with specific behavioral descriptions.

7. **Distinguish style from performance.** An employee who uses a different approach, communication style, or work method than the manager is not performing poorly on that basis alone. Only rate an approach as a development area if it produces documented negative outcomes -- missed deliverables, team friction with evidence, or customer impact. Different-but-effective is a 3 or higher, not a 2.

8. **A "Meets Expectations" rating is not a mediocre outcome -- communicate this clearly.** In many organizations, the "Meets" label has been so consistently used as a euphemism for "you're about to be managed out" that employees interpret it as a near-negative rating even when it represents solid performance. Include explicit calibration language in the overall assessment section: "A 3/5 on this scale represents fully effective performance at the [level] level."

9. **Compensation and rating must be aligned, or the misalignment must be explicitly explained.** If an employee rates 4/5 and receives no merit increase, or rates 2/5 and receives the standard merit increase, the employee will notice and trust will erode. If compensation decisions are constrained by budget or headcount, say so explicitly in the compensation section rather than adjusting the rating to match the compensation outcome.

10. **The review must close a loop on the prior period's development goals.** Every development goal set in the previous review must be reviewed in the current cycle's Goal Review section. If a goal was set and then abandoned, acknowledge it -- either it was achieved (document how), it became irrelevant (explain why), or it was not pursued (note this honestly and decide whether it carries forward). Silently dropping prior goals teaches employees that development goals are performative.

11. **Never surprise an employee in a written review.** Any rating of 2/5 or lower, and any significant development concern, should have been communicated verbally to the employee at least once during the review period before appearing in writing. A review is a summary, not a revelation. If the manager has not communicated these concerns previously, note this -- it is an important piece of context -- and structure the delivery conversation accordingly.

12. **Probation reviews require different scoring standards.** An employee in their first 90 days who receives a "3 -- Meets Expectations" is performing at the fully ramped level for a role they have held for 3 months, which is actually exceptional. Probation reviews must explicitly state: "This rating reflects performance expected at [X weeks/months] of tenure, not full role proficiency." Failing to note this context sets false expectations.

---

## Edge Cases

### Employee Who Received a Promotion Mid-Period

Split the review into two explicit phases: pre-promotion and post-promotion. State the role and level for each phase and rate against the expectations for each separately. Do not apply the new role's expectations retroactively to the period before promotion -- this penalizes an employee for not being fully proficient in a role they had not yet been given. Conversely, do not apply pre-promotion standards to post-promotion performance -- this produces an inflated rating that misrepresents their actual level. A common format: "From January through June, [name] was performing as a [Level X]. Their performance during this period was [rating] against that level's expectations. From July through December, [name] operated as a [Level X+1]. Their performance during this period was [rating] against the higher-level expectations." The overall rating should weight the two phases by time spent, not average them equally.

### Employee With Undocumented or Informally Changed Goals

This is extremely common. The goals documented in the HR system from six months ago no longer reflect what the employee actually worked on. Handle this as follows: acknowledge the disconnect explicitly in the Goal Review section ("The goals originally set for this period were [X, Y, Z]; however, [business context -- reorganization, product pivot, emergency project] shifted priorities in [month], and the actual work was [A, B, C]"). Rate against the goals the employee was actually working toward, not the obsolete documented goals. Flag for the employee and HR that goal documentation should be updated in real time, not reconstructed at review time. Do not penalize the employee for a goal management failure that is partly organizational.

### High Performer Who Is a Poor Team Collaborator

Treat delivery and collaboration as fully independent dimensions and rate each honestly, even when the combination is uncomfortable (e.g., 5/5 Delivery, 2/5 Collaboration). Avoid the urge to inflate the collaboration rating because the delivery is strong -- this sends the signal that individual output excuses interpersonal impact. In the narrative, be explicit about the stakes: sustained collaboration deficits create succession risk (the person cannot be promoted into roles requiring influence), team attrition risk (teammates leave rather than continue working with this person), and organizational toxicity risk. Set specific and behavioral development goals for collaboration, not vague ones like "be more of a team player." Example of a specific goal: "In the next quarter, proactively share work-in-progress documentation with the team at 50% completion on all projects lasting more than two weeks, as measured by posts in the #engineering-wip channel."

### Employee Who Is Struggling Due to External Life Circumstances

If the manager is aware of significant external circumstances (medical leave, bereavement, a caregiving crisis) that affected performance during part of the review period, these must be handled with precision. Do not ignore the circumstances and rate as if they did not happen -- this is both inaccurate and potentially discriminatory. Do not inflate ratings based on sympathy -- this deprives the employee of accurate feedback and may create compensation expectations inconsistent with actual performance. The correct approach: rate the work that was done against the capacity that was available and documented. If the employee was on approved medical leave for two months of a six-month review period, rate the four months of actual work at the full four-month contribution level, and note the leave explicitly in the Review Information section. Development goals may need to be adjusted to account for recovery time.

### Remote or Distributed Employee With Limited Manager Visibility

Output-based evaluation is the only defensible basis for reviewing a remote employee. Activity signals (response time, meeting attendance, office hour check-ins) are proxies for performance, not performance itself. Before writing the review, the manager should gather: (1) delivery data from project management tools -- what was completed, by when, at what quality level? (2) input from cross-functional partners who worked directly with the employee -- ask for SBI examples, not impressions; (3) any asynchronous documentation the employee produced (proposals, design docs, retrospective write-ups) as evidence of quality and communication. Do not penalize for low "visibility" unless visibility is a documented and communicated expectation of the role. If it is an expectation, rate it under Communication -- not as a hidden criterion embedded in other dimensions.

### First-Time Manager Writing Their First Reviews

First-time managers systematically make two opposite errors: (1) rating everyone too high because they want to be liked and avoid difficult conversations, or (2) rating everyone too low because they do not yet understand what "meets expectations at this level" looks like in their organization. Help them calibrate by asking: "Before you finalize ratings, how do your ratings compare to what your peers are likely to give for similar performance?" and "If this rating goes into a calibration session with three other managers rating their teams, is it defensible?" Also flag that first-time managers often skip documentation of development areas for fear of hurting the relationship. Frame clearly: withholding honest development feedback is a disservice to the employee's career, not a kindness.

### Performance That Changed Dramatically Mid-Period

An employee who performed at a 4/5 level for the first seven months and then had a serious performance drop in the final five months presents a challenge. Do not simply average the two periods -- this produces a 3/5 rating that is accurate as a mathematical average but misleading as a performance signal. The correct approach is to describe both periods explicitly in the narrative, assign dimension ratings that reflect the overall pattern, and address the performance decline directly in the development section. The critical question is causation: was the decline due to changing circumstances (new manager, changed scope, team disruption) or behavior (disengagement, external distraction, skill ceiling)? The cause should shape the development goals. If the cause is unclear, the development goals should include a specific early check-in (30 or 60 days) to assess whether the downward trend is reversing.

---

## Example

**Input:** "I need to write an annual review for Jordan Chen, a Senior Product Manager at our SaaS company. Jordan has been in the role for 2.5 years. They had a big year -- launched two major features (an enterprise SSO integration and a self-serve onboarding flow) that both hit their success metrics. But they struggle with prioritization: they have a tendency to say yes to every stakeholder request without pushing back, which causes the roadmap to bloat and the engineering team to feel whipsawed. I want them to grow toward principal PM. We use a 5-point scale. No forced distribution at our company."

**Output:**

---

## Performance Review: Jordan Chen

### Review Information

| Field             | Detail                                        |
|-------------------|-----------------------------------------------|
| **Employee**      | Jordan Chen                                   |
| **Role / Level**  | Senior Product Manager                        |
| **Department**    | Product                                       |
| **Manager**       | [Manager Name]                                |
| **Review Period** | January 2025 to December 2025                 |
| **Review Type**   | Annual                                        |
| **Prepared by**   | [Manager Name]                                |
| **Prepared on**   | [Date]                                        |

---

### Overall Assessment

**Rating: 3.5/5 -- Meets to Exceeds Expectations**

Jordan delivered two of the team's highest-impact product initiatives this year and demonstrated real strength in cross-functional execution and stakeholder communication. The enterprise SSO integration and self-serve onboarding flow both shipped on schedule and hit their initial success metrics, which represents genuinely strong delivery for a Senior PM. The primary development area that separates current performance from principal-level impact is prioritization discipline: Jordan's tendency to absorb new stakeholder requests without applying a strategic filter has caused roadmap scope to expand mid-quarter on three documented occasions, creating re-planning overhead for engineering and eroding predictability. Closing this gap is the clearest path to the principal PM conversation Jordan is working toward.

---

### Dimension Ratings Summary

| Dimension                   | Rating | Summary                                                                 |
|-----------------------------|--------|-------------------------------------------------------------------------|
| Delivery / Goal Achievement | 4/5    | Both major initiatives shipped on time and hit primary success metrics. |
| Quality of Work             | 4/5    | Specifications were thorough and well-researched; edge cases well-documented. |
| Communication               | 4/5    | Strong written and verbal communication; excellent stakeholder updates. |
| Collaboration               | 4/5    | Engineering and design partnerships are effective and trust-based.      |
| Prioritization / Strategy   | 2/5    | Roadmap scope crept mid-quarter three times due to unfiltered scope intake. |
| Initiative                  | 3/5    | Responds well to defined problems; proactively defines fewer problems.  |
| Growth and Learning         | 3/5    | Applies tactical feedback well; ready to develop more strategic instincts. |

**Overall Rating: 3.5/5 -- Meets to Exceeds Expectations**

*Note: A 3/5 on this scale represents fully effective performance at the Senior PM level. Jordan's score reflects strong delivery tempered by a specific and addressable gap in prioritization discipline.*

---

### Goal Review: 2025

| Goal                                           | Target                                        | Actual Result                                          | Status   |
|------------------------------------------------|-----------------------------------------------|--------------------------------------------------------|----------|
| Launch enterprise SSO integration              | GA by end of Q2; 20 enterprise customers onboarded by Q3 | GA in Q2; 27 enterprise customers onboarded by Q3 end | Exceeded |
| Launch self-serve onboarding flow              | Reduce onboarding time-to-value from 14 days to 7 days avg | Average time-to-value reached 6.2 days by Q4          | Exceeded |
| Maintain engineering team satisfaction ≥ 8/10 (internal survey) | ≥ 8/10 in H1 and H2 engineering surveys | H1: 8.3/10; H2: 7.1/10 -- declined in H2 survey      | Partially Met |
| Establish quarterly roadmap review process     | Documented process shared with stakeholders by Q1 | Process documented in Q1; not consistently followed in Q3-Q4 | Partially Met |

*The H2 engineering satisfaction decline aligns with the period of highest roadmap volatility (Q3) and is addressed in the Prioritization dimension assessment below.*

---

### Detailed Dimension Assessment

#### Delivery / Goal Achievement: 4/5

**Assessment:** Jordan's delivery track record is a genuine strength and the most visible aspect of their performance this year.

**Strengths:**
The enterprise SSO integration launched on May 14th as committed at the start of Q1, reaching GA two weeks ahead of the internal deadline. Twenty-seven enterprise customers activated SSO by September 30th against a target of 20, representing 135% of the acquisition target. The specification Jordan produced for this project was cited by engineering leads as one of the clearest they had worked from in two years -- edge cases were documented, integration failure modes were pre-researched, and the launch runbook was complete before the final build phase began.

The self-serve onboarding flow similarly exceeded its core metric: time-to-value dropped from a 14-day average to 6.2 days by Q4, exceeding the 7-day target. Jordan ran three pre-launch user tests that identified two critical UX issues before they reached production, directly preventing what the design team estimated would have been a 20-25% abandonment increase.

**Development area:**
Two secondary deliverables -- a competitive analysis for the pricing refresh and a capability roadmap requested by the sales team -- were delivered 3 and 5 weeks late respectively. In both cases, the delay was traceable to Jordan's calendar being overcommitted due to scope additions that had been accepted mid-quarter. This is a delivery risk to monitor: when prioritization is clean, Jordan delivers early; when the intake filter breaks down, delivery quality and timeliness degrade on lower-profile work.

---

#### Prioritization / Strategy: 2/5

**Assessment:** Prioritization is Jordan's most important development area and the clearest gap between current Senior PM performance and principal-level impact.

**Development area -- Scope intake:**
On three occasions in 2025 (February, June, and September), Jordan accepted significant new scope requests from stakeholders without running them through a prioritization framework or flagging the trade-off implications to the engineering team. In the September instance, a VP of Sales request for a "quick" bulk-export feature was added to the Q3 roadmap in week six of an eight-week quarter. The engineering team, mid-sprint on a committed feature, was asked to reprioritize. The resulting disruption was cited explicitly in the H2 engineering satisfaction survey -- four engineers mentioned roadmap unpredictability as a source of frustration, with two specifically referencing the Q3 change. The bulk-export feature itself was valuable, but the manner of its intake -- unilateral acceptance, no written trade-off analysis, no advance communication to engineering -- was the failure, not the feature itself.

A principal PM at this company is expected to hold the roadmap against strategic pressure and return to stakeholders with clear trade-off analysis rather than absorbing requests. Jordan has the strategic instincts for this -- the challenge is applying them consistently under social pressure from senior stakeholders.

**Development area -- Strategic framing:**
Jordan's roadmap presentations to the leadership team describe what will be built and when but rarely articulate why this sequence represents the best allocation of capacity against company strategy. Principal-level PM work requires the ability to present a roadmap as a strategic argument, not a schedule. This skill is underdeveloped and is addressed in the development goals below.

---

#### Communication: 4/5

**Assessment:** Communication is a consistent strength, particularly written communication and stakeholder management in stable conditions.

**Strengths:**
Jordan's written product specifications are uniformly thorough and well-structured. During the SSO project, Jordan published a weekly stakeholder update that consolidated status, risks, and next steps into a single Notion document -- three enterprise customer leads independently mentioned this update format positively in NPS survey comments during their onboarding period.

Jordan's verbal communication in cross-functional meetings is clear and confident. Engineering leads report that Jordan rarely needs to be asked for clarification on requirements and proactively surfaces dependency risks early.

**Development area:**
Under pressure from senior stakeholders, Jordan's communication posture shifts from clear and direct to accommodating and ambiguous. In the June scope-addition episode, Jordan verbally committed to the new work in a meeting before communicating the implications to engineering -- the team heard about the change from a VP of Engineering forwarding Jordan's email, not from Jordan directly. At the principal level, difficult messages to senior stakeholders are a core responsibility. Jordan should develop a default framework for responding to scope requests in the moment without committing ("Let me run this against current capacity and come back to you with a trade-off analysis by end of week") rather than accepting in order to avoid friction.

---

#### Collaboration: 4/5

**Assessment:** Jordan's cross-functional partnerships are a genuine asset and produce measurable delivery benefits.

**Strengths:**
The design team lead, in informal feedback solicited for this review, described Jordan as "the PM who does the pre-work so the design team can actually design rather than define the problem from scratch." Jordan consistently produces a user problem framing document before engaging design, which reduces the time from brief to initial concepts by an estimated 30-40% compared to team norms. This is a genuine contribution to team effectiveness that goes beyond the job description.

During the onboarding flow project, Jordan identified a conflict between the growth team's activation experiment and the onboarding flow launch timeline in March -- three weeks before the conflict would have become a blocker -- and facilitated a working session that resolved the dependency without delaying either initiative. Conflict identification and proactive resolution at this quality is a senior-level behavior.

---

#### Initiative: 3/5

**Assessment:** Jordan demonstrates strong initiative within defined problem spaces but is less proactive at identifying and championing problems that are not already on the roadmap.

**Strengths:**
Within active projects, Jordan consistently goes beyond the stated scope to anticipate edge cases, document failure modes, and identify adjacent improvements. The post-launch monitoring framework Jordan built for the SSO integration -- a Datadog dashboard with custom alerting thresholds -- was not in the original project scope but has been adopted as a team standard for all major feature launches.

**Development area:**
Jordan has not yet sponsored a product direction that originated with their own market observation or strategic hypothesis. The two major initiatives this year were both inherited from the prior planning cycle. At the principal level, an expectation is that the PM is identifying and building the case for problems worth solving, not only executing against problems already defined. Jordan should develop a practice of horizon scanning -- spending structured time on customer research, market signal review, or industry analysis -- that generates original product hypotheses they bring to leadership.

---

#### Growth and Learning: 3/5

**Assessment:** Jordan applies tactical feedback quickly and well, and is ready to develop more strategic instincts with deliberate focus.

**Strengths:**
Feedback from mid-year check-ins about improving engineering spec completeness was fully incorporated by Q3 -- the post-mid-year specs received notably higher quality ratings from engineering leads in the H2 satisfaction survey. Jordan's ability to take specific, behavioral feedback and apply it rapidly is an asset.

**Development area:**
Jordan tends to seek feedback on execution decisions (should I do X or Y on this feature?) rather than on strategic decisions (is this the right problem to be solving at all?). Growth toward principal PM requires developing the habit of questioning strategic premises, not just optimizing within them. This is partly a skill and partly a posture shift -- it is addressable through deliberate practice and mentorship.

---

### Development Goals: 2026

#### Goal 1: Develop a Consistent Prioritization Framework for Scope Intake

**What:** Build and apply a lightweight decision framework that enables Jordan to respond to mid-quarter scope requests with a structured trade-off analysis rather than an immediate yes or no.

**How:** Jordan will work with [Manager Name] in the next 30 days to co-design a one-page scope intake template that captures: strategic fit, effort estimate, displacement cost (what moves or slips), and a recommended decision. Jordan will use this template for every new scope request above 3 engineering days in Q1 and share the completed analysis with the requestor within 48 hours of receiving the request.

**Success measure:** Zero unilateral roadmap additions in Q1 2026; engineering team satisfaction score on roadmap predictability question returns to ≥ 8.0 in H1 2026 survey; [Manager Name] observes Jordan presenting trade-off analyses unprompted in at least two stakeholder meetings by end of Q2.

**Timeline:** Framework designed by February 1, 2026; applied consistently through Q1; assessed at mid-year review.

**Manager commitment:** [Manager Name] will participate in the framework design session, co-attend the first two stakeholder conversations where Jordan introduces the trade-off analysis process to provide real-time feedback, and escalate air cover if a senior stakeholder pushes back on the process during Q1.

---

#### Goal 2: Develop Strategic Roadmap Narrative Capability

**What:** Develop the ability to present a product roadmap as a strategic argument -- explaining the sequencing logic in terms of company strategy, competitive positioning, and user value, not just delivery schedule.

**How:** Jordan will schedule a bimonthly 30-minute working session with [VP of Product or named principal PM] to review an in-progress roadmap section and specifically practice the framing: "Given [strategic context], we are prioritizing [X] over [Y] because [strategic rationale], and we will know this was the right call if [measurable outcome]." Jordan will also review two published product strategy documents from the PM community (recommended: Shreyas Doshi's prioritization frameworks, Gibson Biddle's DHM model) and bring one framework to a team discussion by end of Q1.

**Success measure:** By the Q2 leadership roadmap review, Jordan presents the H2 roadmap with explicit strategic sequencing rationale; the leadership team's feedback specifically notes improved strategic framing (track this in meeting notes); [named principal PM mentor] confirms Jordan is applying strategic framing unprompted in working sessions.

**Timeline:** Mentor sessions begin by February 15, 2026; applied in Q2 leadership roadmap presentation; assessed at mid-year review.

**Manager commitment:** [Manager Name] will make the introduction to the principal PM mentor, provide structured feedback after the Q2 roadmap presentation using a shared evaluation rubric, and create space on at least one leadership roadmap for Jordan to present rather than [Manager Name] presenting on Jordan's behalf.

---

#### Goal 3: Build an Autonomous Product Hypothesis Practice

**What:** Develop a practice of horizon scanning that generates at least one original product hypothesis per quarter -- a problem worth solving that Jordan identified and built a case for, not one inherited from the roadmap or assigned by leadership.

**How:** Jordan will block 2 hours per week as dedicated horizon-scanning time (customer interviews, industry research, internal data review). At the end of each quarter, Jordan will write a one-page "opportunity brief" on one hypothesis they have developed and present it to [Manager Name] and one other senior stakeholder for feedback.

**Success measure:** Four opportunity briefs produced across 2026; at least one is promoted to active roadmap consideration by [named stakeholder]; briefs are assessed by [Manager Name] against the company's opportunity brief standard template and average a "Ready for discussion" or higher rating.

**Timeline:** First brief due April 30, 2026; one per quarter through 2026; assessed at year-end review.

**Manager commitment:** [Manager Name] will provide the opportunity brief template and example by February 1, ensure Jordan has access to relevant customer research sessions to support horizon scanning, and give written feedback on each brief within 5 business days of submission.

---

### Compensation and Career Progression Recommendation

**Compensation recommendation:** Merit increase of [X]% -- consistent with strong performance at level; reflects delivery above target offset by the prioritization gaps that limit overall impact rating.

**Promotion eligible:** Not yet -- target principal PM conversation for Q4 2026 if development goals are substantially met.

**Promotion rationale / barriers:** Jordan has the delivery track record and cross-functional credibility to be a competitive principal PM candidate. The barriers are specific and addressable: (1) demonstrated ability to hold a strategic position against stakeholder pressure, documented over at least two quarters; (2) principal-level candidates are expected to have originated at least one major product initiative, not only executed against inherited ones. Both barriers have corresponding development goals in this review. A promotion conversation should be scheduled for Q4 2026 contingent on mid-year progress review indicating the goals are on track.

---

### Employee Comments

*Jordan Chen is invited to add comments after reviewing this document. Comments should be added before [date, 5-7 business days from review conversation] and will be included in the finalized record.*

---

### Acknowledgment

*Employee signature acknowledges that the performance review discussion occurred and that this document has been reviewed. It does not indicate agreement with all assessments. Disagreements may be noted in the Employee Comments section above.*

Manager: ___________________________ Date: ___________
Employee: __________________________ Date: ___________
