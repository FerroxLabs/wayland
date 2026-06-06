---
name: portfolio-allocation-framework
description: |
  Explains asset allocation concepts including equities, bonds, cash, and real
  assets. Describes common allocation philosophies and helps the user apply a
  decision framework to their own risk profile and time horizon. Produces a
  structured analysis the user can use when building their portfolio.
  Use when the user asks about asset allocation, how to diversify investments,
  or how to build a portfolio based on their risk tolerance.
  Do NOT use for choosing specific investment products or funds, assessing risk
  tolerance (use risk-tolerance-assessment), or understanding account types
  (use investment-account-types). Never prescribes specific allocation percentages.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "investing personal-finance analysis retirement-planning"
  category: "personal-finance"
  subcategory: "investing"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---
# Portfolio Allocation Framework

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly -- including tax situation, income stability, existing assets, liabilities, insurance coverage, and estate planning considerations -- that cannot be fully captured through a structured framework. The information provided should not be relied upon as a substitute for personalized professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

---

## When to Use

**Use this skill when:**

- The user has completed a risk tolerance assessment and wants to translate that result into a portfolio allocation framework
- The user asks how to diversify their investments across asset classes and wants a structured way to think about the tradeoffs
- The user has a specific time horizon and goal (retirement, education, major purchase) and wants to understand what allocation philosophy fits their situation
- The user wants to understand why different asset classes behave differently across economic cycles -- growth, contraction, inflation, deflation -- and how those differences create diversification benefits
- The user is reviewing an existing portfolio and wants a conceptual framework for evaluating whether the current mix is appropriate for their profile
- The user asks about a named allocation philosophy (60/40, lifecycle, risk parity, core-satellite, bucket strategy, permanent portfolio) and wants to understand how it works and when it is appropriate
- The user is preparing for a conversation with a financial advisor and wants to arrive with clear thinking about their allocation preferences

**Do NOT use this skill when:**

- The user wants to select specific funds, ETFs, stocks, or bonds -- use a product-selection skill if available; this skill stops at the asset class and sub-class level
- The user has not yet assessed their risk tolerance and has not stated a profile -- redirect to `risk-tolerance-assessment` first; allocation ranges are meaningless without a risk input
- The user wants to understand which account types to hold assets in (taxable, IRA, 401k, Roth, HSA) for tax efficiency -- use `investment-account-types` and `tax-location-strategy` skills; asset location is a separate decision from asset allocation
- The user wants to know how much to save to meet a retirement number -- use `retirement-savings-calculator`; this skill does not address savings rate, only how to deploy what is saved
- The user asks about insurance products used for investment purposes (annuities, whole life cash value) -- these require a separate product analysis; the allocation framework does not directly apply
- The user wants to evaluate whether their overall financial plan is on track -- this skill is scoped to portfolio allocation, not comprehensive financial planning

---

## Process

### Step 1: Gather and Confirm the User's Decision Inputs

Before presenting any allocation analysis, establish the four core inputs that drive all allocation decisions. Missing inputs produce meaningless output -- do not skip this step.

- **Risk tolerance profile:** Obtain this from their completed risk assessment (conservative, moderately conservative, moderate, moderately aggressive, aggressive). If they only have a vague self-description ("I'm okay with some risk"), press for the assessment score or a more precise characterization. Risk tolerance has two components that often diverge: *willingness* to take risk (emotional comfort with volatility) and *capacity* to take risk (financial ability to absorb losses without derailing the goal). Note both when available.
- **Time horizon:** Establish years until the money is needed, not just the nominal goal. A 45-year-old saving for retirement at 65 has a 20-year accumulation horizon but may also have a 25-to-30-year spending horizon after that -- this distinction matters for how aggressively they should invest. For multi-goal situations, separate horizons for each goal.
- **Primary goal and its flexibility:** Retirement, education, down payment, and emergency funds have fundamentally different flexibility characteristics. A college tuition payment due in 4 years is inflexible -- the money must be there. A retirement that can be delayed by 2-3 years if needed is flexible -- this flexibility increases risk capacity.
- **Supporting financial context:** Gather what you can about income stability (stable salaried vs. variable/commission-based vs. self-employed), emergency fund status (3-6 months expenses in cash outside this portfolio), existing assets and debts (pension, Social Security, real estate equity, high-interest debt), and other income sources in retirement (pension, rental, part-time work). These factors directly adjust the appropriate position within any allocation range.

### Step 2: Explain the Major Asset Classes with Real Behavioral Context

Do not just describe asset classes in generic terms. Explain how each one behaves across economic environments so the user understands *why* combining them reduces risk.

**Equities (Stocks) -- Growth Engine:**
- Represent fractional ownership in businesses; returns come from earnings growth and dividend income
- Historically the highest long-term returning major asset class in developed markets, but with the highest short-term volatility. Broad market drawdowns of 20% or more occur roughly every 5-10 years; drawdowns of 40-50% have occurred during severe recessions and financial crises
- Perform best during economic expansion and early recovery; underperform during recessions and financial stress
- Key sub-dimensions for diversification: domestic vs. international (further divided into developed international and emerging markets), large-cap vs. small-cap, growth vs. value, sector concentration
- Correlation note: domestic large-cap equities and international developed equities have become more correlated over recent decades as global capital markets integrated; emerging markets equities retain somewhat lower correlation but with higher idiosyncratic risk
- Key risks: market risk (the whole market falls), specific-issuer risk (a single company collapses), currency risk for international holdings, political and regulatory risk for emerging markets

