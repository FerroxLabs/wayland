---
name: recruiter-outreach
description: |
  Writes a LinkedIn message or email to a recruiter that clearly communicates the
  user's target role, availability, and key qualifications in a concise format
  optimized for recruiter workflows. Produces ready-to-send message text. Use when
  the user wants to message a recruiter, respond to a recruiter's outreach, or
  proactively connect with recruiters in their field. Do NOT use for cold emails
  to hiring managers (use cold-outreach-email), networking or informational
  interview messages (use networking-message-writer), or LinkedIn profile writing
  (use linkedin-summary-writer).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "linkedin career writing template"
  category: "career-development"
  subcategory: "job-search"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Recruiter Outreach Message

## When to Use

**Use this skill when the user:**
- Wants to send a proactive first-contact message to a recruiter they discovered on LinkedIn, at a networking event, or through a referral
- Received an inbound recruiter message (LinkedIn InMail, connection request, or email) and wants to reply strategically -- either to advance, qualify, or politely decline
- Wants to re-engage a recruiter they worked with in the past, whether or not that engagement led to a placement
- Is returning to the job market after a gap (parental leave, layoff, sabbatical, health leave) and needs framing that handles the gap proactively
- Wants to cold-connect with a recruiter at a specific staffing agency or executive search firm that specializes in their field
- Received a generic mass-recruiter blast and wants to reply in a way that signals genuine interest while filtering for role fit
- Has already applied to a role and wants to message the recruiter attached to that posting to reinforce their candidacy

**Do NOT use this skill when:**
- The user wants to message a hiring manager, department head, or team lead directly about an open role -- use `cold-outreach-email` instead, which handles the different power dynamics and messaging style required for hiring authority contacts
- The user wants to schedule an informational interview or build a genuine professional relationship without a specific role in mind -- use `networking-message-writer`, which emphasizes curiosity and expertise exchange rather than candidate qualification
- The user needs their LinkedIn profile, headline, or About section written or rewritten -- use `linkedin-summary-writer` or `linkedin-headline-optimizer`, which address the passive discoverability layer
- The user needs a thank-you message after a recruiter-arranged interview -- use `thank-you-email-writer`, which handles post-interview relationship maintenance
- The user wants to write a cover letter to attach to a recruiter submission -- use `cover-letter-writer`
- The user wants to negotiate a job offer that arrived through a recruiter -- use `offer-negotiation-script`

---

## Process

### Step 1: Identify the Outreach Scenario and Recruiter Type

These two variables change almost everything about message structure, emphasis, and qualifying questions.

**Outreach scenario -- determine which one applies:**
- **Proactive outreach:** User is initiating contact. There is no existing relationship and no prior message to respond to.
- **Response to recruiter inbound:** A recruiter messaged the user first. The recruiter already has a role in mind.
- **Reconnecting after prior relationship:** User and recruiter worked together before. Context and rapport exist.
- **Applied + messaging the attached recruiter:** User submitted an application and wants to reinforce it by reaching out to the recruiter listed on the posting.

**Recruiter type -- determine which one applies:**
- **Agency/contingency recruiter:** Works at a staffing or recruiting firm (e.g., a tech staffing firm, an executive search boutique). Earns a fee (typically 15--25% of first-year salary) only when a placement is made. Represents candidates across multiple client companies. Motivated to find the candidate multiple opportunities. The message should acknowledge their specialization, make it easy for them to pitch the candidate, and ask what's currently on their desk.
- **Retained/executive search recruiter:** Works on exclusive, high-fee engagements for senior roles (VP, C-suite, Partner-level). Typically reached through referral. Less volume-driven than contingency. The message should emphasize fit with a specific mandate and signal strategic thinking.
- **In-house/corporate recruiter:** Works directly for one company. Only fills roles at that company. The message should align with the company's known priorities, culture signals, or recent announcements rather than generic candidate pitch language.
- **RPO recruiter:** Works as an outsourced recruiter embedded in a company -- often indistinguishable from in-house. Treat them like an in-house recruiter unless told otherwise.

