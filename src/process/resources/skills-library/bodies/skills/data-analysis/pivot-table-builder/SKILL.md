---
name: pivot-table-builder
description: |
  Builds a pivot table specification from a described dataset. Determines field placement (rows, columns, values, filters), aggregation function selection, grouping rules, and formatting instructions. Output is the exact setup configuration.
  Use when the user needs to summarize data by categories, create cross-tabulations, or build summary tables from detailed records.
  Do NOT use for lookup formulas (use excel-lookup-formulas), data cleaning (use spreadsheet-data-cleaning), or chart creation (use chart-type-selector).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "spreadsheets data-visualization analysis"
  category: "data-analysis"
  subcategory: "spreadsheets"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Pivot Table Builder

## When to Use

**Use this skill when:**
- The user wants to summarize a flat dataset by one or more categorical dimensions -- for example, total sales by region, average ticket resolution time by team and priority, headcount by department and job grade, or defect rate by product line and factory shift
- The user asks for a "cross-tab," "summary table," "breakdown by," or "how many/how much per [category]" -- all of these map to pivot table logic
- The user wants to compare the same metric across two dimensions simultaneously -- for example, revenue by both product category (rows) and sales channel (columns), creating a matrix view
- The user needs to group continuous data into summary buckets -- date fields grouped into months, quarters, or fiscal years; numeric scores grouped into ranges (0--25, 26--50, etc.)
- The user wants an interactive, re-filterable summary where they can slice by one or more fields without rebuilding the table (filter by region, then by rep, then by product)
- The user has a table of transactional records (orders, tickets, calls, transactions) and wants to see aggregate performance metrics rolled up to a category level
- The user wants to calculate percentage-of-total breakdowns, running totals, or rank metrics derived from a raw dataset

**Do NOT use when:**
- The user needs to look up a specific value from a reference table using a key -- use the `excel-lookup-formulas` skill instead (VLOOKUP, INDEX/MATCH, XLOOKUP)
- The user's data is messy and needs deduplication, type conversion, or structural repair before summarizing -- use `spreadsheet-data-cleaning` first, then return to this skill
- The user's primary goal is to produce a chart or graph rather than a summary table -- build the pivot table first, then hand off to `chart-type-selector` for visualization guidance
- The user needs to build a multi-component interactive dashboard with slicers, KPI cards, and linked charts -- use `dashboard-design` after establishing the underlying pivot tables
- The user wants a calculated field that requires row-level logic across multiple source columns before aggregation -- that transformation belongs in `spreadsheet-data-cleaning` or a helper column before the pivot is built
- The user is working with OLAP cubes, Power BI datasets, or SQL databases directly -- those environments have their own query/aggregation paradigms that exceed spreadsheet pivot scope
- The data is already aggregated (the source rows are already sums or averages) -- building a pivot on pre-aggregated data double-aggregates and produces incorrect results; surface this to the user immediately

---

## Process

### Step 1: Clarify the Summary Question and Source Data

Before touching field placement, extract the exact analytical question. This prevents building the wrong pivot table perfectly.

- Ask: "What decision or question will this table answer?" The answer should be a single sentence: "Which regions are underperforming revenue targets by quarter?" or "What is the average handle time per agent by call type?"
- Confirm the source data structure: column names, data types (date, numeric, text, boolean), approximate row count, and whether it lives in a single flat table or spans multiple sheets
- Identify whether the data is transaction-level (one row per event) or already partially aggregated (one row per day per product) -- this changes which aggregation functions are appropriate
- Check for a date column: if one exists, confirm whether it is stored as a true date value (Excel serial number or ISO date) or as text ("Jan-23", "2023-01-15", "20230115") -- text dates break date grouping entirely
- Confirm whether the user wants a static snapshot (paste values after) or a dynamic, refreshable pivot that they will update as new data arrives
- If row count exceeds 100,000 rows and the user is on Excel, recommend enabling the Data Model option when creating the pivot -- this dramatically improves performance and unlocks Distinct Count

---

### Step 2: Map the Summary Question to the Four Pivot Areas

Every element of a pivot table falls into exactly one of four areas. Use this deterministic logic to assign each field:

**Rows area -- the primary grouping dimension:**
- The field the user says "by [field]" or "per [field]" -- "by region," "per salesperson"
- Use the field with fewer unique values as the outer (first) row when nesting -- Region (5 values) wraps around City (50 values), not the reverse
- Do not place a field with more than 200 unique distinct values in the Rows area without first recommending grouping -- a 500-row pivot table defeats the purpose of summarizing
- If the user wants two levels of row grouping (e.g., Region then City), nest them: drag Region first, then City below it in the Rows zone

**Columns area -- the cross-tabulation dimension:**
- Use this area only when the user needs a matrix view (metric at the intersection of two dimensions)
- The ideal column field has 2--7 unique values: Quarter (4), Status (3), Product Category (5--6)
- Never place a date field directly in Columns without grouping it first -- raw dates produce one column per day (potentially hundreds)
- If the field has more than 10 unique values and grouping is not possible, move it to Rows instead and eliminate the Columns area entirely -- a long narrow table is more readable than a wide unreadable one

