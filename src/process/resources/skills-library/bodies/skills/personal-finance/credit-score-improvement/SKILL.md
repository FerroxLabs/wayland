---
name: credit-score-improvement
description: |
  Builds a 3-12 month action plan for improving a credit score based on the user's current credit profile. Identifies specific actions for each credit score component, estimates relative impact, and creates a sequenced timeline of steps. Produces a dated improvement plan the user can follow month by month.
  Use when the user wants to improve their credit score over time, needs a structured plan for credit building, or asks how to raise their score.
  Do NOT use for understanding what a credit score is (use credit-score-explainer), debt payoff sequencing (use debt management skills), or credit repair disputes.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance debt-management planning goal-setting"
  category: "personal-finance"
  subcategory: "life-stage-financial"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---
# Credit Score Improvement Plan

> **Disclaimer:** This skill provides educational information about credit scoring concepts and general guidance for personal financial planning. It does NOT constitute financial advice, credit counseling, or legal advice. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, licensed credit counselor, or attorney before making financial decisions that affect your creditworthiness.

## When to Use

**Use this skill when:**
- The user explicitly wants a structured, multi-month plan to raise their credit score
- The user has a specific credit-dependent goal with a target date (mortgage pre-approval, apartment application, auto loan, business financing, rate reduction on existing accounts)
- The user wants to understand which specific actions will move the needle on their score and in what sequence
- The user has received a denial for credit and wants a recovery roadmap
- The user has recently experienced a credit setback (missed payment, maxed card, hard inquiry spike) and needs a corrective plan
- The user is preparing for a major credit application 3-12 months from now and wants to optimize their profile in advance
- The user knows their approximate score and wants to understand the fastest path to the next threshold (e.g., 620 → 660, 680 → 720, 740 → 760)

**Do NOT use when:**
- The user does not yet understand what a credit score is or how it is calculated -- use `credit-score-explainer` first, then return to this skill
- The user wants to dispute inaccurate items on their credit report -- this requires knowledge of FCRA dispute procedures and is outside this skill's scope; refer to credit dispute guidance
- The user's primary goal is paying off debt, not improving their score per se -- use `debt-snowball-planner` or `debt-avalanche-planner`, though note that debt payoff and score improvement are often complementary
- The user is asking about credit repair companies, pay-for-delete negotiations, or 609 letter strategies -- these involve legal and contractual complexity beyond this skill
- The user wants to understand the mortgage underwriting process specifically -- credit score is one input among many in that process; use a mortgage readiness skill
- The user is asking about business credit scores (Dun & Bradstreet Paydex, FICO SBSS) -- those operate on different models and scales than personal FICO or VantageScore
- The user has an active bankruptcy proceeding -- score improvement must wait until the proceeding is resolved; general budgeting guidance is more appropriate

---

## Process

### Step 1: Gather the Credit Profile Inputs

Before building any plan, you need a complete picture of the user's credit situation. Ask for all of the following, explicitly noting which fields are optional but helpful:

- **Current score and score type** -- FICO 8 is the most commonly used version; VantageScore 3.0 or 4.0 is common through free monitoring tools. Note which model the user is referencing, as scores from different models can differ by 20-40 points on the same underlying data.
- **Payment history details** -- How many late payments in the past 24 months? How late (30-day, 60-day, 90-day+)? Most recent late payment date? Any accounts currently past due?
- **Credit card accounts** -- For each card: current balance, credit limit, and whether the account is open or closed. Calculate combined utilization and per-card utilization.
- **Installment loan accounts** -- Auto loans, student loans, personal loans, mortgages. Note original balance, current balance, and payment status.
- **Negative items** -- Collections (medical vs. non-medical, age, paid vs. unpaid), charge-offs, repossessions, public records (bankruptcies, judgments, tax liens). Note the date of first delinquency for each.
- **Age of oldest account** -- The single most important history-length input.
- **Average age of all accounts** -- If the user does not know this, ask for approximate account open dates.
- **Hard inquiries in the last 24 months** -- How many, and when?
- **Credit mix** -- Does the user have at least one revolving account (credit card) AND at least one installment account (loan)?
- **Target score and reason** -- What threshold do they need, and by when?
- **Financial capacity for paydown** -- Roughly how much can the user apply to balance reduction monthly? This determines whether high-impact actions are feasible.

If the user cannot supply exact figures, work with ranges and flag assumptions explicitly in the plan.

### Step 2: Score the Current Profile Against Each FICO Component

Map the user's inputs to the five FICO 8 scoring components, which have the following approximate weights:

| Component | FICO Weight | Primary Inputs |
|---|---|---|
| Payment History | 35% | Late payments, collections, charge-offs, bankruptcies |
| Amounts Owed (Utilization) | 30% | Revolving utilization -- per card and aggregate |
| Length of Credit History | 15% | Age of oldest account, average age of all accounts, age of newest account |
| Credit Mix | 10% | Presence of both revolving and installment accounts |
| New Credit | 10% | Hard inquiries in past 24 months (primary impact in first 12), new account openings |

For each component, assess status as: **Positive**, **Neutral**, **Recoverable Negative** (addressable within the plan timeline), or **Aging Negative** (accurate derogatory item that must age off).

Critical thresholds to assess:

