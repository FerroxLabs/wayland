---
name: value-proposition
description: |
  Produces a structured value proposition using the Value Proposition Canvas
  framework, mapping customer jobs, pains, and gains to product features,
  pain relievers, and gain creators. Use when the user asks to define their
  value proposition, articulate why customers should buy, create a positioning
  statement, or map product benefits to customer needs.
  Do NOT use for brand positioning statement (use brand-positioning), full
  business plan (use business-plan), or customer persona development (use
  customer-persona).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "strategy marketing planning entrepreneurship"
  category: "business-strategy"
  subcategory: "strategy-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Value Proposition

## When to Use

**Use this skill when the user:**
- Asks to create, define, or refine a value proposition for a product, service, feature, or business model
- Wants to articulate why a specific customer segment should choose their offering over alternatives -- including the "do nothing" alternative
- Needs to map product capabilities to customer needs using a structured framework before writing website copy, pitch decks, sales scripts, or investor narratives
- Is experiencing messaging confusion: their sales team describes the product differently than their marketing team, or customers misunderstand what problem the product solves
- Has early product-market fit signals (or lacks them) and wants to understand which customer needs their offering actually addresses versus which ones it misses
- Needs to validate or stress-test an existing value proposition -- for example, before a pricing change, market expansion, or competitive repositioning
- Is preparing for a fundraising pitch and needs to articulate customer value clearly before addressing the business opportunity
- Wants to prioritize which product features to build next by mapping gaps between the customer profile and the current value map

**Do NOT use this skill when:**
- The user needs a brand identity, tone, or visual positioning system -- use `brand-positioning`, which addresses emotional brand architecture and competitive perceptual maps rather than customer-job alignment
- The user needs a full business model with revenue streams, cost structures, and partner networks -- use `business-plan`, which incorporates the value proposition as one component of the broader model
- The user needs to build out a detailed buyer persona with demographic data, psychographic profiles, or behavioral attributes -- use `customer-persona`, which populates the customer profile section of this skill as a prerequisite input
- The user needs a go-to-market launch plan -- the value proposition is an input to GTM strategy, not the strategy itself
- The user needs competitive intelligence research -- knowing what competitors offer requires a separate `competitive-analysis` process before the differentiation claims here can be validated

---

## Process

### Step 1: Gather Required Context Before Writing Anything

Never produce a value proposition without adequate inputs. Ask the user to provide the following; if any critical input is missing, explicitly request it before proceeding.

**Required inputs:**
- Product or service name and a one-sentence description of what it does mechanically (not the benefit -- what it literally does)
- Primary target customer segment: be precise. "Small businesses" is not a segment. "E-commerce store owners running a Shopify store with $10K-$500K annual revenue and no dedicated operations hire" is a segment
- Two to three alternatives the customer currently uses -- include both direct competitors and behavioral alternatives (e.g., "they do it in Excel" or "they hire a VA")
- What the user believes makes their offering different -- capture their raw hypothesis even if it turns out to be weak or generic
- Intended use context for the value proposition: website hero section, sales deck slide, email sequence, internal product roadmap alignment, or investor pitch (each demands different emphasis)
- Stage of the business: pre-product, early customers, scaling, or established with churn/retention data -- this determines whether proof points exist or need to be planned

**Clarifying questions to ask if context is thin:**
- "Who specifically loses sleep over this problem? What is their role and their daily frustration?"
- "What does the customer do today when your product doesn't exist for them?"
- "When you've talked to customers, what outcome do they mention first when describing why they bought?"
- "Is there a competitor that does something similar? How do customers talk about that competitor's shortcomings?"

---

### Step 2: Build the Customer Profile -- Jobs, Pains, and Gains

This is the most important and most commonly skipped step. The value proposition is only as good as the customer understanding behind it. Map the customer profile rigorously.

**Customer Jobs -- three types to identify:**
- **Functional jobs:** The literal task the customer is trying to accomplish. These are operational, process-oriented, and usually what the user initially describes. Example: "File quarterly sales tax returns accurately."
- **Social jobs:** How the customer wants to be perceived by others while doing the job. These are often more powerful motivators than functional jobs in B2C and SMB contexts. Example: "Look like a financially organized, professional freelancer to clients."
- **Emotional jobs:** How the customer wants to feel while doing the job or afterward. Example: "Feel confident that I'm not making a costly mistake that will trigger an audit."
- Aim for 4-6 jobs total. Rank them -- most value propositions fail by addressing a functional job while the real purchase driver is emotional or social
- Apply the "job story" format as a validation test: "When [situation], I want to [motivation], so I can [expected outcome]." If it holds up, it's a real job

**Customer Pains -- three types to distinguish:**
- **Undesired outcomes:** The job produces a bad result -- errors, delays, rework, lost money
- **Obstacles:** The customer cannot even start or complete the job -- missing skills, tools, time, or access
- **Risks:** What could go wrong that the customer fears, even if it hasn't happened yet -- audit risk, reputational damage, contract loss
- Rate severity on a 1-5 scale, not High/Medium/Low, to force differentiation: a pain rated 4 is meaningfully different from one rated 5
- Capture the current workaround for each pain -- this reveals competitive behavior and the real baseline the product is being compared against
- The most powerful pains to address are high-severity with bad or expensive workarounds

