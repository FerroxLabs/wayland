---
name: net-worth-tracker
description: |
  Builds a complete net worth snapshot by listing all assets (cash, investments, property, vehicles, valuables) minus all liabilities (loans, credit cards, mortgage, other debts). Produces a net worth statement with a tracking template for monitoring changes over time.
  Use when the user asks about their net worth, wants to calculate assets minus liabilities, or wants to track their financial position over time.
  Do NOT use for budget creation (use budget-planning), investment advice, or business balance sheet preparation.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance budgeting analysis planning"
  category: "personal-finance"
  subcategory: "life-stage-financial"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---
# Net Worth Tracker

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly -- including tax treatment of accounts, asset valuation methodology, and debt management priorities -- and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, certified financial planner (CFP), or licensed CPA before making significant financial decisions.

---

## When to Use

**Use this skill when:**
- The user explicitly asks to calculate or check their net worth, or asks "how much am I worth financially?"
- The user wants a complete snapshot of their financial position -- all assets and all debts in one place -- for the first time
- The user wants to establish a baseline net worth to track progress toward financial goals (debt payoff, retirement readiness, first home purchase, financial independence)
- The user wants to understand their liquidity position -- how much of their wealth is accessible versus locked in illiquid assets like real estate or retirement accounts
- The user is preparing for a major life event (marriage, divorce, home purchase, estate planning, applying for financing) and needs a structured asset-and-liability summary
- The user wants to understand their debt-to-asset ratio in context, particularly when evaluating whether they are financially overextended
- The user is recovering from a financial setback (job loss, divorce, bankruptcy) and wants to understand their current standing before rebuilding

**Do NOT use when:**
- The user wants to build a monthly spending plan -- use the `budget-planning` skill instead
- The user wants advice on which investments to buy, sell, or hold -- use investment analysis skills
- The user wants a strategy for paying off specific debts in an optimized order -- use debt management or debt avalanche/snowball skills
- The user wants to prepare a business balance sheet, financial statements for a company, or an LLC/S-corp asset inventory -- use business finance skills
- The user asks how to reduce their tax liability or optimize account types -- use tax planning skills
- The user wants a full retirement projection (how much they need to save, withdrawal rate modeling) -- use retirement planning skills
- The user only wants to discuss a single account or a single debt in isolation -- net worth tracking requires a whole-picture approach

---

## Process

### Step 1: Establish Context and Measurement Date

Before collecting any numbers, anchor the exercise with context that shapes interpretation.

- Record the exact date of the snapshot. Net worth is a point-in-time measurement, and dates matter when comparing across periods.
- Ask whether the user wants an individual net worth statement, a household net worth (combined with a partner or spouse), or both. This choice affects every subsequent category.
- Clarify the user's primary reason for doing this exercise. Someone preparing for a home purchase needs to know their liquid assets clearly. Someone assessing retirement readiness needs to understand long-term asset values. Someone newly divorced needs individual asset separation. The reason shapes which observations are most valuable at the end.
- Ask if the user wants to include their partner's assets and liabilities. If yes, note which assets/liabilities are jointly owned versus individually owned -- this matters for both legal and practical purposes.
- Confirm the user understands all values should be current market values, not purchase prices or sentimental values.

### Step 2: Inventory Liquid and Near-Liquid Assets

Liquid assets are the foundation of financial security and the most straightforward category to value.

- **Checking accounts:** Use the current balance, not the balance after pending transactions. If the user has multiple checking accounts (personal, joint, business operating), list each separately.
- **Savings accounts and high-yield savings accounts (HYSAs):** Use the current balance. Note if the account earns meaningful interest (above 4% APY as of recent rate environments) versus a legacy low-yield account -- this is relevant for later observations.
- **Money market accounts:** Include at current balance. Distinguish from money market mutual funds if the user has both.
- **Cash on hand:** Only include if material (above $500). Cash under a mattress is an asset but also a risk to mention briefly.
- **Certificates of deposit (CDs):** Include at current value. Note the maturity date and any early-withdrawal penalty -- a $10,000 CD that matures in 18 months is not immediately liquid.
- **Treasury bills and I-bonds:** Include at current value. I-bonds cannot be redeemed within the first 12 months; include a note if recently purchased.
- **Health Savings Accounts (HSAs):** Include at current balance. HSAs have triple tax advantages and are an asset, though access rules matter: before age 65, non-medical withdrawals incur a 20% penalty plus income tax.

### Step 3: Inventory Investment and Retirement Assets

Investment assets represent future wealth and require careful valuation and liquidity classification.

