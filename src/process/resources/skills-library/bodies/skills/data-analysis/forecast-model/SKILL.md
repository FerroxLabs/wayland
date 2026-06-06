---
name: forecast-model
description: |
  Builds a forecasting model structure by selecting the method (moving average, linear trend, seasonal decomposition) based on data characteristics, specifying formula steps, and producing a confidence interval template. Outputs a complete forecast specification with calculations.
  Use when the user asks to forecast sales, predict demand, project revenue, estimate future values from historical data, or build a trend projection.
  Do NOT use for business financial modeling with multiple assumptions (use financial-model-template in spreadsheets), metric hierarchy design (use metric-framework), or A/B test statistical analysis (use ab-test-design).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "statistics analysis spreadsheets"
  category: "data-analysis"
  subcategory: "business-intelligence"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Forecast Model

## When to Use

**Use this skill when:**
- The user wants to project future values of a time series metric -- sales, revenue, demand units, web traffic, support ticket volume, headcount, or any measurement recorded at regular intervals
- The user asks which forecasting method to choose and wants a rationale tied to their actual data characteristics (trend shape, seasonality, volatility, data length)
- The user wants a forecast with quantified uncertainty -- confidence intervals, prediction intervals, or best/worst case ranges grounded in statistical error estimates rather than gut feel
- The user is building a budget, demand plan, capacity plan, or inventory projection and needs a defensible numerical basis for the forward estimates
- The user has historical time series data and wants to understand how to decompose it into trend, seasonal, and residual components before projecting forward
- The user wants to back-test a forecasting approach -- applying it to known history to validate accuracy before trusting it for the future
- The user wants to set up a recurring forecast process -- specifying when to refresh, what accuracy threshold triggers a model rebuild, and how to document forecast misses

**Do NOT use when:**
- The user needs a multi-assumption financial model with drivers and scenarios -- use `financial-model-template` instead, which handles income statement projections with interconnected assumptions
- The user wants to define KPIs, build a metrics hierarchy, or decide what to measure -- use `metric-framework` instead
- The user wants to design or analyze an A/B test with treatment and control groups -- use `ab-test-design` instead, which handles significance testing and sample size calculations
- The user needs machine learning-based forecasting (gradient boosted trees, LSTM neural networks, Prophet with external regressors) requiring training data, feature engineering, and model deployment infrastructure -- that exceeds spreadsheet-level forecasting scope
- The user has cross-sectional data (one observation per entity with no time dimension) and wants prediction -- that is a regression or classification task, not time series forecasting
- The user wants to forecast a metric that is driven primarily by a known external variable (e.g., sales driven by advertising spend) -- use a causal model or regression approach, not a pure time series method
- The user is asking about attribution or causal inference -- what caused past changes, not what will happen next

---

## Process

### Step 1: Diagnose the Data

Before selecting a method, extract or ask for these specific characteristics. Each one narrows the method choice.

- **Series length:** Count the number of historical periods. Record as N. Key thresholds: N < 6 forces naive or 3-period moving average; N >= 12 allows linear trend; N >= 24 (two full seasonal cycles) is the minimum for seasonal decomposition; N >= 36 is ideal for Holt-Winters.
- **Granularity:** Identify the time unit (daily, weekly, monthly, quarterly, annual). This determines the seasonal period S: S = 7 for daily data with weekly seasonality, S = 12 for monthly data with annual seasonality, S = 4 for quarterly data with annual seasonality, S = 52 for weekly data with annual seasonality.
- **Trend detection:** Calculate the average first difference: sum each (period[t] - period[t-1]) and divide by N-1. If this average is greater than 10% of the mean value, call it a trending series. Also calculate R² of a simple linear regression on time -- if R² > 0.70, linear trend is dominant. If R² < 0.40 but there is still directional movement, consider a log-linear or polynomial trend.
- **Seasonality detection:** For each period position within the cycle (e.g., all Januaries, all Q1s), calculate the average ratio of that period's value to the overall mean. If the highest ratio exceeds 1.15 and the lowest falls below 0.85, treat the series as seasonal. For monthly data: compare the 12 period-specific averages -- a coefficient of variation among those 12 averages above 8% indicates meaningful seasonality.
- **Volatility assessment:** Calculate the Coefficient of Variation (CV) of the series: standard deviation divided by the mean, expressed as a percentage. CV < 10% = low volatility (smooth trend methods work well); CV 10-25% = medium volatility (exponential smoothing handles this); CV > 25% = high volatility (wider confidence intervals required, consider whether outliers are inflating CV).
- **Outlier scan:** Flag any period where the value deviates more than 2.5 standard deviations from the rolling 6-period mean. Document each flagged period: was it a promotion, a data error, a supply disruption, or a one-time event? This treatment decision directly affects model parameters.
- **Stationarity check (informal):** Split the series into first half and second half. Compare the mean and variance of each half. If the mean of the second half differs from the first by more than 20%, the series is non-stationary -- trend methods are appropriate. If variance approximately doubles between halves, consider multiplicative rather than additive decomposition.

### Step 2: Select the Forecasting Method

Use this decision framework to select the method. Apply the criteria in order -- the first match wins.

**Method Selection Decision Tree:**

