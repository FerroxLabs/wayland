---
name: data-modeler
description: |
  Expert data modeling covering star schema, snowflake schema, Data Vault 2.0, dimensional modeling, slowly changing dimensions, bridge tables, fact table types, conformed dimensions, ERD creation, and modeling tool usage for building enterprise-grade analytical and operational data models.
  Use when the user asks about data modeler, data modeler best practices, or needs guidance on data modeler implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science sql architecture"
  category: "data-engineering"
  subcategory: "data-modeling"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Data Modeler

## Overview

Data modeling is the discipline of designing the structure, relationships, and constraints of data to support both operational and analytical workloads. This skill covers the full spectrum from third normal form (3NF) operational models through dimensional models for analytics and Data Vault for enterprise data integration.

## Dimensional Modeling (Kimball Methodology)

### Star Schema

The star schema is the foundation of dimensional modeling. A central fact table connects to denormalized dimension tables via foreign keys.

```sql
-- Fact table: one row per measurable event
CREATE TABLE fact_sales (
    sale_key          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    date_key          INT NOT NULL REFERENCES dim_date(date_key),
    product_key       INT NOT NULL REFERENCES dim_product(product_key),
    customer_key      INT NOT NULL REFERENCES dim_customer(customer_key),
    store_key         INT NOT NULL REFERENCES dim_store(store_key),
    promotion_key     INT NOT NULL REFERENCES dim_promotion(promotion_key),

    -- Degenerate dimension (no separate table needed)
    transaction_id    VARCHAR(20) NOT NULL,

    -- Measures (additive)
    quantity_sold     INT NOT NULL,
    unit_price        NUMERIC(10,2) NOT NULL,
    discount_amount   NUMERIC(10,2) NOT NULL DEFAULT 0,
    net_amount        NUMERIC(12,2) NOT NULL,
    cost_amount       NUMERIC(12,2) NOT NULL,
    profit_amount     NUMERIC(12,2) GENERATED ALWAYS AS (net_amount - cost_amount) STORED,

    -- Semi-additive measure
    inventory_on_hand INT,

    -- Non-additive measure
    margin_pct        NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE WHEN net_amount > 0
             THEN ((net_amount - cost_amount) / net_amount * 100)
             ELSE 0 END
    ) STORED
);

-- Dimension table: denormalized descriptive attributes
CREATE TABLE dim_product (
    product_key       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id        VARCHAR(20) NOT NULL,  -- natural/business key
    product_name      VARCHAR(200) NOT NULL,
    brand             VARCHAR(100),
    category          VARCHAR(100),
    subcategory       VARCHAR(100),
    department        VARCHAR(100),
    unit_of_measure   VARCHAR(20),
    is_active         BOOLEAN DEFAULT TRUE,

    -- SCD Type 2 tracking columns
    effective_date    DATE NOT NULL,
    expiration_date   DATE NOT NULL DEFAULT '9999-12-31',
    is_current        BOOLEAN NOT NULL DEFAULT TRUE,
    version           INT NOT NULL DEFAULT 1,
    row_hash          CHAR(32) NOT NULL  -- MD5 of tracked columns
);
```

### Date Dimension (Critical Reference)

