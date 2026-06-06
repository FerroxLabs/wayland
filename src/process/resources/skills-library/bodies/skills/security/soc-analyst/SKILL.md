---
name: soc-analyst
description: |
  Security operations center expertise covering SIEM query writing, alert triage workflows, incident investigation procedures, IOC analysis, threat hunting techniques, playbook design, log analysis patterns, Splunk and Elastic SIEM queries, alert fatigue reduction, escalation procedures, and shift handoff practices.
  Use when the user asks about soc analyst, soc analyst best practices, or needs guidance on soc analyst implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security forensics guide"
  category: "security"
  subcategory: "incident-response"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# SOC Analyst

## Overview

Security Operations Center (SOC) analysts are the front line of defense, monitoring security events, triaging alerts, investigating potential incidents, and coordinating response. This skill covers the practical day-to-day work of SOC operations: writing detection rules, investigating alerts efficiently, analyzing indicators of compromise, building playbooks, and maintaining operational effectiveness.

## Alert Triage Framework

### Triage Decision Flow

```
Alert Received
  |
  v
1. Is this a known false positive? ----YES----> Update tuning rule, close
  |NO
  v
2. Does alert have sufficient context? ---NO---> Enrich (lookup IP, hash, user)
  |YES
  v
3. Severity assessment:
   - What asset is affected? (Crown jewel? User workstation?)
   - What's the potential impact? (Data loss? Lateral movement?)
   - Is this correlated with other alerts?
  |
  v
4. Initial classification:
   [True Positive]    -> Investigate, escalate if needed
   [Benign True Pos]  -> Document, close (legit admin activity)
   [False Positive]    -> Tune detection rule, close
   [Suspicious]        -> Investigate further (15 min timebox)
```

### Alert Priority Matrix

```
                        Asset Criticality
                   Low        Medium       High
              +-----------+-----------+-----------+
   High       |  Medium   |   High    | Critical  |
              +-----------+-----------+-----------+
Threat  Med   |    Low    |  Medium   |   High    |
Level         +-----------+-----------+-----------+
   Low        | Informational |  Low  |  Medium   |
              +-----------+-----------+-----------+

Response SLAs:
  Critical:      15 min initial response, continuous investigation
  High:          30 min initial response
  Medium:        4 hours initial response
  Low:           Next business day
  Informational: Logged, reviewed in weekly analysis
```

## SIEM Query Patterns

### Splunk SPL Queries

```spl
# Brute force detection: 10+ failed logins in 5 minutes
index=auth sourcetype=windows:security EventCode=4625
| bin _time span=5m
| stats count as failed_attempts dc(TargetUserName) as targeted_users
  values(TargetUserName) as users by src_ip _time
| where failed_attempts >= 10
| sort -failed_attempts

# Lateral movement: RDP to multiple hosts
index=auth sourcetype=windows:security EventCode=4624 Logon_Type=10
| bin _time span=1h
| stats dc(dest) as unique_hosts values(dest) as destinations by src_ip user _time
| where unique_hosts >= 5
| sort -unique_hosts

# Data exfiltration: Large outbound transfers
index=firewall action=allowed direction=outbound
| stats sum(bytes_out) as total_bytes by src_ip dest_ip
| where total_bytes > 1073741824
| evaluate total_gb = round(total_bytes / 1073741824, 2)
| sort -total_gb

# Suspicious PowerShell: Encoded commands
index=windows sourcetype=windows:security EventCode=4688
| search (New_Process_Name="*powershell*" OR New_Process_Name="*pwsh*")
  AND (Process_Command_Line="*-enc*" OR Process_Command_Line="*-EncodedCommand*"
       OR Process_Command_Line="*FromBase64*" OR Process_Command_Line="*downloadstring*")
| table _time ComputerName Account_Name New_Process_Name Process_Command_Line

# Impossible travel: Login from distant locations within short time
index=auth action=success
| iplocation src_ip
| sort user _time
| streamstats current=f last(lat) as prev_lat last(lon) as prev_lon
  last(_time) as prev_time by user
| evaluate distance_km = round(acos(sin(lat*pi()/180)*sin(prev_lat*pi()/180)
  + cos(lat*pi()/180)*cos(prev_lat*pi()/180)*cos((lon-prev_lon)*pi()/180))
  * 6371, 0)
| evaluate time_diff_hours = round((_time - prev_time) / 3600, 2)
| evaluate speed_kmh = if(time_diff_hours > 0, round(distance_km / time_diff_hours, 0), 0)
| where speed_kmh > 1000 AND distance_km > 500
| table _time user src_ip City Country prev_lat prev_lon distance_km time_diff_hours speed_kmh
```

