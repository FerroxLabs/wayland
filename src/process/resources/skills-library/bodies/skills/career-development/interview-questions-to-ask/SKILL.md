---
name: interview-questions-to-ask
description: |
  Generates 15-20 thoughtful questions for the user to ask interviewers,
  categorized by role clarity, team culture, growth opportunities, and company
  direction. Questions are tailored to the user's target role and demonstrate
  preparation and genuine interest. Produces a prioritized question bank the
  user can draw from during any interview. Use when the user wants questions to
  ask an interviewer, needs to prepare the "do you have any questions for us?"
  portion, or wants to evaluate a potential employer. Do NOT use for answering
  interview questions (use behavioral-interview-prep), predicting what will be
  asked (use interview-question-anticipator), or company research
  (use company-research-guide).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "interview-prep career template"
  category: "career-development"
  subcategory: "interview-preparation"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Interview Questions To Ask

## When to Use

Use this skill when the user is preparing for the "do you have any questions for us?" portion of a job interview. Specific triggers include:

- User explicitly asks "what questions should I ask my interviewer?" or "how do I prepare my questions to ask?"
- User is prepping for an upcoming interview and has covered the behavioral/response side but not the evaluation side
- User wants to assess whether a specific role or company is a genuine fit for their priorities -- not just whether they will get an offer
- User is interviewing with multiple people across multiple rounds and needs a differentiated question set for each interviewer type
- User is in a late-stage round (second, third, final) and needs deeper, decision-quality questions beyond what early-round candidates ask
- User is a senior candidate (Staff, Principal, Director+) whose questions must reflect strategic scope, not just curiosity about daily work
- User is evaluating an offer from a company they have concerns about and wants to use remaining interview touchpoints to validate or disqualify

Do NOT use this skill when:

- The user wants to prepare answers to behavioral questions -- use `behavioral-interview-prep` instead
- The user wants to anticipate what they will be asked by the interviewer -- use `interview-question-anticipator`
- The user wants a structured research plan to learn about the company before the interview -- use `company-research-guide`
- The user wants a full end-to-end interview preparation plan across all components -- use `interview-prep-plan`
- The user is negotiating after receiving an offer -- use `offer-negotiation-strategy`
- The user wants to write a thank-you note referencing their questions -- use `post-interview-followup`

---

## Process

### Step 1 -- Collect the Context You Need (Never Skip This)

Before generating a single question, gather five categories of information. If the user provides minimal context, ask for it directly rather than generating generic questions.

- **Role and seniority:** Job title, level (junior, senior, staff, director), primary function (engineering, marketing, operations, product, sales, etc.). Seniority dramatically changes which questions are appropriate -- an individual contributor asking about M&A risk looks confused; a VP asking the same question signals strategic thinking.
- **Company type and stage:** Public vs. private, startup (seed/Series A/B/C/D+) vs. growth-stage vs. enterprise vs. nonprofit. Each context generates entirely different signals from the same answers.
- **Interviewer identity:** Name and title if known. If unknown, which category -- HR/recruiter, hiring manager, peer/team member, skip-level executive, cross-functional partner. This single variable determines 60% of which questions belong in the session.
- **Interview round and history:** Phone screen, first round, panel, final round. For rounds 2+, ask what the user already learned in prior rounds so you do not duplicate or generate superficial questions.
- **User's personal priorities:** Ask the user to rank what matters most: technical challenge, compensation, learning velocity, work-life balance, mission alignment, managerial quality, autonomy, team caliber, career trajectory, remote flexibility. The top 2-3 priorities should drive the question selection. A user who ranks managerial quality first needs very different questions than one who ranks technical challenge first.
- **Known concerns or red flags:** Has the user noticed anything in the JD, Glassdoor reviews, LinkedIn data, or prior rounds that needs probing? Great questions often come from resolving ambiguity or validating a concern, not from generic curiosity.

### Step 2 -- Classify Questions Across Five Categories (Not Four)

The standard four-category model misses one critical area. Use five categories to generate a complete bank:

**Category 1: Role Reality (5-6 questions)**
The gap between the job description and the actual job is almost always larger than candidates expect. These questions close that gap.
- Focus on what the role is NOT -- the constraints, the friction, the unsolved problems
- Ask about what the previous person in the role did, why they left, and what was learned
- Ask about the ratio of new work vs. maintenance and legacy work
- Ask about decision-making authority -- who owns what, and where does this role's authority end
- Ask about success metrics in specific, measurable terms: not "what does success look like" but "what would make you confident in 6 months that hiring me was the right decision?"

**Category 2: Team Dynamics (4-5 questions)**
- Ask about how the team makes decisions when there is disagreement -- this reveals power structures
- Ask about the team's recent history: who left, why, what the team looked like 18 months ago vs. today
- Ask about how the team handles failure, missed deadlines, or poor outcomes -- not just wins
- Ask about explicit norms around communication: async vs. synchronous, expected response times, how meeting-heavy the culture is