```sql
CREATE TABLE dim_date (
    date_key              INT PRIMARY KEY,          -- YYYYMMDD format
    full_date             DATE NOT NULL UNIQUE,
    day_of_week           SMALLINT NOT NULL,         -- 1=Monday, 7=Sunday
    day_name              VARCHAR(10) NOT NULL,
    day_of_month          SMALLINT NOT NULL,
    day_of_year           SMALLINT NOT NULL,
    week_of_year          SMALLINT NOT NULL,
    iso_week              SMALLINT NOT NULL,
    month_number          SMALLINT NOT NULL,
    month_name            VARCHAR(10) NOT NULL,
    month_name_short      CHAR(3) NOT NULL,
    quarter_number        SMALLINT NOT NULL,
    quarter_name          CHAR(2) NOT NULL,         -- Q1-Q4
    year_number           INT NOT NULL,
    fiscal_year           INT NOT NULL,
    fiscal_quarter        SMALLINT NOT NULL,
    fiscal_month          SMALLINT NOT NULL,
    is_weekend            BOOLEAN NOT NULL,
    is_holiday            BOOLEAN NOT NULL DEFAULT FALSE,
    holiday_name          VARCHAR(50),
    is_business_day       BOOLEAN NOT NULL,
    year_month            CHAR(7) NOT NULL,         -- YYYY-MM
    year_quarter          CHAR(7) NOT NULL,         -- YYYY-Q#

    -- Relative flags (updated daily by a process)
    is_current_day        BOOLEAN DEFAULT FALSE,
    is_current_month      BOOLEAN DEFAULT FALSE,
    is_current_quarter    BOOLEAN DEFAULT FALSE,
    is_current_year       BOOLEAN DEFAULT FALSE,
    days_ago              INT,
    months_ago            INT
);

-- Generate 20 years of dates
INSERT INTO dim_date
SELECT
    TO_CHAR(d, 'YYYYMMDD')::INT AS date_key,
    d AS full_date,
    EXTRACT(ISODOW FROM d)::SMALLINT AS day_of_week,
    TO_CHAR(d, 'Day') AS day_name,
    EXTRACT(DAY FROM d)::SMALLINT AS day_of_month,
    EXTRACT(DOY FROM d)::SMALLINT AS day_of_year,
    EXTRACT(WEEK FROM d)::SMALLINT AS week_of_year,
    EXTRACT(ISOYEAR FROM d)::SMALLINT AS iso_week,
    EXTRACT(MONTH FROM d)::SMALLINT AS month_number,
    TO_CHAR(d, 'Month') AS month_name,
    TO_CHAR(d, 'Mon') AS month_name_short,
    EXTRACT(QUARTER FROM d)::SMALLINT AS quarter_number,
    'Q' || EXTRACT(QUARTER FROM d) AS quarter_name,
    EXTRACT(YEAR FROM d)::INT AS year_number,
    -- Fiscal year starting in July
    CASE WHEN EXTRACT(MONTH FROM d) >= 7
         THEN EXTRACT(YEAR FROM d)::INT + 1
         ELSE EXTRACT(YEAR FROM d)::INT END AS fiscal_year,
    CASE WHEN EXTRACT(MONTH FROM d) >= 7
         THEN ((EXTRACT(MONTH FROM d) - 7) / 3 + 1)::SMALLINT
         ELSE ((EXTRACT(MONTH FROM d) + 5) / 3 + 1)::SMALLINT END AS fiscal_quarter,
    CASE WHEN EXTRACT(MONTH FROM d) >= 7
         THEN (EXTRACT(MONTH FROM d) - 6)::SMALLINT
         ELSE (EXTRACT(MONTH FROM d) + 6)::SMALLINT END AS fiscal_month,
    EXTRACT(ISODOW FROM d) IN (6, 7) AS is_weekend,
    FALSE AS is_holiday,
    NULL AS holiday_name,
    EXTRACT(ISODOW FROM d) NOT IN (6, 7) AS is_business_day,
    TO_CHAR(d, 'YYYY-MM') AS year_month,
    EXTRACT(YEAR FROM d) || '-Q' || EXTRACT(QUARTER FROM d) AS year_quarter,
    FALSE, FALSE, FALSE, FALSE, NULL, NULL
FROM generate_series('2015-01-01'::DATE, '2035-12-31'::DATE, '1 day') AS d;
```

### Snowflake Schema

Normalizes dimension tables into sub-dimensions. Reduces storage but increases query complexity with additional joins.

```
fact_sales
  -> dim_product
       -> dim_brand
       -> dim_category
            -> dim_department
  -> dim_store
       -> dim_city
            -> dim_state
                 -> dim_country
  -> dim_date
```

**When to use snowflake over star**:
- Dimension tables are very large (>10M rows) and share sub-dimensions
- Storage cost is a primary concern
- Query patterns always filter on sub-dimension attributes
- ETL team prefers normalized source-of-truth dimensions

**When to prefer star**:
- Query performance is the priority (fewer joins)
- BI tools work better with flat dimensions
- Dimension tables are small-to-medium (<1M rows)
- Team prefers simplicity

