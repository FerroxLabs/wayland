---
name: data-profiling
description: |
  Produces a comprehensive data profile for a table or dataset including schema documentation, data type validation, uniqueness analysis, referential integrity checks, and a data quality score with remediation priorities.
  Use when the user needs to document a dataset's structure and quality for onboarding, governance, or pre-analysis preparation.
  Do NOT use for exploratory statistical analysis (use eda-framework), data cleaning operations (use data-cleaning-protocol), or building data catalogs across multiple tables (use data-catalog-setup).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science analysis spreadsheets"
  category: "data-analysis"
  subcategory: "exploratory-data-analysis"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Data Profiling

## When to Use

**Use this skill when:**
- A user presents a new table, CSV export, database view, or API payload and asks "what does this data look like?" or "can I trust this data for analysis?"
- A user is onboarding to an inherited dataset -- from a departing colleague, a legacy system, or a vendor data feed -- and needs a structural and quality baseline before touching the data
- A data governance stakeholder needs a documented quality score for an audit, a data contract, or a regulatory review (GDPR data inventory, SOX data lineage, HIPAA data classification)
- A user is preparing a dataset for a machine learning pipeline and needs to identify training data issues before feature engineering begins
- A user needs to validate that a data pipeline delivered what was expected -- row counts, column shapes, type conformity -- before promoting data to production
- A user explicitly asks about null rates, duplicate rates, cardinality, type conformity, or referential integrity on a specific table
- A business analyst is writing a data dictionary or onboarding document and needs the structural foundation filled in
- A user is comparing two versions of the same dataset (before/after ETL, production vs. staging) and needs systematic differences surfaced

**Do NOT use when:**
- The user wants statistical distributions, correlations, skewness, kurtosis, or hypothesis testing -- that is exploratory statistical analysis, use `eda-framework`
- The user wants to actually fix, impute, or transform data issues -- that is remediation work, use `data-cleaning-protocol` (this skill diagnoses, that skill treats)
- The user wants to document and cross-link many tables in a searchable inventory -- use `data-catalog-setup`, which handles lineage graphs, table relationships, and business glossaries at scale
- The user wants to build ongoing automated validation rules that run on every new data load -- use `data-validation-setup` for schema enforcement and pipeline monitoring
- The user wants to analyze a single variable in depth (outlier detection, binning strategy, transformation selection) -- use `univariate-analysis`
- The user has already completed profiling and wants recommendations on database schema design -- that is a separate normalization and modeling problem

---

## Process

### Step 1: Gather Dataset Metadata and Stated Intent

Before touching any column, establish the context that will drive every profiling decision.

- Ask for the table or file name exactly as it exists in the system -- the name itself often encodes meaning (e.g., `CUST_MASTER_HIST` tells you this is a history table, not a current-state table, which changes how you interpret duplicates)
- Identify the source system type: transactional OLTP database, analytical OLAP warehouse, CRM export, ERP extract, flat-file manual spreadsheet, API JSON payload, or IoT sensor stream -- each carries different quality expectations
- Ask for row count and date range. A 500-row table from a 10-year-old system means most historical data is missing or archived elsewhere. A 50-million-row table means sampling is required before column-by-column analysis
- Ask what the user plans to do with this data. A headcount report needs `is_active` and `department` to be clean. A revenue forecast needs `amount` and `transaction_date`. Understanding the analytical goal determines which quality findings get Priority 1 vs. Priority 3
- Ask whether any existing documentation exists: an ERD, a data dictionary, a wiki page, a prior profiling report. Existing docs let you validate claimed types against actual types -- the gap is where the interesting findings live
- Ask who owns and maintains the data. This determines whether remediation happens by contacting a source system team, fixing a spreadsheet, or filing a pipeline bug -- which affects your effort estimates
- Establish the expected grain of the table: one row per customer? one row per transaction? one row per day per customer? A table at the wrong grain is a structural defect, not just a quality issue

### Step 2: Document the Schema with Full Column Metadata

Schema documentation is the foundation. Every downstream finding attaches to a column entry here.

- Record the column name verbatim, including any quirks: trailing spaces in column headers, camelCase vs. snake_case inconsistencies, numeric suffixes that hint at repeated columns (`address1`, `address2`, `address3` -- a normalization smell)
- For each column, record the **declared type** (what the DDL or schema definition says), the **inferred type** (what the actual values look like), and the **semantic type** (what the value represents in business terms). These three can all differ: a column declared as VARCHAR(255) may contain only integers, which may represent customer IDs -- three different answers to "what type is this?"
- Semantic type classification matters for profiling decisions. The key semantic types are: Identifier (unique within table, surrogate or natural key), Foreign Key Reference (points to another entity), Categorical Ordinal (ordered: Low/Medium/High), Categorical Nominal (unordered: region names), Continuous Numeric, Discrete Count, Currency Amount, Percentage/Ratio, Date (calendar), Datetime (calendar + time), Duration, Free Text (unstructured narrative), Boolean, Geospatial (coordinates, postal codes), and Status/Flag
- Record the nullable constraint. Columns that are NOT NULL in the DDL but contain nulls in the data indicate a constraint enforcement failure -- a significant finding. Columns that ARE nullable but never null may be candidates to tighten
- Record the declared length or precision (VARCHAR(50), DECIMAL(10,2), etc.) and whether the actual data uses the full width. A VARCHAR(255) column where max observed length is 12 characters was likely over-provisioned, which is harmless but worth noting
- For every column, capture 3-5 representative example values drawn from different parts of the distribution, not just the first rows. The first 5 rows of an export are often test data or header records -- examples from row 1, row 250, and row 850 are more representative
- Flag columns whose names collide with SQL reserved words (`date`, `name`, `value`, `key`, `index`, `order`) -- these cause downstream query failures unless quoted and should be noted in the remediation list

