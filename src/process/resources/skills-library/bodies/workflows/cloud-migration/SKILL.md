---
name: cloud-migration
description: >-
  Structured workflow for migrating applications and infrastructure from
  on-premises or between cloud providers. Covers assessment, planning, migration
  execution, optimization, and governance to ensure a smooth transition with
  minimal business disruption and maximum cloud value.

  Use when the user wants to cloud migration or needs a structured multi-step
  process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: >-
  aws-architect terraform-engineer docker-engineer kubernetes-operator
  database-architect data-migration monitoring-engineer security-hardener
  cloud-cost-optimizer risk-assessor
trigger_phrases: >-
  I want to migrate to the cloud I need to move from on-prem to AWS How do I
  plan a cloud migration I want to modernize our infrastructure
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: cloud step-by-step planning
  category: software-project
  depends: >-
    aws-architect terraform-engineer docker-engineer kubernetes-operator
    database-architect data-migration monitoring-engineer security-hardener
    cloud-cost-optimizer risk-assessor
  disclaimer: none
  difficulty: advanced
---
# Cloud Migration

**Estimated time:** 2-6 months

Cloud migration is a strategic undertaking that, when done well, delivers agility, scalability, and cost efficiency. When done poorly, it creates expensive, hard-to-manage cloud infrastructure that costs more than the on-premises systems it replaced. This workflow provides a structured approach: assess what you have, plan how to migrate it, execute the migration in waves, optimize for cloud-native benefits, and establish governance for ongoing management.

The workflow uses the industry-standard 6 R's framework for categorizing migration strategies: Rehost (lift-and-shift), Replatform (lift-and-reshape), Refactor (re-architect for cloud-native), Repurchase (replace with SaaS), Retire (decommission), and Retain (keep on-premises). Each application gets the migration strategy that matches its business value and technical complexity.

## When to Use

- User wants to cloud migration
- User needs a structured, step-by-step process for cloud migration
- User wants to migrate to the cloud
- I need to move from on-prem to AWS
- How do I plan a cloud migration
- Do NOT use when: the request is outside the scope of cloud migration or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Executive sponsorship and budget allocation for migration
- Inventory of applications and infrastructure to migrate
- Cloud provider account (AWS, Azure, or GCP)
- Network connectivity between on-premises and cloud (VPN or Direct Connect)
- Team with cloud skills (or training plan)
- Business continuity requirements (acceptable downtime per application)

## Steps

**Step 1: Assess Current State** (uses: risk-assessor)

identify migration risks and the AWS Architect skill (or equivalent for your target cloud) to assess cloud readiness. Catalog every application: technology stack, dependencies, data volume, traffic patterns, compliance requirements, and business criticality. Map the dependency graph: which applications depend on which databases, APIs, and shared services. Calculate current total cost of ownership (TCO) for baseline comparison. Identify high-risk applications (stateful, tightly coupled, legacy technology) that need special attention.

- Input: Current infrastructure inventory (servers, databases, storage), Application portfolio, Network topology
- Output: Application portfolio catalog (technology, dependencies, criticality), Dependency map (application-to-infrastructure, app-to-app), Current TCO baseline
- Key focus: Use the Risk Assessor skill to identify migration risks and the AWS Architect skill (or equivalent for your target cloud) to assess cloud readiness

**Step 2: Plan Migration Waves** (uses: aws-architect)

classify each application using the 6 R's framework: Rehost, Replatform, Refactor, Repurchase, Retire, or Retain. Then organize applications into migration waves (batches of 3-7 applications migrated together). Wave 1 should be low-risk, non-critical applications to build team confidence and validate the migration process. Subsequent waves increase in complexity and criticality. Create a detailed plan for each wave: migration strategy, timeline, rollback procedure, success criteria, and team assignments.

- Input: Assessment from Step 1, Business priorities and timelines, Team capacity and cloud expertise
- Output: 6 R's classification for every application, Migration wave plan (applications per wave, with sequence), Detailed migration plan per wave (strategy, timeline, rollback)
- Key focus: Use the AWS Architect skill to classify each application using the 6 R's framework: Rehost, Replatform, Refactor, Repurchase, Retire, or Retain

