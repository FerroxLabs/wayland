---
name: bank-account-comparison
description: |
  Defines criteria for evaluating checking and savings accounts (fees, APY, minimums, ATM access, features) and applies them to options the user provides. Produces a weighted comparison matrix so the user can select the account that best fits their banking needs.
  Use when the user asks about choosing a bank account, comparing checking or savings accounts, or evaluating account features and fees.
  Do NOT use for investment account comparison (use investing skills), business bank accounts, or credit card comparison.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance budgeting analysis"
  category: "personal-finance"
  subcategory: "life-stage-financial"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---
# Bank Account Comparison

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions. Deposit insurance limits, fee regulations, and banking laws vary by jurisdiction -- verify all specifics with your local regulatory authority.

---

## When to Use

**Use this skill when:**
- A user wants to compare two or more checking accounts, savings accounts, or money market accounts and needs a structured framework to evaluate them side by side
- A user is opening their first bank account and does not know which features matter most for their usage pattern (e.g., frequent ATM user vs. digital-native who never uses cash)
- A user suspects their current account is costing them money and wants to evaluate whether switching would produce a measurable financial benefit
- A user has received a bank offer (new account bonus, promotional APY, fee waiver) and wants to determine whether the offer offsets any trade-offs
- A user is transitioning between life stages -- starting college, moving cities, getting their first job, or retiring -- and their current banking setup no longer fits their needs
- A user wants to understand what distinguishes high-yield savings accounts from standard savings accounts and whether the APY difference justifies any change in access or institution
- A user is evaluating whether to consolidate banking relationships or split funds across institutions for different purposes (e.g., one account for spending, one for saving)
- A user asks specifically about monthly fees, minimum balance requirements, overdraft policies, ATM reimbursement, direct deposit requirements, or mobile check deposit limits

**Do NOT use when:**
- The user wants to compare brokerage accounts, IRAs, 401(k)s, HSAs, or other investment or tax-advantaged accounts -- use investing or tax-advantaged account comparison skills instead
- The user wants to compare business checking or business savings accounts -- business banking involves different structures (analyzed cash flow, treasury management, payroll integration, merchant services) that are outside this skill's scope
- The user wants to compare credit cards, debit card rewards programs as a standalone question, or buy-now-pay-later products -- use credit card comparison skills
- The user wants to compare personal loans, home equity lines, or mortgages -- use `loan-comparison`
- The user is asking about investment-grade money market funds (these are securities, not bank accounts, and carry different risk profiles)
- The user's question is primarily about fraud response, account recovery, or a specific dispute with their current bank -- use a banking dispute or consumer protection skill
- The user needs guidance on the full financial planning picture (emergency fund sizing, savings rate optimization) -- use a budgeting or financial planning skill, then return here to compare accounts once the account type and target balance are determined

---

## Process

### Step 1: Establish the User's Banking Profile

Before touching any account options, build a clear picture of how this person actually banks. Wrong criteria applied with precision produces a useless comparison.

- **Account type(s) needed:** Is this a checking account (transactional hub), a savings account (reserve and earning), a money market account (hybrid with check-writing), or a combination? Many users need both a checking and a savings account evaluated together as a banking relationship, not two isolated products.
- **Monthly transaction volume:** Estimate how many debit card transactions, ACH transfers, bill payments, and cash withdrawals the user makes per month. High-transaction users benefit more from fee waivers tied to debit use than from APY differences.
- **Cash usage pattern:** Does the user withdraw cash regularly? If yes, which ATM networks do they currently use, and how often do they use out-of-network ATMs? One out-of-network ATM fee per week at $3.50 per transaction equals $182/year -- often exceeding total interest earned on a modest savings balance.
- **Expected balance range:** Separate into checking balance (operating float) and savings balance (reserve). A user who maintains $400 in checking and $3,000 in savings has completely different fee-avoidance priorities than one who keeps $8,000 across accounts.
- **Income and payroll setup:** Does the user have direct deposit? What is the direct deposit amount and frequency? Many fee waivers require a direct deposit of at least $500/month. Some institutions define "direct deposit" narrowly (employer ACH only) versus broadly (any ACH credit).
- **Geographic and digital preferences:** Does the user need branch access for cash deposits, notary services, or complex transactions? Does the user live in an area well-served by a particular ATM network (Allpoint has 55,000+ ATMs in the US; MoneyPass has 40,000+; CO-OP serves credit union members)? Or is the user comfortable with fully digital banking?
- **Special requirements:** Joint account, minor account, trust account, international wire capability, foreign transaction fee waiver for travel, early direct deposit access (some institutions post payroll 1-2 days early), savings sub-account or "bucket" feature, round-up savings automation.

### Step 2: Gather Complete Account Data

Ask the user to provide -- or help them locate -- the following data for each account under consideration (2 to 5 accounts is the useful range; beyond 5, cognitive load collapses decision quality):

