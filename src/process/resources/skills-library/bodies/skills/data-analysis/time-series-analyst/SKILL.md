---
name: time-series-analyst
description: |
  Time series analysis expertise covering decomposition methods, ARIMA and SARIMA modeling, Prophet for business forecasting, seasonality detection, trend analysis, anomaly detection, forecasting evaluation metrics, and practical applications for demand planning, capacity planning, and financial analysis.
  Use when the user asks about time series analyst, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of time series analyst or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science statistics budgeting guide step-by-step python testing analysis"
  category: "data-analysis"
  subcategory: "statistics-modeling"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Time Series Analyst

You are an expert time series analyst who helps teams decompose temporal data, build accurate forecasting models, detect anomalies, and make data-driven decisions about trends and seasonality. You work fluently with statistical methods (ARIMA, exponential smoothing) and modern tools (Prophet, neural forecasting).


## When to Use

**Use this skill when:**
- User asks about time series analyst techniques or best practices
- User needs guidance on time series analyst concepts
- User wants to implement or improve their approach to time series analyst

**Do NOT use when:**
- The request falls outside the scope of time series analyst
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Data description:** What are you measuring, at what frequency (hourly, daily, monthly)?
2. **History length:** How much historical data is available?
3. **Forecast horizon:** How far ahead do you need to predict?
4. **Seasonality:** Do you expect daily, weekly, monthly, or yearly patterns?
5. **Business context:** Demand forecasting, capacity planning, financial, or anomaly detection?
6. **External factors:** Are there known events (holidays, promotions) that affect the data?
7. **Accuracy needs:** Is directional trend sufficient, or do you need precise point estimates?

---

## Time Series Decomposition

### Components

```
A time series Y(t) can be decomposed into:

Additive: Y(t) = Trend(t) + Seasonal(t) + Residual(t)
  Use when seasonal amplitude is constant over time

Multiplicative: Y(t) = Trend(t) * Seasonal(t) * Residual(t)
  Use when seasonal amplitude grows with the trend

Components:
  Trend: Long-term direction (growth, decline, flat)
  Seasonal: Regular repeating patterns (weekly, yearly)
  Residual: Random variation after removing trend and season
```

### Python Implementation

```python
import pandas as pd
import numpy as np
from statsmodels.tsa.seasonal import seasonal_decompose
import matplotlib.pyplot as plt

# Load and prepare data
df = pd.read_csv('sales.csv', parse_dates=['date'], index_col='date')
df = df.asfreq('D')  # Set explicit daily frequency
df['sales'] = df['sales'].interpolate()  # Handle missing values

# Decomposition
result = seasonal_decompose(df['sales'], model='additive', period=7)

fig, axes = plt.subplots(4, 1, figsize=(12, 8))
result.observed.plot(ax=axes[0], title='Observed')
result.trend.plot(ax=axes[1], title='Trend')
result.seasonal.plot(ax=axes[2], title='Seasonal')
result.resid.plot(ax=axes[3], title='Residual')
plt.tight_layout()
plt.show()

# STL decomposition (more robust)
from statsmodels.tsa.seasonal import STL
stl = STL(df['sales'], period=7, robust=True)
result = stl.fit()
```

---

## ARIMA Modeling

### Model Selection Process

```
ARIMA(p, d, q):
  p = autoregressive order (how many past values influence current)
  d = differencing order (how many times to difference for stationarity)
  q = moving average order (how many past forecast errors influence current)

SARIMA(p, d, q)(P, D, Q, m):
  Same as ARIMA plus seasonal components with period m

Step-by-step:
1. Plot the data -- visual inspection of trend, seasonality
2. Test for stationarity (ADF test)
3. Difference if needed (d=1 or d=2)
4. Examine ACF/PACF plots to identify p and q
5. Fit candidate models
6. Compare using AIC/BIC (lower is better)
7. Check residuals (should be white noise)
8. Forecast
```

### Implementation

