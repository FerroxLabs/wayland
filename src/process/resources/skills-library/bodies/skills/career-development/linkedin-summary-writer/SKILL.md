---
name: linkedin-summary-writer
description: |
  Writes a complete LinkedIn About section in first person, optimized for the
  user's target role and keyword searchability. Produces a ready-to-paste
  summary that tells a professional story, highlights key achievements, and
  includes a call to action. Use when the user wants to write or improve their
  LinkedIn summary, About section, or professional bio for LinkedIn. Do NOT
  use for resume summaries (use resume-summary-writer), LinkedIn headlines
  (use linkedin-headline-optimizer), or LinkedIn messages to recruiters
  (use recruiter-outreach).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "linkedin career template writing"
  category: "career-development"
  subcategory: "job-search"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# LinkedIn Summary Writer

## When to Use

**Use this skill when:**
- The user explicitly wants to write, rewrite, or improve their LinkedIn About section from scratch or with existing content
- The user says their LinkedIn profile is not attracting recruiter views, InMails, or connection requests and wants to fix the About section
- The user is preparing for a job search and wants to optimize LinkedIn before applying so that inbound recruiter interest supplements outbound applications
- The user is transitioning careers and needs the About section to reframe their background toward a new target role or industry
- The user wants to build thought leadership or personal brand visibility on LinkedIn and needs a professional anchor statement in their profile
- The user has just received a promotion, changed companies, or pivoted their focus and needs the About section to reflect their updated positioning
- The user is a freelancer or consultant who needs the About section to function as a client-facing value proposition rather than a job-seeker narrative

**Do NOT use this skill when:**
- The user wants a resume summary paragraph -- use `resume-summary-writer`, which follows ATS conventions and third-person or noun-phrase formatting that would be wrong on LinkedIn
- The user wants help writing or optimizing their LinkedIn headline (the 220-character line beneath their name) -- use `linkedin-headline-optimizer`, which handles keyword weighting and pipe-delimited formatting specific to that field
- The user wants to message a recruiter who reached out -- use `recruiter-outreach`, which handles response tone, salary negotiation framing, and interest-level signaling
- The user wants to write a cold outreach message to a hiring manager or potential connection -- use `networking-message-writer`
- The user wants to write a LinkedIn article or post -- the About section is a static bio, not a content piece
- The user wants a full portfolio bio for a personal website -- the voice, length, and structural conventions are different enough to require a separate approach

---

## Process

### Step 1: Gather the Raw Material Through Targeted Questions

Before writing a single word, collect the inputs that separate a generic LinkedIn About section from one that actually converts profile views into recruiter conversations. Ask the user for all of the following -- if they resist answering some questions, explain why each input changes the output.

- **Current role and company type:** Not just the title, but the size and stage of the company (Series A startup vs. Fortune 100 matters because it signals scope, autonomy, and context)
- **Target role(s) and target company type:** The exact job title they want to hold next, and whether they are targeting large enterprises, growth-stage startups, agencies, or specific industries. This determines keyword selection.
- **Total years of experience and career trajectory:** Whether they went up a single ladder or have a mosaic background changes how the origin story is told
- **Top 3-5 hard skills or technical competencies:** Specific tools, platforms, frameworks, methodologies -- the things that appear in job postings
- **One to three quantified achievements:** Dollar amounts saved or generated, percentage improvements, headcount managed, scale of systems built, time reduced. If they have no metrics, ask for scope indicators (number of customers, markets, product lines, team size)
- **Their professional differentiator:** What they can do that most people with the same title cannot. Probe for unusual combinations: deep technical skill + communication ability, domain expertise + cross-functional range, speed + rigor. The differentiator is the most important ingredient and users often undersell it.
- **Professional values or mission:** What draws them to this type of work beyond compensation -- this goes into the origin or proof section and makes the summary feel authentic rather than transactional
- **Job search status and openness:** Actively searching, passively open, building thought leadership, or open only to freelance work. This changes the call-to-action language significantly.

