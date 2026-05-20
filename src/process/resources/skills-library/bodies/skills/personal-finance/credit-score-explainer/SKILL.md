---
name: credit-score-explainer
description: |
  Explains the five components of a credit score (payment history, utilization, length of history, credit mix, new inquiries), interprets the user's score range, and identifies which component is the highest-impact lever for improvement. Produces a score breakdown analysis with a prioritized action list.
  Use when the user asks about credit scores, what affects their score, how credit scoring works, or wants to understand their credit score range.
  Do NOT use for a multi-month credit improvement plan (use credit-score-improvement), debt payoff strategies, or loan shopping.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance debt-management analysis"
  category: "personal-finance"
  subcategory: "life-stage-financial"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---
# Credit Score Explainer

> **Disclaimer:** This skill provides educational information about credit scoring and general guidance for personal financial planning. It does NOT constitute financial advice, credit counseling, or legal guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, credit counselor, or licensed financial planner before making significant financial decisions.

---

## When to Use

**Use this skill when:**
- User asks what a credit score is, how it is calculated, or which factors matter most
- User shares a specific score (e.g., "my score is 714") and wants to know what it means in practical terms
- User asks why their score dropped, went up, or has plateaued and wants a diagnostic explanation
- User wants to understand which of the five FICO or VantageScore components is most affecting them right now
- User asks about the difference between a 680 and a 750 in terms of real-world consequences (interest rates, approvals)
- User asks about score ranges, what "good credit" actually means numerically, or what score is needed for a mortgage, car loan, or apartment
- User is confused by seeing different scores from different sources and wants to understand why
- User asks what a hard inquiry vs. soft inquiry means
- User has a thin file or no credit history and wants to understand why they have no score
- User received a credit denial and wants to understand the stated reasons

**Do NOT use when:**
- User wants a structured multi-month credit rebuilding plan with milestones (use `credit-score-improvement`)
- User wants to prioritize which debts to pay off first using avalanche or snowball strategies (use a debt payoff skill)
- User is shopping for a specific mortgage, auto loan, or credit card and wants rate comparisons (use `loan-comparison`)
- User is asking about a business credit score (Dun & Bradstreet PAYDEX, Experian Business, Nav scores -- use a business credit skill)
- User needs help disputing a specific incorrect item on their credit report (this requires regulatory knowledge specific to FCRA processes -- use a credit dispute skill)
- User is asking about getting pre-approved for a specific loan product (use a loan pre-qualification skill)
- User needs bankruptcy guidance or is dealing with collections lawsuits (use a debt legal guidance skill)

---

## Process

### Step 1: Gather the User's Credit Profile

Collect the following data points before providing any analysis. If the user does not have all information, work with what is available and flag the gaps.

- **Current score and source:** Ask which platform reported it (FICO 8 from a bank, VantageScore 3.0 from a credit monitoring app, mortgage-specific FICO 2/4/5). The source matters because scores can vary by 20-50 points across models for the same person.
- **Number and types of open accounts:** Revolving (credit cards, HELOCs), installment (auto loans, student loans, personal loans, mortgages), and open/charge accounts. Variety matters for the credit mix component.
- **Total revolving credit limit and current balances:** Get per-card data if possible. A card at 95% utilization hurts even if overall utilization is low.
- **Payment history details:** Any late payments in the last 7 years, including how late (30, 60, 90, 120+ days), how recent, and whether any accounts are in collections.
- **Age of oldest account and approximate average account age:** Key inputs for the length of history component.
- **Hard inquiries in the last 12-24 months:** Number and rough timing.
- **Any derogatory marks:** Collections, charge-offs, bankruptcies, tax liens (while tax liens are no longer on credit reports as of 2018, some users may not know this), civil judgments (similarly removed from most reports).

If the user cannot provide exact figures, ask them to retrieve their free credit report from the three major bureaus (Equifax, Experian, TransUnion) and work from the profile they see there.

---

### Step 2: Identify the Scoring Model in Use

Before interpreting the score, determine which model generated it, because ranges and weightings differ.

