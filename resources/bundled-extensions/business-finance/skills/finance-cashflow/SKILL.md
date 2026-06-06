---
name: finance-cashflow
description: Generate a cash flow statement from net income and balance sheet changes. Routes accrual filers to indirect method, cash-basis filers to direct method. Covers operating, investing, and financing activities with period-end reconciliation.
slash_command: false
as_of: 2026-05-03
attribution:
  lineage: anthropics/knowledge-work-plugins/finance/skills/financial-statements/SKILL.md (Apache-2.0)
  upstream_commit: 9789ea78ad66
metadata:
  wayland:
    tags: [cashflow, accounting, finance, smb, business]
---

> **Templates and analytical tools only - not personalized financial, tax, accounting, or legal advice.** The **indirect method assumes accrual basis**. Cash-basis filers without AR/AP/deferred-revenue movements should use the direct-method template below. Review with a CPA before sharing externally.

# Finance - Cash Flow Statement

Generate a cash flow statement from net income and working capital changes, organized by operating, investing, and financing activities.

## Required first prompt - basis of accounting

Ask before generating:

> **Basis of accounting**: `cash` / `accrual` / `modified cash` - REQUIRED.
>
> - **Accrual** → use the **indirect method** (default below). Net income reconciled to operating cash flow via working-capital deltas.
> - **Cash basis** → use the **direct method** (template at end of this skill). There is no AR/AP/deferred-revenue to reconcile; net income already equals cash from operations from a tax-book perspective. Indirect method on cash-basis books produces nonsense.
> - **Modified cash** → either, depending on which items are accrued; flag each accrued category and reconcile.

The cash-flow header MUST display `basis_of_accounting: <selected>` and `method: indirect | direct`.

## When to use

- Monthly or quarterly cash flow reporting
- Understanding the difference between profit and cash (a business can be profitable but cash-poor)
- Preparing financials for a lender or investor
- Identifying where cash is being consumed or generated

## Inputs

- **Period**: month (YYYY-MM), quarter (YYYY-Qn), or year (YYYY)
- **Net income** for the period
- **Non-cash items**: depreciation and amortization, stock-based compensation (if any)
- **Working capital changes** (increases/decreases vs prior period):
  - Accounts receivable
  - Inventory (if applicable)
  - Prepaid expenses
  - Accounts payable
  - Accrued liabilities
  - Deferred revenue
- **Investing activities**: equipment purchases, asset sales (if any)
- **Financing activities**: loan proceeds or repayments, owner draws/distributions, equity injections

## Output format (indirect method)

```
CASH FLOW STATEMENT - [Period]
(Indirect Method)
──────────────────────────────────────────────────────────────
OPERATING ACTIVITIES
Net income (loss)                                    $XX,XXX

Adjustments for non-cash items:
  Depreciation and amortization                      $X,XXX
  Other non-cash items                               $X,XXX

Changes in working capital:
  (Increase) / decrease in accounts receivable      ($X,XXX)
  (Increase) / decrease in inventory                ($X,XXX)
  (Increase) / decrease in prepaid expenses         ($X,XXX)
  Increase / (decrease) in accounts payable          $X,XXX
  Increase / (decrease) in accrued liabilities       $X,XXX
  Increase / (decrease) in deferred revenue          $X,XXX
                                                    --------
Net Cash from Operating Activities                   $XX,XXX

INVESTING ACTIVITIES
  Purchase of equipment / assets                    ($X,XXX)
  Proceeds from asset sales                          $X,XXX
                                                    --------
Net Cash from Investing Activities                  ($X,XXX)

FINANCING ACTIVITIES
  Loan proceeds                                      $X,XXX
  Loan repayments                                   ($X,XXX)
  Owner draws / distributions                       ($X,XXX)
  Equity injections                                  $X,XXX
                                                    --------
Net Cash from Financing Activities                  ($X,XXX)

──────────────────────────────────────────────────────────────
NET CHANGE IN CASH                                   $XX,XXX
Cash at beginning of period                          $XX,XXX
Cash at end of period                                $XX,XXX
──────────────────────────────────────────────────────────────
```

