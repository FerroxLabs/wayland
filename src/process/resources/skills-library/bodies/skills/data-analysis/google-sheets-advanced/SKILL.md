---
name: google-sheets-advanced
description: |
  Produces Google Sheets-specific advanced formula patterns including ARRAYFORMULA, IMPORTRANGE, QUERY function syntax, Apps Script trigger patterns, and key behavioral differences from Excel. Generates exact formula strings for Sheets-native automation.
  Use when the user works in Google Sheets and needs formulas or features that differ from Excel or are unique to Sheets.
  Do NOT use for general spreadsheet formulas that work in both Excel and Sheets (use excel-lookup-formulas), data cleaning (use spreadsheet-data-cleaning), or full Apps Script programming (software-development scope).
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
# Google Sheets Advanced

## When to Use

**Use this skill when:**
- The user explicitly mentions Google Sheets, Google Drive, or Google Workspace and needs formulas or automation features that are either unique to Sheets or behave differently than their Excel counterparts
- The user asks about QUERY, ARRAYFORMULA, IMPORTRANGE, GOOGLETRANSLATE, GOOGLEFINANCE, IMAGE, SPARKLINE, or other Sheets-native functions not available in standard Excel
- The user wants to pull data live from another Google Sheets file, a Google Form response sheet, a BigQuery table, or a published CSV via IMPORTDATA
- The user needs to understand why a formula works in Excel but produces an error or different result in Sheets -- common migration pain points include date serial numbers, array entry, TEXTJOIN behavior, and VLOOKUP column numbering
- The user wants to build Sheets-native automation using data validation, named ranges, conditional formatting rules, checkbox-triggered logic, or simple Apps Script triggers without writing a full application
- The user needs to implement QUERY-based dashboards that replace pivot tables with dynamic, formula-driven summaries that update automatically without manual refresh
- The user is working with Google Forms data piped automatically into a Sheet and needs to process the response sheet programmatically using formulas rather than manual manipulation
- The user needs to combine data from multiple sheets or multiple files into a single summary view using IMPORTRANGE chains or QUERY with IMPORTRANGE nesting
- The user needs to implement ARRAYFORMULA-based column formulas that auto-populate as new rows are added, replacing the need to drag formulas down

**Do NOT use when:**
- The user needs formulas that work identically in both Excel and Google Sheets -- use the `excel-lookup-formulas` skill for INDEX/MATCH, XLOOKUP, VLOOKUP, and SUMIFS patterns
- The user needs to clean, deduplicate, standardize, or transform raw data using text and date manipulation formulas -- use the `spreadsheet-data-cleaning` skill
- The user wants to write a full Apps Script application with classes, external API calls, multi-function architecture, or complex event handling -- that is `software-development` scope
- The user primarily works in Excel and the formula they need has a direct Excel equivalent with no meaningful behavioral difference
- The user needs statistical analysis, regression modeling, or data science workflows -- use a dedicated `data-analysis` or `python-data-analysis` skill
- The user needs to build a full Google Looker Studio (Data Studio) dashboard connected to Sheets -- that is a separate reporting tool scope
- The user is asking about Google Sheets API for programmatic access from an external application -- use `api-integration` scope

---

## Process

### Step 1 -- Establish the Sheets-Specific Context

Before writing any formula, confirm the environment and constraints:

- **Confirm it is Google Sheets, not Excel.** If the user says "spreadsheet" without specifying, ask. Sheets-native formulas like QUERY and IMPORTRANGE will crash Excel completely.
- **Identify the data layout.** Ask for or infer column order, header row count, sheet names, and whether the data is on one sheet or spans multiple sheets or files. QUERY column references (A, B, C) are positional within the supplied range, not absolute sheet column letters.
- **Determine dataset size.** Sheets handles up to 10 million cells per spreadsheet. IMPORTRANGE degrades significantly above 50,000 cells. QUERY with GROUP BY on more than 500,000 rows will be slow. ARRAYFORMULA on open-ended columns with expensive nested functions (like nested VLOOKUP) can cause calculation timeouts.
- **Identify refresh and collaboration requirements.** Multiple simultaneous editors can cause IMPORTRANGE to recalculate unpredictably. If data must be static at a point in time, IMPORTRANGE is wrong -- use Paste Special > Values instead or an Apps Script copy trigger.
- **Check for mixed-type column hazards.** If the user describes a column that contains both numbers and text (e.g., product codes like "A-100" mixed with pure numbers like "100"), flag this immediately -- QUERY will silently drop the minority type.

---

### Step 2 -- Select the Correct Sheets-Native Tool

Use this decision framework to match the requirement to the right function:

**QUERY function** -- use when the task involves filtering AND aggregating AND sorting in one step, or when the user would otherwise combine FILTER + SUMIFS + SORT + IFERROR in multiple helper columns. QUERY is the single most powerful Sheets-unique feature and replaces pivot tables for formula-driven dashboards.

**ARRAYFORMULA** -- use when the user wants a single formula in a header cell that auto-populates calculated values for every data row as rows are added. Critical for Google Forms response sheets where row count grows continuously. ARRAYFORMULA works with arithmetic, IF, CONCATENATE, LEFT/RIGHT/MID, VLOOKUP, and REGEXMATCH. It does NOT work with FILTER, SORT, UNIQUE, or QUERY (those are already array-returning functions).

