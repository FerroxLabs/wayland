---
name: burn-rate-runway
description: |
  Calculates startup burn rate (gross and net), projects cash runway in months, and builds scenario analysis for different spending and revenue trajectories. Use when the user asks about burn rate, cash runway, how long their money will last, or startup cash management.
  Do NOT use for personal savings calculations (use budget-planning), full financial modeling (use financial-model-structure), or fundraising narrative (use fundraising-narrative).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "analysis planning entrepreneurship strategy spreadsheets"
  category: "business-strategy"
  subcategory: "finance-accounting"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Burn Rate Runway

## When to Use

**Use this skill when:**
- The user asks how many months of cash they have left, when they will run out of money, or whether their burn rate is sustainable
- The user wants to calculate gross burn vs. net burn and understand the difference between the two
- The user needs to model different spending trajectories -- cost-cutting scenarios, hiring freezes, or aggressive growth -- against their current cash balance
- The user is preparing for a fundraising conversation and needs to know when to start the process and how much to raise
- The user wants to determine the minimum revenue milestone required to reach default alive status (the point where organic growth alone enables survival without additional funding)
- The user asks about capital efficiency metrics such as burn multiple, CAC payback, or months of runway per dollar of ARR
- The user has received a new funding round and wants to build a post-close spending plan that optimizes runway against milestones

**Do NOT use this skill when:**
- The user is calculating a personal savings rate, emergency fund, or household budget -- use `budget-planning`
- The user needs a full three-statement financial model (income statement, balance sheet, cash flow statement) with accrual accounting -- use `financial-model-structure`
- The user needs to craft the fundraising story, pitch narrative, or investor memo -- use `fundraising-narrative`
- The user wants to analyze their historical profit and loss, understand EBITDA margins, or compare period-over-period operating performance -- use `pl-analysis`
- The user is a public company, non-profit, or government entity -- burn rate methodology differs materially from startup cash management
- The user is asking about personal investment portfolio burn (withdrawing from retirement accounts) -- this is a personal finance topic, not a startup finance topic

---

## Process

### 1. Gather Cash Position and Historical Spending Data

Before any calculation, establish the accuracy and completeness of the inputs. The precision of the output is entirely bounded by the quality of the inputs.

- **Cash balance:** Get the actual bank balance as of the most recent statement date, not an estimate. Include all liquid operating accounts. Distinguish between unrestricted cash (can be spent anytime), restricted cash (grant funds with use limitations, security deposits), and short-term investments (money market funds, T-bills held for yield -- these are liquid but require a day or two to convert). Operating runway uses only unrestricted cash.
- **Burn history:** Request at least three months of expense data. One month is almost always unrepresentative due to timing (annual subscriptions paid, quarterly bonuses, irregular one-time costs). Three months allows averaging; six months allows identifying trend. If the startup has been operating for fewer than three months, use the current month actuals and note the limited history prominently.
- **Revenue data:** Collect monthly recurring revenue (MRR) separately from non-recurring revenue (one-time professional services, grants, one-time license fees). MRR is predictable and reduces burn consistently. Non-recurring revenue improves one specific month's cash position but does not change the underlying burn structure.
- **Known future changes:** Ask explicitly about planned hires (each full-time employee in the US typically adds $8,000--$15,000 per month in fully-loaded cost including salary, payroll taxes at ~7.65%, benefits, and equipment). Ask about contract renewals, upcoming large payments, planned marketing campaigns, office lease changes, and any expected inflows (signed but not yet closed funding, grant disbursements, large contracts not yet invoiced).
- **Payroll timing:** Payroll typically runs bi-weekly or semi-monthly. In months with three payroll cycles (which occurs roughly twice per year for bi-weekly payroll), cash outflow spikes. Flag this if the payroll cycle is bi-weekly.

### 2. Calculate Gross Burn Rate

Gross burn is the total cash the company spends per month regardless of any revenue. It measures the raw cost of operating the business.

- **Formula:** Gross Burn Rate = Sum of all monthly cash outflows
- Include every cash-basis expense category: payroll (salaries + employer taxes + benefits + equity grants only if cash-settled), rent and utilities, cloud infrastructure and hosting, marketing and advertising spend, contractor and freelancer payments, software subscriptions (SaaS tools), professional services (legal, accounting, HR PEO fees), insurance premiums, travel and entertainment, hardware purchases, and any debt service payments
- Do NOT include inflows of any kind -- revenue, investment proceeds, refunds. Gross burn is strictly an outflow measure
- **Handle irregular expenses correctly:** Normalize annualized or quarterly costs to monthly. An annual D&O insurance payment of $24,000 becomes $2,000/month in the normalized gross burn. A $60,000 annual AWS commitment paid upfront is $5,000/month. Treating these as one-time items understates the true ongoing cost of the business
- **Fully-loaded headcount cost:** Salary alone understates payroll cost by 20-30%. Model each employee at salary + 7.65% payroll taxes (FICA) + benefits (health insurance typically $500--$800/employee/month for small group plans) + equipment amortization ($1,500 laptop over 36 months = $42/month). A $120K base salary employee costs approximately $10,600--$12,000 per month fully loaded
- **If only a total burn number is available:** Ask the user to break it into at minimum four buckets: people (salaries + benefits + contractors), infrastructure (hosting + tools), go-to-market (marketing + sales), and overhead (rent + legal + insurance + other). This is the minimum granularity needed to identify levers

