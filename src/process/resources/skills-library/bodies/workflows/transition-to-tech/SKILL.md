---
name: transition-to-tech
description: >-
  Complete career transition workflow for professionals from non-technical
  backgrounds who want to enter the technology industry. Covers honest
  self-assessment and role discovery, building technical skills through
  structured learning, creating a portfolio that demonstrates competence,
  applying strategically, and landing your first tech role.

  Use when the user wants to transition to tech or needs a structured multi-step
  process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "career-pivot-advisor learning-accelerator personal-brand-architect resume-builder interview-coach"
trigger_phrases: >-
  I want to transition to tech switch careers to technology break into tech
  non-technical to tech career become a software developer get into tech without
  a degree career change to technology
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: career study-skills interview-prep step-by-step planning
  category: career
  depends: "career-pivot-advisor learning-accelerator personal-brand-architect resume-builder interview-coach"
---
# Transition To Tech

**Estimated time:** 3-9 months

This workflow guides non-technical professionals through a strategic transition
into the technology industry. "Tech" encompasses far more than software
engineering -- product management, UX design, data analysis, technical writing,
DevOps, QA, and dozens of other roles welcome career changers who bring domain
expertise and fresh perspectives.

The transition requires honest self-assessment, structured skill building, a
portfolio that speaks louder than a degree, strategic job search, and interview
preparation that addresses the career change narrative. This workflow helps
you avoid the common trap of endlessly learning without ever applying, and
the opposite trap of applying before you are ready.

By the end of this workflow you will have: a clear target role in tech, the
skills required for entry-level positions, a portfolio demonstrating your
capabilities, a tech-optimized job search, and the confidence to land and
succeed in your first tech role.

## When to Use

- User wants to transition to tech
- User needs a structured, step-by-step process for transition to tech
- User wants to transition to tech
- switch careers to technology
- break into tech
- Do NOT use when: the request is outside the scope of transition to tech or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Genuine interest in technology (not just following the money)
- Willingness to start as a beginner in a new domain
- Dedicated learning time (15-25 hours per week recommended for a faster transition)
- A computer with internet access for learning and building
- Financial stability during the transition period (learning takes time)
- Comfort with ambiguity and discomfort (changing careers is hard)

## Steps

**Step 1: Assess Your Fit and Choose Your Path** (uses: career-pivot-advisor)

map the user's background to viable
tech career paths and choose the right entry point. "Breaking into tech" is
too vague -- you need a specific target role.

- Input: current career, skills, and educational background, Their interest in technology and what specifically attracts them, Previous exposure to tech (if any) -- personal projects, tech-adjacent work
- Output: Chosen target tech role with rationale and alternatives, Current skills mapped to target role requirements, Selected learning path with timeline and cost
- Key focus: Transferable skills mapping: identify skills from your current career that

**Step 2: Build Technical Skills** (uses: learning-accelerator)

build the technical competencies your
target role requires. This is the longest phase and requires sustained
discipline. The goal is job-ready competence, not mastery.

- Input: `role-selection` from Step 1 (specific skills to build), `education-path` from Step 1 (learning approach), `transferable-skills-map` from Step 1 (existing strengths to build on)
- Output: Week-by-week learning plan with specific resources, Target role skills with proficiency self-assessment, Projects completed during the learning phase
- Key focus: Core curriculum design: identify the specific skills and tools your target

**Step 3: Build Your Portfolio** (uses: personal-brand-architect)

build a portfolio that demonstrates
your capabilities to hiring managers. For career changers without tech work
experience, the portfolio IS your resume.

- Input: `learning-projects` from Step 2 (projects to showcase), `role-selection` from Step 1 (what hiring managers want to see), `transferable-skills-map` from Step 1 (domain advantage to highlight)
- Output: 3-5 polished projects with documentation, Published personal portfolio website, Cleaned-up GitHub with organized repositories
- Key focus: Portfolio project selection: 3-5 projects that demonstrate the skills

**Step 4: Apply Strategically** (uses: resume-builder)

