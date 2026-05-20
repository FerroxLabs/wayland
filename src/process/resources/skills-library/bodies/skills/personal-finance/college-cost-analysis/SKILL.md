---
name: college-cost-analysis
description: |
  Analyzes the true cost of higher education including tuition, fees, room, board, books, and opportunity cost. Compares financing options (loans, grants, scholarships, work-study, savings) and builds a funding strategy that shows the total cost of each path including post-graduation loan payments.
  Use when the user asks about college costs, how to pay for education, student loan analysis, or wants to compare financing options for higher education.
  Do NOT use for general budgeting (use budget-planning), student loan payoff strategy after graduation (use debt management skills), or career planning after college.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance budgeting planning analysis savings"
  category: "personal-finance"
  subcategory: "life-stage-financial"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---
# College Cost Analysis

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

---

## When to Use

**Use this skill when:**
- A student or parent wants to compare the total cost of attending specific types of institutions (public in-state, public out-of-state, private non-profit, for-profit, community college, vocational/trade school) before enrolling
- A user wants to understand the difference between a school's "sticker price" and their actual net price after grants and scholarships
- A user has received a financial aid award letter and needs help interpreting it or comparing two award letters side by side
- A user wants to calculate the true cost of a degree path including living costs, opportunity cost of foregone income, and total loan repayment with interest
- A parent with a young child wants to know how much to save monthly to meet projected future college costs
- A user is deciding between a 2+2 community college transfer path vs. a direct 4-year enrollment and needs to compare the full cost of each complete path
- A user wants to determine whether a graduate or professional degree (MBA, law, medicine) is financially justified given the loan burden and salary premium
- A first-generation college student or family is trying to understand the FAFSA-based aid process and what "Expected Family Contribution" (now called the Student Aid Index) means for their aid package
- A user is evaluating the financial impact of AP credits, dual enrollment, or CLEP exams as a cost-reduction strategy

**Do NOT use when:**
- The user has already graduated and wants a structured payoff plan for existing student loans -- use `debt-snowball-planner` or `debt-avalanche-planner` instead
- The user needs a general monthly budget for living expenses while enrolled -- use `first-budget` for that foundational work
- The user is asking about career selection, major choice, or earnings potential by field -- this skill does financial math, not career counseling; refer to a career planning skill
- The user wants investment strategy for money already inside a 529 plan -- that is an investment allocation question, not a cost analysis
- The user is asking about employer-sponsored tuition reimbursement programs as part of their benefits analysis -- that belongs in a compensation analysis skill
- The user needs advice on Public Service Loan Forgiveness eligibility or income-driven repayment plans post-graduation -- those are debt management topics handled by repayment-strategy skills

---

## Process

### Step 1: Establish the Full Picture Before Running Any Numbers

Before calculating a single dollar figure, gather the following. Missing even one dimension will produce a flawed analysis that could cost the student tens of thousands of dollars in overlooked costs or missed aid.

- **Institution type(s) being compared:** Public in-state, public out-of-state, private non-profit, for-profit, community college (2-year), or vocational/trade school. This matters because average cost benchmarks differ dramatically -- average published tuition at a 4-year public in-state school runs approximately $11,000--$12,000/year, while private non-profit averages $40,000--$42,000/year, and out-of-state public runs $29,000--$30,000/year (these are tuition-only figures; total cost of attendance is higher)
- **Program type and length:** 2-year associate degree, 4-year bachelor's, combined 2+2 transfer path, graduate program (1--3 years), professional degree (law 3 years, medicine 4 years + residency, MBA 1--2 years)
- **Housing arrangement:** On-campus residence hall, off-campus apartment, or living at home with family. Room and board on-campus averages $12,000--$14,000/year at 4-year institutions; off-campus in a low-cost city may run $9,000--$11,000; living at home can reduce this to $2,000--$4,000 in transportation and incidentals
- **Existing funding already confirmed:** Actual scholarship award letters received (not expected), verified 529 or savings balances, confirmed employer tuition benefits, and confirmed family contribution amounts
- **Financial aid status:** Has the student filed the FAFSA (or CSS Profile for private schools)? What is their Expected Family Contribution / Student Aid Index (SAI)? Has an aid package been received yet?
- **Working during school:** Whether the student plans to work, estimated hours per week, and whether federal work-study is part of the aid package
- **State of residence:** Residency affects eligibility for in-state tuition, state grant programs (many states have substantial need-based grant programs), and state-sponsored prepaid tuition plans

### Step 2: Calculate Total Cost of Attendance (COA) -- The Real Number, Not the Sticker Price

Every institution calculates an official Cost of Attendance figure that includes both direct costs (billed by the school) and indirect costs (estimated living and personal expenses). Use these COA figures as the baseline -- they are more accurate than guessing. Then adjust for the student's actual situation.

