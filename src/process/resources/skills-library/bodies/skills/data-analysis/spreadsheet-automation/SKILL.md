---
name: spreadsheet-automation
description: |
  Designs spreadsheet automation using built-in features including named ranges, drop-down validation lists, INDIRECT references for dynamic ranges, array formulas, and QUERY/FILTER functions. Produces the specific formula strings for self-updating, self-validating spreadsheets.
  Use when the user wants to make their spreadsheet more automated, dynamic, or self-maintaining without VBA or scripts.
  Do NOT use for data validation rule design (use data-validation-setup), data cleaning formulas (use spreadsheet-data-cleaning), or Google Apps Script programming (software-development scope).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "spreadsheets automation template"
  category: "data-analysis"
  subcategory: "spreadsheets"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Spreadsheet Automation

## When to Use

**Use this skill when:**
- The user wants a spreadsheet that recalculates summaries, rankings, or filtered views automatically when source data changes -- without manual copy-paste or formula dragging
- The user asks "how do I avoid updating this manually every month?" or "how do I make this formula expand automatically when I add rows?"
- The user wants cascading dropdown lists that control what other dropdowns, charts, or summary tables display
- The user needs to build a self-service dashboard where non-technical users can select parameters (region, date range, product category) and the spreadsheet responds without requiring formula knowledge
- The user wants to consolidate data from multiple sheets into a single summary using formulas rather than manual aggregation
- The user wants a report template that works for January and February without any formula changes -- just data entry
- The user's spreadsheet currently requires a human to update pivot tables, refresh lists, or adjust formula ranges every time data is added
- The user has interdependent data structures -- where changing one cell should trigger updates across multiple dependent sections simultaneously

**Do NOT use when:**
- The user wants to design data entry rules such as rejecting numbers outside a range or enforcing text format -- use the `data-validation-setup` skill instead
- The user wants to clean, deduplicate, or standardize existing raw data using formulas -- use the `spreadsheet-data-cleaning` skill instead
- The user wants to write Google Apps Script, VBA macros, or Python to automate spreadsheet actions -- those are software development tasks outside this skill's scope
- The user is building a multi-tab financial model with projection logic, scenario toggles, and DCF structures -- use the `financial-model-template` skill instead
- The user needs database-grade ETL, scheduled data refresh from APIs, or warehouse connections -- recommend Power Query or dedicated ETL tooling instead
- The user needs a form that collects data from external respondents -- that is form design, not spreadsheet automation
- The automation requires looping, conditional branching across many rows, or anything that would naturally be a `for` loop in code -- that threshold signals a scripting need, not a formula need

---

## Process

### Step 1: Diagnose the Manual Pain Point

Before writing any formula, understand exactly what the user does manually today and what triggers the repetition.

- Ask: "What do you do every time new data arrives? What cells or ranges do you update by hand?"
- Ask: "What is the trigger -- new data added, a date changes, someone selects a new filter value, or a monthly reset?"
- Distinguish between **parameter-driven automation** (user selects a value and results change) and **data-driven automation** (more rows arrive and formulas should capture them automatically) -- the techniques differ substantially
- Ask: "Are you using Excel or Google Sheets, and what version?" -- this is not optional. Excel 365 with dynamic arrays is a fundamentally different capability than Excel 2016. The answer determines which of at least three formula families are available
- Ask: "How many rows of data are we dealing with?" -- under 10,000 rows, dynamic array functions are fine; 10,000--100,000 rows requires careful formula scoping; above 100,000 rows, recommend Power Query for transformation and reserve formulas only for the summary layer
- Identify every place in the workbook that currently has a hardcoded row count (e.g., `A2:A500`) -- these are the automation failures waiting to happen

### Step 2: Classify the Automation Techniques Required

Map each manual pain point to a specific technique category. Multiple techniques often combine in one solution.

**Technique Classification Matrix:**

| Manual Pain Point | Automation Technique | Core Tool |
|---|---|---|
| Dragging formulas down when rows are added | Structured Excel Table (Ctrl+T) | Table column references `[ColumnName]` |
| Updating range boundaries in formulas | Dynamic named range | OFFSET+COUNTA or Table reference |
| Manually filtering to a category | FILTER function (365/Sheets) | `=FILTER(array, include, [if_empty])` |
| Running subtotals for different selections | SUMIFS / COUNTIFS / AVERAGEIFS | Multi-criteria aggregation |
| Extracting a unique list from a column | UNIQUE function (365/Sheets) | `=UNIQUE(range)` |
| Sorting output automatically | SORT / SORTBY | `=SORT(range, sort_index, order)` |
| Querying with SQL-like logic (Sheets only) | QUERY | `=QUERY(range, "SELECT...")` |
| Making a formula reference a sheet by name from a cell value | INDIRECT | `=INDIRECT("'"&A2&"'!B2:B100")` |
| Cascading dropdowns (child list depends on parent choice) | INDIRECT + named ranges | Named range per parent value |
| Rank-based retrieval (e.g., top 5 products) | LARGE / SMALL + INDEX/MATCH | `=INDEX(range, MATCH(LARGE(...), ..., 0))` |
| Cross-sheet lookup that stays current | INDEX/MATCH or XLOOKUP | `=XLOOKUP(lookup, lookup_range, return_range)` |

Apply this matrix to every manual action the user described. Produce a prioritized list: start with the highest-frequency pain (the thing they do most often) and automate that first.

### Step 3: Design the Data Structure Before Writing Formulas

