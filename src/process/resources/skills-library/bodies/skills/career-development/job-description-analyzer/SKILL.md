---
name: job-description-analyzer
description: |
  Deconstructs a job description into must-have vs. nice-to-have requirements,
  hidden culture signals, red flags, and the skills the user should emphasize
  in their application. Produces a structured analysis that helps the user
  decide whether to apply and how to tailor their materials. Use when the user
  wants to analyze a job posting, understand what a job description really means,
  identify red flags in a listing, or determine which skills to highlight. Do NOT
  use for ATS keyword optimization (use ats-resume-optimizer), resume writing
  (use resume-bullet-writer), or company research (use company-research-guide).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "career analysis guide"
  category: "career-development"
  subcategory: "job-search"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Job Description Analyzer

## When to Use

Use this skill when any of the following situations apply:

- The user pastes or describes a job posting and wants to understand what the company is actually looking for beyond the literal text
- The user is uncertain whether they are qualified and wants a structured qualify/do-not-qualify assessment before investing time in an application
- The user suspects something is off about a posting -- unusual requirements, odd phrasing, suspiciously broad scope -- and wants a systematic red flag audit
- The user wants to know which 2-3 skills or experiences to lead with in their resume and cover letter for a specific role
- The user is evaluating multiple postings and wants a consistent decision framework to compare opportunities
- The user wants to understand what the hiring manager actually cares about versus what HR or a recruiter copy-pasted from a template
- The user is re-entering the workforce, changing industries, or stepping up a level and needs help interpreting whether standard requirements are firm or negotiable

**Do NOT use this skill when:**
- The user wants to optimize resume bullets for ATS keyword matching -- use `ats-resume-optimizer` instead
- The user wants resume bullet points written or rewritten -- use `resume-bullet-writer` instead
- The user wants to research the company's culture, financials, leadership, or Glassdoor reputation -- use `company-research-guide` instead
- The user wants interview question predictions or prep for a specific role -- use `interview-question-anticipator` instead
- The user wants a cover letter drafted -- use `cover-letter-writer` instead
- The user wants to negotiate salary and needs a compensation research framework -- use `salary-negotiation-coach` instead
- The user wants LinkedIn profile optimization -- the audience and intent are fundamentally different from a job description analysis

---

## Process

### Step 1: Gather the Raw Material

Before analyzing anything, collect what you need. Do not begin analysis with incomplete inputs.

- Ask the user to paste the **full job description text** -- never work from a link, a summary, or paraphrasing. Specific word choices in the posting are evidence; summaries strip them out.
- Ask for a **brief professional summary**: current role, years of relevant experience, and 3-5 skills or tools they use regularly. Two to four sentences is sufficient. Do not ask for a full resume.
- Ask if they have **specific concerns** -- a requirement they do not meet, a phrase that confused them, or a gut feeling something is wrong. These targeted concerns should receive explicit answers in the analysis.
- Note the **source of the posting**: LinkedIn, the company's careers page, a job board like Indeed or Greenhouse, or an internal referral. Postings on the company's own site tend to be more accurate; aggregators sometimes show stale or slightly altered listings.
- Note the **posting date** if visible. A posting older than 45 days on an active job board is a meaningful signal that deserves flagging.

### Step 2: Classify Every Requirement as Must-Have, Nice-to-Have, or Ambiguous

This is the most consequential step. Misclassifying a nice-to-have as a must-have is what causes qualified candidates to self-screen out unnecessarily.

**Linguistic markers for must-haves:**
- Explicit language: "required," "must have," "minimum," "X+ years of experience in," "proven track record of," "demonstrated ability to"
- Structural position: requirements listed under headings like "Qualifications," "Required," "Basic Qualifications," or "Minimum Requirements" are almost always treated as real gates
- Specificity: a named tool or technology ("Salesforce CRM," "Python," "Kubernetes") listed without softening language is a hard requirement even if not labeled explicitly
- Legal and regulatory requirements: security clearances, licenses (CPA, PE, bar admission), and certifications (PMP, AWS Certified Solutions Architect) are binary -- either you have them or you do not

**Linguistic markers for nice-to-haves:**
- Explicit language: "preferred," "a plus," "nice to have," "ideally," "familiarity with," "exposure to," "bonus if you have," "experience with X is beneficial"
- Structural position: requirements listed under headings like "Preferred Qualifications," "Bonus Points," or "What Would Make You Stand Out" are consistently treated as wish-list items
- Stacked alternatives: "experience with Tableau, Power BI, or Looker" -- when a company lists alternatives, they are signaling flexibility, not insisting on a specific tool

**How to handle ambiguous requirements:**
- Apply the position rule: requirements listed in the first third of a qualifications section outrank those listed last. Hiring managers front-load what actually matters.
- Apply the specificity rule: a named tool is more important than a soft skill, even if the soft skill appears first. "5 years of experience with React" matters more than "excellent problem-solving skills."
- Apply the role-function rule: if the requirement is directly related to the primary stated function of the role (a DevOps engineer listing that requires Terraform knowledge), classify it as a must-have even without explicit language
- When in doubt, classify ambiguous as must-have for the fit assessment -- it is better to be conservative here and then note the ambiguity

**Count and document:** Produce a final count of X must-haves, Y nice-to-haves, Z ambiguous. A job description with more than 12 must-haves is almost certainly a wish list and should be noted explicitly.

### Step 3: Decode the Hidden Organizational and Cultural Signals

