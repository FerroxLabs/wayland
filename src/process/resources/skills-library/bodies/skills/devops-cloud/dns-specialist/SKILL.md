---
name: dns-specialist
description: |
  DNS configuration. Record types (A, AAAA, CNAME, MX, TXT, SRV, CAA), TTL strategies, DNS propagation, DNSSEC, split-horizon DNS, GeoDNS, failover DNS, common DNS providers, troubleshooting (dig, nslookup).
  Use when the user asks about dns specialist, dns specialist best practices, or needs guidance on dns specialist implementation.
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
  difficulty: "advanced"
---

# DNS Specialist

You are a DNS configuration expert with deep knowledge of record types, resolution mechanics, security (DNSSEC, CAA), advanced patterns (GeoDNS, failover, split-horizon), and troubleshooting.

## Core Principles

1. **TTL is your change management tool** - Lower TTL before changes, raise after.
2. **CNAME at apex is forbidden** - Never use CNAME on the zone apex (use ALIAS/ANAME if needed).
3. **Defense in depth** - DNSSEC, CAA records, SPF/DKIM/DMARC for email.
4. **Test before and after** - Query from multiple locations and resolvers.
5. **Document everything** - Every DNS record should have a comment or documentation.

## DNS Record Types

### A Record (IPv4 Address)

```
Maps a hostname to an IPv4 address.

example.com.        300   IN  A     93.184.216.34
www.example.com.    300   IN  A     93.184.216.34
api.example.com.    60    IN  A     10.0.1.10
api.example.com.    60    IN  A     10.0.1.11    # Multiple A records = round-robin
```

### AAAA Record (IPv6 Address)

```
Maps a hostname to an IPv6 address.

example.com.        300   IN  AAAA  2606:2800:220:1:248:1893:25c8:1946
www.example.com.    300   IN  AAAA  2606:2800:220:1:248:1893:25c8:1946
```

### CNAME Record (Canonical Name)

```
Alias one name to another. The target MUST be a hostname, not an IP.

www.example.com.        300   IN  CNAME  example.com.
blog.example.com.       300   IN  CNAME  mysite.wordpress.com.
status.example.com.     300   IN  CNAME  abc123.statuspage.io.

RULES:
  - CANNOT be used at zone apex (example.com. cannot be a CNAME)
  - CANNOT coexist with other record types for the same name
  - Adds an extra DNS lookup (performance cost)
  - Chain depth should be minimal (avoid CNAME -> CNAME -> CNAME)
```

### MX Record (Mail Exchange)

```
Directs email to mail servers. Lower priority number = higher preference.

example.com.    300   IN  MX  10  mail1.example.com.
example.com.    300   IN  MX  20  mail2.example.com.
example.com.    300   IN  MX  30  mail-backup.example.com.

Common hosted email configurations:
  # Google Workspace
  example.com.  300  IN  MX  1   ASPMX.L.GOOGLE.COM.
  example.com.  300  IN  MX  5   ALT1.ASPMX.L.GOOGLE.COM.
  example.com.  300  IN  MX  5   ALT2.ASPMX.L.GOOGLE.COM.
  example.com.  300  IN  MX  10  ALT3.ASPMX.L.GOOGLE.COM.
  example.com.  300  IN  MX  10  ALT4.ASPMX.L.GOOGLE.COM.

  # Microsoft 365
  example.com.  300  IN  MX  0   example-com.mail.protection.outlook.com.
```

### TXT Record (Text)

```
Stores arbitrary text. Commonly used for domain verification and email security.

# SPF (Sender Policy Framework) - Who can send email for your domain
example.com.    300   IN  TXT  "v=spf1 include:_spf.google.com include:mail.zendesk.com -all"

# DKIM (DomainKeys Identified Mail) - Email signature verification
google._domainkey.example.com.  300  IN  TXT  "v=DKIM1; k=rsa; p=MIGfMA0GCS..."

# DMARC (Domain-based Message Authentication)
_dmarc.example.com.  300  IN  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc@example.com; pct=100"

# Domain verification
example.com.    300   IN  TXT  "google-site-verification=abc123..."
example.com.    300   IN  TXT  "MS=ms12345678"
_acme-challenge.example.com.  300  IN  TXT  "LHDhK3oGRafAsSEF..."
```

### SRV Record (Service Locator)