If the user provides a rough draft, a resume, or a list of bullet points, extract the above information from those materials rather than asking questions that the user has already answered.

---

### Step 2: Diagnose the User's Positioning Challenge

Before structuring the summary, identify which of the four positioning situations the user is in -- each requires a different structural emphasis:

**Situation A -- Advancing in a straight line:** The user has a clear title trajectory (e.g., Senior Analyst → Analytics Manager) in the same field. Emphasis goes on proof of performance and leadership readiness. The hook should signal readiness for the next level, not celebrate the current one.

**Situation B -- Career transition:** The user is moving across industries, functions, or from technical to managerial. The hook must name the intersection of old and new worlds. The origin story carries extra weight because it must make the transition feel inevitable rather than arbitrary.

**Situation C -- Re-entering after a gap:** The user has a sabbatical, caregiving period, layoff, or other gap. Do not reference the gap unless the user insists. Focus the entire summary on current capabilities and direction. The proof section should feature the most recent strong work regardless of how long ago it occurred.

**Situation D -- Building thought leadership / personal brand:** The user is not primarily job-seeking but wants to attract speaking engagements, consulting work, media opportunities, or a community following. The hook should be a bold point of view on their field. The call to action should invite intellectual engagement, not just employment conversations.

---

### Step 3: Construct the Hook with Precision

The LinkedIn "see more" fold appears after approximately 200-220 characters on mobile and after 2-3 lines on desktop. Everything before that fold must work as a standalone statement that creates enough intrigue or resonance to make the reader click. This is the single highest-leverage sentence in the entire profile.

Four proven hook structures, in order of effectiveness for LinkedIn:

1. **The Provocative Insight:** A counterintuitive observation about the user's field that signals expertise. "Most marketing attribution models are measuring the wrong thing -- and that is why 60% of B2B pipeline still gets credited to the wrong channel." This works when the user has genuine opinions formed through experience.

2. **The Specific Problem Statement:** Name the exact problem the user solves in terms the target reader immediately recognizes. "Enterprise data migrations fail not because of technology -- they fail because of change management. I fix that." Short, direct, no wasted words.

3. **The Scale/Scope Signal:** A number that establishes credibility before the reader even knows who the user is. "I have helped 40+ Series B companies build their first finance team from a spreadsheet to a real close process." Works best when the user has genuine scale behind them.

4. **The Identity-Plus-Mission Statement:** Name who you are and what you are building toward in a way that goes beyond a job title. "I am a mechanical engineer turned climate tech founder who left aerospace to make grid-scale energy storage actually manufacturable." Works for career changers and founders.

Avoid these common hook failures:
- Starting with "I am a passionate..." -- the word "passionate" without immediate evidence is the most overused word on LinkedIn and triggers a credibility discount
- Starting with the job title alone -- "I am a Senior Data Scientist at..." tells the reader nothing they could not see from the headline
- Starting with a vague aspiration -- "I believe in the power of storytelling..." is meaningless without context
- Starting with a years-of-experience count -- "With 12 years of experience in..." is the lowest-signal possible opening

---

### Step 4: Build the Origin Story to Create Authentic Connection

The 3-6 lines after the hook explain why the user does what they do and how they came to do it well. This section is not a chronological resume recitation -- it is the narrative connective tissue that makes the rest of the summary feel earned rather than claimed.

Effective origin stories answer one of these questions:
- What unusual path led them to this work? (The "unexpected background" origin)
- What problem did they encounter that made them choose this career? (The "motivated by a real challenge" origin)
- What combination of skills or experiences gives them an unusual vantage point? (The "intersection" origin)

Techniques that work:
- Use a specific scene or moment rather than a generalization: "I spent three years as a night-shift ICU nurse before moving into health tech. That is where I learned that bad UX in clinical software is not an inconvenience -- it is a patient safety issue."
- Name the professional tension or trade-off the user navigates -- it signals depth: "I sit at the intersection of data science and product strategy, which means I spend as much time asking 'should we build this?' as 'how should we build this?'"
- If the origin story is straightforward (user has been in the same field since graduation), skip the origin section or compress it to one sentence and expand the proof section instead

