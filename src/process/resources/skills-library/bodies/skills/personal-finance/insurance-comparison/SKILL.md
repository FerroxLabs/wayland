---
name: insurance-comparison
description: |
  Provides an analysis framework for comparing insurance policies across any
  insurance type. Evaluates premiums, deductibles, coverage limits, exclusions,
  and provider quality factors. Produces a structured side-by-side comparison
  using terms the user provides from their actual policy quotes.
  Use when the user asks about comparing insurance policies, understanding
  coverage options, or evaluating the tradeoff between premiums and deductibles.
  Do NOT use for insurance needs assessment (use insurance-needs-assessment),
  general major purchase decisions (use major-purchase-decision), or home buying
  insurance requirements (use home-buying-checklist).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "insurance personal-finance analysis planning"
  category: "personal-finance"
  subcategory: "major-purchases"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---
# Insurance Comparison

> **Disclaimer:** This skill provides educational information about insurance concepts and general guidance for policy evaluation. It does NOT constitute insurance advice, legal advice, or recommendations to purchase any specific policy or from any specific provider. Individual risk profiles, state regulations, and financial circumstances vary significantly. Always verify all policy terms against official documents. For complex situations, consult a licensed insurance agent, broker, or attorney.

---

## When to Use

**Use this skill when:**
- The user has two or more actual policy quotes with specific numbers and wants a structured side-by-side comparison
- The user asks about the financial tradeoff between paying a lower premium now versus a higher deductible later
- The user wants to understand what specific policy terms mean and how they affect total cost exposure (e.g., coinsurance vs. copay, ACV vs. replacement cost, occurrence vs. claims-made)
- The user is switching from an existing policy to a new one and wants to identify coverage gaps or improvements
- The user wants to compare structurally different products in the same category (e.g., term vs. whole life, HMO vs. PPO vs. HDHP, stated value vs. agreed value auto)
- The user is evaluating whether a rider or endorsement is worth its additional premium cost
- The user wants to understand what a specific exclusion or sublimit means for their financial exposure
- The user has a bundling offer (auto + home, for example) and wants to evaluate whether the discount justifies consolidating to one carrier