**IMPORTRANGE** -- use when data must be pulled live from a separate Google Sheets file. Requires one-time "Allow access" authorization per unique source spreadsheet. Never chain more than 3 IMPORTRANGE calls in a single formula path -- performance degrades multiplicatively. For read-only dashboards aggregating 5+ source files, consider Apps Script to copy values nightly instead.

**FILTER** -- use for dynamic row filtering that returns a variable number of rows without aggregation. Sheets FILTER is equivalent to Excel 365 FILTER. Combine with SORT and UNIQUE for dynamic distinct-value pickers. Unlike QUERY, FILTER preserves original column order and data types without risk of type coercion.

**UNIQUE + SORT** -- use for creating dynamic dropdown source lists, unique member lists, or dimension tables derived from raw data. `=SORT(UNIQUE(A2:A))` is the canonical Sheets pattern for a dynamic list that updates as data changes.

**REGEXMATCH / REGEXEXTRACT / REGEXREPLACE** -- use when text parsing needs pattern matching. These are Sheets-native and significantly more powerful than Excel's text functions for pattern-based work. Syntax uses RE2 regex dialect (not PCRE -- no lookaheads, no backreferences).

**GOOGLEFINANCE** -- use for live and historical stock, currency, and market data. Returns current price, P/E, market cap, 52-week high/low, or a historical price table. Syntax: `=GOOGLEFINANCE("GOOG", "price")` or `=GOOGLEFINANCE("GOOG", "all", DATE(2024,1,1), DATE(2024,12,31), "DAILY")`.

**SPARKLINE** -- use for inline miniature charts within a cell. `=SPARKLINE(data_range, {"charttype","bar";"max",100})` renders a bar chart inside the cell. Options include line, bar, column, and winloss chart types. Frequently used in KPI dashboards.

**Named Functions (Sheets 2022+)** -- use when the user needs to define a reusable custom formula without Apps Script. Named Functions appear under Data > Named functions and support argument names and descriptions, behaving like user-defined functions.

---

### Step 3 -- Build QUERY Formulas with Full Clause Precision

QUERY is the most complex and most commonly misused Sheets function. Apply these construction rules:

- **Column references in QUERY are positional within the data_range.** If the data range is `B2:F`, then column B on the sheet is Col1 (or just `A` in QUERY syntax). Column C is `B`, etc. This is the most common source of confusion for Sheets users migrating from Excel.
- **Always specify the headers parameter.** Use `1` if the first row of the range is a header. Use `0` if there is no header. Omitting it causes Sheets to auto-detect, which produces inconsistent results when the first data row contains numbers that Sheets might interpret as a header.
- **String literals in WHERE clauses must use single quotes.** `WHERE C = 'West'` is correct. `WHERE C = "West"` will produce a parse error.
- **Date literals require the `date` keyword.** `WHERE A >= date '2025-01-01'` is the correct form. The date string must be in ISO 8601 format (YYYY-MM-DD). Using `WHERE A >= '2025-01-01'` will either fail or compare as string, producing wrong results.
- **Aggregate functions available in QUERY:** SUM, AVG, COUNT, MAX, MIN. There is no MEDIAN, STDEV, or PERCENTILE in QUERY -- for those, use FILTER + MEDIAN/PERCENTILE as a separate formula.
- **LABEL clause renames output columns.** `LABEL SUM(E) 'Total Revenue'` renames the aggregated column header. Without LABEL, Sheets auto-generates headers like "sum revenue" which are ugly in dashboards.
- **FORMAT clause applies number formatting to QUERY output.** `FORMAT SUM(E) '#,##0.00'` applies a comma format to the output column. This does not affect sorting -- FORMAT is applied after ORDER BY.
- **PIVOT clause creates crosstab output.** `SELECT C, SUM(E) GROUP BY C PIVOT D` creates a column for each unique value in column D, summing revenue per region per product. This replaces a pivot table entirely.
- **QUERY with IMPORTRANGE:** When IMPORTRANGE is the data source, column references switch from letters to `Col1, Col2, Col3` notation. `=QUERY(IMPORTRANGE("key","Sheet1!A:E"), "SELECT Col1, SUM(Col5) GROUP BY Col1", 1)`.

---

### Step 4 -- Build ARRAYFORMULA Patterns with Blank-Row Protection

ARRAYFORMULA patterns require specific structural discipline to avoid error flooding:

**Standard ARRAYFORMULA pattern (arithmetic):**
```
=ARRAYFORMULA(IF(A2:A="", "", B2:B * C2:C))
```
The outer `IF(A2:A="", "", ...)` is the blank-row guard. Without it, every empty row in the column returns 0 or an error, which breaks SUM formulas and clutters the sheet.

**ARRAYFORMULA with VLOOKUP (lookup entire column):**
```
=ARRAYFORMULA(IF(A2:A="", "", VLOOKUP(A2:A, LookupSheet!$A$1:$C$100, 2, FALSE)))
```
This replaces dragging VLOOKUP down 1,000 rows. It recalculates in one operation, which is faster than 1,000 individual VLOOKUP cells.

**ARRAYFORMULA with text concatenation:**
```
=ARRAYFORMULA(IF(A2:A="", "", B2:B & " - " & C2:C))
```
Ampersand concatenation works inside ARRAYFORMULA. CONCATENATE() does NOT work inside ARRAYFORMULA -- use `&` instead.

