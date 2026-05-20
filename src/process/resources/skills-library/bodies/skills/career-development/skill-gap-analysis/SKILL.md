---
name: skill-gap-analysis
description: |
  Compares current skills against target role requirements, identifies specific gaps,
  and recommends concrete learning paths per gap. Produces a gap analysis matrix with
  prioritized action items and time estimates.
  Use when the user wants to identify what skills they need for a target role, assess
  readiness for a promotion, or build a professional development plan based on gaps.
  Do NOT use for full career change roadmaps (use career-pivot-roadmap), resume writing
  (use resume-bullet-writer), or academic learning plans (use study-plan-generator).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "career analysis goal-setting planning"
  category: "career-development"
  subcategory: "career-growth"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Skill Gap Analysis

## When to Use

- User wants to know what skills they need for a specific target role
- User asks to compare their current skills against job requirements
- User wants a professional development plan based on skill gaps
- User needs to assess readiness for a promotion or lateral move
- User asks "what do I need to learn to become a [target role]?"
- Do NOT use when: user wants a full career pivot roadmap with timeline and networking (use `career-pivot-roadmap`), user needs resume help (use `resume-bullet-writer`), user wants academic study plans (use `study-plan-generator`)

## Process

1. **Collect current profile.** Gather the user's current skill inventory:
   - Current role and title
   - Years of experience in current role and field
   - Hard skills with self-assessed proficiency (beginner, intermediate, advanced, expert)
   - Soft skills the user considers strengths
   - Certifications, degrees, or formal training completed
   - Tools and technologies used regularly

2. **Define target role requirements.** Build the requirements profile:
   - Target role title and level (junior, mid, senior, lead, director)
   - Industry or company type (startup, enterprise, agency, government)
   - List 8-15 skills typically required for the target role
   - Categorize each as: must-have (appears in most job descriptions) or nice-to-have (differentiator)
   - Include both hard skills (tools, techniques, knowledge) and soft skills (leadership, communication)

3. **Build the gap matrix.** For each target skill, assess the gap:
   - Current level: none, beginner, intermediate, advanced, expert
   - Required level: the minimum proficiency needed for the target role
   - Gap size: none (meets or exceeds), small (minor improvement needed), medium (significant learning needed), large (starting from zero)
   - Priority: blocking (cannot get hired without it), important (strongly expected), helpful (differentiator)

4. **Design learning paths.** For each gap rated medium or large:
   - Recommend a specific learning approach: self-study, formal course, mentorship, project-based learning, on-the-job development
   - Estimate time to reach the required level (in weeks or months)
   - Identify 1-2 milestone markers that indicate the gap is closing
   - Suggest a way to demonstrate the skill (project, certification, portfolio piece)

5. **Prioritize and sequence.** Order the learning plan:
   - Blocking gaps first (these prevent getting hired)
   - Important gaps second (these win interviews)
   - Helpful gaps third (these differentiate)
   - Within each priority, sequence by: fastest to close first (builds momentum) or highest impact first (user preference)
   - Estimate total time to close all blocking and important gaps

## Output Format

```
## Skill Gap Analysis: [Current Role] to [Target Role]

**Date:** [Date]
**Current role:** [Role] ([X] years experience)
**Target role:** [Role] at [Level]

---

### Skills You Already Have

| Skill | Your Level | Required Level | Status |
|-------|-----------|---------------|--------|
| [Skill 1] | [Advanced] | [Advanced] | Meets requirement |
| [Skill 2] | [Intermediate] | [Intermediate] | Meets requirement |
| [Skill 3] | [Expert] | [Advanced] | Exceeds requirement |

### Skill Gaps

| Skill | Your Level | Required Level | Gap Size | Priority |
|-------|-----------|---------------|----------|----------|
| [Skill 1] | [None] | [Intermediate] | Large | Blocking |
| [Skill 2] | [Beginner] | [Advanced] | Medium | Blocking |
| [Skill 3] | [None] | [Beginner] | Medium | Important |
| [Skill 4] | [Beginner] | [Intermediate] | Small | Helpful |

### Readiness Score

- **Blocking gaps:** [X] of [Y] must-have skills met
- **Overall readiness:** [X]% of target role requirements covered
- **Estimated time to interview-ready:** [X] weeks/months

---

### Learning Plan

#### Priority 1: Blocking Gaps

**[Skill Name] -- [Gap Size]**
- **Current:** [Level] | **Target:** [Level]
- **Learning approach:** [Self-study / Course / Project-based / Mentorship]
- **Time estimate:** [X weeks/months]
- **Milestones:**
  1. [Specific milestone indicating progress]
  2. [Specific milestone indicating competence]
- **Demonstration:** [How to prove this skill -- project, cert, portfolio piece]

**[Skill Name] -- [Gap Size]**
- **Current:** [Level] | **Target:** [Level]
- **Learning approach:** [Approach]
- **Time estimate:** [X weeks/months]
- **Milestones:**
  1. [Milestone 1]
  2. [Milestone 2]
- **Demonstration:** [Proof of competence]

#### Priority 2: Important Gaps

[Same format as above for each important gap]

#### Priority 3: Helpful Gaps (Differentiators)

[Same format as above for each helpful gap]

---

### Summary

| Metric | Value |
|--------|-------|
| Total skills assessed | [X] |
| Skills meeting requirements | [X] |
| Blocking gaps to close | [X] |
| Important gaps to close | [X] |
| Estimated time to close blocking gaps | [X weeks/months] |
| Estimated time to close all gaps | [X weeks/months] |

### Recommended Sequence

1. [First skill to learn -- why first]
2. [Second skill to learn -- why second]
3. [Third skill to learn -- why third]
```

