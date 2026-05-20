---
name: penetration-tester
description: |
  Penetration testing methodology for authorized security testing covering OWASP Testing Guide, reconnaissance techniques, injection testing, XSS detection, CSRF testing, authentication bypass, privilege escalation, API security testing, and professional report formatting. For defensive and authorized testing purposes only.
  Use when the user asks about penetration tester, penetration tester best practices, or needs guidance on penetration tester implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security penetration-testing guide"
  category: "security"
  subcategory: "offensive-security"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Penetration Tester

## Overview

Penetration testing is the practice of testing a computer system, network, or web application to find security vulnerabilities that an attacker could exploit. This skill covers the methodology, tools, and techniques used in authorized penetration testing engagements. All techniques described here are for defensive purposes and must only be used with explicit written authorization from the system owner.

## IMPORTANT: Authorization and Scope

Before any testing begins:
1. Obtain written authorization (scope document / rules of engagement)
2. Define in-scope and out-of-scope targets
3. Define testing windows and communication channels
4. Establish emergency contacts and stop conditions
5. Agree on data handling and reporting requirements

## OWASP Testing Guide Methodology

### Testing Phases

```
Phase 1: Information Gathering (Passive Reconnaissance)
  -> Publicly available information
  -> No direct interaction with target systems

Phase 2: Configuration and Deploy Management Testing
  -> Infrastructure configuration review
  -> Application deployment review

Phase 3: Identity Management Testing
  -> User registration, provisioning, account enumeration

Phase 4: Authentication Testing
  -> Login mechanisms, credential management, session handling

Phase 5: Authorization Testing
  -> Access control, privilege escalation, IDOR

Phase 6: Session Management Testing
  -> Session tokens, cookies, timeout, fixation
# ... (condensed) ...
  -> TLS configuration, sensitive data exposure

Phase 10: Business Logic Testing
  -> Workflow bypass, abuse cases

Phase 11: Client-Side Testing
  -> DOM-based vulnerabilities, client-side storage
```

## Reconnaissance Techniques

### Passive Reconnaissance

```shell
# DNS enumeration
dig example.com ANY
dig example.com MX
dig example.com TXT
dig example.com NS

# Subdomain enumeration
subfinder -d example.com -all -o subdomains.txt
amass enum -passive -d example.com -o amass-results.txt

# Certificate transparency logs
# Search crt.shell-cmd for subdomains via their API

# WHOIS information
whois example.com

# Technology detection
whatweb [reference URL]
# Or use browser extensions: Wappalyzer, BuiltWith

# Search engine dorking (authorized scope only)
# site:example.com filetype:pdf
# site:example.com intitle:"index of"
# site:example.com inurl:admin
```

### Active Reconnaissance (With Authorization)

```shell
# Port scanning
nmap -sV -sC -p- -oA nmap-full target.example.com
# -sV: version detection
# -sC: default scripts
# -p-: all ports
# -oA: output all formats

# Web application discovery
nikto -h [reference URL] -o nikto-report.html -Format htm

# Directory and file brute-forcing
gobuster dir -u [reference URL] \
    -w [system-path] \
    -x php,asp,aspx,jsp,html,js,txt,json,xml \
    -o gobuster-results.txt \
    -t 50

# Alternative: feroxbuster (recursive, faster)
feroxbuster -u [reference URL] \
    -w [system-path] \
    --depth 3 \
    -o ferox-results.txt

# Spider/crawl the application
gospider -s [reference URL] -d 3 -c 10 -o spider-output
```

## Injection Testing

### SQL Injection

```
Manual testing methodology:

1. Identify injection points (parameters in URLs, forms, headers, cookies)

2. Test for errors:
   - Add single quote: param='
   - Add double quote: param="
   - Add SQL comment: param=value--
   - Boolean test: param=1 AND 1=1 vs param=1 AND 1=2

3. Determine database type from error messages:
   - MySQL errors mention "MySQL"
   - PostgreSQL errors reference "pg_" prefixed objects
   - MSSQL errors reference "mssql" or "Microsoft SQL"
   - Oracle errors reference "ORA-" prefixed codes

4. Test for UNION-based:
   - Determine column count: ORDER BY 1, ORDER BY 2, ...
   - Find visible columns: UNION SELECT NULL,NULL,'test',NULL,...
   - Extract data: UNION SELECT NULL,table_name,NULL
     FROM information_schema.tables

5. Test for blind SQLi:
   - Boolean-based: AND SUBSTRING(version(),1,1)='5'
   - Time-based: AND SLEEP(5) or AND pg_sleep(5)
```

