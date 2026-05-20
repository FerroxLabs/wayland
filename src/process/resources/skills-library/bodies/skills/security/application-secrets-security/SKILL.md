---
name: application-secrets-security
description: |
  Secrets management expertise covering HashiCorp Vault and AWS Secrets Manager patterns, secret rotation strategies, environment variable management, config file handling, git secret scanning, CI/CD secret injection, zero-trust secret access, and audit logging for keeping sensitive credentials secure throughout the software lifecycle.
  Use when the user asks about application secrets security, application secrets security best practices, or needs guidance on application secrets security implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security guide best-practices"
  category: "security"
  subcategory: "application-security"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Application Secrets Security

## Overview

Secrets management is the practice of securely storing, accessing, rotating, and auditing sensitive credentials such as API keys, database passwords, encryption keys, and certificates. A single leaked secret can compromise an entire system. This skill covers the tools, patterns, and policies needed to manage secrets safely at scale.

## Secret Types and Risk Levels

| Secret Type | Risk Level | Rotation Frequency | Storage |
|------------|------------|-------------------|---------|
| Database credentials | Critical | 30-90 days | Vault/Secrets Manager |
| API keys (production) | Critical | 90 days | Vault/Secrets Manager |
| Encryption keys | Critical | Annually (with re-encryption) | HSM/KMS |
| TLS certificates | High | Before expiry (auto-renew) | Certificate manager |
| SSH keys | High | 90-180 days | Key management system |
| OAuth client secrets | High | 90 days | Vault/Secrets Manager |
| Service account tokens | High | 30-90 days | Vault/Secrets Manager |
| API keys (development) | Medium | On compromise | .config (local only) |
| Webhook secrets | Medium | 90 days | Vault/Secrets Manager |

## HashiCorp Vault

### Architecture

```
Applications -> Vault API (authenticated) -> Secret Engines
                                          -> Auth Methods
                                          -> Audit Devices
                                          -> Policies

Secret Engines:
  KV v2 (key-value with versioning)
  Database (dynamic credentials)
  PKI (certificate authority)
  Transit (encryption as a service)
  AWS/Azure/GCP (dynamic cloud credentials)
```

### KV Secrets Engine

```shell
# Enable KV v2 secrets engine
vault secrets enable -path=secret kv-v2

# Write a secret
vault kv put secret/myapp/database \
    username=app_user \
    password=s3cur3P@ssw0rd \
    host=db.internal.example.com \
    port=5432

# Read a secret
vault kv get secret/myapp/database
vault kv get -field=password secret/myapp/database

# ... (condensed) ...
# Delete (soft delete - can be undeleted)
vault kv delete secret/myapp/database

# Destroy (permanent, cannot be recovered)
vault kv destroy -versions=1,2 secret/myapp/database
```

### Dynamic Database Credentials

```shell
# Configure database secret engine
vault secrets enable database

# Configure PostgreSQL connection
vault write database/config/mydb \
    plugin_name=postgresql-database-plugin \
    allowed_roles="readonly,readwrite" \
    connection_url="postgresql://{{username}}:{{password}}@db.example.com:5432/mydb" \
    username="vault_admin" \
    password="YOUR_SECURE_PASSWORD_HERE"  # CHANGE THIS PASSWORD BEFORE USE

# Create role for read-only access
vault write database/roles/readonly \
    db_name=mydb \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="24h"

# Get dynamic credentials (new unique credentials each time)
vault read database/creds/readonly
# Returns: username=v-token-readonly-abc123, password=xyz789
# Credentials auto-expire after TTL
```

### Application Integration

```python
import hvac
import os

class VaultClient:
    """HashiCorp Vault client for application secret retrieval."""

    def __init__(self):
        self.client = hvac.Client(
            url=environment-variables['VAULT_ADDR'],
            token=environment-variables.get('VAULT_TOKEN'),
        )

        # Or use AppRole authentication (preferred for applications)
        if not self.client.is_authenticated():
            # ... (condensed) ...
        """Renew a secret's lease before it expires."""
        self.client.sys.renew_lease(
            lease_id=lease_id,
            increment=increment,
        )
```

### Vault Policies

## AWS Secrets Manager

```python
import boto3
import json
from botocore.exceptions import ClientError

class AWSSecretsClient:
    """AWS Secrets Manager client with caching."""

    def __init__(self, region='us-east-1'):
        self.client = boto3.client('secretsmanager', region_name=region)
        self._cache = {}

    def get_secret(self, secret_name: str) -> dict:
        """Get secret value, with in-memory caching."""
        if secret_name in self._cache:
            # ... (condensed) ...
        self.client.rotate_secret(
            SecretId=secret_name,
            RotationLambdaARN=rotation_lambda_arn,
            RotationRules={'AutomaticallyAfterDays': rotation_days},
        )
```

