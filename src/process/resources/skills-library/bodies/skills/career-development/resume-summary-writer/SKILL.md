---
name: resume-summary-writer
description: |
  Writes a 3-5 sentence professional summary section for a resume, tailored to
  the target role and experience level. The summary leads with the strongest
  differentiators and uses language aligned to the target field. Produces
  complete, paste-ready summary text. Use when the user wants to write or improve
  their resume summary, professional profile, or career summary section. Do NOT
  use for resume experience bullets (use resume-bullet-writer), career change
  resume rewrites (use career-change-resume), or LinkedIn About sections
  (use linkedin-summary-writer).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "resume-writing career template"
  category: "career-development"
  subcategory: "job-search"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Resume Summary Writer

## When to Use

Use this skill when any of the following situations apply:

- The user explicitly asks to write, rewrite, update, or improve the professional summary, profile statement, career summary, or "About" section at the top of their resume
- The user has a resume summary that feels too generic, uses weak filler language ("results-driven professional," "passionate team player"), or was written for a different role and needs to be retargeted
- The user is unsure what to include at the top of their resume or asks what a professional summary should contain
- The user has a complete resume but feels the top section does not represent their strongest qualifications for a specific target role
- The user is preparing for a job search campaign and needs a strong anchor summary that can be adapted across multiple applications
- The user is moving from individual contributor to management or management to executive, and their current summary no longer reflects the seniority level they are targeting
- The user has returned to the workforce after a gap and needs a summary that leads with strengths rather than absence
- The user is a veteran transitioning out of military service and needs civilian-translated summary language

**Do NOT use this skill when:**

- The user needs experience bullets written or rewritten -- use `resume-bullet-writer`, which handles CAR (Challenge-Action-Result) structure and quantified accomplishment formatting specific to work history sections
- The user is making a complete career change where industry, function, and role type are all different simultaneously -- use `career-change-resume`, which handles transferable skill mapping and strategic narrative repositioning across the entire document
- The user wants a LinkedIn About section -- use `linkedin-summary-writer`, because LinkedIn summaries use first person, longer paragraphs, conversational tone, and storytelling structure that is inappropriate for a resume
- The user wants a cover letter opening paragraph -- use `cover-letter-writer`, which writes to a specific hiring manager with a hook and value proposition formatted for letter structure
- The user needs a bio for a conference, website, or speaker page -- those formats use third person, longer prose, and narrative arc that differs fundamentally from resume conventions
- The user needs a federal resume summary -- federal resumes follow USAJOBS format rules with KSA language and OPM classification requirements that are outside this skill's scope

---

## Process

### Step 1: Gather the five essential inputs before writing anything

Do not write a single sentence of the summary until you have all five of these inputs. A summary written without them will be generic and unusable.

- **Target role title and level:** The exact job title they are applying for (not their current title) and the seniority level -- entry (0-2 years), mid (3-7 years), senior (8-15 years), or executive (15+ years). If the user says "senior engineer" but has 4 years of experience, flag the mismatch and discuss whether the target level is realistic.
- **Quantified signature achievement:** One specific accomplishment with a real number -- revenue generated or saved, percentage improvement, team or user count, volume processed, time reduced, error rate dropped. If the user cannot provide a number, ask them to estimate: "Roughly how many people were affected? By what percentage did it improve?" Even rough estimates are better than nothing and can be softened with "approximately" or "nearly."
- **Core skill cluster:** The 3-5 skills, tools, methodologies, or domain areas most directly relevant to the target role -- not everything on their resume, but the top cluster. Cross-reference with the target role's job description language if the user has it.
- **Industry or functional domain:** The sector (healthcare, fintech, manufacturing, SaaS, nonprofit) and functional area (marketing, operations, engineering, finance) -- these determine which vocabulary register to write in.
- **Any hard differentiators:** Certifications (PMP, CPA, CISSP, AWS Solutions Architect), advanced degrees relevant to the role, languages, clearances, patents, published work, or niche tool expertise that competitors are unlikely to share.

