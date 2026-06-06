---
name: freelance-rate-calculator
description: |
  Calculates sustainable freelance hourly and project rates from target annual income,
  billable hours assumption, overhead costs, and desired profit margin. Produces a
  complete rate calculation worksheet with formulas and pricing tiers.
  Use when the user wants to set freelance rates, calculate how much to charge for
  freelance work, determine project pricing, or figure out an hourly rate for consulting.
  Do NOT use for business financial modeling (use business finance skills), investment
  calculations (use personal-finance skills), or salary negotiation as an employee
  (use salary-negotiation-script).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "freelancing career budgeting personal-finance"
  category: "career-development"
  subcategory: "freelancing"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Freelance Rate Calculator

## When to Use

**Use this skill when the user:**
- Wants to calculate a sustainable hourly or project rate for freelance or independent consulting work -- including first-time freelancers setting initial rates, experienced freelancers auditing whether their current rates still make sense, or anyone transitioning from employment to self-employment
- Asks what to charge for a specific project and needs to verify whether the proposed fee covers their true costs and income goals
- Is building a freelance services menu or rate card and needs a defensible, math-backed foundation for each price point
- Wants to understand how many clients or projects they need to hit an income target, working backward from a desired rate
- Is comparing freelance income viability against a salaried job offer -- needing to calculate what hourly rate makes freelancing financially equivalent to or better than the salary
- Needs to establish internal benchmarks for fixed-price project scoping, even if they plan to quote only flat project fees to clients
- Wants to model how rate changes affect annual income -- for example, what raising their rate by $25/hour does to their annual take-home given realistic utilization

**Do NOT use this skill when:**
- The user is negotiating a salary, raise, or promotion as a W-2 employee -- use `salary-negotiation-script` instead
- The user needs full business financial modeling, multi-year revenue projections, or investor-facing financial statements -- use business finance planning skills
- The user is calculating return on investment for financial instruments, retirement accounts, or business capital expenditures -- use personal-finance or investment-modeling skills
- The user is setting pricing for a SaaS product, physical goods, or an agency billing team of employees -- this skill is designed for individual contributors billing their own time
- The user is analyzing whether to incorporate or change business structure for tax purposes -- refer to a qualified accountant; this skill does not give tax or legal advice
- The user is pricing creative licensing, royalties, or intellectual property rights -- those involve different economics and are outside this skill's scope

---

## Process

### Step 1: Gather and Clarify All Inputs

Before running any math, collect the complete picture of the user's financial situation and work expectations. Missing even one input causes downstream errors that result in a rate that either undersells the user or prices them out of the market.

- **Target net annual income:** This is the after-tax amount the user wants to actually keep for personal living expenses. Push back gently if the user provides a gross number -- ask them to confirm whether the figure they gave is before or after taxes, since confusing gross with net is one of the most common errors in freelance rate calculation.
- **Annual business operating expenses:** Itemize these explicitly. Common line items include software subscriptions (design tools, project management, cloud storage), professional liability / errors and omissions insurance, health and dental insurance if not covered elsewhere, home office costs or coworking membership, equipment and hardware depreciation, professional association memberships and certifications, accounting software and bookkeeping fees, and continuing education or courses. For users who do not know their expenses, use the baseline template in Edge Cases.
- **Benefits the user must self-fund:** In employment, benefits are often 25-35% of total compensation. As a freelancer, the user bears 100% of these costs. Relevant line items: health insurance premiums (individual market plans commonly run $400-$800/month in the US depending on age and plan tier), dental and vision coverage, disability insurance (often overlooked -- roughly 1-3% of annual income for a basic policy), and retirement savings contributions (the user should aim for at least 10-15% of gross income, more if they are catching up).
- **Self-employment tax rate:** In the United States, self-employed individuals pay both the employee and employer portions of Social Security and Medicare taxes -- 15.3% on net self-employment income up to the Social Security wage base ($168,600 in 2024), then 2.9% Medicare on income above that base. The deductible half of SE tax slightly reduces the effective rate. For planning, 14-15% is a practical estimate for the SE tax component alone. When combined with federal and state income tax, total effective tax rates commonly reach 25-35% for freelancers earning $60,000-$150,000. If the user's jurisdiction differs materially, use their provided rate or note the assumption prominently.
- **Desired profit margin or buffer:** This is the amount above break-even that the user wants to retain for business growth, emergency reserves, and income variability. A 15-20% buffer is standard and defensible. The buffer absorbs slow months, late-paying clients, and unanticipated expenses.
- **Vacation, holidays, and personal time:** Ask how many weeks of vacation the user plans to take, and whether they will work on standard public holidays. In the US, 10 federal holidays and 2-3 weeks of vacation is a reasonable baseline. More generous PTO assumptions reduce billable hours and push the hourly rate higher -- this is not a bug, it is accurate math.
- **Target daily billable hours:** Most freelancers do not bill 8 hours every working day. A realistic sustained target for experienced freelancers is 6-7 billable hours per day. New freelancers or those building a client base often hit only 4-5. Ask the user what they are realistically aiming for.
- **Experience level and discipline:** This is used in the rate validation step, not the calculation itself, but collecting it upfront allows the AI to flag whether the calculated rate is inside, below, or above market range for their specific field.

---

### Step 2: Build the Revenue Required Stack