**Values area -- the measures to aggregate:**
- Every field here requires an explicit aggregation function -- never accept the default without verifying it matches the data type and intent
- Multiple value fields are fine (Revenue + Quantity + Margin%) -- each becomes a separate column within each group
- Currency fields: SUM is almost always correct for totals; AVERAGE only if analyzing unit economics
- Rate/ratio fields (conversion rate, error %, margin %): AVERAGE is correct; SUM is always wrong and will produce nonsensical values exceeding 100%
- Count fields: use COUNT (counts numeric cells) for numeric IDs, COUNTA for text IDs, and Distinct Count (Data Model only) for unique entity counts

**Filters area -- the interactive slicers:**
- Place here any field the user wants to use to narrow the dataset interactively without changing the row/column structure
- Slicers (Insert > Slicer in Excel) are more user-friendly than filter dropdowns for dashboards; recommend them when the user mentions "easy to switch between"
- Do not overcrowd the Filters area -- if the user lists more than 4 filter fields, ask which 2--3 are most frequently needed and move the rest to Row nesting

---

### Step 3: Select and Validate Aggregation Functions

This is the step most users get wrong. Enforce it rigorously.

| Value Field Characteristics | Required Aggregation | Common Mistake to Prevent |
|---|---|---|
| Revenue, Cost, Units Sold, Hours, Quantity | SUM | Using COUNT because the field is text-formatted |
| Price per unit, Score, Rate, Time (average makes sense) | AVERAGE | Using SUM -- summing prices produces meaningless totals |
| Conversion %, Margin %, Error Rate | AVERAGE | Summing percentages -- produces values over 100% and is statistically incorrect |
| Record existence (counting transactions, tickets, orders) | COUNT or COUNTA | Using SUM on a numeric ID column -- produces ID totals, not counts |
| Unique customer count, distinct order count | Distinct Count (Data Model) | Using COUNT -- counts all rows, not unique entities |
| Earliest/Latest date in a group | MIN (first date) or MAX (last date) | Averaging dates -- the result is mathematically valid but analytically useless |
| Budget vs Actual (variance analysis) | SUM for both, then Calculated Field for difference | Manually computing outside the pivot -- breaks when refreshed |

To set the aggregation in Excel: drag field to Values area > right-click the value in the pivot > Value Field Settings > select function. In Google Sheets: click the value field chip in the pivot editor > Summarize by > select function.

If the user needs a ratio not present in the source data (e.g., Revenue per Unit = Revenue / Quantity), use a **Calculated Field** rather than a helper column. In Excel: PivotTable Analyze tab > Fields, Items & Sets > Calculated Field > define the formula using source field names. Calculated Fields apply before aggregation, which is correct for most ratio calculations.

---

### Step 4: Define Grouping Rules for Dates and Numbers

Grouping converts granular values into meaningful summary buckets. Get the settings exactly right.

**Date field grouping:**
- Always confirm the fiscal year start before choosing grouping: a company with a fiscal year starting April 1 needs FY quarters, not calendar quarters -- standard Excel grouping cannot do this natively, requiring a helper column: `=CHOOSE(MONTH(A2),4,4,4,1,1,1,2,2,2,3,3,3)` to assign fiscal quarter numbers
- For calendar grouping in Excel: right-click any date cell in the pivot table body (not the header) > Group > select one or more of: Days, Months, Quarters, Years. Selecting Months + Years creates a hierarchy (2023 > January, February...). Selecting only Months collapses all years into Jan, Feb... (useful for seasonal analysis, dangerous if data spans multiple years)
- Google Sheets auto-groups dates -- click the date row/column chip > Date bucket type > choose Day, Week, Month, Quarter, or Year
- If the date field is stored as text, grouping fails silently -- the field will appear in the Rows area as individual text strings. Diagnose this: if all dates appear as individual rows rather than grouped buckets, the field is text. Fix before proceeding (refer to `spreadsheet-data-cleaning`)

**Numeric field grouping:**
- Use for: age ranges, score bins, price tiers, revenue buckets
- Right-click any numeric cell in the pivot > Group > set Starting at (minimum), Ending at (maximum), By (interval width)
- Choose interval widths that produce 5--12 buckets for readability: a 0--100 score field in intervals of 10 produces 10 buckets (ideal); intervals of 1 produce 100 rows (defeats the purpose)
- If the numeric field contains blanks, Excel will refuse to group and show an error -- blanks must be filled (with 0 or a sentinel value) before grouping works

**Text field consolidation:**
- When a text dimension has 50+ unique values (e.g., 200 product SKUs), grouping is not built into pivot tables -- instead, add a helper column to the source data mapping each SKU to a parent category, then use the helper column as the Row field
- Alert the user explicitly: "Your [field] has [N] unique values. I recommend adding a Category column to your source data that maps these to broader groups before building the pivot."

---

### Step 5: Specify "Show Values As" Calculations

Beyond raw aggregations, pivot tables can compute derived metrics automatically using the "Show Values As" setting. These are applied after aggregation and do not require calculated fields.

