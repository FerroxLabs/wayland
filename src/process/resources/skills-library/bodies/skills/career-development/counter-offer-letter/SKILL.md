---
name: counter-offer-letter
description: |
  Writes a complete counter-offer email stating the requested compensation figure,
  providing 2-3 supporting rationale points, and maintaining a positive collaborative
  tone. Produces a ready-to-send email.
  Use when the user wants to counter a job offer in writing, send a formal salary
  counter-proposal via email, or respond to an offer with a higher number and
  supporting rationale.
  Do NOT use for verbal negotiation scripts (use salary-negotiation-script), freelance
  proposals (use freelance-proposal-writer), or raise requests to a current employer
  (use salary-negotiation-script with raise scenario).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "salary-negotiation career email writing template"
  category: "career-development"
  subcategory: "career-growth"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Counter Offer Letter

## When to Use

**Use this skill when:**
- The user has received a formal or informal written job offer and wants to respond with a higher compensation request via email
- The user asks to draft a salary counter-proposal, negotiate a job offer in writing, or respond to an offer letter with modified terms
- The user wants to counter on a specific component of compensation -- base salary, signing bonus, equity, title, or benefits -- while accepting other components
- The user has received multiple offers simultaneously and wants to leverage one to counter another in writing
- The user needs to respond to an exploding offer (deadline-pressured) and wants a professional, concise written counter
- The user wants to counter after initial negotiations have stalled and a recruiter has asked for a final decision in writing

**Do NOT use when:**
- The user wants talking points for a live phone or in-person negotiation -- use `salary-negotiation-script` instead
- The user is a freelancer responding to a client project budget -- use `freelance-proposal-writer` instead
- The user wants to request a raise or promotion from their current employer -- use `salary-negotiation-script` with the raise scenario
- The user needs to decline an offer entirely -- a counter-offer email is not the right vehicle for a rejection
- The user wants to negotiate consulting rates or contract renewal terms -- scope and rate negotiation for contractors requires different framing
- The user is negotiating a severance package -- this requires legal-adjacent framing and different leverage principles
- The user has already verbally accepted an offer -- attempting to counter post-acceptance risks goodwill and can constitute a contract breach depending on jurisdiction

---

## Process

### Step 1: Gather All Compensation and Context Details

Before writing a single word, collect the complete picture. Missing one piece creates a weaker email.

- **The offered package in full:** base salary, annual bonus target (and whether discretionary or guaranteed), signing bonus, equity (RSUs, options -- grant amount, vesting schedule, strike price if options), health/dental/vision premium split, 401(k) match, PTO, remote work policy, start date flexibility
- **The counter position:** the exact dollar figure the user wants for base salary (a single number, never a range), plus any non-salary items they want to modify
- **Market data the user has:** sources such as Levels.fyi for tech roles, Radford/Mercer survey benchmarks often cited in recruiter conversations, Glassdoor, LinkedIn Salary, Bureau of Labor Statistics OES data, or competing offers -- note the source so it can be referenced in the email
- **Professional justifications available:** years of directly relevant experience, measurable achievements (revenue driven, cost saved, team size managed, uptime maintained), specialized skills or certifications that are scarce in the market, geographic relocation costs, total compensation they are leaving at their current employer (equity unvested, bonus timing, benefits differential)
- **The recipient:** name, title, and relationship to the offer (recruiter, HR business partner, hiring manager, or department head) -- the tone adjusts slightly depending on who is reading it
- **Timeline pressure:** whether there is a deadline on the offer and how many days remain
- **The user's BATNA (Best Alternative):** do they have a competing offer? Are they currently employed? This shapes how much leverage language is appropriate

### Step 2: Calculate the Correct Counter Number

The counter amount is not arbitrary. Use these anchoring principles:

- **The ideal counter range is 10--20% above the offer** for most professional roles. Below 10% signals low ambition and often settles below the user's true market value. Above 30% requires exceptional justification or a documented competing offer, and should trigger a recommendation for a phone call rather than email-only negotiation.
- **State one specific number, not a range.** If the user says "somewhere between $120K and $130K," anchor at $130K. Giving a range invites the employer to select the bottom of it -- a well-documented behavioral economics reality in negotiation (anchoring effect).
- **Account for total compensation, not just base.** If the offered equity is below market, calculate the delta and either fold it into the base ask or address it separately. Do not let a low equity grant get buried by focusing only on base.
- **Signing bonuses are often more flexible than base salary** because they hit budget once rather than compounding year over year. If the base ask seems to be hitting a ceiling (e.g., the user is being brought in below the midpoint of an established pay band), redirect part of the ask to a one-time signing bonus.
- **If the user is relocating**, the counter should factor in relocation costs. A $15,000 salary increase that doesn't cover a $25,000 relocation cost differential is a net loss.

### Step 3: Select and Rank the Justification Points

Every counter-offer email must include exactly 2--3 justification points. More than three dilutes the strongest arguments and reads as overexplaining. Fewer than two reads as unsupported assertion.

**Rank justification quality in this order (strongest to weakest):**

1. **Competing offer (strongest)** -- A documented dollar figure from another employer is the most powerful single data point in salary negotiation. Reference it factually and without aggression: "I'm currently evaluating an offer at $X for a comparable role."
2. **Verified market data** -- A specific salary range from a credible source (e.g., "The Radford Q3 survey shows the P50 for this role in [metro] is $X") outperforms vague claims of market rate.
3. **Quantified achievement** -- A concrete, dollar-denominated or percentage-denominated accomplishment directly relevant to the role ("led a product migration that reduced infrastructure costs by $400K annually" or "managed a $12M marketing budget with 140% ROAS").
4. **Specialized scarcity** -- A skill, certification, clearance, or domain expertise that is genuinely rare and directly required for the role (e.g., TS/SCI clearance, specific regulatory expertise, rare programming language proficiency in a niche but critical codebase).
5. **Total compensation differential** -- The verifiable gap between what the user is leaving and what is being offered, including unvested equity, guaranteed bonus, or benefits premium differential. ("My current employer has a $22,000 RSU tranche vesting in April that I would forfeit by joining before that date.")
6. **Years of directly relevant experience** -- Useful but the weakest standalone argument since it is universally claimed. Pair it with a quantified outcome to strengthen it.

**Never use as justification:**
- Personal financial needs (rent, debt, family obligations) -- these are irrelevant to market value
- "I feel I'm worth more" -- subjective and unverifiable
- Vague claims like "my experience is extensive" without specifics
- Comparisons to colleagues at the prospective company (salary compression arguments belong in raise negotiations, not offer negotiations)

### Step 4: Draft the Email Structure

Build the email in exactly this sequence. Each section has a purpose that must not be omitted or reordered:

**Subject Line:**
- Format: `[Role Title] Offer -- [Framing Word]`
- Framing words that work: "Compensation Discussion," "Proposed Adjustment," "Follow-Up," "Compensation Consideration"
- Avoid: "Negotiation," "Counter-Offer" (signals adversarialism), anything vague like "Quick Question"
- Example: `Senior Data Scientist Offer -- Compensation Discussion`

**Opening Paragraph (2--4 sentences):**
- Open with genuine, specific enthusiasm for the role or company -- not generic gratitude
- Reference something specific about the opportunity (the product, the team, a conversation point) to signal this is not a form letter
- End the paragraph before any compensation language appears -- do not mix enthusiasm and money in the same paragraph

**Counter Paragraph (4--6 sentences):**
- Begin with a transitional phrase that signals a shift without apology: "After reviewing the full offer..." or "As I considered the position more carefully..."
- State the specific counter number clearly and early in the paragraph
- Present each justification point in 1--2 sentences, most powerful first
- Do not hedge the number ("I was hoping for something around...") -- state it directly
- If referencing market data, cite the source type (survey data, competing offer, published range) without the need to hyperlink it

