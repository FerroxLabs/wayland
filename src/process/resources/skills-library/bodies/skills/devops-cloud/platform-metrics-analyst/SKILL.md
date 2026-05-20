---
name: platform-metrics-analyst
description: |
  Measure and improve developer productivity with DORA metrics, developer experience indicators, lead time analysis, and deployment frequency tracking
  Use when the user asks about platform metrics analyst, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of platform metrics analyst or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud template guide sql api-design testing automation"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Platform Metrics Analyst

You are a platform metrics analyst who helps engineering organizations measure developer productivity, platform effectiveness, and delivery performance. You guide through DORA metrics implementation, developer experience measurement, and data-driven platform improvement.


## When to Use

**Use this skill when:**
- User asks about platform metrics analyst techniques or best practices
- User needs guidance on platform metrics analyst concepts
- User wants to implement or improve their approach to platform metrics analyst

**Do NOT use when:**
- The request falls outside the scope of platform metrics analyst
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## DORA Metrics Framework

### The Four Key Metrics

```
┌────────────────────────┬────────────────────────┐
│   THROUGHPUT           │   STABILITY            │
│                        │                        │
│   Deployment Frequency │   Change Failure Rate  │
│   How often do you     │   What % of changes    │
│   deploy to production?│   cause failures?      │
│                        │                        │
│   Lead Time for Changes│   Time to Restore      │
│   How long from commit │   How long to recover  │
│   to production?       │   from a failure?      │
│                        │                        │
└────────────────────────┴────────────────────────┘
```

### Performance Benchmarks

| Metric | Elite | High | Medium | Low |
|--------|-------|------|--------|-----|
| Deployment Frequency | On-demand (multiple/day) | Weekly to monthly | Monthly to 6-monthly | > 6 months |
| Lead Time for Changes | < 1 hour | 1 day - 1 week | 1 week - 1 month | 1 - 6 months |
| Change Failure Rate | 0-5% | 5-10% | 10-15% | > 15% |
| Time to Restore Service | < 1 hour | < 1 day | 1 day - 1 week | > 1 week |

### Metric Definitions

```markdown
## Deployment Frequency
What: Number of successful deployments to production per time period
Why: Measures ability to deliver value to users
How: Count production deployment events from CI/CD system

Formula: deployments / time_period

## Lead Time for Changes
What: Time from first commit to running in production
Why: Measures speed of the delivery pipeline
How: Track commit timestamp → merge → build → deploy → live

Formula: median(deploy_timestamp - first_commit_timestamp)

Components:
  Coding time:  first commit → PR opened
  Review time:  PR opened → PR approved
  Merge time:   PR approved → merged to main
  Build time:   merged → artifact built
  Deploy time:  artifact built → running in production

## Change Failure Rate
What: Percentage of deployments causing a failure in production
Why: Measures quality and stability of changes
How: Track deployments that trigger incidents or require rollback

Formula: failed_deployments / total_deployments * 100

What counts as failure:
  - Deployment triggers an incident
  - Rollback is required
  - Hotfix deployed within 24 hours
  - Service degradation detected post-deploy

## Time to Restore Service (MTTR)
What: Time from failure detection to service restoration
Why: Measures resilience and incident response capability
How: Track incident start time to resolution time

Formula: median(resolution_time - detection_time)
```

## Data Collection

### Data Sources Map

```
Metric                Data Source             Integration
─────────────────────────────────────────────────────────
Deployment Frequency  CI/CD system            GitHub Actions API
                      Deployment platform     ArgoCD API
                      Release tracking        Git tags

Lead Time             Version control         GitHub Events API
                      CI/CD system            GitHub Actions API
                      Code review             GitHub PR API
                      Deployment platform     Deployment webhook

Change Failure Rate   Incident management     PagerDuty API
                      Deployment platform     Rollback detection
                      Monitoring              Alert correlation

Time to Restore       Incident management     PagerDuty API
                      Status page             Status API
                      Monitoring              Alert resolution time
```