## Data Vault 2.0

Data Vault is an enterprise modeling methodology designed for agility, auditability, and parallel loading.

### Core Components

```sql
-- HUB: Business keys (immutable once loaded)
CREATE TABLE hub_customer (
    hub_customer_hk   CHAR(32) PRIMARY KEY,   -- Hash of business key
    customer_bk       VARCHAR(50) NOT NULL,    -- Business key
    load_date         TIMESTAMP NOT NULL,
    record_source     VARCHAR(100) NOT NULL,
    UNIQUE (customer_bk)
);

-- LINK: Relationships between hubs
CREATE TABLE link_order (
    link_order_hk       CHAR(32) PRIMARY KEY,   -- Hash of all parent HKs
    hub_customer_hk     CHAR(32) NOT NULL REFERENCES hub_customer,
    hub_product_hk      CHAR(32) NOT NULL REFERENCES hub_product,
    hub_store_hk        CHAR(32) NOT NULL REFERENCES hub_store,
    order_bk            VARCHAR(50) NOT NULL,   -- Degenerate key
    load_date           TIMESTAMP NOT NULL,
    record_source       VARCHAR(100) NOT NULL,
    UNIQUE (hub_customer_hk, hub_product_hk, hub_store_hk, order_bk)
);

-- SATELLITE: Descriptive attributes (change tracked)
CREATE TABLE sat_customer_details (
    hub_customer_hk     CHAR(32) NOT NULL REFERENCES hub_customer,
    load_date           TIMESTAMP NOT NULL,
    load_end_date       TIMESTAMP DEFAULT '9999-12-31',
    record_source       VARCHAR(100) NOT NULL,
    hash_diff           CHAR(32) NOT NULL,      -- Hash of all attributes

    -- Descriptive attributes
    first_name          VARCHAR(100),
    last_name           VARCHAR(100),
    email               VARCHAR(200),
    phone               VARCHAR(20),
    tier                VARCHAR(20),

    PRIMARY KEY (hub_customer_hk, load_date)
);

-- EFFECTIVITY SATELLITE: Tracks relationship validity over time
CREATE TABLE eff_sat_order (
    link_order_hk       CHAR(32) NOT NULL REFERENCES link_order,
    load_date           TIMESTAMP NOT NULL,
    load_end_date       TIMESTAMP DEFAULT '9999-12-31',
    record_source       VARCHAR(100) NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,

    PRIMARY KEY (link_order_hk, load_date)
);

-- POINT-IN-TIME (PIT) table: precomputed join optimization
CREATE TABLE pit_customer (
    hub_customer_hk              CHAR(32) NOT NULL,
    snapshot_date                TIMESTAMP NOT NULL,
    sat_customer_details_ldts   TIMESTAMP,
    sat_customer_contact_ldts   TIMESTAMP,
    sat_customer_finance_ldts   TIMESTAMP,

    PRIMARY KEY (hub_customer_hk, snapshot_date)
);
```

### Data Vault Loading Pattern

```python
import hashlib

def hash_key(*business_keys):
    """Generate hash key from business key components."""
    concatenated = '||'.join(str(k).strip().upper() for k in business_keys)
    # MD5 used for non-cryptographic checksum/routing only. Do NOT use MD5 for passwords or security.
    return hashlib.md5(concatenated.encode('utf-8')).hexdigest()

def hash_diff(**attributes):
    """Generate hash diff from satellite attributes for change detection."""
    concatenated = '||'.join(
        str(attributes.get(k, '')).strip()
        for k in sorted(attributes.keys())
    )
    # MD5 used for non-cryptographic checksum only. Do NOT use MD5 for passwords or security.
    return hashlib.md5(concatenated.encode('utf-8')).hexdigest()

def load_hub(source_df, hub_table, business_key_col, record_source, engine):
    """Load hub table - insert only new business keys."""
    source_df['hub_hk'] = source_df[business_key_col].apply(hash_key)
    source_df['load_date'] = pd.Timestamp.utcnow()
    source_df['record_source'] = record_source

    # Only insert keys not already present
    sql = f"""
        INSERT INTO {hub_table} (hub_hk, business_key, load_date, record_source)
        SELECT hub_hk, business_key, load_date, record_source
        FROM staging
        WHERE hub_hk NOT IN (SELECT hub_hk FROM {hub_table})
    """
```