- **FICO Score 8:** The most widely used model. Range 300-850. Used by approximately 90% of top lenders. This is the default model to reference unless the user specifies otherwise.
- **FICO Score 9:** Ignores paid collections and treats medical collections less harshly than FICO 8. Scores from FICO 9 may read 10-25 points higher for users with older medical debt.
- **FICO Score 10 / 10T:** The newest generation. FICO 10T incorporates "trended data" -- not just a snapshot of utilization but whether balances are trending up or down over 24 months. Someone paying down debt looks better than someone accumulating it at the same utilization level.
- **Mortgage-specific FICO models (2, 4, 5):** Used specifically for mortgage underwriting. Pulled from Experian (FICO 2), TransUnion (FICO 4), and Equifax (FICO 5). These models weight medical collections and payment history differently. A user with a 740 FICO 8 might have a 718 FICO 2.
- **Auto-specific FICO (Auto Score 8):** Weights auto loan payment history more heavily.
- **VantageScore 3.0:** Range also 300-850. Used by many free credit monitoring tools (Credit Karma historically used this). Weights "total credit usage, balance, and available credit" as 30% and "payment history" as 40%. Can diverge from FICO by 20-100 points in edge cases.
- **VantageScore 4.0:** Similar to FICO 10T in incorporating trended data. Not yet as widely adopted by lenders.

**Default to FICO 8 for all explanations unless the user specifies a different model.** If the source is unclear, note this and explain why the number may differ from what a lender pulls.

---

### Step 3: Explain the Five Components with Precision

Present each component with its FICO 8 weight, the specific mechanics that drive it up or down, and the relevant thresholds.

**Payment History -- ~35% of FICO 8 Score**

This is the single most important factor. The impact of a missed payment depends on four variables:
- **Severity:** A 30-day late is less damaging than a 60-day late, which is less damaging than a 90-day late or a charge-off. A 30-day late may drop a score with no other negatives by 60-110 points.
- **Recency:** A 30-day late from 6 months ago is far more damaging than one from 5 years ago. Negative items lose influence over time but remain visible for 7 years (bankruptcies remain for 7-10 years depending on type).
- **Number of negatives:** One isolated late payment on an otherwise clean file hurts proportionally more than one in a file already marked up with problems (the marginal damage of adding another negative decreases, but the overall score is already lower).
- **Score at time of delinquency:** A high-score consumer (780+) who misses one payment suffers a much steeper drop (can be 90-110 points) than a 620 consumer who misses one (perhaps 60-80 points). This is a widely documented characteristic of FICO scoring.

Collections and charge-offs are the most severe payment history negatives. A paid collection still appears on a report under FICO 8 but has less impact than an unpaid one. Under FICO 9, a paid collection is ignored entirely.

**Credit Utilization -- ~30% of FICO 8 Score**

Utilization is calculated two ways and both matter:
- **Per-card utilization:** Each individual revolving account's balance divided by its credit limit.
- **Aggregate utilization:** Total revolving balances divided by total revolving credit limits.

Key thresholds (approximate, as FICO's scoring bands are proprietary but are well-documented through FICO's own public guidance and consumer credit research):
- **Below 10%:** Generally optimal. People with scores above 800 typically have utilization in the single digits.
- **10%-29%:** Good. Minimal negative impact in most profiles.
- **30%-49%:** Noticeable negative impact begins. The "keep it under 30%" guideline is well-known but imprecise -- any reduction is helpful.
- **50%-74%:** Significant negative impact, especially per-card.
- **75%+:** Severe negative impact. A single maxed-out card can be damaging even if all other cards are at zero.

Utilization is a **real-time snapshot** -- it reflects the balance when lenders report to the bureaus, typically at the statement closing date. This means utilization can be strategically managed by paying down balances before the statement cuts, not just before the due date.

**Length of Credit History -- ~15% of FICO 8 Score**

Composed of several sub-factors:
- **Age of oldest account:** The single most important sub-factor. An account opened 12 years ago anchors history even if many newer accounts exist.
- **Average age of all accounts:** Opening new accounts lowers the average. Adding 3 new cards at once when the average was 6 years could drop the average significantly.
- **Age of newest account**
- **Age of specific account types:** FICO looks at the oldest revolving account and oldest installment account separately.

**Critical nuance:** Closed accounts remain on your credit report for up to 10 years and continue to contribute to average age during that period. When they fall off, the average age can drop noticeably.

**Credit Mix -- ~10% of FICO 8 Score**

FICO's research shows that consumers with both revolving accounts (credit cards) and installment loans (auto, student, mortgage) tend to manage credit more predictably than those with only one type. The scoring benefit comes from demonstrating experience with different structures.

