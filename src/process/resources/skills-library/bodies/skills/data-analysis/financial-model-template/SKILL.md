---
name: financial-model-template
description: |
  Builds a spreadsheet financial model structure with input, calculation, and output sections. Produces the formula architecture with assumption documentation and sensitivity analysis table. Outputs cell-ready formulas, not descriptions of what formulas to use.
  Use when the user needs to build a financial model, revenue projection, cost analysis, or business case in a spreadsheet.
  Do NOT use for personal budgeting (use budget-planning in personal-finance), business strategy analysis (use SWOT or financial analysis in business category), or data visualization of financial data (use chart-type-selector).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "spreadsheets analysis template"
  category: "data-analysis"
  subcategory: "spreadsheets"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Financial Model Template

## When to Use

**Use this skill when:**
- A user needs to construct a spreadsheet-based financial model from scratch -- including revenue projections, P&L forecasts, unit economics analysis, break-even analysis, SaaS/subscription metrics, LTV:CAC models, three-statement models, or discounted cash flow (DCF) valuations
- A user asks how to model a specific driver or mechanic: "how do I model churn?", "how do I calculate blended CAC?", "how do I build a cohort revenue model?", "how do I project headcount costs?"
- A user needs a business case or investment justification that requires cell-ready formulas, not narrative descriptions
- A user needs a sensitivity or scenario table -- specifically the formula architecture to power a two-variable What-If table, a scenario toggle using INDEX/CHOOSE, or a Monte Carlo-style range output
- A user is building a model for a specific vertical: SaaS, e-commerce, real estate, manufacturing, professional services, or marketplace -- each has distinct driver logic that must be captured correctly
- A user needs assumption documentation tied directly to specific cells, including source, basis, and sensitivity rating for each input
- A user needs a multi-period model (monthly, quarterly, or annual) with correct period-over-period formulas, growth logic, and time-series structure