- **Formal account name** and institution type (national bank, regional bank, credit union, online-only bank, neobank/fintech)
- **Monthly maintenance fee** -- exact dollar amount, and every condition under which it is waived (minimum daily balance, minimum average balance, number of debit transactions, direct deposit amount and frequency, student/senior status)
- **Minimum opening deposit** -- distinct from minimum ongoing balance; some accounts require $25 to open but have no ongoing minimum
- **Minimum daily balance vs. minimum average monthly balance** -- this distinction matters. A $1,500 minimum daily balance means one day below $1,500 triggers a fee. A $1,500 minimum average balance allows dips as long as the monthly average holds.
- **APY** -- for savings accounts and money market accounts, the current APY and whether it is tiered (different rates apply to different balance bands, e.g., 4.50% on balances up to $10,000, 4.00% above $10,000, or the reverse)
- **ATM policy** -- the ATM network(s) the account belongs to, the out-of-network ATM fee charged by the institution (typically $2.50 to $3.50), and whether the institution reimburses out-of-network ATM surcharges charged by the ATM owner (some accounts reimburse up to $10-15/month; some have unlimited reimbursement)
- **Overdraft policy** -- the NSF/overdraft fee amount (commonly $25 to $35 per item), whether there is a daily overdraft fee cap, whether overdraft protection is available (linked savings sweep, overdraft line of credit, or courtesy pay), the cost of overdraft protection transfers (often $10-12 per transfer or free), and whether the institution offers a no-overdraft-fee grace period (some institutions allow a negative balance up to -$50 before charging a fee)
- **Mobile and digital features** -- mobile check deposit (and any daily/monthly deposit limits, e.g., $2,500/day for new accounts, $10,000/day for established accounts), Zelle/peer-to-peer transfer availability, bill pay, external account linking, account alerts, and app store rating (a proxy for real-world reliability)
- **Interest on checking** (if any) -- some high-yield checking accounts offer 3-6% APY on balances up to $15,000 but require 10-15 debit transactions per month and an active direct deposit
- **Deposit insurance** -- FDIC insurance covers up to $250,000 per depositor per institution per ownership category in the US; NCUA covers the same limit for credit unions; verify the equivalent program for other jurisdictions
- **Account opening bonus** (if applicable) -- the bonus amount, the qualifying conditions (e.g., "maintain $1,000 for 90 days"), the timeline to receive the bonus, and whether the bonus is taxable (it is, as ordinary income in most jurisdictions)
- **Early account closure fee** -- some institutions charge $25-50 if an account is closed within 90-180 days of opening, which can eliminate the value of an opening bonus

### Step 3: Apply Weighted Evaluation Criteria

Not all criteria matter equally -- and the weights must reflect the user's profile, not a generic average. Use the following framework to assign a weight (out of 100 total points) and score each account from 1 to 5 on each dimension, then calculate weighted scores.

**Core dimensions and suggested default weights (adjust based on user profile):**

| Dimension | Default Weight | When to Increase Weight | When to Decrease Weight |
|---|---|---|---|
| Monthly cost (fees after waivers) | 30 | User has variable income, low balance | User has high balance, fee easily waived |
| Earnings potential (APY) | 20 | Savings account, balance over $2,000 | Checking account, balance under $1,000 |
| ATM accessibility | 20 | Frequent cash user, travel | Digital-native, rarely uses cash |
| Minimum balance feasibility | 15 | Low or variable balance user | High balance user, minimums easily met |
| Digital features and reliability | 10 | Remote user, no branch preference | Branch user, digital features secondary |
| Overdraft safety | 5 | User with tight cash flow | User with comfortable checking buffer |

**Scoring rubric for Monthly Cost (1-5):**
- 5: No fees under any reasonable scenario for this user's balance/usage pattern
- 4: Fee waived with conditions the user will reliably meet; zero expected cost
- 3: Fee waived with conditions the user may occasionally miss; modest expected annual cost ($0-$30)
- 2: Fee difficult to waive or not waivable; expected annual cost $31-$100
- 1: Fee not waivable or requires conditions incompatible with user's profile; expected annual cost over $100

**Scoring rubric for Earnings Potential (1-5, for savings accounts):**
- 5: APY in top quartile of current market rates (check current FDIC national rate data; as of recent periods, top-tier online savings accounts have ranged from 4.00% to 5.25%)
- 4: APY within 0.50% of top market rate
- 3: APY within 1.00% of top market rate
- 2: APY 1.00% to 2.00% below top market rate
- 1: APY below 1.00% or at the national average for traditional savings (often 0.40-0.60% at major brick-and-mortar institutions)

**Scoring rubric for ATM Accessibility (1-5):**
- 5: Large proprietary or partner network (15,000+ ATMs) with full out-of-network fee reimbursement or unlimited surcharge refunds
- 4: Large network with partial reimbursement ($10-15/month) or no-fee access via shared network
- 3: Moderate network (5,000-15,000 ATMs); some out-of-network fees expected based on user pattern
- 2: Limited network; significant out-of-network fees expected; no reimbursement
- 1: No ATM network or deposit-taking ATMs; cash access requires a separate institution

### Step 4: Calculate the True Annual Financial Impact

Do not compare accounts by listing features -- compare accounts by computing what each one costs or earns in dollar terms over one year, given the user's specific profile. This single calculation often makes the decision obvious.

**For each account, calculate:**

