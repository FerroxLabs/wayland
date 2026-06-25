# Hire affordability

## When to load this mode

The user is asking whether they can afford to bring someone on — not whether the role would be useful, but whether the math survives. Load when you hear "should I hire a [role]," "can I afford a $X salary," "is it time for our first hire," "when do we hire our second engineer," or "should we go contractor or W-2."

## Procedure

Does adding this person to payroll make the business *more* profitable, or just spend money faster? Six steps.

**1. Refuse to model under six months of stable revenue.** A hire funded by last month's lucky deal is a layoff in waiting. Ask for trailing six-month revenue and gross profit. If revenue swings more than 30% month-to-month, name the volatility, then compute against the *lowest* of those six months — not the average.

**2. Compute fully-loaded cost.** Salary is the headline, not the cost. In the US, multiply W-2 base by 1.3 to cover payroll taxes (FICA ~7.65%), benefits ($700–1,400/month per employee), workers' comp, unemployment insurance, equipment. A $100k base is a $130k cost. Mandatory-pension jurisdictions — UK, Germany, France, Australia — run 1.35–1.55. Contractors skip the multiplier but cost more per hour. Name the multiplier you used.

**3. Compute the labor efficiency ratio (LER).** Total gross profit divided by total labor cost (fully loaded, all employees plus founder market-rate salary). The rule from Greg Crabtree's *Simple Numbers*: services need LER above 2.0; product businesses with software-style margins need 4.0. Below 1.5, every new hire makes the ratio worse.

**4. Compute payback months for this hire.** Estimate marginal gross profit the hire generates per month — by replacing outsourced spend (clear math), freeing founder time toward revenue work (estimate at market rate), or producing revenue directly (sales hire: pipeline contribution discounted 50% for ramp). Fully-loaded cost divided by marginal monthly gross profit equals payback. Under 6 months: strong yes. 6–12: yes if reserves cover the gap. Over 12: a bet, not a calculation.

**5. Check the cash-runway floor.** Compute months of runway *after* the hire, assuming zero new revenue. Floor is six months. A hire dropping runway below that requires luck. Either the hire produces revenue inside the window or layoffs come.

**6. Check unit economics first.** If contribution margin is negative or customer payback exceeds 12 months, no hire fixes the business — every customer the hire helps acquire bleeds cash faster. Route to unit-economics mode first.

Report fully-loaded cost, LER before and after, payback months, post-hire runway floor. Name the weakest of the four.

## Decision rules

- **Hire when LER stays above 2.0 (services) or 4.0 (product) post-hire.** Below that, the next dollar of revenue goes to labor, not profit.
- **Hire when payback is under 12 months *and* runway floor stays above 6 months.** Both, not either.
- **Contractor first, employee second, when work is bounded.** A 3-month proof-of-need at 1099 rates beats a wrong W-2. If contractor is proposed, hand off to `sentry-employment-and-classification` before signing.
- **Founder salary belongs in the model.** Paying yourself nothing hides labor cost, doesn't eliminate it.
- **One hire at a time on a bootstrapped P&L.** Stacking two hires in a quarter compounds risk.

## Anti-patterns

- **"We'll grow into the salary."** No. The hire pays for itself inside the runway window or it doesn't. Hope is not a financial plan.
- **Comparing salary to revenue, not gross profit.** A $100k hire against $400k revenue at 20% margin is a $100k hire against $80k of available profit. The hire eats the business.
- **Ignoring benefits and payroll taxes.** The 1.3 multiplier is not optional. Skipping it is how a $90k offer becomes a $30k surprise.
- **Hiring before unit economics work.** Each new customer widens the loss.
- **Replacing a part-time contractor with full-time "for stability."** Stability is a benefit, not a financial argument. Run the LER both ways.

## Before / after

**Before:** *"Revenue's been $40k/month for six months. I want to hire a $90k engineer to ship faster."*

**After:** *"Trailing six-month revenue $36k–$44k, lowest $36k. Gross profit at 65% margin: $23k/month worst case. Labor cost today (founder at $120k market rate): $10k/month. Current LER: 2.3. Fully-loaded cost of $90k engineer: $117k/year, $9.75k/month. Post-hire labor: $19.75k. Post-hire LER on worst-month gross profit: 1.16 — below the 2.0 floor. Payback requires $9.75k new monthly gross profit, equivalent to $15k new revenue at current margin; on a $40k base, that's 37% lift in three months. Cash runway $180k, post-hire floor at month 4 if no new revenue. Recommendation: do not hire full-time. Test the thesis with a 3-month contractor at $12k/month — if revenue clears $55k by month 3, the W-2 conversation reopens. Route contractor structure to employment-classification mode before signing."*
