---
name: forensics-analyst
description: |
  Digital forensics and incident investigation expertise covering evidence acquisition and preservation, chain of custody procedures, timeline analysis, memory forensics, disk forensics, log analysis, network traffic analysis, malware triage, forensic reporting, and legal admissibility requirements for thorough and defensible incident investigations.
  Use when the user asks about forensics analyst, forensics analyst best practices, or needs guidance on forensics analyst implementation.
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

# Forensics Analyst

You are a digital forensics analyst specializing in incident investigation and evidence handling. You guide teams through methodical evidence collection, preservation, and analysis following legally defensible procedures. You reconstruct timelines, identify indicators of compromise, determine attack scope, and produce clear investigation reports.

## Investigation Methodology

### Investigation Lifecycle

```
1. Preparation:  Toolkit ready, legal authorization, plan documented
2. Identification: Confirm scope, identify systems, determine evidence sources
3. Collection:   Follow volatility order, hash everything, document actions
4. Examination:  Process evidence, extract artifacts, build timeline
5. Analysis:     Correlate findings, determine narrative, assess impact
6. Reporting:    Document findings, recommend remediation, preserve evidence
```

### Order of Volatility

```
Collect most volatile first:
  1. CPU registers, cache             (nanoseconds)
  2. Memory (RAM)                     (lost at power-off)
  3. Network state (connections)      (changes constantly)
  4. Running processes                (terminate = gone)
  5. Disk (live filesystem)           (overwritten eventually)
  6. Remote logging data              (may rotate/expire)
  7. Archival media (backups)         (most stable)

Practical priority:
  HIGH:   Memory dump, network connections, running processes
  MEDIUM: Disk image, application logs, security logs
  LOW:    Backups, physical evidence
```

## Evidence Preservation

### Chain of Custody Record

```
Case ID: ___________  Case Name: ___________

Evidence Item #: ___________
Description: ___________
Serial / Asset ID: ___________
Collected by: ___________
Date/Time: ___________
Location: ___________
SHA-256 at collection: ___________

Transfer Log:
  Date | Time | Released By | Received By | Purpose
  _____|______|_____________|_____________|________

Storage location: ___________
Hash verified at each transfer: [ ] Yes  [ ] No
```

### Disk and Memory Acquisition

```shell
# Disk imaging with hash verification
dcfldd if=/dev/sda of=/evidence/case001/disk.raw \
    hash=sha256 hashlog=/evidence/case001/hash.log bs=4M

# Verify image integrity
sha256sum /evidence/case001/disk.raw

# Mount read-only for analysis
mount -o ro,noexec,nosuid,nodev,loop /evidence/case001/disk.raw /mnt/evidence

# Memory acquisition (Linux - LiME)
insmod lime.ko "path=/evidence/case001/memory.lime format=lime"
sha256sum /evidence/case001/memory.lime > output_file

# Cloud VM: snapshot-based acquisition
# AWS: aws ec2 create-snapshot --volume-id vol-xxx --description "Forensic case001"
# Docker: docker export suspicious-container > output_file
```

### Live System Triage

```shell
# Capture volatile data BEFORE taking system offline
script /evidence/case001/triage-session.log

# System identification
date -u > output_file
hostname >> output_file
uname -a >> output_file

# Network state
ss -tulnp > output_file
ip addr > output_file

# Running processes
ps auxww > output_file
ps auxww --forest > output_file

# Open files and connections
lsof -i > output_file

# Users and logins
w > output_file
last -a > output_file
lastb -a > output_file

# Persistence mechanisms
crontab -l > output_file
systemctl list-timers > output_file
lsmod > output_file

# Hash all triage files
sha256sum /evidence/triage/* > output_file
```

## Timeline Analysis

### Building a Super Timeline

```shell
# Automated timeline with log2timeline/plaso
log2timeline.py /evidence/case001/timeline.plaso /evidence/case001/disk.raw

# Filter and export
psort.py -o l2tcsv -w /evidence/case001/timeline.csv \
    /evidence/case001/timeline.plaso \
    "date > '2024-06-01' AND date < '2024-06-15'"
```

### Manual Timeline Construction

```
Format: [Timestamp UTC] | [Source] | [Type] | [Description] | [Evidence Ref]

Example:
  2024-06-10 02:15:33 | auth.log     | AUTH    | Failed SSH from 203.0.113.50 (user: admin)    | LOG-001
  ... (2,847 failed attempts over 30 minutes) ...
  2024-06-10 02:47:12 | auth.log     | AUTH    | Successful SSH from 203.0.113.50               | LOG-001
  2024-06-10 02:47:45 | bash_history | EXEC    | download utility [reference URL]            | DISK-001
  2024-06-10 02:47:55 | bash_history | EXEC    | chmod +x payload.shell-cmd && ./payload.shell-cmd            | DISK-001
  2024-06-10 02:48:01 | syslog       | PROC    | New process: /tmp/.hidden/miner (PID 28451)    | LOG-002
  2024-06-10 02:48:15 | cron         | PERSIST | Crontab: @reboot /tmp/.hidden/miner            | DISK-002
  2024-06-10 03:00:00 | netflow      | NET     | Outbound to mining pool 198.51.100.10:3333     | NET-001
```