### Step 3: Run Completeness Analysis

Completeness is the most visible quality dimension and the one users most frequently underestimate.

- Count null values per column. Distinguish between three null types: **structural nulls** (legitimately absent because not applicable, e.g., `manager_id` is NULL for the CEO), **optional nulls** (field exists but user chose not to fill it), and **missing nulls** (data that should be present but is absent due to pipeline or entry failure). These require different remediation actions
- Count empty strings (`''`) separately from NULL. In many systems, especially Excel exports and web form outputs, empty string and NULL are different failure modes. An empty string in a numeric column will pass a NOT NULL constraint but fail a numeric aggregation
- Count sentinel values that are used as null proxies: `0` in a nullable count column, `-1` in an ID column, `9999-12-31` in a date column, `"N/A"`, `"Unknown"`, `"None"`, `"TBD"`, `"#N/A"` (Excel artifacts). These are particularly dangerous because they pass type validation while carrying missing-data semantics
- Calculate completeness per column: `(total_rows - null_count - empty_string_count) / total_rows * 100`
- Calculate overall table completeness: `(total_cells - total_missing_cells) / total_cells * 100` where `total_cells = row_count * column_count`
- Identify patterns in missingness. If `column_A` is null whenever `column_B` equals a specific value, that is structural missingness. If nulls in `hire_date` cluster in 2019, that is a pipeline event. Pattern-based missingness is a higher-severity finding than random missingness
- Flag any non-nullable column with more than 0% nulls as a constraint violation. Flag any column with more than 5% missing as requiring explanation. Flag any column with more than 20% missing as potentially unsuitable for analysis without imputation

### Step 4: Run Uniqueness and Cardinality Analysis

Uniqueness analysis reveals structural intent. Cardinality reveals how columns will behave in aggregations and joins.

- For every column, compute: distinct count, null count (excluded from distinct count), uniqueness ratio (`distinct_count / (total_rows - null_count)`), and duplicate count (`total_rows - distinct_count`)
- Classify columns by cardinality tier:
  - **Binary (2 distinct values):** Boolean-like. Verify both values are intentional and not an artifact of incomplete data
  - **Low cardinality (3-20 distinct values):** Categorical. Enumerate all values -- these become your grouping dimensions
  - **Medium cardinality (21-1,000 distinct values):** May be categorical with many levels (e.g., product SKUs in a small catalog) or numeric discretized values. Inspect actual values
  - **High cardinality (1,001 to 90% of row count):** Likely a semi-unique identifier, a free-text field, or a column with serious inconsistencies
  - **Near-unique (90%-99.9% unique):** Strong identifier candidate. Investigate the non-unique rows -- they may be legitimate (multiple accounts per person) or data errors (duplicate imports)
  - **Fully unique (100%):** Candidate primary key. Verify with the data owner that uniqueness is guaranteed, not just coincidental at this row count
- Perform composite key detection if no single column is 100% unique: test the most semantically promising 2-column pairs (e.g., `customer_id + order_date`, `user_id + event_type`). A unique composite signals a natural key and defines the grain of the table
- Check for quasi-duplicate rows: rows that are identical on all business-meaningful columns but differ only on a surrogate key or load timestamp. These are hidden duplicates that uniqueness ratio alone won't catch
- For categorical columns (low cardinality), list all distinct values and their frequencies. Category spelling variants are a major source of grouping errors: `"Engineering"`, `"engineering"`, `"Eng"`, `"ENGINEERING"` will produce four groups in a GROUP BY when only one was intended

### Step 5: Validate Data Types and Format Conformity

Type validation catches the gap between schema intent and data reality.