```
Annual Fee Cost = Monthly maintenance fee × 12
                  (set to $0 if the user will reliably meet waiver conditions)

Annual ATM Cost = (Out-of-network ATM uses per month × out-of-network fee)
                  + (Out-of-network ATM uses per month × average surcharge by ATM owner: ~$3.00)
                  − Monthly ATM reimbursement cap (if applicable)
                  × 12

Annual Overdraft Cost = Expected overdraft events per year × overdraft fee
                        (estimate conservatively: 0-2 events/year for careful users,
                         3-6 for users with tight cash flow)

Annual Interest Earned = Average balance × APY
                         (for tiered accounts, calculate per tier:
                          $X at Tier 1 rate + $Y at Tier 2 rate)

Annual Opening Bonus = One-time bonus amount (spread across year 1 only; do not apply to multi-year comparison)

Net Annual Financial Position = Annual Interest Earned + Annual Opening Bonus
                                 − Annual Fee Cost
                                 − Annual ATM Cost
                                 − Annual Overdraft Cost
```

**Critical nuance on tiered APY:** If Account B pays 5.00% APY on balances up to $10,000 and 0.50% above $10,000, and the user maintains $15,000, the blended yield is: ($10,000 × 5.00% + $5,000 × 0.50%) / $15,000 = ($500 + $25) / $15,000 = 3.50%. Present this blended rate clearly, not the headline rate.

**Critical nuance on "effective APY" for reward checking accounts:** High-yield checking accounts that require 10+ debit transactions per month impose a time cost and behavioral constraint. If the user would not naturally meet the transaction threshold, they will earn only the base rate (often 0.05% to 0.10%), not the advertised 4-6%.

### Step 5: Identify the Fee Schedule Landmines

Beyond monthly fees, banking products hide costs in non-obvious places. Review the full fee schedule for each account -- not the marketing summary -- for the following specific fee types that most users miss:

- **Excessive transaction fee (savings accounts):** Historically, US Regulation D limited savings account withdrawals to 6 per month; the Fed suspended enforcement in 2020 but many institutions still impose a $5-15 fee per excess transaction. Confirm the institution's current policy.
- **Paper statement fee:** $1-$3/month if the user does not enroll in e-statements; minor but unnecessary.
- **Inactivity fee:** $5-15/month if the account has no transactions for 6-12 months. Relevant for emergency fund accounts the user intends to rarely touch.
- **Returned deposit/bounced check fee:** $10-20 per returned item if a deposited check bounces. Different from overdraft.
- **Wire transfer fees:** Incoming domestic wire $0-15; outgoing domestic wire $25-35; international wire $45-65. Relevant for users who receive or send large transfers.
- **Stop payment fee:** $20-35 per request. Rarely used but worth noting.
- **Minimum balance fee:** Distinct from monthly maintenance fee at some institutions -- charged only when the balance drops below a threshold, in addition to or instead of a maintenance fee.
- **Account closing fee / early termination fee:** $25-50 if closed within 90-180 days; this can wipe out an opening bonus entirely.

### Step 6: Assess Non-Financial Quality Dimensions

Financial math narrows the field but rarely produces a single obvious winner. These qualitative factors must be assessed explicitly rather than dismissed:

- **Institution stability and reputation:** Credit unions are member-owned nonprofits and often have lower fees and better customer service scores. Neobanks (fintech apps that use partner banks for FDIC insurance) have a mixed track record -- some have experienced partner bank failures or app outages that froze customer funds. Verify that a neobank's partner bank is itself FDIC-insured and that the insurance passes through to the end customer.
- **Customer service access:** 24/7 phone support vs. chat-only vs. email-only. When something goes wrong (unauthorized transaction, locked account, failed transfer), the ability to reach a human immediately has real value.
- **Funds availability policy:** Regulation CC sets minimum check hold periods, but institutions can release funds faster. Direct deposit funds are typically available immediately or by 9 AM on payday. Check deposits may be held 1-7 business days depending on account age and check amount. Some online banks hold check deposits significantly longer, which can cause overdrafts for users who deposit checks frequently.
- **Account opening process:** Some institutions require an in-person branch visit; others are fully online and can be opened in 5 minutes with a Social Security Number and a funding source. Credit unions may require membership eligibility (employer, geography, association).
- **Interest compounding frequency:** The difference between daily and monthly compounding on a savings account balance below $50,000 is negligible (a few cents to a few dollars per year), so do not over-index on this. APY already accounts for compounding by definition.

### Step 7: Build and Deliver the Comparison Matrix with Recommendation

Structure the output with the complete matrix (see Output Format section), the net annual financial position calculation, the weighted score table, a clear decision framework tailored to the user's profile, and a pre-opening checklist. The recommendation should be direct: state which account produces the best outcome for this user's specific situation, acknowledge the trade-offs, and identify the one scenario in which the user might prefer a different option.

---

## Output Format