---

### Step 5: Assemble the Proof of Expertise Section

This is where credibility is built through specific, verifiable evidence. Generic claims ("strong communicator," "results-driven") are valueless here. Every sentence in the proof section must either contain a metric, reference a specific methodology or tool, name the scale or scope of work, or describe the type and complexity of problems solved.

Hierarchy of proof elements, strongest to weakest:

1. **Quantified outcomes:** Revenue generated, cost saved, error rates reduced, time compressed, headcount grown, customers acquired. Even rough numbers (approximately $2M in ARR, roughly 40% reduction in...) are more credible than no numbers.
2. **Scope and scale indicators:** Number of users, markets, countries, products, team members, or transactions. "Built and led a 12-person engineering team across three time zones" conveys more than "led a cross-functional engineering team."
3. **Named methodologies or frameworks:** "Led the company's shift from waterfall to SAFe Agile across 6 product squads" signals competence to hiring managers who know what that transition requires.
4. **Type and complexity of the problem:** Describe the problem clearly enough that someone in the field recognizes it as hard. "Rebuilt the company's data infrastructure from a single Redshift cluster to a multi-tenant lakehouse architecture while maintaining zero downtime for 200+ internal users" is self-evidently hard work to anyone who knows that domain.
5. **Recognizable institutions or clients:** If the user worked at recognizable companies or served notable clients and the information is not confidential, naming them adds credibility. "Built the demand forecasting model used across Nike's North American distribution network" is more credible than "built a forecasting model for a major retailer."

Aim for 2-3 proof elements in this section. More than 3 starts to feel like a resume. The goal is selection and emphasis, not comprehensiveness.

---

### Step 6: Write the Current Focus and the "Who I Help" Statement

After establishing credibility, the summary should tell the reader exactly what the user is doing today and who they are best positioned to help. This serves two functions: it signals current relevance (the summary is not frozen in the past) and it helps the right readers self-identify as potential opportunities.

Effective current focus statements:
- Name the type of problem, not just the job function: "Right now I am focused on helping Series A fintech companies build their first compliance infrastructure before the regulators come calling."
- Reference the type of environment where the user thrives: "I do my best work in high-ambiguity environments where the roadmap does not exist yet and needs to be invented."
- If the user is actively building something (a team, a product, a methodology), name it: "I am currently leading our expansion into the APAC market, which means I spend my days navigating a genuinely different set of consumer behavior assumptions."

For thought leadership profiles, this section can become a brief statement of point-of-view: "I believe that most companies' biggest competitive advantage is locked in their unstructured data -- and most of them have no idea it is there."

---

### Step 7: Craft a Specific, Frictionless Call to Action

The call to action is the most ignored section of LinkedIn About sections and the most important for converting reads into real outcomes. A vague CTA ("let's connect!") produces no action. A specific CTA reduces friction and tells the reader exactly when to reach out.

Effective CTA structures by job-search status:

**Actively searching:** "If you are building a data team at a Series B or later company, I would love to hear about what you are working on. Send me a message -- I respond within 24 hours."

**Passively open:** "I am always interested in conversations about [field] -- whether it is a challenging problem you are trying to solve, an opportunity that might be worth discussing, or just comparing notes on where the industry is heading. Feel free to reach out."

**Freelance/consulting:** "If you are dealing with [specific problem], I take on 2-3 consulting engagements per quarter. Reach out with a brief description of your challenge and we can figure out if it is a fit."

**Thought leadership:** "I write about [specific topic] every week. If you are thinking about these questions too, connect with me -- the best conversations I have had on LinkedIn started with a reply."

**Stealth search (employed but looking):** "I enjoy connecting with people working on interesting problems in [field]. If you are doing something unusual in this space, let's talk."

Never end the call to action with a period and no instruction. The reader should know the precise action to take -- connect, message, follow, or reach out via a specific channel.

---

### Step 8: Embed Keywords with a Recruiter-Search Strategy

