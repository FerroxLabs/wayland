---
name: spreadsheet-data-cleaning
description: |
  Produces spreadsheet-native data cleaning formulas and operations. Generates exact TRIM, CLEAN, TEXT, SUBSTITUTE formulas for text issues, IF/IFERROR wrappers for null handling, COUNTIF for duplicate detection, and a cleaning sequence with before/after column strategy.
  Use when the user needs to clean data using spreadsheet formulas rather than external tools.
  Do NOT use for a full data cleaning protocol across any tool (use data-cleaning-protocol), setting up validation rules (use data-validation-setup), or auditing a spreadsheet model (use spreadsheet-model-audit).
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
# Spreadsheet Data Cleaning

## When to Use

**Use this skill when:**
- The user has a dataset open in Excel or Google Sheets and describes specific data quality problems -- extra spaces, inconsistent casing, phone numbers in multiple formats, dates stored as text, currency fields with symbols embedded, or columns with mixed types
- The user asks a formula-level question such as "how do I strip the dollar sign from this column," "how do I find all the duplicate emails," or "how do I fill in the blanks with the value from the row above"
- The user needs a repeatable, auditable cleaning workflow that lives inside the spreadsheet itself -- no Python, no Power Query, no SQL -- just formulas dragged down a column
- The user is preparing data for a pivot table, VLOOKUP/XLOOKUP, dashboard, or chart and the joins or aggregations are failing because of formatting mismatches
- The user has received a data export (from a CRM, ERP, survey tool, or database) and needs to normalize it before analysis
- The user needs a non-destructive cleaning approach where the original data is preserved and cleaned versions live in helper columns for verification
- The user is working with a shared workbook and cannot run external scripts -- all transformations must be formula-based and reviewable by non-technical stakeholders

**Do NOT use when:**
- The user wants a tool-agnostic data cleaning protocol covering Python pandas, SQL, R, and spreadsheets -- use `data-cleaning-protocol` instead, which handles cross-tool strategy
- The user wants to set up data validation rules (dropdown lists, input masks, range checks) to prevent dirty data from entering the spreadsheet in the future -- use `data-validation-setup`
- The user wants to audit formula integrity, circular references, or dependency chains in a financial or analytical model -- use `spreadsheet-model-audit`
- The user wants to write a Python script using pandas, OpenRefine, or a SQL-based cleaning pipeline -- this is outside the scope of spreadsheet-native formulas
- The user is working with datasets larger than ~500,000 rows in Excel -- at that scale, spreadsheet formulas become unreliable and Power Query or Python is more appropriate; redirect to `data-cleaning-protocol`
- The user wants to set up macros or VBA to automate cleaning -- this skill is strictly formula-based and spreadsheet-portable
- The user is asking about data modeling, schema normalization, or database design -- those are structural concerns, not formula-level cleaning concerns

---

## Process

### Step 1: Diagnose the Data Quality Issues Before Writing a Single Formula

Before prescribing formulas, gather enough information to understand the shape of the problem. Ask the user for:

- **Column inventory:** What are the column names, data types (text, number, date, boolean), and approximate row count? A column described as "customer ID" behaves differently from "product description."
- **Sample values:** Request 3-5 representative dirty values per problem column. Do not assume what "inconsistent formatting" means -- "555-1234," "(555) 123-4567," and "5551234" are three different phone problems requiring different formulas.
- **Source system:** Was this exported from Salesforce, a MySQL dump, a survey platform, or typed manually? Source systems have predictable error patterns (e.g., Salesforce exports often have trailing spaces in lookup fields; Google Forms responses often have inconsistent casing).
- **Cleaning intent:** Does the user need exact matching (joining on customer ID), display formatting (printing a report), or analysis-readiness (summing a revenue column)?
- **Destructive vs. non-destructive:** Should cleaning happen in-place (overwriting original values after paste-as-values) or in new columns that run in parallel? Default to non-destructive unless the user explicitly says otherwise.
- **Platform:** Excel (which version -- 365, 2019, 2016?) or Google Sheets? XLOOKUP, LET, and BYROW are available in Excel 365 and Google Sheets but not in Excel 2016. ARRAYFORMULA is Google Sheets-only.

Run a quick audit with these diagnostic formulas before building the cleaning sequence:

```
=COUNTBLANK(A2:A1001)          -- count empty cells in a 1000-row column
=SUMPRODUCT(--ISERROR(A2:A1001))  -- count error values (any type)
=SUMPRODUCT(--(LEN(A2:A1001)<>LEN(TRIM(A2:A1001))))  -- count cells with extra spaces
=SUMPRODUCT(--(A2:A1001<>LOWER(A2:A1001)))  -- count cells that are not all lowercase
=SUMPRODUCT(--(ISNUMBER(A2:A1001)*1))  -- count numeric values in a column
```

These five formulas identify the scope of problems quantitatively before any cleaning begins. Report these counts to the user so they can verify the cleaning worked afterward.

---

### Step 2: Apply Text Cleaning Formulas -- Strip, Normalize, Standardize

Text columns are the most common source of data quality failures. Apply formulas in the order below -- the sequence matters because CLEAN must run before TRIM (CLEAN can create spaces, TRIM removes them), and case normalization should run before SUBSTITUTE (so you match on a known case).

**Whitespace and non-printable character removal:**

