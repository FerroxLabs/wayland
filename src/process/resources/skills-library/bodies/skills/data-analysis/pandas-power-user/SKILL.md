---
name: pandas-power-user
description: |
  Advanced pandas techniques for data wrangling including performance optimization, method chaining patterns, MultiIndex operations, memory management, and idiomatic pandas code.
  Use when the user asks about pandas power user, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of pandas power user or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science statistics budgeting step-by-step advanced python performing-arts sales"
  category: "data-analysis"
  subcategory: "statistics-modeling"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Pandas Power User

You are an expert pandas practitioner who writes high-performance, idiomatic data wrangling code using method chaining, vectorized operations, and advanced indexing techniques.


## When to Use

**Use this skill when:**
- User asks about pandas power user techniques or best practices
- User needs guidance on pandas power user concepts
- User wants to implement or improve their approach to pandas power user

**Do NOT use when:**
- The request falls outside the scope of pandas power user
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Method Chaining Patterns

### Fluent Data Pipeline

```python
import pandas as pd
import numpy as np

result = (
    pd.read_csv("sales.csv", parse_dates=["date"])
    .rename(columns=str.lower)
    .assign(
        year=lambda df: df["date"].dt.year,
        month=lambda df: df["date"].dt.month,
        revenue=lambda df: df["quantity"] * df["unit_price"],
        margin=lambda df: df["revenue"] - df["cost"],
    )
    .query("year >= 2024 and quantity > 0")
    .groupby(["region", "year", "month"], as_index=False)
    .agg(
        total_revenue=("revenue", "sum"),
        avg_margin=("margin", "mean"),
        order_count=("order_id", "nunique"),
    )
    .sort_values("total_revenue", ascending=False)
    .pipe(lambda df: df.assign(
        revenue_rank=df.groupby("year")["total_revenue"].rank(ascending=False)
    ))
)
```

### Custom Pipe Functions

```python
def remove_outliers(df, column, n_std=3):
    """Remove rows where column values exceed n standard deviations."""
    mean, std = df[column].mean(), df[column].std()
    lower = mean - n_std * std
    upper = mean + n_std * std
    return df.query(f"{lower} <= `{column}` <= {upper}")

def add_rolling_features(df, column, windows=[7, 30]):
    """Add rolling mean and std for specified windows."""
    for w in windows:
        df = df.assign(**{
            f"{column}_rolling_{w}d_mean": df[column].rolling(w).mean(),
            f"{column}_rolling_{w}d_std": df[column].rolling(w).std(),
        })
    return df

def log_shape(df, label=""):
    """Debug helper: print shape without breaking chain."""
    print(f"{label} shape: {df.shape}")
    return df

# Usage in chain
result = (
    raw_data
    .pipe(log_shape, "Raw")
    .pipe(remove_outliers, "price")
    .pipe(log_shape, "After outlier removal")
    .pipe(add_rolling_features, "price", windows=[7, 14, 30])
)
```

## MultiIndex Operations

### Creating and Navigating MultiIndex

```python
# Create from columns
df = df.set_index(["region", "category", "date"]).sort_index()

# Cross-section: select specific level values
northeast_data = df.xs("Northeast", level="region")
electronics = df.xs("Electronics", level="category")

# Slice with IndexSlice
idx = pd.IndexSlice
df.loc[idx["Northeast", "Electronics", "2024-01":"2024-06"], :]

# Reset specific levels
df.reset_index(level="date", inplace=False)
```

### MultiIndex Aggregation

```python
# Aggregate at different levels
by_region = df.groupby(level="region").sum()
by_region_cat = df.groupby(level=["region", "category"]).sum()

# Unstack for pivot-like behavior
pivot_view = (
    df.groupby(level=["region", "category"])["revenue"]
    .sum()
    .unstack(level="category", fill_value=0)
)

# Stack to go back to long format
long_view = pivot_view.stack()
```

### Reshaping with MultiIndex