### Step 2: Gather the Required Information

Ask for the following before writing. If the user has provided a prior message from the recruiter, extract what can be inferred rather than asking redundantly.

**Always required:**
- Recruiter's name and whether they are agency, in-house, or executive search
- User's current job title and target job title (these may differ)
- Years of total relevant experience
- The one to three most recruiter-legible qualifications (skills, certifications, industries, or tools that recruiters in this field actually use as search filters)
- Location preference: remote only, hybrid (with or without location constraint), on-site, and any geographic constraints
- Availability to start: immediately, standard two weeks, specific date, or "passively looking"

**Required for responses to inbound recruiter messages:**
- The original recruiter message (paste it in)
- Whether the user is interested in the role/company described, unsure, or definitely not interested

**Situationally required:**
- For reconnecting: when they last spoke, what role was discussed, and what the outcome was
- For applied + reinforcing: the job title and company name from the application
- For executive search context: current compensation level (helps calibrate message register)

**Never ask for unless the user volunteers it:**
- Salary expectations in proactive outreach (always let the recruiter reveal the range first)
- Reason for leaving current role (irrelevant in initial contact)

### Step 3: Apply Message Architecture by Scenario

Each scenario has a distinct four-sentence architecture. Stick to it. Padding reduces response rates.

**Proactive outreach (agency recruiter):**
1. Why this recruiter specifically -- reference their specialization, firm, or a shared connection. Never say "I came across your profile" without adding a specific reason. "I noticed your firm places engineers at Series B and C fintech companies" is specific. "I found you on LinkedIn" is not.
2. Your recruiter-legible headline: [Current title] with [X years] in [field/skill/industry].
3. What you are targeting: role type, company stage or size if relevant, location preference.
4. Availability and a single clear ask -- typically "Do you have roles on your desk that might be a match?" or "Would it make sense to connect for 15 minutes?"

**Proactive outreach (in-house recruiter):**
1. Why this company specifically -- reference a product launch, funding announcement, growth signal, or cultural signal. Generic company flattery ("I've long admired your company") is worse than no context.
2. Your recruiter-legible headline with a specific connection to what the company does or needs.
3. What role type you are targeting at this company.
4. Ask for the next step -- typically "Are there openings on the [team name] team I should apply to?" or "Would you be open to a brief conversation about fit?"

**Response to recruiter inbound -- interested:**
1. Thank them and confirm which specific role or company caught your attention (signal that you read their message, not just replied to it).
2. Confirm the most relevant qualification match in one sentence.
3. Ask the single most important qualifying question before investing further time. Priority order: (a) compensation range, (b) remote/hybrid/on-site policy, (c) visa sponsorship if applicable, (d) timeline, (e) team structure. Ask only one.
4. Offer your resume and suggest a call on specific days/times or with a Calendly link.

**Response to recruiter inbound -- not interested in this specific role but open to others:**
1. Thank them and specify why this particular role is not quite right (too senior/junior, wrong industry, wrong location, wrong stack).
2. Describe what you are actually looking for in one precise sentence.
3. Ask if they have or anticipate roles that match that profile.
4. Offer to share your resume for their files.

**Response to recruiter inbound -- politely declining:**
1. Thank them genuinely -- do not be curt.
2. Briefly explain why (not a fit, not looking, already in process elsewhere -- no detail required).
3. Keep the door open for future contact with one specific signal about what would be relevant later.

**Reconnecting:**
1. Anchor the prior relationship: reference the role discussed, the company, or the timeframe.
2. What has changed since then: new title, new skills, new target, new availability.
3. Current target criteria in one sentence.
4. Ask if they have relevant openings or if it would be worth a quick call to reconnect.

**Applied + reinforcing:**
1. Reference the specific application: role title, company, approximate application date.
2. Headline qualification match in one sentence -- mirror the language from the job posting if possible.
3. Express genuine interest in the role, not just the job search process.
4. Ask if they can confirm receipt of the application or flag it -- avoid asking to "jump the queue," which reads as presumptuous.

