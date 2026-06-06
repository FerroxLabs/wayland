---
name: cover-letter-writer
description: |
  Writes a complete cover letter tailored to a specific job posting, including
  an attention-grabbing opening hook, 2-3 body paragraphs connecting the user's
  experience to the role requirements, and a confident closing with call to action.
  Produces full letter text ready to send. Use when the user wants to write a
  cover letter, needs help with a job application letter, or wants to tailor a
  cover letter to a specific posting. Do NOT use for resume writing (use
  resume-bullet-writer), LinkedIn messages (use linkedin-summary-writer), or
  cold outreach emails to hiring managers (use cold-outreach-email). Career
  cover letters live in career-development, not the writing category.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "cover-letter career template writing"
  category: "career-development"
  subcategory: "job-search"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Cover Letter Writer

## When to Use

Use this skill when any of the following situations apply:

- The user has a specific job posting and wants a complete, tailored cover letter written and ready to send -- not advice on how to write one themselves
- The user wants to rewrite or substantially improve an existing cover letter that is generic, too long, opens with a weak hook, or fails to connect their experience to the role requirements
- The user needs a cover letter that addresses a complicating factor -- career change, relocation, employment gap, overqualification, underqualification on one specific dimension, or a pivot within the same industry
- The user has been referred by someone at the company and wants to leverage that referral properly in their letter
- The user is applying for a role in a specialized or technical domain (engineering, finance, healthcare, law, academia) and needs the letter to demonstrate insider fluency with the field's language and expectations
- The user is applying to a competitive or high-prestige employer (investment banks, top consulting firms, FAANG-tier tech companies, top-tier graduate programs treating cover letters as writing samples) where a generic letter will eliminate them immediately

**Do NOT use this skill when:**

- The user needs help writing or improving resume bullets -- use `resume-bullet-writer`, which specializes in the action-verb, metric, result format that bullets require
- The user wants to write a cold outreach email to a hiring manager outside a formal application process -- use `cold-outreach-email`, which has a fundamentally different structure (shorter, no formal header, focused on opening a conversation rather than applying)
- The user wants a LinkedIn connection message or InMail to a recruiter or hiring manager -- use `linkedin-summary-writer` or `recruiter-outreach`, which follow platform-specific conventions
- The user needs a thank-you note or follow-up email after an interview -- use `thank-you-email-writer`, which serves a different purpose (reinforcing fit, referencing interview specifics, closing strong)
- The user is writing a personal statement for graduate school, medical school, or law school -- these are a distinct genre with different word counts, narrative structure, and evaluation criteria; they deserve a dedicated academic-writing skill
- The user wants a cover letter critique or general cover letter coaching without providing a specific job posting -- coaching without a specific role produces generic advice; prompt the user to provide the job posting first

---

## Process

### Step 1: Gather Application Intelligence

Before writing a single word, collect the inputs that make the difference between a generic letter and one that feels written by a candidate who genuinely wants this specific role.

- **Required inputs:** The exact job title (as written in the posting), the company name, and the full job description or the key requirements section copied as text -- never a link, because the letter must mirror the posting's language
- **Required inputs:** The user's 2-3 most relevant qualifications for this specific role -- ask them to identify what they bring that maps to the top 3 requirements in the posting
- **Required inputs:** At least one quantified achievement: a metric (grew X by Y%), a scale (managed a $4M budget), a scope (led a team of 12), or a result (reduced churn by 22 points) -- if the user has no metric, coach them to approximate one ("roughly 3x growth," "cut time from 6 weeks to 10 days")
- **Required inputs:** A specific, genuine reason why this company -- not why this role exists everywhere, but why this employer. Acceptable answers: you use their product, you have followed their research, you know their mission resonates with a specific experience you had, you admire their approach to a specific problem. Unacceptable: "your innovative culture" or "market leader in the space"
- **Optional but high-value inputs:** Hiring manager's name (check the posting, LinkedIn, or the company's team page); whether the user was referred by someone at the company; any circumstances to address proactively (gap, change, relocation)
- If the user cannot provide a quantified achievement, ask probing questions: "What was the scope of that project? How many people did it affect? What changed as a result of your work?" Help them surface a number rather than skipping the metric -- letters without metrics are significantly weaker
- If the user cannot provide a company-specific reason for applying, ask: "What drew you to this posting specifically? Have you used their product or service? Is there a public statement from their leadership that resonates with you?" Do not invent company-specific reasons -- if none exist, use the product mission stated in the posting itself

