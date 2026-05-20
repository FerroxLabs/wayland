---
name: conditional-formatting-rules
description: |
  Produces a conditional formatting rule set for a specific use case. Specifies rule type (cell value, formula-based, color scale, data bars), criteria, color assignments with hex codes, and rule priority order. Output is the exact configuration to apply.
  Use when the user wants to highlight cells, create heat maps, add data bars, or visually encode data values in a spreadsheet.
  Do NOT use for chart color selection (use color-in-data), data validation rules (use data-validation-setup), or general spreadsheet formulas (use excel-lookup-formulas).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "spreadsheets data-visualization template"
  category: "data-analysis"
  subcategory: "spreadsheets"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Conditional Formatting Rules

## When to Use

**Use this skill when:**
- A user wants to highlight cells based on numeric thresholds -- revenue above/below target, scores outside a passing range, inventory below reorder point
- A user asks how to color-code rows, create heat maps, flag duplicates, or visually encode status across a spreadsheet
- A user needs to communicate data quality issues visually -- blank cells, out-of-range values, mismatched text entries
- A user needs traffic-light KPI indicators (red/yellow/green) for dashboards or recurring operational reports
- A user wants to format entire rows based on the value in a single column -- project status, account tier, risk level
- A user wants in-cell data bars or gradient color scales to replace or supplement a bar chart for quick comparison
- A user needs date-aware formatting -- overdue tasks, approaching deadlines, contracts expiring within 30 days
- A user wants to highlight the top N or bottom N values, above-average cells, or specific percentile ranges
- A user is building a reusable report template where formatting must apply automatically to new rows of data

**Do NOT use when:**
- The user needs to select colors for chart series, axes, or legends -- use `color-in-data` instead
- The user needs to restrict what values can be entered in a cell -- use `data-validation-setup` instead
- The user needs lookup formulas, VLOOKUP, XLOOKUP, or INDEX/MATCH logic -- use `excel-lookup-formulas` instead
- The user needs to format chart elements like plot areas, gridlines, or data point markers -- use `chart-formatting` instead
- The user is asking about programmatic formatting via VBA macros or Google Apps Script -- this skill covers UI-level rule configuration only
- The user needs Power BI or Tableau conditional formatting -- those platforms use separate rule engines with different syntax and should be addressed in their respective skills

---

## Process

### Step 1: Clarify the Formatting Objective

Before specifying any rules, collect the following information from the user. Missing even one piece leads to rules that conflict, apply to the wrong range, or produce unreadable color combinations.

- **What range should be formatted?** Get the exact column letters and row boundaries. Is it a single column (E2:E500), a multi-column row-based format (A2:H500), or a named table?
- **What condition triggers the format?** Is the trigger a number threshold, specific text, a date comparison, a formula, a blank/non-blank test, or a duplicate value?
- **Should the format apply to just that cell or the entire row?** Row-level formatting requires formula-based rules with locked column references.
- **Are there multiple conditions?** A three-tier traffic light needs three rules with explicit numeric thresholds -- confirm all threshold values.
- **Is this for Excel, Google Sheets, or LibreOffice Calc?** Rule syntax and available rule types differ. Excel and Google Sheets cover 95% of use cases.
- **Is this a one-time setup or a reusable template?** Templates need rules applied to oversized ranges (e.g., A2:A10000) to accommodate future data.

### Step 2: Select the Correct Rule Type

Match the user's need to the right rule type. Using the wrong rule type forces workarounds and fragile formulas.

| User Need | Rule Type | Notes |
|-----------|-----------|-------|
| Highlight cells above, below, between, or equal to a value | **Cell Value** | Simplest rule. Condition refers to the cell's own value. |
| Highlight cells containing specific text | **Text Contains** | Partial match. Use "Cell value equals" for exact match. |
| Format based on a value in a different column | **Formula-based** | Required for cross-column logic. Must use locked column references. |
| Format entire row based on one column | **Formula-based** | Apply rule to full row range; formula references that one column with `$`. |
| Gradient color across a numeric range | **Color Scale (2 or 3-color)** | Best for heat maps. Works on a single contiguous range. |
| Show relative magnitude with in-cell bars | **Data Bars** | Visual comparison without needing actual chart. |
| Traffic light / directional status icons | **Icon Sets** | 3-, 4-, or 5-symbol sets. Threshold percentages or values. |
| Highlight top/bottom N values | **Top/Bottom Rules** | Built-in in Excel. In Google Sheets requires LARGE/SMALL formula. |
| Highlight duplicates or unique values | **Duplicate/Unique** | Excel has a built-in type. Google Sheets requires COUNTIF formula. |
| Date comparisons (overdue, upcoming) | **Formula-based with TODAY()** | Only formula rules can reference the current date dynamically. |
| Above/below statistical average | **Formula-based with AVERAGE()** | Lock the range in AVERAGE but not the cell reference in the comparison. |

