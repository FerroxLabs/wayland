---
name: waf-configurer
description: |
  Web Application Firewall configuration expertise covering OWASP Core Rule Set design, rate limiting rules, geo-blocking, bot detection, custom rules for application-specific attacks, logging and monitoring, false positive management, and WAF bypass prevention for protecting web applications at the network edge.
  Use when the user asks about waf configurer, waf configurer best practices, or needs guidance on waf configurer implementation.
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
  difficulty: "advanced"
---

# WAF Configurer

## Overview

A Web Application Firewall (WAF) inspects HTTP/HTTPS traffic between clients and web applications, blocking malicious requests based on a set of rules. A WAF operates at Layer 7 (application layer) and provides defense-in-depth against injection attacks, XSS, and other web threats. This skill covers the configuration, tuning, and maintenance of WAFs in production.

## WAF Architecture

```
Client -> CDN/Edge -> WAF -> Load Balancer -> Application
                      |
                      +-> Block/Allow/Challenge
                      +-> Log all decisions
                      +-> Rate limiting
                      +-> Bot detection

WAF Processing Pipeline:
1. IP Reputation check
2. Geo-blocking rules
3. Rate limiting
4. Bot detection
5. OWASP Core Rule Set
6. Custom application rules
7. Allow/block decision
8. Logging
```

## OWASP Core Rule Set (CRS)

The OWASP ModSecurity Core Rule Set is the industry-standard set of generic attack detection rules for WAFs.

### CRS Rule Categories

```
REQUEST RULES:
  910xxx - Scanner detection
  911xxx - Method enforcement
  913xxx - Scanner/bot detection
  920xxx - Protocol violations
  921xxx - HTTP protocol attack
  930xxx - Local file inclusion (LFI)
  931xxx - Remote file inclusion (RFI)
  932xxx - Remote code execution
  933xxx - PHP injection
  934xxx - Node.js injection
  941xxx - XSS attacks
  942xxx - SQL injection
  943xxx - Session fixation
  944xxx - Java attacks

RESPONSE RULES:
  950xxx - Data leakage
  951xxx - SQL error messages
  952xxx - Java errors
  953xxx - PHP errors
  954xxx - IIS errors
```

### CRS Configuration

```nginx
# ModSecurity with OWASP CRS (Nginx)

# Enable ModSecurity
modsecurity on;
modsecurity_rules_file [system-path]

# Load OWASP CRS
Include [system-path]
Include [system-path]
```

```apache
# modsecurity.conf - Core settings
SecRuleEngine On                    # Enable rule processing
SecRequestBodyAccess On             # Inspect request bodies
SecResponseBodyAccess On            # Inspect response bodies
SecRequestBodyLimit 13107200        # 12.5 MB max request body
SecRequestBodyNoFilesLimit 131072   # 128 KB max without files

# Anomaly scoring mode (recommended over blocking mode)
# Each rule adds to an anomaly score
# Request is blocked only when total score exceeds threshold
SecAction "id:900110,phase:1,pass,t:none,\
    setvar:tx.inbound_anomaly_score_threshold=5,\
    setvar:tx.outbound_anomaly_score_threshold=4"

# Paranoia level (1=low FP, 4=maximum detection)
SecAction "id:900000,phase:1,pass,t:none,\
    setvar:tx.paranoia_level=2"
```

### Paranoia Level Selection

| Level | Description | False Positives | Detection | Use Case |
|-------|-------------|-----------------|-----------|----------|
| PL1 | Basic protection | Very low | Moderate | Default, most applications |
| PL2 | Elevated | Low-moderate | Good | Applications handling sensitive data |
| PL3 | Strict | Moderate-high | Very good | High-security applications |
| PL4 | Maximum | High | Maximum | Requires extensive tuning |

## Rate Limiting Rules

### AWS WAF Rate Limiting

```json
{
    "Name": "RateLimitLoginEndpoint",
    "Priority": 1,
    "Statement": {
        "RateBasedStatement": {
            "Limit": 100,
            "AggregateKeyType": "IP",
            "ScopeDownStatement": {
                "AndStatement": {
                    "Statements": [
                        {
                            "ByteMatchStatement": {
                                "FieldToMatch": {"UriPath": {}},
                                "PositionalConstraint": "STARTS_WITH",
                                # ... (condensed) ...
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "RateLimitLogin"
    }
}
```

### Rate Limiting Strategy

```yaml
rate_limits:
  # Authentication endpoints (most restrictive)
  login:
    path: /api/login
    method: POST
    limit: 5 requests per minute per IP
    action: block for 15 minutes
    alert: after 3 blocks from same IP

  password_reset:
    path: /api/password-reset
    method: POST
    limit: 3 requests per hour per IP
    action: block for 1 hour
# ... (condensed) ...

  # Global fallback
  global:
    limit: 2000 requests per minute per IP
    action: CAPTCHA challenge at 2000, block at 5000
```

