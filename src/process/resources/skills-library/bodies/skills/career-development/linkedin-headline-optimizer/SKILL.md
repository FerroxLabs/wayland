---
name: linkedin-headline-optimizer
description: |
  Produces 5 LinkedIn headline variants with keyword analysis for discoverability,
  selecting the optimal combination of role title, specialization, and value
  proposition within LinkedIn's 220-character limit. Analyzes each variant for
  recruiter searchability and click appeal. Use when the user wants to optimize
  their LinkedIn headline, improve their profile visibility, or create a headline
  that attracts recruiters. Do NOT use for LinkedIn About sections (use
  linkedin-summary-writer), LinkedIn messages (use recruiter-outreach or
  networking-message-writer), or resume summaries (use resume-summary-writer).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "linkedin career analysis"
  category: "career-development"
  subcategory: "job-search"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# LinkedIn Headline Optimizer

## When to Use

**Use this skill when:**
- The user wants to improve their LinkedIn profile visibility and appear more frequently in recruiter search results
- The user has a default headline (auto-populated by LinkedIn as their job title + company) and wants to replace it with something differentiated
- The user is targeting a career pivot, promotion, or new role type and wants their headline to signal that direction before their experience catches up
- The user is receiving low engagement -- few profile views, connection requests from irrelevant people, or no recruiter messages -- and suspects their headline is the bottleneck
- The user is a freelancer, consultant, or solopreneur who needs their headline to attract clients rather than (or in addition to) employers
- The user is re-entering the workforce after a gap, finishing a degree, or completing a certification and needs a headline that focuses on capability rather than recency
- The user's industry is highly competitive (software engineering, product management, finance, marketing) and they need every searchability advantage available

**Do NOT use this skill when:**
- The user wants to write or rewrite their LinkedIn About section -- use `linkedin-summary-writer`, which handles narrative, storytelling, and the full 2,600-character summary format
- The user wants to write a cold outreach message or reply to a recruiter -- use `recruiter-outreach` or `networking-message-writer`
- The user needs a resume summary or professional summary for a job application -- use `resume-summary-writer`, which optimizes for ATS scanning rather than LinkedIn's search algorithm
- The user wants a full LinkedIn profile audit across all sections -- this skill addresses the headline only; refer to the relevant section-specific skills for other fields
- The user wants to optimize a company LinkedIn page headline or tagline -- this skill is designed for individual professional profiles only
- The user needs advice on LinkedIn Premium, InMail strategy, or connection-request tactics -- those are separate skills
- The user is asking about LinkedIn post or article optimization -- headline discoverability is a profile-search function, not a content algorithm function

---

## Process

### Step 1: Gather Structured Inputs

Collect the following information before generating any variants. If the user has not provided it, ask directly -- do not guess or make assumptions about their target role or specialization.

- **Current job title and company:** Know the exact title as it appears on their profile, because LinkedIn's algorithm gives weight to the alignment between the headline and the most recent job title in the Experience section.
- **Target role or roles:** What specific job titles are they trying to attract? If they say "something in product," push for specificity -- "Product Manager," "Senior Product Manager," "Director of Product," or "Head of Product" all have different search volumes and competitive densities.
- **Top 3-5 skills or tools:** Ask for the skills they are strongest in AND the skills most relevant to their target role -- these may differ, and the headline must balance both.
- **Industry or domain focus:** Specific is better. "Technology" is not an industry signal. "B2B SaaS," "FinTech," "Clinical Healthcare IT," or "E-commerce" are. Industry terms narrow the recruiter's search and improve relevance matching.
- **Employment status and goal:** Actively searching (wants immediate recruiter contact), passively open (wants to be visible without alarming current employer), building a personal brand (thought leadership and speaking), or attracting clients (consulting or freelance). This changes tone and structure significantly.
- **Notable credentials, certifications, or brand-name employers:** AWS Certified Solutions Architect, PMP, CPA, CFA, SHRM-CP, Google, McKinsey, Goldman Sachs -- these increase click-through rates and should be included when relevant.
- **Character count constraints they care about:** Some users want a punchy short headline (~80-120 characters) because they know most mobile viewing truncates at around 100 characters; others want to maximize the 220-character field. Establish their preference.