```
1. Is N < 6?
   → Naive Forecast or 2-3 period Simple Moving Average
   → State explicitly: insufficient data, high uncertainty

2. Is N >= 6 but < 12?
   → Exponential Smoothing (Single) if no trend detected
   → Linear Trend Regression if clear directional movement

3. Is N >= 12, trend detected (R² > 0.70), no seasonality?
   → Linear Trend Regression (OLS)

4. Is N >= 12, no trend, no seasonality (stable mean)?
   → Simple Moving Average (window = 3-6 periods)
   OR Single Exponential Smoothing (alpha 0.2-0.4)

5. Is N >= 12, trend detected, trend appears to be accelerating
   or decelerating rather than linear?
   → Log-linear trend: regress on ln(period) or use polynomial
   → Or apply Double Exponential Smoothing (Holt's method)

6. Is N >= 24 (2 full seasonal cycles), seasonality detected,
   minimal trend?
   → Seasonal Decomposition with Additive model
   (if seasonal swings are roughly constant in absolute size)
   → Seasonal Decomposition with Multiplicative model
   (if seasonal swings grow proportionally with the level)

7. Is N >= 36 (3+ full seasonal cycles), clear trend AND
   seasonality?
   → Holt-Winters Triple Exponential Smoothing
   → Additive if seasonal amplitude is stable
   → Multiplicative if seasonal amplitude grows with level

8. Is demand intermittent (>30% of periods are zero or near-zero)?
   → Croston's Method (separate frequency and size)
```

**Method Parameters Reference:**

| Method | Key Parameters | Typical Starting Values | Optimization Approach |
|--------|---------------|------------------------|----------------------|
| Simple Moving Average | Window (k) | k = 3 for noisy data; k = 6 for smooth data | Minimize RMSE across window sizes 2-8 |
| Single Exponential Smoothing | Alpha (α) | α = 0.2 (stable), α = 0.5 (responsive) | Grid search α from 0.1 to 0.9 in 0.1 steps, minimize MSE |
| Double Exponential Smoothing (Holt) | Alpha (α), Beta (β) | α = 0.3, β = 0.1 | Grid search; β < α almost always; small β smooths trend |
| Linear Trend (OLS) | Slope (b), Intercept (a) | Calculated from data | No optimization needed -- OLS is analytically optimal |
| Additive Decomposition | Seasonal period (S) | S determined by data granularity | S is fixed by domain knowledge, not optimized |
| Multiplicative Decomposition | Seasonal period (S) | Same | Same |
| Holt-Winters Additive | Alpha (α), Beta (β), Gamma (γ) | α = 0.3, β = 0.1, γ = 0.2 | Minimize SSE using Solver or scipy.optimize |
| Holt-Winters Multiplicative | Alpha (α), Beta (β), Gamma (γ) | α = 0.3, β = 0.1, γ = 0.2 | Same |
| Croston's | Alpha (α) for both components | α = 0.1-0.2 | Keep alpha low -- intermittent demand is slow-moving |

### Step 3: Build the Forecast Model -- Formulas and Calculations

Provide the exact mathematical specification for the selected method. This section must be rigorous enough that a user can implement it in Excel, Google Sheets, or Python without ambiguity.

**For Linear Trend (OLS Regression):**
- Assign sequential integers to periods: t = 1, 2, 3, ... N for history; t = N+1, N+2, ... for forecast
- Calculate: t_bar = (N+1)/2; y_bar = mean of all actual values
- Slope: b = SUM[(t - t_bar)(y_t - y_bar)] / SUM[(t - t_bar)²]
- Intercept: a = y_bar - b × t_bar
- Forecast for period T: Ŷ(T) = a + b × T
- Spreadsheet: =SLOPE(known_y, known_x) * T + INTERCEPT(known_y, known_x) or =FORECAST.LINEAR(T, known_y, known_x)

**For Simple Moving Average (window k):**
- Forecast for period T = Average of actuals from period T-k through T-1
- Spreadsheet: =AVERAGE(offset_range) -- anchor the range to always look back k periods
- Choose k by minimizing RMSE on historical data: test k = 2, 3, 4, 5, 6 and pick lowest in-sample RMSE
- Note: moving average forecasts are flat (constant) -- they do not project trend

**For Single Exponential Smoothing (alpha α):**
- Initialize: S[1] = y[1] (or average of first 3 periods for stability)
- Recursive: S[t] = α × y[t] + (1-α) × S[t-1]
- Forecast for next period: Ŷ[t+1] = S[t]
- Multi-step forecast: all future periods equal S[N] (flat forecast -- no trend)
- Spreadsheet: build column of S values using the recursive formula; use Solver to optimize α

**For Holt's Double Exponential Smoothing (α, β):**
- Level: L[t] = α × y[t] + (1-α) × (L[t-1] + T[t-1])
- Trend: T[t] = β × (L[t] - L[t-1]) + (1-β) × T[t-1]
- Initialize: L[1] = y[1]; T[1] = y[2] - y[1] (or average of first differences)
- h-step forecast: Ŷ[t+h] = L[t] + h × T[t]
- Dampened trend variant: Replace h × T[t] with SUM[i=1 to h] of φ^i × T[t] where φ (damping factor) = 0.80-0.98. Use dampened trend when the linear extrapolation seems optimistic.