Bad data structure makes automation impossible. Before any formula, verify or establish the following:

- **Source data must be in a flat table** -- one row per record, one piece of information per column, no merged cells, no summary rows interspersed with detail rows, no blank rows in the middle of data
- **Convert source data to an Excel Table** (Ctrl+T in Excel, or simply treat as a structured range in Sheets): Tables auto-expand, give columns named references like `Table1[Revenue]`, and eliminate range-boundary formulas entirely
- **Separate layers explicitly:**
  - Layer 1 -- Raw data (the table, never modified by formulas, only by data entry)
  - Layer 2 -- Parameter controls (dropdown cells, date selectors, toggle cells)
  - Layer 3 -- Calculation layer (intermediate FILTER/UNIQUE outputs, if needed)
  - Layer 4 -- Display/summary layer (what the user sees)
- **Name every key range and parameter cell** before writing formulas -- formulas written first and named ranges added later create inconsistency
- Identify whether any columns need helper status columns (e.g., a combined key column like `=A2&"|"&B2` for multi-column MATCH) and add those to the table before beginning

### Step 4: Build Named Ranges and Parameter Controls

Named ranges are the connective tissue of spreadsheet automation. Build them before formulas.

- **Naming convention:** Use PascalCase with no spaces: `SalesData`, `RegionList`, `SelectedRegion`, `DateRangeStart`. Underscores are acceptable: `Product_List`
- **For Excel Tables,** use structured references directly: `SalesTable[Region]` -- these are already named and auto-expanding; no additional Name Manager entry is needed for the column itself
- **For dynamic named ranges in legacy Excel (pre-365),** use OFFSET+COUNTA to create expanding ranges:
  ```
  =OFFSET(Sheet1!$A$2, 0, 0, COUNTA(Sheet1!$A:$A)-1, 1)
  ```
  This defines a range starting at A2, expanding downward to match the count of non-blank cells in column A (minus 1 for the header)
- **For parameter cells** (the cells users interact with), use single-cell named ranges: name cell G2 as `SelectedRegion`. Then formulas throughout the workbook can reference `SelectedRegion` instead of `Sheet2!$G$2`, and the formula remains valid if the dashboard tab is renamed
- **For dropdown source lists** that must be dynamic (new options appear as data grows), use `=SORT(UNIQUE(SalesTable[Region]))` placed in a helper range, then name that helper range as `RegionList`
- In Excel, create names via Formulas > Name Manager > New. In Google Sheets, use Data > Named ranges. In both, verify scope -- workbook-level names are preferable to sheet-level unless multiple sheets have legitimately different ranges with the same logical name

### Step 5: Build and Test Core Automation Formulas

This is where the actual formulas are constructed. Build in dependency order: foundational references first, derived formulas second, display formulas last.

**For FILTER-based automation (Excel 365 / Google Sheets):**
```
=IFERROR(FILTER(SalesTable[Product], SalesTable[Region]=SelectedRegion), "No data for selected region")
```
- FILTER spills results automatically -- it does not need to be dragged. Place it once in the top-left cell of the output area
- Multiple conditions use multiplication (AND logic): `=FILTER(range, (col1=val1)*(col2=val2), "No results")`
- Multiple conditions using OR logic use addition: `=FILTER(range, (col1=val1)+(col1=val2), "No results")`
- Always include the third argument (if_empty) to prevent #CALC! errors when no rows match

**For SUMIFS-based automation (works in all Excel versions and Sheets):**
```
=IFERROR(SUMIFS(SalesTable[Revenue], SalesTable[Region], SelectedRegion, SalesTable[Product], F5), 0)
```
- SUMIFS handles multiple criteria without array entry
- Use absolute references for the criteria range and criteria value when dragging formulas; use mixed references for the criteria itself when the criterion comes from a list being traversed
- AVERAGEIFS and COUNTIFS follow the exact same argument pattern: `=COUNTIFS(criteria_range1, criteria1, criteria_range2, criteria2)`

**For INDIRECT-driven dynamic references:**
```
=IFERROR(INDIRECT("'"&SelectedSheet&"'!"&"B2:B"&COUNTA(INDIRECT("'"&SelectedSheet&"'!B:B"))), "Invalid sheet")
```
- Always wrap INDIRECT in IFERROR -- if the referenced sheet is deleted, renamed, or the workbook is closed, INDIRECT returns #REF! with no warning otherwise
- Single quotes around the sheet name handle sheets with spaces: `"'"&SheetName&"'!A1"` is correct; `SheetName&"!A1"` fails if SheetName contains a space
- INDIRECT is volatile -- it recalculates on every workbook change, not just when its dependencies change. In workbooks with hundreds of INDIRECT calls, this causes visible slowdown. Minimize to essential uses only

**For cascading dropdowns:**
- Create a named range for each parent value, named exactly as the parent value appears in the first dropdown. If parent values are "North", "South", "East", "West", create named ranges with those exact names containing the respective child lists
- Second dropdown data validation source: `=INDIRECT(ParentCell)` where ParentCell is the named range or direct reference to the first dropdown's cell
- If parent values contain spaces, replace spaces with underscores in the named range name AND transform the cell value with SUBSTITUTE: `=INDIRECT(SUBSTITUTE(G2," ","_"))`