**ARRAYFORMULA with REGEXMATCH:**
```
=ARRAYFORMULA(IF(A2:A="", "", IF(REGEXMATCH(A2:A, "^[A-Z]{2}-\d{4}$"), "Valid", "Invalid")))
```
This validates an entire column of product codes against a regex pattern in one formula.

**Critical ARRAYFORMULA limits:**
- Do NOT place an ARRAYFORMULA in a column where individual cells in that column also have formulas -- the array formula will conflict and produce errors.
- ARRAYFORMULA cannot be used with FILTER, SORT, UNIQUE, QUERY, or IMPORTRANGE -- these functions are already array-returning and do not need the ARRAYFORMULA wrapper.
- ARRAYFORMULA on a column that references another ARRAYFORMULA column can cause circular dependency errors. Use helper columns if chaining complex logic.

---

### Step 5 -- Configure IMPORTRANGE with Authorization and Performance Controls

IMPORTRANGE is deceptively simple in syntax but requires careful setup:

**Syntax:** `=IMPORTRANGE("spreadsheet_id_or_url", "SheetName!A1:Z1000")`

**Finding the spreadsheet ID:** In the URL `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit`, the ID is `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`. Using the full URL also works but the ID is more stable if the URL changes.

**Authorization:** The very first time IMPORTRANGE is used from a destination spreadsheet to a new source spreadsheet, a "You need to connect these sheets" warning appears. Hover over the cell and click "Allow access." This authorization is per source file, per destination file -- it only needs to be done once.

**Performance guidance:**
- Import only the columns you need. `Sheet1!A:B` is dramatically faster than `Sheet1!A:Z`.
- IMPORTRANGE does not refresh on a timer -- it refreshes when the source file is modified or when the destination file recalculates (Ctrl+Shift+F5 forces recalc).
- For ranges exceeding 10,000 rows, wrap in QUERY immediately: `=QUERY(IMPORTRANGE("id","Sheet1!A:F"), "SELECT Col1, Col3, Col6 WHERE Col2 = 'Active'", 1)` -- this filters before rendering, reducing the rendered output significantly.
- Never use IMPORTRANGE as a direct data_validation source for dropdowns -- it causes severe performance degradation. Copy the IMPORTRANGE output to a static helper column first.

---

### Step 6 -- Handle Apps Script Trigger Patterns for Sheets Automation

For simple automation that does not require full application development, Apps Script triggers are appropriate within this skill's scope:

**installable vs. simple triggers:**
- Simple triggers (`onEdit`, `onOpen`, `onChange`) require no authorization and run instantly but cannot send emails, access external services, or modify other files.
- Installable triggers require setup via Extensions > Apps Script > Triggers and can do everything, including sending email, writing to other sheets, and calling UrlFetch.

**Simple onEdit trigger (marks row as modified):**
```javascript
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() !== "Orders") return;
  const row = e.range.getRow();
  if (row < 2) return; // skip header
  sheet.getRange(row, 10).setValue(new Date()); // timestamp in column J
}
```

**Time-driven trigger (daily data snapshot):**
- Set up via Extensions > Apps Script > Triggers > Add Trigger
- Function: `takeSnapshot`, event source: Time-driven, type: Day timer, time: 11pm-midnight
- This pattern is used to copy IMPORTRANGE live values to a static archive tab daily

**onChange trigger (detect new Google Form submission):**
```javascript
function onFormSubmit(e) {
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  sheet.getRange(row, 15).setValue("Pending Review"); // set status column
}
```
Set trigger type to "On form submit" for this pattern.

**Scope boundary for this skill:** Provide the trigger setup, the function signature, and 1-2 specific operations (setValue, getRange, sendEmail via MailApp.sendEmail). Full multi-function Apps Script applications (loops over external APIs, class definitions, complex data pipelines) exceed this skill's scope.

---

### Step 7 -- Document Excel Differences Systematically

For every formula or feature delivered, provide a structured Excel comparison:

| Sheets Feature | Excel Equivalent | Key Differences |
|---|---|---|
| QUERY | Pivot Table or SUMIFS + helper columns | QUERY is formula-based and dynamic; pivot tables require manual refresh |
| ARRAYFORMULA | Dynamic Arrays (Excel 365 only) | Sheets requires explicit ARRAYFORMULA wrapper; Excel 365 arrays spill automatically |
| IMPORTRANGE | Power Query from SharePoint/OneDrive | IMPORTRANGE is a single formula; Power Query requires GUI setup and manual refresh |
| FILTER | FILTER (Excel 365 only) | Identical in syntax and behavior for Excel 365; not available in Excel 2019 or earlier |
| UNIQUE | UNIQUE (Excel 365 only) | Identical in Excel 365; not available in older Excel |
| REGEXMATCH | No native equivalent | Excel requires VBA or Power Query for regex; Sheets has it natively |
| GOOGLEFINANCE | No native equivalent | Excel requires a Stocks data type (Microsoft 365 only) for similar data |
| date serial numbers | Different epoch | Sheets uses December 30, 1899 as day 0; Excel uses January 0, 1900. The difference is 0 for most dates but matters when pasting date values between platforms. |