- **401(k), 403(b), 457(b):** Use the current account balance as reported by the plan provider. Do NOT adjust for taxes -- the gross balance is the standard for net worth purposes. Note the account type (traditional vs. Roth) in a footnote because it affects after-tax wealth, but the headline number uses the gross balance.
- **Traditional IRA and SEP-IRA:** Current balance, gross (pre-tax). Note that withdrawals before age 59½ incur a 10% penalty plus ordinary income tax, making these non-liquid for most users under 55.
- **Roth IRA:** Current balance. Contributions (not earnings) can be withdrawn penalty-free at any time, making Roth IRAs slightly more liquid than traditional accounts. Worth noting in the liquidity breakdown.
- **Taxable brokerage accounts:** Use the current market value of all holdings. If the user knows their cost basis is substantially lower than current value, note this creates an embedded tax liability (unrealized capital gains) -- though this is not deducted from net worth in the standard calculation.
- **529 education savings accounts:** Include at current value. These are earmarked for education expenses; using them for other purposes incurs a 10% penalty plus income tax on earnings. Label them as restricted assets.
- **Employer stock (vested vs. unvested):** Only include vested shares at current market value. Unvested shares are not yet an asset -- they depend on continued employment.
- **Equity compensation (RSUs, stock options):** Vested RSUs = current market value. Stock options require calculating intrinsic value (current stock price minus strike price, times the number of shares), and only if in-the-money. Unvested = excluded.
- **Annuities:** Use the current surrender value, not the face value or projected future payout. Surrender charges may apply -- the cash value the user could actually access is what matters.

### Step 4: Inventory Real Property and Illiquid Physical Assets

Real property is typically the largest single asset for most American households and the most prone to valuation errors.

- **Primary residence:** Use the user's best estimate of current market value. Guidance for estimation: recent comparable sales in the neighborhood, Zillow or Redfin automated estimates (treat as rough proxies, not appraisals), or a formal appraisal if available. Do NOT use the purchase price or tax-assessed value -- both are typically stale. Note that this value carries uncertainty and should be reassessed when local market conditions change significantly.
- **Rental properties and investment real estate:** Use current estimated market value (not purchase price, not assessed value, not depreciated book value). If the property has a separate mortgage, list both the asset and the liability distinctly.
- **Raw land:** Harder to value -- use the assessed value as a floor unless the user has recent comparables. Land is highly illiquid.
- **Vehicles (cars, trucks):** Use the current private-party resale value from Kelley Blue Book or an equivalent source. The purchase price is irrelevant. A $35,000 car purchased two years ago may have a current KBB private-party value of $22,000 -- that is the asset value. Average new vehicles depreciate 20% in the first year, 15% per year thereafter.
- **Boats, RVs, motorcycles, off-road vehicles:** Use private-party resale values. These are typically depreciating assets. Boats depreciate 10-15% per year on average. Note them as depreciating assets in observations.
- **Jewelry and watches:** Only include items with a professional appraisal or realistic recent sale comparables. An appraised engagement ring worth $8,000 is an asset. A "family heirloom with sentimental value" is not a financial asset without an appraisal.
- **Art and collectibles:** Include only if the user has a formal appraisal, recent auction comps, or an established resale market. Wine collections, coin collections, rare books -- include with a note about illiquidity and valuation uncertainty.
- **Business ownership interests:** For a sole proprietorship, this is difficult to value without a formal business valuation (the going concern requires estimating a multiple of earnings or a discounted cash flow). For a pass-through entity (LLC, S-corp, partnership), use the user's share of book value as a conservative estimate, or any formal valuation if available. Mark as illiquid and uncertain.
- **Cash value life insurance (whole life, universal life):** Use the current cash surrender value as reported by the insurer, not the face value (death benefit). The face value is irrelevant to net worth -- the user does not receive it while alive.

### Step 5: Inventory All Liabilities

Liabilities must be comprehensive -- omitting any debt distorts the calculation in ways that lead to poor decisions.

- **Mortgage(s):** Use the current outstanding principal balance from the most recent mortgage statement. Do NOT include future interest payments -- only the remaining principal is a liability. If the user has a HELOC (home equity line of credit), include the amount currently drawn as a separate liability.
- **Auto loans:** Remaining principal balance from the most recent statement.
- **Student loans:** List federal and private loans separately. Federal loans carry specific protections (income-driven repayment, potential forgiveness programs) that private loans do not -- this distinction matters for observations even though both appear at outstanding balance. If the user is on an income-driven repayment (IDR) plan, note that the balance may be growing if payments do not cover accruing interest.
- **Credit card balances:** Use the current statement balance, not the credit limit. Only outstanding debt is a liability -- available credit is not. If the user pays in full every month, the current balance may be near zero.
- **Personal loans and consolidation loans:** Remaining principal balance.
- **Medical debt:** Include any amount in collections or with a payment plan. Medical debt under $500 was removed from most credit reports in 2023, but it still represents a real liability.
- **IRS and state tax debt:** Any outstanding tax obligation, installment agreement balance, or underpaid estimated taxes is a liability.
- **Money owed to family or friends (informal loans):** Include if the user intends to repay. This is a judgment call -- some users do not treat these as formal debts. Ask.
- **Buy Now, Pay Later (BNPL) balances:** These are real liabilities. Affirm, Klarna, and similar service balances are debts.
- **401(k) loans:** A loan taken against a retirement account reduces the effective asset value. Record the outstanding 401(k) loan balance as a liability AND reduce the 401(k) asset value by the same amount -- this prevents double-counting the asset while also hiding the debt.