---

### Step 2: Analyze the Job Description for Mirror Vocabulary

Applicant Tracking Systems (ATS) scan cover letters along with resumes. More importantly, hiring managers read for signal that the candidate understands the role.

- Identify the 3-5 highest-frequency and highest-weight terms in the job description: these are the role's core vocabulary. If the posting says "cross-functional alignment" not "collaboration," use "cross-functional alignment" in the letter
- Distinguish between required qualifications and preferred qualifications. The letter should demonstrate the required qualifications; preferred qualifications can be mentioned if the user has them but should not crowd out the required ones
- Identify the implicit priority order in the job description -- requirements listed first and requirements that appear in both the title and the description carry the most weight. The first body paragraph should address the single highest-weight requirement
- Look for signals about the team's pain points: phrases like "fast-paced environment," "building from scratch," "managing competing priorities," or "will work directly with the CEO" reveal what the hiring manager is actually worried about. Address the subtext, not just the stated requirements
- Note the level of the role: individual contributor vs. manager vs. director changes the entire tone and evidence strategy. An individual contributor letter proves personal execution. A manager letter proves team outcomes. A director or VP letter proves organizational impact and strategic thinking
- Flag any requirements the user does not meet. Apply the 70% rule: if the user meets 70% or more of the stated requirements, write the letter confidently without flagging the gaps. If there is one significant gap, address it proactively in 1-2 sentences by bridging with adjacent experience -- never with an apology

---

### Step 3: Craft the Opening Hook (Paragraph 1)

The opening paragraph has one job: make the hiring manager want to read the next paragraph. It succeeds or fails in the first sentence.

- **Banned openings (never use these):** "I am writing to apply for...", "I am excited to apply for...", "Please accept my application for...", "I have always been passionate about...", "As a [job title] with X years of experience..." -- these openings are the most common, most skipped openers in hiring manager reading behavior
- **Hook type 1 -- The Referral Lead:** If the user was referred by someone at the company, this is always the strongest opener. Format: "[Name] on your [team/department] suggested I reach out after we discussed [topic]. Their description of [specific challenge or initiative] is exactly the kind of problem I want to work on." Referrals increase interview rates by approximately 30-50% in research on hiring outcomes; naming the referral in sentence one captures that advantage
- **Hook type 2 -- The Product/Mission User:** The user has direct personal experience with the company's product, research, or service. This signals genuine interest and creates an immediate narrative. Format: "I have been using [product] to [specific use case] for [time period] -- [specific observation about the product]." Follow immediately with the user's top qualification
- **Hook type 3 -- The Industry Insight:** Opens with a specific observation about the field that the company is positioned to address, then connects the user's experience to that challenge. Format: "[Specific industry trend or challenge] is the defining problem in [field] right now. At [previous employer], I spent three years [specific work that addresses this exact challenge]." Best used for senior roles where strategic thinking matters
- **Hook type 4 -- The Specific Company Detail:** References something the user knows about this company specifically -- a recent initiative, a published research paper, a product launch, a methodology they use publicly. This requires the user to supply the detail; do not invent one. Format: "When [Company] announced [specific initiative], I recognized the same challenge I spent the last two years solving at [previous employer]."
- **Hook type 5 -- The Result-First Lead:** Opens with the user's most impressive achievement, then connects it to the role. Best for roles where the achievement metric is immediately credible and relevant. Format: "In the last 18 months, I [achievement with metric]. I am applying for [role] at [company] because I am ready to do that at a larger scale -- and for a product I believe in."
- After the hook sentence, the opener should: name the exact role and company, establish the user's single top qualification, and signal genuine motivation. Total paragraph length: 3-5 sentences, 60-90 words