**Category 3: Manager Relationship (3-4 questions)**
Most candidates skip this category entirely. It is the single highest-impact category for job satisfaction.
- Ask the manager directly how they prefer to give feedback: written, verbal, scheduled, in-the-moment
- Ask what their best direct report in the past year did that made them proud
- Ask how they handle situations where they disagree with their own manager's decisions and need to carry them out
- Ask what the manager considers their biggest weakness as a manager (rare question; signals self-awareness in both parties)

**Category 4: Growth Trajectory (3-4 questions)**
- Ask for concrete, named examples of people who were promoted -- not hypotheticals
- Ask what skills are rewarded for advancement vs. just required for the current role
- Ask what the company does when a high performer outgrows their role faster than a new position is available
- Ask about the 18-month roadmap for the team's scope and headcount -- growth trajectory of the team predicts opportunity

**Category 5: Company Health and Direction (3-4 questions)**
- For startups: ask about runway and path to profitability explicitly -- these are not rude questions for senior roles
- For public companies: ask about what is driving the investment in this team or function right now
- Ask where the company is strongest relative to its competitors and what gap it is most actively trying to close
- Ask the interviewer directly: "What would make you personally choose to stay here for another 3 years?"

### Step 3 -- Match Questions to Interviewer Type With Precision

This is the most commonly botched part of question preparation. A wrong question asked to the wrong person wastes the entire exchange.

**HR / Recruiter (phone screen or process-focused first contact)**
- Best questions: hiring timeline and process, what the company's culture looks like from the inside, what makes candidates succeed or fail in this role, what onboarding looks like
- Acceptable: high-level team composition, remote or hybrid policy, benefits overview (but not salary in early rounds)
- Avoid: technical architecture, team-level dynamics, detailed performance criteria, strategic company direction (recruiters often cannot answer credibly and the exchange loses value)

**Hiring Manager**
- Best questions: everything in Categories 1, 2, and 3 -- role reality, team dynamics, and the manager relationship itself
- Acceptable: growth trajectory, company investment in the team, how success is defined
- Avoid: company-wide financial questions (unless they are in the C-suite), highly technical questions if the manager is non-technical

**Peer / Team Member**
- Best questions: day-to-day experience, what they wish they had known before joining, how the team actually works vs. how it is described in the JD, what collaboration with the hiring manager looks like from below
- Accepted: tools and processes, onboarding experience, team communication patterns
- Avoid: performance reviews, compensation philosophy, strategic direction, questions that put the peer in a politically difficult position ("Do you think management makes good decisions?")

**Skip-Level Executive (VP, C-level)**
- Best questions: company strategy, where this function fits in the 3-year plan, how the executive thinks about building vs. buying in this domain, what the company's biggest organizational challenge is
- Acceptable: what they personally look for in the leaders and ICs below them, what has surprised them most about the company since joining
- Avoid: tactical role-level questions (deeply wrong signal), compensation, day-to-day process questions (waste of the access)

**Cross-Functional Partner (e.g., Product Manager interviewing a Designer, Legal interviewing a Finance candidate)**
- Best questions: how decisions get made when your team and their team have conflicting priorities, what a good working relationship looks like to them, past examples of cross-functional friction and how it was resolved
- Avoid: role-specific technical questions unrelated to the cross-functional dynamic

### Step 4 -- Rank Questions by a Three-Axis Scoring Model

Do not rank questions vaguely by "quality." Score each question explicitly on three axes:

**Axis 1 -- Information Yield (1-5)**
How much high-quality, decision-relevant information does the answer provide? A question that yields a concrete, specific answer scores 5. A question that yields a polished corporate non-answer scores 1.
- "What does success look like?" = 2 (generic, coached answer likely)
- "If I am outperforming expectations in 90 days, what would the evidence of that look like to you?" = 5 (forces specificity)

**Axis 2 -- Signal Sent (1-5)**
How does asking this question affect how the interviewer perceives the candidate?
- Shows research, systems thinking, and preparation = 5
- Neutral, standard question = 3
- Signals wrong priorities or lack of preparation = 1

**Axis 3 -- Uniqueness (1-5)**
How often does the interviewer hear this exact question?
- "What is the company culture like?" = 1 (heard 200 times this year)
- "What is the last decision the team made that you would make differently?" = 5 (rare and memorable)

Compute a total score (max 15). Recommend the questions with scores of 12+ as the top priority tier. Present top 5 in the priority table.

### Step 5 -- Build the Decision-Quality Questions for Late-Stage Rounds

For final rounds and offer-stage conversations, a distinct set of questions is needed. These are not "impress the interviewer" questions -- they are genuine evaluation questions that help the user decide whether to accept.

- "If I were to speak to someone who left this team in the past 12 months, what do you think they would say was the hardest part of working here?"
- "What is the one thing about working here that is not visible from the outside that you think people underestimate?"
- "What would make you personally choose to stay here for another two years?"
- "What has changed most dramatically about how this company operates in the last two years?"
- "Is there anything about this role that is currently being figured out -- in terms of scope, reporting structure, or strategy -- that I should know about?"

