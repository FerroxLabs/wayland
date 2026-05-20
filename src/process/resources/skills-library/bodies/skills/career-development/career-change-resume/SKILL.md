---
name: career-change-resume
description: |
  Rewrites a resume for a career pivot by identifying transferable skills,
  reframing the professional summary for the target field, and recontextualizing
  past experience to demonstrate relevance to the new career direction. Produces
  a restructured resume with repositioned bullets, a new summary, and a
  transferable skills bridge. Use when the user is changing careers, switching
  industries, pivoting to a new field, or wants to reframe their experience for
  a different type of role. Do NOT use for standard resume bullet improvement
  (use resume-bullet-writer), ATS keyword optimization (use ats-resume-optimizer),
  or writing a resume summary without career change context (use resume-summary-writer).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "resume-writing career writing"
  category: "career-development"
  subcategory: "job-search"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Career Change Resume

## When to Use

**Use this skill when:**
- The user is changing industries entirely -- e.g., transitioning from nursing to healthcare technology sales, from military service to project management, from law to product management, from academia to corporate strategy, or from retail management to operations consulting
- The user has been rejected for roles they believe they are qualified for, and the suspected cause is that their resume reads as "wrong industry" despite having relevant skills under different job titles
- The user is re-entering the workforce after 3+ years and is simultaneously targeting a different field than the one they left
- The user is pivoting from a function they have outgrown (e.g., an engineer who wants to move into engineering management or product strategy) where their title history works against them
- The user has a hybrid background -- worked across two fields at different points in their career -- and needs help deciding which narrative thread to make dominant on their resume
- The user explicitly says their experience "doesn't match" the job descriptions they are targeting and asks how to fix that
- The user completed a bootcamp, certificate program, or degree to support a pivot and needs help integrating that credential into a coherent career narrative
- The user is pivoting from individual contributor to a different function at a higher level (e.g., data analyst to product manager, teacher to instructional designer, journalist to content strategist)

**Do NOT use when:**
- The user is improving bullets within the same career track and same industry -- use `resume-bullet-writer` instead
- The user has a specific job posting and needs keyword-by-keyword ATS optimization -- use `ats-resume-optimizer` instead (though career changers may need both skills sequentially: restructure here first, then ATS-optimize for a specific posting)
- The user only wants the professional summary rewritten without restructuring the rest of the resume -- use `resume-summary-writer` instead
- The user needs a cover letter that tells the pivot story in narrative form -- use `cover-letter-writer` after delivering the career change resume
- The user is applying for a promotion or a lateral move within the same function and same industry -- standard resume improvement skills apply
- The user is a new graduate with no professional experience (there is no origin career to pivot from; use a different resume skill)
- The user wants LinkedIn profile optimization, not a resume -- the structural logic here differs enough to warrant a dedicated skill

---

## Process

### Step 1: Map the Pivot Before Touching a Single Word

Collect all essential context before any rewriting begins. Skipping this step produces generic output.

- **Identify the origin field precisely:** Ask for the user's current or most recent job title, the industry that job sits in, and total years of professional experience. A "manager" in healthcare has very different transferable equity than a "manager" in hospitality.
- **Identify the target field precisely:** Get the specific role type and industry they are targeting. "Tech" is too vague. "UX researcher at a B2B SaaS company" is workable. If the user does not yet know their specific target title, help them narrow it before proceeding -- resume repositioning requires a destination.
- **Assess pivot distance:** Categorize the pivot as one of three types, because the reframing intensity differs significantly:
  - **Type 1 -- Same function, new industry** (e.g., financial analyst at a bank moving to financial analyst at a tech company): Lightest reframe. Industry vocabulary adaptation is the main task.
  - **Type 2 -- New function, adjacent industry** (e.g., software engineer moving to product management at a tech company): Moderate reframe. Functional skills need translation; domain knowledge is an asset.
  - **Type 3 -- New function, new industry** (e.g., high school teacher moving to UX writing at a tech startup): Heaviest reframe. Nearly every bullet requires recontextualization.
