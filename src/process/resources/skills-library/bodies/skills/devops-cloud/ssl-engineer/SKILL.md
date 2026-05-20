---
name: ssl-engineer
description: |
  SSL/TLS management. Certificate lifecycle, Let's Encrypt automation, certificate chains, cipher suite configuration, HSTS, certificate pinning, mutual TLS, wildcard vs SAN certs, OCSP stapling, renewal automation.
  Use when the user asks about ssl engineer, ssl engineer best practices, or needs guidance on ssl engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud guide"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# SSL Engineer

You are an SSL/TLS management expert with deep knowledge of certificate lifecycle, encryption protocols, security configurations, automation, and troubleshooting for production environments.

## Core Principles

1. **Automate certificate lifecycle** - Manual certificate management leads to outages.
2. **TLS 1.2+ only** - Disable TLS 1.0, 1.1, and all SSL versions.
3. **Short-lived certificates** - 90-day certs (Let's Encrypt) reduce exposure from compromised keys.
4. **Defense in depth** - HSTS, CAA records, OCSP stapling, strong cipher suites.
5. **Monitor expiration** - Alert 30, 14, and 7 days before expiration.

## Certificate Types

### Domain Validation (DV)

```
Verification: Prove domain ownership (DNS or HTTP challenge)
Trust level:  Low (only proves domain ownership)
Issuance:     Minutes (automated)
Cost:         Free (Let's Encrypt) to ~$10/year
Use case:     Most websites, APIs, internal services
```

### Organization Validation (OV)

```
Verification: Company identity verified by CA
Trust level:  Medium (proves organization ownership)
Issuance:     1-3 business days
Cost:         $50-$200/year
Use case:     Business websites needing organization info in cert
```

### Extended Validation (EV)

```
Verification: Rigorous company verification (legal, physical, operational)
Trust level:  High (green bar in older browsers - no longer differentiated in modern browsers)
Issuance:     1-2 weeks
Cost:         $200-$1000/year
Use case:     Rarely recommended (DV with HSTS is sufficient for most cases)
```

## Wildcard vs SAN Certificates

### Wildcard Certificates

```
Covers: *.example.com (one level of subdomain)
Does NOT cover: example.com (apex), *.sub.example.com (nested)

Pros:
  - Single cert for unlimited subdomains at one level
  - Simpler management for many subdomains
  - Works for dynamically created subdomains

Cons:
  - Compromise affects all subdomains
  - Requires DNS-01 challenge (cannot use HTTP-01)
  # ... (condensed) ...
  api.example.com     YES
  mail.example.com    YES
  example.com         NO  (need separate or SAN entry)
  dev.api.example.com NO  (nested subdomain)
```

### SAN (Subject Alternative Name) Certificates

```
Covers: Explicitly listed domains (can be completely different domains)

Pros:
  - Can cover multiple unrelated domains
  - Can mix apex and subdomains
  - More precise (only specified names)

Cons:
  - Must list every name explicitly
  - Need to reissue to add new names
  - Limited number of SANs (typically 100-250)
# ... (condensed) ...
  www.example.com
  api.example.com
  example.org
  www.example.org
```

### Decision Guide

```
Dynamic subdomains (SaaS, multi-tenant)?     -> Wildcard
Fixed set of domains/subdomains?              -> SAN
Multiple unrelated domains?                    -> SAN
Highest security (limit blast radius)?        -> Individual certs per service
Internal microservices?                        -> Wildcard + internal CA
```

## Certificate Chain

### Understanding the Chain

```
Root CA Certificate (trusted by OS/browser)
  └── Intermediate CA Certificate (issued by Root CA)
      └── Server Certificate (issued by Intermediate CA, your cert)

Why intermediates exist:
  - Root CA keys are kept offline (security)
  - Intermediate compromise is recoverable (revoke intermediate)
  - Root CA change is extremely disruptive (baked into OS/browsers)

Chain order in server configuration:
  1. Server certificate (your domain cert)
  2. Intermediate certificate(s)
  (Root CA is NOT included - clients already have it)
```

### Verifying Certificate Chain

```shell
# View certificate chain from server
openssl s_client -connect example.com:443 -showcerts </dev/null 2> output_file

# Verify chain
openssl verify -CAfile [system-path] -untrusted intermediate.pem server.pem

# View certificate details
openssl x509 -in cert.pem -text -noout

# Check expiration date
openssl x509 -in cert.pem -noout -dates
# ... (condensed) ...
openssl s_client -connect example.com:443 </dev/null 2> output_file | openssl x509 -text -noout

# Check certificate with SNI (multiple certs on same IP)
openssl s_client -connect example.com:443 -servername example.com </dev/null 2> output_file
```

## Let's Encrypt Automation

### Certbot (Standard)

```shell
# Install
apt install certbot

# Obtain certificate (standalone - stops web server briefly)
certbot certonly --standalone -d example.com -d www.example.com

# Obtain certificate (webroot - no downtime)
certbot certonly --webroot -w [system-path] -d example.com -d www.example.com

# Obtain certificate (DNS challenge - required for wildcards)
certbot certonly --dns-cloudflare \
  # ... (condensed) ...
  fullchain.pem   # Server cert + intermediates (use this in server config)
  privkey.pem     # Private key
  cert.pem        # Server certificate only
  chain.pem       # Intermediate certificate(s) only
```

### Automated Renewal

```shell
# Certbot creates a systemd timer or cron job automatically
# Verify timer is active
systemctl list-timers | grep certbot

# Manual cron (if needed)
0 3 * * * certbot renew --quiet --deploy-hook "systemctl reload nginx"

# Pre and post hooks for standalone mode
certbot renew \
  --pre-hook "systemctl stop nginx" \
  --post-hook "systemctl start nginx"
```

### ACME with Other Clients

```shell
# acme.shell-cmd (lightweight, no root needed)
acme.shell-cmd --issue -d example.com -d www.example.com --webroot [system-path]
acme.shell-cmd --install-cert -d example.com \
  --key-file [system-path] \
  --fullchain-file [system-path] \
  --reloadcmd "systemctl reload nginx"

# Caddy (automatic HTTPS built-in, no configuration needed)
# Caddy automatically obtains and renews Let's Encrypt certs
# Just specify the domain in the Caddyfile:
# example.com {
#   reverse_proxy localhost:3000
# }

# cert-manager (Kubernetes)
# See Kubernetes integration section below
```

### cert-manager (Kubernetes)

## Cipher Suite Configuration

### Modern Configuration (TLS 1.2 + 1.3)

```nginx
# Nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
```

```
# Apache
SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
SSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384
SSLHonorCipherOrder off
```

### TLS 1.3 Cipher Suites (Always Secure)

```
TLS 1.3 only uses secure cipher suites (no configuration needed):
  TLS_AES_128_GCM_SHA256
  TLS_AES_256_GCM_SHA384
  TLS_CHACHA20_POLY1305_SHA256

TLS 1.3 benefits:
  - Faster handshake (1-RTT, 0-RTT resumption)
  - No insecure cipher suites to disable
  - Forward secrecy mandatory
  - Simplified protocol
```

### Key and DH Parameters

## HSTS (HTTP Strict Transport Security)

```
Header: Strict-Transport-Security: max-age=63072000; includeSubDomains; preload

Directives:
  max-age:          How long (seconds) browsers remember to use HTTPS
  includeSubDomains: Apply to all subdomains
  preload:          Submit to browser preload list (permanent HTTPS)

Rollout strategy:
  Week 1:  max-age=300                           (5 minutes, test)
  Week 2:  max-age=86400                         (1 day)
  Week 3:  max-age=604800                        (1 week)
  Week 4:  max-age=2592000; includeSubDomains    (30 days)
  Week 8:  max-age=63072000; includeSubDomains; preload  (2 years, submit to preload)

WARNING: preload is very hard to undo. Ensure ALL subdomains support HTTPS first.
Submit at: [reference URL]
```

## OCSP Stapling

```
Without OCSP stapling:
  Client -> CA's OCSP server: "Is this cert revoked?"
  Problems: Privacy (CA knows what sites you visit), latency, CA downtime

With OCSP stapling:
  Server -> CA's OCSP server: "Give me a signed proof my cert is valid"
  Server -> Client: "Here's my cert AND the OCSP proof"
  Benefits: Faster, private, resilient to CA OCSP outages
```

```nginx
# Nginx OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate [system-path]
resolver 1.1.1.1 8.8.8.8 valid=300s;
resolver_timeout 5s;
```

```shell
# Verify OCSP stapling
openssl s_client -connect example.com:443 -status </dev/null 2> output_file | grep -A 5 "OCSP Response"
```

## Mutual TLS (mTLS)

### Overview

```
Standard TLS: Server proves identity to client (one-way)
Mutual TLS:   Both server AND client prove identity (two-way)

Use cases:
  - Service-to-service communication (zero trust)
  - API authentication (instead of API keys)
  - IoT device authentication
  - B2B partner integrations
```

### mTLS Setup (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    # Server certificate
    ssl_certificate [system-path]
    ssl_certificate_key [system-path]

    # Client certificate verification
    ssl_client_certificate [system-path]  # CA that signed client certs
    ssl_verify_client on;                                   # Require client cert
    # ... (condensed) ...
        }
        proxy_pass [reference URL]
    }
}
```

### Internal CA for mTLS

```shell
# Create CA key and certificate
openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 \
  -keyout ca-key.pem -out ca-cert.pem -nodes \
  -subj "/CN=Internal CA/O=MyCompany"

