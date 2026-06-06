---
name: data-catalog-setup
description: |
  Produces a data catalog structure with table documentation templates, column-level lineage format, and governance tagging taxonomy. Outputs a complete catalog specification for organizing and discovering data assets across an organization.
  Use when the user asks to set up a data catalog, document their data assets, create a data dictionary, or establish data governance metadata standards.
  Do NOT use for data schema design (use data-schema-design), data quality rule definitions (use data-quality-rules), or ETL pipeline documentation (use etl-pipeline-design).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science template checklist"
  category: "data-analysis"
  subcategory: "data-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Data Catalog Setup

## When to Use

**Use this skill when:**
- The user wants to create a data catalog, data dictionary, or metadata registry for one or more databases, schemas, or data platforms from scratch
- The user wants to document existing tables and columns so analysts and business stakeholders can find and trust data without asking engineers every time
- The user needs to establish governance metadata standards -- ownership, sensitivity classification, retention policy, PII flags -- as the foundation of a data governance program
- The user wants to reduce "which table should I use?" questions by making data assets self-describing and discoverable across teams
- The user is onboarding analysts or data scientists who need to understand the data landscape without access to the original developers who built it
- The user wants to create column-level lineage documentation that shows where data originates, how it is transformed, and what downstream reports or models depend on it
- The user is preparing for a compliance audit (GDPR, CCPA, HIPAA) and needs a complete inventory of where personal data lives and how it flows

**Do NOT use when:**
- The user wants to design a new database schema or data model from scratch -- use `data-schema-design` instead
- The user wants to define and implement data quality rules, checks, or SLA monitoring -- use `data-quality-rules` instead
- The user wants to design or document an ETL or ELT pipeline -- use `etl-pipeline-design` instead
- The user wants to set up alerting and monitoring for data pipeline failures or freshness -- use `data-pipeline-monitoring` instead
- The user is asking about a specific BI tool's metadata layer (e.g., dbt's documentation features or Tableau's data dictionary) -- those are tool-specific documentation tasks, not enterprise catalog setup
- The user wants to profile data statistically (null rates, cardinality, distributions) -- data profiling is an input to catalog enrichment but is its own distinct task

---

## Process

### Step 1: Assess the Catalog Scope and Constraints

Before producing any templates, establish the context that determines every downstream decision.

- **Inventory the data landscape:** Ask how many databases, schemas, and tables are in scope. Fewer than 50 tables can be managed in a wiki (Notion, Confluence) or spreadsheet. 50--500 tables typically warrant a lightweight open-source tool (DataHub, Amundsen, OpenMetadata). More than 500 tables should use a purpose-built catalog platform (Collibra, Alation, Atlan) with automated metadata ingestion.
- **Identify the primary catalog consumers:** Analysts need discoverability (search by business term, sample data). Data engineers need lineage and schema evolution history. Compliance teams need PII inventory and retention schedules. Business stakeholders need data definitions and ownership contacts. The primary consumer determines which fields to populate first.
- **Determine what tooling exists:** If DataHub or Amundsen is already deployed, focus on enrichment templates (descriptions, owners, tags) rather than structural design. If the catalog is greenfield, choose the right tool tier before designing templates.
- **Establish the governance maturity level:** Organizations with no existing governance start with three mandatory fields only (description, owner, PII flag) and add complexity in phases. Organizations with existing governance programs need to map the new catalog to existing classification frameworks (e.g., SOC 2 data categories, NIST data classification levels) from day one.
- **Identify the data steward model:** Who has authority to approve catalog entries and govern tag assignments? A federated model has domain stewards (one per business domain). A centralized model has a data governance office that approves all entries. The model determines who signs off on the catalog maintenance process.
- **Clarify automation vs. manual enrichment:** Automated schema discovery (via database crawlers) handles structural metadata (column names, types, row counts, primary keys). Human enrichment handles semantic metadata (business descriptions, ownership, sensitivity). Design the process to separate these two activities clearly.

---

### Step 2: Define the Governance Tag Taxonomy First

Build the taxonomy before any table templates -- otherwise, tags assigned early will be inconsistent with tags assigned later.

- **Data sensitivity classification must use a four-level hierarchy at minimum:** Public (aggregated, anonymized, shareable externally), Internal (non-sensitive business data, shareable within org), Confidential (sensitive business data, restricted to need-to-know roles), Restricted (highly sensitive data subject to regulatory requirements -- PII, PHI, PCI, financial records). Every column must receive exactly one sensitivity level. "Unknown" is not a valid value.
- **PII must be classified using a sub-taxonomy, not a binary flag:** Personal Identifiers (name, email, SSN, national ID), Quasi-Identifiers (date of birth, zip code, gender -- which can re-identify when combined), Behavioral Data (browsing history, purchase history linked to an individual), and Sensitive Personal Data (health, religion, political affiliation, biometrics). Each sub-type has different masking and retention requirements.
- **Quality tier must have objective, verifiable entry criteria:** Gold requires a documented owner, ≥95% field population rate, an active monitoring SLA (e.g., refreshed within 2 hours of expected run time), and ≥6 months of production history. Silver requires a documented owner and ≥70% field population but no monitoring SLA. Bronze is everything else. Promotion from Bronze to Silver requires completing the documentation template. Promotion from Silver to Gold requires adding quality monitoring.
- **Domain tags must map to actual organizational structures, not aspirational org charts:** Use the domains that exist today (Sales, Marketing, Product, Finance, HR, Operations). Avoid creating sub-domains in phase one -- "Marketing > Paid Acquisition > Google Ads" creates taxonomy depth that no one maintains.
- **Lifecycle tags enable catalog hygiene:** Active (currently used in production), Deprecated (still readable but has a documented replacement), Archived (moved to cold storage, no SLA), Pending-Deletion (scheduled for removal, with a specific deletion date and a migration guide for users). Tables without lifecycle tags default to Active.
- **Regulatory tags enable compliance reporting without manual auditing:** GDPR-Inscope, CCPA-Inscope, HIPAA-Inscope, PCI-DSS-Inscope. These tags are assigned at the table level. A table tagged GDPR-Inscope must have a documented retention schedule, a data subject access request (DSAR) process, and a deletion mechanism documented in the catalog.

