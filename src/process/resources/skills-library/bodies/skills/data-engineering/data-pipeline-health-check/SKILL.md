---
name: data-pipeline-health-check
description: |
  Data pipeline reliability assessment evaluating data freshness, quality metrics, monitoring coverage, and operational maturity to produce a pipeline health scorecard.
  Use when the user asks about data pipeline health check, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of data pipeline health check or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "assessment data-science template testing analysis planning email"
  category: "data-engineering"
  subcategory: "pipelines-etl"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Data Pipeline Health Check

You are a senior data engineer specializing in data pipeline assessment. Your role is to evaluate data pipelines across reliability, data quality, freshness, monitoring, and operational readiness to produce a structured health scorecard. You help teams move from fragile batch jobs to reliable, observable data systems.


## When to Use

**Use this skill when:**
- User asks about data pipeline health check techniques or best practices
- User needs guidance on data pipeline health check concepts
- User wants to implement or improve their approach to data pipeline health check

**Do NOT use when:**
- The request falls outside the scope of data pipeline health check
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

### Pipeline Context
1. How many data pipelines are in production?
2. What orchestration tool is used (Airflow, Dagster, Prefect, dbt, custom)?
3. What is the pipeline architecture (batch, streaming, hybrid)?
4. What data stores are involved (source, intermediate, destination)?
5. What is the total data volume processed daily?

### Quality Context
6. Are there data quality checks in the pipelines today?
7. What percentage of pipelines have automated testing?
8. How often do data quality issues reach downstream consumers?
9. Is there a data catalog or data dictionary?
10. Who owns data quality (engineering, data team, nobody)?

### Operational Context
11. How are pipeline failures detected today?
12. What is the average time to detect and resolve a pipeline failure?
13. How many pipeline failures occurred in the last 30 days?
14. Is there an on-call rotation for data pipeline issues?
15. What SLAs exist for data freshness?

## Assessment Framework

Evaluate across seven dimensions, each scored 1-5.

### Dimension 1: Reliability and Uptime (Weight: 20%)

| Score | Criteria |
|-------|----------|
| 1 | Pipelines fail daily. No retry logic. Failures require manual intervention. SLAs are missed regularly. |
| 2 | Weekly failures. Basic retry exists. Manual restarts needed. SLAs met 70-80% of the time. |
| 3 | Failures are uncommon. Automated retry handles transient issues. Manual intervention for complex failures. SLAs met 90%. |
| 4 | High reliability. Automated recovery for most failure modes. Circuit breakers for dependencies. SLAs met 99%. |
| 5 | Near-perfect reliability. Self-healing pipelines. Graceful degradation. SLAs met 99.9%. Zero data loss on failure. |

#### What to Evaluate
- Pipeline success rate over last 30/90 days
- Mean time between failures (MTBF)
- Mean time to recovery (MTTR)
- Retry logic and dead letter queue implementation
- Idempotency of pipeline operations
- Graceful handling of source system outages

### Dimension 2: Data Freshness (Weight: 15%)

| Score | Criteria |
|-------|----------|
| 1 | Data is days or weeks stale. No freshness tracking. Consumers do not know when data was last updated. |
| 2 | Data is updated daily but often late. No freshness SLAs. Consumers check manually. |
| 3 | Data meets daily freshness targets. Freshness is tracked. Alerts exist for late data. Some near-real-time feeds. |
| 4 | Data freshness meets all SLAs. Near-real-time for critical data. Freshness metadata exposed to consumers. |
| 5 | Real-time or near-real-time where needed. Freshness is a first-class metric. Consumers have freshness guarantees with SLIs. |

#### What to Evaluate
- Current freshness vs SLA for each pipeline
- End-to-end latency (source event to query-ready)
- Freshness tracking and metadata availability
- Impact of late data on business decisions
- Streaming vs batch trade-off analysis

### Dimension 3: Data Quality (Weight: 20%)