```python
# Pivot table with multiple aggregations
summary = pd.pivot_table(
    sales,
    values=["revenue", "quantity"],
    index=["region", "category"],
    columns="quarter",
    aggfunc={"revenue": "sum", "quantity": "mean"},
    margins=True,
)

# Flatten MultiIndex columns
summary.columns = ['_'.join(map(str, col)).strip('_') for col in summary.columns]
```

## Performance Optimization

### Data Types Optimization

```python
def optimize_dtypes(df, verbose=True):
    """Reduce DataFrame memory usage by downcasting types."""
    start_mem = df.memory_usage(deep=True).sum() / 1e6

    for col in df.columns:
        col_type = df[col].dtype

        if col_type == "object":
            n_unique = df[col].nunique()
            n_total = len(df[col])
            if n_unique / n_total < 0.5:
                df[col] = df[col].astype("category")

        elif col_type in ["int64", "int32"]:
            if df[col].min() >= 0:
                df[col] = pd.to_numeric(df[col], downcast="unsigned")
            else:
                df[col] = pd.to_numeric(df[col], downcast="integer")

        elif col_type in ["float64"]:
            df[col] = pd.to_numeric(df[col], downcast="float")

    end_mem = df.memory_usage(deep=True).sum() / 1e6
    if verbose:
        print(f"Memory: {start_mem:.1f} MB -> {end_mem:.1f} MB "
              f"({100 * (1 - end_mem / start_mem):.1f}% reduction)")
    return df
```

### Vectorized Operations vs. Apply

```python
# SLOW: apply with Python function
df["category"] = df["price"].apply(lambda x: "high" if x > 100 else "low")

# FAST: vectorized with np.where
df["category"] = np.where(df["price"] > 100, "high", "low")

# FAST: vectorized with np.select for multiple conditions
conditions = [
    df["price"] > 1000,
    df["price"] > 100,
    df["price"] > 10,
]
choices = ["premium", "standard", "budget"]
df["tier"] = np.select(conditions, choices, default="free")

# SLOW: iterrows
for idx, row in df.iterrows():
    df.at[idx, "result"] = row["a"] + row["b"]

# FAST: vectorized arithmetic
df["result"] = df["a"] + df["b"]
```

### Chunked Reading for Large Files

```python
# Process large CSV in chunks
chunk_results = []
for chunk in pd.read_csv("huge_file.csv", chunksize=100_000):
    processed = (
        chunk
        .query("status == 'active'")
        .groupby("category")["revenue"]
        .sum()
    )
    chunk_results.append(processed)

result = pd.concat(chunk_results).groupby(level=0).sum()
```

### Using Parquet for Speed

```python
# Write with compression
df.to_parquet("data.parquet", engine="pyarrow", compression="snappy")

# Read specific columns (much faster than CSV)
df = pd.read_parquet("data.parquet", columns=["id", "revenue", "date"])

# Partitioned parquet for very large datasets
df.to_parquet("data/", partition_cols=["year", "month"], engine="pyarrow")
df = pd.read_parquet("data/", filters=[("year", "==", 2024)])
```

## Advanced Groupby Patterns

### Named Aggregation

```python
summary = df.groupby("category").agg(
    total_revenue=("revenue", "sum"),
    avg_price=("price", "mean"),
    median_price=("price", "median"),
    unique_customers=("customer_id", "nunique"),
    first_sale=("date", "min"),
    last_sale=("date", "max"),
)
```

### Transform vs. Agg

```python
# transform: returns same-shaped output (broadcasts back)
df["pct_of_group"] = (
    df.groupby("category")["revenue"]
    .transform(lambda x: x / x.sum())
)

# Group-level z-scores
df["revenue_zscore"] = (
    df.groupby("category")["revenue"]
    .transform(lambda x: (x - x.mean()) / x.std())
)

# Flag top N per group
df["is_top_5"] = (
    df.groupby("category")["revenue"]
    .transform(lambda x: x.rank(ascending=False) <= 5)
)
```

### Rolling Within Groups

```python
df = df.sort_values(["customer_id", "date"])
df["rolling_avg_spend"] = (
    df.groupby("customer_id")["amount"]
    .transform(lambda x: x.rolling(window=3, min_periods=1).mean())
)
```

## Window Functions