- For **numeric columns**: check for non-numeric characters (letters, currency symbols like `$`, `€`, `£`, thousands separators like `,`, parenthetical negatives like `(150.00)`), values outside business-plausible ranges (negative ages, salaries above $10 million or below $15,000, percentages above 100), and precision mismatches (a DECIMAL(10,2) column containing 5-decimal-place values that will be silently truncated on insert)
- For **date and datetime columns**: check for at least 6 format patterns that commonly coexist in exported data: `YYYY-MM-DD`, `MM/DD/YYYY`, `DD/MM/YYYY`, `DD-MMM-YYYY` (Excel's `15-Jan-2020`), `YYYYMMDD` (no separators), and `M/D/YY` (2-digit year). Two-digit years are ambiguous: `01/01/20` could be 2020 or 1920 depending on the pivot year. Check for dates outside plausible business ranges (hire dates before the company was founded, transaction dates in the future, birthdates implying age over 120)
- For **boolean/flag columns**: enumerate all observed representations. Common non-standard booleans include: `Y/N`, `Yes/No`, `TRUE/FALSE` (string), `1/0`, `T/F`, `Active/Inactive`, `Enabled/Disabled`. Mixed representations in a single column prevent any boolean filter from working correctly
- For **identifier columns** (email, phone, postal code, national ID, IBAN, URL, IP address): apply format pattern validation using regular expression logic. Email must match `[local]@[domain].[tld]` structure. Phone numbers in a US context should be 10 digits after stripping formatting. Postal codes vary by country -- a mix of 5-digit and 9-digit ZIP+4 codes is valid in the US but signals the need for normalization
- For **currency columns**: check whether values are stored at the correct unit (dollars vs. cents -- a $500 salary is wrong, a 50000 cents salary stored as an integer is correct). Check for currency symbol contamination. Check whether negative values appear and whether they are legitimate returns/credits or data errors
- Calculate **type conformity rate** per column: `valid_value_count / (total_rows - null_count) * 100`. Any column below 95% conformity requires a Priority 1 or Priority 2 remediation item. Any column below 99% for an identifier column (email, ID) requires investigation

### Step 6: Check Referential Integrity

Referential integrity analysis reveals whether the table can safely be joined to its related tables.

- Identify all foreign key columns. These are typically columns whose names end in `_id`, `_key`, `_code`, or `_ref`, or are documented in the schema as FK relationships
- For each FK column, determine whether the referenced parent table is available. If yes, perform a left anti-join: rows in the child table whose FK value does not exist in the parent table's PK column. These are orphaned records
- Calculate referential integrity rate: `(total_FK_rows - orphaned_rows) / total_FK_rows * 100`
- Distinguish between **hard orphans** (FK points to a value that never existed) and **soft orphans** (FK points to a parent record that was deleted -- common when parent tables are purged on a different schedule). Hard orphans indicate a pipeline defect. Soft orphans indicate a data retention policy mismatch
- Check for **reverse referential integrity**: do all values in the parent table's PK have at least one corresponding child record? A parent with zero children may be dead data or may indicate that child records are missing (e.g., a customer with no orders -- legitimate or a load failure?)
- If parent tables are not available for join, check whether the FK values follow the expected ID format and fall within the plausible range of the parent table's IDs (e.g., `manager_id` values should fall within the range of `emp_id` values in the same table for a self-referencing hierarchy)
- Check self-referencing FK columns for cycles: in an employee/manager hierarchy, verify no employee is their own manager and no circular management chain exists (A manages B manages C manages A)

### Step 7: Compute the Data Quality Score

The quality score translates technical findings into a single communicable number, but each dimension must be grounded in real calculations, not estimates.

- **Completeness Score (0-100):** `(1 - (total_missing_cells / total_cells)) * 100` where missing includes true nulls, empty strings, and identified sentinel values. Weight columns differently if the user's analytical goal is known: a null in an unused column is less severe than a null in a key metric column. For a weighted score, assign each column a business criticality (1=low, 2=medium, 3=high) based on the stated use case, then compute weighted average completeness
- **Validity Score (0-100):** Average type conformity rate across all columns, weighted by column criticality. For columns with multiple validation rules (e.g., email must be non-null, correctly formatted, and belong to the company domain), a column passes validity only if it passes all applicable rules. Single-rule passing with multiple-rule failure is a common profiling error
- **Uniqueness Score (0-100):** This dimension measures the absence of unintended duplication. Score as `(1 - (duplicate_rows / total_rows)) * 100` where duplicate rows are rows that are identical across all non-surrogate, non-timestamp columns. Note: this is NOT the same as column-level uniqueness ratio, which measures cardinality. Table-level duplicate rate measures unintended record duplication
- **Consistency Score (0-100):** Measures whether a concept is represented the same way throughout the column. Factors: format consistency (date format uniformity within a date column), case consistency (proper case vs. uppercase vs. lowercase in a name column), unit consistency (miles vs. kilometers in a distance column), and encoding consistency (UTF-8 vs. Latin-1 special character rendering). Score as percentage of columns that pass all consistency checks
- **Timeliness Score (0-100, optional):** If the user has an expected freshness SLA, score timeliness as: 100 if data is within the SLA, decreasing linearly to 0 at 3x the SLA interval. A daily feed that is 2 days old scores 67/100 on timeliness. Include this dimension only if a freshness requirement is stated
- **Overall Score:** Unweighted average of the four core dimensions (five if timeliness applies). Apply the quality tier labels: 90-100 = Excellent (production-ready), 75-89 = Good (minor issues, document and proceed), 60-74 = Fair (remediate before critical analysis), 45-59 = Poor (remediate before any analysis), below 45 = Critical (do not use without significant rework)

### Step 8: Prioritize Remediation

Remediation priority must be driven by impact on the user's stated goal, not by abstract severity.

- Score every identified issue on two axes: **Impact** (does this affect the columns and calculations needed for the stated analytical goal?) and **Effort** (can this be fixed with a formula in the current tool, or does it require contacting the source system owner, filing a pipeline bug, or manual research?)
- Create an Impact-Effort matrix with four quadrants: High Impact / Low Effort = Priority 1 (fix immediately), High Impact / High Effort = Priority 2 (schedule for next sprint, document workaround), Low Impact / Low Effort = Priority 3 (fix opportunistically), Low Impact / High Effort = Priority 4 (document and defer)
- For each remediation item, provide a **specific recommended action** -- not "fix the date format" but "convert all `MM/DD/YYYY` values to `YYYY-MM-DD` using `=TEXT(DATEVALUE(A2), "YYYY-MM-DD")` in Excel or `STR_TO_DATE(hire_date, '%m/%d/%Y')` in MySQL"
- For issues requiring source system investigation, name the specific question to ask the data owner: "Are the 12 employees with `salary = 'N/A'` contractors whose compensation is stored in a separate table, or is this missing data?"
- End the remediation list with a **"safe to proceed" assessment**: which issues must be resolved before any analysis, which can be worked around, and which are cosmetic

---

## Output Format

```
## Data Profile Report

**Table/File:** [Exact name as it appears in the system]
**Stated Grain:** [One row per ___]
**Source System:** [System name and type -- e.g., "Salesforce CRM, CSV export"]
**Owner / Maintainer:** [Name or team]
**Profiling Date:** [Date of this profile]
**Last Known Data Update:** [Date or "unknown"]
**Row Count:** [N] | **Column Count:** [N] | **Total Cells:** [N]
**Analytical Goal:** [What the user intends to do with this data]

---

### Schema Documentation

| # | Column Name | Declared Type | Inferred Type | Semantic Type | Nullable | Max Length / Precision | Description (Business Terms) | Example Values |
|---|-------------|--------------|--------------|--------------|----------|------------------------|------------------------------|----------------|
| 1 | [col_name]  | [VARCHAR(50)] | [Text]       | [Categorical Nominal] | [Yes/No] | [observed max] | [what it means] | [val1, val2, val3] |

**Schema Notes:**
- [Any column naming anomalies, reserved word conflicts, or normalization smells]

---

### Completeness Analysis

| Column | Null Count | Empty String Count | Sentinel Values | Total Missing | Completeness | Missing Type |
|--------|-----------|-------------------|-----------------|--------------|-------------|--------------|
| [name] | [N] | [N] | [list values] | [N] ([pct]%) | [pct]% | [Structural / Optional / Missing] |

**Table-Level Completeness:** [pct]% ([N] missing out of [N] total cells)
**Columns with >5% missing:** [list]
**Columns with >20% missing:** [list -- flag as high risk]

---

### Uniqueness and Cardinality Analysis

| Column | Total Rows | Distinct Values | Null Count | Uniqueness Ratio | Duplicate Count | Cardinality Tier | Notes |
|--------|-----------|----------------|-----------|-----------------|----------------|-----------------|-------|
| [name] | [N] | [N] | [N] | [pct]% | [N] | [Binary/Low/Medium/High/Near-Unique/Fully Unique] | [observations] |

**Candidate Primary Key(s):** [column(s) with 100% uniqueness -- or "None identified"]
**Composite Key Candidates:** [column pairs tested and result]
**Table-Level Duplicate Rows (full-row duplicates excluding surrogate keys):** [N] ([pct]%)
**Categorical Column Value Inventories:**
- [column_name]: [val1 (N, pct%), val2 (N, pct%), ...]

---

### Data Type and Format Validation

| Column | Expected / Inferred Type | Violation Count | Conformity Rate | Violation Examples | Root Cause |
|--------|--------------------------|----------------|----------------|-------------------|------------|
| [name] | [type] | [N] ([pct]%) | [pct]% | ["N/A", "(500.00)"] | [description] |

**Columns failing 99% conformity threshold (identifier columns):** [list]
**Columns failing 95% conformity threshold (all other columns):** [list]
**Date Format Variants Found:** [list all patterns observed across date columns]
**Boolean Representations Found:** [list all representations across flag columns]

---

### Referential Integrity Analysis

| FK Column | Referenced Table | Referenced Column | FK Row Count | Orphaned Rows | Integrity Rate | Orphan Type |
|-----------|-----------------|------------------|-------------|--------------|---------------|-------------|
| [col]     | [table]         | [pk_col]         | [N]         | [N] ([pct]%) | [pct]%        | [Hard/Soft/Unknown] |

**Parent table availability:** [Available for join / Not available -- inferred only]

---

### Data Quality Score

| Dimension | Raw Calculation | Score | Weighted Score (if goal stated) | Detail |
|-----------|----------------|-------|--------------------------------|--------|
| Completeness | (1 - [N]/[N]) * 100 | [N]/100 | [N]/100 | [N] missing cells; [list critical column completeness] |
| Validity | Avg conformity across [N] cols | [N]/100 | [N]/100 | [N] columns below 95% threshold |
| Uniqueness | (1 - [N] dup rows/[N] rows) * 100 | [N]/100 | [N]/100 | [N] full duplicate rows |
| Consistency | [N] of [N] columns pass all format checks | [N]/100 | [N]/100 | [list inconsistent columns] |
| Timeliness (if applicable) | [days stale] / [SLA days] | [N]/100 | [N]/100 | Last update [date], SLA [interval] |
| **Overall** | Average of above dimensions | **[N]/100** | **[N]/100** | **[Excellent / Good / Fair / Poor / Critical]** |

**Quality Tier Guide:** 90-100 Excellent | 75-89 Good | 60-74 Fair | 45-59 Poor | <45 Critical

---

### Remediation Priority List

| Priority | Quadrant | Issue | Column(s) | Impact on Stated Goal | Effort | Recommended Action |
|----------|----------|-------|-----------|----------------------|--------|-------------------|
| 1 | High Impact / Low Effort | [description] | [column] | [specific impact] | Low | [specific formula or action] |
| 2 | High Impact / High Effort | [description] | [column] | [specific impact] | High | [specific question to ask data owner] |
| 3 | Low Impact / Low Effort | [description] | [column] | [minor impact] | Low | [specific action] |
| 4 | Low Impact / High Effort | [description] | [column] | [no current impact] | High | Document and defer |

**Safe to Proceed Assessment:**
- **Must fix before analysis:** [list Priority 1 items]
- **Acceptable workaround:** [specific workaround for Priority 2 items]
- **Cosmetic / defer:** [Priority 3 and 4 items]
```

---

## Rules

1. **Always separate declared type, inferred type, and semantic type** -- these are three distinct findings. A column declared as TEXT, containing only integers, representing a customer identifier, needs all three recorded. The gap between declared and inferred type is a schema defect. The semantic type determines which validation rules apply
2. **Never treat the first 5-10 rows as representative** -- header records, test records, and example data disproportionately populate the beginning of exports. If you are working from user-provided samples, ask for values from multiple positions in the dataset (beginning, middle, end) before drawing conclusions about types or formats
3. **Distinguish structural nulls from missing data nulls** before assigning a completeness penalty -- a null in `manager_id` for the CEO is correct; a null in `hire_date` for an employee is missing data. Applying the same penalty to both produces misleading completeness scores and creates unnecessary remediation work
4. **Enumerate all category values for every low-cardinality column** -- do not stop at "12 distinct departments." List them with frequencies. `"Sales"` and `"sales"` appearing as two separate categories with 200 and 3 rows respectively IS the finding. The number alone misses it
5. **Always check for sentinel values masquerading as valid data**: `0` in age, `-1` in ID, `9999-12-31` in end-date, `"Unknown"`, `"N/A"`, `"#N/A"`, `"NULL"` (string, not actual NULL), `"TBD"`, `"."` (common SAS/SPSS missing marker). These pass type validation while encoding missingness and will corrupt aggregations silently
6. **For date columns, always check for two-digit year ambiguity** -- `01/01/20` is indeterminate without knowing the tool's pivot year (Excel's pivot is 1930, so 20 = 2020, but 29 = 1929 -- a different year than most users expect). Flag any date column with values that could be misinterpreted and recommend explicit 4-digit year standardization
7. **Uniqueness ratio at the column level and duplicate rate at the table level measure different things and must both be reported** -- a table with 100% unique values in every column can still have fully duplicate rows if uniqueness is assessed column-by-column rather than row-by-row. Always compute the count of rows that are identical across all non-surrogate, non-audit columns
8. **Anchor every remediation recommendation to the user's stated analytical goal** -- a format inconsistency in an unused metadata column is a different priority than the same issue in the primary grouping dimension. A profile without a stated goal must ask for one before producing the remediation priority list
9. **When profiling without access to the actual data** (user describes columns and shares sample values verbally), explicitly label every finding as "Inferred from description -- requires verification" and reduce confidence in quality scores. Do not produce a numeric quality score if fewer than 10% of rows have been described -- provide a qualitative assessment only
10. **Never recommend deleting rows or dropping columns in the profile report** -- this skill diagnoses, it does not remediate. Deletion recommendations belong in `data-cleaning-protocol`. The profile report documents what exists and what should be investigated; it does not authorize destruction of data
11. **Flag any column whose name conflicts with SQL reserved words** (`date`, `name`, `value`, `key`, `order`, `index`, `rank`, `group`, `select`, `table`, `where`) -- these require quoting in every downstream query and are a persistent source of SQL errors that analysts encounter weeks after profiling
12. **For very wide tables (30+ columns), complete full profiling on all columns but group the output** by semantic cluster (e.g., address fields, date fields, financial fields, identifier fields) -- do not truncate the profile or skip columns. Every column needs a completeness count and a type assessment, even if it is summarized in a grouped row

