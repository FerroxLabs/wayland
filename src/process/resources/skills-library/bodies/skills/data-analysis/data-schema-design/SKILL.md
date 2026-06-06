---
name: data-schema-design
description: |
  Produces a relational or dimensional data schema with entities, attributes, data types, keys, relationships, normalization decisions with rationale, and a schema diagram description. Outputs a complete schema specification ready for implementation.
  Use when the user asks to design a database schema, define tables and relationships, model data entities, or plan a data structure for a new system or analytics layer.
  Do NOT use for data warehouse star/snowflake design (use data-warehouse-design), ETL pipeline logic (use etl-pipeline-design), or application code database migrations (that is software engineering).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science sql template"
  category: "data-analysis"
  subcategory: "data-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Data Schema Design

## When to Use

**Use this skill when:**
- User asks to design a database schema for a new project or data domain
- User wants to define entities, relationships, and attributes for a data model
- User needs to decide on normalization level (1NF through 3NF, or denormalized)
- User asks to model a business domain as tables and relationships
- User wants to document an existing schema or redesign one with structural problems

**Do NOT use when:**
- User wants a star or snowflake schema for a data warehouse (use `data-warehouse-design`)
- User wants to design the data pipeline (ETL logic) to populate the schema (use `etl-pipeline-design`)
- User wants to write application code for database migrations (that is software engineering)
- User wants to define data quality rules for existing tables (use `data-quality-rules`)

## Process

1. **Identify the domain and requirements.** Ask the user:
   - What business domain are you modeling? (e-commerce, CRM, inventory, HR, content management)
   - What are the primary entities? (the "nouns" in the business: customers, orders, products, employees)
   - What are the key business operations? (placing orders, tracking inventory, managing campaigns)
   - What queries will run against this schema? (reporting, transactional lookups, analytics aggregations)
   - What is the expected data volume? (rows per table, growth rate)
   - What is the primary access pattern? (OLTP: many small reads and writes, or OLAP: fewer large analytical queries)

2. **Identify entities and relationships.** For each entity:
   - Name the entity (singular noun, snake_case for table name)
   - List the attributes (columns) with their data types
   - Identify the primary key (prefer surrogate keys for flexibility, natural keys for simplicity)
   - Identify foreign keys (references to other entities)
   - Classify relationships:
     - **One-to-one:** Each row in A maps to exactly one row in B (rare; consider merging tables)
     - **One-to-many:** Each row in A maps to many rows in B (most common; FK on the "many" side)
     - **Many-to-many:** Each row in A maps to many rows in B and vice versa (requires a junction table)

3. **Apply normalization.** Normalize to eliminate redundancy:
   - **1NF:** Each column holds a single atomic value (no arrays or nested structures in a cell)
   - **2NF:** Every non-key attribute depends on the full primary key (no partial dependencies in composite keys)
   - **3NF:** No transitive dependencies (if A determines B and B determines C, move C to a separate table keyed by B)
   - **When to denormalize:** If a specific query pattern is extremely common and joins are prohibitively expensive, intentionally denormalize by adding redundant columns. Document the trade-off.

4. **Define constraints and indexes.** For each table:
   - **NOT NULL constraints:** Which columns must always have a value
   - **UNIQUE constraints:** Which columns or combinations must be unique
   - **CHECK constraints:** Value range or format restrictions
   - **DEFAULT values:** What value is assigned if none is provided
   - **Indexes:** Which columns are frequently used in WHERE clauses, JOIN conditions, or ORDER BY clauses

5. **Produce the schema diagram description.** Describe the visual entity-relationship diagram:
   - List each table as a box with column names and types
   - Draw relationships as lines between tables with cardinality notation (1:N, N:M)
   - Mark primary keys (PK) and foreign keys (FK)

6. **Document design decisions.** For each non-obvious choice:
   - Why this normalization level was chosen
   - Why surrogate vs. natural keys
   - Why specific data types (VARCHAR(255) vs. TEXT, INT vs. BIGINT)
   - What trade-offs were made (space vs. query performance, simplicity vs. flexibility)

## Output Format