Do NOT recommend taking out a loan solely to improve credit mix. The 10% weight rarely justifies new debt and associated interest costs. This component is most actionable for users who are thin-file (no installment history) and are already planning to finance a purchase anyway.

**New Credit Inquiries -- ~10% of FICO 8 Score**

Two types of inquiries exist:
- **Hard inquiries:** Generated when a lender checks your credit in response to an application. Remain on report for 2 years; impact scoring for 12 months. A single hard inquiry typically reduces a score by 3-10 points.
- **Soft inquiries:** Generated by checking your own score, pre-qualification checks, employer background checks. Zero impact on score.

**Rate-shopping exception (very important):** FICO treats multiple hard inquiries for auto loans, mortgages, or student loans within a 45-day window as a single inquiry. This protects consumers who are shopping for the best rate. This 45-day window applies to FICO 8; older FICO models used a 14-day window.

---

### Step 4: Map the User's Profile to Score Range Impact

Using the data gathered in Step 1 and the mechanics from Step 3, assess each component as Positive, Neutral, or Negative and note the severity.

**FICO 8 Score Range Reference:**

| Range | Classification | Practical Meaning |
|-------|---------------|-------------------|
| 800-850 | Exceptional | Best available rates; near-automatic approvals; top-tier credit card offers |
| 740-799 | Very Good | Near-best rates; minor differences from Exceptional in most products |
| 670-739 | Good | Approved for most products; rates are competitive but not optimal |
| 580-669 | Fair | Approvals are conditional; significantly higher rates; some lenders decline |
| 300-579 | Poor | Limited approvals; secured products mainly; very high rates or deposits required |

**Real-world rate differences are significant.** The difference between a 620 and a 760 on a 30-year $300,000 mortgage can be $150-300/month in interest -- over $50,000 over the life of the loan. This context motivates users to take action.

---

### Step 5: Identify the Highest-Impact Lever

Apply a priority ranking based on what is most actionable and most weighted:

**Tier 1 -- Address first (high weight + can be changed quickly):**
- High utilization (30%+ weight, updates every billing cycle)
- Active or recent delinquencies that can be resolved

**Tier 2 -- Address second (high weight but requires time):**
- Payment history negatives that will age off or can be partially remediated

**Tier 3 -- Supporting actions (lower weight or slower to impact):**
- Credit age (no accelerants exist -- time is the only solution)
- Credit mix (relevant only when naturally acquiring new credit)
- Inquiries (self-resolve in 12 months; avoid new applications in the near term)

To identify the user's specific highest-impact lever:
1. If utilization is above 30%: utilization is almost always the fastest win
2. If utilization is under 30% and there are recent late payments: the payment history negative is the primary drag
3. If utilization is low and payment history is clean: examine credit age and mix for thin-file cases
4. If the user has collections or charge-offs in the last 2 years: these are the dominant negative regardless of other factors

---

### Step 6: Explain Common Misconceptions

Address these proactively because many users arrive with false beliefs that could lead them to take harmful actions:

- **"Closing old credit cards will help my score":** False -- closing accounts reduces available credit (increases utilization) and can lower average account age. Only close accounts if there is a compelling financial reason (e.g., high annual fee on an unused card).
- **"Carrying a small balance shows you use credit":** False -- this is a persistent myth. FICO rewards low utilization, not zero-but-not-too-zero. Carrying a balance costs interest with no scoring benefit. Pay in full.
- **"Checking my score hurts it":** False -- self-checks are soft inquiries. Only lender-initiated hard inquiries for new credit applications impact the score.
- **"Income affects credit score":** False -- FICO models do not include income, assets, or savings. Income is considered separately by lenders in their underwriting, not in the score itself.
- **"Paying off a collection will remove it":** Partially false -- payment updates the status but the record remains for 7 years from the original delinquency date under FICO 8. Under FICO 9, a paid collection is fully ignored in scoring.
- **"My rent payments build credit":** Only true if reported through a rent reporting service. Major bureaus do not receive standard rent data from landlords.

---

### Step 7: Compile and Deliver the Structured Analysis

Assemble all gathered information and analysis into the output format below. Flag any data gaps explicitly. Close with a forward-looking summary that connects their current score to their stated financial goals if known.

---

## Output Format