## Geo-Blocking

```json
{
    "Name": "GeoBlockRule",
    "Priority": 0,
    "Statement": {
        "GeoMatchStatement": {
            "CountryCodes": ["CN", "RU", "KP", "IR"]
        }
    },
    "Action": {"Block": {}},
    "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "GeoBlock"
    }
}
```

```yaml
# Geo-blocking strategy decision matrix
geo_policy:
  # Option 1: Allowlist (strictest)
  # Only allow traffic from countries where you have customers
  allow_only: [US, CA, GB, DE, FR, AU, JP]
  action_for_others: block

  # Option 2: Blocklist (permissive)
  # Block traffic from high-risk countries
  block: [specific_countries_based_on_threat_intel]
  action: block

  # Option 3: Challenge (balanced)
  # Challenge traffic from certain regions with CAPTCHA
  challenge: [regions_with_elevated_risk]
  action: CAPTCHA

  # Exceptions
  exceptions:
    - vpn_ranges: allow  # Known corporate VPN ranges
    - monitoring: allow   # Uptime monitoring services
```

## Bot Detection

```yaml
# Bot classification and response strategy

bot_categories:
  verified_good_bots:
    examples: [Googlebot, Bingbot, Monitoring services]
    detection: Reverse DNS verification
    action: allow
    note: "Verify IP belongs to claimed bot via rDNS"

  unverified_good_bots:
    examples: [SEO tools, research crawlers]
    detection: User-Agent string
    action: rate_limit (100 req/min)

  # ... (condensed) ...
  - technical_anomalies:
      - TLS fingerprint mismatch (JA3/JA4 fingerprinting)
      - missing standard browser headers
      - unusual Accept-Language patterns
      - HTTP/1.0 in modern context
```

### AWS WAF Bot Control

```json
{
    "Name": "BotControl",
    "Priority": 2,
    "Statement": {
        "ManagedRuleGroupStatement": {
            "VendorName": "AWS",
            "Name": "AWSManagedRulesBotControlRuleSet",
            "ManagedRuleGroupConfigs": [
                {
                    "AWSManagedRulesBotControlRuleSet": {
                        "InspectionLevel": "TARGETED"
                    }
                }
            ],
            # ... (condensed) ...
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "BotControl"
    }
}
```

## Custom Rules for Application-Specific Attacks

### SQL Injection Custom Rules

```json
{
    "Name": "SQLInjectionRule",
    "Priority": 10,
    "Statement": {
        "OrStatement": {
            "Statements": [
                {
                    "SqliMatchStatement": {
                        "FieldToMatch": {"QueryString": {}},
                        "TextTransformations": [
                            {"Priority": 0, "Type": "URL_DECODE"},
                            {"Priority": 1, "Type": "HTML_ENTITY_DECODE"},
                            {"Priority": 2, "Type": "LOWERCASE"}
                        ]
                    # ... (condensed) ...
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "SQLInjection"
    }
}
```

### Custom Business Logic Protection

```yaml
# Application-specific rules

custom_rules:
  # Prevent account enumeration via timing
  - name: AccountEnumerationProtection
    condition: "POST /api/login returns 401 in < 50ms"
    action: "Add random delay 200-500ms to all login responses"

  # Prevent parameter tampering on pricing
  - name: PriceTamperingProtection
    condition: "POST /api/checkout with price != server-side price"
    action: block
    log: alert

  # ... (condensed) ...
    conditions:
      - content_type: not in [image/jpeg, image/png, application/pdf]
      - file_size: > 10MB
      - file_extension: in [exe, bat, shell-cmd, ps1, cmd, php, jsp]
    action: block
```

## Logging and Monitoring

### WAF Log Structure

```json
{
    "timestamp": "2024-06-15T10:30:45.123Z",
    "formatVersion": 1,
    "webaclId": "arn:aws:wafv2:...",
    "action": "BLOCK",
    "httpRequest": {
        "clientIp": "203.0.113.42",
        "country": "US",
        "uri": "/api/search",
        "httpMethod": "GET",
        "headers": [
            {"name": "User-Agent", "value": "Mozilla/5.0..."},
            {"name": "Host", "value": "api.example.com"}
        ],
        # ... (condensed) ...
    ],
    "terminatingRuleId": "SQLi_QUERYSTRING",
    "terminatingRuleType": "MANAGED_RULE_GROUP",
    "labels": ["awswaf:managed:aws:sql-database:SQLi_QueryString"]
}
```

### Monitoring Dashboards

```yaml
waf_dashboard_metrics:
  # Overview
  - total_requests_per_minute
  - blocked_requests_per_minute
  - block_rate_percentage

  # By rule group
  - blocks_by_rule_group:
      - SQLi rules
      - XSS rules
      - Bot control
      - Rate limiting
      - Custom rules
      - Geo-blocking
# ... (condensed) ...
  - alert_on:
      - block_rate > 10%: "Possible attack or misconfiguration"
      - block_rate < 0.1%: "WAF may not be effective"
      - single_ip_blocked > 1000/hour: "Targeted attack"
      - new_rule_blocks > 100/hour: "New rule may have false positives"
```