**Array formula entry difference:** In Excel (pre-365), array formulas require Ctrl+Shift+Enter to enter, which wraps the formula in curly braces `{=formula}`. In Google Sheets, ARRAYFORMULA is an explicit function -- never press Ctrl+Shift+Enter in Sheets. Doing so has no special effect.

---

### Step 8 -- Validate and Deliver the Formula

Before presenting the final formula:

- **Test the column letter mapping.** Recount the columns from the start of the data_range, not from the sheet edge. If the data range starts at column C, then column C is `A` in QUERY.
- **Verify string quote type.** Ensure all string literals inside QUERY use single quotes (`'`), not curly/smart quotes (`'`). Smart quotes are inserted automatically by some markdown editors and will break the formula.
- **Wrap in error handling where appropriate.** For formulas that may return no results, wrap in IFERROR: `=IFERROR(QUERY(...),"No data found")`. For IMPORTRANGE that may be loading, IFERROR catches the "#N/A Loading..." state.
- **Provide the complete formula in a code block.** Never describe a formula in prose without also writing the exact formula string -- the user should be able to copy and paste it directly.
- **List any one-time setup steps.** IMPORTRANGE needs "Allow access." Named Functions need to be created under Data > Named functions. Triggers need to be installed under Extensions > Apps Script.

---

## Output Format

```
## Google Sheets Formula Solution

### Requirement
[Precise statement of what the formula accomplishes, including data layout assumptions]

### Data Layout Assumed
| Column | Sheet Column | Letter in QUERY | Contains |
|--------|-------------|-----------------|---------|
| A | A | A | [field name and type] |
| B | B | B | [field name and type] |
| [continue for all relevant columns] |

### Primary Formula

**Paste into cell [cell reference] (leave this cell empty first):**
```
=[exact complete formula]
```

### How It Works
- **[function name or clause]:** [Precise explanation of what this part does and why]
- **[function name or clause]:** [Precise explanation]
- **[continue for each meaningful clause or argument]**

### QUERY Clause Breakdown (if using QUERY)

```
=QUERY(
  [data_range],          -- Source: [description]
  "SELECT [cols]         -- Returns: [what columns]
   WHERE [condition]     -- Filters: [what condition]
   GROUP BY [col]        -- Aggregates: [how]
   ORDER BY [col] DESC   -- Sorts: [by what]
   LABEL [col] '[name]'  -- Renames: [output headers]
  ",
  [headers]              -- Header rows: [count and why]
)
```

### Setup Steps (if required)
1. [Any one-time authorization steps, e.g., Allow Access for IMPORTRANGE]
2. [Any named range definitions or sheet setup]

### Expected Output
| [Column Header 1] | [Column Header 2] | [Column Header 3] |
|---|---|---|
| [realistic sample row] | [realistic sample row] | [realistic sample row] |

### Common Variations
| Use Case | Formula |
|---------|---------|
| [specific variation description] | `=[complete formula]` |
| [specific variation description] | `=[complete formula]` |
| [specific variation description] | `=[complete formula]` |

### Excel Equivalent
**If you need this in Excel:** [Exact Excel approach -- pivot table steps, SUMIFS formula, Power Query steps, or "Not available in Excel [version]"]
**Key difference to watch for:** [The one behavioral difference most likely to cause problems]

### Troubleshooting
| Error or Symptom | Cause | Fix |
|---|---|---|
| [specific error message or symptom] | [root cause] | [exact fix] |
| [specific error message or symptom] | [root cause] | [exact fix] |
| [specific error message or symptom] | [root cause] | [exact fix] |
```

---

## Rules

1. **Always write the complete, paste-ready formula string in a code block.** Never describe what a formula should look like without writing the exact formula. If cell references need to be adjusted by the user, say so explicitly with a comment (e.g., "replace B2:B with your actual revenue column").

2. **QUERY column letters are positional within the data_range, not absolute sheet column positions.** If the data range is `C1:G`, then column C on the sheet is referenced as `A` inside QUERY, column D is `B`, etc. This is the single most common QUERY mistake. Always recount from the range start.

3. **Always include the headers parameter in every QUERY formula.** Use `1` for data with a single header row, `0` for no header. Omitting this parameter causes Sheets to auto-detect, which produces inconsistent behavior when the first data row contains values that look like headers.

4. **String literals in QUERY WHERE clauses must use single straight quotes.** `WHERE C = 'West'` is correct. Double quotes and curly (smart) quotes both cause parse errors. When delivering formulas in markdown, verify the quote characters are straight.

5. **Always include a blank-row guard in ARRAYFORMULA.** The pattern `=ARRAYFORMULA(IF(A2:A="", "", your_formula))` is mandatory for any ARRAYFORMULA using an open-ended range like `A2:A`. Without it, the formula returns errors or zeros in every empty row, which corrupts aggregate formulas (SUM, COUNT, AVERAGE) that reference that column.

6. **Date comparisons in QUERY require the `date` keyword with ISO format.** `WHERE A >= date '2025-01-01'` is the only reliable form. Never use plain string comparison for dates in QUERY -- `WHERE A >= '2025-01-01'` will either error or compare lexicographically, producing silent wrong results.

7. **When QUERY operates on IMPORTRANGE output, use Col1/Col2/Col3 notation instead of A/B/C.** The column letter notation only works when the data_range is a direct cell reference. IMPORTRANGE returns an array, not a reference, so QUERY falls back to Col1, Col2 numbering.

