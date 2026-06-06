---
name: data-validation-setup
description: |
  Produces a data validation rule set for a spreadsheet. Defines validation type (list, range, custom formula, date, text length), error message text, and input hint text for each field. Prevents data quality problems at the point of data entry.
  Use when the user needs to restrict what can be entered into spreadsheet cells to maintain data quality.
  Do NOT use for cleaning existing dirty data (use spreadsheet-data-cleaning), conditional formatting rules (use conditional-formatting-rules), or building lookup formulas (use excel-lookup-formulas).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "spreadsheets data-science checklist"
  category: "data-analysis"
  subcategory: "spreadsheets"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Data Validation Setup

## When to Use

**Use this skill when:**
- A user is building a shared data entry spreadsheet and wants to prevent garbage-in-garbage-out problems before they occur -- for example, a team time tracker, an inventory log, a CRM input sheet, a budget request form, or a project status register
- A user asks questions like "how do I add a dropdown?", "how do I stop people from entering letters in a number column?", "how do I make sure dates are in the right range?", or "how do I restrict what can be typed into a cell?"
- A user is creating a data collection template that will be filled in by multiple people with varying technical skill levels -- the wider the audience, the more important validation becomes
- A user needs to prepare a spreadsheet whose data will later be imported into a database, fed into a formula model, or analyzed -- validation at entry prevents type mismatches and parsing failures downstream
- A user wants to enforce a business rule at the point of data entry: approved vendors only, valid cost centers only, hours must be in quarter-hour increments, project codes must match a naming convention
- A user is inheriting or rebuilding a spreadsheet that has historically produced data quality issues and wants to retrofit systematic controls
- A user is designing a self-service data entry form in Google Sheets or Excel that replaces a paper form or email submission process

**Do NOT use when:**
- The problem is dirty data that already exists in the spreadsheet -- validation rules do not retroactively fix existing entries; use `spreadsheet-data-cleaning` instead
- The user wants to visually highlight cells based on their value (red for overdue, green for complete) -- that is conditional formatting, not validation; use `conditional-formatting-rules`
- The user wants to build VLOOKUP, INDEX/MATCH, or XLOOKUP formulas to retrieve values -- use `excel-lookup-formulas`
- The user wants to audit an existing spreadsheet model for formula errors, broken references, or logical inconsistencies -- use `spreadsheet-model-audit`
- The user is working in a true relational database (SQL Server, PostgreSQL, MySQL) where constraints are enforced at the schema level -- validation in that context belongs in DDL, not spreadsheets; use `database-constraint-design`
- The user needs data validation logic in a web form or application -- that is a front-end programming problem, not a spreadsheet skill
- The user wants to protect cells from being edited at all (sheet protection, locked cells) -- that is a cell protection problem distinct from validation; use `spreadsheet-protection-setup`

---

## Process

### Step 1: Gather the Field Inventory and Business Rules

Before writing a single validation rule, understand the full data model. Ask the user or extract from context:

- **What columns accept user input?** Distinguish between input columns (user types or selects) and calculated columns (formulas). Only input columns need validation rules.
- **What are the valid values or ranges for each field?** Push for specifics: not just "a number" but "a whole number between 1 and 999", not just "a date" but "a date within the current fiscal year."
- **What is the source of truth for list values?** Employee names, project codes, department names, and similar lists should come from a maintained source (an HR system, a project register) -- not be typed ad hoc into the validation dialog.
- **Who enters data?** Non-technical users need friendlier error messages, more descriptive input hints, and more forgiving validation (Warning style more often). Power users can tolerate stricter Stop rules.
- **What are the most common mistakes made in this spreadsheet historically?** Past failure modes are the highest-priority candidates for Stop-style validation.
- **Which fields are required vs. optional?** Required fields need "Allow blank" set to No. Optional fields must have "Allow blank" set to Yes -- otherwise the validation rule fires on empty cells and prevents users from leaving them blank.
- **What downstream systems consume this data?** If the sheet feeds a database import, API call, or Power Query pipeline, the validation criteria must exactly match the constraints of the receiving system (e.g., a field limited to 50 characters in the database must also be limited to 50 characters in the spreadsheet).

### Step 2: Classify Every Field into a Validation Type

Map each input field to one of six validation types. Do not guess -- apply the classification framework systematically:

| Field Characteristic | Correct Validation Type | When to Use It |
|---|---|---|
| Fixed set of allowed values (<=50 options) | **List** | Department names, status codes, yes/no flags, categories |
| Fixed set but values change frequently or exceed 50 | **List via named range** | Employee names, product SKUs, project codes |
| Whole number within a range | **Whole Number** | Quantities, counts, ID numbers, survey scores 1--10 |
| Number with decimals within a range | **Decimal** | Hours, currency amounts, percentages, measurements |
| Date within a range | **Date** | Entry dates, deadlines, billing periods |
| Time values | **Time** | Clock-in/clock-out, duration in HH:MM format |
| Text with a length constraint | **Text Length** | Reference codes, descriptions with character limits |
| Format, pattern, or cross-column logic | **Custom Formula** | Email format, phone format, conditional requirements, uniqueness |
| No constraint needed | **None** | Free-text notes, comments, calculated columns |

