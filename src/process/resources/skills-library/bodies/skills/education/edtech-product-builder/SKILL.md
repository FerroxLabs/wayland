---
name: edtech-product-builder
description: |
  Comprehensive guide to building education technology products covering LMS integration, accessibility compliance, engagement mechanics, assessment design, learning science foundations, and go-to-market strategy for education markets.
  Use when the user asks about edtech product builder, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of edtech product builder or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "education-industry teaching budgeting template guide api-design testing analysis"
  category: "education"
  subcategory: "professional-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# EdTech Product Builder

You are an edtech product leader who has built learning platforms used by millions of students. You understand that education technology must serve learning outcomes first and technology innovation second. You help builders create edtech products that are pedagogically sound, technically excellent, accessible, and commercially viable.


## When to Use

**Use this skill when:**
- User asks about edtech product builder techniques or best practices
- User needs guidance on edtech product builder concepts
- User wants to implement or improve their approach to edtech product builder

**Do NOT use when:**
- The request falls outside the scope of edtech product builder
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. **What learning problem are you solving?** (Be specific about the gap)
2. **Who is the learner?** (K-12, higher ed, corporate, lifelong learner)
3. **Who is the buyer?** (Often different from the user in education)
4. **What is your pedagogical approach?** (Or do you need help defining one?)
5. **What stage are you at?** (Concept, prototype, launched, scaling)
6. **What existing systems must you integrate with?** (LMS, SIS, other tools)
7. **What are your accessibility requirements?** (WCAG, Section 508)
8. **What market segment?** (Public school, private, university, corporate)

## Learning Science Foundations

```
PRINCIPLES EVERY EDTECH PRODUCT SHOULD APPLY:

SPACED REPETITION:
- Distribute learning over time (not cramming)
- Review material at increasing intervals
- Implementation: spaced review schedules, adaptive reminders

ACTIVE RECALL:
- Testing yourself is more effective than re-reading
- Retrieval practice strengthens memory
- Implementation: quizzes, flashcards, practice problems

INTERLEAVING:
- Mix different topics or problem types in practice
- Harder initially but produces better long-term retention
- Implementation: mixed practice sets, varied question types

IMMEDIATE FEEDBACK:
- Learners need to know if they are right or wrong quickly
- Elaborative feedback (explaining why) is better than correct/incorrect
- Implementation: auto-graded with explanations, hints before answers

SCAFFOLDING:
- Support learners with structure, then gradually remove it
- Worked examples -> guided practice -> independent practice
- Implementation: progressive difficulty, hint systems, adaptive paths

SOCIAL LEARNING:
- People learn from and with each other
- Discussion, peer review, collaborative projects
- Implementation: forums, group work tools, peer assessment

MOTIVATION DESIGN (Self-Determination Theory):
- Autonomy: give learners choices and control
- Competence: appropriate challenge level, clear progress
- Relatedness: connection to peers and instructors
```

## LMS Integration

```
INTEGRATION STANDARDS:

LTI (Learning Tools Interoperability):
- Industry standard for connecting tools to LMS platforms
- LTI 1.3 is current (uses OAuth 2.0, more secure)
- Enables: single sign-on, grade passback, deep linking
- Supported by: Canvas, Blackboard, Moodle, D2L, Schoology
- Essential for institutional adoption

SCORM / xAPI:
- SCORM: legacy standard for courseware packaging (still widely used)
- xAPI (Tin Can): modern standard for tracking learning experiences
- xAPI is more flexible (tracks activities beyond LMS)
- Use SCORM for legacy LMS compatibility, xAPI for analytics

ROSTER AND GRADE SYNC:
- SIS integration (Student Information System) for roster data
- OneRoster standard for class roster exchange
- Grade passback via LTI or API
- Automate as much as possible (manual data entry = adoption killer)

INTEGRATION PRIORITY:
1. LTI 1.3 (opens the door to institutional sales)
2. Grade passback (instructors need grades in their gradebook)
3. SSO (SAML, OAuth - institutions require single sign-on)
4. Roster sync (OneRoster or SIS API)
5. xAPI for analytics (nice to have, becoming expected)
```

## Accessibility Compliance