### Step 2: Map the LinkedIn Search Ecosystem for Their Target Role

LinkedIn's recruiter search (specifically LinkedIn Recruiter, the paid tool recruiters use) operates on keyword matching across specific profile fields. The headline is one of the highest-weighted fields for candidate search -- alongside job titles in the Experience section and skills listed in the Skills section. Understand the mechanics:

- **Boolean search patterns recruiters use:** Recruiters typically search with combinations like `"Product Manager" AND ("B2B" OR "SaaS") AND "Roadmap"` or `"Data Engineer" AND ("Python" OR "Spark") AND "AWS"`. Your headline should be able to satisfy the primary keyword clause of the most common search patterns for the target role.
- **Exact-match vs. fuzzy-match:** LinkedIn's search is largely exact-match on headline keywords. "Senior Software Engineer" and "Software Engineering Lead" are NOT interchangeable in search results. The most commonly searched version of a title (which is usually the most generic one, not the fanciest-sounding variant) wins.
- **Search volume hierarchy:** Role title > seniority + role title > primary skill > secondary skills > industry. Lead with the highest-volume term unless there is a strong click-appeal reason not to.
- **Identify the "anchor keyword" -- the one term that must appear:** For most professionals, this is their target job title. Run a mental test: if a recruiter searches for exactly this job title, does this headline surface? If the answer is no, the headline is failing its primary function.
- **Industry keywords as filters, not features:** Recruiters often filter by industry category (LinkedIn's industry taxonomy) separately from keyword search, but including an industry keyword in the headline still helps with relevance ranking and with click-through self-selection -- the right recruiters click more, the wrong ones click less.

### Step 3: Generate 5 Headline Variants Using Distinct Structures

Each variant must use a genuinely different structural pattern. No two variants should share the same skeleton. Produce all 5 before scoring any of them.

- **Structure 1 -- Role + Skills + Industry (Search-First):** Prioritizes keyword density for recruiter search tools. Format: `[Target Role Title] | [Skill 1], [Skill 2], [Skill 3] | [Industry]`. Example: `Senior Data Engineer | Python, Spark, dbt | FinTech & Financial Services`. This structure sacrifices human appeal for algorithm performance and typically has the highest search score.

- **Structure 2 -- Value Proposition + Role (Human-First):** Prioritizes the "why should I click" question a human recruiter asks when scanning 25 results. Format: `Helping [audience] [achieve specific outcome] | [Role Title]`. Example: `Helping e-commerce teams cut customer acquisition costs through ML-driven targeting | Marketing Data Scientist`. Strong click appeal; moderate search score because the role title appears late.

- **Structure 3 -- Role + Specialization + Context (Balanced):** The most versatile structure for most professionals. Format: `[Role Title] -- [Specific Specialization] | [Context or Industry]`. Example: `Product Manager -- API Platforms & Developer Experience | B2B SaaS`. Scores well on all three dimensions; this is typically the recommended starting point.

- **Structure 4 -- Achievement + Role (Credibility-First):** Leads with a quantified or notable accomplishment before stating the role. Format: `[Specific achievement metric or credential] | [Role Title] | [Skills or Industry]`. Example: `$40M in closed revenue | Enterprise Account Executive | SaaS & Cloud Infrastructure`. High click appeal for roles where results are easily quantifiable (sales, finance, growth, operations).

- **Structure 5 -- Mission/Audience + Expertise (Brand-First):** Best for personal brand builders, consultants, or senior leaders where thought leadership matters. Format: `[What you do and for whom] | [Domain expertise areas]`. Example: `Scaling engineering organizations from 10 to 100 | Engineering Leader | Distributed Systems, People Development, FinTech`. Strong for VP/C-level and independent consultants; weaker for individual contributors in active job searches.

**Character counting rules:**
- Absolute hard limit: 220 characters. Count every character including spaces and punctuation.
- Practical mobile-display limit: approximately 100-120 characters before truncation in most LinkedIn mobile views (the exact truncation varies by device and context).
- For users on active job search who will appear in recruiter search results (desktop Recruiter tool), the full 220 characters display -- maximize it.
- For users building personal brand where most traffic comes from the LinkedIn feed (posts, comments), truncation matters more -- keep the most important information in the first 100 characters.

### Step 4: Score Each Variant on Three Dimensions

Evaluate each of the 5 variants against three independent 1-5 scores. Be rigorous -- two variants should not both score 5 on the same dimension unless both genuinely excel equally.

**Search Match (1-5):** Does this headline contain the exact keywords a recruiter would type into LinkedIn Recruiter to find this candidate?
- 5: Contains the anchor role title + at least 2 high-demand skill keywords in exact-match form
- 4: Contains the anchor role title + 1 high-demand skill keyword
- 3: Contains a close variant of the role title (e.g., "Engineering Lead" when target is "Engineering Manager") + some skills
- 2: Contains skills but buries or omits the target role title
- 1: No searchable keywords -- reads like a personal mission statement

**Click Appeal (1-5):** When a recruiter sees this headline next to 20-30 other results, does it stand out and motivate a click?
- 5: Specific, differentiated, communicates unique value or achievement, instantly clear what this person offers
- 4: Clear and specific, moderately differentiated
- 3: Clear but generic, no differentiator beyond the role title
- 2: Unclear value proposition, jargon-heavy, or self-focused language
- 1: Actively discouraging (vague buzzwords, "seeking opportunities," or confusing structure)

**Clarity (1-5):** Within 2-3 seconds, can a stranger understand who this person is professionally and why they are valuable?
- 5: Instantly clear -- anyone in the professional world understands what this person does and for whom
- 4: Clear to someone in the same industry
- 3: Requires some inference or domain knowledge
- 2: Confusing without prior context
- 1: Opaque or misleading

Sum the three scores for a total out of 15. Recommend the highest-scoring variant. If two variants tie, recommend the one with the higher Search Match score (because LinkedIn's algorithm drives profile views, which is the primary goal).

### Step 5: Produce Keyword Analysis

Map every keyword across the 5 variants in a structured table with three classification columns:

- **Keyword type:** Role title, seniority modifier, primary skill (a tool/methodology recruiters filter by), secondary skill, industry, credential/certification, audience signal
- **Search priority:** High (this exact term appears in most recruiter searches for this role), Medium (useful variant or secondary term), Low (differentiating but rarely searched)
- **Variants containing it:** List which of the 5 variants include this keyword

Flag any high-priority keywords that are missing from all 5 variants -- this is a signal to revise one of the weaker variants to include the missing term.

Flag any keywords that appear in only one variant -- if that keyword is high-priority, it should probably appear in more variants.

### Step 6: Provide Targeted Customization Guidance

After delivering the variants and analysis, give the user three specific, actionable pieces of advice:

- **Targeting adjustment:** Explain which one keyword to swap if they decide to target a different role level (e.g., if they shift from targeting "Senior Product Manager" to "Director of Product," tell them exactly which word to change and why)
- **A/B testing protocol:** LinkedIn does not have native A/B testing. The practical method: Change the headline every 14 days. Record profile views (visible in the Profile Analytics section, updated weekly) before and after each change. Run at least 3 cycles (6 weeks minimum) for meaningful comparison. The headline that generates more recruiter messages (not just profile views) is the winner.
- **Anti-patterns to avoid:** Identify the specific mistakes this user is at risk for based on their inputs -- not generic advice. If they mentioned a company brand, explain the brand-name trade-off. If they are a career changer, explain why they should not hide their current title.

### Step 7: Deliver the Final Output

Assemble the full output using the format defined below. Present it cleanly with no additional commentary outside the format. If the user wants to iterate, restart from Step 3 with the feedback incorporated.

---

## Output Format

```
## LinkedIn Headline Options: [Target Role Title]

**Profile context:** [1-line summary of the user's situation and goal]
**Character budget:** 220 characters maximum | First 100-120 characters display on mobile

---

### Variant Comparison

| # | Headline Text | Chars | Search (1-5) | Click (1-5) | Clarity (1-5) | Total /15 |
|---|---------------|-------|--------------|-------------|----------------|-----------|
| 1 | [Full headline text] | [count] | [score] | [score] | [score] | [total] |
| 2 | [Full headline text] | [count] | [score] | [score] | [score] | [total] |
| 3 | [Full headline text] | [count] | [score] | [score] | [score] | [total] |
| 4 | [Full headline text] | [count] | [score] | [score] | [score] | [total] |
| 5 | [Full headline text] | [count] | [score] | [score] | [score] | [total] |

---

### ⭐ Recommended: Variant [#]

**"[Full recommended headline text]"**

**Why this variant wins:**
- **Search advantage:** [Explain which keywords match recruiter search patterns for this role]
- **Click advantage:** [Explain what makes this headline stand out in a search result list]
- **Clarity advantage:** [Explain why this reads clearly for both in-industry and out-of-industry readers]

**Mobile preview (first ~100 chars):** "[First 100 characters of the headline]..."

---

### Keyword Analysis

| Keyword | Type | Search Priority | Appears In |
|---------|------|-----------------|------------|
| [keyword] | Role title | High | Variants 1, 2, 3, 4, 5 |
| [keyword] | Primary skill | High | Variants 1, 3 |
| [keyword] | Secondary skill | Medium | Variant 3 |
| [keyword] | Industry | Medium | Variants 1, 3, 5 |
| [keyword] | Credential | Low | Variant 2 |

**Coverage gaps:**
- ⚠️ [High-priority keyword] is missing from all variants -- consider adding to Variant [#] by replacing [weaker term]
- ✅ All high-priority role title keywords are covered

---

### What to Avoid (for this specific profile)

- ❌ **"[Specific bad headline]"** -- [Specific reason why this fails for this user's situation]
- ❌ **"[Specific bad pattern]"** -- [Specific reason why this fails for this user's situation]
- ❌ **"[Specific vague phrase]"** -- [Specific reason: e.g., "not a searchable term in LinkedIn Recruiter"]

---

### Customization Guide

**If your target shifts:**
- To target [higher role level]: Change "[current anchor keyword]" to "[new anchor keyword]" in Variant [#]
- To target [different industry]: Replace "[current industry term]" with "[new industry term]" across Variants [#] and [#]

**A/B Testing Plan:**
| Week | Headline | What to Measure |
|------|----------|----------------|
| Weeks 1-2 | Variant [#] -- [short label] | Baseline: record profile views count from Profile Analytics |
| Weeks 3-4 | Variant [#] -- [short label] | Compare profile views and recruiter message rate |
| Weeks 5-6 | Variant [#] -- [short label] | Compare to Week 1-2 baseline |
| Decision | Use variant with higher recruiter message rate, not just profile views |

**Where to find your data:** LinkedIn Profile Analytics (visible under your profile banner) shows views for the last 90 days and a weekly trend. Check it at the same day each week for consistent comparison.
```

---

## Rules

1. **Always produce exactly 5 variants with distinct structural patterns -- never fewer, never just variations of the same template.** If the user's situation is highly constrained (narrow niche, unusual role), it may require creative effort to find 5 genuinely different structures, but they must be different. A user needs options to A/B test, and a single recommended headline with no alternatives is not actionable.

2. **Every variant must contain the target role title in exact or very close form.** LinkedIn's search indexes headline text for keyword matching. A headline that says "Product Strategist" when the recruiter is searching "Product Manager" will not surface. The role title is the anchor keyword -- it is not optional. The only exception is Structure 2 (Value Proposition + Role), where the role title may appear after the value statement, but it must still appear.

3. **Enforce the 220-character limit absolutely -- count every character.** LinkedIn silently truncates headlines that exceed 220 characters. Do not estimate; count precisely. Spaces, pipes (|), dashes (--), commas, and periods all count. When in doubt, target 215 characters to leave a safety margin.

4. **Never recommend headlines that begin with "Seeking," "Looking for," "Open to," "Passionate about," or "Experienced in."** These are the most common weak headline patterns. "Seeking" and "Looking for" signal desperation to recruiters and waste searchable keyword space. "Passionate about" and "Experienced in" are self-descriptors that provide no value proposition. "Open to" belongs in the Open to Work feature, not the headline.

5. **Never use generic buzzwords as headline content without a specific qualifier.** "Strategic thinker," "Results-driven," "Innovative leader," "Problem solver," "Collaborative," and "Dynamic" are not searchable and not differentiating. If a user insists on including a quality descriptor, it must be attached to a specific skill or outcome: "Systematic approach to supply chain cost reduction" is acceptable; "Systematic thinker" is not.

6. **Do not recommend including current company name in the headline unless the company is a well-known brand that increases click-through rates.** "Software Engineer at Accenture" works because Accenture has brand recognition. "Software Engineer at MidwestTech Solutions LLC" wastes 25 characters that could hold skill keywords. The threshold: if the company name would be immediately recognized by a recruiter in the relevant field without explanation, include it. If not, skip it.

7. **Score honestly -- do not inflate scores to avoid the appearance of ranking variants poorly.** At least one variant should score 3 or lower on at least one dimension. If all variants score 4-5 on everything, the scoring is not discriminating enough to guide decision-making. The purpose of scoring is to create a clear hierarchy, not to validate every variant.

8. **Account for the mobile truncation reality when recommending which variant to use as the primary.** Approximately 70% of LinkedIn traffic is mobile. The first 100-120 characters of the headline are the de facto headline in the LinkedIn feed (when someone comments, posts, or appears in suggestions). If the most important keyword or differentiator appears after character 120, acknowledge this trade-off explicitly.

9. **Distinguish between employer-facing and client-facing headline goals -- they require different structures.** A headline optimized for recruiting (employer-facing) should lead with the role title for search indexing. A headline optimized for attracting clients (client-facing) should lead with the value proposition or outcome delivered, because potential clients scan LinkedIn for problem-solvers, not job titles. If the user has both goals, produce variants for both and flag them separately.

10. **Provide the keyword analysis table every time -- do not skip it even if the user just wants "a good headline."** The keyword analysis is the diagnostic layer that shows whether the generated headlines are actually covering the search landscape for the target role. A headline can sound great and still miss the two most-searched terms for a role. The keyword table makes coverage gaps visible and gives the user a framework for future headline iterations without needing to return to this skill.

---

## Edge Cases

### The Actively Job Searching User Who Does Not Want Their Employer to Know

The user wants maximum recruiter visibility but cannot use "Open to Work" (even the private setting visible only to recruiters carries some risk) and cannot have a headline that screams job search.

- Use a capabilities-forward headline that sounds like personal branding rather than job searching: "Senior Marketing Manager | Demand Generation & ABM | Driving pipeline growth in B2B SaaS" is neutral. "Senior Marketing Manager Seeking New Opportunities | Demand Generation" is not.
- All 5 variants should describe expertise, specialization, and industry value -- none should include any availability language.
- Explicitly tell the user to NOT use LinkedIn's "Open to Work" frame (even the private version), because LinkedIn's own documentation acknowledges that the private setting "isn't always reliable in hiding from your employer."
- Advise the user that the headline change itself (when they update it) will appear as an activity notification to their network by default. Tell them to turn off "Share Profile Updates with Your Network" in Privacy Settings before making the change.

### The Career Changer Pivoting to a New Field

The user has a genuine track record in Field A and wants to transition to Field B, but has limited direct experience in Field B.

- Do not create a headline that entirely abandons their current identity -- that erases the credibility they have built.
- Use a bridging structure that connects transferable skills to the target role: "Finance Analyst → Product Manager | Excel, SQL, User Research | Building data-informed products" signals both the transition and the transferable foundation.
- The arrow (→) in a headline is a legitimate visual device that communicates intentional career change without requiring explanation.
- For the search score, acknowledge honestly that until the Experience section catches up (i.e., they get a product role on their profile), their search visibility for "Product Manager" queries will be lower than a candidate with 5 years of PM experience. The headline can include the target title but the overall profile search ranking depends on the full profile.
- Recommend Structure 1 (search-first) to maximize the chance of appearing in target-role searches, even though their profile may not rank as high in results as incumbents.

### The User With a Highly Niche or Emerging Specialization

The user's expertise is in a specialization that is either too niche to have meaningful search volume (e.g., "Quantum Computing Security Researcher") or too new to have standardized terminology (e.g., "AI Governance Specialist" before that title stabilized).

- Lead with the broadest searchable role title that still accurately describes their work, then use the niche as a differentiator: "Cybersecurity Engineer | Quantum-Resistant Cryptography & Post-Quantum Standards | NIST frameworks."
- Identify the "parent category" title that recruiters searching for adjacent roles would use, and anchor the headline there.
- For emerging fields where terminology is still stabilizing (e.g., "Prompt Engineer," "AI Product Manager," "LLM Operations Engineer"), include both the emerging title AND the established title it most closely maps to: "Product Manager | AI/LLM Products | [Established skills]" -- the familiar title catches the search, the new title catches the niche audience.
- Flag that the keyword analysis for these roles may need to be revisited every 6-12 months as search terminology standardizes.

### The Senior Executive or C-Level Professional

A VP, SVP, or C-level professional has different headline needs than an individual contributor. Recruiters and executive search firms at this level often search by function and impact scope, not by skill keywords.

- Role title + scope is the primary structure: "Chief Marketing Officer | B2B SaaS | $200M+ Revenue Scale-Up Specialist" tells a board member or executive recruiter everything they need in 12 words.
- Skill keyword lists look junior at this level. A CMO listing "Google Ads, SEO, HubSpot" signals that they are operator-level, not executive-level. Replace skill keywords with scope descriptors: "global teams," "Series B through IPO," "$500M P&L," "Fortune 500."
- The personal brand structure (Structure 5) performs better for senior executives because executive recruiting is relationship- and reputation-driven rather than keyword-search-driven.
- For executives at publicly known companies, the company brand is a headline asset: "EVP of Engineering at [well-known company] | Distributed Systems at Scale | 0 to 1,000 Engineers."

### The Freelancer or Independent Consultant Targeting Both Clients and Recruiters

The dual-audience challenge is real -- client-attracting headlines and employer-attracting headlines use opposite structures.

- Produce 5 variants that split between client-facing (3 variants) and employer-facing (2 variants), or vice versa based on their stated priority.
- Clearly label which variants serve which audience in the scoring table.
- Client-facing headline principle: Lead with the outcome you deliver, not the title you hold. "Helping SaaS companies reduce churn by improving onboarding UX | UX Designer & Researcher" converts better with client audiences than "Senior UX Designer | SaaS, FinTech, Healthcare."
- Employer-facing headline principle: Lead with the role title for search indexing. The same person's employer-facing headline: "Senior UX Designer | SaaS & FinTech | Onboarding Optimization, Research, Figma."
- Advise the user to switch based on a 60-day cycle aligned with their current work pipeline -- when they have enough client work, flip to employer-facing; when work is thin, flip to client-facing.

### The User Whose Most Recent Role Is at a Well-Known Brand That Overshadows Their Skills

When someone works at Google, Apple, McKinsey, Goldman Sachs, or similarly prestigious organizations, including the company name can increase click-through rate substantially -- but it can also trap them in a box where recruiters only consider them for roles at equivalent-prestige companies.

- Include a variant that leads with the company brand and a variant that omits it entirely, and score them both.
- Explain the trade-off: the brand-name headline casts a narrower but more premium net. The skills-based headline casts a wider net.
- For users who want to expand their options beyond brand-name companies (e.g., a Google engineer who wants to consider well-funded startups), recommend the skills-based variant rather than the brand-led variant.
- The format when including the brand: "[Role Title] at [Company] | [Skill 1], [Skill 2] | [Domain]" -- the role title should still precede the company name for search indexing purposes.

### The User With Multiple Concurrent Roles or a Portfolio Career

Someone who is simultaneously a UX designer, an adjunct professor, and a freelance illustrator has a fragmented professional identity that a single headline must resolve.

- The headline must anchor to one primary professional identity, not attempt to list all roles. LinkedIn is not a resume objective statement.
- Ask the user: "If you could only attract one type of opportunity in the next 6 months, which would it be?" Use that answer to determine the anchor identity.
- Secondary identities can appear as context or credential: "UX Designer | Teaching Human-Centered Design at NYU | Formerly Adobe" -- the teaching role adds credibility without competing with the primary identity.
- If the user genuinely cannot prioritize (e.g., they are actively building two parallel careers), produce separate sets of 5 variants for each identity and explain that they will need to switch between them based on their current priority.

---

## Example

**Input:** "I'm a senior data scientist at a mid-size healthcare company. I want to move into a machine learning engineer role or an applied scientist role at a tech company or health tech startup. My main skills are Python, TensorFlow, PyTorch, NLP, and MLOps. I have 6 years of experience. No famous certifications but I do have a master's degree in computational statistics."

---

## LinkedIn Headline Options: Machine Learning Engineer / Applied Scientist

**Profile context:** Senior data scientist with 6 years of experience and an MS in Computational Statistics, targeting ML Engineer and Applied Scientist roles at tech companies and health tech startups; pivoting from analytics-heavy healthcare DS toward engineering-forward ML roles.

**Character budget:** 220 characters maximum | First ~100-120 characters display in most mobile contexts

---

### Variant Comparison

| # | Headline Text | Chars | Search (1-5) | Click (1-5) | Clarity (1-5) | Total /15 |
|---|---------------|-------|--------------|-------------|----------------|-----------|
| 1 | Machine Learning Engineer \| Python, PyTorch, TensorFlow \| NLP & MLOps \| Health Tech & Clinical AI | 97 | 5 | 3 | 5 | 13 |
| 2 | Helping health tech teams ship ML models that reach patients \| Applied Scientist \| NLP, MLOps | 92 | 3 | 5 | 4 | 12 |
| 3 | Senior Data Scientist → ML Engineer \| NLP, PyTorch, MLOps \| 6 Years Building Clinical AI Systems | 94 | 4 | 5 | 5 | 14 |
| 4 | MS Computational Statistics \| Machine Learning Engineer \| Python, TensorFlow, NLP \| Health Tech | 94 | 5 | 4 | 5 | 14 |
| 5 | Turning clinical data into production ML \| Applied Scientist \| NLP, PyTorch, MLOps \| Health AI | 95 | 3 | 5 | 4 | 12 |

---

### ⭐ Recommended: Variant 3

**"Senior Data Scientist → ML Engineer | NLP, PyTorch, MLOps | 6 Years Building Clinical AI Systems"**

**Why this variant wins:**

- **Search advantage:** Contains both "Data Scientist" (current, indexed by LinkedIn's Experience section match) and "ML Engineer" (target, the anchor keyword for recruiter searches). Dual-title coverage maximizes search surface area during the transition window before the new role title appears in the Experience section. "NLP," "PyTorch," and "MLOps" are three of the highest-demand skill keywords for ML Engineering job requisitions.
- **Click advantage:** The arrow (→) is a visual pattern that immediately signals intentional career transition -- it stands out in a list of static role-title headlines. "6 Years Building Clinical AI Systems" provides a credibility signal and specificity that most ML Engineer headlines lack. It answers the recruiter's implicit question: "Is this person already doing ML work or are they aspiring to it?"
- **Clarity advantage:** Any technical recruiter understands this headline in under 3 seconds. The progression is explicit, the skills are named, and "Clinical AI Systems" places the candidate in a specific domain without requiring a jargon decoder.

**Mobile preview (first ~100 chars):** "Senior Data Scientist → ML Engineer | NLP, PyTorch, MLOps | 6 Years Building Clinical..."

---

### Keyword Analysis

| Keyword | Type | Search Priority | Appears In |
|---------|------|-----------------|------------|
| Machine Learning Engineer | Role title (target) | High | Variants 1, 4 |
| ML Engineer | Role title (abbreviated target) | High | Variants 3 |
| Applied Scientist | Role title (alternate target) | High | Variants 2, 5 |
| Data Scientist | Role title (current) | High | Variant 3 |
| Python | Primary skill | High | Variants 1, 4 |
| PyTorch | Primary skill | High | Variants 2, 3, 5 |
| TensorFlow | Primary skill | Medium | Variants 1, 4 |
| NLP | Primary skill | High | Variants 1, 2, 3, 4, 5 |
| MLOps | Primary skill | High | Variants 1, 2, 3, 5 |
| Health Tech | Industry | Medium | Variants 1, 4 |
| Clinical AI | Industry/Domain | Medium | Variants 3, 5 |
| MS / Computational Statistics | Credential | Low | Variant 4 |

**Coverage gaps:**

- ⚠️ "Python" appears in only Variants 1 and 4 -- Python is the single highest-searched skill keyword in ML Engineering job postings. Consider adding it to Variant 3 by replacing "6 Years" with "Python, PyTorch" if the user prefers maximum keyword coverage over the credibility signal.
- ⚠️ "Machine Learning Engineer" (exact form, not abbreviated) only appears in Variants 1 and 4. If the user wants to prioritize this exact title match, Variant 4 is the strongest alternative to Variant 3.
- ✅ "NLP" and "MLOps" are covered across 4-5 variants -- strong coverage.
- ✅ Both target role titles ("Machine Learning Engineer" and "Applied Scientist") are represented across the 5 variants.

---

### What to Avoid (for this specific profile)

- ❌ **"Data Scientist | Machine Learning | Healthcare | 6+ Years Experience"** -- "Machine Learning" as a standalone phrase is a topic, not a role title or specific skill. It does not match the keyword "Machine Learning Engineer" in recruiter searches and does not differentiate from 50,000 other profiles using the same phrase. Replace with specific tools (PyTorch, TensorFlow) or the exact target title.
- ❌ **"Passionate Data Scientist Looking to Transition into ML Engineering"** -- "Passionate" wastes 10 characters and provides zero searchable value. "Looking to Transition" signals career uncertainty to hiring managers and does not index for any recruiter search query. The transition should be communicated through structure (the arrow format in Variant 3), not through self-description.
- ❌ **"Machine Learning Engineer | AI/ML | Data Science | NLP | Deep Learning | Python | Healthcare"** -- Keyword stuffing with slashes and vertical pipes reads as spam to human recruiters even if it improves algorithmic indexing marginally. Every term in the headline should earn its place by adding meaning. "AI/ML" is redundant when you have already said "Machine Learning Engineer."
- ❌ **"MS in Computational Statistics | Data Scientist at [Current Company] | Healthcare AI"** -- Leading with the degree and burying the company name foregrounds academic identity over professional capability. For a 6-year professional, the degree should be context, not the lead. Use the credential as a supporting element (as in Variant 4) rather than the first keyword.

---

### Customization Guide

**If your target shifts:**
- **To target senior/staff ML Engineer roles** (instead of generalist ML Engineer): Change "ML Engineer" in Variant 3 to "Staff ML Engineer" or "Senior ML Engineer" -- seniority modifiers do appear in recruiter filter searches at the Staff level and above.
- **To target health tech specifically over broad tech**: Bring "Health Tech" or "Clinical AI" earlier in the headline -- move it from the end to the second segment: "Senior Data Scientist → ML Engineer | Clinical AI & NLP | PyTorch, MLOps."
- **To target Big Tech (Google, Meta, Amazon) vs. health tech startups**: Replace "Clinical AI Systems" with "Large-Scale Production Systems" or "High-Throughput ML Pipelines" -- these are the scope signals that resonate with Big Tech engineering recruiters.
- **If you complete an AWS Machine Learning Specialty or Google Cloud ML Engineer certification**: Add the credential abbreviation immediately after the role title in Variant 4: "AWS ML Specialty | Machine Learning Engineer | Python, TensorFlow, NLP | Health Tech" -- certifications from cloud providers are actively filtered by many recruiters.

**A/B Testing Plan:**

| Week | Active Headline | What to Measure |
|------|----------------|----------------|
| Weeks 1-2 | Variant 3 (transition signal) | Baseline: record profile views from Profile Analytics |
| Weeks 3-4 | Variant 4 (credential + exact title) | Compare profile views AND recruiter InMail/message count |
| Weeks 5-6 | Variant 1 (pure keyword density) | Compare to prior two periods |
| Decision | Select variant with highest recruiter message rate -- not just profile views | -- |

**Where to find your data:** Go to your LinkedIn profile → click "Analytics" below your profile banner → select "Profile views" → note the weekly trend. More important than total views: track the number of recruiter messages and connection requests that arrive from ML Engineering teams each week. That is the real conversion metric.

**Before making any headline change:** Go to Settings & Privacy → Visibility → Share profile updates with your network → toggle OFF. This prevents your employer and network from seeing a notification that you updated your headline, which is particularly important given your passive-search status.