These questions yield information that changes decisions. Flag them explicitly as "decision-quality" in the output.

### Step 6 -- Generate Questions Anchored to the Specific JD and Company Context

Generic questions are a missed opportunity. At least 30% of the question bank (minimum 4-5 questions) must reference specific details from the role, the JD, or the company's known situation. Patterns to follow:

- Reference technologies, methodologies, or skills mentioned in the JD: "The JD mentions you are moving toward a headless CMS architecture -- how far along is that transition, and what does the legacy content system look like?"
- Reference company news or known business context: "I saw the company expanded into the SMB segment last year -- how has that affected what this team works on?"
- Reference team structure clues from LinkedIn or the JD: "The role mentions working with three product teams -- are those teams co-located or distributed, and does that affect collaboration patterns?"
- Reference stated values or mission: "The company's mission centers on making financial services accessible -- how does that principle show up in the tradeoffs the engineering team makes day to day?"

If the user has provided minimal company context, generate the question templates and explicitly label them with `[PERSONALIZE WITH: ...]` notes so the user knows where to fill in specifics before the interview.

### Step 7 -- Flag and Explain Questions to Avoid

For every generated question bank, include a "Questions to Avoid" section addressing the most common mistakes in this role and interview context. Categories of questions to flag:

- **Research failures:** Any question answerable in 5 minutes on the company website or LinkedIn -- asking these signals laziness and actively hurts candidacy
- **Premature compensation focus:** Salary, bonus structure, equity details, PTO, and benefits questions before an offer stage signal the user is primarily motivated by compensation rather than the work, regardless of whether that is true
- **Implied doubt or anxiety:** Questions phrased as "Is there a lot of overtime?" or "Do people work on weekends here?" can be rephrased as "What does work-life balance actually look like on this team?" -- teach the user to ask the same thing in a framing that does not signal apprehension
- **Yes/no dead ends:** Questions that can be answered with a single word close the conversation rather than open it -- every question should invite narrative response
- **Politically risky peer questions:** Never ask a peer interview participant "Do you think management makes good decisions?" or "What is the biggest problem with working here?" -- these put them in an impossible position and rarely yield honest answers; rephrase as "What surprised you most about how the team works after your first 90 days?"

---

## Output Format

Produce this exact structured output:

```
## Interview Questions Bank: [Role] at [Company]

**Interviewer:** [Name and title if known | Interviewer type if unknown]
**Interview Stage:** [Phone screen / First round / Second round / Final round]
**User's Top Priorities:** [List 2-3 priorities the user stated, e.g., Growth, Engineering Culture, Autonomy]
**Total Questions Generated:** [count, should be 17-22]

---

### Top 5 Priority Questions
*(Ranked by combined Information Yield + Signal Sent + Uniqueness score)*

| Rank | Score | Question | Category | Why It's Strong | Best Asked To |
|------|-------|----------|----------|-----------------|---------------|
| 1 | [X/15] | "[Full question text]" | [Category] | [2-sentence explanation of what it reveals and why it signals well] | [Interviewer type] |
| 2 | [X/15] | "[Full question text]" | [Category] | [2-sentence explanation] | [Interviewer type] |
| 3 | [X/15] | "[Full question text]" | [Category] | [2-sentence explanation] | [Interviewer type] |
| 4 | [X/15] | "[Full question text]" | [Category] | [2-sentence explanation] | [Interviewer type] |
| 5 | [X/15] | "[Full question text]" | [Category] | [2-sentence explanation] | [Interviewer type] |

---

### Full Question Bank

#### Category 1: Role Reality

1. "[Full question text]"
   - Reveals: [What the answer tells the user, written specifically]
   - Red flag answer: [What a bad or evasive answer sounds like]
   - Green flag answer: [What a good, honest answer sounds like]

2. "[Full question text]"
   - Reveals: [...]
   - Red flag answer: [...]
   - Green flag answer: [...]

[Continue for all 5-6 questions in this category]

#### Category 2: Team Dynamics

[Same format, 4-5 questions]

#### Category 3: Manager Relationship

[Same format, 3-4 questions]

#### Category 4: Growth Trajectory

[Same format, 3-4 questions]

#### Category 5: Company Health and Direction

[Same format, 3-4 questions]

---

### Decision-Quality Questions
*(For final rounds or when making an acceptance decision -- these are for the user's evaluation, not impression management)*

- "[Question]" -- What it helps you decide: [specific]
- "[Question]" -- What it helps you decide: [specific]
- "[Question]" -- What it helps you decide: [specific]

---

### Questions by Interviewer Type

| Interviewer Type | Ask These Numbers | Avoid These |
|-----------------|-------------------|-------------|
| HR / Recruiter | Q[#], Q[#], Q[#] | Company strategy (out of scope), technical architecture, manager feedback |
| Hiring Manager | Q[#], Q[#], Q[#] | Benefits and logistics (HR's domain), highly tactical peer-level questions |
| Peer / Team Member | Q[#], Q[#], Q[#] | Strategic direction, performance criteria, politically risky questions |
| Skip-Level Executive | Q[#], Q[#], Q[#] | Daily process, role-specific tool questions, tactical logistics |
| Cross-Functional Partner | Q[#], Q[#], Q[#] | Role-internal questions unrelated to collaboration |

---

### Questions to Avoid in This Interview

| Question to Avoid | Why It Hurts | Better Alternative |
|-------------------|--------------|-------------------|
| "[Bad question]" | [Specific reason] | "[Reframed version]" |
| "[Bad question]" | [Specific reason] | "[Reframed version]" |
| "[Bad question]" | [Specific reason] | "[Reframed version]" |

---

### Personalization Reminders
*(Fill these in before the interview for maximum impact)*

- Replace [COMPANY CONTEXT] placeholders with specific details from your research
- Reference specific answers from earlier rounds if this is round 2+
- If the interviewer has a public LinkedIn or published work, reference it in one question
```

