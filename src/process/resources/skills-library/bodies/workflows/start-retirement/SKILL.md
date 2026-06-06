---
name: start-retirement
description: |
  Guides the user through the complete retirement transition from savings
  assessment through lifestyle design, chaining retirement calculators,
  financial tracking, budgeting, insurance, estate planning, and career
  transition skills across multiple categories.
  Use when the user is planning to retire, preparing for retirement within
  2 years, or evaluating whether they are financially ready to retire.
  Do NOT use for early retirement (FIRE) investment strategy, pension
  administration, or Social Security disability claims.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "retirement-planning personal-finance estate-planning planning step-by-step"
  category: "life-event"
  depends: "retirement-savings-calculator net-worth-tracker budget-planning insurance-needs-assessment will-preparation-checklist estate-document-organizer career-pivot-roadmap"
  disclaimer: "educational-finance"
  difficulty: "advanced"
---

# Start Retirement

This workflow references personal finance skills for educational purposes only. It is not financial advice. Consult a qualified financial advisor, tax professional, and estate planning attorney before making retirement decisions.

This workflow references legal literacy skills for estate planning steps. It is not legal advice. Consult appropriate professionals for legal matters in your jurisdiction.

**Estimated time:** 12-24 months (the retirement transition is best approached as a gradual process, not a sudden event)

**Geographic variation note:** Steps 1, 3, 4, 5, and 6 vary significantly by jurisdiction. Social Security rules, Medicare eligibility, tax treatment of retirement accounts, estate laws, and healthcare options differ by country and state. International retirees face additional tax treaty considerations. Research your specific jurisdiction's requirements with qualified professionals.

## When to Use

- User is planning to retire within the next 1-2 years and wants a structured preparation process
- User wants to evaluate whether their current financial position supports retirement
- User needs to coordinate the financial, legal, healthcare, and lifestyle transitions of retiring
- Do NOT use when: planning an early retirement investment strategy (different optimization), administering a pension plan (employer domain), or claiming Social Security disability (government process)

## Prerequisites

Before starting this workflow, ensure:

1. Approximate target retirement date established (even if flexible by 6-12 months)
2. Access to all retirement account statements (401k, IRA, pension, Social Security estimates)
3. Current expense tracking available (or willingness to build it in Step 3)
4. Spouse or partner involvement if applicable (retirement decisions affect both people)

## Steps

**Step 1: Assess Retirement Savings Readiness** (uses: retirement-savings-calculator)

Calculate whether current savings, expected Social Security, pensions, and other income sources can sustain your desired lifestyle for 25-35 years. This step is the foundational reality check that determines whether retirement is viable on your timeline.

- Input: Current retirement account balances (401k, IRA, Roth, pension), estimated Social Security benefit (from SSA statement), other income sources (rental, part-time, annuities), target retirement age, life expectancy estimate
- Output: Annual sustainable withdrawal amount using multiple scenarios (conservative 3.5%, moderate 4%, aggressive 4.5%), year-by-year projection of account balances, shortfall or surplus relative to estimated expenses, sensitivity analysis for market downturns
- Key focus: Run the calculation three ways: best case (7% real return), expected case (5% real return), and worst case (3% real return with early sequence-of-returns risk). Include inflation adjustment. If the worst-case scenario shows account depletion before age 90, the retirement date may need to shift or spending must be reduced. Factor in Required Minimum Distributions starting at the applicable age.

**Step 2: Map Your Complete Financial Picture** (uses: net-worth-tracker)

Create a comprehensive inventory of all assets, liabilities, income sources, and obligations. This step provides the complete financial landscape that Steps 3-6 build upon.

- Input: All financial accounts (retirement, savings, checking, brokerage), property values, vehicle values, debts (mortgage, car loans, credit cards), insurance policies, any business interests
- Output: Net worth statement, asset allocation overview, debt payoff timeline, income source inventory with start dates and durations, liquid vs. illiquid asset split
- Key focus: Identify which assets are liquid (available for spending), which are restricted (retirement accounts with penalties before certain ages), and which are illiquid (real estate, business interests). Map income source timing: Social Security start date, pension start date, Required Minimum Distribution start date. Identify any debts that should be paid off before retirement to reduce monthly obligations.

