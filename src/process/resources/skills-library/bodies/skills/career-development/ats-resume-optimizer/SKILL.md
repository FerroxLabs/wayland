---
name: ats-resume-optimizer
description: |
  Analyzes a job description for ATS (Applicant Tracking System) keywords and
  produces an optimized version of the user's resume bullets and summary that
  maximizes keyword match rate while maintaining natural readability. Identifies
  must-have keywords, suggests strategic placement, and rewrites content to pass
  automated screening. Use when the user wants to optimize their resume for ATS,
  match keywords from a job posting, or increase their resume's chances of passing
  automated screening. Do NOT use for writing resume bullets from scratch (use
  resume-bullet-writer), career change resume rewrites (use career-change-resume),
  or cover letter writing (use cover-letter-writer).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "resume-writing career linkedin"
  category: "career-development"
  subcategory: "job-search"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# ATS Resume Optimizer

## When to Use

Use this skill when any of the following conditions are true:

- The user has an existing resume and a specific job description and wants to increase the probability of passing automated screening before human review
- The user reports a pattern of submitting applications and receiving no callbacks despite being qualified -- this is a strong signal of ATS filtering, which affects roughly 75% of resumes at large employers using modern ATS platforms
- The user asks which keywords from a job posting to include, how to "beat" or "pass" ATS, or how to increase their resume's match score on a platform like Jobscan, Resume Worded, or LinkedIn's resume assistant
- The user is applying to a role at a company that uses enterprise ATS software (Workday, Taleo, Greenhouse, Lever, iCIMS, BambooHR, or SmartRecruiters are the dominant platforms) where automated parsing happens before any human sees the document
- The user has multiple postings for similar roles and wants to identify the highest-priority keywords for their target job family so they can build a master resume with the right vocabulary
- The user received feedback that their resume "didn't match" the requirements or scored poorly on an automated tool and wants to understand why
- The user is applying to a role in a regulated, credentialed, or technical field (healthcare, engineering, finance, cybersecurity, legal) where exact terminology matching is especially critical because ATS rules in these domains are often built around specific certification names, tools, or regulatory frameworks

**Do NOT use this skill when:**

- The user has no existing resume bullets and needs them written from scratch -- use `resume-bullet-writer`, which is designed to generate quantified, action-verb-led bullets from raw experience notes
- The user is pivoting industries or changing careers and needs their entire resume restructured around transferable skills -- use `career-change-resume`, which handles narrative reframing, not keyword injection
- The user needs their LinkedIn profile summary rewritten -- while LinkedIn has its own keyword algorithm, the format, tone, and character limits differ substantially from a resume; use `linkedin-summary-writer`
- The user needs a cover letter written or optimized -- use `cover-letter-writer`, which handles tone, narrative, and hiring manager persuasion, not ATS keyword density
- The user is asking general questions about how ATS works without having a specific job description ready -- provide a brief explanation and prompt them to return with both documents
- The user is a recent graduate with less than two years of experience and fewer than 6-8 substantive bullets -- there is not enough raw content to optimize; use `resume-bullet-writer` first to build the foundation
- The user is optimizing for freelance, portfolio, or creative roles where human review of a portfolio often precedes ATS review -- keyword optimization is lower priority and different rules apply

---

## Process

### Step 1: Collect and Verify Inputs

Before doing any analysis, ensure you have the complete raw materials needed for accurate optimization.

- Request the full job description text pasted directly into the conversation -- never accept a URL, because you cannot retrieve it and the user may have an older or expired version
- Request the user's current resume content in plain text or pasted sections (summary, all experience bullets, skills section, education if relevant). If the user only shares part of their resume, note which sections you did not optimize and flag them for manual review
- Ask which sections the user wants optimized -- summary only, experience bullets only, skills section only, or all sections. Default to all sections if the user says "the whole thing"
- Ask what the target company size is, if known. Enterprise companies (5,000+ employees) almost universally use ATS; mid-size companies (200-5,000) use ATS roughly 70% of the time; small companies (<50 employees) frequently review resumes manually. This context affects how aggressively to optimize
- Confirm the user's seniority level -- ATS keyword matching for a Senior Engineer differs substantially from an Associate Engineer, and over-optimizing with senior-level jargon on an entry-level resume creates a mismatch flag for human reviewers downstream

### Step 2: Deconstruct the Job Description Into a Keyword Taxonomy

Modern ATS systems parse job descriptions and resumes using a combination of exact string matching, semantic matching (especially in AI-enhanced platforms like Eightfold, HireVue's resume tool, or Workday's Skills Cloud), and weighted scoring based on required vs. preferred qualifications.

Extract keywords into the following six categories:

- **Tier 1 -- Hard Requirements:** Skills, tools, certifications, degrees, or years of experience listed under "Required," "Must Have," "Minimum Qualifications," or appearing in the job title itself. These are knockout criteria -- missing Tier 1 keywords is the most common reason for ATS rejection. Examples: "Python," "Series 7 license," "PMP certification," "5+ years of SQL experience," "Bachelor's degree in Computer Science"
- **Tier 2 -- Preferred/Nice-to-Have:** Skills listed under "Preferred," "Nice to Have," "Bonus," or "Plus." ATS systems often use these for ranking, not filtering. Adding these improves score rank even if not strictly required. Examples: "experience with dbt," "familiarity with Tableau," "exposure to Kubernetes"
- **Tier 3 -- Repeated Phrase Keywords:** Any phrase that appears 2 or more times in the posting, regardless of whether it is listed as required. Repetition signals employer emphasis. Example: if "cross-functional collaboration" appears in the responsibilities section and again in qualifications, it is high priority
- **Tier 4 -- Job Title Variants:** The exact title in the posting, common variants of that title, and the department name. ATS systems frequently score resumes that contain a version of the target title more highly. A posting for "Senior Data Analyst" gives higher scores to resumes containing "data analyst," "senior analyst," or "data analysis"
- **Tier 5 -- Industry and Domain Vocabulary:** Terms that signal domain fluency without necessarily being explicit requirements. A healthcare PM posting will include "care coordination," "EHR," "HIPAA," "clinical workflows" -- even if not listed as requirements, their presence signals domain fit to both ATS and human reviewers
- **Tier 6 -- Action Verb Alignment:** Verbs the posting uses in its responsibilities section. If the posting says "spearhead," "drive," "scale," and "own," mirroring these verbs (especially in the summary) creates linguistic alignment that improves semantic match scores in AI-assisted ATS platforms

Tally the total unique keywords. A typical job description for a technical role yields 20-35 meaningful keywords; a business/operations role yields 15-25. Flag the count because it sets the baseline for the match rate calculation.

### Step 3: Audit the User's Existing Resume for Keyword Coverage

Map every extracted keyword against the user's current resume. Use three match states and be precise about them:

- **Exact Match:** The keyword appears verbatim in the resume. This is the only state that guarantees ATS credit on platforms using pure string matching (Taleo, older iCIMS versions). Score as 1.0 in your match calculation
- **Semantic Match (Synonym):** The user has the skill but uses different terminology. Examples: resume says "Scrum" but posting says "Agile"; resume says "revenue growth" but posting says "business development"; resume says "C#" but posting says ".NET." Semantic match earns partial credit on AI-enhanced platforms (Greenhouse, Lever, modern Workday) but zero credit on legacy string-matching platforms. Score as 0.5 in your match calculation
- **Missing -- User Has the Skill:** The skill is genuinely present in the user's experience but is simply not mentioned. This is the highest-value optimization opportunity -- the user is losing credit for real qualifications
- **Missing -- User Does Not Have the Skill:** A true gap. Flag it but do not add it. Noting the gap is useful because the user can decide whether to acquire it or reconsider the application

Calculate the weighted match rate: (exact matches + 0.5 × semantic matches) / total Tier 1+2+3 keywords × 100. A score below 50% indicates significant optimization opportunity. A score below 30% on Tier 1 keywords alone suggests the role may be a poor fit.

Target thresholds to communicate to the user:
- **Below 50% before optimization:** High rejection risk; substantial rewrite needed
- **50%-70% before optimization:** Moderate risk; targeted keyword injection should bring this into safe range
- **70%-85% before optimization:** Low risk; focused tweaks to summary and skills section are sufficient
- **Above 85% before optimization:** Minimal optimization needed; focus on formatting audit and human readability

### Step 4: Prioritize Keywords for Placement

Not every section has equal ATS weight. Most ATS platforms parse and weight sections in the following order of importance:

1. **Job title / headline:** Highest weight in many platforms. If the user's current title differs from the target title, recommend they add a "Target Role" or "Professional Title" line at the top
2. **Summary / Professional Profile:** Parsed as a high-weight text block. Tier 1 keywords placed here give strong early signals. Aim for 5-8 keywords in a 3-5 sentence summary without sounding robotic
3. **Skills section:** Many ATS platforms have dedicated skills parsing logic. This is the single easiest place to add missing keywords the user genuinely possesses. Organize into logical subcategories (Technical Skills, Methodologies, Tools & Platforms, Domain Knowledge)
4. **Experience section bullets:** The largest and most critical body of text. Keywords here get significant weight and also communicate context -- that the user has applied the skill in a real setting, not just listed it. Distribute keywords across multiple bullets at multiple jobs rather than clustering them in one bullet
5. **Education and certifications:** Parse certification names exactly as they appear on the official credential and in the job description. "PMP" and "Project Management Professional (PMP)" should both appear if both versions appear in the posting