If the user provides a job description, extract the top 5 keywords and phrases from it -- these should appear in the summary where authentic, because Applicant Tracking Systems (ATS) score keyword density before a human reads the document.

### Step 2: Determine the structural formula based on experience level

Each experience tier requires a different opening strategy and sentence count. Do not apply the same structure to an entry-level candidate and an executive -- the hiring audience, the proof points expected, and the language register are entirely different.

- **Entry-level (0-2 years):** 2-3 sentences, 40-70 words. Lead with degree, field of study, and the most relevant applied experience (internship, capstone, research, volunteer work). Feature one metric from an academic or project context. Do NOT open with "Recent graduate seeking..." -- that wastes sentence 1. Instead: "[Degree] in [Field] + specific applied context + one result."
- **Mid-level (3-7 years):** 3-4 sentences, 60-90 words. Lead with years of experience and the professional identity most directly named in the target role. Feature one signature achievement with a metric in sentence 2. Add a specialization sentence that mentions key tools or methodology. This tier gets the most ATS keyword density benefit from a well-tuned summary.
- **Senior-level (8-15 years):** 4-5 sentences, 80-120 words. Lead with scope and professional identity -- not just what they do, but the scale at which they do it. Feature a signature achievement and at minimum one scope signal (team size, budget managed, geographic reach, organizational complexity). Add a strategic impact sentence. Forward-looking optional sentence may appear at the end if the target role represents an upward or lateral move.
- **Executive (15+ years):** 4-5 sentences, 90-120 words. Lead with transformation language -- P&L ownership, organizational redesign, market entry, turnaround, scale. Features enterprise-scale metrics ($10M+, 500+ employees, market share points, valuation impact). Vocabulary shifts to: "enterprise," "C-suite," "board," "strategic vision," "organizational transformation," "competitive differentiation." Individual contributor skills disappear entirely -- this is leadership-of-leadership territory.

### Step 3: Construct each sentence with intentional purpose

Every sentence in a resume summary must earn its spot. There is no room for filler. Use this sentence-level framework:

- **Sentence 1 (Identity + Scope):** Establishes professional identity, years of experience (if mid-level or above), and the domain. Sets the reader's frame of reference immediately. Formula: "[X-year] [professional identity] specializing in [domain/vertical]" OR "[Domain]-focused [professional identity] with [X] years [doing specific thing]." Do NOT open with adjectives ("Highly motivated...," "Dynamic professional...," "Dedicated team member...") -- these consume the most valuable real estate on the resume with zero information content.
- **Sentence 2 (Proof):** Delivers the signature achievement. Must contain a number. If multiple achievements exist, pick the one most relevant to the target role, not the largest absolute number. "Reduced hospital readmission rates by 18% by redesigning the patient discharge workflow across 3 clinics" beats "Managed $50M budget" if the target role is a healthcare operations director focused on quality improvement.
- **Sentence 3 (Specialization):** Names the specific tools, methods, frameworks, or domain areas that differentiate this candidate. This is where ATS-critical keywords live. "Proficient in Python" is weaker than "Applies Python (pandas, scikit-learn, FastAPI) and dbt to build production-grade analytics pipelines." Name the specific sub-tools where possible.
- **Sentence 4 (Scope/Context, senior+ only):** Adds organizational context -- team size managed, budget owned, number of stakeholders served, complexity of the environment. "Leads a 14-person cross-functional team" or "Manages $2.3M annual analytics budget across 4 product lines."
- **Sentence 5 (Forward-looking, optional, senior/executive only):** What they are moving toward or what they bring to the next chapter. Use sparingly. It is more powerful when the rest of the summary is strong enough to make it unnecessary. Never use this sentence to say "seeking a role in" -- that is an objective statement and is obsolete.

### Step 4: Apply field-specific vocabulary calibration

The vocabulary register of a resume summary must match the vocabulary of the target field. A software engineer applying to a staff engineering role should not sound like a product manager, and vice versa. Apply these field-specific conventions:

- **Engineering/Technical roles:** Use specific technology names, architecture patterns (microservices, event-driven, monolith-to-distributed), scale signals (requests per second, data volume in TB/PB, uptime percentage, latency targets). Avoid management language unless they are targeting an engineering manager role.
- **Marketing roles:** Use channel-specific language (demand gen, paid acquisition, organic growth, conversion rate optimization, MQL-to-SQL pipeline, attribution modeling). CAC, LTV, ROAS, and CPL are expected vocabulary. "Increased brand awareness" is unusable without a metric.
- **Finance and accounting:** Use precision -- dollar amounts (not "millions" but "$14.2M"), accounting standards referenced (GAAP, IFRS), software named (SAP, Oracle Financials, Workday, Hyperion). Regulation awareness (SOX, FASB, SEC reporting) signals credibility.
- **Operations and supply chain:** Lead times, cost reduction percentages, throughput rates, OEE (Overall Equipment Effectiveness), Six Sigma certification level, inventory turns, OTIF (On-Time-In-Full) rates. Use the language of efficiency and process maturity.
- **Healthcare and life sciences:** Regulatory context (FDA, HIPAA, Joint Commission, CMS), clinical settings named, patient volume or census data, outcomes metrics (readmission rates, HCAHPS scores, length of stay), EHR platforms (Epic, Cerner, Meditech).
- **Legal:** Areas of practice named precisely (not "corporate law" but "M&A and PE-backed transactions"), deal size, bar admissions, court systems, case outcomes.
- **Product management:** Framework fluency (OKRs, jobs-to-be-done, dual-track agile, north star metric, PRD-to-launch cycle), ARR growth, feature adoption rates, DAU/MAU, NPS impact.

### Step 5: Strip all weak language and replace with evidence

Before finalizing, perform a pass that identifies and eliminates or replaces every phrase that could appear on any professional's resume regardless of their actual accomplishments. Apply these replacement patterns:

- "Results-driven" -- delete entirely; every sentence must show the result instead
- "Strong communicator" -- replace with the actual audience and frequency: "Presents monthly product roadmap reviews to 30+ cross-functional stakeholders"
- "Team player" -- delete entirely; if collaboration matters, show the team size and what was built together
- "Passionate about [X]" -- replace with evidence of commitment: "Co-author of 3 peer-reviewed papers on machine learning interpretability" or "Holds CISM certification with active participation in ISACA chapter leadership"
- "Hard worker" / "Detail-oriented" -- delete; these are self-assessments that hiring managers discount entirely
- "Proven track record" -- delete; just state the track record
- "Seeking to leverage my experience" -- this is an objective statement; cut it entirely
- "Excellent problem-solving skills" -- replace with the specific problem solved and the outcome

### Step 6: ATS-optimize without keyword stuffing

Applicant Tracking Systems parse resume text before a human reads it, and summary sections receive high parsing weight because they appear first. Apply these ATS principles:

- Use the exact job title from the job posting at least once in the summary (not a synonym). If the posting says "Software Engineer II," that phrase should appear in the summary, not just "software developer."
- Match the seniority signal language: if the posting says "senior," "lead," "principal," or "staff," use that exact modifier
- Avoid excessive formatting (no bullet points inside the summary block, no tables, no text boxes) -- ATS systems often strip or mangle non-standard formatting
- Keep the summary as a clean paragraph block -- 3-5 sentences in a single prose paragraph without headers inside the block itself
- Do NOT pad with keywords not genuinely present in the candidate's background -- ATS keyword stuffing that misrepresents qualifications creates interview situations where the candidate cannot support the claims

### Step 7: Produce two variants and a substitution guide

Always deliver two complete, paste-ready versions with the same underlying content presented in different strategic framings:

- **Variant A -- Achievement-led:** Sentence 1 opens directly with the signature achievement and metric. Professional identity and years of experience appear in sentence 2. This framing is higher risk (it bets everything on the achievement being impressive to the specific reader) but higher reward when the achievement is genuinely strong and directly relevant.
- **Variant B -- Expertise-led:** Sentence 1 establishes professional identity, years of experience, and domain. Achievement appears in sentence 2 or 3. This is the safer, more conventional framing and works better when the achievement needs context to land correctly, or when the target role values deep expertise over a single outcome.
- **Substitution guide:** If the user is applying to multiple similar roles, note which 2-3 phrases should be swapped per role type. Provide a bracket format: "[For product-focused roles, replace 'business intelligence' with 'product analytics']." This saves the user from requesting a new summary for every application.

---

## Output Format

```
## Professional Summary: [Target Role Title] | [Experience Level]

---

### Variant A: Achievement-Led
[3-5 sentences, single paragraph, paste-ready. Opens with signature achievement and metric.]

**Word count:** [##] words

---

### Variant B: Expertise-Led
[3-5 sentences, single paragraph, paste-ready. Opens with professional identity and years.]

**Word count:** [##] words

---

### Summary Construction Map

| Sentence | Purpose | Content Used |
|----------|---------|-------------|
| 1 | [Identity / Achievement opener] | [What appears and why it was chosen] |
| 2 | [Proof / Context] | [What appears and why it was chosen] |
| 3 | [Specialization / Tool cluster] | [Specific skills/tools named and why] |
| 4 | [Scope / Scale, if applicable] | [Organizational context added] |
| 5 | [Forward-looking, if used] | [Direction statement or N/A] |

---

### ATS Keyword Coverage

| Keyword from Target Role | Where It Appears in Summary | Exact Phrase Used |
|--------------------------|----------------------------|-------------------|
| [keyword 1] | Variant A sentence #, Variant B sentence # | "[exact phrase]" |
| [keyword 2] | Variant A sentence #, Variant B sentence # | "[exact phrase]" |
| [keyword 3] | Both variants | "[exact phrase]" |

---

### Language Upgrade Log

| Original Weak Phrasing | Problem | Replaced With |
|------------------------|---------|---------------|
| [phrase from user input] | [Why it is weak] | [Specific replacement used] |
| [phrase from user input] | [Why it is weak] | [Specific replacement used] |

---

### Substitution Guide (for multiple applications)

To adapt this summary for different target roles, swap the following phrases:

- **For [Role Type A] roles:** Replace "[phrase X]" with "[phrase Y]"
- **For [Role Type B] roles:** Replace "[phrase P]" with "[phrase Q]"

---

### If You Need to Add or Swap One Element

| Element | Current Version | How to Update |
|---------|----------------|---------------|
| Achievement | [current] | [instruction for swapping if they have a different achievement to feature] |
| Target role title | [current] | [instruction for updating to match a specific job posting] |
| Skill cluster | [current] | [instruction for swapping tools if applying to a different tech stack] |
```

---

## Rules

1. **Never write the summary before collecting the five essential inputs.** A summary without a target role title, years of experience, a quantified achievement, a skill cluster, and a domain is guaranteed to be generic. If the user resists providing inputs, explain that you need them to write something they can actually use -- not a template they would need to fill in themselves.

2. **Every summary must contain at least one number.** This is non-negotiable. Numbers do not have to be exact -- "approximately," "nearly," "over," and "more than" are acceptable qualifiers. What is not acceptable: a summary with zero quantified claims. Achievements without numbers are claims; achievements with numbers are evidence.

3. **Never open with an adjective-based self-assessment.** "Highly motivated," "dedicated," "dynamic," "passionate," "driven," "detail-oriented," and "results-oriented" in sentence 1 are automatic disqualifiers -- they signal a generic resume to experienced recruiters. The opening word of sentence 1 should be either the professional identity noun ("Software engineer," "Financial analyst," "Marketing director") or the domain adjective that signals specialization ("Healthcare-focused," "B2B SaaS," "Enterprise").

4. **No first-person pronouns.** "I," "my," "me," and "my team" do not appear in resume summaries. The convention is implied first person -- the document is understood to describe its owner. Writing "I led a team of 12 engineers" on a resume immediately signals resume-writing inexperience.

