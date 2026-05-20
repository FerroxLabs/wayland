---
name: freelancer-toolkit
description: |
  Complete freelancer business management guide covering rate setting, contract templates, invoice creation, client acquisition, portfolio building, time tracking, tax considerations including quarterly payments and deductions, scope creep prevention, and client communication templates.
  Use when the user asks about freelancer toolkit, or needs help with complete freelancer business management guide covering rate setting, contract templates, invoice creation, client acquisition, portfolio building, time tracking, tax considerations including quarterly payments and deductions, scope creep prevention, and client communication templates.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of freelancer toolkit.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "career freelancing guide"
  category: "career-development"
  subcategory: "freelancing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Freelancer Toolkit
## When to Use

**Use this skill when:**
- User asks about freelancer toolkit
- User needs guidance on freelancer toolkit topics
- User wants a structured approach to freelancer toolkit

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

1. **What services do you offer?** (writing, design, development, consulting, marketing, photography, etc.)
2. **How long have you been freelancing?** (considering, just starting, 1-3 years, 5+ years)
3. **Is this full-time or a side business?**
4. **What is your current hourly/project rate?** (if established)
5. **How are you currently finding clients?** (referrals, platforms, outreach, inbound)
6. **What is your biggest challenge right now?** (finding clients, pricing, managing time, taxes, scope creep, contracts)
7. **Do you have a business entity set up?** (sole proprietor, LLC, S-Corp)
8. **Have you worked with contracts before?**
9. **How do you currently track time and invoices?**
10. **What annual revenue are you targeting?**
---
## Step 1: Rate Setting

### Rate Calculation Method
```
RATE CALCULATION WORKSHEET:
Step 1: Determine your target annual income
Target salary (what you would earn as an employee): ${{SALARY}}
Step 2: Add the cost of being self-employed
+ Self-employment tax (15.3% of net income):    ${{AMOUNT}}
+ Health insurance:                               ${{AMOUNT/YEAR}}
+ Retirement contributions:                       ${{AMOUNT/YEAR}}
+ Business insurance (if applicable):             ${{AMOUNT/YEAR}}
+ Software and tools:                             ${{AMOUNT/YEAR}}
+ Office/coworking:                               ${{AMOUNT/YEAR}}
+ Professional development:                       ${{AMOUNT/YEAR}}
+ Equipment depreciation:                         ${{AMOUNT/YEAR}}
= TOTAL ANNUAL NEED:                             ${{TOTAL}}
Step 3: Determine billable hours
Total work hours/year (52 weeks x 40 hours):     2,080
- Vacation/holidays:                             -{{HOURS}}
- Sick days:                                     -{{HOURS}}
- Admin/non-billable time (~30%):                -{{HOURS}}
= ANNUAL BILLABLE HOURS:                         {{HOURS}}
Step 4: Calculate your hourly rate
TOTAL ANNUAL NEED / BILLABLE HOURS = HOURLY RATE
${{TOTAL}} / {{HOURS}} = ${{RATE}}/hour
Step 5: Validate against market rates
Market rate for your skill/experience: ${{RANGE}}
Your calculated rate: ${{RATE}}
Adjustment needed: {{YES/NO}}
```

### Pricing Models

| Model | Best For | Pros | Cons |
|---|---|---|---|
| **Hourly** | Unknown scope, ongoing work | Flexible, covers scope changes | Income ceiling, penalizes efficiency |
| **Project-based** | Defined scope, deliverables | Rewards efficiency, predictable for client | Risk of scope creep, must estimate accurately |
| **Retainer** | Ongoing relationships | Predictable income, client commitment | Must deliver consistent value |
| **Value-based** | High-impact work, consulting | Highest earning potential | Requires understanding client's business value |
| **Day rate** | Workshops, on-site work | Simple, premium feel | May not capture full value |

### When and How to Raise Rates
```
RATE INCREASE FRAMEWORK:

WHEN TO RAISE:
[ ] You are booked out 4+ weeks consistently
[ ] You have been at the same rate for 12+ months
[ ] You have gained significant new skills or credentials
[ ] Your cost of living has increased
[ ] You are turning away work
[ ] Your results consistently exceed client expectations

RATE INCREASE COMMUNICATION:
"Hi {{CLIENT_NAME}},

I wanted to give you advance notice that my rates will be
adjusting starting {{DATE -- 30-60 days out}}.

My new rate will be ${{NEW_RATE}}/hour (or ${{NEW_RATE}}/project),
up from the current ${{OLD_RATE}}. This reflects {{REASON: increased
expertise / market adjustment / expanded capabilities}}.

project completion. New projects starting after {{DATE}} will
be at the updated rate.

I value our working relationship and am happy to discuss this.
Thank you for your continued trust.

Best,
{{YOUR_NAME}}"
```
---
## Step 2: Contract Template