### Step 3: Define Every Rule With Complete Specification

For each rule, every single attribute must be specified. Omitting any field results in ambiguity during setup.

- **Applies to:** Exact range in absolute notation (e.g., `$A$2:$H$500`). Use absolute references for ranges to prevent drift when the rule is moved.
- **Rule type:** One of the types from Step 2 table -- never describe it loosely.
- **Condition / formula:** The complete logical expression. For formula rules, include the full formula syntax including the leading `=`.
- **Background fill color:** Hex code. Always specify both a light background (for readability) and a font color that contrasts against it.
- **Font color:** Hex code. Light backgrounds require dark fonts; dark backgrounds require light fonts. Test contrast -- WCAG AA requires a 4.5:1 contrast ratio minimum for body text.
- **Font style:** Bold, italic, or regular. Bold is appropriate for status cells. Italic signals informational or secondary status.
- **Borders:** Only specify borders if they add clarity -- over-bordering creates visual noise.
- **Number format override:** Rarely needed but useful -- e.g., negative numbers formatted as red with parentheses vs. minus sign.
- **Priority:** An integer starting at 1 for highest priority. Lower number wins when multiple rules match the same cell.
- **Stop if True:** Yes or No. Set to Yes on specific-value rules to prevent cascade conflicts. Set to No on gradient/default rules.

### Step 4: Design the Color System

Color choice is not aesthetic -- it encodes meaning. Use these systems:

**Traffic Light System (most common):**
- Red (negative/critical): Background `#FFC7CE`, Font `#9C0006`. This is Excel's built-in "Light Red Fill with Dark Red Text" -- universally recognized.
- Yellow/Amber (warning/at-risk): Background `#FFEB9C`, Font `#9C6500`. Excel's built-in "Yellow Fill with Dark Yellow Text."
- Green (positive/on-track): Background `#C6EFCE`, Font `#006100`. Excel's built-in "Green Fill with Dark Green Text."
- These three pairings have 6:1+ contrast ratios and are the industry standard for operational dashboards.

**Heat Map Color Scales:**
- Single-direction scale (low to high, bad to good): White `#FFFFFF` (min) → Green `#006100` (max). Useful for performance scores.
- Diverging scale (negative to positive): Red `#FF0000` (min) → White `#FFFFFF` (midpoint) → Green `#008000` (max). Useful for profit/loss, temperature deviation, delta comparisons.
- Monochrome intensity scale: White `#FFFFFF` (min) → Dark Blue `#003366` (max). Appropriate for frequency maps, density analysis, or accessibility-conscious audiences.
- For colorblind accessibility (affects ~8% of men): Avoid pure red/green pairs. Use Blue `#1F77B4` for positive and Orange `#FF7F0E` for negative as an alternative.

