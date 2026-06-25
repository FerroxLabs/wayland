# Pricing math

## When to load this mode

The pricing specialist has picked a price or is choosing between candidates, and the question is whether the number clears the margin floor — or what margin floor is required to keep the business alive. Load when you hear "does this price work," "what gross margin do we need," "what happens if we cut price," or "what does a discount cost us."

## Procedure

Pricing strategy is the price specialist's job. The math underneath it is yours. Five steps.

**1. Establish the gross-margin floor.** Required gross profit per period equals fixed costs (overhead, owner salary, debt service) plus target net profit. Divide that by expected revenue to get the gross-margin floor as a percentage. Any price the pricing specialist proposes must clear it.

**2. Compute gross margin at the candidate price.** For each candidate price, calculate: (price minus cost of goods sold per unit) divided by price. Cost of goods sold includes all variable cost of delivery — materials, hosting, payment processing, fulfillment labor, refunds-as-percentage, any per-customer third-party fee. If gross margin falls below the floor, the price is too low regardless of what the buyer says.

**3. Run the price-sensitivity grid.** Build a small table: price candidates across the top, three demand scenarios down the side (twenty percent fewer units, expected units, twenty percent more units). For each cell, compute total gross profit. The price that maximizes gross profit at the *middle* row is the math-supported choice — but check the corners. A price that wins the middle and collapses the low row carries volume risk.

**4. Model the discount cost.** For any proposed discount or promotion, compute: percent of buyers who would have paid full price (cannibalization), additional units required to break even on the discount, and total gross-profit change at expected volume. A ten percent discount on a fifty-percent-margin product requires twenty-five percent more volume just to hold gross profit flat. Most discounts lose money. Show the user.

**5. Compute the price-change break-even.** If the pricing specialist proposes raising price by X percent, compute the unit drop the business can absorb before total gross profit declines. If they propose lowering price by X percent, compute the unit increase required. Hand both back. The pricing specialist decides; you supply the threshold.

Report the gross-margin floor, gross margin at each candidate, the sensitivity grid, and the break-even threshold. Recommend route-back to the pricing specialist with the candidate that clears the floor and survives the low-demand row.

## Decision rules

- **Gross-margin floor is non-negotiable.** A price below it loses money on every unit before overhead is paid. No volume fixes this.
- **Services businesses need 50%+ gross margin.** Products with no labor in cost of goods sold can run lower. Software typically 70%+.
- **Discounts default to bad math.** Show the user the break-even volume before agreeing to any percentage off. Most retail "sales" destroy gross profit.
- **Price increases beat price decreases on profit.** A ten percent price increase on a fifty-percent-margin product can absorb a sixteen percent unit drop and still hold profit. Most users don't lose that many units.
- **Pricing strategy is not the math job.** When the user asks *what number*, route to the pricing specialist. You answer *what does this number require*.

## Anti-patterns

- **Cost-plus disguised as margin math.** Marking up cost by a fixed percentage ignores demand and willingness-to-pay; route the strategy question out.
- **Computing margin on revenue before refunds.** Refund rate is part of cost of goods sold. Net it out, or margin is inflated.
- **Ignoring payment-processor fees.** Three percent off the top moves gross margin meaningfully on low-ticket products. Always include.
- **Discount math that assumes no cannibalization.** If you've ever bought from this business before, the next discount converts at least some full-price buyers to discount buyers. Model it.
- **Sensitivity grids with only one scenario.** Single-point forecasts hide the risk. Always three rows minimum.

## Before / after

**Before:** *"The pricing specialist says $79 is the value-capture price; let's go with it."*

**After:** *"Cost of goods sold per unit: $14 (hosting $4, support $6, processing $2.40, refund reserve at 3% of price). At $79, gross margin is 82.3%. Gross-margin floor for the business is 65% given $14k/mo fixed costs and target $4k/mo net. $79 clears it by 17 points. Sensitivity grid: at expected 120 units/mo, gross profit $7,800; at -20% volume, $6,240; at +20%, $9,360. Break-even for a 10% discount to $71: would need 23% more units. Recommendation: hold $79, route back to pricing specialist confirmed."*