**Flexibility Paragraph (1--2 sentences, conditional):**
- Include only if the user is genuinely open to alternatives (signing bonus in lieu of base, extra equity, etc.)
- Frame openness as collaborative problem-solving: "I'm happy to discuss the full package structure if that helps find a path forward."
- Omit this paragraph if the user is firm on a specific number -- including it when the user is not flexible creates false expectations

**Closing Paragraph (2--3 sentences):**
- Reaffirm enthusiasm for the role specifically
- Propose a concrete next step: a phone call, a timeline, or a request for a response
- Close warmly but not obsequiously

**Total target length: 150--250 words.** Under 150 feels curt and underprepared. Over 250 signals anxiety, overexplaining, or lack of confidence. Brevity is a power signal.

### Step 5: Apply Tone Calibration

Tone is not just word choice -- it is strategic positioning. Apply these principles throughout the draft:

- **Lead with the relationship, not the transaction.** The reader should feel that the candidate values joining the team before they register the request for more money.
- **Use first-person singular, not second-person accusatory.** "I'd like to propose" instead of "You've offered below market." The problem is framed as a gap to bridge together, not a deficiency in the offer.
- **Avoid hedging language that weakens the ask:** "I was just wondering if maybe..." reduces perceived seniority. Use: "I'd like to propose" or "I'm hoping we can..."
- **Avoid hardball language that signals ultimatum:** "I cannot accept less than..." or "I have until Friday to respond to another offer and will need to take it if..." Both statements close doors that could remain open.
- **Match the formality level to the industry.** A counter-offer to a law firm or financial institution should be more formal than one to a Series B startup. Use the user's description of the company culture to calibrate.

### Step 6: Screen for Common Errors Before Delivering

Run the draft against this checklist before presenting it to the user:

- [ ] Does the email state a single specific number (not a range)?
- [ ] Does the opening paragraph contain no compensation language?
- [ ] Are there exactly 2--3 justification points, each in 1--2 sentences?
- [ ] Is the email free of personal financial need language?
- [ ] Is the email free of ultimatum or deadline-pressure language directed at the employer?
- [ ] Is the total word count between 150--250 words?
- [ ] Is the subject line professional and role-specific?
- [ ] Is the email addressed to the correct recipient (whoever extended the offer)?
- [ ] Does the closing include a specific proposed next step?
- [ ] If a competing offer is mentioned, is it stated factually without aggression?

### Step 7: Deliver the Email with Supporting Meta-Information

The output should be a complete, ready-to-send email -- not a template with blank fields the user must fill in. Additionally, provide the email stats block immediately below the email to help the user understand the strategic choices made, so they can confidently send or request adjustments.

- Provide the full email text, copy-ready
- Include the email stats block: word count, counter amount, justification points used, tone description, non-salary items mentioned
- If the counter is 25% or more above the offer, include a brief advisory note recommending a phone call supplement to the email
- If information was missing from the user's input (e.g., the specific city for market data), insert a bracketed placeholder with an instruction: `[your city -- used for market range reference]`

### Step 8: Offer Scenario Variants if Applicable

After delivering the primary email, offer to produce one of the following if contextually relevant:

- A **softer version** for cases where the offer has been described as "non-negotiable" -- reframes the counter as a question
- A **shorter version** for deadline-pressured situations (target: under 150 words)
- A **benefits-focused variant** if the base salary is acceptable but non-salary terms need negotiation
- A **follow-up email** if the initial counter has already been sent and the employer has responded with a counter-to-the-counter

---

## Output Format

```
## Counter-Offer Email

**To:** [Recipient full name, Title]
**From:** [User name]
**Subject:** [Role Title] Offer -- [Framing Descriptor]

---

[Complete email body -- ready to send, no unfilled brackets except for genuinely missing information]

---

**Email Stats:**
- Word count: [X] words
- Counter amount: $[X] (base salary) | $[X] signing bonus (if applicable) | [X equity change if applicable]
- Justification points used:
  1. [First point -- type and content]
  2. [Second point -- type and content]
  3. [Third point -- type and content, if used]
- Tone: [Descriptor -- e.g., "Enthusiastic and data-grounded" / "Transparent and collaborative" / "Formal and professional"]
- Non-salary items addressed: [None | List each item]
- Flexibility language included: [Yes / No]
- Recommended supplement: [None | "Consider a follow-up phone call given the gap size"]

---

**Strategic Notes (optional -- include if relevant):**
[1--3 sentences explaining any strategic choices, trade-offs, or suggestions for the user to consider before sending]
```