create application materials optimized for a
career changer entering tech. Your resume must tell a compelling transition
story while passing ATS filters.

- Input: `portfolio-projects` from Step 3 (work to reference in applications), `role-selection` from Step 1 (target role for resume optimization), `transferable-skills-map` from Step 1 (career change framing)
- Output: Career-change resume optimized for tech roles, Tech career change cover letter with narrative, System for tracking applications and follow-ups
- Key focus: Career-change resume format: combination format that leads with skills

**Step 5: Land Your First Tech Role** (uses: interview-coach)

prepare for tech interviews as a career
changer. Tech interviews vary significantly by role, and career changers
face unique questions.

- Input: `tech-resume` from Step 4 (consistent messaging), `portfolio-projects` from Step 3 (projects to discuss in interviews), `transferable-skills-map` from Step 1 (career change narrative)
- Output: Prepared answers for career-change-specific questions, Rehearsed presentation of portfolio projects, Role-specific technical interview preparation
- Key focus: The career change story: "Why tech?" and "Why now?" must be answered

## Decision Points

- **After each step:** Evaluate output quality before proceeding. If output is insufficient, iterate on the current step before moving forward.
- **Mid-workflow:** If circumstances change significantly, re-evaluate earlier steps before continuing.

## Failure Handling

- **Tutorial hell:** Endlessly taking courses without building anything. After initial learning, switch to project-based learning immediately.
- **Targeting too broadly:** "I want to work in tech" is not specific enough. Choose one role and focus all preparation on it.
- **Hiding your previous career:** Your non-tech background is an asset, not a liability. Companies value domain expertise and diverse perspectives.
- **Comparing yourself to CS graduates:** You are not competing with them on the same terms. Your portfolio, domain expertise, and maturity are your weapons.
- **Waiting until you feel ready:** Imposter syndrome will tell you to study more. Start applying when your portfolio has 3 solid projects, even if you feel unprepared.

## Expected Outcome

When this workflow is complete, the user will have:

1. A specific tech role is chosen based on fit, demand, and personal interest
2. Technical skills are built through structured learning and hands-on practice
3. A portfolio demonstrates competence with 3-5 polished projects
4. Application materials frame the career change as an advantage
5. Interview preparation addresses career-change-specific challenges
6. At least one offer for a tech role is received
7. The new role provides a foundation for long-term tech career growth

## Output Format

```
TRANSITION TO TECH TRACKER
==========================

[ ] Step 1: Assess Your Fit and Choose Your Path
    Status: [pending/in-progress/complete]
[ ] Step 2: Build Technical Skills
    Status: [pending/in-progress/complete]
[ ] Step 3: Build Your Portfolio
    Status: [pending/in-progress/complete]
[ ] Step 4: Apply Strategically
    Status: [pending/in-progress/complete]
[ ] Step 5: Land Your First Tech Role
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Tutorial hell:** Endlessly taking courses without building anything. After initial learning, switch to project-based learning immediately.
- **Targeting too broadly:** "I want to work in tech" is not specific enough. Choose one role and focus all preparation on it.
- **Hiding your previous career:** Your non-tech background is an asset, not a liability. Companies value domain expertise and diverse perspectives.
- **Comparing yourself to CS graduates:** You are not competing with them on the same terms. Your portfolio, domain expertise, and maturity are your weapons.

## Example

**Input:** "I want to transition to tech and need a structured plan to follow step by step."

**Output:**

**Step 1 (career-pivot-advisor):** Assess Your Fit and Choose Your Path -- produces concrete deliverables for this phase.

**Step 2 (learning-accelerator):** Build Technical Skills -- produces concrete deliverables for this phase.

**Step 3 (personal-brand-architect):** Build Your Portfolio -- produces concrete deliverables for this phase.

**Step 4 (resume-builder):** Apply Strategically -- produces concrete deliverables for this phase.

**Step 5 (interview-coach):** Land Your First Tech Role -- produces concrete deliverables for this phase.

**Result:** User has a complete transition to tech plan with all deliverables produced, validated, and ready for implementation.