**For pre-365 Excel without FILTER or UNIQUE:**
- Unique list extraction: Use a helper column with `=IF(COUNTIF($B$2:B2,B2)=1,B2,"")` dragged down, then reference the non-blank values
- Conditional row extraction (simulating FILTER): Use an INDEX/MATCH+IFERROR pattern with a helper rank column, or use AGGREGATE with function number 15 (SMALL with ignore errors) for a compact approach:
  ```
  Helper column C2: =IF(B2=SelectedRegion, ROW(B2), "")
  Result formula:   =IFERROR(INDEX($A$2:$A$1000, MATCH(SMALL($C$2:$C$1000, ROW()-ROW($F$5)+1), $C$2:$C$1000, 0)-1), "")
  ```

### Step 6: Build the User Interface Layer

The summary or dashboard area the user actually interacts with must be designed for clarity and resilience.

- **Separate control cells from output cells visually** -- use background color, borders, or a clearly labeled "Controls" section. A common layout: controls in columns A--B, output in columns D--K, helper/calculation columns hidden in M--Z
- **Label every dropdown cell explicitly** -- put "Select Region:" in the cell to the left of the dropdown, not just in a comment or documentation
- **Use data validation on parameter cells** to limit input to valid options -- even if a dropdown exists, users sometimes type directly into cells, breaking INDIRECT references. Restrict the cell to the list source
- **Add conditional formatting to the output range** to highlight zero-value rows (e.g., format rows where the revenue cell = 0 with grey text to signal no data, rather than leaving a confusing 0)
- **Protect formula cells** if the workbook will be shared with non-technical users: Review > Protect Sheet (Excel) or Data > Protect sheets and ranges (Sheets). Lock all formula cells; leave only input/dropdown cells unlocked
- Include a "Last Updated" indicator using `=TODAY()` or `=NOW()` in a header cell, labeled clearly. This reassures users that they are seeing current data

### Step 7: Validate, Stress-Test, and Document

Every automation must be verified against realistic failure conditions before delivery.

- **Test with zero matching results:** Change the dropdown to a value that matches no data. The formula should return the if_empty message, not #CALC!, #N/A, or #VALUE!
- **Test with a new data row:** Add a row to the bottom of the source table. Verify formulas capture it without range adjustment. If they do not, the source is not an Excel Table and must be converted or the named range must be made dynamic
- **Test with a deleted row:** Remove a row from the middle of source data. Verify no #REF! errors appear
- **Test with duplicate values in a unique-list formula:** If a new row adds a duplicate region, verify UNIQUE/SORT still produces one entry per value
- **Test the dropdown itself:** Rename a sheet, change a parent dropdown value, or intentionally break a reference. Confirm IFERROR catches it
- **Document the workbook** with a "README" tab containing: what each sheet does, which cells users should interact with, which cells are protected formulas, and what data format the source table expects. This is not optional for shared workbooks

---

## Output Format

```
## Spreadsheet Automation Design

### Summary
- **Platform:** [Excel 365 / Excel 2019 / Excel 2016 / Google Sheets]
- **Automation type:** [Parameter-driven / Data-driven / Both]
- **Source data structure:** [Table name or range, number of columns, approximate row count]
- **Trigger:** [What the user changes to drive updates]
- **Auto-updating outputs:** [Bullet list of what recalculates automatically]

---

### Data Structure Requirements

| Requirement | Status / Action |
|---|---|
| Flat table (one row per record) | [Already set up / Must restructure -- see note] |
| No merged cells in source range | [Confirmed / Remove merges in columns X, Y] |
| Converted to Excel Table (Ctrl+T) | [Yes, Table name: X / Recommended -- do this first] |
| No blank rows in middle of data | [Confirmed / Remove blanks in rows X--Y] |

**Note:** [Any structural changes required before formulas will work]

---

### Named Ranges

| Name | Scope | Reference | Purpose |
|---|---|---|---|
| [PascalCase name] | [Workbook / Sheet] | [Sheet!$A$2:$A$100 or Table1[Column]] | [What it represents] |
| [PascalCase name] | [Workbook / Sheet] | [Cell or range] | [What it represents] |

**Setup instructions:**
- Excel: Formulas tab > Name Manager > New > enter Name and Refers To
- Google Sheets: Data menu > Named ranges > + Add a range

---

### Parameter Controls (Dropdown Cells)

| Cell | Label (adjacent cell) | Named Range | Source Formula | Validation Type |
|---|---|---|---|---|
| [e.g., B2] | [e.g., "Select Region:"] | [e.g., SelectedRegion] | [e.g., =RegionList] | Data Validation > List |
| [cell] | [label] | [name] | [source] | Data Validation > List |

**Cascading dropdown note (if applicable):**
- Parent dropdown: [cell and named range]
- Child dropdown source formula: `=INDIRECT(SUBSTITUTE([ParentCell]," ","_"))`
- Named ranges required for child lists: [list each parent value and its corresponding named range name]

---

### Core Automation Formulas

#### Formula [N]: [Descriptive Title]
**Purpose:** [One sentence: what problem this solves]
**Cell:** [Exact cell reference, e.g., E5]
**Spills:** [Yes -- do not place other content in cells below/right / No -- drag down N rows]
**Platform:** [Excel 365 / Excel 2019+ / All versions / Google Sheets only]

```
[exact, paste-ready formula]
```

**Depends on:** [Named ranges, table columns, or cells this formula reads]
**Updates when:** [Specific trigger: dropdown changes, new row added, date changes]
**Error handling:** [What IFERROR returns if condition fails]

---

#### Formula [N+1]: [Descriptive Title]
**Purpose:** [One sentence]
**Cell:** [reference]
**Spills:** [Yes / No]
**Platform:** [compatibility]

```
[exact formula]
```

**Depends on:** [dependencies]
**Updates when:** [trigger]
**Error handling:** [fallback]

---

### Dynamic Range Setup

| Element | Technique | Formula or Feature |
|---|---|---|
| Auto-expanding source range | Excel Table | Structured reference: `TableName[ColumnName]` |
| Dynamic unique list | UNIQUE (365) or helper column | `=SORT(UNIQUE(TableName[Column]))` |
| Dynamic filtered output | FILTER (365) or INDEX/MATCH array | `=FILTER(...)` or legacy pattern |
| Dynamic row count | COUNTA-based OFFSET (legacy) | `=OFFSET($A$2,0,0,COUNTA($A:$A)-1,1)` |

---

### Compatibility Notes (if applicable)

| Feature Used | Excel 365 | Excel 2019 | Excel 2016 | Google Sheets |
|---|---|---|---|---|
| FILTER | Native | Not available | Not available | Native |
| UNIQUE | Native | Not available | Not available | Native |
| SORT / SORTBY | Native | Not available | Not available | SORT native |
| XLOOKUP | Native | Not available | Not available | Native |
| QUERY | Not available | Not available | Not available | Native |
| Dynamic arrays (spill) | Yes | No | No | Yes |

**Fallback formulas for legacy versions:** [Describe or list legacy alternatives]

---

### Performance Notes (if applicable)

- **Row count:** [Estimated rows in source data]
- **Volatile functions used:** [INDIRECT, OFFSET, NOW, TODAY -- list any]
- **Recommendation:** [Any performance considerations at this data size]

---

### Cell Protection Map

| Zone | Cells | Locked? | Reason |
|---|---|---|---|
| Parameter inputs | [cells] | No -- user modifies | Dropdown selections |
| Formula outputs | [cells] | Yes -- protect | Contains automation formulas |
| Source data table | [range] | No -- user enters data | Data entry area |
| Helper/calculation range | [cells] | Yes -- protect or hide | Intermediate calculations |

---

### User Instructions (for non-technical users)

1. [First action the user takes -- selecting a parameter, entering a date, etc.]
2. [What happens automatically as a result]
3. [Any second interaction step]
4. [What NOT to modify -- explicit cell references]
5. [How to add new data correctly -- which columns, what format]
6. [Who to contact if something shows an error]
```