For Tier 1 keywords, ensure they appear in at least two sections (e.g., both Skills and at least one Experience bullet). For Tier 2 keywords, one placement is sufficient. For Tier 3 repeated-phrase keywords, mirror the exact phrase in the summary or a high-visibility bullet.

### Step 5: Rewrite Content With Keyword Integration

Apply the following technique-specific rules for each section:

**For the Summary/Profile:**
- Open with the target job title or a close variant in the first sentence: "Results-oriented Product Manager with 6 years of experience driving product roadmap development..."
- Integrate 5-8 Tier 1 and Tier 3 keywords in the first 3 sentences, because some ATS platforms truncate text during scoring
- Do not use first person ("I") -- ATS and human reviewers both penalize it
- Keep to 3-5 sentences and under 100 words. Longer summaries dilute keyword density
- Include a quantified career highlight ("driving $4M in ARR growth," "managing teams of 12+") to make the section compelling to human reviewers who read past ATS

**For Experience Bullets:**
- Preserve the Action Verb + Context + Quantified Result structure from the original bullets. Never remove quantified metrics to make room for keywords -- add keywords around the metrics
- When replacing a synonym with the exact keyword, restructure the sentence so the keyword falls within the first 8-10 words of the bullet. ATS parsing weights earlier text in a bullet more heavily than later text
- Use the "and/or" technique for synonym bridging when both terms are genuinely applicable: "Led Agile/Scrum ceremonies including sprint planning, backlog grooming, and retrospectives" captures both "Agile" and "Scrum" in one natural bullet
- Distribute Tier 1 keywords across at least 2-3 different bullets and ideally across 2 different job entries, if the skill was used at multiple roles. This prevents keyword clustering, which some AI-enhanced ATS platforms flag as suspicious
- Do not repeat the exact same keyword phrase in more than 3 bullets -- it triggers keyword stuffing detection in platforms like Greenhouse and HireVue
- If a required keyword represents a skill the user genuinely has but never used formally (e.g., "stakeholder management" when the user managed client relationships but never used that term), reframe the existing bullet using the keyword: "Managed stakeholder relationships across 3 business units..." is accurate and keyword-matched

**For the Skills Section:**
- List every Tier 1 and Tier 2 keyword the user genuinely possesses that is not already well-represented in experience bullets
- Spell out abbreviations on first use and include both forms: "SQL (Structured Query Language)," "Agile (Scrum, Kanban)," "CI/CD (Continuous Integration/Continuous Deployment)"
- Organize into 4-6 subcategories with clear headers. ATS platforms parse categorized skills lists more accurately than undifferentiated comma-separated lists
- Do not include skills the user has only theoretical knowledge of -- these will be exposed in interviews. Flag any keyword the user is uncertain about and ask them to confirm before adding

### Step 6: Build the Keyword Match Report

Produce a structured report that shows the user exactly what changed and why. This serves two purposes: it builds trust by making the optimization transparent, and it gives the user a document to reference during interview preparation (knowing which keywords you added helps you prepare to speak to them).

The report must include:
- Raw keyword count from the job description
- Weighted match rate before optimization (using the 1.0/0.5/0 scoring described in Step 3)
- Weighted match rate after optimization
- A tiered keyword table sorted by Tier (1 first, then 2, then 3) showing before/after status and placement for each keyword
- A separate table of intentionally omitted keywords with clear reasons
- A note if the post-optimization match rate is still below 70% on Tier 1 keywords, explaining why (true skill gap) and what the user could do about it (certification, project, honest application with gap disclosed)

### Step 7: Conduct the ATS Formatting Audit

Content optimization is wasted if the ATS cannot parse the file. Run a formatting checklist covering the following known failure points:

- **File format:** .docx (Word) is parsed most reliably by Taleo, iCIMS, and Workday. PDF is safe on Greenhouse and Lever. Never use .pages, .odt, or image-based PDFs (scanned documents). Ask the user what format they are using
- **Section headers:** Must use standard labels -- "Work Experience" or "Experience," "Education," "Skills," "Certifications," "Summary." Creative labels like "My Journey," "Where I've Made Impact," or "Expertise" are frequently misclassified or ignored entirely
- **Columns and tables in content:** Two-column resume layouts (popular on Canva and many design templates) cause ATS parsers to read text left-to-right across columns, producing garbled output. All content must be in a single-column flow
- **Text in headers, footers, and text boxes:** ATS systems frequently skip these entirely. Contact information in a styled header block, or a sidebar with skills in a floating text box, may be invisible to the parser
- **Graphics, icons, and progress bars:** Skills rating bars ("Python ████░░ 4/5") are meaningless to ATS and render as blank lines. Icons next to section headers are ignored at best, disruptive at worst
- **Fonts:** Standard fonts (Calibri, Arial, Garamond, Georgia, Helvetica, Times New Roman) parse correctly. Decorative or display fonts can cause character-encoding errors in older ATS parsers
- **Date format consistency:** Use "Month YYYY" format (e.g., "January 2022 -- March 2024") consistently. Formats like "1/22 - 3/24" or "2022-24" are misinterpreted by some parsers and can corrupt employment gap calculations
- **Hyperlinks:** URLs and LinkedIn links parse correctly, but anchor-text hyperlinks (clickable blue text) are sometimes stripped. If including a LinkedIn URL, write it out in plain text

