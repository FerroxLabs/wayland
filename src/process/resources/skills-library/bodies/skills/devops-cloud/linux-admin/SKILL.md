---
name: linux-admin
description: |
  Linux system administration. Process management, systemd services, user/group management, file permissions, disk management, networking (iptables, netplan), performance tuning (sysctl), log management, cron jobs, troubleshooting.
  Use when the user asks about linux admin, linux admin best practices, or needs guidance on linux admin implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud shell-scripting"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Linux Admin

You are a Linux system administration expert with deep knowledge of process management, systemd, security hardening, networking, storage, performance tuning, and troubleshooting for production servers.

## Core Principles

1. **Automate everything** - If you do it twice, script it. If you script it, test it.
2. **Least privilege** - Minimal permissions, minimal packages, minimal attack surface.
3. **Immutable infrastructure** - Prefer reprovisioning over patching when possible.
4. **Log everything** - Centralize logs, set rotation policies, monitor anomalies.
5. **Measure, then tune** - Profile before optimizing. Data over gut feelings.

## Process Management

### Essential Process Commands

```shell
# View processes
ps aux                                      # All processes, detailed
ps -eo pid,ppid,user,%cpu,%mem,vsz,rss,stat,start,time,comm --sort=-%mem  # Custom format, sorted by memory
pstree -p                                   # Process tree with PIDs
top -bn1 -o %MEM | head -20                # Top memory consumers (batch mode)
htop                                        # Interactive process viewer

# Process signals
kill -SIGTERM <pid>                         # Graceful shutdown (default)
kill -SIGKILL <pid>                         # Force kill (last resort)
kill -SIGHUP <pid>                          # Reload configuration
kill -SIGUSR1 <pid>                         # Application-defined (often log rotation)
killall -SIGTERM <process_name>             # Kill by name
pkill -f "pattern"                          # Kill by command pattern
# ... (condensed) ...
# Process resource limits
ulimit -n                                   # File descriptor limit
ulimit -u                                   # Max user processes
ulimit -a                                   # All limits
cat /proc/<pid> output_file                      # Limits for a specific process
```

### Finding Resource-Hungry Processes

```shell
# Top CPU consumers
ps -eo pid,user,%cpu,comm --sort=-%cpu | head -10

# Top memory consumers
ps -eo pid,user,%mem,rss,comm --sort=-%mem | head -10

# Processes with most open files
lsof -n | awk '{print $1}' | sort | uniq -c | sort -rn | head -10

# Processes with most network connections
ss -tnp | awk '{print $6}' | sort | uniq -c | sort -rn | head -10

# Find zombie processes
ps aux | awk '$8=="Z" {print}'
```

## Systemd Services

### Create a Systemd Service

```ini
# [system-path]
[Unit]
Description=My Application Server
Documentation=[reference URL]
After=network.target postgresql.service
Requires=postgresql.service
Wants=redis.service

[Service]
Type=notify                              # or simple, forking, oneshot
User=appuser
Group=appgroup
WorkingDirectory=/opt/myapp
Environment=NODE_ENV=production
# ... (condensed) ...
StandardError=journal
SyslogIdentifier=myapp

[Install]
WantedBy=multi-user.target
```

### Systemd Commands

```shell
# Service management
systemctl start myapp                     # Start service
systemctl stop myapp                      # Stop service
systemctl restart myapp                   # Restart service
systemctl reload myapp                    # Reload config (if supported)
systemctl status myapp                    # Check status
systemctl enable myapp                    # Enable at boot
systemctl disable myapp                   # Disable at boot
systemctl daemon-reload                   # Reload unit files after changes

# Viewing logs
journalctl -u myapp                       # All logs for service
journalctl -u myapp -f                    # Follow logs (tail -f equivalent)
journalctl -u myapp --since "1 hour ago"  # Recent logs
journalctl -u myapp -p err                # Errors only
journalctl -u myapp --no-pager -n 100     # Last 100 lines, no pager

# System state
systemctl list-units --type=service --state=running    # Running services
systemctl list-units --failed                          # Failed units
systemctl list-timers                                  # Scheduled timers
```

### Systemd Timers (Modern Cron)

```ini
# [system-path]
[Unit]
Description=Daily backup timer

[Timer]
OnCalendar=*-*-* 02:00:00         # Daily at 2 AM
RandomizedDelaySec=600             # Random delay up to 10 min (prevent thundering herd)
Persistent=true                    # Run if missed (machine was off)

[Install]
WantedBy=timers.target
```

## User and Group Management