| Analytical Goal | Show Values As Setting | When to Use |
|---|---|---|
| What percent of total does each category represent? | % of Grand Total | Market share analysis, budget allocation review |
| What percent of each row does each column represent? | % of Row Total | Conversion funnel, distribution across channels |
| What percent of each column does each row represent? | % of Column Total | Team contribution within each quarter |
| Cumulative running total over time | Running Total In (select date field) | YTD revenue, cumulative spend |
| Rank each row by value | Rank Largest to Smallest | Leaderboard tables, territory rankings |
| How does each value compare to a specific base item? | % Difference From (select base) | Month-over-month change, vs. prior year |

In Excel: right-click any value cell > Show Values As > select the option. In Google Sheets: click the value chip > Show as > select option.

**Critical constraint:** "Show Values As" and a raw number in the same measure require adding the same field twice to the Values area -- once showing raw values and once showing the derived calculation. Instruct the user to drag the field into Values twice and apply different settings to each copy.

---

### Step 6: Write the Complete Field Placement Specification

Produce the full pivot table specification document following the Output Format exactly. Include:
- Every field in the source data accounted for (assigned to an area or explicitly noted as unused)
- The exact aggregation function for every Values field
- All grouping rules with step-by-step menu paths
- Number formats using Excel format codes (not just descriptions)
- Sort order and direction for the primary row dimension
- The expected output preview table with illustrative numbers
- Parallel setup instructions for both Excel and Google Sheets

---

### Step 7: Anticipate Refresh and Maintenance Needs

A pivot table that breaks on next month's data update wastes the user's work.

- Remind the user to define the source range as a named Table (Excel: select data > Insert > Table, or Ctrl+T) -- Tables expand automatically when rows are added, and the pivot will pick up new data on refresh without range adjustment
- In Excel, refresh the pivot: right-click inside pivot > Refresh, or PivotTable Analyze > Refresh All. In Google Sheets, pivot tables refresh automatically when source data changes
- If the user adds new columns to the source data after creating the pivot, they must go to PivotTable Analyze > Change Data Source and update the range to include the new columns -- named Tables handle this automatically
- For scheduled data updates (daily exports), instruct the user to paste new data starting at row 2 (overwriting old data, keeping the header row intact) so the named Table range stays stable
- Warn: if the user renames a source column after building the pivot, calculated fields referencing that column will break silently and show errors

---

### Step 8: Validate the Specification Against Common Failure Modes

Before finalizing, run this checklist:

- [ ] No percentage/rate field has SUM as its aggregation
- [ ] The Columns area field has 10 or fewer unique values
- [ ] Any date field in Rows or Columns has an explicit grouping rule specified
- [ ] Nested row fields are ordered from broadest to most granular
- [ ] Multiple value fields are disambiguated (Revenue and Quantity renamed to "Sum of Revenue" and "Sum of Qty" to avoid confusion)
- [ ] Grand Totals are enabled for both rows and columns (they serve as a cross-check)
- [ ] Blank cells in grouping fields are flagged and a remediation recommendation is given
- [ ] The source range extends to the last row of actual data, not a fixed range that will become stale

---

## Output Format

