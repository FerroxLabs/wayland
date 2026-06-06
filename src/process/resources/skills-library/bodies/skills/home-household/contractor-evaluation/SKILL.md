---
name: contractor-evaluation
description: |
  Provides a structured framework for evaluating and selecting home service
  contractors including roofers, plumbers, electricians, HVAC technicians, and
  general contractors. Covers vetting criteria, bid comparison, red flags, contract
  essentials, and payment structures. Use when the user needs to hire a contractor
  for home work, wants to compare bids, or needs to know what questions to ask
  before signing a contract. Do NOT use for DIY repair guidance (use specific
  maintenance skills), commercial construction bidding, or contractor licensing
  requirements by state.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-maintenance decision-making analysis"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Contractor Evaluation

## When to Use

Use this skill when the user presents one of these specific situations:

- **Hiring for a defined project:** User needs to hire a contractor for any home repair or improvement work -- roofing, plumbing, electrical, HVAC, structural work, additions, kitchen or bathroom renovation, siding, windows, flooring, painting, landscaping, or pest control
- **Bid comparison request:** User has received multiple bids (or a single bid) and wants to know if the price is fair, how to compare them, or which contractor to choose
- **Pre-hire due diligence:** User wants to know what questions to ask, what credentials to verify, or how to research a contractor before committing
- **Contract review before signing:** User has a contractor proposal or contract and wants to understand what it should contain, what is missing, or what terms are unfavorable
- **Payment dispute or mid-project concern:** User is already mid-project and has concerns about progress payments, change orders, or contractor performance
- **Post-bid confusion:** User received bids with dramatically different prices and does not know how to reconcile the difference
- **Contractor communication breakdown:** User is struggling to get clear answers from a contractor about scope, timeline, or costs

**Do NOT use this skill when:**
- User wants DIY repair instructions -- use trade-specific maintenance skills such as `plumbing-basics`, `hvac-maintenance`, `electrical-safety`, or `roof-inspection`
- User needs legal advice about a contractor dispute, breach of contract, or lien -- recommend consulting a construction attorney or state contractor licensing board
- User is evaluating contractors for commercial construction, tenant improvement, or property development -- commercial bidding follows entirely different processes (AIA contracts, bonding requirements, public bidding law)
- User needs guidance on contractor licensing requirements by state -- licensing law is jurisdiction-specific and changes frequently; direct them to their state licensing board
- User is managing a HOA, condo association, or multi-unit building -- procurement rules and liability structures differ significantly
- User wants to evaluate a home warranty service contract -- that is a separate insurance/service product, not a contractor relationship

---

## Process

### Step 1: Define Project Scope and Context

Before generating any evaluation framework, gather the specifics that determine which criteria apply.

- **Trade type:** Identify the specific trade(s) involved -- roofing, plumbing, electrical, HVAC, general contracting, concrete/masonry, painting, landscaping, pest control, or specialty (pools, solar, fire suppression). Each trade has different licensing structures, permit requirements, and pricing norms.
- **Scope description:** Get the user to describe exactly what needs to be done -- not just "fix the bathroom" but "replace a 48-square-foot shower, relocate a toilet 6 inches, and install a new vanity." Precision determines whether bids are comparable.
- **Project size and complexity:** Small repair (under $1,000), mid-size project ($1,000-$15,000), major renovation ($15,000-$100,000), or large addition/rebuild (over $100,000). Size determines payment structure thresholds, permit requirements, and bonding needs.
- **Urgency:** Is this emergency (pipe burst, no heat in winter, structural hazard), urgent-but-not-emergency (failing HVAC before summer), or planned (renovation on a flexible schedule)? Urgency changes which steps can be compressed.
- **Permit likelihood:** Structural work, electrical panels and new circuits, plumbing rough-in or relocation, roofing (in most jurisdictions), HVAC equipment replacement, and additions almost always require permits. Surface finishes, appliance swaps (like-for-like), and minor repairs typically do not. If unsure, confirm with the local building department before signing a contract.
- **Number of bids received:** If the user already has bids, pivot immediately to the bid comparison framework. If they have zero, guide them on how to solicit bids that will be comparable.

---

### Step 2: Generate the Contractor Vetting Checklist

Vetting is not optional -- it is the step that separates legitimate contractors from fraudulent or incompetent ones. Provide the following verification steps customized to the trade.