**Step 3: Set Up Cloud Foundation** (uses: terraform-engineer)

build the cloud foundation as code: account structure (multi-account for production, staging, shared services), networking (VPC, subnets, security groups, VPN/Direct Connect to on-premises), IAM (roles, policies, SSO), and shared services (logging, monitoring, DNS). Use the Security Hardener skill to apply cloud security best practices from day one: CIS benchmarks, encryption defaults, IAM least privilege, and audit logging. This foundation must be solid before any application migration begins.

- Input: Target cloud architecture from Step 2, Security and compliance requirements, Network connectivity requirements
- Output: Account/subscription structure, Network architecture (VPC, subnets, routing, connectivity), IAM configuration (roles, policies, SSO integration)
- Key focus: Use the Terraform Engineer skill to build the cloud foundation as code: account structure (multi-account for production, staging, shared services), networking (VPC, subnets, security groups, VPN/Direct Connect to on-premises), IAM (roles, policies, SSO), and shared services (logging, monitoring, DNS)

**Step 4: Migrate Wave 1 (Validation Wave)** (uses: docker-engineer)

containerize applications if replatforming. Use the Database Architect skill to plan database migration strategies (schema migration, data transfer, replication cutover). Use the Data Migration Specialist skill for zero-downtime data migration where required. Execute the migration: provision cloud infrastructure, migrate data, deploy application, validate functionality, switch traffic (DNS cutover or load balancer switch), and monitor. Keep the on-premises environment running as a rollback target for at least 2 weeks after cutover.

- Input: Wave 1 applications (low-risk, non-critical), Cloud foundation from Step 3, Migration strategy per application (rehost, replatform, etc.)
- Output: Migrated Wave 1 applications in cloud, Database migration scripts and verification reports, Cutover runbooks (step-by-step procedure)
- Key focus: Use the Docker Engineer skill to containerize applications if replatforming

**Step 5: Monitor and Optimize** (uses: monitoring-engineer)

set up cloud-native monitoring for migrated applications. Compare performance metrics against the on-premises baseline. Use the Cloud Cost Optimizer skill to identify optimization opportunities: right-size instances, implement auto-scaling, convert to reserved instances for stable workloads, use spot instances for batch processing, and clean up unused resources. Cloud costs in the first month are often 2-3x the steady-state cost due to over-provisioning -- optimization brings costs down to target.

- Input: Migrated applications from Step 4, SLIs/SLOs for migrated services, Cloud cost data
- Output: Cloud monitoring dashboards for migrated applications, Performance comparison report (cloud vs on-premises), Cost optimization report with recommendations
- Key focus: Use the Monitoring Engineer skill to set up cloud-native monitoring for migrated applications

**Step 6: Migrate Remaining Waves** (uses: aws-architect)

Execute remaining migration waves, applying lessons learned from Wave 1. Each wave should be faster than the previous one as the team builds expertise and reuses infrastructure patterns. For applications classified as Refactor, design cloud-native deployments. For applications classified as Retire or Repurchase, coordinate decommission with the SaaS replacement timeline. Track progress against the overall migration plan and adjust wave composition as needed.

- Input: Lessons learned from Wave 1, Remaining migration waves from Step 2, Refined processes and tooling
- Output: Migrated applications per wave, Migration progress dashboard, Updated cost comparison (cloud vs on-premises)
- Key focus: Execute remaining migration waves, applying lessons learned from Wave 1

**Step 7: Establish Cloud Governance** (uses: cloud-cost-optimizer)

establish ongoing cost governance: budget alerts, cost allocation tags, monthly cost review process, and anomaly detection. Use the Security Hardener skill to establish security governance: automated compliance scanning, security baseline enforcement, IAM review cadence, and incident response procedures for cloud. Create guardrails (Service Control Policies, landing zone rules) that prevent common mistakes without blocking development.