| Problem | Formula | Notes |
|---|---|---|
| Leading/trailing/double spaces | `=TRIM(A2)` | Reduces all internal runs of spaces to a single space |
| Non-printable ASCII chars 0-31 | `=CLEAN(A2)` | Removes line feeds (CHAR 10), carriage returns (CHAR 13), tabs (CHAR 9) |
| Both problems together | `=TRIM(CLEAN(A2))` | Standard baseline -- apply this to every text column by default |
| Non-breaking space (CHAR 160) | `=TRIM(CLEAN(SUBSTITUTE(A2,CHAR(160)," ")))` | CHAR(160) is invisible and survives TRIM without this SUBSTITUTE |
| Smart quotes (left/right) | `=SUBSTITUTE(SUBSTITUTE(A2,CHAR(8220),""""),CHAR(8221),"""")` | Replaces curved left (8220) and right (8221) double quotes with straight quotes |
| Em dash to hyphen | `=SUBSTITUTE(A2,CHAR(8212),"-")` | CHAR(8212) is the em dash; also handle en dash CHAR(8211) |
| Bullet points and symbols | `=SUBSTITUTE(A2,CHAR(8226),"")` | CHAR(8226) is the bullet; chain multiple CHAR SUBSTITUTEs as needed |

**Case standardization:**

| Output needed | Formula | Caution |
|---|---|---|
| All uppercase | `=UPPER(A2)` | Use for codes, IDs, country codes, state abbreviations |
| All lowercase | `=LOWER(A2)` | Use for email addresses, usernames, URLs |
| Title case | `=PROPER(A2)` | Use for names, addresses -- but PROPER incorrectly capitalizes "Of", "The", "McDonald" etc. |
| Sentence case (first letter only) | `=UPPER(LEFT(A2,1))&LOWER(MID(A2,2,LEN(A2)))` | More controlled than PROPER for description fields |

**Targeted replacement:**

For known bad values, chain SUBSTITUTE calls:
```
=TRIM(CLEAN(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(A2,"N/A",""),"-",""),".",".")))
```
Build the chain from the innermost substitution outward. Each SUBSTITUTE wraps the previous result. Limit chains to 5-6 levels before recommending a VLOOKUP mapping table approach (see Step 5).

**Splitting compound fields:**

| Problem | Formula |
|---|---|
| First word only | `=LEFT(A2,FIND(" ",A2&" ")-1)` | The appended space handles cells with only one word |
| Text before first comma | `=LEFT(A2,FIND(",",A2)-1)` | Fails if no comma -- wrap with IFERROR |
| Text after first comma | `=MID(A2,FIND(",",A2)+2,LEN(A2))` | +2 skips the comma and the space after it |
| Last word / suffix | `=TRIM(MID(A2,FIND(CHAR(1),SUBSTITUTE(A2," ",CHAR(1),LEN(A2)-LEN(SUBSTITUTE(A2," ",""))))+1,LEN(A2)))` | Finds the position of the last space by replacing the Nth space |
| Text between two delimiters | `=MID(A2,FIND("[",A2)+1,FIND("]",A2)-FIND("[",A2)-1)` | Extracts content between brackets; adapt delimiters as needed |

---

### Step 3: Handle Null Values, Blanks, and Errors -- Explicitly and Intentionally

Blank cells and error values propagate silently through aggregations, lookups, and pivot tables. Every formula that touches a potentially empty or error-prone value must be wrapped.

**Blank detection and handling:**

```
=IF(A2="","[MISSING]",A2)               -- flag missing text values visibly
=IF(A2=0,"",(A2))                       -- treat 0 as blank for display (only if 0 is not a valid value)
=IF(ISBLANK(A2),"Unknown",A2)           -- ISBLANK is stricter than ="" (misses formula-generated empty strings)
=IF(LEN(TRIM(A2))=0,"[EMPTY]",TRIM(A2)) -- catches cells that contain only spaces
```

**Error handling:**

```
=IFERROR(VLOOKUP(A2,RefTable,2,FALSE),"Not Found")  -- safe VLOOKUP wrapper
=IFNA(VLOOKUP(A2,RefTable,2,FALSE),"Not Found")     -- only catches #N/A, lets #REF! and #VALUE! surface
=IFERROR(VALUE(A2),A2)                              -- attempt conversion; return original if it fails
```

