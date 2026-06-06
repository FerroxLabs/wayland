---
name: spreadsheet-model-audit
description: |
  Audits a spreadsheet model for quality and reliability. Checks formula consistency, hardcoded values in formulas, circular references, missing error handling, and documentation gaps. Produces an audit report with specific remediation steps.
  Use when the user needs to verify the integrity of a spreadsheet model before relying on its outputs for decisions.
  Do NOT use for data cleaning (use spreadsheet-data-cleaning), setting up validation rules (use data-validation-setup), or building new financial models (use financial-model-template).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "spreadsheets analysis checklist"
  category: "data-analysis"
  subcategory: "spreadsheets"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Spreadsheet Model Audit

## When to Use

**Use this skill when:**
- A user has inherited a spreadsheet model from a departing colleague, external consultant, or unknown author and needs to verify its reliability before acting on its outputs
- A user says something like "is this model correct?", "I don't trust this spreadsheet", "how do I know if this forecast is right?", or "I need to sanity-check this before presenting it"
- A user is preparing to hand a model off to another team, a client, or leadership and wants to certify it is defensible and maintainable
- A user suspects a spreadsheet model contains errors but cannot pinpoint where -- they notice the output "feels wrong" or inconsistent with expectations
- A user needs to formally document a spreadsheet that has been in production for years without documentation, often as part of a finance team audit, SOX compliance review, or internal controls process
- A user is integrating a spreadsheet model into a larger reporting workflow and needs to confirm the model will behave reliably when upstream data changes
- A user needs to assess whether a model built by a contractor or business unit meets internal modeling standards before the model is promoted to an official planning tool
- A user is doing technical due diligence on a financial model as part of an M&A, fundraising, or lender review process

**Do NOT use when:**
- The user wants to clean, normalize, or deduplicate raw data values in a spreadsheet -- use `spreadsheet-data-cleaning` instead
- The user wants to set up dropdown lists, data validation rules, or input constraints -- use `data-validation-setup` instead
- The user wants to build a new financial model from scratch -- use `financial-model-template` instead
- The user wants to redesign or reformat charts, dashboards, or visual outputs -- use `chart-formatting` or `dashboard-design` instead
- The user's problem is purely about incorrect source data being fed into an otherwise correct model -- this is a data pipeline or ETL issue, not a model audit
- The user wants to convert a spreadsheet into a database or application -- this is a systems design problem, not an audit
- The user wants to run statistical analysis or build predictive models -- use a dedicated analytics or modeling skill

---

## Process

### Step 1: Scope the Audit Before Opening a Single Cell

Before examining any formulas, establish the audit scope, purpose, and risk profile. An unscoped audit wastes time on low-risk areas and misses critical ones.

- Ask the user: What does this model produce as its final output? (A single revenue number? A table of headcount by department? A cash flow waterfall?) The output cell or range is the anchor for everything else.
- Ask: What decisions depend on this model's outputs? A model used to set a $5M marketing budget has a higher audit threshold than a model used to estimate T-shirt sizes for a company event.
- Ask: Who built it, when was it last updated, and is the builder available to answer questions? If the builder is gone, increase the documentation audit weight significantly.
- Ask: Are there any known issues, anomalies, or "don't touch that cell" warnings? Existing suspicions are high-probability audit leads.
- Ask: How many sheets, how many formula cells approximately, and are any sheets protected or hidden?
- Determine audit depth based on stakes: for a model driving a board presentation or external reporting, perform a full structural and formula audit. For a low-stakes internal estimate, a targeted 6-point check may suffice.
- Establish what "reliable" means in this context. For some models, 99% accuracy is required. For others, a model that is correct within ±5% is acceptable. This affects how you rate findings.
- Define the audit boundary explicitly: if the model imports data from external files or databases, note that the audit covers the model logic only -- data integrity in the source is out of scope unless the user explicitly asks.

---

### Step 2: Perform Structural Inspection -- The Architecture Check

Before analyzing individual formulas, assess the overall architecture. Structural problems compound into formula problems.

- **Input/calculation/output separation (ICO principle):** A well-built model has distinct zones: a dedicated inputs or assumptions area (often a separate sheet), a calculation engine (formulas that compute intermediate values), and an output area (summary tables, charts). Violations of this -- such as assumptions embedded directly in calculation formulas -- are the root cause of most formula errors.
- **Flow direction audit:** Formulas should flow in one direction: left to right across columns, top to bottom across rows. A cell in row 15 should not reference a cell in row 40 (except for clearly labeled static lookups). Reverse references are a sign of a model that was patched iteratively and never redesigned.
- **Sheet count and naming convention:** Count sheets. Models with more than 15 sheets often have ghost sheets (sheets referenced nowhere in the active logic) or redundant sheets (two copies of a calculation with neither labeled as the authoritative version). Every sheet should have a name that describes its role, not its contents alone -- "RevModel" is better than "Sheet4" but "Revenue_Model_Q3" is better still.
- **Hardcoding proximity audit:** Scroll through each calculation sheet looking for cells with non-formula values that appear in the middle of formula ranges. A value of 1.08 in a cell surrounded by formulas is almost certainly a hardcoded assumption that should be in the inputs area.
- **Column and row header completeness:** Every column of data should have a header. Every row of inputs should have a label. Unlabeled rows and columns are a documentation failure that also prevents formula auditing.
- **Check for merged cells in calculation areas:** Merged cells break array formulas, cause VLOOKUP and INDEX/MATCH failures, and make copy-paste of formulas unreliable. Merged cells are acceptable in presentation areas only.
- **Identify anchor cells:** Find the primary output cell(s). Use Excel's Trace Dependents (Formulas > Trace Dependents) or Google Sheets' "Show formula" mode to map the dependency chain from output back to inputs. This map becomes the audit roadmap.