```
## Data Schema: [Domain Name]

### Overview
- **Domain:** [Business domain]
- **Access pattern:** [OLTP / OLAP / Mixed]
- **Normalization level:** [1NF / 2NF / 3NF / Denormalized with rationale]
- **Key convention:** [Surrogate / Natural / Hybrid]
- **Naming convention:** [snake_case tables, singular nouns, prefixed FKs]

### Entity-Relationship Diagram (Text Description)

[table_a] 1---N [table_b] (table_a.id = table_b.table_a_id)
[table_b] N---M [table_c] via [table_b_table_c] junction
[table_a] 1---1 [table_d] (table_a.id = table_d.table_a_id)

### Table Definitions

#### [table_name]
**Purpose:** [What this table represents]
**Estimated volume:** [Expected row count and growth rate]

| Column | Type | Nullable | Default | Constraint | Description |
|--------|------|----------|---------|------------|-------------|
| id | BIGINT | N | AUTO_INCREMENT | PK | Surrogate primary key |
| [col_1] | [type] | [Y/N] | [default] | [constraint] | [Description] |
| [col_2] | [type] | [Y/N] | [default] | [FK -> table.col] | [Description] |
| created_at | TIMESTAMP | N | CURRENT_TIMESTAMP | -- | Row creation time |
| updated_at | TIMESTAMP | N | CURRENT_TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last modification |

**Indexes:**
- idx_[table]_[col]: [Column(s)] -- [Rationale for index]
- unique_[table]_[col]: [Column(s)] UNIQUE -- [Rationale]

[Repeat for each table]

### Design Decisions

| Decision | Choice | Rationale | Trade-off |
|----------|--------|-----------|-----------|
| [Decision 1] | [Choice made] | [Why] | [What was sacrificed] |
| [Decision 2] | [Choice] | [Why] | [Trade-off] |

### Migration Notes
- **Table creation order:** [Order respecting FK dependencies]
- **Seed data:** [Any reference tables that need initial data]
- **Backfill strategy:** [How to populate from existing data sources]
```

## Rules

1. NEVER design a schema without understanding the primary access pattern (OLTP vs OLAP) -- the same business domain requires different schemas for transactional vs analytical use
2. Every table must have a primary key -- tables without primary keys cause join ambiguity and prevent updates
3. Foreign key relationships must be explicitly defined with the referenced table and column -- implicit relationships break data integrity
4. ALWAYS include created_at and updated_at timestamps on every table -- they are essential for debugging, auditing, and incremental ETL
5. Data types must be specific: use VARCHAR(100) not VARCHAR, use DECIMAL(10,2) for money not FLOAT, use DATE for dates not VARCHAR
6. NEVER store calculated values that can be derived from other columns in the same row unless there is a documented performance justification
7. Many-to-many relationships require a junction table -- never store comma-separated IDs in a single column
8. Naming must be consistent: snake_case, singular nouns for table names, _id suffix for foreign keys, _at suffix for timestamps
9. ALWAYS document why denormalization was chosen when it occurs -- denormalization without rationale becomes accidental redundancy
10. Index design must follow query patterns: do not index every column, do index every foreign key and every column used in frequent WHERE clauses

## Edge Cases

- **Polymorphic relationships (one FK points to multiple table types):** Avoid polymorphic FKs (a comment.target_id that could reference either a post or a product). Instead, use separate FK columns (comment.post_id, comment.product_id) with a CHECK constraint ensuring exactly one is non-null, or use a junction table pattern.

- **Hierarchical data (categories with subcategories, org charts):** Use a self-referencing FK (category.parent_category_id references category.id). For deep hierarchies, add a materialized path column (e.g., "/electronics/computers/laptops") for efficient descendant queries. Note that recursive queries are expensive in most databases.

- **Multi-tenant schema:** Choose between shared schema (tenant_id column on every table, simpler but requires careful WHERE clause discipline) and separate schemas per tenant (stronger isolation, higher management overhead). Document the choice and its implications.

- **Schema for a system not yet built:** Design for the known requirements today. Add extensibility notes (which tables are likely to gain columns, which relationships might change). Do not over-engineer for hypothetical future requirements.

- **Very large tables (billions of rows):** Add partitioning recommendations (by date range, by tenant, by region). Note which indexes become impractical at scale. Consider whether some columns should move to a separate "detail" table to keep the main table's row size small.

## Example