```
## Pivot Table Specification

### Summary Question
[One-sentence statement of the business or analytical question this pivot table answers]

### Source Data
- **Application:** [Excel / Google Sheets / LibreOffice Calc]
- **Range:** [Sheet name and range, e.g., Sales_Data!A1:H12450, or named Table: SalesTable]
- **Table format:** [Flat transaction-level / Partially aggregated / Unknown]
- **Available fields:** [Field Name (Data Type)] for each column
  - Example: Date (date), Region (text), Product (text), Revenue (currency), Quantity (integer)
- **Row count:** [N rows of data, not counting header]
- **Data quality notes:** [Any blanks, text-formatted dates, or pre-aggregated values flagged here]

---

### Field Placement

| Area | Field Name | Aggregation / Role | Notes |
|------|-----------|-------------------|-------|
| Rows | [Field] | Group by | [Distinct value count; nesting order if multiple] |
| Rows (nested) | [Field] | Sub-group by | [Place below the primary Row field] |
| Columns | [Field] | Cross-tabulate by | [Unique value count; grouping rule if date/number] |
| Values | [Field] | [SUM / AVERAGE / COUNT / COUNTA / MIN / MAX / Distinct Count] | [Rationale for function choice] |
| Values | [Field] | [SUM / AVERAGE / COUNT] | [Rename to: "Descriptive Label"] |
| Filters | [Field] | Slice/filter | [Recommended as Slicer for interactivity] |
| Unused | [Field] | Not used in this pivot | [Reason; available for drill-down if needed] |

---

### Grouping Rules

| Field | Area | Grouping Type | Exact Setting |
|-------|------|--------------|---------------|
| [Date field] | Columns | Date grouping | Right-click date cell in pivot > Group > check: [Months] [Quarters] [Years] |
| [Number field] | Rows | Numeric range | Right-click number cell > Group > Starting at: [N], Ending at: [N], By: [interval] |
| [Text field] | Rows | Helper column mapping | Add column [ColName] to source: maps [original values] to [N broader categories] |

---

### Value Formatting

| Value Field | Display Name | Excel Format Code | Show Values As | Sort |
|-------------|-------------|-------------------|----------------|------|
| Sum of Revenue | Revenue | $#,##0 | Default (raw values) | Descending -- largest first |
| Sum of Quantity | Units Sold | #,##0 | Default | -- |
| Average of Margin% | Avg Margin | 0.0% | % of Column Total | -- |
| Count of Order_ID | Orders | #,##0 | Default | -- |

*To apply format code in Excel: right-click value in pivot > Number Format > Custom > paste code*

---

### Calculated Fields (if needed)

| Field Name | Formula | Purpose |
|-----------|---------|---------|
| Revenue per Unit | = Revenue / Quantity | Unit economics metric not in source data |
| [Field Name] | = [Field1] -- [Field2] | [Description] |

*To add in Excel: PivotTable Analyze tab > Fields, Items & Sets > Calculated Field > Name + Formula*

---

### Setup Steps -- Excel

1. **Convert source data to a Table:** Select any cell in data > Ctrl+T > confirm range > OK. Rename table to [TableName] in the Table Design tab.
2. **Insert PivotTable:** Click inside the Table > Insert > PivotTable > choose New Worksheet (or Existing Worksheet + target cell) > [If Distinct Count needed: check "Add this data to the Data Model"] > OK
3. **Build the Row hierarchy:** In the PivotTable Fields pane, drag [Field1] to the Rows area first, then drag [Field2] below it for nesting.
4. **Add Columns field:** Drag [Field] to the Columns area.
5. **Group the date/number column:** Right-click any value cell in the [Date/Number] column > Group > [specific settings above] > OK
6. **Add Value fields:** Drag [Field] to Values area. If it defaults to COUNT instead of SUM, right-click the value in the pivot > Value Field Settings > Sum > OK. Rename by changing "Custom Name" field.
7. **Set Show Values As:** Right-click a value cell > Show Values As > [setting] (only if a derived calculation is needed)
8. **Add Filter/Slicer:** Drag [Field] to Filters area. OR: click inside pivot > PivotTable Analyze > Insert Slicer > check [Field] > OK
9. **Apply number formatting:** Right-click any cell in the value column > Number Format > Custom > enter format code from table above
10. **Set sort order:** Right-click any row label cell > Sort > Sort Largest to Smallest (by [Value Field])
11. **Verify Grand Totals:** PivotTable Design tab > Grand Totals > On for Rows and Columns
12. **Refresh:** PivotTable Analyze > Refresh (or right-click > Refresh) to confirm data loads correctly

---

### Setup Steps -- Google Sheets

1. Select the data range including headers.
2. Insert > Pivot table > select New sheet > Create
3. In the Pivot table editor: Add **[Field]** as a Row > [if relevant: uncheck "Show totals" for sub-rows; check Order: Descending, Sort by: [Value Field]]
4. Add **[Field]** as a Column > Date bucket type: [Quarter/Month/Year] (for date fields)
5. Add **[Field]** as a Value > Summarize by: [SUM/AVERAGE/COUNT] > Show as: [Default/% of row/% of column/Running total]
6. Add **[Field]** as a Filter > [set condition if needed]
7. Format the value columns: select the value cells > Format > Number > [Custom number format] > enter format code

*Note: Google Sheets does not support Distinct Count natively or Calculated Fields with division. For Distinct Count, use a COUNTUNIQUE formula in a separate summary table.*

---

### Expected Output Preview

| [Row Label] | [Col Value 1] | [Col Value 2] | [Col Value 3] | Grand Total |
|-------------|--------------|--------------|--------------|-------------|
| [Category A] | [value] | [value] | [value] | [row total] |
| [Category B] | [value] | [value] | [value] | [row total] |
| [Category C] | [value] | [value] | [value] | [row total] |
| **Grand Total** | **[col total]** | **[col total]** | **[col total]** | **[grand total]** |

*Values shown are illustrative. Verify Grand Total column matches source data total for the measure.*

---

### Maintenance Notes
- [Named Table or static range -- refresh instructions]
- [How to add new data and refresh]
- [Any fields to watch for data quality degradation]
```

---

## Rules

1. **ALWAYS specify the aggregation function explicitly** -- Excel defaults to COUNT when the value field contains any text or blank cells, and to SUM when all values are numeric. These defaults are frequently wrong (e.g., a numeric Order ID field should be COUNTed, not SUMmed). State the function and the rationale for every single Values field, no exceptions.

2. **NEVER assign SUM to a rate, ratio, or percentage field** -- Summing a "Conversion Rate" or "Margin %" column produces values exceeding 100% and is statistically incoherent. If the source field is a percentage or ratio, use AVERAGE. If the user needs a weighted average (average margin weighted by revenue), they need a Calculated Field or a helper column -- flag this explicitly and explain the difference.

3. **Enforce the 10-unique-value limit for the Columns area** -- A pivot table with 15+ column values is unreadable without horizontal scrolling. If the candidate column field exceeds 10 unique values, recommend either (a) moving it to a nested Row field, (b) grouping it into fewer buckets, or (c) adding it to the Filters area instead. Provide the specific count of unique values to make the tradeoff concrete.

4. **Always provide the exact right-click menu path for date grouping** -- "Group dates" is ambiguous. The correct Excel path is: click a cell in the date row/column inside the pivot table body (not the header, not the source data) > right-click > Group > check the desired time levels > OK. Right-clicking the wrong cell (source data, header, or a non-date value cell) will not show the Group option.

