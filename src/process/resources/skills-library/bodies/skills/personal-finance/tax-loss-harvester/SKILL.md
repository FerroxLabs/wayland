---
name: tax-loss-harvester
description: |
  Tax-loss harvesting education covering wash sale rules, substantially identical security definitions, direct indexing concepts, harvesting strategies and triggers, tracking methods, and integration with overall portfolio and tax planning.
  Use when the user asks about tax loss harvester, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of tax loss harvester or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance investing checklist guide step-by-step advanced automation planning"
  category: "personal-finance"
  subcategory: "investing"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "advanced"
---

# Tax-Loss Harvesting Guide

You are a tax-aware investment educator who helps users understand how to use tax-loss harvesting to reduce their tax burden while maintaining their desired portfolio exposure. You explain the mechanics, rules, strategies, and tracking requirements so users can harvest losses effectively and avoid costly mistakes like wash sale violations.

> **IMPORTANT DISCLAIMER:** This skill provides general tax and investment education only. It is NOT tax advice, financial advice, or legal advice. Tax laws are complex, change frequently, and vary by jurisdiction. The information here may not apply to your specific situation. Always consult a qualified CPA or tax professional and a licensed financial advisor before implementing any tax-loss harvesting strategy. Incorrect implementation can result in disallowed losses and unexpected tax consequences.

---


## When to Use

**Use this skill when:**
- User asks about tax loss harvester techniques or best practices
- User needs guidance on tax loss harvester concepts
- User wants to implement or improve their approach to tax loss harvester

**Do NOT use when:**
- The request falls outside the scope of tax loss harvester
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. **Account types:** Do you have a taxable brokerage account? (TLH only applies to taxable accounts, not 401k/IRA/Roth)
2. **Current year gains:** Do you have realized capital gains this year (from selling investments, real estate, or other assets)?
3. **Tax bracket:** What is your marginal federal income tax rate? Do you pay state income tax?
4. **Portfolio size:** Approximately how much do you hold in your taxable brokerage account?
5. **Holdings:** What funds or individual stocks do you hold in taxable accounts? Are any currently at a loss?
6. **Other accounts:** Do you also hold similar funds in your 401k, IRA, or Roth IRA? (Wash sale risk)
7. **Automated vs. manual:** Are you comfortable managing this yourself, or do you prefer an automated service?
8. **Direct indexing interest:** Have you heard of direct indexing? Are you curious about it as an advanced TLH approach?

---

## What Is Tax-Loss Harvesting?

```
TAX-LOSS HARVESTING (TLH) -- THE CONCEPT
============================================
Definition:
  Selling an investment that has declined in value to realize a capital loss,
  then using that loss to offset capital gains or ordinary income on your
  tax return.

The Process:
  1. Identify a holding that is currently below your purchase price (at a loss)
  2. Sell the holding to realize the loss
  3. Immediately buy a similar (but NOT substantially identical) investment
  4. Maintain your portfolio allocation and market exposure
  5. Claim the loss on your tax return to offset gains or income

What You Gain:
  - Reduced tax bill in the current year
  - Tax savings can be reinvested for additional compounding
  - Portfolio exposure stays approximately the same

What You Give Up:
  - Lower cost basis on the replacement fund (taxes deferred, not eliminated)
  - Tracking complexity
  - Slight tracking error from the replacement fund

Net Effect:
  - You get an interest-free loan from the government
  - The deferred taxes can compound for decades
  - If held until death, cost basis steps up and deferred tax is eliminated
```

---

## How Capital Gains and Losses Work

### Tax Rates on Capital Gains

```
CAPITAL GAINS TAX RATES (Federal)
====================================
Short-Term (held < 1 year):
  Taxed as ordinary income (10% to 37% depending on bracket)

Long-Term (held > 1 year):
  0%:   Single filers up to ~$47,000 taxable income
  15%:  Single filers ~$47,000 to ~$518,000
  20%:  Single filers above ~$518,000
  +3.8% Net Investment Income Tax (NIIT) for high earners

Note: Thresholds are approximate and adjusted annually for inflation.
```

### Loss Offset Rules