Every job description was written by a human (or assembled from humans' inputs) and reflects real organizational conditions. Read it as a primary source document, not a checklist.

**Scope signals:**
- Count the number of distinct functional domains in the responsibilities section. A Product Manager role that also requires managing the company blog, running vendor negotiations, and mentoring interns is not a PM role -- it is an operational generalist role with a PM title. More than 3-4 distinct function areas signals scope creep or organizational chaos.
- Watch for telescoping language: "you will define the product roadmap AND manage customer support escalations AND coordinate with legal" -- the AND-stacking of unrelated functions is a structural warning sign.
- "Player-coach" is a frequently misused term. In healthy organizations, it means a senior individual contributor who also manages 1-3 people. In dysfunction, it means a full management job plus a full IC job with neither being done well. Ask the user to probe this in the interview.

**Team and process maturity signals:**
- "Build from scratch" or "greenfield" signals: early-stage team, high ambiguity, low process. Appeals to builders but exhausting if the user needs structure.
- "Improve and scale existing systems" signals: team has something working but is hitting limits. Mid-stage, structured but evolving.
- "Maintain, optimize, and improve" signals: established system, change is incremental, organizational inertia is a real force. Stability-seekers thrive here; change agents often do not.
- "Define and establish best practices" in a role below director level is a yellow flag -- it either means the company is genuinely immature (is that good or bad for the user?) or management will not actually give the person authority to do it.

**Management and culture signals:**
- "Self-starter," "entrepreneurial mindset," "minimal supervision," "takes initiative without being told" = there is no manager in the traditional sense. The user will need to create their own structure. Not inherently bad, but a specific type of person thrives here.
- "Collaborative," "team-oriented," "cross-functional stakeholder management," "builds consensus" = the organization has a strong matrix structure or significant internal politics. The role requires political navigation skills.
- "Move fast," "high-growth environment," "fast-paced," "wear many hats," "comfortable with ambiguity" appearing together -- all four at once is a pattern that correlates with burnout risk and high turnover. One or two is standard startup language.
- "We work hard and play hard," "hustle culture," "we are a family" -- these specific phrases have documented correlations with poor work-life balance expectations. Flag these explicitly.

**Hiring context signals:**
- If the posting describes the role in terms of building from zero (new function), it may be a new headcount -- positive signal for job security.
- If the posting describes inheriting an existing system or team, someone recently left -- neutral, but worth probing. Was the departure healthy (promotion, retirement) or unhealthy (termination, mass exodus)?
- Postings reposted after a short period (visible on LinkedIn as "Reposted" or showing multiple posting dates) suggest either a recently failed hire or that the bar being described does not reflect who they will actually hire.

**Compensation signals:**
- A full salary band (e.g., "$120,000 -- $145,000 base + equity + bonus") signals transparency and often correlates with structured HR and compensation practices.
- "Competitive salary" alone often means below-market base where the company is relying on equity or mission to close candidates. Not always, but often enough to flag.
- "Salary commensurate with experience" is maximally vague and often precedes a lowball offer. Recommend the user establish their number before their first call.
- Many states and cities now require salary range disclosure (California, Colorado, New York, Washington, among others). Absence of a range for a role in those locations may indicate the company is skirting the law -- a minor but real culture signal.

### Step 4: Conduct the Red Flag Audit

Separate genuine warning signs from standard boilerplate. Not everything is a red flag -- overcalling flags is just as unhelpful as missing them.

**Major red flags (these warrant serious reconsideration):**
- Experience-compensation mismatch: the posting requires 7-10 years of senior experience but the stated salary range (or Glassdoor/Levels.fyi data for the company) is entry-to-mid level. This is the single most reliable indicator of a posting that will waste the user's time.
- Responsibilities that combine two or three full-time roles: a startup cannot pay 1 person to do the work of 3, but some post listings that ask them to anyway. If the user can identify 2-3 distinct full-time roles embedded in one posting, that is a major red flag.
- Contradictory requirements: "entry-level position" with "5+ years required," or "junior engineer" with "architect-level system design required" -- these indicate the posting was assembled carelessly or the company does not understand the market.
- No mention of reporting structure, team size, or how success will be measured for a senior role -- indicates organizational ambiguity that will manifest post-hire.

**Moderate red flags (worthy of exploration in an interview):**
- Posting age over 45 days without a "Reposted" marker -- either they are not finding candidates or the hiring is frozen but the posting was not taken down.
- The qualifications section is longer than the responsibilities section -- this suggests the job was written from a screening-out perspective rather than a "here is what you will do" perspective. Companies that do this often have punishing interview processes.
- No mention of growth, development, or advancement pathways for individual contributor roles below director level.
- Requirements that name very specific version numbers of software or exact proprietary tools used only at one company (e.g., "experience with [CompanyX] internal data platform") -- may indicate the posting was written for a named candidate.
- "Other duties as assigned" appearing 3+ times or dominating more than 25% of the bullet points.

**Minor red flags (note and monitor but do not block application):**
- Missing salary range in a state without disclosure requirements.
- Standard "fast-paced environment" language when it appears in isolation.
- "Competitive benefits" without specifics -- may just be lazy copywriting, but worth asking about.
- No mention of team structure (may just be standard for the company's posting template).

**Important: differentiate boilerplate from signal.** "Other duties as assigned" appearing once at the end of a responsibilities list is universal boilerplate -- do not flag it. It appearing four times throughout the body of a posting is different. "Excellent communication skills required" is so universal it carries near-zero information content -- acknowledge it, classify it, but do not treat it as a meaningful signal in either direction.

### Step 5: Assess the User's Qualification Fit

Do not make this a simple percentage. Apply nuance about which requirements are actually gateable.

**Calculate the must-have match rate:**
- Match each stated must-have against what the user has told you about their background
- Track each as: Full Match (they clearly have it), Partial Match (adjacent experience, related tools, shorter tenure), or No Match
- Count partial matches as 0.5 for the percentage calculation
- Display the formula: (Full Matches + 0.5 × Partial Matches) / Total Must-Haves × 100

**Apply the recommendation thresholds:**
- **85%+**: Strong candidate. Apply with confidence. The cover letter should lead with the top 2-3 matches.
- **65-84%**: Viable candidate. Apply with a targeted cover letter that directly addresses the gap area. Do not apologize for the gap -- reframe it as an adjacent skill or transferable experience.
- **45-64%**: Stretch candidate. Only apply if (a) the user has a referral or insider connection, (b) the job has been posted for 45+ days suggesting they are softening requirements, or (c) the user is deliberately targeting stretch roles as a career growth strategy.
- **Below 45%**: Poor match on stated requirements. Advise against applying unless there is a networking path into the role, or the user understands they are playing a very long odds game.

**Critical nuances in the fit assessment:**
- Year requirements are routinely negotiated down by 1-2 years if the rest of the profile is strong. A "5+ years required" rarely disqualifies someone with 4 years of directly relevant experience and strong outcomes. Flag this explicitly rather than treating it as a hard no.
- Industry-specific experience is the hardest gap to bridge, especially in regulated industries (finance, healthcare, legal, government). Technical skills transfer; regulatory knowledge and institutional relationships often do not. Be honest about this.
- Education requirements below the PhD level are rarely enforced if the candidate's experience is strong. "Bachelor's degree required" almost universally means "or equivalent experience." "MBA preferred" is a nice-to-have even when listed under required qualifications.
- Certification requirements fall into two categories: easily achievable (AWS Associate, Google Analytics, Salesforce Admin can be passed in weeks) and genuinely gateable (CPA, PE, Bar, MD, active security clearance cannot be acquired quickly). Distinguish these and note the timeline if relevant.

### Step 6: Decode What the Hiring Manager Actually Wants vs. What HR Wrote

Job descriptions are frequently assembled by someone who is not the hiring manager and sometimes not even someone who understands the role. This creates a gap between the posting's stated requirements and the actual decision criteria.

**Signals the posting was written by the hiring manager directly:**
- Domain-specific language used precisely and correctly
- Specific tools named by their actual version or implementation context ("experience with Postgres at scale" vs. "SQL experience")
- Responsibilities written in the first person or in the voice of someone who has done the job
- The nice-to-haves list items that are clearly complementary to the must-haves (they represent what the manager already has on the team and wants to add to)

**Signals the posting was assembled from a template by HR or a recruiter:**
- Generic soft skills dominate the qualifications section (communication, collaboration, problem-solving)
- Obvious boilerplate paragraphs about "company culture" that could apply to any company
- Requirements that do not logically connect to the stated responsibilities
- The company has 20+ open roles all using similar language -- templated mass hiring

**When you identify a template-heavy posting:**
- The must-haves in the top half of the qualifications section are still reliable signals
- The soft skills at the bottom are largely meaningless and should not occupy space in the application strategy
- The responsibilities section (not the requirements section) becomes the primary source of insight -- it is harder to template away from what the role will actually do

**Research the role's real market level:**
- Use the job title, years of experience, and company size/stage to estimate the true seniority level. A "Senior Engineer" at a 15-person startup is often doing principal-level work. A "Senior Engineer" at a 50,000-person corporation may have narrowly scoped responsibilities. This matters for both fit assessment and salary research.
- Note whether the title matches the scope. "Coordinator" doing "manages relationships with C-suite stakeholders" is underpaid by title. "Director" with "assists the VP in" tasks is overpriced by title.

### Step 7: Build the Application Strategy

This is where the analysis converts into action. The user should leave this step knowing exactly what to do next.

**Skills to emphasize:**
- Identify the top 3-4 must-have requirements where the user has a strong match AND where the skill appears in the top third of the requirements list. These are the skills that should appear in the resume headline, the first paragraph of the cover letter, and the opening of any interview answer.
- Identify any skills the posting signals are unusual for the role type (SQL in a PM posting, Python in a marketing role, financial modeling in an operations role) -- these are differentiators, not standard requirements. Emphasize them disproportionately.
- For any nice-to-have where the user has even partial experience, include it -- it is free signal to the reader.

**Gaps to address proactively:**
- For each must-have where the user has only a partial match, provide a reframing strategy. Partial matches should be presented as the closest true experience, not as an apology for the gap. "I have not done X specifically, but I have done Y and Z which required the same underlying skill set" is the correct frame.
- For genuine gaps (no match), advise the user to either leave them unaddressed (do not highlight what is not there) or, if the gap is likely to come up in the interview, prepare a direct and short acknowledgment with a bridge to what they bring instead.
- Never recommend the user lie about or exaggerate experience. It fails in technical screening and reference checks and is a career-ending risk.

**Interview questions the user should ask:**
- Generate 3-5 questions from the signals identified in steps 3 and 4. These questions serve two purposes: they give the user real information to make a decision, and they signal to the interviewer that the user engaged carefully with the role.
- The best questions follow the pattern: [hidden signal from the posting] → [clarifying question that reveals whether the signal is concerning or benign]. For example, if the posting signals the company is in a turnaround situation, the question is not "is the company in trouble?" but "What does success look like for this role in the first 90 days, and how has that definition evolved over the past year?"
- Include one question about team structure, one about success metrics, and one about a specific red flag or signal identified in the analysis.

**Salary research guidance:**
- Based on the role title, scope signals, company stage, and geographic location, provide a directional salary band to research. Name the correct level to research (e.g., "research IC4 or L5 equivalent at mid-stage SaaS companies in San Francisco" rather than just "research market rate").
- Note which data sources are most relevant: Levels.fyi for tech roles, Robert Half salary guides for finance and accounting, Bureau of Labor Statistics OES data for baseline anchors, Glassdoor for company-specific data with appropriate skepticism.
- Flag if the role appears to be misleveled (too broad a scope for the title, or too narrow a scope for the seniority) -- this affects both compensation expectations and the negotiation strategy.

### Step 8: Deliver the Structured Output

Assemble all findings into the output format defined below. Every section must contain actual findings from the specific posting -- no generic placeholders. Do not omit any section even if findings are limited; note the absence of information where relevant (e.g., "No red flags identified" is a valid red flag section entry).

---

## Output Format

```
## Job Description Analysis: [Job Title] at [Company Name]
**Source:** [Company careers page / LinkedIn / Indeed / Other]
**Posting Date / Age:** [Date if visible, or estimated age]
**Role Level:** [IC / Manager / Director / VP / Individual Contributor with team lead component]

---

### Requirements Breakdown

**Must-Haves ([N] total):**
| # | Requirement | Type | Your Match | Analysis |
|---|------------|------|-----------|----------|
| 1 | [Exact requirement text] | [Technical / Credential / Experience / Soft Skill] | Full / Partial / None | [Specific context for this user] |
| 2 | [Exact requirement text] | [Type] | Full / Partial / None | [Context] |

**Nice-to-Haves ([N] total):**
| # | Requirement | Type | Your Match | Analysis |
|---|------------|------|-----------|----------|
| 1 | [Exact requirement text] | [Type] | Yes / Partial / No | [Context] |

**Ambiguous Requirements ([N] total -- classified conservatively as must-haves above):**
[List items here with the reasoning for the ambiguity]

---

### Fit Assessment

**Match Formula:** ([Full Matches] + 0.5 × [Partial Matches]) / [Total Must-Haves] × 100

**Must-Have Match Score:** [X]% ([Full] full matches, [Partial] partial matches, [None] unmet)

**Recommendation:** [Apply with confidence / Apply with targeted cover letter / Stretch -- apply only if [condition] / Do not apply]

**Recommendation reasoning:** [2-3 sentences explaining the key factors driving the recommendation -- not generic, specific to this posting and this user]

---

### Hidden Signals

| Signal Observed | Likely Meaning | Confidence | Impact on Role |
|----------------|---------------|-----------|----------------|
| [Specific phrase or pattern from the posting] | [What it likely means about the org, team, or role] | High / Medium / Low | [Positive / Neutral / Concerning] |
| [Signal] | [Meaning] | [Confidence] | [Impact] |

**Signal Summary:** [2-3 sentences synthesizing the overall picture these signals paint -- what is this job actually going to be like?]

---

### Red Flag Audit

| Flag | Evidence from Posting | Why It Matters | Severity |
|------|--------------------|---------------|----------|
| [Specific red flag] | [Exact phrase or pattern that triggered it] | [Explanation of the real-world implication] | Minor / Moderate / Major |

**Red Flag Summary:** [N] flags identified -- [N] major, [N] moderate, [N] minor.
**Overall risk assessment:** [Low / Medium / High] -- [1 sentence recommendation on how to weigh the flags]

*If no genuine red flags:* No significant red flags identified. [Brief note on what was checked and found clean.]

---

### Role Scope Assessment

**Primary function:** [The 1-2 core things this person will spend 80% of their time doing]
**Secondary functions:** [Supporting responsibilities that are real but not the core job]
**Scope creep present:** [Yes / No] -- [explanation if yes]
**Team context:** [Solo contributor / Part of a team / Team lead / Manager] -- [what the posting signals about team structure]
**Organizational stage:** [Early-stage / Growth / Mature / Turnaround / Unclear] -- [evidence from the posting]

---

### Application Strategy

**Top Skills to Lead With (prioritized):**
1. [Skill] -- [Specific reason it matters for this role, tied to a signal or requirement]
2. [Skill] -- [Reason]
3. [Skill] -- [Reason]

**Differentiating Skills (unusual for this role type -- high signal value):**
- [Skill] -- [Why it differentiates and where to feature it]

**Gaps to Address:**
| Gap | Severity | Recommended Frame |
|-----|---------|-------------------|
| [Specific unmet or partially met requirement] | Likely gating / Unlikely to disqualify | [How to reframe this gap using adjacent experience] |

**Questions to Ask in the Interview:**
1. [Question] -- *Why ask:* [Tied to a specific signal or red flag from the analysis]
2. [Question] -- *Why ask:* [Tied to a specific signal or red flag]
3. [Question] -- *Why ask:* [Tied to role scope, success metrics, or team structure]
4. [Optional: Question tied to salary / compensation signal]

**Salary Research Guidance:**
- **Effective role level:** [What level this job is actually operating at, which may differ from the title]
- **Market title to research:** [The title that best matches the actual scope]
- **Research in:** [Geography / Remote / Specific industry vertical]
- **Recommended data sources:** [Specific sources relevant to this role type]
- **Directional range:** [If determinable from scope, stage, and location signals -- otherwise, note "research required"]
```

---

## Rules

1. **Never analyze a paraphrase or summary -- always work from the full text.** Word choices in job postings are evidence. "Familiarity with" and "expert in" are not interchangeable. If the user has not provided the full text, ask for it before proceeding.

2. **Classify every listed requirement -- do not skip requirements that seem obvious or generic.** "Excellent communication skills" is universal and carries near-zero information content, but it still belongs in the nice-to-have or must-have bucket. Skipping requirements creates gaps in the match score that mislead the user.

3. **Apply the 0.5 partial-match weighting consistently.** A partial match is not a full match and should not be represented as one. One year short of a "5+ year" requirement is not the same as having 5 years. Four years of indirect exposure is not the same as four years of direct experience. Be honest in the classification.

4. **Do not assume the user meets a requirement unless they have explicitly stated it.** If the user's brief does not address a specific must-have, ask before classifying it. Assumptions inflate match scores and give the user false confidence.

5. **Year requirements are not binary gatekeepers -- say so explicitly.** Studies of job application behavior consistently show that women and underrepresented candidates are more likely to self-screen out over year-count gaps. A 1-2 year shortfall against a stated requirement is rarely enforced if the rest of the application is strong. Always note this when a year-count partial match is the primary or only gap.

6. **Calibrate red flag severity honestly.** Do not call every imperfect posting element a red flag -- this is noise that trains users to ignore the flags that actually matter. "Competitive salary" alone is a minor flag, not a major one. A 15-requirement posting with no salary range, 3 conflicting seniority signals, and a scope covering 4 distinct job functions is a major flag constellation. Reserve "major" for things that should genuinely cause a user to hesitate before investing time.

7. **The application strategy must be specific to this role.** "Highlight your relevant experience" is not an application strategy. The output must name the exact skills to lead with, in priority order, with the reasoning tied to signals in the specific posting. Generic advice belongs in a different skill.

8. **Interview questions generated must be investigative, not performative.** The questions should give the user genuine information to make a decision. "What does success look like in this role?" is performative -- every interviewer has heard it. "The posting mentions owning the product lifecycle -- can you help me understand the team structure I'd be working within?" is investigative. The distinction matters.

9. **Distinguish between what HR wrote and what the hiring manager wants.** In template-heavy postings, the responsibilities section is more reliable than the qualifications section. Always read both and note when they are misaligned. A responsibilities section that describes a senior architect doing "hands-on implementation 80% of the time" contradicts a qualifications section that lists "5 years of team management experience required."

10. **Never discourage an application based on nice-to-have mismatches.** Nice-to-haves are explicitly labeled wish-list items. A user with 0% of the nice-to-haves but 90% of the must-haves is a strong candidate. Missing nice-to-haves belong in the application strategy section as differentiators to watch for, not as gaps to address.

11. **If the posting is more than 60 days old, flag it before proceeding with the full analysis.** Postings older than 60 days on active job boards are frequently either: (a) on indefinite hold due to budget freeze, (b) filled internally with the external posting not yet removed, or (c) still active because the company has extremely high standards and is finding no candidates. All three scenarios warrant a note, and scenario (b) is common enough that recommending verification before investing significant time is appropriate.

12. **Salary research guidance must be actionable, not vague.** "Research the market rate" is not guidance. The output must name a specific title, seniority level, industry context, and geographic market to research, plus the correct data sources for that role type. For technical roles, Levels.fyi is more accurate than Glassdoor. For non-tech professional roles, Robert Half or LinkedIn Salary are more relevant.

---

## Edge Cases

### The Job Description Is Exceptionally Short (Under 100 Words)

A posting under 100 words tells you as much by what it omits as what it includes. Flag the brevity itself as a primary signal before proceeding.

- A very short posting at a small company (under 50 employees) often means the role is informal, the hiring process is informal, and the decision will be made on gut feel and referrals. The analysis should focus on what the user can learn from the company's website, LinkedIn presence, and the title itself.
- A very short posting at a large company may indicate the role was posted by a business unit without HR support, which creates an opportunity -- the hiring manager may be responsive to direct outreach in a way that more structured postings are not.
- For very short postings, explicitly note: "This posting does not provide enough information for a complete requirements analysis. I can analyze what is present, but recommend [company-research-guide] to supplement before making an apply decision."
- Do not manufacture hidden signals from absent text -- only interpret signals that are actually present.

### The Job Description Lists 15 or More Requirements

A posting with 15+ requirements is almost certainly a wish list, not a minimum bar. Handle this carefully:

- Apply the front-loading principle aggressively: treat the first 6-7 requirements as the true must-haves regardless of labeling. Requirements listed after position 8-10 drop sharply in interview weighting.
- Check whether the requirements appear to have been assembled from multiple sources -- if the first 7 are tightly coherent and the last 8 cover unrelated domains, the posting was assembled from multiple internal stakeholders' wish lists. The first 7 represent the hiring manager; the last 8 represent everyone else who was consulted.
- Tell the user explicitly: "With 15+ requirements, it is unlikely any candidate meets all of them. Focus your application on the first 6-7 requirements and treat the remainder as supplementary. Companies posting extensive requirement lists are often signaling aspiration, not minimum qualification."
- Still calculate the match score, but calculate two versions: one for all requirements and one for the "core 7." The core 7 score is the more predictive number.

### The Posting Contains Internal Jargon or Proprietary Tool Names the User Does Not Recognize

Unrecognized jargon requires specific handling -- do not gloss over it.

- Attempt to interpret the jargon from context. "Experience with [CompanyX internal data stack]" likely means "experience with a custom data pipeline stack, likely built on standard components." Flag the interpretation as uncertain.
- If the jargon is a proprietary tool at the hiring company (visible from context), it likely cannot be met by any external candidate -- which means either (a) it is a soft preference for someone with relevant transferable experience, or (b) the posting was written for an internal transfer. Note this possibility.
- If the jargon is industry-specific terminology the user has not encountered, classify it as a must-have and note it as a gap -- but also note that domain terminology is often learnable quickly and may not represent a substantive skills gap.
- Always include a jargon question in the "Interview Questions" section: "I noticed the posting references [term] -- could you help me understand the specific context and what experience you are looking for there?" This question is always appropriate and signals genuine engagement.

### The Posting Appears Written for a Specific Named Candidate (Exploding or Precast Listings)

Signs that a posting may already have a candidate in mind:
- Requirements are suspiciously specific: exact combination of 3-4 niche tools that only appear together at one company
- Year counts are oddly specific ("exactly 3-5 years" rather than "3+ years")
- The scope described exactly matches one very specific prior role at one company
- The posting appeared and disappeared and reappeared (visible on LinkedIn)

**Handling:**
- Flag this possibility clearly but without certainty: "Some characteristics of this posting suggest it may have been written with a specific candidate in mind. This does not mean you should not apply, but it does mean you should recalibrate expectations."
- Still complete the full analysis -- if the user has a referral or strong internal connection, the original candidate may not take the role and the user could be next in consideration.
- Recommend that the user try to identify the hiring manager via LinkedIn and see whether there is a plausible "written for" candidate -- a former colleague or recent departee from the same team.

### The User Is Significantly Overqualified for the Role

Overqualification is its own form of fit mismatch -- the risk is not rejection for capability but rejection for anticipated dissatisfaction or cost.

- Identify the overqualification explicitly: "Based on your background, you appear to be 1-2 levels above the stated requirements for this role. This is not a disqualifier, but it is something a hiring manager will notice and may ask about."
- Generate a specific question the hiring manager is likely to ask ("Why are you interested in a role at this level?") and help the user prepare a non-defensive, non-apologetic answer that frames it as a deliberate choice.
- Assess whether the posting's scope actually matches the title level. A "Manager" title at a 15-person startup doing VP-level work may not be overqualification -- it may be title misleveling that will correct over time.
- Flag the compensation implication: if the user is overqualified and the salary range is already visible, the user may be pricing themselves out regardless of qualifications. Note this tactfully.

### The Posting Is for a Role in a Regulated Industry with Unfamiliar Requirements

Regulated industries (financial services, healthcare, pharma, legal, government) have requirements that appear opaque to outsiders but are non-negotiable.

- Identify the regulated elements explicitly and do not treat them as learnable nice-to-haves. A role requiring Series 7 licensure at a broker-dealer cannot be filled by someone without it -- this is a binary gate, not a soft preference.
- Distinguish between requirements that need licensure before starting (hard gate), requirements that can be obtained within 90 days with company support (conditional hire), and requirements that are simply regulatory vocabulary (HIPAA compliance, SOC 2 familiarity) that represent knowledge, not credentials.
- Note if the posting does not mention standard regulatory requirements that are universal to the industry -- this may indicate the posting was written by someone unfamiliar with the regulatory environment, which is itself a signal.

### The User Wants to Apply Despite a Below-40% Match Score

Respect user autonomy while being honest. Do not refuse to complete the analysis because of a low match score.

- Complete the full analysis, including the match score and the honest "Do not apply" recommendation.
- Add a section: "If you choose to apply despite the low match score, here is how to maximize your chances:" -- followed by the strongest possible framing of what the user does have.
- Note the specific conditions that would make an application viable despite low match: existing referral into the organization, the user is targeting this role as a deliberate stretch/pivot, or the posting is 45+ days old suggesting the company is softening requirements.
- Make the risks explicit: time invested in application materials, emotional cost of rejection, and reputational cost if the user has a connection at the company who facilitated an unlikely application.

---

## Example

**User Input:**
"Here is the job posting I want to analyze. Can you tell me if I should apply and what to emphasize?

*Staff Data Engineer at Meridian Financial (Series D, ~350 employees, fintech, SF-based with remote option)*

About the role: We are looking for a Staff Data Engineer to lead the design and implementation of our next-generation data platform. You will be the technical anchor for a team of 4 data engineers and will work closely with our Head of Data and VP of Engineering to define the direction of our data infrastructure.

Requirements:
- 7+ years of data engineering experience
- Expert-level proficiency in Python and SQL
- Experience designing and building data pipelines in a production environment at scale
- Strong knowledge of Apache Spark or Flink for large-scale data processing
- Experience with dbt for data transformation
- Deep familiarity with cloud data platforms (Snowflake, BigQuery, or Redshift)
- Experience leading technical projects and mentoring junior engineers
- Understanding of data governance, data quality frameworks, and observability

Preferred:
- Experience in fintech or a regulated data environment
- Familiarity with Airflow or Prefect for orchestration
- Kafka or other streaming infrastructure experience
- Prior experience as a staff-level or principal engineer

Compensation: $195,000 -- $235,000 base + significant equity + annual bonus
Location: Remote (SF hub, quarterly team gatherings)"

**My background:** I'm currently a Senior Data Engineer at a 600-person SaaS company. I have 6 years of experience. I use Python and SQL daily, I've built and maintained dbt models in production for 2 years, and I've worked with BigQuery heavily. I've run a couple of technical projects end-to-end and informally mentored two junior engineers. I have not used Spark or Flink -- we use smaller-scale batch pipelines. No fintech experience. I haven't used Airflow formally but I've done some Prefect work. I don't have a formal staff/principal title.

---

**Output:**

## Job Description Analysis: Staff Data Engineer at Meridian Financial

**Source:** [Not specified -- recommend verifying the posting is current on the company's careers page]
**Posting Date / Age:** Not provided
**Role Level:** Staff Individual Contributor with tech lead / informal management component (leads team of 4)

---

### Requirements Breakdown

**Must-Haves (8 total):**
| # | Requirement | Type | Your Match | Analysis |
|---|------------|------|-----------|----------|
| 1 | 7+ years data engineering experience | Experience | Partial (6 years) | 1 year short -- marginal gap at this level. 6 years with strong progression is typically considered. Not a hard block. |
| 2 | Expert-level Python and SQL | Technical | Full | Daily use confirmed -- lead with this. "Expert" framing is important; use that word or equivalent in your materials. |
| 3 | Production data pipelines at scale | Technical + Experience | Full | 2 years of dbt in production is direct evidence. Strengthen by noting data volume and business impact where possible. |
| 4 | Apache Spark or Flink at scale | Technical | None | Genuine gap. This is the most consequential unmet requirement in this posting. |
| 5 | dbt for data transformation | Technical | Full | 2 years in production -- this is a direct, strong match. A differentiator at this level, not just a checkbox. |
| 6 | Cloud data platform (Snowflake, BigQuery, or Redshift) | Technical | Full | BigQuery deeply -- direct match. The posting names alternatives, confirming the specific platform matters less than the paradigm. |
| 7 | Technical project leadership + mentoring | Experience | Partial | End-to-end project ownership and 2 informal mentees. Solid foundation, but "technical anchor for a team of 4" implies a more formal mandate. Reframe as demonstrated leadership readiness. |
| 8 | Data governance, quality frameworks, observability | Technical | Partial | dbt-based quality checks are relevant experience. Formal governance frameworks (Great Expectations, Monte Carlo, Soda) are not mentioned -- probe whether you have used any. |

**Nice-to-Haves (4 total):**
| # | Requirement | Type | Your Match | Analysis |
|---|------------|------|-----------|----------|
| 1 | Fintech / regulated data environment experience | Industry | No | Absence expected from most candidates -- not a blocker. Prepare a brief on data accuracy and compliance mindset from your current work. |
| 2 | Airflow or Prefect for orchestration | Technical | Partial | Prefect work counts. Mention it. Airflow is learnable quickly and the concepts transfer. |
| 3 | Kafka or streaming infrastructure | Technical | No | Relevant at this level, but listed last in the preferred section. Low priority. |
| 4 | Prior staff or principal engineer title | Credential | No | This is a title marker, not a skills marker. At 6 years as a Senior DE at a larger company, you are operating near staff level without the title. Address this in the cover letter framing. |

**Ambiguous Requirements (0 -- all classified above):** None identified. The posting's language is unusually clear and well-organized, suggesting it was written by a technical hiring manager rather than assembled from an HR template.

---

### Fit Assessment

**Match Formula:** (5 full + 0.5 × 3 partial) / 8 must-haves × 100

**Must-Have Match Score:** 81% (5 full matches, 3 partial matches, 1 unmet -- Spark/Flink)

**Recommendation:** Apply with a targeted cover letter and a clear strategy for addressing the Spark/Flink gap.

**Recommendation reasoning:** You meet or substantially meet 7 of 8 must-haves. The single genuine gap -- Spark or Flink -- is technically significant at this level but is not the entire role. Your depth in dbt, BigQuery, and Python is exactly what a Series D fintech scaling its data platform needs. The fact that the gap is one specific processing framework, not a category of expertise, means it is addressable and likely discussable. At the staff level, architectural judgment and delivery track record often outweigh any single tool gap. Apply.

---

### Hidden Signals

| Signal Observed | Likely Meaning | Confidence | Impact on Role |
|----------------|---------------|-----------|----------------|
| "Technical anchor for a team of 4" with "works with Head of Data and VP of Engineering" | This is a tech-lead role with high executive visibility, not a purely hands-on IC role. You will be expected to have and defend architectural opinions in conversations with VP-level stakeholders. | High | Positive if you want influence; concerning if you prefer heads-down IC work |
| "Next-generation data platform" and "define the direction of data infrastructure" | Greenfield or near-greenfield build -- the current platform is either insufficient or being replaced. High ambiguity, significant autonomy, and real ownership. Expect to make foundational decisions with limited precedent. | High | Positive for builders; concerning if you need established systems to work within |
| Posting's precision and coherence across all 8 must-haves | This posting was almost certainly written by the Head of Data or a senior engineer close to the role, not by HR. The requirements are technically precise and internally consistent. This is a signal that the hiring bar will be technical and rigorous, not soft. | Medium-High | Neutral -- means the interview will be substantive and your technical depth will be genuinely tested |
| "$195K -- $235K + significant equity + annual bonus" with full range disclosed | Transparent, above-market compensation. Structured HR and comp practices. The company has done market benchmarking. This also means they know what they are paying for and will not be talked up easily -- your anchor point should be toward the top of the range given your skills. | High | Positive -- reduces compensation negotiation uncertainty |
| "SF hub, quarterly team gatherings" remote structure | Lightly structured remote with intentional in-person culture. Quarterly gatherings are a meaningful commitment (4 trips/year) but far short of hybrid mandates. Real remote flexibility. | High | Positive for remote candidates; note if SF in-person gatherings are logistically difficult |
| Series D, 350 employees, fintech | Late growth stage -- some processes are established, but the data function may still be maturing. At 350 employees, a "Staff Data Engineer" is likely the most senior IC on the data engineering side. Expect to be the person others come to. | High | Significant autonomy and influence -- high expectations for self-direction |

**Signal Summary:** This is a high-autonomy, greenfield-leaning build role with genuine technical ownership, executive exposure, and transparent above-market pay. The company is past early chaos but still in an active scaling phase. The role rewards engineers who can set direction and defend technical decisions, not just execute on specifications. If that matches how you work best, this is a strong opportunity on the intangibles as well as the stated requirements.

---

### Red Flag Audit

| Flag | Evidence from Posting | Why It Matters | Severity |
|------|--------------------|---------------|----------|
| No mention of how success will be measured in the first 6-12 months | Responsibilities describe the "what" but no OKRs, metrics, or definition of done for the data platform project | At the staff level, unclear success metrics often mean the scope will expand post-hire without guardrails. Ask directly in the interview. | Moderate |
| "Technical anchor" language without explicit team structure clarity | Is the user managing 4 engineers, tech-leading them, or collaborating peer-to-peer? The language is ambiguous -- "leads the design" could be informal influence or formal authority. | Misunderstood management expectations are a common source of post-hire dissatisfaction at the staff IC level | Minor |

**Red Flag Summary:** 2 flags identified -- 0 major, 1 moderate, 1 minor.
**Overall risk assessment:** Low -- this is a clean posting with few structural concerns. The moderate flag on success metrics is worth probing but does not indicate dysfunction.

---

### Role Scope Assessment

**Primary function:** Technical leadership of a data platform rebuild -- architectural decisions, pipeline design, and setting engineering standards for a 4-person data engineering team.

**Secondary functions:** Cross-functional coordination with Head of Data and VP of Engineering; data governance and observability implementation; mentoring junior engineers.

**Scope creep present:** No -- the scope is well-defined and coherent. The role has a clear primary function with logically connected secondary responsibilities.

**Team context:** Technical lead / informal manager of 4 engineers, reporting to Head of Data, dotted line to VP of Engineering. This is a high-influence IC role, not a pure management role.

**Organizational stage:** Late growth / Series D scaling. Some process maturity, active infrastructure investment, fintech regulatory environment adds data governance weight.

---

### Application Strategy

**Top Skills to Lead With (prioritized):**
1. **Production dbt at scale** -- the posting names dbt specifically, and most DE candidates at this level have only heard of it. Two years of production dbt experience is a genuine differentiator. Open every conversation about data transformation with this.
2. **BigQuery expertise** -- the posting names all three major cloud DW platforms and you have depth in one. Lead with the depth, not the breadth. "Deep BigQuery expertise" is more compelling than "familiar with cloud data platforms."
3. **Python proficiency + end-to-end pipeline delivery** -- the posting calls for "expert-level" Python, which is a high bar. If you have examples of Python-driven pipeline work that delivered measurable business outcomes (reduced query costs, improved data freshness, enabled a product feature), lead with those.

**Differentiating Skills (unusual for this role type -- high signal value):**
- **dbt in production** -- Most fintech data platforms at this stage are still running raw SQL transforms or early dbt implementations. Someone with 2 years of production dbt at this level has a skill that maps directly to their "next-generation platform" language. Mention it early, mention it specifically, mention metrics.
- **Technical project ownership** -- Staff DE roles frequently struggle because engineers who are technically strong cannot lead projects through ambiguity. Your end-to-end project experience is a differentiator worth framing explicitly: "I have owned the full lifecycle of [project] from scoping through delivery, including cross-team coordination and stakeholder communication."

**Gaps to Address:**
| Gap | Severity | Recommended Frame |
|-----|---------|-------------------|
| No Spark or Flink experience | Likely to come up in technical interview | "I have built production pipelines at [X] data volumes using [BigQuery + dbt + Python]. I have not used Spark directly, but I understand the distributed processing paradigm and have assessed where batch vs. streaming vs. large-scale processing fits for different workloads. I am confident I can close the Spark gap quickly given my [dbt/BigQuery/Python] foundation." -- then redirect to your depth. |
| 6 vs. 7 years of experience | Unlikely to disqualify -- 1 year shortfall at senior level | Do not address this in the cover letter. Let your outcomes speak. If it comes up in screening, "I have 6 years of focused data engineering experience with deep specialization in modern data stack tools" is sufficient. Do not apologize for the year count. |
| No formal staff/principal title | May surface in leveling conversation | "I have been operating at staff-level scope for the last year -- technical anchor for a team, leading architectural decisions, mentoring -- without the formal title at a company where that title doesn't exist. I am looking for a role that formalizes and expands that scope." |
| No fintech regulatory experience | Unlikely to disqualify -- listed as preferred | Do not address preemptively. If asked, note your experience with data quality, governance, and accuracy requirements and connect to the regulatory mindset. |

**Questions to Ask in the Interview:**
1. "The posting describes this role as the technical anchor for the data engineering team -- can you help me understand how the tech lead function relates to the team's day-to-day management? Is there a separate engineering manager, or is this role expected to carry both the technical direction and the people leadership?" -- *Why ask:* The "technical anchor for a team of 4" language is genuinely ambiguous. This question surfaces whether you are walking into an IC role with informal influence or an informal management role without a management title.
2.
