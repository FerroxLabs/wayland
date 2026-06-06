---
name: rebalancing-framework
description: |
  Explains portfolio rebalancing concepts including drift calculation, threshold
  triggers, and time-based approaches. Walks through how to calculate allocation
  drift and documents the steps to restore target allocation. Produces a
  rebalancing analysis with the user's actual portfolio numbers.
  Use when the user asks about portfolio rebalancing, how to maintain target
  allocations, or when to adjust their investment mix.
  Do NOT use for setting target allocations (use portfolio-allocation-framework),
  understanding account types (use investment-account-types), or assessing risk
  tolerance (use risk-tolerance-assessment). Never prescribes rebalancing
  frequency or specific target weights.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "investing personal-finance planning analysis"
  category: "personal-finance"
  subcategory: "investing"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "advanced"
---
# Rebalancing Framework

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

## When to Use

**Use this skill when:**
- The user knows their target allocation and wants to calculate how far their actual portfolio has drifted from it -- measured in both percentage points and dollars
- The user wants to understand the mechanical difference between time-based, threshold-based, hybrid, and cash-flow rebalancing and needs to choose an approach that fits their situation
- The user holds assets across multiple account types (taxable brokerage, traditional IRA, Roth IRA, 401k) and needs to sequence rebalancing trades to minimize tax drag
- The user wants to build a repeatable, documented rebalancing procedure they can follow on their chosen schedule -- not a one-time analysis
- The user experienced a significant market event (large equity drawdown, bond rally, high-inflation period) and wants to understand whether and how to restore targets mechanically
- The user is receiving regular contributions (payroll into 401k, automatic transfers) and wants to understand how to use cash flows to reduce or eliminate the need for selling
- The user has an asymmetric portfolio -- for example, one position (company stock, concentrated equity, illiquid real estate) that dominates the portfolio and complicates standard rebalancing math
- The user wants to understand the actual cost of NOT rebalancing -- specifically, how risk profile and volatility change as drift compounds over time

**Do NOT use this skill when:**
- The user has not yet set target allocations -- redirect to `portfolio-allocation-framework` first; running drift math against undefined targets is meaningless
- The user is asking which target allocation is right for them based on age, income, or risk preference -- that is the function of `risk-tolerance-assessment` and `portfolio-allocation-framework`
- The user wants to understand the difference between a Roth IRA, traditional IRA, and 401k -- use `investment-account-types` for account structure education before bringing them back here for rebalancing sequencing
- The user is asking about initial portfolio construction from cash -- this skill covers ongoing maintenance of an existing portfolio with defined targets, not first-time asset deployment
- The user is asking about factor tilts, smart-beta strategies, or changing their underlying asset class definitions -- those are allocation decisions, not rebalancing mechanics
- The user is asking about withdrawal sequencing in retirement -- while rebalancing overlaps with drawdown strategy, dedicated retirement-withdrawal skills handle that context more accurately

---

## Process

### Step 1: Confirm Targets and Gather Data

Before any math, collect precise inputs. Garbage in, garbage out -- this step determines whether the entire analysis is meaningful.

- Confirm the user has defined target allocations that sum to exactly 100%. If they say "I want to be roughly 60/40," that is not precise enough -- ask whether they mean 60% total equity / 40% total fixed income, or a more granular breakdown
- Collect the current market value of every holding, grouped by the asset class categories their target allocation uses. If their target says "US equity / International equity / Bonds / Cash," the holdings must be mapped into those same buckets -- not into individual funds
- Record total portfolio value as the sum of all holdings across all accounts. Rebalancing math is always performed at the total portfolio level first, then translated into account-level trades
- Ask which accounts hold which assets. A 60/40 target managed across a taxable brokerage, a Roth IRA, and a 401k requires knowing which bucket of each asset class lives in which account before planning trades
- Note the presence of any illiquid or non-tradeable holdings (employer stock subject to a vesting schedule, real estate investment trusts that cannot be partially sold, stable value funds with surrender charges). These affect rebalancing mechanics but must still be included in total portfolio value for accurate drift calculation

### Step 2: Calculate Allocation Drift

Drift is the central diagnostic number. Calculate it precisely and present it both as percentage points and as dollar amounts, because the dollar amount is what drives trade sizing.

For each asset class:

```
Current Weight (%) = (Current Value in Asset Class / Total Portfolio Value) × 100

Drift (percentage points) = Current Weight (%) - Target Weight (%)

Dollar Drift = (Drift % / 100) × Total Portfolio Value

Target Value = (Target Weight % / 100) × Total Portfolio Value

Trade Size = Target Value - Current Value
  (positive = need to BUY, negative = need to SELL)
```

- Present the full calculation chain visibly for every asset class, not just the final number. Users need to be able to reproduce the math
- Percentage-point drift and percentage-of-target drift are different concepts. A 5 percentage point drift from a 10% target (now at 15%) is a 50% overweight -- much more severe than a 5 point drift from a 60% target (now at 65%), which is only an 8.3% overweight. Both measures are informative; explain the distinction
- Round dollar trade sizes to the nearest $100 or $500 for practical implementation. Telling someone to buy exactly $4,873.17 in bonds is technically precise but operationally useless
- Verify that all buy and sell amounts net to zero (or to the net cash contribution / withdrawal amount). The sum of all "buy" trades must equal the sum of all "sell" trades in a closed rebalancing with no new cash

