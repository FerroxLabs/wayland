---
name: finance-sales-tax
description: Wayfair economic-nexus tracker, marketplace facilitator law handling, multi-state filing checklist, exemption certificate management, tax-on-shipping rules. Outputs a state-by-state nexus exposure report. Templates only - not personalized sales-tax advice.
slash_command: false
as_of: 2026-05-03
attribution:
  lineage: authored (business-finance Wayland plugin)
  upstream_commit: 9789ea78ad66
metadata:
  wayland:
    tags: [sales-tax, vat, nexus, finance, smb, business]
---

> **Templates and analytical tools only - not personalized financial, tax, accounting, or legal advice.** State sales-tax thresholds, marketplace-facilitator rules, exemption certificate formats, and product taxability classifications change frequently and vary substantially by state. Review with a qualified sales-tax specialist, CPA, or attorney before relying on outputs. Failure to register and remit in a state where nexus exists creates retroactive liability + penalties + interest.

# Finance - Sales Tax / Wayfair Economic Nexus

Build a state-by-state nexus exposure report and multi-state filing checklist. Handles physical nexus, **post-Wayfair (2018) economic nexus**, marketplace-facilitator laws, exemption certificate management, and tax-on-shipping rules.

## Required inputs

- **Seller details**: legal entity, primary state, EIN
- **Sales channel mix**: direct (own website), marketplace (Amazon / Etsy / eBay / Walmart), wholesale, in-person
- **Per-state sales data for the trailing 12 months and current year**:
  - Total gross sales $
  - Number of transactions
  - Whether sold via marketplace facilitator
- **Product / service categories** (taxability varies - SaaS, digital goods, food, clothing, services treated differently by state)
- **Filing year** (rules update annually)

## Wayfair economic nexus - the 2018 inflection

Before *South Dakota v. Wayfair* (2018), states required **physical presence** before they could compel out-of-state sellers to collect sales tax. *Wayfair* upheld South Dakota's law imposing collection duty on remote sellers exceeding **$100,000 in sales OR 200 transactions** per year. **All states with sales tax now have economic nexus rules** (45 states + DC). **Specific thresholds, transaction-count tests, look-back periods, and registration triggers vary by state.**

### Common state thresholds (verify against state tax authority - these change)

| Tier | Examples | Threshold (re-verify) |
|---|---|---|
| Largest tier ($500K) | CA, NY, TX | $500,000 (no transaction count) |
| $250K | KY, MD | $100K-$250K (varies) |
| $100K + 200 transactions | Most states historically | $100K OR 200 transactions |
| $100K only (200-tx test removed) | Many states have dropped the transaction count | $100K |
| AK | Multiple municipalities; ARSSTC | Varies by city |

> ⚠️ States have been **removing** the 200-transaction test over the past 3 years to reduce small-seller burden. Always verify current threshold for the state you're checking.

### Look-back period - varies by state

Some states (most): prior calendar year OR current year-to-date.
Some states: prior 12 rolling months.
Once threshold is exceeded, registration is typically required within **30 days** to **the next month** - verify per state.

### Five states with NO statewide sales tax

NOMAD: **N**ew Hampshire, **O**regon, **M**ontana, **A**laska, **D**elaware.
(AK has many municipal sales taxes - see ARSSTC.)

## Marketplace facilitator laws

Since 2018–2020, every state with sales tax has enacted Marketplace Facilitator laws requiring platforms (Amazon, Etsy, eBay, Walmart, Shopify-as-marketplace, etc.) to collect and remit sales tax on behalf of third-party sellers.

**Implications for SMB sellers:**
- Marketplace-collected sales tax is **NOT** the seller's tax obligation - but counts toward economic-nexus thresholds in many (not all) states.
- **Direct sales** (own website / Shopify standalone / Faire / WooCommerce) are NOT covered by marketplace facilitator → seller still must register and remit if nexus.
- Some states allow seller to **deduct** marketplace sales when calculating nexus; others **include** marketplace sales in threshold calculation. Verify per state.
- Seller must maintain records distinguishing marketplace vs direct sales for audit.

## Tax-on-shipping rules (varies wildly by state)

| State | Shipping taxable? |
|---|---|
| CA | Generally not taxable if separately stated and actual cost; taxable if charged as a flat handling fee |
| NY | Taxable if the underlying goods are taxable |
| TX | Taxable if the underlying goods are taxable |
| IL | Generally not taxable if separately stated and direct shipment to customer |
| FL | Taxable if delivery is part of the sale; varies by contract |
| Most states | Taxable if the goods are taxable; some exempt if separately stated |
| AK | No statewide; depends on municipality |

Always re-verify per state and re-verify product taxability (SaaS, food, clothing, digital goods all vary).

## Exemption certificate management