```python
from statsmodels.tsa.stattools import adfuller
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
import pmdarima as pm

# Step 1: Stationarity test
result = adfuller(df['sales'])
print(f'ADF Statistic: {result[0]:.4f}')
print(f'p-value: {result[1]:.4f}')
# p-value < 0.05 => stationary (no differencing needed)
# p-value >= 0.05 => non-stationary (need d >= 1)

# Step 2: ACF/PACF analysis
fig, axes = plt.subplots(1, 2, figsize=(12, 4))
plot_acf(df['sales'].diff().dropna(), ax=axes[0], lags=40)
plot_pacf(df['sales'].diff().dropna(), ax=axes[1], lags=40)
plt.show()

# Step 3: Auto ARIMA (automated parameter selection)
model = pm.auto_arima(
    df['sales'],
    seasonal=True,
    m=7,                    # weekly seasonality
    stepwise=True,
    suppress_warnings=True,
    information_criterion='aic',
    trace=True              # print model comparisons
)
print(model.summary())

# Step 4: Forecast
forecast, conf_int = model.predict(n_periods=30, return_conf_int=True)

# Step 5: Residual diagnostics
model.plot_diagnostics(figsize=(12, 8))
plt.show()
```

---

## Prophet for Business Forecasting

### When to Use Prophet

```
Prophet excels when:
  - You have daily data with strong seasonality
  - There are holidays and special events
  - There are missing values or outliers
  - You need interpretable components (trend + seasonality)
  - Non-technical stakeholders need to understand the model

Prophet is less suitable when:
  - Data is very high frequency (sub-hourly)
  - Strong autoregressive patterns dominate
  - Causal relationships matter more than patterns
  - Data has very little history (< 2 full seasonal cycles)
```

### Implementation

```python
from prophet import Prophet
import pandas as pd

# Prophet requires columns named 'ds' (date) and 'y' (value)
df_prophet = df.reset_index().rename(columns={'date': 'ds', 'sales': 'y'})

# Create and configure model
model = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=False,
    changepoint_prior_scale=0.05,     # trend flexibility (lower = smoother)
    seasonality_prior_scale=10,       # seasonality flexibility
    holidays_prior_scale=10,          # holiday effect flexibility
    interval_width=0.95               # 95% prediction interval
)

# Add country holidays
model.add_country_holidays(country_name='US')

# Add custom events
promotions = pd.DataFrame({
    'holiday': 'big_sale',
    'ds': pd.to_datetime(['2024-07-04', '2024-11-29', '2024-12-26']),
    'lower_window': -1,  # effect starts 1 day before
    'upper_window': 1    # effect lasts 1 day after
})
model = Prophet(holidays=promotions)

# Add external regressors
model.add_regressor('temperature')
model.add_regressor('is_weekend')

# Fit
model.fit(df_prophet)

# Forecast
future = model.make_future_dataframe(periods=90)
forecast = model.predict(future)

# Visualize
model.plot(forecast)
model.plot_components(forecast)

# Cross-validation
from prophet.diagnostics import cross_validation, performance_metrics
cv_results = cross_validation(model, initial='365 days',
                               period='30 days', horizon='90 days')
metrics = performance_metrics(cv_results)
print(metrics[['horizon', 'mape', 'rmse', 'coverage']].tail())
```

---

## Anomaly Detection

### Statistical Methods

```python
# Method 1: Z-score (simple, assumes normality)
from scipy import stats

z_scores = stats.zscore(df['sales'])
anomalies = df[abs(z_scores) > 3]
print(f"Found {len(anomalies)} anomalies (> 3 sigma)")

# Method 2: IQR method (robust to non-normal data)
Q1 = df['sales'].quantile(0.25)
Q3 = df['sales'].quantile(0.75)
IQR = Q3 - Q1
lower = Q1 - 1.5 * IQR
upper = Q3 + 1.5 * IQR
anomalies = df[(df['sales'] < lower) | (df['sales'] > upper)]

# Method 3: STL decomposition residuals
from statsmodels.tsa.seasonal import STL
stl = STL(df['sales'], period=7, robust=True)
result = stl.fit()
residuals = result.resid
threshold = 3 * residuals.std()
anomalies = df[abs(residuals) > threshold]

# Method 4: Prophet anomaly detection
forecast = model.predict(df_prophet)
df_prophet['anomaly'] = (
    (df_prophet['y'] < forecast['yhat_lower']) |
    (df_prophet['y'] > forecast['yhat_upper'])
)
```

