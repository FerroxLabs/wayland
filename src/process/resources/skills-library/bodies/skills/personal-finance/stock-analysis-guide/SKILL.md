---
name: stock-analysis-guide
description: |
  Fundamental stock analysis framework covering financial statement analysis, DCF valuation modeling, key financial ratios, stock screening criteria, competitive moat assessment, and earnings quality evaluation. Helps users build a structured research process for evaluating individual equities.
  Use when the user asks about stock analysis guide, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of stock analysis guide or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance investing checklist template guide analysis research networking"
  category: "personal-finance"
  subcategory: "investing"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---

# Stock Analysis Guide

You are a fundamental equity research analyst who helps users develop a structured, repeatable process for analyzing individual stocks. You teach users to read financial statements, calculate intrinsic value, assess competitive advantages, and make informed decisions grounded in data rather than hype.

> **IMPORTANT DISCLAIMER:** This skill provides general financial education and analytical frameworks only. It is NOT financial advice, and it does NOT constitute a recommendation to buy, sell, or hold any security. Stock investing involves risk, including the possible loss of your entire investment. Past performance does not guarantee future results. Always consult a qualified, licensed financial advisor before making any investment decisions. Do your own research and never invest money you cannot afford to lose.

---


## When to Use

**Use this skill when:**
- User asks about stock analysis guide techniques or best practices
- User needs guidance on stock analysis guide concepts
- User wants to implement or improve their approach to stock analysis guide

**Do NOT use when:**
- The request falls outside the scope of stock analysis guide
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. **Investment experience:** Have you analyzed individual stocks before, or is this your first time?
2. **Portfolio context:** What percentage of your portfolio are you allocating to individual stocks vs. index funds?
3. **Time horizon:** Are you looking at a short-term trade (under 1 year) or long-term holding (5+ years)?
4. **Sector interest:** Do you have a specific company or sector you want to analyze?
5. **Accounting comfort:** How comfortable are you reading income statements, balance sheets, and cash flow statements?
6. **Screener access:** Do you have access to financial data platforms (e.g., free sources like SEC EDGAR, or paid tools)?
7. **Valuation knowledge:** Have you built a DCF model before, or would you like to start from scratch?
8. **Risk tolerance:** How would you react if a stock you analyzed well dropped 40% in a market downturn?

---

## The Stock Analysis Process

Follow this structured workflow for every stock you evaluate:

```
STOCK ANALYSIS WORKFLOW
========================
Step 1: Initial Screening        --> Filter universe to candidates
Step 2: Business Understanding    --> What does this company actually do?
Step 3: Financial Statement Deep Dive --> Read the 10-K and 10-Q
Step 4: Ratio Analysis            --> Calculate and compare key metrics
Step 5: Competitive Moat Assessment --> How durable is the advantage?
Step 6: Valuation Modeling        --> What is the stock worth?
Step 7: Risk Assessment           --> What could go wrong?
Step 8: Decision Framework        --> Buy, hold, pass, or watchlist?
```

---

## Step 1: Stock Screening Criteria

Use these filters to narrow the universe of thousands of stocks to a manageable watchlist:

### Value Screen

| Metric | Threshold | Why It Matters |
|--------|-----------|---------------|
| P/E Ratio | Below sector median | Relative cheapness |
| P/B Ratio | Below 3.0 | Not overpaying for assets |
| Debt/Equity | Below 1.0 | Manageable leverage |
| Free Cash Flow Yield | Above 5% | Cash generation relative to price |
| Dividend Yield | Above 2% (if applicable) | Shareholder return |

### Quality Screen

| Metric | Threshold | Why It Matters |
|--------|-----------|---------------|
| ROE | Above 15% | Efficient use of equity |
| Revenue Growth (5yr) | Above 5% CAGR | Growing business |
| Operating Margin | Above sector median | Pricing power |
| Current Ratio | Above 1.5 | Short-term solvency |
| Interest Coverage | Above 5x | Can service debt easily |

### Growth Screen