LinkedIn's search algorithm uses keyword matching between what recruiters search for in Recruiter Lite and LinkedIn Recruiter and what appears in profiles. The About section is one of the indexed fields, but it carries less weight than the headline and current title. This means keywords in the About section must appear in complete sentences -- they cannot be a list.

Keyword selection methodology:
- Pull 5-10 job postings for the exact target role the user wants
- Identify terms that appear in 3 or more postings -- these are the high-signal keywords
- Distinguish between skill keywords (Python, Salesforce, financial modeling, user research) and role/seniority keywords (Director of Product, Senior Engineer, Head of Growth)
- Embed 1 instance of the exact target job title
- Embed 3-5 skill keywords in natural sentences within the proof and current focus sections
- Avoid repeating the same keyword more than twice -- it reads as stuffing and triggers skepticism in human readers

Common keyword embedding errors to avoid:
- Listing keywords at the end of the summary as a tag dump: "Skills: Python, SQL, Tableau, PowerBI, Snowflake" -- this looks like a spam attempt and reads as low-effort
- Using keyword variations that recruiters do not actually search: "machine learning engineering" when the search term is "ML engineer" or "machine learning engineer"
- Omitting the keyword form that matches the job posting: if postings say "account executive," do not only write "sales professional"

---

## Output Format

Produce all four components below as a complete, paste-ready package. Do not omit any section.

```
## LinkedIn About Section: [Target Role Title]

---

### Ready-to-Paste Summary

[Complete About section text. First person. 220-350 words.
 Blank line between each section (hook, origin, proof, current focus, CTA).
 No markdown formatting -- no bold, no bullets, no headers.
 Plain text exactly as it should appear when pasted into LinkedIn.]

---

### Section Breakdown

| Section          | Character/Line Range | What It Does                              |
|------------------|----------------------|-------------------------------------------|
| Hook             | Lines 1-2 (~200 char)| [What the specific hook accomplishes]     |
| Origin Story     | Lines 3-6            | [The specific narrative or path told]     |
| Proof            | Lines 7-13           | [The specific achievements featured]      |
| Current Focus    | Lines 14-17          | [The specific problems/context described] |
| Call to Action   | Lines 18-21          | [The specific action invited]             |

---

### Keywords Embedded

| Keyword / Phrase         | Section         | Natural Context                                 | Search Intent            |
|--------------------------|-----------------|-------------------------------------------------|--------------------------|
| [keyword 1]              | [section]       | [sentence fragment showing usage]               | [recruiter search type]  |
| [keyword 2]              | [section]       | [sentence fragment showing usage]               | [recruiter search type]  |
| [keyword 3]              | [section]       | [sentence fragment showing usage]               | [recruiter search type]  |
| [keyword 4]              | [section]       | [sentence fragment showing usage]               | [recruiter search type]  |
| [keyword 5]              | [section]       | [sentence fragment showing usage]               | [recruiter search type]  |

---

### Optimization Notes

- **Above-the-fold preview (mobile):** "[First ~200 characters of the summary verbatim]"
- **Above-the-fold preview (desktop):** "[First 2-3 lines verbatim]"
- **Positioning situation addressed:** [Straight-line advance / Career transition / Re-entry / Thought leadership]
- **Hook type used:** [Provocative insight / Problem statement / Scale signal / Identity-plus-mission]
- **Differentiator emphasized:** [One sentence explaining what makes the user stand out in this summary]
- **Tone register:** [Conversational-authoritative / Warm-professional / Direct-technical / Visionary-strategic]
- **Word count:** [X words]
- **Suggested A/B revision:** [One alternative hook to test if this one does not generate views within 30 days]

---

### Optional Enhancements (if applicable)

- **Emoji use:** [Recommendation on whether a single emoji as a section divider would help or hurt for this person's field and target audience -- e.g., finance: never; creative tech: neutral; consumer brand: can help]
- **Featured section tie-in:** [What the user should add to their LinkedIn Featured section to support claims made in the About section -- e.g., a case study, a portfolio link, a published article]
- **Complementary profile sections to update:** [Specific suggestions for the headline, Skills section, or experience bullets that reinforce the About section's positioning]
```