**Do NOT use when:**
- The user wants a personal household budget, savings tracker, or debt payoff plan -- use `budget-planning` in the personal-finance category
- The user wants strategic frameworks (SWOT, Porter's Five Forces, market sizing narrative) without spreadsheet deliverables -- use `business-strategy-analysis` in the business category
- The user wants to visualize or chart existing financial data -- use `chart-type-selector` or `kpi-visualization`
- The user wants to audit or debug an already-built financial model for errors -- use `spreadsheet-model-audit`
- The user wants to interpret financial statements (read a 10-K, analyze ratios) rather than build a model -- use `financial-statement-analysis`
- The user is asking for accounting journal entries or GAAP/IFRS treatment of specific transactions -- use `accounting-entry-guidance`
- The user wants a data pipeline or database query to feed a model, not the model structure itself -- use `data-pipeline-design` or `sql-query-builder`

---

## Process

### Step 1: Scope the Model Before Writing Any Formula

Before producing any cell reference or formula, identify the following five dimensions. If the user has not specified them, ask directly -- a wrong assumption in scoping produces a structurally wrong model that cannot be patched later.

- **Model type:** Classify into one of seven archetypes: (1) revenue projection, (2) P&L forecast, (3) unit economics / contribution margin, (4) break-even analysis, (5) DCF valuation, (6) three-statement model (Income Statement + Balance Sheet + Cash Flow), or (7) ROI / payback period. Each archetype has a different formula spine.
- **Time horizon and granularity:** Monthly granularity is required for models under 3 years in any business with monthly operating cycles (SaaS, retail, services). Annual granularity is acceptable for long-horizon projections (5--10 year DCFs). Quarterly works for early-stage businesses with lumpy revenue. Never mix granularities within the same model without a clearly labeled rollup layer.
- **Key value drivers:** Identify the 3--5 variables that account for more than 80% of output variance. For SaaS: price, new user adds, churn rate. For e-commerce: traffic, conversion rate, AOV, COGS %. For manufacturing: units produced, variable cost per unit, fixed overhead. Only these belong in the sensitivity table.
- **Scenario requirements:** Determine whether the user needs (a) a single base case, (b) three separate scenarios (base/upside/downside), or (c) a scenario toggle built into one model. Option (c) is strongly preferred -- it avoids version drift between separate files.
- **Output audience:** A model built for internal operating decisions can be dense. A model built for investors, board members, or lenders needs a clean summary sheet, formatted outputs, and labeled assumption documentation. Ask who will read the outputs.

### Step 2: Design the Model Architecture Before Populating It

Lay out the physical structure of the spreadsheet before writing a single formula. A well-architected model is auditable, correctable, and extensible. A poorly structured model becomes unmaintainable within weeks.

- **Use a minimum of three sheets for any model with 12+ periods:** Sheet 1 = Inputs & Assumptions, Sheet 2 = Calculations (the engine), Sheet 3 = Outputs & Dashboard. For three-statement models, add Sheet 4 = Income Statement, Sheet 5 = Balance Sheet, Sheet 6 = Cash Flow Statement, Sheet 7 = Supporting Schedules.
- **Never co-locate inputs and formulas in the same cell range.** Inputs occupy rows B3:B20 (for example); formulas begin at row 25. Visual separation is not enough -- physical row separation is required.
- **Establish the time axis convention first:** Columns represent time periods. Row 1 = period labels ("Month 1", "Jan 2025"). Row 2 = period numbers (1, 2, 3...) for use in OFFSET and INDEX formulas. Never hard-code period numbers inside formulas.
- **Freeze panes** at the row below the column headers and the column to the right of row labels. For a 12-month model with labels in column A and period headers in row 5, freeze at B6.
- **Color code cells using the universal financial modeling convention:** Blue font (#0000FF or RGB 0,0,255) for hard-coded input cells. Black font for formula cells. Green font for cells linked from another sheet. Red font for error-check cells. This is not aesthetic -- it is the audit standard used by investment banks, private equity firms, and Big Four consulting.
- **Name your critical input cells** using Excel Named Ranges (Formulas > Define Name) or Google Sheets named ranges. Names like `Price_Per_Unit`, `Discount_Rate`, `Base_Users` make formulas self-documenting. Reserve named ranges for inputs used in 5+ formula cells.

### Step 3: Build the Input Section With Full Assumption Documentation

Every input cell requires four pieces of metadata: a label, a value, a unit, and a basis (the justification for the number). This is not optional. An undocumented assumption is a liability in any review, audit, or investor diligence process.

- **Assign a sensitivity rating to every input:** HIGH means a 10% change in this input produces more than a 5% change in the primary output. MEDIUM means 2--5% change in output. LOW means less than 2% change in output. These ratings guide which variables belong in the sensitivity table.
- **Include data validation on input cells** to prevent formula-breaking entries. For percentage inputs: Data Validation > Decimal > Between 0 and 1 (use decimals for %, not whole numbers in formulas). For integer inputs: Data Validation > Whole Number > Greater than 0.
- **Group related inputs** using Excel's Group & Outline feature (Data > Group) so users can collapse sections. Typical groupings: Revenue Assumptions, Cost Assumptions, Growth Assumptions, Financial Parameters (discount rate, tax rate, working capital %).
- **Create a "Last Updated" cell** referencing `=TODAY()` or a hardcoded date. Create a "Model Version" label. For any model shared externally, add a disclaimer cell: "This model contains forward-looking estimates. Actual results may differ materially."
- **Express all rates as decimals in input cells** (0.10 for 10%, not 10). Format the cell as Percentage with one decimal place so it displays "10.0%" but stores 0.1. This prevents the catastrophic error of `=B5*10` when the user forgot whether B5 is 0.10 or 10.

### Step 4: Build the Calculation Engine With Formula Discipline

The calculation section transforms inputs into outputs. Every formula must satisfy three tests: (1) does it reference only input cells or previously calculated cells, never hardcoded numbers? (2) does it flow in a single direction without circular references? (3) is it auditable by pressing F2 to see all precedent cells highlighted?

- **Anchor input references with absolute cell references** ($B$5) when the formula will be copied across columns (time periods) or down rows. Relative references (B5) are correct when you intentionally want the reference to shift as the formula is copied. Mixed references ($B5 or B$5) are used when copying across one axis only.
- **Use IFERROR or ISNUMBER wrappers** around division formulas to prevent #DIV/0! errors in early periods when denominators are zero: `=IFERROR(B13/B12-1, 0)` for period-over-period growth rate.
- **Compound growth formula:** `=Base_Value * (1 + Growth_Rate)^Period_Number`. This is the correct formulation for compounding. Do NOT use repeated multiplication across columns (`=B12*1.1`, `=C12*1.1`) -- that approach breaks when the growth rate input changes and creates 12 separate formula maintenance points.
- **For linear growth (adding a fixed increment each period):** `=Base_Value + (Growth_Increment * Period_Number)`.
- **For step-function changes** (price increases at specific periods, headcount additions in specific months): use IF formulas tied to period number: `=IF(Period_Number >= $B$8, New_Price, Old_Price)`. Do not hard-code the period number -- reference it from an input cell.
- **For seasonality adjustments:** Create a seasonality index row where each month's index sums to 12 (for monthly models) or the index values sum to 4 (for quarterly). Apply as: `=Annual_Estimate * (Seasonality_Index / SUM_of_all_indices) * 12`. This allows the annual total to remain controlled while distributing it seasonally.
- **Period-over-period growth check formula:** Always include a row that calculates `=IFERROR(Current_Period / Prior_Period - 1, "N/A")` for each key metric. This is both a reasonableness check and a useful output for management review.
- **For cost structures with both fixed and variable components:** `=Fixed_Cost + (Variable_Cost_Per_Unit * Units)`. Never combine these into a single "total cost" input -- keep them separate so the model captures operating leverage correctly.

### Step 5: Build the Sensitivity Analysis Table

A sensitivity table is the core risk-communication tool in any financial model. It answers: "how bad can this get, and how good can this get?" Every decision-support model must include at least one two-variable sensitivity table.

- **Select the two HIGH-sensitivity input variables** identified in Step 3. These drive the row and column axes of the table.
- **The top-left corner cell of the table must reference (not copy) the output formula.** In Excel: if your Total Profit formula is in cell B20, the top-left corner of the sensitivity table must contain `=B20` exactly. This is what Excel's Data Table function requires to link the table to the model engine.
- **Row axis values:** Choose 5--7 evenly spaced values centered on the base case. For a 10% growth rate base case, use: 4%, 6%, 8%, 10%, 12%, 14%, 16%.
- **Column axis values:** Same approach -- 5--7 values centered on base case.
- **To build the table in Excel:** Select the full table range including headers and the corner formula cell. Go to Data > What-If Analysis > Data Table. In the dialog: Row input cell = the cell containing the column header variable in the inputs section. Column input cell = the cell containing the row header variable in the inputs section. This distinction is counterintuitive -- the row input cell is the variable that changes across columns, and the column input cell is the variable that changes down rows.
- **In Google Sheets:** Excel-style Data Tables are not natively supported. Instead, build a manual sensitivity table using a formula like: `=Model_Output_Formula_Restated_With_Direct_References`. Alternatively, use INDIRECT + a helper lookup approach, or consider using App Scripts for true parameterization.
- **Format the sensitivity table with conditional formatting:** Green fill for values above target threshold (e.g., positive profit, IRR above hurdle rate). Red fill for values below threshold. Yellow for values within 10% of threshold. This allows instant visual identification of the safe operating envelope.
- **Label which cell is the base case** by bolding the intersection of base-case row and base-case column values. This prevents confusion when the table is read in isolation.

### Step 6: Build the Scenario Comparison Structure

A scenario toggle is superior to three separate files or three separate model copies. It maintains a single formula engine while allowing rapid switching between assumption sets.

- **Create a "Scenario" input cell** with Data Validation dropdown containing: "1 -- Base", "2 -- Upside", "3 -- Downside". Store the numeric part as the active scenario index.
- **Create a scenario assumptions table** with three columns of inputs: one for each scenario. Each row corresponds to one input variable. This is the only place where scenario-specific values live.
- **In the main Input Section, each input cell becomes a formula** that reads from the scenario table using CHOOSE or INDEX: `=CHOOSE(Scenario_Index, Downside_Value, Base_Value, Upside_Value)`. Now every input in the model automatically updates when the scenario selector changes.
- **Never use VLOOKUP for scenario selection** -- it breaks on non-exact matches and is fragile to column insertions. Use INDEX/MATCH or CHOOSE.
- **Create a side-by-side scenario summary table** in the Output section that shows all three scenarios simultaneously regardless of which is selected. This requires hard-linking to the scenario table, not to the engine outputs. Use INDEX to pull the correct value for each scenario.
- **Upside and downside scenarios must be internally consistent.** A downside scenario does not simply reduce revenue -- it increases churn, raises CAC, compresses margins, and delays hiring. Each scenario requires a complete set of consistent assumptions across all drivers, not just the top-line.

### Step 7: Build the Output Section and Dashboard

The output section is the model's communication layer. Its purpose is to present the answer clearly to a decision-maker who may not understand the model internals.

- **Include a KPI summary table** with the 5--10 most important metrics: Revenue (year total and final period run rate), Gross Profit and Gross Margin %, EBITDA and EBITDA Margin %, Break-even Month (using MATCH to find the first period with positive cumulative profit), Payback Period (months to recover initial investment), and IRR/NPV where applicable.
- **Break-even formula using MATCH:** `=MATCH(TRUE, Cumulative_Profit_Array > 0, 0)`. This returns the period number when cumulative profit first turns positive. Wrap in IFERROR for models that never reach break-even within the projection horizon.
- **NPV formula:** `=NPV(Discount_Rate/12, Monthly_Cashflow_Range) + Initial_Investment`. The division by 12 converts an annual discount rate to a monthly rate. The initial investment is added (as a negative number) because Excel's NPV function assumes cash flows begin at period 1, not period 0.
- **IRR formula for monthly cash flows:** `=IRR(Cashflow_Range_Including_Period_0) * 12`. Multiply by 12 to annualize a monthly IRR. For quarterly cash flows, multiply by 4.
- **Payback period formula:** `=Initial_Investment / Average_Annual_Cashflow` for simple payback. For discounted payback, use: `=MATCH(TRUE, Cumulative_Discounted_Cashflow_Array > 0, 0)`.
- **Format all currency outputs with the $#,##0 format** (no decimal places for numbers over $1,000; two decimal places for unit metrics like cost per user). Format percentages as 0.0% (one decimal place). Format period numbers as integers with no formatting.
- **Add an error-check row** in the output section. For a three-statement model, this is: `=Balance_Sheet_Assets - (Balance_Sheet_Liabilities + Equity)` which must equal zero. For any model, include a sum-check: does total revenue equal the sum of all revenue line items? Format error-check cells red if non-zero using conditional formatting.

### Step 8: Deliver the Complete Formula Architecture

Present the model as a complete, cell-addressable specification. The user must be able to sit down with a blank spreadsheet and build the model exactly from your output, with no ambiguity about what goes in any cell.

- **Specify every cell reference explicitly:** Sheet name, column letter, row number. For multi-sheet models: `'Inputs'!B5`, `'Engine'!C12`.
- **Provide the exact formula string** for every non-trivial cell, including dollar signs for absolute references.
- **Provide the expected output value** for the base case inputs so the user can verify their implementation is correct.
- **Specify the format code** for every output cell (e.g., `$#,##0`, `0.0%`, `#,##0`, `[Red]0;[Green]0`).
- **Provide setup instructions for non-formula features:** Data Table setup steps, Named Range definitions, Data Validation rules, Conditional Formatting rules.

---

## Output Format

```
## Financial Model: [Model Name]

### Model Overview
- **Type:** [Revenue projection / P&L forecast / Unit economics / Break-even / DCF / ROI / Three-statement]
- **Time horizon:** [N periods, Monthly / Quarterly / Annual]
- **Granularity:** [Monthly / Quarterly / Annual]
- **Primary output:** [The specific metric this model is built to answer]
- **Audience:** [Internal operations / Investor presentation / Board review / Lender package]
- **Scenario structure:** [Single base case / Three-scenario toggle / Standalone upside-base-downside]
- **Last updated:** [Date or =TODAY()]

---

### Sheet Structure

| Sheet | Purpose |
|-------|---------|
| Inputs | All hardcoded assumption values, scenario table, assumption documentation |
| Engine | All calculation formulas, period-by-period detail |
| Outputs | KPI summary, sensitivity table, scenario comparison |
| [Optional: IS / BS / CF] | Three-statement detail for full financial models |

---

### Input Section (Sheet: Inputs, Rows 3--30)

*Format all input cells: Blue font (RGB 0,0,255), light blue fill (#EBF3FB). No formulas in this section.*

| Cell | Named Range | Label | Value | Unit | Basis | Sensitivity |
|------|-------------|-------|-------|------|-------|-------------|
| B3 | [Range_Name] | [Input label] | [Value] | [Unit] | [Source / basis for this number] | HIGH / MED / LOW |
| B4 | [Range_Name] | [Input label] | [Value] | [Unit] | [Source / basis for this number] | HIGH / MED / LOW |
| B5 | [Range_Name] | [Input label] | [Value] | [Unit] | [Source / basis for this number] | HIGH / MED / LOW |
...

**Data Validation Rules:**
| Cell | Validation Type | Parameters |
|------|----------------|------------|
| B5 | Decimal | Between 0 and 1 (percentage inputs) |
| B6 | Whole Number | Greater than 0 (count inputs) |

---

### Scenario Table (Sheet: Inputs, Rows 35--55)

*This section holds values for all three scenarios. The Input Section cells above use CHOOSE() to read from this table.*

| Row | Input | Downside | Base | Upside |
|-----|-------|----------|------|--------|
| 36 | [Input 1] | [value] | [value] | [value] |
| 37 | [Input 2] | [value] | [value] | [value] |

**Scenario selector cell:** B33
**Formula:** Data Validation > List > "1 -- Downside, 2 -- Base, 3 -- Upside"
**Input cells use:** `=CHOOSE('Inputs'!$B$33, B36, C36, D36)`

---

### Calculation Engine (Sheet: Engine)

**Time axis setup (Row 1--2):**
| Cell | Label | Formula |
|------|-------|---------|
| B1 | Period Label | "Month 1" (hardcoded) |
| C1 | Period Label | `="Month "&C2` |
| B2 | Period Number | 1 (hardcoded) |
| C2 | Period Number | `=B2+1` |

**Revenue Calculations:**

| Cell | Label | Formula | Depends On | Expected Value (Base) |
|------|-------|---------|-----------|----------------------|
| B10 | [Revenue driver] | `=[exact formula]` | [input cells] | [expected output] |
| B11 | [Revenue line] | `=[exact formula]` | [input cells] | [expected output] |
| B12 | Total Revenue | `=SUM(B10:B11)` | B10, B11 | [expected output] |

**Cost Calculations:**

| Cell | Label | Formula | Depends On | Expected Value (Base) |
|------|-------|---------|-----------|----------------------|
| B15 | [Variable cost] | `=[exact formula]` | [input cells] | [expected output] |
| B16 | [Fixed cost] | `=[exact formula]` | [input cells] | [expected output] |
| B17 | Total Costs | `=SUM(B15:B16)` | B15, B16 | [expected output] |

**Profit / Margin Calculations:**

| Cell | Label | Formula | Depends On | Expected Value (Base) |
|------|-------|---------|-----------|----------------------|
| B20 | Gross Profit | `=B12-B17` | B12, B17 | [expected output] |
| B21 | Gross Margin % | `=IFERROR(B20/B12, 0)` | B20, B12 | [expected output] |
| B22 | Cumulative Profit | `=IF(B2=1, B20, C22+B20)` | B20, prior period | [expected output] |

---

### Output Section (Sheet: Outputs)

**KPI Summary Table:**

| Metric | Formula | Cell | Format Code | Expected Value (Base) |
|--------|---------|------|-------------|----------------------|
| Total [Period] Revenue | `=SUM('Engine'!B12:M12)` | B5 | $#,##0 | [value] |
| Final Period Run Rate | `='Engine'!M12*12` | B6 | $#,##0 | [value] |
| Gross Margin % | `=IFERROR(B7/B5, 0)` | B8 | 0.0% | [value] |
| Break-even Month | `=IFERROR(MATCH(TRUE,'Engine'!B22:M22>0,0),"Never")` | B9 | #,##0 | [value] |
| NPV | `=NPV(Discount_Rate/12,'Engine'!B20:M20)+Initial_Investment` | B10 | $#,##0 | [value] |

---

### Sensitivity Analysis (Sheet: Outputs, Rows 15--25)

**Variable 1 (row axis):** [HIGH sensitivity input, e.g., Monthly Growth Rate]
**Variable 2 (column axis):** [HIGH sensitivity input, e.g., Price Per Unit]
**Output metric:** [Primary KPI, e.g., Total Annual Revenue]

| [Var 1] \ [Var 2] | [Col val 1] | [Col val 2] | [Col val 3] | [Col val 4] | [Col val 5] |
|--------------------|-------------|-------------|-------------|-------------|-------------|
| [Row val 1] | | | | | |
| [Row val 2] | | | | | |
| **[Base val]** | | | **[Base]** | | |
| [Row val 4] | | | | | |
| [Row val 5] | | | | | |

**Corner cell (top-left of table, e.g., A15):** `=[Primary output formula or reference]`
**Excel setup:** Select A15:F20 > Data > What-If Analysis > Data Table
- Row input cell: [Cell containing column header variable in Inputs sheet]
- Column input cell: [Cell containing row header variable in Inputs sheet]

**Conditional formatting:** Green fill for values above [target]. Red fill for values below [minimum threshold]. Base case cell bolded.

---

### Assumption Documentation

| # | Assumption | Value | Basis | Sensitivity | Review Date |
|---|-----------|-------|-------|-------------|-------------|
| 1 | [Assumption] | [Value] | [Historical data / Industry benchmark / Management estimate / Contractual] | HIGH / MED / LOW | [Date] |
| 2 | [Assumption] | [Value] | [Source] | HIGH / MED / LOW | [Date] |

---

### Error Checks

| Check | Formula | Expected | Cell |
|-------|---------|----------|------|
| Revenue sum check | `=B12-SUM(B10:B11)` | 0 | [cell] |
| [Model-specific check] | `=[formula]` | 0 | [cell] |

*Format: Conditional formatting RED fill if <> 0.*
```

---

## Rules

1. **Never hardcode a number inside a formula.** The formula `=500*(1.10^12)` is wrong. The formula `=Base_Users*(1+Growth_Rate)^Period_Number` (where each named range references an input cell) is correct. The only exception is constants that never change and have physical meaning: 12 (months per year), 4 (quarters per year), 365 (days per year). Even then, document the constant with a comment.

2. **Percentage inputs must be stored as decimals (0.10, not 10) and formatted as Percentage.** Formulas always multiply by the stored decimal value. If a user says "10% growth rate," the input cell stores 0.10 and displays "10.0%". Using 10 as the stored value causes `=B5*0.10` errors or forces awkward `/100` corrections throughout the model.

3. **Absolute references ($B$5) must be used for all input cell references inside formulas that are copied across time periods.** Failing to lock input references causes the most common model-breaking error: as formulas are copied across columns, relative references drift, silently pulling wrong input values. Press F4 after selecting a cell reference to cycle through reference types.

4. **No formula cell may reference itself (circular reference) unless iterative calculation is intentionally enabled and documented.** Accidental circular references corrupt every cell in the recalculation chain silently in some Excel versions. If a model requires intentional circular references (e.g., interest expense depends on ending debt balance which depends on cash available after interest), document it explicitly at the top of the sheet with the iteration settings used: maximum iterations = 100, maximum change = 0.001.

5. **The sensitivity analysis table's corner cell must reference the output metric formula -- it cannot be a copy of the formula.** Excel's Data Table mechanism substitutes input values and re-evaluates from the corner cell reference. If you paste the formula rather than reference the output cell, the table calculates correctly but is disconnected from any changes to the model structure. Always use `=Outputs!B5` (a reference) not a recopy of the formula.

6. **All rate assumptions (growth rate, churn rate, discount rate, tax rate, gross margin %) must be expressed as annualized rates in the inputs, then converted to period rates within the engine.** A 20% annual churn rate applied to a monthly model requires `Monthly_Churn = 1 - (1 - Annual_Churn)^(1/12)` = approximately 1.85% per month. Dividing by 12 (20%/12 = 1.67%) understates monthly churn by ~10% compounded over a year. The division approach is acceptable only for short periods and low rates.

7. **Every model must include at least one error-check cell** that validates internal consistency. For revenue models: does total revenue equal the sum of all revenue line items? For cost models: does total cost equal fixed + variable? For three-statement models: does Assets = Liabilities + Equity? Error-check cells must be formatted red if the result is non-zero and prominently placed in the output section.

8. **Never use VLOOKUP in a financial model.** VLOOKUP breaks silently when columns are inserted, requires data to be sorted, and returns the wrong value on approximate matches without warning. Use INDEX/MATCH, XLOOKUP (Excel 365/2019+), or CHOOSE for scenario lookups. The risk of a wrong value propagating silently through a financial model is too high to accept VLOOKUP's fragilities.

9. **Time period labels (Month 1, Q1 2025, FY2026) must be generated by formula from a single start date or period number input -- never hard-coded across columns.** Hard-coded period labels mean that inserting a column, shifting the timeline, or changing the start date requires manual relabeling of every column. Generate labels using: `="Month "&B2` or `=TEXT(DATE(Start_Year, Start_Month + B2 - 1, 1), "MMM YYYY")`.

10. **Do not use merged cells anywhere in a financial model.** Merged cells break VLOOKUP, INDEX, array formulas, sorting, and AutoFill. They look visually clean but create structural fragility. Use Center Across Selection (Format Cells > Alignment > Horizontal: Center Across Selection) as a visual alternative that does not merge cell data.

11. **For any model shared externally, remove all Personal Information (PI) from cell comments, file metadata, and hidden sheets before delivery.** Financial models shared with investors or counterparties have been used in litigation. Check: File > Info > Check for Issues > Inspect Document to remove hidden data.

12. **When the model spans multiple sheets, use explicit sheet references in every cross-sheet formula** (`='Inputs'!B5`, not just `=B5`). Implicit references break when sheets are renamed, copied, or moved. Include sheet names even when writing formulas within the same sheet as a defensive practice for models that may later be restructured.

---

## Edge Cases

### Edge Case 1: No Historical Data (Pre-Revenue Business)
When modeling a pre-revenue business, every input is an estimate with no empirical grounding. Handle this with specific structural choices rather than generic disclaimers.
- Flag every input with "ESTIMATE -- no historical basis" in the Basis column of the assumption documentation.
- Set all inputs to HIGH sensitivity unless there is a contractual or structural reason they are fixed.
- Make the sensitivity table, not the point estimate, the primary deliverable. The table shows the decision-maker the range of possible outcomes.
- Build three internally consistent scenarios: Downside (bottom 25th percentile comparable company metrics), Base (median comparable company metrics), Upside (top 25th percentile). Use industry benchmark data from sources like SaaS Capital benchmarks, First Round State of Startups, or vertical-specific databases as the grounding.
- Add a "Proof of Concept" milestone row: what does revenue need to be in Month 6 to validate the base case trajectory? This converts a speculative model into a testable one.

### Edge Case 2: Multi-Year Monthly Model (60+ Columns)
A 5-year monthly model has 60 time-period columns. This is unwieldy in a single sheet and creates performance problems in Google Sheets.
- Separate detail from summary: Monthly detail lives in the Engine sheet. Annual summary totals live in the Outputs sheet using `=SUMPRODUCT((YEAR_ARRAY=Target_Year)*Revenue_Array)` or SUMIFS referencing a year helper row.
- Use Excel's Group & Outline to collapse years: group columns B:M (Year 1), N:Y (Year 2), etc. Users can expand the year they need without scrolling 60 columns.
- For Google Sheets with performance issues above 40 columns of formulas: convert Year 1 actual periods to hardcoded values after the month closes, and use ARRAYFORMULA for repeating calculation patterns to reduce formula count.
- Consider splitting into tabs by year (Year_1, Year_2...) with an annual Summary tab. Cross-tab references slow the model but reduce individual sheet complexity.

### Edge Case 3: Three-Statement Model With Balance Sheet Balancing
A full three-statement model requires that the Income Statement feeds Retained Earnings on the Balance Sheet, and the Cash Flow Statement reconciles the change in cash on the Balance Sheet. This creates structural dependencies that must be built in the correct order.
- Build in this sequence: (1) Revenue and expense assumptions in Inputs. (2) Income Statement. (3) Working capital and capex schedules. (4) Debt and equity schedule. (5) Cash Flow Statement using indirect method (Net Income + non-cash adjustments + working capital changes). (6) Balance Sheet where Ending Cash = Prior Cash + Net Cash Flow from Cash Flow Statement.
- The balance check formula (`=Total_Assets - Total_Liabilities - Total_Equity`) must equal zero every period. If it does not, there is a structural error, not a rounding issue. Never fudge the balance by adjusting a line item.
- Retained Earnings formula: `=Prior_Retained_Earnings + Net_Income - Dividends_Paid`. This is the only correct link between the Income Statement and Balance Sheet.
- Depreciation appears as a non-cash add-back in Cash Flow and as a reduction in PP&E on the Balance Sheet. It must appear in both or the balance breaks.

### Edge Case 4: Model With Circular References (Revolver / Interest Expense)
Many P&L and three-statement models have an unavoidable circular reference: the revolver (revolving credit facility) balance depends on the ending cash position, which depends on interest expense, which depends on the revolver balance.
- Enable iterative calculation BEFORE building the circular logic: File > Options > Formulas > Enable iterative calculation. Set Maximum Iterations to 100, Maximum Change to 0.0001.
- Document the circular dependency with a comment on the relevant cells: "CIRCULAR REF -- Revolver balance depends on interest expense which depends on revolver balance. Resolved via iterative calculation."
- Test convergence: change a major input and verify the model recalculates to a stable solution (not an infinite loop). If the model produces #VALUE! errors or fluctuating values after enabling iteration, the circular logic is structured incorrectly.
- In Google Sheets: iterative calculation is enabled per-file in Settings. The behavior is functionally equivalent to Excel.

### Edge Case 5: SaaS / Subscription Model With Cohort Revenue
Simple SaaS models that apply a flat churn rate to total users understate revenue in early periods and overstate it in later periods because they ignore cohort-level retention curves. For investor-grade SaaS models, build a cohort structure.
- Each month's new user cohort occupies one row. Column B = Month 1 users in that cohort. Column C = `=B * (1 - Monthly_Churn)`. Column D = `=C * (1 - Monthly_Churn)`, etc.
- Total active users in any period = `=SUMPRODUCT` of all cohort rows that have reached that column.
- Revenue in any period = Total Active Users * ARPU (Average Revenue Per User). ARPU can itself change over time as expansion revenue and downgrades are modeled.
- LTV formula: `=ARPU * Gross_Margin_% / Monthly_Churn_Rate`. This is the standard LTV formula assuming constant ARPU and churn. For a more accurate LTV with declining churn (common in mature cohorts), use: `=SUMPRODUCT(Survival_Curve * Monthly_Margin_Per_User)` across a 36-month horizon.
- CAC payback period: `=CAC / (ARPU * Gross_Margin_%)`. This is the number of months to recover acquisition cost from gross profit contribution.

### Edge Case 6: Model Inherited From Someone Else (Adapting Not Building)
When a user provides an existing model and asks you to add to it or extend it, do not assume the existing model follows good structure. Before adding formulas:
- Identify whether input cells contain hardcoded values or formulas (press Ctrl+` to toggle formula view in Excel). If input cells contain formulas, the model mixes inputs and calculations -- flag this before extending.
- Check for hardcoded numbers inside existing formulas. If the model uses `=B12*0.08` for an 8% rate, identify the correct input cell (or create one) before extending the formula chain.
- Look for existing named ranges (Formulas > Name Manager) and use them consistently. Do not introduce new cell references alongside named ranges -- this creates two parallel naming systems.
- Ask the user to describe what the model currently calculates correctly and what it does not. Never assume the existing formulas are correct.

### Edge Case 7: Model for a Two-Sided Marketplace or Platform Business
Marketplace businesses have two distinct revenue mechanisms that must not be collapsed into one revenue line: take rate on GMV (Gross Merchandise Volume) and potentially direct services revenue. The model must capture both sides of the marketplace separately.
- GMV model structure: `GMV = Active_Buyers * Average_Order_Value * Orders_Per_Buyer_Per_Period`. Revenue = `GMV * Take_Rate`.
- Liquidity threshold: marketplaces have a non-linear growth dynamic where below a critical mass of buyers and sellers, growth slows. Model this with a liquidity multiplier: `Growth_Rate = Base_Growth * IF(Active_Sellers >= Liquidity_Threshold, 1, Liquidity_Penalty_Factor)`.
- Seller acquisition cost and buyer acquisition cost are separate inputs with separate CAC values. Do not blend them -- the CAC payback math is different for each side.
- Contribution margin for a marketplace: `Net_Revenue - Payment_Processing_Costs - Trust_and_Safety_Costs - Seller_Support_Costs`. This is distinct from gross margin for a product business and must be calculated separately.

---

## Example

**User Input:** "I'm building a SaaS business selling project management software at $79/month per seat. We launched 3 months ago with 200 seats sold. We're adding about 80 new seats per month (not growing the add rate yet), but we have a 2% monthly churn on existing seats. I need to project the next 12 months of revenue and find our break-even -- our fixed costs are $45,000/month and variable costs are $5 per active seat per month. I want to see how sensitive our break-even timing is to the churn rate and new seat adds per month."

---

## Financial Model: SaaS P&L and Break-Even Projection

### Model Overview
- **Type:** P&L Forecast with Break-Even Analysis
- **Time horizon:** 12 months, monthly granularity
- **Primary output:** Monthly net profit and break-even month
- **Audience:** Internal operations and founder decision-making
- **Scenario structure:** Single base case with two-variable sensitivity table
- **Key insight this model answers:** At what combination of churn rate and new seat adds does the business reach break-even, and when?

---

### Sheet Structure

| Sheet | Purpose |
|-------|---------|
| Inputs | All hardcoded assumptions, assumption documentation |
| Engine | Month-by-month seat count, revenue, cost, and profit calculations |
| Outputs | KPI summary, break-even analysis, sensitivity table |

---

### Input Section (Sheet: Inputs, Rows 3--20)

*Format: Blue font, light blue fill (#EBF3FB). No formulas. Store percentages as decimals.*

| Cell | Named Range | Label | Value | Unit | Basis | Sensitivity |
|------|-------------|-------|-------|------|-------|-------------|
| B3 | Price_Per_Seat | Monthly price per seat | 0.079 (display: $79) | $/seat/month | Current list pricing, locked for 12 months | HIGH |
| B4 | Starting_Seats | Active seats at model start | 200 | seats | Actual count, end of Month 0 | HIGH |
| B5 | New_Seats_Per_Month | New seats added per month | 80 | seats/month | Average of last 3 months actuals | HIGH |
| B6 | Monthly_Churn_Rate | Monthly churn rate (% of active seats lost) | 0.02 | decimal (2%) | Average of 3 months: 1.8%, 2.1%, 2.0% | HIGH |
| B7 | Fixed_Costs_Monthly | Monthly fixed costs | 45000 | $/month | Payroll $38K + SaaS tools $4K + office $3K | MEDIUM |
| B8 | Variable_Cost_Per_Seat | Variable cost per active seat | 5 | $/seat/month | Hosting + support apportionment | MEDIUM |
| B9 | Price_Per_Seat_Display | Price per seat (display format) | 79 | $ | Same as B3, formatted as currency for outputs | LOW |

**Note on B3:** Store as 0.079 (decimal) to avoid dividing by 100 in formulas. Format cell as `$#,##0.00`. Alternatively store as 79 and use without conversion -- be consistent throughout. This model uses the whole-dollar approach (79) for price and stores the churn rate as a decimal (0.02).

*Revised to standard approach -- store price as whole dollars:*

| Cell | Named Range | Label | Value | Unit | Basis | Sensitivity |
|------|-------------|-------|-------|------|-------|-------------|
| B3 | Price_Per_Seat | Monthly price per seat | 79 | $ | Current list pricing | HIGH |
| B4 | Starting_Seats | Active seats (Month 0 ending) | 200 | seats | Actual count | HIGH |
| B5 | New_Seats_Per_Month | New seats added per month (gross) | 80 | seats | 3-month average | HIGH |
| B6 | Monthly_Churn_Rate | Monthly churn rate | 0.02 | decimal | 3-month average: 1.8%, 2.1%, 2.0% | HIGH |
| B7 | Fixed_Costs_Monthly | Total monthly fixed costs | 45000 | $ | Payroll $38K + tools $4K + office $3K | MEDIUM |
| B8 | Variable_Cost_Per_Seat | Variable cost per active seat per month | 5 | $/seat | Hosting + support allocation | MEDIUM |

---

### Calculation Engine (Sheet: Engine)

**Row 1 -- Period Labels:**

| Cell | Formula | Displays |
|------|---------|---------|
| B1 | `="Month "&B2` | "Month 1" |
| C1 | `="Month "&C2` | "Month 2" |
| ... | Copy C1 across to M1 | "Month 12" |

**Row 2 -- Period Numbers:**

| Cell | Formula |
|------|---------|
| B2 | `=1` (hardcoded) |
| C2 | `=B2+1` (copy across to M2) |

**Row 5 -- Starting Seats (beginning of period):**

This row captures the active seat count at the START of each month, before new adds and before churn.

| Cell | Label | Formula | Notes |
|------|-------|---------|-------|
| B5 | Starting seats, Month 1 | `='Inputs'!B4` | Pulls the Month 0 ending balance (200 seats) |
| C5 | Starting seats, Month 2 | `=B7` | Pulls the ENDING seats from prior month |
| [D5:M5] | Starting seats, Months 3--12 | Copy C5 formula across | Each month starts with prior month's ending balance |

**Row 6 -- Gross New Seats Added:**

| Cell | Label | Formula | Notes |
|------|-------|---------|-------|
| B6 | New seats added, Month 1 | `='Inputs'!$B$5` | Absolute reference -- same 80 seats every month |
| [C6:M6] | Copy B6 formula across | `='Inputs'!$B$5` | Locked -- does not drift when copied |

**Row 7 -- Ending Active Seats (after adds and churn):**

The correct order: apply churn to starting seats, then add new seats. New seats acquired this month are not subject to this month's churn (they churn starting next month).

| Cell | Label | Formula | Expected Value (Base, Month 1) |
|------|-------|---------|-------------------------------|
| B7 | Ending seats, Month 1 | `=ROUND(B5*(1-'Inputs'!$B$6)+B6, 0)` | `=ROUND(200*(1-0.02)+80, 0)` = `=ROUND(196+80, 0)` = 276 |
| C7 | Ending seats, Month 2 | `=ROUND(C5*(1-'Inputs'!$B$6)+C6, 0)` | `=ROUND(276*0.98+80, 0)` = 350 |
| [D7:M7] | Copy C7 across | Same formula pattern | Month 12 ≈ 756 seats |

**Row 8 -- Average Active Seats (for variable cost calculation):**

Variable costs apply to the average seat count during the month, not just ending.

| Cell | Label | Formula | Expected Value (Base, Month 1) |
|------|-------|---------|-------------------------------|
| B8 | Avg active seats, Month 1 | `=ROUND((B5+B7)/2, 0)` | `=(200+276)/2` = 238 |
| [C8:M8] | Copy B8 across | `=ROUND((C5+C7)/2, 0)` | Month 12 ≈ 730 seats avg |

**Row 10 -- Monthly Revenue:**

Revenue is earned on ending active seats (customers paying for the full month).

| Cell | Label | Formula | Expected Value (Base, Month 1) |
|------|-------|---------|-------------------------------|
| B10 | Monthly Revenue, Month 1 | `=B7*'Inputs'!$B$3` | `=276*79` = $21,804 |
| [C10:M10] | Copy B10 across | `=C7*'Inputs'!$B$3` | Month 12 = `756*79` = $59,724 |

**Row 12 -- Variable Costs:**

| Cell | Label | Formula | Expected Value (Base, Month 1) |
|------|-------|---------|-------------------------------|
| B12 | Variable costs, Month 1 | `=B8*'Inputs'!$B$8` | `=238*5` = $1,190 |
| [C12:M12] | Copy across | `=C8*'Inputs'!$B$8` | Month 12 ≈ $3,650 |

**Row 13 -- Fixed Costs:**

| Cell | Label | Formula | Expected Value (Base, Month 1) |
|------|-------|---------|-------------------------------|
| B13 | Fixed costs, Month 1 | `='Inputs'!$B$7` | $45,000 (same every month) |
| [C13:M13] | Copy across | `='Inputs'!$B$7` | $45,000 constant |

**Row 14 -- Total Costs:**

| Cell | Label | Formula | Expected Value (Base, Month 1) |
|------|-------|---------|-------------------------------|
| B14 | Total costs, Month 1 | `=B12+B13` | `=1,190+45,000` = $46,190 |
| [C14:M14] | Copy across | `=C12+C13` | Month 12 ≈ $48,650 |

**Row 16 -- Net Profit / (Loss):**

| Cell | Label | Formula | Expected Value (Base, Month 1) |
|------|-------|---------|-------------------------------|
| B16 | Net profit, Month 1 | `=B10-B14` | `=21,804-46,190` = ($24,386) |
| [C16:M16] | Copy across | `=C10-C14` | Month 12 ≈ $11,074 positive |

**Row 17 -- Cumulative Net Profit / (Loss):**

| Cell | Label | Formula | Expected Value (Base, Month 1) |
|------|-------|---------|-------------------------------|
| B17 | Cumulative profit, Month 1 | `=B16` | ($24,386) |
| C17 | Cumulative profit, Month 2 | `=B17+C16` | Approximately ($45,000) |
| [D17:M17] | Copy C17 across | `=C17+D16` | Turns positive in approximately Month 10 |

**Row 18 -- Period
