---
name: excel-lookup-formulas
description: |
  Produces working Excel/Sheets lookup formulas for specific use cases. Generates exact VLOOKUP, HLOOKUP, INDEX/MATCH, and XLOOKUP formula strings with error handling wrappers, exact vs. approximate match settings, and performance guidance.
  Use when the user needs to look up values across spreadsheet tables, match data between sheets, or build cross-reference formulas.
  Do NOT use for pivot table construction (use pivot-table-builder), data cleaning formulas (use spreadsheet-data-cleaning), or conditional formatting rules (use conditional-formatting-rules).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "spreadsheets data-science template"
  category: "data-analysis"
  subcategory: "spreadsheets"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Excel Lookup Formulas

## When to Use

**Use this skill when:**
- The user needs to pull a value from one table into another based on a matching key -- for example, joining employee IDs to salaries, product codes to descriptions, or order numbers to customer names
- The user explicitly asks how to use VLOOKUP, HLOOKUP, INDEX/MATCH, XLOOKUP, or any combination of these functions
- The user wants to replace a broken or slow VLOOKUP with a more robust alternative and needs guidance on which formula fits their structure
- The user needs a two-dimensional lookup -- finding the intersection of a row match and a column match, such as a price matrix or a schedule grid
- The user needs to match on multiple criteria simultaneously -- for example, matching both region AND product to return a sales figure
- The user's lookup column is to the LEFT of the return column and VLOOKUP is failing them
- The user is building a dashboard or report that auto-populates fields from a separate data table, and they need a formula that updates dynamically as source data changes
- The user needs case-sensitive matching, wildcard matching, or approximate match for bracket-based lookups (tax brackets, discount tiers, shipping weight bands)

**Do NOT use when:**
- The user wants to summarize data by grouping, aggregating, or pivoting -- use `pivot-table-builder` instead
- The user wants to clean, normalize, or transform raw data values -- use `spreadsheet-data-cleaning` instead
- The user wants to highlight cells based on conditions -- use `conditional-formatting-rules` instead
- The user wants to write SQL JOINs, Python pandas merges, or R data frame joins -- redirect to software-development skills
- The user needs conditional aggregation across multiple matches (SUMIFS, COUNTIFS, AVERAGEIFS are the correct tools for counting or summing all matches, not lookup formulas)
- The user needs to return ALL matching rows from a table, not just the first match -- this is a FILTER function task (Excel 365/Google Sheets) or a pivot-level task
- The user asks about data validation dropdowns that populate dependent lists -- this is a `data-validation-rules` skill even though lookups are sometimes involved

---

## Process

### Step 1 -- Gather the Structural Information

Before writing a single formula, collect precise details from the user. Misunderstanding any one of these causes the wrong formula to be generated.

