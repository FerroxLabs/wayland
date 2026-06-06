---
name: cron-scheduler
description: |
  Cron job scheduling expertise covering crontab syntax, systemd timers, overlap prevention with flock, logging best practices, error notification, timezone handling, distributed scheduling, monitoring cron health, migration from cron to orchestrators, and common scheduling patterns.
  Use when the user asks about cron scheduler, cron scheduler best practices, or needs guidance on cron scheduler implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "automation shell-scripting guide"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Cron Scheduler

## Core Philosophy

Cron is the simplest and most reliable way to schedule recurring tasks on Unix-like systems. Its strength is simplicity: five fields define the schedule, the system handles execution. However, cron's simplicity means you must handle logging, error notification, overlap prevention, and monitoring yourself. Master these concerns and cron becomes a remarkably dependable scheduling backbone.

## Crontab Syntax

### The Five Fields

```
 *  *  *  *  *  command
 |  |  |  |  |
 |  |  |  |  +--- Day of week   (0-7, 0 and 7 are Sunday)
 |  |  |  +------ Month         (1-12)
 |  |  +--------- Day of month  (1-31)
 |  +------------ Hour          (0-23)
 +--------------- Minute        (0-59)
```

### Common Patterns

```crontab
# Every minute
* * * * * /path/to/script.shell-cmd

# Every 5 minutes
*/5 * * * * /path/to/script.shell-cmd

# Every hour at minute 0
0 * * * * /path/to/script.shell-cmd

# Every day at 6:00 AM
0 6 * * * /path/to/script.shell-cmd

# Every Monday at 9:00 AM
0 9 * * 1 /path/to/script.shell-cmd
# ... (condensed) ...
# Every quarter (Jan 1, Apr 1, Jul 1, Oct 1)
0 0 1 1,4,7,10 * /path/to/script.shell-cmd

# Last day of month (use a wrapper)
0 0 28-31 * * [ "$(date +\%d -d tomorrow)" = "01" ] && /path/to/script.shell-cmd
```

### Special Strings

```crontab
@reboot    /path/to/startup.shell-cmd      # Run once at boot
@hourly    /path/to/hourly.shell-cmd       # 0 * * * *
@daily     /path/to/daily.shell-cmd        # 0 0 * * *
@weekly    /path/to/weekly.shell-cmd       # 0 0 * * 0
@monthly   /path/to/monthly.shell-cmd      # 0 0 1 * *
@yearly    /path/to/yearly.shell-cmd       # 0 0 1 1 *
```

### Crontab Management

```shell
# Edit current user's crontab
crontab -e

# List current user's crontab
crontab -l

# Edit crontab for specific user (as root)
crontab -u deploy -e

# Remove all cron jobs (DANGEROUS)
crontab -r

# Install crontab from file
crontab /path/to/crontab-backup.txt

# Backup crontab
crontab -l > ~/crontab-backup-$(date +%Y%m%d).txt
```

### Environment in Crontab

## Systemd Timers (Modern Alternative)

### Timer Unit

```ini
# [system-path]
[Unit]
Description=Daily Report Generation Timer

[Timer]
OnCalendar=*-*-* 06:00:00    # Every day at 06:00
Persistent=true                # Run missed executions after downtime
RandomizedDelaySec=300         # Random delay up to 5 min (avoid thundering herd)
AccuracySec=1s

[Install]
WantedBy=timers.target
```

### Service Unit

```ini
# [system-path]
[Unit]
Description=Daily Report Generation
After=network-online.target postgresql.service
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/opt/scripts/daily_report.py
User=deploy
Group=deploy
WorkingDirectory=/opt/scripts

# Environment
# ... (condensed) ...
StandardOutput=journal
StandardError=journal
SyslogIdentifier=daily-report

# Restart policy for oneshot doesn't apply; use timer for rescheduling
```

### Systemd Timer Management

```shell
# Enable and start the timer
sudo systemctl enable daily-report.timer
sudo systemctl start daily-report.timer

# Check timer status
systemctl list-timers --all
systemctl status daily-report.timer
systemctl status daily-report.service

# View logs
journalctl -u daily-report.service --since today
journalctl -u daily-report.service -f  # Follow logs

# Run manually
sudo systemctl start daily-report.service

# Calendar expression testing
systemd-analyze calendar "*-*-* 06:00:00"
systemd-analyze calendar "Mon..Fri *-*-* 08:30:00"
```