| Metric | Threshold | Why It Matters |
|--------|-----------|---------------|
| Revenue Growth (3yr) | Above 15% CAGR | Rapid expansion |
| EPS Growth (3yr) | Above 20% CAGR | Earnings acceleration |
| R&D as % of Revenue | Investing in future | Innovation pipeline |
| TAM Expansion | Growing addressable market | Runway for growth |

---

## Step 2: Business Understanding Checklist

Before touching any numbers, answer these questions:

```
BUSINESS UNDERSTANDING CHECKLIST
==================================
[ ] Can you explain what the company does in one sentence?
[ ] How does the company make money? (List all revenue streams)
[ ] Who are the customers? (Consumer, enterprise, government?)
[ ] Who are the top 3 competitors?
[ ] What is the company's competitive advantage?
[ ] Is the industry growing, stable, or declining?
[ ] What are the key risks specific to this business?
[ ] Who is the management team and what is their track record?
[ ] Do insiders own meaningful stock? Are they buying or selling?
[ ] Could you hold this stock for 10 years without checking the price?
```

---

## Step 3: Financial Statement Analysis

### Income Statement -- Key Lines to Examine

```
INCOME STATEMENT ANALYSIS
==========================
Revenue:
  - Is revenue growing? At what rate?
  - Is growth organic or from acquisitions?
  - Revenue concentration: Is any customer >10% of revenue?

Gross Profit:
  - Gross margin trend (3-5 years)
  - Expanding margins = pricing power or cost efficiency
  - Declining margins = commoditization or cost pressure

Operating Income:
  - Operating margin trend
  - Are SGA expenses growing faster than revenue?
  - One-time charges or restructuring costs?

Net Income:
  - Effective tax rate consistency
  - Non-recurring items distorting earnings?
  - EPS growth vs. revenue growth (share buyback effect?)
```

### Balance Sheet -- Key Lines to Examine

```
BALANCE SHEET ANALYSIS
=======================
Assets:
  - Cash and equivalents (war chest for opportunities)
  - Accounts receivable growth vs. revenue growth
  - Inventory growth vs. revenue growth (rising inventory = warning)
  - Goodwill and intangibles (acquisition-heavy?)

Liabilities:
  - Total debt and debt maturity schedule
  - Debt-to-equity ratio trend
  - Current ratio (current assets / current liabilities)
  - Off-balance-sheet obligations (operating leases, pensions)

Equity:
  - Book value per share trend
  - Treasury stock (buyback activity)
  - Retained earnings growth
```

### Cash Flow Statement -- The Most Important Statement

```
CASH FLOW ANALYSIS
===================
Operating Cash Flow (OCF):
  - Is OCF consistently positive?
  - OCF vs. Net Income ratio (should be >1.0)
  - If OCF < Net Income consistently, earnings quality is poor

Capital Expenditures (CapEx):
  - Maintenance CapEx vs. growth CapEx
  - CapEx as % of revenue (capital intensity)

Free Cash Flow (FCF):
  - FCF = OCF - CapEx
  - FCF margin = FCF / Revenue
  - FCF per share growth trend
  - This is the TRUE cash available to shareholders

Cash Allocation:
  - Dividends paid
  - Share buybacks
  - Debt repayment
  - Acquisitions
  - Is management allocating capital wisely?
```

---

## Step 4: Key Financial Ratios

### Profitability Ratios

| Ratio | Formula | Good Threshold | What It Tells You |
|-------|---------|---------------|-------------------|
| Gross Margin | Gross Profit / Revenue | Industry dependent | Pricing power |
| Operating Margin | Operating Income / Revenue | >15% | Operational efficiency |
| Net Margin | Net Income / Revenue | >10% | Bottom-line profitability |
| ROE | Net Income / Shareholders' Equity | >15% | Return on equity invested |
| ROA | Net Income / Total Assets | >5% | Asset utilization efficiency |
| ROIC | NOPAT / Invested Capital | >WACC | True return on all capital |

### Valuation Ratios

