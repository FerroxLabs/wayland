---
name: subscription-audit
description: |
  Inventories all recurring subscriptions, memberships, and automatic charges. Identifies unused, duplicated, or low-value subscriptions and builds a cancellation priority list with estimated annual savings. Produces a complete subscription inventory with keep/cancel/downgrade recommendations.
  Use when the user wants to review their subscriptions, reduce recurring charges, or find hidden monthly costs.
  Do NOT use for full budget creation (use budget-planning), one-time expense analysis (use spending-analysis), or business SaaS audit.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "budgeting personal-finance expenses savings"
  category: "personal-finance"
  subcategory: "budgeting"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---
# Subscription Audit

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making significant financial decisions.

---

## When to Use

**Use this skill when:**
- The user explicitly wants to inventory, review, or reduce their recurring subscriptions, memberships, or automatic charges
- The user suspects "subscription creep" -- the gradual accumulation of small charges that collectively represent a significant monthly drain
- The user notices unrecognized charges on a bank or credit card statement and wants to identify and evaluate all recurring line items
- The user is preparing for a major financial transition (job loss, reduced income, new savings goal, paying off debt) and needs to identify cuts quickly
- The user has just gone through a household change -- moved in with a partner, had a child, changed jobs -- and their subscription set needs to be rationalized against new usage patterns
- The user wants to calculate their total annual recurring charge burden and compare it to their savings rate
- The user receives a price increase notification from a subscription service and wants to audit their full stack in response
- The user has been using a "set it and forget it" payment method (like PayPal or Apple Pay linked billing) and has lost visibility into what they are actually paying for

**Do NOT use when:**
- The user wants a complete monthly budget with income allocation, savings rate, and spending categories -- use `budget-planning` instead
- The user wants to analyze all discretionary spending, not just recurring charges -- use `spending-analysis` instead
- The user needs help comparing two specific streaming services or software products head-to-head -- use a product comparison skill instead
- The user is auditing company or business SaaS subscriptions, vendor contracts, or software licenses -- this skill is personal finance only; use a business operations or SaaS management skill instead
- The user wants help disputing an unauthorized charge with their bank or credit card issuer -- that is a fraud/dispute resolution task, not a subscription audit
- The user is asking about a single subscription and whether it is worth keeping -- that is a single-item value analysis, not an audit

---

## Process

### Step 1: Build the Complete Subscription Inventory

The most common mistake in a subscription audit is an incomplete inventory. Users consistently undercount by 30-40% on memory alone. Drive completeness through systematic source review, not just recall.

