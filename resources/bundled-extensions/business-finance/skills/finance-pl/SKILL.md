---
name: finance-pl
description: Generate a Profit and Loss (P&L) statement from revenue and expense inputs, with period-over-period comparison and margin analysis. Basis-of-accounting-aware (cash / accrual / modified cash); ASC 606 deferred-revenue guidance for SaaS. Ported from Anthropic's financial-statements skill.
slash_command: false
as_of: 2026-05-03
related_skills: [financial-modeler]
attribution:
  lineage: anthropics/knowledge-work-plugins/finance/skills/financial-statements/SKILL.md (Apache-2.0)
  upstream_commit: 9789ea78ad66
metadata:
  wayland:
    tags: [pl, accounting, finance, smb, business]
---

> **Templates and analytical tools only - not personalized financial, tax, accounting, or legal advice.** P&L line classification, revenue recognition (ASC 606 / IFRS 15), and basis-of-accounting choice materially affect the figures. Review with a CPA before sharing externally (lender, investor, tax preparer).

# Finance - P&L Statement

Generate a Profit and Loss statement with period-over-period comparison and key margin metrics.

## When to use

- Monthly or quarterly P&L review
- Comparing actuals to a prior period or budget
- Building a financial summary for a business partner, lender, or investor
- Checking gross margin, operating margin, and net margin trends

> For advanced financial modeling (scenario analysis, DCF), load the financial-modeler skill via `skill_view('financial-modeler')`.

## Required first prompt - basis of accounting

Before generating the P&L, ask:

> **Basis of accounting**: `cash` / `accrual` / `modified cash` - REQUIRED.
> This materially changes what counts as "revenue" and "expense" for the period and which schedule (cash vs accrual) ties to the cash-flow statement. **Do not generate a P&L without this declaration.**

The P&L header MUST display `basis_of_accounting: <selected>` so any downstream reader sees it.

### ASC 606 / IFRS 15 deferred-revenue treatment (accrual filers)

For SaaS / subscription / annual-prepay / multi-element / progress-billed contracts, recognize revenue **as performance obligations are satisfied**, not when invoiced or cash is collected. Common SMB pitfalls:

- **Annual prepay SaaS** - invoice $12,000 in January; recognize $1,000 / month; remainder sits in **deferred revenue** liability. **A SaaS SMB selling annual prepay overstates revenue 12× without this treatment.**
- **Implementation / setup fees** - generally recognize ratably over the expected customer life unless distinct from the subscription.
- **Variable consideration** (rebates, refunds, usage credits) - estimate and constrain per ASC 606-10-32-11.
- **Right of return** - if material, recognize net of estimated returns.

Cash-basis filers do not apply ASC 606 - revenue equals cash collected in the period - but should still note the deferred-revenue economic reality when sharing the P&L externally.

## Inputs

- **Basis of accounting**: cash / accrual / modified cash (REQUIRED - see above)
- **Period**: month (YYYY-MM), quarter (YYYY-Qn), or year (YYYY)
- **Revenue** by category (product, service, subscription / recurring, other) - current and prior period
- **Cost of revenue / COGS** - current and prior period
- **Operating expenses** by category (R&D, S&M, G&A) - current and prior period
- **Depreciation & amortization (D&A)** - current and prior period (REQUIRED operating line)
- **Owner compensation / draws** (sole-prop or S-corp) - flagged separately for normalization
- **Other income / expense** (interest, one-time items) - optional
- **Tax rate** - optional; if unknown, output pre-tax income and note
- **Budget** - optional; include for budget vs actual variance column
- **Business scale**: revenue tier (`<$1M` / `$1–10M` / `$10M+`) - used to set scale-aware variance thresholds

## Output format