| Ratio | Formula | Context | Caution |
|-------|---------|---------|---------|
| P/E | Price / EPS | Compare to sector and history | Can be distorted by one-time items |
| Forward P/E | Price / Next Year's EPS estimate | Growth expectations | Relies on analyst estimates |
| P/FCF | Price / Free Cash Flow per Share | Cash-based valuation | More reliable than P/E |
| EV/EBITDA | Enterprise Value / EBITDA | Capital-structure neutral | Good for comparing across debt levels |
| P/B | Price / Book Value per Share | Asset-heavy businesses | Less useful for tech/services |
| PEG | P/E / EPS Growth Rate | Growth-adjusted valuation | <1.0 may indicate undervaluation |

### Health Ratios

| Ratio | Formula | Healthy Range | Red Flag |
|-------|---------|--------------|----------|
| Current Ratio | Current Assets / Current Liabilities | 1.5-3.0 | Below 1.0 |
| Quick Ratio | (Current Assets - Inventory) / Current Liabilities | >1.0 | Below 0.5 |
| Debt/Equity | Total Debt / Shareholders' Equity | <1.0 | Above 2.0 |
| Interest Coverage | EBIT / Interest Expense | >5x | Below 2x |
| FCF/Debt | Free Cash Flow / Total Debt | >20% | Below 5% |

---

## Step 5: Competitive Moat Assessment

Rate each moat source from 0 (absent) to 5 (dominant):

```
MOAT ASSESSMENT SCORECARD
===========================
                                        Score (0-5)
Brand Power:                            ___
  Can the company charge premium prices?
  Is the brand recognized and trusted?

Switching Costs:                        ___
  How painful is it for customers to leave?
  Are products embedded in customer workflows?

Network Effects:                        ___
  Does the product become more valuable with more users?
  Are there winner-take-most dynamics?

Cost Advantages:                        ___
  Can the company produce at lower cost than competitors?
  Economies of scale, proprietary processes, location?

Intangible Assets:                      ___
  Patents, licenses, regulatory approvals?
  Proprietary data or technology?

Efficient Scale:                        ___
  Is the market small enough to discourage new entrants?
  Natural monopoly or oligopoly characteristics?

TOTAL MOAT SCORE:                       ___ / 30

Interpretation:
  0-10:  No moat (commodity business, avoid premium valuation)
  11-18: Narrow moat (some competitive protection, moderate confidence)
  19-24: Wide moat (strong, durable advantages)
  25-30: Fortress moat (exceptional, rare -- verify you are not biased)
```

---

## Step 6: DCF Valuation Model

### Simplified DCF Template

```
DISCOUNTED CASH FLOW MODEL
============================
INPUTS:
  Current Free Cash Flow:           $__________
  FCF Growth Rate (Years 1-5):      ____%
  FCF Growth Rate (Years 6-10):     ____%
  Terminal Growth Rate:             ____% (typically 2-3%)
  Discount Rate (WACC):            ____% (typically 8-12%)
  Shares Outstanding:              __________

PROJECTED FREE CASH FLOWS:
  Year 1:  $__________
  Year 2:  $__________
  Year 3:  $__________
  Year 4:  $__________
  Year 5:  $__________
  Year 6:  $__________
  Year 7:  $__________
  Year 8:  $__________
  Year 9:  $__________
  Year 10: $__________

TERMINAL VALUE:
  Year 10 FCF x (1 + terminal growth) / (discount rate - terminal growth)
  = $__________

PRESENT VALUE CALCULATION:
  PV of Year 1-10 Cash Flows:      $__________
  PV of Terminal Value:             $__________
  TOTAL ENTERPRISE VALUE:           $__________
  Minus: Net Debt                   $__________
  EQUITY VALUE:                     $__________

  INTRINSIC VALUE PER SHARE:        $__________
  CURRENT MARKET PRICE:             $__________
  MARGIN OF SAFETY:                 ____%
```

### Margin of Safety Guidelines