### 3. Calculate Net Burn Rate

Net burn is the actual cash consumption per month -- what matters for runway calculation.

- **Formula:** Net Burn Rate = Gross Burn Rate -- Monthly Cash Revenue
- Use cash-basis revenue only: when did the cash actually land in the bank? For SaaS businesses, this means recognized subscription payments received, not booked ARR. An annual contract signed and invoiced in month one creates a large cash inflow in month one and zero in months two through twelve -- the net burn calculation must reflect this correctly
- **Distinguish revenue types for projection accuracy:**
  - MRR (monthly subscriptions): subtract directly from gross burn every month going forward
  - Annual contracts paid upfront: create a large one-time cash inflow -- show it in the month received, and show only the MRR equivalent in ongoing periods
  - Professional services or milestone payments: show in the specific months expected -- do not average across the year
  - Marketplace or usage-based revenue with net-30 or net-60 payment terms: the cash arrives one to two months after the revenue is earned -- build in this lag for accurate projections
- **If net burn is negative** (revenue exceeds expenses): the company is cash-flow positive at the operating level. Flag this explicitly. There is no runway emergency. The analysis shifts to optimal growth rate and capital allocation rather than survival. Calculate cash-on-cash return and time to profitability instead.
- **Calculate the burn multiple** -- a VC-standard metric that expresses capital efficiency: Burn Multiple = Net Burn / Net New ARR. A ratio below 1x is excellent. 1x--1.5x is good. 1.5x--2x is acceptable for early stage. Above 2x suggests the company is spending too much capital relative to the revenue growth it is generating.

### 4. Calculate Static and Dynamic Runway

Static runway is the baseline. Dynamic runway tells the real story.

- **Static Runway Formula:** Current Cash Balance / Monthly Net Burn Rate
  - This assumes the burn rate never changes -- no revenue growth, no new hires, no cost changes
  - It is almost always wrong but is useful as a worst-case lower bound
  - Round to the nearest whole month; one decimal place implies false precision given the uncertainty in the inputs
- **Dynamic Runway:** Build a month-by-month cash model (see Step 5). Dynamic runway is the month at which the cash balance first reaches zero in that model. It accounts for revenue growth, planned hiring, and known expense changes. For most startups, dynamic runway is meaningfully longer than static runway when revenue is growing
- **Revenue growth assumption:** 20% month-over-month is exceptional and typically not sustained beyond 6-12 months. 10-15% MoM is strong early-stage growth. 5-8% MoM is solid. Below 5% MoM, the revenue contribution to extending runway is modest and should not be relied upon heavily in the base case scenario
- **The "default alive" test (Paul Graham framework):** If current monthly growth rate continues, will the company reach profitability before cash runs out? Calculate the crossover month: the month when MRR >= gross burn. If that month occurs before the zero-cash date, the company is default alive -- survival does not depend on raising more money. If not, the company is default dead and must either raise, cut costs, or accelerate revenue growth
- **Danger zone threshold:** When ending cash balance drops below three times the current monthly gross burn rate, the company enters the danger zone. This represents approximately 90 days of cash at the current cost structure -- not enough time to close a funding round if one has not yet been started

### 5. Build the 12-Month Month-by-Month Cash Projection

The month-by-month model is the core deliverable. A single runway number without this model is directional noise.

- **Structure each row:** Beginning cash balance | + Revenue received (cash basis) | -- Expenses paid (cash basis) | = Ending cash balance
- **Revenue projection:** Apply the stated or estimated MoM growth rate, but cap the projection at a level that reflects reality -- 20% MoM compounding over 12 months turns $3K MRR into $22K MRR, which is plausible. Projecting 20% MoM for 24 months would reach $92K MRR -- increasingly optimistic. Consider stepping down the growth rate assumption as the base grows (20% for months 1-6, 15% for months 7-12 is more defensible than a flat 20% for a year)
- **Expense projection:** Do not hold expenses flat unless the company is in pure maintenance mode. Add each planned hire in the month they are expected to start (with a one-month ramp to full loaded cost). Add planned contract renewals. Add seasonal effects (Q4 marketing spend for B2C businesses, year-end legal and accounting fees)
- **Flag critical dates in the projection:**
  - Zero-cash date: first month ending cash balance reaches $0 or below
  - Danger zone entry date: first month ending cash balance drops below 3x monthly gross burn
  - Fundraising start date: three to six months before the danger zone entry date (accounts for 3-5 month typical fundraising timeline with buffer)
  - Cash trough date: lowest cash balance month (relevant for companies approaching cash-flow positive -- they may still need bridge funding to survive the trough)