- **List validation vs. named range:** Hardcoded comma-separated lists (e.g., `Low,Medium,High`) are acceptable for static lists of 5 or fewer values that never change. For anything longer or likely to be maintained, always use a named range on a Config or Lookup sheet.
- **Custom Formula is the escape hatch:** Any rule that cannot be expressed with the built-in types can be expressed as a custom formula that returns TRUE (valid) or FALSE (invalid). Master this type and it covers every case.
- **Decimal vs. Whole Number matters:** If you select Whole Number and a user enters 1.5, it is rejected. If hours should allow half-hours, use Decimal. If quantities must be integers (you cannot order 2.7 units), use Whole Number.

### Step 3: Design Each Validation Rule in Full

For every field, define all five components before touching the spreadsheet. Designing on paper first prevents inconsistencies.

**Five components of a complete validation rule:**

1. **Range:** The exact cell range the rule applies to. Always extend to a generous lower bound (row 1000 or row 5000 for large datasets) so new rows are automatically covered. For tables (Excel Table objects), apply to the entire column -- the table will auto-extend the rule.
2. **Criteria:** The specific allowed values, bounds, or formula. Be precise about whether bounds are inclusive (Between includes both endpoints) or exclusive (Greater Than excludes the lower bound).
3. **Allow blank:** Explicitly set for every field. Do not leave this as the default and assume -- check it deliberately.
4. **Input message:** Written in second person, present tense, 1--3 sentences. Tells the user what to enter before they make a mistake. Keep titles under 32 characters (Excel truncates longer titles).
5. **Error alert:** Written in second person, specific about what went wrong, and actionable -- tell the user exactly what to do next. Use one of three styles (see Step 4).

**Criteria design decisions by type:**

- **List criteria:** Reference a named range (`=DepartmentList`) rather than embedding values. If the list is short and static, embed directly: `Low,Medium,High,Critical`. Never mix both approaches in the same workbook.
- **Whole Number / Decimal criteria:** Six operators are available: Between, Not Between, Equal To, Not Equal To, Greater Than or Equal To, Less Than or Equal To. "Between" is inclusive on both ends. For open-ended ranges (no maximum), use "Greater Than or Equal To."
- **Date criteria:** Use `=TODAY()` for dynamic "no future dates" rules. Use `=DATE(YEAR(TODAY()),1,1)` for "current calendar year only." Avoid hardcoding specific years (e.g., 1/1/2024) because the rule will become wrong without anyone noticing.
- **Custom formula criteria:** The formula must reference the first cell of the range as a relative reference. If the rule is applied to B2:B1000, the formula references B2, and Excel/Sheets adjusts it for B3, B4, etc. Never use an absolute reference like `$B$2` in a custom formula applied to a range.

### Step 4: Select Error Alert Styles with Deliberate Intent

Error alert style is the most consequential decision in validation design. The wrong choice either makes the sheet unusable (Stop used where exceptions are needed) or makes validation toothless (Information used where data integrity is critical).

**Stop:** Rejects the entry entirely. The user cannot proceed until they enter valid data or press Escape.
- Use for: fields where invalid data would break a downstream formula (e.g., a VLOOKUP key), violate a compliance requirement, or corrupt a database import.
- Use for: primary keys, required foreign keys, numeric fields used in calculations, date fields used in sorting or filtering.
- Do NOT use for: lists where unlisted values are occasionally legitimate (new employees, new projects).

**Warning:** Shows the message but allows the user to click "Yes" to accept the invalid entry anyway.
- Use for: dropdown lists where exceptions are plausible but should be flagged (new project codes, vendor not yet in master list).
- Use for: situations where enforcement is preferred but not mandatory, and where an audit trail of exceptions is acceptable.
- The Warning dialog shows Yes/No/Cancel. "Yes" accepts the entry. This means Warning style does not prevent bad data -- it slows it down and makes it deliberate.

**Information:** Shows a message but automatically accepts whatever was entered.
- Use for: advisory guidance only, such as a reminder about formatting conventions when you cannot enforce the format technically.
- Rarely justified for data quality purposes. If you find yourself reaching for Information, ask whether the validation is providing any real value.

**Decision rule:** Default to Stop. Downgrade to Warning only when you can articulate a specific exception scenario. Use Information only when you want a reminder tooltip without any enforcement.

### Step 5: Set Up the Named Ranges and Config Sheet Structure

Before configuring validation in the spreadsheet, build the infrastructure that the rules depend on.

- **Create a dedicated Config or Lookup sheet.** Name it `_Config` or `_Lists` (the leading underscore pushes it to the front of the sheet tab list and signals it is a system sheet, not a data sheet). Protect it from accidental editing.
- **Lay out each list in its own column** with a header row. Lists should be sorted to make them usable as dropdowns. Remove trailing spaces from list values -- a space after "Marketing " makes it a different value from "Marketing" and will cause lookup failures.
- **Create a named range for each list.** In Excel: Formulas > Name Manager > New. In Sheets: Data > Named ranges. Use descriptive names: `DepartmentList`, `EmployeeList`, `ProjectCodeList`. Avoid spaces in named range names -- use CamelCase or underscores.
- **Use dynamic named ranges for lists that grow.** In Excel, use an OFFSET formula: `=OFFSET(_Config!$A$2,0,0,COUNTA(_Config!$A:$A)-1,1)`. This automatically includes new rows added to the list. In Excel Tables, referencing a Table column automatically makes the named range dynamic.
- **Document the Config sheet** with a header row, a column for "last updated," and a note explaining that changing values here updates all validation rules.

