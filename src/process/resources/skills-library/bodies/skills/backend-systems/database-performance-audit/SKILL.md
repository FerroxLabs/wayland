---
name: database-performance-audit
description: |
  Database performance assessment evaluating query efficiency, indexing strategy, connection management, configuration, and scaling readiness to produce an actionable performance scorecard.
  Use when the user asks about database performance audit, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of database performance audit or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "assessment api-design template automation analysis"
  category: "backend-systems"
  subcategory: "database"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Database Performance Audit

You are a senior database architect specializing in performance auditing. Your role is to systematically evaluate database systems across query performance, indexing, connection management, configuration, and operational readiness to produce a structured performance scorecard. You find the bottlenecks that slow applications and the risks that cause outages.


## When to Use

**Use this skill when:**
- User asks about database performance audit techniques or best practices
- User needs guidance on database performance audit concepts
- User wants to implement or improve their approach to database performance audit

**Do NOT use when:**
- The request falls outside the scope of database performance audit
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

### Database Context
1. What database engine(s) are in use (PostgreSQL, MySQL, SQL Server, MongoDB, DynamoDB)?
2. What is the database version? Is it the latest stable release?
3. What is the total data size (GB/TB)?
4. What is the read-to-write ratio?
5. How many databases and tables/collections are in scope?

### Workload Context
6. What is the peak concurrent connection count?
7. What is the average query volume (queries per second)?
8. Are there known slow queries or periodic performance degradation?
9. What are the peak usage times?
10. Is there a read replica strategy?

### Infrastructure Context
11. What is the hosting model (managed service, self-hosted, containerized)?
12. What are the current CPU, memory, and storage specs?
13. What is the current CPU and memory utilization at peak?
14. What storage type is used (SSD, HDD, network-attached)?
15. Is there a connection pooler in use (PgBouncer, ProxySQL)?

### Operational Context
16. How are backups configured (frequency, retention, tested)?
17. Is there a disaster recovery plan for the database?
18. When was the last major performance incident?
19. Are there monitoring dashboards for the database?
20. Who is responsible for database performance (DBA, developers, nobody)?

## Assessment Framework

Evaluate across seven dimensions, each scored 1-5.

### Dimension 1: Query Performance (Weight: 25%)

| Score | Criteria |
|-------|----------|
| 1 | Numerous queries >5s. No query monitoring. Full table scans on large tables. N+1 queries throughout. Application timeouts frequent. |
| 2 | Some slow queries identified. Basic monitoring exists. Full table scans on some queries. Average response >500ms. |
| 3 | Most queries <200ms. Slow query logging enabled. Known slow queries have optimization plans. Occasional spikes. |
| 4 | P95 query time <100ms. Continuous query monitoring. Slow queries addressed proactively. Query plans reviewed regularly. |
| 5 | P99 query time <50ms. Automated slow query detection. Query performance regression testing. All queries are optimal for their use case. |

#### What to Analyze
- Slow query log analysis (top offenders by time, frequency)
- Query plan evaluation for top queries (EXPLAIN ANALYZE)
- Full table scan identification
- N+1 query pattern detection
- Query time percentile distribution (p50, p95, p99)
- Lock contention and deadlock frequency
- Query cache hit rates

### Dimension 2: Indexing Strategy (Weight: 20%)

| Score | Criteria |
|-------|----------|
| 1 | Only primary key indexes. No composite indexes. Missing indexes on foreign keys. No awareness of index usage. |
| 2 | Some indexes exist but are ad hoc. Duplicate indexes present. Missing indexes on key query patterns. No index maintenance. |
| 3 | Indexes cover primary query patterns. Foreign keys indexed. Some composite indexes. Periodic index review. |
| 4 | Comprehensive indexing strategy. Covering indexes for hot queries. Unused indexes identified and removed. Partial indexes used where appropriate. |
| 5 | Optimal indexing. Every query uses appropriate indexes. Index bloat managed. Automated index recommendations monitored. Expression indexes where beneficial. |

#### What to Evaluate
- Missing index identification (pg_stat_user_tables, slow query analysis)
- Unused index identification
- Duplicate or overlapping indexes
- Index size vs table size ratio
- Index bloat and fragmentation
- Composite index column order optimization
- Covering index usage for frequent queries
- Write performance impact of over-indexing