- **Show the projection table in the output** -- this is one of the highest-value deliverables. Investors, board members, and operators all use this table to understand the cash position at any future point in time

### 6. Build Three-Scenario Analysis

Scenario analysis converts a single point estimate into a decision tool.

- **Base case:** Current trajectory. Current burn rate, current revenue growth rate as stated, planned hires included. This is not the optimistic case -- it is the expected case based on available information.
- **Conservative case (downside protection scenario):** Revenue grows at 50% of the base case growth rate, expenses come in 10% higher than planned (due to contractor overruns, infrastructure scaling faster than expected, or an unplanned hire). This scenario answers the question: "How much buffer do we actually have if things go slower than planned?" For pre-revenue startups, the conservative case is simply the base case with $0 revenue assumed for the first three months (customer acquisition always takes longer than expected).
- **Cost-optimization case (upside scenario):** Identify discretionary spending that could be reduced without permanently damaging the business. Typically: pause paid marketing that does not have demonstrably positive unit economics, freeze one planned hire (usually a nice-to-have role rather than a critical role), renegotiate one major vendor contract, shift infrastructure to reserved instances from on-demand (typically 30-40% savings on AWS/GCP/Azure for workloads that run continuously). Model a 20-25% reduction in gross burn. This scenario answers: "What is the maximum runway we can achieve without fundamentally changing the business model?"
- **Raise scenario (if applicable):** Model the effect of a funding round closing in month three, month six, or month nine. Show the new ending cash balance and extended runway. Also model the minimum raise amount needed to reach the next fundable milestone (typically 18-24 months of runway post-close, because investors expect 6 months of deployment before fundraising starts and another 6-12 months of fundraising process, plus a buffer)
- **For each scenario:** Show monthly net burn, total runway in months, zero-cash date, and a one-sentence description of what operational changes the scenario requires

### 7. Synthesize Recommendations and Action Items

The analysis is only valuable if it drives decisions.

- **Assess the current position concisely:** State whether the company is in a safe zone (>12 months runway), a planning zone (9-12 months), an action-required zone (6-9 months), or a crisis zone (<6 months). Each zone requires a different response.
- **Identify the two or three largest burn levers:** In most startups, headcount represents 60-80% of gross burn. The leverage of addressing headcount is 5-10x larger than addressing tool subscriptions. Be specific: "If the planned Q3 marketing hire is deferred by three months, runway extends by approximately six weeks" is more useful than "consider reducing headcount."
- **Provide a fundraising timing recommendation:** Fundraising should start when there are at least nine months of runway remaining. Below nine months, the founder negotiates from weakness -- investors know there is time pressure. A pre-revenue seed round typically takes three to five months to close. A Series A with prior VC relationships takes four to seven months. A cold Series A outreach process can take eight to twelve months. Build these timelines explicitly into the recommendation.
- **Calculate the cash-flow neutral revenue target:** State the exact MRR figure at which net burn reaches zero (MRR = gross burn rate). Then calculate how many months at the current growth rate it takes to reach that figure. If it takes longer than the runway, the company either must raise or must cut costs so the target is achievable within the available window.
- **Note the burn multiple** and whether it is trending in the right direction. A burn multiple improving (declining) over time indicates improving capital efficiency. A worsening burn multiple suggests the company is spending more per unit of revenue growth -- a leading indicator of future fundraising difficulty.

---

## Output Format

