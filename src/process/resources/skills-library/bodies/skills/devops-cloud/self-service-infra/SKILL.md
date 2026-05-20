---
name: self-service-infra
description: |
  Build self-service infrastructure platforms with Terraform modules, provisioning automation, approval workflows, and developer-friendly abstractions
  Use when the user asks about self service infra, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of self service infra or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud budgeting template guide python api-design automation"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Self-Service Infrastructure

You are a self-service infrastructure architect who helps platform teams build systems that let developers provision and manage infrastructure independently. You guide through Terraform module design, provisioning automation, approval workflows, and abstraction layers that hide complexity while maintaining control.


## When to Use

**Use this skill when:**
- User asks about self service infra techniques or best practices
- User needs guidance on self service infra concepts
- User wants to implement or improve their approach to self service infra

**Do NOT use when:**
- The request falls outside the scope of self service infra
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Self-Service Architecture

### Platform Layer Model

```
┌─────────────────────────────────────────────┐
│  Developer Interface Layer                   │
│  CLI / Portal / API / GitOps                │
├─────────────────────────────────────────────┤
│  Abstraction Layer                           │
│  Service Catalog → Request → Validate        │
├─────────────────────────────────────────────┤
│  Orchestration Layer                         │
│  Approval → Plan → Apply → Verify            │
├─────────────────────────────────────────────┤
│  Infrastructure Layer                        │
│  Terraform / Pulumi / CloudFormation         │
├─────────────────────────────────────────────┤
│  Cloud Provider Layer                        │
│  AWS / Azure / GCP                          │
└─────────────────────────────────────────────┘
```

### Request Flow

```
Developer                Platform                  Infrastructure
    │                       │                           │
    ├─ Request via CLI ────→│                           │
    │                       ├─ Validate request         │
    │                       ├─ Check policies           │
    │                       ├─ Estimate cost            │
    │  ←── Show plan ──────┤                           │
    ├─ Approve ────────────→│                           │
    │                       ├─ Route for approval       │
    │                       ├─ Generate Terraform ─────→│
    │                       │                           ├─ Plan
    │                       │                           ├─ Apply
    │                       │  ←── Results ────────────┤
    │                       ├─ Register in catalog      │
    │  ←── Ready ──────────┤                           │
```

## Terraform Module Design

### Module Structure

```
modules/
  ├── database/
  │   ├── postgresql/
  │   │   ├── main.tf
  │   │   ├── variables.tf
  │   │   ├── outputs.tf
  │   │   ├── versions.tf
  │   │   ├── examples/
  │   │   └── tests/
  │   └── redis/
  ├── compute/
  │   ├── kubernetes-service/
  │   └── lambda-function/
  ├── networking/
  │   ├── vpc/
  │   └── load-balancer/
  └── storage/
      ├── s3-bucket/
      └── efs/
```

### Opinionated Module Example

```hcl
# modules/database/postgresql/main.tf
resource "aws_db_instance" "main" {
  identifier = "${var.team}-${var.name}-${var.environment}"

  engine         = "postgres"
  engine_version = var.engine_version
  instance_class = local.size_map[var.size]

  # Opinionated: Always encrypt, backup, monitor
  storage_encrypted           = true
  kms_key_id                  = var.kms_key_id != "" ? var.kms_key_id : aws_kms_key.db.arn
  backup_retention_period     = var.environment == "production" ? 30 : 7
  backup_window               = "03:00-04:00"
  multi_az                    = var.environment == "production"
  deletion_protection         = var.environment == "production"
  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn         = aws_iam_role.rds_monitoring.arn

  # Opinionated: Private subnets only
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]

  tags = merge(var.additional_tags, {
    Team        = var.team
    Environment = var.environment
    ManagedBy   = "terraform"
    Service     = var.name
    CostCenter  = var.cost_center
  })
}

locals {
  size_map = {
    small  = "db.t3.small"    # 2 vCPU, 2GB RAM
    medium = "db.r6g.large"   # 2 vCPU, 16GB RAM
    large  = "db.r6g.xlarge"  # 4 vCPU, 32GB RAM
    xlarge = "db.r6g.2xlarge" # 8 vCPU, 64GB RAM
  }
}
```

### Module Variables Design

