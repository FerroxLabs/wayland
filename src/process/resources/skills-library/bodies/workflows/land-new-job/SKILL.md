---
name: land-new-job
description: |
  Guides the user through a complete job search process from resume optimization
  through offer evaluation, chaining 7 atomic skills in sequence with decision
  points for employment status, industry, and timeline pressure. Use when the
  user wants to find and land a new job, conduct a structured job search, or
  navigate the full application-to-offer pipeline. Do NOT use for career pivots
  to a completely new field (use switch-careers workflow), freelancing (use
  start-freelancing workflow), or internal promotions (use negotiate-raise workflow).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "resume-writing interview-prep career linkedin salary-negotiation step-by-step planning"
  category: "career"
  depends: "ats-resume-optimizer cover-letter-writer linkedin-summary-writer job-search-strategy interview-prep-plan salary-negotiation-script job-description-analyzer"
  disclaimer: "none"
  difficulty: "intermediate"
---

# Land a New Job

**Estimated time:** 1-4 months (depending on market conditions, seniority level, and search urgency)

This workflow orchestrates 7 career-development skills into a structured job search pipeline. Each step produces specific outputs that feed directly into the next, creating a coherent application strategy from resume preparation through final offer evaluation. The workflow handles the most common variations: currently employed vs. actively searching, tech vs. non-tech industries, and IC vs. management roles.

## When to Use

- User wants to find and land a new job in their current field or a closely adjacent field
- User needs a structured, step-by-step process from resume preparation through offer evaluation
- User is either currently employed and exploring opportunities or actively unemployed and searching
- User wants to maximize their chances across applications, interviews, and salary negotiations
- Do NOT use when: user wants to pivot to a completely different career field (use `switch-careers` workflow), user wants to start freelancing instead of traditional employment (use `start-freelancing` workflow), user is seeking a raise or promotion at their current employer (use `negotiate-raise` workflow)

## Prerequisites

Before starting this workflow, ensure:

1. **Career direction clarity:** The user knows what type of role they want (title, industry, function). If unclear, the user should first explore options before entering this structured pipeline.
2. **Updated work history:** The user has a list of their recent positions, responsibilities, and quantified accomplishments (even rough numbers work -- exact metrics come during resume optimization).
3. **Target company list (optional but helpful):** At least 5-10 companies or a clear description of the type of organization they want to join (size, industry, culture).
4. **Timeline awareness:** The user knows whether this is a passive search (exploring while employed, 2-4 month horizon) or an urgent search (unemployed or at-risk, need offers within 4-8 weeks).

## Steps

**Step 1: Optimize Resume for Target Roles** (uses: ats-resume-optimizer)

Take the user's existing resume and a representative job description for their target role. The ATS optimizer extracts keywords, maps them to the user's experience, and rewrites bullets and summary to maximize keyword match rate while preserving quantified achievements.

- Input: User's current resume content and 1-3 target job descriptions
- Output: ATS-optimized resume with keyword match report, formatted for automated screening systems
- Key focus: Prioritize exact keyword matches from target postings over synonyms. Ensure every bullet follows Action Verb + Task + Result structure with metrics preserved. Flag any formatting issues that block ATS parsing.

**Step 2: Write Targeted Cover Letters** (uses: cover-letter-writer)

Using the optimized resume and target job descriptions, create cover letter templates that complement (not repeat) the resume. Each cover letter addresses the specific requirements of the role and company.

- Input: ATS-optimized resume from Step 1, target job descriptions, and any company-specific research the user has
- Output: 2-3 cover letter templates customized for different company types (startup, mid-size, enterprise) or role variations
- Key focus: Open with a specific hook relevant to the company or role. Bridge the user's experience to the job requirements. Close with a clear call to action. Keep under one page.

**Step 3: Optimize LinkedIn Presence** (uses: linkedin-summary-writer)

Update the user's LinkedIn summary and key profile sections to align with the target roles identified in Steps 1-2. The LinkedIn profile serves as both a passive discovery channel and a credibility check for recruiters reviewing applications.