---

## Rules

1. **Never output generic questions.** Every question in the bank must be tailored to the specific role, seniority level, company type, and interviewer. "What is the company culture like?" is never acceptable as a final output -- it must be rewritten with specifics. If the user provides insufficient context to tailor, ask before generating.

2. **Always include red flag and green flag answer signals.** The user needs to know not just what to ask but how to evaluate the answer they receive. A hiring manager who cannot give a concrete answer to "what would evidence of success in 90 days look like?" is signaling something important. Name what that signal is.

3. **Score every top-5 question numerically.** Use the three-axis model (Information Yield, Signal Sent, Uniqueness, max 15). Do not substitute qualitative labels like "excellent" for the numeric score. The discipline of scoring forces differentiation.

4. **The Manager Relationship category is mandatory for any role with a direct manager.** This is the most underused category in candidate question banks and the single strongest predictor of job satisfaction. Never omit it.

5. **Seniority must change the questions fundamentally.** A junior candidate asking about company M&A strategy looks misaligned. A Staff Engineer or Director NOT asking about organizational structure and team investment looks incurious. The output must reflect the appropriate scope for the level.

6. **Decision-quality questions must be clearly separated from impression questions.** The user needs to understand that final-round questions serve a different purpose -- they are due diligence tools, not performance. Never conflate the two in the output.

7. **The "Questions to Avoid" table must always include a better alternative.** Telling the user what NOT to ask without showing them the better phrasing is incomplete. Every bad question has a reframed version that gets at the same underlying information without the negative signal.

8. **Salary, equity, PTO, and benefits questions belong ONLY in the offer stage.** If the user asks to include them in a pre-offer question bank, explain why this is premature and note that these questions are covered in `offer-negotiation-strategy`. Do not include them in the bank under any pre-offer scenario.

9. **At minimum 30% of generated questions (4-5 questions in a 17-question bank) must reference something specific** -- the JD language, the company's known business context, a specific technology mentioned, or the interviewer's background. If user context is too thin to achieve this, label placeholders explicitly with `[PERSONALIZE WITH: description]` rather than leaving vague templates.

10. **For rounds beyond the first, always ask what the user already learned** before generating new questions. Duplicate questions waste rare interview time and signal the user was not paying attention in prior rounds. Build on prior conversations explicitly -- "In the first round, I heard [X]. Can you tell me more about how [Y] connects to that?"

11. **Never use yes/no questions.** Every question in the bank must be open-ended and invite a narrative response of at least 2-3 sentences. If a question can be answered with a single word, rewrite it before including it.

12. **Peer interview questions must never put the peer in a politically uncomfortable position.** The user interviewing with a future colleague who is asked "Does management communicate well?" is asking them to either lie or risk their job. These questions get deflected and destroy rapport. Rephrase everything through the lens of the peer's personal experience, not their evaluation of the company.

---

## Edge Cases

### User Does Not Know Who They Are Interviewing With

This happens frequently when a recruiter sends a calendar invite without names or titles. Do not let it block question generation.
- Generate a complete bank across all five categories with full annotation
- In the "Questions by Interviewer Type" table, map every question to the appropriate interviewer type
- Add a practical note: "If you do not know who you will be speaking with, ask the recruiter before the call: 'Could you tell me the name and role of who I will be speaking with so I can prepare?' This is completely appropriate and signals preparation."
- If the user learns the interviewer type at the start of the call, the question routing table allows real-time selection in 5 seconds

### User Is in the Final Round and Has Already Asked Many Questions

By round 3 or 4, the basic questions are exhausted. Shift the output composition:
- 40% of the bank should be "build on what you've heard" questions: frame templates like "In an earlier conversation, I heard that [X]. I wanted to understand more about how [Y] intersects with that -- can you give me a concrete example?"
- 40% should be decision-quality questions from Step 5 -- the user is now evaluating whether to accept, not whether to advance
- 20% should be questions that reveal the interviewer's personal relationship with the company: "What has kept you here?" or "What would have to change to make you leave?" These yield the most honest company intelligence available
- Flag clearly that late-stage questions should focus on the user's decision, not on impressing the panel