## False Positive Management

### Detection and Tuning Process

```
1. Deploy WAF in DETECTION mode (log only, do not block)
2. Analyze logs for 1-2 weeks in production
3. Identify false positives (legitimate traffic being flagged)
4. Create rule exclusions for false positives
5. Switch to BLOCKING mode
6. Monitor continuously for new false positives
7. Review exclusions quarterly
```

### Rule Exclusions

```apache
# ModSecurity: Exclude specific rules for specific URLs

# False positive: CMS editor sends HTML that triggers XSS rules
SecRule REQUEST_URI "@beginsWith /admin/editor" \
    "id:1001,phase:1,pass,nolog,\
    ctl:ruleRemoveById=941100-941999"

# False positive: JSON API body triggers SQL injection rules
SecRule REQUEST_URI "@beginsWith /api/v2/query" \
    "id:1002,phase:1,pass,nolog,\
    ctl:ruleRemoveTargetById=942100;ARGS:query"

# False positive: File upload triggers LFI rules
SecRule REQUEST_URI "@beginsWith /api/upload" \
    "id:1003,phase:1,pass,nolog,\
    ctl:ruleRemoveById=930100-930199"
```

```json
// AWS WAF: Rule exclusions
{
    "Name": "CRSExclusions",
    "Priority": 5,
    "Statement": {
        "ManagedRuleGroupStatement": {
            "VendorName": "AWS",
            "Name": "AWSManagedRulesCommonRuleSet",
            "ExcludedRules": [
                {"Name": "SizeRestrictions_BODY"},
                {"Name": "CrossSiteScripting_BODY"}
            ],
            "ScopeDownStatement": {
                "ByteMatchStatement": {
                    # ... (condensed) ...
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "CRSExclusions"
    }
}
```

### False Positive Documentation

```yaml
false_positive_record:
  id: FP-2024-042
  date_discovered: 2024-06-15
  rule_id: 942100
  rule_name: SQL Injection Detection via Libinjection
  affected_endpoint: POST /api/v2/analytics/query
  description: >
    Analytics query endpoint accepts SQL-like syntax in the
    query parameter for user-defined reports. This triggers
    SQL injection detection rules.
  sample_request: >
    POST /api/v2/analytics/query
    {"query": "SELECT count(*) FROM events WHERE date > '2024-01-01'"}
  risk_assessment: >
    # ... (condensed) ...
    Excluded rule 942100 for ARGS:query on /api/v2/analytics/query.
    The endpoint has its own input validation and query parameterization.
  reviewed_by: security-team
  review_date: 2024-06-16
  next_review: 2024-09-16
```

## WAF Bypass Prevention

### Common Bypass Techniques to Defend Against

```yaml
bypass_prevention:
  encoding_bypass:
    attack: "Encode payload to evade pattern matching"
    examples:
      - URL encoding: "%27%20OR%201%3D1--"
      - Double URL encoding: "%2527%2520OR%25201%253D1--"
      - Unicode: "\u0027 OR 1=1--"
      - HTML entities: "&#39; OR 1=1--"
    defense: "Apply multiple text transformations before rule evaluation"

  case_variation:
    attack: "Mix case to bypass case-sensitive rules"
    examples:
      - "<ScRiPt>alert(1)</sCrIpT>"
      # ... (condensed) ...
    defense: "Reassemble full request before inspection"

  http_parameter_pollution:
    attack: "Duplicate parameters: ?id=1&id=2;DROP TABLE users"
    defense: "Inspect all parameter values, not just first/last"
```

## WAF Deployment Best Practices

1. **Start in detection mode**: Log everything, block nothing for 2+ weeks
2. **Tune before blocking**: Analyze logs, create exclusions for legitimate traffic
3. **Layer rules in priority order**: IP reputation -> geo -> rate limit -> CRS -> custom
4. **Monitor block rates**: Too high = false positives; too low = rules not effective
5. **Test with each deployment**: Application changes may trigger new false positives
6. **Keep rules updated**: Update CRS regularly, review custom rules quarterly
7. **Do not rely on WAF alone**: WAF is defense-in-depth, not a replacement for secure code
8. **Log everything**: Full request logging for forensics and tuning
9. **Automate responses**: Auto-block IPs with sustained attack patterns
10. **Regular penetration testing**: Verify WAF effectiveness with authorized testing

## When to Use

**Use this skill when:**
- Designing or implementing waf configurer solutions
- Reviewing or improving existing waf configurer approaches
- Making architectural or implementation decisions about waf configurer
- Learning waf configurer patterns and best practices
- Troubleshooting waf configurer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Waf Configurer Analysis

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

**Input:** "Help me implement waf configurer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended waf configurer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When waf configurer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