```
## Burn Rate & Runway Analysis: [Company Name or "Seed-Stage Startup"]
**As of:** [Month Year]
**Data period:** [X months of actuals / current month snapshot]

---

### Current Position

| Item | Value |
|------|-------|
| Cash balance (unrestricted) | $[X] |
| Monthly Revenue (MRR) | $[X] |
| MoM Revenue Growth Rate | [X]% |
| Monthly Gross Burn | $[X] |
| Monthly Net Burn | $[X] |
| Static Runway | [X] months |
| Dynamic Runway (base case) | [X] months |
| Default Alive? | [Yes / No / Borderline] |

---

### Expense Breakdown

| Category | Monthly Cost | % of Gross Burn | Notes |
|----------|-------------|-----------------|-------|
| Salaries & Benefits (fully loaded) | $[X] | [X]% | [X] FTEs + employer taxes + benefits |
| Contractors & Freelancers | $[X] | [X]% | |
| Cloud Infrastructure & Hosting | $[X] | [X]% | |
| Marketing & Advertising | $[X] | [X]% | |
| Office / Rent | $[X] | [X]% | |
| Software & Tools (SaaS) | $[X] | [X]% | |
| Professional Services (legal, accounting) | $[X] | [X]% | |
| Insurance | $[X] | [X]% | |
| Other | $[X] | [X]% | |
| **Total Gross Burn** | **$[X]** | **100%** | |

---

### 12-Month Cash Projection (Base Case)

Revenue growth assumption: [X]% MoM | Expense assumption: [flat / per hiring plan]

| Month | MRR | Expenses | Net Burn | Ending Cash | Flag |
|-------|-----|----------|----------|-------------|------|
| M1 (Mon YY) | $[X] | $[X] | $[X] | $[X] | |
| M2 | $[X] | $[X] | $[X] | $[X] | |
| M3 | $[X] | $[X] | $[X] | $[X] | |
| M4 | $[X] | $[X] | $[X] | $[X] | |
| M5 | $[X] | $[X] | $[X] | $[X] | |
| M6 | $[X] | $[X] | $[X] | $[X] | |
| M7 | $[X] | $[X] | $[X] | $[X] | |
| M8 | $[X] | $[X] | $[X] | $[X] | ⚠️ Fundraising start |
| M9 | $[X] | $[X] | $[X] | $[X] | |
| M10 | $[X] | $[X] | $[X] | $[X] | ⚠️ Danger zone |
| M11 | $[X] | $[X] | $[X] | $[X] | |
| M12 | $[X] | $[X] | $[X] | $[X] | |

---

### Scenario Analysis

| Scenario | Net Burn (Month 1) | Runway | Zero-Cash Date | Assumptions |
|----------|-------------------|--------|----------------|-------------|
| Base case | $[X] | [X] months | [Mon YYYY] | [X]% MoM growth, planned hires proceed |
| Conservative | $[X] | [X] months | [Mon YYYY] | [X]% MoM growth, expenses +10% |
| Cost-optimization | $[X] | [X] months | [Mon YYYY] | Freeze [specific role], pause [specific spend] |
| Raise scenario | $[X] | [X] months | [Mon YYYY] | $[X]M closes in month [X] |

---

### Capital Efficiency Metrics

| Metric | Value | Benchmark |
|--------|-------|-----------|
| Burn Multiple | [X]x | <1.5x is strong at this stage |
| Months of Runway per $1M of Cash | [X] months | -- |
| Revenue per Dollar of Burn | $[X] | Growing? [Yes/No] |
| Fully-Loaded Cost per Employee | $[X]/month | Expected range: $8K--$15K |

---

### Key Dates

| Milestone | Date | Notes |
|-----------|------|-------|
| Danger zone entry (<3x gross burn in cash) | [Mon YYYY] | $[X] cash remaining |
| Fundraising process should begin | [Mon YYYY] | [X] months before danger zone |
| Zero-cash date (base case) | [Mon YYYY] | |
| Cash-flow neutral revenue required | $[X] MRR | [X] months away at current growth |
| Default alive crossover | [Mon YYYY / N/A] | |

---

### Recommendations

**Position Assessment:** [Safe zone (>12 mo) / Planning zone (9-12 mo) / Action required (6-9 mo) / Crisis (<6 mo)]

1. **[Highest-leverage action]:** [Specific recommendation with quantified runway impact]
2. **[Second priority]:** [Specific recommendation with quantified runway impact]
3. **[Fundraising timing]:** [Start date, target raise amount, rationale for amount]
4. **[Revenue milestone]:** [What MRR target matters most for this business and why]

**Burn Multiple Trend:** [Improving / Stable / Worsening] -- [one sentence interpretation]
```

---

## Rules

1. **Always calculate and present both gross burn and net burn explicitly.** Gross burn shows the cost structure of the business independent of revenue performance. Net burn shows actual cash consumption. Conflating the two is one of the most common errors founders make when communicating about their financial position.

2. **Never use a single static runway number as the primary deliverable.** Static runway assumes nothing ever changes, which is never true. Always build a month-by-month projection. The month-by-month model is the minimum acceptable output -- it is what sophisticated operators, board members, and investors expect.

3. **Always use cash-basis revenue, not accrual-basis revenue, for net burn and runway.** An annual contract signed and invoiced today creates a large cash inflow this month and zero in future months. Using ARR/12 as the monthly revenue figure for a company with annual contracts significantly misrepresents the actual monthly cash position. Ask explicitly whether the company invoices annually, monthly, or on another cycle.

4. **Round runway to whole months.** Reporting "13.4 months of runway" implies a precision that does not exist given the variability in monthly expenses and revenue. Report "13 months." The inputs are estimates; false decimal precision misleads rather than informs.

5. **Flag increasing burn immediately and prominently.** If the user provides historical data showing burn increasing month over month, the static runway calculation is dangerous -- it understates the problem. A company burning $50K in month one, $60K in month two, and $70K in month three will run out of cash far faster than $800K / $70K = 11.4 months implies, because burn will likely be $80K or $90K by month four or five. Model the trend forward, not just the current snapshot.

6. **Separate recurring burn from normalized one-time costs.** Report both. Recurring monthly burn is the structural floor of the business. Normalized total average monthly burn (including amortized annual and irregular costs) is what determines actual cash consumption. Showing only one or the other misleads.

7. **For fundraising timing, always work backwards from the danger zone, not forward from the present.** The recommendation is not "you have 14 months so you can start fundraising in 5 months." The recommendation is "danger zone begins in month 11, fundraising requires 4-6 months minimum, therefore you must begin in month 5 or 6 at the latest." These often produce the same answer but the backwards logic ensures the buffer is always adequate.

