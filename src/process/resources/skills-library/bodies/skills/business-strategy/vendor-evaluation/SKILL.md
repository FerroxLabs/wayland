---
name: vendor-evaluation
description: |
  Produces a vendor evaluation scorecard with weighted criteria, scoring
  guide, vendor comparison, and recommendation using weighted scoring
  methodology. Use when the user asks to evaluate vendors, compare
  suppliers, build a vendor selection scorecard, create an RFP evaluation
  matrix, or make a structured vendor selection decision.
  Do NOT use for competitive market analysis (use competitive-analysis),
  partnership agreement structuring (use partnership-agreement-outline),
  or procurement contract review (requires legal review).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "analysis planning decision-making template"
  category: "business-strategy"
  subcategory: "operations"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Vendor Evaluation

## When to Use

**Use this skill when:**
- A user needs to select a software platform, SaaS tool, managed service, or physical goods supplier from multiple competing vendors and wants a structured, defensible decision process
- A user is building an RFP evaluation matrix to score vendor responses against stated requirements and wants consistent criteria applied across all submissions
- A user needs to justify a vendor selection to a procurement committee, CFO, or board and requires documented scoring rationale -- not just a gut-preference recommendation
- A user is consolidating vendors (e.g., reducing from four marketing tools to one platform) and needs to evaluate whether an incumbent earns retention or should be replaced
- A user is renewing an existing vendor contract and wants to re-evaluate whether the incumbent still offers the best value compared to emerging alternatives
- A user is conducting a formal strategic sourcing exercise for a category spend above $50K/year where cost savings and risk reduction both matter
- A user needs to compare a build-vs-buy decision where "build internally" is a legitimate alternative to external vendor selection

**Do NOT use this skill when:**
- The user wants to understand how their own product or service compares to competitors in the market -- use `competitive-analysis` instead
- The user needs to structure a strategic partnership, channel agreement, or co-sell arrangement -- use `partnership-agreement-outline` instead
- The user needs to review, redline, or assess the legal terms of a vendor contract -- that requires legal counsel and is outside the scope of scoring
- The user has already selected a vendor and wants onboarding or implementation planning -- this skill covers the selection decision only
- The evaluation involves only a single vendor and the real question is whether to buy at all -- that is a build-vs-buy or ROI analysis, not a vendor comparison
- The purchase is transactional, low-value (under $5K total), and the stakes do not justify a formal scoring process -- a simple pro/con list is sufficient

---

## Process

### Step 1: Gather Decision Context Before Producing Any Output

Never produce a scorecard until you understand the decision fully. Missing context at this stage causes criteria misalignment, wrong weights, and a scorecard that does not reflect the real decision.

- Identify **what is being purchased**: a software platform, a physical product category, a managed service, a professional service engagement, or a combination. The category determines which criteria clusters are most important.
- Confirm the **budget envelope**: a hard ceiling versus a soft target. A $50K ceiling is a mandatory filter; a "$50K target" is a scoring criterion. Treat them differently.
- Establish the **decision timeline**: when must the vendor be selected, and when must implementation begin? Compressed timelines require reducing criteria to the critical 5-7 factors and noting which criteria were skipped.
- Identify **all decision stakeholders** and their specific priorities. A CFO prioritizes total cost of ownership and financial stability. A CTO prioritizes integration, security, and scalability. An operations manager prioritizes ease of use and support responsiveness. Weight assignments must reflect the actual stakeholder mix.
- Document **mandatory (pass/fail) requirements** before opening the weighted scoring. These are binary gates: a vendor that cannot meet a compliance requirement, a security standard, or a must-have integration is eliminated regardless of how well it scores on other dimensions.
- Identify the **number and names of vendors** being evaluated. Two to five vendors is the practical range. More than five creates evaluation fatigue and inconsistent scoring. If the user names more than five, help them reduce to a shortlist using a lightweight pre-qualification round based on mandatory requirements.
- Ask whether an **incumbent vendor** is in the evaluation. If yes, flag familiarity bias explicitly and ensure the incumbent is scored on current capability, not relationship history.

---

### Step 2: Define the Criteria Taxonomy for This Category

Criteria are not generic across purchases. A software platform evaluation and a logistics supplier evaluation have fundamentally different criteria. Build the taxonomy from the specific purchase category.

**Standard criteria clusters and their typical weight ranges by category:**

| Cluster | SaaS/Software | Managed Service | Physical Goods/Supplier |
|---------|--------------|----------------|------------------------|
| Functional Fit | 25-35% | 20-30% | 15-25% |
| Total Cost of Ownership | 15-25% | 20-30% | 30-40% |
| Vendor Stability & Risk | 10-15% | 15-20% | 10-15% |
| Implementation & Onboarding | 10-15% | 10-15% | 5-10% |
| Support & SLA | 10-15% | 15-20% | 10-15% |
| Scalability | 10-20% | 5-10% | 10-15% |
| Security & Compliance | 10-20% | 10-15% | 5-10% |
| Integration & Ecosystem | 10-15% | 5-10% | 3-8% |

- Within each cluster, break down to 2-4 specific sub-criteria. For example, "Functional Fit" for a CRM platform might contain: pipeline management capability, reporting and analytics, mobile usability, and data import/export. For a 3PL supplier, it contains: order fulfillment accuracy rate, geographic coverage, EDI integration, and returns processing.
- Limit the total criteria count to 8-12 weighted items. More than 12 creates false precision -- evaluators cannot meaningfully distinguish between 15 distinct dimensions.
- Separate **differentiating criteria** from **table-stakes criteria**. If every vendor will likely score 4 or 5 on a criterion (e.g., "has a web interface"), convert it to a pass/fail gate or remove it -- it adds no discrimination power to the scorecard.
- Document the rationale for each weight assignment in the scorecard. This prevents post-hoc score manipulation when a stakeholder dislikes the outcome.