```hcl
# modules/database/postgresql/variables.tf

# Developer-facing variables (simple choices)
variable "name" {
  description = "Database name (lowercase alphanumeric with hyphens)"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,30}$", var.name))
    error_message = "Name must be 3-31 chars, lowercase alphanumeric with hyphens."
  }
}

variable "team" {
  description = "Owning team identifier"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "size" {
  description = "Database size profile"
  type        = string
  default     = "small"
  validation {
    condition     = contains(["small", "medium", "large", "xlarge"], var.size)
    error_message = "Size must be small, medium, large, or xlarge."
  }
}

variable "engine_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "16"
  validation {
    condition     = contains(["15", "16"], var.engine_version)
    error_message = "Supported versions: 15, 16."
  }
}

# Platform-managed variables (set by automation, not developers)
variable "vpc_id" {
  description = "VPC ID (set by platform automation)"
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs (set by platform automation)"
  type        = list(string)
}

variable "kms_key_id" {
  description = "KMS key for encryption (set by platform automation)"
  type        = string
  default     = ""
}

variable "cost_center" {
  description = "Cost center for billing (set by platform automation)"
  type        = string
}

variable "additional_tags" {
  description = "Additional tags (set by platform automation)"
  type        = map(string)
  default     = {}
}
```

### Module Outputs

```hcl
# modules/database/postgresql/outputs.tf
output "endpoint" {
  description = "Database connection endpoint"
  value       = aws_db_instance.main.endpoint
}

output "port" {
  description = "Database port"
  value       = aws_db_instance.main.port
}

output "connection_secret_arn" {
  description = "ARN of Secrets Manager secret containing credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "monitoring_dashboard_url" {
  description = "URL to the monitoring dashboard"
  value       = "[external resource]"
}

output "cost_estimate_monthly" {
  description = "Estimated monthly cost in USD"
  value       = local.cost_estimates[var.size]
}
```

## Provisioning Automation

### GitOps-Based Provisioning

```yaml
# infrastructure-requests/team-payments/staging-redis.yaml
apiVersion: platform.internal/v1
kind: InfrastructureRequest
metadata:
  name: payments-session-cache
  team: team-payments
  requestedBy: jane.smith
spec:
  type: redis
  environment: staging
  configuration:
    size: medium
    version: "7"
    clusterMode: false
    evictionPolicy: allkeys-lru
  justification: "Session caching for payments flow to reduce database load"
status:
  state: pending  # pending → approved → provisioning → ready → failed
```

### Request Processing Pipeline

```
GitOps Pipeline (GitHub Actions on PR to infrastructure-requests/):
1. Validate: Schema check → Policy check → Cost estimate → Comment on PR
2. Plan: Generate Terraform from request → terraform plan → Post plan to PR
3. Provision (on merge): terraform apply → Register in catalog → Configure monitoring → Notify requester
```

## Approval Workflows

### Approval Matrix

```yaml
# approval-policies.yaml
policies:
  - name: development-auto-approve
    conditions:
      environment: development
      cost_monthly_max: 200
      resource_types: [redis, postgresql, s3-bucket]
    approval: automatic
    sla: "5 minutes"

  - name: staging-team-lead
    conditions:
      environment: staging
      cost_monthly_max: 1000
    approval:
      required_approvers: 1
      approver_groups: [team-lead]
    sla: "4 hours"

  - name: production-standard
    conditions:
      environment: production
      cost_monthly_max: 5000
    approval:
      required_approvers: 2
      approver_groups: [team-lead, platform-team]
    sla: "1 business day"

  - name: production-high-cost
    conditions:
      environment: production
      cost_monthly_min: 5000
    approval:
      required_approvers: 3
      approver_groups: [team-lead, platform-team, finance]
    sla: "3 business days"

  - name: security-sensitive
    conditions:
      resource_types: [iam-role, security-group, public-endpoint]
    approval:
      required_approvers: 2
      approver_groups: [security-team, platform-team]
    sla: "1 business day"
```

### Approval Workflow Flow

```
Request Submitted
    │
    ├─ Automatic Validation
    │   ├─ Schema valid? Budget available? Quotas not exceeded?
    │
    ├─ Route to Approvers
    │   ├─ Match approval policy → Identify approvers → Notify
    │
    ├─ Approval Tracking
    │   ├─ Track approvals, remind after SLA/2, escalate after SLA
    │
    ├─ Post-Approval
    │   ├─ Generate infrastructure code → Plan → Apply → Verify
    │
    └─ Delivery
        ├─ Store credentials in vault
        ├─ Update service catalog
        ├─ Configure monitoring
        └─ Notify requester with details
```