**Customer Gains -- three categories to separate:**
- **Required gains:** Minimum expectations the customer has -- the product is useless without them. Example: "The software must import bank transactions automatically; if I have to enter them manually it's no better than a spreadsheet."
- **Expected gains:** What a good solution includes but isn't remarkable. Example: "Clean invoice templates."
- **Unexpected gains:** Gains the customer didn't ask for but would love. Example: "Real-time profitability by client so I can fire my least profitable customer."
- Desired outcomes, metrics the customer uses to measure success, and features they borrow from adjacent tools they wish were bundled together are all sources for gain identification
- Rank gains by desirability -- must-have, should-have, and nice-to-have -- and flag whether the gain is currently being achieved through any means

---

### Step 3: Build the Value Map -- Products, Pain Relievers, and Gain Creators

Map the offering side of the canvas with the same rigor applied to the customer profile. This is where most value propositions are vague and where domain expertise creates differentiation.

**Products and Services:**
- List the core features and capabilities of the product -- not benefits, but actual product components. What does it do mechanically?
- For each feature, describe the mechanism: how does it work in a way that matters to the customer's job?
- Distinguish between table-stakes features (required to compete) and differentiating features (reasons to prefer this product over alternatives)

**Pain Relievers -- rules for mapping:**
- Every pain reliever must reference a specific pain from the customer profile by number (P1, P2, etc.). A pain reliever without a corresponding pain is a feature looking for a problem
- Rate how completely the pain is relieved: completely, substantially, partially, or minimally. Partially-addressed pains are honest -- they create upgrade opportunities or roadmap priorities
- The most credible pain relievers describe a mechanism, not just a direction. "Reduces errors" is weak. "Auto-categorization trained on 2M transactions produces a 94% accuracy match against CPA-reviewed records, eliminating the need to manually verify each line item" is strong
- Avoid pain relievers that apply equally to every competitor in the category -- "saves time" is true of every software tool. The differentiating pain reliever explains *how* time is saved in a way competitors cannot claim

**Gain Creators -- rules for mapping:**
- Every gain creator must reference a specific gain from the customer profile by number (G1, G2, etc.)
- Rate the gain created: substantial (creates the gain completely), moderate (meaningfully contributes), or minimal (minor contribution)
- Distinguish gain creators that are differentiating from those that are merely satisfying. A gain creator that matches a must-have gain prevents defection; a gain creator that addresses an unexpected gain drives word-of-mouth and premium pricing
- The strongest value propositions create unexpected gains on top of fully addressing required gains

---

### Step 4: Perform the Fit Assessment

Fit is the degree of alignment between the customer profile and the value map. This assessment must be honest -- a dishonest fit assessment produces a value proposition that fails in the market.

**Mapping fit:**
- For each pain (P1-Pn), identify which pain reliever addresses it and at what coverage level. Pains with no corresponding pain reliever are gaps
- For each gain (G1-Gn), identify which gain creator delivers it and at what level. Gains with no creator are gaps
- For each job (J1-Jn), identify whether the product's pain relievers and gain creators together address it. A job addressed only partially indicates where the product is weak

**Assessing overall fit quality:**
- **Strong fit:** The product directly addresses the top 2-3 highest-severity pains and the must-have gains for the primary job. This is the core of the value proposition
- **Partial fit:** The product addresses important but not critical needs, or addresses critical needs only partially. These areas should be noted as roadmap priorities if the team decides they are strategic
- **Gaps:** Important customer needs where the product offers nothing. Gaps are not failures -- they are decisions. The value proposition should not be written as if gaps don't exist; it should be scoped to what is genuinely addressed

**Fit quality thresholds to communicate:**
- If the product addresses fewer than 2 high-severity pains with strong coverage, the value proposition will be weak in the market regardless of how it is written -- the product needs development before messaging
- If the product addresses every pain but misses all must-have gains, the product will see high churn after initial conversion -- customers buy but don't stay
- If the product addresses unexpected gains but fails on required gains, it will generate buzz but fail at retention

---

### Step 5: Write Three Value Proposition Statement Variants

Apply the canvas insights to produce statement variants optimized for different uses. Each variant must be specific, differentiated, and testable.

**Variant 1 -- Functional (what it does):**
Use the formula: "For [precisely described segment] who [highest-importance job], [product] is the [category] that [primary pain reliever mechanism]. Unlike [specific alternative], [product] [differentiator that is mechanically distinct, not just directionally different]."
- Best for: B2B sales materials, product landing pages aimed at bottom-of-funnel visitors, feature comparisons, investor materials that need to convey mechanism
- Weakness: can read as clinical; needs proof points to land

**Variant 2 -- Emotional (how it feels):**
Use the formula: "[Product] gives [segment] [emotional job outcome] by [mechanism], so they no longer [highest-severity pain expressed as an emotional experience]."
- Best for: B2C campaigns, social ads, email subject lines, above-the-fold website headlines where the visitor is problem-aware but not yet solution-aware
- Weakness: harder to test; requires customer language, not founder language. Always use verbatim customer quotes from discovery interviews to write this variant