### GitHub Actions Data Collector

```yaml
# .github/workflows/metrics-collector.yml
name: Collect Deployment Metrics

on:
  workflow_run:
    workflows: ["Deploy to Production"]
    types: [completed]

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - name: Calculate lead time
        uses: actions/github-script@v7
        with:
          script: |
            // Get the deployment commit SHA
            const sha = context.payload.workflow_run.head_sha;

            // Find the first commit in the PR
            const prs = await github.rest.repos.listPullRequestsAssociatedWithCommit({
              owner: context.repo.owner,
              repo: context.repo.repo,
              commit_sha: sha,
            });

            if (prs.data.length > 0) {
              const pr = prs.data[0];
              const commits = await github.rest.pulls.listCommits({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: pr.number,
              });

              const firstCommit = commits.data[0];
              const deployTime = new Date(context.payload.workflow_run.updated_at);
              const firstCommitTime = new Date(firstCommit.commit.author.date);
              const leadTimeHours = (deployTime - firstCommitTime) / (1000 * 60 * 60);

              // Store metric
              console.log(`Lead time: ${leadTimeHours.toFixed(1)} hours`);
              console.log(`PR review time: ${/* calculate */}`);
              console.log(`Build time: ${/* calculate */}`);
            }

      - name: Record deployment event
        run: |
          HTTP client request -X POST ${{ secrets.METRICS_API }}/deployments \
            -H "Content-Type: application/json" \
            -d '{
              "service": "${{ github.repository }}",
              "sha": "${{ github.sha }}",
              "timestamp": "${{ github.event.workflow_run.updated_at }}",
              "status": "${{ github.event.workflow_run.conclusion }}",
              "environment": "production"
            }'
```

### Metrics Database Schema

```sql
-- Deployment events
CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(255) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    sha VARCHAR(40) NOT NULL,
    deployed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL, -- success, failure, rollback
    deployer VARCHAR(255),
    duration_seconds INTEGER,
    first_commit_at TIMESTAMP WITH TIME ZONE,
    pr_opened_at TIMESTAMP WITH TIME ZONE,
    pr_merged_at TIMESTAMP WITH TIME ZONE,
    build_started_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incidents linked to deployments
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- critical, high, medium, low
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    caused_by_deployment_id UUID REFERENCES deployments(id),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Computed metrics (materialized for dashboards)
CREATE MATERIALIZED VIEW weekly_metrics AS
SELECT
    service_name,
    date_trunc('week', deployed_at) AS week,
    -- Deployment Frequency
    COUNT(*) AS deployment_count,
    -- Lead Time (median)
    percentile_cont(0.5) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM deployed_at - first_commit_at) / 3600
    ) AS median_lead_time_hours,
    -- Change Failure Rate
    COUNT(*) FILTER (WHERE status = 'failure' OR status = 'rollback')::FLOAT
        / NULLIF(COUNT(*), 0) * 100 AS change_failure_rate_pct
FROM deployments
WHERE environment = 'production'
GROUP BY service_name, date_trunc('week', deployed_at);
```

## Developer Productivity Metrics

### Beyond DORA: Developer Experience Metrics

```markdown
## The SPACE Framework

S - Satisfaction and Wellbeing
  - Developer satisfaction score (quarterly survey)
  - Burnout risk indicators
  - Tool satisfaction ratings
  Measurement: Survey (1-5 scale), quarterly

P - Performance
  - Code review quality and thoroughness
  - Bug escape rate to production
  - Customer impact of delivered features
  Measurement: Code review analytics, incident correlation

A - Activity
  - Commits, PRs, reviews per developer
  - Deployment frequency per team
  - Issue throughput
  Measurement: GitHub analytics (USE WITH CAUTION - activity
  alone is a poor proxy for productivity)

C - Communication and Collaboration
  - PR review turnaround time
  - Cross-team contribution frequency
  - Documentation contribution
  Measurement: GitHub PR analytics, knowledge base activity

E - Efficiency and Flow
  - Build wait time
  - CI queue time
  - Context switching frequency
  - Time in flow state (estimated)
  Measurement: CI analytics, calendar analysis
```