**Input:** "Design a schema for an online course platform. Users can enroll in courses, courses have modules, modules have lessons. Users track their progress through lessons. Instructors create courses."

**Output:**

## Data Schema: Online Course Platform

### Overview
- **Domain:** Online education / course management
- **Access pattern:** Mixed (OLTP for enrollment and progress tracking, OLAP for reporting on completion rates)
- **Normalization level:** 3NF (no redundant data; join-heavy but consistent)
- **Key convention:** Surrogate BIGINT auto-increment IDs for all tables
- **Naming convention:** snake_case, singular nouns, _id suffix for FKs, _at suffix for timestamps

### Entity-Relationship Diagram (Text Description)

```
[user] 1---N [enrollment] N---1 [course]
[user] 1---N [course] (as instructor: course.instructor_id -> user.id)
[course] 1---N [module] 1---N [lesson]
[enrollment] 1---N [lesson_progress] N---1 [lesson]
```

### Table Definitions

#### user
**Purpose:** Stores all platform users (both learners and instructors)
**Estimated volume:** 50,000 rows, growing 2,000/month

| Column | Type | Nullable | Default | Constraint | Description |
|--------|------|----------|---------|------------|-------------|
| id | BIGINT | N | AUTO_INCREMENT | PK | Surrogate primary key |
| email | VARCHAR(255) | N | -- | UNIQUE | Login identifier |
| display_name | VARCHAR(100) | N | -- | -- | User's visible name |
| role | VARCHAR(20) | N | 'learner' | CHECK (role IN ('learner', 'instructor', 'admin')) | Platform role |
| created_at | TIMESTAMP | N | CURRENT_TIMESTAMP | -- | Account creation |
| updated_at | TIMESTAMP | N | CURRENT_TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last profile update |

**Indexes:**
- unique_user_email: email UNIQUE -- Login lookup
- idx_user_role: role -- Filter by role for admin queries

#### course
**Purpose:** Course catalog with metadata and instructor assignment
**Estimated volume:** 500 courses, growing 20/month

| Column | Type | Nullable | Default | Constraint | Description |
|--------|------|----------|---------|------------|-------------|
| id | BIGINT | N | AUTO_INCREMENT | PK | Surrogate primary key |
| title | VARCHAR(200) | N | -- | -- | Course display title |
| description | TEXT | Y | -- | -- | Full course description |
| instructor_id | BIGINT | N | -- | FK -> user.id | Course creator/instructor |
| status | VARCHAR(20) | N | 'draft' | CHECK (status IN ('draft', 'published', 'archived')) | Publication status |
| published_at | TIMESTAMP | Y | -- | -- | When course went live (null if draft) |
| created_at | TIMESTAMP | N | CURRENT_TIMESTAMP | -- | Row creation |
| updated_at | TIMESTAMP | N | CURRENT_TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last edit |

**Indexes:**
- idx_course_instructor: instructor_id -- Instructor's course list
- idx_course_status: status -- Filter published courses for catalog

#### module
**Purpose:** Ordered grouping of lessons within a course
**Estimated volume:** 2,500 (avg 5 modules per course)

| Column | Type | Nullable | Default | Constraint | Description |
|--------|------|----------|---------|------------|-------------|
| id | BIGINT | N | AUTO_INCREMENT | PK | Surrogate primary key |
| course_id | BIGINT | N | -- | FK -> course.id | Parent course |
| title | VARCHAR(200) | N | -- | -- | Module title |
| sort_order | INTEGER | N | 0 | -- | Display order within course (0-based) |
| created_at | TIMESTAMP | N | CURRENT_TIMESTAMP | -- | Row creation |
| updated_at | TIMESTAMP | N | CURRENT_TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last edit |

**Indexes:**
- idx_module_course: course_id -- List modules for a course
- unique_module_course_order: (course_id, sort_order) UNIQUE -- Prevent duplicate ordering

#### lesson
**Purpose:** Individual content units (video, text, quiz) within a module
**Estimated volume:** 15,000 (avg 6 lessons per module)