---

### Step 3: Assign Weights Using a Structured Weighting Method

Weight assignment is the single point of highest subjectivity in the process. Use one of two methods depending on stakeholder alignment:

**Method 1 -- Direct Allocation (single decision-maker or aligned team):**
- Distribute exactly 100 points across all weighted criteria
- Start by assigning the most important criterion first, then work downward
- No single criterion should exceed 30% of total weight (over-weighting one factor defeats the multi-criteria purpose)
- No criterion included in weighted scoring should be below 5% (below 5%, the weight is cosmetic -- convert it to pass/fail or remove it)

**Method 2 -- Pairwise Comparison (disagreeing stakeholders):**
- List all criteria and compare each pair: "Is Criterion A more important than Criterion B for this decision?"
- Tally how many times each criterion wins its comparisons
- Convert win counts to percentage weights (wins / total comparisons = relative weight)
- This method surfaces hidden disagreements and prevents any one stakeholder from dominating the weighting
- Use this when procurement, IT, finance, and business owners are all involved and have competing priorities

**Weight review checkpoint:** Present the weights to all stakeholders and require sign-off BEFORE any vendor is scored. If weights shift after scoring has begun, the evaluation is compromised and must restart.

---

### Step 4: Build the Scoring Guide With Evidence Standards

A 1-5 scale only has value if every evaluator interprets scores identically. Generic definitions like "meets requirements" are insufficient.

**Standard scoring definitions with evidence thresholds:**

| Score | Label | Definition | Minimum Evidence Required |
|-------|-------|-----------|--------------------------|
| 1 | Does Not Meet | Capability is absent or vendor explicitly cannot deliver | Written vendor confirmation of gap, or absence in product documentation |
| 2 | Partial / Major Gaps | Capability exists but requires significant workarounds, custom development, or third-party tools not included in pricing | Demo showing gap, or vendor roadmap item not yet delivered |
| 3 | Meets Requirements | Capability is present, functional, and verified -- covers stated requirements with no material gaps | Demonstrated in product demo or documented in proposal with specifics |
| 4 | Exceeds Requirements | Capability goes beyond stated requirements with proven quality | Reference customer confirming capability in production, or benchmark data |
| 5 | Best-in-Class | Capability is a recognized competitive differentiator -- top quartile for this vendor category | Two or more independent references, industry analyst recognition, or head-to-head demonstration win |

- Evaluators should record the specific evidence type for every score they assign -- not just the number
- Prohibit scores of 5 without at least one external reference or independently verifiable data point
- When evaluating vendor financial stability, use specific indicators: Dun & Bradstreet scores, public revenue disclosures, venture funding runway (for startups), or years of profitability (for established vendors)
- For security and compliance criteria, require certifications as evidence (SOC 2 Type II, ISO 27001, HIPAA BAA, FedRAMP authorization) -- vendor claims without documentation score a 2 at most

---

### Step 5: Conduct the Evaluation in Phases

Structured evaluation phases prevent late-stage information from retroactively distorting earlier scores.

**Phase 1 -- Desk Review (before vendor contact):**
- Score vendors on publicly available information: website, product documentation, G2/Gartner Peer Insights reviews, financial disclosures, security certifications
- This establishes a baseline score before vendors begin their sales process -- baseline scores are less susceptible to presentation polish

**Phase 2 -- RFP Response Review:**
- Issue a structured RFP or questionnaire with specific questions mapped to each evaluation criterion
- Require vendors to answer each question in a specified format and word limit
- Flag non-answers and vague responses -- a vendor that avoids a direct question about uptime SLAs is telling you something important
- Score responses immediately after reading, before the next vendor's response, to prevent recency bias

**Phase 3 -- Demonstration and Proof of Concept:**
- Create a standardized demo script with 5-8 specific scenarios drawn from your actual use cases
- Do NOT let vendors lead their own demo agenda -- require them to demonstrate your use cases, not their highlights
- Invite end users (not just IT or procurement) to score usability dimensions firsthand during demos
- For high-stakes evaluations (over $100K), require a proof of concept with real data

**Phase 4 -- Reference Checks:**
- Contact at minimum two references per vendor: one that the vendor provides and one that you find independently
- Use a structured reference question script: ask about implementation timeline accuracy, support response times (not general quality), any capability gaps discovered after go-live, and whether they would make the same choice again
- Weight independently sourced references more heavily than vendor-provided references -- vendors curate favorable references

**Phase 5 -- Commercial and Risk Review:**
- Collect final pricing proposals with itemized cost breakdowns
- Request vendor financial disclosures if the contract value exceeds $250K or if the vendor is under 5 years old
- Verify compliance certifications are current (SOC 2 reports expire annually; verify the report date)

---

### Step 6: Calculate Weighted Scores and Validate the Math

Weighted score calculation is mechanical but must be validated to catch errors before the recommendation is made.

- For each criterion, the weighted score = raw score (1-5) × weight
- The maximum possible weighted score for a criterion = 5 × weight
- The maximum possible total score = 500 (if all criteria weights sum to 100 and all scores are 5)
- Report scores as both the raw weighted total and as a percentage of maximum (total / 500 × 100) for readability
- When two vendors are within 30 points of each other on a 500-point scale (6%), treat the scores as statistically tied -- the decision should then rest on qualitative factors, risk profile, and negotiating position rather than the numeric difference
- Recalculate all weighted scores independently before publishing. A transposed number in a high-weight criterion can flip the recommendation.

