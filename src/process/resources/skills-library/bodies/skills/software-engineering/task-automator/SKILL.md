---
name: task-automator
description: |
  Task automation design expertise covering automation opportunity identification, script design patterns, robust error handling, structured logging, scheduling strategies, failure notification, idempotency principles, dry-run mode implementation, configuration management, and documentation standards for maintainable automation.
  Use when the user asks about task automator, task automator best practices, or needs guidance on task automator implementation.
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

# Task Automator

## Core Philosophy

Automation exists to eliminate repetitive manual work, reduce human error, and ensure consistency. A well-designed automation script is idempotent, observable, recoverable, and documented. If a task is performed more than twice and follows a predictable pattern, it is a candidate for automation.

## Automation Opportunity Identification

### Decision Framework

```
Is this task:
  [x] Performed more than 2-3 times per week?
  [x] Following a predictable, repeatable pattern?
  [x] Taking more than 5 minutes manually?
  [x] Error-prone when done manually?
  [x] Blocking other work while waiting for completion?

If 3+ boxes checked -> Automate it.

Prioritization formula:
  Value = (Time_saved_per_execution * Frequency) / Development_effort

High value automation targets:
  - Data backups and rotation
  - Environment setup and teardown
  - Report generation and distribution
  - Deployment and release processes
  - Log rotation and cleanup
  - Certificate renewal
  - Health checks and monitoring
  - Data synchronization between systems
  - Onboarding/offboarding user accounts
  - Dependency updates and security patches
```

## Script Design Patterns

### Template: Robust Automation Script

```python
#!/usr/bin/env python3
"""
Daily Report Generator

Generates and distributes daily sales reports.
Designed to be run via cron at 06:00 UTC daily.

Usage:
    python daily_report.py
    python daily_report.py --dry-run
    python daily_report.py --date 2025-03-15
    python daily_report.py --config /path/to/config.yaml
"""

import argparse
import logging
import sys
import time
from datetime import date, timedelta
from pathlib import Path
from dataclasses import dataclass, field

# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────

@dataclass
class Config:
    """Configuration with sensible defaults and supersede support."""
    report_date: date = field(default_factory=lambda: date.today() - timedelta(days=1))
    output_dir: Path = Path("/var/reports/daily")
    recipients: list[str] = field(default_factory=lambda: ["team@example.com"])
    database_url: str = ""
    smtp_host: str = "smtp.example.com"
    dry_run: bool = False
    verbose: bool = False

    @classmethod
    def from_args(cls, args: argparse.Namespace) -> 'Config':
        config = cls()
        if args.date:
            config.report_date = date.fromisoformat(args.date)
        if args.dry_run:
            config.dry_run = True
        if args.verbose:
            config.verbose = True
        if args.output_dir:
            config.output_dir = Path(args.output_dir)
        return config

# ──────────────────────────────────────────────
# Logging Setup
# ──────────────────────────────────────────────

def setup_logging(verbose: bool = False) -> logging.Logger:
    logger = logging.getLogger("daily_report")
    logger.setLevel(logging.DEBUG if verbose else logging.INFO)

    # Console handler
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(logging.Formatter(
        '%(asctime)s [%(levelname)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    ))
    logger.addHandler(console)

    # File handler (rotated externally)
    file_handler = logging.FileHandler('/var/log/daily_report.log')
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    ))
    logger.addHandler(file_handler)

    return logger

# ──────────────────────────────────────────────
# Core Logic
# ──────────────────────────────────────────────

class ReportGenerator:
    def __init__(self, config: Config, logger: logging.Logger):
        self.config = config
        self.logger = logger
        self.stats = {"queries_run": 0, "rows_processed": 0, "errors": 0}

    def run(self) -> bool:
        """Main execution flow. Returns True on success."""
        start_time = time.time()
        self.logger.info(f"Starting report generation for {self.config.report_date}")

        if self.config.dry_run:
            self.logger.info("[DRY RUN] No changes will be made")

        try:
            # Step 1: Validate prerequisites
            self._validate()

            # Step 2: Get data
            data = self._fetch_data()

            # Step 3: Generate report
            report_path = self._generate_report(data)

            # Step 4: Distribute
            self._distribute(report_path)

            elapsed = time.time() - start_time
            self.logger.info(
                f"Report completed in {elapsed:.1f}s. "
                f"Stats: {self.stats}"
            )
            return True

        except Exception as e:
            self.stats["errors"] += 1
            elapsed = time.time() - start_time
            self.logger.error(f"Report generation FAILED after {elapsed:.1f}s: {e}", exc_info=True)
            self._notify_failure(str(e))
            return False

    def _validate(self):
        """Check prerequisites before starting."""
        self.config.output_dir.mkdir(parents=True, exist_ok=True)
        # Verify database connectivity, SMTP reachability, etc.
        self.logger.debug("Prerequisites validated")

    def _fetch_data(self) -> dict:
        """Get data from database."""
        self.logger.info("Fetching sales data...")
        # ... database queries ...
        self.stats["queries_run"] += 3
        self.stats["rows_processed"] += 1500
        return {"revenue": 50000, "orders": 230}

    def _generate_report(self, data: dict) -> Path:
        """Generate the report file."""
        report_path = self.config.output_dir / f"sales_{self.config.report_date}.pdf"
        if self.config.dry_run:
            self.logger.info(f"[DRY RUN] Would generate: {report_path}")
            return report_path
        # ... generate PDF ...
        self.logger.info(f"Report generated: {report_path}")
        return report_path

    def _distribute(self, report_path: Path):
        """Send report to recipients."""
        for recipient in self.config.recipients:
            if self.config.dry_run:
                self.logger.info(f"[DRY RUN] Would send to: {recipient}")
            else:
                # ... send email ...
                self.logger.info(f"Report sent to: {recipient}")

    def _notify_failure(self, error_message: str):
        """Send failure notification."""
        self.logger.info(f"Sending failure notification: {error_message}")
        # ... send alert via Slack/PagerDuty/email ...

# ──────────────────────────────────────────────
# Entry Point
# ──────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate daily sales report")
    parser.add_argument("--date", help="Report date (YYYY-MM-DD)")
    parser.add_argument("--dry-run", action="store_true", help="Preview without executing")
    parser.add_argument("--verbose", "-v", action="store_true", help="Debug logging")
    parser.add_argument("--output-dir", help="Output directory path")
    parser.add_argument("--config", help="Path to config YAML file")
    return parser.parse_args()

def main():
    args = parse_args()
    config = Config.from_args(args)
    logger = setup_logging(verbose=config.verbose)

    generator = ReportGenerator(config, logger)
    success = generator.run()

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
```