When a buyer claims a sales-tax exemption (resale, manufacturer, nonprofit, government, agricultural), the seller must collect and retain a **valid exemption certificate** before zero-rating tax. Otherwise the seller is liable for the tax on audit.

### Best practices
- Use **Streamlined Sales Tax (SSUTA) Multi-State Exemption Certificate** for participating states (24 SST states accept)
- Otherwise use state-specific form (CA CDTFA-230, NY ST-120, TX 01-339, etc.)
- Store certificate digitally with **expiration date** (some states require renewal annually; some are good "until revoked")
- Include: buyer name, address, sales tax permit number, type of exemption claimed, signed declaration
- Audit-readiness: link each exempt sale to the supporting certificate
- Re-collect when buyer's permit expires or buyer changes legal entity

## Multi-state filing checklist

For each state where nexus is established:

- [ ] Register for sales tax permit (apply at state revenue / DOR website)
- [ ] Determine filing frequency (monthly / quarterly / annually - typically based on volume)
- [ ] Set up tax-collection in cart / POS (right rate by destination ZIP, including local / district / special)
- [ ] Calendar filing deadlines (typically 20th of following month, but varies)
- [ ] Track gross sales, taxable sales, exempt sales separately per state
- [ ] Track local / district / special-purpose tax allocations within state where required
- [ ] File timely (most states impose late penalties + interest even on $0 returns)
- [ ] **Zero-return obligation** - most states require filing a return even if no sales were made in the period
- [ ] Update for sourcing rules (destination vs origin) - most states use destination sourcing for remote sellers post-Wayfair
- [ ] Renew permits where required

## Voluntary Disclosure Agreement (VDA)

If you discover historical nexus exposure (sold into a state for years without registering), **DO NOT** simply register going forward - registration date often triggers state look-back to your earliest nexus date with full penalties + interest. Instead:

- Engage a sales-tax specialist to negotiate a **Voluntary Disclosure Agreement (VDA)** with the state. VDAs typically:
  - Cap look-back to 3–4 years (vs unlimited for unregistered seller)
  - Waive or reduce penalties
  - May reduce interest
  - Anonymous initial approach via specialist allowed in most states

> ⚠️ Stop and engage a CPA / sales-tax specialist before registering retroactively in any state.

## Output: Nexus exposure report

```
SALES-TAX NEXUS EXPOSURE REPORT                          Jurisdiction: US
──────────────────────────────────────────────────────────────────
Seller:        [Legal entity]
Period:        [12-month look-back end date]
As-of:         YYYY-MM-DD

State        Gross Sales   Tx Count  Marketplace  Threshold   Status     Action
──────────────────────────────────────────────────────────────────
CA           $612,000      4,200     $410,000     $500,000    ⚠ NEXUS    Register + collect (direct sales $202K still > some local triggers; verify)
TX           $310,000      1,850     $0           $500,000    ✅ Below   Monitor monthly
NY           $115,000      720       $30,000      $500,000    ✅ Below   Monitor monthly
FL           $98,000       540       $0           $100,000    ⚠ Watch    Approaching - register if exceeded
WA           $45,000       310       $40,000      $100,000    ✅ Below   Monitor; marketplace sales count toward threshold
... (every state with sales presence) ...
──────────────────────────────────────────────────────────────────
TOTAL       $X,XXX,XXX

PRIORITY ACTIONS
1. CA - Register; collect tax on direct-channel sales going forward.
2. FL - Monitor; approaching threshold within 60–90 days.
3. Run VDA evaluation for any state where threshold was crossed historically.
──────────────────────────────────────────────────────────────────
```

## International note

For UK / EU / CA / AU sellers or sellers shipping into those jurisdictions, see `finance-invoice` per-jurisdiction VAT / GST blocks. EU OSS (One-Stop-Shop) for B2C, IOSS for low-value imports, UK VAT registration thresholds, CA GST/HST/QST, and AU GST all have separate nexus / registration logic.

## Workflow

1. Collect 12-month sales by state, transaction count, marketplace vs direct.
2. Match each state to current threshold (re-verify with state DOR).
3. Flag states where nexus is established or approaching.
4. For nexus states: build registration + filing checklist.
5. For historical exposure: route to VDA evaluation.
6. Output nexus exposure report with disclaimer footer.

---

> _**Templates and analytical tools only - not personalized sales-tax, financial, or legal advice.** Generated [DATE]. Jurisdiction: US (and per-state). State sales-tax thresholds, marketplace-facilitator rules, exemption-certificate formats, and product taxability change frequently - re-verify against each state's Department of Revenue for your filing year. Voluntary Disclosure Agreements should be evaluated before registering retroactively in any state. Review with a qualified sales-tax specialist or CPA before relying on outputs. Wayland and the plugin authors disclaim all liability for use of these templates._