```shell
# Automated SQL injection testing with sqlmap (authorized testing only)
sqlmap -u "[reference URL]" \
    --batch \
    --level=3 \
    --risk=2 \
    --threads=5 \
    --output-dir=./sqlmap-results \
    --forms \
    --crawl=2
```

### Command Injection

```
Test vectors for OS command injection:

Metacharacter injection:
  ; id
  | id
  || id
  & id
  && id
  $(id)

Blind command injection (time-based):
  ; sleep 10
  | sleep 10
  & ping -c 10 127.0.0.1 &

Out-of-band (requires controlled infrastructure):
  ; nslookup attacker-controlled.example.com
  ; HTTP client request [reference URL]

Common vulnerable patterns to look for:
  - File operations: filename, path parameters
  - Email: to, from, subject fields processed by mail utilities
  - DNS: hostname parameters
  - Network: IP address, port parameters
```

## XSS Detection

### Testing Methodology

```
Step 1: Identify reflection points
  - Submit unique string (e.g., "xss1234test") in every parameter
  - Search for reflection in response body, headers, JavaScript

Step 2: Determine context
  - HTML body: <div>REFLECTED_HERE</div>
  - HTML attribute: <input value="REFLECTED_HERE">
  - JavaScript string: var x = "REFLECTED_HERE";
  - URL: <a href="REFLECTED_HERE">
  - CSS: style="background: REFLECTED_HERE"

Step 3: Test appropriate payload for context

  HTML body context:
    <script>alert(document.domain)</script>
    <img src=x onerror=alert(document.domain)>
    <svg onload=alert(document.domain)>

  HTML attribute context (escape quote first):
    # ... (condensed) ...
    javascript:alert(document.domain)

Step 4: Test filter bypasses
  - Case variation: <ScRiPt>
  - Encoding: &#x3c;script&#x3e;
  - Event handlers: onerror, onload, onfocus
  - HTML5 tags: <details open ontoggle=alert(1)>
```

### DOM XSS

```
Vulnerable sources (where user input enters):
  - document.location, document.URL, document.referrer
  - window.name
  - document.cookie
  - localStorage/sessionStorage
  - Web messages (postMessage)

Vulnerable sinks (where input is used dangerously):
  - innerHTML, outerHTML
  - Dynamic code execution functions
  - setTimeout/setInterval with string arguments
  - location.href, location.assign()
  - jQuery .html(), .append(), .after(), .before()

Testing approach:
  Search JavaScript for source-to-sink data flows.
  Use browser DevTools to set breakpoints at sinks.
```

## CSRF Testing

```
Step 1: Identify state-changing requests (POST, PUT, DELETE)

Step 2: Check for CSRF protections:
  - CSRF token in form/header?
  - SameSite cookie attribute?
  - Custom header requirement?
  - Origin/Referer validation?

Step 3: If no protection, create proof-of-concept:
  - Auto-submitting HTML form targeting the vulnerable endpoint
  - Hidden form fields with attacker-controlled values
  - JavaScript to auto-submit on page load

Step 4: Test CSRF token validation:
  - Remove token entirely
  - Use empty token value
  - Use token from different session
  - Use token from different endpoint
  - Modify one character of valid token
  - Re-use expired token
```

## Authentication Bypass

```
Testing methodology:

1. Default credentials
   - admin/admin, admin/password, root/root
   - Test common vendor defaults

2. Brute force
   - Test rate limiting: 10, 50, 100 rapid attempts
   - Test account lockout threshold
   - Test with common password lists (top 1000)

3. Password reset flaws
   - Is reset token predictable?
   - Can token be reused?
   - Does token expire?
   - Is the token in the URL (leaked via Referer)?
   - Can you reset another user's password?
   - Race condition: request multiple tokens, use oldest

# ... (condensed) ...
5. JWT-specific tests
   - Change algorithm to "none"
   - Change algorithm from RS256 to HS256
   - Modify claims without re-signing
   - Use expired token
   - Test for key confusion attacks
   - Brute-force weak signing keys (use jwt_tool)
```

## Privilege Escalation

### Horizontal Privilege Escalation

```
Access another user's resources at the same privilege level:

1. IDOR testing:
   - Change numeric IDs: /api/users/123 -> output_file
   - Change UUIDs: /api/docs/abc-123 -> output_file
   - Change email parameters: user=victim@example.com

2. Parameter manipulation:
   - Add/modify user_id, account_id, org_id parameters
   - Modify cookie values containing user identifiers

3. API endpoint discovery:
   - Test undocumented endpoints
   - Test different HTTP methods (GET, POST, PUT, DELETE)
   - Test API versioning: /api/v1/ vs /api/v2/
```