**Fixed Income (Bonds) -- Stability and Income Engine:**
- Represent a loan from the investor to a government or corporation; returns come from interest payments (coupon) and price changes driven by interest rate movements
- Duration is the most critical technical concept: longer-duration bonds are more sensitive to interest rate changes. A bond with a duration of 10 years loses approximately 10% of its price for every 1% rise in interest rates -- this is not a minor risk during rising-rate environments
- Sub-dimensions: government (sovereign) vs. corporate vs. municipal; investment-grade vs. high-yield (junk); short (0-3 year duration), intermediate (3-10 year), and long (10+ year); inflation-linked (like TIPS) vs. nominal
- Government bonds of high credit quality (developed market sovereigns) are the primary safe-haven during equity market stress -- they often rise in price when stocks fall, providing true diversification
- Corporate bonds, especially high-yield, behave more like equities during stress -- their correlation with stocks increases precisely when you need diversification most
- Municipal bonds are primarily interesting for investors in high marginal tax brackets because of their federal (and often state) tax exemption; their after-tax yield advantage disappears for investors in lower brackets
- Key risks: interest rate risk (rising rates hurt bond prices), credit/default risk (the issuer cannot repay), reinvestment risk (maturing bonds must be reinvested at prevailing -- potentially lower -- rates), inflation risk (fixed nominal payments lose real value)

**Cash and Cash Equivalents -- Liquidity and Safety Reserve:**
- Includes savings accounts, money market funds, short-duration Treasury instruments (T-bills), and certificates of deposit
- Primary role: maintain purchasing power over short periods and provide liquidity for near-term spending needs or opportunistic rebalancing
- Real return over long periods is typically near zero or slightly negative after inflation, which is the direct cost of holding cash in a long-horizon portfolio
- Short-term Treasury bills and high-yield savings accounts are distinct from "cash under the mattress" -- they earn yields competitive with short-term rates and carry minimal credit risk
- Appropriate holding level: for a long-term investment portfolio specifically (separate from an emergency fund), 2-10% is typical. More than 10-15% in cash within a long-term portfolio is typically a drag on long-run outcomes unless it represents a specific tactical or bucket-strategy allocation

**Real Assets -- Inflation Protection and Diversification:**
- Encompasses real estate investment trusts (REITs), commodity-linked instruments, infrastructure, and inflation-linked bonds (TIPS)
- Their defining characteristic is some degree of linkage to real economic activity and price levels -- they tend to hold or increase their real (inflation-adjusted) value when inflation rises, while nominal bonds suffer
- REITs provide real estate exposure with stock-like liquidity; they behave partially like equities (they correlate with equity markets during financial stress) and partially like bonds (they are sensitive to interest rates due to leverage)
- Commodities (energy, metals, agriculture) are highly cyclical and volatile but have historically had low or negative correlation with both stocks and bonds during some periods, particularly during supply-shock inflation
- TIPS (Treasury Inflation-Protected Securities) adjust their principal with CPI; they provide nearly pure inflation protection with government credit quality but still carry interest rate duration risk on the real yield component
- Key risks: REITs are sensitive to both equity market sentiment and interest rates; commodity prices are notoriously volatile; infrastructure and private real estate lack liquidity and require professional-level due diligence

### Step 3: Present the Major Allocation Philosophies with Their Real Mechanics

Each philosophy should be presented as a coherent intellectual framework with real mechanics, not a slogan. The user should understand what problem each philosophy was designed to solve.

**The Age-Based / Lifecycle Approach:**
- Core logic: as you age, your human capital (the present value of future wages) shrinks and your financial capital grows; your portfolio should gradually shift from risky (equity-like) to conservative (bond-like) to reflect this transition
- The old "100 minus your age in equities" rule is outdated -- longer life expectancies and lower bond yields have pushed many practitioners toward "110 minus age" or "120 minus age" as starting points
- The glide path concept: this is the schedule by which the equity allocation declines over time. Target-date fund structures are the institutionalized version of a lifecycle glide path
- Limitation: this is a one-dimensional model that ignores income stability, wealth relative to spending needs, risk tolerance, and other financial resources. A 55-year-old with a government pension covering 90% of living expenses has far more capacity for equity risk than a 55-year-old depending entirely on their portfolio

**The Risk-Profile-Based Approach:**
- Core logic: allocation should match the investor's assessed risk tolerance rather than an automatic age formula
- Standard mapping used across the advisory industry (ranges, not prescriptions):
  - Conservative: typically 20-40% equities, 50-70% fixed income, remainder in cash and real assets
  - Moderately conservative: typically 35-55% equities, 35-55% fixed income, remainder in other
  - Moderate: typically 50-70% equities, 20-40% fixed income, remainder in other
  - Moderately aggressive: typically 65-80% equities, 10-25% fixed income, remainder in other
  - Aggressive: typically 75-95% equities, 0-15% fixed income, minimal cash
- Critical caveat: risk tolerance assessments measure *stated* willingness to take risk in normal conditions. Behavioral research consistently shows investors overestimate their tolerance before experiencing real losses. The 2008-2009 financial crisis saw widespread panic selling by investors who had stated moderate-to-aggressive profiles. Always build in a margin of conservatism

**The Goal-Based / Bucket Approach:**
- Core logic: a single investor typically has multiple goals with different timelines; pooling everything into one allocation forces unnecessary compromises
- Bucket structure: divide the portfolio into time-segmented buckets
  - Bucket 1 (0-2 years of expenses): cash equivalents and short-term bonds -- this money should not be invested in equities because a 40% drawdown in the wrong year could force selling at the worst time
  - Bucket 2 (3-10 years): intermediate fixed income and some conservative equity exposure
  - Bucket 3 (10+ years): predominantly equities and real assets oriented toward growth
- The bucket approach is particularly well-suited for the retirement *spending* phase because it addresses sequence-of-returns risk -- the danger that early retirement losses are especially damaging because you are drawing down the portfolio before it can recover
- Limitation: in practice, the buckets must be refilled over time using a disciplined rule set; without explicit rebalancing rules, the approach can drift into ad hoc decision-making