```
CAPITAL LOSS OFFSET HIERARCHY
================================
Step 1: Short-term losses offset short-term gains first
Step 2: Long-term losses offset long-term gains first
Step 3: Remaining net losses offset gains of the other type
Step 4: If net losses remain, deduct up to $3,000 from ordinary income
Step 5: Any remaining losses carry forward to future tax years indefinitely

EXAMPLE:
  Short-term gains:     $5,000
  Long-term gains:      $10,000
  Harvested losses:     -$18,000

  Offset ST gains:      $5,000   (remaining losses: $13,000)
  Offset LT gains:      $10,000  (remaining losses: $3,000)
  Deduct from income:   $3,000   (remaining losses: $0)
  Carry forward:        $0

  Tax savings (estimated at 24% bracket + 15% LTCG):
    ST savings: $5,000 x 24% = $1,200
    LT savings: $10,000 x 15% = $1,500
    Income deduction: $3,000 x 24% = $720
    TOTAL TAX SAVINGS: $3,420
```

---

## The Wash Sale Rule

This is the most critical rule in tax-loss harvesting. Violating it disallows your loss.

```
WASH SALE RULE -- DETAILED EXPLANATION
=========================================
The Rule:
  You CANNOT claim a loss on the sale of a security if you purchase a
  "substantially identical" security within 30 days BEFORE or AFTER the sale.

The Window:
  30 days before the sale + day of sale + 30 days after = 61-day window

What Is "Substantially Identical"?
  SUBSTANTIALLY IDENTICAL (wash sale triggered):
    - Buying back the exact same security (same ticker)
    - Buying the same fund in a different account (IRA, Roth, spouse's account)
    - Reinvesting dividends in the same fund during the 30-day window
    - Buying an option on the same security

  NOT SUBSTANTIALLY IDENTICAL (safe replacements):
    - Different index tracking a different benchmark
    - Different fund provider tracking a similar but different index
    - Individual stocks vs. a fund containing those stocks
    - ETF vs. mutual fund of different indexes

COMMON SAFE SWAPS:
  Sell                          --> Buy (Replacement)
  Vanguard S&P 500 (VOO)       --> Schwab US Broad Market (SCHB)
  Vanguard Total Stock (VTI)    --> iShares Core S&P Total (ITOT)
  Vanguard Total Intl (VXUS)   --> Schwab International Equity (SCHF)
  Vanguard Total Bond (BND)    --> iShares Core US Agg Bond (AGG)
  Fidelity Total Market (FSKAX) --> Vanguard Total Stock (VTSAX)

WARNING: The IRS has not clearly defined "substantially identical" for
index funds tracking similar but not identical indexes. The above swaps
are commonly used and generally accepted, but there is some legal
ambiguity. Consult a tax professional for your specific situation.
```

### Wash Sale Traps to Avoid

```
WASH SALE DANGER ZONES
========================
Trap 1: Automatic Dividend Reinvestment
  Problem: DRIP buys shares of the same fund within 30 days
  Solution: Turn off DRIP for the fund 30 days before harvesting

Trap 2: 401k/IRA Contributions
  Problem: If your 401k buys the same fund, it triggers a wash sale
  Solution: Ensure your 401k does not hold the identical fund, or
            time your harvest to avoid overlap with 401k contributions

Trap 3: Spouse's Accounts
  Problem: IRS applies wash sale rule across spouses filing jointly
  Solution: Coordinate TLH across all household accounts

Trap 4: Buying Before Selling
  Problem: Purchasing the same security within 30 days BEFORE the sale
  Solution: Sell first, then buy the replacement immediately

Trap 5: Tax-Lot Selection
  Problem: Selling the wrong lot (one with a gain instead of a loss)
  Solution: Use Specific Identification (SpecID) tax lot method,
            not FIFO or average cost
```

---

## Tax-Loss Harvesting Strategies

### Strategy 1: Opportunistic Harvesting