**Data Quality Encoding:**
- Blank cells: Background `#F2F2F2` (light gray). Signals missing data without alarm.
- Error values (#N/A, #REF!, etc.): Background `#FFD700` (gold), Font `#000000`. Use formula `=ISERROR(A2)`.
- Out-of-range outliers: Background `#FF6600` (orange), Font `#FFFFFF`. Distinct from standard red to signal "unusual but not necessarily wrong."

**Informational / Non-Alert Colors:**
- Blue tones (`#DDEEFF`, font `#003399`): Highlighted selections, informational flags, "this row is selected."
- Purple (`#EAD1DC`, font `#4A235A`): Secondary categories, groupings.
- Gray (`#E0E0E0`, font `#444444`): Inactive, closed, archived, neutral baseline.

### Step 5: Write Formula-Based Rules Correctly

Formula-based rules are the most powerful and the most commonly broken. Follow these rules exactly:

**Reference type discipline:**
- The formula must reference the first cell in the "Applies to" range, not a hardcoded cell.
- Lock the column, never the row: `=$E2` not `=$E$2`. The row must float so each row checks its own condition column.
- Exception: When referencing the entire locked range inside a function (AVERAGE, MAX, LARGE), lock both: `AVERAGE($B$2:$B$500)`.

**Common formula patterns:**

| Pattern | Formula | Notes |
|---------|---------|-------|
| Entire row highlight on text match | `=$F2="Behind"` | Applied to `$A$2:$H$500` |
| Entire row highlight on numeric threshold | `=$E2<1000` | Applied to `$A$2:$H$500` |
| Overdue dates | `=AND($D2<TODAY(),$D2<>"")` | Blank check prevents blank cells from triggering |
| Due within N days | `=AND($D2>=TODAY(),$D2<=TODAY()+14)` | 14-day window example |
| Blank cell | `=$A2=""` | Highlights the blank cell itself |
| Above average | `=$B2>AVERAGE($B$2:$B$500)` | Locks the range, floats the cell |
| Duplicate values | `=COUNTIF($A$2:$A$500,$A2)>1` | Counts occurrences; >1 means duplicate |
| Top 10% | `=$B2>=PERCENTILE($B$2:$B$500,0.9)` | 90th percentile threshold |
| Non-blank AND below threshold | `=AND($C2<>"",$C2<50)` | Avoids false positives on empty rows |
| Error highlighting | `=ISERROR($B2)` | Catches all error types |
| Text begins with | `=LEFT($A2,3)="INV"` | Invoice number prefix check |

**Google Sheets formula syntax differences:**
- Google Sheets uses `Custom formula is` as the rule type -- paste the formula directly.
- Google Sheets formulas reference `A2` (relative) or `$A2` (column-locked) exactly like Excel.
- Google Sheets does not support Stop If True through the UI -- rule order controls priority, and all matching rules apply unless you design rules to be mutually exclusive.

### Step 6: Set Priority Order and Stop If True Logic

Priority management is what separates professional formatting from amateur setups that produce random colors.

- **Rule with the most specific condition gets priority 1.** Example: "Behind" (exact text) should rank above any general "non-blank" rule.
- **When rules are mutually exclusive** (a cell can only be "On Track" OR "At Risk" OR "Behind"), set Stop If True on all three. This prevents the lower-priority green rule from flashing briefly or overriding when data refreshes.
- **When rules are additive** (e.g., revenue is high AND the row is flagged as closed), do NOT use Stop If True -- you want both rules to potentially apply and the higher-priority one to win visually.
- **Gradient/color scale rules should always be last** -- they apply to all cells in the range by default and act as the visual baseline.
- **In Excel, priority 1 is the topmost rule in the Manage Rules dialog.** To change priority: Home > Conditional Formatting > Manage Rules > select rule > use the up/down arrows.
- **In Google Sheets, the topmost rule in the Conditional format rules sidebar wins.** Drag rules to reorder.

### Step 7: Document and Deliver the Full Specification

Deliver a complete formatted specification the user can follow step by step. The specification must include:

- Every rule with all attributes filled in (no blanks, no "see above")
- The exact setup steps for their platform (Excel or Google Sheets)
- A color legend with hex codes and semantic meaning
- The priority table showing all rules in execution order
- Notes on any performance considerations for large datasets
- Notes on any accessibility accommodations if relevant

---

## Output Format

```
## Conditional Formatting Specification

### Overview
- **Target range(s):** [e.g., $A$2:$H$500 -- entire data table | $E$2:$E$500 -- Revenue column only]
- **Platform:** [Excel 365 / Excel 2019 / Google Sheets]
- **Number of rules:** [N]
- **Purpose:** [1-2 sentence description of what the formatting communicates to the reader]
- **Color system:** [Traffic light / Heat map / Data quality / Custom]

---

### Rule Set

#### Rule [N]: [Descriptive Rule Name] -- Priority [N]

| Attribute | Specification |
|-----------|---------------|
| Applies to | [Exact range, e.g., $A$2:$H$500] |
| Rule type | [Cell Value / Text Contains / Formula-based / Color Scale / Data Bars / Icon Set / Top-Bottom] |
| Condition / Formula | [Complete condition or formula, e.g., Cell value < 70 OR =AND($D2<TODAY(),$D2<>"")] |
| Background fill | [Color name] -- [#HEX] |
| Font color | [Color name] -- [#HEX] |
| Font style | [Bold / Italic / Regular] |
| Borders | [None / Bottom only: dark gray / All: light gray] |
| Stop if True | [Yes / No -- reason] |

**Excel setup:**
[Numbered steps for this specific rule]

**Google Sheets setup:**
[Numbered steps for this specific rule]

---

[Repeat for each rule]

---

### Color Legend

| Swatch | Background Hex | Font Hex | Meaning | Rule(s) Using It |
|--------|---------------|----------|---------|-----------------|
| [Name] | #XXXXXX | #XXXXXX | [Semantic meaning] | Rule [N] |

---

### Formula Reference (Formula-Based Rules Only)

| Rule | Full Formula | Reference Type | What It Tests |
|------|-------------|---------------|---------------|
| [Rule name] | `=[formula]` | Column-locked ($E2) / Range-locked ($E$2:$E$500) | [Plain English explanation] |

---

### Priority Execution Table

| Priority | Rule Name | Condition Summary | Applies To | Stop if True |
|----------|-----------|-------------------|-----------|-------------|
| 1 | [name] | [short description] | [range] | Yes / No |
| 2 | [name] | [short description] | [range] | Yes / No |
| ... | | | | |

---

### Platform-Specific Setup Instructions

#### Excel Setup Sequence
1. [Step-by-step ordered instructions]
2. [Continue for all rules]
3. [Final step: verify priority in Manage Rules dialog]

#### Google Sheets Setup Sequence
1. [Step-by-step ordered instructions]
2. [Continue for all rules]
3. [Final step: verify rule order in sidebar]

---

### Performance Notes
[Any notes on large dataset behavior, volatile functions like TODAY(), COUNTIF overhead, etc.]

### Accessibility Notes
[Any notes on colorblind accommodation, contrast ratios, icon set supplements]
```

---

## Rules

1. **Always specify exact hex codes for both background fill AND font color -- never describe a color as just "green" or "red."** The hex code is what gets entered in the format dialog. Without it, the user makes arbitrary choices that break consistency across reports.

2. **Always define rule priority as explicit integers starting at 1 for highest priority.** When two rules can match the same cell, the winner is determined entirely by priority. Omitting priority order is the single most common source of conditional formatting bugs.

3. **Use formula-based rules any time the condition references a different column than the one being formatted.** Cell value rules only compare a cell to itself. If the Status column determines the Revenue column's color, that requires a formula.

4. **In formula-based rules applied to multi-column ranges, lock the column, never the row: `=$E2` not `=$E$2`.** The row must float so each row checks its own corresponding cell in the condition column. Using `=$E$2` causes every row to check only row 2's value -- a classic and hard-to-debug mistake.

5. **When using TODAY() or NOW() in conditional formatting formulas, warn the user that these are volatile functions** -- they recalculate every time the spreadsheet is opened or edited. On large datasets (20,000+ rows), this can cause noticeable lag. For static deadline comparisons on large files, consider pre-calculating a helper column instead.

6. **For traffic-light systems, always get explicit numeric thresholds before writing rules.** "Green if good, red if bad" is not a specification. The thresholds must be numbers or text values: "Green if >= 90%, Yellow if 70-89%, Red if < 70%." If the user does not know the thresholds, ask -- do not invent them.

7. **Limit conditional formatting to 5 or fewer rules per range in Excel.** Microsoft's own guidance notes that more than 5-7 rules per range on large datasets degrades recalculation performance significantly. If the user needs more conditions, suggest consolidating with nested IF formulas into a helper column that CF rules can reference.

8. **For Color Scale rules, always specify the minimum value, midpoint value (if 3-color), and maximum value explicitly** -- do not leave them at "Automatic/Lowest/Highest." "Automatic" means the scale recalibrates when data changes, which causes the same absolute value to appear different colors at different times. Pin the min/max to actual business thresholds.

9. **When an entire row needs formatting based on one cell, apply the formula rule to the entire data table range, not just the triggering column.** Common mistake: applying `=$F2="Behind"` only to column F. It must apply to `$A$2:$H$500` (all columns) with the formula referencing `$F2` (column locked, row floating) so the entire row highlights.

10. **For duplicate detection formulas using COUNTIF, always lock the entire range but not the individual cell:** `=COUNTIF($A$2:$A$500,$A2)>1`. Locking only the range (`$A$2:$A$500`) ensures the count covers all data. The cell reference `$A2` must float on the row so each cell checks its own value against the full range.

11. **In Google Sheets, "Stop If True" does not exist in the UI.** To achieve mutual exclusivity in Google Sheets, rules must be written so conditions cannot simultaneously be true (e.g., three text-equals rules for three distinct status values are inherently mutually exclusive). Warn users migrating Excel files to Google Sheets that Stop If True behavior will not transfer.

12. **Never apply conflicting formats to the same range with the same priority.** If two rules have no priority order assigned and can both be true simultaneously, behavior is undefined. Every rule set must have a clear winner for every possible data value in the target range.

---

## Edge Cases

### Entire Row Highlighting Based on One Column's Value
The most common conditional formatting request and the most commonly misconfigured. The formula `=$F2="Critical"` must be applied to the range `$A$2:$H$500` (all columns in the data table), not just column F. The `$` before `F` locks the column so that every cell in every column of a given row checks column F's value for that row. The absence of `$` before the row number lets the row reference increment as the rule evaluates each row. If the user accidentally applies the rule only to column F, only column F highlights -- the other columns remain unformatted. If they use `=$F$2`, all rows check only row 2's value.

### Overlapping Numeric Threshold Rules Producing Unexpected Colors
When three rules define red (< 70), yellow (< 90), and green (>= 90) without Stop If True, a cell with value 50 matches BOTH the red rule AND the yellow rule. Without Stop If True on the red rule, the color that wins is whichever rule has higher priority -- but if priority is unset, Excel defaults to the most recently added rule winning. Solution: Set Stop If True on every specific-value rule, ordered from most restrictive to least. Red at priority 1 with Stop If True ensures that a cell below 70 never evaluates the yellow or green rules.

### Color Scale Applied to a Range with Blank Cells
Blank cells in a Color Scale range are included in the min/max calculation in Excel but display no color. In Google Sheets, blanks are treated as 0 and pull the entire scale toward the minimum, making all non-zero values appear artificially high. Solution: Set the minimum value in the Color Scale to the actual data minimum (not "Automatic/Lowest") or apply a separate rule at priority 1 that highlights blanks with a neutral gray and uses Stop If True -- this prevents blank cells from entering the gradient evaluation. Alternatively, filter the Color Scale range to exclude known blank rows.

### Conditional Formatting in Excel Tables (ListObject Tables)
When data is inside a formal Excel Table (Insert > Table), conditional formatting ranges must be specified as column references within the table, or they will not auto-expand when new rows are added. Use the column reference notation like `Table1[Revenue]` in the "Applies to" box instead of `$E$2:$E$500`. This ensures that as new rows are appended to the table, the CF rule automatically covers them. For formula-based rules in tables, the first cell reference in the formula must still match the first cell of the column (e.g., `=$E2` for column E starting at row 2). Non-table ranges do not auto-expand -- if the user's data will grow, expand the range well beyond current data (e.g., apply to row 2:10000 even if data only reaches row 100 today).

### Copying Conditional Formatting to Another Sheet or Workbook
When a user copies a range with conditional formatting to another sheet or workbook using Paste Special > Formats Only (or equivalent), the range references in the rule often shift or break. In Excel, the "Applies to" field may update to point to the source sheet. After pasting, the user must open Manage Rules on the destination sheet and verify all range references are correct. Formula-based rules that used absolute references (`$E$2:$E$500`) will carry the absolute reference to the new location, which is correct. Formula-based rules that referenced named ranges pointing to the source sheet must be rewritten. Best practice: after any copy-paste of CF rules, always open Manage Rules and audit every rule's "Applies to" field.

### Performance Degradation on Large Datasets
COUNTIF, COUNTIFS, and SUMIF inside conditional formatting formulas recalculate for every cell in the applied range on every change event. On a dataset of 50,000 rows with a COUNTIF duplicate-detection rule, this means 50,000 × COUNTIF evaluations per recalculation cycle -- noticeable lag on most hardware. Mitigation strategies:
- Pre-calculate COUNTIF results in a helper column (e.g., column Z) and apply a simple cell-value rule (`>1`) against the helper column instead.
- Use Excel's "Manual Calculation" mode (Formulas > Calculation Options > Manual) while setting up rules on large files, then switch back to Automatic.
- For TODAY() comparisons on large files, pre-calculate the date comparison result in a helper column as a TRUE/FALSE value and apply a `=$Z2=TRUE` rule.

### Conditional Formatting Not Applying After Data Paste
When a user pastes data over a conditionally formatted range using standard Ctrl+V, Excel pastes the source format along with the data, overwriting the conditional formatting rules. The CF rules may still exist in the Manage Rules dialog but appear not to work because the pasted cell format (a static format) takes visual precedence over the conditional format. Solution: Always paste data using Paste Special > Values Only (Ctrl+Shift+V in Excel, or Ctrl+Alt+V then V in the dialog). If formatting is already corrupted, select the range, clear all formatting (Home > Clear > Clear Formats), then reapply the conditional formatting rules.

### Accessibility and Colorblind Users
Red-green color blindness (deuteranopia and protanopia) affects approximately 8% of men and 0.5% of women. A pure red/green traffic light system is invisible to these users. When accessibility is required:
- Supplement color with icon sets (add a flag, checkmark, or X icon alongside the color fill).
- Substitute the colorblind-safe pair: Blue `#1F77B4` (background `#CCE5FF`, font `#003D80`) for positive and Orange `#FF7F0E` (background `#FFE5CC`, font `#8B3A00`) for negative.
- Ensure sufficient contrast: WCAG AA requires 4.5:1 contrast ratio for normal text, 3:1 for large text. The standard Excel traffic light combinations (background #FFC7CE / font #9C0006, etc.) all exceed 4.5:1.
- In Excel, add an icon set rule in addition to color fills -- icons communicate status to colorblind users and in black-and-white print.

---

## Example

**Input:** "I manage a project tracker in Excel. It has columns A (Project ID), B (Project Name), C (Owner), D (Due Date), E (% Complete), and F (Status -- text values 'On Track', 'At Risk', 'Overdue'). I want three things: 1) Color-code entire rows based on the Status column. 2) Highlight % Complete cells below 50% in red if their due date is within the next 14 days. 3) Add a data bar to the % Complete column. The data currently goes to row 200 but grows over time."

---

## Conditional Formatting Specification

### Overview
- **Target range(s):**
  - `$A$2:$F$500` -- entire data table (row-level status coloring, future-proofed to row 500)
  - `$E$2:$E$500` -- % Complete column (at-risk highlight, data bars)
- **Platform:** Excel 365
- **Number of rules:** 5
- **Purpose:** Communicate project health at a glance -- highlight overdue and at-risk projects by row, flag incomplete projects with approaching deadlines, and show relative progress via in-cell bars.
- **Color system:** Traffic light (rows) + alert highlight (% Complete) + data bars

---

### Rule Set

#### Rule 1: Overdue Row Highlight -- Priority 1

| Attribute | Specification |
|-----------|---------------|
| Applies to | `$A$2:$F$500` |
| Rule type | Formula-based |
| Condition / Formula | `=$F2="Overdue"` |
| Background fill | Light Red -- #FFC7CE |
| Font color | Dark Red -- #9C0006 |
| Font style | Bold |
| Borders | None |
| Stop if True | Yes -- prevents At Risk and On Track rules from also applying to this row |

**Excel setup:**
1. Select `$A$2:$F$500`
2. Home > Conditional Formatting > New Rule > "Use a formula to determine which cells to format"
3. Formula: `=$F2="Overdue"`
4. Click Format > Fill tab > enter hex `FFC7CE` in the "More Colors" dialog > OK
5. Click Format > Font tab > Color: enter hex `9C0006` > check Bold > OK
6. Click OK to save rule

**Google Sheets setup:**
1. Select A2:F500
2. Format > Conditional formatting > "Custom formula is"
3. Formula: `=$F2="Overdue"`
4. Fill color: #FFC7CE | Text color: #9C0006 | Bold: enabled
5. Click Done

---

#### Rule 2: At Risk Row Highlight -- Priority 2

| Attribute | Specification |
|-----------|---------------|
| Applies to | `$A$2:$F$500` |
| Rule type | Formula-based |
| Condition / Formula | `=$F2="At Risk"` |
| Background fill | Light Yellow -- #FFEB9C |
| Font color | Dark Yellow/Amber -- #9C6500 |
| Font style | Bold |
| Borders | None |
| Stop if True | Yes -- prevents On Track rule from applying to At Risk rows |

**Excel setup:**
1. Select `$A$2:$F$500`
2. Home > Conditional Formatting > New Rule > "Use a formula to determine which cells to format"
3. Formula: `=$F2="At Risk"`
4. Fill: hex `FFEB9C` | Font color: hex `9C6500` | Bold
5. Click OK

---

#### Rule 3: On Track Row Highlight -- Priority 3

| Attribute | Specification |
|-----------|---------------|
| Applies to | `$A$2:$F$500` |
| Rule type | Formula-based |
| Condition / Formula | `=$F2="On Track"` |
| Background fill | Light Green -- #C6EFCE |
| Font color | Dark Green -- #006100 |
| Font style | Regular |
| Borders | None |
| Stop if True | Yes -- no lower-priority row rules exist, but set as a best practice |

**Excel setup:**
1. Select `$A$2:$F$500`
2. Home > Conditional Formatting > New Rule > "Use a formula to determine which cells to format"
3. Formula: `=$F2="On Track"`
4. Fill: hex `C6EFCE` | Font color: hex `006100` | Regular weight
5. Click OK

---

#### Rule 4: At-Risk Completion Alert (% Complete < 50% with Due Date in next 14 days) -- Priority 4

| Attribute | Specification |
|-----------|---------------|
| Applies to | `$E$2:$E$500` |
| Rule type | Formula-based |
| Condition / Formula | `=AND($E2<0.5,$D2>=TODAY(),$D2<=TODAY()+14)` |
| Background fill | Dark Orange -- #FF6600 |
| Font color | White -- #FFFFFF |
| Font style | Bold |
| Borders | None |
| Stop if True | No -- this applies to column E only; it does not conflict with the row rules on columns A-D and F |

**Notes on this formula:**
- `$E2<0.5` -- checks that % Complete is below 50% (assumes values stored as decimals 0.0-1.0; use `<50` if stored as whole numbers like 75)
- `$D2>=TODAY()` -- excludes already-past due dates (those are covered by the Overdue row rule)
- `$D2<=TODAY()+14` -- limits to projects due within 14 days
- `$D2<>""` is not included because the AND function already requires D2 to satisfy date comparisons, which blank cells fail naturally

**Excel setup:**
1. Select `$E$2:$E$500`
2. Home > Conditional Formatting > New Rule > "Use a formula to determine which cells to format"
3. Formula: `=AND($E2<0.5,$D2>=TODAY(),$D2<=TODAY()+14)`
4. Fill: hex `FF6600` | Font color: hex `FFFFFF` | Bold
5. Click OK

---

#### Rule 5: % Complete Data Bars -- Priority 5

| Attribute | Specification |
|-----------|---------------|
| Applies to | `$E$2:$E$500` |
| Rule type | Data Bars |
| Minimum value | Number -- 0 (pinned, not Automatic) |
| Maximum value | Number -- 1 (pinned, representing 100%; use 100 if stored as whole numbers) |
| Bar color | Solid fill -- Steel Blue #4472C4 |
| Border | Solid border -- Medium Blue #2E4D8C |
| Bar direction | Left to right |
| Show bar only | No -- show number AND bar |
| Stop if True | N/A (Data Bars rule type does not use Stop if True) |

**Why pin min/max to 0 and 1:** If left at "Automatic," Excel sets the shortest bar at the current minimum value in the range. A column where the lowest completion is 40% would show a full-length bar for 40%, making all projects look more complete than they are. Pinning 0 and 1 ensures the bar length accurately represents absolute progress from 0% to 100%.

**Excel setup:**
1. Select `$E$2:$E$500`
2. Home > Conditional Formatting > Data Bars > More Rules
3. Minimum type: Number, Value: 0
4. Maximum type: Number, Value: 1
5. Fill: Solid Fill, Color: hex `4472C4`
6. Border: Solid Border, Color: hex `2E4D8C`
7. Bar direction: Context (left to right)
8. Uncheck "Show Bar Only" to display both the number and the bar
9. Click OK

---

### Color Legend

| Swatch | Background Hex | Font Hex | Meaning | Rule(s) |
|--------|---------------|----------|---------|---------|
| Light Red | #FFC7CE | #9C0006 | Overdue -- immediate action required | Rule 1 |
| Light Yellow | #FFEB9C | #9C6500 | At Risk -- monitor and intervene | Rule 2 |
| Light Green | #C6EFCE | #006100 | On Track -- healthy project | Rule 3 |
| Dark Orange | #FF6600 | #FFFFFF | At-Risk Completion: < 50% done, due within 14 days | Rule 4 |
| Steel Blue | #4472C4 | -- | Data bar fill: relative % complete | Rule 5 |

---

### Formula Reference

| Rule | Full Formula | Reference Type | What It Tests |
|------|-------------|---------------|---------------|
| Rule 1 | `=$F2="Overdue"` | Column-locked ($F2) | Status column equals "Overdue" -- evaluates per row |
| Rule 2 | `=$F2="At Risk"` | Column-locked ($F2) | Status column equals "At Risk" -- evaluates per row |
| Rule 3 | `=$F2="On Track"` | Column-locked ($F2) | Status column equals "On Track" -- evaluates per row |
| Rule 4 | `=AND($E2<0.5,$D2>=TODAY(),$D2<=TODAY()+14)` | Column-locked ($E2, $D2) | % complete below 50% AND due date is within the next 14 days |

---

### Priority Execution Table

| Priority | Rule Name | Condition Summary | Applies To | Stop if True |
|----------|-----------|-------------------|-----------|-------------|
| 1 | Overdue Row Highlight | F = "Overdue" | $A$2:$F$500 | Yes |
| 2 | At Risk Row Highlight | F = "At Risk" | $A$2:$F$500 | Yes |
| 3 | On Track Row Highlight | F = "On Track" | $A$2:$F$500 | Yes |
| 4 | At-Risk Completion Alert | E < 50% AND D within 14 days | $E$2:$E$500 | No |
| 5 | % Complete Data Bars | All non-blank values | $E$2:$E$500 | N/A |

**Priority rationale:** Rules 1-3 share the same range and are mutually exclusive text matches, so priority order determines which color applies to any given row. Stop If True on Rules 1-3 ensures that once a row matches "Overdue," it does not also evaluate "At Risk" or "On Track." Rule 4 applies to a different range (column E only) so it does not conflict with Rules 1-3. Rule 5 (data bars) coexists with Rule 4 -- Excel renders both the data bar and the Rule 4 fill color simultaneously on the same cell when both conditions are met, which is intentional.

---

### Platform-Specific Setup Instructions

#### Excel Setup Sequence
1. Open the workbook. Confirm % Complete values are stored as decimals (0.0-1.0) or whole numbers (0-100) -- this affects Rule 4's threshold (0.5 vs. 50) and Rule 5's max value (1 vs. 100).
2. Select `$A$2:$F$500`. Home > Conditional Formatting > New Rule. Add Rule 1 (Overdue, formula `=$F2="Overdue"`, fill #FFC7CE, font #9C0006, Bold). OK.
3. With `$A$2:$F$500` still selected, add Rule 2 (At Risk, formula `=$F2="At Risk"`, fill #FFEB9C, font #9C6500, Bold). OK.
4. With `$A$2:$F$500` still selected, add Rule 3 (On Track, formula `=$F2="On Track"`, fill #C6EFCE, font #006100, Regular). OK.
5. Select `$E$2:$E$500`. Add Rule 4 (formula `=AND($E2<0.5,$D2>=TODAY(),$D2<=TODAY()+14)`, fill #FF6600, font #FFFFFF, Bold). OK.
6. With `$E$2:$E$500` still selected, add Rule 5 (Data Bars > More Rules, solid fill #4472C4, min = Number 0, max = Number 1). OK.
7. With `$E$2:$E$500` selected, open Home > Conditional Formatting > Manage Rules. Confirm Rule 4 appears above Rule 5. If not, select Rule 4 and use the up arrow to move it above Rule 5.
8. With `$A$2:$F$500` selected, open Manage Rules. Confirm Rules 1, 2, 3 appear in that order from top to bottom. Enable "Stop If True" checkbox on Rules 1, 2, and 3.
9. Click Apply then OK. Test by typing "Overdue" in cell F5 -- row 5 should turn red. Type "At Risk" in F6 -- row 6 turns yellow. Type a decimal below 0.5 in E7 and a date within 14 days in D7 -- E7 should turn orange.

#### Google Sheets Setup Sequence
1. Select A2:F500. Format > Conditional formatting.
2. In the sidebar, click "Add another rule." Rule type: "Custom formula is." Formula: `=$F2="On Track"`. Fill: #C6EFCE. Text: #006100. Done. (Add least-priority rules first in Sheets -- they will be reordered next.)
3. Add another rule. Formula: `=$F2="At Risk"`. Fill: #FFEB9C. Text: #9C6500. Bold. Done.
4. Add another rule. Formula: `=$F2="Overdue"`. Fill: #FFC7CE. Text: #9C0006. Bold. Done.
5. In the sidebar, drag the "Overdue" rule to the top, "At Risk" second, "On Track" third.
6. Select E2:E500. Add rule. Custom formula: `=AND($E2<0.5,$D2>=TODAY(),$D2<=TODAY()+14)`. Fill: #FF6600. Text: #FFFFFF. Bold. Done.
7. Note: Google Sheets does not support native data bars. As a substitute, add a SPARKLINE column or use the built-in "Gradient" color scale on column E: Format > Conditional formatting > Color scale, with min = 0 (color #FFFFFF), max = 1 (color #4472C4).
8. Verify rule order in the sidebar: Overdue on top, At Risk second, On Track third, At-Risk Alert on E column.

---

### Performance Notes
- Rules 1-3 use simple text comparison formulas -- negligible performance impact at 500 rows.
- Rule 4 contains `TODAY()` which is a volatile function recalculating on every edit. At 500 rows this is imperceptible. If the sheet grows beyond 10,000 rows, pre-calculate the 14-day window in a helper column (e.g., column G: `=AND(E2<0.5,D2>=TODAY(),D2<=TODAY()+14)`) and change Rule 4 to a simple cell-value rule on column G (`=$G2=TRUE`), then hide column G.
- Data Bars (Rule 5) with pinned min/max are static and do not recalculate -- no performance concern.

### Accessibility Notes
- The red/green combination in Rules 1 and 3 is distinguishable by most colorblind users because the yellow (Rule 2) provides a middle separator. However, for full accessibility, consider adding an Icon Set rule to column F: a red X for Overdue, yellow exclamation for At Risk, green checkmark for On Track. This supplements color with shape-based encoding.
- All three traffic light color pairs used here (#FFC7CE/#9C0006, #FFEB9C/#9C6500, #C6EFCE/#006100) exceed WCAG AA contrast requirements for normal-weight text at standard spreadsheet font sizes (10-12pt).
- The orange/white combination in Rule 4 (#FF6600/#FFFFFF) has a contrast ratio of approximately 3.1:1 -- adequate for large bold text but marginal for small text. If accessibility is a strict requirement, darken the orange to #CC5200 (ratio 4.6:1).