Work backward from take-home income to gross revenue needed. The mechanics here are counterintuitive -- the user must gross more than their target net income because taxes, expenses, and benefits all come out before they see their take-home.

- **The iterative tax calculation problem:** Self-employment tax is calculated as a percentage of gross income. But you do not know gross income until you know tax. Solve this with a multiplier rather than iteration. If the user's target net income after ALL deductions (expenses, benefits, SE tax, income tax) is N, and their combined effective tax rate is T (expressed as a decimal, e.g., 0.28 for 28%), the gross needed just for income is approximately N / (1 - T). Apply this as an intermediate step.
- **Correct stacking order:** Start with target net income → add self-funded benefits (these come out of gross before retirement savings reduce taxable income, but after SE tax in most cases) → add operating expenses → gross up for taxes → add profit buffer. Do NOT simply add a flat "tax percentage" to net income and call it done -- this always underestimates the gross needed.
- **Practical example of the gross-up:** A user wanting $70,000 net, with $8,000 in expenses, $12,000 in benefits, facing a 28% combined effective tax rate, and wanting a 15% buffer needs approximately ($70,000 + $8,000 + $12,000) / (1 - 0.28) = $90,000 / 0.72 = $125,000 before the buffer. Adding 15% gives $143,750 total revenue needed. This is meaningfully different from naively adding 28% to $90,000.
- **Benefits are not tax-deductible in the simple way employees assume:** Health insurance premiums for self-employed individuals are deductible as an adjustment to gross income on Schedule 1 (in the US), but this reduces income tax -- not self-employment tax. The practical effect is that the deduction partially offsets the cost but does not eliminate it. For simplicity and conservatism, include the full benefits cost in the stack without reducing for partial deductibility, and flag this as a conservative estimate.
- **Profit buffer mechanics:** Apply the buffer as a multiplier to the subtotal, not as a fixed dollar add-on. A 15% buffer on $120,000 of costs is $18,000 -- which grows proportionally as the user's cost structure grows.

---

### Step 3: Calculate Realistic Billable Hours

This step is where most freelance rate calculations fail. The instinct is to divide by 2,080 (52 weeks x 40 hours). The actual billable hours for a typical freelancer are 1,000-1,400 per year. The gap between these two numbers creates a massive underpricing error.

- **Start with total working weeks:** 52 weeks minus vacation weeks. For a user taking 3 weeks vacation, that is 49 working weeks.
- **Subtract holidays:** Divide total holidays by 5 to get holiday weeks equivalent or simply subtract holiday days from total working days. With 10 US federal holidays, working days = (49 weeks x 5 days) - 10 = 235 days.
- **Calculate total potential working hours:** Working days x target billable hours per day. At 7 hours/day, 235 days = 1,645 hours.
- **Apply the non-billable time reduction:** Non-billable activities include: client acquisition and sales calls, writing proposals and scoping documents, invoicing and bookkeeping, email, communication, and project management overhead, professional development and keeping skills current, networking and community participation, internal business administration and planning. For experienced freelancers with a steady client base, non-billable time is typically 25-30% of total hours. For freelancers building a book of business or with 0-2 years experience, use 35-45%. For solopreneurs who are also handling all their own marketing, 35-40% is the realistic baseline.
- **Convert non-billable percentage to hours:** At 30% non-billable on 1,645 hours: 1,645 x 0.30 = 494 non-billable hours. Billable hours = 1,645 - 494 = 1,151. Round to 1,150 or present as-is.
- **Sick days and unplanned absences:** Build in a realistic allowance. Even healthy, disciplined freelancers lose 5-10 days per year to illness, family obligations, or equipment failures. Deducting 7 days at 7 hours = 49 hours. Adjusted billable hours: approximately 1,100. This level of specificity is often eye-opening for new freelancers who assumed they would bill 50 hours per week.
- **Present both a conservative and a target scenario:** The conservative case uses 40% non-billable and the sick day allowance. The target case uses 28-30% non-billable and no sick day adjustment. Showing both gives the user a floor and a ceiling for their rate sensitivity.

---

### Step 4: Calculate the Base Hourly Rate

The core formula is simple: divide total annual revenue needed by realistic billable hours. The sophistication is in the inputs, not the division.

- **Base hourly rate = Total Revenue Needed / Billable Hours Per Year.** Present this calculation explicitly with both numbers visible.
- **Round to a psychologically clean number:** Round up to the nearest $5 for rates under $100/hour. Round to the nearest $25 for rates above $100/hour. A rate of $127 is harder to defend conversationally than $130; $178 should become $180 or $175 depending on market positioning.
- **Calculate the sensitivity of the rate to assumptions:** Show the user what the rate becomes if billable hours drop by 10% (e.g., from 1,200 to 1,080) -- the rate rises by ~11%. This matters because it illustrates that rate cushion is a form of utilization insurance.
- **Flag the minimum viable rate:** Calculate the rate at which the user breaks even on expenses and taxes but earns zero profit -- this is the floor below which they are losing money. The floor rate = (Expenses + Benefits + SE Tax + Income Tax) / Billable Hours. Any project priced below this floor costs the user money to complete.
- **Do not present the rate as a negotiating starting point that should be discounted:** The calculated rate is the sustainable rate. Discounting below this rate to win business is a path to financial distress. The rate tiers (Step 5) provide the appropriate framework for structured discounts.

