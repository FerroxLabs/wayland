---
name: data-warehouse-design
description: |
  Designs a data warehouse structure by selecting star or snowflake schema, defining fact tables and dimension tables, specifying grain for each fact table, and producing the entity-relationship description. Outputs a complete warehouse schema specification.
  Use when the user asks to design a data warehouse, build a dimensional model, create fact and dimension tables, or plan an analytics schema for reporting.
  Do NOT use for operational database schema design (use data-schema-design), ETL pipeline logic (use etl-pipeline-design), or dashboard layout (use bi-dashboard-spec).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science sql planning"
  category: "data-analysis"
  subcategory: "data-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Data Warehouse Design

## When to Use

**Use this skill when:**
- User asks to design a data warehouse or analytical data store
- User wants to create a dimensional model with fact and dimension tables
- User needs to decide between star schema and snowflake schema
- User wants to restructure an existing analytics schema for better query performance
- User asks about grain, slowly changing dimensions, or conformed dimensions

**Do NOT use when:**
- User wants to design an operational (OLTP) database schema (use `data-schema-design`)
- User wants to design the ETL pipelines that load the warehouse (use `etl-pipeline-design`)
- User wants a dashboard layout for warehouse data (use `bi-dashboard-spec`)
- User wants to set up streaming data ingestion (use `streaming-data-architecture`)

## Process

1. **Identify the business process to model.** Ask the user:
   - What business process generates the data? (sales transactions, website visits, support tickets, manufacturing runs)
   - What are the key business questions the warehouse must answer?
   - Who queries the warehouse? (analysts, BI tools, ML pipelines)
   - What is the expected query pattern? (time-series aggregation, dimensional slicing, ad-hoc exploration)
   - What source systems feed the warehouse?

2. **Define the grain.** The grain is the most critical decision:
   - Grain = the level of detail each row in a fact table represents
   - Ask: "What does one row represent?" (one transaction, one daily snapshot, one click event, one line item)
   - The grain must be the most atomic level available -- you can always aggregate up, but you cannot disaggregate
   - Common grain patterns:
     - **Transaction grain:** One row per business event (order placed, payment received)
     - **Periodic snapshot grain:** One row per entity per time period (daily account balance, monthly revenue by product)
     - **Accumulating snapshot grain:** One row per entity lifecycle (order lifecycle from placed to shipped to delivered)

3. **Identify fact tables.** For each measurable business process:
   - Name the fact table (fact_[process_name])
   - State the grain explicitly
   - List the measures (numeric values that can be aggregated: revenue, quantity, duration, count)
   - Classify each measure:
     - **Additive:** Can be summed across all dimensions (revenue, quantity)
     - **Semi-additive:** Can be summed across some dimensions but not time (account balance)
     - **Non-additive:** Cannot be summed (ratios, percentages) -- store the components and calculate at query time

4. **Identify dimension tables.** For each descriptive context:
   - Name the dimension table (dim_[entity_name])
   - List the attributes (descriptive columns used for filtering and grouping)
   - Identify the natural key (business identifier) and surrogate key
   - Determine the SCD (Slowly Changing Dimension) type:
     - **Type 1:** Overwrite the old value (no history; simple; use for corrections)
     - **Type 2:** Add a new row with valid_from/valid_to dates (full history; use for attributes that change meaningfully)
     - **Type 3:** Add a column for the previous value (limited history; use for one-level comparison)

5. **Choose the schema type.**
   - **Star schema:** Fact table in the center, dimension tables radiating out. Each dimension is fully denormalized (one table per dimension, no sub-dimensions). Best for: simple queries, fast performance, most BI tools.
   - **Snowflake schema:** Dimensions are normalized into sub-dimensions (dim_product joins to dim_category joins to dim_department). Best for: storage efficiency, consistent hierarchies, complex dimension structures.
   - **Default recommendation:** Star schema unless there is a strong reason for snowflake (very large shared dimensions, strict storage constraints, or mandatory normalization policy).

6. **Design conformed dimensions.** Dimensions shared across multiple fact tables:
   - dim_date (always conformed -- every fact table references the same date dimension)
   - dim_customer (if multiple processes involve the same customers)
   - dim_product (if multiple processes involve the same products)
   - Conformed dimensions ensure consistent filtering and aggregation across fact tables

7. **Produce the warehouse schema specification.**

