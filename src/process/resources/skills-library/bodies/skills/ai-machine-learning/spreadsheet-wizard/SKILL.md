---
name: spreadsheet-wizard
description: |
  Advanced Excel and Google Sheets mastery covering lookup functions, pivot tables, conditional formatting, macros and Apps Script, data validation, dashboard creation, and financial modeling techniques for business analysis.
  Use when the user asks about spreadsheet wizard, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of spreadsheet wizard or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml beginner-friendly advanced javascript automation analysis performing-arts running"
  category: "ai-machine-learning"
  subcategory: "llm-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Spreadsheet Wizard


## When to Use

**Use this skill when:**
- User asks about spreadsheet wizard techniques or best practices
- User needs guidance on spreadsheet wizard concepts
- User wants to implement or improve their approach to spreadsheet wizard

**Do NOT use when:**
- The request falls outside the scope of spreadsheet wizard
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. What problem are you trying to solve? (Tracking, analysis, reporting, modeling, automation)
2. What data do you currently have? Where does it come from?
3. Who will use this spreadsheet? What is their skill level?
4. How large is the dataset? (100 rows, 10,000 rows, 1,000,000 rows)
5. Does this need to update automatically or is it a one-time analysis?
6. Are you using Excel (desktop), Excel Online, or Google Sheets?
7. Do you need to share this with others?
8. What outputs do you need? (Charts, reports, PDFs, dashboards)
9. Are there formulas or techniques you've tried that didn't work?
10. Is this a temporary analysis or a permanent business tool?

## Lookup Functions

### VLOOKUP

```
=VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])
Example: =VLOOKUP("John Smith", A2:E100, 4, FALSE)

Limitations: Can only look right, returns first match only,
column index breaks if columns inserted, slower on large datasets.
```

### INDEX-MATCH (Professional Default)

```
=INDEX(return_range, MATCH(lookup_value, lookup_range, 0))
Example: =INDEX(D2:D100, MATCH("EMP-042", A2:A100, 0))

Advantages: Looks any direction, doesn't break when columns change,
faster on large datasets, more flexible for complex lookups.
```

### XLOOKUP (Excel 365 / Google Sheets)

```
=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found])
Example: =XLOOKUP("John Smith", A2:A100, D2:D100, "Not Found")
Returns multiple columns: =XLOOKUP("John Smith", A2:A100, B2:E100)
```

### Decision Tree

Have Excel 365/Google Sheets? -> Use XLOOKUP. Need to look left? -> INDEX-MATCH. Quick simple lookup? -> VLOOKUP is fine.

### Advanced Patterns

**Multi-criteria:** `=INDEX(D2:D100, MATCH(1, (A2:A100="Sales")*(B2:B100="Q1"), 0))` (Ctrl+Shift+Enter in older Excel)
**All matching values:** `=FILTER(B2:B100, A2:A100="Sales")` (Google Sheets/Excel 365)

## Pivot Tables

### When to Use

Summarize large datasets, group/aggregate by categories, cross-tabulate dimensions, explore data without formulas, create interactive reports.

### Anatomy

```
Source: Flat table (one row per record, headers on every column, no merged cells)
Configuration: Rows (labels), Columns (headers), Values (calculations), Filters

Example: Rows=Region,Product | Columns=Quarter | Values=SUM(Sales) | Filter=Year=2024
```

### Value Calculations

| Calculation | Use Case |
|------------|----------|
| SUM | Total sales by region |
| COUNT | Number of transactions |
| AVERAGE | Average order size |
| % of Grand Total | Each region's share |
| Running Total | Year-to-date cumulative |
| Difference From | Change from previous period |

### Best Practices

Source data: flat table, no merged cells, no blank rows, consistent data types, no subtotals. Refresh after source changes. Use calculated fields for derived metrics.

## Conditional Formatting

**Color Scale:** Red-to-green heat map for numeric ranges.
**Data Bars:** Bar length proportional to value for visual comparison.
**Icon Sets:** Green check/yellow dash/red X for KPI status.

**Formula-Based Rules:**
```
Overdue items:    =AND(E2<TODAY(), F2<>"Complete")
Duplicates:       =COUNTIF($A$2:$A$100, A2)>1
Zebra striping:   =MOD(ROW(),2)=0
Row by cell value: =$E2="Urgent" (apply to $A2:$Z2)
```

**Tips:** Apply to data ranges not entire columns. Use `$` to lock references. Order matters (higher priority on top). Don't exceed 3 rules per area.

## Macros and Apps Script

### Excel VBA

**Record a macro:** Developer tab > Record Macro > Perform actions > Stop Recording > Assign to button/shortcut.

