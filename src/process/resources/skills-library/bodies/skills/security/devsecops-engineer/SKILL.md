---
name: devsecops-engineer
description: |
  Security integration in CI/CD pipelines covering SAST and DAST tooling, container image scanning, dependency vulnerability auditing, infrastructure-as-code security scanning, secret detection, security gates with policy-as-code, compliance automation, supply chain security, and developer security enablement.
  Use when the user asks about devsecops engineer, devsecops engineer best practices, or needs guidance on devsecops engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security devops guide"
  category: "security"
  subcategory: "application-security"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# DevSecOps Engineer

## Overview

DevSecOps integrates security practices into every phase of the software delivery lifecycle. Rather than treating security as a gate at the end, DevSecOps embeds automated security testing, policy enforcement, and developer guidance into CI/CD pipelines, making security a shared responsibility. This skill covers the tools, pipeline configurations, and organizational patterns for shifting security left.

## Security Pipeline Architecture

```
Developer Workstation          CI Pipeline                  CD Pipeline
+------------------+    +---------------------+    +--------------------+
| Pre-commit hooks |    | Build Stage         |    | Pre-deploy         |
| - Secret scan    |--->| - SAST              |--->| - DAST             |
| - Lint security  |    | - Dependency audit   |    | - Penetration test |
| - IaC scan       |    | - Container scan     |    | - Compliance check |
+------------------+    | - License check      |    | - Security sign-off|
                        | - Unit security tests|    +--------------------+
                        +---------------------+             |
                                |                           v
                        +---------------------+    +--------------------+
                        | Security Gate       |    | Production         |
                        | - Policy evaluation |--->| - Runtime protect  |
                        | - Risk score check  |    | - WAF / RASP       |
                        | - Break/warn/pass   |    | - Monitoring       |
                        +---------------------+    +--------------------+
```

## SAST (Static Application Security Testing)

### GitHub Actions SAST Pipeline

```yaml
name: Security Scan
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Semgrep: Fast, customizable SAST
      - name: Semgrep SAST
        uses: semgrep/semgrep-action@v1
        with:
          config: >-
            p/default
            p/owasp-top-ten
            p/javascript
            p/python
          generateSarif: true
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}

      # Upload results to GitHub Security tab
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: semgrep.sarif

      # CodeQL for deeper analysis
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript, python

      - name: CodeQL Analysis
        uses: github/codeql-action/analyze@v3
```

### Custom Semgrep Rules

```yaml
# .semgrep/custom-rules.yaml
rules:
  - id: no-hardcoded-secrets
    patterns:
      - pattern-either:
          - pattern: |
              $KEY = "AKIA..."
          - pattern: |
              password = "..."
          - pattern: |
              api_key = "..."
    message: "Hardcoded secret detected. Use environment variables or secret manager."
    severity: ERROR
    languages: [python, javascript, java]

  - id: sql-injection-risk
    patterns:
      - pattern: |
          cursor.execute(f"... {$USER_INPUT} ...")
      - pattern-not: |
          cursor.execute("...", [$PARAMS])
    message: "Possible SQL injection. Use parameterized queries."
    severity: ERROR
    languages: [python]

  - id: unsafe-deserialization
    pattern: $MODULE.loads($DATA)
    message: "Unsafe deserialization with untrusted data. Use json.loads or a safe deserializer."
    severity: WARNING
    languages: [python]

  - id: missing-auth-decorator
    patterns:
      - pattern: |
          @app.route($PATH, methods=["POST", ...])
          def $FUNC(...):
              ...
      - pattern-not: |
          @require_auth
          @app.route($PATH, methods=["POST", ...])
          def $FUNC(...):
              ...
    paths:
      include: ["**/api/**"]
      exclude: ["**/public/**", "**/health**"]
    message: "POST endpoint missing @require_auth decorator."
    severity: WARNING
    languages: [python]
```

## DAST (Dynamic Application Security Testing)

### OWASP ZAP Integration

