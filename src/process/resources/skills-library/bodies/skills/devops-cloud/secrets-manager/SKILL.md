---
name: secrets-manager
description: |
  Secrets management expertise covering HashiCorp Vault, AWS Secrets Manager, rotation strategies, zero-trust secrets architecture, envelope encryption, secret injection patterns, least-privilege access, and secrets lifecycle management.
  Use when the user asks about secrets manager, secrets manager best practices, or needs guidance on secrets manager implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud security"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Secrets Manager

You are an expert in secrets management for production systems. Secrets -- API keys, database credentials, encryption keys, certificates, tokens -- are the keys to your kingdom. If secrets management is an afterthought, you are one leaked `config-file` file or one compromised CI pipeline away from a breach.

## Secrets Management Principles

1. **Never store secrets in code or Git.** Git history is forever.
2. **Secrets must be rotatable without downtime.** If rotation requires a deployment, it will be delayed.
3. **Least privilege.** Every service gets only the secrets it needs.
4. **Audit everything.** Every secret access must be logged.
5. **Encrypt at rest and in transit.** Decrypted only at point of use.

## Solution Comparison

| Feature | HashiCorp Vault | AWS Secrets Manager | Azure Key Vault | GCP Secret Manager |
|---------|----------------|--------------------|-----------------|--------------------|
| **Self-hosted** | Yes | No | No | No |
| **Dynamic secrets** | Yes | No | No | No |
| **Auto-rotation** | Via policies | Built-in (Lambda) | Built-in | Via Cloud Functions |
| **Cost** | Free (OSS) | $0.40/secret/month | $0.03/10K ops | $0.06/10K ops |
| **Complexity** | High | Low | Low | Low |

### When to Choose What

```
Small team, single cloud provider
  -> Use your cloud provider's secrets manager

Multi-cloud or hybrid
  -> HashiCorp Vault

Need dynamic secrets (short-lived, per-request credentials)
  -> HashiCorp Vault

Kubernetes-native
  -> External Secrets Operator + any backend
```

## HashiCorp Vault

### Core Concepts

```
Vault Architecture:
  Auth Methods:   AppRole, Kubernetes, AWS IAM, OIDC
  Secrets Engines: KV (key-value), Database, PKI, Transit, AWS/Azure/GCP
  Policies (ACL):  Which auth role can access which secrets path
  Audit Log:       Every request logged
```

### Basic Usage

```shell
# Enable KV secrets engine
vault secrets enable -path=secret kv-v2

# Store a secret
vault kv put secret/my-app/database \
  url="postgresql://user:pass@db:5432/mydb" \
  password="YOUR_SECURE_PASSWORD_HERE"  # CHANGE THIS

# Create a policy
vault policy write my-app-policy - <<EOF
path "secret/data/my-app/*" {
  capabilities = ["read", "list"]
}
path "database/creds/my-app-role" {
  capabilities = ["read"]
}
EOF

# Enable AppRole auth
vault auth enable approle
vault write auth/approle/role/my-app \
  token_policies="my-app-policy" \
  token_ttl=1h \
  token_max_ttl=4h
```

### Dynamic Database Credentials

```shell
vault secrets enable database

vault write database/config/mydb \
  plugin_name=postgresql-database-plugin \
  connection_url="postgresql://{{username}}:{{password}}@db:5432/mydb" \
  allowed_roles="my-app-role" \
  username="vault-admin" \
  password="YOUR_VAULT_PASSWORD_HERE"  # CHANGE THIS

vault write database/roles/my-app-role \
  db_name=mydb \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' \
    VALID UNTIL '{{expiration}}'; \
    GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"

# Application gets unique, short-lived credentials on demand
vault read database/creds/my-app-role
# Returns: { username: "v-approle-my-app-a1b2c3", password: "random", lease: 3600s }
```

## Envelope Encryption

```
Master Key (KEK) -- stored in KMS/Vault, never leaves secure boundary
    |
    | encrypts/decrypts
    v
Data Key (DEK) -- generated per record, encrypted copy stored with data
    |
    | encrypts/decrypts
    v
Your Actual Data -- encrypted at rest

ENCRYPT:
  1. KMS generates data key -> returns plaintext DEK + encrypted DEK
  2. Encrypt data with plaintext DEK
  3. Store: encrypted data + encrypted DEK
  4. Discard plaintext DEK

DECRYPT:
  1. Send encrypted DEK to KMS for decryption
  2. Decrypt data with returned plaintext DEK
  3. Discard plaintext DEK
```

## Secret Injection Patterns

| Pattern | How | Pros | Cons |
|---------|-----|------|------|
| **Environment variables** | `SECRET=value` in pod spec | Simple, universal | Visible in process list |
| **File mount** | Secret written to volume | More secure than env vars | App must read file |
| **Sidecar** | Vault Agent injects secrets | Dynamic, auto-renewed | More infrastructure |
| **SDK** | App calls Vault API directly | Most control | Code dependency |
| **External Secrets Operator** | CRD syncs to k8s Secret | GitOps-friendly | Extra operator |

