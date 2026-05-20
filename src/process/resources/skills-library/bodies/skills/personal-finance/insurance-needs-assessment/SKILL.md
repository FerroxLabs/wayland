---
name: insurance-needs-assessment
description: |
  Evaluates insurance coverage gaps across health, life, disability, auto, and renters/homeowners categories based on the user's life situation, dependents, assets, and income. Produces a coverage assessment matrix identifying what the user has, what they may need, and what to evaluate further with a licensed professional.
  Use when the user asks about insurance needs, wants to evaluate their coverage, or wonders what types of insurance they should consider.
  Do NOT use for comparing specific insurance policies or providers (this requires licensed professional evaluation), health insurance enrollment help, or business insurance needs.
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
# Insurance Needs Assessment

> **Disclaimer:** This skill provides educational information about insurance concepts and general guidance for personal financial planning. It does NOT constitute financial advice, insurance advice, or professional recommendations. Individual circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified, licensed insurance professional before purchasing or modifying any insurance coverage.

---

## When to Use

**Use this skill when:**
- A user explicitly asks what types of insurance they should have given their life situation, or says something like "do I have enough coverage?"
- A user is experiencing a qualifying life event -- marriage, divorce, birth or adoption of a child, home purchase, job change, retirement, or death of a spouse -- and wants to understand how their insurance needs have shifted
- A user is building a first-time financial plan and wants to understand what insurance coverage is foundational versus optional
- A user says they have not reviewed their insurance in several years and wants to identify potential gaps
- A user is transitioning from employer-provided benefits to self-employment or COBRA and wants to understand what coverage they may be losing
- A user wants to understand the purpose and logic of different insurance types before meeting with a licensed agent or broker
- A user has received an inheritance, significant raise, or major asset accumulation event and wants to know whether their current coverage is still appropriate