---

## Rules

1. **Always produce a complete, paste-ready About section -- never tips, critiques, or a list of suggestions.** The output must be text the user can copy and paste directly into LinkedIn without any editing required. If you need more information to write a complete summary, ask for it before producing any output.

2. **Write exclusively in first person ("I," "my," "me").** Third-person About sections ("Sarah is a seasoned...") are a common error that signals the person did not write their own profile, which damages authenticity. The only exception is if the user explicitly requests third person for a company founder profile where they also represent the brand.

3. **The first two lines are the only two lines that matter initially.** LinkedIn mobile shows approximately 200-220 characters before the "see more" truncation. Desktop shows 2-3 lines. If the hook is not immediately compelling, the rest of the summary will never be read. Revise the hook until it passes this test: would someone in the target role's hiring chain feel a flicker of recognition or curiosity from this sentence?

4. **Every achievement claim must be specific enough to be believed.** "Increased revenue" is not an achievement -- it is a category. "Grew MRR from $800K to $2.4M in 18 months by rebuilding the enterprise sales motion" is an achievement. If the user cannot provide metrics, ask for scope, scale, or the specific nature of the problem solved instead. Never fabricate numbers.

5. **Embed 3-5 keywords drawn from actual job postings, not from intuition.** Do not guess at what recruiters search for -- derive keywords from the language of the actual job postings for the target role. Verify that each keyword appears in a complete, grammatically natural sentence. Never append a skill list at the bottom of the summary.

6. **Use blank lines between sections for scannability.** LinkedIn collapses single carriage returns on paste, so double line breaks are required between sections. A wall of text in the About section is read by almost no one. The structure should be visible even before a word is read.

7. **Maintain length between 220 and 370 words.** Below 220 words, the summary feels thin and incomplete -- it signals the person did not think carefully about their positioning. Above 370 words, completion rates drop sharply and the summary starts to resemble a cover letter. The sweet spot is 250-320 words for most users.

8. **The call to action must name a specific type of conversation or opportunity.** "Let's connect!" is not a call to action. It gives the reader no reason to reach out and no criteria for when reaching out is appropriate. The CTA should reduce uncertainty: "If you are building a finance team at a growth-stage company and want to talk through your hiring sequence, send me a message."

9. **Never include contact information (phone number, personal email, website URL) in the About section.** LinkedIn has dedicated Contact Info fields for this. Putting a phone number in the About section looks unprofessional, risks spam, and duplicates what LinkedIn already surfaces. The exception: if the user is a freelancer whose primary platform is their website, a single brief reference ("more at my portfolio site") is acceptable without the URL.

10. **Do not allow unsubstantiated superlatives or buzzwords to survive the draft.** "Passionate," "innovative," "dynamic," "results-driven," "team player," "visionary," and "thought leader" must each be followed immediately by specific evidence or removed. If the user insists on keeping a buzzword, rewrite the surrounding sentence so the evidence appears before the label: "I rebuilt the entire content supply chain from intake to publication -- if that counts as an innovative approach, it is because the old process was genuinely broken" is acceptable. "I am an innovative content strategist" is not.

11. **Match the tone register to the industry and target audience.** A summary targeting a hedge fund CFO role should not read like a startup founder manifesto. A summary targeting a UX design role at a consumer tech company should not read like a McKinsey engagement summary. Before writing, identify the expected communication register for the target industry and calibrate accordingly.

12. **If the user is in a stealth job search, the summary must not signal job-seeking to a casual observer.** Do not use phrases like "seeking new opportunities," "open to new roles," or "exploring my next chapter." The LinkedIn #OpenToWork green frame and the private "Open to Work" recruiter signal are the appropriate mechanisms for signaling availability. The About section should read as a confident positioning statement, not a request for employment.

---

## Edge Cases

### The User Has No Quantified Achievements