- **Payment history:** Any 30-day late in the past 12 months is highly damaging. 24-month clean payment history is the recovery milestone most lenders consider favorable. A 90-day late is roughly 3x more damaging than a 30-day late in FICO models.
- **Utilization:** The impact is non-linear. Scores degrade at 30%, degrade significantly at 50%, and are severely penalized above 70%. Best scores typically require aggregate utilization below 10%. Per-card utilization matters -- a single maxed card hurts even if aggregate utilization is low.
- **History length:** Accounts younger than 2 years contribute minimally to positive history scoring. Closing an account removes it from the "active account" calculation but keeps it in history for 10 years (positive) or 7 years (negative). Average age is a real factor -- opening a new account drops average age immediately.
- **Credit mix:** A user with only credit cards is missing the installment loan signal. A user with only an auto loan and no revolving credit is missing the revolving management signal. Adding the missing type can produce 10-20 point gains, but only when the account has some age.
- **New credit:** Each hard inquiry costs roughly 5-10 points and persists on the report for 2 years but affects scoring primarily in the first 12 months. Mortgage and auto loan inquiries within a 14-45 day window are rate-shopping consolidated into one inquiry in most FICO models.

### Step 3: Identify the Highest-Leverage Actions

Rank every available action using this two-axis framework:

**Speed of impact:**
- Immediate (within one billing cycle, 30-45 days): Paying down revolving balances, paying off collections in states where paid collections are removed
- Short-term (1-3 months): Establishing autopay, resolving any currently delinquent accounts
- Medium-term (3-6 months): Building consecutive on-time payment streaks, receiving credit limit increases
- Long-term (6-24 months): Adding a new account and aging it in, waiting for a derogatory item's impact to diminish
- Very long-term (24+ months): Negative items aging to 7-year removal point, bankruptcy discharge aging

**Magnitude of impact:**
- High: Resolving current delinquencies, reducing utilization from above 70% to below 30%, establishing first positive revolving account on a thin file
- Medium: Reducing utilization from 30-50% range to below 10%, building 12+ month streak of on-time payments after a late
- Low: Correcting credit mix when it's the limiting factor, adding an authorized user tradeline, reducing hard inquiries by pausing applications

Prioritize actions in this order:
1. Stop any ongoing damage first (cure any current delinquencies, set up autopay)
2. Then address utilization (highest single lever for fast improvement)
3. Then build payment history consistency
4. Then strategically address credit mix or length issues
5. Finally, optimize for inquiries and application timing

### Step 4: Determine Feasibility Given Financial Capacity

Utilization improvement is powerful but requires actual cash. Map the user's stated monthly capacity to a concrete paydown schedule:

- Calculate the aggregate utilization reduction per dollar of paydown: divide total revolving balance reduction needed by monthly available cash
- If reaching below 30% aggregate utilization within 3 months is feasible, plan for it. If it requires 8+ months, build a gradual schedule.
- Always prioritize paying the highest-utilization card first (per-card utilization matters independently of aggregate)
- If the user can reach below 10% aggregate utilization before their target application date, prioritize that -- the difference between 9% and 29% utilization can be 20-40 points on a mid-range score

Note: A balance transfer to consolidate high-utilization cards onto a lower-rate installment loan can simultaneously reduce revolving utilization AND add installment credit mix, but it requires a new hard inquiry and a new account -- evaluate the trade-off based on the user's timeline.

### Step 5: Build the Month-by-Month Dated Timeline

Assign specific actions to calendar months. The plan structure should follow this logic:

**Month 1:** Emergency stabilization + quick wins
- Cure any current delinquencies (even if just making a minimum payment to restore current status)
- Set up autopay for the minimum on all accounts to prevent future missed payments
- Reduce the highest-utilization card as aggressively as cash allows
- Pause all planned credit applications

**Months 2-3:** Momentum building
- Continue balance paydown schedule with specific monthly targets
- Confirm autopay is working (check statements manually the first two months)
- If any account is in collections, evaluate whether it is within the statute of limitations and whether paying or settling it will help or hurt (see Edge Cases)
- Begin preparing for credit limit increase requests (most issuers require 6+ months of on-time history before approving increases)

**Months 4-6:** Foundation strengthening
- Request credit limit increases on cards where the user has 6+ months of on-time payment history (do this by phone or online -- most issuers do a soft pull for existing customers, not a hard inquiry)
- Evaluate whether opening a new account type would help credit mix (only if timeline allows for 6+ months before the goal application date)
- Continue monitoring for reporting errors that should be disputed

**Months 7-12:** Pre-application optimization
- In the final 30-60 days before a credit application, drive revolving utilization as low as possible -- pay balances before statement closing dates (not just before due dates) so lower balances are reported to the bureaus
- Avoid any new hard inquiries in the 90 days before a major application
- Pull reports from all three bureaus and verify accuracy

### Step 6: Configure Monitoring and Feedback Loops

Provide a specific monitoring protocol:

- Check score monthly using a consistent source (the same scoring model each time, since cross-model comparisons are misleading)
- Check credit utilization at mid-cycle, not just monthly -- if you need a specific utilization percentage reported for an upcoming application, pay the balance down before the statement closing date, not the due date
- Set up account alerts for payment due dates, balance thresholds, and new inquiries
- Review the full credit report (not just the score) once per quarter using the free annual report service available through the three major bureaus
- Track three numbers monthly: aggregate utilization percentage, number of consecutive on-time payments since the last late, and number of months since the most recent derogatory event