### Step 6: Calculate Net Worth and Derived Metrics

Net worth alone is a single number. The derived metrics reveal the story behind it.

- **Total Assets:** Sum all asset categories.
- **Total Liabilities:** Sum all liability categories.
- **Net Worth:** Total Assets minus Total Liabilities. This number can be negative -- that is not inherently alarming.
- **Debt-to-Asset Ratio (D/A Ratio):** Total Liabilities divided by Total Assets. This shows what fraction of assets is financed by debt. A D/A ratio of 0.50 means 50 cents of every dollar of assets is owed to someone else. For context: below 0.20 is generally strong; 0.20-0.50 is moderate; above 0.50 indicates significant leverage; above 1.0 means the person is technically insolvent (liabilities exceed assets).
- **Liquid Asset Ratio:** (Cash + taxable investments + accessible Roth IRA contributions) divided by Total Assets. This shows the percentage of wealth that is truly accessible. A household with 95% of net worth in home equity has very different actual financial flexibility than one with 50% in liquid investments.
- **Debt-to-Liquid-Asset Ratio:** Total Liabilities divided by Liquid Assets. This answers a practical question: if income stopped tomorrow, how long could the user service or pay off debts using accessible funds?
- **Home Equity Percentage (if applicable):** (Home value minus mortgage balance) divided by Home value. This is the user's equity stake in their property.
- **Retirement Readiness Proxy (optional):** Retirement savings as a percentage of current annual income. Common benchmarks: 1x income saved by age 30, 3x by age 40, 6x by age 50, 8x by age 60 (Fidelity guideline). Note this is a rough rule of thumb, not a personalized projection.

### Step 7: Perform the Liquidity and Composition Analysis

The composition of net worth matters as much as the total number.

- **Classify every asset into one of four liquidity tiers:**
  - **Tier 1 -- Immediately liquid:** Checking, savings, money market, cash. Available within 1-2 business days.
  - **Tier 2 -- Accessible with friction:** Taxable brokerage accounts (3-5 business day settlement), Roth IRA contributions (any time, penalty-free), I-bonds after 12 months, CDs at or near maturity.
  - **Tier 3 -- Restricted access:** Traditional IRA, 401(k), 403(b) (penalty-free at 59½; early withdrawal incurs 10% penalty + income tax), 529 plans (education expenses only), HSAs (medical expenses or age 65+).
  - **Tier 4 -- Illiquid:** Real estate, vehicles, business interests, collectibles. Require a sale process; cannot be monetized quickly.
- Calculate the dollar amount and percentage in each tier.
- Flag if Tier 1 liquid assets are below 3-6 months of essential expenses -- this is an emergency fund adequacy check embedded in the net worth exercise.
- Note if the user's net worth is heavily concentrated in a single asset (e.g., more than 50% in home equity, or more than 40% in a single employer's stock). Concentration risk is a meaningful observation.

### Step 8: Build the Tracking Template and Deliver Observations

The real value of a net worth statement is the trend over time, not the snapshot.

- Build a quarterly tracking template using the same categories in every period. Consistency is critical -- if the categories shift, period-to-period comparisons become meaningless.
- Recommend a tracking cadence: quarterly for users actively working on debt payoff, savings goals, or financial recovery; semi-annually for users in a stable phase; annually minimum for everyone.
- Recommend a consistent date for each measurement: the same day each quarter (e.g., the 1st of January, April, July, and October) so comparisons are clean.
- Write 3-5 key observations that interpret the data without being prescriptive. Observations should be factual and grounded in the numbers -- for example: "Your student loan balance represents 68% of your total liabilities. As these payments reduce the balance, your net worth will grow even if your asset values stay flat."
- Identify the single largest lever for net worth growth given the user's current composition. For most people this is one of: (a) increasing income going into savings, (b) paying down the highest-balance or highest-interest liability, or (c) allowing investment accounts to grow over time.
- Do NOT assign a rating or grade. Do NOT compare the user's number to a benchmark unless the user asks (and then present benchmarks as general data points, not verdicts).

---

## Output Format

