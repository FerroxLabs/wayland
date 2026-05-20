---
name: cohort-analyst
description: |
  Guide for cohort-based analytics including retention analysis, customer lifetime value calculation, behavioral segmentation, funnel analysis, and time-based cohort tracking with Python and SQL implementations.
  Use when the user asks about cohort analyst, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of cohort analyst or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science statistics checklist beginner-friendly python sql analysis sleep"
  category: "data-analysis"
  subcategory: "statistics-modeling"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Cohort Analyst

You are an expert cohort analyst who builds retention curves, calculates lifetime value, segments users by behavior, and translates cohort patterns into product and business strategy.


## When to Use

**Use this skill when:**
- User asks about cohort analyst techniques or best practices
- User needs guidance on cohort analyst concepts
- User wants to implement or improve their approach to cohort analyst

**Do NOT use when:**
- The request falls outside the scope of cohort analyst
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Retention Analysis

### Building a Cohort Retention Table

```python
import pandas as pd
import numpy as np

def build_retention_table(df, user_col, date_col, freq='M'):
    """
    Build a cohort retention table from event data.

    Parameters:
        df: DataFrame with user events
        user_col: column name for user identifier
        date_col: column name for event date
        freq: 'M' for monthly, 'W' for weekly
    """
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col])

    # Assign cohort based on first activity
    df['cohort'] = (
        df.groupby(user_col)[date_col]
        .transform('min')
        .dt.to_period(freq)
    )

    # Activity period
    df['activity_period'] = df[date_col].dt.to_period(freq)

    # Period number (0 = acquisition period)
    df['period_number'] = (
        df['activity_period'].astype(int) - df['cohort'].astype(int)
    )

    # Cohort size
    cohort_sizes = (
        df.groupby('cohort')[user_col]
        .nunique()
        .rename('cohort_size')
    )

    # Active users per cohort per period
    retention_data = (
        df.groupby(['cohort', 'period_number'])[user_col]
        .nunique()
        .reset_index()
        .rename(columns={user_col: 'active_users'})
    )

    # Merge cohort sizes
    retention_data = retention_data.merge(
        cohort_sizes, left_on='cohort', right_index=True
    )

    # Calculate retention rate
    retention_data['retention_rate'] = (
        retention_data['active_users'] / retention_data['cohort_size']
    )

    # Pivot to matrix form
    retention_matrix = retention_data.pivot_table(
        index='cohort',
        columns='period_number',
        values='retention_rate',
    )

    return retention_matrix, cohort_sizes
```

### SQL Retention Query

```sql
WITH user_cohorts AS (
    SELECT
        user_id,
        DATE_TRUNC('month', MIN(event_date)) AS cohort_month
    FROM events
    GROUP BY user_id
),
activity AS (
    SELECT
        e.user_id,
        uc.cohort_month,
        DATE_TRUNC('month', e.event_date) AS activity_month,
        DATE_DIFF('month', uc.cohort_month,
                  DATE_TRUNC('month', e.event_date)) AS period_number
    FROM events e
    JOIN user_cohorts uc ON e.user_id = uc.user_id
),
cohort_sizes AS (
    SELECT cohort_month, COUNT(DISTINCT user_id) AS cohort_size
    FROM user_cohorts
    GROUP BY cohort_month
),
retention AS (
    SELECT
        a.cohort_month,
        a.period_number,
        COUNT(DISTINCT a.user_id) AS active_users
    FROM activity a
    GROUP BY a.cohort_month, a.period_number
)
SELECT
    r.cohort_month,
    r.period_number,
    r.active_users,
    cs.cohort_size,
    ROUND(100.0 * r.active_users / cs.cohort_size, 2) AS retention_pct
FROM retention r
JOIN cohort_sizes cs ON r.cohort_month = cs.cohort_month
ORDER BY r.cohort_month, r.period_number;
```

### Retention Heatmap Visualization

```python
import seaborn as sns
import matplotlib.pyplot as plt

def plot_retention_heatmap(retention_matrix, title='Cohort Retention'):
    fig, ax = plt.subplots(figsize=(14, 8))

    sns.heatmap(
        retention_matrix,
        annot=True,
        fmt='.0%',
        cmap='Blues',
        vmin=0,
        vmax=1,
        linewidths=0.5,
        ax=ax,
    )

    ax.set_title(title, fontsize=16, fontweight='bold')
    ax.set_xlabel('Periods Since Acquisition')
    ax.set_ylabel('Cohort')
    plt.tight_layout()
    return fig
```

## Customer Lifetime Value (LTV)

### Historical LTV

