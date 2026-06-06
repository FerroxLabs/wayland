---
name: finance-balance-sheet
description: Generate a Balance Sheet (Statement of Financial Position) showing assets, liabilities, and owner equity at a point in time. Entity-aware equity treatment (sole-prop / partnership / LLC / S-corp / C-corp); GAAP vs tax-basis distinction. Templates only - not financial or tax advice.
slash_command: false
as_of: 2026-05-03
attribution:
  lineage: authored (business-finance Wayland plugin)
  upstream_commit: 9789ea78ad66
metadata:
  wayland:
    tags: [balance-sheet, accounting, finance, smb, business]
---

> **Templates and analytical tools only - not personalized financial, tax, accounting, or legal advice.** Balance-sheet line classification, owner-equity sectioning, and basis (GAAP vs tax-basis vs cash-basis) materially change figures and how lenders / investors / IRS read them. Review with a CPA before sharing externally.

# Finance - Balance Sheet

Generate a Balance Sheet (Statement of Financial Position) as of a single date. Lenders, M&A buyers, and reasonable-salary defenses all require a B/S.

## Required inputs

- **As-of date** (end-of-period snapshot)
- **Jurisdiction** (US default; UK / EU / CA / AU / other use locally accepted formats - IFRS or local GAAP)
- **Reporting basis**: **GAAP**, **tax basis**, **cash basis**, or **modified cash** - REQUIRED. Same business produces different B/S under each basis.
- **Entity type**: sole proprietor, partnership, single-member LLC, multi-member LLC, S-corp, C-corp - equity section structure differs.
- **Asset and liability balances** (see structure below)
- **Owner contribution / draw / distribution history** for the period (impacts equity section)
- **Prior-period comparison** (optional but recommended for variance flags)

## Reporting-basis distinction (CRITICAL)

| Basis | Revenue / AR | Expense / AP | Inventory | Long-lived assets |
|---|---|---|---|---|
| **GAAP (accrual)** | AR recognized when earned | AP when incurred | At lower of cost or market; ASC 330 | Capitalized + depreciated; ASC 360 |
| **Tax basis** | Per IRC; AR/AP recognized per cash vs accrual election | Per IRC | UNICAP §263A may apply | Per IRC §168 / §179 / §168(k); MACRS |
| **Cash basis** | Recognized when cash received | Recognized when cash paid | Often capitalized only at sale | Capitalized; depreciated |
| **Modified cash** | Mix - typically cash for services + accrual for inventory / AR | Mix | Accrual on inventory | Capitalized + depreciated |

Lenders and SBA loans generally want GAAP or close-to-GAAP. Tax preparers want tax-basis. Buyers / DD typically request both.

The B/S header MUST display `reporting_basis: <selected>`.

## Output structure (US GAAP / typical SMB layout)