- **Gather bridging evidence:** Courses, certifications, bootcamps, volunteer work, freelance projects, portfolio pieces, or side projects in the target field. Even a 10-hour online certificate matters because it signals intentionality.
- **Request a target job description** if the user has one. Even one example JD gives you the exact vocabulary, priority-ordered skill requirements, and functional language of the target field. Without it, rely on domain knowledge of the target field's standard lexicon.
- **Understand the rejection signal** if the user has been applying without success: Are they getting no responses (resume problem), phone screens but no further (interview problem), or rejections with "not enough X experience" feedback (qualification gap problem)? This shapes whether reframing alone is sufficient.

---

### Step 2: Build the Transferable Skills Inventory

This is the analytical core of the skill. Do this rigorously before writing anything.

- **Extract functional skills:** Pull every skill from the user's history that is function-based rather than industry-based. Examples: data analysis, written communication, project coordination, budget management, team leadership, process documentation, client relationship management, vendor negotiation, training delivery, performance measurement, cross-functional collaboration.
- **Extract meta-skills:** These are frequently undervalued but carry enormous weight in senior career-change resumes: systems thinking, ambiguity tolerance, stakeholder management under pressure, rapid domain acquisition, organizational change management.
- **Identify reframeable vocabulary pairs:** The most valuable skill of this entire process. Build a translation dictionary for this specific pivot. Common examples:
  - "Lesson planning" (education) -- "Learning experience design" or "instructional design" (L&D/corporate training)
  - "Case management" (social work) -- "Client success management" (SaaS)
  - "Inventory control" (retail) -- "Supply chain optimization" (operations/logistics)
  - "Platoon leadership" (military) -- "Cross-functional team leadership" (corporate)
  - "Grant writing" (nonprofit) -- "Proposal development" and "stakeholder persuasion" (consulting/sales)
  - "Patient care coordination" (healthcare) -- "Complex project coordination with compliance requirements" (operations)
  - "Peer review" (academia) -- "Structured editorial review" or "quality assurance" (content/product)
  - "Research methodology" (academia) -- "Qualitative/quantitative research design" (UX research, data)
- **Rank transferable skills by target-field priority:** Not all transferable skills carry equal weight in the new field. Cross-reference with the target JD or with standard requirements for that role type. Rank the top 5-7 skills that appear both in the user's background and in target job requirements -- these form the spine of the reframe.
- **Flag gaps honestly:** If the user lacks a core requirement of the target role (e.g., a career changer into data analysis who has never used SQL), name the gap explicitly and recommend a specific bridging action. Do not pretend the gap does not exist.

---

### Step 3: Rewrite the Professional Summary

The professional summary is the highest-leverage section for a career changer -- it is where the reader decides whether to keep reading or discard the resume as "wrong background."

- **Do NOT open with the old title.** "Experienced teacher with 8 years of classroom instruction..." immediately categorizes the candidate as an educator, not a UX writer. Open with the transferable value proposition instead.
- **Lead with the meta-skill, not the industry.** "Content designer with 8 years of experience creating audience-specific instructional materials, now specializing in UX writing..." reads as a UX writing candidate. The old industry is mentioned once, briefly, as context -- not as the lead.
- **Name the target field explicitly by the third sentence at the latest.** The summary must answer "what role are you applying for?" within the first 3 sentences or the reader will not make the connection.
- **Include the bridging credential in the summary if one exists.** A certification, bootcamp, or degree completion earns placement in the summary because it directly addresses the "unqualified" objection before the reader can form it.
- **Length:** 3-5 sentences, 60-90 words. Career changer summaries tend to run long because there is more to explain -- fight that instinct. Shorter is more confident.
- **Vocabulary:** Every noun, verb, and phrase should come from the target field's lexicon, not the origin field's. If you are writing for a career changer into product management, use words like "roadmap," "stakeholder alignment," "cross-functional," "discovery," and "outcome-driven." If you are writing for a career changer into data analytics, use "data-driven decision making," "pattern analysis," "business intelligence," and "dashboard reporting."
- **Avoid the apology tone.** Phrases like "although my background is in..." or "while I am new to this field..." signal uncertainty and invite rejection. Write with the confidence of someone who has exactly the right skills for this role delivered through a non-traditional path.