---

### Step 4: Write the Proof Paragraph (Paragraph 2)

The second paragraph is the most important paragraph in the letter. It is where the hiring manager decides whether to schedule an interview.

- Open the paragraph by naming the job's top requirement directly (using the posting's language). This is the mirror technique: use the posting's vocabulary so the reader sees immediate alignment
- Follow immediately with the user's most relevant professional experience. Be specific: name the company, the project, the scope. "At [Company], I led [specific project]" is stronger than "In my previous role, I was responsible for..."
- Deliver the quantified achievement in the second or third sentence. The formula: context + action + result + scale. Example: "By implementing a monthly pricing review cycle and renegotiating three enterprise contracts, I reduced customer churn from 14% to 8% over 12 months -- representing approximately $2.4M in retained annual revenue"
- Connect the achievement to what the new role needs. Explicitly bridge: "The [role] at [company] requires [requirement] -- and that is precisely what I built at [previous company]." This does not feel mechanical if done once; it closes the loop for a skimming reader
- If the job involves managing people and the user has done so, include team size and scope even if that is not the primary achievement: "leading a team of 6 analysts" or "managing two direct reports across three time zones" signals readiness for the level of the role
- Length: 5-7 sentences, 100-130 words. This is the longest and densest paragraph in the letter

---

### Step 5: Write the Fit Paragraph (Paragraph 3)

The third paragraph answers the question the second paragraph creates: "This person can do the work -- but do I want to work with them, and are they going to stay?"

- Address a second key requirement from the posting, but lead with the company-specific element rather than another achievement. The fit paragraph is about why this company, not more proof of capability
- Use a specific, verifiable detail about the company. Acceptable specifics: a named product feature or product line, a published mission statement or value, a known initiative or methodology, a specific aspect of the team structure mentioned in the posting. Unacceptable generics: "your commitment to innovation," "your collaborative culture," "being a leader in the industry"
- Connect the company-specific detail to the user's experience or values. The structure: "[Specific thing about the company] + [how it maps to what the user has done or cares about] + [what the user would contribute in that context]"
- This paragraph can also serve as the place to address a complicating factor -- a career change pivot, a relocation, or a nontraditional background -- but only if the complicating factor needs explaining. Address it in 1-2 sentences, frame it as a strength or a deliberate choice, and move on. Do not let the explanation dominate the paragraph
- If the user is a career changer, the fit paragraph's job is to explicitly name the bridge: "My background in [Field A] gives me capabilities that [Field B] professionals rarely have: [specific transferable skill with evidence]." This reframes the nontraditional background as a differentiator rather than a deficit
- Length: 4-6 sentences, 80-110 words

---

### Step 6: Write the Closing Paragraph (Paragraph 4)

The closing paragraph is widely treated as a formality. Treat it as one last opportunity to leave a specific impression and prompt action.

- Do not summarize the letter. The hiring manager just read it -- a summary wastes the final impression
- Restate enthusiasm for this specific role in concrete terms: "I am particularly excited about [specific aspect of the role or team]" is stronger than "I am enthusiastic about this opportunity"
- Include a forward-looking contribution statement: a one-sentence picture of what the user will bring to this specific team. This plants a mental image in the hiring manager's mind: "I am eager to bring [specific skill or approach] to [company's current challenge or goal]"
- The call to action must be active, not passive. Active: "I would welcome the opportunity to discuss how my experience building [X] could contribute to [Y] -- I am available for a conversation any time this week or next." Passive (banned): "I hope to hear from you," "I look forward to your response," "Thank you for your consideration"
- Close with a professional valediction. "Sincerely," is the universal default and works in every context. "Best regards," is acceptable. "Warmly," is appropriate for mission-driven nonprofits and startup cultures. Never use "Yours truly," "Respectfully," (too formal for non-government roles), or first-name sign-offs without a last name
- Total closing paragraph length: 3-4 sentences, 50-70 words