## Fact Table Types

### Transaction Fact Table
- One row per event/transaction
- Most common type
- Additive measures
- Example: `fact_sales`, `fact_clicks`

### Periodic Snapshot Fact Table
- One row per entity per time period
- Semi-additive measures (cannot sum across time)
- Example: `fact_account_daily_balance`, `fact_inventory_weekly`

```sql
CREATE TABLE fact_account_daily_snapshot (
    date_key          INT NOT NULL REFERENCES dim_date,
    account_key       INT NOT NULL REFERENCES dim_account,

    -- Semi-additive: do NOT sum across dates
    balance           NUMERIC(15,2) NOT NULL,
    credit_limit      NUMERIC(15,2),

    -- Additive within snapshot
    transactions_count INT NOT NULL DEFAULT 0,
    deposits_amount    NUMERIC(15,2) DEFAULT 0,
    withdrawals_amount NUMERIC(15,2) DEFAULT 0,

    PRIMARY KEY (date_key, account_key)
);
```

### Accumulating Snapshot Fact Table
- One row per entity lifecycle (updated as milestones are reached)
- Multiple date keys tracking progress through a process
- Example: `fact_order_fulfillment`, `fact_claim_processing`

```sql
CREATE TABLE fact_order_fulfillment (
    order_key              BIGINT PRIMARY KEY,
    order_date_key         INT REFERENCES dim_date,
    payment_date_key       INT REFERENCES dim_date,
    ship_date_key          INT REFERENCES dim_date,
    delivery_date_key      INT REFERENCES dim_date,
    return_date_key        INT REFERENCES dim_date,

    customer_key           INT REFERENCES dim_customer,
    product_key            INT REFERENCES dim_product,

    -- Lag measures (computed on update)
    days_to_payment        INT,
    days_to_ship           INT,
    days_to_deliver        INT,
    days_to_return         INT,

    order_amount           NUMERIC(12,2),
    current_status         VARCHAR(20)
);
```

### Factless Fact Table
- Records events or conditions with no measures
- Example: student enrollment, event attendance, coverage eligibility

```sql
CREATE TABLE fact_student_enrollment (
    date_key       INT NOT NULL REFERENCES dim_date,
    student_key    INT NOT NULL REFERENCES dim_student,
    course_key     INT NOT NULL REFERENCES dim_course,
    instructor_key INT NOT NULL REFERENCES dim_instructor,
    PRIMARY KEY (date_key, student_key, course_key)
);
```

## Bridge Tables

Bridge tables resolve many-to-many relationships between facts and dimensions.

```sql
-- Patient can have multiple diagnoses per visit
CREATE TABLE bridge_diagnosis (
    diagnosis_group_key  INT NOT NULL,
    diagnosis_key        INT NOT NULL REFERENCES dim_diagnosis,
    diagnosis_rank       SMALLINT NOT NULL,       -- primary=1, secondary=2, etc.
    weighting_factor     NUMERIC(5,4) NOT NULL,   -- weights sum to 1.0 per group
    PRIMARY KEY (diagnosis_group_key, diagnosis_key)
);

-- Fact table references the bridge group
CREATE TABLE fact_medical_visit (
    visit_key            BIGINT PRIMARY KEY,
    patient_key          INT REFERENCES dim_patient,
    provider_key         INT REFERENCES dim_provider,
    date_key             INT REFERENCES dim_date,
    diagnosis_group_key  INT NOT NULL,  -- FK to bridge
    total_charge         NUMERIC(12,2)
);

-- Query using bridge with weighting to avoid double-counting
SELECT
    d.diagnosis_name,
    SUM(f.total_charge * b.weighting_factor) AS weighted_charges
FROM fact_medical_visit f
JOIN bridge_diagnosis b ON f.diagnosis_group_key = b.diagnosis_group_key
JOIN dim_diagnosis d ON b.diagnosis_key = d.diagnosis_key
GROUP BY d.diagnosis_name;
```

## Conformed Dimensions