---

### Step 7: Generate the Recommendation With Full Context

The score is an input to the recommendation, not the recommendation itself. A vendor with a marginally lower score but lower switching risk, better references, or stronger financial stability may be the better choice.

- State the recommended vendor and its total weighted score
- Explain in 3-5 sentences why the score reflects the right choice for this organization's specific context -- reference the top-weighted criteria and the evidence that drove the highest-scoring criteria
- Identify the **single biggest risk** of the recommended vendor and a specific mitigation plan (not a generic "monitor the vendor")
- Name the runner-up and specify the exact scenario in which the runner-up becomes the better choice (e.g., "If the recommended vendor cannot provide SOC 2 Type II certification within 60 days of contract execution, advance to Vendor B")
- List 3-5 negotiation leverage points identified during the evaluation -- these are real commercial levers, not generic advice. Examples: a competing vendor's lower price, a capability gap the vendor acknowledged, implementation timeline risk the vendor's references described, or pricing that exceeds the vendor's published list price
- Provide next steps as a dated action list -- the evaluation ends when someone acts, not when the document is finished

---

## Output Format

```
## Vendor Evaluation: [Category and Specific Purchase Description]

**Purpose:** [One sentence describing what is being purchased and why]
**Budget:** [$X -- $Y total / per period]
**Contract Term:** [Expected contract length]
**Decision Date:** [Required by date]
**Implementation Required By:** [Date]
**Evaluators:** [Name, Role; Name, Role]
**Evaluation Date:** [Date completed]
**Vendors Evaluated:** [Vendor 1, Vendor 2, Vendor 3]

---

### Mandatory Requirements (Pass/Fail Gates)

*Vendors that fail any mandatory requirement are eliminated before weighted scoring.*

| Requirement | Basis | Vendor 1 | Vendor 2 | Vendor 3 |
|-------------|-------|----------|----------|----------|
| [Compliance/regulatory req] | [Standard name] | PASS | PASS | FAIL |
| [Security certification] | [Cert name + current date] | PASS | PASS | PASS |
| [Must-have integration] | [System name + API type] | PASS | FAIL | PASS |
| [Budget ceiling] | [$X/period max] | PASS | PASS | PASS |
| [Geographic/operational req] | [Specifics] | PASS | PASS | PASS |

**Eliminated:** [Vendor name] -- failed [requirement name]. Rationale: [one sentence].
**Advancing to weighted scoring:** [Vendor 1, Vendor 3]

---

### Evaluation Criteria and Weight Assignments

*Weights represent stakeholder-agreed priorities for this specific purchase. Agreed upon [date] by [names].*

| # | Category | Criterion | Weight | Rationale for Weight |
|---|----------|-----------|--------|---------------------|
| 1 | Functional Fit | [Specific capability] | [X]/100 | [Why this weight for this decision] |
| 2 | Functional Fit | [Specific capability] | [X]/100 | [Rationale] |
| 3 | Total Cost of Ownership | Year 1 all-in cost | [X]/100 | [Rationale] |
| 4 | Total Cost of Ownership | 3-year TCO | [X]/100 | [Rationale] |
| 5 | Vendor Risk | Financial stability | [X]/100 | [Rationale] |
| 6 | Vendor Risk | Vendor lock-in / exit cost | [X]/100 | [Rationale] |
| 7 | Support & SLA | Response time / uptime SLA | [X]/100 | [Rationale] |
| 8 | Support & SLA | Implementation success rate | [X]/100 | [Rationale] |
| 9 | Scalability | Capacity at 3x current volume | [X]/100 | [Rationale] |
| 10 | Security & Compliance | Certification currency | [X]/100 | [Rationale] |
| 11 | Integration | API capability / ecosystem | [X]/100 | [Rationale] |
| | **Total** | | **100** | |

---

### Scoring Guide

| Score | Label | Definition | Minimum Evidence Standard |
|-------|-------|-----------|--------------------------|
| 1 | Does Not Meet | Capability absent or vendor cannot deliver | Written confirmation of gap or absent from documentation |
| 2 | Partial -- Major Gaps | Capability exists but requires workarounds or unpriced custom work | Demo showed gap; roadmap item not yet released |
| 3 | Meets Adequately | Fully functional, covers requirements, no material gaps | Demonstrated in structured demo or documented in proposal |
| 4 | Exceeds | Goes beyond requirements with proven quality | Reference customer confirmed in production environment |
| 5 | Best-in-Class | Top-quartile capability; independently verifiable differentiator | 2+ independent references or analyst recognition |

---

### Vendor Scoring Matrix

| Criterion | Wt | [Vendor 1] Score | [V1] Wtd | [Vendor 3] Score | [V3] Wtd |
|-----------|----|-----------------|---------|-----------------|---------|
| [Criterion 1] | [X] | [1-5] / Evidence: [brief note] | [S×W] | [1-5] / Evidence: [brief note] | [S×W] |
| [Criterion 2] | [X] | [1-5] / [note] | [S×W] | [1-5] / [note] | [S×W] |
| [Criterion 3] | [X] | [1-5] / [note] | [S×W] | [1-5] / [note] | [S×W] |
| [Criterion 4] | [X] | [1-5] / [note] | [S×W] | [1-5] / [note] | [S×W] |
| [Criterion 5] | [X] | [1-5] / [note] | [S×W] | [1-5] / [note] | [S×W] |
| [Criterion 6] | [X] | [1-5] / [note] | [S×W] | [1-5] / [note] | [S×W] |
| [Criterion 7] | [X] | [1-5] / [note] | [S×W] | [1-5] / [note] | [S×W] |
| [Criterion 8] | [X] | [1-5] / [note] | [S×W] | [1-5] / [note] | [S×W] |
| [Criterion 9] | [X] | [1-5] / [note] | [S×W] | [1-5] / [note] | [S×W] |
| [Criterion 10] | [X] | [1-5] / [note] | [S×W] | [1-5] / [note] | [S×W] |
| [Criterion 11] | [X] | [1-5] / [note] | [S×W] | [1-5] / [note] | [S×W] |
| **TOTAL** | **100** | | **[X]/500** | | **[X]/500** |
| **% of Maximum** | | | **[X]%** | | **[X]%** |

---

### Total Cost of Ownership Comparison

*All costs in [currency]. Term: [X years]. Headcount basis: [X users / X units / X volume].*

| Cost Component | [Vendor 1] | [Vendor 3] | Notes |
|---------------|-----------|-----------|-------|
| License / subscription | [$X] | [$X] | [Per user / flat / tiered] |
| Implementation / setup | [$X] | [$X] | [Vendor estimate vs. market rate] |
| Data migration | [$X] | [$X] | [Complexity factor] |
| Training | [$X] | [$X] | [# users × hours × rate] |
| Integration development | [$X] | [$X] | [Named integrations] |
| Annual support / maintenance | [$X] | [$X] | [% of license or flat fee] |
| Year 1 Total | **[$X]** | **[$X]** | |
| Year 2 (recurring only) | [$X] | [$X] | |
| Year 3 (recurring only) | [$X] | [$X] | |
| **3-Year TCO** | **[$X]** | **[$X]** | |
| Cost per [unit/user/transaction] | [$X] | [$X] | [Normalized unit cost] |

**Hidden cost flags:**
- [Vendor 1]: [Any costs discovered in references or fine print not captured in proposal]
- [Vendor 3]: [Same]

---

### Vendor Risk Profiles

**[Vendor 1] -- Risk Assessment**
| Risk Category | Assessment | Severity | Mitigation |
|--------------|------------|---------|------------|
| Financial stability | [Revenue, funding, years in business] | Low/Med/High | [Specific action] |
| Vendor lock-in | [Data portability, export capability, switching cost estimate] | Low/Med/High | [Contract clause, data export requirement] |
| Implementation risk | [Track record from references] | Low/Med/High | [Milestone-based payment, penalty clauses] |
| Product roadmap | [Evidence of continued investment] | Low/Med/High | [Roadmap commitments in contract] |
| Key person dependency | [Support team depth] | Low/Med/High | [SLA with escalation path in contract] |

**[Vendor 3] -- Risk Assessment**
[Same structure]

---

### Vendor Profiles

**[Vendor 1]: [Legal Entity Name]**
- **Founded / HQ:** [Year, City]
- **Revenue / Funding:** [Public figure or estimated range]
- **Customer Count:** [Number or range]
- **Reference Summary:** [2-3 sentences from reference calls -- specific, not general]
- **Top 3 Strengths (with evidence):**
  1. [Strength] -- [Evidence source: demo, reference, documentation]
  2. [Strength] -- [Evidence]
  3. [Strength] -- [Evidence]
- **Top 3 Weaknesses (with evidence):**
  1. [Weakness] -- [Evidence source]
  2. [Weakness] -- [Evidence]
  3. [Weakness] -- [Evidence]
- **Pricing Model:** [Structure and key terms]

**[Vendor 3]: [Legal Entity Name]**
[Same structure]

---

### Recommendation

**Recommended Vendor:** [Vendor Name]
**Total Weighted Score:** [X]/500 ([Y]% of maximum)
**Runner-Up:** [Vendor Name] at [X]/500

**Recommendation Rationale:**
[3-5 sentences explaining the decision in plain language. Reference the top 2-3 criteria that drove the outcome and what specific evidence made the difference. Acknowledge any meaningful trade-off the organization is accepting.]

**Primary Risk and Mitigation:**
[The single most important risk of the recommended vendor and a specific, actionable mitigation -- not generic monitoring language. Include a contract clause, timeline, or measurable condition.]

**When to Advance to Runner-Up:**
[Specific trigger condition -- e.g., "If Vendor X cannot provide SOC 2 Type II documentation dated within the last 12 months within 30 days of LOI execution, advance to Vendor Y."]

**Negotiation Leverage Points:**
1. [Specific leverage point -- e.g., "Vendor Y quoted $X; use this to negotiate a [X]% reduction on Vendor X's Year 1 license fee"]
2. [Specific leverage point -- e.g., "References noted 3-month implementation delays; require milestone-based payment with 20% held until go-live"]
3. [Specific leverage point -- e.g., "Vendor's pricing exceeds published list price by 12%; request volume discount justification"]
4. [Specific leverage point -- e.g., "Vendor has excess capacity in Q[X]; timing the contract signature before [date] may yield free implementation support"]

**Next Steps:**
| Action | Owner | Deadline |
|--------|-------|---------|
| [Specific action] | [Role] | [Date] |
| [Specific action] | [Role] | [Date] |
| [Specific action] | [Role] | [Date] |
| [Specific action] | [Role] | [Date] |
```