---

### Step 5: Build the Rate Tier Structure

A single hourly rate leaves money on the table in high-urgency situations and can cost work in high-volume ongoing relationships. A three-tier structure captures appropriate premiums and provides a defensible retention incentive.

- **Standard rate:** The calculated base rate. Used for typical project work with normal lead times (5+ business days).
- **Rush rate (1.5x multiplier):** Applied when a client needs delivery in fewer than 3 business days, requires weekend or evening work, or asks the user to displace other client work. The 1.5x multiplier is standard across most creative and knowledge-work disciplines. For highly specialized technical work (security auditing, ML engineering, certain legal or medical writing), 2x rush is defensible and common.
- **Retainer or volume discount rate (0.85-0.90x multiplier):** Applied when a client commits to a minimum monthly hour block, typically 15-20+ hours per month. The discount is justified by reduced sales overhead, predictable cash flow, and the value of guaranteed revenue. For clients committing 30+ hours monthly, 0.80-0.85x is reasonable. Do NOT apply retainer rates to clients who want the discount without the commitment -- the discount is the incentive for the guarantee, not a general friendliness concession.
- **Discovery or consultation rate:** Some freelancers charge a separate rate for discovery, scoping, or strategic consulting work that does not produce a deliverable. This rate is often the standard hourly rate or slightly above. Flag this as optional but note that charging for strategy work that clients sometimes assume is free is a sign of professional seniority.
- **Minimum project fee:** Calculate this as the standard hourly rate multiplied by a minimum engagement threshold (typically 3-5 hours). Projects below this threshold generate disproportionate overhead relative to revenue. A designer at $120/hour might set a $360-$600 minimum. This protects against "quick favor" requests from clients who undervalue small jobs.

---

### Step 6: Convert to Project Pricing

Project pricing protects the user from scope creep and makes budgeting easier for clients. The conversion requires three components: hour estimation, a scope buffer, and a structured quoting approach.

- **Hour estimation per project type:** Ask the user what their typical project types are and how many hours each usually takes. If they do not know from experience, provide reasonable baselines for their field (see Edge Cases for field-specific ranges). Common creative project types and typical experienced-practitioner hour ranges: brand identity package 25-40 hours, marketing website 5-page 40-60 hours, email campaign (copy + design) 8-15 hours, technical white paper (writing) 20-35 hours, API integration project 30-80 hours, UX audit for existing product 15-25 hours.
- **Scope buffer multiplication:** Multiply estimated hours by 1.10 to 1.20 before applying the hourly rate. This accounts for estimation error, inevitable scope discussions, internal revisions beyond stated rounds, and project management overhead. Use 1.15 as the default. For projects with vague or evolving requirements, use 1.20-1.25. For tightly scoped repeat work, 1.10 may suffice.
- **The value-based pricing check:** After calculating the cost-based project price (hours x rate x buffer), ask whether the value delivered to the client is materially greater than this number. A freelancer doing a $5,000 brand identity for a company that will print it on $50,000 of collateral and use it for 5 years is delivering $55,000+ of value. Value pricing suggests the project price could be $7,000-$10,000. Flag this opportunity when the project scope involves assets with long useful life, high production volume, or significant downstream impact. Do NOT override the math-based price with a value-based number without the user's explicit direction -- just surface the opportunity.
- **Revision and change order thresholds:** Build into project quotes a clear statement of what is included (e.g., "two rounds of revisions included"). Work beyond the included scope converts to hourly billing at the standard rate. This converts project pricing from a fixed-fee risk into a defined scope with a clear expansion mechanism.
- **Retainer calculation:** Monthly retainer fee = Committed hours per month x Retainer hourly rate. Also express the annual value to help the user understand the business significance. A 20-hour/month retainer at $108/hour = $2,160/month = $25,920/year. That is the annual salary equivalent of one meaningful client relationship.

---

### Step 7: Validate the Rate Against Market Reality

A rate calculated entirely from internal math may be out of step with what clients in the user's market will pay -- or may be shockingly below it. This step surfaces those gaps.

- **Market range by discipline and experience level:** Provide approximate ranges for common freelance disciplines. Note these vary by geography (US/Canada/Western Europe command higher rates than other markets) and specialization. General guidance for US-based freelancers:
  - Graphic design: $60-$150/hour (junior-to-senior), brand specialists and packaging designers on the high end
  - Web development (front-end): $75-$175/hour, higher for React/modern stack specialists
  - Back-end/full-stack development: $100-$250/hour, higher for architects and DevOps-capable engineers
  - Technical writing: $60-$120/hour
  - Copywriting and content: $50-$150/hour, conversion copywriters at the top end
  - UX/product design: $90-$200/hour
  - Data analysis and business intelligence: $80-$175/hour
  - Financial modeling and CFO consulting: $150-$400/hour
  - Management consulting: $150-$500/hour
  - Software architecture and advisory: $200-$400/hour
- **Rate positioning interpretation:**
  - If the calculated rate is >20% below the market low end: the user is either dramatically underestimating their target income, overestimating billable hours, or underestimating costs. Flag this explicitly -- taking below-market rates often signals undervaluation, not competitive positioning.
  - If the calculated rate falls in the market middle: the math is internally consistent and market-aligned. Proceed.
  - If the calculated rate is above the market high end by >15%: either the user has unusually high costs, is targeting a very high income level, or the inputs need review. Do NOT tell them the rate is wrong -- flag the discrepancy and let them decide. Senior specialists with strong portfolios often command above-market rates legitimately.
