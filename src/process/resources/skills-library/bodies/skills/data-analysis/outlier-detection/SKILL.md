---
name: outlier-detection
description: |
  Identifies outliers in a dataset using IQR and z-score methods, interprets what each outlier represents, and produces a recommended action (remove, investigate, cap, or flag) for each outlier with rationale.
  Use when the user has data with suspected extreme values and needs a systematic approach to identify and handle them.
  Do NOT use for data cleaning beyond outlier handling (use data-cleaning-protocol), distribution analysis (use eda-framework), or hypothesis testing (use hypothesis-testing).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "statistics analysis data-science"
  category: "data-analysis"
  subcategory: "exploratory-data-analysis"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Outlier Detection

## When to Use

**Use this skill when:**
- The user asks whether extreme values in a numeric column are errors, anomalies, or legitimate extremes -- and needs a systematic, documented decision for each
- The user reports that the mean and standard deviation seem inflated or distorted, or that a regression model is behaving unexpectedly due to leverage points
- The user is preparing data for statistical modeling (regression, clustering, PCA) and needs to identify influential observations before fitting the model
- The user needs to document outlier treatment decisions for an audit trail, business report, or reproducible analysis methodology
- The user has summary statistics that don't match domain expectations -- for example, average transaction amounts that are triple what business experience suggests
- The user is investigating data quality in a freshly received dataset and suspects data entry errors, system artifact values (such as -999, 0, or 9999 used as missing-value codes), or measurement failures
- The user has already run a model and wants to identify high-leverage or high-influence observations that are distorting coefficients (Cook's distance context)
- The user has a skewed distribution (income, prices, sensor readings, count data) and wants outlier detection that does not assume normality

**Do NOT use when:**
- The user wants a full exploratory data analysis of distributions, correlations, and data types -- use `eda-framework` instead
- The user wants to address multiple data quality issues simultaneously -- missing values, encoding inconsistencies, type mismatches -- use `data-cleaning-protocol` instead
- The user wants to detect anomalies in sequential time-series data, where temporal autocorrelation makes standard IQR/z-score methods inappropriate -- use a time-series anomaly detection approach with rolling baselines or STL decomposition
- The user wants to write production code for automated anomaly detection pipelines -- that is a software development task, not an analysis task
- The user needs multivariate anomaly detection using Mahalanobis distance, Isolation Forest, or Local Outlier Factor for high-dimensional data -- those are machine learning tasks requiring model training
- The user's variable is categorical or ordinal -- outlier detection in the statistical sense applies only to continuous or discrete numeric variables
- The user wants hypothesis testing about whether a specific extreme value could have come from the same distribution as the rest -- use `hypothesis-testing`
- The user's dataset has fewer than 10 records -- statistical outlier methods are meaningless at this scale; visual and domain inspection is the only valid approach

---

## Process

### Step 1: Establish Domain Constraints and Context Before Any Calculation

Before touching numbers, collect the domain knowledge that must frame every outlier decision.

- Ask the user what the variable measures, what its units are, and what the theoretical minimum and maximum are -- age cannot exceed roughly 125 years, a percentage cannot exceed 100, a count cannot be negative
- Ask whether any sentinel values are used in the data source -- values like -1, 0, -999, 9999, or 99999 are frequently used as missing-value placeholders in legacy systems and will appear as extreme outliers if not excluded first; reclassify these as missing (null/NA) before analysis
- Ask whether the data represents a single population or a mixture of subgroups -- comparing revenue from micro-businesses and enterprise accounts in one column will produce false outliers at the subgroup boundaries; segment first when applicable
- Ask what the downstream use of the analysis is -- if the goal is to calculate a company-wide average for a press release, a genuine extreme (a flagship store's revenue) should be kept; if the goal is to build a predictive model, that same value may need to be capped or flagged
- Ask whether there are known events that would legitimately produce extreme values -- a promotional week, a system outage, a product recall, a pandemic quarter; these are real extremes, not errors
- Record the total record count, the column name, and the data type (continuous vs. count vs. proportion) before proceeding -- these details appear in the report header

---

### Step 2: Compute Descriptive Statistics and Assess Distribution Shape

Descriptive statistics reveal whether standard outlier thresholds are appropriate for this variable's distribution before applying any method.

- Compute: minimum, maximum, mean, median, standard deviation, Q1, Q3, and count of non-null values
- Compute the skewness coefficient if possible: values with |skewness| > 1 are considered highly skewed; for |skewness| > 2, the z-score method becomes unreliable and IQR is the preferred primary method
- Compute the ratio of (mean - median) / standard deviation -- if this exceeds 0.2 in absolute value, the distribution is noticeably asymmetric; if it exceeds 0.5, assume the distribution is substantially right- or left-skewed
- Identify whether the variable has natural hard boundaries -- proportions bounded at 0 and 1, counts bounded at 0, physical measurements with known minima -- and use these as domain fences that override statistical fences
- Note whether the coefficient of variation (standard deviation / mean) exceeds 1.0 -- this indicates high natural variability, which means z-score thresholds will need to be adjusted upward (using |z| > 4 instead of |z| > 3 for flag-worthy outliers)
- Compare mean vs. median: if mean > median by more than one standard deviation, right-skew is severe; if mean < median by that margin, left-skew is severe; in either case, rely on IQR over z-score

**In Excel/Sheets:**
- Skewness: `=SKEW(range)`
- Kurtosis: `=KURT(range)` -- excess kurtosis > 3 (leptokurtic) means heavy tails and more legitimate extreme values than a normal distribution would produce
- Coefficient of variation: `=STDEV(range)/AVERAGE(range)`

---

### Step 3: Apply the IQR Method (Primary Method for Any Distribution)

The IQR method is non-parametric and does not assume normality, making it suitable as the default method.

- Compute Q1 = 25th percentile and Q3 = 75th percentile
- Compute IQR = Q3 -- Q1
- Compute the standard inner fence: lower = Q1 -- 1.5 * IQR; upper = Q3 + 1.5 * IQR; flag values outside this range as "mild outliers"
- Compute the outer fence: lower = Q1 -- 3.0 * IQR; upper = Q3 + 3.0 * IQR; flag values outside this range as "extreme outliers" -- these are the cases most likely to be errors or system artifacts
- Override the statistical lower fence with the domain minimum if the statistical fence is below a physically impossible value (e.g., if the lower fence calculates to -$67,500 and revenue cannot be negative, the effective lower fence is $0)
- For heavily right-skewed data (income, asset values, response counts), consider applying IQR on the log-transformed values: compute log(x) for each value, apply IQR to the log scale, then back-transform the fences using exp(); this prevents the right tail from being over-flagged relative to the left tail
- Count: (a) values below the lower inner fence, (b) values above the upper inner fence, (c) values beyond the outer fence on either side
- If more than 10% of values fall outside the inner fence, the distribution is likely heavy-tailed or multimodal, not a dataset with occasional outliers; report this prominently

**In Excel/Sheets:**
```
Q1:           =PERCENTILE(range, 0.25)
Q3:           =PERCENTILE(range, 0.75)
IQR:          =[Q3 cell] - [Q1 cell]
Lower inner:  =[Q1 cell] - 1.5 * [IQR cell]
Upper inner:  =[Q3 cell] + 1.5 * [IQR cell]
Lower outer:  =[Q1 cell] - 3.0 * [IQR cell]
Upper outer:  =[Q3 cell] + 3.0 * [IQR cell]
IQR flag:     =IF([cell]<[lower outer],"EXTREME LOW",IF([cell]<[lower inner],"MILD LOW",IF([cell]>[upper outer],"EXTREME HIGH",IF([cell]>[upper inner],"MILD HIGH","OK"))))
```

---

### Step 4: Apply the Z-Score Method (Complementary Check for Approximately Normal Data)

The z-score method complements IQR but must be interpreted with awareness of its normality assumption.

- Compute the mean and standard deviation for the column (using all non-null, non-sentinel values)
- For each value, compute z = (value -- mean) / standard deviation
- Apply the following graduated thresholds:
  - |z| > 2.0: potential outlier, worth investigating -- statistically expected to appear in about 4.6% of observations from a normal distribution
  - |z| > 2.5: probable outlier -- expected in about 1.2% of observations from a normal distribution
  - |z| > 3.0: strong outlier -- expected in only 0.27% of observations from a normal distribution (roughly 1 in 370 records)
  - |z| > 4.0: extreme outlier -- expected in roughly 1 in 15,800 records from a normal distribution; almost always worth investigating regardless of domain
- Be aware of the masking effect: a single massive outlier inflates the standard deviation, compressing all other z-scores toward zero -- this can cause the z-score method to miss additional outliers that the IQR method catches; if one value has |z| > 5, re-run z-scores after excluding it
- For small samples (n < 30), z-scores are unstable because the sample standard deviation is a poor estimate of the population standard deviation; rely on IQR as primary and treat z-scores as advisory only
- Use the modified z-score (Iglewicz-Hoaglin method) when the data is skewed: modified z = 0.6745 * (value -- median) / MAD, where MAD is the median absolute deviation; flag modified |z| > 3.5; this method is more robust than the standard z-score for non-normal data

**In Excel/Sheets:**
```
Z-score:         =(value - AVERAGE(range)) / STDEV(range)
Z-score flag:    =IF(ABS([z cell])>4,"EXTREME",IF(ABS([z cell])>3,"OUTLIER",IF(ABS([z cell])>2.5,"PROBABLE",IF(ABS([z cell])>2,"INVESTIGATE","OK"))))
MAD:             =MEDIAN(ABS(range - MEDIAN(range)))
Modified z:      =0.6745 * (value - MEDIAN(range)) / [MAD cell]
```

---

### Step 5: Cross-Reference the Two Methods and Classify Agreement Level

Comparing IQR and z-score results reveals the strength of evidence for each flagged value.

- Create a comparison matrix with three agreement levels:
  - **Strong evidence (flagged by both methods):** These cases merit the most scrutiny; both a distribution-free and a parametric method agree the value is unusual
  - **IQR-only flags:** Common in right-skewed distributions where the z-score method underestimates how far the value sits from the bulk of the data; treat these seriously if the variable is skewed
  - **Z-score-only flags:** Can occur when the IQR is wide (flat distribution) but the mean is strongly pulled by a small number of extreme values; treat these as "investigate" rather than immediate outliers
- For each value flagged by either method, record: the value itself, the distance from Q3 (or Q1) in IQR units, the z-score, and whether it exceeds the outer fence (3x IQR) threshold
- Note the percentage of the total dataset flagged: 1--3% is typical for normal distributions; 3--7% may indicate a fat-tailed distribution rather than individual data errors; > 7% almost always indicates a distributional issue (bimodality, mixed populations, or heavy tails) rather than outliers in the traditional sense

---

### Step 6: Classify Each Outlier by Root Cause

The most important step -- determining WHY a value is extreme drives every subsequent action recommendation.

**Classification categories and their indicators:**

- **Data entry error:** The value is logically impossible given the variable's meaning -- a negative age, a temperature of 9999°F, a percentage of 150%, a date in 1900 when data collection started in 2010. Action: Remove the erroneous value and, if the source record can be corrected, correct it; if not, treat as missing
- **Measurement/instrument error:** The value is theoretically possible but implausible given the measurement context -- a weight of 800 kg for a human patient, a sensor reading that is 50x the physically expected maximum for the equipment. Action: Flag for investigation; attempt to retrieve the original record; if uncorrectable, remove
- **System artifact / sentinel value:** Recognized placeholder values such as -1, 0 (when zero is not a valid observation), -999, 999, 9999, or 99999. These are missing-data codes masquerading as numbers. Action: Reclassify as missing (null) before any further analysis; do NOT include in outlier statistics
- **Legitimate natural extreme:** The value is unusual but plausible -- a top executive's compensation in a salary dataset, a record-breaking sales day, a rare but genuine medical measurement. Action: Keep in the dataset; use median-based statistics for summaries; note the value in any reporting
- **Subpopulation member:** The value is extreme relative to the main distribution but normal within its own segment -- enterprise revenue in a dataset that also contains micro-business revenue. Action: Segment the data; analyze each subpopulation separately; do not penalize legitimate values from a different subpopulation
- **Ambiguous / needs investigation:** The value is extreme, no clear cause is identifiable from the data alone, and a domain expert or data owner must review the original source record. Action: Flag for human review; do not remove or cap until classification is confirmed

---

### Step 7: Assign a Recommended Action with Rationale

Map each outlier's classification to a concrete, justified action using the decision framework below.

**Remove (delete the row or null the value):**
- Use only when the value is confirmed as a data entry error or measurement error AND no correction can be made
- Never remove solely because a value is statistically unusual -- that is circular reasoning
- Document the record identifier, original value, and reason for removal
- Removal changes the dataset's n; note this in the report

**Cap / Winsorize (replace with the fence value):**
- Replace values beyond the inner fence with the fence value itself (not the nearest non-outlier)
- Use when: the record is otherwise valid, removing the row would lose important non-outlier information in other columns, and the analysis is sensitive to extreme values (e.g., regression, PCA)
- Standard Winsorization levels: 1% (cap the top and bottom 1%), 5% (cap the top and bottom 5%), or IQR-fence-based (cap at Q3 + 1.5*IQR and Q1 -- 1.5*IQR)
- After capping, always recompute the mean and standard deviation to confirm the impact

**Flag (mark with an indicator column, retain original value):**
- Add a binary column (e.g., `revenue_outlier_flag = 1`) to mark the observation
- Use when: the value is a legitimate extreme, the analysis should run both with and without the flagged records, or downstream users need to make their own judgment
- This is the safest action when classification is uncertain -- it preserves data while creating visibility

**Transform (apply a mathematical transformation to the whole column):**
- When a large fraction of values are flagged because the variable is naturally right-skewed (income, prices, counts), a log transformation or square root transformation may compress the distribution so that the IQR/z-score methods behave appropriately
- Apply log(x + 1) rather than log(x) when zeroes are present
- After transformation, re-run outlier detection on the transformed values

**Keep with documentation:**
- Use when the value is a confirmed legitimate extreme and the analysis should accurately represent the full distribution
- Explicitly document: "Store 47's $890,000 revenue is a confirmed flagship location and is included in all calculations"
- Provide both mean and median in summary statistics so readers can see the outlier's influence

**Investigate (defer decision):**
- Use when the classification cannot be determined from data alone
- Provide the specific record identifier, the value, the z-score, and the IQR fence distance to the data owner
- Set a resolution deadline -- "flagged for review; excluded from this analysis pending confirmation"

---

### Step 8: Quantify the Impact and Finalize the Report

Measure how much the identified outliers actually affect the analysis to help the user judge whether outlier treatment matters.

- Compute and compare: mean with all values, mean excluding flagged outliers, trimmed mean (removing top and bottom 5%), and median; if these four statistics agree within 5% of each other, outliers have minimal practical impact
- Compute the effect on standard deviation: outliers almost always inflate SD dramatically; report the SD with and without outliers
- If the variable will be used as a predictor in a regression, note that high-leverage outliers -- those far from the mean of X -- have disproportionate influence on slope estimates even if their y-value is not extreme
- Report the percentage change in the mean from removing or capping the identified outliers -- a change of less than 3% is unlikely to affect business decisions; a change of more than 10% is analytically material
- Recommend the summary statistic appropriate for reporting given the findings: median when outlier impact is > 10%; trimmed mean (5% trim) when outliers are present but the sample is large; mean only when outliers have been addressed or impact is negligible

---

## Output Format

```
## Outlier Detection Report

**Dataset:** [Name or description provided by user]
**Column analyzed:** [Column name and units]
**Total records:** [N total] | **Non-null records:** [N valid] | **Excluded sentinels:** [N sentinel, list values]
**Distribution shape:** [Normal / Right-skewed / Left-skewed / Heavy-tailed / Unknown] (skewness coefficient: [value])
**Primary method:** [IQR / Log-IQR] | **Complementary method:** [Z-score / Modified Z-score]
**Analysis date:** [Date]

---

### Descriptive Statistics

| Statistic | Value |
|-----------|-------|
| Minimum | [value] |
| Q1 (25th percentile) | [value] |
| Median (Q2) | [value] |
| Q3 (75th percentile) | [value] |
| Maximum | [value] |
| Mean | [value] |
| Standard deviation | [value] |
| Skewness coefficient | [value] |
| Coefficient of variation | [value] |
| IQR | [value] |

---

### IQR Method Results

| Metric | Value | Notes |
|--------|-------|-------|
| Lower inner fence (Q1 -- 1.5×IQR) | [value] | [domain override if applicable] |
| Upper inner fence (Q3 + 1.5×IQR) | [value] | |
| Lower outer fence (Q1 -- 3.0×IQR) | [value] | [domain override if applicable] |
| Upper outer fence (Q3 + 3.0×IQR) | [value] | |
| Mild outliers below lower inner fence | [count] ([pct]%) | |
| Mild outliers above upper inner fence | [count] ([pct]%) | |
| Extreme outliers beyond outer fence | [count] ([pct]%) | |
| **Total IQR-flagged** | **[count] ([pct]%)** | |

---

### Z-Score / Modified Z-Score Method Results

| Metric | Value |
|--------|-------|
| Mean | [value] |
| Standard deviation | [value] |
| Median absolute deviation (MAD) | [value] |
| Values with \|z\| > 2.0 (investigate) | [count] ([pct]%) |
| Values with \|z\| > 2.5 (probable outlier) | [count] ([pct]%) |
| Values with \|z\| > 3.0 (outlier) | [count] ([pct]%) |
| Values with \|z\| > 4.0 (extreme outlier) | [count] ([pct]%) |
| Values with \|modified z\| > 3.5 (robust flag) | [count] ([pct]%) |

---

### Method Agreement Summary

| Agreement Level | Count | Values / Range |
|----------------|-------|----------------|
| Flagged by BOTH methods (strong evidence) | [N] | [list values] |
| Flagged by IQR only | [N] | [list values] |
| Flagged by z-score only | [N] | [list values] |
| Sentinel/impossible values (excluded before analysis) | [N] | [list values] |

---

### Outlier Detail and Action Plan

| # | Record ID | Value | IQR Fence Distance | Z-Score | Mod. Z | IQR Flag Level | Classification | Recommended Action | Rationale |
|---|-----------|-------|-------------------|---------|--------|---------------|---------------|-------------------|-----------|
| 1 | [ID] | [val] | [+/- X×IQR] | [z] | [mz] | [Mild/Extreme] | [category] | [action] | [reason] |
| 2 | [ID] | [val] | [+/- X×IQR] | [z] | [mz] | [Mild/Extreme] | [category] | [action] | [reason] |

---

### Impact Assessment

| Statistic | With Outliers | Without Flagged Outliers | Change | Practical Significance |
|-----------|--------------|-------------------------|--------|----------------------|
| Mean | [value] | [value] | [diff] ([pct]%) | [High/Medium/Low] |
| Standard deviation | [value] | [value] | [diff] ([pct]%) | [High/Medium/Low] |
| Minimum | [value] | [value] | -- | -- |
| Maximum | [value] | [value] | -- | -- |
| Median (unchanged) | [value] | [value] | -- | -- |

**Recommended summary statistic for reporting:** [Mean / Median / Trimmed mean] -- [justification]

---

### Formulas Reference (Excel / Google Sheets)

```
Q1:                 =PERCENTILE([range], 0.25)
Q3:                 =PERCENTILE([range], 0.75)
IQR:                =[Q3 cell] - [Q1 cell]
Lower inner fence:  =[Q1 cell] - 1.5 * [IQR cell]
Upper inner fence:  =[Q3 cell] + 1.5 * [IQR cell]
Lower outer fence:  =[Q1 cell] - 3.0 * [IQR cell]
Upper outer fence:  =[Q3 cell] + 3.0 * [IQR cell]
IQR flag:           =IF([cell]<[lo outer],"EXTREME LOW",IF([cell]<[li inner],"MILD LOW",IF([cell]>[uo outer],"EXTREME HIGH",IF([cell]>[ui inner],"MILD HIGH","OK"))))
Z-score:            =([cell] - AVERAGE([range])) / STDEV([range])
Z-score flag:       =IF(ABS([z])>4,"EXTREME",IF(ABS([z])>3,"OUTLIER",IF(ABS([z])>2.5,"PROBABLE",IF(ABS([z])>2,"INVESTIGATE","OK"))))
MAD:                =MEDIAN(ABS([range] - MEDIAN([range])))
Modified z-score:   =0.6745 * ([cell] - MEDIAN([range])) / [MAD cell]
Winsorized value:   =MAX([lower inner fence], MIN([cell], [upper inner fence]))
Trimmed mean (5%):  =TRIMMEAN([range], 0.1)
```

---

### Summary and Next Steps

**Outliers confirmed for removal:** [count] -- [reason]
**Outliers confirmed for capping:** [count] -- [Winsorize at: lower = [value], upper = [value]]
**Outliers flagged (keep, monitor):** [count] -- [reason]
**Outliers pending investigation:** [count] -- [responsible party and timeline]
**No action needed:** [count] -- [reason]

**After implementing recommendations:** Re-run descriptive statistics on the treated column and compare to the values above to confirm expected mean shift.
```

---

## Rules

1. **Never remove an outlier without a classified root cause.** Statistical flagging alone is not grounds for deletion. A value must be classified as an error, artifact, or measurement failure before removal is recommended. Removing a legitimate extreme because it has a high z-score is a form of data falsification.

2. **Always apply both IQR and z-score methods and compare their results.** Neither method is sufficient alone. IQR misses outliers when the distribution has extreme skew and the fence is placed very far out. Z-score misses outliers when a single massive value inflates the standard deviation (the masking effect). The comparison between methods is itself diagnostic information.

3. **Apply domain fences before statistical fences.** If a variable cannot physically be negative (revenue, age, count, probability), the effective lower fence is zero regardless of what Q1 -- 1.5*IQR calculates to. Always state domain fences explicitly.

4. **Identify sentinel values before running any calculation.** Values of -1, 0, -999, 9999, 99999, or any value the user confirms is a missing-data placeholder must be excluded from the analysis and reclassified as missing. Including them corrupts every statistical fence and summary statistic.

5. **When skewness exceeds 1.0 in absolute value, treat IQR as the primary method and z-score as advisory.** The z-score method assumes normality. With high skew, even legitimate values in the long tail will produce large z-scores, leading to false-positive outlier flags on the right side and false-negative misses on the left side.

6. **When more than 7% of records are flagged as outliers by the IQR inner fence, do not treat them as individual errors.** This pattern indicates a heavy-tailed or bimodal distribution, not a dataset with a few anomalies. Recommend distributional analysis (log transformation, segment analysis, or kernel density estimation) before proceeding with outlier removal.

7. **Always report the masking effect risk.** When a single value is many standard deviations from the mean, warn the user that the z-scores of all other values are compressed. Recommend re-running z-score analysis after removing the single extreme value to check whether additional outliers become visible that were masked.

8. **For Winsorization, always cap at the IQR fence value, not at the nearest non-outlier value.** Using the fence value is statistically consistent with the IQR method. Using the nearest non-outlier value is ad hoc and produces different results depending on data density near the fence. State the exact cap values in the report.

9. **Always quantify the practical impact before recommending action.** If removing or capping outliers changes the mean by less than 3%, the analytical impact is negligible and aggressive outlier treatment may not be worth the documentation cost or the risk of removing real data. If the impact exceeds 10%, outlier treatment is analytically material and must be resolved.

10. **Document every outlier decision with a record identifier, the original value, the classification, the action taken, and the rationale.** Generic notes like "removed outliers" are not acceptable. Reproducible analysis requires knowing exactly which records were modified, why, and how. This documentation should be part of the delivered report, not a separate note.

11. **Never apply outlier detection methods designed for univariate analysis and claim they address multivariate outliers.** A record where both income and age are individually within normal range but the combination (income = $2M, age = 18) is anomalous will not be caught by column-by-column IQR/z-score. Note this limitation explicitly when the user's analysis involves multiple correlated variables.

12. **When the dataset has fewer than 30 records, treat all statistical thresholds as suggestive, not definitive.** Quartile estimates and standard deviations are unstable at small n. For samples under 30, label every flagged value as "requires domain review" rather than assigning remove/keep recommendations based purely on statistics.

---

## Edge Cases

### Masking Effect: A Single Extreme Value Hides Others

When one value is dramatically larger than all others (e.g., a data entry of 9,000,000 when all other values are under 1,000), the standard deviation is inflated so severely that every other value compresses to a z-score near zero -- meaning genuine outliers are invisible to the z-score method. Detect this situation by comparing the maximum value to Q3 + 10 * IQR; if the maximum exceeds this, masking is likely. The remedy: run z-score analysis twice -- once on the full dataset and once excluding the single extreme value. Report both sets of results. The IQR method is unaffected by masking because it uses quartiles, not the mean and standard deviation.

### Right-Skewed Variables (Income, Revenue, Prices, Counts)

Right-skewed distributions have a long right tail that produces a disproportionate number of IQR upper-fence violations even when those values are entirely natural. For these variables, apply the IQR method to log-transformed values (using log base 10 or natural log): compute log(x) for each positive value, find Q1 and Q3 of the log values, compute IQR on the log scale, set fences on the log scale, then back-transform fences using exp(). This procedure adjusts for the asymmetric tail without discarding the variable's natural right-skew behavior. Note: this approach requires all values to be strictly positive; if zeroes are present, use log(x + 1) throughout.

### Bimodal or Multimodal Distributions

If the variable represents a mixture of two populations (e.g., a "unit price" column that contains both per-unit retail prices of $5--$50 and bulk-order prices of $0.10--$1.50), the IQR method will flag the gap between the two clusters as outliers when the gap values are actually just absent in the sample. This situation appears in the data as an unusually large IQR relative to the range, or as two visually distinct clusters in a frequency distribution. The correct approach: ask the user whether the variable applies to multiple subpopulations; if yes, segment the data and run outlier detection separately on each segment. Never apply a single-distribution outlier method to a mixed population without segmentation.

### Clustered Data with Very Low Variance (Near-Constant Variables)

When 95%+ of values are identical or nearly identical (e.g., a "days since last purchase" column where most customers bought yesterday so the column is nearly all 0 or 1), even a value of 30 will be flagged as an extreme outlier by both IQR and z-score methods. The IQR will be nearly zero, making the fences extremely tight, and the standard deviation will be very small. In this case, flag the results as "low-variance variable" and interpret all flags cautiously. The correct framing is not "these are outliers" but rather "these are the observations that deviate meaningfully from the dominant cluster." Recommend domain review of whether the non-clustered values represent a different behavior or a data issue.

### Missing Values and Partial Records

Outlier detection must run on non-null values only. If the column has missing values, the effective n for statistical calculations is lower than the total record count. Report both total N and valid N. Separately, a record with a value in the outlier column but missing values in other key columns may still be valuable for some analyses -- do not recommend removing the entire row unless the outlier value itself is the problem; use value-level nulling (setting the outlier value to missing) rather than row deletion when possible.

### Time-Bounded Data: Partial Periods

In time-series snapshots where each record represents a time period (daily sales, monthly revenue), records at the start or end of a data extract are often partial periods -- a "monthly revenue" figure for a month that is only 3 days complete will appear as a low outlier. Before applying outlier detection to period-based data, ask the user to confirm whether all periods are complete. If partial periods exist, either exclude them from the analysis or normalize them (e.g., annualize the partial-period figure by multiplying by the fraction of the period elapsed) before running outlier detection.

### Outliers in Proportion or Rate Variables (0 to 1 or 0% to 100%)

For variables bounded at both ends (conversion rate, defect rate, market share), the standard IQR method can produce fences outside the [0, 1] range, which are meaningless. Apply the arcsine square root transformation for proportions before outlier detection: transformed value = arcsin(sqrt(p)). This stabilizes the variance across the range and makes IQR/z-score methods more reliable. The domain fence overrides any calculated fence that falls outside [0, 1]. Also note that proportions near 0 or 1 are inherently asymmetric -- a conversion rate of 0.98 may not be an outlier if the data is from a highly pre-qualified audience; domain context is essential.

### Repeated or Duplicate Records Appearing as Clusters of Outliers

If a data entry error caused a record to be duplicated many times (say, the same $890,000 transaction entered 15 times instead of once), the outlier detection will flag all 15 copies at the same value. This is visually distinct from random extreme values: the outlier table will show many records with identical values. Before classifying these as multiple independent outliers, ask the user to check for exact duplicates in the flagged values. If duplicates are confirmed, the root cause is a data loading or entry error -- deduplicate first, then re-run outlier detection on the corrected dataset.

---

## Example

**Input:**
"I have a dataset of 120 customer transactions. The column is 'transaction_value' in USD. Most values seem to be between $20 and $400, but I notice the mean is $287 which seems way too high. I also know our system uses -1 to mark voided transactions that got accidentally included. I need to identify outliers before I calculate average customer spend for our quarterly report."

---

**Output:**

## Outlier Detection Report

**Dataset:** Customer Transactions -- Q3 Quarterly
**Column analyzed:** transaction_value (USD)
**Total records:** 120 | **Non-null records:** 120 | **Excluded sentinels:** 7 records with value = -1.00 (voided transaction placeholder -- reclassified as missing before analysis)
**Records used in analysis:** 113
**Distribution shape:** Right-skewed (skewness coefficient: 2.41 -- z-score method is advisory only; IQR is primary method)
**Primary method:** IQR | **Complementary method:** Z-score + Modified Z-score (Iglewicz-Hoaglin)

---

### Descriptive Statistics

| Statistic | Value |
|-----------|-------|
| Minimum | $18.50 |
| Q1 (25th percentile) | $62.00 |
| Median (Q2) | $127.00 |
| Q3 (75th percentile) | $241.00 |
| Maximum | $4,200.00 |
| Mean (all 113 records) | $287.40 |
| Standard deviation | $412.80 |
| Skewness coefficient | 2.41 |
| Coefficient of variation | 1.44 |
| IQR | $179.00 |

Note: Skewness of 2.41 and coefficient of variation of 1.44 confirm heavy right skew. The z-score method is unreliable as a primary method here. The inflated mean ($287.40 vs. median $127.00) is almost entirely explained by a small number of high-value transactions.

---

### IQR Method Results

| Metric | Value | Notes |
|--------|-------|-------|
| Lower inner fence (Q1 -- 1.5×IQR) | -$206.50 | Domain override: effective lower fence = $0.00 (transaction value cannot be negative) |
| Upper inner fence (Q3 + 1.5×IQR) | $509.50 | |
| Lower outer fence (Q1 -- 3.0×IQR) | -$475.00 | Domain override: effective lower fence = $0.00 |
| Upper outer fence (Q3 + 3.0×IQR) | $778.00 | |
| Mild outliers below lower inner fence | 0 (0%) | All low-end values are above $0 |
| Mild outliers above upper inner fence | 8 (7.1%) | Values between $509.50 and $778.00 |
| Extreme outliers beyond upper outer fence | 3 (2.7%) | Values above $778.00 |
| **Total IQR-flagged** | **11 (9.7%)** | |

Note: 9.7% flagged is above the 7% threshold that suggests a distributional issue rather than individual errors. The right-skewed nature of transaction data explains this -- this is expected for e-commerce or retail transaction data. The flagged records still warrant individual review.

---

### Z-Score / Modified Z-Score Method Results

| Metric | Value |
|--------|-------|
| Mean | $287.40 |
| Standard deviation | $412.80 |
| Median absolute deviation (MAD) | $76.50 |
| Values with \|z\| > 2.0 (investigate) | 5 (4.4%) |
| Values with \|z\| > 2.5 (probable outlier) | 4 (3.5%) |
| Values with \|z\| > 3.0 (outlier) | 3 (2.7%) |
| Values with \|z\| > 4.0 (extreme outlier) | 2 (1.8%) |
| Values with \|modified z\| > 3.5 (robust flag) | 9 (8.0%) |

Note: The modified z-score (which uses the median and MAD instead of mean and SD) flags 9 values -- much closer to the IQR result of 11 -- confirming that the standard z-score is understating the problem due to SD inflation from the extreme values. Use modified z-score results as the z-score reference for this dataset.

---

### Method Agreement Summary

| Agreement Level | Count | Values / Range |
|----------------|-------|----------------|
| Flagged by BOTH IQR and modified z-score (strong evidence) | 8 | $530, $615, $720, $780, $910, $1,450, $2,800, $4,200 |
| Flagged by IQR only | 3 | $512, $518, $525 |
| Flagged by modified z-score only | 1 | $505 |
| Sentinel values (-1.00) excluded before analysis | 7 | All equal to -1.00 |

---

### Outlier Detail and Action Plan

| # | Record ID | Value | IQR Fence Distance | Z-Score | Mod. Z | IQR Flag Level | Classification | Recommended Action | Rationale |
|---|-----------|-------|--------------------|---------|--------|---------------|---------------|-------------------|-----------|
| 1 | TXN-0047 | $4,200.00 | +21.5×IQR above Q3 | 9.47 | 26.1 | EXTREME | Ambiguous -- investigate | Investigate immediately | Value is 10× the 95th percentile; could be a data entry error (extra zero), a bulk order, or a legitimate high-value purchase; retrieve original receipt |
| 2 | TXN-0112 | $2,800.00 | +14.3×IQR above Q3 | 6.10 | 17.3 | EXTREME | Ambiguous -- investigate | Investigate | Same reasoning as TXN-0047; both should be reviewed together to determine if they share a product category or customer segment |
| 3 | TXN-0083 | $1,450.00 | +6.7×IQR above Q3 | 2.82 | 8.89 | EXTREME | Natural extreme possible | Flag and keep pending investigation | Could be a legitimate high-value purchase; z-score alone would classify as "probable" only; investigate but do not remove |
| 4 | TXN-0009 | $910.00 | +3.7×IQR above Q3 | 1.51 | 5.53 | Mild | Natural extreme | Flag -- include with note | Plausible high-value transaction; well above inner fence but modified z-score confirms it is genuinely unusual relative to bulk of data |
| 5 | TXN-0055 | $780.00 | +3.0×IQR above Q3 | 1.19 | 4.75 | Mild (at outer fence) | Natural extreme | Flag -- include with note | Sits exactly at the outer fence threshold; strong IQR evidence but z-score does not flag; include but note in report |
| 6 | TXN-0031 | $720.00 | +2.7×IQR above Q3 | 1.05 | 4.37 | Mild | Natural extreme | Flag -- include with note | High-value but consistent with premium purchase behavior; no investigation needed |
| 7 | TXN-0078 | $615.00 | +2.1×IQR above Q3 | 0.79 | 3.76 | Mild | Natural extreme | Flag -- include with note | Same classification; include in mean calculation but note in summary |
| 8 | TXN-0019 | $530.00 | +1.6×IQR above Q3 | 0.59 | 3.56 | Mild | Natural extreme | Keep | Just above inner fence; modified z-score marginally elevated; retain without restriction |
| 9 | TXN-0064 | $525.00 | +1.6×IQR above Q3 | 0.57 | 3.49 | Mild | Natural extreme | Keep | Same as TXN-0019 |
| 10 | TXN-0102 | $518.00 | +1.5×IQR above Q3 | 0.56 | 3.43 | Mild | Natural extreme | Keep | Borderline; marginally above inner fence only |
| 11 | TXN-0071 | $512.00 | +1.5×IQR above Q3 | 0.54 | 3.38 | Mild | Natural extreme | Keep | Same; no action needed |
| 12 | TXN-SENTINEL | -$1.00 | -- | -- | -- | SENTINEL | System artifact (voided transaction code) | Reclassify as missing (null) | Already excluded from analysis above; confirm with data owner that all -1 values represent voids and are not legitimate refunds of $1.00 |

---

### Masking Effect Assessment

**Warning:** TXN-0047 ($4,200) and TXN-0112 ($2,800) inflate the standard deviation from an estimated $180 (without these two records) to $412.80 (with them). This compresses z-scores for records 3--11, causing the standard z-score method to understate their extremity. The modified z-score method is used here precisely to correct for this masking. After resolving TXN-0047 and TXN-0112, re-run z-score analysis on the remaining 111 records to confirm no additional outliers have been unmasked.

---

### Impact Assessment

| Statistic | Full 113 Records | Without TXN-0047 and TXN-0112 (2 under investigation) | Without All 8 Flagged | Change (Full vs. No Flags) |
|-----------|-----------------|-------------------------------------------------------|----------------------|---------------------------|
| Mean | $287.40 | $238.70 | $157.20 | -$130.20 (-45.3%) |
| Standard deviation | $412.80 | $244.60 | $92.40 | -$320.40 (-77.6%) |
| Median | $127.00 | $126.00 | $124.50 | -$2.50 (-2.0%) |
| Minimum | $18.50 | $18.50 | $18.50 | No change |
| Maximum | $4,200.00 | $1,450.00 | $530.00 | -- |

**Interpretation:** The two extreme values under investigation ($4,200 and $2,800) alone account for a $48.70 inflation of the mean (17% of the full-dataset mean). If those two transactions are confirmed as data errors and removed, the mean drops to $238.70. If all 8 flagged records are excluded (very aggressive treatment), the mean drops to $157.20 -- a 45% reduction. The median barely moves regardless of treatment ($127 vs. $124.50), confirming it as the robust central tendency measure.

**Recommended summary statistic for the quarterly report:** Use the **median ($127.00)** or the **trimmed mean** (5% trim = `=TRIMMEAN(range, 0.1)` ≈ $148) for "average customer spend" until TXN-0047 and TXN-0112 are investigated. Reporting the mean of $287 would overstate typical customer spend by 125%. After investigation, if the two extreme values are confirmed legitimate, switch to the trimmed mean. If they are confirmed as errors, use the mean of the corrected dataset.

---

### Formulas Reference (Excel / Google Sheets)

```
Q1:                     =PERCENTILE(B2:B114, 0.25)
Q3:                     =PERCENTILE(B2:B114, 0.75)
IQR:                    =[Q3 cell] - [Q1 cell]
Lower inner fence:      =MAX(0, [Q1 cell] - 1.5 * [IQR cell])      [max with 0 for domain floor]
Upper inner fence:      =[Q3 cell] + 1.5 * [IQR cell]
Lower outer fence:      =MAX(0, [Q1 cell] - 3.0 * [IQR cell])
Upper outer fence:      =[Q3 cell] + 3.0 * [IQR cell]
IQR flag:               =IF(B2>[upper outer],"EXTREME HIGH",IF(B2>[upper inner],"MILD HIGH",IF(B2<0,"SENTINEL/INVALID","OK")))
Z-score:                =(B2 - AVERAGE(B2:B114)) / STDEV(B2:B114)
MAD:                    =MEDIAN(ABS(B2:B114 - MEDIAN(B2:B114)))     [array formula: Ctrl+Shift+Enter in Excel]
Modified z-score:       =0.6745 * (B2 - MEDIAN(B2:B114)) / [MAD cell]
Mod. z flag:            =IF(ABS([mod z cell])>3.5,"FLAGGED","OK")
Winsorized value:       =MAX([lower inner fence], MIN(B2, [upper inner fence]))
Trimmed mean (5%):      =TRIMMEAN(B2:B114, 0.1)
Exclude sentinel (-1):  =COUNTIF(B2:B114, -1)  [use to verify sentinel count]
```

---

### Summary and Next Steps

**Sentinel values reclassified as missing:** 7 records with value = -1.00. Confirm with data owner that these are all voided transactions (not legitimate $1.00 refunds). Update the source data to use NULL rather than -1 as the void indicator.

**Outliers requiring immediate investigation:** 2 records (TXN-0047: $4,200 and TXN-0112: $2,800). Retrieve original receipts or POS records. If confirmed as data entry errors, remove and document. If confirmed as legitimate bulk or premium purchases, retain and flag. **Target resolution: before the quarterly report is finalized.**

**Outliers flagged for monitoring:** 6 records (TXN-0083 through TXN-0055). These are high-value but plausible transactions. Include in the analysis with a note in the report. Investigate TXN-0083 ($1,450) as a lower priority after the top two.

**Outliers with no action required:** 4 records ($530, $525, $518, $512). These are borderline IQR flags only; modified z-score and domain context support retaining them without restriction.

**Recommended mean for quarterly report:** Use median ($127.00) or trimmed mean (~$148) until TXN-0047 and TXN-0112 