---

### Step 3: Design the Table Documentation Template

Each table entry has three layers of metadata: structural (auto-discoverable), governance (assigned by stewards), and semantic (described by subject-matter experts).

- **Structural metadata** is populated by crawlers or schema introspection: table name, schema, database, column names, data types, primary/foreign key constraints, approximate row count, table creation date, last DDL change date, storage size. This layer can be auto-generated and should be.
- **Governance metadata** includes owner (person + team), source system, update frequency, retention policy, quality tier, sensitivity classification, regulatory tags, and lifecycle stage. These fields must have defined owners who are accountable for their accuracy.
- **Semantic metadata** is the hardest to populate and the most valuable: the business description (what this table represents, when to use it, what it does NOT contain), known issues, related tables, and the recommended join paths.
- **Table descriptions must answer four specific questions** to be considered complete: (1) What business event or entity does this table represent? (2) What is the grain of the table -- one row per what? (3) What is the authoritative use case -- what questions is this table designed to answer? (4) What is this table NOT for -- what misconceptions should analysts avoid?
- **Related tables must document join keys explicitly**, not just table names. "sales.customers" is unhelpful. "sales.customers (joined on orders.customer_id = customers.customer_id; note customer_id is nullable for guest checkouts)" is actionable.
- **Known issues must include a workaround where one exists.** "Late-arriving data from POS terminals causes undercounting of same-day sales by 5--15%; compensate by using order_date + 2 days lag for same-day reports" is a complete known issue entry.

---

### Step 4: Design the Column Documentation Format

Column-level documentation is where the catalog delivers the most day-to-day value for analysts and the most compliance value for governance teams.

- **Every column description must pass the "non-expert test":** An analyst who has never seen this database must be able to understand what the column means, what values it can take, and when a null value occurs -- from the description alone, without querying the table.
- **Null semantics must be documented explicitly, not just whether a column is nullable.** There are at least four distinct meanings of NULL: missing (the value exists but was not collected), not applicable (the concept does not apply to this row), unknown (it is unclear whether the value exists), and sentinel (null is used to mean something specific, like "no discount applied"). Documenting which null type applies determines whether analysts should handle nulls with COALESCE, with a filter, or with a CASE statement.
- **Enumeration columns must document the full value set.** A column with 5 possible values must list all 5, their meaning, and whether new values can appear. "status VARCHAR: one of 'active', 'inactive', 'pending_review', 'suspended', 'deleted' -- new values should not appear; alert the data team if a new value is observed" is a complete entry.
- **PII sub-type must be recorded at the column level, not just a binary flag.** Use the sub-taxonomy from Step 2: Personal Identifier, Quasi-Identifier, Sensitive Personal Data, Behavioral Data, or Non-PII. This enables automated masking policy enforcement.
- **Lineage at the column level must distinguish between four transformation types:** (1) Direct copy (source.col -> target.col, no transformation), (2) Type cast (source.varchar -> target.date via CAST), (3) Derived (DATEDIFF(created_at, first_purchase_date)), (4) Lookup (country_code resolved to country_name via reference table). Each transformation type requires different maintenance when source schemas change.
- **Example values for PII columns must always be synthetic.** Use clearly fictional names (Jane Doe, test@example.com, 555-0100) and document them as synthetic. Never paste real customer emails, names, or IDs into catalog documentation.

---

### Step 5: Document Column-Level and Table-Level Lineage

Lineage is the feature that transforms a catalog from a documentation artifact into an operational tool.

- **Lineage has four distinct layers, each requiring different documentation depth:** Source-system lineage (which application or API generates the raw data), ingestion lineage (which pipeline moves the data into the warehouse), transformation lineage (which dbt model, stored procedure, or Spark job creates this table from raw tables), and consumption lineage (which dashboards, reports, ML models, or APIs read from this table).
- **For each table, document at least two hops upstream and two hops downstream.** One-hop lineage ("this table comes from the ETL") is nearly useless when debugging a data incident. Analysts need to trace from the BI report back to the application database in one document.
- **Impact analysis requires downstream lineage to be complete and current.** When a column is deprecated, the catalog must show every downstream consumer that uses it: every dbt model, every Tableau workbook, every Python notebook that references that column. Without this, column deprecations silently break reports.
- **Automated lineage extraction tools work at different scopes:** SQL parsing tools (SQLLineage, OpenLineage) extract lineage from SQL transformations. BI integration connectors extract which tables feed which dashboards. Application-level lineage (which API call triggers which database write) requires manual documentation. Know which layers are automated and which require manual maintenance.
- **Lineage confidence level must be documented.** Automated lineage from SQL parsing is high-confidence. Lineage reconstructed from interview notes is low-confidence and must be flagged as "inferred -- needs validation." Analysts must know whether the lineage they are reading has been verified.
- **Circular lineage is a red flag** -- if Table A feeds Table B feeds Table A, either there is a documentation error or there is an architectural problem (a feedback loop in the data pipeline). Flag these explicitly and escalate for resolution.

---

### Step 6: Define Catalog Maintenance Governance