### Systemd Calendar Expressions

## Overlap Prevention with flock

Prevent multiple instances of the same job from running simultaneously.

```shell
# Using flock in crontab
*/5 * * * * [system-path] -n /tmp/my-job.lock /path/to/my-job.shell-cmd

# flock options:
# -n : Non-blocking (exit immediately if lock is held)
# -w 30 : Wait up to 30 seconds for lock
# -x : Exclusive lock (default)
# -s : Shared lock (allow multiple readers)

# With error handling
*/5 * * * * [system-path] -n /tmp/my-job.lock -c '/path/to/my-job.shell-cmd || echo "Job failed" | mail -s "Cron Alert" admin@example.com'
```

### Python Lock File Implementation

```python
import fcntl
import sys
from pathlib import Path

class FileLock:
    def __init__(self, lock_file: str):
        self.lock_file = lock_file
        self.fp = None

    def __enter__(self):
        self.fp = open(self.lock_file, 'w')
        try:
            fcntl.flock(self.fp, fcntl.LOCK_EX | fcntl.LOCK_NB)
            self.fp.write(str(os.getpid()))
            # ... (condensed) ...
        Path(self.lock_file).unlink(missing_ok=True)

# Usage
with FileLock('/tmp/daily-report.lock'):
    run_daily_report()
```

## Logging

### Cron Output Management

```crontab
# Capture stdout and stderr to log file with timestamp
0 6 * * * /path/to/script.shell-cmd >> output_file 2>&1

# Separate stdout and stderr
0 6 * * * /path/to/script.shell-cmd >> output_file 2>> output_file

# Use logger to write to syslog
0 6 * * * /path/to/script.shell-cmd 2>&1 | logger -t daily-report

# Suppress all output (NOT recommended for production)
0 6 * * * /path/to/script.shell-cmd > output_file 2>&1

# Suppress only successful output, capture errors
0 6 * * * /path/to/script.shell-cmd > output_file
```

### Log Rotation for Cron Logs

```
# [system-path]
[system-path] {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 deploy deploy
    dateext
    dateformat -%Y%m%d
}
```

### Wrapper Script with Logging

```shell
#!shell-interpreter
# [system-path]
# Usage: cron-wrapper.shell-cmd <script-name> <script-path> [args...]

SCRIPT_NAME="$1"
shift
SCRIPT_PATH="$1"
shift

LOG_DIR="/var/log/cron"
LOG_FILE="${LOG_DIR}/${SCRIPT_NAME}.log"
LOCK_FILE="/tmp/${SCRIPT_NAME}.lock"

mkdir -p "$LOG_DIR"
# ... (condensed) ...
    echo "Cron job ${SCRIPT_NAME} failed with exit code ${EXIT_CODE}" | \
        mail -s "[ALERT] Cron failure: ${SCRIPT_NAME}" alerts@example.com
fi

exit $EXIT_CODE
```

## Error Notification

```crontab
# Use MAILTO for simple email notification on any output
MAILTO=alerts@example.com
0 6 * * * /path/to/script.shell-cmd

# Only email on error (suppress stdout)
0 6 * * * /path/to/script.shell-cmd > output_file
```

### Slack Notification on Failure

```shell
#!shell-interpreter
notify_slack() {
    local message="$1"
    local webhook_url="${SLACK_WEBHOOK_URL}"
    HTTP client request -s -X POST "$webhook_url" \
        -H 'Content-type: application/json' \
        -d "{\"text\": \"$message\"}"
}

./path/to/script.shell-cmd 2>&1
if [ $? -ne 0 ]; then
    notify_slack ":x: Cron job 'daily-report' failed on $(hostname) at $(date)"
fi
```

## Timezone Handling

```crontab
# Set timezone for all cron jobs in this crontab
CRON_TZ=America/New_York
0 6 * * * /path/to/script.shell-cmd     # 6 AM Eastern Time

# Or handle timezone in the script
TZ=UTC /path/to/script.shell-cmd
```