```
## Credit Score Analysis

### Score Profile
| Metric                  | Value                                      |
|-------------------------|--------------------------------------------|
| Reported Score          | [XXX]                                      |
| Scoring Model           | [FICO 8 / VantageScore 3.0 / Unknown]      |
| Reporting Bureau        | [Equifax / Experian / TransUnion / Unknown] |
| Score Range             | [Poor / Fair / Good / Very Good / Exceptional] |
| Practical Interpretation| [One sentence on what this means day-to-day] |

---

### Five-Component Breakdown
| Component            | Weight  | Your Profile                  | Assessment         | Priority |
|----------------------|---------|-------------------------------|--------------------|----------|
| Payment History      | ~35%    | [e.g., 1 late payment, 60-day, 14 months ago] | [Negative -- Moderate] | [#X] |
| Credit Utilization   | ~30%    | [e.g., 42% aggregate; Card A at 88%] | [Negative -- High] | [#X] |
| Length of History    | ~15%    | [e.g., Oldest: 5 yrs; Average: 2.5 yrs] | [Neutral]          | [#X] |
| Credit Mix           | ~10%    | [e.g., 3 credit cards, 1 auto loan] | [Positive]        | [#X] |
| New Inquiries        | ~10%    | [e.g., 2 hard inquiries in 12 months] | [Neutral]         | [#X] |

---

### Score Range Context (FICO 8)
| Score Range | Classification | What It Means in Practice                          |
|-------------|----------------|----------------------------------------------------|
| 800-850     | Exceptional    | Best available rates; near-automatic approvals     |
| 740-799     | Very Good      | Near-best rates; strong approval odds              |
| 670-739     | Good           | Competitive rates; approved for most products      |
| 580-669     | Fair           | Higher rates; conditional approvals                |
| 300-579     | Poor           | Limited options; secured products; high deposits   |

**Your score of [XXX] places you in the [Classification] range.**
[One sentence contextualizing what this means for their stated financial goal, if known.]

---

### Highest-Impact Improvement Lever
**Component:** [Component name] (~XX% of score weight)
**Current status:** [Specific description, e.g., "42% aggregate utilization; Card A is at 88% of its $2,500 limit"]
**Why this is your best lever:** [Explain why this component offers the most improvement potential in their specific situation -- be specific to their numbers]
**What drives this component:** [Explain the mechanism -- e.g., utilization is a real-time snapshot, not a rolling average]

---

### Prioritized Action List

**Action 1 -- [Highest-impact component]: [Action title]**
- What to do: [Specific, concrete instruction]
- Why it works: [Mechanism explanation]
- Expected timeline to see change: [Specific -- e.g., "1-2 billing cycles after balance is reported"]
- Cautions: [What NOT to do in pursuit of this action]

**Action 2 -- [Second component]: [Action title]**
- What to do: [Specific, concrete instruction]
- Why it works: [Mechanism explanation]
- Expected timeline: [Specific]
- Cautions: [Relevant warnings]

**Action 3 -- [Third component or supporting action]: [Action title]**
- What to do: [Specific, concrete instruction]
- Why it works: [Mechanism explanation]
- Expected timeline: [Specific]
- Cautions: [Relevant warnings]

---

### What Does NOT Affect Your Score (Common Misconceptions)
| Common Belief                          | Reality                                                    |
|----------------------------------------|------------------------------------------------------------|
| Checking your own score hurts it       | False -- self-checks are soft inquiries with zero impact   |
| Carrying a balance builds credit       | False -- utilization rewards low balances, not usage       |
| Income or savings affect the score     | False -- FICO models do not include income or assets       |
| Closing old cards cleans up your file  | False -- reduces available credit and lowers average age   |
| Paying off a collection removes it     | False (FICO 8) -- paid status updated but record remains   |
| Debit card use builds credit           | False -- debit cards are not reported to bureaus           |

---

### Data Gaps
[List any data points that were unavailable that would sharpen this analysis, e.g.,
"Per-card utilization breakdown not provided -- if any single card is above 50%,
it may be a larger drag than aggregate utilization suggests."]

---

### Scoring Model Note
[If source is unclear, add: "Your score of XXX was reported by [source]. Different models
may show different numbers. The analysis above assumes FICO 8, the most widely used
lending model."]
```

---

## Rules

1. **Never promise specific point changes.** FICO's algorithm is proprietary. Phrases like "reducing utilization to 9% will add 50 points" are not accurate and set false expectations. Use directional language: "likely to have a noticeable positive effect" or "typically one of the faster-acting changes a consumer can make."

