---
name: eda-framework
description: |
  Produces a structured exploratory data analysis report covering row counts, column inventory, missing values, distributions, and frequency counts. Translates raw data into a complete EDA summary with specific findings, not generic descriptions.
  Use when the user has a dataset and wants to understand its structure, quality, and key characteristics before deeper analysis.
  Do NOT use for hypothesis testing (use hypothesis-testing), data cleaning operations (use data-cleaning-protocol), or building predictive models (use regression-guide).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science analysis statistics"
  category: "data-analysis"
  subcategory: "exploratory-data-analysis"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# EDA Framework

## When to Use

**Use this skill when:**
- A user presents a dataset (CSV, database export, spreadsheet, JSON, Parquet, or described column-by-column) and asks for a structured profile of its contents before deeper work begins
- A user asks "what does this data look like?", "summarize my dataset", "what should I know about this data before I model it?", or "are there any data quality issues?"
- A user is starting a data science or analytics project and needs a first-pass audit to determine which columns are usable, which need repair, and which can be discarded
- A user needs to communicate data quality findings to a stakeholder or document the baseline state of a dataset before a transformation pipeline is built
- A user wants to understand the joint behavior of two or more columns -- distributions relative to a target variable, co-occurrence of missing values, or category breakdowns across a numeric outcome
- A user is comparing two snapshots of the same dataset over time to detect schema drift, distribution shift, or unexpected changes in row counts and value frequencies
- A user wants to validate that a received dataset matches an expected schema or data dictionary

**Do NOT use when:**
- The user wants to fix or impute identified problems -- those actions belong to the `data-cleaning-protocol` skill, which provides specific remediation logic for nulls, duplicates, type coercion, and outlier treatment
- The user wants to test whether two groups differ or whether a relationship is statistically significant -- redirect to `hypothesis-testing`, which handles t-tests, chi-square, Mann-Whitney, and related procedures
- The user wants to build a predictive model, select features, or evaluate model performance -- redirect to `regression-guide`, `classification-framework`, or `feature-selection` as appropriate
- The user wants to produce a chart or visualization -- this skill produces tabular summaries and findings, not visual outputs; redirect to `chart-type-selector` for visualization guidance
- The user's request is purely about writing SQL or Python code to compute statistics -- this is an analytical interpretation skill, not a code generation skill; redirect to software-development scope if code is the primary deliverable
- The user has fewer than 3 rows of data -- there is no meaningful distribution to characterize; ask for a larger sample or more complete data before proceeding
- The user wants to design a data collection instrument (survey, schema, database table) rather than analyze existing data -- that is a separate design task

---

## Process

### Step 1 -- Gather Dataset Metadata and Business Context

Before profiling any column, collect the structural facts and the analytical purpose. Without these, profiling produces numbers without interpretation.

- Ask for the dataset name, source system or origin (CRM export, web server logs, manual entry, API pull, sensor feed), and the approximate date range of the records
- Ask for the exact row count and column count. If the user cannot provide these, ask for a representative sample of 5-10 rows plus the full list of column headers
- Ask for the business question the user ultimately wants to answer. The business question governs which columns receive the most detailed treatment and how findings are framed
- Ask whether a data dictionary or schema documentation exists. If it does, incorporate the defined types and meanings; if it does not, infer types from column names, sample values, and domain knowledge
- Ask whether the dataset is a full population or a sample. If a sample, ask about the sampling method (random, stratified, convenience). Convenience samples get an explicit quality flag in the report
- Ask whether there is a target variable or outcome column of primary interest. Profile the target variable first and use it as the lens for interpreting all other columns
- If the user says they "have a CSV", ask them to paste the first 10 rows and the column headers. Even a small preview eliminates ambiguity about types, delimiters, and formats that column names alone cannot resolve

### Step 2 -- Classify Every Column by Analytical Type

Type classification is not the same as storage type (string, integer, float). Analytical type governs which statistics are meaningful.

- **Identifier:** Surrogate keys, natural keys, UUIDs, sequential integers used only as row labels. No statistical analysis applies. Verify uniqueness -- if an identifier column is not 100% unique, flag it as a critical data quality issue immediately
- **Numeric continuous:** Values on a continuous real-number scale where the distance between values is meaningful -- price, weight, temperature, duration in seconds, latitude/longitude. Use full descriptive statistics
- **Numeric discrete (count):** Non-negative integers representing counted occurrences -- number of purchases, support tickets, children, page views. Counts of zero are common and meaningful; Poisson-like distributions are expected; never treat zero as missing
- **Numeric discrete (ordinal encoding):** Integers that encode ordered categories -- a 1-5 star rating, a 0-10 satisfaction score. Mean and standard deviation are informative but should be supplemented with frequency counts because treating these as fully continuous overstates precision
- **Categorical nominal:** Labels with no inherent order -- country, product SKU, color, device type. Only frequency distributions apply; no arithmetic operations are valid
- **Categorical ordinal:** Labels with a defined order but non-uniform spacing -- education level (high school / bachelor's / master's / PhD), severity (low / medium / high / critical). Both frequency distributions and rank-based statistics apply
- **Boolean / binary flag:** Two-value columns representing yes/no, true/false, 0/1, active/inactive. Report as a proportion rather than a frequency table
- **Date/time:** Calendar dates, timestamps, or time-of-day values. Profile the range (min date to max date), gaps, and whether the temporal coverage matches the stated data period. Derive day-of-week and month distributions if the column has analytical significance
- **Text / free-form:** Open-ended narrative fields -- comments, descriptions, addresses, product names with mixed formatting. Report average token length, non-null rate, and whether structured information appears to be embedded (e.g., phone numbers in a "notes" field)
- Flag ambiguous columns explicitly -- a column called "status" with values 0, 1, 2 could be ordinal or nominal; a column called "zip_code" stores as integer but is nominal. Never silently assume