### Freelance Service Agreement
```
FREELANCE SERVICE AGREEMENT
This Agreement is entered into as of {{DATE}} between:
CLIENT: {{CLIENT_NAME}} ("Client")
        {{CLIENT_ADDRESS}}
FREELANCER: {{YOUR_NAME}} ("Freelancer")
            {{YOUR_ADDRESS}}
1. SCOPE OF WORK
   Freelancer will provide the following services:
   {{DETAILED_DESCRIPTION_OF_DELIVERABLES}}
   Deliverables:
   1. {{DELIVERABLE_1}} -- Due: {{DATE}}
   2. {{DELIVERABLE_2}} -- Due: {{DATE}}
   3. {{DELIVERABLE_3}} -- Due: {{DATE}}
   OUT OF SCOPE (explicitly excluded):
   - {{EXCLUSION_1}}
   - {{EXCLUSION_2}}
2. TIMELINE
   Project start date: {{DATE}}
   Estimated completion: {{DATE}}
   Key milestones: {{LIST}}
3. COMPENSATION
   Total project fee: ${{AMOUNT}}
   Payment schedule:
   - {{50%}} upon signing: ${{AMOUNT}} due {{DATE}}
   - {{25%}} upon {{MILESTONE}}: ${{AMOUNT}}
   - {{25%}} upon completion: ${{AMOUNT}}
   [OR: Hourly rate of ${{RATE}}/hour, billed {{weekly/monthly}},
   not to exceed ${{CAP}} without written approval.]
   Late payment: Invoices unpaid after {{15}} days will incur
   a {{1.5%}} monthly late fee.
4. REVISIONS
   This project includes {{NUMBER}} rounds of revisions.
   Additional revisions will be billed at ${{RATE}}/hour.
5. INTELLECTUAL PROPERTY
   Upon full payment, Client will own all final deliverables.
   Freelancer retains the right to display work in portfolio.
   Freelancer retains ownership of pre-existing tools,
   frameworks, and methodologies.
6. CONFIDENTIALITY
   Freelancer will not disclose Client's confidential business
   information. This does not apply to information that is
   publicly available or independently developed.
7. TERMINATION
   Either party may terminate with {{14}} days written notice.
   Client will pay for all work completed through termination date.
   Kill fee: If Client terminates before completion, a fee of
   ${{AMOUNT}} (or {{%}} of remaining balance) applies.
8. INDEPENDENT CONTRACTOR STATUS
   Freelancer is an independent contractor, not an employee.
   Freelancer is responsible for their own taxes, insurance,
   and equipment.
9. LIABILITY
   Freelancer's total liability under this agreement shall not
   exceed the total fees paid under this agreement.
10. DISPUTE RESOLUTION
    Disputes will be resolved through {{mediation/arbitration}}
    in {{JURISDICTION}}.
SIGNATURES:
Client: _______________________ Date: __________
Name: {{CLIENT_NAME}}
Freelancer: ____________________ Date: __________
Name: {{YOUR_NAME}}
```
---
## Step 3: Invoice Template
```
INVOICE
FROM:                              TO:
{{YOUR_NAME/BUSINESS_NAME}}        {{CLIENT_NAME}}
{{YOUR_ADDRESS}}                   {{CLIENT_ADDRESS}}
{{YOUR_EMAIL}}                     {{CLIENT_EMAIL}}
{{YOUR_PHONE}}
Invoice #: {{INV-YYYY-NNN}}
Date: {{DATE}}
Due Date: {{DATE}}
Project: {{PROJECT_NAME}}
ITEMIZED SERVICES:
Description                      Hours/Qty    Rate        Amount
{{SERVICE_1}}                    {{QTY}}      ${{RATE}}   ${{TOTAL}}
{{SERVICE_2}}                    {{QTY}}      ${{RATE}}   ${{TOTAL}}
{{SERVICE_3}}                    {{QTY}}      ${{RATE}}   ${{TOTAL}}
                                           Subtotal:     ${{SUBTOTAL}}
                                           Tax (if appl): ${{TAX}}
                                           TOTAL DUE:    ${{TOTAL}}
PAYMENT METHODS:
- Bank transfer: {{BANK_DETAILS}} (or "Provided separately")
- PayPal: {{EMAIL}}
- Other: {{PAYMENT_LINK}}
PAYMENT TERMS:
Due within {{15/30}} days of invoice date.
Late payment fee: {{1.5%}} per month on outstanding balance.
NOTES:
{{PROJECT_NOTES_OR_SUMMARY_OF_WORK_COMPLETED}}
Thank you for your business.
```
---
## Step 4: Client Acquisition