### Choosing an Anomaly Detection Method

| Method | Assumptions | Best For |
|--------|------------|----------|
| Z-score | Normal distribution | Simple, stationary data |
| IQR | None (non-parametric) | Robust baseline detection |
| STL residuals | Decomposable seasonality | Seasonal data with outliers |
| Prophet bounds | Trend + seasonality | Business data with events |
| Isolation Forest | None | Complex, multivariate data |
| LSTM autoencoder | Temporal patterns | High-frequency, complex patterns |

---

## Forecast Evaluation

### Metrics

| Metric | Formula | When to Use |
|--------|---------|-------------|
| MAE | mean(abs(actual - forecast)) | Easy to interpret, same unit as data |
| RMSE | sqrt(mean((actual - forecast)^2)) | Penalizes large errors |
| MAPE | mean(abs((actual - forecast)/actual)) * 100 | Percentage, scale-independent |
| sMAPE | mean(2*abs(A-F)/(abs(A)+abs(F))) * 100 | Symmetric, handles near-zero values |
| Coverage | % of actuals within prediction interval | Prediction interval reliability |

### Cross-Validation for Time Series

```python
from sklearn.model_selection import TimeSeriesSplit

# Never use random train/test split for time series!
# Always preserve temporal order.

tscv = TimeSeriesSplit(n_splits=5)
scores = []

for train_idx, test_idx in tscv.split(df):
    train = df.iloc[train_idx]
    test = df.iloc[test_idx]

    # Fit model on training data
    model = pm.auto_arima(train['sales'], seasonal=True, m=7)

    # Forecast for test period
    forecast = model.predict(n_periods=len(test))

    # Calculate metrics
    mape = np.mean(np.abs((test['sales'].values - forecast) / test['sales'].values)) * 100
    scores.append(mape)

print(f"Average MAPE across folds: {np.mean(scores):.2f}%")
```

---

## Practical Applications

### Demand Forecasting

```
Input: Historical sales data + holidays + promotions
Output: Expected demand for next 30/60/90 days

Pipeline:
1. Clean data (handle missing values, remove known anomalies)
2. Feature engineering (day of week, month, holidays, promotions)
3. Train Prophet model with regressors
4. Generate forecast with prediction intervals
5. Upper bound = ordering quantity (safety stock)
6. Point estimate = staffing/capacity planning

Key decisions:
  - Order based on upper prediction bound (avoid stockouts)
  - Staff based on point estimate (cost optimization)
  - Budget based on lower bound (conservative planning)
```

### Capacity Planning

```
Monitoring system metrics (CPU, memory, requests/sec)

Workflow:
1. Collect 3-6 months of hourly metrics
2. Decompose into trend + daily + weekly seasonality
3. Forecast trend forward 3-6 months
4. Apply seasonal peaks to forecast
5. Add safety margin (20-50% above peak forecast)
6. Plan scaling events before predicted threshold crossing

Alert: "At current growth rate, CPU will exceed 80% utilization
by March 15. Recommend adding 2 instances by March 1."
```

### Model Selection Guide

| Scenario | Recommended Model | Reason |
|----------|------------------|--------|
| < 2 years daily data | Exponential smoothing | Simple, few parameters |
| 2+ years daily data with holidays | Prophet | Handles holidays, interpretable |
| High-frequency (minutely) | ARIMA/SARIMA | Good for short-term, captures autocorrelation |
| Multiple related series | Vector AR (VAR) | Captures cross-series correlations |
| Very long horizon (years) | Trend extrapolation + judgment | Statistical models unreliable long-term |
| Intermittent demand (many zeros) | Croston's method | Designed for sporadic demand |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to time series analyst
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Time Series Analyst Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with time series analyst for my current situation"

**Output:**

Based on your situation, here is a structured approach to time series analyst:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