## Developer-Friendly Abstractions

### Abstraction Levels

```
Level 1: Raw Infrastructure (for platform team)
  "I need an EC2 instance with this AMI, in this subnet..."

Level 2: Resource Modules (for experienced devs)
  "I need a PostgreSQL database, size medium, in staging"
  Module handles: instance type, networking, encryption, backups, monitoring

Level 3: Service Bundles (for most developers)
  "I need a web service with a database and cache"
  Bundle handles: compute + database + cache + networking + monitoring

Level 4: Application Templates (for everyone)
  "I need a payments microservice"
  Template handles: everything from git repo to production deployment
```

### Service Bundle Example

```yaml
apiVersion: platform.internal/v1
kind: ServiceBundle
metadata:
  name: web-service-with-database
  description: Complete web service with database, cache, monitoring, and CI/CD.
spec:
  parameters:
    - name: serviceName
      type: string
      required: true
    - name: team
      type: string
      required: true
    - name: databaseSize
      type: string
      default: small
      enum: [small, medium, large]
    - name: cacheEnabled
      type: boolean
      default: false

  resources:
    - name: compute
      module: kubernetes-service
      inputs:
        name: "{{ .serviceName }}"
        team: "{{ .team }}"
    - name: database
      module: postgresql
      inputs:
        name: "{{ .serviceName }}-db"
        size: "{{ .databaseSize }}"
    - name: cache
      module: redis
      condition: "{{ .cacheEnabled }}"
      inputs:
        name: "{{ .serviceName }}-cache"
    - name: monitoring
      module: monitoring-stack
      inputs:
        serviceName: "{{ .serviceName }}"
        database: "{{ .resources.database.outputs.endpoint }}"

  outputs:
    serviceUrl: "{{ .resources.compute.outputs.url }}"
    databaseEndpoint: "{{ .resources.database.outputs.endpoint }}"
    dashboardUrl: "{{ .resources.monitoring.outputs.dashboard_url }}"
```

## Cost Management

### Cost Estimation

```python
COST_TABLE = {
    "postgresql": {
        "small":  {"monthly": 50},
        "medium": {"monthly": 200},
        "large":  {"monthly": 500},
    },
    "redis": {
        "small":  {"monthly": 30},
        "medium": {"monthly": 120},
    },
    "kubernetes-service": {
        "low":    {"monthly": 50},
        "medium": {"monthly": 150},
        "high":   {"monthly": 400},
    },
}

def estimate_cost(request):
    resource_type = request["spec"]["type"]
    size = request["spec"]["configuration"]["size"]
    env_multiplier = {"development": 1.0, "staging": 1.0, "production": 1.5}
    base = COST_TABLE[resource_type][size]["monthly"]
    multiplier = env_multiplier[request["spec"]["environment"]]
    return {"monthly": base * multiplier, "annual": base * multiplier * 12}
```

### Budget Tracking

```yaml
team-budgets:
  team-payments:
    monthly_limit: 5000
    alert_threshold: 80
    environments:
      development: 500
      staging: 1000
      production: 3500
    current_usage:
      development: 320
      staging: 750
      production: 2100
    remaining: 1830
```

## Lifecycle Management

```
Provisioned → Active → Review → Extend/Decommission

Automated lifecycle events:
  - Tag resources with creation date and TTL
  - Send reminders before TTL expiration
  - Auto-stop development resources outside business hours
  - Flag unused resources (no connections for 30 days)
  - Generate decommission plan for end-of-life resources
```

### Cleanup Automation

```hcl
resource "aws_db_instance" "main" {
  tags = {
    CreatedAt       = timestamp()
    TTL             = var.environment == "development" ? "30d" : "permanent"
    LastAccessCheck = timestamp()
    ManagedBy       = "self-service-platform"
    RequestId       = var.request_id
  }
}

# Lambda function checks TTL tags daily
# Sends warning 7 days before expiry
# Snapshots and terminates after TTL + grace period
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to self service infra
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Self Service Infra Analysis

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

**Input:** "Help me with self service infra for my current situation"

**Output:**

Based on your situation, here is a structured approach to self service infra:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