| Column | Type | Nullable | Default | Constraint | Description |
|--------|------|----------|---------|------------|-------------|
| id | BIGINT | N | AUTO_INCREMENT | PK | Surrogate primary key |
| module_id | BIGINT | N | -- | FK -> module.id | Parent module |
| title | VARCHAR(200) | N | -- | -- | Lesson title |
| content_type | VARCHAR(20) | N | 'text' | CHECK (content_type IN ('video', 'text', 'quiz')) | Content format |
| duration_minutes | INTEGER | Y | -- | -- | Estimated completion time |
| sort_order | INTEGER | N | 0 | -- | Display order within module |
| created_at | TIMESTAMP | N | CURRENT_TIMESTAMP | -- | Row creation |
| updated_at | TIMESTAMP | N | CURRENT_TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last edit |

**Indexes:**
- idx_lesson_module: module_id -- List lessons for a module
- unique_lesson_module_order: (module_id, sort_order) UNIQUE -- Prevent duplicate ordering

#### enrollment
**Purpose:** Tracks which users are enrolled in which courses
**Estimated volume:** 200,000 (avg 400 enrollments per course)

| Column | Type | Nullable | Default | Constraint | Description |
|--------|------|----------|---------|------------|-------------|
| id | BIGINT | N | AUTO_INCREMENT | PK | Surrogate primary key |
| user_id | BIGINT | N | -- | FK -> user.id | Enrolled learner |
| course_id | BIGINT | N | -- | FK -> course.id | Enrolled course |
| enrolled_at | TIMESTAMP | N | CURRENT_TIMESTAMP | -- | Enrollment date |
| completed_at | TIMESTAMP | Y | -- | -- | Course completion date (null if in progress) |
| status | VARCHAR(20) | N | 'active' | CHECK (status IN ('active', 'completed', 'dropped')) | Enrollment status |

**Indexes:**
- unique_enrollment_user_course: (user_id, course_id) UNIQUE -- One enrollment per user per course
- idx_enrollment_course: course_id -- List enrollments for a course
- idx_enrollment_status: status -- Filter active enrollments

#### lesson_progress
**Purpose:** Tracks per-lesson completion status for each enrollment
**Estimated volume:** 3,000,000 (avg 15 lessons x 200,000 enrollments, sparse)

| Column | Type | Nullable | Default | Constraint | Description |
|--------|------|----------|---------|------------|-------------|
| id | BIGINT | N | AUTO_INCREMENT | PK | Surrogate primary key |
| enrollment_id | BIGINT | N | -- | FK -> enrollment.id | Parent enrollment |
| lesson_id | BIGINT | N | -- | FK -> lesson.id | Lesson being tracked |
| status | VARCHAR(20) | N | 'not_started' | CHECK (status IN ('not_started', 'in_progress', 'completed')) | Completion status |
| started_at | TIMESTAMP | Y | -- | -- | First access |
| completed_at | TIMESTAMP | Y | -- | -- | Completion timestamp |

**Indexes:**
- unique_progress_enrollment_lesson: (enrollment_id, lesson_id) UNIQUE -- One progress record per enrollment per lesson
- idx_progress_lesson: lesson_id -- Aggregate completion rates by lesson
- idx_progress_status: status -- Filter by completion status

### Design Decisions

| Decision | Choice | Rationale | Trade-off |
|----------|--------|-----------|-----------|
| Single user table for learners and instructors | Shared table with role column | Simplifies authentication; most instructor data is the same shape as learner data | Instructor-specific fields (bio, payout info) will need a separate instructor_profile table if added later |
| Surrogate keys (BIGINT auto-increment) | Over natural keys | Course titles change, emails change; surrogate keys are stable | Extra join needed when the natural key is what the user searches by |
| 3NF normalization | Over denormalized | Course platform has mixed read/write patterns; consistency matters for enrollment tracking | Reporting queries that join user -> enrollment -> course -> module -> lesson -> progress require 5 joins; may need materialized views for analytics |
| lesson_progress is sparse (created on first access) | Over pre-creating all rows on enrollment | Saves storage for courses with 100+ lessons where most are not started | Reporting must COALESCE missing rows as 'not_started'; COUNT queries must account for gaps |

### Migration Notes
- **Table creation order:** user -> course -> module -> lesson -> enrollment -> lesson_progress (respects FK dependencies)
- **Seed data:** None required; all tables are populated through application operations
- **Backfill strategy:** If migrating from an existing system, load users first, then courses/modules/lessons, then enrollments, then lesson_progress. Validate FK integrity after each table load.