---

## Edge Cases

### User Provides Only Column Names and a Row Count -- No Sample Data

This is the most common scenario when a user is profiling a system they have read access to but cannot export from directly. Construct an **intent-based profile** rather than an observation-based profile:

- For each column, document declared type (from DDL or data dictionary), semantic type (inferred from column name), and expected constraints (inferred from business logic)
- Do not calculate quality scores -- instead produce a **profiling checklist**: a list of specific queries or checks the user should run against the live system to complete the profile
- Example checklist items: `SELECT COUNT(*) - COUNT(hire_date) FROM employees` (null count), `SELECT COUNT(DISTINCT emp_id) FROM employees` (uniqueness check), `SELECT MIN(hire_date), MAX(hire_date) FROM employees` (date range sanity)
- Label the entire output as "Structural Profile -- Requires Verification" and note that quality scores cannot be assigned without data observation

### Dataset Has No Primary Key and No Candidate Keys

This is a high-severity structural finding that must be surfaced prominently, not buried in a table row.

- Check 2-column composite key candidates by testing semantically meaningful pairs. For an order line table: (`order_id`, `line_number`), (`order_id`, `product_id`), etc.
- Check 3-column composites only if 2-column tests all fail
- If no combination is unique, there are three possible explanations: (1) the table is an event log or audit trail where duplicates are expected and the grain is time-stamped events, (2) the table has a hidden surrogate key that was not included in the export, or (3) the table has genuine data duplication defects
- The profile report must explicitly state: "No primary key or candidate key identified. This table cannot be safely used as a lookup table or joined without a deduplication step. Recommend confirming with data owner whether duplicate rows are expected at this grain."
- Assign a Uniqueness Score of 0/100 for the uniqueness dimension regardless of column-level uniqueness ratios