| Score | Criteria |
|-------|----------|
| 1 | No quality checks. Bad data reaches consumers regularly. No schema validation. Duplicates and nulls everywhere. |
| 2 | Some ad hoc quality checks. Schema validation on ingestion. Known quality issues that nobody fixes. |
| 3 | Systematic quality checks at key points. Schema validation enforced. Quality metrics tracked. Quarantine for bad records. |
| 4 | Comprehensive quality framework. Automated anomaly detection. Data contracts between producers and consumers. Quality dashboards. |
| 5 | Data quality is a culture. Statistical quality control. Automated remediation. Lineage-aware impact analysis. Quality SLOs per dataset. |

#### Quality Dimensions to Check
- **Completeness**: Are required fields populated?
- **Accuracy**: Does data match source of truth?
- **Consistency**: Are related datasets in agreement?
- **Timeliness**: Is data available when expected?
- **Uniqueness**: Are duplicate records controlled?
- **Validity**: Do values conform to expected formats and ranges?

#### What to Evaluate
- Number of quality rules per pipeline
- Quality check coverage (percentage of tables/fields monitored)
- Quality issue detection rate vs escape rate
- Schema evolution handling (backward/forward compatibility)
- Data contract existence and enforcement

### Dimension 4: Monitoring and Alerting (Weight: 15%)

| Score | Criteria |
|-------|----------|
| 1 | No monitoring. Failures discovered by downstream consumers. No alerting. No dashboards. |
| 2 | Basic job success/failure monitoring. Email alerts on failure. No volume or quality monitoring. |
| 3 | Job monitoring with metrics. Volume anomaly detection. Alerts routed to appropriate teams. Basic dashboards. |
| 4 | Comprehensive monitoring covering jobs, data quality, freshness, and cost. Smart alerting with low noise. Operational dashboards. |
| 5 | Unified data observability platform. Automated root cause analysis. Predictive alerting. SLO-based monitoring. Business impact correlation. |

#### What to Monitor
- Pipeline execution status and duration
- Record counts (input vs output vs rejected)
- Data volume trends and anomalies
- Schema change detection
- Resource utilization (compute, memory, storage)
- Cost per pipeline run
- Freshness SLA compliance
- Data quality metric trends

### Dimension 5: Testing and Validation (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | No testing. Changes are deployed directly to production. Issues found by consumers. |
| 2 | Manual testing before deployment. Some validation scripts. No staging environment. |
| 3 | Unit tests for transformations. Staging environment exists. Integration tests for critical pipelines. |
| 4 | Comprehensive test suite. CI/CD for pipeline code. Data diff testing between versions. Automated regression tests. |
| 5 | Full test pyramid (unit, integration, end-to-end). Contract testing with consumers. Canary deployments for pipeline changes. Chaos testing. |

#### What to Evaluate
- Test coverage for transformation logic
- CI/CD pipeline for data pipeline code
- Staging/dev environment parity with production
- Regression testing practices
- Schema change testing and validation
- Backfill testing procedures

### Dimension 6: Documentation and Lineage (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | No documentation. Pipeline logic is in someone's head. No lineage tracking. Nobody knows what feeds what. |
| 2 | Some documentation but outdated. Basic README files. Manual lineage diagrams that are wrong. |
| 3 | Pipeline documentation is current. Data catalog covers key datasets. Basic lineage tracking. |
| 4 | Comprehensive data catalog. Automated lineage tracking. Impact analysis capability. Data dictionary maintained. |
| 5 | Living documentation auto-generated. Column-level lineage. Full impact analysis for any change. Business context integrated. |

### Dimension 7: Scalability and Performance (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | Pipelines break with volume increases. No capacity planning. Processing time grows unbounded. |
| 2 | Some scaling capability. Performance degrades gradually. Manual scaling interventions needed. |
| 3 | Pipelines handle expected growth. Auto-scaling for compute. Performance is monitored. |
| 4 | Efficient resource utilization. Handles 3-5x volume spikes. Optimized processing. Cost-aware scaling. |
| 5 | Handles arbitrary scale. Elastic resource management. Continuous performance optimization. Cost per record is tracked and optimized. |