```yaml
# GitLab CI DAST with ZAP
dast_scan:
  stage: security
  image: ghcr.io/zaproxy/zaproxy:stable
  script:
    # Start the application in background
    - docker-compose -f docker-compose.test.yml up -d
    - sleep 30  # Wait for app startup

    # API scan using OpenAPI spec
    - zap-api-scan.py
        -t [reference URL]
        -f openapi
        -r zap-api-report.html
        -w zap-api-report.md
        -J zap-api-report.json
        -c zap-api-rules.conf
        -I  # Don't fail on warnings

    # Full scan for web application
    - zap-full-scan.py
        -t [reference URL]
        -r zap-full-report.html
        -J zap-full-report.json
        -c zap-full-rules.conf

    # Evaluate results
    - python evaluate_zap_results.py zap-api-report.json
  artifacts:
    reports:
      dast: zap-api-report.json
    paths:
      - zap-*-report.*
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"  # Run on schedule, not every PR
```

## Container Security Scanning

### Multi-Scanner Approach

```yaml
# GitHub Actions container security
container-security:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - name: Build image
      run: docker build -t myapp:${{ github.sha }} .

    # Trivy: Comprehensive vulnerability scanner
    - name: Trivy vulnerability scan
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: myapp:${{ github.sha }}
        format: sarif
        output: trivy-results.sarif
        severity: CRITICAL,HIGH
        exit-code: 1  # Fail on critical/high

    # Grype: Alternative scanner for comparison
    - name: Grype scan
      uses: anchore/scan-action@v3
      with:
        image: myapp:${{ github.sha }}
        fail-build: true
        severity-cutoff: high

    # Hadolint: Dockerfile best practices
    - name: Lint Dockerfile
      uses: hadolint/hadolint-action@v3.1.0
      with:
        dockerfile: Dockerfile
        failure-threshold: warning

    # Dockle: Container image linter
    - name: Dockle check
      run: |
        docker run --rm -v [system-path] \
          goodwithtech/dockle:latest --exit-code 1 myapp:${{ github.sha }}
```

### Secure Dockerfile Patterns

```dockerfile
# Multi-stage build: minimize attack surface
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production image: minimal base
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app

# Non-root user (distroless has nonroot user built in)
USER nonroot:nonroot

# Copy only production artifacts
COPY --from=builder --chown=nonroot:nonroot /app/dist ./dist
COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules

# No shell, no package manager, minimal attack surface
EXPOSE 8080
CMD ["dist/server.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD ["/nodejs/bin/node", "-e", "get('[reference URL]').then(r => process.exit(r.ok ? 0 : 1))"]
```

## Dependency Vulnerability Audit

### Automated Dependency Scanning

```yaml
# .github/workflows/dependency-audit.yml
dependency-audit:
  runs-on: ubuntu-latest
  steps:
    # Node.js audit
    - name: npm audit
      run: npm audit --audit-level=high --json > npm-audit.json || true

    # Python safety check
    - name: pip-audit
      run: |
        install via pip: pip-audit
        pip-audit -r requirements.txt --format json -o pip-audit.json \
          --desc on --fix --dry-run

    # Go vulnerability check
    - name: govulncheck
      run: govulncheck ./...

    # Snyk (comprehensive multi-language)
    - name: Snyk test
      uses: snyk/actions/node@master
      with:
        args: --severity-threshold=high --json-file-output=snyk-results.json
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

    # SBOM generation
    - name: Generate SBOM
      run: |
        syft dir:. -o spdx-json > sbom.spdx.json
        grype sbom:sbom.spdx.json --fail-on high
```

## Secret Detection

### Pre-commit and CI Secret Scanning

```yaml
# .pre-commit-config.yaml
repos:
  - repo: [reference URL]
    rev: v8.18.0
    hooks:
      - id: gitleaks

  - repo: [reference URL]
    rev: v3.63.0
    hooks:
      - id: trufflehog
        args: ['--only-verified']

# Custom gitleaks config: .gitleaks.toml
[extend]
useDefault = true

[[rules]]
id = "custom-api-key"
description = "Custom API Key Pattern"
regex = '''MYAPP_[A-Z]+_KEY\s*=\s*['"][a-zA-Z0-9]{32,}['"]'''
secretGroup = 0

[allowlist]
paths = [
    '''\.config\.example$''',
    '''\.config\.template$''',
    '''test/.*fixtures.*''',
]
```

## Infrastructure-as-Code Security

### Terraform Security Scanning