- Input: ATS-optimized resume from Step 1, target role titles and industry keywords
- Output: Rewritten LinkedIn summary, headline suggestions, and skills section recommendations
- Key focus: Align LinkedIn language with resume keywords for consistency. Write for both human readers and recruiter search queries. Include industry-specific terminology that signals expertise to hiring managers who visit the profile after receiving an application.

**Step 4: Execute Job Search Strategy** (uses: job-search-strategy)

Build a structured search plan covering multiple channels: job boards, recruiter outreach, networking, and direct applications. Prioritize channels based on the user's industry, seniority level, and timeline.

- Input: Target role criteria, optimized resume and LinkedIn from Steps 1-3, timeline and urgency level
- Output: Weekly search plan with channel allocation, application targets, networking goals, and tracking system
- Key focus: Allocate effort across channels based on what works for the user's specific situation. Senior roles weight networking and recruiter relationships heavier than job boards. Entry-level roles weight volume applications and skills-based matching. Set weekly targets (applications submitted, networking conversations, recruiter contacts) with a tracking method.

**Step 5: Prepare for Interviews** (uses: interview-prep-plan)

Once applications generate interview invitations, build a structured preparation plan covering company research, common question preparation, and practice sessions tailored to the interview format (phone screen, behavioral, technical, panel).

- Input: Interview invitations received, job descriptions for those roles, company information
- Output: Interview preparation plan with company-specific research, STAR-format answers for likely questions, questions to ask interviewers, and practice schedule
- Key focus: Customize preparation for each interview stage. Phone screens need concise elevator pitches. Behavioral interviews need 8-10 STAR stories mapped to common competencies. Technical interviews need domain-specific preparation. Panel interviews need strategies for addressing multiple interviewers.

**Step 6: Negotiate Salary and Benefits** (uses: salary-negotiation-script)

When an offer arrives, build a negotiation strategy with specific talking points, counter-offer ranges, and responses to common employer pushback. The script covers base salary, equity, signing bonus, PTO, remote work, and start date.

- Input: Job offer details (base, bonus, equity, benefits), market rate research, user's minimum acceptable terms and ideal terms
- Output: Negotiation script with opening statement, counter-offer justification, responses to 5 common objections, and walk-away criteria
- Key focus: Never negotiate against yourself by naming a number first unless strategically advantageous. Justify every counter-offer with market data, competing offers, or specific value the user brings. Negotiate the full package, not just base salary. Prepare the walk-away threshold before the conversation starts.

**Step 7: Evaluate and Compare Offers** (uses: job-description-analyzer)

If the user receives multiple offers (or needs to evaluate a single offer against staying at their current job), use the analyzer to do a structured comparison across compensation, role scope, growth trajectory, culture signals, and practical factors.

- Input: Offer letters, job descriptions, any notes from interview conversations about culture, team, and expectations
- Output: Offer comparison matrix scoring each opportunity across 8-10 weighted criteria, with a recommendation based on the user's stated priorities
- Key focus: Go beyond raw compensation numbers. Factor in commute or remote flexibility, team quality signals from interviews, growth trajectory (is this a stepping stone or a destination role?), and risk factors (startup runway, company financial health, manager turnover signals). Weight criteria based on the user's personal priorities.

## Decision Points

- **Before Step 1:** If the user is currently employed, proceed at the passive search pace (lower weekly application targets, selective networking). If the user is unemployed or has a hard deadline (layoff, contract ending), switch to urgent search mode: higher application volume in Step 4, accelerated interview prep timeline in Step 5, and more aggressive salary research in Step 6.

- **Before Step 1:** If the user is in a tech or engineering role, the resume should emphasize projects, technical stack, and measurable impact on systems. Ensure a portfolio or GitHub link is included. If the user is in a non-tech role, the resume should emphasize business outcomes, stakeholder management, and cross-functional impact. Portfolio is optional.

- **After Step 3:** If the user is targeting IC (individual contributor) roles, emphasize depth of expertise, technical or functional mastery, and individual output metrics in all materials. If the user is targeting management roles, emphasize team building, cross-functional leadership, budget oversight, and organizational impact in all materials.

- **After Step 4:** If the user is getting no responses after 2 weeks of active searching (10+ applications), return to Steps 1-2 to audit resume keywords and cover letter relevance. The most common cause is a positioning mismatch between the resume and the target job descriptions.