---

## Rules

1. **Establish criteria and weights before revealing which vendor scores highest.** If weights are set after scoring begins, stakeholders consciously or unconsciously tune weights to favor a preferred outcome. This is the most common integrity failure in vendor evaluations. The weights must be agreed upon and documented before any scoring column is populated.

2. **Mandatory requirements are binary eliminators, not scored dimensions.** A vendor that cannot meet a compliance requirement (HIPAA, SOC 2, GDPR data residency) does not get partial credit in the weighted score -- it is removed from evaluation entirely. Combining mandatory requirements and weighted criteria in a single scoring table is a methodology error that allows non-compliant vendors to "score their way past" a hard requirement.

3. **Total cost of ownership must include implementation, migration, training, and integration costs, not just the subscription or unit price.** A vendor priced at $80K/year with $200K in implementation cost is more expensive in Year 1 than a vendor at $120K/year with a streamlined onboarding. Always normalize to 3-year TCO at minimum, and to 5-year TCO for any purchase with high switching costs.

4. **Every numeric score requires a named evidence source.** The format "Score: 4" is inadmissible. The format "Score: 4 -- confirmed in demo on [date], reference customer [company type] reported same capability in production" is the standard. Scores without evidence are opinions that cannot be defended in a committee review or audit.

5. **Scores within 6% of each other (30 points on a 500-point scale) are statistically tied.** Do not present a score of 412 vs. 388 as a clear winner. Tied scores require a qualitative tiebreaker analysis based on risk profile, reference quality, and strategic fit -- not a recount of the numbers.