**Variant 3 -- Outcome-based (what they achieve):**
Use the formula: "[Segment] use [product] to [functional job outcome] -- on average, they [quantified result: time, money, error rate, speed] compared to [specific alternative]. [Proof point source]."
- Best for: case study headlines, customer success stories, ROI calculators, enterprise sales decks, competitive battle cards
- Strongest variant when proof points exist. Weakest when they don't -- do not fabricate numbers; use ranges or benchmarks from comparable products if internal data does not yet exist

**Cross-checking all variants:**
- Specificity test: replace your product name with a competitor's name. If the statement still works, it is not differentiated -- rewrite it
- Verifiability test: could a skeptical customer fact-check this claim? If not, it is marketing language, not a value proposition
- Customer language test: would a customer use these exact words to describe their problem? If the language is industry jargon, translate it

---

### Step 6: Identify and Structure Proof Points

A value proposition without proof is a hypothesis. Every claim made in the statement variants needs either existing evidence or a validation plan.

**Types of proof points by strength (strongest to weakest):**
1. Quantified customer outcomes with sample size: "Average time savings of 5.2 hours/month across 200 active users"
2. Third-party validation: analyst reports, independent benchmarks, certified audit results
3. Customer testimonials with specifics: name, company size, quantified result. "John, 8-person design agency, reduced monthly close from 3 days to 4 hours"
4. Case studies with methodology described
5. Mechanism-based claims: "Auto-categorization trained on X transactions at Y% accuracy" -- the mechanism itself is a form of proof
6. Comparative demonstrations: live demo or free trial that lets the customer prove it themselves

**For early-stage products without proof:**
- Identify the single most important claim in the value proposition statement -- the one the whole argument hinges on
- Design a minimum validation study: what is the smallest sample that would make the claim credible? For most B2B SaaS claims, n=20-50 customers tracked on the specific metric is sufficient for early positioning
- Define the exact measurement method: before/after time tracking, error rate comparison, NPS delta
- Set a threshold: what result would confirm the claim versus prompt a repositioning? Naming this threshold forces intellectual honesty

---

### Step 7: Recommend the Right Variant and Tailor for Context

Always close by recommending which statement variant to use for the user's stated context, and explain why.

**Matching variant to context:**
- **Website hero section:** Emotional or outcome-based variant. Visitors arrive problem-aware; they need to feel understood before they will read further. Lead with the pain or the outcome, not the mechanism
- **Sales deck (enterprise):** Functional variant followed immediately by outcome-based variant with proof. Buyers need to understand what it does before they will believe the outcomes
- **Investor pitch:** Outcome-based variant with market-size framing: "X million [segment] face [top pain]; our customers see [quantified outcome], implying [TAM capture opportunity]"
- **Email outreach:** Emotional variant compressed to one sentence. The goal is to get a reply, not to explain the product
- **Internal alignment (for teams):** Functional variant is mandatory -- teams need mechanical clarity about what they are building and why, not emotional framing
- **Ad copy:** Emotional variant with a specific pain called out. Ads interrupt; the only reason someone stops scrolling is if the pain is named precisely

---

## Output Format

