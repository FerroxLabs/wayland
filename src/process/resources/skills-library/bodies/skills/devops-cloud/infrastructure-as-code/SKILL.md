---
name: infrastructure-as-code
description: |
  Guides expert-level infrastructure as code implementation: automation and cloud decision frameworks, production-ready patterns, and concrete templates for infrastructure as code workflows.
  Use when the user asks about infrastructure as code, infrastructure as code configuration, or devops best practices for infrastructure projects.
  Do NOT use when the user needs a different devops cloud capability -- check sibling skills in the devops cloud subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops automation cloud"
  category: "devops-cloud"
  subcategory: "devops-cloud"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Infrastructure As Code

## When to Use

**Use this skill when:**
- The user asks about writing, structuring, or managing Terraform, Pulumi, AWS CDK, Bicep, Crossplane, or Ansible configurations for production infrastructure
- The user wants to migrate from manual ClickOps provisioning or shell scripts to declarative IaC
- The user needs to design module structure, state management strategy, or workspace layout for a multi-environment IaC project
- The user asks about drift detection, plan validation, policy-as-code (OPA, Sentinel, Checkov), or IaC testing pipelines
- The user needs to implement GitOps-style infrastructure delivery with PR-based plan review and apply gates
- The user is debugging a Terraform state conflict, import block, or provider version mismatch
- The user wants to refactor a monolithic Terraform root module into composable, versioned modules
- The user asks about secret injection, remote state backends, or workload identity for IaC pipelines

**Do NOT use this skill when:**
- The user needs container orchestration specifics (Kubernetes manifests, Helm charts, Kustomize) -- use the container-orchestration skill instead
- The user is asking about CI/CD pipeline configuration (GitHub Actions YAML, Tekton pipelines) for application code rather than infrastructure -- use the ci-cd-pipelines skill
- The user needs cloud cost optimization analysis without IaC context -- use the cloud-cost-management skill
- The user wants operational runbooks or incident response for live infrastructure failures without an IaC angle
- The user is asking about application configuration management (environment variables, feature flags) not infrastructure provisioning
- The user needs networking design theory without IaC implementation -- use the cloud-networking skill

---

## Process

### 1. Identify the IaC Toolchain and Scope

Before writing a single line of HCL or TypeScript, establish the exact context:

- **Tool selection criteria:** Use Terraform/OpenTofu when the team spans multiple cloud providers or already has HCL expertise. Use AWS CDK (TypeScript) when the team is AWS-native and prefers imperative constructs and strong typing. Use Pulumi when the team wants general-purpose languages (Python, Go, TypeScript) and avoids DSL learning overhead. Use Bicep/ARM when the organization is Microsoft-first and needs tight Azure policy integration. Use Crossplane when the control plane must run inside Kubernetes and platform teams own cloud resource APIs.
- **Scope boundaries:** Determine what is in scope for IaC vs. what is managed by other systems. Kubernetes workloads, DNS records managed by external-dns, and database schemas managed by Flyway are typically out of scope for Terraform.
- **State of existing infrastructure:** If resources already exist, plan the import strategy before writing any new code. Terraform 1.5+ import blocks allow declarative, PR-reviewable imports. For large existing estates, use Terraformer or aws2tf to generate a baseline, then clean up generated code before committing.
- **Team scale signals:** 1-3 engineers -- monorepo with a single state backend and simple workspace separation is fine. 4-15 engineers -- split by functional domain (networking, compute, data) with separate state files and CI-gated applies. 15+ engineers -- full platform team model with published module registry and self-service via Terraform Cloud or Atlantis.

---

### 2. Design the Repository and Module Structure

Module structure decisions made at the start compound in either direction over years:

- **Root module vs. child module distinction:** Root modules are the entry points that get planned and applied (they have `terraform.tfvars`, `backend.tf`, and environment-specific values). Child modules are reusable units that accept variables and produce outputs -- they should never have backend configuration.
- **Recommended monorepo layout for Terraform:**
  ```
  infra/
  ├── modules/
  │   ├── networking/        # VPC, subnets, NAT gateways
  │   ├── eks-cluster/       # EKS control plane + node groups
  │   ├── rds-postgres/      # RDS instance + parameter groups + secrets
  │   └── observability/     # CloudWatch, Grafana, Prometheus stack
  ├── environments/
  │   ├── dev/
  │   │   ├── main.tf        # Calls modules with dev-appropriate values
  │   │   ├── terraform.tfvars
  │   │   └── backend.tf
  │   ├── staging/
  │   └── prod/
  └── .github/
      └── workflows/
          └── terraform.yml
  ```
