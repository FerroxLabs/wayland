---
name: invoice-creator
description: |
  Professional invoice templates with payment terms, tracking systems, follow-up workflows, and best practices for freelancers and small businesses.
  Use when the user asks about invoice creator, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of invoice creator or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "quickstart strategy template automation presentation freelancing email cleaning"
  category: "business-strategy"
  subcategory: "entrepreneurship"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Invoice Creator

You are a freelance business operations specialist. Help the user create professional invoices, set up payment terms, track payments, and follow up on late invoices. Provide ready-to-use templates and automation tips.


## When to Use

**Use this skill when:**
- User asks about invoice creator techniques or best practices
- User needs guidance on invoice creator concepts
- User wants to implement or improve their approach to invoice creator

**Do NOT use when:**
- The request falls outside the scope of invoice creator
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Invoice Template

```
=================================================================
                         INVOICE
=================================================================

FROM:                              INVOICE #: INV-________
[Your Name / Business Name]       DATE: _______________
[Your Address]                     DUE DATE: _______________
[City, State ZIP]
[Email]                            BILL TO:
[Phone]                            [Client Name]
[Tax ID / EIN if applicable]       [Client Company]
                                   [Client Address]
                                   [City, State ZIP]

-----------------------------------------------------------------
DESCRIPTION                        QTY    RATE      AMOUNT
-----------------------------------------------------------------
[Service/Product 1]                ___    $______   $________
[Service/Product 2]                ___    $______   $________
[Service/Product 3]                ___    $______   $________
[Service/Product 4]                ___    $______   $________

-----------------------------------------------------------------
                                   SUBTOTAL:        $________
                                   TAX (____%):     $________
                                   DISCOUNT:       -$________
                                   ----------------------------
                                   TOTAL DUE:       $________
-----------------------------------------------------------------

PAYMENT TERMS: _______________
PAYMENT METHODS:
  - Bank Transfer: [Account details]
  - PayPal: [email]
  - Other: [details]

NOTES:
_______________________________________________________________

LATE PAYMENT POLICY:
A fee of [1.5%] per month will be applied to overdue balances.

=================================================================
Thank you for your business!
=================================================================
```

## Invoice Numbering Systems

| System | Format | Example | Best For |
|--------|--------|---------|----------|
| Sequential | INV-001, INV-002 | INV-047 | Simple, low volume |
| Date-based | YYYYMM-## | 202601-03 | Easy date tracking |
| Client-based | CLIENT-## | ACME-012 | Multiple clients |
| Combined | YYMM-CLIENT-## | 2601-ACME-03 | Full traceability |

**Never reuse or skip invoice numbers** - this causes accounting problems.

## Payment Terms

### Standard Terms

| Term | Meaning | Best For |
|------|---------|----------|
| Due on receipt | Pay immediately | Small amounts, new clients |
| Net 15 | Due within 15 days | Standard freelance |
| Net 30 | Due within 30 days | Established clients, corporate |
| Net 45/60 | Due within 45-60 days | Enterprise contracts |
| 50% upfront, 50% on delivery | Split payment | Large projects |
| Monthly retainer | Due 1st of each month | Ongoing work |

### Payment Terms Language

```
Standard:
"Payment is due within 30 days of invoice date. A late fee of
1.5% per month will be applied to balances overdue by more than
15 days."

With Early Payment Discount:
"Payment due within 30 days. 2% discount if paid within 10 days
(2/10 Net 30)."

For Large Projects:
"50% due upon project commencement. Remaining 50% due upon
delivery and client approval. Late payments subject to 1.5%
monthly interest."

Retainer:
"Monthly retainer of $[amount] due on the 1st of each month.
Unused hours do not roll over. Additional hours billed at
$[rate]/hour."
```

## Invoice Line Item Examples

### By Service Type

**Consulting / Hourly:**
```
Strategy consultation (Jan 5-9)       8 hrs   $150/hr   $1,200.00
Client presentation preparation       3 hrs   $150/hr   $  450.00
Travel time (client site visit)       2 hrs   $ 75/hr   $  150.00
```

**Project-Based / Fixed Fee:**
```
Website redesign - Phase 1 (Design)   1       $3,500    $3,500.00
Website redesign - Phase 2 (Dev)      1       $5,000    $5,000.00
Content migration (42 pages)          1       $1,200    $1,200.00
```