```
BALANCE SHEET                                            Jurisdiction: [SELECTED]
[Entity legal name]                                      reporting_basis: [SELECTED]
As of: YYYY-MM-DD                                        Generated: YYYY-MM-DD
(in dollars, unless otherwise noted)

──────────────────────────────────────────────────────────────────
ASSETS
──────────────────────────────────────────────────────────────────
CURRENT ASSETS
  Cash and cash equivalents                          $XX,XXX
  Marketable securities                              $X,XXX
  Accounts receivable, net of allowance              $XX,XXX
  Inventory                                          $X,XXX
  Prepaid expenses                                   $X,XXX
  Other current assets                               $X,XXX
                                                    --------
TOTAL CURRENT ASSETS                                 $XX,XXX

NON-CURRENT ASSETS
  Property, plant & equipment (PP&E), at cost        $XX,XXX
    Less: accumulated depreciation                  ($X,XXX)
                                                    --------
  Net PP&E                                           $XX,XXX
  Intangible assets, net                             $X,XXX
  Goodwill                                           $X,XXX
  Right-of-use lease assets (ASC 842)                $X,XXX
  Other non-current assets                           $X,XXX
                                                    --------
TOTAL NON-CURRENT ASSETS                             $XX,XXX
──────────────────────────────────────────────────────────────────
TOTAL ASSETS                                         $XXX,XXX
══════════════════════════════════════════════════════════════════

──────────────────────────────────────────────────────────────────
LIABILITIES
──────────────────────────────────────────────────────────────────
CURRENT LIABILITIES
  Accounts payable                                   $XX,XXX
  Accrued liabilities (wages, taxes, interest)       $X,XXX
  Short-term debt and current portion of LTD         $X,XXX
  Deferred revenue (current)                         $XX,XXX  ← SaaS / annual prepay
  Sales tax payable                                  $X,XXX
  Payroll taxes payable                              $X,XXX
  Operating lease liability (current, ASC 842)       $X,XXX
  Other current liabilities                          $X,XXX
                                                    --------
TOTAL CURRENT LIABILITIES                            $XX,XXX

NON-CURRENT LIABILITIES
  Long-term debt                                     $XX,XXX
  Deferred revenue (non-current)                     $X,XXX
  Operating lease liability (non-current)            $X,XXX
  Deferred tax liabilities                           $X,XXX
  Other non-current liabilities                      $X,XXX
                                                    --------
TOTAL NON-CURRENT LIABILITIES                        $XX,XXX
──────────────────────────────────────────────────────────────────
TOTAL LIABILITIES                                    $XXX,XXX
══════════════════════════════════════════════════════════════════

EQUITY (entity-specific - see below)
──────────────────────────────────────────────────────────────────
Total equity (entity-specific structure)             $XX,XXX
══════════════════════════════════════════════════════════════════
TOTAL LIABILITIES AND EQUITY                         $XXX,XXX
══════════════════════════════════════════════════════════════════

CHECK: Assets = Liabilities + Equity                 ✅ / ⚠ DIFF $X,XXX
```

## Entity-specific equity structure

### Sole proprietor / single-member LLC (disregarded entity)

```
OWNER'S EQUITY
  Owner's capital, beginning of period               $XX,XXX
  + Net income (loss) for the period                 $XX,XXX
  − Owner's draws                                   ($XX,XXX)
                                                    --------
  Owner's capital, end of period                     $XX,XXX
```

> Owner draws are NOT an expense and do NOT appear on the P&L. They reduce equity directly.

### Partnership / multi-member LLC (taxed as partnership)

```
PARTNERS' CAPITAL
  Partner A capital, beginning                       $XX,XXX
    + Allocated profit (loss)                        $X,XXX
    − Withdrawals                                   ($X,XXX)
                                                    --------
  Partner A capital, end                             $XX,XXX
  Partner B capital, end                             $XX,XXX
                                                    --------
TOTAL PARTNERS' CAPITAL                              $XX,XXX
```

> Tracked by partner; supports K-1 capital account reporting (tax basis vs §704(b) basis).

### S-corp

```
SHAREHOLDERS' EQUITY
  Common stock, par value                            $X,XXX
  Additional paid-in capital                         $X,XXX
  Retained earnings (AAA - accumulated adjustments)  $XX,XXX
  Distributions to shareholders                     ($XX,XXX)
                                                    --------
TOTAL SHAREHOLDERS' EQUITY                           $XX,XXX
```

> S-corp distributions reduce **Accumulated Adjustments Account (AAA)**, not "draws." Excess over AAA = return of capital, then capital gain. See Form 1120-S Schedule M-2.
> Shareholder basis is tracked separately on Form 7203 and is critical for distributing without recognizing gain.

### C-corp

```
STOCKHOLDERS' EQUITY
  Common stock, par value $X.XX, X,XXX shares
    issued and outstanding                           $X,XXX
  Preferred stock (if any)                           $X,XXX
  Additional paid-in capital                         $XX,XXX
  Retained earnings                                  $XX,XXX
  Treasury stock                                    ($X,XXX)
  Accumulated other comprehensive income (AOCI)      $X,XXX
                                                    --------
TOTAL STOCKHOLDERS' EQUITY                           $XX,XXX
```