### User Is Interviewing at an Early-Stage Startup (Seed Through Series B)

Startup context requires a fundamentally different question category -- company health -- that most career guides skip because it feels aggressive. It is not.
- Runway and burn rate questions are appropriate and expected for any role above individual contributor: "What is the company's current runway, and what milestones would trigger the next fundraise?"
- Ask about the founding team's relationship: "How do the founders divide decision-making authority, and has that evolved since the company started?"
- Ask about the biggest existential risk from the team's perspective: "What is the scenario that keeps leadership up at night, and how is the company addressing it?"
- Ask about what the team looked like 18 months ago and what changed: this reveals churn, pivots, and organizational instability that LinkedIn cannot show
- For roles with equity: "What is the most recent 409A valuation, and when was it set?" is a legitimate question that signals financial literacy, not greediness

### User Is Interviewing for a Fully Remote Role

Remote roles have a distinct category of operational questions that on-site candidates never need:
- "How does the company build social connection and prevent isolation for remote employees specifically -- not just for hybrid workers?"
- "How are remote employees evaluated relative to in-office employees in terms of visibility and promotion opportunity?"
- "What does the team do to maintain psychological safety when everything is text-based and tone is hard to read?"
- "What was the hardest thing about transitioning this team to remote, and has it been fully resolved?"
- "When you need to resolve a complex disagreement quickly, what does that process look like when you cannot just walk to someone's desk?"
- These questions signal that the user has thought deeply about remote work challenges, not just that they want to avoid a commute

### User Is a Senior or Executive Candidate (Staff / Principal / Director / VP+)

Senior candidates are evaluated on judgment and strategic scope, not just curiosity. Their questions must reflect this.
- Generic questions about "day-to-day" work signal a mismatch with seniority expectations
- Include questions about organizational influence: "How does engineering leadership interface with the board or investors on technical strategy?"
- Include questions about team-building authority: "What would my scope of hiring authority look like in the first six months?"
- Include questions about change management: "What is the last major process or structural change this team went through, and how was it handled?"
- Include explicit questions about the mandate: "What is the problem you are hiring someone at this level to solve that you could not solve with someone more junior?"
- Questions about career growth are less relevant -- shift this budget toward organizational health, strategic direction, and leadership culture

### User Has a Specific Concern or Red Flag They Want to Probe

Sometimes the user has seen something -- a Glassdoor pattern, a LinkedIn showing high turnover, a news item about layoffs, a JD that has been posted for 6 months -- and wants to probe it without sounding accusatory.
- Teach the user the "soft probe" technique: turn the concern into a curiosity question that gets the same information without the confrontational framing
  - Concern: "This role has been open for 6 months" → Question: "What has your search process looked like for this role, and what has made it a unique search?"
  - Concern: "Glassdoor reviews mention micromanagement" → Question: "How would your current team describe your management style? What do they say you do well and where do they push you to grow?"
  - Concern: "High turnover on LinkedIn" → Question: "How has the team composition changed in the past 18 months, and what drove those changes?"
- Red flags that cannot be probed softly should be raised directly: "I noticed this role has been reposted several times -- can you help me understand what happened with prior candidates?" This is appropriate and professional for mid-to-late rounds.

### User Is Interviewing for a Role That Is a Significant Stretch (Promotion-Level)

When the user is reaching up a level, their questions need to signal readiness for that level without overreaching.
- Ask questions that demonstrate awareness of scope increase: "What aspects of this role would represent the largest growth edge for someone coming from [current level]?"
- Ask about the support structure for someone coming in at this level: "What does the first 90-day ramp look like, and what resources are available if I identify a gap in my experience?"
- Avoid asking questions that implicitly acknowledge unreadiness: "Is it okay if I take some time to learn X?" -- this undermines the stretch narrative
- Ask about how the team thinks about developing leaders from within: this shows long-term thinking appropriate to the higher level

---

## Example

**Input:**
"I'm interviewing for a Senior Product Manager role at a Series C SaaS company that sells workflow automation software to mid-market companies. The interview is with the VP of Product (hiring manager). I've already had a first-round phone screen with the recruiter. My top priorities are quality of management, growth into a Director role within 2-3 years, and working on a product with genuine market traction. The JD mentions working closely with enterprise sales, driving roadmap prioritization, and owning the OKR process for the product team."

---

**Output:**

## Interview Questions Bank: Senior Product Manager at [Series C SaaS Company]

**Interviewer:** VP of Product (Hiring Manager)
**Interview Stage:** Second round (first with VP, following recruiter phone screen)
**User's Top Priorities:** Quality of management, growth to Director within 2-3 years, product with genuine market traction
**Total Questions Generated:** 19

---

### Top 5 Priority Questions
*(Ranked by Information Yield + Signal Sent + Uniqueness, max 15)*