### Vertical Privilege Escalation

```
Gain higher privilege level (user -> admin):

1. Role parameter manipulation:
   - Add role=admin to registration/profile update
   - Modify role in JWT claims
   - Change is_admin=false to is_admin=true

2. Forced browsing:
   - Access /admin, /dashboard, /management
   - Access admin API endpoints directly

3. HTTP method supersede:
   - X-HTTP-Method-Supersede: PUT
   - _method=DELETE in POST body

4. Mass assignment:
   - Include admin-only fields in requests
   - Add unexpected JSON keys that map to model fields
```

## API Security Testing

```
API-specific testing methodology:

1. Authentication:
   - Test endpoints without authentication
   - Test with expired tokens
   - Test rate limiting on auth endpoints

2. Authorization:
   - Test BOLA (Broken Object-Level Authorization)
   - Test BFLA (Broken Function-Level Authorization)
   - Test with different user roles

3. Input validation:
   - Test all parameters with injection payloads
   - Test with unexpected data types (string where int expected)
   - Test with excessively large values
   - Test with special characters and Unicode

4. Rate limiting:
   # ... (condensed) ...
   - Check verbose error messages
   - Check for sensitive data in responses
   - Check for internal IPs, paths, versions

6. Mass assignment:
   - Send extra fields in create/update requests
   - Test adding admin-level fields
```

```shell
# API testing with OWASP ZAP
docker run -t zaproxy/zap-stable zap-api-scan.py \
    -t [reference URL] \
    -f openapi

# Nuclei API templates
nuclei -u [reference URL] \
    -t http/exposed-panels/ \
    -t http/misconfiguration/ \
    -t http/default-logins/
```

## Report Format

### Executive Summary

```markdown
## Executive Summary

This penetration test was conducted against [Target Application]
from [Date] to [Date] under authorization from [Authorizer].

### Risk Distribution
- Critical: 2 findings
- High: 4 findings
- Medium: 6 findings
- Low: 3 findings
- Informational: 5 findings

### Key Findings
1. SQL injection allowing full database access (Critical)
2. Broken access control enabling cross-tenant data access (Critical)
3. Missing rate limiting enabling brute-force attacks (High)

### Overall Assessment
The application has significant security weaknesses that require
immediate attention. The critical findings allow an unauthenticated
attacker to access and modify all data in the system.
```

### Detailed Finding Format

```markdown
### Finding: SQL Injection in Search Endpoint

**ID**: PT-2024-001
**Severity**: Critical
**CVSS 3.1**: 9.8 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)
**CWE**: CWE-89 (SQL Injection)
**OWASP**: A03:2021 - Injection

#### Description
The search parameter at /api/v2/search is vulnerable to SQL injection.
User input is directly concatenated into a SQL query without
sanitization or parameterization.

#### Steps to Reproduce
1. Navigate to the search functionality
2. Enter the injection payload in the search field
3. Submit the search request
4. Observe database information in the response

# ... (condensed) ...
2. Implement input validation (allowlist approach)
3. Apply principle of least privilege to database accounts
4. Enable WAF rules for SQL injection detection

#### References
- [reference URL]
- OWASP SQL Injection Prevention Cheat Sheet
```

## Testing Tools Reference

| Tool | Purpose | Type |
|------|---------|------|
| Burp Suite | Web proxy, scanner, manual testing | DAST |
| OWASP ZAP | Free web proxy and scanner | DAST |
| Nmap | Port scanning, service detection | Network |
| Nuclei | Template-based vulnerability scanning | DAST |
| sqlmap | SQL injection detection and exploitation | Injection |

## Ethical Considerations

- Never test systems without explicit written authorization
- Report all findings to the system owner immediately
- Handle discovered data with appropriate confidentiality
- Do not cause unnecessary disruption to production systems
- Follow responsible disclosure practices
- Maintain detailed logs of all testing activities
- Respect scope boundaries at all times

## When to Use

**Use this skill when:**
- Designing or implementing penetration tester solutions
- Reviewing or improving existing penetration tester approaches
- Making architectural or implementation decisions about penetration tester
- Learning penetration tester patterns and best practices
- Troubleshooting penetration tester-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Penetration Tester Analysis

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

**Input:** "Help me implement penetration tester for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended penetration tester approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When penetration tester must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