```
## Value Proposition: [Product Name]

**Target Customer:** [Precisely defined segment -- role, company size, behavioral qualifier]
**Primary Competitive Alternative:** [What they use today]
**Intended Use:** [Website / Pitch Deck / Sales Script / Internal Alignment / etc.]
**Date:**

---

### Customer Profile

**Jobs to Be Done (ranked by importance):**
| # | Job Statement | Type | Importance | Job Story Validation |
|---|--------------|------|-----------|---------------------|
| J1 | [Specific task the customer is trying to accomplish] | Functional / Social / Emotional | Critical | When [situation], I want to [motivation], so I can [outcome] |
| J2 | [Job] | [Type] | Important | [Job story] |
| J3 | [Job] | [Type] | Nice-to-have | [Job story] |

**Pains (ranked by severity, 1-5):**
| # | Pain | Type | Severity (1-5) | Current Workaround | Workaround Cost |
|---|------|------|---------------|-------------------|----------------|
| P1 | [Specific frustration, obstacle, or risk] | Outcome / Obstacle / Risk | 5 | [What they do today] | [Time, money, or emotional cost of workaround] |
| P2 | [Pain] | [Type] | [Score] | [Workaround] | [Cost] |
| P3 | [Pain] | [Type] | [Score] | [Workaround] | [Cost] |

**Gains (ranked by desirability):**
| # | Gain | Category | Desirability | Currently Achieved? | Achievement Method |
|---|------|----------|-------------|--------------------|--------------------|
| G1 | [Specific desired outcome] | Required / Expected / Unexpected | Must-have | No / Partially / Yes | [How they get it today, if at all] |
| G2 | [Gain] | [Category] | Should-have | [Status] | [Method] |
| G3 | [Gain] | [Category] | Nice-to-have | [Status] | [Method] |

---

### Value Map

**Pain Relievers:**
| Product Feature / Capability | Pain Addressed | Mechanism (How It Relieves) | Coverage |
|-----------------------------|---------------|----------------------------|---------|
| [Specific feature] | P1 | [Exact mechanical description of how the pain is eliminated or reduced] | Complete / Substantial / Partial |
| [Feature] | P2 | [Mechanism] | [Coverage] |
| [Feature] | P3 | [Mechanism] | [Coverage] |

**Gain Creators:**
| Product Feature / Capability | Gain Created | Mechanism (How It Creates) | Strength |
|-----------------------------|-------------|---------------------------|---------|
| [Specific feature] | G1 | [Exact mechanical description of how the gain is produced] | Substantial / Moderate / Minimal |
| [Feature] | G2 | [Mechanism] | [Strength] |

---

### Fit Assessment

**Overall Fit Quality:** [Strong / Moderate / Weak] -- [One-sentence rationale]

**Strong Fit (direct match on highest-priority needs):**
- [Job/Pain/Gain with direct product match -- explain why this is strong]
- [Second strong fit area]

**Partial Fit (addressed but not fully):**
- [Need that is partially addressed -- what is missing]
- [Second partial fit area -- note whether this is a roadmap priority or intentional scope decision]

**Gaps (important customer needs not addressed):**
- [Gap 1 -- be specific about the unaddressed need and its severity]
- [Gap 2]

**Fit Recommendation:** [If fit is weak on required gains or the top 2 highest-severity pains, state explicitly that the product needs development before investing in messaging. If fit is strong, confirm that the value proposition is ready to be written and tested.]

---

### Value Proposition Statements

**Variant 1 -- Functional (what it does):**
> For [precisely described segment] who [highest-importance job], [product] is the [category] that [primary pain reliever mechanism]. Unlike [specific alternative with behavioral description], [product] [mechanically distinct differentiator].

**Variant 2 -- Emotional (how it feels):**
> [Product] gives [segment] [emotional job outcome] by [mechanism], so they no longer [highest-severity pain as an emotional experience -- use customer language, not founder language].

**Variant 3 -- Outcome-based (what they achieve):**
> [Segment] use [product] to [functional job outcome]. On average, they [quantified result: time / money / error rate / speed] compared to [specific alternative]. [Proof point source or "To be validated -- see below"].

**Specificity check:** [Does each variant pass the substitution test -- could a competitor's name replace the product name and still be true? If yes, flag it and note what needs to be made more specific.]

**Recommended variant for [stated use context]:** [Variant number and name] -- [Rationale: why this variant fits the channel, audience, and funnel stage]

---

### Proof Points

| # | Claim Supported | Evidence | Type | Strength |
|---|----------------|----------|------|---------|
| 1 | [Specific claim from the value proposition] | [Data point, testimonial, case study, or mechanism claim] | Quantified outcome / Testimonial / Mechanism / Third-party | Strong / Moderate / Directional |
| 2 | [Claim] | [Evidence] | [Type] | [Strength] |
| 3 | [Claim] | [Evidence] | [Type] | [Strength] |

**Validation plan (for unproven claims):**
- **Claim to validate:** [The most important unproven claim]
- **Measurement method:** [Exactly what to measure and how]
- **Minimum sample:** [How many customers or data points constitute a credible result]
- **Confirmation threshold:** [What result confirms the claim vs. what result should trigger a repositioning]
- **Timeline:** [When to run the validation and when to update the value proposition based on results]
```

---

## Rules

1. **Never skip the customer profile.** A value proposition written from the product outward -- starting with features -- consistently overstates differentiation and underweights what customers actually care about. Always map jobs, pains, and gains first, even if it means the product looks weaker than the user expected.

2. **Pains must include the current workaround and its cost.** The workaround defines the real competitive baseline. If a customer spends $400/month on a part-time bookkeeper, the value proposition competes against $400/month, not against a competitor's software price. Missing this context produces value propositions that undervalue the product's economic benefit.

3. **Every pain reliever and gain creator must cite a specific canvas item by reference number.** Pain relievers without corresponding pains, and gain creators without corresponding gains, are features asserting their own value without proof. Remove them or find the pain or gain they address.

4. **Rank everything.** A value proposition that tries to say everything says nothing. The customer profile must be ranked by importance, severity, and desirability. The value proposition leads with the single most important job, the highest-severity pain, or the must-have gain -- never a laundry list.

5. **The differentiation claim must be mechanically specific.** "Easier to use" fails the substitution test -- any competitor can claim it. "Categorizes expenses automatically by reading bank transaction descriptions with no manual tagging required, versus [competitor] which requires the user to apply category rules manually" is specific. If the user cannot name the mechanism of differentiation, probe for it before writing the statement.

6. **Gaps are mandatory to identify and must be stated honestly.** A value proposition canvas that has no gaps is either a perfect product or an analysis that hasn't been done rigorously. Every real product has gaps. Naming them allows the user to make a scope decision: accept the gap, roadmap it, or acknowledge it to customers. Hiding gaps produces value propositions that collapse under scrutiny.