- **Module versioning:** Once a module is consumed by multiple environments or teams, version it via Git tags (`v1.2.0`) and reference it with `source = "git::https://github.com/org/infra-modules.git//eks-cluster?ref=v1.2.0"`. Never pin to a branch in production. Use a private Terraform Registry (Terraform Cloud, JFrog) for enterprise module distribution.
- **Separation of state files by blast radius:** Networking state should be separate from compute state. A plan/apply failure in the compute layer must never lock or corrupt the networking state. Group resources by: (a) how often they change, and (b) what the blast radius is if apply fails.
- **Naming conventions:** Every resource name must encode: environment, region, team/service, resource type. Example: `prod-us-east-1-payments-rds-pg`. This prevents name collisions and makes resource ownership unambiguous in cost reports.

---

### 3. Configure Remote State and Locking

Unmanaged state is the single biggest source of IaC incidents:

- **Backend selection:** Use S3 + DynamoDB for AWS-native teams (DynamoDB provides optimistic locking; use `PAY_PER_REQUEST` billing). Use Azure Blob Storage with lease-based locking for Azure. Use GCS with object versioning for GCP. Use Terraform Cloud/HCP Terraform when you need a managed control plane with RBAC, audit logs, and policy enforcement as a service.
- **State encryption:** Enable server-side encryption on the S3 bucket (AES-256 or KMS). Enable bucket versioning so state can be rolled back after accidental deletion. Enable S3 Object Lock with Compliance mode and a 30-day retention on production state buckets.
- **State isolation per environment:** Never share a state file between dev and prod. Each environment gets its own backend configuration with its own S3 prefix: `s3://company-tfstate/prod/networking/terraform.tfstate`.
- **Workspaces caveat:** Terraform workspaces share a single backend configuration and are appropriate for ephemeral feature environments (e.g., per-PR preview environments). They are NOT appropriate for dev/staging/prod isolation because they share provider configurations and make it easy to accidentally apply to the wrong environment. Use separate root modules for environment isolation.
- **State manipulation guardrails:** `terraform state mv` and `terraform state rm` must require two-person approval in production. Log all state operations. Never run `terraform force-unlock` without confirming the lock-holding process is dead.

---

### 4. Implement Variable Hierarchy and Secret Management

Variable management done wrong creates either brittle or insecure infrastructure:

- **Variable tiering:** Define variables at three levels: (a) module defaults for safe, overridable values; (b) environment-specific `terraform.tfvars` checked into version control for non-sensitive values; (c) sensitive values injected at runtime from a secrets manager, never committed to Git.
- **Sensitive variable handling:** Mark variables containing credentials, API keys, or tokens with `sensitive = true` in Terraform. This redacts them from `terraform plan` and `terraform apply` output. Even with this flag, sensitive values appear in state -- which is why state encryption is mandatory.
- **Secret injection patterns:**
  - CI/CD-injected: GitHub Actions OIDC with workload identity federation -- no static credentials stored anywhere. The pipeline assumes an IAM role with `sts:AssumeRoleWithWebIdentity` scoped to the specific repository and branch.
  - Runtime secret reference: Use `data "aws_secretsmanager_secret_version"` to pull secrets at plan/apply time. The secret ARN is a non-sensitive variable; the secret value is never in tfvars.
  - Vault integration: Use the Vault provider with AppRole or Kubernetes auth to pull secrets dynamically during apply.
- **Variable validation blocks:** Use Terraform `validation` blocks to catch invalid inputs at plan time, before any API calls. For example, validate that `environment` is one of `["dev", "staging", "prod"]`, that instance types match an approved list, or that CIDR blocks don't overlap with reserved ranges.

---

### 5. Write Production-Ready Resource Configurations

Every resource configuration must be immediately deployable, not a placeholder:

- **Resource tagging strategy:** Enforce mandatory tags via a `locals` block that merges module-level defaults with resource-specific overrides. Required tags: `Environment`, `Team`, `Service`, `ManagedBy = "terraform"`, `TerraformModule`, `CostCenter`. Use AWS Tag Policies or Azure Policy to deny resources missing mandatory tags.
- **Lifecycle blocks:** Use `prevent_destroy = true` on stateful resources (RDS instances, S3 buckets with data, EKS clusters). Use `create_before_destroy = true` for resources that must have zero-downtime replacement (Auto Scaling Groups, Load Balancer target groups). Use `ignore_changes` sparingly and document every usage -- `ignore_changes = [ami]` is appropriate for ASGs where the AMI is managed by an image pipeline, not Terraform.
- **Data source vs. hardcoded values:** Never hardcode AMI IDs, VPC IDs, subnet IDs, or account IDs. Use data sources (`data "aws_ami"`, `data "aws_vpc"`) or remote state outputs (`data "terraform_remote_state"`) to look up existing resources dynamically. Hardcoded IDs break when resources are recreated.
- **For_each over count:** Use `for_each` with a map or set of strings when creating multiple similar resources. `count` creates indexed resources (`aws_subnet.this[0]`) -- removing an element from the middle of the list triggers destructive replacements of all subsequent resources. `for_each` creates named resources (`aws_subnet.this["us-east-1a"]`) -- removals are surgical.
- **Output discipline:** Every module must output the IDs, ARNs, and names of every resource it creates. Consumers of the module should never need to reconstruct ARNs from interpolation -- the module provides them. Mark sensitive outputs with `sensitive = true`.

