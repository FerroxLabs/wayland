---
name: switch-careers
description: |
  Guides the user through a complete career transition from current field to a
  new one, spanning 3-12 months with 6 steps covering roadmap creation, skill
  gap analysis, industry research, portfolio building, networking, and job
  search. Explicitly branches at Step 1 on currently-employed vs. unemployed
  status, which affects timeline, risk tolerance, and resource allocation at
  every subsequent step. Use when the user wants to change careers to a
  different field or industry. Do NOT use for job searching within the same
  field (use land-new-job workflow), negotiating at current employer (use
  negotiate-raise workflow), or starting a freelance practice (use
  start-freelancing workflow).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "career planning step-by-step guide"
  category: "career"
  depends: "career-pivot-roadmap skill-gap-analysis industry-research-framework portfolio-building-plan networking-message-writer job-search-strategy"
  disclaimer: "none"
  difficulty: "advanced"
---

# Switch Careers

**Estimated time:** 3-12 months (depending on skill gap size, target industry requirements, and whether the user is currently employed)

This workflow orchestrates 6 career-development skills into a complete career transition pipeline. A career switch is fundamentally different from a job search within the same field -- it requires identifying and closing skill gaps, building a new portfolio, and developing a professional network in a new industry. The workflow explicitly handles the most critical variable: whether the user is currently employed (has financial runway but limited time) or unemployed (has time but financial pressure). This single variable affects every step in the process.

## When to Use

- User wants to transition from one career field to a substantially different one (e.g., teaching to UX design, finance to software engineering, marketing to data analysis)
- User feels stuck in their current field and wants a structured plan for making the change
- User has identified a target field but does not know how to bridge the gap between their current skills and the new field's requirements
- User has been informally exploring a new field and is ready to commit to a structured transition
- Do NOT use when: user wants to find a new job in their current field (use `land-new-job` workflow), user wants to negotiate a raise or promotion (use `negotiate-raise` workflow), user wants to go freelance in their current skill set (use `start-freelancing` workflow), user is considering career options but has not chosen a direction (they need exploration first, not a transition plan)

## Prerequisites

Before starting this workflow, ensure:

1. **Target field identified:** The user has a clear target career field (not just "something different"). If they are still exploring, they should research options before entering this structured pipeline.
2. **Financial assessment completed:** The user knows how many months of expenses they can cover during the transition. This determines whether a full-time transition or a gradual while-employed approach is appropriate.
3. **Realistic timeline expectation:** Career switches typically take 3-12 months. The user should be prepared for a multi-month process, not a 2-week pivot.
4. **Willingness to invest in learning:** Most career switches require skill building -- courses, certifications, projects, or self-directed learning. The user should be prepared for this investment of time and potentially money.

## Steps

**Step 1: Create the Career Pivot Roadmap** (uses: career-pivot-roadmap)

Map the transition from the user's current career to their target career. This is the master plan that all other steps execute against. This step MUST explicitly branch on employment status because it determines the entire transition strategy.

**If currently employed:**
The roadmap emphasizes a gradual transition. The user keeps their income while building skills and network in the new field during evenings, weekends, and any available professional development time. Timeline: 6-12 months. Key constraint: limited time per week (10-15 hours) for transition activities. Key advantage: financial stability allows for selective job targeting and longer ramp-up.

**If currently unemployed:**
The roadmap emphasizes an accelerated transition. The user dedicates full-time effort (40+ hours per week) to skill building, portfolio creation, and networking. Timeline: 3-6 months. Key constraint: financial runway limits how long the transition can take. Key advantage: full-time focus enables faster skill acquisition and more networking activity.

- Input: User's current career (field, skills, experience level), target career (field, target role, known requirements), employment status, financial runway, and any existing skills that transfer
- Output: Phased roadmap with monthly milestones, a timeline calibrated to employment status, transferable skills inventory, and a list of gaps to address in Steps 2-5
- Key focus: Identify transferable skills early -- they are the bridge that makes the transition credible to hiring managers. A marketing professional moving to UX design transfers user research, A/B testing, and audience empathy. A teacher moving to corporate training transfers curriculum design, presentation skills, and needs assessment.

**Step 2: Analyze and Prioritize Skill Gaps** (uses: skill-gap-analysis)

Compare the user's current skill set against the requirements of entry-level to mid-level roles in the target field. Prioritize gaps by importance (must-have vs. nice-to-have) and closability (can learn in weeks vs. requires months of practice).

- Input: Career pivot roadmap from Step 1, 5-10 job descriptions for target roles, user's current skill inventory including transferable skills
- Output: Prioritized skill gap matrix with: must-have skills (blocks getting hired without them), nice-to-have skills (differentiators but not blockers), estimated time to close each gap, and recommended learning resources or approaches for each
- Key focus: Distinguish between "need to be proficient" and "need to be expert." Career switchers often over-invest in depth when breadth across must-have skills is more important for getting hired. Also identify which gaps can be closed through portfolio projects (Step 4) rather than formal courses -- learning by building is faster and produces interview-ready evidence.