- **Break-even analysis:** Calculate the minimum billable hours per month required to cover all costs (expenses + benefits + taxes + income goal) at zero profit margin. This is the floor the user must hit every month to stay solvent. Express it as hours per month AND as approximate number of standard projects per month at their average project size.
- **Sanity check on utilization:** If the target billable hours require the user to bill 35+ hours per week consistently, flag this as aggressive and unlikely to be sustainable for more than a quarter or two. A sustainable long-term billable target for a freelancer running their own business is 20-25 hours per week, or roughly 85-110 billable hours per month.

---

### Step 8: Produce the Final Worksheet and Summary

Compile all calculations into the structured output format. Provide a plain-language summary that interprets the numbers -- the user should walk away knowing their rate, understanding why, and having a practical framework for quoting clients.

- Present the worksheet in full (see Output Format below).
- Summarize in 3-5 sentences what the numbers mean in plain language: what hourly rate to use, what their average project should cost, how many hours per month they need to bill to hit their income goal, and one explicit flag if anything in the inputs or outputs warrants attention.
- If the rate seems too high for the user's market experience level, suggest two specific adjustment levers: (1) reducing the profit buffer to 10% to lower the rate, or (2) evaluating whether specific expenses are essential in year 1.
- If the rate seems too low for the user's experience, flag that the user may be leaving significant money on the table and that testing higher rates on new clients while maintaining existing client rates is a low-risk way to gather market feedback.

---

## Output Format