### Developer Survey Template

```markdown
## Quarterly Developer Experience Survey

### Overall Satisfaction (1-5 scale)
1. How satisfied are you with your development environment?
2. How easy is it to get your work into production?
3. How confident are you that changes won't break things?
4. How well do internal tools support your workflow?

### Friction Points (select all that apply)
Which of these slow you down most frequently?
- [ ] Waiting for CI/CD pipelines
- [ ] Waiting for code reviews
- [ ] Waiting for environment provisioning
- [ ] Debugging infrastructure issues
- [ ] Understanding other teams' services
- [ ] Finding documentation
- [ ] Access and permissions management
- [ ] Local development environment issues
- [ ] Flaky tests
- [ ] Unclear requirements or priorities

### Open-Ended
- What is the single biggest improvement we could make
  to your development experience?
- What tool or process do you wish existed?
- What recently improved that you appreciate?
```

## Dashboard Design

### Executive DORA Dashboard

```markdown
## DORA Metrics Dashboard Layout

┌──────────────────────────────────────────────────┐
│ Engineering Delivery Performance - Q1 2025       │
│ Overall Rating: HIGH PERFORMER                   │
├──────────────┬──────────────┬────────────────────┤
│ Deploy Freq  │ Lead Time    │ Change Failure Rate│
│ 4.2/day      │ 2.3 hours    │ 4.8%              │
│ ↑12% vs Q4   │ ↓18% vs Q4   │ ↓2.1pp vs Q4      │
│ [sparkline]  │ [sparkline]  │ [sparkline]        │
├──────────────┴──────────────┴────────────────────┤
│ Time to Restore: 38 minutes (↓22% vs Q4)        │
│ [trend chart over 12 weeks]                      │
├──────────────────────────────────────────────────┤
│ By Team                                          │
│ ┌─────────┬────────┬──────┬─────┬──────────┐    │
│ │ Team    │ Deploy │ Lead │ CFR │ MTTR     │    │
│ │         │ Freq   │ Time │     │          │    │
│ │ Auth    │ 6/day  │ 1.5h │ 3%  │ 22min   │    │
│ │ Payment │ 2/day  │ 4.2h │ 8%  │ 55min   │    │
│ │ Search  │ 3/day  │ 2.1h │ 5%  │ 30min   │    │
│ │ User    │ 5/day  │ 1.8h │ 4%  │ 25min   │    │
│ └─────────┴────────┴──────┴─────┴──────────┘    │
└──────────────────────────────────────────────────┘
```

### Team-Level Dashboard

```markdown
## Team Dashboard Layout

Row 1: Key Metrics (4 cards)
  - Deployments this week: N (trend arrow)
  - Median lead time: Xh (trend arrow)
  - Change failure rate: X% (trend arrow)
  - MTTR: Xmin (trend arrow)

Row 2: Pipeline Performance
  - Lead time breakdown (stacked bar)
    [Coding | Review | Merge | Build | Deploy]
  - Build success rate over time
  - Deployment frequency trend (weekly)

Row 3: Quality Indicators
  - Change failure rate trend
  - Incidents by severity (last 30 days)
  - Test coverage trend
  - Flaky test count trend

Row 4: Flow Metrics
  - PR review time distribution
  - Queue depth over time (PRs waiting for review)
  - Active PRs per developer
  - Cycle time distribution
```

## Lead Time Analysis

### Lead Time Decomposition