**For Seasonal Decomposition (Additive, period S):**
- Step 1: Calculate centered moving average (CMA) of length S to extract the trend-cycle
  -- For even S (e.g., S=12): CMA[t] = (0.5×y[t-S/2] + y[t-S/2+1] + ... + y[t+S/2-1] + 0.5×y[t+S/2]) / S
  -- For odd S (e.g., S=7): CMA[t] = average of S consecutive values centered on t
- Step 2: Additive seasonal-irregular: SI[t] = y[t] - CMA[t]
- Step 3: Seasonal indices: for each position i within the cycle (i = 1 to S), calculate S_i = average of all SI[t] where t falls in position i. Normalize so seasonal indices sum to zero (additive) or average to 1.0 (multiplicative).
- Step 4: Deseasonalize the series: d[t] = y[t] - S_i[t] (additive) or d[t] = y[t] / S_i[t] (multiplicative)
- Step 5: Fit trend to deseasonalized series using OLS (or Holt if trend is non-linear)
- Step 6: Re-seasonalize the forecast: Ŷ[T] = Trend(T) + S_i[T mod S] (additive) or Ŷ[T] = Trend(T) × S_i[T mod S] (multiplicative)

**For Holt-Winters Triple Exponential Smoothing (Additive variant):**
- Level: L[t] = α × (y[t] - I[t-S]) + (1-α) × (L[t-1] + T[t-1])
- Trend: T[t] = β × (L[t] - L[t-1]) + (1-β) × T[t-1]
- Seasonal index: I[t] = γ × (y[t] - L[t]) + (1-γ) × I[t-S]
- h-step forecast: Ŷ[t+h] = L[t] + h × T[t] + I[t+h-S(floor((h-1)/S)+1)]
- Initialize I using classical decomposition on the first S periods
- Use Excel Solver or Python scipy.optimize to minimize SSE over α, β, γ all in [0, 1]

**For Croston's Method (intermittent demand):**
- Track two separate series: demand size (z) when demand > 0, and inter-arrival time (p) between demand events
- Smooth each independently using exponential smoothing with the same alpha
- Forecast rate: Ŷ = z / p (expected demand per period)
- Note: Croston's produces a constant rate forecast -- it does not incorporate trend or seasonality in the demand size

### Step 4: Calculate Confidence and Prediction Intervals

Every forecast requires quantified uncertainty. Use prediction intervals (which cover future observations, not just the conditional mean) rather than confidence intervals alone.

**Prediction interval standard formula:**
- PI = Ŷ(T) ± Z × σ_h
- Where σ_h is the h-step-ahead forecast standard deviation

**How σ_h grows with forecast horizon h:**
- For regression: σ_h = s × SQRT(1 + 1/N + (T - t_bar)² / Sxx)
  where s = RMSE of regression residuals, Sxx = SUM[(t - t_bar)²]
- For exponential smoothing (single): σ_h = σ_e × SQRT(h) where σ_e = RMSE of one-step-ahead errors
- For Holt's method: σ_h = σ_e × SQRT(1 + (h-1) × (α² + α × β × h + β² × h(h-1)(2h-1)/6))
- If the exact formula is complex, use the approximation: σ_h ≈ σ_1 × SQRT(h) where σ_1 is the one-step RMSE. This is slightly conservative but straightforward to implement.

**Critical Z-scores for prediction intervals:**
- 68% PI: Z = 1.00 (useful for "normal variation" communications)
- 80% PI: Z = 1.28 (used in supply chain safety stock calculations)
- 90% PI: Z = 1.645 (common in demand planning)
- 95% PI: Z = 1.96 (standard for business forecasts)
- 99% PI: Z = 2.576 (used when errors are very costly)

**When errors are NOT normally distributed:**
- If the series is strictly positive and right-skewed, compute intervals in log space: log-transform the data, build the model, compute intervals in log space, then exponentiate all values back. This prevents negative lower bounds and corrects for right skew.
- If the error distribution has heavy tails (kurtosis > 5), use bootstrap prediction intervals: resample the residuals 1,000 times, re-generate forecasts each time, and use the 2.5th and 97.5th percentiles of the resulting distribution as the 95% bounds.

**Fan chart specification (for multi-step forecasts):**
- Report multiple bands simultaneously: 50% PI (inner), 80% PI (middle), 95% PI (outer)
- This communicates that uncertainty is not binary -- it grows continuously
- In spreadsheet terms: calculate three sets of upper/lower bounds using Z = 0.674, 1.28, 1.96

### Step 5: Back-Test the Model Before Presenting Results

A forecast without a back-test is untestable. Always validate before reporting.

- **Hold-out validation:** Reserve the last 20-25% of the series as a test set. Fit the model on the remaining 75-80%. Generate forecasts for the test period. Compare to actuals.
- **Rolling origin validation (preferred for short series):** Start with the first 60-70% of periods as training. Fit the model. Forecast one period ahead. Record the error. Add one more actual period to training. Re-fit. Repeat until the end of the series. Average errors across all origins.
- **Accuracy metrics to calculate and report:**
  - MAPE = (1/n) × SUM[|actual - forecast| / |actual|] × 100. Interpretable but undefined when actuals = 0 and biased when actuals are small.
  - RMSE = SQRT(SUM[(actual - forecast)²] / n). Penalizes large errors more heavily than small ones. Comparable to standard deviation of errors.
  - MAE = (1/n) × SUM[|actual - forecast|]. More robust to outliers than RMSE. Use in median-dominated distributions.
  - Bias = (1/n) × SUM[forecast - actual]. Non-zero bias means systematic over- or under-forecasting. A model can have low MAPE but high bias (alternating errors cancel out).
  - Theil's U statistic: compares forecast error to naive forecast error. U < 1 means your model beats naive. U > 1 means the naive forecast is better.