```
## Freelance Rate Calculation Worksheet

**Prepared:** [Date]
**Discipline:** [Specific service type -- e.g., UX design, Python development, B2B copywriting]
**Experience:** [Years of professional experience in this discipline]
**Market:** [Geographic market -- US, UK, remote/global, etc.]

---

### SECTION 1: Annual Revenue Required

| Line Item                               | Amount      | Calculation / Notes                              |
|----------------------------------------|-------------|--------------------------------------------------|
| Target net annual income                | $[X]        | After-tax take-home goal                         |
| Annual operating expenses               | $[X]        | [Itemized list: software, insurance, etc.]       |
| Self-funded benefits                    | $[X]        | Health ins $[X] + retirement $[X] + other $[X]  |
| Subtotal before tax gross-up            | $[X]        | Net income + expenses + benefits                 |
| Gross-up for taxes ([X]% effective rate)| $[X]        | Subtotal / (1 - [X]%) = gross needed             |
| Tax load (derived)                      | $[X]        | Gross needed minus subtotal                      |
| Profit and stability buffer ([X]%)      | $[X]        | [X]% applied to gross needed                    |
| **TOTAL ANNUAL REVENUE REQUIRED**       | **$[X]**    |                                                  |

**SE tax component:** [X]% of net self-employment income -- estimated, verify with a tax professional.
**Income tax assumption:** [X]% effective federal + state estimate based on user-provided rate or stated jurisdiction.

---

### SECTION 2: Billable Hours Model

| Line Item                               | Value        | Notes                                            |
|----------------------------------------|--------------|--------------------------------------------------|
| Total weeks per year                    | 52 weeks     |                                                  |
| Vacation weeks                          | [X] weeks    | User-specified                                   |
| Available working weeks                 | [X] weeks    | 52 minus vacation                                |
| Working days per week                   | 5 days       |                                                  |
| Gross working days                      | [X] days     | Available weeks x 5                              |
| Public holidays                         | [X] days     | User-specified or country standard               |
| Sick day / unplanned absence allowance  | [X] days     | Conservative: 7 days; user may adjust            |
| Net working days                        | [X] days     | After all deductions                             |
| Target billable hours per day           | [X] hours    | User-specified                                   |
| Total potential hours                   | [X] hours    | Net working days x hours/day                     |
| Non-billable time percentage            | [X]%         | [Experience-adjusted estimate -- see note]       |
| Non-billable hours                      | [X] hours    | Total potential x non-billable %                 |
| **BILLABLE HOURS PER YEAR (target)**    | **[X] hours**|                                                  |
| **BILLABLE HOURS PER YEAR (conservative)**| **[X] hours**| [X]% non-billable + sick day allowance        |
| **BILLABLE HOURS PER MONTH (target)**   | **[X] hours**| Annual / 11 (excluding vacation month)          |

**Non-billable time note:** Non-billable percentage set at [X]% based on [new/experienced] freelancer profile.
Activities included: business development, proposals, invoicing, bookkeeping, email, professional development.

---

### SECTION 3: Base Hourly Rate Calculation

| Scenario     | Revenue Required | Billable Hours | Raw Rate    | Rounded Rate    |
|-------------|-----------------|---------------|-------------|-----------------|
| Target       | $[X]             | [X] hours      | $[X.XX]/hr  | **$[X]/hr**     |
| Conservative | $[X]             | [X] hours      | $[X.XX]/hr  | **$[X]/hr**     |

**Working rate:** $[X]/hour (target scenario -- use this as your standard rate)
**Floor rate (break-even only, zero profit):** $[X]/hour -- do not accept work below this rate.

---

### SECTION 4: Rate Tier Structure

| Tier                    | Multiplier | Rate         | Trigger Conditions                                          |
|------------------------|-----------|--------------|-------------------------------------------------------------|
| Standard rate           | 1.00x      | $[X]/hour    | Normal work, 5+ business day lead time                     |
| Rush rate               | 1.50x      | $[X]/hour    | Delivery < 3 business days, or displacing other work        |
| Retainer rate (15-20h+) | 0.90x      | $[X]/hour    | Monthly commitment of 15-20+ hours with advance booking     |
| Retainer rate (30h+)    | 0.85x      | $[X]/hour    | Monthly commitment of 30+ hours, ongoing multi-month        |
| Minimum project fee     | n/a        | $[X]         | Minimum charge for any engagement ([X] hours x standard)    |

---

### SECTION 5: Project Pricing by Type

| Project Type                 | Est. Hours | Scope Buffer | Calculation                    | Quoted Price  |
|-----------------------------|-----------|-------------|--------------------------------|---------------|
| [Project type 1]             | [X] hrs    | 1.15x        | [X] x $[X] x 1.15             | **$[X]**      |
| [Project type 2]             | [X] hrs    | 1.15x        | [X] x $[X] x 1.15             | **$[X]**      |
| [Project type 3]             | [X] hrs    | 1.15x        | [X] x $[X] x 1.15             | **$[X]**      |
| Rush version of [Project 1]  | [X] hrs    | 1.15x        | [X] x $[X] (rush) x 1.15      | **$[X]**      |

**Revision policy:** [X] rounds of revisions included in quoted price. Additional rounds billed at $[X]/hour (standard rate).
**Change order threshold:** Scope additions beyond original brief billed at $[X]/hour. Client notified in writing before proceeding.

---

### SECTION 6: Retainer Model

| Commitment Level       | Hours/Month | Rate         | Monthly Fee  | Annual Revenue |
|-----------------------|------------|--------------|-------------|----------------|
| Light retainer         | [X] hours   | $[X]/hr      | $[X]         | $[X]           |
| Standard retainer      | [X] hours   | $[X]/hr      | $[X]         | $[X]           |
| Full retainer          | [X] hours   | $[X]/hr      | $[X]         | $[X]           |

**Note:** Full retainer ([X] hours/month) covers [X]% of target annual revenue. Securing one full retainer client
significantly de-risks the freelance income model by providing a predictable revenue floor.

---

### SECTION 7: Rate Validation

| Metric                              | Value        | Interpretation                                              |
|------------------------------------|-------------|-------------------------------------------------------------|
| Market rate range ([discipline])    | $[X]-$[X]/hr | [Junior-to-senior range for user's discipline and market]   |
| User's calculated rate vs. market   | [X]%         | [Below / Within / Above] market range                       |
| Break-even billable hours/month     | [X] hours    | Minimum to cover all costs including profit buffer          |
| Equivalent hourly vs. salary target | $[X]/hr      | Salary parity rate accounting for employer-paid benefits     |
| Annual gross at target utilization  | $[X]         | Revenue achieved at [X] billable hours/month x 11 months    |

---

### SECTION 8: Summary and Action Guidance

**Your standard hourly rate:** $[X]/hour
**Your rush rate (< 3 business days):** $[X]/hour
**Your retainer rate (15-20h/month commitment):** $[X]/hour
**Your minimum project fee:** $[X]
**Your floor rate (break-even):** $[X]/hour -- do not accept work below this

**Monthly billable target:** [X] hours/month ([X] hours/week)
**Break-even monthly hours:** [X] hours/month ([X] hours/week)
**Headroom above break-even:** [X] hours/month -- this is your buffer for slow months

**Key interpretation:** [2-3 sentences of plain-language meaning from the numbers]
**Flag:** [Any notable discrepancy, assumption that warrants user review, or recommendation]
```

---

## Rules

1. **Never calculate rates based on 2,080 hours per year.** That is the total possible working hours for a 40-hour week employee with zero time off. Freelance billable hours realistically land between 1,000 and 1,400 per year for most practitioners. Using 2,080 produces a rate so low that the user will be working themselves into poverty at full capacity.

2. **Always gross up for taxes using division, not addition.** Adding a tax percentage to the target income dramatically understates the gross revenue needed. A user who wants $80,000 net and estimates a 30% tax rate needs $80,000 / 0.70 = $114,286 in gross income -- NOT $80,000 + $24,000 = $104,000. The error compounds when expenses and benefits are large.

3. **Every assumption that the user did not explicitly provide must be labeled as an assumption.** Use the notation "(assumed)" or "(estimated)" inline in the worksheet. This prevents the user from treating AI-generated defaults as facts when they submit their taxes or quote a client.

4. **The calculated rate is the floor for standard work, not a starting point for negotiation.** Do not frame the output as "your minimum rate." The user's calculated rate is what they need to charge to meet their stated goals. Framing it as a minimum invites discounting. Discounting a break-even rate means losing money.

5. **The non-billable percentage must always be experience-adjusted.** Do not default to 25% for all users. New freelancers (0-2 years) genuinely spend 35-45% of their time on non-billable activity as they build systems, pipelines, and client relationships. Experienced freelancers with full pipelines can reach 25-30%. Using the wrong percentage by 10 percentage points moves the annual rate by $5-$20/hour -- a material error.