8. **QUERY output cells are read-only.** Users cannot type into a cell that is part of a QUERY result range. If they need to annotate or edit output data, they must either modify the source data or copy-paste the QUERY results as values to a separate range. Make this limitation explicit.

9. **IMPORTRANGE practical cell limit is approximately 50,000 cells before performance becomes unacceptable.** Calculate: rows × columns = cells. A range of 5,000 rows × 10 columns = 50,000 cells -- at the limit. For larger imports, always wrap immediately with QUERY to filter/select before output, or recommend Apps Script value-copy as an alternative.

10. **Never place an ARRAYFORMULA in a column that also contains individual cell formulas.** The array formula attempts to fill the entire column range, and individual cell formulas in that range cause conflicts, errors, and unpredictable overwrite behavior. The correct pattern is: one ARRAYFORMULA in the header row or first data cell handles the entire column; all other cells in that column must be empty.

11. **CONCATENATE() does not work inside ARRAYFORMULA -- use the `&` operator instead.** `=ARRAYFORMULA(CONCATENATE(A2:A, " ", B2:B))` will fail. `=ARRAYFORMULA(A2:A & " " & B2:B)` is the correct pattern.

12. **For QUERY with PIVOT, column count in output is dynamic and unknown at formula time.** PIVOT creates one output column per unique value in the pivot column. If a new unique value is added to the source data, a new column appears automatically -- which can overwrite adjacent cell content. Always leave empty columns to the right of a PIVOT query, or place it in an isolated area of the sheet.

---

## Edge Cases

### Mixed Data Types in QUERY Source Column
**Scenario:** A column contains mostly numbers but a few cells have text entries (e.g., "N/A", "TBD", or units like "100kg"). QUERY silently drops whichever type is the minority in that column. If 90% of column D has numbers and 10% has text, the 10% text rows are excluded from query results without any error or warning.

**Detection:** Count the rows in source vs. QUERY output. If they differ unexpectedly, check the filtered column for mixed types using `=COUNTIF(D2:D, ">"&0)` vs. `=COUNTA(D2:D)` to spot text contamination.

**Fix:** Select the column, Format > Number > Plain text. Then wrap the QUERY column in `TOTEXT()`: `SELECT TOTEXT(D)`. Alternatively, use FILTER + SUMIF instead of QUERY for that specific aggregation, as FILTER does not coerce types.

---

### IMPORTRANGE Authorization Fails for Service Account or Shared Drive Files
**Scenario:** The source spreadsheet is owned by a Google Workspace service account, stored in a Shared Drive, or has restricted permissions. The "Allow access" button either does not appear or clicking it returns "You don't have permission."

**Fix:** The user must have at least Viewer access to the source spreadsheet in their Google account. If the file is in a Shared Drive with access restrictions, they must request access to that specific file or folder. Confirming access: open the source spreadsheet URL in the same browser session where Sheets is open -- if it loads, IMPORTRANGE should work.

**Alternative:** If the source file cannot grant access, use Apps Script with `SpreadsheetApp.openById("id")` in an installable trigger -- this accesses the file using the script owner's credentials and can copy values to the destination sheet on a schedule.

---

### ARRAYFORMULA on Google Forms Response Sheet Conflicts with Form-Written Values
**Scenario:** A Google Form writes responses to a sheet. The user places an ARRAYFORMULA in column H to calculate a derived value from the form responses. When the form submits a new response, Google Forms writes directly to that row -- but the ARRAYFORMULA already controls column H, causing a conflict. Forms may overwrite the formula cell or the formula may throw an error.

**Root cause:** Google Forms writes values to a specific row and column. If that column is controlled by an ARRAYFORMULA, the written value conflicts with the formula's output.

**Fix:** Place the ARRAYFORMULA in a column that Google Forms never writes to -- typically several columns to the right of the last form question column. Leave at least one buffer column between the last form-written column and the first ARRAYFORMULA column. Alternatively, use the `onFormSubmit` Apps Script trigger to do the derived calculation in script rather than a sheet formula.

---

### QUERY Returns Empty Result Instead of "No Data" When Filter Matches Nothing
**Scenario:** A QUERY with a WHERE clause that currently matches no rows returns a blank output -- not an error, just silence. This confuses users who expect to see "No results" or a zero, especially in dashboards.

**Fix:** Wrap in IFERROR with a custom message is insufficient here because QUERY does not error on empty results -- it just returns nothing. The correct pattern is:
```
=IFERROR(
  IF(ROWS(QUERY(A1:E,"SELECT B WHERE C='West'",1))<=1,
     "No data for this filter",
     QUERY(A1:E,"SELECT B, SUM(E) WHERE C='West' GROUP BY B ORDER BY SUM(E) DESC",1)),
  "Query error")
```
A simpler production pattern uses a helper cell: check `=COUNTIF(C2:C,"West")>0` and conditionally display the QUERY or a message using IF.

---

### QUERY Date Filter Fails When Date Column is Stored as Text
**Scenario:** Dates appear to be dates visually but are stored as text strings (common when imported via CSV, pasted from a web scrape, or filled by a non-date Google Form field). The QUERY `WHERE A >= date '2025-01-01'` returns no results or errors because QUERY cannot compare a text string to a date literal.

