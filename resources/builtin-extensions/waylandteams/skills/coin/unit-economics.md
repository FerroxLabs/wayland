# Unit economics

## When to load this mode

The user is asking whether the *product* makes money — not whether the month did. Load when you hear "is this customer profitable," "what's our CAC," "what's the LTV," "how long until a customer pays back," or "should we spend more on acquisition."

## Procedure

Unit economics is the answer to: does each new customer add cash, and how fast? Six steps.

**1. Refuse to model under ten paying customers.** Below that, every number is noise. Tell the user so, then offer to design the smallest test that produces real numbers — a paid pilot at full price beats any spreadsheet.

**2. Compute contribution margin per customer per month.** Revenue per customer per month, minus direct cost to serve that customer (hosting, support time, payment processing, third-party tools billed per seat, fulfillment). Not overhead. Not marketing. Just the cost that exists *because that customer exists*. If contribution margin is negative, stop — no acquisition spend will fix it.

**3. Compute CAC (customer acquisition cost).** Total sales and marketing spend for a period, divided by paid customers acquired in that period. Include all of it — ad spend, content production, sales labor proportional to time-on-acquisition, software used to run acquisition. A CAC number that ignores labor is fiction.

**4. Compute payback period.** CAC divided by contribution margin per month. The answer is the number of months a customer must stay paid for the acquisition to break even. Healthy bootstrapped businesses sit under twelve months. Funded businesses can stretch to twenty-four if churn is genuinely low.

**5. Compute LTV honestly.** Average customer lifespan equals one divided by monthly churn rate. LTV equals contribution margin per month times lifespan. *Cap the lifespan at thirty-six months* even when math says longer — projections beyond three years on a young product are wishful thinking.

**6. Compute LTV:CAC ratio.** Healthy floor is 3:1. Below that, the user is buying customers at a loss across their lifetime. Above 5:1, the user is probably under-investing in growth.

Report contribution margin, payback period, and LTV:CAC. Name which of the three is the weakest, and which lever moves it most — price, cost-to-serve, or churn.

## Decision rules

- **Fix contribution margin before scaling acquisition.** Spending more to acquire customers who lose money at the unit level burns cash faster, not slower.
- **Payback under six months: scale acquisition.** The capital recycles fast enough that growth is self-funding within two quarters.
- **Payback six to twelve months: hold steady, work on retention.** Each month of churn reduction shortens payback more than ad-spend tuning.
- **Payback over twelve months on a bootstrapped business: do not scale.** You will run out of cash before payback closes the loop.
- **Churn is the biggest lever.** A one-point churn reduction beats a one-point CAC reduction in nearly every model. Route to the research specialist for the *why* behind churn.

## Anti-patterns

- **Confusing gross margin with contribution margin.** Gross margin includes some fixed costs of delivery; contribution margin only includes variable cost per customer. Mixing them inflates payback math.
- **Ignoring sales labor in CAC.** Founder time spent closing deals is the largest hidden cost in early CAC. Cost it at market rate.
- **Projecting LTV on three months of retention data.** Cohort one is a vanity number. Use the oldest cohort with at least nine months of history, or cap projections hard.
- **Averaging CAC across channels.** Blended CAC hides which channel works. Compute per-channel; kill the worst-performing.
- **Treating annual prepays as instant LTV.** Cash collected up front is cash, but LTV math should still be monthly so retention shows up.

## Before / after

**Before:** *"We're paying $400 to acquire a $99/mo customer, LTV is huge because SaaS."*

**After:** *"Contribution margin per customer: $74/mo ($99 revenue minus $18 hosting/support minus $7 payment processing). CAC blended $400; channel-A CAC $220, channel-B CAC $890 — kill channel B. Payback at blended CAC: 5.4 months. Monthly churn 4.2%, lifespan capped at 24 months for projection. LTV $1,776. LTV:CAC 4.4:1 — healthy but churn is the constraint; one point of churn reduction adds $310 to LTV. Recommendation: hold acquisition spend flat, route retention investigation to the research specialist."*