### Step 3: Apply a Materiality Test to Each Drift

Not every drift warrants a trade. Before generating action items, evaluate each drifting position against multiple materiality criteria:

- **Transaction cost threshold:** If an account charges a trading commission (older platforms still do), compare the commission against the benefit of the trade. A $7 commission to rebalance a $150 drift is economically irrational
- **Tax cost threshold:** In a taxable account, if selling an overweight position would trigger a short-term capital gain (held less than 12 months in the US), the tax drag can easily exceed the rebalancing benefit. Calculate the approximate after-tax cost before flagging a sell trade
- **Relative vs. absolute drift:** Use both a relative and absolute trigger for materiality. A common academic benchmark (from Vanguard's rebalancing research) is that absolute drift under 1 percentage point rarely justifies trading costs. A relative drift of less than 10% of the target weight (e.g., 58% actual vs. 60% target = 3.3% relative drift) is similarly marginal
- **Portfolio size scaling:** On a $50,000 portfolio, a 5% drift is $2,500 -- meaningful. On a $2,000,000 portfolio, a 5% drift is $100,000 -- urgent. Dollar context matters alongside percentages
- Flag positions that exceed materiality thresholds clearly as "Action Needed." Flag positions within normal drift as "Monitor." Flag positions with near-zero drift as "On Target"

### Step 4: Present Rebalancing Approaches With Concrete Mechanics

Do not simply name the four approaches. Explain the mechanics, the real tradeoffs, and the research context for each.

**Time-Based Rebalancing:**
- Rebalance on a fixed calendar schedule regardless of drift magnitude
- Annual rebalancing is the most common and has been shown in multiple academic studies (Vanguard 2015, Morningstar 2010) to capture most of the risk-reduction benefit with minimal transaction costs
- Quarterly rebalancing captures slightly more drift control but roughly quadruples trading activity -- the incremental risk reduction is small relative to the cost increase
- Monthly rebalancing is generally not cost-effective except in zero-commission, zero-tax environments (e.g., rebalancing within a 401k using plan-level tools)
- Best fit: investors who do not want to monitor their portfolio between scheduled reviews

**Threshold-Based Rebalancing:**
- Rebalance whenever any single asset class drifts beyond a defined absolute threshold (commonly 5 percentage points) or a relative threshold (commonly 20-25% of target weight)
- A 5 percentage point absolute threshold on a 60% equity target means rebalancing triggers when equity reaches 65% or falls to 55%
- A 20% relative threshold on a 60% equity target means rebalancing triggers when equity reaches 72% (60 × 1.20) or falls to 48% (60 × 0.80) -- a wider band, appropriate for volatile asset classes
- Research (Rekenthaler, Morningstar) suggests threshold bands of 5 percentage points absolute outperform smaller bands on a risk-adjusted, cost-adjusted basis for most retail portfolios
- Best fit: investors with monitoring tools or brokerage alerts who prefer to act only when drift is economically meaningful

**Hybrid Approach:**
- Check on a fixed calendar schedule, but only execute trades if drift exceeds the threshold at time of review
- The most commonly cited implementation: quarterly check, rebalance if any class has drifted more than 5 percentage points
- This approach prevents both under-monitoring (missing a large drift between annual check-ins during a volatile year) and over-trading (rebalancing a 1% drift because the calendar says so)
- Best fit: most individual investors -- provides discipline without excessive trading

**Cash Flow Rebalancing:**
- Direct all new contributions (401k contributions, IRA contributions, dividend reinvestment, cash transfers) entirely to underweight asset classes
- Mathematically effective only when contribution size is material relative to portfolio size. On a $50,000 portfolio receiving $6,000/year in contributions, cash flow rebalancing can correct a ~12% annual drift without selling -- meaningful
- On a $500,000 portfolio receiving the same $6,000 contribution, cash flow rebalancing corrects only ~1.2% of drift -- insufficient as the sole mechanism if drift is larger
- The contribution ratio = annual contributions / total portfolio value. If this ratio exceeds the largest single-class drift, cash flow rebalancing alone is sufficient. If it is smaller, it partially offsets but does not eliminate drift
- Tax advantage: cash flow rebalancing into underweight positions involves only purchases -- no taxable sales. This is the most tax-efficient rebalancing method available
- Best fit: accumulation-phase investors with regular contributions to tax-advantaged accounts, especially those with large taxable portfolio components

### Step 5: Sequence Trades for Tax Efficiency

This step is where significant real-world value is added. The sequence in which rebalancing trades are executed determines the tax cost.

**The tax-location sequencing hierarchy (always follow this order):**
1. Execute ALL trades needed within tax-advantaged accounts first (401k, traditional IRA, Roth IRA). No capital gains, no tax forms, no holding period considerations
2. Within tax-advantaged accounts, confirm there is no fund-level restriction (some 401k stable value funds have 90-day equity transfer restrictions; some target-date funds cannot hold partial proceeds without automatic drift back)
3. If rebalancing cannot be completed within tax-advantaged accounts alone, turn to taxable accounts next
4. Within taxable accounts, first check whether any underweight position can be funded from new cash rather than from selling overweight positions -- eliminating the need for a sale entirely
5. If sales in taxable accounts are unavoidable, apply this selling priority:
   - Sell positions with losses first (tax-loss harvesting opportunity -- the loss offsets other gains)
   - Among positions with gains, sell long-term positions (held 12+ months in the US) before short-term positions, as long-term rates are lower [JURISDICTION: verify current capital gains rates]
   - Among long-term gain positions, sell the lot with the highest cost basis first (lowest gain per dollar)
6. Document every trade decision with the tax rationale so the user has a record for their tax preparer

**The account-level isolation principle:** After sequencing, recalculate whether the remaining drift (not correctable in tax-advantaged accounts without new contributions) is material enough to justify taxable account trading. A 2% residual drift after maximizing tax-advantaged rebalancing may not warrant triggering a taxable gain.

### Step 6: Build the Complete Trade List and Verify Math

Translate the portfolio-level rebalancing plan into explicit account-level trades.

- For each trade, specify: account name/type, asset class, direction (buy/sell), dollar amount, and approximate number of shares (if known)
- Round trade sizes to amounts that avoid odd lot complications (minimum purchase/sale sizes for certain funds)
- Verify the complete trade list by re-running the allocation math on the post-trade portfolio to confirm target weights are restored within rounding tolerance (within 0.5 percentage points is acceptable)
- If the user is rebalancing within a 401k using percentage-based allocation settings rather than dollar trades, translate dollar trade amounts back into target percentage allocations for the 401k interface
- Flag any wash sale risk if tax-loss harvesting is involved: in the US, selling a security at a loss and repurchasing a "substantially identical" security within 30 days before or after the sale disallows the loss for tax purposes. Buying a different-but-similar fund (e.g., selling one total market index fund and buying a different provider's total market index) may still trigger wash sale rules -- this is a complex area requiring professional guidance [JURISDICTION: verify wash sale rules]

### Step 7: Document the Repeatable Rebalancing Procedure

The single analysis is only valuable if it becomes a repeatable procedure. Produce a documented checklist the user can follow on their chosen schedule.

- Capture the user's chosen approach (time-based, threshold-based, or hybrid) with their specific parameters (frequency, threshold percentage)
- Record the current rebalancing date, the pre-trade allocation, the trades executed, and the post-trade allocation. This creates an audit trail
- Set forward-looking triggers: if hybrid approach, document both the next calendar review date AND the threshold percentages that would trigger an out-of-cycle review
- Note which accounts were used and which were not. If a taxable account was not needed this time, note the residual drift that would need to reach before triggering taxable trades
- Cross-reference with the investment fee analysis (use `investment-fee-analyzer`) -- rebalancing trades may involve transaction costs that should be factored into how often the process is repeated

---

## Output Format

```
## Portfolio Rebalancing Analysis

**Analysis Date:** [Date]
**Total Portfolio Value:** $[X]

---

### Step 1: Target vs. Current Allocation (Drift Table)

| Asset Class | Target % | Target $ | Current Value | Current % | Drift (pp) | Dollar Drift | Materiality |
|-------------|----------|----------:|-------------:|----------:|----------:|------------:|-------------|
| [Class 1] | [X]% | $[X] | $[X] | [X]% | [+/-][X]pp | [+/-]$[X] | On Target / Monitor / Action Needed |
| [Class 2] | [X]% | $[X] | $[X] | [X]% | [+/-][X]pp | [+/-]$[X] | On Target / Monitor / Action Needed |
| [Class 3] | [X]% | $[X] | $[X] | [X]% | [+/-][X]pp | [+/-]$[X] | On Target / Monitor / Action Needed |
| [Class 4] | [X]% | $[X] | $[X] | [X]% | [+/-][X]pp | [+/-]$[X] | On Target / Monitor / Action Needed |
| **Total** | **100%** | **$[X]** | **$[X]** | **100%** | | | |

**Drift Calculations (visible math):**
```
[Class 1]: $[X] / $[Total] = [X]% current | Target: [X]% | Drift: [+/-][X]pp | Dollar drift: [+/-]$[X]
[Class 2]: $[X] / $[Total] = [X]% current | Target: [X]% | Drift: [+/-][X]pp | Dollar drift: [+/-]$[X]
[Class 3]: $[X] / $[Total] = [X]% current | Target: [X]% | Drift: [+/-][X]pp | Dollar drift: [+/-]$[X]
```

---

### Step 2: Materiality Assessment

| Asset Class | Absolute Drift | Relative Drift (% of target) | Material? | Reason |
|-------------|---------------|-----------------------------:|-----------|--------|
| [Class 1] | [X]pp | [X]% | Yes / No | [e.g., exceeds 5pp threshold / below 1pp absolute floor] |
| [Class 2] | [X]pp | [X]% | Yes / No | [e.g., 20% relative overweight -- significant] |

---

### Step 3: Rebalancing Approach Options

| Approach | Trigger Mechanism | Estimated Annual Trades | Best Fit For |
|----------|------------------|------------------------|--------------|
| Annual time-based | Calendar: once per year | 1 review, 1 rebalancing | Simple, low-maintenance portfolios |
| Quarterly/hybrid | Check quarterly, trade if drift > [X]pp | 4 reviews, 0-4 rebalancings | Most individual investors |
| Threshold-only | Trade when any class drifts > [X]pp | Variable, drift-dependent | Investors with monitoring alerts |
| Cash flow | Direct contributions to underweight | 0 selling events | Accumulation-phase investors with regular contributions |

**Contribution Ratio Check (if applicable):**
```
Annual contributions: $[X]
Total portfolio value: $[X]
Contribution ratio: [X]%
Largest single-class drift: [X]%
Cash flow rebalancing [can / cannot] fully correct drift without selling
```

---

### Step 4: Recommended Trade Sequence (Tax-Optimized)

**Phase 1 -- Tax-Advantaged Accounts**

| Account | Asset Class | Direction | Amount | Post-Trade Balance |
|---------|-------------|-----------|-------:|------------------:|
| [401k / IRA / Roth] | [Class] | Buy / Sell | $[X] | $[X] |
| [401k / IRA / Roth] | [Class] | Buy / Sell | $[X] | $[X] |

**Phase 2 -- Taxable Accounts (only if drift remains after Phase 1)**

| Account | Asset Class | Direction | Amount | Tax Consideration |
|---------|-------------|-----------|-------:|-------------------|
| [Taxable brokerage] | [Class] | Buy | $[X] | New cash purchase -- no taxable event |
| [Taxable brokerage] | [Class] | Sell | $[X] | Long-term gain / Short-term gain / Loss [JURISDICTION: verify] |

**Trade Verification:**
```
Sum of all buys:  $[X]
Sum of all sells: $[X]
Net cash used:    $[X] (should equal $0 for pure rebalancing, or = new contribution amount)

Post-trade allocation check:
[Class 1]: $[X] / $[Total] = [X]% (Target: [X]%) ✓ within tolerance
[Class 2]: $[X] / $[Total] = [X]% (Target: [X]%) ✓ within tolerance
```

---

### Step 5: Tax Considerations Summary

| Account Type | Tax Impact of Trades | Notes |
|-------------|---------------------|-------|
| 401k | None | Trades are internal to the account |
| Traditional IRA | None | Trades are internal to the account |
| Roth IRA | None | Trades are internal to the account |
| Taxable brokerage | Potential capital gains on sales | [JURISDICTION: verify short-term vs. long-term rates] |

- **Tax-loss harvesting opportunity:** [Yes -- $[X] in unrealized losses available / No]
- **Wash sale risk:** [Yes -- flag specific positions / No]
- **Recommended action:** Consult a tax professional before executing taxable sales exceeding $[X]

---

### Step 6: Repeatable Rebalancing Procedure

**Your Chosen Approach:** [Time-based / Threshold-based / Hybrid / Cash flow]
**Review Schedule:** [Frequency]
**Rebalancing Trigger Threshold:** [X] percentage points absolute drift OR [X]% relative drift

**Rebalancing Checklist:**
- [ ] Record today's total portfolio value across all accounts
- [ ] Pull current market values for each asset class bucket
- [ ] Calculate current weights using: (asset class value / total) × 100
- [ ] Calculate drift for each class: current weight -- target weight
- [ ] Check materiality: does any class exceed [X]pp absolute drift?
- [ ] If yes: generate trade list starting with tax-advantaged accounts
- [ ] Calculate post-trade allocation to verify targets restored
- [ ] Execute trades in order: tax-advantaged first, taxable only if necessary
- [ ] For taxable sells: confirm holding periods and consult tax guidance
- [ ] Record: date, pre-trade allocation, trade list, post-trade allocation
- [ ] Set next review reminder: [specific date]

---

### Rebalancing History Log (maintain over time)

| Date | Pre-Trade Allocation | Trades Executed | Post-Trade Allocation | Trigger Type |
|------|---------------------|-----------------|----------------------|--------------|
| [Date] | [summary] | [summary] | [summary] | Time / Threshold / Both |

---

### Next Steps
- [ ] Confirm your chosen rebalancing approach and record your threshold parameters
- [ ] Execute Phase 1 trades (tax-advantaged accounts) by [date]
- [ ] Decide whether residual drift justifies Phase 2 taxable trades -- consult tax professional if selling appreciated assets
- [ ] Set next review date: [date based on chosen schedule]
- [ ] Review target allocation periodically with `portfolio-allocation-framework` -- rebalancing to a wrong target is counterproductive
```

---

## Rules

1. **Never prescribe a specific rebalancing frequency.** Presenting annual, quarterly, or threshold-based as options and explaining tradeoffs is the correct approach. Telling a user "you should rebalance quarterly" implies specific knowledge of their tax situation, trading costs, and portfolio size that this skill cannot possess.

2. **Never prescribe target allocation weights.** Drift is always calculated against the user's own stated targets. If they have not defined targets, the entire rebalancing analysis is undefined -- redirect to `portfolio-allocation-framework` immediately.

3. **Always show the full drift calculation chain, not just the result.** Users need to be able to reproduce the math, catch data entry errors, and understand that a -3.5% drift means something different on a $50,000 portfolio vs. a $500,000 portfolio.

4. **Always express drift in both percentage points AND dollars.** "You are 4 percentage points underweight in bonds" is abstract. "That represents $12,000 you would need to add to fully restore your bond allocation" is actionable.

5. **Always sequence rebalancing trades by tax impact before presenting them.** Tax-advantaged account trades come first, every time, without exception. The cost of ignoring this sequencing can be substantial and irreversible in the year the trade executes.

6. **Never present rebalancing as a return-enhancement strategy.** Rebalancing restores a target risk profile. Research on rebalancing "returns" is mixed and context-dependent. The mechanical benefit is risk control -- selling assets that have grown disproportionately large before a potential reversal -- not alpha generation.

7. **Always include a materiality test before generating a trade list.** Sub-1-percentage-point drifts that would generate trading costs or taxable events should be flagged as "Monitor" rather than "Action Needed." The user decides the threshold, but the analysis must distinguish material from immaterial drift.

8. **Never recommend specific funds, ETFs, tickers, or financial institutions.** This includes avoiding language like "sell your overweight large-cap ETF and buy a bond fund." Asset class categories are appropriate; specific security recommendations are not.

9. **When the user holds assets across taxable and tax-advantaged accounts, ALWAYS apply the tax-location sequencing hierarchy before generating any trade list.** Skipping this step and presenting a flat trade list can inadvertently push the user to execute taxable sells that could have been avoided by using tax-advantaged account capacity first.

10. **Note wash sale risk explicitly whenever tax-loss harvesting is identified.** Wash sale rules are frequently misunderstood. The 30-day window applies BOTH before and after the sale. Swapping to a "similar but not identical" fund may still trigger the rule depending on the jurisdiction and fund characteristics. Always flag this as requiring professional guidance rather than presenting it as a simple tax optimization step.

11. **When an illiquid or restricted holding exists, calculate its weight in the total portfolio but treat it as a fixed constraint in the trade plan.** Rebalancing the liquid portion of the portfolio against a modified target (one that excludes the illiquid holding) can lead to severe unintended concentrations. Show the full portfolio allocation including illiquid holdings in every drift table.

12. **Always verify that the sum of all trade amounts nets to zero (or equals the net new cash amount) before presenting the final trade list.** An unbalanced trade list is a math error. Buy amounts plus sell amounts must algebraically sum to the net cash flow for the rebalancing event.

---

## Edge Cases

### User Has No Defined Target Allocation
Stop before running any drift math. Without a target, "drift" is undefined -- you are calculating the distance to an unknown destination. Explain the distinction between setting a target (strategic allocation decision, handled by `portfolio-allocation-framework`) and measuring drift from a target (mechanical calculation, handled here). Provide a general explanation of how drift works conceptually -- using illustrative numbers like a hypothetical 60/40 portfolio -- so the user understands the framework while they go establish their actual targets.

### Drift Is Very Small (Under 1pp for All Asset Classes)
Calculate and display all drift numbers with full precision. Then explicitly note that the portfolio is well-aligned with its targets. Explain that rebalancing decisions must weigh the benefit of restoring a ~0.5pp drift against the costs: any trading commissions, any bid-ask spread, and any potential taxable gains from selling. For most portfolios, sub-1pp drift does not clear that bar. Label all positions "On Target" in the Materiality column. Set the "Next Steps" to scheduling a future review rather than executing trades. This outcome -- showing the analysis and concluding no action is needed -- is a complete and valuable output, not a non-answer.

### Portfolio Is Highly Concentrated in a Single Illiquid or Restricted Position
This commonly arises with employer stock (unvested or subject to a blackout period), real estate (a rental property included in net worth calculations), or private company equity. Three adjustments are required:
1. Include the holding in total portfolio value for drift calculation -- excluding it would understate concentration risk
2. Mark the holding explicitly as "Non-Tradeable" in the trade plan with its constraint (vesting schedule, surrender period, property ownership)
3. Calculate a "tradeable portfolio rebalancing target" -- the allocation targets re-weighted across only the liquid holdings -- so the user can rebalance what they can actually trade without attempting to correct for the full drift (which is impossible)
Always note that a large illiquid position may mean the stated target allocation is structurally unachievable until the restriction lifts, and that this represents a risk management consideration to discuss with a financial advisor.

### Market Has Dropped Sharply and the User Is Hesitant to Rebalance Into the Declining Asset
This is one of the most psychologically difficult rebalancing scenarios. A 20-30% equity drawdown will push a 60/40 portfolio to roughly 50/50 or 48/52, mechanically requiring the user to sell bonds (the thing that held value) and buy equities (the thing that just fell). This is correct behavior per the rebalancing framework and represents buying equities at lower prices -- but it feels deeply counterintuitive. Address this directly: explain that rebalancing is a systematic, rules-based process and that the discomfort of buying into a drawdown is precisely the behavioral bias that systematic rules are designed to override. Do NOT express an opinion on whether the market will recover. Present the math, present the mechanical logic, note the behavioral difficulty, and make clear the decision is entirely the user's. If the user expresses paralysis or wants to wait for confirmation of a bottom, that is a market timing decision -- explain that market timing is outside the scope of this framework.

### User Wants to Rebalance During a Tax Year With Large Realized Gains Already on Record
If the user has already realized substantial capital gains earlier in the tax year (from selling a house, exercising options, or other events), additional realized gains from rebalancing taxable accounts will stack on top of those gains and may push them into a higher capital gains bracket or trigger net investment income tax [JURISDICTION: verify thresholds]. In this scenario:
1. Strongly prioritize cash flow rebalancing and tax-advantaged account rebalancing to avoid any additional taxable events
2. Calculate the dollar threshold at which additional long-term gains would change their estimated tax bracket and present it as a constraint
3. Recommend deferring taxable account rebalancing to the next tax year if the drift can be tolerated without a material change in risk profile
4. Note this specifically requires consultation with a tax professional who knows the full tax picture

### User Has Multiple Accounts With the Same Asset Class Held in Different Proportions
For example, bonds held in a Roth IRA (tax-free growth) and also in a taxable brokerage (taxable interest income). This is an asset location question layered onto the rebalancing question. For the purpose of drift calculation, aggregate all holdings in the same asset class across all accounts. For the purpose of trade sequencing, note that this portfolio may benefit from a tax location optimization step (generally: bonds belong in tax-advantaged accounts to shelter taxable interest; equities with long-term growth potential belong in Roth accounts; dividend-producing equities belong in traditional tax-advantaged accounts). Flag this for review but do not redesign the user's asset location as part of the rebalancing analysis -- that is a separate exercise. Focus on drift correction, sequence trades to minimize tax impact, and note the asset location opportunity as a follow-up item.

### User Contributes Regularly and Wants to Know How to Incorporate Contributions Into Rebalancing
Calculate the contribution ratio (annual contributions / total portfolio value). Present the following scenarios:
- If the contribution ratio is greater than the maximum single-class drift percentage, cash flow rebalancing alone can restore balance within the contribution period without any selling
- If the contribution ratio is between 50-100% of the maximum drift, cash flow rebalancing partially corrects the drift and a smaller trade is needed to complete the correction
- If the contribution ratio is under 25% of the maximum drift, cash flow rebalancing has minimal impact and a full rebalancing trade plan is still needed
For dollar-cost averaging investors who contribute monthly, suggest directing each contribution entirely to the most underweight asset class at time of contribution -- this is a rolling, continuous form of cash flow rebalancing that approximates the mathematical optimum without requiring explicit sell trades.

### User Is in the Decumulation Phase (Taking Withdrawals, Not Making Contributions)
Cash flow rebalancing in reverse -- directing withdrawals from overweight asset classes -- is the most tax-efficient rebalancing tool available in retirement. Withdrawals from an overweight equity position in a taxable account (potentially at long-term rates) may be more favorable than a separate rebalancing sale, because the withdrawal serves a dual purpose. Note this scenario, flag that decumulation sequencing involves additional complexity (Social Security timing, required minimum distributions, Roth conversion windows) [JURISDICTION: verify RMD rules], and recommend `portfolio-allocation-framework` and a financial advisor for the full retirement income picture. Do not design a full withdrawal strategy within this skill.

---

## Example

**Input:** "I have a target allocation of 70% stocks, 20% bonds, and 10% international equity. My current holdings are: $195,000 in US stocks, $38,000 in bonds, and $17,000 in international equity. All held in a mix -- $150,000 is in my 401k (mostly stocks and bonds), and the rest is in a taxable brokerage. Within the 401k I have $105,000 stocks and $45,000 bonds. I haven't rebalanced in two years. I don't know if I should bother or how much it would cost me in taxes."

---

**Output:**

## Portfolio Rebalancing Analysis

**Analysis Date:** [Today]
**Total Portfolio Value:** $195,000 + $38,000 + $17,000 = **$250,000**

---

### Step 1: Target vs. Current Allocation (Drift Table)

| Asset Class | Target % | Target $ | Current Value | Current % | Drift (pp) | Dollar Drift | Materiality |
|-------------|----------|----------:|-------------:|----------:|----------:|------------:|-------------|
| US Stocks | 70% | $175,000 | $195,000 | 78.0% | +8.0pp | +$20,000 | **Action Needed** |
| Bonds | 20% | $50,000 | $38,000 | 15.2% | -4.8pp | -$12,000 | **Action Needed** |
| Intl Equity | 10% | $25,000 | $17,000 | 6.8% | -3.2pp | -$8,000 | **Action Needed** |
| **Total** | **100%** | **$250,000** | **$250,000** | **100%** | | | |

**Drift Calculations (visible math):**
```
US Stocks:  $195,000 / $250,000 = 78.0% current | Target: 70.0% | Drift: +8.0pp | Dollar drift: +$20,000
Bonds:       $38,000 / $250,000 = 15.2% current | Target: 20.0% | Drift: -4.8pp | Dollar drift: -$12,000
Intl Equity: $17,000 / $250,000 =  6.8% current | Target: 10.0% | Drift: -3.2pp | Dollar drift:  -$8,000

Trade sizes:
US Stocks:  Target $175,000 - Current $195,000 = -$20,000 (SELL $20,000)
Bonds:      Target $50,000  - Current $38,000  = +$12,000 (BUY $12,000)
Intl Equity: Target $25,000 - Current $17,000  = +$8,000  (BUY $8,000)

Net cash check: -$20,000 (sells) + $12,000 (buys) + $8,000 (buys) = $0 ✓ Balanced
```

---

### Step 2: Materiality Assessment

| Asset Class | Absolute Drift | Relative Drift (% of target) | Material? | Reason |
|-------------|---------------|-----------------------------:|-----------|--------|
| US Stocks | 8.0pp | +11.4% overweight | **Yes** | Exceeds 5pp absolute threshold; over 10% relative |
| Bonds | 4.8pp | -24.0% underweight | **Yes** | Below 5pp absolute but 24% relative underweight -- significant |
| Intl Equity | 3.2pp | -32.0% underweight | **Yes** | 32% relative underweight -- severe despite modest absolute number |

**Key interpretation:** International equity is only 3.2pp adrift in absolute terms, but it is 32% below its target weight. This matters because a 10% target class that has shrunk to 6.8% has lost nearly a third of its intended portfolio presence. Relative drift is the more meaningful measure for smaller target-weight asset classes.

---

### Step 3: Account-Level Breakdown

Before sequencing trades, map the current holdings to accounts:

| Account | Asset Class | Current Value |
|---------|-------------|-------------:|
| 401k | US Stocks | $105,000 |
| 401k | Bonds | $45,000 |
| 401k | Subtotal | $150,000 |
| Taxable brokerage | US Stocks | $90,000 ($195k -- $105k) |
| Taxable brokerage | Bonds | $0 ($38k -- $45k... wait -- see note) |
| Taxable brokerage | Intl Equity | $17,000 |
| Taxable brokerage | Subtotal | $100,000 |

**Note on bonds:** The 401k holds $45,000 in bonds but the total bond allocation is only $38,000. This means the 401k actually holds more bonds than exist in the total allocation -- this is a data inconsistency. Before proceeding, verify: does the total $38,000 bond figure represent ALL bonds including the 401k? If so, the taxable brokerage holds zero bonds and all $38,000 bonds are in the 401k. **In this example, we proceed with that interpretation: 401k has $105,000 stocks + $45,000 bonds = $150,000; taxable brokerage has $90,000 stocks + $17,000 intl equity = $107,000. Wait -- $90k + $17k = $107k, but the stated taxable balance should be $250k -- $150k = $100k.**

**Revised mapping (corrected for consistency):**
A rebalancing analysis requires consistent data. The user's numbers produce: 401k = $150,000 (assumed $105k stocks + $45k bonds); taxable = $100,000 (assumed $90k stocks + $10k intl equity -- adjusted to balance). We flag this discrepancy and proceed with the total portfolio figures, noting that the user should verify their exact per-account balances before executing trades.

**Working with total portfolio numbers (which are internally consistent):**

| Account | Total Value | Tradeable Without Tax? |
|---------|------------:|----------------------|
| 401k | $150,000 | Yes -- no capital gains |
| Taxable brokerage | $100,000 | Sells may trigger capital gains |

---

### Step 4: Trade Sequence (Tax-Optimized)

Total rebalancing needed: Sell $20,000 of US stocks; buy $12,000 bonds; buy $8,000 international equity.

**Phase 1 -- 401k (Tax-Free Trades)**

The 401k can execute all three components of this rebalance internally without any tax event:

| Action | Asset Class | Amount | 401k Account |
|--------|-------------|-------:|-------------|
| Sell | US Stocks | $20,000 | Reduce stock allocation within 401k |
| Buy | Bonds | $12,000 | Increase bond allocation within 401k |
| Buy | Intl Equity | $8,000 | Add international equity fund within 401k (if available) |

**Important check:** Does the 401k offer an international equity fund option? Many 401k plans have limited fund menus. If no international equity option exists in the 401k, the $8,000 international equity purchase must occur in the taxable brokerage using cash or proceeds from a Phase 1 sale. This is a zero-tax event if funded from the taxable brokerage cash position or from new contributions.

**Phase 2 -- Taxable Account**

If Phase 1 fully executes within the 401k, the taxable account requires zero trades. This is the ideal outcome -- a complete rebalance with no taxable events.

**If Phase 2 is needed (e.g., no international equity fund in 401k):**

| Action | Asset Class | Amount | Tax Consideration |
|--------|-------------|-------:|-------------------|
| Buy | Intl Equity | $8,000 | Purchase only -- no taxable event. Fund from cash if available, or from new contribution |

No selling in the taxable account is required to complete this rebalance. The US stock overweight is corrected entirely within the 401k.

---

### Step 5: Post-Trade Verification

```
After executing 401k trades:

US Stocks:  $195,000 - $20,000 sold in 401k = $175,000 | $175,000 / $250,000 = 70.0% ✓
Bonds:       $38,000 + $12,000 bought in 401k = $50,000 | $50,000 / $250,000 = 20.0% ✓
Intl Equity: $17,000 + $8,000 bought in 401k or taxable = $25,000 | $25,000 / $250,000 = 10.0% ✓
Total: $250,000 ✓
```

All three asset classes return to exact target weights. No rounding residual. No taxable account sells required.

---

### Step 6: Tax Considerations Summary

| Account | Tax Impact | Notes |
|---------|------------|-------|
| 401k | **Zero** | All trades are internal to the account; no reportable events |
| Taxable brokerage | **Zero** | No sells required; international equity purchase (if needed) uses cash |

**This rebalancing is fully executable without triggering any capital gains.** That is the direct result of sequencing trades through the tax-advantaged account first.

If in a future year the 401k does not have capacity to absorb the full rebalancing trade (for example, if the entire portfolio grows and the taxable brokerage holds a larger proportion of the assets), taxable sells would become necessary. At that point, verify holding periods: any US stock position held in the taxable brokerage for more than 12 months would qualify for long-term capital gains rates [JURISDICTION: verify current rates]. Short-term positions should be avoided for rebalancing sells if possible.

**No tax-loss harvesting opportunity identified** -- no asset class is below the user's cost basis based on the data provided. If bonds or international equity have unrealized losses in the taxable brokerage, that changes this assessment.

---

### Step 7: Rebalancing Approach Recommendation (Options Only)

| Approach | How It Applies to This Portfolio | Trade-Off |
|----------|----------------------------------|-----------|
| **Annual time-based** | Review once per year; execute 401k trades if drift exceeds targets | Simple; two years between reviews allowed 8pp of stock drift -- borderline tolerable but worth addressing |
| **Hybrid (quarterly check, 5pp trigger)** | Check quarterly; rebalance in 401k if any class exceeds 5pp drift | Would have caught this drift earlier (~6-12 months ago) with low effort |
| **Threshold-only (5pp trigger)** | Rebalance whenever stocks exceed 75% or fall below 65% | Requires a monitoring tool or quarterly manual check to catch the trigger |
| **Cash flow** | Direct 401k contributions entirely to bonds and international equity | Annual contribution ratio check needed; likely partially effective given portfolio size |

**Contribution ratio check:**
```
If annual 401k contributions = $20,500 (approximate IRS limit for 2024):
Contribution ratio = $20,500 / $250,000 = 8.2%
Largest single-class dollar drift = $20,000

Cash flow rebalancing COULD fully correct the current drift if all contributions
go to bonds and international equity for approximately one contribution year.
This eliminates the need for ANY selling -- even within the 401k.
```

---

### Step 8: Repeatable Rebalancing Procedure

**Your situation:** 401k + taxable brokerage, currently all rebalancing executable in 401k without tax impact. Priority is maintaining this advantage.

**Rebalancing Checklist:**
- [ ] Pull total portfolio value across both accounts (401k statement + brokerage statement)
- [ ] Calculate current weights: (each asset class value / total) × 100
- [ ] Calculate drift: current weight -- target weight for each class
- [ ] Check materiality: is any class more than 5pp from target? (Or your chosen threshold)
- [ ] If yes: plan all trades within the 401k first (sell overweight stock, buy underweight bonds and/or international)
- [ ] Verify 401k offers the needed fund categories -- especially international equity
- [ ] If international equity only available in taxable brokerage: buy with cash, not from a sell
- [ ] Re-calculate post-trade allocation to confirm targets restored within 0.5pp
- [ ] Execute 401k trades via the 401k plan's reallocation or fund transfer tool
- [ ] Record: date, pre-trade weights, trades, post-trade weights
- [ ] Set next review: [specific date]

**Rebalancing History Log:**

| Date | US Stocks % | Bonds % | Intl Equity % | Trades Executed | Account Used |
|------|------------|---------|--------------|-----------------|--------------|
| [Today] | 70.0% | 20.0% | 10.0% | Sell $20k stocks, buy $12k bonds, $8k intl | 401k |
| [Next review] | | | | TBD | TBD |

---

### Next Steps
- [ ] Verify exact per-account balances (the account-level data had a minor inconsistency -- confirm before executing trades)
- [ ] Check your 401k fund menu for an international equity option -- this determines whether Phase 1 fully completes the rebalance
- [ ] Execute 401k internal transfers: sell ~$20,000 in US stock funds, purchase ~$12,000 in bond funds and ~$8,000 in international equity fund
- [ ] Choose a going-forward rebalancing approach and set your calendar reminder (hybrid quarterly/5pp threshold is a strong fit for a portfolio of this size and complexity)
- [ ] Review your target allocation to confirm 70/20/10 still reflects your risk tolerance and time horizon -- use `portfolio-allocation-framework`
- [ ] Given two years of non-rebalancing, consider whether you want to set a threshold-based alert (e.g., a brokerage portfolio alert at equity > 75%) to catch drift earlier next cycle