**Step 3: Build the Retirement Budget** (uses: budget-planning)

Create a detailed retirement budget that replaces the work-era budget with a new spending model. Retirement spending patterns differ significantly from working years, and this step models those changes.

- Input: Current expenses, lifestyle adjustments planned (downsizing, relocation, travel), healthcare cost estimates, sustainable withdrawal amount from Step 1, income sources and timing from Step 2
- Output: Monthly retirement budget with phases (active early retirement, moderate mid-retirement, reduced late retirement), essential vs. discretionary spending breakdown, healthcare cost projection, tax-efficient withdrawal sequence
- Key focus: Retirement spending typically follows a "smile" pattern: higher in early active years, lower in sedentary middle years, higher again in late years due to healthcare. Model three phases. Account for healthcare costs between retirement and Medicare eligibility (age 65 in the US) -- this gap is often the most expensive surprise. Plan tax-efficient withdrawal ordering: taxable accounts first, then tax-deferred, then tax-free (Roth), adjusting annually based on tax brackets.

**Step 4: Assess Insurance Needs** (uses: insurance-needs-assessment)

Evaluate and restructure insurance coverage for retirement, including the critical healthcare coverage gap between employment benefits and Medicare.

- Input: Current insurance coverage (health, life, disability, long-term care, property), retirement date, Medicare eligibility date, health conditions, spouse coverage needs
- Output: Insurance transition plan with timelines, healthcare bridge coverage options and costs, life insurance reassessment (needs often decrease in retirement), long-term care insurance evaluation, property and liability insurance adjustments
- Key focus: Healthcare coverage gap is the top priority. Options for the pre-Medicare gap: COBRA (expensive, 18-month maximum), ACA marketplace (income-dependent subsidies), spouse's employer plan, or health-sharing programs. Evaluate long-term care insurance while still insurable -- the cost increases dramatically after age 65. Reassess life insurance: if no dependents rely on your income, expensive policies may no longer be needed. Maintain adequate property and umbrella liability coverage.

**Step 5: Complete Estate Planning Documents** (uses: will-preparation-checklist)

Ensure all estate planning documents are current and reflect your retirement-era wishes. This step is especially important because retirement often triggers changes in beneficiary designations, power of attorney, and healthcare directives.

- Input: Existing estate documents (will, trust, power of attorney, healthcare directive), beneficiary designations on retirement accounts, property titles, family situation
- Output: Estate document review checklist, list of documents needing updates, beneficiary designation audit across all accounts, power of attorney and healthcare directive verification, professional referral list if documents need legal drafting
- Key focus: Retirement account beneficiary designations take precedence over will provisions for those specific accounts. Verify every account's beneficiary designations match your current wishes. Update power of attorney and healthcare directive if the designated agents have changed. If estate is complex (multiple properties, business interests, blended family), professional estate planning is strongly recommended. Review annually and after any major life event.

**Step 6: Organize Estate and Financial Documents** (uses: estate-document-organizer)

Create a comprehensive, organized system for all financial and legal documents that a spouse, executor, or power of attorney agent would need to access. This step protects your family and simplifies administration.

- Input: All financial accounts from Step 2, estate documents from Step 5, insurance policies from Step 4, property records, digital accounts
- Output: Master document inventory with locations, account access information (stored securely), digital estate plan, letter of instruction for executor or family, annual review schedule
- Key focus: Create a single reference document that lists every account, policy, property, and important contact. Store one copy in a fireproof safe or safety deposit box, and share the location with your executor or power of attorney agent. Include digital accounts (email, financial, social media) with access instructions. Update this document annually and after any account changes.

**Step 7: Design Your Retirement Lifestyle** (uses: career-pivot-roadmap)