- Input: Fully migrated cloud environment, Ongoing cost management requirements, Compliance and security requirements
- Output: Cost governance framework (budgets, alerts, review process), Cost allocation tagging strategy, Security governance framework (scanning, compliance, review)
- Key focus: Use the Cloud Cost Optimizer skill to establish ongoing cost governance: budget alerts, cost allocation tags, monthly cost review process, and anomaly detection

## Decision Points

- **After Step ?:** 
  - If **After Step 1**: Fill assessment gaps before planning
  - If **After Step 3**: Fix foundation security before migrating workloads
  - If **After Step 4**: Resolve Wave 1 issues before migrating more
  - If **After Step 5**: Optimize before adding more workloads

## Failure Handling

- **Lift-and-shift everything:** -- Not every application should be rehosted. Some should be refactored, some repurchased as SaaS, and some retired. Use the 6 R's framework.
- **No cloud foundation:** -- Migrating applications without a solid foundation (networking, security, IAM) creates technical debt from day one.
- **Underestimating data migration:** -- Data migration is often the hardest part. Plan for data validation, cutover windows, and rollback.
- **Ignoring costs until the bill arrives:** -- Cloud spending can grow rapidly without governance. Set up cost monitoring and alerts before migration.
- **Big-bang migration:** -- Migrating everything at once is high-risk. Use waves, starting with low-risk applications.

## Expected Outcome

When this workflow is complete, the user will have:

1. All planned applications are migrated within the timeline and budget
2. Cloud costs are within 10% of projected estimates
3. Application performance meets or exceeds on-premises baseline
4. Zero data loss during migration
5. Downtime during migration stays within agreed business windows
6. Cloud governance prevents uncontrolled cost growth and security drift
7. Team is self-sufficient in cloud operations within 3 months of migration

## Output Format

```
CLOUD MIGRATION TRACKER
=======================

[ ] Step 1: Assess Current State
    Status: [pending/in-progress/complete]
[ ] Step 2: Plan Migration Waves
    Status: [pending/in-progress/complete]
[ ] Step 3: Set Up Cloud Foundation
    Status: [pending/in-progress/complete]
[ ] Step 4: Migrate Wave 1 (Validation Wave)
    Status: [pending/in-progress/complete]
[ ] Step 5: Monitor and Optimize
    Status: [pending/in-progress/complete]
[ ] Step 6: Migrate Remaining Waves
    Status: [pending/in-progress/complete]
[ ] Step 7: Establish Cloud Governance
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Lift-and-shift everything:** -- Not every application should be rehosted. Some should be refactored, some repurchased as SaaS, and some retired. Use the 6 R's framework.
- **No cloud foundation:** -- Migrating applications without a solid foundation (networking, security, IAM) creates technical debt from day one.
- **Underestimating data migration:** -- Data migration is often the hardest part. Plan for data validation, cutover windows, and rollback.
- **Ignoring costs until the bill arrives:** -- Cloud spending can grow rapidly without governance. Set up cost monitoring and alerts before migration.

## Example

**Input:** "I want to cloud migration and need a structured plan to follow step by step."

**Output:**

**Step 1 (risk-assessor-aws-architect):** Assess Current State -- produces concrete deliverables for this phase.

**Step 2 (aws-architect-risk-assessor):** Plan Migration Waves -- produces concrete deliverables for this phase.

**Step 3 (terraform-engineer-security-hardener):** Set Up Cloud Foundation -- produces concrete deliverables for this phase.

**Step 4 (docker-engineer-database-architect-data-migration-specialist):** Migrate Wave 1 (Validation Wave) -- produces concrete deliverables for this phase.

**Step 5 (monitoring-engineer-cloud-cost-optimizer):** Monitor and Optimize -- produces concrete deliverables for this phase.

**Step 6 (aws-architect-docker-engineer-kubernetes-operator):** Migrate Remaining Waves -- produces concrete deliverables for this phase.

**Step 7 (cloud-cost-optimizer-security-hardener):** Establish Cloud Governance -- produces concrete deliverables for this phase.

**Result:** User has a complete cloud migration plan with all deliverables produced, validated, and ready for implementation.