**Do NOT use this skill when:**
- The user has not yet decided what types or amounts of coverage they need -- use `insurance-needs-assessment` first, then return here once they have quotes
- The user is making a broader buy-or-lease or major purchase decision where insurance is one cost component among many -- use `major-purchase-decision`
- The user is navigating home buying and needs guidance on lender-required coverage, title insurance, or PMI -- use `home-buying-checklist`
- The user wants a specific provider recommendation -- no specific company recommendations are ever made
- The user is filing a claim or disputing a claim denial -- that is a claims advocacy process, not a comparison
- The user is asking about insurance from a business or commercial perspective (commercial general liability, E&O, workers' comp) -- those require a separate commercial insurance framework with materially different rating factors
- The user is dealing with COBRA or marketplace enrollment deadlines -- the time-sensitive compliance aspect requires guidance beyond comparison frameworks

---

## Process

### Step 1: Identify the Insurance Type, Structure, and User Context

Before collecting any numbers, establish the analytical frame. Different insurance types have fundamentally different cost structures, coverage mechanics, and decision-critical variables.

- **Identify the product category:** Health, auto (personal), homeowner's, renter's, condo (HO-6), life (term, whole, universal, variable), disability (short-term, long-term), umbrella/excess liability, pet, travel, long-term care, or specialty (jewelry, flood, earthquake).
- **Identify structural variants within the category:** For health insurance, distinguish HMO (gatekeeper model, in-network only), PPO (open access, out-of-network at higher cost), EPO (no gatekeeper, but in-network only like an HMO), HDHP (high-deductible health plan, HSA-eligible), and POS (hybrid gatekeeper). For auto, distinguish collision/comprehensive from liability-only. For homeowners, distinguish HO-3 (open perils on dwelling, named perils on contents) from HO-5 (open perils on both) from HO-1/HO-2 (named perils only, less common today). The policy form matters as much as the premium.
- **Determine whether the user is replacing existing coverage or buying new:** If replacing, ask what the current coverage terms are -- you need to flag any coverage reductions, not just cost changes.
- **Identify the user's primary concern:** Is it minimizing monthly cash outflow, minimizing worst-case financial exposure, maximizing coverage breadth, or a specific provider/network requirement? This determines how to weight the comparison outputs.
- **Establish the claims context:** Ask whether the user has filed claims in the past 3-5 years and how frequently they expect to file. A driver with two at-fault accidents in three years should weight the deductible scenario differently than someone with a clean record. A homeowner in a high-wildfire or high-hail zone has a materially different expected claim frequency than one in a low-risk area.
- **Note any regulatory or lender constraints:** Lenders require minimum coverage on financed vehicles (comprehensive and collision) and on mortgaged homes (dwelling coverage at replacement cost value, not market value). Lease agreements often require lower deductibles (typically $500 maximum) than lenders alone would require.

---

### Step 2: Collect Policy Terms Systematically -- All Five Cost and Coverage Dimensions

Gather specific numbers for every policy being compared. If the user has not yet provided a term, ask for it before proceeding -- do not estimate or assume.

**Dimension 1: Premium and Payment Structure**
- Monthly, semi-annual, and annual premium. Note whether a payment-in-full discount applies (typically 3-8% discount for paying annually upfront).
- Whether the premium is guaranteed for the policy term or subject to rate adjustment at renewal.
- For life insurance: whether the premium is level (guaranteed for the full term) or graded (increases at intervals).
- For employer-sponsored health insurance: the employee's share of premium, not the total premium. The comparison is always on the cost to the insured.

**Dimension 2: Deductibles and Self-Insured Retention**
- Per-occurrence deductible vs. annual aggregate deductible. Health insurance typically has an annual aggregate; auto and home are typically per-occurrence.
- Whether the deductible resets on a calendar-year or policy-year basis.
- Separate deductibles by peril: many homeowner's policies have a standard deductible for most claims but a separate, higher wind/hail or hurricane deductible expressed as a percentage of the dwelling coverage amount (e.g., 1% or 2% of Coverage A). A 2% wind deductible on a $400,000 home is $8,000 -- not the $1,000 standard deductible that appears on the declarations page.
- For health insurance: whether the deductible is embedded (each family member has their own deductible that counts toward family) or aggregate (the family deductible must be met collectively before any individual's claims are paid at the coinsurance rate).

**Dimension 3: Coinsurance, Copays, and Cost-Sharing Mechanics**
- For health insurance: coinsurance percentage after deductible (e.g., 80/20 means insurer pays 80%, insured pays 20%), copay amounts per visit type (primary care vs. specialist vs. urgent care vs. ER), and whether the out-of-pocket maximum (OOP max) includes or excludes the deductible. Under ACA-compliant plans, OOP max includes deductible, copays, and coinsurance. Some plans have separate medical and prescription OOP maxes.
- For property insurance (home/auto): replacement cost value (RCV) vs. actual cash value (ACV). ACV = RCV minus depreciation. A 10-year-old roof with ACV coverage that is destroyed in a hailstorm pays out replacement cost minus depreciation -- often leaving a $5,000-$15,000 gap the insured pays. RCV coverage pays full replacement cost, but premiums are higher. This single distinction can be worth more than a $500 premium difference.
- For auto insurance: collision deductible and comprehensive deductible are often set independently. A common structure is a $500 collision / $100 comprehensive split.

**Dimension 4: Coverage Limits and Sublimits**
- Per-occurrence limit, per-person limit, and annual aggregate limit.
- For auto liability: bodily injury per person / bodily injury per accident / property damage format (e.g., 100/300/100 means $100K per person, $300K per accident, $100K property damage).
- For homeowners: Coverage A (dwelling), Coverage B (other structures -- typically 10% of A), Coverage C (personal property -- typically 50-70% of A), Coverage D (loss of use / additional living expenses -- typically 20-30% of A), Coverage E (personal liability), Coverage F (medical payments to others). Flag any sublimits within personal property coverage: jewelry, electronics, firearms, silverware, business property, and cash all have sublimits (commonly $200-$2,500) that may fall far short of actual values. Scheduled personal property endorsements can raise these limits but at additional premium.
- For health insurance: any coverage sublimits for specific services (e.g., mental health visits, physical therapy sessions per year, skilled nursing facility days, chiropractic care).
- For life insurance: the face value (death benefit) and whether it is level or decreasing over the term.

**Dimension 5: Exclusions, Conditions, and Waiting Periods**
- Named exclusions from the declarations page and policy jacket. The most common homeowner's exclusions are flood (always excluded -- requires separate NFIP or private flood policy), earthquake (usually excluded -- requires separate endorsement or policy), sewer backup/water backup (often excluded; endorsement available for $50-$150/year), and ordinance or law (the cost to bring a structure up to current code after a loss -- commonly excluded, but endorsement available).
- For auto: exclusions for rideshare driving (if the insured drives for a TNC like Uber or Lyft, personal auto policies typically exclude coverage during app-on periods -- requires a rideshare endorsement), business use of the vehicle, and racing.
- For health insurance: pre-existing condition exclusions (eliminated for ACA-compliant individual and group plans, but still applicable to short-term health plans), experimental treatment exclusions, and out-of-network service exclusions under HMOs and EPOs.
- Waiting periods: most relevant for disability insurance (elimination period -- typically 30, 60, 90, or 180 days before benefits begin), some health insurance riders, and dental insurance (commonly 6-12 month waiting period for major services, 12 months for orthodontia).

---

### Step 3: Calculate Total Annual Cost Exposure Across Four Scenarios

Three scenarios undercount the real distribution of risk. Use four:

**Scenario 1 -- Zero claims (premium cost only)**
- Total cost = Annual premium
- This is the floor -- the guaranteed minimum cost of holding the policy.
- Policy pays out: $0

**Scenario 2 -- One small/moderate claim**
- Estimate a realistic small claim for the insurance type:
  - Auto: $2,500-$4,000 (minor collision, single vehicle)
  - Home: $5,000-$12,000 (roof damage from wind, water damage from burst pipe)
  - Health: $3,000-$8,000 (ER visit plus follow-up, minor outpatient procedure)
- Total cost = Annual premium + deductible + coinsurance on the portion above deductible (up to OOP max)
- For property insurance with ACV coverage: add estimated depreciation to the insured's cost

**Scenario 3 -- One major claim**
- Estimate a realistic major but survivable claim:
  - Auto: $30,000-$60,000 (totaled vehicle or serious collision)
  - Home: $80,000-$200,000 (major fire, significant structural damage)
  - Health: $100,000+ (hospitalization, surgery, cancer treatment)
- For health: Total cost = Annual premium + OOP max (the insured never pays more than premium + OOP max in a plan year for covered in-network services)
- For property: Total cost = Annual premium + deductible (the coverage limit minus deductible is what the insurer pays; verify the claim value does not exceed the coverage limit)
- Flag if any coverage limit is insufficient for the estimated major claim -- an inadequately insured home or auto creates a coverage gap above the policy limit

**Scenario 4 -- Multiple claims or chronic-use year**
- Most relevant for: auto (two accidents in one year), health (ongoing condition requiring frequent care), or home (multiple separate events)
- Auto with per-occurrence deductible: each new claim triggers the deductible again
- Health with annual deductible: once the deductible and OOP max are met, all further covered in-network costs are paid at 100% for the remainder of the plan year -- making high-use years more predictable on high-deductible plans than they may appear

---

### Step 4: Perform the Premium-Deductible Tradeoff Calculation

This is the core quantitative decision for most property and health insurance comparisons.

**Basic break-even formula:**
```
Annual premium savings = Premium(lower deductible) - Premium(higher deductible)
Additional deductible exposure = Deductible(higher) - Deductible(lower)
Break-even claims per year = Additional deductible exposure / Annual premium savings
```

**Interpretation rules:**
- Break-even < 0.5 claims/year: The lower-deductible policy rarely makes financial sense unless you have very high claim frequency -- favor the higher deductible.
- Break-even 0.5-1.0 claims/year: The decision is close and should be driven by risk tolerance and expected claim frequency. The higher-deductible plan is slightly favored for people with low recent claims history.
- Break-even > 1.0 claims/year: The lower-deductible plan favors financially for anyone who files one or more claims per year; this is uncommon for most auto and home policyholders.
- For health insurance: the break-even analysis must account for the HSA contribution offset on HDHPs. In 2024, an individual can contribute up to $4,150 to an HSA (tax-deductible, grows tax-free, withdrawals tax-free for qualified medical expenses). The effective cost of an HDHP is reduced by the tax savings on HSA contributions (typically 22-32% of the contributed amount for most working adults). A $1,500 HSA contribution by an individual in the 24% bracket generates $360 in immediate tax savings, which should be subtracted from the HDHP's cost disadvantage.

**Multi-year break-even (the more realistic frame):**
```
Year N break-even: N × annual premium savings vs. N × expected deductible costs
```
Most policyholders make the deductible decision implicitly on a multi-year basis. A person who expects to file one auto claim every 4 years faces a very different calculus than one who expects one every year.

---

### Step 5: Evaluate Coverage Quality Differences -- Beyond the Numbers

Premium and deductible comparisons are table stakes. The most important differences are often qualitative.

**Replacement cost vs. actual cash value (property insurance):**
- Quantify the ACV discount: For a 15-year-old roof with a $20,000 replacement cost, ACV at 50% depreciation pays $10,000. The insured pays the $10,000 gap plus their deductible. RCV coverage eliminates this gap. The annual premium difference for RCV vs. ACV is typically $150-$400/year for a standard home -- almost always worth it for whole-house coverage.
- Some policies offer a hybrid: they pay ACV at initial claim, then pay the recoverable depreciation once repairs are completed. This deferred RCV structure is better than pure ACV but requires the insured to fund the repair gap upfront.

**Occurrence-based vs. claims-made policies (professional liability, some specialty lines):**
- Occurrence: covers any incident that occurs during the policy period, regardless of when the claim is filed. Preferred for long-tail liability.
- Claims-made: only covers claims filed while the policy is active. Changing carriers requires a tail endorsement (extended reporting period) to cover incidents that occurred during the prior policy period but are claimed later.

**Network adequacy (health insurance):**
- In-network directory size is less important than whether the insured's specific providers (PCP, specialists, hospital system) are in-network.
- For employer-sponsored plans: verify that the plan is the same across carriers -- a PPO at $180/month from one carrier may have a materially narrower network than a PPO at $210/month from another.
- Out-of-network cost exposure: HMOs and EPOs have no out-of-network benefits except emergencies. A PPO that pays 60% out-of-network on a $50,000 hospital bill still leaves a $20,000 coinsurance exposure before any out-of-network OOP max (if one even exists -- some plans have no OOP cap for out-of-network).

**Uninsured/underinsured motorist coverage (auto):**
- The Insurance Research Council estimates that approximately 1 in 8 U.S. drivers is uninsured. Without UM/UIM coverage, a driver hit by an uninsured motorist has no source of recovery for medical costs and lost wages beyond their own health insurance and collision coverage.
- UM/UIM coverage is inexpensive (typically $30-$80/year) relative to the exposure it covers. Its presence or absence in a quote is a meaningful coverage quality differentiator.

**Provider financial strength ratings:**
- A.M. Best is the standard rating agency for insurance carriers. Ratings above A- (Excellent) indicate strong claims-paying ability. Avoid carriers rated below B+ for primary insurance. For surplus lines or specialty carriers, verify the rating explicitly.
- A carrier with a B rating is not automatically bad, but a significant catastrophic event (hurricane, wildfire season) could strain a financially weaker carrier's ability to pay claims promptly.

**Claims satisfaction:**
- J.D. Power publishes annual claims satisfaction studies for auto, home, life, and health insurance by carrier. While specific carrier names are not used in this skill's outputs, users should be directed to check these independent ratings.
- State insurance department complaint ratios (available from the NAIC consumer information portal) show complaints per $1 million of premiums for each licensed carrier by line of business. A complaint ratio above 1.0 (the median) is a yellow flag; above 2.0 is a red flag.

---

### Step 6: Identify Coverage Gaps, Overlaps, and Coordination Issues

**Coverage gaps** -- situations where neither policy would pay -- are the most financially dangerous outcome of a policy comparison:
- A homeowner without flood insurance in a FEMA Zone AE (high-risk flood zone) has a coverage gap that no amount of premium reduction on the base policy can offset.
- A renter who relies on a landlord's policy for their personal property has a coverage gap -- landlord policies cover the building structure, not tenant belongings.
- A driver with liability-only auto coverage (no collision or comprehensive) who finances their vehicle violates the loan agreement and has no coverage for their own vehicle damage.

**Coverage overlaps** can create false security or wasted premium:
- Medical payments coverage on an auto policy may be redundant for someone with strong health insurance -- the auto MedPay pays first, then health insurance. This creates a duplicate benefit for covered expenses.
- Extended warranty coverage on a credit card may overlap with a purchased product warranty endorsement.
- Travel insurance purchased separately may duplicate coverage already included on a premium credit card.

**Coordination of benefits (health insurance for dual-covered households):**
- When both spouses have employer-sponsored health insurance, covering both as primary on separate plans may cost more in combined premiums than the benefit of reduced individual cost-sharing. A break-even analysis comparing combined solo premiums vs. one employee + one dependent coverage is required.

---

### Step 7: Build the Comparison Matrix and Present the Decision Framework

- Populate the full side-by-side comparison table with all data collected.
- Calculate all four scenarios for each policy.
- Perform and present the break-even analysis.
- Flag every coverage difference where one policy covers something the other does not. These are decision-critical differentiators.
- Present the decision framework anchored to what the user said their priority is (Step 1).
- List any open questions the user needs to resolve before making a final decision -- missing data should not be substituted with assumptions.
- Close with specific, actionable next steps.

---

## Output Format

```
## Insurance Comparison Analysis

> Note: All numbers are taken directly from the user's stated quotes.
> Verify all figures against official policy documents before making any decision.

### Insurance Type: [Health / Auto / Homeowner's / Renter's / Life / Disability / Other]
### Policy Form / Variant: [e.g., HO-3, PPO, Term 20, Personal Auto Policy]
### Number of Policies Compared: [2 / 3 / 4]

---

### Policy Overview

| Feature | Policy A | Policy B | Policy C |
|---------|----------|----------|----------|
| Plan/tier name | [user-provided] | [user-provided] | [if provided] |
| Premium (monthly) | $[amount] | $[amount] | $[amount] |
| Premium (annual) | $[calculated] | $[calculated] | $[calculated] |
| Pay-in-full annual discount | [if stated] | [if stated] | [if stated] |
| Deductible | $[amount] | $[amount] | $[amount] |
| Deductible type | [per-occurrence / annual aggregate] | | |
| Coinsurance / copay | [terms] | [terms] | [terms] |
| Out-of-pocket maximum | $[amount] | $[amount] | $[amount] |
| Coverage type | [RCV / ACV / specified] | | |
| Primary coverage limit | $[amount] | $[amount] | $[amount] |
| Liability limit | $[amount] | $[amount] | $[amount] |

---

### Annual Cost Exposure by Scenario

| Scenario | Policy A | Policy B | Policy C |
|----------|--------:|--------:|--------:|
| Zero claims (annual premium only) | $[amount] | $[amount] | $[amount] |
| One small claim ($[estimate]) | $[calc] | $[calc] | $[calc] |
| One major claim (worst case) | $[calc] | $[calc] | $[calc] |
| High-use / multiple claims year | $[calc] | $[calc] | $[calc] |

**Scenario notes:**
- Small claim estimate assumes $[amount] in covered damages/expenses; deductible paid in full; coinsurance applied to balance above deductible
- Major claim assumes claim value reaches or exceeds coverage limits; total insured cost = premium + OOP max (health) or premium + deductible (property)
- ACV depreciation applied to Policy [X] estimate: [explanation if applicable]

---

### Premium-Deductible Tradeoff Analysis

*(Comparing [Policy A] vs. [Policy B])*

| | Policy A | Policy B |
|--|--------:|--------:|
| Annual premium | $[amount] | $[amount] |
| Annual premium savings (B vs. A) | -- | $[savings]/year |
| Deductible | $[amount] | $[amount] |
| Additional out-of-pocket per claim | -- | +$[difference] |
| **Break-even claims per year** | -- | **[calculated]** |

**Interpretation:**
- Filing [X] or fewer claims per year: [Higher-deductible policy] costs less overall
- Filing more than [X] claims per year: [Lower-deductible policy] costs less overall
- At your stated claim history ([Y claims per year]): [Policy X] is the lower-cost option over time

**Multi-year perspective:**
- Over 3 years with [expected frequency] claims: Policy A total = $[calc] | Policy B total = $[calc]
- [Add HSA tax savings offset if applicable for HDHP comparison]

---

### Coverage Quality Comparison

| Coverage Area | Policy A | Policy B | Policy C | Notes |
|--------------|----------|----------|----------|-------|
| [Primary peril coverage] | [Covered / limit] | [Covered / limit] | [if applicable] | |
| [Secondary peril or benefit] | [Covered] | [Excluded] | | **FLAG: A covers; B does not** |
| [Liability] | $[amount] | $[amount] | | |
| [Valuation basis] | RCV | ACV | | **FLAG: Material difference -- see below** |
| [Sublimit area, e.g., jewelry] | $[limit] | $[limit] | | |
| [Specific exclusion] | Excluded | Covered | | **FLAG: B covers; A does not** |
| [Network type] | [if health] | [if health] | | |

**Coverage flags requiring attention:**
- 🔴 **Critical gap:** [Description -- e.g., "Policy B excludes water backup damage; Policy A covers up to $10,000 with the water backup endorsement. If you have a finished basement, this is a significant financial exposure."]
- 🟡 **Notable difference:** [Description -- e.g., "Policy A uses ACV valuation for personal property; Policy B uses RCV. On a $30,000 content claim with 5-year-old items, ACV could reduce the payout by $8,000-$12,000."]
- 🟢 **Equivalent coverage:** [Confirmation that a dimension is identical or immaterially different]

---

### Exclusion Summary

**Policy A excludes (notable items):**
- [Exclusion 1 and its financial implication]
- [Exclusion 2 and its financial implication]

**Policy B excludes (notable items):**
- [Exclusion 1 and its financial implication]
- [Exclusion 2 and its financial implication]

**Shared exclusions (present in all compared policies):**
- [Exclusion type -- e.g., flood, earthquake, intentional acts]
- Note: If this exclusion is relevant to your risk profile, a separate policy or endorsement may be required regardless of which option you choose.

---

### Decision Framework

| If Your Priority Is... | Strongest Option | Because... | Caveat |
|------------------------|-----------------|------------|--------|
| Lowest guaranteed annual cost | Policy [X] | Lowest premium at $[amount]/year | Only true if zero claims |
| Lowest worst-case annual exposure | Policy [X] | Lowest (premium + OOP max) at $[amount] | |
| Best coverage for your most likely risk | Policy [X] | Covers [specific risk] that others exclude | |
| Balanced cost and coverage | Policy [X] | [Explanation of why it represents best value] | |
| [User-stated priority] | Policy [X] | [Direct answer to their stated goal] | |

---

### Open Questions -- Resolve Before Deciding

- [ ] [Question about a specific coverage term not provided by user]
- [ ] [Question about user's risk profile that changes the analysis -- e.g., "Do you use your vehicle for rideshare? If so, Policy A's exclusion of TNC coverage is disqualifying."]
- [ ] [Question about an applicable discount not factored in]
- [ ] [Question about lender or lease requirements that may constrain choice]
- [ ] Confirm both policies are quoted for the same effective date and coverage period
- [ ] Verify the financial strength rating (A.M. Best) of the lower-cost carrier

---

### Next Steps

- [ ] Pull the full policy jacket (not just the declarations page) for any policy you are seriously considering -- the declarations page shows limits; the policy jacket defines what is actually covered and excluded
- [ ] Cross-reference all quoted numbers against the official policy document or binder before purchasing
- [ ] If any Coverage Flag above is marked 🔴, research whether a separate policy or endorsement can close that gap and include its cost in the comparison
- [ ] Check the carrier's complaint ratio on the NAIC Consumer Information Source (available online from NAIC.org)
- [ ] Check J.D. Power claims satisfaction rankings for the insurance type and carrier
- [ ] If this is a renewal decision, ask the current carrier to match or improve terms before switching -- insurers often have retention pricing not reflected in public quotes
- [ ] Consult a licensed independent insurance agent or broker for complex coverage situations
```

---

## Rules

1. **Never name a specific insurance carrier.** Use Policy A, B, C. If the user names carriers in their input, acknowledge receipt but strip the names from the comparison output. The skill must be analytically useful regardless of which carriers are involved.

2. **Never produce a comparison with fewer than four cost scenarios.** Zero claims, small claim, major claim, and multi-claim/high-use scenarios are all required. Three-scenario comparisons undercount the health insurance high-deductible plan case (where the high-use year is the most important scenario) and the auto case (where two accidents in one year are not unusual for higher-risk drivers).

3. **Always flag ACV vs. RCV as a coverage quality issue, not just a cost issue.** The difference between ACV and RCV homeowner's coverage is one of the most consequential and least understood distinctions in personal insurance. A $200/year premium savings on an ACV policy can result in a $15,000+ gap at the time of a major claim. This must be stated explicitly.

4. **Always perform and present the full break-even calculation.** Do not just describe the tradeoff conceptually. Calculate the exact break-even claims-per-year number and interpret it against the user's stated or estimated claim frequency.

5. **Flag percentage deductibles on homeowner's policies explicitly.** A wind/hail or hurricane deductible expressed as a percentage of Coverage A (dwelling limit) is frequently misunderstood as the same as the flat-dollar deductible. A 2% wind deductible on a $350,000 dwelling = $7,000 deductible per wind event, not $1,500 as listed for "all other perils." This must be calculated and stated in dollar terms.

6. **For health insurance comparisons involving HDHPs, always include the HSA tax savings offset.** Failure to account for HSA tax savings systematically overstates the cost of HDHPs. Apply the user's marginal tax rate (if stated) or note the 22-32% typical range for working adults. A $4,150 individual HSA contribution at 24% = $996 in annual tax savings.

7. **Highlight every coverage difference where Policy A covers and Policy B does not (or vice versa).** These asymmetric coverage differences are decision-critical -- they may matter more than any price differential. Use the 🔴/🟡/🟢 flag system to communicate severity.

8. **For auto insurance comparisons, always check for UM/UIM coverage.** With approximately 1 in 8 U.S. drivers uninsured, the absence of uninsured/underinsured motorist coverage is a material coverage gap that must be identified and flagged if either policy lacks it or if the user has not confirmed it is present.

9. **Do not recommend the "cheaper" policy as the default answer.** The correct answer depends on the user's risk profile, claim history, risk tolerance, financial reserves, and coverage priorities. Present the decision framework so the user can apply their own priorities -- but explicitly state if a lower-cost option has a material coverage deficiency that changes its true value.

10. **If any comparison dimension is missing (i.e., the user did not provide it), ask for it rather than estimating.** A comparison built on assumed deductibles, assumed limits, or assumed exclusions produces false confidence. Mark missing data as [NOT PROVIDED -- REQUIRED] and request it before completing the analysis. The only exception is when a reasonable industry-standard default can be explicitly labeled as an assumption (e.g., "Assuming standard $300K/$100K liability if not otherwise stated -- confirm with your quote documents").

11. **For any exclusion that matches the user's identified risk profile, elevate it to a 🔴 Critical Gap, not a footnote.** If the user mentions they live in a flood zone and one policy lacks flood coverage, that exclusion is not informational -- it is a disqualifying coverage deficiency relative to their stated need.

12. **Always separate the "best for low-claims scenario" recommendation from the "best for high-claims scenario" recommendation.** The two answers are almost always different policies. Presenting one "winner" without qualifying the scenario context is analytically misleading.

---

## Edge Cases

### 1. Comparing Structurally Different Products (e.g., Term Life vs. Whole Life)

Term and whole/universal life are not comparable on the same cost basis without adjustment. Term provides pure death benefit protection for a defined period; whole life provides permanent coverage and builds cash value. The comparison framework must:
- Separate the insurance cost from the savings/investment component in whole life. The internal rate of return on whole life cash value is typically 2-4% for the first 10 years, rising to 4-5% over longer periods -- materially lower than equity market historical returns. The "buy term and invest the difference" calculation should be presented: if Term A costs $40/month and Whole Life B costs $400/month, the $360/month difference invested in a tax-advantaged account (Roth IRA, 401k) at 7% real return produces significantly more wealth over 30 years than the cash value component of the whole life policy in most scenarios.
- Focus the direct comparison on the insurance component: death benefit per dollar of annual premium. A $500K 20-year term at $30/month provides $500K coverage for $360/year; a $500K whole life policy at $450/month provides the same coverage plus cash value for $5,400/year.
- Note that whole life's premium is typically guaranteed level for life, while term expires and renewal at older ages is dramatically more expensive.
- Do not recommend one over the other -- present the mechanics and let the user apply their own goals (pure protection vs. permanent coverage and savings).

### 2. Health Insurance: Comparing an HDHP with HSA Eligibility Against a Traditional Plan

This is the most common and most analytically nuanced health insurance comparison. Key adjustments:
- The HDHP OOP max is the true worst-case out-of-pocket, but only for covered in-network services. If the user has providers outside the network, or the HDHP is an HMO with limited network, the true worst-case exposure is higher.
- Calculate the HSA tax savings as a reduction in the HDHP's effective annual cost. Many employers also contribute to the employee's HSA (common contribution: $500-$1,500/year) -- this further reduces the HDHP cost.
- HSA funds roll over indefinitely and can be invested. After age 65, HSA funds can be withdrawn for any purpose (not just medical) with ordinary income tax, functioning like a traditional IRA. This long-term optionality has value that does not appear in a one-year cost comparison.
- For a user with predictable, high annual medical expenses (ongoing prescriptions, frequent specialist visits, chronic condition management), the HDHP is typically more expensive because they will regularly hit the deductible and coinsurance. For a user with infrequent medical use, the HDHP is often less expensive on a premium-plus-utilization basis.
- Ask whether the user's employer offers an FSA (Flexible Spending Account) on the traditional plan. FSA contributions are also pre-tax (similar to HSA) but use-it-or-lose-it by plan year (with a $610 rollover allowed in 2024). An FSA on a traditional plan partially closes the HDHP's tax savings advantage.

### 3. Homeowner's Insurance with Multiple Deductible Types

Many homeowner's policies in coastal, tornado-prone, or hail-prone states have two or more deductible structures:
- A standard all-other-perils (AOP) deductible: typically $500-$2,500
- A wind/hail deductible: typically 1-5% of Coverage A, activated for named storms or any wind event depending on policy wording
- In Florida, Louisiana, and coastal Carolinas: a separate named storm or hurricane deductible (1-10% of Coverage A)
When comparing two policies, do not treat the AOP deductible as the operative deductible for the user's highest-probability claim event. If the user lives in a hail-prone area (large parts of Texas, Colorado, Oklahoma, Kansas, Nebraska), the wind/hail deductible is the deductible that will apply to their most likely claim. Always calculate and present the percentage deductible in dollar terms relative to the user's Coverage A limit.

### 4. User Only Has One Quote and Wants Guidance

If a user has a single quote and no comparators, the analysis takes a different form:
- Present the quote's terms against published industry benchmarks. For auto: average annual U.S. auto insurance premium is approximately $1,000-$1,400 for minimum coverage, $1,800-$2,400 for full coverage (varies significantly by state, age, driving record, vehicle). A quote materially above these ranges may indicate a rating factor the user should understand (recent claims, young driver, poor credit in states where credit-based insurance scoring is allowed).
- Model the quote at multiple deductible levels if the insurer offers tiered deductibles. Show the premium-deductible tradeoff across the available tiers ($250 / $500 / $1,000 / $2,500 deductibles).
- Recommend the user obtain at least two additional quotes before making a decision. For homeowner's insurance, getting 3 quotes is standard practice; auto insurance quote variance across carriers for the same risk profile can exceed 40%.

### 5. Bundling Discount Analysis

When a user is considering bundling auto and homeowner's (or other lines) with a single carrier vs. purchasing separately from the best individual provider for each line:
- Do not simply note that a discount exists. Quantify the math: "Carrier X offers 10% off both policies for bundling. At $1,800 auto and $1,200 home, the bundle saves $300/year. If Carrier Y offers the best standalone auto at $1,500 and Carrier Z offers the best standalone home at $950, the unbundled total is $2,450 vs. the bundled total of $2,700. In this example, best-of-breed standalone policies cost $250 less per year despite the bundling discount."
- Bundling discounts are typically 5-15% on each line. They do not always produce the lowest total cost, but they do simplify billing, potentially reduce claims complications (both losses covered by one carrier means no coverage dispute between insurers), and may produce loyalty pricing advantages at renewal.
- For auto + home bundles, a single carrier holding both policies may be more motivated to retain the customer at renewal, leading to better renewal rate increases than a single-line relationship.

### 6. User Has a Pending or Recent Claim (Mid-Policy Switch)

If the user is comparing policies while a claim is open or recently closed with their current carrier:
- An open claim should generally be resolved before switching carriers -- the incumbent carrier covers the reported incident, but a mid-claim cancellation can complicate subrogation and may affect claim resolution timing.
- A recently closed claim (past 3-5 years for auto, 3-7 years for home depending on carrier) will appear on the CLUE (Comprehensive Loss Underwriting Exchange) report and will be rated by any new carrier. The user cannot escape the claims history by switching. Any premium quote should be verified as the post-CLUE rate, not an initial clean-risk rate.
- For homeowners: a property-specific CLUE report (available free once per year) shows all claims filed on the property address, not just the current owner's claims. When buying a home and comparing insurance quotes, request the property CLUE report -- prior owner claims for water damage, foundation issues, or recurring roof claims may affect insurability or premium.

### 7. Life Insurance Medical Underwriting Differences

When comparing life insurance quotes from multiple carriers, the quoted premium is valid only if the insured qualifies for the assumed underwriting class. Standard underwriting classes from most favorable to least are:
- Preferred Plus / Super Preferred (lowest premium): requires no significant health history, BMI typically 25-30 or below, no tobacco, favorable family history
- Preferred: minor health factors allowed (well-controlled blood pressure, BMI up to approximately 35)
- Standard Plus / Standard: broader health history accepted
- Table-rated (substandard): pre-existing conditions or significant health history; premium is Standard × (1 + table multiplier, typically 25% per table)
- Decline: uninsurable at standard rates
When comparing life insurance quotes, always note that the comparison is between assumed underwriting classes. If one carrier's Preferred Plus quote is being compared to another carrier's Standard quote for the same person, the comparison is invalid. The real comparison happens post-underwriting. The preliminary quote is only a floor estimate.

### 8. Short-Term Health Plans vs. ACA-Compliant Plans

Short-term health plans are significantly cheaper than ACA-compliant plans (sometimes 50-80% lower premium) but are not regulated under ACA and:
- Can exclude pre-existing conditions entirely
- Have annual and lifetime benefit caps (eliminated for ACA plans)
- May exclude essential health benefits (maternity, mental health, prescription drugs, preventive care)
- Are not renewable if the insured develops a condition during coverage
- Do not qualify as minimum essential coverage under some state individual mandates
When a user is comparing a short-term plan against an ACA-compliant plan, the cost comparison must include an explicit coverage gap analysis. A short-term plan's $150/month premium vs. an ACA plan's $380/month premium represents a $2,760/year savings that could be wiped out by a single pre-existing condition exclusion or a major hospitalization that hits an annual benefit cap. Present the comparison with a prominent advisory that these are structurally different products.

---

## Example

**User input:** "I'm comparing two homeowner's insurance quotes for my house. Policy A is $1,650/year with a $1,000 deductible and replacement cost coverage. Policy B is $1,200/year with a $2,500 deductible and actual cash value coverage. My house is 12 years old, I've filed one claim in the past 5 years (a $4,200 water damage claim), and my mortgage lender requires at least $300,000 in dwelling coverage. I have about $500K in Coverage A on both quotes."

---

## Insurance Comparison Analysis

> All figures are taken from your stated quotes. Verify all numbers against your official policy documents before purchasing.

### Insurance Type: Homeowner's (Residential Property)
### Policy Form: Assumed HO-3 (Open Perils -- Dwelling; Named Perils -- Personal Property) -- confirm with each carrier
### Number of Policies Compared: 2
### Dwelling Coverage (Coverage A): $500,000 on both policies

---

### Policy Overview

| Feature | Policy A | Policy B |
|---------|----------|----------|
| Annual premium | $1,650 | $1,200 |
| Monthly equivalent | $137.50 | $100.00 |
| Standard (AOP) deductible | $1,000 | $2,500 |
| Valuation basis | **Replacement Cost Value (RCV)** | **Actual Cash Value (ACV)** |
| Coverage A (dwelling) | $500,000 | $500,000 |
| Lender requirement met ($300K+) | ✅ Yes | ✅ Yes |

**Valuation difference flagged immediately:** These two policies are not equivalent in coverage quality. The $450/year premium difference partially reflects a fundamental difference in how claims are paid -- not just the higher deductible of Policy B.

---

### Annual Cost Exposure by Scenario

| Scenario | Policy A (RCV / $1,000 ded.) | Policy B (ACV / $2,500 ded.) |
|----------|---------------------------:|---------------------------:|
| Zero claims | $1,650 | $1,200 |
| One small claim ($4,200 water damage -- similar to your prior claim) | $1,650 + $1,000 = **$2,650** | $1,200 + $2,500 = **$3,700** |
| One major structural claim ($60,000 fire damage) | $1,650 + $1,000 = **$2,650*** | $1,200 + $2,500 + ACV gap = **$5,700+*** |
| Two separate claims in one year | $1,650 + $2,000 = **$3,650** | $1,200 + $5,000 = **$6,200** |

**\*Major claim notes:**
- **Policy A (RCV):** Pays $59,000 (full $60,000 damage minus $1,000 deductible). No depreciation applied. Your cost = $1,000 deductible.
- **Policy B (ACV):** For a 12-year-old house with building components at varying depreciation rates: typical ACV payout on $60,000 structural damage could be reduced by 20-40% depreciation, netting $36,000-$48,000. You pay the $2,500 deductible PLUS the depreciation gap of $12,000-$24,000. Total insured cost in worst case: **$14,500-$26,500** beyond premium.

---

### Premium-Deductible Tradeoff (Controlling for Coverage Differences)

**Caution:** The standard break-even calculation assumes equivalent coverage. These policies are NOT equivalent due to ACV vs. RCV. The calculation below isolates the deductible and premium difference first, then separately quantifies the ACV gap.

**Step 1 -- Premium and deductible comparison (as if coverage were equivalent):**

| | Policy A | Policy B |
|--|--------:|--------:|
| Annual premium | $1,650 | $1,200 |
| Annual premium savings (B vs. A) | -- | **$450/year** |
| AOP deductible | $1,000 | $2,500 |
| Additional deductible exposure per claim | -- | +$1,500 |
| **Break-even: claims per year** | -- | **0.30 claims/year** |

**Interpretation of break-even:**
- 0.30 claims/year = 1 claim every 3.3 years
- If you file fewer than 1 claim every 3.3 years: Policy B's lower premium saves money on the deductible dimension alone
- If you file 1 or more claims every 3.3 years: Policy A's lower deductible offsets the premium difference
- **Your stated claim history is 1 claim in 5 years (0.20/year)** -- on the deductible/premium dimension alone, Policy B's lower premium slightly favors you financially

**But this is only part of the analysis.**

**Step 2 -- ACV depreciation gap (the factor that changes the conclusion):**

Your home is 12 years old. Depreciation on building components at year 12 is meaningful:
- Roof (25-year lifespan): 48% depreciated -- a $15,000 roof replacement yields ~$7,800 ACV payout; you cover $7,200 plus your $2,500 deductible
- HVAC (15-year lifespan): 80% depreciated -- a $8,000 system yields ~$1,600 ACV payout; you cover $6,400 plus deductible
- Interior finishes (variable): typically 30-50% depreciated at 12 years

**Estimated ACV depreciation gap for a moderate claim ($20,000 damage, mixed components, 12-year-old home):**
- Estimated ACV payout: $12,000-$14,000 (30-40% depreciation blended)
- Depreciation gap you absorb: $6,000-$8,000 beyond the $2,500 deductible
- Total out-of-pocket on a $20,000 claim under Policy B: **$8,500-$10,500**
- Total out-of-pocket on a $20,000 claim under Policy A: **$1,000**

The $450/year premium savings on Policy B breaks even against one moderate depreciated claim in **0.05-0.07 years (within months of a single moderate claim).**

---

### Coverage Quality Comparison

| Coverage Area | Policy A | Policy B | Notes |
|--------------|----------|----------|-------|
| Dwelling (Coverage A) | $500,000 RCV | $500,000 ACV | 🔴 **Critical difference -- see ACV analysis above** |
| Valuation basis | Replacement Cost | Actual Cash Value | 🔴 **Policy A pays full repair cost; Policy B pays depreciated value** |
| AOP deductible | $1,000 | $2,500 | 🟡 Policy A better on moderate-to-large claims |
| Lender coverage requirement | ✅ Met | ✅ Met | 🟢 Both compliant |
| Wind/hail deductible | **NOT PROVIDED** | **NOT PROVIDED** | ⚠️ Must confirm -- see note below |
| Personal property (Coverage C) | **NOT PROVIDED** | **NOT PROVIDED** | ⚠️ Confirm ACV vs. RCV on contents |
| Loss of use (Coverage D) | **NOT PROVIDED** | **NOT PROVIDED** | ⚠️ Confirm limit |
| Liability (Coverage E) | **NOT PROVIDED** | **NOT PROVIDED** | ⚠️ Standard is $100K; umbrella users need $300K+ |
| Water backup coverage | **NOT PROVIDED** | **NOT PROVIDED** | ⚠️ Important given your water damage claim history |
| Flood coverage | [Excluded -- standard] | [Excluded -- standard] | 🟢 Both excluded -- expected; verify if you are in a flood zone |

---

### Coverage Flags Requiring Immediate Attention

🔴 **Critical: ACV vs. RCV Valuation**
Policy B pays Actual Cash Value, which means claim payouts are reduced by depreciation. At 12 years of home age, this is a material financial exposure -- not a theoretical one. On any significant structural or systems claim, you will receive substantially less than the cost of repair or replacement. For a 12-year-old home, RCV coverage is the correct standard unless you have the financial reserves to self-fund the depreciation gap.

🔴 **Critical: Wind/Hail Deductible -- Confirm Before Deciding**
You have not provided the wind/h