Some users -- particularly those in functions where outcomes are collective (e.g., teaching, clinical healthcare, academic research, early-career roles) or where data is not tracked (e.g., many small business or nonprofit environments) -- genuinely cannot provide a metric. Do not fabricate numbers. Instead, use these proxy-evidence strategies:

- **Scale of responsibility:** "I managed the scheduling and care coordination for a 24-bed ICU across three shifts, which meant making dozens of high-stakes decisions each day without a playbook."
- **Complexity of the work:** "The tax structure we designed spanned five jurisdictions and needed to satisfy regulatory requirements that had not been formally reconciled before."
- **Recognition or selection:** "One of 12 fellows selected nationally from 400 applicants" or "Invited to testify before the state legislature on..." are metrics even if they are not business KPIs.
- **Trajectory:** "In three years I went from classroom teacher to department chair at the district's largest high school" signals performance without a percentage point.

The rule is: the reader should be able to finish the proof section thinking "this person has done hard, real work at meaningful scale" -- metrics are the easiest way to create that impression but not the only way.

---

### The User Has a Genuinely Non-Linear Career

A user who has been a marine biologist, a software salesperson, and is now a climate policy analyst should not apologize for the path or try to hide it. Non-linear backgrounds, told well, are a differentiator -- not a liability.

Strategy:
- Find the single thread that runs through all the roles. It might be a skill (systems thinking, communication across audiences, rapid learning in new domains), a value (impact at scale, working at the frontier of a field), or a type of problem (translating complexity into action).
- Name the thread explicitly in the origin story: "I have spent my career at the edge of fields that do not usually talk to each other -- and that is exactly where the most interesting problems live."
- Front-load the current/target role identity in the hook so the reader immediately knows where the person is headed, and let the origin story explain how they got there.
- Do not try to explain every role. Select two or three that most directly support the target positioning and let the others live in the experience section.

---

### The User Is a Recent Graduate or Has Fewer Than Two Years of Experience

Standard proof-of-expertise language breaks down when the user does not have a career arc to draw from. The About section for an early-career professional should be forward-leaning, not a defensive explanation of limited experience.

Adjustments:
- The hook should signal intellectual engagement with the field rather than seniority: "I became obsessed with how cities price parking after writing a thesis on congestion pricing -- and I have not been able to look at transportation policy the same way since."
- Replace employment achievements with project outcomes, academic research results, internship contributions, or self-directed work: "In my internship at a regional commercial real estate firm, I built the first automated rent comps model the team had used, cutting their analysis time from four hours to 45 minutes per deal."
- Forward-oriented language is appropriate and honest: "I am building expertise in..." rather than "I have expertise in..."
- The CTA should invite connection and learning rather than employment conversations: "I am eager to connect with people working on [specific domain] challenges and learn from what they are building."

---

### The User Wants to Attract Freelance Clients, Not Employers

The structural logic of the summary shifts when the reader is a potential client, not a recruiter or hiring manager. Clients have different concerns: can this person solve my specific problem, do they have relevant results for companies like mine, and is working with them going to be difficult?

Adjustments:
- Reframe the hook as a problem statement from the client's perspective: "Most e-commerce brands do not have a retention problem -- they have a segmentation problem that looks like a retention problem."
- The proof section should emphasize client results and the range of company types served, not internal promotions or team-building
- Replace "I am looking for roles" language with "I work with [type of company] on [type of problem]"
- The CTA should be specific about the engagement model: "I take on 2-3 fractional CFO engagements per year, typically with companies between $5M and $30M in revenue that are preparing for a fundraise or acquisition. If that describes your situation, reach out."
- If the user has a specific ICP (ideal client profile), name it directly -- it is more persuasive to speak precisely to one type of client than vaguely to all of them

---

### The User Already Has a Draft That Is Not Working

When a user provides an existing About section that is not generating views or recruiter contacts, diagnose before rewriting. The most common failure modes, in order of frequency:

1. **Hook failure:** The first two lines are a job title restatement or a generic mission statement. Everything else could be fine. Fix: rewrite only the hook with a provocative insight or specific problem statement and test for 30 days.
2. **No differentiator:** The summary describes competent performance of standard job responsibilities without revealing anything that makes the user distinctly valuable. Fix: ask the user the differentiator question ("What can you do that most people with your title cannot?") and rebuild the proof section around the answer.
3. **Wall of text:** The summary has no line breaks and reads as a paragraph block. Most readers will not start. Fix: restructure with blank lines between sections without changing the content.
4. **Passive voice and nominalizations:** "Was responsible for the management of..." instead of "I managed..." These constructions drain energy from the writing and signal low confidence. Fix: convert all passive constructions to active first-person verbs.
5. **Misaligned target:** The summary is optimized for their current role, not their target role. The keywords, proof selection, and CTA all point backward. Fix: rebuild from the keywords of the target role, not the current title.

When the problem is isolated (e.g., only the hook is weak), make the targeted fix and preserve the rest rather than rewriting the entire section.

---

### The User Is a Senior Executive or C-Suite Leader

Senior executives face a paradox: the more senior the role, the less their personal brand should lead with individual technical achievements and the more it should lead with a philosophy, vision, or pattern of organizational impact.

Adjustments:
- The hook should be a bold point of view on the function, industry, or the nature of leadership itself: "The hardest part of scaling a sales organization is not hiring -- it is getting everyone to stop selling the product you built and start selling the one the customer actually needs."
- Proof should emphasize organizational transformation, team building, and strategic decisions rather than individual contributor work: "I have taken three underperforming revenue organizations from declining NRR to category leadership -- each time by fixing the compensation model before touching the headcount."
- The origin story is often optional at this level -- the career speaks for itself through the experience section. Use the origin story space for philosophy instead.
- The CTA should invite peer-level conversations, board engagements, advisory relationships, or speaking opportunities, not entry-level networking.
- Avoid detailing individual technical skills that belong earlier in the career -- a VP of Engineering listing Python proficiency as a proof element looks misaligned with the seniority level being claimed.

---

## Example

**Input provided by user:** "I'm a supply chain manager with 9 years of experience, mostly in consumer electronics manufacturing. I want to move into supply chain consulting -- ideally at one of the big operations consulting firms like the ones that work with industrial and manufacturing clients. My biggest achievement was redesigning our supplier qualification process which cut component defect rates by 34% and saved about $4.2M annually. I'm also certified in APICS CSCP and Six Sigma Black Belt. I know lean manufacturing and I've worked a lot with S&OP processes. I'm not currently job searching -- I want to build visibility so consulting firms come to me."

---

**Output:**

## LinkedIn About Section: Supply Chain Consulting / Operations Strategy

---

### Ready-to-Paste Summary

The most expensive supply chain problem is the one your supplier qualification process was designed to ignore.

I learned that lesson managing procurement for a global consumer electronics manufacturer -- where a single second-tier component failure could halt production across three continents and cost more in one week than an entire quarter's cost-reduction program. That experience shaped how I think about supply chain risk: not as a compliance exercise, but as an engineering problem.

Over 9 years in consumer electronics manufacturing, I have specialized in the intersection of supplier quality and operational resilience. The work I am most proud of: redesigning a supplier qualification framework that reduced incoming component defect rates by 34% and generated $4.2M in annual cost avoidance -- not by adding inspection steps, but by moving quality upstream into supplier selection and onboarding.

My core toolkit spans S&OP process design, lean manufacturing, and cross-functional supplier development programs. I hold APICS CSCP and Six Sigma Black Belt certifications, which means I have the frameworks -- but I have spent a decade learning which frameworks actually survive contact with a real factory floor and which ones look better in a slide deck.

Right now I focus on applying these methods to organizations that are scaling quickly or absorbing supply chain disruptions that have exposed gaps in their operating model. The problems I find most interesting are the ones where process, technology, and supplier relationships are all tangled together and need to be sorted out simultaneously.