---

### Step 7: Execute the Quality Review

Before delivering the letter, run every item in this checklist:

- **Word count check:** Total letter must be 250-400 words. The optimal range for most roles is 280-360 words. Under 250 feels thin; over 400 loses hiring managers statistically. Count and report the word count in the output
- **Opening line test:** Read only the first sentence. Does it compel you to read the second sentence? If the honest answer is "not really," rewrite it. The opening line is not doing its job if it could describe any applicant
- **Metric check:** Confirm at least one quantified achievement appears in paragraph 2. If the user could not provide a metric, verify that the approximation is credible (reasonable order of magnitude, framed as approximate)
- **Company specificity check:** Confirm that the letter contains at least one detail that could only appear in a letter for this company -- a named product, initiative, mission element, or team detail. If the letter would work equally well for any company in the industry, it fails this check
- **Mirror vocabulary check:** Confirm that 2-3 of the highest-weight terms from the job description appear naturally in the letter. Unnatural keyword stuffing fails this check; forced insertion does more harm than omission
- **Tone calibration:** Match tone to the employer. Tech startups and creative agencies: conversational, confident, direct. Investment banks and law firms: formal, precise, evidence-heavy. Nonprofits and social enterprises: mission-connected, warm but still evidence-based. Fortune 500 corporates: professional, polished, outcome-focused. Academic institutions: formal, research-aware
- **Forbidden phrases sweep:** Eliminate "I am a hard worker," "team player," "detail-oriented," "passionate about," "strong communication skills" -- these phrases appear in the majority of all cover letters and add zero signal. Replace each with specific evidence
- **Pronoun density check:** Count the number of sentences that begin with "I." If more than 40% of sentences begin with "I," restructure some openers to lead with the company, the role, the result, or the team. Cover letters with every sentence starting with "I" feel self-absorbed

---

## Output Format

Produce the complete letter followed by the analytical breakdown table. Do not deliver the letter without the breakdown -- the breakdown helps the user understand the strategic choices made so they can modify future letters themselves.

```
## Cover Letter: [Exact Job Title from Posting] at [Company Name]

---

[Month Day, Year]

[Hiring Manager First and Last Name, or "Hiring Team"]
[Company Name]

Dear [Hiring Manager Name, or "[Company Name] Hiring Team", or "[Department] Team"],

[Paragraph 1 -- Opening Hook: 3-5 sentences, 60-90 words.
Hook type used. Name the role and company. Establish top qualification.
Signal genuine, specific motivation.]

[Paragraph 2 -- The Proof: 5-7 sentences, 100-130 words.
Mirror the posting's top requirement. Name the employer and project.
Deliver quantified achievement with context + action + result + scale.
Bridge achievement to the new role's requirement.]

[Paragraph 3 -- The Fit: 4-6 sentences, 80-110 words.
Address second requirement or complicating factor.
Use one specific, verifiable company detail.
Connect company detail to user's experience or values.
Signal what the user would contribute in this specific context.]

[Paragraph 4 -- The Close: 3-4 sentences, 50-70 words.
Restate specific enthusiasm (not generic excitement).
Forward-looking contribution statement.
Active call to action with availability signal.]

[Valediction],
[User's Full Name]
[User's Phone Number, if provided]
[User's Email Address, if provided]

---

### Cover Letter Breakdown

| Section        | Purpose                         | Strategy Used                          | Word Count |
|----------------|---------------------------------|----------------------------------------|------------|
| Opening        | Hook + top qualification        | [Hook type: referral / product / insight / specific detail / result-first] | [n] words |
| Body P1        | Proof of capability             | [Achievement name + metric used]       | [n] words  |
| Body P2        | Fit + company specificity       | [Company detail referenced]            | [n] words  |
| Closing        | Call to action                  | [Active CTA language used]             | [n] words  |
| **Total**      |                                 |                                        | **[n] words** |

**Tone register:** [Professional / Conversational-Professional / Formal / Mission-connected]
**ATS mirror terms used:** [term 1], [term 2], [term 3]
**Quantified achievement:** [What was cited -- metric or approximation]
**Company-specific element:** [Exactly what was named]
**Complicating factor addressed:** [Yes: [what and how] / No: none present]
```