5. **3-5 sentences, 50-120 words. Never exceed 120 words.** Hiring managers spend an average of 6-10 seconds on initial resume review. A summary that extends beyond 120 words will not be read in full. If the content is strong enough, 3 tight sentences outperform 5 loose ones. Length is not a proxy for quality.

6. **The strongest element must appear in sentences 1 or 2, never later.** If the most impressive credential -- the achievement, the degree, the scale of responsibility -- is buried in sentence 4, the recruiter may never reach it. Front-load the most differentiating element every time, even if it feels structurally awkward at first.

7. **Vocabulary must match the target field, not the source field.** A mechanical engineer applying for a product management role should not use "tolerances," "GD&T," or "FEA modeling" in the summary -- those signal the source field, not the target. The summary should use "cross-functional execution," "roadmap development," and "stakeholder alignment." The experience section is where source-field technical depth lives.

8. **Do not include objective statements.** "Seeking a position where I can contribute my skills" and "Looking to grow in a challenging environment" are objective statement language. This format was standard before 1995 and is now universally understood by recruiters to be outdated. It wastes the opening sentence's value on information the reader already knows (the candidate is seeking a position -- they submitted a resume).

9. **Do not list certifications, tools, or skills in a comma-separated inventory format inside the summary.** "Proficient in SQL, Python, R, Tableau, Power BI, Excel, JIRA, and Confluence" is a skills section formatted as a sentence. The summary should name 2-4 tools in context -- how they are applied -- not catalog everything the candidate knows. The skills section at the bottom of the resume handles inventory.

10. **Always deliver two variants.** Some candidates naturally favor achievement-led framing; others find it feels boastful or worry the achievement needs more context to land. Delivering both removes the friction of the user needing to request alternatives and demonstrates that you understand there are multiple valid strategic choices in resume writing, not one correct answer.

---

## Edge Cases

### Entry-level candidate with no professional experience and no numbers

University projects, capstone work, hackathons, research assistantships, volunteer roles, and even relevant coursework all contain latent metrics that can be extracted. Ask: "How many people used or benefited from what you built?" "How large was the dataset?" "What was the team size?" "How long did the project run?" "What grade or award did it receive?" A summary like "Computer science student who built a React-based event management platform adopted by 400+ students at [University] as part of a 5-person agile team during a 12-week capstone sprint" is fully quantified without any professional experience. Never write "Eager recent graduate looking to apply skills" -- it says nothing and positions the candidate as someone without value to offer yet.

### User refuses or cannot provide a quantified achievement

First, push back gently and specifically: "Every job creates or saves something measurable -- time, money, errors, headcount, customer complaints, processing steps. What's one thing you improved or built, even in a small way?" If the user genuinely cannot identify any metric after prompting, write the summary with the strongest non-quantified achievement, but flag it explicitly: "I've written this without a number because we couldn't identify one -- I strongly recommend you go back to your experience and estimate even a rough percentage or count, because summaries without metrics underperform against comparable candidates who have them." Do not pretend a metric-free summary is as strong as one with evidence.

### User provides a job description and wants keyword matching

Extract the top 7-10 keywords from the job description, categorized as: (a) required technical skills, (b) role-specific language the posting uses to describe the function, and (c) soft-skill or cultural language that appears in the "requirements" or "qualifications" sections. Map which of these authentically appear in the candidate's background. Use the exact phrasing from the posting where it matches, because ATS systems often score exact phrase matches higher than synonyms. Flag any keywords from the posting that the candidate cannot authentically claim -- do not insert them. Explain: "The posting uses 'Salesforce CRM' but you mentioned HubSpot -- I've noted this in the ATS coverage table because if you don't have Salesforce experience, inserting it will backfire in the interview."

### User wants the same summary to work across very different role types

This is a signal that the user's job search is unfocused, and it may be worth flagging tactfully: "A summary that tries to speak to both [Role A] and [Role B] simultaneously will be outperformed by a targeted summary for each -- recruiters can tell when a summary was written for someone else." Provide the base summary with the core universal elements, then provide a substitution guide with two clearly labeled swap sets. Explain that modern job search strategy favors 2-3 targeted summaries for different application tracks rather than one universal version.