### Dataset Is a Manually Maintained Spreadsheet

Manual spreadsheets are the highest-entropy data source and require adjusted profiling expectations.

- Lower the conformity threshold for "flag as requiring attention" from 5% violations to 10% violations -- manual entry reliably produces 5-8% format errors even in well-maintained spreadsheets
- Actively look for: merged cells exported as nulls in all cells except the first, formula cells exported as their cached value (which may be stale), rows inserted as visual separators (blank rows, rows containing only dashes or asterisks), and header rows embedded mid-table to visually separate sections
- Check for Excel-specific data corruption: dates stored as serial numbers (44927 = January 1, 2023), negative date serials (pre-1900 dates), numbers stored as text (left-aligned in the cell), scientific notation applied to long numeric IDs (`1.23457E+11` truncating a 12-digit ID to 6 significant figures -- a permanent data loss)
- In the remediation list, prioritize issues that are fixable within the spreadsheet itself using native formulas: `TRIM()` for leading/trailing spaces, `CLEAN()` for non-printable characters, `VALUE()` for text-formatted numbers, `DATEVALUE()` for text-formatted dates, `PROPER()` or `UPPER()` or `LOWER()` for case standardization
- Note that Excel silently converts values matching certain patterns to other types on open: `1-2` becomes a date, `001` becomes `1` (dropping leading zeros), `=SUM` in a text cell becomes a formula. These are irreversible if the file was saved after Excel converted them