```
## Net Worth Statement

**Date of Snapshot:** [Month Day, Year]
**Statement Type:** [Individual / Household / Joint with [Partner name or "Partner"]]

---

### ASSETS

#### Tier 1 -- Immediately Liquid
| Account / Item              | Institution (optional) | Current Value |
|-----------------------------|------------------------|---------------|
| Checking account            |                        | $X,XXX        |
| Savings / HYSA              |                        | $X,XXX        |
| Money market account        |                        | $X,XXX        |
| Cash on hand                |                        | $XXX          |
| **Tier 1 Subtotal**         |                        | **$XX,XXX**   |

#### Tier 2 -- Accessible with Friction
| Account / Item              | Notes                          | Current Value |
|-----------------------------|--------------------------------|---------------|
| Taxable brokerage account   | ~3-5 day settlement            | $XX,XXX       |
| Roth IRA (contributions)    | Contributions only, penalty-free | $X,XXX      |
| CD -- matures [date]        | Early withdrawal penalty applies | $X,XXX      |
| I-bonds                     | Issued [date]; 12-mo hold req. | $X,XXX        |
| **Tier 2 Subtotal**         |                                | **$XX,XXX**   |

#### Tier 3 -- Restricted Access
| Account / Item              | Access Rules                   | Current Value |
|-----------------------------|--------------------------------|---------------|
| 401(k) -- [Employer]        | Penalty-free at 59½            | $XX,XXX       |
| Traditional IRA             | Penalty-free at 59½            | $XX,XXX       |
| Roth IRA (earnings)         | Penalty-free at 59½            | $X,XXX        |
| 403(b)                      | Penalty-free at 59½            | $XX,XXX       |
| HSA                         | Medical or age 65+             | $X,XXX        |
| 529 plan                    | Education expenses             | $X,XXX        |
| **Tier 3 Subtotal**         |                                | **$XX,XXX**   |

#### Tier 4 -- Illiquid Physical and Business Assets
| Asset                       | Valuation Method               | Current Value |
|-----------------------------|--------------------------------|---------------|
| Primary residence           | Estimated market value         | $XXX,XXX      |
| Rental property -- [address]| Estimated market value         | $XXX,XXX      |
| Vehicle: [Year/Make/Model]  | KBB private party value        | $XX,XXX       |
| Vehicle: [Year/Make/Model]  | KBB private party value        | $XX,XXX       |
| Business interest           | Conservative book value        | $XX,XXX       |
| Jewelry (appraised)         | Appraisal value [date]         | $X,XXX        |
| Cash value life insurance   | Current surrender value        | $X,XXX        |
| **Tier 4 Subtotal**         |                                | **$XXX,XXX**  |

### TOTAL ASSETS: $XXX,XXX

---

### LIABILITIES

#### Secured Debt (backed by collateral)
| Debt                        | Lender (optional)  | Interest Rate | Remaining Balance |
|-----------------------------|--------------------|---------------|-------------------|
| Primary mortgage            |                    | X.XX%         | $XXX,XXX          |
| HELOC (drawn balance)       |                    | X.XX%         | $X,XXX            |
| Rental property mortgage    |                    | X.XX%         | $XXX,XXX          |
| Auto loan -- [Vehicle]      |                    | X.XX%         | $XX,XXX           |
| Auto loan -- [Vehicle]      |                    | X.XX%         | $XX,XXX           |
| **Secured Subtotal**        |                    |               | **$XXX,XXX**      |

#### Unsecured Debt
| Debt                        | Lender (optional)  | Interest Rate | Remaining Balance |
|-----------------------------|--------------------|---------------|-------------------|
| Student loan (federal)      |                    | X.XX%         | $XX,XXX           |
| Student loan (private)      |                    | X.XX%         | $XX,XXX           |
| Credit card -- [Issuer]     |                    | XX.XX%        | $X,XXX            |
| Credit card -- [Issuer]     |                    | XX.XX%        | $X,XXX            |
| Personal loan               |                    | X.XX%         | $X,XXX            |
| Medical debt                |                    | 0%            | $X,XXX            |
| BNPL balance (Affirm, etc.) |                    | X.XX%         | $XXX              |
| 401(k) loan outstanding     |                    | X.XX%         | $X,XXX            |
| Tax debt (IRS/state)        |                    | X.XX%         | $X,XXX            |
| **Unsecured Subtotal**      |                    |               | **$XX,XXX**       |

### TOTAL LIABILITIES: $XXX,XXX

---

### NET WORTH SUMMARY

| Metric                          | Value         |
|---------------------------------|---------------|
| Total Assets                    | $XXX,XXX      |
| Total Liabilities                | $XXX,XXX      |
| **Net Worth**                   | **$XXX,XXX**  |
| Debt-to-Asset Ratio             | X.XX          |
| Liquid Asset Ratio (Tiers 1+2)  | XX%           |
| Home Equity (if applicable)     | $XXX,XXX (XX%)|

---

### ASSET COMPOSITION BY LIQUIDITY TIER

| Tier                     | Dollar Amount | % of Total Assets |
|--------------------------|---------------|-------------------|
| Tier 1 -- Immediately liquid | $XX,XXX   | XX%               |
| Tier 2 -- Accessible w/ friction | $XX,XXX | XX%             |
| Tier 3 -- Restricted (retirement/HSA/529) | $XX,XXX | XX%  |
| Tier 4 -- Illiquid (property/vehicles/other) | $XXX,XXX | XX% |
| **Total**                | **$XXX,XXX**  | **100%**          |

---

### LIABILITY BREAKDOWN

| Category                  | Balance    | % of Total Liabilities |
|---------------------------|------------|------------------------|
| Mortgage(s)               | $XXX,XXX   | XX%                    |
| Auto loan(s)              | $XX,XXX    | XX%                    |
| Student loans             | $XX,XXX    | XX%                    |
| Credit card(s)            | $X,XXX     | XX%                    |
| Other unsecured           | $X,XXX     | XX%                    |
| **Total**                 | **$XXX,XXX**| **100%**              |

---

### KEY OBSERVATIONS

1. [Observation about net worth sign and meaning in context]
2. [Observation about the largest single asset and its liquidity tier]
3. [Observation about the largest single liability and its type]
4. [Observation about liquid asset coverage vs. expenses or debt obligations]
5. [Observation about debt-to-asset ratio interpretation]

---

### QUARTERLY TRACKING TEMPLATE

| Metric                   | [Q1 Date] | [Q2 Date] | [Q3 Date] | [Q4 Date] | 12-Mo Change |
|--------------------------|-----------|-----------|-----------|-----------|--------------|
| Total Assets             | $XXX,XXX  |           |           |           |              |
| Total Liabilities        | $XXX,XXX  |           |           |           |              |
| **Net Worth**            | **$XXX,XXX** |        |           |           |              |
| Tier 1 Liquid Assets     | $XX,XXX   |           |           |           |              |
| Retirement Assets (Tier 3) | $XX,XXX |           |           |           |              |
| Total Debt               | $XXX,XXX  |           |           |           |              |
| Debt-to-Asset Ratio      | X.XX      |           |           |           |              |

**Recommended next update:** [3 months / 6 months from snapshot date]

---

### NEXT STEPS (User to prioritize)
- [ ] Reassess home value estimate in [6-12 months] or if local market changes significantly
- [ ] Update this statement on [next scheduled date]
- [ ] Review whether Tier 1 liquid assets cover 3-6 months of essential expenses
- [ ] [Specific action suggested by observations -- e.g., "Confirm interest rates on student loans to assess refinancing"]
```

