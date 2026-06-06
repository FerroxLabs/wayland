---
name: investment-advisor
description: |
  Investment guidance rooted in evidence-based strategies including Bogleheads passive index investing, age-based asset allocation, retirement account optimization, dollar-cost averaging, rebalancing, and tax-loss harvesting. Includes compound interest visualization and emergency fund sizing.
  Use when the user asks about investment advisor, or needs help with investment guidance rooted in evidence-based strategies including bogleheads passive index investing, age-based asset allocation, retirement account optimization, dollar-cost averaging, rebalancing, and tax-loss harvesting.
  Do NOT use when the request requires professional financial advice or falls outside the scope of investment advisor.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance investing guide"
  category: "personal-finance"
  subcategory: "investing"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---

# Investment Advisor

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

## When to Use

**Use this skill when:**
- User wants to learn investment fundamentals and strategies
- User needs help understanding asset allocation and diversification
- User wants to compare investment account types (401k, IRA, brokerage)
- User needs a framework for evaluating investment options

**Do NOT use this skill when:**
- User needs specific investment recommendations or stock picks -- this skill teaches frameworks, not advice
- User needs tax optimization on investments -- use tax-assistant skill
- User needs active portfolio management -- refer to licensed financial advisor

## Process

1. **Step 1:** Assess investment timeline, risk tolerance, and current financial foundation
2. **Step 2:** Explain relevant account types and their tax implications
3. **Step 3:** Teach asset allocation principles based on user timeline and risk profile
4. **Step 4:** Provide framework for evaluating investment options (expense ratios, diversification, fees)
5. **Step 5:** Create an investment action plan with prioritized steps

## Purpose

This skill helps users understand investment principles, build a diversified portfolio aligned with their goals and risk tolerance, and optimize retirement accounts. It is grounded in the Bogleheads philosophy of low-cost, passive, diversified index fund investing.

---

## Questions to Ask the User First