### Dataset Represents a Slowly Changing Dimension (SCD)

SCD tables -- particularly customer master, product catalog, or employee tables -- contain multiple versions of the same entity and require special handling.

- Uniqueness analysis must account for the version/history columns. `customer_id` alone will not be unique in an SCD Type 2 table -- the unique grain is (`customer_id`, `effective_date`) or (`customer_id`, `version_number`)
- Check for SCD integrity: every entity should have exactly one row where `is_current = TRUE` or `end_date IS NULL` (Type 2) or should have no overlapping effective date ranges for the same entity
- Check for gap periods: entities where the end_date of version N does not equal the start_date of version N+1 indicate missing history
- Check for future-dated current records and past-dated active records
- The quality score for an SCD table must note that uniqueness is assessed at the entity-version grain, not the entity grain, and the profile should report both the row count and the distinct entity count separately

### User Wants to Compare Two Dataset Versions

Comparative profiling (production vs. staging, before-ETL vs. after-ETL, current vs. prior period) requires a side-by-side structure, not a single profile.

- Produce the standard profile for each dataset in parallel columns or in two separate profile tables
- Add a **Comparison Delta** section that surfaces: row count difference (absolute and percentage), columns present in one but not the other, columns where the data type changed between versions, columns where completeness dropped by more than 2 percentage points, columns where distinct value counts changed by more than 10%, and overall quality score change
- A completeness drop combined with a row count increase in a column indicates a backfill failure. A completeness drop combined with a row count decrease indicates selective filtering. These have different root causes
- Flag columns where min or max values changed unexpectedly between versions -- a salary column whose maximum doubled between the production and staging snapshots suggests a data entry error or a unit conversion problem in the pipeline

### Dataset Contains Personally Identifiable Information (PII) or Sensitive Data

PII profiling requires additional handling notes regardless of whether the user raised the topic.

- During schema documentation, classify each column by sensitivity tier: **PII Direct Identifiers** (name, email, phone, national ID, passport, date of birth, exact address), **PII Quasi-Identifiers** (zip code, age, gender, job title -- individually non-identifying but combinable to re-identify), **Sensitive Non-PII** (salary, health status, religion, political affiliation), and **Non-Sensitive**
- Do not include real PII values in the Example Values column of the profile. Use anonymized or synthetic examples: instead of `john.smith@company.com`, write `[firstname].[lastname]@[company].com`
- Note in the profile header whether data masking or anonymization is required before this profile can be shared in a governance document or a public data catalog
- Flag columns that are PII but lack encryption-at-rest markers or masking in the current export -- this is a security finding that belongs in the remediation list regardless of its impact on the analytical goal

### Dataset Is Very Large (Profiling Based on a Sample)

When a user indicates the dataset has millions of rows or more, full profiling is computationally prohibitive and sampling strategy matters.

- Recommend stratified random sampling for quality statistics: 10,000 rows minimum for completeness and type conformity statistics, 100,000 rows for reliable cardinality estimates on high-cardinality columns
- For completeness and duplicate analysis, full-table aggregation queries are preferred over sampling because missingness and duplication may be concentrated in specific time periods or partitions -- a sample may miss an entire batch of bad data
- Note the sample size in the profile header and indicate which statistics are based on samples vs. full-table aggregations
- For date range and min/max validation, always query the full table -- `SELECT MIN(col), MAX(col)` is inexpensive even on large tables and reveals range issues that samples routinely miss

---

## Example

**Input:** "I have an orders table exported from our e-commerce platform with 12,450 rows. Columns: order_id, customer_id, order_date, ship_date, product_sku, quantity, unit_price, discount_pct, total_amount, status, region, sales_rep_id. I want to use this to build a monthly revenue report by region and sales rep."

---

## Data Profile Report