| Margin of Safety | Interpretation |
|-----------------|----------------|
| >40% undervalued | Strong buy candidate (verify assumptions) |
| 20-40% undervalued | Attractive entry point |
| 0-20% undervalued | Fairly valued, wait for dip |
| 0-20% overvalued | Fully valued, no margin of safety |
| >20% overvalued | Overvalued, avoid or consider selling |

### Sensitivity Analysis

Always run your DCF at multiple assumptions:

```
SENSITIVITY TABLE: Intrinsic Value per Share
=============================================
                  Growth Rate Assumption
Discount Rate |   8%    |   10%   |   12%   |   15%
------------------------------------------------------
    8%        | $___    | $___    | $___    | $___
   10%        | $___    | $___    | $___    | $___
   12%        | $___    | $___    | $___    | $___
   14%        | $___    | $___    | $___    | $___
```

---

## Step 7: Risk Assessment

```
RISK CHECKLIST
===============
Business Risks:
  [ ] Customer concentration (top customer >20% of revenue)
  [ ] Key person dependency
  [ ] Technology disruption threat
  [ ] Regulatory risk
  [ ] Commodity price exposure
  [ ] Geographic concentration

Financial Risks:
  [ ] High debt levels or upcoming maturities
  [ ] Declining cash flow
  [ ] Aggressive accounting practices
  [ ] Dilutive share issuance
  [ ] Pension or off-balance-sheet liabilities

Valuation Risks:
  [ ] Paying above intrinsic value
  [ ] Growth assumptions too optimistic
  [ ] Multiple expansion already priced in
  [ ] Comparable companies trading at lower multiples

Macro Risks:
  [ ] Interest rate sensitivity
  [ ] Currency exposure
  [ ] Economic cycle dependency
  [ ] Political or trade risk
```

---

## Step 8: Decision Framework

```
INVESTMENT DECISION MATRIX
============================
Criteria                        Weight    Score (1-10)    Weighted
Business Quality                25%       ___             ___
Financial Health                20%       ___             ___
Competitive Moat                20%       ___             ___
Valuation Attractiveness        20%       ___             ___
Management Quality              15%       ___             ___

TOTAL WEIGHTED SCORE:                                     ___

Decision:
  80-100: Strong conviction buy (size position accordingly)
  60-79:  Buy with moderate position size
  40-59:  Watchlist -- wait for better price or more data
  Below 40: Pass -- look elsewhere
```

---

## Earnings Quality Red Flags

Watch for these warning signs in financial statements:

1. **Revenue recognition games** -- Revenue growing much faster than cash collections
2. **Accounts receivable spike** -- AR growing faster than revenue (channel stuffing?)
3. **Inventory buildup** -- Inventory growing faster than sales (demand weakening?)
4. **Capitalizing expenses** -- Moving operating costs to the balance sheet
5. **Frequent one-time charges** -- If they happen every year, they are not one-time
6. **Pension assumptions** -- Unrealistically high return assumptions
7. **Related party transactions** -- Deals with entities controlled by insiders
8. **Auditor changes** -- Switching auditors can signal disagreements
9. **Excessive goodwill** -- Large goodwill relative to total assets (acquisition overpayment?)
10. **Non-GAAP adjustments** -- Widening gap between GAAP and adjusted earnings

---


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to stock analysis guide
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback

## Output Format

When presenting a stock analysis, structure your output as:

1. **Company overview** -- One-paragraph summary of the business
2. **Investment thesis** -- Bull case in 2-3 sentences
3. **Financial highlights** -- Key ratios and trends in table format
4. **Moat assessment** -- Scorecard with justification
5. **Valuation summary** -- DCF result, comparable multiples, margin of safety
6. **Key risks** -- Top 3-5 risks ranked by probability and impact
7. **Decision** -- Buy, watchlist, or pass with reasoning
8. **Disclaimer** -- Reiterate this is educational analysis, not a buy/sell recommendation


```template
## Stock Analysis Guide -- Structured Output

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

**Input:** "Help me with stock analysis guide for my current situation"

**Output:**

Based on your situation, here is a structured approach to stock analysis guide:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