6. **Vendor lock-in and exit cost must appear as an explicit scored criterion.** Organizations routinely underweight switching costs and overweight acquisition price. Vendor lock-in is a direct function of data portability (can you export everything in a standard format?), integration depth (how many internal systems touch this vendor?), and contractual exit terms (auto-renewal clauses, data deletion timelines, transition assistance obligations).

7. **Never allow vendors to set the demo agenda.** A vendor-led demo is a sales presentation optimized for the vendor's strengths. A structured evaluation demo requires vendors to demonstrate your specific use cases -- and documents the score immediately after each scenario, not after the full presentation when recency bias has set in.

8. **Reference checks must include at least one independently sourced reference.** Vendor-provided references are curated. Find at least one reference customer through LinkedIn, industry associations, or community forums who did not come through the vendor's sales team. Ask all references the same structured questions, including: "What was the biggest surprise after go-live?" and "What would you do differently in the selection process?"

9. **For startup vendors (under 5 years old or under $10M ARR), financial stability is a mandatory risk criterion, not an optional scored item.** Evaluate: total funding raised and runway at current burn rate, number of enterprise customers (not total customers), and whether a key-man dependency exists in support or product. A technically superior startup may be the right choice, but the risk must be explicitly priced in the recommendation.

10. **Procurement politics must be managed structurally, not just acknowledged.** When a stakeholder has a pre-existing preference, document the scoring criteria publicly before evaluation begins and require all evaluators to sign off on the weight assignments. If the politically preferred vendor loses on evidence, the decision-maker receives the scorecard with documented evidence for each score -- the disagreement then becomes an explicit override, not a hidden manipulation. Document any override and the stated reason.

11. **Do not score criteria that cannot be differentiated among the vendors in the set.** If all vendors are SOC 2 Type II certified, security certification adds no discrimination power -- convert it to a pass/fail gate. Scored criteria should be dimensions where vendors actually differ. Cosmetic criteria inflate the appearance of rigor without contributing to the decision.

12. **The recommendation must acknowledge the trade-off the organization is accepting.** No vendor is perfect. A recommendation that does not name what the organization is giving up (e.g., "accepting higher Year 1 cost in exchange for lower implementation risk") is incomplete. Decision-makers need to understand the cost of the choice, not just the conclusion.

---

## Edge Cases

**1. The incumbent vendor is in the evaluation**
Familiarity bias systematically inflates incumbent scores on qualitative dimensions (relationship quality, perceived support responsiveness) while obscuring capability gaps that have been normalized over time. Counter this by: (a) requiring evaluators who work daily with the incumbent to disclose their relationship bias and have a second evaluator independently score the incumbent on the same criteria; (b) adding a criterion specifically for "risk of change" -- this makes switching cost explicit rather than hidden in inflated incumbent scores; and (c) requiring the incumbent to respond to the same RFP as challenger vendors rather than accepting verbal confirmations of capability they've been providing for years. If the incumbent wins fair evaluation, the process validates the relationship. If they lose, the evidence is documented.

**2. One vendor is dramatically cheaper but meaningfully weaker on functional fit**
Separate the analysis into two recommendation tracks: "best fit" and "minimum viable." In the best-fit track, score all criteria as weighted. In the minimum viable track, identify which scored criteria represent true requirements versus nice-to-haves, remove the nice-to-haves from the weighted total, and recalculate. If the cheaper vendor wins under minimum-viable criteria, present the business the explicit cost of the functional gaps: what manual workarounds or third-party tools would be required, their cost, and their operational risk. Let the stakeholders make the trade-off with full information. Do not make the trade-off for them by burying the cheaper option.

**3. The evaluation must be completed in under one week**
A compressed timeline requires reducing scope, not skipping rigor. Take these specific steps: reduce weighted criteria to the 5-7 highest-weight items only; convert all remaining criteria to pass/fail gates; use a 3-point scoring scale (1 = does not meet, 2 = meets adequately, 3 = exceeds) instead of 5-point to reduce calibration debate; skip the proof-of-concept phase and rely on demos with your own use cases; conduct a single reference call per vendor rather than two; and document explicitly which evaluation phases were skipped and what risk that introduces into the recommendation. The compressed scorecard is valid but should be labeled as a time-constrained evaluation with identified gaps.