**Table/File:** orders (e-commerce platform export)
**Stated Grain:** One row per order line item (one product per row)
**Source System:** E-commerce platform, CSV export
**Owner / Maintainer:** Sales Operations team
**Profiling Date:** Current session
**Last Known Data Update:** Current export (date of export unknown -- recommend confirming)
**Row Count:** 12,450 | **Column Count:** 12 | **Total Cells:** 149,400
**Analytical Goal:** Monthly revenue report by region and sales rep

---

### Schema Documentation

| # | Column Name | Declared Type | Inferred Type | Semantic Type | Nullable | Max Length / Precision | Description (Business Terms) | Example Values |
|---|-------------|--------------|--------------|--------------|----------|------------------------|------------------------------|----------------|
| 1 | order_id | VARCHAR(20) | Text/Integer mix | Identifier | No | 15 chars observed | Unique identifier for each order line | ORD-10001, 10452, ORD10999 |
| 2 | customer_id | INTEGER | Integer | Foreign Key Reference | No | 6 digits | References customer master table | 100234, 200891, 100005 |
| 3 | order_date | VARCHAR(50) | Mixed date formats | Date | No | 10-19 chars | Date the order was placed | 2024-01-15, 01/22/2024, Jan 5 2024 |
| 4 | ship_date | VARCHAR(50) | Mixed date formats | Date | Yes | 10-19 chars | Date order was shipped to customer | 2024-01-18, 01/25/2024, NULL |
| 5 | product_sku | VARCHAR(20) | Text | Identifier (FK) | No | 12 chars observed | Product stock keeping unit | SKU-A1042, SKU-B0321, SKU-C9911 |
| 6 | quantity | INTEGER | Integer with text | Discrete Count | No | 4 digits | Units ordered | 1, 5, 12, "bulk" |
| 7 | unit_price | DECIMAL(10,2) | Mixed -- decimal and text | Currency Amount | No | 10 chars | Per-unit price in USD at time of sale | 29.99, 149.00, $85.50 |
| 8 | discount_pct | DECIMAL(5,2) | Mixed -- decimal, integer, text | Percentage / Ratio | Yes | 6 chars | Discount percentage applied (0-100 scale) | 0, 10, 15.5, 100, "N/A" |
| 9 | total_amount | DECIMAL(10,2) | Mixed | Currency Amount | No | 12 chars | Order line total after discount | 29.99, 637.50, (45.00) |
| 10 | status | VARCHAR(20) | Text | Categorical Nominal | No | 12 chars | Current fulfillment status | Shipped, Delivered, Cancelled, shipped |
| 11 | region | VARCHAR(50) | Text | Categorical Nominal | No | 15 chars | Geographic sales region | Northeast, Southwest, NE, North East |
| 12 | sales_rep_id | VARCHAR(10) | Mixed integer and NULL | Foreign Key Reference | Yes | 8 chars | Sales rep identifier (FK to reps table) | SR-1042, SR-0891, NULL |

**Schema Notes:**
- `order_id` has inconsistent format: some values are prefixed with "ORD-" and some are plain integers. This is an identifier integrity issue -- uniqueness analysis will clarify whether these represent different ID systems or formatting inconsistencies in the same system
- `status` and `region` both show case variation in the declared examples, which will be quantified in type/consistency validation
- `total_amount` contains parenthetical negative values -- a common accounting convention for credits/returns that will fail standard numeric parsing

---

### Completeness Analysis

| Column | Null Count | Empty String Count | Sentinel Values | Total Missing | Completeness | Missing Type |
|--------|-----------|-------------------|-----------------|--------------|-------------|--------------|
| order_id | 0 | 0 | 0 | 0 (0%) | 100% | N/A |
| customer_id | 0 | 0 | 0 | 0 (0%) | 100% | N/A |
| order_date | 0 | 0 | 0 | 0 (0%) | 100% | N/A |
| ship_date | ~1,240 | ~85 | 0 | ~1,325 (10.6%) | 89.4% | Structural -- unshipped/cancelled orders expected to lack ship date |
| product_sku | 0 | 0 | 0 | 0 (0%) | 100% | N/A |
| quantity | 0 | 0 | ~15 ("bulk") | ~15 (0.1%) | 99.9% | Missing -- sentinel value encodes unknown quantity |
| unit_price | 0 | 0 | 0 | 0 (0%) | 100% | N/A |
| discount_pct | ~320 | 0 | ~210 ("N/A") | ~530 (4.3%) | 95.7% | Mixed -- nulls may be structural (no discount program), "N/A" is sentinel |
| total_amount | 0 | 0 | 0 | 0 (0%) | 100% | N/A |
| status | 0 | 0 | 0 | 0 (0%) | 100% | N/A |
| region | 0 | 0 | 0 | 0 (0%) | 100% | N/A |
| sales_rep_id | ~890 | 0 | 0 | ~890 (7.1%) | 92.9% | Mixed -- direct web orders have no sales rep (structural); some may be missing |

**Table-Level Completeness:** 98.7% (~1,980 missing out of 149,400 total cells)
**Columns with >5% missing:** ship_date (10.6%), sales_rep_id (7.1%)
**Columns with >20% missing:** None
**Note:** `ship_date` missingness at 10.6% is likely structural for cancelled and pending orders. Verify whether cancelled order percentage matches this null rate. If cancelled + pending orders = ~10.6% of orders, this is expected. If cancelled + pending orders are only 3%, then 7.6% of ship_dates are genuinely missing data.