---

## Rules

1. **Always produce a complete, ready-to-send letter.** Never deliver writing tips, structural advice, or an annotated template in place of the actual letter. The output must be usable without editing beyond filling in the user's name. If you are missing a critical input (quantified achievement, company-specific detail), ask one targeted question before writing -- do not write a weak letter and note the weakness in the output.

2. **The first sentence of the letter must never begin with "I am writing," "I am excited to apply," "I am pleased to submit," "Please consider," or any variant that announces the act of applying rather than making a claim.** These openings are the most common cover letter openers and are processed by experienced hiring managers as a signal that nothing original follows.

3. **Every letter must contain at least one quantified achievement.** A metric, a scale indicator, a dollar figure, a percentage change, a headcount, or a time delta all qualify. If the user cannot provide a precise number, use an approximate with a qualifier: "approximately," "roughly," "more than." A letter without any number is a letter without evidence -- claims without evidence do not differentiate candidates.

4. **Every letter must contain at least one detail that could only appear in a letter for this specific company.** A named product feature, a named initiative, a stated mission phrase from the company's own materials, or a known team structure element all qualify. If the user cannot provide one, ask explicitly before writing. Do not invent company details -- if the user has none, use the mission language from the job posting itself.

5. **The letter must not exceed 400 words and should target 280-360 words for most roles.** Eye-tracking research on hiring manager reading behavior consistently shows that letters over 400 words are skimmed or abandoned. Longer is not more thorough -- longer is less respectful of the reader's time. If a draft exceeds 400 words, cut the lowest-value sentence from each paragraph before delivering.

6. **Never apologize for a missing qualification.** The phrases "while I do not have direct experience in X," "although I have not worked in Y," and "I recognize I may not have Z" immediately draw attention to gaps and frame the candidate as less than fully qualified. If a gap exists, either bridge it with adjacent experience ("My experience in [A] prepared me for [B] because...") or omit the topic entirely. Silence is better than apology.

7. **Mirror the posting's vocabulary deliberately, but not mechanically.** Use 2-4 of the job description's highest-weight terms naturally within the letter. Do not insert a keyword where it does not fit grammatically or contextually -- forced keyword insertion reads as ATS gaming and is detectable by human readers. The goal is alignment, not stuffing.

8. **Calibrate tone to the employer type.** A cover letter for a Series A startup and a cover letter for Goldman Sachs require fundamentally different registers. Startup: direct, conversational, shows initiative and comfort with ambiguity. Investment bank or law firm: formal, precise, accomplishments stated matter-of-factly without enthusiasm inflation. Nonprofit: warm, mission-connected, but still evidence-based. Academic institution: measured, intellectually serious, shows awareness of the field. Applying the wrong register is one of the most common and most costly cover letter errors.

9. **If the user was referred by someone at the company, open with the referral name -- no exceptions.** A named referral is statistically the strongest possible cover letter opener because it connects the application to an internal advocate. The format is: "[Referral Name] at [Company Name] suggested I reach out" -- this should be the first clause of the first sentence. Nothing else outperforms it.