**Detection:** Select a cell in the date column. If the alignment is left (text default) rather than right (number/date default), the values are text. Confirm with `=ISNUMBER(A2)` -- it returns FALSE for text dates.

**Fix:** Convert the column to real dates using `=DATEVALUE(A2)` in a helper column, or use ARRAYFORMULA: `=ARRAYFORMULA(IF(A2:A="","",DATEVALUE(A2:A)))`. Then run the QUERY against the helper column. Alternatively, if the dates are in a consistent text format like "2025-01-15", use a QUERY text comparison: `WHERE A >= '2025-01-01'` -- this works as a string sort only if dates are ISO format (YYYY-MM-DD), since lexicographic sort matches chronological sort for that format.

---

### Dynamic Range Expansion Breaks Named Ranges Used in IMPORTRANGE
**Scenario:** A user defines a named range in the source spreadsheet (e.g., "SalesData" = Sheet1!A1:F500) and uses it in IMPORTRANGE: `=IMPORTRANGE("id", "SalesData")`. As data grows beyond row 500, IMPORTRANGE stops importing the new rows because the named range was defined with a fixed endpoint.

**Fix:** Always define named ranges with open-ended row references: Sheet1!A1:F (no row limit). Open-ended named ranges in IMPORTRANGE update dynamically as data grows. Warn users that open-ended IMPORTRANGE ranges import ALL rows including empty ones -- wrap immediately with a QUERY that filters blank rows: `=QUERY(IMPORTRANGE("id","SalesData"), "SELECT * WHERE Col1 IS NOT NULL", 1)`.

---

### SPARKLINE and ARRAYFORMULA Incompatibility
**Scenario:** A user wants to use ARRAYFORMULA to fill an entire column with SPARKLINE charts -- one chart per row showing a trend from that row's data. `=ARRAYFORMULA(SPARKLINE(B2:D))` returns an error because SPARKLINE is not array-aware and cannot be wrapped in ARRAYFORMULA.

**Fix:** SPARKLINE must be entered individually in each cell. It cannot be automated with ARRAYFORMULA. For a large dataset, the only automated approach is an Apps Script that iterates each row and sets a SPARKLINE formula string using `setFormula()`:
```javascript
function addSparklines() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  for (let i = 2; i <= lastRow; i++) {
    sheet.getRange(i, 6).setFormula(
      `=SPARKLINE(B${i}:E${i},{"charttype","column";"color","#4285F4"})`
    );
  }
}
```
This is the boundary case where this skill hands off to Apps Script scope.

---

### QUERY PIVOT Generates Unpredictable Column Count and Overwrites Adjacent Data
**Scenario:** A user places a QUERY with PIVOT in column A, and the pivot generates 12 columns (one per month). The next month, a new month appears in the source data and PIVOT generates 13 columns -- overwriting whatever was in the 13th column position.

**Fix:** Always place PIVOT queries in an isolated area with at least 20+ empty columns to the right, or on a dedicated summary sheet. Add a visual warning in adjacent cells: a comment or a merged cell header that says "PIVOT expansion zone -- do not use." Alternatively, switch from PIVOT to a series of individual QUERY SUM statements with fixed column headers if the pivot dimensions are known and stable.

---

## Example

**Input:** "I have a Google Sheets file where column A is Date, column B is Sales Rep, column C is Region, column D is Product Category, column E is Units Sold, and column F is Revenue. I want a dashboard table that shows total revenue and total units by product category for Q1 2025, sorted by revenue descending, with clean column headers. The data starts in row 1 with headers and goes to about 5,000 rows. I also want to know how to do the same thing for any quarter dynamically using a dropdown."

**Output:**

---

## Google Sheets Formula Solution

### Requirement
Aggregate total revenue and total units by product category, filtered to Q1 2025 (January 1 -- March 31, 2025), sorted by total revenue descending, with formatted output headers. Then extend to a dynamic quarter selector using a dropdown.

### Data Layout Assumed
| Column | Sheet Column | Letter in QUERY | Contains |
|--------|-------------|-----------------|---------|
| 1 | A | A | Date (date format, not text) |
| 2 | B | B | Sales Rep (text) |
| 3 | C | C | Region (text) |
| 4 | D | D | Product Category (text) |
| 5 | E | E | Units Sold (integer) |
| 6 | F | F | Revenue (currency/number) |

### Primary Formula -- Q1 2025 Static Version

**Paste into cell H2 (columns H and I must be empty -- QUERY will spill into both):**
```
=QUERY(A1:F, "SELECT D, SUM(F), SUM(E) WHERE A >= date '2025-01-01' AND A <= date '2025-03-31' GROUP BY D ORDER BY SUM(F) DESC LABEL D 'Product Category', SUM(F) 'Total Revenue', SUM(E) 'Total Units'", 1)
```

### QUERY Clause Breakdown

```
=QUERY(
  A1:F,                              -- Source: full data table including header row
  "SELECT D, SUM(F), SUM(E)          -- Returns: Product Category, summed Revenue, summed Units
   WHERE A >= date '2025-01-01'       -- Filters: dates on or after Jan 1, 2025
   AND A <= date '2025-03-31'         -- Filters: dates on or before Mar 31, 2025
   GROUP BY D                         -- Aggregates: one row per unique Product Category
   ORDER BY SUM(F) DESC               -- Sorts: highest revenue first
   LABEL D 'Product Category',        -- Renames: column D header to 'Product Category'
         SUM(F) 'Total Revenue',       -- Renames: revenue aggregate header
         SUM(E) 'Total Units'          -- Renames: units aggregate header
  ",
  1                                  -- Header rows: 1 (row 1 of A1:F contains column labels)
)
```