| Rank | Score | Question | Category | Why It's Strong | Best Asked To |
|------|-------|----------|----------|-----------------|---------------|
| 1 | 14/15 | "When you think about the best PM you've managed in the past three years -- not necessarily the most experienced, but the one who grew the most -- what made them exceptional, and what did you do to enable that?" | Manager Relationship | Directly tests management quality, the user's top priority. Forces the VP to reveal their actual approach to developing talent rather than giving a rehearsed answer. The question is rare enough that a strong answer is meaningfully predictive. | VP of Product |
| 2 | 13/15 | "The JD mentions the Senior PM will own the OKR process for the product team. Can you walk me through what that looked like last quarter -- who set the OKRs, how they were graded, and what changed as a result?" | Role Reality | Anchors to specific JD language. Distinguishes whether "owning the OKR process" means running a meaningful strategic exercise or filling out a spreadsheet. Reveals how empowered vs. ceremonial the role actually is. | VP of Product |
| 3 | 13/15 | "What does the path from Senior PM to Director of Product look like here concretely -- are there people who have made that transition in the past two years, and what did it take?" | Growth Trajectory | Addresses user's top priority of director-level growth. Forces a specific, named-example answer rather than a generic "we promote from within" response. Time-bounds it to two years so the VP cannot point to ancient history. | VP of Product |
| 4 | 12/15 | "How does the product team navigate roadmap prioritization when enterprise sales brings in a deal that requires features the roadmap does not currently include?" | Role Reality | Directly targets the tension between sales-driven feature requests and product strategy -- the single most common friction point for PMs in sales-led SaaS companies. Signals that the user understands this dynamic. The answer reveals whether PMs have real authority or are order-takers. | VP of Product |
| 5 | 12/15 | "What is the one thing about working with you as a manager that I would only know after working with you for six months -- something that is not visible in an interview?" | Manager Relationship | Unusual enough to be memorable. Signals emotional intelligence and genuine interest in the management relationship. Forces the VP to demonstrate self-awareness, which is itself a data point about their quality as a manager. | VP of Product |

---

### Full Question Bank

#### Category 1: Role Reality

1. "The JD mentions owning the OKR process for the product team. Can you walk me through what that looked like last quarter -- who set the OKRs, how they were graded, and what changed as a result?"
   - Reveals: Whether OKRs are strategic tools or bureaucratic theater; how much autonomy the PM actually has in shaping direction
   - Red flag answer: "We use OKRs but we're still figuring out how to make them work" or vague answers about alignment without specifics
   - Green flag answer: A specific example of an OKR that changed team behavior, with honest grading and a clear ownership model

2. "What does a typical roadmap planning cycle look like here -- who has input, who makes the final call, and what happens when there is genuine disagreement?"
   - Reveals: Whether product has real roadmap authority or is a synthesis layer for sales and engineering requests
   - Red flag answer: "It's very collaborative" with no description of decision rights or conflict resolution
   - Green flag answer: Clear description of who inputs what, how tradeoffs are made, and at least one example of a disagreement that was resolved explicitly

3. "What happened to the person who was in this role before? Are they still at the company?"
   - Reveals: Whether the role has a history of churn, what caused the opening, and whether there is a pattern worth understanding
   - Red flag answer: Evasiveness, a sudden pivot to "we're growing so fast we need more people" without directly answering
   - Green flag answer: An honest account: promoted, left for another company, role restructured -- with a clear explanation

4. "What is the most significant product decision made in the past six months that you wish had gone differently, and what did the team learn from it?"
   - Reveals: Psychological safety, honesty about failure, whether the team has a learning culture vs. a blame-avoidance culture
   - Red flag answer: "Things have gone really well, I can't think of a major mistake" -- this is almost certainly false and signals defensiveness
   - Green flag answer: A specific example with genuine introspection about what changed afterward

5. "The role mentions working closely with enterprise sales. What does that collaboration look like in practice -- what does sales ask for most often, and how does the PM team respond?"
   - Reveals: Whether the PM role is customer-centric or sales-captive; how much strategic agency the team has vs. building to close deals
   - Red flag answer: "Sales is a key partner and we try to accommodate their needs" -- suggests order-taking
   - Green flag answer: Description of a framework for evaluating sales-driven requests with clear criteria for when the roadmap bends and when it does not

6. "If I joined and genuinely exceeded your expectations in the first six months -- not just met them, but genuinely exceeded them -- what would that look like to you in concrete terms?"
   - Reveals: What the VP actually values in PM performance beyond generic output metrics; surfaces unstated priorities that the JD did not capture
   - Red flag answer: Generic answers like "hit your OKRs and build good relationships" without specifics
   - Green flag answer: Concrete behavioral or output descriptions -- "You would have run at least two discovery cycles with customers, built a credible 12-month narrative the engineering team trusts, and reduced the volume of ad hoc sales escalations by at least 20%"

#### Category 2: Team Dynamics

7. "How does the product team handle a situation where engineering pushes back hard on a roadmap item -- either technically or because they disagree with the prioritization?"
   - Reveals: Whether PMs have the authority to make the call or whether engineering effectively veto roadmap decisions; signals power dynamics
   - Red flag answer: "We are very collaborative and always find alignment" without describing what happens when alignment does not emerge naturally
   - Green flag answer: A specific example of productive tension with a clear account of how it was resolved and who made the final call