## Direct-method template (cash-basis filers)

For users on cash basis (no AR / AP / deferred revenue movements to reconcile), use:

```
CASH FLOW STATEMENT - [Period]                            Jurisdiction: [SELECTED]
basis_of_accounting: cash | method: direct
──────────────────────────────────────────────────────────────
OPERATING ACTIVITIES (cash receipts / payments)
  Cash received from customers                       $XX,XXX
  Cash received - other (interest, refunds)          $X,XXX
  Cash paid to suppliers / vendors                  ($XX,XXX)
  Cash paid for wages / contractors                 ($XX,XXX)
  Cash paid for rent / facilities                    ($X,XXX)
  Cash paid for insurance / software / utilities     ($X,XXX)
  Cash paid for taxes                                ($X,XXX)
  Cash paid - other operating                        ($X,XXX)
                                                    --------
Net Cash from Operating Activities                   $XX,XXX

INVESTING ACTIVITIES
  Purchase of equipment / assets                    ($X,XXX)
  Proceeds from asset sales                          $X,XXX
                                                    --------
Net Cash from Investing Activities                  ($X,XXX)

FINANCING ACTIVITIES
  Loan proceeds                                      $X,XXX
  Loan repayments                                   ($X,XXX)
  Owner draws / distributions                       ($X,XXX)
  Equity injections                                  $X,XXX
                                                    --------
Net Cash from Financing Activities                  ($X,XXX)

──────────────────────────────────────────────────────────────
NET CHANGE IN CASH                                   $XX,XXX
Cash at beginning of period                          $XX,XXX
Cash at end of period                                $XX,XXX
──────────────────────────────────────────────────────────────
```

## Key cash flow metrics

```
Free Cash Flow              = Operating Cash Flow - Capital Expenditures
Operating Cash Flow Margin  = Operating Cash Flow / Revenue
Cash Conversion Ratio       = Operating Cash Flow / Net Income
  (>1 = cash earnings exceed accounting earnings - healthy signal)
  (<1 = profits not converting to cash - investigate working capital)

Cash Conversion Cycle (CCC) = DSO + DIO − DPO
  DSO = Days Sales Outstanding   = (Avg AR / Revenue) × Days in period
  DIO = Days Inventory Outstanding = (Avg Inventory / COGS) × Days in period
  DPO = Days Payable Outstanding = (Avg AP / COGS) × Days in period
  Lower CCC = working capital is funding the business less; higher CCC = the business is financing customers / inventory.
```

## Common cash flow traps for SMBs

| Trap | What it looks like | Fix |
|---|---|---|
| Profitable but cash-poor | Net income positive, operating cash flow negative | AR collections too slow or expenses paid faster than collected |
| Inventory pile-up | Inventory increase draining cash | Review purchasing pace vs sales velocity |
| Slow AR collection | AR increasing each period | Tighten payment terms; add early pay discount |
| Owner over-drawing | Financing cash flow consistently negative | Review owner draw vs sustainable cash generation |
| Debt service squeeze | Financing outflows consuming most operating cash | Refinance or restructure debt |

## Workflow

1. Collect inputs (net income, non-cash items, working capital changes).
2. Build the cash flow statement.
3. Calculate free cash flow and cash conversion ratio.
4. Flag any significant negative trends.
5. Output the statement with observations.
6. Offer to save to `build_report_path("business-finance", "cashflow-<period>.md")`.

---

> _**Templates and analytical tools only - not personalized financial, tax, accounting, or legal advice.** Generated [DATE]. Jurisdiction: [SELECTED]. basis_of_accounting: [SELECTED]. method: [indirect | direct]. Indirect method assumes accrual basis; cash-basis filers should use the direct-method template. Review with a CPA before sharing externally. Wayland and the plugin authors disclaim all liability for use of these templates._