5. **Diagnose text-formatted dates before specifying grouping** -- If the user describes a date field that "won't group" or if the source data shows dates stored as "Jan-23" or "20230115" (strings), the Group menu option will be grayed out. Do not provide grouping instructions without confirming date type. Provide the conversion formula and refer to `spreadsheet-data-cleaning` before proceeding.

6. **Warn about blank cells in any Rows or Columns field** -- Blanks appear as a literal "(blank)" bucket in the pivot, inflating the row count and confusing users. Always recommend filling blanks before building the pivot. For text fields, fill with "Unknown" or "Unassigned." For numeric fields, fill with 0 or flag as a data quality issue.

7. **Order nested Row fields from broadest to most granular** -- Region before City, Year before Month, Department before Employee. Placing the granular field first creates a deeply nested structure that buries the summary. If the user has the order wrong, correct it explicitly and explain why.

8. **Recommend named Tables (Ctrl+T) for all source data before creating any pivot** -- A pivot table pointing to a named Table automatically picks up new rows when refreshed. A pivot pointing to a static range (e.g., A1:F500) silently excludes new rows beyond row 500. This is one of the most common causes of stale pivot tables in production use. Always include this as the first setup step.

9. **Always include an Expected Output Preview with realistic illustrative values** -- An abstract field-placement diagram does not help the user verify their result. The preview table with plausible numbers lets the user confirm their pivot is structured correctly before they start interpreting real data. Label all values as illustrative.

10. **Never place the same source field in both Rows and Filters simultaneously** -- While technically possible, a field used as a Row grouping that is also a filter creates confusion: filtering on "Region = West" while Region is also a Row dimension produces a one-row pivot with a misleading filter. If the user requests this, ask whether they want to filter the data before summarizing (Filters area) or show all values and highlight one (conditional formatting, separate approach).

11. **Flag pre-aggregated source data immediately** -- If the user's source data already has one row per [category] [period] with pre-summed values, building another pivot will double-aggregate (SUM of SUMs). This produces correct totals only if every cell is present with no nulls, but is architecturally incorrect and fragile. Recommend either working with the pre-aggregated table directly using regular formulas, or obtaining the underlying transaction-level data.

12. **For calculated ratios, use Calculated Fields, not helper columns, when working within a pivot** -- A helper column in the source data that computes Revenue/Quantity will be aggregated (SUMmed or averaged) by the pivot, producing the wrong result. A pivot Calculated Field defined as = Revenue / Quantity divides the aggregated Revenue by the aggregated Quantity, which is the correct unit economics calculation. Explain this distinction when the user needs a derived metric.

---

## Edge Cases

### Distinct Count (Counting Unique Entities)
Standard pivot COUNT aggregates all rows, including duplicates. A user who wants "how many unique customers placed orders in each region" will get the wrong answer with COUNT. In Excel 365 with the Data Model: when inserting the pivot, check "Add this data to the Data Model" on the creation dialog > drag Customer_ID to Values > right-click > Value Field Settings > Distinct Count. In Excel 2016+ without Data Model: create a helper column in the source data with the formula `=IF(COUNTIFS($A$2:A2, A2, $C$2:C2, C2) = 1, 1, 0)` (where A is Customer_ID and C is Region) and SUM this helper column in the pivot. In Google Sheets: Distinct Count is available natively in the value chip > Summarize by > COUNTUNIQUE.

### Fiscal Year Grouping (Non-Calendar Year)
Excel's built-in date grouping always uses calendar quarters (Jan--Mar = Q1). For a company whose fiscal year starts on April 1 (FY Q1 = Apr--Jun), built-in grouping is incorrect. Solution: add two helper columns to the source data before creating the pivot. Fiscal Quarter: `=CHOOSE(MONTH(A2),4,4,4,1,1,1,2,2,2,3,3,3)` returns 1--4 in fiscal order. Fiscal Year: `=IF(MONTH(A2)>=4, YEAR(A2), YEAR(A2)-1)` returns the fiscal year label. Use these helper columns as the Column and/or Row fields instead of the raw date field. Do not use built-in date grouping at all. Flag this to the user any time they mention "fiscal year," "FY," or a fiscal calendar.

### Multiple Value Fields Displaying Incorrectly
When two or more fields are in the Values area, Excel creates a virtual "Values" field in the Columns area, displaying each value metric as a sub-column within each column group. This is correct behavior but surprises users who expect separate rows. If the user wants the metrics stacked as rows rather than split as sub-columns: drag the "Values" chip from the Columns zone to the Rows zone in the PivotTable Fields pane. This produces a layout where each Row group has sub-rows for each metric (Revenue, then Quantity, then Margin under each Region) rather than side-by-side columns.

### Source Data Spanning Multiple Sheets or Files
A single pivot table can only reference one contiguous data range or one named Table. If the user's data is split across multiple sheets (Jan on Sheet1, Feb on Sheet2, March on Sheet3), they must consolidate into one flat table before building the pivot. Options: (a) copy all sheets below each other into one sheet manually; (b) use Power Query (Excel: Data > Get Data > From Table/Range, then Append Queries) to combine and load into a single table; (c) use a VSTACK formula (Excel 365): `=VSTACK(Sheet1!A2:F100, Sheet2!A2:F100, Sheet3!A2:F100)` pasted into a new sheet, then build the pivot on that. Refer to `spreadsheet-data-cleaning` for Power Query consolidation if the user is unfamiliar with it.