### Client Acquisition Channels
```
CLIENT ACQUISITION STRATEGY:

TIER 1: HIGHEST CONVERSION (focus 60% of effort)
[ ] Referrals from existing clients
[ ] Referrals from your professional network
[ ] Repeat business from past clients
[ ] Direct outreach to warm leads

TIER 2: MEDIUM CONVERSION (focus 30% of effort)
[ ] LinkedIn content and networking
[ ] Speaking at events or webinars
[ ] Content marketing (blog, newsletter, social media)
[ ] Strategic partnerships (complementary freelancers)
[ ] Industry community participation

TIER 3: LOWER CONVERSION (focus 10% of effort)
[ ] Freelance platforms (Upwork, Toptal, Fiverr Pro)
[ ] Job boards (We Work Remotely, FlexJobs)
[ ] Cold outreach to target companies
[ ] Paid advertising
```

### Cold Outreach Template
```
COLD OUTREACH EMAIL:

Subject: {{SPECIFIC_VALUE_PROPOSITION}} for {{COMPANY}}

Hi {{NAME}},

I noticed {{SPECIFIC_OBSERVATION_ABOUT_THEIR_BUSINESS}} and
thought I could help with {{SPECIFIC_PROBLEM_OR_OPPORTUNITY}}.

I am a {{YOUR_SPECIALTY}} who has helped {{SIMILAR_COMPANIES}}
achieve {{SPECIFIC_RESULT}}. For example, I recently {{BRIEF_
CASE_STUDY_WITH_METRIC}}.

Would you be open to a 15-minute call to explore whether I
could deliver similar results for {{COMPANY}}? I have a few
ideas I would love to share.

Best,
{{YOUR_NAME}}
{{YOUR_WEBSITE}}
{{YOUR_PORTFOLIO_LINK}}

P.S. {{ADDITIONAL_VALUE -- relevant article, free audit, etc.}}
```

### Proposal Template
```
PROJECT PROPOSAL
Prepared for: {{CLIENT_NAME}} at {{COMPANY}}
Prepared by: {{YOUR_NAME}}
Date: {{DATE}}
1. UNDERSTANDING YOUR NEEDS
   Based on our conversation on {{DATE}}, I understand that:
   - {{PROBLEM_1}}
   - {{PROBLEM_2}}
   - {{DESIRED_OUTCOME}}
2. PROPOSED SOLUTION
   I recommend the following approach:
   {{DETAILED_SOLUTION_DESCRIPTION}}
3. DELIVERABLES
   1. {{DELIVERABLE_1}} -- Description: {{DETAILS}}
   2. {{DELIVERABLE_2}} -- Description: {{DETAILS}}
   3. {{DELIVERABLE_3}} -- Description: {{DETAILS}}
4. TIMELINE
   Phase 1: {{PHASE}} -- {{DATES}} -- Deliverables: {{LIST}}
   Phase 2: {{PHASE}} -- {{DATES}} -- Deliverables: {{LIST}}
   Phase 3: {{PHASE}} -- {{DATES}} -- Deliverables: {{LIST}}
5. INVESTMENT
   Option A: {{DESCRIPTION}} -- ${{AMOUNT}}
   Option B: {{DESCRIPTION}} -- ${{AMOUNT}} (recommended)
   Option C: {{DESCRIPTION}} -- ${{AMOUNT}}
   Payment terms: {{SCHEDULE}}
6. WHY ME
   - {{RELEVANT_EXPERIENCE}}
   - {{PAST_RESULT_WITH_METRIC}}
   - {{UNIQUE_VALUE_PROPOSITION}}
7. NEXT STEPS
   If you would like to proceed, I can start as early as {{DATE}}.
   Please reply or schedule a call to discuss: {{CALENDAR_LINK}}
   This proposal is valid for {{14}} days.
```
---
## Step 5: Scope Creep Prevention