Plan the non-financial aspects of retirement: purpose, structure, social connections, and activities that replace the identity and routine that work provided. This step addresses the psychological transition that is often more challenging than the financial one.

- Input: Interests, skills, values, desired daily structure, social needs, health and mobility level, budget for activities from Step 3
- Output: Weekly structure template (not a rigid schedule, but intentional time allocation), list of activities and commitments (volunteering, part-time work, hobbies, education), social connection plan, purpose statement, 90-day and 1-year activity goals
- Key focus: Retirement satisfaction correlates more strongly with sense of purpose and social connections than with income level. Plan for three categories: productive activities (volunteering, consulting, mentoring), growth activities (learning, hobbies, travel), and social activities (clubs, classes, community involvement). Discuss the transition with your partner or close family -- retirement changes household dynamics. Consider phased retirement (part-time work for 6-12 months) as a bridge rather than a sudden stop.

## Decision Points

- **After Step 1:** If the worst-case scenario shows a savings shortfall, three options: (a) delay retirement by 1-3 years to allow additional savings and higher Social Security benefit, (b) reduce planned retirement spending (Step 3) to match sustainable withdrawal, (c) plan for part-time income in early retirement years to supplement savings. Combination approaches are common.
- **After Step 1:** If retiring before age 62, Social Security is not yet available. The savings must cover all expenses until benefits begin. Model this gap explicitly. Each year of delayed Social Security claiming (up to age 70) increases the benefit by approximately 8%.
- **After Step 3:** If healthcare costs before Medicare exceed the budget, consider: delaying retirement to 65 (when Medicare begins), taking a part-time job with health benefits, or exploring ACA marketplace plans with income-managed subsidies (Roth conversions can affect subsidy eligibility -- consult a tax professional).
- **After Step 4:** If long-term care insurance is unaffordable or unavailable due to health conditions, alternative strategies: self-insure with dedicated savings, explore hybrid life/long-term care policies, or investigate state partnership programs. This is a significant financial risk to plan for explicitly.
- **After Step 5:** If estate planning reveals complexity that exceeds self-service capability (blended families, business succession, multi-state property, significant assets), engage an estate planning attorney. The cost of professional planning ($2,000-$5,000 for most situations) is minimal compared to the cost of estate planning errors.

## Failure Handling

- **Step 1 fails (savings insufficient for retirement on target date):** This is the most common and most consequential failure. Do not retire into a deficit. Options: delay retirement (each additional year of work adds savings AND delays withdrawal AND may increase Social Security). Reduce target spending. Add a part-time income stream. Sell assets (downsizing, vehicle reduction). The combination of 2 more working years plus a 15% spending reduction often closes the gap.
- **Step 2 fails (assets more complex than expected):** If the financial picture reveals assets you did not know about (old 401k plans, forgotten accounts, inherited property), this is actually a positive failure. Consolidate accounts, research unclaimed property databases, and update Step 1 calculations with the revised totals.
- **Step 3 fails (budget reveals retirement lifestyle is unaffordable):** Prioritize essential expenses (housing, healthcare, food, insurance) and cut discretionary spending. If essentials alone exceed the sustainable withdrawal, the retirement timeline must shift (return to Step 1). Common budget reductions: downsizing housing, relocating to a lower cost area, reducing vehicle costs, limiting travel to shoulder seasons.
- **Step 4 fails (healthcare coverage gap has no affordable option):** This is a critical blocker for early retirees (before age 65). If no affordable coverage exists, delaying retirement until Medicare eligibility may be the safest option. Medical bankruptcy is the single largest financial risk for early retirees in the US. Do not retire without a clear healthcare plan.
- **Step 5 fails (estate planning reveals legal complications):** Engage a professional immediately for: contested wills, unclear property titles, business succession issues, or international assets. Do not attempt complex estate planning without legal counsel. The cost of errors (probate disputes, tax penalties, unintended distributions) far exceeds attorney fees.
- **Step 7 fails (retiree experiences loss of purpose or identity):** This is common and not a failure to be ashamed of. Recovery: start with one structured activity (volunteering, part-time work, a class) and build from there. Consider a retirement coach or counselor. The adjustment period is typically 6-12 months. Phased retirement (gradual reduction of work hours) often prevents this issue entirely.
- **Direction change (decides not to retire):** Steps 1-6 remain valuable as a comprehensive financial health check and estate planning update. The work done is not wasted -- it becomes the foundation for a future retirement that is better prepared.