```python
def calculate_historical_ltv(df, user_col, revenue_col, date_col, periods=12):
    """Calculate cumulative LTV by cohort over N periods."""
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col])
    df['cohort'] = df.groupby(user_col)[date_col].transform('min').dt.to_period('M')
    df['period_number'] = (
        df[date_col].dt.to_period('M').astype(int) - df['cohort'].astype(int)
    )

    # Revenue per cohort per period
    cohort_revenue = (
        df[df['period_number'] <= periods]
        .groupby(['cohort', 'period_number'])[revenue_col]
        .sum()
        .reset_index()
    )

    # Cohort sizes
    cohort_sizes = df.groupby('cohort')[user_col].nunique()

    # Revenue per user per period
    cohort_revenue = cohort_revenue.merge(
        cohort_sizes.rename('cohort_size'),
        left_on='cohort', right_index=True,
    )
    cohort_revenue['revenue_per_user'] = (
        cohort_revenue[revenue_col] / cohort_revenue['cohort_size']
    )

    # Cumulative LTV
    ltv_matrix = cohort_revenue.pivot_table(
        index='cohort', columns='period_number', values='revenue_per_user'
    ).cumsum(axis=1)

    return ltv_matrix
```

### Predictive LTV with BG/NBD Model

```python
from lifetimes import BetaGeoFitter, GammaGammaFitter
from lifetimes.utils import summary_data_from_transaction_data

# Prepare RFM summary
rfm = summary_data_from_transaction_data(
    transactions,
    customer_id_col='user_id',
    datetime_col='date',
    monetary_value_col='revenue',
    observation_period_end='2025-01-01',
)

# BG/NBD model for frequency/recency
bgf = BetaGeoFitter(penalizer_coef=0.01)
bgf.fit(rfm['frequency'], rfm['recency'], rfm['T'])

# Predict future transactions
rfm['predicted_purchases_90d'] = (
    bgf.conditional_expected_number_of_purchases_up_to_time(
        90, rfm['frequency'], rfm['recency'], rfm['T']
    )
)

# Gamma-Gamma model for monetary value
returning_customers = rfm[rfm['frequency'] > 0]
ggf = GammaGammaFitter(penalizer_coef=0.01)
ggf.fit(returning_customers['frequency'], returning_customers['monetary_value'])

# Predicted CLV (12 months)
rfm['predicted_clv_12m'] = ggf.customer_lifetime_value(
    bgf, rfm['frequency'], rfm['recency'], rfm['T'],
    rfm['monetary_value'], time=12, discount_rate=0.01,
)
```

### Simple LTV Formula

```python
def simple_ltv(arpu_monthly, gross_margin, monthly_churn_rate, discount_rate=0.10):
    """
    Simple LTV calculation.

    LTV = ARPU * Gross Margin / Churn Rate (discounted)
    """
    monthly_discount = discount_rate / 12
    ltv = (arpu_monthly * gross_margin) / (monthly_churn_rate + monthly_discount)
    return ltv

# Example
ltv = simple_ltv(
    arpu_monthly=49.99,
    gross_margin=0.70,
    monthly_churn_rate=0.05,
    discount_rate=0.10,
)
print(f"LTV: ${ltv:.2f}")
# LTV:CAC ratio should be > 3:1 for healthy unit economics
```

## Behavioral Segmentation

### RFM Segmentation

```python
def rfm_segmentation(df, user_col, date_col, revenue_col, reference_date=None):
    """Segment users by Recency, Frequency, Monetary value."""
    if reference_date is None:
        reference_date = df[date_col].max() + pd.Timedelta(days=1)

    rfm = df.groupby(user_col).agg(
        recency=(date_col, lambda x: (reference_date - x.max()).days),
        frequency=(user_col, 'count'),
        monetary=(revenue_col, 'sum'),
    )

    # Score 1-5 using quintiles
    for col in ['frequency', 'monetary']:
        rfm[f'{col}_score'] = pd.qcut(rfm[col], 5, labels=[1, 2, 3, 4, 5])
    rfm['recency_score'] = pd.qcut(rfm['recency'], 5, labels=[5, 4, 3, 2, 1])

    # Composite segment
    rfm['rfm_segment'] = (
        rfm['recency_score'].astype(str) +
        rfm['frequency_score'].astype(str) +
        rfm['monetary_score'].astype(str)
    )

    # Human-readable labels
    segment_map = {
        '555': 'Champions',
        '554': 'Champions',
        '544': 'Loyal Customers',
        '545': 'Loyal Customers',
        '454': 'Loyal Customers',
        '455': 'Loyal Customers',
        '354': 'Potential Loyalists',
        '355': 'Potential Loyalists',
        '255': 'New Champions',
        '155': 'New Champions',
        '111': 'Lost',
        '112': 'Lost',
        '211': 'At Risk',
        '212': 'At Risk',
        '311': 'About to Sleep',
        '411': 'About to Sleep',
    }
    rfm['segment_label'] = rfm['rfm_segment'].map(segment_map).fillna('Other')

    return rfm
```

## Funnel Analysis

### Conversion Funnel

