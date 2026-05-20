---
name: security-hardener
description: |
  System security hardening expertise covering CIS benchmarks, OS hardening for Linux and Windows, container hardening, network hardening, application hardening, database hardening, cloud hardening for AWS/Azure/GCP, hardening automation, and compliance scanning for reducing the attack surface of infrastructure and applications.
  Use when the user asks about security hardener, security hardener best practices, or needs guidance on security hardener implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security cloud-security guide"
  category: "security"
  subcategory: "application-security"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Security Hardener

## Overview

Security hardening is the process of reducing a system's attack surface by disabling unnecessary services, applying secure configurations, and enforcing the principle of least privilege across all layers. This skill covers hardening practices for operating systems, containers, networks, applications, databases, and cloud infrastructure.

## CIS Benchmarks

The Center for Internet Security (CIS) publishes configuration benchmarks for virtually every technology. These are the industry-standard baseline for hardening.

### CIS Benchmark Levels

```
Level 1: Basic security settings
  - Minimal performance impact
  - Should not break functionality
  - Apply to ALL systems

Level 2: Defense-in-depth settings
  - May have minor performance impact
  - More restrictive
  - Apply to high-security systems
```

### Automated CIS Scanning

```shell
# CIS-CAT Pro (official CIS tool)
./cis-cat-full/cis-cat-full.shell-cmd \
    -b benchmarks/CIS_Ubuntu_Linux_22.04_LTS_Benchmark_v1.0.0-xccdf.xml \
    -p Level_1_Server \
    -r reports/

# OpenSCAP (open source)
oscap xccdf evaluate \
    --profile xccdf_org.ssgproject.content_profile_cis \
    --results results.xml \
    --report report.html \
    # ... (condensed) ...
    --reporter html:report.html json:results.json

# Lynis (open source system auditing)
lynis audit system --pentest --quick
```

## Linux OS Hardening

### User and Authentication

```shell
# 1. Password policy (/etc/security/pwquality.conf)
minlen = 14
minclass = 4
maxrepeat = 3
maxclassrepeat = 3
dictcheck = 1
enforcing = 1

# 2. Account lockout (/etc/pam.d/common-auth)
auth required pam_faillock.so preauth silent audit deny=5 unlock_time=900
auth required pam_faillock.so authfail audit deny=5 unlock_time=900
# ... (condensed) ...
# Audit with:
awk -F: '$3 >= 1000 && $3 < 65000 {print $1}' [system-path]
# Remove or lock unused accounts:
usermod -L unused_account
```

### File System Hardening

```shell
# 1. Mount options (/etc/fstab)
# /tmp - noexec,nosuid,nodev
tmpfs /tmp tmpfs defaults,rw,nosuid,nodev,noexec,relatime,size=2G 0 0

# [system-path] - noexec,nosuid,nodev
./tmp [system-path] none bind 0 0

# /home - nosuid,nodev
UUID=xxx /home ext4 defaults,nosuid,nodev 0 2

# /dev/shm - noexec,nosuid,nodev
# ... (condensed) ...
chmod 600 [system-path]
chmod 644 [system-path]
chmod 700 /root
chmod 600 /boot/grub/grub.cfg
```

### Kernel Hardening

```shell
# [system-path] or [system-path]

# Network hardening
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1
# ... (condensed) ...
fs.protected_symlinks = 1

# Apply changes
sysctl -p
```

### Service Hardening

```shell
# 1. Disable unnecessary services
systemctl disable --now avahi-daemon
systemctl disable --now cups
systemctl disable --now rpcbind
systemctl disable --now nfs-server
systemctl disable --now vsftpd

# 2. List all running services
systemctl list-units --type=service --state=running

# 3. Enable automatic security updates
# ... (condensed) ...

# Monitor file system changes
-w [system-path] -p wa -k sshd_config
-w [system-path] -p wa -k sysctl_changes
```

## Container Hardening

### Dockerfile Best Practices

```dockerfile
# 1. Use minimal base image
FROM ubuntu:22.04          # BAD: full OS, large attack surface
FROM alpine:3.19           # BETTER: minimal, ~5MB
FROM gcr.io/distroless/cc  # BEST: no shell, no package manager

# 2. Run as non-root user
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser
USER appuser

# 3. Multi-stage build (minimize final image)
# ... (condensed) ...

# 7. Scan for vulnerabilities
# docker scout cves myapp:latest
# trivy image myapp:latest
```

### Kubernetes Pod Security

```yaml
# Pod Security Standards (restricted profile)
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 1000
    # ... (condensed) ...
        - namespaceSelector: {}
      ports:
        - port: 53
          protocol: UDP
```

## Network Hardening

### Firewall Configuration

```shell
# iptables: deny all, then allow specific
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow established connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT

# ... (condensed) ...

# Log dropped packets
iptables -A INPUT -j LOG --log-prefix "DROPPED: " --log-level 4
iptables -A INPUT -j DROP
```

### Network Segmentation