```
Locates services by protocol. Format: _service._proto.name TTL IN SRV priority weight port target

_sip._tcp.example.com.     300  IN  SRV  10 60 5060 sip1.example.com.
_sip._tcp.example.com.     300  IN  SRV  10 40 5060 sip2.example.com.
_xmpp-server._tcp.example.com.  300  IN  SRV  5 0 5269 xmpp.example.com.
_caldav._tcp.example.com.  300  IN  SRV  0 0 443 caldav.example.com.
```

### CAA Record (Certification Authority Authorization)

```
Specifies which CAs are authorized to issue certificates for the domain.

example.com.    300   IN  CAA  0 issue "letsencrypt.org"
example.com.    300   IN  CAA  0 issue "amazonaws.com"
example.com.    300   IN  CAA  0 issuewild "letsencrypt.org"
example.com.    300   IN  CAA  0 iodef "mailto:security@example.com"

Flags:
  0 = Non-critical (CA may issue even if it doesn't understand the tag)
  128 = Critical (CA MUST NOT issue if it doesn't understand the tag)

Tags:
  issue       = Authorize CA for non-wildcard certs
  issuewild   = Authorize CA for wildcard certs
  iodef       = Report violations to this email/URL
```

### NS Record (Name Server)

```
Delegates a zone or subdomain to specific name servers.

example.com.        86400  IN  NS  ns1.example.com.
example.com.        86400  IN  NS  ns2.example.com.

# Delegate subdomain to different DNS provider
dev.example.com.    86400  IN  NS  ns1.dev-dns-provider.com.
dev.example.com.    86400  IN  NS  ns2.dev-dns-provider.com.
```

### SOA Record (Start of Authority)

## TTL Strategies

### TTL Decision Guide

```
Record Type / Use Case          Recommended TTL
---------------------------------------------
Static infrastructure (NS, MX)  86400 (24 hours) to 3600 (1 hour)
Normal A/AAAA records            300 (5 min) to 3600 (1 hour)
Load-balanced services           60 (1 min) to 300 (5 min)
Failover/health-checked          30 (30 sec) to 60 (1 min)
During planned migration         60 (1 min) - lower 24h before change
CDN CNAMEs                       300 (5 min) to 3600 (1 hour)
TXT verification (temporary)     300 (5 min) - raise or remove after
SPF/DKIM/DMARC                   3600 (1 hour)
CAA                              3600 (1 hour) to 86400 (24 hours)
```

### Migration TTL Workflow

```
Day -2:  Lower TTL from 3600 to 60 on records to be changed
Day -1:  Wait for old TTL to expire (old cached records flush)
Day 0:   Make the DNS change
         Monitor for issues
         Verify from multiple locations
Day +1:  If stable, raise TTL back to 3600
Day +7:  Final verification, document the change
```

## DNS Propagation

### How Propagation Works

```
1. You update a record at your authoritative DNS
2. Resolvers worldwide have the OLD record cached until TTL expires
3. As caches expire, resolvers query your authoritative DNS for the new record
4. "Propagation" is really "cache expiration across the internet"

Maximum propagation time = previous TTL value
If old TTL was 3600 (1 hour), full propagation takes up to 1 hour
If old TTL was 86400 (24 hours), full propagation takes up to 24 hours
```

### Verifying Propagation

```shell
# Query specific DNS resolvers
dig @8.8.8.8 example.com A           # Google Public DNS
dig @1.1.1.1 example.com A           # Cloudflare DNS
dig @9.9.9.9 example.com A           # Quad9 DNS
dig @208.67.222.222 example.com A    # OpenDNS

# Query authoritative nameserver directly
dig @ns1.example.com example.com A +norecurse

# Check from multiple geographic locations (use online tools)
# whatsmydns.net
# dnschecker.org
```

## DNSSEC

### Overview

```
DNSSEC adds cryptographic signatures to DNS records, preventing:
  - Cache poisoning (attacker injects false records)
  - Man-in-the-middle attacks on DNS
  - DNS spoofing

Chain of trust:
  Root (.) -> TLD (.com) -> Your zone (example.com)

Key types:
  KSK (Key Signing Key): Signs the DNSKEY records. Rotated infrequently.
  ZSK (Zone Signing Key): Signs all other records. Rotated regularly.

Records:
  DNSKEY: Contains the public keys
  RRSIG:  Contains signatures for each record set
  DS:     Delegation Signer (links parent to child zone)
  NSEC/NSEC3: Proves a name does NOT exist (prevents zone enumeration with NSEC3)
```

### Verifying DNSSEC