### Step 4: Apply Recruiter Workflow Optimization

Recruiters in high-volume environments (agency, corporate tech, healthcare staffing) process 50--200+ messages per day. Messages that do not answer "Can I place this person?" within five seconds get skipped.

**Length constraints -- enforce these:**
- LinkedIn connection request note: 300 characters maximum (hard platform limit)
- LinkedIn message to existing connection: 100 words or fewer
- LinkedIn InMail (paid, to non-connection): 150 words or fewer -- InMail is higher effort for the recruiter to send, so slightly more warmth is acceptable
- Email to recruiter: 125--175 words maximum -- email permits slightly more structure but not more information
- Follow-up message (any platform): 40--60 words maximum

**Structural rules:**
- Never open with "My name is" -- that information is visible in the sender field on every platform
- Never open with "I hope this message finds you well" or any variant -- recruiter attention is finite and professional niceties consume it
- Lead with the recruiter-relevant credential: title + years + one defining skill or domain. "Senior Product Manager with 9 years in B2B SaaS" answers the recruiter's first question immediately.
- Never use bullet points in LinkedIn messages -- it looks like a resume paste and signals low personalization
- Include the geographic qualifier every time, even for remote roles: "open to fully remote" is specific, "flexible on location" is ambiguous
- Availability to start is a mandatory qualifier -- recruiters need it to assess urgency and manage client timelines

### Step 5: Write the Connection Request Note (LinkedIn Proactive Only)

The connection request note is often the first thing a recruiter reads and must function as a complete mini-pitch within 300 characters.

**Formula:** [Current title] | [X years] in [domain/skill]. Exploring [target role type] -- [remote/hybrid/location]. Your [specific thing about their specialization or firm] caught my attention. Would appreciate connecting.

**Character counting:** Count carefully. 300 characters is approximately 45--55 words depending on word length. When in doubt, trim the least differentiating phrase first.

**When NOT to include a connection request note:** If the recruiter has already sent a connection request (meaning they want to connect with the user), skip the note and go straight to the message.

### Step 6: Draft the Follow-Up Message

Write one follow-up message to be sent exactly 7 business days after the original message with no response. Do not write a second follow-up -- two unreturned messages signals that this recruiter is not actively working on relevant roles, is no longer at the firm, or has moved the candidate to inactive.

**Follow-up formula:**
- Sentence 1: Brief re-anchor ("Following up on my note from last week about [target role type] opportunities.")
- Sentence 2: One new piece of information or differentiation -- a recent project completion, a certification, a specific skill the market values, or a narrowed timeline
- Sentence 3: Single light ask ("Let me know if anything comes across your desk.")

**Never write:**** "I just wanted to check in" -- this adds no information and signals low confidence. Always include something new.

### Step 7: Produce the Complete Output

Format the output according to the Output Format section below. Include all components: the ready-to-send message, the word/character count, platform annotation, the key information table, the connection request note (if LinkedIn proactive), and the follow-up message.

After producing the output, add a brief "Recruiter Workflow Note" that explains one tactical choice made in the message so the user understands the reasoning and can make informed adjustments.

---

## Output Format

```
## Recruiter Message: [Scenario Type] | [Platform]

### Message

[Complete, ready-to-send message text -- formatted for the platform, no placeholder brackets remaining]

**Word count:** [X] / [platform limit]
**Platform:** [LinkedIn message / LinkedIn InMail / LinkedIn connection request / Email]
**Recruiter type:** [Agency | In-house | Executive search | RPO]

---

### Connection Request Note (LinkedIn proactive outreach only)

[Complete connection request note text]

**Character count:** [X] / 300

---

### Key Information Included

| Element                | What Was Communicated                          | Why It Matters to a Recruiter                          |
|------------------------|------------------------------------------------|--------------------------------------------------------|
| Target role            | [Title and seniority level]                    | Lets the recruiter search their open reqs immediately  |
| Core qualification     | [Primary credential: title + years + skill]    | The primary candidate qualifier                        |
| Location preference    | [Remote / Hybrid / On-site / City]             | Determines geographic match before any conversation    |
| Availability           | [Timeline to start]                            | Helps recruiter assess urgency and client timeline fit |
| Recruiter personalization | [What was referenced about this recruiter]  | Signals non-mass-blast and increases response rate     |
| Ask                    | [The single question or action requested]      | Removes ambiguity about next step                      |

---

### Follow-Up Message (send after 7 business days with no response)

[Complete follow-up message text]

**Word count:** [X] / 60

---

### Recruiter Workflow Note

[1--2 sentences explaining one deliberate structural or tonal choice made in the message and why it serves the user's goal with this specific recruiter type]
```