**The Core-Satellite Approach:**
- Core logic: separate the portfolio into a broadly diversified, low-cost core (designed to capture market-level returns efficiently) and a smaller satellite component (tilted toward specific factors, sectors, or strategies)
- The core typically represents 60-80% of the total portfolio and is built with maximum diversification and minimum cost
- Satellite positions might include a tilt toward small-cap value (which has historically carried a return premium attributed to additional risk), international exposure, sector concentration, or alternative strategies
- The factor-tilt rationale: academic research (Fama-French and subsequent work) identifies size (small-cap), value, profitability, and momentum as factors with documented historical return premiums above the broad market. These premiums are theorized to reflect either risk compensation or systematic behavioral biases
- Limitation: satellites increase complexity, require monitoring, and can underperform for extended periods (value was a losing factor for a decade in the 2010s); this approach requires more investment knowledge to implement and evaluate than a pure indexed core strategy

**The Permanent Portfolio / All-Weather Approach:**
- Core logic: build a portfolio that performs adequately across all economic environments rather than optimizing for any single environment
- The classic Permanent Portfolio framework uses a four-quadrant design: equities (prosperity), long-term government bonds (deflation/recession), gold (inflation), and cash (depression/uncertainty) -- typically in roughly equal proportions
- Ray Dalio's All-Weather variant uses risk parity: rather than equal dollar weights, it weights asset classes by their contribution to portfolio risk (volatility), which typically results in much heavier fixed income weighting in dollar terms to offset equities' much higher volatility
- Who it suits: investors who deeply distrust their ability to predict economic environments and want a single allocation that can be maintained through any regime without tactical changes
- Limitation: the equal-risk approach requires leverage to boost returns on low-volatility assets; in periods of rising rates, the large bond allocation is a significant drag; historical back-tests often look better than live performance due to curve-fitting

### Step 4: Build the Allocation Range Analysis for the User's Specific Profile

Once you have the user's inputs and have explained the philosophies, produce a concrete allocation range analysis:
- Create a table showing what each philosophy suggests for their specific profile combination (time horizon + risk tolerance)
- Identify the overlap or consensus zone across philosophies -- the range where multiple frameworks converge is typically the most defensible starting point
- Identify where the philosophies diverge and explain why (e.g., goal-based might suggest more equity than age-based because the long horizon provides recovery time)
- Identify the specific factors in their situation that should push them toward the more conservative vs. more aggressive end of the consensus range
- Explicitly flag what information you do NOT have that could change the analysis

### Step 5: Explain Within-Asset-Class Diversification

Most users think of diversification as "stocks and bonds" and miss the equally important diversification within each class.

**Within equities:**
- Geographic diversification: domestic markets and international developed markets are less than perfectly correlated; emerging markets add further diversification with higher volatility
- Market-cap diversification: large-cap stocks dominate indices by market weight but small- and mid-cap companies have historically carried size premiums; a pure market-cap-weighted approach is heavily concentrated in the largest companies
- Style diversification: growth and value tend to take turns leading; a blend reduces the drag of being entirely in the wrong style at the wrong time
- Sector diversification: if a single sector represents more than 20-25% of an equity allocation, that is a concentration risk. Technology's weight in broad U.S. indices has reached 30%+ at times, making even "diversified" index investors heavily exposed to a single sector

**Within fixed income:**
- Duration laddering: spreading maturities across short, intermediate, and long-term bonds reduces both interest rate risk and reinvestment risk; no single maturity point dominates
- Credit quality diversification: investment-grade and high-yield bonds do not behave the same; keeping the core in investment-grade (BBB/Baa and above) with limited high-yield satellite exposure is a common approach
- Geographic diversification: non-U.S. government bonds can provide additional diversification, though currency exposure is a complicating factor

**Correlation -- the quantitative foundation of diversification:**
- Diversification works because assets that do not move in perfect lockstep reduce portfolio-level volatility below the weighted average of individual asset volatilities
- Perfect positive correlation (correlation = +1.0) provides no diversification benefit -- adding an asset with this profile just adds more of the same risk
- Zero correlation reduces portfolio volatility; negative correlation (assets that tend to rise when others fall) provides the most powerful diversification
- High-quality government bonds have historically had negative or near-zero correlation with equities, explaining their central role in diversified portfolios
- During severe market stress (2008, March 2020 initial shock), correlations among risk assets spike toward 1.0 -- this is called correlation breakdown and is the period when diversification is most needed and often least available. Only truly uncorrelated assets (high-quality government bonds, cash) reliably hold their diversification value during stress

**Diminishing returns of diversification:**
- Owning 20-30 individual securities in a single asset class captures most of the diversification benefit available within that class
- Beyond 50-100 individual holdings, the marginal benefit becomes negligible and monitoring costs increase
- For most individual investors, broad-market exposure across asset classes through highly diversified instruments is more practical than holding hundreds of individual securities

### Step 6: Address Rebalancing as Part of the Framework

An allocation is not a static decision -- it drifts over time as assets grow at different rates. Briefly explain the mechanics so the user understands the framework is a living commitment, not a one-time choice.

- Drift is natural and inevitable: a portfolio with more equities than bonds will see its equity weight grow faster during bull markets, increasing risk beyond the target level
- Calendar vs. threshold rebalancing: calendar rebalancing (quarterly, annually) is simpler; threshold rebalancing (trigger when any asset class drifts more than 5 percentage points from target) is more precise but requires more monitoring
- Tax implications of rebalancing: selling appreciated positions in taxable accounts generates capital gains; strategies to minimize this include directing new contributions to underweight classes, using dividends for rebalancing, and conducting rebalancing within tax-advantaged accounts when possible -- redirect the user to `rebalancing-framework` for full detail
- Rebalancing frequency research suggests annual or semi-annual rebalancing captures most of the benefit with manageable cost and complexity