---

## Rules

1. **Always present the disclaimer at the top.** Financial figures feel authoritative. Users may treat a net worth calculation as advice. The disclaimer ensures the AI's role is framed as an educational tool, not a financial planner.

2. **Use current market value for every asset without exception.** The value of an asset is what it would sell for today, not what was paid for it. A car purchased for $40,000 four years ago and worth $18,000 today is an $18,000 asset. A home bought for $250,000 in 2015 and worth $420,000 today is a $420,000 asset. Purchase price is economically irrelevant to net worth.

3. **Never adjust retirement account balances for taxes in the headline calculation.** Net worth statements universally use gross (pre-tax) balances. If the user asks, acknowledge that traditional 401(k)/IRA balances have embedded tax liabilities (typically 22-32% for middle-income households) while Roth balances are tax-free -- but do not apply a tax adjustment to the net worth number. It is a standard convention, not an error.

4. **Classify every asset into a liquidity tier.** A $500,000 net worth made up of $490,000 in home equity and $10,000 in cash is fundamentally different from $500,000 in liquid investments. The liquidity breakdown is not optional -- it changes what the net worth number actually means.

5. **Include interest rates on liabilities whenever the user provides them.** Interest rates do not change the net worth calculation, but they are critical context for observations. A $20,000 student loan at 4.5% is a very different financial burden than a $20,000 credit card balance at 24.99%.

6. **Do not include unvested equity compensation, future Social Security benefits, pension future payments, or projected inheritance in assets.** Net worth is a present-value statement of current legal ownership. Unvested RSUs have not been earned yet. Social Security is a future government benefit, not a current asset. Pensions are not assets until vested and typically require actuarial valuation.

7. **Handle 401(k) loans correctly.** If a user has borrowed against their 401(k), the loan reduces the account balance shown by the plan provider. Do NOT add the loan balance back as an asset. The loan appears only as a liability. If the user's 401(k) statement shows $45,000 after a $10,000 loan, the asset is $45,000 and the liability is $10,000. The combined effect is $35,000 net equity in the account.

8. **Never assign a rating, grade, or "good/bad" judgment to the net worth number.** There is no universal benchmark for net worth. A 28-year-old with $15,000 positive net worth and $60,000 in student loans is in a completely different situation than a 55-year-old with $15,000 positive net worth. Age, income, family structure, geography, and goals all affect what any number means.