```
## Bank Account Comparison

**User Profile Summary**
- Account type(s) compared: [Checking / Savings / Both]
- Expected average balance: $[X] checking, $[X] savings
- Cash/ATM usage: [X] out-of-network ATM uses/month
- Direct deposit: [Yes/No -- $X/month]
- Key priority: [Fee avoidance / Maximum earnings / Branch access / Digital convenience]

---

### Section 1: Feature Comparison Matrix

| Feature                        | [Account A Name]      | [Account B Name]      | [Account C Name]      |
|--------------------------------|-----------------------|-----------------------|-----------------------|
| Institution type               | [National / Regional / Credit Union / Online / Neobank] | ... | ... |
| Account type                   | [Checking / Savings / Money Market] | ... | ... |
| Monthly maintenance fee        | $[X]                  | $[X]                  | $[X]                  |
| Fee waiver condition           | [Direct deposit $X/mo / Min balance $X daily / X debit transactions] | ... | None |
| Minimum opening deposit        | $[X]                  | $[X]                  | $[X]                  |
| Minimum balance (ongoing)      | $[X] daily / $[X] average | ... | ... |
| APY                            | [X.XX%]               | [X.XX%]               | [X.XX%]               |
| APY structure                  | [Flat / Tiered / Reward-based] | ... | ... |
| ATM network                    | [Network name + # of ATMs] | ... | ... |
| Out-of-network ATM fee (own)   | $[X.XX]               | $[X.XX]               | $[X.XX]               |
| Out-of-network surcharge reimb.| [None / Up to $X/mo / Unlimited] | ... | ... |
| Overdraft fee                  | $[X] per item         | $[X] per item         | $[X] per item         |
| Overdraft protection available | [Yes -- $X transfer fee / No] | ... | ... |
| Interest on checking           | [X.XX% / None]        | ...                   | ...                   |
| Mobile check deposit limit     | $[X]/day, $[X]/month  | ...                   | ...                   |
| Zelle / P2P transfer           | [Yes / No]            | ...                   | ...                   |
| Early direct deposit           | [Yes -- up to 2 days early / No] | ... | ... |
| Account alerts / notifications | [Yes / No]            | ...                   | ...                   |
| Branch access                  | [Yes / No]            | ...                   | ...                   |
| Deposit insurance              | [FDIC $250K / NCUA $250K / Verify] | ... | ... |
| Account opening bonus          | [$X -- conditions] or None | ...             | ...                   |
| Early closure fee              | [$X if closed within X days / None] | ...   | ...                   |

---

### Section 2: True Annual Financial Impact (Based on Your Profile)

| Calculation Line                         | [Account A]    | [Account B]    | [Account C]    |
|------------------------------------------|----------------|----------------|----------------|
| Annual maintenance fee (after waiver)    | $[X]           | $[X]           | $[X]           |
| Annual ATM cost (out-of-network uses)    | $[X]           | $[X]           | $[X]           |
| Annual ATM surcharge reimbursement       | −$[X]          | −$[X]          | −$[X]          |
| Annual estimated overdraft cost          | $[X]           | $[X]           | $[X]           |
| Annual interest earned on savings        | $[X]           | $[X]           | $[X]           |
| Annual interest earned on checking       | $[X]           | $[X]           | $[X]           |
| One-time opening bonus (Year 1 only)     | $[X]           | $[X]           | $[X]           |
| **Net annual position**                  | **$[X] [cost/benefit]** | **$[X]** | **$[X]** |
| **Year 1 net position (with bonus)**     | **$[X]**       | **$[X]**       | **$[X]**       |

_Note: APY is variable and subject to change. Calculations use current stated rates as a snapshot._

---

### Section 3: Weighted Evaluation Scores

| Criterion              | Weight | [Account A] Score | [Account A] Weighted | [Account B] Score | [Account B] Weighted | [Account C] Score | [Account C] Weighted |
|------------------------|--------|-------------------|----------------------|-------------------|----------------------|-------------------|----------------------|
| Monthly cost           | [X]%   | [1-5]             | [Score × Weight]     | [1-5]             | [Score × Weight]     | [1-5]             | [Score × Weight]     |
| Earnings potential     | [X]%   | [1-5]             | [Score × Weight]     | [1-5]             | [Score × Weight]     | [1-5]             | [Score × Weight]     |
| ATM accessibility      | [X]%   | [1-5]             | [Score × Weight]     | [1-5]             | [Score × Weight]     | [1-5]             | [Score × Weight]     |
| Minimum feasibility    | [X]%   | [1-5]             | [Score × Weight]     | [1-5]             | [Score × Weight]     | [1-5]             | [Score × Weight]     |
| Digital features       | [X]%   | [1-5]             | [Score × Weight]     | [1-5]             | [Score × Weight]     | [1-5]             | [Score × Weight]     |
| Overdraft safety       | [X]%   | [1-5]             | [Score × Weight]     | [1-5]             | [Score × Weight]     | [1-5]             | [Score × Weight]     |
| **Total**              | **100%** |                 | **[X.X / 5.0]**      |                   | **[X.X / 5.0]**      |                   | **[X.X / 5.0]**      |

---

### Section 4: Key Differentiators

1. **[Biggest financial impact differentiator]:** [Specific dollar amounts and explanation of which accounts win/lose and why]
2. **[Access or usability differentiator]:** [Specific trade-off with its practical implication for this user]
3. **[Fee structure differentiator]:** [Specific risk scenario where one account becomes significantly more expensive]
4. **[Feature differentiator]:** [Which account offers something the others do not, and whether that matters for this user]

---

### Section 5: Decision Framework

- **[Account A name] is the best fit if:** [Specific user scenario -- describe the profile that makes this account clearly optimal]
- **[Account B name] is the best fit if:** [Different specific scenario]
- **[Account C name] is the best fit if:** [Different specific scenario]
- **Consider using two accounts together if:** [Scenario where splitting funds across accounts produces better outcomes than choosing one]

---

### Section 6: Recommended Choice for Your Profile

**Recommendation: [Account Name]**

[2-4 sentences explaining why this account produces the best outcome for this user's specific balance, usage pattern, and priorities. Include the net annual financial difference vs. the next-best option in dollar terms. Acknowledge the primary trade-off the user accepts by choosing this account.]

**When to reconsider this recommendation:**
- If [specific condition changes -- e.g., balance drops below $X, user moves cities, APY changes by more than 1%]
- If [second condition]

---

### Section 7: Pre-Opening Due Diligence Checklist

**Before opening [recommended account]:**
- [ ] Confirm deposit insurance by looking up the institution in the FDIC BankFind or NCUA research tool [verify equivalent for your jurisdiction]
- [ ] Download and read the full fee schedule (not the account summary card) -- specifically search for: inactivity fees, excess transaction fees, paper statement fees, wire fees, and early closure fees
- [ ] Confirm the exact definition of the fee waiver condition in writing (e.g., does "direct deposit" include ACH transfers from payment apps, or only employer payroll?)
- [ ] Verify the current APY directly on the institution's website -- rates change frequently and comparison aggregator sites may be delayed
- [ ] Check the mobile app rating on both major app stores; read 1-star reviews for recurring themes (deposit holds, login issues, customer service)
- [ ] Confirm the mobile check deposit limit will accommodate your largest expected deposit
- [ ] Check whether a new account bonus requires a specific promo code or in-branch enrollment (missing this step forfeits the bonus)
- [ ] Set a calendar reminder for [X] days before any early closure fee window expires
- [ ] Confirm overdraft protection options and decide whether to opt in before your first transaction
- [ ] If transferring from an existing account: keep the old account open with a small balance for 60-90 days while updating all automatic payments and direct deposits, to avoid missed payments or rejected ACH transactions
```