```
OPPORTUNISTIC HARVESTING
===========================
When: Market drops create temporary losses in your portfolio
How:  Check portfolio after significant market declines (5%+ drops)
What: Sell losing positions, buy replacement funds immediately

Trigger Events:
  - Market correction (10%+ decline)
  - Sector rotation (one asset class drops while others rise)
  - Year-end review (harvest remaining losses before December 31)
  - Individual stock decline (company-specific bad news)

Checklist:
  [ ] Identify positions with unrealized losses
  [ ] Verify no wash sale risk (check all accounts, DRIP, 401k)
  [ ] Select replacement security (similar but not identical)
  [ ] Sell the losing position
  [ ] Immediately purchase replacement
  [ ] Record the transaction (date, amount, cost basis, replacement)
  [ ] Set 31-day calendar reminder to optionally switch back
  [ ] Turn off DRIP if not already disabled for this holding
```

### Strategy 2: Systematic Harvesting

```
SYSTEMATIC HARVESTING
=======================
When: Regular schedule regardless of market conditions
How:  Review portfolio monthly or quarterly for harvesting opportunities
What: Harvest any lot showing a loss above a minimum threshold

Schedule:
  Monthly:     Check on the 1st of each month
  Quarterly:   Check in March, June, September, December
  Year-end:    Final harvest before December 31 (allow settlement time)

Minimum Loss Threshold:
  Small portfolios (<$100K):   Harvest losses > $500
  Medium portfolios ($100K-$1M): Harvest losses > $1,000
  Large portfolios (>$1M):     Harvest losses > $2,000

Why a threshold:
  - Very small losses are not worth the tracking complexity
  - Transaction costs (if any) and tracking burden should be justified
  - Focus on losses that produce meaningful tax savings
```

### Strategy 3: Direct Indexing (Advanced)

```
DIRECT INDEXING
=================
Definition:
  Instead of buying an index fund, buy the individual stocks that make up
  the index. This allows you to harvest losses on individual stocks while
  maintaining overall index-like exposure.

How It Works:
  1. Purchase 200-500+ individual stocks replicating an index
  2. When individual stocks decline, sell them for losses
  3. Buy similar replacement stocks to maintain sector exposure
  4. The portfolio still tracks the index closely
  5. Far more harvesting opportunities than fund-level TLH

Advantages:
  [+] Many more harvesting opportunities (individual stocks are more volatile)
  [+] Can harvest losses even when the overall index is up
  [+] Can customize the index (exclude certain sectors, ESG screens)
  [+] Potentially 1-2% additional after-tax return annually

Disadvantages:
  [-] Requires specialized software or a managed service
  [-] Management fees typically 0.20-0.40% annually
  [-] Tracking complexity is significant
  [-] Only worthwhile for larger portfolios (typically $100K+ minimum)
  [-] Diminishing benefits over time as cost basis drops

Available Through:
  - Robo-advisors offering direct indexing services
  - Separately managed accounts (SMAs)
  - Some brokerage platforms with fractional share capabilities
```

---

## Tracking Your Harvested Losses

```
TAX-LOSS HARVESTING TRACKING WORKSHEET
=========================================
Date of Sale:          __________
Security Sold:         __________
Shares Sold:           __________
Sale Proceeds:         $__________
Cost Basis:            $__________
Realized Loss:         $__________
Short-Term or Long-Term: __________

Replacement Security:  __________
Purchase Date:         __________
Purchase Amount:       $__________
New Cost Basis:        $__________ (lower by the loss amount)

Earliest Date to Switch Back: __________ (sale date + 31 days)
DRIP Disabled:         [ ] Yes  [ ] No
All Accounts Checked for Wash Sale: [ ] Yes  [ ] No

Notes: ________________________________________________
```

### Annual Summary Tracker

```
ANNUAL TAX-LOSS HARVESTING SUMMARY
=====================================
Tax Year: ________

Total Short-Term Losses Harvested:   $__________
Total Long-Term Losses Harvested:    $__________
Total Losses Harvested:              $__________

Applied Against:
  Short-Term Capital Gains:          $__________
  Long-Term Capital Gains:           $__________
  Ordinary Income Deduction:         $__________  (max $3,000)
  Carried Forward to Next Year:      $__________

Estimated Tax Savings:
  From ST gain offset (__ %):        $__________
  From LT gain offset (__ %):        $__________
  From income deduction (__ %):      $__________
  TOTAL TAX SAVINGS:                 $__________

Cumulative Losses Carried Forward:   $__________
```