```shell
# Create system user (no login, for services)
useradd --system --shell [system-path] --home-dir [system-path] --create-home appuser

# Create regular user
useradd --create-home --shell shell-interpreter --groups sudo,docker username
passwd username

# Modify user
usermod -aG docker username            # Add to group (without removing from others)
usermod -L username                    # Lock account
usermod -U username                    # Unlock account
usermod -e 2024-12-31 username         # Set expiry date

# Group management
# ... (condensed) ...

# Sudoers (use visudo, never edit directly)
# [system-path]
%appteam ALL=(ALL) NOPASSWD: [system-path] restart myapp, [system-path] status myapp
username ALL=(ALL) NOPASSWD: ALL       # DANGEROUS: Grants unrestricted root access without password. Avoid in production -- use scoped NOPASSWD (above) instead.
```

## File Permissions

### Permission Reference

```
Owner  Group  Other
rwx    rwx    rwx
421    421    421

Common patterns:
  755  rwxr-xr-x  Directories, executables
  644  rw-r--r--  Regular files
  600  rw-------  Private files (SSH keys, configs with secrets)
  700  rwx------  Private directories
  750  rwxr-x---  Group-readable directories
  640  rw-r-----  Group-readable files
```

### Special Permissions

```shell
# SUID (run as file owner)
chmod u+s [system-path]              # Runs as file owner
# SGID (on directory: new files inherit group)
chmod g+s /shared/directory             # New files get directory's group
# Sticky bit (on directory: only owner can delete)
chmod +t /tmp                           # Only file owner can delete

# ACLs (fine-grained permissions)
setfacl -m u:username:rwx /path/to/dir        # Grant user access
setfacl -m g:groupname:rx /path/to/dir        # Grant group access
setfacl -d -m g:groupname:rwx /path/to/dir    # Default ACL for new files
getfacl /path/to/dir                           # View ACLs
```

### Ownership Patterns

```shell
# Web application
chown -R appuser:appgroup [system-path]
find [system-path] -type d -run-cmd chmod 750 {} \;
find [system-path] -type f -run-cmd chmod 640 {} \;
chmod 750 [system-path]             # Executables

# Shared directory
mkdir -p /shared/team
chown root:devteam /shared/team
chmod 2770 /shared/team                # SGID + rwxrwx---

# SSH keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub
chmod 600 ~/.ssh/authorized_keys
```

## Disk Management

### Disk Information

```shell
# Disk usage
df -h                                   # Filesystem usage
df -i                                   # Inode usage (can run out even with space)
du -shell-cmd [system-path]                       # Directory sizes
du -shell-cmd [system-path] | sort -rh | head -10 # Top 10 largest directories
ncdu /                                  # Interactive disk usage (ncdu package)

# Block devices
lsblk                                  # List block devices
blkid                                  # Show UUIDs and filesystem types
fdisk -l                               # Partition table
```

### LVM Operations

```shell
# Create physical volume, volume group, logical volume
pvcreate /dev/sdb
vgcreate data_vg /dev/sdb
lvcreate -L 50G -n app_lv data_vg
mkfs.ext4 /dev/data_vg/app_lv
mkdir /data
mount /dev/data_vg/app_lv /data

# Extend LVM
lvextend -L +20G /dev/data_vg/app_lv      # Add 20GB
resize2fs /dev/data_vg/app_lv              # Resize ext4 filesystem
# or for XFS:
xfs_growfs /data

# Add to [system-path] for persistent mount
# Verify with 'cat [system-path] to check for duplicates before appending.
# Use 'mount -a' to test before rebooting.
echo '/dev/data_vg/app_lv /data ext4 defaults 0 2' >> output_file
```

### Disk Cleanup

```shell
# Find large files
find / -type f -size +100M -run-cmd ls -lh {} \; 2> output_file | sort -k5 -rh

# Clean package manager cache
apt clean                               # Debian/Ubuntu
yum clean all                           # RHEL/CentOS
dnf clean all                           # Fedora

# Clean journal logs
journalctl --disk-usage
journalctl --vacuum-size=500M           # Keep only 500MB
journalctl --vacuum-time=7d             # Keep only 7 days

# Remove old kernels (Ubuntu)
apt autoremove --purge

# Clean Docker (if installed)
docker system prune -af --volumes
```

## Networking

### Network Configuration (Netplan - Ubuntu)

```yaml
# [system-path]
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      dhcp4: false
      addresses:
        - 10.0.1.10/24
      routes:
        - to: default
          via: 10.0.1.1
      nameservers:
        addresses:
          - 1.1.1.1
          - 8.8.8.8
        search:
          - internal.example.com
```

```shell
netplan apply                           # Apply network config
```

### Network Diagnostics

```shell
# Interface information
ip addr show                            # IP addresses
ip link show                            # Interface status
ip route show                           # Routing table

# DNS
dig example.com                         # DNS query
dig +short example.com                  # Short output
dig @8.8.8.8 example.com               # Query specific DNS server
nslookup example.com                    # Alternative DNS lookup
resolvectl status                       # Systemd resolver status

# Connectivity
ping -c 4 example.com                  # ICMP test
# ... (condensed) ...
# Port and connection info
ss -tlnp                               # Listening TCP ports with process
ss -tunap                              # All connections with process
ss -s                                  # Socket statistics summary
netstat -tlnp                          # Legacy alternative to ss
```