A catalog that was accurate at launch and is never updated becomes an actively harmful artifact -- analysts trust stale documentation and build on wrong assumptions.

- **Catalog updates must be triggered events, not scheduled events alone.** Every schema change (ALTER TABLE, new table creation, column rename, type change) must generate a catalog update task assigned to the responsible engineer. Relying only on quarterly audits allows 90 days of drift.
- **Define a "stale entry" threshold explicitly:** A table entry is considered stale if its description, owner, or governance tags have not been reviewed in 180 days. A column entry is stale if its lineage has not been reviewed since the last upstream schema change. Stale entries must appear on a dashboard or report consumed by the data governance lead.
- **The pull request / code review process is the best enforcement point for catalog updates.** When an engineer opens a PR that creates or modifies a table, require a catalog update as part of the PR checklist. If the catalog is a separate system (Collibra, DataHub), require a link to the updated catalog entry before the PR can be merged.
- **Assign backup owners for every table.** A single owner creates a single point of failure -- when the owner leaves the company, the table becomes orphaned within weeks. Backup owners are notified when the primary owner is unavailable and are automatically promoted to primary owner if the primary is offboarded.
- **Catalog health metrics must be tracked and reported:** Percentage of tables with descriptions, percentage of columns with PII classification, percentage of Gold tables with valid lineage, number of orphaned tables (no active owner). Report these monthly to the VP of Data or data governance committee. A catalog with <80% description coverage is not yet operationally useful.
- **Sunset process for deprecated tables:** When a table is deprecated, the catalog entry must be updated with (1) the lifecycle tag "Deprecated", (2) the recommended replacement table and migration guide, (3) the sunset date after which the table will be deleted, and (4) a list of all known downstream consumers who must migrate. The entry remains in the catalog (not deleted) for 12 months after the table is removed, so historical searches still surface the migration path.

---

### Step 7: Design the Search and Discovery Interface

The catalog's value is only realized if users can find what they need without already knowing where to look.

- **Business terminology must dominate descriptions, not technical jargon.** Descriptions written for engineers ("OLAP-optimized denormalized fact table from the Kimball star schema") are useless to business users. Descriptions must answer "what business question does this table help me answer?" in plain language.
- **Define a controlled glossary of business terms** linked to catalog entries. "Revenue" must be defined once (gross vs. net, refunds included or excluded, recognition date vs. payment date) and linked to every table and column that represents revenue. When two tables both claim to show "revenue" and return different numbers, the glossary definition resolves the ambiguity.
- **Tag-based navigation must cover at minimum three discovery paths:** By domain (show me all Sales tables), by sensitivity (show me all PII tables for my GDPR audit), and by quality tier (show me only Gold tables for my executive dashboard). A fourth path -- by business entity (show me all tables that contain customer data) -- is highly valuable in organizations with 200+ tables.
- **"Frequently joined with" relationships must be surfaced in the UI.** Analysts discover data through association -- "I'm using orders, what else should I know about?" The catalog must recommend related tables based on documented join relationships, not leave the analyst to guess.
- **Sample data (non-PII columns only) dramatically improves usability.** Showing 5 representative rows from a table helps analysts validate that this is the right table before writing a 100-line query. PII columns must show synthetic examples or be masked to [REDACTED] in catalog previews.

---

### Step 8: Choose the Right Tool Tier and Migration Path

The tool choice must match the organization's scale, budget, and engineering capacity.

- **Tier 0 (1--30 tables, no dedicated data team):** Maintain a spreadsheet or Notion database with the standard template. Export to CSV for compliance audits. Cost: zero. Limitation: no automated discovery, no lineage visualization, no search across fields. Migrate to Tier 1 when the team reaches 2 dedicated analysts or 30+ tables.
- **Tier 1 (30--300 tables, 1--5 person data team):** DataHub (LinkedIn), OpenMetadata, or Amundsen. All are open-source and self-hosted. DataHub is the most feature-complete with SQL lineage parsing, programmatic metadata ingestion via Python SDK, and a GraphQL API. OpenMetadata has better UI for non-technical users. Amundsen is simpler but less actively developed. Cost: hosting only (~$50--200/month on a single VM). Migrate to Tier 2 when automated lineage, RBAC, and workflow approvals become necessary.
- **Tier 2 (300--2000 tables, 5--20 person data team):** Atlan or a managed DataHub service. Atlan has native integrations with dbt, Looker, Tableau, Airflow, and Fivetran with zero-config lineage. It includes workflow automation (catalog update approvals, PII tagging workflows) and a business glossary builder. Cost: $2,000--10,000/month depending on seat count.
- **Tier 3 (2000+ tables, enterprise with compliance requirements):** Collibra or Alation. Collibra is strongest for regulatory compliance workflows (GDPR, CCPA data subject rights), with built-in data stewardship workflows and policy enforcement. Alation is strongest for analyst self-service, with behavioral analytics showing which tables are actually used. Cost: $100,000--500,000+/year.
- **Do not skip tiers prematurely.** A 5-person analytics team implementing Collibra will spend 80% of their time maintaining the tool, not using it. Start at the correct tier and plan migration milestones (table count thresholds, team size thresholds) explicitly.

---

## Output Format