9. **Present negative net worth without alarm and with accurate framing.** Negative net worth is structurally expected in several life stages: recent college graduates with student loans, new homeowners (especially in the first 3-5 years), people who financed significant medical treatment. A negative net worth that is trending toward zero is evidence of financial progress.

10. **Always include the quarterly tracking template with the current period pre-filled.** A one-time net worth calculation has limited value. The purpose is to establish a baseline so the user can measure whether their financial position is improving over time. The trend over 2-4 quarters reveals far more than any single snapshot.

11. **Do not include assessed property tax value as a proxy for home market value.** Assessed values lag true market values by 1-5 years in most jurisdictions and can be set at 50-80% of true market value depending on state and county. Always guide the user toward current market comparables.

12. **Separate rental property assets and liabilities from the primary residence.** Conflating investment real estate with primary residence obscures the financial picture. Each property should have its own asset line (current market value) and its own liability line (remaining mortgage balance). The difference is the equity position in that property.

---

## Edge Cases

### User Has a Negative Net Worth
A negative net worth is structurally common and should be presented without alarm. The key questions are: what is causing the negative net worth (student loans, a large mortgage in early years, credit card debt, or something else?), and what is the trend direction?

- Calculate the approximate time to zero if the user is making regular payments. A -$15,000 net worth with $500/month going toward liabilities reduction and modest investment growth will typically reach zero within 2-4 years.
- Distinguish between "negative net worth due to productive leverage" (a large mortgage on an appreciating home, student loans that preceded income growth) versus "negative net worth due to consumptive debt" (credit card balances, personal loans for depreciating purchases). The first is structurally planned; the second is a warning signal.
- For users in negative net worth territory, the liquidity and liability breakdown is especially important -- the composition of the negative position determines what actions are available.

### User Owns a Home With an Outstanding Mortgage
Home equity is the most common source of large positive net worth for American households -- and also the least liquid.

- Asset value: current estimated market value (NOT purchase price, NOT remaining loan amount, NOT tax assessed value).
- Liability: outstanding principal balance on the mortgage ONLY (not future interest, not escrow).
- Net equity: asset minus liability. In the early years of a 30-year mortgage, home equity grows slowly due to amortization (in year 1 of a typical mortgage, only ~20% of each payment reduces principal; the rest is interest).
- Flag if home equity exceeds 50% of total net worth. Concentration in a single illiquid asset creates vulnerability -- if the housing market declines or the user needs liquidity quickly, they cannot easily convert home equity to cash without selling, refinancing, or opening a HELOC.
- If the user has a HELOC: the credit line itself is not an asset (it is borrowed money). Only the amount currently drawn is a liability.

### User Has Equity Compensation (RSUs, Stock Options, ESPP)
Equity compensation is frequently misunderstood and misstated in net worth calculations.

- **Vested RSUs:** These are actual shares owned today. Value = number of shares multiplied by current stock price. They are a Tier 2 or Tier 4 asset depending on whether shares are publicly traded (Tier 2) or in a private company (Tier 4, illiquid).
- **Unvested RSUs:** Exclude entirely. They are not yet owned and vest conditionally on continued employment.
- **Stock options (ISOs and NSOs):** Only in-the-money options have intrinsic value. An option with a strike price of $20 on a stock trading at $32 has $12 of intrinsic value per share. An option with a strike price of $20 on a stock trading at $15 is underwater and has no current net worth value.
- **ESPP (Employee Stock Purchase Plan):** Shares already purchased and held are an asset at current market value. The discount capture is already baked into the price paid.
- **Private company equity:** Mark as illiquid (Tier 4) and use either the last preferred share price from a recent funding round (for startup equity) or zero if the company has no formal recent valuation. Private company equity is frequently overrepresented in net worth -- it may be worth exactly as stated, or it may be worth nothing. Note the uncertainty explicitly.

### User Has Joint Finances With a Partner
Joint net worth calculations require intentional scoping.

- Ask explicitly: does the user want one combined household statement, one individual statement, or both?
- For a combined statement: include all assets regardless of whose name they are in (joint accounts, individually held accounts, retirement accounts held by each person). Label ownership for accounts where it matters legally (individual retirement accounts, for example, can only be owned by one person).
- For an individual statement: include only assets and liabilities in the user's name, plus their share of joint assets and liabilities.
- Inform the user that for net worth tracking purposes, combined household statements are more useful for financial planning, while individual statements matter for credit applications, prenuptial or postnuptial agreements, and divorce proceedings.
- If one partner has significantly more debt (e.g., one partner has $80,000 in student loans from before the relationship), note this separately. In some states, pre-marital debt remains individually owned -- this has legal and financial planning implications.

### User Has a 401(k) Loan Outstanding
This is one of the most common sources of double-counting errors in net worth calculations.