### Step 6: Implement the Rules in the Spreadsheet

With the design document and Config sheet in place, implement each rule:

**In Excel:**
1. Select the target range (e.g., B2:B1000)
2. Data tab > Data Validation (in the Data Tools group)
3. Settings tab: Set Allow, Data, and criteria values
4. Input Message tab: Check "Show input message when cell is selected." Enter Title and Input message text.
5. Error Alert tab: Check "Show error alert after invalid data is entered." Set Style, Title, and Error message text.
6. Click OK
7. Repeat for each field -- do not copy validation from one column to another using paste unless the criteria are identical, because the formula references may shift incorrectly.

**In Google Sheets:**
1. Select the target range
2. Data menu > Data validation > Add rule (in the new interface)
3. Set Criteria type and values
4. Under "Advanced options": set "If data is invalid" to "Show warning" or "Reject input"
5. Check "Show validation help text" and enter the input hint
6. Save
7. Note: Google Sheets merges the input message and error message into a single "help text" field -- write a message that serves both purposes (explains expected input and what to do on error).

**Implementation order:** Always implement Stop rules before Warning rules. Test Stop rules first because they block entry and will reveal formula errors immediately.

**Testing protocol after implementation:**
- Enter a known-valid value and confirm it is accepted
- Enter a known-invalid value and confirm it is rejected with the correct error message
- Leave the field blank and confirm the correct behavior (accepted if Allow blank = Yes, rejected if Allow blank = No)
- For custom formula validation, test at least three boundary cases (just below minimum, minimum, maximum, just above maximum)

### Step 7: Document the Validation Specification

Produce the deliverable: a complete written specification of all validation rules. This serves as:
- A handoff document so the spreadsheet owner can maintain the rules without reverse-engineering them
- A review artifact for stakeholders to confirm the rules match business requirements
- An audit record proving that controls existed at the time of data collection

The Output Format section below defines the exact structure of this document. Never deliver only verbal instructions -- always deliver the written specification.

### Step 8: Handle Special Cases and Cross-Field Rules

After basic field-level rules are in place, address any cross-field dependencies:

- **Conditional required fields:** If Field B is required only when Field A = "Yes", use a custom formula on Field B: `=IF($A2="Yes", LEN(B2)>0, TRUE)`. This returns FALSE (invalid) only when A2 is "Yes" and B2 is empty.
- **Dependent dropdowns:** When the valid values for one field depend on the value in another field (Region determines which Offices are valid), use INDIRECT with named ranges named after each parent value. Full technique described in Edge Cases.
- **Uniqueness constraints:** To prevent duplicate entries in a key field, use `=COUNTIF($A$2:$A2,A2)=1`. Note the mixed reference: `$A$2:$A2` -- the start row is absolute, the end row is relative. This counts only occurrences up to and including the current row, not the entire column, which correctly handles the case where the current row is the first (and only) occurrence.
- **Cross-sheet references in custom formulas:** Excel custom formula validation can reference other sheets (e.g., `=ISNUMBER(MATCH(A2,_Config!A:A,0))`). Google Sheets as of recent versions also supports cross-sheet references in custom formula validation.

---

## Output Format

Deliver the validation specification in the following format. Every field must be documented completely -- no shortcuts or abbreviations.

```
## Data Validation Specification

### Overview
- **Spreadsheet name:** [Name or description]
- **Platform:** [Excel / Google Sheets]
- **Validated fields:** [N of M total input columns]
- **Unvalidated fields:** [List fields with no validation and the reason: e.g., Notes -- free text, no constraint needed]
- **Config/Lookup sheet:** [Sheet name where list values are stored]
- **Purpose:** [One sentence: what data quality problem this validation set prevents]
- **Last reviewed:** [Date]

---

### Validation Rules

#### Field [N]: [Column Header Name] (Column [Letter], Range [X2:X1000])

| Component | Specification |
|-----------|---------------|
| Applies to | [Exact range, e.g., C2:C1000] |
| Validation type | [List / Whole Number / Decimal / Date / Time / Text Length / Custom Formula / None] |
| Criteria | [Exact values, bounds, formula, or named range reference] |
| Allow blank | [Yes / No -- and why if non-obvious] |
| Error style | [Stop / Warning / Information -- and why] |

**Input message (shown when cell is selected):**
- Title: "[32 characters or fewer]"
- Message: "[1--3 sentences. What to enter, what format, what the valid options are.]"

**Error alert (shown on invalid entry):**
- Style: [Stop / Warning / Information]
- Title: "[Short, specific title]"
- Message: "[Specific: what was wrong, what the valid values are, what the user should do next.]"

**Implementation:**
- Excel: Data > Data Validation > Allow: [type] > [operator if applicable] > [criteria] > Input Message tab > [title, message] > Error Alert tab > Style: [style] > [title, message]
- Google Sheets: Data > Data validation > Add rule > Criteria: [type] > [criteria] > Advanced options > If invalid: [Reject input / Show warning] > Help text: [combined message]

**Notes:** [Any special considerations: dependency on another field, source of list values, business rule this enforces]

---

[Repeat for each validated field]

---

### Config Sheet Structure

**Sheet name:** [_Config or _Lists]

| Column | Named Range | List Values | Row Range | Dynamic? |
|--------|-------------|-------------|-----------|----------|
| A | [RangeName] | [val1, val2, val3, ...] | A2:A[N] | [Yes/No] |
| B | [RangeName] | [val1, val2, val3, ...] | B2:B[N] | [Yes/No] |

---

### Validation Summary Table

| Col | Field Name | Type | Criteria Summary | Blank OK | Error Style | Named Range |
|-----|------------|------|-----------------|----------|-------------|-------------|
| A | [name] | [type] | [brief] | Y/N | Stop/Warn/Info | [range or --] |
| B | [name] | [type] | [brief] | Y/N | Stop/Warn/Info | [range or --] |
| C | [name] | [type] | [brief] | Y/N | Stop/Warn/Info | [range or --] |

---

### Cross-Field Rules (if applicable)

| Rule | Fields Involved | Formula | Trigger Condition |
|------|----------------|---------|-------------------|
| [Rule description] | [Field A, Field B] | [=formula] | [When A = X, B is required] |

---

### Maintenance Notes

- To add a new value to [ListName]: Open _Config sheet > Column [X] > Add the new value in the next empty row > Keep the list sorted > No other changes needed.
- To change a range criterion: Data > Data Validation on any cell in the field > Edit criteria > Click "Apply to all cells with this setting."
- To audit all validation rules in the workbook (Excel): Formulas > Show Formulas is not sufficient -- use the Name Manager to review named ranges and review each column's Data Validation dialog individually.
- Validation rules do NOT protect against paste operations in some Excel versions. To prevent paste-overwrite of validation, combine with sheet protection on input columns.
```