### How It Works
- **`A1:F` (open-ended range):** Includes all rows and automatically picks up new data added below row 5,000. The open-ended column range `A1:F` is equivalent to `A:F` but anchoring at row 1 ensures the header is included for the `1` headers parameter.
- **`SELECT D, SUM(F), SUM(E)`:** Retrieves the Product Category column and computes sums of Revenue and Units per group. SUM is an aggregate -- it requires a GROUP BY clause.
- **`WHERE A >= date '2025-01-01' AND A <= date '2025-03-31'`:** The `date` keyword is mandatory. QUERY treats bare strings like `'2025-01-01'` as text, not dates. The AND clause correctly captures the full Q1 range inclusive of both endpoints.
- **`GROUP BY D`:** Collapses all rows with the same Product Category into one output row. Every non-aggregated SELECT column must appear in GROUP BY.
- **`ORDER BY SUM(F) DESC`:** Sorts the output by total revenue highest to lowest. Note that `DESC` must be written in the query string, not as a separate argument.
- **`LABEL` clause:** Without this, Sheets generates headers like "sum revenue" which are lowercase and hyphenated -- unpresentable in a dashboard.
- **`1` (headers parameter):** Tells QUERY that row 1 of the source range is a header row and should not be treated as data.

### Setup Steps
None required for this formula -- it is self-contained. If the date column (column A) shows as left-aligned, it may be stored as text -- see the Troubleshooting section below.

### Expected Output (H2 onward)

| Product Category | Total Revenue | Total Units |
|---|---|---|
| Enterprise Software | $1,284,000 | 642 |
| Professional Services | $876,500 | 1,753 |
| Hardware | $543,200 | 2,716 |
| Support Contracts | $312,800 | 1,564 |
| Training | $98,400 | 984 |

---

### Dynamic Quarter Selector -- Step-by-Step Setup

This extends the static formula to filter by any quarter selected from a dropdown.

**Step 1 -- Create the quarter selector cell**

In cell K1, type the label: `Select Quarter:`
In cell L1, set up data validation:
- Select L1 > Data > Data validation > Add rule
- Criteria: Dropdown (from a list)
- Options: `Q1 2025`, `Q2 2025`, `Q3 2025`, `Q4 2025`, `Q1 2026`

**Step 2 -- Create start and end date helper cells using the dropdown**

In cell L2 (Start Date):
```
=IF(L1="Q1 2025", DATE(2025,1,1), IF(L1="Q2 2025", DATE(2025,4,1), IF(L1="Q3 2025", DATE(2025,7,1), IF(L1="Q4 2025", DATE(2025,10,1), IF(L1="Q1 2026", DATE(2026,1,1), "")))))
```

In cell L3 (End Date):
```
=IF(L1="Q1 2025", DATE(2025,3,31), IF(L1="Q2 2025", DATE(2025,6,30), IF(L1="Q3 2025", DATE(2025,9,30), IF(L1="Q4 2025", DATE(2025,12,31), IF(L1="Q1 2026", DATE(2026,3,31), "")))))
```

Format L2 and L3 as Date (Format > Number > Date).

**Step 3 -- Dynamic QUERY that reads the date range from L2 and L3**

**Paste into cell H2:**
```
=IFERROR(QUERY(A1:F, "SELECT D, SUM(F), SUM(E) WHERE A >= date '"&TEXT(L2,"yyyy-MM-dd")&"' AND A <= date '"&TEXT(L3,"yyyy-MM-dd")&"' GROUP BY D ORDER BY SUM(F) DESC LABEL D 'Product Category', SUM(F) 'Total Revenue', SUM(E) 'Total Units'", 1), "Select a valid quarter in cell L1")
```

**Why `TEXT(L2,"yyyy-MM-dd")` is used:** QUERY date literals must be in ISO format inside the query string. Concatenating a raw date cell reference (`L2`) would insert a serial number (e.g., 45658) into the string, which QUERY cannot interpret. `TEXT(L2,"yyyy-MM-dd")` converts the date to the required `2025-01-01` string format before concatenation.

### Dynamic Query Clause Breakdown
```
"SELECT D, SUM(F), SUM(E)
 WHERE A >= date '"&TEXT(L2,"yyyy-MM-dd")&"'    -- L2 = start date (e.g., 2025-01-01)
 AND A <= date '"&TEXT(L3,"yyyy-MM-dd")&"'       -- L3 = end date (e.g., 2025-03-31)
 GROUP BY D
 ORDER BY SUM(F) DESC
 LABEL D 'Product Category', SUM(F) 'Total Revenue', SUM(E) 'Total Units'"
```

The query string is assembled by concatenation at runtime. The `"` characters at each `&` junction close and reopen the string literal.

---

### Common Variations