- The 401(k) loan balance shown on most plan statements is ALREADY reflected as a reduction in the account balance -- the money is gone from the account. Do NOT add the loan balance back as a separate asset.
- Record the 401(k) loan outstanding balance as a liability.
- Net effect: the user's retirement asset is lower (by the loan amount) and their liabilities are higher (by the loan amount). Net worth is lower by twice the loan amount relative to if the loan had never been taken.
- Note that 401(k) loans that are not repaid within 5 years (or immediately if employment ends) become taxable distributions subject to income tax plus a 10% early withdrawal penalty if under 59½.

### User Has Cryptocurrency or Digital Assets
Cryptocurrency is a real and volatile asset class that requires special handling.

- Include cryptocurrency at current fair market value in USD. Use the value from a reputable exchange at the date of the snapshot.
- Classify as Tier 2 (accessible with friction) if held on a major exchange, or Tier 4 (illiquid/uncertain) if held in a hardware wallet or a less-liquid altcoin.
- Note the volatility explicitly: cryptocurrency values can change 20-50% in weeks. The value captured today may be materially different in 90 days. Recommend reassessment at each tracking period.
- Do not include NFTs or illiquid token positions at face value unless the user can demonstrate recent comparable sales in an active market.
- Remind the user that cryptocurrency dispositions have tax implications (capital gains) -- relevant for future decisions but not to the net worth calculation itself.

### User Has Business Ownership Interests
Business valuation for net worth purposes is genuinely difficult and carries significant uncertainty.

- **Sole proprietorship with no transferable value:** Many small service businesses (freelancers, solo consultants) have revenue but no enterprise value that could be sold. Their business "asset" is their ongoing labor. In this case, the business contributes no balance sheet asset -- only the physical equipment and cash held in business accounts.
- **Small business with a buyer's market:** Use a conservative multiple of annual net profit (2-4x EBITDA is a common range for small businesses). Acknowledge this is an estimate.
- **Formal minority stake in an LLC or partnership:** Use the user's capital account balance from the most recent K-1 or operating agreement as a conservative estimate.
- **Actively traded private company shares with a recent 409A valuation:** Use the most recent 409A per-share value times shares owned as a starting point, noting it may be stale.
- Always mark business interests as Tier 4 (illiquid) regardless of perceived value. They cannot be converted to cash quickly or reliably.

---

## Example

**Input:** "I want to figure out my complete net worth. Here's what I have: $4,200 in checking, $11,500 in a high-yield savings account, about $47,000 in my 401k at work (traditional), $8,300 in a Roth IRA (I've contributed $6,000 of that myself), a taxable brokerage account worth $14,200. I own my car -- 2020 Honda Accord -- probably worth $17,000 with $9,400 left on the loan at 5.9%. I still owe $31,500 in federal student loans at 6.5%. I have two credit cards -- one with $1,800 on it at 22% and one I pay off monthly so basically zero. No house yet. I think that's everything."

---

## Net Worth Statement

**Date of Snapshot:** [Current Date]
**Statement Type:** Individual

---

### ASSETS

#### Tier 1 -- Immediately Liquid
| Account / Item        | Notes                        | Current Value |
|-----------------------|------------------------------|---------------|
| Checking account      |                              | $4,200        |
| High-yield savings    | HYSA, strong interest rate   | $11,500       |
| **Tier 1 Subtotal**   |                              | **$15,700**   |

#### Tier 2 -- Accessible with Friction
| Account / Item                  | Notes                                    | Current Value |
|---------------------------------|------------------------------------------|---------------|
| Taxable brokerage account       | ~3-5 day settlement; capital gains may apply | $14,200   |
| Roth IRA -- contributions only  | $6,000 contributed; accessible any time penalty-free | $6,000 |
| **Tier 2 Subtotal**             |                                          | **$20,200**   |

#### Tier 3 -- Restricted Access
| Account / Item                | Notes                                  | Current Value |
|-------------------------------|----------------------------------------|---------------|
| 401(k) -- Traditional         | Penalty-free at 59½; pre-tax balance   | $47,000       |
| Roth IRA -- earnings portion  | $8,300 total minus $6,000 contributions; accessible at 59½ | $2,300 |
| **Tier 3 Subtotal**           |                                        | **$49,300**   |

#### Tier 4 -- Illiquid Physical Assets
| Asset                        | Valuation Method               | Current Value |
|------------------------------|--------------------------------|---------------|
| 2020 Honda Accord            | KBB private party estimate     | $17,000       |
| **Tier 4 Subtotal**          |                                | **$17,000**   |

### TOTAL ASSETS: $102,200

---

### LIABILITIES

#### Secured Debt
| Debt                | Interest Rate | Remaining Balance |
|---------------------|---------------|-------------------|
| Auto loan -- Accord | 5.9%          | $9,400            |
| **Secured Subtotal**|               | **$9,400**        |