### Step 7: Set Specific Milestones and Score Thresholds

Credit scoring models have known threshold bands where scoring behavior changes significantly. Help the user understand which band they are in and what the next meaningful milestone looks like:

| FICO Score Range | Common Designation | Key Milestone Behaviors |
|---|---|---|
| 300-579 | Poor | Most conventional credit products unavailable; secured cards and credit-builder loans are primary tools |
| 580-619 | Fair / Near-Prime | Some subprime products available; crossing 620 opens more options |
| 620-659 | Below Average | Minimum for FHA mortgage programs; crossing 640 improves auto loan rates meaningfully |
| 660-699 | Average | Minimum for many conventional products; crossing 700 is a major psychological and practical threshold |
| 700-739 | Good | Most mainstream products available at reasonable rates; crossing 720 gets better mortgage pricing |
| 740-779 | Very Good | Near-best rates on most products; crossing 760 often unlocks best-tier mortgage pricing |
| 780-850 | Exceptional | Best available rates; marginal improvement has minimal practical benefit |

Set the user's milestone as the next meaningful threshold above their current score, explain what unlocks at that threshold, then set the longer-term milestone if their timeline supports it.

### Step 8: Deliver the Formatted Plan and Calibrate Expectations

Produce the Output Format below, then explicitly state:
- What is in the user's control (utilization, payment consistency, application pausing)
- What is not in the user's control (aging timelines, other parties' reporting delays, scoring model opacity)
- A realistic range of expected improvement: do NOT promise specific point gains, but DO provide context such as "reducing utilization from 52% to under 10% is typically among the highest-impact single actions available at this score range, but the exact result depends on your complete profile and the model used by your lender"
- That different lenders use different FICO versions (FICO 8 is most common but FICO 9, FICO Auto 8, FICO Bankcard 8, and FICO Mortgage are also used) and the user's score under one model may differ from the score a specific lender pulls

---

## Output Format