**Direct costs (billed by institution):**
- Tuition and mandatory fees (distinguish between tuition and fees -- "fees" can add $1,500--$3,000/year and are often non-negotiable)
- On-campus room and board (if applicable)
- Health insurance if required by the school (common at many universities, running $2,000--$3,500/year unless the student has parent's coverage)

**Indirect costs (estimated, varies by student):**
- Books and supplies: Historically $1,000--$1,300/year, but STEM and pre-med programs can run $1,500--$2,500; digital textbook rental and library resources can reduce this to $500--$700 for strategic students
- Transportation: On-campus students often need $700--$1,200/year; commuters driving to campus may need $2,000--$4,000/year depending on distance and fuel costs
- Personal expenses and miscellaneous: Typically estimated at $1,500--$2,500/year in official COA figures
- Technology: Most schools estimate $1,000--$1,500 for computer/technology per year; some programs require specific equipment

**Annual cost increase factor:**
Tuition at 4-year institutions has historically increased at approximately 3--4% per year on average (this has varied -- some years 1--2%, some years 5--6%). Apply a 3% annual increase to project future-year costs. For a 4-year program starting today, Year 2 cost = Year 1 × 1.03, Year 3 = Year 1 × 1.0609, Year 4 = Year 1 × 1.0927. This is not a trivial adjustment -- a $27,000/year school costs approximately $111,000 over 4 years with a flat rate but $113,500 with 3% annual increases.

**Opportunity cost calculation:**
This is the most frequently omitted cost. For a full-time student not working significantly during school, calculate foregone income as:
- Use the median wage for workers with only a high school diploma: approximately $38,000--$42,000/year (adjust for local labor market)
- For a 4-year program: 4 × $40,000 = $160,000 in foregone gross earnings (before tax)
- After estimated tax (approximately 20% effective rate for this income level): ~$128,000 net foregone income
- Do NOT present opportunity cost in the borrowing/repayment tables, but DO include it in the "true total cost" discussion so the student understands the full economic weight of the decision
- For the CC+transfer path vs 4-year comparison, opportunity cost is identical for both (both take 4 years), so it does not affect the comparison -- only matters when comparing different program lengths or full-time vs part-time

### Step 3: Build the Net Price -- Subtract Free Money First

The net price is what the student actually pays after all grants and scholarships. This is the number that drives borrowing. Apply funding sources in strict order:

**Tier 1 -- Free money (no repayment ever):**
1. Institutional grants (awarded by the school based on need and/or merit, found in the financial aid award letter)
2. Federal Pell Grant: For the 2024--2025 award year, maximum Pell Grant is $7,395/year. Eligibility is need-based and phases out as family income increases -- roughly, families with income under $60,000 typically receive some Pell; those above $80,000 rarely qualify. Pell Grants are available for up to 12 semesters of full-time enrollment (6 years equivalent)
3. Federal Supplemental Educational Opportunity Grant (SEOG): $100--$4,000/year for students with exceptional need, campus-based and often runs out early -- FAFSA filing date matters
4. State grants: Many states have substantial programs (examples: New York's Excelsior Scholarship covers tuition for families earning under $125,000; Texas has the TEXAS Grant; California has Cal Grant A at up to $9,220/year for low-income students) -- always research the specific state
5. Outside scholarships: Private scholarships from employers, community organizations, professional associations. Note: some schools practice "scholarship displacement" where outside scholarships reduce institutional grants dollar-for-dollar rather than reducing loans -- ask the school's aid office specifically about this policy
6. Employer tuition assistance: Many employers offer $2,000--$5,250/year; $5,250 is the annual IRS tax-free limit for employer education assistance

**Tier 2 -- Earned money (no repayment, but requires work):**
- Federal Work-Study: A common aid package component, typically $2,500--$3,500/year. Important clarification: this is NOT deposited in a bank account -- it represents the maximum earnings from a qualifying campus job. The student must actually work to receive it. At $12--$15/hour for typical work-study jobs, this means 165--290 hours of work per year
- Part-time employment: Students working 10--15 hours/week during the school year can typically earn $6,000--$10,000/year without significantly impairing academic performance; beyond 20 hours/week, research shows academic outcomes decline noticeably

**Tier 3 -- Family resources:**
- 529 plan balances and projected growth
- Direct family contributions (cash, parent income contributions)
- Living at home (quantify this as the delta between on-campus room/board and the marginal cost of the student living at home)

After subtracting all Tier 1, Tier 2, and Tier 3 funding from the net price, the remainder is the funding gap -- what must be borrowed or otherwise obtained.

### Step 4: Structure the Borrowing Analysis with Correct Loan Sequencing

Not all student loans are equal. Present them in the correct priority sequence and apply realistic interest rates. For 2024--2025 federal student loan rates:

**Federal Direct Subsidized Loans (best option -- interest does not accrue during enrollment):**
- Undergraduate only
- Eligibility requires demonstrated financial need (SAI-based)
- Borrowing limits: $3,500 (Year 1), $4,500 (Year 2), $5,500 (Years 3--4) for dependent students
- Aggregate limit for dependent undergrad: $23,000 in subsidized loans
- Interest rate (2024--2025): 6.53% fixed

**Federal Direct Unsubsidized Loans (good option -- interest accrues during enrollment):**
- Available regardless of financial need
- Dependent undergraduate annual limits: $5,500 (Year 1), $6,500 (Year 2), $7,500 (Years 3--4), but total annual borrowing (subsidized + unsubsidized combined) cannot exceed these limits
- Independent undergraduate can borrow $4,000--$5,000 more per year
- Aggregate limit for dependent undergrad: $31,000 total (combined subsidized + unsubsidized)
- Interest rate (2024--2025): 6.53% for undergrad, 8.08% for graduate students
- Because interest accrues during school, $20,000 borrowed in Year 1 at 6.53% grows to approximately $25,580 by the end of Year 4 if unpaid -- factor this capitalized interest into total loan projections

**Federal Direct PLUS Loans for Parents:**
- Parents can borrow the remaining cost of attendance minus other aid
- Interest rate (2024--2025): 9.08% fixed
- PLUS loans require a credit check (no minimum score, but no recent adverse credit history)
- These are the parent's debt, not the student's -- a critical distinction for post-graduation financial planning
- Monthly payment on $30,000 PLUS loan at 9.08% over 10 years: approximately $381/month

**Private student loans (last resort):**
- Rates typically 4--14% variable or fixed, depending on credit score
- No income-driven repayment options
- No loan forgiveness pathways
- No deferment or forbearance protections comparable to federal loans
- Should be used only after exhausting all federal options

**Loan payment calculation methodology:**
Use the standard loan amortization formula. For a quick working approximation:
- 10-year repayment at 6.53%: monthly payment ≈ $11.35 per $1,000 borrowed
- 10-year repayment at 8.08%: monthly payment ≈ $12.17 per $1,000 borrowed
- 10-year repayment at 9.08%: monthly payment ≈ $12.67 per $1,000 borrowed

For a $40,000 loan at 6.53% over 10 years: $40,000 × $11.35/1,000 = $454/month; total repaid = $54,480; total interest = $14,480.

Always calculate and present both the monthly payment AND total interest paid. Total interest paid is the number that motivates behavior -- students often don't register that a $50,000 loan costs them $67,000 over 10 years.

### Step 5: Apply the Debt-to-Income Benchmark Test

This is the single most important analytical test in the entire skill. It answers: "Is this borrowing level manageable given expected earnings?"

**The 1:1 Rule (the most cited benchmark):**
Total student loan debt at graduation should not exceed the student's expected first-year gross salary. A student expecting to earn $55,000 in their first job should borrow no more than $55,000 total.

**The 10% Rule (monthly payment benchmark):**
Monthly student loan payments should not exceed 10% of expected gross monthly income. This is the threshold below which repayment is manageable without lifestyle hardship. Above 15% begins to create financial stress; above 20% is considered a debt crisis threshold.

To apply:
1. Research median starting salary for the intended field and degree level. Use Bureau of Labor Statistics Occupational Employment and Wage Statistics (OEWS) data or national salary survey data for the specific occupation
2. Divide annual salary by 12 for monthly gross income
3. Multiply by 0.10 to get the maximum comfortable monthly payment
4. Work backward: what loan amount produces that payment? (Divide by the per-$1,000 payment factor above)

**Examples by field (approximate median starting salaries for bachelor's degree holders):**
- Elementary school teacher: $42,000--$48,000/year → max comfortable loan: $42,000--$48,000; max monthly payment: $350--$400
- Registered nurse (BSN): $62,000--$72,000/year → max comfortable loan: $62,000--$72,000; max monthly payment: $517--$600
- Software developer: $85,000--$100,000/year → max comfortable loan: $85,000--$100,000; max monthly payment: $708--$833
- Social worker (MSW): $48,000--$56,000/year → max comfortable loan: $48,000--$56,000; max monthly payment: $400--$467
- Physician (after residency): $200,000+/year → higher debt tolerance, but medical school loans averaging $200,000+ still warrant careful analysis

Flag clearly when the projected loan amount exceeds the field-specific threshold. This is not a recommendation to abandon the educational goal -- it is a signal to aggressively pursue scholarships, consider lower-cost paths, or plan for income-driven repayment.

### Step 6: Identify Cost-Reduction Strategies Specific to the Situation

Based on the funding gap identified in Step 4, present cost-reduction levers in order of impact. Do not list generic advice -- tailor to what the user has described.

**High-impact levers (each can save $5,000--$30,000+ over the degree):**
- Establish in-state residency before enrolling (if the student is close to the in-state border or plans to establish residency -- note that most states require 12 months of independent domicile, not just physical presence)
- Community college first, then transfer: For a major available at both institutions, the 2+2 path can save $20,000--$50,000 in tuition for comparable credentials -- but only if the student verifies articulation agreements in advance
- Accelerate graduation with AP, IB, CLEP, or dual enrollment credits: Each semester eliminated saves $13,000--$25,000 at a typical 4-year institution; CLEP exams cost $90 and can replace a $3,000--$5,000 college course
- Live at home for 1--2 years: Eliminates $24,000--$28,000 in room/board costs; practical mainly for regional commuter schools

**Medium-impact levers (each can save $2,000--$10,000):**
- Negotiate the financial aid package: Private schools in particular have flexibility -- if a competing school offered more, submit that offer letter to the first-choice school's aid office and ask for a review. This practice is widespread and accepted
- Apply for departmental scholarships within the school (these are separate from the admissions scholarship offer and often go unclaimed because students don't know to apply)
- Buy used, rented, or digital textbooks; use the library's course reserves
- Choose an off-campus apartment with roommates over campus housing in Year 2 onward (can save $2,000--$4,000/year vs on-campus)

**Policy-based levers (often overlooked):**
- Some states have tuition reciprocity agreements with neighboring states (e.g., the WICHE Western Undergraduate Exchange, the Midwest Student Exchange Program) -- these reduce out-of-state tuition significantly
- Tuition waivers for employees of universities and their dependents: Some schools offer deep discounts or free tuition to employees, which can be relevant if a parent works at or near a university

### Step 7: Build the Year-by-Year Funding Plan

Synthesize everything into a concrete year-by-year plan that shows exactly how each year's cost is covered. This is the deliverable the user can actually act on.

For each year:
- Show the projected cost (applying the 3% annual escalation)
- Show which funding sources cover it (Pell Grant, institutional grant, scholarship, savings withdrawal, family contribution, work earnings, subsidized loan, unsubsidized loan)
- Show the cumulative loan balance at the end of each year (including accrued interest on unsubsidized loans)

After the last year:
- Show total borrowed (principal)
- Show estimated capitalized interest (interest that accrued during school and was added to principal)
- Show total loan balance at graduation (principal + capitalized interest)
- Show monthly payment and total repayment cost
- Show the debt-to-income assessment

---

## Output Format

```
## College Cost Analysis

**Analysis Date:** [Month Year]
**Student Profile:** [Entering freshman / Transfer / Graduate student] | [Full-time / Part-time]
**Programs Analyzed:** [Option 1 name] vs. [Option 2 name] (if comparing)

---

### Section 1: Annual Cost of Attendance

| Cost Category              | [Option 1]     | [Option 2]     | Notes                          |
|----------------------------|---------------|---------------|-------------------------------|
| Tuition & Fees             | $XX,XXX       | $XX,XXX       |                               |
| Room & Board               | $XX,XXX       | $XX,XXX       | On-campus / Off-campus / Home |
| Books & Supplies           | $X,XXX        | $X,XXX        |                               |
| Health Insurance           | $X,XXX        | $X,XXX        | If required by school         |
| Transportation             | $X,XXX        | $X,XXX        |                               |
| Personal Expenses          | $X,XXX        | $X,XXX        |                               |
| **Year 1 Total COA**       | **$XX,XXX**   | **$XX,XXX**   |                               |
| **Full Program Total COA** | **$XXX,XXX**  | **$XXX,XXX**  | With 3% annual escalation     |

---

### Section 2: Net Price Calculation

| Funding Source             | [Option 1]     | [Option 2]     | Notes                              |
|----------------------------|---------------|---------------|------------------------------------|
| Federal Pell Grant         | $X,XXX/yr     | $X,XXX/yr     | Need-based; verify FAFSA results   |
| Institutional Grant        | $X,XXX/yr     | $X,XXX/yr     | From award letter                  |
| State Grant                | $X,XXX/yr     | $X,XXX/yr     | Verify eligibility                 |
| Merit Scholarship          | $X,XXX/yr     | $X,XXX/yr     | Confirm renewal requirements       |
| Outside Scholarships       | $X,XXX/yr     | $X,XXX/yr     | Verify displacement policy         |
| **Total Free Money/yr**    | **$XX,XXX**   | **$XX,XXX**   |                                    |
| **Net Price (Year 1)**     | **$XX,XXX**   | **$XX,XXX**   | COA minus free money               |

---

### Section 3: Year-by-Year Funding Plan

#### [Option 1]

| Year   | Proj. COA | Grants/Schol. | Savings  | Work Earnings | Sub. Loan | Unsub. Loan | Year-End Loan Balance |
|--------|-----------|--------------|----------|---------------|-----------|-------------|----------------------|
| Year 1 | $XX,XXX   | $XX,XXX      | $X,XXX   | $X,XXX        | $X,XXX    | $X,XXX      | $XX,XXX              |
| Year 2 | $XX,XXX   | $XX,XXX      | $X,XXX   | $X,XXX        | $X,XXX    | $X,XXX      | $XX,XXX              |
| Year 3 | $XX,XXX   | $XX,XXX      | $X,XXX   | $X,XXX        | $X,XXX    | $X,XXX      | $XX,XXX              |
| Year 4 | $XX,XXX   | $XX,XXX      | $X,XXX   | $X,XXX        | $X,XXX    | $X,XXX      | $XX,XXX              |
| **Total** | **$XXX,XXX** | **$XX,XXX** | **$XX,XXX** | **$XX,XXX** | **$XX,XXX** | **$XX,XXX** | **$XX,XXX** |

*Unsubsidized loan balance includes estimated capitalized interest accrued during enrollment.*

---

### Section 4: Loan Impact Analysis

| Metric                              | [Option 1]    | [Option 2]    |
|-------------------------------------|--------------|--------------|
| Total Principal Borrowed            | $XX,XXX      | $XX,XXX      |
| Est. Capitalized Interest (in school) | $X,XXX     | $X,XXX       |
| **Loan Balance at Graduation**      | **$XX,XXX**  | **$XX,XXX**  |
| Blended Interest Rate               | X.XX%        | X.XX%        |
| Standard Repayment Term             | 10 years     | 10 years     |
| **Monthly Payment**                 | **$XXX**     | **$XXX**     |
| Total Amount Repaid                 | $XX,XXX      | $XX,XXX      |
| **Total Interest Paid**             | **$XX,XXX**  | **$XX,XXX**  |

---

### Section 5: Debt-to-Income Assessment

| Metric                              | [Option 1]    | [Option 2]    |
|-------------------------------------|--------------|--------------|
| Expected Field / Occupation         | [Field]      | [Field]      |
| Estimated Starting Salary           | $XX,XXX      | $XX,XXX      |
| Monthly Gross Income                | $X,XXX       | $X,XXX       |
| Monthly Loan Payment                | $XXX         | $XXX         |
| **Payment as % of Gross Income**    | **X.X%**     | **X.X%**     |
| Benchmark (manageable ≤ 10%)        | ✅ / ⚠️ / ❌  | ✅ / ⚠️ / ❌  |
| Total Debt vs. Starting Salary      | X.Xx         | X.Xx         |
| 1:1 Rule Assessment                 | ✅ / ⚠️ / ❌  | ✅ / ⚠️ / ❌  |

**✅ = At or below benchmark | ⚠️ = 10--15% (caution zone) | ❌ = Above 15% (high risk)**

---

### Section 6: Cost-Reduction Opportunities

| Strategy                        | Est. Savings  | Feasibility | Action Required              |
|---------------------------------|--------------|-------------|------------------------------|
| [e.g., Live at home Year 1--2]  | $XX,XXX      | High        | Commute to campus            |
| [e.g., CLEP out of 2 courses]   | $X,XXX       | Medium      | Study and register for exams |
| [e.g., Appeal aid package]      | $X,XXX--$X,XXX | Medium   | Submit competing offer letter|
| [e.g., State reciprocity tuition]| $XX,XXX     | High        | Verify enrollment eligibility|

---

### Section 7: Funding Strategy Summary

**Bottom line:** [1--2 sentence plain-language summary of the most cost-effective path]

**Total out-of-pocket cost comparison:**
- [Option 1]: $XXX,XXX total cost; $XX,XXX loans; $XXX/month post-graduation payment
- [Option 2]: $XXX,XXX total cost; $XX,XXX loans; $XXX/month post-graduation payment
- **Difference:** $XX,XXX in total borrowing; $XXX/month in monthly obligations

**Opportunity cost note:** Both paths require approximately 4 years, so foregone earnings (~$XX,XXX net over 4 years at median high-school diploma wages) are identical and do not affect the comparison. Had program lengths differed, this would be a factor.

**Debt-to-income verdict:** [Clear statement on whether borrowing is within the manageable range for the expected career field, with the specific numbers that led to that conclusion]

---

### Section 8: Next Steps

- [ ] Verify current tuition and fee schedules directly with each institution's registrar or net price calculator
- [ ] File or update FAFSA [Verify your country's financial aid application process and deadline -- in the US, filing as early as October 1 maximizes aid eligibility]
- [ ] Check scholarship renewal criteria (GPA minimums, enrollment status, major requirements) -- do not assume Year 1 scholarship continues automatically
- [ ] Ask each school's financial aid office about scholarship displacement policy for outside scholarships
- [ ] If considering the transfer path, obtain a written articulation agreement or course equivalency review before enrolling at the community college
- [ ] Verify state grant program eligibility and deadline dates (many state grants have priority deadlines separate from FAFSA)
- [ ] [Any situation-specific actions identified during analysis]
```

---

## Rules

1. **Always present the disclaimer before any financial analysis.** Education financing decisions involve large sums and long repayment timelines -- the disclaimer is not boilerplate, it is an ethical obligation.

2. **Never confuse sticker price with net price.** The published tuition is almost never what a student pays. Always work from the net price (COA minus all grants and scholarships). A $55,000 sticker price school with $25,000 in grants is cheaper than a $30,000 sticker price school with $2,000 in aid.

3. **Apply loan priority sequencing strictly.** Subsidized federal loans before unsubsidized, unsubsidized before PLUS, PLUS before private. Never suggest private loans as a first option, even if the interest rate currently looks competitive -- private loans carry none of the borrower protections of federal loans.

4. **Account for capitalized interest on unsubsidized loans.** Interest accrues from the day the loan is disbursed. On $20,000 in unsubsidized loans at 6.53%, four years of accrued interest adds approximately $5,716 to the principal balance at graduation. Omitting this understates the total debt by 15--25%.

5. **Verify scholarship renewal requirements before including them in the multi-year plan.** Many merit scholarships require a minimum GPA (commonly 3.0 or 3.25), full-time enrollment, or specific major declaration. A scholarship that lapses in Year 2 due to a GPA dip causes a $5,000--$20,000/year funding gap the family wasn't planning for. Note all conditions in the analysis.

6. **Apply the debt-to-income benchmark to the specific intended field, not to generic averages.** "Average college graduate earnings" is meaningless for this analysis. A social work major and a computer science major can attend the same school at the same cost, but one faces serious debt burden and the other does not. Use field-specific salary data.

7. **Show the total interest paid prominently -- not just the monthly payment.** Humans discount future costs. A $450/month payment sounds manageable; the fact that it results in $54,000 paid on a $40,000 loan over 10 years is the number that motivates cost-reduction action. Present both.

8. **For the 2+2 community college transfer path, always require written confirmation of course transferability before presenting savings.** If 30 credit hours don't transfer, the student doesn't save 2 years -- they add time. The savings calculation is only valid if a verified articulation agreement exists between the community college and the destination university.

9. **Never tell the user whether college is "worth it" in absolute terms.** The financial analysis shows the cost and the debt-to-income ratios. The student and family weigh that against career goals, non-financial factors, and personal values. Present the numbers clearly and flag risk thresholds; do not moralize about higher education as a concept.

10. **When presenting PLUS loan borrowing for parents, clearly separate parent debt from student debt.** Parent PLUS loans are legally the parent's obligation, not the student's. They do not appear on the student's credit report and are not dischargeable with the student's income-driven repayment eligibility. Mixing them into "total family education debt" without labeling them separately leads to seriously confused post-graduation planning.

11. **Apply the 3% annual tuition escalation to all multi-year projections.** Presenting four years of flat cost numbers produces a total that is $3,000--$10,000 too low for a typical 4-year program. The escalation is modest but real and compounds across years.

12. **For graduate and professional school analyses, always include the opportunity cost calculation in the main analysis, not just as a footnote.** A 3-year law degree at $55,000/year not only costs $165,000 in tuition -- it also represents $120,000+ in foregone attorney-track earnings that won't start until age 27 instead of 24. This is the calculus that makes certain professional degrees financially questionable at certain price points.

---

## Edge Cases

### Community College Transfer Path with No Articulation Agreement
If the student is considering community college first but cannot confirm a written articulation agreement with their intended transfer school, do not present the cost savings as assured. Articulation agreements specify which courses transfer and count toward the bachelor's degree. Without one, a student may need an additional year to complete prerequisite courses at the 4-year school, completely eliminating the cost advantage. In this case: present the savings as conditional, note the risk explicitly, and recommend the student obtain a written transfer evaluation before committing to the CC path. If the intended transfer school is a flagship state university, most state systems mandate some form of articulation -- but the student must verify this applies to their specific intended major (STEM and nursing programs frequently have stricter transfer requirements than liberal arts).

### Scholarship Displacement -- Outside Scholarship Reduces Institutional Aid
Some schools -- particularly private universities with their own large endowments -- practice "scholarship displacement": when a student receives an outside scholarship, the school reduces its own institutional grant by the same amount, leaving the student's net cost unchanged. Before counting outside scholarship dollars as cost savings, ask whether the school has this policy. If displacement applies, outside scholarships benefit the school, not the student (they reduce the school's grant obligation). In this case: redirect the student's scholarship search energy toward grants and scholarships that will reduce loans rather than institutional grants, or factor in the displacement when calculating net savings.

### Parent's Anticipated Contribution Does Not Materialize
A common scenario: the student builds a funding plan assuming $5,000--$10,000/year in parent contributions, but the parent loses a job, divorces, or simply does not follow through. Build the analysis to show what happens to the loan requirement if the family contribution is reduced to zero. This "worst case" scenario is not pessimistic -- it is responsible planning. If the plan only works with parental support, note that risk explicitly and identify which cost-reduction levers (living at home, fewer credits per semester extended timeline, additional work-study) the student can pull independently.

### Student Has a Significant 529 Balance
When a family has accumulated substantial 529 savings, the analysis focus shifts from borrowing minimization to savings deployment strategy. Key considerations: 529 funds can be used for tuition, fees, room and board, books, and technology -- but not for transportation or personal expenses. Using a 529 for non-qualified expenses triggers income tax plus a 10% penalty on the earnings portion. Present the savings balance, estimate its future value at enrollment (apply the portfolio's expected return), and show how it reduces or eliminates the funding gap year by year. Note that large 529 balances (over approximately $20,000--$25,000) may reduce need-based aid eligibility, as they are counted as a parental asset on the FAFSA at up to 5.64% in the Expected Family Contribution calculation.

### Graduate Professional Degree with Very High Debt Load (Law, Medicine, MBA)
These programs can produce loan balances of $100,000--$350,000. The standard 10-year repayment analysis needs to be supplemented with income-driven repayment projections. For a student borrowing $180,000 for law school with a starting salary of $75,000 in public interest law:
- Standard 10-year payment: approximately $2,020/month -- 32% of gross income, which is a debt crisis
- Income-Based Repayment (IBR) or SAVE plan payment: approximately 10--15% of discretionary income, much lower monthly payment
- But: IBR extends repayment to 20--25 years and significantly increases total interest paid
- Public Service Loan Forgiveness (PSLF): if working for a qualifying nonprofit or government employer, remaining balance forgiven after 10 years of qualifying payments -- this changes the financial calculus entirely for public interest careers
Present these alternative repayment scenarios for high-debt graduate analyses. This skill handles the initial analysis; if the user wants full post-graduation repayment strategy, refer to the appropriate debt management skill.

### Part-Time Enrollment While Working Full-Time
Part-time students (fewer than 12 credit hours per semester for undergrad) face different financial dynamics: Pell Grant and many state grants are prorated for part-time enrollment -- a student taking 6 credits instead of 12 may receive only half the Pell Grant. Many merit scholarships require full-time enrollment and are entirely unavailable to part-time students. However, the student has substantial earned income to apply to costs, and the opportunity cost is near zero. For this scenario: extend the program timeline accordingly (a 4-year degree part-time typically takes 6--8 years), apply prorated aid amounts, credit working income against annual costs, and note that total interest on loans will be higher due to the longer accrual period even if total amounts borrowed are lower.

### Parent Planning for a Child 10+ Years from College
This is a savings projection exercise, not a borrowing analysis. The methodology:
1. Establish current total cost of attendance for the target institution type (in today's dollars)
2. Project forward using 5% annual cost inflation (slightly higher than recent historical average to be conservative -- tuition inflation has outpaced general inflation for decades)
3. Determine what lump sum of savings is needed at enrollment start
4. Work backward to a monthly savings target using the future value of an annuity formula
5. Account for investment growth on savings (use 6--7% expected annual return for a moderate-aggressive investment allocation appropriate for a 10+ year horizon)
6. Example: $30,000/year today at 5% inflation for 12 years = approximately $53,800/year at enrollment; 4-year total ≈ $220,000. To fund half of that ($110,000) with 12 years of monthly savings at 6.5% growth, the monthly contribution needed is approximately $485/month. For a 5-year horizon, the same target requires approximately $1,550/month -- illustrating why early saving is dramatically more efficient.

### Student Received Multiple Award Letters with Different Aid Structures
This is where students most commonly make costly errors -- comparing only the institutional grant amounts without understanding what fills the remaining cost gap. Some award letters inflate their "generosity" by including unsubsidized loans and work-study as aid, making the total package look larger than it is. True comparison procedure:
1. For each letter, identify only the grants and scholarships (free money)
2. Calculate net price = total COA minus grants/scholarships only
3. Rank schools by net price, not by total aid package
4. Then evaluate the loan and work-study components separately as funding mechanisms
5. If School A offers $20,000 in grants on a $45,000 COA (net price $25,000) and School B offers $28,000 in "aid" including $8,000 in loans on a $40,000 COA (net price $32,000), School A is actually cheaper despite School B's larger "aid package" headline number.

---

## Example

**Input:** "My son is a high school senior choosing between two options. Option 1: State University, in-state tuition $13,500/year, on-campus housing. He's been offered a $4,000/year merit scholarship that requires a 3.0 GPA and full-time enrollment. Option 2: Community College for 2 years, then transfer to State University for Years 3 and 4. The CC tuition is $5,200/year and he'd live at home. He has no scholarship at the CC. We've confirmed there's an articulation agreement. We have $18,000 saved in a 529. We can contribute about $3,000/year from family cash flow. He plans to major in education and work as a teacher. Will probably work part-time, maybe 10 hours/week. No financial need -- we don't expect any Pell Grant."

---

## College Cost Analysis

**Analysis Date:** Current
**Student Profile:** Entering freshman | Full-time enrollment planned
**Programs Analyzed:** Option 1 (State U Direct, 4 years) vs. Option 2 (CC 2 years + State U 2 years)
**Intended Career:** Elementary/Secondary Education Teacher

---

### Section 1: Annual Cost of Attendance

The following uses a 3% annual escalation on tuition and a flat estimate for living costs. On-campus room and board at a typical regional state university runs $11,500--$13,500/year; we use $12,000 as a baseline. Living at home during CC years is estimated at $2,500/year (transportation and incidentals only).

| Cost Category              | Option 1 (State U, Yr 1) | Option 2 (CC, Yr 1)   | Notes                                     |
|----------------------------|-------------------------|-----------------------|-------------------------------------------|
| Tuition & Fees             | $13,500                 | $5,200                | State U includes mandatory fees           |
| Room & Board               | $12,000                 | $0                    | On-campus vs. living at home              |
| Transportation             | $1,000                  | $2,500                | Campus car/incidentals vs. commuting cost |
| Books & Supplies           | $1,100                  | $900                  | CC often lower-cost materials             |
| Personal Expenses          | $2,000                  | $1,500                |                                           |
| **Year 1 Total COA**       | **$29,600**             | **$10,100**           |                                           |

For multi-year projections, tuition escalates at 3%/year; living costs held flat.

| Year          | Option 1 COA  | Option 2 COA                      |
|---------------|---------------|-----------------------------------|
| Year 1        | $29,600       | $10,100 (CC, at home)             |
| Year 2        | $30,278       | $10,256 (CC, at home, 3% tuition) |
| Year 3        | $30,986       | $31,012 (State U, on-campus)      |
| Year 4        | $31,716       | $31,949 (State U, on-campus)      |
| **4-Yr Total**| **$122,580**  | **$83,317**                       |

*Option 2 total COA is $39,263 less than Option 1 over 4 years.*

---

### Section 2: Net Price Calculation

**Federal aid:** No Pell Grant expected based on family income profile.

**Scholarship -- Option 1:** $4,000/year × 4 years = $16,000 total, contingent on 3.0 GPA and full-time enrollment. Risk: if GPA drops below 3.0 in any year, scholarship is lost for that year (and possibly permanently, depending on school policy -- verify renewal rules).

**Scholarship -- Option 2:** $4,000/year applies only during the 2 years at State U (Years 3--4) = $8,000 total. No scholarship at community college.

**Work earnings:** At 10 hours/week × 36 weeks/year at $13/hour (typical campus or off-campus rate) = approximately $4,680/year. Over 4 years: $18,720 in total earned income applied to costs.

**Family contribution:** $3,000/year × 4 years = $12,000.

**529 savings:** $18,000 available for qualified education expenses. To allocate optimally: deploy earlier when interest rates mean unspent savings accrue less than loan interest costs. Apply $4,500/year over 4 years for simplicity, or front-load to Years 1--2 where possible.

| Funding Source             | Option 1 (4-yr Total) | Option 2 (4-yr Total) | Notes                               |
|----------------------------|-----------------------|-----------------------|-------------------------------------|
| Merit Scholarship          | $16,000               | $8,000                | 4 yrs vs. 2 yrs at State U          |
| 529 Savings                | $18,000               | $18,000               | Same for both paths                 |
| Family Cash Contribution   | $12,000               | $12,000               | $3,000/year both paths              |
| Part-Time Work Earnings    | $18,720               | $18,720               | 10 hrs/week both paths              |
| **Total Non-Loan Funding** | **$64,720**           | **$56,720**           |                                     |
| **4-Year COA**             | **$122,580**          | **$83,317**           |                                     |
| **Funding Gap (Loans)**    | **$57,860**           | **$26,597**           | **$31,263 less borrowing in Opt 2** |

Note: Option 1 scholarship advantage ($8,000 more in total scholarships) only partially offsets Option 2's dramatically lower cost of attendance, which is $39,263 cheaper. Option 2 still requires $31,263 less in borrowing.

---

### Section 3: Year-by-Year Funding Plan

#### Option 1 -- State University Direct, 4 Years

| Year   | Proj. COA | Scholarship | 529  | Family | Work  | Loans Needed | Cum. Loan Balance* |
|--------|-----------|------------|------|--------|-------|--------------|--------------------|
| Year 1 | $29,600   | $4,000     | $4,500 | $3,000 | $4,680 | $13,420    | $13,858            |
| Year 2 | $30,278   | $4,000     | $4,500 | $3,000 | $4,680 | $14,098    | $29,425            |
| Year 3 | $30,986   | $4,000     | $4,500 | $3,000 | $4,680 | $14,806    | $46,372            |
| Year 4 | $31,716   | $4,000     | $5,000 | $3,000 | $4,680 | $15,036    | $64,804            |
| **Total** | **$122,580** | **$16,000** | **$18,000** | **$12,000** | **$18,720** | **$57,860** | **~$64,804** |

*Cumulative balance includes estimated accrued interest on unsubsidized loans during enrollment. Of the $57,860 borrowed, a mix of subsidized and unsubsidized federal loans is assumed. The annual unsubsidized balance accrues approximately 6.53% interest -- estimated $6,944 in capitalized interest added to principal over 4 years, bringing the loan balance at graduation to approximately $64,804.*

Federal loan limit for dependent undergrad: $5,500 (Yr1), $6,500 (Yr2), $7,500 (Yr3--4) = $27,000 max in federal loans over 4 years. The annual need ($13,000--$15,000) significantly exceeds federal loan limits. The gap above $27,000 in federal loans (~$30,860) would need to come from Parent PLUS loans or private loans. **This is an important flag** -- see Debt-to-Income Assessment below.

#### Option 2 -- Community College (Years 1--2) then State University (Years 3--4)

| Year   | Proj. COA | Scholarship | 529  | Family | Work  | Loans Needed | Cum. Loan Balance* |
|--------|-----------|------------|------|--------|-------|--------------|--------------------|
| Year 1 (CC) | $10,100 | $0    | $4,500 | $3,000 | $4,680 | $0**     | $0                 |
| Year 2 (CC) | $10,256 | $0    | $4,500 | $3,000 | $4,680 | $0**     | $0                 |
| Year 3 (SU) | $31,012 | $4,000 | $4,500 | $3,000 | $4,680 | $14,832  | $15,300            |
| Year 4 (SU) | $31,949 | $4,000 | $5,000 | $3,000 | $4,680 | $15,269  | $31,981            |
| **Total** | **$83,317** | **$8,000** | **$18,000** | **$12,000** | **$18,720** | **$26,597** | **~$31,981** |

**During CC years, COA ($10,100 and $10,256) is fully covered by 529 + family contribution + work earnings ($12,180/yr). No loans needed in Years 1--2.

The $26,597 in federal loans (Years 3--4) stays within the available federal subsidized/unsubsidized limits for those years ($7,500/year available in Year 3 and Year 4 = $15,000 max federal in those years -- plus some subsidized eligibility may apply). With approximately $15,000 in federal loans plus $11,597 in PLUS or private loans, this is a more manageable structure. Estimated capitalized interest approximately $5,384, bringing graduation balance to