## Output Format

```
## Data Warehouse Design: [Warehouse Name]

### Overview
- **Business process(es):** [What is being modeled]
- **Schema type:** [Star / Snowflake]
- **Primary consumers:** [Who queries this warehouse]
- **Source systems:** [What feeds it]

### Fact Tables

#### fact_[name]
- **Grain:** [One row = one _____]
- **Estimated volume:** [Rows per day, total rows]
- **Retention:** [How long data is kept]

| Column | Type | Measure Type | Description |
|--------|------|-------------|-------------|
| [surrogate_key] | BIGINT | -- | Degenerate or surrogate FK |
| [dim_key_1] | BIGINT | FK -> dim_[name].id | [Dimension reference] |
| [dim_key_2] | BIGINT | FK -> dim_[name].id | [Dimension reference] |
| [date_key] | INT | FK -> dim_date.date_key | [Date dimension reference] |
| [measure_1] | DECIMAL | Additive | [Description] |
| [measure_2] | DECIMAL | Additive | [Description] |
| [measure_3] | DECIMAL | Non-additive | [Description -- store components] |

### Dimension Tables

#### dim_[name]
- **SCD Type:** [1 / 2 / 3]
- **Estimated rows:** [Count]

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Surrogate key (auto-increment) |
| natural_key | [type] | Business identifier |
| [attribute_1] | [type] | [Description] |
| [attribute_2] | [type] | [Description] |
| valid_from | DATE | [SCD Type 2 only] Row effective start |
| valid_to | DATE | [SCD Type 2 only] Row effective end (9999-12-31 for current) |
| is_current | BOOLEAN | [SCD Type 2 only] Convenience flag |

#### dim_date (Conformed)
| Column | Type | Description |
|--------|------|-------------|
| date_key | INT | YYYYMMDD format integer key |
| full_date | DATE | Calendar date |
| day_of_week | VARCHAR(10) | Monday, Tuesday, etc. |
| month_name | VARCHAR(10) | January, February, etc. |
| quarter | VARCHAR(6) | Q1-2026, Q2-2026, etc. |
| fiscal_year | INT | Fiscal year (if different from calendar) |
| is_weekend | BOOLEAN | Saturday or Sunday |
| is_holiday | BOOLEAN | Company-defined holidays |

### Entity-Relationship Diagram

```
                    +-------------+
                    | dim_date    |
                    +------+------+
                           |
+-------------+    +-------+-------+    +-------------+
| dim_[name1] +----+ fact_[name]   +----+ dim_[name2] |
+-------------+    +-------+-------+    +-------------+
                           |
                    +------+------+
                    | dim_[name3] |
                    +-------------+
```

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Schema type | [Star/Snowflake] | [Why] |
| Grain | [Stated grain] | [Why this level of detail] |
| SCD strategy for dim_[name] | [Type 1/2/3] | [Why] |
| [Other decisions] | [Choice] | [Rationale] |

### Query Patterns

| Question | Query Approach | Tables Joined |
|----------|---------------|---------------|
| [Business question 1] | [GROUP BY dims, SUM measures] | [fact + dims] |
| [Business question 2] | [Filter + aggregate] | [Tables] |
```

## Rules

1. NEVER create a fact table without explicitly stating the grain -- the grain determines everything else about the table
2. Every fact table must have at least one dimension foreign key and at least one measure -- a fact table with no measures is a dimension; a table with no dimension keys is a log
3. ALWAYS create a conformed dim_date dimension that every fact table references -- date is the most common query filter and must be consistent
4. Non-additive measures (ratios, percentages) must NOT be stored directly -- store the numerator and denominator as separate additive measures and calculate the ratio at query time
5. Surrogate keys (auto-increment integers) must be used for all dimension primary keys -- natural keys change, are inconsistent across sources, and are often strings that join slowly
6. SCD Type 2 dimensions must include valid_from, valid_to, and is_current columns -- without valid_to, point-in-time queries are impossible
7. NEVER mix different grains in the same fact table -- if you need both transaction-level and daily snapshot, create two fact tables
8. Star schema is the default recommendation unless the user has a documented reason for snowflake -- star is faster to query and easier to understand
9. Every dimension attribute used as a filter in the top 5 most common queries must be indexed
10. The warehouse design must include estimated row counts and growth rates -- without volume estimates, performance implications cannot be assessed