### Elastic/KQL Queries

```kql
# Failed authentication spike
event.category: "authentication" AND event.outcome: "failure"
| stats count() by source.ip, user.name
| where count > 20

# Suspicious process execution
process.name: ("powershell.exe" or "cmd.exe" or "wscript.exe")
  AND process.args: ("*-enc*" or "*bypass*" or "*hidden*" or "*downloadstring*")
  AND NOT process.parent.name: ("explorer.exe" or "svchost.exe")

# DNS queries to newly registered domains
dns.question.name: * AND NOT dns.response_code: "NXDOMAIN"
| lookup dns.question.name in newly_registered_domains.csv
| where match = true

# Outbound connections to threat intel IPs
destination.ip: * AND event.action: "connection_attempted"
| lookup destination.ip in threat_intel_ips.csv on ip
| where threat_category IS NOT NULL
| table @timestamp source.ip destination.ip threat_category confidence
```

## IOC Analysis

### IOC Investigation Workflow

```python
class IOCAnalyzer:
    """Structured IOC analysis and enrichment."""

    def analyze_ip(self, ip_address: str) -> dict:
        """Full analysis of a suspicious IP address."""
        result = {
            'ip': ip_address,
            'checks': {}
        }

        # 1. Geolocation
        result['checks']['geolocation'] = self.geoip_lookup(ip_address)

        # 2. Threat intelligence feeds
        result['checks']['virustotal'] = self.query_virustotal(ip_address)
        result['checks']['abuseipdb'] = self.query_abuseipdb(ip_address)
        result['checks']['otx'] = self.query_alienvault_otx(ip_address)

        # 3. Reverse DNS
        result['checks']['rdns'] = self.reverse_dns(ip_address)

        # 4. ASN information
        result['checks']['asn'] = self.asn_lookup(ip_address)

        # 5. Historical connections in SIEM
        result['checks']['siem_history'] = self.siem_query(
            f'dest_ip="{ip_address}" | stats count by src_ip action | head 20'
        )

        # 6. Reputation scoring
        result['risk_score'] = self._calculate_risk_score(result['checks'])
        result['recommendation'] = self._recommend_action(result['risk_score'])

        return result

    def analyze_hash(self, file_hash: str) -> dict:
        """Analyze a file hash (MD5/SHA1/SHA256)."""
        return {
            'hash': file_hash,
            'virustotal': self.vt_file_report(file_hash),
            'malware_bazaar': self.query_malware_bazaar(file_hash),
            'any_run': self.query_any_run(file_hash),
            'internal_seen': self.search_edr(f'file_hash:{file_hash}'),
        }

    def analyze_domain(self, domain: str) -> dict:
        """Analyze a suspicious domain."""
        return {
            'domain': domain,
            'whois': self.whois_lookup(domain),
            'dns_records': self.dns_resolve(domain),
            'certificate': self.cert_transparency(domain),
            'age_days': self.domain_age(domain),
            'virustotal': self.vt_domain_report(domain),
            'urlhaus': self.query_urlhaus(domain),
            'typosquat_check': self.check_typosquat(domain),
        }

    def _calculate_risk_score(self, checks: dict) -> int:
        """0-100 risk score based on enrichment results."""
        score = 0
        if checks.get('virustotal', {}).get('malicious', 0) > 3:
            score += 40
        if checks.get('abuseipdb', {}).get('confidence_score', 0) > 50:
            score += 30
        if checks.get('geolocation', {}).get('country') in HIGH_RISK_COUNTRIES:
            score += 15
        if checks.get('asn', {}).get('name') in KNOWN_BULLETPROOF_HOSTING:
            score += 15
        return min(100, score)
```

