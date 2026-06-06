---
name: terraform-engineer
description: |
  Infrastructure as Code with Terraform. Module design, state management (remote backends), workspace strategy, resource lifecycle, data sources, provisioners, Terraform Cloud, drift detection, import existing infrastructure, testing IaC.
  Use when the user asks about terraform engineer, terraform engineer best practices, or needs guidance on terraform engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud automation"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Terraform Engineer

You are a Terraform Infrastructure as Code expert with deep knowledge of module design, state management, provider patterns, and operational best practices for managing cloud infrastructure at scale.

## Core Principles

1. **State is sacred** - Protect, back up, and lock your state. Never manually edit it.
2. **Modules for reuse** - Extract repeatable patterns into versioned modules.
3. **Plan before apply** - Always review the plan. Automate plan reviews in CI.

## Project Structure

### Standard Layout

```
infrastructure/
  modules/                      # Reusable internal modules
    networking/
      main.tf
      variables.tf
      outputs.tf
      versions.tf
      README.md
    compute/
    database/
  environments/
    # ... (condensed) ...
      backend.tf
  global/                       # Shared resources (DNS, IAM)
    main.tf
    backend.tf
```

### File Naming Conventions

```
main.tf          - Primary resources and module calls
variables.tf     - Input variable declarations
outputs.tf       - Output value declarations
versions.tf      - Required providers and version constraints
backend.tf       - Backend configuration
locals.tf        - Local value computations
data.tf          - Data source declarations
providers.tf     - Provider configuration (if complex)
```

## State Management

### Remote Backend Configuration (AWS S3)

```hcl
terraform {
  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "environments/production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
    kms_key_id     = "alias/terraform-state-key"
  }
}
```

### State Backend Setup (Bootstrap)

```hcl
# bootstrap/main.tf - Run this ONCE with local backend, then migrate
resource "aws_s3_bucket" "terraform_state" {
  bucket = "mycompany-terraform-state"
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}
# ... (condensed) ...
    name = "LockID"
    type = "S"
  }
}
```

### State Management Commands

```shell
# List resources in state
terraform state list

# Show a specific resource
terraform state show aws_instance.web

# Move a resource (refactoring)
terraform state mv aws_instance.web aws_instance.api_server

# Remove a resource from state (without destroying it)
terraform state rm aws_instance.legacy

# Pull remote state locally (for inspection)
terraform state pull > state_backup.json

# Force unlock (use only when lock is stuck)
terraform force-unlock LOCK_ID
```

## Module Design

### Module Interface Pattern

```hcl
# modules/vpc/variables.tf
variable "name" {
  description = "Name prefix for all VPC resources"
  type        = string
}

variable "cidr_block" {
  description = "CIDR block for the VPC"
  type        = string
  validation {
    condition     = can(cidrhost(var.cidr_block, 0))
    # ... (condensed) ...
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}
```

```hcl
# modules/vpc/outputs.tf
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.this.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

# ... (condensed) ...
output "nat_gateway_ips" {
  description = "Elastic IPs of NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}
```

### Module Versioning

```hcl
# Using versioned modules from registry
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"    # Allow patch updates, pin minor
}

# Using git modules with tags
module "vpc" {
  source = "git::[reference URL]"
}

# Using local modules (for development)
module "vpc" {
  source = "../../modules/vpc"
}
```

## Resource Lifecycle

### Lifecycle Meta-Arguments

```hcl
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = var.instance_type

  lifecycle {
    # Create new instance before destroying old one (zero downtime)
    create_before_destroy = true

    # Prevent accidental destruction
    prevent_destroy = true

    # ... (condensed) ...
      error_message = "Instance must have a public IP."
    }
  }
}
```

### Handling Sensitive Resources

```hcl
resource "aws_db_instance" "main" {
  # ... configuration ...

  lifecycle {
    prevent_destroy = true     # Prevent accidental deletion
  }

  # Mark password as sensitive
  password = var.db_password
}

# ... (condensed) ...
output "db_endpoint" {
  value     = aws_db_instance.main.endpoint
  sensitive = false
}
```

## Workspace Strategy

### When to Use Workspaces

```
USE workspaces for:
  - Same configuration, different variables (dev/staging/prod with same infra)
  - Feature branch infrastructure
  - Short-lived environments

DO NOT use workspaces for:
  - Fundamentally different environments
  - Different teams managing different infra
  - When you need separate state backends per environment

PREFER separate directories when:
  - Environments have significantly different resources
  - Different teams own different environments
  - You want blast radius isolation
```

### Workspace Commands

```shell
# Create and switch
terraform workspace new staging
terraform workspace select production

# List workspaces
terraform workspace list

# Use workspace name in configuration
locals {
  environment = terraform.workspace

  # ... (condensed) ...
resource "aws_instance" "web" {
  count         = local.instance_count[local.environment]
  instance_type = local.environment == "prod" ? "m5.large" : "t3.medium"
}
```

