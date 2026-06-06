---
name: career-pivot
description: >-
  Comprehensive career transition workflow from strategic planning and
  self-assessment through resume optimization, LinkedIn profile overhaul,
  interview preparation, and salary negotiation for professionals changing
  careers or industries.

  Use when the user wants to career pivot or needs a structured multi-step
  process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "career-pivot-advisor resume-builder linkedin-optimizer interview-coach salary-negotiator"
trigger_phrases: >-
  I want to change careers help me switch industries career pivot plan how to
  change my career career transition guide ready for a new career pivot to a new
  field
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: >-
    career interview-prep resume-writing salary-negotiation step-by-step
    planning
  category: career
  depends: "career-pivot-advisor resume-builder linkedin-optimizer interview-coach salary-negotiator"
---
# Career Pivot

**Estimated time:** 4-12 weeks

This workflow guides professionals through a strategic career pivot, from the
initial decision through landing a role in a new field. It covers the full
journey: assessing your transferable skills, planning the transition, rebuilding
your resume for the target role, optimizing your LinkedIn presence, preparing
for interviews that address the career change narrative, and negotiating
compensation in your new field.

Career pivots are increasingly common and can be deeply rewarding, but they
require more strategic planning than a standard job search. This workflow
ensures you approach the transition methodically rather than chaotically.

By the end of this workflow you will have: a clear transition plan, a
pivot-optimized resume, a LinkedIn profile that tells your career change story,
interview confidence, and salary negotiation skills for your new field.

## When to Use

- User wants to career pivot
- User needs a structured, step-by-step process for career pivot
- User wants to change careers
- User wants to switch industries
- career pivot plan
- Do NOT use when: the request is outside the scope of career pivot or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A sense that you want to change careers (even if you are not sure to what)
- At least 2-3 years of professional experience (transferable skills)
- Willingness to invest time in research, networking, and skill building
- Financial stability to weather a potential income gap during transition
- Openness to starting at a different level than your current role

## Steps

**Step 1: Plan Your Career Pivot** (uses: career-pivot-advisor)

create a strategic transition plan.

- Input: current role, industry, and experience, Their reasons for wanting to change careers, Any target industries or roles they are considering
- Output: Phased career pivot plan with timeline and milestones, Transferable skills mapped to target roles, Researched target roles with requirements and gap analysis
- Key focus: Deep skills inventory: identifying transferable skills and hidden strengths

**Step 2: Rebuild Your Resume** (uses: resume-builder)

create a career-change resume that reframes
your experience for the target role. This is fundamentally different from a
standard resume update.