### IOC Pivoting Techniques

```
Starting IOC: Malicious IP 185.x.x.x
  |
  +-> Reverse DNS -> suspicious-domain.xyz
  |     +-> WHOIS -> registrant email: evil@protonmail.com
  |     |     +-> Reverse WHOIS -> 12 other domains by same registrant
  |     +-> Passive DNS -> other IPs hosting this domain
  |     +-> Certificate transparency -> wildcard cert, other subdomains
  |
  +-> SIEM: Which internal hosts connected?
  |     +-> host-a.internal connected 50 times in 24h
  |     |     +-> EDR: What process made connections? -> chrome.exe (suspicious)
  |     |     +-> What else did chrome.exe do? -> Dropped payload to %TEMP%
  |     |     +-> File hash of payload -> VirusTotal: Known malware family X
  |     +-> host-b.internal connected once -> likely automated scan, low risk
  |
  +-> Threat Intel: Known C2 for APT group Y
        +-> Check for other known IOCs from APT group Y
        +-> Review TTPs associated with this group
```

## Playbook Design

### Phishing Investigation Playbook

```yaml
playbook:
  name: Phishing Email Investigation
  id: PB-PHISH-001
  severity: medium
  estimated_time: 30 minutes
  trigger: "User-reported phishing or email security alert"

  steps:
    - step: 1
      action: "Collect email artifacts"
      details:
        - "Get original email (EML format, not screenshot)"
        - "Extract: sender, reply-to, return-path, X-headers"
        - "Extract: all URLs (hover, don't click)"
        - "Extract: attachment hashes (SHA256)"
        - "Note: receiving time, number of recipients"
      automation: "SOAR: auto-extract IOCs from reported email"

    - step: 2
      action: "Analyze sender"
      details:
        - "Check SPF/DKIM/DMARC authentication results"
        - "Verify sender domain age and reputation"
        - "Compare envelope sender vs display name"
        - "Check if domain is typosquat of known brand"
      decision:
        spoofed: "Continue to step 3, mark as confirmed phishing"
        legitimate: "May be compromised account, check step 3"

    - step: 3
      action: "Analyze payload"
      details:
        - "URLs: Expand shortened URLs, check against threat intel"
        - "URLs: Screenshot with urlscan.io (DO NOT visit directly)"
        - "Attachments: Submit hash to VT, run in sandbox"
        - "Check for credential harvesting page"
      decision:
        malicious: "Escalate to step 4 immediately"
        suspicious: "Continue analysis with 15 min timebox"
        benign: "Close as spam/marketing, update user"

    - step: 4
      action: "Scope the impact"
      details:
        - "Search email gateway: How many recipients got this email?"
        - "Check proxy/DNS logs: Did anyone click the URL?"
        - "Check EDR: Did anyone open the attachment?"
        - "Check auth logs: Any credential use from phishing IP?"
      automation: "SOAR: auto-search email gateway for message-id"

    - step: 5
      action: "Contain"
      details:
        - "Block sender domain in email gateway"
        - "Block malicious URLs in proxy/DNS"
        - "Delete email from all mailboxes (admin purge)"
        - "If credentials compromised: force password reset + revoke sessions"
        - "If malware executed: isolate endpoint, trigger IR playbook"

    - step: 6
      action: "Document and close"
      details:
        - "Record all IOCs in threat intel platform"
        - "Update detection rules if new pattern found"
        - "Notify affected users"
        - "Log investigation in case management"
```

## Alert Fatigue Reduction

### Tuning Strategies

```yaml
tuning_approach:
  1_baseline_false_positives:
    - "Track false positive rate per detection rule for 2 weeks"
    - "Rules with > 80% FP rate: immediate tuning or disable"
    - "Rules with 50-80% FP rate: add exclusions or context"
    - "Target: < 20% FP rate per rule"

  2_context_enrichment:
    - "Add asset criticality to alerts (crown jewel vs dev box)"
    - "Add user context (admin vs regular, VPN vs office)"
    - "Add historical baseline (normal for this user/host?)"
    - "Auto-close alerts that match known benign patterns"

  3_alert_correlation:
    - "Correlate related alerts into single incident"
    - "Example: failed logins + successful login + privilege escalation = one case"
    - "Reduce 50 alerts to 1 actionable investigation"

  4_tiered_response:
    - "Tier 1: Automated response (SOAR) for known patterns"
    - "Tier 2: Junior analyst for low-medium alerts with runbook"
    - "Tier 3: Senior analyst for complex/high-severity only"
    - "Goal: 70% automated, 20% tier 2, 10% tier 3"

  5_detection_engineering:
    - "Review top 10 noisiest rules monthly"
    - "Replace signature-based with behavioral detections"
    - "Implement detection-as-code (version controlled rules)"
    - "A/B test detection rules before production deployment"
```