### Scope Creep Defense System
```
SCOPE CREEP PREVENTION:
BEFORE THE PROJECT:
[ ] Define deliverables in writing with extreme specificity
[ ] List what is OUT of scope explicitly
[ ] Set the number of revision rounds
[ ] Define the change request process in the contract
[ ] Get sign-off on scope before starting
DURING THE PROJECT:
When a client asks for something outside scope:
RESPONSE TEMPLATE:
"That is a great idea. That would be outside the current project
scope, but I would be happy to do it. I can send over a change
order for that additional work. It would be approximately
${{ESTIMATE}} and {{TIME}} additional time. Want me to put
that together?"
CHANGE ORDER TEMPLATE:
CHANGE ORDER #{{NUMBER}}
Project: {{PROJECT_NAME}}
Date: {{DATE}}
Requested change: {{DESCRIPTION}}
Impact on deliverables: {{NEW_DELIVERABLE_OR_MODIFIED_DELIVERABLE}}
Impact on timeline: +{{DAYS/WEEKS}}
Impact on cost: +${{AMOUNT}}
New total project cost: ${{UPDATED_TOTAL}}
New completion date: {{UPDATED_DATE}}
Approved by:
Client: _________________ Date: _________
Freelancer: _____________ Date: _________
SCOPE CREEP RED FLAGS:
- "While you are at it, could you also..."
- "This should be quick..."
- "I thought this was included..."
- "Can we just add one more thing?"
- Changing requirements after approval
```
---
## Step 6: Tax Considerations

### Freelance Tax Essentials
```
FREELANCE TAX CHECKLIST:
BUSINESS STRUCTURE:
[ ] Choose entity type (sole proprietor, LLC, S-Corp)
[ ] Get an EIN from the IRS (free at irs.gov)
[ ] Open a separate business bank account
[ ] Keep business and personal finances separate
QUARTERLY ESTIMATED TAXES:
Due dates: April 15, June 15, September 15, January 15
[ ] Set aside 25-30% of every payment for taxes
[ ] Use IRS Form 1040-ES to calculate estimated payments
[ ] Pay online at irs.gov/payments or by mail
[ ] Also pay state estimated taxes (if applicable)
ESTIMATED TAX CALCULATION:
Estimated annual net income: ${{AMOUNT}}
x Self-employment tax rate (15.3%): ${{AMOUNT}}
x Income tax rate (federal bracket): ${{AMOUNT}}
x State income tax rate: ${{AMOUNT}}
= TOTAL ESTIMATED TAX: ${{AMOUNT}}
/ 4 quarters = ${{QUARTERLY_PAYMENT}}
COMMON DEDUCTIONS:
[ ] Home office (dedicated space or simplified method: $5/sq ft up to 300 sq ft)
[ ] Health insurance premiums (self-employed deduction)
[ ] Business equipment (computer, monitor, desk, camera, etc.)
[ ] Software and subscriptions (Adobe, Figma, project management tools)
[ ] Professional development (courses, books, conferences)
[ ] Internet and phone (business use percentage)
[ ] Travel for business (mileage, flights, hotels)
[ ] Marketing and advertising
[ ] Professional services (accountant, lawyer)
[ ] Business insurance
[ ] Retirement contributions (SEP-IRA, Solo 401k)
[ ] Meals with clients (50% deductible)
[ ] Coworking space membership
RECORD KEEPING:
[ ] Save ALL receipts (digital is fine)
[ ] Use accounting software (QuickBooks Self-Employed, Wave, FreshBooks)
[ ] Track mileage with an app (MileIQ, Everlance)
[ ] Categorize expenses monthly (do not wait until April)
[ ] Collect W-9s from subcontractors
[ ] Issue 1099s to subcontractors paid $600+ by January 31
TAX FORMS YOU WILL FILE:
- Schedule C (Profit or Loss from Business)
- Schedule SE (Self-Employment Tax)
- Form 1040-ES (Quarterly Estimated Tax Payments)
- 1099-NEC (for subcontractors you pay $600+)
- State tax returns as applicable
```
---
## Step 7: Client Communication Templates

### Project Kickoff
```
PROJECT KICKOFF EMAIL:

Subject: Kicking off {{PROJECT_NAME}} -- Next Steps

Hi {{CLIENT_NAME}},

Excited to get started on {{PROJECT_NAME}}. Here is what
happens next:

1. COMPLETED: Contract signed and deposit received
2. NEXT: Please send {{MATERIALS_NEEDED}} by {{DATE}}
3. TIMELINE: I will deliver {{FIRST_DELIVERABLE}} by {{DATE}}
4. COMMUNICATION: I will send weekly status updates every {{DAY}}

Questions or concerns? Just reply to this email or schedule a
call: {{CALENDAR_LINK}}.

Looking forward to working together.

Best,
{{YOUR_NAME}}
```