### Step 7: Produce the Structured Output and Identify Next Steps

Compile all of the above into the structured output format (see Output Format section) with explicit next steps, unresolved questions, and cross-references to complementary skills.

---

## Output Format

```
## Portfolio Allocation Analysis

> This analysis is a decision-support framework, not a financial recommendation.
> Ranges reflect what major allocation philosophies suggest for your profile.
> Specific allocations require professional guidance and fuller financial picture.

---

### Your Profile Summary

| Input | Your Information |
|-------|-----------------|
| Risk tolerance | [Conservative / Moderately Conservative / Moderate / Moderately Aggressive / Aggressive] |
| Willingness vs. capacity split | [If known: e.g., "Willingness: Moderate / Capacity: Moderately Aggressive"] |
| Time horizon -- accumulation | [X years] |
| Time horizon -- spending phase | [X years, if applicable] |
| Primary goal | [Retirement / Education / Major purchase / General wealth] |
| Goal flexibility | [Flexible -- can delay / Inflexible -- hard deadline] |
| Income stability | [Confirmed stable / Variable / Unknown] |
| Emergency fund outside this portfolio | [Yes -- adequately funded / No / Unknown] |
| Other retirement income sources | [Pension / Social Security / None known / Unknown] |

---

### Asset Class Behavioral Summary

| Asset Class | Economic Environment It Favors | Correlation with Equities | Primary Role in Portfolio |
|-------------|-------------------------------|--------------------------|--------------------------|
| Domestic Equities | Expansion, early recovery | Reference asset | Long-term growth |
| International Developed Equities | Expansion (global) | Moderate-high | Geographic diversification |
| Emerging Market Equities | Global growth, commodity cycles | Moderate | Higher-growth diversification |
| Investment-Grade Bonds | Recession, deflation | Low to negative | Stability, stress diversifier |
| High-Yield Bonds | Expansion, credit recovery | Moderate to high | Income with equity-like risk |
| TIPS / Inflation-Linked | Inflationary periods | Low to moderate | Inflation protection |
| REITs | Growth, moderate inflation | Moderate (rises in stress) | Real estate exposure, income |
| Commodities | Supply shocks, inflation | Low to negative (varies) | Inflation hedge |
| Cash Equivalents | All environments | Near zero | Liquidity, dry powder |

---

### Allocation Ranges by Philosophy for Your Profile

| Philosophy | Equities (Total) | Fixed Income (Total) | Real Assets | Cash | Notes |
|------------|-----------------|---------------------|-------------|------|-------|
| Age-based / Lifecycle | [X-Y]% | [X-Y]% | [X-Y]% | [X-Y]% | Based on [age] minus equity formula, adjusted |
| Risk-profile-based | [X-Y]% | [X-Y]% | [X-Y]% | [X-Y]% | Standard mapping for [risk profile] |
| Goal-based ([X]-year horizon) | [X-Y]% | [X-Y]% | [X-Y]% | [X-Y]% | Long-horizon bucket weighted toward growth |
| Core-satellite (if applicable) | [X-Y]% | [X-Y]% | [X-Y]% | [X-Y]% | Core + satellite combined |
| Consensus overlap zone | **[X-Y]%** | **[X-Y]%** | **[X-Y]%** | **[X-Y]%** | Where multiple philosophies agree |

Within-Equities Diversification Breakdown (illustrative ranges for this profile):
| Equity Sub-Class | Illustrative Range |
|------------------|--------------------|
| Domestic large-cap | 40-60% of equity allocation |
| Domestic small/mid-cap | 10-20% of equity allocation |
| International developed | 20-30% of equity allocation |
| Emerging markets | 5-15% of equity allocation |

Within-Fixed Income Diversification Breakdown (illustrative ranges):
| Bond Sub-Class | Illustrative Range |
|---------------|-------------------|
| Short-duration (0-3 yr) | 20-35% of bond allocation |
| Intermediate (3-10 yr) | 40-55% of bond allocation |
| Long-duration (10+ yr) | 10-25% of bond allocation |
| Inflation-linked (TIPS) | 10-25% of bond allocation |

---

### Factors Pushing Toward the More Conservative End

1. **[Factor]:** [Specific explanation for this user's situation]
2. **[Factor]:** [Specific explanation]
3. **[Factor]:** [Specific explanation]

### Factors Pushing Toward the More Aggressive End

1. **[Factor]:** [Specific explanation for this user's situation]
2. **[Factor]:** [Specific explanation]
3. **[Factor]:** [Specific explanation]

### Overall Assessment of Your Position Within the Range

Based on the confirmed factors above, your profile most closely aligns with the [lower / middle / upper] portion of the consensus equity range because [2-3 sentence rationale].

Unresolved factors that could shift this assessment: [list what is unknown]

---

### Key Questions to Resolve Before Finalizing

| Question | Why It Matters | Which Direction It Could Push |
|----------|---------------|-------------------------------|
| [Question about income stability] | Affects capacity for risk | More stable = more equity capacity |
| [Question about other income sources] | Reduces dependency on portfolio | More sources = more equity capacity |
| [Question about debt situation] | High-interest debt may be better priority | Significant debt = reduce investment risk |
| [Question about emergency fund] | Protects portfolio from forced selling | No fund = reduce investment risk |
| [Question about behavioral history] | Stated vs. actual behavior in past downturns | History of panic selling = more conservative |

---

### Rebalancing Framework Reference

- Target ranges established: [equity X-Y%, fixed income X-Y%, real assets X-Y%, cash X-Y%]
- Suggested threshold trigger: rebalance when any class drifts more than 5 percentage points from midpoint of target range
- Suggested calendar review: at minimum annually; semi-annually is preferable
- Tax consideration: prioritize rebalancing within tax-advantaged accounts; use new contributions to rebalance in taxable accounts before selling
- For full rebalancing mechanics: use `rebalancing-framework`

---

### Next Steps (Prioritized)

- [ ] **Immediate:** Confirm the unresolved factors above (income stability, emergency fund, other assets)
- [ ] **Before implementing:** Review current holdings against the consensus range to understand the gap
- [ ] **Before implementing:** Analyze fee structure of potential instruments (use `investment-fee-analyzer`)
- [ ] **Before implementing:** Determine optimal asset location across account types (use `investment-account-types` and `tax-location-strategy`)
- [ ] **Before implementing:** Discuss the analysis with a qualified financial advisor who can account for your full financial picture
- [ ] **After implementing:** Set rebalancing rules using `rebalancing-framework`
- [ ] **Ongoing:** Review allocation every 12-24 months or after major life events (job change, marriage, inheritance, major health event)

---

*Past performance of any asset class does not predict future results. All investing involves risk, including possible loss of principal.*
```