---

## Rules

1. **Always produce a complete, ready-to-send message -- never produce tips, advice, or templates with blanks to fill in.** If the user has not provided enough information to personalize the message, ask specifically for what is missing before writing. A generic message is worse than no message.

2. **Enforce word count limits absolutely.** LinkedIn messages above 100 words and emails above 175 words have meaningfully lower recruiter response rates. If the user's qualifications require more context, cut the least differentiating information -- never expand the limit.

3. **Lead with the recruiter-legible credential every time.** The opening sentence must answer "Who is this person professionally?" within the first 10 words. Title + years + domain is the standard formula. Do not open with backstory, context-setting, or pleasantries.

4. **Distinguish between agency and in-house recruiter messaging.** Agency recruiters need to understand what the candidate is open to across multiple companies. In-house recruiters need to understand why this candidate wants this specific company. Conflating these produces messages that feel misaddressed.

5. **Include location preference and availability to start in every message, no exceptions.** These are the two fastest disqualifiers in recruiter workflows. A message that omits them forces a follow-up exchange, reducing the user's response rate.

6. **Ask exactly one question per message.** Multiple questions require multiple answers. Recruiters in high-volume environments answer the easiest one and move on, or answer none. Identify the single most important qualifier and ask only that.

7. **Never volunteer salary expectations in proactive outreach or in a first response.** Naming a number before the recruiter reveals the range either leaves money on the table (if the number is below the range) or triggers disqualification (if it exceeds the budget). If the recruiter asks first, provide a range (not a single number) anchored 10--15% above the user's true minimum acceptable compensation, with a qualifier: "depending on the full compensation structure."

8. **Never use "I am currently employed but open to new opportunities" or equivalents.** This phrase appears in an estimated 35% of recruiter cold messages sent by job seekers and is a signal of low effort. Describe the specific type of opportunity being sought instead.

9. **For responses to inbound recruiter messages, always reference the specific role or company mentioned.** Recruiters who send personalized messages can detect a non-response to their content instantly. Signal engagement by paraphrasing what they said before pivoting to your questions.

10. **Provide the follow-up message but make it explicit that this is the only follow-up.** Sending more than two messages to a non-responsive recruiter damages the sender's professional standing, can result in being flagged in ATS notes, and is definitively counterproductive. Two touches maximum.

11. **Never open with "My name is" on any platform.** The sender's name is visible in the message header on LinkedIn, in email clients, and in every InMail notification. Opening with a name introduction consumes prime reading real estate and signals unfamiliarity with professional communication norms.

12. **When the recruiter is from an executive search firm handling a retained search, increase the message register.** Executive search recruiters are evaluating candidates as strategic professionals, not just skill-matched resources. One sentence of strategic context -- a business outcome driven, a scope of responsibility, or a relevant industry development the candidate has navigated -- is appropriate and expected at this level.

---

## Edge Cases

### The Recruiter Sent a Generic Mass-Blast Message

Indicators: no specific role mentioned, vague language like "exciting opportunities in your field," no company name, or a message that could have been sent to any professional in the industry.

**Handling:** Reply with specificity that forces the recruiter to engage substantively or reveal they have nothing relevant. Structure: acknowledge the outreach, specify exactly what you are looking for (role title, company type, location, compensation range if the user is willing to share), and ask them to share a job description or role details if they have something that matches. This filters non-serious recruiters efficiently and educates serious ones about your precise target. Do not invest more than three sentences in responding to a mass blast.