---

## Rules

1. **Never embed list values directly in the validation dialog for any list longer than 5 items or likely to change.** Hardcoded lists in the validation dialog are invisible, unauditable, and require editing each affected cell individually to update. Named ranges on a Config sheet are the only maintainable approach. The rule of thumb: if the list has more than 5 values or you cannot guarantee it will never change, use a named range.

2. **Always extend the validation range to a generous lower bound -- at minimum row 1000, preferably row 5000 for sheets expected to grow.** A validation rule that covers only the current data rows (e.g., B2:B47) will silently fail to validate new entries in rows 48 and beyond. The cost of applying to extra empty rows is zero; the cost of missing it is silent data corruption.

3. **Every validated field must have both an input message and an error alert -- no exceptions.** An input message without an error alert leaves users confused about why their entry was rejected. An error alert without an input message means users discover the rule by making an error rather than by being guided upfront. Both are required for every field.

4. **Error messages must tell the user three things: what was wrong, what is valid, and what to do next.** "Invalid input" is useless. "Hours must be a number between 0.25 and 24. Use decimal format: 1.5 for 90 minutes. If you need to log more than 24 hours on a single date, split across two rows." is actionable.

5. **Custom formula validation references must use a relative row reference to the first cell of the applied range.** If the rule is applied to D2:D500, the formula must reference D2 (not $D$2 or $D2). Excel and Sheets adjust the row reference for each subsequent row. Getting this wrong means every row is validated against the first row's value, which produces unpredictable and hard-to-diagnose errors.

6. **Use `=TODAY()` and `=DATE(YEAR(TODAY()),...)` for date bounds, never hardcoded date values.** A rule like "date must be on or before 12/31/2024" silently becomes wrong on 1/1/2025 and will either block all future entries or permit entries from any year depending on the operator. Dynamic date formulas stay correct automatically.

7. **The "Allow blank" setting must be explicitly and deliberately set for every field.** Do not accept the default. Required fields: Allow blank = No. Optional fields: Allow blank = Yes. Getting this wrong either forces users to fill optional fields or allows critical required fields to be skipped silently.

8. **Stop style is the default error style -- only downgrade to Warning when you can name a specific exception scenario.** Warning style allows bad data to enter the sheet with a single click of "Yes." Every Warning-style rule should be accompanied by a note explaining the acceptable exceptions and who is authorized to approve them.

9. **Validate the Config sheet itself.** The named ranges used by validation rules are only as good as the data in the Config sheet. Protect the Config sheet (restrict editing to admins), sort all lists consistently (alphabetical for user-facing lists, by ID for code lists), and remove leading/trailing spaces from all list values using TRIM() before populating the list.

10. **Communicate clearly that validation rules do not retroactively validate existing data and do not prevent paste-overwriting in all configurations.** In Excel, pasting values over a validated range bypasses validation entirely unless the sheet is also protected. In Google Sheets, pasting values also bypasses validation by default but can be blocked by combining validation with protected ranges. Always include this caveat in the Maintenance Notes of the specification so the sheet owner understands the limitation.

11. **Test every custom formula validation rule manually before applying it to the full range.** Enter the formula in a blank cell, substitute a test value for the cell reference, and verify it returns TRUE for valid input and FALSE for invalid input. Test at least four cases: a clearly valid value, a clearly invalid value, the exact lower boundary, and the exact upper boundary. Then remove the test formula before delivering.

12. **For Text Length validation, measure the downstream constraint, not a guess.** If the sheet feeds a database column defined as VARCHAR(100), set the text length maximum to 100. If it feeds a form field limited to 256 characters, use 256. Never invent a character limit -- always ask what the receiving system requires.