## Output Format

```
RETIREMENT READINESS TRACKER
==============================

Target Retirement Date: ____________
Months Remaining: ______

Phase 1: Financial Assessment
  [ ] Step 1: Savings readiness verified
      - Total retirement savings: $______
      - Annual sustainable withdrawal (4%): $______
      - Social Security (annual): $______
      - Pension (annual): $______
      - Total projected annual income: $______
      - Gap vs. target spending: +/-$______
  [ ] Step 2: Net worth mapped
      - Total net worth: $______
      - Liquid assets: $______
      - Debts remaining: $______

Phase 2: Budget and Insurance
  [ ] Step 3: Retirement budget complete
      - Phase 1 (active): $______/month
      - Phase 2 (moderate): $______/month
      - Phase 3 (healthcare): $______/month
      - Withdrawal sequence: ________________
  [ ] Step 4: Insurance restructured
      - Healthcare bridge plan: ________________
      - Long-term care: [ ] evaluated
      - Life insurance: [ ] reassessed

Phase 3: Legal and Lifestyle
  [ ] Step 5: Estate documents current
      - Will: [ ] updated
      - Beneficiaries: [ ] audited
      - POA: [ ] current
      - Healthcare directive: [ ] current
  [ ] Step 6: Documents organized
      - Master inventory: [ ] complete
      - Shared with executor: [ ]
  [ ] Step 7: Lifestyle planned
      - Weekly structure: [ ] designed
      - Purpose statement: [ ] written
      - Social plan: [ ] active

Status: [ASSESSING / PREPARING / TRANSITIONING / RETIRED]
Readiness: [GREEN - proceed / YELLOW - adjustments needed / RED - delay recommended]
```

## Edge Cases

- **Early retirement (before 62):** No Social Security or Medicare available. The savings must cover ALL expenses and healthcare for the gap years. Model this explicitly. Consider part-time work with health benefits as a bridge strategy.
- **Single retiree without children:** Step 5-6 estate planning requires identifying a non-family executor and power of attorney agent. Consider a professional fiduciary for estate management. Social connections in Step 7 become even more important for wellbeing and emergency support.
- **Retiring with significant debt:** Prioritize debt payoff before or immediately after retirement. Carrying debt into retirement increases required withdrawal rates and reduces flexibility. Model the debt payoff timeline explicitly in Step 3.
- **Retiring abroad:** Steps 3-6 change significantly. Tax obligations may exist in both countries. Healthcare systems differ. Estate planning must address international assets. Social Security can often be received abroad but Medicare cannot be used outside the US.
- **Phased retirement (gradual reduction):** Rather than a single retirement date, model a transition: full-time to part-time to consulting to fully retired over 2-3 years. This eases the financial transition (Step 3) and the identity transition (Step 7).
- **Retiring with a business to sell or close:** Add business transition planning to Step 2 (valuation) and Step 5 (succession or closure). The business sale may be the largest single asset, and timing the sale relative to retirement affects tax strategy significantly.
- **Spousal age gap greater than 5 years:** If one spouse retires much earlier, healthcare coverage for the younger spouse becomes the critical gap. Model separately in Step 4. The older spouse's Medicare does not cover the younger spouse.

## Expected Outcome

When this workflow is complete, the user will have:

1. A verified retirement readiness assessment with conservative, expected, and optimistic projections
2. A complete financial inventory with all assets, income sources, and liabilities documented
3. A phased retirement budget with tax-efficient withdrawal strategy
4. Insurance coverage restructured for retirement, including healthcare bridge plan
5. Estate planning documents current and beneficiary designations verified across all accounts
6. A comprehensive document organization system accessible to family and executor
7. A purposeful retirement lifestyle plan with structured activities, social connections, and growth goals
8. Confidence in the retirement decision, backed by thorough financial, legal, and lifestyle planning

## Example

**Input:** Couple in their early 60s, target retirement at 65, combined retirement savings of $1.2 million in 401k/IRA, one pension at $18,000/year, both Social Security eligible, home with $62,000 remaining mortgage.

**Output:**

**Step 1 (retirement-savings-calculator):**
Combined savings: $1.2M in 401k/IRA accounts. Pension: $18,000/year starting at 65. Social Security: $28,800/year (Person A at 66) + $16,800/year (Person B at 66) = $45,600/year. At 4% withdrawal rate: $48,000/year from savings + $18,000 pension + $45,600 SS = $111,600 pre-tax. Worst-case (3.5% withdrawal): $105,600/year. Target spending: $85,000/year. Result: surplus in all scenarios. Retirement is financially viable at 65.

**Step 2 (net-worth-tracker):**
Net worth: $1.2M retirement accounts + $180,000 home equity + $45,000 savings/checking + $28,000 vehicles - $62,000 remaining mortgage = $1.391M. Liquid assets: $1.245M. Illiquid: $208,000 (home, vehicles). Debt payoff plan: mortgage paid off by age 67 (2 years into retirement), reducing monthly obligations by $800/month.

**Step 3 (budget-planning):**
Phase 1 (ages 65-75, active): $7,500/month ($90,000/year) including $3,800 essentials + $2,200 travel/activities + $1,500 healthcare. Phase 2 (ages 75-85, moderate): $6,200/month. Phase 3 (ages 85+, healthcare focus): $7,000/month. Tax-efficient withdrawal sequence: taxable accounts first (ages 65-70), then traditional 401k/IRA (70-80), then Roth (80+), adjusted annually.

**Step 4 (insurance-needs-assessment):**
Both retiring at 65: Medicare eligible immediately. Supplemental Medigap Plan G selected ($180/month each). Life insurance: $500,000 term policy canceled (no dependents requiring income replacement), saving $220/month. Long-term care: hybrid life/LTC policy purchased ($3,200/year combined) providing 3 years of coverage each. Umbrella liability maintained at $1M.

**Step 5 (will-preparation-checklist):**
Wills updated to reflect current wishes. Beneficiary designations audited: 401k (spouse primary, children secondary), IRA (spouse primary), life insurance (cancelled). Power of attorney updated (each spouse for the other, adult child as backup). Healthcare directive completed with specific wishes documented. All documents reviewed by estate planning attorney ($2,800 for review and updates).

**Step 6 (estate-document-organizer):**
Master document binder created with: financial account inventory (14 accounts), insurance policy summaries, property records, vehicle titles, digital account list (32 accounts with access instructions), letter of instruction to executor (adult child), location of all original documents. Copy stored in safe deposit box. Shared location with both adult children.

**Step 7 (career-pivot-roadmap):**
Weekly structure: Monday -- volunteering at community literacy program (9 AM-12 PM). Tuesday/Thursday -- fitness class and social lunch with retirement group. Wednesday -- personal projects and hobbies (woodworking, gardening). Friday -- flexible (errands, appointments, grandchildren). Monthly: one multi-day trip or day trip. Annual: one 2-week travel experience. Purpose statement: "Stay physically active, intellectually engaged, and socially connected while contributing to the community."

**Result:** Couple retired at 65 with verified financial sustainability through age 95 in worst-case scenarios. Healthcare covered from day one via Medicare plus supplemental. Estate planning current and documented. Lifestyle plan providing daily structure and purpose. Total preparation time: approximately 120 hours over 18 months of pre-retirement planning.