- **Benchmark comparison:** Always compare to the naive forecast (next period = last period) and simple moving average. If your chosen model does not beat the 3-period moving average on RMSE, question whether the added complexity is justified.

**Accuracy benchmarks by industry context:**
- Short-horizon monthly revenue forecast for stable businesses: MAPE < 5% is excellent, 5-10% is good, 10-15% is acceptable, > 15% signals model mismatch or structural volatility
- SKU-level demand forecasting in retail: MAPE < 15% is excellent, 15-30% is acceptable, > 30% is common for low-volume items (consider switching to probability distributions rather than point forecasts)
- Weekly web traffic forecasting: MAPE < 8% is good for trending traffic
- Recalibration trigger: if rolling MAPE on new actuals exceeds 1.5× the historical back-test MAPE for three consecutive periods, rebuild the model

### Step 6: Produce the Complete Forecast Output

Structure the output in the format specified below. Every element serves a purpose.

- Present the full forecast table including both historical fit values and forward projections, so the user can visually assess how well the model tracks history
- Include a visualization specification with exact series definitions -- do not say "make a chart"; specify the chart type, axis scales, series colors, and whether the confidence band should be filled or outlined
- State assumptions explicitly and number them -- the user and their stakeholders need to know what must remain true for the forecast to hold
- Provide spreadsheet formulas in copy-paste-ready form -- abstract formulas are not actionable
- Report historical MAPE from the back-test as the primary measure of model credibility

### Step 7: Define the Monitoring and Recalibration Protocol

The forecast is not a one-time deliverable -- specify exactly how it should be maintained.

- **Update cycle:** Match to the data granularity. Monthly data forecasts update monthly on the day new actuals are confirmed. Never skip an update when actuals are available.
- **Tracking signal:** Calculate cumulative forecast error divided by MAE. If tracking signal exceeds ±4, the model is systematically biased and must be recalibrated immediately. This is more sensitive than waiting for rolling MAPE to deteriorate.
- **Rolling window vs. expanding window:** For stable processes, use expanding window (all available history). For processes that change over time (non-stationary), use a rolling window of the most recent N periods (N = 24-36 for monthly data). The rolling window discards old history that may no longer be representative.
- **Model decay events:** Document any event that could break the model's assumptions: new pricing tier, channel expansion, product line change, macroeconomic shock, major competitor entry. After any such event, mark the breakpoint and evaluate whether pre-event data should be excluded from model fitting.
- **Archival:** Store each period's forecast at the time it was made (not revised) alongside the subsequent actual. This creates an honest performance history and exposes systematic bias over time.

---

## Output Format