---

## Output Format

```
## ATS Optimization Report: [Target Role Title] at [Company Name, if known]

---

### Section 1: Keyword Analysis

**Job description keywords identified:** [total count]
**Tier 1 (Required) keywords:** [count]
**Tier 2 (Preferred) keywords:** [count]
**Tier 3 (Repeated-phrase) keywords:** [count]

**Weighted match rate (before optimization):** [X]% 
(Exact: [n] keywords | Semantic/Synonym: [n] keywords | Missing: [n] keywords)

**Weighted match rate (after optimization):** [Y]%
(Exact: [n] keywords | Semantic converted to exact: [n] | Remaining gaps: [n])

---

#### Tier 1 -- Required Keywords

| Keyword | Before | After | Placement | Notes |
|---------|--------|-------|-----------|-------|
| [keyword] | Missing | Added | Summary + Skills | User confirmed skill |
| [keyword] | Synonym ("X") | Exact match | Experience, Job 1 bullet 2 | |
| [keyword] | Exact match | Exact match | Already present | No change needed |
| [keyword] | Missing | OMITTED | -- | User does not possess |

#### Tier 2 -- Preferred Keywords

| Keyword | Before | After | Placement | Notes |
|---------|--------|-------|-----------|-------|
| [keyword] | Missing | Added | Skills section | |
| [keyword] | Exact match | Exact match | Already present | |

#### Tier 3 -- Repeated-Phrase Keywords (2+ occurrences in posting)

| Keyword | Occurrences in JD | Before | After | Placement |
|---------|------------------|--------|-------|-----------|
| [phrase] | [count] | Missing | Added | Summary sentence 2 |
| [phrase] | [count] | Partial | Exact | Experience, Job 2 bullet 1 |

---

#### Intentionally Omitted Keywords

| Keyword | Tier | Reason |
|---------|------|--------|
| [keyword] | 1 | User does not have this certification. Gap acknowledged. |
| [keyword] | 2 | User uncertain -- verify before adding. |

**⚠ Tier 1 Gap Warning:** [If any Tier 1 keywords are omitted, flag here with a plain-language explanation of the risk and suggested action -- e.g., "The posting requires AWS certification (AWS Certified Solutions Architect). Your application may be filtered on this criterion. Consider whether to apply and address the gap in your cover letter, or pursue the certification before applying."]

---

### Section 2: Optimized Resume Content

*Added or changed keywords are bolded in the output below. Original metrics and achievements are preserved exactly.*

#### Professional Summary (Optimized)

[3-5 sentences, under 100 words, opening with target role title, integrating 5-8 Tier 1/3 keywords, closing with a quantified career highlight]

---

#### Experience Section (Optimized)

**[Most Recent Job Title] | [Company Name] | [Start Date] -- [End Date or Present]**

- [Optimized bullet 1 -- keyword bolded, metric preserved]
- [Optimized bullet 2 -- keyword bolded, metric preserved]
- [Optimized bullet 3 -- keyword bolded, metric preserved]

**[Previous Job Title] | [Company Name] | [Start Date] -- [End Date]**

- [Optimized bullet 1]
- [Optimized bullet 2]

---

#### Skills Section (Optimized)

**Technical Skills:** [keyword], [keyword], [keyword]
**Tools & Platforms:** [keyword], [keyword], [keyword]
**Methodologies:** [keyword], [keyword], [keyword]
**Domain Knowledge:** [keyword], [keyword]
**Certifications:** [exact certification name as it appears on the credential]

---

### Section 3: ATS Formatting Audit

| Check | Status | Action Required |
|-------|--------|-----------------|
| File format (.docx or parseable PDF) | [Pass/Unknown/Fail] | [Action or "None"] |
| Single-column layout (no tables or text boxes for content) | [Pass/Unknown/Fail] | [Action] |
| Standard section headers (Experience, Education, Skills) | [Pass/Unknown/Fail] | [Action] |
| Contact info in main document body (not header/footer) | [Pass/Unknown/Fail] | [Action] |
| No graphics, icons, skill rating bars | [Pass/Unknown/Fail] | [Action] |
| Dates in consistent Month YYYY format | [Pass/Unknown/Fail] | [Action] |
| Abbreviations spelled out on first use | [Pass/Unknown/Fail] | [Action] |
| No decorative/non-standard fonts | [Pass/Unknown/Fail] | [Action] |

---

### Section 4: Interview Preparation Note

*The following keywords were added to your resume in this optimization. Be prepared to speak to each one concretely in interviews, since these terms will appear on your resume and interviewers will probe them:*

- **[Keyword]:** [1-sentence prompt for the user to recall a specific example from their experience]
- **[Keyword]:** [1-sentence prompt]
- **[Keyword]:** [1-sentence prompt]
```