### Firewall (iptables / nftables)

## Performance Tuning (sysctl)

### Production Sysctl Settings

```shell
# [system-path]

# Network tuning
net.core.somaxconn = 65535                       # Max socket backlog
net.core.netdev_max_backlog = 65535              # Max network device backlog
net.ipv4.tcp_max_syn_backlog = 65535             # Max SYN queue
net.ipv4.ip_local_port_range = 1024 65535        # Ephemeral port range
net.ipv4.tcp_tw_reuse = 1                        # Reuse TIME_WAIT sockets
net.ipv4.tcp_fin_timeout = 15                    # Faster TIME_WAIT cleanup
net.ipv4.tcp_keepalive_time = 300                # TCP keepalive (5 min)
net.ipv4.tcp_keepalive_intvl = 30
net.ipv4.tcp_keepalive_probes = 5

# Memory tuning
# ... (condensed) ...
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1
kernel.randomize_va_space = 2                    # ASLR
```

```shell
# Apply sysctl changes
sysctl -p [system-path]

# Check a specific value
sysctl net.core.somaxconn
```

## Log Management

### Log Locations

```
[system-path]          System log (Debian/Ubuntu)
[system-path]        System log (RHEL/CentOS)
[system-path]        Authentication log (Debian/Ubuntu)
[system-path]          Authentication log (RHEL/CentOS)
[system-path]        Kernel log
[system-path]           Boot messages
[system-path]          Nginx logs
[system-path]            APT package manager (Debian/Ubuntu)
[system-path]         YUM package manager (RHEL/CentOS)
```

### Log Rotation

```
# [system-path]
[system-path] {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 appuser appgroup
    sharedscripts
    postrotate
        systemctl reload myapp > output_file 2>&1 || true
    endscript
}
```

## Cron Jobs

```shell
# Edit crontab
crontab -e                              # Current user
crontab -e -u username                  # Specific user (as root)

# Crontab format
# MIN HOUR DOM MON DOW COMMAND
  0   2    *   *   *   [system-path]            # Daily at 2:00 AM
  */5 *    *   *   *   [system-path]      # Every 5 minutes
  0   0    *   *   0   [system-path]     # Sunday at midnight
  0   9    1   *   *   [system-path]     # 1st of month at 9 AM

# Best practices for cron
SHELL=shell-interpreter
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
MAILTO=admin@example.com

# Always redirect output
0 2 * * * [system-path] >> output_file 2>&1

# Use flock to prevent overlapping runs
*/5 * * * * [system-path] -n /tmp/healthcheck.lock [system-path]
```

## Troubleshooting Workflow

```
1. What is the symptom?
   - Is the service running?        systemctl status <service>
   - Can I connect?                  HTTP-client, telnet, ss -tlnp
   - Are there errors?              journalctl -u <service> -p err

2. Is it a resource issue?
   - CPU saturated?                 top, mpstat
   - Memory exhausted?             free -h, vmstat
   - Disk full?                    df -h, df -i
   - Network saturated?            ss -s, iftop, nethogs
   - Too many open files?          lsof -p <pid> | wc -l

3. Is it a configuration issue?
   - Config syntax valid?          nginx -t, systemd-analyze verify
   # ... (condensed) ...
5. Has anything changed recently?
   - Recent deployments?           git log, deployment logs
   - Config changes?               etckeeper log, diff configs
   - Package updates?              apt log, yum history
   - Kernel/OS updates?            uname -r, uptime (recent reboot?)
```

## Security Hardening Checklist

```
[ ] SSH hardened (key-only auth, no root login, non-standard port optional)
[ ] Firewall configured (deny by default, allow by exception)
[ ] Automatic security updates enabled (unattended-upgrades)
[ ] Non-root service accounts for all applications
[ ] File permissions reviewed (no world-writable files in sensitive paths)
[ ] Sysctl security settings applied
[ ] Failed login monitoring (fail2ban or equivalent)
[ ] Disk encryption for sensitive data (LUKS)
[ ] Audit logging enabled (auditd)
[ ] Unnecessary services disabled
[ ] NTP configured (time synchronization)
[ ] Kernel updated and rebooted regularly
```

## When to Use

**Use this skill when:**
- Designing or implementing linux admin solutions
- Reviewing or improving existing linux admin approaches
- Making architectural or implementation decisions about linux admin
- Learning linux admin patterns and best practices
- Troubleshooting linux admin-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Linux Admin Analysis

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

**Input:** "Help me implement linux admin for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended linux admin approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When linux admin must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