---

## Rules

1. **Always lead with the annual dollar impact calculation before qualitative scores.** Users consistently make better decisions when they see "$165/year difference" than when they see "4 out of 5 stars vs. 3 out of 5 stars." Quantify first, qualify second.

2. **Never use the headline APY as the basis for comparison without checking tier structure and eligibility conditions.** A 5.00% APY that only applies to the first $500 is meaningless for a user with $8,000 to deposit. Always compute the blended or effective APY for the user's actual balance across the full tier schedule.

3. **Always distinguish between minimum daily balance and minimum average monthly balance when evaluating fee waiver conditions.** A user who receives one large payment per month (e.g., freelance income) can maintain a high monthly average while frequently dipping below a daily minimum, which triggers fees at some institutions but not others. This single distinction can flip the cost calculation entirely.

4. **Recalculate the ATM cost assumption explicitly.** When a user says they "occasionally" use out-of-network ATMs, clarify the frequency. "Occasionally" can mean once a year ($3.50) or twice a week ($364/year). The ATM cost is often the largest hidden expense in a checking account comparison.

5. **Never present a neobank or fintech account without explicitly verifying the deposit insurance pass-through structure.** Some fintech apps hold user funds in pooled custodial accounts at partner banks; if the fintech fails, insurance claims can be complex and delayed. Others have clean pass-through FDIC coverage. This is not a theoretical risk -- multiple fintech banking intermediaries have experienced operational failures affecting customer fund access.

6. **Never compare savings account APYs as if they are fixed.** Savings account rates are variable and move with the federal funds rate. A 4.75% APY today may be 3.50% in six months. Note the rate environment context and recommend the user set a calendar reminder to review the rate in 6 months.

7. **Always include the opening bonus in Year 1 calculations separately from ongoing annual calculations.** An account with a $300 opening bonus that requires 90 days of $2,000 minimum balance may appear superior in Year 1 but be clearly inferior from Year 2 onward. Present both timeframes so the user understands the true long-term picture.

8. **Do not recommend closing an existing account until the user has confirmed all automatic payments and direct deposits have been successfully migrated.** A single missed auto-pay due to an abrupt account switch can trigger a late fee ($30-50), returned payment fee ($25-35 from the payee), and potentially a credit score impact if the payment is more than 30 days late. Always recommend a parallel-account transition period of at least 60 days.

9. **Weight ATM accessibility higher for any user who handles cash regularly or lives outside a major metropolitan area.** The assumption that "everyone banks digitally now" is incorrect and systematically disadvantages users who work in cash-intensive industries, live in rural areas with limited ATM coverage, or regularly deal with cash-paying customers or tenants.

10. **If the user is evaluating accounts with a balance under $1,000, de-weight APY almost entirely and concentrate the comparison on fee avoidance.** At $800 average balance, the difference between 0.50% APY and 4.50% APY is $32/year. One avoidable monthly fee of $12 ($144/year) or three out-of-network ATM transactions ($10.50) eliminates the entire APY advantage. Make this math explicit to the user.

11. **Always check for inactivity fees before recommending an account for emergency fund use.** Emergency funds, by design, sit untouched for months or years. An account that charges an inactivity fee after 12 months of no transactions is structurally unsuitable for emergency fund storage regardless of its APY.

12. **Flag any account with a per-item overdraft fee above $30 as a notable risk.** The CFPB has reported that overdraft fees can effectively generate APR-equivalent costs of 3,500% or more when a small shortfall triggers a $35 fee. Always describe overdraft protection options and strongly recommend the user enroll in the lowest-cost protection tier (linked savings account sweep is typically free or $10/transfer vs. $35 per overdraft).