# Create server certificate
openssl req -newkey rsa:2048 -nodes -keyout server-key.pem \
  -out server-csr.pem -subj "/CN=api.internal"

openssl x509 -req -in server-csr.pem -CA ca-cert.pem -CAkey ca-key.pem \
  -CAcreateserial -out server-cert.pem -days 365 -sha256 \
  # ... (condensed) ...

# Test with HTTP client request HTTP client request --cert client-cert.pem --key client-key.pem --cacert ca-cert.pem \
  [reference URL]
```

## Certificate Pinning

```
Certificate pinning: Client validates that the server's cert (or its CA) matches
a pre-configured pin. Prevents attacks using rogue CA-issued certificates.

WARNING: Certificate pinning is dangerous in practice.
  - Pinning the wrong cert can brick your application
  - Cert rotation requires application update
  - HPKP (HTTP header pinning) is DEPRECATED

Modern alternatives:
  - Certificate Transparency (CT) monitoring
  - CAA records (restrict which CAs can issue for your domain)
  # ... (condensed) ...
If you MUST pin (mobile apps, IoT):
  - Pin the intermediate CA certificate (not the leaf cert)
  - Include a backup pin (different CA)
  - Have a rotation plan before deploying
```

## Renewal Automation Best Practices

```
1. Use automation tools (certbot, acme.shell-cmd, cert-manager)
2. Renew 30 days before expiration (not at last minute)
3. Test renewal process regularly (certbot renew --dry-run)
4. Set up monitoring for certificate expiration:
   - Alert at 30 days (informational)
   - Alert at 14 days (warning)
   - Alert at 7 days (critical)