```
## Credit Score Improvement Plan

> **Disclaimer:** Educational information only. Not financial advice.
> Consult a qualified financial professional before making credit decisions.

---

### Current Credit Profile Assessment

| Component | Current Status | Weight in FICO 8 | Current Impact |
|---|---|---|---|
| Score | [XXX] ([Model, e.g., FICO 8]) | -- | [Tier name] |
| Payment History | [X late payments in past 24 mo; most recent: X months ago] | 35% | [Positive / Recoverable Negative / Aging Negative] |
| Utilization -- Aggregate | [XX% ($X,XXX balance / $X,XXX total limit)] | 30% | [Positive <10% / Caution 10-29% / Negative 30-49% / High Risk 50%+] |
| Utilization -- Worst Card | [Card name or Card 1: XX%] | 30% | [Status] |
| History Length -- Oldest Account | [X years X months] | 15% | [Positive / Neutral / Thin] |
| History Length -- Average Age | [X years X months] | 15% | [Positive / Neutral / Thin] |
| Credit Mix | [Revolving only / Installment only / Both] | 10% | [Positive / Missing element] |
| Hard Inquiries (24 months) | [X inquiries; most recent: X months ago] | 10% | [Low / Moderate / High] |
| Negative Items | [Collections: X (oldest: X yr); Charge-offs: X; Bankruptcies: X] | 35% | [Active damage / Aging off / None] |

### Score Milestone Map

- **Current score:** [XXX]
- **Next meaningful threshold:** [XXX] -- unlocks [specific benefit at this threshold]
- **Target score:** [XXX+]
- **Goal:** [Mortgage / Apartment / Auto loan / Rate reduction / General improvement]
- **Target date:** [Month, Year]
- **Months available:** [X]

### Limiting Factor Analysis

The highest-priority issues dragging your score are ranked below. Addressing them in this order will produce the fastest recovery:

1. **[#1 issue -- e.g., "High revolving utilization: 52%"]** -- Estimated relative impact: High
   - Why: [Brief explanation specific to this user's data]
   - Actionable: [Yes / Partially / No -- requires time]

2. **[#2 issue -- e.g., "Recent late payment: 4 months ago"]** -- Estimated relative impact: High
   - Why: [Brief explanation]
   - Actionable: [Status]

3. **[#3 issue if applicable]** -- Estimated relative impact: Medium
   - Why: [Brief explanation]
   - Actionable: [Status]

---

### Month-by-Month Action Plan

#### Month 1: Stabilize and Win Quickly
*Focus: Stop ongoing damage and execute high-impact immediate actions.*

| Action | Component | Relative Impact | Effort | Cost / Capacity Required |
|---|---|---|---|---|
| [e.g., Set up autopay for minimum payment on all accounts] | Payment History | High | 30 minutes | $0 time cost |
| [e.g., Pay Card 1 from $X,XXX down to $XXX (X% utilization)] | Utilization | High | Requires $X,XXX | Immediate if funds available |
| [e.g., Pause all credit applications] | New Credit | Low | Decision only | $0 |
| [e.g., Cure any currently delinquent account] | Payment History | Critical | Contact lender | Requires payment of past-due amount |

*Month 1 target utilization: [XX%]*

#### Month 2: Confirm Systems Are Working
*Focus: Verify autopay executed, continue paydown, no new lates.*

| Action | Component | Relative Impact | Effort |
|---|---|---|---|
| [e.g., Manually verify all autopayments posted correctly] | Payment History | High | 15 minutes |
| [e.g., Pay Card 1 down to $XXX per paydown schedule] | Utilization | High | Requires $XXX |
| [e.g., Check credit report for new errors or unexpected changes] | All | Medium | 20 minutes |

*Month 2 target utilization: [XX%]*

#### Month 3: Build the Streak
*Focus: Establish consecutive on-time payment record; 3-month streak is the first milestone.*

| Action | Component | Relative Impact | Effort |
|---|---|---|---|
| [e.g., Continue paydown toward target utilization] | Utilization | High | Requires $XXX |
| [e.g., Confirm 3 consecutive on-time payments on all accounts] | Payment History | High | Monitor |
| [e.g., Evaluate if any collections are unverified or beyond reporting limit] | Payment History | High if applicable | Review report |

*Month 3 target utilization: [XX%]*

#### Months 4-5: Request Limit Increases
*Focus: Leverage positive payment streak to increase available credit, which reduces utilization ratio.*

| Action | Component | Relative Impact | Effort |
|---|---|---|---|
| [e.g., Request credit limit increase on Card 1 (6 months of on-time payments)] | Utilization | Medium | Online request or call; likely soft pull |
| [e.g., Continue paydown schedule] | Utilization | High | Requires $XXX/month |
| [e.g., Evaluate credit mix gap -- do you need an installment account?] | Credit Mix | Low-Medium | Research only |

*Months 4-5 target utilization: [XX%]*

#### Month 6: Mid-Plan Review
*Focus: Assess progress against milestones, recalibrate if off-track.*

| Action | Component | Relative Impact | Effort |
|---|---|---|---|
| Pull full report from all three bureaus and verify accuracy | All | Variable | Free; 1 hour |
| Compare current score to Month 1 baseline | All | -- | Monitoring tool |
| Recalculate months remaining to goal and adjust paydown schedule | Utilization | -- | Recalculate |
| [User-specific action based on mid-plan status] | [Component] | [Impact] | [Effort] |

*Month 6 target utilization: [XX%]*

#### Months 7-[X-1]: Sustain and Strengthen
*Focus: Maintain momentum; avoid disrupting progress with new applications or spending spikes.*

| Action | Component | Relative Impact | Effort |
|---|---|---|---|
| Continue on-time payment streak | Payment History | High | Ongoing |
| Maintain utilization below [target]% | Utilization | High | Monthly monitoring |
| No new hard inquiries | New Credit | Low-Medium | Decision |
| [Any remaining credit mix or history actions specific to user] | [Component] | [Impact] | [Effort] |

#### Month [X]: Pre-Application Final Optimization
*Focus: Drive utilization to its lowest possible point before the credit application.*

| Action | Component | Relative Impact | Effort |
|---|---|---|---|
| Pay all revolving balances before statement closing dates (not due dates) so lowest balances are reported | Utilization | High | Requires available cash |
| Confirm no missed payments in full plan period | Payment History | High | Verify statements |
| Avoid all new hard inquiries for 60 days before application | New Credit | Low-Medium | Decision |
| Pull all three bureau reports; verify no new negative items | All | Variable | Free |
| Confirm which FICO version the target lender uses, if possible | All | -- | Call lender |

---

### Paydown Schedule (Utilization Track)

| Month | Target Balance -- Card 1 | Target Balance -- Card 2 | Aggregate Utilization | Monthly Payment Needed |
|---|---|---|---|---|
| Now | $[X,XXX] | $[X,XXX] | [XX%] | -- |
| Month 1 | $[X,XXX] | $[X,XXX] | [XX%] | $[XXX] |
| Month 2 | $[X,XXX] | $[X,XXX] | [XX%] | $[XXX] |
| Month 3 | $[X,XXX] | $[X,XXX] | [XX%] | $[XXX] |
| Month [X] | $[X,XXX] | $[X,XXX] | [XX%] | $[XXX] |

---

### Monthly Monitoring Protocol

Complete this checklist at the same time each month:

- [ ] Check credit score using the same model/tool as last month
- [ ] Verify all payments for the month posted as "on-time" on each account
- [ ] Calculate aggregate revolving utilization (total balances ÷ total limits)
- [ ] Calculate per-card utilization for any card above 30%
- [ ] Note any new hard inquiries since last month
- [ ] Track consecutive on-time months since last late: [counter]
- [ ] Compare score to previous month (expect variation; focus on 3-month trends)
- [ ] Note any accounts that opened, closed, or changed status

---

### Actions to AVOID During This Plan

| Action to Avoid | Why It Damages Progress |
|---|---|
| Closing old credit card accounts | Reduces total available credit (raises utilization ratio); closed accounts eventually age out of average age calculation |
| Applying for new credit unless strategically planned | Each hard inquiry costs 5-10 points; new accounts lower average account age immediately |
| Making large credit card purchases near your billing cycle close date | Spike in reported balance raises utilization even if paid in full |
| Paying only minimums when you have the capacity to pay more | Prolongs the high-utilization damage; utilization is calculated on the reported balance, not the amount you plan to pay |
| Paying late because "it was only a few days" | 30-day late is a hard threshold -- the damage is binary, not proportional to how late you were |
| Calling to dispute accurate information | Only inaccurate items can be removed; disputing accurate items wastes time and can draw attention to the account |
| Opening a new account solely to improve credit mix right before a major application | New account immediately lowers average age and creates a hard inquiry -- poor timing if you need the score in 60-90 days |

---

### Honest Expectations

**What you can control:**
- Payment consistency (100% in your control with autopay)
- Revolving utilization (directly proportional to how aggressively you pay down balances)
- New credit applications (a decision you make)
- Monitoring for errors and disputing inaccurate items

**What you cannot control:**
- How quickly creditors report updated balances (typically within 30-45 days of statement close)
- Scoring model version a specific lender uses
- The exact point impact of any individual action
- The aging timeline of derogatory items

**What realistic improvement looks like at your score range:**
[Calibrated narrative sentence: e.g., "A borrower at 620 who reduces utilization from 52% to under 10% and maintains clean payment history for 6 months often sees meaningful score improvement, but the exact outcome depends on your complete file. Treat this plan as optimizing the inputs you control -- the score improvement follows from those inputs."]
```