```
Total Lead Time = Coding + Review + Merge + Build + Deploy

Each phase analysis:

CODING TIME (first commit → PR opened)
  Optimization targets:
  - Clear requirements and acceptance criteria
  - Smaller, focused changes
  - Good local development environment
  - Fast feedback loops (local tests)

REVIEW TIME (PR opened → approved)
  Optimization targets:
  - PR size limits (< 400 lines changed)
  - Review assignment automation
  - Review SLA (24h first response)
  - Clear review guidelines

MERGE TIME (approved → merged)
  Optimization targets:
  - Auto-merge after approval
  - Reduce merge conflicts (trunk-based development)
  - Remove unnecessary gates

BUILD TIME (merged → artifact ready)
  Optimization targets:
  - Parallel build steps
  - Build caching (dependencies, Docker layers)
  - Smaller build scope (monorepo targeted builds)
  - Faster test suites

DEPLOY TIME (artifact → running in production)
  Optimization targets:
  - Automated deployment pipelines
  - Progressive rollout (canary, blue-green)
  - Reduce approval bottlenecks
  - Faster health check convergence
```

### Bottleneck Identification

```sql
-- Find the biggest bottleneck in lead time
SELECT
    'coding' AS phase,
    percentile_cont(0.5) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM pr_opened_at - first_commit_at) / 3600
    ) AS median_hours
FROM deployments WHERE pr_opened_at IS NOT NULL
UNION ALL
SELECT
    'review',
    percentile_cont(0.5) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM pr_merged_at - pr_opened_at) / 3600
    )
FROM deployments WHERE pr_merged_at IS NOT NULL
UNION ALL
SELECT
    'build',
    percentile_cont(0.5) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM deployed_at - pr_merged_at) / 3600
    )
FROM deployments WHERE deployed_at IS NOT NULL
ORDER BY median_hours DESC;
```

## Improvement Strategies

### Metric-Driven Improvement Playbook

| Current State | Target Metric | Improvement Strategy |
|--------------|---------------|---------------------|
| Deploy weekly | Deploy daily | Automate deployment pipeline, remove manual gates |
| Lead time > 1 week | Lead time < 1 day | Trunk-based development, smaller PRs, auto-merge |
| CFR > 15% | CFR < 10% | Improve test coverage, add canary deployments |
| MTTR > 1 day | MTTR < 1 hour | Improve observability, automate rollbacks, runbooks |
| Review time > 48h | Review time < 24h | Review SLA, smaller PRs, async review culture |
| Build time > 30min | Build time < 10min | Build caching, parallelization, targeted builds |

### Improvement Prioritization

```markdown
## Impact vs Effort Matrix

High Impact, Low Effort (DO FIRST):
  - Auto-merge after approval
  - PR size guidelines and enforcement
  - Build caching
  - Review assignment automation

High Impact, High Effort (PLAN):
  - Trunk-based development migration
  - Comprehensive test automation
  - Canary deployment infrastructure
  - Observability platform upgrade

Low Impact, Low Effort (NICE TO HAVE):
  - Dashboard improvements
  - Notification tuning
  - Documentation updates
  - Badge and status improvements

Low Impact, High Effort (AVOID):
  - Complete CI/CD platform rewrite
  - Changing version control system
  - Custom metrics platform from scratch
```

## Reporting and Communication

### Anti-Patterns in Metrics

```markdown
## What NOT to Do with Metrics

1. DO NOT use individual developer metrics for performance reviews
   Why: Leads to gaming, destroys trust, measures activity not value

2. DO NOT compare teams without context
   Why: Teams have different domains, constraints, and maturity

3. DO NOT optimize a single metric in isolation
   Why: Deploy frequency without stability = chaos

4. DO NOT set arbitrary targets without baseline
   Why: Improvement should be relative to your starting point

5. DO NOT measure activity (commits, lines of code) as productivity
   Why: The best code change might be deleting lines

6. remember to qualitative data alongside quantitative
   Why: Numbers tell what, surveys and interviews tell why

## Healthy Metrics Culture
- Use metrics for team self-improvement, not surveillance
- Celebrate trends, not absolute numbers
- Always pair throughput metrics with stability metrics
- Share metrics openly, including with leadership
- Let teams own their metric improvement plans
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to platform metrics analyst
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Platform Metrics Analyst Analysis

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

**Input:** "Help me with platform metrics analyst for my current situation"

**Output:**

Based on your situation, here is a structured approach to platform metrics analyst:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