```python
# In Python scripts, always use explicit timezones
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

# Cron runs in system timezone. Be explicit in your code.
now_utc = datetime.now(timezone.utc)
now_eastern = datetime.now(ZoneInfo("America/New_York"))

# Store all timestamps in UTC
report_date = now_utc.date()
```

## Distributed Scheduling

For multi-server environments where you need exactly-once execution:

### Leader Election with Redis

```python
import redis
import uuid
import time

class DistributedScheduler:
    def __init__(self, redis_url: str, lock_ttl: int = 300):
        self.redis = redis.from_url(redis_url)
        self.node_id = str(uuid.uuid4())[:8]
        self.lock_ttl = lock_ttl

    def try_acquire_job(self, job_name: str) -> bool:
        """Try to acquire a distributed lock for a job."""
        lock_key = f"cron:lock:{job_name}"
        acquired = self.redis.set(lock_key, self.node_id, nx=True, ex=self.lock_ttl)
        # ... (condensed) ...
        run_daily_report()
    finally:
        scheduler.release_job("daily-report")
else:
    logging.info("Another node is running this job, skipping")
```

## Monitoring Cron Health

### Heartbeat Monitoring

```shell
# At the end of each cron job, ping a monitoring service
0 6 * * * /path/to/script.shell-cmd && HTTP client request -s [reference URL] > output_file

# With failure notification
0 6 * * * /path/to/script.shell-cmd && HTTP client request -s [reference URL] || HTTP client request -s [reference URL]
```

### Dead-Man's Switch

```python
# Report successful execution to monitoring service
import httpx

HEALTHCHECK_URL = "[reference URL]"

def report_success():
    httpx.get(HEALTHCHECK_URL, timeout=10)

def report_failure(message: str):
    httpx.post(f"{HEALTHCHECK_URL}/fail", data=message, timeout=10)

def report_start():
    httpx.get(f"{HEALTHCHECK_URL}/start", timeout=10)
```

## Migration from Cron to Orchestrators

### When to Migrate

```
Stay with cron:
  - Simple, independent jobs
  - Single server
  - No complex dependencies between jobs
  - < 20 scheduled jobs

Migrate to orchestrator:
  - Complex job dependencies (DAGs)
  - Multi-server coordination needed
  - Need retry logic, backfill, monitoring UI
  - > 20 jobs with growing complexity
  - Team needs visibility into job status

Options:
  - Airflow: Data pipelines, DAGs, Python-based
  - Temporal: Durable workflow execution, multi-language
  - Prefect: Modern Python orchestrator
  - Kubernetes CronJobs: Container-based scheduling
```

### Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-report
spec:
  schedule: "0 6 * * *"
  timeZone: "UTC"
  concurrencyPolicy: Forbid          # Prevent overlap
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
  startingDeadlineSeconds: 600        # Must start within 10 min of schedule
  jobTemplate:
    spec:
      backoffLimit: 2                 # Retry up to 2 times
      # ... (condensed) ...
                - secretRef:
                    name: report-secrets
              resources:
                requests: { memory: "256Mi", cpu: "250m" }
                limits: { memory: "512Mi", cpu: "500m" }
```

## Common Patterns

```crontab
# Full production crontab example
SHELL=shell-interpreter
PATH=/usr/local/bin:/usr/bin:/bin
MAILTO=""

# ---- Health Checks ----
*/5 * * * * [system-path] health-check [system-path]

# ---- Data Processing ----
0 6 * * * [system-path] daily-report [system-path]
0 */4 * * * [system-path] sync-data [system-path]

# ---- Maintenance ----
0 2 * * * [system-path] db-backup [system-path]
0 3 * * 0 [system-path] cleanup [system-path] --days 90
0 4 1 * * [system-path] cert-check [system-path]

# ---- Log Management ----
0 0 * * * [system-path] [system-path]
```

## When to Use

**Use this skill when:**
- Designing or implementing cron scheduler solutions
- Reviewing or improving existing cron scheduler approaches
- Making architectural or implementation decisions about cron scheduler
- Learning cron scheduler patterns and best practices
- Troubleshooting cron scheduler-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Cron Scheduler Analysis

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

**Input:** "Help me implement cron scheduler for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended cron scheduler approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When cron scheduler must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