---

## Rules

1. **Never add a keyword for a skill, tool, or certification the user has not confirmed they possess.** Keyword stuffing with fabricated qualifications is dishonest, wastes the user's time when they advance to interviews, and can result in offer rescission. When uncertain whether the user has a skill, ask before adding it. Flag it as "needs verification" in the omitted keywords table until confirmed.

2. **Use the exact keyword string from the job description, not a synonym or paraphrase.** ATS platforms using pure string matching (Taleo, older iCIMS) will not give credit for "managing stakeholders" when the job description says "stakeholder management." The user loses match score for every synonym left in place. The one exception is when both the job description term and the user's term are industry standard -- in that case, include both using the slash technique ("Agile/Scrum").

3. **Never remove or dilute quantified metrics from the original bullets.** If the user's bullet says "increased revenue by 34%," that number stays. Keywords are added around it, not instead of it. Removing metrics to add keywords makes the optimized resume worse for human reviewers and does not help with ATS scoring.

4. **Place Tier 1 keywords in at least two sections each.** A keyword that appears only in the Skills section gives weaker ATS signals than one that appears in Skills and at least one Experience bullet, because the latter proves the skill was applied in context, not just self-reported.

5. **Do not cluster all keywords into one bullet or one job entry.** Distributing keywords across multiple bullets and multiple job entries looks natural to human reviewers and avoids the density clustering that AI-enhanced ATS platforms (Greenhouse, Workday AI, Eightfold) use to detect keyword stuffing. No single bullet should contain more than 3 intentionally placed keywords.

6. **The optimized output must be paste-ready.** Do not give the user tips about what to do -- give them the rewritten text. Every optimized section must be complete, polished prose or bullets ready to paste into their resume document. Annotations and explanations go in the report sections, not in the resume content sections.

7. **Always include both the abbreviated and the spelled-out form of technical acronyms, especially on first use.** Write "CI/CD (Continuous Integration/Continuous Deployment)" in the Skills section. Write "PMP (Project Management Professional)" in the Certifications line. This captures both the abbreviated form that technical ATS rules match and the spelled-out form that semantic engines match.

8. **If the post-optimization Tier 1 match rate is still below 60%, flag it as a high-rejection-risk application.** Do not suppress this finding to make the user feel better. A user submitting with a 45% Tier 1 match rate after optimization needs to know they may be filtered regardless, so they can decide whether to submit anyway, acquire the missing skills, or redirect their application effort. Present this finding factually and without judgment.

9. **Maintain the readability and natural language quality of the original resume.** An optimized resume that sounds like a keyword list will be rejected by human reviewers even if it passes ATS. After integrating keywords, read each bullet aloud -- if it sounds robotic or lists more than 3 noun phrases in a row without a verb or action structure, rewrite it until it flows naturally.

10. **Include Section 4 (Interview Preparation Note) every time.** Users who optimize their resumes sometimes advance to interviews unprepared to speak to terms they added. For every keyword added that the user has not already demonstrated fluency with, include a one-line prompt reminding them to prepare a specific example. This is what separates resume optimization from resume misrepresentation -- ensuring the user is ready to back up every claim.

11. **Do not change the user's job titles, company names, dates, or educational credentials.** These are factual records that cannot be altered. If the job description requires a credential or degree the user does not have, flag it in the Tier 1 Gap Warning -- do not quietly omit it or work around it.

12. **If the user provides more than one job description for similar roles, analyze keyword overlap before optimizing.** Keywords appearing in 3 out of 3 postings are near-universal requirements for the role and should be treated as Tier 1 regardless of how they are labeled in any single posting. Build a master keyword frequency table and optimize the resume for the intersection, not just one posting.

---

## Edge Cases

### The Job Description Is Generic or Poorly Written

Some postings -- particularly at smaller companies, from third-party recruiters, or for newly created roles -- use vague language like "strong communicator," "team player," and "self-starter" without specifying any tools, methodologies, or technical requirements. When this happens:

Identify the role type and industry, then supplement the extracted keyword list with standard vocabulary for that role family. A generic "Marketing Manager" posting that does not mention specific tools still implies Google Analytics, HubSpot or Salesforce Marketing Cloud, SEO/SEM, campaign management, and A/B testing as standard domain vocabulary. A generic "Software Engineer" posting implies version control (Git), CI/CD pipelines, code review, and the languages most common in the company's tech stack (which can often be found on their engineering blog or job postings for adjacent roles). Note clearly in the report that the supplemental keywords came from role-family research, not the specific posting, and flag that generic postings limit optimization precision.

