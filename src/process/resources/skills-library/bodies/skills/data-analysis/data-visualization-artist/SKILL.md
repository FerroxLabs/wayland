---
name: data-visualization-artist
description: |
  Comprehensive guide to creating effective data visualizations with matplotlib, plotly, seaborn, and D3.js including chart selection frameworks, design principles, and publication-quality output.
  Use when the user asks about data visualization artist, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of data visualization artist or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science statistics checklist template python javascript testing analysis"
  category: "data-analysis"
  subcategory: "statistics-modeling"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Data Visualization Artist

You are an expert data visualization practitioner who selects the right chart for every insight, applies perceptual design principles, and produces publication-quality graphics across matplotlib, plotly, seaborn, and D3.js.


## When to Use

**Use this skill when:**
- User asks about data visualization artist techniques or best practices
- User needs guidance on data visualization artist concepts
- User wants to implement or improve their approach to data visualization artist

**Do NOT use when:**
- The request falls outside the scope of data visualization artist
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Chart Selection Framework

### By Analysis Goal

| Goal | Best Charts | When to Use |
|------|-------------|-------------|
| **Comparison** | Bar, Grouped bar, Dot plot | Comparing values across categories |
| **Distribution** | Histogram, KDE, Box, Violin | Understanding spread and shape |
| **Relationship** | Scatter, Bubble, Heatmap | Correlation between variables |
| **Composition** | Stacked bar, Treemap, Waffle | Parts of a whole |
| **Trend** | Line, Area, Sparkline | Change over time |
| **Ranking** | Horizontal bar, Lollipop, Bump | Ordered comparisons |
| **Geospatial** | Choropleth, Bubble map, Hexbin | Location-based data |
| **Flow** | Sankey, Alluvial, Chord | Movement between states |

### By Data Type

| Data Combination | Recommended Charts |
|---|---|
| 1 numeric | Histogram, KDE, Box plot |
| 1 categorical | Bar chart, Pie (sparingly) |
| 2 numeric | Scatter, Hexbin, 2D histogram |
| 1 numeric + 1 categorical | Box, Violin, Strip, Swarm |
| 2 categorical | Heatmap, Mosaic, Grouped bar |
| Numeric over time | Line, Area, Candlestick |
| Many numeric | Parallel coordinates, Radar, Pair plot |

## Matplotlib Foundation

### Publication-Quality Template

```python
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np

def setup_style():
    """Configure publication-quality defaults."""
    plt.rcParams.update({
        'figure.figsize': (10, 6),
        'figure.dpi': 150,
        'font.family': 'sans-serif',
        'font.size': 12,
        'axes.titlesize': 16,
        'axes.titleweight': 'bold',
        'axes.labelsize': 13,
        'axes.spines.top': False,
        'axes.spines.right': False,
        'legend.frameon': False,
        'legend.fontsize': 11,
        'xtick.labelsize': 11,
        'ytick.labelsize': 11,
    })

setup_style()
```

### Annotated Bar Chart

```python
fig, ax = plt.subplots(figsize=(10, 6))

categories = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E']
values = [42, 38, 31, 27, 19]
colors = ['#2563eb' if v == max(values) else '#93c5fd' for v in values]

bars = ax.barh(categories, values, color=colors, height=0.6)

# Add value labels
for bar, val in zip(bars, values):
    ax.text(bar.get_width() + 0.5, bar.get_y() + bar.get_height() / 2,
            f'{val}%', va='center', fontweight='bold' if val == max(values) else 'normal')

ax.set_xlabel('Market Share (%)')
ax.set_title('Product Market Share, Q4 2024')
ax.set_xlim(0, max(values) * 1.15)
ax.invert_yaxis()
plt.tight_layout()
plt.savefig('market_share.png', dpi=300, bbox_inches='tight')
```

### Multi-Panel Figure

```python
fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# Panel A: Line trend
axes[0, 0].plot(dates, revenue, color='#2563eb', linewidth=2)
axes[0, 0].fill_between(dates, revenue, alpha=0.1, color='#2563eb')
axes[0, 0].set_title('A) Revenue Trend')

# Panel B: Distribution
axes[0, 1].hist(prices, bins=30, color='#2563eb', edgecolor='white', alpha=0.8)
axes[0, 1].axvline(np.median(prices), color='#dc2626', linestyle='--', label='Median')
axes[0, 1].set_title('B) Price Distribution')
axes[0, 1].legend()

# Panel C: Scatter
scatter = axes[1, 0].scatter(x, y, c=category_colors, s=50, alpha=0.6)
axes[1, 0].set_title('C) Price vs. Quantity')

# Panel D: Heatmap
im = axes[1, 1].imshow(correlation_matrix, cmap='RdBu_r', vmin=-1, vmax=1)
fig.colorbar(im, ax=axes[1, 1], shrink=0.8)
axes[1, 1].set_title('D) Correlation Matrix')

fig.suptitle('Quarterly Sales Analysis', fontsize=18, fontweight='bold', y=1.02)
plt.tight_layout()
```

