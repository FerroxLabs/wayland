---
name: security-auditor
description: |
  Security vulnerability assessment expertise covering OWASP Top 10 deep dive, code review for security, dependency vulnerability scanning, SAST/DAST tools, security headers audit, authentication and authorization audit, and security assessment report writing for identifying and documenting application security weaknesses.
  Use when the user asks about security auditor, security auditor best practices, or needs guidance on security auditor implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security compliance guide"
  category: "security"
  subcategory: "application-security"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Security Auditor

## Overview

Security auditing is the systematic evaluation of an application's security posture. This skill covers the methodologies, tools, and techniques for identifying vulnerabilities in code, configuration, dependencies, and architecture. The goal is to find weaknesses before attackers do, and to provide clear, actionable remediation guidance.

## OWASP Top 10 Deep Dive (2021)

### A01: Broken Access Control

The most critical web application vulnerability. Access control enforces that users cannot act outside their intended permissions.

```python
# VULNERABLE: Insecure Direct Object Reference (IDOR)
@app.route('/api/invoices/<invoice_id>')
def get_invoice(invoice_id):
    invoice = db.query(Invoice).get(invoice_id)
    return jsonify(invoice.to_dict())
    # Any authenticated user can view any invoice by guessing IDs

# FIXED: Authorization check
@app.route('/api/invoices/<invoice_id>')
@login_required
def get_invoice(invoice_id):
    invoice = db.query(Invoice).get(invoice_id)
    if invoice is None:
        abort(404)
    if invoice.organization_id != current_user.organization_id:
        abort(403)
    return jsonify(invoice.to_dict())

# ... (condensed) ...
    data = request.json
    user = User(
        name=data['name'],
        email=data['email'],
        role='user'  # Always default, admin promotion via separate endpoint
    )
    db.save(user)
```

