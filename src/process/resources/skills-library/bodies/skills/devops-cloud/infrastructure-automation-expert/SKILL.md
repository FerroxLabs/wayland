---
name: infrastructure-automation-expert
description: |
  Infrastructure automation expertise covering Terraform module design and composition, policy-as-code with OPA and Sentinel, drift detection and remediation, self-service provisioning platforms, GitOps workflows, state management strategies, and building internal developer platforms that abstract infrastructure complexity.
  Use when the user asks about infrastructure automation expert, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of infrastructure automation expert or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud api-design automation safety"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Infrastructure Automation Expert

You are an expert infrastructure automation engineer who designs scalable, policy-compliant infrastructure provisioning systems. You build Terraform module libraries, implement policy-as-code guardrails, detect and remediate configuration drift, and create self-service platforms that empower developers while maintaining governance.


## When to Use

**Use this skill when:**
- User asks about infrastructure automation expert techniques or best practices
- User needs guidance on infrastructure automation expert concepts
- User wants to implement or improve their approach to infrastructure automation expert

**Do NOT use when:**
- The request falls outside the scope of infrastructure automation expert
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Cloud provider(s):** AWS, GCP, Azure, multi-cloud, or hybrid?
2. **IaC tool:** Terraform, Pulumi, CloudFormation, Crossplane, or evaluating?
3. **Scale:** How many environments, accounts/projects, and resources under management?
4. **Team structure:** Centralized platform team, federated teams, or hybrid?
5. **Current pain points:** Slow provisioning, drift, compliance, cost, or developer friction?
6. **Policy requirements:** SOC2, HIPAA, PCI, FedRAMP, or internal policies?
7. **CI/CD platform:** GitHub Actions, GitLab CI, Spacelift, Terraform Cloud, or other?

---

## Terraform Module Design

### Module Architecture

```
terraform-modules/
├── modules/                    # Reusable building blocks
│   ├── networking/
│   │   ├── vpc/               # VPC with subnets, NAT, flow logs
│   │   ├── security-group/    # Standard security group patterns
│   │   └── dns/               # Route53 zones and records
│   ├── compute/
│   │   ├── ecs-service/       # ECS Fargate service with ALB
│   │   ├── lambda/            # Lambda with IAM, logging
│   │   └── eks-cluster/       # EKS with managed node groups
│   ├── data/
│   │   ├── rds/               # RDS with backups, encryption
│   │   ├── s3-bucket/         # S3 with policies, lifecycle
│   │   └── elasticache/       # Redis/Memcached cluster
│   └── observability/
│       ├── cloudwatch/        # Dashboards, alarms, log groups
│       └── datadog/           # Datadog monitors and dashboards
│
├── patterns/                   # Composed patterns (use modules)
│   ├── web-service/           # VPC + ALB + ECS + RDS + monitoring
│   ├── api-service/           # API GW + Lambda + DynamoDB
│   └── data-pipeline/         # S3 + Glue + Athena + monitoring
│
└── live/                       # Environment configurations
    ├── production/
    │   ├── us-east-1/
    │   └── eu-west-1/
    ├── staging/
    └── development/
```

### Module Best Practices

```hcl
# modules/compute/ecs-service/main.tf

# 1. Clear variable definitions with validation
variable "service_name" {
  description = "Name of the ECS service"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,28}[a-z0-9]$", var.service_name))
    error_message = "Service name must be 4-30 lowercase alphanumeric characters."
  }
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

# 2. Sensible defaults with environment-aware sizing
locals {
  sizing = {
    development = { cpu = 256, memory = 512, min_count = 1, max_count = 2 }
    staging     = { cpu = 512, memory = 1024, min_count = 2, max_count = 4 }
    production  = { cpu = 1024, memory = 2048, min_count = 3, max_count = 10 }
  }
  config = local.sizing[var.environment]
}

# 3. Standard tagging
locals {
  standard_tags = {
    Service     = var.service_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Module      = "ecs-service"
    Owner       = var.team_name
    CostCenter  = var.cost_center
  }
}

# 4. Outputs for composition
output "service_url" {
  description = "URL of the deployed service"
  value       = "[external resource]"
}
```

### Module Versioning

```hcl
# Pin module versions in consumer code
module "payment_service" {
  source  = "app.terraform.io/myorg/ecs-service/aws"
  version = "~> 2.3"

  service_name = "payment-service"
  environment  = "production"
  team_name    = "payments"
}
```

---

## Policy as Code

### Open Policy Agent (OPA) with Terraform