## Threat Hunting

### Hypothesis-Driven Hunting

```yaml
hunt:
  name: "Living Off the Land Binary (LOLBin) Usage"
  hypothesis: >
    Attackers may be using legitimate Windows binaries to download
    and execute malicious payloads, bypassing endpoint protection.
  data_sources:
    - Windows Security Event Logs (4688)
    - Sysmon Process Creation (Event 1)
    - EDR telemetry
  timeframe: "Last 30 days"

  queries:
    certutil_download:
      description: "certutil.exe used to download files"
      spl: |
        index=windows (process_name=certutil.exe OR original_file_name=CertUtil.exe)
        AND (command_line="*urlcache*" OR command_line="*verifyctl*"
             OR command_line="*-decode*")
        | stats count by Computer user command_line
        | sort -count

    mshta_execution:
      description: "mshta.exe executing remote content"
      spl: |
        index=windows process_name=mshta.exe
        AND (command_line="*http*" OR command_line="*javascript*"
             OR command_line="*vbscript*")
        | table _time Computer user parent_process command_line

    rundll32_unusual:
      description: "rundll32.exe with unusual DLL paths"
      spl: |
        index=windows process_name=rundll32.exe
        | where NOT match(command_line, "(?i)(shell32|setupapi|advpack|syssetup)")
        | stats count by Computer user command_line
        | where count < 5

  analysis_steps:
    - "Review results for anomalous command-line patterns"
    - "Correlate with known LOLBin techniques from LOLBAS project"
    - "Check parent process chain for suspicious ancestry"
    - "Pivot on user accounts and machines for additional activity"
    - "If finding confirmed: create detection rule and document TTP"
```

## Shift Handoff Template

```yaml
shift_handoff:
  date: "2024-06-15"
  outgoing_shift: "Day shift (08:00-16:00)"
  incoming_shift: "Evening shift (16:00-00:00)"
  analyst: "Jane Smith"

  active_incidents:
    - id: INC-2024-0892
      severity: high
      summary: "Possible credential stuffing against customer portal"
      status: "Investigating - waiting for WAF logs from vendor"
      next_steps: "Review WAF logs when received, correlate with auth failures"
      escalated_to: "Incident Commander (Bob)"

  open_investigations:
    - alert_id: ALT-45892
      summary: "Unusual PowerShell activity on FINANCE-SRV-01"
      status: "Gathering additional EDR data"
      priority: medium
      context: "Finance team confirmed no planned maintenance"

  notable_events:
    - "Microsoft released out-of-band patch for CVE-2024-XXXXX (critical RCE)"
    - "New phishing campaign targeting our industry reported by FS-ISAC"
    - "Scheduled maintenance on SIEM cluster tonight 22:00-23:00"

  metrics:
    alerts_received: 142
    alerts_closed: 128
    incidents_opened: 2
    incidents_closed: 1
    average_triage_time: "4.2 minutes"

  action_items_for_next_shift:
    - "Follow up on INC-2024-0892 WAF logs"
    - "Review overnight scan results from vulnerability assessment"
    - "Check if phishing IOCs from FS-ISAC alert appear in our logs"
```

## When to Use

**Use this skill when:**
- Designing or implementing soc analyst solutions
- Reviewing or improving existing soc analyst approaches
- Making architectural or implementation decisions about soc analyst
- Learning soc analyst patterns and best practices
- Troubleshooting soc analyst-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Soc Analyst Analysis

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

**Input:** "Help me implement soc analyst for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended soc analyst approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When soc analyst must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