**Audit checklist**:
- [ ] Every API endpoint has authorization check
- [ ] IDOR testing on all resource endpoints (change IDs in URLs)
- [ ] Role-based access tested (can user A access user B's resources?)
- [ ] Admin functions restricted to admin roles
- [ ] CORS configuration reviewed (not `*` in production)
- [ ] Directory listing disabled on web servers
- [ ] JWT claims validated server-side (not trusted from client)

### A02: Cryptographic Failures

```python
# VULNERABLE: Weak password hashing
import hashlib
password_hash = hashlib.md5(password.encode()).hexdigest()  # MD5 is broken
password_hash = hashlib.sha256(password.encode()).hexdigest()  # No salt, fast

# FIXED: Use bcrypt or argon2
import bcrypt
password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))

# Or even better: argon2
from argon2 import PasswordHasher
ph = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)
password_hash = ph.hash(password)

# VULNERABLE: Sensitive data in logs
logger.info(f"User {email} login attempt with password {password}")
logger.info(f"Processing credit card {card_number}")

# FIXED: Redact sensitive fields
logger.info(f"User {email} login attempt")
logger.info(f"Processing credit card ****{card_number[-4:]}")
```

**Audit checklist**:
- [ ] All passwords hashed with bcrypt/argon2/scrypt (not MD5/SHA)
- [ ] Encryption at rest for PII/financial data
- [ ] TLS 1.2+ enforced for all connections
- [ ] No sensitive data in URLs, logs, or error messages
- [ ] Proper key management (not hardcoded, rotated)
- [ ] Weak cipher suites disabled

### A03: Injection

```python
# VULNERABLE: SQL injection
query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
# Input: username = "admin' OR '1'='1' --"

# FIXED: Parameterized queries
cursor.execute(
    "SELECT * FROM users WHERE username = %s AND password = %s",
    (username, password_hash)
)

# VULNERABLE: OS command injection
import subprocess
result = subprocess.run(f"ping {user_input}", shell=True, capture_output=True)
# Input: "; rm -rf /"

# FIXED: Use argument list (no shell interpretation)
result = subprocess.run(['ping', '-c', '4', user_input],
                       capture_output=True, timeout=10)

# VULNERABLE: Template injection (SSTI)
from jinja2 import Template
template = Template(user_input)  # User controls template!
# Input: "{{ config.items() }}"

# FIXED: Sandboxed template environment
from jinja2 import SandboxedEnvironment
env = SandboxedEnvironment()
template = env.from_string(user_controlled_template)
```

### A04: Insecure Design

Design-level security flaws that cannot be fixed with implementation. These require architectural changes.

**Design review questions**:
1. What is the threat model? (STRIDE applied to architecture)
2. Are trust boundaries defined and enforced?
3. Is the principle of least privilege applied?
4. Are failure modes secure? (fail closed, not open)
5. Is there defense in depth? (multiple layers of security)
6. Are rate limits and abuse controls designed in?
7. Is input validated at trust boundaries?

### A05: Security Misconfiguration

```yaml
# Common misconfigurations to audit:

# 1. Debug mode in production
# Django
DEBUG = True  # VULNERABLE
DEBUG = False  # FIXED

# 2. Default credentials
# Database: postgres/postgres, root/root
# Admin panels: admin/admin
# API keys: demo/test values

# 3. Unnecessary features enabled
# Directory listing, stack traces, verbose errors

# 4. Missing security headers (see Security Headers section)

# 5. Cloud storage misconfiguration
# S3 buckets with public access
# GCS buckets without IAM
# Azure blob containers with anonymous access

# 6. Overly permissive CORS
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Credentials: true
# These two together = critical vulnerability
```

### A06-A10 Summary

| Category | Key Check | Common Fix |
|----------|-----------|------------|
| A06: Vulnerable Components | Run `npm audit`, `pip-audit`, `trivy` | Update dependencies, use lockfiles |
| A07: Auth Failures | Test brute force, session fixation, credential stuffing | Rate limiting, MFA, secure session management |
| A08: Software/Data Integrity | Verify CI/CD pipeline integrity, check for deserialization | Signed artifacts, SRI, safe deserialization |
| A09: Logging Failures | Check if security events are logged, log injection | Structured logging, SIEM integration |
| A10: SSRF | Test URL parameters for internal network access | Allowlist URLs, block private IPs, use network segmentation |

## Code Review for Security

### Secure Code Review Checklist

```python
# Pattern 1: Input Validation
# Review all user input entry points
# - request.args, request.form, request.json, request.files
# - URL path parameters
# - HTTP headers (Host, X-Forwarded-For, Referer)
# - Cookie values
# - WebSocket messages

# Pattern 2: Output Encoding
# Ensure all output is context-aware encoded
# - HTML context: HTML entity encoding
# - JavaScript context: JavaScript encoding
# - URL context: URL encoding
# - CSS context: CSS encoding
# - SQL context: parameterized queries

# Pattern 3: Authentication
# - Password storage uses bcrypt/argon2
# ... (condensed) ...
# - Vertical privilege escalation tested

# Pattern 5: Cryptography
# - No custom crypto algorithms
# - Keys are not hardcoded
# - Random numbers use crypto-secure generator
# - TLS certificate validation not disabled
```

### Dangerous Function Patterns to Search For

```python
# Python dangerous patterns
DANGEROUS_PATTERNS = {
    'evaluate(': 'Code injection via evaluate',
    'run(': 'Code injection via run-cmd',
    'os.system(': 'OS command injection',
    'shell=True': 'Shell injection via subprocess',
    'pickle.loads(': 'Deserialization vulnerability',
    'yaml.load(': 'YAML deserialization (use safe_load)',
    'render_template_string(': 'Server-side template injection',
    '__import__': 'Dynamic import, potential code injection',
}

# JavaScript/Node.js dangerous patterns
JS_DANGEROUS = {
    'evaluate(': 'Code injection',
    'Callable(': 'Code injection via Function constructor',
    'innerHTML': 'XSS via DOM manipulation',
    'document.write(': 'XSS via document.write',
    'dangerouslySetInnerHTML': 'React XSS bypass',
    'new Callable(': 'Code injection',
}
```

## Dependency Vulnerability Scanning

```shell
# Python
pip-audit                        # Audit pip packages
safety check                     # Check against safety DB

# JavaScript/Node.js
npm audit                        # Built-in npm audit
npm audit fix                    # Auto-fix compatible updates

# Docker containers
trivy image myapp:latest         # Scan container image
grype myapp:latest               # Alternative scanner

# General (supports many ecosystems)
snyk test                        # Snyk CLI
osv-scanner --lockfile=./pom.xml # Google OSV scanner

# SBOM generation
syft myapp:latest -o spdx-json   # Generate Software Bill of Materials
```

### Dependency Policy

```yaml
# Acceptable risk criteria:
# - CVSS < 4.0 (Low): Accept with documentation
# - CVSS 4.0-6.9 (Medium): Fix within 30 days
# - CVSS 7.0-8.9 (High): Fix within 7 days
# - CVSS 9.0-10.0 (Critical): Fix within 24 hours
```

## SAST/DAST Tools

### Static Application Security Testing (SAST)

```shell
# Semgrep (recommended: fast, customizable, free)
semgrep --config=auto .
semgrep --config=p/owasp-top-ten .
semgrep --config=p/python .

# Custom Semgrep rules
# .semgrep/custom-rules.yml
```

```yaml
rules:
  - id: no-raw-sql
    patterns:
      - pattern: |
          $CURSOR.execute($QUERY)
      - pattern-not: |
          $CURSOR.execute($QUERY, $PARAMS)
    message: Use parameterized queries to prevent SQL injection
    severity: ERROR
    languages: [python]

  - id: no-hardcoded-secrets
    patterns:
      - pattern: |
          $VAR = "..."
      - metavariable-regex:
          metavariable: $VAR
          regex: (password|secret|api_key|token|private_key)
    message: Potential hardcoded secret
    severity: WARNING
    languages: [python, javascript, typescript]
```

```shell
# Bandit (Python-specific)
bandit -r src/ -f json -o bandit-report.json

# ESLint security plugin (JavaScript)
npx eslint --plugin security src/
```

### Dynamic Application Security Testing (DAST)

```shell
# OWASP ZAP (Zed Attack Proxy)
# Baseline scan (fast, passive)
docker run -t zaproxy/zap-stable zap-baseline.py \
    -t [reference URL] \
    -r zap-report.html

# Full scan (active, thorough)
docker run -t zaproxy/zap-stable zap-full-scan.py \
    -t [reference URL] \
    -r zap-full-report.html

# API scan with OpenAPI spec
docker run -t zaproxy/zap-stable zap-api-scan.py \
    -t [reference URL] \
    -f openapi \
    -r zap-api-report.html

# Nuclei (template-based vulnerability scanner)
nuclei -u [reference URL] -t cves/ -t vulnerabilities/
```

## Security Headers Audit

```python
# Required security headers and their recommended values
SECURITY_HEADERS = {
    'Strict-Transport-Security': {
        'recommended': 'max-age=31536000; includeSubDomains; preload',
        'purpose': 'Forces HTTPS for 1 year, including subdomains',
        'severity': 'HIGH',
    },
    'Content-Security-Policy': {
        'recommended': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'",
        'purpose': 'Prevents XSS and data injection attacks',
        'severity': 'HIGH',
    },
    'X-Content-Type-Options': {
        'recommended': 'nosniff',
        'purpose': 'Prevents MIME type sniffing',
        'severity': 'MEDIUM',
    },
    'X-Frame-Options': {
        # ... (condensed) ...
                'header': header,
                'status': 'SHOULD_REMOVE',
                'severity': 'LOW',
                'current_value': response.headers[header],
            })

    return results
```

## Authentication Audit

| Check | What to Test | Expected Behavior |
|-------|-------------|-------------------|
| Password policy | Minimum length, complexity | >= 12 chars, no common passwords |
| Brute force protection | 100+ rapid login attempts | Account lockout or rate limiting after 5-10 attempts |
| Session management | Session token entropy | >= 128 bits of randomness |
| Session fixation | Set session before auth, check after | New session ID issued after login |
| Logout | Click logout, reuse session token | Session invalidated server-side |
| Remember me | Inspect persistent cookie | Separate, rotatable token, not session ID |
| Password reset | Request reset, inspect token | Time-limited (1h), single-use, random |
| MFA bypass | Skip MFA step, direct API call | MFA enforced at API level, not just UI |

## Security Assessment Report Template

```markdown
# Security Assessment Report

## Executive Summary
- **Assessment Date**: [date range]
- **Scope**: [Application name, version, environment]
- **Methodology**: OWASP Testing Guide v4.2, ASVS Level 2
- **Overall Risk Rating**: [Critical / High / Medium / Low]
- **Critical Findings**: [count]
- **High Findings**: [count]

## Finding Summary

| # | Title | Severity | CVSS | Status |
|---|-------|----------|------|--------|
| 1 | SQL Injection in search API | Critical | 9.8 | Open |
| 2 | Missing rate limiting on login | High | 7.5 | Open |

## Detailed Findings
# ... (condensed) ...
- Dependencies regularly updated

## Recommendations Summary
1. [Immediate] Fix SQL injection in search API
2. [1 week] Implement rate limiting on authentication endpoints
3. [1 month] Add Content-Security-Policy header
4. [Ongoing] Integrate SAST into CI/CD pipeline
```

## CI/CD Security Integration

```yaml
# GitHub Actions security workflow
name: Security Scan
on: [push, pull_request]

jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Semgrep SAST
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/owasp-top-ten
            p/python
            .semgrep/

  dependency-scan:
    # ... (condensed) ...
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          get-depth: 0
      - name: Gitleaks secret scan
        uses: gitleaks/gitleaks-action@v2
```

## When to Use

**Use this skill when:**
- Designing or implementing security auditor solutions
- Reviewing or improving existing security auditor approaches
- Making architectural or implementation decisions about security auditor
- Learning security auditor patterns and best practices
- Troubleshooting security auditor-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Security Auditor Analysis

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

**Input:** "Help me implement security auditor for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended security auditor approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When security auditor must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