```yaml
# tfsec and checkov for IaC security
iac-security:
  runs-on: ubuntu-latest
  steps:
    - name: tfsec
      uses: aquasecurity/tfsec-action@v1.0.3
      with:
        soft_fail: false
        additional_args: --minimum-severity HIGH

    - name: Checkov
      uses: bridgecrewio/checkov-action@master
      with:
        directory: terraform/
        framework: terraform
        soft_fail: false
        check: >-
          CKV_AWS_18,CKV_AWS_19,CKV_AWS_20,CKV_AWS_21,
          CKV_AWS_145,CKV_AWS_144
```

## Security Gates with Policy-as-Code

### Open Policy Agent (OPA) Security Gates

```rego
# policy/security-gate.rego
package security.gate

import future.keywords.in

default allow = false

# Allow deployment only if all security checks pass
allow {
    no_critical_vulns
    no_secret_findings
    sast_passed
    container_scan_passed
    compliance_checked
}

no_critical_vulns {
    input.vulnerability_scan.critical_count == 0
    input.vulnerability_scan.high_count <= input.policy.max_high_vulns
}

no_secret_findings {
    count(input.secret_scan.findings) == 0
}

sast_passed {
    input.sast_scan.error_count == 0
}

container_scan_passed {
    input.container_scan.critical_count == 0
    not base_image_outdated
}

base_image_outdated {
    input.container_scan.base_image_age_days > 90
}

compliance_checked {
    every check in input.compliance.required_checks {
        check.status == "passed"
    }
}

# Generate human-readable violations
violations[msg] {
    not no_critical_vulns
    msg := sprintf("Found %d critical and %d high vulnerabilities",
        [input.vulnerability_scan.critical_count, input.vulnerability_scan.high_count])
}

violations[msg] {
    not no_secret_findings
    msg := sprintf("Found %d secret(s) in code", [count(input.secret_scan.findings)])
}
```

## DevSecOps Metrics

```yaml
metrics:
  pipeline_security:
    - mean_time_to_remediate_critical: "< 7 days"
    - mean_time_to_remediate_high: "< 30 days"
    - security_gate_pass_rate: "> 85%"
    - false_positive_rate: "< 15%"

  developer_enablement:
    - pre_commit_adoption_rate: "> 90% of devs"
    - security_training_completion: "> 95%"
    - security_champion_coverage: "1 per team"
    - time_to_fix_in_pr: "< 2 hours"

  vulnerability_management:
    - open_critical_vulns: "0"
    - open_high_vulns: "< 10"
    - dependency_freshness: "> 90% up to date"
    - sbom_coverage: "100% of services"

  compliance:
    - policy_compliance_rate: "> 98%"
    - audit_findings_open: "< 5"
    - iac_scan_coverage: "100% of infra"
```

## Implementation Checklist

```
Phase 1 - Foundation:
  [ ] Secret scanning in pre-commit hooks
  [ ] SAST in CI (Semgrep or CodeQL)
  [ ] Dependency audit in CI (npm audit, pip-audit, Snyk)
  [ ] Container scanning (Trivy)
  [ ] Dockerfile linting (Hadolint)

Phase 2 - Enforcement:
  [ ] Security gate policy defined (OPA or custom)
  [ ] Block merges on critical findings
  [ ] SBOM generation for all artifacts
  [ ] IaC scanning (tfsec, Checkov)
  [ ] License compliance checking

Phase 3 - Dynamic Testing:
  [ ] DAST integration (ZAP) for staging
  [ ] API security testing against OpenAPI spec
  [ ] Scheduled penetration testing
  [ ] Chaos security testing

Phase 4 - Culture:
  [ ] Security champions program launched
  [ ] Developer security training (OWASP Top 10)
  [ ] Security findings visible in developer IDE
  [ ] Blameless post-mortems for security incidents
  [ ] Gamified security metrics dashboard
```

## When to Use

**Use this skill when:**
- Designing or implementing devsecops engineer solutions
- Reviewing or improving existing devsecops engineer approaches
- Making architectural or implementation decisions about devsecops engineer
- Learning devsecops engineer patterns and best practices
- Troubleshooting devsecops engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Devsecops Engineer Analysis

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

**Input:** "Help me implement devsecops engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended devsecops engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When devsecops engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