2. **Always identify the scoring model before interpreting.** A 680 from VantageScore 3.0 and a 680 from FICO 8 are not interchangeable. A user celebrating a VantageScore of 750 may have a FICO 8 of 710 on the same profile. This matters especially when they are approaching a lender.

3. **Per-card utilization matters as much as aggregate.** A user with $15,000 in total credit and $3,500 in balances (23% aggregate) who has one card maxed at $2,000 on a $2,000 limit is still experiencing a significant per-card utilization penalty. Always ask about the distribution of balances across cards.

4. **Do not recommend closing old credit cards.** Almost universally, this is counterproductive -- it reduces total available credit (raising utilization) and can lower average account age. The only exceptions are accounts with high annual fees the user cannot justify, and in those cases, flag the trade-off explicitly.

5. **Distinguish the "carry a balance" myth clearly.** Many users have been told by well-meaning people that carrying a small balance (5-10%) "shows the credit card is being used." This is false and costs them interest. Paying in full is always better for both score and finances.

6. **Rate-shopping consolidation window is a critical consumer right -- explain it.** Users should know they can apply to multiple auto or mortgage lenders within 45 days (FICO 8) without accumulating additional inquiry penalties. This prevents them from avoiding comparison shopping due to inquiry fear.

7. **Do not recommend credit repair companies or services.** The techniques legitimate credit repair companies use (disputing errors, goodwill letters) are available to consumers directly at no cost. Predatory credit repair services often charge fees for legally guaranteed free services. Reference the FCRA's rights by concept, not by company name.

8. **Collections strategy is model-dependent -- flag this explicitly.** Advising a user to "just pay off the collection" is potentially incomplete without noting: under FICO 8, a paid collection still shows; under FICO 9, it is ignored; under some lender-specific models, the payoff is required for approval regardless of score impact. Do not oversimplify.

9. **Thin-file users need a different framework.** A user with fewer than 3-5 open accounts with 6+ months of history may have no scoreable file at all (FICO requires at least one account with 6+ months of history and reported within the last 6 months). Do not apply standard component analysis to a non-existent score -- pivot to credit-building fundamentals.

10. **Derogatory marks have a fixed timeline -- do not overstate recovery speed.** A Chapter 7 bankruptcy stays on a report for 10 years from filing. A Chapter 13 stays for 7 years. A collection stays for 7 years from the original delinquency date (not the date of collection). A foreclosure stays 7 years. Be precise about these timelines so users have accurate expectations.

11. **Income is never part of FICO scoring -- but it is part of lender decisions.** Always clarify the distinction: credit score measures creditworthiness (repayment behavior), while lenders independently assess ability to pay (income, debt-to-income ratio). A 780 score does not guarantee loan approval if DTI is 60%.

12. **Authorized user accounts have real but variable impact.** Being added as an authorized user on a family member's account with a long, clean history and low utilization can meaningfully help a thin-file consumer. However, the primary account holder's payment behavior will also affect the authorized user's report. FICO 8 applies authorized user tradeline data; some lender-specific FICO models weigh it differently.

---

## Edge Cases

### Thin File -- User Has No Credit Score
A user with fewer than 3 trade lines, or with accounts younger than 6 months, may generate no FICO score at all. Credit bureaus will return a "no score" result rather than a low number.

**How to handle:**
- Explain what a "thin file" means and that it is not the same as bad credit -- it is simply insufficient data.
- Outline the three lowest-risk entry points for building credit:
  1. **Secured credit card:** A deposit-backed card (deposit equals credit limit) with major issuers reports to all three bureaus. This is the most accessible starting point. Use it for small recurring purchases (subscription services work well) and pay the statement balance in full every month.
  2. **Credit-builder loan:** Offered by many credit unions and community banks. The "loan" amount is held in a savings account while the borrower makes monthly payments, which are reported to the bureaus. At the end of the term, the consumer receives the funds. The benefit is installment payment history without consumer risk.
  3. **Authorized user on an established account:** If a family member with excellent, long-standing credit adds the user to an account, the tradeline history may appear on the user's report. Choose an account with at least 3-5 years of history, low utilization, and zero late payments.
- Do NOT recommend applying for multiple credit products at once. Each application creates a hard inquiry and opening multiple new accounts simultaneously drops the average account age. Sequential, strategic account opening is better.