**Example -- Format Report:**
```vba
Sub FormatReport()
    Rows(1).Font.Bold = True
    Cells.EntireColumn.AutoFit
    Dim lastRow As Long
    lastRow = Cells(Rows.Count, 1).End(xlUp).Row
    Range("A1:F" & lastRow).Borders.LineStyle = xlContinuous
    Rows(2).Select
    ActiveWindow.FreezePanes = True
End Sub
```

### Google Apps Script

Access: Extensions > Apps Script. Uses JavaScript.

**Auto-timestamp on status change:**
```javascript
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  if (e.range.getColumn() === 4 && sheet.getName() === "Tasks") {
    sheet.getRange(e.range.getRow(), 5).setValue(new Date());
  }
}
```

**Custom function:**
```javascript
function SLUGIFY(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').trim();
}
// Use: =SLUGIFY(A1)
```

## Data Validation

| Type | Purpose | Example |
|------|---------|---------|
| List (dropdown) | Limit to options | Status: Open, In Progress, Closed |
| Number range | Valid numbers | Quantity: 1 to 1000 |
| Date range | Valid dates | Start date: after today |
| Custom formula | Complex rules | No duplicates in column |

**Dependent dropdowns:** Column A = Country dropdown. Column B = City dropdown filtered by Country. Google Sheets: `=FILTER(Cities!B:B, Cities!A:A = A2)`. Excel: `=INDIRECT(A2)` with named ranges.

**Best practices:** Dropdowns over free text. Set number formats. Add input/error messages. Protect formula cells. Use named ranges for validation lists.

## Dashboard Creation

### Principles

1. Every chart answers a specific question
2. Fits on one page (no scrolling)
3. Top-left for most important metrics
4. Consistent color meanings throughout
5. No 3D charts, minimal decoration
6. Interactive filters for drill-down

### Chart Selection

| Data Type | Best Chart |
|-----------|-----------|
| Trend over time | Line chart |
| Category comparison | Bar chart (horizontal) |
| Part of whole | Stacked bar or pie (max 5 slices) |
| Distribution | Histogram |
| Relationship | Scatter plot |
| KPI status | Number with comparison |

### Dynamic Dashboards

**Google Sheets QUERY:** `=QUERY(Data!A:F, "SELECT A, SUM(D) WHERE B = '"&$B$1&"' GROUP BY A", 1)` -- chart data filters when dropdown changes.

**Slicers:** Visual filter controls for pivot tables/charts. Insert > Slicer.

## Financial Models

### Revenue Forecast

```
Inputs: Starting MRR, Monthly growth rate, Churn rate
Formulas:
  New MRR = Beginning_MRR * Growth_Rate
  Churned MRR = Beginning_MRR * Churn_Rate
  Ending MRR = Beginning + New - Churned
  Next month Beginning = This month Ending
```

### Break-Even Analysis

```
Fixed costs / (Selling price - Variable cost per unit) = Break-even units
Use Data Table (What-If Analysis) for sensitivity across price points.
```

### Scenario Analysis

```
Three columns: Conservative | Base Case | Optimistic
Rows: Revenue, COGS, Gross Margin, OpEx, EBITDA, Margin %
Use dropdown to switch between scenarios. All formulas reference scenario assumptions.
```

## Essential Formula Reference

### Text
```
TRIM, PROPER, LEFT/RIGHT/MID, SUBSTITUTE, TEXTJOIN, LEN, SEARCH
```

### Date
```
TODAY, NOW, YEAR/MONTH/DAY, DATEDIF, EOMONTH, NETWORKDAYS, TEXT(date,"format")
```

### Logical
```
IF, IFS, SWITCH, AND/OR, IFERROR, ISBLANK
```

### Statistical
```
SUMIFS, COUNTIFS, AVERAGEIFS, UNIQUE, SORT, FILTER, PERCENTILE, RANK
```

## Common Pitfalls

1. **Not using tables/named ranges**: Raw references break when data grows
2. **Hardcoded values**: Put assumptions in labeled cells, reference those
3. **Volatile functions everywhere**: NOW(), INDIRECT() recalculate constantly
4. **No documentation**: Add a README sheet explaining the workbook
5. **Mixing data and presentation**: Raw data on one sheet, analysis on another
6. **Merged cells**: Break sorting, filtering, formulas, and pivots -- avoid them
7. **Not locking formula cells**: Users overwrite critical formulas
8. **Building everything in one sheet**: Use separate sheets for data, calculations, dashboards


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to spreadsheet wizard
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Spreadsheet Wizard Analysis

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

**Input:** "Help me with spreadsheet wizard for my current situation"

**Output:**

Based on your situation, here is a structured approach to spreadsheet wizard:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