```
## Forecast: [Metric Name] | [Time Granularity]

### Data Assessment Summary
| Characteristic | Assessment | Implication |
|---------------|------------|-------------|
| Historical periods (N) | [N] [units] | [sufficient / marginal / insufficient for method] |
| Granularity | [daily / weekly / monthly / quarterly] | Seasonal period S = [value] |
| Trend | [Upward / Downward / Flat / Accelerating / Decelerating] | [R² = X.XX from linear regression] |
| Seasonality | [Yes -- amplitude CV = X% / No] | [Additive / Multiplicative / None] |
| Volatility (CV) | [X%] | [Low <10% / Medium 10-25% / High >25%] |
| Outliers | [None / N outliers at periods: list] | [Treatment: removed / capped / retained with note] |
| Stationarity | [Stationary / Non-stationary] | [Reason: trend / variance change] |

### Method Selection
- **Selected Method:** [Method name]
- **Rationale:** [2-3 sentences linking data characteristics to method choice. Reference trend R², seasonality amplitude, N, CV.]
- **Rejected Alternatives:** [Method 1 -- why rejected. Method 2 -- why rejected.]
- **Parameters:**
  - [Parameter 1 name]: [Value] | [How it was determined: optimized / domain default / grid search result]
  - [Parameter 2 name]: [Value] | [Same]
- **Forecast Horizon:** [h periods] | [Horizon as % of historical length: X% -- warn if > 50%]
- **Prediction Interval Level:** [80% / 90% / 95%]

### Model Formulas

**[Method Name] -- Mathematical Specification:**
```
[Formula for period t in precise notation]
[Formula for h-step-ahead forecast]
[Formula for prediction interval: Ŷ ± Z × σ_h]
[σ_h formula showing how uncertainty grows with h]
```

**Spreadsheet Implementation ([Excel/Google Sheets]):**
```
[Named range or column definitions]
Forecast formula (cell B15): =[exact formula, no ambiguity]
Upper bound (cell C15): =[exact formula]
Lower bound (cell D15): =[exact formula]
[Note any helper columns needed]
```

**Parameter Optimization Result:**
- Method: [Grid search / Solver / Analytical solution]
- [Parameter]: [Optimized value] | [Alternative value tested]: [RMSE result]
- In-sample RMSE: [value in units]
- Back-test MAPE: [X.X%] (rolling origin on last [N] periods)
- Benchmark comparison: Naive forecast MAPE = [X%], 3-period MA MAPE = [X%]
  → Selected model [beats / matches / worse than] benchmark by [X%]

### Forecast Table

| Period | Date/Label | Actual | Model Fit | Residual | Residual % | Forecast | Lower [X%] | Upper [X%] | PI Width |
|--------|-----------|--------|-----------|----------|------------|----------|------------|------------|---------|
| 1 | [label] | [value] | [value] | [value] | [value]% | -- | -- | -- | -- |
| ... | ... | ... | ... | ... | ...% | -- | -- | -- | -- |
| N | [label] | [value] | [value] | [value] | [value]% | -- | -- | -- | -- |
| N+1 | **[label]** | -- | -- | -- | -- | **[value]** | [value] | [value] | [value] |
| N+2 | **[label]** | -- | -- | -- | -- | **[value]** | [value] | [value] | [value] |
| ... | ... | -- | -- | -- | -- | ... | ... | ... | ... |
| N+h | **[label]** | -- | -- | -- | -- | **[value]** | [value] | [value] | [value] |

**Historical Fit Statistics:**
- RMSE: [value in units]
- MAE: [value in units]
- MAPE: [X.X%]
- Bias: [value] ([Overforecast / Underforecast / No systematic bias])
- Theil's U: [value] ([beats / does not beat] naive forecast)

### Visualization Specification

**Chart:** Line chart with shaded prediction band

| Element | Specification |
|---------|---------------|
| Chart type | Line with area overlay |
| X-axis | [Period label], spanning [first period] to [last forecast period] |
| Y-axis | [Metric name] in [units]; scale from [0 or min-10%] to [max + 15%] |
| Reference line | Vertical dashed line at period [N] labeling "Last Actual" |
| Series 1 | Actual values: solid [color], weight 2px, markers at each point |
| Series 2 | Model fit (historical): dashed [color], weight 1px, same color family as Series 1 |
| Series 3 | Forecast (forward): dashed [color], weight 2px, distinguished from historical |
| Band -- inner | 80% PI: shaded [color] at 30% opacity |
| Band -- outer | 95% PI: shaded [color] at 15% opacity |
| Annotation | Text box at first forecast period: "Forecast begins [date]. Back-test MAPE: [X%]" |

**Fan chart alternative (for communicating uncertainty to executives):**
- Plot three forecast lines: central forecast + 50th, 20th, and 5th percentile scenarios
- This avoids "bands" that executives may interpret as a target range rather than uncertainty

### Assumptions and Limitations

| # | Assumption | Risk Level | What Would Invalidate It |
|---|-----------|------------|-------------------------|
| 1 | [State the assumption in precise terms] | [Low / Medium / High] | [Specific condition that breaks it] |
| 2 | [State the assumption] | [Level] | [Condition] |
| 3 | [State the assumption] | [Level] | [Condition] |
| 4 | [Limitation: e.g., seasonal pattern estimated from N cycles only] | [Level] | [Condition] |
| 5 | [Limitation: e.g., forecast accuracy degrades beyond X periods] | [Level] | [Condition] |

### Monitoring and Recalibration Plan

| Element | Specification |
|---------|---------------|
| Update frequency | [Monthly / Weekly] -- add new actual on [day] |
| Accuracy metric | Rolling MAPE on last [N] actuals |
| Tracking signal | Cumulative error / MAE; recalibrate if > ±4 |
| Recalibration trigger | Rolling MAPE exceeds [X%] for [N] consecutive periods |
| Model decay events | Document: [list specific events to watch for] |
| Window type | [Expanding / Rolling [N] periods] |
| Archive instruction | Log each forecast at time of creation; compare to actuals when available |
```

---

## Rules

1. **Never produce a single-point forecast without a prediction interval.** A point forecast implies false precision. Every number presented as a future value must be accompanied by a stated confidence level and numerical bounds. If the user insists on a single number for a budget cell, report the median forecast and note in writing that actual results will likely fall within the stated PI range.

2. **Always justify method selection with data evidence, not preference.** Never default to "I'll use linear regression" without stating the R² of the trend, the CV of the series, and the N count. The rationale must reference these diagnostics. Generic justifications like "this is a trending series" are insufficient -- state "R² = 0.87 on the linear trend regression, confirming strong linear trend as the dominant pattern."

3. **Prediction intervals must widen as the forecast horizon extends.** Flat confidence bands across all forecast periods are mathematically wrong for all methods except when explicitly told to use constant-variance simulation. Use the σ_h formulas specified in Step 4. A band that does not grow signals an error in implementation.

4. **Enforce minimum data requirements strictly, not as guidelines.** Do not apply Holt-Winters to 15 months of monthly data -- 15 months gives only 1.25 seasonal cycles, which is insufficient to estimate seasonal indices reliably. Do not apply multiplicative seasonal decomposition to fewer than 2 complete cycles. If the user's data is too short for the method they want, tell them explicitly and offer the most appropriate alternative.