> Dividends declared reduce retained earnings; treasury stock at cost.

### Single-member LLC (disregarded for tax) but may report on B/S

Use sole-proprietor structure unless LLC has elected S-corp / C-corp tax treatment, in which case use that entity's structure.

## Common SMB B/S issues to watch

- **Negative equity** - typical for early-stage businesses with accumulated losses or owner draws exceeding contributions. Lender red flag.
- **Owner draws on the P&L** - sole prop / partnership / SMLLC owner draws should NOT be on the P&L. If they are, reclassify to equity.
- **Personal credit-card debt for business purchases** - should be on the business B/S only if the business legally owes the debt; otherwise it's an owner contribution + business AP.
- **PPP / SBA / EIDL loan balances** - long-term debt, often with deferred interest; verify terms.
- **Lease obligations under ASC 842** - operating leases create both right-of-use asset AND lease liability on the B/S, even for SMBs (small-business exemption is limited).
- **Inventory valuation** - FIFO vs LIFO vs weighted average; LCNRV impairment under ASC 330. Affects both B/S and COGS.
- **Goodwill / intangibles from acquisition** - required testing under ASC 350; private companies may elect amortization simplification.
- **Deferred revenue (ASC 606)** - annual prepay creates a liability; B/S without this overstates equity for SaaS.
- **Related-party balances** - owner loans to/from the business should be separately presented.

## Liquidity and leverage ratios

After producing the B/S, compute and present:

```
LIQUIDITY
  Working capital = Current assets − Current liabilities
  Current ratio   = Current assets / Current liabilities       (target > 1.5)
  Quick ratio     = (Cash + AR + securities) / Current liab    (target > 1.0)

LEVERAGE
  Debt-to-equity  = Total liabilities / Total equity
  Debt-to-assets  = Total liabilities / Total assets
  Interest coverage = EBIT / Interest expense                  (lender covenant)

EFFICIENCY (from B/S + P&L)
  Days Sales Outstanding (DSO) = (AR / Revenue) × Days
  Days Inventory Outstanding (DIO) = (Inventory / COGS) × Days
  Days Payable Outstanding (DPO) = (AP / COGS) × Days
  Cash Conversion Cycle = DSO + DIO − DPO
```

## GAAP vs tax-basis flag

When the user requests a tax-basis B/S (e.g., to match Form 1065 / 1120-S Schedule L), explicitly note:

- Depreciation method may differ (MACRS vs straight-line)
- Inventory may follow §263A UNICAP rules
- Bad-debt reserves typically not reported (tax-basis writes off only when worthless)
- Deferred tax liabilities generally not shown
- Owner-employee benefits (S-corp >2% shareholder health insurance) reported differently

## Workflow

1. Confirm as-of date, jurisdiction, reporting basis, entity type.
2. Collect asset, liability, and equity balances (with prior-period if comparing).
3. Build asset / liability / equity sections per entity-specific structure.
4. Verify Assets = Liabilities + Equity (flag any imbalance for investigation).
5. Compute liquidity and leverage ratios.
6. Flag SMB-typical issues (deferred rev, leases, owner draws, etc.).
7. Output B/S + ratios + observations with disclaimer footer.
8. Offer to save to `build_report_path("business-finance", "balance-sheet-<as-of>.md")`.

---

> _**Templates and analytical tools only - not personalized financial, tax, accounting, or legal advice.** Generated [DATE]. Jurisdiction: [SELECTED]. reporting_basis: [SELECTED]. Entity-specific equity structure must match the entity type; GAAP / tax-basis / cash-basis / modified-cash bases produce materially different statements. ASC 606 deferred revenue, ASC 842 leases, and ASC 350 goodwill testing apply on accrual / GAAP B/S. Review with a qualified CPA before sharing externally with lenders, investors, M&A counterparties, or the IRS. Wayland and the plugin authors disclaim all liability for use of these templates._