---

## Rules

1. **Always provide paste-ready formulas, never pseudocode or descriptions.** Saying "use a SUMIFS formula to sum revenue by region" is useless. The formula `=IFERROR(SUMIFS(SalesTable[Revenue],SalesTable[Region],SelectedRegion,SalesTable[Product],F5),0)` is the deliverable. Every formula in the output must be syntactically correct and immediately usable.

2. **Ask for platform and version before writing any formula that uses FILTER, UNIQUE, SORT, XLOOKUP, or QUERY.** These functions are unavailable in Excel 2019 and earlier. Delivering an Excel 365 formula to an Excel 2016 user wastes their time and yours. If the user is unsure of their version, tell them to check: File > Account > About Excel (the version number appears there).

3. **Convert source data to an Excel Table before doing anything else.** A Table (Ctrl+T) is the single highest-leverage action in spreadsheet automation. It eliminates range-boundary maintenance, makes formulas readable with column names instead of cell references, and ensures every formula that references the table captures new rows without modification. Never build an automation on an unformatted range if the data will grow.

4. **Wrap every INDIRECT call in IFERROR.** INDIRECT returns #REF! when the target sheet is renamed, deleted, or the workbook is closed. This error propagates silently through dependent formulas and can corrupt apparent results without any obvious indication. `=IFERROR(INDIRECT(ref), "Reference unavailable")` is the minimum safe pattern.

5. **Wrap every FILTER call's if_empty argument.** `=FILTER(range, condition)` with no third argument returns #CALC! when zero rows match -- a confusing error for non-technical users. Always use `=FILTER(range, condition, "No results for selected criteria")` to replace the error with a clear message.

6. **Never use INDIRECT when a Table structured reference or named range achieves the same result.** INDIRECT is volatile -- it recalculates every time any cell in the workbook changes, not just when its inputs change. In a large workbook, dozens of volatile functions cause perceptible lag. Reserve INDIRECT specifically for cases where the reference itself must be constructed from cell values (cascading dropdowns, sheet-name-driven lookups).

7. **Named range names must not contain spaces.** Spaces in named range names cause INDIRECT references to fail silently. Use PascalCase (`RegionList`) or underscores (`Region_List`). When parent dropdown values contain spaces (e.g., "North America"), the named range for the child list must use underscores (`North_America`) and the INDIRECT formula must use SUBSTITUTE: `=INDIRECT(SUBSTITUTE(B2," ","_"))`.

8. **Size the formula scope to the data, not to an arbitrary large number.** Writing `=SUMIFS(A:A, B:B, "value")` on a sheet with 100,000 blank rows forces Excel to evaluate the entire column. On large sheets, scope to the actual data range using the Table reference or a COUNTA-derived count. The exception is Google Sheets, where full-column references (`A:A`) are generally acceptable and processed server-side.

9. **Protect formula cells before sharing.** Any workbook with automation formulas that will be used by non-technical users must have formula cells locked and sheet protection enabled. An accidental keystroke that overwrites a FILTER formula with a number silently breaks the automation -- there is no undo if the file has been saved and closed. Identify unlocked zones (input cells, dropdown cells, data entry rows) and lock everything else.