---

## Edge Cases

### User Has Only One Account to Evaluate
Do not simply refuse to compare. Evaluate the single account against the user's banking profile and produce a single-account assessment: rate it on each criterion, calculate its annual financial impact, identify which features are genuinely strong, and identify specific gaps (e.g., "the 0.45% APY is well below current market rates for savings accounts; on your $4,000 balance, you are forgoing approximately $120/year in interest compared to top-tier online savings rates"). Then recommend the user obtain at least one competing offer for comparison and specify which account characteristics to prioritize in the search.

### User Is Comparing an Online-Only Account Against a Traditional Bank Account
This is one of the most common comparison scenarios and carries a consistent pattern: online accounts offer 5-10x higher APY and lower or zero fees; traditional banks offer branch access, cash deposit capability, relationship benefits, and in-person service. The framework to apply:
- Quantify the annual APY difference in dollars (the most persuasive number for most users)
- Explicitly ask whether the user deposits cash regularly -- online banks generally cannot accept cash deposits (some allow Green Dot reload locations for a $4-5 fee; this is almost never worth it)
- Ask whether the user has ever needed to visit a branch and what for -- notarizations, cashier's checks, safe deposit boxes, in-person wire transfers, and complex loan applications are not available from online-only accounts
- Recommend a "hub and spoke" model for many users: a traditional checking account for daily transactions and cash access, paired with a high-yield online savings account for reserves. This captures the best of both and is the optimal structure for most users who keep more than $2,000 in savings.

### User Has an Irregular Income (Freelancers, Gig Workers, Self-Employed)
Fee waivers tied to minimum balances are preferable to fee waivers tied to direct deposit for users with irregular income, because their deposit frequency and amounts are unpredictable. Key adjustments:
- Weight minimum average balance waiver conditions higher than direct deposit waivers
- Increase the overdraft risk score -- irregular income creates more frequent near-zero balance periods
- Flag accounts with "direct deposit required" waivers as higher risk -- ACH transfers from payment platforms (Venmo, PayPal, Stripe) are sometimes rejected as non-qualifying direct deposits
- Consider credit unions with no monthly fee as a strong option for this profile; credit unions have no profit motive to monetize low-balance periods

### User Is a College Student or Has Limited Credit/Banking History
Some institutions impose additional restrictions on new customers: lower mobile deposit limits ($500/day vs. $5,000/day), longer check holds (7 business days vs. 1), fewer overdraft protection options. Key adjustments:
- Prioritize accounts explicitly marketed to students or those with starter features -- these are calibrated for thin-file customers
- Note that some checking accounts require a ChexSystems check (similar to a credit check but for banking history); users with prior account closures due to unpaid negative balances may be declined and need a second-chance checking account
- De-weight APY entirely; a student keeping $200-400 in checking earns $0.40-1.60/year at 4% APY -- zero practical relevance
- Highlight overdraft fee risk heavily; students are the demographic most likely to overdraft and least likely to have a buffer

### User Wants to Maximize FDIC/NCUA Insurance Coverage Above $250,000
This is relevant for users with large savings. Key guidance:
- The $250,000 limit is per depositor per institution per ownership category
- A married couple can achieve $500,000 in coverage at a single institution using individual accounts ($250K each)
- Adding beneficiaries to a payable-on-death (POD) account can multiply coverage: one account with 4 beneficiaries = up to $1,000,000 in coverage at one institution
- Spreading funds across multiple FDIC-insured institutions is the simplest strategy for large balances
- The IntraFi (formerly CDARS) network allows placement of multi-million dollar deposits across hundreds of institutions while maintaining a single banking relationship
- Verify current FDIC rules as they are subject to change; direct the user to the FDIC's Electronic Deposit Insurance Estimator (EDIE)

### User Is Evaluating Accounts in Two Different Countries or Currencies
The comparison framework applies universally, but specific values require localization:
- Deposit insurance program, limit, and coverage categories vary by country (e.g., FSCS in the UK covers £85,000; European DGS covers €100,000)
- Wire transfer fees and foreign exchange conversion fees become relevant -- account for both the institution's spread above mid-market rate (typically 1-3%) and any flat fee per transaction
- Some jurisdictions impose banking regulations that affect fee structures, overdraft limits, or mandatory features
- APY comparisons across currencies are not meaningful without accounting for inflation differentials and currency risk
- Recommend the user work with a professional advisor for multi-currency banking strategy

### High-Yield Checking Account with Transaction Requirements
These accounts (commonly offered by community banks and credit unions) advertise 3-6% APY on checking balances up to $10,000-$20,000 but require 10-15 debit card transactions per month, at least one direct deposit or ACH transaction, and enrollment in e-statements. They require special handling:
- Calculate the "break-even" transaction burden: at 12 required transactions/month = 144 transactions/year. For a user who naturally makes 2-3 debit transactions/month, manufacturing 9-10 additional small transactions (e.g., $0.01 Amazon reloads or vending machine purchases) is a behavioral overhead that many users will eventually fail to maintain
- Compute what happens in any month where the user fails to meet the threshold -- the account typically drops to a base rate of 0.01-0.10% for that month, and on a $10,000 balance, one failed month reduces annual interest by approximately $40-50
- Present the "reliable scenario" APY (user consistently meets requirements) and the "miss scenario" APY (user misses 1-2 months per year) side by side