**Step 3: Research the Target Industry** (uses: industry-research-framework)

Conduct structured research on the target industry's hiring practices, culture, compensation norms, career paths, and current market conditions. This informs realistic expectations and helps the user speak the industry's language during networking and interviews.

- Input: Target career field, prioritized skill gaps from Step 2, geographic preferences or constraints
- Output: Industry research brief covering: typical hiring pipelines (how people actually get hired in this field), compensation ranges by level, industry-specific terminology and cultural norms, key companies and employers, professional communities and events, and current market conditions (growing, stable, or contracting)
- Key focus: Focus on how people actually enter this field as career switchers, not just how people who grew up in the field advanced. Many fields have well-known entry paths for career changers (bootcamps for software, certification programs for project management, portfolio-based hiring for design). Identify these paths specifically.

**Step 4: Build a Transition Portfolio** (uses: portfolio-building-plan)

Create a portfolio that demonstrates competence in the target field using the skills identified in Step 2 and the industry context from Step 3. The portfolio replaces the years of direct experience the user does not have.

- Input: Prioritized skill gaps from Step 2, industry research from Step 3, the user's existing transferable skills and projects
- Output: Portfolio plan with 3-5 projects that demonstrate must-have skills, each project scoped with description, skills demonstrated, estimated completion time, and presentation format appropriate for the target industry
- Key focus: Portfolio projects should solve real problems in the target industry, not just demonstrate technical skills. A career switcher into data analysis should analyze a real dataset and present insights, not just show they can write SQL queries. A switcher into UX design should redesign an existing product's user flow, not just create wireframes in a vacuum. Each project should include a case study narrative explaining the problem, approach, and outcome.

**Step 5: Build Your Network in the New Field** (uses: networking-message-writer)

Write and send targeted outreach messages to professionals in the target field for informational interviews, mentorship, referrals, and general connection building. Networking is the primary way career switchers get hired -- referrals bypass the resume screening that automatically filters out non-traditional backgrounds.

- Input: Target industry and roles from Steps 1-3, portfolio from Step 4 (if ready), the user's existing network connections who might bridge to the new field
- Output: Networking message templates for 4 scenarios: cold outreach to industry professionals, warm introduction requests through mutual connections, informational interview requests, and follow-up messages after conversations. Also: weekly networking targets and tracking system.
- Key focus: Lead with curiosity and specificity, not desperation. "I'm transitioning from marketing to UX design and I'd love to hear about your experience at [Company] -- specifically how your team approaches user research" is stronger than "I'm looking for a job in UX, can you help?" Target 3-5 informational interviews per week. Every conversation should end with asking for 1-2 additional introductions.

**Step 6: Execute the Job Search in the New Field** (uses: job-search-strategy)

Build and execute a job search strategy specifically designed for career switchers. This differs from a standard job search because the user is competing against candidates with traditional backgrounds, which requires different positioning, application strategies, and interview approaches.

- Input: Updated resume reframed for the target field, portfolio from Step 4, network contacts from Step 5, industry insights from Step 3
- Output: Career-switcher job search plan with: target role list (prioritizing companies known for hiring non-traditional candidates), application strategy emphasizing referrals over cold applications, interview preparation addressing the "why are you switching?" question, and weekly execution targets
- Key focus: Referrals from Step 5 networking are the primary channel -- career switchers are 5-10x more likely to get interviews through referrals than cold applications. Prioritize companies that explicitly value diverse backgrounds. Prepare a compelling 2-minute career narrative that frames the switch as intentional and additive ("My marketing background gives me a unique perspective on user behavior that complements my new UX skills") rather than reactive ("I was unhappy in marketing").

## Decision Points

- **At Step 1:** If currently employed, proceed with the gradual transition timeline (6-12 months, 10-15 hours per week for transition activities). If currently unemployed, proceed with the accelerated timeline (3-6 months, full-time effort). This is the fundamental branch that affects every subsequent step's pacing, depth, and risk tolerance.

- **After Step 2:** If the skill gap analysis reveals that must-have skills require more than 6 months of dedicated learning (e.g., a career switch that requires a degree or professional certification), the user must decide: (a) commit to the longer timeline with the understanding it may take 12-18 months, (b) target a different entry point in the field that requires fewer must-have skills, or (c) reconsider the target field entirely.

- **After Step 2:** If the user is switching to an adjacent field (e.g., marketing to product management, accounting to financial analysis), many skills transfer directly and the gap may be closable in 4-8 weeks. In this case, Steps 4-5 can run concurrently to accelerate the timeline.

