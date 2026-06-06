# OpenClaw Uninstallation Guide

## Overview

This guide provides steps to completely uninstall OpenClaw, including:

- Stopping all running services
- Uninstalling the npm global package
- Deleting configuration files and directories
- Removing system services (launchd/systemd)
- Cleaning up environment variables

## Before You Uninstall

### 1. Stop All OpenClaw Processes

**Stop the Gateway service:**

```bash
# Check Gateway status
openclaw gateway status

# Stop the Gateway
openclaw gateway stop
```

**Check for and stop all related processes:**

```bash
# macOS/Linux
ps aux | grep openclaw | grep -v grep

# If processes are found, stop them manually
killall openclaw  # macOS/Linux
```

### 2. Check System Service Status

**macOS (launchd):**

```bash
# Check service status
launchctl list | grep openclaw

# If the service is running, unload it first
launchctl unload ~/Library/LaunchAgents/com.openclaw.gateway.plist 2>/dev/null
```

**Linux (systemd):**

```bash
# Check service status
systemctl --user status openclaw-gateway

# Stop and disable the service
systemctl --user stop openclaw-gateway
systemctl --user disable openclaw-gateway
```

## Full Uninstallation Steps

### Step 1: Uninstall the npm Global Package

```bash
# Uninstall using npm
npm uninstall -g openclaw

# If installed with pnpm
pnpm remove -g openclaw

# If installed with bun
bun remove -g openclaw
```

**Verify the uninstallation:**

```bash
openclaw --version
# Should show "command not found" or a similar error
```

### Step 2: Delete Configuration Files and Data Directories

**Delete the main configuration directory:**

```bash
rm -rf ~/.openclaw
```

**Check and delete other possible locations:**

```bash
# Check for other configuration directories
ls -la ~ | grep -i openclaw
ls -la ~ | grep -i clawd

# If they exist, remove them
rm -rf ~/clawd  # if an older workspace directory exists
```

### Step 3: Remove System Service Configuration

**macOS (launchd):**

```bash
# Delete the LaunchAgent configuration file
rm -f ~/Library/LaunchAgents/com.openclaw.gateway.plist

# Clear launchctl environment variables (if they were set)
launchctl unsetenv OPENCLAW_GATEWAY_TOKEN 2>/dev/null
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD 2>/dev/null
```

**Linux (systemd):**

```bash
# Delete the systemd service file
rm -f ~/.config/systemd/user/openclaw-gateway.service

# Reload systemd
systemctl --user daemon-reload
```

### Step 4: Clean Up Log Files

**macOS:**

```bash
rm -f ~/Library/Logs/openclaw-gateway.log
```

**Linux:**

```bash
# systemd logs are cleaned up automatically - no manual deletion needed
```

### Step 5: Clean Up Environment Variables (Optional)

Check your shell configuration files (`.zshrc`, `.bash_profile`, `.bashrc`) for any OpenClaw-related environment variables:

```bash
# Check for environment variables
grep -i openclaw ~/.zshrc ~/.bash_profile ~/.bashrc 2>/dev/null

# If any are found, manually edit the file and remove the relevant lines
```

Common environment variables:

- `OPENCLAW_CONFIG_PATH`
- `OPENCLAW_STATE_DIR`
- `OPENCLAW_PROFILE`

### Step 6: Clear Port Usage (If Processes Are Still Running)

```bash
# Check whether port 18789 is in use
lsof -i :18789  # macOS
ss -ltnp | grep 18789  # Linux

# If a process is found, stop it
kill -9 <PID>
```

## Verifying the Uninstallation Is Complete

Run the following checks to confirm OpenClaw has been fully removed:

```bash
# 1. Check whether the command still exists
which openclaw
# Should return empty or "not found"

# 2. Check whether the configuration directory has been deleted
ls -la ~/.openclaw
# Should return "No such file or directory"

# 3. Check whether the system service has been removed
# macOS
launchctl list | grep openclaw
# Should return empty

# Linux
systemctl --user list-unit-files | grep openclaw
# Should return empty

# 4. Check whether any processes are still running
ps aux | grep openclaw | grep -v grep
# Should return empty
```

## Uninstallation Script (Optional)

You can create an uninstallation script to automate the steps above:

**macOS/Linux:**

```bash
#!/bin/bash
echo "Uninstalling OpenClaw..."

# Stop services
openclaw gateway stop 2>/dev/null
killall openclaw 2>/dev/null

# Uninstall npm package
npm uninstall -g openclaw 2>/dev/null

# Delete configuration directories
rm -rf ~/.openclaw
rm -rf ~/clawd

# macOS: remove LaunchAgent
if [ -f ~/Library/LaunchAgents/com.openclaw.gateway.plist ]; then
    launchctl unload ~/Library/LaunchAgents/com.openclaw.gateway.plist 2>/dev/null
    rm -f ~/Library/LaunchAgents/com.openclaw.gateway.plist
fi

# Linux: remove systemd service
if [ -f ~/.config/systemd/user/openclaw-gateway.service ]; then
    systemctl --user stop openclaw-gateway 2>/dev/null
    systemctl --user disable openclaw-gateway 2>/dev/null
    rm -f ~/.config/systemd/user/openclaw-gateway.service
    systemctl --user daemon-reload
fi

# Clean up logs
rm -f ~/Library/Logs/openclaw-gateway.log

echo "OpenClaw has been uninstalled successfully!"
```

## Notes

1. **Back up important data**: Before uninstalling, if you need to keep your configuration or workspace data, back it up first:

   ```bash
   cp -r ~/.openclaw ~/.openclaw.backup
   ```

2. **Multiple instances**: If you configured multiple instances using environment variables, you will need to clean up each instance's configuration directory separately.

3. **Environment variables**: If you set environment variables manually, remove them from your shell configuration files.

4. **Lingering processes**: If processes are still running after uninstalling, you may need to restart your terminal or system.

## Troubleshooting

### Issue: The Command Is Still Available After Uninstalling

**Possible causes:**

- The npm package was not fully uninstalled
- There are multiple installation locations

**Solution:**

```bash
# Check all possible installation locations
which -a openclaw

# Manually delete the found paths
# Then uninstall the npm package again
npm uninstall -g openclaw
```

### Issue: The Service Is Still Running

**Solution:**

```bash
# Force-stop all related processes
pkill -9 openclaw

# Check and clean up system services
# macOS
launchctl list | grep openclaw
launchctl remove com.openclaw.gateway 2>/dev/null

# Linux
systemctl --user stop openclaw-gateway
systemctl --user disable openclaw-gateway
```

### Issue: Configuration Files Cannot Be Deleted

**Possible causes:**

- File permission issues
- Files are locked

**Solution:**

```bash
# Check file permissions
ls -la ~/.openclaw

# Change permissions, then delete
chmod -R 755 ~/.openclaw
rm -rf ~/.openclaw
```

## Reference Resources

- [OpenClaw GitHub Repository](https://github.com/openclaw/openclaw)
- [OpenClaw Official Documentation](https://docs.openclaw.ai)