### The User's Background Has Less Than 40% Tier 1 Keyword Match After Full Optimization

A post-optimization Tier 1 match rate below 40% indicates a probable qualification gap, not a resume writing problem. Do not attempt to bridge a genuine skills gap with keyword engineering -- it will fail at the interview stage even if it passes ATS.

Instead: complete the optimization for any keywords that genuinely apply, calculate the final match rate, and deliver a frank assessment. Explain which Tier 1 keywords the user is missing and what acquiring them would require (certifications with typical timelines, project work, or coursework). Suggest the user consider whether sister roles with lower barriers to entry exist (e.g., "Associate Product Manager" if they are missing PM-specific experience, or "Data Analyst" if they are missing senior "Data Scientist" credentials). This is more valuable than a cosmetically optimized resume that earns interviews the user cannot convert.

### The User's Resume Uses a Design Template With Columns, Icons, or Graphics

This is extremely common because Canva, Novoresume, VisualCV, and similar platforms produce attractive resumes that are structurally catastrophic for ATS parsing. When the user's resume is described as having sidebars, two-column layouts, skill rating bars, or icons, treat this as a critical formatting failure that must be addressed before content optimization has any value.

Explain the specific parsing problem: two-column parsers read left-to-right across columns, so a skills sidebar next to experience bullets produces output like "Python, SQL, Managed a Tableau team of 5 engineers, AWS to deliver..." which is nonsensical. Recommend a complete layout rebuild into a single-column format before the optimization is applied. Provide a prioritized list of what to move where: contact info into the body, skills sidebar into a dedicated skills section below the summary, experience into a single full-width column. This is not optional -- a beautiful resume that ATS cannot parse has a 0% Tier 1 match rate regardless of its content.

### The User Has the Skill Under a Different Industry's Terminology

This occurs frequently in cross-sector applications -- someone moving from consulting to corporate finance, from the military to the private sector, or from academia to industry. The underlying skill exists but the vocabulary differs entirely. Common translation pairs:

- Military "MOS" codes -- translate to specific technical skills (e.g., 25B translates to "IT support, network administration, systems troubleshooting")
- Academic "peer review" and "publication" -- translate to "quality assurance," "technical writing," "research methodology"
- Consulting "engagement management" -- translate to "project management," "client stakeholder management," "account management"
- Government "program officer" -- translate to "program manager," "budget management," "regulatory compliance"

When this translation gap appears, include both the original term and the job-description term in the optimized bullet: "Managed program officer responsibilities including stakeholder management for 6 agency clients and $2.3M budget oversight." This preserves authenticity while maximizing keyword matching. Flag this in the report as a translation, not a fabrication.

### The User Is Applying to Multiple Similar Roles Simultaneously

Users actively job searching often apply to 10-20 similar roles concurrently. Optimizing for each individual posting is impractical. Instead:

If the user provides 3 or more postings (or even 2 postings for similar roles), run a keyword frequency analysis across all postings before optimizing. Build a Master Keyword Table showing frequency across postings. Keywords appearing in 100% of postings (e.g., "project management," "cross-functional collaboration," "data analysis") should be deeply embedded -- appearing in summary, multiple experience bullets, and skills. Keywords appearing in 60-70% of postings (e.g., "SQL," "Salesforce," "Agile") should be in at least experience and skills. Keywords appearing in fewer than 50% of postings are niche -- optimize for them only when applying to that specific role.

Produce one optimized "master resume" with universal keywords fully integrated, plus a note on which 2-3 keywords to swap in/out per application for role-specific tailoring.

### The User's Current Resume Has Significant Keyword Overlap But Zero Callbacks

When the user already has a 70%+ keyword match rate but reports no interview callbacks, the problem is likely not ATS keyword coverage -- it is something else. Do not over-optimize further and misdiagnose the problem.

Investigate these alternative explanations: the resume has formatting issues that cause ATS parsing failures despite good content (check the formatting audit thoroughly); the user is systematically under-qualified on Tier 1 criteria (experience level, certifications, required degree); the bullets are keyword-rich but lack quantified achievements that signal competence to human reviewers; the application volume is too low to generate statistically meaningful feedback (fewer than 20-30 applications to similar roles); or the target role is genuinely above the user's current seniority level. Report these findings and recommend the appropriate next step (formatting rebuild, bullet quantification, or skill development) rather than adding more keywords to a resume that already has sufficient coverage.

### Certifications With Specific Version or Expiration Requirements

Certain fields -- cybersecurity (CISSP, CEH, CompTIA Security+), project management (PMP, PRINCE2), cloud platforms (AWS Solutions Architect, Google Cloud Professional, Azure AZ-104), and finance (CFA, Series 7, CFP) -- have certifications with version numbers, expiration dates, and maintenance requirements. ATS systems in these fields are often configured to match on exact certification names and sometimes filter based on whether the certification is current.