---

## Rules

1. **Never prescribe a single specific allocation percentage.** Always present ranges (e.g., "50-70% equities for a moderate profile with a 20+ year horizon"), and always explain what determines where within the range the user should land. Saying "you should put 65% in equities" crosses the line from education into advice.

2. **Never name specific investment products, funds, ETFs, mutual funds, or ticker symbols.** The allocation framework operates at the asset class and sub-class level. "Broad domestic equity exposure" is correct; naming a specific fund family or index fund is not appropriate in this skill.

3. **Always distinguish between willingness and capacity for risk.** These two components of risk tolerance regularly diverge. A tenured professor with stable income and a pension has high capacity even if they are emotionally risk-averse (low willingness). A commission-based salesperson with variable income has low capacity even if they are emotionally comfortable with volatility. The lower of the two governs the appropriate allocation when they conflict.

4. **Always qualify bond allocation guidance with a duration note.** "Fixed income" is not a homogeneous category. Long-duration government bonds behave very differently from short-duration investment-grade corporate bonds during rising-rate environments. Failure to address duration leads users to underestimate interest rate risk in their bond allocations.

5. **Never treat high-yield bonds as equivalent to investment-grade bonds in the diversification context.** High-yield bond correlations with equities rise substantially during market stress -- the period when diversification is most needed. Acknowledge this explicitly when high-yield is discussed.

6. **Never present historical return data for any asset class as predictive.** If historical context is used (e.g., "equities have historically provided higher long-term returns than bonds"), it must be paired with an explicit statement that past performance does not predict future results and that future environments may differ materially from historical periods.

7. **Always address the spending horizon for users approaching or in retirement.** A 63-year-old planning to retire in 2 years is not a "2-year time horizon" investor -- they have a 2-year accumulation horizon plus a 25-30 year spending horizon. The spending phase requires an allocation that can sustain withdrawals across a multi-decade period, which typically still requires significant equity exposure to prevent outliving the portfolio.

8. **If the user reports being 100% in a single asset class, do not simply recommend diversification.** Present the concentration risk analytically: what does a historical drawdown in that asset class look like in dollar terms for their portfolio size? What is the expected recovery period? Then explain what diversification would change, without prescribing the specific change.

9. **Flag behavioral risk explicitly.** Research in behavioral finance shows that investors who hold a theoretically correct aggressive allocation but panic-sell during downturns achieve worse outcomes than investors with a more conservative allocation they can hold through stress. If there is any indication of behavioral risk (user has sold during past downturns, expresses anxiety about short-term losses), weight willingness over capacity and recommend they consult a professional who can provide behavioral coaching.

10. **Always identify what you do not know.** The output must explicitly list the unresolved factors that could change the analysis. An AI assistant never has complete information about a user's financial situation. Unanswered questions about pensions, debts, emergency funds, upcoming major expenses, or tax situation should be surfaced, not assumed away.

11. **When the user asks "what should my allocation be," do not dodge -- engage the framework.** The correct response is not to refuse to answer. It is to walk through what each philosophy suggests for their specific profile combination, identify the consensus overlap zone, explain the factors that determine where within that range they should land, and clearly flag what a financial professional can help them resolve. This is substantively helpful without constituting personalized financial advice.

12. **Never imply that more sophisticated approaches are better.** Risk parity, factor tilting, and core-satellite frameworks require more expertise to implement and monitor. For most individual investors, a simple, low-cost, broadly diversified portfolio across two to three major asset classes, held consistently and rebalanced annually, is more likely to succeed than a complex strategy that is poorly understood and abandoned during market stress.

---

## Edge Cases

### User Has Not Completed a Risk Tolerance Assessment

Do not assign a risk profile and do not present the allocation range table with specific numbers -- the numbers are meaningless without a risk input. Instead:
- Explain the four decision inputs that drive allocation and why risk tolerance is the non-negotiable starting point
- Present the allocation philosophies conceptually without profile-specific ranges
- Offer to discuss what a risk tolerance assessment typically covers (loss tolerance, time horizon, emotional response to volatility, financial capacity) to help the user understand what they will be asked
- Strongly redirect to `risk-tolerance-assessment` and note that the allocation analysis can be completed immediately after

### User Is Heavily Concentrated in a Single Position (Employer Stock, Inherited Stock, or Real Estate)

This is a common and high-stakes scenario. Handle with care:
- Do not simply say "you should diversify." Concentrated positions often have large embedded capital gains, creating a real tax cost to diversification. The decision requires tax analysis.
- Present the diversification risk analytically: a 40-50% drawdown in a concentrated position (which is plausible for a single company stock) has the same portfolio impact as losing 40-50% of the entire portfolio, with no offsetting gains elsewhere
- Explain that strategies exist for managing concentration risk (gifting appreciated shares to charity, exchange funds for eligible investors, protective options strategies, systematic liquidation over time) but that these require professional tax and legal counsel -- do not describe the mechanics of these strategies in detail
- Redirect: note that this situation specifically warrants consultation with a financial advisor and a tax professional working together