Conformed dimensions are shared across multiple fact tables and business processes, ensuring consistent reporting.

### Design Principles

1. **Single source of truth**: One `dim_customer` used by sales, support, marketing
2. **Consistent grain**: Same business key definition across all consumers
3. **Shared attributes**: Common descriptive columns with identical meanings
4. **Bus matrix**: Documents which dimensions are used by which business processes

```
Business Process Matrix (Bus Matrix):
                     | dim_date | dim_customer | dim_product | dim_store | dim_employee |
---------------------+----------+--------------+-------------+-----------+--------------+
fact_sales           |    X     |      X       |      X      |     X     |      X       |
fact_inventory       |    X     |              |      X      |     X     |              |
fact_customer_svc    |    X     |      X       |      X      |           |      X       |
fact_web_clickstream |    X     |      X       |      X      |           |              |
fact_hr_attendance   |    X     |              |             |     X     |      X       |
```

## Slowly Changing Dimensions Decision Guide

| SCD Type | Behavior | History | Storage | Complexity | Use When |
|----------|----------|---------|---------|------------|----------|
| Type 0 | Never changes | N/A | Minimal | Lowest | Fixed attributes (birthdate, SSN) |
| Type 1 | Overwrite | Lost | Minimal | Low | Corrections, non-historical attributes |
| Type 2 | New row | Full | High | Medium | Track all changes (address, status) |
| Type 3 | New column | Previous only | Moderate | Low | Only care about previous value |
| Type 4 | Mini-dimension | In separate table | Moderate | Medium | Rapidly changing attributes |
| Type 6 | Hybrid 1+2+3 | Full + current | Highest | Highest | Need both current and historical views |

## ERD Creation Best Practices

### Naming Conventions

```
Tables:
  - Fact tables:      fact_{business_process}          (fact_sales)
  - Dimension tables: dim_{entity}                     (dim_customer)
  - Bridge tables:    bridge_{relationship}             (bridge_diagnosis)
  - Staging tables:   stg_{source}_{entity}            (stg_crm_contact)
  - Hub tables:       hub_{entity}                     (hub_customer)
  - Link tables:      link_{relationship}              (link_order)
  - Satellite tables: sat_{hub/link}_{descriptor}      (sat_customer_details)

Columns:
  - Surrogate keys:   {table_name}_key or {table_name}_sk
  - Business keys:    {entity}_bk or {entity}_id
  - Foreign keys:     {referenced_dimension}_key
  - Hash keys:        {entity}_hk (Data Vault)
  - Measures:         descriptive name ({quantity_sold}, {net_amount})
  - Dates:            {event}_date or {event}_at
  - Flags:            is_{condition} (is_active, is_current)
```

### Model Documentation

Every model should include:
1. **Grain statement**: "One row per [X] per [Y] per [Z]"
2. **Source mapping**: Which source systems feed each column
3. **Business rules**: How derived columns are calculated
4. **SCD strategy**: Which type applies to each dimension attribute
5. **Refresh frequency**: How often the table is updated
6. **Row count estimates**: Expected volume and growth rate
7. **Partitioning strategy**: If applicable for the target platform

## Modeling Anti-Patterns

1. **Centipede fact table**: Too many dimensions joined directly; use bridge tables or junk dimensions
2. **Enterprise bus without conformed dimensions**: Siloed facts that cannot be compared
3. **Overloaded dimensions**: Mixing unrelated entities in one dimension (customer + vendor)
4. **Missing surrogate keys**: Using natural keys as PKs prevents SCD Type 2
5. **Null foreign keys**: Use "Unknown" or "Not Applicable" dimension rows instead
6. **Inappropriate grain**: Mixing daily and monthly granularity in the same fact table
7. **Header/line fact split**: Breaking an order into separate header and line fact tables when a single line-level fact suffices

## When to Use

**Use this skill when:**
- Designing or implementing data modeler solutions
- Reviewing or improving existing data modeler approaches
- Making architectural or implementation decisions about data modeler
- Learning data modeler patterns and best practices
- Troubleshooting data modeler-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Data Modeler Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement data modeler for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended data modeler approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When data modeler must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