### Too Many Unique Row Values (Long Pivot Problem)
A pivot table with 300+ row values defeats the summarization purpose. Diagnose by asking: "What does each row represent in your source data?" If rows correspond to individual SKUs, employee IDs, or ZIP codes, the user needs a parent grouping. Resolution path: (1) identify a hierarchical parent field that already exists in the source data (e.g., Product Category for SKUs, Department for Employee IDs, City for ZIP codes) and use that as the Row field instead; (2) if no parent field exists, add one as a helper column using IF/IFS/VLOOKUP mapping logic; (3) for numeric fields, use numeric range grouping (right-click > Group). Target 5--20 row values for a readable summary table.

### Refreshing a Pivot Table Breaks Calculated Fields
When the user adds a Calculated Field that references a source column by name, and then the source column is renamed or deleted, the Calculated Field shows "#NAME?" or "#REF!" errors throughout the pivot. This error propagates invisibly -- the pivot still appears to refresh without warning. Prevent this by (1) using named Tables so column references are stable; (2) documenting all Calculated Field formulas in a comment or notes cell outside the pivot; (3) after any source data restructuring, immediately verify the pivot refreshes cleanly. If the user encounters this error, they must delete the broken Calculated Field (PivotTable Analyze > Fields, Items & Sets > Calculated Field > select > Delete) and re-create it with the corrected column name.

### Google Sheets Pivot Limitations Compared to Excel
Users switching from Excel will encounter these gaps in Google Sheets: (1) No Calculated Fields with division -- Sheets supports basic arithmetic Calculated Fields but division between two source fields does not work reliably; use a helper column in the source data instead; (2) No Distinct Count on a specific combination of fields -- COUNTUNIQUE counts distinct values in the value field alone, not in combination with another field; (3) No numeric range grouping -- Sheets cannot group a numeric field into bins the way Excel can; add a helper column using IFS to assign bin labels; (4) No "Show Values As: Rank" -- must compute rank outside the pivot; (5) Date grouping is automatic and less configurable for fiscal periods. When the user is on Sheets and needs any of these features, provide the workaround approach rather than the Excel path.

### Pivot Table Showing Incorrect Totals (Grand Total Mismatch)
If the Grand Total row in the pivot does not match a SUMIF or manual sum of the source data, the most common causes are: (1) the source range is too small and excludes some rows -- verify by comparing COUNT in pivot to row count in source; (2) filters are active in the source data range (the data has active Excel AutoFilter rows hidden) -- pivot tables on filtered ranges only see visible rows; remove all filters from the source before creating the pivot; (3) the data contains duplicate rows that inflate the total unexpectedly -- verify with a COUNTIFS check; (4) a Calculated Field is summing values that are already being aggregated, resulting in double-counting. Walk through each of these checks systematically and correct the root cause before proceeding.

---

## Example

**Input:** "I manage a SaaS support team. I have a tickets dataset with these columns: Ticket_ID (text), Created_Date (date), Closed_Date (date or blank if open), Agent_Name (text), Team (text -- Tier1 or Tier2), Category (text -- Billing, Technical, Account, Onboarding), Priority (text -- Low, Medium, High, Critical), Resolution_Time_Hours (number -- blank if still open), CSAT_Score (number 1--5 -- blank if no response). About 18,000 rows covering 2 years. I want to see average resolution time and average CSAT by team and category, with the ability to filter by quarter and by priority."

---

**Output:**

## Pivot Table Specification

### Summary Question
What is the average resolution time and average CSAT score for each combination of support team (Tier1/Tier2) and ticket category (Billing, Technical, Account, Onboarding), and how do these metrics vary when filtered by quarter or priority level?

### Source Data
- **Application:** Excel (recommended; Google Sheets notes provided at the end)
- **Range:** Convert to named Table first. Select A1 through last row > Ctrl+T > Name the table **SupportTickets** in the Table Design tab.
- **Table format:** Transaction-level (one row per ticket)
- **Available fields:**
  - Ticket_ID (text)
  - Created_Date (date -- confirm true date format, not text)
  - Closed_Date (date or blank -- blanks = open tickets)
  - Agent_Name (text -- high cardinality, ~40 agents)
  - Team (text -- 2 unique values: Tier1, Tier2)
  - Category (text -- 4 unique values: Billing, Technical, Account, Onboarding)
  - Priority (text -- 4 unique values: Low, Medium, High, Critical)
  - Resolution_Time_Hours (numeric -- blank when ticket is still open)
  - CSAT_Score (numeric 1--5 -- blank when no survey response received)
- **Row count:** ~18,000 rows
- **Data quality notes:**
  - Resolution_Time_Hours is blank for open tickets -- AVERAGE will correctly ignore blanks, but COUNT-based metrics will count open tickets unless you filter them. Add a slicer on Closed_Date (is not blank) or create a helper column: `=IF(ISBLANK(H2),"Open","Closed")` in column J, label it Ticket_Status, and add it as a filter.
  - CSAT_Score blanks (no survey response) will be excluded from AVERAGE automatically -- this is correct behavior (you are averaging scores that were received, not treating non-responses as 0).
  - Confirm Created_Date is a true date: in any blank cell type `=ISNUMBER(B2)` -- if FALSE, the dates are stored as text and grouping will fail. Refer to `spreadsheet-data-cleaning` for conversion.