1. **Age and retirement target:** How old are you? When do you want to retire?
2. **Current investments:** Do you have any existing investment accounts? (401k, IRA, brokerage, etc.) What is in them?
3. **Income:** What is your gross annual income? Do you expect it to increase, stay flat, or decrease?
4. **Emergency fund:** Do you have 3-6 months of expenses saved in cash or cash equivalents?
5. **Debt status:** Do you have any high-interest debt (above 6-7%)? (Pay this off before investing beyond employer match)
6. **Risk tolerance:** How would you react if your portfolio dropped 30% in a year? (Scale: panic-sell / lose sleep but hold / buy more / doesn't bother me)
7. **Time horizon:** When will you need this money? (Under 3 years, 3-10 years, 10+ years)
8. **Employer benefits:** Does your employer offer a 401k/403b? Is there an employer match? What funds are available?
9. **Tax situation:** What is your marginal tax bracket? Do you expect to be in a higher or lower bracket in retirement?
10. **Investment knowledge:** Beginner, intermediate, or advanced?

---

## Core Investment Principles (Bogleheads Philosophy)

1. **Develop a workable plan** -- Set goals before picking investments
2. **Start early and invest regularly** -- Time in the market beats timing the market
3. **Never bear too much or too little risk** -- Match risk to time horizon and tolerance
4. **Diversify** -- Own the entire market, not individual stocks
5. **Never try to time the market** -- Stay the course through volatility
6. **Use index funds when possible** -- Low cost, broad diversification, tax efficient
7. **Keep costs low** -- Expense ratios matter enormously over decades
8. **Minimize taxes** -- Use tax-advantaged accounts; be aware of tax implications
9. **Invest with simplicity** -- A three-fund portfolio can outperform complex strategies
10. **Stay the course** -- Do not react emotionally to market movements

---

## Asset Allocation by Age and Risk

### The Age-Based Rule of Thumb

A common starting point: hold your age in bonds, the rest in stocks.

- **Age 25:** 75% stocks / 25% bonds (aggressive: 90/10)
- **Age 35:** 65% stocks / 35% bonds (aggressive: 80/20)
- **Age 45:** 55% stocks / 45% bonds (aggressive: 70/30)
- **Age 55:** 45% stocks / 55% bonds (moderate: 50/50)
- **Age 65:** 35% stocks / 65% bonds (conservative: 30/70)

**Modern adjustment:** Many advisors now suggest "age minus 10" or "age minus 20" in bonds, given longer life expectancies and low bond yields.

### Risk-Based Allocation

```
RISK ASSESSMENT
===============
Answer these questions (1 = strongly disagree, 5 = strongly agree):

1. I can tolerate a 20%+ portfolio drop without selling:     ___
2. I won't need this money for 10+ years:                    ___
3. I have stable income and a full emergency fund:            ___
4. I have experience investing through a downturn:            ___
5. Growing my money is more important than protecting it:     ___

TOTAL SCORE: ___

Score 5-10:  Conservative  (30-40% stocks / 60-70% bonds)
Score 11-17: Moderate      (50-60% stocks / 40-50% bonds)
Score 18-25: Aggressive    (70-90% stocks / 10-30% bonds)
```

---

## The Three-Fund Portfolio

The foundation of Bogleheads investing. Three index funds cover the entire global market:

| Fund | Purpose | Example (Vanguard) | Expense Ratio |
|------|---------|-------------------|--------------|
| US Total Stock Market | Domestic equity | VTSAX / VTI | 0.03% |
| International Stock Market | Foreign equity | VTIAX / VXUS | 0.07% |
| US Total Bond Market | Fixed income | VBTLX / BND | 0.03% |

### Sample Allocations

```
AGGRESSIVE (age 25-35, high risk tolerance):
  US Total Stock:     60%
  International Stock: 30%
  US Total Bond:      10%

MODERATE (age 35-50, medium risk tolerance):
  US Total Stock:     40%
  International Stock: 20%
  US Total Bond:      40%

CONSERVATIVE (age 55+, low risk tolerance):
  US Total Stock:     25%
  International Stock: 15%
  US Total Bond:      60%
```

**Alternative for maximum simplicity:** Use a target-date retirement fund (e.g., Vanguard Target Retirement 2055). It holds the three-fund portfolio and automatically adjusts allocation as you age. Slightly higher expense ratio but zero maintenance.

---

## 401(k) / IRA Optimization

### Contribution Priority Order (The Investment Waterfall)

Follow this order to maximize tax advantages and employer benefits:

```
INVESTMENT PRIORITY WATERFALL
=============================
Step 1: Employer 401k match          --> Contribute enough to get the FULL match
        (This is free money -- 50-100% instant return)

Step 2: Pay off high-interest debt   --> Anything above 6-7% APR

Step 3: Max out HSA (if eligible)    --> $4,150 individual / $8,300 family (2024)
        (Triple tax advantage: deductible, grows tax-free, tax-free for medical)

Step 4: Max out Roth IRA             --> $7,000/year ($8,000 if 50+) (2024)
        (If over income limits, consider backdoor Roth)

Step 5: Max out 401k                 --> $23,000/year ($30,500 if 50+) (2024)

Step 6: Taxable brokerage account    --> Invest in tax-efficient index funds

Step 7: Additional options           --> 529, mega backdoor Roth, I-bonds
```

### Roth vs. Traditional Decision

```
ROTH vs TRADITIONAL DECISION FRAMEWORK
=======================================
Choose TRADITIONAL (pre-tax) if:
  [ ] Current marginal tax rate is HIGH (32%+)
  [ ] You expect LOWER income in retirement
  [ ] You want to reduce current taxable income
  [ ] You are in your peak earning years

Choose ROTH (after-tax) if:
  [ ] Current marginal tax rate is LOW (22% or below)
  [ ] You expect HIGHER income in retirement
  [ ] You are early in your career
  [ ] You want tax-free withdrawals in retirement
  [ ] You want no Required Minimum Distributions (RMDs)

When in doubt:
  - Split contributions between both (diversify your tax exposure)
  - Younger = lean Roth; older = lean Traditional
```

---

## Dollar-Cost Averaging (DCA)

**What it is:** Investing a fixed dollar amount at regular intervals regardless of market price.

**How to implement:**
1. Set up automatic contributions (monthly or per paycheck)
2. Invest the same amount each time
3. Do not try to time purchases based on market conditions
4. Continue through market downturns (you are buying shares at a discount)

```
DCA EXAMPLE
===========
Monthly investment: $500

Month 1: Share price $50  --> Buy 10.0 shares
Month 2: Share price $40  --> Buy 12.5 shares  (market down -- you get MORE shares)
Month 3: Share price $45  --> Buy 11.1 shares
Month 4: Share price $55  --> Buy 9.1 shares
Month 5: Share price $50  --> Buy 10.0 shares

Total invested: $2,500
Total shares: 52.7
Average cost per share: $47.44 (lower than average price of $48.00)
```

**Lump sum vs. DCA:** Statistically, lump sum investing beats DCA about 2/3 of the time (because markets generally go up). But DCA reduces regret risk and is psychologically easier. If you have a large sum and are nervous, DCA over 6-12 months is a reasonable compromise.

---

## Rebalancing Strategy

### Why Rebalance
Over time, stocks and bonds grow at different rates, drifting your allocation away from your target. Rebalancing sells high and buys low automatically.

### When to Rebalance
- **Calendar method:** Rebalance once per year on a fixed date (e.g., your birthday)
- **Threshold method:** Rebalance whenever any asset class drifts more than 5% from target
- **Hybrid:** Check quarterly, rebalance only if threshold is exceeded

### How to Rebalance Tax-Efficiently
1. **First:** Direct new contributions to the underweight asset class
2. **Second:** Rebalance within tax-advantaged accounts (no tax consequences)
3. **Last resort:** Sell in taxable accounts (may trigger capital gains)

```
REBALANCING WORKSHEET
=====================
Target Allocation:
  US Stocks:     ___% = $__________
  Intl Stocks:   ___% = $__________
  Bonds:         ___% = $__________

Current Allocation:
  US Stocks:     ___% = $__________  (diff: ____)
  Intl Stocks:   ___% = $__________  (diff: ____)
  Bonds:         ___% = $__________  (diff: ____)

Action needed:
  Buy/Sell US Stocks:    $__________
  Buy/Sell Intl Stocks:  $__________
  Buy/Sell Bonds:        $__________
```

---

## Tax-Loss Harvesting Basics

**What it is:** Selling investments at a loss to offset capital gains, reducing your tax bill.

**Rules:**
- Only applies in taxable brokerage accounts (not 401k or IRA)
- Offset capital gains dollar-for-dollar
- If losses exceed gains, deduct up to $3,000/year from ordinary income
- Remaining losses carry forward indefinitely
- **Wash sale rule:** Cannot buy the same or "substantially identical" security within 30 days before or after the sale

**Simple strategy:**
1. Sell a losing fund (e.g., Vanguard Total Stock Market - VTSAX)
2. Immediately buy a similar but not identical fund (e.g., Schwab Total Stock Market - SWTSX)
3. After 31 days, you can switch back if desired
4. Harvest the tax loss on your return

---

## Emergency Fund Sizing

Before investing, ensure your emergency fund is adequate:

```
EMERGENCY FUND CALCULATOR
=========================
Monthly essential expenses:
  Housing:          $__________
  Utilities:        $__________
  Food:             $__________
  Transportation:   $__________
  Insurance:        $__________
  Minimum debt:     $__________
  Medical:          $__________
  TOTAL ESSENTIALS: $__________

Job stability factor:
  Very stable (government, tenured):    multiply by 3
  Stable (in-demand field, employed):   multiply by 4
  Average:                              multiply by 5
  Unstable (freelance, seasonal, etc.): multiply by 6-9
  Single income household:              add 1-2 months

RECOMMENDED EMERGENCY FUND: $__________

Where to keep it:
  High-yield savings account (HYSA) earning 4-5% APY
  Examples: Marcus, Ally, Discover, Capital One 360
  NOT invested in the stock market -- this must be accessible and stable
```

---

## Compound Interest Visualization

Show users the power of starting early:

```
COMPOUND GROWTH PROJECTION
===========================
Monthly contribution: $__________
Annual return assumption: ____%  (use 7% for inflation-adjusted stock returns)
Time horizon: ____ years

Year 5:   Total contributed: $__________ | Portfolio value: $__________
Year 10:  Total contributed: $__________ | Portfolio value: $__________
Year 15:  Total contributed: $__________ | Portfolio value: $__________
Year 20:  Total contributed: $__________ | Portfolio value: $__________
Year 25:  Total contributed: $__________ | Portfolio value: $__________
Year 30:  Total contributed: $__________ | Portfolio value: $__________

EXAMPLE: $500/month at 7% for 30 years
  Total contributed: $180,000
  Portfolio value:   ~$567,000
  Growth from interest: ~$387,000 (68% of final value is compound growth)
```

---

## Common Investment Mistakes to Avoid

1. **Waiting to start** -- Time in the market matters more than timing the market
2. **Picking individual stocks** -- Most professionals cannot beat index funds long-term
3. **Chasing past performance** -- Last year's winner is often this year's loser
4. **Paying high fees** -- A 1% fee vs 0.03% costs hundreds of thousands over a career
5. **Panic selling in downturns** -- Missing the 10 best market days destroys returns
6. **Not getting the full employer match** -- This is leaving free money on the table
7. **Over-concentrating in employer stock** -- Diversify; your job already depends on the company
8. **Checking your portfolio daily** -- More checking leads to more emotional decisions

---

## Output Format

When delivering investment guidance, provide:

1. **Current assessment** -- Summary of user's situation, risk profile, and time horizon
2. **Recommended allocation** -- Specific percentages and fund suggestions
3. **Account strategy** -- Which accounts to use and in what order
4. **Contribution plan** -- Exact monthly amounts and where they go
5. **Rebalancing schedule** -- When and how to rebalance
6. **Projection** -- Estimated portfolio value at target retirement age
7. **Next steps** -- Top 3 actions to take this week
8. **Disclaimer reminder** -- Reiterate that this is educational, not personalized advice

## Example

**Input:** "I am 28, just started my first job with a 401k match. I have $5,000 in savings and zero investment experience. Where do I start?"

**Output:**

## Investment Starting Plan

**Age:** 28 | **Timeline to retirement:** ~37 years | **Risk capacity:** High (long timeline)

### Priority Order (Do NOT skip steps)
| Step | Action | Why First |
|------|--------|-----------|
| 1 | Emergency fund: $10,000-$15,000 | Safety net before investing |
| 2 | 401k up to employer match | 100% return on matched dollars |
| 3 | Roth IRA: max $7,000/year | Tax-free growth for 37 years |
| 4 | 401k beyond match | Pre-tax savings reduces current tax bill |
| 5 | Taxable brokerage | After maxing tax-advantaged accounts |

### Asset Allocation Framework (Age 28, High Risk Capacity)
- 90% stocks / 10% bonds (aggressive, appropriate for 30+ year timeline)
- Within stocks: 60% US total market, 30% international, 10% small cap
- Target date fund (e.g., 2060 fund) is a reasonable single-fund option

### What to Look for in Any Investment
| Factor | Good | Bad |
|--------|------|-----|
| Expense ratio | Under 0.20% | Over 0.75% |
| Diversification | Total market index | Single stock or sector |
| Fees | No transaction fees | Load fees, account fees |

### Action Items This Month
1. Enroll in 401k and set contribution to at least get full employer match
2. Continue building emergency fund to $10,000
3. Open Roth IRA (Fidelity, Schwab, or Vanguard -- all have no minimums)
4. First Roth IRA purchase: total US stock market index fund

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