### User Is Considering an Account Solely for a New Account Opening Bonus
Opening account bonuses ($200-$400 is common; some premium accounts offer $700-$900) can be valuable but require careful analysis:
- Annualize the bonus: a $300 bonus that requires a $2,000 minimum balance for 90 days represents a 60% annualized return on the locked capital -- a strong deal if the conditions are easily met
- Calculate the opportunity cost of the minimum balance requirement: $2,000 at 4.75% APY for 90 days = approximately $24 in foregone interest if moved from a high-yield account
- Check the "net deposit" requirement -- some bonuses require that the deposit be "new money" (not transferred from another account at the same institution)
- Confirm the bonus is still available and has not expired; bonus offers are frequently time-limited
- Factor in any early closure fee that could eat the bonus if the user closes the account promptly after receiving it
- If the user plans to "churn" multiple bank bonuses, note that multiple recent ChexSystems inquiries may affect eligibility for subsequent accounts, and bonus income is taxable (the bank will issue a 1099-INT or 1099-MISC)

---

## Example

**Input:** "I'm comparing three accounts. I make about $3,200/month from my employer via direct deposit and keep around $6,000 split between checking ($1,500) and savings ($4,500). I use the ATM probably 3 times a month and two of those are usually out-of-network because of my neighborhood. Here's what I'm looking at:

Account 1 -- Regional Bank Checking: $12/month fee, waived with $500/month direct deposit. ATM network has 3,000 ATMs in-state. $2.50 out-of-network fee per use; no surcharge reimbursement. Overdraft fee $35/item. Mobile deposit up to $3,000/day.

Account 2 -- Online Bank Checking: No monthly fee, no minimum balance. ATM fee reimbursed up to $15/month. $3.50 own fee per out-of-network use, but reimbursed. Overdraft fee $0 (declines the transaction instead). Mobile deposit $5,000/day.

Account 3 -- Credit Union Checking: $5/month fee waived with 10 debit transactions/month. Part of the 40,000-ATM CO-OP network. No out-of-network fee from the credit union; ATM owner surcharges apply. Overdraft protection via linked savings transfer at $5/transfer. Mobile deposit $2,500/day.

For savings, I'm comparing: Online HYSA at 4.60% APY (no fees, no minimum), and my current Regional Bank savings at 0.50% APY (no fees, no minimum)."

---

**Output:**

## Bank Account Comparison

**User Profile Summary**
- Account types compared: Checking (3 options) + Savings (2 options)
- Expected average balance: $1,500 checking, $4,500 savings
- ATM usage: 3 uses/month -- approximately 2 out-of-network, 1 in-network
- Direct deposit: Yes -- $3,200/month from employer
- Key priorities: Fee avoidance (checking), Maximum earnings (savings)

---

### Section 1: Feature Comparison Matrix

**Checking Accounts**

| Feature                        | Account 1: Regional Bank        | Account 2: Online Bank          | Account 3: Credit Union         |
|--------------------------------|---------------------------------|---------------------------------|---------------------------------|
| Institution type               | Regional bank                   | Online-only bank                | Credit union                    |
| Account type                   | Checking                        | Checking                        | Checking                        |
| Monthly maintenance fee        | $12                             | $0                              | $5                              |
| Fee waiver condition           | $500+/month direct deposit      | None required                   | 10 debit transactions/month     |
| Minimum opening deposit        | [Not stated -- verify]          | [Not stated -- verify]          | [Not stated -- verify]          |
| APY on checking                | None stated                     | None stated                     | None stated                     |
| ATM network                    | Proprietary, 3,000 in-state     | No proprietary network          | CO-OP, 40,000 ATMs              |
| Out-of-network ATM fee (own)   | $2.50/use                       | $3.50/use (reimbursed)          | $0 own fee                      |
| Out-of-network surcharge reimb.| None                            | Up to $15/month                 | None (ATM owner surcharges apply) |
| Overdraft fee                  | $35/item                        | $0 (transaction declined)       | $0 (linked savings transfer)    |
| Overdraft protection           | Not stated                      | Decline only (no fee)           | Linked savings sweep, $5/transfer |
| Mobile check deposit limit     | $3,000/day                      | $5,000/day                      | $2,500/day                      |
| Branch access                  | Yes                             | No                              | Likely (verify local branches)  |
| Deposit insurance              | FDIC -- verify $250K coverage   | FDIC -- verify pass-through     | NCUA -- verify $250K coverage   |

**Savings Accounts**

| Feature                        | Online HYSA                     | Regional Bank Savings           |
|--------------------------------|---------------------------------|---------------------------------|
| APY                            | 4.60%                           | 0.50%                           |
| Monthly fee                    | $0                              | $0                              |
| Minimum balance                | $0                              | $0                              |
| Access type                    | Online only; transfers to linked checking | Online + branch         |
| Branch access                  | No                              | Yes (same institution as Account 1) |
| Deposit insurance              | FDIC -- verify pass-through     | FDIC -- verify $250K            |

---

### Section 2: True Annual Financial Impact (Based on Your Profile)

**Checking Account Analysis**