```markdown
## Data Catalog: [Organization Name] -- [Domain or Full Enterprise]

---

### Catalog Overview

| Attribute | Value |
|-----------|-------|
| Scope | [X databases, Y schemas, Z tables] |
| Primary Audience | [Analysts / Data Engineers / Compliance / Business Stakeholders] |
| Catalog Tool | [Tool name, tier, and hosting model] |
| Governance Standard | [Classification framework: Internal 4-level / SOC 2 / NIST] |
| Data Steward Model | [Centralized / Federated -- list domain stewards] |
| Phase | [Phase 1 of X: scope description] |
| Initial Setup Date | [Date] |
| Next Scheduled Audit | [Date] |
| Catalog Health (at setup) | [X% tables with descriptions, Y% columns with PII classification] |

---

### Governance Tag Taxonomy

#### 1. Data Sensitivity Classification
| Tag | Definition | Assignment Criteria | Required Data Handling |
|-----|-----------|--------------------|-----------------------|
| Public | Aggregated or anonymized; safe for external sharing | No individual-level data; no business-sensitive metrics | No restrictions |
| Internal | Non-sensitive business data | Business metrics not for external publication | Internal distribution only; no external sharing without VP approval |
| Confidential | Sensitive business or personal data | Revenue by customer, employee salaries, B2B contract terms | Need-to-know access; encrypted at rest and in transit |
| Restricted | Highly sensitive; regulatory obligation | PII, PHI, PCI, legal records, board materials | Encrypted at rest; masked in non-production; access logged; DSAR process required |

#### 2. PII Sub-Classification (Column Level)
| Tag | Definition | Examples | Masking Requirement |
|-----|-----------|---------|---------------------|
| PII-Direct | Directly identifies an individual | Name, email, phone, SSN, national ID, passport | Hash or tokenize in non-production; mask in catalog previews |
| PII-Quasi | Identifies an individual when combined with other data | Date of birth, ZIP code, gender, ethnicity | Suppress in any external-facing report; document combination risk |
| PII-Behavioral | Activity linked to a named individual | Purchase history, browsing history, location history | Pseudonymize; document retention period |
| PII-Sensitive | Special category personal data | Health, religion, political affiliation, biometrics | Highest restriction; explicit consent required; DPO sign-off needed |
| Non-PII | No personal data content | Product IDs, timestamps, aggregate metrics | Standard handling per sensitivity level |

#### 3. Data Quality Tier
| Tier | Definition | Entry Criteria | Exit Criteria (demotion) |
|------|-----------|---------------|--------------------------|
| Gold | Production-grade; safe for executive and customer-facing reporting | Owner assigned; description complete; ≥95% field population; monitoring SLA active; ≥6 months production history | Any criterion drops below threshold for 30+ days |
| Silver | Documented; no active SLA | Owner assigned; description complete; ≥70% field population; no monitoring | Owner becomes unresponsive for 90 days; field population drops below 50% |
| Bronze | Raw or exploratory; not validated | Default tier for all new tables | N/A -- Bronze is the floor |

#### 4. Domain Tags
| Tag | Scope | Domain Steward |
|-----|-------|---------------|
| [Domain name] | [What business entities and events fall under this domain] | [Name, team] |

#### 5. Lifecycle Tags
| Tag | Definition | Required Actions |
|-----|-----------|-----------------|
| Active | Currently in production use | Standard catalog maintenance applies |
| Deprecated | Has a documented replacement; still readable | Must include replacement table, migration guide, and sunset date |
| Archived | Moved to cold storage; no SLA | Document access method and retrieval SLA if any |
| Pending-Deletion | Scheduled for hard deletion | Must list downstream consumers; provide 60-day notice minimum |

#### 6. Regulatory Scope Tags (Table Level)
| Tag | Applicability |
|-----|--------------|
| GDPR-Inscope | Table contains personal data of EU residents |
| CCPA-Inscope | Table contains personal data of California residents |
| HIPAA-Inscope | Table contains protected health information |
| PCI-DSS-Inscope | Table contains cardholder data |

---

### Business Glossary (Controlled Vocabulary)

| Business Term | Definition | Disambiguation | Authoritative Source Table(s) |
|--------------|-----------|---------------|-------------------------------|
| [Term] | [Precise definition of the metric or concept] | [How this term differs from similar terms; e.g., "Revenue (Gross) vs. Revenue (Net)"] | [schema.table_name, column_name] |

---

### Table Documentation

---

#### [schema.table_name]

**Description:** [Answer all four questions: (1) What business event or entity does this table represent? (2) What is the grain -- one row per what? (3) What questions is this table designed to answer? (4) What is this table NOT designed for?]

**Table Metadata:**

| Attribute | Value |
|-----------|-------|
| Primary Owner | [Name, team, contact method] |
| Backup Owner | [Name, team] |
| Source System | [Application or API name and version] |
| Ingestion Pipeline | [Pipeline/DAG name and link] |
| Update Frequency | [Exact schedule: "Daily at 03:00 UTC via Airflow DAG shopify_orders_daily"] |
| Expected Row Count | [Current count and growth rate: "245,000 rows; growing ~500/day"] |
| Retention Policy | [Duration and deletion mechanism: "7 years; deleted via retention_cleanup_job"] |
| Quality Tier | [Gold / Silver / Bronze] |
| Sensitivity | [Public / Internal / Confidential / Restricted] |
| PII Present | [Yes / No -- if Yes, list PII columns] |
| Domain | [Tag from domain taxonomy] |
| Lifecycle | [Active / Deprecated / Archived / Pending-Deletion] |
| Regulatory Scope | [GDPR-Inscope / CCPA-Inscope / None] |
| Known Issues | [Issue description + workaround. "None documented" is acceptable if explicitly verified] |
| Last Reviewed | [Date and reviewer name] |

**Column Documentation:**

| Column | Type | Grain Role | Description | Example Values | Nullable | Null Meaning | PII Sub-Type | Sensitivity | Lineage Type | Lineage Source |
|--------|------|-----------|-------------|----------------|----------|--------------|-------------|-------------|-------------|----------------|
| [col] | [SQL type] | [PK/FK/Measure/Dimension/Metadata] | [Business description -- passes non-expert test] | [Synthetic examples] | [Y/N] | [Missing/NotApplicable/Unknown/Sentinel -- value if sentinel] | [PII sub-type or Non-PII] | [Sensitivity level] | [DirectCopy/TypeCast/Derived/Lookup] | [source.table.column or formula] |

**Lineage:**

```
[Source Application] --> [Ingestion Pipeline] --> [Raw/Staging Table]
                                                        |
                                              [Transformation Job]
                                                        |
                                              [schema.table_name]  <-- this table
                                             /          |            \
                              [Dashboard A]    [ML Model B]     [Pipeline C]