6. **Always include a floor rate (break-even calculation).** The break-even rate tells the user the rate at which they cover all costs and taxes with zero profit. This is the number they should know by heart so they never accept a project below it. The worksheet must make this number visible and clearly labeled.

7. **Never recommend specific tax strategies, financial products, retirement account types, or insurance providers.** The skill calculates rates. All tax figures are estimates. Direct the user to a tax professional or accountant for tax planning. Including unqualified tax advice in a rate worksheet is irresponsible and potentially harmful.

8. **The scope buffer in project pricing is not optional.** Fixed-price projects without a scope buffer will be underpriced on average. Scope creep is nearly universal -- the question is how much, not whether it happens. A 1.15x buffer on a 30-hour estimate builds in 4.5 hours of cushion, which is almost always consumed by extra revision rounds, stakeholder review cycles, and minor deliverable additions.

9. **If the user's calculated rate is below their market range, flag this prominently -- do not suppress it.** Below-market rates set by freelancers who underestimated costs or overestimated billable hours will result in unsustainable working conditions. This is a flag worth surfacing even if it makes the output feel uncomfortable. The math is not punitive; it is accurate.

10. **Do not produce a single number -- always produce a tier structure.** A freelancer who quotes only one rate is leaving revenue on the table for rush work and may lose retainer clients who want a reason to commit. The rate card has at minimum four outputs: standard, rush, retainer, and minimum fee. This is the professional industry standard across all freelance disciplines.

11. **When a user's stated income goal is unusually high for their experience level, acknowledge the math and proceed without judgment.** Whether a user with 2 years of experience wants $120,000 net is their business goal to set. The AI's role is to calculate what rate and utilization makes that goal achievable, not to tell them whether their ambition is appropriate.

12. **Always express billable targets in both annual and monthly terms.** Annual numbers are abstract. Monthly billable hours are the operating unit that freelancers can actually track. A target of 1,200 hours/year means 100 hours/month and approximately 23 hours/week -- this is the number the user will actually use to manage their business week to week.

---

## Edge Cases

### User Does Not Know Their Annual Expenses

This is extremely common for first-time freelancers or employees transitioning to independent work. Provide a structured expense estimation template with typical ranges, ask the user to fill in what they know, and use the midpoints of typical ranges for items they cannot estimate.

| Expense Category | Low Estimate | High Estimate | Default Assumption |
|-----------------|-------------|--------------|-------------------|
| Software subscriptions (creative/productivity tools) | $600/yr | $3,600/yr | $1,800/yr |
| Professional liability / E&O insurance | $400/yr | $2,400/yr | $1,200/yr |
| Health insurance (if not covered elsewhere) | $4,800/yr | $12,000/yr | $7,200/yr |
| Disability insurance | $300/yr | $1,500/yr | $600/yr |
| Accounting software / bookkeeper | $240/yr | $2,400/yr | $900/yr |
| Home office or coworking | $0/yr | $6,000/yr | $1,800/yr |
| Professional development / courses | $200/yr | $2,000/yr | $800/yr |
| Hardware depreciation (laptop, peripherals) | $300/yr | $1,500/yr | $600/yr |
| Miscellaneous (subscriptions, domain, hosting) | $200/yr | $800/yr | $400/yr |
| **Typical total range** | **$7,040/yr** | **$32,200/yr** | **$15,300/yr** |

Label all default assumptions explicitly and invite the user to correct them before finalizing the calculation.

---

### User Is Transitioning from Salaried Employment and Needs to Know the Equivalent Freelance Rate

Many users want to know what hourly rate makes freelancing "worth it" compared to their current job. This requires the salary equivalent calculation:

1. Start with the user's current annual salary + total benefits value (employer-paid health insurance, 401k match, paid time off, payroll tax employer share)
2. Total employer cost is typically 1.25-1.35x cash salary for fully-benefited US employees
3. Convert this to a freelance gross revenue target (the user must earn this much to break even versus employment)
4. Add a premium for the risk, variability, and non-billable hours inherent in freelancing -- 20-30% above the employment equivalent is a common minimum "freelance premium"
5. Run the rate calculation from this revenue target

A user earning $95,000 salary with $25,000 in benefits (total comp = $120,000) needs to earn approximately $120,000 / (1 - 0.28 tax rate) = $166,667 gross to net the same after taxes and self-funded benefits -- then add 20% freelance premium = $200,000 gross revenue target. This is frequently surprising to new freelancers and is a valuable reality check.

---

### User Wants Flat Project Pricing Only and Refuses to Quote Hourly

Some freelancers -- particularly experienced ones working in brand strategy, consulting, and value-intensive services -- quote only flat project fees and consider hourly rate disclosure a negotiating disadvantage. Handle this case as follows:

- Still calculate the hourly rate internally as the cost basis, but do not require the user to publish or disclose it
- The project pricing section becomes the primary output; the hourly rate is the internal production cost benchmark
- Frame the project prices as the deliverable values rather than hour estimates: "Complete brand identity package -- $7,500" rather than "30 hours at $250/hour"
- Add a note that the user should still track actual hours internally to validate their estimates and improve project scoping over time. The client does not need to see the hourly math, but the user does
- For value-based pricing situations (see Step 6), flag that the project price floor is the cost-based calculation, but the ceiling is the client's perceived value of the outcome

---

### User's Calculated Rate Is Below Local or Federal Minimum Wage Equivalent