## Rules

1. Always produce a complete gap analysis matrix with specific skill-by-skill assessment -- never generic advice about "upskilling"
2. Every gap must have a concrete learning path with time estimate and demonstration method -- not vague suggestions like "learn more about X"
3. NEVER recommend specific courses, schools, or training providers by name -- describe the type of learning needed and let the user choose
4. Categorize every target skill as blocking, important, or helpful -- this three-tier priority system drives the learning sequence
5. Include a readiness score showing what percentage of target requirements the user already meets
6. Time estimates must be realistic for someone learning while employed (assume 5-10 hours per week of study time unless the user specifies otherwise)
7. If the user's self-assessment seems inflated (claims expert level in many areas with few years of experience), flag this diplomatically and suggest validation methods
8. ALWAYS include the "Skills You Already Have" section to acknowledge existing competence -- gap analysis should motivate, not demoralize
9. The learning plan must be sequenced, not just listed -- order matters because some skills build on others
10. If the gap between current and target roles spans more than 12 months of skill-building, flag this and suggest intermediate stepping-stone roles

## Edge Cases

- **User cannot identify their current skills:** Walk them through a structured inventory by asking about: daily tasks (what tools do they use?), past projects (what did they build or deliver?), feedback received (what do colleagues say they are strong at?), and formal training completed. Build the current skills list from their answers.
- **Target role is too vague (e.g., "tech job"):** Ask clarifying questions to narrow to a specific role. Offer 2-3 concrete role options that match what the user has described and proceed with whichever they choose.
- **User already meets all requirements:** Celebrate this, then identify differentiator skills that would make them a standout candidate rather than a qualified one. Shift the analysis from "gap closing" to "competitive advantage building."
- **Massive gap (5+ blocking skills, all large):** Be honest about the timeline. Suggest an intermediate role that closes 2-3 of the gaps through on-the-job experience, then a second move to the ultimate target. Frame this as a two-step career ladder, not a failure.
- **User is a student or recent graduate:** Adjust expectations for "current level" -- academic knowledge counts but weight it lower than professional experience. Emphasize projects, internships, and demonstrable output over years of experience.

## Example

**Input:** "I'm a marketing coordinator with 3 years of experience. I want to become a product manager at a tech company. I'm familiar with basic analytics, project coordination, and stakeholder communication. What gaps do I need to close?"

**Output:**

## Skill Gap Analysis: Marketing Coordinator to Product Manager

**Date:** [Current date]
**Current role:** Marketing Coordinator (3 years experience)
**Target role:** Product Manager at mid-size tech company (mid-level)

---

### Skills You Already Have

| Skill | Your Level | Required Level | Status |
|-------|-----------|---------------|--------|
| Stakeholder communication | Intermediate | Intermediate | Meets requirement |
| Project coordination | Intermediate | Intermediate | Meets requirement |
| Basic analytics (campaign metrics) | Intermediate | Intermediate | Meets requirement (different domain) |
| Cross-functional collaboration | Intermediate | Intermediate | Meets requirement |
| Market research | Intermediate | Intermediate | Meets requirement |

### Skill Gaps