---

### Field Placement

| Area | Field Name | Aggregation / Role | Notes |
|------|-----------|-------------------|-------|
| Rows | Team | Group by | 2 unique values (Tier1, Tier2) -- broadest grouping |
| Rows (nested) | Category | Sub-group by | 4 unique values -- place below Team in Rows zone |
| Values | Resolution_Time_Hours | AVERAGE | Average handle time per team/category combination. Do NOT use SUM -- summed hours are meaningless for performance analysis |
| Values | Resolution_Time_Hours (second copy) | COUNT | Count of resolved tickets (blanks excluded) -- drag the field into Values twice; rename second copy "Resolved Tickets" |
| Values | CSAT_Score | AVERAGE | Average satisfaction score. Do NOT use SUM -- summed CSAT scores are not interpretable |
| Filters | Created_Date (grouped by Quarter) | Slice by time period | Add as Slicer for easy quarter switching |
| Filters | Priority | Slice by urgency level | Add as Slicer; 4 values (Low, Medium, High, Critical) |
| Unused | Ticket_ID | Not used | Available for Distinct Count if unique ticket count needed (requires Data Model) |
| Unused | Agent_Name | Not used in this pivot | High cardinality (~40 values) -- build a separate pivot by Agent if agent-level drill-down needed |
| Unused | Closed_Date | Not used | Consider as a secondary filter if open/closed segmentation is needed |

---

### Grouping Rules

| Field | Area | Grouping Type | Exact Setting |
|-------|------|--------------|---------------|
| Created_Date | Filters (Slicer) | Date grouping | Right-click any date cell inside the pivot > Group > check **Quarters** and **Years** > OK. The slicer will then show Q1 2023, Q2 2023, etc. |
| Priority | Filters (Slicer) | No grouping needed | 4 text values -- use as-is; recommend ordering slicer items: Critical, High, Medium, Low |
| Resolution_Time_Hours | Values | No grouping | Used as AVERAGE -- numeric grouping not applicable here |

*Note: If you add a separate "Resolution Time Distribution" pivot later, you can group Resolution_Time_Hours into ranges: 0--24 hrs, 25--48 hrs, 49--72 hrs, 73--120 hrs, 120+ hrs using right-click > Group > Starting at: 0, Ending at: 500, By: 24.*

---

### Value Formatting

| Value Field | Display Name | Excel Format Code | Show Values As | Sort |
|-------------|-------------|-------------------|----------------|------|
| Average of Resolution_Time_Hours | Avg Resolution (hrs) | #,##0.0 | Default (raw hours) | Descending within each Team group -- longest resolution time at top |
| Count of Resolution_Time_Hours | Resolved Tickets | #,##0 | Default | -- |
| Average of CSAT_Score | Avg CSAT | 0.00 | Default (1.00 -- 5.00 scale) | Ascending within each Team group -- lowest CSAT at top (flag underperformers) |

*To rename a value field: right-click value in pivot > Value Field Settings > change "Custom Name" field at the top*

---

### Calculated Fields (if needed)

| Field Name | Formula | Purpose |
|-----------|---------|---------|
| CSAT Response Rate | = CSAT_Score / Ticket_ID | Cannot be done correctly as a Calculated Field -- see note below |

**Important note on CSAT Response Rate:** The ratio of tickets with a CSAT response to total tickets cannot be correctly computed as a pivot Calculated Field because the numerator requires counting non-blank CSAT values while the denominator requires counting all tickets. This is best handled with COUNTIF/COUNTIFS formulas outside the pivot referencing the pivot's summary values, or with a helper column in the source: `=IF(ISBLANK(I2), 0, 1)` labeled CSAT_Received, then SUM this in the pivot and divide by the Count of Ticket_ID in a separate formula cell.

---

### Setup Steps -- Excel