---

## Rules

1. **Never promise specific point gains.** Credit scoring models are proprietary algorithms. No external party can state with certainty that "paying down $1,800 will raise your score 40 points." Use relative impact tiers (high, medium, low) and narrative context instead. Violating this rule destroys credibility and may constitute misleading financial guidance.

2. **Distinguish between FICO 8 and other models.** The weights and thresholds used in this skill are for FICO 8, the most broadly used version. Mortgage lenders commonly use older FICO models (FICO 2, 4, and 5 from the three bureaus). Auto lenders may use FICO Auto scores. Bankcard-specific models weight utilization differently. Always note this uncertainty when the user has a specific lender in mind.

3. **Per-card utilization is independent of aggregate utilization.** A user with 5% aggregate utilization but one card at 95% utilization is being penalized on that card individually. The plan must address per-card utilization, not only aggregate. This is one of the most commonly missed nuances.

4. **The statement closing date, not the due date, is when balances are reported.** If a user wants to optimize the utilization figure reported to the bureaus for an upcoming application, they must pay down the balance before the statement closing date, not the payment due date (which is typically 21-25 days later). This is critical for timing-sensitive plans.

5. **Current delinquencies are always addressed before optimization.** An account that is currently 60 days past due is actively accumulating damage every 30-day reporting cycle. Bringing it current is non-negotiable and goes in Month 1, regardless of what other strategies are available. A plan that skips this to focus on utilization is incomplete.

6. **Collections treatment is not uniform.** Paying a collection account in full removes it from scoring under FICO 9 and VantageScore 4.0, but NOT under FICO 8 (still the most commonly used). Under FICO 8, a paid collection still shows on the report -- the account status changes to "paid collection" but the derogatory mark remains. Medical collections have special treatment under newer models. Always flag which model applies before advising on collections payment strategy.

7. **Credit limit increase requests require careful timing.** Most issuers perform a soft pull for existing customers requesting limit increases, but some issuers always perform a hard pull. Advise the user to call and ask whether the limit increase request will generate a hard inquiry BEFORE submitting the request. If the answer is yes and the user is within 90 days of a major credit application, delay the request.

8. **Authorized user status is a real but fragile tactic.** Being added as an authorized user on a family member's account with a long, low-utilization history can improve the user's score -- but this benefit disappears if that account is closed, the balance rises, or the primary holder misses a payment. Treat it as supplementary, not foundational, and always note the dependency on someone else's behavior.

9. **Negative items follow the 7-year rule from date of first delinquency, not date of last activity.** A common predatory practice is for collectors to "re-age" a debt by showing more recent activity, which would restart the clock. The FCRA establishes that the 7-year reporting clock starts from the original date of first delinquency. If a user's collection is approaching its 7-year mark, do NOT advise them to pay it or contact the collector if doing so might reset activity -- this is a legally significant nuance. Recommend they review the original delinquency date before taking action on old debts.

10. **Credit mix improvements have the least urgency at low scores.** The credit mix component is worth approximately 10% of a FICO score. At scores below 680, payment history and utilization issues dominate -- opening a new account type purely for credit mix purposes at this stage adds complexity (inquiry, new account age drop) that often outweighs the benefit. Prioritize credit mix interventions only when payment history is clean and utilization is already below 20%.

---

## Edge Cases

### User Has No Credit History ("Thin File")

A user with fewer than 3 accounts or less than 6 months of credit history may be "unscorable" under FICO 8 entirely. The plan shifts from "improvement" to "establishment":

- **First priority:** Open a secured credit card (requires a cash deposit equal to the credit limit; functions like a regular credit card for reporting purposes). Choose an issuer that reports to all three bureaus -- not all secured card issuers do.
- **Second priority:** Open a credit-builder loan through a credit union or community bank. These hold the loan proceeds in a savings account while you make payments, then release the funds when the loan is paid off. The payment history builds your file without requiring you to go into debt.
- **Authorized user route:** If a parent or partner with a strong, long-standing account will add the user as an authorized user, this can contribute history immediately -- but the account must have low utilization and a spotless payment record for it to help.
- **Timeline calibration:** A thin file user should not expect to be scorable until they have 6+ months of payment history on at least one account. Do not frame this plan around month-by-month score improvement in the early stages -- frame it around "building the foundation that will enable scoring."
- **Do NOT recommend:** Opening multiple accounts simultaneously. Each new account lowers average age further when the file is already thin. One account opened well is better than three accounts opened simultaneously.