### AWS Secret Rotation Lambda

```python
import boto3
import json
import secrets
import string

def lambda_handler(event, context):
    """AWS Secrets Manager rotation Lambda for RDS PostgreSQL."""
    secret_arn = event['SecretId']
    step = event['Step']
    token = event['ClientRequestToken']

    sm_client = boto3.client('secretsmanager')

    if step == 'createSecret':
        # ... (condensed) ...
            SecretId=secret_arn,
            VersionStage='AWSCURRENT',
            MoveToVersionId=token,
            RemoveFromVersionId=get_current_version(sm_client, secret_arn),
        )
```

## Environment Variable Management

### The .config File Pattern

```shell
# config file format
# NEVER commit this file to version control

# Database
DATABASE_URL=postgresql://user:YOUR_PASSWORD_HERE@localhost:5432/mydb
DATABASE_POOL_SIZE=10

# API Keys
STRIPE_SECRET_KEY=sk_test_EXAMPLE_KEY_REPLACE_ME
SENDGRID_API_KEY=SG.xxxxxxxxxxxx

# Application
SECRET_KEY=your-256-bit-secret-key-here
JWT_SECRET=another-secret-key

# Feature flags
ENABLE_NEW_CHECKOUT=true
```

```python
# Loading config files safely
from dotenv import load_dotenv
import os

# Load from config file (development only)
load_dotenv()  # Reads .config from current directory

# Access with defaults and type conversion
DATABASE_URL = environment-variables['DATABASE_URL']  # Required, raises if missing
DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'  # Optional with default
POOL_SIZE = int(os.getenv('DATABASE_POOL_SIZE', '5'))  # With type conversion

# Validation
class Config:
    # ... (condensed) ...
    def _validate(self):
        if self.debug and self.stripe_key.startswith('sk_live_'):  # Validates key prefix format
            raise EnvironmentError(
                "Cannot use live Stripe key in debug mode"
            )
```

### .gitignore for Secrets

```gitignore
# Environment files
.config
.config.local
.config.production
.config.staging
.config.*.local

# Key files
*.pem
*.key
*.p12
*.pfx
*.jks

# Credential files
credentials.json
service-account.json
*-credentials.json

# IDE configurations that may contain secrets
.idea/
.vscode/settings.json
```

## Git Secret Scanning

### Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: [reference URL]
    rev: v8.18.0
    hooks:
      - id: gitleaks

  - repo: [reference URL]
    rev: v4.5.0
    hooks:
      - id: detect-private-key
      - id: detect-aws-credentials
```

### Gitleaks Configuration

```toml
# .gitleaks.toml
[extend]
useDefault = true

[[rules]]
id = "custom-api-key"
description = "Custom API key pattern"
regex = '''(?i)(api[_-]?key|apikey)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?'''
secretGroup = 2

[[rules]]
id = "internal-url"
description = "Internal URL with credentials"
regex = '''https?://[^:]+:[^@]+@internal\.'''
# ... (condensed) ...
    '''SKILL\.md$''',
]

[[rules.allowlist]]
commits = ["abc123"]  # Known false positives
```

### Emergency: Secret Leaked to Git

```shell
# Step 1: IMMEDIATELY rotate the leaked secret
# This is the most important step. Do this FIRST.

# Step 2: Remove from git history (if not pushed)
git reset --soft HEAD~1  # Undo last commit, keep changes

# Step 3: If pushed, use BFG Repo Cleaner or git-filter-repo
# Install BFG: [reference URL]
bfg --replace-text passwords.txt repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Step 4: Force push (coordinate with team!)
git push --force-with-lease

# Step 5: Notify security team
# Step 6: Audit access logs for any usage of the compromised secret
# Step 7: Update pre-commit hooks to prevent recurrence
```

## CI/CD Secret Injection

### GitHub Actions

```yaml
# GitHub Actions secrets
name: Deploy
on: push
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy with secrets
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          API_KEY: ${{ secrets.API_KEY }}
        run: |
          # ... (condensed) ...
      - name: Build Docker image
        run: |
          echo "${{ secrets.NPM_TOKEN }}" > .npmrc_secret
          docker build --secret id=npmrc,src=.npmrc_secret -t myapp .
          rm .npmrc_secret
```

### Docker Secret Handling

```dockerfile
# WRONG: Secret in environment variable (visible in image layers)
ENV DATABASE_PASSWORD=s3cur3P@ss