## Edge Cases

- **Multiple business processes sharing dimensions:** Use conformed dimensions (same dim_customer, dim_product across all fact tables). Do not create process-specific copies of shared dimensions. This enables cross-process analysis (e.g., "customers who bought X and then contacted support").

- **Very high cardinality dimension (millions of unique values):** Consider a "junk dimension" for low-cardinality flag combinations, and a "mini-dimension" for frequently changing attributes. Example: dim_customer has 5M rows and the "age_band" attribute changes annually -- extract age_band into a mini-dimension to avoid Type 2 explosion.

- **Real-time or near-real-time warehouse:** Design a lambda architecture with two layers: a batch layer (standard dimensional model, updated daily) and a speed layer (append-only recent events, merged with batch at query time). Document the merge logic.

- **No clear business process (user just has "a bunch of tables"):** Start from the business questions, not the data. Ask: "What is the most important question you need to answer?" Then identify which tables contain the answer. Design the fact table from the answer backward to the source.

- **Late-arriving facts or dimensions:** Design the ETL to handle records that arrive after the expected period. For late facts: load them into the correct time period (not the load date). For late dimensions: if SCD Type 2, create a "placeholder" row and update when the dimension arrives.

## Example

**Input:** "Design a data warehouse for our e-commerce business. We need to analyze sales by product, customer, time, and promotion. We also want to track inventory levels."

**Output:**

## Data Warehouse Design: E-Commerce Analytics Warehouse

### Overview
- **Business processes:** Sales transactions, Inventory snapshots
- **Schema type:** Star schema
- **Primary consumers:** BI analysts (Tableau), Finance team (monthly reports), Merchandising team (inventory planning)
- **Source systems:** Shopify (orders), ERP (inventory), CRM (customer profiles), Promotions engine

### Fact Tables

#### fact_sales
- **Grain:** One row = one order line item (one product in one order)
- **Estimated volume:** 5,000 rows/day (~1.8M/year), retained indefinitely
- **Retention:** Permanent (partitioned by order_date_key, yearly)

| Column | Type | Measure Type | Description |
|--------|------|-------------|-------------|
| sale_key | BIGINT | -- | Surrogate primary key |
| order_id | VARCHAR(20) | Degenerate dim | Order identifier (not a FK; stored in the fact for drill-through) |
| order_date_key | INT | FK -> dim_date.date_key | Date the order was placed |
| customer_key | BIGINT | FK -> dim_customer.id | Customer who placed the order |
| product_key | BIGINT | FK -> dim_product.id | Product purchased |
| promotion_key | BIGINT | FK -> dim_promotion.id | Promotion applied (0 = no promotion) |
| quantity | INT | Additive | Units purchased |
| unit_price | DECIMAL(10,2) | Non-additive | Price per unit (do not SUM; use for avg price calc) |
| gross_revenue | DECIMAL(10,2) | Additive | quantity x unit_price before discounts |
| discount_amount | DECIMAL(10,2) | Additive | Total discount applied |
| net_revenue | DECIMAL(10,2) | Additive | gross_revenue - discount_amount |
| tax_amount | DECIMAL(10,2) | Additive | Tax charged |
| shipping_cost | DECIMAL(10,2) | Additive | Shipping allocated to this line item |

#### fact_inventory_snapshot
- **Grain:** One row = one product per warehouse per day (daily periodic snapshot)
- **Estimated volume:** 10,000 rows/day (2,000 products x 5 warehouses), retained for 2 years
- **Retention:** 2 years rolling

| Column | Type | Measure Type | Description |
|--------|------|-------------|-------------|
| snapshot_date_key | INT | FK -> dim_date.date_key | Snapshot date |
| product_key | BIGINT | FK -> dim_product.id | Product being tracked |
| warehouse_key | BIGINT | FK -> dim_warehouse.id | Warehouse location |
| quantity_on_hand | INT | Semi-additive | Units in stock (sum across warehouses, NOT across dates) |
| quantity_reserved | INT | Semi-additive | Units reserved for pending orders |
| quantity_available | INT | Semi-additive | on_hand - reserved |
| reorder_flag | BOOLEAN | Non-additive | True if available < reorder_point |

### Dimension Tables