### User Has a Recent Bankruptcy (Chapter 7 or Chapter 13)

A Chapter 7 bankruptcy remains on the credit report for 10 years from the filing date. A Chapter 13 remains for 7 years. During the first 1-2 years post-discharge, most conventional credit products are unavailable.

- **Immediately post-discharge:** The user's debt-to-income ratio may have actually improved dramatically -- some lenders will consider this. But the bankruptcy notation triggers automatic declines at most mainstream lenders.
- **Actionable steps years 1-2:** Secured credit card, credit-builder loan, meticulous on-time payment history. Do not attempt to add installment debt until the secured card is established and utilization is demonstrably managed.
- **Timeline for recovery milestones:** Many users can qualify for a secured FHA mortgage 2 years after a Chapter 7 discharge with demonstrated re-established credit and a down payment. Conventional mortgages typically require 4 years post-discharge. Auto loans often become available (at elevated rates) within 12-18 months with a sufficient down payment.
- **Do NOT frame this as a 3-month plan.** A post-bankruptcy credit improvement plan must be framed across 24-48 months with clear milestone markers at each year.

### User Has a Major Negative Item Approaching 7-Year Removal

If a user has a collection, charge-off, or other derogatory item that is 5-6.5 years old, the optimal strategy may be **to do nothing** about that item and let it age off the report naturally.

- Calculate the original date of first delinquency (DOFD). The item should be removed approximately 7 years after that date.
- If removal is within 18 months, build the plan around that removal date as a milestone -- the score improvement from natural removal of a derogatory item can be significant.
- Advise the user NOT to contact the collector about the old debt, as doing so can complicate the situation (note: paying does NOT restart the FCRA 7-year clock, but it can restart the statute of limitations for legal collection action in some states -- a different but related concern).
- If the item has already been on the report 7+ years and has not been removed, the user can file a dispute with the credit bureaus requesting removal under FCRA Section 605 -- this is one of the few dispute scenarios that does not require specific legal guidance because the law is clear.

### User Needs Score Improvement Within 60 Days

A 60-day plan has exactly one high-impact lever available: revolving utilization.

- Payment history cannot recover in 60 days -- it takes consecutive on-time months to rebuild the signal.
- New accounts would take months to age and produce positive effects.
- Hard inquiries from the past year are fixed on the report.
- **The entire plan focuses on one question:** "What is the maximum amount of revolving balance the user can pay off before the next statement closing date on each card?"
- If the user can drive aggregate utilization below 10% (and all individual cards below 30%) before the next statement close, the updated balances will be reported to the bureaus within 30-45 days.
- Set explicit expectations: "If utilization is the primary drag on your score right now, this approach can produce meaningful improvement within one billing cycle. If your score is also suppressed by late payments, collections, or limited history, those components will not change in 60 days."
- Advise the user to ask their target lender whether a rapid rescore service is available. Mortgage brokers can sometimes submit documentation of balance payoffs for an expedited rescore within 5-10 business days rather than waiting for the next reporting cycle.

### User Has Good Payment History but Score Is Stuck in the 650-680 Range

When payment history is clean but the score won't move above a threshold, the issue is almost always one of three things:

1. **Utilization too high:** Even 35% aggregate utilization prevents scores from reaching 720+. Calculate precise utilization and check for any single card above 30%.
2. **Thin credit mix:** If the user has only credit cards and no installment history (or vice versa), adding the missing type can unlock 10-20 points -- but requires 6+ months for the new account to age.
3. **Average account age too low:** Recent account openings suppress average age. The user may simply need to let existing accounts age without opening anything new. Run a simple projection: if the user's current average age is 2.5 years and they opened no new accounts for 12 months, what would the average age become?

Address each possibility with a specific diagnostic question and a targeted response rather than a generic plan.

### User Has High Income but Poor Credit (Income Is Not a FICO Input)

A common misconception: income, employment status, and assets are NOT factors in FICO credit scores. A high earner with a history of missed payments and maxed cards has a low credit score, full stop. The plan is identical to any other user with the same credit profile -- it does not change based on wealth or income. Note this explicitly if the user mentions income as a reason they expect the plan to work faster, and refocus on the five FICO components that actually drive the score.

### User Is Considering Debt Consolidation via Balance Transfer or Personal Loan During the Plan

This is a nuanced scenario with real trade-offs:

- **Balance transfer to a new card:** Reduces utilization on the originating cards (positive) but requires a hard inquiry and opens a new account (negative -- lowers average age). If the new card's limit is large enough to bring aggregate utilization below 30%, the net effect is often positive. But if the user is within 6 months of a major credit application, the new account may concern the lender.
- **Personal loan to pay off credit cards:** Converts revolving debt to installment debt. This reduces revolving utilization to near zero (very positive for the 30% Amounts Owed component) and adds installment mix (positive for the 10% Credit Mix component), but requires a hard inquiry and new account (minor negative). Under FICO 9, this is generally favorable. Under FICO 8, the installment balance shows as a new debt -- the net effect is usually positive if revolving utilization was high.
- **Rule:** Never consolidate debt during the plan without mapping the full impact on each FICO component and timing it away from major applications by at least 6 months.