### Step 3 -- Assess Data Completeness and Missing Value Mechanisms

Missing value analysis is one of the highest-value components of EDA because it directly determines which analytical methods are valid.

- For every column, compute: total non-null count, missing count, and missing percentage. Use this formula: missing % = (missing count / total row count) × 100
- Apply severity thresholds: 0% missing is ideal; 1-5% missing is LOW severity (likely safe to impute or drop); 5-20% missing is MEDIUM severity (imputation strategy matters; bias is possible); above 20% missing is HIGH severity (column may be unusable without major intervention; flag prominently); above 50% missing is CRITICAL (column should be considered for removal unless missingness is structurally meaningful)
- Classify the missing value mechanism using this decision logic:
  - **MCAR (Missing Completely At Random):** No relationship between the probability of missingness and any observed or unobserved variable. Diagnostic: missing values are evenly distributed across all values of other columns. Consequence: complete-case analysis is unbiased but loses power
  - **MAR (Missing At Random):** Missingness is related to observed variables but not to the missing value itself. Diagnostic: rows with missing values in column A differ systematically from complete rows on column B. Consequence: multiple imputation or model-based imputation is valid
  - **MNAR (Missing Not At Random):** Missingness is related to the value that is missing. Diagnostic: cannot be verified from data alone but can be inferred from domain knowledge (e.g., high-income respondents refuse to report income). Consequence: no standard imputation method removes the bias; flag for domain expert review
- Compute a **missingness co-occurrence matrix**: identify pairs of columns where missingness is correlated (correlation of binary missing indicators > 0.3). Correlated missingness suggests a structural cause (a form that skipped a section, a system that failed to record a module) rather than independent random dropout
- Check for **implicit missingness**: zeros in a count column that should never be zero, negative values in a column that represents a physical quantity, placeholder strings like "N/A", "null", "unknown", "99999", "-1", or "." that encode missing but are stored as valid values. These are more dangerous than explicit nulls because systems treat them as real data

### Step 4 -- Profile Numeric Columns with Full Descriptive Statistics

Every numeric profile must produce a complete set of statistics, not a partial summary. Partial summaries cause analysts to miss critical distributional features.

- **Central tendency:** Compute mean (arithmetic average), median (50th percentile), and mode (most frequent value if discrete). The gap between mean and median is the fastest diagnostic for skewness: mean > median indicates right skew; mean < median indicates left skew; mean ≈ median indicates approximate symmetry. A rule of thumb: if |mean - median| / standard deviation > 0.2, treat the distribution as meaningfully skewed
- **Dispersion:** Compute standard deviation, variance, range (max - min), and coefficient of variation (CV = standard deviation / mean × 100). CV above 100% indicates extreme relative variability and warrants investigation. Range is sensitive to a single outlier, so always report IQR (Q3 - Q1) alongside it
- **Quartile structure:** Report Q1 (25th percentile), Q2 (median), Q3 (75th percentile), and IQR. The IQR contains the middle 50% of observations and is robust to outliers. Report the whisker bounds: lower fence = Q1 - 1.5 × IQR; upper fence = Q3 + 1.5 × IQR. Values outside these fences are candidate outliers by the Tukey method
- **Outlier quantification:** Count and percentage of values below the lower fence and above the upper fence. Distinguish between univariate outliers (extreme on one variable) and flag the possibility of multivariate outliers for later investigation. Do not automatically recommend removal -- outliers in revenue data may be whale customers; outliers in sensor data may be equipment failures; both are analytically important
- **Distribution shape assessment:** Without histograms, use the Pearson skewness approximation: skewness ≈ 3 × (mean - median) / standard deviation. Skewness between -0.5 and +0.5 is approximately symmetric; between ±0.5 and ±1.0 is moderately skewed; outside ±1.0 is highly skewed. For kurtosis, note whether the min-max range relative to the IQR suggests heavy tails (range > 6 × IQR suggests leptokurtic / heavy-tailed behavior)
- **Zero analysis for count variables:** For columns that represent counts (number of orders, number of logins), report the percentage of exact zeros separately from the missing value count. A high zero percentage (above 30%) may indicate a zero-inflated distribution, which requires different modeling approaches than a standard Poisson distribution
- **Boundary checks:** For columns with known valid ranges (age must be between 0 and 120; probability must be between 0 and 1; percentage must be between 0 and 100), report the count of values outside those bounds as a data quality flag, not just an outlier flag

### Step 5 -- Profile Categorical Columns with Cardinality and Dominance Analysis

Categorical profiling requires different analytical lens than numeric profiling. The central concerns are cardinality, concentration, and rare category risk.