**4. Two vendors score within 6% of each other after full evaluation**
A tie requires a structured tiebreaker process, not a re-weighting exercise. Conduct a final qualitative assessment on three dimensions that are hard to quantify in a matrix: (a) executive sponsorship -- which vendor's leadership team is more personally invested in your success as a customer? Contact the account executive's manager and observe responsiveness; (b) contract flexibility -- which vendor offers better data portability, exit terms, and contractual protections? This has long-term value that scoring often underweights; and (c) reference quality -- compare the depth and specificity of reference feedback, not just the positive/negative ratio. Present the tiebreaker analysis alongside the scores and make a recommendation with an explicit rationale for why the chosen tiebreaker factors are most material to this organization.

**5. Vendors refuse to provide pricing until a contract stage**
This is a negotiating tactic by vendors who believe opacity benefits them. Counter it by: requiring all vendors to provide a best-estimate pricing range as a condition of continued evaluation; using published list prices (often publicly available on vendor websites or databases) as a ceiling assumption; contacting 2-3 reference customers to ask what they pay (customers frequently share this information); and scoring the non-disclosing vendor conservatively on TCO with a documented note that pricing was not provided on request. Never proceed to final recommendation without at least a range for all vendors -- a scorecard that omits cost from one vendor's comparison is not a complete evaluation.

**6. A vendor proposes significant customization to meet your requirements**
Custom development proposals require a separate risk assessment. Score the customized capability at a maximum of 3 (meets adequately) -- never 4 or 5 -- because custom development is a commitment, not a demonstrated capability. Add a criterion specifically for "implementation complexity" and weight it at least 10% when custom development is involved. Require the vendor to provide a milestone-based implementation plan with penalty provisions for delay before advancing them to final recommendation. Reference customers who received similar custom development are more valuable than standard reference customers in this scenario -- ask specifically about on-time delivery and scope creep.

**7. The purchase involves a single-source vendor with no alternatives**
When competitive evaluation is not possible (a unique proprietary technology, a sole-source regulatory requirement, or a specific partner ecosystem lock-in), the scorecard purpose shifts from vendor selection to commercial negotiation preparation and risk documentation. Score the vendor against objective capability benchmarks rather than against other vendors. Document the lock-in explicitly, assess the financial and operational risk of dependency, and use the evaluation process to identify every contractual protection that should be demanded: most-favored-nation pricing clauses, source code escrow arrangements, data portability guarantees, and committed roadmap provisions. The output is a risk-informed negotiation brief, not a selection recommendation.

**8. Evaluators disagree significantly on scores for the same vendor**
Score variance above 2 points on a 5-point scale for the same criterion between evaluators is a calibration failure -- it means evaluators are interpreting either the criterion or the evidence differently. Do not average divergent scores without resolution. Require evaluators to present their evidence and scoring rationale to each other and reconcile. If reconciliation fails, escalate to the decision authority to make a documented judgment call. The resolution process often reveals that the criterion itself is ambiguous and should be rewritten with more specific evidence standards before the evaluation continues.

---

## Example

**User Input:** "We need to select a data analytics and business intelligence platform for our 120-person B2B SaaS company. Finance, sales ops, and product teams are the main users. We have about 40 power users who build dashboards and 80 consumers. Budget is roughly $80K-$130K/year. Must integrate with our Snowflake data warehouse and our CRM. We're evaluating three vendors: Vendor A at $95K/year all-in quote, Vendor B at $72K/year but with $40K implementation cost, and Vendor C at $108K/year with a strong enterprise reputation. We need to decide in 6 weeks."

---

## Vendor Evaluation: Business Intelligence and Analytics Platform

**Purpose:** Select a BI/analytics platform to replace the current fragmented reporting environment and enable self-service analytics for finance, sales ops, and product teams
**Budget:** $80K -- $130K/year ($240K -- $390K over 3 years)
**Contract Term:** 3 years preferred; 1-year minimum acceptable
**Decision Date:** 6 weeks from initiation
**Implementation Required By:** Q1 next fiscal year
**Evaluators:** VP Finance (decision authority), Sales Ops Director, Head of Product Analytics, IT Infrastructure Lead
**Evaluation Date:** [Current]
**Vendors Evaluated:** Vendor A, Vendor B, Vendor C

---

### Mandatory Requirements (Pass/Fail Gates)

*Vendors failing any requirement are eliminated before weighted scoring.*

| Requirement | Basis | Vendor A | Vendor B | Vendor C |
|-------------|-------|----------|----------|----------|
| Native Snowflake connector (no third-party ETL required) | Architecture requirement | PASS | PASS | PASS |
| CRM integration (read + write back capability) | Sales ops requirement | PASS | PASS | PASS |
| SOC 2 Type II certification (current, within 12 months) | Security policy | PASS | FAIL | PASS |
| Annual cost within $130K ceiling (all-in Year 1) | Budget constraint | PASS ($95K) | PASS ($112K) | PASS ($108K) |
| Row-level security for multi-department data access | Compliance / data governance | PASS | PASS | PASS |

**Eliminated:** Vendor B -- SOC 2 Type II certification expired 14 months ago; renewal was "in progress" with no documentation provided. Security policy requires current certification. Vendor B is ineligible for weighted scoring.

**Advancing to weighted scoring:** Vendor A, Vendor C

*Note: Vendor B's Year 1 all-in cost was $72K license + $40K implementation = $112K. The cost advantage disappears when implementation is included. Even if security had been resolved, the cost case was weaker than initially presented.*

---

### Evaluation Criteria and Weight Assignments