If you are working on supply chain transformation, operations strategy, or supplier performance challenges in manufacturing -- I would enjoy comparing notes. Connect with me or send a message.

---

### Section Breakdown

| Section        | Approximate Lines | What It Does                                                                      |
|----------------|-------------------|-----------------------------------------------------------------------------------|
| Hook           | Lines 1-2         | Provocative insight naming the specific failure mode the user is expert in fixing |
| Origin Story   | Lines 3-5         | Consumer electronics context explains why the user understands high-stakes risk   |
| Proof          | Lines 6-10        | 34% defect reduction + $4.2M savings with methodology (upstream, not inspection)  |
| Current Focus  | Lines 11-14       | Connects toolkit to consulting-relevant problem types (scaling, disruption)       |
| Call to Action | Lines 15-16       | Invites peer-level conversation -- not job-seeking, thought-leadership framing    |

---

### Keywords Embedded

| Keyword / Phrase            | Section       | Natural Context                                        | Search Intent                          |
|-----------------------------|---------------|--------------------------------------------------------|----------------------------------------|
| supply chain                | Hook, proof   | "...supply chain risk," "supply chain transformation"  | Primary role keyword                   |
| supplier qualification      | Hook, proof   | "supplier qualification process," "...framework"       | Specialized operations term            |
| S&OP                        | Current focus | "S&OP process design"                                  | Recruiter / consulting firm search     |
| lean manufacturing          | Current focus | "lean manufacturing" in toolkit description            | Methodology keyword                    |
| APICS CSCP                  | Proof         | Certification named in context of frameworks           | Credential-based recruiter filter      |
| Six Sigma Black Belt        | Proof         | Certification paired with CSCP                         | Methodology credential search          |
| operations strategy         | CTA           | "operations strategy...challenges in manufacturing"    | Consulting engagement type             |
| supplier performance        | CTA           | "supplier performance challenges"                      | Niche consulting service keyword       |

---

### Optimization Notes

- **Above-the-fold preview (mobile):** "The most expensive supply chain problem is the one your supplier qualification process was designed to ignore."
- **Above-the-fold preview (desktop):** "The most expensive supply chain problem is the one your supplier qualification process was designed to ignore. / I learned that lesson managing procurement..."
- **Positioning situation addressed:** Thought leadership / inbound consulting visibility (not active job search)
- **Hook type used:** Provocative insight -- names a specific failure mode that supply chain leaders and consulting firm principals will immediately recognize
- **Differentiator emphasized:** The user's insight that quality must be moved upstream into supplier selection, not managed through downstream inspection -- this is a genuine methodological position, not a generic claim
- **Tone register:** Conversational-authoritative -- confident without being boastful, specific enough to signal expertise, accessible enough for a non-specialist principal at a consulting firm to follow
- **Word count:** 294 words
- **Suggested A/B revision:** Alternative hook to test if visibility does not improve within 30-45 days: "I have spent 9 years learning why supply chain cost-reduction programs fail -- and it almost always traces back to the same three decisions made during supplier onboarding." This version leads with experience and pattern recognition rather than the provocative problem statement, which may perform better with a more conservative manufacturing industry audience.

---

### Optional Enhancements

- **Emoji use:** Not recommended. Target audience (operations consulting firms, manufacturing sector) skews conservative and emoji in the About section would reduce perceived seniority. Plain text is the right call here.
- **Featured section tie-in:** The user should add a Featured section linking to: (1) a LinkedIn article or post detailing the supplier qualification redesign methodology -- even a 400-word post with a before/after framework would generate significant engagement from the right audience; (2) any conference presentations, webinar recordings, or trade publication mentions if they exist.
- **Complementary profile sections to update:** The headline should be updated to include "Supply Chain Strategy | Operations Consulting" to reinforce the consulting positioning that the About section establishes. The Skills section should list CSCP, Six Sigma, S&OP, Lean Manufacturing, Supplier Development, and Supply Chain Risk Management explicitly so they appear in the skills endorsement area -- these reinforce the About section keywords in a separate indexed field.