### Ranking

```python
# Multiple ranking methods
df["dense_rank"] = df.groupby("category")["revenue"].rank(method="dense", ascending=False)
df["pct_rank"] = df.groupby("category")["revenue"].rank(pct=True)
```

### Lag and Lead

```python
df = df.sort_values(["customer_id", "date"])
df["prev_purchase"] = df.groupby("customer_id")["amount"].shift(1)
df["next_purchase"] = df.groupby("customer_id")["amount"].shift(-1)
df["purchase_growth"] = df["amount"] / df["prev_purchase"] - 1

# Cumulative operations
df["cumulative_spend"] = df.groupby("customer_id")["amount"].cumsum()
df["running_max"] = df.groupby("customer_id")["amount"].cummax()
```

## String Operations at Scale

```python
# Vectorized string operations (much faster than apply)
df["name_clean"] = (
    df["name"]
    .str.strip()
    .str.lower()
    .str.replace(r'[^\w\s]', '', regex=True)
    .str.replace(r'\s+', ' ', regex=True)
)

# Extract with regex
df["domain"] = df["email"].str.extract(r'@(\w+\.\w+)')

# Contains check
df["is_corp"] = df["email"].str.contains(r'@(company|corp)\.\w+', regex=True)
```

## Merge Strategies

### Validate Merges

```python
# Catch unexpected duplicates
merged = pd.merge(
    orders, customers,
    on="customer_id",
    how="left",
    validate="many_to_one",   # Fails if customer_id not unique in right
    indicator=True,            # Adds _merge column
)

# Check for unmatched rows
print(merged["_merge"].value_counts())
# left_only   = orders with no matching customer
# both        = successful matches
```

### Merge Asof for Time-Based Joins

```python
# Join each trade to the most recent quote
result = pd.merge_asof(
    trades.sort_values("timestamp"),
    quotes.sort_values("timestamp"),
    on="timestamp",
    by="ticker",
    direction="backward",      # Most recent quote before trade
    tolerance=pd.Timedelta("1min"),
)
```

## Date and Time Mastery

```python
# Business day operations
df["next_business_day"] = df["date"] + pd.offsets.BDay(1)
df["month_end"] = df["date"] + pd.offsets.MonthEnd(0)
df["quarter_start"] = df["date"] - pd.offsets.QuarterBegin(1)

# Resampling time series
daily_revenue = (
    df.set_index("date")
    .resample("W-MON")["revenue"]
    .agg(["sum", "mean", "count"])
)

# Period-based grouping
df["fiscal_quarter"] = df["date"].dt.to_period("Q-JUN")  # Fiscal year ending June
```

## Debugging and Profiling

```python
# Profile a pipeline step by step
import time

def timed_pipe(df, func, name="step"):
    start = time.perf_counter()
    result = func(df)
    elapsed = time.perf_counter() - start
    print(f"{name}: {elapsed:.3f}s | shape: {result.shape}")
    return result

result = (
    raw_data
    .pipe(timed_pipe, lambda df: df.dropna(subset=["id"]), "dropna")
    .pipe(timed_pipe, lambda df: df.merge(lookup, on="id"), "merge")
    .pipe(timed_pipe, lambda df: df.groupby("cat").agg(total=("val", "sum")), "agg")
)
```

## Common Anti-Patterns

| Anti-Pattern | Better Alternative |
|---|---|
| `df.apply(lambda row: ..., axis=1)` | Vectorized operations with `np.where`, `np.select` |
| `for idx, row in df.iterrows()` | Vectorized column operations |
| Chained indexing `df["a"]["b"]` | Single `.loc[row, col]` accessor |
| Repeated `df = df[...]` filtering | Single `.query()` with combined conditions |
| `df.append()` in a loop | Collect list then `pd.concat()` once |
| `inplace=True` everywhere | Reassign: `df = df.method()` for clarity |
| Reading CSV repeatedly | Convert to Parquet, read once |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to pandas power user
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Pandas Power User Analysis

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

**Input:** "Help me with pandas power user for my current situation"

**Output:**

Based on your situation, here is a structured approach to pandas power user:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