| Use Case | Formula |
|---------|---------|
| Filter by region AND quarter | `=QUERY(A1:F, "SELECT D, SUM(F), SUM(E) WHERE A >= date '2025-01-01' AND A <= date '2025-03-31' AND C = 'West' GROUP BY D ORDER BY SUM(F) DESC LABEL D 'Category', SUM(F) 'Revenue', SUM(E) 'Units'", 1)` |
| Show revenue share % (requires helper column) | Place QUERY in H2:J, then in K3: `=J3/SUM(J3:J$10)` formatted as % |
| Add average deal size column | `=QUERY(A1:F, "SELECT D, SUM(F), COUNT(E), SUM(F)/COUNT(E) WHERE A >= date '2025-01-01' AND A <= date '2025-03-31' GROUP BY D ORDER BY SUM(F) DESC LABEL D 'Category', SUM(F) 'Revenue', COUNT(E) 'Deals', SUM(F)/COUNT(E) 'Avg Deal'", 1)` |
| Crosstab: revenue by category by quarter (PIVOT) | `=QUERY(A1:F, "SELECT D, SUM(F) GROUP BY D PIVOT QUARTER(A) LABEL D 'Category'", 1)` -- note: QUARTER() is a QUERY date function that extracts quarter number |
| Top 3 categories only | `=QUERY(A1:F, "SELECT D, SUM(F), SUM(E) WHERE A >= date '2025-01-01' AND A <= date '2025-03-31' GROUP BY D ORDER BY SUM(F) DESC LIMIT 3 LABEL D 'Category', SUM(F) 'Revenue', SUM(E) 'Units'", 1)` |
| Exclude a specific category | `=QUERY(A1:F, "SELECT D, SUM(F), SUM(E) WHERE A >= date '2025-01-01' AND A <= date '2025-03-31' AND D != 'Training' GROUP BY D ORDER BY SUM(F) DESC LABEL D 'Category', SUM(F) 'Revenue', SUM(E) 'Units'", 1)` |
| Using MATCHES for multiple category filter | `=QUERY(A1:F, "SELECT D, SUM(F) WHERE D MATCHES 'Hardware|Software|Services' AND A >= date '2025-01-01' GROUP BY D ORDER BY SUM(F) DESC LABEL D 'Category', SUM(F) 'Revenue'", 1)` |

---

### Excel Equivalent

**If you need this in Excel:**

Excel does not have a QUERY function. Two equivalent approaches:

**Option 1 -- Pivot Table (recommended for occasional analysis):**
1. Click any cell in your data table
2. Insert > PivotTable > New Sheet
3. Drag "Product Category" to Rows, "Revenue" and "Units Sold" to Values (set both to Sum)
4. Drag "Date" to Filters, then filter to Q1 2025 using the date filter
5. Sort by Sum of Revenue descending using the dropdown arrow on the Revenue column
6. **Limitation:** Pivot tables do not update automatically -- you must right-click > Refresh after data changes

**Option 2 -- SUMIFS formula (for live dashboard):**
```
=SUMIFS(F:F, D:D, H3, A:A, ">="&DATE(2025,1,1), A:A, "<="&DATE(2025,3,31))
```
Where H3 contains the product category name. Requires manually maintaining a list of category names in column H.

**Key difference to watch for:** Excel SUMIFS does not generate the category list automatically -- you must hardcode or separately extract unique category values. Sheets QUERY generates both the dimension list and the aggregates in one formula.

---

### Troubleshooting

| Error or Symptom | Cause | Fix |
|---|---|---|
| `Unable to parse query string` | Double quotes used inside WHERE clause (`WHERE C = "West"`), or smart/curly quotes used instead of straight single quotes | Replace with single straight quotes: `WHERE C = 'West'`. Check that markdown rendering hasn't converted `'` to `'` |
| Date filter returns no rows despite matching data | Date column stored as text (left-aligned in cells), so `date '2025-01-01'` comparison fails silently | Test with `=ISNUMBER(A2)`. If FALSE, convert column: select column A > Data > Data cleanup > Convert to date, or use a helper column with `=ARRAYFORMULA(IF(A2:A="","",DATEVALUE(A2:A)))` |
| Output numbers formatted as dates | QUERY inherits the cell format of the first data row; if revenue column was briefly formatted as dates, output inherits that format | Select the output cells > Format > Number > Accounting or Number |
| `#REF!` error on QUERY output | The QUERY result is trying to spill into cells that are already occupied (another formula, a value, or a merged cell) | Clear all cells in the expected output range (H2 and all cells to the right and below) before entering the formula |
| Headers parameter confusion: first data row treated as a header | Headers parameter set to 0 but data has a header row, or vice versa | Set to `1` if row 1 of the range has column label text; set to `0` if there is no header and all rows are data |
| `SUM(F)/COUNT(E)` in QUERY returns zero | Division in QUERY operates on aggregated integers; if COUNT returns 0 for a group, division by zero produces 0 silently instead of an error | Add `WHERE E IS NOT NULL` to the query to exclude groups with no matching rows before division |
| Dynamic query with `TEXT(L2,...)` returns parse error | L2 is empty (no quarter selected yet) so `TEXT("","yyyy-MM-dd")` returns empty string, creating `date ''` which is invalid | The `IFERROR(...)` wrapper catches this -- ensure it is included. Also set a default value in L1 to prevent the blank state |
| QUERY output disappears when scrolling | The QUERY formula cell has scrolled out of view and users think output is gone | QUERY output spills downward from the formula cell. The formula cell always contains the formula; lower cells contain spilled values. Nothing is wrong -- scroll back to H2 |