---

## Example

**Input:** "My FICO 8 score is 618. I have two credit cards: Card A has a $3,000 limit and $2,700 balance. Card B has a $5,000 limit and $1,400 balance. I had one 30-day late payment on Card B in April (4 months ago). I've been on time every month since. I also have a car loan I've been paying on time for 2 years; the original loan was $18,000 and the balance is about $12,000. My oldest account is Card A at 6 years. My average account age is about 3 years. No collections, no bankruptcies, no other inquiries in the past year. I want to get to 700+ to qualify for a better apartment lease. I have about $400/month I can put toward credit card paydown beyond minimums. My timeline is 8 months."

---

**Output:**

## Credit Score Improvement Plan

> **Disclaimer:** Educational information only. Not financial advice. Consult a qualified financial professional before making credit decisions.

---

### Current Credit Profile Assessment

| Component | Current Status | Weight in FICO 8 | Current Impact |
|---|---|---|---|
| Score | 618 (FICO 8) | -- | Below Average |
| Payment History | 1 x 30-day late, April (4 months ago); on time every month since | 35% | Recoverable Negative -- damage diminishes with clean streak |
| Utilization -- Aggregate | 51% ($4,100 balance / $8,000 total limit) | 30% | High Risk -- significant negative |
| Utilization -- Worst Card | Card A: 90% ($2,700 / $3,000) | 30% | Severe -- critical drag |
| History Length -- Oldest Account | Card A at 6 years | 15% | Positive |
| History Length -- Average Age | ~3 years | 15% | Neutral -- solid but not a strength |
| Credit Mix | Revolving (2 cards) + Installment (auto loan) | 10% | Positive -- both types present |
| Hard Inquiries (24 months) | 0 | 10% | Positive -- no drag |
| Negative Items | 1 x 30-day late (April); no collections, charge-offs, or bankruptcies | 35% | Recoverable -- 24 clean months will substantially reduce impact |

---

### Score Milestone Map

- **Current score:** 618
- **Next meaningful threshold:** 640 -- opens better auto loan refinancing rates and more apartment options
- **Target score:** 700+
- **Goal:** Apartment lease qualification
- **Target date:** Month 8 from now
- **Months available:** 8

---

### Limiting Factor Analysis

The two issues driving your score down most severely are:

1. **Revolving utilization at 51% aggregate, with Card A at 90%** -- Estimated relative impact: High
   - Why: Utilization above 50% aggregate is heavily penalized. Card A at 90% is being scored as severely over-extended on that individual card even though aggregate utilization would be lower without it. Every dollar you pay down on Card A reduces both per-card and aggregate utilization simultaneously.
   - Actionable: Yes -- directly proportional to your $400/month available cash. With $400/month applied to Card A, you can reduce Card A utilization from 90% to approximately 26% over 6 months.

2. **One 30-day late payment 4 months ago** -- Estimated relative impact: High (diminishing over time)
   - Why: A 30-day late in the past 12 months is a significant negative signal. However, FICO models progressively reduce the weight of a derogatory event as time passes and clean payment history accumulates. By month 8 of this plan (12 months after the late), the event will have aged considerably. With 12 consecutive on-time payments from that point forward, the impact will be substantially diminished though not eliminated.
   - Actionable: Partially -- you cannot remove it, but you can dilute its impact by building a clean streak. The plan already accounts for this.

3. **No meaningful third issue detected.** Credit mix is healthy (revolving + installment). No hard inquiries. No collections. History length is solid. The plan is focused on two levers.

---

### Month-by-Month Action Plan

#### Month 1: Stabilize and Win Quickly
*Focus: Lock in autopay to prevent any future late, then attack Card A utilization aggressively.*

| Action | Component | Relative Impact | Effort | Cost / Capacity |
|---|---|---|---|---|
| Set up autopay for minimum payment on both cards AND the auto loan | Payment History | High | 30 minutes | $0 -- prevents any future lates regardless of life circumstances |
| Apply full $400 extra payment to Card A balance | Utilization | High | One transfer | Reduces Card A from $2,700 to $2,300 |
| Pause all new credit applications for the full 8 months | New Credit | Low | Decision | Protects the 0 inquiries status |

*Month 1 target: Card A $2,300 / Card B $1,400 -- Aggregate utilization: 46%*
*Per-card utilization: Card A: 77%, Card B: 28%*

#### Month 2: Confirm Systems and Continue Paydown
*Focus: Manually verify autopayments posted correctly; continue paydown schedule.*

| Action | Component | Relative Impact | Effort |
|---|---|---|---|
| Log in to each account and verify August payment posted as "on-time" | Payment History | High | 15 minutes |
| Apply $400 extra to Card A | Utilization | High | One transfer |
| Note: You are now 5 months post-late; clean streak is building | Payment History | -- | Monitor |

*Month 2 target: Card A $1,900 -- Aggregate utilization: 41%*
*Per-card utilization: Card A: 63%, Card B: 28%*

#### Month 3: Three-Month Clean Streak Milestone
*Focus: 3 consecutive on-time payments since the late is the first meaningful milestone for payment history recovery.*