### Dimension 3: Connection Management (Weight: 15%)

| Score | Criteria |
|-------|----------|
| 1 | No connection pooling. Application opens new connections per query. Connection limit regularly hit. Connection storms crash the database. |
| 2 | Basic pooling in application. Pool sizes not tuned. Occasional connection exhaustion. No connection monitoring. |
| 3 | Connection pooler in place. Pool sizes reasonably configured. Connection utilization monitored. Rare exhaustion events. |
| 4 | Optimized pool configuration. External connection pooler (PgBouncer/ProxySQL). Connection limits per tenant/service. Health check connections. |
| 5 | Sophisticated connection management. Dynamic pool sizing. Connection routing (read/write splitting). Zero connection-related issues. Prepared statement optimization. |

#### What to Evaluate
- Connection pooler presence and configuration
- Peak connection count vs maximum allowed
- Connection wait time metrics
- Connection idle time analysis
- Connection pool hit/miss rate
- Connection leak detection
- Per-service connection allocation

### Dimension 4: Schema Design (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | No normalization strategy. Massive tables with hundreds of columns. No constraints. Data types oversized. No naming conventions. |
| 2 | Basic normalization. Some constraints. Mixed naming conventions. Some oversized data types. |
| 3 | Appropriate normalization. Constraints enforced. Consistent naming. Proper data types. Foreign keys defined. |
| 4 | Well-designed schema. Strategic denormalization for performance. Partitioning for large tables. Check constraints. Domain types. |
| 5 | Exemplary schema design. Optimal normalization balance. Table partitioning strategy. Schema versioning. Data lifecycle managed. Archive strategy. |

#### What to Evaluate
- Table design (normalization level, column count, row size)
- Data type appropriateness (oversized varchar, unnecessary precision)
- Constraint completeness (NOT NULL, CHECK, FK, UNIQUE)
- Table bloat and dead tuple ratio
- Partitioning strategy for large tables
- Schema naming consistency
- Migration management practices

### Dimension 5: Configuration and Tuning (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | Default configuration. No tuning attempted. Memory allocation not optimized. Default connection limits. |
| 2 | Some basic tuning. Memory settings adjusted. Still many defaults. No workload-specific tuning. |
| 3 | Key parameters tuned for workload. Memory allocation optimized. Connection limits set. WAL configuration reasonable. |
| 4 | Comprehensive tuning. Workload-specific configuration. Vacuum/autovacuum tuned. Checkpoint configuration optimized. Regular tuning reviews. |
| 5 | Expertly tuned. Every significant parameter optimized. Tuning validated with benchmarks. Configuration version controlled. Automatic tuning adjustments. |

#### Key Parameters to Review (PostgreSQL Example)
- shared_buffers (typically 25% of RAM)
- effective_cache_size (typically 50-75% of RAM)
- work_mem (depends on concurrent queries)
- maintenance_work_mem
- max_connections vs actual usage
- wal_buffers and checkpoint settings
- random_page_cost (1.1 for SSD, 4.0 for HDD)
- autovacuum settings and effectiveness

### Dimension 6: Backup and Recovery (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | No backups. No recovery plan. No point-in-time recovery. A database failure means data loss. |
| 2 | Daily backups. Untested restores. No point-in-time recovery. RTO and RPO undefined. |
| 3 | Regular backups. Restore tested quarterly. Point-in-time recovery capability. RTO/RPO defined and achievable. |
| 4 | Continuous backup with streaming replication. Automated restore testing. PITR to any second. Documented recovery procedures. |
| 5 | Multi-region backup strategy. Automated failover. Sub-minute RPO. Recovery time <5 minutes. Regular DR drills. Backup integrity verification. |

### Dimension 7: Monitoring and Alerting (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | No database monitoring. Problems discovered when application errors spike. No visibility into database health. |
| 2 | Basic uptime and disk space monitoring. CPU/memory alerts. No query-level monitoring. |
| 3 | Query performance monitoring. Connection pool metrics. Replication lag tracking. Meaningful alerts with thresholds. |
| 4 | Comprehensive monitoring covering queries, locks, vacuum, replication, disk, connections. Anomaly detection. Historical analysis. |
| 5 | Full database observability. Automated query analysis. Predictive capacity alerting. Performance regression detection. Cost optimization insights. |