---

### Step 3: Formula Consistency Audit -- The Pattern Check

Formula consistency is the most reliable indicator of a model's internal discipline. Inconsistent formulas are almost always errors.

- **Column-by-column pattern check:** In a well-built model, all cells in the same column within a calculation table use the same formula pattern, differing only in row references. Select a column, press Ctrl+` (Excel) to enter formula view, and visually scan for any cell whose formula looks different from its neighbors.
- **The F2 spot-check technique:** Click on the first formula cell in a range, press F2 to enter edit mode, and note which cells are highlighted as dependencies (Excel color-codes them blue, green, purple). Then press Escape and click the last formula cell in the same range. Compare the dependency highlights. If they point to different reference patterns, you have an inconsistency.
- **Relative vs. absolute reference audit:** In a repeating formula like `=B5*$B$2`, the `$B$2` is an absolute reference to an input cell. If one cell in the column uses `=B12*B2` (relative) instead of `=B12*$B$2` (absolute), the formula will silently shift when copied and produce wrong results. This is one of the most common and least obvious formula errors.
- **Quantify pattern breaks:** Count the number of cells in each column that deviate from the majority pattern. Report as: "Column D: 47 cells use `=C[row]*$B$3`, 1 cell (D22) uses `=C22*B23*$B$3` -- anomaly at row 22."
- **Cross-sheet formula consistency:** Formulas that reference other sheets should use consistent syntax. If 10 cells reference `Assumptions!$B$5` and one references `Assumptions!B5` (without absolute reference), the latter will break if rows are inserted.
- **Check copied formulas vs. intended formulas:** In Excel, use Go To Special (Ctrl+G > Special > Constants) to identify cells in formula ranges that contain values instead of formulas. These are cells where a formula was overwritten by a value -- common when someone "fixed" a wrong result by typing the correct number directly.
- **Array formula identification:** Note all cells using CSE array formulas (`{=...}`) or ARRAYFORMULA. Array formulas break if even one cell in their range is edited, and their scope is not always obvious.

---

### Step 4: Hardcoded Value Detection -- The Hidden Assumption Hunt

Hardcoded values in formulas are the single most dangerous category of spreadsheet error because they create invisible, static assumptions that never update when the underlying reality changes.

- **Define what counts as a hardcoded value:** Any literal number or text string embedded directly in a formula instead of referencing a labeled input cell. `=B5*12` (where 12 is months per year) is hardcoded. `=B5*InputSheet!$B$3` (where $B$3 is labeled "Months Per Year") is properly parameterized.
- **High-risk formula patterns to search for:**
  - Tax rates: `*0.21`, `*0.08`, `*(1-0.21)` -- these embed percentage assumptions that change frequently
  - Growth rates: `*1.05`, `*1.12`, `*(1+0.07)` -- any multiplier near 1.0 is likely a growth or inflation rate
  - Conversion factors: `*12`, `*52`, `*365`, `/1000`, `/1000000` -- some of these are legitimate constants (12 months is always 12 months), but they should be documented
  - Headcount multipliers: `*2.5`, `*0.85` -- burden rates, utilization rates, and payroll multipliers are frequent hardcoding locations
  - Date offsets: `+30`, `+90`, `-365` -- payment terms and lag assumptions are almost always hardcoded
- **The Find & Replace scan method:** In Excel, use Ctrl+H > Find `*.` (number followed by decimal) with "Look in: Formulas" to surface formulas containing decimal numbers. Also search for `*0.` and `*1.` to catch percentage multipliers.
- **Legitimate constants vs. dangerous hardcodes:** Not all embedded numbers are errors. The number 1 in `=A5+1` (incrementing a counter) is legitimate. The number 12 in `=A5*12` is context-dependent -- if A5 is a monthly figure and 12 is always months per year, it may be acceptable if documented. The key test: could this number ever change, and if it did, would someone know to update the formula?
- **Distinguish structural hardcodes from data hardcodes:** A formula `=200000` in a cell that should be calculated is a structural error. A formula `=IF(YEAR(A1)=2024, 200000, 0)` is a structural hardcode of both the year and the value. Both are audit findings.
- **Quantify impact:** For each hardcoded value, calculate or estimate what happens to the output if the value is off by 10%. If a hardcoded tax rate of 21% is actually 28% in the user's jurisdiction, how much does the final result change? High-sensitivity hardcodes are CRITICAL findings.

---

### Step 5: Circular Reference and Iterative Calculation Audit

Circular references require separate treatment because they can be either catastrophic bugs or intentional design choices. The audit must distinguish between the two.

- **Detection method in Excel:** Go to Formulas > Error Checking > Circular References. Excel will list the first circular reference found. Note that Excel only shows one circular reference at a time -- after fixing the first, check again to find additional ones.
- **Detection method in Google Sheets:** Circular references show a warning banner at the top of the sheet and the offending cell displays `Circular dependency detected`.
- **Classify circular references:**
  - Class 1 -- Unintentional bug: A formula that references itself because of a copy-paste error or incorrect cell reference. Example: a total cell in B20 that uses `=SUM(B5:B20)` instead of `=SUM(B5:B19)` creates a self-referential loop. These are always CRITICAL findings.
  - Class 2 -- Intentional iterative model: Common in financial models that solve for a value that depends on itself -- interest expense that affects the cash balance that affects the borrowing need that affects the interest expense. Also common in working capital models and tax calculations with circular dependencies. These require iterative calculation to be enabled and must be documented.
  - Class 3 -- Ghost circular reference: A leftover circular reference from a previous model version that no longer affects the current output but still triggers the warning. These are LOW severity but should be removed.
- **Iterative calculation settings (Excel):** File > Options > Formulas. Maximum Iterations should be at least 100 (default is 100). Maximum Change should be 0.001 or smaller (default is 0.001). If Maximum Iterations is set to 1, an iterative model will not converge and will produce incorrect results.
- **Convergence test:** For intentional circular references, verify convergence by changing an input value, checking that the circular cells stabilize, then changing it back. If the model oscillates (values change on each recalculation without settling), the circular reference is not converging and is producing wrong outputs.
- **Document all intentional circular references:** Each intentional circular reference should have a comment (Excel: right-click > Insert Comment) explaining: "Circular reference intentional -- models interest-debt loop. Requires iterative calculation enabled."

---

### Step 6: Error Cell Audit -- Classification and Triage

Error cells must be classified before they can be remediated. Not all error cells indicate formula bugs -- some indicate data problems.

- **Catalog all error types:**
  - `#REF!` -- a formula references a cell that has been deleted or moved. Always a formula bug. Severity: HIGH to CRITICAL depending on location.
  - `#N/A` -- a lookup formula (VLOOKUP, HLOOKUP, INDEX/MATCH, XLOOKUP) cannot find the lookup value. May be a data problem or a structural mismatch. Severity: HIGH if it affects output; MEDIUM if it appears in a non-critical lookup.
  - `#DIV/0!` -- division by a zero or empty cell. Sometimes a data problem (a denominator input is zero), sometimes a formula problem (the formula does not handle the zero-denominator case). Check both.
  - `#VALUE!` -- a formula is performing a mathematical operation on a text value or a cell containing text. Common cause: dates stored as text, numbers stored as text, or a formula that expects a number but receives an empty cell.
  - `#NAME?` -- a formula contains an unrecognized function name. Common causes: a typo in a function name (`=SUIM` instead of `=SUM`), a named range that has been deleted, or a function that exists in a newer version of Excel than what is installed.
  - `#NUM!` -- a formula produces a numeric error (e.g., `=SQRT(-1)`, an IRR calculation that does not converge, or a value outside Excel's numeric range).
  - `#NULL!` -- rare; indicates an incorrect intersection operator. Usually a typo.
- **Error cascade mapping:** Identify which error cells are primary (the error originates here) and which are secondary (the error propagates from an upstream cell). Fix primary errors first. A single #REF! error can cascade into dozens of secondary errors. Map this by clicking on downstream formula cells and checking whether their formula references an error cell.
- **Suppressed errors -- the silent failure:** Use Ctrl+G > Special > Formulas > Errors to find all error cells. But also check for IFERROR wrappers that return 0 or a blank string when an error occurs. A formula like `=IFERROR(VLOOKUP(A5, Data!A:D, 4, FALSE), 0)` that returns 0 on error may be hiding a systematic lookup failure that silently reduces a total by a large amount. Check whether IFERROR returns are legitimately zero or are masking a problem.
- **Error rate threshold:** A model with more than 5% of its formula cells showing errors (visible or suppressed) should be rated UNRELIABLE until the errors are resolved. Between 1% and 5%, rate as NEEDS FIXES. Below 1%, the errors may be acceptable data-quality issues if properly handled.

---

### Step 7: Documentation and Maintainability Assessment

Documentation failures turn a correct model into an unmaintainable one. Assess documentation systematically.

- **Tier 1 documentation (Critical -- missing = HIGH finding):**
  - Model purpose statement: What does this model calculate, and what decisions does it inform?
  - Input inventory: A list of every assumption or input cell, its label, its unit (%, $, #, days), its current value, its source (e.g., "From 2024 budget plan, Finance team"), and the last date it was updated
  - Output description: What are the key output cells, and what do they represent?
- **Tier 2 documentation (Important -- missing = MEDIUM finding):**
  - Version number and change log: At minimum, "Version 1.3 -- updated growth rates, March 2024"
  - Author and owner: Who built it and who is responsible for maintaining it?
  - Known limitations: What does the model NOT handle? What assumptions are simplifications?
  - Sheet map: A diagram or table showing data flow between sheets
- **Tier 3 documentation (Quality -- missing = LOW finding):**
  - Cell comments on non-obvious formulas
  - Color coding legend (if color coding is used)
  - Instructions for updating the model (how to add a new product line, how to extend the forecast horizon)
- **Check for stale documentation:** Documentation that existed but has not been updated is sometimes worse than no documentation. If the inputs tab says "Growth Rate: 8%" but the Assumptions sheet has the growth rate set to 12%, the documentation is actively misleading.
- **Named ranges audit:** Models with named ranges are better documented than those without. List all named ranges (Formulas > Name Manager) and verify that each named range still refers to the correct cell or range and has a meaningful name. Orphaned named ranges (pointing to `#REF!`) are both a formula risk and a documentation failure.

---

### Step 8: Produce the Audit Report With Severity Ratings and Remediation Steps

The report must be actionable: every finding paired with a specific fix, every fix ordered by priority.

- **Severity rating framework:**
  - CRITICAL: The model is currently producing wrong outputs. No one should make a decision based on this model until fixed. Examples: active circular reference bug, #REF! error in an output cell, formula returning wrong result due to broken absolute reference.
  - HIGH: The model may produce wrong outputs under certain input conditions, or contains an assumption that could have changed without the formula updating. Examples: hardcoded rates that are likely out of date, formula pattern breaks in calculation tables, #N/A errors affecting output totals.
  - MEDIUM: The model is currently correct but fragile -- a small change could break it, or a reasonable change to inputs could produce errors. Examples: VLOOKUP without IFERROR in non-critical cells, no documentation, undocumented exceptions in formula patterns.
  - LOW: Quality and maintainability issues that do not affect current correctness. Examples: poor sheet naming, missing unit labels, color coding inconsistency.
- **Remediation specificity standard:** Every remediation step must specify the exact sheet name, cell address or range, the current formula (if relevant), and the corrected formula or action. "Review the assumptions" is not a remediation step. "Change cell Forecast!D15 from `=C15*1.12` to `=C15*(1+Assumptions!$B$5)`, where Assumptions!$B$5 is currently labeled 'Annual Growth Rate' and should contain the value 0.12" is a remediation step.
- **Group findings by theme:** If there are 20 instances of hardcoded tax rates, report them as one finding ("Hardcoded tax rate in 20 cells across Forecast sheet") with a representative list of 3-5 examples and a bulk remediation method, not 20 separate findings.
- **Calculate overall model reliability score:** Count findings by severity. A model with any CRITICAL finding is UNRELIABLE UNTIL FIXED. A model with 3+ HIGH findings and no CRITICAL is NEEDS FIXES. A model with only MEDIUM and LOW findings is CONDITIONALLY RELIABLE (reliable for current use but requires maintenance). A model with only LOW findings is RELIABLE WITH MINOR IMPROVEMENTS.

---

## Output Format

```
## Spreadsheet Model Audit Report

### Model Overview

| Element | Value |
|---------|-------|
| Model name | [name] |
| File name | [filename.xlsx] |
| Purpose | [what the model calculates and what decisions it supports] |
| Audit date | [date] |
| Audited by | [AI-assisted audit based on user-provided information] |
| Original author | [name or "Unknown"] |
| Last modified | [date or "Unknown -- check File > Properties > Last Modified"] |
| Sheet count | [N sheets: list names] |
| Estimated formula cells | [N] |
| Iterative calculation | [Enabled / Disabled / Unknown] |
| Named ranges | [N named ranges / None / Unknown] |
| Sheet protection | [None / Partial (sheets: X, Y) / Fully protected] |

**Audit Coverage:** [Full model / Partial -- specify which sheets were excluded and why]

---

### Audit Summary

| Category | Issues Found | Severity | Status |
|----------|-------------|----------|--------|
| Structural architecture | [N] | [CRITICAL/HIGH/MEDIUM/LOW/NONE] | [summary phrase] |
| Formula consistency | [N] | [CRITICAL/HIGH/MEDIUM/LOW/NONE] | [summary phrase] |
| Hardcoded values | [N] | [CRITICAL/HIGH/MEDIUM/LOW/NONE] | [N instances in N sheets] |
| Circular references | [N] | [CRITICAL/HIGH/MEDIUM/LOW/NONE] | [intentional/unintentional/none] |
| Error cells | [N] | [CRITICAL/HIGH/MEDIUM/LOW/NONE] | [N visible, N suppressed] |
| Named range integrity | [N] | [CRITICAL/HIGH/MEDIUM/LOW/NONE] | [summary phrase] |
| Documentation -- Tier 1 | [N] | [HIGH/MEDIUM/LOW/PASS] | [summary phrase] |
| Documentation -- Tier 2 | [N] | [MEDIUM/LOW/PASS] | [summary phrase] |
| **Total issues** | **[N]** | **[Highest severity present]** | |

### Overall Model Reliability Rating

**[UNRELIABLE UNTIL FIXED / NEEDS FIXES / CONDITIONALLY RELIABLE / RELIABLE WITH MINOR IMPROVEMENTS]**

Rationale: [2-3 sentence explanation of the rating. State what the most important issues are and what specific risk they create for the decision being made.]

---

### Findings

#### Finding [N]: [Descriptive Issue Title] -- [CRITICAL / HIGH / MEDIUM / LOW]

| Element | Detail |
|---------|--------|
| Location | [Sheet name, cell(s) or range, e.g., "Forecast!D15" or "Revenue!C5:C48 (3 exceptions)"] |
| Issue type | [Hardcoded value / Formula inconsistency / Circular reference / Error cell / Documentation gap / Structural] |
| Description | [Precise description of what is wrong: include the actual formula text if possible] |
| Impact | [Quantified or qualified impact: "understates revenue by the value in rows 8, 12, and 15" or "will break if any row is inserted above row 20"] |
| Risk condition | [Under what condition does this become a problem? "When growth rate changes" or "When a new product line is added"] |
| Remediation | [Step-by-step, cell-specific fix with formula text where applicable] |
| Estimated effort | [Low: <15 min / Medium: 15-60 min / High: >60 min] |

[Repeat for each finding]

---

### Audit Checklist

| # | Check | Status | Finding Ref | Notes |
|---|-------|--------|-------------|-------|
| 1 | Input/calculation/output zones are separated | [PASS/FAIL/PARTIAL] | [F#] | [specific observation] |
| 2 | Calculation flow is directional (no reverse references) | [PASS/FAIL/PARTIAL] | [F#] | [specific observation] |
| 3 | No hardcoded assumptions in formula cells | [PASS/FAIL/PARTIAL] | [F#] | [N instances found] |
| 4 | Formula patterns consistent within each column/row | [PASS/FAIL/PARTIAL] | [F#] | [N inconsistencies found] |
| 5 | Absolute references used correctly for fixed inputs | [PASS/FAIL/PARTIAL] | [F#] | [specific observation] |
| 6 | No unintentional circular references | [PASS/FAIL/PARTIAL] | [F#] | [detail] |
| 7 | Intentional circular references documented and converging | [PASS/FAIL/N/A] | [F#] | [detail] |
| 8 | No visible error cells (#REF!, #N/A, #DIV/0!, #VALUE!, #NAME?) | [PASS/FAIL/PARTIAL] | [F#] | [N errors in N sheets] |
| 9 | No suppressed errors hidden by IFERROR returning 0 | [PASS/FAIL/PARTIAL] | [F#] | [specific observation] |
| 10 | No formula cells overwritten with hardcoded values | [PASS/FAIL/PARTIAL] | [F#] | [N instances found] |
| 11 | All input cells labeled with description and unit | [PASS/FAIL/PARTIAL] | [F#] | [N unlabeled inputs] |
| 12 | Named ranges all valid (no orphaned #REF! named ranges) | [PASS/FAIL/N/A] | [F#] | [N named ranges, N invalid] |
| 13 | Model has purpose statement and input inventory (Tier 1 docs) | [PASS/FAIL/PARTIAL] | [F#] | [specific observation] |
| 14 | Version number or change log present (Tier 2 docs) | [PASS/FAIL/PARTIAL] | [F#] | [specific observation] |
| 15 | No merged cells in calculation areas | [PASS/FAIL/PARTIAL] | [F#] | [specific observation] |

---

### Dependency Map (if applicable)

[Describe or diagram the data flow between sheets. Even a text table is sufficient.]

| Sheet | Feeds Into | Receives From | Role |
|-------|-----------|--------------|------|
| [sheet name] | [sheet name(s)] | [sheet name(s) or "External data"] | [Inputs / Calculations / Output / Reference] |

---

### Remediation Priority Plan

| Priority | Finding # | Issue | Effort | Blocks Decision? | Deadline |
|----------|-----------|-------|--------|-----------------|---------|
| 1 -- FIX BEFORE USE | [F#] | [issue summary] | [Low/Med/High] | [Yes/No] | [ASAP / Before presentation / etc.] |
| 2 -- FIX BEFORE USE | [F#] | [issue summary] | [Low/Med/High] | [Yes/No] | [ASAP / Before presentation / etc.] |
| 3 -- FIX SOON | [F#] | [issue summary] | [Low/Med/High] | [No] | [Within 1 week] |
| 4 -- IMPROVE | [F#] | [issue summary] | [Low/Med/High] | [No] | [Next maintenance cycle] |

**Total estimated fix time:** [N minutes / N hours]

---

### Verification Steps After Remediation

After making all Priority 1 and Priority 2 fixes, verify the model as follows:

1. [Specific cell or check -- e.g., "Change Assumptions!B5 to 0.10 and confirm Forecast!D15 updates to the expected value"]
2. [Specific cell or check]
3. [Specific cell or check]
4. [Re-run the audit checklist and confirm all FAIL items are now PASS]
```

---

## Rules

1. **Always establish the output cell anchor before auditing anything else.** Every audit starts by identifying the exact cells that produce the model's final outputs. Auditing a model without knowing where it ends is like proofreading a document without knowing where its conclusion is -- you cannot assess severity correctly without knowing whether an error cell is in a critical output path or an unused reference area.

2. **Distinguish between data errors and formula errors before rating severity.** A #N/A in a VLOOKUP may be caused by a trailing space in the source data (data error, fixable by TRIM) or by a formula that references the wrong column (formula error, fixable by correcting the column index). Data errors are usually LOW to MEDIUM severity because they are fixed in the source. Formula errors in the same location are HIGH to CRITICAL because they affect all rows, not just one.

3. **Never rate a model as RELIABLE or CONDITIONALLY RELIABLE if it has any unresolved CRITICAL finding.** A CRITICAL finding means the model is currently producing wrong outputs. A model that is wrong 5% of the time is not 95% reliable -- it is unreliable because you cannot know which outputs are the wrong ones without external verification.

4. **Hardcoded values must be evaluated for change probability, not just existence.** The number 12 (months per year) embedded in a formula is technically hardcoded but has near-zero change probability -- it is a safe constant. The number 0.21 (corporate tax rate) is also hardcoded but has moderate change probability -- it should be parameterized. The number 0.085 (assumed interest rate on a credit line) has high change probability -- it must be parameterized. Rate hardcoded values by their change probability and their output sensitivity, not just their existence.

5. **Formula pattern exceptions must be classified as intentional or unintentional before rating severity.** A formula that deviates from the column pattern is either a bug (rate HIGH) or a documented exception (rate MEDIUM if documented, HIGH if undocumented). Never assume a pattern exception is intentional without evidence -- a comment, a label, or a structural reason. Without evidence, assume it is a bug.

6. **IFERROR suppression is not the same as error handling.** A formula `=IFERROR(VLOOKUP(A5, Data!$A:$D, 4, FALSE), 0)` is not error-handled -- it is error-suppressed. The distinction: proper error handling addresses the root cause (clean the data, add the missing lookup value). Error suppression hides the symptom. An audit must identify suppressed errors by checking whether IFERROR returns are legitimately zero or are silently zeroing out real values. Suppressed errors that contribute to totals are HIGH findings.

7. **Absolute reference errors are the most common type of formula inconsistency and must always be checked explicitly.** When a formula uses `$B$2` to reference an input cell, it will remain anchored when copied. When it accidentally uses `B2` (relative), copying it down the column will shift the reference to B3, B4, B5, producing silently wrong results in rows 2 through N. This error is invisible unless you check every cell in the column individually. Always spot-check the first, middle, and last cell of every formula column for reference anchoring.

8. **Circular references must be confirmed as either present or absent -- "I don't see any" is not sufficient.** Always use the explicit menu path: Formulas > Error Checking > Circular References (Excel). If the menu item is grayed out, there are no circular references. If it is clickable and leads to a cell, there is at least one. Do not rely on visual inspection of formulas to detect circular references -- they are impossible to see without the tool.

9. **A model with no documentation is not automatically LOW severity.** If the model is simple (one sheet, 20 cells, obvious labels), missing documentation is LOW. If the model is complex (5+ sheets, 500+ cells, multiple calculation engines), missing documentation is MEDIUM to HIGH because the model cannot be safely maintained or audited by anyone other than its original builder. Rate documentation gaps by complexity-weighted maintainability risk.

10. **Every remediation step must be specific enough that a non-expert could execute it without asking a follow-up question.** "Fix the formula in D15" is not a remediation step. "In the Forecast sheet, click cell D15, change the formula from `=C15*1.12` to `=C15*(1+Assumptions!$B$5)`, and verify the result matches the previous value of [X] when Assumptions!$B$5 is set to 0.12" is a remediation step. Vague remediation is an audit failure.

11. **Check for version conflicts -- do not assume the model you are auditing is the model in production.** Ask whether there are multiple copies of the file. In shared drives and email-based collaboration, it is common to find "Forecast_v2_FINAL_v3_USE THIS ONE.xlsx". Identify the authoritative version before auditing. If you cannot confirm which version is authoritative, flag this as a process finding separate from the formula audit.

12. **The audit must produce a verification plan, not just a finding list.** After fixing CRITICAL and HIGH items, the model fixer needs to know how to confirm the fixes worked. For each critical finding, provide a specific verification test: change an input, compute the expected output by hand or calculator, and confirm the model matches.

---

## Edge Cases

**Model is extremely large (20+ sheets, 1,000+ formula cells):**
Do not attempt a comprehensive cell-by-cell audit -- it is impractical and adds noise. Instead, perform a risk-stratified audit: (1) identify the output cells; (2) use Trace Precedents to map the dependency chain back to inputs, documenting which sheets and cell ranges are in the critical path; (3) perform a full audit of cells in the critical path only; (4) perform a structural-only check of non-critical sheets (naming, organization, error cells, documentation); (5) explicitly document the audit boundary in the report. State: "Full formula audit covers critical path: Summary, Revenue_Model, Cost_Model. Structural-only audit covers: Data_Import, Reference_Tables, Scenario_Analysis." A scoped audit with explicit boundaries is more credible than an attempted full audit that misses things.

**Model uses Power Query or external data connections:**
Power Query transforms and external connections are outside the formula audit scope but must be acknowledged. Check whether connections are live (will refresh on open) or cached (static snapshot). Live connections introduce data integrity risk that the model inherits -- a change to the source database can silently alter model inputs. Flag this as an architectural dependency finding: "Model receives [input type] from [source description] via Power Query / ODBC connection. Source data integrity is outside this audit's scope. Recommend establishing a data validation check on import -- e.g., row count check, date range check -- to detect unexpected source changes."

**Model intentionally omits error handling because errors indicate "no data" (expected blank outputs):**
Some models use error values as display signals. A VLOOKUP that returns #N/A for products not yet launched is intentional -- the error means "this product doesn't have data yet, leave it blank." In this case, suppressing the error with IFERROR is wrong because it masks the absence of expected data. The correct handling is to use IFNA (not IFERROR) so that only #N/A is suppressed, not formula errors. Document this pattern and check that IFNA is used rather than IFERROR. If IFERROR is used in these cases, change the severity to HIGH because IFERROR will also suppress genuine formula errors that should be visible.

**Model has been modified by multiple people over time with no version control:**
This is the spreadsheet equivalent of untracked code changes. Symptoms include: inconsistent formula styles within the same sheet (some cells use VLOOKUP, others use INDEX/MATCH, others use XLOOKUP -- indicating three different builders with different vintage knowledge), comments with dates and names, cells colored differently from the established scheme, and formulas that reference sheets or ranges that no longer exist. In this scenario: (1) prioritize the hardcoded value and formula consistency checks above all others, because patch-built models accumulate both; (2) add a finding for "No version control process" rated as MEDIUM; (3) recommend that after remediation, the model is saved as a clean version and future changes are tracked via a change log tab. The change log should capture date, modifier name, cell(s) changed, reason for change.

**User cannot access the original file -- they are working from a PDF export or a screenshot:**
This is a partial audit only. From a PDF or image, you can check: (1) whether output values seem internally consistent (do row and column totals add up?); (2) whether labeled assumptions match embedded values (if the PDF says "Growth Rate: 8%" in an assumptions table but an output row shows 12% growth year over year, there is a discrepancy); (3) whether the model structure appears reasonable. Rate any PDF-based audit as INCOMPLETE and state clearly: "This audit was performed on exported values, not on live formula cells. Formula-level findings (hardcoded values, circular references, absolute reference errors) cannot be assessed without access to the source file. Recommend obtaining the .xlsx file before relying on model outputs."

**Model uses a custom VBA macro or Add-in to perform calculations:**
VBA-based calculations are black boxes for formula auditing purposes. They do not appear in formula cells and cannot be audited using standard spreadsheet techniques. Document all sheets and cells that produce values via VBA (identifiable because they do not contain formulas but change when macros run). Rate this as a MEDIUM finding on documentation grounds ("Calculation logic is embedded in VBA macros, not visible in cell formulas, which prevents standard formula auditing") and as a HIGH finding on maintainability grounds if the VBA is undocumented. Recommend that VBA calculations be documented with a plain-language description of the calculation logic and that the model owner identify who can maintain the VBA code.

**User is performing a self-audit of a model they built recently:**
Acknowledge the cognitive bias risk directly. A model builder auditing their own recent work will systematically miss errors because they know what the formula was intended to do and will read the formula as doing that, even when it does not. Three mitigations: (1) impose a minimum 48-hour cooling-off period between completion and audit; (2) perform the audit in formula view only (Ctrl+`) and read each formula cold without recalling its intent; (3) add an independent verification step -- calculate at least 3 output values independently using a calculator or a separate simple spreadsheet, and confirm the model matches. If any independent check fails, expand the scope of the formula audit. A self-audit that passes all checks should be labeled "Self-audited -- independent review recommended before use in high-stakes decisions."

**Model produces outputs that look plausible but the user suspects a sign error or unit mismatch:**
These are the hardest errors to catch because the model runs without errors and produces numbers in a reasonable range. Diagnostic approach: (1) build a set of unit labels for each calculation step -- if revenue is in thousands ($K) and a cost table is in full dollars ($), any formula combining them without a scaling factor (`/1000`) is wrong; (2) check for sign convention consistency -- in a P&L model, are costs positive or negative? Mixing sign conventions in a SUM creates errors that look like rounding differences but are actually material; (3) apply a stress test -- set all growth rates to zero and confirm that the model produces a flat forecast; set a known input to a round number (e.g., exactly $100,000) and trace the value through the model to confirm it appears in the output at the expected magnitude.

---

## Example

**Input:** "I inherited a 3-year operating expense forecast spreadsheet from a finance analyst who left the company. It has 5 sheets: Inputs, Headcount, OpEx, Summary, and Scenarios. The CFO needs to present the Year 3 total OpEx figure to the board next Thursday. I need to know if I can trust this model."

**Output:**

## Spreadsheet Model Audit Report

### Model Overview

| Element | Value |
|---------|-------|
| Model name | 3-Year Operating Expense Forecast |
| File name | OpEx_Forecast_2024_FINAL.xlsx |
| Purpose | Projects total operating expenses by category and department over 3 years; Year 3 total feeds into board presentation |
| Audit date | Current |
| Audited by | AI-assisted audit based on user-provided structural information |
| Original author | Departed finance analyst (name unknown) |
| Last modified | Unknown -- check File > Properties > Details > Last Modified |
| Sheet count | 5 (Inputs, Headcount, OpEx, Summary, Scenarios) |
| Estimated formula cells | 300-600 (estimated for a model of this type) |
| Iterative calculation | Unknown -- verify at File > Options > Formulas |
| Named ranges | Unknown -- check Formulas > Name Manager |
| Sheet protection | Unknown -- check Review > Protect Sheet for each sheet |

**Audit Coverage:** Full audit recommended for Inputs, Headcount, OpEx, and Summary (critical path to Year 3 output). Structural check only for Scenarios (does not feed into board output unless user confirms otherwise).

---

### Audit Summary

| Category | Issues Found | Severity | Status |
|----------|-------------|----------|--------|
| Structural architecture | 1 | MEDIUM | Mixed inputs and calculations found in OpEx sheet |
| Formula consistency | 3 | HIGH | Pattern breaks in Headcount and OpEx sheets |
| Hardcoded values | 7 | HIGH | Benefit rate, inflation rate, and headcount multipliers hardcoded |
| Circular references | 1 | CRITICAL | Unverified -- must check before presenting |
| Error cells | 4 | HIGH | 3 visible #VALUE! errors in OpEx, 1 suppressed #N/A in Summary |
| Named range integrity | 2 | MEDIUM | 2 named ranges reference deleted rows |
| Documentation -- Tier 1 | 3 | HIGH | No input inventory, no unit labels, no model purpose statement |
| Documentation -- Tier 2 | 2 | MEDIUM | No version number, no change log |
| **Total issues** | **23** | **CRITICAL (pending circular ref check)** | |

### Overall Model Reliability Rating

**NEEDS FIXES -- Do not present Year 3 figures to the board until Priority 1 and Priority 2 findings are resolved.**

Rationale: The model contains visible error cells in the OpEx sheet that may be propagating incorrect values into the Summary output. Additionally, 7 hardcoded rates -- including the employee benefits rate -- have not been verified as current, which means the Year 3 total may embed outdated cost assumptions. The circular reference status is unconfirmed and must be checked immediately: if one exists unintentionally and iterative calculation is not enabled, the affected cells will be returning zero, silently understating OpEx. With approximately 4-6 hours of focused remediation, the model can reach CONDITIONALLY RELIABLE status before Thursday.

---

### Findings

#### Finding 1: Unverified Circular Reference Status -- CRITICAL

| Element | Detail |
|---------|--------|
| Location | Unknown -- must be identified using Formulas > Error Checking > Circular References |
| Issue type | Circular reference -- classification pending |
| Description | Circular reference status has not been confirmed. OpEx models that include rent escalation formulas, headcount-dependent cost drivers, or loaded labor rate calculations are common sources of unintentional circular references. This must be checked before any other analysis proceeds. |
| Impact | If an unintentional circular reference exists AND iterative calculation is disabled, the affected cells return 0. In an OpEx model, a zero-returning cost category would understate Year 3 total OpEx by the full value of that category -- potentially millions of dollars in a board-level forecast. |
| Risk condition | Exists now if no one has checked since the original builder left. |
| Remediation | (1) In Excel: Formulas > Error Checking > Circular References. If the menu item is grayed out: no circular references -- mark PASS and proceed. If it navigates to a cell: document the cell address and formula, then classify as intentional or unintentional. (2) If unintentional (a cell references itself through a chain): fix the reference. (3) If intentional (e.g., a rent escalation loop): verify that File > Options > Formulas > Enable iterative calculation is checked, Maximum Iterations = 100, Maximum Change = 0.001. Add a comment to the cell explaining the intentional circular dependency. |
| Estimated effort | Low: 10 minutes to check and classify |

---

#### Finding 2: Employee Benefits Rate Hardcoded in 14 Headcount!Column F Formulas -- HIGH

| Element | Detail |
|---------|--------|
| Location | Headcount sheet, column F (Total Loaded Cost), all rows with headcount entries (estimated F7:F47 based on model size) |
| Issue type | Hardcoded assumption |
| Description | Column F calculates total loaded cost as base salary multiplied by a benefits burden rate. The formula pattern is `=E[row]*1.28`, where 1.28 represents a 28% benefits burden rate embedded directly in every formula rather than referenced from the Inputs sheet. |
| Impact | If the benefits burden rate has changed (common when a company changes benefit plans, adds 401k matching, or updates payroll taxes), all 14 formulas must be manually found and updated. If even one is missed, the Year 3 total loaded headcount cost will be wrong. A 1-percentage-point change in the burden rate (from 28% to 29%) on a $10M base salary total changes Year 3 headcount cost by $100K. |
| Risk condition | Any change to the benefits package since the model was built renders this figure stale. |
| Remediation | (1) In the Inputs sheet, add a row labeled "Employee Benefits Burden Rate" in column A, enter the current rate in column B (e.g., 0.28), and add the unit "% of base salary" in column C. (2) In Headcount!F7, change the formula from `=E7*1.28` to `=E7*(1+Inputs!$B$[row])` using the absolute reference to the new Inputs cell. (3) Copy the corrected formula down through F47. (4) Verify the total in the summary row matches the previous total to confirm the current rate is still 28%. (5) Confirm the current rate with HR or Finance before the board presentation. |
| Estimated effort | Low: 20 minutes |

---

#### Finding 3: #VALUE! Errors in OpEx!G22, G23, G24 -- HIGH

| Element | Detail |
|---------|--------|
| Location | OpEx sheet, cells G22, G23, G24 |
| Issue type | Error cells -- suspected data type mismatch |
| Description | Three cells in column G (Year 3 OpEx values by category) display #VALUE! errors. The most likely cause is that the source cells in column D or E contain text-formatted numbers ("1,200,000" stored as text rather than as the number 1200000) due to an import from another system. Formulas attempting arithmetic on text values return #VALUE!. |
| Impact | Column G row 22-24 feed into the column G total in G50 (estimated), which feeds into Summary!C8 (estimated Year 3 Total OpEx). If these three cells are erroring, they contribute 0 to the total, understating Year 3 OpEx by the sum of those three categories. This is the figure being presented to the board. |
| Risk condition | Currently active -- the errors are visible now. |
| Remediation | (1) Click OpEx!G22 and press F2 to see the formula. Identify which upstream cell(s) the formula references. (2) Check those upstream cells: if a cell contains a number like "1,200,000" with a green triangle in the upper-left corner, it is stored as text. Click the warning dropdown > Convert to Number. (3) Repeat for all text-formatted cells in the range. (4) Alternatively, in a blank column, use `=VALUE(D22)` to force-convert text to number, then paste-special-values back over the source cells. (5) After fixing, confirm G22:G24 show numeric values and the column G total updates. (6) Confirm the Summary sheet total updates to reflect the corrected values. |
| Estimated effort | Low: 15 minutes |

---

#### Finding 4: Summary!Year 3 Total Suppressing a #N/A Error -- HIGH

| Element | Detail |
|---------|--------|
| Location | Summary sheet, cell C8 (Year 3 Total OpEx -- the board-presentation figure) |
| Issue type | Suppressed error cell |
| Description | Cell C8 uses `=IFERROR(SUM(OpEx!G5:G50), 0)`. When OpEx!G22:G24 are returning #VALUE!, SUM propagates the error, and IFERROR suppresses it by returning 0 instead of the actual total. This means C8 currently shows 0 (or possibly a subtotal excluding the erroring cells, depending on SUM behavior with errors). The formula is hiding the OpEx error rather than displaying it. |
| Impact | The Year 3 total being prepared for board presentation may currently be 0 or materially understated. This is the highest-impact finding in the model. |
| Risk condition | Currently active. |
| Remediation | (1) Fix Finding 3 first (resolve the #VALUE! errors in G22:G24). (2) Once the source errors are fixed, the IFERROR in C8 will stop suppressing. (3) Consider changing `=IFERROR(SUM(...), 0)` to `=I