8. "How has the composition of the product team changed in the past 18 months -- has it grown, contracted, or restructured?"
   - Reveals: Investment trajectory in product, whether there has been turnover that would indicate dysfunction, how the team is scaled relative to engineering and sales
   - Red flag answer: Significant unexplained changes, defensive framing, reluctance to discuss specifics
   - Green flag answer: Clear account of growth or change with rationale tied to company priorities

9. "What is the team's communication norm for async vs. synchronous work -- and how does that actually play out when there is urgency?"
   - Reveals: Meeting culture, whether the team has thought deliberately about communication, whether "async-first" is real or aspirational
   - Red flag answer: "We have a lot of syncs but we're trying to reduce them" -- chronic meeting overload, no real system
   - Green flag answer: Described norms with explicit examples: "We default to Slack threads and document decisions in Notion, syncs are for alignment not information transfer, and for urgent issues we have a defined escalation path"

10. "What does the product team do when a sprint is clearly going off the rails -- too much scope, an engineering blocker, or a reprioritization from leadership?"
    - Reveals: How the team handles pressure and change, whether PMs are expected to absorb chaos silently or to escalate and renegotiate
    - Red flag answer: "We're pretty scrappy and figure it out" without any description of process -- suggests reactive, chaotic environment
    - Green flag answer: A described process with real examples of how a specific situation was handled, including stakeholder communication

#### Category 3: Manager Relationship

11. "When you think about the best PM you have managed in the past three years -- not necessarily the most experienced, but the one who grew the most -- what made them exceptional, and what did you do to enable that?"
    - Reveals: Whether the VP is a true developer of talent or primarily rewards self-sufficiency; what kind of management investment the user can expect
    - Red flag answer: Describes a PM who was exceptional because they "just figured things out" -- signals the VP does not see themselves as responsible for developing their reports
    - Green flag answer: Specific behaviors the VP exhibited -- regular 1:1s with structured development conversations, specific feedback moments, advocacy for the PM's promotion, stretch assignments with a safety net

12. "How do you prefer to give feedback -- in the moment, in structured 1:1s, in writing? And how has your approach evolved over time?"
    - Reveals: Feedback culture directly, whether the manager is self-aware about their style, and whether feedback delivery matches the user's own preferences
    - Red flag answer: "I give feedback whenever it is needed" -- vague and suggests ad hoc delivery that often means feedback is withheld until reviews
    - Green flag answer: Specific description of a cadence and format, ideally with acknowledgment of how they calibrate to each report's preferences

13. "What is the one thing about working with you as a manager that I would only know after working with you for six months?"
    - Reveals: Self-awareness, honesty about management style, and whether the VP is willing to be vulnerable in an interview context (strong positive signal)
    - Red flag answer: "I am very direct and some people find that hard" -- generic answer that is simultaneously a brag; low information content
    - Green flag answer: A genuinely specific trait with self-awareness -- "I tend to go deep on strategy and sometimes give my PMs less space than they need to form their own views first. I have been working on asking more questions before sharing my perspective."

14. "When you disagree with a decision made above you that you need to implement -- how do you handle that with your team?"
    - Reveals: Political courage, transparency, whether the VP will be a buffer for the user or a conduit for pressure from above
    - Red flag answer: "I support whatever the company decides and communicate it clearly" -- suggests top-down loyalty over team advocacy
    - Green flag answer: Describes a real example of expressing disagreement through proper channels, explaining the rationale to the team honestly, and following through even while being transparent about their own view

#### Category 4: Growth Trajectory

15. "Is there someone on the current product team who came in at Senior PM level and has been promoted to Director -- and if so, what did that look like in terms of timeline and what they demonstrated?"
    - Reveals: Whether Director-level growth is real or aspirational at this company; what the actual proof points are vs. what the JD promises
    - Red flag answer: "We don't have anyone at that exact trajectory but it's definitely possible here" -- absence of concrete examples means the path does not yet exist
    - Green flag answer: A named trajectory (anonymized is fine) with a realistic timeline and specific capability markers that triggered the promotion

16. "What skills or capabilities are explicitly rewarded for advancement here beyond Senior PM -- and which ones are necessary but not sufficient?"
    - Reveals: The explicit vs. implicit criteria for promotion; whether the company has a thoughtful growth framework or promotes opportunistically
    - Red flag answer: Generic "leadership and results" framing without distinguishing necessary from differentiating skills
    - Green flag answer: Specific capability list with clear prioritization -- "Roadmap narrative and stakeholder influence are table stakes. What gets someone to Director here is demonstrated ability to multiply other PMs and influence cross-functionally without authority."