```

- **Upstream (L2):** [Source application] -> [pipeline name] -> [staging schema.table] -> [transformation job] -> this table
- **Downstream (L2):** This table -> [consumer name, type: dashboard/report/pipeline/API, criticality: P1/P2/P3]
- **Lineage Confidence:** [High -- automated SQL parse / Medium -- inferred from code review / Low -- interview-based]

**Related Tables:**

| Related Table | Relationship | Join Key | Notes |
|--------------|-------------|----------|-------|
| [schema.table] | [One-to-many / Many-to-many / Lookup] | [this_table.col = related.col] | [Any join gotchas: null handling, fan-out risk, date range filter required] |

---

### Catalog Maintenance Process

| Activity | Trigger / Frequency | Responsible Party | SLA | Output |
|----------|--------------------|--------------------|-----|--------|
| New table registration | Within 5 business days of table creation | Creating data engineer | 100% compliance required before table is queryable in production | Completed catalog entry (all required fields) |
| Schema change update | Same sprint as ALTER TABLE or migration | Engineer making the change | 48 hours from deployment | Updated column list, updated lineage if affected |
| Stale entry review | Every 180 days (automated reminder) | Table owner | Response within 10 business days | "Reviewed -- still accurate" confirmation OR updated fields |
| Quarterly health audit | First week of each quarter | Data Governance Lead | Report delivered by day 7 | Health metrics report; stale entry backlog; orphaned table list |
| Owner offboarding | Within 2 business days of HR notification | Data Governance Lead | Backup owner promoted within 2 days | Reassigned ownership across all affected tables |
| Governance tag review | Annually (January) + on new regulation | Data Governance Lead + Legal/Compliance | Completed by January 31 | Updated tag definitions; re-tagged entries if criteria changed |
| Lineage validation | On any upstream pipeline change | Engineer making the change | Before change goes to production | Verified downstream impact list; updated lineage links |
| Deprecation workflow | When replacement table is created | Table owner | 60-day minimum notice | Deprecated tag applied; migration guide published; downstream consumer list notified |

### Catalog Health Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| % Tables with description | ≥95% | [X%] | [Green/Yellow/Red] |
| % Columns with PII classification | 100% | [X%] | [Green/Yellow/Red] |
| % Tables with named owner | 100% | [X%] | [Green/Yellow/Red] |
| % Gold tables with active lineage | ≥90% | [X%] | [Green/Yellow/Red] |
| Orphaned tables (no active owner) | 0 | [X] | [Green/Yellow/Red] |
| Stale entries (>180 days no review) | <5% | [X%] | [Green/Yellow/Red] |

### Search and Discovery Guide

**Discovery Path 1 -- By Domain:** Browse domain tags [Sales / Marketing / Product / Finance / HR] to see all tables within a business area
**Discovery Path 2 -- By Business Entity:** Search for the entity name (e.g., "customer", "order", "campaign") to find all tables containing that entity
**Discovery Path 3 -- By Compliance Need:** Filter classification = Restricted and regulatory tag = GDPR-Inscope to generate GDPR data inventory
**Discovery Path 4 -- By Trust Level:** Filter Quality Tier = Gold for tables safe for executive reporting; avoid Bronze for production use
**Discovery Path 5 -- By Business Glossary:** Look up a business term (e.g., "Monthly Active User") to find its authoritative definition and source table

```

---

## Rules

1. **NEVER populate any catalog entry with "TBD" or "To be determined"** -- a catalog entry with missing fields is worse than no entry, because it creates false confidence. If information is genuinely unknown, document it as "Unknown -- [Owner Name] is responsible for completing this field by [Date]" and track it as an open item.

2. **Every table must have BOTH a primary owner and a backup owner.** A single owner creates a documentation single point of failure. When the primary owner is unavailable or offboarded, the backup owner is automatically responsible. "Team X owns this table" without a named individual is not acceptable -- teams do not respond to review requests; people do.

3. **PII classification is binary and mandatory at the column level -- "not assessed" is a compliance violation, not an acceptable state.** Every single column must be explicitly marked with a PII sub-type or Non-PII. In a GDPR or CCPA audit, an unclassified column is treated as potentially containing unprotected personal data, which triggers investigative overhead that costs orders of magnitude more than the original classification effort.

4. **Quality tier assignments must be evidence-based, not aspirational.** A table that has never had a data quality check run against it is Bronze regardless of how important it is to the business. "This is our most critical revenue table, so it should be Gold" is not a valid reason for a Gold assignment. If it is critical and Bronze, the right response is to invest in making it Gold -- not to inflate its tier.

5. **Column descriptions must pass the "three-sentence replacement test":** Delete the column name from the description. If the description still fully describes the column and someone who has never seen the database could understand it, the description passes. If the description requires the column name to make sense, it fails and must be rewritten.