### User's current summary has strong bones but weak language

Do not rewrite from scratch -- preserve the user's authentic voice and any strong phrases that work, and perform a targeted upgrade. Present the changes in a line-by-line diff format: "Original: 'Experienced manager with strong communication skills.' Revised: 'Operations manager with 9 years of experience leading 30-person distribution teams across two regional facilities.'" This approach respects the user's ownership of their story and builds their intuition for the difference between strong and weak resume language rather than creating dependency on the rewrite tool.

### User is a military veteran translating to a civilian role

Military resumes use rank, MOS codes, unit designations, and acronyms that civilian hiring managers do not decode. The summary must completely translate the military context into civilian equivalents without losing the genuine scale and credibility of military leadership. Specific translations to apply: rank-to-scope (E-8 Master Sergeant typically managed 50-200 personnel; O-5 Lieutenant Colonel typically commanded 500-800 personnel and managed $5M+ equipment), MOS-to-function (11B Infantry to security operations or law enforcement; 25U Signal to network infrastructure; 68W Combat Medic to emergency medical services or healthcare), military achievement language to civilian equivalents (ARCOM = team achievement recognition; MSM = organizational leadership recognition). The summary should read as if written by a civilian professional with equivalent scope -- not as a military record translated into civilian words.

### User's target role title is significantly more senior than their current experience level

This is common when candidates apply for "stretch" roles. Do not manufacture seniority they do not have -- recruiters will catch it in interviews. Instead, write the summary to maximize the legitimate signals of readiness for the next level: leading indicator achievements (managed up by presenting to executives), scope expansion (took on additional responsibility without a title change), and demonstrated leadership without formal authority (led cross-functional initiatives). Note to the user: "I've written this to maximize how ready you look for this level -- there's a real limit to how much the summary alone can close a seniority gap. The experience section doing its job precisely with strong bullets is equally important."

---

## Example

**Input provided by the user:** "I'm applying for Senior Product Manager roles at B2B SaaS companies. I've been a product manager for 7 years, mostly in HR tech. My biggest win was leading a complete redesign of our onboarding flow that increased 30-day user activation from 41% to 68% -- that's for a product with about 80,000 monthly active users. I'm strong in product discovery, roadmap prioritization, Jira, Figma, and I've worked closely with enterprise sales teams. I've managed 2 direct reports (associate PMs). I don't have a job description but I know these roles care about activation, retention, and working with enterprise customers."

---

**Output:**

## Professional Summary: Senior Product Manager -- B2B SaaS | Mid-to-Senior Level

---

### Variant A: Achievement-Led

Led a full redesign of the user onboarding flow for an 80,000-MAU HR tech platform, lifting 30-day activation from 41% to 68% -- a 66% relative improvement that directly shortened time-to-value for enterprise customers. Seven years building B2B SaaS products in the HR technology vertical, with deep expertise in product discovery, prioritization frameworks, and enterprise go-to-market collaboration. Applies Figma for continuous discovery and Jira for cross-functional sprint alignment across engineering, design, and enterprise sales. Manages and mentors a 2-person associate PM team while driving roadmap strategy for a multi-segment enterprise customer base.

**Word count:** 91 words

---

### Variant B: Expertise-Led

B2B SaaS product manager with 7 years of experience in HR technology, specializing in enterprise user activation, retention strategy, and cross-functional roadmap execution. Redesigned the user onboarding experience for an 80,000-MAU platform, increasing 30-day activation by 27 percentage points (41% to 68%) and meaningfully compressing the time-to-value curve for enterprise accounts. Fluent in product discovery methods and prioritization frameworks; executes across the full product lifecycle using Figma and Jira in close collaboration with enterprise sales and customer success teams. Leads and mentors a 2-person associate PM team while managing roadmap trade-offs across a multi-segment enterprise customer base.

**Word count:** 99 words

---

### Summary Construction Map