## Scoring Template

```
Dimension                       Score (1-5)  Weight   Weighted
────────────────────────────────────────────────────────────────
Reliability and Uptime          [   ]        x 0.20 = [      ]
Data Freshness                  [   ]        x 0.15 = [      ]
Data Quality                    [   ]        x 0.20 = [      ]
Monitoring and Alerting         [   ]        x 0.15 = [      ]
Testing and Validation          [   ]        x 0.10 = [      ]
Documentation and Lineage       [   ]        x 0.10 = [      ]
Scalability and Performance     [   ]        x 0.10 = [      ]
────────────────────────────────────────────────────────────────
TOTAL PIPELINE HEALTH SCORE                          [      ] / 5.0
```

## Results Interpretation

| Score Range | Health Level | Interpretation |
|-------------|-------------|----------------|
| 4.5 - 5.0 | Excellent | Data pipelines are a reliable asset. Focus on optimization and innovation. |
| 3.5 - 4.4 | Good | Solid foundation. Address specific gaps for higher reliability. |
| 2.5 - 3.4 | Fair | Pipelines work but require attention. Data consumers experience issues. |
| 1.5 - 2.4 | Poor | Significant reliability issues. Data trust is low. Major investment needed. |
| 1.0 - 1.4 | Critical | Pipelines are a liability. Data-driven decisions are unreliable. Emergency intervention needed. |

## Recommendations by Priority

### Immediate Actions (Week 1-2)
- Inventory all pipelines and their current health status
- Set up basic monitoring for all production pipelines
- Identify and fix pipelines that fail most frequently
- Document critical pipeline dependencies

### Short-Term (Month 1-3)
- Implement data quality checks at pipeline boundaries
- Set up alerting with proper routing and escalation
- Create a staging environment for pipeline testing
- Establish freshness SLAs for critical datasets
- Implement retry logic and idempotent operations

### Medium-Term (Month 3-6)
- Deploy a data quality framework across all pipelines
- Implement automated lineage tracking
- Build operational dashboards for pipeline health
- Establish CI/CD for pipeline code
- Create data contracts with key consumers

### Long-Term (Month 6-12)
- Build a data observability platform
- Implement statistical anomaly detection
- Migrate critical batch pipelines to streaming where beneficial
- Establish FinOps for data pipeline costs
- Build self-service data quality tools for consumers

## Report Template

```markdown
# Data Pipeline Health Check - [Team/Organization]
**Assessment Date**: [Date]
**Assessed By**: [Name/Role]
**Pipeline Count**: [Number]
**Orchestration**: [Tool]

## Executive Summary
[2-3 sentences on overall pipeline health, key risks, and primary recommendation]

## Overall Score: [X.X] / 5.0 - [Health Level]

## Dimension Scores
[Completed scoring table]

## Pipeline Inventory Summary
| Pipeline | Frequency | Volume | Reliability | Quality Score |
|----------|-----------|--------|-------------|---------------|
|          |           |        |             |               |

## Critical Issues
1. [Issue] - Impact: [description] - Urgency: [high/medium/low]

## Recommended Actions
### This Sprint
- [Action items]

### This Quarter
- [Action items]

## Metrics to Track
- Pipeline success rate: Current [X%] -> Target [Y%]
- Mean time to detection: Current [X hrs] -> Target [Y min]
- Data quality score: Current [X] -> Target [Y]

## Next Health Check Date: [Date - recommend monthly]
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to data pipeline health check
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Data Pipeline Health Check Analysis

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

**Input:** "Help me with data pipeline health check for my current situation"

**Output:**

Based on your situation, here is a structured approach to data pipeline health check:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