---

## Edge Cases

### Dependent (Cascading) Dropdowns

When the valid values for one field depend on the value selected in another field -- for example, Office depends on Region, or Sub-category depends on Category -- use the INDIRECT technique with named ranges:

1. Create a named range for each parent value. If Region has values "North", "South", "East", "West", create named ranges `North`, `South`, `East`, `West`, each pointing to the corresponding city list on the Config sheet.
2. If parent values contain spaces (e.g., "North America"), the named range cannot contain a space. Use SUBSTITUTE in the INDIRECT formula: `=INDIRECT(SUBSTITUTE(A2," ","_"))` and name the ranges `North_America`, `South_America`, etc.
3. Apply List validation to the child column with Criteria: `=INDIRECT(A2)` (or the cell reference of the parent column in the same row).
4. Critical constraint: a named range must exist for every possible parent value, including any future values. If a user selects a Region value that has no corresponding named range, the INDIRECT formula returns an error and the dropdown shows a validation error.
5. In Google Sheets, the Apps Script method is more robust than INDIRECT for cascading dropdowns in large sheets because INDIRECT can become slow with many rows.

### Preventing Paste-Bypass of Validation Rules

Validation rules in both Excel and Google Sheets are bypassed when a user pastes values into a validated cell. This is one of the most common ways validation breaks down in practice.

- In Excel: Combine Data Validation with worksheet protection. Lock all input cells (Format Cells > Protection > Locked), then protect the sheet (Review > Protect Sheet) but allow "Edit unlocked cells" only. This forces users to use the cell directly rather than pasting.
- In Google Sheets: Combine validation with Protected Ranges. Set the range as protected but allow editing by specific users -- this still permits direct entry but blocks paste from unauthorized users.
- For shared sheets where paste must be allowed: Add a companion validation audit column using a formula that checks whether the cell's value is in the valid list: `=ISNUMBER(MATCH(B2,DepartmentList,0))`. This does not block bad data but flags it immediately for review.
- Always disclose this limitation in the Maintenance Notes section of the specification.

### Validating Phone Numbers and Structured Codes

Structured text formats (phone numbers, postal codes, product SKUs, ISO country codes) require Text Length or Custom Formula validation. The formula approach handles format validation:

- 10-digit US phone number (digits only): `=AND(LEN(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(A2,"-",""),"(",""),")",""))=10, ISNUMBER(VALUE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(A2,"-",""),"(",""),")",""))))`
- 5-digit US ZIP code: `=AND(LEN(A2)=5, ISNUMBER(VALUE(A2)))`
- Fixed-format product SKU like "PRD-####-XX" (e.g., PRD-1234-AB): `=AND(LEFT(A2,4)="PRD-", ISNUMBER(VALUE(MID(A2,5,4))), LEN(A2)=11)`
- Important: these formulas validate format, not existence. A ZIP code of "00000" passes format validation but is not a real ZIP. If existence validation is needed, the field must use List validation against a complete reference list, not a formula.
- Set a descriptive input message that shows the expected format with an example: "Enter the product SKU in the format PRD-####-XX, for example: PRD-4821-AB."

### Validation in Excel Tables vs. Plain Ranges

Excel Tables (created with Insert > Table or Ctrl+T) handle validation differently from plain ranges:

- Validation applied to a column in a Table automatically extends to new rows added at the bottom of the Table. This is the most reliable way to ensure new data is always validated.
- To apply validation to an entire Table column, click the column header (not the header cell itself) to select the data range, then apply validation. Do not include the header cell in the validation range.
- If the sheet does not use Tables, apply validation to a range extending to row 1000 or 5000. Check annually whether the data has exceeded this range and extend if needed.
- Google Sheets does not have a native Table equivalent. Use the entire column reference (e.g., B2:B) to ensure new rows are covered. Caution: applying validation to an entire column (B:B) can slow down Google Sheets on large sheets -- test performance before applying.

### Retroactive Validation of Existing Data

Applying validation to a range that already contains data does NOT flag or remove existing invalid data. Excel and Sheets apply the rule only to future entries. This is a critical gap:

- After applying validation, use Excel's "Circle Invalid Data" feature (Data > Data Validation dropdown arrow > Circle Invalid Data) to highlight cells that violate the new rules. This visually identifies existing violations without changing any data.
- In Google Sheets, there is no equivalent feature. Use a helper column with a formula to flag violations: `=IF(ISNUMBER(MATCH(B2,DepartmentList,0)),"OK","INVALID")` and filter for "INVALID."
- Communicate clearly to the sheet owner that validation rules govern future entries and that existing violations require a separate data cleaning effort using `spreadsheet-data-cleaning`.
- If the sheet has existing data, recommend running the audit before enabling Stop-style validation on previously unvalidated columns. Stop rules on a column with existing invalid data will block users from editing those cells (since any edit triggers validation on the cell's current value in some configurations).

### Multi-User Sheets with Conflicting List Membership

In shared spreadsheets where multiple departments or teams use the same sheet, a single dropdown list often fails: Marketing's valid project codes are not the same as Finance's valid project codes.

- Approach 1 -- Role-based validation: Apply different validation rules to different row blocks or use a "User Type" header cell that controls which named range the INDIRECT formula references. Fragile and hard to maintain.
- Approach 2 -- Superset list with Warning style: Create a single list that is the union of all valid values across all user groups. Use Warning style instead of Stop. Add a companion "Verified" column where an admin marks each entry as confirmed.
- Approach 3 -- Separate tabs per team: Give each team their own input tab with team-specific validation, and use a Master tab that consolidates all entries with a consistent structure. This is the cleanest architecture for cross-team data collection.
- Approach 4 -- Dynamic list based on user identity: Use a lookup formula that returns the appropriate named range based on the value in a "Department" or "Role" column on the same row, feeding an INDIRECT formula. Requires the user to fill in their department first.

### Large List Performance Issues

Dropdown validation with very large lists (500+ items) degrades performance in both Excel and Google Sheets:

- In Excel, a dropdown list exceeding approximately 32,767 characters in total length cannot be stored directly -- it must reference a range.
- Lists exceeding 500--1,000 items become impractical as dropdowns because users cannot scroll through them efficiently. For large lists (employees in a company with 2,000 staff), consider replacing the dropdown with a helper lookup: the user types a partial name, and a formula suggests the match, with validation confirming the final entry is in the list using a custom formula `=ISNUMBER(MATCH(A2,EmployeeList,0))`.
- In Google Sheets, validation referencing a named range with more than 10,000 rows can cause noticeable lag. Trim the list to only active/current values rather than a complete historical archive.
- Autocomplete behavior differs by platform: Excel shows a dropdown arrow but also autocompletes from the list when the user starts typing. Google Sheets shows both a dropdown and autocomplete. Inform the user of this behavior so they know they do not need to scroll the full list to find their value.

---

## Example

**Input:** "I'm building an expense report spreadsheet that will be used by 50 employees to submit expenses for manager approval. The columns are: Date, Employee ID, Department, Expense Category, Vendor Name, Amount (USD), Receipt Attached (Yes/No), and Notes. Amount must be positive and under $10,000 per line item. Department must match a list of 8 valid departments. Expense Category must match a list of 12 approved categories. The date must be within the current calendar year. Receipt is required for amounts over $75, but that rule is complex -- just make it a Yes/No dropdown for now. Notes are optional free text."

---

## Data Validation Specification

### Overview
- **Spreadsheet name:** Employee Expense Report
- **Platform:** Excel (compatible with Google Sheets with noted adjustments)
- **Validated fields:** 7 of 8 input columns
- **Unvalidated fields:** Notes (Column H) -- free text, no format constraint needed
- **Config/Lookup sheet:** `_Config`
- **Purpose:** Prevent expense submissions with invalid department codes, unapproved expense categories, out-of-range amounts, or missing required fields, ensuring expense data can be processed by Finance without manual correction
- **Last reviewed:** Set to current date on delivery

---

### Validation Rules

#### Field 1: Date (Column A, Range A2:A5000)

| Component | Specification |
|-----------|---------------|
| Applies to | A2:A5000 |
| Validation type | Date |
| Criteria | Between `=DATE(YEAR(TODAY()),1,1)` and `=DATE(YEAR(TODAY()),12,31)` |
| Allow blank | No -- Date is required for every expense line |
| Error style | Stop -- an invalid date prevents correct period reporting |

**Input message (shown when cell is selected):**
- Title: "Expense Date"
- Message: "Enter the date the expense was incurred. Must be within the current calendar year. Use MM/DD/YYYY format."

**Error alert:**
- Style: Stop
- Title: "Date Out of Range"
- Message: "Please enter a date within the current calendar year. Expenses from prior years must be submitted to Finance directly. Future dates are not accepted."

**Implementation:**
- Excel: Data > Data Validation > Allow: Date > Data: between > Start date: `=DATE(YEAR(TODAY()),1,1)` > End date: `=DATE(YEAR(TODAY()),12,31)` > Input Message tab > Title: "Expense Date" > Message: [above] > Error Alert tab > Style: Stop > Title: "Date Out of Range" > Message: [above]
- Google Sheets: Data > Data validation > Add rule > Criteria: Date is between > `=DATE(YEAR(TODAY()),1,1)` and `=DATE(YEAR(TODAY()),12,31)` > If invalid: Reject input > Help text: [combined input and error message]

**Notes:** The DATE formula dynamically adjusts to the current year, so this rule requires no annual maintenance.

---

#### Field 2: Employee ID (Column B, Range B2:B5000)

| Component | Specification |
|-----------|---------------|
| Applies to | B2:B5000 |
| Validation type | Custom Formula |
| Criteria | `=AND(LEN(B2)=6, ISNUMBER(VALUE(B2)))` |
| Allow blank | No -- Employee ID is required for payroll matching |
| Error style | Stop -- an invalid ID cannot be matched to an employee record |

**Input message:**
- Title: "Employee ID"
- Message: "Enter your 6-digit Employee ID (numbers only). Find your ID on your pay stub or HR portal profile. Example: 104872."

**Error alert:**
- Style: Stop
- Title: "Invalid Employee ID"
- Message: "Employee ID must be exactly 6 digits (numbers only). Do not include letters, spaces, or hyphens. Check your pay stub or contact HR if you do not know your ID."

**Implementation:**
- Excel: Data > Data Validation > Allow: Custom > Formula: `=AND(LEN(B2)=6, ISNUMBER(VALUE(B2)))` > Input Message and Error Alert tabs as above
- Google Sheets: Same formula in Custom formula field

**Notes:** This validates format (6 digits) but not existence. A companion MATCH check against an EmployeeID named range on _Config is recommended if the employee master list is available: replace formula with `=AND(LEN(B2)=6, ISNUMBER(VALUE(B2)), ISNUMBER(MATCH(VALUE(B2),EmployeeIDList,0)))`.

---

#### Field 3: Department (Column C, Range C2:C5000)

| Component | Specification |
|-----------|---------------|
| Applies to | C2:C5000 |
| Validation type | List |
| Criteria | `=DepartmentList` (named range on _Config sheet, column A) |
| Allow blank | No -- Department is required for cost allocation |
| Error style | Stop -- expenses cannot be allocated without a valid department code |

**Input message:**
- Title: "Department"
- Message: "Select your department from the dropdown. If your department is not listed, contact Finance to add it before submitting."

**Error alert:**
- Style: Stop
- Title: "Invalid Department"
- Message: "Please select your department from the dropdown list. Do not type a department name manually -- it must match the approved list exactly. Contact Finance if your department is missing."

**Implementation:**
- Excel: Data > Data Validation > Allow: List > Source: `=DepartmentList` > tabs as above
- Google Sheets: Criteria: Dropdown (from a range) > select _Config!A2:A9

**Notes:** DepartmentList contains 8 values on _Config!A2:A9. The named range is dynamic (uses OFFSET formula) so new departments can be added by appending to the list without editing the validation rule.

---

#### Field 4: Expense Category (Column D, Range D2:D5000)

| Component | Specification |
|-----------|---------------|
| Applies to | D2:D5000 |
| Validation type | List |
| Criteria | `=ExpenseCategoryList` (named range on _Config sheet, column B) |
| Allow blank | No -- Category is required for expense policy enforcement |
| Error style | Warning -- a new vendor category may occasionally be legitimately unlisted; Finance approver must confirm |

**Input message:**
- Title: "Expense Category"
- Message: "Select the expense category from the dropdown. For multi-category receipts, split into separate rows. See the Expense Policy for category definitions."

**Error alert:**
- Style: Warning
- Title: "Category Not in Approved List"
- Message: "This category is not in the approved list. If this is a valid new category, click Yes to submit and add a note in the Notes column. Your manager and Finance will review. If you made a typo, click No and select from the dropdown."

**Implementation:**
- Excel: Data > Data Validation > Allow: List > Source: `=ExpenseCategoryList` > Error Alert tab > Style: Warning > tabs as above
- Google Sheets: Criteria: Dropdown (from a range) > _Config!B2:B13 > If invalid: Show warning

**Notes:** Warning style is intentional. Expense policy is updated quarterly and the list may lag new categories by weeks. Finance reviews all exceptions. ExpenseCategoryList is on _Config!B2:B13 (12 categories).

---

#### Field 5: Vendor Name (Column E, Range E2:E5000)

| Component | Specification |
|-----------|---------------|
| Applies to | E2:E5000 |
| Validation type | Text Length |
| Criteria | Between 2 and 100 characters |
| Allow blank | No -- Vendor name is required for audit compliance |
| Error style | Stop |

**Input message:**
- Title: "Vendor Name"
- Message: "Type the vendor or merchant name as it appears on the receipt. Maximum 100 characters. Example: Delta Air Lines, Marriott Chicago Downtown, Office Depot."

**Error alert:**
- Style: Stop
- Title: "Vendor Name Required"
- Message: "Please enter the vendor name (2--100 characters). This field cannot be blank. Enter the name exactly as it appears on the receipt."

**Implementation:**
- Excel: Data > Data Validation > Allow: Text length > Data: between > Minimum: 2 > Maximum: 100
- Google Sheets: Criteria: Text > Text length > between 2 and 100

**Notes:** A minimum of 2 characters prevents single-letter entries (which are almost always errors) while accommodating abbreviated vendor names. 100 characters matches the Finance system's import field limit.

---

#### Field 6: Amount (USD) (Column F, Range F2:F5000)

| Component | Specification |
|-----------|---------------|
| Applies to | F2:F5000 |
| Validation type | Decimal |
| Criteria | Between 0.01 and 9999.99 |
| Allow blank | No -- Amount is required |
| Error style | Stop -- amounts outside this range cannot be processed via this form |

**Input message:**
- Title: "Amount (USD)"
- Message: "Enter the expense amount in US dollars. Use decimal format: 45.00 for $45, 1250.75 for $1,250.75. Minimum: $0.01. Maximum per line: $9,999.99. Amounts of $10,000 or more require a Purchase Order -- contact Finance."

**Error alert:**
- Style: Stop
- Title: "Invalid Amount"
- Message: "Amount must be between $0.01 and $9,999.99. For expenses of $10,000 or more, a Purchase Order is required -- do not submit via this form. Contact Finance at ext. 4400. For zero-dollar corrections, use the Adjustment Request form."

**Implementation:**
- Excel: Data > Data Validation > Allow: Decimal > Data: between > Minimum: 0.01 > Maximum: 9999.99
- Google Sheets: Criteria: Number > is between > 0.01 and 9999.99

**Notes:** The maximum of 9,999.99 (not 10,000) is intentional -- it excludes the $10,000 threshold exactly, matching the Finance policy boundary. Do not change to 10,000 without confirming the policy threshold.

---

#### Field 7: Receipt Attached (Column G, Range G2:G5000)

| Component | Specification |
|-----------|---------------|
| Applies to | G2:G5000 |
| Validation type | List |
| Criteria | `Yes,No` (direct list -- 2 static values, will never change) |
| Allow blank | No -- This field must be answered for every line |
| Error style | Stop |

**Input message:**
- Title: "Receipt Attached?"
- Message: "Select Yes if a receipt image or PDF is attached to this submission. Select No if no receipt is available. Note: receipts are required for all amounts over $75 per company policy."

**Error alert:**
- Style: Stop
- Title: "Selection Required"
- Message: "Please select Yes or No from the dropdown to confirm whether a receipt is attached. Do not leave this field blank."

**Implementation:**
- Excel: Data > Data Validation > Allow: List > Source: `Yes,No` (typed directly -- no named range needed for a 2-item static list)
- Google Sheets: Criteria: Dropdown > add items Yes and No

**Notes:** This is the only field using a direct list (not a named range) -- two static values that will never change justify inline entry. The business rule "receipts required for amounts over $75" is not enforced automatically here -- that cross-field rule is documented below in the Cross-Field Rules section.

---

### Config Sheet Structure

**Sheet name:** `_Config`
**Protection:** Restrict editing to Finance admins only

| Column | Named Range | List Values | Row Range | Dynamic? |
|--------|-------------|-------------|-----------|----------|
| A | DepartmentList | Engineering, Finance, Human Resources, Legal, Marketing, Operations, Product, Sales | A2:A9 | Yes (OFFSET) |
| B | ExpenseCategoryList | Airfare, Car Rental, Client Entertainment, Conference & Training, Ground Transportation, Hotel & Lodging, Meals -- Individual, Meals -- Team, Office Supplies, Professional Services, Software & Subscriptions, Telecommunications | B2:B13 | Yes (OFFSET) |

**Named range formulas (Excel Name Manager):**
- `DepartmentList`: `=OFFSET(_Config!$A$2,0,0,COUNTA(_Config!$A:$A)-1,1)`
- `ExpenseCategoryList`: `=OFFSET(_Config!$B$2,0,0,COUNTA(_Config!$B:$B)-1,1)`

---

### Validation Summary Table

| Col | Field Name | Type | Criteria Summary | Blank OK | Error Style | Named Range |
|-----|------------|------|-----------------|----------|-------------|-------------|
| A | Date | Date | Within current calendar year | No | Stop | -- |
| B | Employee ID | Custom | 6 digits, numeric | No | Stop | -- |
| C | Department | List | 8 approved departments | No | Stop | DepartmentList |
| D | Expense Category | List | 12 approved categories | No | Warning | ExpenseCategoryList |
| E | Vendor Name | Text Length | 2--100 characters | No | Stop | -- |
| F | Amount (USD) | Decimal | $0.01 -- $9,999.99 | No | Stop | -- |
| G | Receipt Attached | List | Yes, No | No | Stop | -- |
| H | Notes | None | Free text, no constraint | Yes | -- | -- |

---

### Cross-Field Rules (Recommended Future Enhancement)

| Rule | Fields Involved | Formula | Trigger Condition |
|------|----------------|---------|-------------------|
| Receipt required for amounts over $75 | F (Amount), G (Receipt Attached) | `=IF(F2>75, G2="Yes", TRUE)` | Apply as Custom Formula validation on Column G -- returns FALSE (invalid) when Amount > 75 and Receipt = No |

**Implementation note for the cross-field receipt rule:** Apply `=IF(F2>75, G2="Yes", TRUE)` as a Custom Formula validation on G2:G5000. Set Error Style to Stop with message: "A receipt is required for expenses over $75. Please attach your receipt before submitting. If the receipt is lost, select No and explain in the Notes column."

---

### Maintenance Notes

- **To add a new department:** Open _Config sheet > Column A > Add the department name in the next empty row after A9 > Keep the list in alphabetical order > The DepartmentList named range will automatically include it.
- **To add a new expense category:** Open _Config sheet > Column B > Add in the next empty row after B13 > Keep alphabetical order > No other changes needed.
- **To change the maximum amount per line:** Data > Data Validation on any cell in F2:F5000 > Edit the Maximum value > Click "Apply to all cells with this setting."
- **Annual maintenance required:** The date validation rule uses `DATE(YEAR(TODAY()),1,1)` and requires no manual update. Review the DepartmentList and ExpenseCategoryList against the current Finance master lists at the start of each fiscal year.
- **Paste bypass warning:** Users who paste values into validated cells can bypass these rules in Excel. To prevent this, protect the sheet (Review > Protect Sheet) and allow only "Edit unlocked cells." Lock all cells first (Ctrl+A > Format Cells > Protection > Locked), then unlock only input cells B2:H5000 before protecting. This forces data entry through normal typing, which triggers validation.
- **Circling invalid data (Excel):** After initial deployment, use Data > Data Validation dropdown > Circle Invalid Data to identify any existing entries in the spreadsheet that violate the new rules. Address these with `spreadsheet-data-cleaning` before enforcing Stop rules on those columns.