| Skill | Your Level | Required Level | Gap Size | Priority |
|-------|-----------|---------------|----------|----------|
| Product strategy and roadmapping | None | Intermediate | Large | Blocking |
| User research and discovery | Beginner | Intermediate | Medium | Blocking |
| Technical literacy (APIs, databases, dev process) | None | Intermediate | Large | Blocking |
| Data analysis (SQL, product metrics) | Beginner | Intermediate | Medium | Important |
| Agile/Scrum methodology | Beginner | Intermediate | Small | Important |
| Wireframing and prototyping | None | Beginner | Medium | Helpful |
| A/B testing and experimentation | Beginner | Intermediate | Small | Helpful |

### Readiness Score

- **Blocking gaps:** 2 of 5 must-have skills met
- **Overall readiness:** 42% of target role requirements covered
- **Estimated time to interview-ready:** 5-7 months (at 8 hours/week study)

---

### Learning Plan

#### Priority 1: Blocking Gaps

**Product Strategy and Roadmapping -- Large Gap**
- **Current:** None | **Target:** Intermediate
- **Learning approach:** Self-study of product management frameworks, then apply to a real or simulated product
- **Time estimate:** 8 weeks
- **Milestones:**
  1. Can articulate a product vision, identify user problems, and prioritize features using RICE or similar framework
  2. Complete a mock product roadmap for an existing product, with rationale for prioritization decisions
- **Demonstration:** Written product roadmap case study for portfolio

**User Research and Discovery -- Medium Gap**
- **Current:** Beginner | **Target:** Intermediate
- **Learning approach:** Self-study followed by 5 practice user interviews with friends or colleagues
- **Time estimate:** 4 weeks
- **Milestones:**
  1. Can write an interview guide, conduct a 30-minute user interview, and synthesize findings
  2. Complete a discovery report based on 5 interviews about a real product pain point
- **Demonstration:** User research report with methodology, findings, and recommendations

**Technical Literacy -- Large Gap**
- **Current:** None | **Target:** Intermediate
- **Learning approach:** Structured self-study covering APIs, databases, and the software development lifecycle
- **Time estimate:** 6 weeks
- **Milestones:**
  1. Can explain what an API does, read basic API documentation, and describe a database query in plain language
  2. Can participate in a technical design discussion, ask relevant questions, and understand tradeoffs engineers describe
- **Demonstration:** Write a technical specification for a simple feature describing API requirements and data model

#### Priority 2: Important Gaps

**Data Analysis (SQL, Product Metrics) -- Medium Gap**
- **Current:** Beginner | **Target:** Intermediate
- **Learning approach:** SQL tutorial followed by hands-on practice with sample datasets
- **Time estimate:** 4 weeks
- **Milestones:**
  1. Can write SELECT, JOIN, WHERE, GROUP BY queries to answer product questions
  2. Can define and calculate key product metrics (DAU, retention, conversion, funnel drop-off)
- **Demonstration:** Analysis of a sample product dataset with written insights and recommendations

**Agile/Scrum Methodology -- Small Gap**
- **Current:** Beginner | **Target:** Intermediate
- **Learning approach:** Self-study of Scrum framework, then observe or participate in a real sprint cycle
- **Time estimate:** 2 weeks
- **Milestones:**
  1. Can explain sprint planning, daily standup, sprint review, and retrospective
  2. Can write user stories with acceptance criteria
- **Demonstration:** Set of 10 user stories for a product feature with acceptance criteria

#### Priority 3: Helpful Gaps (Differentiators)

**Wireframing and Prototyping -- Medium Gap**
- **Current:** None | **Target:** Beginner
- **Learning approach:** Learn basic wireframing in a design tool through tutorial and practice
- **Time estimate:** 3 weeks
- **Milestones:**
  1. Can create low-fidelity wireframes for a simple user flow (3-5 screens)
  2. Can use wireframes to communicate a feature concept to stakeholders
- **Demonstration:** Wireframed feature concept included in product roadmap case study

---

### Summary

| Metric | Value |
|--------|-------|
| Total skills assessed | 12 |
| Skills meeting requirements | 5 |
| Blocking gaps to close | 3 |
| Important gaps to close | 2 |
| Estimated time to close blocking gaps | 4-5 months (at 8 hrs/week) |
| Estimated time to close all gaps | 6-7 months (at 8 hrs/week) |

### Recommended Sequence

1. Product strategy and roadmapping -- foundational PM skill, everything else builds on this
2. Technical literacy -- needed to have credible conversations with engineers during interviews
3. User research -- completes the core PM triad (strategy + technical + user)
4. Data analysis (SQL) -- strengthens analytical credibility and interview performance
5. Agile methodology -- quick win, small gap, rounds out the profile
6. Wireframing -- differentiator, learn last since it is helpful but not blocking