**Retainer + Overages:**
```
Monthly retainer (January 2026)       1       $2,500    $2,500.00
Additional hours beyond retainer      4 hrs   $175/hr   $  700.00
```

**Product + Service:**
```
Custom logo design                    1       $800      $  800.00
Business card design                  1       $200      $  200.00
Print production (500 cards)          500     $0.15     $   75.00
Shipping                             1       $12.50    $   12.50
```

## Payment Tracking

### Invoice Tracker Template

```
INVOICE TRACKER
==============

Invoice #    Client      Amount     Sent      Due       Paid      Status
__________   ________    $______    ______    ______    ______    ________
__________   ________    $______    ______    ______    ______    ________
__________   ________    $______    ______    ______    ______    ________
__________   ________    $______    ______    ______    ______    ________

Status options: Sent | Viewed | Paid | Overdue | Disputed

MONTHLY SUMMARY:
Total invoiced:   $________
Total collected:  $________
Outstanding:      $________
Overdue:          $________
```

## Follow-Up Workflow

### Payment Reminder Schedule

| When | Action | Template |
|------|--------|---------|
| Invoice sent | Confirmation email | "Invoice attached" |
| 3 days before due | Friendly reminder | "Gentle reminder" |
| Due date | Due date notice | "Invoice due today" |
| 7 days overdue | First follow-up | "Checking in" |
| 14 days overdue | Second follow-up | "Past due notice" |
| 30 days overdue | Final notice | "Urgent: payment required" |
| 45+ days overdue | Escalation | Phone call or collection |

### Follow-Up Email Templates

**3 Days Before Due:**
```
Subject: Upcoming invoice - INV-[###] due [date]

Hi [Name],

Just a quick reminder that invoice INV-[###] for $[amount] is
due on [date]. Please let me know if you have any questions.

Payment can be made via [payment methods].

Thanks,
[Your name]
```

**7 Days Overdue:**
```
Subject: Invoice INV-[###] - payment overdue

Hi [Name],

I wanted to follow up on invoice INV-[###] for $[amount], which
was due on [date]. I understand things get busy - could you let
me know when I can expect payment?

If there's an issue with the invoice, I'm happy to discuss.

Thanks,
[Your name]
```

**14 Days Overdue:**
```
Subject: Past due: Invoice INV-[###] - $[amount]

Hi [Name],

Invoice INV-[###] for $[amount] is now 14 days past due (original
due date: [date]). Per our agreement, a late fee of [X%] may apply
to overdue balances.

Please arrange payment at your earliest convenience, or contact
me if there's an issue we need to resolve.

Best,
[Your name]
```

**30+ Days Overdue:**
```
Subject: Urgent: Invoice INV-[###] - 30 days past due

Hi [Name],

This is my third notice regarding invoice INV-[###] for $[amount],
originally due on [date]. The balance is now 30 days overdue.

I need to receive payment or a confirmed payment plan by [date,
1 week from now]. After that date, I may need to [pause work /
pursue other collection options].

Please respond to this email today with a status update.

Thank you,
[Your name]
```

## Invoicing Tools

| Tool | Cost | Best For |
|------|------|----------|
| Wave | Free | Freelancers, simple invoicing |
| Invoice Ninja | Free / $10/mo | Open source, full featured |
| FreshBooks | $17+/mo | Time tracking + invoicing |
| QuickBooks | $30+/mo | Full accounting integration |
| Stripe Invoicing | 0.4-0.5% per invoice | Online businesses |
| PayPal Invoicing | Free (standard PayPal fees) | Quick and universal |
| Square Invoices | Free | In-person + online |

## Best Practices

| Practice | Why |
|----------|-----|
| Invoice immediately upon completion | Faster payment |
| Include clear payment instructions | Remove friction |
| Use professional formatting | Builds trust |
| Keep copies of everything | Tax and legal protection |
| Set up recurring invoices for retainers | Never skip |
| Get written agreement before starting work | Prevents disputes |
| Offer multiple payment methods | Client convenience |
| Send invoices on the same day each period | Predictability |
| Track everything (even small expenses) | Tax deductions |
| Separate business and personal accounts | Clean records |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to invoice creator
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Invoice Creator Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with invoice creator for my current situation"

**Output:**

Based on your situation, here is a structured approach to invoice creator:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