10. **Document the automation assumptions explicitly in the workbook.** At minimum, create a "Notes" cell block near the automation that states: (a) what column the dropdown list is driven from, (b) what happens when the user adds a new column to the source table, (c) which cells are formula-driven and must not be edited. Automation that works perfectly but is not documented will be "fixed" by the next person who touches it, breaking it in the process.

11. **Do not build automation on top of structural problems.** Merged cells, summary rows interspersed with data rows, multiple headers partway through a dataset, and inconsistent data types in a column will all cause FILTER, SUMIFS, and UNIQUE to return wrong answers without errors. Diagnose and flag these issues before providing formulas -- the formula is not the problem and fixing only the formula will not help.

12. **For cascading dropdowns, verify that every possible parent value has a corresponding named range.** If the parent list adds a new value (e.g., a new region "Pacific Northwest") but no named range exists for it, the child dropdown returns #REF! silently. Include a note in the user instructions: "When a new value is added to the parent list, a new named range must be created for it before the child dropdown will work."

---

## Edge Cases

### Edge Case 1: Excel Version Is Pre-365 (No Dynamic Arrays)

The user is on Excel 2016 or 2019, which has no FILTER, UNIQUE, SORT, XLOOKUP, or dynamic array spill behavior.

**Handling:**
- Replace UNIQUE with a helper column pattern: in column Z, enter `=IF(COUNTIF($B$2:B2,B2)=1,B2,"")` from Z2 downward. This flags the first occurrence of each value. The output list then uses `=IFERROR(INDEX($Z$2:$Z$500, MATCH(0, COUNTIF($F$4:F4, $Z$2:$Z$500) + ($Z$2:$Z$500=""), 0)), "")` entered as an array formula with Ctrl+Shift+Enter
- Replace FILTER with a helper column containing `=IF(B2=SelectedRegion, ROW(), "")` and then use `=IFERROR(INDEX($A$2:$A$1000, MATCH(SMALL($Z$2:$Z$1000, ROW()-ROW($H$2)+1), $Z$2:$Z$1000, 0)-1), "")` for each output row
- Replace XLOOKUP with `=IFERROR(INDEX(return_range, MATCH(lookup_value, lookup_range, 0)), "Not found")`
- Replace SORT with a helper column using `=RANK(value, range, order)` and then INDEX/MATCH against the rank
- Flag every legacy alternative clearly in the output so the user understands why the simpler formula was not used

### Edge Case 2: Source Data Is Split Across Multiple Sheets

The user has 12 monthly sheets (Jan, Feb, Mar, ...) with identical column structures and wants a summary that covers all of them.

**Handling:**
- For Google Sheets, use `=QUERY({Jan!A2:D500; Feb!A2:D500; Mar!A2:D500}, "SELECT Col2, SUM(Col4) WHERE Col2 = '"&SelectedRegion&"' GROUP BY Col2 LABEL SUM(Col4) 'Revenue'")` -- the curly braces with semicolons stack ranges vertically
- For Excel 365, use `=VSTACK(Jan!A2:D500, Feb!A2:D500, Mar!A2:D500)` to create a combined virtual table, then apply FILTER or SUMIFS against it
- For legacy Excel, recommend creating a dedicated consolidation sheet where data from each monthly sheet is manually appended or use Power Query (Get & Transform > Append Queries) to union all sheets automatically -- this is the correct tool for multi-sheet consolidation at scale
- Warn the user: INDIRECT to build sheet names dynamically (`=INDIRECT(A2&"!B2:B100")`) works in theory but creates one INDIRECT call per cell per sheet, which is volatile and slow. For more than 3--4 sheets, Power Query consolidation is always preferable

### Edge Case 3: Source Data Is in a Closed External Workbook

The user's source data lives in a separate workbook that is not always open, and they want formulas in a dashboard workbook to reference it.

**Handling:**
- Standard cell-reference links (`=[Source.xlsx]Sheet1!$A$2`) work when the source file is open but return stale cached values when closed -- this is often acceptable for read-only dashboards
- INDIRECT **cannot** reference closed workbooks under any circumstances. It returns #REF! the moment the source file is closed. Do not attempt to use INDIRECT for cross-workbook references
- For Google Sheets, use IMPORTRANGE: `=IMPORTRANGE("spreadsheet_id", "Sheet1!A2:D1000")` -- this maintains a live connection. Note that the user must authorize the connection the first time and the source spreadsheet must be accessible to the user's Google account
- For Excel, the correct solution is Power Query: Data > Get Data > From File > From Workbook. This creates a refreshable connection. Set refresh to "Refresh on file open" or schedule it. Power Query handles closed workbooks correctly and does not require INDIRECT
- Flag this limitation explicitly: tell the user that formula-based cross-workbook automation in Excel requires the source file to be open, and Power Query is the production-grade solution

### Edge Case 4: Very Large Dataset (100,000+ Rows)

The user has a source table with 100,000 or more rows and wants filter/summary automation on top of it.