- **After Step 3:** If industry research reveals the target field is contracting (layoffs, hiring freezes, declining demand), the user must decide: (a) proceed but extend the timeline and lower expectations, (b) target a sub-specialty within the field that is growing, or (c) pivot to a related field with better market conditions.

- **After Step 4:** If the user's portfolio projects receive positive feedback from industry professionals met during Step 5 networking, confidence is high and they should proceed to Step 6 aggressively. If feedback is lukewarm or identifies significant gaps, return to Step 4 and revise before launching the job search.

- **At Step 6:** If the user is currently employed and receives a job offer in the new field at lower compensation than their current role, they must weigh: the compensation gap, career trajectory in the new field, whether a lower title now leads to faster growth later, and their financial ability to absorb a temporary pay cut. This is the most personal decision in the workflow.

## Failure Handling

- **Step 2 fails (skill gap too large for timeline):** If the gap analysis reveals the target field requires skills that genuinely take years to develop (e.g., switching to medicine, law, or PhD-level research), the user has two options: (a) accept the longer timeline and treat this as a multi-year plan, or (b) identify a related role that leverages more transferable skills and requires a smaller gap to close. For example, instead of switching from marketing to software engineering, consider switching to technical product management -- a role that values both marketing and technical understanding.

- **Step 5 fails (networking not producing connections):** If outreach messages get no responses after 20+ attempts over 3 weeks, audit the messages for common problems: too long, too generic, asking for too much too soon, or targeting the wrong people. Try different channels (LinkedIn InMail vs. email vs. community forums). Consider attending industry events, meetups, or online communities where casual interaction builds rapport before formal outreach.

- **Step 4 fails (portfolio insufficient for industry):** If industry feedback (from Step 5 networking conversations) indicates the portfolio does not meet the target industry's standards, the user has two options: (a) invest more time in higher-quality projects (extend the timeline by 4-8 weeks), or (b) shift the strategy to focus on roles that weight interview performance over portfolio (some fields do not require portfolios, even if they prefer them). Never launch a job search with a portfolio that industry insiders rate as below-standard.

- **Step 6 fails (no offers after extensive search):** If the user applies for 30+ roles, has 5+ interviews, and receives no offers over 6 weeks, the problem is usually one of three things: (a) interview skills need improvement (prepare more thoroughly, do mock interviews with industry contacts), (b) targeting is too aggressive (applying for roles that require 3+ years in the field when the user has zero), or (c) the career narrative is not compelling (the user has not articulated why the switch makes them a stronger candidate, not a weaker one). Address the specific failure pattern before continuing to apply.

- **User wants to change direction:** If during Steps 3-4 the user realizes the target field is not what they expected (culture mismatch, compensation disappointment, daily work is not what they imagined), this is valuable information gained without a full commitment. Return to Step 1 with a revised target. The skills built in the current transition (research, networking, portfolio building) often transfer to a new target.

## Output Format

```
## Career Transition Plan: [Current Field] -> [Target Field]

### Employment Status Branch
- Status: [currently employed / unemployed]
- Timeline: [N months]
- Weekly hours for transition: [N hours]
- Financial runway: [N months]

### Step 1: Pivot Roadmap
- Transferable skills: [list]
- Phase 1 (months 1-N): [focus area]
- Phase 2 (months N-M): [focus area]
- Phase 3 (months M-end): [focus area]

### Step 2: Skill Gap Analysis
- Must-have skills: [list with estimated learning time]
- Nice-to-have skills: [list]
- Total gap-closing time: [N weeks/months]
- Recommended learning path: [courses, projects, certifications]

### Step 3: Industry Research
- Market condition: [growing / stable / contracting]
- Entry salary range: $[low] - $[high]
- Common entry paths for switchers: [list]
- Key employers: [list]

### Step 4: Portfolio Plan
- Projects: [count]
- Skills demonstrated per project: [list]
- Estimated completion: [N weeks]

### Step 5: Network Building
- Outreach targets: [count per week]
- Informational interviews: [count per week]
- Communities joined: [list]
- Connections built: [count]

### Step 6: Job Search
- Target roles: [list]
- Primary channel: [referrals / applications / recruiters]
- Career narrative: [one-sentence summary]
- Weekly application target: [count]

### Current Status
- Active phase: [Phase N]
- Months elapsed: [N] / [total]
- Key milestone: [next milestone]
```

## Edge Cases

- **User wants to switch to a field requiring formal credentials (nursing, law, accounting):** The skill gap in Step 2 will identify a multi-year credential requirement. The workflow adjusts by reframing Step 4 portfolio as admission materials and Step 5 networking as finding mentors in the credentialing process. The job search in Step 6 is deferred until credentials are obtained.