## Error Handling

### Retry with Exponential Backoff

```python
import time
import functools

def retry(max_attempts=3, base_delay=1.0, max_delay=60.0, exceptions=(Exception,)):
    """Decorator for retry with exponential backoff."""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    if attempt == max_attempts:
                        raise
                    delay = min(base_delay * (2 ** (attempt - 1)), max_delay)
                    logging.warning(
                        f"{func.__name__} failed (attempt {attempt}/{max_attempts}): {e}. "
                        f"Retrying in {delay:.1f}s..."
                    )
                    time.sleep(delay)
        return wrapper
    return decorator

@retry(max_attempts=3, base_delay=2.0, exceptions=(ConnectionError, TimeoutError))
def fetch_data_from_api(url):
    response = httpx.get(url, timeout=30)
    response.raise_for_status()
    return response.json()
```

### Graceful Shutdown

```python
import signal

class GracefulShutdown:
    def __init__(self):
        self.should_stop = False
        signal.signal(signal.SIGTERM, self._handler)
        signal.signal(signal.SIGINT, self._handler)

    def _handler(self, signum, frame):
        logging.info(f"Received signal {signum}, shutting down gracefully...")
        self.should_stop = True

# Usage in a loop
shutdown = GracefulShutdown()

for item in work_queue:
    if shutdown.should_stop:
        logging.info("Stopping work loop due to shutdown signal")
        break
    process(item)
```

## Idempotency

```python
class IdempotentProcessor:
    """Process items exactly once using a state file."""

    def __init__(self, state_file: Path):
        self.state_file = state_file
        self.processed = self._load_state()

    def _load_state(self) -> set:
        if self.state_file.exists():
            return set(self.state_file.read_text().splitlines())
        return set()

    def _save_state(self):
        self.state_file.write_text('\n'.join(sorted(self.processed)))

    def should_process(self, item_id: str) -> bool:
        return item_id not in self.processed

    def mark_processed(self, item_id: str):
        self.processed.add(item_id)
        self._save_state()

# Usage
processor = IdempotentProcessor(Path("/var/state/migration.state"))

for record in records:
    if not processor.should_process(record.id):
        logger.debug(f"Skipping already-processed: {record.id}")
        continue
    migrate_record(record)
    processor.mark_processed(record.id)
```

## Dry-Run Mode