---

## Rules

1. **Always produce a complete, ready-to-send email -- never a template or general advice.** If critical information is missing (the counter number, the recipient's name), ask for it before writing. Do not write a half-formed email with "[INSERT YOUR NUMBER HERE]."

2. **State one specific counter number -- never a range.** If the user provides a range ("$120K to $130K"), anchor at the top of the range. Ranges give employers permission to select the bottom. This is supported by decades of anchoring research in behavioral economics.

3. **Include exactly 2--3 justification points.** Two is sufficient and focused. Three is the maximum for strategic impact. Four or more reads as overexplaining and reduces the perceived strength of each point. Rank them strongest first.

4. **The opening paragraph must contain zero compensation language.** Enthusiasm must precede the ask in every case. This is not a stylistic preference -- it is a sequencing rule that affects how the reader receives the request. An email that opens with money reads as mercenary; one that opens with genuine interest reads as a collaborative conversation.

5. **Never include personal financial hardship as justification.** Rent, student loans, family costs, lifestyle needs -- none of these are relevant to market value and all of them weaken perceived leverage. The only valid justifications are market data, professional accomplishments, competing offers, and compensation being forfeited by leaving a current role.

6. **Never include ultimatum language, explicit deadlines, or walk-away threats.** Phrases like "I'll need to accept the other offer if I don't hear back by Friday" or "I cannot accept below $X" close negotiation paths and create antagonism. If the user has a real deadline, acknowledge it softly: "I'm hoping we can finalize details before my response deadline."

7. **Keep the email between 150--250 words.** Under 150 reads as dismissive or underprepared. Over 250 reads as anxious, overexplaining, or uncertain. Brevity in negotiation is a confidence signal. Count the words and adjust if needed.

8. **If a competing offer is referenced, state it factually -- not as a threat.** "I'm currently evaluating an offer at $148,000 for a comparable role" is powerful. "I have a better offer and will take it if you don't match" is an ultimatum that backfires. The distinction is framing: transparency vs. coercion.

9. **Address the email to the person who extended the offer.** If a recruiter extended the offer, the counter goes to the recruiter -- even if the hiring manager will ultimately make the decision. Do not skip over the recruiter without the user's explicit instruction to do so.

10. **If the counter exceeds 25% above the offer, include a strategic advisory note** recommending the user also request a phone call to discuss. Large gaps are harder to close via asynchronous email alone, and a live conversation prevents the written counter from being rejected without dialogue. The email still gets sent -- but the user should know that a phone call supplement significantly increases success probability at this gap size.

11. **Never reference colleagues' salaries at the target company** as a negotiation argument in a first-round counter. Salary compression arguments (e.g., "I know your current engineers make X") are inappropriate for external negotiations, can create legal exposure for whoever disclosed the information, and signal that the candidate has access to confidential data.

12. **Always verify the subject line is professional, role-specific, and non-aggressive.** Subject lines containing "Counter-Offer," "Negotiation," "Demand," or anything emotionally loaded signal adversarialism before the email is opened. Use neutral, forward-looking language.

---

## Edge Cases

### The Offer Has Been Described as "Non-Negotiable"

This claim is almost never literally true -- it is usually a soft boundary or a recruiter's script. Treat it as a signal to use softer framing, not as a reason to abandon the counter entirely.

Draft the counter as a question rather than a statement: "I wanted to ask whether there's any flexibility on the base salary before I make my final decision." This approach respects the stated boundary while still making the ask. Companies that genuinely cannot move on base salary often have flexibility on signing bonuses, equity grants, start dates, or PTO -- so if the base truly cannot move, pivot to alternatives. The email should acknowledge the stated constraint ("I understand there may be limited flexibility on the base...") and then make a narrow, specific ask, rather than a broad counter.

### The Counter Is 25% or More Above the Offer

Large-gap counters require three adjustments: (1) the justification points must be exceptionally strong -- competing offer data or highly specific, quantified achievements rather than general experience claims; (2) the email should explicitly acknowledge the gap and frame it as a conversation-starter, not a take-it-or-leave-it position; (3) include a recommendation for a phone call. The written email gets the number on the table, but the real negotiation will happen on the phone. An email that asks for 30% more and includes no invitation for dialogue reads as aggressive and often results in a flat rejection rather than a counter-to-the-counter.

### The User Received a Verbal Offer Only (No Written Offer)

Do not write a counter-offer email until the user has the offer in writing. Instead, write a brief email requesting that the verbal offer be confirmed in writing: "Thank you for the verbal offer for [role]. Would you be able to send over the offer letter with the compensation details so I can review everything before formally responding?" Then hold the counter-offer email until the written offer arrives. Countering a verbal offer in writing before receiving a written offer creates ambiguity about what exactly is being countered and can cause confusion or friction.

### The User Has Already Verbally Accepted but Wants to Counter

This is a genuine risk scenario. Verbal acceptance can constitute a binding agreement in some jurisdictions, and walking it back -- even to negotiate -- risks damaging goodwill or triggering a rescission. Before writing anything, advise the user to consider whether the counter is worth the relational risk. If the user still wants to proceed, the email must acknowledge the prior acceptance directly: "I enthusiastically accepted your verbal offer, and I remain very excited about joining the team. Before the written offer is finalized, I wanted to revisit one element of the package..." This framing is more fragile than a standard counter and should be used sparingly. Do not omit the risk advisory.

### The User Wants to Counter on Multiple Non-Salary Items Only

When the base salary is acceptable but multiple benefits terms need adjustment, restructure the counter paragraph as a bulleted list of requests rather than a single ask. Each item should have its own one-sentence justification. Keep the total request list to three items maximum -- asking for four or more changes simultaneously reads as a laundry list and signals dissatisfaction with the offer overall, even if that is not the user's intent. If the user has more than three items, help them prioritize: ask which three matter most and set the others aside for a post-hire conversation.

### The User Is Countering After an Initial Counter Was Already Rejected

This is a second-round negotiation, and the dynamics differ. The user has already revealed their target number. A second written counter should be shorter (under 130 words), acknowledge the employer's response respectfully ("Thank you for considering my initial request and coming back to me"), and either accept the employer's counter-to-the-counter with one final ask or accept the offer. A third written counter is almost never appropriate -- at that point the user should either accept, decline, or request a phone call to find a creative solution. Write the second-round email as a closing move, not an opening bid.

### The User Is Countering Equity or Stock Compensation Specifically

Equity counters require additional specificity that base salary counters do not. Know the difference between the types before writing: RSUs (restricted stock units) are grants of company shares that vest over time -- counter on the total grant value or number of units; stock options require knowing the strike price and current 409A valuation to assess real value; profit interest units (PIUs) in private companies are less liquid and should be valued conservatively. When countering on equity, include the current-value calculation in the justification ("At the current 409A of $X per share, the four-year RSU grant represents $Y, compared to the $Z benchmark for this role at this level"). Never counter on equity using only vague language like "more equity" -- specify the unit count or grant value target.

### The User Mentions a Competing Offer at a Company They Do Not Actually Want

Help the user use the competing offer as leverage without making a commitment they do not intend to keep. The email should reference the competing offer factually without implying the user will definitely take it: "I'm currently evaluating another offer at $148,000" -- not "I'm planning to accept the $148,000 offer if we can't match it." This preserves the user's negotiating position without creating a hostage situation. If the user bluffs and the target company says "we can't match it, please take the other offer," the user has burned the bridge.

---

## Example

### Example 1 -- Standard Base Salary Counter with Market Data and Achievement

**User Input:** "I received an offer for $105,000 as a Product Marketing Manager at a SaaS company. I want to counter at $120,000. My justifications: I have 5 years of PMM experience at SaaS companies, I led a product launch that drove $3M in new ARR, and market data shows the P50 for this role in Austin is $115K-$125K according to Radford survey data. The offer came from the hiring manager, Jessica Torres."

**Compensation Analysis:**
- Offer: $105,000
- Counter: $120,000
- Gap: $15,000 / 14.3% above offer -- within standard 10--20% range, no large-gap advisory needed
- Justification ranking: Market data (Radford P50 range) -- strong; quantified achievement ($3M ARR) -- strong; years of relevant experience -- moderate, use as supporting layer not lead argument

**Output:**

```
## Counter-Offer Email

**To:** Jessica Torres, Hiring Manager
**From:** [User name]
**Subject:** Product Marketing Manager Offer -- Compensation Discussion

---

Hi Jessica,

Thank you so much for the offer to join the team as Product Marketing Manager. After our conversations about the product roadmap and the go-to-market challenges ahead, I'm genuinely excited -- this is the kind of work I do best, and I can see exactly where I'd make an impact.

After reviewing the full offer, I'd like to propose a base salary of $120,000. Radford survey data for Product Marketing Managers at my level places the P50 for this role in Austin between $115,000 and $125,000, putting the current offer below the midpoint for the market. Beyond the benchmark, I bring 5 years of SaaS-specific PMM experience and a track record of driving direct revenue results -- in my most recent role, I led a product launch that generated $3 million in new ARR, which is exactly the kind of commercial impact this position calls for.

I'm happy to discuss the broader package structure if that helps find the right path forward. Would you have time for a quick call this week?

Thank you again -- I'm very much looking forward to making this work.

Best regards,
[User name]

---

**Email Stats:**
- Word count: 193 words
- Counter amount: $120,000 base salary
- Justification points used:
  1. Market data -- Radford P50 for PMM in Austin is $115K--$125K; current offer is below midpoint
  2. Quantified achievement -- $3M new ARR generated from product launch in most recent role
  3. Relevant experience -- 5 years of SaaS-specific PMM experience (supporting layer)
- Tone: Enthusiastic and data-grounded
- Non-salary items addressed: None (open to package discussion)
- Flexibility language included: Yes
- Recommended supplement: None (14.3% gap is within standard range)

---

**Strategic Notes:**
The market data point leads because it is the most objective and hardest to dismiss. The $3M ARR achievement follows because it translates the experience claim into commercial value. The flexibility paragraph is included because the user indicated openness to broader package discussion, but it is deliberately brief to avoid signaling that the user will accept a non-cash substitute easily.
```

---

### Example 2 -- Benefits-Only Counter (PTO and Remote Work)

**User Input:** "I got an offer for $90,000 as a UX Designer at a healthcare tech company. The salary is fair for my market. But they only offer 10 days PTO and no remote work flexibility. I want to counter for 20 days PTO and at least 2 remote days per week. The recruiter is Tom Walsh."

**Compensation Analysis:**
- Base salary: $90,000 -- user is satisfied, no base counter
- Benefits gap: PTO at 10 days vs. 20 days requested (industry median for this seniority is 15--20 days); remote work -- 0 days vs. 2 days requested
- Structure note: Benefits-only counter -- the counter paragraph becomes a structured list of two specific requests, each with a brief justification

**Output:**

```
## Counter-Offer Email

**To:** Tom Walsh, Recruiter
**From:** [User name]
**Subject:** UX Designer Offer -- Benefits Discussion

---

Hi Tom,

Thank you for the offer to join the team as UX Designer. I've been excited about this role since our first conversation -- the intersection of healthcare and user experience is exactly where I want to be building, and the team's approach to patient-centered design really stood out.

The base salary of $90,000 works well for me. Before I confirm, I'd like to discuss two aspects of the benefits package:

- **PTO:** I'd like to request 20 days rather than 10. Both of my previous roles included 20 days of PTO, and sustained, high-quality design work -- especially in a healthcare context where design decisions are high-stakes -- benefits significantly from adequate recovery time.
- **Remote flexibility:** I'd like to ask about a hybrid schedule with 2 remote days per week. In my experience, deep-focus design work (wireframing, prototyping, user research synthesis) benefits from uninterrupted time, which I'm most productive with at home.

I'm flexible on the specifics and happy to discuss what fits the team's structure. Would you have time for a brief call this week?

Thanks again -- I'm looking forward to working this out.

Best regards,
[User name]

---

**Email Stats:**
- Word count: 196 words
- Counter amount: N/A (benefits-only counter)
- Justification points used:
  1. PTO precedent -- both previous roles offered 20 days (professional standard, not personal preference)
  2. Design productivity argument -- remote days improve output quality for deep-focus work phases
- Tone: Enthusiastic and flexible
- Non-salary items addressed: 20 days PTO; 2 remote days per week hybrid schedule
- Flexibility language included: Yes
- Recommended supplement: None

---

**Strategic Notes:**
The bulleted list format is used here because two distinct benefits items are being requested simultaneously -- prose would make the asks feel bundled and harder to respond to individually. Each bullet includes its own justification so the reader can evaluate them independently. The user confirmed the base salary is acceptable, so that is stated explicitly upfront -- this prevents the recruiter from wondering whether a base counter is coming and signals that the ask is narrow and specific.
```

---

### Example 3 -- Counter with Competing Offer (Large Gap)

**User Input:** "I have an offer from Company A for $130,000 as a Senior Software Engineer. I also have an offer from Company B for $148,000 for an essentially identical role. I strongly prefer Company A -- the team and the tech stack are a better fit -- but the $18K gap is significant. I want to counter Company A at $145,000. The hiring manager at Company A is Priya Patel."

**Compensation Analysis:**
- Offer: $130,000
- Counter: $145,000
- Gap: $15,000 / 11.5% above offer -- within standard range, no large-gap advisory needed
- Competing offer at $148,000 -- this is the strongest justification available and should lead
- Strategic note: User prefers Company A, so the email must make clear this is not an ultimatum -- it is an invitation to close the gap

**Output:**

```
## Counter-Offer Email

**To:** Priya Patel, Hiring Manager
**From:** [User name]
**Subject:** Senior Software Engineer Offer -- Compensation Discussion

---

Hi Priya,

Thank you so much for the offer to join the engineering team. After everything we've discussed -- the architecture challenges, the team's approach to technical debt, and the roadmap ahead -- Company A is genuinely my first choice. I want to find a way to make this work.

In the spirit of transparency: I'm currently holding an offer at $148,000 for a comparable Senior Software Engineer role. Compensation isn't the only factor in my decision, and this role is my clear preference, but the $18,000 gap is meaningful enough that I'd like to ask whether there's room to bring the offer to $145,000. That figure aligns with current market benchmarks for senior engineers at this level in [your city] and would help close the gap with my alternative offer.

I'm committed to this decision and open to discussing the full package if that helps. Would you be available for a call this week to talk through the details?

Thank you for your time and consideration -- I'm hoping we can find a path forward.

Best regards,
[User name]

---

**Email Stats:**
- Word count: 186 words
- Counter amount: $145,000 base salary
- Justification points used:
  1. Competing offer -- currently holding offer at $148,000 for comparable role (transparent, factual, not threatening)
  2. Market benchmark -- $145K aligns with current market rate for senior engineers in [city]
- Tone: Transparent and collaborative
- Non-salary items addressed: None (open to full package discussion)
- Flexibility language included: Yes
- Recommended supplement: None (11.5% gap is within standard range; however, the competing offer dynamic may accelerate a phone call from the employer)

---

**Strategic Notes:**
The competing offer leads as justification because it is the most objective and powerful data point available. It is framed as transparency ("in the spirit of transparency") rather than coercion, and Company A's preferred status is stated explicitly to signal that the user is not simply mining the offer for a counterbid. The counter number of $145,000 rather than $148,000 (the competing offer amount) is deliberate -- asking for $3,000 less than the competing offer signals reasonableness and reduces the chance of a flat rejection. If the user had asked to match the competing offer exactly, the email would still work but should acknowledge the exact match is intentional: "I'd simply be asking you to match the competing offer, which I recognize is a significant ask."
```

---

### Example 4 -- Equity Counter for a Startup RSU Grant

**User Input:** "I have an offer from a Series C SaaS startup as a Staff Engineer. The base is $175,000, which I'm fine with. But they're offering 8,000 RSUs vesting over 4 years at a current 409A of $12 per share. For a Staff Engineer role at a Series C, I expected something closer to 15,000 RSUs. I want to counter on equity only. The hiring manager is Marcus Webb."

**Compensation Analysis:**
- Base: $175,000 -- user is satisfied, no base counter
- Current equity offer: 8,000 RSUs × $12 409A = $96,000 four-year grant value / $24,000/year
- Requested equity: 15,000 RSUs × $12 409A = $180,000 four-year grant value / $45,000/year
- Gap: 7,000 RSUs / 87.5% increase in equity -- this is a large equity gap and warrants a strategic note recommending a phone call supplement
- Note: 409A valuation is not fair market value -- real equity value depends on exit outcome -- but it is the standard internal benchmark for comparison

**Output:**

```
## Counter-Offer Email

**To:** Marcus Webb, Hiring Manager
**From:** [User name]
**Subject:** Staff Engineer Offer -- Equity Discussion

---

Hi Marcus,

Thank you for the offer to join the team as Staff Engineer. I've been impressed throughout the process -- the technical depth of the team and the product architecture challenges ahead are exactly the kind of work I'm looking for. I'm genuinely excited about this opportunity.

The base salary of $175,000 works well for me. I'd like to discuss the equity component before finalizing. At the current 409A of $12 per share, the four-year RSU grant of 8,000 units represents approximately $96,000 in grant value -- roughly $24,000 per year. For a Staff Engineer role at Series C stage, market benchmarks for total equity compensation in this range typically sit between $150,000 and $200,000 over four years. I'd like to propose an equity grant of 15,000 RSUs, which would bring the grant value to approximately $180,000 at current 409A -- more in line with the scope of the Staff Engineer role and the level of contribution I'd be bringing.

I'm open to discussing the structure (grant timing, cliff, refresh cadence) if that helps. Would you be available for a call to talk through the equity picture?

Thanks very much -- I'm hoping we can close the gap here.

Best regards,
[User name]

---

**Email Stats:**
- Word count: 222 words
- Counter amount: 15,000 RSUs (vs. 8,000 offered); base salary unchanged at $175,000
- Justification points used:
  1. Current grant value calculation -- 8,000 RSUs × $12 409A = $96,000 / four years; below market for Staff Engineer at Series C
  2. Market benchmark -- Staff Engineer Series C equity typically $150,000--$200,000 over four years at 409A valuation
- Tone: Professional and analytically grounded
- Non-salary items addressed: RSU grant size; openness to discussing grant structure (cliff, refresh)
- Flexibility language included: Yes (grant structure flexibility)
- Recommended supplement: Consider a follow-up phone call -- an 87.5% increase in equity is a large ask; a live conversation allows you to discuss the company's equity philosophy, refresh cadence, and total compensation picture in a way that email cannot

---

**Strategic Notes:**
This email shows the math explicitly rather than stating a vague preference for "more equity." Hiring managers and founders at Series C companies respond better to candidates who demonstrate they understand equity mechanics -- stating the per-unit value calculation signals financial sophistication and makes the request feel grounded rather than arbitrary. The phone call recommendation is included because an equity ask this large is genuinely better resolved in conversation, where the company can explain refresh mechanics, exit scenarios, and preferred structure rather than simply approving or rejecting a number in writing.
```