---

### Step 4: Reframe Every Experience Bullet

This is the most labor-intensive step and requires applying the vocabulary translation work from Step 2 bullet by bullet.

- **The reframe formula:** [Transferable skill in target-field language] + [what you did, in general enough terms to be industry-neutral] + [quantified result or scale]. Example: "Designed and delivered structured onboarding content for 40+ new hires annually" instead of "Trained incoming student teachers in classroom management techniques."
- **Lead with the action, not the context.** "At my school, I was responsible for..." is a weak opening. "Developed a 12-module curriculum framework..." is a strong opening. Context can follow, but the action must lead.
- **Preserve every number.** Metrics transfer across industries with zero loss of credibility. A career changer who reduced process time by 30%, managed a $200K budget, or trained 50 employees has credible, quantified evidence regardless of industry. If the user's original bullets lack metrics, mine their experience descriptions for scale indicators: number of people served, dollar values, timeframes, volume, frequency.
- **Apply the relevance filter aggressively.** For a Type 3 pivot, many bullets from the origin career will not have a clean transferable angle. The rule: if reframing requires stretching the truth or creating a misleading impression, remove the bullet rather than reframe it. Honesty is non-negotiable.
- **Depth weighting by recency and relevance:**
  - Most recent 2 roles: 4-6 bullets each, all heavily reframed
  - Roles 3-5 years back: 2-3 bullets each, only the most transferable
  - Roles older than 10 years: 1-2 bullets maximum, or consolidate under an "Earlier Career" header with a single line per role
- **Retitle roles carefully:** Do NOT change the official job title (it will be verified). However, if the company permitted a descriptive title, use the more descriptive version (e.g., "Senior Associate -- Process Design" instead of just "Senior Associate" if both are accurate). Some resume guidance allows adding a functional descriptor in parentheses -- use this sparingly and only when clearly accurate.
- **Eliminate jargon from the origin field.** Military acronyms, academic terminology (pedagogy, epistemology, praxis), medical coding terms, legal Latin phrases -- none of these communicate to a hiring manager in a different industry. Translate every piece of origin-field jargon into plain business language.

---

### Step 5: Build the Skills Bridge Section

The Skills Bridge is the structural device that does the interpretive work for the hiring manager -- it makes the transferable skills visible rather than requiring inference.

- **Format as a three-column table:** Column 1: the experience or skill as it exists in the user's background. Column 2: a rightward arrow (visual bridge). Column 3: the target field's term for that same skill or experience.
- **Place it immediately after the professional summary,** before the experience section. Career changers cannot afford to bury their relevance in the middle of the document.
- **Include 5-8 rows.** Fewer than 5 looks thin; more than 8 becomes a list rather than a targeted argument.
- **Target hard skills and soft skills equally.** Many career-change resumes bridge only soft skills (communication, leadership), which feels generic. Including hard skill bridges (e.g., "Qualitative data coding in research" -- "Qualitative user research analysis") is more credible and specific.
- **Alternatively, for users pivoting into fields where skills sections are standard** (tech, data, product), replace the bridge table with a "Core Competencies" section organized by target-field categories. Example for a pivot into product management: Competency categories might be "Discovery and Research," "Stakeholder Communication," "Analytical Frameworks," and "Product Tooling" -- populated with skills from both old and new experience.

---

### Step 6: Integrate Bridging Experience Prominently

Bridging experience -- certifications, bootcamp completions, portfolio projects, freelance work, volunteer roles, or side projects in the target field -- is disproportionately important for career changers.