## Seaborn Statistical Visualization

### Distribution Comparison

```python
import seaborn as sns

fig, axes = plt.subplots(1, 3, figsize=(16, 5))

# Violin plot: distribution shape
sns.violinplot(data=df, x='category', y='value', inner='box',
               palette='Blues', ax=axes[0])
axes[0].set_title('Distribution Shape')

# Box + strip: distribution with individual points
sns.boxplot(data=df, x='category', y='value', palette='Blues',
            fliersize=0, ax=axes[1])
sns.stripplot(data=df, x='category', y='value', color='black',
              size=3, alpha=0.3, jitter=True, ax=axes[1])
axes[1].set_title('Box + Individual Points')

# KDE: smooth density comparison
for cat in df['category'].unique():
    subset = df[df['category'] == cat]
    sns.kdeplot(subset['value'], label=cat, ax=axes[2], fill=True, alpha=0.3)
axes[2].set_title('Density Comparison')
axes[2].legend()
```

### Faceted Analysis

```python
g = sns.FacetGrid(df, col='region', row='segment',
                  height=4, aspect=1.3, margin_titles=True)
g.map_dataframe(sns.scatterplot, x='spend', y='revenue',
                hue='channel', alpha=0.6, palette='Set2')
g.add_legend()
g.set_titles(row_template='{row_name}', col_template='{col_name}')
g.set_axis_labels('Customer Spend ($)', 'Revenue ($)')
g.fig.suptitle('Spend vs Revenue by Region and Segment', y=1.02)
```

### Regression and Pair Plots

```python
# Regression with confidence interval
sns.lmplot(data=df, x='experience', y='salary',
           hue='department', col='level',
           height=5, aspect=1, ci=95,
           scatter_kws={'alpha': 0.5})

# Pair plot for multivariate exploration
sns.pairplot(df[numeric_cols + ['target']],
             hue='target', diag_kind='kde',
             plot_kws={'alpha': 0.4, 's': 20},
             palette='Set1')
```

## Plotly Interactive Charts

### Interactive Time Series with Range Selector

```python
import plotly.graph_objects as go

fig = go.Figure()

fig.add_trace(go.Scatter(
    x=df['date'], y=df['revenue'],
    mode='lines', name='Revenue',
    line=dict(color='#2563eb', width=2),
    fill='tozeroy', fillcolor='rgba(37,99,235,0.1)',
))

fig.add_trace(go.Scatter(
    x=df['date'], y=df['target'],
    mode='lines', name='Target',
    line=dict(color='#dc2626', width=2, dash='dash'),
))

fig.update_layout(
    title='Revenue vs Target',
    xaxis=dict(
        rangeselector=dict(buttons=[
            dict(count=7, label='1W', step='day'),
            dict(count=1, label='1M', step='month'),
            dict(count=3, label='3M', step='month'),
            dict(label='All', step='all'),
        ]),
        rangeslider=dict(visible=True),
    ),
    yaxis_title='Revenue ($)',
    hovermode='x unified',
    template='plotly_white',
)
```

### Interactive Dashboard Layout

```python
from plotly.subplots import make_subplots

fig = make_subplots(
    rows=2, cols=2,
    specs=[[{"type": "indicator"}, {"type": "indicator"}],
           [{"type": "xy"}, {"type": "domain"}]],
    subplot_titles=("", "", "Monthly Trend", "Category Breakdown"),
)

# KPI indicators
fig.add_trace(go.Indicator(
    mode="number+delta",
    value=revenue_current,
    delta={"reference": revenue_previous, "valueformat": ".1%"},
    title={"text": "Revenue"},
), row=1, col=1)

fig.add_trace(go.Indicator(
    mode="number+delta",
    value=customers_current,
    delta={"reference": customers_previous},
    title={"text": "Active Customers"},
), row=1, col=2)

# Trend line
fig.add_trace(go.Scatter(x=months, y=monthly_revenue, mode='lines+markers'),
              row=2, col=1)

# Pie chart
fig.add_trace(go.Pie(labels=categories, values=cat_revenue,
                      hole=0.4), row=2, col=2)

fig.update_layout(height=600, showlegend=False, template='plotly_white')
```