If a user's inputs produce a rate below approximately $20-$25/hour (a reasonable threshold for developed market freelancers), the calculation has exposed a structural problem in the inputs. Do not produce this rate as a recommendation. Instead:

1. Identify which input is causing the problem: Is the target income too low? Are assumed billable hours unrealistically high (e.g., they assumed 2,000+ billable hours)? Are expenses being drastically underestimated?
2. Show the user the specific input change needed to produce a viable rate: "To reach $30/hour at your stated income goal of $40,000, you would need 1,150 billable hours per year -- which is achievable but requires a non-billable rate of 25%, typical of experienced freelancers with established client pipelines."
3. Flag that very low rates often indicate the freelance model may not be financially viable at current income targets, or that the user has significantly underestimated what it costs to run a one-person business.

---

### User Is a Part-Time Freelancer Supplementing Employment Income

The calculation works the same way, but with critical adjustments:

- The target income should reflect only the freelance income goal, not the user's full living expenses (which are already covered by their employment salary)
- Expenses should be prorated for the freelance business only -- not the full range of personal living costs
- Available hours are dramatically constrained: typically 10-20 hours per week maximum, meaning 400-800 billable hours per year after non-billable deductions
- The tax situation is different: the user's marginal tax rate for the freelance income is higher because it stacks on top of employment income. If they are already in the 22% bracket from their salary, freelance income is taxed at the marginal rate -- which may be 22-32% federal plus state and SE tax. This makes the effective rate on freelance income higher than it would be if freelancing were their only income. Flag this prominently.

---

### User's Calculated Rate Is Significantly Above Their Stated Market Range

If the math produces a rate of $200/hour for a user in a field where the market maximum is $100/hour, the gap requires explicit diagnosis rather than silent acceptance:

- Check whether the income goal is realistic for the discipline (a graphic designer wanting $150,000 net may genuinely need to pivot toward specialized, higher-margin work like brand strategy or motion graphics)
- Check whether the expense stack is inflated (health insurance, office rent, software subscriptions at the high end simultaneously)
- Check whether the billable hour estimate is too conservative (if the user assumes only 600 billable hours per year, nearly any income goal produces an apparently high rate)
- Present three levers: (1) reduce the income goal, (2) reduce expenses, (3) increase billable hours. Show the rate impact of each lever in a small sensitivity table

---

### User Is Pricing for an International Market With Rate Expectations Different From Their Home Country

Freelancers operating in global remote markets frequently face the question of whether to charge local rates (lower, competitive with global talent) or home-country rates (reflecting their cost of living and professional credentials). Guidance:

- Calculate the rate based on the user's own cost structure -- this is non-negotiable as it reflects what they need to earn
- Flag whether the resulting rate is competitive in the global market for their discipline (e.g., US-based developer at $150/hour will face price pressure from competitive developers in lower-cost markets)
- Note that specialization, niche expertise, English fluency, timezone alignment, and cultural fit often allow premium pricing in global markets even from developers in competitive markets
- Do not recommend a rate reduction to match global market lows if doing so would make the freelance business unsustainable based on the user's cost structure. Instead, note the strategic positioning challenge and suggest the user focus on differentiation rather than price competition.

---

## Example

**Input:**
"I'm a freelance UX designer with 4 years of experience, based in the US. I want to take home $90,000 per year. I work for myself full-time. My expenses: Adobe CC and Figma are about $1,500/year, I use Notion and Linear for project management which is another $200/year, and I have a coworking membership at $300/month. I need to cover my own health insurance -- my current plan is about $550/month. I'm not contributing enough to retirement; I want to put away $700/month. I'll take 3 weeks of vacation. I have 10 holidays. I plan to work 7 hours per day. I usually do UX audits, end-to-end app design projects, and design system work. My current rate is $85/hour and I'm not sure if that's enough."

---

**Output:**

## Freelance Rate Calculation Worksheet

**Prepared:** [Current date]
**Discipline:** UX design (audits, app design, design systems)
**Experience:** 4 years professional experience
**Market:** United States (domestic and remote clients)

---

### SECTION 1: Annual Revenue Required

| Line Item | Amount | Calculation / Notes |
|-----------|--------|---------------------|
| Target net annual income | $90,000 | After-tax take-home goal |
| Software and tools | $1,700 | Adobe CC + Figma ($1,500) + Notion/Linear ($200) |
| Coworking membership | $3,600 | $300/month x 12 |
| Health insurance | $6,600 | $550/month x 12 |
| Retirement contributions | $8,400 | $700/month x 12 |
| **Subtotal before tax gross-up** | **$110,300** | Net income + expenses + benefits |
| Gross-up for taxes (29% effective rate) | **$155,352** | $110,300 / (1 - 0.29) = $155,352 |
| Tax load (derived) | $45,052 | Gross minus subtotal -- estimated, verify with tax professional |
| Profit and stability buffer (15%) | $23,303 | 15% applied to grossed-up revenue |
| **TOTAL ANNUAL REVENUE REQUIRED** | **$178,655** | |