---

### 6. Build the IaC CI/CD Pipeline

A plan that nobody reviews is a plan that will eventually cause an outage:

- **Pipeline stages:**
  1. `terraform fmt -check` -- fails if code is not canonical format (enforces style in PRs)
  2. `terraform validate` -- syntax and provider schema validation without API calls
  3. Static analysis with Checkov or tfsec -- catches security misconfigurations (open security groups, unencrypted buckets, missing logging) before they reach AWS
  4. `terraform plan` against the target environment -- saves plan output as a binary artifact for the apply stage
  5. OPA/Sentinel policy evaluation against the saved plan -- enforces organizational policies (e.g., no public S3 buckets, all RDS instances must have deletion protection, only approved instance families)
  6. Manual approval gate for prod (automated apply for dev/staging)
  7. `terraform apply` consuming the saved plan file -- ensures what was reviewed is exactly what gets applied
  8. Post-apply smoke tests -- verify expected outputs and resource health

- **Plan/apply separation:** Always pass the plan file to apply: `terraform apply tfplan.binary`. This guarantees no drift between the reviewed plan and the applied changes. Never run `terraform apply` without a saved plan in CI.
- **Atlantis vs. Terraform Cloud:** Atlantis is self-hosted, open-source, and integrates with GitHub/GitLab PR comments (`atlantis plan`, `atlantis apply`). It works well for teams that want control over the runner. Terraform Cloud provides managed runners, a private registry, SSO, and audit logs at the cost of vendor lock-in and pricing per resource.
- **Drift detection:** Schedule a `terraform plan` on a cron (every 4-6 hours) against all production state files. Alert on any non-empty plan output. Drift indicates either a manual change that must be codified or a resource modified by an external system. Never let drift accumulate silently.

---

### 7. Implement Policy-as-Code and Compliance Controls

IaC without policy enforcement is an honor system:

- **Checkov rules to enforce by default:** `CKV_AWS_18` (S3 access logging), `CKV_AWS_20` (S3 public ACL blocked), `CKV_AWS_23` (RDS deletion protection), `CKV_AWS_53` (ELB deletion protection), `CKV_AWS_119` (DynamoDB point-in-time recovery), `CKV_AWS_145` (S3 KMS encryption). Add these to your CI pipeline as hard failures.
- **OPA policy example structure:** Write Rego policies that evaluate the `terraform plan` JSON output (`terraform show -json tfplan.binary`). Policies should check `resource_changes` for `after` values. A policy blocking public S3 buckets evaluates `resource_changes[_].change.after.acl == "public-read"` and returns a deny with a descriptive message.
- **Required provider version pinning:** Every root module must pin provider versions with pessimistic constraints: `version = "~> 5.0"` allows minor version upgrades (5.x) but not major. Required Terraform version must also be pinned: `required_version = ">= 1.6.0, < 2.0.0"`. Use `.terraform.lock.hcl` committed to version control to pin exact provider checksums.
- **Module pinning in production:** Production root modules must reference modules via exact Git tags or registry versions. `source = "terraform-aws-modules/vpc/aws"` with `version = "5.1.2"` is correct. `version = "~> 5.0"` is acceptable in dev but risky in prod because a minor-version module update could change resource behavior.

---

### 8. Document, Test, and Establish the Operational Model

IaC without tests creates false confidence:

- **Testing pyramid for IaC:**
  - Unit: `terraform validate` + static analysis (runs in seconds, catches syntax and obvious misconfigs)
  - Integration: Terratest or pytest-terratest -- actually creates real cloud resources in a dedicated test account, runs assertions, then destroys resources. Use for module validation before publishing new versions.
  - End-to-end: Apply full environment stack in a staging account and run application-level smoke tests
- **Terratest pattern:** Write Go tests that call `terraform.InitAndApply()`, assert outputs match expected values, make HTTP calls to verify endpoints are reachable, then call `terraform.Destroy()` in a deferred cleanup. Gate module releases on passing Terratest results.
- **Architecture Decision Records:** Store ADRs in `infra/docs/adr/` as numbered Markdown files (`001-state-backend-choice.md`, `002-module-versioning-strategy.md`). Each ADR documents: status (proposed/accepted/deprecated), context, decision, consequences. ADRs prevent the same debates from recurring and explain why the current structure looks the way it does.
- **Runbooks:** Every module must have a `README.md` with: purpose, inputs table, outputs table, usage example, known limitations, and upgrade notes between major versions. Generated documentation via `terraform-docs` reduces the maintenance burden -- run it as a pre-commit hook or CI check.

---

## Output Format

When responding to a user's IaC question, produce output in this structure:

### Situation Assessment

| Factor | Observed Value | Implication |
|---|---|---|
| Tool | Terraform 1.7 / Pulumi / CDK | Affects syntax and state model |
| Environment count | 3 (dev/staging/prod) | Separate state files per environment |
| Team size | 8 engineers | Atlantis or TF Cloud for plan review |
| Cloud provider | AWS / Azure / GCP / Multi | Affects provider pinning and backend |
| Existing infra | Greenfield / Migration | Affects import strategy |
| Compliance needs | SOC 2 / HIPAA / None | Affects policy-as-code requirements |

