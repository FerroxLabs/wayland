---
name: data-cleaning-protocol
description: |
  Generates a priority-ordered data cleaning protocol for a specific dataset. Identifies quality issues (duplicates, nulls, type mismatches, outliers) and produces the exact cleaning operations with formulas and documentation.
  Use when the user has a dataset with quality problems and needs a systematic plan to clean it before analysis.
  Do NOT use for initial data exploration (use eda-framework), statistical testing (use hypothesis-testing), or writing SQL/Python cleaning scripts (software-development scope).
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
# Data Cleaning Protocol

## When to Use

**Use this skill when:**
- A user provides a dataset description (column names, row counts, source system) and asks for a cleaning plan before running analysis, modeling, or reporting
- A user describes specific data quality symptoms: "some rows are duplicated," "this column has a lot of blanks," "dates are coming through as text," "my revenue totals don't match the source system"
- A user needs a documented, reproducible cleaning protocol they can hand off to a colleague or apply again when new data arrives
- A user has already performed exploratory analysis (using `eda-framework`) and now has a concrete list of quality problems to fix
- A user is preparing data for a downstream consumer -- a dashboard, a model training pipeline, a regulatory submission -- and needs to demonstrate data lineage and cleaning decisions
- A user reports that summary statistics look wrong: totals that don't add up, averages that seem too high or low, category counts that don't match known business reality
- A user is merging two datasets and needs to reconcile inconsistent keys, overlapping records, or conflicting values before joining

**Do NOT use when:**
- The user has not yet looked at the data and wants to understand its structure and distribution first -- use `eda-framework` to profile the dataset before identifying cleaning targets
- The user wants to write Python (pandas, pyarrow), R (tidyr, dplyr), or SQL scripts to implement the cleaning -- that is software-development scope; this skill produces the specification, not the code
- The user wants to build a reusable validation pipeline or schema enforcement layer to prevent future quality problems -- use `data-validation-setup`
- The user is auditing an Excel model with formula errors -- use `spreadsheet-model-audit`
- The user wants to perform statistical analysis, hypothesis testing, or regression on already-clean data -- use `hypothesis-testing` or `statistical-modeling`
- The dataset is a time series with missing intervals that require interpolation methods beyond basic imputation -- that requires specialized forecasting treatment
- The user is working with unstructured text data (free-form notes, emails, documents) that requires NLP preprocessing -- cleaning structured tabular data is this skill's scope

---

## Process

### Step 1: Intake -- Characterize the Dataset and Cleaning Goals

Before identifying any issues, establish the full context. A cleaning decision that is correct for one use case may be wrong for another.

- Ask for the dataset dimensions: exact row count, column count, and a list of all column names with their expected data types (integer, float, string, boolean, date, categorical)
- Ask about the data source and how it was generated: exported from a CRM, pulled from a database, entered manually in a spreadsheet, merged from multiple files -- each source has characteristic failure modes
- Ask which columns are **analytically critical** (must be clean and complete for the analysis to be valid) versus **contextual** (useful but not required)
- Ask what the final analytical use case is: revenue reporting, customer segmentation, machine learning feature engineering, regulatory audit -- this determines severity ratings and acceptable data loss thresholds
- Ask whether cleaning must be **non-destructive** (original values preserved, cleaned values in new columns) or **destructive** (modify in place) -- this affects the entire protocol structure
- Ask if the user already knows of any specific issues, and note these as "confirmed" in the inventory -- they get higher priority than suspected issues
- Ask whether there is a reference dataset or business rule document the data should conform to (e.g., "all product codes should match codes in our master product table")

---

### Step 2: Construct the Issue Inventory

Systematically scan every column against a standard checklist. Do not rely on what the user self-reports -- unknown issues are as dangerous as known ones.

**Exact Duplicate Detection:**
- Check for fully identical rows (all columns match): count duplicate row groups
- Check for duplicate **keys** (primary identifier column matches, but other columns may differ): this is a "conflicting duplicate" -- more dangerous than an exact duplicate because auto-removal destroys information
- A dataset with 3% duplicate rows in a 100,000-row file contains 3,000 phantom records that inflate every aggregation

**Missing Value Audit (per column):**
- Count explicit nulls/blanks
- Count **implicit nulls**: placeholder values that represent missing data but are not technically null -- common patterns include: -1, -999, 0 in columns that should never be zero, "N/A", "n/a", "NA", "null", "NULL", "None", "unknown", "?", "#N/A", single space characters, and "00/00/0000" in date fields
- Calculate missing percentage: below 1% is typically ignorable with removal; 1--5% requires documented strategy; 5--15% requires careful imputation; above 15% requires column-level decision; above 50% in a critical column -- escalate to "column reliability" question
- Note the **missingness pattern**: is it random (MCAR -- Missing Completely At Random), correlated with another column value (MAR -- Missing At Random), or systematically tied to the value itself (MNAR -- Missing Not At Random)? MNAR missingness is the most dangerous -- removing these rows introduces bias

**Type Mismatch Detection:**
- Text in numeric columns: look for currency symbols ($, £, €), thousand separators (commas in numbers), percentage signs, text annotations embedded in number cells ("1,200 units"), mixed types in the same column
- Dates stored as text: "January 5, 2023" vs "2023-01-05" vs "01/05/23" vs "1/5/2023" -- all represent the same day but none will parse as dates without cleaning; also check for ambiguous formats (01/02/03 could be Jan 2 or Feb 1 depending on locale)
- Booleans with non-standard encoding: "Yes"/"No", "Y"/"N", "1"/"0", "TRUE"/"FALSE", "true"/"false", "T"/"F" all in the same column
- IDs with leading zeros stripped: ZIP code "01234" becoming 1234 after Excel auto-format conversion -- this is a silent corruption