```rego
# policies/terraform/required_tags.rego
package terraform.required_tags

import rego.v1

required_tags := {"Environment", "Owner", "ManagedBy", "Service"}

# Deny resources without required tags
deny contains msg if {
    resource := input.planned_values.root_module.resources[_]
    tags := object.get(resource.values, "tags", {})
    missing := required_tags - {key | tags[key]}
    count(missing) > 0
    msg := sprintf("Resource %s missing required tags: %v",
                   [resource.address, missing])
}

# Deny public S3 buckets
deny contains msg if {
    resource := input.planned_values.root_module.resources[_]
    resource.type == "aws_s3_bucket"
    acl := object.get(resource.values, "acl", "private")
    acl != "private"
    msg := sprintf("S3 bucket %s must not have public ACL",
                   [resource.address])
}
```

```shell
# Run OPA policy check in CI
terraform plan -out=tfplan
terraform show -json tfplan > tfplan.json
opa check --data policies/ --input tfplan.json \
    "data.terraform.required_tags.deny" --format pretty
```

---

## Drift Detection

### Detection Strategies

```
1. Terraform Plan Drift Detection (scheduled)
   - Run terraform plan on schedule (daily/weekly)
   - If plan shows changes, drift has occurred
   - Alert and create ticket for remediation

2. AWS Config Rules
   - Continuous compliance monitoring
   - Detects changes even outside Terraform
   - 150+ managed rules + custom rules

3. Cloud Custodian
   - Policy engine that scans cloud resources
   - Can detect non-compliant resources
   - Can auto-remediate (tag, stop, terminate)
```

### Automated Drift Detection Pipeline

```yaml
# .github/workflows/drift-detection.yml
name: Drift Detection
on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM

jobs:
  detect-drift:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [production, staging]
        region: [us-east-1, eu-west-1]
    steps:
      - uses: actions/checkout@v4

      - name: Terraform Init
        run: terraform init
        working-directory: live/${{ matrix.environment }}/${{ matrix.region }}

      - name: Terraform Plan (drift check)
        id: plan
        run: terraform plan -detailed-exitcode 2>&1 | tee plan.txt
        working-directory: live/${{ matrix.environment }}/${{ matrix.region }}
        continue-on-error: true

      - name: Report Drift
        if: steps.plan.outcome == 'failure'
        run: echo "DRIFT DETECTED in ${{ matrix.environment }}/${{ matrix.region }}"
```

---

## Self-Service Provisioning

### Developer Self-Service Architecture

```
Developer Request --> Service Catalog --> GitOps Pipeline --> Infrastructure

1. Developer fills form in internal portal
   "I need a new PostgreSQL database for my service"

2. Portal generates Terraform configuration
   Creates PR to infrastructure repo with:
   - Module instantiation with safe defaults
   - Policy-compliant configuration
   - Proper tagging and networking

3. Automated checks run
   - Terraform plan
   - Policy checks (OPA/Sentinel)
   - Cost estimation
   - Security scan

4. Auto-approve or require review
   - Standard resources: auto-approve
   - Expensive/sensitive resources: require platform team review

5. Merge triggers apply
   - GitOps: merge to main triggers terraform apply
   - Outputs (connection strings, endpoints) stored in vault
   - Developer notified with access details
```

---

## State Management

### State Organization

```
Strategy: One state file per environment per region per service group

live/
  production/
    us-east-1/
      networking/          # State: networking resources
        main.tf
        backend.tf         # s3://tfstate/prod/us-east-1/networking
      databases/           # State: all databases
      services/            # State: ECS services
    eu-west-1/
  staging/

Critical rules:
  - NEVER share state between environments
  - ALWAYS enable state locking (DynamoDB, GCS, etc.)
  - ALWAYS encrypt state at rest (contains secrets)
  - Enable state versioning (S3 versioning) for rollback
```

### State Locking and Recovery

```shell
# If state lock is stuck (crashed apply):
terraform force-unlock LOCK_ID

# State manipulation (use with extreme caution):
terraform state mv module.old_name module.new_name  # rename
terraform state rm aws_instance.web                  # remove from state
terraform state pull > backup.tfstate                # backup
terraform import aws_instance.web i-1234567890       # import existing
```

---

## GitOps Workflow

```
Feature Branch Workflow:
1. Developer creates branch
2. Makes infrastructure changes
3. Opens PR -- triggers terraform plan
4. Plan output posted as PR comment
5. Reviewers approve based on plan output
6. Merge to main -- triggers terraform apply
7. Apply output posted, PR closed

Safeguards:
  - terraform plan runs on every PR
  - Policy checks (OPA) must pass before merge
  - At least 1 approval required for production changes
  - Cost estimate shown in PR comment
  - Destructive changes (destroy) require 2 approvals
  - terraform apply runs only from main branch
  - State locking prevents concurrent applies
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to infrastructure automation expert
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Infrastructure Automation Expert Analysis

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

**Input:** "Help me with infrastructure automation expert for my current situation"

**Output:**

Based on your situation, here is a structured approach to infrastructure automation expert:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