**Example qualifier question:** "Could you share the job description and compensation range for the specific role you had in mind? I want to make sure it's worth your time and mine before we schedule a call."

### The User Has a Resume Gap

Gaps longer than three months often appear in recruiter database searches and can prompt qualification questions before a recruiter bothers to respond. Proactively addressing the gap in the message eliminates it as a barrier.

**Handling:** Add one clause at the most natural point in the message -- after stating the target role. Frame the gap as directional, not explanatory. Avoid over-explaining or apologizing. "Following a planned career break, I am now actively seeking..." or "After transitioning out of [situation] earlier this year, I am focused on returning to [target role type] in [domain]." If the gap involved skill-building (courses, consulting, open source contributions, caregiving), name it briefly: "I spent the past 14 months on a career transition, completing [specific certification] and contributing to [project type]."

**What NOT to do:** Do not lead with the gap explanation. Do not say "I took time off to figure out what I wanted" -- this is the recruiter's worst qualifier. Do not write "I know my resume shows a gap, but..." -- calling explicit attention to it before the recruiter has even seen the resume is counterproductive.

### The User Is Currently Employed and Passively Looking

A passively looking candidate is valuable to a recruiter because they are not desperate and are less likely to withdraw at the last moment. Frame this as an asset.

**Handling:** Use language that signals selectivity: "I am not actively searching, but I keep my eyes open for compelling opportunities in [domain]." Avoid "passively looking" as a phrase -- it has become recruiter shorthand for "maybe interested, low urgency" and reduces follow-through. Include a narrower target criteria than an active job seeker would, signaling that only a strong match would motivate a move. Do not volunteer your current employer's name unless there is a strategic reason to do so.

### The User Is Responding to a Recruiter for a Role That Is Clearly Not a Fit

The goal is to redirect without burning the relationship -- this recruiter may have relevant roles later.

**Handling:** Acknowledge the specific role with one sentence of genuine engagement (even if you are declining it, note one thing that was interesting about it), then redirect precisely to what you are actually looking for. Specificity here is critical: "I am focused on staff-level engineering roles at companies with fewer than 500 employees building developer tooling" gives the recruiter enough to flag the user for future relevant roles. Vague redirects ("not quite right for me right now") provide no actionable information and result in no future contact.

**Do not** apologize more than once, explain your reasoning at length, or offer unsolicited critique of why the role does not appeal to you.

### The Recruiter Is from an Executive Search / Retained Search Firm

The message register, content, and implied stakes are different from contingency staffing. Executive search recruiters are conducting high-discretion searches for roles that often are not publicly posted. A transactional message undermines the candidate's positioning.

**Handling:** Shift from "candidate pitching to recruiter" to "professional introduction between peers." Open with what you know about the firm's practice area or the type of mandates they handle. Lead your qualifications with a business outcome or scope statement rather than a skill list: "I have spent the past five years leading product strategy for a $400M ARR division, including two acquisitions." Ask about the type of mandates they are currently working on rather than "roles on your desk." If the user does not have a referral into the search firm, acknowledge that context briefly: "I reached out directly because [name of firm's] work in [practice area] is well-regarded in [industry]."

### The User Has Already Applied and Wants to Message the Recruiter Listed on the Posting

The key risk here is appearing to demand special treatment or to skip the application process, which can create friction with the recruiter rather than goodwill.

**Handling:** The message must make clear that the formal application has been submitted and the user is not asking to bypass the process. The goal is to signal genuine interest and make the application human. Structure: (1) reference the role by title and company and approximate application date, (2) lead with the credential that most directly mirrors the job requirements -- use language from the actual job posting to make ATS and human keyword matching easier, (3) express genuine interest in the specific team or problem the role addresses (not generic company admiration), (4) ask only whether the application was received or if there are any additional materials that would be helpful -- not "Can you move me forward?" which puts the recruiter in an awkward position.

### The User Wants to Reach Out to a Recruiter in a Field They Are Transitioning Into