**Format Inconsistency Detection:**
- Case variation: "New York" vs "new york" vs "NEW YORK" vs "New york" -- will appear as four distinct categories in a GROUP BY
- Whitespace contamination: leading spaces, trailing spaces, double internal spaces -- these create invisible duplicates in joins and group aggregations
- Category label drift: "Full-Time" vs "Full Time" vs "FT" vs "full-time" -- multiple representations of the same category
- Unit inconsistencies: revenue in some rows as dollars, others as thousands; weight in kg vs lbs in the same column with no indicator

**Outlier and Range Violation Detection:**
- Hard violations (physically impossible): negative ages, quantities of -500, dates in year 1900 (Excel's default null date), percentages above 100% or below 0%, future dates in historical datasets
- Soft violations (statistically suspicious): use the IQR method (values below Q1 -- 1.5*IQR or above Q3 + 1.5*IQR) for a first-pass flag; use 3-sigma (mean ± 3 standard deviations) for normally distributed data; use domain-specific thresholds where known (e.g., "no single order should exceed $1M for this business")
- For each outlier, classify as: data entry error (likely remove or correct), legitimate extreme value (keep, optionally flag), or measurement error (keep with flag, exclude from certain analyses)

**Structural Issue Detection:**
- Multi-value cells: "Product A; Product B" in a single cell, comma-separated lists, pipe-delimited values
- Merged cells in spreadsheets that span multiple rows
- Headers duplicated partway through the data (common in Excel exports where filters were reset)
- Row-level metadata mixed into data rows (subtotals, grand totals, section dividers)
- Inconsistent column counts across rows (a sign of delimiter problems in CSV files)

---

### Step 3: Classify Severity and Assign Priority

Assign every identified issue a severity level using consistent criteria, not intuition.

**CRITICAL -- Must fix before any analysis can produce valid results:**
- Duplicate primary keys that inflate counts or joins
- Type errors that prevent a column from being used at all (dates stored as text in the analysis key column)
- Missing values above 15% in a column that is analytically critical
- Structural corruption (multi-value cells in join keys, embedded totals in data rows)

**HIGH -- Fix before final analysis; proceeding without fixing produces misleading results:**
- Missing values 5--15% in critical columns
- Implicit nulls (-999, "unknown") in numeric or categorical columns used in aggregations
- Date format ambiguity in time-based analysis columns
- Unit inconsistencies in any numeric column used for calculations

**MEDIUM -- Fix before reporting; may not affect aggregate results significantly but affects detail-level accuracy:**
- Case inconsistencies in categorical grouping columns
- Whitespace contamination in key or join columns
- Missing values below 5% with straightforward imputation available
- Outliers that are statistically suspicious but not logically impossible

**LOW -- Address if time permits; document if not fixed:**
- Format inconsistencies in non-analytical columns (address formatting, name casing in a name column not used for joins)
- Missing values below 1% in non-critical columns
- Outliers in columns not central to the analysis

---

### Step 4: Specify the Exact Cleaning Operation for Each Issue

For every issue in the inventory, specify the operation at a level precise enough that someone else can execute it without asking questions.

**Deduplication -- exact approach by duplicate type:**
- Exact row duplicates: sort by all columns, identify rows where every field matches the prior row, remove all but the first occurrence, count removals
- Key duplicates (same ID, different values): do not auto-remove -- list the conflicting rows side by side and require a resolution rule from the user; common rules: keep the record with the most recent timestamp, keep the record with the fewest null values, keep the record from the authoritative source system
- Near-duplicates (same entity, slightly different spellings): "John Smith" vs "John Smyth" -- flag for manual review; never auto-resolve without user confirmation unless a canonical list exists (master data file)

**Missing value treatment -- exact strategy by column type and missingness level:**
- Remove the row: only when missing percentage is very low (below 2%), the value is in a critical column with no derivation possible, and the resulting data loss is documented
- Mean imputation: only for normally distributed continuous numeric columns (verify with a histogram or skewness check); use the column mean; document: "Imputed 47 missing values in `unit_cost` with column mean of $12.43"
- Median imputation: preferred for skewed continuous numeric columns (skewness absolute value above 0.5); median is resistant to outlier influence that would distort the mean
- Mode imputation: for categorical columns with low cardinality (fewer than 20 distinct values) and low missingness (below 5%); document which mode value was used
- Forward fill / backward fill: only appropriate for time-ordered datasets where the missing value logically inherits from the previous or next record (e.g., sensor readings, daily inventory snapshots)
- Indicator imputation (predictive): for MNAR data, create a binary flag column "is_{column}_missing" = 1 where value is missing, then impute with median/mode for the numeric column -- this preserves the missingness signal for downstream modeling
- Leave as missing: when the column is not critical, when the missingness is itself analytically meaningful (customers who didn't fill in a field may be a distinct segment), or when above 50% of values are missing and no imputation is defensible

**Type correction -- exact conversion steps:**
- Text-to-numeric: strip all non-numeric characters (currency symbols, commas, percent signs, units) using SUBSTITUTE or TRIM operations, then convert to number; verify no "#VALUE!" errors remain
- Text-to-date: determine the actual format in the source data, then apply the appropriate parse rule; if format is ambiguous (01/02/03), ask the user to confirm locale; after conversion, validate all dates fall within a sensible range
- Boolean normalization: choose one canonical representation (1/0 or TRUE/FALSE), map all variants to that representation, document the mapping table

**Format standardization -- exact operations:**
- Whitespace: TRIM removes leading and trailing spaces and collapses internal multiple spaces to single spaces -- apply to every text column used for joins or group-by operations; also check for non-breaking spaces (character code 160) which TRIM does not remove
- Case standardization: apply consistently within a column based on the column's role; join keys -- lowercase or uppercase consistently; display names -- title case; codes and IDs -- uppercase
- Category consolidation: build an explicit mapping table listing each observed variant and its canonical target before executing any replacement; never apply string replacement blindly without reviewing all values first

**Outlier treatment -- exact decision by outlier type:**
- Data entry error (age = 999, quantity = -500): remove or correct; document which records and what the corrected value is based on -- do not guess
- Legitimate extreme value (a single enterprise customer with $10M revenue in a file where median is $5,000): keep, flag with an outlier indicator column, and note in the cleaning log that it was reviewed and confirmed legitimate
- Statistically suspicious but domain-plausible: cap at a defined threshold (e.g., 99th percentile value) for modeling purposes, but preserve the original value in a "_raw" column; document the cap threshold

---

### Step 5: Establish the Cleaning Sequence

Execute operations in this mandatory order to prevent cascading errors:

**Order 1 -- Structural repairs:** Fix merged cells, split multi-value columns, remove embedded totals/headers, standardize the table shape. Reason: all subsequent operations assume a flat, rectangular table.

**Order 2 -- Deduplication:** Remove exact duplicates, flag conflicting duplicates. Reason: duplicate rows inflate missing value counts (a column with 100 missing values across 1,000 real rows and 200 duplicates actually has 100 missing values in 800 unique rows -- the missing rate is 12.5%, not 10%). Running imputation before deduplication produces wrong imputation statistics.

**Order 3 -- Implicit null conversion:** Replace all placeholder values (-999, "N/A", "unknown", 0 in impossible-zero columns) with proper nulls. Reason: these must be null before the missing value treatment step -- leaving them as values means they contaminate averages, counts, and mode calculations.

**Order 4 -- Type corrections:** Convert text-dates to dates, text-numbers to numbers, normalize booleans. Reason: format standardization and imputation both depend on the correct data type being recognized.

**Order 5 -- Format standardization:** TRIM whitespace, standardize case, consolidate category labels. Reason: must happen after type correction because type correction may introduce new string artifacts; must happen before deduplication of near-duplicates.

**Order 6 -- Missing value treatment:** Apply the column-specific strategy (remove, impute, flag). Reason: happens after all upstream cleaning because imputation statistics must be computed on the clean population, not the dirty one.

**Order 7 -- Outlier treatment:** Apply flags, caps, or removals. Reason: happens last because outlier detection thresholds (IQR, mean, standard deviation) are distorted by duplicates, type errors, and implicit nulls -- clean those first to get accurate statistics.

**Order 8 -- Derived column recalculation:** Recalculate any computed fields (totals, ratios, concatenations) that depend on columns cleaned in earlier steps. Reason: cleaning a component field (quantity, unit_price) does not automatically update a pre-calculated total -- the total must be recomputed.

---

### Step 6: Build the Cleaning Log

Every operation must be logged before execution, not after. The log is the audit trail.

- Each log entry must specify: the operation type, the column(s) affected, the rule applied (the exact criterion used to select records for modification), the count of records affected, the before state, the after state, and the data quality rationale
- For removals: log what was removed -- "47 rows removed where order_date = NULL and no other date field was present and the product column was also NULL -- fully uninformative records"
- For imputations: log the computed statistic -- "median of 234.50 computed from 4,812 non-null values in `order_value`; applied to 188 null values (3.8% of rows)"
- For replacements: log the replacement count -- "category label 'FT' replaced with 'Full-Time' in 312 rows in `employment_type` column; 'full time' (lowercase) replaced in 89 rows"
- Number every log entry sequentially -- this sequence is also the execution order

---

### Step 7: Define the Validation Checklist

Cleaning is only complete when validated. Specify validation checks that confirm each cleaning step produced the expected result and did not introduce new problems.

- **Row count reconciliation:** Total rows before cleaning, rows removed (by reason), rows after cleaning must sum correctly: Before = After + Removed
- **Critical column completeness check:** After cleaning, critical columns must have null count of zero (or the documented acceptable residual null count)
- **Type verification:** Every column's data type must match its expected type -- no text values remaining in numeric columns, no unparsed strings in date columns
- **Duplicate check:** After deduplication, the count of distinct primary key values must equal the row count
- **Range validation:** Min and max of numeric columns must fall within defined acceptable ranges (no negative ages, no future order dates, no unit prices above the highest known price point)
- **Distribution comparison:** Compute mean, median, and standard deviation for each numeric column before and after cleaning -- large changes indicate over-cleaning or imputation errors; a mean shifting by more than 10% after imputation is a warning sign
- **Join key integrity:** If this dataset will be joined to another, verify the join key values are all present in the reference table (or document the expected orphan rate)
- **Business rule verification:** The totals that matter to the user should be spot-checked: total revenue before vs. after, total record count by category, counts of specific known events

---

## Output Format

```
## Data Cleaning Protocol

**Dataset:** [Name or description of the dataset]
**Total Records (before cleaning):** [Exact count]
**Total Columns:** [Exact count]
**Data Source:** [System, export type, or origin]
**Analysis Goal:** [What the cleaned data will be used for]
**Critical Columns:** [Comma-separated list -- these columns must be clean and complete]
**Contextual Columns:** [Columns that inform but are not required for the core analysis]
**Cleaning Mode:** [Non-destructive (new _cleaned columns added) / Destructive (modify in place)]
**Acceptable Data Loss Threshold:** [e.g., "Removal of up to 5% of rows is acceptable"]

---

### Issue Inventory

| # | Issue Type | Column(s) | Description | Severity | Est. Records Affected | Est. % of Dataset | Confirmed or Suspected |
|---|------------|-----------|-------------|----------|-----------------------|-------------------|------------------------|
| 1 | [type] | [column(s)] | [specific description] | CRITICAL | [N] | [pct]% | [Confirmed/Suspected] |
| 2 | [type] | [column(s)] | [specific description] | HIGH | [N] | [pct]% | [Confirmed/Suspected] |
| 3 | [type] | [column(s)] | [specific description] | MEDIUM | [N] | [pct]% | [Confirmed/Suspected] |

**Issue Summary:**
- CRITICAL issues: [count]
- HIGH issues: [count]
- MEDIUM issues: [count]
- LOW issues: [count]

---

### Missing Value Strategy

| Column | Null Count | Implicit Null Patterns | Total Missing | % Missing | Missingness Type | Strategy | Imputation Value or Rule | Rationale |
|--------|------------|------------------------|---------------|-----------|------------------|----------|--------------------------|-----------|
| [col]  | [N]        | [e.g., -999, "unknown"] | [N]          | [pct]%    | MCAR/MAR/MNAR    | [Remove/Impute mean/Impute median/Mode/Forward fill/Flag/Leave] | [exact value or formula] | [why this strategy] |

---

### Cleaning Operations (Execute in This Order)

#### Operation 1: [Structural Repair / Deduplication / Type Correction / Format Standardization / Implicit Null Conversion / Missing Value Treatment / Outlier Treatment / Derived Column Recalculation]

**Issue:** [Precise description of what is wrong]
**Severity:** [CRITICAL / HIGH / MEDIUM / LOW]
**Affected Columns:** [Column name(s)]
**Estimated Records Affected:** [N] ([pct]% of dataset)

**Operation Steps:**
1. [Exact step with specific logic -- e.g., "Identify rows where quantity * unit_price differs from total by more than $0.01"]
2. [Next step]
3. [...]

**Decision Rule:** [The criterion used to select records for modification or removal]
**Expected Result:** [What the column/dataset should look like after this operation]
**New Column Created (if non-destructive):** [column_name_cleaned or is_column_flagged]

**Verification Check:** [Specific check to confirm the operation succeeded -- e.g., "COUNT of NULL values in quantity_cleaned should equal 0"]

---

#### Operation 2: [Category]

[Same structure repeated for every identified issue, in execution order]

---

### Cleaning Log (Complete Before Beginning)

| Seq | Operation Type | Column(s) | Records Changed | Rule Applied | Before State | After State | Data Loss Impact |
|-----|---------------|-----------|-----------------|--------------|--------------|-------------|------------------|
| 1   | [action]      | [col]     | [N]             | [criterion]  | [state]      | [state]     | [rows removed and %, or "No loss"] |
| 2   | [action]      | [col]     | [N]             | [criterion]  | [state]      | [state]     | [rows removed and %, or "No loss"] |

**Cumulative Data Loss:** [N] rows removed = [pct]% of original dataset
**Acceptable:** [Yes -- within [pct]% threshold / No -- review before proceeding]

---

### Post-Cleaning Validation Checklist

| Check | Expected Result | How to Verify |
|-------|----------------|---------------|
| Row count reconciliation | [Before] rows = [After] rows + [Removed] rows | COUNT(*) before and after each removal operation |
| Primary key uniqueness | Distinct [key_column] count = total row count | COUNT(*) minus COUNT(DISTINCT [key_column]) = 0 |
| Critical column completeness | [list columns] have 0 null values | COUNT of nulls in each critical column |
| Numeric column type check | No text values remain in [list columns] | Attempt numeric cast on each column -- 0 errors |
| Date column range check | All [date_column] values between [min_date] and [max_date] | MIN and MAX of date column |
| Outlier boundary check | [column] min >= [lower_bound], max <= [upper_bound] | MIN and MAX check against defined thresholds |
| Distribution shift check | Mean of [key_metric] within [pct]% of pre-cleaning value | Compute mean before and after, compare |
| Business total reconciliation | [metric] total = [expected value or within [pct]% of source] | SUM of [metric] after cleaning |

---

### Post-Cleaning Summary (Fill In After Execution)

- Total records before cleaning: [N]
- Records removed (exact duplicates): [N] ([pct]%)
- Records removed (missing critical values): [N] ([pct]%)
- Records removed (other): [N] ([pct]%) -- [reason]
- Total records after cleaning: [N]
- Records modified (imputed values): [N] ([pct]%)
- Records flagged (outliers): [N] ([pct]%)
- New columns added: [list]
- Cleaning log entries: [count]
- Validation checks passed: [N] of [total]
- Issues requiring user decision (conflicting duplicates, high-missing-rate columns): [list or "None"]
```

---

## Rules

1. **Never recommend removing data without quantifying the impact first.** Every proposed row removal must state: records removed, percentage of dataset lost, and whether the removed records are representative or systematically different from the kept records. Removing all records with a null age is not equivalent to random sampling if age is missing more often for younger customers.

2. **Deduplication must always precede missing value treatment.** Duplicate rows inflate row counts, which makes missing value percentages appear lower than they are on the true unique record set. Running imputation before deduplication produces imputation statistics calculated on an inflated population.

3. **Implicit nulls are as dangerous as explicit nulls -- and more deceptive.** Always scan for -999, -1, 0 (in columns that cannot logically be zero), "N/A", "unknown", "NULL" (as text), and sentinel dates like 1900-01-01 or 9999-12-31 before counting missing values. A dataset that appears to have 2% missing revenue values may actually have 18% when implicit nulls are counted.

4. **Never consolidate near-duplicate entity records without a user-confirmed resolution rule.** "John Smith" and "Jon Smith" might be two different people. Presenting the conflicting records and asking for a rule is always correct; silently merging is never acceptable.

5. **Imputation must use statistics computed from the post-cleaning, post-deduplication population.** If you compute the mean for imputation from a dirty dataset that contains duplicates and implicit nulls, the imputed value will be wrong. Clean the column of explicit and implicit nulls, remove duplicates, then compute the imputation statistic.

6. **Mean imputation is wrong for skewed distributions.** Check skewness before choosing imputation method. For a revenue column with skewness above 1.0 (which is typical -- most customers spend small amounts, a few spend large amounts), mean imputation will systematically overstate the imputed value. Use median for skewed data.

7. **Every cleaning operation must be reversible or non-destructive.** Either work on a copy of the dataset or create new cleaned columns beside originals. If cleaning is destructive, the original must be backed up and the backup location documented. Cleaning that cannot be undone is a data governance violation.

8. **Outlier removal requires explicit domain justification, not just statistical thresholds.** "This value is 4 standard deviations from the mean" is a flag, not a reason to remove. A large enterprise customer generating 10x average revenue is statistically an outlier but is likely the most important customer in the file. State the business reason for any removal: "Removed because this value (age = 847) is physically impossible and confirmed as a data entry error," not "Removed because it was an outlier."

9. **Never clean a column in isolation from its dependencies.** If `total = quantity * unit_price`, cleaning quantity without recalculating total leaves an inconsistency. Every derived column that depends on a cleaned source column must appear in the cleaning log as a recalculation step executed after all its source columns are cleaned.

10. **The cleaning protocol must end with a validation step that a third party could execute independently.** Validation checks must be specific and verifiable: "The SUM of `revenue_cleaned` should equal $4,237,891 (±2% to account for legitimate duplicate removal)" is valid. "The data looks better" is not. If validation reveals the post-cleaning totals diverge from expectations by more than the documented threshold, stop and investigate before proceeding to analysis.

11. **Document not only what was done but what was decided NOT to do.** If a column has 25% missing values and the decision is to leave it as-is because it is not critical, that decision must appear in the cleaning log: "Column `secondary_phone` -- 25% missing -- not critical for revenue analysis -- no action taken, documented." Silence about a known issue is an audit risk.

12. **Whitespace contamination in join keys is a silent killer.** A customer_id of "C-1042 " (with a trailing space) will never match "C-1042" in a JOIN operation, creating phantom orphan records. TRIM must be applied to every column that will be used as a join key or GROUP BY column before any join or aggregation is performed.

---

## Edge Cases

### The User Has No Idea What Is Wrong With Their Data

Do not ask the user to investigate first -- they came to you because they cannot. Generate a complete issue inventory framework and walk through it systematically using whatever dataset description they have provided.

Apply the standard detection checklist in order: (1) check for exact duplicate rows and key duplicates, (2) count explicit nulls per column and report the top 5 most-null columns, (3) check for implicit nulls using the standard sentinel patterns (-999, -1, "N/A", "unknown", 0 in non-zero columns), (4) check each column's data type against its expected type, (5) compute min/max on all numeric columns and flag values outside plausible ranges, (6) compute distinct value counts on low-cardinality columns and flag inconsistent labels, (7) check date columns for minimum and maximum dates and flag dates in year 1900 or after the current date.

Present the inventory as a table even before you know exact counts -- mark suspected issues as "Suspected, count unknown" and explain how to verify the count. Then produce the protocol against the suspected issues and note where verification is required before executing.

---

### Dataset Has More Than 50% Missing Values in a Critical Column

This is a data acquisition problem, not a cleaning problem. Imputing more than 50% of a column means the column is mostly made-up. Do not recommend imputation.

Present three options with explicit trade-offs:
- **Drop the column from analysis:** Lowest risk, safest, but limits what can be analyzed. Document: "Column `gross_margin` dropped from analysis -- 67% of values missing, insufficient data to produce reliable results."
- **Treat missingness as a feature:** Create a binary indicator column `is_{column}_missing` (1 = missing, 0 = present) and include that indicator in analysis instead of the original values. This is appropriate when the fact of missingness is itself analytically meaningful (e.g., customers who did not provide an income figure may form a distinct behavioral segment).
- **Acquire the data:** If the column can be sourced from another system or file, document what is needed and return to cleaning after acquisition.

Never produce an imputation strategy for a column with more than 50% missingness without explicitly flagging this as high-risk and explaining why the imputed values would be statistically unreliable.

---

### Conflicting Duplicate Records (Same Key, Different Values)

This is the most dangerous duplicate type and must never be auto-resolved. Two records with the same `order_id` but different `total` values mean either a legitimate update was not properly deduplicated, data was entered twice with different values, or the records came from two different source systems with different data at the time of export.

Present the conflicting records in a side-by-side comparison table. Then ask the user to choose from one of these resolution rules:
- **Keep most recent (by timestamp):** Only valid if a reliable timestamp column exists. Specify which column.
- **Keep most complete (fewest nulls):** Count nulls per record in the duplicate set; keep the one with the fewest. Specify tie-breaking rule.
- **Keep first occurrence (by row order):** Assumes the first occurrence is the canonical record. Lowest risk, but only correct if data is ordered by entry time.
- **Keep the source-authoritative record:** If records came from multiple systems, define which system's values take precedence. Requires source system column to be present.
- **Merge fields:** Keep non-null values from either record. Only safe when fields are mutually exclusive (one record has value, the other has null). Document each field's source.

Do not proceed with deduplication until the user has chosen a resolution rule and it is documented in the cleaning log.

---

### Date Format Ambiguity (Locale-Dependent Formats)

When a date column contains values that could be interpreted as either MM/DD/YYYY or DD/MM/YYYY, do not guess. The error rate from guessing is exactly 12/365 = 3.3% for dates where the day is 12 or below -- a silent corruption affecting months of data.

Present the ambiguity explicitly: "Date column `transaction_date` contains values in a format that could be MM/DD/YYYY or DD/MM/YYYY. For example, '04/07/2023' could be April 7 or July 4. Please confirm: (a) the data was generated in a US-locale system (MM/DD/YYYY), (b) a UK/European-locale system (DD/MM/YYYY), or (c) mixed locale -- records from multiple sources."

If the user cannot confirm the locale, recommend scanning for values where the day field exceeds 12 -- those records can only be valid as DD/MM/YYYY (a value of 15 in the first position cannot be a month). If any values have a first segment greater than 12, the format is DD/MM/YYYY for those records. Extend that assumption to the full column and document the inference.

---

### Data Contains Embedded Totals or Subtotals

Spreadsheet exports from accounting systems, ERPs, and pivot table exports frequently contain subtotal rows and grand total rows embedded in the data. These rows look like data records but contain aggregate values -- including them in analysis causes double-counting.

Identifying characteristics: the totaling row will have a value in the summary column (e.g., `total_revenue`) that is much larger than typical row values; the product/customer/category identifier columns will be blank or contain labels like "Total," "Grand Total," "Subtotal -- Region A"; the ID column will be null or non-standard.

Remove all rows where the primary identifier column is null or contains known total-label strings. Count removed rows and confirm they were totals: sum the removed `total` values and compare to the sum of the remaining rows' totals -- they should be approximately equal if the removed rows were pure double-counts.

---

### Cleaning a Dataset That Will Be Joined to Another Table

When the cleaned dataset will be joined to a reference table (product master, customer master, account list), validate join key integrity as part of the cleaning protocol -- not after.

After cleaning the join key column (trimming whitespace, standardizing case, correcting type), compute the orphan rate: the percentage of values in the cleaned dataset's join key that do not appear in the reference table's join key. An orphan rate above 2% is a flag requiring investigation.

Common causes of orphan records: the reference table is outdated and does not include recently added products or customers; the join key format differs between systems (leading zeros, prefix differences: "PROD-100" vs "100"); records were deleted from the reference table but remain in the transaction file.

Document the orphan count and ask the user: should orphan records be excluded from analysis, kept with a null reference (outer join), or is the reference table itself out of date and needs to be updated first?

---

### Very Large Datasets Where Full Manual Review Is Not Feasible

When a dataset has more than 100,000 rows, the cleaning protocol must be designed to scale. Manual cell-by-cell review is impossible; rule-based operations must be specified precisely enough to be applied programmatically.

Adjust the protocol in three ways: (1) all issue detection steps must produce quantitative counts, not visual inspections -- every issue must be flagged by a rule that can be applied row by row; (2) sampling is acceptable for verification but not for cleaning -- verify post-cleaning results by drawing a random 1% sample and spot-checking that sample for residual issues; (3) the cleaning log must be machine-readable and include record identifiers (the primary key values of affected rows) for any removal or imputation operation, so that the change set can be audited independently.

For outlier detection specifically, at large scale the IQR method with 1.5x multiplier will flag too many records (by design -- it flags the bottom and top quartile extremes). Switch to the 3-sigma method for large, approximately normal columns, or use domain-specific hard bounds rather than statistical thresholds, to keep the flagged set to a reviewable size.

---

## Example

**Input:** "I have a customer orders dataset with about 12,000 rows exported from our CRM. Columns are: order_id, customer_id, customer_name, email, region, order_date, product_code, quantity, unit_price, discount_pct, total_revenue, order_status. I need to analyze monthly revenue by region and product for a board report next week. I know there are some duplicate orders from when we migrated CRM systems in Q2, and some rows have 0 as the total_revenue even though there's a quantity and price. I'm not sure what else is wrong. Cleaning must be non-destructive -- this is the only copy."

---

**Output:**

## Data Cleaning Protocol

**Dataset:** Customer Orders -- CRM Export
**Total Records (before cleaning):** ~12,000
**Total Columns:** 12
**Data Source:** CRM export (post-migration, includes records from legacy and new CRM systems)
**Analysis Goal:** Monthly revenue by region and product for board report
**Critical Columns:** order_id, order_date, region, product_code, quantity, unit_price, total_revenue
**Contextual Columns:** customer_id, customer_name, email, discount_pct, order_status
**Cleaning Mode:** Non-destructive -- new `_cleaned` columns added; originals preserved
**Acceptable Data Loss Threshold:** Removal of up to 5% of rows is acceptable; above 5% requires user review before proceeding

---

### Issue Inventory

| # | Issue Type | Column(s) | Description | Severity | Est. Records Affected | Est. % | Confirmed or Suspected |
|---|------------|-----------|-------------|----------|-----------------------|--------|------------------------|
| 1 | Key duplicate | order_id | Duplicate order_id values from Q2 CRM migration -- same order_id may appear in both legacy and new system exports | CRITICAL | Unknown (est. 200--600) | 2--5% | Confirmed |
| 2 | Impossible zero | total_revenue | Rows where total_revenue = 0 but quantity > 0 and unit_price > 0 -- implicit null or data entry error | CRITICAL | Unknown (est. 100--400) | 1--3% | Confirmed |
| 3 | Implicit null (total_revenue) | total_revenue | True zero-revenue orders (fully discounted) need to be distinguished from erroneous zeros -- discount_pct = 100% is a true zero, anything else is an error | HIGH | Subset of Issue 2 | -- | Suspected |
| 4 | Type mismatch | order_date | CRM exports from legacy systems often store dates as text strings; migration may have produced mixed date and text formats in one column | HIGH | Unknown | Unknown | Suspected |
| 5 | Format inconsistency | region | CRM migration frequently causes case and label inconsistencies -- "Northeast" vs "NE" vs "north east" appearing as separate regions in board report | HIGH | Unknown | Unknown | Suspected |
| 6 | Implicit null | discount_pct | Blank discount_pct likely means no discount applied (0%), not missing data -- needs to be confirmed and converted | MEDIUM | Unknown | Unknown | Suspected |
| 7 | Type mismatch | discount_pct | If stored as "15%" (text with percent symbol) rather than 0.15 (decimal numeric), the column cannot be used in revenue calculations | MEDIUM | Unknown | Unknown | Suspected |
| 8 | Whitespace contamination | region, product_code, email | Leading/trailing spaces in join and group-by columns create invisible category splits | MEDIUM | Unknown | Unknown | Suspected |
| 9 | Derived column inconsistency | total_revenue | After cleaning quantity, unit_price, and discount_pct, total_revenue must be recomputed for affected rows | MEDIUM | All rows modified upstream | -- | Will occur |
| 10 | Conflicting duplicates | order_id + all other columns | Migration may have produced same order_id with different values (different total, different status) -- these cannot be auto-resolved | CRITICAL | Subset of Issue 1 | -- | Suspected |

**Issue Summary:** 3 CRITICAL, 3 HIGH, 4 MEDIUM, 0 LOW

---

### Missing Value Strategy

| Column | Explicit Null Count | Implicit Null Patterns | Total Missing Est. | % Missing Est. | Missingness Type | Strategy | Imputation Value or Rule | Rationale |
|--------|---------------------|------------------------|-------------------|----------------|------------------|----------|--------------------------|-----------|
| total_revenue | Unknown | 0 where quantity > 0 and unit_price > 0 and discount_pct < 100 | Unknown | Unknown | MAR (linked to system migration) | Recalculate: `quantity * unit_price * (1 - discount_pct)` | Computed value | Derivable from component fields; do not impute statistically |
| discount_pct | Unknown | Blank = likely 0% discount | Unknown | Unknown | MCAR (blank on no-discount orders) | Impute 0 where blank, AFTER confirming with user | 0.0 | Most orders have no discount; blank likely means absent, not missing |
| order_date | Unknown | Text strings, unparsed dates | Unknown | Unknown | Investigate | Convert to date type; flag unconvertible values | N/A -- type fix | Date must be numeric for time-series aggregation by month |
| email | Unknown | None expected | Unknown | Unknown | MCAR | Leave as missing -- email is contextual, not critical | N/A | Not used in revenue by region/product analysis |
| product_code | Unknown | Blank | Unknown | Unknown | Investigate | Flag -- CRITICAL column; do not impute | N/A | Cannot assign revenue to a product if product_code is missing |
| region | Unknown | Blank | Unknown | Unknown | Investigate | Flag -- CRITICAL column; attempt lookup from customer_id reference if available | N/A | Cannot assign revenue to a region if region is missing |

---

### Cleaning Operations (Execute in This Order)

---

#### Operation 1: Whitespace Trim on Join and Group-By Columns

**Issue:** Leading, trailing, or double internal spaces in region, product_code, email, and customer_id columns causing invisible category splits and failed joins
**Severity:** MEDIUM (but must execute first because it affects all subsequent operations)
**Affected Columns:** region, product_code, customer_id, customer_name, email, order_status
**Estimated Records Affected:** Unknown -- apply to all rows; affects only rows where contamination exists

**Operation Steps:**
1. For each target column, create a new column named `{column}_cleaned`
2. Apply TRIM to remove all leading and trailing whitespace from the value
3. Additionally check for non-breaking space characters (ASCII 160 / Unicode U+00A0) which TRIM does not remove -- replace these with standard spaces before trimming
4. After trimming, compare `{column}_cleaned` to the original `{column}` and flag rows where the value changed in a column `cleaning_flag_whitespace` = 1

**Decision Rule:** Apply to 100% of rows in listed columns regardless of whether whitespace is visible
**Expected Result:** `region_cleaned` and `product_code_cleaned` have no leading or trailing spaces; distinct value counts should be less than or equal to original distinct value counts (never higher)
**New Columns Created:** region_cleaned, product_code_cleaned, customer_id_cleaned, customer_name_cleaned, order_status_cleaned, cleaning_flag_whitespace

**Verification Check:** COUNT(DISTINCT region_cleaned) should be less than or equal to COUNT(DISTINCT region). If region_cleaned has MORE distinct values than region, a character encoding issue was introduced -- investigate immediately.

---

#### Operation 2: Identify and Classify Duplicate order_id Records

**Issue:** Q2 CRM migration created duplicate order_id values; some are exact row duplicates (safe to remove), others are conflicting duplicates (require user decision)
**Severity:** CRITICAL
**Affected Columns:** order_id (all columns)
**Estimated Records Affected:** 200--600 rows estimated (2--5%)

**Operation Steps:**
1. Group all rows by order_id and count rows per group: identify all order_id values with a count greater than 1
2. For each duplicated order_id group, compare all other column values across the duplicate rows
3. Classify each group as:
   - **Exact duplicate:** Every column value is identical across all rows in the group -- safe to remove all but first occurrence
   - **Conflicting duplicate:** Same order_id but at least one column value differs (total_revenue, order_status, order_date, product_code, quantity) -- DO NOT auto-remove; flag for user decision
4. Create column `duplicate_type`: values = "exact", "conflicting", or null (for non-duplicates)
5. Create column `duplicate_resolution`: values = "remove" (exact duplicates), "user_decision_required" (conflicting), or null

**Decision Rule for exact duplicates:** All columns identical -- keep first row in original sort order, mark all subsequent identical rows with `duplicate_type` = "exact" and `duplicate_resolution` = "remove"

**Decision Rule for conflicting duplicates:** DO NOT REMOVE. Present side-by-side comparison of conflicting rows to user. Ask user to select from: (a) keep record with more recent `order_date`, (b) keep record with more complete data (fewest nulls), (c) keep record from new CRM system, (d) keep record from legacy system, (e) provide field-by-field merge rule.

**Expected Result:** A subset of rows flagged for removal; a subset flagged for user decision; no rows silently deleted at this stage

**New Columns Created:** duplicate_type, duplicate_resolution
**Verification Check:** SUM of rows where duplicate_resolution = "remove" + SUM of rows where duplicate_resolution = "user_decision_required" + COUNT of rows where order_id appears exactly once = total original row count

---

#### Operation 3: Remove Exact Duplicate Rows

**Issue:** After classification in Operation 2, remove confirmed exact duplicates
**Severity:** CRITICAL
**Affected Columns:** All columns
**Estimated Records Affected:** Subset of estimated 200--600 duplicate rows

**Operation Steps:**
1. Filter to all rows where `duplicate_resolution` = "remove"
2. Log the count of these rows
3. Remove them from the working dataset (mark as excluded; preserve in a separate "removed_records" tab or audit file)
4. Verify: the remaining working dataset should contain no order_id groups with count > 1 EXCEPT for the "user_decision_required" conflicting duplicates (which remain until user resolves)

**Decision Rule:** Remove all rows flagged "remove" by Operation 2 -- these are confirmed exact duplicates with zero information loss
**Expected Result:** Working dataset row count = original count minus exact duplicate count
**New Columns Created:** None -- rows excluded from working set, not deleted

**Verification Check:** COUNT(*) of working dataset + COUNT(*) of removed_records tab = original row count of 12,000. Confirm: COUNT(DISTINCT order_id) in working dataset excluding conflicting duplicates = COUNT(*) of same rows.

---

#### Operation 4: Convert order_date to Date Type

**Issue:** order_date column may contain text strings, mixed formats, or unconvertible values from the CRM migration
**Severity:** HIGH -- monthly revenue analysis requires numeric date parsing; text dates cannot be aggregated by month
**Affected Columns:** order_date
**Estimated Records Affected:** Unknown -- apply to all rows

**Operation Steps:**
1. Attempt to parse every value in `order_date` as a date using the expected primary format: YYYY-MM-DD (ISO 8601, the most common CRM export format)
2. For values that fail ISO 8601 parsing, attempt secondary formats in this order: MM/DD/YYYY (US locale), DD/MM/YYYY (UK/EU locale), MM-DD-YYYY, "Month DD YYYY" (text month)
3. Create column `order_date_cleaned` with the successfully parsed date value (stored as a true date type)
4. Create column `order_date_parse_status`: "parsed_ISO", "parsed_US", "parsed_EU", "parsed_text", or "FAILED"
5. Rows with `order_date_parse_status` = "FAILED" cannot be included in time-series analysis -- flag them in `cleaning_flag_date_failure` = 1

**Critical decision point:** If any values successfully parse under BOTH MM/DD/YYYY and DD/MM/YYYY (e.g., "04/06/2023" -- ambiguous), STOP and present these to the user for locale confirmation before proceeding. Do not guess.

**Expected Result:** `order_date_cleaned` contains valid date values for all parseable rows; FAILED rows are flagged and counted
**New Columns Created:** order_date_cleaned, order_date_parse_status, cleaning_flag_date_failure

**Verification Check:** MIN(order_date_cleaned) should be approximately the start of the business's order history (ask user to confirm earliest plausible order date). MAX(order_date_cleaned) should not exceed today's date. Zero values in order_date_cleaned should equal the count of "FAILED" rows in order_date_parse_status.

---

#### Operation 5: Standardize region and product_code Category Labels

**Issue:** CRM migration likely introduced case and label inconsistencies in the `region` column that would cause the board report to split one region into multiple rows
**Severity:** HIGH -- directly affects the region breakdown in the board report
**Affected Columns:** region_cleaned (from Operation 1), product_code_cleaned

**Operation Steps:**
1. Generate a full distinct value list for `region_cleaned` with row counts per value
2. Present this list to the user and ask them to confirm: (a) which values are the canonical region names for the