**Handling:**
- FILTER on 100,000 rows causes noticeable recalculation delay -- users will see the screen flash on every dropdown change. Recommend moving data transformation to Power Query and using formulas only on the aggregated output (which will be far smaller)
- SUMIFS on full-column references (`A:A`) across 100,000 rows is measurably slower than scoped table references. Use `TableName[ColumnName]` structured references which scope automatically to the data
- Dynamic array functions that spill large results (e.g., a FILTER that returns 50,000 rows) consume significant memory and are not the right tool -- the output of a spilled array is meant to be consumed at a summary level
- Volatile functions (INDIRECT, OFFSET, NOW, TODAY) should be minimized to single instances when working with large datasets -- each volatile function triggers full recalculation of every dependent cell
- For 100,000+ rows, Power Query should handle: consolidation, filtering, grouping, and deduplication. Formulas should handle: final display formatting, user-driven parameters, and last-mile calculations on the aggregated output Power Query provides
- Recommend enabling manual calculation mode (Excel: Formulas > Calculation Options > Manual, recalculate with F9) if the user must use formulas on large data -- this prevents recalculation on every keystroke

### Edge Case 5: Dropdown Source List Must Update Automatically as New Options Are Added

The user adds a new region to their data occasionally and wants the dropdown list to include it automatically without manual maintenance.

**Handling:**
- In Excel 365, create a helper range with `=SORT(UNIQUE(SalesTable[Region]))` placed in a dedicated column (e.g., a "Lists" sheet, column A). This spills and auto-updates. Name this spilled range with `=OFFSET(Lists!$A$1,0,0,COUNTA(Lists!$A:$A),1)` -- or, more cleanly in 365, define the named range to reference the spill operator: `=Lists!$A$1#` (the `#` symbol references the entire spill range)
- The Data Validation source for the dropdown then uses `=RegionList` (the named range). When a new region appears in the source data, UNIQUE adds it, the spill expands, and the dropdown includes it on next open
- In Google Sheets, use `=SORT(UNIQUE(SalesTable!B2:B))` in a helper cell, then reference that range in the dropdown validation
- In legacy Excel (no UNIQUE), the dynamic dropdown requires a more complex OFFSET+COUNTA approach on a manually deduplicated list, which means the list itself is not truly automatic -- flag this limitation

### Edge Case 6: User Wants the Same Automation to Work in Both Excel and Google Sheets

A cross-platform workbook (e.g., a template shared with users on both platforms).

**Handling:**
- Common ground: SUMIFS, COUNTIFS, AVERAGEIFS, INDEX/MATCH, IFERROR, IF, LEFT/MID/RIGHT, TEXT, AND/OR all work identically in both platforms
- Excel-only (no Sheets equivalent): Power Query, XLOOKUP (Sheets now has it but behavior differs slightly), structured Table references (`TableName[Column]`), Ctrl+Shift+Enter array formulas
- Sheets-only: QUERY, IMPORTRANGE, ARRAYFORMULA (wraps a non-array formula to behave as an array formula across a range), `REGEXMATCH`/`REGEXEXTRACT`
- For FILTER: both Excel 365 and Google Sheets support it with identical syntax -- this is safe cross-platform if the user is on a modern Excel version
- For SORT: Excel uses `=SORT(range, sort_index, sort_order)` and Sheets uses `=SORT(range, sort_column, is_ascending)` -- functionally equivalent but note the third argument is a number (1 or -1) in Excel and TRUE/FALSE in Sheets
- Recommendation: build the primary version on the platform the user uses most, then provide a "cross-platform notes" section with substitutions for the other platform's users

### Edge Case 7: The Automation Breaks When the Sheet Tab Is Renamed

The user renames a sheet and suddenly multiple formulas show #REF!.

**Handling:**
- This is the core vulnerability of hardcoded sheet name references. `=Sheet1!A2` breaks if Sheet1 is renamed to "Sales Data"
- The fix is to never hardcode sheet names in formulas -- use named ranges defined at workbook scope. A workbook-scoped named range like `SalesData = Sheet1!$A$2:$D$500` continues to resolve correctly even if Sheet1 is renamed, because the Name Manager tracks the sheet by internal ID, not name
- For INDIRECT-based sheet references, the sheet name is just a string -- renaming breaks it immediately and IFERROR will suppress the error silently. Pair INDIRECT sheet references with a visible validation check: `=IFERROR(INDIRECT(...),"⚠ Sheet not found: "&A2)` so the user sees a warning rather than blank
- When delivering an automation, include in the user instructions: "Do not rename the source data sheet. It is currently named [SheetName]. Renaming it will break the formulas in [cells]."

---

## Example

**User Input:** "I have a Google Sheets file with sales data. The columns are: Date (column A), Region (column B), Salesperson (column C), Product (column D), Revenue (column E). New rows are added daily by my team. I want a summary dashboard on a second sheet where I can select a Region and a Month, and it automatically shows me: (1) total revenue for that region/month, (2) a breakdown of revenue by salesperson, and (3) the top 3 products by revenue for that combination. I want everything to update the moment I change the dropdowns."

---

**Output:**

## Spreadsheet Automation Design

### Summary
- **Platform:** Google Sheets
- **Automation type:** Parameter-driven (dropdown selections drive all output)
- **Source data structure:** Sheet named "Data", columns A--E, flat table, new rows added daily at the bottom
- **Trigger:** User changes Region dropdown (B2 on Dashboard sheet) or Month dropdown (B3 on Dashboard sheet)
- **Auto-updating outputs:** Total revenue cell, salesperson breakdown table, top-3 products table

---

### Data Structure Requirements

| Requirement | Status / Action |
|---|---|
| Flat table (one row per record) | Confirmed -- one sale per row |
| No merged cells in source range | Confirm and remove any merged cells in columns A--E |
| Header row in row 1 | Confirmed -- Date, Region, Salesperson, Product, Revenue |
| No blank rows in middle of data | Confirm -- blanks break COUNTA-based counts |