### Key Artifacts by OS

```
Linux:
  Auth:        [system-path] [system-path] (last), [system-path] (lastb)
  Execution:   ~/.bash_history, [system-path] [system-path]
  Persistence: [system-path] [system-path] ~/.ssh/authorized_keys
  Network:     [system-path] (firewall), [system-path] [system-path]

Windows:
  Event Logs:  Security.evtx (4624/4625), PowerShell/Operational, Sysmon
  Registry:    HKLM\...\Services, HKLM\...\Run, NTUSER.DAT, SAM
  Filesystem:  $MFT, $UsnJrnl, Prefetch, Amcache.hve, SRUM
```

## Memory Forensics

```shell
# Volatility framework analysis
vol.py -f memory.lime --profile=LinuxUbuntu2204x64 linux_pslist
vol.py -f memory.lime --profile=LinuxUbuntu2204x64 linux_pstree
vol.py -f memory.lime --profile=LinuxUbuntu2204x64 linux_netstat
vol.py -f memory.lime --profile=LinuxUbuntu2204x64 linux_malfind
vol.py -f memory.lime --profile=LinuxUbuntu2204x64 linux_bash
vol.py -f memory.lime --profile=LinuxUbuntu2204x64 linux_procdump -p 28451 -D /evidence/dumps/

# Windows memory analysis
vol.py -f memory.raw --profile=Win10x64 pslist
vol.py -f memory.raw --profile=Win10x64 netscan
vol.py -f memory.raw --profile=Win10x64 malfind
vol.py -f memory.raw --profile=Win10x64 cmdline
vol.py -f memory.raw --profile=Win10x64 dlllist
```

## Log Correlation

### SIEM Query Patterns

```
# Detect lateral movement
source_ip="10.*" destination_port IN (22, 3389, 5985, 445)
| stats dc(destination_ip) AS targets BY source_ip
| where targets > 5

# Detect data exfiltration
direction=outbound bytes_out > 100000000
| stats sum(bytes_out) AS total BY source_ip, destination_ip
| where total > 1000000000

# Detect persistence mechanisms
(event_type="file_create" AND path IN ("*/cron.d/*", "*/systemd/system/*"))
OR (event_type="registry_write" AND key="*\\Run\\*")
| table timestamp, hostname, user, path
```

## Forensic Reporting

### Report Template

```
DIGITAL FORENSICS INVESTIGATION REPORT
CONFIDENTIAL

1. EXECUTIVE SUMMARY
   Incident description, scope, key findings, impact, recommended actions

2. INVESTIGATION SCOPE
   Authorization, time period, systems examined, evidence sources, limitations

3. EVIDENCE INVENTORY
   ID | Description | Type | SHA-256 | Acquired By | Date

4. TIMELINE OF EVENTS
   Chronological with evidence references

5. DETAILED FINDINGS
   Each finding: description, evidence, impact

6. INDICATORS OF COMPROMISE
   Type       | Value              | Context
   IP Address | 203.0.113.50       | Attacker source
   File Hash  | sha256:abc123...   | Malicious payload
   File Path  | /tmp/.hidden/miner | Dropped binary

7. ROOT CAUSE ANALYSIS
   Initial access vector, contributing factors, detection delay

8. RECOMMENDATIONS
   Immediate: containment/remediation
   Short-term: detection improvements
   Long-term: architecture/process changes
```

## Investigation Playbook Checklist

```
Initial Response (First 30 Minutes):
  [ ] Confirm incident is real (not false positive)
  [ ] Notify incident commander
  [ ] Begin evidence preservation (memory first)
  [ ] Document initial observations
  [ ] Determine if active threat (contain vs observe)

Evidence Collection (Hours 1-4):
  [ ] Memory acquisition of affected systems
  [ ] Disk imaging (or cloud snapshot)
  [ ] Collect relevant logs
  [ ] Record network connections and processes
  [ ] Hash all evidence items

Analysis Phase (Hours 4-48):
  [ ] Build timeline from available logs
  [ ] Identify initial access vector
  [ ] Determine lateral movement paths
  [ ] Identify persistence mechanisms
  [ ] Assess data access and exfiltration
  [ ] Identify all affected systems
  [ ] Extract and catalog IOCs

Reporting Phase:
  [ ] Draft executive summary
  [ ] Complete technical findings
  [ ] Document IOCs in shareable format
  [ ] Write remediation recommendations
  [ ] Peer review findings
  [ ] Archive case file with all evidence
```

## When to Use

**Use this skill when:**
- Designing or implementing forensics analyst solutions
- Reviewing or improving existing forensics analyst approaches
- Making architectural or implementation decisions about forensics analyst
- Learning forensics analyst patterns and best practices
- Troubleshooting forensics analyst-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Forensics Analyst Analysis

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

**Input:** "Help me implement forensics analyst for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended forensics analyst approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When forensics analyst must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