7. **Proof points must distinguish between confirmed and claimed.** Label every proof point with its evidential status: confirmed with sample size, directional without statistical significance, testimonial (one customer's experience), or "to be validated." A proof point labeled "to be validated" with a validation plan is legitimate. An unqualified claim presented as fact is not.

8. **The fit assessment must include a readiness recommendation.** If the product's fit is weak -- it doesn't substantially address the top two highest-severity pains or the must-have gains -- explicitly tell the user that investing in messaging before strengthening the product will produce marketing spend that fails to convert. This is the most valuable thing the analysis can communicate.

9. **Never use these six words in a value proposition statement:** "easy," "best," "innovative," "powerful," "seamless," "robust." These words are universally claimed and never believed. Replace each one with the specific mechanism or outcome that earns the description.

10. **Produce three variants and recommend one.** The user needs variants because they will use the value proposition in multiple contexts, and the right emphasis changes by channel and audience. But always close with a recommendation: which variant to use for the context the user described, and why. Giving options without a recommendation forces the user to do the decision-making the skill is supposed to do.

11. **For B2B products, distinguish between the buyer and the user.** A CFO buying expense management software has different jobs, pains, and gains than the employee using it daily. If these diverge materially, create a separate customer profile for each and note how the value proposition must be adapted for each audience.

12. **The "do nothing" alternative is always a competitor.** If the user says they have no competitors, reframe: the customer's current behavior -- whether that is a spreadsheet, a phone call, a manual process, or simply not solving the problem -- is always the default alternative. The value proposition must outcompete inertia, not just named software.

---

## Edge Cases

### Early-Stage Product With No Customers and No Proof Points
When the user has not yet shipped a product or has fewer than 10 active customers, every proof point is a hypothesis. Do not write outcome-based statements with specific numbers (e.g., "saves 5 hours/month") without labeling them as projections or assumptions. Instead, build the value proposition around the mechanism: what is the specific capability that should produce the outcome? Then design a validation sprint: identify the three claims the value proposition hinges on, define exactly how to measure them with the first 20-50 customers, and set confirmation thresholds before writing copy. This creates a hypothesis-driven value proposition that is intellectually honest and investor-credible.

### Commodity Product With Minimal Functional Differentiation
When the core product is functionally equivalent to competitors -- same features, similar pricing, similar performance -- the value proposition must shift from product to experience, relationship, or business model. Examine: onboarding time (if faster, quantify it), customer support response time and resolution rate (if better, prove it), pricing model structure (if simpler or lower-risk, explain the contrast), integration ecosystem (if broader or more relevant to the segment, list the specific integrations), or the team's domain expertise (if the team has credentials that translate to customer outcomes, cite them). The value proposition for a commodity product often lives in the service layer or the pricing architecture, not the feature set.

### Two-Sided Platform or Marketplace
A marketplace has two distinct customer profiles -- typically suppliers and buyers -- with interdependent value propositions. Map the canvas separately for each side. Then identify the network effect gain creators: the platform's value for each side increases as the other side grows. State this explicitly in both value maps: "As the number of [buyers] on the platform increases, [suppliers] gain access to [X more potential transactions per month]." Ensure the value proposition for the side you are acquiring first (usually the supply side for marketplaces) is strong enough to stand alone before the network effect materializes. The chicken-and-egg problem is a fit gap -- name it and address how the product bridges it.

### Multiple Customer Segments With Different Priorities
When the product serves two or more materially different segments -- for example, both individual freelancers and 10-person agencies -- create a separate canvas for each segment. Jobs, pains, gains, and especially gain desirability rankings will differ. The product's pain relievers and gain creators may physically be the same features, but the mechanism description and relative importance will differ per segment. Write separate value proposition statements for each segment, then look for a highest-common-denominator statement that covers the most important shared elements. Use segment-specific statements in targeted channels and the shared statement on the general homepage or in broad awareness campaigns.

### Existing Value Proposition Needing Refinement
When the user already has a value proposition written and wants to improve it, start by reverse-engineering it against the canvas: identify which jobs, pains, and gains the existing statement addresses (explicitly or implicitly), and which it ignores. Compare the existing statement's emphasis to the ranked customer profile. The most common finding is that the existing statement leads with a nice-to-have gain while the must-have gain and highest-severity pains are absent or buried. A secondary common finding is that the differentiation claim is generic -- it passes no substitution test. After mapping the gap between the existing statement and the canvas, rewrite using the same process as a new value proposition, then present both the original and revised versions so the user can see what changed and why.

### Enterprise B2B Products With Multi-Stakeholder Buying Committees
In enterprise sales, the value proposition must work for multiple stakeholders who have different and sometimes conflicting jobs. A CISO cares about security and compliance (risk-type pains). A CFO cares about ROI and contract risk. An end-user cares about workflow integration and learning curve. A business unit owner cares about outcomes and vendor reliability. Map a brief customer profile for each primary stakeholder -- typically 3-4 roles -- and note where their priorities align (use these as core value proposition themes) and where they conflict (use these to anticipate objections). The enterprise value proposition statement should lead with the business outcome for the economic buyer and have supporting statements for each additional stakeholder. This is the basis of a multi-threaded sales narrative.

### Value Proposition for an Internal Product or Platform Team
When a product team is building internal tools -- developer platforms, internal APIs, shared data infrastructure -- the user and buyer are different from external products, but the canvas still applies. Internal customers have jobs, pains, and gains that are just as specific and rankable. The "competitive alternative" is typically the team building it themselves or tolerating a broken process. The proof points are engineering-hours saved, incident rates reduced, or deployment frequency increased. Apply the full canvas process. The most common mistake in internal platform value propositions is leading with the technical capability ("we built a unified data pipeline") rather than the job it enables ("data teams can ship ML features in 2 days instead of 3 weeks"). Always translate capability to job outcome.

### Value Proposition Invalidated by Market Research or Customer Feedback
If the user presents research showing that customers do not value what the product delivers -- for example, customers rate the top feature as "nice to have" while listing an unaddressed need as "critical" -- do not paper over the finding with better messaging. The value proposition canvas will show a fit gap that messaging cannot fix. Explicitly tell the user that the finding suggests a product strategy problem, not a messaging problem. Recommend that the customer profile be updated with the research findings and the fit assessment be rerun before investing in new copy. A value proposition built on a validated canvas is the outcome of product-market fit work, not a shortcut to it.

---

## Example

**Input:** "We're building a contract management tool for in-house legal teams at mid-market companies (200-2,000 employees, 1-5 lawyers). Right now those teams use a combination of shared drives, email threads, and manual tracking spreadsheets to manage contracts. Some use legacy CLM software that's expensive and requires IT to configure. We auto-extract key terms from uploaded contracts using AI, create a searchable contract repository, and send renewal/expiration alerts automatically. We want to put together our value proposition for our sales deck and for our website."

**Output:**

---

## Value Proposition: Lexis Contract Intelligence

**Target Customer:** In-house legal teams at mid-market companies (200-2,000 employees), 1-5 lawyers, managing 200-2,000 active contracts without a dedicated legal ops function
**Primary Competitive Alternative:** Shared drives (Google Drive / SharePoint) + email + manual spreadsheet tracking; secondary alternative is legacy CLM software (Ironclad, Icertis) requiring IT configuration
**Intended Use:** Sales deck (enterprise slide) + website hero section
**Date:** Current

---

### Customer Profile

**Jobs to Be Done (ranked by importance):**
| # | Job Statement | Type | Importance | Job Story Validation |
|---|--------------|------|-----------|---------------------|
| J1 | Know when contracts expire or auto-renew before it's too late to act | Functional | Critical | When I'm managing 400+ contracts across multiple vendors, I want to see upcoming renewals 90 days out, so I can negotiate or exit before we're locked in for another year |
| J2 | Find a specific contract and its key terms in under 2 minutes when a business partner asks | Functional | Critical | When a Finance colleague asks about a vendor's liability cap during a dispute, I want to retrieve the contract and find the clause immediately, so I don't spend 45 minutes searching email threads |
| J3 | Demonstrate that legal is a business-enabling function, not a bottleneck | Social | Important | When the CFO asks about contract risk exposure, I want to give a confident, data-backed answer, so I'm seen as a strategic partner rather than a paper-pushing function |
| J4 | Feel in control of legal risk rather than constantly waiting for something to go wrong | Emotional | Important | When I know a contract is sitting somewhere untracked, I want assurance that I'm not missing an obligation, so I'm not woken up by a missed termination deadline |
| J5 | Onboard a new legal hire or outside counsel efficiently by sharing contract context | Functional | Nice-to-have | When a new associate joins, I want them to access full contract history in one place, so I'm not spending 2 days briefing them manually |

**Pains (ranked by severity, 1-5):**
| # | Pain | Type | Severity (1-5) | Current Workaround | Workaround Cost |
|---|------|------|---------------|-------------------|----------------|
| P1 | Missing contract renewal deadlines because reminders live in someone's personal calendar or don't exist at all | Undesired outcome | 5 | Individual calendar alerts set manually; shared spreadsheet with expiration dates updated inconsistently | Auto-renewal traps averaging $15K-$40K in unwanted vendor commitments per incident; reputational cost to legal team |
| P2 | Spending 30-60 minutes finding a contract and extracting specific clause language when a business partner needs it urgently | Obstacle | 5 | Search email threads; check three different shared drive folders; call the person who signed it | 3-5 hours/week per lawyer on contract retrieval; legal team seen as slow |
| P3 | No visibility into aggregate exposure across all contracts -- indemnification caps, governing law, data processing obligations -- for regulatory or audit purposes | Undesired outcome | 4 | Manual audit every 6-12 months; consultant hired at $5K-$15K per engagement | Compliance gaps discovered late; audit preparation takes weeks |
| P4 | Legacy CLM systems require months of IT configuration, custom field mapping, and expensive professional services before the team can use them | Obstacle | 4 | Tolerate broken process rather than implement legacy CLM; pay $50K-$200K in implementation fees | IT dependency; 6-12 month implementation delays; legal team uses workarounds during rollout |
| P5 | Tribal knowledge: only one person knows where a specific contract is or what it says | Risk | 3 | Rely on institutional memory; accept single point of failure | When that person leaves, onboarding replacement takes weeks; business decisions stall |

**Gains (ranked by desirability):**
| # | Gain | Category | Desirability | Currently Achieved? | Achievement Method |
|---|------|----------|-------------|--------------------|--------------------|
| G1 | Automatic alerts for every contract renewal, expiration, and notice deadline -- no manual tracking | Required | Must-have | No | Manual spreadsheet updated inconsistently; calendar alerts miss team members |
| G2 | Full-text searchable contract repository that returns results in seconds, not minutes | Required | Must-have | Partially | Drive search works only if you know the filename; key term search doesn't exist |
| G3 | AI extraction of key terms (parties, value, term, renewal conditions, liability caps) without manual data entry | Expected | Should-have | No | Manual entry into spreadsheet when teams bother to track at all |
| G4 | Portfolio-level reporting: how many contracts expire in Q3, total spend under contract, jurisdictional exposure | Unexpected | Nice-to-have | No | Not available without multi-week audit |
| G5 | Same-day onboarding with no IT involvement -- legal team sets it up themselves | Expected | Should-have | No -- legacy CLM | IT dependency for legacy tools; months-long rollout |

---

### Value Map

**Pain Relievers:**
| Product Feature / Capability | Pain Addressed | Mechanism (How It Relieves) | Coverage |
|-----------------------------|---------------|----------------------------|---------|
| Automated renewal and expiration alerts with configurable lead time (30/60/90 days) | P1 | System reads AI-extracted contract dates and sends alerts to designated recipients automatically -- no calendar entry required, no single person responsible | Complete |
| Full-text and clause-level search across the entire repository | P2 | AI extracts and indexes all clause text at upload; search returns the specific page, clause, and extracted value in under 5 seconds regardless of filename or folder structure | Complete |
| AI key-term extraction on upload (parties, effective date, term, renewal type, liability cap, governing law, data processing addendum flags) | P3 | Extracted fields are standardized across all contracts and queryable in aggregate -- legal can filter "all contracts with uncapped indemnification" in one query | Substantial |
| No-IT, self-serve onboarding: upload contracts, invite team, configure alerts -- live in under 2 hours | P4 | Product designed for legal team self-administration; no custom field mapping required for core use case; integrates with Google Drive and SharePoint via OAuth with no IT credentials | Complete |
| Shared repository replaces individual ownership of contract knowledge | P5 | Every contract is accessible to every team member with appropriate permissions; activity log shows who accessed or modified each record | Substantial |

**Gain Creators:**
| Product Feature / Capability | Gain Created | Mechanism (How It Creates) | Strength |
|-----------------------------|-------------|---------------------------|---------|
| Automated alerts with team-level distribution | G1 | Eliminates calendar-based tracking entirely; alerts fire automatically at configured intervals to all designated recipients | Substantial |
| Full-text search with clause-level indexing | G2 | Returns exact contract language in seconds; search works on terms, party names, dates, values, and clause types -- not just filename | Substantial |
| AI extraction at upload with no manual entry required | G3 | Eliminates data entry step; accuracy validated at 91% field extraction across standard commercial contracts; team reviews exceptions flagged by the system rather than entering all fields | Substantial |
| Portfolio dashboard with expiration timeline, contract type distribution, total commitment value by quarter | G4 | Available immediately after repository is populated; no custom report configuration required | Moderate |
| Browser-based, no-install product with 2-hour onboarding SLA | G5 | Legal team lead completes setup, connects Drive, uploads contracts, invites colleagues -- no IT ticket, no procurement cycle for deployment | Substantial |

---

### Fit Assessment

**Overall Fit Quality:** Strong -- the product directly addresses both critical-severity pains (P1, P2) and both must-have gains (G1, G2) with complete or substantial coverage. Fit is strongest for the primary jobs J1 and J2.

**Strong Fit (direct match on highest-priority needs):**
- P1 / G1 -- Missed renewal deadlines: the automated alert system completely replaces the manual calendar-and-spreadsheet workaround. This is the single highest-severity pain and the must-have gain; strong fit here anchors the value proposition
- P2 / G2 -- Contract retrieval speed: full-text and clause-level search with AI indexing addresses the 30-60 minute retrieval pain with a mechanism that reduces it to under 5 seconds. The specificity of the mechanism (clause-level, not just document-level) is a differentiating point versus Drive search

**Partial Fit (addressed but not fully):**
- P3 / G4 -- Aggregate portfolio reporting: AI extraction covers the data collection part (substantial), and the portfolio dashboard provides visibility, but compliance-grade reporting (e.g., GDPR data processing inventory, SOC 2 vendor obligation tracking) is not yet built. Teams with active regulatory obligations may find this insufficient for audit purposes -- flag as Q3 roadmap item
- P5 / (no dedicated gain) -- Tribal knowledge: the shared repository substantially addresses the single-point-of-failure risk, but the product does not yet have role-based access controls granular enough for large teams or for segregating sensitive M&A contracts from standard vendor agreements

**Gaps (important customer needs not addressed):**
- No native e-signature or contract authoring: customers who want to draft, negotiate, and sign within one tool will find this product incomplete. This is an intentional scope decision (the product is a repository and intelligence layer, not a drafting tool), but it must be named in sales conversations to avoid late-stage objection surprises
- No integration with outside counsel billing or matter management systems: teams using law firm portals or matter management software (Clio, SimpleLegal) cannot sync contract records automatically -- a manual upload step remains

**Fit Recommendation:** Fit is strong enough to invest in messaging and go-to-market. The two highest-severity pains are fully addressed and the two must-have gains are substantially delivered. The gaps are in adjacent workflows (authoring, billing) that are intentionally out of scope. The partial fit areas (compliance reporting, granular RBAC) should be noted in the sales process as known roadmap items to prevent churn from compliance-heavy customers who discover these limits post-sale.

---

### Value Proposition Statements

**Variant 1 -- Functional (what it does):**
> For in-house legal teams at mid-market companies managing contracts across shared drives and spreadsheets, Lexis Contract Intelligence is the AI-powered contract repository that automatically extracts key terms, sends renewal and expiration alerts before deadlines, and returns any contract clause in under 5 seconds. Unlike legacy CLM tools that require months of IT configuration, Lexis is operational in under 2 hours with no IT involvement.

**Variant 2 -- Emotional (how it feels):**
> Lexis gives in-house lawyers at lean mid-market teams the confidence that no renewal date, liability cap, or expiration deadline will slip through the cracks -- so they stop managing contracts by memory and calendar reminders, and start showing up to the CFO's questions with answers instead of apologies.

**Variant 3 -- Outcome-based (what they achieve):**
> In-house legal teams at mid-market companies use Lexis to eliminate missed contract renewals and cut contract retrieval time from 45 minutes to under 5 seconds. Early customers have avoided an average of $22K in auto-renewal trap costs in the first 12 months and reduced weekly contract administration time by 4 hours per lawyer. [Based on 38 customers tracked at 6-month mark.]

**Specificity check:** All three variants pass the substitution test -- the 2-hour onboarding claim, the 5-second retrieval mechanism, and the $22K auto-renewal trap figure are specific to this product's capabilities and early customer data. A generic CLM vendor cannot truthfully use these claims.

**Recommended variant for sales deck:** Variant 3 (Outcome-based) -- enterprise buyers need a business case, and the $22K auto-renewal trap figure and 4 hours/week recovery make the ROI concrete. Open the slide with the outcome statement, then support it with Variant 1 to explain the mechanism, and close with the social proof (n=38 customers, 6-month data).

**Recommended variant for website hero section:** Variant 2 (Emotional) as the headline, with Variant 3's quantified outcome as a supporting subhead directly below. Problem-aware visitors scanning the homepage need to feel understood before they will read the feature explanation.

---

### Proof Points

| # | Claim Supported | Evidence | Type | Strength |
|---|----------------|----------|------|---------|
| 1 | Customers avoid an average of $22K in auto-renewal trap costs in year one | 38 customers surveyed at 6-month mark; self-reported costs of unexpected auto-renewals in prior 12 months vs. post-implementation | Quantified customer outcome (n=38) | Moderate -- self-reported; recommend independent validation with contract audit comparison |
| 2 | Contract retrieval time reduced from 45 minutes to under 5 seconds | Time-to-retrieve measured in onboarding sessions (n=12); task: find indemnification cap for a named vendor | Quantified outcome (n=12, small sample) | Directional -- strengthen with n=50 |
| 3 | Operational in under 2 hours with no IT involvement | Median onboarding time tracked across 38 customers: 1 hour 47 minutes from account creation to first alert configured | Quantified operational metric (n=38) | Strong |
| 4 | AI key-term extraction accuracy of 91% on standard commercial contracts | Internal benchmarking against 500 manually reviewed contracts; tested on NDAs, MSAs, SaaS agreements, and vendor supply agreements | Mechanism claim with internal benchmark | Moderate -- publish methodology for credibility |
| 5 | 4 hours/week per lawyer recovered on contract administration | Time-diary study, n=22 lawyers, 4-week pre/post comparison | Quantified outcome (n=22) | Moderate -- small sample; recommend 6-month follow-up study at n=100 |

**Validation plan (for claims needing strengthening):**
- **Claim to validate:** $22K average auto-renewal trap cost avoidance (the anchor ROI claim for enterprise sales)
- **Measurement method:** For next 50 customers, collect: (a) number of auto-renewals triggered in prior 12 months before Lexis, (b) cost of each (vendor invoice value or exit penalty), (c) number of renewal alerts fired by Lexis in first 6 months, (d) customer-reported action taken on each alert (negotiated, exited, or renewed intentionally). Calculate avoided cost as renewals that would have auto-triggered without the alert
- **Minimum sample:** 50 customers with at least 6 months of Lexis data and at least 1 renewal event during the period
- **Confirmation threshold:** If median avoided cost is above $10K, the "$22K average" claim can be maintained. If median falls below $10K, reposition to "recover the cost of Lexis in the first avoided auto-renewal" -- which is true at any positive avoidance figure
- **Timeline:** Run at month 6 of each customer cohort; update the sales deck and website with refreshed figures quarterly