```python
class FileManager:
    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.logger = logging.getLogger(__name__)

    def move_file(self, source: Path, destination: Path):
        if self.dry_run:
            self.logger.info(f"[DRY RUN] Would move: {source} -> {destination}")
            return
        destination.parent.mkdir(parents=True, exist_ok=True)
        source.rename(destination)
        self.logger.info(f"Moved: {source} -> {destination}")

    def delete_file(self, path: Path):
        if self.dry_run:
            self.logger.info(f"[DRY RUN] Would delete: {path}")
            return
        path.unlink()
        self.logger.info(f"Deleted: {path}")
```

## Notification on Failure

```python
import smtplib
from email.mime.text import MIMEText

def send_alert(subject: str, body: str, recipients: list[str]):
    msg = MIMEText(body)
    msg['Subject'] = f"[AUTOMATION ALERT] {subject}"
    msg['From'] = 'automation@example.com'
    msg['To'] = ', '.join(recipients)

    with smtplib.SMTP('smtp.example.com', 587) as server:
        server.starttls()
        server.login('automation@example.com', 'password')
        server.send_message(msg)

# Slack notification
import httpx

def send_slack_alert(webhook_url: str, message: str, severity: str = "warning"):
    color = {"info": "#36a64f", "warning": "#ff9900", "error": "#ff0000"}[severity]
    httpx.post(webhook_url, json={
        "attachments": [{
            "color": color,
            "title": "Automation Alert",
            "text": message,
            "ts": int(time.time())
        }]
    })
```

## Configuration Management

```yaml
# config.yaml
report:
  output_dir: [system-path]
  format: pdf
  retention_days: 90

database:
  url: postgresql://user:pass@host/db
  pool_size: 5

notifications:
  email:
    recipients: ["team@example.com", "alerts@example.com"]
    smtp_host: smtp.example.com
  slack:
    webhook_url: [reference URL]
    channel: "#automation-alerts"

scheduling:
  timezone: UTC
  run_time: "06:00"
```

```python
import yaml
from pathlib import Path

def load_config(config_path: Path | None = None) -> dict:
    """Load config from file, with env var supersedes."""
    # Default config path
    if config_path is None:
        config_path = Path(__file__).parent / "config.yaml"

    with open(config_path) as f:
        config = yaml.safe_load(f)

    # Environment variable supersedes
    import os
    if db_url := environment-variables.get("DATABASE_URL"):
        config["database"]["url"] = db_url
    if slack_url := environment-variables.get("SLACK_WEBHOOK_URL"):
        config["notifications"]["slack"]["webhook_url"] = slack_url

    return config
```

## Documentation Standards

```python
"""
Script: daily_report.py
Purpose: Generate and distribute daily sales reports
Author: Data Engineering Team
Created: 2025-01-15
Last Modified: 2025-03-15

Dependencies:
  - Python 3.11+
  - httpx, jinja2, weasyprint, pyyaml
  - PostgreSQL access (read-only)

Environment Variables:
  DATABASE_URL: PostgreSQL connection string (required)
  SLACK_WEBHOOK_URL: Slack notification webhook (optional)
  SMTP_PASSWORD: Email server password (required for email delivery)

Scheduling:
  Runs daily at 06:00 UTC via cron:
  0 6 * * * [system-path] [system-path] >> output_file 2>&1

Recovery:
  If the script fails, it can be safely re-run with --date YYYY-MM-DD.
  It is idempotent: re-running overwrites the previous report for that date.

Monitoring:
  - Check [system-path] for errors
  - Slack alerts sent to #automation-alerts on failure
  - Grafana dashboard: Automation > Daily Reports
"""
```

## Best Practices

1. **Always implement dry-run mode**: Test changes safely before executing
2. **Make scripts idempotent**: Safe to run multiple times with same result
3. **Use structured logging**: Include timestamps, levels, and context
4. **Fail loudly**: Send notifications on failure, exit with non-zero code
5. **Use configuration files**: Avoid hardcoded values
6. **Handle signals gracefully**: Respond to SIGTERM for clean shutdown
7. **Add timeouts**: Every external call should have a timeout
8. **Document everything**: Purpose, dependencies, scheduling, recovery procedures
9. **Version control your scripts**: Track changes like any other code
10. **Test automation scripts**: Unit test business logic, integration test the full flow

## When to Use

**Use this skill when:**
- Designing or implementing task automator solutions
- Reviewing or improving existing task automator approaches
- Making architectural or implementation decisions about task automator
- Learning task automator patterns and best practices
- Troubleshooting task automator-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Task Automator Analysis

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

**Input:** "Help me implement task automator for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended task automator approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When task automator must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