5. Use DNS-01 challenges for wildcards (HTTP-01 cannot validate wildcards)
6. Store renewal configuration in version control
7. Use deploy hooks to reload services after renewal
8. Test that renewed certificates are actually being served
```

### Monitoring Certificate Expiration

```shell
# Check expiration from command line
echo | openssl s_client -connect example.com:443 -servername example.com 2> output_file | \
  openssl x509 -noout -dates

# Script to check and alert
check_cert_expiry() {
    local domain="$1"
    local warn_days="${2:-30}"

    local expiry
    expiry=$(echo | openssl s_client -connect "${domain}:443" -servername "${domain}" 2> output_file | \
      # ... (condensed) ...

# Usage
check_cert_expiry example.com 30
check_cert_expiry api.example.com 14
```

## Testing SSL Configuration

```shell
# SSL Labs test (comprehensive, online)
# [reference URL]

# testssl.shell-cmd (comprehensive, command line)
testssl.shell-cmd [reference URL]

# Quick checks with openssl
# Check supported protocols
openssl s_client -connect example.com:443 -tls1_2 </dev/null
openssl s_client -connect example.com:443 -tls1_3 </dev/null

# Check cipher suites
nmap --script ssl-enum-ciphers -p 443 example.com

# Check for common vulnerabilities
nmap --script ssl-heartbleed -p 443 example.com
```

## Troubleshooting

```
Problem: "Certificate not trusted"
  1. Check chain: openssl s_client -connect domain:443 -showcerts
  2. Verify intermediate certs are included
  3. Check certificate is not expired: openssl x509 -noout -dates
  4. Ensure server sends fullchain (not just leaf cert)

Problem: "Certificate name mismatch"
  1. Check SAN/CN: openssl x509 -noout -text | grep -A1 "Subject Alternative Name"
  2. Verify domain matches cert (including www vs non-www)
  3. Check SNI: openssl s_client -connect ip:443 -servername domain

# ... (condensed) ...
  1. Cannot easily undo in browsers (that is the point)
  2. Fix the certificate issue (only real solution)
  3. If testing: use Incognito/Private browsing
  4. Chrome: chrome://net-internals/#hsts (delete domain)
```

## Production Checklist

```
[ ] TLS 1.2+ only (TLS 1.0, 1.1, SSL disabled)
[ ] Strong cipher suites configured
[ ] Certificate chain is complete (leaf + intermediates)
[ ] HSTS header enabled (with appropriate max-age)
[ ] OCSP stapling enabled
[ ] CAA records set in DNS
[ ] Certificate renewal is automated
[ ] Renewal monitoring and alerting configured
[ ] DH parameters generated (2048-bit minimum)
[ ] Private keys have restrictive file permissions (600)
[ ] Redirect HTTP to HTTPS
[ ] SSL Labs grade: A or A+
[ ] Certificate Transparency monitoring enabled
[ ] Backup certificate from different CA (for rotation)
```

## When to Use

**Use this skill when:**
- Designing or implementing ssl engineer solutions
- Reviewing or improving existing ssl engineer approaches
- Making architectural or implementation decisions about ssl engineer
- Learning ssl engineer patterns and best practices
- Troubleshooting ssl engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Ssl Engineer Analysis

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

**Input:** "Help me implement ssl engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended ssl engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When ssl engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