6. **Lineage documentation must reach actual source systems, not stop at staging tables.** Documenting "this table comes from the staging.orders table" tells analysts nothing about data trustworthiness. The lineage must reach the application database, SaaS API, or file upload that is the true origin. At minimum, two hops upstream from the documented table must be recorded.

7. **Example values for any PII-classified column must always be synthetic.** Pasting real customer names, email addresses, or phone numbers into catalog documentation creates a secondary data exposure risk. Use clearly fictional data: names from the phonetic alphabet (Alpha Smith, Bravo Jones), email addresses from test@example.com or RFC 5321 reserved domains, phone numbers from the 555 exchange. Document in the column notes that examples are synthetic.

8. **The catalog must include problematic and legacy tables, not just clean ones.** The tables with no documentation, unknown owners, and known quality issues are the most dangerous tables in the organization -- because analysts will find them through SQL search tools and use them without understanding the risks. A Bronze-tier entry with a "Known Issues" field that says "Row counts do not reconcile with source system by ~8%; root cause unknown; do not use for financial reporting" is far safer than no entry.

9. **Downstream lineage must document consumer criticality.** Not all downstream consumers are equal. A consumer tagged P1 (feeds executive dashboard or customer-facing product) means that a data incident in this table triggers immediate incident response. A consumer tagged P3 (exploratory analysis) means the analyst should be notified but no SLA exists. Lineage without criticality ratings prevents triage prioritization during incidents.

10. **The business glossary must be populated before table documentation is considered complete for any table containing metric columns.** If a table has a column named "revenue", "conversion_rate", "active_users", or any other business metric, the glossary entry for that metric must exist and be linked before the table entry is approved. Undocumented metric columns are the leading cause of "why do we have two different revenue numbers?" incidents.

11. **Automated lineage and human-attested lineage must be distinguished in the catalog.** Automated lineage extracted by SQL parsers is highly reliable but misses runtime dynamism (dynamic SQL, Python string interpolation). Human-attested lineage from code reviews is lower-confidence but covers dynamic cases. Every lineage link must have a confidence level (High/Medium/Low) and the method by which it was determined, so consumers know how much to trust it.

12. **Catalog maintenance must be embedded in engineering workflows, not left as a separate manual process.** If updating the catalog is an optional step after a schema change, it will not happen. The catalog update must be a required checklist item in the PR or Jira ticket for any schema-modifying change. Treat an unupdated catalog entry after a schema change the same way you would treat an unupdated API contract -- it is a breaking change.

---

## Edge Cases

### Very Large Organizations (500+ Tables, Multiple Platforms)

Attempting to catalog 500+ tables simultaneously is guaranteed to fail -- teams run out of energy, descriptions become generic, and the catalog goes stale before launch.

- Implement a tiered rollout: Phase 1 (weeks 1--4) catalogs only tables that feed P1 consumers (executive dashboards, customer-facing products, regulatory reports). Phase 2 (months 2--3) covers Silver-tier tables with active users. Phase 3 (months 4--6) covers Bronze-tier and archival tables with stub entries (name, owner, and "documentation in progress" notice).
- Use automated schema discovery to generate stub entries for all tables simultaneously so the catalog appears complete -- but clearly mark stubs with a "Documentation Status: Stub -- Not Reviewed" badge to prevent analysts from trusting incomplete entries.
- Assign a catalog sprint to each domain team: one week per domain where the domain's data engineer and analyst pair to complete documentation for their tables. This distributes the work and ensures domain expertise is captured.
- Track a "documentation debt" metric alongside engineering debt. Every table without a complete description is a documentation debt item. Report the total count weekly until below 5%.

### No Existing Data Governance or Ownership Structure

When no one knows who owns the data, bootstrapping ownership is the prerequisite task.

- Start with usage analysis rather than organizational charts. Query database access logs (most warehouses retain at least 90 days of query history: Snowflake's QUERY_HISTORY, BigQuery's INFORMATION_SCHEMA.JOBS) to find the most frequent querier of each table. That person is the de facto owner and the best candidate for the formal owner assignment.
- Schedule a 30-minute "table interview" with each identified owner. Ask: What does this table contain? What is the grain? Who else uses it? What are the known issues? Record the answers verbatim and use them as the basis for the catalog description. This is faster than asking owners to write descriptions from scratch.
- Implement a "no unclaimed tables" policy: any table that is not claimed by an owner within 30 days of catalog launch is tagged Pending-Deletion and scheduled for removal in 90 days. This creates urgency that organizational culture cannot.
- Define the minimum governance requirement as a three-field entry (owner, description, PII flag) for launch. Add retention, lineage, and quality tier in subsequent quarters once the ownership structure is stable.

### Rapidly Evolving Schema (Schema Evolution in Active Development)

Catalogs and rapidly changing schemas are adversarial -- every sprint can invalidate documentation.

- Integrate catalog updates into the database migration framework. If the project uses Liquibase, Flyway, or dbt, add a catalog update step to the migration script template. When a new column is added via ALTER TABLE, the template automatically creates a stub column entry in the catalog with the column name, type, and "Description required by [engineer name] before sprint close."
- For dbt-driven transformations, use dbt's native documentation (schema.yml) as the catalog source of truth for transformation layer tables. Extract dbt docs into the main catalog via the DataHub dbt integration or OpenMetadata's dbt connector. Avoid maintaining two separate descriptions for the same dbt model.
- Separate structural metadata (auto-synced) from semantic metadata (manually maintained). When a column is renamed, the automatic sync catches the structural change. The semantic metadata (description, lineage, PII flag) must be manually reviewed because a rename might indicate a semantic change that the old description no longer covers.
- Implement schema change notifications: when the automated crawler detects a column addition, deletion, or type change, automatically notify the table owner with a prompt to review the catalog entry within 5 business days.

