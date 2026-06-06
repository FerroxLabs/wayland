# OpenClaw Troubleshooting Guide

## Using the Doctor Command (Primary Diagnostic Tool)

`openclaw doctor` is OpenClaw's health check and repair tool.

### Basic Diagnostics

```bash
openclaw doctor
```

This checks:

- Configuration file health
- Gateway service status
- Authentication configuration
- Channel connection status
- Skills status
- Configuration migration requirements

### Auto-Repair

```bash
openclaw doctor --repair
```

Automatically applies recommended fixes (including service restarts).

### Deep Scan

```bash
openclaw doctor --deep
```

Scans system services to find additional Gateway installations.

### Non-Interactive Mode

```bash
openclaw doctor --non-interactive
```

Applies only safe migrations, skipping operations that require manual confirmation.

## Common Issue Diagnostics

### Issue 1: Gateway Fails to Start

**Troubleshooting steps:**

1. Check that the config file exists:

   ```bash
   cat ~/.openclaw/openclaw.json
   ```

2. Check whether `gateway.mode` is set:

   ```bash
   openclaw config get gateway.mode
   ```

   If not set, run:

   ```bash
   openclaw config set gateway.mode local
   ```

3. Check whether the port is in use:

   ```bash
   # macOS
   lsof -i :18789

   # Linux
   ss -ltnp | grep 18789
   ```

4. View Gateway logs:

   ```bash
   # macOS (if using launchd)
   tail -f ~/Library/Logs/openclaw-gateway.log

   # Linux (if using systemd)
   journalctl --user -u openclaw-gateway -f
   ```

### Issue 2: Authentication Failure

**Troubleshooting steps:**

1. Run doctor to check authentication health:

   ```bash
   openclaw doctor
   ```

2. Check API key environment variables:

   ```bash
   echo $ANTHROPIC_API_KEY
   echo $OPENAI_API_KEY
   ```

3. Check authentication settings in the config file:

   ```bash
   openclaw config get agents.defaults.model
   ```

4. Reconfigure authentication:
   ```bash
   openclaw configure --section models
   ```

### Issue 3: Channel Connection Failure

**Troubleshooting steps:**

1. Check channel status:

   ```bash
   openclaw channels status
   ```

2. Check channel configuration:

   ```bash
   openclaw config get channels
   ```

3. Re-login to the channel:
   ```bash
   openclaw channels login
   ```

### Issue 4: Config File Permission Problems

If the config file permissions are too broad, doctor will warn and fix them:

```bash
openclaw doctor --repair
```

Or fix manually:

```bash
chmod 600 ~/.openclaw/openclaw.json
```

### Issue 5: Service Not Running

**macOS (launchd):**

```bash
# Check service status
launchctl list | grep openclaw

# Start the service
launchctl load ~/Library/LaunchAgents/com.openclaw.gateway.plist

# Or use the OpenClaw command
openclaw gateway install
```

**Linux (systemd):**

```bash
# Check service status
systemctl --user status openclaw-gateway

# Start the service
systemctl --user start openclaw-gateway

# Enable auto-start
systemctl --user enable openclaw-gateway
```

## Troubleshooting Workflow

When a user encounters a problem, follow this process:

1. **Confirm installation status**

   ```bash
   openclaw --version
   ```

2. **Run Doctor diagnostics**

   ```bash
   openclaw doctor
   ```

3. **Check Gateway status**

   ```bash
   openclaw gateway status
   ```

4. **View logs**
   - macOS: `./scripts/clawlog.sh` or system logs
   - Linux: `journalctl --user -u openclaw-gateway`

5. **Check the config file**

   ```bash
   cat ~/.openclaw/openclaw.json
   ```

6. **If the issue persists, recommend the user:**
   - Check the latest GitHub README
   - Visit docs.openclaw.ai
   - Ask for help in the Discord community

## macOS: launchctl Environment Variable Override

If `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (or `...PASSWORD`) was run previously, that value will override the config file and may cause persistent "Unauthorized" errors.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