---

### User Sees Different Scores on Different Platforms

A user with a 730 on one platform and a 695 on another will often be confused and frustrated.

**How to handle:**
- Explain the three-axis variation: (1) bureau differences -- each of the three major bureaus may have slightly different data, particularly if a creditor does not report to all three; (2) model differences -- Credit Karma's VantageScore 3.0, a bank's FICO 8, and a mortgage lender's FICO 2 are separate models; (3) timing differences -- scores update as new data is reported.
- Frame the practical advice: "The score that matters is the one the specific lender will pull. For mortgages, this is typically FICO 2, 4, or 5. For most other credit, FICO 8 is the most common. For pre-planning, assume the score the lender will see is approximately your middle or lower range."
- Do not let the user fixate on score-source discrepancies as a sign of errors. The variation is expected behavior.

---

### User's Score Dropped Suddenly

User reports a significant drop (20+ points) they cannot explain.

**Systematic diagnostic approach -- work through in this order:**
1. **New delinquency (most common):** Even a 30-day late on a single account. Check if an auto-pay was cancelled or a minimum payment was missed.
2. **Utilization spike:** A large purchase, reduced credit limit, or account closure can spike utilization. Reduced credit limits are especially underappreciated -- if a lender reduces a card limit from $5,000 to $2,000 on an account carrying a $1,500 balance, utilization jumps from 30% to 75% overnight.
3. **Account closure:** Either by the consumer or by the lender (inactive accounts are sometimes closed by issuers). Reduces available credit.
4. **New derogatory item:** A collection may have been newly reported even for a debt that is 1-2 years old.
5. **New hard inquiry plus new account:** Opening a new account creates both an inquiry and a new average account age reduction.
6. **Credit limit decrease on a card with a balance:** As above -- this is underappreciated.

**Important:** Ask the user to pull their reports from all three bureaus to identify what changed. Free access is available annually from each bureau.

---

### User Has Collections or Charge-offs

**How to handle:**
- Be precise about timelines: collections and charge-offs remain for 7 years from the **original delinquency date** -- not the date the account was sold to a collection agency or the date of last payment. This date should be visible on the credit report.
- Explain the FICO 8 vs. FICO 9 distinction regarding paid collections explicitly.
- For unpaid collections, note that some lenders will require payoff regardless of score impact. Others will approve with unpaid collections on the file. This varies by lender and product type.
- Introduce the concept of a "goodwill deletion request" -- a letter to the original creditor (not a collection agency) requesting removal of a paid late payment or isolated delinquency as a goodwill gesture. This is not guaranteed, but legitimate, free, and occasionally successful for users with one-time isolated negatives after a documented hardship.
- Do NOT suggest "pay for delete" arrangements with collection agencies as a standard strategy. While some collection agencies will agree to this, it is against most major bureaus' reporting policies, and the practice is less reliable since the bureaus updated their dispute processes.

---

### User is Planning a Major Credit Application (Mortgage, Auto Loan) in the Next 3-6 Months

This is a time-sensitive context requiring different prioritization guidance.

**How to handle:**
- Shift focus to fast-acting levers only: utilization reduction is the most actionable in the short window.
- Issue strong cautions against: opening any new credit accounts, closing any existing accounts, co-signing a new loan, making any large purchases on credit that would spike utilization.
- Explain the "frozen profile" strategy: in the 90 days before a major application, the goal is to stabilize and optimize, not experiment. Pay down balances to below 10% utilization if possible, then do not touch the accounts.
- Explain the rate-shopping window so the user can shop multiple lenders without inquiry fear.
- Note that mortgage lenders pull tri-merge reports (all three bureaus) and use the middle of the three FICO scores (FICO 2, 4, 5) -- not FICO 8. If they have access to all three bureau scores, identifying the weakest bureau's score tells them where to focus dispute or remediation effort.

---

### User Asks About the Impact of Authorized User Status

**How to handle:**
- Explain that FICO 8 does count authorized user tradelines, but the benefit is limited to the quality and age of the primary account.
- Flag the risks: if the primary user misses a payment or maxes out the card after the authorized user is added, that negative also appears on the authorized user's report. This is a two-way relationship.
- The "credit piggybacking" industry that sells authorized user spots commercially exists but is not recommended. It is explicitly an attempt to exploit the authorized user mechanism, and some FICO model variants have been designed to reduce the scoring benefit of clearly unrelated authorized user accounts.
- Legitimate family-based authorized user arrangements remain a valid and common credit-building tool.