17. "What does the 18-month hiring plan look like for the product team -- are you planning to grow, hold steady, or restructure?"
    - Reveals: Whether this is an expanding domain the user can grow into or a team that will stay flat; headcount growth predicts leadership opportunity
    - Red flag answer: Evasiveness about hiring plans, unusual for a Series C company that should have at least directional plans
    - Green flag answer: Clear growth trajectory tied to company milestones -- "We are planning to double the PM team as we move upmarket, which is part of why this hire is strategic"

#### Category 5: Company Health and Direction

18. "What is the company's current path to its next milestone -- whether that is profitability, Series D, or a specific ARR target -- and how central is this product area to reaching it?"
    - Reveals: Company financial health and the strategic importance of this team; whether the user is joining a core product line or a side bet
    - Red flag answer: Deflection or vagueness about financial trajectory at Series C, where there should be clear internal alignment on milestones
    - Green flag answer: Honest description of the milestone, timeline, and this team's role in reaching it -- "We are targeting $50M ARR to make Series D economics work, and workflow automation is our highest expansion revenue driver, so this team is directly on the critical path"

19. "What is the most significant thing the company has learned about its mid-market customers in the past 12 months that changed how the product team thinks?"
    - Reveals: Whether the company is genuinely customer-driven, how quickly insights translate to product direction, and whether the VP engages with customer research directly
    - Red flag answer: Generic "we are customer-centric" framing without a specific insight or behavioral change
    - Green flag answer: A specific customer learning -- "We learned that our automation builder was being used primarily by operations managers, not IT, which fundamentally changed how we designed the no-code experience and what we prioritize in Q3"

---

### Decision-Quality Questions
*(Use in final round or when evaluating whether to accept an offer)*

- "If I were to speak with someone who left the product team in the past year, what do you think they would say was the hardest part of working here?" -- What it helps you decide: Whether leadership has honest self-awareness about the team's weaknesses; the answer reveals more in the VP's hesitation than in the words themselves
- "What would have to change at this company for you personally to consider leaving?" -- What it helps you decide: How committed senior leadership is and what their breaking points are; signals whether the culture is stable or fragile
- "Is there anything about the scope, reporting structure, or strategic direction of this role that is currently being worked out that I should be aware of?" -- What it helps you decide: Whether the role is fully defined or still being negotiated internally -- a common red flag at Series C companies in growth mode
- "What is the company's honest assessment of its biggest competitive vulnerability right now?" -- What it helps you decide: Whether leadership thinks clearly about existential risk; the quality of the answer reflects strategic maturity

---

### Questions by Interviewer Type

| Interviewer Type | Ask These Numbers | Avoid These |
|-----------------|-------------------|-------------|
| HR / Recruiter (already completed) | N/A -- round complete | N/A |
| VP of Product (this round) | Q1-Q19, prioritize Q1, Q2, Q3, Q4, Q5 | Benefits/logistics (already covered with recruiter), technical architecture detail |
| Peer PM (if applicable in later round) | Q7, Q8, Q9, Q10, Q13 (reframed from their perspective) | Q18 (financial strategy), Q14 (VP loyalty question), promotion criteria they may not know |
| Engineering Lead (if cross-functional round) | Q4, Q7 (engineering version), Q9 | Q11-Q14 (manager relationship questions for their manager), Q18 |
| C-level Executive | Q18, Q19, decision-quality questions | Q1-Q6 (too tactical for this audience), Q11-Q14 (not their scope) |

---

### Questions to Avoid in This Interview

| Question to Avoid | Why It Hurts | Better Alternative |
|-------------------|--------------|-------------------|
| "What is the company culture like?" | The most generic PM interview question asked; signals no preparation and yields a rehearsed, non-informative answer | "What is the one aspect of how this team works that is genuinely different from how most product teams operate?" |
| "Is there work-life balance here?" | Signals apprehension and invites a PR answer; also already answered by recruiter in phone screen | "What does the team do when a product launch creates an extended crunch period -- and how frequently does that happen?" |
| "What does the company's tech stack look like?" | You are a PM, not an engineer; this question signals role confusion at the Senior level unless the JD specifically requires technical depth | "What is the level of technical depth the PM team is expected to have, and how does that interface with the engineering team's autonomy?" |
| "Do you have a learning and development budget?" | Low-information question that signals you are asking about perks rather than growth | "Can you give me an example of someone on the team who pursued a specific development goal in the past year -- what did that look like in practice?" |
| "What does the product roadmap look like for the next year?" | Often confidential; puts the VP in an awkward position; reveals nothing about whether this is a good environment for you | "What is the biggest unsolved strategic question on the roadmap right now -- the one the team is most actively debating?" |

---

### Personalization Reminders

- Replace [Series C SaaS Company] with the actual company name in your notes
- Before the interview, research the VP of Product on LinkedIn -- if they have written posts or articles, reference one in a question
- If the company has published any customer case studies or press releases about product milestones, work a specific reference into Q19
- If the recruiter phone screen revealed specific details (team size, recent product launches, upcoming initiatives), build those into Q2 and Q7 using the "In the first conversation I heard that..." framing
- Q18 will land better if you have a rough sense of the company's ARR or recent funding details from public sources -- tailor the milestone language accordingly
