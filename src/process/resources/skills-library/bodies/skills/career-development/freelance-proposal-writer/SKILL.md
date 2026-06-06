---
name: freelance-proposal-writer
description: |
  Writes a complete client proposal document including problem statement, proposed
  solution, scope definition, timeline, pricing, and terms. Produces a full proposal
  ready to send to a prospective client.
  Use when the user needs to write a freelance proposal, respond to a client inquiry
  with a formal proposal, pitch a project to a potential client, or create a scope
  of work document for freelance work.
  Do NOT use for business proposals unrelated to freelancing (use business proposal
  skills), job application cover letters (use cover-letter-writer), or setting rates
  (use freelance-rate-calculator).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "freelancing career template writing proposal"
  category: "career-development"
  subcategory: "freelancing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Freelance Proposal Writer

## When to Use

Use this skill when any of these situations arise:

- A user has an active client inquiry, lead, or conversation and needs to send a formal proposal document to move the engagement forward
- A user is responding to an inbound request for proposal (RFP) from a business or organization seeking freelance or consulting services
- A user completed a discovery call or intake meeting with a prospective client and needs to convert that conversation into a written proposal
- A user is pitching a project proactively -- approaching a potential client with a defined scope, timeline, and price before the client has officially requested a proposal
- A user needs a scope of work (SOW) document to define project boundaries, deliverables, and responsibilities before starting work on a handshake or verbal agreement
- A user is re-proposing a project after a scope or pricing negotiation and needs to issue a revised, updated proposal document
- A user received vague client interest ("let's work together, send me something") and needs to structure that loose interest into a formal, actionable document

**Do NOT use this skill when:**

- The user needs help calculating what rate to charge before they are ready to write a proposal -- use `freelance-rate-calculator` first, then return to this skill
- The user is writing a business plan or investor pitch (no client relationship, forward-looking business case) -- use a business proposal skill
- The user is writing a job application cover letter responding to a posted employment position -- use `cover-letter-writer`
- The user wants a contract or legal services agreement for a project that is already agreed upon -- this skill produces a pre-contract proposal, not a binding services contract; direct to a contract template skill
- The user needs a statement of work amendment to modify an existing signed agreement -- that is a change order document, not a new proposal
- The user wants general advice on freelancing business practices without a specific project to propose -- use a freelance strategy or business development skill
- The user is responding to a grant opportunity or nonprofit funding request -- those require a different structure focused on organizational mission and outcomes

---

## Process

### Step 1: Gather Complete Project Context Before Writing Anything

Do not start drafting until you have answers to these specific inputs. If the user has not provided them, ask. Missing context produces generic proposals that lose clients.