- **Lookup value:** What cell or value is being searched? Get the exact cell reference (e.g., A2) and what that cell contains conceptually (product ID, employee number, region name). Confirm whether the lookup value is a number, text, or date -- type mismatches are the #1 cause of lookup failures.
- **Lookup range (search column):** Which column or row is being searched? Get the sheet name and column reference (e.g., Sheet2!A:A). Ask whether this column is the leftmost, rightmost, or somewhere in the middle of the table -- this determines whether VLOOKUP is even viable.
- **Return range (what to return):** What value does the user want back? Get the column reference. Calculate the column index number relative to the leftmost column of the table (critical for VLOOKUP's `col_index_num` argument).
- **Match type:** Ask explicitly. Exact match is correct for codes, IDs, names, and most lookups. Approximate match (ascending-sorted data) is correct for bracket lookups -- tax rates by income, discount tiers by quantity ordered, shipping rates by weight.
- **Error behavior:** What should appear when a match is not found? Common choices: blank cell (`""`), literal text (`"Not Found"`, `"N/A"`, `"Unknown"`), or zero (`0` for numeric contexts). The choice matters for downstream SUM or COUNT formulas.
- **Excel version or platform:** XLOOKUP requires Excel 365 or Excel 2021+. It is also available in Google Sheets. VLOOKUP and INDEX/MATCH work in Excel 2003 through 365 and in Google Sheets. Confirm version before recommending XLOOKUP as the primary solution.

---

### Step 2 -- Diagnose the Structural Situation and Choose the Right Formula

Use this decision framework precisely. Choosing the wrong formula wastes the user's time and produces brittle results.

| Structural Situation | Recommended Formula | Why This Formula |
|---|---|---|
| Return column is to the RIGHT of lookup column, user is on Excel 2019 or older | VLOOKUP | Simplest syntax, universally familiar, no array requirement |
| Return column is to the LEFT of the lookup column | INDEX/MATCH or XLOOKUP | VLOOKUP structurally cannot look left -- col_index_num cannot be negative |
| User needs to return a value from a horizontal (row-oriented) table | HLOOKUP | Same mechanics as VLOOKUP but scans rows instead of columns; row_index_num works identically to col_index_num |
| User is on Excel 365 or Excel 2021+ and comfort with modern functions is confirmed | XLOOKUP | Replaces VLOOKUP/HLOOKUP with a single function; handles left lookup, built-in error handling, exact match default, supports wildcard and approximate modes natively |
| User needs row AND column lookup simultaneously | INDEX/MATCH/MATCH | Two nested MATCH functions find the row number and column number; INDEX returns the cell at their intersection |
| User needs to match on two or more criteria simultaneously | INDEX/MATCH with concatenation (legacy) or XLOOKUP with array criteria (365) | VLOOKUP and single-criteria MATCH cannot evaluate two conditions natively |
| User needs approximate match / bracket lookup | VLOOKUP with TRUE or MATCH with 1/-1 | Table must be sorted ascending for TRUE/1 or descending for -1; returns the largest value that is less than or equal to the lookup value |
| Lookup value may contain leading/trailing spaces or inconsistent casing | Any formula wrapped with TRIM/LOWER | Normalization prevents the most common silent mismatch failures |

**Key structural test to run mentally before selecting:** Count from the left edge of the table_array to the return column. If the return column is column 1 of the range (i.e., it is to the LEFT of the lookup column), VLOOKUP is disqualified immediately.

---

### Step 3 -- Build the Core Formula with Correct Syntax

Write out every argument explicitly. Never abbreviate or skip optional arguments -- ambiguity causes user error.

**VLOOKUP -- Full Syntax:**
```
=VLOOKUP(lookup_value, table_array, col_index_num, range_lookup)
```
- `lookup_value` -- The cell or value to find. Use relative row reference (A2) so it adjusts when copied down. If the lookup value is text that should be normalized, wrap it: `TRIM(LOWER(A2))`.
- `table_array` -- The rectangular range containing both the lookup column and the return column. The lookup column MUST be the leftmost column of this range. Lock this range with absolute references: `$A$1:$D$500` or `Sheet2!$A:$D`. If the table is on another sheet, prefix it: `Sheet2!$A:$D`.
- `col_index_num` -- An integer. Count from the LEFT edge of `table_array`. If table_array starts at column A and the return value is in column D, col_index_num is 4. This is relative to the range, not the sheet -- if table_array starts at column C, then column E is col_index_num 3.
- `range_lookup` -- Always specify explicitly. `FALSE` (or `0`) for exact match. `TRUE` (or `1`) for approximate match. Never omit this argument -- Excel defaults to TRUE which causes silent wrong answers when the table is not sorted.

**INDEX/MATCH -- Full Syntax:**
```
=INDEX(return_range, MATCH(lookup_value, lookup_range, match_type))
```
- `return_range` -- The single column (or row) containing the values to return. Can be anywhere on the sheet or another sheet. Lock with absolute references: `Sheet2!$C:$C`.
- `MATCH(lookup_value, lookup_range, match_type)` -- Returns the row number (position) of the match within `lookup_range`. `match_type` of 0 = exact match (nearly always correct). 1 = find largest value ≤ lookup_value (table must be sorted ascending). -1 = find smallest value ≥ lookup_value (table must be sorted descending).
- The `return_range` and `lookup_range` must span the same number of rows and be aligned -- if the lookup column has a header in row 1, the return column must also start at row 1.

**XLOOKUP -- Full Syntax:**
```
=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode])
```
- `lookup_value` -- The search key. Supports wildcards natively when `match_mode` is 2.
- `lookup_array` -- The single column or row to search. Unlike VLOOKUP, this does NOT have to be the leftmost column of any table -- it can be any column, any position.
- `return_array` -- The column or row to return values from. Can be to the left, right, above, or below the lookup array. Can also be a multi-column range -- XLOOKUP will spill multiple results.
- `if_not_found` -- The value to return when no match exists. `"Not Found"`, `""`, or `0` are typical choices. If omitted, XLOOKUP returns #N/A on no match.
- `match_mode` -- 0 = exact match (default). -1 = exact match or next smaller. 1 = exact match or next larger. 2 = wildcard match (*, ?, ~).
- `search_mode` -- 1 = first to last (default). -1 = last to first (use when you want the LAST match instead of the first). 2 = binary search ascending (faster on sorted large datasets). -2 = binary search descending.

**HLOOKUP -- Full Syntax (horizontal tables):**
```
=HLOOKUP(lookup_value, table_array, row_index_num, range_lookup)
```
- Identical mechanics to VLOOKUP but searches the TOP ROW of table_array instead of the left column. `row_index_num` counts rows down from the top of the range. Use when data is organized with categories in a header row and values in rows below.

---

### Step 4 -- Handle the Left-Lookup Scenario Explicitly

This is the most common situation where VLOOKUP fails users. If the return column is to the left of the lookup column, follow this decision path:

- **INDEX/MATCH solution:** Specify the return column range and the lookup column range independently. Example: lookup is in column C, return value is in column A -- `=INDEX(Sheet2!$A:$A, MATCH(B2, Sheet2!$C:$C, 0))`. The ranges are independent so direction is irrelevant.
- **XLOOKUP solution (365+):** The `lookup_array` and `return_array` are always specified independently, so left-lookup requires no special technique -- `=XLOOKUP(B2, Sheet2!$C:$C, Sheet2!$A:$A, "Not Found")`.
- Explicitly tell the user: "VLOOKUP can only return columns to the RIGHT of the lookup column because it uses a positional integer (col_index_num) that must be ≥ 1. There is no workaround -- use INDEX/MATCH or XLOOKUP."

---

### Step 5 -- Add Error Handling

Every lookup formula delivered to a user must include an error wrapper. Unhandled #N/A errors cascade into SUM formulas (returning an error instead of a sum), AVERAGE formulas, and conditional formatting rules. They also confuse end users who are not formula-literate.

**IFERROR (broadest catch -- recommended for production use):**
```
=IFERROR(VLOOKUP(A2, Sheet2!$A:$D, 3, FALSE), "Not Found")
```
Catches all errors including #N/A, #VALUE!, #REF!, #DIV/0!. Use this when you want the formula to never show an error to the end user regardless of what goes wrong.

**IFNA (narrow catch -- recommended for debugging):**
```
=IFNA(VLOOKUP(A2, Sheet2!$A:$D, 3, FALSE), "Not Found")
```
Catches ONLY #N/A. Lets #VALUE!, #REF!, and #DIV/0! pass through as visible errors. This is better during development because a #REF! error means the range is wrong -- IFERROR would silently hide it.

**XLOOKUP built-in handling:**
The `if_not_found` argument of XLOOKUP makes an outer IFERROR redundant for #N/A cases. However, wrapping with IFERROR is still appropriate if the lookup_array or return_array could be invalid.

**Return value choice for error handler:**
- Use `""` (empty string) when the cell should appear blank and downstream formulas use COUNTIF or SUMIF (they ignore blank cells).
- Use `0` when the cell is summed or averaged and a missing value is legitimately zero.
- Use `"Not Found"` or `"Unknown"` when the cell is displayed to an end user and a missing value should be visually obvious.
- Use `"--"` in dashboard contexts where an empty-looking cell should still be visually distinct from a cell that was never populated.
- Never use `#N/A` as the return value -- it defeats the purpose of error handling.

---

### Step 6 -- Handle Multi-Criteria Lookups

Single-column lookup formulas fail when the user needs to match on two or more fields (e.g., match both "Region" AND "Product" to return a sales figure).

**Concatenation method (all Excel versions):**
```
=IFERROR(INDEX(Sheet2!$C:$C, MATCH(A2&B2, Sheet2!$A:$A&Sheet2!$B:$B, 0)), "Not Found")
```
This must be entered as a **Ctrl+Shift+Enter array formula** in Excel 2019 and earlier, which wraps it in `{ }` braces. In Excel 365 and Google Sheets, array entry is automatic -- press Enter normally.

- `A2&B2` concatenates the two lookup values into a single composite key (e.g., "EastWidget" from "East" and "Widget").
- `Sheet2!$A:$A&Sheet2!$B:$B` concatenates the two lookup columns into the same composite key format.
- Both sides must concatenate in the same order and with the same delimiter (if used). If two values could overlap ambiguously -- e.g., "East" + "Widget" = "EastWidget" is the same as "Eas" + "tWidget" -- add a delimiter: `A2&"|"&B2` and `Sheet2!$A:$A&"|"&Sheet2!$B:$B`.

**XLOOKUP array criteria method (Excel 365+):**
```
=XLOOKUP(1, (Sheet2!$A:$A=A2)*(Sheet2!$B:$B=B2), Sheet2!$C:$C, "Not Found")
```
Each condition evaluates to an array of 1s and 0s. Multiplying them together creates a single array where only rows matching ALL conditions equal 1. XLOOKUP searches for the value 1 in this computed array. This is cleaner than concatenation and avoids delimiter collision issues.

---

### Step 7 -- Apply Approximate Match for Bracket Lookups

Approximate match is not a common lookup pattern, but it is the correct tool for tax brackets, discount tiers, shipping weight bands, and credit score ranges.

- The lookup table MUST be sorted in ASCENDING order by the search column (for VLOOKUP TRUE or MATCH type 1).
- Approximate match returns the largest table entry that is ≤ the lookup value.
- Example: A discount tier table has thresholds 0, 10, 50, 100 in column A with discount rates in column B. VLOOKUP of quantity 35 returns the rate for row 3 (threshold 10) because 10 is the largest value ≤ 35.

```
=VLOOKUP(D2, DiscountTiers!$A:$B, 2, TRUE)
```

**Critical warning:** If the table is not sorted ascending, approximate match will return random wrong answers with no error message. The formula will silently produce incorrect results. Always verify sort order when using approximate match.

---

### Step 8 -- Provide Performance Guidance for Large Datasets

For datasets below 5,000 rows, performance differences between formula types are negligible. Above 10,000 rows, formula choice and range specification materially affect recalculation speed.

- **Full column references (A:A) vs. bounded ranges (A1:A50000):** Full column references force Excel to evaluate all 1,048,576 rows in the column during recalculation. On a table with 15,000 actual rows, specify `$A$1:$D$15000` instead of `$A:$D`. This can reduce recalculation time by 40-60% on large workbooks.
- **VLOOKUP vs. INDEX/MATCH speed:** VLOOKUP must load the entire `table_array` into memory for each formula evaluation. INDEX/MATCH loads only the `lookup_range` for the MATCH scan, then retrieves a single cell via INDEX. On datasets above 50,000 rows, INDEX/MATCH is measurably faster -- typically 15-30% faster in tests with 100,000+ row tables.
- **XLOOKUP on large datasets:** Use `search_mode` of 2 (binary search) when the lookup column is sorted ascending. Binary search on a 100,000-row table requires at most 17 comparisons (log₂ of 100,000 ≈ 17) vs. a linear scan of up to 100,000 comparisons. This is the single largest performance gain available in lookup formulas.
- **Volatile functions inside lookup arguments:** Avoid wrapping lookup values in volatile functions like NOW(), TODAY(), RAND(), or INDIRECT() -- these trigger full workbook recalculation on every keystroke.
- **Array formulas (multi-criteria concatenation):** Ctrl+Shift+Enter array formulas on full column references are among the heaviest formula types in Excel. Always use bounded ranges for multi-criteria array formulas.
- **Structured table references:** If the source data is formatted as an Excel Table (Insert > Table, or Ctrl+T), use structured references: `=VLOOKUP(A2, ProductCatalog[#All], 3, FALSE)`. These auto-expand when rows are added without requiring range updates.

---

## Output Format

Deliver the formula solution using this complete structure. Every section must be populated -- do not omit sections because a formula is simple.

```
## Lookup Formula Solution

### Requirement Summary
| Parameter | Value |
|---|---|
| Lookup value | [Cell reference and what it represents, e.g., A2 (Product ID)] |
| Lookup column | [Sheet and column, e.g., Sheet2!A:A] |
| Return column | [Sheet and column, e.g., Sheet2!C:C] |
| Return column position | [Relative position from left edge of table, e.g., 3rd column of Sheet2!A:C] |
| Match type | [Exact / Approximate ascending / Approximate descending] |
| Error behavior | [What to show when no match found] |
| Excel version | [365 / 2021 / 2019 / 2016 / Google Sheets] |

---

### Primary Formula

**Paste into cell [target cell reference]:**
```excel
=[complete formula string -- every argument filled in with real values]
```

**How it works:**
- `[argument 1]` -- [what this specific value does in this specific formula]
- `[argument 2]` -- [what this specific value does in this specific formula]
- `[argument 3]` -- [what this specific value does in this specific formula]
- `[if_not_found/IFERROR value]` -- [what happens when the lookup fails]

---

### Alternative Formula

**[Formula name] version (use when [specific condition]):**
```excel
=[alternative complete formula string]
```
[One sentence explaining the key structural difference and when to prefer this version]

---

### Modern Formula (if Excel 365/2021+ or Google Sheets)

```excel
=[XLOOKUP complete formula string]
```
[Note any advantages this version provides over the primary formula for this specific use case]

---

### Multi-Copy Instructions

To apply this formula to all rows:
- [Paste into the first data cell, e.g., B2]
- [Drag the fill handle down, or double-click it to auto-fill to the last row]
- [Lock references that must not shift: which references use $ and why]

---

### Performance Notes

- **Dataset size:** [Small / Medium / Large -- with threshold justification]
- **Range recommendation:** [Specific range recommendation, e.g., use $A$1:$C$5000 instead of $A:$C because...]
- **Recalculation impact:** [Low / Medium / High and why]
- **Optimization available:** [Yes/No and what it is, e.g., switch to XLOOKUP binary search if table is sorted]
```

---

## Rules

1. **Always write the complete, paste-ready formula** -- never describe what a formula should look like without writing it out with real cell references, real sheet names, and real argument values from the user's described layout. Abstract formulas with placeholder names like `lookup_col` or `return_range` are only acceptable as a secondary explanation alongside the real formula.

2. **Always include an error handling wrapper** -- every formula delivered must be wrapped in IFERROR or IFNA, or use XLOOKUP's `if_not_found` argument. An unwrapped #N/A in a cell that feeds a SUM formula turns the entire SUM into #N/A. This is the most damaging downstream effect of bare lookup formulas.

3. **Always specify range_lookup explicitly in VLOOKUP** -- never omit the fourth argument. Excel's default is TRUE (approximate match), which silently returns wrong answers when the table is not sorted ascending. Writing `FALSE` explicitly is non-negotiable even if it feels redundant.

4. **Never recommend VLOOKUP for left-lookup situations** -- if the return column is to the left of the lookup column, do not suggest "restructure your data" as the primary solution. Deliver an INDEX/MATCH or XLOOKUP formula immediately. Only mention data restructuring as an optional long-term improvement.

5. **Count col_index_num relative to the table_array left edge, not the sheet** -- if the user's table starts in column D and the return value is in column G, col_index_num is 4 (D=1, E=2, F=3, G=4), not 7. State this counting explicitly to prevent off-by-one errors, which produce the wrong column of data with no error message.

6. **Distinguish IFERROR from IFNA and recommend the right one** -- during development or debugging, recommend IFNA so that #REF! and #VALUE! errors remain visible. For production formulas delivered to end users, recommend IFERROR for clean output. Never conflate the two.

7. **Flag approximate match data requirements explicitly** -- whenever the user requests an approximate/bracket lookup, state clearly that the lookup column MUST be sorted in ascending order and verify this with the user before delivering the formula. Silent wrong answers from unsorted approximate match are harder to detect than errors.

8. **For multi-criteria lookups, warn about delimiter collision** -- when using the concatenation method (`A2&B2`), always add a delimiter that cannot appear in the data (e.g., `"|"` or `"~"`) to prevent false matches where "East"+"Widget" equals "Eas"+"tWidget". Failure to add a delimiter is a subtle bug that only manifests with specific data combinations.

9. **State version compatibility explicitly for every formula recommended** -- XLOOKUP: Excel 365/2021+ and Google Sheets only. FILTER: Excel 365/2021+ and Google Sheets only. Dynamic array spill behavior: Excel 365/2021+ only. VLOOKUP, HLOOKUP, INDEX/MATCH: all Excel versions from 2003+, all Google Sheets versions.

10. **Lock source table references with absolute addressing** -- any range reference to a source table that will be copied down or across must use `$` anchors on both the column and row (e.g., `Sheet2!$A$1:$D$500` or `Sheet2!$A:$D`). Unlocked references shift when the formula is copied, causing #REF! errors in rows below the first or incorrect column references in adjacent columns. The lookup_value cell reference (e.g., A2) should remain relative so it adjusts correctly when copied down.

11. **When returning numeric values, confirm the data type in the source column** -- if the source column stores numbers as text (indicated by left-alignment, green triangle warnings, or TEXT function origin), VLOOKUP will return a text-formatted number that will not sum correctly. Warn the user and provide the VALUE() wrapper: `=IFERROR(VALUE(VLOOKUP(A2, Sheet2!$A:$D, 3, FALSE)), 0)`.

12. **Never use HLOOKUP as the primary recommendation without confirming table orientation** -- most users have vertically oriented tables and mean VLOOKUP when they describe row-based lookup. Ask about table layout before assuming horizontal orientation.

---

## Edge Cases

### Return Column is to the LEFT of the Lookup Column
VLOOKUP structurally cannot return values from columns to the left of its lookup column because `col_index_num` must be a positive integer ≥ 1, and position 1 is always the leftmost column of `table_array`. There is no VLOOKUP workaround. Deliver INDEX/MATCH immediately:
```excel
=IFERROR(INDEX(Sheet2!$A:$A, MATCH(B2, Sheet2!$C:$C, 0)), "Not Found")
```
Explanation to user: "VLOOKUP's col_index_num counts rightward from the start of your table range. If the column you want to return is to the left of the column you're searching, the count would need to be zero or negative, which VLOOKUP does not support. INDEX/MATCH avoids this entirely because the lookup range and return range are specified as separate, independent arguments."

---

### Lookup Value Contains Leading/Trailing Spaces or Extra Internal Spaces
This is the most common cause of lookup formulas returning #N/A when the user insists "the value is definitely there." A product ID of "A102 " (trailing space) will not match "A102" even though they look identical in a cell. Handle with TRIM:
```excel
=IFERROR(VLOOKUP(TRIM(A2), Sheet2!$A:$D, 3, FALSE), "Not Found")
```
For extra internal spaces (multiple spaces between words), use TRIM combined with SUBSTITUTE:
```excel
=IFERROR(VLOOKUP(TRIM(SUBSTITUTE(A2, " ", " ")), Sheet2!$A:$D, 3, FALSE), "Not Found")
```
Also recommend trimming the source column in Sheet2: `=TRIM(A2)` copied to a helper column, then paste-as-values to replace the original. Note that TRIM removes leading and trailing spaces and collapses internal multiple spaces to single spaces -- this is usually the desired behavior.

---

### Duplicate Lookup Values in the Source Table
VLOOKUP, INDEX/MATCH, and XLOOKUP (with default search_mode 1) all return only the FIRST match in the table. If the source table has duplicate keys, the formula silently returns one result and ignores others. Provide guidance based on what the user actually needs:

- **If they want the LAST match:** `=XLOOKUP(A2, Sheet2!$A:$A, Sheet2!$C:$C, "Not Found", 0, -1)` -- set `search_mode` to -1 to search last to first.
- **If they want a SUM of all matching values:** SUMIF is the correct tool, not a lookup: `=SUMIF(Sheet2!$A:$A, A2, Sheet2!$C:$C)`.
- **If they want a COUNT of matches:** `=COUNTIF(Sheet2!$A:$A, A2)`.
- **If they want ALL matching rows returned:** FILTER function (Excel 365/Google Sheets): `=FILTER(Sheet2!$A:$C, Sheet2!$A:$A=A2, "No Match")`.
- Warn the user explicitly: "Lookup formulas are designed for tables with unique keys. If your source table has duplicate entries for the same lookup value and you want all of them, you should use SUMIF/COUNTIF for aggregation, or FILTER to retrieve all matching rows."

---

### Case-Sensitive Matching Required
VLOOKUP, MATCH, and XLOOKUP are case-insensitive by default. "apple", "Apple", and "APPLE" are treated as identical. This is a problem when lookup keys are case-sensitive codes or passwords. Solution using EXACT function:
```excel
=IFERROR(INDEX(Sheet2!$B:$B, MATCH(TRUE, EXACT(A2, Sheet2!$A:$A), 0)), "Not Found")
```
- In Excel 2019 and earlier, this must be entered as an **array formula** with Ctrl+Shift+Enter.
- In Excel 365 and Google Sheets, press Enter normally (dynamic array support handles it).
- The EXACT function returns TRUE only when both the value AND the case match exactly. MATCH then finds the first TRUE in the resulting array.
- XLOOKUP does not natively support case-sensitive matching -- INDEX/MATCH/EXACT is the universal solution for this requirement.

---

### Two-Dimensional Lookup (Row AND Column Intersection)
When the user has a matrix -- for example, a pricing grid where rows are products and columns are regions -- they need to look up both a row value and a column value simultaneously. INDEX/MATCH/MATCH is the correct formula:
```excel
=IFERROR(INDEX(Sheet2!$B$2:$F$10, MATCH(A2, Sheet2!$A$2:$A$10, 0), MATCH(B2, Sheet2!$B$1:$F$1, 0)), "Not Found")
```
- First MATCH finds the row position: `MATCH(A2, Sheet2!$A$2:$A$10, 0)` -- searches the row headers (left column) for the row lookup value.
- Second MATCH finds the column position: `MATCH(B2, Sheet2!$B$1:$F$1, 0)` -- searches the column headers (top row) for the column lookup value.
- INDEX returns the value at the intersection: the data range `$B$2:$F$10` excludes the headers -- it is purely the data body.
- Critical: The data range must exclude the header row and header column. If headers are included in the INDEX range, the row and column offsets will be off by one, returning values from the wrong row/column.

---

### Wildcard Lookup (Partial Text Match)
Sometimes the user needs to look up a partial string -- for example, finding a customer record when only part of their name is known, or matching product codes that share a prefix.

**VLOOKUP with wildcard:**
```excel
=IFERROR(VLOOKUP("*"&A2&"*", Sheet2!$A:$D, 3, FALSE), "Not Found")
```
The `*` wildcard matches any sequence of characters before or after the search string. Use `?` to match exactly one character.

**INDEX/MATCH with wildcard:**
```excel
=IFERROR(INDEX(Sheet2!$C:$C, MATCH("*"&A2&"*", Sheet2!$A:$A, 0)), "Not Found")
```

**XLOOKUP with wildcard (cleaner syntax):**
```excel
=XLOOKUP("*"&A2&"*", Sheet2!$A:$A, Sheet2!$C:$C, "Not Found", 2)
```
Set `match_mode` to 2 to enable wildcard matching in XLOOKUP.

**Warning:** Wildcard lookups return the first match. If multiple rows contain the partial string, only one result is returned. Inform the user and suggest FILTER for multi-result wildcard retrieval.

---

### Numbers Stored as Text (Type Mismatch Failure)
This is the second most common cause of lookup #N/A after whitespace issues. A cell that looks like `1042` but is stored as text will not match a lookup value of `1042` stored as a number. The cell will show a small green triangle in the upper-left corner in Excel, or will be left-aligned rather than right-aligned.

Detection: If the formula returns #N/A but the value clearly exists in the table, check alignment of both cells. Text is left-aligned; numbers are right-aligned by default.

**Fix for text-formatted numbers in the lookup value cell:**
```excel
=IFERROR(VLOOKUP(VALUE(A2), Sheet2!$A:$D, 3, FALSE), "Not Found")
```

**Fix for text-formatted numbers in the lookup column of the source table:**
```excel
=IFERROR(VLOOKUP(TEXT(A2, "0"), Sheet2!$A:$D, 3, FALSE), "Not Found")
```
This converts the numeric lookup value to text to match the text-formatted source column. Confirm which side of the mismatch has the wrong type before applying the fix.

**Long-term recommendation:** Fix the source data type rather than compensating in the formula. Use Data > Text to Columns on the source column (select the column, go to Data > Text to Columns, click Finish immediately) to force Excel to re-evaluate the data type.

---

## Example

**Input:** "I manage a sales report. Sheet1 has all our orders -- column A has Order ID, column B has Sales Rep ID, and I want to add the Sales Rep's full name in column C and their region in column D. The rep directory is on Sheet2 -- column A is Sales Rep ID, column B is Full Name, column C is Region, column D is Manager. I'm using Excel 2019. Some orders might have Sales Rep IDs that aren't in the directory yet (new reps not yet added), and I want those to show 'Pending Assignment' instead of an error."

---

## Lookup Formula Solution

### Requirement Summary
| Parameter | Value |
|---|---|
| Lookup value | B2 (Sales Rep ID on Sheet1) |
| Lookup column | Sheet2!$A:$A (Sales Rep ID directory) |
| Return column -- Name | Sheet2!$B:$B (Full Name -- 2nd column of Sheet2!$A:$D) |
| Return column -- Region | Sheet2!$C:$C (Region -- 3rd column of Sheet2!$A:$D) |
| Return column position | Name = col_index_num 2; Region = col_index_num 3 (counting from left edge of Sheet2!$A:$D) |
| Match type | Exact match -- Sales Rep IDs are discrete codes, not ranges |
| Error behavior | "Pending Assignment" when Sales Rep ID is not found in directory |
| Excel version | Excel 2019 -- XLOOKUP is NOT available; use VLOOKUP or INDEX/MATCH |

---

### Primary Formula -- Sales Rep Full Name (Sheet1 column C)

**Paste into Sheet1 cell C2:**
```excel
=IFERROR(VLOOKUP(B2, Sheet2!$A:$D, 2, FALSE), "Pending Assignment")
```

**How it works:**
- `B2` -- Takes the Sales Rep ID from the current row in column B; uses a relative row reference so it adjusts to C3, C4, etc. when copied down
- `Sheet2!$A:$D` -- Searches the rep directory on Sheet2, columns A through D; the `$` signs lock this range so it does not shift when the formula is copied
- `2` -- Returns the value from the 2nd column of the range Sheet2!$A:$D, which is column B (Full Name); counted as: A=1, B=2
- `FALSE` -- Requires an exact match on the Sales Rep ID; without this, Excel would use approximate match and could silently return the wrong rep's name
- `IFERROR(..., "Pending Assignment")` -- If the Sales Rep ID from column B does not exist anywhere in Sheet2!$A:$A, the cell shows "Pending Assignment" instead of a #N/A error

---

### Primary Formula -- Region (Sheet1 column D)

**Paste into Sheet1 cell D2:**
```excel
=IFERROR(VLOOKUP(B2, Sheet2!$A:$D, 3, FALSE), "Pending Assignment")
```

**How it works:**
- `B2` -- Same Sales Rep ID lookup value as the name formula
- `Sheet2!$A:$D` -- Same locked source range
- `3` -- Returns the value from the 3rd column of the range Sheet2!$A:$D, which is column C (Region); counted as: A=1, B=2, C=3
- `FALSE` -- Exact match required
- `IFERROR(..., "Pending Assignment")` -- Same error handling; a rep whose ID is missing from the directory will show "Pending Assignment" in both the name column and the region column, making it easy to filter and identify all unmatched orders

---

### Alternative Formula -- INDEX/MATCH Version

**Use when you need more flexibility or if the Sales Rep ID column moves away from being the leftmost column in Sheet2:**

Full Name (Sheet1 column C):
```excel
=IFERROR(INDEX(Sheet2!$B:$B, MATCH(B2, Sheet2!$A:$A, 0)), "Pending Assignment")
```

Region (Sheet1 column D):
```excel
=IFERROR(INDEX(Sheet2!$C:$C, MATCH(B2, Sheet2!$A:$A, 0)), "Pending Assignment")
```

**Key difference:** INDEX/MATCH specifies the return column and lookup column independently. If someone inserts a column in Sheet2 between A and B, the VLOOKUP formula would silently return data from the wrong column (because col_index_num 2 would now point to the newly inserted column). The INDEX/MATCH formula uses column references directly, so it automatically follows the correct column regardless of insertions.

---

### Note on XLOOKUP (Not Available in Excel 2019)

If you ever upgrade to Excel 365 or Excel 2021, the equivalent formula for Full Name would be:
```excel
=XLOOKUP(B2, Sheet2!$A:$A, Sheet2!$B:$B, "Pending Assignment")
```

And for Region:
```excel
=XLOOKUP(B2, Sheet2!$A:$A, Sheet2!$C:$C, "Pending Assignment")
```

XLOOKUP is cleaner because the error handling is built into the fourth argument -- no outer IFERROR wrapper is needed.

---

### Multi-Copy Instructions

- Paste the Full Name formula into **Sheet1!C2** and the Region formula into **Sheet1!D2**
- Select both C2 and D2 together, then drag the fill handle (the small square in the lower-right corner of the selection) down to the last row of orders
- Alternatively, double-click the fill handle to auto-fill to the last contiguous row in column B
- The `B2` reference in each formula will automatically adjust to B3, B4, B5, etc. -- this works because `B2` is a relative reference (no `$` signs)
- The `Sheet2!$A:$D` range will NOT shift -- the `$` signs keep it locked to the same source table regardless of which row the formula is in

---

### Performance Notes

- **Dataset size:** If Sheet1 has fewer than 10,000 order rows, full column references (`$A:$D`) are acceptable and convenient. Above 10,000 rows, specify a bounded range: replace `Sheet2!$A:$D` with `Sheet2!$A$1:$D$5000` (or whatever the actual last row of the directory is) to reduce recalculation overhead.
- **Recalculation impact:** Low to medium. Two VLOOKUP formulas per row on 10,000 rows = 20,000 formula evaluations on each recalculate cycle. With bounded ranges, this is fast. With full column references on a large workbook, it can cause noticeable lag.
- **Optimization available:** If the rep directory on Sheet2 is ever sorted ascending by Sales Rep ID (column A), both formulas can be marginally sped up by switching to INDEX/MATCH with MATCH type 1 (approximate match on sorted data returns faster than a linear scan). However, for exact-match requirements on a directory of typical size (< 1,000 reps), this optimization is unnecessary.
- **Structured table recommendation:** If Sheet2 is formatted as an Excel Table named `RepDirectory`, use: `=IFERROR(VLOOKUP(B2, RepDirectory, 2, FALSE), "Pending Assignment")`. The table reference auto-expands when new reps are added, eliminating the need to update range references manually.