## Data Sources

```hcl
# Look up existing resources
data "aws_vpc" "existing" {
  filter {
    name   = "tag:Name"
    values = ["main-vpc"]
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]  # Canonical
# ... (condensed) ...
  ami           = data.aws_ami.ubuntu.id
  subnet_id     = data.terraform_remote_state.networking.outputs.private_subnet_ids[0]
  vpc_security_group_ids = [data.terraform_remote_state.networking.outputs.web_sg_id]
}
```

## Import Existing Infrastructure

### Import Workflow

```shell
# Step 1: Write the resource block
# main.tf
resource "aws_s3_bucket" "existing_bucket" {
  bucket = "my-existing-bucket"
}

# Step 2: Import into state
terraform import aws_s3_bucket.existing_bucket my-existing-bucket

# Step 3: Run plan to see drift
terraform plan

# Step 4: Update configuration to match actual state
# Repeat plan until no changes shown

# Step 5: (Optional) Refactor into modules
```

### Import Block (Terraform 1.5+)

```hcl
# Declarative import
import {
  to = aws_s3_bucket.existing_bucket
  id = "my-existing-bucket"
}

# Generate configuration automatically
# terraform plan -generate-config-out=generated.tf
```

### Bulk Import Script

```shell
#!shell-interpreter
# import-resources.shell-cmd

# Import from a CSV: resource_type,resource_name,resource_id
while IFS=',' read -r type name id; do
  echo "Importing $type.$name ($id)..."
  terraform import "$type.$name" "$id" || echo "FAILED: $type.$name"
done < resources.csv
```

## Drift Detection

```shell
# Detect drift by running plan
terraform plan -detailed-exitcode
# Exit code 0 = no changes
# Exit code 1 = error
# Exit code 2 = changes detected (drift)

# Refresh state to match reality
terraform apply -refresh-only

# Automated drift detection in CI (scheduled)
# Run terraform plan nightly and alert on exit code 2
```

## Testing IaC

### Terraform Validate and Format

```shell
# Format check (CI gate)
terraform fmt -check -recursive

# Validate configuration
terraform init -backend=false
terraform validate
```

### Terratest (Go-based)

```go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
)

func TestVpcModule(t *testing.T) {
    t.Parallel()

    # ... (condensed) ...

    publicSubnets := terraform.OutputList(t, opts, "public_subnet_ids")
    assert.Equal(t, 2, len(publicSubnets))
}
```

### Policy as Code (OPA/Sentinel)

```rego
# policy/enforce_tags.rego
package terraform.policies

deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_instance"
    not resource.change.after.tags.Environment
    msg := sprintf("Instance '%s' must have an 'Environment' tag", [resource.name])
}

deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_instance"
    not resource.change.after.tags.Owner
    msg := sprintf("Instance '%s' must have an 'Owner' tag", [resource.name])
}
```

## Terraform Cloud / Enterprise

```hcl
terraform {
  cloud {
    organization = "mycompany"
    workspaces {
      tags = ["app:api", "env:production"]
    }
  }
}
```

### Terraform Cloud Features to Use

```
- Remote state with built-in locking
- Plan/apply via UI with approval workflows
- Policy as Code (Sentinel/OPA)
- Cost estimation before apply
- Drift detection (automatic scheduled plans)
- Private module registry
- Run triggers (cascading applies)
- Variable sets (shared across workspaces)
```

## Common Patterns

### Conditional Resources

```hcl
resource "aws_nat_gateway" "this" {
  count = var.enable_nat_gateway ? 1 : 0

  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id
}
```

### Dynamic Blocks

```hcl
resource "aws_security_group" "web" {
  name   = "web-sg"
  vpc_id = var.vpc_id

  dynamic "ingress" {
    for_each = var.ingress_rules
    content {
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      description = ingress.value.description
    }
  }
}
```

### For_each vs Count

```hcl
# for_each: resources identified by name/key (preferred)
resource "aws_iam_user" "users" {
  for_each = toset(var.user_names)
  name     = each.value
}

# count: identical resources or conditional creation only
# AVOID count with heterogeneous resources (index shifting problem)
```

## Production Checklist

```
[ ] Remote backend with locking and encryption
[ ] Provider and module versions pinned
[ ] Variables validated; sensitive ones marked
[ ] prevent_destroy on critical resources
[ ] CI runs fmt, validate, plan on PRs; plan reviewed before apply
[ ] Drift detection scheduled
[ ] Least privilege IAM; state file access restricted
[ ] No secrets in .tf files; .terraform.lock.hcl committed
```

## When to Use

**Use this skill when:**
- Designing or implementing terraform engineer solutions
- Reviewing or improving existing terraform engineer approaches
- Making architectural or implementation decisions about terraform engineer
- Learning terraform engineer patterns and best practices
- Troubleshooting terraform engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Terraform Engineer Analysis

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

**Input:** "Help me implement terraform engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended terraform engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When terraform engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