**Do NOT use when:**
- The user wants to compare specific named policies, providers, or premium quotes -- refer them to a licensed independent insurance broker
- The user needs help with open enrollment decisions for employer-sponsored health insurance (use a dedicated health insurance enrollment skill)
- The user needs business, commercial liability, errors and omissions, workers' compensation, or key-person insurance guidance (use a business insurance skill)
- The user needs help filing a claim, disputing a denial, or understanding specific policy language -- refer them to their insurer's claims department or a licensed public adjuster
- The user is asking about specialty insurance products like travel insurance, pet insurance, boat insurance, or collectibles coverage (these require specialized assessment outside this skill's scope)
- The user is asking about annuities or life insurance as an investment vehicle -- this crosses into investment advice territory and requires a licensed financial advisor

---

## Process

### Step 1: Gather Life Situation Profile

Before assessing coverage, collect the full picture. Ask the user directly for any missing information, since coverage recommendations change substantially based on these factors.

- **Age and life stage:** Exact age is not needed, but bracket matters -- 20s (building phase), 30s-40s (peak earning, dependents), 50s (pre-retirement), 60s+ (retirement/Medicare transition). Coverage needs and available products shift by decade.
- **Household composition:** Marital/partner status, number and ages of dependents, whether any dependents have special needs or health conditions, whether the user supports aging parents financially.
- **Employment status and benefits:** W-2 employee with full benefits, W-2 with limited benefits, 1099 contractor, self-employed/sole proprietor, part-time, unemployed, or retired. Employer benefits are the backbone of most people's insurance portfolios -- know exactly what they have.
- **Income structure:** Total annual household income, how many earners, whether income is salary/stable or variable (commissions, freelance). A household with two earners has different life insurance dynamics than one with a single breadwinner.
- **Housing status:** Own outright, own with mortgage (note the remaining balance), rent (note whether month-to-month or lease), or live with family. Determines homeowners vs. renters need and liability exposure.
- **Vehicles:** Number owned, estimated current market value of each (not purchase price -- current ACV), loan or lease status, frequency of use, and whether the user drives for rideshare (this creates a critical coverage gap).
- **Assets:** Total approximate retirement savings, taxable investments, savings/emergency fund, and estimated home equity. High asset levels elevate the need for liability protection.
- **Debts:** Mortgage balance, auto loans, student loans, personal loans. Co-signed debts survive the borrower's death and become critical life insurance drivers.
- **Current coverage inventory:** List everything they have -- policy type, approximate coverage amounts if known, employer-provided vs. personally purchased, who is covered.

### Step 2: Apply the Income Replacement Framework for Life Insurance

Life insurance is the most emotionally complex and mathematically nuanced coverage category. Apply a structured framework rather than a simple multiplier.

- **The DIME method** is a standard industry framework: Debt (all outstanding debts the household carries), Income (annual income multiplied by the number of years dependents will need support), Mortgage (remaining balance to pay off the home), Education (estimated future education costs for children). Sum these four values to estimate the total death benefit need.
- **The income multiplier shortcut:** The "10-12x annual income" rule is commonly cited but oversimplified. It underestimates for young families with large mortgages and small savings. It overestimates for households near retirement with significant assets and no dependents.
- **Two-earner households:** Both earners typically need coverage, but amounts may differ based on income differential and whether one earner's income primarily covers childcare (replacing that income would require significant paid childcare costs).
- **Stay-at-home parents need life insurance too.** The economic value of unpaid childcare, household management, and elder care can exceed $100,000 per year in replacement cost. Do not skip this assessment because someone has no "income."
- **Term vs. permanent:** For the purposes of this skill, do not recommend policy type. Simply flag that a coverage gap exists and that the licensed professional conversation should include discussion of term vs. whole/universal and appropriate term length.
- **Single individuals without dependents:** Generally do not need life insurance unless they have co-signed debts (private student loans with a co-signer, joint personal loans) or want to cover final expenses for family who would otherwise bear those costs.

### Step 3: Assess Disability Insurance with Specific Benchmarks

Disability insurance is dramatically undervalued and underutilized. Most financial professionals consider it the single most important coverage for working-age adults, yet it is the most commonly skipped.

- **Probability framing:** Social Security Administration data consistently shows that roughly 1 in 4 workers will experience a disability lasting 90 days or more before reaching retirement age. By contrast, the probability of dying prematurely is lower, yet life insurance receives far more attention.
- **Benchmark adequacy:** The standard target for disability coverage is 60-70% of gross pre-disability income. This is lower than 100% because disability benefits from own-occupation or employer policies paid with post-tax premiums are often tax-free, so a lower gross replacement approximates the same net income.
- **Employer short-term disability (STD):** Typically covers 60-70% of salary for 60-180 days, with a waiting period of 0-14 days. Assess what the user's employer provides.
- **Employer long-term disability (LTD):** Typically activates after the STD period ends and provides 50-60% of salary to age 65 or Social Security Normal Retirement Age. Many employer policies cap benefit amounts at $5,000-$10,000 per month, creating a gap for higher earners.
- **"Own-occupation" vs. "any-occupation" definition:** This is a critical policy quality distinction. Own-occupation pays if the insured cannot perform their specific job; any-occupation pays only if they cannot perform any job. A surgeon with a hand injury may be unable to perform surgery but technically "able to work" under an any-occupation policy. Flag this distinction without recommending a specific policy.
- **Elimination period:** The waiting period before benefits begin (typically 90 days for LTD). A strong emergency fund (3-6 months of expenses) bridges this gap. If the user lacks adequate savings, a shorter elimination period is more important.
- **Self-employed individuals:** Have no employer disability coverage. Individual disability policies are essential and are also more expensive because the self-employed cannot spread risk through an employer group.

### Step 4: Evaluate Property and Casualty Insurance with Specific Coverage Benchmarks

Property and casualty coverage -- homeowners, renters, and auto -- has specific mathematical thresholds that determine adequacy versus underinsurance.

- **Homeowners insurance -- dwelling coverage:** Must be based on replacement cost value (RCV), not market value or mortgage balance. RCV is what it costs to rebuild the structure at today's construction costs, which in many markets significantly exceeds the home's market value. A rough benchmark for RCV is $150-300 per square foot depending on region and construction quality, though this varies substantially. Underinsurance is extremely common -- if the policy reflects the purchase price from 10 years ago without adjustment for construction cost inflation, the coverage is likely inadequate.
- **Homeowners insurance -- personal property:** Typically set at 50-75% of dwelling coverage by default. For households with high-value items (jewelry, art, musical instruments, firearms, electronics), scheduled personal property endorsements or floaters are needed. Standard policies cap reimbursement for jewelry at $1,000-2,500 per item.
- **Homeowners insurance -- liability:** Standard policies include $100,000-300,000 of personal liability coverage. Given median household net worth, most households with owned assets above $300,000 should evaluate whether this is sufficient.
- **Renters insurance:** Clarify that landlord policies cover the building structure only -- not the tenant's belongings and not the tenant's personal liability. A typical renters policy costs $15-30/month and provides $20,000-50,000 of personal property coverage plus $100,000 of liability. This is one of the most cost-effective insurance products available.
- **Auto insurance -- liability limits:** Most states require minimum liability coverage in the range of 25/50/25 (bodily injury per person/bodily injury per accident/property damage), but these minimums are often woefully inadequate. Industry guidance generally recommends at least 100/300/100, and ideally higher for households with significant assets. A serious multi-vehicle accident can easily generate $500,000+ in claims.
- **Auto insurance -- comprehensive and collision:** For vehicles with a loan or lease, comprehensive and collision are required by the lender. For owned vehicles, the decision framework is: if the vehicle's current ACV is less than approximately 10 times the annual combined comp/collision premium, dropping this coverage may be financially rational. Below a vehicle value of roughly $4,000-5,000, many advisors suggest this calculation.
- **Auto insurance -- uninsured/underinsured motorist (UM/UIM):** Often overlooked but critically important. Approximately 12-15% of drivers are uninsured nationwide, and many more carry minimum limits. UM/UIM covers the insured's injuries and damages when the at-fault driver has no insurance or insufficient insurance. This coverage is inexpensive relative to its protection value.

### Step 5: Assess Umbrella Liability Coverage Against Asset Thresholds

Umbrella insurance is the most commonly overlooked coverage among middle-income households that have accumulated meaningful assets.

- **Trigger threshold:** A general rule of thumb is that an umbrella policy becomes worth evaluating once total net worth (assets minus debts) exceeds approximately $300,000-500,000. At this level, standard home and auto liability limits may not fully protect accumulated assets in a serious lawsuit.
- **Coverage structure:** Umbrella policies sit above the liability limits of existing home, auto, and sometimes other policies. A $1 million umbrella policy typically requires underlying auto liability of at least 250/500/250 and homeowners liability of at least $300,000.
- **Risk exposure factors that elevate umbrella priority:** owning a pool or trampoline (attractive nuisance doctrine), owning dogs (bite liability), teenage drivers in the household, frequent hosting/entertaining, high public profile, coaching youth sports, or serving on a nonprofit board.
- **Cost vs. benefit:** Umbrella policies are typically $150-350/year for $1 million in coverage and $75-150/year for each additional million. This is one of the highest-value insurance products per dollar of premium for asset-holding households.

### Step 6: Rate Each Coverage Gap by Priority and Life Situation Specificity

Not all gaps are equal. A systematic prioritization framework ensures the user understands what to address first.

- **Critical gaps:** Uninsured risk that could cause catastrophic, unrecoverable financial harm. Examples: no health insurance, no life insurance with young dependents and a large mortgage, no auto liability with an active vehicle, no homeowners insurance with a mortgaged property. These are not optional -- they must be addressed immediately.
- **Important gaps:** Significant uninsured risks that could cause serious but potentially recoverable financial harm. Examples: no disability insurance with sole-earner household, auto liability limits below assets, no renters insurance (low cost, high protection value).
- **Worth evaluating:** Coverage that represents a genuine need but where the priority depends on budget and other financial priorities. Examples: umbrella policy at moderate asset levels, supplemental disability above employer LTD, life insurance above basic mortgage payoff for single-dependent households.
- **Not currently needed:** Be explicit about coverage that is not indicated for the user's specific situation to avoid recommendation fatigue. Example: life insurance for a 27-year-old single renter with no dependents, no co-signed debts, and no intention to start a family in the near term.

### Step 7: Construct the Coverage Matrix and Action Plan

Synthesize the full assessment into a structured output that the user can use in a conversation with a licensed professional.

- Present the full matrix with all six standard coverage types evaluated, even if some are "Not Applicable" -- this confirms the assessment is comprehensive.
- For each gap, provide the "why it matters for your situation" explanation, not just a generic description of the coverage type.
- Flag which items require licensed professional engagement versus which are informational or self-verifiable (e.g., the user can verify their employer LTD coverage in their benefits portal without professional help).
- Include a trigger-based review reminder: document which life events should prompt a re-assessment. Marriage, divorce, new child, home purchase, job change with benefit change, significant income increase, inheritance, and retirement are the primary triggers.
- Note jurisdictional variables explicitly where they affect the assessment -- auto insurance minimums, health insurance mandates, and community property state implications for life insurance all vary by location.

---

## Output Format

```
## Insurance Needs Assessment

> **Disclaimer:** This assessment is educational and does not constitute insurance or financial advice. Consult a licensed insurance professional before purchasing or modifying any coverage.

---

### Life Situation Profile
| Factor                  | User's Status                        |
|-------------------------|--------------------------------------|
| Age range               | [Bracket: 20s / 30s / 40s / 50s / 60s+] |
| Household composition   | [Single / Married / Partnered + dependents] |
| Dependents              | [Number, ages, and any special needs] |
| Employment status       | [W-2 with benefits / Self-employed / Retired / etc.] |
| Employer-provided coverage | [Summary of what employer provides] |
| Housing status          | [Own with mortgage $XXX,XXX / Rent / Own outright] |
| Vehicles                | [Number, approximate ACV, loan/lease status] |
| Approximate annual income | ~$XX,XXX (single earner / dual earner) |
| Approximate total assets  | ~$XXX,XXX |
| Approximate total debts   | ~$XXX,XXX |
| Approximate net worth     | ~$XXX,XXX |

---

### Coverage Assessment Matrix

| Insurance Type      | Current Status         | Assessed Need Level | Gap Status         | Priority Level       |
|---------------------|------------------------|---------------------|--------------------|----------------------|
| Health              | [Have / None / Partial]| Essential           | [Covered / GAP / Unknown] | [OK / Critical / Verify] |
| Life                | [Have $X / None]       | [High / Moderate / Low / None] | [Covered / GAP / Partial] | [Critical / Important / N/A] |
| Disability -- STD   | [Employer / None]      | [High / Moderate]   | [Covered / GAP / Unknown] | [Critical / Important] |
| Disability -- LTD   | [Employer $X cap / None / Own] | [High / Moderate] | [Covered / GAP / Partial] | [Critical / Important] |
| Homeowners / Renters| [Have / None]          | [Essential / Recommended] | [Covered / GAP] | [OK / Critical]      |
| Auto -- Liability   | [Have X/X/X limits / None] | [Required / High] | [Covered / Underinsured / GAP] | [OK / Important / Critical] |
| Auto -- Comp/Collision | [Have / None / N/A] | [Required by lender / Optional] | [Covered / GAP / N/A] | [OK / Evaluate / N/A] |
| Auto -- UM/UIM      | [Have / None / Unknown]| [Recommended]       | [Covered / GAP / Unknown] | [Important / Verify] |
| Umbrella / Liability| [Have $X / None]       | [Recommended / Low priority] | [GAP / Not Yet Needed] | [Important / Worth Evaluating / N/A] |

---

### Detailed Coverage Analysis

#### Health Insurance
- **Current status:** [Description of current coverage source and any known gaps]
- **Assessment:** [Analysis specific to the user's employment, family composition, and health situation]
- **Key questions to verify:** [E.g., is the deductible manageable? Is the spouse/dependents covered? Out-of-pocket maximum?]
- **Gap identified:** [Specific gap description, or "No gap identified at this time"]
- **Recommended next step:** [Action item]

---

#### Life Insurance
- **Current status:** [Description -- employer group term, personal policy, none]
- **DIME Framework estimate:**
  - Debt (non-mortgage): ~$X,XXX
  - Income replacement ([X] years × $XX,XXX): ~$XXX,XXX
  - Mortgage payoff: ~$XXX,XXX
  - Education (if applicable, [X] children): ~$XX,XXX per child
  - **Total estimated need:** ~$XXX,XXX -- $XXX,XXX
- **Current coverage:** ~$XXX,XXX
- **Estimated gap:** ~$XXX,XXX (if applicable)
- **Key note:** [Stay-at-home parent flag if applicable; co-signed debt flag if applicable; employer group term portability flag if applicable]
- **Gap identified:** [Description or "No gap identified at this time"]
- **Recommended next step:** [Action item]

---

#### Disability Insurance -- Short-Term (STD)
- **Current status:** [Employer-provided or none; percentage of income, waiting period, duration]
- **Benchmark:** Target 60-70% of gross income replacement
- **Assessment:** [Does current coverage meet or approach benchmark? What income falls unprotected?]
- **Gap identified:** [Description or "No gap identified at this time"]
- **Recommended next step:** [Action item]

#### Disability Insurance -- Long-Term (LTD)
- **Current status:** [Employer-provided or personal; percentage, monthly cap, benefit period, own-occupation vs. any-occupation definition if known]
- **Benchmark:** Target 60-70% of gross income; own-occupation definition preferred; benefit to age 65
- **Assessment:** [Does monthly cap limit coverage for the user's income? Is the definition adequate?]
- **Gap identified:** [Description or "No gap identified at this time"]
- **Recommended next step:** [Action item]

---

#### Homeowners / Renters Insurance
- **Current status:** [Have policy / none; whether replacement cost or ACV basis is known]
- **Assessment:**
  - Dwelling coverage vs. estimated replacement cost: [Assessment]
  - Personal property coverage and any high-value item exposure: [Assessment]
  - Liability limit: [Current limit vs. net worth context]
- **Gap identified:** [Description or "No gap identified at this time"]
- **Recommended next step:** [Action item]

---

#### Auto Insurance
- **Current status:** [Liability limits, comp/collision status, UM/UIM status, any rideshare use noted]
- **Assessment:**
  - Liability limits vs. asset protection need: [Assessment]
  - Comp/collision appropriateness given vehicle ACV: [Assessment]
  - UM/UIM status: [Assessment]
- **Gap identified:** [Description or "No gap identified at this time"]
- **Recommended next step:** [Action item]

---

#### Umbrella / Personal Liability
- **Current status:** [Have / none]
- **Net worth context:** ~$XXX,XXX
- **Risk exposure factors present:** [Pool, teenage drivers, dogs, frequent hosting, etc. -- or "None identified"]
- **Assessment:** [Is umbrella recommended, not yet a priority, or borderline?]
- **Gap identified:** [Description or "Not a current priority based on asset level"]
- **Recommended next step:** [Action item]

---

### Priority Gap Summary

| Priority | Gap | Why It Matters for Your Situation | Recommended Action |
|----------|-----|-----------------------------------|--------------------|
| 🔴 Critical | [Coverage type] | [Specific explanation tied to user's life situation] | [Specific next step] |
| 🔴 Critical | [Coverage type] | [Specific explanation] | [Specific next step] |
| 🟡 Important | [Coverage type] | [Specific explanation] | [Specific next step] |
| 🟢 Worth Evaluating | [Coverage type] | [Specific explanation] | [Specific next step] |

---

### Recommended Action Plan
- [ ] **Immediate (within 30 days):** [Most urgent action -- typically filling a Critical gap]
- [ ] **Near-term (within 60-90 days):** [Second priority action]
- [ ] **Evaluate this year:** [Important but not urgent gaps]
- [ ] **Verify with employer:** [Benefits portal check items]
- [ ] **Annual review trigger:** Schedule a full insurance review when any of the following occur: marriage, divorce, new child, home purchase or sale, job change affecting benefits, income increase above 20%, inheritance or major asset acquisition, or reaching age 65 / Medicare eligibility.

---

### Note on Jurisdictional Variations
[Flag any coverage areas where location affects legal requirements or options -- auto minimums, health insurance mandates, community property implications for life insurance, no-fault vs. tort auto states, flood zone requirements for homeowners, etc.]
```

---

## Rules

1. **Always display the disclaimer before providing assessment content.** The disclaimer is not optional formatting -- it is a substantive protection and must appear before the coverage matrix, not buried at the end.

2. **Never name specific insurers, policies, or agents.** Do not recommend GEICO, State Farm, Nationwide, Aflac, or any other brand by name. The role of this skill ends where licensed product selection begins.

3. **Never state specific premium amounts.** Premiums are underwritten individually based on age, health, location, credit history, claims history, coverage amount, deductible choices, and dozens of other factors. Saying "renters insurance costs about $20/month" is a generalization that can mislead. Use ranges only and always caveat that quotes require individual underwriting.

4. **Use the DIME framework for life insurance estimation, not a single income multiplier.** The "10x income" shorthand is a starting point for conversation, not an accurate needs estimate. A 35-year-old with a $400,000 mortgage, two young children, $20,000 in savings, and a stay-at-home spouse needs dramatically more coverage than someone with the same income but no dependents and significant assets.

5. **Always assess both earners in a two-income household.** The survivor of a two-income household losing one income faces both an income reduction AND often increased expenses (childcare, household services). Both earners require their own life and disability coverage analysis.

6. **Frame disability insurance as income protection, and use the 1-in-4 probability statistic.** Most users dramatically underestimate their disability risk and dramatically overestimate their life insurance risk. Correcting this misconception is a service this skill can provide without crossing into advice.

7. **Distinguish between short-term and long-term disability separately.** These are distinct products covering different risk windows. An employee may have robust STD but inadequate LTD (or vice versa). Always assess both, and flag the elimination period gap that emergency savings must cover.

8. **Flag the own-occupation vs. any-occupation distinction for professional workers.** This is a documented source of coverage inadequacy that is not marketing -- it is a substantive policy quality difference that determines whether a policy actually pays in real-world disability scenarios for professionals.

9. **Never suggest a user is financially irresponsible for having gaps.** Insurance gaps are extremely common, often the result of enrollment confusion, life transitions, financial constraints, or simply not knowing what questions to ask. Frame every gap as an opportunity, not a failure.

10. **Always flag jurisdictional variables where they affect the assessment.** At minimum, note that auto insurance requirements vary by state, that health insurance mandate status varies by jurisdiction, that no-fault vs. tort auto states have different uninsured motorist implications, and that community property states may affect life insurance beneficiary and ownership structuring. Do not attempt to apply jurisdiction-specific law; flag it and defer to local professional.

11. **Flag the rideshare coverage gap if the user mentions driving for Uber, Lyft, or similar platforms.** Personal auto policies typically exclude commercial use. There is a specific coverage gap during "Period 1" (app on, no ride accepted) that the rideshare company's coverage does not fill and personal policies explicitly exclude. This is a genuine Critical gap that is commonly unknown.

12. **For homeowners, distinguish between replacement cost value (RCV) and actual cash value (ACV) policies.** ACV policies deduct depreciation from claims, which can result in a payout far below what it costs to actually replace damaged property. An older roof under an ACV policy may receive a fraction of replacement cost. This distinction matters enormously and is commonly misunderstood.

---

## Edge Cases

### Young Single Adult (22-28), No Dependents, Renting

This is the scenario where the most recommendation fatigue and unnecessary coverage are pushed. Be disciplined.

- Life insurance: Generally not indicated unless co-signed private student loans exist (a co-signer parent would owe the balance at the borrower's death) or the user wants a small final expense policy to avoid burdening family.
- Health insurance: Critical and essential. If not employer-provided, discuss marketplace options, Medicaid eligibility thresholds, and the risk of being uninsured even briefly.
- Disability: High need that is typically overlooked at this life stage. A young person has the longest remaining earning career of anyone -- the financial impact of a disabling condition at 24 is catastrophic at actuarial timescales.
- Renters: Strongly recommended. The cost-to-protection ratio is among the best of any insurance product. Highlight that most entry-level renters assume their landlord's insurance covers them.
- Auto: Cover legal requirements, liability adequacy relative to any assets, and whether comp/collision is warranted given the vehicle's value and any loan status.
- Umbrella: Not typically indicated at this net worth level unless there are specific risk factors.

### Self-Employed Individual Without Employer Benefits

This is the highest-complexity scenario because every coverage must be obtained independently.

- Health insurance: No employer-sponsored group plan. Options include ACA marketplace plans (assess premium tax credit eligibility based on income), professional association group plans, or spouse's employer plan if available. Highlight that self-employed health insurance premiums are generally deductible above the line -- flag this for their tax professional.
- Disability: This is the single most urgent gap for self-employed individuals. No employer STD, no employer LTD, often no sick leave. The elimination period should match available savings. Own-occupation definition is especially critical for skilled professionals (attorneys, physicians, tradespeople, consultants).
- Life: Assess per the DIME framework based on dependents. Same logic applies, but there is no employer group term to supplement.
- Business-from-home note: Standard homeowners/renters policies typically exclude business property and business liability. A home-based business (even a sole proprietorship with a laptop and client meetings) may need a home business endorsement or separate BOP (Business Owners Policy). Note this and refer to the business insurance skill.
- Retirement accounts and income variability: Self-employed income often fluctuates, which affects how disability benefit amounts are calculated (policies typically use average income over 2 prior tax years). Flag that disability benefits may require income documentation.

### Divorce or Legal Separation in Progress

This is a time-sensitive scenario with multiple simultaneous coverage issues.

- Health insurance: If the user is covered under a departing spouse's employer plan, they lose coverage upon divorce. COBRA provides continuation for up to 36 months for dependents after qualifying events, but it is expensive. Divorce is a qualifying life event that opens an ACA special enrollment period.
- Life insurance beneficiaries: Most life insurance policies allow the policyholder to change beneficiaries at any time without court involvement. However, some states and some policy types (particularly irrevocable beneficiary designations or policies tied to divorce decrees) complicate this. Flag that all beneficiary designations should be reviewed immediately and updated as appropriate.
- Children's coverage: If children exist, confirm which parent's plan covers them post-divorce, and confirm the divorce agreement addresses this.
- Property insurance: If both spouses are on a homeowners policy and one is vacating the home, the policy structure may need revision. A vacated home sometimes loses coverage under standard occupancy requirements.
- Auto: Vehicles may be re-titled during divorce. Policy must follow ownership.
- Do not provide legal advice about the divorce itself. Flag every item as "review with your attorney and a licensed insurance professional during this process."

### High-Net-Worth Household (Net Worth $1M+)

This scenario reverses some common assumptions about coverage priorities.

- Umbrella becomes a top priority, not a consideration. A $1 million umbrella policy is often not sufficient at this asset level -- $2-5 million policies are available and relatively inexpensive on a per-dollar-of-coverage basis. Legal judgments exceeding standard policy limits are asset-seizure events.
- Homeowners: At this level, scheduled personal property coverage for jewelry, art, and collectibles becomes material. Fine arts floaters, jewelry endorsements, and wine collection endorsements may be applicable.
- Life insurance: May be less urgent if assets are sufficient to sustain dependents without the insured's income. The DIME calculation may show that existing assets cover much of the need. However, estate planning interplay with life insurance (irrevocable life insurance trusts, or ILITs) becomes relevant -- flag for an estate planning professional, not this skill.
- Disability: Still important regardless of net worth. If the household lifestyle depends on sustained income generation, disability protection remains relevant until the user reaches "financial independence" defined as assets generating sufficient passive income to cover all expenses.

### Mortgaged Homeowner Without Homeowners Insurance

This is a Critical gap with a legal dimension. Almost all mortgage lenders require homeowners insurance as a condition of the loan. If a borrower lapses coverage, the lender typically has the contractual right to purchase "force-placed" insurance on the property and charge the cost to the borrower -- at rates often 3-10 times higher than market rates, with coverage that protects only the lender's interest, not the borrower's personal property or liability. Flag this immediately and treat it as Critical.

### Rideshare Driver (Uber, Lyft, or Similar)

This scenario contains a specific, well-documented and dangerous coverage gap that is not widely understood.

- **Period 0** (app off, personal driving): Personal auto policy applies normally.
- **Period 1** (app on, waiting for a ride request): Most personal auto policies explicitly exclude coverage during this phase, and rideshare company policies provide only limited liability coverage (typically $50,000 per person/$100,000 per accident). A personal injury accident during Period 1 may leave the driver with no collision coverage and limited liability protection.
- **Period 2-3** (ride accepted through trip completion): Rideshare company provides $1 million liability coverage. Coverage is more robust here.
- The solution is a rideshare endorsement added to the personal auto policy, or a commercial auto policy. Not all insurers offer rideshare endorsements. Flag this as a Critical gap if the user mentions rideshare driving, even casually ("I drive for Uber on weekends").

### Elderly Parent with Medicare Transition

Users aged 64-65 or users helping an aging parent navigate the Medicare transition face a specialized scenario.

- Medicare Part A (hospital) is generally automatic at 65 with Social Security eligibility. Part B (medical) requires enrollment and carries a premium.
- The "coverage gap" around the 65th birthday is a documented source of uninsured periods if enrollment is not timed correctly. Delaying Part B enrollment without qualifying alternative coverage results in permanent premium penalties.
- Medicare does not cover long-term care, dental, vision, or hearing -- these are the most commonly cited coverage surprises.
- Long-term care insurance is relevant at this life stage but is a complex product outside the core scope of this skill. Flag it as a topic for professional evaluation.
- Do not attempt to provide Medicare enrollment guidance -- refer to the Social Security Administration, State Health Insurance Assistance Programs (SHIPs), or a licensed Medicare specialist.

---

## Example

**User Input:** "I'm 34 years old, married, two kids ages 4 and 1. My wife stays home with the kids. I make $110,000 a year as a software engineer. I own a house, we owe $340,000 on the mortgage, the house is probably worth $420,000 now. I have about $85,000 in my 401k and maybe $18,000 in savings. I have health insurance through work, they give me some life insurance as part of my benefits package -- I think it's 2x salary, and I have homeowners insurance. I drive a 2020 SUV that I'm still paying off. No other insurance that I can think of. What am I missing?"

---

## Insurance Needs Assessment

> **Disclaimer:** This assessment is educational and does not constitute insurance or financial advice. Consult a licensed insurance professional before purchasing or modifying any coverage.

---

### Life Situation Profile

| Factor                  | Status                                          |
|-------------------------|-------------------------------------------------|
| Age range               | Mid-30s (34)                                   |
| Household composition   | Married, two young children (ages 4 and 1)     |
| Dependents              | Spouse (non-working) + 2 children               |
| Employment status       | W-2 employee, employer benefits provided        |
| Employer-provided coverage | Health insurance, group life insurance (2x salary = ~$220,000) |
| Housing status          | Own with mortgage ($340,000 remaining; ~$80,000 equity) |
| Vehicles                | 1 SUV (2020, still under auto loan)             |
| Annual household income | ~$110,000 (sole earner)                         |
| Approximate total assets | ~$103,000 liquid/retirement + home equity ~$80,000 = ~$183,000 |
| Approximate total debts  | ~$340,000 mortgage + auto loan (amount unknown) |
| Approximate net worth    | ~$183,000 - outstanding auto loan balance       |

---

### Coverage Assessment Matrix

| Insurance Type        | Current Status             | Assessed Need Level | Gap Status        | Priority Level   |
|-----------------------|----------------------------|---------------------|-------------------|------------------|
| Health                | Have (employer)            | Essential           | Covered           | ✅ OK             |
| Life                  | Employer group ($220,000)  | Very High           | 🔴 Severely underinsured | 🔴 Critical |
| Life -- Stay-at-home spouse | None              | High                | 🔴 GAP            | 🔴 Critical       |
| Disability -- STD     | Unknown (verify employer)  | High                | ⚠️ Unknown        | 🟡 Verify         |
| Disability -- LTD     | Unknown (verify employer)  | Very High           | ⚠️ Unknown        | 🔴 Critical       |
| Homeowners            | Have (verify limits)       | Essential           | ⚠️ Verify limits  | 🟡 Review         |
| Auto -- Liability     | Have (amounts unknown)     | Required + High     | ⚠️ Unknown        | 🟡 Verify         |
| Auto -- Comp/Collision| Likely required (loan)     | Required by lender  | Likely covered    | ✅ Likely OK      |
| Auto -- UM/UIM        | Unknown                    | Recommended         | ⚠️ Unknown        | 🟡 Verify         |
| Umbrella / Liability  | None                       | Worth evaluating    | Gap               | 🟢 Worth Evaluating|

---

### Detailed Coverage Analysis

#### Health Insurance
- **Current status:** Employer-provided for the employee. Coverage of spouse and children was not confirmed -- this should be verified.
- **Assessment:** Assuming the full family is covered under the employer plan, this is the baseline coverage for a family of four. The adequacy of the plan (deductible, out-of-pocket maximum, network) is beyond the scope of this assessment but worth reviewing annually during open enrollment.
- **Key questions to verify:** Are the spouse and children on the plan? What is the annual out-of-pocket maximum for the family?
- **Gap identified:** Potential gap if spouse and children are not enrolled on the employer plan. Confirm family enrollment status.
- **Recommended next step:** Verify family coverage in your employer benefits portal.

---

#### Life Insurance

**This is the most significant gap in this household's coverage profile.**

- **Current status:** Employer-provided group term life insurance at 2x salary = approximately $220,000. This is the only life insurance identified.

- **DIME Framework Estimate:**

| Component | Calculation | Estimate |
|-----------|-------------|----------|
| Debt (non-mortgage, auto loan) | Unknown auto loan balance -- assume ~$20,000 | ~$20,000 |
| Income replacement (sole earner, youngest child age 1, ~18 years to independence) | 18 years × $110,000 | ~$1,980,000 |
| Mortgage payoff | Remaining balance | ~$340,000 |
| Education (2 children × ~$80,000-120,000 per child in-state 4-year) | Mid-range estimate | ~$200,000 |
| **Total estimated need** | | **~$2,500,000 -- $2,540,000** |

- **Current coverage:** ~$220,000 (employer group term)
- **Estimated gap:** Approximately $2,200,000 -- $2,300,000

- **Key notes:**
  - Employer group term life insurance is typically not portable -- if you leave this job, you lose this coverage. Personal term life coverage is owned by you regardless of employment status.
  - The income replacement need is large because this household has a sole earner, two very young children, a non-working spouse who would need either to reenter the workforce or obtain childcare, and 18 years of income replacement need ahead.
  - A 20- or 25-year term policy purchased at age 34 would cover children through to adulthood and into the mortgage payoff window.

- **Stay-at-home spouse life insurance:**
  - The spouse currently has no income, but the economic value of full-time childcare for a 4-year-old and a 1-year-old is substantial. Full-time childcare in most U.S. metro areas costs $25,000-$45,000+ per year for two children. If the spouse were to pass away, the working spouse would need to fund that replacement care, often while also dealing with grief and workplace impact.
  - A modest life insurance policy on the stay-at-home spouse -- commonly assessed at $300,000-$500,000 -- covers the economic replacement cost of household services during the critical years.

- **Gap identified:** Severely underinsured on primary earner life insurance (approximately $2.2M gap by DIME framework). No coverage on stay-at-home spouse.
- **Recommended next step:** Consult a licensed insurance professional or independent broker for a formal needs analysis and term life quotes. This is the single highest-priority action in this assessment.

---

#### Disability Insurance

**This is the second most critical gap, and the one most likely to be overlooked.**

- **Current status:** Not confirmed. Employer-provided STD and LTD coverage was not mentioned. Many employers provide disability benefits but employees often do not know the details.
- **Why this matters for your situation:** You are a sole earner supporting a spouse and two young children. If you were to become unable to work due to illness or injury -- an event that statistically affects approximately 1 in 4 workers before retirement -- your household has no income replacement. Your $18,000 in savings covers approximately 2 months of household expenses at a $110,000 income level.

- **Short-Term Disability (STD):**
  - Benchmark: 60-70% of gross salary = $66,000-$77,000 annually, or $5,500-$6,400/month
  - Verify whether your employer provides STD, the income replacement percentage, the waiting period, and the benefit duration.

- **Long-Term Disability (LTD):**
  - Benchmark: 60-70% of gross salary; own-occupation definition preferred; benefit period to age 65
  - Many employer LTD policies cap benefits at $5,000-$10,000 per month. At a $110,000 salary, 60% = $5,500/month -- right at or near common group LTD caps. Verify the cap and the policy definition.
  - If employer LTD covers 60% up to the cap without gaps, your coverage may be adequate. If the definition is "any-occupation" rather than "own-occupation," coverage quality is lower.

- **Gap identified:** Unknown -- cannot assess without verifying employer disability benefits. This is the second most urgent action.
- **Recommended next step:** Review your employer benefits portal for disability coverage details (STD waiting period, percentage, duration; LTD percentage, monthly cap, definition, benefit period). Bring those details to a licensed disability insurance specialist if supplemental coverage appears needed.

---

#### Homeowners Insurance

- **Current status:** Have a homeowners policy. Coverage amounts and terms are unknown.
- **Assessment:**
  - **Dwelling coverage check:** Your home is worth approximately $420,000 at market value. However, dwelling coverage should be based on replacement cost value (RCV) -- what it costs to rebuild the structure, which varies by local construction costs but commonly runs $150-$250+ per square foot. If your home is 2,200 square feet, rebuilding at $200/sq ft would require $440,000 in dwelling coverage. Verify that your policy reflects current replacement cost, not the original purchase price or mortgage balance.
  - **Personal property:** Standard policies cover personal property at 50-75% of dwelling coverage. With two young children, electronics, furniture, and household goods, consider whether coverage amounts are adequate. Check whether any high-value items (jewelry over $2,500, musical instruments, firearms) need scheduled endorsements.
  - **Liability:** Your policy's liability limit (commonly $100,000-$300,000 default) should be noted. With young children, a home, and a growing net worth, your liability exposure is meaningful.
  - **Replacement cost vs. ACV:** Confirm your policy pays on a replacement cost basis, not actual cash value. ACV policies depreciate your belongings and can leave you significantly undercompensated after a claim.
- **Gap identified:** Potential underinsurance on dwelling coverage (needs verification) and possible personal liability limit adequacy concern.
- **Recommended next step:** Pull your declarations page and verify dwelling coverage against an estimated local replacement cost. Ask your agent whether the policy is replacement cost or ACV for both dwelling and contents.

---

#### Auto Insurance

- **Current status:** Vehicle is a 2020 SUV under a loan (lender requires comprehensive and collision). Liability limits, UM/UIM status, and current coverage amounts are unknown.
- **Assessment:**
  - **Liability limits:** With a net worth approaching $200,000 and growing, standard minimum liability limits are almost certainly inadequate. Industry guidance recommends at least 100/300/100 ($100,000 per person / $300,000 per accident / $100,000 property damage). Verify your current limits.
  - **Comp and collision:** Required by your lender. Confirm your deductible -- a $1,000 deductible is reasonable if you have adequate emergency savings; a $500 deductible costs more in premium for a marginal benefit reduction.
  - **Uninsured/Underinsured Motorist (UM/UIM):** Approximately 12-15% of drivers are uninsured nationally. UM/UIM protects you when an at-fault driver cannot cover your injuries and damages. Confirm whether you have this coverage and at what limits.
- **Gap identified:** Liability limits and UM/UIM status unverified.
- **Recommended next step:** Pull your auto policy declarations page. Verify liability limits, UM/UIM limits, and deductibles. If liability limits are below 100/300/100, upgrading is strongly recommended given your assets.

---

#### Umbrella / Personal Liability Insurance

- **Current status:** None.
- **Net worth context:** Approximately $183,000 in assets (before auto loan). This is approaching but has not yet reached the level where umbrella becomes a high priority, though the trajectory over the next 5-10 years makes this worth evaluating now.
- **Risk exposure factors:** Two young children (playdates, child injuries at your home, teenage driving in approximately 10-14 years), homeownership.
- **Assessment:** At your current net worth level, umbrella is not a Critical gap -- your larger priorities are the life insurance and disability gaps above. However, an umbrella policy typically costs $150-$300 per year for $1 million in additional liability coverage. As your retirement savings and home equity grow, umbrella becomes increasingly important. It also requires that underlying auto and homeowners liability limits meet minimum thresholds (typically 250/500/250 auto and $300,000 homeowners liability).
- **Gap identified:** Not a current Critical gap; worth evaluating and budgeting for in the next 1-2 years.
- **Recommended next step:** Revisit umbrella coverage when your auto and homeowners liability limits are upgraded. At that point, adding umbrella becomes straightforward and inexpensive.

---

### Priority Gap Summary

| Priority | Gap | Why It Matters for Your Situation | Recommended Action |
|----------|-----|-----------------------------------|--------------------|
| 🔴 Critical | Life insurance -- primary earner | $220,000 in group term vs. ~$2.5M estimated need. Your family of four is entirely dependent on your income with $18,000 in savings and a $340,000 mortgage. | Consult a licensed insurance professional for a formal needs analysis and term life quotes. Consider 20- or 25-year term. |
| 🔴 Critical | Life insurance -- stay-at-home spouse | No coverage. Replacing full-time childcare for two young children costs $25,000-$45,000/year in most markets. | Include spouse coverage in same professional consultation. A $300,000-$500,000 term policy is typical for this situation. |
| 🔴 Critical | Disability insurance (LTD in particular) | You are the sole earner. An inability to work would leave your household with no income. Your savings cover approximately 2 months of expenses. | Verify employer LTD benefits immediately (benefits portal). If coverage is below 60% of income or uses "any-occupation" definition, consult a disability insurance specialist. |
| 🟡 Important | Homeowners -- dwelling coverage verification | If your policy still reflects original purchase price or an outdated replacement cost estimate, you may be significantly underinsured. Construction costs have risen sharply in recent years. | Pull your declarations page and compare dwelling coverage to current estimated RCV. |
| 🟡 Important | Auto liability limits and UM/UIM | Unknown current limits. Inadequate liability coverage exposes your assets to judgment risk. | Pull auto declarations page. Upgrade to minimum 100/300/100 if not already there. Add UM/UIM if not present. |
| 🟢 Worth Evaluating | Umbrella liability | Growing net worth and homeownership create liability exposure. Not an immediate Critical gap but an important medium-term addition. | Budget for after resolving Critical gaps above. Approximately $150-$300/year for $1M coverage. |

---

### Recommended Action Plan

- [ ] **Immediate (within 2 weeks):** Contact a licensed independent insurance agent or broker to begin a formal life insurance needs analysis. Bring this assessment, your income figures, mortgage balance, and benefits summary to that conversation. Both you and your spouse need coverage evaluated.
- [ ] **Immediate (within 2 weeks):** Log into your employer benefits portal and locate your disability insurance details: Does STD exist? What is the waiting period and duration? Does LTD exist? What is the monthly cap, the benefit period, and the policy definition (own-occupation or any-occupation)?
- [ ] **Within 30 days:** Pull your homeowners policy declarations page and verify dwelling coverage against estimated replacement cost. If it has not been updated in 2+ years, call your agent for a review.
- [ ] **Within 30 days:** Pull your auto policy declarations page and verify liability limits and UM/UIM coverage.
- [ ] **This year:** Once Critical gaps above are addressed, revisit umbrella insurance. Ensure your underlying auto and homeowners liability limits meet the thresholds required to add umbrella coverage.
- [ ] **Ongoing -- Annual Review Trigger:** Review your full insurance portfolio whenever any of the following occur: another child (income replacement and childcare cost needs both increase), significant income increase, your spouse reenters the workforce (two-earner dynamics change life insurance math), home value appreciation or renovation, approaching your mid-40s (disability risk increases with age).

---

### Jurisdictional Note

Auto insurance minimum requirements vary by state. The liability limits recommended above (100/300/100) exceed minimums in all U.S. states but are appropriate given your asset level. If you are in a no-fault auto insurance state (e.g., Michigan, Florida, New York, New Jersey, and others), your uninsured motorist options and personal