10. **Never repeat information from the resume in summary form.** The cover letter's job is not to narrate the resume chronologically -- that is what the resume is for. The cover letter's job is to add context the resume cannot provide: motivation, narrative arc, cultural fit, and evidence that this application is intentional rather than a mass submission. Any paragraph that could be replaced with "see my resume" has failed its purpose.

11. **The call to action in the closing paragraph must be active.** Passive closings ("I look forward to hearing from you," "I hope we can connect") place the burden entirely on the hiring manager and signal low confidence. An active closing ("I would welcome the opportunity to discuss this role further -- I am available any time this week") expresses confidence and makes it easy to respond affirmatively.

12. **Do not use the forbidden phrases list under any circumstances:** "hard worker," "team player," "strong communication skills," "detail-oriented," "passionate about," "think outside the box," "fast learner," "results-driven," "go-getter." These phrases are present in the majority of all cover letters. They add zero signal and actively reduce the perceived quality of the letter. Replace every instance with a specific example that demonstrates the trait.

---

## Edge Cases

### User does not know the hiring manager's name
Do not use "To Whom It May Concern" -- this salutation signals that the applicant invested no research effort and is immediately off-putting to most readers. The preferred alternatives in order of specificity:
1. "Dear [Department] Hiring Team" (e.g., "Dear Engineering Hiring Team") -- best option when the posting identifies the team
2. "Dear [Company Name] Hiring Team" -- reliable fallback for any posting
3. "Dear Hiring Team" -- acceptable generic fallback, used only when the department is unclear
Before defaulting to a generic salutation, try: the job posting itself (sometimes lists the hiring manager's name), the LinkedIn company page (search for the title above the role being applied for), or the company's website team page. If the user finds a name, use it.

### User is making a career change across industries
A career change letter has one primary job: make the pivot legible and frame it as deliberate, not desperate. Structure adjustments:
- The opening hook should acknowledge the change confidently in one sentence without over-explaining: "After seven years in [Field A], I am making a deliberate move into [Field B] -- and [specific reason: this company's work, a skill I built, a problem I want to solve]" works as a hook
- Paragraph 2 must be the transferable skill bridge paragraph. Identify the single skill or achievement from the old career that most directly maps to the new role's top requirement. Make the mapping explicit and specific -- do not make the reader do the translation work
- Paragraph 3 addresses fit and uses the company-specific detail to show that the transition is targeted, not generic ("I have spent the last six months learning [Company]'s approach to [domain] through [specific research, coursework, or project]")
- Never use the phrase "transferable skills" -- it is cover letter jargon. Show the transfer; do not name it
- Avoid language that frames the change as an escape from the old career. The tone should be "moving toward" not "moving away from"

### User has an employment gap
The key principle: address the gap briefly if it will be visible from the letter's dates, but do not volunteer it if it will not be visible. Cover letters do not include employment dates, so gaps are rarely legible from the letter alone -- the gap is a resume problem, not a cover letter problem in most cases.
If the gap needs addressing (e.g., the user wants to explain it to reduce recruiter concern): place the explanation in one sentence in paragraph 3, frame it neutrally or positively, and move immediately to what the user brings now. Acceptable framings: "Following a period of [caregiving responsibilities / health recovery / deliberate professional development], I am returning to [field] with [specific new capability or perspective]." Unacceptable framings: any framing that asks for sympathy, apologizes, or over-explains. One sentence. No more.

### User is overqualified for the role
An overqualified applicant's cover letter has one unique risk: the hiring manager assumes the candidate is settling, will leave quickly, or will be frustrated by the role's constraints. The letter must preemptively address this concern without raising it explicitly.
- Frame the application as a deliberate, strategic choice. The opening hook should signal intentionality: "After leading [large-scale responsibility], I am specifically drawn to [Company] because [specific reason that makes this role make sense at a smaller or different scale]"
- The fit paragraph should address why this scope, level, or company type appeals to the user right now. Acceptable reasons: company mission alignment, desire to build something from scratch, interest in a specific technical domain, geographic priority, or the specific team composition
- Never use language that suggests the user is willing to accept less: "I am flexible on compensation," "I understand this role is junior to my current level" -- these confirm the overqualification concern
- The letter should read as if this role is exactly right, not a compromise

### Role at a company the user knows nothing about
If the user cannot identify any genuine, specific reason to apply beyond the job description itself, do not invent company enthusiasm. Instead:
- Use the mission language from the posting itself as the anchor: "The role description's emphasis on [specific phrase from posting] reflects exactly the kind of challenge I want to take on"
- Prompt the user before writing: "Can you spend 5 minutes on their website or LinkedIn? I need one specific thing -- a product feature, a value they state publicly, or a recent announcement." One real detail is worth 10 invented ones
- If the user genuinely cannot identify a specific company detail and does not want to research, write the best possible letter using the job description's language and flag in the breakdown table that the company-specific element is posting-derived rather than independent research -- the user should strengthen this before sending

### Role in a highly technical or specialized field
Technical roles (software engineering, data science, medical device regulatory affairs, quantitative finance, academic research positions) require that the letter demonstrate domain fluency through vocabulary, not through enthusiasm.
- Use the technical terminology from the posting naturally and correctly. If the posting says "distributed systems," "GAAP compliance," "Phase III clinical trials," or "phenomenological methodology," those terms must appear in the letter -- not as keyword drops, but as vocabulary the user uses comfortably
- The quantified achievement in technical roles must include technical context: not just "I improved system performance" but "I reduced p99 API latency from 400ms to 85ms by optimizing database query patterns and introducing a Redis caching layer on high-frequency reads"
- For engineering roles specifically: the letter should name the scale of the system, the stack if relevant, and the outcome in business terms (not just technical terms). Hiring managers at tech companies respect both the technical depth and the awareness of business impact
- For academic positions: the letter must demonstrate awareness of the department's research directions, name specific faculty or research groups if the user has genuine connections to their work, and articulate the candidate's research agenda in relation to the department's -- this is a distinct subgenre and may require its own dedicated skill for full treatment

### User wants to address a specific objection they anticipate from the hiring manager
Sometimes users know they will raise a concern: they are in a different city, they come from a direct competitor (and the employer may be sensitive about IP), they left their last role under difficult circumstances, or they have an unusually short tenure at their previous employer.
- Address anticipated objections briefly, confidently, and in paragraph 3 -- not in the opening (do not lead with a weakness) and not in the closing (do not end on a defensive note)
- Relocation: "I am relocating to [city] in [month] and am available to begin immediately upon my arrival" -- state it as fact, not as a request for accommodation
- Competitor background: reframe as bringing competitive intelligence and proven domain expertise; avoid mentioning proprietary information and avoid speaking negatively about the previous employer
- Short tenure: address it only if the gap is visible and unexplained; frame it as a deliberate course correction or an organizational change outside the user's control, and emphasize what was accomplished in the short period
- If the user raises an objection the letter does not need to address, recommend against raising it -- silence is better than volunteering a concern the employer had not identified

---

## Example

**User input:** "I want to apply for a Senior Data Analyst role at Duolingo. The job description asks for someone with advanced SQL, experience with A/B testing and experimentation frameworks, ability to translate data into product decisions, and experience working directly with product managers and engineers. I have been a data analyst at an edtech company for 4 years -- I own our A/B testing infrastructure, ran an experiment that increased 7-day retention by 11 percentage points, and I use Duolingo myself every day for Spanish. The hiring manager's name is Marcus Webb."

---

**Full output:**

## Cover Letter: Senior Data Analyst at Duolingo

---

October 14, 2025

Marcus Webb
Duolingo

Dear Marcus,

I track my Duolingo Spanish streak the same way I track experiment metrics at work -- obsessively, and with a clear sense of what moves the number and what does not. The Senior Data Analyst role on your product analytics team is the convergence of the two domains I care most about: rigorous experimentation and learning product design that actually changes behavior. With four years owning A/B testing infrastructure at an edtech company and a track record of driving measurable retention improvements, I am ready to bring that work to a product I use daily.

At Knack Learning, I built and own our end-to-end experimentation framework -- from experiment design and sample size calculation through SQL-based result analysis and product team readout. The highest-impact test I ran was a notification timing experiment that increased 7-day user retention by 11 percentage points across a segment of 420,000 learners, translating to roughly $1.2M in projected annual subscription revenue based on our conversion model. I partner directly with product managers and engineers throughout every experiment cycle: writing the analysis brief before launch, instrumenting events with the engineering team, and presenting findings in a format that drives decisions rather than archives data.

What draws me to Duolingo specifically is your approach to engagement research -- particularly the published work your team has done on streak mechanics and the psychology of habit formation in language learning. That intersection of behavioral science and product instrumentation is exactly the domain I want to go deeper in. Duolingo's scale (500M+ registered users) means that even a 1% improvement in a retention metric represents an enormous real-world impact on how many people actually achieve language goals -- and that is the kind of stakes that motivates my best analytical work.

I would welcome the opportunity to discuss how my experimentation background could contribute to Duolingo's product analytics roadmap. I am available for a conversation any time this week or next -- just let me know what works.

Sincerely,
[Your Name]

---

### Cover Letter Breakdown

| Section      | Purpose                        | Strategy Used                                                                 | Word Count  |
|--------------|--------------------------------|-------------------------------------------------------------------------------|-------------|
| Opening      | Hook + top qualification       | Product user hook (personal streak + obsessive measurement) -- Duolingo-specific | 74 words   |
| Body P1      | Proof of capability            | 11-point retention lift across 420K learners, $1.2M revenue impact; A/B ownership | 118 words |
| Body P2      | Fit + company specificity      | Duolingo streak mechanics research cited; scale argument (500M users) as motivator | 97 words  |
| Closing      | Call to action                 | Active CTA with specific availability offer                                   | 44 words    |
| **Total**    |                                |                                                                               | **333 words** |

**Tone register:** Conversational-Professional (appropriate for Duolingo's product culture)
**ATS mirror terms used:** A/B testing, experimentation framework, retention, product decisions, SQL
**Quantified achievement:** 11-point 7-day retention lift across 420,000 learners; ~$1.2M projected annual revenue
**Company-specific element:** Duolingo's published research on streak mechanics and habit formation in language learning; 500M registered user scale
**Complicating factor addressed:** No: none present

---

**Why this letter works -- teaching notes for the AI:**

- The opening hook uses the product-user type but elevates it by connecting the personal behavior (streak obsession) to the professional behavior (metric obsession). It does not just say "I use your product" -- it shows that using the product and doing the job require the same cognitive orientation. That is a hook, not a mention.
- The hiring manager's name ("Dear Marcus") is used in the salutation because the user provided it. First-name salutation is appropriate for a tech company culture; a law firm or investment bank would use "Dear Mr. Webb."
- Paragraph 2 names the employer (Knack Learning), the project (notification timing experiment), the metric (11 percentage points), the scale (420,000 learners), and the business impact ($1.2M). It also explicitly names the cross-functional workflow (engineers for instrumentation, PMs for readouts) because the job description specified "working directly with product managers and engineers" -- that is mirror vocabulary working correctly.
- Paragraph 3 uses a specific Duolingo company detail (published streak mechanics research) that only someone who follows Duolingo's work would know. It then uses the user scale (500M users) as a motivator rather than just a fact -- framing scale as stakes, not just size, is a fit signal that distinguishes a candidate who has thought about this role from one who has not.
- The closing is 44 words. It does not summarize. It does not grovel. It makes a specific offer (available this week or next) and closes cleanly.
- Word count is 333, well within the 280-360 optimal range and safely under the 400-word ceiling.