| Sentence | Purpose | Content Used |
|----------|---------|-------------|
| 1 | Identity + Scope opener | "B2B SaaS product manager," "7 years," "HR technology" -- establishes professional identity and domain immediately |
| 2 | Signature achievement | Onboarding redesign: 41% to 68% activation on 80K MAU platform -- the single most impressive, directly relevant proof point |
| 3 | Specialization + Tool cluster | Product discovery, prioritization, Figma, Jira, enterprise sales collaboration -- high ATS density for PM job descriptions |
| 4 | Scope + Management context | 2-person AP team, enterprise customer base, multi-segment roadmap -- signals readiness for Senior PM seniority |
| 5 | Not used | Summary is complete at 4 sentences; forward-looking sentence would dilute the impact |

---

### ATS Keyword Coverage

| Keyword from Target Role | Where It Appears | Exact Phrase Used |
|--------------------------|-----------------|-------------------|
| Product Manager / Senior PM | Both variants, sentence 1 | "B2B SaaS product manager" / "Senior Product Manager" (title) |
| Activation | Both variants, sentence 2 | "30-day activation," "user activation" |
| Enterprise | Both variants, sentences 3-4 | "enterprise customers," "enterprise sales," "enterprise accounts" |
| Roadmap | Both variants, sentence 4 | "roadmap strategy" / "roadmap trade-offs" |
| Jira | Both variants, sentence 3 | "Jira for cross-functional sprint alignment" / "using Figma and Jira" |
| Figma | Both variants, sentence 3 | "Applies Figma for continuous discovery" |
| B2B SaaS | Both variants, sentence 1 | "B2B SaaS product manager" |

---

### Language Upgrade Log

| Original Weak Phrasing | Problem | Replaced With |
|------------------------|---------|---------------|
| "I'm strong in product discovery" | Self-assessment with no evidence | "Fluent in product discovery methods and prioritization frameworks" -- stated as a professional descriptor, not a self-grade |
| "worked closely with enterprise sales teams" | Vague collaboration claim | "Close collaboration with enterprise sales and customer success teams" + "directly shortened time-to-value for enterprise customers" -- shows the outcome of that collaboration |
| Activation figures stated only in absolute terms (41% to 68%) | Absolute figures are harder to process quickly | Added relative improvement framing: "66% relative improvement" and "27 percentage points" so readers with different mental math preferences both receive the signal |
| "Managed 2 direct reports" | Reported a fact without showing what it means for the target level | "Leads and mentors a 2-person associate PM team while managing roadmap trade-offs" -- frames the management as active leadership contributing to strategic work, not administrative oversight |

---

### Substitution Guide (for multiple applications)

To adapt this summary for different target roles within the Senior PM tier, swap the following phrases:

- **For growth-focused PM roles:** Replace "time-to-value curve" with "activation-to-retention flywheel" and add "DAU/MAU optimization" to the specialization sentence
- **For platform/infrastructure PM roles:** Replace the onboarding achievement framing with a developer experience or API adoption metric if applicable, and replace "Figma" with "technical specification and API documentation workflows"
- **For roles outside HR tech:** Replace "HR technology vertical" in sentence 1 with the target vertical (e.g., "fintech," "martech," "developer tools") -- only do this if you have genuine transferable experience in that vertical; do not fabricate domain expertise

---

### If You Need to Add or Swap One Element

| Element | Current Version | How to Update |
|---------|----------------|---------------|
| Signature achievement | 41% to 68% activation on onboarding redesign | If applying to a role focused on retention rather than activation, lead with a retention metric if you have one -- otherwise the activation result is still highly relevant as a proxy for retention health |
| Target role title | "Senior Product Manager -- B2B SaaS" | Update to match the exact title in each job posting for ATS parsing ("Group Product Manager," "Lead Product Manager," "Principal Product Manager" each carry different seniority signals) |
| Skill cluster | Figma, Jira, discovery, prioritization | If the posting specifically names Amplitude, Mixpanel, or SQL as required skills, add the one(s) you genuinely have into sentence 3 -- "data-informed prioritization using Amplitude and SQL" is a high-value ATS phrase in modern PM job descriptions |