- **Cardinality classification:** Low cardinality = 2-10 unique values (report full frequency table); medium cardinality = 11-50 unique values (report top 10 with an "Other" summary); high cardinality = 51-500 unique values (report top 10, flag for potential grouping); very high cardinality = 500+ unique values (flag as possible identifier or free-text field mislabeled as categorical)
- **Frequency distribution:** For each category, report count, percentage of total rows (including nulls in denominator), and percentage of non-null rows (excluding nulls from denominator). Both percentages matter -- 30% of non-null rows vs. 25% of total rows tells a different story when there is 15% missingness
- **Dominance check:** A single category representing more than 80% of non-null rows is a dominance flag. Dominant categories reduce the discriminating power of the column for segmentation or prediction. Report the dominant value and its percentage explicitly
- **Rare category identification:** Categories appearing in fewer than 1% of rows or fewer than 10 absolute rows (whichever is larger) are rare categories. These are candidates for grouping into an "Other" bucket for modeling purposes, but they should be reviewed for domain significance first -- a rare category may represent a high-value customer segment or an important exception
- **Consistency checks:** For columns that should have a controlled vocabulary (status codes, category codes, product types), check for near-duplicates caused by inconsistent casing ("Active" vs. "active" vs. "ACTIVE"), extra whitespace, or abbreviation variations ("US" vs. "USA" vs. "United States"). Report suspected duplicates as a data quality flag
- **Cross-tabulation with target variable:** If a target variable has been identified, report the distribution of the target variable within each category of the column being profiled. For a binary target, this is the conversion rate or event rate per category. This is the most analytically valuable part of categorical profiling and should not be skipped

### Step 6 -- Profile Date and Time Columns

Date/time columns are frequently under-profiled in EDA but carry critical structural information about the data collection process.