**Instruct the user to pull charges from all of these sources:**
- Every credit card statement for the past 3 months (3 months catches annual billings that didn't hit this month, quarterly charges, and irregular-cycle services)
- Every bank account debit history for the past 3 months
- PayPal activity log (filter by "Automatic Payments" -- this is a frequent blind spot where old subscriptions hide)
- Apple App Store: Settings > [Apple ID] > Subscriptions shows all active App Store subscriptions
- Google Play Store: Profile icon > Payments & Subscriptions > Subscriptions
- Amazon: Account > Memberships & Subscriptions captures Prime variants and Amazon-billed third-party channels
- Email inbox: Search for terms like "your receipt", "billing confirmation", "subscription renewal", "your invoice", "payment successful" -- set date range to the past 12 months to catch annual billings
- Existing email-based payment notifications from services like PayPal, Venmo, or bank alerts

**For each charge found, capture these exact fields:**
- Service name (exactly as it appears on the statement -- helps identify the same service billed under a slightly different name)
- Monthly cost OR actual billing amount and billing cycle (weekly, monthly, quarterly, annual, per-box)
- Billing cycle and most recent charge date
- Payment method and last 4 digits of card (relevant if the user wants to cancel a card or dispute charges)
- Primary account holder (the user, a partner, a family member)
- Whether it is a free trial still in effect or a paid subscription

**Common subscription categories to prompt through if the user is self-reporting:**
- Video streaming (multiple services are common -- Netflix, Max, Hulu, Disney+, Peacock, Paramount+, Apple TV+, AMC+, Showtime, Starz, ESPN+, YouTube Premium, YouTube TV, Philo, FuboTV, Sling)
- Music and audio (Spotify, Apple Music, Tidal, Amazon Music Unlimited, Audible, podcast apps)
- Cloud storage (iCloud, Google One, Dropbox, OneDrive, Backblaze, Box)
- Software and productivity (Microsoft 365, Adobe Creative Cloud, Canva Pro, Notion, Evernote, 1Password, LastPass)
- News and media (New York Times, Washington Post, Wall Street Journal, The Atlantic, local newspaper, Substack newsletters)
- Fitness (gym membership, Peloton app, fitness app subscriptions, ClassPass, running/cycling app premium tiers)
- Health and wellness (meditation apps, therapy platforms, weight management apps, vitamin delivery, supplement subscriptions)
- Gaming (PlayStation Plus, Xbox Game Pass, Nintendo Switch Online, EA Play, Steam subscriptions, MMO subscriptions)
- Food and delivery (meal kit services, grocery delivery memberships, restaurant delivery memberships, coffee club)
- Shopping and retail (Amazon Prime, Costco, BJ's, warehouse clubs, retail membership programs, Instacart+, Shipt, DoorDash DashPass)
- Dating apps (Tinder Gold/Platinum, Hinge+, Bumble Premium, Match)
- Learning and education (Coursera, LinkedIn Learning, Duolingo Plus, MasterClass, Skillshare)
- Security and VPN (identity theft protection services, credit monitoring, VPN services, antivirus)
- Box subscriptions (beauty boxes, book clubs, clothing rental, snack boxes, wine clubs, pet supply boxes)
- Financial tools (budgeting apps, investment platforms with subscription fees, credit score services)
- Professional and career (LinkedIn Premium, industry association dues, certification renewal fees)
- Car and transportation (roadside assistance beyond what insurance covers, parking apps, toll transponder accounts with fees, SiriusXM)
- Home (security monitoring, smart home platform fees, lawn care, pest control, cleaning services on auto-schedule)
- Domain names and web hosting (personal websites, email domains, portfolio sites)
- Children's subscriptions (educational apps, YouTube Kids Premium, gaming, tutoring platforms)

### Step 2: Normalize All Costs to Monthly and Annual Equivalents

Inconsistent billing cycles make comparison impossible. Normalize everything before any analysis.

**Apply these conversion rules universally:**
- Weekly billing (common for meal kits): multiply by 52, then divide by 12 for monthly equivalent
- Bi-weekly billing: multiply by 26, then divide by 12
- Monthly billing: the stated price is the monthly cost
- Quarterly billing: divide the quarterly amount by 3 for the monthly equivalent
- Semi-annual billing: divide by 6
- Annual billing: divide by 12 for the monthly equivalent; use the actual annual amount for the annual column (not the reconstructed 12x figure, since annual plans often have different pricing than monthly)
- Per-delivery or per-box: calculate actual monthly average based on the number of deliveries per month

**Mark billing cycle type in the inventory** -- annual pre-paid subscriptions have a different cancellation calculus than month-to-month. An annual subscription you cancel today may still run through its paid period with no refund.

**Flag currency exposure:** If the user subscribes to any international services billed in a foreign currency, note that the effective cost fluctuates with exchange rates.

### Step 3: Assign Usage Tiers with Precision

Vague self-assessment ("I use it sometimes") produces inaccurate recommendations. Push for concrete usage data.

**Usage tier definitions -- use these exact thresholds:**
- **Active -- Heavy:** Used 4+ times per week. Clear daily-life integration.
- **Active -- Regular:** Used 1-3 times per week consistently across the past 30 days.
- **Active -- Light:** Used at least once per month but less than weekly. Value depends on cost.
- **Infrequent:** Used fewer than 6 times in the past 90 days but at least once.
- **Dormant:** Not used in the past 30 days, or the user cannot confidently recall the most recent use.
- **Duplicate:** Another service in the inventory serves the same primary function. The lower-value or higher-cost duplicate should be flagged regardless of usage tier.
- **Unknown:** User is not sure what the service is -- these are automatic escalation candidates for investigation before the next billing date.

**Prompt the user with these specific questions to determine usage tier:**
- "When did you last open or log into [service]? Roughly how many times did you use it in the past 30 days?"
- "If this service disappeared tomorrow, would you notice within the week?"
- "Is there another service you already pay for that does the same thing?"

**Document the usage tier as the user describes it** -- do not accept "I guess I use it sometimes" as an answer. Require a number or a date.

### Step 4: Calculate Cost Per Use for Every Subscription Above $5/Month

Cost per use is the single most powerful framing for subscription value analysis. A $10/month service used 40 times costs $0.25 per use. A $10/month service used twice costs $5.00 per use -- the same as a cup of coffee at a cafe.

**Cost per use calculation:**
- Estimate annual uses based on usage tier x 52 weeks or 12 months
- Annual cost ÷ annual uses = cost per use
- If the user cannot estimate annual uses within a reasonable range, that itself is a signal the subscription is dormant

**Cost-per-use benchmarks for context:**
- Under $0.50 per use: Excellent value -- equivalent to free-to-low-cost entertainment or utility
- $0.50 -- $2.00 per use: Good value for most subscription categories
- $2.00 -- $5.00 per use: Acceptable only if the service is essential or irreplaceable
- $5.00 -- $15.00 per use: Poor value -- below this frequency, canceling and repurchasing ad-hoc (pay-per-use, rental, library) may cost less
- Above $15.00 per use: Cancel candidate unless there is a compelling emotional or practical reason to retain
- $50+ per use: Immediate cancel or pause unless there is a contractual lock-in

**Apply this benchmark framing explicitly** when presenting cost-per-use data to the user -- people respond to concrete comparisons.

### Step 5: Assign Action Recommendations Using a Decision Tree

Apply recommendations consistently. Every subscription must receive one of the following five dispositions:

**Keep:** Used regularly (Active -- Heavy or Active -- Regular), cost-per-use is reasonable, no functional duplicate in the inventory, no cheaper tier available that would satisfy actual usage patterns.

**Downgrade:** Used regularly, but a cheaper plan tier would satisfy actual usage. The most common downgrade opportunities:
- Ad-supported tiers for streaming services (typically 30-45% cheaper than ad-free tiers)
- Individual plan vs. family plan (verify user count -- sometimes a family plan is actually cheaper per user if 2+ people would use it)
- Premium tier vs. free or basic tier when premium features are unused (common in productivity apps, cloud storage, music apps)
- Monthly billing vs. annual pre-pay when the user intends to keep the service long-term (10-20% savings typical)
- Pausing rather than canceling for services with seasonal usage spikes

**Pause:** Service has legitimate value but usage is seasonal or temporarily low. Applicable when the service offers a pause feature (many meal kit services, some gym memberships, some streaming services). Pausing avoids the friction of re-subscribing later while stopping charges now.

**Negotiate:** Service is used and valued, but the price has increased or the user is on a standard rate when loyalty discounts or retention offers exist. Many subscription services offer 20-50% discounts to customers who call to cancel and ask for a better rate. Gym memberships, satellite radio, cable/internet bundles, and some streaming services are particularly responsive to retention negotiation.

**Cancel:** Dormant, unknown, duplicate, or cost-per-use is above $15 consistently. Also cancel free trials that have auto-converted without active use.

**For each Cancel or Downgrade recommendation**, calculate:
- Monthly savings (exact dollar amount, not a range)
- Annual savings (monthly savings x 12, or the actual difference in annual billing)
- Any cancellation friction (contract terms, early termination fees, loss of data or content, need to coordinate with co-subscribers)

### Step 6: Build the Cancellation Priority List

Priority ordering matters because users rarely execute every cancellation at once. The ordering must maximize financial impact while accounting for real-world timing constraints.

**Prioritization logic -- apply in this order:**
1. **Urgency first:** Any subscription billing within the next 7 days should appear at the top regardless of amount, because failing to cancel before the next billing date costs the user another full cycle.
2. **Highest monthly cost among dormant/unused subscriptions:** These represent the worst value and the biggest immediate win.
3. **Highest monthly cost among infrequent subscriptions.**
4. **Duplicates:** Once identified, the inferior duplicate should be cut regardless of cost ranking.
5. **Unknown/unrecognized charges:** These may be unauthorized. Flag separately and instruct the user to identify before taking action (canceling an unauthorized charge is different from disputing a fraudulent one).
6. **Free trials expiring within 14 days:** High urgency due to auto-conversion risk.

**For each item on the cancellation priority list, document:**
- The recommended action (cancel, downgrade to specific plan name, pause)
- The next billing date
- The cancellation method (many services make cancellation deliberately difficult -- note if web-only, phone-only, or if there is a known retention flow the user should expect)
- Whether there is an outstanding contract or early termination fee
- Whether the cancellation affects other household members

### Step 7: Produce the Full Output and Recovered Funds Plan

After building the inventory and priority list, synthesize total savings and make a specific recommendation for what to do with recovered funds.

**Recovered funds allocation hierarchy -- recommend in this order:**
1. If the user has no emergency fund (less than 1 month of expenses saved): Direct 100% of recovered funds to a high-yield savings account until 1 month of expenses is covered, then build to 3-6 months.
2. If the user has high-interest debt (credit cards above 18% APR): Direct recovered funds toward debt with the highest interest rate first (avalanche method), or the smallest balance if the user needs psychological wins (snowball method).
3. If the user has a specific short-term goal (vacation, appliance, car maintenance reserve): Create a dedicated savings bucket for that goal funded by recovered subscription dollars.
4. If no emergency fund gap or high-interest debt: Redirect to retirement contributions (especially if employer match is uncaptured) or a brokerage/investment account.

**Quantify the opportunity cost of inaction:**
- $50/month in recovered funds invested at 7% annual return = approximately $3,050 in 5 years, $8,700 in 10 years
- $100/month recovered = approximately $6,100 in 5 years, $17,400 in 10 years
- These figures do not constitute investment advice -- they illustrate why cutting subscriptions and redirecting the savings meaningfully compounds over time

**Always include a 6-month re-audit reminder** -- subscription creep is chronic, not a one-time problem. New free trials convert, prices increase, and household needs change.

### Step 8: Validate and Deliver

Before presenting output, run these internal checks:
- Total monthly cost adds up correctly (sum the individual rows)
- Annual costs are correctly derived (not just monthly x 12 for annual-billed items -- use actual billed amounts)
- Cancellation savings match the difference between current spend and post-action spend
- Every subscription has an action recommendation -- no subscription should be left without a disposition
- Duplicate relationships are called out explicitly in the notes column, not just flagged vaguely
- No subscription costing more than $10/month is missing a cost-per-use calculation

---

## Output Format

Present the audit in this exact structure. All dollar amounts must be specific (not ranges). All tables must be complete.

```
## Subscription Audit Results

### Total Subscription Burden
- **Current monthly spend:** $XXX.XX
- **Current annual spend:** $X,XXX
- **Subscriptions reviewed:** XX
- **Recommended for cancellation:** X
- **Recommended for downgrade:** X
- **Estimated monthly savings:** $XXX.XX
- **Estimated annual savings:** $X,XXX

---

### Full Subscription Inventory
| # | Service | Category | Monthly Cost | Annual Cost | Billing Cycle | Usage Tier | Action |
|---|---------|----------|--------------|-------------|---------------|------------|--------|
| 1 | [Name]  | [Type]   | $XX.XX       | $XXX        | Monthly       | Heavy      | Keep |
| 2 | [Name]  | [Type]   | $XX.XX       | $XXX        | Annual        | Regular    | Keep |
| 3 | [Name]  | [Type]   | $XX.XX       | $XXX        | Monthly       | Light      | Downgrade |
| 4 | [Name]  | [Type]   | $XX.XX       | $XXX        | Monthly       | Dormant    | Cancel |
| 5 | [Name]  | [Type]   | $XX.XX       | $XXX        | Monthly       | Duplicate  | Cancel |
| 6 | [Name]  | [Type]   | $XX.XX       | $XXX        | Monthly       | Unknown    | Investigate |
|   | **TOTAL** |        | **$XXX.XX**  | **$X,XXX**  |               |            | |

---

### Cost Per Use Analysis (subscriptions over $5/month)
| Service | Annual Cost | Est. Annual Uses | Cost Per Use | Benchmark | Value Rating |
|---------|-------------|-----------------|-------------|-----------|-------------|
| [Name]  | $XXX        | XXX             | $X.XX       | < $0.50   | Excellent |
| [Name]  | $XXX        | XX              | $XX.XX      | $5--$15   | Poor |
| [Name]  | $XXX        | X               | $XXX.XX     | > $50     | Cancel |

---

### Cancellation Priority List
| Priority | Service | Action | Monthly Savings | Annual Savings | Next Billing Date | Cancellation Notes |
|----------|---------|--------|----------------|----------------|------------------|--------------------|
| 1 | [Name] | Cancel | $XX.XX | $XXX | [Date / Check app] | [Dormant 45+ days. Cancel via app settings.] |
| 2 | [Name] | Cancel | $XX.XX | $XXX | [Date / Check app] | [Duplicate of #1 in inventory.] |
| 3 | [Name] | Downgrade | $XX.XX | $XXX | [Date] | [Downgrade to [plan name] -- saves $XX/mo, same features used.] |
| 4 | [Name] | Negotiate | $XX.XX potential | $XXX potential | [Date] | [Call retention line. Common offer: 3 months at 50% off.] |

---

### Downgrade Opportunities
| Service | Current Plan | Current Monthly | Recommended Plan | New Monthly | Monthly Savings | Annual Savings | Notes |
|---------|-------------|----------------|-----------------|------------|----------------|----------------|-------|
| [Name]  | [Premium]   | $XX.XX         | [Standard/Ad-supported] | $XX.XX | $XX.XX | $XXX | [Unused premium features: X, Y] |
| [Name]  | [Monthly]   | $XX.XX         | [Annual pre-pay] | $XX.XX (eff.) | $XX.XX | $XXX | [Only if keeping 12+ months] |

---

### Subscriptions to Keep (no action needed)
| Service | Monthly Cost | Justification |
|---------|-------------|---------------|
| [Name]  | $XX.XX      | [Daily use, $0.XX cost per use, no cheaper equivalent] |
| [Name]  | $XX.XX      | [Essential utility, used multiple times daily] |

---

### Savings Summary
| Category | Monthly Savings | Annual Savings |
|----------|----------------|----------------|
| Cancellations | $XX.XX | $XXX |
| Downgrades | $XX.XX | $XXX |
| Negotiation (estimated) | $XX.XX | $XXX |
| **Total Potential Savings** | **$XXX.XX** | **$X,XXX** |
| **Post-Audit Monthly Spend** | **$XXX.XX** | **$X,XXX** |

---

### Recovered Funds Allocation
**Redirect $XXX/month as follows:**
- $XXX.XX → [Emergency fund / high-interest debt / specific savings goal] (Priority 1: [reason])
- $XXX.XX → [Secondary allocation] (Priority 2: [reason])

**Why this matters:** $XXX/month redirected consistently represents $X,XXX over 5 years and $XX,XXX over 10 years in savings or debt reduction.

---

### 90-Day Action Checklist
**This week (act before next billing):**
- [ ] [Service]: Cancel before [date]. Method: [website/app/phone].
- [ ] [Service]: Cancel before [date]. Method: [website/app/phone].

**This month:**
- [ ] [Service]: Downgrade to [plan name]. Access plan settings at [describe location, e.g., account > plan].
- [ ] [Service]: Investigate unknown charge -- identify and cancel or dispute.
- [ ] [Service]: Call retention line to negotiate rate before [renewal date].

**Before next renewal:**
- [ ] [Service]: Set calendar reminder to cancel [X days before annual renewal date].
- [ ] [Service]: Decide on pause vs. cancel when current billed period ends on [date].

**Ongoing:**
- [ ] Set a calendar event to re-audit all subscriptions in 6 months ([target month]).
- [ ] Review new charges after any free trial signup within 14 days.
```

---

## Rules

1. **Always present the disclaimer before any financial guidance.** This is non-negotiable regardless of how casual or quick the user's request is.

2. **Never accept a user's self-reported subscription list as complete.** Always instruct the user to verify against actual bank and credit card statements, Apple/Google subscription settings, and PayPal automatic payments. Users consistently undercount subscriptions by 30-40% from memory alone.

3. **Normalize all costs to both monthly and annual figures before any analysis.** Annual framing is not optional -- $15.49/month sounds negligible; $185.88/year sounds worth evaluating. Meal kits billed weekly can easily exceed $2,400/year, which is invisible when users think of it as "$60 this week."

4. **Every subscription over $5/month must have a cost-per-use calculation.** This is the most actionable single metric in a subscription audit. A $45 gym membership used 3 times per month costs $15 per visit -- more expensive than a drop-in class at many gyms.

5. **The cancellation priority list must lead with billing urgency, not dollar amount.** A $7/month subscription billing tomorrow should appear before a $20/month subscription billing in 25 days, because the user can still avoid the immediate charge. After urgency, order by monthly savings descending.

6. **Never leave a subscription without a specific action disposition.** Every item in the inventory must be marked Keep, Downgrade (with specific target plan), Pause, Negotiate, Cancel, or Investigate. "Maybe cancel" or "think about it" are not valid dispositions.

7. **Flag all annual pre-paid subscriptions distinctly.** A user who cancels an annual subscription mid-cycle typically does not receive a prorated refund. The correct action is to mark it for cancellation before the next renewal date and set a calendar reminder -- not to cancel immediately and lose the remaining paid period.

8. **Note all shared subscriptions explicitly.** If a subscription is used by a partner, roommate, child, or shared across a family plan, the analysis must reflect the user's effective per-user cost and note that cancellation requires coordination. Canceling a shared Netflix account unilaterally is a household decision, not a solo one.

9. **Include the "Negotiate" action for eligible subscriptions.** Many users are unaware that gym memberships, satellite radio, internet service, and some streaming services offer significant retention discounts (typically 20-50% off for 3-6 months) to customers who call or chat to cancel. This action saves money without losing the service.

10. **Always include the Recovered Funds Allocation and 6-month re-audit reminder.** Research on behavioral economics consistently shows that savings without a designated destination are absorbed by other spending within 90 days. Naming a specific destination for recovered funds -- emergency fund, a specific debt, a savings goal -- increases the probability that the savings actually materialize. The re-audit reminder addresses subscription creep, which is a recurring problem, not a one-time fix.

11. **Do not recommend specific competing services as replacements for canceled subscriptions.** The audit's job is to cut and optimize, not to introduce new subscriptions. If the user asks about alternatives, redirect to a comparison or recommendation skill.

12. **Treat "Unknown" charges with separate urgency from "Dormant" ones.** An unrecognized charge may be unauthorized (fraud), a subscription under a business name different from the consumer product, or a family member's subscription. Do not recommend canceling an unknown charge -- recommend identifying it first, then deciding. If it turns out to be unauthorized, the path is a dispute with the bank or card issuer, not a subscription cancellation.

---

## Edge Cases

### The User Cannot Remember Their Subscriptions (Self-Report Incomplete)

If the user cannot provide a concrete list, do not attempt an audit from memory -- it will be unreliable. Instruct them to complete a systematic statement review first, then return with the actual list. Provide a concrete retrieval checklist:
- Pull the last 3 months of each credit card statement and highlight every charge that recurs in 2 or more months
- Check Apple subscriptions: Settings > [Name] > Subscriptions
- Check Google Play: Play Store > Profile icon > Payments & Subscriptions > Subscriptions
- Check PayPal: Settings > Payments > Manage Automatic Payments
- Search email inbox for: "receipt", "renewal", "subscription", "payment confirmation" -- date range: last 12 months
- Check Amazon: Account > Memberships & Subscriptions

The 3-month statement review is not optional -- annual subscriptions, quarterly billings, and irregular-cycle services will be missed on any shorter window.

### Annual Subscriptions Paid Months Ago

These subscriptions are often invisible in monthly reviews but represent locked-in future spending. Handle them as follows:
- Include in inventory with the prorated monthly cost equivalent (annual amount ÷ 12)
- Record the actual renewal date
- If the subscription is dormant or low-value, do NOT recommend immediate cancellation unless the service offers a prorated refund (most do not)
- Recommend setting a calendar reminder 30 days before the renewal date with the action to cancel -- this gives time to evaluate and act before auto-renewal
- Note: some annual subscriptions (particularly software) can be canceled immediately with a credit note or prorated refund -- this is worth a 5-minute inquiry to customer support if the annual cost is significant (above $50)

### Free Trials That Have Already Converted Without the User Noticing

This is a high-urgency scenario that requires separate handling:
- Identify when the trial converted by checking the first actual charge date on the statement
- If the conversion happened within the past 7-14 days and the service has not been used, many companies will provide a full refund upon request -- this is worth a customer service inquiry
- If the conversion happened more than 30 days ago with no use, refund is unlikely but cancellation is still worth pursuing to prevent future charges
- Flag these at the top of the action checklist with the language "refund possible if contacted promptly"
- Do not wait until the next billing cycle to act -- each cycle that passes reduces refund likelihood

### Household or Family Plan Subscriptions

When a subscription is shared, single-user analysis produces incorrect recommendations:
- Recalculate the user's effective cost: total plan cost ÷ number of active users
- If the user is the account holder, note that cancellation or downgrading affects all users -- this is a household decision
- If the user is a secondary user on someone else's plan, note that the user has no unilateral cancellation authority and the correct action is a conversation with the account holder
- For family plans where only 1-2 of the 4-6 slots are being used, the opposite analysis applies: adding more family members may reduce the per-person cost to below the individual plan price
- Flag when a solo user is paying for a family plan unnecessarily: common with streaming services where users signed up on a family/group tier and never added other members

### The User Wants to Cut Subscriptions but Keep Everything

This scenario is common and requires reframing toward optimization rather than elimination:
- Focus entirely on the Downgrade opportunities column
- Identify every service with an ad-supported tier (typically 30-45% cheaper)
- Identify every service on monthly billing where switching to annual would save 10-20% -- only recommend this if the user intends to keep the service for 12+ months
- Check for lesser-known discount pathways: student discounts, military/veteran discounts, employer benefit programs (many large employers offer subsidized gym memberships or software subscriptions), credit card perks that include certain subscriptions, and bundled pricing (some carriers bundle streaming services at no additional cost)
- Even without cancellations, downgrade-only savings of $20-$40/month ($240-$480/year) are common in a typical 10-subscription household

### The User Has Accumulated Subscriptions Across Multiple Household Members' Accounts

When a household has multiple people each with individual subscriptions, identify overlap at the category level:
- Two people each paying for individual music streaming when a family plan covers 6 users for roughly the same price
- Multiple cloud storage plans when a single family/shared storage plan would cover total storage needs
- Individual streaming subscriptions where a bundle (e.g., a three-service bundle) could cover all three at a combined discount
- Present the "consolidation savings" as a separate line item in the Savings Summary -- this is a different action from individual cancellation

### Subscriptions Funded by "Invisible" Payment Methods

PayPal, Apple Pay, and virtual card numbers mask recurring charges in ways that standard bank statement review misses:
- PayPal automatic payments do not appear on credit card statements -- they must be checked separately
- Virtual card numbers (from privacy-focused payment services) may not be obviously identifiable on statements
- Gift card balances linked to accounts may have been funding a "free" subscription that will convert to paid billing when the balance depletes
- For any subscription the user cannot identify a current payment method for, recommend checking PayPal automatic payments and any virtual card management dashboards before assuming the subscription is inactive

### The User Is Facing a Specific Financial Hardship and Needs Maximum Cuts Immediately

When the user's framing is "I need to cut everything I can right now" due to job loss, medical bills, or sudden income reduction:
- Reprioritize the output to lead with the Savings Summary total and the 90-Day Action Checklist
- Escalate every dormant and infrequent subscription to "Cancel" rather than allowing a "consider" disposition
- Add negotiation actions to internet, phone, gym, and insurance providers in addition to subscription services -- these are often not included in a standard subscription audit but represent the highest-value negotiation opportunities in a hardship scenario
- Note that some services have explicit hardship pause programs (some gyms, some software companies, some internet providers) -- worth a direct inquiry before canceling
- Flag the financial hardship context and recommend that the user also consult the `budget-planning` skill for a complete income-versus-expenses review after completing this audit

---

## Example

**Input:**
"I feel like I'm bleeding money on subscriptions. Let me tell you what I think I have: Netflix ($15.49/month), Hulu with Live TV ($82.99/month), Disney+ ($13.99/month), Paramount+ ($11.99/month), Apple TV+ ($9.99/month), Spotify ($10.99/month), iCloud 200GB ($2.99/month), Google One 100GB ($1.99/month), Microsoft 365 Personal ($9.99/month), Adobe Lightroom ($9.99/month), Headspace ($12.99/month), Amazon Prime ($14.99/month), DoorDash DashPass ($9.99/month), Peloton app ($12.99/month), a gym membership ($55/month), a HelloFresh meal kit (2 people, 3 meals/week at about $68/week), and I think there's a LinkedIn Premium I started for a job search but I got a job 4 months ago so I think it's still on ($39.99/month). I also have some random stuff I can't remember clearly."

**Output:**

## Subscription Audit Results

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Consult a qualified financial professional before making significant financial decisions.

### Total Subscription Burden

- **Current monthly spend:** $425.27 (known) + unidentified charges
- **Current annual spend (known subscriptions):** $5,103.24
- **Subscriptions reviewed:** 17 (plus unidentified -- see action checklist)
- **Recommended for immediate cancellation:** 5
- **Recommended for downgrade:** 4
- **Estimated monthly savings (confirmed actions):** $177.94
- **Estimated annual savings (confirmed actions):** $2,135.28
- **Post-audit monthly spend:** $247.33 (after all recommended actions)

---

### Full Subscription Inventory

| # | Service | Category | Monthly Cost | Annual Cost | Billing Cycle | Usage Tier | Action |
|---|---------|----------|-------------|-------------|---------------|------------|--------|
| 1 | Netflix (Standard) | Streaming | $15.49 | $185.88 | Monthly | Regular | Keep |
| 2 | Hulu with Live TV | Streaming + Live TV | $82.99 | $995.88 | Monthly | Regular | Downgrade |
| 3 | Disney+ | Streaming | $13.99 | $167.88 | Monthly | Light | Downgrade |
| 4 | Paramount+ | Streaming | $11.99 | $143.88 | Monthly | Infrequent | Cancel |
| 5 | Apple TV+ | Streaming | $9.99 | $119.88 | Monthly | Infrequent | Cancel |
| 6 | Spotify | Music | $10.99 | $131.88 | Monthly | Heavy | Keep |
| 7 | iCloud 200GB | Cloud Storage | $2.99 | $35.88 | Monthly | Heavy | Keep |
| 8 | Google One 100GB | Cloud Storage | $1.99 | $23.88 | Monthly | Unknown | Investigate |
| 9 | Microsoft 365 | Productivity | $9.99 | $119.88 | Monthly | Regular | Keep |
| 10 | Adobe Lightroom | Software | $9.99 | $119.88 | Monthly | Light | Evaluate |
| 11 | Headspace | Wellness | $12.99 | $155.88 | Monthly | Dormant | Cancel |
| 12 | Amazon Prime | Shopping/Streaming | $14.99 | $179.88 | Monthly | Heavy | Keep |
| 13 | DoorDash DashPass | Delivery | $9.99 | $119.88 | Monthly | Light | Cancel |
| 14 | Peloton App | Fitness | $12.99 | $155.88 | Monthly | Infrequent | Duplicate/Cancel |
| 15 | Gym Membership | Fitness | $55.00 | $660.00 | Monthly | Light | Negotiate |
| 16 | HelloFresh (3 meals, 2 people, weekly) | Meal Kit | $294.67 | $3,536.04 | Weekly ($68/wk) | Regular | Downgrade |
| 17 | LinkedIn Premium | Professional | $39.99 | $479.88 | Monthly | Dormant | Cancel |
| | **TOTAL** | | **$425.27** | **$5,103.24** | | | |

*Note: HelloFresh monthly cost = $68 x 52 weeks ÷ 12 months = $294.67/month.*
*Note: Google One 100GB -- you likely have iCloud as your primary storage. Clarify whether this is actively used before canceling.*

---

### Cost Per Use Analysis (subscriptions over $5/month)

| Service | Annual Cost | Est. Annual Uses | Cost Per Use | Benchmark | Value Rating |
|---------|-------------|-----------------|-------------|-----------|-------------|
| Netflix | $185.88 | ~200 sessions | $0.93 | $0.50--$2.00 | Good |
| Hulu with Live TV | $995.88 | ~150 sessions | $6.64 | > $5.00 | Poor for price |
| Disney+ | $167.88 | ~30 sessions | $5.60 | > $5.00 | Poor |
| Paramount+ | $143.88 | ~10 sessions | $14.39 | > $5.00 | Very Poor |
| Apple TV+ | $119.88 | ~8 sessions | $14.99 | > $5.00 | Very Poor |
| Spotify | $131.88 | ~350 sessions | $0.38 | < $0.50 | Excellent |
| Microsoft 365 | $119.88 | ~200 sessions | $0.60 | $0.50--$2.00 | Good |
| Adobe Lightroom | $119.88 | ~15 sessions | $7.99 | > $5.00 | Poor |
| Headspace | $155.88 | ~3 sessions | $51.96 | > $50 | Cancel |
| Amazon Prime | $179.88 | ~300 uses | $0.60 | < $0.50 | Excellent |
| DoorDash DashPass | $119.88 | ~6 orders | $19.98 | > $15 | Poor |
| Peloton App | $155.88 | ~8 sessions | $19.49 | > $15 | Poor/Duplicate |
| Gym | $660.00 | ~30 visits | $22.00 | > $15 | Poor -- negotiate |
| HelloFresh | $3,536.04 | ~150 meals | $23.57/meal | Benchmark varies | Reduce frequency |
| LinkedIn Premium | $479.88 | ~5 sessions | $95.98 | > $50 | Immediate Cancel |

---

### Cancellation Priority List

| Priority | Service | Action | Monthly Savings | Annual Savings | Next Billing | Cancellation Notes |
|----------|---------|--------|----------------|----------------|-------------|--------------------|
| 1 | LinkedIn Premium | Cancel | $39.99 | $479.88 | Check immediately | Dormant 4 months since job search ended. Cancel via Settings > Premium > Manage. Expect a retention offer -- decline it. No severance from canceling; your profile stays. |
| 2 | HelloFresh | Downgrade | $147.34 | $1,768.08 | Check next delivery schedule | Reduce from 3 meals/week to 2 meals/week: ~$48/week = $208/mo. Alternatively, pause for 4 weeks to evaluate. Manage in account settings. |
| 3 | Hulu with Live TV | Downgrade | $70.00 | $840.00 | Check billing date | Downgrade to Hulu (No Ads) at $17.99/month. Live TV features appear unused if Netflix is your primary streaming watch. Saves $65/mo vs. current plan. |
| 4 | Headspace | Cancel | $12.99 | $155.88 | Check immediately | Dormant -- last use unclear. Free alternatives (e.g., breathing exercises, free apps) available. Cancel via app settings or web account. Refund unlikely after 30 days. |
| 5 | Paramount+ | Cancel | $11.99 | $143.88 | Check billing date | Used ~10 times per year. Resubscribe for $2-3 months when a specific show premieres instead of paying year-round. Saves $9/mo vs. subscribing 3 months/year. |
| 6 | Apple TV+ | Cancel | $9.99 | $119.88 | Check billing date | Used ~8 times per year. Same strategy as Paramount+ -- resubscribe for specific content, then cancel. May also come free with Apple device purchase -- verify if yours includes a free period. |
| 7 | Peloton App | Cancel | $12.99 | $155.88 | Check billing date | Duplicate of gym membership. If you have gym access to cardio equipment, the Peloton app is redundant. If your gym closes or you travel, reconsider. Cancel via app account settings. |
| 8 | DoorDash DashPass | Cancel | $9.99 | $119.88 | Check billing date | Only 6 estimated orders per month. At $9.99/month, DashPass breaks even at ~5-6 qualifying orders/month -- you are at breakeven, not benefiting materially. Free delivery minimums can replace it. |

---

### Downgrade Opportunities

| Service | Current Plan | Current Monthly | Recommended Plan | New Monthly | Monthly Savings | Annual Savings | Notes |
|---------|-------------|----------------|-----------------|------------|----------------|----------------|-------|
| Hulu with Live TV | Hulu + Live TV | $82.99 | Hulu (No Ads) | $17.99 | $65.00 | $780.00 | Only if live TV is not a daily need. Already have Netflix for on-demand. |
| Disney+ | Premium (No Ads) | $13.99 | Disney+ Basic (with ads) | $7.99 | $6.00 | $72.00 | Light usage doesn't justify ad-free premium. |
| HelloFresh | 3 meals/wk, 2 people | $294.67 (eff.) | 2 meals/wk, 2 people | ~$195.00 (eff.) | $99.67 | $1,196.04 | Or reduce to 2 meals/wk + supplement with groceries on off nights. |
| Adobe Lightroom | Monthly billing | $9.99 | Annual pre-pay | ~$8.32 (eff.) | $1.67 | $20.04 | Only if photography is a consistent hobby. Consider canceling if usage stays at ~15 sessions/year. |

---

### Subscriptions to Keep (no action needed)

| Service | Monthly Cost | Justification |
|---------|-------------|---------------|
| Netflix | $15.49 | Regular use, $0.93/session -- good value, primary on-demand streaming anchor |
| Spotify | $10.99 | Heavy daily use, $0.38/session -- excellent value |
| iCloud 200GB | $2.99 | Heavy daily use, essential device utility |
| Amazon Prime | $14.99 | Heavy use across shipping + streaming, $0.60/use -- excellent combined value |
| Microsoft 365 | $9.99 | Regular work use, $0.60/session -- good value |

---

### Subscriptions Requiring Investigation Before Action

| Service | Issue | Recommended Action |
|---------|-------|--------------------|
| Google One 100GB | You already have iCloud 200GB for Apple device storage. Google One may be redundant unless you use Google Drive actively for documents or Android device backup. | Check Google Photos backup status and Google Drive usage. If iCloud covers all your storage needs, cancel Google One ($1.99/month saved). |
| Gym Membership | $22.00/visit at current usage is above the value threshold but may improve. | Before canceling, call the gym and ask for a reduced rate or temporary pause (many gyms offer hardship pauses or loyalty rates of $35-$45/month). If usage does not increase to 10+ visits/month within 90 days, cancel and use the Peloton app reactivation or a pay-per-visit approach instead. |

---

### Savings Summary

| Category | Monthly Savings | Annual Savings |
|----------|----------------|----------------|
| Cancellations (LinkedIn, Headspace, Paramount+, Apple TV+, Peloton App, DashPass) | $97.94 | $1,175.28 |
| Downgrades (Hulu, Disney+, HelloFresh) | $170.67 | $2,048.04 |
| Negotiation target (Gym) | ~$15.00 estimated | ~$180.00 estimated |
| **Total Potential Savings** | **$283.61** | **$3,403.32** |
| **Post-Audit Monthly Spend** | **$141.66** | **$1,699.92** |

*Post-audit spend assumes: Keep Netflix, Spotify, iCloud, Amazon Prime, Microsoft 365; downgrade Hulu to $17.99, Disney+ to $7.99; downgrade HelloFresh to 2 meals/week; negotiate gym to $40; cancel all others. Includes investigating and potentially canceling Google One.*

---

### Recovered Funds Allocation

**Redirect approximately $250-$284/month as follows:**

Before choosing an allocation, answer one question: Do you have 3-6 months of living expenses in a liquid savings account?

- **If no emergency fund (or less than 1 month):** Direct 100% ($250/month) to a high-yield savings account until you have at least 1 month of expenses. Then redirect excess toward debt or long-term savings.
- **If you have high-interest credit card debt (above 18% APR):** Direct recovered funds toward your highest-rate balance first. At $250/month applied to credit card debt, most balances under $5,000 can be eliminated within 18-24 months.
- **If your emergency fund and debt are in good shape:** Consider whether you are capturing your full employer 401(k) match. If not, increasing contributions by $250/month is often the highest-yield financial move available.

**Opportunity cost framing:** $250/month recovered from subscriptions, redirected to savings or investment, grows to approximately $17,400 in 5 years and $43,100 in 10 years at a 7% average annual return. This is not a prediction -- it illustrates the long-term scale of subscription creep.

---

### 90-Day Action Checklist

**This week -- act immediately:**
- [ ] **LinkedIn Premium:** Cancel now. Settings > Premium > Manage Subscription. It has been charging $39.99/month for 4+ months of non-use.
- [ ] **Headspace:** Cancel now. App Settings > Manage Subscription. Refund is unlikely but possible if within 14 days of last charge -- worth a 5-minute support inquiry.
- [ ] **Peloton App:** Cancel now. Redundant with gym membership.

**Before your next billing dates (check each service's next billing date in account settings):**
- [ ] **Hulu with Live TV:** Downgrade to Hulu (No Ads) plan at $17.99. Account > Plan.
- [ ] **Disney+:** Downgrade to Disney+ Basic (with ads) at $7.99. Account > Subscription.
- [ ] **HelloFresh:** Reduce delivery to 2 meals/week, 2 people. Or pause for 4 weeks to evaluate. Manage at hellofresh.com > Plan Settings.
- [ ] **Paramount+:** Cancel. Resubscribe only when a specific show you want is available.
- [ ] **Apple TV+:** Cancel. Resubscribe only for specific content windows.
- [ ] **DoorDash DashPass:** Cancel. Free delivery minimums are sufficient at your current order frequency.

**Within 30 days:**
- [ ] **Gym:** Call the gym's membership desk and ask: "I'm considering canceling. Is there a lower-rate option or a pause I can use?" Target: $40/month or below. If they refuse, set a 90-day review.
- [ ] **Google One:** Check Google Drive and Google Photos usage. If iCloud covers all your storage, cancel Google One ($1.99/month saved).
- [ ] **Adobe Lightroom:** Evaluate usage over the next 30 days. If still under 15 sessions in a month, consider canceling and using a free alternative or a one-time purchase editor.
- [ ] **Unidentified subscriptions:** Review the past 3 months of every bank and credit card statement line by line. Flag any recurring charge not accounted for in this audit. Check PayPal automatic payments and Apple/Google subscription settings.

**Ongoing:**
- [ ] Set a calendar event titled "Subscription Re-Audit" for 6 months from today. Schedule 45 minutes.
- [ ] After any free trial signup, set a 10-day calendar reminder to evaluate and cancel if not actively using it.
- [ ] If you receive a price increase notification from any retained service, treat it as a re-audit trigger for that service