### Multi-Tool Data Access (Same Table, Multiple Access Patterns)

When the same underlying table is accessed via a data warehouse, a BI semantic layer, a REST API, and a Python library, analysts may encounter the same data with different column names, filters applied, and metric calculations.

- Document the access layer explicitly, not just the storage layer. The catalog entry for a fact table should include a section: "Access Patterns" listing each consumer access method, the column subset they expose, any pre-applied filters, and any metric calculations performed at the access layer. "The Tableau published datasource 'Orders (Finance View)' exposes this table with currency conversion applied and refunds pre-excluded" is critical context for analysts who expect the raw table numbers to match the dashboard.
- For BI semantic layer objects (Looker explores, Power BI datasets, Tableau published datasources), create catalog entries for the semantic layer objects as well as the underlying tables. A semantic layer object is a first-class data asset with its own owner, definition, and governance requirements.
- When the same metric is calculated differently at different access points (the Looker definition of "Monthly Active User" differs from the Python notebook definition), the discrepancy must be documented in the business glossary with a resolution decision. "The canonical definition of MAU is [definition] as implemented in the Looker 'Product' explore. All other definitions are non-canonical and should be reconciled."

### Legacy System with No Documentation and Original Engineers Unavailable

This is the highest-risk cataloging scenario -- data exists, people depend on it, and no one fully understands it.

- Begin with automated profiling: extract schema metadata, row counts, null rates, cardinality (COUNT(DISTINCT) for every column), value distributions for low-cardinality columns, min/max for numeric and date columns. Tools like Great Expectations' profiler, dbt-profiler, or commercial tools in Atlan/Alation can generate this automatically. The profile is not documentation, but it is the foundation for documentation.
- Cross-reference table names and column names against business reports that are known to use the system. If the monthly revenue report queries `legacy.rev_trx`, the table's purpose is partially recoverable from the report context.
- Conduct "archaeological interviews" with the longest-tenured employees who use or depend on the system, not just engineers. Business users often have institutional knowledge about what columns mean that developers never documented.
- Document uncertainty explicitly using a standard format: "Inferred: This column appears to represent [X] based on value distribution analysis and [source of inference]. Confidence: Low. Validation needed from [person or team]." Inferred documentation is far safer than confident-sounding documentation that is wrong.
- Use the column value profiling data to write partial descriptions: "Values observed: 'A' (23%), 'B' (41%), 'C' (36%). Meaning of values unknown -- contact legacy system team." This tells analysts the practical behavior even when the business meaning is unclear.

### Cross-Organizational Data Sharing (Data Mesh, Federated Architecture)

When domains publish data products consumed by other domains, the catalog must handle cross-domain ownership and contract documentation.

- Each data product (a table or set of tables published by one domain for consumption by others) must have a published schema contract: the agreed-upon column names, types, nullable constraints, and refresh SLA that the producing domain guarantees. The catalog entry documents the contract version alongside the current schema -- if the schema diverges from the contract, an alert is triggered.
- Ownership must distinguish between the producer (responsible for data quality and freshness) and the domain steward for consuming teams (responsible for documenting how the consuming domain uses the data product). The catalog entry links both.
- Cross-domain lineage must be documented with contract boundaries explicitly marked. "Sales domain provides orders_daily (contract v2.3) -> Marketing domain transforms -> campaign_attribution (internal)" shows that the cross-domain boundary exists at a specific table with a specific contract version, making impact analysis tractable when the contract is renegotiated.
- Data product SLAs must be surfaced in the catalog, not just in engineering documentation. A consuming team's analyst should be able to read the catalog entry for a shared table and know exactly what freshness, availability, and quality guarantees they can rely on without contacting the producing team's engineer.

### Compliance-Driven Catalog (GDPR, CCPA, or HIPAA Audit Preparation)

When the catalog is being built primarily to satisfy a regulatory audit rather than for analyst discoverability, the priorities shift significantly.

- The GDPR Article 30 Records of Processing Activities (RoPA) is the specific artifact required. The catalog must be structured to generate the RoPA automatically: for each table, it must record the purpose of processing, the categories of data subjects, the categories of personal data, the legal basis for processing, the retention period, and the international transfer status (whether data leaves the EU). Design the catalog fields to map directly to RoPA fields.
- For CCPA, the catalog must enable response to Data Subject Access Requests (DSAR) within the 45-day statutory deadline. This means every PII table must document the mechanism for extracting all data related to a specific individual (the exact query template, parameterized by subject identifier). "Run SELECT * FROM customers WHERE email = ? and JOIN to orders, events, and sessions" is a catalog field, not an engineering task to figure out under deadline.
- HIPAA-covered tables require the 18 HIPAA Safe Harbor identifiers to be tracked at the column level (name, date of birth, geographic subdivisions smaller than state, telephone number, fax, email, SSN, medical record number, health plan beneficiary number, account number, certificate/license number, vehicle identifiers, device identifiers, URLs, IP addresses, biometric identifiers, full-face photographs, unique identifying numbers). A column containing any of these identifiers in the context of health information must be tagged PII-Direct and HIPAA-Inscope.
- Retain catalog entries for at least 7 years for audit purposes, even after the underlying table is deleted. Regulators may request documentation of data handling from years prior. The catalog's audit log (when entries were created, modified, who changed what) is itself a compliance artifact.

---

## Example

**Input:** "We have an e-commerce analytics database in Snowflake with about 35 tables across three schemas: raw (source data from our Shopify store), staging (cleaned intermediate tables), and analytics (final tables used by analysts and BI tools). Our team is 3 analysts and 2 data engineers. We've never had a real data catalog. We have GDPR obligations because we have EU customers. Help us set up a data catalog."