### User Is in or Very Near Retirement (Within 5 Years)

The accumulation-phase framework requires significant modification:
- The key risk in early retirement is sequence-of-returns risk: a severe market decline in the first 3-5 years of retirement is far more damaging than the same decline in year 20, because early losses are amplified by ongoing withdrawals that prevent recovery
- The sustainable withdrawal rate concept is relevant here: research suggests that portfolios with diversified equity/bond allocations have historically been able to sustain withdrawal rates of approximately 3.5-4.5% annually over 30-year periods without depleting -- but this research is sensitive to assumptions and should not be treated as a guarantee
- The bucket strategy is particularly well-suited to this phase: 1-2 years of expected spending in cash provides a buffer that prevents forced selling of equities during downturns
- Even in retirement, too-conservative an allocation carries its own risk: outliving the portfolio (longevity risk) is a real danger for someone with a 25-30 year spending horizon
- Redirect to `retirement-income-planning` if that skill is available for the withdrawal phase

### User Asks About Alternative Investments (Cryptocurrency, Private Equity, Hedge Funds, Collectibles)

These exist outside the four standard asset classes and require distinct handling:
- Cryptocurrency: extremely high volatility (drawdowns of 70-80% have been recorded multiple times), no cash flows or earnings to anchor valuation, evolving regulatory status, and essentially no correlation history during major traditional market downturns -- the 2022 period showed crypto and equity correlations rising during a stress period, undermining the diversification rationale
- Private equity: historically documented return premium over public equities, but with substantial illiquidity (capital locked up for 7-12 years typically), high minimum investment sizes, significant fee complexity (management fees plus carried interest), and return data that may be affected by smoothed valuations
- Hedge funds: highly heterogeneous category; some strategies (merger arbitrage, market neutral) genuinely reduce correlation with market returns; others are simply leveraged equity exposure with high fees
- Collectibles (art, wine, watches): near-zero liquidity, high transaction costs, no income stream, valuation opacity, and storage/insurance costs that erode returns
- Acknowledge these as asset classes some investors include, but note that they typically require a higher minimum financial sophistication and portfolio size to use effectively, and all involve specialized due diligence beyond the scope of this skill

### User Has Multiple Goals with Conflicting Time Horizons

A 38-year-old saving for both retirement (27 years away) and a child's college education (10 years away) cannot use a single allocation:
- Present the goal-based / bucket framework as the most appropriate philosophy for their situation
- Make clear that each goal should have its own allocation logic based on its specific horizon and flexibility
- The retirement allocation (27 years, flexible) warrants a more growth-oriented approach within their risk profile
- The education allocation (10 years, inflexible) warrants a more conservative approach -- a 40% portfolio drawdown 2 years before tuition is due is catastrophic in a way that a 40% drawdown 5 years before retirement is not
- Suggest the user treat these as essentially separate portfolios with separate allocation analyses

### User Asks About Tactical Asset Allocation (Market Timing)

Some users will ask whether they should "shift to more cash because the market seems high" or "buy more bonds because a recession is coming":
- Distinguish strategic allocation (the long-term target driven by risk profile and time horizon -- what this skill covers) from tactical allocation (short-term deviations from the strategic target based on market forecasts)
- Acknowledge that tactical allocation is practiced by professional investors, but that the evidence for its effectiveness among non-professional investors is weak -- market timing consistently underperforms in academic studies because it requires being right twice (when to exit and when to re-enter)
- The classic data point: missing the 10 best trading days in a 20-year period typically reduces long-run returns by 50% or more; most of those best days occur immediately after the worst days, punishing investors who fled to cash
- The appropriate response to market anxiety is usually a portfolio aligned to a risk tolerance that the user can genuinely hold through a 30-40% downturn, not tactical reallocation

### User Has a Very Small Portfolio (Under $5,000)

The conceptual framework applies at any portfolio size, but practical implementation issues arise:
- Some asset classes (commodities, private real estate) are not practically accessible at small portfolio sizes
- Transaction costs (brokerage commissions, spreads, minimum investments) have a proportionally higher impact on small portfolios
- The priority with a very small portfolio is typically to maximize contributions and minimize costs rather than optimize the allocation precisely
- Note that broadly diversified, low-cost investment vehicles have made it possible to achieve reasonable diversification across domestic and international equities and bonds at very small sizes through fractional shares and low-minimum vehicles
- The allocation framework still provides value for planning purposes -- understanding the target helps the user build toward it as the portfolio grows

### User Reports They Sold During a Past Market Downturn

This is a critical behavioral flag:
- Acknowledge this without judgment -- selling during downturns is extremely common and is not a character flaw; it is a predictable response to the emotional experience of watching portfolio value decline
- But this behavioral history is important information: it suggests the user's willingness to take risk is lower than any questionnaire score might indicate, because stated preferences and actual behavior diverge under stress
- Adjust the allocation analysis accordingly: recommend they weight toward the more conservative end of any range, and explicitly note that this conservatism has a real cost in expected long-term returns -- they are paying for the ability to stay invested and avoid panic selling
- Suggest that if they want to pursue a more aggressive allocation, working with a financial advisor who provides behavioral coaching during downturns can help bridge the gap between stated and actual risk tolerance

---

## Example

**Input:** "I just finished the risk tolerance questionnaire and scored 31 out of 40, which puts me in the 'Moderately Aggressive' category. I'm 42 years old, planning to retire at 65 -- so about 23 years away. My income is pretty stable (I'm a government employee with a pension that will cover about 60% of my expected retirement expenses). I have a 6-month emergency fund separate from this portfolio. I'm trying to figure out how to think about allocating my 401(k) and Roth IRA. What framework should I use?"