5. **Never extrapolate beyond 50% of the historical length without a strong warning.** If history spans 12 months, a 7-month forecast is already aggressive. A 13-month forecast from 12 months of history is likely to be unreliable and must be labeled as high-uncertainty with widened prediction intervals computed under conservative assumptions. State the degradation risk explicitly.

6. **Always run a back-test and report the historical MAPE before presenting the forward forecast.** A forecast without measured historical accuracy is an untested claim. The back-test MAPE is the single most important number for communicating model credibility to stakeholders. If back-test MAPE exceeds 15% on monthly data for a relatively stable series, question whether the chosen method is appropriate before delivering the forward projection.

7. **Treat outliers explicitly and document every treatment decision.** An outlier that is left in the data will distort regression slopes, moving average windows, and exponential smoothing levels. An outlier that is removed without documentation creates a reproducibility problem. For each flagged outlier: state what the value was, what it was replaced with or whether it was left in, and why.

8. **Spreadsheet formulas must be copy-paste ready with no ambiguity.** Formulas like "=SLOPE times period number" are not acceptable. The formula must reference specific cell addresses or named ranges and use correct spreadsheet syntax. For Excel: FORECAST.LINEAR, SLOPE, INTERCEPT, and ETS functions are available. For Google Sheets: FORECAST.LINEAR is available. FORECAST.ETS handles exponential smoothing natively. Note which application the formula targets.

9. **Do not conflate confidence intervals with prediction intervals.** A confidence interval covers the mean of future observations (the conditional expected value). A prediction interval covers an individual future observation. For practical forecasting purposes, prediction intervals are always wider and are the correct concept. When a user asks for a "confidence interval around my forecast," provide a prediction interval and label it correctly.

10. **Do not claim a forecast is "accurate" or label a method as "the best."** Forecast accuracy is conditional on the data pattern remaining stable. A model with MAPE of 3% on history can fail immediately if there is a structural break. Always frame accuracy claims as "back-tested MAPE of X% on historical data, assuming data patterns continue." Never say "this model is accurate" -- say "this model fits historical data with a back-test MAPE of X%."

11. **Additive vs. multiplicative decomposition is not interchangeable.** Additive is correct when the seasonal swings are approximately constant in absolute terms regardless of the trend level (e.g., December always adds $50K above trend regardless of whether trend is $100K or $300K). Multiplicative is correct when seasonal swings are proportional to the level (e.g., December is always 40% above trend). Test this by plotting the seasonal-irregular component from an additive decomposition -- if the variance grows over time, switch to multiplicative.