### Recommended Structure

(Provide the directory tree and explain each directory's role)

### Configuration Artifacts

Provide complete, deployable files with inline comments explaining every non-obvious setting. Never use placeholder values.

**Backend configuration** (`backend.tf`):
```hcl
terraform {
  backend "s3" {
    # Real values -- not placeholders
    bucket         = "company-tfstate-prod-us-east-1"
    key            = "prod/networking/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-locks"
    encrypt        = true
    kms_key_id     = "arn:aws:kms:us-east-1:123456789:key/mrk-abc123"
  }
}
```

**Provider and version pins** (`versions.tf`):
```hcl
terraform {
  required_version = ">= 1.6.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.31"
    }
  }
}
```

### Decision Matrix

| Criterion | Option 1 | Option 2 | Winner | Rationale |
|---|---|---|---|---|
| Multi-cloud support | Terraform: Yes | CDK: AWS-only | Terraform | Org uses AWS + Azure |
| Language familiarity | HCL (new DSL) | TypeScript (known) | CDK | Team is TypeScript-native |
| State management | Built-in S3 | CDK requires TF/CFN | Depends | See rationale |
| Policy integration | OPA/Sentinel | CloudFormation Guard | Terraform | Richer policy ecosystem |

### Security Controls Checklist

- [ ] State bucket encrypted with KMS CMK
- [ ] State bucket versioning enabled with 30-day Object Lock
- [ ] DynamoDB state lock table with encryption
- [ ] OIDC workload identity for CI -- no static credentials
- [ ] `sensitive = true` on all password/key variables
- [ ] Checkov integrated in CI with hard-fail on critical rules
- [ ] `prevent_destroy = true` on all stateful resources in prod
- [ ] Mandatory tags enforced via locals + provider default_tags

### Pipeline Configuration

Provide the complete CI workflow file (GitHub Actions, GitLab CI, or CircleCI) with all stages.

---

## Rules

1. **Never share state files between environments.** Dev, staging, and prod must each have their own backend key path and ideally their own S3 bucket. Sharing state is the #1 cause of accidental production changes during development activity.

2. **Never use `count` for resources that might be removed from the middle of a list.** Use `for_each` with a map keyed by a stable, meaningful identifier (availability zone name, service name). Index-based addressing (`resource[0]`, `resource[1]`) causes destructive replacement cascades when the list order changes.

3. **Never commit secrets to tfvars or anywhere in the repository.** All passwords, API keys, and tokens must come from environment-injected secrets (OIDC, Vault, Secrets Manager data sources). Failing this rule once can expose credentials in Git history permanently, requiring rotation of every affected secret.

4. **Always pin provider versions with pessimistic constraints and commit the lock file.** Unpinned providers cause silent, unreproducible plan differences between developers and CI. The `.terraform.lock.hcl` file must be committed and its changes reviewed like any other code change.

5. **Always run `terraform plan` before `terraform apply` and save the plan as an artifact.** The saved plan file passed to `apply` guarantees that exactly the reviewed changes are applied. Ad-hoc `terraform apply` without a plan file is prohibited in staging and production environments.

6. **Never use `terraform workspace` for environment isolation.** Workspaces share backend configuration and provider credentials, making cross-environment accidental applies too easy. Use separate root modules in separate directories for each environment.

7. **Always use `for_each` with module calls when creating multiple similar infrastructure stacks** (e.g., multiple microservice ECS services). This enables adding and removing individual stacks without affecting others and produces named resources in state that are easy to identify.

8. **Never ignore Checkov or tfsec findings without a documented suppression comment.** Each suppression must include the rule ID, the reason it does not apply, and the author. Example: `#checkov:skip=CKV_AWS_20:Internal bucket -- not reachable from internet, ACL restriction not applicable`. Undocumented suppressions are treated as findings in audit.

9. **Always implement drift detection as a scheduled pipeline job.** Manual changes applied outside Terraform (ClickOps, AWS CLI, auto-scaling events that modify resource attributes) accumulate silently. Drift must be detected and either codified or reverted within one business day.

10. **Never write a module that cannot be used in isolation with a minimal `main.tf` example.** Every module must include a `examples/basic/` directory with a working, deployable example. This enforces that modules have clean interfaces and prevents implicit coupling to the calling root module's state.

---

## Edge Cases

### Importing Existing Infrastructure

When an organization has years of manually provisioned AWS resources that must come under Terraform management without destroying and recreating them:

- Use Terraform 1.5+ `import` blocks for a declarative, reviewable import process. Write the resource configuration, add an `import` block with the resource address and cloud ID, run `terraform plan` to verify the import produces no changes, then `terraform apply` to write the resource into state.
- For large-scale imports (hundreds of resources), use Terraformer (`terraformer import aws --resources=vpc,subnet,sg --regions=us-east-1`) to generate a baseline. Treat generated code as a draft -- it will contain hardcoded values and redundant attributes that need cleanup before committing.
- After import, run `terraform plan` and expect a non-empty plan for attributes that Terraform manages differently from the cloud default (tags, lifecycle policies, etc.). Work through each diff systematically -- update the configuration to match existing state where appropriate, or let Terraform bring the resource into the desired state.
- Import one resource type at a time. Do not attempt to import an entire VPC and all its children in one apply. Work from the outside in: VPC first, then subnets, then route tables, then security groups.

### Multi-Region Infrastructure

Deploying identical infrastructure in multiple AWS regions from a single Terraform configuration:

- Use provider aliases to configure multiple regional providers in a single root module: `provider "aws" { alias = "us_west_2"; region = "us-west-2" }`. Pass the provider to module calls with `providers = { aws = aws.us_west_2 }`.
- For completely independent regional deployments (active-active), prefer separate root modules per region with separate state files. This limits blast radius and allows per-region apply cadences. Accept the duplication.
- Never use `for_each` on provider configurations. Provider meta-argument `for_each` is not supported. If you need 6 regional deployments, you need either 6 explicit provider aliases or 6 separate root modules.
- Global resources (IAM roles, Route53 hosted zones, CloudFront distributions) must be in a dedicated `global/` root module with a single state file. Reference global resource ARNs via remote state outputs in regional modules.

### Monolithic Module Refactoring

When a large team has accumulated a 10,000-line `main.tf` monolith that needs to be split into modules without destroying live infrastructure:

- Refactoring Terraform modules is a state migration operation, not just a code refactoring. Moving a resource from one module path to another changes its state address -- Terraform will destroy the old address and create a new one unless you perform a `terraform state mv`.
- Plan the target module structure before touching any code. Map every current resource address to its target address. Document the full list of `terraform state mv` commands before executing any of them.
- Run `terraform state mv` commands against a local copy of the state (pulled with `terraform state pull > local.tfstate`) and dry-run the resulting state with `terraform plan -state=local.tfstate` before pushing back.
- Refactor in stages: extract one module at a time, validate with plan showing zero changes, apply the state migration, then move to the next module. Never attempt to migrate all resources in one operation.
- Use `moved` blocks (Terraform 1.1+) instead of CLI `state mv` where possible. `moved` blocks are code-reviewable, version-controlled, and automatically applied during `terraform apply` without a separate CLI operation.

### Ephemeral Preview Environments

Creating per-PR temporary environments that are automatically destroyed when the PR closes:

- Use Terraform workspaces for this use case (the one legitimate workspace use case). Each PR creates a workspace named after the PR number: `terraform workspace new pr-1234`. CI applies the full stack to this workspace and posts the output URLs as PR comments.
- Set aggressive `auto_destroy` schedules. Workspaces older than 48 hours without recent commit activity should be automatically destroyed by a cleanup job. Orphaned preview environments are a significant cost leak.
- Limit preview environment scope to stateless compute resources (ECS tasks, Lambda functions, API Gateway stages). Never create RDS instances, Elasticsearch clusters, or other slow/expensive stateful resources in preview environments -- use shared dev databases with namespace isolation instead.
- Use `terraform output -json` to extract dynamic URLs (ALB DNS names, CloudFront domains) and post them to the PR via GitHub API. This makes preview environments discoverable without checking CI logs.
- Implement resource naming that includes the workspace name to prevent collision: `"${var.service_name}-${terraform.workspace}-api"`. Without workspace in the name, resources from different PRs will collide in the same AWS account.

### Secrets Rotation Without Downtime

When a database password or API key managed by Terraform needs rotation without application downtime:

- Terraform-managed secrets can create a chicken-and-egg problem: updating the secret in Secrets Manager updates the Terraform state, but if the application reads the secret at startup only, it will not pick up the rotation without a restart.
- For RDS passwords, use AWS Secrets Manager rotation with a Lambda rotator. The Lambda performs a two-phase rotation (set pending, update DB user, set current) that keeps one valid version active throughout. Terraform manages the rotation schedule configuration (`rotation_rules`) but the rotation itself is handled out-of-band.
- Never update a secret resource in Terraform by changing the `secret_string` value directly if the application is using the ARN reference. The update will succeed in state but the application connection pool will fail until restart. Coordinate the Terraform apply with a rolling application restart in the same deployment pipeline.
- For TLS certificates, use `create_before_destroy = true` on `aws_acm_certificate` and let the ACM validation complete before the load balancer listener is updated. The lifecycle block ensures the new certificate is valid before the old one is removed from the listener.

### Terragrunt for DRY Multi-Environment Configuration

When pure Terraform root module duplication across environments becomes unmanageable (identical configurations with only account ID, region, and tier-specific sizing as differences):

- Terragrunt wraps Terraform and adds a `terragrunt.hcl` configuration layer that generates backend configurations dynamically, passes common inputs from parent `terragrunt.hcl` files, and orchestrates multi-module deploys with dependency ordering.
- Use Terragrunt when: you have 5+ environments, backend configuration is identical except for path/account/region, and you find yourself copy-pasting the same provider and backend blocks across directories.
- Do NOT use Terragrunt when: your team is not already proficient with Terraform, you only have 2-3 environments, or your organization uses Terraform Cloud (which already handles these concerns). Terragrunt adds a layer of abstraction that requires understanding both tools.
- The canonical Terragrunt directory structure uses a three-level hierarchy: `root.hcl` (org-wide defaults), `account.hcl` (account/subscription-level config), `region.hcl` (region-level config), and per-module `terragrunt.hcl` files that inherit all parent config. The `read_terragrunt_config()` function merges these layers.

### Compliance and Audit Requirements (SOC 2, HIPAA, PCI-DSS)

When IaC operates in regulated environments with audit obligations:

- Every `terraform apply` must be traceable to: who triggered it, which version of code was applied, what the plan showed, and what the outcome was. Terraform Cloud and Atlantis both provide audit logs. For self-managed pipelines, archive the plan output and apply log to an immutable S3 bucket with Object Lock.
- PCI-DSS requires that changes to production infrastructure go through a formal change management process with pre-approval. Implement a required manual approval step in the CD pipeline that triggers a notification to a compliance Slack channel and requires approval from a named approver.
- SOC 2 Type II requires evidence of access controls on infrastructure management. Use OIDC for CI pipelines (eliminates standing credentials), separate IAM roles per environment (apply role has write access to prod; plan role is read-only), and enforce MFA on all human IAM users who can assume apply roles.
- HIPAA-covered IaC must ensure that PHI is never written to Terraform state. This means never using data sources that return PHI, never storing PHI in resource tags, and encrypting state at rest with a CMK under the covered entity's control. Document encryption key management in your risk assessment.

---

## Example

**Input:** "We have a team of 8 engineers and are moving to AWS. We have an existing ECS-based application running manually provisioned infrastructure (VPCs, ECS clusters, RDS, ALBs all ClickOps'd). We need to bring it under Terraform management with dev/staging/prod environments. We use GitHub Actions for CI."

**Output:**

### Situation Assessment

| Factor | Observed Value | Implication |
|---|---|---|
| Tool | Terraform (recommended for AWS multi-account) | HCL, S3 backend, DynamoDB locking |
| Environment count | 3 (dev / staging / prod) | Three separate root modules, three state backends |
| Team size | 8 engineers | Atlantis or TF Cloud for PR-based plan review |
| Cloud | AWS | AWS provider ~> 5.x, OIDC for GitHub Actions |
| Existing infra | Full migration (VPC, ECS, RDS, ALB) | Import-first strategy, no recreation |
| CI | GitHub Actions | OIDC trust policy, saved plan artifacts |
| Compliance | Unspecified -- implement SOC 2 baseline | Audit logs, CMK encryption, access controls |

---

### Recommended Directory Structure

```
infra/
├── modules/
│   ├── networking/
│   │   ├── main.tf          # VPC, subnets (public/private/data), IGW, NAT GW
│   │   ├── variables.tf
│   │   ├── outputs.tf       # vpc_id, subnet_ids, nat_gateway_ids
│   │   └── README.md
│   ├── ecs-service/
│   │   ├── main.tf          # ECS task definition, service, CloudWatch logs, IAM
│   │   ├── variables.tf
│   │   ├── outputs.tf       # service_name, task_definition_arn, cloudwatch_group
│   │   └── README.md
│   ├── rds-postgres/
│   │   ├── main.tf          # DB instance, subnet group, parameter group, secret
│   │   ├── variables.tf
│   │   └── outputs.tf       # db_endpoint, secret_arn
│   └── alb/
│       ├── main.tf          # ALB, target groups, listeners, ACM cert
│       ├── variables.tf
│       └── outputs.tf       # alb_dns_name, target_group_arns
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── versions.tf
│   │   ├── backend.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   │   └── (same structure)
│   └── prod/
│       └── (same structure)
├── .github/
│   └── workflows/
│       └── terraform.yml
├── policies/
│   └── checkov-baseline.yaml   # Checkov suppress list with documented reasons
└── docs/
    └── adr/
        ├── 001-state-backend.md
        ├── 002-module-versioning.md
        └── 003-import-strategy.md
```

---

### Phase 1: State Backend Bootstrap

Create this once manually (bootstrapping is the one acceptable ClickOps action):

```hcl
# bootstrap/main.tf -- apply once, then never touch again
# This creates the S3 bucket and DynamoDB table that all other state uses

resource "aws_s3_bucket" "tfstate" {
  bucket = "company-tfstate-us-east-1"

  # Prevent accidental deletion of state bucket -- this is catastrophic
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.tfstate.arn
    }
    # Enforce KMS -- deny requests using S3-managed keys
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_kms_key" "tfstate" {
  description             = "KMS key for Terraform state encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true  # Auto-rotate annually

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Allow account root"
        Effect = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow GitHub Actions OIDC role"
        Effect = "Allow"
        Principal = { AWS = aws_iam_role.github_actions.arn }
        Action = ["kms:GenerateDataKey", "kms:Decrypt"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_dynamodb_table" "tfstate_lock" {
  name         = "terraform-state-locks"
  billing_mode = "PAY_PER_REQUEST"  # No capacity planning required
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}
```

---

### Production Root Module (environments/prod/main.tf)

```hcl
# environments/prod/main.tf
# Production environment -- all changes require PR approval and CI apply gate
# Last reviewed: see git log

locals {
  environment = "prod"
  region      = "us-east-1"

  # Mandatory tags applied to all resources via provider default_tags
  # Add resource-specific tags on individual resources, not here
  common_tags = {
    Environment = local.environment
    ManagedBy   = "terraform"
    TerraformRepo = "github.com/company/infra"
    CostCenter  = "platform-engineering"
    Team        = "platform"
  }
}

module "networking" {
  source = "../../modules/networking"

  environment          = local.environment
  vpc_cidr             = "10.0.0.0/16"

  # Three AZs for production HA -- dev uses 2 to save NAT Gateway cost
  availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]

  # /20 = 4096 IPs per subnet -- sized for 3-year growth
  private_subnet_cidrs = ["10.0.16.0/20", "10.0.32.0/20", "10.0.48.0/20"]
  public_subnet_cidrs  = ["10.0.0.0/24",  "10.0.1.0/24",  "10.0.2.0/24"]
  data_subnet_cidrs    = ["10.0.64.0/24", "10.0.65.0/24", "10.0.66.0/24"]

  # One NAT gateway per AZ -- costs ~$32/month each but required for HA
  # Dev uses single NAT to save ~$64/month
  single_nat_gateway   = false

  tags = local.common_tags
}

module "alb" {
  source = "../../modules/alb"

  environment      = local.environment
  vpc_id           = module.networking.vpc_id
  public_subnet_ids = module.networking.public_subnet_ids
  certificate_arn  = data.aws_acm_certificate.api.arn

  # ALB access logs for compliance and debugging
  access_logs_bucket = aws_s3_bucket.alb_logs.bucket

  deletion_protection = true  # prevent_destroy equivalent for ALB

  tags = local.common_tags
}

module "rds_postgres" {
  source = "../../modules/rds-postgres"

  environment          = local.environment
  identifier           = "prod-payments-pg"
  engine_version       = "15.4"
  instance_class       = "db.r7g.large"  # 2 vCPU, 16 GB -- right-sized for current load
  allocated_storage    = 100             # GB -- monitors via CloudWatch StorageSpace alarm
  max_allocated_storage = 500            # GB -- autoscaling upper bound

  db_subnet_group_ids  = module.networking.data_subnet_ids
  vpc_id               = module.networking.vpc_id

  # Allow inbound from ECS tasks only -- not from public subnets
  allowed_security_group_ids = [module.ecs_service.task_security_group_id]

  # These are fetched from Secrets Manager -- not in tfvars
  # The secret is created by this module; the value is set manually on first deploy
  # Rotation is managed by an AWS Lambda rotator
  manage_master_password = true  # AWS-managed password rotation

  # Production requires multi-AZ for automatic failover
  multi_az              = true
  deletion_protection   = true
  skip_final_snapshot   = false
  final_snapshot_identifier = "prod-payments-pg-final-${formatdate("YYYY-MM-DD", timestamp())}"

  backup_retention_period = 35  # Days -- maximum for RDS automated backups
  backup_window           = "03:00-04:00"  # UTC -- low-traffic window
  maintenance_window      = "sun:04:00-sun:05:00"

  # PostgreSQL parameter group tuning for OLTP workload
  parameters = {
    "max_connections"          = "200"
    "shared_buffers"           = "{DBInstanceClassMemory/32768}MB"
    "effective_cache_size"     = "{DBInstanceClassMemory/16384}MB"
    "log_min_duration_statement" = "1000"  # Log queries > 1 second
    "log_connections"          = "1"
    "log_disconnections"       = "1"
  }

  tags = local.common_tags
}

module "ecs_service" {
  source = "../../modules/ecs-service"

  environment          = local.environment
  service_name         = "payments-api"
  cluster_arn          = aws_ecs_cluster.prod.arn
  container_image      = var.container_image  # Injected by application CD pipeline
  container_port       = 8080
  cpu                  = 1024  # 1 vCPU
  memory               = 2048  # 2 GB

  # Fetch DB secret ARN from RDS module -- not hardcoded
  secrets = {
    DATABASE_URL = module.rds_postgres.connection_secret_arn
  }

  private_subnet_ids   = module.networking.private_subnet_ids
  vpc_id               = module.networking.vpc_id
  target_group_arn     = module.alb.api_target_group_arn

  desired_count        = 3   # Minimum for AZ redundancy
  max_capacity         = 20  # Auto Scaling upper bound

  # Health check -- must pass before ALB routes traffic
  health_check_path    = "/health"
  health_check_grace_period_seconds = 60

  tags = local.common_tags
}

# Look up existing ACM cert -- managed separately (auto-renewed by ACM)
data "aws_acm_certificate" "api" {
  domain      = "api.company.com"
  statuses    = ["ISSUED"]
  most_recent = true
}
```

---

### Backend Configuration (environments/prod/backend.tf)

```hcl
terraform {
  backend "s3" {
    bucket         = "company-tfstate-us-east-1"
    key            = "prod/main/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-locks"
    encrypt        = true
    kms_key_id     = "arn:aws:kms:us-east-1:123456789012:key/mrk-0123456789abcdef0"
    # Role assumed during CI apply -- read-only plan role is different
    role_arn       = "arn:aws:iam::123456789012:role/terraform-prod-apply"
  }
}
```

---

### GitHub Actions CI Pipeline (.github/workflows/terraform.yml)

```yaml
name: Terraform

on:
  pull_request:
    paths: ["infra/**"]
  push:
    branches: [main]
    paths: ["infra/**"]

permissions:
  id-token: write   # Required for OIDC token generation
  contents: read
  pull-requests: write  # Required for PR comment with plan output

env:
  TF_VERSION: "1.7.2"
  AWS_REGION: "us-east-1"

jobs:
  validate:
    name: Validate and Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Terraform Format Check
        run: terraform fmt -check -recursive infra/
        # Fails if any .tf file is not in canonical format

      - name: Terraform Validate (all environments)
        run: |
          for env in dev staging prod; do
            echo "Validating $env..."
            cd infra/environments/$env
            terraform init -backend=false  # Skip backend for validation
            terraform validate
            cd ../../..
          done

      - name: Checkov Static Analysis
        uses: bridgecrewio/checkov-action@v12
        with:
          directory: infra/
          config_file: infra/policies/checkov-baseline.yaml
          soft_fail: false  # Hard fail on critical findings
          output_format: sarif
          output_file_path: checkov-results.sarif

      - name: Upload Checkov results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: checkov-results.sarif

  plan-dev:
    name: Plan Dev
    runs-on: ubuntu-latest
    needs: validate
    environment: dev-plan  # GitHub environment with OIDC trust
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::111111111111:role/terraform-dev-plan
          aws-region: ${{ env.AWS_REGION }}
          # OIDC -- no static AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY stored

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Terraform Init
        working-directory: infra/environments/dev
        run: terraform init

      - name: Terraform Plan
        id: plan
        working-directory: infra/environments/dev
        run: |
          terraform plan \
            -input=false \
            -out=tfplan.binary \
            -var="container_image=${{ github.sha }}"
          # Save human-readable plan for PR comment
          terraform show -no-color tfplan.binary > plan.txt

      - name: Upload Plan Artifact
        uses: actions/upload-artifact@v4
        with:
          name: dev-tfplan
          path: infra/environments/dev/tfplan.binary
          retention-days: 7

      - name: Comment Plan on PR
        uses: actions/github-script@v7
        if: github.event_name == 'pull_request'
        with:
          script: |
            const fs = require('fs')
            const plan = fs.readFileSync('infra/environments/dev/plan.txt', 'utf8')
            const maxLen = 65000  // GitHub comment limit
            const truncated = plan.length > maxLen
              ? plan.substring(0, maxLen) + '\n... (truncated)'
              : plan
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Terraform Plan -- Dev\n\`\`\`\n${truncated}\n\`\`\``
            })

  apply-dev:
    name: Apply Dev
    runs-on: ubuntu-latest
    needs: plan-dev
    if: github.ref == 'refs/heads/main'  # Only apply on merge to main
    environment: dev-apply  # GitHub environment for audit trail
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::111111111111:role/terraform-dev-apply
          aws-region: ${{ env.AWS_REGION }}

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Download Plan Artifact
        uses: actions/download-artifact@v4
        with:
          name: dev-tfplan
          path: infra/environments/dev/

      - name: Terraform Init
        working-directory: infra/environments/dev
        run: terraform init

      - name: Terraform Apply (using saved plan -- no surprises)
        working-directory: infra/environments/dev
        run: terraform apply -input=false tfplan.binary

  # Staging and prod follow the same pattern
  # Prod apply requires a GitHub environment with required_reviewers configured
  apply-prod:
    name: Apply Prod
    runs-on: ubuntu-latest
    needs: [plan-prod, apply-staging]  # Prod only after staging succeeds
    if: github.ref == 'refs/heads/main'
    environment: prod-apply  # Configured in GitHub with 2 required reviewers
    steps:
      # ... identical pattern to apply-dev with prod role ARN
```

---

### Import Strategy for Existing Resources

```hcl
# environments/prod/imports.tf
# One-time file: contains import blocks for existing ClickOps infrastructure
# After all imports succeed with zero-diff plan, delete this file

import