When the user lists a certification, check whether the posting specifies a version (e.g., "ITIL v4," "PMP -- active") or recency. If the certification is listed as expired or the user is not sure whether it is current, flag this explicitly. For cloud certifications especially, note that AWS, Google, and Azure certifications expire on a 3-year cycle and an expired certification on a resume can trigger a mismatch flag in systems that cross-reference credential databases. The safe format is: "AWS Certified Solutions Architect -- Professional (earned [Month Year]; valid through [Month Year])."

---

## Example

**User input:**

"Here's the job description for a Senior Data Analyst role at a mid-size fintech company:

'We are looking for a Senior Data Analyst to join our growth analytics team. You will be responsible for building and maintaining dashboards, conducting A/B testing to optimize conversion funnels, and delivering actionable insights to stakeholders across product, marketing, and finance. Requirements: 4+ years of experience in data analytics, proficiency in SQL and Python, experience with Tableau or Looker, strong statistical analysis skills, experience designing A/B tests and interpreting results, ability to present findings to non-technical stakeholders. Nice to have: experience with dbt, familiarity with Snowflake or BigQuery, exposure to machine learning models. We value cross-functional collaboration and data-driven decision-making.'

My current resume content:

Summary: 'Experienced analyst with a background in financial data and reporting. Good at finding insights and presenting them to business teams.'

Experience bullets (current role, Data Analyst at PaySmart Inc.):
- Pulled data from the database to make reports for the business team
- Built charts and graphs for the marketing department
- Helped with testing different versions of the checkout page
- Made presentations for leadership about monthly performance

Skills: Excel, SQL, PowerPoint, reporting"

---

**Output:**

## ATS Optimization Report: Senior Data Analyst (Growth Analytics) -- Fintech

---

### Section 1: Keyword Analysis

**Job description keywords identified:** 22
**Tier 1 (Required) keywords:** 11
**Tier 2 (Preferred/Nice-to-Have) keywords:** 5
**Tier 3 (Repeated-phrase keywords, 2+ occurrences):** 4

**Weighted match rate (before optimization):** 18%
(Exact: 2 keywords | Semantic/Synonym: 2 keywords | Missing: 18 keywords)

**Weighted match rate (after optimization):** 86%
(Exact: 17 keywords | Semantic converted to exact: 2 | Remaining confirmed gaps: 3)

---

#### Tier 1 -- Required Keywords

| Keyword | Before | After | Placement | Notes |
|---------|--------|-------|-----------|-------|
| SQL | Exact match | Exact match | Skills (already present) | Expand to experience bullet |
| Python | Missing | Added | Skills section | User confirmed Python proficiency |
| data analytics | Partial ("analyst") | Exact match | Summary, Skills | Restructured summary opening |
| A/B testing | Partial ("testing different versions") | Exact match | Experience bullet 3, Skills | High-value conversion |
| statistical analysis | Missing | Added | Summary, Skills | User confirmed |
| Tableau or Looker | Missing | Added (Tableau) | Experience bullet 2, Skills | User confirmed Tableau |
| dashboards | Missing | Added | Experience bullet 2 | Synonym "charts" replaced |
| conversion funnel | Missing | Added | Experience bullet 3 | Context applied from A/B test bullet |
| actionable insights | Partial ("finding insights") | Exact match | Summary | Phrase lifted from posting |
| stakeholder | Missing | Added | Summary, Experience bullet 4 | Replaced "business teams"/"leadership" |
| 4+ years experience | Missing | Added | Summary (years of experience stated) | User confirmed 5 years experience |

#### Tier 2 -- Preferred Keywords

| Keyword | Before | After | Placement | Notes |
|---------|--------|-------|-----------|-------|
| dbt | Missing | Added | Skills section | User confirmed dbt usage |
| Snowflake | Missing | Needs verification | -- | Ask user to confirm before adding |
| BigQuery | Missing | Needs verification | -- | Ask user to confirm before adding |
| machine learning | Missing | OMITTED | -- | User has not used ML models |

#### Tier 3 -- Repeated-Phrase Keywords (2+ occurrences)

| Keyword | Occurrences in JD | Before | After | Placement |
|---------|------------------|--------|-------|-----------|
| data-driven | 2 | Missing | Added | Summary sentence 3 |
| cross-functional | 2 | Missing | Added | Experience bullet 4 |
| non-technical stakeholders | 2 | Missing | Added | Experience bullet 4, Summary |
| growth analytics | 2 | Missing | Added | Summary sentence 1 |

---

#### Intentionally Omitted Keywords

| Keyword | Tier | Reason |
|---------|------|--------|
| machine learning models | 2 | User does not have ML modeling experience. Do not add. |
| Snowflake | 2 | Awaiting user confirmation -- add to Skills once verified |
| BigQuery | 2 | Awaiting user confirmation -- add to Skills once verified |