**Note:** Google Sheets does not have formal Excel Tables, so the source range will be referenced as `Data!A:E` (full-column references are efficient in Sheets). New rows added to the bottom are captured automatically by full-column references.

---

### Named Ranges

| Name | Scope | Reference | Purpose |
|---|---|---|---|
| SalesDate | Workbook | Data!A2:A | All date values in source |
| SalesRegion | Workbook | Data!B2:B | All region values in source |
| SalesPerson | Workbook | Data!C2:C | All salesperson values in source |
| SalesProduct | Workbook | Data!D2:D | All product values in source |
| SalesRevenue | Workbook | Data!E2:E | All revenue values in source |
| RegionList | Workbook | Dashboard!H2:H | Dynamic unique region list (see Formula 1) |
| MonthList | Workbook | Dashboard!I2:I | Dynamic unique month list (see Formula 2) |
| SelectedRegion | Workbook | Dashboard!B2 | User's region selection |
| SelectedMonth | Workbook | Dashboard!B3 | User's month selection |

**Setup:** Data menu > Named ranges > + Add a range > enter name and cell reference for each row above.

---

### Parameter Controls (Dropdown Cells)

| Cell | Label (in adjacent cell) | Named Range | Source Formula | Validation Type |
|---|---|---|---|---|
| B2 | "Select Region:" (in A2) | SelectedRegion | =RegionList | Data validation > Dropdown from a range > Dashboard!H2:H |
| B3 | "Select Month:" (in A3) | SelectedMonth | =MonthList | Data validation > Dropdown from a range > Dashboard!I2:I |

**Note:** Columns H and I on the Dashboard sheet are helper columns for the dynamic lists. Hide these columns after setup (right-click column header > Hide column) to keep the dashboard clean.

---

### Core Automation Formulas

#### Formula 1: Dynamic Region List (Dropdown Source)
**Purpose:** Extracts all unique region values from source data, sorted alphabetically. Automatically includes new regions when they appear.
**Cell:** Dashboard!H2
**Spills:** Yes -- do not place content in H3 downward

```
=SORT(UNIQUE(FILTER(SalesRegion, SalesRegion<>"")))
```

**Depends on:** Named range `SalesRegion` (Data!B2:B)
**Updates when:** A new unique region value is added to the source data
**Error handling:** The FILTER(range, range<>"") removes blank cells from the bottom of the full-column reference, which would otherwise appear as a blank entry in the dropdown

---

#### Formula 2: Dynamic Month List (Dropdown Source)
**Purpose:** Extracts all unique month values present in the data, formatted as "Jan 2024", sorted chronologically.
**Cell:** Dashboard!I2
**Spills:** Yes -- do not place content in I3 downward

```
=SORT(UNIQUE(FILTER(TEXT(SalesDate,"mmm yyyy"), SalesDate<>"")))
```

**Depends on:** Named range `SalesDate` (Data!A2:A)
**Updates when:** A date from a new month is added to the source data
**Error handling:** FILTER removes blank date cells. TEXT converts the date to a human-readable month-year string, ensuring "Jan 2024" and "Jan 2024" from different days in January merge into one entry in UNIQUE

---

#### Formula 3: Total Revenue for Selected Region and Month
**Purpose:** Single-number KPI showing total revenue for the exact region/month combination the user selected.
**Cell:** Dashboard!B6
**Spills:** No -- single cell result

```
=IFERROR(
  SUMPRODUCT(
    (SalesRegion=SelectedRegion) *
    (TEXT(SalesDate,"mmm yyyy")=SelectedMonth) *
    (SalesRevenue)
  ),
  0
)
```

**Depends on:** Named ranges `SalesRegion`, `SalesDate`, `SalesRevenue`, `SelectedRegion`, `SelectedMonth`
**Updates when:** Either dropdown changes or new rows are added to source data
**Error handling:** IFERROR returns 0 if no rows match. SUMPRODUCT is used instead of SUMIFS here because the month criterion requires TEXT transformation on a date column -- SUMIFS cannot apply TEXT formatting to criteria ranges. The multiplication of Boolean arrays (TRUE=1, FALSE=0) implements AND logic

---

#### Formula 4: Salesperson Revenue Breakdown (Unique Salesperson List)
**Purpose:** First column of the salesperson breakdown table -- unique salesperson names for the selected region/month.
**Cell:** Dashboard!A10
**Spills:** Yes -- fills downward with one row per salesperson who has sales in the selection

```
=IFERROR(
  SORT(
    UNIQUE(
      FILTER(
        SalesPerson,
        (SalesRegion=SelectedRegion) * (TEXT(SalesDate,"mmm yyyy")=SelectedMonth)
      )
    )
  ),
  "No salespeople found for selection"
)
```

**Depends on:** `SalesPerson`, `SalesRegion`, `SalesDate`, `SelectedRegion`, `SelectedMonth`
**Updates when:** Either dropdown changes
**Error handling:** IFERROR catches #CALC! when no rows match the filter criteria

---

#### Formula 5: Salesperson Revenue Values
**Purpose:** Second column of the salesperson breakdown -- revenue for each salesperson in the spilled list above.
**Cell:** Dashboard!B10
**Spills:** Yes -- one value per row, matching the spill from Formula 4

```
=IFERROR(
  ARRAYFORMULA(
    SUMPRODUCT(
      (SalesPerson=A10#) *
      (SalesRegion=SelectedRegion) *
      (TEXT(SalesDate,"mmm yyyy")=SelectedMonth) *
      (SalesRevenue)
    )
  ),
  0
)
```