**Output:**

---

## Data Catalog: Acme Commerce -- Analytics Platform

---

### Catalog Overview

| Attribute | Value |
|-----------|-------|
| Scope | 35 tables across 3 schemas (raw: 12 tables, staging: 11 tables, analytics: 12 tables) in Snowflake database ACME_ANALYTICS |
| Primary Audience | 3 analysts (daily discoverability and query guidance), 2 data engineers (lineage and schema maintenance), VP of Data (governance oversight), Legal/Compliance (GDPR audit support) |
| Catalog Tool | Tier 1: OpenMetadata (self-hosted on AWS EC2 t3.medium, ~$45/month) -- selected for strong Snowflake integration and non-technical-friendly UI. Migrate to Atlan if team grows beyond 8 analysts or tables exceed 300. |
| Governance Standard | Internal 4-level sensitivity classification (Public / Internal / Confidential / Restricted) + PII sub-taxonomy (GDPR Article 4 aligned) |
| Data Steward Model | Centralized: VP of Data is data governance lead; each data engineer is domain steward for tables they own |
| GDPR Status | GDPR-Inscope: All tables in analytics.customers, analytics.orders, and raw.shopify_customers require GDPR documentation (Article 30 RoPA fields complete) |
| Phase | Phase 1 (weeks 1--3): analytics schema only (12 tables, all Gold/Silver tier). Phase 2 (weeks 4--6): staging schema. Phase 3 (weeks 7--8): raw schema stubs. |
| Initial Setup Date | 2026-03-01 |
| Next Scheduled Audit | 2026-06-01 (quarterly) |
| Catalog Health Target | 100% analytics tables with descriptions by end of Phase 1; 100% columns PII-classified by end of Phase 1 |

---

### Governance Tag Taxonomy

#### 1. Data Sensitivity Classification

| Tag | Definition | Assignment Criteria | Required Data Handling |
|-----|-----------|--------------------|-----------------------|
| Public | Safe for external publication | Aggregated or fully anonymized metrics; no individual rows; no business-sensitive figures | No restrictions; may appear in public marketing materials |
| Internal | Business data; no regulatory obligation | Revenue metrics, funnel rates, product usage aggregates not broken down by individual | Internal sharing only; not in public reports |
| Confidential | Sensitive business data | Individual customer order history when not linked to PII columns; employee table aggregates; B2B contract terms | Need-to-know access; no bulk export without VP approval |
| Restricted | Personal data or highly sensitive financial data | Any column containing name, email, address, phone, IP; payment data; GDPR-regulated data | Encrypted at rest (Snowflake Dynamic Data Masking active); masked in non-production; all access logged in Snowflake ACCESS_HISTORY; DSAR process required |

#### 2. PII Sub-Classification (Column Level)

| Tag | Definition | Acme-Specific Examples | GDPR Obligation |
|-----|-----------|----------------------|----------------|
| PII-Direct | Directly and uniquely identifies an EU resident | customer_email, customer_name, phone_number, shipping_address_line1, shopify_customer_id | Basis for processing required; deletion mechanism required; include in RoPA |
| PII-Quasi | Can combine with other data to re-identify | date_of_birth, postal_code, country_code (when combined with purchase data) | Document re-identification risk; do not join with other quasi-identifiers in non-production |
| PII-Behavioral | Activity linkable to a named individual | order_history linked to customer_id, session events linked to authenticated user | Retention period required; basis for processing required |
| Non-PII | No personal data content | order_id, product_id, revenue_amount (not linked to individual in the same table), created_at | Standard handling per sensitivity level |

#### 3. Data Quality Tier

| Tier | Criteria at Acme | Tables Currently at This Tier |
|------|-----------------|-------------------------------|
| Gold | Owner assigned; description complete; dbt tests running (not_null, unique, accepted_values, relationships); refreshed daily by 06:00 UTC with Airflow alerting if missed; ≥6 months production history | analytics.orders, analytics.customers, analytics.daily_revenue |
| Silver | Owner assigned; description complete; no automated quality tests or monitoring SLA | analytics.product_events, analytics.marketing_attribution, staging.orders_cleaned |
| Bronze | Default tier for all raw schema tables; stub entry only | All 12 raw.* tables until Phase 3 enrichment |

#### 4. Domain Tags

| Tag | Scope | Domain Steward |
|-----|-------|---------------|
| Commerce | Order transactions, revenue, refunds, fulfillment | Alex Kim, Data Engineering |
| Customer | Customer profiles, account events, lifetime value | Alex Kim, Data Engineering |
| Marketing | Campaign performance, attribution, lead sources | Jamie Lee, Data Engineering |
| Product | Feature usage, sessions, onboarding, retention events | Jamie Lee, Data Engineering |

#### 5. Lifecycle Tags

| Tag | Current Usage at Acme |
|-----|-----------------------|
| Active | All 35 tables at catalog launch |
| Deprecated | None at launch -- first deprecation expected when staging.v1_orders is replaced by staging.orders_cleaned (scheduled Q2 2026) |

#### 6. Regulatory Tags

| Tag | Tables at Acme |
|-----|---------------|
| GDPR-Inscope | analytics.customers, analytics.orders, analytics.product_events (when session linked to user_id), raw.shopify_customers, raw.shopify_orders |

---

### Business Glossary

| Business Term | Definition | Disambiguation | Authoritative Source |
|--------------|-----------|---------------|----------------------|
| Revenue | Gross merchandise value: sum of order total_price including tax and shipping, before any refunds, for all orders with financial_status IN ('paid',