---

### User Has a Very High Score (780+) and Wants to Know How to Reach 800+

**How to handle:**
- Adjust tone: at this level, the optimization is marginal and the practical difference between a 790 and 810 in real-world rates is minimal for most products.
- The primary levers in the 780+ range are typically: reducing aggregate utilization to below 7-10%, ensuring no hard inquiries in the past 12 months, and allowing account age to grow.
- Note that at very high scores, a single missed payment can cause a disproportionately large drop (60-110 points) because the model has less "room" for additional positive data and a negative event has outsized relative weight.
- Recommend setting up payment autopay on all accounts to protect the near-perfect payment history -- this is more important than any incremental optimization at this score level.

---

## Example

**Input:** "My credit score is 694. I have three credit cards -- a $5,000 limit card with a $2,800 balance, a $3,000 limit card with a $2,700 balance, and a $1,500 limit card with a $200 balance. I also have a student loan I've been paying on for 4 years with no missed payments. I had one 60-day late payment on the $3,000 card about 18 months ago. My oldest account is 5 years old and my average account age is around 3 years. I applied for two new credit cards in the past year and was approved for one. What's keeping my score down and what should I focus on first?"

---

**Output:**

## Credit Score Analysis

### Score Profile
| Metric                  | Value                                        |
|-------------------------|----------------------------------------------|
| Reported Score          | 694                                          |
| Scoring Model           | Assumed FICO 8 (confirm with source)         |
| Score Range             | Good (670-739)                               |
| Practical Interpretation| Approved for most credit products; rates are above the best available tier |

---

### Five-Component Breakdown

| Component            | Weight  | Your Profile                                          | Assessment             | Priority |
|----------------------|---------|-------------------------------------------------------|------------------------|----------|
| Payment History      | ~35%    | 1 late payment (60-day) on Card B, 18 months ago; student loan perfect | Negative -- Moderate | #2 |
| Credit Utilization   | ~30%    | Aggregate: 59% ($5,700 / $9,500); Card A: 56%; Card B: 90%; Card C: 13% | Negative -- Severe | #1 |
| Length of History    | ~15%    | Oldest: 5 years; Average: ~3 years; Student loan: 4 years | Neutral -- Moderate | #4 |
| Credit Mix           | ~10%    | 3 revolving accounts + 1 installment (student loan) | Positive               | #5 |
| New Inquiries        | ~10%    | 2 hard inquiries in past 12 months (1 approval, 1 denial implied) | Slightly Negative | #3 |

**Total open revolving credit:** $9,500
**Total revolving balances:** $5,700
**Aggregate utilization:** 59.9%
**Card B individual utilization:** 90% -- this is severe and is counted against you both individually and in the aggregate.

---

### Score Range Context (FICO 8)

| Score Range | Classification | What It Means in Practice                          |
|-------------|----------------|----------------------------------------------------|
| 800-850     | Exceptional    | Best available rates; near-automatic approvals     |
| 740-799     | Very Good      | Near-best rates; strong approval odds              |
| 670-739     | **Good**       | Competitive rates; approved for most products      |
| 580-669     | Fair           | Higher rates; conditional approvals                |
| 300-579     | Poor           | Limited options; secured products; high deposits   |

**Your score of 694 places you in the Good range.** You are 46 points below the Very Good threshold of 740. At 740+, you would qualify for meaningfully better interest rates on auto loans, personal loans, and credit cards. The gap is closeable -- but two factors are currently holding your score down significantly.

---

### Highest-Impact Improvement Lever

**Component:** Credit Utilization (~30% of score weight)
**Current status:** Aggregate utilization is 59.9% across $9,500 in available revolving credit. More critically, Card B (your $3,000 limit card) is at 90% utilization -- a severe per-card reading that FICO penalizes both individually and as part of your overall picture.
**Why this is your best lever:** Utilization is a real-time snapshot, not a rolling average. Unlike your 60-day late payment (which requires time to age and reduce its impact), utilization resets every billing cycle. If you reduce your balances before your statement closing dates, the improvement will appear on your next credit report update -- typically within 30-45 days.
**The specific bottleneck:** Card B at 90% is the most urgent problem. Even if your aggregate utilization were 30%, a single card at 90% creates a per-card utilization penalty. Address Card B first.