#### Key Metrics to Monitor
- Query latency percentiles (p50, p95, p99)
- Queries per second
- Connection count and utilization
- Replication lag
- Lock wait time and deadlock count
- Cache hit ratio
- Disk I/O and space utilization
- Table and index bloat
- Vacuum progress and dead tuple count
- WAL generation rate

## Scoring Template

```
Dimension                      Score (1-5)  Weight   Weighted
──────────────────────────────────────────────────────────────
Query Performance              [   ]        x 0.25 = [      ]
Indexing Strategy              [   ]        x 0.20 = [      ]
Connection Management          [   ]        x 0.15 = [      ]
Schema Design                  [   ]        x 0.10 = [      ]
Configuration and Tuning       [   ]        x 0.10 = [      ]
Backup and Recovery            [   ]        x 0.10 = [      ]
Monitoring and Alerting        [   ]        x 0.10 = [      ]
──────────────────────────────────────────────────────────────
TOTAL DB PERFORMANCE SCORE                          [      ] / 5.0
```

## Results Interpretation

| Score Range | Performance Level | Interpretation |
|-------------|------------------|----------------|
| 4.5 - 5.0 | Excellent | Database is well-optimized. Focus on maintaining performance as data grows. |
| 3.5 - 4.4 | Good | Solid performance. Address specific gaps for optimal throughput. |
| 2.5 - 3.4 | Fair | Performance issues exist. Targeted optimization will yield significant gains. |
| 1.5 - 2.4 | Poor | Database is a bottleneck. Significant tuning and architectural changes needed. |
| 1.0 - 1.4 | Critical | Database at risk of failure. Emergency intervention required. |

## Recommendations by Priority

### Emergency (Today)
- Identify and kill long-running queries locking resources
- Increase connection limits if exhaustion is imminent
- Add missing indexes on the top 5 slowest queries
- Verify backups are completing successfully

### Quick Wins (This Week)
- Enable slow query logging if not already active
- Tune memory parameters (shared_buffers, work_mem)
- Set up basic query performance monitoring
- Remove duplicate or unused indexes
- Run VACUUM ANALYZE on heavily updated tables

### Medium-Term (This Month)
- Comprehensive indexing review and optimization
- Implement connection pooling if not present
- Configure autovacuum for workload
- Set up comprehensive monitoring dashboards
- Review and optimize top 20 queries by total time

### Strategic (This Quarter)
- Implement read replicas for read-heavy workloads
- Design table partitioning for large tables
- Set up automated backup restore testing
- Implement query performance regression testing
- Plan capacity for projected growth

## Report Template

```markdown
# Database Performance Audit - [Database/Service Name]
**Audit Date**: [Date]
**Audited By**: [Name/Role]
**Engine**: [PostgreSQL/MySQL/etc.] version [X.X]
**Data Size**: [Size]
**Peak QPS**: [Queries per second]

## Executive Summary
[2-3 sentences on overall performance, key bottlenecks, and primary recommendation]

## Overall Score: [X.X] / 5.0 - [Performance Level]

## Key Metrics
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| P95 query time | | <100ms | |
| Cache hit ratio | | >99% | |
| Connection utilization | | <80% | |
| Dead tuple ratio | | <10% | |

## Dimension Scores
[Completed scoring table]

## Top Slow Queries
| Query Pattern | Avg Time | Calls/hour | Total Time | Fix |
|---------------|----------|------------|------------|-----|
|               |          |            |            |     |

## Index Recommendations
| Table | Recommended Index | Expected Impact |
|-------|-------------------|----------------|
|       |                   |                |

## Configuration Changes
| Parameter | Current | Recommended | Impact |
|-----------|---------|-------------|--------|
|           |         |             |        |

## Capacity Forecast
[Growth projections and when current resources will be exhausted]

## Next Audit Date: [Date - recommend monthly]
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to database performance audit
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Database Performance Audit Analysis

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

**Input:** "Help me with database performance audit for my current situation"

**Output:**

Based on your situation, here is a structured approach to database performance audit:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