Career changers face the additional challenge of translating non-obvious experience for recruiters who think in job title and keyword categories.

**Handling:** The message must do explicit translation work. Do not assume the recruiter will make the connection between the user's background and the target role. In one sentence, articulate the bridge: "My background is in clinical research coordination, but I have spent the past two years building process automation tools in Python and am now targeting data engineering roles -- specifically in healthcare data." This prevents the recruiter from disqualifying the candidate based on title alone before reading the message. Emphasize any credentials, projects, or employers that appear in the target field's lexicon. Avoid apologizing for the transition or framing it as a challenge -- frame it as a deliberate and well-informed move.

---

## Example

**Input:** "There's a recruiter named Sarah Chen at a staffing firm that places product managers at tech startups. I'm a Senior Product Manager with 8 years of experience, mostly in B2B SaaS. I've led three 0-to-1 product launches and I'm good at working with enterprise sales teams. I'm looking for a Director of Product or Head of Product role at a Series B or C company. I want to work remotely, maybe hybrid if it's in NYC or Boston. I can start in 4 weeks. I want to send her a LinkedIn message."

**Output:**

---

## Recruiter Message: Proactive Outreach | LinkedIn Message

### Message

Hi Sarah,

I noticed your firm specializes in product leadership placements at growth-stage tech companies -- that's exactly where I focus my search. I am a Senior PM with 8 years in B2B SaaS, including three 0-to-1 product launches and deep experience partnering with enterprise sales teams on complex deal cycles. I am targeting Director of Product or Head of Product roles at Series B and C companies, fully remote or hybrid in NYC or Boston, with availability in 4 weeks. Do you have any mandates on your desk that might be a match?

Best,
[Your Name]

**Word count:** 96 / 100
**Platform:** LinkedIn message
**Recruiter type:** Agency (contingency staffing, startup placement)

---

### Connection Request Note (LinkedIn)

Senior PM | 8 yrs B2B SaaS | 3 x 0-to-1 launches. Targeting Dir/Head of Product at Series B-C -- remote or hybrid NYC/BOS. Your startup PM focus caught my attention. Would value connecting.

**Character count:** 188 / 300

---

### Key Information Included

| Element                    | What Was Communicated                                              | Why It Matters to a Recruiter                                                   |
|----------------------------|--------------------------------------------------------------------|---------------------------------------------------------------------------------|
| Target role                | Director of Product or Head of Product                            | Recruiter can immediately search open reqs for these exact titles               |
| Company stage              | Series B and C                                                     | Filters out enterprise and early-stage roles that would not match               |
| Core qualification         | 8 years B2B SaaS, three 0-to-1 launches, enterprise sales partner | Three specific differentiators in under 15 words -- strong candidate signal     |
| Location preference        | Fully remote, or hybrid in NYC or Boston only                      | Clear geographic qualifier prevents placement mismatch                          |
| Availability               | 4 weeks                                                            | Tells recruiter this candidate can meet near-term client timelines              |
| Recruiter personalization  | Acknowledged firm's startup placement specialization               | Signals this is not a mass blast -- increases likelihood of personalized reply  |
| Ask                        | Single question: do you have matching mandates?                    | Gives recruiter one clear decision to make, reducing response friction          |

---

### Follow-Up Message (send after 7 business days with no response)

Hi Sarah, following up on my note from last week. I recently wrapped a major enterprise pricing feature launch that drove a 22% reduction in sales cycle length -- the kind of work I am looking to scale at a Series B or C company. Let me know if any Director or Head of Product mandates come across your desk.

**Word count:** 54 / 60

---

### Recruiter Workflow Note

The phrase "mandates on your desk" is intentional -- it is the language agency recruiters use internally for active client searches. Using it signals familiarity with how agency recruiting works, which increases the recruiter's confidence that this outreach is worth a reply. The follow-up message leads with a specific metric from a recent project rather than a generic check-in, giving Sarah a new data point to evaluate and a reason to engage even if she had no relevant roles when the original message arrived.