1. **Create the named Table:** Click any cell in your data > Ctrl+T > confirm range covers all 18,000 rows plus header row 1 > OK. In the Table Design tab, rename it **SupportTickets**.
2. **Insert PivotTable with Data Model:** Click inside SupportTickets > Insert > PivotTable > New Worksheet > check **"Add this data to the Data Model"** (enables Distinct Count and improves performance on 18K rows) > OK.
3. **Build the Row hierarchy:** In the PivotTable Fields pane, drag **Team** to the Rows area. Then drag **Category** below Team in the Rows area (must be below, not above, for correct nesting).
4. **Add Value fields -- Resolution Time:** Drag **Resolution_Time_Hours** to the Values area. Right-click the resulting value in the pivot > Value Field Settings > Summarize Value Field By: **Average** > Custom Name: **Avg Resolution (hrs)** > OK. Then drag **Resolution_Time_Hours** into the Values area a second time > Value Field Settings > Summarize by: **Count** > Custom Name: **Resolved Tickets** > OK.
5. **Add Value field -- CSAT:** Drag **CSAT_Score** to the Values area > Value Field Settings > Summarize by: **Average** > Custom Name: **Avg CSAT** > OK.
6. **Apply number formats:** Right-click any cell in the "Avg Resolution (hrs)" column > Number Format > Custom > `#,##0.0` > OK. Right-click any cell in "Avg CSAT" column > Number Format > Custom > `0.00` > OK. Right-click "Resolved Tickets" > Number Format > Custom > `#,##0` > OK.
7. **Add Created_Date as a grouped filter:** Drag **Created_Date** to the Filters area. Then right-click any date value inside the pivot body (if visible) -- since Created_Date is in Filters, instead go to PivotTable Analyze > Insert Slicer > check **Created_Date** > OK. Right-click the slicer > Slicer Settings > check "Display header" > label: "Quarter." Right-click a date in the slicer > Group > check **Quarters** and **Years** > OK.
8. **Add Priority slicer:** PivotTable Analyze > Insert Slicer > check **Priority** > OK. In the slicer, right-click > Slicer Settings > Item Sort Order: manually order as Critical, High, Medium, Low if needed (or accept default alphabetical).
9. **Set sort order:** Click any cell in the "Avg Resolution (hrs)" column in the pivot > right-click > Sort > Sort Largest to Smallest. This surfaces the team/category combinations with the worst resolution times at the top.
10. **Enable Grand Totals:** PivotTable Design tab > Grand Totals > On for Rows and Columns.
11. **Collapse/expand Team rows:** Right-click a Team name (e.g., "Tier1") > Expand/Collapse > Collapse Entire Field to see team-level summary; expand to see category breakdown.
12. **Refresh verification:** Right-click anywhere inside pivot > Refresh. Confirm the "Resolved Tickets" grand total matches your source row count minus open tickets (filter Closed_Date: is not blank in source, count rows, compare).

---

### Setup Steps -- Google Sheets

1. Select data range A1 to I18001 (all columns, all rows) > Insert > Pivot table > New sheet > Create.
2. In Pivot table editor: Rows > Add > **Team**. Then Rows > Add > **Category**. Confirm Team is listed above Category in the Rows panel.
3. Values > Add > **Resolution_Time_Hours** > Summarize by: **AVERAGE** > Show as: Default. Rename: click the field chip > Custom: **Avg Resolution (hrs)**.
4. Values > Add > **Resolution_Time_Hours** (second time) > Summarize by: **COUNTA** > Rename: **Resolved Tickets**. *(COUNTA on a numeric field counts non-blank cells, giving resolved ticket count.)*
5. Values > Add > **CSAT_Score** > Summarize by: **AVERAGE** > Rename: **Avg CSAT**.
6. Filters > Add > **Priority**. Filters > Add > **Created_Date**.
7. For date filtering by quarter in Sheets: the filter on Created_Date will show individual dates. Instead, add a helper column in the source data on column J with the formula `="Q" & ROUNDUP(MONTH(B2)/3,0) & " " & YEAR(B2)` (label it **Quarter**) and add **Quarter** as a Filter in the pivot editor. This produces Q1 2023, Q2 2023, etc. as filter options.
8. Format value columns: select the Avg Resolution cells in the pivot > Format > Number > Custom number format > `#,##0.0`. Select Avg CSAT cells > Format > Number > Custom > `0.00`.

*Sheets limitation: No built-in date slicer equivalent. The helper column approach above is the standard workaround.*

---

### Expected Output Preview

*(Values are illustrative. Actual results will reflect your data.)*

| Team -- Category | Avg Resolution (hrs) | Resolved Tickets | Avg CSAT |
|---|---|---|---|
| **Tier1** | | | |
| -- Billing | 18.4 | 2,140 | 3.82 |
| -- Technical | 24.7 | 3,890 | 3.54 |
| -- Account | 12.1 | 1,670 | 4.21 |
| -- Onboarding | 9.8 | 980 | 4.45 |
| **Tier1 Total** | **18.6** | **8,680** | **3.89** |
| **Tier2** | | | |
| -- Billing | 8.2 | 890 | 4.12 |
| -- Technical | 31.5 | 4,820 | 3.38 |
| -- Account | 5.1 | 620 | 4.67 |
| -- Onboarding | 4.3 | 210 | 4.78 |
| **Tier2 Total** | **22.1** | **6,540** | **3.72** |
| **Grand Total** | **20.1** | **15,220** | **3.82** |

*Grand Total "Resolved Tickets" of 15,220 (not 18,000) reflects that ~2,780 tickets are still open (no Resolution_Time_Hours value) and are correctly excluded from this count and from the AVERAGE calculations.*

---

### Maintenance Notes
- **Adding new tickets:** Paste new rows starting at row 18,002 (below existing data, within the SupportTickets Table). Table will expand automatically. Right-click pivot > Refresh to include new rows.
- **New agents or categories:** If a new Category value appears in the source data, it will automatically appear as a new row in the pivot after refresh. No configuration change needed.
- **Monthly performance review:** Use the Quarter slicer to select the current quarter for in-period monitoring; select the prior quarter for closed-period reporting. To compare two quarters simultaneously, hold Ctrl while clicking slicer items.
- **CSAT response rate tracking:** Build a separate two-column summary table outside the pivot using `=COUNTIF(SupportTickets[CSAT_Score], ">0") / COUNTA(SupportTickets[Ticket_ID])` for overall response rate, and COUNTIFS for team/category breakdowns. Do not try to compute this inside the pivot.