### Weekly Status Update
```
WEEKLY STATUS UPDATE:
Subject: {{PROJECT_NAME}} -- Weekly Update {{DATE}}

Hi {{CLIENT_NAME}},

Here is your weekly update:

COMPLETED THIS WEEK:
- {{TASK_1}}
- {{TASK_2}}

IN PROGRESS:
- {{TASK_3}} (expected completion: {{DATE}})
- {{TASK_4}} (expected completion: {{DATE}})

UPCOMING:
- {{TASK_5}}
- {{TASK_6}}

BLOCKERS (if any):
- {{BLOCKER}} -- Need: {{WHAT_YOU_NEED_FROM_CLIENT}}

TIMELINE STATUS: ON TRACK / MINOR DELAY / AT RISK
BUDGET STATUS: ON BUDGET / {{%}} USED

Let me know if you have any questions.

Best,
{{YOUR_NAME}}
```

### Handling Late Payment
```
LATE PAYMENT FOLLOW-UP SEQUENCE:
DAY 1 (Due date): Automatic invoice reminder (most tools do this)
DAY 7:
Subject: Invoice #{{NUMBER}} -- Friendly Reminder
"Hi {{NAME}}, I wanted to follow up on Invoice #{{NUMBER}} for
${{AMOUNT}}, which was due on {{DATE}}. Could you let me know the
expected payment date? Happy to resend the invoice if needed."
DAY 14:
Subject: Invoice #{{NUMBER}} -- Second Notice
"Hi {{NAME}}, this is a follow-up regarding Invoice #{{NUMBER}}
for ${{AMOUNT}}, now 14 days past due. Per our agreement, a late
fee of {{%}} will apply. Please arrange payment at your earliest
convenience."
DAY 30:
Subject: Invoice #{{NUMBER}} -- Overdue Notice
"Hi {{NAME}}, Invoice #{{NUMBER}} for ${{AMOUNT}} is now 30 days
overdue. I need to pause any current work until this balance is
resolved. Please arrange payment within 7 days. If there is an
issue I am not aware of, I am happy to discuss."
BEYOND 30 DAYS:
- Consider a formal demand letter
- Consult the Small Claims Guide skill
- Consider a collections agency for large amounts
```
---
## Freelancer Business Health Check
```
MONTHLY BUSINESS REVIEW:

FINANCIAL:
[ ] Revenue this month: ${{AMOUNT}} (target: ${{TARGET}})
[ ] Invoices sent: {{COUNT}} totaling ${{AMOUNT}}
[ ] Invoices collected: {{COUNT}} totaling ${{AMOUNT}}
[ ] Outstanding invoices: {{COUNT}} totaling ${{AMOUNT}}
[ ] Expenses: ${{AMOUNT}}
[ ] Profit: ${{AMOUNT}}
[ ] Tax set-aside: ${{AMOUNT}} (running total: ${{AMOUNT}})

PIPELINE:
[ ] Active projects: {{COUNT}}
[ ] Proposals pending: {{COUNT}}
[ ] Leads in pipeline: {{COUNT}}
[ ] Revenue booked for next month: ${{AMOUNT}}
[ ] Revenue booked for month after: ${{AMOUNT}}

OPERATIONS:
[ ] All contracts signed for active projects: YES / NO
[ ] All deposits collected: YES / NO
[ ] Time tracked for all projects: YES / NO
[ ] Weekly updates sent to all clients: YES / NO

GROWTH:
[ ] New client leads this month: {{COUNT}}
[ ] Referrals received: {{COUNT}}
[ ] Portfolio updated: YES / NO
[ ] LinkedIn/content posted: {{COUNT}} times
```
---
*This skill provides freelance business management guidance. Consider consulting with an accountant for tax strategy and a business attorney for contract review as your business grows.*


## Output Format

```
FREELANCER TOOLKIT OUTPUT
=========================

Section 1: Assessment / Analysis
- Key findings
- Recommendations

Section 2: Action Plan
- Step-by-step guidance
- Timeline if applicable

Section 3: Resources
- Relevant references
- Next steps
```

## Example

**Input:** "Help me get started with freelancer toolkit"

**Output:** A structured freelancer toolkit plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