- **User is over 50 and concerned about age discrimination:** Step 1 roadmap should address this directly: emphasize the depth and breadth of experience as assets, target companies known for valuing experienced hires, and in Step 6 focus on networking-based hiring where personal connections overcome resume-screening bias.

- **User's current skills have zero transferable overlap with target field:** Rare but possible (e.g., manual laborer to software engineer). Step 2 will show an extensive gap list. The roadmap in Step 1 must set realistic expectations (12-18 months minimum) and Step 4 portfolio becomes the primary credibility tool since no prior experience transfers.

- **User is currently employed but at risk of layoff:** Hybrid urgency: proceed with the employed branch for pacing but accelerate Steps 2-4 in case unemployment arrives mid-transition. Build a financial buffer plan alongside the career switch plan.

- **User has family obligations limiting available time:** For users with less than 5 hours per week for transition activities, extend the timeline proportionally. A 9-month plan at 10 hours per week becomes an 18-month plan at 5 hours per week. Adjust milestones accordingly in Step 1.

- **User discovers during Step 3 that target field compensation is significantly lower than current field:** This is a valid reason to reconsider. Present the data factually in the industry research brief and let the user decide. Some career switchers accept lower initial pay for better long-term satisfaction or growth. Others decide the financial gap is too large and choose a different target.

## Expected Outcome

When this workflow is complete, the user will have:

1. A phased career transition roadmap calibrated to their employment status, financial runway, and target timeline
2. A prioritized skill gap analysis with specific learning plans for each must-have skill
3. An industry research brief that provides realistic expectations about hiring, compensation, and career paths in the target field
4. A portfolio of 3-5 projects demonstrating competence in the target field, with case study narratives
5. A professional network in the target field with at least 10-15 meaningful connections and ongoing informational interview relationships
6. A career-switcher job search strategy optimized for referral-based hiring with a compelling career transition narrative

## Example

**Input:** "I'm a high school history teacher with 7 years of experience. I want to transition to instructional design in the corporate learning space. I'm currently employed and plan to keep teaching while I make the switch."

**Output:**

**Step 1 (career-pivot-roadmap):**
Employment status: currently employed. The roadmap sets a 9-month timeline with 10-15 hours per week dedicated to the transition. Transferable skills identified: curriculum design, needs assessment, content creation, learner assessment, presentation skills, and experience managing diverse learning styles. Phase 1 (months 1-3): skill building. Phase 2 (months 4-6): portfolio building. Phase 3 (months 7-9): networking and job search.

**Step 2 (skill-gap-analysis):**
Must-have gaps: authoring tools (Articulate Storyline, Rise), corporate learning management systems, instructional design models (ADDIE, SAM), and workplace learning measurement. Nice-to-have gaps: video production, graphic design basics. Estimated time to close must-haves: 8-12 weeks of 10 hours per week. Recommended: Articulate certification course (40 hours), 2 ADDIE-model practice projects.

**Step 3 (industry-research-framework):**
Corporate L&D industry is growing (remote work increased demand for structured digital learning). Entry-level instructional designer salaries range $55-75K, competitive with teaching in most markets. Career switchers from teaching are common and valued -- but they need to demonstrate they can work in corporate context (faster timelines, business outcome orientation, different stakeholder dynamics than school administration).

**Step 4 (portfolio-building-plan):**
Three projects: (1) Convert one of the user's best history units into a corporate-style e-learning module using Articulate Storyline. (2) Design a compliance training module for a fictional company using ADDIE model. (3) Create an onboarding learning path with pre/post assessments and completion tracking. Each project includes a case study documenting the design decisions and learning outcomes.

**Step 5 (networking-message-writer):**
Outreach targets: instructional designers on LinkedIn who also transitioned from teaching (there are many). Message template leads with shared background: "As a fellow former educator now working in corporate L&D, I'd love to hear how you navigated the transition." Weekly target: 4 outreach messages, 2 informational interviews. Also joins the eLearning Guild and ATD communities.

**Step 6 (job-search-strategy):**
Job search focused on: companies with established L&D teams (more likely to value the depth a career switcher brings), postings that mention "education background welcome" or "training experience," and roles sourced through networking contacts. Resume reframed: "History Teacher" becomes "Learning Designer and Curriculum Developer" with accomplishments rephrased in corporate L&D terminology. Career narrative: "Seven years of designing learning experiences for diverse audiences taught me that effective instruction follows the same principles whether the learner is a 16-year-old or a VP -- I am bringing that expertise to corporate learning."

**Result:** Over 9 months, the user builds instructional design skills, creates a professional portfolio, develops a network of 15 industry contacts, and lands a junior instructional designer role at a mid-size tech company at $68K -- comparable to their teaching salary with significantly higher growth trajectory.