---

**Output:**

## Portfolio Allocation Analysis

> This analysis is a decision-support framework, not a financial recommendation.
> Ranges reflect what major allocation philosophies suggest for your profile.
> Your specific allocation decision benefits from professional guidance with your full financial picture.

---

### Your Profile Summary

| Input | Your Information |
|-------|-----------------|
| Risk tolerance | Moderately Aggressive (31/40) |
| Willingness vs. capacity split | Both appear aligned -- see analysis below |
| Time horizon -- accumulation | 23 years (to age 65) |
| Time horizon -- spending phase | Estimated 25-30 years in retirement |
| Primary goal | Retirement savings |
| Goal flexibility | Moderate -- retirement date has some flexibility |
| Income stability | High -- government employment |
| Emergency fund outside this portfolio | Yes -- 6 months confirmed |
| Other retirement income sources | Pension covering ~60% of expected retirement expenses |

**Profile note:** Your pension is a highly significant factor. A pension that covers 60% of your retirement living expenses is equivalent to having a substantial fixed-income annuity built into your financial plan at no cost from your investment portfolio. This means your investment portfolio does not need to generate your full retirement income -- it only needs to supplement the pension by approximately 40% of expenses. This substantially increases your capacity to take investment risk within this portfolio. Your stated moderately aggressive risk profile and your objective financial capacity are well-aligned.

---

### Asset Class Behavioral Summary

| Asset Class | Environment It Favors | Correlation with Domestic Equities | Role in Your Portfolio |
|-------------|----------------------|-----------------------------------|----------------------|
| Domestic Equities | Expansion, early recovery | Reference | Core long-term growth |
| International Developed | Global expansion | Moderate-high (0.7-0.85 historically) | Geographic diversification |
| Emerging Markets | Global growth, commodity cycles | Moderate (0.6-0.75 historically) | Higher-growth tilt |
| Investment-Grade Bonds | Recession, deflation | Low to negative (-0.2 to +0.3 historically) | Stability and stress diversifier |
| TIPS | Inflationary periods | Low to moderate (0.1-0.4) | Inflation protection |
| REITs | Growth, moderate inflation | Moderate (correlation rises in stress) | Real estate exposure, income |
| Cash Equivalents | All environments | Near zero | Liquidity buffer |

*Note: Correlation figures are historical approximations from U.S. market data; they vary across time periods and should not be treated as fixed. Correlations among risk assets typically rise during market stress.*

---

### Allocation Ranges by Philosophy for Your Profile

| Philosophy | Equities (Total) | Fixed Income (Total) | Real Assets | Cash | Key Rationale |
|------------|-----------------|---------------------|-------------|------|--------------|
| Age-based (120 minus age) | 70-80% | 15-25% | 0-10% | 2-5% | 120 - 42 = 78% equity starting point; adjusted for pension |
| Risk-profile-based (Moderately Aggressive) | 65-80% | 10-25% | 5-10% | 2-5% | Standard range for this profile tier |
| Goal-based (23-year accumulation) | 70-85% | 10-20% | 5-10% | 2-5% | Long horizon, growth-oriented bucket dominant |
| Pension-adjusted capacity | 70-85% | 10-20% | 5-10% | 2-5% | Pension = built-in fixed income; portfolio can carry more equity |
| **Consensus overlap zone** | **70-80%** | **12-22%** | **5-10%** | **2-5%** | **Where all four frameworks converge** |

**Reading this table:** The consensus overlap zone is where your risk profile, time horizon, goal structure, and financial situation all point in the same direction. This is your most defensible starting range. You will determine your specific position within this range based on the factors below.

**Within-Equities Breakdown (illustrative for moderately aggressive, 23-year horizon):**

| Equity Sub-Class | Illustrative Range | Rationale |
|------------------|--------------------|-----------|
| Domestic large-cap | 40-50% of equity allocation | Core domestic exposure |
| Domestic small/mid-cap | 10-20% of equity allocation | Size factor diversification |
| International developed | 20-30% of equity allocation | Reduces home-country concentration |
| Emerging markets | 10-15% of equity allocation | Growth diversification; higher volatility |

**Within-Fixed Income Breakdown (illustrative):**

| Bond Sub-Class | Illustrative Range | Rationale |
|---------------|-------------------|-----------|
| Short-duration (0-3 yr) | 20-30% of bond allocation | Reduces interest rate risk |
| Intermediate (3-10 yr) | 40-50% of bond allocation | Core bond diversification |
| Inflation-linked (TIPS) | 20-35% of bond allocation | Relevant given pension's nominal value exposure |
| Long-duration (10+ yr) | 0-15% of bond allocation | Limited given higher rate sensitivity |

*Note: Given that your pension is a nominal income stream (not inflation-indexed, unless your pension plan specifies otherwise), maintaining meaningful TIPS exposure within the bond allocation serves as insurance against inflation eroding the real value of your pension income. Confirm whether your pension includes cost-of-living adjustments.*

---

### Factors Pushing Toward the More Conservative End of the Consensus Range

1. **Moderately aggressive, not aggressive:** A 31/40 score falls in the moderately aggressive tier, not aggressive. The upper end of the consensus range (80% equity) is more appropriate for a full aggressive profile; landing in the 70-75% equity zone is a reasonable reflection of your actual score position within the tier.

2. **Unknown behavioral history during market stress:** The analysis has no information about how you responded during the 2008-2009 financial crisis or the March 2020 COVID crash. If you have experienced a significant portfolio drawdown and held steady, that is evidence your stated tolerance matches your actual behavior -- this would support a more aggressive stance. If this is a new investor profile or you have history of anxiety during downturns, lean toward the middle of the range.