# WRONG: Secret in build arg (visible in image history)
ARG DATABASE_PASSWORD
RUN echo $DATABASE_PASSWORD > output_file

# CORRECT: Multi-stage build, secret only in build stage
# syntax=docker/dockerfile:1
FROM node:20 AS build
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    install via npm: FROM node:20-slim
COPY --from=build /app/node_modules ./node_modules
# Secret is NOT in the final image

# CORRECT: Runtime secrets via Docker Swarm or K8s
# docker service create --secret db_password myapp
# Secret available at /run/secrets/db_password
```

### Kubernetes Secrets

```yaml
# Create secret
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secrets
type: Opaque
data:
  database-url: cG9zdGdyZXNxbDovL3VzZXI6cGFzc0Bob3N0OjU0MzIvZGI=  # base64("postgresql://user:pass@host:5432/db") -- CHANGE BEFORE USE
  api-key: c2tfbGl2ZV94eHh4  # base64("sk_live_xxxx") -- CHANGE BEFORE USE

---
# Mount as environment variables
apiVersion: apps/v1
kind: Deployment
# ... (condensed) ...
  data:
    - secretKey: database-url
      remoteRef:
        key: secret/myapp/database
        property: url
```

## Zero-Trust Secret Access

### Principles

1. **No long-lived credentials**: Use dynamic/short-lived credentials
2. **Least privilege**: Grant minimum access needed for each service
3. **Identity-based access**: Authenticate workloads, not just networks
4. **Audit everything**: Log every secret access with identity context
5. **Rotate frequently**: Automate rotation on a short schedule
6. **Encrypt in transit and at rest**: Use TLS and encrypted storage

### Implementation Pattern

```python
class ZeroTrustSecretAccess:
    """Zero-trust pattern for secret access."""

    def __init__(self, vault_client, identity_provider):
        self.vault = vault_client
        self.identity = identity_provider

    def get_secret(self, secret_path, reason):
        """Access secret with identity verification and audit logging."""
        # 1. Verify workload identity
        identity = self.identity.get_current_identity()
        if not identity:
            raise AuthenticationError("Cannot determine workload identity")

        # ... (condensed) ...
        return {
            'value': secret,
            'expires_at': datetime.utcnow() + timedelta(hours=1),
            'lease_id': secret.get('lease_id'),
        }
```

## Audit Logging

```python
class SecretAuditLogger:
    """Log all secret access events for compliance and forensics."""

    def log_access(self, event_type, secret_path, identity, result):
        audit_event = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': event_type,  # read, write, rotate, revoke
            'secret_path': secret_path,
            'identity': {
                'service': identity.service_name,
                'instance': identity.instance_id,
                'role': identity.role,
            },
            'result': result,  # success, denied, error
            # ... (condensed) ...
    # Audit queries for security investigations:
    # - Who accessed this secret in the last 30 days?
    # - What secrets did this service account access?
    # - Were there any denied access attempts?
    # - When was this secret last rotated?
```

## Secret Scanning Tools Comparison

| Tool | Type | Languages | CI/CD Integration | Cost |
|------|------|-----------|-------------------|------|
| Gitleaks | Pre-commit + CI | All | GitHub Actions, GitLab CI | Free |
| TruffleHog | Git history scan | All | GitHub Actions | Free (OSS) |
| GitGuardian | SaaS | All | GitHub, GitLab, Bitbucket | Free tier |
| GitHub Secret Scanning | Native | All | GitHub native | Free (public repos) |
| AWS Secrets Detection | SaaS | All | CodePipeline | Included with CodeGuru |

## Decision Framework

1. **Local development**: config files (gitignored) + pre-commit scanning
2. **CI/CD**: Platform-native secrets (GitHub Secrets, GitLab CI Variables)
3. **Production (simple)**: AWS Secrets Manager / GCP Secret Manager / Azure Key Vault
4. **Production (complex)**: HashiCorp Vault with dynamic credentials
5. **Multi-cloud**: HashiCorp Vault (cloud-agnostic)
6. **Compliance-critical**: HSM-backed key management (AWS CloudHSM, Azure Dedicated HSM)

## When to Use

**Use this skill when:**
- Designing or implementing application secrets security solutions
- Reviewing or improving existing application secrets security approaches
- Making architectural or implementation decisions about application secrets security
- Learning application secrets security patterns and best practices
- Troubleshooting application secrets security-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Application Secrets Security Analysis

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

**Input:** "Help me implement application secrets security for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended application secrets security approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When application secrets security must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