8. **The burn multiple must be calculated whenever the company has meaningful net new ARR.** It is the primary capital efficiency metric used by Series A and Series B investors. A burn multiple above 2x will be a significant friction point in fundraising regardless of growth rate. If the burn multiple is above 2x, name it explicitly and connect it to the fundraising implications.

9. **Model fully-loaded headcount costs, not just salary.** Payroll taxes (7.65% employer FICA), health insurance, 401k matching (if any), equipment, and software per seat add 20-35% to base salary cost. A team of five people with an average salary of $100K does not cost $500K/year -- it costs $600K--$675K/year fully loaded. Understating headcount cost is the single most common source of burn rate surprise.

10. **If the company has restricted cash (grant funds, escrowed amounts, security deposits), exclude it from the runway calculation** and note it separately. Restricted cash cannot be used to fund operations. A founder who includes $100K of restricted R&D grant funds in their $700K "cash balance" is inflating their effective runway by more than two months at a $40K/month net burn rate.

11. **Never recommend a specific fundraising target amount without anchoring it to milestones.** The raise amount should be calculated as: (monthly burn at full deployment rate) × (target months of runway post-close, typically 18-24) + (capital required for specific milestone, e.g., product launch, geographic expansion). Raising for 12 months of runway post-close is too thin -- six of those months will be consumed before the next fundraise process begins.

12. **Always run the default alive test** when a company is pre-revenue or early revenue. It takes 10 seconds and completely reframes the strategic situation. If the company is default alive, the pressure is growth optimization. If the company is default dead, the pressure is raise-or-cut and both options deserve explicit modeling.

---

## Edge Cases

### Pre-Revenue Startup (Zero MRR)

When a startup has not yet launched a revenue-generating product, gross burn equals net burn and the entire cash model is cost-focused.

- The primary calculation is straightforward: Runway = Cash / Gross Burn. There is no revenue complexity.
- The strategic question becomes: "What product and business milestones can be achieved within the current runway, and are those milestones sufficient to raise the next round?" Model this explicitly: list the top three milestones (e.g., MVP launch, first paying customer, 100 beta users) and estimate which months they can realistically be achieved in. If a milestone requires month 10 but the company has only 11 months of runway, there is essentially no fundraising buffer.
- Calculate the "minimum viable MRR" to extend runway: what monthly revenue would push runway from the current number to 18 months? This gives the founder a concrete target: if the product generates $X MRR by month six, the company buys itself to safety.
- Run a Paul Graham default alive calculation explicitly: if the company starts generating revenue in month four at $2,000 MRR and grows at 15% MoM, model whether it reaches gross burn levels before cash runs out. In most pre-revenue scenarios the answer is no, but naming it removes ambiguity.
- Fundraising timing for pre-revenue companies should be aggressive: begin the fundraise process with at least 9-12 months of runway remaining, not 6-9 months as for post-revenue companies. Pre-revenue companies take longer to close rounds because there is more investor due diligence on the founding team and market thesis rather than financial performance.

### Company With Irregular, Large, or Seasonal Expenses

Annual insurance, quarterly bonuses, large hardware purchases, trade show fees, and year-end audit costs all distort monthly averages.

- Separate expenses into three buckets: (1) truly recurring monthly costs (rent, payroll, monthly SaaS subscriptions), (2) quarterly or annual costs that should be normalized to monthly (annual D&O: $18,000 / 12 = $1,500/month), and (3) true one-time costs (office build-out, legal incorporation fees) that should be excluded from the ongoing burn rate but shown in the period they occur.
- Report two gross burn figures: normalized recurring monthly burn (for structural analysis) and total average monthly burn including amortized irregular costs (for runway calculation). Runway is always calculated using the total average monthly burn, not just recurring burn.
- For seasonal businesses (e-commerce, education, events), do not use a monthly average across the year -- it obscures the cash crunch months. Build the full 12-month model with seasonal revenue and expense patterns applied. Identify the worst-case single-month ending cash balance. That is the true stress test.
- If a major one-time purchase is planned (new office, server hardware, M&A), show its impact as a discrete step-down in cash in the month it occurs, then continue the monthly analysis. A $150K office build-out in month three is not a $12,500/month expense -- it is a $150K hit to cash in one specific month that must not bring the balance into the danger zone.

### Company Approaching Cash-Flow Positive (Near Crossover)

Companies within six months of reaching cash-flow neutral require a different analytical lens than companies with a straightforward burn problem.