- **After Step 5:** If the user consistently reaches final-round interviews but receives rejections, the issue is likely interview performance, not application materials. Invest more time in Step 5 with mock interviews and feedback analysis before continuing to apply.

- **After Step 6:** If the employer's best offer is below the user's walk-away threshold and further negotiation is unlikely to close the gap, decline respectfully and continue the search. Do not accept an offer that creates resentment on day one.

## Failure Handling

- **Step 1 fails (resume not generating interviews):** If the user submits 15+ applications using the optimized resume and receives zero interview invitations within 3 weeks, the problem is likely targeting, not the resume itself. Return to the job descriptions used for optimization and verify the user genuinely qualifies for those roles. Check for overreach (targeting senior roles without sufficient experience) or underreach (applying to roles below the user's level where they appear overqualified). Adjust target role criteria and re-run Step 1 with corrected job descriptions.

- **Step 5 fails (interview rejections):** If the user receives 3+ rejections after final-round interviews, request feedback from each company (many will provide it if asked). Look for patterns: if multiple rejections cite "culture fit," the user may need to research company culture more deeply or adjust their communication style. If rejections cite "experience gaps," the user may be targeting roles slightly above their current level and should either gain a specific skill or adjust targets downward.

- **Step 6 fails (lowball offer):** If the initial offer is significantly below market rate (more than 15% below the user's researched range), the user has three options: (a) counter with market data and competing offers, (b) negotiate non-salary components (signing bonus, equity, remote days, title) to close the gap, or (c) decline and continue the search if the gap is too large. A lowball offer from a company that seemed enthusiastic during interviews often signals budget constraints -- non-salary negotiation may be more productive than salary pushback.

- **User wants to change direction mid-workflow:** If the user realizes during the search that they want a different type of role, return to Step 1 and rebuild materials for the new target. Steps 3 (LinkedIn) and 4 (search strategy) will also need updating. Steps 5-7 are role-agnostic in structure and need only content updates, not process changes.

## Output Format

```
## Job Search Pipeline: [Target Role Title]

### Step 1: Resume Optimization
- Target role: [role title]
- Keywords extracted: [count]
- Match rate: [before]% -> [after]%
- Resume status: [optimized / needs revision]

### Step 2: Cover Letters
- Templates created: [count]
- Variants: [company type list]
- Status: [ready / in progress]

### Step 3: LinkedIn Profile
- Headline: [updated headline]
- Summary: [updated / pending]
- Skills aligned: [yes / no]

### Step 4: Search Strategy
- Channels: [job boards, networking, recruiters, direct]
- Weekly application target: [number]
- Weekly networking target: [number]
- Tracking method: [spreadsheet / tool]

### Step 5: Interview Preparation
- Companies with active interviews: [count]
- STAR stories prepared: [count]
- Mock interviews completed: [count]

### Step 6: Salary Negotiation
- Market rate range: $[low] - $[high]
- Target ask: $[amount]
- Walk-away threshold: $[amount]
- Script status: [prepared / not yet needed]

### Step 7: Offer Evaluation
- Offers received: [count]
- Comparison criteria: [list]
- Recommendation: [Company X based on weighted priorities]

### Current Status
- Active step: [Step N]
- Next action: [specific action]
- Timeline: [weeks elapsed] / [estimated total]
```

## Edge Cases

- **User has no work experience (recent graduate):** Step 1 focuses on academic projects, internships, volunteer work, and transferable skills rather than professional accomplishments. Step 5 shifts from STAR stories about work situations to academic and extracurricular examples. Step 6 adjusts negotiation strategy for entry-level market dynamics (less room to negotiate base, more room on start date and signing bonus).

- **User is re-entering the workforce after a gap (parenting, health, caregiving):** Step 1 must address the employment gap directly with a brief, confident explanation. Step 3 LinkedIn optimization should include the gap period framed as the intentional break it was. Step 4 search strategy prioritizes companies known for returnship programs or flexible re-entry policies.

- **User is in a niche field with few openings:** Step 4 search strategy shifts from volume applications to deep networking and recruiter relationship building. The user may need to expand geographic scope (remote roles) or broaden role criteria. Reduce weekly application targets but increase networking conversation targets.

- **User is relocating to a new city:** Step 4 must account for remote interview logistics and relocation timeline. Step 6 negotiation may include relocation assistance as a negotiable component. Step 7 offer evaluation should weight geographic factors (cost of living, commute, proximity to personal network).

- **User has a non-compete agreement:** Before starting, verify the non-compete scope with a legal professional. Step 4 search strategy must exclude restricted companies or industries for the non-compete duration. This is a legal constraint that cannot be resolved within the workflow.

- **User receives an offer before completing all steps:** Common in hot markets. Skip directly to Step 6 (negotiation) and Step 7 (evaluation) using whatever preparation exists. A partial workflow execution with a real offer is better than completing the full workflow after the offer expires.

## Expected Outcome

When this workflow is complete, the user will have:

1. An ATS-optimized resume tailored to their target roles with a keyword match report
2. Cover letter templates customized for different company types in their target market
3. A LinkedIn profile aligned with their resume messaging and optimized for recruiter discovery
4. A structured job search strategy with weekly targets, channel allocation, and a tracking system
5. An interview preparation plan with company-specific research and practiced STAR stories
6. A salary negotiation script with counter-offer strategy and walk-away criteria
7. A structured offer evaluation comparing opportunities across compensation, growth, culture, and practical factors

## Example

**Input:** "I'm a product manager with 5 years of experience at a mid-size SaaS company. I want to move to a senior PM role at a larger company. I'm currently employed, so this is not urgent."

**Output:**

**Step 1 (ats-resume-optimizer):**
The user provides their current resume and 3 senior PM job descriptions from target companies. The optimizer extracts keywords like "product strategy," "stakeholder management," "roadmap prioritization," "data-driven decisions," and "cross-functional leadership." It rewrites the user's bullets to incorporate these exact terms while preserving their metrics (e.g., "Launched 3 features that increased user retention by 22%").

**Step 2 (cover-letter-writer):**
Using the optimized resume and target descriptions, the writer creates 2 templates: one for established tech companies (emphasizing scale and process maturity) and one for growth-stage companies (emphasizing scrappiness and full-stack PM skills). Each opens with a hook specific to the company's product or recent news.

**Step 3 (linkedin-summary-writer):**
The LinkedIn summary is rewritten to match the resume's "senior product manager" positioning. Headline updated from "Product Manager at [Company]" to "Senior Product Manager | SaaS Growth | Data-Driven Roadmap Strategy." Skills section updated with keywords matching target postings.

**Step 4 (job-search-strategy):**
As a currently-employed passive searcher, the strategy emphasizes: (a) Set LinkedIn to "Open to Work" visible only to recruiters, (b) apply to 3-5 targeted roles per week through direct applications and recruiter contacts, (c) schedule 2 networking conversations per week with PMs at target companies, (d) track everything in a spreadsheet with columns for company, stage, next action, and follow-up date.

**Step 5 (interview-prep-plan):**
After getting interviews at 3 companies, the user builds STAR stories for common senior PM questions: "Tell me about a time you made a product decision with incomplete data," "How do you prioritize competing stakeholder requests," and "Describe a product launch that did not go as planned." Research covers each company's product, recent releases, and competitive landscape.

**Step 6 (salary-negotiation-script):**
Company A offers $165K base. Market research shows senior PM at comparable companies ranges $170-195K. The negotiation script opens with enthusiasm for the role, then counters at $185K justified by specific market data and the user's retention impact metrics. The script includes responses to "That's above our budget" and "We can revisit in 6 months."

**Step 7 (job-description-analyzer):**
Company A (final offer: $180K + 10K RSUs) is compared against Company B ($172K + 15K signing bonus). The comparison matrix scores both across compensation (total comp Year 1), role scope, manager quality signals, remote flexibility, commute, team size, growth trajectory, and company financial stability. The user's priorities weight growth trajectory and manager quality highest, producing a recommendation.

**Result:** The user has a complete, data-driven job search that took 10 weeks from resume optimization to accepted offer, with structured decision-making at every stage.