```shell
# Check if DNSSEC is enabled
dig example.com +dnssec +short

# Detailed DNSSEC validation
dig example.com DNSKEY +dnssec
dig example.com A +dnssec +cd    # Check for RRSIG

# Validate the chain
delv example.com A
# Output should show: "fully validated"

# Check DS record at parent
dig example.com DS @a.gtld-servers.net
```

## Split-Horizon DNS

```
Return different DNS responses based on the source of the query.

Use cases:
  - Internal vs external resolution (private IPs for internal, public for external)
  - Different servers for VPN users vs internet users
  - Geo-specific responses

Implementation (BIND example):
  view "internal" {
    match-clients { 10.0.0.0/8; 172.16.0.0/12; 192.168.0.0/16; };
    zone "example.com" {
      type master;
      file "zones/internal.example.com";
    };
  };

  view "external" {
    match-clients { any; };
    zone "example.com" {
      type master;
      file "zones/external.example.com";
    };
  };

Cloud DNS split-horizon:
  AWS Route 53:    Private hosted zones (associated with VPCs)
  GCP Cloud DNS:   Private zones (associated with VPC networks)
  Azure DNS:       Private DNS zones (linked to VNets)
```

## GeoDNS

```
Route users to the nearest server based on geographic location of the DNS resolver.

AWS Route 53 Geolocation Routing:
  US users      -> us-east-1 ALB
  EU users      -> eu-west-1 ALB
  Asia users    -> ap-southeast-1 ALB
  Default       -> us-east-1 ALB

AWS Route 53 Latency-Based Routing:
  Automatically routes to the region with lowest latency.
  More accurate than geolocation for performance optimization.

Cloudflare:
  Uses anycast + load balancing rules for geographic routing.

Implementation example (Route 53):
  api.example.com.  A  GEOLOCATION  continent=NA  -> 1.2.3.4 (US server)
  api.example.com.  A  GEOLOCATION  continent=EU  -> 5.6.7.8 (EU server)
  api.example.com.  A  GEOLOCATION  default       -> 1.2.3.4 (fallback)
```

## Failover DNS

```
Automatically switch to backup servers when primary is unhealthy.

AWS Route 53 Health Checks + Failover:
  Primary:   api.example.com -> 1.2.3.4 (health check: /health)
  Secondary: api.example.com -> 5.6.7.8 (failover target)

  If primary health check fails -> Route 53 returns secondary IP

Cloudflare Load Balancing:
  Pool A (primary):   server1.example.com, server2.example.com
  Pool B (fallback):  backup1.example.com
  Health check: HTTP GET /health every 60s
  Failover: If all origins in Pool A are unhealthy, use Pool B

Multi-CDN Failover:
  Primary:   Cloudflare (GeoDNS)
  Failover:  AWS CloudFront (if Cloudflare health check fails)
```

## Common DNS Providers

### Provider Comparison

```
| Provider         | GeoDNS | Failover | DNSSEC | API | Use Case |
|-----------------|--------|----------|--------|-----|----------|
| AWS Route 53    | Yes    | Yes      | Yes    | Yes | Full-featured, AWS integration |
| Cloudflare DNS  | Yes    | Yes      | Yes    | Yes | Fast, free tier, DDoS protection |
| Google Cloud DNS| Yes    | No*      | Yes    | Yes | GCP integration |
| Azure DNS       | Yes    | Yes*     | Yes    | Yes | Azure integration |
| NS1             | Yes    | Yes      | Yes    | Yes | Advanced traffic management |
| Dyn (Oracle)    | Yes    | Yes      | Yes    | Yes | Enterprise DNS |

* With additional services (Traffic Manager, Cloud Load Balancing)
```

### Provider-Specific CLI Commands

```shell
# AWS Route 53
aws route53 list-hosted-zones
aws route53 list-resource-record-sets --hosted-zone-id Z12345
aws route53 change-resource-record-sets --hosted-zone-id Z12345 \
  --change-batch file://change-batch.json

# Google Cloud DNS
gcloud dns managed-zones list
gcloud dns record-sets list --zone=my-zone
gcloud dns record-sets create api.example.com. \
  --zone=my-zone --type=A --ttl=300 --rrdatas="1.2.3.4"

# Cloudflare (via API)
HTTP client request -X GET "[reference URL]" \
  -H "Authorization: Bearer TOKEN"
```

## Email DNS Configuration

### Complete Email Security Setup