- **Create a dedicated "Relevant Projects" or "Certifications and Training" section** immediately below the Skills Bridge and above the Professional Experience section. This placement signals commitment to the pivot before the reader encounters the origin-field work history.
- **For portfolio-based target fields** (UX design, UX writing, content design, data science, software engineering): Include a "Portfolio" or "Selected Projects" section with 2-3 brief project descriptions. Format each as: Project name -- what you built or wrote -- the tool or method used -- the outcome or context. Example: "Redesigned onboarding flow copy for a fintech app concept -- reduced instructional text by 40% while improving comprehension clarity -- completed as portfolio project, available at [portfolio link]."
- **For certification-heavy target fields** (project management, data analytics, cybersecurity, HR): List certifications in a dedicated section with the issuing body and completion date. Certifications from recognized bodies (e.g., PMP, CAPM, Google Data Analytics, SHRM-CP, CompTIA Security+) carry significant weight and should be near the top of the resume.
- **If the user has NO bridging experience:** Do not omit this section entirely -- include a line noting actively-in-progress training if accurate. Additionally, include in the Pivot Narrative section (Step 8) a direct recommendation for 1-2 concrete actions the user should take within 30-60 days to strengthen their candidacy.
- **Recency matters:** A bootcamp completed 4 years ago in a rapidly evolving field (e.g., data science) is less compelling than it sounds. If bridging credentials are dated, note what current tools or methods the user has self-taught since.

---

### Step 7: Restructure the Resume Architecture

Section order for a career change resume is NOT the same as for a standard resume. Standard resumes put experience first because it is the most relevant evidence. For career changers, experience without context appears disqualifying before it appears compelling.

**Recommended section order for a Type 2 or Type 3 career change:**