- The critical metric is the **cash trough** -- the single lowest cash balance month before the company becomes cash-flow positive. Even if the company is on a glide path to profitability in month nine, if the cash balance in month seven is only $85,000 with a $65,000 gross burn, the company is one bad month away from a crisis.
- Calculate the crossover date precisely: the month when MRR first equals or exceeds gross burn. Then calculate the cumulative cash consumed between now and the crossover date. If current cash exceeds that cumulative consumption with meaningful buffer, no bridge is needed. If not, quantify the shortfall -- that is the minimum bridge amount.
- For these companies, the recommendation is often a small bridge note (convertible at a discount to the next round) rather than a full fundraising process. Bridge notes for near-profitability companies can often close in four to six weeks with existing investors or angels, compared to four to seven months for an institutional round.
- Flag that near-crossover companies should not cut growth investments (marketing, sales) to extend runway if those cuts would materially delay the crossover. Cutting $15K/month in paid marketing might extend runway by two weeks while pushing the crossover date out by two months. The math often favors maintaining growth spend.

### Company With Multiple, Heterogeneous Cash Sources

Some startups have a mix of VC investment, government grants, revenue-based financing, convertible notes, and earned revenue, each with different rules and timelines.

- Model each cash source separately in the projection. Never commingle them in a single "cash balance" line without notes on restrictions.
- Grants (SBIR, state economic development, foundation grants) are typically reimbursement-based -- the company spends first and gets reimbursed, introducing a 30-90 day lag. More importantly, grants are often restricted to specific expense categories (R&D only, hiring only, equipment only). A $200,000 SBIR grant cannot be used to pay rent or fund sales and marketing. Exclude grant funds from the unrestricted cash balance used for runway calculation, but show the grant receivable separately and the specific expense categories it covers.
- Revenue-based financing (RBF) and venture debt create scheduled repayment obligations that add to gross burn. A $500,000 RBF facility repaid at 5% of monthly revenue adds a variable but material expense. Model this explicitly -- if revenue is $30,000/month, the RBF repayment is $1,500/month (and growing if revenue grows). Many founders forget to include debt service in their burn calculation.
- Convertible notes that are maturing create a cliff -- they either convert at the next equity round or become a demand obligation. Know the maturity dates and put them in the projection as a contingent liability flag. A note maturing in month eight with a $200K principal is a material risk if the Series A has not closed.

### Rapidly Scaling Company With Accelerating Burn

A company that is actively expanding -- hiring aggressively, scaling marketing spend, opening new markets -- has a fundamentally different burn profile than a steady-state startup.

- **Never use a single-month snapshot as the burn rate for a scaling company.** A company that hired three people in the last 30 days has a current month gross burn of $80K, but once those salaries are fully on board next month and the month after, run-rate burn will be $95K-$105K. The forward-looking burn rate (what the company will be burning in three months) is more relevant than the trailing burn rate.
- Calculate the **committed monthly burn** -- the amount the company is legally or contractually obligated to spend per month regardless of any new decisions. This includes signed employment offers, signed office leases, committed ad spend, and annual software contracts. Committed burn is the floor; any cuts must come from uncommitted discretionary spending.
- For companies with a hiring plan, build the full headcount ramp into the projection. Each new hire should enter the model in the month they are expected to start, at their fully-loaded cost. A plan to hire six engineers over six months adds approximately $60K-$90K to monthly gross burn over that window. The cash balance in month six must account for this cumulative headcount ramp, not just the current burn rate.
- Apply the "burn rate doubling time" concept as a stress test: if current burn is $80K/month and the company plans to double the team in 12 months, burn will approach $150K-$160K/month in 12 months. Does the current cash position support that trajectory? Calculate explicitly.

### Startup With a Specific Fundraising Target or Timeline

When the user is targeting a specific round (e.g., "we're raising a $3M Series A in six months"), integrate the raise into the model explicitly rather than treating it as a separate topic.