#### dim_customer (SCD Type 2)
- **SCD Type:** Type 2 (track address and segment changes)
- **Estimated rows:** 100,000 (with ~10% having multiple historical rows)

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Surrogate key |
| customer_natural_key | VARCHAR(20) | Business customer ID |
| name | VARCHAR(200) | Full name |
| email | VARCHAR(255) | Email address |
| city | VARCHAR(100) | City |
| state | VARCHAR(50) | State/province |
| country | VARCHAR(50) | Country |
| customer_segment | VARCHAR(20) | VIP, Regular, New (derived from purchase history) |
| first_order_date | DATE | Date of first purchase |
| valid_from | DATE | SCD2 effective start |
| valid_to | DATE | SCD2 effective end (9999-12-31 for current) |
| is_current | BOOLEAN | True for the active row |

#### dim_product (SCD Type 1)
- **SCD Type:** Type 1 (overwrite; product attributes are corrected, not tracked historically)
- **Estimated rows:** 2,000

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Surrogate key |
| sku | VARCHAR(20) | Product SKU |
| product_name | VARCHAR(200) | Display name |
| category | VARCHAR(50) | Top-level category |
| subcategory | VARCHAR(50) | Second-level category |
| brand | VARCHAR(100) | Brand name |
| cost_price | DECIMAL(10,2) | Current cost (for margin calculation) |
| is_active | BOOLEAN | Currently for sale |

#### dim_promotion (SCD Type 1)
- **Estimated rows:** 500

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Surrogate key (0 = no promotion) |
| promotion_code | VARCHAR(20) | Promo code |
| promotion_name | VARCHAR(100) | Descriptive name |
| discount_type | VARCHAR(20) | percentage, fixed_amount, buy_x_get_y |
| discount_value | DECIMAL(10,2) | Discount amount or percentage |
| start_date | DATE | Promotion start |
| end_date | DATE | Promotion end |

#### dim_warehouse (SCD Type 1)
- **Estimated rows:** 5

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Surrogate key |
| warehouse_code | VARCHAR(10) | Internal code |
| warehouse_name | VARCHAR(100) | Display name |
| city | VARCHAR(100) | Location city |
| region | VARCHAR(50) | Geographic region |

#### dim_date (Conformed)

| Column | Type | Description |
|--------|------|-------------|
| date_key | INT | YYYYMMDD integer key |
| full_date | DATE | Calendar date |
| day_of_week | VARCHAR(10) | Monday through Sunday |
| day_of_month | INT | 1-31 |
| month_number | INT | 1-12 |
| month_name | VARCHAR(10) | January through December |
| quarter | VARCHAR(6) | Q1-2026 format |
| year | INT | Calendar year |
| fiscal_quarter | VARCHAR(6) | Fiscal quarter (if different) |
| is_weekend | BOOLEAN | Saturday or Sunday |
| is_holiday | BOOLEAN | Company-defined holidays |

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Schema type | Star | BI tool compatibility (Tableau performs best with star); simpler queries for analyst team |
| Sales grain | Order line item | Most atomic level; enables both per-product and per-order analysis |
| Inventory grain | Daily snapshot per product per warehouse | Daily granularity balances storage cost with analysis need; sub-daily not required |
| Customer SCD | Type 2 | Segment and location changes matter for historical analysis ("what segment was this customer in when they purchased?") |
| Product SCD | Type 1 | Product corrections should update in place; historical product attribute tracking not required |
| unit_price as non-additive | Store in fact but mark as non-additive | Analysts need it for drill-through; SUM(unit_price) is meaningless but AVG and per-row display are useful |

### Query Patterns

| Question | Query Approach | Tables Joined |
|----------|---------------|---------------|
| Monthly revenue by category | GROUP BY dim_date.month_name, dim_product.category; SUM(net_revenue) | fact_sales + dim_date + dim_product |
| Customer segment contribution to revenue | GROUP BY dim_customer.customer_segment; SUM(net_revenue) | fact_sales + dim_customer (WHERE is_current = true) |
| Promotion effectiveness (revenue with vs without) | GROUP BY dim_promotion.promotion_name; SUM(net_revenue), AVG(discount_amount) | fact_sales + dim_promotion |
| Current inventory levels by category | GROUP BY dim_product.category, dim_warehouse.region; SUM(quantity_available) WHERE date_key = today | fact_inventory_snapshot + dim_product + dim_warehouse + dim_date |