**Distinguish between IFERROR and IFNA:** Use IFNA when you want lookup misses to show "Not Found" but you still want structural errors (#REF!, #DIV/0!) to be visible. Use IFERROR only when you are confident any error should produce the fallback value.

**Fill-down (propagate last known value):**

```
=IF(A2="",A1,A2)
```
This pattern works for hierarchical data (e.g., a "Region" column that only has a value in the first row of each region group). Drag down from row 3 onward. The formula references A1 (the row above), not a fixed cell.

**Count-based null audit:**

```
=COUNTBLANK(A2:A1001)       -- total blanks (includes cells with formula returning "")
=COUNTA(A2:A1001)           -- non-blank cells
=ROWS(A2:A1001)-COUNTA(A2:A1001)  -- blank count alternative that excludes formula-empty cells
```

---

### Step 4: Convert Data Types -- Numbers, Dates, and Currency

Type mismatches are the leading cause of formula failures and incorrect aggregations. A column of numbers stored as text will produce a SUM of zero and fail a VLOOKUP numeric match.

**Number conversion:**

| Problem | Formula | Notes |
|---|---|---|
| Text-formatted number | `=VALUE(A2)` | Fails if any non-numeric character is present |
| Number with currency symbol | `=VALUE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(A2,"$",""),",","")," ",""))` | Strip $, commas, spaces before converting |
| Percentage stored as text | `=VALUE(SUBSTITUTE(A2,"%",""))/100` | Remove % then divide by 100 |
| Number with parentheses for negative | `=IF(LEFT(A2,1)="(",VALUE(SUBSTITUTE(SUBSTITUTE(A2,"(",""),")",""))*-1,VALUE(A2))` | Accounting-style (123) means -123 |
| Number with trailing minus sign | `=IF(RIGHT(TRIM(A2),1)="-",VALUE(LEFT(TRIM(A2),LEN(TRIM(A2))-1))*-1,VALUE(A2))` | Some European formats trail the minus |

**Detect text-stored numbers (Excel diagnostic):**
```
=ISNUMBER(A2)               -- returns FALSE if number is stored as text
=SUMPRODUCT(--(NOT(ISNUMBER(A2:A1001))*ISNUMBER(VALUE(A2:A1001))))  -- count text-stored numbers in range
```

**Date conversion:**

Dates are the most error-prone type conversion because interpretation is locale-dependent. A date exported as "04/05/2024" is April 5 in the US locale and May 4 in the UK locale. Always clarify the source format first.

| Problem | Formula | Notes |
|---|---|---|
| Text date in MM/DD/YYYY | `=DATE(MID(A2,7,4),LEFT(A2,2),MID(A2,4,2))` | Explicit positional parsing -- locale-independent |
| Text date in DD/MM/YYYY | `=DATE(MID(A2,7,4),MID(A2,4,2),LEFT(A2,2))` | Swap month and day positions |
| Text date in YYYY-MM-DD (ISO 8601) | `=DATEVALUE(A2)` | Works natively in most locale settings |
| Date as 8-digit number (20240405) | `=DATE(LEFT(A2,4),MID(A2,5,2),RIGHT(A2,2))` | Common in database exports |
| Excel serial number to date | `=TEXT(A2,"YYYY-MM-DD")` | Serial 45387 displays as a date string |
| Inconsistent separators (/ vs -) | `=DATEVALUE(SUBSTITUTE(SUBSTITUTE(A2,"/","-"),".","-"))` | Normalize separators first |

**Target date output format for analysis:** Always output dates in ISO 8601 format (YYYY-MM-DD) for downstream compatibility. Use `=TEXT(date_formula,"YYYY-MM-DD")` to produce a text string, or leave as a date serial and apply cell formatting separately.

---

### Step 5: Detect and Handle Duplicates

Duplicate detection requires a decision about what constitutes a duplicate: exact match, case-insensitive match, or fuzzy match. Spreadsheet formulas handle the first two natively. Fuzzy matching requires a helper approach.

**Exact duplicate detection:**

```
=IF(COUNTIF(A$2:A2,A2)>1,"DUPLICATE","FIRST")
```

The expanding range `A$2:A2` is the critical technique: the top boundary is locked ($2), the bottom boundary grows with each row. For row 5, this evaluates `A$2:A5`. This correctly identifies the first occurrence as FIRST and all subsequent occurrences as DUPLICATE.

**Case-insensitive duplicate detection:**

COUNTIF in Excel is case-insensitive by default, so `COUNTIF(A$2:A2,A2)` already treats "Apple" and "apple" as the same value. To force case-sensitive duplicate detection (rare but needed for passwords, codes), use:
```
=SUMPRODUCT((EXACT(A$2:A2,A2))*1)>1
```

**Multi-column composite key duplicates:**

When uniqueness is defined by a combination of columns (e.g., CustomerID + OrderDate must be unique), concatenate them:
```
=IF(COUNTIF(E$2:E2,E2)>1,"DUPLICATE","")
```
Where column E contains: `=A2&"|"&TEXT(B2,"YYYY-MM-DD")` -- the pipe delimiter prevents false collisions where "John" + "Smith" and "Johns" + "mith" would otherwise look identical.

**Summary counts:**

```
=COUNTIF(F2:F1001,"DUPLICATE")   -- total duplicate rows (not counting FIRST occurrences)
=SUMPRODUCT((COUNTIF(A2:A1001,A2:A1001)>1)/COUNTIF(A2:A1001,A2:A1001))  -- count of unique values that have at least one duplicate
```

**Removing duplicates non-destructively:**
Excel's built-in Data > Remove Duplicates is destructive (deletes rows in-place). For non-destructive deduplication, use UNIQUE in Excel 365 or Google Sheets:
```
=UNIQUE(A2:A1001)       -- returns unique values as a spilled array
=UNIQUE(A2:C1001)       -- unique rows across multiple columns
```
In Excel 2016 and 2019 (no UNIQUE function), the only non-destructive option is to copy the column to a separate sheet and apply Remove Duplicates there.

---

### Step 6: Handle Large-Scale Text Standardization with Lookup Tables

When a column has more than 10-15 distinct bad values requiring replacement, nested SUBSTITUTE chains become unmanageable. Use a mapping table approach instead.

**Build a mapping table:**
1. Extract all unique values from the dirty column: copy the column, paste to a helper area, apply Data > Remove Duplicates
2. Add a second column next to the unique values: "Correct Value"
3. Fill in the correct value for each dirty value (leave blanks for values that are already correct)
4. Name the table range `CleaningMap` (Insert > Name > Define in Excel, or simply use an absolute range reference)

**Apply the mapping:**
```
=IFERROR(VLOOKUP(TRIM(LOWER(A2)),CleaningMap,2,FALSE),TRIM(LOWER(A2)))
```
The IFERROR fallback returns the normalized (trim+lower) original value for anything not found in the mapping table. This means values that are already correct pass through cleanly.

**For Excel 365 / Google Sheets, use XLOOKUP:**
```
=IFERROR(XLOOKUP(TRIM(LOWER(A2)),CleaningMap[Raw],CleaningMap[Clean]),TRIM(LOWER(A2)))
```
XLOOKUP is preferred because it does not require the lookup column to be the leftmost column in the range.

---

### Step 7: Build the Complete Cleaning Sequence -- Order Matters

The sequence in which cleaning operations are applied determines whether they succeed or fail. Run operations in this order:

1. **CLEAN then TRIM** -- remove non-printable characters first (CLEAN can introduce spaces), then remove spaces. `=TRIM(CLEAN(A2))` is the correct nesting order.
2. **CHAR(160) substitution** -- before TRIM, handle non-breaking spaces that TRIM ignores: `=TRIM(CLEAN(SUBSTITUTE(A2,CHAR(160)," ")))`
3. **Case normalization** -- after whitespace removal, so the case function operates on clean input
4. **SUBSTITUTE for known bad strings** -- after case normalization, so you can match on a predictable case
5. **Type conversion (VALUE, DATEVALUE, DATE)** -- after all text cleaning, so the string being converted is clean
6. **Blank/error handling (IF, IFERROR)** -- outermost wrapper, catches failures from inner operations
7. **Duplicate flagging** -- after all cleaning is complete, so duplicates are detected against cleaned values, not raw values
8. **Validation audit** -- final step: compare diagnostic formula counts from Step 1 against post-cleaning counts

**Combined master formula for a text field:**
```
=IFERROR(IF(LEN(TRIM(CLEAN(SUBSTITUTE(A2,CHAR(160)," "))))=0,"[MISSING]",PROPER(TRIM(CLEAN(SUBSTITUTE(A2,CHAR(160)," "))))),A2)
```
This single formula handles: non-printable chars, non-breaking spaces, extra whitespace, empty/whitespace-only cells, and title-case normalization -- with an IFERROR fallback to the raw original value if anything fails.

---

### Step 8: Validate -- Prove the Cleaning Worked

Every cleaning session must end with a validation step that compares before-and-after metrics. This is not optional -- silent failures (where a formula returns the wrong value without an error) are common in complex nested formulas.

Run these validation checks against both the original column and the cleaned column:

```
=COUNTA(A2:A1001)                           -- non-blank count (should be equal or higher after cleaning)
=COUNTBLANK(A2:A1001)                       -- blank count (should be equal or lower after cleaning)
=SUMPRODUCT(--ISERROR(E2:E1001))            -- error count in cleaned column (should be 0)
=SUMPRODUCT(--(LEN(E2:E1001)<>LEN(TRIM(E2:E1001))))  -- remaining extra-space cells (should be 0)
=SUMPRODUCT(--(E2:E1001<>LOWER(E2:E1001)))  -- cells not in expected case (for lowercase-expected columns)
=SUMPRODUCT(--(LEN(E2:E1001)=0)*1)         -- count of empty-string cells (different from COUNTBLANK)
```

Present these results in a before/after table. If any post-cleaning count is worse than the original (e.g., more blanks after cleaning than before), there is a formula error that must be investigated before proceeding.

---

## Output Format

```
## Spreadsheet Cleaning Plan

### Diagnostic Summary (Pre-Cleaning)
| Column | Type | Total Rows | Blanks | Errors | Extra Spaces | Duplicates |
|--------|------|-----------|--------|--------|-------------|-----------|
| [Col A name] | [text/number/date] | [N] | [=COUNTBLANK] | [=SUMPRODUCT] | [=SUMPRODUCT LEN check] | [=COUNTIF count] |
| [Col B name] | ... | ... | ... | ... | ... | ... |

**Cleaning mode:** Non-destructive (helper columns) / In-place (paste-values after verification)
**Platform:** Excel 365 / Excel 2019 / Google Sheets

---

### Cleaning Operations

#### Operation [N]: [Column Name] -- [Problem Description]
**Source column:** [Letter or name]
**Output column:** [Letter or name -- new helper column]
**Formula (paste into [cell reference], drag down [N] rows):**
```
=[exact formula string]
```
**Sequence rationale:** [Why functions are ordered this way -- e.g., "CLEAN before TRIM because CLEAN can produce spaces"]
**Expected transformation:**
- Before: `[sample dirty value 1]` -- After: `[expected clean value 1]`
- Before: `[sample dirty value 2]` -- After: `[expected clean value 2]`
- Before: `[blank / error case]` -- After: `[fallback value]`

---

### Duplicate Detection
**Scope:** [Column(s) defining uniqueness]
**Key construction formula (if multi-column):**
```
=[concatenation formula for composite key column]
```
**Duplicate flag formula:**
```
=IF(COUNTIF([col]$2:[col]2,[col]2)>1,"DUPLICATE","FIRST")
```
**Summary count:** `=COUNTIF([flag_col]2:[flag_col][last_row],"DUPLICATE")`
**Action required:** [Delete DUPLICATE rows / Review manually / Keep all and flag]

---

### Validation (Post-Cleaning)
| Check | Original Formula | Original Value | Cleaned Formula | Cleaned Value | Pass? |
|-------|-----------------|---------------|----------------|--------------|-------|
| Non-blank count | `=COUNTA([orig])` | [N] | `=COUNTA([clean])` | [N] | ✓ / ✗ |
| Blank count | `=COUNTBLANK([orig])` | [N] | `=COUNTBLANK([clean])` | [N] | ✓ / ✗ |
| Error count | `=SUMPRODUCT(--ISERROR([orig]))` | [N] | `=SUMPRODUCT(--ISERROR([clean]))` | 0 | ✓ / ✗ |
| Remaining spaces | `=SUMPRODUCT(--(LEN([orig])<>LEN(TRIM([orig]))))` | [N] | [same for cleaned] | 0 | ✓ / ✗ |
| Type consistency | `=SUMPRODUCT(--(NOT(ISNUMBER([col]))))` | [N] | [same for cleaned] | 0 | ✓ / ✗ |

---

### Finalization Instructions
1. Review the cleaned columns for unexpected values before overwriting originals
2. Select the cleaned column range (e.g., E2:E1001)
3. Copy (Ctrl+C / Cmd+C)
4. Select the target column (e.g., B2)
5. Paste Special > Values Only (Ctrl+Shift+V in Google Sheets; Alt+E+S+V in Excel)
6. Delete the helper columns after verification
7. Save a backup copy of the original file before any paste-values operation
```

---

## Rules

1. **Always write the exact, paste-ready formula -- never describe intent without formula.** If you say "use TRIM to remove spaces," the formula `=TRIM(A2)` must appear immediately. The user should be able to copy the formula directly from your response.

2. **Always recommend non-destructive cleaning (new helper columns) unless the user explicitly requests in-place modification.** Paste-as-values should be the final step after the user has verified results, never the first.

3. **Nest cleaning functions inside out -- innermost runs first.** In `=TRIM(CLEAN(SUBSTITUTE(A2,CHAR(160)," ")))`, the execution order is: SUBSTITUTE first, then CLEAN, then TRIM. Always explain this order so the user understands why the formula is structured this way.

4. **Use the expanding-range duplicate pattern `COUNTIF(A$2:A2,A2)` -- never `COUNTIF(A:A,A2)`.** The full-column version `A:A` marks every occurrence as a duplicate including the first one, making it impossible to identify which row to keep. The expanding range correctly marks only the second and subsequent occurrences.

5. **Use IFNA instead of IFERROR for VLOOKUP and XLOOKUP unless you have a specific reason to suppress all errors.** IFERROR silently hides #REF! errors (broken column references) and #VALUE! errors (wrong argument types), which are structural bugs, not data misses. IFNA catches only #N/A (lookup miss), which is the intended case.

6. **CLEAN does not remove CHAR(160) (non-breaking space) -- always add a SUBSTITUTE before TRIM for text that originated in web exports, HTML, or Word documents.** Forgetting this is the single most common reason TRIM appears to fail. The formula `=TRIM(CLEAN(A2))` will leave non-breaking spaces intact; `=TRIM(CLEAN(SUBSTITUTE(A2,CHAR(160)," ")))` will not.

7. **For date columns, always ask the source format before writing a date conversion formula.** `=DATEVALUE(A2)` relies on system locale and will silently produce wrong dates for DD/MM/YYYY values on a US-locale machine. Explicit positional parsing with `=DATE(MID(A2,7,4),LEFT(A2,2),MID(A2,4,2))` is locale-independent and always safer.

8. **Always include a numeric validation step that compares COUNTBLANK and SUMPRODUCT(--ISERROR()) before and after cleaning.** A cleaning formula that silently converts 200 values to blanks or errors has made the data worse, not better, and the user cannot detect this without explicit before/after counts.

9. **When nesting more than 5 SUBSTITUTE calls, switch to a VLOOKUP/XLOOKUP mapping table instead.** Deeply nested SUBSTITUTE chains are unmaintainable, hard to debug, and produce cryptic error messages when a nested value is wrong. A mapping table is auditable, editable, and scales to hundreds of substitutions.

10. **Never suggest PROPER() as a final name-cleaning formula without warning the user about its limitations.** PROPER incorrectly capitalizes particles ("Of", "The", "De", "Van"), hyphenated names ("Mary-anne" becomes "Mary-Anne" -- actually correct -- but "McDonald" becomes "Mcdonald"), and initializations ("II" becomes "Ii"). Flag this and provide the workaround of using a correction mapping table for known exceptions.

11. **In Google Sheets, ARRAYFORMULA can apply a cleaning formula to an entire column without dragging.** `=ARRAYFORMULA(TRIM(CLEAN(B2:B1001)))` fills the entire range in one formula. However, ARRAYFORMULA does not work with every function (notably IFERROR wrapping can behave differently) -- always test with a 5-row sample before deploying.

12. **Always qualify whether a formula produces a text string or a number/date, and make the distinction explicit.** `=TEXT(A2,"YYYY-MM-DD")` produces a text string that looks like a date -- it cannot be used in DATEDIF or subtraction. `=DATEVALUE(A2)` produces a date serial number that can be used in calculations but must be formatted as a date for display. Confusing these two is a common source of downstream errors.

---

## Edge Cases

### 1. Numbers Stored as Text (The Green Triangle Problem)
Excel marks number-stored-as-text cells with a small green triangle in the top-left corner. `VALUE(A2)` alone will fail if the text contains any non-numeric characters (spaces, commas, currency symbols, percent signs).

**Diagnostic:** `=ISNUMBER(A2)` returns FALSE for these cells.

**Full-coverage formula:**
```
=IFERROR(VALUE(TRIM(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(A2,"$",""),",",""),"%","")," ",""))),A2)
```
Strip the four most common non-numeric characters (dollar sign, comma, percent sign, space), TRIM the result, then convert. The outer IFERROR returns the raw original value if conversion still fails -- do not silently return 0, because 0 is a valid data value and masking it creates incorrect aggregations.

After applying this formula, run `=SUMPRODUCT(--(NOT(ISNUMBER(E2:E1001))))` on the cleaned column to confirm all values are now truly numeric.

---

### 2. Dates in Ambiguous Mixed Formats Within the Same Column
A column containing both "03/04/2025" and "25/03/2025" is not uniformly parseable. The first value could be March 4 (MM/DD) or April 3 (DD/MM). The second is unambiguously DD/MM because no month goes to 25. Mixed-format columns are a data governance problem, not a formula problem.

**Handling strategy:**
1. Flag rows where both day and month are <= 12 as "AMBIGUOUS": `=IF(AND(VALUE(LEFT(A2,2))<=12,VALUE(MID(A2,4,2))<=12),"AMBIGUOUS","UNAMBIGUOUS")`
2. Flag rows where the first number is > 12 as definitively DD/MM: `=IF(VALUE(LEFT(A2,2))>12,"DD/MM_CONFIRMED","CHECK")`
3. Present the count of ambiguous rows to the user and require manual resolution -- do not auto-correct dates you cannot reliably identify
4. After the user resolves ambiguous rows, apply the explicit positional DATE formula to the full column

**Rule:** Never use DATEVALUE() on a column with known mixed formats. It will silently pick one interpretation based on locale and produce a column of half-correct dates.

---

### 3. Unicode Characters, Smart Quotes, and Characters from Copy-Paste
Text copied from Microsoft Word, PDF readers, web browsers, and email clients frequently contains Unicode characters that look like standard ASCII but are not: curly quotes (CHAR 8216, 8217, 8220, 8221), em dashes (CHAR 8212), en dashes (CHAR 8211), ellipsis (CHAR 8230), and non-breaking spaces (CHAR 160). CLEAN removes only CHAR 0-31 and CHAR 127. All of these Unicode characters survive CLEAN untouched.

**Comprehensive Unicode cleaning formula:**
```
=TRIM(CLEAN(
  SUBSTITUTE(SUBSTITUTE(
    SUBSTITUTE(SUBSTITUTE(
      SUBSTITUTE(SUBSTITUTE(
        SUBSTITUTE(A2,
          CHAR(8220),""""),CHAR(8221),""""),
        CHAR(8216),"'"),CHAR(8217),"'"),
      CHAR(8211),"-"),CHAR(8212),"-"),
    CHAR(8230),"..."),
  CHAR(160)," ")))
```
This handles: left/right double quotes, left/right single quotes/apostrophes, en dash, em dash, ellipsis, and non-breaking space -- the seven most common Unicode intrusions in business text data.

**Detection formula to identify affected rows:**
```
=SUMPRODUCT(--(LEN(A2:A1001)>LEN(SUBSTITUTE(SUBSTITUTE(A2:A1001,CHAR(8220),""),CHAR(8217),""))))
```

---

### 4. Cleaning Data Across Multiple Sheets Without Copying
When the source data lives on Sheet2 and the user wants cleaned output on Sheet1 (or a separate "Clean" sheet), cross-sheet formula references work identically:

```
=TRIM(CLEAN(Sheet2!A2))
=IFERROR(VLOOKUP(TRIM(LOWER(Sheet2!A2)),CleaningMap,2,FALSE),TRIM(LOWER(Sheet2!A2)))
=IF(COUNTIF(Sheet2!A$2:Sheet2!A2,Sheet2!A2)>1,"DUPLICATE","FIRST")
```

The cleaning sheet serves as the audited, verified output while the source sheet remains completely untouched -- the ideal non-destructive architecture. Name the sheets clearly: "Raw_Data" and "Cleaned_Data." This pattern also makes it easy to re-run cleaning if the source is refreshed.

**Google Sheets cross-file reference:** If the source is a separate Google Sheets file, use IMPORTRANGE:
```
=TRIM(CLEAN(IMPORTRANGE("spreadsheet_url","Sheet1!A2")))
```
Note that IMPORTRANGE imports static snapshots that refresh periodically -- it does not reflect live edits in real time and requires the user to authorize the connection between files.

---

### 5. Very Long Text Fields With Truncation Risk in Excel
Excel has a cell content limit of 32,767 characters per cell, but a formula result can display at most 32,767 characters. This is rarely a problem for structured data, but it matters for columns containing long-form text (survey responses, notes, comments). CLEAN and TRIM applied to a 30,000-character cell can cause performance issues in worksheets with thousands of such rows.

**Symptom:** The worksheet becomes unresponsive when dragging the formula down, or the formula bar shows "#VALUE!" errors unexpectedly.

**Mitigation:**
- Process in batches of 500-1,000 rows at a time rather than dragging to row 50,000 in one operation
- After each batch, select the cleaned cells, copy, and paste-as-values to freeze results and reduce formula load
- For genuinely large text, consider whether CLEAN/TRIM are actually necessary -- truncated cleaning (clean only the first 200 characters) may be sufficient: `=TRIM(CLEAN(LEFT(A2,200)))`

---

### 6. Cleaning Phone Numbers That Have Extensions, Country Codes, or Impossible Lengths
A phone cleaning formula that strips all non-digit characters will produce a 7-digit local number, a 10-digit national number, an 11-digit number with country code (1-555-123-4567), and a 15-digit international number -- all in the same "cleaned" column. There is no single reformatting formula that handles all of these.

**Strategy:**
1. Strip to digits only first: `=SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(TRIM(A2),"(",""),")",""),"-","")," ",""),".","")`
2. Flag by digit length: `=LEN(B2)` where B2 is the digit-stripped result
3. Apply format only to 10-digit numbers (US standard): `=IF(LEN(B2)=10,"("&LEFT(B2,3)&") "&MID(B2,4,3)&"-"&RIGHT(B2,4),"REVIEW: "&B2)`
4. Flag 11-digit numbers (with country code 1): `=IF(LEN(B2)=11,"+"&LEFT(B2,1)&" ("&MID(B2,2,3)&") "&MID(B2,5,3)&"-"&RIGHT(B2,4),"REVIEW: "&B2)`
5. Send anything not 10 or 11 digits to a "REVIEW" flag so the user handles edge cases manually

**Never silently truncate phone numbers.** Dropping digits from a phone number produces a working-looking but wrong number.

---

### 7. Cleaning a Column Where Some Cells Contain Formulas (Not Raw Values)
If some cells in the source column already contain formulas (e.g., `=CONCATENATE(C2," ",D2)`), the cleaning formula references the formula result, not the underlying formula. This is usually fine -- TRIM and CLEAN work on any text value regardless of whether it was typed or formula-generated.

**Problem case:** If a cell in the source column contains a formula that references cells in a row being deleted or reorganized, the cleaning formula in the helper column will also break (producing #REF!). The IFERROR wrapper will catch this, but the resulting "[MISSING]" or "0" will hide the data loss.

**Safe approach:** Before building helper-column cleaning formulas on a column that contains formulas, convert that column to values first (copy > paste-as-values). This freezes the current results and removes formula dependencies, making the cleaning layer stable.

---

## Example

**Input:** "I downloaded a vendor contact list from our CRM into Excel. It has about 800 rows. Here are the problems I've noticed:
- The Company column has extra spaces and random mixed casing (some ALL CAPS, some all lowercase, some title case)
- The Email column has some cells that say 'N/A' or are blank, and some have spaces around them. A few are all caps.
- The Revenue column has dollar signs and commas in it so my SUM formula returns 0
- The Country column uses about 12 different spellings for the same 5 countries ('USA', 'US', 'United States', 'U.S.A.', 'United States of America' -- all meaning the same thing)
- I need to check if any companies are duplicated
I'm using Excel 365. Keep the original data and clean into new columns."

---

**Output:**

## Spreadsheet Cleaning Plan

### Diagnostic Summary (Pre-Cleaning)
Run these formulas to baseline the current state before any cleaning. Paste each formula into an empty cell and record the result.

| Check | Formula | Paste In |
|---|---|---|
| Company -- extra spaces | `=SUMPRODUCT(--(LEN(B2:B801)<>LEN(TRIM(B2:B801))))` | Any empty cell |
| Email -- blanks + "N/A" | `=COUNTBLANK(C2:C801)+COUNTIF(C2:C801,"N/A")` | Any empty cell |
| Revenue -- text-stored numbers | `=SUMPRODUCT(--(NOT(ISNUMBER(D2:D801))))` | Any empty cell |
| Country -- distinct values | `=SUMPRODUCT(1/COUNTIF(E2:E801,E2:E801))` | Any empty cell |
| Any errors in sheet | `=SUMPRODUCT(--ISERROR(B2:E801))` | Any empty cell |

**Cleaning mode:** Non-destructive (cleaned values in new columns F, G, H, I, J)
**Platform:** Excel 365

---

### Cleaning Operations

#### Operation 1: Company Name (Column B -- Company → Column F -- Company_Clean)

**Formula (paste into F2, drag down to F801):**
```
=IFERROR(
  IF(LEN(TRIM(CLEAN(SUBSTITUTE(B2,CHAR(160)," "))))=0,
    "[MISSING COMPANY]",
    PROPER(TRIM(CLEAN(SUBSTITUTE(B2,CHAR(160)," "))))
  ),
  B2
)
```

**Sequence rationale:**
- `SUBSTITUTE(B2,CHAR(160)," ")` -- replaces non-breaking spaces that TRIM ignores; common in CRM exports
- `CLEAN(...)` -- removes any non-printable ASCII characters (line feeds, null chars) from the CRM data
- `TRIM(...)` -- collapses all remaining extra spaces (leading, trailing, double-internal)
- `IF(LEN(...)=0,"[MISSING COMPANY]",...)` -- flags cells that contain only whitespace
- `PROPER(...)` -- converts to Title Case for standardized display
- Outer `IFERROR(...,B2)` -- if anything fails, return the raw original value rather than an error

**Expected transformation:**
- Before: `"  ACME CORP  "` → After: `"Acme Corp"`
- Before: `"global solutions"` → After: `"Global Solutions"`
- Before: `"   "` (spaces only) → After: `"[MISSING COMPANY]"`
- Before: `"Johnson & johnson"` → After: `"Johnson & Johnson"`

**Important note:** PROPER will incorrectly capitalize particles. If the company list includes entries like "McKinsey & Company" (which PROPER renders as "Mckinsey & Company") or "AECOM" (rendered as "Aecom"), flag these for manual review after applying the formula. Run `=COUNTIF(F2:F801,"Mckinsey*")` to spot-check known cases.

---

#### Operation 2: Email Address (Column C -- Email → Column G -- Email_Clean)

**Formula (paste into G2, drag down to G801):**
```
=IF(
  OR(TRIM(C2)="", UPPER(TRIM(C2))="N/A"),
  "[NO EMAIL]",
  LOWER(TRIM(CLEAN(SUBSTITUTE(C2,CHAR(160)," "))))
)
```

**Sequence rationale:**
- `TRIM(C2)=""` catches blank cells and whitespace-only cells
- `UPPER(TRIM(C2))="N/A"` catches all casing variants of "N/A", "n/a", "N/a" -- normalized before comparison
- `LOWER(TRIM(CLEAN(...)))` -- for valid emails: strip non-printable chars, remove spaces, convert to lowercase (email addresses are case-insensitive by RFC 5321 standard)
- No IFERROR needed because IF handles both problem states; if LOWER/TRIM/CLEAN fail on a non-text value, add outer IFERROR

**Expected transformation:**
- Before: `"  JOHN.SMITH@ACME.COM  "` → After: `"john.smith@acme.com"`
- Before: `"N/A"` → After: `"[NO EMAIL]"`
- Before: `"n/a"` → After: `"[NO EMAIL]"`
- Before: `""` (blank) → After: `"[NO EMAIL]"`
- Before: `"Sarah.Jones@COMPANY.COM"` → After: `"sarah.jones@company.com"`

**Post-cleaning email format check (optional):**
```
=IF(ISERROR(FIND("@",G2)),"INVALID FORMAT",IF(ISERROR(FIND(".",G2,FIND("@",G2))),"INVALID FORMAT","OK"))
```
Paste this into column K (Email_Valid) to flag emails missing @ or a domain dot. This is a basic structural check, not a deliverability check.

---

#### Operation 3: Revenue (Column D -- Revenue → Column H -- Revenue_Clean)

**Formula (paste into H2, drag down to H801):**
```
=IFERROR(
  IF(TRIM(D2)="", 0,
    VALUE(TRIM(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(D2,"$",""),",","")," ","")))
  ),
  "[PARSE ERROR: "&D2&"]"
)
```

**Sequence rationale:**
- `IF(TRIM(D2)="",0,...)` -- blank revenue cells become 0 (adjust to a different fallback if 0 is ambiguous in this dataset -- consider "[MISSING]" instead if you need to distinguish zero-revenue from unknown-revenue)
- `SUBSTITUTE(D2,"$","")` -- removes dollar sign
- `SUBSTITUTE(...,",","")` -- removes thousands-separator commas
- `SUBSTITUTE(...," ","")` -- removes any stray spaces within the number
- `VALUE(TRIM(...))` -- converts the cleaned text string to a true numeric value
- `IFERROR(...,"[PARSE ERROR: "&D2&"]")` -- if VALUE still fails (e.g., the cell contained "TBD" or "N/A"), flags the raw original value rather than silently returning 0

**Expected transformation:**
- Before: `"$1,250,000"` → After: `1250000` (numeric, no formatting)
- Before: `"$500"` → After: `500`
- Before: `""` (blank) → After: `0`
- Before: `"TBD"` → After: `"[PARSE ERROR: TBD]"`

**Verification:**
After cleaning, `=SUM(H2:H801)` should return a non-zero total. Also run:
```
=COUNTIF(H2:H801,"[PARSE ERROR*")   -- count cells that still failed conversion
=SUMPRODUCT(--(NOT(ISNUMBER(H2:H801))))  -- count non-numeric cells in cleaned column (should equal PARSE ERROR count)
```

**Formatting note:** Column H will contain raw numbers (e.g., 1250000). Apply cell formatting (Currency or Number with 2 decimal places) for display -- this does not change the underlying value.

---

#### Operation 4: Country (Column E -- Country → Column I -- Country_Clean) -- Mapping Table Approach

There are too many variants (at least 12 described) for a SUBSTITUTE chain. Use a mapping table.

**Step 4a -- Build the mapping table in columns M and N (or on a separate "Lookup" sheet):**

Paste the following table starting at M1:

| M (Raw_Country) | N (Standard_Country) |
|---|---|
| USA | United States |
| US | United States |
| United States | United States |
| U.S.A. | United States |
| United States of America | United States |
| UK | United Kingdom |
| United Kingdom | United Kingdom |
| U.K. | United Kingdom |
| England | United Kingdom |
| CAN | Canada |
| Canada | Canada |
| [add remaining variants from your data] | [standard name] |

Select M1:N20 and name this range `CountryMap` (Formula tab > Name Manager > New in Excel).

**Step 4b -- Cleaning formula (paste into I2, drag down to I801):**
```
=IFERROR(
  XLOOKUP(TRIM(UPPER(E2)), UPPER(CountryMap_Raw), CountryMap_Clean, TRIM(PROPER(E2))),
  TRIM(PROPER(E2))
)
```

Where CountryMap_Raw is the M column range and CountryMap_Clean is the N column range. The UPPER() normalization on both the lookup value and the lookup array makes the match case-insensitive, so "usa", "USA", and "Usa" all match the "USA" entry in the mapping table.

**Alternative (for Excel 2019 without XLOOKUP):**
```
=IFERROR(
  INDEX(N$2:N$20, MATCH(TRIM(UPPER(E2)), UPPER(M$2:M$20), 0)),
  TRIM(PROPER(E2))
)
```

**Expected transformation:**
- Before: `"USA"` → After: `"United States"`
- Before: `"United States of America"` → After: `"United States"`
- Before: `"u.s.a."` → After: `"United States"` (UPPER normalization handles this)
- Before