- Add the raise as a cash inflow in the model in the expected close month. Use a conservative close date (founder's estimate + two months). Show the extended runway post-close.
- Calculate the **minimum raise required** for survival: (monthly burn at full deployment post-close) × 18 months + any large one-time capital expenditures (e.g., manufacturing tooling, a regulatory approval process). This is the floor. The target raise should provide 24 months of runway to give time to reach the next milestone and fundraise without distress.
- Note the **minimum viable raise** separately: the smallest amount that keeps the company alive long enough to reach the next fundable milestone while providing at least 12 months of runway post-close. This is useful for modeling whether a bridge from existing investors is sufficient versus a full institutional round.
- If the user's cash position means fundraising must begin immediately (fewer than 9 months of runway), name this constraint explicitly. The user cannot afford a six-month process -- they may need to pursue bridge notes from existing investors first to buy time for a proper institutional process.
- Model the post-raise spending plan separately from the current-state analysis. Post-raise, many startups immediately accelerate hiring and marketing spend. Show what the new burn rate will be post-raise and confirm that the raise amount provides the intended 18-24 months of runway at the new (higher) burn rate, not the current burn rate.

---

## Example

**Input:** "We closed our seed round nine months ago and raised $1.5M. We currently have $620,000 in the bank. We have six employees: four engineers at $130K each, one designer at $105K, and me (CEO) at $90K. We pay $4,500/month for office space in Austin, $6,200/month for AWS and other infrastructure, $3,800/month for sales and marketing tools and LinkedIn ads, and roughly $2,500/month in legal, accounting, and insurance. We launched four months ago and have $18,500 in MRR growing at about 12% month over month. We're planning to hire a VP of Sales in month three and a senior engineer in month five. VP of Sales will be $150K base plus $50K variable; senior engineer will be $155K. We'd like to understand our runway and when we should start raising our Series A."

---

### Complete Output

## Burn Rate & Runway Analysis: Seed-Stage B2B SaaS
**As of:** Current month
**Data period:** 4 months of actuals (revenue); 9-month expense history available

---

### Current Position

| Item | Value |
|------|-------|
| Cash balance (unrestricted) | $620,000 |
| Monthly Revenue (MRR) | $18,500 |
| MoM Revenue Growth Rate | 12% |
| Monthly Gross Burn | $99,900 |
| Monthly Net Burn | $81,400 |
| Static Runway | 7.6 months → **7 months** |
| Dynamic Runway (base case with hires) | **6 months** |
| Default Alive? | **No** -- crossover requires ~22 months at 12% MoM growth |

⚠️ **Immediate flag:** With 7 months of static runway and two planned hires that will increase gross burn by approximately $33,000/month, the effective runway is closer to 6 months. Fundraising for a Series A should begin immediately or within the next 30 days.

---

### Expense Breakdown

**Headcount note:** Fully-loaded costs modeled at salary + 7.65% payroll tax + $650/employee/month benefits + $40/month equipment amortization per person.

| Category | Monthly Cost | % of Gross Burn | Notes |
|----------|-------------|-----------------|-------|
| Salaries & Benefits (fully loaded, 6 people) | $83,100 | 83% | See headcount detail below |
| Cloud Infrastructure (AWS + tools) | $6,200 | 6% | Likely to scale with user growth |
| Sales & Marketing Tools + LinkedIn Ads | $3,800 | 4% | |
| Office (Austin) | $4,500 | 5% | Lease commitment -- not cuttable short-term |
| Professional Services (legal, accounting, insurance) | $2,500 | 3% | Includes normalized monthly insurance |
| **Total Gross Burn** | **$100,100** | **100%** | Rounded to $99,900 after rounding each line |

**Headcount Detail (current 6 FTEs, fully loaded):**

| Role | Base Salary | Fully Loaded Monthly |
|------|-------------|---------------------|
| Engineer x4 | $130,000 each | $12,700/month each = $50,800 total |
| Designer | $105,000 | $10,300/month |
| CEO | $90,000 | $8,900/month |
| **Total (6 FTEs)** | **$845,000/yr** | **$70,000/month** |

Note: Benefits, employer FICA, and equipment add approximately $13,100/month above base salary across 6 employees -- a 19% uplift on base payroll.

---

### 12-Month Cash Projection (Base Case)

Revenue: 12% MoM growth applied throughout.
Expenses: Per hiring plan -- VP of Sales added in month 3 (fully loaded ~$18,000/month: $150K base + variable OTE averaged to fully loaded + FICA + benefits); senior engineer added in month 5 (fully loaded ~$15,600/month: $155K base + taxes + benefits).

| Month | MRR | Expenses | Net Burn | Ending Cash | Flag |
|-------|-----|----------|----------|-------------|------|
| M1 | $18,500 | $100,100 | $81,600 | $538,400 | |
| M2 | $20,720 | $100,100 | $79,380 | $459,020 | |
| M3 | $23,206 | $118,100 | $94,894 | $364,126 | 🔴 VP Sales starts |
| M4 | $25,991 | $118,100 | $92,109 | $272,017 | |
| M5 | $29,110 | $133,700 | $104,590 | $167,427 | 🔴 Sr Engineer starts |
| M6 | $32,603 | $133,700 | $101,097 | $66,330 | ⚠️ Danger zone entered |
| M7 | $36,515 | $133,700 | $97,185 | -$30,855 | 💀 Zero-cash date |
| M8 | $40,897 | $133,700 | $92,803 | -- | |
| M9 | $45,804 | $133,700 | $87,896 | -- | |
| M10 | $51,301 | $133,700 | $82,399 | -- | |
| M11 | $57,457 | $133,700 | $76,243 | -- | |
| M12 | $64,352 | $133,700 | $69,348 | -- | |

**Cash-flow neutral MRR required:** $133,700/month (post-hire gross burn)
**Months to reach $133,700 MRR at 12% MoM from current $18,500:** approximately 18 months (month 22 from company launch)

---

### Scenario Analysis

| Scenario | Net Burn (Month 1) | Runway | Zero-Cash Date | Assumptions |
|----------|-------------------|--------|----------------|-------------|
| **Base case** | $81,600 | **6 months** | Month 7 | 12% MoM growth; both hires proceed on schedule |
| **Conservative** | $81,600 | **5 months** | Month 6 | 6% MoM growth (half of plan); expenses +10% due to contractor usage |
| **Cost-optimization: defer VP Sales** | $81,600 | **8 months** | Month 9 | Defer VP Sales hire by 3 months; defer Sr Engineer by 2 months; saves ~$18K-$33K/month during critical window |
| **Cost-optimization: defer both hires + pause ads** | $77,800 | **9 months** | Month 10 | Defer both hires 4 months; pause $2,200/month ad spend; saves ~$36K/month |
| **Series A closes in month 3** | $81,600 | **26 months post-close** | -- | $3.5M raised at month 3; new post-close burn ~$133K/month; 26 months runway |

---

### Capital Efficiency Metrics

| Metric | Value | Benchmark | Assessment |
|--------|-------|-----------|------------|
| Burn Multiple | 4.4x | <1.5x excellent, <2x good | 🔴 High -- $81.4K burned per ~$18.5K MRR added (at 12% = ~$2,220 net new MRR) |
| MRR per $1M of Cash Spent | ~$25/month | Varies by stage | Will improve as revenue scales |
| Fully Loaded Cost per Employee | $11,683 | $8,000--$15,000 expected | Within normal range |
| Revenue as % of Gross Burn | 18.5% | Growing | Improving monthly at 12% MoM |

**Burn Multiple note:** The 4.4x burn multiple is high for a Series A raise conversation. At Series A, investors typically look for burn multiples below 2x as a sign of capital efficiency. To improve this metric before fundraising, the company should prioritize revenue acceleration (or demonstrate a credible path to revenue acceleration) alongside cost discipline. The VP of Sales hire, if it meaningfully accelerates revenue growth from 12% to 18-20% MoM, would significantly improve the burn multiple within 6-9 months post-hire.

---

### Key Dates

| Milestone | Date | Notes |
|-----------|------|-------|
| **Fundraising must begin** | **Immediately / within 30 days** | Only 6 months of runway with planned hires |
| Danger zone entry (<3x gross burn = <$400K) | Month 6 ($66K remaining) | Cash is below 3x current monthly gross burn by Month 4 |
| Zero-cash date (base case) | **Month 7** | Without a close by month 3-4, company is insolvent |
| Cash-flow neutral MRR (post-hire structure) | $133,700/month | ~18 months from today at 12% MoM growth |
| Default alive crossover | Month 22 from today | Company is default dead under current trajectory |

---

### Recommendations

**Position Assessment:** 🔴 **Crisis zone** -- 6 months of effective runway with planned hires. Immediate fundraising action required.

1. **Begin Series A process immediately.** With 6 months of effective runway (7 months static, reduced by planned hires), there is essentially no buffer for a standard 4-7 month institutional fundraising process. The process must begin today. Target a close in month 3-4. If the process extends to month 5, negotiate a $200K-$300K bridge note from existing seed investors at that point to maintain operational continuity while the round closes.

2. **Model the VP of Sales hire as conditional on fundraising progress.** The VP of Sales hire in month 3 consumes $18K/month that the company cannot afford without the Series A proceeds. Consider structuring a conditional offer letter that starts upon round close, or negotiating a start date in month 4-5 with a portion of compensation tied to equity to reduce initial cash impact. Deferring this hire by one month buys roughly two weeks of runway -- modest but worth considering if close timing slips.

3. **Target a $3.0M--$3.5M Series A.** The raise amount should provide 18-24 months of runway at the post-hire burn rate of $133,700/month. A $3.0M raise provides approximately 22 months of runway. A $3.5M raise provides approximately 26 months and is the recommended target. The extra $500K provides critical buffer for hiring ramp, variable expenses, and the inevitable delays in revenue growth. Do not target less than $3.0M -- a $2.0M raise at $133K/month burn provides only 15 months of runway, which leaves only 6 months of operating time before the next fundraise must begin.

4. **Prepare a revenue growth story that addresses the burn multiple.** The 4.4x burn multiple will be the first objection from Series A investors. The VP of Sales hire needs to be presented with a credible model showing revenue growth accelerating from 12% MoM to 18-20% MoM within two quarters of hire. If the company has any evidence of this acceleration (enterprise pilots underway, strong pipeline), lead with it. If not, the fundraising conversation will be harder, and improving the burn multiple before the close by pausing discretionary marketing spend and demonstrating organic growth efficiency is worth considering.

5. **Re-evaluate infrastructure costs as AWS spend scales.** $6,200/month on infrastructure with $18,500 MRR represents a 34% infrastructure-to-revenue ratio, which is high for early-stage SaaS. This likely reflects over-provisioned development environments or on-demand instance pricing that has not been optimized. Switching continuous workloads to reserved instances (1-year commitment) typically reduces AWS spend by 30-40%, potentially saving $1,800-$2,500/month with no architectural changes. This is a low-effort, high-impact change to execute in the next 30 days regardless of the fundraising outcome.

**Burn Multiple Trend:** Currently high at 4.4x, but improving as MRR grows. The VP of Sales hire, if successful in accelerating pipeline conversion, should bring the burn multiple below 2.5x within 12 months post-hire. This improvement narrative is fundable at Series A with the right investor audience.