*Weights agreed upon by all four evaluators on [date], before any vendor scores were assigned. Rationale documented below.*

| # | Category | Criterion | Weight | Rationale |
|---|----------|-----------|--------|-----------|
| 1 | Functional Fit | Self-service dashboard creation for non-technical users | 20 | 80 of 120 users are consumers; adoption depends on ease of use |
| 2 | Functional Fit | Advanced analytics and SQL-based modeling for power users | 15 | 40 power users need transformation logic and custom metrics |
| 3 | Total Cost of Ownership | 3-year all-in TCO | 18 | Multi-year cost significantly affects budget planning |
| 4 | Implementation | Time to value and implementation complexity | 10 | Q1 deadline creates hard constraint; delays are costly |
| 5 | Support & SLA | Support responsiveness and uptime SLA | 10 | Finance team cannot tolerate dashboard outages during close periods |
| 6 | Vendor Risk | Financial stability and product investment trajectory | 8 | Committing 3 years requires confidence in vendor continuity |
| 7 | Vendor Risk | Vendor lock-in / data portability | 7 | Switching cost is high; contract exit terms and data export matter |
| 8 | Scalability | Performance at 3x current data volume and user count | 7 | Company is growing 40% per year; must not need to re-platform in 18 months |
| 9 | Ecosystem | Embedding and API capability for product team use cases | 5 | Product team wants to embed analytics in customer-facing product |
| **Total** | | | **100** | |

---

### Scoring Guide

| Score | Label | Definition | Minimum Evidence Standard |
|-------|-------|-----------|--------------------------|
| 1 | Does Not Meet | Capability absent or explicitly unavailable | Vendor confirmed gap in writing or absent from product documentation |
| 2 | Partial -- Major Gaps | Capability exists but requires significant workarounds or additional cost | Demo showed limitation; roadmap item not yet shipped |
| 3 | Meets Adequately | Fully functional for stated requirements, no material gaps | Demonstrated in structured use-case demo or documented in proposal |
| 4 | Exceeds | Goes beyond requirements; proven in production | Reference customer confirmed at scale in production environment |
| 5 | Best-in-Class | Top-quartile capability with independently verified evidence | 2+ independent references or industry analyst recognition |

---

### Vendor Scoring Matrix

| Criterion | Wt | Vendor A Score | V-A Wtd | Vendor C Score | V-C Wtd |
|-----------|----|---------------|---------|---------------|---------|
| Self-service UX for consumers | 20 | 5 -- Demo: drag-and-drop builder; 2 independent refs confirmed non-technical adoption within 2 weeks | 100 | 3 -- Demo functional but required training; ref noted 6-week ramp time | 60 |
| Advanced analytics for power users | 15 | 3 -- SQL modeling supported; no native dbt integration (workaround required) | 45 | 5 -- Native semantic layer; dbt integration confirmed by 2 power-user references | 75 |
| 3-year TCO | 18 | 4 -- $95K Yr1, $90K Yr2-3 = $275K; implementation included in quote | 72 | 3 -- $108K Yr1, $102K Yr2-3 = $312K; implementation $0 per proposal | 54 |
| Implementation timeline | 10 | 5 -- References confirmed 6-8 week go-live; milestone-based delivery standard | 50 | 3 -- References reported 12-16 week average; Q1 deadline is at risk | 30 |
| Support responsiveness / SLA | 10 | 4 -- 99.9% uptime SLA; 4-hour response for P1; dedicated CSM confirmed | 40 | 4 -- 99.95% uptime SLA; 2-hour P1 response; shared CSM at this contract value | 40 |
| Financial stability | 8 | 3 -- Series C ($85M raised), 600+ enterprise customers, not yet profitable | 24 | 5 -- Publicly traded; $420M ARR; 10 consecutive quarters of profitability | 40 |
| Vendor lock-in / exit cost | 7 | 4 -- Full data export in Parquet/CSV; 90-day transition assistance clause available | 28 | 3 -- Export available but no transition assistance; proprietary metric layer creates rework on exit | 21 |
| Scalability at 3x volume | 7 | 3 -- Demo showed query degradation above 500M rows; engineering confirmed caching required | 21 | 5 -- Benchmarked at 10B+ rows; referenced by 3 customers with 50x our data volume | 35 |
| Embedding and API capability | 5 | 3 -- Embedding available; API is REST-only; limited component-level embedding | 15 | 4 -- Full iFrame + SDK embedding; referenced by two SaaS companies embedding customer dashboards | 20 |
| **TOTAL** | **100** | | **395/500** | | **375/500** |
| **% of Maximum** | | | **79%** | | **75%** |

---

### Total Cost of Ownership Comparison

*All costs in USD. Term: 3 years. Basis: 40 creator seats + 80 viewer seats, current Snowflake data volume.*

| Cost Component | Vendor A | Vendor C | Notes |
|---------------|---------|---------|-------|
| Year 1 license / subscription | $95,000 | $108,000 | Vendor A includes implementation; Vendor C does not |
| Implementation / setup | Included | $0 vendor cost | Vendor C claims no-cost implementation; references contradict this -- see hidden cost flag below |
| Data migration from current tools | $8,000 (est.) | $8,000 (est.) | Internal IT estimate; equal for both |
| Training (40 power users × 4 hrs) | $6,000 | $12,000 | Vendor C charges for advanced training; Vendor A includes it |
| Integration development (CRM writeback) | $0 (native) | $0 (native) | Both vendors have native connector |
| Annual support (Year 2-3) | $0 additional | $0 additional | Included in subscription for both |
| Year 2 license renewal | $90,000 | $102,000 | 5% escalator Vendor A; 6% escalator Vendor C |
| Year 3 license renewal | $90,000 | $102,000 | Same escalators applied |
| **Year 1 All-In Total** | **$109,000** | **$128,000** | |
| **3-Year TCO** | **$299,000** | **$332,000** | |
| Cost per creator seat per year | $2,375 | $2,700 | Normalized per creator |
| Cost per viewer seat per year | $265 | $336 | Normalized per viewer |

