---
name: sales-pitch-deck
description: |
  Produces a sales pitch deck narrative with problem, solution, proof,
  process, pricing, and CTA sections using sales deck structure methodology.
  Use when the user asks to create a sales pitch deck, build a sales
  presentation, write pitch deck slides, or structure a client presentation
  for closing deals.
  Do NOT use for investor pitch narrative (use startup-pitch-narrative in
  entrepreneurship), marketing strategy presentation (use marketing-strategy),
  or internal company presentation (use presentation skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "sales presentation strategy planning"
  category: "marketing-sales"
  subcategory: "sales"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Sales Pitch Deck

## When to Use

Use this skill when the user's request clearly involves creating a client-facing sales presentation designed to move a commercial deal forward. Specific triggers include:

- User asks to create a sales pitch deck, sales presentation, or slide deck for a client meeting
- User wants slide-by-slide narrative, talking points, or a deck outline for a prospect call or demo
- User needs to structure a presentation that walks a prospect from problem awareness to a buying decision
- User has an upcoming sales meeting (first call, discovery recap, demo, proposal presentation, or final close) and needs a structured narrative
- User wants to rebuild or improve an existing pitch deck that is not converting prospects
- User needs a modular deck that can be adapted for different buyer personas or deal stages within the same sales cycle
- User is preparing for a board-level or C-suite presentation where the goal is commercial commitment, not investor funding

**Do NOT use this skill when:**

- The user needs an investor pitch or fundraising deck -- use `startup-pitch-narrative` (investor decks prioritize market size, team, and traction over buying journey and ROI)
- The user needs a marketing strategy presentation for internal alignment -- use `marketing-strategy` (different audience, no CTA to purchase)
- The user needs a formal written sales proposal with contract terms -- use `sales-proposal` (proposals are documents, not presentations; different structure and legal considerations)
- The user needs a conference keynote or thought leadership presentation -- use `presentation-skills` (the goal is authority-building, not deal advancement)
- The user needs a product demo script without a surrounding narrative -- use `demo-script` (demos are a section within a pitch, not the pitch itself)
- The user needs an internal business case presentation to secure budget -- the audience is internal stakeholders, not external buyers

---

## Process

### Step 1: Extract Deal Context Before Writing Anything

Never produce a pitch deck without first establishing the commercial context. If the user has not provided these, ask as a single grouped question rather than one at a time.

- **Product or service being sold:** What specific offering is this pitch for? Is it a product, a service, a platform, or a bundle? Does the offering vary by customer size or segment?
- **Target prospect profile:** What is the industry, company size (employees and revenue), and geographic market? Who is the decision-maker (title, seniority) and who are the influencers and blockers in the buying process?
- **Deal stage:** Is this a cold first meeting (30-45 minutes, discovery-heavy), a demo presentation (45-60 minutes, solution-heavy), a competitive evaluation (final 2-3 vendors), or a closing presentation (procurement and legal in the room)?
- **Known pain points:** What has the prospect already shared about their problems? What pains are assumed vs. confirmed? Distinguish between stated problems (what the prospect says) and economic problems (what it costs them in money, time, or risk).
- **Competitive landscape:** Is the prospect evaluating alternatives? Are they replacing an incumbent tool or process? Or is this a greenfield purchase where the alternative is "do nothing"?
- **Available proof:** What customer success stories, case studies, usage metrics, ROI data, or testimonials exist? Are any from the same industry or company profile as the prospect?
- **Pricing structure and budget signals:** What are the pricing tiers? Has the prospect indicated budget range? Enterprise deals with six-figure price points require a different ROI framing than self-serve products at $50/month.
- **Presentation logistics:** How long is the meeting? Is it in-person or virtual? Is the presenter sharing a screen or using a projector? Are there multiple stakeholders in the room?

### Step 2: Map the Buyer's Decision Journey

Before writing a single slide, map the psychological journey the buyer must take from the start of the meeting to saying yes. Sales presentation structure follows cognitive persuasion sequence, not product feature sequence.

- **Awareness of pain:** The prospect must feel the problem is real and costly before they can value the solution. Never introduce your product before the pain slides.
- **Dissatisfaction with the status quo:** The prospect must believe their current approach -- whether a competitor tool, a manual process, or doing nothing -- is insufficient. Use a cost-of-inaction frame: "What does it cost you each month this problem goes unsolved?"
- **Belief that a better solution exists:** The prospect must believe the category of solution is viable. If they are skeptical that any software can solve their problem, address that before pitching specifics.
- **Preference for your solution:** Only after the above three steps does feature/benefit comparison matter. Proof points accelerate this step.
- **Confidence in the decision:** The final slide should reduce fear of making the wrong choice -- implementation support, contract terms, trial period, and references all serve this function.
- Use this five-step journey to decide what each slide must accomplish psychologically, not just informationally.

### Step 3: Structure the Narrative Arc

Map each slide to a narrative purpose. The structure below is a proven 12-slide framework for a 30-45 minute meeting. Adjust slide count based on duration (see Edge Cases).

- **Slides 1-2 (Credibility Foundation):** Who you are and why this meeting is worth the prospect's time. Not a corporate history -- a concise framing of why your company exists to solve the specific problem the prospect faces. Include one sharp credibility signal: customer count, years in market, or a recognizable client logo.
- **Slides 3-4 (Problem and Cost of Inaction):** State the prospect's pain in their language, not product language. Quantify the problem. Slide 4 shows what happens if nothing changes -- this is the most emotionally powerful moment in the deck. Make inaction feel more expensive than action.
- **Slides 5-6 (Solution and Differentiation):** Introduce your product as the direct answer to the pain slides. Map each capability to a pain point explicitly. Slide 6 addresses differentiation -- why your approach is different from alternatives, not just better. Avoid feature lists; use capability-to-outcome framing: "Because we do X, you get Y."
- **Slides 7-8 (Proof):** Social proof eliminates risk perception. Slide 7 is a single detailed case study from a customer with the same profile as the prospect. Slide 8 is aggregate proof: average metrics, customer count, industry logos. Specificity beats generality -- "$2.3M saved across 47 customers" beats "significant savings."
- **Slides 9-10 (Process and Implementation):** Show how you get from signed contract to live results. Address the hidden objection every buyer has: "Is this going to be a painful implementation?" Include timeline, resource requirements, onboarding support, and a go-live milestone. Slide 10 is optional: technical architecture for technical buyers, integration ecosystem, or compliance certifications.
- **Slide 11 (Pricing and ROI):** Never present pricing without an ROI frame immediately before or after. Show the investment, then show the payback period. If your product saves $200K/year and costs $50K/year, the prospect is not spending $50K -- they are making $150K. Present the math explicitly.
- **Slide 12 (Next Steps):** A specific, time-bound action with clear ownership. Not "we should schedule a follow-up" but "I'd like to schedule a 30-minute technical review with your IT team next Tuesday -- does that work?" The Q&A summary slide should be the slide that stays on screen after the presentation ends.

### Step 4: Write Each Slide With Precision

For every slide, follow the five-element structure: title, headline, body content, presenter notes, and timing. Each element serves a distinct purpose.

- **Title:** The navigational label. 3-6 words. Example: "The Hidden Cost of Manual Scheduling."
- **Headline:** The thesis statement for that slide -- the one thing the audience should remember even if they forget everything else on the slide. Write it as a complete sentence with a verb. Example: "Scheduling errors cost mid-market restaurants an average of $47,000 per year in overtime penalties and turnover."
- **Body content:** Maximum 3 bullets or 1 visual (chart, screenshot, diagram). Slides are not documents. If a slide needs more than 3 bullets, it contains two ideas -- split it into two slides.
- **Presenter notes:** What to say verbatim or in essence. Include the transition sentence to the next slide. Example transition: "Now that we understand what this problem is costing you, let me show you exactly how we solve it."
- **Timing:** Specific minute allocation. A 30-minute deck with 12 slides averages 2.5 minutes per slide, but distribution should be front-loaded on problem (longer, more discussion) and back-loaded on next steps (shorter, more decisive).

### Step 5: Build the Proof Section With Specificity

Proof is the highest-leverage section of the deck. Weak proof is the most common reason deals stall after a presentation.

- **The ideal case study has five elements:** Industry and company profile (so the prospect sees themselves), the specific problem (matching the pain slides), the implementation (so they believe it's achievable), the quantified result (hard numbers, not adjectives), and a direct quote with attribution (name, title, company).
- **Hierarchy of proof strength:** Named customer with logo and specific metrics > named customer without metrics > anonymous customer with metrics > aggregate metrics > analyst data > your own claims. Move as high up this hierarchy as your available proof allows.
- **When you have no case study:** Use three separate proof points from different customers rather than one composite story. Example: "We reduced scheduling time by 80% at Mario's Pizza, eliminated overtime violations at Greenfield Hospitality, and improved employee retention 25% at Pacific Coast Dining Group."
- **Proof must match the prospect's profile:** A case study from a Fortune 500 company is counterproductive when selling to a 50-person regional business. Find the closest match by industry, company size, or problem type.
- **Results must include context:** "Saved 10 hours per week" is weak. "Saved 10 hours per week for each of their 5 general managers -- recovering 2,600 hours per year they reinvested into floor management" is compelling. Add context that makes the number feel real.
- **ROI data from the proof section should feed directly into the pricing slide.** If a case study shows $200K saved, and your product costs $50K, the pricing slide ROI math is already credible because it comes from a real customer.

### Step 6: Design the Pricing Slide as an Investment Decision

Pricing is the slide most salespeople handle worst. The goal is not to hide the price -- it is to make the price feel inevitable given the value established in the preceding slides.

- **Anchor before revealing:** Before showing pricing, state the value ceiling. "For most of our customers, the problem we just described costs between $150,000 and $300,000 per year in lost productivity and compliance risk." Then reveal pricing at a fraction of that number.
- **Use a pricing table only when you have 2-3 tiers.** Single-price offerings should use a ROI-focused layout: cost vs. return, payback period, and annual value delivered. Avoid complex pricing tables with 20 feature checkboxes -- they create decision paralysis.
- **Payback period framing:** If a product costs $36,000/year and delivers $180,000 in value, the payback period is 2.4 months. State this explicitly: "Most of our customers recover their full annual investment within the first quarter."
- **Avoid per-unit pricing as the primary frame for enterprise deals.** $3 per employee per month sounds small but $3 × 200 employees × 12 months = $7,200/year -- present the annual total with context, not just the unit rate.
- **Include a next-step pricing call-to-action:** "This is our standard investment. I am happy to work with your procurement team on a contract structure that fits your budget cycle. Can we discuss that today?"

### Step 7: Engineer the Close

The final two slides determine whether the meeting ends with momentum or vagueness. Most presentations fail here because the presenter does not tell the prospect what to do next.

- **Offer a specific next step with a proposed date, not an open-ended ask.** "I'd like to propose a technical review with your IT director -- would Thursday at 2 PM work?" is better than "Let's find time to connect."
- **Identify the decision milestone:** What does the prospect need to do internally to move forward? Who else needs to approve? Is there a procurement process, legal review, or budget approval cycle? Name these explicitly and offer to help navigate them.
- **Reduce fear with proof of commitment:** Offer a pilot period, a reference call with a similar customer, a money-back guarantee, or a phased implementation. The goal is to make "yes" feel safe.
- **The Q&A slide is not an afterthought.** Design a summary slide that states the three things you want the prospect to remember: the cost of inaction, your unique mechanism, and the path to results. This slide stays on screen during Q&A, reinforcing the message while attention is highest.
- **End the meeting with a verbal close:** "Based on what you've shared today, do you see [Product] solving the problem you described with scheduling? What would make it easier to move forward?" This is a soft close -- it surfaces objections before the prospect leaves the room.

---

## Output Format

```
## Sales Pitch Deck: [Company/Product Name]

**Prepared for:** [Prospect company name] -- [Decision-maker title]
**Deal Stage:** [First Meeting / Demo / Proposal / Final Close]
**Competitive Context:** [Replacing incumbent / Greenfield / Competitive evaluation]
**Duration:** [XX minutes]
**Deck Version:** [v1 -- Initial / v2 -- Post-Discovery / v3 -- Final Close]

---

### Narrative Map

| Slide | Title | Narrative Purpose | Timing |
|-------|-------|-------------------|--------|
| 1 | [Title] | Credibility + Agenda | X min |
| 2 | [Title] | Credibility + Agenda | X min |
| 3 | [Title] | Problem -- Pain | X min |
| 4 | [Title] | Problem -- Cost of Inaction | X min |
| 5 | [Title] | Solution -- Capabilities | X min |
| 6 | [Title] | Solution -- Differentiation | X min |
| 7 | [Title] | Proof -- Case Study | X min |
| 8 | [Title] | Proof -- Aggregate | X min |
| 9 | [Title] | Process -- Implementation | X min |
| 10 | [Title] | Process -- Technical / Compliance | X min |
| 11 | [Title] | Pricing + ROI | X min |
| 12 | [Title] | Next Steps + Q&A | X min |
| **Total** | | | **XX min** |

---

### Slide-by-Slide Narrative

---

**Slide 1: Title**
**Slide Title:** [Company Name] + [Prospect Company Name] -- [Meeting Date]
**Headline:** [One-sentence framing of why this meeting matters]
**Content:** Company logo, presenter name and title, prospect company name, date
**Presenter Notes:** [Opening line to set the tone. Thank them for their time. State the agenda in one sentence. Ask if the time allocation still works for them.]
**Timing:** 1 minute

---

**Slide 2: Agenda + Credibility**
**Slide Title:** [What We Will Cover Today]
**Headline:** [One credibility statement -- customer count, years in market, or recognizable logo]
**Content:**
- [Agenda item 1: The challenge you face]
- [Agenda item 2: How we solve it]
- [Agenda item 3: Proof it works]
- [Agenda item 4: Getting started]
- [Credibility signal: e.g., "Trusted by 300+ restaurant groups across North America"]
**Presenter Notes:** [Invite the prospect to redirect focus if their priorities have shifted. "I've structured this around what I know about your situation -- please jump in if there are areas you want to spend more or less time on."]
**Timing:** 1-2 minutes

---

**Slide 3: The Problem**
**Slide Title:** [Problem stated from the prospect's perspective]
**Headline:** [Quantified statement of the problem's scope or frequency]
**Content:**
- [Pain point 1: Operational pain with time or cost impact]
- [Pain point 2: Compliance or risk pain with penalty or liability framing]
- [Pain point 3: Human or morale pain with turnover or retention framing]
**Presenter Notes:** [Do not present this slide -- facilitate it. Ask: "Before I walk through what we typically see, can you tell me how scheduling works for your team today?" Let them confirm or correct the pain points. Validate what they share. Only advance when they agree the problem is real.]
**Discovery Questions to Embed:** [2-3 specific questions to ask during this slide]
**Timing:** 4-5 minutes

---

**Slide 4: The Cost of Inaction**
**Slide Title:** [What It Costs to Keep Doing It the Same Way]
**Headline:** [Dollar amount or quantified annual cost of the problem]
**Content:**
| Cost Category | Annual Impact |
|---------------|---------------|
| [Cost 1] | [$XX,XXX] |
| [Cost 2] | [$XX,XXX] |
| [Cost 3] | [$XX,XXX] |
| **Total** | **[$XXX,XXX]** |
**Presenter Notes:** [Present the math transparently. "These numbers come from what our customers reported before they started using [Product]. How does this compare to what you see in your business?"]
**Timing:** 2-3 minutes

---

**Slide 5: The Solution**
**Slide Title:** [How [Product] Solves [Core Problem]]
**Headline:** [Unique mechanism statement: what makes your approach different at its core]
**Content:**
- [Capability 1] → [Specific outcome for this prospect]
- [Capability 2] → [Specific outcome for this prospect]
- [Capability 3] → [Specific outcome for this prospect]
**Presenter Notes:** [Explicitly connect each capability back to a pain point from slide 3. "Remember you mentioned X? Here is exactly how we handle that." Do not list features -- narrate outcomes.]
**Timing:** 3-4 minutes

---

**Slide 6: Why We Are Different**
**Slide Title:** [What Others Cannot Do That We Can]
**Headline:** [One-sentence differentiation statement]
**Content:**
| | [Your Product] | [Alternative 1] | [Alternative 2] |
|-|---------------|----------------|----------------|
| [Criterion 1] | ✓ | ✗ | ✗ |
| [Criterion 2] | ✓ | ✓ | ✗ |
| [Criterion 3] | ✓ | ✗ | ✓ |
**Note:** Only use a comparison table if the prospect is in active competitive evaluation. Otherwise, use a unique mechanism diagram showing your proprietary approach.
**Presenter Notes:** [Never attack competitors by name in a way that feels aggressive. "We see a lot of customers come from [Category of Alternative] -- here is what they tell us they could not get there that they get from us."]
**Timing:** 2-3 minutes

---

**Slide 7: Proof -- Case Study**
**Slide Title:** [Customer Name]: [Primary Result in 5 Words or Fewer]
**Headline:** [The most impressive single metric from the case study]
**Content:**
- **Company Profile:** [Industry, size, locations -- show similarity to prospect]
- **Challenge:** [Specific problem they faced -- mirror the pain slides]
- **Solution:** [How they implemented the product -- timeline and key features used]
- **Results:** [3 specific metrics with time frames]
- **Quote:** "[Direct testimonial -- attributed to name, title, company]"
**Presenter Notes:** [Draw the parallel explicitly: "They had the same situation you described -- [specific similarity]. Here is what changed for them." Pause after the results and ask: "Does this kind of outcome seem achievable in your operation?"]
**Timing:** 3-4 minutes

---

**Slide 8: Proof -- Scale and Aggregate**
**Slide Title:** Results Across [Customer Count] Customers
**Headline:** [The most compelling aggregate metric]
**Content:**
- [Metric 1: Average improvement across customer base with sample size]
- [Metric 2: Aggregate result with dollar framing]
- [Metric 3: Time-based metric with average and best-case]
- [Customer logos or count by industry segment]
**Presenter Notes:** [Aggregate data builds category confidence. "This is not a one-customer story -- across all our customers in [prospect's industry], the average result is [X]."]
**Timing:** 2 minutes

---

**Slide 9: How It Works -- Implementation**
**Slide Title:** From Signed Agreement to [Key Milestone] in [Timeframe]
**Headline:** [Implementation timeline promise: "Most customers are live within X days"]
**Content:**
| Phase | Activities | Timeline | Who Is Responsible |
|-------|-----------|----------|--------------------|
| [Phase 1: Setup] | [Specific tasks] | [Week 1-2] | [Your team] |
| [Phase 2: Configuration] | [Specific tasks] | [Week 2-3] | [Shared] |
| [Phase 3: Training] | [Specific tasks] | [Week 3] | [Your team] |
| [Phase 4: Go-Live] | [Specific tasks] | [Week 4] | [Prospect team] |
**Presenter Notes:** [Address the implementation fear proactively: "The biggest concern we hear at this stage is 'will this be a big lift for my team?' Here is exactly what it looks like." Quantify the time commitment required from the prospect's side.]
**Timing:** 2-3 minutes

---

**Slide 10: Technical / Compliance / Integration [OPTIONAL]**
**Slide Title:** [Fits Into How You Work Today]
**Headline:** [Integration or compliance statement relevant to this prospect]
**Content:**
- [Integration 1: connects to their existing tools]
- [Integration 2]
- [Compliance certification or data security standard relevant to their industry]
- [Support model: dedicated CSM, SLA, uptime guarantee]
**Presenter Notes:** [Include this slide only when there is a technical evaluator in the room or a known integration concern. Skip or replace with a customer logo slide for non-technical audiences.]
**Timing:** 2 minutes

---

**Slide 11: Investment**
**Slide Title:** Your Investment in [Primary Outcome]
**Headline:** [Payback period statement: "Most customers recover their full investment in X months"]
**Content:**

**Value at Stake (from your numbers):**
| Cost Category | Annual Impact |
|---------------|---------------|
| [Category 1] | [$XX,XXX] |
| [Category 2] | [$XX,XXX] |
| **Total Problem Cost** | **[$XXX,XXX/yr]** |

**Investment:**
| Plan | Annual Cost | Per-Unit Rate | Includes |
|------|------------|---------------|----------|
| [Tier 1] | [$XX,XXX/yr] | [$X per unit] | [Core features] |
| [Tier 2] | [$XX,XXX/yr] | [$X per unit] | [Full features + support] |

**ROI Frame:** [Total value - annual cost = net annual gain]. Payback period: [X months].
**Presenter Notes:** [Present the problem cost table first, pause, then reveal the investment table. "You told me this problem is costing you approximately $[X]. The investment to eliminate it is $[Y]. That means in the first year alone, you net $[Z]. Does that math make sense for your business?"]
**Timing:** 3-4 minutes

---

**Slide 12: Next Steps**
**Slide Title:** Here Is How We Move Forward
**Headline:** [Specific recommended next action with timeframe]
**Content:**
**Recommended Next Step:** [Specific action -- technical review, pilot launch, contract review]
**Proposed Timeline:** [Specific date or "within X business days"]
**What We Need From You:** [Decision, introduction to IT, procurement contact, budget confirmation]
**What We Will Do:** [Send proposal by [date], connect you with reference customer, schedule kickoff]

**If you move forward by [date], you will be live by [date]** -- in time for [relevant business event or season].

**Presenter Notes:** [Do not leave next steps open. "Based on what you have shared, I want to recommend we [specific action] by [specific date]. I will send you a summary email within the hour. Does that work?" Close with a verbal soft close: "Do you see this solving the problem you described?"]
**Timing:** 2-3 minutes

---

**[Q&A Slide -- Stays On Screen During Questions]**
**Slide Title:** [Company Name] + [Prospect Name] -- Summary
**Content:**
- **The Problem:** [One-line restatement with cost]
- **Our Solution:** [One-line differentiation statement]
- **Proven Results:** [Single strongest proof metric]
- **Next Step:** [Specific recommended action from slide 12]

---

### Objection Preparation Guide

| Likely Objection | Root Cause | Response Strategy |
|-----------------|------------|-------------------|
| "It's too expensive" | Value not established / budget mismatch | Reframe to ROI: "Relative to the $[X] problem, what would make the investment feel right?" |
| "We don't have time to implement" | Implementation fear | Show the 4-week timeline, quantify your team's work vs. their work |
| "We tried something like this before and it failed" | Past bad experience | Ask what failed. Address specifically. Offer reference customer with similar history. |
| "We need to think about it" | No urgency / internal alignment needed | Surface the real objection. "What specifically would you need to see to feel confident?" |
| "We need approval from [other person]" | Multi-stakeholder deal | Offer to co-present. "Would it help if I joined a call with [their name]?" |

---

### Deck Customization Notes

**If delivering to a financial buyer (CFO, VP Finance):** Expand slide 4 (cost of inaction) and slide 11 (ROI) to 2 slides each. Compress the solution section. Lead with payback period and net present value framing.

**If delivering to an operational buyer (VP Operations, Director):** Expand slide 9 (implementation) and slide 6 (differentiation). Stress ease of implementation and change management support.

**If delivering to a technical buyer (CTO, IT Director):** Expand slide 10 (technical). Add architecture diagram, API documentation reference, and security/compliance certifications. Compress slides 3-4.
```

---

## Rules

1. **Never produce a deck without knowing the deal stage.** A first-meeting deck has more discovery built in; a final-close deck assumes all objections have been addressed and leads with a decision frame. Getting this wrong produces a deck that mismatches where the buyer is psychologically.

2. **Lead with the prospect's problem, not your company's history.** Corporate overview slides as the second or third slide is the most common structural error in sales decks. Company credibility belongs on slide 2, briefly, before quickly pivoting to the prospect's world. The prospect's pain should be the longest section of the deck.

3. **Slide titles must function as standalone headlines.** A reviewer who only reads slide titles should be able to reconstruct the entire argument of the deck. Test every title: does it convey a specific point of view, or is it just a label? "Our Product Features" fails this test. "Automated Scheduling Eliminates 80% of Manual Work" passes it.

4. **Every quantified claim must have a source attached in presenter notes.** Numbers that cannot be sourced are liabilities in enterprise deals where procurement or legal may scrutinize them. The source does not appear on the slide, but the presenter must know where each number comes from.

5. **Pricing must never appear before proof.** The sequence matters psychologically. Proof establishes that your solution delivers real value. Pricing shown before proof feels expensive. Pricing shown after proof feels like a bargain (or at least justifiable). Never reorganize this sequence even at a prospect's request to "just send the pricing first."

6. **Maximum 3 bullets per slide without exception.** If content exceeds 3 bullets, it belongs on two slides or in the appendix. Slides that look like documents signal that the presenter does not have command of the material. An appendix can be unlimited and is essential for enterprise deals where procurement asks detailed follow-up questions.

7. **Include discovery questions in presenter notes for the problem section.** Even in a demo or proposal presentation, the problem section should begin with 1-2 questions to verify that the pain points still apply and to get the prospect talking. Prospects who talk during a pitch are 3x more likely to buy than those who only listen.

8. **Never end a meeting without proposing a specific next step with a date.** "I will follow up soon" is not a next step -- it is a deal killer. The presenter notes for slide 12 must include a verbal close question and a specific proposed date for the next milestone.

9. **The case study customer profile must be as close to the prospect as possible.** If the prospect is a 200-employee regional restaurant group and the only case study is a 5,000-employee global hotel chain, the proof does not land. In this case, use aggregate metrics from smaller customers rather than a mismatched single case study.

10. **Build an objection preparation guide into every deck output.** The five most common objections in B2B sales -- price, timing, implementation burden, past failure with similar tools, and internal approval -- should be anticipated with specific, non-defensive response strategies. Presenters who have not rehearsed objection responses are caught flat-footed and lose deals they should have won.

---

## Edge Cases

### First Meeting -- Cold Prospect With No Prior Discovery

When there has been no prior discovery call and this is the first time the seller is meeting the prospect, the deck must be discovery-led, not pitch-led. Open with a "hypothesis" frame: "Based on what I know about [their industry], I believe you may be experiencing [problem]. Tell me if I am right or wrong." Use slides 3-4 as discussion prompts, not one-way presentations. Build 3 variants of the problem section covering the most common pain profiles in the target segment, and navigate between them in real time based on prospect responses. Never assume the pain -- confirm it. The solution section should be shortened by 40% and the demo extended. The goal of this meeting is typically to earn a second meeting or a demo, not to close. The CTA slide should propose a focused next step (demo, site visit, pilot design session), not a contract review.

### Buying Committee -- Multiple Stakeholders With Conflicting Priorities

Enterprise deals frequently involve 5-10 stakeholders across finance, operations, IT, legal, and the executive sponsor. A single deck cannot serve all audiences equally. Build a modular deck with a 6-slide core (problem, solution, proof, pricing, next steps, Q&A) that every audience sees, plus audience-specific appendix modules: a 3-slide financial deep-dive for CFOs (NPV, payback period, budget cycle alignment), a 3-slide technical module for IT (architecture, security, integrations), and a 3-slide operational module for department heads (implementation timeline, training plan, support model). Present the core deck in the full-group meeting, then offer 1:1 follow-up sessions using the relevant appendix module. Note in the deck output which slides are core vs. modular.

### Competitive Displacement -- Replacing an Incumbent Tool or Process

When the prospect is currently using a competitor's product and considering switching, the psychology changes significantly. The prospect has sunk cost bias and fears the disruption of migration. The deck must address three specific fears: data migration complexity, retraining time, and the risk of having made a mistake by choosing the incumbent. Add a slide between the solution and proof sections titled "What Switching Looks Like" -- this slide shows the migration timeline, what your team handles vs. what they handle, and quantifies the transition period. Include a case study from a customer who switched from the same incumbent if possible. The competitive comparison table (slide 6) becomes essential here, but frame it around outcomes achieved post-switch rather than feature checklists. Avoid attacking the incumbent directly -- let the data make the case. Include a "switching guarantee" or "migration support package" reference in the pricing slide to reduce switching risk.

### Very Short Meeting -- 15 Minutes or Less

Compress to a 5-slide deck: (1) Problem + Cost of Inaction in one slide, (2) Solution with your unique mechanism, (3) Single proof point -- the strongest metric you have, (4) Pricing with payback period, (5) One specific next step. Remove the agenda slide, the differentiation slide, the implementation slide, and the aggregate proof slide entirely. Every slide must have a single headline and no more than 2 bullets. The presenter notes must include time warnings: "If you are at 8 minutes and not yet on slide 3, skip to slide 4 immediately." The goal of a 15-minute meeting is almost never to close -- it is to earn a 45-minute demo. Design the CTA accordingly.

### No Proof Points Available -- New Product or Early Stage

When the product is new or the company has no published case studies, use three alternative proof strategies. First, use a pilot customer story even if informal -- a founder relationship or a beta customer with verbal permission to share results. Second, use industry benchmark data from credible third-party sources to establish what the problem costs, then show how your product's approach addresses the mechanisms that drive those costs. Third, offer a risk-reversal mechanism -- a paid pilot with a defined success metric, a money-back period, or a performance-based pricing option -- that shifts the risk from the buyer to you. Frame the lack of a large customer base as an advantage in certain contexts: "You would be among our first customers in [their industry], which means you will have direct input into how we configure the product for your use case."

### Technical Audience -- Engineers and Architects as Decision Makers

When the primary evaluator is technical -- a CTO, VP Engineering, or solutions architect -- the standard narrative arc requires significant adjustment. Problem slides should reference system-level pains (API rate limits, data latency, integration failures, scalability constraints), not business-level pains. The solution section should include a technical architecture diagram as the primary visual, not a capability list. Replace the case study slide with a technical case study that includes system specifications, integration patterns, and performance metrics (e.g., "processes 2 million records per hour with 99.97% uptime"). Pricing should include API call volumes, data storage limits, and SLA tiers. Include a sandbox access offer or a technical proof-of-concept proposal as the next step -- technical buyers want to evaluate before they buy, not be sold to.

### Deal in Late Stage -- Final Presentation Before Contract Decision

When this is the final presentation in a competitive evaluation where the prospect is choosing between 2-3 finalists, the deck structure should invert slightly. Open with a summary of everything you have learned during the sales process -- this demonstrates engagement and reassures the prospect they made a good choice inviting you to the final. Include a dedicated "Why [Your Company] vs. Alternatives" slide that addresses the specific evaluation criteria the prospect shared during the process. Include a reference customer offer -- "I have arranged for you to speak directly with [Customer Name] who had the same situation" -- before the pricing slide. The implementation slide becomes the most important section: show a draft project plan with real names and dates. The CTA slide should propose a contract review meeting with their legal team, not another discovery session. Urgency framing is appropriate here: if you know their fiscal year end or a business deadline, connect the go-live timeline to it explicitly.

---

## Example

**Input provided by user:**

"I need a sales pitch deck for our restaurant scheduling software. We're pitching to the regional VP of Operations at a 12-location fast casual chain called Coastal Kitchen. They currently use spreadsheets and a group text system for scheduling. Our software auto-generates labor-compliant schedules based on availability and forecasted traffic. We have a case study from a similar chain. Price is $4 per employee per month. Average location has 25 employees. This is a demo presentation -- they have already seen a 15-minute intro call."

---

**Full Output:**

## Sales Pitch Deck: ShiftSync -- Coastal Kitchen Demo Presentation

**Prepared for:** Coastal Kitchen -- VP of Operations (Regional)
**Deal Stage:** Demo -- Post-Discovery
**Competitive Context:** Replacing spreadsheet + manual process (greenfield software purchase)
**Locations:** 12 locations, avg. 25 employees per location = 300 employees
**Monthly Investment:** $4 × 300 = $1,200/month -- $14,400/year
**Duration:** 45 minutes
**Deck Version:** v1 -- Demo Presentation

---

### Narrative Map

| Slide | Title | Narrative Purpose | Timing |
|-------|-------|-------------------|--------|
| 1 | ShiftSync + Coastal Kitchen | Credibility + Agenda | 1 min |
| 2 | What We Will Cover | Agenda + Credibility | 1 min |
| 3 | How Scheduling Actually Gets Done at Fast Casual Chains | Problem -- Pain | 4 min |
| 4 | What Spreadsheet Scheduling Costs a 12-Location Chain | Problem -- Cost of Inaction | 3 min |
| 5 | ShiftSync: Labor-Compliant Schedules in 20 Minutes, Not 5 Hours | Solution | 3 min |
| 6 | Demo: Building a Week of Schedules Across 3 Locations | Demo | 10 min |
| 7 | Surf's Up Grill (10 Locations): 75% Scheduling Time Reduction | Proof -- Case Study | 3 min |
| 8 | Results Across 180 Fast Casual Locations | Proof -- Aggregate | 2 min |
| 9 | From Contract to Live in 21 Days | Implementation | 3 min |
| 10 | Your Investment | Pricing + ROI | 4 min |
| 11 | Next Steps | CTA | 2 min |
| Q&A | Summary (stays on screen) | Q&A Reference | Remainder |
| **Total** | | | **36 min + 9 min buffer** |

---

### Slide-by-Slide Narrative

---

**Slide 1: Title**
**Slide Title:** ShiftSync + Coastal Kitchen -- [Date]
**Headline:** Showing you exactly how your team gets 4 hours a week back per location
**Content:** ShiftSync logo, Coastal Kitchen name, presenter name and title, date
**Presenter Notes:** "Thank you for making time today. On our intro call, you mentioned scheduling is one of the top three time sinks for your GMs. Today I want to show you exactly how we fix that -- and let you drive the software so you can see it working in your context. I have planned 45 minutes -- does that still work?"
**Timing:** 1 minute

---

**Slide 2: Agenda + Credibility**
**Slide Title:** What We Will Cover Today
**Headline:** Trusted by 180 fast casual and quick service locations across North America
**Content:**
- The scheduling problem your GMs face every week
- How ShiftSync auto-generates compliant schedules in 20 minutes
- Live demo using a Coastal Kitchen-style location setup
- Results from a 10-location chain just like yours
- Investment and how to get started
**Presenter Notes:** "Before I dive in -- on our intro call you mentioned overtime compliance was a specific concern after a DOL audit last year. I have built today's demo specifically around that. Is that still the priority, or has anything shifted?"
**Timing:** 1-2 minutes

---

**Slide 3: How Scheduling Actually Gets Done at Fast Casual Chains**
**Slide Title:** Your GMs Are Spending 5 Hours a Week on a 20-Minute Problem
**Headline:** For a 12-location chain, manual scheduling consumes over 3,000 GM hours per year
**Content:**
- GMs collect availability by text, email, and paper -- then manually reconcile conflicts in a spreadsheet
- Last-minute call-outs trigger 20-30 minute phone trees with no visibility into who is available
- Labor law compliance (minor restrictions, overtime thresholds, predictive scheduling rules) tracked manually in notes or not at all
**Discovery Questions (ask before presenting):** "Walk me through how your GMs build the schedule right now -- what does Sunday night look like for them?" and "When you have a call-out on Saturday morning, what happens in the next 30 minutes?"
**Presenter Notes:** Let the VP answer before showing this slide. If they describe a process that matches, advance. If they describe something different, adjust the bullets verbally. The goal is for them to say "yes, that is exactly right" before moving to the cost slide.
**Timing:** 4 minutes

---

**Slide 4: What Spreadsheet Scheduling Costs a 12-Location Chain**
**Slide Title:** The Hidden Cost of Running Scheduling on Spreadsheets and Group Texts
**Headline:** For a chain your size, this problem costs approximately $220,000 per year in recoverable losses
**Content:**

| Cost Category | Per Location/Year | 12 Locations/Year |
|---------------|-------------------|-------------------|
| GM time on scheduling (5 hrs/wk × $25/hr × 52 wks) | $6,500 | $78,000 |
| Overtime from last-minute fill-ins (avg. 3 incidents/wk × $45 overage) | $7,020 | $84,240 |
| DOL compliance penalties (avg. per violation, fast casual segment) | $4,800 | $57,600 |
| **Total Annual Cost** | **$18,320** | **$219,840** |

**Presenter Notes:** "These numbers come from what our customers reported before switching to ShiftSync -- I am happy to show you the underlying data. How does this compare to what you see at Coastal Kitchen? The overtime line in particular -- does $84K feel right for your operation?" Pause and let them respond. If they push back on a number, say: "Tell me what it looks like for you -- I want to use your actual numbers." Adjust the math accordingly.
**Timing:** 3 minutes

---

**Slide 5: ShiftSync -- Labor-Compliant Schedules in 20 Minutes, Not 5 Hours**
**Slide Title:** ShiftSync Auto-Generates the Optimal Schedule -- You Just Approve It
**Headline:** Our scheduling engine applies your labor rules, forecasted traffic, and staff availability simultaneously -- something a spreadsheet cannot do
**Content:**
- **Auto-Generation Engine** → Builds a draft schedule for a 25-person location in under 2 minutes based on forecasted covers, availability, and labor rules
- **Compliance Guard** → Automatically flags minor hour limits, overtime thresholds, and predictive scheduling notice requirements before the schedule is published
- **Mobile Availability + Shift Swap** → Staff submit availability and swap shifts in the app -- no more group texts, no more GM playing coordinator
**Presenter Notes:** "Notice I connected each of these to the three pains from the previous slide. The auto-generation solves the 5 hours of manual work. The compliance guard eliminates the audit risk you mentioned. The mobile availability kills the Saturday morning phone tree. I will show all three of these live in the demo. Ready to see it?"
**Timing:** 3 minutes

---

**Slide 6: Demo -- Building a Week of Schedules Across 3 Locations**
**Slide Title:** Watch the Schedule Build Itself
**Headline:** [Live demo -- no slide content needed]
**Demo Outline:**
1. Log in as a GM at Coastal Kitchen Location 1 -- show the dashboard (2 min)
2. Import forecasted covers for the week -- auto-generation runs (2 min)
3. Show the compliance flags catching an overtime breach and a minor's hour limit (2 min)
4. Publish the schedule -- staff receive mobile notification (1 min)
5. Simulate a Saturday morning call-out -- show the available replacement list and one-tap fill notification (2 min)
6. Switch to the regional VP view -- show all 12 locations' labor cost vs. budget in one dashboard (1 min)
**Presenter Notes:** "I have configured this demo environment with Coastal Kitchen's location names and a real week of cover data from your busiest season -- the week before Memorial Day. I want you to drive this -- I will tell you where to click." Hand over the mouse or screen control. Ask during the demo: "Is this how your GM would expect it to work?" and "What else would you want to see?"
**Timing:** 10 minutes

---

**Slide 7: Surf's Up Grill (10 Locations): 75% Reduction in Scheduling Time**
**Slide Title:** Surf's Up Grill Eliminated DOL Compliance Risk Across 10 Locations in 30 Days
**Headline:** From 4.5 hours per GM per week to 45 minutes -- and zero compliance violations since launch
**Content:**
- **Company Profile:** 10-location fast casual chain, Pacific Coast, avg. 22 employees per location -- similar size and profile to Coastal Kitchen
- **Challenge:** Same spreadsheet + group text system. Had received 2 DOL violations for minor labor law infractions totaling $9,200 in penalties. GMs spending 4.5 hours per week on scheduling.
- **Solution:** Deployed ShiftSync across all 10 locations over 3 weeks. GM training completed in one 90-minute session per location.
- **Results:**
  - Scheduling time: 4.5 hours → 45 minutes per week per location (83% reduction)
  - DOL violations: 0 in 14 months since launch
  - GM satisfaction scores increased 22 points (exit survey data)
  - GM overtime hours for administrative work: down 31%
- **Quote:** "I used to spend my Sunday night building the schedule and half my Monday fixing it. Now I approve the draft in 20 minutes and spend the rest of the morning on the floor. That is the job I actually wanted." -- General Manager, Surf's Up Grill Huntington Beach
**Presenter Notes:** "Surf's Up Grill is probably the closest comparison to Coastal Kitchen in our customer base -- similar footprint, similar menu format, and they came from the exact same spreadsheet process you described. The GM I quoted has the same title as your GMs. Does this outcome seem achievable for your team?"
**Timing:** 3-4 minutes

---

**Slide 8: Results Across 180 Fast Casual Locations**
**Slide Title:** These Results Are Consistent Across Our Customer Base
**Headline:** Customers in the fast casual segment average a 74% reduction in scheduling time and zero compliance violations within 60 days
**Content:**
- 74% average reduction in time spent scheduling across 180+ fast casual locations
- $187,000 average annual savings per 10-location chain (labor, overtime, compliance)
- 94% of customers report zero scheduling-related compliance violations post-launch
- 4.7/5 average GM satisfaction rating for the scheduling experience
- Customers include brands in QSR, fast casual, and full-service dining segments
**Presenter Notes:** "These are aggregate numbers from our full customer base in food service -- not cherry-picked. The $187K savings figure for a 10-location chain aligns closely with the $220K cost we calculated for Coastal Kitchen's 12 locations. I am happy to share the methodology behind these numbers."
**Timing:** 2 minutes

---

**Slide 9: From Contract to Live in 21 Days**
**Slide Title:** Coastal Kitchen Could Be Fully Live Before the End of Next Month
**Headline:** Our implementation team owns 80% of the setup work -- your GMs spend less than 3 hours total before go-live
**Content:**

| Phase | What Happens | Timeline | Who Does It |
|-------|-------------|----------|-------------|
| Account Setup | Location configuration, labor rules import, POS integration | Days 1-7 | ShiftSync implementation team |
| Data Migration | Employee profiles, availability, historical schedules | Days 5-10 | ShiftSync team + one HR contact |
| GM Training | 90-minute session per location, in-app guided setup | Days 10-14 | ShiftSync trainer (virtual or on-site) |
| Parallel Run | GMs build schedules in ShiftSync alongside existing process | Days 14-18 | GMs (15 min/day) |
| Go-Live | Spreadsheets retired, ShiftSync live at all 12 locations | Day 21 | ShiftSync CSM monitors first week |

**Time commitment from Coastal Kitchen:** 1 HR contact for 4 hours during data migration + 90 minutes per GM for training. That is it.
**Presenter Notes:** "The biggest question we hear at this stage is 'how much work is this going to be for my team?' The answer is: almost none. We have done this 180 times. Your GMs will spend one 90-minute training session. By week 3, they are live. If you signed this week, you could be live before your summer season. Is the summer rush a factor in your decision timing?"
**Timing:** 3 minutes

---

**Slide 10: Your Investment**
**Slide Title:** ShiftSync Pays for Itself in Less Than One Month
**Headline:** At $14,400/year, ShiftSync delivers a 15:1 return on investment for a chain Coastal Kitchen's size

**The Problem You Are Currently Paying For:**
| Cost Category | Annual Cost |
|---------------|-------------|
| GM time on scheduling | $78,000 |
| Overtime from manual scheduling errors | $84,240 |
| Compliance penalties (conservative estimate) | $57,600 |
| **Total Annual Cost of Status Quo** | **$219,840** |

**Your Shift