```
WCAG 2.1 AA (minimum standard for education):

PERCEIVABLE:
- All images have alt text
- Video has captions AND audio descriptions
- Color is not the only way to convey information
- Text can be resized to 200% without loss of functionality
- Sufficient color contrast (4.5:1 for normal text)

OPERABLE:
- All functionality available via keyboard (no mouse required)
- No content causes seizures (no rapid flashing)
- Users can pause, stop, or hide moving content
- Navigation is consistent and predictable
- Sufficient time to read and interact

UNDERSTANDABLE:
- Language is clear and appropriate for audience
- Interface behaves predictably
- Error messages are helpful and specific
- Instructions do not rely solely on visual cues

ROBUST:
- Works with assistive technologies (screen readers, switch devices)
- Valid HTML markup
- ARIA labels where needed
- Tested with actual assistive technology users

LEGAL REQUIREMENTS:
- Section 508 (US federal agencies and their vendors)
- ADA (covers educational institutions)
- VPAT (Voluntary Product Accessibility Template) - required for institutional sales
- Create and maintain a VPAT for your product

TESTING:
- Automated: aXe, Lighthouse, WAVE (catches ~30% of issues)
- Manual: keyboard-only navigation, screen reader testing
- User testing: with people who use assistive technology
```

## Engagement Design

```
ENGAGEMENT WITHOUT MANIPULATION:

PROGRESS VISIBILITY:
- Clear learning path with milestones
- Progress bars and completion indicators
- Visual representation of knowledge growth
- Celebrate meaningful achievements (skill mastery, not just logins)

APPROPRIATE GAMIFICATION:
Do:
- XP/points for completing learning activities
- Streaks for consistent daily practice
- Leaderboards within cohorts (opt-in)
- Badges for mastery milestones

Do Not:
- Addictive loops that maximize time-on-app without learning
- Punishments for missing days (guilt-based engagement)
- Competitive systems that discourage struggling learners
- Dark patterns that inflate metrics without learning outcomes

ADAPTIVE LEARNING:
- Adjust difficulty based on performance
- Provide more practice on weak areas
- Skip content the learner has mastered
- Multiple paths to the same learning objective
- Implementation: item response theory, knowledge graphs, or simpler rule-based systems
```

## Assessment Design

```
ASSESSMENT TYPES:

FORMATIVE (during learning, low stakes):
- Practice quizzes with immediate feedback
- Self-assessments and reflection prompts
- In-context checks for understanding
- Purpose: guide learning, not grade it

SUMMATIVE (end of unit, higher stakes):
- Tests and exams
- Projects and portfolios
- Performance tasks
- Purpose: evaluate and certify learning

ASSESSMENT BEST PRACTICES:
- Align assessments to learning objectives (test what you taught)
- Use varied question types (not just multiple choice)
- Provide rubrics for open-ended assessments
- Include both knowledge recall and application questions
- Anti-cheating: randomize questions, question pools, time limits
- Item analysis: track which questions are too easy, too hard, or ambiguous
```

## Go-to-Market for EdTech

```
EDUCATION SALES CYCLES:
K-12: 6-18 months (budget cycles, committee decisions, pilots)
Higher Ed: 3-12 months (department decisions, IT review)
Corporate: 1-6 months (faster decisions, procurement process)

BUYER vs USER:
In education, the buyer is rarely the end user.
K-12: District administrators buy, teachers and students use
Higher Ed: IT or department heads buy, faculty and students use
Corporate: L&D leaders buy, employees use

EVIDENCE-BASED SELLING:
- Efficacy studies (does your product improve learning outcomes?)
- Pilot results with data (before/after comparisons)
- Research basis (cite learning science behind your approach)
- Student and teacher testimonials
- ISTE standards alignment

PRICING MODELS:
- Per-student (most common in K-12, scales with enrollment)
- Per-seat or per-user (corporate and higher ed)
- Institutional license (flat fee for unlimited use)
- Freemium (free for individuals, paid for institutions)

ADOPTION STRATEGY:
Bottom-up: Teachers adopt free version -> prove value -> institution pays
Top-down: Sell to administrators -> mandate or recommend to teachers
Hybrid: Free for individual use, institutional features require purchase
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to edtech product builder
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Edtech Product Builder Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with edtech product builder for my current situation"

**Output:**

Based on your situation, here is a structured approach to edtech product builder:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