- **Range and coverage:** Report the minimum date, maximum date, and the total span in days, months, or years as appropriate to the resolution. Compare the stated date range from Step 1 against the actual range -- discrepancies indicate truncation or data extraction errors
- **Temporal gap analysis:** Check whether the time series is continuous or has gaps. For event-level data (one row per event), report the median time between events and flag any gaps exceeding 3x the median inter-event interval as potential data collection interruptions
- **Recency distribution:** For datasets where recency is analytically meaningful (last login, last purchase, last support ticket), compute the distribution of days-since as of a reference date (use today's date or the maximum date in the dataset as the reference). Report percentiles: what percentage of records are within the last 30 days, 90 days, 1 year
- **Day-of-week and hour-of-day distributions:** If the column represents transaction or event timestamps, the distribution across days of the week and hours of the day reveals behavioral patterns and potential data collection artifacts (business hours only, weekday-only data, etc.)
- **Future dates:** Any date value after the reference date is a critical data quality flag -- it indicates a data entry error, a timezone conversion error, or a system clock issue

### Step 7 -- Synthesize Cross-Column Findings and Generate Actionable Recommendations

The individual column profiles are inputs. The synthesis is the deliverable. A good EDA conclusion is specific, numbered, and directly tied to the stated business question.

- **Write 4-6 key findings** using the format: "[Observation] -- [specific evidence with numbers] -- [implication for the stated business question]." Avoid findings that could apply to any dataset. Each finding must be anchored to a specific column name, a specific number, and a specific interpretive consequence
- **Identify the top 2-3 data quality risks** that must be addressed before any modeling or reporting can proceed. Rank them by analytical impact: issues that affect the target variable are highest priority; issues that affect potential predictor variables are next; issues in context columns (IDs, dates) are lower priority but still important
- **Provide column-level recommendations** in three tiers:
  - **Ready to use:** Columns with fewer than 5% missing values, no type mismatches, and reasonable distributions -- can be used in analysis with no preprocessing
  - **Needs preprocessing:** Columns with moderate missingness (5-20%), skewness that may need transformation, or high cardinality that needs grouping -- flag the specific action required
  - **Requires investigation:** Columns with more than 20% missing values, constant or near-constant values, suspected identifier-as-category mislabeling, or anomalous value ranges -- do not use until investigated
- **Flag any structural risks** that affect the analysis as a whole: class imbalance in the target variable (less than 10% positive rate is severe imbalance), temporal leakage risk if future-looking features are present, sample size constraints for planned analytical methods (logistic regression needs at least 10 events per predictor variable as a rule of thumb), and selection bias if the dataset represents a non-random subset of the population of interest

---

## Output Format

```
## Exploratory Data Analysis Report

**Dataset:** [Name and version/extract date if known]
**Source:** [System, file, or process that produced the data]
**Records:** [Exact or estimated row count]
**Fields:** [Column count]
**Date range:** [If a temporal column is present: min date -- max date, total span]
**Business question:** [The analytical goal, restated from the user's input]
**Population:** [Full population or sample; if sample, note sampling method]
**Target variable:** [Column name, or "Not specified"]
**Profile date:** [Today's date]

---

### 1. Column Inventory

| # | Column Name | Analytical Type | Non-Null | Missing | Missing % | Severity | Notes |
|---|-------------|-----------------|----------|---------|-----------|----------|-------|
| 1 | [name] | [type] | [count] | [count] | [pct]% | NONE/LOW/MEDIUM/HIGH/CRITICAL | [flags, e.g., "primary key", "target variable", "possible implicit nulls"] |
| 2 | [name] | [type] | [count] | [count] | [pct]% | [severity] | [notes] |

**Column type summary:** [X] numeric continuous, [X] numeric discrete, [X] categorical nominal,
[X] categorical ordinal, [X] date/time, [X] boolean, [X] identifier, [X] free text

---

### 2. Numeric Column Profiles

| Column | Mean | Median | Std Dev | CV% | Min | Q1 | Q3 | Max | IQR | Skew Direction | Outliers (count / %) |
|--------|------|--------|---------|-----|-----|----|----|-----|-----|----------------|----------------------|
| [name] | [val] | [val] | [val] | [val]% | [val] | [val] | [val] | [val] | [val] | Right / Left / Symmetric | [N] ([pct]%) |

**Boundary violations:** [Column: N values outside [min_valid, max_valid] range]
**Zero analysis (count columns):** [Column: N zeros ([pct]% of non-null values)]

---

### 3. Categorical Column Profiles

**[Column Name]**
- Analytical type: [nominal / ordinal]
- Cardinality: [N] unique values ([low / medium / high / very high])
- Non-null count: [N] ([pct]%)
- Dominance flag: [YES -- "[value]" represents [pct]% of non-null rows / NO]

| Rank | Value | Count | % of Total | % of Non-Null |
|------|-------|-------|------------|---------------|
| 1 | [value] | [N] | [pct]% | [pct]% |
| 2 | [value] | [N] | [pct]% | [pct]% |
| 3 | [value] | [N] | [pct]% | [pct]% |
| 4 | [value] | [N] | [pct]% | [pct]% |
| 5 | [value] | [N] | [pct]% | [pct]% |
| Other | ([N] values) | [N] | [pct]% | [pct]% |

[If target variable is identified:]
**Breakdown by target ([target column name]):**
| Category | [Target = Value 1] rate | [Target = Value 2] rate | N |
|----------|------------------------|------------------------|---|
| [value] | [pct]% | [pct]% | [N] |

---

### 4. Date/Time Column Profiles

| Column | Min Date | Max Date | Span | Missing | Future Dates | Notable Pattern |
|--------|----------|----------|------|---------|--------------|-----------------|
| [name] | [date] | [date] | [N days/months/years] | [N] ([pct]%) | [N] | [e.g., "weekday-heavy", "gap in March"] |

---

### 5. Data Quality Register

| Priority | Issue Type | Affected Column(s) | Severity | Count / Rate | Recommended Action |
|----------|------------|--------------------|----------|--------------|--------------------|
| 1 | [issue] | [column] | CRITICAL/HIGH/MEDIUM/LOW | [N rows / pct%] | [specific action] |
| 2 | [issue] | [column] | [severity] | [N rows / pct%] | [specific action] |

**Missingness co-occurrence:** [List column pairs where missing-value correlation > 0.3, or "No strong co-occurrence detected"]
**Duplicate rows:** [N fully duplicate rows ([pct]% of total) / "Not assessable without data"]
**Implicit null indicators found:** [List columns and suspected sentinel values, or "None detected"]

---

### 6. Column Readiness Assessment

**Ready to use (no preprocessing required):**
- [column name]: [brief rationale]

**Needs preprocessing before use:**
- [column name]: [specific action required, e.g., "impute ~8% missing using median; log-transform recommended due to high right skew (CV = 145%)"]

**Requires investigation before any use:**
- [column name]: [specific concern and suggested investigation step]

---

### 7. Key Findings

1. **[Short title]:** [Specific observation] -- [evidence with numbers] -- [implication for business question]
2. **[Short title]:** [Specific observation] -- [evidence with numbers] -- [implication for business question]
3. **[Short title]:** [Specific observation] -- [evidence with numbers] -- [implication for business question]
4. **[Short title]:** [Specific observation] -- [evidence with numbers] -- [implication for business question]
5. **[Short title]:** [Specific observation] -- [evidence with numbers] -- [implication for business question]

---

### 8. Recommended Next Steps

| Priority | Action | Rationale | Skill to Use |
|----------|--------|-----------|--------------|
| 1 | [specific action] | [why this matters for the business question] | [skill name or "manual review"] |
| 2 | [specific action] | [why this matters for the business question] | [skill name or "manual review"] |
| 3 | [specific action] | [why this matters for the business question] | [skill name or "manual review"] |
```

---

## Rules

1. **Never report a statistic without its value.** Every metric must carry a number, even if approximated from context. Saying "there is some skewness in revenue" violates this rule. "Revenue mean ($1,240) is 2.8x the median ($440), indicating strong right skew with an estimated Pearson skewness coefficient of approximately +1.4" is correct.

2. **Analytical type is not storage type.** A column stored as INTEGER may be an identifier (no analysis valid), a count variable (zero-inflated Poisson possible), or an ordinal code (frequency distribution + rank stats). Declare the analytical type explicitly in the Column Inventory before profiling. Never skip this classification.

3. **Report missing percentage against total rows, not against non-null rows.** If 100 values are missing out of 500 total rows, missing% = 20%, not 0%. The denominator is always total rows.

4. **Apply the five-tier severity scale consistently:** NONE (0%), LOW (0.1-4.9%), MEDIUM (5-19.9%), HIGH (20-49.9%), CRITICAL (50%+). Do not soften or override these thresholds based on domain intuition. If domain knowledge suggests HIGH missingness is acceptable (e.g., a column that is only populated for a subset of record types), note that context alongside the severity flag -- but do not change the severity rating itself.

5. **Outlier counts are informational, not prescriptive.** Reporting Tukey fence violations is mandatory. Recommending removal is not. Every outlier report must note whether the outlier is plausible given the domain before any action recommendation is made.

6. **Cross-tabulate categorical columns against the target variable when a target is identified.** A frequency distribution for a categorical column without its relationship to the target variable is only half the profile. The conversion rate or mean target value per category is often the most actionable finding in the entire EDA.

7. **Identify dominance and rare categories explicitly.** Any single category above 80% is a dominance flag. Any category below 1% of total rows AND below 10 absolute rows triggers a rare-category flag. Both must appear in the Data Quality Register. Dominant columns reduce discriminating power for models. Rare categories can cause model instability or misleading evaluation metrics.

8. **Missingness mechanism classification is required, not optional.** For every column with more than 5% missing values, provide a MCAR/MAR/MNAR classification with a reasoning sentence. "Missing: 15% -- MNAR suspected because high-income respondents in this survey domain routinely suppress income data" is acceptable reasoning. "Missing: 15% -- mechanism unknown" is not acceptable.

9. **Flag implicit nulls as a separate data quality issue from explicit nulls.** Sentinel values (999, -1, "N/A", "null", "unknown", "0" in a column that should never be zero) count as missing values for analysis purposes but are not counted in the explicit null count. Report both the explicit null count and the suspected implicit null count separately. The total effective missing rate is the sum of both.

10. **The Key Findings section must be tied to the business question.** A finding about age distribution in a customer dataset being analyzed for churn prediction must explain why age distribution matters for churn, not just describe the distribution in isolation. Every finding must complete the sentence: "This matters for [business question] because..."

11. **Never use the Column Inventory notes field as a substitute for a proper Data Quality Register entry.** Brief flags in the Column Inventory ("possible implicit nulls", "high cardinality") are navigation aids. The full diagnosis, severity rating, count, and recommended action must appear in the Data Quality Register. Do not leave issues in the notes column without promoting them to the register.

12. **For datasets with more than 20 columns, group columns into logical clusters before profiling.** Profile every column in the group containing the target variable fully. For other groups, profile the 2-3 most analytically important columns in detail and list remaining columns with type classification and missing rate only. State which columns were summarized and why.

---

## Edge Cases

### User provides column names only, no data or sample rows
Produce a complete Column Inventory with analytical type classifications based on column names and domain knowledge. Mark all statistics as "[Pending -- requires data]" rather than estimating. Provide the full output template pre-populated with column names and correct analytical types. In the Key Findings section, write findings as conditional hypotheses: "If plan_type follows a typical SaaS distribution, expect heavy concentration in the free tier (50-70%), with premium representing 10-20% -- verify this before assuming class balance for modeling." Add a prominent note at the top of the report: "This profile is based on metadata only. All statistical fields are unpopulated pending data access. Analytical type classifications are inferred from column names and domain knowledge and must be verified."

### Dataset has fewer than 30 rows
Flag this prominently at the top of the report: "SMALL SAMPLE WARNING: N=[row count]. Standard descriptive statistics (mean, standard deviation, percentiles) are unreliable at this sample size. Results describe this specific sample, not a population." Replace quartile analysis with exact sorted value lists for numeric columns (all 30 values if the column is numeric). Replace percentage-based missing value thresholds with absolute counts. For categorical columns, report exact counts with no rounding. Do not apply the Tukey outlier method -- at fewer than 30 rows, the IQR-based fence calculation produces unreliable results; instead note minimum and maximum values and flag any values that appear domain-implausible. Add a recommendation that statistical hypothesis testing and predictive modeling are not advisable with the current sample size; reference specific power requirements (logistic regression: minimum ~100 rows per predictor; t-test: minimum ~30 per group).

### Dataset has more than 50 columns
Begin the profiling process by grouping columns into logical clusters before any individual profiling. Common cluster patterns: demographic / customer attributes (age, gender, geography, segment); behavioral / engagement (login frequency, session duration, feature usage); financial / transactional (spend, orders, revenue, LTV); temporal (dates, tenure, recency); operational / internal (status codes, source systems, agent IDs); free-text / notes (comments, descriptions). Add a "Cluster Map" section before the Column Inventory showing which columns belong to each cluster. Profile all columns in the cluster containing the target variable in full detail. For all other clusters, profile the 2 columns with the highest expected analytical relevance (based on domain knowledge and column names) in full, and list remaining columns in the Column Inventory with type and missing rate only. State explicitly: "Columns [list] were summarized at the inventory level due to dataset width. Full profiles are available on request for specific columns."

### All values in one or more columns are identical (constant column)
Flag as CRITICAL in the Data Quality Register with the entry: "Constant column -- zero variance -- [column name] contains only the value '[value]' across all [N] rows." Note whether the constant value is semantically meaningful: if every row has country = "USA", this may reflect a correctly scoped dataset (single-country extract) rather than a data error. If the constant value is something like status = "active" in a dataset that should contain both active and inactive records, flag as a likely extraction filter error -- the dataset may be missing a significant portion of the intended records. Constant columns provide zero discriminating power in any model or segmentation. Recommend exclusion from analysis with the explicit caveat to preserve the column in the source data in case the constant value is meaningful for joins or reconciliation.

### Mixed data types detected within a single column
This is one of the most dangerous data quality issues because systems that process the column will apply type coercion silently. Report the exact composition: "[Column name] contains [N] numeric values ([pct]%), [N] string values ([pct]%), and [N] null values ([pct]%). Numeric values range from [min] to [max]. String values include: [top 5 examples]." Classify the root cause if determinable: data entry error (numbers and words in the same field), encoding artifact (a number that was stored as "-1" as a sentinel for missing), or schema evolution (a column that changed meaning partway through the data collection period). Recommend splitting into two columns (one cleaned numeric, one flag for "was originally text") rather than forcing type coercion, which loses information. Flag as HIGH severity and do not include this column in the "Ready to Use" tier of the Column Readiness Assessment.

### Target variable is severely class-imbalanced
When the target variable is binary or multi-class and the minority class represents fewer than 10% of rows, add a dedicated imbalance warning to the Data Quality Register: "Class imbalance -- minority class '[value]' represents [pct]% of rows ([N] records). Models trained on this data without resampling or class-weight adjustment will be biased toward predicting the majority class." Report the imbalance ratio (majority class count / minority class count). If the minority class has fewer than 100 absolute records, flag that this is insufficient for reliable model training regardless of resampling strategy. Provide the imbalance ratio and note the recommended minimum minority class size for the likely modeling approach (classification: minimum 100 minority class examples for simple models; 500+ preferred for ensemble methods).

### Dataset contains personally identifiable information (PII) or sensitive attributes
When column names or values indicate PII (social security numbers, full names, email addresses, phone numbers, exact street addresses, date of birth combined with name, medical codes, financial account numbers), add a PII WARNING section immediately after the report header. List the suspected PII columns by name. Do not display sample values of PII columns in the report. For the Column Inventory, classify these columns as Identifier type and recommend either exclusion from analysis or pseudonymization before analytical use. Note that distributions and frequency tables for columns like full_name or email_address are not analytically meaningful and should be replaced with cardinality checks only (how many unique values exist, what percentage appear more than once).

### Timestamps reveal unexpected collection patterns (data collection artifacts)
When profiling a date/time column reveals that records are only present on weekdays, only during business hours (9am-5pm), or have a sudden gap of more than 7 days without explanation, flag as a potential data collection artifact rather than a real phenomenon. Compute: percentage of records on weekdays vs. weekends; percentage of records outside business hours if hourly data is available; length of the longest gap in days. If more than 95% of records fall on weekdays, add a finding: "The concentration of [N]% of records on weekdays suggests this dataset captures business-day activity only. Weekend behavior is unrepresented and should not be extrapolated from this data." This is particularly important for behavioral analytics where weekend patterns may differ substantially.

---

## Example

**Input:** "I have an e-commerce transaction dataset with 15,000 rows. Here are the columns: transaction_id, customer_id, order_date, product_category (Electronics/Apparel/Home/Beauty/Sports), quantity, unit_price, discount_pct, total_amount, payment_method (credit_card/paypal/bank_transfer/buy_now_pay_later), shipping_country, delivery_days, return_flag (0/1), customer_tenure_days. I want to understand which transactions are most likely to result in a return."

---

## Exploratory Data Analysis Report

**Dataset:** E-commerce Transaction Dataset
**Source:** User-provided (system of origin unspecified)
**Records:** 15,000
**Fields:** 13
**Date range:** Pending actual data -- order_date range to be confirmed
**Business question:** Identify characteristics of transactions most likely to result in a return
**Population:** Unknown -- confirm whether this is a full export or a sample
**Target variable:** return_flag (binary: 0 = not returned, 1 = returned)
**Profile date:** [Current date]

---

### 1. Column Inventory

| # | Column Name | Analytical Type | Non-Null | Missing | Missing % | Severity | Notes |
|---|-------------|-----------------|----------|---------|-----------|----------|-------|
| 1 | transaction_id | Identifier | 15,000 | 0 | 0% | NONE | Primary key -- verify 100% uniqueness |
| 2 | customer_id | Identifier | 15,000 | 0 | 0% | NONE | Foreign key -- one customer may have multiple transactions |
| 3 | order_date | Date/time | ~14,850 | ~150 | ~1% | LOW | Verify date range matches expected collection period |
| 4 | product_category | Categorical nominal | ~14,700 | ~300 | ~2% | LOW | 5 known values; check for non-standard entries |
| 5 | quantity | Numeric discrete (count) | ~14,925 | ~75 | ~0.5% | NONE | Check for zeros -- quantity of zero is implausible for a completed transaction |
| 6 | unit_price | Numeric continuous | ~14,850 | ~150 | ~1% | LOW | Check for $0 values and negative values; expect right skew |
| 7 | discount_pct | Numeric continuous | ~13,500 | ~1,500 | ~10% | MEDIUM | High missingness may indicate non-discounted transactions recorded as null vs. 0 -- MNAR suspected |
| 8 | total_amount | Numeric continuous | ~14,925 | ~75 | ~0.5% | NONE | Should equal quantity × unit_price × (1 - discount_pct); verify consistency |
| 9 | payment_method | Categorical nominal | ~14,850 | ~150 | ~1% | LOW | 4 known values; check for non-standard entries |
| 10 | shipping_country | Categorical nominal | ~14,700 | ~300 | ~2% | LOW | High cardinality likely; check for country code inconsistencies |
| 11 | delivery_days | Numeric discrete (count) | ~13,500 | ~1,500 | ~10% | MEDIUM | Missing may indicate undelivered orders -- MNAR suspected; check correlation with order_date recency |
| 12 | return_flag | Boolean | 15,000 | 0 | 0% | NONE | TARGET VARIABLE -- check for class imbalance; typical e-commerce return rate is 15-30% |
| 13 | customer_tenure_days | Numeric continuous | ~14,700 | ~300 | ~2% | LOW | Zero values plausible (same-day signup and purchase); check for negative values |

**Column type summary:** 4 numeric continuous, 3 numeric discrete, 3 categorical nominal, 1 boolean (target), 1 date/time, 2 identifier

---

### 2. Numeric Column Profiles

| Column | Mean | Median | Std Dev | CV% | Min | Q1 | Q3 | Max | IQR | Skew Direction | Outliers (count / %) |
|--------|------|--------|---------|-----|-----|----|----|-----|-----|----------------|----------------------|
| quantity | ~2.1 | ~2 | ~1.8 | ~86% | 1 | 1 | 3 | ~12 | 2 | Right-skewed (mean > median) | ~300 (2%) above Q3+3×IQR |
| unit_price | ~$68 | ~$45 | ~$75 | ~110% | $0.99 | $18 | $90 | ~$600 | $72 | Right-skewed (CV > 100%) | ~450 (3%) above $234 upper fence |
| discount_pct | ~12% | ~10% | ~14% | ~117% | 0% | 0% | ~20% | ~75% | ~20pp | Right-skewed | ~270 (2% of non-null) above 62% fence |
| total_amount | ~$105 | ~$68 | ~$130 | ~124% | $0.99 | $28 | $130 | ~$900 | $102 | Right-skewed (CV > 100%) | ~525 (3.5%) above $283 upper fence |
| delivery_days | ~5.8 | ~5 | ~3.5 | ~60% | 1 | 3 | 8 | ~25 | 5 | Right-skewed | ~270 (2% of non-null) above 15.5 days |
| customer_tenure_days | ~410 | ~290 | ~390 | ~95% | 0 | ~90 | ~620 | ~1,800 | ~530 | Right-skewed (median < mean, long right tail) | ~225 (1.5%) above 1,415 days |

**Boundary violations:**
- unit_price: Verify any values below $0.99 are legitimate (check for $0.00 values -- [N] suspected)
- discount_pct: 3 suspected values above 100% -- mathematically impossible; flag as data entry errors
- quantity: 0 values are implausible for a completed transaction; verify no zero-quantity records exist

**Zero analysis (count columns):**
- quantity: Suspected zero count ~0 -- verify explicitly; zeros here indicate a data recording error
- delivery_days: Zeros possible for same-day delivery; report separately if found

---

### 3. Categorical Column Profiles

**product_category**
- Analytical type: nominal
- Cardinality: 5 unique values (low cardinality)
- Non-null count: ~14,700 (~98%)
- Dominance flag: NO -- distribution appears spread across categories

| Rank | Value | Count | % of Total | % of Non-Null |
|------|-------|-------|------------|---------------|
| 1 | Electronics | ~4,050 | ~27% | ~27.6% |
| 2 | Apparel | ~3,900 | ~26% | ~26.5% |
| 3 | Home | ~3,150 | ~21% | ~21.4% |
| 4 | Beauty | ~2,100 | ~14% | ~14.3% |
| 5 | Sports | ~1,500 | ~10% | ~10.2% |
| Missing | (null) | ~300 | ~2% | -- |

**Breakdown by target (return_flag):**
| Category | Return rate (return_flag=1) | N |
|----------|-----------------------------|---|
| Apparel | ~28% (estimated -- category has highest return rates in industry benchmarks) | ~3,900 |
| Electronics | ~22% (estimated) | ~4,050 |
| Home | ~18% (estimated) | ~3,150 |
| Beauty | ~14% (estimated) | ~2,100 |
| Sports | ~12% (estimated) | ~1,500 |
NOTE: Return rates above are estimated from industry benchmarks pending actual data. Verify these rates from the actual return_flag values -- they are the most critical piece of information for the business question.

---

**payment_method**
- Analytical type: nominal
- Cardinality: 4 unique values (low cardinality)
- Non-null count: ~14,850 (~99%)
- Dominance flag: Check whether credit_card exceeds 70% -- typical for e-commerce

| Rank | Value | Count | % of Total | % of Non-Null |
|------|-------|-------|------------|---------------|
| 1 | credit_card | ~7,800 | ~52% | ~52.5% |
| 2 | paypal | ~3,600 | ~24% | ~24.2% |
| 3 | buy_now_pay_later | ~2,100 | ~14% | ~14.1% |
| 4 | bank_transfer | ~1,200 | ~8% | ~8.1% |
| Missing | (null) | ~150 | ~1% | -- |

**Breakdown by target (return_flag):**
Buy-now-pay-later (BNPL) transactions are associated with higher return rates in industry literature (~30-40% vs. ~15-20% for credit card). Flag for verification -- if BNPL transactions confirm a higher return rate in this dataset, payment method will be a strong predictor.

---

**shipping_country**
- Analytical type: nominal
- Cardinality: estimated 60-120 unique country codes (HIGH cardinality)
- Non-null count: ~14,700 (~98%)
- Dominance flag: Likely YES -- expect top 3-5 countries to represent 60-70% of orders in most e-commerce datasets

| Rank | Value | Count | % of Total | % of Non-Null |
|------|-------|-------|------------|---------------|
| 1 | [Country 1 -- pending data] | -- | -- | -- |
| 2 | [Country 2 -- pending data] | -- | -- | -- |
| 3 | [Country 3 -- pending data] | -- | -- | -- |
| 4-5 | [Pending] | -- | -- | -- |
| Other | (~55-115 values) | -- | -- | -- |

HIGH CARDINALITY FLAG: 60-120 country values will produce sparse cells in any cross-tabulation and unstable estimates for minority countries. Recommend grouping into: top 5 countries (by volume) + continent-level buckets + "Other" before using shipping_country in return prediction analysis. Check for data entry inconsistencies: "US", "USA", "United States", "U.S." may all appear.

---

### 4. Date/Time Column Profiles

| Column | Min Date | Max Date | Span | Missing | Future Dates | Notable Pattern |
|--------|----------|----------|------|---------|--------------|-----------------|
| order_date | [Pending] | [Pending] | [Pending] | ~150 (~1%) | Verify | Check for gaps > 7 days; check for seasonality (Q4 holiday spike expected in e-commerce) |

**Temporal analysis notes:**
- If order_date spans more than 12 months, add a month-level order volume trend to identify seasonality. E-commerce datasets frequently show November-December spikes of 2-4× baseline volume that can distort aggregate return rates
- Compute days between order_date and current date (or max order_date) as an implicit recency variable -- very recent orders may have pending returns that have not yet been recorded, biasing the return_flag toward 0 for recent transactions. This is a target leakage risk
- Verify that delivery_days NULLs correlate with very recent order_date values (undelivered orders) vs. being randomly distributed -- MNAR classification depends on this check

---

### 5. Data Quality Register

| Priority | Issue Type | Affected Column(s) | Severity | Count / Rate | Recommended Action |
|----------|------------|--------------------|----------|--------------|--------------------|
| 1 | Target leakage risk | return_flag, order_date | CRITICAL | Unknown -- depends on date range | Exclude transactions from the last 30 days from modeling (returns may still be processing); verify all recent-order return_flag values are final |
| 2 | Implicit null -- discount | discount_pct | HIGH | ~1,500 (~10%) -- MNAR: non-discounted orders recorded as null | Replace null with 0.0 before analysis; verify by checking whether null discount rows have full total_amount = quantity × unit_price |
| 3 | Implicit null -- delivery | delivery_days | HIGH | ~1,500 (~10%) -- MNAR: likely undelivered or pending orders | Create binary flag "delivery_recorded" before imputing; exclude undelivered orders from return analysis |
| 4 | High cardinality | shipping_country | MEDIUM | ~60-120 unique values | Group into top 5 countries + continent buckets before use as a predictor |
| 5 | Consistency check needed | total_amount | MEDIUM | Unknown | Verify total_amount = quantity × unit_price × (1 - discount_pct/100) for all rows; flag rows where the difference exceeds $0.01 |
| 6 | Class imbalance check | return_flag | MEDIUM | Unknown -- verify actual return rate | If return rate < 15%, apply class-weight adjustment or oversampling before classification modeling |
| 7 | Right skew | unit_price, total_amount | LOW | ~3-3.5% outliers above Tukey upper fence | Use log-transformed versions of unit_price and total_amount for regression-based models; keep original for tree-based models |
| 8 | Missing values | order_date, product_category, shipping_country, customer_tenure_days | LOW | ~1-2% each | Investigate jointly -- if the same rows are missing across all these columns, suspect a systematic data extraction gap |

**Missingness co-occurrence:** discount_pct and delivery_days both show ~10% missingness -- check whether these nulls occur on the same rows (indicating a specific order type or data source segment that records fewer fields).

**Duplicate rows:** Cannot assess without data access. Verify uniqueness of transaction_id. If transaction_id is not 100% unique, this indicates either duplicate records or multiple rows per transaction (e.g., one row per item).

**Implicit null indicators found:** discount_pct (null likely encodes 0% discount); delivery_days (null likely encodes "not yet delivered" -- a missing-not-at-random mechanism)

---

### 6. Column Readiness Assessment

**Ready to use (no preprocessing required):**
- transaction_id: Identifier only -- used for joins and deduplication, not analysis
- customer_id: Identifier only -- useful for customer-level aggregation
- product_category: 2% missing (LOW), 5 stable categories, low cardinality -- ready for cross-tabulation against return_flag
- payment_method: 1% missing (LOW), 4 stable categories -- ready for cross-tabulation; BNPL vs. non-BNPL binary derivation recommended
- return_flag: 0% missing, binary target -- ready for use once target leakage risk is resolved

**Needs preprocessing before use:**
- quantity: Verify and remove any zero-value records (~0.5% missing -- LOW)
- unit_price: Log-transform recommended for regression models due to right skew (CV = 110%); retain original for tree-based models
- total_amount: Verify internal consistency against quantity × unit_price × (1 - discount); log-transform for regression
- discount_pct: Replace null with 0.0 (MNAR -- non-discounted), then use as-is; 10% effective missing rate becomes 0% after imputation
- customer_tenure_days: 2% missing -- impute with median (~290 days); derive a "new customer" flag for tenure < 30 days
- shipping_country: Group into top-5 countries + continent buckets to reduce cardinality from 60-120 to ~10 levels
- order_date: Derive month, quarter, and days-since-order features; exclude trailing 30 days from modeling set

**Requires investigation before any use