**Hidden cost flags:**
- **Vendor A:** References noted that adding viewer seats beyond 80 triggers a per-seat overage at $120/seat/month -- significant if company grows 40% per year as planned. Model in 112 viewer seats in Year 2 = +$17,280/year potential overage.
- **Vendor C:** Three of four references reported a "professional services engagement" averaging $18K-$25K in the first 90 days despite vendor claiming zero implementation cost. Year 1 all-in likely $126K-$133K with realistic implementation.

---

### Vendor Risk Profiles

**Vendor A -- Risk Assessment**

| Risk Category | Assessment | Severity | Mitigation |
|--------------|------------|---------|------------|
| Financial stability | Series C, $85M raised, ~600 enterprise customers, unprofitable -- runway estimated 24-30 months at current burn | Medium | Require 12-month data export obligation in contract; escrow source code; annual financial health review clause |
| Vendor lock-in | Data exports in open formats; transition assistance clause available as negotiated term -- good portability posture | Low | Include 90-day transition assistance and full data export in Parquet format in contract |
| Implementation risk | References confirmed 6-8 week delivery consistently; milestone-based delivery is standard practice | Low | Include milestone payment: 50% at contract, 30% at data validation, 20% at go-live acceptance |
| Product roadmap | dbt native integration on roadmap for Q3; semantic layer investment is active | Medium | Require roadmap commitment language or price protection for dbt integration when released |
| Scalability | Performance degradation above 500M rows noted in demo; caching layer required | Medium | Conduct proof of concept with actual Snowflake data volume before contract signing |

**Vendor C -- Risk Assessment**

| Risk Category | Assessment | Severity | Mitigation |
|--------------|------------|---------|------------|
| Financial stability | Publicly traded; $420M ARR; 10 years profitable -- lowest financial risk in evaluation | Very Low | Standard annual review sufficient |
| Vendor lock-in | Proprietary semantic/metric layer creates significant rework on exit; no transition assistance in standard contract | High | Negotiate data portability clause and 60-day transition assistance as contract condition |
| Implementation risk | References averaged 12-16 weeks; Q1 deadline at significant risk; "no-cost" implementation claim contradicted by references | High | Require signed implementation timeline with milestone penalties before proceeding |
| Product roadmap | Mature platform; innovation pace slower than category; roadmap is incremental, not transformational | Low | Less relevant given 3-year stability of feature set |
| Hidden implementation cost | 3 of 4 references paid $18K-$25K in professional services in Year 1 despite "zero implementation" promise | High | Require written confirmation of zero professional services cost, or re-baseline TCO to $130K Year 1 |

---

### Vendor Profiles

**Vendor A**
- **Founded / HQ:** 2016, San Francisco
- **Revenue / Funding:** $85M raised (Series C, 2022); revenue estimated $35-45M ARR based on disclosed customer count and typical ACV
- **Customer Count:** ~600 enterprise customers publicly disclosed
- **Reference Summary:** Two independently sourced references (found via LinkedIn, not vendor-provided) both reported successful go-lives within 8 weeks. Both highlighted ease of adoption for non-technical users as the primary reason they selected Vendor A. One reference noted a Q4 outage of 3.5 hours that was handled with responsive communication but flagged as a concern for finance-close-period usage.
- **Top 3 Strengths:**
  1. Consumer-facing UX is category-leading -- demo and two independent references confirmed non-technical users build dashboards without training within 2 weeks
  2. Implementation reliability -- all four references reported on-time or early go-live, including one with Snowflake + CRM integration matching our stack exactly
  3. Transparent data portability -- full export in Parquet format is standard, not a negotiated add-on
- **Top 3 Weaknesses:**
  1. Scalability at high data volumes -- query performance degrades above 500M rows; caching mitigation exists but adds operational complexity
  2. Power-user depth -- no native dbt integration; SQL modeling works but is less sophisticated than Vendor C's semantic layer
  3. Financial runway risk -- Series C startup not yet profitable; 24-30 month runway estimated; acquisition or funding risk exists over a 3-year contract

**Vendor C**
- **Founded / HQ:** 2012, New York
- **Revenue / Funding:** Publicly traded; $420M ARR; EBITDA positive for 10 consecutive quarters
- **Customer Count:** 4,200+ customers disclosed in most recent earnings
- **Reference Summary:** Two vendor-provided references and one independently sourced. Independently sourced reference (e-commerce company, 300 users) reported an 18-week implementation, a $22K professional services engagement not in their original contract, and strong ongoing support quality. Both positive references were enterprise companies with dedicated implementation teams.
- **Top 3 Strengths:**
  1. Enterprise scalability -- benchmarked and referenced at multi-billion-row Snowflake datasets; zero performance concerns at 3x our data volume
  2. Power-user analytics depth -- native semantic layer, dbt integration, and SQL-based metric definitions are best-in-class for technical teams
  3. Financial stability -- publicly traded, profitable, and not dependent on continued fundraising; lowest platform-continuity risk in the evaluation
- **Top 3 Weaknesses:**
  1. Consumer UX requires training -- demo and references both confirm a