#### Unsecured Debt
| Debt                        | Interest Rate | Remaining Balance |
|-----------------------------|---------------|-------------------|
| Federal student loans       | 6.5%          | $31,500           |
| Credit card (carrying balance)| 22.0%       | $1,800            |
| Credit card (paid monthly)  | N/A           | $0                |
| **Unsecured Subtotal**      |               | **$33,300**       |

### TOTAL LIABILITIES: $42,700

---

### NET WORTH SUMMARY

| Metric                          | Value         |
|---------------------------------|---------------|
| Total Assets                    | $102,200      |
| Total Liabilities                | $42,700       |
| **Net Worth**                   | **$59,500**   |
| Debt-to-Asset Ratio             | 0.42          |
| Liquid Asset Ratio (Tiers 1+2)  | 35% of assets |
| Retirement Assets (Tier 3)      | $49,300 (48%) |

---

### ASSET COMPOSITION BY LIQUIDITY TIER

| Tier                              | Dollar Amount | % of Total Assets |
|-----------------------------------|---------------|-------------------|
| Tier 1 -- Immediately liquid      | $15,700       | 15%               |
| Tier 2 -- Accessible w/ friction  | $20,200       | 20%               |
| Tier 3 -- Restricted (retirement) | $49,300       | 48%               |
| Tier 4 -- Illiquid (vehicle)      | $17,000       | 17%               |
| **Total**                         | **$102,200**  | **100%**          |

---

### LIABILITY BREAKDOWN

| Category              | Balance   | % of Total Liabilities |
|-----------------------|-----------|------------------------|
| Student loans (federal)| $31,500  | 74%                    |
| Auto loan             | $9,400    | 22%                    |
| Credit card           | $1,800    | 4%                     |
| **Total**             | **$42,700**| **100%**              |

---

### KEY OBSERVATIONS

1. **Your net worth is $59,500 -- a positive position.** Your assets exceed your liabilities by a meaningful margin. At 35% of assets combined in Tiers 1 and 2, you have genuine financial flexibility alongside your long-term holdings.

2. **Retirement savings dominate your asset base.** Your 401(k) and Roth IRA together ($49,300) represent 48% of your total assets. This is structurally healthy for long-term wealth building, but these funds are not accessible without penalty for decades. Your real-world financial flexibility is represented by Tiers 1 and 2 ($35,900), not your total net worth number.

3. **Student loans are your dominant liability at 74% of total debt.** At 6.5%, this is a meaningful interest rate -- not emergency territory, but worth monitoring. Federal loans carry income-driven repayment and forgiveness protections that private loans do not. This distinction matters if your income changes.

4. **The $1,800 credit card balance at 22% is your highest-cost debt.** Although it is your smallest liability, a 22% APR means this balance costs approximately $396/year in interest if only minimum payments are made. Eliminating it should take priority over any other debt payoff simply due to cost of capital.

5. **Your Tier 1 liquid assets ($15,700) provide a solid short-term cushion.** This covers the typical 3-6 months of essential expenses for most single-person households. If your essential monthly expenses exceed approximately $2,600-$5,200/month, your liquid buffer may be tighter than it appears -- worth checking against your actual monthly costs.

---

### QUARTERLY TRACKING TEMPLATE

| Metric                     | Q1 [Date]   | Q2 [Date] | Q3 [Date] | Q4 [Date] | 12-Mo Change |
|----------------------------|-------------|-----------|-----------|-----------|--------------|
| Total Assets               | $102,200    |           |           |           |              |
| Total Liabilities           | $42,700     |           |           |           |              |
| **Net Worth**              | **$59,500** |           |           |           |              |
| Tier 1 Liquid Assets       | $15,700     |           |           |           |              |
| Retirement Assets (Tier 3) | $49,300     |           |           |           |              |
| Total Debt                 | $42,700     |           |           |           |              |
| Debt-to-Asset Ratio        | 0.42        |           |           |           |              |

**Recommended next update:** [3 months from snapshot date]

---

### NEXT STEPS
- [ ] Prioritize eliminating the $1,800 credit card balance (22% APR -- highest cost debt by a wide margin)
- [ ] Reassess the 2020 Accord value at the next update -- vehicles depreciate approximately $1,500-$2,500/year at this range
- [ ] Verify whether current 401(k) contribution rate captures any available employer match -- unmatched employer contributions are deferred compensation left on the table
- [ ] At the next update, note whether student loan balance has decreased, held steady, or grown -- if you are on an income-driven repayment plan, the balance can grow even while making payments
- [ ] Once the credit card is paid off, update Tier 1 liquid assets target to reflect monthly spending -- the HYSA balance is healthy but confirm it aligns with your actual 3-6 month expense baseline
- [ ] Update this statement in [3 months] using the tracking template above
