---
name: transition-to-management
description: >-
  Comprehensive workflow for individual contributors moving into their first
  management role. Covers self-assessment for management readiness, building
  essential leadership and communication skills, navigating the critical first
  90 days, leading teams effectively through day-to-day challenges, and growing
  as a leader over the long term.

  Use when the user wants to transition to management or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "career-pivot-advisor leadership-framework-builder goal-setting-master stakeholder-communicator performance-review-writer"
trigger_phrases: >-
  I want to become a manager transition from IC to management first-time manager
  guide how to move into leadership preparing for a management role IC to
  manager transition should I become a manager
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: career strategy step-by-step planning
  category: career
  depends: "career-pivot-advisor leadership-framework-builder goal-setting-master stakeholder-communicator performance-review-writer"
---
# Transition To Management

**Estimated time:** 3-6 months

This workflow guides individual contributors through the full arc of becoming
an effective engineering or team manager. The transition from IC to manager is
one of the most significant career shifts a professional can make -- your
success is no longer measured by what you produce, but by what your team
produces. Many new managers fail not because they lack technical skill but
because they underestimate how fundamentally the role differs from what they
have been doing.

This workflow takes you from honest self-assessment (is management right for
you?) through skill building, surviving the critical first 90 days, leading
your team through real challenges, and developing as a leader over the long
term. It is designed for technology professionals but the principles apply to
any industry.

By the end of this workflow you will have: a clear understanding of whether
management is the right path, a leadership skill foundation, a 90-day plan
for your new role, effective team leadership practices, and a long-term growth
strategy as a people leader.

## When to Use

- User wants to transition to management
- User needs a structured, step-by-step process for transition to management
- User wants to become a manager
- transition from IC to management
- first-time manager guide
- Do NOT use when: the request is outside the scope of transition to management or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- At least 3-5 years of individual contributor experience
- Some informal leadership experience (mentoring, tech lead, project lead)
- A genuine interest in helping others succeed (not just a title upgrade)
- Willingness to let go of being the person who writes the code
- Access to a manager or mentor who can provide guidance during the transition

## Steps

**Step 1: Assess Your Management Readiness** (uses: career-pivot-advisor)

conduct an honest assessment of whether
management is the right move and identify readiness gaps.

- Input: current role, seniority, and technical expertise, Their motivation for considering management (intrinsic vs. extrinsic), Current leadership experiences (mentoring, tech lead, project lead)
- Output: Honest evaluation of management readiness with gap analysis, Documented intrinsic vs. extrinsic motivations, Specific skills to develop with learning resources
- Key focus: Motivation audit: separating genuine leadership interest from external pressure,

**Step 2: Build Leadership and Management Skills** (uses: leadership-framework-builder)

develop the core competencies
every new manager needs. This is not about reading management books -- it is
about building practical skills you will use daily.

- Input: `readiness-assessment` from Step 1 (gaps to prioritize), `skills-gap-plan` from Step 1 (specific skills to build), learning style and available time budget
- Output: Core frameworks for 1:1s, feedback, delegation, and decisions, Practical guides for common management scenarios, Ongoing development plan with books, courses, and practice exercises
- Key focus: One-on-one meeting frameworks: structure, cadence, question banks

**Step 3: Navigate Your First 90 Days** (uses: goal-setting-master)

create a structured 30-60-90 day plan
for the management transition. The first 90 days set the tone for your entire
management tenure.

- Input: `leadership-toolkit` from Step 2 (frameworks to apply immediately), `management-playbook` from Step 2 (scenarios to anticipate), specific team context (size, maturity, current challenges)
- Output: Structured 30-60-90 day plan with specific goals and milestones, Key relationships to build with engagement strategy, Current team state evaluation with strengths and gaps
- Key focus: Days 1-30 (Listen and Learn): build relationships, understand team dynamics,

**Step 4: Lead Your Team Effectively** (uses: stakeholder-communicator)

master the communication demands of
management -- upward, downward, and lateral. Leading a team means being the
translation layer between your team and the rest of the organization.