**SE tax note:** Estimated at 14.1% of net self-employment income (15.3% statutory minus the 50% deductibility adjustment). Included in the 29% combined effective rate assumption above.
**Income tax assumption:** 29% combined effective rate includes estimated federal income tax (~12-15%), self-employment tax component (~14%), and approximate state income tax (~3-5% average). This is an estimate -- verify with a tax professional or accountant.
**Retirement note:** $8,400/year in contributions ($700/month) represents approximately 5.4% of gross revenue. Consider increasing over time; a solo 401(k) allows contributions up to $69,000/year (2024 limit for self-employed). The $700/month floor is reasonable but not aggressive.

---

### SECTION 2: Billable Hours Model

| Line Item | Value | Notes |
|-----------|-------|-------|
| Total weeks per year | 52 weeks | |
| Vacation weeks | 3 weeks | User-specified |
| Available working weeks | 49 weeks | |
| Working days per week | 5 days | |
| Gross working days | 245 days | 49 x 5 |
| Public holidays | 10 days | US standard |
| Sick day / unplanned absence allowance | 7 days | Conservative but realistic |
| Net working days | 228 days | 245 - 10 - 7 |
| Target billable hours per day | 7 hours | User-specified |
| Total potential hours | 1,596 hours | 228 x 7 |
| Non-billable time percentage | 30% | Experienced freelancer (4 years): business development, proposals, invoicing, client communication, professional development |
| Non-billable hours | 479 hours | 1,596 x 0.30 |
| **BILLABLE HOURS PER YEAR (target)** | **1,117 hours** | 1,596 - 479, rounded |
| **BILLABLE HOURS PER YEAR (conservative)** | **1,037 hours** | 35% non-billable + sick days included |
| **BILLABLE HOURS PER MONTH (target)** | **102 hours** | 1,117 / 11 (11 working months) |

**Non-billable time note:** 30% non-billable is appropriate for a 4-year freelancer with an established client base. If you are actively rebuilding your pipeline or shifting markets, use the conservative (35%) scenario. Non-billable activities include: sales calls and discovery conversations, proposal and contract writing, invoicing and collections follow-up, client check-ins and project management overhead, portfolio updates and case study writing, professional development and tool learning.

---

### SECTION 3: Base Hourly Rate Calculation

| Scenario | Revenue Required | Billable Hours | Raw Rate | Rounded Rate |
|----------|-----------------|---------------|---------|-------------|
| Target | $178,655 | 1,117 hours | $159.94/hr | **$160/hr** |
| Conservative | $178,655 | 1,037 hours | $172.28/hr | **$175/hr** |

**Working rate:** $160/hour (target scenario -- use this as your standard rate)
**Floor rate (break-even, zero profit buffer):** $178,655 x (1/1.15) / 1,117 hours = $139/hour -- do not accept work below this rate.

**Important note on your current rate:** Your current rate of $85/hour is significantly below your calculated sustainable rate of $160/hour. At $85/hour with 1,117 billable hours, your annual gross would be approximately $94,945 -- which, after taxes and expenses, would produce a net income well below your $90,000 target and leave you with no profit buffer, inadequate retirement contributions, and no margin for slow months. This is a meaningful gap that warrants a rate increase plan.

---

### SECTION 4: Rate Tier Structure

| Tier | Multiplier | Rate | Trigger Conditions |
|------|-----------|------|-------------------|
| Standard rate | 1.00x | $160/hour | Normal UX work, 5+ business day lead time, defined scope |
| Rush rate | 1.50x | $240/hour | Delivery under 3 business days, displacing scheduled client work, weekend delivery required |
| Retainer rate (15-20h/month) | 0.90x | $144/hour | Monthly commitment of 15-20+ hours, advance booking, rolling engagement |
| Retainer rate (30h+/month) | 0.85x | $136/hour | Monthly commitment of 30+ hours, multi-month contract, anchor client relationship |
| Minimum project fee | n/a | $640 | No engagement accepted under 4 hours equivalent -- protects against small-task overhead |

---

### SECTION 5: Project Pricing by Type

| Project Type | Est. Hours | Scope Buffer | Calculation | Quoted Price |
|-------------|-----------|-------------|------------|-------------|
| UX audit (existing app, 10-15 screens) | 20 hours | 1.15x | 20 x $160 x 1.15 | **$3,680** |
| End-to-end app design (MVP, 20-30 screens) | 55 hours | 1.15x | 55 x $160 x 1.15 | **$10,120** |
| Design system creation (from scratch) | 45 hours | 1.15x | 45 x $160 x 1.15 | **$8,280** |
| Design system audit and update | 18 hours | 1.15x | 18 x $160 x 1.15 | **$3,312** |
| Discovery and research sprint (1 week) | 25 hours | 1.15x | 25 x $160 x 1.15 | **$4,600** |
| Rush UX audit (3-day turnaround) | 20 hours | 1.15x | 20 x $240 (rush) x 1.15 | **$5,520** |

**Revision policy:** Two rounds of revisions included in all quoted project prices. Additional rounds billed at $160/hour (standard rate). Round definition: a consolidated set of feedback addressed in one pass -- not individual comments spread across multiple days.
**Change order threshold:** Scope additions beyond the original brief billed at $160/hour, invoiced separately. Client notified in writing and must approve before work proceeds.

---

### SECTION 6: Retainer Model

| Commitment Level | Hours/Month | Rate | Monthly Fee | Annual Revenue |
|-----------------|------------|------|------------|----------------|
| Light retainer | 15 hours | $144/hr | $2,160/month | $25,920/year |
| Standard retainer | 20 hours |