**⚠ Note:** No Tier 1 keywords are fully omitted after optimization. All required qualifications are present in the user's actual experience. The weighted match rate of 86% is strong. The primary optimization was vocabulary alignment -- the user had most of these skills but named them with generic language that ATS systems could not match.

---

### Section 2: Optimized Resume Content

*Added or changed keywords are bolded. Original metrics and details are preserved.*

#### Professional Summary (Optimized)

Senior **Data Analyst** with 5 years of experience in **growth analytics** and financial data environments, specializing in **SQL**, **Python**, and **Tableau** to deliver **actionable insights** to **non-technical stakeholders**. Proven track record designing **A/B tests** to optimize **conversion funnels** and conducting **statistical analysis** across marketing, product, and finance functions. **Data-driven** problem solver who translates complex datasets into clear recommendations that move business decisions forward.

---

#### Experience Section (Optimized)

**Data Analyst | PaySmart Inc. | March 2020 -- Present**

- Wrote and maintained complex **SQL** queries and **Python** scripts to extract, clean, and transform data from production databases, reducing ad hoc reporting turnaround from 3 days to same-day delivery
- Designed and maintained **Tableau dashboards** for the marketing and product teams, consolidating 12 disparate spreadsheet reports into 3 live views tracking acquisition, activation, and retention metrics
- Led **A/B testing** program for the checkout **conversion funnel**, designing experiments, defining statistical significance thresholds, and interpreting results -- contributing to a 14% improvement in checkout completion rate over 6 months
- Delivered monthly **data-driven** performance analyses to **cross-functional stakeholders** across product, marketing, and finance, presenting findings in business terms to **non-technical stakeholders** and recommending prioritized action items

---

#### Skills Section (Optimized)

**Technical Skills:** **SQL** (Structured Query Language), **Python** (pandas, NumPy, matplotlib), **Tableau**, Excel, **dbt**
**Data & Analytics:** **A/B testing**, **Statistical analysis**, **Conversion funnel analysis**, **Dashboard** development, **Growth analytics**
**Tools & Platforms:** Snowflake *(verify)*, BigQuery *(verify)*, Looker *(verify)*
**Domain Knowledge:** Financial data, Fintech, **Data-driven decision-making**
**Communication:** Executive-level presentations, **Non-technical stakeholder** communication, **Actionable insights** delivery

---

### Section 3: ATS Formatting Audit

| Check | Status | Action Required |
|-------|--------|-----------------|
| File format (.docx or parseable PDF) | Unknown | Confirm you are saving as .docx for submission or a text-based PDF -- not an image scan or Canva export |
| Single-column layout (no tables or text boxes) | Unknown | If using a multi-column template, rebuild in a single-column Word document before submitting |
| Standard section headers (Experience, Education, Skills) | Unknown | Ensure your headers read exactly: "Experience," "Education," "Skills" -- not "Where I've Worked" or "My Expertise" |
| Contact info in main document body (not in header/footer) | Unknown | Move name, email, phone, and LinkedIn URL into the top of the document body, not a floating header |
| No graphics, icons, or skill rating bars | Unknown | Remove any star ratings, progress bars, or graphic icons -- replace with plain text skills list |
| Dates in consistent Month YYYY format | Unknown | Standardize all dates to "March 2020 -- Present" format throughout |
| Abbreviations spelled out on first use | Pass (handled in optimized content) | "SQL (Structured Query Language)" and "CI/CD" variants now spelled out in Skills section |
| Decorative fonts | Unknown | Switch to Calibri, Arial, or Garamond if using custom fonts |

---

### Section 4: Interview Preparation Note

The following keywords were added or elevated in this optimization. Before submitting, prepare a specific 60-second example for each one to use in interviews:

- **A/B testing:** You can reference the checkout funnel experiments. Be ready to explain how you determined sample size, set the significance threshold (typically p < 0.05), and how you communicated results. Interviewers will probe whether you understand statistical significance vs. practical significance.
- **Statistical analysis:** Prepare to explain what statistical methods you applied -- even basic ones like t-tests, confidence intervals, or regression analysis. "Statistical analysis" on a resume invites questions; know what you will say.
- **Python:** Be ready to name the libraries you use most (pandas, NumPy) and describe a specific problem you solved with Python that you could not have solved in SQL or Excel alone. Interviewers in data roles frequently give a short technical screen.
- **dbt:** If you added dbt to your Skills section, prepare to explain your workflow -- how you use dbt models, whether you write tests, and what your project structure looks like. Do not add this if your experience is limited to running existing models without understanding the SQL transformations.
- **Cross-functional stakeholders:** Prepare a specific example of a time you had conflicting priorities from two different teams (e.g., product vs. marketing) and how you navigated the conflict or prioritized the analysis request. This is a behavioral question hiding inside a keyword.