- Input: `90-day-plan` from Step 3 (now executing beyond the initial phase), `leadership-toolkit` from Step 2 (frameworks to refine with experience), `team-assessment` from Step 3 (team dynamics to manage)
- Output: Regular reporting and meeting schedule with stakeholders, Metrics for tracking team morale, productivity, and growth, Approaches for common team conflict scenarios
- Key focus: Upward management: communicating team status, risks, and needs to leadership

**Step 5: Grow as a Leader** (uses: performance-review-writer)

build a practice of continuous
self-evaluation and growth as a leader. Great managers never stop developing.

- Input: `leadership-style-profile` from Step 2 (areas to develop further), `team-health-dashboard` from Step 4 (results to reflect on), `career-framework` from Step 4 (your own career development)
- Output: Honest assessment of management performance to date, Aggregated feedback from multiple sources with themes, Next-level leadership skills to develop with timeline
- Key focus: Self-evaluation: regularly assessing your own management effectiveness

## Decision Points

- **After each step:** Evaluate output quality before proceeding. If output is insufficient, iterate on the current step before moving forward.
- **Mid-workflow:** If circumstances change significantly, re-evaluate earlier steps before continuing.

## Failure Handling

- **Becoming a manager for the wrong reasons:** Title, compensation, or perceived prestige are not sufficient motivation. Management requires genuine interest in people development.
- **The hero coder trap:** New managers often continue doing IC work because it feels comfortable. Your job is to multiply others, not to be the best coder on the team.
- **Avoiding difficult conversations:** Letting performance issues fester destroys team morale. Address problems early and directly.
- **Trying to be everyone's friend:** You can be friendly without being friends. The role requires making unpopular decisions sometimes.
- **Neglecting your own manager relationship:** Managing up is just as important as managing down. Keep your manager informed and aligned.

## Expected Outcome

When this workflow is complete, the user will have:

1. A clear-eyed assessment of management readiness has been completed
2. Core management skills (1:1s, feedback, delegation) are practiced and refined
3. The first 90 days in the role are structured with measurable milestones
4. Team health signals are positive (engagement, retention, productivity)
5. Upward, downward, and lateral communication is effective
6. A long-term leadership growth plan is in place
7. The manager is no longer doing IC work as a crutch

## Output Format

```
TRANSITION TO MANAGEMENT TRACKER
================================

[ ] Step 1: Assess Your Management Readiness
    Status: [pending/in-progress/complete]
[ ] Step 2: Build Leadership and Management Skills
    Status: [pending/in-progress/complete]
[ ] Step 3: Navigate Your First 90 Days
    Status: [pending/in-progress/complete]
[ ] Step 4: Lead Your Team Effectively
    Status: [pending/in-progress/complete]
[ ] Step 5: Grow as a Leader
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Becoming a manager for the wrong reasons:** Title, compensation, or perceived prestige are not sufficient motivation. Management requires genuine interest in people development.
- **The hero coder trap:** New managers often continue doing IC work because it feels comfortable. Your job is to multiply others, not to be the best coder on the team.
- **Avoiding difficult conversations:** Letting performance issues fester destroys team morale. Address problems early and directly.
- **Trying to be everyone's friend:** You can be friendly without being friends. The role requires making unpopular decisions sometimes.

## Example

**Input:** "I want to transition to management and need a structured plan to follow step by step."

**Output:**

**Step 1 (career-pivot-advisor):** Assess Your Management Readiness -- produces concrete deliverables for this phase.

**Step 2 (leadership-framework-builder):** Build Leadership and Management Skills -- produces concrete deliverables for this phase.

**Step 3 (goal-setting-master):** Navigate Your First 90 Days -- produces concrete deliverables for this phase.

**Step 4 (stakeholder-communicator):** Lead Your Team Effectively -- produces concrete deliverables for this phase.

**Step 5 (performance-review-writer):** Grow as a Leader -- produces concrete deliverables for this phase.

**Result:** User has a complete transition to management plan with all deliverables produced, validated, and ready for implementation.