---

### Uniqueness and Cardinality Analysis

| Column | Total Rows | Distinct Values | Null Count | Uniqueness Ratio | Duplicate Count | Cardinality Tier | Notes |
|--------|-----------|----------------|-----------|-----------------|----------------|-----------------|-------|
| order_id | 12,450 | 12,403 | 0 | 99.6% | 47 | Near-Unique | 47 duplicates to investigate -- likely from "ORD-" vs plain integer formatting of same ID |
| customer_id | 12,450 | 3,218 | 0 | 25.8% | -- | Medium | ~3,200 unique customers across 12,450 orders |
| order_date | 12,450 | 387 | 0 | 3.1% | -- | Low-Medium | ~387 distinct order dates -- plausible for daily orders over ~1 year |
| ship_date | 11,125 | 362 | 1,325 | 3.3% | -- | Low-Medium | Assessed on non-null rows only |
| product_sku | 12,450 | 842 | 0 | 6.8% | -- | Low-Medium | 842 distinct SKUs -- verify against product catalog size |
| quantity | 12,450 | 67 | 0 | 0.5% | -- | Low | Quantities 1-50 expected; values above 100 should be verified |
| unit_price | 12,450 | 1,205 | 0 | 9.7% | -- | Medium | 1,205 distinct prices -- may include historical prices if prices change over time |
| discount_pct | 11,920 | 28 | 530 | 0.2% | -- | Low | Only 28 distinct discount percentages -- categorical in practice |
| total_amount | 12,450 | 8,943 | 0 | 71.8% | -- | High | High cardinality expected for calculated monetary values |
| status | 12,450 | 7 | 0 | 0.056% | -- | Binary-Low | 7 distinct values observed -- should be 5 (see consistency notes) |
| region | 12,450 | 9 | 0 | 0.072% | -- | Low | 9 distinct values observed -- should be 5 (see consistency notes) |
| sales_rep_id | 11,560 | 145 | 890 | 1.3% | -- | Low | 145 distinct sales reps |

**Candidate Primary Key(s):** None -- `order_id` is 99.6% unique but has 47 duplicates. No single column achieves 100% uniqueness.
**Composite Key Candidates Tested:**
- (`order_id`, `product_sku`): Not tested -- requires data access. Recommended as the most semantically likely natural key for an order line table.
- If the stated grain is one row per order (not per line), then `order_id` should be the PK and the 47 duplicates are defects.
**Table-Level Duplicate Rows (full-row duplicates excluding surrogate keys):** Unknown without data access -- recommend: `SELECT order_id, COUNT(*) FROM orders GROUP BY order_id HAVING COUNT(*) > 1`

**Categorical Column Value Inventories (based on stated examples -- requires full enumeration):**
- **status** (7 observed, should be 5): "Shipped" (~6,200, 49.8%), "Delivered" (~3,800, 30.5%), "Cancelled" (~1,100, 8.8%), "Pending" (~900, 7.2%), "Processing" (~405, 3.3%), "shipped" (case variant -- ~30, 0.2%), "CANCELLED" (case variant -- ~15, 0.1%)
- **region** (9 observed, should be 5): "Northeast" (~3,100), "Southwest" (~2,800), "Southeast" (~2,200), "Midwest" (~2,100), "West" (~2,000), "NE" (variant for Northeast -- ~120), "North East" (variant -- ~80), "S.W." (variant for Southwest -- ~35), "midwest" (case variant -- ~15)

---

### Data Type and Format Validation

| Column | Expected / Inferred Type | Violation Count | Conformity Rate | Violation Examples | Root Cause |
|--------|--------------------------|----------------|----------------|-------------------|------------|
| order_id | Standardized text identifier | ~47 (0.4%) | 99.6% | "10452" vs "ORD-10452" (same ID, two formats) | Format applied inconsistently -- likely a system migration or two entry points |
| order_date | Date (YYYY-MM-DD standard) | ~840 (6.7%) | 93.3% | "01/22/2024", "Jan 5 2024" | Multiple input sources (API, manual entry, system import) using different locale settings |
| ship_date | Date (YYYY-MM-DD standard) | ~310 (2.8% of non-null) | 97.2% (non-null) | "01/25/2024", "25-Jan-24" | Same as order_date |
| quantity | Positive integer | ~15 (0.1%) | 99.9% | "bulk" | Free-text entry in numeric field -- likely B2B bulk orders entered manually |
| unit_price | DECIMAL(10,2), positive | ~185 (1.5%) | 98.5% | "$85.50", "€29.99" | Currency symbols included -- suggest export from a system that stores formatted display values rather than raw numeric values |
| discount_pct | DECIMAL(5,2), 0-100 range | ~210 (1.7%) | 98.3% | "N/A" (sentinel), "100" (verify -- 100% discount means free) | Sentinel values in numeric column; 100% discounts should be verified as intentional |
| total_amount | DECIMAL(10,2), may be negative | ~95 (0.8%) | 99.2% | "(45.00)" | Accounting parenthetical negative format -- returns/credits. Not a true violation but requires parser handling |
| status | Controlled vocabulary, 5 values | ~45 (0.4%) | 99.6% | "shipped", "CANCELLED" | Case inconsistency from multiple entry points |
| region |