---

### Prioritized Action List

**Action 1 -- Credit Utilization: Pay down Card B aggressively to below 30%**
- What to do: Reduce Card B's balance from $2,700 to below $900 (30% of the $3,000 limit). If possible, target $300 or below (10%) for maximum benefit. Pay this down before the statement closing date, not just the due date -- the balance reported at statement close is what reaches the bureaus.
- Why it works: A 90% per-card utilization is one of the strongest negative utilization signals. Bringing Card B to below 30% eliminates both the per-card severe penalty and reduces aggregate utilization toward the 30-10% range.
- Expected timeline: 1-2 billing cycles after the lower balance is reported at statement close.
- Cautions: Do not close Card B after paying it down -- keeping the available credit open reduces utilization. Do not transfer the balance to Card A or Card C; this shifts but does not eliminate the utilization problem.

**Action 2 -- Credit Utilization: Reduce aggregate utilization to below 30%**
- What to do: After addressing Card B, continue reducing balances so total revolving balances fall below $2,850 (30% of $9,500). The optimal target is below $950 (10%) if cash flow allows. Prioritize by highest utilization rate per card.
- Why it works: Getting from 60% to 29% aggregate utilization is a substantial shift in how the FICO model evaluates your revolving behavior. The 30%-10% band is where most scoring improvement from utilization reduction occurs.
- Expected timeline: Proportional to paydown speed -- each billing cycle that reports a lower balance contributes.
- Cautions: Do not request credit limit increases on accounts recently opened; the inquiry and timing may not be worth it. If limits increase organically (issuer-initiated), accept them.

**Action 3 -- Payment History: Protect your record and allow the 60-day late to age**
- What to do: Set up autopay for the minimum payment on all three credit cards and your student loan. The goal is zero additional late payments. Separately, consider sending a goodwill letter to the issuer of Card B, asking them to remove the 60-day late from 18 months ago as a one-time courtesy. This is more likely to succeed if you have been a customer for several years and the incident was isolated.
- Why it works: The 60-day late payment is 18 months old. FICO scoring weights recent negatives more heavily than older ones. By month 24, its impact will be measurably reduced; by month 36-48, it is significantly diminished. A goodwill deletion -- if granted -- removes it entirely. There is no cost to sending the letter.
- Expected timeline: Autopay protection is immediate. Goodwill deletion, if granted, appears within 30-60 days. Natural aging of the late payment produces gradual improvement over 24-48 months.
- Cautions: If the issuer declines the goodwill request, do not escalate by disputing an accurate item -- that is a misuse of the dispute process and can flag your account.

---

### What Does NOT Affect Your Score

| Common Belief                          | Reality                                                    |
|----------------------------------------|------------------------------------------------------------|
| Checking your own score hurts it       | False -- self-checks are soft inquiries with zero impact   |
| Carrying a balance shows you "use" credit | False -- low balances outperform carried balances for scores |
| Your income or job title affects score | False -- FICO does not include income, assets, or employment |
| Closing paid-off cards cleans up your file | False -- closing Card C would reduce available credit from $9,500 to $8,000, worsening aggregate utilization |
| Paying off student loan will hurt score | Partially true -- closing an installment account can slightly reduce mix and average age, but overall financial benefit of payoff outweighs this marginal effect |
| Debit card transactions build credit   | False -- debit activity is not reported to any bureau      |

---

### Data Gaps
The analysis above is based on the information provided. The following additional data would sharpen the recommendations:

- **Statement closing dates for each card:** Knowing when each card reports to the bureaus would allow you to time paydowns for maximum reporting impact.
- **Whether the two hard inquiries were for mortgage, auto, or credit card products:** Mortgage and auto inquiries within 45 days are consolidated by FICO 8; credit card inquiries are not. If both were credit card applications, both are counting separately.
- **Per-bureau score data:** If you have access to your Equifax, Experian, and TransUnion scores separately, the bureau with the lowest score may have different data and is worth investigating.

---

### Scoring Model Note
This analysis assumes FICO 8, the most widely used lending model. If your score was sourced from a free monitoring app, it may be VantageScore 3.0, which can produce different numbers on the same profile. When preparing for any credit application, ask the lender which scoring model they use and pull that specific score if possible.