- **Client identity:** Client name, company name, industry, company size if known (startup vs. enterprise vs. SMB signals budget norms and decision-making speed)
- **Lead source:** How did this lead arrive? Referral, inbound inquiry, RFP, cold pitch, existing relationship? Lead source affects tone -- a warm referral proposal reads more conversationally than a formal RFP response
- **The client's stated problem:** Capture their words specifically. What did they say they need? What pain point are they describing? Note the difference between what they say they want (a new website) and what they actually need (more online orders) -- the best proposals address both
- **The user's proposed solution:** What will the user actually deliver? Get specifics -- not "design work" but "5 logo concepts, 2 refinement rounds, final logo in SVG/PNG/PDF formats"
- **Scope boundaries:** What is IN scope and what is explicitly OUT? Ask the user if anything is ambiguous -- ambiguity in a proposal becomes a dispute later
- **Timeline:** Desired start date, key constraints (client's internal deadline, product launch, fiscal year end), total project duration the user is planning
- **Pricing structure:** Fixed project fee, hourly with an estimate cap, monthly retainer, value-based pricing, or phased billing? Get the total number and the user's intended payment split
- **Special terms the user wants:** Revision limits, intellectual property ownership timing, kill fee if cancelled, confidentiality requirements, non-compete or exclusivity, tools and software the client must provide

If any of these are missing, ask specifically and directly. Do not invent numbers, assume payment terms, or guess at deliverables.

---

### Step 2: Diagnose the Proposal Type and Calibrate Depth

Not all proposals are the same length or level of formality. Before writing, classify the engagement:

**Tier 1 -- Small / Simple (under $3,000, single deliverable, known client):**
One page maximum. Homepage, problem statement, single deliverable list, one delivery date, total price, payment terms, acceptance instructions. Skip phases. Skip milestone table. Keep it scannable and fast to sign.

**Tier 2 -- Mid-Size (3,000--$25,000, multi-deliverable, new client relationship):**
Full proposal with all sections. 2-4 phases in the timeline. Itemized deliverables table. Payment schedule tied to milestones. This is the standard freelance proposal most users need.

**Tier 3 -- Large / Complex ($25,000+, multi-phase, organizational client, RFP response):**
Add an executive summary at the top. Add a "Methodology" or "Our Approach" section explaining the reasoning behind the process. Add a "Relevant Experience" or "Why Us" section with 2-3 specific case study references. Consider adding an assumptions section. These proposals may run 5-10 pages and often require a named point of contact and a formal acceptance process.

**RFP Responses:** Always mirror the RFP's section structure. If the RFP lists "Section 4: Technical Approach," your proposal has a section called "Technical Approach." Evaluators score RFP responses against rubrics -- missing a required section disqualifies the proposal automatically.

---

### Step 3: Write the Problem Statement With Client-Side Specificity

This section is the most important in the entire proposal. It determines whether the client believes you understood them.

- Open with the client's specific business context -- their industry, their competitive environment, their operational challenge. Not "many companies struggle with social media" but "Fresh Bites competes in a market where three local chains already offer commission-free direct ordering"
- Identify the root problem beneath the surface request. A client asking for "a new website" often has a root problem of "we are losing 22% of order revenue to third-party delivery commissions." Name the root problem explicitly
- Quantify the impact when possible. If the client mentioned any numbers (revenue, headcount, timeframe, previous cost), use them. If no numbers exist, use industry benchmarks or directional estimates with appropriate hedging ("at industry-average commission rates of 15-30%...")
- Write this section as if you are explaining the client's situation back to them more clearly than they explained it to themselves. Clients who read this and think "yes, exactly" will sign proposals. Clients who read a generic description will keep shopping
- Length: 2-4 sentences for Tier 1, a short paragraph (4-6 sentences) for Tier 2, up to two paragraphs for Tier 3 RFP responses

---

### Step 4: Write the Proposed Solution With Specific, Named Deliverables

Every deliverable must appear as a named, described item. Use a table for three or more deliverables.

- **Name every deliverable specifically.** Not "logo design" but "Primary logo mark (3 initial concepts → 2 revision rounds → final files in SVG, PNG, EPS, and PDF formats)." The description tells the client what they are buying and tells the user what they committed to
- **Describe the format of each deliverable.** What does the client actually receive? A 2,000-word article? A 90-second video file in H.264 and ProRes? A Figma file with organized layers plus exported PNG assets? Format specifications prevent "I thought you were going to give me the source files" disputes
- **Write the overview paragraph in outcome language, not activity language.** Say "you will have a website that converts 3x more mobile visitors into reservations" not "I will code HTML pages and configure a CMS." Clients buy outcomes, not activities. Reserve activity description for the timeline section
- **List exclusions explicitly.** Every proposal needs a "Not Included in This Scope" section. Common exclusions to consider: ongoing maintenance, platform or software licensing fees, third-party integrations beyond the named ones, content writing (if the user is a designer, not a writer), stock photography, printing costs, government filings, rush delivery outside the stated timeline. The fewer items explicitly excluded, the larger the scope creep risk
- **For service businesses (strategy, coaching, consulting):** Deliverables are often documents, sessions, or reports. Name them the same way. Not "consulting services" but "three 90-minute strategy sessions, a 15-page competitive analysis report, and a 90-day action plan document"

---

### Step 5: Build the Timeline With Phase Structure and Client Dependencies

A timeline is not a delivery date. A complete timeline shows how the work happens, what each phase produces, and what the client must do to keep things moving.

- **Structure phases to reflect how the work actually flows.** For creative work: Discovery → Concepts → Revisions → Delivery. For development: Discovery → Design → Development → QA/Testing → Launch. For writing: Research → Outline → Drafts → Revisions → Final. Use phases the client can understand, not internal task management terminology
- **Assign specific durations to each phase.** "Weeks 1-2" is better than "2 weeks" because it anchors the timeline to a calendar. If a start date is known, use actual weeks or dates
- **State what each phase produces.** Every phase must have a deliverable -- a thing the client can see or review. This gives the client checkpoints and gives the user invoice milestones. A phase that produces nothing tangible should be merged into the adjacent phase
- **Include client dependencies explicitly.** These are the inputs the client must provide for work to proceed: brand assets, copy, photos, stakeholder feedback, credentials, approvals. State what is needed and when. If the client misses a dependency, the project timeline shifts -- making this explicit protects the user from "the project took way longer than expected" disputes
- **Add a feedback turnaround expectation.** "Client will provide consolidated feedback within 3 business days of each review" is a standard, reasonable expectation that prevents proposals from dying in client inbox limbo
- **Specify what happens if the client causes delay.** A sentence like "If client-provided materials or feedback are delayed beyond the stated deadlines, the project timeline will shift accordingly at no additional charge, but the final delivery date will adjust by an equal duration" prevents the user from being blamed for delays they did not cause

---

### Step 6: Present Pricing With Context, Structure, and Protection

Pricing is the section most likely to be misread or to trigger negotiation. Present it clearly and purposefully.

**Common payment structures and when to use each:**

- **50/25/25 (50% upfront, 25% at midpoint milestone, 25% on delivery):** Standard for projects of 4-12 weeks. Distributes cash flow and ties payments to visible progress. Most widely accepted by clients
- **50/50 (50% upfront, 50% on delivery):** Acceptable for projects under 4 weeks or under $5,000. Simpler but exposes the user to non-payment on delivery of the final 50% for larger projects
- **33/33/33 (thirds at kickoff, midpoint, delivery):** Good for longer projects (12+ weeks) where a 50% upfront ask may feel heavy to the client
- **Monthly retainer billing:** For ongoing relationships. Bill on the 1st of each month for that month's services. Net 15 terms are standard; avoid Net 30 for retainers
- **Phased billing (pay per phase):** For large, multi-phase projects where later phases are TBD. Scope and price each phase independently. Phase 1 is always fixed; Phase 2+ pricing is provided at the end of the preceding phase

**Additional pricing considerations:**

- State the hourly rate for out-of-scope work explicitly. This prevents back-and-forth when scope changes happen. "$150/hour for work outside the defined scope, billed in 1-hour minimum increments" is a complete, enforceable statement
- Include a late payment clause. "Invoices unpaid after 14 days are subject to a 1.5% monthly late fee" is industry standard and legally enforceable in most jurisdictions
- State the payment method (ACH, wire, check, Stripe, PayPal -- whatever the user accepts). Ambiguity here causes delays
- For large projects, consider adding a value context sentence: "Third-party delivery platforms charge 15-30% per order. At 500 orders per month averaging $45, direct ordering saves Fresh Bites $3,375-$6,750 monthly. This project pays for itself in 2-4 months." This reframes cost as investment and reduces price objections

---

### Step 7: Add Terms That Protect Both Parties

Terms are not bureaucratic filler -- they are the contractual backbone of the engagement. These provisions prevent the most common freelance disputes.

- **Revision policy:** State the exact number of revision rounds included and define what a "revision" is. A revision round is one consolidated set of feedback. Multiple rounds of one-at-a-time requests are not revision rounds -- they are unlimited revisions by another name. Define "consolidated feedback" in the terms: "all stakeholder feedback compiled into a single document, submitted within 3 business days"
- **Ownership and IP transfer:** Full ownership (copyright, trademark rights, source files) typically transfers upon final payment. Before final payment, the user retains ownership and grants a limited license to use the work for evaluation purposes only. This is the standard that protects against clients using deliverables without paying the final invoice
- **Kill fee / cancellation clause:** If the project is cancelled after kickoff, payment is due for all completed work. A common provision: if cancelled mid-phase, 50% of that phase's fee is due in addition to all completed phases. This protects against clients walking away after consuming significant work time
- **Scope change protocol:** Any addition to the defined scope requires written approval from both parties and a separate change order with updated pricing. "Written" means email is sufficient -- it does not need to be a formal amendment
- **Confidentiality:** The user will not disclose the client's business information, financial data, or unreleased products. This is reciprocal -- the client should not disclose the user's proprietary methods either, though this is less commonly negotiated in freelance proposals
- **Proposal validity:** 30 days is the industry standard. Pricing is a function of the user's current availability and costs -- a proposal accepted 6 months later with different market conditions or workload is not the same commitment
- **Governing law:** For Tier 2 and Tier 3 proposals, add a one-line statement: "This agreement shall be governed by the laws of [State/Province]." This prevents disputes about which jurisdiction applies if there is ever a disagreement

---

### Step 8: Close With a Specific, Low-Friction Call to Action

The call to action determines whether the client actually moves forward or puts the proposal in a "think about it" pile.

- Be specific about the acceptance mechanism. "Reply to this email with 'I approve the proposal'" or "Sign and return the attached PDF" or "Click the accept button on the proposal tool" -- whatever the user's actual workflow is
- Name the first payment trigger and the exact amount. "Submit the $6,000 kickoff payment via [payment method]" is better than "submit initial payment"
- Propose the kickoff call with a date or a date range. "I can schedule a kickoff call for the week of [date]. What time works best?" moves the relationship forward and reduces the gap between acceptance and start of work
- Express genuine interest in the project without generic enthusiasm. Reference something specific about the client's situation that makes this project interesting or worthwhile
- Make contact easy. A direct phone number or calendar link (Calendly, Cal.com, etc.) reduces friction for clients who have questions

---

## Output Format

```
## Project Proposal: [Specific Project Name -- not "Project Proposal"]

**Prepared for:** [Client Name], [Company Name]
**Prepared by:** [Freelancer Name / Business Name]
**Date:** [Date]
**Proposal valid through:** [Date + 30 days]

---

### The Challenge

[2-5 sentences that describe the client's specific problem using their business context,
name the root problem beneath the surface request, and quantify the impact where possible.
Do not use generic descriptions. Every sentence must be specific to THIS client.]

---

### Proposed Solution

**Overview:** [2-3 sentences in outcome language. What will the client have when this
project is complete, and why does that solve the problem described above?]

**Deliverables:**

| # | Deliverable | Description | Format / Files Delivered |
|---|------------|-------------|--------------------------|
| 1 | [Name] | [What it is and what it includes] | [Format/file type/specs] |
| 2 | [Name] | [What it is and what it includes] | [Format/file type/specs] |
| 3 | [Name] | [What it is and what it includes] | [Format/file type/specs] |

**Not included in this scope:**
- [Exclusion -- what it is, why it is excluded, and whether it can be added]
- [Exclusion -- what it is, why it is excluded, and whether it can be added]
- [Exclusion -- what it is, why it is excluded, and whether it can be added]

---

### Methodology [Tier 3 / RFP only -- omit for Tier 1 and Tier 2]

[For large or RFP proposals: describe the professional methodology, framework, or
approach being applied. Reference any recognized methodologies if applicable (e.g.,
double-diamond design process, agile sprint structure, content strategy frameworks).]

---

### Timeline

| Phase | Dates / Duration | Activities | Deliverable |
|-------|-----------------|-----------|-------------|
| Phase 1: Discovery & Kickoff | Week 1 | [Activities] | [Tangible output] |
| Phase 2: [Name] | Weeks 2-3 | [Activities] | [Tangible output] |
| Phase 3: [Name] | Weeks 4-5 | [Activities] | [Tangible output] |
| Final: Review & Delivery | Week 6 | [Revision rounds, QA, handoff] | [Final deliverable] |

**Total project duration:** [X] weeks from signed proposal and receipt of initial payment
**Key milestone:** [Most critical checkpoint -- what it is and why it gates the next phase]

**Client-provided inputs and deadlines:**

| Input Required | Needed By | Impact if Late |
|---------------|-----------|----------------|
| [What client must provide] | [Date/phase] | [How delay shifts the timeline] |
| [What client must provide] | [Date/phase] | [How delay shifts the timeline] |

**Feedback turnaround:** Client will provide consolidated feedback on all review items
within [3] business days. Delays in feedback or client-provided materials will shift
the delivery date by an equivalent duration.

---

### Investment

**Project fee:** $[X,XXX]

[Optional value context sentence: e.g., "At industry-average costs of $X for comparable
work from an agency, this project delivers the same output at [X]% less investment."]

**Payment schedule:**

| Milestone | Amount | % | Due |
|-----------|--------|---|-----|
| Project kickoff | $[X] | [X]% | Upon proposal acceptance |
| [Milestone -- e.g., Design approval] | $[X] | [X]% | [Date or trigger event] |
| Final delivery | $[X] | [X]% | Upon client approval of final deliverables |

**Payment method:** [ACH / wire transfer / check / Stripe / other]

**Out-of-scope work:** Any work outside the deliverables defined above will be scoped
and priced before proceeding, at a rate of $[X]/hour. Scope changes require written
approval from both parties.

**Late payments:** Invoices unpaid after [14] days are subject to a [1.5]% monthly
late fee applied to the outstanding balance.

---

### Terms

**Revisions:** [X] rounds of consolidated revisions are included at each review stage.
A revision round is defined as one set of compiled feedback submitted in a single
document within 3 business days of receiving the deliverable. Additional revision
rounds are billed at $[X]/hour.

**Intellectual property:** All work-in-progress materials remain the property of
[Freelancer Name] until final payment is received. Upon receipt of final payment,
full ownership -- including copyright and source files -- transfers to [Client Name].

**Cancellation:** Either party may cancel this project with written notice. Upon
cancellation, client payment is due for: (a) all fully completed phases, plus
(b) 50% of any phase currently in progress at the time of cancellation.

**Confidentiality:** [Freelancer Name] will hold all client business information,
data, and unreleased materials in strict confidence and will not disclose them to
third parties.

**Independent contractor:** [Freelancer Name] is an independent contractor. This
proposal does not create an employment relationship.

**Governing law:** [For Tier 2 and Tier 3] This agreement shall be governed by
the laws of [State/Province].

---

### Relevant Experience [Optional -- use for Tier 2 new client relationships and all Tier 3]

**[Project type similar to this engagement]**
[Client type / industry, no confidential names required] -- [1-2 sentence description
of the challenge and what was delivered] -- [Specific, quantified result: "Reduced
load time from 8s to 1.4s" or "Increased email open rate from 18% to 34%"]

**[Second relevant project]**
[Same format]

---

### Next Steps

To move forward on this project:

1. [Reply to this email confirming acceptance] or [Sign and return this document]
2. Submit the initial payment of $[X] via [payment method / link]
3. [Schedule our kickoff call -- I have availability [dates/times] or book directly
   at [calendar link]]

Once payment is received and the kickoff call is scheduled, work begins immediately.

I'm looking forward to [specific aspect of this project that genuinely interests the
user] -- [one sentence that references something specific about the client's situation].

If you have any questions before accepting, I'm happy to schedule a 20-minute call to
walk through any section of the proposal.

[Freelancer Name]
[Email]
[Phone / Calendar link]
```

---

## Rules

1. **Never produce a proposal with invented numbers.** If the user has not specified a price, payment split, or hourly rate, stop and ask. Defaulting to a made-up rate is worse than asking -- it creates the wrong expectation and erodes trust when the user changes the number before sending

2. **Every deliverable must have a name, a description, and a format specification.** "Design assets" is not a deliverable. "Homepage mockup -- desktop and mobile layouts as a Figma file with exported PNG previews at 2x resolution" is a deliverable. The format specification eliminates the single most common post-delivery dispute: "I expected the source files"

3. **The scope exclusions section is not optional.** At minimum, include three exclusions. The exclusions are where scope creep lives. If the user cannot think of exclusions, ask: "What might this client reasonably expect that you are NOT planning to include?" Common categories: maintenance, hosting, adjacent services, content creation, third-party fees, rush delivery

4. **Match the tone to the lead source.** A cold pitch proposal can be warmer and more persuasive. An RFP response must be formal and section-matched. A follow-up to a referral can drop some boilerplate. A proposal to an existing client can be abbreviated. Generic neutral tone applied uniformly to all situations signals a template, not a relationship

5. **The problem statement must contain zero generic sentences.** Test every sentence: could this sentence appear in a proposal for a completely different client in a different industry? If yes, rewrite it. The problem statement is what separates a proposal that wins from one that gets a "we went another direction" email

6. **Client dependencies belong in the timeline table, not in a footnote.** If client inputs are buried in the terms section, clients miss them and the project stalls. The dependencies table shows specifically what the client must do and when, making their responsibilities concrete and visible

7. **The revision policy must define what "one revision round" means.** A round is one set of consolidated feedback, not one back-and-forth exchange. Without this definition, two revision rounds can become ten micro-exchanges. The definition protects the user while remaining reasonable for the client

8. **Intellectual property transfer should be conditional on final payment, not on project completion.** "Upon receipt of final payment" is the correct trigger. "Upon delivery" or "upon completion" creates a scenario where the client owns the work before the final invoice is paid -- and then has no incentive to pay it

9. **The call to action must specify exactly three things:** the acceptance mechanism, the payment trigger and amount, and the next scheduling action. More than three items adds friction. Fewer than three leaves process gaps that delay project start

10. **For Tier 1 proposals under $3,000, omit the timeline table and the terms boilerplate beyond the essentials.** A one-page proposal that closes in 24 hours beats a six-page proposal that intimidates a small client. Calibrate document weight to deal size -- over-engineered small proposals signal that the freelancer does not understand proportion

11. **Do not use the phrase "I will work hard" or any variant.** Promises of effort are not deliverables. Clients do not need to know how hard the user will work -- they need to know what they will receive, when they will receive it, and what it will cost. Replace effort language with outcome language throughout

12. **The proposal validity period must appear in the header, not just in the terms.** Clients skim proposals and may revisit them weeks later. A visible "valid through [date]" in the header creates appropriate urgency and prevents stale-proposal disputes

---

## Edge Cases

### Client Has Not Shared Enough Information for a Full Proposal

If the user only has "they want a website" or "they need marketing help" without specifics, do not write a vague proposal. Two options:

**Option 1 -- Discovery Phase Proposal:** Write a two-part proposal. Part 1 is a paid discovery engagement (typically 5-15 hours at the user's hourly rate) that produces a project brief, technical audit, or strategy document. Part 2 is described as "a full implementation proposal will be submitted at the conclusion of discovery." This approach is professional, prevents dangerous underscoping, and filters out clients unwilling to invest in clarity. Discovery engagements typically run $500-$2,500 for freelance work and $5,000+ for consulting.

**Option 2 -- Assumptions-Based Proposal:** Write the full proposal based on stated assumptions, and include an explicit "Assumptions" section directly above the timeline. List every assumption made ("this proposal assumes the client is using WordPress and that existing content can be reused with minor editing"). Include a clause: "If any of these assumptions differ from the actual project conditions, scope and pricing will be revised before work begins."

### Client Is Asking for a Fixed Price But the Scope Is Genuinely Undefined

Never accept a fixed price on undefined scope -- it is the most reliable way to lose money as a freelancer. Present one of two alternatives:

**Not-to-Exceed (NTE) / Time and Materials with Cap:** Propose hourly billing with a maximum cap. Example: "This project will be billed at $125/hour with a not-to-exceed cap of $8,500. If the project is completed in fewer hours, you pay only for actual hours worked. The cap guarantees your maximum exposure." This gives the client the cost certainty they want while giving the user protection against underdefined scope.

**Phased Proposal -- Fixed Phase 1, TBD Phase 2:** Scope and price Phase 1 (discovery, research, or prototyping) precisely. State that Phase 2 pricing will be provided at the conclusion of Phase 1 based on findings. This is common in strategy, UX, and development work where the Phase 1 output defines the Phase 2 scope.

### User Is Responding to a Formal RFP From an Organization

RFPs have rubrics. Evaluators score responses against required sections -- missing a required section may automatically disqualify the proposal regardless of quality. Approach:

- Mirror the exact section numbering and naming from the RFP. If the RFP says "Section 3.2 -- Technical Approach," the response has a section titled "Section 3.2 -- Technical Approach"
- Add a compliance matrix if the RFP is long: a table listing each requirement, the section of the response where it is addressed, and a compliance status (Fully Compliant / Compliant With Exceptions / Not Applicable)
- Include a "Why Us" or "Relevant Experience" section even if the RFP does not explicitly require it -- evaluators use experience to differentiate proposals with similar technical responses
- Respect page limits. RFPs with stated page limits will penalize or disqualify over-length responses. Edit ruthlessly
- Note the submission deadline, format (PDF only? Physical copies?), and submission address. RFP responses submitted in the wrong format or after the deadline are typically not evaluated

### Proposal Is for a Very Large Organizational Client (Enterprise, Government, University)

Several structural differences apply:

- The client likely has procurement requirements, vendor registration, insurance certificate requirements, or W-9/W-8 requests. Acknowledge these in the Next Steps section: "I can provide proof of professional liability insurance, a completed W-9, and any vendor registration documentation your procurement process requires"
- Payment terms are often Net 30 or Net 60 by institutional policy. Acknowledge this and state it explicitly rather than assuming Net 15. Consider whether to price for longer payment cycles
- Decision-making involves multiple stakeholders -- the day-to-day contact is rarely the budget authority. The proposal may be forwarded to a procurement committee. Write for an audience that has not been on any discovery call and does not know the user
- Indemnification and liability language becomes more important. For large clients, the proposal terms section should include limitation of liability language: "Liability of [Freelancer] is limited to the total project fee paid"
- Include an executive summary at the top (1 page maximum) that can be read independently of the full proposal. Senior decision-makers may read only this section

### User Wants to Include Portfolio Work or Case Studies

Insert a "Relevant Experience" section between Proposed Solution and Timeline. Structure each entry as:

**Project Type:** [e.g., E-commerce Redesign for Specialty Retail]
**Challenge:** One sentence describing the client's situation (no confidential names required)
**Approach:** One sentence describing what was delivered
**Result:** One specific, quantified outcome -- "Increased conversion rate from 1.2% to 3.8% over 90 days" or "Reduced customer support tickets by 40% after new onboarding flow launched"

Two to three case studies is optimal. More than three dilutes the impact and extends the proposal unnecessarily. Match case studies to the specific engagement type in the current proposal -- a web developer proposing an e-commerce site should not lead with a case study about branding work.

If the user has no case studies yet (new freelancer), substitute with: "Relevant Skills and Tools" -- a table showing tools, platforms, and methodologies directly applicable to this project. This is less persuasive than case studies but better than nothing.

### Client Has Pushed Back on Price and the User Wants to Revise and Resubmit

Do not simply drop the price -- that signals that the original price was inflated and invites further negotiation. Instead:

- Reduce the price by reducing scope explicitly. Remove one or more deliverables, reduce revision rounds, or eliminate a phase. Make the correlation between lower price and reduced scope visible: "At $8,500, the scope includes X, Y, Z. At $6,500, the scope includes X and Y only. Z can be added in a future phase." This respects the user's rates while giving the client a path to a budget they can approve
- Offer a payment structure adjustment as an alternative to a price reduction. Some clients have cash flow constraints, not total budget constraints. Shifting from 50/25/25 to 25/25/25/25 (quarterly installments) may make the same total price work for the client
- Reissue the proposal with a new valid-through date and a clear notation: "Revised Proposal -- [date]" to distinguish it from the original

### Client Accepts the Proposal But Wants to Add Work Before Signing

This is scope creep at the proposal stage -- a preview of what will happen throughout the project. Handle it clearly:

- Do not informally agree to additions. Issue an updated proposal with the new work added to the deliverables table and the price adjusted accordingly
- If the additions are small (one extra page, one extra revision round), consider a simple addendum email: "Per our conversation, I will also include [X]. This adds $[Y] to the project total, bringing the revised fee to $[Z]. Please confirm acceptance of this change via email."
- Use this moment to establish the scope change protocol that will govern the rest of the project. If the client accepts a verbal scope addition at the proposal stage without additional charge, they will expect the same treatment throughout the project

---

## Example

**Input:** "I'm a freelance brand strategist and designer. A SaaS startup (CloudVault, 28 employees, Series A) reached out through a mutual connection. Their product is a data backup tool for small businesses. They just hired their first VP of Marketing and want to rebrand before a big push next quarter. They need a new logo, brand guidelines, and a website homepage redesign. I charge $185/hour and want to quote this as a fixed project at $22,000. I want 40% upfront, 30% at brand guidelines approval, 30% on final delivery. I'm including 2 revision rounds per phase. Timeline is 8 weeks. I've done similar work for two other B2B SaaS companies."

---

## Project Proposal: Brand Identity and Homepage Redesign

**Prepared for:** CloudVault Inc.
**Prepared by:** [Freelancer Name / Studio Name]
**Date:** [Date]
**Proposal valid through:** [Date + 30 days]

---

### The Challenge

CloudVault is entering its most significant growth phase following a Series A raise, with the VP of Marketing planning a major customer acquisition push next quarter. The current brand identity -- built for an early-stage product in a proof-of-concept phase -- does not yet communicate the security, reliability, and professionalism that small business owners require from a company responsible for protecting their critical data. Competing on product features alone is increasingly difficult as the backup and recovery market becomes more crowded; a distinct, trustworthy brand identity is now a competitive asset, not just a visual preference. Without a refreshed identity in place before the marketing push begins, every dollar invested in paid acquisition and content will land on a homepage that undersells the product it is trying to convert.

---

### Proposed Solution

**Overview:** I will develop a complete brand identity system for CloudVault -- including a new logo mark, full brand guidelines, and a redesigned homepage -- built around the core brand truth that small business owners can trust CloudVault with what matters most: continuity. The result will be a cohesive visual and verbal identity that supports every marketing channel CloudVault plans to activate next quarter and is built to scale as the company grows.

**Deliverables:**

| # | Deliverable | Description | Format / Files Delivered |
|---|------------|-------------|--------------------------|
| 1 | Logo system | Primary logo mark plus alternate lockups (horizontal, stacked, icon-only); developed from 3 initial concepts refined to 1 selected direction across 2 revision rounds | SVG, PNG (transparent background, white, dark), EPS, PDF; brand usage guide included |
| 2 | Brand color palette | Primary and secondary color system with accessibility-tested contrast ratios (WCAG AA minimum); includes HEX, RGB, CMYK, and Pantone (PMS) values | Brand guidelines document (see item 3) |
| 3 | Brand guidelines document | Comprehensive 25-35 page document covering logo usage rules, color system, typography system (primary and secondary typefaces with hierarchy), photography and imagery direction, tone of voice guidelines, and do/don't usage examples | PDF (print-ready); InDesign source file |
| 4 | Homepage redesign | Full desktop and mobile layout redesign: hero section, value proposition messaging, social proof section, feature highlights, and primary CTA design; copywriting direction provided, final copy written by client or quoted separately | Figma file (developer-ready with annotated specs); PNG previews at 1x and 2x |
| 5 | Icon set (10 icons) | Custom icon set aligned to the new brand system, covering the 10 core product features/concepts identified in the discovery session | SVG (individual files + sprite sheet); PNG at 24px, 48px, and 96px |

**Not included in this scope:**
- Website development or coding (this proposal covers design files only; development can be quoted as a Phase 2 engagement or handed off to CloudVault's development team with developer-ready Figma specs)
- Copywriting for the homepage (messaging direction and headline frameworks are included; final approved copy is written by CloudVault's team or a copywriter; copy must be provided before homepage design begins in Phase 3)
- Brand application to additional marketing assets beyond the homepage -- email templates, social media templates, pitch decks, and other collateral can be quoted as a Phase 2 package after brand guidelines are finalized
- Photography direction or photo production (stock photography direction and art direction guidance are included in the brand guidelines; actual photo selection and licensing is CloudVault's responsibility)
- Trademark search or legal clearance of the new logo (strongly recommended before launch; a trademark attorney should review the final mark)

---

### Timeline

| Phase | Dates / Duration | Activities | Deliverable |
|-------|-----------------|-----------|-------------|
| Phase 1: Discovery & Strategy | Week 1 | Brand audit of current identity; competitor landscape review (8-10 direct and adjacent competitors); stakeholder alignment interview with VP of Marketing and CEO; brand positioning workshop (2 hours); identification of core brand attributes, target audience archetypes, and competitive differentiation | Brand strategy brief (10-15 pages): positioning statement, brand attributes, audience profiles, tone of voice direction, visual direction moodboards (3 options) |
| Phase 2: Logo Development | Weeks 2-3 | 3 initial logo concepts developed based on approved strategy brief; internal review; first presentation to CloudVault; Round 1 revisions on selected direction; Round 2 refinements; final logo approval | Approved final logo system (all formats listed above) |
| Phase 3: Brand Guidelines | Weeks 4-5 | Color system development and accessibility testing; typography selection and hierarchy system; brand guidelines document design and writing; icon set development (10 icons); first presentation and Round 1 revisions; Round 2 refinements and final approval | Approved brand guidelines document (PDF + source file) + icon set (all formats) |
| Phase 4: Homepage Redesign | Weeks 6-7 | Homepage layout concepts (2 directions); copy placeholder with messaging framework; integration of new brand system into design; first presentation and Round 1 revisions; Round 2 refinements and developer handoff preparation | Approved homepage design (Figma file + PNG previews) |
| Final: Handoff & QA | Week 8 | Final file organization and packaging; developer spec annotations; assets export; final review call; delivery of all project files | Complete project file package; 30-minute handoff call |

**Total project duration:** 8 weeks from receipt of signed proposal and initial payment
**Key milestone:** Brand strategy brief approval (end of Week 1) -- all visual work is built on the approved strategy brief. If the brief requires significant rework, subsequent phase timelines will shift accordingly.

**Client-provided inputs and deadlines:**

| Input Required | Needed By | Impact if Late |
|---------------|-----------|----------------|
| Existing brand assets (current logo files, any existing brand documents, current website access) | Day 1 of project | Delays Phase 1 audit and postpones strategy brief delivery |
| VP of Marketing and CEO availability for 2-hour brand positioning workshop | Week 1 | Phase 1 cannot be completed without this session; all subsequent phases shift |
| Approved homepage copy (final or near-final text) | Start of Week 6 | Homepage design cannot proceed without copy; Phase 4 start date will shift by the duration of the copy delay |
| Designated primary point of contact for all feedback and approvals | Day 1 | Consolidated feedback requires a single decision-maker to be identified in advance |

**Feedback turnaround:** CloudVault will provide consolidated written feedback within 3 business days of each deliverable presentation. All stakeholder input must be compiled into a single document -- the freelancer will not consolidate feedback from multiple sources independently. Delays in feedback will shift subsequent phase start dates by an equivalent duration.

---

### Investment

**Project fee:** $22,000

*Context: Full-service branding agencies typically charge $45,000-$80,000 for an equivalent brand identity engagement with comparable deliverables. This proposal provides the same strategic rigor and professional output with a dedicated senior specialist working directly on your account throughout.*

**Payment schedule:**

| Milestone | Amount | % | Due |
|-----------|--------|---|-----|
| Project kickoff | $8,800 | 40% | Upon acceptance of this proposal |
| Brand guidelines approval | $6,600 | 30% | Upon CloudVault's written approval of the brand guidelines document (end of Phase 3) |
| Final delivery | $6,600 | 30% | Upon delivery of the complete project file package (end of Week 8) |

**Payment method:** ACH bank transfer or check preferred. Credit card payments available via Stripe (3% processing fee applies).

**Out-of-scope work:** Any work outside the deliverables defined above will be scoped in writing before proceeding, at a rate of $185/hour billed in 1-hour minimum increments.

**Late payments:** Invoices unpaid after 14 days are subject to a 1.5% monthly late fee on the outstanding balance.

---

### Terms

**Revisions:** 2 rounds of consolidated revisions are included at each review stage (logo presentation, brand guidelines review, homepage design review). A revision round is defined as one complete set of compiled feedback submitted in a single written document within 3 business days of receiving the deliverable. Feedback submitted incrementally -- one item at a time over multiple messages -- will be addressed in the next scheduled revision round, not as immediate individual updates. Additional revision rounds are available at $185/hour.

**Intellectual property:** All work-in-progress concepts, explorations, and draft materials remain the property of [Freelancer Name] until final payment is received in full. Upon receipt of final payment, CloudVault receives full ownership and copyright of all approved, final deliverables. Rejected concepts and unexplored directions remain the property of [Freelancer Name] and may not be used by CloudVault.

**Cancellation:** Either party may cancel this project with written notice via email. Upon cancellation: all completed phases are billed at 100% of the phase value; any phase currently in progress is billed at 50% of that phase's value regardless of completion percentage; the initial 40% payment is non-refundable if cancellation occurs after project kickoff.

**Confidentiality:** [Freelancer Name] will hold all CloudVault business information, product details, strategic plans, and unreleased materials in strict confidence and will not disclose them to any third party without written consent.

**Independent contractor:** [Freelancer Name] is an independent contractor. This engagement does not create an employment or partnership relationship between the parties.

**Governing law:** This agreement shall be governed by the laws of [State/Province].

---

### Relevant Experience

**SaaS Brand Identity -- B2B Security Software**
A 35-person cybersecurity SaaS company needed a complete rebrand ahead of an enterprise market expansion. Delivered a new logo system, brand guidelines, and sales deck templates over 9 weeks. The refreshed identity supported a $2.1M Series B announcement; the company's LinkedIn engagement rate increased 280% in the 60 days following launch.

**B2B SaaS Homepage Redesign -- Cloud Infrastructure**
A cloud infrastructure startup redesigned their homepage to support a new self-serve acquisition funnel. Delivered full desktop and mobile layouts with a developer-ready Figma handoff. Following development and launch, the page's free trial conversion rate improved from 2.1% to 5.6% over the first 90 days.

---

### Next Steps

To move forward on this project:

1. Reply to this email with written confirmation of acceptance -- a simple "I approve this proposal" is sufficient, or I can provide a PDF version for digital signature if your procurement process requires it
2. Submit the initial payment of $8,800 via ACH transfer to [account details] or via the Stripe link at [link]
3. Schedule our kickoff call and brand positioning workshop -- I have availability the weeks of [date range]; a 2-hour block with both you and the CEO is required for this session. Book directly at [calendar link] or reply with preferred times

Work begins the business day that both payment and the kickoff call are confirmed. Given CloudVault's next-quarter timeline, beginning before [specific date] keeps all phases on track for an [specific date] completion.

I'm genuinely interested in this project -- B2B security tools have a real trust problem at the brand level, and there's a significant opportunity to give CloudVault a visual identity that communicates the reliability their customers are actually paying for. I've seen this type of brand work create measurable downstream impact on acquisition costs, and I'd like to bring that to CloudVault.

If you have any questions before accepting, I'm happy to schedule a 20-minute call to walk through any section of the proposal. You can book time directly at [calendar link].

[Freelancer Name]
[Email Address]
[Phone Number]
[Calendar Link]