- **License verification:** Every state has an online license lookup tool (usually the Department of Consumer Affairs, Department of Labor and Industries, or a dedicated contractors board). The user should search by contractor name AND license number -- not just take the contractor's word. A valid license must be: active (not expired), in the correct classification for the work (a "C-36" plumbing license is different from a "B" general contractor license in California), and issued to the actual entity doing the work (not a different company name). Subcontractor licenses matter too -- a GC must use licensed subs for electrical, plumbing, and HVAC in most states.
- **Insurance verification -- the Certificate of Insurance (COI):** Ask for a COI naming the homeowner as an additional insured. The COI must show: (1) General liability insurance -- $500,000 minimum for projects under $25,000, $1,000,000 for larger projects; (2) Workers' compensation -- required whenever the contractor has employees (not required for sole proprietors working alone, but verify their solo status); (3) Auto liability if crew will drive on the property. Call the insurance agency listed on the COI to confirm the policy is active -- COIs can be forged or issued against a subsequently cancelled policy.
- **Business entity verification:** Look up the contractor's business registration with the state Secretary of State. Verify the company has been in operation for at least 2-3 years (brand-new LLCs warrant extra scrutiny). A contractor who has operated under multiple different company names over a few years is a red flag -- this pattern is called "churning" and can be used to escape prior judgments or complaints.
- **Reference checks -- the right questions:** Ask for 3-5 references from projects similar to yours completed in the last 12-18 months. When calling references, ask: Was the final cost within 10% of the original quote? Was the project completed within the promised timeframe? Were there unexpected change orders? How did the contractor respond when problems arose? Would you hire them again for a larger project? References who give vague, brief answers ("they did fine") are less valuable than those who give specific, detailed responses.
- **Online reputation analysis:** Check Google reviews, Yelp, the Better Business Bureau (BBB), and Angi/HomeAdvisor (for aggregate ratings, not referrals). Patterns matter more than individual reviews: a 4.2-star contractor with 80 reviews is more reliable than a 5-star contractor with 4 reviews. Look specifically for patterns of: incomplete work, payment disputes, poor cleanup, and unresponsiveness after job completion. Also check your state attorney general's consumer fraud database and the contractor licensing board's discipline records.
- **Trade-specific vetting additions:**
  - *Roofing:* Verify they are a certified installer for major shingle brands (GAF Master Elite, CertainTeed SELECT ShingleMaster) -- this affects the warranty tier available to you
  - *Electrical:* Verify the supervising electrician holds a master electrician license, not just a journeyman license
  - *HVAC:* Verify EPA Section 608 certification for refrigerant handling; verify NATE certification as a quality indicator
  - *Plumbing:* Verify the master plumber license; journeyman plumbers can do the work but must be supervised by a master
  - *General Contractor:* Verify their bonding status (a contractor's bond protects you if they fail to complete work, up to the bond amount -- typically $5,000-$15,000 for residential, which is why it is a minimum protection, not a guarantee)

---

### Step 3: Create the Bid Comparison Framework

A bid comparison is only valid when bids cover identical scope. This is the most common mistake homeowners make -- comparing a bid that includes everything to a bid that excludes critical components.

- **Request line-item bids, not lump sums:** Any contractor unwilling to itemize their bid is hiding something. A detailed bid should break out: materials (with specific product names and grades), labor, permit fees, equipment rental, disposal fees, and warranty terms. If a contractor only provides a lump sum, send them a scope sheet and ask them to confirm in writing what is and is not included.
- **Scope alignment check:** Before comparing prices, verify that every bid covers the same scope. Create a checklist of every deliverable and verify each bid either includes it (with price) or explicitly excludes it. Common scope gaps that explain low bids: no tear-off (overlay instead of full replacement), no permit, inferior material grade, no cleanup/hauling, no flashing replacement (roofing), no permit inspection scheduling.
- **Material quality comparison:** The same job with different materials can have a 20-40% price difference. For roofing: 3-tab shingles vs. architectural shingles vs. designer shingles. For HVAC: 14 SEER vs. 16 SEER vs. 18 SEER equipment. For windows: builder-grade vinyl vs. mid-tier fiberglass vs. premium composite. The cheapest material often has the shortest warranty and lowest performance -- model out the 10-year cost, not just the upfront cost.
- **Markup norms by project type:**
  - Roofing: Labor is typically 40-60% of total; material markup 10-20%
  - HVAC replacement: Equipment cost is 35-50% of total; labor and overhead are the balance; markups on equipment run 20-40%
  - Plumbing rough-in: Labor-dominant; materials 15-25% of total
  - General renovation: GC overhead and profit of 15-25% on top of subcontractor costs is standard; 30%+ is above-market but not fraudulent on complex projects
  - Painting: Labor is 75-85% of total for interior; materials are a small fraction
- **Regional price calibration:** Labor costs vary significantly by geography. A bathroom renovation that costs $12,000 in Des Moines may cost $25,000 in San Francisco for the same scope. Always contextualize bids against local market rates, not national averages. Sites like RSMeans (used by professional estimators) provide regional cost data by trade.
- **Outlier bid analysis:** A bid more than 25% below the median of multiple bids requires explanation. A bid more than 25% above the median also requires explanation (though high bids are more often explained by premium materials, larger crews, or stronger warranties). Ask outlier bidders specifically what explains their price difference -- their answer will reveal whether the gap is justified or whether something is missing or wrong.

---

### Step 4: Provide the Red Flag and Green Flag Assessment

Flags are behavioral and documentation signals that predict contractor reliability. Present both categories.

**Red Flags -- each one independently warrants caution; multiple flags together are disqualifying:**
- Demands full payment or deposit over 30% before work begins
- Pressures for same-day decision or offers a "today only" price
- No company address (works from a truck, no fixed business location)
- Cannot or will not provide a license number or COI
- Suggests skipping the permit "to save time or money"
- Bid is verbal only -- no written proposal
- Unmarked vehicles, no company signage, pays workers in cash (suggests unlicensed subs)
- No references, or references cannot be verified
- Will not put change order process in writing
- Uses high-pressure storm chasing tactics (knocking on doors immediately after weather events, claiming damage the homeowner has not assessed)
- Proposes an overlay instead of tear-off without proactively disclosing the trade-off
- License is in a different trade classification than the work being performed

**Green Flags -- positive indicators of professionalism:**
- Provides detailed written bid with line-item breakdown without being asked
- Proactively offers COI and provides contact information for their insurance broker
- Pulls permits and schedules inspections as a standard part of their process
- Explains what could go wrong (hidden rot, code upgrades required) and how those situations would be handled
- Proposes a payment schedule tied to verifiable milestones, not arbitrary dates
- Offers a workmanship warranty beyond the statutory minimum
- Has consistent reviews over 3+ years -- not just recent reviews that could be manufactured
- Communicates in writing (email, text) and follows up verbal conversations with written summaries
- Explains the work process, introduces crew members, and maintains a clean worksite

---

### Step 5: Generate the Contract Essentials Checklist

A written contract is legally required for home improvement work over a certain dollar threshold in most states (often $500-$1,000). But even for smaller projects, a written agreement protects both parties.

- **Mandatory contract elements:**
  - Full legal names and addresses of both parties (homeowner and contractor's business entity)
  - Contractor's license number and license classification
  - Insurance information (carrier, policy number)
  - Detailed scope of work with specific materials, grades, and quantities
  - Start date, projected completion date, and what constitutes a delay
  - Total contract price with a complete line-item breakdown
  - Payment schedule tied to specific, verifiable milestones (not dates)
  - Change order clause: any change to scope must be agreed to in writing with price adjustment before work proceeds
  - Permit responsibility: contractor obtains, pays for, and schedules all required permits and inspections
  - Cleanup and disposal responsibilities
  - Workmanship warranty duration and coverage terms
  - Dispute resolution process (mediation before litigation is standard)
  - Right to cancel clause (federal law requires a 3-day right of rescission for contracts signed in the home, not at the contractor's place of business)
  - Lien waiver provision: contractor provides conditional lien waivers with each progress payment

- **Red-line contract terms to push back on:**
  - Arbitration-only clauses that prevent court action (unfavorable to homeowners)
  - Clauses that allow the contractor to substitute materials without homeowner approval
  - Language that makes the contractor's estimate "non-binding" or subject to "site conditions" without a cap
  - Automatic renewal or extension clauses
  - Clauses that waive the homeowner's right to a final inspection before the last payment

---

### Step 6: Outline Payment Structure Guidelines

Payment schedules are a risk management tool. The structure should align the contractor's incentive to complete work with the homeowner's ability to withhold payment if work is deficient.

- **Standard payment schedule by project size:**
  - Under $1,000: Pay 50% at start (or nothing), 50% on completion. Some small jobs require a materials deposit only.
  - $1,000-$10,000: 20-30% deposit at signing, progress payment(s) tied to defined milestones, 10-15% final payment held until punch list is complete and inspection is passed.
  - $10,000-$50,000: 10-15% deposit at signing, progress payments at 3-4 defined milestones (each representing 20-25% of total), 10% final payment held until final inspection and punch list sign-off.
  - Over $50,000: 5-10% mobilization deposit, progress payments on a monthly or milestone basis, 5-10% retainage held for 30 days after substantial completion (industry standard is 10% retainage on commercial projects -- residential can use the same principle).

- **Never-exceed rules on deposits:**
  - No project warrants a deposit over 30% of total contract value for projects under $15,000
  - For projects over $25,000, the deposit should not exceed 10-15%
  - Material deposits are the legitimate exception -- if a contractor must special-order materials (custom windows, specific HVAC equipment, custom cabinetry), a materials-only deposit tied to a written purchase order is reasonable
  - Get a receipt for every payment; pay by check or credit card (never cash) to maintain a payment record

- **Progress payment triggers (examples):**
  - Roofing: materials delivered to site / tear-off and underlayment complete / all shingles installed / final inspection passed
  - Plumbing rough-in: permit obtained / rough-in complete and inspected / fixtures installed / final inspection
  - HVAC replacement: equipment delivered / old equipment removed and new installed / start-up and commissioning / final inspection
  - Kitchen renovation: framing and rough-in inspections passed / cabinets installed / countertops installed / punch list complete

- **Final payment leverage:** The final 10-15% is the most powerful tool in the homeowner's arsenal. Do not release it until: all punch list items are resolved, all inspections are passed and permits are closed, all manufacturer warranty registrations are filed, all lien waivers from the contractor and major subcontractors are received, and all manuals, warranty documents, and maintenance instructions are provided.

---

### Step 7: Construct the Lien Risk and Legal Exposure Briefing

This step is often overlooked but protects homeowners from a major financial risk.

- **Mechanics' liens explained:** In most states, a subcontractor or material supplier who is not paid by the general contractor can file a lien against the homeowner's property -- even if the homeowner paid the GC in full. This is the mechanics' lien right, and it is a security interest against the real estate itself.
- **How to protect yourself:**
  - Require the GC to provide a list of all subcontractors and material suppliers before work begins
  - Obtain a conditional lien waiver from every sub and supplier with each payment to the GC
  - Obtain an unconditional lien waiver from every sub and supplier upon final completion
  - For projects over $25,000, consider using joint checks (checks made payable to both the GC and the sub) to guarantee payment reaches the sub
  - In states with preliminary notice requirements (California, Arizona, Nevada, and others), subs must file a 20-day preliminary notice to preserve lien rights -- ask your GC to confirm which subs filed notices
- **Lien waiver types:**
  - *Conditional progress waiver:* Waives lien rights through a specific date, conditioned on payment clearing -- use with each progress payment
  - *Unconditional progress waiver:* Waives lien rights through a specific date, regardless of whether payment has cleared -- only use after payment has verifiably cleared
  - *Conditional final waiver:* Waives all lien rights upon final payment clearing
  - *Unconditional final waiver:* Waives all lien rights permanently -- only execute after final payment has cleared the bank

---

### Step 8: Summarize Decision Recommendation and Next Steps

After presenting the framework, give the user a concrete recommendation.

- Synthesize the vetting results: which contractors passed all checks, which have unresolved concerns
- Identify which bid represents the best value (not simply the lowest price) based on scope alignment, material quality, contractor quality, and warranty terms
- Flag any contract terms to negotiate before signing
- Confirm the payment schedule is within the guidelines
- Provide a "go/no-go" recommendation or a ranked preference with reasoning
- If no contractor passes vetting, advise the user to solicit new bids rather than settle for a substandard contractor

---

## Output Format

```
## Contractor Evaluation: [Project Type] -- [Brief Scope Description]

**Project:** [Specific scope, e.g., "Full roof replacement, approx. 1,800 sq ft, 6:12 pitch, 2 story"]
**Bid Range Received:** $[low] -- $[high] ([X]% spread)
**Expected Market Range:** $[low] -- $[high] for this project type and region
**Permits Required:** Yes / No / Likely -- [specific permit types]
**Urgency Level:** Emergency / Urgent / Planned

---

### Vetting Checklist

Complete this for every contractor before comparing bids.

| Verification Step | How to Check | Contractor A | Contractor B | Contractor C |
|-------------------|-------------|-------------|-------------|-------------|
| License -- active and correct classification | State licensing board online lookup | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail |
| General liability insurance ($[X] minimum) | Request COI; call carrier to verify | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail |
| Workers' comp (if employees) | Request COI; verify classification code | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail |
| Business entity -- verified active | State Secretary of State lookup | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail |
| References (3 minimum, similar work) | Direct phone calls | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail |
| Online reputation (pattern check) | Google, BBB, state AG complaint database | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail |
| [Trade-specific check] | [Method] | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail |

**Vetting Result:** Contractor A: [PASS / CONDITIONAL / FAIL] | Contractor B: [PASS / CONDITIONAL / FAIL] | Contractor C: [PASS / CONDITIONAL / FAIL]

---

### Bid Comparison -- Scope Alignment Matrix

Before comparing prices, confirm every bid covers the same scope.

| Scope Element | Contractor A ($[amount]) | Contractor B ($[amount]) | Contractor C ($[amount]) | Notes |
|---------------|-------------------------|-------------------------|-------------------------|-------|
| [Component 1] | Included / Excluded / Unknown | Same | Same | [What this means if excluded] |
| [Component 2] | Included / Excluded / Unknown | Same | Same | [Impact on quality or longevity] |
| [Material grade/spec] | [Specific product or grade] | Same | Same | [Quality/warranty trade-off] |
| [Permit fees] | Included / Excluded | Same | Same | [Risk if excluded] |
| [Warranty -- workmanship] | [X years] | [X years] | [X years] | [What is standard for this trade] |
| [Warranty -- materials] | [X years, manufacturer] | Same | Same | [Manufacturer warranty tier] |
| [Cleanup / disposal] | Included / Excluded | Same | Same | -- |

**Scope-Adjusted Prices:** After accounting for what is and is not included, the effective cost for identical scope is:
- Contractor A: $[adjusted amount] ([reason for adjustment])
- Contractor B: $[adjusted amount]
- Contractor C: $[adjusted amount]

---

### Red Flag Assessment

| Red Flag | Contractor A | Contractor B | Contractor C |
|----------|-------------|-------------|-------------|
| Requires >30% deposit upfront | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No |
| Cannot provide license or COI | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No |
| Verbal bid only / no written proposal | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No |
| Suggests skipping permit | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No |
| High pressure / same-day pressure | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No |
| [Trade-specific red flag] | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No |

**Red Flag Count:** A: [X] | B: [X] | C: [X]

---

### Contract Checklist (for Selected Contractor)

- [ ] Full legal names and business entity of contractor, with license number
- [ ] Contractor's insurance carrier and policy numbers for GL and WC
- [ ] Detailed scope of work with specific materials (brand, grade, model numbers where applicable)
- [ ] Start date and projected completion date with delay provisions
- [ ] Total contract price with line-item breakdown
- [ ] Payment schedule tied to verifiable milestones (listed below)
- [ ] Change order clause: written authorization required before any scope changes
- [ ] Permit responsibility assigned to contractor
- [ ] Cleanup and disposal included
- [ ] Workmanship warranty: [X] years covering [specific defects]
- [ ] 3-day right of rescission (if signed in your home)
- [ ] Lien waiver provision with each progress payment
- [ ] Dispute resolution process

---

### Payment Schedule

| Milestone | % of Total | Amount | Trigger Condition |
|-----------|-----------|--------|-------------------|
| Deposit -- contract signing | [X%] | $[amount] | Contract signed and returned |
| [Milestone 2 -- materials or mobilization] | [X%] | $[amount] | [Specific verifiable event] |
| [Milestone 3 -- mid-project] | [X%] | $[amount] | [Specific verifiable event, e.g., "rough-in inspection passed"] |
| [Milestone 4 -- near completion] | [X%] | $[amount] | [Specific verifiable event] |
| Final payment | [X%] | $[amount] | Punch list signed off, permit closed, all lien waivers received |

---

### Recommendation

**Recommended Contractor:** [Contractor name/letter]
**Rationale:** [Specific reasons: vetting results, bid value, materials, warranty, references]
**Before Signing:** [Specific items to negotiate or clarify]
**Payment Alert:** [Flag any deposit that exceeds guidelines]
**Lien Risk Level:** Low / Medium / High -- [brief explanation]
```

---

## Rules

1. **Never recommend a specific contractor, service platform, or referral service by name.** This includes aggregator platforms, labor marketplaces, and review sites -- they may be mentioned as research tools but never endorsed as a hiring mechanism.

2. **Three bids is the minimum standard for any project over $1,000.** For projects over $25,000, four to five bids are advisable. Bids obtained from the same referral service are less independent than bids sourced through separate channels -- note this when it applies.

3. **Deposit limits are hard rules, not suggestions.** Never advise a homeowner that a deposit over 30% is acceptable for a project under $15,000, regardless of what the contractor claims is "standard practice." The only legitimate exception is a documented materials deposit tied to a specific purchase order, and even then the deposit should not exceed the documented material cost.

4. **License verification must be done independently through official state databases, not by accepting a contractor-provided license number at face value.** A license number can be fabricated, expired, or held by a different entity than the one performing the work. The lookup takes 3 minutes and is non-negotiable.

5. **COI verification requires a phone call to the insurance carrier, not just reviewing the document.** COIs can be forged. The 90-second call to the carrier's certificate verification line eliminates the most common insurance fraud scenario. Remind the user to request that they be named as an additional insured on the policy.

6. **Permit responsibility belongs to the contractor by default.** If a contractor suggests the homeowner pull the permit, or suggests skipping the permit entirely, this is a red flag. When a homeowner pulls a permit for contractor work, the homeowner assumes liability for the work quality and becomes responsible for ensuring code compliance -- a role they are not equipped to perform. Unpermitted work becomes a disclosure liability at resale and can be ordered demolished by the building department.

7. **Lien waivers are required for any project involving subcontractors or material suppliers.** For projects over $10,000, always advise the user to obtain conditional lien waivers with every progress payment and unconditional final waivers upon project completion. Paying a GC in full does not protect the homeowner from subcontractor liens.

8. **Change orders must always be in writing before work proceeds.** Verbal change orders are a leading cause of contractor disputes. A contractor who says "don't worry, we'll sort it out at the end" on scope changes is setting up a dispute. Every change to scope -- even a small one -- should result in a written change order signed by both parties before the work is done.

9. **The final payment (10-15%) should never be released until three conditions are met:** the punch list walkthrough is complete and all items are resolved, all required permit inspections are passed and permits are officially closed with the building department (not just scheduled), and all unconditional lien waivers from the contractor and major subcontractors are received in hand. Releasing final payment early eliminates all leverage.

10. **An unusually low bid (25%+ below median) must be interrogated, not celebrated.** Ask the contractor to walk through specifically how they arrive at the lower price. Acceptable explanations include: lower overhead (home-based business, smaller crew), off-season pricing, or different material selection that the homeowner consciously chooses. Unacceptable explanations include: skipping permits, using unlicensed subcontractors, omitting scope elements, or vague claims about "efficiency." If the low bidder cannot explain the gap clearly, the risk outweighs the savings.

11. **For any project over $50,000, recommend the homeowner consult with a construction attorney before signing the contract.** This is not because anything is necessarily wrong -- it is because the financial stakes warrant it, and a one-hour attorney review at $250-$400 is inexpensive insurance against a $50,000+ exposure.

12. **Never advise a homeowner to pay in cash.** Cash payments eliminate the paper trail that proves payment was made, cannot be reversed if fraud occurs, and make lien waiver documentation harder to enforce. Payment by check (with "payment for [milestone], contract dated [date]" in the memo line) or credit card is always preferable.

---

## Edge Cases

### Emergency Repair (Cannot Solicit 3 Bids)

When time pressure is genuine -- burst pipe flooding the house, failed furnace in a winter storm, structural hazard after wind or tree damage, active roof leak during rain -- the standard vetting timeline is not feasible. Handle this situation systematically rather than abandoning vetting entirely.

Compress but do not eliminate: verify the license by phone or quick online lookup before signing anything (5 minutes); get a verbal COI confirmation from the contractor's insurance broker if the certificate is not immediately available; agree on a written scope of work and maximum cost cap before any work begins (a text message exchange or a written estimate with a not-to-exceed number is legally valuable). Photograph everything before, during, and after work begins. Agree explicitly that any additional scope beyond the emergency repair requires a separate written agreement. Plan to get a second opinion or independent assessment on any follow-up work that is not time-critical.

For emergency-triggered insurance claims, do not let the emergency contractor serve as both the repair contractor and the scope/damage expert -- insurance adjusters will provide their own assessment, and some emergency contractors inflate scope when the homeowner is distressed.

### Single Bid (User Cannot Find Additional Bidders)

Some project types have thin contractor supply in certain markets -- specialty work like structural masonry, historic restoration, or specific HVAC brands in rural areas may produce only one available bidder. When this occurs: use pricing databases (RSMeans residential cost data, local supplier pricing for materials) to validate the bid from the cost-buildup direction rather than competitive comparison. Ask the single contractor to provide a detailed materials and labor breakdown so you can assess whether the markup is reasonable. Consult a local building materials supplier or a retired tradesperson for informal price benchmarking. Accept the single bid with a fully negotiated contract rather than rushing into an unprotected verbal agreement.

### Storm Chasing / Disaster Solicitation Contractors

After hurricanes, hail storms, ice storms, and tornadoes, out-of-state contractor teams flood affected areas. These "storm chasers" can be legitimate crews filling genuine demand -- or predatory operations that take deposits and disappear. Identifying markers: vehicles with out-of-state plates, no local business address, unfamiliar company names not found in any online records, pressure to sign the same day. Protocol: require a local business address (not a hotel), verify the license is valid in the state where the work is being performed (not just their home state -- contractor licensing does not always transfer), verify insurance includes work in the project state, do not pay a deposit until a signed contract is in hand and a 3-day right of rescission has passed, and file the contractor's information with your state's insurance commissioner if they are working insurance claims.

### Mid-Project Contractor Failure (Contractor Stops Showing Up, Goes Silent, or Demands More Money)

This scenario is unfortunately common and requires a different response than the pre-hire evaluation. If a contractor has received progress payments but work has stalled: document the project status with timestamped photographs immediately; send a written notice (certified mail and email) stating the contractor is in default and setting a specific cure deadline (typically 5-10 business days); consult the contract's dispute resolution clause; contact the contractor's licensing board to file a complaint (this can sometimes motivate a contractor to complete work); contact the contractor's surety bond if they are bonded (the bond is a financial guarantee of performance); and consult a construction attorney before releasing any final payment or making any additional payments. Do not hire a new contractor to complete the work without first documenting the existing contractor's default in writing -- you need that record if you pursue recovery of the overpayment.

### Homeowner Acting as Own General Contractor (Owner-Builder)

Some homeowners with project management experience want to hire individual subcontractors directly rather than paying a GC's 15-25% markup. This is legally permitted in most states (often requiring an owner-builder disclosure or permit) but carries significant responsibility: the homeowner must coordinate all trades in the correct sequence (framing before rough-in; rough-in before insulation; insulation before drywall); schedule inspections at the correct milestones; ensure each sub is licensed and insured; manage lien exposure from each sub directly; and carry owner-builder liability for work quality at resale. This approach is only advisable for homeowners with strong organizational skills, trade knowledge sufficient to evaluate work quality, and time availability during the project. It is not appropriate for first-time renovators or homeowners with full-time jobs and no construction background.

### Bid Includes Allowances (Rather Than Specified Materials)

Many renovation bids include "allowances" -- placeholder amounts for materials the homeowner will select (tile, fixtures, flooring, cabinetry hardware). An allowance of "$2,500 for tile" means the contractor priced labor around that budget; if the homeowner selects tile that costs $4,000, the total contract price increases by $1,500. Allowances are common and not inherently suspicious, but they make bid comparison difficult. Protocol: ask each contractor to specify the allowance amounts and what labor is assumed for each allowance (installation of 3/8" tile vs. 3/4" stone has different labor costs). When comparing bids with allowances, use the same hypothetical material selection for all bidders to create an apples-to-apples comparison. Flag allowances that seem unrealistically low -- a $500 allowance for kitchen countertops on a full kitchen renovation is a pricing tactic, not a realistic budget.

### Contractor Requires a Signed Contract Before Providing COI or License Documentation

This is a manipulation tactic. No legitimate contractor should require a homeowner to sign anything before providing documentation of their credentials. The correct response: politely decline to sign until documentation is in hand and verified, and explain that this is standard practice for any homeowner. A contractor who walks away at this request has disqualified themselves.

---

## Example

**User Input:** "I have three bids to replace my central AC unit. One is $4,200, one is $6,800, and one is $8,900. I don't know anything about HVAC and I'm not sure which to go with or if these prices are even reasonable."

**AI Output:**

---

## Contractor Evaluation: HVAC Replacement -- Central AC Unit (Split System)

**Project:** Replace existing central air conditioning system (condenser and air handler / coil), approximately 2,000 sq ft single-story home, unknown current tonnage until confirmed
**Bid Range Received:** $4,200 -- $8,900 (112% spread -- requires detailed comparison before any decision)
**Expected Market Range:** $4,500 -- $10,000 for a 3-ton central AC system replacement depending on equipment tier, region, and installation complexity; the spread in your bids is large but not outside the possible market range if different equipment tiers are being quoted
**Permits Required:** Yes -- HVAC equipment replacement requires a mechanical permit in most jurisdictions; electrical work on the disconnect or panel may require an additional electrical permit
**Urgency Level:** Assess and confirm with user -- if current AC is functional, this is a planned project with time to vet fully; if it has failed in summer heat, urgency changes the approach

**First, a critical question before comparing prices:** Do all three bids specify the exact equipment being installed? If Contractor A ($4,200) is quoting a 14 SEER 2.5-ton unit and Contractor C ($8,900) is quoting a 18 SEER 3-ton variable-speed system, these are fundamentally different products -- not the same job at different prices. Get the equipment model number or at minimum the brand, SEER rating, and tonnage from each contractor before proceeding.

---

### Vetting Checklist

Complete every row for all three contractors before comparing prices. Prices mean nothing if a contractor is unlicensed or uninsured.

| Verification Step | How to Check | Contractor A ($4,200) | Contractor B ($6,800) | Contractor C ($8,900) |
|-------------------|-------------|----------------------|----------------------|----------------------|
| HVAC contractor license -- active, correct classification | State licensing board website, search by company name and license number | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail |
| EPA Section 608 refrigerant handling certification | Ask for technician certification number; EPA maintains a public lookup | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail |
| General liability insurance ($500K minimum) | Request COI; call carrier to confirm active policy | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail |
| Workers' compensation | Request COI; verify if they have employees | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail |
| Business entity -- registered and active (2+ years) | State Secretary of State lookup | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail |
| NATE certification (quality indicator, not required) | Ask for NATE technician ID; check NATE directory | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail |
| References -- 3 similar HVAC replacements in last 18 months | Direct phone calls | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail |
| Online reputation -- pattern check | Google, BBB, state AG consumer database | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail |

**What to say to each contractor:** "Before I make a decision, I need a copy of your contractor's license number and a Certificate of Insurance showing your general liability and workers' comp coverage. Can you send those over?" Any contractor who hesitates, argues, or fails to provide these within 24 hours has disqualified themselves.

---

### Bid Comparison -- Scope Alignment Matrix

HVAC bids vary dramatically based on equipment specification and scope inclusions. The following matrix asks the specific questions that explain your $4,700 price spread.

| Scope Element | Contractor A ($4,200) | Contractor B ($6,800) | Contractor C ($8,900) | Why It Matters |
|---------------|----------------------|----------------------|----------------------|----------------|
| **Equipment brand and model** | [Ask for specifics] | [Ask for specifics] | [Ask for specifics] | Brand-tier and model determine efficiency, reliability, and warranty. Budget brands (Goodman, Ameristar) are legitimate but different from mid-tier (Carrier, Trane, Lennox) and carry different warranties. |
| **Tonnage** | [X ton] | [X ton] | [X ton] | Undersizing saves money at install but strains the system; oversizing wastes money and causes humidity problems. All three should quote the same tonnage -- if they differ, ask how they sized the system. A Manual J load calculation is the professional standard. |
| **SEER rating (efficiency)** | [X SEER] | [X SEER] | [X SEER] | Federal minimum is 14 SEER (South) / 13 SEER (North) as of 2023; new federal SEER2 standards apply to new equipment. A 16 SEER unit uses ~12% less electricity than a 14 SEER unit -- this has a payback period of approximately 5-7 years on a typical cooling bill. 18+ SEER variable speed units have 10-12 year payback periods. |
| **Condenser replacement only vs. full system (condenser + coil + handler)** | [Condenser only or full?] | [Full system?] | [Full system?] | If Contractor A is replacing only the outdoor condenser unit while B and C are replacing the entire system (including air handler/evaporator coil), the scope difference fully explains the price gap. Mismatched systems (new condenser with old coil) are inefficient, may void the manufacturer warranty, and can cause premature failure. |
| **Refrigerant type** | [R-410A or R-454B?] | Same | Same | R-410A is being phased out under EPA regulations; new equipment as of 2025 must use R-454B (Puron Advance) or equivalent low-GWP refrigerant. If Contractor A is quoting an older R-410A unit from existing inventory, verify the equipment is current-production and that parts/refrigerant will remain available. |
| **Line set replacement vs. reuse** | [New or reuse?] | Same | Same | Copper refrigerant line sets can be reused if they are in good condition, correctly sized for the new equipment, and leak-free. Replacing line sets adds $300-700 but eliminates a common source of efficiency loss and early failures. |
| **Disconnect box and electrical inspection** | [Included?] | Same | Same | The outdoor disconnect box should be inspected and replaced if it is old, undersized, or corroded. Electrical work on the disconnect requires a licensed electrician in most states -- confirm who does this and whether it is in the bid. |
| **Permit fees** | [Included?] | Same | Same | Mechanical permits for HVAC replacement typically cost $75-250 depending on jurisdiction. If excluded from one bid, add it to the comparison price. |
| **Refrigerant charge and startup commissioning** | [Included?] | Same | Same | Proper startup requires charging the system to manufacturer specifications, verifying superheat and subcooling, and documenting equipment performance. This is a 1-2 hour process. A contractor who does a 30-minute install and leaves without commissioning is cutting corners. |
| **Removal and disposal of old equipment** | [Included?] | Same | Same | Old equipment contains refrigerant (legally required to be recovered, not vented) and must be properly disposed of. Disposal should be in every bid. |
| **Equipment warranty -- parts** | [X years] | Same | Same | Base manufacturer warranties are typically 5 years parts; registered warranties (requires contractor to register the equipment online within 60-90 days of installation) extend to 10 years on parts for most major brands. Confirm the contractor will register the warranty. |
| **Workmanship warranty** | [X years] | Same | Same | Standard residential HVAC workmanship warranty is 1-2 years; good contractors offer 5 years. |

**Scope-Adjusted Price Analysis (example scenario):**
Assume the investigation reveals:
- Contractor A ($4,200): condenser-only replacement, reusing 15-year-old air handler, 14 SEER, R-410A inventory unit, permit not included, no commissioning in scope
- Contractor B ($6,800): full system (condenser + coil + air handler), 16 SEER, new refrigerant type, permit included, full startup commissioning, 5-year workmanship warranty
- Contractor C ($8,900): full system, 18 SEER variable-speed unit, new line set, permit included, 10-year registered parts warranty, 5-year workmanship warranty

Scope-adjusted comparison:
- Contractor A effective cost for same full-system scope: ~$6,000-6,500 (add air handler $1,500-2,000, permit ~$150, plus risks of mismatched system)
- Contractor B: $6,800 -- strong value; the apparent "middle" bid is actually the best-specified mid-tier option
- Contractor C: $8,900 -- premium equipment; justified if you plan to stay in the home 10+ years and value the energy savings and extended warranty

**Preliminary recommendation based on scope analysis:** Contractor B likely represents the best combination of value and completeness. Contractor A's low bid appears to be a different product (partial replacement), not a cheaper price for the same work.

---

### Red Flag Assessment

| Red Flag | Contractor A ($4,200) | Contractor B ($6,800) | Contractor C ($8,900) |
|----------|-----------------------|-----------------------|-----------------------|
| Requires >30% deposit upfront | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No |
| Cannot provide license or COI promptly | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No |
| Verbal/lump-sum bid only -- no line items | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No |
| Cannot confirm EPA 608 certification | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No |
| Suggests skipping mechanical permit | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No |
| Will not register manufacturer warranty | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No |
| Proposes mismatched system without disclosure | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No |
| No references or references don't answer | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No |

**Notes on HVAC-specific red flags:**
- A contractor who quotes without measuring your home (square footage, insulation levels, window area, ceiling height) and simply matches the tonnage of the old unit is not doing a proper load calculation. Systems are routinely oversized, which reduces dehumidification and increases operating cost. If a contractor quotes over the phone without a site visit, ask how they sized the system.
- Any contractor who says they do not need to pull a permit is telling you they intend to do unlicensed, uninspected work. HVAC permits exist because improper refrigerant handling is an environmental violation and improper electrical connections are a fire hazard. A permit is approximately $100-200 and is not optional.

---

### Contract Checklist (for Selected Contractor)

Before any work begins, confirm the contract includes every item below.

- [ ] Contractor's full legal business name, address, license number, and EPA 608 certification number
- [ ] Insurance carrier names and policy numbers for general liability and workers' comp
- [ ] Specific equipment to be installed: brand, model number, tonnage, SEER2 rating, refrigerant type
- [ ] Full scope: condenser, air handler, evaporator coil, line set status, disconnect, refrigerant, startup commissioning
- [ ] Removal and EPA-compliant disposal of old equipment and refrigerant
- [ ] Permit responsibility assigned to contractor (they obtain and pay for the mechanical permit and schedule final inspection)
- [ ] Start date and completion date (HVAC replacement should be a 1-2 day job once equipment is on site)
- [ ] Total price with line-item breakdown
- [ ] Payment schedule tied to milestones (not dates)
- [ ] Equipment warranty: contractor will register the warranty in your name within 30 days of installation
- [ ] Workmanship warranty: [X] years, covering labor for any installation-related failure
- [ ] Change order clause: written and signed before any scope changes proceed
- [ ] Lien waiver from contractor upon final payment (most HVAC replacements are single-contractor with no subs, but confirm)

---

### Payment Schedule for a $6,800 HVAC Replacement

| Milestone | % of Total | Amount | Trigger Condition |