1. **Professional Summary** -- repositions the candidate before the reader encounters the old job titles
2. **Skills Bridge / Core Competencies** -- translates the old experience into new-field terms before the reader has to do that work themselves
3. **Relevant Projects / Certifications** -- provides proof of commitment to the pivot
4. **Professional Experience** (reframed) -- now reads in the context established by the first three sections
5. **Education** -- typically last unless the degree is highly relevant to the target field (e.g., a career changer into data science who just completed a master's in applied statistics should put education near the top)

**For Type 1 pivots (same function, new industry),** a lighter restructuring is sufficient:

1. Professional Summary (industry-aware but function-focused)
2. Core Competencies
3. Professional Experience (with industry-adaptation language)
4. Education and Certifications

**Length guidance:** Career change resumes should be 1 page for candidates with under 8 years of experience, and 2 pages maximum for candidates with 8-20 years. A career changer with 20+ years should still target 2 pages -- excessive length signals an inability to edit and prioritize, which is itself an unwanted trait.

---

### Step 8: Write the Pivot Narrative

The Pivot Narrative is not a resume section -- it is a user-facing paragraph that gives the user the connective thread for cover letters, networking conversations, and interview responses.

- **Frame the pivot as a natural progression, not a rejection of the old career.** "I left teaching because I was burned out" is a cover letter death sentence. "My 8 years in education taught me that the tools learners use to access content are as important as the content itself -- which is why I am moving into UX writing" is a compelling origin story.
- **Identify the through-line:** What skill, value, or problem-solving orientation has been present in the user's entire career, including the target field? Name it explicitly. This is the rhetorical spine of every cover letter and "tell me about yourself" answer.
- **Keep it to 3-4 sentences.** The user should be able to deliver this verbally in under 45 seconds.
- **Make it future-facing, not backward-looking.** The pivot narrative should emphasize where the user is going and why, with the old career as context, not as the subject.

---

## Output Format

Deliver the output in this exact structure. Do not summarize or provide tips -- produce the actual rewritten resume content.

```
## Career Change Resume: [Origin Role/Industry] → [Target Role/Industry]

---

### Professional Summary

[3-5 sentences. Opens with transferable value proposition. Names target field by sentence 2.
Bridges old experience in one sentence. Includes bridging credential if available.
Written entirely in target-field vocabulary. 60-90 words.]

---

### Skills Bridge

| Your Background | → | Target Field Equivalent |
|---|---|---|
| [Origin skill/activity, specific] | → | [Target field term, specific] |
| [Origin skill/activity, specific] | → | [Target field term, specific] |
| [Origin skill/activity, specific] | → | [Target field term, specific] |
| [Origin skill/activity, specific] | → | [Target field term, specific] |
| [Origin skill/activity, specific] | → | [Target field term, specific] |
| [Origin skill/activity, specific] | → | [Target field term, specific] |

---

### Relevant Projects and Certifications

**[Certification Name]** | [Issuing Organization] | [Completion Date or "In Progress"]
[One-line description of what it covers or the skills validated]

**[Project Name]**
[1-2 sentence description: what was built/written/designed, tools used, outcome or scope]

---

### Professional Experience

**[Exact Official Job Title] | [Company Name] | [Start Date -- End Date]**

- [Reframed bullet: target-field verb + what was done in industry-neutral terms + metric]
- [Reframed bullet: target-field verb + what was done in industry-neutral terms + metric]
- [Reframed bullet: target-field verb + what was done in industry-neutral terms + metric]
- [Reframed bullet: target-field verb + what was done in industry-neutral terms + metric]

**[Exact Official Job Title] | [Company Name] | [Start Date -- End Date]**

- [Reframed bullet -- most transferable achievement only]
- [Reframed bullet -- second most transferable, or omit if nothing translates]

**Earlier Career** *(if applicable)*
[One-line summary: "Various roles in [field], [years range]. Core skills developed: X, Y, Z."]

---

### Education

**[Degree] in [Field]** | [Institution] | [Year]
[Note any honors, relevant coursework, or thesis work that bridges to the target field]

---

### Pivot Narrative
*(For your cover letters and interviews -- not included on the resume itself)*

[3-4 sentences. States the through-line. Frames the transition as progressive, not reactive.
Names the specific problem or mission that connects old and new careers. Future-facing.]

---

### Gap Analysis and Recommended Actions
*(If applicable -- items to strengthen candidacy before applying)*

- [Specific credential or action, with realistic timeframe]
- [Specific portfolio project or experience, with concrete suggestion]
```

---

## Rules

1. **Produce the full restructured resume -- never tips or advice.** The output is a functional resume document, not a guide to career changing. Do not tell the user "you should consider reframing your bullets" -- do the reframing.

2. **Never fabricate skills, credentials, or experiences.** Reframing is translation, not invention. If the user has never managed a budget, the resume cannot say they managed a budget. If the user has never used a particular tool, do not add it to a skills list. The standard is strict: every claim on the resume must be verifiable from the information the user provided.

3. **Preserve every quantified metric without exception.** Numbers are the most credible and universally transferable elements of any resume bullet. If the original says "managed 200 patient records," the reframed version must still reference the 200. If the user has no metrics in their original bullets, mine their description for scale indicators and ask clarifying questions rather than omit numbers entirely.

4. **Write every bullet in the target field's vocabulary.** If the target field is product management, every action verb and noun should come from product management language: "synthesized user research," "defined acceptance criteria," "aligned cross-functional stakeholders," "prioritized backlog items." If the target field is data analytics: "analyzed datasets," "built reporting dashboards," "identified trend patterns," "delivered actionable insights." Do not mix vocabularies -- the resume must read as if written by someone already in the target field.

5. **The professional summary must name the target field explicitly.** A summary that says only "dynamic professional with a track record of results" helps no career changer. By sentence 2, the summary must name the target role or field. This is non-negotiable.

6. **Calibrate reframe depth to pivot type.** Type 1 pivots (same function, new industry) require light vocabulary adaptation. Type 3 pivots (new function, new industry) require full reconstruction. Do not apply Type 3 intensity to a Type 1 pivot -- it produces an over-engineered, defensive-sounding document.

7. **Section order must follow the career-change architecture, not the standard resume architecture.** Summary first, Skills Bridge second, Bridging Experience third, Professional Experience fourth. Standard resumes that lead with Experience will actively disadvantage a career changer whose job titles send the wrong signal at first glance.

8. **Reduce older or less relevant roles to 1-2 bullets maximum.** The most common mistake in career-change resumes is giving equal real estate to all roles regardless of relevance. A 12-year-old job in an unrelated field does not need 6 bullets. It needs one line demonstrating a single transferable capability.

9. **If the user lacks bridging experience entirely, name the gap and prescribe specific action.** Do not pretend the gap does not exist or bury it. State clearly that the resume is strong for the skills transfer but that applications will be significantly more competitive once the user completes one specific certification, portfolio project, or volunteer engagement. Name the specific credential (e.g., "Google Project Management Certificate on Coursera, typically completed in 6 months") rather than offering vague advice.

10. **Never use the origin field's jargon without translation.** Military acronyms (MOS, AAR, OIC), academic terms (pedagogy, epistemology, IRB, tenure dossier), medical coding (ICD-10, CPT, HIPAA workflows as described in clinical terms), legal Latin, and social work terminology (psychosocial assessment, SOAP notes) are invisible or actively confusing to hiring managers outside those fields. Every piece of origin-field jargon must be rendered in plain business language, with the original term appearing at most once in parentheses if it is a credential name.

11. **Never use a hedge or apology in the summary or bullets.** Phrases like "although I am transitioning from...," "while my background is not directly in...," or "despite limited experience in the target field..." signal weakness and invite the reader to confirm their skepticism. Write with the conviction that the user's combination of transferable experience and commitment to the pivot is exactly what a forward-thinking employer wants.

12. **Deliver the Pivot Narrative as a distinct user-facing section.** This is the user's verbal ammunition for cover letters and interviews. It should be clearly labeled as not for the resume itself so the user does not paste it onto their document.

---

## Edge Cases

### Career Changer with Zero Bridging Experience
The user has made no certifications, completed no courses, done no projects, and has no volunteer work in the target field. The resume can still be reframed, but the gap is real and must be addressed directly. Deliver the fully reframed resume but include a candid Gap Analysis section at the end. Recommend one specific certificate or project with a realistic completion timeline. For example, a career changer into project management with no PMP or CAPM should know that the Google Project Management Professional Certificate (approximately 6 months at 10 hours/week, widely recognized) substantially changes their candidacy. Do not sugarcoat: a strong skills bridge without any evidence of commitment to the new field will produce lower response rates.

### Pivoting from a Highly Specialized or Jargon-Heavy Field
Fields like academic research, medicine, law, military service, and social work use internal vocabularies so distinct that the translation work is the entire job. For these users:
- Build a more extensive Skills Bridge (8-10 rows minimum)
- For academics transitioning to industry: convert "published research" to "evidence-based analysis and written deliverables," "grant writing" to "stakeholder proposal development," "peer review" to "structured editorial quality assurance," and "teaching load" to "instructional content delivery at scale"
- For military transitioning to corporate: translate rank to scope (e.g., "led a 35-person platoon" instead of "E-7 with platoon leadership"), operations to project management language, and de-acronymize everything
- For physicians or nurses transitioning to health tech or consulting: translate clinical workflows to process management language, patient volume to throughput metrics, and interdisciplinary care coordination to cross-functional stakeholder management
- Build a translation glossary internally before writing a single bullet

### Candidate with 20+ Years in One Field
A career changer with two decades of experience faces a unique problem: their resume reads as deeply committed to the origin field, and their seniority may seem like overqualification or inflexibility. Strategies:
- Use an "Earlier Career" consolidation block for anything before the most recent 10 years
- Emphasize scope and systems-level thinking, which transfer at senior levels regardless of field
- Frame longevity as expertise depth, not entrapment: "20 years of operational leadership in X field" positions breadth of transferable skill, not narrowness of domain
- Target roles that value cross-industry perspective, such as consulting, business development, operations leadership, or training and enablement -- fields where deep subject-matter expertise plus new-field interest is actually the ideal profile

### Manager Moving Back to Individual Contributor
When a manager wants to return to hands-on work in a new field (or even the same field), their resume risks looking like a demotion story. Reframing strategies:
- Foreground the IC skills that the management role required: "Owned and maintained the team's customer segmentation model in Python" is more powerful than "Managed 4 data analysts"
- Use the summary to frame the IC pivot as intentional and values-driven: "Moving from team leadership into hands-on [product/design/engineering] work to deepen technical craft and direct user impact"
- Remove or minimize headcount management bullets; replace with deliverable-focused bullets from within the management tenure
- Avoid listing "people management" as a core competency if the target roles are explicitly IC -- it signals misalignment

### Lateral Move Between Industries with the Same Functional Role
The user is, say, an HR business partner at a healthcare company moving to an HR business partner role at a tech company. This is a Type 1 pivot and does not require the full career-change restructuring. Apply a lighter hand:
- Keep the standard resume architecture (summary, experience, education)
- Rewrite the summary to signal industry awareness and enthusiasm for the target industry
- Add industry-specific vocabulary from the target industry where it accurately applies (e.g., using "talent density" and "engineering culture" language when pivoting to tech HR)
- Highlight any experience with the target industry's specific challenges: rapid scaling, remote-first culture, technical talent acquisition
- Do NOT over-explain or hedge -- a lateral move needs a confident industry-transition framing, not a defensive skills bridge

### Career Changer with a Degree Mismatch
The user's degree is in a field unrelated to either their work history or their target role, or they have a degree in their origin field but not their target field. This is common and manageable:
- If the degree is old (10+ years) and in the origin field, put it last and do not draw attention to the mismatch
- If the user completed any relevant coursework, certificate, or professional development in the target field more recently, lead with that in the Bridging Experience section
- If the target field is highly credential-sensitive (e.g., licensed engineering, clinical healthcare, law), note that additional formal education may be required and be honest about that with the user -- no reframing exercise solves a hard licensing requirement

### User Has Relevant Experience Scattered Across Multiple Partial Roles
Some career changers have pieces of their target-field experience distributed across several jobs -- they did some data analysis in a marketing role, some project management in an operations role, and some client research in a consulting role. None of the roles is fully relevant, but collectively they build a case:
- Create a "Relevant Experience Highlights" section that pulls the most relevant bullets from multiple roles under a single functional header, regardless of which job they came from
- Follow it with a standard "Professional History" section that lists all roles with minimal bullets for completeness and ATS parsing
- This two-track structure presents the user's most relevant experience as a cohesive body of work rather than scattered fragments

---

## Example

**User Input:**
"I've been a criminal defense attorney for 9 years at a mid-size law firm. I handle complex litigation, manage 20-30 active cases at a time, lead client relationships, negotiate plea agreements, and supervise two junior associates. I've also done pro bono work advising a nonprofit on contract review. I want to move into legal operations or contract management roles at tech companies. I just completed a Certified Contract Manager (CCM) credential through the National Contract Management Association."

---

**Output:**

## Career Change Resume: Litigation Attorney → Legal Operations / Contract Management

---

### Professional Summary

Legal operations professional and Certified Contract Manager (CCM) with 9 years of experience managing high-complexity legal matters from intake through resolution in adversarial and transactional contexts. Expert at simultaneous portfolio management -- overseeing 25+ active matters, deadlines, and stakeholder communications at any given time -- with a consistent record of risk identification, outcome delivery, and cross-functional alignment. Combines deep legal analysis and negotiation expertise with formal contract management training, positioning for legal operations or contract management roles in technology environments where speed, process discipline, and legal judgment must work in concert.

---

### Skills Bridge

| Your Background | → | Target Field Equivalent |
|---|---|---|
| Managing 20-30 active litigation matters simultaneously | → | Legal portfolio and contract lifecycle management |
| Negotiating plea agreements and settlement terms | → | Contract negotiation and commercial term optimization |
| Advising clients on risk, strategy, and decisions | → | Internal business partner and legal risk advisory |
| Supervising two junior associates' work product | → | Team coordination, quality assurance, workflow oversight |
| Pro bono contract review for nonprofit organizations | → | Commercial contract drafting and review (transactional) |
| Legal research and memo writing under tight deadlines | → | Policy analysis, process documentation, and reporting |
| Oral argument and written brief preparation | → | Structured executive communication and deliverable writing |

---

### Relevant Projects and Certifications

**Certified Contract Manager (CCM)** | National Contract Management Association (NCMA) | Completed [Month Year]
Credential covering contract formation, administration, negotiation, risk allocation, and compliance across commercial and government contracting contexts.

**Pro Bono Contract Advisory -- [Nonprofit Name]** | [Year range]
Reviewed and redlined service agreements, vendor contracts, and grant-related agreements for a nonprofit operating in [city/sector]. Advised executive director on liability exposure and contract modifications. Managed 8-12 active agreements concurrently.

---

### Professional Experience

**Associate Attorney -- Criminal Defense | [Law Firm Name] | [Start Year -- Present]**

- Managed an active portfolio of 25-30 complex matters simultaneously, coordinating across clients, courts, co-counsel, investigators, and expert witnesses to meet all deadlines without task failure across a 9-year period
- Negotiated case resolutions -- including plea agreements, dismissals, and diversion agreements -- with prosecutorial counterparts, applying structured risk analysis and stakeholder interest modeling to achieve favorable outcomes in 70%+ of negotiated dispositions
- Drafted, reviewed, and revised all client-facing agreements including engagement letters, fee agreements, and third-party authorization documents, maintaining zero disputed-fee incidents over 9 years
- Built and maintained long-term client relationships across a portfolio of 80+ active and former clients, providing ongoing risk counseling, status communication, and strategic guidance throughout multi-year representations
- Supervised and reviewed work product of 2 junior associates, providing structured written feedback and workflow oversight that reduced revision cycles by approximately 30% over 18 months of direct supervision
- Developed and maintained a matter-tracking system in [platform] covering deadlines, document status, and billing milestones -- reducing missed-deadline incidents from 4 per quarter to 0 within the first year of implementation

**Law Clerk | [Court or Firm Name] | [Start Date -- End Date]**

- Produced research memoranda and bench briefs on novel legal questions under time-compressed schedules, delivering analysis directly used in judicial decisions
- Synthesized complex statutory and case law into plain-language summaries for judges and senior attorneys, developing a communication style adapted for non-specialist audiences

**Earlier Career**
Law school (JD, [School], [Year]); law review editorial board member and note author on commercial contract interpretation.

---

### Education

**Juris Doctor (JD)** | [Law School Name] | [Year]
Member, [Law Review Name]; Note published on [topic if relevant to contract/legal ops]

**Bachelor of [Arts/Science] in [Field]** | [University Name] | [Year]

---

### Pivot Narrative
*(For cover letters and interviews -- do not paste this on your resume)*

"Nine years of litigation gave me an unusually rigorous version of exactly the skills legal operations demands: managing complex, multi-party workstreams under hard deadlines, negotiating commercial terms in high-stakes contexts, and providing legal risk guidance that directly shapes business decisions. Moving into legal operations at a technology company is not a departure from my legal career -- it is a shift from reactive litigation to proactive legal infrastructure, which is where I have always done my most interesting work. My CCM credential and contract management experience confirm the direction; my litigation discipline is the differentiator."

---

### Gap Analysis and Recommended Actions

Your candidacy is strong for contract management roles immediately. For senior legal operations roles that emphasize process design, tooling, and legal technology, consider:

- **Familiarize yourself with at least one contract lifecycle management (CLM) platform** -- Ironclad, Icertis, or Concord are commonly used at tech companies. Free trials and demo environments are available. Being able to speak to CLM workflow design in interviews is a material differentiator.
- **Add one operational project to your bridging section within 60 days** -- for example, document a process improvement you made to your own matter-tracking workflow and frame it as a legal ops case study. Even an internal example demonstrates the operational orientation that legal ops hiring managers are evaluating.