### Vault Agent Sidecar (Kubernetes)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-api
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "my-app"
        vault.hashicorp.com/agent-inject-secret-db.txt: "secret/data/my-app/database"
        vault.hashicorp.com/agent-inject-template-db.txt: |
          {{- with secret "secret/data/my-app/database" -}}
          DATABASE_URL={{ .Data.data.url }}
          {{- end }}
    spec:
      serviceAccountName: my-app
      containers:
        - name: my-api
          image: my-api:latest
          # Secret at /vault/secrets/db.txt, auto-renewed
```

## Rotation Strategies

### Dual-Credential Rotation (Static Secrets)

```
Step 1: Generate new credential (B)
Step 2: Update app to accept BOTH old (A) and new (B)
Step 3: Deploy application
Step 4: Update external system to use credential B
Step 5: Remove credential A from config
Step 6: Revoke credential A
```

### Dynamic Credentials (Vault)

No rotation needed. Credentials are generated on demand, short-lived (1h TTL), and auto-expired. New credentials requested before old ones expire.

### AWS Secrets Manager Auto-Rotation

Configure a Lambda function with four steps: createSecret (generate new), setSecret (update the target system), testSecret (verify it works), finishSecret (promote to current).

## Zero-Trust Secrets Architecture

```
LAYER 1: Network    - Secrets manager on private network only, mTLS
LAYER 2: AuthN      - Platform identity (K8s SA, IAM role), no static creds
LAYER 3: AuthZ      - Per-service policies, no wildcard access
LAYER 4: Encryption - Secrets encrypted at rest (KMS-backed)
LAYER 5: Audit      - Every read/write logged, unusual access alerting
LAYER 6: Rotation   - All secrets have max lifetime, automated rotation
```

### Anti-Patterns

| Anti-Pattern | Risk | Fix |
|-------------|------|-----|
| Shared secrets across services | One compromise exposes all | Unique secrets per service |
| Long-lived API keys | Extended blast radius | Short TTLs, auto-rotation |
| Secrets in CI/CD variables | CI compromise = all secrets | OIDC federation, no static secrets in CI |
| `config-file` files in development | Accidentally committed | `.config.example` + secrets manager |
| Secrets in Docker images | Image pull = secret access | Inject at runtime only |
| Hardcoded in source code | Git history forever | Pre-commit hooks to detect |

## Secret Scanning

### Pre-Commit Detection

```yaml
# .pre-commit-config.yaml
repos:
  - repo: [reference URL]
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

```shell
# Scan existing repo history
gitleaks detect --source . --verbose

# CI integration: scan only new commits
gitleaks protect --staged --verbose
```

### Patterns to Detect

```
AWS Access Key:    AKIA[0-9A-Z]{16}
GitHub Token:      gh[ps]_[a-zA-Z0-9]{36}
Private Key:       -----BEGIN (RSA )?PRIVATE KEY-----
Connection string: (postgres|mysql|mongodb)://[^:]+:[^@]+@
```

## Emergency Response

### Secret Compromise Runbook

```
IMMEDIATE (0-15 min):
  1. Rotate the compromised secret
  2. Revoke all sessions/tokens issued with old secret
  3. Check: is the secret used elsewhere? Rotate those too
  4. Enable enhanced audit logging

INVESTIGATION (15 min - 4 hours):
  5. How was the secret exposed?
  6. Check audit logs for unauthorized access
  7. Assess blast radius
  8. If customer data at risk: involve legal/compliance

REMEDIATION (4-48 hours):
  9. Fix root cause
  10. If in Git: use git-filter-repo to remove
  11. Scan all repos for similar exposures
  12. Update pre-commit hooks
  13. Post-mortem within 48 hours
```

## Secrets Management Checklist

- [ ] No secrets in source code, Git history, or Docker images
- [ ] Centralized secrets manager deployed
- [ ] Per-service access policies (least privilege)
- [ ] Secrets encrypted at rest and in transit
- [ ] Automated rotation for all secrets
- [ ] Rotation tested and verified
- [ ] Secret scanning in CI pipeline
- [ ] Pre-commit hooks prevent secret commits
- [ ] Audit logging for all secret access
- [ ] Emergency rotation runbook documented and tested
- [ ] Developer onboarding includes secrets management training

## When to Use

**Use this skill when:**
- Designing or implementing secrets manager solutions
- Reviewing or improving existing secrets manager approaches
- Making architectural or implementation decisions about secrets manager
- Learning secrets manager patterns and best practices
- Troubleshooting secrets manager-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Secrets Manager Analysis

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

**Input:** "Help me implement secrets manager for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended secrets manager approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When secrets manager must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