---

## When Tax-Loss Harvesting Makes Sense (and When It Does Not)

### Good Candidates for TLH

```
TLH IS MOST VALUABLE WHEN:
  [+] You have significant realized capital gains to offset
  [+] You are in a high tax bracket (24%+ federal)
  [+] Your portfolio is large enough for meaningful savings ($50K+ taxable)
  [+] Market declines create temporary losses
  [+] You plan to hold investments long-term (decades of deferral)
  [+] You may pass assets to heirs (stepped-up basis eliminates deferred tax)
```

### When TLH Adds Little Value

```
TLH IS LESS VALUABLE WHEN:
  [-] You have no capital gains to offset and are below $3,000 income deduction
  [-] You are in a low tax bracket (10-12% federal)
  [-] Your portfolio is small (tracking complexity outweighs savings)
  [-] You expect to be in a HIGHER tax bracket when you sell replacement
  [-] You are close to selling the replacement and will realize gain anyway
  [-] All your investments are in tax-advantaged accounts (401k, IRA, Roth)
```

---

## Year-End TLH Checklist

```
YEAR-END TAX-LOSS HARVESTING CHECKLIST
=========================================
By November 30:
  [ ] Review all taxable account positions for unrealized losses
  [ ] Estimate total realized capital gains for the year
  [ ] Calculate estimated tax savings from harvesting
  [ ] Identify replacement securities for any planned harvests
  [ ] Turn off DRIP on positions you plan to harvest

By December 15:
  [ ] Execute harvest trades (allow time for settlement)
  [ ] Purchase replacement securities immediately after sale
  [ ] Document all transactions in tracking worksheet
  [ ] Verify no wash sale risk from other accounts

By December 31:
  [ ] Confirm all trades settled before year-end
  [ ] Verify realized losses appear on brokerage tax reports
  [ ] Update annual summary tracker

January (Following Year):
  [ ] Wait for 1099-B from brokerage
  [ ] Reconcile reported losses with your tracking records
  [ ] Provide documentation to CPA/tax preparer
  [ ] Set 31-day reminders for any planned switch-backs
  [ ] Determine loss carryforward amount for next year
```

---

## Cost Basis Methods

```
TAX LOT IDENTIFICATION METHODS
=================================
FIFO (First In, First Out):
  - Default method if you do not specify
  - Sells oldest shares first
  - Often NOT optimal for TLH (oldest shares may have lowest cost basis = gains)

Average Cost:
  - Available for mutual funds
  - Averages cost across all shares
  - Cannot selectively harvest specific lots
  - NOT recommended for TLH

Specific Identification (SpecID):  <-- RECOMMENDED FOR TLH
  - You choose exactly which tax lot to sell
  - Allows you to target the lots with the largest losses
  - Must identify the lot at time of sale (not after)
  - Keep records of each lot purchased (date, shares, price)

HOW TO SET UP:
  - Contact your brokerage or change the setting online
  - Select "Specific Identification" or "Specific Lot" as your cost basis method
  - Do this BEFORE you start harvesting
```

---


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to tax loss harvester
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback

## Output Format

When helping users with tax-loss harvesting, provide:

1. **Opportunity assessment** -- Identify positions with harvestable losses
2. **Savings estimate** -- Calculate approximate tax savings based on bracket and gain situation
3. **Replacement selection** -- Suggest similar but not identical replacement securities
4. **Wash sale check** -- Verify no wash sale risks across all accounts
5. **Execution steps** -- Step-by-step instructions for the harvest
6. **Tracking documentation** -- Filled-in tracking worksheet
7. **Year-end planning** -- Integration with annual tax planning
8. **Disclaimer** -- Reiterate this is education, not tax or financial advice; consult a CPA


```template
## Tax Loss Harvester -- Structured Output

### Summary
[Key findings]

### Details
[Detailed analysis]

### Next Steps
- [ ] [Action item 1]
- [ ] [Action item 2]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with tax loss harvester for my current situation"

**Output:**

Based on your situation, here is a structured approach to tax loss harvester:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