- Input: `skills-inventory` from Step 1 (transferable skills to highlight), `target-roles` from Step 1 (job descriptions to optimize for), existing resume and work history
- Output: Career-change resume optimized for target roles, Tailored versions for different target role types, Career change cover letter with narrative framework
- Key focus: Choosing the right resume format (functional or combination format for career

**Step 3: Optimize Your LinkedIn** (uses: linkedin-optimizer)

transform your LinkedIn presence
from your current career to your target career.

- Input: `pivot-resume` from Step 2 (consistent messaging with resume), `transition-plan` from Step 1 (career story to tell), `target-roles` from Step 1 (audience for the LinkedIn profile)
- Output: Fully optimized profile for the career change, 30-day LinkedIn posting plan for the new field, Target connections and outreach approach
- Key focus: Headline formula that bridges old and new careers (not just a job title)

**Step 4: Prepare for Interviews** (uses: interview-coach)

prepare for the unique challenges of career
change interviews. Interviewers WILL ask "why are you changing careers?" and
your answer must be compelling.

- Input: `transition-plan` from Step 1 (career story and positioning), `skills-inventory` from Step 1 (transferable skills to highlight), `target-roles` from Step 1 (specific roles to prepare for)
- Output: The career change story, rehearsed and polished, 8-10 STAR method stories with transferable skill focus, Prepared answers for career-change-specific interview questions
- Key focus: Crafting the career change narrative (why the change, why this field, why now)

**Step 5: Negotiate Your Compensation** (uses: salary-negotiator)

approach compensation discussions
strategically as a career changer. Career pivoters face unique negotiation
dynamics: they may need to accept a step back in title but not necessarily
in total compensation.

- Input: `target-roles` from Step 1 (market rate data for the new field), `skills-inventory` from Step 1 (unique value to articulate), `transition-plan` from Step 1 (financial needs and constraints)
- Output: Salary ranges for target roles with source data, Word-for-word scripts for common negotiation scenarios, Calculated minimum compensation with rationale
- Key focus: Market rate research for the target role at the appropriate experience level

## Decision Points

- **After Step 1:** How will you approach the career change?
  - If **Direct pivot (apply to new field roles now)**: Fastest path. Works when transferable skills are strong and the gap is small.
  - If **Bridge role (intermediate position)**: Take a role that uses current skills in the target industry. Then pivot within the industry.
  - If **Education first (degree, bootcamp, certification)**: Fill the skill gap before applying. Step 2 should highlight the education prominently.
  - If **Side project first (build portfolio)**: Demonstrate competence through projects before applying. Works well for tech, design, and creative fields.
- **After Step 4:** What are your compensation expectations for the pivot?
  - If **Maintain current compensation**: Possible if transferable skills are highly valued. Negotiate assertively.
  - If **Accept a temporary step back**: Common in career pivots. Step 5 focuses on negotiating for rapid growth potential.
  - If **Seeking a significant increase**: Possible if pivoting to a higher-paying field. Market data is critical.

## Failure Handling

- **Pivoting without a plan:** "I hate my job so I will do anything else" is not a strategy. Be intentional.
- **Underselling transferable skills:** Your cross-industry experience is an asset. Frame it that way.
- **Generic resume:** A career-change resume requires fundamentally different framing than a standard resume.
- **Not networking:** Many career-change hires happen through referrals, not job boards. Network actively.
- **Expecting the same salary immediately:** Some pivots require a temporary step back. Plan for it financially.

## Expected Outcome

When this workflow is complete, the user will have:

1. A clear career pivot direction is chosen and researched
2. Resume and LinkedIn tell a compelling career change story
3. The user can articulate their career change narrative confidently
4. Interview preparation addresses career-change-specific challenges
5. Salary negotiation strategy is grounded in market data
6. The user has applied to at least 5 target roles
7. At least one interview has been secured in the new field

## Output Format

```
CAREER PIVOT TRACKER
====================

[ ] Step 1: Plan Your Career Pivot
    Status: [pending/in-progress/complete]
[ ] Step 2: Rebuild Your Resume
    Status: [pending/in-progress/complete]
[ ] Step 3: Optimize Your LinkedIn
    Status: [pending/in-progress/complete]
[ ] Step 4: Prepare for Interviews
    Status: [pending/in-progress/complete]
[ ] Step 5: Negotiate Your Compensation
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Pivoting without a plan:** "I hate my job so I will do anything else" is not a strategy. Be intentional.
- **Underselling transferable skills:** Your cross-industry experience is an asset. Frame it that way.
- **Generic resume:** A career-change resume requires fundamentally different framing than a standard resume.
- **Not networking:** Many career-change hires happen through referrals, not job boards. Network actively.

## Example

**Input:** "I want to career pivot and need a structured plan to follow step by step."

**Output:**

**Step 1 (career-pivot-advisor):** Plan Your Career Pivot -- produces concrete deliverables for this phase.

**Step 2 (resume-builder):** Rebuild Your Resume -- produces concrete deliverables for this phase.

**Step 3 (linkedin-optimizer):** Optimize Your LinkedIn -- produces concrete deliverables for this phase.

**Step 4 (interview-coach):** Prepare for Interviews -- produces concrete deliverables for this phase.

**Step 5 (salary-negotiator):** Negotiate Your Compensation -- produces concrete deliverables for this phase.

**Result:** User has a complete career pivot plan with all deliverables produced, validated, and ready for implementation.