| Action | Component | Relative Impact | Effort |
|---|---|---|---|
| Apply $400 extra to Card A | Utilization | High | One transfer |
| Verify 3-month consecutive on-time streak across all accounts | Payment History | High | Verify statements |
| Pull a full credit report (free) and verify no surprises -- check that April late is correctly reported as a single 30-day late, not misreported as a 60-day | Payment History | Medium | 30 minutes |

*Month 3 target: Card A $1,500 -- Aggregate utilization: 36%*
*Per-card utilization: Card A: 50%, Card B: 28%*
*Note: Card A drops below the 50% severe-penalty threshold this month. Expect your next score check to show meaningful movement.*

#### Month 4: Cross the 30% Threshold on Card A
*Focus: Crossing 30% utilization on Card A is the next inflection point.*

| Action | Component | Relative Impact | Effort |
|---|---|---|---|
| Apply $400 extra to Card A | Utilization | High | One transfer |
| Request credit limit increase on Card A (now have 5 months clean history post-late; combined with 6 years of account history, approval is plausible) | Utilization | Medium | Call issuer; ask if hard pull or soft pull first |

*Month 4 target: Card A $1,100 -- Aggregate utilization: 31%*
*Per-card utilization: Card A: 37%, Card B: 28%*
*If Card A limit increase to $4,500 is approved: Card A utilization drops to 24% -- aggregate drops to 23%. Major improvement.*

#### Month 5: Sustain Below 30% Aggregate
*Focus: Maintain aggregate below 30% and drive toward the sub-10% target before your application.*

| Action | Component | Relative Impact | Effort |
|---|---|---|---|
| Apply $400 extra -- shift target to whichever card has higher per-card utilization | Utilization | High | One transfer |
| Note: 8 consecutive on-time months post-late. Impact of April late is now significantly reduced. | Payment History | -- | Monitor |

*Month 5 target (no limit increase): Card A $700 -- Aggregate utilization: 26%*
*Per-card utilization: Card A: 23%, Card B: 28%*
*Month 5 target (if limit increase to $4,500 granted): Card A $700 -- Aggregate utilization: 20%*
*Per-card: Card A: 16%, Card B: 28%*

#### Month 6: Mid-Plan Review
*Focus: Full assessment; recalibrate for final 2 months.*

| Action | Component | Relative Impact | Effort |
|---|---|---|---|
| Pull full reports from all three bureaus; verify April late is accurately reported; check for any new items | All | Variable | Free; 45 minutes |
| Check current score and compare to Month 1 baseline | All | -- | Monitoring tool |
| Calculate: can you drive both cards below 10% utilization by Month 8? If not, which card do you prioritize? | Utilization | High | Math |
| Decide if you can redirect any additional one-time funds (tax refund, bonus, etc.) to pay down Card B | Utilization | Medium | Financial review |

*Month 6 target: Card A $300-400 -- Aggregate utilization: 21%*
*Note: You are now on track. At this point, your aggregate utilization should be below 30%, you have 9 months of clean payment history post-late, and no other negative factors exist. Significant score improvement should be visible.*

#### Month 7: Final Approach
*Focus: Drive utilization as low as possible. You are 1 month from target application.*

| Action | Component | Relative Impact | Effort |
|---|---|---|---|
| Pay Card A and Card B balances as low as possible -- target sub-10% on both | Utilization | High | Requires available cash |
| Absolutely no new credit applications | New Credit | Medium | Decision |
| Confirm no payments are overdue on auto loan or either card | Payment History | High | Verify |

*Month 7 target: Both cards at or near 0% utilization -- Aggregate: sub-10%*
*Sub-10% aggregate utilization is where FICO models reward you most. If you can reach this before your application, it is the highest-impact final action available to you.*

#### Month 8: Application Month
*Focus: Optimize reported balances and time the application correctly.*

| Action | Component | Relative Impact | Effort |
|---|---|---|---|
| PAY DOWN CARD BALANCES BEFORE STATEMENT CLOSING DATE, not due date -- this ensures the low balance is the number reported to the bureaus for this cycle | Utilization | High | Critical timing note |
| Allow 30-45 days for updated balances to be reported before submitting apartment application, if schedule allows | Utilization | High | Timing |
| Pull your FICO 8 score one final time after balances are reported | All | -- | Monitoring |
| Confirm with apartment complex whether they use a credit score or a full credit report for their application process | Application strategy | -- | One phone call |
| Gather documentation: proof of income, bank statements, prior landlord references | Application | -- | Preparation |

---

### Paydown Schedule (Utilization Tracker)

| Month | Card A Balance | Card A Utilization | Card B Balance | Card B Utilization | Aggregate Utilization | Extra Payment Applied |
|---|---|---|---|---|---|---|
| Now | $2,700 | 90% | $1,400 | 28% | 51% | -- |
| Month 1 | $2,300 | 77% | $1,400 | 28% | 46% | $400 to Card A |
| Month 2 | $1,900 | 63% | $1,400 | 28% | 41% | $400 to Card A |
| Month 3 | $1,500 | 50% | $1,400 | 28% | 36% | $400 to Card A |
| Month 4 | $1,100 | 37% | $1,400 | 28% | 31% | $400 to Card A |
| Month 5 | $700 | 23% | $1,400 | 28% | 26% | $400 to Card A |
| Month 6 | $300 | 10% | $1,400 | 28% | 21% | $400 to Card A |
| Month 7 | $