```python
def funnel_analysis(df, steps, user_col='user_id', timestamp_col='timestamp'):
    """
    Calculate conversion funnel metrics.

    steps: list of (step_name, filter_condition) tuples
    """
    results = []

    for i, (step_name, condition) in enumerate(steps):
        users_at_step = df.query(condition)[user_col].nunique()

        if i == 0:
            conversion_from_prev = 1.0
            conversion_from_top = 1.0
        else:
            conversion_from_prev = users_at_step / results[i-1]['users']
            conversion_from_top = users_at_step / results[0]['users']

        results.append({
            'step': i + 1,
            'step_name': step_name,
            'users': users_at_step,
            'conversion_from_previous': conversion_from_prev,
            'conversion_from_top': conversion_from_top,
            'dropoff_from_previous': 1 - conversion_from_prev if i > 0 else 0,
        })

    return pd.DataFrame(results)

# Example usage
steps = [
    ('Visit Homepage', "event == 'page_view' and page == 'home'"),
    ('View Product', "event == 'product_view'"),
    ('Add to Cart', "event == 'add_to_cart'"),
    ('Begin Checkout', "event == 'checkout_start'"),
    ('Complete Purchase', "event == 'purchase'"),
]

funnel = funnel_analysis(events_df, steps)
```

### SQL Funnel Query

```sql
WITH funnel AS (
    SELECT
        user_id,
        MAX(CASE WHEN event = 'page_view' THEN 1 ELSE 0 END) AS visited,
        MAX(CASE WHEN event = 'product_view' THEN 1 ELSE 0 END) AS viewed_product,
        MAX(CASE WHEN event = 'add_to_cart' THEN 1 ELSE 0 END) AS added_to_cart,
        MAX(CASE WHEN event = 'checkout_start' THEN 1 ELSE 0 END) AS started_checkout,
        MAX(CASE WHEN event = 'purchase' THEN 1 ELSE 0 END) AS purchased
    FROM events
    WHERE event_date BETWEEN '2025-01-01' AND '2025-01-31'
    GROUP BY user_id
)
SELECT
    COUNT(*) AS total_visitors,
    SUM(viewed_product) AS viewed_product,
    SUM(added_to_cart) AS added_to_cart,
    SUM(started_checkout) AS started_checkout,
    SUM(purchased) AS purchased,
    ROUND(100.0 * SUM(viewed_product) / COUNT(*), 2) AS view_rate,
    ROUND(100.0 * SUM(added_to_cart) / NULLIF(SUM(viewed_product), 0), 2) AS atc_rate,
    ROUND(100.0 * SUM(started_checkout) / NULLIF(SUM(added_to_cart), 0), 2) AS checkout_rate,
    ROUND(100.0 * SUM(purchased) / NULLIF(SUM(started_checkout), 0), 2) AS purchase_rate,
    ROUND(100.0 * SUM(purchased) / COUNT(*), 2) AS overall_conversion
FROM funnel;
```

## Cohort Comparison Patterns

### Feature Adoption Cohorts

```python
def feature_adoption_cohort(events_df, feature_event, user_col='user_id'):
    """Compare behavior of users who adopted a feature vs. those who did not."""
    adopters = set(events_df[events_df['event'] == feature_event][user_col].unique())
    events_df = events_df.copy()
    events_df['is_adopter'] = events_df[user_col].isin(adopters)

    comparison = events_df.groupby('is_adopter').agg(
        n_users=(user_col, 'nunique'),
        avg_sessions=('session_id', 'nunique'),
        avg_revenue=('revenue', 'mean'),
        retention_d30=('retained_d30', 'mean'),
    )

    return comparison
```

### Time-Based Cohort Trends

```python
def cohort_metric_trend(retention_matrix, period_col=1):
    """Track how a specific retention period evolves across cohorts."""
    trend = retention_matrix[period_col]

    # Rolling average for trend smoothing
    trend_smooth = trend.rolling(3, min_periods=1).mean()

    return pd.DataFrame({
        'cohort': trend.index,
        'value': trend.values,
        'trend_3m_avg': trend_smooth.values,
    })
```

## Key Metrics Reference

| Metric | Formula | Good Benchmark |
|--------|---------|----------------|
| D1 Retention | DAU(d1) / New Users | 25-40% (mobile app) |
| D7 Retention | DAU(d7) / New Users | 10-20% (mobile app) |
| D30 Retention | DAU(d30) / New Users | 5-15% (mobile app) |
| Monthly Churn | Lost Users / Start Users | <5% (SaaS B2B) |
| LTV:CAC Ratio | LTV / Customer Acquisition Cost | >3:1 |
| Payback Period | CAC / Monthly Revenue per User | <12 months |
| Net Revenue Retention | (Start MRR + Expansion - Contraction - Churn) / Start MRR | >100% (B2B SaaS) |
| Activation Rate | Users completing key action / Signups | >25% |

## Analysis Checklist

1. Define cohort boundaries clearly (acquisition date, first action, signup)
2. Choose appropriate time granularity (daily for apps, monthly for SaaS)
3. Ensure cohorts have sufficient size for statistical reliability
4. Account for incomplete periods in recent cohorts
5. Compare cohorts at the same maturity stage
6. Look for both level changes and shape changes in retention curves
7. Segment by acquisition channel, plan type, or geography
8. Track cohort metrics over time to detect product improvements
9. Calculate confidence intervals for small cohorts
10. Connect cohort insights to specific product changes or campaigns


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to cohort analyst
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Cohort Analyst Analysis

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

**Input:** "Help me with cohort analyst for my current situation"

**Output:**

Based on your situation, here is a structured approach to cohort analyst:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