**Depends on:** Spill reference `A10#` (the result of Formula 4), plus all four named source ranges
**Updates when:** Formula 4 spill changes (dropdown change) or new data rows added
**Note on A10#:** The `#` operator in Google Sheets references the entire spill range dynamically. ARRAYFORMULA forces SUMPRODUCT to evaluate against each value in the spill array, producing one revenue sum per salesperson

**Alternative (simpler for each row individually):** If the ARRAYFORMULA approach feels complex, place this formula in B10 and drag down to B20:
```
=IFERROR(
  SUMPRODUCT(
    (SalesPerson=A10) *
    (SalesRegion=SelectedRegion) *
    (TEXT(SalesDate,"mmm yyyy")=SelectedMonth) *
    (SalesRevenue)
  ),
  0
)
```
This is less automated (requires dragging) but more readable for maintenance.

---

#### Formula 6: Top 3 Products by Revenue
**Purpose:** Automatically identifies the three products with highest revenue for the selected region/month combination and displays them with their revenue totals.
**Cell:** Dashboard!A15 (product names, spills 3 rows) and Dashboard!B15 (revenue, spills 3 rows)

First, place this in a helper range (Dashboard!J2, hidden column):

```
=IFERROR(
  UNIQUE(
    FILTER(
      SalesProduct,
      (SalesRegion=SelectedRegion) * (TEXT(SalesDate,"mmm yyyy")=SelectedMonth)
    )
  ),
  ""
)
```

Then calculate revenue per product (Dashboard!K2, hidden):

```
=IFERROR(
  ARRAYFORMULA(
    SUMPRODUCT(
      (SalesProduct=J2#) *
      (SalesRegion=SelectedRegion) *
      (TEXT(SalesDate,"mmm yyyy")=SelectedMonth) *
      (SalesRevenue)
    )
  ),
  0
)
```

Then in Dashboard!A15 (the top-3 product names displayed to the user):

```
=IFERROR(
  INDEX(J2#, MATCH(LARGE(K2#, {1;2;3}), K2#, 0)),
  "N/A"
)
```

And in Dashboard!B15 (the top-3 revenue values):

```
=IFERROR(LARGE(K2#, {1;2;3}), 0)
```

**What it does:** The LARGE function with the array constant `{1;2;3}` produces three values (1st largest, 2nd largest, 3rd largest) in a single formula. INDEX/MATCH finds the product name associated with each rank. Both spill to three rows automatically.
**Updates when:** Either dropdown changes
**Caveat:** If two products have identical revenue, MATCH returns the first occurrence for both rank positions -- add a tiebreaker note in the user instructions if your data has frequent ties

---

### Expected Dashboard Layout

```
A              | B              | C
--------------------------------------------------------
Select Region: | [Dropdown: West]|
Select Month:  | [Dropdown: Jan 2024] |
               |               |
TOTAL REVENUE  |               |
               | $105,400      |
               |               |
REVENUE BY SALESPERSON          |
Salesperson    | Revenue       |
Alice Chen     | $44,200       |
Bob Patel      | $38,100       |
Carol West     | $23,100       |
               |               |
TOP 3 PRODUCTS |               |
Product A      | $52,000       |
Product C      | $31,400       |
Product B      | $22,000       |
```

---

### Performance Notes

- **Row count:** Full-column references (`A2:A`) are appropriate for Google Sheets at the volumes described (daily additions to a single dataset)
- **Volatile functions:** None used -- SUMPRODUCT, FILTER, UNIQUE, SORT are all non-volatile
- **TEXT() on date range in SUMPRODUCT:** Calling `TEXT(SalesDate,"mmm yyyy")` inside SUMPRODUCT on a large dataset evaluates the conversion for every row on every recalculation. If the dataset grows beyond 50,000 rows, add a helper column to the source Data sheet: column F = `=TEXT(A2,"mmm yyyy")` and reference that column directly instead of computing it inside SUMPRODUCT

---

### Cell Protection Map

| Zone | Cells | Locked? | Reason |
|---|---|---|---|
| Region dropdown | B2 | No | User selection |
| Month dropdown | B3 | No | User selection |
| Total revenue | B6 | Yes | Formula (Formula 3) |
| Salesperson list | A10:B25 | Yes | Spill formulas (4 and 5) |
| Top 3 products | A15:B17 | Yes | Spill formulas (Formula 6) |
| Helper columns H--K | H:K | Yes, then hidden | List sources and intermediate calculations |

**Setup:** Data menu > Protect sheets and ranges > Add a range > enter the formula cells > set permissions to "Only you" or specific editors.

---

### User Instructions

1. On the Dashboard sheet, click cell B2 and select a region from the dropdown (options update automatically as new regions appear in your data)
2. Click cell B3 and select a month from the dropdown (displayed as "Jan 2024" format -- options update as new months appear)
3. All three sections update immediately: Total Revenue, Revenue by Salesperson, and Top 3 Products
4. **Do NOT type directly into any cell other than B2 and B3 on this sheet.** All other cells contain formulas
5. To add new sales data, go to the Data sheet and add rows at the bottom of the existing data in columns A--E. Use the format YYYY-MM-DD for dates. The dashboard captures new rows immediately
6. If a dropdown shows "No salespeople found for selection" or a product shows "N/A", it means no data exists for that region/month combination -- this is expected and correct behavior, not an error
7. Hidden columns H--K on the Dashboard sheet contain helper formulas. Do not unhide and modify these columns