```yaml
network_zones:
  dmz:
    purpose: "Public-facing services"
    contains: [load_balancer, api_gateway, waf]
    allowed_inbound: [internet:443]
    allowed_outbound: [app_tier:8080, monitoring:9090]

  app_tier:
    purpose: "Application servers"
    contains: [web_servers, api_servers, workers]
    allowed_inbound: [dmz:8080]
    # ... (condensed) ...
    purpose: "Operations and monitoring"
    contains: [bastion, monitoring, logging, ci_cd]
    allowed_inbound: [vpn:22]
    allowed_outbound: [all_zones:monitoring_ports]
```

## Application Hardening

### HTTP Security Headers

```python
# Flask/Django middleware for security headers
SECURITY_HEADERS = {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'X-XSS-Protection': '0',  # Disable legacy filter, rely on CSP
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
}

# Remove revealing headers
HEADERS_TO_REMOVE = ['Server', 'X-Powered-By']
```

### Cookie Hardening

```python
# Secure cookie configuration
SESSION_COOKIE_CONFIG = {
    'httponly': True,       # Prevent JavaScript access
    'secure': True,         # HTTPS only
    'samesite': 'Lax',     # Prevent CSRF (Strict for high-security)
    'path': '/',
    'max_age': 3600,        # 1 hour session
    'domain': '.example.com',
}

# Set-Cookie header result:
# Set-Cookie: session=abc123; Path=/; Domain=.example.com;
#   Max-Age=3600; HttpOnly; Secure; SameSite=Lax
```

### Dependency Hardening

```shell
# Lock all dependencies to exact versions
# Node.js: use package-lock.json with npm ci
npm ci  # NOT install via npm: (ci uses lockfile exactly)

# Python: use pip freeze or poetry.lock
install via pip: -r requirements.txt --require-hashes

# Review and audit regularly
npm audit
pip-audit
```

## Database Hardening

### PostgreSQL

```sql
-- 1. Authentication
-- pg_hba.conf: require SSL, no trust authentication
hostssl all all 10.0.0.0/8 scram-sha-256

-- 2. Least privilege
-- Create application user with minimal permissions
CREATE ROLE app_user WITH LOGIN PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE mydb TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
-- No DELETE, no DDL, no SUPERUSER
# ... (condensed) ...
-- 6. Row-level security
ALTER TABLE customer_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY customer_isolation ON customer_data
    USING (tenant_id = current_setting('app.current_tenant')::int);
```

## Cloud Hardening

### AWS

```yaml
aws_hardening:
  iam:
    - enable_mfa_for_all_users: true
    - no_root_account_access_keys: true
    - password_policy:
        min_length: 14
        require_symbols: true
        require_numbers: true
        require_uppercase: true
        require_lowercase: true
        max_age_days: 90
        # ... (condensed) ...
  compute:
    - imdsv2: "Require IMDSv2 (disable IMDSv1) on all EC2 instances"
    - ssm: "Use Systems Manager instead of SSH where possible"
    - ami_scanning: "Scan AMIs for vulnerabilities before deployment"
```

### AWS Hardening with Terraform

```hcl
# Enforce IMDSv2 on all EC2 instances
resource "aws_instance" "app_server" {
  ami           = var.ami_id
  instance_type = "t3.medium"

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"  # Enforce IMDSv2
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "disabled"
  }
# ... (condensed) ...
  versioning_configuration {
    status = "Enabled"
  }
}
```

## Hardening Automation

### Ansible Hardening Playbook

```yaml
# hardening.yml
---
- name: Server Hardening
  hosts: all
  become: yes

  roles:
    - role: devsec.hardening.os_hardening
      vars:
        os_auth_pw_max_age: 90
        os_auth_pw_min_age: 1
        # ... (condensed) ...
      service:
        name: auditd
        state: started
        enabled: yes
```

## Hardening Validation

### Compliance Scanning Schedule

```yaml
scanning_schedule:
  continuous:
    - tool: AWS Config Rules
      scope: All AWS resources
      alerts: Real-time

    - tool: Falco
      scope: Container runtime
      alerts: Real-time

  daily:
    # ... (condensed) ...
  quarterly:
    - tool: Nessus/Qualys
      scope: Full infrastructure
      alerts: Executive report
```

## Hardening Decision Framework

1. **Start with CIS Level 1**: Apply to all systems as baseline
2. **Apply CIS Level 2**: For systems handling sensitive data
3. **Layer defense**: OS + network + application + database + cloud
4. **Automate everything**: Configuration management (Ansible, Terraform)
5. **Scan continuously**: Detect configuration drift immediately
6. **Test changes**: Validate hardening does not break functionality
7. **Document exceptions**: Every deviation from baseline must be justified
8. **Review regularly**: Quarterly review of hardening posture

## When to Use

**Use this skill when:**
- Designing or implementing security hardener solutions
- Reviewing or improving existing security hardener approaches
- Making architectural or implementation decisions about security hardener
- Learning security hardener patterns and best practices
- Troubleshooting security hardener-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Security Hardener Analysis

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

**Input:** "Help me implement security hardener for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended security hardener approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When security hardener must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