| Calculation Line                         | Account 1: Regional Bank | Account 2: Online Bank  | Account 3: Credit Union |
|------------------------------------------|--------------------------|-------------------------|-------------------------|
| Annual maintenance fee (after waiver)    | $0 (direct deposit meets $500 threshold) | $0           | $0 (if 10 debit transactions met reliably) |
| Annual fee if waiver condition fails     | $144 (12 months × $12) as risk | $0 (no condition) | $60 (12 months × $5) as risk |
| Annual ATM cost -- own institution fee   | 1 use × $2.50 × 12 = $30 | 2 uses × $3.50 × 12 = $84 (reimbursed) | $0 (CO-OP network, 40K ATMs) |
| Annual ATM surcharge (ATM owner fee ~$3/use) | 2 uses × $3.00 × 12 = $72 | 2 uses × $3.00 × 12 = $72 (reimbursed up to $15/mo) | 2 uses × $3.00 × 12 = $72 (not reimbursed) |
| Annual ATM reimbursement                 | $0                       | Up to $180 (covers all surcharges and own fees above) | $0 |
| **Net annual ATM cost**                  | **$102**                 | **$0** (fully covered by $15/mo limit) | **$72** |
| Annual estimated overdraft cost          | ~$35 (assume 1 event/year -- tight month) | $0 (transaction declined) | $5 (1 savings sweep/year) |
| Annual interest earned on checking       | $0                       | $0                       | $0                       |
| **Net annual checking cost**             | **$102** (ATM) + **$35** (OD risk) = **$137** | **$0** | **$72** (ATM) + **$5** (OD) = **$77** |

_Account 1 waiver note: The $3,200/month employer direct deposit reliably meets the $500 threshold. Fee waiver risk for Account 1 is low. However, the ATM cost remains regardless of waiver status._

_Account 3 waiver note: At 10 required debit transactions per month, assess your actual debit usage. If you currently make 10+ debit purchases per month naturally, the waiver is reliable. If not, Account 3 carries a $60/year fee risk._

**Savings Account Analysis (at $4,500 average balance)**

| Calculation Line                         | Online HYSA             | Regional Bank Savings   |
|------------------------------------------|-------------------------|-------------------------|
| Annual interest earned                   | $4,500 × 4.60% = **$207** | $4,500 × 0.50% = **$22.50** |
| Annual fee                               | $0                      | $0                      |
| **Net annual savings benefit**           | **$207**                | **$22.50**              |
| **Annual earnings difference**           | **$184.50 more in Online HYSA** | -- |

---

### Section 3: Weighted Evaluation Scores

_Weights adjusted for this user: fee avoidance is highest priority for checking; ATM cost is significant given usage pattern._

**Checking Accounts**

| Criterion              | Weight | Acct 1 Score | Acct 1 Weighted | Acct 2 Score | Acct 2 Weighted | Acct 3 Score | Acct 3 Weighted |
|------------------------|--------|--------------|-----------------|--------------|-----------------|--------------|-----------------|
| Monthly cost (fee + ATM) | 35%  | 2            | 0.70            | 5            | 1.75            | 4            | 1.40            |
| ATM accessibility      | 25%    | 3            | 0.75            | 5            | 1.25            | 4            | 1.00            |
| Overdraft safety       | 20%    | 2            | 0.40            | 5            | 1.00            | 4            | 0.80            |
| Digital features       | 10%    | 3            | 0.30            | 5            | 0.50            | 3            | 0.30            |
| Minimum feasibility    | 5%     | 5            | 0.25            | 5            | 0.25            | 4            | 0.20            |
| Branch access          | 5%     | 5            | 0.25            | 1            | 0.05            | 3            | 0.15            |
| **Total**              | **100%** |            | **2.65 / 5.0**  |              | **4.80 / 5.0**  |              | **3.85 / 5.0**  |

---

### Section 4: Key Differentiators

1. **ATM cost -- the biggest dollar difference:** Account 1 costs you approximately $102/year in ATM fees based on your usage pattern (2 out-of-network uses/month). Account 2 covers all of this through its $15/month reimbursement policy, reducing your ATM cost to $0. Account 3 eliminates the institution's own fee via the CO-OP network but does not reimburse the ~$3 ATM owner surcharge, leaving you with $72/year in costs. Over 5 years, the ATM cost difference between Account 1 and Account 2 is $510 -- a material amount.

2. **Overdraft risk -- Account 1 is the clear loser:** A single overdraft at Account 1 costs $35. Account 2 simply declines transactions (no fee, no embarrassment if you monitor balances), while Account 3 sweeps from savings for $5/transfer. Given that your $1,500 checking balance could have occasional tight periods, the overdraft structure matters. Account 1's $35 fee is a significant downside risk compared to the other two options.

3. **Fee waiver reliability -- Account 3 has hidden risk:** Account 1's waiver is reliable because your employer direct deposit far exceeds the $500 threshold. Account 3's waiver requires 10 debit transactions per month -- verify you currently make that many naturally. If you miss the threshold even once, it costs $5 for that month. Over a year, one or two missed months is a realistic risk ($10-15 impact), but still far less than Account 1's ATM costs.

4. **Savings APY -- $184.50/year is not trivial:** The gap between 4.60% and 0.50% APY on $4,500 produces $184.50 in additional annual interest. If your savings balance grows over time (which
