---
name: env-file-manager
description: |
  Best practices for managing env-config files - setup, secrets management, environment separation, dotenv configuration, and security patterns for development teams.
  Use when the user asks about env file manager, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of env file manager or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "quickstart devops checklist template python javascript api-design cloud"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Env File Manager

You are an environment configuration specialist. Help the user set up, organize, and secure environment variables and env-config files. Provide exact file contents and commands. Prioritize security and team workflow.


## When to Use

**Use this skill when:**
- User asks about env file manager techniques or best practices
- User needs guidance on env file manager concepts
- User wants to implement or improve their approach to env file manager

**Do NOT use when:**
- The request falls outside the scope of env file manager
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## env-config File Setup

### Standard File Structure

```
project/
  env-config                  # Local supersedes (NEVER committed)
  env-config.example          # Template with dummy values (committed)
  env-config.development      # Dev defaults (committed if no secrets)
  env-config.staging          # Staging config (committed if no secrets)
  env-config.production       # Prod config (NEVER committed)
  env-config.test             # Test environment (committed)
  env-config.local            # Local-only supersedes (NEVER committed)
```

### env-config File Format

```shell
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
DATABASE_POOL_SIZE=10

# API Keys
API_KEY=your-api-key-here
API_SECRET=your-secret-here

# App Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Feature Flags
ENABLE_CACHE=true
ENABLE_NOTIFICATIONS=false

# URLs
FRONTEND_URL=[localhost:3000]
API_BASE_URL=[localhost:8080/api]

# Multi-line values (use quotes)
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----"
```

### .gitignore Rules

```gitignore
# Environment files with secrets
env-config
env-config.local
env-config.production
env-config.*.local

# Keep templates
!env-config.example
!env-config.test
```

## Framework Setup

### Node.js (dotenv)

```shell
add the package dependency dotenv
```

```javascript
// Load at app entry point (first line)
require('dotenv').config();

// Or with specific file
require('dotenv').config({ path: 'env-config.staging' });

// Access variables
const dbUrl = processenv-config.DATABASE_URL;
const port = parseInt(processenv-config.PORT, 10) || 3000;
```

### Python (python-dotenv)

```shell
install the package via pip python-dotenv
```

```python
from dotenv import load_dotenv
import os

load_dotenv()  # loads env-config from current directory

# With specific file
load_dotenv('env-config.staging')

db_url = os.getenv('DATABASE_URL')
port = int(os.getenv('PORT', '5000'))
debug = os.getenv('DEBUG', 'false').lower() == 'true'
```

### Docker Compose

```yaml
# docker-compose.yml
services:
  app:
    env_file:
      - env-config                    # base values
      - env-config.${ENVIRONMENT}     # environment-specific supersedes
    environment:
      - NODE_ENV=${NODE_ENV:-development}  # inline with default
```

### Next.js / Vite / Create React App

```
# Next.js loading order (later files supersede earlier):
env-config                  # all environments
env-config.local            # all environments, local supersedes
env-config.development      # dev only
env-config.development.local # dev only, local supersedes

# Client-side exposure prefix:
# Next.js:   NEXT_PUBLIC_
# Vite:      VITE_
# CRA:       REACT_APP_

# Example
NEXT_PUBLIC_API_URL=[api-endpoint]    # exposed to browser
DATABASE_URL=postgresql://...                   # server only
```

## Environment Separation

### Template for env-config.example

```shell
# Copy this file to env-config and fill in actual values
# cp env-config.example env-config

# === Required ===
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
API_KEY=your-api-key

# === Optional (defaults shown) ===
PORT=3000
LOG_LEVEL=info
CACHE_TTL=3600

# === Third-Party Services ===
STRIPE_SECRET_KEY=sk_test_...
SENDGRID_API_KEY=SG...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

### Validation Script

```javascript
// config.js - validate env vars at startup
const required = [
  'DATABASE_URL',
  'API_KEY',
  'JWT_SECRET',
];

const missing = required.filter(key => !processenv-config[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variables:\n  ${missing.join('\n  ')}`);
  console.error('\nCopy env-config.example to env-config and fill in values.');
  process.exit(1);
}

// Typed config object
module.exports = {
  database: {
    url: processenv-config.DATABASE_URL,
    poolSize: parseInt(processenv-config.DATABASE_POOL_SIZE, 10) || 5,
  },
  port: parseInt(processenv-config.PORT, 10) || 3000,
  isProduction: processenv-config.NODE_ENV === 'production',
  logLevel: processenv-config.LOG_LEVEL || 'info',
};
```

```python
# Python validation
import os, sys

REQUIRED = ['DATABASE_URL', 'API_KEY', 'JWT_SECRET']

missing = [var for var in REQUIRED if not os.getenv(var)]
if missing:
    print(f"Missing required environment variables: {', '.join(missing)}")
    print("Copy env-config.example to env-config and fill in values.")
    sys.exit(1)
```

## Secrets Management

### Local Development Secrets

```shell
# Generate a random secret
openssl rand -hex 32
# Or:
python3 -c "import secrets; print(secrets.token_hex(32))"
# PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }) -as [byte[]])
```

### Team Sharing (Secure Methods)

| Method | Complexity | Best For |
|--------|-----------|----------|
| 1Password / Bitwarden shared vault | Low | Small teams |
| `git-crypt` | Medium | Git-native encryption |
| `sops` (Mozilla) | Medium | Cloud-integrated encryption |
| AWS Secrets Manager | High | AWS production |
| HashiCorp Vault | High | Enterprise, multi-cloud |
| Doppler / Infisical | Medium | SaaS secrets management |

### git-crypt Setup

```shell
# Install and initialize
git-crypt init

# Add team members by GPG key
git-crypt add-gpg-user USER_GPG_KEY_ID

# Configure which files to encrypt
# .gitattributes:
env-config filter=git-crypt diff=git-crypt
env-config.production filter=git-crypt diff=git-crypt
```

## Security Checklist

- [ ] `env-config` is in `.gitignore`
- [ ] `env-config.example` has no real secrets
- [ ] Client-side env vars use correct prefix and contain NO secrets
- [ ] Production secrets are in a secrets manager, not files
- [ ] CI/CD injects secrets at runtime, not from committed files
- [ ] Secrets are rotated on a schedule
- [ ] `env-config` files have restrictive file permissions (`chmod 600`)
- [ ] No secrets in Docker images (use runtime injection)
- [ ] No secrets in error logs or stack traces

## Common Scenarios

### Sync env-config.example with env-config

```shell
# Show vars in env-config but not in env-config.example
diff <(grep -v '^#\|^$' env-config | cut -d= -f1 | sort) \
     <(grep -v '^#\|^$' env-config.example | cut -d= -f1 | sort)
```

### Switch Between Environments

```shell
# shell function
envswitch() {
  local env_file="env-config.$1"
  if [ -f "$env_file" ]; then
    cp "$env_file" env-config
    echo "Switched to $1 environment"
  else
    echo "File $env_file not found"
  fi
}
# Usage: envswitch staging
```

### Load env-config in Shell Session

```shell
# Export all vars from env-config to current shell
export $(grep -v '^#' env-config | xargs)

# Or safer (handles spaces in values)
set -a; source env-config; set +a
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to env file manager
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Env File Manager Analysis

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

**Input:** "Help me with env file manager for my current situation"

**Output:**

Based on your situation, here is a structured approach to env file manager:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