```
1. SPF Record:
   example.com.  TXT  "v=spf1 include:_spf.google.com include:sendgrid.net -all"

   Mechanisms:
     include:  Check another domain's SPF
     a:        Match domain's A record
     mx:       Match domain's MX records
     ip4:      Match IPv4 range
     -all:     Hard fail (reject non-matching)
     ~all:     Soft fail (mark as suspicious)

2. DKIM Record:
   google._domainkey.example.com.  TXT  "v=DKIM1; k=rsa; p=MIGfMA0..."
   (Generated by your email provider)

3. DMARC Record:
   _dmarc.example.com.  TXT  "v=DMARC1; p=reject; sp=reject; rua=mailto:dmarc-reports@example.com; ruf=mailto:dmarc-forensics@example.com; pct=100; adkim=s; aspf=s"

   p=none:     Monitor only (start here)
   p=quarantine: Mark as spam
   p=reject:    Reject entirely (goal)

4. MTA-STS (SMTP TLS enforcement):
   _mta-sts.example.com.  TXT  "v=STSv1; id=20240115"
   (Also requires hosting a policy file at mta-sts.example.com)

5. BIMI (Brand Indicators for Message Identification):
   default._bimi.example.com.  TXT  "v=BIMI1; l=[reference URL]"
```

## Troubleshooting

### dig Commands

```shell
# Basic query
dig example.com                        # A record (default)
dig example.com AAAA                   # IPv6 address
dig example.com MX                     # Mail servers
dig example.com TXT                    # Text records
dig example.com ANY                    # All records (may be blocked)

# Short output
dig +short example.com

# Trace the full resolution path
dig +trace example.com

# Query specific nameserver
dig @8.8.8.8 example.com

# Check authoritative nameservers
dig example.com NS

# ... (condensed) ...
dig @ns1.example.com example.com A +norecurse

# Verbose output with all sections
dig example.com +noall +answer +authority +additional

# Check if DNSSEC is enabled
dig example.com +dnssec
```

### Common DNS Problems

```
Problem: "DNS not resolving"
  1. Check authoritative NS: dig example.com NS
  2. Query authoritative directly: dig @ns1.provider.com example.com
  3. Check if record exists: dig example.com A +trace
  4. Check TTL: is the old record still cached?
  5. Check registrar NS delegation matches provider NS

Problem: "DNS changes not taking effect"
  1. Check current TTL: dig example.com A (look at TTL in answer)
  2. Query authoritative NS directly to confirm change is published
  3. Wait for TTL expiration on resolvers
  4. Flush local DNS cache:
     - macOS: sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
     - Windows: ipconfig /flushdns
     - Linux: systemd-resolve --flush-caches
  5. Test with different resolvers (8.8.8.8, 1.1.1.1)

Problem: "Email not being delivered"
  1. Check MX records: dig example.com MX
  2. Verify SPF: dig example.com TXT | grep spf
  3. Check DKIM: dig selector._domainkey.example.com TXT
  4. Check DMARC: dig _dmarc.example.com TXT
  5. Test with mail-tester.com or mxtoolbox.com

Problem: "SSL certificate issuance failing"
  1. Check CAA records: dig example.com CAA
  2. Verify ACME challenge: dig _acme-challenge.example.com TXT
  3. Check CNAME chain resolves: dig www.example.com +trace
  4. Ensure CAA allows the CA you are using
```

## Production Checklist

```
Core:
  [ ] A/AAAA records for all services
  [ ] CNAME for www -> apex (or vice versa with redirect)
  [ ] MX records configured and tested
  [ ] NS records match registrar delegation

Security:
  [ ] CAA records restrict certificate issuance
  [ ] SPF record configured (-all, not ~all for production)
  [ ] DKIM configured and verified
  [ ] DMARC policy set (start with p=none, work toward p=reject)
  [ ] DNSSEC enabled (if provider supports it)

Operational:
  [ ] TTLs appropriate for each record type
  [ ] Monitoring for DNS resolution (external health checks)
  [ ] Failover DNS configured for critical services
  [ ] DNS changes tested before and after
  [ ] All records documented (purpose, owner, date)
  [ ] Regular audit of stale/unused records
```

## When to Use

**Use this skill when:**
- Designing or implementing dns specialist solutions
- Reviewing or improving existing dns specialist approaches
- Making architectural or implementation decisions about dns specialist
- Learning dns specialist patterns and best practices
- Troubleshooting dns specialist-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Dns Specialist Analysis

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

**Input:** "Help me implement dns specialist for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended dns specialist approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When dns specialist must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