```
PROFIT & LOSS STATEMENT
Period: [Period description]
basis_of_accounting: [cash | accrual | modified cash]
Jurisdiction: [SELECTED]
(in dollars, unless otherwise noted)

                              Current    Prior      Variance   Var %
                              Period     Period     ($)        (%)
                              --------   --------   --------   --------
REVENUE
  Product revenue             $XX,XXX    $XX,XXX    $X,XXX     X.X%
  Service revenue             $XX,XXX    $XX,XXX    $X,XXX     X.X%
  Subscription / recurring    $XX,XXX    $XX,XXX    $X,XXX     X.X%
  Other revenue               $XX,XXX    $XX,XXX    $X,XXX     X.X%
                              --------   --------   --------
TOTAL REVENUE                 $XX,XXX    $XX,XXX    $X,XXX     X.X%

COST OF REVENUE               $XX,XXX    $XX,XXX    $X,XXX     X.X%
  (For SaaS, break out: hosting / direct labor / data / payment fees)
                              --------   --------
GROSS PROFIT                  $XX,XXX    $XX,XXX    $X,XXX     X.X%
  Gross Margin                XX.X%      XX.X%

OPERATING EXPENSES
  Salaries & wages            $XX,XXX    $XX,XXX    $X,XXX     X.X%
  Owner compensation (S-corp) $XX,XXX    $XX,XXX    $X,XXX     X.X%   ← reasonable-salary
  Owner draws (sole prop)     $XX,XXX    $XX,XXX    $X,XXX     X.X%   ← BTL: not an expense
  Marketing & advertising     $XX,XXX    $XX,XXX    $X,XXX     X.X%
  Rent & facilities           $XX,XXX    $XX,XXX    $X,XXX     X.X%
  Software & subscriptions    $XX,XXX    $XX,XXX    $X,XXX     X.X%
  Professional services       $XX,XXX    $XX,XXX    $X,XXX     X.X%
  Depreciation & amortization $XX,XXX    $XX,XXX    $X,XXX     X.X%
  Other operating expenses    $XX,XXX    $XX,XXX    $X,XXX     X.X%
                              --------   --------
TOTAL OPERATING EXPENSES      $XX,XXX    $XX,XXX    $X,XXX     X.X%

OPERATING INCOME (LOSS)       $XX,XXX    $XX,XXX    $X,XXX     X.X%
  Operating Margin            XX.X%      XX.X%

OTHER INCOME (EXPENSE)
  Interest income             $XX,XXX    $XX,XXX
  Interest expense           ($XX,XXX)  ($XX,XXX)
  Other, net                  $XX,XXX    $XX,XXX
                              --------   --------
INCOME BEFORE TAXES           $XX,XXX    $XX,XXX    $X,XXX     X.X%
  Income tax expense          $XX,XXX    $XX,XXX
                              --------   --------
NET INCOME (LOSS)             $XX,XXX    $XX,XXX    $X,XXX     X.X%
  Net Margin                  XX.X%      XX.X%
```

## Key metrics summary

After the P&L, output:

```
KEY METRICS
                              Current    Prior      Change
Revenue growth (%)                                  X.X%
Gross margin (%)              XX.X%      XX.X%      X.X pp
Operating margin (%)          XX.X%      XX.X%      X.X pp
Net margin (%)                XX.X%      XX.X%      X.X pp
OpEx as % of revenue          XX.X%      XX.X%      X.X pp
```

## Material variance flags (scale-aware)

Apply the threshold appropriate to business scale (single-flat threshold misleads at scale):

| Revenue tier | Variance flag threshold |
|---|---|
| <$1M annual | 10% **or** $500 (whichever is smaller) |
| $1–10M annual | 5% **or** $5,000 |
| $10M+ annual | 3% **or** $25,000 |

Flag any line item exceeding the applicable threshold for investigation:

| Line Item | Variance ($) | Variance (%) | Direction | Likely driver |
|---|---|---|---|---|
| [Item] | $X,XXX | X.X% | Unfavorable | Investigate |

## Margin benchmarks (SMB reference - split bootstrapped vs venture-funded)

| Business type | Bootstrapped SMB gross | VC-backed gross | Bootstrapped net | VC-backed net |
|---|---|---|---|---|
| Software / SaaS | 75–90% | 65–85% | 5–15% | -50% to +25% (often negative - investing in growth) |
| Professional services | 40–60% | 40–60% | 10–25% | 10–20% |
| E-commerce / retail | 30–50% | 30–50% | 2–8% | -30% to +5% |
| Manufacturing | 25–45% | n/a | 5–15% | n/a |
| Restaurants / food service | 55–70% (food cost 30–45%) | n/a | 2–9% | n/a |
| Agency / services-firm | 40–60% | n/a | 10–20% | n/a (utilization-rate proxy: 65–75% billable) |

**Owner-comp normalization note:** for sole-prop and S-corp comparisons, normalize net margin by adding back / pulling out owner draws (sole-prop) or reasonable salary (S-corp) so the comparison to benchmarks is apples-to-apples. Owner compensation should be flagged distinct from wages.

## Workflow

1. Collect inputs (ask for current period revenue and expenses; prior period for comparison).
2. Build the P&L table.
3. Calculate margins and key metrics.
4. Flag material variances.
5. Output the statement with observations.
6. Offer to save to `build_report_path("business-finance", "pl-<period>.md")`.

---

> _**Templates and analytical tools only - not personalized financial, tax, accounting, or legal advice.** Generated [DATE]. Jurisdiction: [SELECTED]. basis_of_accounting: [SELECTED]. Revenue recognition for SaaS / annual prepay / multi-element contracts requires ASC 606 / IFRS 15 treatment under accrual basis. D&A line and owner-comp normalization are required for benchmark comparison. Variance thresholds are scale-aware. Review with a qualified CPA or accountant before sharing externally. Wayland and the plugin authors disclaim all liability for use of these templates._