3. **Nominal pension exposure:** If your pension does not include cost-of-living adjustments, it will lose real purchasing power to inflation over a 25-30 year retirement. Maintaining some TIPS or other inflation-sensitive holdings within the fixed income allocation addresses this, but also argues for some conservatism in overall portfolio risk.

### Factors Pushing Toward the More Aggressive End of the Consensus Range

1. **23-year accumulation horizon:** With over two decades of compounding time, short-term market volatility becomes substantially less consequential. A 30% market drawdown in year 1 is genuinely painful but historically recoverable over 3-5 years -- and you have 23 of those years before you need this money. Time is the most powerful risk mitigant available to you.

2. **Pension as built-in fixed income:** Your pension covering 60% of retirement expenses is the functional equivalent of a large, government-backed bond position that is not on your portfolio balance sheet. Most asset allocation frameworks for someone without a pension would prescribe some fixed income for income stability in retirement. You already have that income stability secured externally. Your investment portfolio can therefore afford to be more equity-oriented than a purely quantitative risk-profile-based framework would suggest.

3. **Stable income and full emergency fund:** A 6-month emergency fund outside this portfolio means a short-term personal financial shock (job loss, medical expense) will not force you to liquidate investments at an inopportune time. Government employment provides above-average income stability. These factors increase your financial capacity for risk.

4. **Long spending horizon ahead:** Even after retiring at 65, you have an estimated 25-30 year spending horizon. If your portfolio is too conservative at retirement, you risk depleting it through inflation and longevity. Maintaining meaningful equity exposure through and well into retirement is a mathematically supported approach for long-horizon retirees.

### Overall Assessment of Your Position Within the Range

Your confirmed factors -- moderately aggressive risk profile, 23-year accumulation horizon, highly stable income, pension covering 60% of retirement expenses, and an established emergency fund -- all support a position in the upper half of the consensus equity range. An equity allocation in the 72-78% range, with 14-18% in diversified investment-grade and inflation-linked fixed income and 5-8% in real assets (REITs), is consistent with your situation as described. Your position within that narrower range depends on the unresolved behavioral question (how have you historically responded to significant portfolio declines?) and whether your pension includes inflation adjustments.

*This is an illustrative range for decision-support purposes. It is not a recommendation.*

---

### Key Questions to Resolve Before Finalizing

| Question | Why It Matters | Which Direction It Could Push |
|----------|---------------|-------------------------------|
| Does your pension include cost-of-living adjustments? | Affects inflation risk of your total retirement income | COLA pension = more equity capacity; no COLA = more TIPS/real assets |
| How did you respond emotionally and behaviorally during past major downturns (2008, 2020)? | Stated risk tolerance vs. actual behavior can diverge significantly | History of holding steady = support upper range; history of anxiety or selling = support lower range |
| Do you expect to have significant large expenses in the next 5-10 years (children's education, home purchase)? | Near-term cash needs should not come from this portfolio | Major near-term expenses = keep them separate; confirms this portfolio is truly 23-year money |
| Is the pension vested and guaranteed, or does it depend on continued employment? | Partially vested pensions carry risk if you change employers | Full vesting = high capacity; partial vesting = reduce assumed fixed income offset |
| How are these accounts currently invested? | Identifies the gap between current state and framework target | May reveal unnecessary concentration risk or misalignment |

---

### Account-Level Consideration Note

You mentioned both a 401(k) and a Roth IRA. The total allocation across all accounts should align with the framework above -- but the *location* of specific asset classes across account types matters for tax efficiency. As a general principle, growth-oriented assets with higher expected returns and no current income tend to benefit from tax-advantaged placement, while tax-efficient assets (like broad domestic equity) are more suitable for taxable accounts if you have them. For detailed tax location strategy, use `investment-account-types` and `tax-location-strategy`. This allocation framework defines the *what* -- the tax location decision defines the *where*.

---

### Rebalancing Reference

- Consensus target range established: equities 70-80%, fixed income 12-22%, real assets 5-10%, cash 2-5%
- Suggested threshold trigger: review and rebalance when any major asset class drifts more than 5 percentage points from the midpoint of its target range
- Suggested calendar review: annually at minimum; after any major life event (promotion, pay change, pension updates, health events)
- Priority account for rebalancing: conduct rebalancing transactions within the 401(k) and Roth IRA first to avoid taxable capital gains events
- For full rebalancing mechanics, triggers, and tax-efficient rebalancing approaches: use `rebalancing-framework`

---

### Next Steps (Prioritized)

- [ ] **Immediate:** Confirm whether your pension includes cost-of-living adjustments -- this changes the TIPS/inflation-linked allocation decision
- [ ] **Immediate:** Review your current 401(k) and Roth IRA holdings to understand your actual current allocation vs. the framework target
- [ ] **Before implementing:** Determine your behavioral history during past major market downturns to confirm your position within the consensus range
- [ ] **Before implementing:** Use `investment-fee-analyzer` to evaluate the cost structure of available options in your 401(k) plan; fee differences of 0.5-1.0% annually compound to substantial differences over 23 years
- [ ] **Before implementing:** Use `investment-account-types` and `tax-location-strategy` to determine optimal placement of asset classes across 401(k) vs. Roth vs. any taxable accounts
- [ ] **Strongly recommended:** Discuss this framework with a qualified financial advisor who can review your complete financial picture, including the pension terms, any outstanding debts, insurance coverage, and estate considerations
- [ ] **After implementing:** Establish rebalancing rules using `rebalancing-framework`
- [ ] **Ongoing:** Review allocation every 12-24 months; reassess the overall framework approximately 10 years before retirement when the transition from accumulation to distribution begins to require attention

---