12. **For series with growth dynamics, check whether log-linear trend fits better than linear trend.** Calculate regression R² for both y ~ t (linear) and ln(y) ~ t (log-linear). If the log-linear R² exceeds the linear R² by more than 0.05, prefer the log-linear model. Back-transform forecasts by exponentiating: Ŷ(T) = exp(a + b×T) × correction factor (correction = exp(s²/2) where s is the regression standard error on the log scale, correcting for Jensen's inequality).

---

## Edge Cases

**Very short data history (N < 6 periods):**
Use a naive forecast (next period = most recent period) or a 2-period simple average. Do not attempt exponential smoothing optimization with so few data points -- the optimizer will overfit and produce unreliable alpha values. Report prediction intervals as ± 2 × standard deviation of available observations, which gives a rough 95% interval under normality. Add a prominent warning: "Forecast is based on [N] periods of data. Statistical forecasting methods require a minimum of 6 periods for basic trend estimation and 24 periods for seasonal methods. This forecast has high uncertainty and should not be used for significant resource decisions without additional data collection."

**Structural break in the series (pandemic, product discontinuation, pricing overhaul, channel shift):**
Identify the breakpoint by visual inspection and contextual knowledge. Test formally by running a Chow test: fit OLS on the pre-break and post-break segments separately and compare the sum of squared errors to the combined regression SSE. If the F-statistic for the Chow test exceeds the critical value, the break is statistically confirmed. Use only post-break data for model fitting. If the post-break segment is too short for the intended method (e.g., 6 months post-break but you need 24 for seasonal decomposition), use the pre-break seasonal indices as priors and re-scale them to the post-break level. State the effective sample size (post-break N) prominently. For Holt-Winters and exponential smoothing, initialize the level and trend components at the post-break values rather than fitting from the beginning of the series.

**Multiple overlapping seasonalities (weekly day-of-week pattern within a monthly annual pattern):**
This occurs in daily data that has both weekly cycles (S = 7) and annual cycles (S = 365). Standard seasonal decomposition handles only one period. Recommended approach: apply STL decomposition (Seasonal-Trend decomposition using Loess) which can handle multiple seasonal periods by iterative fitting. If STL is not available in the user's tool: address the dominant seasonality first (use annual S = 52 for weekly data, S = 365 for daily data), remove it to get residuals, then model the secondary seasonality (S = 7 for weekly) on the residuals, and sum the two seasonal components in the forecast. Document both seasonal period assumptions and their indices separately.

**User requests "best case / worst case / base case" scenarios:**
This is a common stakeholder request that can be addressed correctly or incorrectly. The incorrect approach is to add or subtract an arbitrary percentage to create optimistic and pessimistic scenarios. The correct approach is to use the prediction interval structure: the 50th percentile forecast is the base case; the 90th percentile upper bound is a reasonable stretch/best-case; the 10th percentile lower bound is a reasonable downside/worst-case. These are statistically grounded. If the user wants scenario-based planning with explicit assumption changes (e.g., "what if market growth rate is 15% instead of 8%?"), redirect to the `financial-model-template` skill or `scenario-planning` skill, which handle driver-based scenario variation. Do not conflate prediction interval uncertainty with driver-based scenario planning -- they answer different questions.

**Intermittent or sparse demand (>30% zeros or near-zero periods):**
Standard forecasting methods produce poor results on intermittent demand because the zeros create extreme MAPE values (division by near-zero actuals) and skew smoothing parameters. Use Croston's method: separate the series into (1) the timing between non-zero demand events and (2) the size of demand when it occurs. Apply single exponential smoothing independently to each component. The forecast is: demand rate = average demand size (z) / average inter-arrival interval (p). Do not use MAPE to evaluate accuracy on intermittent demand -- use Mean Squared Error (MSE) or Scaled Mean Absolute Error (sMAPE) with caution, or switch to a different metric such as the Mean Absolute Scaled Error (MASE) which scales errors against the naive forecast.

**Negative values or data that includes decreases below zero:**
This occurs in net cashflow forecasting, inventory adjustments, or temperature data. Multiplicative seasonal decomposition breaks down for negative values -- switch to additive decomposition or apply a constant offset to shift all values positive before modeling, then subtract the offset from all forecasts and bounds at the end. For regression-based forecasts on declining series that may cross zero, flag the period at which the forecast first hits zero as a "depletion date" estimate with its own confidence interval (derived from when the lower and upper bounds cross zero respectively).

**Extremely high volatility (CV > 40%) or data described as "unpredictable":**
When CV exceeds 40%, point forecasts are of limited practical use because the prediction intervals will be extremely wide relative to the forecast value. In this case: (1) test whether the volatility is reducible -- are the spikes caused by identifiable events? If so, add a dummy variable or use an event calendar to model the spikes, then forecast the underlying baseline separately. (2) If the volatility is irreducible, shift the deliverable from a point forecast to a distributional forecast: estimate the expected value, standard deviation, and shape of the distribution (normal, lognormal, or empirical) and report the 10th, 25th, 50th, 75th, and 90th percentiles as the forecast output. This is more useful for decision-making under high uncertainty than a single number with very wide bands.

**User has growth that cannot continue linearly (S-curve dynamics):**
Some series follow logistic (S-curve) growth -- they grow rapidly early, decelerate as they approach a ceiling (market saturation, capacity limit), and level off. Fitting a linear trend to an S-curve will dramatically overforecast in the mature phase. Test for this pattern by checking if the growth rate (first difference / lagged value) is declining over time. If so, fit a logistic growth model: y(t) = L / (1 + exp(-k(t - t_0))) where L is the carrying capacity (saturation level), k is the growth rate, and t_0 is the inflection point. If L is unknown, estimate it from domain knowledge (e.g., total addressable market) and treat L as a parameter to disclose as an assumption. Do not extrapolate linear trend models into saturation territory.

---

## Example

**User Input:** "Can you forecast our monthly e-commerce unit sales for the next 6 months? Here are the last 24 months of data:

Year 1: Jan 1,200 | Feb 1,100 | Mar 1,400 | Apr 1,300 | May 1,500 | Jun 1,450 | Jul 1,600 | Aug 1,550 | Sep 1,750 | Oct 1,800 | Nov 2,400 | Dec 2,800
Year 2: Jan 1,450 | Feb 1,320 | Mar 1,620 | Apr 1,550 | May 1,720 | Jun 1,680 | Jul 1,850 | Aug 1,800 | Sep 2,050 | Oct 2,100 | Nov 2,750 | Dec 3,200"

---

## Forecast: Monthly E-Commerce Unit Sales | Monthly Granularity

### Data Assessment Summary

| Characteristic | Assessment | Implication |
|---------------|------------|-------------|
| Historical periods (N) | 24 months (2 full years) | Sufficient for seasonal decomposition (minimum = 24) |
| Granularity | Monthly | Seasonal period S = 12 |
| Trend | Upward, approximately 55 units/month | R² = 0.84 on linear regression -- strong linear trend confirmed |
| Seasonality | Yes -- November is 55% above trend-adjusted mean; December is 83% above; Q1 is 18% below | Multiplicative seasonality (amplitude grows with level -- Nov/Dec spikes are larger in Year 2 than Year 1 in absolute terms) |
| Volatility (CV) | 28% overall; CV of deseasonalized trend = 8% | High CV driven by seasonal spikes, not noise -- multiplicative model appropriate |
| Outliers | None identified. Nov/Dec spikes are seasonal, not outliers | No treatment needed |
| Stationarity | Non-stationary (upward trend confirmed) | Trend must be modeled explicitly; do not use simple moving average |

**Key diagnostic findings:**
- Year 1 November = 2,400 (trend level ~1,700) → seasonal index ≈ 1.41 (41% above trend)
- Year 2 November = 2,750 (trend level ~2,000) → seasonal index ≈ 1.38
- The multiplicative seasonal index is stable across years (~1.40 for November), confirming multiplicative decomposition is correct. An additive model would have produced indices of +700 and +750 for the same month -- they differ by 7%, indicating mild proportionality.

---

### Method Selection

- **Selected Method:** Holt-Winters Triple Exponential Smoothing -- Multiplicative Variant
- **Rationale:** The series exhibits both a clear upward linear trend (R² = 0.84 on linear regression) and consistent multiplicative seasonality (November-December peak is approximately 40-83% above trend, stable in percentage terms across both years). With exactly 24 months of data (2 full seasonal cycles), Holt-Winters multiplicative is the most appropriate choice: it simultaneously models level, trend, and proportional seasonality, and it adapts the level and trend forward without assuming the historical regression slope is fixed. Classical decomposition + OLS trend is the valid alternative but does not adapt the trend to recent behavior.
- **Rejected Alternatives:**
  - Linear trend regression: Cannot model seasonality. Produces forecast of trend-only, missing ±40-80% seasonal variation. Unacceptable for planning inventory or staffing.
  - Simple moving average: Ignores both trend and seasonality. Would forecast approximately the series mean, missing the growth trajectory entirely.
  - Additive Holt-Winters: Incorrect because seasonal amplitude grows with the level. Additive would underestimate Q4 spikes as the trend grows.
- **Parameters:**
  - Alpha (α = 0.35): Level smoothing. Optimized by minimizing sum of squared one-step-ahead errors across 24 periods. Grid search result: α = 0.30 (SSE 41,200), α = 0.35 (SSE 39,800), α = 0.40 (SSE 40,100). Selected α = 0.35.
  - Beta (β = 0.10): Trend smoothing. Low value appropriate -- trend is steady and should not react sharply to single-period fluctuations. Grid search: β = 0.05 (SSE 40,100), β = 0.10 (SSE 39,800), β = 0.15 (SSE 40,400). Selected β = 0.10.
  - Gamma (γ = 0.15): Seasonal index smoothing. Low value reflects confidence that seasonal pattern is stable year-over-year. Grid search: γ = 0.10 (SSE 40,300), γ = 0.15 (SSE 39,800), γ = 0.20 (SSE 40,600). Selected γ = 0.15.
- **Forecast Horizon:** 6 months (Jan Year 3 -- Jun Year 3) -- 25% of historical length. Acceptable range.
- **Prediction Interval Level:** 95%

---

### Model Formulas

**Holt-Winters Multiplicative -- Mathematical Specification:**
```
Initialization (using classical decomposition on first 12 months):
  L[12] = average of deseasonalized values for months 1-12
  T[12] = average of (deseasonalized[t] - deseasonalized[t-1]) for t = 2..12
  I[1..12] = seasonal indices from classical decomposition of Year 1

Recursive update for t = 13 to 24:
  L[t] = α × (y[t] / I[t-12]) + (1-α) × (L[t-1] + T[t-1])
  T[t] = β × (L[t] - L[t-1]) + (1-β) × T[t-1]
  I[t] = γ × (y[t] / L[t]) + (1-γ) × I[t-12]

h-step forecast from end of period 24:
  Ŷ[24+h] = (L[24] + h × T[24]) × I[24 + h - 12]
  (For h = 1..6: use seasonal indices I[13..18] which correspond to Jan-Jun)

Prediction interval (h-step ahead):
  σ_h ≈ σ_1 × SQRT(h) where σ_1 = one-step-ahead RMSE = 68 units
  PI_95 = Ŷ[24+h] ± 1.96 × 68 × SQRT(h)
```

**Spreadsheet Implementation (Google Sheets):**
```
Column setup: A = period (1-24), B = date label, C = actual, D = model fit, E = residual, F = residual%

Named ranges:
  alpha = 0.35 (cell I1)
  beta  = 0.10 (cell I2)
  gamma = 0.15 (cell I3)

Level column (col G): [After initialization row 12]
  G13 = alpha * (C13 / P1) + (1 - alpha) * (G12 + H12)
  [where P1..P12 are initial seasonal indices from decomposition]

Trend column (col H):
  H13 = beta * (G13 - G12) + (1 - beta) * H12

Seasonal index column (col P, rolling):
  P13 = gamma * (C13 / G13) + (1 - gamma) * P1
  (P13 updates the index for January, referencing P1 which was Jan Year 1 index)

Model fit (col D):
  D13 = (G12 + H12) * P1   [one-step ahead prediction made at end of period 12]

Forecast rows (periods 25-30):
  In A25: 25, A26: 26, ... A30: 30
  Forecast (col D, periods 25-30):
  D25 = ($G$24 + (A25 - 24) * $H$24) * P13
  D26 = ($G$24 + (A26 - 24) * $H$24) * P14
  [Continue referencing the updated seasonal indices for the corresponding month]

  Sigma_h (col Q, periods 25-30):
  Q25 = 68 * SQRT(A25 - 24)

  Upper bound (col E, periods 25-30):
  E25 = D25 + 1.96 * Q25

  Lower bound (col F, periods 25-30):
  F25 = D25 - 1.96 * Q25
```

**Parameter Optimization Result:**
- Method: Grid search over α (0.1-0.9), β (0.05-0.3), γ (0.05-0.3) in 0.05 steps
- Optimal (α=0.35, β=0.10, γ=0.15): SSE = 39,800, in-sample RMSE = 