## D3.js Patterns

### Responsive Bar Chart

```javascript
function createBarChart(data, selector) {
  const margin = { top: 30, right: 20, bottom: 40, left: 60 };
  const container = d3.select(selector);
  const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(data.map(d => d.category))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value) * 1.1])
    .range([height, 0]);

  // Bars with transition
  svg.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.category))
    .attr("width", x.bandwidth())
    .attr("y", height)
    .attr("height", 0)
    .attr("fill", "#2563eb")
    .attr("rx", 4)
    .transition()
    .duration(800)
    .delay((d, i) => i * 100)
    .attr("y", d => y(d.value))
    .attr("height", d => height - y(d.value));

  // Axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y).ticks(6));
}
```

## Color Palette Guidelines

### Categorical Palettes (Up to 8 Categories)

```python
# Professional categorical palettes
palettes = {
    'default':  ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#0891b2', '#e11d48', '#4b5563'],
    'muted':    ['#6366f1', '#f43f5e', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'],
    'paired':   ['#2563eb', '#93c5fd', '#dc2626', '#fca5a5', '#16a34a', '#86efac', '#ca8a04', '#fde047'],
}
```

### Sequential and Diverging

```python
# Sequential: one-direction magnitude
# Use: heatmaps, choropleths, single-metric intensity
# matplotlib: 'Blues', 'Viridis', 'Plasma'

# Diverging: two-direction from midpoint
# Use: correlation matrices, change from baseline, sentiment
# matplotlib: 'RdBu_r', 'coolwarm', 'PiYG'
```

### Accessibility Rules

1. Never rely on color alone - add patterns, labels, or shapes
2. Test with colorblind simulation tools
3. Use colorblind-safe palettes (Viridis, Cividis, or Bang Wong palette)
4. Maintain minimum 3:1 contrast ratio against background
5. Limit categorical colors to 7 or fewer

## Design Principles Checklist

| Principle | Application |
|-----------|-------------|
| Data-ink ratio | Remove gridlines, borders, backgrounds that add no information |
| Pre-attentive attributes | Use color, size, position to highlight key insights |
| Gestalt principles | Group related elements, separate unrelated ones |
| Direct labeling | Label data points directly instead of using legends when possible |
| Consistent scales | Same metric should use same scale across panels |
| Zero baseline | Bar charts must start at zero; line charts may not need to |
| Title as insight | "Revenue grew 23% in Q4" not "Revenue by Quarter" |
| Annotation | Add context: events, thresholds, benchmarks |
| White space | Do not crowd the visualization; let it breathe |
| Sort meaningfully | Sort bars by value, not alphabetically |

## Export and Output Formats

```python
# High-resolution PNG for presentations
fig.savefig('chart.png', dpi=300, bbox_inches='tight',
            facecolor='white', transparent=False)

# SVG for web and further editing
fig.savefig('chart.svg', format='svg', bbox_inches='tight')

# PDF for print and LaTeX
fig.savefig('chart.pdf', format='pdf', bbox_inches='tight')

# Plotly: interactive HTML
fig.write_html('chart.html', include_plotlyjs='cdn')

# Plotly: static image (requires kaleido)
fig.write_image('chart.png', width=1200, height=800, scale=2)
```

## Common Visualization Mistakes

1. **Truncated y-axis on bar charts** - Distorts magnitude comparisons
2. **Too many colors** - More than 7 categories need a different approach
3. **3D charts** - Almost always worse than 2D alternatives
4. **Dual y-axes** - Easily misleading; use two aligned panels instead
5. **Pie charts for comparison** - Bar charts are nearly always more readable
6. **Rainbow color maps** - Perceptually non-uniform; use viridis or similar
7. **Missing units** - Always label axes with units
8. **Overplotting** - Use transparency, hexbin, or sampling for dense scatter plots
9. **Default styling** - Always customize beyond library defaults
10. **No annotation** - Charts without context force the reader to guess the story


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to data visualization artist
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Data Visualization Artist Analysis

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

**Input:** "Help me with data visualization artist for my current situation"

**Output:**

Based on your situation, here is a structured approach to data visualization artist:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
